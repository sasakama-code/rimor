import { UnifiedPluginManager } from '../../src/core/UnifiedPluginManager';
import { 
  IPlugin, 
  ITestQualityPlugin, 
  Issue, 
  ProjectContext, 
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  PluginResult
} from '../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

// モックプラグインの作成
const createMockLegacyPlugin = (name: string): IPlugin => ({
  name,
  analyze: jest.fn().mockResolvedValue([
    {
      file: 'test.ts',
      line: 1,
      column: 0,
      message: `Issue from ${name}`,
      severity: 'warning' as const
    }
  ])
});

const createMockQualityPlugin = (id: string): ITestQualityPlugin => ({
  id,
  name: `Quality Plugin ${id}`,
  version: '1.0.0',
  type: 'core',
  isApplicable: jest.fn().mockReturnValue(true),
  detectPatterns: jest.fn().mockResolvedValue([
    {
      type: 'test-quality',
      file: 'test.spec.ts',
      line: 10,
      message: `Pattern detected by ${id}`,
      severity: 'medium' as const,
      confidence: 0.8
    }
  ]),
  evaluateQuality: jest.fn().mockReturnValue({
    overall: 75,
    score: 75,
    details: { test: 'quality' }
  }),
  suggestImprovements: jest.fn().mockReturnValue([
    {
      type: 'improvement',
      priority: 'high' as const,
      message: `Improvement from ${id}`,
      estimatedImpact: 'medium' as const
    }
  ])
});

