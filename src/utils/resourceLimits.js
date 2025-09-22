"use strict";
/**
 * リソース制限管理システム
 * メモリ使用量、ファイルサイズ、処理時間などの制限を管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultResourceMonitor = exports.ResourceLimitMonitor = exports.RESOURCE_LIMIT_PROFILES = exports.DEFAULT_ANALYSIS_LIMITS = void 0;
const errorHandler_1 = require("./errorHandler");
/**
 * デフォルトのリソース制限設定
 */
exports.DEFAULT_ANALYSIS_LIMITS = {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFilesProcessed: 10000,
    maxAnalysisTime: 300000, // 5分
    maxMemoryUsage: 512, // 512MB
    maxContextLines: 50,
    maxDepth: 10,
    maxPluginResults: 1000,
    maxCacheSize: 100 // 100MB
};
/**
 * 環境別のリソース制限設定
 */
exports.RESOURCE_LIMIT_PROFILES = {
    /** 軽量環境（CI/CD、小規模プロジェクト） */
    light: {
        ...exports.DEFAULT_ANALYSIS_LIMITS,
        maxFileSize: 1 * 1024 * 1024, // 1MB
        maxFilesProcessed: 1000,
        maxAnalysisTime: 60000, // 1分
        maxMemoryUsage: 128, // 128MB
        maxContextLines: 20,
        maxDepth: 5,
        maxPluginResults: 100,
        maxCacheSize: 10 // 10MB
    },
    /** 標準環境（通常の開発環境） */
    standard: exports.DEFAULT_ANALYSIS_LIMITS,
    /** 高性能環境（大規模プロジェクト） */
    heavy: {
        ...exports.DEFAULT_ANALYSIS_LIMITS,
        maxFileSize: 20 * 1024 * 1024, // 20MB
        maxFilesProcessed: 50000,
        maxAnalysisTime: 900000, // 15分
        maxMemoryUsage: 2048, // 2GB
        maxContextLines: 200,
        maxDepth: 20,
        maxPluginResults: 5000,
        maxCacheSize: 500 // 500MB
    }
};
/**
 * リソース制限監視と制御
 */
