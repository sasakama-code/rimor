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
// v0.4.0 スコアリング機能
import { ScoreCalculatorV2 } from '../../scoring/calculator';
import { ScoreAggregator } from '../../scoring/aggregator';
import { WeightsManager } from '../../scoring/weights';
import { ReportGenerator } from '../../scoring/reports';
import { CliFormatter, JsonFormatter, CsvFormatter, HtmlFormatter } from '../../scoring/formatters';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'csv' | 'html';
  parallel?: boolean;       // 並列処理モードの有効化
  batchSize?: number;       // バッチサイズ（並列モード時のみ）
  concurrency?: number;     // 最大同時実行数（並列モード時のみ）
  cache?: boolean;          // キャッシュ機能の有効化
  clearCache?: boolean;     // キャッシュクリア
  showCacheStats?: boolean; // キャッシュ統計の表示
  performance?: boolean;    // パフォーマンス監視の有効化
  showPerformanceReport?: boolean; // パフォーマンスレポートの表示
  // v0.4.0 スコアリング機能
  scoring?: boolean;        // 品質スコア計算の有効化
  reportType?: 'summary' | 'detailed' | 'trend'; // レポートタイプ
  noColor?: boolean;        // カラー出力の無効化
  outputFile?: string;      // 出力ファイルパス
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
      
      // v0.4.0 スコアリング機能
      if (options.scoring) {
        await this.generateScoringReport(result, targetPath, options);
        return;
      }
      
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

  /**
   * v0.4.0 スコアリングレポート生成
   */
  private async generateScoringReport(result: any, targetPath: string, options: AnalyzeOptions): Promise<void> {
    try {
      // プラグイン結果をスコアリング用形式に変換
      const pluginResultsMap = this.convertToPluginResults(result, targetPath);
      
      // 重み設定を読み込み
      const weightsManager = new WeightsManager();
      const weights = await weightsManager.loadWeights(targetPath);
      
      // スコア計算とプロジェクト階層構築
      const calculator = new ScoreCalculatorV2();
      const aggregator = new ScoreAggregator(calculator);
      const projectScore = aggregator.buildCompleteHierarchy(pluginResultsMap, weights);
      
      // レポート生成
      const reportGenerator = new ReportGenerator();
      let report: any;
      
      switch (options.reportType) {
        case 'detailed':
          report = reportGenerator.generateDetailedReport(projectScore);
          break;
        case 'trend':
          // TODO: 履歴データの実装
          const mockHistoricalData: any[] = [];
          report = reportGenerator.generateTrendReport(projectScore, mockHistoricalData);
          break;
        case 'summary':
        default:
          report = reportGenerator.generateSummaryReport(projectScore);
          break;
      }
      
      // フォーマット別出力
      const useColors = !options.noColor;
      let formattedOutput: string;
      
      switch (options.format) {
        case 'json':
          const jsonFormatter = new JsonFormatter();
          formattedOutput = options.reportType === 'detailed' 
            ? jsonFormatter.formatDetailedReport(report)
            : options.reportType === 'trend'
            ? jsonFormatter.formatTrendReport(report)
            : jsonFormatter.formatSummaryReport(report);
          break;
        case 'csv':
          const csvFormatter = new CsvFormatter();
          formattedOutput = options.reportType === 'detailed'
            ? csvFormatter.formatDetailedReport(report)
            : options.reportType === 'trend'
            ? csvFormatter.formatTrendReport(report)
            : csvFormatter.formatSummaryReport(report);
          break;
        case 'html':
          const htmlFormatter = new HtmlFormatter();
          formattedOutput = options.reportType === 'detailed'
            ? htmlFormatter.formatDetailedReport(report)
            : options.reportType === 'trend'
            ? htmlFormatter.formatTrendReport(report)
            : htmlFormatter.formatSummaryReport(report);
          break;
        case 'text':
        default:
          const cliFormatter = new CliFormatter(useColors);
          formattedOutput = options.reportType === 'detailed'
            ? cliFormatter.formatDetailedReport(report)
            : options.reportType === 'trend'
            ? cliFormatter.formatTrendReport(report)
            : cliFormatter.formatSummaryReport(report);
          break;
      }
      
      // 出力処理
      if (options.outputFile) {
        fs.writeFileSync(options.outputFile, formattedOutput, 'utf-8');
        console.log(OutputFormatter.success(`レポートを ${options.outputFile} に出力しました`));
      } else {
        console.log(formattedOutput);
      }
      
      // 品質スコアベースの終了コード
      if (projectScore.overallScore < 60) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(OutputFormatter.error(`スコアリングレポート生成エラー: ${error}`));
      process.exit(1);
    }
  }

  /**
   * 従来の分析結果をプラグイン結果形式に変換
   */
  private convertToPluginResults(result: any, targetPath: string): Map<string, any[]> {
    const pluginResultsMap = new Map<string, any[]>();
    
    // ファイルごとにプラグイン結果をグループ化
    const fileMap = new Map<string, any[]>();
    
    result.issues.forEach((issue: any) => {
      const filePath = issue.file || 'unknown';
      if (!fileMap.has(filePath)) {
        fileMap.set(filePath, []);
      }
      
      const pluginResult = {
        pluginId: this.getPluginNameFromIssueType(issue.type),
        pluginName: this.getPluginDisplayName(issue.type),
        score: this.issueToScore(issue),
        weight: 1.0,
        issues: [issue],
        metadata: {
          line: issue.line,
          severity: issue.severity || 'medium'
        }
      };
      
      fileMap.get(filePath)!.push(pluginResult);
    });
    
    // Map形式に変換
    fileMap.forEach((results, filePath) => {
      pluginResultsMap.set(filePath, results);
    });
    
    return pluginResultsMap;
  }

  /**
   * 課題をスコアに変換（簡略版）
   */
  private issueToScore(issue: any): number {
    switch (issue.severity || 'medium') {
      case 'error':
      case 'high':
        return 30;
      case 'warning':
      case 'medium':
        return 60;
      case 'info':
      case 'low':
        return 80;
      default:
        return 70;
    }
  }

  /**
   * プラグイン表示名を取得
   */
  private getPluginDisplayName(issueType: string): string {
    switch (issueType) {
      case 'missing-test':
        return 'Test Existence';
      case 'missing-assertion':
        return 'Assertion Exists';
      default:
        return 'Unknown Plugin';
    }
  }
}