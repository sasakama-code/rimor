/**
 * PriorityEngine テスト
 * NIST準拠リスク優先度エンジンのテストスイート
 * 
 * TDD Red Phase: まず失敗するテストを作成
 * t_wadaのTDD原則に従う
 */

import { PriorityEngine } from '../../../src/nist/priority/PriorityEngine';
import { RiskLevel } from '../../../src/nist/types/unified-analysis-result';
import { 
  RiskPriorityRequest,
  RiskPriorityResult,
  PriorityScore,
  BusinessImpact,
  TechnicalComplexity
} from '../../../src/nist/types/priority-types';

describe('PriorityEngine', () => {
  let engine: PriorityEngine;

  beforeEach(() => {
    engine = new PriorityEngine();
  });

  describe('単一リスクの優先度計算', () => {
    it('CRITICALリスクは最高優先度を返す', () => {
      const request: RiskPriorityRequest = {
        riskLevel: RiskLevel.CRITICAL,
        businessImpact: BusinessImpact.HIGH,
        technicalComplexity: TechnicalComplexity.LOW,
        affectedComponents: 5,
        dependencies: 10
      };

      const result = engine.calculatePriority(request);

      expect(result.priority).toBe(100);
      expect(result.urgency).toBe('IMMEDIATE');
      expect(result.recommendedAction).toContain('即座に対応');
    });

    it('MINIMALリスクは最低優先度を返す', () => {
      const request: RiskPriorityRequest = {
        riskLevel: RiskLevel.MINIMAL,
        businessImpact: BusinessImpact.LOW,
        technicalComplexity: TechnicalComplexity.HIGH,
        affectedComponents: 1,
        dependencies: 0
      };

      const result = engine.calculatePriority(request);

      expect(result.priority).toBeLessThan(30);
      expect(result.urgency).toBe('LOW');
      expect(result.recommendedAction).toContain('定期メンテナンス');
    });

    it('ビジネスインパクトが高い場合は優先度が上昇する', () => {
      const baseRequest: RiskPriorityRequest = {
        riskLevel: RiskLevel.MEDIUM,
        businessImpact: BusinessImpact.LOW,
        technicalComplexity: TechnicalComplexity.MEDIUM,
        affectedComponents: 3,
        dependencies: 5
      };

      const highImpactRequest: RiskPriorityRequest = {
        ...baseRequest,
        businessImpact: BusinessImpact.CRITICAL
      };

      const basePriority = engine.calculatePriority(baseRequest);
      const highImpactPriority = engine.calculatePriority(highImpactRequest);

      expect(highImpactPriority.priority).toBeGreaterThan(basePriority.priority);
      expect(highImpactPriority.businessImpactMultiplier).toBeGreaterThan(1.0);
    });

    it('技術的複雑性が低い場合は対応しやすさスコアが高い', () => {
      const request: RiskPriorityRequest = {
        riskLevel: RiskLevel.HIGH,
        businessImpact: BusinessImpact.MEDIUM,
        technicalComplexity: TechnicalComplexity.LOW,
        affectedComponents: 2,
        dependencies: 3
      };

      const result = engine.calculatePriority(request);

      expect(result.easinessScore).toBeGreaterThan(0.7);
      expect(result.estimatedEffort).toBe('LOW');
    });
  });

  describe('複数リスクのバッチ優先度計算', () => {
    it('複数のリスクを優先度順にソートする', () => {
      const risks: RiskPriorityRequest[] = [
        {
          riskId: 'RISK-001',
          riskLevel: RiskLevel.LOW,
          businessImpact: BusinessImpact.LOW,
          technicalComplexity: TechnicalComplexity.HIGH,
          affectedComponents: 1,
          dependencies: 0
        },
        {
          riskId: 'RISK-002',
          riskLevel: RiskLevel.CRITICAL,
          businessImpact: BusinessImpact.CRITICAL,
          technicalComplexity: TechnicalComplexity.MEDIUM,
          affectedComponents: 10,
          dependencies: 20
        },
        {
          riskId: 'RISK-003',
          riskLevel: RiskLevel.HIGH,
          businessImpact: BusinessImpact.HIGH,
          technicalComplexity: TechnicalComplexity.LOW,
          affectedComponents: 5,
          dependencies: 8
        }
      ];

      const results = engine.calculateBatchPriority(risks);

      expect(results[0].riskId).toBe('RISK-002');
      expect(results[1].riskId).toBe('RISK-003');
      expect(results[2].riskId).toBe('RISK-001');
      expect(results[0].priority).toBeGreaterThanOrEqual(results[1].priority);
      expect(results[1].priority).toBeGreaterThan(results[2].priority);
    });

    it('同じリスクレベルでもビジネスインパクトで差別化される', () => {
      const risks: RiskPriorityRequest[] = [
        {
          riskId: 'RISK-A',
          riskLevel: RiskLevel.HIGH,
          businessImpact: BusinessImpact.LOW,
          technicalComplexity: TechnicalComplexity.MEDIUM,
          affectedComponents: 3,
          dependencies: 3
        },
        {
          riskId: 'RISK-B',
          riskLevel: RiskLevel.HIGH,
          businessImpact: BusinessImpact.CRITICAL,
          technicalComplexity: TechnicalComplexity.MEDIUM,
          affectedComponents: 3,
          dependencies: 3
        }
      ];

      const results = engine.calculateBatchPriority(risks);

      expect(results[0].riskId).toBe('RISK-B');
      expect(results[0].priority).toBeGreaterThan(results[1].priority);
    });
  });

  describe('優先度スコアの詳細計算', () => {
    it('優先度スコアの構成要素が正しく計算される', () => {
      const request: RiskPriorityRequest = {
        riskLevel: RiskLevel.HIGH,
        businessImpact: BusinessImpact.HIGH,
        technicalComplexity: TechnicalComplexity.MEDIUM,
        affectedComponents: 7,
        dependencies: 15
      };

      const result = engine.calculatePriority(request);
      const scoreBreakdown = result.scoreBreakdown;

      expect(scoreBreakdown).toBeDefined();
      expect(scoreBreakdown.baseRiskScore).toBeGreaterThan(0);
      expect(scoreBreakdown.businessImpactScore).toBeGreaterThan(0);
      expect(scoreBreakdown.technicalComplexityScore).toBeGreaterThan(0);
      expect(scoreBreakdown.scopeScore).toBeGreaterThan(0);
      expect(scoreBreakdown.finalScore).toBe(result.priority);
    });

    it('スコア計算式が正しく適用される', () => {
      const request: RiskPriorityRequest = {
        riskLevel: RiskLevel.MEDIUM,
        businessImpact: BusinessImpact.MEDIUM,
        technicalComplexity: TechnicalComplexity.MEDIUM,
        affectedComponents: 5,
        dependencies: 10
      };

      const result = engine.calculatePriority(request);
      const scoreBreakdown = result.scoreBreakdown;

      const expectedFinalScore = Math.min(100,
        scoreBreakdown.baseRiskScore * 
        scoreBreakdown.businessImpactScore * 
        (1 + scoreBreakdown.scopeScore / 100) *
        (2 - scoreBreakdown.technicalComplexityScore));

      expect(scoreBreakdown.finalScore).toBeCloseTo(expectedFinalScore, 0);
    });
  });

  describe('推奨アクションの生成', () => {
    it('リスクレベルに応じた適切なアクションを提案する', () => {
      const criticalRisk: RiskPriorityRequest = {
        riskLevel: RiskLevel.CRITICAL,
        businessImpact: BusinessImpact.CRITICAL,
        technicalComplexity: TechnicalComplexity.LOW,
        affectedComponents: 10,
        dependencies: 20
      };

      const criticalResult = engine.calculatePriority(criticalRisk);
      
      expect(criticalResult.recommendedAction).toContain('即座に対応');
      expect(criticalResult.urgency).toBe('IMMEDIATE');
      expect(criticalResult.timeline).toContain('24時間以内');
    });

    it('技術的複雑性に応じたリソース配分を提案する', () => {
      const complexRisk: RiskPriorityRequest = {
        riskLevel: RiskLevel.HIGH,
        businessImpact: BusinessImpact.HIGH,
        technicalComplexity: TechnicalComplexity.VERY_HIGH,
        affectedComponents: 5,
        dependencies: 10
      };

      const result = engine.calculatePriority(complexRisk);

      expect(result.resourceAllocation).toBeDefined();
      expect(result.resourceAllocation!.recommendedTeamSize).toBeGreaterThan(2);
      expect(result.resourceAllocation!.estimatedManDays).toBeGreaterThan(5);
      expect(result.resourceAllocation!.requiredExpertise).toContain('シニアエンジニア');
    });
  });

  describe('依存関係の影響度計算', () => {
    it('依存関係が多いほど優先度が上昇する', () => {
      const fewDeps: RiskPriorityRequest = {
        riskLevel: RiskLevel.MEDIUM,
        businessImpact: BusinessImpact.MEDIUM,
        technicalComplexity: TechnicalComplexity.MEDIUM,
        affectedComponents: 3,
        dependencies: 2
      };

      const manyDeps: RiskPriorityRequest = {
        ...fewDeps,
        dependencies: 50
      };

      const fewDepsResult = engine.calculatePriority(fewDeps);
      const manyDepsResult = engine.calculatePriority(manyDeps);

      expect(manyDepsResult.priority).toBeGreaterThan(fewDepsResult.priority);
      expect(manyDepsResult.scopeScore).toBeGreaterThan(fewDepsResult.scopeScore);
    });

    it('クリティカルパス上のコンポーネントは特別な重み付けがされる', () => {
      const criticalPathRisk: RiskPriorityRequest = {
        riskLevel: RiskLevel.MEDIUM,
        businessImpact: BusinessImpact.MEDIUM,
        technicalComplexity: TechnicalComplexity.MEDIUM,
        affectedComponents: 3,
        dependencies: 5,
        isOnCriticalPath: true
      };

      const normalRisk: RiskPriorityRequest = {
        ...criticalPathRisk,
        isOnCriticalPath: false
      };

      const criticalPathResult = engine.calculatePriority(criticalPathRisk);
      const normalResult = engine.calculatePriority(normalRisk);

      expect(criticalPathResult.priority).toBeGreaterThan(normalResult.priority);
      expect(criticalPathResult.criticalPathMultiplier).toBeGreaterThan(1.0);
    });
  });

  describe('入力検証とエラーハンドリング', () => {
    it('無効な入力に対して適切なエラーを返す', () => {
      const invalidRequest: any = {
        riskLevel: 'INVALID_LEVEL',
        businessImpact: BusinessImpact.HIGH,
        technicalComplexity: TechnicalComplexity.LOW,
        affectedComponents: -1,
        dependencies: -5
      };

      expect(() => engine.calculatePriority(invalidRequest)).toThrow('Invalid risk level');
    });

    it('必須パラメータが欠けている場合にエラーを返す', () => {
      const incompleteRequest: any = {
        riskLevel: RiskLevel.HIGH
      };

      expect(() => engine.calculatePriority(incompleteRequest)).toThrow('Missing required parameters');
    });

    it('境界値の入力を適切に処理する', () => {
      const boundaryRequest: RiskPriorityRequest = {
        riskLevel: RiskLevel.HIGH,
        businessImpact: BusinessImpact.HIGH,
        technicalComplexity: TechnicalComplexity.MEDIUM,
        affectedComponents: 0,
        dependencies: 0
      };

      const result = engine.calculatePriority(boundaryRequest);

      expect(result.priority).toBeGreaterThan(0);
      expect(result.scopeScore).toBe(0);
    });
  });
});