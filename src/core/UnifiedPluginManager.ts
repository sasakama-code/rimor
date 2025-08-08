import { 
  IPlugin, 
  ITestQualityPlugin, 
  Issue, 
  ProjectContext, 
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  PluginResult
} from './types';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import * as fs from 'fs';
import * as path from 'path';

export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
  aggregatedScore?: QualityScore;
}

export interface AnalysisOptions {
  timeout?: number;
  skipPlugins?: string[];
}

export interface UnifiedAnalysisResult {
  legacyIssues: Issue[];
  qualityResults: QualityAnalysisResult;
  combinedScore?: number;
}

/**
 * UnifiedPluginManager v0.9.0
 * PluginManagerとPluginManagerExtendedの統合実装
 * SOLID原則に準拠した設計
 */
export class UnifiedPluginManager {
  private legacyPlugins: IPlugin[] = [];
  private qualityPlugins: ITestQualityPlugin[] = [];
  private projectRoot: string;
  private readonly defaultTimeout = 60000;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * レガシープラグイン（IPlugin）の登録
   * pluginManager.tsの機能を継承
   */
  registerLegacy(plugin: IPlugin): void {
    // プラグイン名の検証
    if (!plugin.name || typeof plugin.name !== 'string') {
      errorHandler.handleError(
        new Error('プラグイン名が不正です'),
        ErrorType.PLUGIN_ERROR,
        'プラグインの登録に失敗しました',
        { pluginName: plugin.name }
      );
      return;
    }

    // プラグイン名の安全性チェック
    if (!/^[a-zA-Z0-9_-]+$/.test(plugin.name)) {
      errorHandler.handleError(
        new Error(`不正なプラグイン名: ${plugin.name}`),
        ErrorType.PLUGIN_ERROR,
        'プラグイン名に使用禁止文字が含まれています',
        { pluginName: plugin.name }
      );
      return;
    }

    this.legacyPlugins.push(plugin);
  }

  /**
   * 品質プラグイン（ITestQualityPlugin）の登録
   * pluginManagerExtended.tsの機能を継承
   */
  registerQuality(plugin: ITestQualityPlugin): void {
    this.qualityPlugins.push(plugin);
  }

  /**
   * 後方互換性のためのエイリアス
   */
  register(plugin: IPlugin): void {
    this.registerLegacy(plugin);
  }

