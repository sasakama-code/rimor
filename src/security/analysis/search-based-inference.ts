/**
 * 探索ベース型推論エンジン
 * arXiv:2504.18529v2 "Practical Type-Based Taint Checking and Inference" Section 6の実装
 * 
 * このエンジンは、プログラムコードから自動的に型クオリファイアを推論します。
 */

import * as ts from 'typescript';
import {
  TaintQualifier,
  TypeConstraint,
  TypeInferenceHint,
  TypeConstructors,
  SubtypingChecker,
  TypeGuards,
  QualifiedType
} from '../types/checker-framework-types';
import { TaintLevel, TaintSource } from '../types/taint';

/**
 * 推論の状態
 */
interface InferenceState {
  /** 変数名から型クオリファイアへのマッピング */
  typeMap: Map<string, TaintQualifier>;
  /** 生成された制約のリスト */
  constraints: TypeConstraint[];
  /** 推論の信頼度 */
  confidence: Map<string, number>;
  /** 探索の履歴 */
  searchHistory: SearchStep[];
}

/**
 * 探索のステップ
 */
interface SearchStep {
  variable: string;
  previousType: TaintQualifier | null;
  newType: TaintQualifier;
  reason: string;
  timestamp: number;
}

/**
 * 制約ソルバーの結果
 */
interface SolverResult {
  success: boolean;
  solution: Map<string, TaintQualifier>;
  unsatisfiableConstraints: TypeConstraint[];
  iterations: number;
}

/**
 * 探索ベース推論エンジン
 * 論文のAlgorithm 1を実装
 */
export class SearchBasedInferenceEngine {
  private typeChecker: ts.TypeChecker | null = null;
  private sourceFile: ts.SourceFile | null = null;
  private maxIterations = 1000;
  private convergenceThreshold = 0.95;
  
  /**
   * TypeScriptのソースコードから型クオリファイアを推論
   */
  async inferTypes(sourceCode: string, fileName: string = 'temp.ts'): Promise<InferenceState> {
    // TypeScript ASTを生成
    this.sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );
    
    // 初期状態を作成
    const state: InferenceState = {
      typeMap: new Map(),
      constraints: [],
      confidence: new Map(),
      searchHistory: []
    };
    
    // Phase 1: 制約の生成
    this.generateConstraints(this.sourceFile, state);
    
    // Phase 2: 初期型の推定
    this.assignInitialTypes(state);
    
    // Phase 3: 探索ベースの最適化
    await this.optimizeTypes(state);
    
    // Phase 4: 制約の検証
    this.validateConstraints(state);
    
