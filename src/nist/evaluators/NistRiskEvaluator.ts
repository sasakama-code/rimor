/**
 * NIST SP 800-30準拠リスク評価器
 * 脅威、脆弱性、影響を総合的に評価
 * 
 * SOLID原則: 単一責任の原則
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { RiskLevel } from '../types/unified-analysis-result';
import {
  ThreatSource,
  ThreatEvent,
  Vulnerability,
  RiskAssessment,
  NISTRiskMatrix,
  ThreatEventAssessment,
  EnvironmentalImpact,
  RiskAssessmentResult,
  RiskRecommendation,
  RiskItem,
  CapabilityLevel,
  LikelihoodLevel,
  ImpactLevel,
  SeverityLevel
} from '../types/nist-types';

/**
 * NIST SP 800-30準拠のリスク評価器
 */
export class NistRiskEvaluator {
  /**
   * 脅威源の能力レベルを評価
   */
  evaluateThreatCapability(threatSource: ThreatSource): CapabilityLevel {
    if (!threatSource) {
      throw new Error('Threat source is required');
    }
    return threatSource.capability;
  }

  /**
   * 脅威源の総合評価
   */
  assessThreatSource(threatSource: ThreatSource): string {
    if (!threatSource) {
      throw new Error('Threat source is required');
    }

    // 敵対的脅威の場合、能力、意図、ターゲティングを総合評価
    if (threatSource.type === 'ADVERSARIAL') {
      const scores = {
        capability: this.levelToScore(threatSource.capability),
        intent: this.levelToScore(threatSource.intent),
        targeting: this.targetingToScore(threatSource.targeting)
      };

      const averageScore = (scores.capability + scores.intent + scores.targeting) / 3;
      return this.scoreToLevel(averageScore);
    }

    // 非敵対的脅威の場合、能力のみで評価
    return this.scoreToLevel(this.levelToScore(threatSource.capability));
  }

  /**
   * 環境脅威の評価
   */
  evaluateEnvironmentalThreat(threatSource: ThreatSource): EnvironmentalImpact {
    if (threatSource.type !== 'ENVIRONMENTAL') {
      throw new Error('Threat source must be ENVIRONMENTAL type');
    }

    // 環境脅威は意図を持たないため、能力のみで評価
    const likelihood = this.capabilityToLikelihood(threatSource.capability);
    
    return {
      threatSourceId: threatSource.id,
      likelihood,
      scope: this.getEnvironmentalScope(threatSource.capability),
      recoveryTime: this.getRecoveryTime(threatSource.capability)
    };
  }

  /**
   * 脅威イベントの可能性を計算
   */
  calculateThreatLikelihood(threatEvent: ThreatEvent): LikelihoodLevel {
    if (!threatEvent) {
      throw new Error('Threat event is required');
    }
    return threatEvent.likelihood;
  }

  /**
   * 脅威イベントの総合評価
   */
  assessThreatEvent(threatEvent: ThreatEvent): ThreatEventAssessment {
    if (!threatEvent) {
      throw new Error('Threat event is required');
    }

    return {
      eventId: threatEvent.id,
      overallLikelihood: threatEvent.likelihood,
      overallImpact: threatEvent.impact,
      contributingSources: threatEvent.threatSources
    };
  }

  /**
   * 脆弱性の深刻度を評価
   */
  evaluateVulnerabilitySeverity(vulnerability: Vulnerability): SeverityLevel {
    if (!vulnerability) {
      throw new Error('Vulnerability is required');
    }
    return vulnerability.severity;
  }

  /**
   * 脆弱性の悪用可能性を計算（0-1のスコア）
   */
  calculateExploitability(vulnerability: Vulnerability): number {
    if (!vulnerability) {
      throw new Error('Vulnerability is required');
    }

    const exploitScore = this.levelToScore(vulnerability.exploitability);
    const detectScore = this.detectabilityToScore(vulnerability.detectability);
    
    // 悪用可能性 = (悪用容易性 + 検出困難性) / 2
    return (exploitScore + (1 - detectScore)) / 2;
  }

