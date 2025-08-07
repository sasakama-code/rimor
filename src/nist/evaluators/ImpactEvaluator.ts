/**
 * ImpactEvaluator
 * ビジネスインパクト評価システム
 * 
 * SOLID原則: 単一責任の原則 - ビジネスインパクト評価に特化
 * DRY原則: 共通ロジックの一元化
 * KISS原則: シンプルで理解しやすい実装
 * YAGNI原則: Phase 3要件のみ実装
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { RiskLevel } from '../types/unified-analysis-result';
import { ImpactLevel } from '../types/nist-types';

/**
 * クリティカルパス定義
 */
export interface CriticalPath {
  pathId: string;
  pathName: string;
  components: string[];
  businessValue: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  downTimeImpact: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}

/**
 * クリティカルパス影響評価結果
 */
export interface CriticalPathImpact {
  riskLevel: RiskLevel;
  businessImpactScore: number;
  urgency: 'IMMEDIATE' | 'URGENT' | 'PLANNED' | 'DEFERRED';
}

/**
 * 影響を受ける資産
 */
export interface AffectedAsset {
  assetId: string;
  type: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 影響範囲
 */
export interface ImpactScope {
  totalAssets: number;
  criticalAssets: number;
  overallImpact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * ダウンタイム情報
 */
export interface DowntimeInfo {
  estimatedHours: number;
  revenuePerHour: number;
  operationalCostPerHour: number;
}

/**
 * 財務影響
 */
export interface FinancialImpact {
  totalLoss: number;
  revenueLoss: number;
  operationalCost: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 規制遵守情報
 */
export interface ComplianceInfo {
  regulation: string;
  violationType: string;
  affectedRecords: number;
  maxPenalty: number;
}

/**
 * 規制遵守影響
 */
export interface ComplianceImpact {
  riskLevel: RiskLevel;
  potentialPenalty: number;
  reputationalDamage: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}

/**
 * インシデント情報
 */
export interface IncidentInfo {
  type: string;
  publicExposure: 'HIGH' | 'MEDIUM' | 'LOW';
  mediaAttention: 'SIGNIFICANT' | 'MODERATE' | 'MINIMAL';
  customerImpact: number;
}

/**
 * レピュテーション影響
 */
export interface ReputationImpact {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recoveryTime: 'YEARS' | 'MONTHS' | 'WEEKS' | 'DAYS';
  customerTrustLoss: number;
}

/**
 * 顧客影響情報
 */
export interface CustomerImpactInfo {
  affectedCustomers: number;
  averageLifetimeValue: number;
  churnProbability: number;
}

/**
 * 顧客離反リスク
 */
export interface CustomerChurnRisk {
  potentialRevenueLoss: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * 統合影響
 */
export interface IntegratedImpacts {
  technical: { severity: string; score: number };
  business: { severity: string; score: number };
  financial: { severity: string; score: number };
  reputation: { severity: string; score: number };
}

/**
 * 全体影響評価結果
 */
export interface OverallImpactResult {
  combinedScore: number;
  primaryRisk: string;
  riskLevel: RiskLevel;
}

/**
 * 時間的要因
 */
export interface TimeFactors {
  immediateImpact: string;
  shortTermImpact: string;
  longTermImpact: string;
  recoveryTime: number;
}

/**
 * 時間的影響
 */
export interface TemporalImpact {
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  escalationRisk: boolean;
}

/**
 * 影響情報
 */
export interface ImpactInfo {
  level: ImpactLevel;
  type: string;
  affectedSystems: string[];
}

/**
 * 緩和戦略
 */
export interface MitigationStrategy {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  strategy: string;
  estimatedEffort: string;
}

/**
 * インシデント詳細
 */
export interface IncidentDetail {
  impactLevel: ImpactLevel;
  affectedComponents: number;
  estimatedDowntime: number;
}

/**
 * 復旧計画
 */
export interface RecoveryPlan {
  phases: RecoveryPhase[];
  totalEstimatedTime: number;
  criticalMilestones: string[];
}

/**
 * 復旧フェーズ
 */
export interface RecoveryPhase {
  name: string;
  duration: number;
  tasks: string[];
}

/**
 * ビジネスインパクト評価器
 */
export class ImpactEvaluator {
  /**
   * 影響度レベルをビジネスインパクトスコアに変換
   */
  impactLevelToScore(level: ImpactLevel): number {
    // 入力検証
    const validLevels: ImpactLevel[] = ['VERY_HIGH', 'HIGH', 'MODERATE', 'LOW', 'VERY_LOW'];
    if (!validLevels.includes(level)) {
      throw new Error('Invalid impact level');
    }

    const scoreMap: Record<ImpactLevel, number> = {
      'VERY_HIGH': 100,
      'HIGH': 80,
      'MODERATE': 60,
      'LOW': 40,
      'VERY_LOW': 20
    };
    
    return scoreMap[level];
  }

