/**
 * Priority Engine
 * リスク優先度計算エンジン
 * 
 * SOLID原則: 単一責任の原則 - 優先度計算に特化
 * DRY原則: 計算ロジックの一元化
 * KISS原則: シンプルな計算式
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { RiskLevel } from '../types/unified-analysis-result';
import {
  RiskPriorityRequest,
  RiskPriorityResult,
  BusinessImpact,
  TechnicalComplexity,
  UrgencyLevel,
  EstimatedEffort,
  PriorityScoreBreakdown,
  ResourceAllocation,
  PriorityWeights
} from '../types/priority-types';

/**
 * リスク優先度計算エンジン
 */
export class PriorityEngine {
  private readonly defaultWeights: PriorityWeights = {
    riskWeight: 0.4,
    businessWeight: 0.3,
    complexityWeight: 0.2,
    scopeWeight: 0.1
  };

  /**
   * 単一リスクの優先度を計算
   */
  calculatePriority(request: RiskPriorityRequest): RiskPriorityResult {
    this.validateRequest(request);

    const weights = { ...this.defaultWeights, ...request.customWeights };
    
    const baseRiskScore = this.calculateBaseRiskScore(request.riskLevel);
    const businessImpactScore = this.calculateBusinessImpactScore(request.businessImpact);
    const technicalComplexityScore = this.calculateTechnicalComplexityScore(request.technicalComplexity);
    const scopeScore = this.calculateScopeScore(request.affectedComponents, request.dependencies);
    
    let finalScore = baseRiskScore * businessImpactScore * (1 + scopeScore / 100) * (2 - technicalComplexityScore);
    
    if (request.isOnCriticalPath) {
      finalScore *= 1.5;
    }
    
    finalScore = Math.min(100, Math.max(0, finalScore));

    const scoreBreakdown: PriorityScoreBreakdown = {
      baseRiskScore,
      businessImpactScore,
      technicalComplexityScore,
      scopeScore,
      finalScore
    };

    const urgency = this.determineUrgency(finalScore);
    const easinessScore = this.calculateEasinessScore(request.technicalComplexity);
    const estimatedEffort = this.determineEffort(request.technicalComplexity);

    return {
      riskId: request.riskId,
      priority: finalScore,
      urgency,
      recommendedAction: this.generateRecommendedAction(request.riskLevel, urgency),
      timeline: this.generateTimeline(urgency),
      businessImpactMultiplier: businessImpactScore,
      easinessScore,
      estimatedEffort,
      scopeScore,
      criticalPathMultiplier: request.isOnCriticalPath ? 1.5 : 1.0,
      scoreBreakdown,
      resourceAllocation: this.generateResourceAllocation(request.technicalComplexity, finalScore)
    };
  }

  /**
   * 複数リスクの優先度を一括計算
   */
  calculateBatchPriority(requests: RiskPriorityRequest[]): RiskPriorityResult[] {
    const results = requests.map(request => this.calculatePriority(request));
    return results.sort((a, b) => b.priority - a.priority);
  }

  /**
   * リクエストの検証
   */
  private validateRequest(request: RiskPriorityRequest): void {
    if (!request.riskLevel) {
      throw new Error('Missing required parameters: riskLevel');
    }
    
    if (!request.businessImpact) {
      throw new Error('Missing required parameters: businessImpact');
    }
    
    if (!request.technicalComplexity) {
      throw new Error('Missing required parameters: technicalComplexity');
    }
    
    if (request.affectedComponents === undefined || request.dependencies === undefined) {
      throw new Error('Missing required parameters: affectedComponents or dependencies');
    }
    
    if (!Object.values(RiskLevel).includes(request.riskLevel)) {
      throw new Error('Invalid risk level');
    }
    
    if (request.affectedComponents < 0 || request.dependencies < 0) {
      throw new Error('Invalid risk level: negative values not allowed');
    }
  }

  /**
   * 基本リスクスコアの計算
   */
  private calculateBaseRiskScore(riskLevel: RiskLevel): number {
    const scores: Record<RiskLevel, number> = {
      [RiskLevel.CRITICAL]: 100,
      [RiskLevel.HIGH]: 80,
      [RiskLevel.MEDIUM]: 60,
      [RiskLevel.LOW]: 40,
      [RiskLevel.MINIMAL]: 20
    };
    return scores[riskLevel];
  }

  /**
   * ビジネスインパクトスコアの計算
   */
  private calculateBusinessImpactScore(impact: BusinessImpact): number {
    const scores: Record<BusinessImpact, number> = {
      [BusinessImpact.CRITICAL]: 1.5,
      [BusinessImpact.HIGH]: 1.3,
      [BusinessImpact.MEDIUM]: 1.0,
      [BusinessImpact.LOW]: 0.7
    };
    return scores[impact];
  }

