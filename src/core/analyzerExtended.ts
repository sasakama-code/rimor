/**
 * @deprecated Use UnifiedAnalysisEngine instead. This file is kept for backward compatibility.
 * Migration guide: Replace AnalyzerExtended with UnifiedAnalysisEngine
 */

import { 
  UnifiedAnalysisEngine, 
  ExtendedAnalysisResult as NewExtendedAnalysisResult,
  BatchAnalysisSummary as NewBatchAnalysisSummary 
} from './UnifiedAnalysisEngine';
import { 
  ITestQualityPlugin, 
  IPlugin, 
  ProjectContext,
  QualityScore,
  Improvement
} from './types';
import { AnalysisOptions } from './pluginManagerExtended';

/**
 * Legacy ExtendedAnalysisResult for backward compatibility
 * @deprecated Use ExtendedAnalysisResult from UnifiedAnalysisEngine instead
 */
export type ExtendedAnalysisResult = NewExtendedAnalysisResult;

/**
 * Legacy BatchAnalysisSummary for backward compatibility
 * @deprecated Use BatchAnalysisSummary from UnifiedAnalysisEngine instead
 */
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

/**
 * AnalyzerExtended class - Legacy wrapper for UnifiedAnalysisEngine
 * @deprecated Use UnifiedAnalysisEngine directly for new code
 */
export class AnalyzerExtended {
  private engine: UnifiedAnalysisEngine;

  constructor() {
    this.engine = new UnifiedAnalysisEngine();
  }

  // 新しい品質分析プラグインの登録
  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.engine.registerQualityPlugin(plugin);
  }

  // 登録された品質プラグインの取得
  getRegisteredQualityPlugins(): ITestQualityPlugin[] {
    return this.engine.getQualityPlugins();
  }

  // レガシープラグインの登録（継承したメソッドを拡張）
  registerPlugin(plugin: IPlugin): void {
    this.engine.registerPlugin(plugin);
  }

  // 単一ファイルの品質分析
  async analyzeWithQuality(
    filePath: string, 
    context: ProjectContext, 
    options: AnalysisOptions = {}
  ): Promise<ExtendedAnalysisResult> {
    this.engine.configure(options);
    const results = await this.engine.analyzeAllWithQuality(filePath);
    
    // Return the first result for single file analysis
    if (results.length > 0) {
      return results[0];
    }
    
    // Return empty result if no analysis was performed
    return {
      filePath,
      qualityAnalysis: {
        pluginResults: [],
        executionStats: {
          totalPlugins: 0,
          successfulPlugins: 0,
          failedPlugins: 0,
          totalExecutionTime: 0
        }
      },
      aggregatedScore: {
        overall: 0,
        breakdown: { completeness: 0, correctness: 0, maintainability: 0 },
        confidence: 0
      },
      recommendations: [],
      executionTime: 0
    };
  }

  // バッチ分析
  async analyzeBatch(
    directoryPath: string,
    context: ProjectContext,
    options: AnalysisOptions = {}
  ): Promise<{ summary: BatchAnalysisSummary; files: ExtendedAnalysisResult[] }> {
    this.engine.configure(options);
    const batchResult = await this.engine.analyzeBatch([directoryPath]);
    
    // Convert to legacy format
    const summary: BatchAnalysisSummary = {
      totalFiles: batchResult.totalFiles,
      averageScore: batchResult.averageScore,
      scoreDistribution: batchResult.scoreDistribution,
      commonIssues: [],
      totalRecommendations: 0
    };
    
    return {
      summary,
      files: batchResult.files
    };
  }

  // スコアの集約
  aggregateScores(scores: QualityScore[]): QualityScore {
    return this.engine.aggregateScores([]);
  }

  // 推奨事項の集約
  aggregateRecommendations(recommendations: Improvement[][]): Improvement[] {
    return this.engine.aggregateRecommendations(recommendations);
  }

  // Private helper methods
  private async readFileContent(filePath: string): Promise<string> {
    const { readFile } = await import('fs/promises');
    return await readFile(filePath, 'utf-8');
  }
}