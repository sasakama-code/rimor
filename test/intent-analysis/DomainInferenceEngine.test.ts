/**
 * DomainInferenceEngine テストスイート
 * TDD Red Phase - 失敗するテストを先に作成
 */

import { DomainInferenceEngine } from '../../src/intent-analysis/DomainInferenceEngine';
import { TypeInfo } from '../../src/intent-analysis/ITypeScriptAnalyzer';

describe('DomainInferenceEngine', () => {
  let engine: DomainInferenceEngine;

  beforeEach(() => {
    engine = new DomainInferenceEngine();
  });

  describe('inferDomainFromType', () => {
    it('Userクラスからユーザー管理ドメインを推論できる', async () => {
      const typeInfo: TypeInfo = {
        typeName: 'User',
        isPrimitive: false
      };

      const result = await engine.inferDomainFromType(typeInfo);

      expect(result).toEqual({
        domain: 'user-management',
        confidence: 0.9,
        concepts: ['ユーザー', '認証', 'アカウント管理'],
        businessImportance: 'high'
      });
    });

    it('PaymentServiceから決済ドメインを推論できる', async () => {
      const typeInfo: TypeInfo = {
        typeName: 'PaymentService',
        isPrimitive: false
      };

      const result = await engine.inferDomainFromType(typeInfo);

      expect(result).toEqual({
        domain: 'payment',
        confidence: 0.95,
        concepts: ['決済', '支払い', 'トランザクション'],
        businessImportance: 'critical'
      });
    });

    it('プリミティブ型の場合は低信頼度で汎用ドメインを返す', async () => {
      const typeInfo: TypeInfo = {
        typeName: 'string',
        isPrimitive: true
      };

      const result = await engine.inferDomainFromType(typeInfo);

      expect(result).toEqual({
        domain: 'general',
        confidence: 0.1,
        concepts: [],
        businessImportance: 'low'
      });
    });

    it('ジェネリック型の場合は型引数も考慮する', async () => {
      const typeInfo: TypeInfo = {
        typeName: 'Repository',
        isPrimitive: false,
        typeArguments: [{
          typeName: 'Order',
          isPrimitive: false
        }]
      };

      const result = await engine.inferDomainFromType(typeInfo);

      expect(result).toEqual({
        domain: 'order-management',
        confidence: 0.85,
        concepts: ['注文', 'リポジトリ', 'データアクセス'],
        businessImportance: 'high'
      });
    });
  });

  describe('inferDomainFromContext', () => {
    it('ファイルパスとクラス名から文脈的にドメインを推論できる', async () => {
      const context = {
        filePath: '/src/auth/services/AuthenticationService.ts',
        className: 'AuthenticationService',
        imports: ['User', 'Token', 'Permission']
      };

      const result = await engine.inferDomainFromContext(context);

      expect(result.domain).toBe('authentication');
      expect(result.confidence).toBe(0.92);
      expect(result.businessImportance).toBe('critical');
      expect(result.concepts).toContain('認証');
      expect(result.concepts).toContain('アクセス制御');
      expect(result.concepts).toContain('セキュリティ');
      expect(result.relatedDomains).toContain('user-management');
      expect(result.relatedDomains).toContain('security');
    });

    it('複数の文脈情報を総合的に評価できる', async () => {
      const context = {
        filePath: '/src/billing/processors/InvoiceProcessor.ts',
        className: 'InvoiceProcessor',
        imports: ['Invoice', 'Payment', 'Customer', 'TaxCalculator']
      };

      const result = await engine.inferDomainFromContext(context);

      expect(result.domain).toBe('billing');
      expect(result.confidence).toBe(0.88);
      expect(result.businessImportance).toBe('critical');
      expect(result.concepts).toContain('請求');
      expect(result.concepts).toContain('課金');
      expect(result.concepts).toContain('会計');
      expect(result.concepts).toContain('税務');
      expect(result.relatedDomains).toContain('payment');
      expect(result.relatedDomains).toContain('accounting');
    });
  });

  describe('getDomainImportance', () => {
    it('ドメインのビジネス重要度を評価できる', async () => {
      const paymentImportance = await engine.getDomainImportance('payment');
      expect(paymentImportance).toBe('critical');

      const loggingImportance = await engine.getDomainImportance('logging');
      expect(loggingImportance).toBe('medium');

      const utilityImportance = await engine.getDomainImportance('utility');
      expect(utilityImportance).toBe('low');
    });
  });

  describe('既存の辞書システムとの統合', () => {
    it('DomainDictionaryと連携してより精度の高い推論ができる', async () => {
      // 辞書システムにドメイン知識を登録
      await engine.loadDictionary({
        terms: [
          { term: 'User', domain: 'user-management', weight: 0.9 },
          { term: 'Payment', domain: 'payment', weight: 0.95 },
          { term: 'Order', domain: 'e-commerce', weight: 0.85 }
        ],
        rules: [
          { pattern: /.*Service$/, domain: 'service-layer', weight: 0.7 },
          { pattern: /.*Repository$/, domain: 'data-access', weight: 0.8 }
        ]
      });

      const typeInfo: TypeInfo = {
        typeName: 'UserService',
        isPrimitive: false
      };

      const result = await engine.inferDomainFromType(typeInfo);

      // 辞書の知識を活用して、より高精度な推論
      expect(result.confidence).toBeGreaterThan(0.85);
      expect(result.concepts).toContain('ユーザー');
      expect(result.concepts).toContain('サービス層');
    });
  });

  describe('信頼度算出の改善', () => {
    it('設定された信頼度値が固定値ではなく設定可能である', async () => {
      // 現在の実装では信頼度がハードコードされているため、このテストは失敗するはず
      const engine1 = new DomainInferenceEngine();
      const engine2 = new DomainInferenceEngine();
      
      // 同じ型に対して異なる信頼度を設定できるべき
      const typeInfo: TypeInfo = {
        typeName: 'PaymentService',
        isPrimitive: false
      };
      
      // engine1のデフォルト値
      const result1 = await engine1.inferDomainFromType(typeInfo);
      
      // engine2に異なる設定を適用
      engine2.setConfidenceConfig({ typeConfidenceMap: { PaymentService: 0.7 } });
      const result2 = await engine2.inferDomainFromType(typeInfo);
      
      // engine1はデフォルト値
      expect(result1.confidence).toBe(0.95);
      // engine2は設定された値
      expect(result2.confidence).toBe(0.7);
    });

    it('ハードコードされた値の検証', async () => {
      // 現在の実装のハードコード値を明示的に検証
      const testCases = [
        { typeName: 'User', expectedConfidence: 0.9 },
        { typeName: 'PaymentService', expectedConfidence: 0.95 },
        { typeName: 'Order', expectedConfidence: 0.85 },
        { typeName: 'AuthenticationService', expectedConfidence: 0.92 },
        { typeName: 'Invoice', expectedConfidence: 0.88 }
      ];
      
      for (const testCase of testCases) {
        const typeInfo: TypeInfo = {
          typeName: testCase.typeName,
          isPrimitive: false
        };
        
        const result = await engine.inferDomainFromType(typeInfo);
        expect(result.confidence).toBe(testCase.expectedConfidence);
      }
    });


    it('文脈に応じて信頼度が動的に変化する', async () => {
      // 同じ型でも、文脈情報によって信頼度が変化することを検証
      const typeInfo: TypeInfo = {
        typeName: 'ProcessorService',
        isPrimitive: false
      };

      // 文脈1: 支払い処理の文脈
      const paymentContext = {
        filePath: '/src/payment/services/ProcessorService.ts',
        className: 'ProcessorService',
        imports: ['Payment', 'Transaction', 'CreditCard']
      };

      const paymentResult = await engine.inferDomainFromContext(paymentContext);
      
      // 文脈2: 一般的なデータ処理の文脈
      const generalContext = {
        filePath: '/src/utils/services/ProcessorService.ts',
        className: 'ProcessorService',
        imports: ['Logger', 'Config']
      };

      const generalResult = await engine.inferDomainFromContext(generalContext);

      // 支払い文脈の方が信頼度が高いことを検証
      expect(paymentResult.confidence).toBeGreaterThan(generalResult.confidence);
      expect(paymentResult.domain).toBe('payment');
      expect(generalResult.domain).not.toBe('payment');
    });

    it('複数の証拠が重なると信頼度が上昇する', async () => {
      // 単一の証拠
      const singleEvidence: TypeInfo = {
        typeName: 'SimpleService',
        isPrimitive: false
      };
      
      const singleResult = await engine.inferDomainFromType(singleEvidence);

      // 複数の証拠が組み合わさった場合
      const multiEvidence = {
        filePath: '/src/payment/services/PaymentService.ts',
        className: 'PaymentService',
        imports: ['Payment', 'Transaction', 'PaymentGateway', 'PaymentValidator']
      };

      const multiResult = await engine.inferDomainFromContext(multiEvidence);

      // 複数の証拠がある方が信頼度が高い
      expect(multiResult.confidence).toBeGreaterThan(singleResult.confidence);
    });

    it('信頼度は0.0から1.0の範囲に正規化される', async () => {
      // 様々なケースで信頼度が適切な範囲内にあることを検証
      const testCases: TypeInfo[] = [
        { typeName: 'string', isPrimitive: true },
        { typeName: 'UnknownType', isPrimitive: false },
        { typeName: 'PaymentService', isPrimitive: false },
        { typeName: 'Repository', isPrimitive: false, typeArguments: [{ typeName: 'User', isPrimitive: false }] }
      ];

      for (const testCase of testCases) {
        const result = await engine.inferDomainFromType(testCase);
        expect(result.confidence).toBeGreaterThanOrEqual(0.0);
        expect(result.confidence).toBeLessThanOrEqual(1.0);
      }
    });
  });
});