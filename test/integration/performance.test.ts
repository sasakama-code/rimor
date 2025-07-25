import { DictionaryAwarePluginManager } from '../../src/core/DictionaryAwarePluginManager';
import { DomainTermCoveragePlugin } from '../../src/plugins/domain/DomainTermCoveragePlugin';
import { DomainDictionaryManager } from '../../src/dictionary/core/dictionary';
import { DomainTermManager } from '../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../src/dictionary/core/rule';
import { DictionarySpecificCache } from '../../src/dictionary/storage/cache';
import { ContextEngine } from '../../src/dictionary/context/engine';
import { DomainDictionary } from '../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Integration Tests', () => {
  let pluginManager: DictionaryAwarePluginManager;
  let largeDictionary: DomainDictionary;
  let tempDir: string;

  beforeAll(() => {
    tempDir = path.join(__dirname, '../fixtures/performance');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  beforeEach(() => {
    pluginManager = new DictionaryAwarePluginManager();
    largeDictionary = createLargeDictionary();
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('大規模辞書の性能テスト', () => {
    test('1000個の用語を持つ辞書での検索性能', async () => {
      const dictionaryManager = new DomainDictionaryManager({
        domain: 'large-scale',
        language: 'ja',
        version: '1.0.0'
      });

      // 1000個の用語を追加
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        const term = DomainTermManager.createTerm({
          id: `term-${i}`,
          term: `Term${i}`,
          definition: `Definition for term ${i}`,
          category: 'performance-test',
          importance: i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'medium'
        });
        dictionaryManager.addTerm(term);
      }
      const addTime = Date.now() - startTime;

      // 検索性能テスト
      const searchStartTime = Date.now();
      for (let i = 0; i < 100; i++) {
        const results = dictionaryManager.searchTerms(`Term${i}`);
        expect(results.length).toBeGreaterThan(0);
      }
      const searchTime = Date.now() - searchStartTime;

      // 統計取得性能
      const statsStartTime = Date.now();
      const stats = dictionaryManager.getStatistics();
      const statsTime = Date.now() - statsStartTime;

      console.log(`性能テスト結果:`);
      console.log(`  - 1000用語追加時間: ${addTime}ms`);
      console.log(`  - 100回検索時間: ${searchTime}ms (平均: ${searchTime/100}ms/回)`);
      console.log(`  - 統計取得時間: ${statsTime}ms`);

      // 性能要件の確認
      expect(addTime).toBeLessThan(5000); // 5秒以内
      expect(searchTime).toBeLessThan(1000); // 1秒以内で100回検索
      expect(statsTime).toBeLessThan(100); // 100ms以内
      expect(stats.totalTerms).toBe(1000);
    });

    test('大量データでのキャッシュ性能', async () => {
      const cache = new DictionarySpecificCache({
        maxMemoryEntries: 1000,
        defaultTTL: 30
      });

      // 1000個のエントリをキャッシュ
      const cacheStartTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        await cache.cacheTerm(`term-${i}`, {
          id: `term-${i}`,
          term: `CachedTerm${i}`,
          definition: `Cached definition ${i}`
        });
      }
      const cacheTime = Date.now() - cacheStartTime;

      // キャッシュからの取得性能
      const retrieveStartTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        const cachedTerm = await cache.getTerm(`term-${i}`);
        expect(cachedTerm).toBeDefined();
      }
      const retrieveTime = Date.now() - retrieveStartTime;

      // 統計情報
      const stats = cache.getDictionaryStats();

      console.log(`キャッシュ性能テスト結果:`);
      console.log(`  - 1000エントリキャッシュ時間: ${cacheTime}ms`);
      console.log(`  - 1000エントリ取得時間: ${retrieveTime}ms`);
      console.log(`  - メモリキャッシュエントリ数: ${stats.terms}`);

      expect(cacheTime).toBeLessThan(2000); // 2秒以内
      expect(retrieveTime).toBeLessThan(500); // 500ms以内
      expect(stats.terms).toBe(1000);
    });

    test('大きなファイルでの分析性能', async () => {
      // 大きなテストファイルを生成
      const largeFilePath = path.join(tempDir, 'large-test-file.ts');
      let largeContent = `
        import { PaymentService } from '../src/payment-service';
        import { UserService } from '../src/user-service';
        import { OrderService } from '../src/order-service';
        
        describe('Large Performance Test Suite', () => {
      `;

      // 1000個のテストケースを生成
      for (let i = 0; i < 1000; i++) {
        largeContent += `
          test('payment test case ${i}', async () => {
            const paymentService = new PaymentService();
            const userService = new UserService();
            const orderService = new OrderService();
            
            const user = await userService.createUser({
              id: ${i},
              email: 'user${i}@example.com',
              type: 'premium'
            });
            
            const order = await orderService.createOrder({
              userId: user.id,
              items: [{ productId: ${i}, quantity: 1, price: ${(i + 1) * 10} }]
            });
            
            const payment = await paymentService.processPayment({
              orderId: order.id,
              amount: order.total,
              currency: 'USD'
            });
            
            expect(user.id).toBe(${i});
            expect(order.total).toBeGreaterThan(0);
            expect(payment.status).toBe('completed');
            expect(payment.amount).toBe(order.total);
          });
        `;
      }

      largeContent += '});';
      fs.writeFileSync(largeFilePath, largeContent, 'utf-8');

      // プラグイン登録
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      
      // 辞書を設定
      (pluginManager as any).loadedDictionaries.set('performance', largeDictionary);
      (pluginManager as any).dictionaryEnabled = true;

      // 分析性能テスト
      const analysisStartTime = Date.now();
      const results = await pluginManager.runAllWithDictionary(largeFilePath, 'performance');
      const analysisTime = Date.now() - analysisStartTime;

      console.log(`大規模ファイル分析性能:`);
      console.log(`  - ファイルサイズ: ${Math.round(fs.statSync(largeFilePath).size / 1024)}KB`);
      console.log(`  - 分析時間: ${analysisTime}ms`);
      console.log(`  - 検出結果数: ${results.contextualResults.length + results.pluginResults.length}`);

      expect(analysisTime).toBeLessThan(30000); // 30秒以内
      expect(results.contextualResults.length).toBeGreaterThan(0);
    });
  });

  describe('並列処理性能テスト', () => {
    test('複数ファイルの並列分析', async () => {
      // 複数のテストファイルを作成
      const filePaths: string[] = [];
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(tempDir, `parallel-test-${i}.ts`);
        const content = `
          import { Service${i} } from '../src/service${i}';
          
          describe('Parallel Test ${i}', () => {
            test('should process payment ${i}', () => {
              const service = new Service${i}();
              const payment = service.processPayment(${(i + 1) * 100});
              expect(payment.amount).toBe(${(i + 1) * 100});
            });
            
            test('should validate user ${i}', () => {
              const service = new Service${i}();
              const user = service.createUser({ id: ${i} });
              expect(user.id).toBe(${i});
            });
          });
        `;
        fs.writeFileSync(filePath, content, 'utf-8');
        filePaths.push(filePath);
      }

      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);
      (pluginManager as any).loadedDictionaries.set('parallel', largeDictionary);
      (pluginManager as any).dictionaryEnabled = true;

      // 順次実行
      const sequentialStartTime = Date.now();
      for (const filePath of filePaths) {
        await pluginManager.runAllWithDictionary(filePath, 'parallel');
      }
      const sequentialTime = Date.now() - sequentialStartTime;

      // 並列実行
      const parallelStartTime = Date.now();
      const parallelPromises = filePaths.map(filePath => 
        pluginManager.runAllWithDictionary(filePath, 'parallel')
      );
      await Promise.all(parallelPromises);
      const parallelTime = Date.now() - parallelStartTime;

      console.log(`並列処理性能比較:`);
      console.log(`  - 順次実行時間: ${sequentialTime}ms`);
      console.log(`  - 並列実行時間: ${parallelTime}ms`);
      console.log(`  - 性能向上: ${Math.round((sequentialTime / parallelTime) * 100)}%`);

      // 並列実行の方が速いことを確認
      expect(parallelTime).toBeLessThan(sequentialTime);
      // CI環境での性能変動を考慮して、最低10%の性能向上を期待
      expect(parallelTime).toBeLessThan(sequentialTime * 0.9); // 最低10%の性能向上
    });

    test('メモリ使用量の監視', async () => {
      const initialMemory = process.memoryUsage();
      
      // 大量データでの処理
      const dictionaryManager = new DomainDictionaryManager({
        domain: 'memory-test',
        language: 'ja',
        version: '1.0.0'
      });

      // 10000個の用語を追加
      for (let i = 0; i < 10000; i++) {
        const term = DomainTermManager.createTerm({
          id: `memory-term-${i}`,
          term: `MemoryTerm${i}`,
          definition: `Memory test term ${i} with longer description to simulate real world usage patterns`,
          category: 'memory-test',
          importance: 'medium',
          aliases: [`alias${i}`, `alt${i}`],
          examples: [{
            code: `function processMemoryTerm${i}() { return "${i}"; }`,
            description: `Example for memory term ${i}`
          }]
        });
        dictionaryManager.addTerm(term);
      }

      const afterLoadMemory = process.memoryUsage();

      // メモリ使用量の計算
      const memoryIncrease = {
        heapUsed: afterLoadMemory.heapUsed - initialMemory.heapUsed,
        heapTotal: afterLoadMemory.heapTotal - initialMemory.heapTotal,
        rss: afterLoadMemory.rss - initialMemory.rss
      };

      console.log(`メモリ使用量テスト結果:`);
      console.log(`  - ヒープ使用量増加: ${Math.round(memoryIncrease.heapUsed / 1024 / 1024)}MB`);
      console.log(`  - 総ヒープ増加: ${Math.round(memoryIncrease.heapTotal / 1024 / 1024)}MB`);
      console.log(`  - RSS増加: ${Math.round(memoryIncrease.rss / 1024 / 1024)}MB`);

      // メモリ使用量が妥当であることを確認（100MB以下）
      expect(memoryIncrease.heapUsed).toBeLessThan(100 * 1024 * 1024);
      expect(memoryIncrease.rss).toBeLessThan(200 * 1024 * 1024);
    });
  });

  describe('エラーハンドリング負荷テスト', () => {
    test('大量のエラー発生時の性能', async () => {
      const plugin = new DomainTermCoveragePlugin();
      pluginManager.registerDictionaryAwarePlugin(plugin);

      // 存在しない辞書での分析を大量実行
      const errorStartTime = Date.now();
      const errorPromises: Promise<any>[] = [];
      
      for (let i = 0; i < 100; i++) {
        const promise = pluginManager.runDictionaryAwarePlugin(
          'domain-term-coverage',
          '/non-existent-file.ts',
          'non-existent-domain'
        ).catch(() => null); // エラーを捕捉
        errorPromises.push(promise);
      }

      const results = await Promise.all(errorPromises);
      const errorTime = Date.now() - errorStartTime;

      console.log(`エラーハンドリング負荷テスト:`);
      console.log(`  - 100回のエラー処理時間: ${errorTime}ms`);
      console.log(`  - 平均エラー処理時間: ${errorTime/100}ms`);

      // エラーが適切に処理されることを確認
      expect(results.every(result => result === null)).toBe(true);
      expect(errorTime).toBeLessThan(5000); // 5秒以内でエラー処理完了
    });
  });

  // ヘルパー関数
  function createLargeDictionary(): DomainDictionary {
    const dictionaryManager = new DomainDictionaryManager({
      domain: 'performance',
      language: 'ja',
      version: '1.0.0'
    });

    // 100個の用語を追加
    for (let i = 0; i < 100; i++) {
      const term = DomainTermManager.createTerm({
        id: `perf-term-${i}`,
        term: `PerfTerm${i}`,
        definition: `Performance test term ${i}`,
        category: i % 3 === 0 ? 'technical' : i % 2 === 0 ? 'business' : 'domain',
        importance: i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'medium'
      });
      dictionaryManager.addTerm(term);
    }

    // 50個のビジネスルールを追加
    for (let i = 0; i < 50; i++) {
      const rule = BusinessRuleManager.createRule({
        id: `perf-rule-${i}`,
        name: `Performance Rule ${i}`,
        description: `Performance test rule ${i}`,
        domain: 'performance',
        condition: {
          type: 'function-name',
          pattern: `.*perf.*${i}.*`,
          scope: 'function'
        },
        priority: i % 10 + 1
      });
      dictionaryManager.addBusinessRule(rule);
    }

    return dictionaryManager.getDictionary();
  }
});