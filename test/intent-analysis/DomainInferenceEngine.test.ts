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
});