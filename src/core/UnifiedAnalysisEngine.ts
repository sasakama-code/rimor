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
import { PluginManager } from './pluginManager';
import { PluginManagerExtended } from './pluginManagerExtended';
import { findTestFiles } from './fileDiscovery';
import { debug } from '../utils/debug';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * UnifiedAnalysisEngine
 * 
 * analyzer.tsとanalyzerExtended.tsの機能を統合した統一分析エンジン
 * SOLID原則に準拠した設計
 * 
 * @version 0.9.0
 */

// analyzer.tsのAnalysisResult型
export interface BasicAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  errors?: Array<{ pluginName: string; error: string }>;
}

// analyzerExtended.tsのExtendedAnalysisResult型
export interface ExtendedAnalysisResult {
  filePath: string;
  qualityAnalysis: QualityAnalysisResult;
  aggregatedScore: QualityScore;
  recommendations: Improvement[];
  executionTime: number;
}

// 統合分析結果型
export interface UnifiedAnalysisResult {
  basicAnalysis: BasicAnalysisResult;
  qualityAnalysis?: QualityAnalysisResult;
  combinedScore?: QualityScore;
  allIssues: Issue[];
}

// バッチ分析サマリー型
export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  files: ExtendedAnalysisResult[];
  executionTime: number;
}

// 品質分析結果型
export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
}

// 設定オプション型
export interface AnalysisOptions {
  timeout?: number;
  skipPlugins?: string[];
  parallelExecution?: boolean;
}

/**
 * 統一分析エンジンクラス
 */
export class UnifiedAnalysisEngine {
  private legacyPluginManager: PluginManager;
  private qualityPluginManager: PluginManagerExtended;
  private configuration: AnalysisOptions;

  constructor() {
    this.legacyPluginManager = new PluginManager();
    this.qualityPluginManager = new PluginManagerExtended();
    this.configuration = {
      timeout: 30000,
      skipPlugins: [],
      parallelExecution: false
    };
  }

  /**
   * レガシープラグイン（IPlugin）の登録
   */
  registerPlugin(plugin: IPlugin): void {
    this.legacyPluginManager.register(plugin);
  }

