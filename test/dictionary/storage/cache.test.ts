import { DictionarySpecificCache } from '../../../src/dictionary/storage/cache';

describe('DictionarySpecificCache', () => {
  let cache: DictionarySpecificCache;

  beforeEach(() => {
    cache = new DictionarySpecificCache({
      maxMemoryEntries: 100,
      defaultTTL: 30
    });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('constructor', () => {
    test('デフォルト設定で初期化される', () => {
      const defaultCache = new DictionarySpecificCache();
      expect(defaultCache).toBeDefined();
    });

    test('カスタム設定で初期化される', () => {
      const customCache = new DictionarySpecificCache({
        maxMemoryEntries: 50,
        defaultTTL: 60
      });
      expect(customCache).toBeDefined();
    });
  });

  describe('cacheTerm', () => {
    const mockTerm = {
      id: 'test-term',
      term: 'TestTerm',
      definition: 'Test definition'
    };

    test('用語が正常にキャッシュされる', async () => {
      await cache.cacheTerm('test-key', mockTerm);
      
      const cachedTerm = await cache.getTerm('test-key');
      expect(cachedTerm).toEqual(mockTerm);
    });

    test('TTL付きで用語がキャッシュされる', async () => {
      await cache.cacheTerm('test-key', mockTerm, 10);
      
      const cachedTerm = await cache.getTerm('test-key');
      expect(cachedTerm).toEqual(mockTerm);
    });

    test('同じキーで上書きできる', async () => {
      await cache.cacheTerm('test-key', mockTerm);
      
      const updatedTerm = { ...mockTerm, definition: 'Updated definition' };
      await cache.cacheTerm('test-key', updatedTerm);
      
      const cachedTerm = await cache.getTerm('test-key');
      expect(cachedTerm?.definition).toBe('Updated definition');
    });
  });

  describe('getTerm', () => {
    const mockTerm = {
      id: 'test-term',
      term: 'TestTerm',
      definition: 'Test definition'
    };

    test('存在する用語を取得できる', async () => {
      await cache.cacheTerm('test-key', mockTerm);
      
      const result = await cache.getTerm('test-key');
      expect(result).toEqual(mockTerm);
    });

    test('存在しない用語でnullを返す', async () => {
      const result = await cache.getTerm('non-existent');
      expect(result).toBeNull();
    });

    test('期限切れの用語でnullを返す', async () => {
      await cache.cacheTerm('test-key', mockTerm, 0.001); // 1ms TTL
      
      // 少し待つ
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await cache.getTerm('test-key');
      expect(result).toBeNull();
    });
  });

  describe('cacheRule', () => {
    const mockRule = {
      id: 'test-rule',
      name: 'TestRule',
      description: 'Test rule'
    };

    test('ルールが正常にキャッシュされる', async () => {
      await cache.cacheRule('rule-key', mockRule);
      
      const cachedRule = await cache.getRule('rule-key');
      expect(cachedRule).toEqual(mockRule);
    });

    test('TTL付きでルールがキャッシュされる', async () => {
      await cache.cacheRule('rule-key', mockRule, 10);
      
      const cachedRule = await cache.getRule('rule-key');
      expect(cachedRule).toEqual(mockRule);
    });
  });

  describe('getRule', () => {
    const mockRule = {
      id: 'test-rule',
      name: 'TestRule',
      description: 'Test rule'
    };

    test('存在するルールを取得できる', async () => {
      await cache.cacheRule('rule-key', mockRule);
      
      const result = await cache.getRule('rule-key');
      expect(result).toEqual(mockRule);
    });

    test('存在しないルールでnullを返す', async () => {
      const result = await cache.getRule('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('cacheDictionary', () => {
    const mockDictionary = {
      domain: 'test-domain',
      version: '1.0.0',
      terms: [],
      businessRules: []
    };

    test('辞書が正常にキャッシュされる', async () => {
      await cache.cacheDictionary('dict-key', mockDictionary);
      
      const cachedDict = await cache.getDictionary('dict-key');
      expect(cachedDict).toEqual(mockDictionary);
    });

    test('TTL付きで辞書がキャッシュされる', async () => {
      await cache.cacheDictionary('dict-key', mockDictionary, 10);
      
      const cachedDict = await cache.getDictionary('dict-key');
      expect(cachedDict).toEqual(mockDictionary);
    });
  });

  describe('getDictionary', () => {
    const mockDictionary = {
      domain: 'test-domain',
      version: '1.0.0',
      terms: [],
      businessRules: []
    };

    test('存在する辞書を取得できる', async () => {
      await cache.cacheDictionary('dict-key', mockDictionary);
      
      const result = await cache.getDictionary('dict-key');
      expect(result).toEqual(mockDictionary);
    });

    test('存在しない辞書でnullを返す', async () => {
      const result = await cache.getDictionary('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('invalidate', () => {
    const mockTerm = {
      id: 'test-term',
      term: 'TestTerm',
      definition: 'Test definition'
    };

    test('指定されたキーが無効化される', async () => {
      await cache.cacheTerm('test-key', mockTerm);
      
      cache.invalidate('test-key');
      
      const result = await cache.getTerm('test-key');
      expect(result).toBeNull();
    });

    test('存在しないキーの無効化でエラーが発生しない', () => {
      expect(() => {
        cache.invalidate('non-existent');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    test('すべてのキャッシュがクリアされる', async () => {
      await cache.cacheTerm('term1', { id: '1', term: 'Term1', definition: 'Def1' });
      await cache.cacheTerm('term2', { id: '2', term: 'Term2', definition: 'Def2' });
      
      cache.clear();
      
      const result1 = await cache.getTerm('term1');
      const result2 = await cache.getTerm('term2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('getDictionaryStats', () => {
    test('統計情報が正しく返される', async () => {
      await cache.cacheTerm('term1', { id: '1', term: 'Term1', definition: 'Def1' });
      await cache.cacheRule('rule1', { id: '1', name: 'Rule1', description: 'Desc1' });
      await cache.cacheDictionary('dict1', { domain: 'test', version: '1.0', terms: [], businessRules: [] });
      
      const stats = cache.getDictionaryStats();
      
      expect(stats.terms).toBe(1);
      expect(stats.rules).toBe(1);
      expect(stats.dictionaries).toBe(1);
      expect(stats.totalMemoryUsage).toBeGreaterThan(0);
    });

    test('空のキャッシュで正しい統計を返す', () => {
      const stats = cache.getDictionaryStats();
      
      expect(stats.terms).toBe(0);
      expect(stats.rules).toBe(0);
      expect(stats.dictionaries).toBe(0);
      expect(stats.totalMemoryUsage).toBe(0);
    });
  });

  describe('getMemoryPressure', () => {
    test('メモリ圧迫状況が返される', async () => {
      // いくつかの項目をキャッシュ
      for (let i = 0; i < 10; i++) {
        await cache.cacheTerm(`term${i}`, {
          id: `${i}`,
          term: `Term${i}`,
          definition: `Definition ${i}`
        });
      }
      
      const pressure = cache.getMemoryPressure();
      
      expect(pressure.currentEntries).toBe(10);
      expect(pressure.maxEntries).toBe(100);
      expect(pressure.usagePercentage).toBe(10);
      expect(pressure.recommendEviction).toBe(false);
    });

    test('メモリ圧迫時に退避推奨が返される', async () => {
      const smallCache = new DictionarySpecificCache({
        maxMemoryEntries: 5,
        defaultTTL: 30
      });
      
      // 容量を超える項目をキャッシュ
      for (let i = 0; i < 6; i++) {
        await smallCache.cacheTerm(`term${i}`, {
          id: `${i}`,
          term: `Term${i}`,
          definition: `Definition ${i}`
        });
      }
      
      const pressure = smallCache.getMemoryPressure();
      
      expect(pressure.usagePercentage).toBeGreaterThanOrEqual(80);
      expect(pressure.recommendEviction).toBe(true);
    });
  });

  describe('startCleanupTimer', () => {
    test('クリーンアップタイマーが開始される', () => {
      expect(() => {
        cache.startCleanupTimer(100); // 100ms間隔
      }).not.toThrow();
    });

    test('既にタイマーが動いている場合、エラーが発生しない', () => {
      cache.startCleanupTimer(100);
      
      expect(() => {
        cache.startCleanupTimer(200);
      }).not.toThrow();
    });
  });

  describe('stopCleanupTimer', () => {
    test('クリーンアップタイマーが停止される', () => {
      cache.startCleanupTimer(100);
      
      expect(() => {
        cache.stopCleanupTimer();
      }).not.toThrow();
    });

    test('タイマーが動いていない場合、エラーが発生しない', () => {
      expect(() => {
        cache.stopCleanupTimer();
      }).not.toThrow();
    });
  });

  describe('prefetchTerms', () => {
    test('用語のプリフェッチが実行される', async () => {
      const termIds = ['term1', 'term2', 'term3'];
      const mockLoader = jest.fn().mockImplementation(async (id) => ({
        id,
        term: `Term${id}`,
        definition: `Definition for ${id}`
      }));
      
      await cache.prefetchTerms(termIds, mockLoader);
      
      expect(mockLoader).toHaveBeenCalledTimes(3);
      
      // プリフェッチされた用語が取得できることを確認
      const term1 = await cache.getTerm('term1');
      expect(term1?.term).toBe('Termterm1');
    });

    test('既にキャッシュされている用語はスキップされる', async () => {
      await cache.cacheTerm('term1', { id: 'term1', term: 'ExistingTerm1', definition: 'Existing' });
      
      const termIds = ['term1', 'term2'];
      const mockLoader = jest.fn().mockImplementation(async (id) => ({
        id,
        term: `Term${id}`,
        definition: `Definition for ${id}`
      }));
      
      await cache.prefetchTerms(termIds, mockLoader);
      
      expect(mockLoader).toHaveBeenCalledTimes(1); // term1はスキップされる
      expect(mockLoader).toHaveBeenCalledWith('term2');
    });
  });

  describe('エラーハンドリング', () => {
    test('不正なキーでエラーが発生しない', async () => {
      await expect(cache.getTerm('')).resolves.toBeNull();
      await expect(cache.getTerm(null as any)).resolves.toBeNull();
    });

    test('不正なデータでもキャッシュが継続動作する', async () => {
      await cache.cacheTerm('valid-key', { id: 'valid', term: 'Valid', definition: 'Valid' });
      
      try {
        await cache.cacheTerm('invalid-key', null as any);
      } catch (error) {
        // エラーが発生しても他のキャッシュは影響を受けない
      }
      
      const validTerm = await cache.getTerm('valid-key');
      expect(validTerm).toBeDefined();
    });
  });

  describe('メモリ管理', () => {
    test('最大エントリ数を超えると古いエントリが削除される', async () => {
      const smallCache = new DictionarySpecificCache({
        maxMemoryEntries: 3,
        defaultTTL: 30
      });
      
      // 4つの項目をキャッシュ（制限を超える）
      await smallCache.cacheTerm('term1', { id: '1', term: 'Term1', definition: 'Def1' });
      await smallCache.cacheTerm('term2', { id: '2', term: 'Term2', definition: 'Def2' });
      await smallCache.cacheTerm('term3', { id: '3', term: 'Term3', definition: 'Def3' });
      await smallCache.cacheTerm('term4', { id: '4', term: 'Term4', definition: 'Def4' });
      
      // 最初のエントリが削除されているはず
      const term1 = await smallCache.getTerm('term1');
      const term4 = await smallCache.getTerm('term4');
      
      expect(term1).toBeNull();
      expect(term4).toBeDefined();
    });
  });
});