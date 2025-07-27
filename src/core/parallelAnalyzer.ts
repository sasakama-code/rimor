/**
 * 並列ファイル処理対応の分析エンジン
 * v0.3.0: Promise.all()による真の非同期処理実装
 */

import { IPlugin, Issue } from './types';
import { PluginManager } from './pluginManager';
import { errorHandler } from '../utils/errorHandler';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface AnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  parallelStats: {
    batchCount: number;
    avgBatchTime: number;
    maxBatchTime: number;
    concurrencyLevel: number;
  };
}

export interface ParallelOptions {
  batchSize?: number;        // バッチあたりのファイル数（デフォルト: 10）
  maxConcurrency?: number;   // 最大同時実行数（デフォルト: 4）
  enableStats?: boolean;     // 統計情報収集の有効化（デフォルト: true）
}

export class ParallelAnalyzer {
  private pluginManager: PluginManager;
  private options: Required<ParallelOptions>;
  
  constructor(options: ParallelOptions = {}) {
    this.pluginManager = new PluginManager();
    this.pluginManager.setSandboxEnabled(false); // レガシープラグイン対応のためサンドボックス無効化
    this.options = {
      batchSize: options.batchSize ?? 10,
      maxConcurrency: options.maxConcurrency ?? 4,
      enableStats: options.enableStats ?? true
    };
  }
  
  registerPlugin(plugin: IPlugin): void {
    this.pluginManager.register(plugin);
  }
  
  async analyze(targetPath: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const batchTimes: number[] = [];
    
    try {
      // Phase 1: ファイル収集
      const files = await this.collectAllFiles(targetPath);
      
      if (files.length === 0) {
        return {
          totalFiles: 0,
          issues: [],
          executionTime: Date.now() - startTime,
          parallelStats: {
            batchCount: 0,
            avgBatchTime: 0,
            maxBatchTime: 0,
            concurrencyLevel: this.options.maxConcurrency
          }
        };
      }
      
      // Phase 2: バッチ処理による並列分析
      const allIssues: Issue[] = [];
      const batches = this.createBatches(files, this.options.batchSize);
      
      for (const batch of batches) {
        const batchStartTime = Date.now();
        
        // バッチ内のファイルを並列処理
        const batchIssues = await this.processBatchParallel(batch);
        allIssues.push(...batchIssues);
        
        const batchTime = Date.now() - batchStartTime;
        batchTimes.push(batchTime);
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        totalFiles: files.length,
        issues: allIssues,
        executionTime,
        parallelStats: {
          batchCount: batches.length,
          avgBatchTime: batchTimes.length > 0 ? Math.round(batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length) : 0,
          maxBatchTime: batchTimes.length > 0 ? Math.max(...batchTimes) : 0,
          concurrencyLevel: this.options.maxConcurrency
        }
      };
      
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
   * 全ファイルパスを収集（非同期イテレータではなく配列として）
   */
  private async collectAllFiles(targetPath: string): Promise<string[]> {
    const stats = await fs.stat(targetPath).catch(() => null);
    
    if (!stats) {
      throw new Error(`Path does not exist: ${targetPath}`);
    }
    
    if (stats.isFile()) {
      // 単一ファイル処理
      return this.isSupportedFile(targetPath) ? [targetPath] : [];
    } else {
      // ディレクトリ処理
      return this.findAllFilesRecursive(targetPath);
    }
  }
  
  /**
   * ディレクトリから再帰的に全ファイルを収集
   */
  private async findAllFilesRecursive(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      
      // 並列でディレクトリエントリを処理
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
  
  /**
   * ファイル配列をバッチに分割
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
  
  /**
   * バッチ内のファイルを並列処理
   */
  private async processBatchParallel(filePaths: string[]): Promise<Issue[]> {
    // 並列度制御のためのセマフォ実装
    const concurrencyLimit = Math.min(this.options.maxConcurrency, filePaths.length);
    const semaphore = Array(concurrencyLimit).fill(Promise.resolve());
    
    const processingPromises = filePaths.map(async (filePath, index) => {
      // セマフォ取得
      const semaphoreIndex = index % concurrencyLimit;
      await semaphore[semaphoreIndex];
      
      // ファイル処理開始
      const processingPromise = this.processFileParallel(filePath)
        .catch(error => {
          errorHandler.handleFileError(error, filePath, 'analyze');
          return []; // エラー時は空配列を返す
        });
      
      // セマフォ更新
      semaphore[semaphoreIndex] = processingPromise.then(() => {});
      
      return processingPromise;
    });
    
    const results = await Promise.all(processingPromises);
    return results.flat();
  }
  
  /**
   * 単一ファイルの並列プラグイン実行
   */
  private async processFileParallel(filePath: string): Promise<Issue[]> {
    // 従来のpluginManagerを使用（将来的にはプラグインレベル並列処理も検討）
    return this.pluginManager.runAll(filePath);
  }
  
  /**
   * サポートされているファイル拡張子かチェック
   */
  private isSupportedFile(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.js') || 
           filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
  }
  
  /**
   * 処理すべきディレクトリかチェック
   */
  private shouldProcessDirectory(dirName: string): boolean {
    const excludedDirs = [
      'node_modules', 
      '.git', 
      'dist', 
      'build', 
      '.next',
      'coverage',
      '.nyc_output'
    ];
    
    // 除外対象ディレクトリならfalse
    if (excludedDirs.includes(dirName)) {
      return false;
    }
    
    // .で始まるディレクトリは除外（.gitなど）
    if (dirName.startsWith('.')) {
      return false;
    }
    
    return true;
  }
  
  /**
   * パフォーマンス統計の取得
   */
  getPerformanceStats(): {
    recommendedBatchSize: number;
    recommendedConcurrency: number;
  } {
    // 簡単なヒューリスティック推奨値
    return {
      recommendedBatchSize: Math.max(5, Math.min(20, this.options.batchSize)),
      recommendedConcurrency: Math.max(2, Math.min(8, this.options.maxConcurrency))
    };
  }
}