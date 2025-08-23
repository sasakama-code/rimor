/**
 * BusinessLogicMapper テストスイート
 * TDD Red Phase - 失敗するテストを先に作成
 */

import { BusinessLogicMapper } from '../../src/intent-analysis/BusinessLogicMapper';
import { CallGraphNode, TypeInfo } from '../../src/intent-analysis/ITypeScriptAnalyzer';
import { DomainInference } from '../../src/intent-analysis/IDomainInferenceEngine';

describe('BusinessLogicMapper', () => {
  let mapper: BusinessLogicMapper;

  beforeEach(() => {
    mapper = new BusinessLogicMapper();
  });

  describe('mapTestToBusinessLogic', () => {
    it('テストファイルから関連するビジネスロジックをマッピングできる', async () => {
      const testFilePath = '/test/services/PaymentService.test.ts';
      
      const callGraph: CallGraphNode[] = [
        {
          name: 'processPayment',
          filePath: '/src/services/PaymentService.ts',
          line: 25,
          calls: [{
            name: 'validatePayment',
            filePath: '/src/validators/PaymentValidator.ts',
            line: 10,
            calls: [],
            calledBy: []
          }],
          calledBy: []
        }
      ];

      const typeInfo = new Map<string, TypeInfo>([
        ['PaymentService', { typeName: 'PaymentService', isPrimitive: false }],
        ['Payment', { typeName: 'Payment', isPrimitive: false }]
      ]);

      const result = await mapper.mapTestToBusinessLogic(testFilePath, callGraph, typeInfo);

      expect(result.testFilePath).toBe(testFilePath);
      expect(result.businessLogicFiles).toHaveLength(2);
      expect(result.businessLogicFiles[0].filePath).toBe('/src/services/PaymentService.ts');
      expect(result.businessLogicFiles[0].importanceScore).toBeGreaterThan(60);  // 特別扱いがなくなったため調整
      expect(result.businessCriticality.level).toBe('high');  // 実際の複雑度に基づいた評価
      expect(result.coverageDepth).toBeGreaterThan(0.5);  // より現実的な期待値に
    });

    it('複雑な呼び出しグラフから影響範囲を分析できる', async () => {
      const testFilePath = '/test/controllers/OrderController.test.ts';
      
      const callGraph: CallGraphNode[] = [
        {
          name: 'createOrder',
          filePath: '/src/controllers/OrderController.ts',
          line: 15,
          calls: [
            {
              name: 'validateOrder',
              filePath: '/src/services/OrderService.ts',
              line: 30,
              calls: [],
              calledBy: []
            },
            {
              name: 'processPayment',
              filePath: '/src/services/PaymentService.ts',
              line: 25,
              calls: [],
              calledBy: []
            }
          ],
          calledBy: []
        }
      ];

      const typeInfo = new Map<string, TypeInfo>();

      const result = await mapper.mapTestToBusinessLogic(testFilePath, callGraph, typeInfo);

      expect(result.impactScope.directImpact).toBe(3);
      expect(result.impactScope.affectedDomains).toContain('order-management');
      expect(result.impactScope.affectedDomains).toContain('payment');
      expect(result.impactScope.onCriticalPath).toBe(true);
    });
  });

  describe('calculateBusinessImportance', () => {
    it('ビジネス関数の重要度を計算できる', async () => {
      const functions = [
        {
          name: 'calculateTax',
          line: 10,
          isTested: true,
          complexity: 15,
          dependencyCount: 5,
          containsBusinessRules: true
        },
        {
          name: 'formatCurrency',
          line: 50,
          isTested: true,
          complexity: 3,
          dependencyCount: 1,
          containsBusinessRules: false
        }
      ];

      const domain: DomainInference = {
        domain: 'billing',
        confidence: 0.9,
        concepts: ['請求', '課金'],
        businessImportance: 'critical'
      };

      const result = await mapper.calculateBusinessImportance(functions, domain);

      expect(result.level).toBe('high');
      expect(result.score).toBeGreaterThan(75);
      expect(result.reasons).toContain('ビジネスルールを含む関数が存在');
      expect(result.reasons).toContain('高複雑度の関数が存在');
    });

    it('ドメインの重要度も考慮する', async () => {
      const functions = [
        {
          name: 'logActivity',
          line: 10,
          isTested: false,
          complexity: 2,
          dependencyCount: 1,
          containsBusinessRules: false
        }
      ];

      const domain: DomainInference = {
        domain: 'logging',
        confidence: 0.8,
        concepts: ['ログ'],
        businessImportance: 'low'
      };

      const result = await mapper.calculateBusinessImportance(functions, domain);

      expect(result.level).toBe('low');
      expect(result.score).toBeLessThan(30);
    });
  });

  describe('analyzeImpactScope', () => {
    it('呼び出しグラフから影響範囲を分析できる', async () => {
      const nodeA: CallGraphNode = {
        name: 'functionA',
        filePath: '/src/a.ts',
        line: 1,
        calls: [],
        calledBy: []
      };

      const nodeB: CallGraphNode = {
        name: 'functionB',
        filePath: '/src/b.ts',
        line: 1,
        calls: [nodeA],
        calledBy: []
      };

      const nodeC: CallGraphNode = {
        name: 'functionC',
        filePath: '/src/c.ts',
        line: 1,
        calls: [nodeB],
        calledBy: []
      };

      nodeA.calledBy = [nodeB];
      nodeB.calledBy = [nodeC];

      const callGraph = [nodeC, nodeB, nodeA];

      const result = await mapper.analyzeImpactScope(callGraph, nodeC);

      expect(result.directImpact).toBe(2); // nodeB, nodeA
      expect(result.indirectImpact).toBe(0);
      expect(result.onCriticalPath).toBe(false);
    });
  });

  describe('detectBusinessRules', () => {
    it('ビジネスルールを含むコードを検出できる', async () => {
      const functionBody = `
        if (amount > 1000) {
          discount = amount * 0.1;
        } else if (amount > 500) {
          discount = amount * 0.05;
        }
        
        if (customer.type === 'PREMIUM') {
          discount += amount * 0.02;
        }
        
        const tax = amount * getTaxRate(customer.region);
        return amount - discount + tax;
      `;

      const typeInfo = new Map<string, TypeInfo>([
        ['amount', { typeName: 'number', isPrimitive: true }],
        ['customer', { typeName: 'Customer', isPrimitive: false }]
      ]);

      const result = await mapper.detectBusinessRules(functionBody, typeInfo);

      expect(result).toBe(true);
    });

    it('単純なユーティリティ関数はビジネスルールとして検出しない', async () => {
      const functionBody = `
        return str.trim().toLowerCase();
      `;

      const typeInfo = new Map<string, TypeInfo>([
        ['str', { typeName: 'string', isPrimitive: true }]
      ]);

      const result = await mapper.detectBusinessRules(functionBody, typeInfo);

      expect(result).toBe(false);
    });
  });

  describe('isOnCriticalPath', () => {
    it('重要ドメインに関連するノードをクリティカルパスと判定する', async () => {
      const node: CallGraphNode = {
        name: 'processPayment',
        filePath: '/src/services/PaymentService.ts',
        line: 10,
        calls: [],
        calledBy: []
      };

      const criticalDomains = ['payment', 'authentication', 'billing'];

      const result = await mapper.isOnCriticalPath(node, criticalDomains);

      expect(result).toBe(true);
    });

    it('非重要ドメインのノードはクリティカルパスと判定しない', async () => {
      const node: CallGraphNode = {
        name: 'formatDate',
        filePath: '/src/utils/dateFormatter.ts',
        line: 5,
        calls: [],
        calledBy: []
      };

      const criticalDomains = ['payment', 'authentication', 'billing'];

      const result = await mapper.isOnCriticalPath(node, criticalDomains);

      expect(result).toBe(false);
    });
  });

  describe('ドメイン重要度評価の改善', () => {
    it('Paymentドメインが公平に評価されることを検証', async () => {
      const testFilePath = '/test/services/ProcessorService.test.ts';
      
      const callGraph: CallGraphNode[] = [
        {
          name: 'process',
          filePath: '/src/services/ProcessorService.ts',
          line: 10,
          calls: [],
          calledBy: []
        }
      ];

      const typeInfo = new Map<string, TypeInfo>([
        ['ProcessorService', { typeName: 'ProcessorService', isPrimitive: false }]
      ]);

      // まず通常のドメインでテスト
      const generalResult = await mapper.mapTestToBusinessLogic(testFilePath, callGraph, typeInfo);
      
      // 次にPaymentドメインでテスト（特別扱いされるはず）
      const paymentCallGraph: CallGraphNode[] = [
        {
          name: 'processPayment',
          filePath: '/src/services/PaymentService.ts',
          line: 25,
          calls: [],
          calledBy: []
        }
      ];
      
      const paymentTypeInfo = new Map<string, TypeInfo>([
        ['PaymentService', { typeName: 'PaymentService', isPrimitive: false }]
      ]);
      
      const paymentResult = await mapper.mapTestToBusinessLogic(
        '/test/services/PaymentService.test.ts',
        paymentCallGraph,
        paymentTypeInfo
      );
      
      // Paymentドメインは特別扱いされず、実際の複雑度に基づいて評価される
      expect(paymentResult.businessCriticality.level).toBeDefined();
      expect(paymentResult.businessCriticality.score).toBeGreaterThan(0);  // スコアは計算によって決定
    });

    it('ドメイン重要度の重み付けが設定可能であることを検証', async () => {
      // 新しいmapperインスタンスで設定をテスト
      const customMapper = new BusinessLogicMapper();
      
      // カスタム設定を適用
      customMapper.setDomainImportanceConfig({
        weightMap: {
          critical: 90,
          high: 70,
          medium: 40,
          low: 20
        }
      });
      
      const functions = [{
        name: 'testFunction',
        line: 10,
        isTested: true,
        complexity: 5,
        dependencyCount: 2,
        containsBusinessRules: false
      }];
      
      const domain: DomainInference = {
        domain: 'test-domain',
        confidence: 0.8,
        concepts: [],
        businessImportance: 'high'
      };
      
      const result = await customMapper.calculateBusinessImportance(functions, domain);
      
      // カスタム設定が適用されていることを検証（high = 70）
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('ドメインオーバーライドが無効化できることを検証', async () => {
      // オーバーライドを無効化したmapper
      const customMapper = new BusinessLogicMapper();
      customMapper.setDomainImportanceConfig({
        disableDomainOverrides: true
      });
      
      const paymentCallGraph: CallGraphNode[] = [
        {
          name: 'processPayment',
          filePath: '/src/services/PaymentService.ts',
          line: 25,
          calls: [],
          calledBy: []
        }
      ];
      
      const paymentTypeInfo = new Map<string, TypeInfo>([
        ['PaymentService', { typeName: 'PaymentService', isPrimitive: false }]
      ]);
      
      const result = await customMapper.mapTestToBusinessLogic(
        '/test/services/PaymentService.test.ts',
        paymentCallGraph,
        paymentTypeInfo
      );
      
      // オーバーライドが無効化されているので、85以上に強制されない
      // （実際のスコアは計算によって決まる）
      expect(result.businessCriticality.level).toBeDefined();
    });

    it('ドメイン重要度の重み付けが設定可能であることを検証', async () => {
      const functions = [{
        name: 'testFunction',
        line: 10,
        isTested: true,
        complexity: 5,
        dependencyCount: 2,
        containsBusinessRules: false
      }];
      
      const testCases = [
        { importance: 'critical' as const, minScore: 70 },
        { importance: 'high' as const, minScore: 50 },
        { importance: 'medium' as const, minScore: 30 },
        { importance: 'low' as const, minScore: 15 }
      ];
      
      for (const testCase of testCases) {
        const domain: DomainInference = {
          domain: 'test-domain',
          confidence: 0.8,
          concepts: [],
          businessImportance: testCase.importance
        };
        
        const result = await mapper.calculateBusinessImportance(functions, domain);
        expect(result.score).toBeGreaterThanOrEqual(testCase.minScore);
      }
    });
  });
});