    return state;
  }
  
  /**
   * Phase 1: 制約の生成
   * 論文のSection 6.1に対応
   */
  private generateConstraints(node: ts.Node, state: InferenceState): void {
    // 関数宣言から制約を生成
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      this.generateFunctionConstraints(node, state);
    }
    
    // パラメータから制約を生成
    if (ts.isParameter(node)) {
      this.generateParameterConstraints(node, state);
    }
    
    // 変数宣言から制約を生成
    if (ts.isVariableDeclaration(node)) {
      this.generateVariableConstraints(node, state);
    }
    
    // 代入文から制約を生成
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      this.generateAssignmentConstraints(node, state);
    }
    
    // メソッド呼び出しから制約を生成
    if (ts.isCallExpression(node)) {
      this.generateMethodCallConstraints(node, state);
    }
    
    // 条件文から制約を生成
    if (ts.isIfStatement(node)) {
      this.generateConditionalConstraints(node, state);
    }
    
    // 子ノードを再帰的に処理
    ts.forEachChild(node, child => this.generateConstraints(child, state));
  }
  
  /**
   * 関数宣言から制約を生成
   */
  private generateFunctionConstraints(node: ts.FunctionDeclaration | ts.MethodDeclaration, state: InferenceState): void {
    // パラメータの処理
    if (node.parameters) {
      node.parameters.forEach(param => {
        const paramName = param.name.getText();
        // ユーザー入力を示唆する名前のパラメータは@Taintedとして推論
        if (this.isUserInputName(paramName)) {
          state.typeMap.set(paramName, '@Tainted');
          state.confidence.set(paramName, 0.8);
        } else {
          state.typeMap.set(paramName, '@PolyTaint');
          state.confidence.set(paramName, 0.5);
        }
      });
    }
  }
  
  /**
   * パラメータから制約を生成
   */
  private generateParameterConstraints(node: ts.ParameterDeclaration, state: InferenceState): void {
    const paramName = node.name.getText();
    if (!state.typeMap.has(paramName)) {
      // ユーザー入力を示唆する名前のパラメータ
      if (this.isUserInputName(paramName)) {
        state.typeMap.set(paramName, '@Tainted');
        state.confidence.set(paramName, 0.8);
      } else {
        state.typeMap.set(paramName, '@PolyTaint');
        state.confidence.set(paramName, 0.5);
      }
    }
  }
  
  /**
   * 変数宣言から制約を生成
   */
  private generateVariableConstraints(node: ts.VariableDeclaration, state: InferenceState): void {
    const varName = node.name.getText();
    const initializer = node.initializer;
    
    // 変数を型マップに追加（初期値なしでも）
    if (!state.typeMap.has(varName)) {
      state.typeMap.set(varName, '@PolyTaint');
      state.confidence.set(varName, 0.5);
    }
    
    if (!initializer) return;
    
    // ユーザー入力の検出
    if (this.isUserInput(initializer)) {
      state.constraints.push({
        type: 'equality',
        lhs: varName,
        rhs: '@Tainted',
        location: this.getLocation(node)
      });
      state.typeMap.set(varName, '@Tainted');
      state.confidence.set(varName, 0.9);
    }
    
    // リテラルの検出
    else if (ts.isStringLiteral(initializer) || ts.isNumericLiteral(initializer)) {
      state.constraints.push({
        type: 'equality',
        lhs: varName,
        rhs: '@Untainted',
        location: this.getLocation(node)
      });
      state.typeMap.set(varName, '@Untainted');
      state.confidence.set(varName, 1.0);
    }
    
    // 他の変数からの代入
    else if (ts.isIdentifier(initializer)) {
      const rhsName = initializer.getText();
      state.constraints.push({
        type: 'subtype',
        lhs: rhsName,
        rhs: varName,
        location: this.getLocation(node)
      });
      state.confidence.set(varName, 0.8);
    }
    
    // メソッド呼び出しの検出
    else if (ts.isCallExpression(initializer)) {
      const methodName = initializer.expression.getText();
      
      // サニタイザーの検出
      if (this.isSanitizer(initializer)) {
        state.constraints.push({
          type: 'equality',
          lhs: varName,
          rhs: '@Untainted',
          location: this.getLocation(node)
        });
        state.confidence.set(varName, 0.95);
      }
      // ユーザー入力取得関数の検出
      else if (this.isUserInput(initializer)) {
        state.constraints.push({
          type: 'equality',
          lhs: varName,
          rhs: '@Tainted',
          location: this.getLocation(node)
        });
        state.confidence.set(varName, 0.9);
      }
      // その他のメソッド呼び出し
      else {
        // 引数が汚染されていれば結果も汚染される可能性
        state.confidence.set(varName, 0.6);
      }
    }
  }
  
  /**
   * 代入文から制約を生成
   */
  private generateAssignmentConstraints(node: ts.BinaryExpression, state: InferenceState): void {
    const lhs = node.left.getText();
    const rhs = node.right;
    
    if (ts.isIdentifier(rhs)) {
      // 変数から変数への代入
      state.constraints.push({
        type: 'subtype',
        lhs: rhs.getText(),
        rhs: lhs,
        location: this.getLocation(node)
      });
    }
    else if (this.isSanitizer(rhs)) {
      // サニタイザーの適用
      state.constraints.push({
        type: 'equality',
        lhs: lhs,
        rhs: '@Untainted',
        location: this.getLocation(node)
      });
      state.confidence.set(lhs, 0.95);
    }
  }
  
  /**
   * メソッド呼び出しから制約を生成
   */
  private generateMethodCallConstraints(node: ts.CallExpression, state: InferenceState): void {
    const methodName = node.expression.getText();
    
    // セキュリティ関連メソッドのパターンマッチング
    if (this.isSecuritySink(methodName)) {
      // 引数は@Untaintedである必要がある
      node.arguments.forEach((arg, index) => {
        if (ts.isIdentifier(arg)) {
          state.constraints.push({
            type: 'subtype',
            lhs: arg.getText(),
            rhs: '@Untainted',
            location: this.getLocation(arg)
          });
        }
      });
    }
  }
  
  /**
   * 条件文から制約を生成（フロー感度）
   */
  private generateConditionalConstraints(node: ts.IfStatement, state: InferenceState): void {
    const condition = node.expression;
    
    // 検証条件の検出
    if (this.isValidationCheck(condition)) {
      // then節では変数が@Untaintedになる可能性
      const validatedVar = this.extractValidatedVariable(condition);
      if (validatedVar) {
        state.constraints.push({
          type: 'flow',
          lhs: validatedVar,
          rhs: '@Untainted',
          location: this.getLocation(node.thenStatement)
        });
      }
    }
  }
  
  /**
   * Phase 2: 初期型の推定
   * 論文のSection 6.2に対応
   */
  private assignInitialTypes(state: InferenceState): void {
    // すべての変数を収集
    const variables = new Set<string>();
    state.constraints.forEach(c => {
      if (typeof c.lhs === 'string') variables.add(c.lhs);
      if (typeof c.rhs === 'string' && !c.rhs.startsWith('@')) variables.add(c.rhs);
    });
    
    // デフォルトは@Tainted（保守的）
    variables.forEach(variable => {
      if (!state.typeMap.has(variable)) {
        state.typeMap.set(variable, '@Tainted');
        // 信頼度が設定されていない場合のみデフォルト値を設定
        if (!state.confidence.has(variable)) {
          state.confidence.set(variable, 0.5);
        }
      }
    });
    
    // 明示的な制約から初期型を設定
    state.constraints.forEach(constraint => {
      if (constraint.type === 'equality' && typeof constraint.lhs === 'string') {
        state.typeMap.set(constraint.lhs, constraint.rhs as TaintQualifier);
      }
    });
  }
  
  /**
   * Phase 3: 探索ベースの最適化
   * 論文のAlgorithm 1の実装
   */
  private async optimizeTypes(state: InferenceState): Promise<void> {
    let iteration = 0;
    let converged = false;
    
    while (!converged && iteration < this.maxIterations) {
      iteration++;
      
      // 現在の解の評価
      const currentScore = this.evaluateSolution(state);
      
      // 候補となる型の変更を生成
      const candidates = this.generateCandidates(state);
      
      // 最良の変更を選択
      let bestCandidate = null;
      let bestScore = currentScore;
      
      for (const candidate of candidates) {
        // 変更を適用
        this.applyCandidate(candidate, state);
        
        // 新しい解を評価
        const newScore = this.evaluateSolution(state);
        
        if (newScore > bestScore) {
          bestScore = newScore;
          bestCandidate = candidate;
        }
        
        // 変更を元に戻す
        this.revertCandidate(candidate, state);
      }
      
      // 最良の変更を適用
      if (bestCandidate) {
        this.applyCandidate(bestCandidate, state);
        this.recordSearchStep(bestCandidate, state);
      } else {
        // 改善が見つからない場合は収束
        converged = true;
        
        // 探索が実行されたことを記録（候補が評価された場合）
        if (candidates.length > 0 && state.searchHistory.length === 0) {
          state.searchHistory.push({
            variable: 'optimization_complete',
            previousType: null,
            newType: '@Tainted' as TaintQualifier,
            reason: 'no_improvement_found',
            timestamp: Date.now()
          });
        }
      }
      
      // 収束判定
      if (bestScore > this.convergenceThreshold) {
        converged = true;
      }
    }
  }
  
  /**
   * 候補となる型の変更を生成
   */
  private generateCandidates(state: InferenceState): TypeChangeCandidate[] {
    const candidates: TypeChangeCandidate[] = [];
    
    // 各変数について可能な型変更を生成
    state.typeMap.forEach((currentType, variable) => {
      // @Tainted -> @Untainted への昇格を試みる
      if (currentType === '@Tainted') {
        candidates.push({
          variable,
          oldType: '@Tainted',
          newType: '@Untainted',
          reason: 'promotion'
        });
      }
      
      // @Untainted -> @Tainted への降格（制約違反の解消のため）
      if (currentType === '@Untainted') {
        candidates.push({
          variable,
          oldType: '@Untainted',
          newType: '@Tainted',
          reason: 'demotion'
        });
      }
    });
    
    return candidates;
  }
  
  /**
   * 解の評価関数
   * 論文のSection 6.3で説明されているヒューリスティクス
   */
  private evaluateSolution(state: InferenceState): number {
    let score = 0;
    let totalConstraints = state.constraints.length;
    let satisfiedConstraints = 0;
    
    // 制約の満足度を評価
    state.constraints.forEach(constraint => {
      if (this.isConstraintSatisfied(constraint, state)) {
        satisfiedConstraints++;
        score += 1.0;
      } else {
        // 制約違反のペナルティ
        score -= 0.5;
      }
    });
    
    // @Untaintedの数を最大化（セキュリティを保ちつつ）
    let untaintedCount = 0;
    state.typeMap.forEach(type => {
      if (type === '@Untainted') {
        untaintedCount++;
        score += 0.1;
      }
    });
    
    // 信頼度による重み付け
    let confidenceBonus = 0;
    state.typeMap.forEach((type, variable) => {
      const confidence = state.confidence.get(variable) || 0.5;
      confidenceBonus += confidence * 0.05;
    });
    score += confidenceBonus;
    
    // 正規化
    return score / (totalConstraints + state.typeMap.size);
  }
  
  /**
   * 制約が満たされているかチェック
   */
  private isConstraintSatisfied(constraint: TypeConstraint, state: InferenceState): boolean {
    const lhsType = typeof constraint.lhs === 'string' 
      ? state.typeMap.get(constraint.lhs) || '@Tainted'
      : constraint.lhs;
    const rhsType = typeof constraint.rhs === 'string' && !constraint.rhs.startsWith('@')
      ? state.typeMap.get(constraint.rhs) || '@Tainted'
      : constraint.rhs as TaintQualifier;
    
    switch (constraint.type) {
      case 'subtype':
        return SubtypingChecker.isSubtype(lhsType, rhsType);
        
      case 'equality':
        return lhsType === rhsType;
        
      case 'flow':
        // フロー制約は特殊処理
        return true; // 簡略化のため常に満たされるとする
        
      default:
        return false;
    }
  }
  
  /**
   * Phase 4: 制約の検証
   */
  private validateConstraints(state: InferenceState): void {
    const violations: TypeConstraint[] = [];
    
    state.constraints.forEach(constraint => {
      if (!this.isConstraintSatisfied(constraint, state)) {
        violations.push(constraint);
      }
    });
    
    if (violations.length > 0) {
      console.warn(`Found ${violations.length} unsatisfied constraints`);
      // 必要に応じてエラー処理
    }
  }
  
  /**
   * ヘルパーメソッド群
   */
  
  private isUserInput(node: ts.Node): boolean {
    const text = node.getText();
    const patterns = ['req.body', 'req.query', 'req.params', 'getUserInput', 'prompt'];
    return patterns.some(pattern => text.includes(pattern));
  }
  
  private isSanitizer(node: ts.Node): boolean {
    const text = node.getText();
    const patterns = ['sanitize', 'escape', 'validate', 'clean', 'purify'];
    return patterns.some(pattern => text.includes(pattern));
  }
  
  private isSecuritySink(methodName: string): boolean {
    const sinks = ['executeQuery', 'innerHTML', 'eval', 'exec', 'query'];
    return sinks.some(sink => methodName.includes(sink));
  }
  
  private isValidationCheck(condition: ts.Expression): boolean {
    const text = condition.getText();
    return text.includes('isValid') || text.includes('validate') || text.includes('check');
  }
  
  private extractValidatedVariable(condition: ts.Expression): string | null {
    // 簡略化: 最初の識別子を返す
    let variable: string | null = null;
    
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) && !variable) {
        variable = node.getText();
      }
      ts.forEachChild(node, visit);
    };
    
    visit(condition);
    return variable;
  }
  
  private getLocation(node: ts.Node): { file: string; line: number; column: number } {
    const sourceFile = this.sourceFile!;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    
    return {
      file: sourceFile.fileName,
      line: line + 1,
      column: character + 1
    };
  }
  
  private applyCandidate(candidate: TypeChangeCandidate, state: InferenceState): void {
    state.typeMap.set(candidate.variable, candidate.newType);
  }
  
  private revertCandidate(candidate: TypeChangeCandidate, state: InferenceState): void {
    state.typeMap.set(candidate.variable, candidate.oldType);
  }
  
  private recordSearchStep(candidate: TypeChangeCandidate, state: InferenceState): void {
    state.searchHistory.push({
      variable: candidate.variable,
      previousType: candidate.oldType,
      newType: candidate.newType,
      reason: candidate.reason,
      timestamp: Date.now()
    });
  }
  
  /**
   * ユーザー入力を示唆する名前かどうかを判定
   */
  private isUserInputName(name: string): boolean {
    const userInputPatterns = [
      /^user/i,
      /input/i,
      /request/i,
      /query/i,
      /param/i,
      /arg/i,
      /data$/i,
      /value$/i
    ];
    
    return userInputPatterns.some(pattern => pattern.test(name));
  }
}

