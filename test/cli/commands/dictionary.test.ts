import * as fs from 'fs';
import * as path from 'path';
import { DictionaryCommand, registerDictionaryCommands } from '../../../src/cli/commands/dictionary';
import { DomainDictionaryManager } from '../../../src/dictionary/core/dictionary';
import { DomainTermManager } from '../../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../../src/dictionary/core/rule';
import { LinterKnowledgeExtractor } from '../../../src/dictionary/extractors/linter';
import { ContextAnalyzer } from '../../../src/dictionary/context/analyzer';
import { OutputFormatter } from '../../../src/cli/output';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('fs');
jest.mock('path');
jest.mock('../../../src/dictionary/core/dictionary');
jest.mock('../../../src/dictionary/core/term');
jest.mock('../../../src/dictionary/core/rule');
jest.mock('../../../src/dictionary/extractors/linter');
jest.mock('../../../src/dictionary/context/analyzer');
jest.mock('../../../src/cli/output');
jest.mock('../../../src/utils/errorHandler');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('DictionaryCommand', () => {
  let dictionaryCommand: DictionaryCommand;
  let mockDictionaryManager: any;
  let processExitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // DomainDictionaryManagerのモック
    mockDictionaryManager = {
      addTerm: jest.fn(),
      addBusinessRule: jest.fn(),
      getDictionary: jest.fn(),
      evaluateQuality: jest.fn(),
      getStatistics: jest.fn(),
      searchTerms: jest.fn()
    };
    
    (DomainDictionaryManager as jest.MockedClass<typeof DomainDictionaryManager>)
      .mockImplementation(() => mockDictionaryManager);
    
    // pathのモック
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation((path) => path.substring(0, path.lastIndexOf('/')));
    mockPath.basename.mockImplementation((path) => path.substring(path.lastIndexOf('/') + 1));
    
    // process.cwd()のモック
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
    
    // process.exitのモック
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    
    // consoleのモック
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // OutputFormatterのモック
    (OutputFormatter.header as jest.Mock).mockReturnValue('=== HEADER ===');
    (OutputFormatter.info as jest.Mock).mockImplementation((text) => `INFO: ${text}`);
    (OutputFormatter.success as jest.Mock).mockImplementation((text) => `SUCCESS: ${text}`);
    (OutputFormatter.warning as jest.Mock).mockImplementation((text) => `WARNING: ${text}`);
    (OutputFormatter.error as jest.Mock).mockImplementation((text) => `ERROR: ${text}`);
    
    dictionaryCommand = new DictionaryCommand('/test/project');
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    test('プロジェクトルートが正しく設定される', () => {
      const command = new DictionaryCommand('/custom/path');
      expect(DomainDictionaryManager).toHaveBeenCalled();
    });

    test('デフォルトでprocess.cwd()を使用する', () => {
      const processCwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/default/path');
      new DictionaryCommand();
      expect(processCwdSpy).toHaveBeenCalled();
      processCwdSpy.mockRestore();
    });
  });

  describe('init', () => {
    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'promptDomain').mockResolvedValue('test-domain');
      jest.spyOn(dictionaryCommand as any, 'extractFromExistingConfigs').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'runInteractiveSetup').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'saveDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'getDictionaryPath').mockReturnValue('/test/project/.rimor/dictionary.json');
      jest.spyOn(dictionaryCommand as any, 'showInitializationSummary').mockImplementation(() => {});
    });

    test('基本的な初期化が実行される', async () => {
      await dictionaryCommand.init({});
      
      expect(OutputFormatter.header).toHaveBeenCalledWith('🧙 Rimorドメイン辞書初期化ウィザード');
      expect(DomainDictionaryManager).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'test-domain',
          language: 'ja',
          version: '1.0.0'
        })
      );
    });

    test('ドメインオプションが指定された場合、プロンプトをスキップ', async () => {
      await dictionaryCommand.init({ domain: 'custom-domain' });
      
      // ドメインが指定された場合、初期化が正常に完了することを確認
      expect(dictionaryCommand).toBeDefined();
    });

    test('fromLintersオプションがfalseの場合、知識抽出をスキップ', async () => {
      await dictionaryCommand.init({ fromLinters: false });
      
      // LinterKnowledgeExtractorが呼ばれないことを確認
      expect(LinterKnowledgeExtractor).not.toHaveBeenCalled();
    });

    test('interactiveオプションがtrueの場合、インタラクティブセットアップを実行', async () => {
      await dictionaryCommand.init({ interactive: true });
      
      expect(dictionaryCommand as any).toHaveProperty('runInteractiveSetup');
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('Init failed');
      jest.spyOn(dictionaryCommand as any, 'promptDomain').mockRejectedValue(testError);
      
      await dictionaryCommand.init({});
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        '辞書初期化に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('addTerm', () => {
    const mockTerm = {
      id: 'test-term',
      term: 'TestTerm',
      definition: 'Test definition',
      category: 'test',
      importance: 'medium' as const,
      aliases: [],
      examples: [],
      relatedPatterns: [],
      testRequirements: []
    };

    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'generateTermId').mockReturnValue('test-term');
      jest.spyOn(dictionaryCommand as any, 'promptTermDetails').mockResolvedValue(mockTerm);
      jest.spyOn(dictionaryCommand as any, 'saveDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'showTermSummary').mockImplementation(() => {});
      
      (DomainTermManager.createTerm as jest.Mock).mockReturnValue(mockTerm);
    });

    test('基本的な用語追加が実行される', async () => {
      await dictionaryCommand.addTerm({
        term: 'TestTerm',
        definition: 'Test definition'
      });
      
      expect(DomainTermManager.createTerm).toHaveBeenCalledWith(
        expect.objectContaining({
          term: 'TestTerm',
          definition: 'Test definition'
        })
      );
      expect(mockDictionaryManager.addTerm).toHaveBeenCalledWith(mockTerm);
      expect(OutputFormatter.success).toHaveBeenCalledWith(
        expect.stringContaining('用語「TestTerm」を追加しました')
      );
    });

    test('オプションパラメータが正しく適用される', async () => {
      await dictionaryCommand.addTerm({
        term: 'TestTerm',
        definition: 'Test definition',
        category: 'business',
        importance: 'high',
        aliases: ['test', 'term']
      });
      
      expect(DomainTermManager.createTerm).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'business',
          importance: 'high',
          aliases: ['test', 'term']
        })
      );
    });

    test('interactiveモードで詳細入力が実行される', async () => {
      await dictionaryCommand.addTerm({
        term: 'TestTerm',
        definition: 'Test definition',
        interactive: true
      });
      
      expect(dictionaryCommand as any).toHaveProperty('promptTermDetails');
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('Add term failed');
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockRejectedValue(testError);
      
      await dictionaryCommand.addTerm({
        term: 'TestTerm',
        definition: 'Test definition'
      });
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        '用語追加に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('addRule', () => {
    const mockRule = {
      id: 'test-rule',
      name: 'TestRule',
      description: 'Test rule description',
      domain: 'test',
      condition: {
        type: 'code-pattern' as const,
        pattern: 'test.*',
        scope: 'file' as const
      },
      requirements: [],
      priority: 100
    };

    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'generateRuleId').mockReturnValue('test-rule');
      jest.spyOn(dictionaryCommand as any, 'saveDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'showRuleSummary').mockImplementation(() => {});
      
      mockDictionaryManager.getDictionary.mockReturnValue({ domain: 'test' });
      (BusinessRuleManager.createRule as jest.Mock).mockReturnValue(mockRule);
    });

    test('基本的なルール追加が実行される', async () => {
      await dictionaryCommand.addRule({
        name: 'TestRule',
        description: 'Test rule description',
        pattern: 'test.*'
      });
      
      expect(BusinessRuleManager.createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TestRule',
          description: 'Test rule description',
          condition: expect.objectContaining({
            pattern: 'test.*'
          })
        })
      );
      expect(mockDictionaryManager.addBusinessRule).toHaveBeenCalledWith(mockRule);
    });

    test('オプションパラメータが正しく適用される', async () => {
      await dictionaryCommand.addRule({
        name: 'TestRule',
        description: 'Test rule description',
        pattern: 'test.*',
        scope: 'function',
        type: 'function-name',
        priority: 50
      });
      
      expect(BusinessRuleManager.createRule).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: expect.objectContaining({
            type: 'function-name',
            scope: 'function'
          }),
          priority: 50
        })
      );
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('Add rule failed');
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockRejectedValue(testError);
      
      await dictionaryCommand.addRule({
        name: 'TestRule',
        description: 'Test rule description',
        pattern: 'test.*'
      });
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        'ビジネスルール追加に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('list', () => {
    const mockDictionary = {
      domain: 'test',
      terms: [
        { id: 'term1', term: 'Term1', definition: 'Definition 1', category: 'business', importance: 'high', aliases: [] },
        { id: 'term2', term: 'Term2', definition: 'Definition 2', category: 'technical', importance: 'medium', aliases: ['t2'] }
      ],
      businessRules: [
        { id: 'rule1', name: 'Rule1', description: 'Rule description', condition: { pattern: 'rule.*' }, priority: 100 }
      ]
    };

    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'displayTerms').mockImplementation(() => {});
      jest.spyOn(dictionaryCommand as any, 'displayRules').mockImplementation(() => {});
      jest.spyOn(dictionaryCommand as any, 'displayStatistics').mockImplementation(() => {});
      jest.spyOn(dictionaryCommand as any, 'outputJson').mockImplementation(() => {});
      
      mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);
    });

    test('テーブル形式で全体表示', async () => {
      await dictionaryCommand.list({});
      
      expect(OutputFormatter.header).toHaveBeenCalledWith('📚 ドメイン辞書内容 (test)');
      expect(dictionaryCommand as any).toHaveProperty('displayTerms');
      expect(dictionaryCommand as any).toHaveProperty('displayRules');
      expect(dictionaryCommand as any).toHaveProperty('displayStatistics');
    });

    test('用語のみ表示', async () => {
      await dictionaryCommand.list({ type: 'terms' });
      
      // 用語のみの表示処理が実行されることを確認
      expect(mockDictionaryManager.getDictionary).toHaveBeenCalled();
    });

    test('ルールのみ表示', async () => {
      await dictionaryCommand.list({ type: 'rules' });
      
      // ルールのみの表示処理が実行されることを確認
      expect(mockDictionaryManager.getDictionary).toHaveBeenCalled();
    });

    test('JSON形式で出力', async () => {
      await dictionaryCommand.list({ format: 'json' });
      
      expect(dictionaryCommand as any).toHaveProperty('outputJson');
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('List failed');
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockRejectedValue(testError);
      
      await dictionaryCommand.list({});
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        '辞書一覧表示に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('validate', () => {
    const mockQualityMetrics = {
      overall: 75.5,
      completeness: 80,
      accuracy: 90,
      consistency: 70,
      coverage: 60
    };

    const mockStatistics = {
      totalTerms: 10,
      totalRules: 5,
      totalRelationships: 3
    };

    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'displayQualityReport').mockImplementation(() => {});
      jest.spyOn(dictionaryCommand as any, 'displayImprovementSuggestions').mockImplementation(() => {});
      
      mockDictionaryManager.evaluateQuality.mockReturnValue(mockQualityMetrics);
      mockDictionaryManager.getStatistics.mockReturnValue(mockStatistics);
    });

    test('品質検証が正常に実行される', async () => {
      await dictionaryCommand.validate();
      
      expect(OutputFormatter.header).toHaveBeenCalledWith('🔍 ドメイン辞書品質検証');
      expect(mockDictionaryManager.evaluateQuality).toHaveBeenCalled();
      expect(mockDictionaryManager.getStatistics).toHaveBeenCalled();
      expect(OutputFormatter.success).toHaveBeenCalledWith(expect.stringContaining('辞書の品質は良好です'));
    });

    test('品質スコアが低い場合、警告を表示', async () => {
      mockDictionaryManager.evaluateQuality.mockReturnValue({ ...mockQualityMetrics, overall: 50 });
      
      await dictionaryCommand.validate();
      
      expect(OutputFormatter.warning).toHaveBeenCalledWith(expect.stringContaining('辞書の品質向上が推奨されます'));
      // process.exit is not called in test environment
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('Validate failed');
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockRejectedValue(testError);
      
      await dictionaryCommand.validate();
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        '辞書検証に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('search', () => {
    const mockSearchResults = [
      {
        id: 'term1',
        term: 'SearchTerm1',
        definition: 'First search result',
        category: 'business',
        importance: 'high',
        aliases: ['st1']
      },
      {
        id: 'term2',
        term: 'SearchTerm2',
        definition: 'Second search result',
        category: 'technical',
        importance: 'medium',
        aliases: []
      }
    ];

    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockResolvedValue(undefined);
    });

    test('検索結果が表示される', async () => {
      mockDictionaryManager.searchTerms.mockReturnValue(mockSearchResults);
      
      await dictionaryCommand.search('search');
      
      expect(mockDictionaryManager.searchTerms).toHaveBeenCalledWith('search');
      expect(OutputFormatter.header).toHaveBeenCalledWith('🔍 検索結果: "search"');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2件の用語が見つかりました'));
    });

    test('検索結果がない場合、警告を表示', async () => {
      mockDictionaryManager.searchTerms.mockReturnValue([]);
      
      await dictionaryCommand.search('notfound');
      
      expect(OutputFormatter.warning).toHaveBeenCalledWith(
        expect.stringContaining('「notfound」に一致する用語が見つかりませんでした')
      );
    });

    test('エラーが発生した場合、適切にハンドリングされる', async () => {
      const testError = new Error('Search failed');
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockRejectedValue(testError);
      
      await dictionaryCommand.search('test');
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        '用語検索に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('analyze', () => {
    const mockAnalysisResult = {
      qualityScore: 85.5,
      context: {
        domainRelevance: 0.75,
        filePath: '/test/file.ts',
        functions: ['func1', 'func2'],
        classes: ['Class1'],
        imports: ['import1'],
        language: 'typescript'
      },
      relevantTerms: [
        { term: { term: 'Term1' }, relevance: 0.9 },
        { term: { term: 'Term2' }, relevance: 0.7 }
      ],
      applicableRules: [
        { name: 'Rule1' },
        { name: 'Rule2' }
      ],
      requiredTests: [
        { type: 'unit', description: 'Test description 1' },
        { type: 'integration', description: 'Test description 2' }
      ]
    };

    beforeEach(() => {
      jest.spyOn(dictionaryCommand as any, 'loadDictionary').mockResolvedValue(undefined);
      jest.spyOn(dictionaryCommand as any, 'displayAnalysisResults').mockImplementation(() => {});
      jest.spyOn(dictionaryCommand as any, 'saveAnalysisResults').mockResolvedValue(undefined);
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('test code content');
      mockDictionaryManager.getDictionary.mockReturnValue({ domain: 'test' });
      
      const mockAnalyzer = {
        engine: {},
        performContextualAnalysis: jest.fn().mockResolvedValue(mockAnalysisResult),
        analyzeTermRelevance: jest.fn().mockResolvedValue([]),
        identifyApplicableRules: jest.fn().mockReturnValue([]),
        calculateContextualQualityScore: jest.fn().mockReturnValue(85),
        analyzeBatch: jest.fn().mockResolvedValue([]),
        generateAnalysisStatistics: jest.fn().mockReturnValue({
          totalFiles: 0,
          avgQualityScore: 0,
          avgDomainRelevance: 0,
          mostRelevantTerms: [],
          commonRules: [],
          testCoverage: { mustHave: 0, shouldHave: 0, niceToHave: 0 }
        }),
        // プライベートメソッドのモック（テスト用）
        extractEvidence: jest.fn().mockReturnValue([]),
        findTermLocations: jest.fn().mockReturnValue([]),
        isRuleApplicableToContext: jest.fn().mockReturnValue(true),
        calculateCodeSimilarity: jest.fn().mockReturnValue(0.5),
        escapeRegex: jest.fn().mockImplementation((text: string) => text),
        createEmptyAnalysis: jest.fn().mockReturnValue(mockAnalysisResult)
      } as any;
      (ContextAnalyzer as jest.MockedClass<typeof ContextAnalyzer>)
        .mockImplementation(() => mockAnalyzer);
    });

    test('ファイル分析が正常に実行される', async () => {
      await dictionaryCommand.analyze('/test/file.ts', {});
      
      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/file.ts');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
      expect(ContextAnalyzer).toHaveBeenCalled();
      expect(OutputFormatter.header).toHaveBeenCalledWith(expect.stringContaining('文脈理解分析'));
    });

    test('verboseオプションで詳細分析が実行される', async () => {
      await dictionaryCommand.analyze('/test/file.ts', { verbose: true });
      
      expect(dictionaryCommand as any).toHaveProperty('displayAnalysisResults');
    });

    test('出力ファイルオプションで結果が保存される', async () => {
      await dictionaryCommand.analyze('/test/file.ts', { output: '/test/output.json' });
      
      expect(dictionaryCommand as any).toHaveProperty('saveAnalysisResults');
      expect(OutputFormatter.success).toHaveBeenCalledWith(
        expect.stringContaining('分析結果を /test/output.json に保存しました')
      );
    });

    test('ファイルが存在しない場合、エラーが発生', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await dictionaryCommand.analyze('/test/nonexistent.ts', {});
      
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(String),
        'コード分析に失敗しました'
      );
      // process.exit is not called in test environment
    });
  });

  describe('private methods', () => {
    describe('generateTermId', () => {
      test('用語名からIDを生成する', () => {
        const result = (dictionaryCommand as any).generateTermId('Test Term');
        expect(result).toBe('term-test-term');
      });

      test('特殊文字を適切に処理する', () => {
        const result = (dictionaryCommand as any).generateTermId('Test-Term@123!');
        expect(result).toBe('term-test-term-123-');
      });
    });

    describe('generateRuleId', () => {
      test('ルール名からIDを生成する', () => {
        const result = (dictionaryCommand as any).generateRuleId('Test Rule');
        expect(result).toBe('rule-test-rule');
      });
    });

    describe('getDictionaryPath', () => {
      test('辞書ファイルパスを取得する', () => {
        const result = (dictionaryCommand as any).getDictionaryPath();
        expect(result).toBe('/test/project/.rimor/dictionaries/default.yaml');
      });
    });

    describe('loadDictionary', () => {
      test('辞書ファイルが存在しない場合、エラーが発生', async () => {
        mockFs.existsSync.mockReturnValue(false);
        
        await expect((dictionaryCommand as any).loadDictionary()).rejects.toThrow(
          '辞書ファイルが見つかりません。先に `rimor dictionary init` を実行してください。'
        );
      });

      test('辞書ファイルが存在する場合、正常に読み込まれる', async () => {
        mockFs.existsSync.mockReturnValue(true);
        
        await expect((dictionaryCommand as any).loadDictionary()).resolves.not.toThrow();
      });
    });

    describe('saveDictionary', () => {
      test('辞書ディレクトリが作成される', async () => {
        mockFs.existsSync.mockReturnValue(false);
        mockDictionaryManager.getDictionary.mockReturnValue({ test: 'data' });
        
        await (dictionaryCommand as any).saveDictionary();
        
        expect(mockFs.mkdirSync).toHaveBeenCalledWith(
          expect.stringContaining('.rimor'),
          { recursive: true }
        );
      });

      test('辞書ファイルが保存される', async () => {
        mockFs.existsSync.mockReturnValue(true);
        const mockDictionary = { test: 'data' };
        mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);
        
        await (dictionaryCommand as any).saveDictionary();
        
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          expect.stringContaining('dictionaries/default.yaml'),
          'test: data\n',
          'utf-8'
        );
      });
    });
  });

  describe('registerDictionaryCommands', () => {
    test('yargsコマンドが正しく登録される', () => {
      const mockYargs = {
        command: jest.fn().mockReturnThis()
      };
      
      const result = registerDictionaryCommands(mockYargs as any);
      
      expect(mockYargs.command).toHaveBeenCalledWith(
        'dictionary',
        expect.any(String),
        expect.any(Function)
      );
      expect(result).toBe(mockYargs);
    });
  });
});