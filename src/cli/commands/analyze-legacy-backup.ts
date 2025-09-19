import { UnifiedAnalysisEngine } from '../../core/UnifiedAnalysisEngine';
import { ParallelAnalyzer } from '../../core/parallelAnalyzer';
import { CachedAnalyzer } from '../../core/cachedAnalyzer';
import { TestExistencePlugin } from '../../plugins/testExistence';
import { AssertionExistsPlugin } from '../../plugins/assertionExists';
import { OutputFormatter } from '../output';
import { ConfigLoader, RimorConfig } from '../../core/config';
import { errorHandler } from '../../utils/errorHandler';
import { cleanupManager } from '../../utils/cleanupManager';
// v0.4.1 セキュリティ強化
import { CLISecurity, DEFAULT_CLI_SECURITY_LIMITS } from '../../security/CLISecurity';
import { PathSecurity } from '../../utils/pathSecurity';
import { Issue } from '../../core/types';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json';
  parallel?: boolean; // 並列処理モードの有効化
  batchSize?: number; // バッチサイズ（並列モード時のみ）
  concurrency?: number; // 最大同時実行数（並列モード時のみ）
  cache?: boolean; // キャッシュ機能の有効化
  clearCache?: boolean; // キャッシュクリア
  showCacheStats?: boolean; // キャッシュ統計の表示
  performance?: boolean; // パフォーマンス監視の有効化
  showPerformanceReport?: boolean; // パフォーマンスレポートの表示
}

export class AnalyzeCommand {
  private analyzer!: UnifiedAnalysisEngine | ParallelAnalyzer | CachedAnalyzer;
  private config: RimorConfig | null = null;
  private cliSecurity: CLISecurity;

  constructor() {
    this.cliSecurity = new CLISecurity(process.cwd(), DEFAULT_CLI_SECURITY_LIMITS);
  }

