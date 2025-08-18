"use strict";
/**
 * デバッグユーティリティ
 * 環境変数RIMOR_DEBUGでデバッグレベルを制御
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.DebugLogger = exports.DebugLevel = void 0;
var DebugLevel;
(function (DebugLevel) {
    DebugLevel[DebugLevel["NONE"] = 0] = "NONE";
    DebugLevel[DebugLevel["ERROR"] = 1] = "ERROR";
    DebugLevel[DebugLevel["WARN"] = 2] = "WARN";
    DebugLevel[DebugLevel["INFO"] = 3] = "INFO";
    DebugLevel[DebugLevel["VERBOSE"] = 4] = "VERBOSE";
    DebugLevel[DebugLevel["TRACE"] = 5] = "TRACE";
})(DebugLevel || (exports.DebugLevel = DebugLevel = {}));
class DebugLogger {
    static debugLevel = DebugLevel.NONE;
    static initialized = false;
    /**
     * デバッグレベルの初期化
     */
    static initialize() {
        if (this.initialized)
            return;
        // テスト環境では自動的にログを無効化（RIMOR_DEBUGが明示的に設定されていない場合）
        if (process.env.NODE_ENV === 'test' && !process.env.RIMOR_DEBUG) {
            this.debugLevel = DebugLevel.NONE;
            this.initialized = true;
            return;
        }
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
    static getLevel() {
        if (!this.initialized) {
            this.initialize();
        }
        return this.debugLevel;
    }
    /**
     * デバッグレベルの設定
     */
    static setLevel(level) {
        this.debugLevel = level;
        this.initialized = true;
    }
    /**
     * エラーレベルのログ
     */
    static error(message, ...args) {
        if (this.getLevel() >= DebugLevel.ERROR) {
            console.error(`🔴 [ERROR] ${new Date().toISOString()} ${message}`, ...args);
        }
    }
    /**
     * 警告レベルのログ
     */
    static warn(message, ...args) {
        if (this.getLevel() >= DebugLevel.WARN) {
            console.warn(`🟡 [WARN]  ${new Date().toISOString()} ${message}`, ...args);
        }
    }
    /**
     * 情報レベルのログ
     */
    static info(message, ...args) {
        if (this.getLevel() >= DebugLevel.INFO) {
            console.log(`🔵 [INFO]  ${new Date().toISOString()} ${message}`, ...args);
        }
    }
    /**
     * 詳細レベルのログ
     */
    static verbose(message, ...args) {
        if (this.getLevel() >= DebugLevel.VERBOSE) {
            console.log(`🟢 [VERB]  ${new Date().toISOString()} ${message}`, ...args);
        }
    }
    /**
     * トレースレベルのログ
     */
    static trace(message, ...args) {
        if (this.getLevel() >= DebugLevel.TRACE) {
            console.log(`⚪ [TRACE] ${new Date().toISOString()} ${message}`, ...args);
        }
    }
    /**
     * 実行時間の測定
     */
    static time(label) {
        if (this.getLevel() >= DebugLevel.VERBOSE) {
            console.time(`⏱️  [TIME]  ${label}`);
        }
    }
    /**
     * 実行時間の測定終了
     */
    static timeEnd(label) {
        if (this.getLevel() >= DebugLevel.VERBOSE) {
            console.timeEnd(`⏱️  [TIME]  ${label}`);
        }
    }
    /**
     * オブジェクトの詳細表示
     */
    static inspect(label, obj) {
        if (this.getLevel() >= DebugLevel.TRACE) {
            console.log(`🔍 [INSPECT] ${label}:`);
            console.dir(obj, { depth: 3, colors: true });
        }
    }
    /**
     * パフォーマンス測定のヘルパー
     */
    static async measureAsync(label, fn) {
        if (this.getLevel() >= DebugLevel.VERBOSE) {
            const start = Date.now();
            this.verbose(`Starting: ${label}`);
            try {
                const result = await fn();
                const duration = Date.now() - start;
                this.verbose(`Completed: ${label} (${duration}ms)`);
                return result;
            }
            catch (error) {
                const duration = Date.now() - start;
                this.error(`Failed: ${label} (${duration}ms)`, error);
                throw error;
            }
        }
        else {
            return await fn();
        }
    }
    /**
     * 同期関数のパフォーマンス測定
     */
    static measure(label, fn) {
        if (this.getLevel() >= DebugLevel.VERBOSE) {
            const start = Date.now();
            this.verbose(`Starting: ${label}`);
            try {
                const result = fn();
                const duration = Date.now() - start;
                this.verbose(`Completed: ${label} (${duration}ms)`);
                return result;
            }
            catch (error) {
                const duration = Date.now() - start;
                this.error(`Failed: ${label} (${duration}ms)`, error);
                throw error;
            }
        }
        else {
            return fn();
        }
    }
    /**
     * 条件付きログ
     */
    static logIf(condition, level, message, ...args) {
        if (!condition)
            return;
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
exports.DebugLogger = DebugLogger;
/**
 * 便利なデバッグ関数のエクスポート
 */
exports.debug = {
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
//# sourceMappingURL=debug.js.map