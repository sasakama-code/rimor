/**
 * 型ベースセキュリティ解析 - 汚染レベル定義
 * Dorothy Denningの格子理論を基盤とした汚染追跡システム
 */

// 共通型定義からインポート
import {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType
} from '../../types/common-types';

// 再エクスポート（後方互換性のため）
export {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType
};

/**
 * 汚染情報のメタデータ（flow-types.tsとの統一）
 */
export interface TaintMetadata {
  level: TaintLevel;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
  propagationPath?: string[];
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
  // 汚染レベルの順序マッピング（Enum定数使用で型安全性を向上）
  private static readonly LEVEL_ORDER: Record<string, number> = {
    [TaintLevel.UNTAINTED]: 0,
    [TaintLevel.UNKNOWN]: 1,
    [TaintLevel.POSSIBLY_TAINTED]: 2,
    [TaintLevel.TAINTED]: 3,
    [TaintLevel.HIGHLY_TAINTED]: 4,
    [TaintLevel.SANITIZED]: 0 // sanitizedはuntaintedと同等
  };

  /**
   * 未知の汚染レベルに対するデフォルト値（防御的プログラミング）
   */
  private static readonly DEFAULT_LEVEL_ORDER = 1;

  /**
   * 汚染レベルの順序を安全に取得（DRY原則適用）
   * @param level 汚染レベル
   * @returns 順序値（0-4の範囲、未知の場合はデフォルト値）
   */
  private static getOrderSafely(level: TaintLevel): number {
    return this.LEVEL_ORDER[level] ?? this.DEFAULT_LEVEL_ORDER;
  }

  /**
   * 格子の結合演算（join）- より高い汚染レベルを選択
   * Dorothy Denningの格子理論に基づく
   */
  static join(a: TaintLevel, b: TaintLevel): TaintLevel {
    const aOrder = this.getOrderSafely(a);
    const bOrder = this.getOrderSafely(b);
    const maxOrder = Math.max(aOrder, bOrder);
    
    // 順序から対応するTaintLevelを取得
    for (const [level, order] of Object.entries(this.LEVEL_ORDER)) {
      if (order === maxOrder && level !== 'sanitized') {
        return level as TaintLevel;
      }
    }
    return 'unknown';
  }

  /**
   * 格子の交わり演算（meet）- より低い汚染レベルを選択
   */
  static meet(a: TaintLevel, b: TaintLevel): TaintLevel {
    const aOrder = this.getOrderSafely(a);
    const bOrder = this.getOrderSafely(b);
    const minOrder = Math.min(aOrder, bOrder);
    
    // 順序から対応するTaintLevelを取得
    for (const [level, order] of Object.entries(this.LEVEL_ORDER)) {
      if (order === minOrder && level !== 'sanitized') {
        return level as TaintLevel;
      }
    }
    return 'untainted';
  }

  /**
   * 汚染レベルの比較（偏順序関係）
   * @param a 比較する汚染レベル
   * @param b 比較する汚染レベル
   * @returns a ≤ b の場合 true
   */
  static lessThanOrEqual(a: TaintLevel, b: TaintLevel): boolean {
    const aOrder = this.getOrderSafely(a);
    const bOrder = this.getOrderSafely(b);
    return aOrder <= bOrder;
  }

  /**
   * 格子の高さを取得
   */
  static height(level: TaintLevel): number {
    return this.getOrderSafely(level);
  }

  /**
   * 高さから対応するTaintLevelを取得するヘルパーメソッド（DRY原則適用）
   * @param height 高さ値（0-4の範囲）
   * @returns 対応するTaintLevel
   */
  private static getLevelByHeight(height: number): TaintLevel {
    // 高さから対応するレベルを検索
    for (const [level, order] of Object.entries(this.LEVEL_ORDER)) {
      if (order === height && level !== TaintLevel.SANITIZED) {
        return level as TaintLevel;
      }
    }
    // デフォルトとして、高さ0ならUNTAINTED、それ以外はUNKNOWNを返す
    return height === 0 ? TaintLevel.UNTAINTED : TaintLevel.UNKNOWN;
  }

