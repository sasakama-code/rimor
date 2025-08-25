/**
 * ギャップ検出器のテスト
 * TDD Red Phase - 失敗するテストから開始
 * Phase 5: 実コンポーネント統合
 */

import { GapDetector, IGapDetectionStrategy, GapAnalysisConfig } from '../../src/gap-analysis/GapDetector';
import { TaintAnalysisResult, IntentAnalysisResult, GapAnalysisResult } from '../../src/orchestrator/types';

describe('GapDetector', () => {
  let gapDetector: GapDetector;
  let mockTaintResult: TaintAnalysisResult;
  let mockIntentResult: IntentAnalysisResult;

  beforeEach(() => {
    gapDetector = new GapDetector();
    
    // モックデータの準備
    mockTaintResult = {
      vulnerabilities: [
        {
          id: 'VULN001',
          type: 'PATH_TRAVERSAL',
          severity: 'HIGH',
          source: { file: 'fileHandler.ts', line: 25, column: 10 },
          sink: { file: 'fileHandler.ts', line: 30, column: 5 },
          dataFlow: ['userInput', 'filesystem']
        },
        {
          id: 'VULN002',
          type: 'SQL_INJECTION',
          severity: 'CRITICAL',
          source: { file: 'database.ts', line: 15, column: 8 },
          sink: { file: 'database.ts', line: 20, column: 12 },
          dataFlow: ['userInput', 'sqlQuery']
        }
      ],
      summary: {
        totalVulnerabilities: 2,
        highSeverity: 1,
        mediumSeverity: 0,
        lowSeverity: 0
      }
    };

    mockIntentResult = {
      testIntents: [
        {
          testName: 'ファイルアップロード機能テスト',
          expectedBehavior: 'セキュアなファイルアップロード',
          securityRequirements: ['パストラバーサル防止', 'ファイル拡張子検証'],
          riskLevel: 'HIGH'
        },
        {
          testName: 'ユーザー認証テスト',
          expectedBehavior: '適切な認証フロー',
          securityRequirements: ['SQLインジェクション防止', 'パスワード検証'],
          riskLevel: 'CRITICAL'
        }
      ],
      summary: {
        totalTests: 2,
        highRiskTests: 1,
        mediumRiskTests: 0,
        lowRiskTests: 1
      }
    };
  });

  describe('基本的なギャップ検出', () => {
    it('テスト意図と脆弱性の対応関係を分析できる', async () => {
      // Act
      const result = await gapDetector.analyzeGaps(mockIntentResult, mockTaintResult);

      // Assert
      expect(result).toBeDefined();
      expect(result.gaps).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalGaps).toBeGreaterThan(0);
    });

    it('意図されたセキュリティ要件に対する実装ギャップを特定する', async () => {
      // Act
      const result = await gapDetector.analyzeGaps(mockIntentResult, mockTaintResult);

      // Assert
      const pathTraversalGap = result.gaps.find(gap => 
        gap.intention.includes('パストラバーサル') || gap.testName.includes('ファイルアップロード')
      );
      expect(pathTraversalGap).toBeDefined();
      expect(pathTraversalGap?.riskLevel).toBe('HIGH');
    });

    it('SQLインジェクションのギャップを検出する', async () => {
      // Act
      const result = await gapDetector.analyzeGaps(mockIntentResult, mockTaintResult);

      // Assert
      const sqlInjectionGap = result.gaps.find(gap =>
        gap.intention.includes('SQLインジェクション') || gap.testName.includes('認証')
      );
      expect(sqlInjectionGap).toBeDefined();
      expect(sqlInjectionGap?.riskLevel).toMatch(/^(HIGH|CRITICAL)$/);
    });

    it('ギャップサマリーが正しく集計される', async () => {
      // Act
      const result = await gapDetector.analyzeGaps(mockIntentResult, mockTaintResult);

      // Assert
      expect(result.summary).toBeDefined();
      expect(result.summary.totalGaps).toBe(result.gaps.length);
      expect(result.summary.criticalGaps + result.summary.highGaps + 
             result.summary.mediumGaps + result.summary.lowGaps).toBe(result.summary.totalGaps);
    });
  });

  describe('詳細なギャップ分析', () => {
    it('テストカバレッジのギャップを識別する', async () => {
      // Arrange - セキュリティ要件が不足しているテスト意図
      const incompleteIntentResult = {
        testIntents: [
          {
            testName: '基本機能テスト',
            expectedBehavior: 'データ処理',
            securityRequirements: [], // セキュリティ要件なし
            riskLevel: 'LOW' as const
          }
        ],
        summary: { totalTests: 1, highRiskTests: 0, mediumRiskTests: 0, lowRiskTests: 1 }
      };

      // Act
      const result = await gapDetector.analyzeGaps(incompleteIntentResult, mockTaintResult);

      // Assert
      expect(result.gaps.length).toBeGreaterThan(0);
      const coverageGap = result.gaps.find(gap => 
        gap.intention.includes('カバレッジ') || gap.actualImplementation.includes('テスト不足')
      );
      expect(coverageGap).toBeDefined();
    });

    it('実装されていない脆弱性対策を検出する', async () => {
      // Arrange - 脆弱性があるがテストで言及されていない場合
      const limitedIntentResult = {
        testIntents: [
          {
            testName: 'ユーザー入力テスト',
            expectedBehavior: '入力値処理',
            securityRequirements: ['入力検証'], // PATH_TRAVERSALの言及なし
            riskLevel: 'MEDIUM' as const
          }
        ],
        summary: { totalTests: 1, highRiskTests: 0, mediumRiskTests: 1, lowRiskTests: 0 }
      };

      // Act
      const result = await gapDetector.analyzeGaps(limitedIntentResult, mockTaintResult);

      // Assert
      const unaddressedGap = result.gaps.find(gap =>
        gap.actualImplementation.includes('PATH_TRAVERSAL') && 
        gap.riskLevel === 'HIGH'
      );
      expect(unaddressedGap).toBeDefined();
    });

    it('リスク評価の不整合を検出する', async () => {
      // Arrange - リスクレベルが過小評価されているケース
      const underestimatedRiskIntent = {
        testIntents: [
          {
            testName: 'SQLクエリテスト',
            expectedBehavior: 'データベース操作',
            securityRequirements: ['SQLインジェクション防止'],
            riskLevel: 'LOW' as const // 実際はCRITICALであるべき
          }
        ],
        summary: { totalTests: 1, highRiskTests: 0, mediumRiskTests: 0, lowRiskTests: 1 }
      };

      // Act
      const result = await gapDetector.analyzeGaps(underestimatedRiskIntent, mockTaintResult);

      // Assert
      const riskGap = result.gaps.find(gap =>
        gap.intention.includes('リスク評価') || gap.actualImplementation.includes('過小評価')
      );
      expect(riskGap).toBeDefined();
    });
  });

  describe('設定とカスタマイズ', () => {
    it('カスタム設定でギャップ検出を実行できる', () => {
      // Arrange
      const customConfig: GapAnalysisConfig = {
        enableSemanticAnalysis: true,
        riskThreshold: 'HIGH',
        includeRecommendations: true,
        analysisDepth: 'comprehensive'
      };

      // Act
      const customDetector = new GapDetector(customConfig);

      // Assert
      expect(customDetector).toBeDefined();
      expect(customDetector.getConfig()).toEqual(customConfig);
    });

    it('カスタムギャップ検出戦略を設定できる', () => {
      // Arrange
      const mockStrategy: IGapDetectionStrategy = {
        analyze: jest.fn().mockResolvedValue({
          gaps: [],
          summary: {
            totalGaps: 0,
            criticalGaps: 0,
            highGaps: 0,
            mediumGaps: 0,
            lowGaps: 0
          }
        }),
        getName: jest.fn().mockReturnValue('MockStrategy'),
        validate: jest.fn().mockReturnValue(true)
      };

      // Act
      gapDetector.setStrategy(mockStrategy);

      // Assert
      expect(gapDetector.getStrategy()).toBe(mockStrategy);
    });

    it('複数の検出戦略を組み合わせて使用できる', async () => {
      // Arrange
      const strategy1 = createMockStrategy('Strategy1', 1);
      const strategy2 = createMockStrategy('Strategy2', 2);

      // Act
      gapDetector.addStrategy(strategy1);
      gapDetector.addStrategy(strategy2);
      const result = await gapDetector.analyzeGaps(mockIntentResult, mockTaintResult);

      // Assert
      expect(result.gaps.length).toBeGreaterThan(0);
      // 複数戦略の結果が統合されることを確認
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なIntentAnalysisResultに対してエラーを発生させる', async () => {
      // Arrange
      const invalidIntent = null as any;

      // Act & Assert
      await expect(gapDetector.analyzeGaps(invalidIntent, mockTaintResult))
        .rejects
        .toThrow('IntentAnalysisResultが無効です');
    });

    it('無効なTaintAnalysisResultに対してエラーを発生させる', async () => {
      // Arrange
      const invalidTaint = null as any;

      // Act & Assert
      await expect(gapDetector.analyzeGaps(mockIntentResult, invalidTaint))
        .rejects
        .toThrow('TaintAnalysisResultが無効です');
    });

    it('ギャップ検出処理中のエラーを適切にハンドリングする', async () => {
      // Arrange
      const faultyStrategy: IGapDetectionStrategy = {
        analyze: jest.fn().mockRejectedValue(new Error('Strategy error')),
        getName: jest.fn().mockReturnValue('FaultyStrategy'),
        validate: jest.fn().mockReturnValue(true)
      };

      gapDetector.setStrategy(faultyStrategy);

      // Act & Assert
      await expect(gapDetector.analyzeGaps(mockIntentResult, mockTaintResult))
        .rejects
        .toThrow('ギャップ分析に失敗しました');
    });
  });

  describe('パフォーマンス', () => {
    it('大量のテスト意図と脆弱性を効率的に処理する', async () => {
      // Arrange
      const largeTaintResult = createLargeTaintResult(1000);
      const largeIntentResult = createLargeIntentResult(500);

      // Act
      const startTime = Date.now();
      const result = await gapDetector.analyzeGaps(largeIntentResult, largeTaintResult);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(10000); // 10秒以内
      expect(result.gaps.length).toBeGreaterThan(0);
    });

    it('メモリ効率的なギャップ分析を実行する', async () => {
      // Arrange & Act
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        await gapDetector.analyzeGaps(mockIntentResult, mockTaintResult);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Assert
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB未満
    });
  });
});

