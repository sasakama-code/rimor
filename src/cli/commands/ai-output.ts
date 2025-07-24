import { Analyzer } from '../../core/analyzer';
import { ParallelAnalyzer } from '../../core/parallelAnalyzer';
import { CachedAnalyzer } from '../../core/cachedAnalyzer';
import { TestExistencePlugin } from '../../plugins/testExistence';
import { AssertionExistsPlugin } from '../../plugins/assertionExists';
import { AIOptimizedFormatter } from '../../ai-output/formatter';
import { FormatterOptions, EnhancedAnalysisResult } from '../../ai-output/types';
import { ConfigLoader, RimorConfig } from '../../core/config';
import { errorHandler } from '../../utils/errorHandler';
import { OutputFormatter } from '../output';
import { getMessage } from '../../i18n/messages';
import { ScoreCalculatorV2 } from '../../scoring/calculator';
import { ScoreAggregator } from '../../scoring/aggregator';
import { WeightsManager } from '../../scoring/weights';
import * as fs from 'fs';
import * as path from 'path';

export interface AIOutputOptions {
  path: string;
  format?: 'json' | 'markdown';
  output?: string;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  optimizeForAI?: boolean;
  maxTokens?: number;
  maxFileSize?: number;
  verbose?: boolean;
  // 既存のanalyzer設定
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
}

/**
 * AI向け出力コマンド v0.5.0
 * 分析結果をAIツールが理解しやすい形式で出力
 */
export class AIOutputCommand {
  private formatter: AIOptimizedFormatter;
  private analyzer!: Analyzer | ParallelAnalyzer | CachedAnalyzer;
  private config: RimorConfig | null = null;

  constructor() {
    this.formatter = new AIOptimizedFormatter();
  }

  /**
   * AI向け出力コマンドの実行
   */
  async execute(options: AIOutputOptions): Promise<void> {
    try {
      // 入力検証
      this.validateOptions(options);

      const targetPath = path.resolve(options.path);
      
      // パスの存在確認
      if (!fs.existsSync(targetPath)) {
        throw new Error(`プロジェクトパスが存在しません: ${targetPath}`);
      }

      if (options.verbose) {
        console.log(OutputFormatter.header('Rimor AI向け出力生成'));
        console.log(OutputFormatter.info(`対象パス: ${targetPath}`));
        console.log(OutputFormatter.info(`出力形式: ${options.format || 'json'}`));
      }

      // Analyzerの初期化と分析実行
      await this.initializeAnalyzer(targetPath, options);
      const analysisResult = await this.analyzer.analyze(targetPath);

      // スコアリング情報の追加
      const enhancedResult = await this.enhanceWithScoring(analysisResult, targetPath, options);

      // AI向けフォーマット設定
      const formatterOptions: FormatterOptions = {
        format: options.format || 'json',
        includeContext: options.includeContext,
        includeSourceCode: options.includeSourceCode,
        optimizeForAI: options.optimizeForAI,
        maxTokens: options.maxTokens,
        maxFileSize: options.maxFileSize
      };

      // フォーマットと出力
      await this.generateOutput(enhancedResult, targetPath, formatterOptions, options);

      if (options.verbose) {
        console.log(OutputFormatter.success('AI向け出力生成が完了しました'));
      }

    } catch (error) {
      const errorInfo = errorHandler.handleError(
        error,
        undefined,
        'AI向け出力生成に失敗しました'
      );
      console.error(OutputFormatter.error(errorInfo.message));
      throw error;
    }
  }

  /**
   * オプション検証
   */
  private validateOptions(options: AIOutputOptions): void {
    if (!options.path) {
      throw new Error('path オプションは必須です');
    }

    if (options.format && !['json', 'markdown'].includes(options.format)) {
      throw new Error('format は json または markdown である必要があります');
    }

    if (options.maxTokens && (options.maxTokens < 100 || options.maxTokens > 100000)) {
      throw new Error('maxTokens は 100 から 100000 の間である必要があります');
    }

    if (options.maxFileSize && (options.maxFileSize < 1000 || options.maxFileSize > 100 * 1024 * 1024)) {
      throw new Error('maxFileSize は 1KB から 100MB の間である必要があります');
    }
  }

  /**
   * Analyzerの初期化
   */
  private async initializeAnalyzer(targetPath: string, options: AIOutputOptions): Promise<void> {
    const configLoader = new ConfigLoader();
    this.config = await configLoader.loadConfig(targetPath);
    
    // キャッシュ機能が有効な場合はCachedAnalyzerを使用
    if (options.cache === undefined || options.cache === true) {
      this.analyzer = new CachedAnalyzer({
        enableCache: true,
        showCacheStats: options.verbose || false,
        enablePerformanceMonitoring: false,
        showPerformanceReport: false
      });
    } else if (options.parallel) {
      this.analyzer = new ParallelAnalyzer({
        batchSize: options.batchSize,
        maxConcurrency: options.concurrency,
        enableStats: options.verbose
      });
    } else {
      this.analyzer = new Analyzer();
    }
    
    // プラグインの動的登録
    await this.registerPlugins();
  }

