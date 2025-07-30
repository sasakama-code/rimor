/**
 * 型ベースセキュリティ解析 - 汚染レベル定義
 * Dorothy Denningの格子理論を基盤とした汚染追跡システム
 */

/**
 * 格子理論に基づく汚染レベル（⊥ から ⊤ へ）
 * Dorothy Denning (1976) "A Lattice Model of Secure Information Flow"
 */
export enum TaintLevel {
  /** ⊥（ボトム）- 完全に安全、汚染なし */
  CLEAN = 0,
  UNTAINTED = 0,
  /** 潜在的な汚染 - 検証が必要 */
  POSSIBLY_TAINTED = 1,
  /** 汚染の可能性が高い - 注意が必要 */  
  LIKELY_TAINTED = 2,
  /** ⊤（トップ）- 確実に汚染、サニタイズ必須 */
  DEFINITELY_TAINTED = 3,
  /** 最高レベルの汚染 - 厳重なサニタイズ必須 */
  HIGHLY_TAINTED = 4
}

/**
 * 汚染源の種別
 */
export enum TaintSource {
  /** ユーザー入力（フォーム、URL、ヘッダー等） */
  USER_INPUT = 'user-input',
  /** 外部API応答 */
  EXTERNAL_API = 'external-api',
  /** 環境変数 */
  ENVIRONMENT = 'environment',
  /** ファイルシステム */
  FILE_SYSTEM = 'file-system',
  /** データベース */
  DATABASE = 'database',
  /** ネットワーク */
  NETWORK = 'network'
}

/**
 * セキュリティシンクの種別
 */
export enum SecuritySink {
  /** データベースクエリ */
  DATABASE_QUERY = 'database-query',
  /** HTML出力 */
  HTML_OUTPUT = 'html-output',
  /** JavaScript実行 */
  JAVASCRIPT_EXEC = 'javascript-exec',
  /** システムコマンド実行 */
  SYSTEM_COMMAND = 'system-command',
  /** ファイル操作 */
  FILE_OPERATION = 'file-operation',
  /** テストアサーション */
  TEST_ASSERTION = 'test-assertion'
}

/**
 * サニタイザーの種別
 */
export enum SanitizerType {
  /** HTMLエスケープ */
  HTML_ESCAPE = 'html-escape',
  /** SQLエスケープ */
  SQL_ESCAPE = 'sql-escape',
  /** 入力検証 */
  INPUT_VALIDATION = 'input-validation',
  /** 型変換 */
  TYPE_CONVERSION = 'type-conversion',
  /** 文字列サニタイズ */
  STRING_SANITIZE = 'string-sanitize',
  /** JSONパース */
  JSON_PARSE = 'json-parse',
  /** 暗号化ハッシュ */
  CRYPTO_HASH = 'crypto-hash'
}

/**
 * 汚染情報のメタデータ
 */
export interface TaintMetadata {
  /** 汚染源 */
  source: TaintSource;
  /** 汚染の信頼度 (0.0-1.0) */
  confidence: number;
  /** 汚染が検出された位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 汚染パスの追跡情報 */
  tracePath: TaintTraceStep[];
  /** 関連するセキュリティルール */
  securityRules: string[];
}

/**
 * 汚染追跡のステップ
 */
export interface TaintTraceStep {
  /** ステップの種別 */
  type: 'propagate' | 'sanitize' | 'merge' | 'branch';
  /** 操作の説明 */
  description: string;
  /** 操作前の汚染レベル */
  inputTaint: TaintLevel;
  /** 操作後の汚染レベル */
  outputTaint: TaintLevel;
  /** 操作が行われた位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
}

/**
 * 汚染された値を表すブランド型
 */
export type TaintedType<T, Level extends TaintLevel = TaintLevel> = T & {
  readonly __taint: Level;
  readonly __metadata: TaintMetadata;
};

/**
 * 安全な値を表すブランド型
 */
export type SafeValue<T> = T & {
  readonly __safe: true;
  readonly __validated: true;
};

/**
 * 汚染レベルの格子演算
 */
export class TaintLattice {
  /**
   * 格子の結合演算（join）- より高い汚染レベルを選択
   * Dorothy Denningの格子理論に基づく
   */
  static join(a: TaintLevel, b: TaintLevel): TaintLevel {
    return Math.max(a, b) as TaintLevel;
  }