  /**
   * 品質プラグイン（ITestQualityPlugin）の登録
   */
  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.qualityPluginManager.registerPlugin(plugin);
  }

  /**
   * カスタムプラグインの登録（拡張性のため）
   */
  registerCustomPlugin(plugin: any): void {
    // 将来の拡張のためのメソッド
    // 開放閉鎖原則に従い、新しいプラグインタイプを追加可能にする
    console.log('Custom plugin registered:', plugin.name);
  }

  /**
   * 基本分析（analyzer.tsの機能）
   */
  async analyze(targetPath: string): Promise<BasicAnalysisResult> {
    return debug.measureAsync('analyze', async () => {
      debug.info(`Starting basic analysis of: ${targetPath}`);
      
      const startTime = Date.now();
      const allIssues: Issue[] = [];
      const errors: Array<{ pluginName: string; error: string }> = [];
      let fileCount = 0;

      try {
        const testFiles: string[] = [];
        for await (const file of findTestFiles(targetPath)) {
          testFiles.push(file);
        }
        fileCount = testFiles.length;

        for (const file of testFiles) {
          const plugins = this.legacyPluginManager.getPlugins();
          
          if (this.configuration.parallelExecution) {
            // 並列実行
            const promises = plugins
              .filter(plugin => !this.configuration.skipPlugins?.includes(plugin.name))
              .map(async plugin => {
                try {
                  const issues = await this.runWithTimeout(
                    plugin.analyze(file),
                    this.configuration.timeout || 30000
                  );
                  return { issues, error: null };
                } catch (error) {
                  const errorInfo: any = {
                    pluginName: plugin.name,
                    error: error instanceof Error ? error.message : String(error)
                  };
                  debug.warn(`Plugin ${plugin.name} failed: ${error}`);
                  return { issues: [], error: errorInfo };
                }
              });
            
            const results = await Promise.all(promises);
            for (const result of results) {
              if (result.error) {
                errors.push(result.error);
              } else {
                allIssues.push(...result.issues);
              }
            }
          } else {
            // シーケンシャル実行
            for (const plugin of plugins) {
              if (this.configuration.skipPlugins?.includes(plugin.name)) {
                continue;
              }

              try {
                const issues = await this.runWithTimeout(
                  plugin.analyze(file),
                  this.configuration.timeout || 30000
                );
                allIssues.push(...issues);
              } catch (error) {
                errors.push({
                  pluginName: plugin.name,
                  error: error instanceof Error ? error.message : String(error)
                });
                debug.warn(`Plugin ${plugin.name} failed: ${error}`);
              }
            }
          }
        }
      } catch (error) {
        debug.error(`Analysis failed: ${error}`);
      }

      const executionTime = Date.now() - startTime;
      
      return {
        totalFiles: fileCount,
        issues: allIssues,
        executionTime,
        errors: errors // 常にerrorsプロパティを含める（空配列でも）
      };
    });
  }

  /**
   * 品質分析（analyzerExtended.tsの機能）
   */
  async analyzeWithQuality(filePath: string): Promise<ExtendedAnalysisResult> {
    const startTime = Date.now();
    
    // プロジェクトコンテキストの作成
    const projectContext: ProjectContext = {
      rootPath: path.dirname(filePath),
      testFramework: 'jest', // 仮の値
      language: path.extname(filePath).slice(1) as any
    };

    // テストファイル情報の作成
    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      // ファイルが存在しない場合は空の内容を使用
      debug.warn(`File not found: ${filePath}, using empty content`);
    }
    const testFile: TestFile = {
      path: filePath,
      content
    };

    // 品質分析の実行
    const qualityAnalysis = await this.qualityPluginManager.analyzeFileQuality(
      testFile,
      projectContext,
      this.configuration
    );

    // スコアの集約
    const aggregatedScore = this.aggregateScores(qualityAnalysis.pluginResults);

    // 改善提案の収集
    const recommendations = this.collectRecommendations(qualityAnalysis.pluginResults);

    const executionTime = Date.now() - startTime;

    return {
      filePath,
      qualityAnalysis,
      aggregatedScore,
      recommendations,
      executionTime
    };
  }

  /**
   * バッチ分析
   */
  async analyzeBatch(filePaths: string[]): Promise<BatchAnalysisSummary> {
    const startTime = Date.now();
    const results: ExtendedAnalysisResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.analyzeWithQuality(filePath);
        results.push(result);
      } catch (error) {
        debug.warn(`Failed to analyze ${filePath}: ${error}`);
      }
    }

    const scores = results.map(r => r.aggregatedScore.overall);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const scoreDistribution = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      fair: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length
    };

    const executionTime = Date.now() - startTime;

    return {
      totalFiles: filePaths.length,
      averageScore,
      scoreDistribution,
      files: results,
      executionTime
    };
  }

  /**
   * 統合分析（新機能）
   */
  async analyzeUnified(targetPath: string): Promise<UnifiedAnalysisResult> {
    const [basicAnalysis, qualityResults] = await Promise.all([
      this.analyze(targetPath),
      this.analyzeAllWithQuality(targetPath)
    ]);

    const combinedScore = qualityResults.length > 0
      ? this.aggregateScores(qualityResults.flatMap(r => r.qualityAnalysis.pluginResults))
      : undefined;

    // qualityAnalysisを必ず返す
    const qualityAnalysis = qualityResults[0]?.qualityAnalysis || {
      pluginResults: [],
      executionStats: {
        totalPlugins: 0,
        successfulPlugins: 0,
        failedPlugins: 0,
        totalExecutionTime: 0
      }
    };

    // combinedScoreを必ず返す（デフォルト値を設定）
    const finalCombinedScore = combinedScore || {
      overall: 0,
      breakdown: { completeness: 0, correctness: 0, maintainability: 0 },
      confidence: 0
    };

    return {
      basicAnalysis,
      qualityAnalysis,
      combinedScore: finalCombinedScore,
      allIssues: [
        ...basicAnalysis.issues,
        ...this.extractIssuesFromQualityResults(qualityResults)
      ]
    };
  }

  /**
   * プラグイン数の取得
   */
  getPluginCount(): number {
    const legacyCount = this.legacyPluginManager.getPlugins().length;
    const qualityCount = this.qualityPluginManager.getPlugins().length;
    return legacyCount + qualityCount;
  }

  /**
   * 設定の適用
   */
  configure(options: AnalysisOptions): void {
    this.configuration = {
      ...this.configuration,
      ...options
    };
  }

  /**
   * 現在の設定を取得
   */
  getConfiguration(): AnalysisOptions {
    return { ...this.configuration };
  }

  // ===== Private Helper Methods =====

  private async analyzeAllWithQuality(targetPath: string): Promise<ExtendedAnalysisResult[]> {
    const testFiles: string[] = [];
    for await (const file of findTestFiles(targetPath)) {
      testFiles.push(file);
    }
    const results: ExtendedAnalysisResult[] = [];

    for (const file of testFiles) {
      try {
        const result = await this.analyzeWithQuality(file);
        results.push(result);
      } catch (error) {
        debug.warn(`Failed to analyze ${file}: ${error}`);
      }
    }

    return results;
  }

  private aggregateScores(pluginResults: PluginResult[]): QualityScore {
    if (pluginResults.length === 0) {
      return {
        overall: 0,
        breakdown: { completeness: 0, correctness: 0, maintainability: 0 },
        confidence: 0
      };
    }

    const scores = pluginResults.map(r => r.qualityScore);
    const weights = scores.map(s => s.confidence || 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const overall = scores.reduce((sum, score, index) => 
      sum + score.overall * weights[index], 0) / totalWeight;

    const breakdown = {
      completeness: scores.reduce((sum, score, index) => 
        sum + (score.breakdown?.completeness || 0) * weights[index], 0) / totalWeight,
      correctness: scores.reduce((sum, score, index) => 
        sum + (score.breakdown?.correctness || 0) * weights[index], 0) / totalWeight,
      maintainability: scores.reduce((sum, score, index) => 
        sum + (score.breakdown?.maintainability || 0) * weights[index], 0) / totalWeight
    };

    return {
      overall,
      breakdown,
      confidence: totalWeight / pluginResults.length
    };
  }

  private collectRecommendations(pluginResults: PluginResult[]): Improvement[] {
    return pluginResults.flatMap(r => r.improvements);
  }

  private extractIssuesFromQualityResults(results: ExtendedAnalysisResult[]): Issue[] {
    const issues: Issue[] = [];

    for (const result of results) {
      for (const pluginResult of result.qualityAnalysis.pluginResults) {
        // パターンから問題を抽出
        for (const pattern of pluginResult.detectionResults) {
          if (pattern.confidence < 0.5 && pattern.location) {
            issues.push({
              type: 'quality',
              severity: 'medium',
              message: `Low quality pattern detected: ${pattern.patternName || pattern.patternId || 'unknown'}`,
              file: pattern.location.file,
              line: pattern.location.line,
              column: pattern.location.column
            });
          }
        }
      }
    }

    return issues;
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }
}