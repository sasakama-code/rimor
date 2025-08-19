/**
 * 型アノテーション自動推論エンジン
 * Phase 3: 制約ソルバーを活用した自動型アノテーション推論
 * arXiv:2504.18529v2の型推論理論に基づく
 * 
 * 機能:
 * - 制約ソルバーの結果から型アノテーションを自動推論
 * - JSDoc形式の型アノテーション生成
 * - 開発者への型アノテーション提案
 * - 既存コードへの型アノテーション自動適用
 */

import * as ts from 'typescript';
import { 
  ConstraintSolver, 
  ConstraintSolutionResult, 
  TaintDomain 
} from './constraint-solver';
import { TypeConstraint, TypeBasedTaintInfo } from './type-based-flow-analyzer';
import { TaintSource } from './ast-source-detector';
import { TaintSink } from './ast-sink-detector';

/**
 * 推論された型アノテーション
 */
export interface InferredTypeAnnotation {
  /** 変数名 */
  variableName: string;
  /** 推論された汚染状態 */
  inferredTaintType: TaintDomain;
  /** 信頼度スコア */
  confidence: number;
  /** 推論根拠 */
  reasoning: string[];
  /** 位置情報 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** JSDoc形式のアノテーション */
  jsDocAnnotation: string;
  /** TypeScript形式のアノテーション */
  typeScriptAnnotation: string;
}

/**
 * 型アノテーション提案
 */
export interface TypeAnnotationSuggestion {
  /** 提案ID */
  id: string;
  /** 提案タイプ */
  type: 'add' | 'modify' | 'remove';
  /** 対象変数 */
  targetVariable: string;
  /** 現在のアノテーション */
  currentAnnotation?: string;
  /** 提案するアノテーション */
  suggestedAnnotation: string;
  /** 提案理由 */
  reason: string;
  /** 重要度 */
  priority: 'high' | 'medium' | 'low';
  /** 自動適用可能か */
  autoApplicable: boolean;
}

/**
 * 型アノテーション推論結果
 */
export interface TypeAnnotationInferenceResult {
  /** 推論されたアノテーション一覧 */
  inferredAnnotations: InferredTypeAnnotation[];
  /** 提案一覧 */
  suggestions: TypeAnnotationSuggestion[];
  /** 統計情報 */
  statistics: {
    totalVariables: number;
    annotatedVariables: number;
    inferredVariables: number;
    taintedVariables: number;
    untaintedVariables: number;
    unknownVariables: number;
    highConfidenceInferences: number;
    mediumConfidenceInferences: number;
    lowConfidenceInferences: number;
  };
  /** 推論品質評価 */
  qualityMetrics: {
    averageConfidence: number;
    coverageRatio: number;
    suggestionAcceptanceRate: number;
  };
}

/**
 * 型アノテーション自動推論エンジン
 */
export class TypeAnnotationInferrer {
  private constraintSolver: ConstraintSolver;
  private solutionResult: ConstraintSolutionResult | null = null;
  private typeInfoMap: Map<string, TypeBasedTaintInfo> = new Map();
  private sourceFile: ts.SourceFile | null = null;

  constructor() {
    this.constraintSolver = new ConstraintSolver();
  }

  /**
   * 型アノテーション推論を実行
   * @param typeConstraints 型制約一覧
   * @param typeInfoMap 型情報マップ
   * @param sources 汚染源一覧
   * @param sinks 汚染先一覧
   * @param sourceCode ソースコード
   * @param fileName ファイル名
   * @returns 推論結果
   */
  async inferTypeAnnotations(
    typeConstraints: TypeConstraint[],
    typeInfoMap: Map<string, TypeBasedTaintInfo>,
    sources: TaintSource[],
    sinks: TaintSink[],
    sourceCode: string,
    fileName: string
  ): Promise<TypeAnnotationInferenceResult> {
    this.typeInfoMap = typeInfoMap;
    
    // Sources情報をTypeInfoMapに統合
    this.integrateSources(sources);
    
    // TypeScript ソースファイルを作成
    this.sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.ES2020,
      true
    );