  /**
   * 格子の交わり演算（meet）- より低い汚染レベルを選択
   */
  static meet(a: TaintLevel, b: TaintLevel): TaintLevel {
    return Math.min(a, b) as TaintLevel;
  }

  /**
   * 汚染レベルの比較（偏順序関係）
   * @param a 比較する汚染レベル
   * @param b 比較する汚染レベル
   * @returns a ≤ b の場合 true
   */
  static lessThanOrEqual(a: TaintLevel, b: TaintLevel): boolean {
    return a <= b;
  }

  /**
   * 格子の高さを取得
   */
  static height(level: TaintLevel): number {
    return level;
  }

  /**
   * サニタイザー適用による汚染レベルの変化
   */
  static applySanitizer(
    currentLevel: TaintLevel,
    sanitizer: SanitizerType
  ): TaintLevel {
    // サニタイザーの効果をモデル化
    switch (sanitizer) {
      case SanitizerType.HTML_ESCAPE:
      case SanitizerType.SQL_ESCAPE:
        // 強力なサニタイザー - 汚染を完全除去
        return TaintLevel.UNTAINTED;
        
      case SanitizerType.INPUT_VALIDATION:
        // 検証により1レベル下げる
        return Math.max(TaintLevel.UNTAINTED, currentLevel - 1) as TaintLevel;
        
      case SanitizerType.TYPE_CONVERSION:
        // 型変換は部分的な効果
        return currentLevel >= TaintLevel.LIKELY_TAINTED
          ? TaintLevel.POSSIBLY_TAINTED
          : TaintLevel.UNTAINTED;
          
      default:
        // 不明なサニタイザーは保守的に扱う
        return currentLevel;
    }
  }

  /**
   * 汚染レベルの可視化
   */
  static toString(level: TaintLevel): string {
    switch (level) {
      case TaintLevel.UNTAINTED:
        return '⊥ (安全)';
      case TaintLevel.POSSIBLY_TAINTED:
        return '? (要検証)';
      case TaintLevel.LIKELY_TAINTED:
        return '! (注意)';
      case TaintLevel.DEFINITELY_TAINTED:
        return '⊤ (危険)';
      case TaintLevel.HIGHLY_TAINTED:
        return '⊤⊤ (最高危険度)';
      default:
        return '不明';
    }
  }

  /**
   * 格子の底（最小要素）かどうかを判定
   */
  isBottom(level: TaintLevel): boolean {
    return level === TaintLevel.CLEAN;
  }