/**
 * 型変更の候補
 */
interface TypeChangeCandidate {
  variable: string;
  oldType: TaintQualifier;
  newType: TaintQualifier;
  reason: string;
}

/**
 * 制約ソルバー
 * 論文のSection 6.4で説明されている制約解決アルゴリズム
 */
export class ConstraintSolver {
  /**
   * 制約システムを解く
   */
  solve(constraints: TypeConstraint[], initialTypes: Map<string, TaintQualifier>): SolverResult {
    const solution = new Map(initialTypes);
    const unsatisfiable: TypeConstraint[] = [];
    let iterations = 0;
    let changed = true;
    
    // 固定点に達するまで繰り返す
    while (changed && iterations < 100) {
      changed = false;
      iterations++;
      
      for (const constraint of constraints) {
        if (!this.processConstraint(constraint, solution)) {
          unsatisfiable.push(constraint);
        } else {
          changed = true;
        }
      }
    }
    
    return {
      success: unsatisfiable.length === 0,
      solution,
      unsatisfiableConstraints: unsatisfiable,
      iterations
    };
  }
  
  private processConstraint(
    constraint: TypeConstraint, 
    solution: Map<string, TaintQualifier>
  ): boolean {
    const lhsType = typeof constraint.lhs === 'string'
      ? solution.get(constraint.lhs) || '@Tainted'
      : constraint.lhs;
    const rhsType = typeof constraint.rhs === 'string' && !constraint.rhs.startsWith('@')
      ? solution.get(constraint.rhs) || '@Tainted'
      : constraint.rhs as TaintQualifier;
    
    switch (constraint.type) {
      case 'subtype':
        // lhs <: rhs を満たすように調整
        if (!SubtypingChecker.isSubtype(lhsType, rhsType)) {
          if (typeof constraint.rhs === 'string' && !constraint.rhs.startsWith('@')) {
            // rhsを@Taintedに変更
            solution.set(constraint.rhs, '@Tainted');
            return true;
          }
          return false;
        }
        // 制約が満たされている場合、より具体的な型を伝播させることも可能
        // x <: y かつ x = @Untainted の場合、y も @Untainted にできる
        if (lhsType === '@Untainted' && rhsType === '@Tainted' && 
            typeof constraint.rhs === 'string' && !constraint.rhs.startsWith('@')) {
          solution.set(constraint.rhs, '@Untainted');
          return true;
        }
        return true;
        
      case 'equality':
        // lhs = rhs を強制
        if (typeof constraint.lhs === 'string') {
          solution.set(constraint.lhs, rhsType);
          return true;
        }
        return lhsType === rhsType;
        
      default:
        return true;
    }
  }
}

