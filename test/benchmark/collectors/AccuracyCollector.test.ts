/**
 * 解析精度測定システムのテスト
 * Phase 2: TDD手法による解析精度メトリクス収集機能の実装
 */

import { AccuracyCollector } from '../../../src/benchmark/collectors/AccuracyCollector';
import { TaintTyperAccuracyAnalyzer } from '../../../src/benchmark/collectors/analyzers/TaintTyperAccuracyAnalyzer';
import { IntentExtractionAccuracyAnalyzer } from '../../../src/benchmark/collectors/analyzers/IntentExtractionAccuracyAnalyzer';
import { GapDetectionAccuracyAnalyzer } from '../../../src/benchmark/collectors/analyzers/GapDetectionAccuracyAnalyzer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('AccuracyCollector', () => {
  let collector: AccuracyCollector;
  let tempDir: string;
  let testFixtures: TestFixtures;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'accuracy-test-'));
    collector = new AccuracyCollector({
      enableTaintAnalysis: true,
      enableIntentExtraction: true,
      enableGapDetection: true,
      confidenceThreshold: 0.8,
      sampleSize: 100
    });
    testFixtures = new TestFixtures(tempDir);
    await testFixtures.setup();
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('基本機能テスト', () => {
    it('精度測定セッションを開始・終了できること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('basic-test');
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      const result = await collector.endAccuracyMeasurement(sessionId);
      expect(result.success).toBe(true);
      expect(result.accuracyMetrics).toBeDefined();
    });

    it('複数の解析タイプを同時に測定できること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('multi-analysis-test');
      
      // 各種解析の実行をシミュレート
      await collector.recordTaintAnalysisResult(sessionId, {
        file: 'test.ts',
        expected: true,
        actual: true,
        confidence: 0.95,
        analysisTime: 100
      });

      await collector.recordIntentExtractionResult(sessionId, {
        file: 'test.spec.ts',
        expectedIntent: 'should validate user input',
        extractedIntent: 'should validate user input',
        similarity: 1.0,
        confidence: 0.9,
        analysisTime: 150
      });

      const result = await collector.endAccuracyMeasurement(sessionId);
      expect(result.accuracyMetrics.taintAnalysis).toBeDefined();
      expect(result.accuracyMetrics.intentExtraction).toBeDefined();
    });
  });

  describe('TaintTyper精度測定テスト', () => {
    it('基本的な脆弱性検出精度を測定すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('taint-basic-test');

      // 既知の結果を持つテストケース
      const testCases = await testFixtures.getTaintAnalysisTestCases();
      
      for (const testCase of testCases) {
        await collector.recordTaintAnalysisResult(sessionId, {
          file: testCase.file,
          expected: testCase.expectedVulnerable,
          actual: testCase.actualVulnerable,
          confidence: testCase.confidence,
          analysisTime: testCase.analysisTime,
          vulnerabilityType: testCase.vulnerabilityType
        });
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const taintMetrics = result.accuracyMetrics.taintAnalysis;

      expect(taintMetrics.overallAccuracy).toBeGreaterThan(0);
      expect(taintMetrics.precision).toBeGreaterThan(0);
      expect(taintMetrics.recall).toBeGreaterThan(0);
      expect(taintMetrics.f1Score).toBeGreaterThan(0);
      expect(taintMetrics.truePositives).toBeGreaterThanOrEqual(0);
      expect(taintMetrics.falsePositives).toBeGreaterThanOrEqual(0);
      expect(taintMetrics.trueNegatives).toBeGreaterThanOrEqual(0);
      expect(taintMetrics.falseNegatives).toBeGreaterThanOrEqual(0);
    });

    it('脆弱性タイプ別の精度を測定すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('taint-by-type-test');

      // 各種脆弱性タイプのテストケース
      const vulnerabilityTypes = ['sql-injection', 'xss', 'path-traversal', 'command-injection'];
      
      for (const vulnType of vulnerabilityTypes) {
        const testCases = await testFixtures.getTaintTestCasesByType(vulnType);
        for (const testCase of testCases) {
          await collector.recordTaintAnalysisResult(sessionId, {
            file: testCase.file,
            expected: testCase.expected,
            actual: testCase.actual,
            confidence: testCase.confidence,
            analysisTime: testCase.analysisTime,
            vulnerabilityType: vulnType
          });
        }
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const taintMetrics = result.accuracyMetrics.taintAnalysis;

      expect(taintMetrics.byVulnerabilityType).toBeDefined();
      for (const vulnType of vulnerabilityTypes) {
        expect(taintMetrics.byVulnerabilityType[vulnType]).toBeDefined();
        expect(taintMetrics.byVulnerabilityType[vulnType].accuracy).toBeGreaterThanOrEqual(0);
      }
    });

    it('信頼度レベル別の精度分析を行うこと', async () => {
      const sessionId = await collector.startAccuracyMeasurement('taint-confidence-test');

      // 異なる信頼度レベルのテストケース
      const confidenceLevels = [0.5, 0.7, 0.8, 0.9, 0.95];
      
      for (const confidence of confidenceLevels) {
        await collector.recordTaintAnalysisResult(sessionId, {
          file: `test-${confidence}.ts`,
          expected: true,
          actual: confidence > 0.75, // 75%以上の信頼度で正解とする
          confidence,
          analysisTime: 100,
          vulnerabilityType: 'sql-injection'
        });
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const taintMetrics = result.accuracyMetrics.taintAnalysis;

      expect(taintMetrics.byConfidenceLevel).toBeDefined();
      expect(taintMetrics.byConfidenceLevel.high).toBeDefined(); // 0.9以上
      expect(taintMetrics.byConfidenceLevel.medium).toBeDefined(); // 0.7-0.9
      expect(taintMetrics.byConfidenceLevel.low).toBeDefined(); // 0.7未満
    });
  });

  describe('Intent抽出精度測定テスト', () => {
    it('テスト意図の抽出精度を測定すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('intent-basic-test');

      const intentTestCases = await testFixtures.getIntentExtractionTestCases();
      
      for (const testCase of intentTestCases) {
        await collector.recordIntentExtractionResult(sessionId, {
          file: testCase.file,
          expectedIntent: testCase.expectedIntent,
          extractedIntent: testCase.extractedIntent,
          similarity: testCase.similarity,
          confidence: testCase.confidence,
          analysisTime: testCase.analysisTime
        });
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const intentMetrics = result.accuracyMetrics.intentExtraction;

      expect(intentMetrics.overallAccuracy).toBeGreaterThan(0);
      expect(intentMetrics.averageSimilarity).toBeGreaterThan(0);
      expect(intentMetrics.exactMatches).toBeGreaterThanOrEqual(0);
      expect(intentMetrics.partialMatches).toBeGreaterThanOrEqual(0);
      expect(intentMetrics.mismatches).toBeGreaterThanOrEqual(0);
    });

    it('意図カテゴリ別の精度を分析すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('intent-category-test');

      const categories = ['validation', 'authentication', 'authorization', 'business-logic'];
      
      for (const category of categories) {
        const testCases = await testFixtures.getIntentTestCasesByCategory(category);
        for (const testCase of testCases) {
          await collector.recordIntentExtractionResult(sessionId, {
            file: testCase.file,
            expectedIntent: testCase.expectedIntent,
            extractedIntent: testCase.extractedIntent,
            similarity: testCase.similarity,
            confidence: testCase.confidence,
            analysisTime: testCase.analysisTime,
            category: category
          });
        }
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const intentMetrics = result.accuracyMetrics.intentExtraction;

      expect(intentMetrics.byCategory).toBeDefined();
      for (const category of categories) {
        expect(intentMetrics.byCategory[category]).toBeDefined();
      }
    });

    it('テストフレームワーク別の抽出精度を比較すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('intent-framework-test');

      const frameworks = ['jest', 'mocha', 'jasmine', 'vitest'];
      
      for (const framework of frameworks) {
        const testCases = await testFixtures.getIntentTestCasesByFramework(framework);
        for (const testCase of testCases) {
          await collector.recordIntentExtractionResult(sessionId, {
            file: testCase.file,
            expectedIntent: testCase.expectedIntent,
            extractedIntent: testCase.extractedIntent,
            similarity: testCase.similarity,
            confidence: testCase.confidence,
            analysisTime: testCase.analysisTime,
            framework: framework
          });
        }
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const intentMetrics = result.accuracyMetrics.intentExtraction;

      expect(intentMetrics.byFramework).toBeDefined();
      for (const framework of frameworks) {
        if (intentMetrics.byFramework[framework]) {
          expect(intentMetrics.byFramework[framework].accuracy).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Gap検出精度測定テスト', () => {
    it('実装とテスト意図のギャップ検出精度を測定すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('gap-basic-test');

      const gapTestCases = await testFixtures.getGapDetectionTestCases();
      
      for (const testCase of testCases) {
        await collector.recordGapDetectionResult(sessionId, {
          productionFile: testCase.productionFile,
          testFile: testCase.testFile,
          expectedGaps: testCase.expectedGaps,
          detectedGaps: testCase.detectedGaps,
          confidence: testCase.confidence,
          analysisTime: testCase.analysisTime
        });
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const gapMetrics = result.accuracyMetrics.gapDetection;

      expect(gapMetrics.overallAccuracy).toBeGreaterThan(0);
      expect(gapMetrics.precision).toBeGreaterThan(0);
      expect(gapMetrics.recall).toBeGreaterThan(0);
      expect(gapMetrics.averageGapsDetected).toBeGreaterThanOrEqual(0);
    });

    it('ギャップタイプ別の検出精度を測定すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('gap-type-test');

      const gapTypes = ['missing-edge-cases', 'incomplete-validation', 'missing-error-handling', 'business-logic-gaps'];
      
      for (const gapType of gapTypes) {
        const testCases = await testFixtures.getGapTestCasesByType(gapType);
        for (const testCase of testCases) {
          await collector.recordGapDetectionResult(sessionId, {
            productionFile: testCase.productionFile,
            testFile: testCase.testFile,
            expectedGaps: testCase.expectedGaps,
            detectedGaps: testCase.detectedGaps,
            confidence: testCase.confidence,
            analysisTime: testCase.analysisTime,
            gapType: gapType
          });
        }
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      const gapMetrics = result.accuracyMetrics.gapDetection;

      expect(gapMetrics.byGapType).toBeDefined();
      for (const gapType of gapTypes) {
        expect(gapMetrics.byGapType[gapType]).toBeDefined();
      }
    });
  });

  describe('統合精度分析テスト', () => {
    it('複数の解析結果を統合した総合精度を算出すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('integrated-test');

      // 各種解析結果を記録
      await collector.recordTaintAnalysisResult(sessionId, {
        file: 'security-test.ts',
        expected: true,
        actual: true,
        confidence: 0.9,
        analysisTime: 100,
        vulnerabilityType: 'sql-injection'
      });

      await collector.recordIntentExtractionResult(sessionId, {
        file: 'security-test.spec.ts',
        expectedIntent: 'should prevent SQL injection',
        extractedIntent: 'should prevent SQL injection',
        similarity: 1.0,
        confidence: 0.85,
        analysisTime: 150
      });

      await collector.recordGapDetectionResult(sessionId, {
        productionFile: 'security-test.ts',
        testFile: 'security-test.spec.ts',
        expectedGaps: 0,
        detectedGaps: 0,
        confidence: 0.8,
        analysisTime: 200
      });

      const result = await collector.endAccuracyMeasurement(sessionId);

      expect(result.accuracyMetrics.integrated).toBeDefined();
      expect(result.accuracyMetrics.integrated.overallScore).toBeGreaterThan(0);
      expect(result.accuracyMetrics.integrated.weightedAccuracy).toBeGreaterThan(0);
      expect(result.accuracyMetrics.integrated.confidenceScore).toBeGreaterThan(0);
    });

    it('信頼度の低い結果を適切に重み付けすること', async () => {
      const highConfidenceSession = await collector.startAccuracyMeasurement('high-confidence');
      const lowConfidenceSession = await collector.startAccuracyMeasurement('low-confidence');

      // 高信頼度の結果
      await collector.recordTaintAnalysisResult(highConfidenceSession, {
        file: 'test1.ts',
        expected: true,
        actual: true,
        confidence: 0.95,
        analysisTime: 100,
        vulnerabilityType: 'xss'
      });

      // 低信頼度の結果
      await collector.recordTaintAnalysisResult(lowConfidenceSession, {
        file: 'test2.ts',
        expected: true,
        actual: true,
        confidence: 0.5,
        analysisTime: 100,
        vulnerabilityType: 'xss'
      });

      const highResult = await collector.endAccuracyMeasurement(highConfidenceSession);
      const lowResult = await collector.endAccuracyMeasurement(lowConfidenceSession);

      expect(highResult.accuracyMetrics.integrated.confidenceScore)
        .toBeGreaterThan(lowResult.accuracyMetrics.integrated.confidenceScore);
    });
  });

  describe('リアルタイム精度監視テスト', () => {
    it('精度の低下を即座に検出すること', async () => {
      collector.setAccuracyThreshold('taintAnalysis', 0.8); // 80%を閾値に設定

      const sessionId = await collector.startAccuracyMeasurement('realtime-monitoring');

      // 精度の良い結果を複数記録
      for (let i = 0; i < 5; i++) {
        await collector.recordTaintAnalysisResult(sessionId, {
          file: `good-${i}.ts`,
          expected: true,
          actual: true,
          confidence: 0.9,
          analysisTime: 100,
          vulnerabilityType: 'sql-injection'
        });
      }

      // 精度の悪い結果を記録
      for (let i = 0; i < 10; i++) {
        await collector.recordTaintAnalysisResult(sessionId, {
          file: `bad-${i}.ts`,
          expected: true,
          actual: false,
          confidence: 0.6,
          analysisTime: 100,
          vulnerabilityType: 'sql-injection'
        });
      }

      const currentMetrics = await collector.getCurrentAccuracy(sessionId);
      expect(currentMetrics.alerts).toBeDefined();
      expect(currentMetrics.alerts.some(alert => alert.type === 'accuracy_threshold_breach')).toBe(true);
    });

    it('改善トレンドを追跡すること', async () => {
      const sessionId = await collector.startAccuracyMeasurement('trend-tracking');

      // 時間の経過とともに精度が改善する様子をシミュレート
      const timePoints = [100, 200, 300, 400, 500];
      const accuracyLevels = [0.6, 0.7, 0.8, 0.85, 0.9];

      for (let i = 0; i < timePoints.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // 時間経過を模擬
        
        await collector.recordTaintAnalysisResult(sessionId, {
          file: `trend-${i}.ts`,
          expected: true,
          actual: Math.random() < accuracyLevels[i],
          confidence: accuracyLevels[i],
          analysisTime: 100,
          vulnerabilityType: 'sql-injection',
          timestamp: Date.now()
        });
      }

      const result = await collector.endAccuracyMeasurement(sessionId);
      expect(result.accuracyMetrics.trends).toBeDefined();
      expect(result.accuracyMetrics.trends.improvementRate).toBeGreaterThan(0);
    });
  });
});

// ===== テストフィクスチャクラス =====

class TestFixtures {
  constructor(private tempDir: string) {}

  async setup(): Promise<void> {
    // テスト用のファイルとデータを準備
    await this.createTaintAnalysisFixtures();
    await this.createIntentExtractionFixtures();
    await this.createGapDetectionFixtures();
  }

  private async createTaintAnalysisFixtures(): Promise<void> {
    const fixturesDir = path.join(this.tempDir, 'taint-fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });

    // SQL Injection脆弱性のあるコード例
    await fs.writeFile(path.join(fixturesDir, 'vulnerable-sql.ts'), `
      function getUserData(userId: string) {
        const query = "SELECT * FROM users WHERE id = " + userId; // 脆弱
        return db.query(query);
      }
    `);

    // 安全なコード例
    await fs.writeFile(path.join(fixturesDir, 'safe-sql.ts'), `
      function getUserData(userId: string) {
        const query = "SELECT * FROM users WHERE id = ?";
        return db.query(query, [userId]); // 安全
      }
    `);
  }

  private async createIntentExtractionFixtures(): Promise<void> {
    const fixturesDir = path.join(this.tempDir, 'intent-fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });

    await fs.writeFile(path.join(fixturesDir, 'validation.spec.ts'), `
      describe('User validation', () => {
        it('should reject invalid email addresses', async () => {
          const result = validateEmail('invalid-email');
          expect(result).toBe(false);
        });
      });
    `);
  }

  private async createGapDetectionFixtures(): Promise<void> {
    const fixturesDir = path.join(this.tempDir, 'gap-fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });

    // プロダクションコード
    await fs.writeFile(path.join(fixturesDir, 'calculator.ts'), `
      export class Calculator {
        divide(a: number, b: number): number {
          if (b === 0) throw new Error('Division by zero');
          return a / b;
        }
        
        sqrt(n: number): number {
          if (n < 0) throw new Error('Negative number');
          return Math.sqrt(n);
        }
      }
    `);

    // 不完全なテスト
    await fs.writeFile(path.join(fixturesDir, 'calculator.spec.ts'), `
      describe('Calculator', () => {
        it('should divide numbers', () => {
          const calc = new Calculator();
          expect(calc.divide(10, 2)).toBe(5);
          // ゼロ除算のテストが欠けている
        });
        
        // sqrt関数のテスト自体が欠けている
      });
    `);
  }

  async getTaintAnalysisTestCases() {
    return [
      {
        file: 'vulnerable-sql.ts',
        expectedVulnerable: true,
        actualVulnerable: true,
        confidence: 0.95,
        analysisTime: 120,
        vulnerabilityType: 'sql-injection'
      },
      {
        file: 'safe-sql.ts',
        expectedVulnerable: false,
        actualVulnerable: false,
        confidence: 0.9,
        analysisTime: 100,
        vulnerabilityType: 'sql-injection'
      }
    ];
  }

  async getTaintTestCasesByType(vulnerabilityType: string) {
    const testCaseMap: Record<string, any[]> = {
      'sql-injection': [
        { file: 'sql-test-1.ts', expected: true, actual: true, confidence: 0.9, analysisTime: 100 }
      ],
      'xss': [
        { file: 'xss-test-1.ts', expected: true, actual: true, confidence: 0.85, analysisTime: 110 }
      ],
      'path-traversal': [
        { file: 'path-test-1.ts', expected: true, actual: false, confidence: 0.7, analysisTime: 90 }
      ],
      'command-injection': [
        { file: 'cmd-test-1.ts', expected: false, actual: false, confidence: 0.95, analysisTime: 105 }
      ]
    };
    return testCaseMap[vulnerabilityType] || [];
  }

  async getIntentExtractionTestCases() {
    return [
      {
        file: 'validation.spec.ts',
        expectedIntent: 'should reject invalid email addresses',
        extractedIntent: 'should reject invalid email addresses',
        similarity: 1.0,
        confidence: 0.95,
        analysisTime: 150
      }
    ];
  }

  async getIntentTestCasesByCategory(category: string) {
    const testCaseMap: Record<string, any[]> = {
      'validation': [
        {
          file: 'email-validation.spec.ts',
          expectedIntent: 'should validate email format',
          extractedIntent: 'should validate email format',
          similarity: 1.0,
          confidence: 0.9,
          analysisTime: 140
        }
      ]
    };
    return testCaseMap[category] || [];
  }

  async getIntentTestCasesByFramework(framework: string) {
    return [
      {
        file: `${framework}-test.spec.ts`,
        expectedIntent: 'should test functionality',
        extractedIntent: 'should test functionality',
        similarity: 0.95,
        confidence: 0.8,
        analysisTime: 130
      }
    ];
  }

  async getGapDetectionTestCases() {
    return [
      {
        productionFile: 'calculator.ts',
        testFile: 'calculator.spec.ts',
        expectedGaps: 2, // ゼロ除算テストとsqrt関数テストが欠けている
        detectedGaps: 2,
        confidence: 0.85,
        analysisTime: 200
      }
    ];
  }

  async getGapTestCasesByType(gapType: string) {
    const testCaseMap: Record<string, any[]> = {
      'missing-edge-cases': [
        {
          productionFile: 'edge-case-prod.ts',
          testFile: 'edge-case-test.spec.ts',
          expectedGaps: 1,
          detectedGaps: 1,
          confidence: 0.8,
          analysisTime: 180
        }
      ]
    };
    return testCaseMap[gapType] || [];
  }
}