  registerPlugin(plugin: ITestQualityPlugin): void {
    this.registerQuality(plugin);
  }

  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.registerQuality(plugin);
  }

  registerLegacyPlugin(plugin: IPlugin): void {
    this.registerLegacy(plugin);
  }

  /**
   * レガシープラグインの取得
   */
  getLegacyPlugins(): IPlugin[] {
    return [...this.legacyPlugins];
  }

  /**
   * 品質プラグインの取得
   */
  getQualityPlugins(): ITestQualityPlugin[] {
    return [...this.qualityPlugins];
  }

  /**
   * 後方互換性のためのエイリアス
   */
  getPlugins(): IPlugin[] | ITestQualityPlugin[] {
    // 呼び出し元のコンテキストに応じて適切なプラグインを返す
    // デフォルトはレガシープラグイン
    return this.getLegacyPlugins();
  }

  /**
   * レガシープラグインの実行
   * pluginManager.tsの機能を継承
   */
  async runLegacyPlugins(filePath: string): Promise<Issue[]> {
    const issues: Issue[] = [];

    for (const plugin of this.legacyPlugins) {
      try {
        const pluginIssues = await plugin.analyze(filePath);
        issues.push(...pluginIssues);
      } catch (error) {
        errorHandler.handleError(
          error as Error,
          ErrorType.PLUGIN_ERROR,
          `プラグイン ${plugin.name} の実行中にエラーが発生しました`,
          { pluginName: plugin.name, filePath }
        );
      }
    }

    return issues;
  }

  /**
   * 後方互換性のためのエイリアス
   * parallelAnalyzer.ts等から使用される
   */
  async runAll(filePath: string): Promise<Issue[]> {
    return this.runLegacyPlugins(filePath);
  }

  /**
   * 品質分析の実行
   * pluginManagerExtended.tsの機能を継承
   */
  async runQualityAnalysis(
    testFile: TestFile,
    context: ProjectContext,
    options: AnalysisOptions = {}
  ): Promise<QualityAnalysisResult> {
    const startTime = Date.now();
    const results: PluginResult[] = [];
    const timeout = options.timeout || this.defaultTimeout;

    // 適用可能なプラグインを取得
    const applicablePlugins = this.qualityPlugins.filter(plugin => {
      if (options.skipPlugins?.includes(plugin.id)) {
        return false;
      }
      try {
        return plugin.isApplicable(context);
      } catch (error) {
        console.error(`プラグイン ${plugin.id} の適用性チェック中にエラー: ${error}`);
        return false;
      }
    });

    let successfulPlugins = 0;
    let failedPlugins = 0;

    // 各プラグインを実行
    for (const plugin of applicablePlugins) {
      const pluginStartTime = Date.now();
      
      try {
        // タイムアウト設定付きで実行
        const patterns = await this.executeWithTimeout(
          plugin.detectPatterns(testFile),
          timeout,
          `プラグイン ${plugin.id} がタイムアウトしました`
        );

        const quality = plugin.evaluateQuality(patterns);
        const improvements = plugin.suggestImprovements(quality);

        results.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          detectionResults: patterns,
          qualityScore: quality,
          improvements,
          executionTime: Date.now() - pluginStartTime
        });

        successfulPlugins++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        results.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          detectionResults: [],
          qualityScore: { 
            overall: 0, 
            dimensions: {}, 
            confidence: 0.5,
            details: {
              strengths: [],
              weaknesses: [],
              suggestions: []
            }
          },
          improvements: [],
          executionTime: Date.now() - pluginStartTime,
          error: errorMessage
        });

        failedPlugins++;
      }
    }

    return {
      pluginResults: results,
      executionStats: {
        totalPlugins: applicablePlugins.length,
        successfulPlugins,
        failedPlugins,
        totalExecutionTime: Date.now() - startTime
      }
    };
  }

  /**
   * 後方互換性のためのエイリアス
   */
  async analyzeFileQuality(
    testFile: TestFile,
    context: ProjectContext,
    options: AnalysisOptions = {}
  ): Promise<QualityAnalysisResult> {
    return this.runQualityAnalysis(testFile, context, options);
  }

  /**
   * 統合分析の実行（新機能）
   * レガシーと品質プラグインの両方を実行
   */
  async runUnifiedAnalysis(
    filePath: string,
    context: ProjectContext,
    options: AnalysisOptions = {}
  ): Promise<UnifiedAnalysisResult> {
    // ファイル内容を読み込み
    const fileContent = await this.readFile(filePath);
    const testFile: TestFile = {
      path: filePath,
      content: fileContent,
      framework: context.testFramework,
      testMethods: this.extractTestCases(fileContent),
      testCount: this.extractTestCases(fileContent).length
    };

    // 並列実行
    const [legacyIssues, qualityResults] = await Promise.all([
      this.runLegacyPlugins(filePath),
      this.runQualityAnalysis(testFile, context, options)
    ]);

    // 統合スコアの計算（オプション）
    const combinedScore = this.calculateCombinedScore(legacyIssues, qualityResults);

    return {
      legacyIssues,
      qualityResults,
      combinedScore
    };
  }

  /**
   * タイムアウト付き実行
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    errorMessage: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * ファイル読み込み（ヘルパー）
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(this.projectRoot, filePath);
      return await fs.promises.readFile(absolutePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  /**
   * import文の抽出（簡易実装）
   */
  private extractImports(content: string): string[] {
    const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * テストケースの抽出（簡易実装）
   */
  private extractTestCases(content: string): any[] {
    const testRegex = /(?:it|test|describe)\s*\(['"]([^'"]+)['"]/g;
    const testCases: any[] = [];
    let match;
    
    while ((match = testRegex.exec(content)) !== null) {
      testCases.push({ name: match[1] });
    }
    
    return testCases;
  }

  /**
   * 統合スコアの計算
   */
  private calculateCombinedScore(
    legacyIssues: Issue[],
    qualityResults: QualityAnalysisResult
  ): number {
    // レガシーIssueによる減点
    const legacyPenalty = legacyIssues.length * 5;
    
    // 品質スコアの平均
    const qualityScores = qualityResults.pluginResults
      .filter(r => !r.error)
      .map(r => r.qualityScore.overall || 0);
    
    const avgQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => (a || 0) + (b || 0), 0) / qualityScores.length
      : 50;
    
    // 統合スコア（0-100の範囲に正規化）
    return Math.max(0, Math.min(100, avgQualityScore - legacyPenalty));
  }
}