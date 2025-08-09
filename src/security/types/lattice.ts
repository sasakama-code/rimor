/**
 * 型ベースセキュリティ解析 - セキュリティ格子システム
 * Dorothy Denningの格子理論を実装し、セキュリティ不変条件を管理
 */

import {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintMetadata,
  TaintLattice
} from './taint';
import {
  SecurityType,
  TestStatement,
  Variable,
  SecurityIssue,
  PotentialVulnerability
} from './security';
import {
  SeverityLevel
} from '../../types/common-types';
import {
  Position,
  FlowPath
} from './flow-types';

/**
 * セキュリティ格子の実装
 * Dorothy Denning (1976) の格子モデルに基づく
 */
export class SecurityLattice {
  private lattice: Map<string, TaintLevel> = new Map();
  private metadata: Map<string, TaintMetadata> = new Map();

  /**
   * 変数の汚染レベルを設定
   */
  setTaintLevel(variable: string, level: TaintLevel, metadata?: TaintMetadata): void {
    this.lattice.set(variable, level);
    if (metadata) {
      this.metadata.set(variable, metadata);
    }
  }

  /**
   * 変数の汚染レベルを取得
   */
  getTaintLevel(variable: string): TaintLevel {
    return this.lattice.get(variable) ?? 'untainted';
  }

  /**
   * 変数のメタデータを取得
   */
  getMetadata(variable: string): TaintMetadata | undefined {
    return this.metadata.get(variable);
  }

  /**
   * 格子の結合演算（join）
   */
  join(a: TaintLevel, b: TaintLevel): TaintLevel {
    return TaintLattice.join(a, b);
  }

  /**
   * 格子の交わり演算（meet）
   */
  meet(a: TaintLevel, b: TaintLevel): TaintLevel {
    return TaintLattice.meet(a, b);
  }

  /**
   * 単調性を保証する転送関数
   * Volpano-Smith-Irvine型システムの転送関数を実装
   */
  transferFunction(stmt: TestStatement, input: TaintLevel): TaintLevel {
    switch (stmt.type) {
      case 'sanitizer':
        // サニタイザー適用 - 汚染レベルを下げる
        return 'untainted';

      case 'userInput':
        // ユーザー入力 - 最高レベルの汚染
        return 'tainted';

      case 'assignment':
        // 代入 - 右辺の汚染を左辺に伝播
        if (stmt.rhs) {
          const rhsTaint = this.evaluateExpression(stmt.rhs);
          return this.join(input, rhsTaint);
        }
        return input;

      case 'methodCall':
        // メソッド呼び出し - 引数の汚染を考慮
        if (stmt.method && this.isSanitizer(stmt.method)) {
          return 'untainted';
        }
        return this.propagateMethodTaint(stmt, input);

      case 'assertion':
        // アサーション - セキュリティチェックが必要
        return this.validateAssertionSecurity(stmt, input);

      default:
        // 保守的な伝播
        return input;
    }
  }

  /**
   * 式の汚染レベルを評価
   */
  private evaluateExpression(expression: string): TaintLevel {
    // 簡単な式解析（実際の実装ではASTパースが必要）
    const variables = this.extractVariables(expression);
    if (variables.length === 0) {
      return 'untainted';
    }

    // すべての変数の汚染レベルを結合
    const untainted: TaintLevel = 'untainted';
    return variables.reduce<TaintLevel>(
      (acc, variable) => this.join(acc, this.getTaintLevel(variable)),
      untainted
    );
  }

  /**
   * 変数を抽出（簡易実装）
   */
  private extractVariables(expression: string): string[] {
    // 実際の実装では適切な字句解析が必要
    const matches = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    return matches.filter(match => !this.isKeyword(match));
  }

  /**
   * キーワードかどうかを判定
   */
  private isKeyword(word: string): boolean {
    const keywords = ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return'];
    return keywords.includes(word);
  }

  /**
   * サニタイザーかどうかを判定
   */
  private isSanitizer(methodName: string): boolean {
    const sanitizers = [
      'escape', 'sanitize', 'validate', 'clean', 'filter',
      'htmlEscape', 'sqlEscape', 'jsEscape', 'urlEncode'
    ];
    return sanitizers.some(sanitizer => 
      methodName.toLowerCase().includes(sanitizer.toLowerCase())
    );
  }

  /**
   * メソッド呼び出しの汚染伝播
   */
  private propagateMethodTaint(stmt: TestStatement, input: TaintLevel): TaintLevel {
    if (!stmt.arguments) {
      return input;
    }

    // 引数の最大汚染レベルを取得
    const argTaints = stmt.arguments.map(arg => 
      typeof arg === 'string' ? this.evaluateExpression(arg) : 'untainted'
    );

    const maxArgTaint = argTaints.reduce(
      (max, taint) => this.join(max, taint),
      'untainted' as TaintLevel
    );

    return this.join(input, maxArgTaint);
  }