  /**
   * クリティカルパスへの影響を評価
   */
  assessCriticalPathImpact(criticalPath: CriticalPath): CriticalPathImpact {
    // 入力検証
    if (!criticalPath) {
      throw new Error('CriticalPath is required');
    }

    // ビジネス価値とダウンタイム影響から評価
    const isHighValue = criticalPath.businessValue === 'CRITICAL' || criticalPath.businessValue === 'HIGH';
    const isSevereImpact = criticalPath.downTimeImpact === 'SEVERE' || criticalPath.downTimeImpact === 'HIGH';

    let riskLevel: RiskLevel;
    let businessImpactScore: number;
    let urgency: CriticalPathImpact['urgency'];

    if (criticalPath.businessValue === 'CRITICAL' && criticalPath.downTimeImpact === 'SEVERE') {
      riskLevel = RiskLevel.CRITICAL;
      businessImpactScore = 95;
      urgency = 'IMMEDIATE';
    } else if (isHighValue && isSevereImpact) {
      riskLevel = RiskLevel.HIGH;
      businessImpactScore = 85;
      urgency = 'URGENT';
    } else if (isHighValue || isSevereImpact) {
      riskLevel = RiskLevel.MEDIUM;
      businessImpactScore = 70;
      urgency = 'PLANNED';
    } else {
      riskLevel = RiskLevel.LOW;
      businessImpactScore = 40;
      urgency = 'DEFERRED';
    }

    return {
      riskLevel,
      businessImpactScore,
      urgency
    };
  }

  /**
   * 影響範囲を算出
   */
  calculateImpactScope(affectedAssets: AffectedAsset[] | null): ImpactScope {
    // 入力検証（nullを特別扱い）
    if (!affectedAssets || affectedAssets.length === 0) {
      return {
        totalAssets: 0,
        criticalAssets: 0,
        overallImpact: affectedAssets === null ? 'NONE' as any : 'LOW'
      };
    }

    const totalAssets = affectedAssets.length;
    const criticalAssets = affectedAssets.filter(asset => asset.criticality === 'HIGH').length;
    
    let overallImpact: ImpactScope['overallImpact'];
    
    if (criticalAssets > 0) {
      overallImpact = 'HIGH';
    } else if (affectedAssets.some(asset => asset.criticality === 'MEDIUM')) {
      overallImpact = 'MEDIUM';
    } else {
      overallImpact = 'LOW';
    }

    return {
      totalAssets,
      criticalAssets,
      overallImpact
    };
  }

  /**
   * ダウンタイムによる財務影響を計算
   */
  calculateFinancialImpact(downtime: DowntimeInfo): FinancialImpact {
    // 入力検証
    if (!downtime) {
      throw new Error('DowntimeInfo is required');
    }

    const revenueLoss = downtime.estimatedHours * downtime.revenuePerHour;
    const operationalCost = downtime.estimatedHours * downtime.operationalCostPerHour;
    const totalLoss = revenueLoss + operationalCost;

    let severity: FinancialImpact['severity'];
    
    if (totalLoss >= 1000000) {
      severity = 'CRITICAL';
    } else if (totalLoss >= 100000) {
      severity = 'HIGH';
    } else if (totalLoss >= 10000) {
      severity = 'MEDIUM';
    } else {
      severity = 'LOW';
    }

    return {
      totalLoss,
      revenueLoss,
      operationalCost,
      severity
    };
  }

