import {
  DomainDictionary,
  TestFile,
  DetectionResult,
  QualityScore,
  ProjectContext,
  DomainContext,
  Evidence
} from '../../../src/core/types';
import { DomainTermCoveragePlugin } from '../../../src/plugins/domain/DomainTermCoveragePlugin';
import { DomainTermManager } from '../../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../../src/dictionary/core/rule';

// BasePluginのヘルパーメソッドをモック
jest.mock('../../../src/plugins/base/BasePlugin', () => ({
  BasePlugin: class {
    logDebug(message: string, data?: any) {
      console.debug(message, data);
    }
    
    logError(message: string, error?: any) {
      console.error(message, error);
    }
  }
}));

describe('DomainTermCoveragePlugin', () => {
  let plugin: DomainTermCoveragePlugin;
  let testDictionary: DomainDictionary;
  let testFile: TestFile;
  let domainContext: DomainContext;

  beforeEach(() => {
    plugin = new DomainTermCoveragePlugin();

    // ヘルパーメソッドのモック
    (plugin as any).createDetectionResult = jest.fn((id, name, location, confidence, evidence) => ({
      patternId: id,
      patternName: name,
      location,
      confidence,
      evidence: evidence || []
    }));

    (plugin as any).createCodeLocation = jest.fn((file, line = 1, endLine, column = 1) => ({
      file,
      line,
      column,
      endLine
    }));

    (plugin as any).createImprovement = jest.fn((id, priority, type, title, description, location, impact) => ({
      id,
      priority,
      type,
      title,
      description,
      location,
      estimatedImpact: impact,
      automatable: false
    }));

    (plugin as any).findPatternInCode = jest.fn((content, pattern) => {
      const matches = [];
      if (typeof pattern === 'string') {
        const index = content.indexOf(pattern);
        if (index !== -1) {
          matches.push({ match: pattern, line: 1, column: index });
        }
      } else if (pattern instanceof RegExp) {
        const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
        let match;
        while ((match = globalPattern.exec(content)) !== null) {
          matches.push({ 
            match: match[1] || match[0], 
            line: content.substring(0, match.index).split('\n').length,
            column: match.index
          });
        }
      }
      return matches;
    });

    (plugin as any).removeCommentsAndStrings = jest.fn((content) => {
      return content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
                   .replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, '');
    });

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
          aliases: ['user', 'customer'],
          examples: [{ code: 'createUser()', description: 'Create user' }],
          relatedPatterns: ['user.*'],
          testRequirements: ['User creation test']
        }),
        DomainTermManager.createTerm({
          id: 'order-term',
          term: 'Order',
          definition: 'Order management functionality',
          category: 'core-business',
          importance: 'high',
          aliases: ['order'],
          examples: [{ code: 'createOrder()', description: 'Create order' }],
          relatedPatterns: ['order.*'],
          testRequirements: ['Order processing test']
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
      path: '/test/payment-service.test.js',
      content: `
        describe('PaymentService', () => {
          it('should process payment correctly', () => {
            const payment = { amount: 100, currency: 'USD' };
            const user = { id: 1, name: 'John' };
            expect(paymentService.processPayment(payment, user)).toBeDefined();
          });
          
          it('should validate payment data', () => {
            const invalidPayment = { amount: -100 };
            expect(() => paymentService.processPayment(invalidPayment)).toThrow();
          });
        });
      `,
      metadata: {
        framework: 'jest',
        language: 'javascript',
        lastModified: new Date()
      }
    };

    // ドメインコンテキスト準備
    domainContext = {
      domain: 'ecommerce',
      primaryTerms: testDictionary.terms,
      activeRules: testDictionary.businessRules,
      qualityThreshold: 75
    };
  });

  describe('プラグイン基本機能', () => {
    test('プラグイン識別情報が正しく設定される', () => {
      expect(plugin.id).toBe('domain-term-coverage');
      expect(plugin.name).toBe('Domain Term Coverage');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('domain');
    });

    test('TypeScriptプロジェクトに適用可能', () => {
      const projectContext: ProjectContext = {
        rootPath: '/test/project',
        language: 'typescript',
        filePatterns: {
          test: ['**/*.test.ts'],
          source: ['**/*.ts'],
          ignore: ['node_modules/**']
        }
      };

      expect(plugin.isApplicable(projectContext)).toBe(true);
    });

    test('JavaScriptプロジェクトに適用可能', () => {
      const projectContext: ProjectContext = {
        rootPath: '/test/project',
        language: 'javascript',
        filePatterns: {
          test: ['**/*.test.js'],
          source: ['**/*.js'],
          ignore: ['node_modules/**']
        }
      };

      expect(plugin.isApplicable(projectContext)).toBe(true);
    });

    test('その他の言語には適用不可', () => {
      const projectContext: ProjectContext = {
        rootPath: '/test/project',
        language: 'python',
        filePatterns: {
          test: ['**/*.test.py'],
          source: ['**/*.py'],
          ignore: ['__pycache__/**']
        }
      };

      expect(plugin.isApplicable(projectContext)).toBe(false);
    });
  });

  describe('パターン検出', () => {
    test('ドメイン用語パターンが正しく検出される', async () => {
      const patterns = await plugin.detectPatterns(testFile);

      expect(patterns.length).toBeGreaterThan(0);
      expect((plugin as any).createDetectionResult).toHaveBeenCalled();
    });

    test('ファイル名からのドメイン用語検出', async () => {
      const paymentFile = {
        ...testFile,
        path: '/test/payment-service.test.js'
      };

      const patterns = await plugin.detectPatterns(paymentFile);

      // ファイル名に "payment" が含まれているので検出されるはず
      expect((plugin as any).findPatternInCode).toHaveBeenCalled();
    });

    test('コンテンツからのドメイン用語検出', async () => {
      await plugin.detectPatterns(testFile);

      // removeCommentsAndStringsが呼ばれてコンテンツが処理される
      expect((plugin as any).removeCommentsAndStrings).toHaveBeenCalledWith(testFile.content);
    });

    test('関数名からのドメイン用語検出', async () => {
      const patterns = await plugin.detectPatterns(testFile);

      // テスト関数名からの検出確認
      expect((plugin as any).findPatternInCode).toHaveBeenCalledWith(
        testFile.content,
        expect.any(RegExp)
      );
    });

    test('パターン検出エラーのハンドリング', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // findPatternInCodeが例外を投げるように設定
      (plugin as any).findPatternInCode = jest.fn().mockImplementation(() => {
        throw new Error('Pattern detection failed');
      });

      const patterns = await plugin.detectPatterns(testFile);

      expect(patterns).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'パターン検出中にエラーが発生しました',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('品質評価', () => {
    test('品質スコアが正しく計算される', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'test-pattern-1',
          patternName: 'Payment Pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'test-pattern-2',
          patternName: 'User Pattern',
          location: { file: testFile.path, line: 2, column: 1 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const qualityScore = plugin.evaluateQuality(mockPatterns);

      expect(qualityScore.overall).toBeGreaterThan(0);
      expect(qualityScore.overall).toBeLessThanOrEqual(100);
      expect(qualityScore.breakdown.completeness).toBeDefined();
      expect(qualityScore.breakdown.correctness).toBeDefined();
      expect(qualityScore.breakdown.maintainability).toBeDefined();
      expect(qualityScore.confidence).toBeGreaterThan(0);
    });

    test('パターンがない場合の品質評価', () => {
      const qualityScore = plugin.evaluateQuality([]);

      expect(qualityScore.overall).toBeLessThan(50);
      expect(qualityScore.confidence).toBe(0.5);
    });

    test('ドメイン用語カバレッジの計算', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'domain-term-filename-0',
          patternName: 'Payment Pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'domain-term-content-0',
          patternName: 'User Pattern',
          location: { file: testFile.path, line: 2, column: 1 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const coverage = (plugin as any).calculateDomainTermCoverage(mockPatterns);

      expect(coverage).toBeGreaterThan(30);
      expect(coverage).toBeLessThanOrEqual(100);
    });

    test('用語使用の一貫性計算', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'test-1',
          patternName: 'Pattern 1',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'test-2',
          patternName: 'Pattern 2',
          location: { file: testFile.path, line: 2, column: 1 },
          confidence: 0.85,
          evidence: []
        }
      ];

      const consistency = (plugin as any).calculateTermUsageConsistency(mockPatterns);

      expect(consistency).toBeGreaterThanOrEqual(50);
      expect(consistency).toBeLessThanOrEqual(100);
    });
  });

  describe('改善提案', () => {
    test('低品質スコア時に改善提案が生成される', () => {
      const lowQualityScore: QualityScore = {
        overall: 50,
        breakdown: {
          completeness: 60,
          correctness: 70,
          maintainability: 80
        },
        confidence: 0.5
      };

      const improvements = plugin.suggestImprovements(lowQualityScore);

      expect(improvements.length).toBeGreaterThan(0);
      expect((plugin as any).createImprovement).toHaveBeenCalled();
    });

    test('高品質スコア時は改善提案が少ない', () => {
      const highQualityScore: QualityScore = {
        overall: 90,
        breakdown: {
          completeness: 85,
          correctness: 90,
          maintainability: 95
        },
        confidence: 0.9
      };

      const improvements = plugin.suggestImprovements(highQualityScore);

      expect(improvements.length).toBeLessThanOrEqual(1);
    });
  });

  describe('辞書を使用した拡張分析', () => {
    test('辞書を使用した文脈分析が実行される', async () => {
      // super.analyzeWithContextをモック
      const mockBasicAnalysis = {
        context: {
          filePath: testFile.path,
          language: 'javascript',
          functions: [],
          classes: [],
          imports: [],
          domainRelevance: 0.8,
          relatedTerms: []
        },
        relevantTerms: [],
        applicableRules: [],
        requiredTests: [],
        qualityScore: 75
      };

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(plugin)), 'analyzeWithContext')
          .mockResolvedValue(mockBasicAnalysis);

      const result = await plugin.analyzeWithContext(testFile, testDictionary);

      expect(result.context.filePath).toBe(testFile.path);
      expect(result.qualityScore).toBeGreaterThanOrEqual(mockBasicAnalysis.qualityScore);
    });

    test('拡張分析でエラーが発生した場合のフォールバック', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // super.analyzeWithContextが正常に動作
      const mockBasicAnalysis = {
        context: {
          filePath: testFile.path,
          language: 'javascript',
          functions: [],
          classes: [],
          imports: [],
          domainRelevance: 0.8,
          relatedTerms: []
        },
        relevantTerms: [],
        applicableRules: [],
        requiredTests: [],
        qualityScore: 75
      };

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(plugin)), 'analyzeWithContext')
          .mockResolvedValue(mockBasicAnalysis);

      // performDomainSpecificAnalysisでエラーを発生させる
      (plugin as any).performDomainSpecificAnalysis = jest.fn().mockRejectedValue(new Error('Analysis failed'));

      const result = await plugin.analyzeWithContext(testFile, testDictionary);

      expect(result).toEqual(mockBasicAnalysis);
      expect(consoleSpy).toHaveBeenCalledWith(
        '辞書を使用した分析中にエラーが発生しました',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('ドメイン固有の品質評価', () => {
    test('ドメイン品質スコアが拡張される', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'payment-pattern',
          patternName: 'Payment processing pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.9,
          evidence: []
        }
      ];

      // super.evaluateDomainQualityをモック
      const mockBaseEvaluation = {
        overall: 75,
        dimensions: {
          domainAlignment: 80,
          businessCompliance: 70,
          technicalQuality: 75
        },
        recommendations: ['基本的な推奨事項']
      };

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(plugin)), 'evaluateDomainQuality')
          .mockReturnValue(mockBaseEvaluation);

      const result = plugin.evaluateDomainQuality(mockPatterns, domainContext);

      expect(result.overall).toBeDefined();
      expect(result.dimensions.domainAlignment).toBe(mockBaseEvaluation.dimensions.domainAlignment);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(mockBaseEvaluation.recommendations.length);
    });

    test('エラー時にベースクラスの評価にフォールバック', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const mockPatterns: DetectionResult[] = [];
      const mockBaseEvaluation = {
        overall: 50,
        dimensions: {
          domainAlignment: 50,
          businessCompliance: 50,
          technicalQuality: 50
        },
        recommendations: ['エラー時の推奨事項']
      };

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(plugin)), 'evaluateDomainQuality')
          .mockReturnValue(mockBaseEvaluation);

      // evaluateTermCoverageQualityでエラーを発生させる
      (plugin as any).evaluateTermCoverageQuality = jest.fn().mockImplementation(() => {
        throw new Error('Evaluation failed');
      });

      const result = plugin.evaluateDomainQuality(mockPatterns, domainContext);

      expect(result).toEqual(mockBaseEvaluation);
      expect(consoleSpy).toHaveBeenCalledWith(
        'ドメイン品質評価中にエラーが発生しました',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('プライベートメソッド', () => {
    test('追加のドメイン用語検索', () => {
      const additionalTerms = (plugin as any).findAdditionalDomainTerms(testFile, testDictionary);

      // testFile.contentに用語のエイリアスが含まれているかチェック
      expect(Array.isArray(additionalTerms)).toBe(true);
    });

    test('追加のビジネスルール適用', () => {
      const additionalRules = (plugin as any).applyAdditionalBusinessRules(testFile, testDictionary);

      expect(Array.isArray(additionalRules)).toBe(true);
    });

    test('拡張品質スコア計算', () => {
      const mockBasicAnalysis = {
        context: {
          filePath: testFile.path,
          language: 'javascript',
          functions: [],
          classes: [],
          imports: [],
          domainRelevance: 0.8,
          relatedTerms: []
        },
        relevantTerms: [],
        applicableRules: [],
        requiredTests: [],
        qualityScore: 75
      };

      const mockDomainAnalysis = {
        relevantTerms: [{ term: testDictionary.terms[0], relevance: 0.8, evidence: [], locations: [] }],
        applicableRules: [testDictionary.businessRules[0]]
      };

      const enhancedScore = (plugin as any).calculateEnhancedQualityScore(
        mockBasicAnalysis,
        mockDomainAnalysis
      );

      expect(enhancedScore).toBeGreaterThanOrEqual(mockBasicAnalysis.qualityScore);
      expect(enhancedScore).toBeLessThanOrEqual(100);
    });

    test('用語カバレッジ品質評価', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'payment-pattern',
          patternName: 'payment processing pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const coverageQuality = (plugin as any).evaluateTermCoverageQuality(mockPatterns, domainContext);

      expect(coverageQuality).toBeGreaterThanOrEqual(0);
      expect(coverageQuality).toBeLessThanOrEqual(100);
    });

    test('用語使用品質評価', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'test-pattern',
          patternName: 'Test Pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.8,
          evidence: []
        }
      ];

      const usageQuality = (plugin as any).evaluateTermUsageQuality(mockPatterns, domainContext);

      expect(usageQuality).toBeGreaterThanOrEqual(0);
      expect(usageQuality).toBeLessThanOrEqual(100);
    });

    test('パターンが空の場合の用語使用品質評価', () => {
      const usageQuality = (plugin as any).evaluateTermUsageQuality([], domainContext);

      expect(usageQuality).toBe(50);
    });

    test('カバレッジ固有の推奨事項生成', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'single-pattern',
          patternName: 'Single Pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.3,
          evidence: []
        }
      ];

      const recommendations = (plugin as any).generateCoverageSpecificRecommendations(
        mockPatterns,
        domainContext
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('高カバレッジ時の推奨事項', () => {
      // カバレッジが高い場合のモック
      (plugin as any).evaluateTermCoverageQuality = jest.fn().mockReturnValue(80);

      const mockPatterns: DetectionResult[] = [
        // 5つ以上のパターンを作成
        ...Array(5).fill(null).map((_, i) => ({
          patternId: `pattern-${i}`,
          patternName: `Pattern ${i}`,
          location: { file: testFile.path, line: i + 1, column: 1 },
          confidence: 0.8,
          evidence: []
        }))
      ];

      const recommendations = (plugin as any).generateCoverageSpecificRecommendations(
        mockPatterns,
        domainContext
      );

      expect(recommendations.length).toBe(0);
    });
  });

  describe('境界値テスト', () => {
    test('ドメイン用語が存在しないコンテキストでの品質評価', () => {
      const emptyContext = {
        ...domainContext,
        primaryTerms: []
      };

      const patterns: DetectionResult[] = [];
      const termCoverage = (plugin as any).evaluateTermCoverageQuality(patterns, emptyContext);

      expect(termCoverage).toBe(75);
    });

    test('極端に高い信頼度パターンの一貫性計算', () => {
      const highConfidencePatterns: DetectionResult[] = [
        {
          patternId: 'perfect-1',
          patternName: 'Perfect Pattern 1',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 1.0,
          evidence: []
        },
        {
          patternId: 'perfect-2',
          patternName: 'Perfect Pattern 2',
          location: { file: testFile.path, line: 2, column: 1 },
          confidence: 1.0,
          evidence: []
        }
      ];

      const consistency = (plugin as any).calculateTermUsageConsistency(highConfidencePatterns);

      expect(consistency).toBe(100);
    });

    test('信頼度が大きく異なるパターンの一貫性計算', () => {
      const mixedConfidencePatterns: DetectionResult[] = [
        {
          patternId: 'low-conf',
          patternName: 'Low Confidence Pattern',
          location: { file: testFile.path, line: 1, column: 1 },
          confidence: 0.1,
          evidence: []
        },
        {
          patternId: 'high-conf',
          patternName: 'High Confidence Pattern',
          location: { file: testFile.path, line: 2, column: 1 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const consistency = (plugin as any).calculateTermUsageConsistency(mixedConfidencePatterns);

      expect(consistency).toBeLessThan(100);
      expect(consistency).toBeGreaterThanOrEqual(50);
    });
  });
});