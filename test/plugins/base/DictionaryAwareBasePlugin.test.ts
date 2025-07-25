import {
  DomainDictionary,
  TestFile,
  DetectionResult,
  DomainContext,
  ProjectContext,
  QualityScore,
  Improvement,
  BusinessRule
} from '../../../src/core/types';
import { DictionaryAwareBasePlugin } from '../../../src/plugins/base/DictionaryAwareBasePlugin';
import { DomainTermManager } from '../../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../../src/dictionary/core/rule';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');
jest.mock('../../../src/dictionary/context/engine');
jest.mock('../../../src/dictionary/context/analyzer');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

// テスト用具象クラス
class TestDictionaryAwarePlugin extends DictionaryAwareBasePlugin {
  id = 'test-dictionary-plugin';
  name = 'Test Dictionary Plugin';
  version = '1.0.0';
  type = 'domain' as const;

  isApplicable(context: ProjectContext): boolean {
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    return [{
      patternId: 'test-pattern',
      patternName: 'Test Pattern',
      location: { file: testFile.path, line: 1, column: 1 },
      confidence: 0.8,
      evidence: [{
        type: 'test-evidence',
        description: 'Test evidence',
        location: { file: testFile.path, line: 1, column: 1 },
        code: 'test code',
        confidence: 0.8
      }]
    }];
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    return [{
      id: 'test-improvement',
      priority: 'medium',
      type: 'add',
      title: 'Test Improvement',
      description: 'Test improvement description',
      location: { file: 'test.js', line: 1, column: 1 },
      estimatedImpact: { scoreImprovement: 10, effortMinutes: 30 },
      automatable: false
    }];
  }

  // BasePluginから継承されるprotectedメソッドの実装
  protected calculateBasicQualityScore(patterns: DetectionResult[]): QualityScore {
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0.5;
    
    const score = Math.round(avgConfidence * 100);
    
    return {
      overall: score,
      breakdown: {
        completeness: score,
        correctness: score,
        maintainability: score
      },
      confidence: avgConfidence
    };
  }

  // BasePluginのログメソッドをpublicに
  public logDebug(message: string, data?: any): void {
    console.debug(message, data);
  }

  public logError(message: string, error?: any): void {
    console.error(message, error);
  }
}

