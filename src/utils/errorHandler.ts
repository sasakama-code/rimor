/**
 * 共通エラーハンドリングクラス
 * アプリケーション全体で統一されたエラー処理を提供
 * v0.3.0: i18n対応により多言語エラーメッセージをサポート
 */

import { getMessage, type MessageKey } from '../i18n/messages';

export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  recoverable: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * エラーを処理し、統一されたフォーマットでログ出力
   * @param error 元のエラーオブジェクト
   * @param type エラーの種類
   * @param message カスタムエラーメッセージ
   * @param context 追加のコンテキスト情報
   * @param recoverable 回復可能かどうか
   */
  handleError(
    error: Error | unknown,
    type: ErrorType = ErrorType.UNKNOWN,
    message?: string,
    context?: Record<string, any>,
    recoverable: boolean = false
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      type,
      message: message || this.getDefaultMessage(type, error),
      originalError: error instanceof Error ? error : undefined,
      context,
      recoverable
    };
    
    // エラーログに記録
    this.errorLog.push(errorInfo);
    
    // コンソール出力（MVPでは簡単な出力）
    this.logError(errorInfo);
    
    return errorInfo;
  }
  
  /**
   * ファイル関連エラーの処理
   */
  handleFileError(
    error: Error | unknown,
    filePath: string,
    operation: string = 'read'
  ): ErrorInfo {
    const context = { filePath, operation };
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        return this.handleError(
          error,
          ErrorType.FILE_NOT_FOUND,
          getMessage('error.file.not_found', { filePath }),
          context,
          true
        );
      }
      
      if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
        return this.handleError(
          error,
          ErrorType.PERMISSION_DENIED,
          getMessage('error.file.permission_denied', { filePath }),
          context,
          false
        );
      }
    }
    
    return this.handleError(
      error,
      ErrorType.UNKNOWN,
      getMessage('error.file.operation_failed', { filePath }),
      context,
      true
    );
  }
  
  /**
   * プラグイン関連エラーの処理
   */
  handlePluginError(
    error: Error | unknown,
    pluginName: string,
    operation: string = 'execute'
  ): ErrorInfo {
    const context = { pluginName, operation };
    
    return this.handleError(
      error,
      ErrorType.PLUGIN_ERROR,
      getMessage('error.plugin.execution_failed', { pluginName }),
      context,
      true // プラグインエラーは通常回復可能
    );
  }
  
  /**
   * 設定ファイル関連エラーの処理
   */
  handleConfigError(
    error: Error | unknown,
    configPath?: string
  ): ErrorInfo {
    const context = configPath ? { configPath } : undefined;
    
    return this.handleError(
      error,
      ErrorType.INVALID_CONFIG,
      configPath 
        ? getMessage('error.config.invalid_file', { configPath })
        : getMessage('error.config.invalid_content'),
      context,
      true // 設定エラーはデフォルト設定で回復可能
    );
  }
  
  /**
   * パース関連エラーの処理
   */
  handleParseError(
    error: Error | unknown,
    content: string,
    type: string = 'unknown'
  ): ErrorInfo {
    const context = { 
      contentLength: content.length,
      contentType: type,
      preview: content.substring(0, 100) // 最初の100文字のプレビュー
    };
    
    return this.handleError(
      error,
      ErrorType.PARSE_ERROR,
      getMessage('error.parse.failed', { type }),
      context,
      true
    );
  }
  
  /**
   * タイムアウトエラーの処理
   */
  handleTimeoutError(
    operation: string,
    timeoutMs: number
  ): ErrorInfo {
    const context = { operation, timeoutMs };
    
    return this.handleError(
      new Error(`Operation timed out: ${operation}`),
      ErrorType.TIMEOUT,
      getMessage('error.timeout.operation', { operation, timeoutMs: timeoutMs.toString() }),
      context,
      true
    );
  }
  
  /**
   * 回復可能なエラーかどうかを判定
   */
  isRecoverable(errorInfo: ErrorInfo): boolean {
    return errorInfo.recoverable;
  }
  
  /**
   * エラーログを取得
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }
  
  /**
   * エラーログをクリア
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
  
  /**
   * エラー統計を取得
   */
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    // 全ErrorTypeを0で初期化
    Object.values(ErrorType).forEach(type => {
      stats[type] = 0;
    });
    
    // エラーログから統計を計算
    this.errorLog.forEach(error => {
      stats[error.type]++;
    });
    
    return stats;
  }
  
  private getDefaultMessage(type: ErrorType, error: Error | unknown): string {
    const baseMessage = error instanceof Error ? error.message : 'Unknown error';
    
    switch (type) {
      case ErrorType.FILE_NOT_FOUND:
        return getMessage('error.default.file_not_found', { message: baseMessage });
      case ErrorType.PERMISSION_DENIED:
        return getMessage('error.default.permission_denied', { message: baseMessage });
      case ErrorType.INVALID_CONFIG:
        return getMessage('error.default.invalid_config', { message: baseMessage });
      case ErrorType.PLUGIN_ERROR:
        return getMessage('error.default.plugin_error', { message: baseMessage });
      case ErrorType.PARSE_ERROR:
        return getMessage('error.default.parse_error', { message: baseMessage });
      case ErrorType.TIMEOUT:
        return getMessage('error.default.timeout', { message: baseMessage });
      default:
        return getMessage('error.default.generic', { message: baseMessage });
    }
  }
  
  private logError(errorInfo: ErrorInfo): void {
    const timestamp = new Date().toISOString();
    const prefix = errorInfo.recoverable ? '⚠️' : '❌';
    
    console.error(`${prefix} [${timestamp}] ${errorInfo.type}: ${errorInfo.message}`);
    
    if (errorInfo.context) {
      console.error('   Context:', JSON.stringify(errorInfo.context, null, 2));
    }
    
    if (errorInfo.originalError && process.env.NODE_ENV === 'development') {
      console.error('   Stack:', errorInfo.originalError.stack);
    }
  }
}

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const errorHandler = ErrorHandler.getInstance();