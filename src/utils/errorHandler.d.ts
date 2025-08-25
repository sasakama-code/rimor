/**
 * 共通エラーハンドリングクラス
 * アプリケーション全体で統一されたエラー処理を提供
 * v0.3.0: i18n対応により多言語エラーメッセージをサポート
 */
export declare enum ErrorType {
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    INVALID_CONFIG = "INVALID_CONFIG",
    PLUGIN_ERROR = "PLUGIN_ERROR",
    PARSE_ERROR = "PARSE_ERROR",
    TIMEOUT = "TIMEOUT",
    WARNING = "WARNING",
    SYSTEM_ERROR = "SYSTEM_ERROR",
    UNKNOWN = "UNKNOWN"
}
export interface ErrorInfo {
    type: ErrorType;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
    recoverable: boolean;
}
export declare class ErrorHandler {
    private static instance;
    private errorLog;
    private constructor();
    static getInstance(): ErrorHandler;
    /**
     * エラーを処理し、統一されたフォーマットでログ出力
     * @param error 元のエラーオブジェクト
     * @param type エラーの種類
     * @param message カスタムエラーメッセージ
     * @param context 追加のコンテキスト情報
     * @param recoverable 回復可能かどうか
     */
    handleError(error: Error | unknown, type?: ErrorType, message?: string, context?: Record<string, any>, recoverable?: boolean): ErrorInfo;
    /**
     * ファイル関連エラーの処理
     */
    handleFileError(error: Error | unknown, filePath: string, operation?: string): ErrorInfo;
    /**
     * プラグイン関連エラーの処理
     */
    handlePluginError(error: Error | unknown, pluginName: string, operation?: string): ErrorInfo;
    /**
     * 設定ファイル関連エラーの処理
     */
    handleConfigError(error: Error | unknown, configPath?: string): ErrorInfo;
    /**
     * パース関連エラーの処理
     */
    handleParseError(error: Error | unknown, content: string, type?: string): ErrorInfo;
    /**
     * タイムアウトエラーの処理
     */
    handleTimeoutError(operation: string, timeoutMs: number): ErrorInfo;
    /**
     * 警告メッセージの処理
     */
    handleWarning(message: string, context?: Record<string, any>, operation?: string): ErrorInfo;
    /**
     * システムエラーの処理（汎用）
     */
    handleSystemError(error: Error | unknown, operation: string, context?: Record<string, any>): ErrorInfo;
    /**
     * 回復可能なエラーかどうかを判定
     */
    isRecoverable(errorInfo: ErrorInfo): boolean;
    /**
     * エラーログを取得
     */
    getErrorLog(): ErrorInfo[];
    /**
     * エラーログをクリア
     */
    clearErrorLog(): void;
    /**
     * エラー統計を取得
     */
    getErrorStats(): Record<ErrorType, number>;
    private getDefaultMessage;
    private logError;
}
/**
 * シングルトンインスタンスへの便利なアクセス
 */
export declare const errorHandler: ErrorHandler;
//# sourceMappingURL=errorHandler.d.ts.map