  /**
   * 規制遵守違反の影響を評価
   */
  assessComplianceImpact(compliance: ComplianceInfo): ComplianceImpact {
    // 入力検証
    if (!compliance) {
      throw new Error('ComplianceInfo is required');
    }

    let riskLevel: RiskLevel;
    let reputationalDamage: ComplianceImpact['reputationalDamage'];
    
    // GDPR等の重要な規制
    if (compliance.regulation === 'GDPR' || compliance.regulation === 'HIPAA') {
      if (compliance.violationType === 'DATA_BREACH' && compliance.affectedRecords >= 1000) {
        riskLevel = RiskLevel.CRITICAL;
        reputationalDamage = 'SEVERE';
      } else {
        riskLevel = RiskLevel.HIGH;
        reputationalDamage = 'HIGH';
      }
    } else {
      riskLevel = RiskLevel.MEDIUM;
      reputationalDamage = 'MODERATE';
    }

    // 潜在的な罰金の計算（簡略化）
    const potentialPenalty = Math.min(
      compliance.maxPenalty,
      compliance.affectedRecords * 100
    );

    return {
      riskLevel,
      potentialPenalty,
      reputationalDamage
    };
  }

  /**
   * ブランド評価への影響を算出
   */
  assessReputationImpact(incident: IncidentInfo): ReputationImpact {
    // 入力検証
    if (!incident) {
      throw new Error('IncidentInfo is required');
    }

    let severity: ReputationImpact['severity'];
    let recoveryTime: ReputationImpact['recoveryTime'];
    let customerTrustLoss: number;

    const isHighExposure = incident.publicExposure === 'HIGH';
    const isSignificantAttention = incident.mediaAttention === 'SIGNIFICANT';
    
    if (incident.type === 'DATA_BREACH' && isHighExposure && isSignificantAttention) {
      severity = 'HIGH';
      recoveryTime = 'MONTHS';
      customerTrustLoss = 40;
    } else if (isHighExposure || isSignificantAttention) {
      severity = 'MEDIUM';
      recoveryTime = 'WEEKS';
      customerTrustLoss = 20;
    } else {
      severity = 'LOW';
      recoveryTime = 'DAYS';
      customerTrustLoss = 5;
    }

    return {
      severity,
      recoveryTime,
      customerTrustLoss
    };
  }

  /**
   * 総合的なビジネスインパクトを評価
   */
  assessOverallBusinessImpact(
    criticalPath?: CriticalPath,
    affectedAssets?: AffectedAsset[],
    downtime?: DowntimeInfo,
    compliance?: ComplianceInfo,
    incident?: IncidentInfo
  ): {
    overallRiskLevel: RiskLevel;
    totalImpactScore: number;
    primaryConcern: string;
    recommendations: string[];
  } {
    const risks: RiskLevel[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let scoreCount = 0;
    let primaryConcern = 'なし';

    // クリティカルパス影響評価
    if (criticalPath) {
      const pathImpact = this.assessCriticalPathImpact(criticalPath);
      risks.push(pathImpact.riskLevel);
      totalScore += pathImpact.businessImpactScore;
      scoreCount++;
      if (pathImpact.riskLevel === RiskLevel.CRITICAL) {
        primaryConcern = 'クリティカルパスへの重大な影響';
        recommendations.push('クリティカルパスの冗長化と復旧計画の策定');
      }
    }

    // 影響範囲評価
    if (affectedAssets && affectedAssets.length > 0) {
      const scope = this.calculateImpactScope(affectedAssets);
      if (scope.criticalAssets > 0) {
        risks.push(RiskLevel.HIGH);
        recommendations.push('重要資産の保護強化');
      }
    }

    // 財務影響評価
    if (downtime) {
      const financial = this.calculateFinancialImpact(downtime);
      if (financial.severity === 'CRITICAL') {
        risks.push(RiskLevel.CRITICAL);
        primaryConcern = '重大な財務損失のリスク';
        recommendations.push('ダウンタイム最小化対策の実施');
      } else if (financial.severity === 'HIGH') {
        risks.push(RiskLevel.HIGH);
      }
    }

    // 規制遵守影響評価
    if (compliance) {
      const complianceImpact = this.assessComplianceImpact(compliance);
      risks.push(complianceImpact.riskLevel);
      if (complianceImpact.riskLevel === RiskLevel.CRITICAL) {
        primaryConcern = '規制違反による重大なリスク';
        recommendations.push('コンプライアンス体制の強化');
      }
    }

    // レピュテーション影響評価
    if (incident) {
      const reputation = this.assessReputationImpact(incident);
      if (reputation.severity === 'HIGH') {
        risks.push(RiskLevel.HIGH);
        recommendations.push('危機管理計画の策定とPR対策');
      }
    }

    // 最高リスクレベルを決定
    const overallRiskLevel = this.getHighestRiskLevel(risks);
    
    // 総合スコアを計算
    const totalImpactScore = scoreCount > 0 ? totalScore / scoreCount : 0;

    return {
      overallRiskLevel,
      totalImpactScore,
      primaryConcern,
      recommendations
    };
  }

  /**
   * 顧客離反リスクを評価
   */
  calculateCustomerChurnRisk(customerImpact: CustomerImpactInfo): CustomerChurnRisk {
    // 入力検証
    if (!customerImpact) {
      throw new Error('CustomerImpactInfo is required');
    }

    const potentialRevenueLoss = 
      customerImpact.affectedCustomers * 
      customerImpact.averageLifetimeValue * 
      customerImpact.churnProbability;

    let riskLevel: CustomerChurnRisk['riskLevel'];
    
    if (potentialRevenueLoss >= 5000000) {
      riskLevel = 'CRITICAL';
    } else if (potentialRevenueLoss >= 1000000) {
      riskLevel = 'HIGH';
    } else if (potentialRevenueLoss >= 100000) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      potentialRevenueLoss,
      riskLevel
    };
  }