  /**
   * アサーションのセキュリティ検証
   */
  private validateAssertionSecurity(stmt: TestStatement, input: TaintLevel): TaintLevel {
    if (!stmt.actual) {
      return input;
    }

    const actualTaint = this.evaluateExpression(stmt.actual);
    
    // 汚染されたデータを直接アサートしている場合は警告
    if (actualTaint >= 'tainted' && !stmt.isNegativeAssertion) {
      // セキュリティ問題として記録（実際の実装では適切なロギングが必要）
      console.warn(`Potentially unsafe assertion: testing tainted data at line ${stmt.location.line}`);
    }

    return this.join(input, actualTaint);
  }

  /**
   * セキュリティ不変条件の検証
   */
  verifySecurityInvariants(): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const [variable, taintLevel] of this.lattice.entries()) {
      const metadata = this.metadata.get(variable);
      if (!metadata) continue;

      // 汚染されたデータがサニタイズされずにシンクに到達していないかチェック
      if (this.reachesSecuritySink(variable, metadata) && 
          taintLevel >= 'tainted') {
        violations.push({
          type: 'unsanitized-taint-flow',
          severity: this.calculateSeverity(taintLevel, metadata),
          message: `Unsanitized taint flow detected for variable ${variable}`,
          variable,
          taintLevel,
          metadata,
          suggestedFix: this.generateSanitizationSuggestion(metadata)
        });
      }
    }

    return violations;
  }

  /**
   * セキュリティシンクに到達するかどうかを判定
   */
  private reachesSecuritySink(variable: string, metadata: TaintMetadata): boolean {
    // 実装では、データフローグラフを使用してシンクへの到達性を判定
    return metadata.sinks.length > 0;
  }

  /**
   * セキュリティシンクかどうかを判定
   */
  private isSecuritySink(description: string): boolean {
    const sinks = ['expect(', 'assert(', 'query(', 'innerHTML', 'eval(', 'exec('];
    return sinks.some(sink => description.includes(sink));
  }

  /**
   * 重要度を計算
   */
  private calculateSeverity(
    taintLevel: TaintLevel, 
    metadata: TaintMetadata
  ): SeverityLevel {
    const primarySource = metadata.sources[0];
    if (taintLevel === 'tainted' && 
        primarySource === TaintSource.USER_INPUT) {
      return 'critical';
    }
    if (taintLevel >= 'tainted') {
      return 'high';
    }
    if (taintLevel === 'possibly_tainted') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * サニタイズ提案の生成
   */
  private generateSanitizationSuggestion(metadata: TaintMetadata): string {
    const primarySource = metadata.sources[0];
    switch (primarySource) {
      case TaintSource.USER_INPUT:
        return '入力値をescape()またはvalidate()でサニタイズしてください';
      case TaintSource.EXTERNAL_API:
        return 'API応答をJSON.parse()で安全にパースしてください';
      case TaintSource.DATABASE:
        return 'データベース値をsqlEscape()でエスケープしてください';
      default:
        return '適切なサニタイザーを適用してください';
    }
  }

  /**
   * 格子の状態をクリア
   */
  clear(): void {
    this.lattice.clear();
    this.metadata.clear();
  }

  /**
   * 格子の状態をコピー
   */
  clone(): SecurityLattice {
    const clone = new SecurityLattice();
    clone.lattice = new Map(this.lattice);
    clone.metadata = new Map(this.metadata);
    return clone;
  }
}

/**
 * セキュリティ違反
 */
export interface SecurityViolation {
  /** 違反の種別 */
  type: 'taint' | 'type' | 'flow' | 'invariant' | 'unsanitized-taint-flow' | 'missing-sanitizer' | 'unsafe-assertion' | 'sql-injection' | 'xss' | 'command-injection';
  /** 重要度 */
  severity: SeverityLevel;
  /** メッセージ */
  message: string;
  /** 位置 */
  location?: Position;
  /** パス */
  path?: FlowPath;
  /** 修正提案 */
  fix?: string;
  suggestedFix?: string;
  /** 関連する変数 */
  variable?: string;
  /** 汚染レベル */
  taintLevel?: TaintLevel;
  /** メタデータ */
  metadata?: TaintMetadata;
}

/**
 * 格子分析の統計情報
 */
export interface LatticeAnalysisStats {
  /** 解析された変数数 */
  variablesAnalyzed: number;
  /** 汚染された変数数 */
  taintedVariables: number;
  /** 検出された違反数 */
  violationsFound: number;
  /** 解析時間（ms） */
  analysisTime: number;
  /** 格子の高さ（複雑さの指標） */
  latticeHeight: number;
}