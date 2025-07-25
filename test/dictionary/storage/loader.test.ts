import * as fs from 'fs';
import * as path from 'path';
import { DictionaryLoader } from '../../../src/dictionary/storage/loader';
import { errorHandler } from '../../../src/utils/errorHandler';
import { DomainDictionary } from '../../../src/core/types';

// モック設定
jest.mock('fs');
jest.mock('path');
jest.mock('../../../src/utils/errorHandler');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('DictionaryLoader', () => {
  const mockDictionary: DomainDictionary = {
    domain: 'test-domain',
    version: '1.0.0',
    language: 'ja',
    lastUpdated: new Date('2023-01-01'),
    terms: [
      {
        id: 'term1',
        term: 'TestTerm',
        definition: 'Test definition',
        category: 'business' as const,
        importance: 'high' as const,
        aliases: ['test'],
        examples: [{ code: 'testExample()', description: 'Test example' }],
        relatedPatterns: ['test.*'],
        testRequirements: ['should test functionality']
      }
    ],
    businessRules: [
      {
        id: 'rule1',
        name: 'TestRule',
        description: 'Test rule',
        domain: 'test-domain',
        condition: {
          type: 'function-name' as const,
          pattern: 'test.*',
          scope: 'function' as const
        },
        requirements: [{
          type: 'must-have' as const,
          description: 'Test requirement',
          testPattern: 'expect.*toBe.*'
        }],
        priority: 100
      }
    ],
    relationships: [],
    qualityStandards: [],
    contextMappings: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPath.extname.mockImplementation((filePath) => {
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return '.yaml';
      if (filePath.endsWith('.json')) return '.json';
      return '';
    });
    
    mockPath.dirname.mockImplementation((filePath) => 
      filePath.substring(0, filePath.lastIndexOf('/'))
    );
  });

  describe('loadFromFile', () => {
    test('YAMLファイルが正常に読み込まれる', async () => {
      const yamlContent = `
domain: test-domain
version: "1.0.0"
language: ja
terms:
  - id: term1
    term: TestTerm
    definition: Test definition
    category: business
    importance: high
    aliases: [test]
businessRules:
  - id: rule1
    name: TestRule
    description: Test rule
`;
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);
      
      const result = await DictionaryLoader.loadFromFile('/test/dictionary.yaml');
      
      expect(result).toBeDefined();
      expect(result?.domain).toBe('test-domain');
      expect(result?.terms).toHaveLength(1);
      expect(result?.businessRules).toHaveLength(1);
    });

    test('JSONファイルが正常に読み込まれる', async () => {
      const jsonContent = JSON.stringify(mockDictionary);
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(jsonContent);
      
      const result = await DictionaryLoader.loadFromFile('/test/dictionary.json');
      
      expect(result).toBeDefined();
      expect(result?.domain).toBe('test-domain');
      expect(result?.terms).toHaveLength(1);
    });

    test('ファイルが存在しない場合、nullを返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await DictionaryLoader.loadFromFile('/test/nonexistent.yaml');
      
      expect(result).toBeNull();
    });

    test('不正なYAMLでエラーハンドリングされる', async () => {
      const invalidYaml = 'invalid: yaml: content: [unclosed';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(invalidYaml);
      
      const result = await DictionaryLoader.loadFromFile('/test/invalid.yaml');
      
      expect(result).toBeNull();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('不正なJSONでエラーハンドリングされる', async () => {
      const invalidJson = '{ invalid json }';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(invalidJson);
      
      const result = await DictionaryLoader.loadFromFile('/test/invalid.json');
      
      expect(result).toBeNull();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('サポートされていない拡張子でnullを返す', async () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const result = await DictionaryLoader.loadFromFile('/test/dictionary.txt');
      
      expect(result).toBeNull();
    });
  });

  describe('saveToFile', () => {
    test('YAMLファイルが正常に保存される', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      await DictionaryLoader.saveToFile(mockDictionary, '/test/dictionary.yaml');
      
      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/dictionary.yaml',
        expect.stringContaining('domain: test-domain'),
        'utf-8'
      );
    });

    test('JSONファイルが正常に保存される', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation();
      
      await DictionaryLoader.saveToFile(mockDictionary, '/test/dictionary.json');
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/dictionary.json',
        JSON.stringify(mockDictionary, null, 2),
        'utf-8'
      );
    });

    test('ディレクトリが存在しない場合、作成される', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
      
      await DictionaryLoader.saveToFile(mockDictionary, '/test/subdir/dictionary.yaml');
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        '/test/subdir',
        { recursive: true }
      );
    });

    test('保存エラーが適切にハンドリングされる', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      await expect(
        DictionaryLoader.saveToFile(mockDictionary, '/test/dictionary.yaml')
      ).rejects.toThrow('Write failed');
      
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('サポートされていない拡張子でエラーが発生する', async () => {
      await expect(
        DictionaryLoader.saveToFile(mockDictionary, '/test/dictionary.txt')
      ).rejects.toThrow('サポートされていないファイル形式');
    });
  });

  describe('loadFromDirectory', () => {
    test('ディレクトリから複数の辞書が読み込まれる', async () => {
      const mockFiles = ['dict1.yaml', 'dict2.json', 'other.txt'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any);
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('dict1.yaml')) {
          return 'domain: domain1\nversion: "1.0.0"\nterms: []\nbusinessRules: []';
        }
        if (filePath.toString().includes('dict2.json')) {
          return JSON.stringify({
            domain: 'domain2',
            version: '1.0.0',
            terms: [],
            businessRules: []
          });
        }
        return '';
      });
      
      const result = await DictionaryLoader.loadFromDirectory('/test/dictionaries');
      
      expect(result).toHaveLength(2);
      expect(result[0].domain).toBe('domain1');
      expect(result[1].domain).toBe('domain2');
    });

    test('ディレクトリが存在しない場合、空配列を返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await DictionaryLoader.loadFromDirectory('/test/nonexistent');
      
      expect(result).toEqual([]);
    });

    test('サブディレクトリが再帰的に処理される', async () => {
      const mockFiles = ['dict1.yaml', 'subdir'];
      const mockSubFiles = ['dict2.yaml'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation((dirPath) => {
        if (dirPath.toString().includes('subdir')) {
          return mockSubFiles as any;
        }
        return mockFiles as any;
      });
      mockFs.statSync.mockImplementation((filePath) => {
        const isDirectory = filePath.toString().endsWith('subdir');
        return { 
          isFile: () => !isDirectory,
          isDirectory: () => isDirectory
        } as any;
      });
      mockFs.readFileSync.mockReturnValue('domain: test\nversion: "1.0.0"\nterms: []\nbusinessRules: []');
      
      const result = await DictionaryLoader.loadFromDirectory('/test/dictionaries', { recursive: true });
      
      expect(result).toHaveLength(2);
    });
  });

  describe('validateDictionary', () => {
    test('有効な辞書で検証が成功する', () => {
      const result = DictionaryLoader.validateDictionary(mockDictionary);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('ドメインが不正な場合、検証エラーが発生する', () => {
      const invalidDictionary = { ...mockDictionary, domain: '' };
      
      const result = DictionaryLoader.validateDictionary(invalidDictionary);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ドメインが不正です');
    });

    test('バージョンが不正な場合、検証エラーが発生する', () => {
      const invalidDictionary = { ...mockDictionary, version: '' };
      
      const result = DictionaryLoader.validateDictionary(invalidDictionary);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('バージョンが不正です');
    });

    test('用語配列が不正な場合、検証エラーが発生する', () => {
      const invalidDictionary = { ...mockDictionary, terms: null };
      
      const result = DictionaryLoader.validateDictionary(invalidDictionary as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('用語'))).toBe(true);
    });

    test('ビジネスルール配列が不正な場合、検証エラーが発生する', () => {
      const invalidDictionary = { ...mockDictionary, businessRules: null };
      
      const result = DictionaryLoader.validateDictionary(invalidDictionary as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('ビジネスルール'))).toBe(true);
    });
  });

  describe('mergeDictionaries', () => {
    const primaryDict: DomainDictionary = {
      domain: 'primary',
      version: '1.0.0',
      language: 'ja',
      lastUpdated: new Date('2023-01-01'),
      terms: [
        {
          id: 'term1',
          term: 'PrimaryTerm',
          definition: 'Primary definition',
          category: 'business' as const,
          importance: 'high' as const,
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        }
      ],
      businessRules: [
        {
          id: 'rule1',
          name: 'PrimaryRule',
          description: 'Primary rule',
          domain: 'primary',
          condition: { type: 'function-name' as const, pattern: 'primary.*', scope: 'function' as const },
          requirements: [],
          priority: 100
        }
      ],
      relationships: [],
      qualityStandards: [],
      contextMappings: []
    };

    const secondaryDict: DomainDictionary = {
      domain: 'secondary',
      version: '1.1.0',
      language: 'ja',
      lastUpdated: new Date('2023-01-02'),
      terms: [
        {
          id: 'term2',
          term: 'SecondaryTerm',
          definition: 'Secondary definition',
          category: 'technical' as const,
          importance: 'medium' as const,
          aliases: [],
          examples: [],
          relatedPatterns: [],
          testRequirements: []
        }
      ],
      businessRules: [
        {
          id: 'rule2',
          name: 'SecondaryRule',
          description: 'Secondary rule',
          domain: 'secondary',
          condition: { type: 'code-pattern' as const, pattern: 'secondary.*', scope: 'file' as const },
          requirements: [],
          priority: 200
        }
      ],
      relationships: [],
      qualityStandards: [],
      contextMappings: []
    };

    test('辞書が正しくマージされる', () => {
      const result = DictionaryLoader.mergeDictionaries(
        primaryDict,
        secondaryDict
      );
      
      expect(result.domain).toBe('primary'); // プライマリのドメインを保持
      expect(result.terms).toHaveLength(2);
      expect(result.businessRules).toHaveLength(2);
      expect(result.terms.some(t => t.term === 'PrimaryTerm')).toBe(true);
      expect(result.terms.some(t => t.term === 'SecondaryTerm')).toBe(true);
    });

    test('重複するIDが適切に処理される', () => {
      const dictWithDuplicateId: DomainDictionary = {
        ...secondaryDict,
        terms: [
          {
            id: 'term1', // primaryDict と同じID
            term: 'DuplicateTerm',
            definition: 'Duplicate definition',
            category: 'technical' as const,
            importance: 'low' as const,
            aliases: [],
            examples: [],
            relatedPatterns: [],
            testRequirements: []
          }
        ]
      };
      
      const result = DictionaryLoader.mergeDictionaries(
        primaryDict,
        dictWithDuplicateId
      );
      
      expect(result.terms).toHaveLength(2);
      // プライマリの用語が優先される
      expect(result.terms.find(t => t.id === 'term1')?.term).toBe('PrimaryTerm');
    });

    test('バージョンが適切に更新される', () => {
      const result = DictionaryLoader.mergeDictionaries(
        primaryDict,
        secondaryDict
      );
      
      expect(result.version).toBe('1.1.0'); // より高いバージョンが採用される
    });
  });

  describe('createBackup', () => {
    test('バックアップファイルが作成される', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('original content');
      mockFs.writeFileSync.mockImplementation();
      
      const backupPath = await DictionaryLoader.createBackup('/test/dictionary.yaml');
      
      expect(backupPath).toContain('.backup');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        backupPath,
        'original content',
        'utf-8'
      );
    });

    test('元ファイルが存在しない場合、nullを返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const backupPath = await DictionaryLoader.createBackup('/test/nonexistent.yaml');
      
      expect(backupPath).toBeNull();
    });

    test('バックアップ作成エラーが適切にハンドリングされる', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('content');
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Backup failed');
      });
      
      await expect(
        DictionaryLoader.createBackup('/test/dictionary.yaml')
      ).rejects.toThrow('Backup failed');
    });
  });

  describe('listAvailableDictionaries', () => {
    test('利用可能な辞書の一覧が返される', async () => {
      const mockFiles = ['dict1.yaml', 'dict2.json', 'other.txt', 'subdir'];
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockFs.statSync.mockImplementation((filePath) => {
        const isDirectory = filePath.toString().endsWith('subdir');
        return { 
          isFile: () => !isDirectory,
          isDirectory: () => isDirectory,
          mtime: new Date('2023-01-01'),
          size: 1024
        } as any;
      });
      
      const result = await DictionaryLoader.listAvailableDictionaries('/test/dictionaries');
      
      expect(result).toHaveLength(2); // dict1.yaml と dict2.json のみ
      expect(result[0].filename).toBe('dict1.yaml');
      expect(result[1].filename).toBe('dict2.json');
      expect(result[0].lastModified).toBeDefined();
      expect(result[0].size).toBe(1024);
    });

    test('ディレクトリが存在しない場合、空配列を返す', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await DictionaryLoader.listAvailableDictionaries('/test/nonexistent');
      
      expect(result).toEqual([]);
    });
  });

  describe('エラーハンドリング', () => {
    test('ファイル読み込みエラーが適切に処理される', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      
      const result = await DictionaryLoader.loadFromFile('/test/dictionary.yaml');
      
      expect(result).toBeNull();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('不正なパラメータでエラーハンドリングされる', async () => {
      const result = await DictionaryLoader.loadFromFile('');
      
      expect(result).toBeNull();
    });

    test('保存時のディレクトリ作成エラーが処理される', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Directory creation failed');
      });
      
      await expect(
        DictionaryLoader.saveToFile(mockDictionary, '/test/subdir/dictionary.yaml')
      ).rejects.toThrow();
      
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });
});