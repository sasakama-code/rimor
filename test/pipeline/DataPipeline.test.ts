/**
 * データパイプラインのテスト
 * TDD Red Phase - 失敗するテストから開始
 * Phase 4: データパイプラインの実装
 */

import { DataPipeline, IDataTransformer, IDataValidator, IRetryStrategy } from '../../src/pipeline/DataPipeline';
import { TaintAnalysisResult, IntentAnalysisResult, GapAnalysisResult, NistEvaluationResult } from '../../src/orchestrator/types';

describe('DataPipeline', () => {
  let pipeline: DataPipeline;
  let mockTaintResult: TaintAnalysisResult;
  let mockIntentResult: IntentAnalysisResult;
  let mockGapResult: GapAnalysisResult;
  let mockNistResult: NistEvaluationResult;

  beforeEach(() => {
    pipeline = new DataPipeline();
    
    // モックデータの準備
    mockTaintResult = {
      vulnerabilities: [
        {
          id: 'T001',
          type: 'PATH_TRAVERSAL' as const,
          severity: 'HIGH' as const,
          source: { file: 'test.ts', line: 10, column: 5 },
          sink: { file: 'test.ts', line: 15, column: 10 },
          dataFlow: ['input', 'filesystem']
        }
      ],
      summary: {
        totalVulnerabilities: 1,
        highSeverity: 1,
        mediumSeverity: 0,
        lowSeverity: 0
      }
    };

    mockIntentResult = {
      testIntents: [
        {
          testName: 'ファイルアクセステスト',
          expectedBehavior: 'ファイルアクセス制御のテスト',
          securityRequirements: ['パストラバーサル対策'],
          riskLevel: 'HIGH'
        }
      ],
      summary: {
        totalTests: 1,
        highRiskTests: 1,
        mediumRiskTests: 0,
        lowRiskTests: 0
      }
    };

    mockGapResult = {
      gaps: [
        {
          testName: 'ファイルアクセステスト',
          intention: 'ファイルアクセス制御',
          actualImplementation: 'セキュリティチェック不足',
          riskLevel: 'CRITICAL',
          recommendations: ['セキュリティ検証の追加']
        }
      ],
      summary: {
        totalGaps: 1,
        criticalGaps: 1,
        highGaps: 0,
        mediumGaps: 0,
        lowGaps: 0
      }
    };

    mockNistResult = {
      riskAssessments: [
        {
          gapId: 'ファイルアクセステスト',
          threatLevel: 'HIGH',
          vulnerabilityLevel: 'HIGH',
          impactLevel: 'HIGH',
          overallRisk: 'HIGH',
          nistScore: 75,
          recommendations: ['アクセス制御の強化']
        }
      ],
      summary: {
        overallScore: 75,
        riskLevel: 'HIGH',
        totalAssessments: 1,
        criticalRisks: 0,
        highRisks: 1,
        mediumRisks: 0,
        lowRisks: 0
      }
    };
  });

  describe('データ変換機能', () => {
    it('TaintAnalysisResultからIntentExtractionへのデータ変換ができる', async () => {
      // Act
      const transformedData = await pipeline.transformTaintToIntent(mockTaintResult);

      // Assert
      expect(transformedData).toBeDefined();
      expect(transformedData.vulnerabilities).toBeDefined();
      expect(transformedData.securityContext).toBeDefined();
      expect(transformedData.analysisMetadata).toBeDefined();
    });

    it('IntentExtractionResultからGapDetectionへのデータ変換ができる', async () => {
      // Act
      const transformedData = await pipeline.transformIntentToGap(mockIntentResult, mockTaintResult);

      // Assert
      expect(transformedData).toBeDefined();
      expect(transformedData.testIntents).toBeDefined();
      expect(transformedData.vulnerabilityContext).toBeDefined();
      expect(transformedData.riskProfile).toBeDefined();
    });

    it('GapDetectionResultからNistEvaluationへのデータ変換ができる', async () => {
      // Act
      const transformedData = await pipeline.transformGapToNist(mockGapResult, mockIntentResult, mockTaintResult);

      // Assert
      expect(transformedData).toBeDefined();
      expect(transformedData.securityGaps).toBeDefined();
      expect(transformedData.testContext).toBeDefined();
      expect(transformedData.vulnerabilityProfile).toBeDefined();
      expect(transformedData.complianceFramework).toBe('NIST SP 800-30');
    });
  });

  describe('データバリデーション', () => {
    it('不正なTaintAnalysisResultが渡された場合、適切なエラーが発生する', async () => {
      // Arrange
      const invalidTaintResult = null as any;

      // Act & Assert
      await expect(pipeline.transformTaintToIntent(invalidTaintResult))
        .rejects
        .toThrow('TaintAnalysisResultが無効です');
    });

    it('データ構造が不整合な場合、エラーが発生する', async () => {
      // Arrange
      const incompleteTaintResult = {
        vulnerabilities: null,
        summary: mockTaintResult.summary
      } as any;

      // Act & Assert
      await expect(pipeline.transformTaintToIntent(incompleteTaintResult))
        .rejects
        .toThrow('データ構造に不整合があります');
    });

    it('必須フィールドが不足している場合、エラーが発生する', async () => {
      // Arrange
      const incompleteIntentResult = {
        testIntents: mockIntentResult.testIntents
        // summaryが不足
      } as any;

      // Act & Assert
      await expect(pipeline.transformIntentToGap(incompleteIntentResult, mockTaintResult))
        .rejects
        .toThrow('必須フィールドが不足しています');
    });
  });

  describe('エラー処理とリカバリ', () => {
    it('変換処理中のエラーを適切にキャッチする', async () => {
      // Arrange
      const corruptedData = {
        vulnerabilities: 'invalid_data',
        summary: mockTaintResult.summary
      } as any;

      // Act & Assert
      await expect(pipeline.transformTaintToIntent(corruptedData))
        .rejects
        .toThrow('データ構造に不整合があります');
    });

    it('リトライ機能が正常に動作する', async () => {
      // Arrange
      let attemptCount = 0;
      const retryStrategy = {
        maxRetries: 3,
        retryDelay: 100,
        shouldRetry: (error: Error) => error.message.includes('一時的')
      };

      pipeline.setRetryStrategy(retryStrategy);

      // モック変換関数（最初の2回は失敗、3回目は成功）
      const mockTransformer = jest.fn()
        .mockRejectedValueOnce(new Error('一時的なエラー'))
        .mockRejectedValueOnce(new Error('一時的なエラー'))
        .mockResolvedValueOnce({ success: true });

      // Act
      const result = await pipeline.executeWithRetry(mockTransformer, mockTaintResult);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mockTransformer).toHaveBeenCalledTimes(3);
    });

    it('最大リトライ回数に達した場合、エラーが発生する', async () => {
      // Arrange
      const retryStrategy = {
        maxRetries: 2,
        retryDelay: 50,
        shouldRetry: () => true
      };

      pipeline.setRetryStrategy(retryStrategy);

      const mockTransformer = jest.fn()
        .mockRejectedValue(new Error('永続的なエラー'));

      // Act & Assert
      await expect(pipeline.executeWithRetry(mockTransformer, mockTaintResult))
        .rejects
        .toThrow('最大リトライ回数に達しました: 永続的なエラー');
    });
  });

  describe('パフォーマンス最適化', () => {
    it('大量のデータを効率的に処理する', async () => {
      // Arrange
      const largeTaintResult = {
        vulnerabilities: Array.from({ length: 1000 }, (_, i) => ({
          id: `T${i.toString().padStart(3, '0')}`,
          type: 'PATH_TRAVERSAL' as const,
          severity: 'HIGH' as const,
          source: { file: `test${i}.ts`, line: 10, column: 5 },
          sink: { file: `test${i}.ts`, line: 15, column: 10 },
          dataFlow: ['input', 'filesystem']
        })),
        summary: {
          totalVulnerabilities: 1000,
          highSeverity: 1000,
          mediumSeverity: 0,
          lowSeverity: 0
        }
      };

      // Act
      const startTime = Date.now();
      const result = await pipeline.transformTaintToIntent(largeTaintResult);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(5000); // 5秒以内
    });

    it('メモリ使用量を適切に管理する', async () => {
      // Arrange & Act
      // メモリ使用量の測定（Node.js環境では process.memoryUsage() を使用）
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        await pipeline.transformTaintToIntent(mockTaintResult);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Assert
      // メモリリークがないことを確認（増加量が適切な範囲内）
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB未満
    });
  });

  describe('カスタマイズと拡張性', () => {
    it('カスタムデータ変換器を登録できる', () => {
      // Arrange
      const customTransformer: IDataTransformer<TaintAnalysisResult, any> = {
        transform: jest.fn().mockResolvedValue({ customField: 'test' }),
        validate: jest.fn().mockReturnValue(true),
        getName: jest.fn().mockReturnValue('CustomTransformer')
      };

      // Act
      pipeline.registerTransformer('taint-to-custom', customTransformer);

      // Assert
      const registeredTransformer = pipeline.getTransformer('taint-to-custom');
      expect(registeredTransformer).toBe(customTransformer);
    });

    it('カスタムバリデーターを設定できる', () => {
      // Arrange
      const customValidator: IDataValidator<TaintAnalysisResult> = {
        validate: jest.fn().mockReturnValue(true),
        getValidationRules: jest.fn().mockReturnValue(['rule1', 'rule2'])
      };

      // Act
      pipeline.setValidator('taint-analysis', customValidator);

      // Assert
      const setValidator = pipeline.getValidator('taint-analysis');
      expect(setValidator).toBe(customValidator);
    });

    it('パイプライン設定を動的に変更できる', () => {
      // Arrange
      const newConfig = {
        enableParallelProcessing: true,
        batchSize: 50,
        timeoutMs: 30000,
        enableCaching: true
      };

      // Act
      pipeline.updateConfiguration(newConfig);

      // Assert
      const currentConfig = pipeline.getConfiguration();
      expect(currentConfig.enableParallelProcessing).toBe(true);
      expect(currentConfig.batchSize).toBe(50);
      expect(currentConfig.timeoutMs).toBe(30000);
      expect(currentConfig.enableCaching).toBe(true);
    });
  });

  describe('統合テスト', () => {
    it('完全なデータフロー（Taint → Intent → Gap → NIST）が正常に動作する', async () => {
      // Act
      const intentData = await pipeline.transformTaintToIntent(mockTaintResult);
      const gapData = await pipeline.transformIntentToGap(mockIntentResult, mockTaintResult);
      const nistData = await pipeline.transformGapToNist(mockGapResult, mockIntentResult, mockTaintResult);

      // Assert
      expect(intentData).toBeDefined();
      expect(gapData).toBeDefined();
      expect(nistData).toBeDefined();
      
      // データの連続性確認
      expect(intentData.vulnerabilities).toHaveLength(1);
      expect(gapData.vulnerabilityContext).toBeDefined();
      expect(nistData.vulnerabilityProfile).toBeDefined();
    });

    it('エラーが発生した場合も適切にクリーンアップされる', async () => {
      // Arrange
      const invalidData = null as any;
      
      // Act & Assert
      await expect(async () => {
        await pipeline.transformTaintToIntent(invalidData);
      }).rejects.toThrow();

      // パイプラインの状態がリセットされることを確認
      const healthStatus = pipeline.getHealthStatus();
      expect(healthStatus.isHealthy).toBe(true);
    });
  });
});