/**
 * デバッグユーティリティ
 * 環境変数RIMOR_DEBUGでデバッグレベルを制御
 */
export declare enum DebugLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    VERBOSE = 4,
    TRACE = 5
}
export declare class DebugLogger {
    private static debugLevel;
    private static initialized;
    /**
     * デバッグレベルの初期化
     */
    static initialize(): void;
    /**
     * デバッグレベルの取得
     */
    static getLevel(): DebugLevel;
    /**
     * デバッグレベルの設定
     */
    static setLevel(level: DebugLevel): void;
    /**
     * エラーレベルのログ
     */
    static error(message: string, ...args: unknown[]): void;
    /**
     * 警告レベルのログ
     */
    static warn(message: string, ...args: unknown[]): void;
    /**
     * 情報レベルのログ
     */
    static info(message: string, ...args: unknown[]): void;
    /**
     * 詳細レベルのログ
     */
    static verbose(message: string, ...args: unknown[]): void;
    /**
     * トレースレベルのログ
     */
    static trace(message: string, ...args: unknown[]): void;
    /**
     * 実行時間の測定
     */
    static time(label: string): void;
    /**
     * 実行時間の測定終了
     */
    static timeEnd(label: string): void;
    /**
     * オブジェクトの詳細表示
     */
    static inspect(label: string, obj: unknown): void;
    /**
     * パフォーマンス測定のヘルパー
     */
    static measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T>;
    /**
     * 同期関数のパフォーマンス測定
     */
    static measure<T>(label: string, fn: () => T): T;
    /**
     * 条件付きログ
     */
    static logIf(condition: boolean, level: DebugLevel, message: string, ...args: unknown[]): void;
}
/**
 * 便利なデバッグ関数のエクスポート
 */
export declare const debug: {
    error: typeof DebugLogger.error;
    warn: typeof DebugLogger.warn;
    info: typeof DebugLogger.info;
    verbose: typeof DebugLogger.verbose;
    trace: typeof DebugLogger.trace;
    time: typeof DebugLogger.time;
    timeEnd: typeof DebugLogger.timeEnd;
    inspect: typeof DebugLogger.inspect;
    measureAsync: typeof DebugLogger.measureAsync;
    measure: typeof DebugLogger.measure;
    logIf: typeof DebugLogger.logIf;
    getLevel: typeof DebugLogger.getLevel;
    setLevel: typeof DebugLogger.setLevel;
};
//# sourceMappingURL=debug.d.ts.map