/**
 * UnifiedSecurityAnalysisOrchestrator Test
 * TDD Red Phase - 失敗するテストから開始
 * t_wada推奨のTDDアプローチに従う
 */

import { UnifiedSecurityAnalysisOrchestrator } from '../../src/orchestrator/UnifiedSecurityAnalysisOrchestrator';
import { UnifiedAnalysisResult, TaintAnalysisResult, IntentAnalysisResult, GapAnalysisResult, NistEvaluationResult } from '../../src/orchestrator/types';
import * as path from 'path';
import * as fs from 'fs';

describe('UnifiedSecurityAnalysisOrchestrator', () => {
  let orchestrator: UnifiedSecurityAnalysisOrchestrator;
  const testDataPath = path.resolve(__dirname, '../fixtures/test-project');

  beforeAll(() => {
    // テスト用のプロジェクト構造を作成
    setupTestProject();
  });

  beforeEach(() => {
    orchestrator = new UnifiedSecurityAnalysisOrchestrator();
  });

  afterAll(() => {
    // テストプロジェクトをクリーンアップ
    cleanupTestProject();
  });

  describe('統合分析フロー', () => {
    it('テストディレクトリを指定して完全な統合分析を実行できる', async () => {
      // Arrange
      const targetPath = testDataPath;

      // Act
      const result = await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      expect(result).toBeDefined();
      expect(result.taintAnalysis).toBeDefined();
      expect(result.intentAnalysis).toBeDefined();
      expect(result.gapAnalysis).toBeDefined();
      expect(result.nistEvaluation).toBeDefined();
      expect(result.unifiedReport).toBeDefined();
    }, 30000);

    it('各分析ステップが順次実行される', async () => {
      // Arrange
      const targetPath = testDataPath;
      const executionOrder: string[] = [];

      // モックストラテジーを使って実行順序を追跡
      jest.spyOn(orchestrator as any, 'executeTaintAnalysis')
        .mockImplementation(async () => {
          executionOrder.push('TaintAnalysis');
          return mockTaintAnalysisResult();
        });

      jest.spyOn(orchestrator as any, 'executeIntentExtraction')
        .mockImplementation(async () => {
          executionOrder.push('IntentExtraction');
          return mockIntentAnalysisResult();
        });

      jest.spyOn(orchestrator as any, 'executeGapDetection')
        .mockImplementation(async () => {
          executionOrder.push('GapDetection');
          return mockGapAnalysisResult();
        });

      jest.spyOn(orchestrator as any, 'executeNistEvaluation')
        .mockImplementation(async () => {
          executionOrder.push('NistEvaluation');
          return mockNistEvaluationResult();
        });

      // Act
      await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      expect(executionOrder).toEqual([
        'TaintAnalysis',
        'IntentExtraction',
        'GapDetection',
        'NistEvaluation'
      ]);
    });

    it('TaintTyperの結果が意図抽出に正しく渡される', async () => {
      // Arrange
      const targetPath = testDataPath;
      const mockTaintResult = mockTaintAnalysisResult();

      jest.spyOn(orchestrator as any, 'executeTaintAnalysis')
        .mockResolvedValue(mockTaintResult);

      const intentExtractionSpy = jest.spyOn(orchestrator as any, 'executeIntentExtraction')
        .mockResolvedValue(mockIntentAnalysisResult());

      // Act
      await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      // リファクタリング後のシグネチャに合わせて更新
      expect(intentExtractionSpy).toHaveBeenCalledWith(
        expect.any(Object), // strategyオブジェクト
        targetPath,
        mockTaintResult
      );
    });

    it('意図抽出とTaintTyperの結果がギャップ検出に正しく渡される', async () => {
      // Arrange
      const targetPath = testDataPath;
      const mockTaintResult = mockTaintAnalysisResult();
      const mockIntentResult = mockIntentAnalysisResult();

      jest.spyOn(orchestrator as any, 'executeTaintAnalysis')
        .mockResolvedValue(mockTaintResult);
      jest.spyOn(orchestrator as any, 'executeIntentExtraction')
        .mockResolvedValue(mockIntentResult);

      const gapDetectionSpy = jest.spyOn(orchestrator as any, 'executeGapDetection')
        .mockResolvedValue(mockGapAnalysisResult());

      // Act
      await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      // リファクタリング後のシグネチャに合わせて更新
      expect(gapDetectionSpy).toHaveBeenCalledWith(
        expect.any(Object), // strategyオブジェクト
        mockIntentResult,
        mockTaintResult
      );
    });

    it('ギャップ検出の結果がNIST評価に正しく渡される', async () => {
      // Arrange
      const targetPath = testDataPath;
      const mockGapResult = mockGapAnalysisResult();

      jest.spyOn(orchestrator as any, 'executeTaintAnalysis')
        .mockResolvedValue(mockTaintAnalysisResult());
      jest.spyOn(orchestrator as any, 'executeIntentExtraction')
        .mockResolvedValue(mockIntentAnalysisResult());
      jest.spyOn(orchestrator as any, 'executeGapDetection')
        .mockResolvedValue(mockGapResult);

      const nistEvaluationSpy = jest.spyOn(orchestrator as any, 'executeNistEvaluation')
        .mockResolvedValue(mockNistEvaluationResult());

      // Act
      await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      // リファクタリング後のシグネチャに合わせて更新
      expect(nistEvaluationSpy).toHaveBeenCalledWith(
        expect.any(Object), // strategyオブジェクト
        mockGapResult
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しないパスを指定した場合、適切なエラーが発生する', async () => {
      // Arrange
      const nonExistentPath = '/non/existent/path';

      // Act & Assert
      await expect(orchestrator.analyzeTestDirectory(nonExistentPath))
        .rejects
        .toThrow('指定されたパスが存在しません');
    });

    it('TaintTyper実行時のエラーが適切にハンドリングされる', async () => {
      // Arrange
      const targetPath = testDataPath;
      jest.spyOn(orchestrator as any, 'executeTaintAnalysis')
        .mockRejectedValue(new Error('TaintTyper実行エラー'));

      // Act & Assert
      await expect(orchestrator.analyzeTestDirectory(targetPath))
        .rejects
        .toThrow('統合分析中にエラーが発生しました: TaintTyper実行エラー');
    });

    it('意図抽出実行時のエラーが適切にハンドリングされる', async () => {
      // Arrange
      const targetPath = testDataPath;
      jest.spyOn(orchestrator as any, 'executeTaintAnalysis')
        .mockResolvedValue(mockTaintAnalysisResult());
      jest.spyOn(orchestrator as any, 'executeIntentExtraction')
        .mockRejectedValue(new Error('意図抽出エラー'));

      // Act & Assert
      await expect(orchestrator.analyzeTestDirectory(targetPath))
        .rejects
        .toThrow('統合分析中にエラーが発生しました: 意図抽出エラー');
    });
  });

  describe('統合レポート生成', () => {
    it('全分析結果を含む統合レポートが生成される', async () => {
      // Arrange
      const targetPath = testDataPath;

      // Act
      const result = await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      expect(result.unifiedReport).toBeDefined();
      expect(result.unifiedReport.summary).toBeDefined();
      expect(result.unifiedReport.taintSummary).toBeDefined();
      expect(result.unifiedReport.intentSummary).toBeDefined();
      expect(result.unifiedReport.gapSummary).toBeDefined();
      expect(result.unifiedReport.nistSummary).toBeDefined();
      expect(result.unifiedReport.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.unifiedReport.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it('統合レポートにメタデータが含まれる', async () => {
      // Arrange
      const targetPath = testDataPath;

      // Act
      const result = await orchestrator.analyzeTestDirectory(targetPath);

      // Assert
      expect(result.unifiedReport.metadata).toBeDefined();
      expect(result.unifiedReport.metadata.analyzedPath).toBe(targetPath);
      expect(result.unifiedReport.metadata.timestamp).toBeDefined();
      expect(result.unifiedReport.metadata.rimorVersion).toBeDefined();
      expect(result.unifiedReport.metadata.analysisType).toBe('unified-security');
    });
  });

  describe('パフォーマンス要件', () => {
    it('100ファイル以下の場合、30秒以内に分析が完了する', async () => {
      // Arrange
      const targetPath = testDataPath;
      const startTime = Date.now();

      // Act
      await orchestrator.analyzeTestDirectory(targetPath);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(executionTime).toBeLessThan(30000); // 30秒以内
    }, 35000);
  });
});

// テストデータとモック関数
function setupTestProject(): void {
  const testPath = path.resolve(__dirname, '../fixtures/test-project');
  if (!fs.existsSync(testPath)) {
    fs.mkdirSync(testPath, { recursive: true });
    fs.writeFileSync(path.join(testPath, 'example.test.ts'), `
describe('Example', () => {
  it('should work', () => {
    const userInput = getUserInput(); // Taint source
    database.query(userInput); // Sink - SQL injection vulnerability
    expect(true).toBe(true);
  });
});
`);
  }
}

function cleanupTestProject(): void {
  const testPath = path.resolve(__dirname, '../fixtures/test-project');
  if (fs.existsSync(testPath)) {
    fs.rmSync(testPath, { recursive: true, force: true });
  }
}

function mockTaintAnalysisResult(): TaintAnalysisResult {
  return {
    vulnerabilities: [{
      id: 'test-vuln-1',
      type: 'SQL_INJECTION',
      severity: 'HIGH',
      source: { file: 'example.test.ts', line: 3, column: 23 },
      sink: { file: 'example.test.ts', line: 4, column: 5 },
      dataFlow: ['getUserInput', 'database.query']
    }],
    summary: {
      totalVulnerabilities: 1,
      highSeverity: 1,
      mediumSeverity: 0,
      lowSeverity: 0
    }
  };
}

function mockIntentAnalysisResult(): IntentAnalysisResult {
  return {
    testIntents: [{
      testName: 'should work',
      expectedBehavior: 'データベース操作が正常に動作すること',
      securityRequirements: ['入力値のサニタイズ', 'SQLインジェクション対策'],
      riskLevel: 'HIGH'
    }],
    summary: {
      totalTests: 1,
      highRiskTests: 1,
      mediumRiskTests: 0,
      lowRiskTests: 0
    }
  };
}

function mockGapAnalysisResult(): GapAnalysisResult {
  return {
    gaps: [{
      testName: 'should work',
      intention: '入力値のサニタイズ',
      actualImplementation: 'サニタイズ処理なし',
      riskLevel: 'HIGH',
      recommendations: ['入力値検証の追加', 'パラメータ化クエリの使用']
    }],
    summary: {
      totalGaps: 1,
      criticalGaps: 0,
      highGaps: 1,
      mediumGaps: 0,
      lowGaps: 0
    }
  };
}

function mockNistEvaluationResult(): NistEvaluationResult {
  return {
    riskAssessments: [{
      gapId: 'gap-1',
      threatLevel: 'HIGH',
      vulnerabilityLevel: 'HIGH',
      impactLevel: 'HIGH',
      overallRisk: 'HIGH',
      nistScore: 85,
      recommendations: ['即座にサニタイズ処理を実装', 'セキュリティテストの追加']
    }],
    summary: {
      overallScore: 15, // 100 - 85
      riskLevel: 'HIGH',
      totalAssessments: 1,
      criticalRisks: 0,
      highRisks: 1,
      mediumRisks: 0,
      lowRisks: 0
    }
  };
}