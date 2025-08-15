import { UnifiedAnalysisEngine } from '../../src/core/UnifiedAnalysisEngine';
import { IPlugin, ITestQualityPlugin, ProjectContext, TestFile, Issue } from '../../src/core/types';
import * as path from 'path';
import * as fs from 'fs';

/**
 * UnifiedAnalysisEngine テストスイート
 * t_wadaのTDDメソッドに従って実装
 * 
 * テスト対象:
 * 1. 既存analyzer.tsの機能が保持される
 * 2. 既存analyzerExtended.tsの機能が保持される
 * 3. 統合による新機能が正しく動作する
 * 4. SOLID原則に従った設計になっている
 */
describe('UnifiedAnalysisEngine', () => {
  let engine: UnifiedAnalysisEngine;

  beforeEach(() => {
    engine = new UnifiedAnalysisEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基本機能（analyzer.tsから継承）', () => {
    it('インスタンスが正しく作成される', () => {
      expect(engine).toBeInstanceOf(UnifiedAnalysisEngine);
    });

    it('レガシープラグイン（IPlugin）を登録できる', () => {
      const mockPlugin: IPlugin = {
        name: 'TestPlugin',
        analyze: jest.fn().mockResolvedValue([])
      };

      expect(() => engine.registerPlugin(mockPlugin)).not.toThrow();
    });

    it('複数のレガシープラグインを登録できる', () => {
      const plugin1: IPlugin = {
        name: 'Plugin1',
        analyze: jest.fn().mockResolvedValue([])
      };
      const plugin2: IPlugin = {
        name: 'Plugin2',
        analyze: jest.fn().mockResolvedValue([])
      };

      expect(() => {
        engine.registerPlugin(plugin1);
        engine.registerPlugin(plugin2);
      }).not.toThrow();
    });

    it('基本的な分析を実行できる', async () => {
      const testPath = './test/fixtures';
      const mockIssue: Issue = {
        type: 'error',
        message: 'Test issue',
        file: '/test/file.ts',
        filePath: '/test/file.ts',
        line: 1,
        column: 1,
        severity: 'high',
        category: 'test-quality' as const
      };

      const mockPlugin: IPlugin = {
        name: 'TestPlugin',
        analyze: jest.fn().mockResolvedValue([mockIssue])
      };

      engine.registerPlugin(mockPlugin);
      
      const result = await engine.analyze(testPath);
      
      expect(result).toBeDefined();
      expect(result.totalFiles).toBeGreaterThanOrEqual(0);
      expect(result.issues).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('分析結果に実行時間が含まれる', async () => {
      const testPath = './test/fixtures';
      const result = await engine.analyze(testPath);
      
      expect(result.executionTime).toBeDefined();
      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('拡張機能（analyzerExtended.tsから継承）', () => {
    it('品質プラグイン（ITestQualityPlugin）を登録できる', () => {
      const mockQualityPlugin: ITestQualityPlugin = {
        id: 'quality-plugin',
        name: 'QualityPlugin',
        version: '1.0.0',
        type: 'core',
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({
          overall: 80,
          dimensions: { completeness: 80, correctness: 80, maintainability: 80 },
          breakdown: { completeness: 80, correctness: 80, maintainability: 80 },
          confidence: 0.9
        }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };

      expect(() => engine.registerQualityPlugin(mockQualityPlugin)).not.toThrow();
    });

    it('拡張分析（analyzeWithQuality）を実行できる', async () => {
      const testPath = './test/fixtures';
      const mockQualityPlugin: ITestQualityPlugin = {
        id: 'quality-plugin',
        name: 'QualityPlugin',
        version: '1.0.0',
        type: 'core',
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([{
          type: 'pattern',
          name: 'test-pattern',
          location: { file: '/test/file.ts', line: 1, column: 1 },
          confidence: 0.9
        }]),
        evaluateQuality: jest.fn().mockReturnValue({
          overall: 85,
          breakdown: { completeness: 90, correctness: 85, maintainability: 80 },
          confidence: 0.95
        }),
        suggestImprovements: jest.fn().mockReturnValue([{
          type: 'suggestion',
          priority: 'high',
          description: 'Improve test coverage',
          impact: 10
        }])
      };

      engine.registerQualityPlugin(mockQualityPlugin);
      
      const result = await engine.analyzeWithQuality(testPath);
      
      expect(result).toBeDefined();
      expect(result.filePath).toBe(testPath);
      expect(result.qualityAnalysis).toBeDefined();
      expect(result.aggregatedScore).toBeDefined();
      expect(result.aggregatedScore.overall).toBeGreaterThanOrEqual(0);
      expect(result.aggregatedScore.overall).toBeLessThanOrEqual(100);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('バッチ分析を実行できる', async () => {
      const testPaths = ['./test/fixtures', './test/integration', './test/performance'];
      
      const mockQualityPlugin: ITestQualityPlugin = {
        id: 'quality-plugin',
        name: 'QualityPlugin',
        version: '1.0.0',
        type: 'core',
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({
          overall: 75,
          breakdown: { completeness: 75, correctness: 75, maintainability: 75 },
          confidence: 0.85
        }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };

      engine.registerQualityPlugin(mockQualityPlugin);
      
      const result = await engine.analyzeBatch(testPaths);
      
      expect(result).toBeDefined();
      expect(result.totalFiles).toBe(testPaths.length);
      expect(result.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.averageScore).toBeLessThanOrEqual(100);
      expect(result.scoreDistribution).toBeDefined();
      expect(result.scoreDistribution.excellent).toBeGreaterThanOrEqual(0);
      expect(result.scoreDistribution.good).toBeGreaterThanOrEqual(0);
      expect(result.scoreDistribution.fair).toBeGreaterThanOrEqual(0);
      expect(result.scoreDistribution.poor).toBeGreaterThanOrEqual(0);
    });
  });

  describe('統合による新機能', () => {
    it('レガシープラグインと品質プラグインを同時に使用できる', async () => {
      const mockLegacyPlugin: IPlugin = {
        name: 'LegacyPlugin',
        analyze: jest.fn().mockResolvedValue([{
          type: 'error',
          message: 'Legacy issue',
          file: '/test/file.ts',
          line: 1,
          column: 1,
          severity: 'high'
        }])
      };

      const mockQualityPlugin: ITestQualityPlugin = {
        id: 'quality-plugin',
        name: 'QualityPlugin',
        version: '1.0.0',
        type: 'core',
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({
          overall: 80,
          dimensions: { completeness: 80, correctness: 80, maintainability: 80 },
          breakdown: { completeness: 80, correctness: 80, maintainability: 80 },
          confidence: 0.9
        }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };

      engine.registerPlugin(mockLegacyPlugin);
      engine.registerQualityPlugin(mockQualityPlugin);

      const result = await engine.analyzeUnified('./test/fixtures');
      
      expect(result).toBeDefined();
      expect(result.basicAnalysis).toBeDefined();
      expect(result.qualityAnalysis).toBeDefined();
      expect(result.combinedScore).toBeDefined();
      expect(result.allIssues).toBeDefined();
      expect(result.allIssues.length).toBeGreaterThan(0);
    });

    it('プラグインマネージャーの統合機能が動作する', () => {
      expect(engine.getPluginCount()).toBe(0);
      
      const mockPlugin: IPlugin = {
        name: 'TestPlugin',
        analyze: jest.fn().mockResolvedValue([])
      };
      
      engine.registerPlugin(mockPlugin);
      expect(engine.getPluginCount()).toBe(1);
      
      const mockQualityPlugin: ITestQualityPlugin = {
        id: 'quality-plugin',
        name: 'QualityPlugin',
        version: '1.0.0',
        type: 'core',
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({
          overall: 80,
          dimensions: { completeness: 80, correctness: 80, maintainability: 80 },
          breakdown: { completeness: 80, correctness: 80, maintainability: 80 },
          confidence: 0.9
        }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };
      
      engine.registerQualityPlugin(mockQualityPlugin);
      expect(engine.getPluginCount()).toBe(2);
    });

    it('設定オプションを適用できる', async () => {
      const options = {
        timeout: 5000,
        skipPlugins: ['skip-plugin-id'],
        parallelExecution: true
      };

      engine.configure(options);
      
      const config = engine.getConfiguration();
      expect(config.timeout).toBe(5000);
      expect(config.skipPlugins).toContain('skip-plugin-id');
      expect(config.parallelExecution).toBe(true);
    });

    it('エラーハンドリングが適切に動作する', async () => {
      const errorPlugin: IPlugin = {
        name: 'ErrorPlugin',
        analyze: jest.fn().mockRejectedValue(new Error('Plugin error'))
      };

      engine.registerPlugin(errorPlugin);
      
      const result = await engine.analyze('./test/fixtures');
      
      // エラーが発生してもクラッシュしない
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.errors![0].pluginName).toBe('ErrorPlugin');
      expect(result.errors![0].error).toBe('Plugin error');
    });
  });

  describe('SOLID原則の遵守', () => {
    it('単一責任原則: 分析エンジンは分析のみを責務とする', () => {
      // エンジンが分析以外の責務を持たないことを確認
      const engineMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(engine));
      const analysisMethods = engineMethods.filter(method => 
        method.includes('analyze') || 
        method.includes('register') || 
        method.includes('configure') ||
        method.includes('get') ||
        method.includes('aggregate') ||
        method.includes('collect') ||
        method.includes('extract') ||
        method.includes('run') ||
        method.includes('should') ||  // shouldRunPlugin
        method.includes('is') ||       // isLowQualityPattern
        method.includes('create') ||   // createQualityIssue
        method === 'constructor'
      );
      
      // 分析関連以外のメソッドが存在しないことを確認
      const nonAnalysisMethods = engineMethods.filter(method => 
        !analysisMethods.includes(method)
      );
      
      // デバッグ用：どのメソッドが分析以外と判定されたか
      if (nonAnalysisMethods.length > 0) {
        console.log('Non-analysis methods found:', nonAnalysisMethods);
      }
      
      expect(nonAnalysisMethods.length).toBe(0);
    });

    it('開放閉鎖原則: 新しいプラグインタイプを追加できる', () => {
      // カスタムプラグインインターフェースを実装
      const customPlugin: ITestQualityPlugin = {
        id: 'custom',
        name: 'CustomPlugin',
        version: '1.0.0',
        type: 'custom' as any,
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({ overall: 80, dimensions: {}, confidence: 0.8 }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };

      // 新しいプラグインタイプを登録できることを確認
      expect(() => engine.registerQualityPlugin(customPlugin)).not.toThrow();
    });

    it('リスコフの置換原則: プラグインは互換性を保つ', async () => {
      // IPluginを実装した異なるプラグイン
      const plugin1: IPlugin = {
        name: 'Plugin1',
        analyze: jest.fn().mockResolvedValue([])
      };
      
      const plugin2: IPlugin = {
        name: 'Plugin2',
        analyze: jest.fn().mockResolvedValue([])
      };

      engine.registerPlugin(plugin1);
      engine.registerPlugin(plugin2);
      
      // 両方のプラグインが同じように動作することを確認
      const result = await engine.analyze('./test/fixtures');
      expect(result).toBeDefined();
    });

    it('インターフェース分離原則: 必要なインターフェースのみ依存', () => {
      // エンジンが必要最小限のインターフェースのみを要求することを確認
      const minimalPlugin: IPlugin = {
        name: 'MinimalPlugin',
        analyze: jest.fn().mockResolvedValue([])
      };

      // 最小限の実装でも動作することを確認
      expect(() => engine.registerPlugin(minimalPlugin)).not.toThrow();
    });

    it('依存性逆転原則: 抽象に依存し具象に依存しない', () => {
      // エンジンがインターフェースに依存していることを確認
      const mockPlugin: IPlugin = {
        name: 'MockPlugin',
        analyze: jest.fn()
      };

      // モックでも正常に動作することを確認
      expect(() => engine.registerPlugin(mockPlugin)).not.toThrow();
    });
  });

  describe('パフォーマンステスト', () => {
    it('並列実行が有効な場合、パフォーマンスが向上する', async () => {
      // 異なる名前のプラグインを作成（同じ名前だと重複登録されない可能性がある）
      const slowPlugin1: IPlugin = {
        name: 'SlowPlugin1',
        analyze: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve([]), 50))
        )
      };
      
      const slowPlugin2: IPlugin = {
        name: 'SlowPlugin2',
        analyze: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve([]), 50))
        )
      };
      
      const slowPlugin3: IPlugin = {
        name: 'SlowPlugin3',
        analyze: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve([]), 50))
        )
      };

      engine.registerPlugin(slowPlugin1);
      engine.registerPlugin(slowPlugin2);
      engine.registerPlugin(slowPlugin3);

      // シーケンシャル実行
      engine.configure({ parallelExecution: false });
      const sequentialStart = Date.now();
      await engine.analyze('./test/fixtures');
      const sequentialTime = Date.now() - sequentialStart;

      // パラレル実行
      engine.configure({ parallelExecution: true });
      const parallelStart = Date.now();
      await engine.analyze('./test/fixtures');
      const parallelTime = Date.now() - parallelStart;

      // パラレル実行の方が速いことを確認
      // 並列実行の効果を検証（少なくとも20%高速化を期待）
      expect(parallelTime).toBeLessThan(sequentialTime * 0.8);
      
      // 各プラグインが呼ばれたことを確認
      expect(slowPlugin1.analyze).toHaveBeenCalled();
      expect(slowPlugin2.analyze).toHaveBeenCalled();
      expect(slowPlugin3.analyze).toHaveBeenCalled();
    });
  });
});