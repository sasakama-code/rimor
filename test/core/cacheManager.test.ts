/**
 * CacheManager テストスイート
 * v0.3.0: ファイル分析結果キャッシュマネージャーの基本テスト
 * v0.8.0: 型安全性テストの追加
 */

import { CacheManager } from '../../src/core/cacheManager';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

// モック設定
jest.mock('fs');
jest.mock('fs/promises');

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  const testCacheDir = '/tmp/test-cache';

  beforeEach(() => {
    jest.clearAllMocks();
    // シングルトンのリセット
    (CacheManager as any).instance = null;
    cacheManager = CacheManager.getInstance({
      cacheDirectory: testCacheDir,
      maxEntries: 100,
      maxSizeBytes: 50 * 1024 * 1024,
      ttlMs: 3600000
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should exist in the codebase', () => {
    const module = require('../../src/core/cacheManager');
    expect(module).toBeDefined();
  });

  describe('safeJsonParse type safety', () => {
    it('should handle valid JSON data safely', () => {
      const validJson = '{"key": "value", "number": 123}';
      // privateメソッドのテストのため、型アサーションを使用
      const result = (cacheManager as any).safeJsonParse(validJson);
      
      // unknown型として扱われることを確認
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return null for invalid JSON', () => {
      const invalidJson = 'not a json';
      const result = (cacheManager as any).safeJsonParse(invalidJson);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = (cacheManager as any).safeJsonParse('');
      expect(result).toBeNull();
    });

    it('should reject dangerous patterns', () => {
      const dangerousJson = '{"__proto__": {"isAdmin": true}}';
      const result = (cacheManager as any).safeJsonParse(dangerousJson);
      expect(result).toBeNull();
    });

    it('should reject oversized data', () => {
      const oversizedJson = '{"data": "' + 'x'.repeat(51 * 1024 * 1024) + '"}';
      const result = (cacheManager as any).safeJsonParse(oversizedJson);
      expect(result).toBeNull();
    });
  });

  describe('validateCacheData type safety', () => {
    it('should validate correct cache data structure', () => {
      const validData = {
        entries: [
          ['key1', {
            filePath: '/path/to/file.ts',
            fileHash: 'hash123',
            fileSize: 1024,
            lastModified: Date.now(),
            pluginResults: {},
            cachedAt: Date.now()
          }]
        ]
      };
      
      const result = (cacheManager as any).validateCacheData(validData);
      expect(result).toBe(true);
    });

    it('should reject data without entries array', () => {
      const invalidData = { notEntries: [] };
      const result = (cacheManager as any).validateCacheData(invalidData);
      expect(result).toBe(false);
    });

    it('should reject null or undefined data', () => {
      expect((cacheManager as any).validateCacheData(null)).toBe(false);
      expect((cacheManager as any).validateCacheData(undefined)).toBe(false);
    });

    it('should reject non-object data', () => {
      expect((cacheManager as any).validateCacheData('string')).toBe(false);
      expect((cacheManager as any).validateCacheData(123)).toBe(false);
      expect((cacheManager as any).validateCacheData(true)).toBe(false);
    });
  });

  describe('validateCacheEntry type safety', () => {
    it('should validate correct cache entry', () => {
      const validEntry = {
        filePath: '/path/to/file.ts',
        fileHash: 'hash123',
        fileSize: 1024,
        lastModified: Date.now(),
        pluginResults: {},
        cachedAt: Date.now()
      };
      
      const result = (cacheManager as any).validateCacheEntry('validKey', validEntry);
      expect(result).toBe(true);
    });

    it('should reject entry with missing required fields', () => {
      const invalidEntry = {
        filePath: '/path/to/file.ts',
        fileHash: 'hash123'
        // Missing other required fields
      };
      
      const result = (cacheManager as any).validateCacheEntry('key', invalidEntry);
      expect(result).toBe(false);
    });

    it('should reject entry with path traversal', () => {
      const invalidEntry = {
        filePath: '../../../etc/passwd',
        fileHash: 'hash123',
        fileSize: 1024,
        lastModified: Date.now(),
        pluginResults: {},
        cachedAt: Date.now()
      };
      
      const result = (cacheManager as any).validateCacheEntry('key', invalidEntry);
      expect(result).toBe(false);
    });

    it('should reject non-object entries', () => {
      expect((cacheManager as any).validateCacheEntry('key', null)).toBe(false);
      expect((cacheManager as any).validateCacheEntry('key', 'string')).toBe(false);
      expect((cacheManager as any).validateCacheEntry('key', 123)).toBe(false);
    });
  });

  describe('getObjectDepth type safety', () => {
    it('should calculate depth correctly for nested objects', () => {
      const obj = {
        level1: {
          level2: {
            level3: 'value'
          }
        }
      };
      
      const depth = (cacheManager as any).getObjectDepth(obj);
      expect(depth).toBe(3);
    });

    it('should handle non-object values', () => {
      expect((cacheManager as any).getObjectDepth(null)).toBe(0);
      expect((cacheManager as any).getObjectDepth(undefined)).toBe(0);
      expect((cacheManager as any).getObjectDepth('string')).toBe(0);
      expect((cacheManager as any).getObjectDepth(123)).toBe(0);
    });

    it('should limit maximum depth calculation', () => {
      // 深いネストのオブジェクトを作成
      let deepObj: any = {};
      let current = deepObj;
      for (let i = 0; i < 20; i++) {
        current.next = {};
        current = current.next;
      }
      
      const depth = (cacheManager as any).getObjectDepth(deepObj);
      expect(depth).toBeLessThanOrEqual(10);
    });
  });
});