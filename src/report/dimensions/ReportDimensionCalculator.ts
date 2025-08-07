/**
 * ReportDimensionCalculator
 * v0.9.0 - Phase 5-1: 評価ディメンション計算
 * TDD Refactor Phase - Martin Fowler推奨の小さなステップでのリファクタリング
 * 
 * SOLID原則: 単一責任の原則 - ディメンション計算に特化
 * DRY原則: スコア計算ロジックの一元化
 * KISS原則: シンプルな計算ロジックから開始
 */

import {
  UnifiedAnalysisResult,
  RiskLevel,
  ReportDimension,
  ScoreBreakdown,
  DetailedIssue
} from '../../nist/types/unified-analysis-result';

/**
 * ディメンション計算の設定
 */
export interface DimensionConfig {
  weights?: {
    testIntent: number;
    security: number;
  };
}

/**
 * 評価ディメンション計算クラス
 * YAGNI原則: 必要最小限の機能から実装
 */
export class ReportDimensionCalculator {
  private config: DimensionConfig = {
    weights: {
      testIntent: 0.5,
      security: 0.5
    }
  };

  /**
   * 設定を更新
   * Defensive Programming: 入力値の検証
   */
  setConfig(config: DimensionConfig): void {
    if (config.weights) {
      this.validateWeights(config.weights);
      this.config.weights = { ...config.weights };
    }
  }

  /**
   * 重みの妥当性を検証
   */
  private validateWeights(weights: { testIntent: number; security: number }): void {
    const total = weights.testIntent + weights.security;
    if (Math.abs(total - 1.0) > 0.01) {
      console.warn(`Weight sum is ${total}, expected 1.0. Normalizing...`);
    }
  }

  /**
   * 分析結果から評価ディメンションを計算
   * KISS原則: シンプルな減点方式で実装
   */
  calculateDimensions(analysisResult: UnifiedAnalysisResult): ReportDimension[] {
    const testIntentDimension = this.calculateTestIntentDimension(analysisResult);
    const securityDimension = this.calculateSecurityDimension(analysisResult);

    return [testIntentDimension, securityDimension];
  }

  /**
   * テスト意図実現度ディメンションの計算
   */
  private calculateTestIntentDimension(analysisResult: UnifiedAnalysisResult): ReportDimension {
    const issues = analysisResult.detailedIssues;
    const { score, breakdown } = this.calculateScoreFromIssues(issues, 'test');
    const weight = this.config.weights!.testIntent;
    const impact = score * weight;

    return {
      name: 'テスト意図実現度',
      score,
      weight,
      impact,
      breakdown
    };
  }

  /**
   * セキュリティリスクディメンションの計算
   */
  private calculateSecurityDimension(analysisResult: UnifiedAnalysisResult): ReportDimension {
    const securityIssues = this.filterSecurityIssues(analysisResult.detailedIssues);

    const { score, breakdown } = this.calculateScoreFromIssues(securityIssues, 'security');
    const weight = this.config.weights!.security;
    const impact = score * weight;

    return {
      name: 'セキュリティリスク',
      score,
      weight,
      impact,
      breakdown
    };
  }

  /**
   * リスクレベルごとの減点を適用してスコアを計算
   * DRY原則: 共通の計算ロジック
   */
  private calculateScoreFromIssues(
    issues: DetailedIssue[],
    type: 'test' | 'security'
  ): { score: number; breakdown: ScoreBreakdown[] } {
    // リスクレベルごとの減点設定
    // セキュリティリスクの場合はより厳しい減点を適用
    const baseDeductionMap: Record<RiskLevel, number> = {
      [RiskLevel.CRITICAL]: -30,
      [RiskLevel.HIGH]: -20,
      [RiskLevel.MEDIUM]: -15,
      [RiskLevel.LOW]: -5,
      [RiskLevel.MINIMAL]: 0
    };

    // セキュリティリスクは2倍の減点
    const deductionMultiplier = this.getDeductionMultiplier(type);
    const deductionMap = this.applyDeductionMultiplier(baseDeductionMap, deductionMultiplier);

    // リスクレベルごとにグループ化
    const riskGroups = this.groupByRiskLevel(issues);
    const breakdown: ScoreBreakdown[] = [];
    let totalDeduction = 0;

    // 各リスクレベルの減点を計算
    Object.entries(riskGroups).forEach(([level, levelIssues]) => {
      if (levelIssues.length === 0) return;

      const riskLevel = level as RiskLevel;
      const deductionPerIssue = deductionMap[riskLevel];
      const deduction = deductionPerIssue * levelIssues.length;
      totalDeduction += deduction;

      if (deduction !== 0) {
        const label = type === 'security' && riskLevel === RiskLevel.CRITICAL
          ? 'クリティカルリスク'
          : `${riskLevel}レベルのリスク`;

        breakdown.push({
          label,
          calculation: `${deductionPerIssue}点 x ${levelIssues.length}件`,
          deduction
        });
      }
    });

    const score = Math.max(0, 100 + totalDeduction);
    return { score, breakdown };
  }

  /**
   * リスクレベルごとにissueをグループ化
   */
  private groupByRiskLevel(issues: DetailedIssue[]): Record<RiskLevel, DetailedIssue[]> {
    const groups: Record<RiskLevel, DetailedIssue[]> = {
      [RiskLevel.CRITICAL]: [],
      [RiskLevel.HIGH]: [],
      [RiskLevel.MEDIUM]: [],
      [RiskLevel.LOW]: [],
      [RiskLevel.MINIMAL]: []
    };

    issues.forEach(issue => {
      groups[issue.riskLevel].push(issue);
    });

    return groups;
  }

  /**
   * タイプに応じた減点倍率を取得
   */
  private getDeductionMultiplier(type: 'test' | 'security'): number {
    return type === 'security' ? 2 : 1;
  }

  /**
   * 減点マップに倍率を適用
   */
  private applyDeductionMultiplier(
    baseMap: Record<RiskLevel, number>,
    multiplier: number
  ): Record<RiskLevel, number> {
    if (multiplier === 1) return baseMap;
    
    return Object.fromEntries(
      Object.entries(baseMap).map(([level, deduction]) => [
        level,
        deduction * multiplier
      ])
    ) as Record<RiskLevel, number>;
  }

  /**
   * セキュリティ関連のissueをフィルタリング
   * Extract Method: 複雑な条件を分離
   */
  private filterSecurityIssues(issues: DetailedIssue[]): DetailedIssue[] {
    const securityKeywords = ['injection', 'xss', 'vulnerability', 'security', 'csrf', 'authentication'];
    return issues.filter(issue => {
      const lowerTitle = issue.title.toLowerCase();
      return securityKeywords.some(keyword => lowerTitle.includes(keyword));
    });
  }

  /**
   * カスタム重みを適用して再計算
   */
  applyCustomWeights(
    dimensions: ReportDimension[],
    customWeights: Record<string, number>
  ): ReportDimension[] {
    return dimensions.map(dimension => {
      const newWeight = customWeights[dimension.name] ?? dimension.weight;
      const newImpact = dimension.score * newWeight;

      return {
        ...dimension,
        weight: newWeight,
        impact: newImpact
      };
    });
  }
}