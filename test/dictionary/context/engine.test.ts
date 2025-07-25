import { ContextEngine } from '../../../src/dictionary/context/engine';
import { ContextAnalyzer } from '../../../src/dictionary/context/analyzer';
import { ContextualScorer } from '../../../src/dictionary/context/scorer';
import { DomainTermManager } from '../../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../../src/dictionary/core/rule';
import {
  DomainDictionary,
  DomainTerm,
  BusinessRule,
  CodeContext,
  ContextualAnalysis
} from '../../../src/core/types';

describe('ContextEngine', () => {
  let contextEngine: ContextEngine;
  let testDictionary: DomainDictionary;
  let testTerms: DomainTerm[];

  beforeEach(() => {
    // テスト用辞書の準備
    testTerms = [
      DomainTermManager.createTerm({
        id: 'payment-term',
        term: 'Payment',
        definition: 'Payment processing functionality',
        category: 'financial',
        importance: 'critical',
        aliases: ['payment-proc', 'pay'],
        examples: [{
          code: 'processPayment(amount, currency)',
          description: 'Process payment with amount and currency'
        }],
        relatedPatterns: ['payment.*', 'pay.*'],
        testRequirements: ['Payment validation test', 'Payment security test']
      }),
      DomainTermManager.createTerm({
        id: 'user-term',
        term: 'User',
        definition: 'System user functionality',
        category: 'core-business',
        importance: 'high',
        aliases: ['user-account'],
        examples: [{
          code: 'createUser(userData)',
          description: 'Create a new user'
        }],
        relatedPatterns: ['user.*', 'account.*'],
        testRequirements: ['User creation test']
      })
    ];

    testDictionary = {
      version: '1.0.0',
      domain: 'ecommerce',
      language: 'ja',
      lastUpdated: new Date(),
      terms: testTerms,
      relationships: [],
      businessRules: [],
      qualityStandards: [],
      contextMappings: []
    };

    contextEngine = new ContextEngine(testDictionary);
  });

  describe('コード文脈分析', () => {
    test('TypeScriptコードの基本分析', async () => {
      const code = `
import { PaymentService } from './payment-service';

export class PaymentProcessor {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  async processPayment(amount: number, currency: string): Promise<PaymentResult> {
    if (amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    return await this.paymentService.process({
      amount,
      currency
    });
  }

  validateUser(user: User): boolean {
    return user.isActive && user.hasValidPaymentMethod();
  }
}
      `;

      const context = await contextEngine.analyzeContext(code, 'payment-processor.ts');

      expect(context.filePath).toBe('payment-processor.ts');
      expect(context.language).toBe('typescript');
      expect(context.domainRelevance).toBeGreaterThan(0);
      expect(context.relatedTerms.length).toBeGreaterThan(0);

      // 関数が検出されることを確認
      expect(context.functions.length).toBeGreaterThan(0);
      const processPaymentFunction = context.functions.find(fn => fn.name === 'processPayment');
      expect(processPaymentFunction).toBeDefined();
      expect(processPaymentFunction?.parameters.length).toBe(2);
      expect(processPaymentFunction?.complexity).toBeGreaterThan(1);

      // クラスが検出されることを確認
      expect(context.classes.length).toBe(1);
      expect(context.classes[0].name).toBe('PaymentProcessor');

      // インポートが検出されることを確認
      expect(context.imports.length).toBe(1);
      expect(context.imports[0].module).toBe('./payment-service');
      expect(context.imports[0].type).toBe('named');
    });

    test('JavaScriptコードの分析', async () => {
      const code = `
const express = require('express');
const { createUser, findUser } = require('./user-service');

function setupUserRoutes(app) {
  app.post('/users', async (req, res) => {
    try {
      const user = await createUser(req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/users/:id', async (req, res) => {
    const user = await findUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
}

module.exports = { setupUserRoutes };
      `;

      const context = await contextEngine.analyzeContext(code, 'user-routes.js');

      expect(context.language).toBe('javascript');
      expect(context.functions.length).toBeGreaterThan(0);
      
      // Express.jsの関数が検出されることを確認
      const setupFunction = context.functions.find(fn => fn.name === 'setupUserRoutes');
      expect(setupFunction).toBeDefined();

      // 関連用語（User）が検出されることを確認
      const userTerm = context.relatedTerms.find(term => term.term === 'User');
      expect(userTerm).toBeDefined();
    });

    test('複雑度の計算', async () => {
      const complexCode = `
function complexFunction(data) {
  if (data.type === 'payment') {
    if (data.amount > 1000) {
      for (let i = 0; i < data.items.length; i++) {
        if (data.items[i].category === 'premium') {
          while (data.items[i].processing) {
            // 複雑な処理
            try {
              processItem(data.items[i]);
            } catch (error) {
              handleError(error);
            }
          }
        }
      }
    } else {
      processSimplePayment(data);
    }
  }
  return data;
}
      `;

      const context = await contextEngine.analyzeContext(complexCode, 'complex.js');

      const complexFunction = context.functions.find(fn => fn.name === 'complexFunction');
      expect(complexFunction).toBeDefined();
      expect(complexFunction?.complexity).toBeGreaterThan(5);
    });
  });

  describe('ドメイン関連度計算', () => {
    test('用語の直接出現による関連度', () => {
      const code = 'function processPayment(amount) { return payment.process(amount); }';
      const paymentTerm = testTerms[0];

      const relevance = contextEngine.calculateRelevance(code, paymentTerm);

      expect(relevance).toBeGreaterThan(0);
    });

    test('エイリアスマッチによる関連度', () => {
      const code = 'const payData = { pay: true };';
      const paymentTerm = testTerms[0]; // aliasに'pay'を含む

      const relevance = contextEngine.calculateRelevance(code, paymentTerm);

      expect(relevance).toBeGreaterThan(0);
    });

    test('パターンマッチによる関連度', () => {
      const code = 'paymentProcessor.initialize()';
      const paymentTerm = testTerms[0]; // relatedPatternsに'payment.*'を含む

      const relevance = contextEngine.calculateRelevance(code, paymentTerm);

      expect(relevance).toBeGreaterThan(0);
    });

    test('コード例との類似性による関連度', () => {
      const code = 'processPayment(100, "USD")';
      const paymentTerm = testTerms[0]; // 類似のコード例を含む

      const relevance = contextEngine.calculateRelevance(code, paymentTerm);

      expect(relevance).toBeGreaterThan(0);
    });

    test('無関連コードの関連度', () => {
      const code = 'function calculateTax(rate) { return rate * 0.1; }';
      const paymentTerm = testTerms[0];

      const relevance = contextEngine.calculateRelevance(code, paymentTerm);

      expect(relevance).toBe(0);
    });
  });

  describe('テスト要件推論', () => {
    let businessRules: BusinessRule[];

    beforeEach(() => {
      businessRules = [
        BusinessRuleManager.createRule({
          id: 'payment-validation-rule',
          name: 'Payment Validation Rule',
          description: 'Payment amounts must be validated',
          domain: 'ecommerce',
          condition: {
            type: 'function-name',
            pattern: '.*[Pp]ayment.*',
            scope: 'function'
          },
          requirements: [{
            type: 'must-have',
            description: 'Amount validation test',
            testPattern: 'expect\\(.*amount.*\\)\\.toBe.*',
            example: 'expect(amount).toBeGreaterThan(0)'
          }]
        })
      ];
    });

    test('ビジネスルールに基づくテスト要件推論', async () => {
      const code = `
        function processPayment(amount) {
          if (amount <= 0) throw new Error('Invalid amount');
          return paymentService.process(amount);
        }
      `;

      const context = await contextEngine.analyzeContext(code, 'payment.js');
      const requirements = contextEngine.inferRequiredTests(context, businessRules);

      expect(requirements.length).toBeGreaterThan(0);
      
      const amountValidationTest = requirements.find(req => 
        req.description.includes('Amount validation')
      );
      expect(amountValidationTest).toBeDefined();
      expect(amountValidationTest?.type).toBe('must-have');
    });

    test('用語のテスト要件からの推論', async () => {
      const code = `
        function createPayment(data) {
          return new Payment(data);
        }
      `;

      const context = await contextEngine.analyzeContext(code, 'payment.js');
      const requirements = contextEngine.inferRequiredTests(context, []);

      expect(requirements.length).toBeGreaterThan(0);
      
      // Paymentに関連するテスト要件が推論されることを確認
      const paymentTests = requirements.filter(req => 
        req.description.includes('Payment') || req.description.includes('payment')
      );
      expect(paymentTests.length).toBeGreaterThan(0);
    });

    test('関数構造からのテスト推論', async () => {
      const complexCode = `
        function complexPaymentProcessor(amount, currency, metadata) {
          // 複雑度の高い関数（3つ以上のパラメータ）
          if (!amount || !currency) throw new Error('Missing parameters');
          
          // 複雑な処理ロジック
          for (let i = 0; i < 10; i++) {
            if (metadata[i]) {
              processMetadata(metadata[i]);
            }
          }
          
          return processPayment(amount, currency);
        }
      `;

      const context = await contextEngine.analyzeContext(complexCode, 'complex-payment.js');
      const requirements = contextEngine.inferRequiredTests(context, []);

      // 複雑な関数とパラメータ数に基づくテスト要件
      const complexityTests = requirements.filter(req => 
        req.description.includes('複雑') || req.description.includes('境界値')
      );
      expect(complexityTests.length).toBeGreaterThan(0);
    });
  });

  describe('重要度判定', () => {
    test('重要用語を含むコードの重要度', async () => {
      const code = `
        function processPayment(amount) {
          return paymentGateway.charge(amount);
        }
      `;

      const context = await contextEngine.analyzeContext(code, 'payment.js');
      const importance = contextEngine.assessImportance(context, testDictionary);

      expect(importance.level).toBeOneOf(['critical', 'high']);
      expect(importance.score).toBeGreaterThan(70);
      expect(importance.reasons.length).toBeGreaterThan(0);
      expect(importance.reasons.some(reason => reason.includes('重要用語'))).toBe(true);
    });

    test('複雑度の高いコードの重要度', async () => {
      const complexCode = `
        function veryComplexFunction(a, b, c, d, e) {
          if (a) {
            if (b) {
              while (c) {
                for (let i = 0; i < d; i++) {
                  if (e[i]) {
                    try {
                      processComplexLogic(a, b, c, d, e[i]);
                    } catch (error) {
                      handleComplexError(error);
                    }
                  }
                }
              }
            }
          }
          return result;
        }
      `;

      const context = await contextEngine.analyzeContext(complexCode, 'complex.js');
      const importance = contextEngine.assessImportance(context, testDictionary);

      expect(importance.score).toBeGreaterThan(60);
      expect(importance.reasons.some(reason => reason.includes('複雑度'))).toBe(true);
    });

    test('多くの依存関係を持つコードの重要度', async () => {
      const codeWithManyImports = `
        import { Service1 } from './service1';
        import { Service2 } from './service2';
        import { Service3 } from './service3';
        import { Service4 } from './service4';
        import { Service5 } from './service5';
        import { Service6 } from './service6';
        
        function integratedFunction() {
          return new Service1().process();
        }
      `;

      const context = await contextEngine.analyzeContext(codeWithManyImports, 'integrated.ts');
      const importance = contextEngine.assessImportance(context, testDictionary);

      expect(importance.reasons.some(reason => reason.includes('依存関係'))).toBe(true);
    });

    test('ドメイン関連度の高いコードの重要度', async () => {
      const domainRichCode = `
        function paymentUserValidation(user, payment) {
          return user.validate() && payment.process();
        }
      `;

      const context = await contextEngine.analyzeContext(domainRichCode, 'domain-rich.js');
      const importance = contextEngine.assessImportance(context, testDictionary);

      expect(importance.reasons.some(reason => reason.includes('関連性'))).toBe(true);
    });
  });

  describe('キャッシュ機能', () => {
    test('同一コードの分析結果キャッシュ', async () => {
      const code = 'function test() { return "cached"; }';
      const filePath = 'cached-test.js';

      // 初回分析
      const startTime1 = Date.now();
      const result1 = await contextEngine.analyzeContext(code, filePath);
      const time1 = Date.now() - startTime1;

      // 2回目分析（キャッシュから取得）
      const startTime2 = Date.now();
      const result2 = await contextEngine.analyzeContext(code, filePath);
      const time2 = Date.now() - startTime2;

      // 結果が同じであることを確認
      expect(result1.filePath).toBe(result2.filePath);
      expect(result1.language).toBe(result2.language);

      // 2回目の方が高速であることを確認（キャッシュ効果）
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('エラーハンドリング', () => {
    test('不正なコードでのエラーハンドリング', async () => {
      const invalidCode = 'invalid syntax { } [ unclosed';

      // エラーが発生してもクラッシュしないことを確認
      const context = await contextEngine.analyzeContext(invalidCode, 'invalid.js');

      expect(context.filePath).toBe('invalid.js');
      expect(context.language).toBe('javascript');
      // エラー時も基本構造は返される
    });

    test('空のコードの処理', async () => {
      const emptyCode = '';

      const context = await contextEngine.analyzeContext(emptyCode, 'empty.js');

      expect(context.filePath).toBe('empty.js');
      expect(context.functions.length).toBe(0);
      expect(context.classes.length).toBe(0);
      expect(context.imports.length).toBe(0);
      expect(context.domainRelevance).toBe(0);
    });

    test('非常に長いコードの処理', async () => {
      // 大きなコードファイルを生成
      let largeCode = 'function largeFunction() {\n';
      for (let i = 0; i < 10000; i++) {
        largeCode += `  console.log("line ${i}");\n`;
      }
      largeCode += '}';

      const startTime = Date.now();
      const context = await contextEngine.analyzeContext(largeCode, 'large.js');
      const endTime = Date.now();

      // 処理時間が妥当であることを確認（10秒以内）
      expect(endTime - startTime).toBeLessThan(10000);
      expect(context.functions.length).toBeGreaterThan(0);
    });
  });
});

describe('ContextAnalyzer', () => {
  let analyzer: ContextAnalyzer;
  let testDictionary: DomainDictionary;

  beforeEach(() => {
    const testTerms = [
      DomainTermManager.createTerm({
        id: 'api-term',
        term: 'API',
        definition: 'Application Programming Interface',
        category: 'technical',
        importance: 'high',
        aliases: ['api', 'interface'],
        relatedPatterns: ['api.*', 'endpoint.*'],
        testRequirements: ['API response test', 'API error handling test']
      })
    ];

    const testRules = [
      BusinessRuleManager.createRule({
        id: 'api-rule',
        name: 'API Validation Rule',
        description: 'API endpoints must be validated',
        domain: 'web',
        condition: {
          type: 'api-endpoint',
          pattern: '/api/.*',
          scope: 'function'
        },
        requirements: [{
          type: 'must-have',
          description: 'API validation test',
          testPattern: 'expect\\(response\\.status\\)\\.toBe\\(200\\)',
          example: 'expect(response.status).toBe(200)'
        }],
        priority: 5
      })
    ];

    testDictionary = {
      version: '1.0.0',
      domain: 'web',
      language: 'ja',
      lastUpdated: new Date(),
      terms: testTerms,
      relationships: [],
      businessRules: testRules,
      qualityStandards: [],
      contextMappings: []
    };

    analyzer = new ContextAnalyzer(testDictionary);
  });

  describe('包括的文脈分析', () => {
    test('完全な文脈分析の実行', async () => {
      const code = `
        import express from 'express';
        
        const app = express();
        
        app.get('/api/users', (req, res) => {
          res.json({ users: [] });
        });
        
        app.post('/api/users', (req, res) => {
          // User creation logic
          res.status(201).json({ success: true });
        });
      `;

      const analysis = await analyzer.performContextualAnalysis(
        code,
        'api-server.js',
        testDictionary
      );

      expect(analysis.context.filePath).toBe('api-server.js');
      expect(analysis.relevantTerms.length).toBeGreaterThan(0);
      expect(analysis.applicableRules.length).toBeGreaterThan(0);
      expect(analysis.requiredTests.length).toBeGreaterThan(0);
      expect(analysis.qualityScore).toBeGreaterThan(0);

      // API用語が関連用語として検出されることを確認
      const apiTerm = analysis.relevantTerms.find(tr => tr.term.term === 'API');
      expect(apiTerm).toBeDefined();
      expect(apiTerm?.relevance).toBeGreaterThan(0);

      // APIルールが適用可能として検出されることを確認
      const apiRule = analysis.applicableRules.find(rule => rule.name.includes('API'));
      expect(apiRule).toBeDefined();
    });

    test('バッチ分析（複数ファイル）', async () => {
      const fileCodes = [
        { code: 'function apiHandler() { return api.call(); }', filePath: 'handler1.js' },
        { code: 'const endpoint = "/api/data";', filePath: 'handler2.js' },
        { code: 'function regular() { return "normal"; }', filePath: 'regular.js' }
      ];

      const results = await analyzer.analyzeBatch(fileCodes, testDictionary, {
        parallel: false
      });

      expect(results.length).toBe(3);
      
      // API関連ファイルは高い品質スコアを持つべき
      const apiResults = results.filter(result => 
        result.context.filePath.includes('handler')
      );
      expect(apiResults.length).toBe(2);
      
      apiResults.forEach(result => {
        expect(result.qualityScore).toBeGreaterThan(0);
      });
    });

    test('並列バッチ分析', async () => {
      const fileCodes = Array(10).fill(null).map((_, i) => ({
        code: `function api${i}() { return api.process${i}(); }`,
        filePath: `api${i}.js`
      }));

      const startTime = Date.now();
      const results = await analyzer.analyzeBatch(fileCodes, testDictionary, {
        parallel: true,
        batchSize: 3
      });
      const endTime = Date.now();

      expect(results.length).toBe(10);
      // 並列処理により妥当な時間で完了することを確認
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('統計情報生成', () => {
    test('分析結果の統計情報', async () => {
      const analyses: ContextualAnalysis[] = [
        {
          context: {
            filePath: 'test1.js',
            language: 'javascript',
            functions: [],
            classes: [],
            imports: [],
            domainRelevance: 0.8,
            relatedTerms: [testDictionary.terms[0]]
          },
          relevantTerms: [{
            term: testDictionary.terms[0],
            relevance: 0.9,
            evidence: ['API term found'],
            locations: []
          }],
          applicableRules: [testDictionary.businessRules[0]],
          requiredTests: [
            { type: 'must-have', description: 'Test 1', testPattern: 'test.*', example: 'test()' },
            { type: 'should-have', description: 'Test 2', testPattern: 'test.*', example: 'test()' }
          ],
          qualityScore: 85
        },
        {
          context: {
            filePath: 'test2.js',
            language: 'javascript',
            functions: [],
            classes: [],
            imports: [],
            domainRelevance: 0.6,
            relatedTerms: []
          },
          relevantTerms: [],
          applicableRules: [],
          requiredTests: [
            { type: 'nice-to-have', description: 'Test 3', testPattern: 'test.*', example: 'test()' }
          ],
          qualityScore: 60
        }
      ];

      const stats = analyzer.generateAnalysisStatistics(analyses);

      expect(stats.totalFiles).toBe(2);
      expect(stats.avgQualityScore).toBe(72.5);
      expect(stats.avgDomainRelevance).toBe(0.7);
      expect(stats.mostRelevantTerms.length).toBeGreaterThan(0);
      expect(stats.testCoverage.mustHave).toBe(1);
      expect(stats.testCoverage.shouldHave).toBe(1);
      expect(stats.testCoverage.niceToHave).toBe(1);
    });
  });
});

describe('ContextualScorer', () => {
  let testTerm: DomainTerm;

  beforeEach(() => {
    testTerm = DomainTermManager.createTerm({
      id: 'scoring-term',
      term: 'Database',
      definition: 'Database management functionality',
      category: 'data',
      importance: 'critical',
      aliases: ['db', 'database'],
      examples: [{
        code: 'database.connect()',
        description: 'Connect to database'
      }],
      relatedPatterns: ['db.*', 'database.*'],
      testRequirements: ['Connection test', 'Query test']
    });
  });

  describe('高度な関連度計算', () => {
    test('詳細な関連度内訳', () => {
      const code = `
        function connectDatabase() {
          const db = new Database();
          return db.connect();
        }
      `;

      const result = ContextualScorer.calculateAdvancedTermRelevance(code, testTerm);

      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.breakdown.directMatch).toBeGreaterThan(0);
      expect(result.breakdown.aliasMatch).toBeGreaterThan(0);
      expect(result.breakdown.patternMatch).toBeGreaterThan(0);
    });

    test('文脈マッチングの考慮', () => {
      const code = 'function databaseHandler() { return db.query(); }';
      const context = {
        filePath: 'database-service.js',
        language: 'javascript',
        functions: [{ name: 'databaseHandler', parameters: [], complexity: 1, location: { file: '', line: 1, column: 1 } }],
        classes: [],
        imports: [],
        domainRelevance: 0.8,
        relatedTerms: []
      };

      const result = ContextualScorer.calculateAdvancedTermRelevance(code, testTerm, context);

      expect(result.breakdown.contextualMatch).toBeGreaterThan(0);
    });
  });

  describe('複数用語のランキング', () => {
    test('関連度による用語ランキング', () => {
      const code = 'function processPaymentWithDatabase() { return payment.save(db); }';
      const terms = [
        testTerm, // Database term
        DomainTermManager.createTerm({
          id: 'payment-term',
          term: 'Payment',
          definition: 'Payment processing',
          category: 'financial',
          aliases: ['payment']
        })
      ];

      const ranking = ContextualScorer.rankTermsByRelevance(code, terms);

      expect(ranking.length).toBe(2);
      expect(ranking[0].relevanceScore).toBeGreaterThanOrEqual(ranking[1].relevanceScore);
      
      // Paymentが最初にランクされるべき（直接出現）
      expect(ranking[0].term.term).toBe('Payment');
    });
  });

  describe('ドメイン特化スコアリング', () => {
    test('ドメイン全体のスコアリング', () => {
      const code = `
        class DatabaseService {
          async queryPayments() {
            return await this.db.query('SELECT * FROM payments');
          }
        }
      `;

      const dictionary: DomainDictionary = {
        version: '1.0.0',
        domain: 'financial',
        language: 'ja',
        lastUpdated: new Date(),
        terms: [
          testTerm,
          DomainTermManager.createTerm({
            id: 'payment-term',
            term: 'Payment',
            definition: 'Payment processing',
            category: 'financial',
            importance: 'critical'
          })
        ],
        relationships: [],
        businessRules: [],
        qualityStandards: [],
        contextMappings: []
      };

      const result = ContextualScorer.calculateDomainSpecificScore(code, dictionary);

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.importanceWeightedScore).toBeGreaterThan(0);
      expect(Object.keys(result.categoryScores).length).toBeGreaterThan(0);
      expect(result.categoryScores.data).toBeGreaterThan(0); // Database term
      expect(result.categoryScores.financial).toBeGreaterThan(0); // Payment term
    });
  });

  describe('テスト必要度スコア', () => {
    test('テスト必要度の計算', () => {
      const context = {
        filePath: 'complex-service.js',
        language: 'javascript',
        functions: [
          { name: 'complexFunction', parameters: ['a', 'b', 'c'], complexity: 8, location: { file: '', line: 1, column: 1 } }
        ],
        classes: [],
        imports: [
          { module: 'express', imports: ['express'], type: 'default' as const },
          { module: 'database', imports: ['db'], type: 'named' as const }
        ],
        domainRelevance: 0.8,
        relatedTerms: [testTerm]
      };

      const termRelevances = [{
        term: testTerm,
        relevance: 0.9,
        evidence: ['Database operations detected'],
        locations: []
      }];

      const result = ContextualScorer.calculateTestNecessityScore(context, termRelevances);

      expect(result.overallNecessity).toBeGreaterThan(0);
      expect(result.categoryNecessity.unitTests).toBeGreaterThan(0); // 複雑な関数のため
      expect(result.categoryNecessity.integrationTests).toBeGreaterThan(0); // 多くのインポートのため
      expect(result.prioritizedRequirements.length).toBeGreaterThan(0);
    });
  });
});