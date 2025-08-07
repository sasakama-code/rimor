/**
 * ExecutiveSummaryGenerator
 * v0.9.0 - Phase 5-2: エグゼクティブサマリー生成
 * TDD Refactor Phase - Martin Fowler推奨の小さなステップでのリファクタリング
 * 
 * SOLID原則: 単一責任の原則 - サマリー生成に特化
 * DRY原則: 計算ロジックの再利用
 * KISS原則: シンプルな集計から開始
 */

import {
  UnifiedAnalysisResult,
  ExecutiveSummary,
  ReportDimension,
  RiskLevel
} from '../../nist/types/unified-analysis-result';
import { ReportDimensionCalculator } from '../dimensions/ReportDimensionCalculator';

/**
 * サマリー生成の設定
 */
export interface SummaryConfig {
  weights?: {
    testIntent: number;
    security: number;
  };
}

/**
 * エグゼクティブサマリー生成クラス
 * YAGNI原則: 必要最小限の機能から実装
 */
export class ExecutiveSummaryGenerator {
  private config: SummaryConfig = {
    weights: {
      testIntent: 0.5,
      security: 0.5
    }
  };

  constructor(private dimensionCalculator: ReportDimensionCalculator) {}

  /**
   * 設定を更新
   */
  setConfig(config: SummaryConfig): void {
    if (config.weights) {
      this.config.weights = { ...config.weights };
      // ディメンション計算器にも設定を伝播
      this.dimensionCalculator.setConfig(config);
    }
  }

  /**
   * 分析結果からエグゼクティブサマリーを生成
   * Extract Method: 各ステップを分離
   */
  generateSummary(analysisResult: UnifiedAnalysisResult): ExecutiveSummary {
    const dimensions = this.calculateDimensions(analysisResult);
    const overallScore = this.calculateOverallScore(dimensions);
    const overallGrade = this.determineGrade(overallScore);
    const statistics = this.collectStatistics(analysisResult);

    return this.buildExecutiveSummary(
      overallScore,
      overallGrade,
      dimensions,
      statistics
    );
  }

  /**
   * ディメンションを計算
   */
  private calculateDimensions(analysisResult: UnifiedAnalysisResult): ReportDimension[] {
    return this.dimensionCalculator.calculateDimensions(analysisResult);
  }

  /**
   * ExecutiveSummaryオブジェクトを構築
   */
  private buildExecutiveSummary(
    overallScore: number,
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F',
    dimensions: ReportDimension[],
    statistics: ExecutiveSummary['statistics']
  ): ExecutiveSummary {
    return {
      overallScore,
      overallGrade,
      dimensions,
      statistics
    };
  }

  /**
   * ディメンションから総合スコアを計算
   * 重み付き平均を使用
   */
  calculateOverallScore(dimensions: ReportDimension[]): number {
    if (dimensions.length === 0) {
      return 100; // ディメンションがない場合は満点
    }

    const totalWeight = dimensions.reduce((sum, dim) => sum + dim.weight, 0);
    if (totalWeight === 0) {
      return 100;
    }

    const weightedSum = dimensions.reduce((sum, dim) => sum + dim.score * dim.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * スコアからグレードを判定
   * A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59
   * Replace Magic Numbers: 定数を定義
   */
  private readonly GRADE_THRESHOLDS = {
    A: 90,
    B: 80,
    C: 70,
    D: 60
  };

  determineGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= this.GRADE_THRESHOLDS.A) return 'A';
    if (score >= this.GRADE_THRESHOLDS.B) return 'B';
    if (score >= this.GRADE_THRESHOLDS.C) return 'C';
    if (score >= this.GRADE_THRESHOLDS.D) return 'D';
    return 'F';
  }

  /**
   * 統計情報を収集
   * SOLID: 依存性逆転の原則
   */
  private collectStatistics(analysisResult: UnifiedAnalysisResult): ExecutiveSummary['statistics'] {
    // 既存のサマリーから基本情報を取得
    const existingStats = analysisResult.summary.statistics;
    
    // リスクカウントを再集計（detailedIssuesから）
    const riskCounts = this.countRisksByLevel(analysisResult.detailedIssues);

    return {
      totalFiles: existingStats.totalFiles,
      totalTests: existingStats.totalTests,
      riskCounts
    };
  }

  /**
   * リスクレベルごとにカウント
   * Introduce Explaining Variable: 初期化を分離
   */
  private countRisksByLevel(issues: UnifiedAnalysisResult['detailedIssues']): Record<RiskLevel, number> {
    const counts = this.initializeRiskCounts();

    issues.forEach(issue => {
      counts[issue.riskLevel]++;
    });

    return counts;
  }

  /**
   * リスクカウントを初期化
   */
  private initializeRiskCounts(): Record<RiskLevel, number> {
    return Object.values(RiskLevel).reduce((counts, level) => {
      counts[level] = 0;
      return counts;
    }, {} as Record<RiskLevel, number>);
  }

  /**
   * 既存のサマリーとマージ
   * 複数の分析結果を統合する場合に使用
   */
  mergeSummary(
    analysisResult: UnifiedAnalysisResult,
    existingSummary: ExecutiveSummary
  ): ExecutiveSummary {
    // 新しいサマリーを生成
    const newSummary = this.generateSummary(analysisResult);

    // 統計情報をマージ
    const mergedStatistics = {
      totalFiles: existingSummary.statistics.totalFiles + newSummary.statistics.totalFiles,
      totalTests: existingSummary.statistics.totalTests + newSummary.statistics.totalTests,
      riskCounts: this.mergeRiskCounts(
        existingSummary.statistics.riskCounts,
        newSummary.statistics.riskCounts
      )
    };

    // ディメンションは新しいものを使用（再計算される）
    return {
      overallScore: newSummary.overallScore,
      overallGrade: newSummary.overallGrade,
      dimensions: newSummary.dimensions,
      statistics: mergedStatistics
    };
  }

  /**
   * リスクカウントをマージ
   * DRY原則: 初期化ロジックの再利用
   */
  private mergeRiskCounts(
    counts1: Record<RiskLevel, number>,
    counts2: Record<RiskLevel, number>
  ): Record<RiskLevel, number> {
    const merged = this.initializeRiskCounts();

    Object.values(RiskLevel).forEach(level => {
      merged[level] = (counts1[level] || 0) + (counts2[level] || 0);
    });

    return merged;
  }
}