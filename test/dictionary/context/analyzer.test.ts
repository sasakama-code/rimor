import { ContextAnalyzer } from '../../../src/dictionary/context/analyzer';
import { ContextEngine } from '../../../src/dictionary/context/engine';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/dictionary/context/engine');
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('ContextAnalyzer', () => {
  let analyzer: ContextAnalyzer;
  let mockContextEngine: any;

  const mockDictionary = {
    domain: 'test-domain',
    version: '1.0.0',
    language: 'ja',
    lastUpdated: new Date('2025-01-01'),
    terms: [
      {
        id: 'term1',
        term: 'TestTerm',
        definition: 'Test definition',
        importance: 'critical' as const,
        category: 'business',
        aliases: ['test', 'testing'],
        relatedPatterns: ['test.*', '.*Test'],
        examples: [
          { code: 'function testExample() {}', description: 'Test example' }
        ],
        testRequirements: ['should test functionality']
      },
      {
        id: 'term2',
        term: 'UserService',
        definition: 'User service',
        importance: 'high' as const,
        category: 'technical',
        aliases: ['user'],
        relatedPatterns: ['user.*'],
        examples: [],
        testRequirements: ['should handle user operations']
      }
    ],
    relationships: [],
    businessRules: [
      {
        id: 'rule1',
        name: 'Test Rule',
        description: 'Test rule description',
        domain: 'test-domain',
        condition: {
          type: 'function-name' as const,
          pattern: 'test.*',
          scope: 'function' as const
        },
        requirements: [{
          type: 'must-have' as const,
          description: 'Test functions must have proper assertions',
          testPattern: 'expect.*toBe.*'
        }],
        priority: 5
      },
      {
        id: 'rule2',
        name: 'User Rule',
        description: 'User rule description',
        domain: 'test-domain',
        condition: {
          type: 'code-pattern' as const,
          pattern: 'user.*',
          scope: 'file' as const
        },
        requirements: [{
          type: 'should-have' as const,
          description: 'User services should have error handling tests',
          testPattern: 'catch.*error.*'
        }],
        priority: 10
      }
    ],
    qualityStandards: [],
    contextMappings: []
  };

  const mockCodeContext = {
    filePath: '/test/file.ts',
    language: 'typescript',
    functions: [
      { name: 'testFunction', complexity: 5, returnType: 'string' },
      { name: 'userService', complexity: 8, returnType: 'User' }
    ],
    classes: ['TestClass', 'UserController'],
    imports: [
      { module: 'express', path: 'express' },
      { module: 'user-service', path: './user-service' }
    ],
    domainRelevance: 0.8,
    relatedTerms: mockDictionary.terms
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // ContextEngineのモック
    mockContextEngine = {
      analyzeContext: jest.fn(),
      calculateRelevance: jest.fn(),
      inferRequiredTests: jest.fn()
    };
    
    (ContextEngine as jest.MockedClass<typeof ContextEngine>)
      .mockImplementation(() => mockContextEngine);
    
    analyzer = new ContextAnalyzer(mockDictionary);
  });

  describe('constructor', () => {
    test('ContextEngineが正しく初期化される', () => {
      expect(ContextEngine).toHaveBeenCalledWith(mockDictionary);
    });
  });

  describe('performContextualAnalysis', () => {
    const testCode = `
      function testFunction() {
        const userService = new UserService();
        return userService.getUser();
      }
      
      class TestClass {
        test() {
          return 'test';
        }
      }
    `;

    beforeEach(() => {
      mockContextEngine.analyzeContext.mockResolvedValue(mockCodeContext);
      mockContextEngine.calculateRelevance.mockReturnValue(0.9);
      mockContextEngine.inferRequiredTests.mockReturnValue([
        {
          type: 'must-have',
          description: 'Test user service functionality',
          rationale: 'Critical business logic'
        }
      ]);
    });

    test('完全な文脈分析が正常に実行される', async () => {
      const result = await analyzer.performContextualAnalysis(
        testCode,
        '/test/file.ts',
        mockDictionary
      );

      expect(result.context).toBe(mockCodeContext);
      expect(result.relevantTerms).toBeDefined();
      expect(result.applicableRules).toBeDefined();
      expect(result.requiredTests).toBeDefined();
      expect(result.qualityScore).toBeGreaterThan(0);
      expect(mockContextEngine.analyzeContext).toHaveBeenCalledWith(
        testCode,
        '/test/file.ts',
        mockDictionary
      );
    });

    test('関連用語の分析が実行される', async () => {
      const result = await analyzer.performContextualAnalysis(
        testCode,
        '/test/file.ts',
        mockDictionary
      );

      expect(result.relevantTerms).toHaveLength(2); // mockDictionary.terms.length
      expect(mockContextEngine.calculateRelevance).toHaveBeenCalledTimes(2);
    });

    test('適用可能なルールが特定される', async () => {
      const result = await analyzer.performContextualAnalysis(
        testCode,
        '/test/file.ts',
        mockDictionary
      );

      expect(result.applicableRules).toHaveLength(1); // 'test.*' pattern matches testFunction
      expect(result.applicableRules[0].name).toBe('Test Rule');
    });

    test('必要なテストが推論される', async () => {
      const result = await analyzer.performContextualAnalysis(
        testCode,
        '/test/file.ts',
        mockDictionary
      );

      expect(result.requiredTests).toHaveLength(1);
      expect(result.requiredTests[0].type).toBe('must-have');
      expect(mockContextEngine.inferRequiredTests).toHaveBeenCalled();
    });

    test('エラーが発生した場合、空の分析結果を返す', async () => {
      mockContextEngine.analyzeContext.mockRejectedValue(new Error('Analysis failed'));
      
      const result = await analyzer.performContextualAnalysis(
        testCode,
        '/test/file.ts',
        mockDictionary
      );

      expect(result.context.filePath).toBe('/test/file.ts');
      expect(result.relevantTerms).toHaveLength(0);
      expect(result.applicableRules).toHaveLength(0);
      expect(result.requiredTests).toHaveLength(0);
      expect(result.qualityScore).toBe(0);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('analyzeTermRelevance', () => {
    const testCode = 'function testFunction() { const user = new UserService(); }';

    beforeEach(() => {
      mockContextEngine.calculateRelevance.mockImplementation((code: string, term: any) => {
        if (term.term === 'TestTerm') return 0.9;
        if (term.term === 'UserService') return 0.7;
        return 0;
      });
    });

    test('関連度の高い用語が正しく分析される', async () => {
      const result = await analyzer.analyzeTermRelevance(testCode, mockDictionary.terms as any);

      expect(result).toHaveLength(2);
      expect(result[0].term.term).toBe('TestTerm'); // 関連度でソートされている
      expect(result[0].relevance).toBe(0.9);
      expect(result[1].term.term).toBe('UserService');
      expect(result[1].relevance).toBe(0.7);
    });

    test('関連度が0の用語は除外される', async () => {
      mockContextEngine.calculateRelevance.mockReturnValue(0);
      
      const result = await analyzer.analyzeTermRelevance(testCode, mockDictionary.terms as any);

      expect(result).toHaveLength(0);
    });

    test('証拠と位置情報が正しく抽出される', async () => {
      const result = await analyzer.analyzeTermRelevance(testCode, mockDictionary.terms as any);

      expect(result[0].evidence).toBeDefined();
      expect(result[0].locations).toBeDefined();
      expect(Array.isArray(result[0].evidence)).toBe(true);
      expect(Array.isArray(result[0].locations)).toBe(true);
    });

    test('エラーが発生した場合、空配列を返す', async () => {
      mockContextEngine.calculateRelevance.mockImplementation(() => {
        throw new Error('Relevance calculation failed');
      });
      
      const result = await analyzer.analyzeTermRelevance(testCode, mockDictionary.terms as any);

      expect(result).toHaveLength(0);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('identifyApplicableRules', () => {
    test('適用可能なルールが正しく特定される', () => {
      const result = analyzer.identifyApplicableRules(mockCodeContext, mockDictionary.businessRules);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Rule'); // testFunction matches 'test.*' pattern
    });

    test('優先度でソートされる', () => {
      const rules = [
        {
          ...mockDictionary.businessRules[0],
          priority: 20
        },
        {
          ...mockDictionary.businessRules[0],
          priority: 5
        }
      ];
      
      const contextWithMultipleMatches = {
        ...mockCodeContext,
        functions: [
          { name: 'testFunction1', complexity: 5 },
          { name: 'testFunction2', complexity: 5 }
        ]
      };
      
      const result = analyzer.identifyApplicableRules(contextWithMultipleMatches, rules);

      expect(result[0].priority).toBeLessThanOrEqual(result[1]?.priority || Infinity);
    });

    test('エラーが発生した場合、空配列を返す', () => {
      const invalidRules = [{ ...mockDictionary.businessRules[0], condition: null }];
      
      const result = analyzer.identifyApplicableRules(mockCodeContext, invalidRules as any);

      expect(result).toHaveLength(0);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('calculateContextualQualityScore', () => {
    const mockRelevantTerms = [
      {
        term: mockDictionary.terms[0],
        relevance: 0.9,
        evidence: ['direct match'],
        locations: []
      }
    ];

    const mockApplicableRules = [mockDictionary.businessRules[0]];
    const mockRequiredTests = [
      { type: 'must-have', description: 'Test description' },
      { type: 'should-have', description: 'Test description' }
    ];

    test('品質スコアが正しく計算される', () => {
      const score = analyzer.calculateContextualQualityScore(
        mockCodeContext,
        mockRelevantTerms,
        mockApplicableRules,
        mockRequiredTests as any
      );

      expect(score).toBeGreaterThan(50); // 基準値より高い
      expect(score).toBeLessThanOrEqual(100);
    });

    test('ドメイン関連度が考慮される', () => {
      const highRelevanceContext = { ...mockCodeContext, domainRelevance: 1.0 };
      const lowRelevanceContext = { ...mockCodeContext, domainRelevance: 0.1 };

      const highScore = analyzer.calculateContextualQualityScore(
        highRelevanceContext,
        mockRelevantTerms,
        mockApplicableRules,
        mockRequiredTests as any
      );

      const lowScore = analyzer.calculateContextualQualityScore(
        lowRelevanceContext,
        mockRelevantTerms,
        mockApplicableRules,
        mockRequiredTests as any
      );

      expect(highScore).toBeGreaterThan(lowScore);
    });

    test('複雑性が高いコードでスコアが調整される', () => {
      const complexContext = {
        ...mockCodeContext,
        functions: [{ name: 'complex', complexity: 15 }]
      };

      const score = analyzer.calculateContextualQualityScore(
        complexContext,
        mockRelevantTerms,
        mockApplicableRules,
        mockRequiredTests as any
      );

      const normalScore = analyzer.calculateContextualQualityScore(
        mockCodeContext,
        mockRelevantTerms,
        mockApplicableRules,
        mockRequiredTests as any
      );

      expect(score).toBeLessThan(normalScore);
    });

    test('エラーが発生した場合、デフォルトスコアを返す', () => {
      const invalidContext = null;
      
      const score = analyzer.calculateContextualQualityScore(
        invalidContext as any,
        mockRelevantTerms,
        mockApplicableRules,
        mockRequiredTests as any
      );

      expect(score).toBe(50);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('analyzeBatch', () => {
    const mockFileCodes = [
      { code: 'function test1() {}', filePath: '/test/file1.ts' },
      { code: 'function test2() {}', filePath: '/test/file2.ts' }
    ];

    beforeEach(() => {
      jest.spyOn(analyzer, 'performContextualAnalysis').mockResolvedValue({
        context: mockCodeContext,
        relevantTerms: [],
        applicableRules: [],
        requiredTests: [],
        qualityScore: 75
      });
    });

    test('順次処理が正常に実行される', async () => {
      const result = await analyzer.analyzeBatch(mockFileCodes, mockDictionary, { parallel: false });

      expect(result).toHaveLength(2);
      expect(analyzer.performContextualAnalysis).toHaveBeenCalledTimes(2);
    });

    test('並列処理が正常に実行される', async () => {
      const result = await analyzer.analyzeBatch(mockFileCodes, mockDictionary, { parallel: true });

      expect(result).toHaveLength(2);
      expect(analyzer.performContextualAnalysis).toHaveBeenCalledTimes(2);
    });

    test('バッチサイズが考慮される', async () => {
      const largeBatch = Array.from({ length: 15 }, (_, i) => ({
        code: `function test${i}() {}`,
        filePath: `/test/file${i}.ts`
      }));

      await analyzer.analyzeBatch(largeBatch, mockDictionary, { 
        parallel: true, 
        batchSize: 5 
      });

      expect(analyzer.performContextualAnalysis).toHaveBeenCalledTimes(15);
    });

    test('エラーが発生した場合、空配列を返す', async () => {
      jest.spyOn(analyzer, 'performContextualAnalysis').mockRejectedValue(new Error('Analysis failed'));
      
      const result = await analyzer.analyzeBatch(mockFileCodes, mockDictionary);

      expect(result).toHaveLength(0);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('generateAnalysisStatistics', () => {
    const mockAnalyses = [
      {
        context: { ...mockCodeContext, domainRelevance: 0.8 },
        relevantTerms: [
          { term: { term: 'TestTerm' }, relevance: 0.9, evidence: [], locations: [] }
        ],
        applicableRules: [{ name: 'TestRule' }],
        requiredTests: [
          { type: 'must-have', description: 'Test 1' },
          { type: 'should-have', description: 'Test 2' }
        ],
        qualityScore: 85
      },
      {
        context: { ...mockCodeContext, domainRelevance: 0.6 },
        relevantTerms: [
          { term: { term: 'TestTerm' }, relevance: 0.7, evidence: [], locations: [] }
        ],
        applicableRules: [{ name: 'TestRule' }],
        requiredTests: [
          { type: 'nice-to-have', description: 'Test 3' }
        ],
        qualityScore: 70
      }
    ];

    test('統計情報が正しく生成される', () => {
      const stats = analyzer.generateAnalysisStatistics(mockAnalyses as any);

      expect(stats.totalFiles).toBe(2);
      expect(stats.avgQualityScore).toBe(77.5);
      expect(stats.avgDomainRelevance).toBe(0.7);
      expect(stats.mostRelevantTerms).toHaveLength(1);
      expect(stats.mostRelevantTerms[0].term).toBe('TestTerm');
      expect(stats.mostRelevantTerms[0].frequency).toBe(2);
      expect(stats.commonRules).toHaveLength(1);
      expect(stats.testCoverage.mustHave).toBe(1);
      expect(stats.testCoverage.shouldHave).toBe(1);
      expect(stats.testCoverage.niceToHave).toBe(1);
    });

    test('最も関連度の高い用語が頻度順にソートされる', () => {
      const analysesWithVariousTerms = [
        {
          ...mockAnalyses[0],
          relevantTerms: [
            { term: { term: 'TermA' }, relevance: 0.9, evidence: [], locations: [] },
            { term: { term: 'TermB' }, relevance: 0.8, evidence: [], locations: [] }
          ]
        },
        {
          ...mockAnalyses[1],
          relevantTerms: [
            { term: { term: 'TermA' }, relevance: 0.7, evidence: [], locations: [] }
          ]
        }
      ];

      const stats = analyzer.generateAnalysisStatistics(analysesWithVariousTerms as any);

      expect(stats.mostRelevantTerms[0].term).toBe('TermA');
      expect(stats.mostRelevantTerms[0].frequency).toBe(2);
      expect(stats.mostRelevantTerms[1].term).toBe('TermB');
      expect(stats.mostRelevantTerms[1].frequency).toBe(1);
    });

    test('エラーが発生した場合、デフォルト統計を返す', () => {
      const invalidAnalyses = null;
      
      const stats = analyzer.generateAnalysisStatistics(invalidAnalyses as any);

      expect(stats.totalFiles).toBe(0);
      expect(stats.avgQualityScore).toBe(0);
      expect(stats.avgDomainRelevance).toBe(0);
      expect(stats.mostRelevantTerms).toHaveLength(0);
      expect(stats.commonRules).toHaveLength(0);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('private methods', () => {
    describe('extractEvidence', () => {
      test('用語の直接出現が検出される', () => {
        const code = 'function testFunction() { const TestTerm = "value"; }';
        const evidence = (analyzer as any).extractEvidence(code, mockDictionary.terms[0]);
        
        expect(evidence).toContain('用語「TestTerm」の直接出現');
      });

      test('エイリアスの出現が検出される', () => {
        const code = 'function testFunction() { const test = "value"; }';
        const evidence = (analyzer as any).extractEvidence(code, mockDictionary.terms[0]);
        
        expect(evidence).toContain('エイリアス「test」の出現');
      });

      test('関連パターンがマッチする', () => {
        const code = 'function testExample() {}';
        const evidence = (analyzer as any).extractEvidence(code, mockDictionary.terms[0]);
        
        expect(evidence.some((e: string) => e.includes('関連パターン'))).toBe(true);
      });

      test('コード例との類似性が検出される', () => {
        const code = 'function testExample() { return true; }';
        const evidence = (analyzer as any).extractEvidence(code, mockDictionary.terms[0]);
        
        expect(evidence.some((e: string) => e.includes('コード例1との類似性'))).toBe(true);
      });
    });

    describe('findTermLocations', () => {
      test('用語の位置が正しく特定される', () => {
        const code = 'const TestTerm = value;\nfunction test() {}';
        const locations = (analyzer as any).findTermLocations(code, mockDictionary.terms[0]);
        
        expect(locations).toHaveLength(2); // TestTerm + test (alias)
        expect(locations[0].line).toBe(1);
        expect(locations[0].column).toBeGreaterThanOrEqual(0);
      });

      test('複数行での出現が検出される', () => {
        const code = 'const TestTerm = value;\nconst test = another;';
        const locations = (analyzer as any).findTermLocations(code, mockDictionary.terms[0]);
        
        expect(locations.some((loc: any) => loc.line === 1)).toBe(true);
        expect(locations.some((loc: any) => loc.line === 2)).toBe(true);
      });
    });

    describe('calculateCodeSimilarity', () => {
      test('同一コードで100%の類似度', () => {
        const code = 'function test() { return true; }';
        const similarity = (analyzer as any).calculateCodeSimilarity(code, code);
        
        expect(similarity).toBe(1);
      });

      test('部分的に類似するコードで適切な類似度', () => {
        const code1 = 'function test() { return true; }';
        const code2 = 'function test() { return false; }';
        const similarity = (analyzer as any).calculateCodeSimilarity(code1, code2);
        
        expect(similarity).toBeGreaterThan(0);
        expect(similarity).toBeLessThan(1);
      });

      test('完全に異なるコードで0の類似度', () => {
        const code1 = 'function test() {}';
        const code2 = 'const x = 123;';
        const similarity = (analyzer as any).calculateCodeSimilarity(code1, code2);
        
        expect(similarity).toBe(0);
      });
    });

    describe('escapeRegex', () => {
      test('正規表現特殊文字が正しくエスケープされる', () => {
        const text = 'test.*+?^${}()|[]\\';
        const escaped = (analyzer as any).escapeRegex(text);
        
        expect(escaped).toBe('test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
      });
    });

    describe('createEmptyAnalysis', () => {
      test('空の分析結果が正しく作成される', () => {
        const result = (analyzer as any).createEmptyAnalysis('/test/file.ts');
        
        expect(result.context.filePath).toBe('/test/file.ts');
        expect(result.context.language).toBe('unknown');
        expect(result.relevantTerms).toHaveLength(0);
        expect(result.applicableRules).toHaveLength(0);
        expect(result.requiredTests).toHaveLength(0);
        expect(result.qualityScore).toBe(0);
      });
    });
  });
});