// ヘルパー関数
function createMockStrategy(name: string, gapCount: number): IGapDetectionStrategy {
  return {
    analyze: jest.fn().mockResolvedValue({
      gaps: Array.from({ length: gapCount }, (_, i) => ({
        testName: `Test${i}`,
        intention: `Intention${i}`,
        actualImplementation: `Implementation${i}`,
        riskLevel: 'MEDIUM' as const,
        recommendations: [`Recommendation${i}`]
      })),
      summary: {
        totalGaps: gapCount,
        criticalGaps: 0,
        highGaps: 0,
        mediumGaps: gapCount,
        lowGaps: 0
      }
    }),
    getName: jest.fn().mockReturnValue(name),
    validate: jest.fn().mockReturnValue(true)
  };
}

function createLargeTaintResult(count: number): TaintAnalysisResult {
  return {
    vulnerabilities: Array.from({ length: count }, (_, i) => ({
      id: `VULN${i.toString().padStart(3, '0')}`,
      type: ['PATH_TRAVERSAL', 'SQL_INJECTION', 'XSS', 'COMMAND_INJECTION'][i % 4] as any,
      severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][i % 4] as any,
      source: { file: `file${i}.ts`, line: 10, column: 5 },
      sink: { file: `file${i}.ts`, line: 20, column: 10 },
      dataFlow: ['input', 'processing', 'output']
    })),
    summary: {
      totalVulnerabilities: count,
      highSeverity: Math.floor(count / 4),
      mediumSeverity: Math.floor(count / 4),
      lowSeverity: Math.floor(count / 2)
    }
  };
}

function createLargeIntentResult(count: number): IntentAnalysisResult {
  return {
    testIntents: Array.from({ length: count }, (_, i) => ({
      testName: `テスト${i}`,
      expectedBehavior: `期待動作${i}`,
      securityRequirements: [`要件${i}`, `要件${i + 1000}`],
      riskLevel: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'][i % 4] as any
    })),
    summary: {
      totalTests: count,
      highRiskTests: Math.floor(count / 4),
      mediumRiskTests: Math.floor(count / 4),
      lowRiskTests: Math.floor(count / 2)
    }
  };
}