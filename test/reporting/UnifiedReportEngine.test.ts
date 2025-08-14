/**
 * UnifiedReportEngine テスト
 * v0.9.0 - Issue #64: レポートシステムの統合
 * TDD RED段階 - t_wadaの手法に従ったテストファースト
 * 
 * SOLID原則: 単一責任、開放閉鎖、依存性逆転の検証
 * DRY原則: 重複コードの排除確認
 * KISS原則: シンプルなAPI設計の検証
 */

import { UnifiedReportEngine } from '../../src/reporting/core/UnifiedReportEngine';
import { 
  IFormattingStrategy,
  ReportFormat,
  UnifiedReport 
} from '../../src/reporting/core/types';
import { UnifiedAnalysisResult, RiskLevel, AIActionType } from '../../src/nist/types/unified-analysis-result';
import { AIJsonFormatter } from '../../src/reporting/formatters/AIJsonFormatter';
import { MarkdownFormatter } from '../../src/reporting/formatters/MarkdownFormatter';
import { HTMLFormatter } from '../../src/reporting/formatters/HTMLFormatter';
import { ExecutiveSummaryFormatter } from '../../src/reporting/formatters/ExecutiveSummaryFormatter';
import { CachingStrategy } from '../../src/reporting/strategies/CachingStrategy';
import { ParallelStrategy } from '../../src/reporting/strategies/ParallelStrategy';

