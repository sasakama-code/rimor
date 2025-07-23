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
import { LegacyPluginAdapter } from '../plugins/migration/LegacyPluginAdapter';


export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
  aggregatedScore?: QualityScore; // 将来的な実装で使用
}

export interface AnalysisOptions {
  timeout?: number; // ミリ秒
  skipPlugins?: string[]; // スキップするプラグインID
}

export class PluginManagerExtended {
  private qualityPlugins: ITestQualityPlugin[] = [];
  private legacyPlugins: IPlugin[] = [];
  private readonly defaultTimeout = 30000; // 30秒

  // 新しいプラグインの登録
  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.qualityPlugins.push(plugin);
  }

  // レガシープラグインの登録（自動的にアダプターでラップ）
  registerLegacyPlugin(plugin: IPlugin): void {
    this.legacyPlugins.push(plugin);
  }

  // 後方互換性のための従来のregisterメソッド
  register(plugin: IPlugin): void {
    this.registerLegacyPlugin(plugin);
  }

  // 新しい品質分析メソッド
  async runQualityAnalysis(
    testFile: TestFile, 
    context: ProjectContext,
    options: AnalysisOptions = {}
  ): Promise<QualityAnalysisResult> {
    const startTime = Date.now();
    const results: PluginResult[] = [];
    const timeout = options.timeout || this.defaultTimeout;
    
    // 適用可能なプラグインを取得
    const applicablePlugins = this.getApplicablePlugins(context, options.skipPlugins);
    
    // 各プラグインを実行
    for (const plugin of applicablePlugins) {
      const pluginResult = await this.runSinglePlugin(plugin, testFile, timeout);
      results.push(pluginResult);
    }

    const totalExecutionTime = Date.now() - startTime;
    const successfulPlugins = results.filter(r => !r.error).length;
    const failedPlugins = results.filter(r => r.error).length;

    return {
      pluginResults: results,
      executionStats: {
        totalPlugins: applicablePlugins.length,
        successfulPlugins,
        failedPlugins,
        totalExecutionTime
      }
    };
  }

  // 後方互換性のための従来のrunAllメソッド
  async runAll(filePath: string): Promise<Issue[]> {
    const allIssues: Issue[] = [];
    
    // レガシープラグインを直接実行
    for (const plugin of this.legacyPlugins) {
      try {
        const issues = await plugin.analyze(filePath);
        allIssues.push(...issues);
      } catch (error) {
        // MVP: エラーは無視（既存の動作を維持）
      }
    }
    
    return allIssues;
  }

  private getApplicablePlugins(context: ProjectContext, skipPlugins: string[] = []): ITestQualityPlugin[] {
    const allPlugins: ITestQualityPlugin[] = [
      ...this.qualityPlugins,
      ...this.legacyPlugins.map(plugin => new LegacyPluginAdapter(plugin))
    ];

    return allPlugins.filter(plugin => {
      // スキップリストにあるプラグインは除外
      if (skipPlugins.includes(plugin.id)) {
        return false;
      }
      
      // 適用可能性をチェック
      try {
        return plugin.isApplicable(context);
      } catch (error) {
        console.warn(`Plugin ${plugin.id} isApplicable check failed:`, error);
        return false;
      }
    });
  }

  private async runSinglePlugin(
    plugin: ITestQualityPlugin, 
    testFile: TestFile, 
    timeout: number
  ): Promise<PluginResult> {
    const startTime = Date.now();
    
    try {
      // タイムアウト付きでプラグインを実行
      const patterns = await this.withTimeout(
        plugin.detectPatterns(testFile),
        timeout,
        `Plugin ${plugin.id} detectPatterns timeout`
      );

      const qualityScore = plugin.evaluateQuality(patterns);
      const improvements = plugin.suggestImprovements(qualityScore);
      
      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        detectionResults: patterns,
        qualityScore,
        improvements,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        pluginId: plugin.id,
        pluginName: plugin.name,
        detectionResults: [],
        qualityScore: {
          overall: 0,
          breakdown: {
          completeness: 0,
          correctness: 0,
          maintainability: 0
        },
          confidence: 0
        },
        improvements: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  }

  // デバッグ用メソッド
  getRegisteredPlugins(): {
    qualityPlugins: { id: string; name: string; type: string }[];
    legacyPlugins: { name: string }[];
  } {
    return {
      qualityPlugins: this.qualityPlugins.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type
      })),
      legacyPlugins: this.legacyPlugins.map(p => ({
        name: p.name
      }))
    };
  }

  /**
   * 品質プラグインを実行して結果を返す
   */
  async runQualityPlugins(
    testFiles: TestFile[], 
    context: ProjectContext, 
    options: { timeout?: number } = {}
  ): Promise<{ pluginResults: PluginResult[] }[]> {
    const results: { pluginResults: PluginResult[] }[] = [];

    for (const testFile of testFiles) {
      const pluginResults: PluginResult[] = [];

      for (const plugin of this.qualityPlugins) {
        try {
          const startTime = Date.now();
          
          // タイムアウト処理
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Plugin execution timeout')), 
              options.timeout || this.defaultTimeout);
          });

          const detectionResults = await Promise.race([
            plugin.detectPatterns(testFile),
            timeoutPromise
          ]);

          const qualityScore = plugin.evaluateQuality(detectionResults);
          const improvements = plugin.suggestImprovements(qualityScore);
          
          const executionTime = Date.now() - startTime;

          pluginResults.push({
            pluginId: plugin.id,
            pluginName: plugin.name,
            detectionResults,
            qualityScore,
            improvements,
            executionTime
          });

        } catch (error) {
          pluginResults.push({
            pluginId: plugin.id,
            pluginName: plugin.name,
            detectionResults: [],
            qualityScore: {
              overall: 0,
              breakdown: { completeness: 0, correctness: 0, maintainability: 0 },
              confidence: 0
            },
            improvements: [],
            executionTime: 0,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      results.push({ pluginResults });
    }

    return results;
  }
}