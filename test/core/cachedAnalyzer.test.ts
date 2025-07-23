/**
 * CachedAnalyzer テストスイート
 * v0.3.0: キャッシュ機能付き分析エンジンのテスト
 */

import { CachedAnalyzer } from '../../src/core/cachedAnalyzer';
import { Issue } from '../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CachedAnalyzer', () => {
  let cachedAnalyzer: CachedAnalyzer;
  let tempDir: string;
  let testFiles: string[];

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rimor-cached-analyzer-test-'));
    
    // テスト用ファイルを作成
    testFiles = [
      path.join(tempDir, 'test1.ts'),
      path.join(tempDir, 'test2.ts')
    ];

    await fs.writeFile(testFiles[0], `
      function test1() {
        return "test1";
      }
    `);

    await fs.writeFile(testFiles[1], `
      function test2() {
        expect(true).toBe(true);
        return "test2";
      }
    `);

    cachedAnalyzer = new CachedAnalyzer();
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
    it('should create CachedAnalyzer instance', () => {
      expect(cachedAnalyzer).toBeInstanceOf(CachedAnalyzer);
    });

    it('should create with custom cache file', () => {
      const customCacheFile = path.join(tempDir, 'custom-cache.json');
      const customAnalyzer = new CachedAnalyzer(customCacheFile);
      expect(customAnalyzer).toBeInstanceOf(CachedAnalyzer);
    });
  });

  describe('analysis with caching', () => {
    it('should analyze files and cache results', async () => {
      const result = await cachedAnalyzer.analyzeWithCache(testFiles[0]);
      
      expect(result).toHaveProperty('totalFiles');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('cacheStats');
      
      expect(result.totalFiles).toBe(1);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(typeof result.executionTime).toBe('number');
    });

    it('should use cache for subsequent analysis of same file', async () => {
      // 最初の分析
      const firstResult = await cachedAnalyzer.analyzeWithCache(testFiles[0]);
      
      // 同じファイルの2回目の分析
      const secondResult = await cachedAnalyzer.analyzeWithCache(testFiles[0]);
      
      expect(secondResult.cacheStats.cacheHits).toBeGreaterThan(0);
      expect(firstResult.issues).toEqual(secondResult.issues);
    });

    it('should handle multiple files', async () => {
      const result = await cachedAnalyzer.analyzeWithCache(tempDir);
      
      expect(result.totalFiles).toBeGreaterThan(1);
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should provide cache statistics', async () => {
      await cachedAnalyzer.analyzeWithCache(testFiles[0]);
      
      const result = await cachedAnalyzer.analyzeWithCache(testFiles[0]);
      
      expect(result.cacheStats).toHaveProperty('cacheHits');
      expect(result.cacheStats).toHaveProperty('cacheMisses');
      expect(result.cacheStats).toHaveProperty('hitRatio');
      expect(result.cacheStats).toHaveProperty('filesFromCache');
      expect(result.cacheStats).toHaveProperty('filesAnalyzed');
    });
  });

  describe('performance monitoring', () => {
    it('should include performance report when enabled', async () => {
      const result = await cachedAnalyzer.analyzeWithCache(testFiles[0], {
        enablePerformanceMonitoring: true
      });
      
      expect(result.performanceReport).toBeDefined();
      if (result.performanceReport) {
        expect(result.performanceReport).toHaveProperty('totalTime');
        expect(result.performanceReport).toHaveProperty('pluginTimes');
      }
    });

    it('should not include performance report when disabled', async () => {
      const result = await cachedAnalyzer.analyzeWithCache(testFiles[0], {
        enablePerformanceMonitoring: false
      });
      
      expect(result.performanceReport).toBeUndefined();
    });
  });

  describe('cache options', () => {
    it('should work with cache disabled', async () => {
      const result = await cachedAnalyzer.analyzeWithCache(testFiles[0], {
        enableCache: false
      });
      
      expect(result.cacheStats.cacheHits).toBe(0);
      expect(result.cacheStats.filesFromCache).toBe(0);
    });

    it('should work with cache enabled', async () => {
      // 最初の分析でキャッシュに保存
      await cachedAnalyzer.analyzeWithCache(testFiles[0], {
        enableCache: true
      });
      
      // 2回目の分析でキャッシュを使用
      const result = await cachedAnalyzer.analyzeWithCache(testFiles[0], {
        enableCache: true
      });
      
      expect(result.cacheStats.filesFromCache).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent file gracefully', async () => {
      const result = await cachedAnalyzer.analyzeWithCache('/non/existent/file.ts');
      
      expect(result.totalFiles).toBe(0);
      expect(result.issues).toEqual([]);
    });

    it('should handle empty directory', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      await fs.mkdir(emptyDir);
      
      const result = await cachedAnalyzer.analyzeWithCache(emptyDir);
      
      expect(result.totalFiles).toBe(0);
      expect(result.issues).toEqual([]);
    });
  });
});