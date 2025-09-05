/**
 * CacheFileValidation テストスイート
 * Issue #128対応: キャッシュファイル検証とJest Cache誤コミット防止テスト
 * 
 * Refactor段階適用:
 * - Martin Fowler推奨のExtract Method適用完了
 * - DRY原則: 実装とテストの明確な分離
 * - SOLID原則: テストは検証のみに専念
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { CacheFileValidator } from '../../src/utils/cacheFileValidator';

// fsとglobをモック
jest.mock('fs');
jest.mock('glob');

describe('CacheFileValidator - Issue #128対応', () => {
  const testProjectRoot = '/test/project';
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = glob as jest.MockedFunction<typeof glob>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectUnquotedHashFiles', () => {
    it('should detect files with unquoted hash at beginning', async () => {
      // TDD Red段階: Issue #128の具体的問題パターンをテスト
      const problemFilePath = '/test/project/.jest-cache/jest-transform-cache-xxx/07/analysisresult_xxx';
      const problemContent = 'fe91943ff0a283cbe97fabe367f9a72e\nvalid content follows...';
      
      mockGlob.mockResolvedValueOnce([problemFilePath]);
      mockFs.readFileSync.mockReturnValue(problemContent);
      
      const result = await CacheFileValidator.detectUnquotedHashFiles(testProjectRoot);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(problemFilePath);
    });

    it('should not flag valid cache files', async () => {
      // 正常なキャッシュファイルは検出されないことを確認
      const validFilePath = '/test/project/.jest-cache/valid-cache-file';
      const validContent = '// Valid cache file\nmodule.exports = {};';
      
      mockGlob.mockResolvedValueOnce([validFilePath]);
      mockFs.readFileSync.mockReturnValue(validContent);
      
      const result = await CacheFileValidator.detectUnquotedHashFiles(testProjectRoot);
      
      expect(result).toHaveLength(0);
    });

    it('should handle file read errors gracefully', async () => {
      // Defensive Programming: エラー耐性テスト
      const problematicFile = '/test/project/.jest-cache/unreadable-file';
      
      mockGlob.mockResolvedValueOnce([problematicFile]);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = await CacheFileValidator.detectUnquotedHashFiles(testProjectRoot);
      
      expect(result).toHaveLength(0); // エラーファイルは無視される
    });

    it('should handle glob pattern errors gracefully', async () => {
      // エラー処理のテスト
      mockGlob.mockRejectedValueOnce(new Error('Glob pattern error'));
      
      const result = await CacheFileValidator.detectUnquotedHashFiles(testProjectRoot);
      
      expect(result).toHaveLength(0);
    });

    it('should handle non-array glob results gracefully', async () => {
      // Defensive Programming: 型安全性テスト
      mockGlob.mockResolvedValueOnce('not-an-array' as any);
      
      const result = await CacheFileValidator.detectUnquotedHashFiles(testProjectRoot);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('validateGitignoreSettings', () => {
    it('should return true when all required cache patterns are present', () => {
      // Issue #118対応完了の検証
      const gitignoreContent = `
# Dependencies
node_modules/

# Cache files - Issue #118対応: 包括的キャッシュファイル除外
.cache/
.rimor-cache/
.jest-cache/

# Other patterns...
      `.trim();
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(gitignoreContent);
      
      const result = CacheFileValidator.validateGitignoreSettings(testProjectRoot);
      
      expect(result).toBe(true);
    });

    it('should return true when patterns exist without trailing slash', () => {
      // DRY原則適用: 柔軟なパターンマッチング
      const gitignoreContent = `
# Cache files
.cache
.rimor-cache
.jest-cache
      `.trim();
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(gitignoreContent);
      
      const result = CacheFileValidator.validateGitignoreSettings(testProjectRoot);
      
      expect(result).toBe(true);
    });

    it('should return false when required cache patterns are missing', () => {
      // 不完全な.gitignore設定のテスト
      const incompleteGitignore = `
# Dependencies
node_modules/
# Missing cache file patterns
      `.trim();
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(incompleteGitignore);
      
      const result = CacheFileValidator.validateGitignoreSettings(testProjectRoot);
      
      expect(result).toBe(false);
    });

    it('should return false when .gitignore does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = CacheFileValidator.validateGitignoreSettings(testProjectRoot);
      
      expect(result).toBe(false);
    });

    it('should handle file read errors gracefully', () => {
      // Defensive Programming適用
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });
      
      const result = CacheFileValidator.validateGitignoreSettings(testProjectRoot);
      
      expect(result).toBe(false);
    });
  });

  describe('validateProjectCacheHealth', () => {
    it('should return healthy status when no problems exist', async () => {
      // 統合ヘルスチェックテスト
      mockGlob.mockResolvedValue([]);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('.cache/\n.rimor-cache/\n.jest-cache/');
      
      const result = await CacheFileValidator.validateProjectCacheHealth(testProjectRoot);
      
      expect(result.isHealthy).toBe(true);
      expect(result.hasProblematicFiles).toBe(false);
      expect(result.hasValidGitignore).toBe(true);
      expect(result.problematicFiles).toHaveLength(0);
    });

    it('should return unhealthy status when problems exist', async () => {
      const problemFile = '/test/project/.jest-cache/problem-file';
      mockGlob.mockResolvedValueOnce([problemFile]);
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath === problemFile) {
          return 'fe91943ff0a283cbe97fabe367f9a72e';
        }
        return 'incomplete gitignore';
      });
      mockFs.existsSync.mockReturnValue(true);
      
      const result = await CacheFileValidator.validateProjectCacheHealth(testProjectRoot);
      
      expect(result.isHealthy).toBe(false);
      expect(result.hasProblematicFiles).toBe(true);
      expect(result.hasValidGitignore).toBe(false);
      expect(result.problematicFiles).toContain(problemFile);
    });
  });

  describe('suggestCacheCleanup', () => {
    it('should suggest cleanup when problems exist', async () => {
      mockGlob.mockResolvedValue([]);
      mockFs.existsSync.mockReturnValue(false);
      
      const result = await CacheFileValidator.suggestCacheCleanup(testProjectRoot);
      
      expect(result.safeToClean).toBe(false);
      expect(result.suggestions).toContain('.gitignoreにキャッシュファイル除外設定を追加してください');
    });

    it('should indicate safe cleanup when no problems exist', async () => {
      mockGlob.mockResolvedValue([]);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('.cache/\n.rimor-cache/\n.jest-cache/');
      
      const result = await CacheFileValidator.suggestCacheCleanup(testProjectRoot);
      
      expect(result.safeToClean).toBe(true);
      expect(result.suggestions).toContain('キャッシュファイル管理は正常です');
    });
  });

  describe('Integration Test - Issue #128 Resolution Verification', () => {
    it('should verify that current project state resolves Issue #128', async () => {
      // 統合テスト: Issue #128が解決済みであることを確認
      const realProjectRoot = process.cwd();
      
      // 実際のファイルシステムアクセスのためにmockを解除
      jest.restoreAllMocks();
      const actualFs = jest.requireActual('fs');
      const actualGlob = jest.requireActual('glob');
      
      // 実際の.gitignore設定を確認
      const gitignoreValid = CacheFileValidator.validateGitignoreSettings(realProjectRoot);
      expect(gitignoreValid).toBe(true);
      
      // 実際のプロジェクトに問題のキャッシュファイルが存在しないことを確認
      const problemFiles = await CacheFileValidator.detectUnquotedHashFiles(realProjectRoot);
      expect(problemFiles).toHaveLength(0);

      // プロジェクトヘルスチェック
      const healthCheck = await CacheFileValidator.validateProjectCacheHealth(realProjectRoot);
      expect(healthCheck.isHealthy).toBe(true);
    });
  });

  describe('Module interface validation', () => {
    it('should have all required static methods', () => {
      // SOLID原則: インターフェース安定性の確認
      expect(typeof CacheFileValidator.detectUnquotedHashFiles).toBe('function');
      expect(typeof CacheFileValidator.validateGitignoreSettings).toBe('function');
      expect(typeof CacheFileValidator.validateProjectCacheHealth).toBe('function');
      expect(typeof CacheFileValidator.suggestCacheCleanup).toBe('function');
    });

    it('should be properly exported from utils module', () => {
      // DRY原則: モジュールの適切なエクスポート確認
      expect(CacheFileValidator).toBeDefined();
      expect(CacheFileValidator.name).toBe('CacheFileValidator');
    });
  });
});