  /**
   * 複数の影響要因を統合評価
   */
  calculateOverallImpact(impacts: IntegratedImpacts): OverallImpactResult {
    // 入力検証
    if (!impacts) {
      throw new Error('IntegratedImpacts is required');
    }

    // 重み付けスコア計算
    const weights = {
      technical: 0.2,
      business: 0.4,
      financial: 0.25,
      reputation: 0.15
    };

    const combinedScore = 
      impacts.technical.score * weights.technical +
      impacts.business.score * weights.business +
      impacts.financial.score * weights.financial +
      impacts.reputation.score * weights.reputation;

    // 最も重大な要因を特定
    const risks = Object.entries(impacts).map(([key, value]) => ({
      name: key,
      score: value.score
    }));
    const primaryRisk = risks.reduce((max, current) => 
      current.score > max.score ? current : max
    ).name;

    // リスクレベルの決定
    let riskLevel: RiskLevel;
    if (impacts.business.severity === 'CRITICAL' || combinedScore >= 90) {
      riskLevel = RiskLevel.CRITICAL;
    } else if (combinedScore >= 70) {
      riskLevel = RiskLevel.HIGH;
    } else if (combinedScore >= 50) {
      riskLevel = RiskLevel.MEDIUM;
    } else if (combinedScore >= 30) {
      riskLevel = RiskLevel.LOW;
    } else {
      riskLevel = RiskLevel.MINIMAL;
    }

    return {
      combinedScore,
      primaryRisk,
      riskLevel
    };
  }

  /**
   * 時間的要因を考慮した影響度を算出
   */
  assessTemporalImpact(timeFactors: TimeFactors): TemporalImpact {
    // 入力検証
    if (!timeFactors) {
      throw new Error('TimeFactors is required');
    }

    // 長期的影響がCRITICALの場合、高い緊急度
    const hasLongTermCritical = timeFactors.longTermImpact === 'CRITICAL';
    const hasShortTermHigh = timeFactors.shortTermImpact === 'HIGH';
    const longRecovery = timeFactors.recoveryTime > 30;

    let urgencyLevel: TemporalImpact['urgencyLevel'];
    
    if (hasLongTermCritical && longRecovery) {
      urgencyLevel = 'IMMEDIATE';
    } else if (hasShortTermHigh || longRecovery) {
      urgencyLevel = 'HIGH';
    } else if (timeFactors.immediateImpact === 'MODERATE') {
      urgencyLevel = 'MEDIUM';
    } else {
      urgencyLevel = 'LOW';
    }

    // エスカレーションリスクの判定
    const escalationRisk = hasLongTermCritical || 
      (hasShortTermHigh && longRecovery);

    return {
      urgencyLevel,
      escalationRisk
    };
  }