  /**
   * 技術的複雑性スコアの計算
   */
  private calculateTechnicalComplexityScore(complexity: TechnicalComplexity): number {
    const scores: Record<TechnicalComplexity, number> = {
      [TechnicalComplexity.LOW]: 0.5,
      [TechnicalComplexity.MEDIUM]: 0.7,
      [TechnicalComplexity.HIGH]: 0.9,
      [TechnicalComplexity.VERY_HIGH]: 1.0
    };
    return scores[complexity];
  }

  /**
   * スコープスコアの計算
   */
  private calculateScopeScore(affectedComponents: number, dependencies: number): number {
    const componentScore = Math.min(50, affectedComponents * 5);
    const dependencyScore = Math.min(50, dependencies * 2);
    return componentScore + dependencyScore;
  }

  /**
   * 対応しやすさスコアの計算
   */
  private calculateEasinessScore(complexity: TechnicalComplexity): number {
    const scores: Record<TechnicalComplexity, number> = {
      [TechnicalComplexity.LOW]: 0.9,
      [TechnicalComplexity.MEDIUM]: 0.6,
      [TechnicalComplexity.HIGH]: 0.3,
      [TechnicalComplexity.VERY_HIGH]: 0.1
    };
    return scores[complexity];
  }

  /**
   * 緊急度の決定
   */
  private determineUrgency(priority: number): UrgencyLevel {
    if (priority >= 90) return 'IMMEDIATE';
    if (priority >= 70) return 'HIGH';
    if (priority >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 推定作業量の決定
   */
  private determineEffort(complexity: TechnicalComplexity): EstimatedEffort {
    const mapping: Record<TechnicalComplexity, EstimatedEffort> = {
      [TechnicalComplexity.LOW]: 'LOW',
      [TechnicalComplexity.MEDIUM]: 'MEDIUM',
      [TechnicalComplexity.HIGH]: 'HIGH',
      [TechnicalComplexity.VERY_HIGH]: 'VERY_HIGH'
    };
    return mapping[complexity];
  }

  /**
   * 推奨アクションの生成
   */
  private generateRecommendedAction(riskLevel: RiskLevel, urgency: UrgencyLevel): string {
    if (urgency === 'IMMEDIATE') {
      return '即座に対応が必要です。専門チームを編成し、他のタスクを中断してでも対処してください。';
    }
    
    if (urgency === 'HIGH') {
      return '早急な対応が必要です。今週中に対応計画を立て、実行に移してください。';
    }
    
    if (urgency === 'MEDIUM') {
      return '計画的な対応が必要です。次のスプリントで対応を検討してください。';
    }
    
    return '定期メンテナンスで対応可能です。バックログに追加し、余裕がある時に対処してください。';
  }

  /**
   * タイムラインの生成
   */
  private generateTimeline(urgency: UrgencyLevel): string {
    const timelines: Record<UrgencyLevel, string> = {
      'IMMEDIATE': '24時間以内',
      'HIGH': '1週間以内',
      'MEDIUM': '2週間以内',
      'LOW': '1ヶ月以内'
    };
    return timelines[urgency];
  }

  /**
   * リソース配分の推奨生成
   */
  private generateResourceAllocation(
    complexity: TechnicalComplexity, 
    priority: number
  ): ResourceAllocation | undefined {
    if (priority < 50) {
      return undefined;
    }

    const teamSizeMap: Record<TechnicalComplexity, number> = {
      [TechnicalComplexity.LOW]: 1,
      [TechnicalComplexity.MEDIUM]: 2,
      [TechnicalComplexity.HIGH]: 3,
      [TechnicalComplexity.VERY_HIGH]: 4
    };

    const manDaysMap: Record<TechnicalComplexity, number> = {
      [TechnicalComplexity.LOW]: 2,
      [TechnicalComplexity.MEDIUM]: 5,
      [TechnicalComplexity.HIGH]: 10,
      [TechnicalComplexity.VERY_HIGH]: 20
    };

    const expertiseMap: Record<TechnicalComplexity, string[]> = {
      [TechnicalComplexity.LOW]: ['ジュニアエンジニア'],
      [TechnicalComplexity.MEDIUM]: ['ミッドレベルエンジニア'],
      [TechnicalComplexity.HIGH]: ['シニアエンジニア', 'テックリード'],
      [TechnicalComplexity.VERY_HIGH]: ['シニアエンジニア', 'アーキテクト', 'セキュリティエキスパート']
    };

    const skillLevelMap: Record<TechnicalComplexity, 'ジュニア' | 'ミッド' | 'シニア' | 'エキスパート'> = {
      [TechnicalComplexity.LOW]: 'ジュニア',
      [TechnicalComplexity.MEDIUM]: 'ミッド',
      [TechnicalComplexity.HIGH]: 'シニア',
      [TechnicalComplexity.VERY_HIGH]: 'エキスパート'
    };

    return {
      recommendedTeamSize: teamSizeMap[complexity],
      estimatedManDays: manDaysMap[complexity],
      requiredExpertise: expertiseMap[complexity],
      recommendedSkillLevel: skillLevelMap[complexity]
    };
  }
}