  /**
   * 複数の脆弱性の組み合わせリスクを評価
   */
  assessCombinedVulnerabilities(vulnerabilities: Vulnerability[]): SeverityLevel {
    if (!vulnerabilities || vulnerabilities.length === 0) {
      return 'VERY_LOW';
    }

    // 最も深刻な脆弱性を基準とする
    const severities = vulnerabilities.map(v => v.severity);
    return this.getHighestSeverity(severities);
  }

  /**
   * NISTリスクマトリクスを適用してリスクレベルを決定
   */
  applyRiskMatrix(matrix: NISTRiskMatrix): RiskLevel {
    if (!matrix) {
      throw new Error('Risk matrix is required');
    }

    const threatScore = this.levelToScore(matrix.threatLikelihood);
    const vulnScore = this.severityToScore(matrix.vulnerabilitySeverity);
    const impactScore = this.levelToScore(matrix.impactLevel);

    // リスクスコア = (脅威 × 脆弱性 × 影響) の平均
    // HIGH × HIGH × HIGH = 0.8 × 0.67 × 0.8 = 0.73 → CRITICAL
    const riskScore = (threatScore + vulnScore + impactScore) / 3;

    // 特別なケース: すべてHIGH以上の場合はCRITICAL
    if (threatScore >= 0.8 && vulnScore >= 0.67 && impactScore >= 0.8) {
      return RiskLevel.CRITICAL;
    }
    
    // 特別なケース: すべてLOW以下の場合はMINIMAL
    if (threatScore <= 0.4 && vulnScore <= 0.33 && impactScore <= 0.4) {
      return RiskLevel.MINIMAL;
    }

    return this.scoreToRiskLevel(riskScore);
  }

  /**
   * 完全なリスク評価を実行
   */
  performRiskAssessment(assessment: RiskAssessment): RiskAssessmentResult {
    if (!assessment) {
      throw new Error('Risk assessment is required');
    }

    // 脅威評価
    const threatLikelihood = this.assessOverallThreatLikelihood(assessment.threatEvents);
    
    // 脆弱性評価
    const vulnerabilitySeverity = this.assessCombinedVulnerabilities(assessment.vulnerabilities);
    
    // 影響評価
    const impactLevel = this.assessOverallImpact(assessment.threatEvents);

    // リスクマトリクス適用
    const matrix: NISTRiskMatrix = {
      threatLikelihood,
      vulnerabilitySeverity,
      impactLevel
    };

    const inherentRisk = this.applyRiskMatrix(matrix);
    
    // コントロール有効性を考慮
    const mitigatedRisk = this.applyControlEffectiveness(inherentRisk, assessment.controlEffectiveness);

    // 推奨事項生成
    const recommendations = this.generateRecommendations(inherentRisk);

    return {
      assessmentId: assessment.id,
      inherentRiskLevel: inherentRisk,
      mitigatedRiskLevel: mitigatedRisk,
      overallRiskLevel: mitigatedRisk,
      recommendations,
      riskScore: this.riskLevelToScore(inherentRisk)
    };
  }

  /**
   * リスクレベルから優先度を取得
   */
  getRiskPriority(riskLevel: string): number {
    const priorities: Record<string, number> = {
      'CRITICAL': 5,
      'HIGH': 4,
      'MEDIUM': 3,
      'LOW': 2,
      'MINIMAL': 1
    };
    return priorities[riskLevel] || 0;
  }

  /**
   * リスクアイテムを優先度でソート
   */
  sortByRiskPriority(risks: RiskItem[]): RiskItem[] {
    return risks.sort((a, b) => {
      const priorityA = this.getRiskPriority(a.level);
      const priorityB = this.getRiskPriority(b.level);
      return priorityB - priorityA;
    });
  }