  /**
   * プラグインの登録
   */
  private async registerPlugins(): Promise<void> {
    if (!this.config) return;
    
    for (const [pluginName, pluginConfig] of Object.entries(this.config.plugins)) {
      if (!pluginConfig.enabled) continue;
      
      try {
        if (pluginName === 'test-existence') {
          const { TestExistencePlugin } = await import('../../plugins/testExistence');
          this.analyzer.registerPlugin(new TestExistencePlugin(pluginConfig));
        } else if (pluginName === 'assertion-exists') {
          const { AssertionExistsPlugin } = await import('../../plugins/assertionExists');
          this.analyzer.registerPlugin(new AssertionExistsPlugin());
        }
      } catch (error) {
        errorHandler.handlePluginError(error, pluginName, 'load');
      }
    }
  }

  /**
   * スコアリング情報でAnalysisResultを拡張
   */
  private async enhanceWithScoring(
    result: any, 
    targetPath: string, 
    options: AIOutputOptions
  ): Promise<EnhancedAnalysisResult> {
    try {
      // プラグイン結果をスコアリング用形式に変換
      const pluginResultsMap = this.convertToPluginResults(result, targetPath);
      
      // 重み設定を読み込み
      const weightsManager = new WeightsManager();
      const weights = await weightsManager.loadWeights(targetPath);
      
      // スコア計算
      const calculator = new ScoreCalculatorV2();
      const aggregator = new ScoreAggregator(calculator);
      const projectScore = aggregator.buildCompleteHierarchy(pluginResultsMap, weights);

      return {
        ...result,
        projectScore,
        fileScores: projectScore.fileScores,
        projectContext: {
          rootPath: targetPath,
          language: this.detectProjectLanguage(targetPath),
          testFramework: this.detectTestFramework(targetPath),
          filePatterns: {
            test: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
            source: ['**/*.{js,ts}'],
            ignore: ['node_modules/**', 'dist/**']
          }
        }
      };
    } catch (error) {
      // スコアリングに失敗した場合は基本情報のみ返す
      if (options.verbose) {
        console.warn(OutputFormatter.warning('スコアリング情報の取得に失敗しました'));
      }
      
      return {
        ...result,
        projectContext: {
          rootPath: targetPath,
          language: this.detectProjectLanguage(targetPath),
          testFramework: this.detectTestFramework(targetPath),
          filePatterns: {
            test: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
            source: ['**/*.{js,ts}'],
            ignore: ['node_modules/**', 'dist/**']
          }
        }
      };
    }
  }

  /**
   * 出力生成と保存
   */
  private async generateOutput(
    result: EnhancedAnalysisResult,
    targetPath: string,
    formatterOptions: FormatterOptions,
    options: AIOutputOptions
  ): Promise<void> {
    let output: string;

    // フォーマット別出力生成
    if (formatterOptions.format === 'markdown') {
      output = await this.formatter.formatAsMarkdown(result, targetPath, formatterOptions);
    } else {
      const jsonOutput = await this.formatter.formatAsJSON(result, targetPath, formatterOptions);
      output = JSON.stringify(jsonOutput, null, 2);
    }

    // 出力先の決定と保存
    if (options.output) {
      // ファイルに出力
      const outputPath = path.resolve(options.output);
      const outputDir = path.dirname(outputPath);
      
      // 出力ディレクトリが存在しない場合は作成
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, output, 'utf-8');
      
      if (options.verbose) {
        console.log(OutputFormatter.success(`出力ファイル: ${outputPath}`));
        console.log(OutputFormatter.info(`出力サイズ: ${(output.length / 1024).toFixed(2)} KB`));
      }
    } else {
      // コンソールに出力
      console.log(output);
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
        pluginId: this.getPluginIdFromIssueType(issue.type),
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
   * ヘルパーメソッド群
   */
  private detectProjectLanguage(projectPath: string): string {
    const tsConfigPath = path.join(projectPath, 'tsconfig.json');
    return fs.existsSync(tsConfigPath) ? 'typescript' : 'javascript';
  }

  private detectTestFramework(projectPath: string): string {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    try {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
          return 'jest';
        } else if (packageJson.devDependencies?.mocha || packageJson.dependencies?.mocha) {
          return 'mocha';
        }
      }
    } catch (error) {
      // エラーは無視
    }
    
    return 'unknown';
  }

  private getPluginIdFromIssueType(type: string): string {
    switch (type) {
      case 'missing-test':
        return 'test-existence';
      case 'missing-assertion':
        return 'assertion-exists';
      default:
        return 'unknown';
    }
  }

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
}