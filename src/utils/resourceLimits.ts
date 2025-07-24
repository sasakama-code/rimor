/**
 * リソース制限管理システム
 * メモリ使用量、ファイルサイズ、処理時間などの制限を管理
 */

import { errorHandler, ErrorType } from './errorHandler';

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
export const DEFAULT_ANALYSIS_LIMITS: AnalysisLimits = {
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
export const RESOURCE_LIMIT_PROFILES = {
  /** 軽量環境（CI/CD、小規模プロジェクト） */
  light: {
    ...DEFAULT_ANALYSIS_LIMITS,
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
  standard: DEFAULT_ANALYSIS_LIMITS,

  /** 高性能環境（大規模プロジェクト） */
  heavy: {
    ...DEFAULT_ANALYSIS_LIMITS,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    maxFilesProcessed: 50000,
    maxAnalysisTime: 900000, // 15分
    maxMemoryUsage: 2048, // 2GB
    maxContextLines: 200,
    maxDepth: 20,
    maxPluginResults: 5000,
    maxCacheSize: 500 // 500MB
  }
} as const;

/**
 * リソース制限監視と制御
 */
export class ResourceLimitMonitor {
  private limits: AnalysisLimits;
  private startTime: number = 0;
  private processedFiles: number = 0;
  private initialMemory: number = 0;

  constructor(limits: AnalysisLimits = DEFAULT_ANALYSIS_LIMITS) {
    this.limits = limits;
  }

  /**
   * 分析開始時の初期化
   */
  startAnalysis(): void {
    this.startTime = Date.now();
    this.processedFiles = 0;
    this.initialMemory = this.getMemoryUsage();
  }

  /**
   * ファイルサイズ制限チェック
   */
  checkFileSize(size: number, filePath?: string): boolean {
    if (size > this.limits.maxFileSize) {
      errorHandler.handleWarning(
        `ファイルサイズが制限を超過: ${this.formatBytes(size)} > ${this.formatBytes(this.limits.maxFileSize)}`,
        { 
          filePath,
          fileSize: size,
          limit: this.limits.maxFileSize
        },
        'checkFileSize'
      );
      return false;
    }
    return true;
  }

  /**
   * 処理時間制限チェック
   */
  checkAnalysisTime(): boolean {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.limits.maxAnalysisTime) {
      errorHandler.handleWarning(
        `分析時間が制限を超過: ${elapsed}ms > ${this.limits.maxAnalysisTime}ms`,
        { 
          elapsed,
          limit: this.limits.maxAnalysisTime,
          startTime: this.startTime
        },
        'checkAnalysisTime'
      );
      return false;
    }
    return true;
  }

  /**
   * メモリ使用量制限チェック
   */
  checkMemoryUsage(): boolean {
    const currentMemory = this.getMemoryUsage();
    const usedMemory = currentMemory - this.initialMemory;
    
    if (usedMemory > this.limits.maxMemoryUsage) {
      errorHandler.handleWarning(
        `メモリ使用量が制限を超過: ${usedMemory}MB > ${this.limits.maxMemoryUsage}MB`,
        { 
          currentMemory,
          initialMemory: this.initialMemory,
          usedMemory,
          limit: this.limits.maxMemoryUsage
        },
        'checkMemoryUsage'
      );
      
      // ガベージコレクションの実行を試行
      this.forceGarbageCollection();
      return false;
    }
    return true;
  }

  /**
   * 処理ファイル数制限チェック
   */
  checkProcessedFiles(): boolean {
    if (this.processedFiles >= this.limits.maxFilesProcessed) {
      errorHandler.handleWarning(
        `処理ファイル数が制限に達しました: ${this.processedFiles} >= ${this.limits.maxFilesProcessed}`,
        { 
          processedFiles: this.processedFiles,
          limit: this.limits.maxFilesProcessed
        },
        'checkProcessedFiles'
      );
      return false;
    }
    return true;
  }

  /**
   * コンテキスト行数制限チェック
   */
  checkContextLines(lines: number): number {
    if (lines > this.limits.maxContextLines) {
      errorHandler.handleWarning(
        `コンテキスト行数を制限: ${lines} > ${this.limits.maxContextLines}`,
        { 
          requestedLines: lines,
          limit: this.limits.maxContextLines
        },
        'checkContextLines'
      );
      return this.limits.maxContextLines;
    }
    return lines;
  }

  /**
   * ディレクトリ探索深度制限チェック
   */
  checkDepth(currentDepth: number, basePath: string): boolean {
    if (currentDepth > this.limits.maxDepth) {
      errorHandler.handleWarning(
        `ディレクトリ探索深度が制限を超過: ${currentDepth} > ${this.limits.maxDepth}`,
        { 
          currentDepth,
          limit: this.limits.maxDepth,
          basePath
        },
        'checkDepth'
      );
      return false;
    }
    return true;
  }

  /**
   * プラグイン結果数制限チェック
   */
  checkPluginResults(count: number, pluginId?: string): boolean {
    if (count > this.limits.maxPluginResults) {
      errorHandler.handleWarning(
        `プラグイン結果数が制限を超過: ${count} > ${this.limits.maxPluginResults}`,
        { 
          count,
          limit: this.limits.maxPluginResults,
          pluginId
        },
        'checkPluginResults'
      );
      return false;
    }
    return true;
  }

  /**
   * ファイル処理完了の記録
   */
  recordProcessedFile(): void {
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
  updateLimits(newLimits: Partial<AnalysisLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * プロファイルによる制限設定
   */
  setProfile(profile: keyof typeof RESOURCE_LIMIT_PROFILES): void {
    this.limits = RESOURCE_LIMIT_PROFILES[profile];
  }

  /**
   * メモリ使用量を取得 (MB)
   */
  private getMemoryUsage(): number {
    try {
      const usage = process.memoryUsage();
      return Math.round(usage.heapUsed / 1024 / 1024);
    } catch (error) {
      errorHandler.handleWarning(
        'メモリ使用量の取得に失敗',
        { error: error instanceof Error ? error.message : '不明なエラー' },
        'getMemoryUsage'
      );
      return 0;
    }
  }

  /**
   * ガベージコレクションの強制実行
   */
  private forceGarbageCollection(): void {
    try {
      if (global.gc) {
        global.gc();
        errorHandler.handleWarning(
          'ガベージコレクションを実行しました',
          { memoryBefore: this.getMemoryUsage() },
          'forceGarbageCollection'
        );
      }
    } catch (error) {
      // ガベージコレクション実行エラーは無視
    }
  }

  /**
   * バイト数を人間が読みやすい形式にフォーマット
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const defaultResourceMonitor = new ResourceLimitMonitor();