  /**
   * 影響度に応じた緩和策を提案
   */
  generateMitigationStrategies(impact: ImpactInfo): MitigationStrategy[] {
    // 入力検証
    if (!impact) {
      throw new Error('ImpactInfo is required');
    }

    const strategies: MitigationStrategy[] = [];

    // CRITICALな影響度の場合
    if (impact.level === 'VERY_HIGH' || impact.type === 'BUSINESS_CONTINUITY') {
      strategies.push({
        priority: 'IMMEDIATE',
        strategy: 'フェイルオーバーシステムの即座な起動と切り替え',
        estimatedEffort: '1-2時間'
      });
    }

    // 影響を受けるシステムに基づく戦略
    if (impact.affectedSystems.includes('payment')) {
      strategies.push({
        priority: 'HIGH',
        strategy: '決済システムの代替ルート確立',
        estimatedEffort: '2-4時間'
      });
    }

    if (impact.affectedSystems.includes('authentication')) {
      strategies.push({
        priority: 'HIGH',
        strategy: '認証システムのバックアップ起動',
        estimatedEffort: '1-3時間'
      });
    }

    // 基本的な緩和策
    if (strategies.length === 0) {
      strategies.push({
        priority: 'MEDIUM',
        strategy: '影響範囲の特定と一時的な回避策の実施',
        estimatedEffort: '4-8時間'
      });
    }

    return strategies;
  }

  /**
   * 復旧計画を生成
   */
  generateRecoveryPlan(incident: IncidentDetail): RecoveryPlan {
    // 入力検証
    if (!incident) {
      throw new Error('IncidentDetail is required');
    }

    const phases: RecoveryPhase[] = [];
    let totalTime = 0;
    const criticalMilestones: string[] = [];

    // Phase 1: 初期対応
    phases.push({
      name: '初期対応',
      duration: 1,
      tasks: [
        'インシデントチーム招集',
        '影響範囲の特定',
        '暫定対策の実施'
      ]
    });
    totalTime += 1;
    criticalMilestones.push('インシデント対応開始');

    // Phase 2: システム復旧
    const recoveryDuration = Math.max(2, incident.estimatedDowntime);
    phases.push({
      name: 'システム復旧',
      duration: recoveryDuration,
      tasks: [
        'システムバックアップからの復元',
        '機能テストの実施',
        '段階的サービス再開'
      ]
    });
    totalTime += recoveryDuration;
    criticalMilestones.push('主要システム復旧');

    // Phase 3: 正常化
    phases.push({
      name: '正常化',
      duration: 2,
      tasks: [
        '全サービスの復旧確認',
        'パフォーマンス監視',
        '顧客通知'
      ]
    });
    totalTime += 2;
    criticalMilestones.push('完全復旧');

    // Phase 4: 事後対応（影響度が高い場合）
    if (incident.impactLevel === 'VERY_HIGH' || incident.impactLevel === 'HIGH') {
      phases.push({
        name: '事後対応',
        duration: 3,
        tasks: [
          '根本原因分析',
          '再発防止策の策定',
          'ポストモーテム実施'
        ]
      });
      totalTime += 3;
      criticalMilestones.push('改善策実装');
    }

    return {
      phases,
      totalEstimatedTime: totalTime,
      criticalMilestones
    };
  }

  /**
   * 最高リスクレベルを取得
   */
  private getHighestRiskLevel(risks: RiskLevel[]): RiskLevel {
    if (risks.length === 0) {
      return RiskLevel.MINIMAL;
    }

    const priority: Record<RiskLevel, number> = {
      [RiskLevel.CRITICAL]: 5,
      [RiskLevel.HIGH]: 4,
      [RiskLevel.MEDIUM]: 3,
      [RiskLevel.LOW]: 2,
      [RiskLevel.MINIMAL]: 1
    };

    return risks.reduce((highest, current) => {
      return priority[current] > priority[highest] ? current : highest;
    }, RiskLevel.MINIMAL);
  }
}