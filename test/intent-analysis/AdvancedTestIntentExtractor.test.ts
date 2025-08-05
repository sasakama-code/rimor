/**
 * Advanced TestIntentExtractor テストスイート
 * v0.9.0 Phase 2 - 高度な意図推論のテスト
 */

import { TestIntentExtractor } from '../../src/intent-analysis/TestIntentExtractor';
import { TreeSitterParser, SupportedLanguage } from '../../src/intent-analysis/TreeSitterParser';
import { DomainInferenceEngine } from '../../src/intent-analysis/DomainInferenceEngine';
import { BusinessLogicMapper } from '../../src/intent-analysis/BusinessLogicMapper';
import { TypeInfo, CallGraphNode } from '../../src/intent-analysis/ITypeScriptAnalyzer';

describe('Advanced TestIntentExtractor - Phase 2', () => {
  let extractor: TestIntentExtractor;
  let parser: TreeSitterParser;
  let domainEngine: DomainInferenceEngine;
  let businessMapper: BusinessLogicMapper;

  beforeEach(() => {
    parser = TreeSitterParser.getInstance();
    domainEngine = new DomainInferenceEngine();
    businessMapper = new BusinessLogicMapper();
    extractor = new TestIntentExtractor(parser);
    
    // ExtractorにDomainEngineとBusinessMapperを注入
    (extractor as any).domainEngine = domainEngine;
    (extractor as any).businessMapper = businessMapper;
  });

  describe('evaluateRealizationWithTypeInfo - 型情報を活用した評価', () => {
    it('型情報を使用してより精度の高い評価ができる', async () => {
      const testCode = `
        describe('PaymentService', () => {
          it('should process payment for premium customer', async () => {
            const customer = { type: 'PREMIUM', id: '123' };
            const payment = { amount: 1000, currency: 'USD' };
            
            const result = await paymentService.processPayment(customer, payment);
            
            expect(result.status).toBe('success');
            expect(result.discount).toBeGreaterThan(0);
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      const typeInfo = new Map<string, TypeInfo>([
        ['customer', { typeName: 'Customer', isPrimitive: false }],
        ['payment', { typeName: 'Payment', isPrimitive: false }],
        ['paymentService', { typeName: 'PaymentService', isPrimitive: false }]
      ]);

      // 高度な評価メソッドを呼び出す（実装予定）
      const intent = await extractor.extractIntent('test.ts', ast);
      const actual = await extractor.analyzeActualTest('test.ts', ast);
      
      // 型情報を使用した高度な評価
      const result = await (extractor as any).evaluateRealizationWithTypeInfo(
        intent,
        actual,
        typeInfo
      );

      expect(result.domainRelevance).toBeDefined();
      expect(result.domainRelevance.domain).toBe('payment');
      expect(result.domainRelevance.confidence).toBeGreaterThan(0.7);  // デフォルト値に合わせて調整
      expect(result.businessImportance).toBe('high');  // 特別扱いが削除されたため
    });

    it('ドメイン固有のギャップを検出できる', async () => {
      const testCode = `
        describe('UserService', () => {
          it('should create user', () => {
            const user = { name: 'John' };
            const result = userService.createUser(user);
            expect(result.id).toBeDefined();
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      const typeInfo = new Map<string, TypeInfo>([
        ['user', { typeName: 'User', isPrimitive: false }],
        ['userService', { typeName: 'UserService', isPrimitive: false }]
      ]);

      const intent = await extractor.extractIntent('test.ts', ast);
      const actual = await extractor.analyzeActualTest('test.ts', ast);
      
      const result = await (extractor as any).evaluateRealizationWithTypeInfo(
        intent,
        actual,
        typeInfo
      );

      // ユーザー管理ドメインでは認証・認可のテストが重要
      expect(result.domainSpecificGaps).toBeDefined();
      expect(result.domainSpecificGaps).toContainEqual(
        expect.objectContaining({
          type: 'MISSING_DOMAIN_REQUIREMENT',
          description: expect.stringContaining('認証'),
          domain: 'user-management'
        })
      );
    });
  });

  describe('analyzeWithBusinessContext - ビジネスロジックとの関連分析', () => {
    it('テストとビジネスロジックの関連を分析できる', async () => {
      const testCode = `
        describe('OrderService', () => {
          it('should calculate total with tax', () => {
            const order = { items: [{price: 100}], region: 'JP' };
            const total = orderService.calculateTotal(order);
            expect(total).toBe(110); // 10% tax
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      const callGraph: CallGraphNode[] = [
        {
          name: 'calculateTotal',
          filePath: '/src/services/OrderService.ts',
          line: 15,
          calls: [
            {
              name: 'calculateTax',
              filePath: '/src/utils/TaxCalculator.ts',
              line: 5,
              calls: [],
              calledBy: []
            }
          ],
          calledBy: []
        }
      ];

      const result = await (extractor as any).analyzeWithBusinessContext(
        'test.ts',
        ast,
        callGraph
      );

      expect(result.businessLogicCoverage).toBeDefined();
      expect(result.businessLogicCoverage.coveredFunctions).toContain('calculateTotal');
      expect(result.businessLogicCoverage.coveredFunctions).toContain('calculateTax');
      expect(result.businessLogicCoverage.criticalPathCoverage).toBe(true);
      expect(result.riskAssessment.businessRisk).toBe('low'); // 税計算がテストされている
    });

    it('ビジネスルールのカバレッジ不足を検出できる', async () => {
      const testCode = `
        describe('PricingService', () => {
          it('should calculate price', () => {
            const product = { basePrice: 100 };
            const price = pricingService.calculatePrice(product);
            expect(price).toBe(100);
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      const callGraph: CallGraphNode[] = [
        {
          name: 'calculatePrice',
          filePath: '/src/services/PricingService.ts',
          line: 20,
          calls: [
            {
              name: 'applyDiscounts',
              filePath: '/src/services/PricingService.ts',
              line: 35,
              calls: [],
              calledBy: []
            },
            {
              name: 'applyPromotions',
              filePath: '/src/services/PricingService.ts',
              line: 50,
              calls: [],
              calledBy: []
            }
          ],
          calledBy: []
        }
      ];

      const result = await (extractor as any).analyzeWithBusinessContext(
        'test.ts',
        ast,
        callGraph
      );

      // 割引やプロモーションのロジックがテストされていない
      expect(result.businessLogicCoverage.uncoveredFunctions).toContain('applyDiscounts');
      expect(result.businessLogicCoverage.uncoveredFunctions).toContain('applyPromotions');
      expect(result.suggestions).toContainEqual(
        expect.objectContaining({
          priority: 'high',
          description: expect.stringContaining('割引ロジック')
        })
      );
    });
  });

  describe('generateSmartSuggestions - AI駆動の改善提案', () => {
    it('ドメインとビジネスコンテキストに基づいた提案を生成できる', async () => {
      const testCode = `
        describe('AuthenticationService', () => {
          it('should login user', () => {
            const credentials = { username: 'test', password: 'pass' };
            const result = authService.login(credentials);
            expect(result.token).toBeDefined();
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.TYPESCRIPT);
      const typeInfo = new Map<string, TypeInfo>([
        ['authService', { typeName: 'AuthenticationService', isPrimitive: false }]
      ]);

      const suggestions = await (extractor as any).generateSmartSuggestions(
        'test.ts',
        ast,
        typeInfo
      );

      // 認証ドメインでは以下のテストが重要
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          category: 'security',
          importance: 'critical',
          suggestion: expect.stringContaining('無効な認証情報')
        })
      );
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          category: 'security',
          importance: 'critical',
          suggestion: expect.stringContaining('ブルートフォース')
        })
      );
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          category: 'security',
          importance: 'high',
          suggestion: expect.stringContaining('トークンの有効期限')
        })
      );
    });
  });
});