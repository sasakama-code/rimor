/**
 * Unified Analysis Engine
 * v0.8.0 - 3つのAnalyzerを統合し、AST生成機能を追加した新しいエンジン
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import { IAnalysisEngine, AnalysisResult, AnalysisOptions } from './interfaces/IAnalysisEngine';
import { IPluginManager } from './interfaces/IPluginManager';
import { Issue } from './types';
import { findTestFiles } from './fileDiscovery';
import { debug } from '../utils/debug';
import { CacheManager } from './cacheManager';
import { PerformanceMonitor } from './performanceMonitor';
import { WorkerPool } from './workerPool';

/**
 * AST情報
 */
export interface ASTInfo {
  fileName: string;
  sourceFile: ts.SourceFile;
  program?: ts.Program;
}

/**
 * 統合分析エンジン
 * Analyzer, ParallelAnalyzer, CachedAnalyzerの機能を統合
 */
@injectable()
export class UnifiedAnalysisEngine implements IAnalysisEngine {
  private cacheManager: CacheManager;
  private performanceMonitor: PerformanceMonitor;
  private workerPool?: WorkerPool;
  private astCache: Map<string, ASTInfo> = new Map();
  
  constructor(
    @inject(TYPES.PluginManager) private pluginManager: IPluginManager
  ) {
    this.cacheManager = CacheManager.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }
  
  /**
   * 統合分析実行
   */
  async analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // パフォーマンス監視開始
      if (options?.cache || options?.parallel) {
        this.performanceMonitor.startSession();
      }
      
      // ファイル検索
      const files = await this.discoverFiles(targetPath, options);
      
      // 分析実行
      let issues: Issue[];
      if (options?.parallel) {
        issues = await this.analyzeParallel(files, options);
      } else if (options?.cache) {
        issues = await this.analyzeWithCache(files);
      } else {
        issues = await this.analyzeSequential(files);
      }
      
      const executionTime = Date.now() - startTime;
      
      // パフォーマンスレポート生成
      const performanceReport = (options?.cache || options?.parallel) 
        ? this.performanceMonitor.endSession() 
        : null;
      
      return {
        totalFiles: files.length,
        issues,
        executionTime,
        metadata: {
          parallelProcessed: options?.parallel,
          cacheUtilized: options?.cache,
          filesFromCache: performanceReport?.summary?.totalFiles,
          filesAnalyzed: performanceReport?.summary?.totalFiles
        }
      };
    } finally {
      // クリーンアップ
      if (this.workerPool) {
        await this.workerPool.terminate();
        this.workerPool = undefined;
      }
    }
  }
  
  /**
   * AST生成
   */
  async generateAST(filePath: string): Promise<ASTInfo> {
    // キャッシュチェック
    if (this.astCache.has(filePath)) {
      return this.astCache.get(filePath)!;
    }
    
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    const astInfo: ASTInfo = {
      fileName: filePath,
      sourceFile
    };
    
    // キャッシュに保存
    this.astCache.set(filePath, astInfo);
    
    return astInfo;
  }
  
  /**
   * キャッシュクリア
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.invalidateAll();
    this.astCache.clear();
  }
  
  /**
   * ファイル検索
   */
  private async discoverFiles(targetPath: string, options?: AnalysisOptions): Promise<string[]> {
    const stats = await fs.promises.stat(targetPath);
    
    if (stats.isFile()) {
      // 単一ファイル
      if (this.isAnalyzableFile(targetPath)) {
        return [targetPath];
      }
      return [];
    }
    
    // ディレクトリ
    const files: string[] = [];
    for await (const filePath of this.findAllFiles(targetPath, options)) {
      files.push(filePath);
    }
    
    return files;
  }
  
  /**
   * 順次分析
   */
  private async analyzeSequential(files: string[]): Promise<Issue[]> {
    const allIssues: Issue[] = [];
    
    for (const file of files) {
      debug.verbose(`Analyzing file: ${file}`);
      const results = await this.pluginManager.runAll(file);
      
      for (const result of results) {
        allIssues.push(...result.issues);
      }
    }
    
    return allIssues;
  }
  
  /**
   * キャッシュ付き分析
   */
  private async analyzeWithCache(files: string[]): Promise<Issue[]> {
    const allIssues: Issue[] = [];
    
    for (const file of files) {
      // 分析実行
      const results = await this.pluginManager.runAll(file);
      const issues = results.flatMap(r => r.issues);
      allIssues.push(...issues);
    }
    
    return allIssues;
  }
  
  /**
   * 並列分析
   */
  private async analyzeParallel(files: string[], options: AnalysisOptions): Promise<Issue[]> {
    const concurrency = options.concurrency || 4;
    
    // ワーカープール初期化
    if (!this.workerPool) {
      this.workerPool = new WorkerPool(concurrency);
      await this.workerPool.initialize();
    }
    
    // バッチ処理
    const batchSize = Math.ceil(files.length / concurrency);
    const batches: string[][] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    // 並列実行
    const results = await Promise.all(
      batches.map(batch => this.analyzeBatch(batch))
    );
    
    return results.flat();
  }
  
  /**
   * バッチ分析
   */
  private async analyzeBatch(files: string[]): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    for (const file of files) {
      const results = await this.pluginManager.runAll(file);
      issues.push(...results.flatMap(r => r.issues));
    }
    
    return issues;
  }
  
  /**
   * ファイル探索
   */
  private async* findAllFiles(dir: string, options?: AnalysisOptions): AsyncGenerator<string> {
    const { readdir } = await import('fs/promises');
    const { resolve } = await import('path');
    
    const excludePatterns = options?.excludePatterns || ['node_modules', 'dist', 'coverage'];
    const includePatterns = options?.includePatterns;
    
    try {
      const dirents = await readdir(dir, { withFileTypes: true });
      
      for (const dirent of dirents) {
        const fullPath = resolve(dir, dirent.name);
        
        // 除外パターンチェック
        if (excludePatterns.some(pattern => dirent.name.includes(pattern))) {
          continue;
        }
        
        if (dirent.isDirectory()) {
          yield* this.findAllFiles(fullPath, options);
        } else if (dirent.isFile() && this.isAnalyzableFile(dirent.name, includePatterns)) {
          yield fullPath;
        }
      }
    } catch (error) {
      debug.error(`Failed to read directory ${dir}:`, error);
    }
  }
  
  /**
   * 分析可能ファイルかチェック
   */
  private isAnalyzableFile(fileName: string, includePatterns?: string[]): boolean {
    if (includePatterns) {
      return includePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      });
    }
    
    // デフォルト: TypeScript/JavaScriptファイル
    return fileName.endsWith('.ts') || fileName.endsWith('.js') ||
           fileName.endsWith('.tsx') || fileName.endsWith('.jsx');
  }
}