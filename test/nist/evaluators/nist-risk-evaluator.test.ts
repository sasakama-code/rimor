/**
 * NistRiskEvaluator テスト
 * NIST SP 800-30準拠のリスク評価システム
 * 
 * TDD Red Phase: 失敗するテストを最初に作成
 * SOLID原則: 単一責任の原則に従う
 */

import { NistRiskEvaluator } from '../../../src/nist/evaluators/NistRiskEvaluator';
import { RiskLevel } from '../../../src/nist/types/unified-analysis-result';
import { 
  ThreatSource,
  ThreatEvent,
  Vulnerability,
  RiskAssessment,
  NISTRiskMatrix
} from '../../../src/nist/types/nist-types';

describe('NistRiskEvaluator', () => {
  let evaluator: NistRiskEvaluator;

  beforeEach(() => {
    evaluator = new NistRiskEvaluator();
  });

  describe('脅威源の評価', () => {
    it('脅威源の能力レベルを評価する', () => {
      const threatSource: ThreatSource = {
        id: 'TS-001',
        name: '外部攻撃者',
        type: 'ADVERSARIAL',
        capability: 'HIGH',
        intent: 'HIGH',
        targeting: 'SPECIFIC'
      };

      const capability = evaluator.evaluateThreatCapability(threatSource);
      expect(capability).toBe('HIGH');
    });

    it('内部脅威の評価を適切に行う', () => {
      const insiderThreat: ThreatSource = {
        id: 'TS-002',
        name: '内部関係者',
        type: 'ADVERSARIAL',
        capability: 'MODERATE',
        intent: 'LOW',
        targeting: 'OPPORTUNISTIC'
      };

      const riskLevel = evaluator.assessThreatSource(insiderThreat);
      expect(riskLevel).toBe('MODERATE');
    });

    it('環境脅威（非敵対的）を評価する', () => {
      const environmentalThreat: ThreatSource = {
        id: 'TS-003',
        name: '自然災害',
        type: 'ENVIRONMENTAL',
        capability: 'HIGH',
        intent: 'NONE',
        targeting: 'NONE'
      };

      const impact = evaluator.evaluateEnvironmentalThreat(environmentalThreat);
      expect(impact).toBeDefined();
      expect(impact.likelihood).toBe('LOW');
    });
  });

  describe('脅威イベントの評価', () => {
    it('脅威イベントの発生可能性を計算する', () => {
      const threatEvent: ThreatEvent = {
        id: 'TE-001',
        description: 'SQLインジェクション攻撃',
        threatSources: ['TS-001'],
        likelihood: 'HIGH',
        impact: 'HIGH',
        relevance: 'CONFIRMED'
      };

      const likelihood = evaluator.calculateThreatLikelihood(threatEvent);
      expect(likelihood).toBe('HIGH');
    });

    it('複数の脅威源を持つイベントを評価する', () => {
      const complexEvent: ThreatEvent = {
        id: 'TE-002',
        description: 'データ漏洩',
        threatSources: ['TS-001', 'TS-002'],
        likelihood: 'MODERATE',
        impact: 'VERY_HIGH',
        relevance: 'CONFIRMED'
      };

      const assessment = evaluator.assessThreatEvent(complexEvent);
      expect(assessment.overallLikelihood).toBeDefined();
      expect(assessment.overallImpact).toBe('VERY_HIGH');
    });
  });

  describe('脆弱性の評価', () => {
    it('技術的脆弱性の深刻度を評価する', () => {
      const vulnerability: Vulnerability = {
        id: 'V-001',
        description: '入力検証の欠如',
        severity: 'HIGH',
        exploitability: 'HIGH',
        detectability: 'EASY',
        affectedAssets: ['Database', 'API']
      };

      const severity = evaluator.evaluateVulnerabilitySeverity(vulnerability);
      expect(severity).toBe('HIGH');
    });

    it('脆弱性の悪用可能性を計算する', () => {
      const vulnerability: Vulnerability = {
        id: 'V-002',
        description: '弱い暗号化',
        severity: 'MODERATE',
        exploitability: 'MODERATE',
        detectability: 'MODERATE',
        affectedAssets: ['UserData']
      };

      const exploitability = evaluator.calculateExploitability(vulnerability);
      expect(exploitability).toBeGreaterThan(0);
      expect(exploitability).toBeLessThanOrEqual(1);
    });

    it('複数の脆弱性の組み合わせリスクを評価する', () => {
      const vulnerabilities: Vulnerability[] = [
        {
          id: 'V-001',
          description: '入力検証の欠如',
          severity: 'HIGH',
          exploitability: 'HIGH',
          detectability: 'EASY',
          affectedAssets: ['Database']
        },
        {
          id: 'V-003',
          description: '認証バイパス',
          severity: 'CRITICAL',
          exploitability: 'MODERATE',
          detectability: 'HARD',
          affectedAssets: ['Authentication']
        }
      ];

      const combinedRisk = evaluator.assessCombinedVulnerabilities(vulnerabilities);
      expect(combinedRisk).toBe('CRITICAL');
    });
  });

  describe('NISTリスクマトリクスの適用', () => {
    it('脅威と脆弱性からリスクレベルを決定する', () => {
      const matrix: NISTRiskMatrix = {
        threatLikelihood: 'HIGH',
        vulnerabilitySeverity: 'HIGH',
        impactLevel: 'HIGH'
      };

      const riskLevel = evaluator.applyRiskMatrix(matrix);
      expect(riskLevel).toBe(RiskLevel.CRITICAL);
    });

    it('低脅威・低脆弱性の場合のリスクレベル', () => {
      const matrix: NISTRiskMatrix = {
        threatLikelihood: 'LOW',
        vulnerabilitySeverity: 'LOW',
        impactLevel: 'LOW'
      };

      const riskLevel = evaluator.applyRiskMatrix(matrix);
      expect(riskLevel).toBe(RiskLevel.MINIMAL);
    });

    it('高脅威・低脆弱性の場合のリスクレベル', () => {
      const matrix: NISTRiskMatrix = {
        threatLikelihood: 'HIGH',
        vulnerabilitySeverity: 'LOW',
        impactLevel: 'MODERATE'
      };

      const riskLevel = evaluator.applyRiskMatrix(matrix);
      expect(riskLevel).toBe(RiskLevel.MEDIUM);
    });
  });

  describe('総合リスク評価', () => {
    it('完全なリスク評価を実行する', () => {
      const assessment: RiskAssessment = {
        id: 'RA-001',
        name: 'Webアプリケーションセキュリティ評価',
        threatSources: [
          {
            id: 'TS-001',
            name: '外部攻撃者',
            type: 'ADVERSARIAL',
            capability: 'HIGH',
            intent: 'HIGH',
            targeting: 'SPECIFIC'
          }
        ],
        threatEvents: [
          {
            id: 'TE-001',
            description: 'SQLインジェクション',
            threatSources: ['TS-001'],
            likelihood: 'HIGH',
            impact: 'HIGH',
            relevance: 'CONFIRMED'
          }
        ],
        vulnerabilities: [
          {
            id: 'V-001',
            description: '入力検証の欠如',
            severity: 'HIGH',
            exploitability: 'HIGH',
            detectability: 'EASY',
            affectedAssets: ['Database']
          }
        ],
        controlEffectiveness: 0.3
      };

      const result = evaluator.performRiskAssessment(assessment);
      
      expect(result).toBeDefined();
      expect(result.overallRiskLevel).toBeDefined();
      expect(Object.values(RiskLevel)).toContain(result.overallRiskLevel);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('コントロールの有効性を考慮したリスク評価', () => {
      const assessment: RiskAssessment = {
        id: 'RA-002',
        name: '認証システム評価',
        threatSources: [],
        threatEvents: [],
        vulnerabilities: [],
        controlEffectiveness: 0.8 // 高いコントロール有効性
      };

      const result = evaluator.performRiskAssessment(assessment);
      
      // コントロールが高い場合、リスクは低減される
      expect(result.mitigatedRiskLevel).toBeDefined();
      expect(evaluator.getRiskPriority(result.mitigatedRiskLevel))
        .toBeLessThanOrEqual(evaluator.getRiskPriority(result.inherentRiskLevel));
    });
  });

  describe('リスク優先度の計算', () => {
    it('リスクレベルから優先度を計算する', () => {
      const criticalPriority = evaluator.getRiskPriority(RiskLevel.CRITICAL);
      const highPriority = evaluator.getRiskPriority(RiskLevel.HIGH);
      const lowPriority = evaluator.getRiskPriority(RiskLevel.LOW);

      expect(criticalPriority).toBeGreaterThan(highPriority);
      expect(highPriority).toBeGreaterThan(lowPriority);
    });

    it('複数のリスクをソートする', () => {
      const risks = [
        { id: '1', level: RiskLevel.LOW },
        { id: '2', level: RiskLevel.CRITICAL },
        { id: '3', level: RiskLevel.MEDIUM },
        { id: '4', level: RiskLevel.HIGH }
      ];

      const sorted = evaluator.sortByRiskPriority(risks);
      
      expect(sorted[0].level).toBe(RiskLevel.CRITICAL);
      expect(sorted[1].level).toBe(RiskLevel.HIGH);
      expect(sorted[2].level).toBe(RiskLevel.MEDIUM);
      expect(sorted[3].level).toBe(RiskLevel.LOW);
    });
  });

  describe('推奨事項の生成', () => {
    it('リスクレベルに応じた推奨事項を生成する', () => {
      const recommendations = evaluator.generateRecommendations(RiskLevel.CRITICAL);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('priority');
      expect(recommendations[0]).toHaveProperty('action');
      expect(recommendations[0]).toHaveProperty('timeline');
    });

    it('低リスクの場合の推奨事項', () => {
      const recommendations = evaluator.generateRecommendations(RiskLevel.MINIMAL);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].priority).toBe('LOW');
    });
  });
});