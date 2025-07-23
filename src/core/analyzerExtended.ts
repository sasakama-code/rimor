import { Analyzer, AnalysisResult } from './analyzer';
import { PluginManagerExtended, QualityAnalysisResult, AnalysisOptions } from './pluginManagerExtended';
import { 
  ITestQualityPlugin, 
  IPlugin, 
  ProjectContext, 
  QualityScore, 
  Improvement,
  TestFile 
} from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExtendedAnalysisResult {
  filePath: string;
  qualityAnalysis: QualityAnalysisResult;
  aggregatedScore: QualityScore;
  recommendations: Improvement[];
  executionTime: number;
}

export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;  // 90-100
    good: number;       // 70-89
    fair: number;       // 50-69
    poor: number;       // 0-49
  };
  commonIssues: string[];
  totalRecommendations: number;
}

export class AnalyzerExtended extends Analyzer {
  private qualityPluginManager: PluginManagerExtended;

  constructor() {
    super();
    this.qualityPluginManager = new PluginManagerExtended();
  }

  // 新しい品質分析プラグインの登録
  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.qualityPluginManager.registerQualityPlugin(plugin);
  }

  // 登録された品質プラグインの取得
  getRegisteredQualityPlugins(): any {
    return this.qualityPluginManager.getRegisteredPlugins();
  }

  // レガシープラグインの登録（継承したメソッドを拡張）
  registerPlugin(plugin: IPlugin): void {
    super.registerPlugin(plugin);
    this.qualityPluginManager.registerLegacyPlugin(plugin);
  }

  // 単一ファイルの品質分析
  async analyzeWithQuality(
    filePath: string, 
    context: ProjectContext, 
    options: AnalysisOptions = {}
  ): Promise<ExtendedAnalysisResult> {
    const startTime = Date.now();

    try {
      // ファイル内容を読み込み
      const content = await this.readFileContent(filePath);
      const testFile: TestFile = {
        path: filePath,
        content,
        metadata: {
          framework: context.testFramework,
          language: context.language,
          lastModified: new Date()
        }
      };

      // 品質分析を実行
      const qualityAnalysis = await this.qualityPluginManager.runQualityAnalysis(
        testFile, 
        context, 
        options
      );

      // スコアを集約
      const aggregatedScore = this.aggregateScores(qualityAnalysis);

      // 改善提案を統合
      const recommendations = this.consolidateRecommendations(qualityAnalysis);

      return {
        filePath,
        qualityAnalysis,
        aggregatedScore,
        recommendations,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      // エラーが発生した場合のフォールバック
      return {
        filePath,
        qualityAnalysis: {
          pluginResults: [],
          executionStats: {
            totalPlugins: 0,
            successfulPlugins: 0,
            failedPlugins: 0,
            totalExecutionTime: Date.now() - startTime
          }
        },
        aggregatedScore: {
          overall: 0,
          breakdown: {
            completeness: 0,
            correctness: 0,
            maintainability: 0
          },
          confidence: 0,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        },
        recommendations: [],
        executionTime: Date.now() - startTime
      };
    }
  }

  // 複数ファイルのバッチ分析
  async analyzeMultiple(
    filePaths: string[], 
    context: ProjectContext, 
    options: AnalysisOptions = {}
  ): Promise<ExtendedAnalysisResult[]> {
    const results: ExtendedAnalysisResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.analyzeWithQuality(filePath, context, options);
        results.push(result);
      } catch (error) {
        // 個別ファイルのエラーは記録して継続
        console.warn(`Failed to analyze ${filePath}:`, error);
      }
    }

    return results;
  }

  // バッチ分析の統計情報生成
  generateSummary(results: ExtendedAnalysisResult[]): BatchAnalysisSummary {
    const totalFiles = results.length;
    const scores = results.map(r => r.aggregatedScore.overall);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalFiles;

    // スコア分布の計算
    const scoreDistribution = {
      excellent: scores.filter(s => s >= 90).length,
      good: scores.filter(s => s >= 70 && s < 90).length,
      fair: scores.filter(s => s >= 50 && s < 70).length,
      poor: scores.filter(s => s < 50).length
    };

    // 共通の問題を集計（今回は単純化のため推奨事項から抽出）
    const allIssues: string[] = [];
    results.forEach(result => {
      result.recommendations.forEach(rec => {
        allIssues.push(rec.title);
      });
    });

    const issueFrequency = allIssues.reduce((freq: { [key: string]: number }, issue) => {
      freq[issue] = (freq[issue] || 0) + 1;
      return freq;
    }, {});

    const commonIssues = Object.entries(issueFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    const totalRecommendations = results.reduce((sum, result) => sum + result.recommendations.length, 0);

    return {
      totalFiles,
      averageScore,
      scoreDistribution,
      commonIssues,
      totalRecommendations
    };
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      // ファイルが存在しない場合や読み込みエラーの場合
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private aggregateScores(qualityAnalysis: QualityAnalysisResult): QualityScore {
    const { pluginResults } = qualityAnalysis;

    if (pluginResults.length === 0) {
      return {
        overall: 0,
        breakdown: {
          completeness: 0,
          correctness: 0,
          maintainability: 0
        },
        confidence: 0,
        metadata: { message: 'No plugins executed successfully' }
      };
    }

    // エラーがないプラグインのみを集計対象とする
    const successfulResults = pluginResults.filter(result => !result.error);

    if (successfulResults.length === 0) {
      return {
        overall: 0,
        breakdown: {
          completeness: 0,
          correctness: 0,
          maintainability: 0
        },
        confidence: 0,
        metadata: { message: 'All plugins failed to execute' }
      };
    }

    // 各プラグインの品質スコアを集約
    const totalScore = successfulResults.reduce((sum, result) => sum + result.qualityScore.overall, 0);
    const averageScore = totalScore / successfulResults.length;

    // 信頼度の計算（各プラグインの信頼度の加重平均）
    const totalConfidence = successfulResults.reduce((sum, result) => sum + result.qualityScore.confidence, 0);
    const averageConfidence = totalConfidence / successfulResults.length;

    // ブレークダウンを統合
    const aggregatedBreakdown: { [dimension: string]: { score: number; weight: number; issues: string[] } } = {};
    
    successfulResults.forEach(result => {
      Object.entries(result.qualityScore.breakdown).forEach(([dimension, score]) => {
        if (!aggregatedBreakdown[dimension]) {
          aggregatedBreakdown[dimension] = {
            score: 0,
            weight: 0,
            issues: []
          };
        }
        
        // 単純に数値として扱う
        aggregatedBreakdown[dimension].weight += 1;
        aggregatedBreakdown[dimension].score += score;
      });
    });

    // 最終的なScoreBreakdownを作成（数値のみ）
    const finalBreakdown: { [dimension: string]: number } = {};
    Object.entries(aggregatedBreakdown).forEach(([dimension, data]) => {
      finalBreakdown[dimension] = Math.round(data.score / data.weight);
    });

    // 必須のディメンションを確保
    finalBreakdown.completeness = finalBreakdown.completeness || 0;
    finalBreakdown.correctness = finalBreakdown.correctness || 0;
    finalBreakdown.maintainability = finalBreakdown.maintainability || 0;

    return {
      overall: Math.round(averageScore),
      breakdown: finalBreakdown as { completeness: number; correctness: number; maintainability: number; [dimension: string]: number },
      confidence: averageConfidence,
      metadata: { averageScore, successfulPlugins: successfulResults.length }
    };
  }

  private consolidateRecommendations(qualityAnalysis: QualityAnalysisResult): Improvement[] {
    const allRecommendations: Improvement[] = [];

    qualityAnalysis.pluginResults
      .filter(result => !result.error)
      .forEach(result => {
        allRecommendations.push(...result.improvements);
      });

    // 優先度でソート
    return allRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generateAggregatedExplanation(averageScore: number, pluginCount: number): string {
    if (averageScore >= 90) {
      return `優秀なテスト品質：${pluginCount}個のプラグインによる総合評価で高得点を獲得`;
    } else if (averageScore >= 70) {
      return `良好なテスト品質：${pluginCount}個のプラグインによる総合評価で良い結果`;
    } else if (averageScore >= 50) {
      return `改善が必要なテスト品質：${pluginCount}個のプラグインから課題が検出されました`;
    } else {
      return `低いテスト品質：${pluginCount}個のプラグインから多くの問題が検出されました`;
    }
  }
}