  private async initializeWithConfig(targetPath: string, options: AnalyzeOptions): Promise<void> {
    const configLoader = new ConfigLoader();
    this.config = await configLoader.loadConfig(targetPath);

    // キャッシュ機能が有効な場合はCachedAnalyzerを使用
    if (options.cache === undefined || options.cache === true) {
      // デフォルトでキャッシュ有効
      this.analyzer = new CachedAnalyzer({
        enableCache: options.cache === undefined || options.cache === true,
        showCacheStats: options.showCacheStats || options.verbose,
        enablePerformanceMonitoring: options.performance || false,
        showPerformanceReport: options.showPerformanceReport || options.verbose,
      });
    } else if (options.parallel) {
      // キャッシュ無効で並列処理の場合
      this.analyzer = new ParallelAnalyzer({
        batchSize: options.batchSize,
        maxConcurrency: options.concurrency,
        enableStats: options.verbose,
      });
    } else {
      // キャッシュ無効で順次処理の場合
      this.analyzer = new UnifiedAnalysisEngine();
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
    // v0.4.1 セキュリティ強化: CLI引数の包括的検証
    const cliValidation = this.cliSecurity.validateAllArguments({
      path: options.path,
      format: options.format,
    });

    // セキュリティ問題への対応
    if (cliValidation.allSecurityIssues.length > 0) {
      console.error(await OutputFormatter.error('🛡️  セキュリティ問題を検出しました:'));
      for (const issue of cliValidation.allSecurityIssues) {
        console.error(await OutputFormatter.error(`  - ${issue}`));
      }
    }

    // エラーがある場合は実行停止
    if (!cliValidation.isValid) {
      console.error(await OutputFormatter.error('❌ CLI引数の検証に失敗しました:'));
      for (const error of cliValidation.allErrors) {
        console.error(await OutputFormatter.error(`  - ${error}`));
      }
      process.exit(1);
    }

    // 警告の表示
    if (cliValidation.allWarnings.length > 0) {
      console.warn(await OutputFormatter.warning('⚠️  以下の警告があります:'));
      for (const warning of cliValidation.allWarnings) {
        console.warn(await OutputFormatter.warning(`  - ${warning}`));
      }
    }

    // セキュリティ検証済みの引数を使用
    const sanitizedOptions: AnalyzeOptions = {
      ...options,
      path: cliValidation.sanitizedArgs.path || options.path,
      format: (cliValidation.sanitizedArgs.format || options.format) as 'text' | 'json' | undefined,
    };

    // キャッシュクリア処理（最優先）
    if (sanitizedOptions.clearCache) {
      const cachedAnalyzer = new CachedAnalyzer();
      await cachedAnalyzer.clearCache();
      return; // キャッシュクリア後は分析を実行せず終了
    }

    // プロジェクト開始時クリーンアップを実行
    await cleanupManager.performStartupCleanup();

    try {
      const targetPath = path.resolve(sanitizedOptions.path);

      // パスの存在確認（サニタイズ済みパスで再実行）
      if (!fs.existsSync(targetPath)) {
        console.error(await OutputFormatter.error(''));
        process.exit(1);
      }

      // 設定ファイル読み込みとプラグイン初期化（サニタイズ済みオプションを使用）
      await this.initializeWithConfig(targetPath, sanitizedOptions);

      // 出力フォーマット決定（サニタイズ済みオプション > 設定ファイル > デフォルト）
      const format = sanitizedOptions.format || this.config?.output.format || 'text';
      const verbose = sanitizedOptions.verbose ?? this.config?.output.verbose ?? false;

      if (format === 'text') {
        // 単一ファイル対応の確認
        const stats = fs.statSync(targetPath);
        if (stats.isFile()) {
          console.log(await OutputFormatter.info(''));
        }

        console.log(await OutputFormatter.header(''));
        const maskedPath = PathSecurity.toRelativeOrMasked(targetPath);
        console.log(await OutputFormatter.info(''));

        if (verbose) {
          console.log(await OutputFormatter.info(''));
          const enabledPlugins = this.getEnabledPluginNames();
          console.log(await OutputFormatter.info(''));

          if (options.parallel) {
            console.log(await OutputFormatter.info(''));
            console.log(await OutputFormatter.info(''));
            console.log(await OutputFormatter.info(''));
          }

          // キャッシュ機能の表示
          if (options.cache === undefined || options.cache === true) {
            console.log(await OutputFormatter.info('キャッシュ機能: 有効'));
          } else {
            console.log(await OutputFormatter.info('キャッシュ機能: 無効'));
          }

          // パフォーマンス監視の表示
          if (options.performance) {
            console.log(await OutputFormatter.info('パフォーマンス監視: 有効'));
          } else {
            console.log(await OutputFormatter.info('パフォーマンス監視: 無効'));
          }
        }
      }

      const analysisResult = await this.analyzer.analyze(targetPath);

      // analyze()メソッドがIssue[]を返すため、結果を整形
      const result = Array.isArray(analysisResult)
        ? {
            totalFiles: 1, // デフォルト値
            issues: analysisResult,
            executionTime: 0,
          }
        : analysisResult;

      // 結果の表示
      if (format === 'json') {
        const jsonOutput = this.formatAsJson(result, targetPath, sanitizedOptions.parallel);
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        console.log(await OutputFormatter.issueList(result.issues));
        console.log(
          await OutputFormatter.summary(
            result.totalFiles,
            result.issues.length,
            result.executionTime
          )
        );

        // キャッシュ統計の表示（verbose時またはshowCacheStats時）
        if ((verbose || sanitizedOptions.showCacheStats) && 'cacheStats' in result) {
          const cacheStats = (result as any).cacheStats;
          console.log(await OutputFormatter.info('\n📊 キャッシュ統計:'));
          console.log(
            await OutputFormatter.info(`  ヒット率: ${(cacheStats.hitRatio * 100).toFixed(1)}%`)
          );
          console.log(await OutputFormatter.info(`  キャッシュヒット: ${cacheStats.cacheHits}`));
          console.log(await OutputFormatter.info(`  キャッシュミス: ${cacheStats.cacheMisses}`));
          console.log(
            await OutputFormatter.info(`  キャッシュから取得: ${cacheStats.filesFromCache}ファイル`)
          );
          console.log(
            await OutputFormatter.info(`  新規分析: ${cacheStats.filesAnalyzed}ファイル`)
          );
        }

        // 並列処理統計の表示（verbose時のみ）
        if (sanitizedOptions.parallel && verbose && 'parallelStats' in result) {
          const stats = (result as any).parallelStats;
          console.log(await OutputFormatter.info(''));
          console.log(await OutputFormatter.info(''));
          console.log(await OutputFormatter.info(''));
          console.log(await OutputFormatter.info(''));
          console.log(await OutputFormatter.info(''));
        }
      }

      // 終了コード設定
      if (result.issues && result.issues.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      const errorInfo = errorHandler.handleError(error, undefined, '');
      console.error(await OutputFormatter.error(errorInfo.message));
      process.exit(1);
    }
  }

  private getEnabledPluginNames(): string[] {
    if (!this.config) return [];

    return Object.entries(this.config.plugins)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
  }

  private formatAsJson(
    result: {
      totalFiles: number;
      issues: Issue[];
      executionTime?: number;
      cacheStats?: unknown;
      parallelStats?: unknown;
      performanceReport?: unknown;
    },
    targetPath: string,
    isParallel?: boolean
  ): object {
    interface JsonOutput {
      summary: {
        totalFiles: number;
        issuesFound: number;
        testCoverage: number;
        executionTime?: number;
      };
      issues: unknown[];
      targetPath: string;
      config: {
        targetPath: string;
        enabledPlugins: string[];
        format: string;
        processingMode: string;
      };
      performance?: {
        cacheStats?: unknown;
        parallelStats?: unknown;
        processingMode?: string;
        performanceReport?: unknown;
      };
    }

    const jsonOutput: JsonOutput = {
      summary: {
        totalFiles: result.totalFiles,
        issuesFound: result.issues.length,
        testCoverage:
          result.totalFiles > 0
            ? Math.round(
                ((result.totalFiles -
                  result.issues.filter((i: Issue) => i.type === 'missing-test').length) /
                  result.totalFiles) *
                  100
              )
            : 0,
        executionTime: result.executionTime,
      },
      issues: result.issues.map((issue: Issue) => ({
        ...issue,
        plugin: this.getPluginNameFromIssueType(issue.type),
      })),
      targetPath,
      config: {
        targetPath,
        enabledPlugins: this.getEnabledPluginNames(),
        format: 'json',
        processingMode: isParallel ? 'parallel' : 'sequential',
      },
    };

    // パフォーマンス統計の追加
    if (
      'cacheStats' in result ||
      (isParallel && 'parallelStats' in result) ||
      'performanceReport' in result
    ) {
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
