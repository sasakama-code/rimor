import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { DictionaryBootstrap } from '../../../src/cli/bootstrap/DictionaryBootstrap';
import { DomainDictionaryManager } from '../../../src/dictionary/core/dictionary';
import { LinterKnowledgeExtractor } from '../../../src/dictionary/extractors/linter';
import { DictionaryLoader } from '../../../src/dictionary/storage/loader';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('fs');
jest.mock('path');
jest.mock('readline');
jest.mock('../../../src/dictionary/core/dictionary');
jest.mock('../../../src/dictionary/extractors/linter');
jest.mock('../../../src/dictionary/storage/loader');
jest.mock('../../../src/utils/errorHandler');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockReadline = readline as jest.Mocked<typeof readline>;
const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('DictionaryBootstrap', () => {
  let bootstrap: DictionaryBootstrap;
  let mockRl: any;
  let mockDictionaryManager: any;
  const testProjectRoot = '/test/project';
  const testConfigPath = '/test/project/.rimorrc.json';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // readlineインターフェースのモック
    mockRl = {
      question: jest.fn(),
      close: jest.fn()
    };
    
    mockReadline.createInterface.mockReturnValue(mockRl);
    
    // pathのモック
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.resolve.mockImplementation((base, relative) => `${base}/${relative}`);
    
    // DomainDictionaryManagerのモック
    mockDictionaryManager = {
      addTerm: jest.fn(),
      addBusinessRule: jest.fn(),
      getDictionary: jest.fn()
    };
    
    (DomainDictionaryManager as jest.MockedClass<typeof DomainDictionaryManager>)
      .mockImplementation(() => mockDictionaryManager);
    
    bootstrap = new DictionaryBootstrap(testProjectRoot);
  });

  afterEach(() => {
    bootstrap.close();
  });

  describe('constructor', () => {
    test('プロジェクトルートとconfigPathが正しく設定される', () => {
      expect(mockPath.join).toHaveBeenCalledWith(testProjectRoot, '.rimorrc.json');
      expect(mockReadline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout
      });
    });

    test('デフォルトでprocess.cwd()を使用する', () => {
      const processCwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/default/path');
      new DictionaryBootstrap();
      
      expect(processCwdSpy).toHaveBeenCalled();
      processCwdSpy.mockRestore();
    });
  });

  describe('checkExistingConfiguration', () => {
    test('設定ファイルが存在する場合trueを返す', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath === testConfigPath;
      });

      const result = await (bootstrap as any).checkExistingConfiguration();
      expect(result).toBe(true);
    });

    test('辞書ディレクトリが存在する場合trueを返す', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.includes('dictionaries') || filePath === testConfigPath;
      });
      mockFs.readdirSync.mockReturnValue(['test-dictionary.yaml'] as any);

      const result = await (bootstrap as any).checkExistingConfiguration();
      expect(result).toBe(true);
    });

    test('設定が存在しない場合falseを返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.readdirSync.mockReturnValue([] as any);

      const result = await (bootstrap as any).checkExistingConfiguration();
      expect(result).toBe(false);
    });
  });

  describe('collectProjectInfo', () => {
    test('プロジェクト情報を正しく収集する', async () => {
      const mockQuestions = [
        'ecommerce',     // domain
        'typescript',   // language
        'jest',         // framework
        'web'           // projectType
      ];
      
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        const answer = mockQuestions.shift() || '';
        callback(answer);
      });

      const result = await (bootstrap as any).collectProjectInfo();
      
      expect(result).toEqual({
        domain: 'ecommerce',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      });
    });

    test('デフォルト値を正しく適用する', async () => {
      const mockQuestions = [
        'financial',  // domain (必須)
        '',          // language (デフォルト: typescript)
        '',          // framework (デフォルト: jest)
        ''           // projectType (デフォルト: web)
      ];
      
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        const answer = mockQuestions.shift() || '';
        callback(answer);
      });

      const result = await (bootstrap as any).collectProjectInfo();
      
      expect(result).toEqual({
        domain: 'financial',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      });
    });
  });

  describe('selectInitializationMethod', () => {
    test('選択肢1で自動生成を返す', async () => {
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback('1');
      });

      const result = await (bootstrap as any).selectInitializationMethod();
      expect(result).toBe('auto');
    });

    test('選択肢2で手動設定を返す', async () => {
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback('2');
      });

      const result = await (bootstrap as any).selectInitializationMethod();
      expect(result).toBe('manual');
    });

    test('選択肢3でインポートを返す', async () => {
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback('3');
      });

      const result = await (bootstrap as any).selectInitializationMethod();
      expect(result).toBe('import');
    });

    test('無効な選択肢でデフォルト(auto)を返す', async () => {
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback('999');
      });

      const result = await (bootstrap as any).selectInitializationMethod();
      expect(result).toBe('auto');
    });

    test('空の選択肢でデフォルト(auto)を返す', async () => {
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback('');
      });

      const result = await (bootstrap as any).selectInitializationMethod();
      expect(result).toBe('auto');
    });
  });

  describe('autoGenerateDictionary', () => {
    const mockProjectInfo = {
      domain: 'ecommerce',
      language: 'typescript',
      framework: 'jest',
      projectType: 'web'
    };

    test('自動生成が成功する', async () => {
      const mockLinterConfigs = ['eslint.config.js', 'jest.config.js'];
      const mockExtractedKnowledge = {
        terms: [
          { id: 'term1', term: 'Product', definition: 'A product item' },
          { id: 'term2', term: 'User', definition: 'A system user' }
        ],
        rules: [
          {
            id: 'rule1',
            name: 'Test Rule',
            pattern: 'test.*',
            confidence: 0.8,
            suggestedRequirements: ['Test requirement']
          }
        ]
      };
      const mockDictionary = { 
        domain: 'ecommerce', 
        terms: mockExtractedKnowledge.terms,
        businessRules: []
      };

      (LinterKnowledgeExtractor.autoDetectConfigs as jest.Mock)
        .mockResolvedValue(mockLinterConfigs);
      (LinterKnowledgeExtractor.extractFromLinters as jest.Mock)
        .mockResolvedValue(mockExtractedKnowledge);
      mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);

      const result = await (bootstrap as any).autoGenerateDictionary(mockProjectInfo);

      expect(LinterKnowledgeExtractor.autoDetectConfigs)
        .toHaveBeenCalledWith(testProjectRoot);
      expect(LinterKnowledgeExtractor.extractFromLinters)
        .toHaveBeenCalledWith(mockLinterConfigs, expect.objectContaining({
          includeComments: true,
          includeTests: true,
          minFrequency: 2,
          maxTerms: 50
        }));
      expect(mockDictionaryManager.addTerm).toHaveBeenCalledTimes(2);
      expect(mockDictionaryManager.addBusinessRule).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockDictionary);
    });

    test('自動生成が失敗した場合、基本辞書を作成する', async () => {
      (LinterKnowledgeExtractor.autoDetectConfigs as jest.Mock)
        .mockRejectedValue(new Error('Auto detection failed'));
      
      const mockBasicDictionary = { domain: 'ecommerce', terms: [], businessRules: [] };
      jest.spyOn(bootstrap as any, 'createBasicDictionary')
        .mockReturnValue(mockBasicDictionary);

      const result = await (bootstrap as any).autoGenerateDictionary(mockProjectInfo);

      expect(result).toBe(mockBasicDictionary);
    });
  });

  describe('manualDictionarySetup', () => {
    const mockProjectInfo = {
      domain: 'financial',
      language: 'typescript',
      framework: 'jest',
      projectType: 'api'
    };

    test('手動で用語を追加できる', async () => {
      const mockAnswers = [
        'Transaction',      // 用語名
        'Financial transaction', // 定義
        'financial',        // カテゴリ
        'critical',         // 重要度
        'tx, trans',        // エイリアス
        'n'                 // 追加しない
      ];
      
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        const answer = mockAnswers.shift() || '';
        callback(answer);
      });

      const mockDictionary = { domain: 'financial', terms: [], businessRules: [] };
      mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);

      const result = await (bootstrap as any).manualDictionarySetup(mockProjectInfo);

      expect(mockDictionaryManager.addTerm).toHaveBeenCalledWith(
        expect.objectContaining({
          term: 'Transaction',
          definition: 'Financial transaction',
          category: 'financial',
          importance: 'critical',
          aliases: ['tx', 'trans']
        })
      );
      expect(result).toBe(mockDictionary);
    });

    test('空の用語名でスキップできる', async () => {
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback(''); // 空の用語名
      });

      const mockDictionary = { domain: 'financial', terms: [], businessRules: [] };
      mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);

      const result = await (bootstrap as any).manualDictionarySetup(mockProjectInfo);

      expect(mockDictionaryManager.addTerm).not.toHaveBeenCalled();
      expect(result).toBe(mockDictionary);
    });
  });

  describe('importExistingDictionary', () => {
    const mockProjectInfo = {
      domain: 'imported',
      language: 'typescript',
      framework: 'jest',
      projectType: 'web'
    };

    test('既存辞書のインポートが成功する', async () => {
      const dictionaryPath = './test-dictionary.yaml';
      const mockDictionary = { 
        domain: 'imported', 
        terms: [{ id: 'test-term', term: 'TestTerm', definition: 'Test definition' }],
        businessRules: []
      };

      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback(dictionaryPath);
      });
      mockFs.existsSync.mockReturnValue(true);
      (DictionaryLoader.loadFromFile as jest.Mock).mockResolvedValue(mockDictionary);

      const result = await (bootstrap as any).importExistingDictionary(mockProjectInfo);

      expect(mockPath.resolve).toHaveBeenCalledWith(testProjectRoot, dictionaryPath);
      expect(DictionaryLoader.loadFromFile).toHaveBeenCalled();
      expect(result).toBe(mockDictionary);
    });

    test('ファイルが存在しない場合、基本辞書を作成する', async () => {
      const dictionaryPath = './non-existent.yaml';
      const mockBasicDictionary = { domain: 'imported', terms: [], businessRules: [] };

      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback(dictionaryPath);
      });
      mockFs.existsSync.mockReturnValue(false);
      jest.spyOn(bootstrap as any, 'createBasicDictionary')
        .mockReturnValue(mockBasicDictionary);

      const result = await (bootstrap as any).importExistingDictionary(mockProjectInfo);

      expect(result).toBe(mockBasicDictionary);
    });

    test('辞書の読み込みが失敗した場合、基本辞書を作成する', async () => {
      const dictionaryPath = './invalid-dictionary.yaml';
      const mockBasicDictionary = { domain: 'imported', terms: [], businessRules: [] };

      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback(dictionaryPath);
      });
      mockFs.existsSync.mockReturnValue(true);
      (DictionaryLoader.loadFromFile as jest.Mock).mockResolvedValue(null);
      jest.spyOn(bootstrap as any, 'createBasicDictionary')
        .mockReturnValue(mockBasicDictionary);

      const result = await (bootstrap as any).importExistingDictionary(mockProjectInfo);

      expect(result).toBe(mockBasicDictionary);
    });
  });

  describe('createBasicDictionary', () => {
    test('基本辞書を作成する', () => {
      const mockProjectInfo = { domain: 'ecommerce' };
      const mockDictionary = { domain: 'ecommerce', terms: [], businessRules: [] };
      
      mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);
      jest.spyOn(bootstrap as any, 'getBasicTermsForDomain')
        .mockReturnValue([
          { id: 'user-basic', term: 'User', definition: 'System user' },
          { id: 'product-ecommerce', term: 'Product', definition: 'Product item' }
        ]);

      const result = (bootstrap as any).createBasicDictionary(mockProjectInfo);

      expect(mockDictionaryManager.addTerm).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockDictionary);
    });

    test('用語追加エラーを適切に処理する', () => {
      const mockProjectInfo = { domain: 'test' };
      const mockDictionary = { domain: 'test', terms: [], businessRules: [] };
      
      mockDictionaryManager.getDictionary.mockReturnValue(mockDictionary);
      mockDictionaryManager.addTerm.mockImplementation(() => {
        throw new Error('Term addition failed');
      });
      jest.spyOn(bootstrap as any, 'getBasicTermsForDomain')
        .mockReturnValue([{ id: 'test-term', term: 'TestTerm', definition: 'Test' }]);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = (bootstrap as any).createBasicDictionary(mockProjectInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('基本用語 "TestTerm" の追加に失敗しました')
      );
      expect(result).toBe(mockDictionary);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getBasicTermsForDomain', () => {
    test('ecommerceドメインの基本用語を返す', () => {
      const result = (bootstrap as any).getBasicTermsForDomain('ecommerce');
      
      expect(result).toHaveLength(3); // User + Product + Payment
      expect(result.some((term: any) => term.term === 'User')).toBe(true);
      expect(result.some((term: any) => term.term === 'Product')).toBe(true);
      expect(result.some((term: any) => term.term === 'Payment')).toBe(true);
    });

    test('financialドメインの基本用語を返す', () => {
      const result = (bootstrap as any).getBasicTermsForDomain('financial');
      
      expect(result).toHaveLength(2); // User + Transaction
      expect(result.some((term: any) => term.term === 'User')).toBe(true);
      expect(result.some((term: any) => term.term === 'Transaction')).toBe(true);
    });

    test('未知のドメインでは共通用語のみを返す', () => {
      const result = (bootstrap as any).getBasicTermsForDomain('unknown');
      
      expect(result).toHaveLength(1); // User のみ
      expect(result[0].term).toBe('User');
    });
  });

  describe('generateConfiguration', () => {
    test('設定ファイルと辞書ファイルを生成する', async () => {
      const mockProjectInfo = {
        domain: 'test',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      };
      const mockDictionary = { domain: 'test', terms: [], businessRules: [] };

      mockFs.writeFileSync.mockImplementation();
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      (DictionaryLoader.saveToFile as jest.Mock).mockResolvedValue(undefined);

      await (bootstrap as any).generateConfiguration(mockProjectInfo, mockDictionary);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('"domain": "test"'),
        'utf-8'
      );
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('dictionaries'),
        { recursive: true }
      );
      expect(DictionaryLoader.saveToFile).toHaveBeenCalled();
    });
  });

  describe('runInitialValidation', () => {
    test('辞書の検証を実行する', async () => {
      const mockDictionary = {
        domain: 'test',
        version: '1.0.0',
        terms: [{ id: 'test-term', term: 'TestTerm' }],
        businessRules: [{ id: 'test-rule', name: 'TestRule' }]
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (bootstrap as any).runInitialValidation(mockDictionary);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('用語数: 1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ルール数: 1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ドメイン: test'));
      
      consoleSpy.mockRestore();
    });

    test('用語がない場合に警告を表示する', async () => {
      const mockDictionary = {
        domain: 'test',
        version: '1.0.0',
        terms: [],
        businessRules: []
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await (bootstrap as any).runInitialValidation(mockDictionary);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('辞書に用語が含まれていません')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('askQuestion', () => {
    test('質問に対する回答を返す', async () => {
      const testQuestion = 'Test question: ';
      const testAnswer = 'Test answer';

      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        expect(question).toBe(testQuestion);
        callback(testAnswer);
      });

      const result = await (bootstrap as any).askQuestion(testQuestion);
      expect(result).toBe(testAnswer);
    });
  });

  describe('close', () => {
    test('readlineインターフェースを閉じる', () => {
      bootstrap.close();
      expect(mockRl.close).toHaveBeenCalled();
    });
  });

  describe('runBootstrap', () => {
    test('完全なブートストラップワークフローが実行される', async () => {
      // モックの設定
      jest.spyOn(bootstrap as any, 'checkExistingConfiguration').mockResolvedValue(false);
      jest.spyOn(bootstrap as any, 'collectProjectInfo').mockResolvedValue({
        domain: 'test',
        language: 'typescript',
        framework: 'jest',
        projectType: 'web'
      });
      jest.spyOn(bootstrap as any, 'selectInitializationMethod').mockResolvedValue('auto');
      jest.spyOn(bootstrap as any, 'autoGenerateDictionary').mockResolvedValue({
        domain: 'test',
        terms: [],
        businessRules: []
      });
      jest.spyOn(bootstrap as any, 'generateConfiguration').mockResolvedValue(undefined);
      jest.spyOn(bootstrap as any, 'runInitialValidation').mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bootstrap.runBootstrap();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ ブートストラップが完了しました！')
      );
      expect(mockRl.close).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('既存設定がある場合の上書き確認', async () => {
      jest.spyOn(bootstrap as any, 'checkExistingConfiguration').mockResolvedValue(true);
      mockRl.question.mockImplementation((question: string, callback: (answer: string) => void) => {
        callback('n'); // 上書きしない
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bootstrap.runBootstrap();

      expect(consoleSpy).toHaveBeenCalledWith('ブートストラップを中止しました。');
      
      consoleSpy.mockRestore();
    });

    test('エラーが発生した場合の処理', async () => {
      const testError = new Error('Bootstrap error');
      jest.spyOn(bootstrap as any, 'checkExistingConfiguration').mockRejectedValue(testError);

      await expect(bootstrap.runBootstrap()).rejects.toThrow('Bootstrap error');
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        testError,
        expect.any(String),
        'ブートストラップ中にエラーが発生しました'
      );
      expect(mockRl.close).toHaveBeenCalled();
    });
  });
});