/**
 * RiskScorer テスト
 * 総合リスクスコア算出システムのテスト仕様
 * 
 * TDD Red Phase: 失敗するテストを最初に作成
 * YAGNI原則: 必要な機能のみテスト
 */

import { RiskScorer, RiskAssessmentInfo } from '../../../src/nist/scorers/RiskScorer';
import { RiskLevel } from '../../../src/nist/types/unified-analysis-result';
import { 
  Threat, 
  Vulnerability, 
  Impact,
  RiskMatrix
} from '../../../src/nist/types/nist-types';

describe('RiskScorer', () => {
  let scorer: RiskScorer;

  beforeEach(() => {
    scorer = new RiskScorer();
  });

  describe('NISTリスクマトリクス適用', () => {
    it('脅威と脆弱性からリスクレベルを算出する', () => {
      const threat: Threat = {
        id: 'T-001',
        name: 'SQLインジェクション攻撃',
        category: 'INJECTION',
        likelihood: 'HIGH',
        description: '外部攻撃者によるSQLインジェクション'
      };

      const vulnerability: Vulnerability = {
        id: 'V-001',
        description: '入力検証の不備',
        severity: 'HIGH',
        exploitability: 'HIGH',
        detectability: 'EASY',
        affectedAssets: ['database'],
        cvssScore: 8.5
      };

      const riskLevel = scorer.applyNistMatrix(threat, vulnerability);
      expect(riskLevel).toBe('HIGH');
    });

    it('複数の脅威・脆弱性ペアから最高リスクを特定する', () => {
      const pairs = [
        { 
          threat: { likelihood: 'LOW' } as Threat, 
          vulnerability: { severity: 'LOW' } as Vulnerability 
        },
        { 
          threat: { likelihood: 'HIGH' } as Threat, 
          vulnerability: { severity: 'CRITICAL' } as Vulnerability 
        },
        { 
          threat: { likelihood: 'MODERATE' } as Threat, 
          vulnerability: { severity: 'MODERATE' } as Vulnerability 
        }
      ];

      const highestRisk = scorer.findHighestRisk(pairs);
      expect(highestRisk).toBe('CRITICAL');
    });
  });

  describe('総合リスクスコア計算', () => {
    it('複数の評価要素から総合スコアを算出する', () => {
      const components = {
        threatScore: 80,
        vulnerabilityScore: 75,
        impactScore: 90,
        likelihoodScore: 70
      };

      const overallScore = scorer.calculateOverallRisk(components);
      expect(overallScore.score).toBeGreaterThan(75);
      expect(overallScore.riskLevel).toBe('HIGH');
      expect(overallScore.confidence).toBeGreaterThan(0.7);
    });

    it('重み付けを考慮したスコア計算を行う', () => {
      const components = {
        threatScore: 50,
        vulnerabilityScore: 50,
        impactScore: 100,  // 影響度が高い
        likelihoodScore: 30
      };

      const weights = {
        threat: 0.2,
        vulnerability: 0.25,
        impact: 0.4,  // 影響度を重視
        likelihood: 0.15
      };

      const weightedScore = scorer.calculateWeightedScore(components, weights);
      expect(weightedScore).toBeGreaterThan(60); // 影響度重視により高スコア
    });
  });

  describe('リスク集約', () => {
    it('複数のリスクを集約して統計情報を生成する', () => {
      const risks: { riskLevel: RiskLevel; score: number }[] = [
        { riskLevel: RiskLevel.CRITICAL, score: 95 },
        { riskLevel: RiskLevel.HIGH, score: 80 },
        { riskLevel: RiskLevel.HIGH, score: 75 },
        { riskLevel: RiskLevel.MEDIUM, score: 60 },
        { riskLevel: RiskLevel.LOW, score: 30 }
      ];

      const aggregated = scorer.aggregateRisks(risks);
      expect(aggregated.totalRisks).toBe(5);
      expect(aggregated.criticalCount).toBe(1);
      expect(aggregated.highCount).toBe(2);
      expect(aggregated.averageScore).toBeCloseTo(68, 0);
      expect(aggregated.maxScore).toBe(95);
    });

    it('カテゴリ別にリスクを集約する', () => {
      const categorizedRisks: { category: string, riskLevel: RiskLevel, score: number }[] = [
        { category: 'INJECTION', riskLevel: RiskLevel.HIGH, score: 80 },
        { category: 'INJECTION', riskLevel: RiskLevel.MEDIUM, score: 60 },
        { category: 'AUTH', riskLevel: RiskLevel.CRITICAL, score: 95 },
        { category: 'XSS', riskLevel: RiskLevel.LOW, score: 30 }
      ];

      const byCategory = scorer.aggregateByCategory(categorizedRisks);
      expect(byCategory['INJECTION'].count).toBe(2);
      expect(byCategory['INJECTION'].averageScore).toBe(70);
      expect(byCategory['AUTH'].maxRiskLevel).toBe('CRITICAL');
    });
  });

  describe('リスクトレンド分析', () => {
    it('時系列でリスクの変化を分析する', () => {
      const historicalData: { date: string, score: number, riskLevel: RiskLevel }[] = [
        { date: '2024-01-01', score: 60, riskLevel: RiskLevel.MEDIUM },
        { date: '2024-02-01', score: 70, riskLevel: RiskLevel.HIGH },
        { date: '2024-03-01', score: 75, riskLevel: RiskLevel.HIGH },
        { date: '2024-04-01', score: 85, riskLevel: RiskLevel.CRITICAL }
      ];

      const trend = scorer.analyzeTrend(historicalData);
      expect(trend.direction).toBe('INCREASING');
      expect(trend.changeRate).toBeGreaterThan(0);
      expect(trend.projection).toBeGreaterThan(85);
    });
  });

  describe('推奨アクション生成', () => {
    it('リスクレベルに応じた推奨アクションを生成する', () => {
      const riskAssessment: RiskAssessmentInfo = {
        riskLevel: RiskLevel.CRITICAL,
        score: 92,
        category: 'INJECTION',
        affectedAssets: ['database', 'api']
      };

      const actions = scorer.generateRecommendedActions(riskAssessment);
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].priority).toBe('IMMEDIATE');
      expect(actions[0].action).toContain('直ちに');
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な入力を適切に処理する', () => {
      expect(() => scorer.calculateOverallRisk(null as any))
        .toThrow('Invalid risk components');
    });

    it('空のリスクリストを適切に処理する', () => {
      const aggregated = scorer.aggregateRisks([]);
      expect(aggregated.totalRisks).toBe(0);
      expect(aggregated.averageScore).toBe(0);
    });
  });
});