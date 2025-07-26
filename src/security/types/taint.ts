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
  UNTAINTED = 0,
  /** 潜在的な汚染 - 検証が必要 */
  POSSIBLY_TAINTED = 1,
  /** 汚染の可能性が高い - 注意が必要 */  
  LIKELY_TAINTED = 2,
  /** ⊤（トップ）- 確実に汚染、サニタイズ必須 */
  DEFINITELY_TAINTED = 3
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
  JSON_PARSE = 'json-parse'
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
export type TaintedValue<T, Level extends TaintLevel = TaintLevel> = T & {
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
      default:
        return '不明';
    }
  }
}