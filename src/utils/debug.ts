/**
 * デバッグユーティリティ
 * 環境変数RIMOR_DEBUGでデバッグレベルを制御
 */

export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  VERBOSE = 4,
  TRACE = 5
}

export class DebugLogger {
  private static debugLevel: DebugLevel = DebugLevel.NONE;
  private static initialized = false;

  /**
   * デバッグレベルの初期化
   */
  static initialize(): void {
    if (this.initialized) return;

    const debugEnv = process.env.RIMOR_DEBUG?.toLowerCase();
    
    switch (debugEnv) {
      case 'trace':
        this.debugLevel = DebugLevel.TRACE;
        break;
      case 'verbose':
        this.debugLevel = DebugLevel.VERBOSE;
        break;
      case 'info':
        this.debugLevel = DebugLevel.INFO;
        break;
      case 'warn':
        this.debugLevel = DebugLevel.WARN;
        break;
      case 'error':
        this.debugLevel = DebugLevel.ERROR;
        break;
      case 'true':
      case '1':
        this.debugLevel = DebugLevel.INFO;
        break;
      default:
        this.debugLevel = DebugLevel.NONE;
    }

    this.initialized = true;

    if (this.debugLevel > DebugLevel.NONE) {
      console.log(`🐛 Rimor Debug Mode: ${DebugLevel[this.debugLevel]}`);
    }
  }

  /**
   * デバッグレベルの取得
   */
  static getLevel(): DebugLevel {
    if (!this.initialized) {
      this.initialize();
    }
    return this.debugLevel;
  }

  /**
   * デバッグレベルの設定
   */
  static setLevel(level: DebugLevel): void {
    this.debugLevel = level;
    this.initialized = true;
  }

  /**
   * エラーレベルのログ
   */
  static error(message: string, ...args: any[]): void {
    if (this.getLevel() >= DebugLevel.ERROR) {
      console.error(`🔴 [ERROR] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  /**
   * 警告レベルのログ
   */
  static warn(message: string, ...args: any[]): void {
    if (this.getLevel() >= DebugLevel.WARN) {
      console.warn(`🟡 [WARN]  ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  /**
   * 情報レベルのログ
   */
  static info(message: string, ...args: any[]): void {
    if (this.getLevel() >= DebugLevel.INFO) {
      console.log(`🔵 [INFO]  ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  /**
   * 詳細レベルのログ
   */
  static verbose(message: string, ...args: any[]): void {
    if (this.getLevel() >= DebugLevel.VERBOSE) {
      console.log(`🟢 [VERB]  ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  /**
   * トレースレベルのログ
   */
  static trace(message: string, ...args: any[]): void {
    if (this.getLevel() >= DebugLevel.TRACE) {
      console.log(`⚪ [TRACE] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  /**
   * 実行時間の測定
   */
  static time(label: string): void {
    if (this.getLevel() >= DebugLevel.VERBOSE) {
      console.time(`⏱️  [TIME]  ${label}`);
    }
  }

  /**
   * 実行時間の測定終了
   */
  static timeEnd(label: string): void {
    if (this.getLevel() >= DebugLevel.VERBOSE) {
      console.timeEnd(`⏱️  [TIME]  ${label}`);
    }
  }

  /**
   * オブジェクトの詳細表示
   */
  static inspect(label: string, obj: any): void {
    if (this.getLevel() >= DebugLevel.TRACE) {
      console.log(`🔍 [INSPECT] ${label}:`);
      console.dir(obj, { depth: 3, colors: true });
    }
  }

  /**
   * パフォーマンス測定のヘルパー
   */
  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (this.getLevel() >= DebugLevel.VERBOSE) {
      const start = Date.now();
      this.verbose(`Starting: ${label}`);
      
      try {
        const result = await fn();
        const duration = Date.now() - start;
        this.verbose(`Completed: ${label} (${duration}ms)`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        this.error(`Failed: ${label} (${duration}ms)`, error);
        throw error;
      }
    } else {
      return await fn();
    }
  }

  /**
   * 同期関数のパフォーマンス測定
   */
  static measure<T>(label: string, fn: () => T): T {
    if (this.getLevel() >= DebugLevel.VERBOSE) {
      const start = Date.now();
      this.verbose(`Starting: ${label}`);
      
      try {
        const result = fn();
        const duration = Date.now() - start;
        this.verbose(`Completed: ${label} (${duration}ms)`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        this.error(`Failed: ${label} (${duration}ms)`, error);
        throw error;
      }
    } else {
      return fn();
    }
  }

  /**
   * 条件付きログ
   */
  static logIf(condition: boolean, level: DebugLevel, message: string, ...args: any[]): void {
    if (!condition) return;

    switch (level) {
      case DebugLevel.ERROR:
        this.error(message, ...args);
        break;
      case DebugLevel.WARN:
        this.warn(message, ...args);
        break;
      case DebugLevel.INFO:
        this.info(message, ...args);
        break;
      case DebugLevel.VERBOSE:
        this.verbose(message, ...args);
        break;
      case DebugLevel.TRACE:
        this.trace(message, ...args);
        break;
    }
  }
}

/**
 * 便利なデバッグ関数のエクスポート
 */
export const debug = {
  error: DebugLogger.error.bind(DebugLogger),
  warn: DebugLogger.warn.bind(DebugLogger),
  info: DebugLogger.info.bind(DebugLogger),
  verbose: DebugLogger.verbose.bind(DebugLogger),
  trace: DebugLogger.trace.bind(DebugLogger),
  time: DebugLogger.time.bind(DebugLogger),
  timeEnd: DebugLogger.timeEnd.bind(DebugLogger),
  inspect: DebugLogger.inspect.bind(DebugLogger),
  measureAsync: DebugLogger.measureAsync.bind(DebugLogger),
  measure: DebugLogger.measure.bind(DebugLogger),
  logIf: DebugLogger.logIf.bind(DebugLogger),
  getLevel: DebugLogger.getLevel.bind(DebugLogger),
  setLevel: DebugLogger.setLevel.bind(DebugLogger)
};

// 自動初期化
DebugLogger.initialize();