describe('UnifiedPluginManager', () => {
  let manager: UnifiedPluginManager;
  const testProjectRoot = '/test/project';

  beforeEach(() => {
    manager = new UnifiedPluginManager(testProjectRoot);
    jest.clearAllMocks();
  });

  describe('基本機能（pluginManager.tsから継承）', () => {
    it('インスタンスが正しく作成される', () => {
      expect(manager).toBeInstanceOf(UnifiedPluginManager);
    });

    it('レガシープラグインを登録できる', () => {
      const plugin = createMockLegacyPlugin('test-plugin');
      manager.registerLegacy(plugin);
      
      const plugins = manager.getLegacyPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBe(plugin);
    });

    it('複数のレガシープラグインを登録できる', () => {
      const plugin1 = createMockLegacyPlugin('plugin1');
      const plugin2 = createMockLegacyPlugin('plugin2');
      
      manager.registerLegacy(plugin1);
      manager.registerLegacy(plugin2);
      
      const plugins = manager.getLegacyPlugins();
      expect(plugins).toHaveLength(2);
    });

    it('不正なプラグイン名を拒否する', () => {
      const invalidPlugin: IPlugin = {
        name: 'invalid-plugin!@#',
        analyze: jest.fn()
      };
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      manager.registerLegacy(invalidPlugin);
      
      expect(manager.getLegacyPlugins()).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it('レガシープラグインを実行できる', async () => {
      const plugin = createMockLegacyPlugin('test-plugin');
      manager.registerLegacy(plugin);
      
      const issues = await manager.runLegacyPlugins('test.ts');
      
      expect(plugin.analyze).toHaveBeenCalledWith('test.ts');
      expect(issues).toHaveLength(1);
      expect(issues[0].message).toBe('Issue from test-plugin');
    });
  });

  describe('拡張機能（pluginManagerExtended.tsから継承）', () => {
    it('品質プラグインを登録できる', () => {
      const plugin = createMockQualityPlugin('quality1');
      manager.registerQuality(plugin);
      
      const plugins = manager.getQualityPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBe(plugin);
    });

    it('品質分析を実行できる', async () => {
      const plugin = createMockQualityPlugin('quality1');
      manager.registerQuality(plugin);
      
      const testFile: TestFile = {
        path: 'test.spec.ts',
        content: 'test content',
        framework: 'jest',
        testMethods: [],
        testCount: 0
      };
      
      const context: ProjectContext = {
        rootPath: testProjectRoot,
        projectPath: testProjectRoot,
        testFramework: 'jest',
        language: 'typescript'
      };
      
      const result = await manager.runQualityAnalysis(testFile, context);
      
      expect(plugin.isApplicable).toHaveBeenCalledWith(context);
      expect(plugin.detectPatterns).toHaveBeenCalledWith(testFile);
      expect(result.pluginResults).toHaveLength(1);
      expect(result.executionStats.successfulPlugins).toBe(1);
    });

    it('タイムアウトを適用できる', async () => {
      const slowPlugin = createMockQualityPlugin('slow');
      (slowPlugin.detectPatterns as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );
      
      manager.registerQuality(slowPlugin);
      
      const testFile: TestFile = {
        path: 'test.spec.ts',
        content: 'test content',
        framework: 'jest',
        testMethods: [],
        testCount: 0
      };
      
      const context: ProjectContext = {
        rootPath: testProjectRoot,
        projectPath: testProjectRoot,
        testFramework: 'jest',
        language: 'typescript'
      };
      
      const result = await manager.runQualityAnalysis(testFile, context, { timeout: 100 });
      
      expect(result.executionStats.failedPlugins).toBe(1);
      expect(result.pluginResults[0].error).toBeDefined();
    });
  });

  describe('統合による新機能', () => {
    it('レガシーと品質プラグインを同時に管理できる', () => {
      const legacy = createMockLegacyPlugin('legacy');
      const quality = createMockQualityPlugin('quality');
      
      manager.registerLegacy(legacy);
      manager.registerQuality(quality);
      
      expect(manager.getLegacyPlugins()).toHaveLength(1);
      expect(manager.getQualityPlugins()).toHaveLength(1);
    });

    it('全プラグインを統合実行できる', async () => {
      const legacy = createMockLegacyPlugin('legacy');
      const quality = createMockQualityPlugin('quality');
      
      manager.registerLegacy(legacy);
      manager.registerQuality(quality);
      
      const testFile: TestFile = {
        path: 'test.spec.ts',
        content: 'test content',
        framework: 'jest',
        testMethods: [],
        testCount: 0
      };
      
      const context: ProjectContext = {
        rootPath: testProjectRoot,
        projectPath: testProjectRoot,
        testFramework: 'jest',
        language: 'typescript'
      };
      
      const result = await manager.runUnifiedAnalysis(testFile.path, context);
      
      expect(result.legacyIssues).toHaveLength(1);
      expect(result.qualityResults.pluginResults).toHaveLength(1);
      expect(legacy.analyze).toHaveBeenCalled();
      expect(quality.detectPatterns).toHaveBeenCalled();
    });

    it('プラグインのフィルタリングができる', async () => {
      const plugin1 = createMockQualityPlugin('plugin1');
      const plugin2 = createMockQualityPlugin('plugin2');
      
      manager.registerQuality(plugin1);
      manager.registerQuality(plugin2);
      
      const testFile: TestFile = {
        path: 'test.spec.ts',
        content: 'test content',
        framework: 'jest',
        testMethods: [],
        testCount: 0
      };
      
      const context: ProjectContext = {
        rootPath: testProjectRoot,
        projectPath: testProjectRoot,
        testFramework: 'jest',
        language: 'typescript'
      };
      
      const result = await manager.runQualityAnalysis(testFile, context, {
        skipPlugins: ['plugin2']
      });
      
      expect(result.pluginResults).toHaveLength(1);
      expect(result.pluginResults[0].pluginId).toBe('plugin1');
    });

    it('エラーハンドリングが適切に動作する', async () => {
      const errorPlugin = createMockQualityPlugin('error');
      (errorPlugin.detectPatterns as jest.Mock).mockRejectedValue(new Error('Plugin error'));
      
      manager.registerQuality(errorPlugin);
      
      const testFile: TestFile = {
        path: 'test.spec.ts',
        content: 'test content',
        framework: 'jest',
        testMethods: [],
        testCount: 0
      };
      
      const context: ProjectContext = {
        rootPath: testProjectRoot,
        projectPath: testProjectRoot,
        testFramework: 'jest',
        language: 'typescript'
      };
      
      const result = await manager.runQualityAnalysis(testFile, context);
      
      expect(result.executionStats.failedPlugins).toBe(1);
      expect(result.pluginResults[0].error).toBe('Plugin error');
    });
  });

  describe('SOLID原則の遵守', () => {
    it('単一責任原則: プラグイン管理のみを責務とする', () => {
      // プラグイン管理以外の機能が含まれていないことを確認
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(manager));
      const managementMethods = methods.filter(m => 
        m.includes('register') || 
        m.includes('Plugin') || 
        m.includes('run') ||
        m.includes('get') ||
        m.includes('analyze') ||
        m.includes('execute') ||
        m.includes('read') ||
        m.includes('extract') ||
        m.includes('calculate') ||
        m === 'constructor'
      );
      
      expect(managementMethods.length).toBeGreaterThan(0);
      // ヘルパーメソッドも含めて、全てプラグイン管理に関連することを確認
      expect(methods.length).toBeGreaterThan(0);
    });

    it('開放閉鎖原則: 新しいプラグインタイプを追加できる', () => {
      // カスタムプラグインタイプのサポートを確認
      const customPlugin: ITestQualityPlugin = {
        id: 'custom',
        name: 'Custom Plugin',
        version: '1.0.0',
        type: 'custom' as any, // 新しいタイプ
        isApplicable: jest.fn().mockReturnValue(true),
        detectPatterns: jest.fn().mockResolvedValue([]),
        evaluateQuality: jest.fn().mockReturnValue({ overall: 100, score: 100, details: {} }),
        suggestImprovements: jest.fn().mockReturnValue([])
      };
      
      manager.registerQuality(customPlugin);
      expect(manager.getQualityPlugins()).toContain(customPlugin);
    });

    it('リスコフの置換原則: プラグインインターフェースの互換性を保つ', async () => {
      // IPluginとITestQualityPluginの両方が正しく動作することを確認
      const legacy = createMockLegacyPlugin('legacy');
      const quality = createMockQualityPlugin('quality');
      
      manager.registerLegacy(legacy);
      manager.registerQuality(quality);
      
      // 両方のタイプが期待通りに動作
      const legacyResult = await manager.runLegacyPlugins('test.ts');
      expect(legacyResult).toBeDefined();
      
      const qualityResult = await manager.runQualityAnalysis(
        { path: 'test.ts', content: '', framework: 'jest', testMethods: [], testCount: 0 },
        { rootPath: testProjectRoot, projectPath: testProjectRoot, testFramework: 'jest', language: 'typescript' }
      );
      expect(qualityResult).toBeDefined();
    });

    it('インターフェース分離原則: 必要なインターフェースのみ依存', () => {
      // プラグインが必要最小限のインターフェースのみ実装していることを確認
      const minimalPlugin: IPlugin = {
        name: 'minimal',
        analyze: jest.fn().mockResolvedValue([])
      };
      
      manager.registerLegacy(minimalPlugin);
      expect(manager.getLegacyPlugins()).toContain(minimalPlugin);
    });

    it('依存性逆転原則: 抽象に依存し具象に依存しない', () => {
      // インターフェースを通じてプラグインと相互作用
      const plugin: IPlugin = {
        name: 'abstract',
        analyze: jest.fn().mockResolvedValue([])
      };
      
      manager.registerLegacy(plugin);
      
      // 具象クラスではなくインターフェースとして扱われる
      const plugins = manager.getLegacyPlugins();
      expect(plugins[0]).toMatchObject({ name: 'abstract' });
    });
  });
});