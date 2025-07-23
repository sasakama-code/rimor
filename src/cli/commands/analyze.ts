import { Analyzer } from '../../core/analyzer';
import { ParallelAnalyzer } from '../../core/parallelAnalyzer';
import { CachedAnalyzer } from '../../core/cachedAnalyzer';
import { TestExistencePlugin } from '../../plugins/testExistence';
import { AssertionExistsPlugin } from '../../plugins/assertionExists';
import { OutputFormatter } from '../output';
import { ConfigLoader, RimorConfig } from '../../core/config';
import { errorHandler } from '../../utils/errorHandler';
import { cleanupManager } from '../../utils/cleanupManager';
import { getMessage } from '../../i18n/messages';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json';
  parallel?: boolean;       // 並列処理モードの有効化
  batchSize?: number;       // バッチサイズ（並列モード時のみ）
  concurrency?: number;     // 最大同時実行数（並列モード時のみ）
  cache?: boolean;          // キャッシュ機能の有効化
  clearCache?: boolean;     // キャッシュクリア
  showCacheStats?: boolean; // キャッシュ統計の表示
  performance?: boolean;    // パフォーマンス監視の有効化
  showPerformanceReport?: boolean; // パフォーマンスレポートの表示
}

export class AnalyzeCommand {
  private analyzer!: Analyzer | ParallelAnalyzer | CachedAnalyzer;
  private config: RimorConfig | null = null;
  
  private async initializeWithConfig(targetPath: string, options: AnalyzeOptions): Promise<void> {
    const configLoader = new ConfigLoader();
    this.config = await configLoader.loadConfig(targetPath);
    
    // キャッシュ機能が有効な場合はCachedAnalyzerを使用
    if (options.cache === undefined || options.cache === true) {  // デフォルトでキャッシュ有効
      this.analyzer = new CachedAnalyzer({
        enableCache: options.cache === undefined || options.cache === true,
        showCacheStats: options.showCacheStats || options.verbose,
        enablePerformanceMonitoring: options.performance || false,
        showPerformanceReport: options.showPerformanceReport || options.verbose
      });
    } else if (options.parallel) {
      // キャッシュ無効で並列処理の場合
      this.analyzer = new ParallelAnalyzer({
        batchSize: options.batchSize,
        maxConcurrency: options.concurrency,
        enableStats: options.verbose
      });
    } else {
      // キャッシュ無効で順次処理の場合
      this.analyzer = new Analyzer();
    }
    
    // 設定に基づいて動的にプラグインを登録
    await this.registerPluginsDynamically();
  }
  
  private async registerPluginsDynamically(): Promise<void> {
    if (!this.config) return;
    
    for (const [pluginName, pluginConfig] of Object.entries(this.config.plugins)) {
      if (!pluginConfig.enabled) continue;
      
      try {
        // レガシープラグインの読み込み
        if (pluginName === 'test-existence') {
          const { TestExistencePlugin } = await import('../../plugins/testExistence');
          this.analyzer.registerPlugin(new TestExistencePlugin(pluginConfig));
        } else if (pluginName === 'assertion-exists') {
          const { AssertionExistsPlugin } = await import('../../plugins/assertionExists');
          this.analyzer.registerPlugin(new AssertionExistsPlugin());
        }
        // 将来的なコアプラグインの対応は今後のフェーズで実装
        
      } catch (error) {
        errorHandler.handlePluginError(error, pluginName, 'load');
      }
    }
  }
  
