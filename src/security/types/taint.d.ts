/**
 * 型ベースセキュリティ解析 - 汚染レベル定義
 * Dorothy Denningの格子理論を基盤とした汚染追跡システム
 */
import { TaintLevel, TaintSource, SecuritySink, SanitizerType } from '../../types/common-types';
export { TaintLevel, TaintSource, SecuritySink, SanitizerType };
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
export declare class TaintLattice {
    private static readonly LEVEL_ORDER;
    /**
     * 格子の結合演算（join）- より高い汚染レベルを選択
     * Dorothy Denningの格子理論に基づく
     */
    static join(a: TaintLevel, b: TaintLevel): TaintLevel;
    /**
     * 格子の交わり演算（meet）- より低い汚染レベルを選択
     */
    static meet(a: TaintLevel, b: TaintLevel): TaintLevel;
    /**
     * 汚染レベルの比較（偏順序関係）
     * @param a 比較する汚染レベル
     * @param b 比較する汚染レベル
     * @returns a ≤ b の場合 true
     */
    static lessThanOrEqual(a: TaintLevel, b: TaintLevel): boolean;
    /**
     * 格子の高さを取得
     */
    static height(level: TaintLevel): number;
    /**
     * サニタイザー適用による汚染レベルの変化
     */
    static applySanitizer(currentLevel: TaintLevel, sanitizer: SanitizerType): TaintLevel;
    /**
     * 汚染レベルの可視化
     */
    static toString(level: TaintLevel): string;
    /**
     * 格子の底（最小要素）かどうかを判定
     */
    static isBottom(level: TaintLevel): boolean;
    /**
     * 格子の頂（最大要素）かどうかを判定
     */
    static isTop(level: TaintLevel): boolean;
}
/**
 * 汚染レベルの比較関数
 */
export declare function compareTaintLevels(a: TaintLevel, b: TaintLevel): number;
/**
 * 汚染源の危険度を取得
 */
export declare function getTaintSourceRisk(source: TaintSource): 'low' | 'medium' | 'high';
/**
 * 汚染値を表すクラス
 */
export declare class TaintedValue {
    readonly value: any;
    readonly taintLevel: TaintLevel;
    readonly source: TaintSource | null;
    constructor(value: any, taintLevel: TaintLevel, source: TaintSource | null);
    /**
     * 複数の汚染値を結合
     */
    static combine(value1: TaintedValue, value2: TaintedValue): TaintedValue;
}
/**
 * サニタイザークラス
 */
export declare class Sanitizer {
    private readonly type;
    private readonly effectiveness;
    constructor(type: SanitizerType, effectiveness?: number);
    /**
     * 汚染値をサニタイズ
     */
    sanitize(taintedValue: TaintedValue): TaintedValue;
}
/**
 * 汚染伝播管理
 */
export declare class TaintPropagation {
    /**
     * 操作による汚染の伝播
     */
    static propagate(operation: string, values: TaintedValue[]): TaintedValue;
}
/**
 * 汚染分析器
 */
export declare class TaintAnalyzer {
    /**
     * 関数の汚染分析を実行
     */
    analyzeFunction(functionCode: string): {
        taintSources: {
            name: string;
            location: number;
        }[];
        sanitizers: {
            name: string;
            location: number;
        }[];
        taintFlow: {
            from: string;
            to: string;
            level: TaintLevel;
        }[];
    };
    /**
     * 汚染違反の検出
     */
    detectViolations(code: string): Array<{
        type: string;
        severity: string;
        message: string;
        location: number;
    }>;
}
/**
 * 汚染型推論
 */
export declare class TaintTypeInference {
    /**
     * 型注釈から汚染情報を推論
     */
    inferFromAnnotation(annotation: string): {
        level: string;
        source: string;
    };
}
/**
 * 汚染型チェッカー
 */
export declare class TaintTypeChecker {
    /**
     * 代入の安全性をチェック
     */
    isAssignmentSafe(from: TaintLevel, to: TaintLevel): boolean;
}
//# sourceMappingURL=taint.d.ts.map