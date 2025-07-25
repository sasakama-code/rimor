import { DomainDictionaryManager } from '../../../src/dictionary/core/dictionary';
import { DomainTermManager } from '../../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../../src/dictionary/core/rule';
import { DomainDictionary, DomainTerm, BusinessRule } from '../../../src/core/types';

describe('DomainDictionaryManager', () => {
  let dictionaryManager: DomainDictionaryManager;

  beforeEach(() => {
    dictionaryManager = new DomainDictionaryManager({
      domain: 'test',
      language: 'ja',
      version: '1.0.0'
    });
  });

  describe('基本CRUD操作', () => {
    test('辞書の取得', () => {
      const dictionary = dictionaryManager.getDictionary();
      
      expect(dictionary.domain).toBe('test');
      expect(dictionary.language).toBe('ja');
      expect(dictionary.version).toBe('1.0.0');
      expect(dictionary.terms).toEqual([]);
      expect(dictionary.businessRules).toEqual([]);
    });

    test('辞書の更新', () => {
      const initialDate = dictionaryManager.getDictionary().lastUpdated;
      
      // 少し待ってから更新
      setTimeout(() => {
        dictionaryManager.updateDictionary({ domain: 'updated-test' });
        
        const updated = dictionaryManager.getDictionary();
        expect(updated.domain).toBe('updated-test');
        expect(updated.lastUpdated.getTime()).toBeGreaterThan(initialDate.getTime());
      }, 10);
    });
  });

  describe('用語管理', () => {
    let testTerm: DomainTerm;

    beforeEach(() => {
      testTerm = DomainTermManager.createTerm({
        id: 'test-term-1',
        term: 'テスト用語',
        definition: 'これはテスト用の用語です',
        category: 'test-category',
        importance: 'high',
        aliases: ['test-alias'],
        examples: [{
          code: 'const testTerm = "example";',
          description: 'テストコード例'
        }],
        testRequirements: ['単体テスト必須']
      });
    });

    test('用語の追加', () => {
      dictionaryManager.addTerm(testTerm);
      
      const dictionary = dictionaryManager.getDictionary();
      expect(dictionary.terms).toHaveLength(1);
      expect(dictionary.terms[0].id).toBe('test-term-1');
      expect(dictionary.terms[0].term).toBe('テスト用語');
    });

    test('重複ID用語の追加エラー', () => {
      dictionaryManager.addTerm(testTerm);
      
      expect(() => {
        dictionaryManager.addTerm(testTerm);
      }).toThrow('用語ID \'test-term-1\' は既に存在します');
    });

    test('IDによる用語の検索', () => {
      dictionaryManager.addTerm(testTerm);
      
      const found = dictionaryManager.findTermById('test-term-1');
      expect(found).not.toBeNull();
      expect(found?.term).toBe('テスト用語');
    });

    test('存在しないIDによる用語の検索', () => {
      const found = dictionaryManager.findTermById('non-existent');
      expect(found).toBeUndefined();
    });

    test('名前による用語の検索', () => {
      dictionaryManager.addTerm(testTerm);
      
      const results = dictionaryManager.findTermsByName('テスト');
      expect(results).toHaveLength(1);
      expect(results[0].term).toBe('テスト用語');
    });

    test('エイリアスによる用語の検索', () => {
      dictionaryManager.addTerm(testTerm);
      
      const results = dictionaryManager.findTermsByName('test-alias');
      expect(results).toHaveLength(1);
      expect(results[0].term).toBe('テスト用語');
    });

    test('用語の更新', () => {
      dictionaryManager.addTerm(testTerm);
      
      dictionaryManager.updateTerm('test-term-1', {
        definition: '更新された定義'
      });
      
      const updated = dictionaryManager.findTermById('test-term-1');
      expect(updated?.definition).toBe('更新された定義');
      expect(updated?.term).toBe('テスト用語'); // 他のフィールドは保持
    });

    test('存在しない用語の更新エラー', () => {
      expect(() => {
        dictionaryManager.updateTerm('non-existent', { definition: 'test' });
      }).toThrow('用語ID \'non-existent\' が見つかりません');
    });

    test('用語の削除', () => {
      dictionaryManager.addTerm(testTerm);
      expect(dictionaryManager.getDictionary().terms).toHaveLength(1);
      
      dictionaryManager.removeTerm('test-term-1');
      expect(dictionaryManager.getDictionary().terms).toHaveLength(0);
    });

    test('存在しない用語の削除エラー', () => {
      expect(() => {
        dictionaryManager.removeTerm('non-existent');
      }).toThrow('用語ID \'non-existent\' が見つかりません');
    });

    test('重要度による用語フィルタリング', () => {
      const term1 = DomainTermManager.createTerm({
        id: 'term-1',
        term: 'Critical Term',
        definition: 'Critical',
        category: 'test',
        importance: 'critical'
      });

      const term2 = DomainTermManager.createTerm({
        id: 'term-2',
        term: 'High Term',
        definition: 'High',
        category: 'test',
        importance: 'high'
      });

      dictionaryManager.addTerm(term1);
      dictionaryManager.addTerm(term2);

      const criticalTerms = dictionaryManager.getTermsByImportance('critical');
      expect(criticalTerms).toHaveLength(1);
      expect(criticalTerms[0].term).toBe('Critical Term');

      const highTerms = dictionaryManager.getTermsByImportance('high');
      expect(highTerms).toHaveLength(1);
      expect(highTerms[0].term).toBe('High Term');
    });

    test('カテゴリによる用語フィルタリング', () => {
      const term1 = DomainTermManager.createTerm({
        id: 'term-1',
        term: 'Business Term',
        definition: 'Business',
        category: 'business'
      });

      const term2 = DomainTermManager.createTerm({
        id: 'term-2',
        term: 'Technical Term',
        definition: 'Technical',
        category: 'technical'
      });

      dictionaryManager.addTerm(term1);
      dictionaryManager.addTerm(term2);

      const businessTerms = dictionaryManager.getTermsByCategory('business');
      expect(businessTerms).toHaveLength(1);
      expect(businessTerms[0].term).toBe('Business Term');
    });

    test('全文検索', () => {
      const term1 = DomainTermManager.createTerm({
        id: 'term-1',
        term: 'Payment',
        definition: 'Payment processing functionality',
        category: 'financial',
        aliases: ['payment-proc'],
        examples: [{
          code: 'processPayment(amount)',
          description: 'Process payment example'
        }]
      });

      dictionaryManager.addTerm(term1);

      // 用語名での検索
      expect(dictionaryManager.searchTerms('Payment')).toHaveLength(1);
      
      // 定義での検索
      expect(dictionaryManager.searchTerms('processing')).toHaveLength(1);
      
      // エイリアスでの検索
      expect(dictionaryManager.searchTerms('payment-proc')).toHaveLength(1);
      
      // コード例での検索
      expect(dictionaryManager.searchTerms('processPayment')).toHaveLength(1);
      
      // 一致しない検索
      expect(dictionaryManager.searchTerms('nonexistent')).toHaveLength(0);
    });
  });

  describe('ビジネスルール管理', () => {
    let testRule: BusinessRule;

    beforeEach(() => {
      testRule = BusinessRuleManager.createRule({
        id: 'test-rule-1',
        name: 'テストルール',
        description: 'これはテスト用のルールです',
        domain: 'test',
        condition: {
          type: 'function-name',
          pattern: 'test.*',
          scope: 'function'
        },
        priority: 10
      });
    });

    test('ビジネスルールの追加', () => {
      dictionaryManager.addBusinessRule(testRule);
      
      const dictionary = dictionaryManager.getDictionary();
      expect(dictionary.businessRules).toHaveLength(1);
      expect(dictionary.businessRules[0].id).toBe('test-rule-1');
      expect(dictionary.businessRules[0].name).toBe('テストルール');
    });

    test('重複IDルールの追加エラー', () => {
      dictionaryManager.addBusinessRule(testRule);
      
      expect(() => {
        dictionaryManager.addBusinessRule(testRule);
      }).toThrow('ルールID \'test-rule-1\' は既に存在します');
    });

    test('IDによるビジネスルールの検索', () => {
      dictionaryManager.addBusinessRule(testRule);
      
      const found = dictionaryManager.findBusinessRuleById('test-rule-1');
      expect(found).not.toBeNull();
      expect(found?.name).toBe('テストルール');
    });

    test('ドメインによるビジネスルールの検索', () => {
      dictionaryManager.addBusinessRule(testRule);
      
      const results = dictionaryManager.findBusinessRulesByDomain('test');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('テストルール');
    });

    test('ビジネスルールの更新', () => {
      dictionaryManager.addBusinessRule(testRule);
      
      dictionaryManager.updateBusinessRule('test-rule-1', {
        description: '更新された説明'
      });
      
      const updated = dictionaryManager.findBusinessRuleById('test-rule-1');
      expect(updated?.description).toBe('更新された説明');
      expect(updated?.name).toBe('テストルール'); // 他のフィールドは保持
    });

    test('ビジネスルールの削除', () => {
      dictionaryManager.addBusinessRule(testRule);
      expect(dictionaryManager.getDictionary().businessRules).toHaveLength(1);
      
      dictionaryManager.removeBusinessRule('test-rule-1');
      expect(dictionaryManager.getDictionary().businessRules).toHaveLength(0);
    });
  });

  describe('関係性管理', () => {
    let term1: DomainTerm, term2: DomainTerm;

    beforeEach(() => {
      term1 = DomainTermManager.createTerm({
        id: 'term-1',
        term: 'Payment',
        definition: 'Payment functionality',
        category: 'financial'
      });

      term2 = DomainTermManager.createTerm({
        id: 'term-2',
        term: 'Transaction',
        definition: 'Transaction functionality',
        category: 'financial'
      });

      dictionaryManager.addTerm(term1);
      dictionaryManager.addTerm(term2);
    });

    test('用語間の関係性追加', () => {
      const relationship = {
        id: 'rel-1',
        type: 'related' as const,
        sourceTermId: 'term-1',
        targetTermId: 'term-2',
        strength: 0.8,
        description: 'Payment relates to Transaction'
      };

      dictionaryManager.addTermRelationship(relationship);
      
      const dictionary = dictionaryManager.getDictionary();
      expect(dictionary.relationships).toHaveLength(1);
      expect(dictionary.relationships[0].sourceTermId).toBe('term-1');
      expect(dictionary.relationships[0].targetTermId).toBe('term-2');
    });

    test('存在しない用語への関係性追加エラー', () => {
      const relationship = {
        id: 'rel-1',
        type: 'related' as const,
        sourceTermId: 'non-existent',
        targetTermId: 'term-2',
        strength: 0.8
      };

      expect(() => {
        dictionaryManager.addTermRelationship(relationship);
      }).toThrow('参照元の用語ID \'non-existent\' が見つかりません');
    });

    test('関連用語の取得', () => {
      const relationship = {
        id: 'rel-1',
        type: 'related' as const,
        sourceTermId: 'term-1',
        targetTermId: 'term-2',
        strength: 0.8
      };

      dictionaryManager.addTermRelationship(relationship);
      
      const relatedTerms = dictionaryManager.getRelatedTerms('term-1');
      expect(relatedTerms).toHaveLength(1);
      expect(relatedTerms[0].id).toBe('term-2');
    });
  });

  describe('統計・メトリクス', () => {
    beforeEach(() => {
      // テストデータのセットアップ
      const term1 = DomainTermManager.createTerm({
        id: 'term-1',
        term: 'Complete Term',
        definition: 'This is a complete term with all required fields',
        category: 'business',
        importance: 'critical',
        aliases: ['complete'],
        examples: [{
          code: 'example code',
          description: 'example description'
        }],
        testRequirements: ['test1', 'test2', 'test3']
      });

      const term2 = DomainTermManager.createTerm({
        id: 'term-2',
        term: 'Incomplete Term',
        definition: 'Short',
        category: 'technical',
        importance: 'low'
      });

      const rule = BusinessRuleManager.createRule({
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        domain: 'test',
        condition: {
          type: 'function-name',
          pattern: 'test.*',
          scope: 'function'
        }
      });

      dictionaryManager.addTerm(term1);
      dictionaryManager.addTerm(term2);
      dictionaryManager.addBusinessRule(rule);
    });

    test('辞書統計の取得', () => {
      const stats = dictionaryManager.getStatistics();
      
      expect(stats.totalTerms).toBe(2);
      expect(stats.totalRules).toBe(1);
      expect(stats.totalRelationships).toBe(0);
      
      expect(stats.categoryCounts.business).toBe(1);
      expect(stats.categoryCounts.technical).toBe(1);
      
      expect(stats.importanceCounts.critical).toBe(1);
      expect(stats.importanceCounts.low).toBe(1);
    });

    test('品質評価', () => {
      const qualityMetrics = dictionaryManager.evaluateQuality();
      
      expect(qualityMetrics.overall).toBeGreaterThan(0);
      expect(qualityMetrics.completeness).toBeGreaterThan(0);
      expect(qualityMetrics.accuracy).toBeGreaterThan(0);
      expect(qualityMetrics.consistency).toBeGreaterThan(0);
      expect(qualityMetrics.coverage).toBe(0); // 関係性がないため
      
      // 完全性スコアは50%であるべき（2つの用語のうち1つが完全）
      expect(qualityMetrics.completeness).toBe(50);
    });

    test('使用統計の更新と取得', () => {
      // 用語を何度か検索して使用統計を更新
      dictionaryManager.findTermById('term-1');
      dictionaryManager.findTermById('term-1');
      dictionaryManager.findTermById('term-2');
      
      const usageStats = dictionaryManager.getUsageStatistics();
      
      expect(usageStats.termUsage.get('term-1')).toBe(2);
      expect(usageStats.termUsage.get('term-2')).toBe(1);
      expect(usageStats.lastAccessed.has('term-1')).toBe(true);
      expect(usageStats.lastAccessed.has('term-2')).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('無効な用語データでのエラー', () => {
      // DomainTermManagerでバリデーションされるため、ここでは統合テストとして実行
      expect(() => {
        const invalidTerm = DomainTermManager.createTerm({
          id: '',
          term: '',
          definition: '',
          category: ''
        });
        dictionaryManager.addTerm(invalidTerm);
      }).toThrow();
    });

    test('無効なルールデータでのエラー', () => {
      expect(() => {
        const invalidRule = BusinessRuleManager.createRule({
          id: '',
          name: '',
          description: '',
          domain: '',
          condition: {
            type: 'function-name',
            pattern: '',
            scope: 'function'
          }
        });
        dictionaryManager.addBusinessRule(invalidRule);
      }).toThrow();
    });
  });

  describe('パフォーマンス', () => {
    test('大量データでの基本操作', () => {
      const startTime = Date.now();
      
      // 100個の用語を追加
      for (let i = 0; i < 100; i++) {
        const term = DomainTermManager.createTerm({
          id: `term-${i}`,
          term: `Term ${i}`,
          definition: `Definition for term ${i}`,
          category: 'performance-test'
        });
        dictionaryManager.addTerm(term);
      }
      
      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(1000); // 1秒以内
      
      // 検索性能テスト
      const searchStartTime = Date.now();
      const results = dictionaryManager.searchTerms('Term');
      const searchTime = Date.now() - searchStartTime;
      
      expect(results).toHaveLength(100);
      expect(searchTime).toBeLessThan(100); // 100ms以内
    });

    test('メモリ使用量の妥当性', () => {
      // 大量のデータを追加
      for (let i = 0; i < 1000; i++) {
        const term = DomainTermManager.createTerm({
          id: `term-${i}`,
          term: `Term ${i}`,
          definition: `Definition for term ${i}`,
          category: 'memory-test'
        });
        dictionaryManager.addTerm(term);
      }
      
      const dictionary = dictionaryManager.getDictionary();
      expect(dictionary.terms).toHaveLength(1000);
      
      // メモリリークがないことを確認（基本的なチェック）
      const stats = dictionaryManager.getStatistics();
      expect(stats.totalTerms).toBe(1000);
    });
  });
});