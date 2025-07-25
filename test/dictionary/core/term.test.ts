import { DomainTermManager } from '../../../src/dictionary/core/term';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('DomainTermManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTerm', () => {
    const validParams = {
      id: 'test-term-1',
      term: 'TestTerm',
      definition: 'This is a test term',
      category: 'business' as const,
      importance: 'high' as const,
      aliases: ['test', 'testing'],
      examples: [
        { code: 'const test = new TestTerm();', description: 'Usage example' }
      ],
      relatedPatterns: ['test.*', '.*Test'],
      testRequirements: ['Unit test required']
    };

    test('有効なパラメータで用語が正常に作成される', () => {
      const term = DomainTermManager.createTerm(validParams);
      
      expect(term.id).toBe('test-term-1');
      expect(term.term).toBe('TestTerm');
      expect(term.definition).toBe('This is a test term');
      expect(term.category).toBe('business');
      expect(term.importance).toBe('high');
      expect(term.aliases).toEqual(['test', 'testing']);
      expect(term.examples).toHaveLength(1);
      expect(term.relatedPatterns).toEqual(['test.*', '.*Test']);
      expect(term.testRequirements).toEqual(['Unit test required']);
    });

    test('必須フィールドが未指定の場合、エラーが発生する', () => {
      const invalidParams = { ...validParams, term: '' };
      
      expect(() => {
        DomainTermManager.createTerm(invalidParams);
      }).toThrow('必須フィールドが不足しています');
    });

    test('デフォルト値が正しく設定される', () => {
      const minimalParams = {
        id: 'test-term-1',
        term: 'TestTerm',
        definition: 'This is a test term'
      };
      
      const term = DomainTermManager.createTerm(minimalParams);
      
      expect(term.category).toBe('other');
      expect(term.importance).toBe('medium');
      expect(term.aliases).toEqual([]);
      expect(term.examples).toEqual([]);
      expect(term.relatedPatterns).toEqual([]);
      expect(term.testRequirements).toEqual([]);
    });

    test('自動生成IDが正しく設定される', () => {
      const paramsWithoutId = {
        term: 'TestTerm',
        definition: 'This is a test term'
      };
      
      const term = DomainTermManager.createTerm(paramsWithoutId);
      
      expect(term.id).toBe('testterm');
    });

    test('カスタムメタデータが正しく設定される', () => {
      const paramsWithMetadata = {
        ...validParams,
        metadata: {
          source: 'user-input',
          confidence: 0.9,
          lastUpdated: new Date('2023-01-01')
        }
      };
      
      const term = DomainTermManager.createTerm(paramsWithMetadata);
      
      expect(term.metadata?.source).toBe('user-input');
      expect(term.metadata?.confidence).toBe(0.9);
    });
  });

  describe('validateTerm', () => {
    const validTerm = {
      id: 'test-term-1',
      term: 'TestTerm',
      definition: 'This is a test term',
      category: 'business' as const,
      importance: 'high' as const,
      aliases: ['test'],
      examples: [],
      relatedPatterns: [],
      testRequirements: []
    };

    test('有効な用語で検証が成功する', () => {
      const result = DomainTermManager.validateTerm(validTerm);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('用語名が空の場合、検証エラーが発生する', () => {
      const invalidTerm = { ...validTerm, term: '' };
      
      const result = DomainTermManager.validateTerm(invalidTerm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('用語名が不正です');
    });

    test('定義が空の場合、検証エラーが発生する', () => {
      const invalidTerm = { ...validTerm, definition: '' };
      
      const result = DomainTermManager.validateTerm(invalidTerm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('定義が不正です');
    });

    test('不正なカテゴリで検証エラーが発生する', () => {
      const invalidTerm = { ...validTerm, category: 'invalid' as any };
      
      const result = DomainTermManager.validateTerm(invalidTerm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('カテゴリ'))).toBe(true);
    });

    test('不正な重要度で検証エラーが発生する', () => {
      const invalidTerm = { ...validTerm, importance: 'invalid' as any };
      
      const result = DomainTermManager.validateTerm(invalidTerm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('重要度'))).toBe(true);
    });
  });

  describe('findSimilarTerms', () => {
    const terms = [
      { id: '1', term: 'UserService', definition: 'Service for users', category: 'technical' as const, importance: 'high' as const, aliases: [], examples: [], relatedPatterns: [], testRequirements: [] },
      { id: '2', term: 'User', definition: 'A user entity', category: 'business' as const, importance: 'critical' as const, aliases: [], examples: [], relatedPatterns: [], testRequirements: [] },
      { id: '3', term: 'TestService', definition: 'Service for testing', category: 'technical' as const, importance: 'medium' as const, aliases: [], examples: [], relatedPatterns: [], testRequirements: [] }
    ];

    test('類似用語が正しく検索される', () => {
      const query = 'user';
      
      const results = DomainTermManager.findSimilarTerms(query, terms);
      
      expect(results).toHaveLength(2);
      expect(results[0].term.term).toBe('User'); // より関連度が高い
      expect(results[1].term.term).toBe('UserService');
    });

    test('完全一致が最も高い関連度を持つ', () => {
      const query = 'User';
      
      const results = DomainTermManager.findSimilarTerms(query, terms);
      
      expect(results[0].term.term).toBe('User');
      expect(results[0].relevance).toBeGreaterThan(0.9);
    });

    test('関連度の低い用語は除外される', () => {
      const query = 'database';
      
      const results = DomainTermManager.findSimilarTerms(query, terms);
      
      expect(results).toHaveLength(0);
    });

    test('エイリアスも検索対象になる', () => {
      const termsWithAliases = [
        { ...terms[0], aliases: ['userSvc', 'usr-service'] }
      ];
      
      const results = DomainTermManager.findSimilarTerms('userSvc', termsWithAliases);
      
      expect(results).toHaveLength(1);
      expect(results[0].term.term).toBe('UserService');
    });
  });

  describe('categorizeByDomain', () => {
    const terms = [
      { id: '1', term: 'Payment', definition: 'Payment processing', category: 'financial' as const, importance: 'critical' as const, aliases: [], examples: [], relatedPatterns: [], testRequirements: [] },
      { id: '2', term: 'User', definition: 'A user entity', category: 'business' as const, importance: 'high' as const, aliases: [], examples: [], relatedPatterns: [], testRequirements: [] },
      { id: '3', term: 'Logger', definition: 'Logging utility', category: 'technical' as const, importance: 'medium' as const, aliases: [], examples: [], relatedPatterns: [], testRequirements: [] }
    ];

    test('ドメイン別に用語が正しく分類される', () => {
      const categorized = DomainTermManager.categorizeByDomain(terms);
      
      expect(categorized.financial).toHaveLength(1);
      expect(categorized.business).toHaveLength(1);
      expect(categorized.technical).toHaveLength(1);
      expect(categorized.financial[0].term).toBe('Payment');
    });

    test('空の配列で空のカテゴリを返す', () => {
      const categorized = DomainTermManager.categorizeByDomain([]);
      
      expect(Object.keys(categorized)).toHaveLength(0);
    });
  });

  describe('generateRelatedPatterns', () => {
    test('用語から関連パターンが生成される', () => {
      const term = 'UserService';
      
      const patterns = DomainTermManager.generateRelatedPatterns(term);
      
      expect(patterns).toContain('UserService');
      expect(patterns).toContain('userService');
      expect(patterns).toContain('user_service');
      expect(patterns.some(p => p.includes('User.*Service'))).toBe(true);
    });

    test('エイリアスからもパターンが生成される', () => {
      const term = 'UserService';
      const aliases = ['userSvc', 'usr-service'];
      
      const patterns = DomainTermManager.generateRelatedPatterns(term, aliases);
      
      expect(patterns.some(p => p.includes('userSvc'))).toBe(true);
      expect(patterns.some(p => p.includes('usr-service'))).toBe(true);
    });

    test('空の用語でエラーハンドリングされる', () => {
      const patterns = DomainTermManager.generateRelatedPatterns('');
      
      expect(patterns).toEqual([]);
    });
  });

  describe('mergeTerms', () => {
    const primaryTerm = {
      id: 'primary',
      term: 'UserService',
      definition: 'Primary definition',
      category: 'technical' as const,
      importance: 'high' as const,
      aliases: ['userSvc'],
      examples: [{ code: 'primary example', description: 'Primary' }],
      relatedPatterns: ['user.*'],
      testRequirements: ['primary test']
    };

    const secondaryTerm = {
      id: 'secondary',
      term: 'UserService',
      definition: 'Secondary definition',
      category: 'business' as const,
      importance: 'critical' as const,
      aliases: ['usr-service'],
      examples: [{ code: 'secondary example', description: 'Secondary' }],
      relatedPatterns: ['.*service'],
      testRequirements: ['secondary test']
    };

    test('用語が正しくマージされる', () => {
      const merged = DomainTermManager.mergeTerms(primaryTerm, secondaryTerm);
      
      expect(merged.term).toBe('UserService');
      expect(merged.definition).toBe('Primary definition'); // プライマリを優先
      expect(merged.importance).toBe('critical'); // より高い重要度を採用
      expect(merged.aliases).toContain('userSvc');
      expect(merged.aliases).toContain('usr-service');
      expect(merged.examples).toHaveLength(2);
      expect(merged.relatedPatterns).toContain('user.*');
      expect(merged.relatedPatterns).toContain('.*service');
    });

    test('重複要素が除去される', () => {
      const termWithDuplicates = {
        ...secondaryTerm,
        aliases: ['userSvc', 'duplicate'] // userSvc は重複
      };
      
      const merged = DomainTermManager.mergeTerms(primaryTerm, termWithDuplicates);
      
      const uniqueAliases = [...new Set(merged.aliases)];
      expect(merged.aliases).toHaveLength(uniqueAliases.length);
    });
  });

  describe('calculateTermComplexity', () => {
    test('複雑な用語で高いスコアを返す', () => {
      const complexTerm = {
        id: 'complex',
        term: 'AdvancedUserServiceManager',
        definition: 'A very complex service that manages multiple aspects of user interaction',
        category: 'technical' as const,
        importance: 'critical' as const,
        aliases: ['userMgr', 'advUserSvc', 'user-manager'],
        examples: [
          { code: 'const mgr = new AdvancedUserServiceManager();', description: 'Creation' },
          { code: 'mgr.processUser(user);', description: 'Processing' }
        ],
        relatedPatterns: ['user.*manager', '.*service.*manager'],
        testRequirements: ['Unit tests', 'Integration tests', 'Performance tests']
      };
      
      const complexity = DomainTermManager.calculateTermComplexity(complexTerm);
      
      expect(complexity.overall).toBeGreaterThan(60);
      expect(complexity.breakdown.conceptual).toBeGreaterThan(0);
      expect(complexity.breakdown.relational).toBeGreaterThan(0);
    });

    test('シンプルな用語で低いスコアを返す', () => {
      const simpleTerm = {
        id: 'simple',
        term: 'User',
        definition: 'A user',
        category: 'business' as const,
        importance: 'medium' as const,
        aliases: [],
        examples: [],
        relatedPatterns: [],
        testRequirements: []
      };
      
      const complexity = DomainTermManager.calculateTermComplexity(simpleTerm);
      
      expect(complexity.overall).toBeLessThan(30);
    });
  });

  describe('エラーハンドリング', () => {
    test('不正なパラメータでエラーハンドリングされる', () => {
      expect(() => {
        DomainTermManager.createTerm(null as any);
      }).toThrow();
    });

    test('検証エラーが適切に処理される', () => {
      const invalidTerm = {
        id: 'test',
        term: '',
        definition: '',
        category: 'invalid' as any,
        importance: 'invalid' as any,
        aliases: [],
        examples: [],
        relatedPatterns: [],
        testRequirements: []
      };
      
      const result = DomainTermManager.validateTerm(invalidTerm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});