  /**
   * リスクレベルに応じた推奨事項を生成
   */
  generateRecommendations(riskLevel: RiskLevel | string): RiskRecommendation[] {
    const recommendations: RiskRecommendation[] = [];

    if (riskLevel === 'CRITICAL' || riskLevel === RiskLevel.CRITICAL) {
      recommendations.push({
        priority: 'CRITICAL',
        action: '即座にシステムを隔離し、緊急対応チームを招集',
        timeline: '直ちに（24時間以内）',
        expectedBenefit: 'システムへの深刻な被害を防止',
        complexity: 'HIGH',
        estimatedCost: 'HIGH'
      });
      recommendations.push({
        priority: 'CRITICAL',
        action: '脆弱性の根本原因を特定し、パッチを適用',
        timeline: '48時間以内',
        expectedBenefit: '再発防止と脆弱性の完全な修正',
        complexity: 'HIGH',
        estimatedCost: 'MEDIUM'
      });
    } else if (riskLevel === 'HIGH' || riskLevel === RiskLevel.HIGH) {
      recommendations.push({
        priority: 'HIGH',
        action: '影響範囲を特定し、一時的な緩和策を実施',
        timeline: '1週間以内',
        expectedBenefit: 'リスクの部分的な軽減',
        complexity: 'MEDIUM',
        estimatedCost: 'MEDIUM'
      });
    } else if (riskLevel === 'MEDIUM' || riskLevel === RiskLevel.MEDIUM) {
      recommendations.push({
        priority: 'MEDIUM',
        action: '定期的な監視を強化し、異常を早期検出',
        timeline: '2週間以内',
        expectedBenefit: 'リスクの早期発見と対応',
        complexity: 'LOW',
        estimatedCost: 'LOW'
      });
    } else if (riskLevel === 'LOW' || riskLevel === RiskLevel.LOW) {
      recommendations.push({
        priority: 'LOW',
        action: '次回の定期メンテナンスで対応を検討',
        timeline: '1ヶ月以内',
        expectedBenefit: 'リスクの計画的な解消',
        complexity: 'LOW',
        estimatedCost: 'LOW'
      });
    } else {
      recommendations.push({
        priority: 'LOW',
        action: '現状を記録し、定期レビューで再評価',
        timeline: '3ヶ月以内',
        expectedBenefit: 'リスクの継続的な監視',
        complexity: 'LOW',
        estimatedCost: 'LOW'
      });
    }

    return recommendations;
  }

  // ========== Private Helper Methods ==========

  private levelToScore(level: string): number {
    const scores: Record<string, number> = {
      'VERY_LOW': 0.2,
      'LOW': 0.4,
      'MODERATE': 0.6,
      'HIGH': 0.8,
      'VERY_HIGH': 1.0
    };
    return scores[level] || 0.5;
  }

  private severityToScore(severity: string): number {
    const scores: Record<string, number> = {
      'VERY_LOW': 0.17,
      'LOW': 0.33,
      'MODERATE': 0.5,
      'HIGH': 0.67,
      'VERY_HIGH': 0.83,
      'CRITICAL': 1.0
    };
    return scores[severity] || 0.5;
  }

  private targetingToScore(targeting: string): number {
    const scores: Record<string, number> = {
      'NONE': 0,
      'OPPORTUNISTIC': 0.33,
      'FOCUSED': 0.67,
      'SPECIFIC': 1.0
    };
    return scores[targeting] || 0;
  }

  private detectabilityToScore(detectability: string): number {
    const scores: Record<string, number> = {
      'VERY_EASY': 1.0,
      'EASY': 0.8,
      'MODERATE': 0.6,
      'HARD': 0.4,
      'VERY_HARD': 0.2
    };
    return scores[detectability] || 0.5;
  }