class ResourceLimitMonitor {
    limits;
    startTime = 0;
    processedFiles = 0;
    initialMemory = 0;
    constructor(limits = exports.DEFAULT_ANALYSIS_LIMITS) {
        this.limits = limits;
    }
    /**
     * 分析開始時の初期化
     */
    startAnalysis() {
        this.startTime = Date.now();
        this.processedFiles = 0;
        this.initialMemory = this.getMemoryUsage();
    }
    /**
     * ファイルサイズ制限チェック
     */
    checkFileSize(size, filePath) {
        if (size > this.limits.maxFileSize) {
            errorHandler_1.errorHandler.handleWarning(`ファイルサイズが制限を超過: ${this.formatBytes(size)} > ${this.formatBytes(this.limits.maxFileSize)}`, {
                filePath,
                fileSize: size,
                limit: this.limits.maxFileSize
            }, 'checkFileSize');
            return false;
        }
        return true;
    }
    /**
     * 処理時間制限チェック
     */
    checkAnalysisTime() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed > this.limits.maxAnalysisTime) {
            errorHandler_1.errorHandler.handleWarning(`分析時間が制限を超過: ${elapsed}ms > ${this.limits.maxAnalysisTime}ms`, {
                elapsed,
                limit: this.limits.maxAnalysisTime,
                startTime: this.startTime
            }, 'checkAnalysisTime');
            return false;
        }
        return true;
    }
    /**
     * メモリ使用量制限チェック
     */
    checkMemoryUsage() {
        const currentMemory = this.getMemoryUsage();
        const usedMemory = currentMemory - this.initialMemory;
        if (usedMemory > this.limits.maxMemoryUsage) {
            errorHandler_1.errorHandler.handleWarning(`メモリ使用量が制限を超過: ${usedMemory}MB > ${this.limits.maxMemoryUsage}MB`, {
                currentMemory,
                initialMemory: this.initialMemory,
                usedMemory,
                limit: this.limits.maxMemoryUsage
            }, 'checkMemoryUsage');
            // ガベージコレクションの実行を試行
            this.forceGarbageCollection();
            return false;
        }
        return true;
    }
    /**
     * 処理ファイル数制限チェック
     */
    checkProcessedFiles() {
        if (this.processedFiles >= this.limits.maxFilesProcessed) {
            errorHandler_1.errorHandler.handleWarning(`処理ファイル数が制限に達しました: ${this.processedFiles} >= ${this.limits.maxFilesProcessed}`, {
                processedFiles: this.processedFiles,
                limit: this.limits.maxFilesProcessed
            }, 'checkProcessedFiles');
            return false;
        }
        return true;
    }
    /**
     * コンテキスト行数制限チェック
     */
    checkContextLines(lines) {
        if (lines > this.limits.maxContextLines) {
            errorHandler_1.errorHandler.handleWarning(`コンテキスト行数を制限: ${lines} > ${this.limits.maxContextLines}`, {
                requestedLines: lines,
                limit: this.limits.maxContextLines
            }, 'checkContextLines');
            return this.limits.maxContextLines;
        }
        return lines;
    }
    /**
     * ディレクトリ探索深度制限チェック
     */
    checkDepth(currentDepth, basePath) {
        if (currentDepth > this.limits.maxDepth) {
            errorHandler_1.errorHandler.handleWarning(`ディレクトリ探索深度が制限を超過: ${currentDepth} > ${this.limits.maxDepth}`, {
                currentDepth,
                limit: this.limits.maxDepth,
                basePath
            }, 'checkDepth');
            return false;
        }
        return true;
    }
    /**
     * プラグイン結果数制限チェック
     */
    checkPluginResults(count, pluginId) {
        if (count > this.limits.maxPluginResults) {
            errorHandler_1.errorHandler.handleWarning(`プラグイン結果数が制限を超過: ${count} > ${this.limits.maxPluginResults}`, {
                count,
                limit: this.limits.maxPluginResults,
                pluginId
            }, 'checkPluginResults');
            return false;
        }
        return true;
    }
    /**
     * ファイル処理完了の記録
     */
    recordProcessedFile() {
        this.processedFiles++;
    }
    /**
     * 現在のリソース使用状況を取得
     */
    getResourceUsage() {
        const currentTime = Date.now();
        const currentMemory = this.getMemoryUsage();
        return {
            elapsedTime: currentTime - this.startTime,
            processedFiles: this.processedFiles,
            memoryUsage: currentMemory - this.initialMemory,
            limits: this.limits
        };
    }
    /**
     * リソース制限設定を更新
     */
    updateLimits(newLimits) {
        this.limits = { ...this.limits, ...newLimits };
    }
    /**
     * プロファイルによる制限設定
     */
    setProfile(profile) {
        this.limits = exports.RESOURCE_LIMIT_PROFILES[profile];
    }
    /**
     * メモリ使用量を取得 (MB)
     */
    getMemoryUsage() {
        try {
            const usage = process.memoryUsage();
            return Math.round(usage.heapUsed / 1024 / 1024);
        }
        catch (error) {
            errorHandler_1.errorHandler.handleWarning('メモリ使用量の取得に失敗', { error: error instanceof Error ? error.message : '不明なエラー' }, 'getMemoryUsage');
            return 0;
        }
    }
    /**
     * ガベージコレクションの強制実行
     */
    forceGarbageCollection() {
        try {
            if (global.gc) {
                global.gc();
                errorHandler_1.errorHandler.handleWarning('ガベージコレクションを実行しました', { memoryBefore: this.getMemoryUsage() }, 'forceGarbageCollection');
            }
        }
        catch (error) {
            // ガベージコレクション実行エラーは無視
        }
    }
    /**
     * バイト数を人間が読みやすい形式にフォーマット
     */
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
exports.ResourceLimitMonitor = ResourceLimitMonitor;
/**
 * シングルトンインスタンスへの便利なアクセス
 */
exports.defaultResourceMonitor = new ResourceLimitMonitor();
//# sourceMappingURL=resourceLimits.js.map