  /**
   * サニタイザー適用による汚染レベルの変化（Issue #111対応）
   * 効果率を考慮した段階的効果を実装
   * @param currentLevel 現在の汚染レベル
   * @param sanitizer サニタイザーの種類
   * @param effectiveness 効果率（0.0-1.0、デフォルト1.0）
   * @returns サニタイザー適用後の汚染レベル
   */
  static applySanitizer(
    currentLevel: TaintLevel,
    sanitizer: SanitizerType,
    effectiveness: number = 1.0
  ): TaintLevel {
    // 効果率の範囲チェック（防御的プログラミング）
    const clampedEffectiveness = Math.max(0.0, Math.min(1.0, effectiveness));
    
    // サニタイザーの効果をモデル化
    switch (sanitizer) {
      case SanitizerType.HTML_ESCAPE:
      case SanitizerType.SQL_ESCAPE:
        // 強力なサニタイザー - 効果率に応じて汚染除去
        if (clampedEffectiveness >= 0.9) {
          return TaintLevel.UNTAINTED;
        } else if (clampedEffectiveness >= 0.7) {
          return TaintLevel.POSSIBLY_TAINTED;
        } else {
          // 効果が低い場合は元のレベルから1段階下げる
          const currentHeight = this.height(currentLevel);
          const newHeight = Math.max(0, currentHeight - 1);
          return this.getLevelByHeight(newHeight);
        }
        
      case SanitizerType.INPUT_VALIDATION:
        // 検証により効果率に応じた段階的効果
        const currentHeight = this.height(currentLevel);
        const reduction = Math.ceil(clampedEffectiveness * 2); // 効果率に応じて1-2レベル下げる
        const newHeight = Math.max(0, currentHeight - reduction);
        return this.getLevelByHeight(newHeight);
        
      case SanitizerType.TYPE_CONVERSION:
        // 型変換は部分的な効果（効果率考慮）
        const currentOrder = this.height(currentLevel);
        const effectiveReduction = clampedEffectiveness * 2; // 最大2レベル下げる
        const targetHeight = Math.max(0, currentOrder - effectiveReduction);
        
        // 結果レベルを効果率に基づいて決定
        if (targetHeight <= 0) {
          return TaintLevel.UNTAINTED;
        } else {
          return this.getLevelByHeight(Math.floor(targetHeight));
        }
          
      default:
        // 不明なサニタイザーは保守的に扱う（効果率無視）
        return currentLevel;
    }
  }

  /**
   * 汚染レベルの可視化
   */
  static toString(level: TaintLevel): string {
    switch (level) {
      case 'untainted':
        return '⊥ (安全)';
      case 'possibly_tainted':
        return '? (要検証)';
      case 'tainted':
        return '! (注意)';
      case 'highly_tainted':
        return '⊤⊤ (最高危険度)';
      case 'sanitized':
        return '✓ (サニタイズ済み)';
      default:
        return '不明';
    }
  }

  /**
   * 格子の底（最小要素）かどうかを判定
   */
  static isBottom(level: TaintLevel): boolean {
    return level === 'untainted' || level === 'sanitized';
  }

  /**
   * 格子の頂（最大要素）かどうかを判定
   */
  static isTop(level: TaintLevel): boolean {
    return level === 'highly_tainted';
  }
}

/**
 * 汚染レベルの比較関数
 * Enum定数を使用して型安全な比較を実行
 */
export function compareTaintLevels(a: TaintLevel, b: TaintLevel): number {
  // TaintLatticeのprivateメソッドにアクセスするため、型チェックヘルパーを使用
  const aOrder = TaintLattice.height(a);
  const bOrder = TaintLattice.height(b);
  return aOrder - bOrder;
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
    const combinedSource = compareTaintLevels(value1.taintLevel, value2.taintLevel) >= 0 ? value1.source : value2.source;
    
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
   * 汚染値をサニタイズ（Issue #111対応 - 効果率考慮）
   */
  sanitize(taintedValue: TaintedValue): TaintedValue {
    // 効果率を考慮した新しいapplySanitizerメソッドを使用
    const newLevel = TaintLattice.applySanitizer(taintedValue.taintLevel, this.type, this.effectiveness);

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
      return new TaintedValue('', 'untainted', null);
    }

    let maxLevel = 'untainted' as TaintLevel;
    let source: TaintSource | null = null;

    for (const value of values) {
      if (compareTaintLevels(value.taintLevel, maxLevel) > 0) {
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
   * Dorothy Denningの格子理論に基づく偏順序関係で評価
   */
  isAssignmentSafe(from: TaintLevel, to: TaintLevel): boolean {
    // 格子理論に基づく偏順序関係で評価
    return TaintLattice.lessThanOrEqual(from, to);
  }
}