describe('DictionaryAwareBasePlugin', () => {
  let plugin: TestDictionaryAwarePlugin;
  let testDictionary: DomainDictionary;
  let testFile: TestFile;
  let mockPatterns: DetectionResult[];
  let domainContext: DomainContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    plugin = new TestDictionaryAwarePlugin();

    // テスト用辞書の準備
    testDictionary = {
      version: '1.0.0',
      domain: 'ecommerce',
      language: 'ja',
      lastUpdated: new Date(),
      terms: [
        DomainTermManager.createTerm({
          id: 'payment-term',
          term: 'Payment',
          definition: 'Payment processing functionality',
          category: 'core-business',
          importance: 'critical',
          aliases: ['payment', 'pay'],
          examples: [{ code: 'processPayment()', description: 'Process payment' }],
          relatedPatterns: ['payment.*'],
          testRequirements: ['Payment validation test']
        }),
        DomainTermManager.createTerm({
          id: 'user-term',
          term: 'User',
          definition: 'User management functionality',
          category: 'core-business',
          importance: 'high',
          aliases: ['user'],
          examples: [{ code: 'createUser()', description: 'Create user' }],
          relatedPatterns: ['user.*'],
          testRequirements: ['User creation test']
        })
      ],
      relationships: [],
      businessRules: [
        BusinessRuleManager.createRule({
          id: 'payment-rule',
          name: 'Payment Validation Rule',
          description: 'Payment amounts must be validated',
          domain: 'ecommerce',
          condition: {
            type: 'function-name',
            pattern: 'payment.*',
            scope: 'function'
          },
          requirements: [{
            type: 'must-have',
            description: 'Payment validation test',
            testPattern: 'expect.*payment.*',
            example: 'expect(payment).toBeDefined()'
          }],
          priority: 10
        })
      ],
      qualityStandards: [],
      contextMappings: []
    };

    // テストファイル準備
    testFile = {
      path: '/test/payment.test.js',
      content: `
        describe('PaymentService', () => {
          it('should process payment', () => {
            const payment = { amount: 100, currency: 'USD' };
            expect(paymentService.process(payment)).toBeDefined();
          });
        });
      `,
      metadata: {
        framework: 'jest',
        language: 'javascript',
        lastModified: new Date()
      }
    };

    // モックパターン準備
    mockPatterns = [
      {
        patternId: 'payment-pattern',
        patternName: 'Payment Test Pattern',
        location: { file: testFile.path, line: 3, column: 10 },
        confidence: 0.9,
        evidence: [{
          type: 'function-call',
          description: 'Payment processing call detected',
          location: { file: testFile.path, line: 4, column: 20 },
          code: 'paymentService.process(payment)',
          confidence: 0.9
        }]
      },
      {
        patternId: 'assertion-pattern',
        patternName: 'Assertion Pattern',
        location: { file: testFile.path, line: 5, column: 12 },
        confidence: 0.8,
        evidence: [{
          type: 'assertion',
          description: 'Assertion detected',
          location: { file: testFile.path, line: 5, column: 12 },
          code: 'expect(paymentService.process(payment)).toBeDefined()',
          confidence: 0.8
        }]
      }
    ];

    // ドメインコンテキスト準備
    domainContext = {
      domain: 'ecommerce',
      primaryTerms: testDictionary.terms,
      activeRules: testDictionary.businessRules,
      qualityThreshold: 75
    };
  });

  describe('辞書を使用した文脈分析', () => {
    test('正常に文脈分析が実行される', async () => {
      // ContextAnalyzerのモック
      const mockAnalysis = {
        context: {
          filePath: testFile.path,
          language: 'javascript',
          functions: [{ name: 'processPayment', parameters: [], complexity: 1, location: { file: '', line: 1, column: 1 } }],
          classes: [],
          imports: [],
          domainRelevance: 0.8,
          relatedTerms: testDictionary.terms
        },
        relevantTerms: [{
          term: testDictionary.terms[0],
          relevance: 0.9,
          evidence: ['Payment term found in code'],
          locations: [{ file: testFile.path, line: 3, column: 10 }]
        }],
        applicableRules: testDictionary.businessRules,
        requiredTests: [{
          type: 'must-have',
          description: 'Payment validation test',
          testPattern: 'expect.*payment.*',
          example: 'expect(payment).toBeDefined()'
        }],
        qualityScore: 85
      };

      // ContextAnalyzerのperformContextualAnalysisメソッドをモック
      const mockPerformContextualAnalysis = jest.fn().mockResolvedValue(mockAnalysis);
      (plugin as any).contextAnalyzer = {
        performContextualAnalysis: mockPerformContextualAnalysis
      };

      const result = await plugin.analyzeWithContext(testFile, testDictionary);

      expect(result).toEqual(mockAnalysis);
      expect(mockPerformContextualAnalysis).toHaveBeenCalledWith(
        testFile.content,
        testFile.path,
        testDictionary
      );
      expect((plugin as any).isDictionaryEnabled).toBe(true);
    });

    test('エラー時にフォールバック分析が実行される', async () => {
      // ContextAnalyzerが例外を投げるように設定
      const mockPerformContextualAnalysis = jest.fn().mockRejectedValue(new Error('Analysis failed'));
      (plugin as any).contextAnalyzer = {
        performContextualAnalysis: mockPerformContextualAnalysis
      };

      // ContextEngineのanalyzeContextメソッドをモック
      const mockAnalyzeContext = jest.fn().mockResolvedValue({
        filePath: testFile.path,
        language: 'javascript',
        functions: [],
        classes: [],
        imports: [],
        domainRelevance: 0,
        relatedTerms: []
      });
      (plugin as any).contextEngine = {
        analyzeContext: mockAnalyzeContext
      };

      const result = await plugin.analyzeWithContext(testFile, testDictionary);

      expect(result.context.filePath).toBe(testFile.path);
      expect(result.relevantTerms).toEqual([]);
      expect(result.applicableRules).toEqual([]);
      expect(result.qualityScore).toBe(0);
    });
  });

  describe('ドメイン固有の品質評価', () => {
    test('ドメイン品質スコアが正しく計算される', () => {
      const result = plugin.evaluateDomainQuality(mockPatterns, domainContext);

      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.dimensions.domainAlignment).toBeGreaterThanOrEqual(0);
      expect(result.dimensions.businessCompliance).toBeGreaterThanOrEqual(0);
      expect(result.dimensions.technicalQuality).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('パターンが空の場合の品質評価', () => {
      const result = plugin.evaluateDomainQuality([], domainContext);

      expect(result.overall).toBe(70); // (50*0.4 + 75*0.4 + 100*0.2) = 70
      expect(result.dimensions.domainAlignment).toBe(50);
      expect(result.dimensions.businessCompliance).toBe(75);
      expect(result.dimensions.technicalQuality).toBe(100);
    });

    test('エラー時にデフォルトスコアが返される', () => {
      // 不正なドメインコンテキストでエラーを発生させる
      const invalidContext = null as any;
      const result = plugin.evaluateDomainQuality(mockPatterns, invalidContext);

      expect(result.overall).toBe(67); // (50*0.4 + 75*0.4 + 85*0.2) = 67
      expect(result.dimensions.domainAlignment).toBe(50);
      expect(result.dimensions.businessCompliance).toBe(75);
      expect(result.dimensions.technicalQuality).toBe(85);
      expect(result.recommendations).toContain('ドメイン適合度が低いです（50点）。ドメイン関連の用語をテストに含めることを検討してください。');
    });
  });

  describe('品質スコア向上機能', () => {
    test('辞書が有効な場合に品質スコアが向上する', () => {
      (plugin as any).isDictionaryEnabled = true;
      (plugin as any).contextEngine = {}; // ダミーのcontextEngine

      const basicScore: QualityScore = {
        overall: 70,
        breakdown: {
          completeness: 70,
          correctness: 70,
          maintainability: 70
        },
        confidence: 0.7
      };

      jest.spyOn(plugin as any, 'calculateBasicQualityScore').mockReturnValue(basicScore);
      
      const result = plugin.evaluateQuality(mockPatterns);

      expect(result.overall).toBeGreaterThanOrEqual(basicScore.overall);
      expect(result.breakdown.domainAlignment).toBeDefined();
    });

    test('辞書が無効な場合は基本スコアが返される', () => {
      (plugin as any).isDictionaryEnabled = false;

      const basicScore: QualityScore = {
        overall: 70,
        breakdown: {
          completeness: 70,
          correctness: 70,
          maintainability: 70
        },
        confidence: 0.7
      };

      jest.spyOn(plugin as any, 'calculateBasicQualityScore').mockReturnValue(basicScore);
      
      const result = plugin.evaluateQuality(mockPatterns);

      expect(result).toEqual(basicScore);
    });
  });

  describe('ドメイン適合度計算', () => {
    test('プライマリ用語が存在する場合の適合度計算', () => {
      const alignment = (plugin as any).calculateDomainAlignment(mockPatterns, domainContext);
      
      expect(alignment).toBeGreaterThanOrEqual(0);
      expect(alignment).toBeLessThanOrEqual(100);
    });

    test('プライマリ用語が存在しない場合は中立的なスコア', () => {
      const emptyContext = { ...domainContext, primaryTerms: [] };
      const alignment = (plugin as any).calculateDomainAlignment(mockPatterns, emptyContext);
      
      expect(alignment).toBe(50);
    });
  });

  describe('ビジネス規則準拠度計算', () => {
    test('アクティブルールが存在する場合の準拠度計算', () => {
      const compliance = (plugin as any).calculateBusinessCompliance(mockPatterns, domainContext);
      
      expect(compliance).toBeGreaterThanOrEqual(0);
      expect(compliance).toBeLessThanOrEqual(100);
    });

    test('アクティブルールが存在しない場合は高いデフォルト値', () => {
      const emptyContext = { ...domainContext, activeRules: [] };
      const compliance = (plugin as any).calculateBusinessCompliance(mockPatterns, emptyContext);
      
      expect(compliance).toBe(75);
    });
  });

  describe('技術的品質計算', () => {
    test('パターンが存在する場合の技術的品質計算', () => {
      const quality = (plugin as any).calculateTechnicalQuality(mockPatterns);
      
      expect(quality).toBeGreaterThan(0);
      expect(quality).toBeLessThanOrEqual(100);
    });

    test('パターンが存在しない場合は最高スコア', () => {
      const quality = (plugin as any).calculateTechnicalQuality([]);
      
      expect(quality).toBe(100);
    });
  });

  describe('改善推奨事項生成', () => {
    test('低スコア時に適切な推奨事項が生成される', () => {
      const lowScores = {
        domainAlignment: 40,
        businessCompliance: 50,
        technicalQuality: 60
      };

      const recommendations = (plugin as any).generateDomainRecommendations(
        mockPatterns,
        domainContext,
        lowScores
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r: string) => r.includes('ドメイン適合度'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('ビジネス規則'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('技術的品質'))).toBe(true);
    });

    test('高スコア時は推奨事項が少ない', () => {
      const highScores = {
        domainAlignment: 90,
        businessCompliance: 95,
        technicalQuality: 88
      };

      const recommendations = (plugin as any).generateDomainRecommendations(
        mockPatterns,
        domainContext,
        highScores
      );

      expect(recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  describe('ヘルパーメソッド', () => {
    test('パターンと用語の関連度計算', () => {
      const pattern = mockPatterns[0];
      const term = testDictionary.terms[0];
      
      const relevance = (plugin as any).calculatePatternTermRelevance(pattern, term);
      
      expect(relevance).toBeGreaterThanOrEqual(0);
      expect(relevance).toBeLessThanOrEqual(1);
    });

    test('用語の重要度による重み計算', () => {
      expect((plugin as any).getTermWeight('critical')).toBe(4.0);
      expect((plugin as any).getTermWeight('high')).toBe(3.0);
      expect((plugin as any).getTermWeight('medium')).toBe(2.0);
      expect((plugin as any).getTermWeight('low')).toBe(1.0);
      expect((plugin as any).getTermWeight('unknown')).toBe(1.0);
    });

    test('ルールの適用可能性判定', () => {
      const rule = testDictionary.businessRules[0];
      const applicable = (plugin as any).isRuleApplicableToPatterns(rule, mockPatterns);
      
      expect(typeof applicable).toBe('boolean');
    });

    test('ルールへの準拠度評価', () => {
      const rule = testDictionary.businessRules[0];
      const compliance = (plugin as any).evaluateRuleCompliance(rule, mockPatterns);
      
      expect(compliance).toBeGreaterThanOrEqual(0);
      expect(compliance).toBeLessThanOrEqual(100);
    });

    test('ドメインボーナス計算', () => {
      const bonus = (plugin as any).calculateDomainBonus(mockPatterns);
      
      expect(bonus).toBeGreaterThanOrEqual(0);
      expect(bonus).toBeLessThanOrEqual(15);
    });

    test('スコア用ドメイン適合度計算', () => {
      const alignment = (plugin as any).calculateDomainAlignmentForScore(mockPatterns);
      
      expect(alignment).toBeGreaterThanOrEqual(0);
      expect(alignment).toBeLessThanOrEqual(100);
    });

    test('パターンが空の場合のスコア用適合度', () => {
      const alignment = (plugin as any).calculateDomainAlignmentForScore([]);
      
      expect(alignment).toBe(50);
    });
  });

  describe('継承された基本機能', () => {
    test('プラグイン基本情報が正しく設定される', () => {
      expect(plugin.id).toBe('test-dictionary-plugin');
      expect(plugin.name).toBe('Test Dictionary Plugin');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('domain');
    });

    test('プロジェクト適用可能性の判定', () => {
      const projectContext: ProjectContext = {
        rootPath: '/test/project',
        language: 'javascript',
        filePatterns: {
          test: ['**/*.test.js'],
          source: ['**/*.js'],
          ignore: ['node_modules/**']
        }
      };

      const applicable = plugin.isApplicable(projectContext);
      expect(applicable).toBe(true);
    });

    test('パターン検出機能', async () => {
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].patternId).toBe('test-pattern');
      expect(patterns[0].confidence).toBe(0.8);
    });

    test('改善提案機能', () => {
      const qualityScore: QualityScore = {
        overall: 70,
        breakdown: { completeness: 70, correctness: 70, maintainability: 70 },
        confidence: 0.7
      };

      const improvements = plugin.suggestImprovements(qualityScore);
      
      expect(improvements).toHaveLength(1);
      expect(improvements[0].id).toBe('test-improvement');
      expect(improvements[0].priority).toBe('medium');
    });
  });

  describe('エラーハンドリング', () => {
    test('文脈分析エラー時のログ出力', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // ContextAnalyzerが例外を投げるように設定
      const mockPerformContextualAnalysis = jest.fn().mockRejectedValue(new Error('Test error'));
      (plugin as any).contextAnalyzer = {
        performContextualAnalysis: mockPerformContextualAnalysis
      };

      await plugin.analyzeWithContext(testFile, testDictionary);

      expect(consoleSpy).toHaveBeenCalledWith(
        '文脈分析中にエラーが発生しました',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('ドメイン品質評価エラー時のログ出力', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // null安全チェックが追加されたため、通常のnullケースではエラーが発生しない
      // 代わりに、null安全チェックが正常に動作することを確認
      plugin.evaluateDomainQuality(mockPatterns, null as any);
      
      // null安全チェックによりエラーが発生せず、ログも出力されない
      expect(consoleSpy).toHaveBeenCalledTimes(0);

      consoleSpy.mockRestore();
    });
  });
});