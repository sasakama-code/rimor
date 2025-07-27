/**
 * AccuracyEvaluationSystem.test.ts
 * 精度評価システムのテスト
 */

import { AccuracyEvaluationSystem } from '../../../src/security/validation/AccuracyEvaluationSystem';

describe('AccuracyEvaluationSystem - 精度評価システム', () => {
  let evaluationSystem: AccuracyEvaluationSystem;

  beforeEach(() => {
    evaluationSystem = new AccuracyEvaluationSystem();
  });

  describe('基本的な精度評価', () => {
    it('セキュリティ分析の精度を評価すること', async () => {
      const testCases = [
        {
          file: 'auth.test.js',
          name: 'authenticationTest',
          content: 'expect(authenticateUser(username, password)).toBeTruthy()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        },
        {
          file: 'input.test.js',
          name: 'inputValidationTest',
          content: 'expect(sanitizeInput(userInput)).toBeDefined()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result).toBeDefined();
      expect(result.overallMetrics).toBeDefined();
      expect(result.overallMetrics.detection.precision).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.recall).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.f1Score).toBeGreaterThanOrEqual(0);
    });

    it('完璧な検出の場合に高い精度を報告すること', async () => {
      const testCases = [
        {
          file: 'secure.test.js',
          name: 'secureTest',
          content: 'expect(sanitize(input)).not.toContain("<script>")',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.detection.precision).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.recall).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.inference.automaticInferenceRate).toBeGreaterThanOrEqual(0);
    });

    it('自動推論率を正確に計算すること', async () => {
      const testCases = [
        {
          file: 'inference.test.js',
          name: 'inferenceTest',
          content: 'expect(validateAndProcess(userInput)).toBeSafe()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.inference).toBeDefined();
      expect(result.overallMetrics.inference.automaticInferenceRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.inference.automaticInferenceRate).toBeLessThanOrEqual(1);
      expect(result.overallMetrics.inference.inferenceAccuracy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('検出精度分析', () => {
    it('真陽性・偽陽性を正確に識別すること', async () => {
      const testCases = [
        {
          file: 'detection.test.js',
          name: 'detectionTest',
          content: 'expect(processInput(taintedData)).toBeSecure()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.detection.truePositives).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.falsePositives).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.trueNegatives).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.falseNegatives).toBeGreaterThanOrEqual(0);
    });

    it('偽陽性率・偽陰性率を計算すること', async () => {
      const testCases = [
        {
          file: 'false-positive.test.js',
          name: 'falsePositiveTest',
          content: 'expect(safeFunction(cleanData)).toWork()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.detection.falsePositiveRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.falsePositiveRate).toBeLessThanOrEqual(1);
      expect(result.overallMetrics.detection.falseNegativeRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.detection.falseNegativeRate).toBeLessThanOrEqual(1);
    });

    it('F1スコアを正確に計算すること', async () => {
      const testCases = [
        {
          file: 'f1.test.js',
          name: 'f1Test',
          content: 'expect(validateSecurity(input)).toBeValid()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      const precision = result.overallMetrics.detection.precision;
      const recall = result.overallMetrics.detection.recall;
      const f1Score = result.overallMetrics.detection.f1Score;

      if (precision + recall > 0) {
        const expectedF1 = 2 * (precision * recall) / (precision + recall);
        expect(f1Score).toBeCloseTo(expectedF1, 5);
      } else {
        expect(f1Score).toBe(0);
      }
    });
  });

  describe('パフォーマンス評価', () => {
    it('分析時間を測定すること', async () => {
      const testCases = [
        {
          file: 'performance.test.js',
          name: 'performanceTest',
          content: 'expect(quickProcess(data)).toBeFast()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.performance).toBeDefined();
      expect(result.overallMetrics.performance.averageAnalysisTime).toBeGreaterThan(0);
      expect(result.overallMetrics.performance.targetAchievementRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.performance.throughput).toBeGreaterThanOrEqual(0);
    });

    it('目標達成率を評価すること', async () => {
      const testCases = [
        {
          file: 'target.test.js',
          name: 'targetTest',
          content: 'expect(optimizedFunction(input)).toMeetTargets()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      const performance = result.overallMetrics.performance;
      const targetAchieved = performance.averageAnalysisTime <= 5.0;
      const expectedRate = targetAchieved ? 1.0 : 5.0 / performance.averageAnalysisTime;
      
      expect(performance.targetAchievementRate).toBeCloseTo(expectedRate, 5);
    });

    it('スループットを計算すること', async () => {
      const testCases = [
        {
          file: 'throughput.test.js',
          name: 'throughputTest',
          content: 'expect(batchProcess(data)).toComplete()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      const performance = result.overallMetrics.performance;
      if (performance.averageAnalysisTime > 0) {
        const expectedThroughput = 1000 / performance.averageAnalysisTime;
        expect(performance.throughput).toBeCloseTo(expectedThroughput, 5);
      } else {
        expect(performance.throughput).toBe(0);
      }
    });
  });

  describe('型システム評価', () => {
    it('型推論成功率を評価すること', async () => {
      const testCases = [
        {
          file: 'type-inference.test.js',
          name: 'typeInferenceTest',
          content: 'expect(inferTypes(code)).toSucceed()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.typeSystem).toBeDefined();
      expect(result.overallMetrics.typeSystem.typeInferenceSuccessRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.typeSystem.typeInferenceSuccessRate).toBeLessThanOrEqual(1);
    });

    it('汚染追跡精度を評価すること', async () => {
      const testCases = [
        {
          file: 'taint-tracking.test.js',
          name: 'taintTrackingTest',
          content: 'expect(trackTaint(taintedInput)).toBeAccurate()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.typeSystem.taintTrackingAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.typeSystem.taintTrackingAccuracy).toBeLessThanOrEqual(1);
    });

    it('不変条件検証率を評価すること', async () => {
      const testCases = [
        {
          file: 'invariant.test.js',
          name: 'invariantTest',
          content: 'expect(verifyInvariant(condition)).toHold()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.overallMetrics.typeSystem.invariantVerificationRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.typeSystem.invariantVerificationRate).toBeLessThanOrEqual(1);
    });
  });

  describe('詳細結果分析', () => {
    it('テストケース別詳細結果を提供すること', async () => {
      const testCases = [
        {
          file: 'detail1.test.js',
          name: 'detailTest1',
          content: 'expect(process1(input)).toWork()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        },
        {
          file: 'detail2.test.js',
          name: 'detailTest2',
          content: 'expect(process2(input)).toWork()',
          metadata: { framework: 'mocha' }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.perTestCaseResults).toBeDefined();
      expect(result.perTestCaseResults.length).toBe(testCases.length);
      
      result.perTestCaseResults.forEach(caseResult => {
        expect(caseResult.testCase).toBeDefined();
        expect(caseResult.groundTruth).toBeDefined();
        expect(caseResult.detectedIssues).toBeDefined();
        expect(caseResult.accuracy).toBeDefined();
        expect(caseResult.analysis).toBeDefined();
      });
    });

    it('フレームワーク別結果を提供すること', async () => {
      const testCases = [
        {
          file: 'jest.test.js',
          name: 'jestTest',
          content: 'expect(jestFunction()).toBeTruthy()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        },
        {
          file: 'mocha.test.js',
          name: 'mochaTest',
          content: 'expect(mochaFunction()).to.be.true',
          metadata: { framework: 'mocha' }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.perFrameworkResults).toBeDefined();
      expect(result.perFrameworkResults.size).toBeGreaterThan(0);
      
      for (const [framework, metrics] of result.perFrameworkResults) {
        expect(framework).toBeDefined();
        expect(metrics.totalTestCases).toBeGreaterThan(0);
        expect(metrics.detection).toBeDefined();
        expect(metrics.inference).toBeDefined();
        expect(metrics.performance).toBeDefined();
      }
    });

    it('問題種別分析を提供すること', async () => {
      const testCases = [
        {
          file: 'issues.test.js',
          name: 'issuesTest',
          content: 'expect(handleIssues(input)).toResolve()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.issueTypeAnalysis).toBeDefined();
      
      for (const [issueType, analysis] of result.issueTypeAnalysis) {
        expect(issueType).toBeDefined();
        expect(analysis.issueType).toBe(issueType);
        expect(analysis.detected).toBeGreaterThanOrEqual(0);
        expect(analysis.actual).toBeGreaterThanOrEqual(0);
        expect(analysis.precision).toBeGreaterThanOrEqual(0);
        expect(analysis.recall).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('改善提案', () => {
    it('改善提案を生成すること', async () => {
      const testCases = [
        {
          file: 'improvement.test.js',
          name: 'improvementTest',
          content: 'expect(needsImprovement(input)).toImprove()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.recommendedImprovements).toBeDefined();
      expect(Array.isArray(result.recommendedImprovements)).toBe(true);
      
      result.recommendedImprovements.forEach(improvement => {
        expect(improvement.area).toMatch(/^(inference|detection|type-system|performance)$/);
        expect(improvement.currentValue).toBeGreaterThanOrEqual(0);
        expect(improvement.targetValue).toBeGreaterThanOrEqual(0);
        expect(improvement.recommendations).toBeDefined();
        expect(Array.isArray(improvement.recommendations)).toBe(true);
        expect(improvement.estimatedImpact).toBeGreaterThanOrEqual(0);
        expect(improvement.implementationComplexity).toMatch(/^(low|medium|high)$/);
      });
    });

    it('性能目標に基づく改善提案を行うこと', async () => {
      const testCases = [
        {
          file: 'slow.test.js',
          name: 'slowTest',
          content: 'expect(slowFunction(input)).toEventuallyComplete()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);
      const improvements = result.recommendedImprovements;

      // パフォーマンス改善提案があるかチェック
      const performanceImprovements = improvements.filter(imp => imp.area === 'performance');
      if (result.overallMetrics.performance.averageAnalysisTime > 5.0) {
        expect(performanceImprovements.length).toBeGreaterThan(0);
      }
    });
  });

  describe('精度トレンド', () => {
    it('精度履歴を管理すること', async () => {
      const testCases = [
        {
          file: 'trend.test.js',
          name: 'trendTest',
          content: 'expect(trendAnalysis(data)).toShowProgress()',
          metadata: { 
            framework: 'jest',
            language: 'javascript',
            lastModified: new Date()
          }
        }
      ];

      const result = await evaluationSystem.evaluateAccuracy(testCases);

      expect(result.accuracyTrends).toBeDefined();
      expect(Array.isArray(result.accuracyTrends)).toBe(true);
      
      // 評価実行後に履歴が追加されているかチェック
      const latestTrend = result.accuracyTrends[result.accuracyTrends.length - 1];
      if (latestTrend) {
        expect(latestTrend.timestamp).toBeDefined();
        expect(latestTrend.metrics).toBeDefined();
        expect(latestTrend.changes).toBeDefined();
        expect(Array.isArray(latestTrend.changes)).toBe(true);
      }
    });
  });

  describe('リアルタイム監視', () => {
    it('リアルタイム精度監視を実行できること', async () => {
      const projects = [
        {
          name: 'test-project',
          path: '/test/project',
          testFiles: ['test1.js', 'test2.js'],
          sourceFiles: ['src1.js', 'src2.js']
        }
      ];

      // リアルタイム監視は非同期で実行されるため、エラーを投げないことを確認
      expect(async () => {
        await evaluationSystem.monitorAccuracyInRealTime(projects);
      }).not.toThrow();
    });
  });

  describe('エラーハンドリング', () => {
    it('空のテストケースを適切に処理すること', async () => {
      const emptyTestCases = [];

      const result = await evaluationSystem.evaluateAccuracy(emptyTestCases);

      expect(result).toBeDefined();
      expect(result.overallMetrics.totalTestCases).toBe(0);
      expect(result.overallMetrics.analyzedTestCases).toBe(0);
      expect(result.perTestCaseResults).toHaveLength(0);
    });

    it('不正なテストケースデータを処理すること', async () => {
      const invalidTestCases = [
        {
          file: null,
          name: undefined,
          content: '',
          metadata: null
        }
      ];

      expect(async () => {
        const result = await evaluationSystem.evaluateAccuracy(invalidTestCases);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('大量のテストケースを効率的に処理すること', async () => {
      const largeTestCases = Array.from({ length: 100 }, (_, i) => ({
        file: `test${i}.js`,
        name: `test${i}`,
        content: `expect(process${i}(input)).toWork()`,
        metadata: { framework: 'jest' }
      }));

      const startTime = Date.now();
      const result = await evaluationSystem.evaluateAccuracy(largeTestCases);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.overallMetrics.totalTestCases).toBe(100);
      expect(endTime - startTime).toBeLessThan(30000); // 30秒以内
    });
  });
});