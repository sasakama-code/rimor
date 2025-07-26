import { ContextualScorer } from '../../../src/dictionary/context/scorer';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('ContextualScorer', () => {
  const mockTerm = {
    id: 'term1',
    term: 'TestTerm',
    definition: 'Test definition',
    importance: 'critical' as const,
    category: 'business' as const,
    aliases: ['test', 'testing'],
    relatedPatterns: ['test.*', '.*Test'],
    examples: [
      { code: 'function testExample() {}', description: 'Test example' }
    ],
    testRequirements: ['Unit test required']
  };

  const mockCodeContext = {
    filePath: '/test/file.ts',
    language: 'typescript',
    functions: [
      { 
        name: 'testFunction', 
        complexity: 5, 
        returnType: 'string',
        parameters: ['param1', 'param2'],
        location: { file: '/test/file.ts', line: 1, column: 1 }
      }
    ],
    classes: [
      { 
        name: 'TestClass', 
        methods: ['testMethod'], 
        properties: ['testProperty'],
        location: { file: '/test/file.ts', line: 10, column: 1 }
      }
    ],
    imports: [
      { module: 'test-utils', path: './test-utils', type: 'named' as const, imports: ['util1'] }
    ],
    domainRelevance: 0.8,
    relatedTerms: [mockTerm]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAdvancedTermRelevance', () => {
    test('用語が直接出現する場合、高い関連度を返す', () => {
      const code = 'function testFunction() { const TestTerm = "value"; }';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(code, mockTerm);
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.directMatch).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('エイリアスが出現する場合、関連度に反映される', () => {
      const code = 'function processTest() { const test = getValue(); }';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(code, mockTerm);
      
      expect(result.breakdown.aliasMatch).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    test('パターンマッチがある場合、関連度に反映される', () => {
      const code = 'function testValidator() { return validateTest(); }';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(code, mockTerm);
      
      expect(result.breakdown.patternMatch).toBeGreaterThan(0);
    });

    test('コンテキストが提供される場合、文脈マッチが計算される', () => {
      const code = 'function testFunction() {}';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(
        code, 
        mockTerm, 
        mockCodeContext
      );
      
      expect(result.breakdown.contextualMatch).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    test('関連性が低い場合、低いスコアを返す', () => {
      const code = 'function unrelatedFunction() { return 42; }';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(code, mockTerm);
      
      expect(result.score).toBeLessThan(0.3);
    });

    test('空のコードで0のスコアを返す', () => {
      const code = '';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(code, mockTerm);
      
      expect(result.score).toBe(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateRuleApplicabilityScore', () => {
    const mockRule = {
      id: 'rule1',
      name: 'Test Rule',
      description: 'Test rule description',
      domain: 'test-domain',
      condition: {
        type: 'function-name' as const,
        pattern: 'test.*',
        scope: 'function' as const
      },
      priority: 5,
      requirements: []
    };

    test('ルールに一致するコンテキストで高いスコアを返す', () => {
      const result = ContextualScorer.calculateRuleApplicabilityScore(
        mockCodeContext,
        mockRule
      );
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.applicabilityFactors).toBeDefined();
      expect(result.applicabilityReason).toBeDefined();
    });

    test('ルールに一致しないコンテキストで低いスコアを返す', () => {
      const unrelatedContext = {
        ...mockCodeContext,
        functions: [{ 
          name: 'unrelatedFunction', 
          complexity: 1, 
          returnType: 'void',
          parameters: [],
          location: { file: '/test/file.ts', line: 20, column: 1 }
        }]
      };
      
      const result = ContextualScorer.calculateRuleApplicabilityScore(
        unrelatedContext,
        mockRule
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.applicabilityFactors).toBeDefined();
    });

    test('異なるルールタイプで適切に処理される', () => {
      const codePatternRule = {
        ...mockRule,
        condition: {
          type: 'code-pattern' as const,
          pattern: 'test.*',
          scope: 'file' as const
        }
      };
      
      const result = ContextualScorer.calculateRuleApplicabilityScore(
        mockCodeContext,
        codePatternRule
      );
      
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('rankTermsByRelevance', () => {
    const mockTerms = [
      {
        ...mockTerm,
        term: 'UserService',
        testRequirements: []
      },
      {
        id: 'term2',
        term: 'PaymentService',
        definition: 'Payment processing service',
        importance: 'high' as const,
        category: 'financial' as const,
        aliases: ['payment'],
        relatedPatterns: ['payment.*'],
        examples: [],
        testRequirements: []
      }
    ];

    test('関連度順に用語がランク付けされる', () => {
      const code = 'function testFunction() { const TestTerm = "value"; }';
      
      const result = ContextualScorer.rankTermsByRelevance(code, mockTerms);
      
      expect(result.length).toBeGreaterThan(0);
      // より関連度の高い用語が最初に来る
      if (result.length > 1) {
        expect(result[0].relevanceScore).toBeGreaterThanOrEqual(result[1].relevanceScore);
      }
    });

    test('関連度の低い用語は除外される', () => {
      const code = 'function unrelatedFunction() { return Math.random(); }';
      
      const result = ContextualScorer.rankTermsByRelevance(code, mockTerms);
      
      // 関連度0.1以下の用語は除外される
      result.forEach(item => {
        expect(item.relevanceScore).toBeGreaterThan(0.1);
      });
    });

    test('複数の用語が適切にスコアリングされる', () => {
      const code = 'function processPayment() { const TestTerm = payment; }';
      
      const result = ContextualScorer.rankTermsByRelevance(code, mockTerms);
      
      expect(result.length).toBeGreaterThan(0);
      result.forEach(item => {
        expect(item.term).toBeDefined();
        expect(item.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(item.confidence).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('不正な用語でエラーハンドリングされる', () => {
      const invalidTerm = null;
      const code = 'function test() {}';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(
        code, 
        invalidTerm as any
      );
      
      expect(result.score).toBe(0);
      expect(result.confidence).toBe(0);
    });

    test('不正なコードでエラーハンドリングされる', () => {
      const code = null;
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(
        code as any, 
        mockTerm
      );
      
      expect(result.score).toBe(0);
    });
  });

  describe('統合テスト', () => {
    test('複数の計算メソッドが連携して動作する', () => {
      const code = `
        function testFunction() {
          const TestTerm = new TestService();
          return TestTerm.process();
        }
        
        class TestClass {
          test() {
            return "testing";
          }
        }
      `;
      
      const termResult = ContextualScorer.calculateAdvancedTermRelevance(
        code, 
        mockTerm, 
        mockCodeContext
      );
      
      expect(termResult.score).toBeGreaterThan(0);
      expect(termResult.breakdown.directMatch).toBeGreaterThan(0);
      expect(termResult.breakdown.aliasMatch).toBeGreaterThan(0);
      expect(termResult.confidence).toBeGreaterThan(0.5);
    });

    test('スコアが適切な範囲内に収まる', () => {
      const code = 'function testFunction() { const TestTerm = "value"; }';
      
      const result = ContextualScorer.calculateAdvancedTermRelevance(code, mockTerm);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});