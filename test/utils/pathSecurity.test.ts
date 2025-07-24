/**
 * PathSecurity テストスイート
 * パストラバーサル攻撃対策とパス検証システムのテスト
 */

import * as path from 'path';
import { PathSecurity } from '../../src/utils/pathSecurity';

// fsをモック
jest.mock('fs');

describe('PathSecurity', () => {
  const testProjectRoot = '/test/project';
  const validPath = '/test/project/src/file.ts';
  const invalidPath = '/test/project/../outside/file.ts';

  describe('validateProjectPath', () => {
    it('should return true for paths within project root', () => {
      const result = PathSecurity.validateProjectPath(validPath, testProjectRoot);
      expect(result).toBe(true);
    });

    it('should return false for paths outside project root', () => {
      const result = PathSecurity.validateProjectPath(invalidPath, testProjectRoot);
      expect(result).toBe(false);
    });

    it('should return false for paths attempting path traversal', () => {
      const traversalPath = '/test/project/../../outside/file.ts';
      const result = PathSecurity.validateProjectPath(traversalPath, testProjectRoot);
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      // 実際の実装では空文字列は同じディレクトリとして処理される
      const result = PathSecurity.validateProjectPath('', '');
      expect(result).toBe(true);
    });
  });

  describe('safeResolve', () => {
    it('should return resolved path for valid relative paths', () => {
      const relativePath = 'src/file.ts';
      const result = PathSecurity.safeResolve(relativePath, testProjectRoot);
      expect(result).toContain('src/file.ts');
    });

    it('should return null for paths attempting to escape project root', () => {
      const maliciousPath = '../../../etc/passwd';
      const result = PathSecurity.safeResolve(maliciousPath, testProjectRoot);
      expect(result).toBeNull();
    });

    it('should handle absolute paths within project correctly', () => {
      const absolutePath = path.join(testProjectRoot, 'src/file.ts');
      const result = PathSecurity.safeResolve(absolutePath, testProjectRoot);
      expect(result).toContain('src/file.ts');
    });

    it('should return valid path when project path is current directory', () => {
      const result = PathSecurity.safeResolve('file.ts', process.cwd());
      expect(result).toContain('file.ts');
    });
  });

  describe('validateMultiplePaths', () => {
    it('should filter out invalid paths from array', () => {
      const paths = [
        'src/valid.ts',
        '../invalid.ts',
        'lib/another-valid.ts',
        '../../malicious.ts'
      ];
      
      const result = PathSecurity.validateMultiplePaths(paths, testProjectRoot);
      expect(result).toHaveLength(2);
      expect(result).toContain('src/valid.ts');
      expect(result).toContain('lib/another-valid.ts');
    });

    it('should return empty array if all paths are invalid', () => {
      const paths = ['../invalid1.ts', '../../invalid2.ts'];
      const result = PathSecurity.validateMultiplePaths(paths, testProjectRoot);
      expect(result).toHaveLength(0);
    });

    it('should handle empty array input', () => {
      const result = PathSecurity.validateMultiplePaths([], testProjectRoot);
      expect(result).toHaveLength(0);
    });
  });

  describe('safeResolveImport', () => {
    const fromFile = '/test/project/src/main.ts';

    it('should resolve relative imports correctly', () => {
      const importPath = './helper';
      const result = PathSecurity.safeResolveImport(importPath, fromFile, testProjectRoot);
      expect(result).toContain('helper');
    });

    it('should return null for relative imports escaping project', () => {
      const importPath = '../../../outside';
      const result = PathSecurity.safeResolveImport(importPath, fromFile, testProjectRoot);
      expect(result).toBeNull();
    });

    it('should return non-relative imports unchanged', () => {
      const importPath = 'lodash';
      const result = PathSecurity.safeResolveImport(importPath, fromFile, testProjectRoot);
      expect(result).toBe('lodash');
    });

    it('should handle errors gracefully', () => {
      const result = PathSecurity.safeResolveImport('./test', '', testProjectRoot);
      expect(result).toBeNull();
    });
  });

  describe('safeResolveWithExtensions', () => {
    const extensions = ['.ts', '.js'];
    const fs = require('fs');

    beforeEach(() => {
      // fsモジュール全体のmockをリセット
      jest.clearAllMocks();
    });

    it('should return first existing file with extension', () => {
      const basePath = path.join(testProjectRoot, 'src/module');
      fs.existsSync.mockImplementation((filePath: string) => {
        return filePath === basePath + '.ts';
      });

      const result = PathSecurity.safeResolveWithExtensions(basePath, extensions, testProjectRoot);
      expect(result).toBe(basePath + '.ts');
    });

    it('should try index files if direct files not found', () => {
      const basePath = path.join(testProjectRoot, 'src/module');
      const indexPath = path.join(basePath, 'index.ts');
      
      fs.existsSync.mockImplementation((filePath: string) => {
        return filePath === indexPath;
      });

      const result = PathSecurity.safeResolveWithExtensions(basePath, extensions, testProjectRoot);
      expect(result).toBe(indexPath);
    });

    it('should return null if no files exist', () => {
      fs.existsSync.mockReturnValue(false);
      
      const basePath = path.join(testProjectRoot, 'src/nonexistent');
      const result = PathSecurity.safeResolveWithExtensions(basePath, extensions, testProjectRoot);
      expect(result).toBeNull();
    });

    it('should skip files outside project root', () => {
      const basePath = '/outside/project/file';
      fs.existsSync.mockReturnValue(true);
      
      const result = PathSecurity.safeResolveWithExtensions(basePath, extensions, testProjectRoot);
      expect(result).toBeNull();
    });
  });

  describe('Class existence and interface', () => {
    it('should exist in the codebase', () => {
      expect(PathSecurity).toBeDefined();
    });

    it('should have all required static methods', () => {
      expect(typeof PathSecurity.validateProjectPath).toBe('function');
      expect(typeof PathSecurity.safeResolve).toBe('function');
      expect(typeof PathSecurity.validateMultiplePaths).toBe('function');
      expect(typeof PathSecurity.safeResolveImport).toBe('function');
      expect(typeof PathSecurity.safeResolveWithExtensions).toBe('function');
    });
  });
});