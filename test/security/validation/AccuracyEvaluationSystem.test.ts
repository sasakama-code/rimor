/**
 * AccuracyEvaluationSystemのテストスイート
 * TaintTyper型ベースセキュリティ解析の精度評価システムのテスト
 */

import { 
  AccuracyEvaluationSystem,
  AccuracyMetrics,
  DetailedAccuracyResult,
  GroundTruthData,
  GroundTruthIssue
} from '../../../src/security/validation/AccuracyEvaluationSystem';
import { TestCase, SecurityIssue } from '../../../src/security/types';
import { RealWorldProject } from '../../../src/security/validation/RealWorldProjectValidator';

// テスト用のモックデータ生成関数
const createMockTestCase = (name: string, hasIssues: boolean = false): TestCase => ({
  name,
  file: `test-${name}.ts`,
  content: `
    function ${name}() {
      ${hasIssues ? 'const userInput = getUserInput();' : 'const safe = "safe";'}
      return ${hasIssues ? 'userInput' : 'safe'};
    }
  `,
  metadata: {
    framework: 'jest',
    language: 'typescript',
    lastModified: new Date()
  }
});

describe('AccuracyEvaluationSystem', () => {
  let evaluationSystem: AccuracyEvaluationSystem;
  
  beforeEach(() => {
    evaluationSystem = new AccuracyEvaluationSystem();
  });
  
  describe('初期化', () => {
    it('システムが正しく初期化されること', () => {
      expect(evaluationSystem).toBeDefined();
      expect(evaluationSystem).toBeInstanceOf(AccuracyEvaluationSystem);
    });
  });
  
  describe('evaluateAccuracy', () => {
    it('単一のテストケースで精度評価ができること', async () => {
      const testCases: TestCase[] = [createMockTestCase('testMethod1')];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result).toBeDefined();
      expect(result.overallMetrics).toBeDefined();
      expect(result.overallMetrics.totalTestCases).toBe(1);
      expect(result.overallMetrics.analyzedTestCases).toBeLessThanOrEqual(1);
    });
    
    it('複数のテストケースで精度評価ができること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('testMethod1', true),
        createMockTestCase('testMethod2', false),
        createMockTestCase('testMethod3', true)
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result).toBeDefined();
      expect(result.overallMetrics.totalTestCases).toBe(3);
      expect(result.perTestCaseResults).toHaveLength(3);
    });
    
    it('推論メトリクスが正しく計算されること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('method1'),
        createMockTestCase('method2')
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result.overallMetrics.inference).toBeDefined();
      expect(result.overallMetrics.inference.automaticInferenceRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.inference.automaticInferenceRate).toBeLessThanOrEqual(1);
      expect(result.overallMetrics.inference.inferenceAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.inference.inferenceAccuracy).toBeLessThanOrEqual(1);
    });
    
    it('検出メトリクスが正しく計算されること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('secureMethod', false),
        createMockTestCase('vulnerableMethod', true)
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result.overallMetrics.detection).toBeDefined();
      expect(result.overallMetrics.detection.truePositives).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.falsePositives).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.trueNegatives).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.falseNegatives).toBeGreaterThanOrEqual(0);
      
      // 精度指標の妥当性確認
      if (result.overallMetrics.detection.precision !== null) {
        expect(result.overallMetrics.detection.precision).toBeGreaterThanOrEqual(0);
        expect(result.overallMetrics.detection.precision).toBeLessThanOrEqual(1);
      }
      
      if (result.overallMetrics.detection.recall !== null) {
        expect(result.overallMetrics.detection.recall).toBeGreaterThanOrEqual(0);
        expect(result.overallMetrics.detection.recall).toBeLessThanOrEqual(1);
      }
    });
    
    it('パフォーマンスメトリクスが記録されること', async () => {
      const testCases: TestCase[] = [createMockTestCase('perfTest')];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result.overallMetrics.performance).toBeDefined();
      expect(result.overallMetrics.performance.averageAnalysisTime).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.performance.throughput).toBeGreaterThanOrEqual(0);
    });
    
    it('フレームワーク別の結果が生成されること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('jestTest'),
        createMockTestCase('mochaTest')
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result.perFrameworkResults).toBeDefined();
      expect(result.perFrameworkResults).toBeInstanceOf(Map);
    });
    
    it('問題種別の分析が行われること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('sqlInjection', true),
        createMockTestCase('xss', true)
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result.issueTypeAnalysis).toBeDefined();
      expect(result.issueTypeAnalysis).toBeInstanceOf(Map);
    });
    
    it('改善提案が生成されること', async () => {
      const testCases: TestCase[] = [createMockTestCase('improvementTest')];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result.recommendedImprovements).toBeDefined();
      expect(result.recommendedImprovements).toBeInstanceOf(Array);
      
      // 各改善提案の構造を確認
      result.recommendedImprovements.forEach(improvement => {
        expect(improvement.area).toMatch(/^(inference|detection|type-system|performance)$/);
        expect(improvement.currentValue).toBeDefined();
        expect(improvement.targetValue).toBeDefined();
        expect(improvement.recommendations).toBeInstanceOf(Array);
        expect(improvement.estimatedImpact).toBeGreaterThanOrEqual(0);
        expect(improvement.implementationComplexity).toMatch(/^(low|medium|high)$/);
      });
    });
    
    it('精度履歴が保存されること', async () => {
      const testCases: TestCase[] = [createMockTestCase('historyTest')];
      
      const result1 = await evaluationSystem.evaluateAccuracy(testCases);
      const result2 = await evaluationSystem.evaluateAccuracy(testCases);
      
      expect(result2.accuracyTrends.length).toBeGreaterThan(result1.accuracyTrends.length);
    });
  });
  
  describe('monitorAccuracyInRealTime', () => {
    it('リアルタイム監視が実行できること', async () => {
      const mockProject: RealWorldProject = {
        name: 'TestProject',
        framework: 'express',
        rootPath: '/path/to/project',
        testPaths: ['./test'],
        expectedFindings: {
          securityIssues: 0,
          coverageScore: 0.9,
          expectedPatterns: ['injection', 'xss']
        },
        metadata: {
          description: 'Test project for accuracy evaluation',
          complexity: 'small',
          testCount: 10,
          lastValidated: new Date()
        }
      };
      
      // 監視実行（エラーがないことを確認）
      await expect(
        evaluationSystem.monitorAccuracyInRealTime([mockProject])
      ).resolves.not.toThrow();
    });
    
    it('複数プロジェクトの監視ができること', async () => {
      const projects: RealWorldProject[] = [
        {
          name: 'Project1',
          framework: 'express',
          rootPath: '/path/to/project1',
          testPaths: ['./test'],
          expectedFindings: {
            securityIssues: 2,
            coverageScore: 0.85,
            expectedPatterns: ['injection']
          },
          metadata: {
            description: 'Express.js project',
            complexity: 'medium',
            testCount: 50,
            lastValidated: new Date()
          }
        },
        {
          name: 'Project2',
          framework: 'react',
          rootPath: '/path/to/project2',
          testPaths: ['./spec'],
          expectedFindings: {
            securityIssues: 1,
            coverageScore: 0.90,
            expectedPatterns: ['xss']
          },
          metadata: {
            description: 'React project',
            complexity: 'large',
            testCount: 100,
            lastValidated: new Date()
          }
        }
      ];
      
      await expect(
        evaluationSystem.monitorAccuracyInRealTime(projects)
      ).resolves.not.toThrow();
    });
  });
  
  describe('精度計算の妥当性', () => {
    it('F1スコアが正しく計算されること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('tp', true), // True Positive
        createMockTestCase('fp', false), // False Positive
        createMockTestCase('tn', false), // True Negative
        createMockTestCase('fn', true)  // False Negative
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      const { precision, recall, f1Score } = result.overallMetrics.detection;
      
      if (precision !== null && recall !== null && f1Score !== null) {
        // F1スコアの計算式: 2 * (precision * recall) / (precision + recall)
        const expectedF1 = precision + recall > 0 
          ? 2 * (precision * recall) / (precision + recall)
          : 0;
        
        expect(Math.abs(f1Score - expectedF1)).toBeLessThan(0.01);
      }
    });
    
    it('誤検知率が正しく計算されること', async () => {
      const testCases: TestCase[] = [
        createMockTestCase('safe1', false),
        createMockTestCase('safe2', false),
        createMockTestCase('vulnerable1', true)
      ];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      const { falsePositiveRate, falsePositives, trueNegatives } = result.overallMetrics.detection;
      
      // 誤検知率 = FP / (FP + TN)
      const expectedFPR = (falsePositives + trueNegatives) > 0
        ? falsePositives / (falsePositives + trueNegatives)
        : 0;
      
      expect(Math.abs(falsePositiveRate - expectedFPR)).toBeLessThan(0.01);
    });
  });
  
  describe('目標達成度の確認', () => {
    it('目標値との比較が正しく行われること', async () => {
      const testCases: TestCase[] = [createMockTestCase('targetTest')];
      
      const result = await evaluationSystem.evaluateAccuracy(testCases);
      
      // 目標値の確認
      const inferenceRate = result.overallMetrics.inference.automaticInferenceRate;
      const falsePositiveRate = result.overallMetrics.detection.falsePositiveRate;
      const avgAnalysisTime = result.overallMetrics.performance.averageAnalysisTime;
      
      // 改善提案に基づいて目標未達成の項目が特定されているか確認
      const needsInferenceImprovement = inferenceRate < 0.85;
      const needsFPRImprovement = falsePositiveRate > 0.15;
      const needsPerformanceImprovement = avgAnalysisTime > 5;
      
      if (needsInferenceImprovement) {
        expect(result.recommendedImprovements.some(i => i.area === 'inference')).toBe(true);
      }
      
      if (needsFPRImprovement) {
        expect(result.recommendedImprovements.some(i => i.area === 'detection')).toBe(true);
      }
      
      if (needsPerformanceImprovement) {
        expect(result.recommendedImprovements.some(i => i.area === 'performance')).toBe(true);
      }
    });
  });
});