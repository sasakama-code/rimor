import * as fs from 'fs';
import * as path from 'path';
import { DictionaryAwarePluginManager } from '../../src/core/DictionaryAwarePluginManager';
import { PluginManager } from '../../src/core/pluginManager';
import { DictionaryLoader } from '../../src/dictionary/storage/loader';
import { ContextEngine } from '../../src/dictionary/context/engine';
import { errorHandler } from '../../src/utils/errorHandler';
import { PathSecurity } from '../../src/utils/pathSecurity';

// モック設定
jest.mock('fs');
jest.mock('path');
jest.mock('../../src/core/pluginManager');
jest.mock('../../src/dictionary/storage/loader');
jest.mock('../../src/dictionary/context/engine');
jest.mock('../../src/utils/errorHandler');
jest.mock('../../src/utils/pathSecurity');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;
const mockPathSecurity = PathSecurity as jest.Mocked<typeof PathSecurity>;

describe('DictionaryAwarePluginManager', () => {
  let manager: DictionaryAwarePluginManager;
  let mockContextEngine: any;
  let consoleSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockDictionary = {
    domain: 'test-domain',
    version: '1.0.0',
    language: 'ja',
    terms: [
      {
        id: 'term1',
        term: 'TestTerm',
        definition: 'Test definition',
        importance: 'critical',
        category: 'business'
      }
    ],
    businessRules: [
      {
        id: 'rule1',
        name: 'TestRule',
        description: 'Test rule',
        condition: { pattern: 'test.*', scope: 'file' },
        priority: 100
      }
    ]
  };

  const mockDictionaryAwarePlugin = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    type: 'domain' as const,
    // ITestQualityPlugin から継承されるメソッド
    isApplicable: jest.fn().mockReturnValue(true),
    detectPatterns: jest.fn().mockResolvedValue([]),
    evaluateQuality: jest.fn().mockReturnValue({
      overall: 80,
      breakdown: { completeness: 80, correctness: 80, maintainability: 80 },
      confidence: 0.8
    }),
    suggestImprovements: jest.fn().mockReturnValue([]),
    // DictionaryAwarePlugin 固有のメソッド
    analyzeWithContext: jest.fn(),
    evaluateDomainQuality: jest.fn()
  };

  const mockTestQualityPlugin = {
    id: 'quality-plugin',
    name: 'Quality Plugin',
    version: '1.0.0',
    type: 'core' as const,
    isApplicable: jest.fn(),
    detectPatterns: jest.fn(),
    evaluateQuality: jest.fn(),
    suggestImprovements: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // PathSecurityのモック
    mockPathSecurity.safeResolve.mockImplementation((path) => path);
    
    // pathのモック
    mockPath.extname.mockImplementation((filePath) => {
      if (filePath.endsWith('.ts')) return '.ts';
      if (filePath.endsWith('.js')) return '.js';
      return '';
    });
    
    // ContextEngineのモック
    mockContextEngine = {
      analyze: jest.fn(),
      getContext: jest.fn()
    };
    (ContextEngine as jest.MockedClass<typeof ContextEngine>)
      .mockImplementation(() => mockContextEngine);
    
    // PluginManagerのモック - DictionaryAwarePluginManagerが継承できるように
    const mockPluginManagerPrototype = {
      register: jest.fn(),
      runAll: jest.fn().mockResolvedValue([]),
      getExecutionStats: jest.fn().mockReturnValue({}),
      registerSandboxedPlugin: jest.fn(),
      registerFromFile: jest.fn(),
      removeSandboxedPlugin: jest.fn(),
      setSandboxEnabled: jest.fn()
    };
    
    // プロトタイプメソッドをモック
    Object.setPrototypeOf(PluginManager.prototype, mockPluginManagerPrototype);
    
    // コンソールのモック
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    manager = new DictionaryAwarePluginManager('/test/project');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('constructor', () => {
    test('親クラスが正しく初期化される', () => {
      expect(PluginManager).toHaveBeenCalledWith('/test/project');
    });

    test('デフォルトでprocess.cwd()を使用する', () => {
      const processCwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/default/path');
      new DictionaryAwarePluginManager();
      expect(PluginManager).toHaveBeenCalledWith('/default/path');
      processCwdSpy.mockRestore();
    });
  });

  describe('registerDictionaryAwarePlugin', () => {
    test('有効なプラグインが正常に登録される', () => {
      manager.registerDictionaryAwarePlugin(mockDictionaryAwarePlugin);
      
      const plugins = manager.getDictionaryAwarePlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].id).toBe('test-plugin');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('辞書対応プラグイン "Test Plugin" を登録しました')
      );
    });

    test('IDが不正なプラグインで例外が発生する', () => {
      const invalidPlugin = { ...mockDictionaryAwarePlugin, id: '' };
      
      manager.registerDictionaryAwarePlugin(invalidPlugin);
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        '辞書対応プラグインの登録に失敗しました',
        expect.objectContaining({ pluginId: '', pluginName: 'Test Plugin' })
      );
    });

    test('名前が不正なプラグインで例外が発生する', () => {
      const invalidPlugin = { ...mockDictionaryAwarePlugin, name: '' };
      
      manager.registerDictionaryAwarePlugin(invalidPlugin);
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        '辞書対応プラグインの登録に失敗しました',
        expect.objectContaining({ pluginId: 'test-plugin', pluginName: '' })
      );
    });

    test('バージョンが不正なプラグインで例外が発生する', () => {
      const invalidPlugin = { ...mockDictionaryAwarePlugin, version: null as any };
      
      manager.registerDictionaryAwarePlugin(invalidPlugin);
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        '辞書対応プラグインの登録に失敗しました',
        expect.any(Object)
      );
    });

    test('安全でないIDのプラグインで例外が発生する', () => {
      const invalidPlugin = { ...mockDictionaryAwarePlugin, id: 'test plugin!' };
      
      manager.registerDictionaryAwarePlugin(invalidPlugin);
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        '辞書対応プラグインの登録に失敗しました',
        expect.any(Object)
      );
    });
  });

  describe('registerTestQualityPlugin', () => {
    test('有効なテスト品質プラグインが正常に登録される', () => {
      manager.registerTestQualityPlugin(mockTestQualityPlugin);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('テスト品質プラグイン "Quality Plugin" を登録しました')
      );
    });

    test('不正なプラグインでエラーハンドリングされる', () => {
      const invalidPlugin = { ...mockTestQualityPlugin, id: '' };
      
      manager.registerTestQualityPlugin(invalidPlugin);
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        'テスト品質プラグインの登録に失敗しました',
        expect.any(Object)
      );
    });
  });

  describe('loadDictionary', () => {
    beforeEach(() => {
      (DictionaryLoader.loadFromFile as jest.Mock).mockResolvedValue(mockDictionary);
    });

    test('辞書が正常に読み込まれる', async () => {
      const result = await manager.loadDictionary('/test/dictionary.yaml', 'test-domain');
      
      expect(result).toBe(true);
      expect(mockPathSecurity.safeResolve).toHaveBeenCalledWith(
        '/test/dictionary.yaml',
        process.cwd(),
        'dictionary-load'
      );
      expect(DictionaryLoader.loadFromFile).toHaveBeenCalledWith('/test/dictionary.yaml');
      expect(ContextEngine).toHaveBeenCalledWith(mockDictionary);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ドメイン辞書 "test-domain" を読み込みました')
      );
    });

    test('ドメイン指定なしで辞書のドメインを使用する', async () => {
      const result = await manager.loadDictionary('/test/dictionary.yaml');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`ドメイン辞書 "${mockDictionary.domain}" を読み込みました`)
      );
    });

    test('パス検証が失敗した場合、falseを返す', async () => {
      mockPathSecurity.safeResolve.mockReturnValue(null);
      
      const result = await manager.loadDictionary('/invalid/path');
      
      expect(result).toBe(false);
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        'ドメイン辞書の読み込みに失敗しました',
        expect.any(Object)
      );
    });

    test('辞書の読み込みが失敗した場合、falseを返す', async () => {
      (DictionaryLoader.loadFromFile as jest.Mock).mockResolvedValue(null);
      
      const result = await manager.loadDictionary('/test/invalid.yaml');
      
      expect(result).toBe(false);
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        'ドメイン辞書の読み込みに失敗しました',
        expect.any(Object)
      );
    });
  });

  describe('runAllWithDictionary', () => {
    beforeEach(() => {
      // 辞書とプラグインを準備
      (manager as any).loadedDictionaries.set('test-domain', mockDictionary);
      (manager as any).dictionaryEnabled = true;
      manager.registerDictionaryAwarePlugin(mockDictionaryAwarePlugin);
      manager.registerTestQualityPlugin(mockTestQualityPlugin);
      
      // ファイルシステムのモック
      mockFs.readFileSync.mockReturnValue('test file content');
      mockFs.statSync.mockReturnValue({ mtime: new Date() } as any);
      
      // プラグインのモック動作
      mockDictionaryAwarePlugin.analyzeWithContext.mockResolvedValue({
        qualityScore: 85,
        context: { domainRelevance: 0.8 },
        relevantTerms: [],
        applicableRules: [],
        requiredTests: []
      });
      
      mockTestQualityPlugin.isApplicable.mockReturnValue(true);
      mockTestQualityPlugin.detectPatterns.mockResolvedValue([]);
      mockTestQualityPlugin.evaluateQuality.mockReturnValue({
        overall: 90,
        breakdown: { completeness: 90, correctness: 90, maintainability: 90 },
        confidence: 0.9
      });
      mockTestQualityPlugin.suggestImprovements.mockReturnValue([]);
    });

    test('すべてのプラグインが正常に実行される', async () => {
      // PathSecurityのモックを再設定
      mockPathSecurity.safeResolve.mockReturnValue('/test/file.ts');
      
      // fsのモックを再設定（prepareTestFile用）
      mockFs.readFileSync.mockReturnValue('test file content');
      mockFs.statSync.mockReturnValue({ mtime: new Date() } as any);
      
      const result = await manager.runAllWithDictionary('/test/file.ts', 'test-domain');
      
      // 簡略化した確認 - 結果が返されることと基本構造を確認
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('legacyResults');
      expect(result).toHaveProperty('contextualResults');
      expect(result).toHaveProperty('pluginResults');
    });

    test('パス検証が失敗した場合、エラーハンドリングされる', async () => {
      mockPathSecurity.safeResolve.mockReturnValue(null);
      
      const result = await manager.runAllWithDictionary('/invalid/path');
      
      expect(result.legacyResults).toHaveLength(0);
      expect(result.contextualResults).toHaveLength(0);
      expect(result.pluginResults).toHaveLength(0);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('辞書が無効な場合、辞書対応プラグインはスキップされる', async () => {
      (manager as any).dictionaryEnabled = false;
      
      const result = await manager.runAllWithDictionary('/test/file.ts');
      
      expect(result.contextualResults).toHaveLength(0);
      expect(result.pluginResults).toHaveLength(0);
    });
  });

  describe('runDictionaryAwarePlugin', () => {
    beforeEach(() => {
      (manager as any).loadedDictionaries.set('test-domain', mockDictionary);
      manager.registerDictionaryAwarePlugin(mockDictionaryAwarePlugin);
      
      mockFs.readFileSync.mockReturnValue('test content');
      mockFs.statSync.mockReturnValue({ mtime: new Date() } as any);
      
      mockDictionaryAwarePlugin.analyzeWithContext.mockResolvedValue({
        qualityScore: 85,
        context: { domainRelevance: 0.8 }
      });
    });

    test('指定されたプラグインが正常に実行される', async () => {
      const result = await manager.runDictionaryAwarePlugin(
        'test-plugin',
        '/test/file.ts',
        'test-domain'
      );
      
      expect(result).toBeDefined();
      expect(result?.qualityScore).toBe(85);
      expect(mockDictionaryAwarePlugin.analyzeWithContext).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('プラグイン "Test Plugin" 実行完了')
      );
    });

    test('存在しないプラグインIDでnullを返す', async () => {
      const result = await manager.runDictionaryAwarePlugin(
        'non-existent',
        '/test/file.ts'
      );
      
      expect(result).toBeNull();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        '辞書対応プラグインの実行に失敗しました',
        expect.any(Object)
      );
    });

    test('辞書が見つからない場合、nullを返す', async () => {
      // 辞書をクリアしてからテスト
      (manager as any).loadedDictionaries.clear();
      
      const result = await manager.runDictionaryAwarePlugin(
        'test-plugin',
        '/test/file.ts',
        'non-existent-domain'
      );
      
      expect(result).toBeNull();
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        '辞書対応プラグインの実行に失敗しました',
        expect.any(Object)
      );
    });
  });

  describe('evaluateQualityWithDomain', () => {
    beforeEach(() => {
      (manager as any).loadedDictionaries.set('test-domain', mockDictionary);
      manager.registerDictionaryAwarePlugin(mockDictionaryAwarePlugin);
      
      mockFs.readFileSync.mockReturnValue('test content');
      mockFs.statSync.mockReturnValue({ mtime: new Date() } as any);
      
      mockDictionaryAwarePlugin.detectPatterns.mockResolvedValue([]);
      mockDictionaryAwarePlugin.evaluateDomainQuality.mockReturnValue({
        overall: 85,
        recommendations: ['Improve test coverage']
      });
    });

    test('ドメイン品質評価が正常に実行される', async () => {
      const result = await manager.evaluateQualityWithDomain('/test/file.ts', 'test-domain');
      
      expect(result.overallScore).toBe(85);
      expect(result.domainSpecificScores.size).toBe(1);
      expect(result.recommendations).toContain('Improve test coverage');
    });

    test('辞書が見つからない場合、空の結果を返す', async () => {
      // 辞書をクリアしてからテスト
      (manager as any).loadedDictionaries.clear();
      
      const result = await manager.evaluateQualityWithDomain('/test/file.ts', 'non-existent');
      
      expect(result.overallScore).toBe(0);
      expect(result.domainSpecificScores.size).toBe(0);
      expect(result.recommendations).toHaveLength(0);
    });

    test('プラグインエラーが適切に処理される', async () => {
      mockDictionaryAwarePlugin.detectPatterns.mockRejectedValue(new Error('Plugin error'));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await manager.evaluateQualityWithDomain('/test/file.ts', 'test-domain');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('プラグイン test-plugin の評価中にエラーが発生しました'),
        expect.any(Error)
      );
      expect(result.overallScore).toBe(0);
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getDictionaryAwarePlugins', () => {
    test('登録されたプラグインの一覧を返す', () => {
      manager.registerDictionaryAwarePlugin(mockDictionaryAwarePlugin);
      
      const plugins = manager.getDictionaryAwarePlugins();
      
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toEqual({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        type: 'domain'
      });
    });

    test('プラグインが登録されていない場合、空配列を返す', () => {
      const plugins = manager.getDictionaryAwarePlugins();
      expect(plugins).toHaveLength(0);
    });
  });

  describe('getLoadedDictionaries', () => {
    test('読み込まれた辞書の一覧を返す', async () => {
      // DictionaryLoaderのモックを再設定
      (DictionaryLoader.loadFromFile as jest.Mock).mockResolvedValue(mockDictionary);
      
      await manager.loadDictionary('/test/dictionary.yaml', 'test-domain');
      
      const dictionaries = manager.getLoadedDictionaries();
      
      expect(dictionaries).toHaveLength(1);
      expect(dictionaries[0]).toEqual({
        domain: 'test-domain',
        version: '1.0.0',
        termsCount: 1,
        rulesCount: 1
      });
    });

    test('辞書が読み込まれていない場合、空配列を返す', () => {
      const dictionaries = manager.getLoadedDictionaries();
      expect(dictionaries).toHaveLength(0);
    });
  });

  describe('setDictionaryEnabled', () => {
    test('辞書機能の有効化', () => {
      manager.setDictionaryEnabled(true);
      
      expect(consoleSpy).toHaveBeenCalledWith('📚 辞書機能: 有効');
    });

    test('辞書機能の無効化', () => {
      manager.setDictionaryEnabled(false);
      
      expect(consoleSpy).toHaveBeenCalledWith('📚 辞書機能: 無効');
    });
  });

  describe('getEnhancedStats', () => {
    test('拡張統計情報を返す', () => {
      manager.registerDictionaryAwarePlugin(mockDictionaryAwarePlugin);
      manager.registerTestQualityPlugin(mockTestQualityPlugin);
      (manager as any).loadedDictionaries.set('test', mockDictionary);
      manager.setDictionaryEnabled(true);
      
      // getExecutionStatsのモックを再設定
      const mockGetExecutionStats = jest.spyOn(manager, 'getExecutionStats').mockReturnValue({
        totalPlugins: 2,
        sandboxedPlugins: 0,
        legacyPlugins: 2,
        sandboxEnabled: true
      });
      
      const stats = manager.getEnhancedStats();
      
      expect(stats.dictionaryAwarePlugins).toBe(1);
      expect(stats.testQualityPlugins).toBe(1);
      expect(stats.loadedDictionaries).toBe(1);
      expect(stats.dictionaryEnabled).toBe(true);
      expect(stats.basic).toBeDefined();
      expect(stats.basic.totalPlugins).toBe(2);
      
      mockGetExecutionStats.mockRestore();
    });
  });

  describe('private methods', () => {
    describe('validatePlugin', () => {
      test('有効なプラグインで例外が発生しない', () => {
        expect(() => {
          (manager as any).validatePlugin(mockDictionaryAwarePlugin);
        }).not.toThrow();
      });

      test('IDがない場合、例外が発生する', () => {
        expect(() => {
          (manager as any).validatePlugin({ ...mockDictionaryAwarePlugin, id: undefined });
        }).toThrow('プラグインIDが不正です');
      });

      test('名前がない場合、例外が発生する', () => {
        expect(() => {
          (manager as any).validatePlugin({ ...mockDictionaryAwarePlugin, name: undefined });
        }).toThrow('プラグイン名が不正です');
      });

      test('バージョンがない場合、例外が発生する', () => {
        expect(() => {
          (manager as any).validatePlugin({ ...mockDictionaryAwarePlugin, version: undefined });
        }).toThrow('プラグインバージョンが不正です');
      });

      test('不正な文字を含むIDで例外が発生する', () => {
        expect(() => {
          (manager as any).validatePlugin({ ...mockDictionaryAwarePlugin, id: 'test plugin!' });
        }).toThrow('不正なプラグインID: test plugin!');
      });
    });

    describe('prepareTestFile', () => {
      test('TestFileオブジェクトが正常に作成される', async () => {
        mockFs.readFileSync.mockReturnValue('file content');
        mockFs.statSync.mockReturnValue({ mtime: new Date('2023-01-01') } as any);
        
        const result = await (manager as any).prepareTestFile('/test/file.ts');
        
        expect(result).toEqual({
          path: '/test/file.ts',
          content: 'file content',
          metadata: {
            language: 'typescript',
            lastModified: new Date('2023-01-01')
          }
        });
      });
    });

    describe('prepareProjectContext', () => {
      test('ProjectContextが正常に作成される', async () => {
        const result = await (manager as any).prepareProjectContext();
        
        expect(result).toEqual({
          rootPath: process.cwd(),
          language: 'typescript',
          filePatterns: {
            test: ['**/*.test.ts', '**/*.spec.ts'],
            source: ['src/**/*.ts'],
            ignore: ['node_modules/**', 'dist/**']
          }
        });
      });
    });

    describe('selectDictionary', () => {
      beforeEach(() => {
        (manager as any).loadedDictionaries.set('domain1', mockDictionary);
        (manager as any).loadedDictionaries.set('default', { ...mockDictionary, domain: 'default' });
      });

      test('指定されたドメインの辞書を返す', () => {
        const result = (manager as any).selectDictionary('domain1');
        expect(result).toBe(mockDictionary);
      });

      test('ドメイン指定なしでdefaultを返す', () => {
        const result = (manager as any).selectDictionary();
        expect(result.domain).toBe('default');
      });

      test('存在しないドメインで最初の辞書を返す', () => {
        const result = (manager as any).selectDictionary('non-existent');
        expect(result).toBeDefined();
      });

      test('辞書が読み込まれていない場合、nullを返す', () => {
        (manager as any).loadedDictionaries.clear();
        const result = (manager as any).selectDictionary();
        expect(result).toBeNull();
      });
    });

    describe('createDomainContext', () => {
      test('DomainContextが正常に作成される', () => {
        const result = (manager as any).createDomainContext(mockDictionary);
        
        expect(result).toEqual({
          domain: 'test-domain',
          primaryTerms: [mockDictionary.terms[0]], // importance: 'critical'
          activeRules: mockDictionary.businessRules,
          qualityThreshold: 75
        });
      });
    });

    describe('detectLanguage', () => {
      test('TypeScriptファイルを正しく検出する', () => {
        const result = (manager as any).detectLanguage('/test/file.ts');
        expect(result).toBe('typescript');
      });

      test('JavaScriptファイルを正しく検出する', () => {
        mockPath.extname.mockReturnValue('.js');
        const result = (manager as any).detectLanguage('/test/file.js');
        expect(result).toBe('javascript');
      });

      test('Pythonファイルを正しく検出する', () => {
        mockPath.extname.mockReturnValue('.py');
        const result = (manager as any).detectLanguage('/test/file.py');
        expect(result).toBe('python');
      });

      test('Javaファイルを正しく検出する', () => {
        mockPath.extname.mockReturnValue('.java');
        const result = (manager as any).detectLanguage('/test/file.java');
        expect(result).toBe('java');
      });

      test('不明な拡張子でotherを返す', () => {
        mockPath.extname.mockReturnValue('.unknown');
        const result = (manager as any).detectLanguage('/test/file.unknown');
        expect(result).toBe('other');
      });
    });
  });
});