/**
 * キャッシュ機能付き分析エンジン
 * 既存のAnalyzerにキャッシング機能を統合
 */

import { IPlugin, Issue } from './types';
import { UnifiedPluginManager } from './UnifiedPluginManager';
import { CacheManager } from './cacheManager';
import { PerformanceMonitor, PerformanceReport } from './performanceMonitor';
import { errorHandler } from '../utils/errorHandler';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface CachedAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  cacheStats: {
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    filesFromCache: number;
    filesAnalyzed: number;
  };
  performanceReport?: PerformanceReport;
}

export interface CachedAnalysisOptions {
  enableCache?: boolean;
  cacheOptions?: {
    maxEntries?: number;
    maxSizeBytes?: number;
    ttlMs?: number;
  };
  showCacheStats?: boolean;
  enablePerformanceMonitoring?: boolean;
  showPerformanceReport?: boolean;
}

export class CachedAnalyzer {
  private pluginManager: UnifiedPluginManager;
  private cacheManager: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  private options: Required<CachedAnalysisOptions>;
  
  constructor(options: CachedAnalysisOptions = {}) {
    this.pluginManager = new UnifiedPluginManager();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.options = {
      enableCache: options.enableCache ?? true,
      cacheOptions: options.cacheOptions ?? {},
      showCacheStats: options.showCacheStats ?? false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? false,
      showPerformanceReport: options.showPerformanceReport ?? false
    };
    
    this.cacheManager = CacheManager.getInstance({
      enabled: this.options.enableCache,
      ...this.options.cacheOptions
    });
  }
  
  registerPlugin(plugin: IPlugin): void {
    this.pluginManager.register(plugin);
  }
  