  async execute(options: AnalyzeOptions): Promise<void> {
    // キャッシュクリア処理（最優先）
    if (options.clearCache) {
      const cachedAnalyzer = new CachedAnalyzer();
      await cachedAnalyzer.clearCache();
      return; // キャッシュクリア後は分析を実行せず終了
    }
    
    // プロジェクト開始時クリーンアップを実行
    await cleanupManager.performStartupCleanup();
    
    try {
      const targetPath = path.resolve(options.path);
      
      // パスの存在確認
      if (!fs.existsSync(targetPath)) {
        console.error(OutputFormatter.error(getMessage('cli.error.path_not_found', { targetPath })));
        process.exit(1);
      }
      
      // 設定ファイル読み込みとプラグイン初期化
      await this.initializeWithConfig(targetPath, options);
      
      // 出力フォーマット決定（オプション > 設定ファイル > デフォルト）
      const format = options.format || this.config?.output.format || 'text';
      const verbose = options.verbose ?? this.config?.output.verbose ?? false;
      
      if (format === 'text') {
        // 単一ファイル対応の確認
        const stats = fs.statSync(targetPath);
        if (stats.isFile()) {
          console.log(OutputFormatter.info(getMessage('analysis.mode.single_file')));
        }
        
        console.log(OutputFormatter.header(getMessage('analysis.header.main')));
        console.log(OutputFormatter.info(getMessage('analysis.info.target_path', { path: targetPath })));
        
        if (verbose) {
          console.log(OutputFormatter.info(getMessage('analysis.mode.verbose')));
          const enabledPlugins = this.getEnabledPluginNames();
          console.log(OutputFormatter.info(getMessage('analysis.info.enabled_plugins', { plugins: enabledPlugins.join(', ') })));
          
          if (options.parallel) {
            console.log(OutputFormatter.info(getMessage('analysis.mode.parallel')));
            console.log(OutputFormatter.info(getMessage('analysis.info.batch_size', { size: (options.batchSize || 10).toString() })));
            console.log(OutputFormatter.info(getMessage('analysis.info.max_concurrency', { count: (options.concurrency || 4).toString() })));
          }
          
          // キャッシュ機能の表示
          if (options.cache === undefined || options.cache === true) {
            console.log(OutputFormatter.info('キャッシュ機能: 有効'));
          } else {
            console.log(OutputFormatter.info('キャッシュ機能: 無効'));
          }
          
          // パフォーマンス監視の表示
          if (options.performance) {
            console.log(OutputFormatter.info('パフォーマンス監視: 有効'));
          } else {
            console.log(OutputFormatter.info('パフォーマンス監視: 無効'));
          }
        }
      }
      
      const result = await this.analyzer.analyze(targetPath);
      
      // 結果の表示
      if (format === 'json') {
        const jsonOutput = this.formatAsJson(result, targetPath, options.parallel);
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        console.log(OutputFormatter.issueList(result.issues));
        console.log(OutputFormatter.summary(result.totalFiles, result.issues.length, result.executionTime));
        
        // キャッシュ統計の表示（verbose時またはshowCacheStats時）
        if ((verbose || options.showCacheStats) && 'cacheStats' in result) {
          const cacheStats = (result as any).cacheStats;
          console.log(OutputFormatter.info('\n📊 キャッシュ統計:'));
          console.log(OutputFormatter.info(`  ヒット率: ${(cacheStats.hitRatio * 100).toFixed(1)}%`));
          console.log(OutputFormatter.info(`  キャッシュヒット: ${cacheStats.cacheHits}`));
          console.log(OutputFormatter.info(`  キャッシュミス: ${cacheStats.cacheMisses}`));
          console.log(OutputFormatter.info(`  キャッシュから取得: ${cacheStats.filesFromCache}ファイル`));
          console.log(OutputFormatter.info(`  新規分析: ${cacheStats.filesAnalyzed}ファイル`));
        }
        
        // 並列処理統計の表示（verbose時のみ）
        if (options.parallel && verbose && 'parallelStats' in result) {
          const stats = (result as any).parallelStats;
          console.log(OutputFormatter.info(getMessage('analysis.stats.parallel_header')));
          console.log(OutputFormatter.info(getMessage('analysis.stats.batch_count', { count: stats.batchCount.toString() })));
          console.log(OutputFormatter.info(getMessage('analysis.stats.avg_batch_time', { time: stats.avgBatchTime.toString() })));
          console.log(OutputFormatter.info(getMessage('analysis.stats.max_batch_time', { time: stats.maxBatchTime.toString() })));
          console.log(OutputFormatter.info(getMessage('analysis.stats.concurrency_level', { level: stats.concurrencyLevel.toString() })));
        }
      }
      
      // 終了コード設定
      if (result.issues.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      const errorInfo = errorHandler.handleError(
        error,
        undefined,
        getMessage('cli.error.analysis_failed')
      );
      console.error(OutputFormatter.error(errorInfo.message));
      process.exit(1);
    }
  }
  
  private getEnabledPluginNames(): string[] {
    if (!this.config) return [];
    
    return Object.entries(this.config.plugins)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
  }
  
  private formatAsJson(result: any, targetPath: string, isParallel?: boolean): object {
    const jsonOutput: any = {
      summary: {
        totalFiles: result.totalFiles,
        issuesFound: result.issues.length,
        testCoverage: result.totalFiles > 0 ? Math.round(((result.totalFiles - result.issues.filter((i: any) => i.type === 'missing-test').length) / result.totalFiles) * 100) : 0,
        executionTime: result.executionTime
      },
      issues: result.issues.map((issue: any) => ({
        ...issue,
        plugin: this.getPluginNameFromIssueType(issue.type)
      })),
      config: {
        targetPath,
        enabledPlugins: this.getEnabledPluginNames(),
        format: 'json',
        processingMode: isParallel ? 'parallel' : 'sequential'
      }
    };
    
    // パフォーマンス統計の追加
    if ('cacheStats' in result || (isParallel && 'parallelStats' in result) || 'performanceReport' in result) {
      jsonOutput.performance = {};
      
      if ('cacheStats' in result) {
        jsonOutput.performance.cacheStats = result.cacheStats;
      }
      
      if (isParallel && 'parallelStats' in result) {
        jsonOutput.performance.parallelStats = result.parallelStats;
        jsonOutput.performance.processingMode = 'parallel';
      }
      
      if ('performanceReport' in result && result.performanceReport) {
        jsonOutput.performance.performanceReport = result.performanceReport;
      }
    }
    
    return jsonOutput;
  }
  
  private getPluginNameFromIssueType(type: string): string {
    switch (type) {
      case 'missing-test':
        return 'test-existence';
      case 'missing-assertion':
        return 'assertion-exists';
      default:
        return 'unknown';
    }
  }
}