    // 制約ソルバーを初期化して実行
    await this.constraintSolver.initialize(typeConstraints, this.typeInfoMap, sources, sinks);
    this.solutionResult = await this.constraintSolver.solve();

    // 型アノテーションを推論
    const inferredAnnotations = await this.generateInferredAnnotations();

    // 提案を生成
    const suggestions = await this.generateSuggestions(inferredAnnotations);

    // 統計情報を計算
    const statistics = this.calculateStatistics(inferredAnnotations);

    // 品質評価を計算
    const qualityMetrics = this.calculateQualityMetrics(inferredAnnotations, suggestions);

    return {
      inferredAnnotations,
      suggestions,
      statistics,
      qualityMetrics
    };
  }

  /**
   * 推論されたアノテーションを生成
   */
  private async generateInferredAnnotations(): Promise<InferredTypeAnnotation[]> {
    if (!this.solutionResult) {
      return [];
    }

    const annotations: InferredTypeAnnotation[] = [];
    const processedVariables = new Set<string>();

    // 制約ソルバーのソリューションから推論
    for (const [variableName, inferredValue] of this.solutionResult.solution) {
      if (inferredValue === 'unknown') continue;

      const confidence = this.calculateInferenceConfidence(variableName, inferredValue);
      const reasoning = this.generateReasoningExplanation(variableName, inferredValue);
      const location = this.getVariableLocation(variableName);

      annotations.push({
        variableName,
        inferredTaintType: inferredValue,
        confidence,
        reasoning,
        location,
        jsDocAnnotation: this.generateJSDocAnnotation(inferredValue),
        typeScriptAnnotation: this.generateTypeScriptAnnotation(inferredValue)
      });
      
      processedVariables.add(variableName);
    }

    // Sources配列とTypeInfoMapから追加の推論を実行
    if (this.constraintSolver) {
      // TypeInfoMapの全変数を処理（ソリューションに含まれていない場合も含む）
      for (const [varName, typeInfo] of this.typeInfoMap) {
        if (!processedVariables.has(varName)) {
          let inferredValue: TaintDomain = 'unknown';
          let shouldInfer = false;
          
          // Source情報がある場合は tainted と推論
          if (typeInfo.sourceInfo) {
            inferredValue = 'tainted';
            shouldInfer = true;
          }
          // 既存の型アノテーションがある場合も処理対象
          else if (typeInfo.typeAnnotation?.customTaintType) {
            inferredValue = typeInfo.typeAnnotation.customTaintType as TaintDomain;
            shouldInfer = true;
          }

          if (shouldInfer && inferredValue !== 'unknown') {
            const confidence = this.calculateInferenceConfidence(varName, inferredValue);
            const reasoning = this.generateReasoningExplanation(varName, inferredValue);
            const location = this.getVariableLocation(varName);

            annotations.push({
              variableName: varName,
              inferredTaintType: inferredValue,
              confidence,
              reasoning,
              location,
              jsDocAnnotation: this.generateJSDocAnnotation(inferredValue),
              typeScriptAnnotation: this.generateTypeScriptAnnotation(inferredValue)
            });
          }
        }
      }
      
      // 外部Sourcesからの推論も追加処理（TypeInfoMapにない場合もある）
      // 特に、JSDocアノテーション付きパラメーターなど
      // これは将来の拡張で利用
    }

    return annotations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 推論信頼度を計算
   */
  private calculateInferenceConfidence(variableName: string, inferredValue: TaintDomain): number {
    const existingTypeInfo = this.typeInfoMap.get(variableName);
    let baseConfidence = 0.6; // より低いベース信頼度から開始

    // Source情報がある場合はその信頼度を基準にする
    if (existingTypeInfo?.sourceInfo) {
      baseConfidence = existingTypeInfo.sourceInfo.confidence;
    }

    // 既存の型アノテーションがある場合は信頼度を調整
    if (existingTypeInfo?.typeAnnotation) {
      baseConfidence += 0.1; // 既存アノテーションとの一致で信頼度向上
    }

    // 制約ソルバーの推論ステップ数による調整
    if (this.solutionResult) {
      const relatedSteps = this.solutionResult.inferenceSteps.filter(
        step => step.variable === variableName
      );
      
      if (relatedSteps.length > 0) {
        baseConfidence += Math.min(relatedSteps.length * 0.02, 0.1);
      }
    }

    // Source/Sink変数は少し信頼度向上
    if (inferredValue === 'tainted') {
      baseConfidence += 0.02;
    }

    return Math.min(baseConfidence, 1.0);
  }

  /**
   * 推論根拠の説明を生成
   */
  private generateReasoningExplanation(variableName: string, inferredValue: TaintDomain): string[] {
    const reasoning: string[] = [];

    if (!this.solutionResult) {
      return reasoning;
    }

    // 制約ソルバーの推論ステップから根拠を抽出
    const relatedSteps = this.solutionResult.inferenceSteps.filter(
      step => step.variable === variableName
    );

    for (const step of relatedSteps) {
      reasoning.push(step.reasoning);
    }

    // 既存の型情報との関係
    const existingTypeInfo = this.typeInfoMap.get(variableName);
    if (existingTypeInfo?.typeAnnotation) {
      reasoning.push(`既存の型アノテーション（${existingTypeInfo.typeAnnotation.customTaintType}）と一致`);
    }

    // 一般的な推論パターン
    switch (inferredValue) {
      case 'tainted':
        reasoning.push('ユーザー入力やネットワークデータなど信頼できないソースから派生');
        break;
      case 'untainted':
        reasoning.push('安全なデータソースまたは適切にサニタイズされたデータ');
        break;
      case 'sanitized':
        reasoning.push('明示的にサニタイズ処理が適用されたデータ');
        break;
    }

    return reasoning;
  }

  /**
   * 変数の位置情報を取得
   */
  private getVariableLocation(variableName: string): InferredTypeAnnotation['location'] {
    if (!this.sourceFile) {
      return { file: 'unknown', line: 0, column: 0 };
    }

    // AST を走査して変数宣言を探す
    let variableLocation: InferredTypeAnnotation['location'] = {
      file: this.sourceFile.fileName,
      line: 0,
      column: 0
    };

    const findVariable = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && 
          node.name && 
          ts.isIdentifier(node.name) && 
          node.name.text === variableName) {
        
        const start = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
        variableLocation = {
          file: this.sourceFile!.fileName,
          line: start.line + 1,
          column: start.character + 1
        };
      }

      if (ts.isParameter(node) && 
          node.name && 
          ts.isIdentifier(node.name) && 
          node.name.text === variableName) {
        
        const start = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
        variableLocation = {
          file: this.sourceFile!.fileName,
          line: start.line + 1,
          column: start.character + 1
        };
      }

      ts.forEachChild(node, findVariable);
    };

    findVariable(this.sourceFile);
    return variableLocation;
  }

  /**
   * JSDoc形式のアノテーションを生成
   */
  private generateJSDocAnnotation(taintType: TaintDomain): string {
    switch (taintType) {
      case 'tainted':
        return '@tainted';
      case 'untainted':
        return '@untainted';
      case 'sanitized':
        return '@sanitized';
      default:
        return '@unknown';
    }
  }

  /**
   * TypeScript形式のアノテーションを生成
   */
  private generateTypeScriptAnnotation(taintType: TaintDomain): string {
    switch (taintType) {
      case 'tainted':
        return 'Tainted<string>';
      case 'untainted':
        return 'Untainted<string>';
      case 'sanitized':
        return 'Sanitized<string>';
      default:
        return 'string';
    }
  }

  /**
   * 提案を生成
   */
  private async generateSuggestions(
    inferredAnnotations: InferredTypeAnnotation[]
  ): Promise<TypeAnnotationSuggestion[]> {
    const suggestions: TypeAnnotationSuggestion[] = [];
    let suggestionId = 1;

    for (const annotation of inferredAnnotations) {
      const existingTypeInfo = this.typeInfoMap.get(annotation.variableName);
      
      // 既存のアノテーションがない場合は追加提案
      if (!existingTypeInfo?.typeAnnotation) {
        suggestions.push({
          id: `add_${suggestionId++}`,
          type: 'add',
          targetVariable: annotation.variableName,
          suggestedAnnotation: annotation.jsDocAnnotation,
          reason: `推論結果に基づく型アノテーション追加（信頼度: ${(annotation.confidence * 100).toFixed(1)}%）`,
          priority: annotation.confidence > 0.85 ? 'high' : annotation.confidence > 0.7 ? 'medium' : 'low',
          autoApplicable: annotation.confidence > 0.85
        });
      }
      // 既存のアノテーションと異なる場合は修正提案
      else if (existingTypeInfo.typeAnnotation.customTaintType !== annotation.inferredTaintType) {
        suggestions.push({
          id: `modify_${suggestionId++}`,
          type: 'modify',
          targetVariable: annotation.variableName,
          currentAnnotation: existingTypeInfo.typeAnnotation.customTaintType,
          suggestedAnnotation: annotation.jsDocAnnotation,
          reason: `制約解析結果との不一致を修正（${existingTypeInfo.typeAnnotation.customTaintType} → ${annotation.inferredTaintType}）`,
          priority: annotation.confidence > 0.9 ? 'high' : 'medium',
          autoApplicable: false // 修正は慎重に
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 統計情報を計算
   */
  private calculateStatistics(
    inferredAnnotations: InferredTypeAnnotation[]
  ): TypeAnnotationInferenceResult['statistics'] {
    const totalVariables = this.typeInfoMap.size;
    const annotatedVariables = Array.from(this.typeInfoMap.values())
      .filter(info => info.typeAnnotation).length;
    
    const inferredVariables = inferredAnnotations.length;
    const taintedVariables = inferredAnnotations.filter(a => a.inferredTaintType === 'tainted').length;
    const untaintedVariables = inferredAnnotations.filter(a => 
      a.inferredTaintType === 'untainted' || a.inferredTaintType === 'sanitized'
    ).length;
    const unknownVariables = totalVariables - inferredVariables;

    const highConfidenceInferences = inferredAnnotations.filter(a => a.confidence > 0.8).length;
    const mediumConfidenceInferences = inferredAnnotations.filter(a => 
      a.confidence > 0.6 && a.confidence <= 0.8
    ).length;
    const lowConfidenceInferences = inferredAnnotations.filter(a => a.confidence <= 0.6).length;

    return {
      totalVariables,
      annotatedVariables,
      inferredVariables,
      taintedVariables,
      untaintedVariables,
      unknownVariables,
      highConfidenceInferences,
      mediumConfidenceInferences,
      lowConfidenceInferences
    };
  }

  /**
   * 品質評価を計算
   */
  private calculateQualityMetrics(
    inferredAnnotations: InferredTypeAnnotation[],
    suggestions: TypeAnnotationSuggestion[]
  ): TypeAnnotationInferenceResult['qualityMetrics'] {
    const averageConfidence = inferredAnnotations.length > 0
      ? inferredAnnotations.reduce((sum, a) => sum + a.confidence, 0) / inferredAnnotations.length
      : 0;

    const coverageRatio = this.typeInfoMap.size > 0
      ? inferredAnnotations.length / this.typeInfoMap.size
      : 0;

    // 自動適用可能な提案の割合を受け入れ率の近似として使用
    const suggestionAcceptanceRate = suggestions.length > 0
      ? suggestions.filter(s => s.autoApplicable).length / suggestions.length
      : 0;

    return {
      averageConfidence,
      coverageRatio,
      suggestionAcceptanceRate
    };
  }

  /**
   * アノテーションをソースコードに適用
   * @param sourceCode 元のソースコード
   * @param suggestions 適用する提案一覧
   * @returns 修正されたソースコード
   */
  async applyAnnotations(
    sourceCode: string,
    suggestions: TypeAnnotationSuggestion[]
  ): Promise<string> {
    let modifiedCode = sourceCode;
    const lines = sourceCode.split('\n');

    for (const suggestion of suggestions) {
      if (!suggestion.autoApplicable) continue;

      const location = this.getVariableLocation(suggestion.targetVariable);
      if (location.line > 0 && location.line <= lines.length) {
        const lineIndex = location.line - 1;
        const line = lines[lineIndex];

        // 変数宣言またはパラメーターの前にJSDocコメントを追加
        const indent = line.match(/^(\s*)/)?.[1] || '';
        const jsDocComment = `${indent}/** ${suggestion.suggestedAnnotation} */`;
        
        // JSDocコメントを挿入
        if (suggestion.type === 'add') {
          lines.splice(lineIndex, 0, jsDocComment);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * 推論結果のレポートを生成
   */
  generateInferenceReport(result: TypeAnnotationInferenceResult): string {
    const report = [];
    
    report.push('# 型アノテーション推論レポート\n');
    
    // 統計情報
    report.push('## 統計情報');
    report.push(`- 総変数数: ${result.statistics.totalVariables}`);
    report.push(`- 既存アノテーション数: ${result.statistics.annotatedVariables}`);
    report.push(`- 推論成功数: ${result.statistics.inferredVariables}`);
    report.push(`- Tainted変数: ${result.statistics.taintedVariables}`);
    report.push(`- Untainted変数: ${result.statistics.untaintedVariables}`);
    report.push('');

    // 品質評価
    report.push('## 品質評価');
    report.push(`- 平均信頼度: ${(result.qualityMetrics.averageConfidence * 100).toFixed(1)}%`);
    report.push(`- カバレッジ率: ${(result.qualityMetrics.coverageRatio * 100).toFixed(1)}%`);
    report.push(`- 自動適用率: ${(result.qualityMetrics.suggestionAcceptanceRate * 100).toFixed(1)}%`);
    report.push('');

    // 高信頼度推論
    report.push('## 高信頼度推論結果');
    const highConfidenceAnnotations = result.inferredAnnotations.filter(a => a.confidence > 0.8);
    for (const annotation of highConfidenceAnnotations) {
      report.push(`- \`${annotation.variableName}\`: ${annotation.jsDocAnnotation} (信頼度: ${(annotation.confidence * 100).toFixed(1)}%)`);
    }
    report.push('');

    // 提案
    report.push('## 推奨アクション');
    const highPrioritySuggestions = result.suggestions.filter(s => s.priority === 'high');
    for (const suggestion of highPrioritySuggestions) {
      report.push(`- [${suggestion.priority.toUpperCase()}] ${suggestion.targetVariable}: ${suggestion.reason}`);
    }

    return report.join('\n');
  }

  /**
   * Sources情報をTypeInfoMapに統合
   */
  private integrateSources(sources: TaintSource[]): void {
    for (const source of sources) {
      const existingTypeInfo = this.typeInfoMap.get(source.variableName);
      
      if (existingTypeInfo) {
        // 既存の型情報にSource情報を追加
        existingTypeInfo.sourceInfo = source;
      } else {
        // 新しい型情報を作成
        this.typeInfoMap.set(source.variableName, {
          symbol: {} as any, // ダミーシンボル
          taintStatus: 'tainted',
          sourceInfo: source,
          typeConstraints: []
        });
      }
    }
  }
}