  /**
   * 格子の頂（最大要素）かどうかを判定
   */
  isTop(level: TaintLevel): boolean {
    return level === TaintLevel.HIGHLY_TAINTED;
  }
}

/**
 * 汚染レベルの比較関数
 */
export function compareTaintLevels(a: TaintLevel, b: TaintLevel): number {
  return a - b;
}

/**
 * 汚染源の危険度を取得
 */
export function getTaintSourceRisk(source: TaintSource): 'low' | 'medium' | 'high' {
  switch (source) {
    case TaintSource.USER_INPUT:
    case TaintSource.EXTERNAL_API:
    case TaintSource.NETWORK:
      return 'high';
    case TaintSource.DATABASE:
    case TaintSource.FILE_SYSTEM:
      return 'medium';
    case TaintSource.ENVIRONMENT:
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * 汚染値を表すクラス
 */
export class TaintedValue {
  constructor(
    public readonly value: any,
    public readonly taintLevel: TaintLevel,
    public readonly source: TaintSource | null
  ) {}

  /**
   * 複数の汚染値を結合
   */
  static combine(value1: TaintedValue, value2: TaintedValue): TaintedValue {
    const combinedLevel = TaintLattice.join(value1.taintLevel, value2.taintLevel);
    const combinedSource = value1.taintLevel >= value2.taintLevel ? value1.source : value2.source;
    
    return new TaintedValue(
      value1.value + value2.value,
      combinedLevel,
      combinedSource
    );
  }
}

/**
 * サニタイザークラス
 */
export class Sanitizer {
  constructor(
    private readonly type: SanitizerType,
    private readonly effectiveness: number = 1.0
  ) {}

  /**
   * 汚染値をサニタイズ
   */
  sanitize(taintedValue: TaintedValue): TaintedValue {
    let newLevel = TaintLattice.applySanitizer(taintedValue.taintLevel, this.type);
    
    // 効果率が100%未満の場合、部分的な効果を適用
    if (this.effectiveness < 1.0 && newLevel === TaintLevel.CLEAN) {
      newLevel = TaintLevel.POSSIBLY_TAINTED;
    }

    // 実際のサニタイズ処理（簡略化）
    let sanitizedValue = taintedValue.value;
    if (this.type === SanitizerType.HTML_ESCAPE && typeof sanitizedValue === 'string') {
      sanitizedValue = sanitizedValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    return new TaintedValue(sanitizedValue, newLevel, taintedValue.source);
  }
}

/**
 * 汚染伝播管理
 */
export class TaintPropagation {
  /**
   * 操作による汚染の伝播
   */
  static propagate(operation: string, values: TaintedValue[]): TaintedValue {
    if (values.length === 0) {
      return new TaintedValue('', TaintLevel.CLEAN, null);
    }

    let maxLevel = TaintLevel.CLEAN;
    let source: TaintSource | null = null;

    for (const value of values) {
      if (value.taintLevel > maxLevel) {
        maxLevel = value.taintLevel;
        source = value.source;
      }
    }

    const resultValue = values.map(v => v.value).join('');
    return new TaintedValue(resultValue, maxLevel, source);
  }
}

/**
 * 汚染分析器
 */
export class TaintAnalyzer {
  /**
   * 関数の汚染分析を実行
   */
  analyzeFunction(functionCode: string): {
    taintSources: { name: string; location: number }[];
    sanitizers: { name: string; location: number }[];
    taintFlow: { from: string; to: string; level: TaintLevel }[];
  } {
    const taintSources: { name: string; location: number }[] = [];
    const sanitizers: { name: string; location: number }[] = [];
    const taintFlow: { from: string; to: string; level: TaintLevel }[] = [];

    // 汚染源の検出（簡略化）
    if (functionCode.includes('userInput')) {
      taintSources.push({ name: 'userInput', location: functionCode.indexOf('userInput') });
    }

    // サニタイザーの検出
    if (functionCode.includes('escapeHtml')) {
      sanitizers.push({ name: 'escapeHtml', location: functionCode.indexOf('escapeHtml') });
    }

    // 汚染フローの簡単な分析
    if (taintSources.length > 0 && sanitizers.length > 0) {
      taintFlow.push({
        from: taintSources[0].name,
        to: 'escapeHtml',
        level: TaintLevel.POSSIBLY_TAINTED
      });
    }

    return { taintSources, sanitizers, taintFlow };
  }

  /**
   * 汚染違反の検出
   */
  detectViolations(code: string): Array<{
    type: string;
    severity: string;
    message: string;
    location: number;
  }> {
    const violations: Array<{
      type: string;
      severity: string;
      message: string;
      location: number;
    }> = [];

    // evalの使用を検出
    if (code.includes('eval(')) {
      const location = code.indexOf('eval(');
      violations.push({
        type: 'taint-violation',
        severity: 'critical',
        message: '汚染データの直接実行は危険です',
        location
      });
    }

    return violations;
  }
}

/**
 * 汚染型推論
 */
export class TaintTypeInference {
  /**
   * 型注釈から汚染情報を推論
   */
  inferFromAnnotation(annotation: string): {
    level: string;
    source: string;
  } {
    const levelMatch = annotation.match(/level=(\w+)/);
    const sourceMatch = annotation.match(/source=(\w+)/);

    return {
      level: levelMatch ? levelMatch[1] : 'UNKNOWN',
      source: sourceMatch ? sourceMatch[1] : 'UNKNOWN'
    };
  }
}

/**
 * 汚染型チェッカー
 */
export class TaintTypeChecker {
  /**
   * 代入の安全性をチェック
   */
  isAssignmentSafe(from: TaintLevel, to: TaintLevel): boolean {
    // 汚染値を清浄な変数に代入することは禁止
    return from <= to;
  }
}