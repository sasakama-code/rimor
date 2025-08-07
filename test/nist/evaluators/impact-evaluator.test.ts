/**
 * ImpactEvaluator テスト
 * ビジネスインパクト評価システムのテスト仕様
 * 
 * TDD Red Phase: 失敗するテストを最初に作成
 * YAGNI原則: 必要な機能のみテスト
 */

import { ImpactEvaluator } from '../../../src/nist/evaluators/ImpactEvaluator';
import { RiskLevel } from '../../../src/nist/types/unified-analysis-result';
import { ImpactLevel } from '../../../src/nist/types/nist-types';

describe('ImpactEvaluator', () => {
  let evaluator: ImpactEvaluator;

  beforeEach(() => {
    evaluator = new ImpactEvaluator();
  });

  describe('ビジネスインパクト評価', () => {
    it('影響度レベルをビジネスインパクトスコアに変換する', () => {
      expect(evaluator.impactLevelToScore('VERY_HIGH')).toBe(100);
      expect(evaluator.impactLevelToScore('HIGH')).toBe(80);
      expect(evaluator.impactLevelToScore('MODERATE')).toBe(60);
      expect(evaluator.impactLevelToScore('LOW')).toBe(40);
      expect(evaluator.impactLevelToScore('VERY_LOW')).toBe(20);
    });

    it('クリティカルパスへの影響を評価する', () => {
      const criticalPath = {
        pathId: 'CP-001',
        pathName: '決済処理システム',
        components: ['auth', 'payment', 'database'],
        businessValue: 'CRITICAL' as const,
        downTimeImpact: 'SEVERE' as const
      };

      const impact = evaluator.assessCriticalPathImpact(criticalPath);
      expect(impact.riskLevel).toBe(RiskLevel.CRITICAL);
      expect(impact.businessImpactScore).toBeGreaterThan(90);
      expect(impact.urgency).toBe('IMMEDIATE');
    });

    it('影響範囲を算出する', () => {
      const affectedAssets = [
        { assetId: 'A-001', type: 'DATABASE', criticality: 'HIGH' as const },
        { assetId: 'A-002', type: 'API', criticality: 'MEDIUM' as const },
        { assetId: 'A-003', type: 'UI', criticality: 'LOW' as const }
      ];

      const scope = evaluator.calculateImpactScope(affectedAssets);
      expect(scope.totalAssets).toBe(3);
      expect(scope.criticalAssets).toBe(1);
      expect(scope.overallImpact).toBe('HIGH');
    });
  });

  describe('財務影響評価', () => {
    it('ダウンタイムによる財務影響を計算する', () => {
      const downtime = {
        estimatedHours: 4,
        revenuePerHour: 50000,
        operationalCostPerHour: 10000
      };

      const financialImpact = evaluator.calculateFinancialImpact(downtime);
      expect(financialImpact.totalLoss).toBe(240000);
      expect(financialImpact.revenueLoss).toBe(200000);
      expect(financialImpact.operationalCost).toBe(40000);
      expect(financialImpact.severity).toBe('HIGH');
    });

    it('規制遵守違反の影響を評価する', () => {
      const compliance = {
        regulation: 'GDPR',
        violationType: 'DATA_BREACH',
        affectedRecords: 10000,
        maxPenalty: 20000000
      };

      const impact = evaluator.assessComplianceImpact(compliance);
      expect(impact.riskLevel).toBe(RiskLevel.CRITICAL);
      expect(impact.potentialPenalty).toBeGreaterThan(0);
      expect(impact.reputationalDamage).toBe('SEVERE');
    });
  });

  describe('レピュテーション影響評価', () => {
    it('ブランド評価への影響を算出する', () => {
      const incident = {
        type: 'DATA_BREACH',
        publicExposure: 'HIGH' as const,
        mediaAttention: 'SIGNIFICANT' as const,
        customerImpact: 5000
      };

      const reputationImpact = evaluator.assessReputationImpact(incident);
      expect(reputationImpact.severity).toBe('HIGH');
      expect(reputationImpact.recoveryTime).toBe('MONTHS');
      expect(reputationImpact.customerTrustLoss).toBeGreaterThan(30);
    });

    it('顧客離反リスクを評価する', () => {
      const customerImpact = {
        affectedCustomers: 1000,
        averageLifetimeValue: 10000,
        churnProbability: 0.2
      };

      const churnRisk = evaluator.calculateCustomerChurnRisk(customerImpact);
      expect(churnRisk.potentialRevenueLoss).toBe(2000000);
      expect(churnRisk.riskLevel).toBe('HIGH');
    });
  });

  describe('統合影響評価', () => {
    it('複数の影響要因を統合評価する', () => {
      const impacts = {
        technical: { severity: 'HIGH', score: 80 },
        business: { severity: 'CRITICAL', score: 95 },
        financial: { severity: 'MODERATE', score: 60 },
        reputation: { severity: 'HIGH', score: 75 }
      };

      const overallImpact = evaluator.calculateOverallImpact(impacts);
      expect(overallImpact.combinedScore).toBeGreaterThan(75);
      expect(overallImpact.primaryRisk).toBe('business');
      expect(overallImpact.riskLevel).toBe(RiskLevel.CRITICAL);
    });

    it('時間的要因を考慮した影響度を算出する', () => {
      const timeFactors = {
        immediateImpact: 'MODERATE',
        shortTermImpact: 'HIGH',
        longTermImpact: 'CRITICAL',
        recoveryTime: 90 // days
      };

      const temporalImpact = evaluator.assessTemporalImpact(timeFactors);
      expect(temporalImpact.urgencyLevel).toBe('IMMEDIATE');
      expect(temporalImpact.escalationRisk).toBe(true);
    });
  });

  describe('推奨事項生成', () => {
    it('影響度に応じた緩和策を提案する', () => {
      const impact = {
        level: 'CRITICAL' as ImpactLevel,
        type: 'BUSINESS_CONTINUITY',
        affectedSystems: ['payment', 'authentication']
      };

      const mitigations = evaluator.generateMitigationStrategies(impact);
      expect(mitigations.length).toBeGreaterThan(0);
      expect(mitigations[0].priority).toBe('IMMEDIATE');
      expect(mitigations[0].strategy).toContain('フェイルオーバー');
    });

    it('復旧計画を生成する', () => {
      const incident = {
        impactLevel: 'HIGH' as ImpactLevel,
        affectedComponents: 5,
        estimatedDowntime: 4
      };

      const recoveryPlan = evaluator.generateRecoveryPlan(incident);
      expect(recoveryPlan.phases.length).toBeGreaterThan(0);
      expect(recoveryPlan.totalEstimatedTime).toBeGreaterThan(0);
      expect(recoveryPlan.criticalMilestones.length).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な影響度レベルを適切に処理する', () => {
      expect(() => evaluator.impactLevelToScore('INVALID' as any))
        .toThrow('Invalid impact level');
    });

    it('nullの資産リストを適切に処理する', () => {
      const scope = evaluator.calculateImpactScope(null as any);
      expect(scope.totalAssets).toBe(0);
      expect(scope.overallImpact).toBe('NONE');
    });
  });
});