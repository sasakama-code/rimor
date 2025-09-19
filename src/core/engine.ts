/**
 * Unified Analysis Engine
 * v0.8.0 - 3つのAnalyzerを統合し、AST生成機能を追加した新しいエンジン
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '../container/types';
import {
  IAnalysisEngine,
  AnalysisResult,
  AnalysisOptions,
  ASTNode,
} from './interfaces/IAnalysisEngine';
import { IPluginManager } from './interfaces/IPluginManager';
import { Issue, ProjectContext, TestFile } from './types';
import { findTestFiles } from './fileDiscovery';
import { debug } from '../utils/debug';
import { CacheManager } from './cacheManager';
import { PerformanceMonitor } from './performanceMonitor';
import { WorkerPool } from './workerPool';
import { isNodeError, getErrorCode } from '../utils/errorGuards';
import { UnifiedPluginManager } from './UnifiedPluginManager';

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
    @inject(TYPES.PluginManager) private pluginManager: IPluginManager,
    @inject(TYPES.UnifiedPluginManager) private unifiedPluginManager?: UnifiedPluginManager
  ) {
    this.cacheManager = CacheManager.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();

    console.log(`🔧 UnifiedAnalysisEngine constructor: received parameters:`);
    console.log(`   - pluginManager: ${this.pluginManager ? 'available' : 'not available'}`);
    console.log(
      `   - unifiedPluginManager: ${this.unifiedPluginManager ? 'available' : 'not available'}`
    );

    if (this.pluginManager) {
      console.log(`📋 PluginManager plugins: ${this.pluginManager.getPlugins().length}`);
    }

    if (this.unifiedPluginManager) {
      const qualityPluginCount = this.unifiedPluginManager.getQualityPlugins().length;
      console.log(`📋 Quality plugins available: ${qualityPluginCount}`);
    } else {
      console.log(`❌ UnifiedPluginManager is undefined, undefined, or null`);
      console.log(`🔍 Type check: ${typeof this.unifiedPluginManager}`);
      console.log(`🔍 Strict equality: ${this.unifiedPluginManager === undefined}`);
    }
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
      const performanceReport =
        options?.cache || options?.parallel ? this.performanceMonitor.endSession() : null;

      return {
        totalFiles: files.length,
        issues,
        executionTime,
        metadata: {
          parallelProcessed: options?.parallel,
          cacheUtilized: options?.cache,
          filesFromCache: performanceReport?.summary?.totalFiles,
          filesAnalyzed: performanceReport?.summary?.totalFiles,
        },
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
   * AST生成 - 一時的な実装（v0.9.0でTree-sitterに置き換え予定）
   */
  async generateAST(filePath: string): Promise<ASTNode> {
    // 一時的にTypeScript ASTをASTNodeに変換
    const content = await fs.promises.readFile(filePath, 'utf-8');

    return {
      type: 'program',
      text: content,
      startPosition: { row: 0, column: 0 },
      endPosition: { row: content.split('\n').length - 1, column: 0 },
      isNamed: true,
      children: [],
    };
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
    try {
      const stats = await fsPromises.stat(targetPath);

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
    } catch (error: unknown) {
      // ファイルが存在しない場合は空の配列を返す
      if (isNodeError(error) && error.code === 'ENOENT') {
        debug.verbose(`File not found: ${targetPath}, returning empty array`);
        return [];
      }
      throw error;
    }
  }

  /**
   * 順次分析
   * Issue #81対応: レガシープラグインと品質プラグインの両方を実行
   */
  private async analyzeSequential(files: string[]): Promise<Issue[]> {
    const allIssues: Issue[] = [];

    for (const file of files) {
      debug.verbose(`Analyzing file: ${file}`);

      // レガシープラグインの実行
      const legacyResults = await this.pluginManager.runAll(file);
      for (const result of legacyResults) {
        allIssues.push(...result.issues);
      }

      // 品質プラグインの実行（カバレッジ統合機能を含む）
      if (this.unifiedPluginManager) {
        console.log(`🚀 Executing quality plugins for file: ${file}`);
        const qualityIssues = await this.analyzeWithQualityPlugins(file);
        console.log(`✅ Quality plugins returned ${qualityIssues.length} issues`);
        allIssues.push(...qualityIssues);
      } else {
        console.log('⚠️  UnifiedPluginManager not available for quality analysis');
      }
    }

    return allIssues;
  }

  /**
   * 品質プラグインによる分析
   * TestExistencePluginのevaluateQualityメソッドが呼ばれる
   */
  private async analyzeWithQualityPlugins(filePath: string): Promise<Issue[]> {
    if (!this.unifiedPluginManager) {
      return [];
    }

    try {
      // プロジェクトコンテキストの作成
      const projectContext: ProjectContext = {
        rootPath: path.dirname(filePath),
        testFramework: 'jest', // デフォルト値
        dependencies: {},
      };

      // テストファイル情報の作成
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const testFile: TestFile = {
        path: filePath,
        content: fileContent,
      };

      // 品質分析の実行（ここでTestQualityIntegratorが使用される）
      debug.verbose(`Running quality analysis for file: ${filePath}`);
      const qualityResult = await this.unifiedPluginManager.runQualityAnalysis(
        testFile,
        projectContext
      );

      debug.verbose(
        `Quality analysis completed. Plugin results: ${qualityResult.pluginResults.length}`
      );

      // 品質結果からIssueを生成
      const issues: Issue[] = [];
      for (const pluginResult of qualityResult.pluginResults) {
        debug.verbose(
          `Plugin ${pluginResult.pluginId}: score=${pluginResult.qualityScore.overall}, error=${pluginResult.error}`
        );

        if (pluginResult.error) {
          // エラーがある場合はIssueとして記録
          debug.warn(`Plugin error for ${pluginResult.pluginId}: ${pluginResult.error}`);
          issues.push({
            id: `quality-${pluginResult.pluginId}-${Date.now()}`,
            type: 'quality-issue',
            severity: 'medium',
            message: `品質プラグイン ${pluginResult.pluginName}: ${pluginResult.error}`,
            filePath: filePath,
            category: 'test-quality',
          });
        } else if (pluginResult.qualityScore.overall < 50) {
          // 低品質の場合はIssueとして記録
          debug.info(`Low quality detected: ${pluginResult.qualityScore.overall} < 50`);
          issues.push({
            id: `quality-${pluginResult.pluginId}-${Date.now()}`,
            type: 'low-quality',
            severity: 'high',
            message: `テスト品質が低い (スコア: ${pluginResult.qualityScore.overall})`,
            filePath: filePath,
            category: 'test-quality',
          });
        } else {
          debug.verbose(`Quality score ${pluginResult.qualityScore.overall} is acceptable (>=50)`);
        }
      }

      return issues;
    } catch (error) {
      debug.error(`Failed to analyze with quality plugins: ${error}`);
      return [];
    }
  }

  /**
   * キャッシュ付き分析
   * Issue #81対応: レガシープラグインと品質プラグインの両方を実行
   */
  private async analyzeWithCache(files: string[]): Promise<Issue[]> {
    const allIssues: Issue[] = [];

    console.log(`🔍 Starting cache-based analysis of ${files.length} files`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (i < 5 || i % 1000 === 0) {
        console.log(`📁 Analyzing file ${i + 1}/${files.length}: ${file}`);
      }

      // レガシープラグインの実行
      const results = await this.pluginManager.runAll(file);
      const issues = results.flatMap(r => r.issues);

      if (issues.length > 0 && i < 10) {
        console.log(`🐛 Found ${issues.length} issues from legacy plugins in file: ${file}`);
      }

      allIssues.push(...issues);

      // 品質プラグインの実行
      if (this.unifiedPluginManager) {
        const qualityIssues = await this.analyzeWithQualityPlugins(file);

        if (qualityIssues.length > 0 && i < 10) {
          console.log(`🎯 Found ${qualityIssues.length} quality issues in file: ${file}`);
        }

        allIssues.push(...qualityIssues);
      } else if (i < 5) {
        console.log(`⚠️  UnifiedPluginManager not available for file: ${file}`);
      }
    }

    console.log(
      `📊 Cache-based analysis completed: ${allIssues.length} total issues found from ${files.length} files`
    );

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
    const results = await Promise.all(batches.map(batch => this.analyzeBatch(batch)));

    return results.flat();
  }

  /**
   * バッチ分析
   * Issue #81対応: レガシープラグインと品質プラグインの両方を実行
   */
  private async analyzeBatch(files: string[]): Promise<Issue[]> {
    const issues: Issue[] = [];

    for (const file of files) {
      // レガシープラグインの実行
      const results = await this.pluginManager.runAll(file);
      issues.push(...results.flatMap(r => r.issues));

      // 品質プラグインの実行
      if (this.unifiedPluginManager) {
        const qualityIssues = await this.analyzeWithQualityPlugins(file);
        issues.push(...qualityIssues);
      }
    }

    return issues;
  }

  /**
   * ファイル探索
   */
  private async *findAllFiles(dir: string, options?: AnalysisOptions): AsyncGenerator<string> {
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
    return (
      fileName.endsWith('.ts') ||
      fileName.endsWith('.js') ||
      fileName.endsWith('.tsx') ||
      fileName.endsWith('.jsx')
    );
  }
}