describe('UnifiedReportEngine', () => {
  let engine: UnifiedReportEngine;
  let mockAnalysisResult: UnifiedAnalysisResult;

  beforeEach(() => {
    // テストデータの準備
    mockAnalysisResult = {
      summary: {
        overallScore: 85,
        overallGrade: 'B',
        statistics: {
          totalFiles: 10,
          totalTests: 50,
          riskCounts: {
            CRITICAL: 0,
            HIGH: 2,
            MEDIUM: 5,
            LOW: 10,
            MINIMAL: 3
          }
        },
        dimensions: [
          { 
            name: 'testIntent', 
            score: 80, 
            weight: 0.5, 
            impact: 'positive' as any,
            breakdown: []
          },
          { 
            name: 'security', 
            score: 90, 
            weight: 0.5, 
            impact: 'positive' as any,
            breakdown: []
          }
        ]
      },
      aiKeyRisks: [
        {
          riskId: 'risk-001',
          title: 'Missing test coverage',
          problem: 'Critical path lacks test coverage',
          riskLevel: RiskLevel.HIGH,
          filePath: 'src/core/analyzer.ts',
          context: {
            codeSnippet: 'function analyze() { ... }',
            startLine: 10,
            endLine: 20
          },
          suggestedAction: {
            type: 'refactor' as any,
            description: 'Add unit tests for analyze function'
          }
        }
      ],
      detailedIssues: [],
      schemaVersion: '1.0' as const
    };
  });

  describe('基本機能', () => {
    test('レポートエンジンのインスタンス化', () => {
      engine = new UnifiedReportEngine();
      expect(engine).toBeInstanceOf(UnifiedReportEngine);
    });

    test('デフォルト戦略の設定', () => {
      engine = new UnifiedReportEngine();
      expect(engine.getCurrentStrategy()).toBeDefined();
      expect(engine.getCurrentStrategy().name).toBe('markdown');
    });

    test('戦略の切り替え', () => {
      engine = new UnifiedReportEngine();
      const aiJsonStrategy = new AIJsonFormatter();
      
      engine.setStrategy(aiJsonStrategy);
      expect(engine.getCurrentStrategy()).toBe(aiJsonStrategy);
      expect(engine.getCurrentStrategy().name).toBe('ai-json');
    });
  });

  describe('フォーマッター戦略', () => {
    beforeEach(() => {
      engine = new UnifiedReportEngine();
    });

    test('AI JSON フォーマット生成', async () => {
      engine.setStrategy(new AIJsonFormatter());
      
      const report = await engine.generate(mockAnalysisResult);
      
      expect(report).toBeDefined();
      expect(report.format).toBe('ai-json');
      expect(report.content).toHaveProperty('overallAssessment');
      expect(report.content).toHaveProperty('keyRisks');
      expect(report.content).toHaveProperty('fullReportUrl');
    });

    test('Markdown フォーマット生成', async () => {
      engine.setStrategy(new MarkdownFormatter());
      
      const report = await engine.generate(mockAnalysisResult);
      
      expect(report).toBeDefined();
      expect(report.format).toBe('markdown');
      expect(typeof report.content).toBe('string');
      expect(report.content).toContain('# 分析レポート');
      expect(report.content).toContain('## サマリー');
    });

    test('HTML フォーマット生成', async () => {
      engine.setStrategy(new HTMLFormatter());
      
      const report = await engine.generate(mockAnalysisResult);
      
      expect(report).toBeDefined();
      expect(report.format).toBe('html');
      expect(typeof report.content).toBe('string');
      expect(report.content).toContain('<!DOCTYPE html>');
      expect(report.content).toContain('<html');
    });

    test('ExecutiveSummary フォーマット生成', async () => {
      engine.setStrategy(new ExecutiveSummaryFormatter());
      
      const report = await engine.generate(mockAnalysisResult);
      
      expect(report).toBeDefined();
      expect(report.format).toBe('executive-summary');
      
      // Type assertion for content object
      const content = report.content as any;
      expect(content).toHaveProperty('executiveSummary');
      expect(content.executiveSummary).toHaveProperty('overallScore');
      expect(content).toHaveProperty('recommendations');
    });
  });

  describe('デコレーター戦略', () => {
    beforeEach(() => {
      engine = new UnifiedReportEngine();
    });

    test('キャッシュ戦略の適用', async () => {
      const baseStrategy = new MarkdownFormatter();
      const cachedStrategy = new CachingStrategy(baseStrategy);
      
      engine.setStrategy(cachedStrategy);
      
      // 1回目の生成
      const report1 = await engine.generate(mockAnalysisResult);
      
      // 2回目の生成（キャッシュから取得）
      const report2 = await engine.generate(mockAnalysisResult);
      
      // タイムスタンプ以外の内容が同じことを確認
      expect(report1.format).toEqual(report2.format);
      expect(report1.content).toEqual(report2.content);
      expect(cachedStrategy.getCacheHitRate()).toBeGreaterThan(0);
    });

    test('並列処理戦略の適用', async () => {
      const baseStrategy = new HTMLFormatter();
      const parallelStrategy = new ParallelStrategy(baseStrategy);
      
      engine.setStrategy(parallelStrategy);
      
      // 複数の分析結果を並列処理
      const results = [mockAnalysisResult, mockAnalysisResult, mockAnalysisResult];
      
      const startTime = Date.now();
      const reports = await Promise.all(
        results.map(result => engine.generate(result))
      );
      const duration = Date.now() - startTime;
      
      expect(reports).toHaveLength(3);
      expect(reports.every((r: any) => r.format === 'html')).toBe(true);
      
      // 並列処理によるパフォーマンス向上を確認
      // （実際の閾値は実装に依存）
      expect(duration).toBeLessThan(1000);
    });

    test('複数デコレーターの組み合わせ', async () => {
      const baseStrategy = new AIJsonFormatter();
      const cachedStrategy = new CachingStrategy(baseStrategy);
      const parallelStrategy = new ParallelStrategy(cachedStrategy);
      
      engine.setStrategy(parallelStrategy);
      
      const report = await engine.generate(mockAnalysisResult);
      
      expect(report).toBeDefined();
      expect(report.format).toBe('ai-json');
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      engine = new UnifiedReportEngine();
    });

    test('無効な入力データの処理', async () => {
      const invalidData = null as any;
      
      await expect(engine.generate(invalidData))
        .rejects.toThrow('Invalid analysis result');
    });

    test('戦略がnullの場合のフォールバック', async () => {
      engine.setStrategy(null as any);
      
      const report = await engine.generate(mockAnalysisResult);
      
      // デフォルト戦略にフォールバック
      expect(report).toBeDefined();
      expect(report.format).toBe('markdown');
    });

    test('フォーマッターエラーの処理', async () => {
      const errorStrategy: IFormattingStrategy = {
        name: 'error-strategy',
        format: jest.fn().mockRejectedValue(new Error('Formatting failed')),
        formatAsync: jest.fn().mockRejectedValue(new Error('Formatting failed'))
      };
      
      engine.setStrategy(errorStrategy);
      
      await expect(engine.generate(mockAnalysisResult))
        .rejects.toThrow('Formatting failed');
    });
  });

  describe('後方互換性', () => {
    test('レガシーAPIサポート', async () => {
      // レガシーAPIを新エンジンで処理
      const legacyFormatter = engine.getLegacyAdapter('UnifiedAIFormatter');
      
      expect(legacyFormatter).toBeDefined();
      expect(legacyFormatter?.format).toBeDefined();
      
      const result = await legacyFormatter?.format(mockAnalysisResult);
      expect(result).toHaveProperty('overallAssessment');
    });

    test('deprecated警告の出力', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      engine.getLegacyAdapter('UnifiedAIFormatter');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('deprecated')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('パフォーマンス', () => {
    test('大規模データの処理', async () => {
      // 大量のリスクデータを生成
      const largeResult = {
        ...mockAnalysisResult,
        aiKeyRisks: Array(1000).fill(null).map((_, index) => ({
          riskId: `risk-${index}`,
          title: `Risk ${index}`,
          problem: `Problem ${index}`,
          riskLevel: [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW, RiskLevel.MINIMAL][index % 5],
          filePath: `src/file${index}.ts`,
          context: {
            codeSnippet: `code ${index}`,
            startLine: index,
            endLine: index + 10
          },
          suggestedAction: {
            type: 'refactor' as any,
            description: `Action ${index}`
          }
        }))
      };
      
      engine.setStrategy(new AIJsonFormatter());
      
      const startTime = Date.now();
      const report = await engine.generate(largeResult);
      const duration = Date.now() - startTime;
      
      expect(report).toBeDefined();
      expect(duration).toBeLessThan(500); // 500ms以内で処理
    });

    test('メモリ使用量の最適化', async () => {
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // 複数回のレポート生成
      for (let i = 0; i < 100; i++) {
        await engine.generate(mockAnalysisResult);
      }
      
      // ガベージコレクションを強制実行（テスト環境のみ）
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      // メモリリークがないことを確認（10MB以下の増加）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('SOLID原則の遵守', () => {
    test('単一責任原則（SRP）', () => {
      // UnifiedReportEngineはレポート生成のみに責任を持つ
      const engineMethods = Object.getOwnPropertyNames(UnifiedReportEngine.prototype);
      const expectedMethods = [
        'constructor',
        'setStrategy',
        'getCurrentStrategy',
        'generate',
        'getLegacyAdapter'
      ];
      
      expect(engineMethods.filter(m => !m.startsWith('_')))
        .toEqual(expect.arrayContaining(expectedMethods));
    });

    test('開放閉鎖原則（OCP）', () => {
      // 新しい戦略を追加しても既存コードを変更不要
      class CustomFormatter implements IFormattingStrategy {
        name = 'custom';
        async format(result: UnifiedAnalysisResult): Promise<any> {
          return { custom: true };
        }
        async formatAsync(result: UnifiedAnalysisResult): Promise<any> {
          return this.format(result);
        }
      }
      
      engine.setStrategy(new CustomFormatter());
      expect(engine.getCurrentStrategy().name).toBe('custom');
    });

    test('リスコフの置換原則（LSP）', async () => {
      // 全ての戦略が同じインターフェースで動作
      const strategies = [
        new AIJsonFormatter(),
        new MarkdownFormatter(),
        new HTMLFormatter(),
        new ExecutiveSummaryFormatter()
      ];
      
      for (const strategy of strategies) {
        engine.setStrategy(strategy);
        const report = await engine.generate(mockAnalysisResult);
        expect(report).toHaveProperty('format');
        expect(report).toHaveProperty('content');
        expect(report).toHaveProperty('timestamp');
      }
    });

    test('インターフェース分離原則（ISP）', () => {
      // 必要最小限のインターフェース
      const strategy: IFormattingStrategy = {
        name: 'minimal',
        format: jest.fn(),
        formatAsync: jest.fn()
      };
      
      engine.setStrategy(strategy);
      expect(engine.getCurrentStrategy()).toBe(strategy);
    });

    test('依存性逆転原則（DIP）', () => {
      // 具象クラスではなくインターフェースに依存
      const mockStrategy = {
        name: 'mock',
        format: jest.fn().mockReturnValue({ mock: true }),
        formatAsync: jest.fn().mockResolvedValue({ mock: true })
      };
      
      engine.setStrategy(mockStrategy);
      expect(engine.getCurrentStrategy()).toBe(mockStrategy);
    });
  });
});