  private scoreToLevel(score: number): string {
    if (score >= 0.8) return 'VERY_HIGH';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MODERATE';
    if (score >= 0.2) return 'LOW';
    return 'VERY_LOW';
  }

  private scoreToRiskLevel(score: number): RiskLevel {
    if (score >= 0.8) return RiskLevel.CRITICAL;
    if (score >= 0.6) return RiskLevel.HIGH;
    if (score >= 0.4) return RiskLevel.MEDIUM;
    if (score >= 0.2) return RiskLevel.LOW;
    return RiskLevel.MINIMAL;
  }

  private riskLevelToScore(riskLevel: RiskLevel | string): number {
    const scores: Record<string, number> = {
      'CRITICAL': 100,
      'HIGH': 80,
      'MEDIUM': 60,
      'LOW': 40,
      'MINIMAL': 20
    };
    return scores[riskLevel.toString()] || 50;
  }

  private capabilityToLikelihood(capability: CapabilityLevel): LikelihoodLevel {
    // 環境脅威の場合、能力が高いほど可能性は低い（稀な事象）
    const mapping: Record<CapabilityLevel, LikelihoodLevel> = {
      'VERY_HIGH': 'LOW',
      'HIGH': 'LOW',
      'MODERATE': 'MODERATE',
      'LOW': 'MODERATE',
      'VERY_LOW': 'HIGH'
    };
    return mapping[capability] || 'MODERATE';
  }

  private getEnvironmentalScope(capability: CapabilityLevel): 'LIMITED' | 'MODERATE' | 'EXTENSIVE' {
    const mapping: Record<CapabilityLevel, 'LIMITED' | 'MODERATE' | 'EXTENSIVE'> = {
      'VERY_HIGH': 'EXTENSIVE',
      'HIGH': 'EXTENSIVE',
      'MODERATE': 'MODERATE',
      'LOW': 'LIMITED',
      'VERY_LOW': 'LIMITED'
    };
    return mapping[capability] || 'MODERATE';
  }

  private getRecoveryTime(capability: CapabilityLevel): 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS' {
    const mapping: Record<CapabilityLevel, 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS'> = {
      'VERY_HIGH': 'MONTHS',
      'HIGH': 'WEEKS',
      'MODERATE': 'DAYS',
      'LOW': 'DAYS',
      'VERY_LOW': 'HOURS'
    };
    return mapping[capability] || 'DAYS';
  }

  private getHighestSeverity(severities: SeverityLevel[]): SeverityLevel {
    const order = ['CRITICAL', 'VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'VERY_LOW'];
    for (const level of order) {
      if (severities.includes(level as SeverityLevel)) {
        return level as SeverityLevel;
      }
    }
    return 'VERY_LOW';
  }

  private assessOverallThreatLikelihood(events: ThreatEvent[]): LikelihoodLevel {
    if (events.length === 0) return 'VERY_LOW';
    
    // 最も高い可能性を返す
    const likelihoods = events.map(e => e.likelihood);
    const scores = likelihoods.map(l => this.levelToScore(l));
    const maxScore = Math.max(...scores);
    return this.scoreToLevel(maxScore) as LikelihoodLevel;
  }

  private assessOverallImpact(events: ThreatEvent[]): ImpactLevel {
    if (events.length === 0) return 'VERY_LOW';
    
    // 最も高い影響を返す
    const impacts = events.map(e => e.impact);
    const scores = impacts.map(i => this.levelToScore(i));
    const maxScore = Math.max(...scores);
    return this.scoreToLevel(maxScore) as ImpactLevel;
  }

  private applyControlEffectiveness(riskLevel: RiskLevel, effectiveness: number): RiskLevel {
    if (effectiveness <= 0 || effectiveness >= 1) {
      return riskLevel;
    }

    const score = this.riskLevelToScore(riskLevel);
    const mitigatedScore = score * (1 - effectiveness);
    return this.scoreToRiskLevel(mitigatedScore / 100);
  }
}