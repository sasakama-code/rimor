/**
 * リソース制限管理システム
 * メモリ使用量、ファイルサイズ、処理時間などの制限を管理
 */
/**
 * 分析処理のリソース制限設定
 */
export interface AnalysisLimits {
    /** 最大ファイルサイズ (bytes) */
    maxFileSize: number;
    /** 最大処理ファイル数 */
    maxFilesProcessed: number;
    /** 最大分析時間 (ms) */
    maxAnalysisTime: number;
    /** 最大メモリ使用量 (MB) */
    maxMemoryUsage: number;
    /** 最大コンテキスト行数 */
    maxContextLines: number;
    /** 最大ディレクトリ探索深度 */
    maxDepth: number;
    /** 最大プラグイン結果数 */
    maxPluginResults: number;
    /** 最大キャッシュサイズ (MB) */
    maxCacheSize: number;
}
/**
 * デフォルトのリソース制限設定
 */
export declare const DEFAULT_ANALYSIS_LIMITS: AnalysisLimits;
/**
 * 環境別のリソース制限設定
 */
export declare const RESOURCE_LIMIT_PROFILES: {
    /** 軽量環境（CI/CD、小規模プロジェクト） */
    readonly light: {
        readonly maxFileSize: number;
        readonly maxFilesProcessed: 1000;
        readonly maxAnalysisTime: 60000;
        readonly maxMemoryUsage: 128;
        readonly maxContextLines: 20;
        readonly maxDepth: 5;
        readonly maxPluginResults: 100;
        readonly maxCacheSize: 10;
    };
    /** 標準環境（通常の開発環境） */
    readonly standard: AnalysisLimits;
    /** 高性能環境（大規模プロジェクト） */
    readonly heavy: {
        readonly maxFileSize: number;
        readonly maxFilesProcessed: 50000;
        readonly maxAnalysisTime: 900000;
        readonly maxMemoryUsage: 2048;
        readonly maxContextLines: 200;
        readonly maxDepth: 20;
        readonly maxPluginResults: 5000;
        readonly maxCacheSize: 500;
    };
};
/**
 * リソース制限監視と制御
 */
export declare class ResourceLimitMonitor {
    private limits;
    private startTime;
    private processedFiles;
    private initialMemory;
    constructor(limits?: AnalysisLimits);
    /**
     * 分析開始時の初期化
     */
    startAnalysis(): void;
    /**
     * ファイルサイズ制限チェック
     */
    checkFileSize(size: number, filePath?: string): boolean;
    /**
     * 処理時間制限チェック
     */
    checkAnalysisTime(): boolean;
    /**
     * メモリ使用量制限チェック
     */
    checkMemoryUsage(): boolean;
    /**
     * 処理ファイル数制限チェック
     */
    checkProcessedFiles(): boolean;
    /**
     * コンテキスト行数制限チェック
     */
    checkContextLines(lines: number): number;
    /**
     * ディレクトリ探索深度制限チェック
     */
    checkDepth(currentDepth: number, basePath: string): boolean;
    /**
     * プラグイン結果数制限チェック
     */
    checkPluginResults(count: number, pluginId?: string): boolean;
    /**
     * ファイル処理完了の記録
     */
    recordProcessedFile(): void;
    /**
     * 現在のリソース使用状況を取得
     */
    getResourceUsage(): {
        elapsedTime: number;
        processedFiles: number;
        memoryUsage: number;
        limits: AnalysisLimits;
    };
    /**
     * リソース制限設定を更新
     */
    updateLimits(newLimits: Partial<AnalysisLimits>): void;
    /**
     * プロファイルによる制限設定
     */
    setProfile(profile: keyof typeof RESOURCE_LIMIT_PROFILES): void;
    /**
     * メモリ使用量を取得 (MB)
     */
    private getMemoryUsage;
    /**
     * ガベージコレクションの強制実行
     */
    private forceGarbageCollection;
    /**
     * バイト数を人間が読みやすい形式にフォーマット
     */
    private formatBytes;
}
/**
 * シングルトンインスタンスへの便利なアクセス
 */
export declare const defaultResourceMonitor: ResourceLimitMonitor;
//# sourceMappingURL=resourceLimits.d.ts.map