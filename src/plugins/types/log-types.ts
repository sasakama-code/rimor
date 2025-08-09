/**
 * プラグインシステムのログ関連型定義
 */

/**
 * ログレベル定義
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * ログメタデータ
 * プラグインがログ出力時に付加できる追加情報
 */
export interface LogMetadata {
  /** タイムスタンプ */
  timestamp?: number;
  /** プラグイン名 */
  plugin?: string;
  /** ファイルパス */
  filePath?: string;
  /** 行番号 */
  line?: number;
  /** 列番号 */
  column?: number;
  /** 追加のカスタムデータ */
  [key: string]: unknown;
}

/**
 * エラーログ用メタデータ
 */
export interface ErrorLogMetadata extends LogMetadata {
  /** エラー情報 */
  error?: {
    message?: string;
    stack?: string;
    name?: string;
    code?: string;
  };
}

/**
 * ログエントリ
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: LogMetadata | ErrorLogMetadata;
}