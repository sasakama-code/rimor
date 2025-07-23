/**
 * CacheManager テストスイート
 * v0.3.0: ファイル分析結果キャッシュマネージャーのテスト
 */

import { CacheManager, CacheEntry } from '../../src/core/cacheManager';
import { Issue } from '../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let tempDir: string;
  let tempCacheFile: string;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rimor-cache-test-'));
    tempCacheFile = path.join(tempDir, 'test-cache.json');
    cacheManager = new CacheManager(tempCacheFile);
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップエラーは無視
    }
  });

  describe('constructor', () => {
    it('should create CacheManager with default cache file', () => {
      const defaultManager = new CacheManager();
      expect(defaultManager).toBeInstanceOf(CacheManager);
    });

    it('should create CacheManager with custom cache file', () => {
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });
  });

  describe('cache operations', () => {
    const mockIssues: Issue[] = [
      {
        type: 'test-issue',
        severity: 'error' as const,
        message: 'Test issue',
        file: 'test.ts',
        line: 1
      }
    ];

    it('should store and retrieve cache entry', async () => {
      const filePath = 'test.ts';
      const pluginName = 'testPlugin';

      await cacheManager.setCacheEntry(filePath, pluginName, mockIssues, {
        hash: 'test-hash',
        size: 100,
        mtime: Date.now()
      });

      const cachedIssues = await cacheManager.getCachedResult(filePath, pluginName, {
        hash: 'test-hash',
        size: 100,
        mtime: Date.now()
      });

      expect(cachedIssues).toEqual(mockIssues);
    });

    it('should return null for cache miss', async () => {
      const result = await cacheManager.getCachedResult('nonexistent.ts', 'testPlugin', {
        hash: 'hash',
        size: 100,
        mtime: Date.now()
      });

      expect(result).toBeNull();
    });

    it('should invalidate cache on file change', async () => {
      const filePath = 'test.ts';
      const pluginName = 'testPlugin';

      // 最初のキャッシュ保存
      await cacheManager.setCacheEntry(filePath, pluginName, mockIssues, {
        hash: 'old-hash',
        size: 100,
        mtime: Date.now()
      });

      // ファイルが変更された場合
      const result = await cacheManager.getCachedResult(filePath, pluginName, {
        hash: 'new-hash',
        size: 150,
        mtime: Date.now() + 1000
      });

      expect(result).toBeNull();
    });

    it('should clear all cache entries', async () => {
      await cacheManager.setCacheEntry('test1.ts', 'plugin1', mockIssues, {
        hash: 'hash1',
        size: 100,
        mtime: Date.now()
      });

      await cacheManager.setCacheEntry('test2.ts', 'plugin2', mockIssues, {
        hash: 'hash2',
        size: 200,
        mtime: Date.now()
      });

      await cacheManager.clearCache();

      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('cache statistics', () => {
    it('should provide accurate cache statistics', async () => {
      const stats = await cacheManager.getCacheStatistics();
      
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('cacheHits');
      expect(stats).toHaveProperty('cacheMisses');
      expect(stats).toHaveProperty('hitRatio');
      expect(stats).toHaveProperty('totalSizeBytes');
    });

    it('should track cache hits and misses', async () => {
      const filePath = 'test.ts';
      const pluginName = 'testPlugin';
      const fileInfo = { hash: 'hash', size: 100, mtime: Date.now() };

      // Cache miss
      await cacheManager.getCachedResult(filePath, pluginName, fileInfo);
      
      // Store in cache
      await cacheManager.setCacheEntry(filePath, pluginName, [], fileInfo);
      
      // Cache hit
      await cacheManager.getCachedResult(filePath, pluginName, fileInfo);

      const stats = await cacheManager.getCacheStatistics();
      expect(stats.cacheHits).toBeGreaterThan(0);
      expect(stats.cacheMisses).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      // 無効なパスでCacheManagerを作成
      const invalidManager = new CacheManager('/invalid/path/cache.json');
      
      // エラーが発生してもクラッシュしないことを確認
      await expect(invalidManager.getCacheStatistics()).resolves.toBeDefined();
    });

    it('should handle corrupted cache file', async () => {
      // 無効なJSONファイルを作成
      await fs.writeFile(tempCacheFile, 'invalid json');
      
      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);
    });
  });
});