  async analyze(targetPath: string): Promise<CachedAnalysisResult> {
    const startTime = Date.now();
    this.lastAnalysisTime = startTime;
    const initialCacheStats = this.cacheManager.getStatistics();
    
    // パフォーマンス監視開始
    if (this.options.enablePerformanceMonitoring) {
      this.performanceMonitor.startSession();
    }
    
    let allIssues: Issue[] = [];
    let fileCount = 0;
    let filesFromCache = 0;
    let filesAnalyzed = 0;
    
    try {
      // Phase 1: ファイル収集
      const files = await this.collectAllFiles(targetPath);
      fileCount = files.length;
      
      if (files.length === 0) {
        return this.createResult(startTime, 0, [], {
          cacheHits: 0,
          cacheMisses: 0,
          hitRatio: 0,
          filesFromCache: 0,
          filesAnalyzed: 0
        }, undefined);
      }
      
      // Phase 2: キャッシュ対応分析
      const registeredPlugins = this.pluginManager.getLegacyPlugins();
      
      for (const filePath of files) {
        const fileIssues = await this.analyzeFileWithCache(filePath, registeredPlugins);
        allIssues.push(...fileIssues.issues);
        
        if (fileIssues.fromCache) {
          filesFromCache++;
        } else {
          filesAnalyzed++;
        }
      }
      
      const finalCacheStats = this.cacheManager.getStatistics();
      const cacheStats = {
        cacheHits: finalCacheStats.cacheHits - initialCacheStats.cacheHits,
        cacheMisses: finalCacheStats.cacheMisses - initialCacheStats.cacheMisses,
        hitRatio: finalCacheStats.hitRatio,
        filesFromCache,
        filesAnalyzed
      };
      
      if (this.options.showCacheStats) {
        this.logCacheStatistics(cacheStats, fileCount);
      }
      
      // パフォーマンスレポート生成
      let performanceReport: PerformanceReport | undefined;
      if (this.options.enablePerformanceMonitoring) {
        performanceReport = this.performanceMonitor.endSession();
        
        if (this.options.showPerformanceReport) {
          this.performanceMonitor.displayReport(performanceReport, true);
        }
      }
      
      return this.createResult(startTime, fileCount, allIssues, cacheStats, performanceReport);
      
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        ""
      );
      throw error;
    }
  }
  
  /**
   * キャッシュ統計の表示
   */
  async showCacheInfo(): Promise<void> {
    const info = this.cacheManager.getDetailedInfo();
    
    console.log('\n' + "");
    console.log(`  有効: ${info.options.enabled ? 'Yes' : 'No'}`);
    console.log(`  エントリ数: ${info.statistics.totalEntries}`);
    console.log(`  ヒット率: ${(info.statistics.hitRatio * 100).toFixed(1)}%`);
    console.log(`  総サイズ: ${this.formatBytes(info.statistics.totalSizeBytes)}`);
    console.log(`  平均ファイルサイズ: ${this.formatBytes(info.statistics.avgFileSize)}`);
    
    if (info.entries.length > 0) {
      console.log(`\n  最近のエントリ (上位5件):`);
      info.entries.slice(0, 5).forEach(entry => {
        const relativePath = path.relative(process.cwd(), entry.filePath);
        console.log(`    ${relativePath} (${this.formatBytes(entry.fileSize)}, ${entry.pluginCount}プラグイン)`);
      });
    }
  }
  
  /**
   * キャッシュのクリア
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.invalidateAll();
    console.log("");
  }
  
  /**
   * キャッシュの最適化
   */
  async optimizeCache(): Promise<void> {
    const beforeStats = this.cacheManager.getStatistics();
    
    // 期限切れエントリの削除は内部で自動実行される
    
    const afterStats = this.cacheManager.getStatistics();
    const cleaned = beforeStats.totalEntries - afterStats.totalEntries;
    
    if (cleaned > 0) {
      console.log("");
    } else {
      console.log("");
    }
  }
  
  // プライベートメソッド
  
  private async collectAllFiles(targetPath: string): Promise<string[]> {
    const stats = await fs.stat(targetPath).catch(() => null);
    
    if (!stats) {
      throw new Error(`Path does not exist: ${targetPath}`);
    }
    
    if (stats.isFile()) {
      return this.isSupportedFile(targetPath) ? [targetPath] : [];
    } else {
      return this.findAllFilesRecursive(targetPath);
    }
  }
  
  private async findAllFilesRecursive(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      
      const promises = dirents.map(async (dirent) => {
        const fullPath = path.resolve(dir, dirent.name);
        
        if (dirent.isDirectory() && this.shouldProcessDirectory(dirent.name)) {
          return this.findAllFilesRecursive(fullPath);
        } else if (dirent.isFile() && this.isSupportedFile(fullPath)) {
          return [fullPath];
        }
        return [];
      });
      
      const results = await Promise.all(promises);
      files.push(...results.flat());
      
    } catch (error) {
      errorHandler.handleFileError(error, dir, 'read_directory');
    }
    
    return files;
  }
  
  private async analyzeFileWithCache(
    filePath: string, 
    plugins: IPlugin[]
  ): Promise<{issues: Issue[], fromCache: boolean}> {
    let allIssues: Issue[] = [];
    let fromCache = false;
    
    // 各プラグインでキャッシュチェック
    for (const plugin of plugins) {
      if (this.options.enableCache) {
        const cachedResults = await this.cacheManager.get(filePath, plugin.name);
        
        if (cachedResults !== null) {
          allIssues.push(...cachedResults);
          fromCache = true;
          continue;
        }
      }
      
      // キャッシュミス: 実際の分析実行
      let pluginStartTime = 0;
      if (this.options.enablePerformanceMonitoring) {
        pluginStartTime = this.performanceMonitor.startPluginExecution(plugin.name, filePath);
      }
      
      try {
        const issues = await plugin.analyze(filePath);
        allIssues.push(...issues);
        
        // パフォーマンス監視記録
        if (this.options.enablePerformanceMonitoring) {
          this.performanceMonitor.endPluginExecution(plugin.name, filePath, pluginStartTime, issues);
        }
        
        // 結果をキャッシュに保存
        if (this.options.enableCache) {
          await this.cacheManager.set(filePath, plugin.name, issues);
        }
        
      } catch (error) {
        // パフォーマンス監視記録（エラー時）
        if (this.options.enablePerformanceMonitoring) {
          this.performanceMonitor.endPluginExecution(plugin.name, filePath, pluginStartTime, [], error as Error);
        }
        
        errorHandler.handlePluginError(error, plugin.name, 'analyze');
      }
    }
    
    return { issues: allIssues, fromCache };
  }
  
  private isSupportedFile(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.js') || 
           filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
  }
  
  private shouldProcessDirectory(dirName: string): boolean {
    const excludedDirs = [
      'node_modules', 
      '.git', 
      'dist', 
      'build', 
      '.next',
      'coverage',
      '.nyc_output',
      '.rimor-cache'  // キャッシュディレクトリを除外
    ];
    
    if (excludedDirs.includes(dirName)) {
      return false;
    }
    
    if (dirName.startsWith('.')) {
      return false;
    }
    
    return true;
  }
  
  private createResult(
    startTime: number,
    totalFiles: number,
    issues: Issue[],
    cacheStats: CachedAnalysisResult['cacheStats'],
    performanceReport?: PerformanceReport
  ): CachedAnalysisResult {
    return {
      totalFiles,
      issues,
      executionTime: Date.now() - startTime,
      cacheStats,
      performanceReport
    };
  }
  
  private logCacheStatistics(cacheStats: CachedAnalysisResult['cacheStats'], totalFiles: number): void {
    console.log('\n' + "");
    console.log(`  対象ファイル: ${totalFiles}`);
    console.log(`  キャッシュヒット: ${cacheStats.cacheHits}`);
    console.log(`  キャッシュミス: ${cacheStats.cacheMisses}`);
    console.log(`  ヒット率: ${(cacheStats.hitRatio * 100).toFixed(1)}%`);
    console.log(`  キャッシュから取得: ${cacheStats.filesFromCache}ファイル`);
    console.log(`  新規分析: ${cacheStats.filesAnalyzed}ファイル`);
    
    if (cacheStats.filesFromCache > 0) {
      const speedup = ((cacheStats.filesFromCache / totalFiles) * 100).toFixed(1);
      console.log(`  高速化: 約${speedup}%のファイルがキャッシュから高速取得`);
    }
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * キャッシュ統計情報を取得
   */
  getCacheStats(): CachedAnalysisResult['cacheStats'] {
    const stats = this.cacheManager.getStats();
    return {
      cacheHits: stats.hits,
      cacheMisses: stats.misses,
      hitRatio: stats.hitRate,
      filesFromCache: stats.hits,
      filesAnalyzed: stats.misses
    };
  }

  /**
   * 最後の分析時刻を取得
   */
  private lastAnalysisTime: number = 0;
  
  getLastAnalysisTime(): number {
    return this.lastAnalysisTime;
  }
}

// PluginManagerにgetRegisteredPluginsメソッドを追加する必要があります
declare module './pluginManager' {
  interface PluginManager {
    getRegisteredPlugins(): IPlugin[];
  }
}