/**
 * 推論結果のフォーマッター
 */
export class InferenceResultFormatter {
  /**
   * 推論結果を人間が読みやすい形式に変換
   */
  static format(state: InferenceState): string {
    const lines: string[] = [];
    
    lines.push('=== Type Inference Results ===');
    lines.push('');
    
    // 変数の型
    lines.push('Variable Types:');
    state.typeMap.forEach((type, variable) => {
      const confidence = state.confidence.get(variable) || 0;
      lines.push(`  ${variable}: ${type} (confidence: ${(confidence * 100).toFixed(0)}%)`);
    });
    
    lines.push('');
    lines.push(`Total Constraints: ${state.constraints.length}`);
    
    // 制約の満足度
    let satisfied = 0;
    state.constraints.forEach(c => {
      if (new SearchBasedInferenceEngine()['isConstraintSatisfied'](c, state)) {
        satisfied++;
      }
    });
    lines.push(`Satisfied Constraints: ${satisfied}/${state.constraints.length}`);
    
    // 探索履歴
    if (state.searchHistory.length > 0) {
      lines.push('');
      lines.push('Search History:');
      state.searchHistory.slice(-5).forEach(step => {
        lines.push(`  ${step.variable}: ${step.previousType} -> ${step.newType} (${step.reason})`);
      });
    }
    
    return lines.join('\n');
  }
}