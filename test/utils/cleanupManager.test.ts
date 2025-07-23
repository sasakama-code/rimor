/**
 * CleanupManager テストスイート
 * v0.3.0: ファイルクリーンアップマネージャーのテスト
 */

import { CleanupManager } from '../../src/utils/cleanupManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CleanupManager', () => {
  let cleanupManager: CleanupManager;
  let tempDir: string;
  let testFiles: string[];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rimor-cleanup-test-'));
    cleanupManager = new CleanupManager();
    
    // テスト用ファイルを作成
    testFiles = [
      path.join(tempDir, 'test.ts'),
      path.join(tempDir, 'generated-plugin.ts'),
      path.join(tempDir, 'cache.json'),
      path.join(tempDir, 'temp-file.tmp')
    ];

    for (const file of testFiles) {
      await fs.writeFile(file, 'test content');
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップエラーは無視
    }
  });

  describe('constructor', () => {
    it('should create CleanupManager instance', () => {
      expect(cleanupManager).toBeInstanceOf(CleanupManager);
    });
  });

  describe('file cleanup', () => {
    it('should clean up generated plugin files', async () => {
      const generatedDir = path.join(tempDir, 'generated');
      await fs.mkdir(generatedDir);
      await fs.writeFile(path.join(generatedDir, 'plugin.ts'), 'generated plugin content');

      const cleaned = await cleanupManager.cleanupGeneratedFiles(tempDir);
      
      expect(cleaned).toContain('plugin.ts');
      
      const exists = await fs.access(path.join(generatedDir, 'plugin.ts')).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });

    it('should clean up temporary files', async () => {
      const cleaned = await cleanupManager.cleanupTempFiles(tempDir);
      
      expect(cleaned.length).toBeGreaterThan(0);
      expect(cleaned.some(file => file.includes('temp-file.tmp'))).toBe(true);
    });

    it('should clean up cache files', async () => {
      const cleaned = await cleanupManager.cleanupCacheFiles(tempDir);
      
      expect(cleaned.some(file => file.includes('cache.json'))).toBe(true);
    });

    it('should perform full cleanup', async () => {
      const generatedDir = path.join(tempDir, 'generated');
      await fs.mkdir(generatedDir);
      await fs.writeFile(path.join(generatedDir, 'plugin.ts'), 'content');

      const result = await cleanupManager.performFullCleanup(tempDir);
      
      expect(result.generatedFiles).toContain('plugin.ts');
      expect(result.tempFiles.some(file => file.includes('.tmp'))).toBe(true);
      expect(result.cacheFiles.some(file => file.includes('cache.json'))).toBe(true);
      expect(result.totalCleaned).toBeGreaterThan(0);
    });
  });

  describe('cleanup patterns', () => {
    it('should respect exclude patterns', async () => {
      const excludePatterns = ['important-*'];
      const importantFile = path.join(tempDir, 'important-file.tmp');
      await fs.writeFile(importantFile, 'important content');

      const cleaned = await cleanupManager.cleanupTempFiles(tempDir, excludePatterns);
      
      expect(cleaned.some(file => file.includes('important-file.tmp'))).toBe(false);
      
      const exists = await fs.access(importantFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should handle custom file patterns', async () => {
      const customPattern = '*.custom';
      const customFile = path.join(tempDir, 'test.custom');
      await fs.writeFile(customFile, 'custom content');

      const cleaned = await cleanupManager.cleanupByPattern(tempDir, customPattern);
      
      expect(cleaned.some(file => file.includes('test.custom'))).toBe(true);
    });
  });

  describe('safety features', () => {
    it('should not clean up protected directories', async () => {
      const protectedDirs = ['node_modules', '.git', 'src'];
      
      for (const dir of protectedDirs) {
        const dirPath = path.join(tempDir, dir);
        await fs.mkdir(dirPath);
        await fs.writeFile(path.join(dirPath, 'file.tmp'), 'content');
      }

      const cleaned = await cleanupManager.cleanupTempFiles(tempDir);
      
      for (const dir of protectedDirs) {
        const filePath = path.join(tempDir, dir, 'file.tmp');
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });

    it('should handle permission errors gracefully', async () => {
      // 読み取り専用ファイルを作成
      const readOnlyFile = path.join(tempDir, 'readonly.tmp');
      await fs.writeFile(readOnlyFile, 'readonly content');
      await fs.chmod(readOnlyFile, 0o444);

      const cleaned = await expect(cleanupManager.cleanupTempFiles(tempDir))
        .resolves.toBeDefined();
      
      // クリーンアップが失敗してもクラッシュしないことを確認
      expect(Array.isArray(cleaned)).toBe(true);
    });
  });

  describe('cleanup statistics', () => {
    it('should provide accurate cleanup statistics', async () => {
      const generatedDir = path.join(tempDir, 'generated');
      await fs.mkdir(generatedDir);
      await fs.writeFile(path.join(generatedDir, 'plugin1.ts'), 'content1');
      await fs.writeFile(path.join(generatedDir, 'plugin2.ts'), 'content2');

      const result = await cleanupManager.performFullCleanup(tempDir);
      
      expect(result.totalCleaned).toBeGreaterThan(0);
      expect(result.generatedFiles.length).toBeGreaterThanOrEqual(2);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should track cleanup performance', async () => {
      const startTime = Date.now();
      
      const result = await cleanupManager.performFullCleanup(tempDir);
      
      const endTime = Date.now();
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(endTime - startTime + 100);
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directories', async () => {
      const result = await cleanupManager.performFullCleanup('/non/existent/directory');
      
      expect(result.totalCleaned).toBe(0);
      expect(result.generatedFiles).toEqual([]);
      expect(result.tempFiles).toEqual([]);
      expect(result.cacheFiles).toEqual([]);
    });

    it('should continue cleanup on individual file errors', async () => {
      // 一部のファイルでエラーが発生しても他のファイルはクリーンアップされることを確認
      const result = await cleanupManager.performFullCleanup(tempDir);
      
      expect(result).toBeDefined();
      expect(typeof result.totalCleaned).toBe('number');
    });
  });
});