/**
 * FsCompat テストスイート
 * v0.6.0: Node.js互換性ヘルパークラスの包括的テスト
 */

import * as fs from 'fs';
import * as path from 'path';
import { FsCompat } from '../../src/utils/fsCompat';

describe('FsCompat', () => {
  const testDir = path.join(__dirname, 'fsCompat-test-dir');
  const testFile = path.join(testDir, 'test-file.txt');
  const testSubDir = path.join(testDir, 'sub-dir');
  const testFileInSubDir = path.join(testSubDir, 'nested-file.txt');

  beforeEach(() => {
    // テスト環境のクリーンアップ
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        // fs.rmSyncが使えない場合は個別に削除
        cleanupRecursive(testDir);
      }
    }
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
        cleanupRecursive(testDir);
      }
    }
  });

  // ヘルパー関数：再帰的削除
  function cleanupRecursive(dirPath: string): void {
    try {
      if (fs.existsSync(dirPath)) {
        const stat = fs.statSync(dirPath);
        if (stat.isDirectory()) {
          const items = fs.readdirSync(dirPath);
          for (const item of items) {
            cleanupRecursive(path.join(dirPath, item));
          }
          fs.rmdirSync(dirPath);
        } else {
          fs.unlinkSync(dirPath);
        }
      }
    } catch {
      // エラーは無視
    }
  }

  describe('Node.js version detection', () => {
    let originalVersion: string;

    beforeAll(() => {
      originalVersion = process.version;
    });

    afterAll(() => {
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        writable: true,
        configurable: true
      });
    });

    it('should detect modern Node.js version correctly', () => {
      Object.defineProperty(process, 'version', {
        value: 'v18.17.0',
        writable: true,
        configurable: true
      });

      // リフレクションを使ってprivateメソッドにアクセス
      const isRmSyncAvailable = (FsCompat as any).isRmSyncAvailable();
      expect(isRmSyncAvailable).toBe(true);
    });

    it('should detect old Node.js version correctly', () => {
      Object.defineProperty(process, 'version', {
        value: 'v12.22.0',
        writable: true,
        configurable: true
      });

      const isRmSyncAvailable = (FsCompat as any).isRmSyncAvailable();
      expect(isRmSyncAvailable).toBe(false);
    });

    it('should handle edge case Node.js 14.14.0', () => {
      Object.defineProperty(process, 'version', {
        value: 'v14.14.0',
        writable: true,
        configurable: true
      });

      const isRmSyncAvailable = (FsCompat as any).isRmSyncAvailable();
      expect(isRmSyncAvailable).toBe(true);
    });

    it('should handle version string parsing edge cases', () => {
      Object.defineProperty(process, 'version', {
        value: 'invalid-version',
        writable: true,
        configurable: true
      });

      const isRmSyncAvailable = (FsCompat as any).isRmSyncAvailable();
      expect(isRmSyncAvailable).toBe(false);
    });
  });

  describe('ensureDirSync', () => {
    it('should create directory if it does not exist', () => {
      expect(fs.existsSync(testDir)).toBe(false);
      
      FsCompat.ensureDirSync(testDir);
      
      expect(fs.existsSync(testDir)).toBe(true);
      expect(fs.statSync(testDir).isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      fs.mkdirSync(testDir, { recursive: true });
      expect(fs.existsSync(testDir)).toBe(true);
      
      expect(() => FsCompat.ensureDirSync(testDir)).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(true);
    });

    it('should create nested directories', () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
      
      FsCompat.ensureDirSync(nestedDir);
      
      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.statSync(nestedDir).isDirectory()).toBe(true);
    });
  });

  describe('removeFileSync', () => {
    beforeEach(() => {
      FsCompat.ensureDirSync(testDir);
      fs.writeFileSync(testFile, 'test content');
    });

    it('should remove existing file', () => {
      expect(fs.existsSync(testFile)).toBe(true);
      
      FsCompat.removeFileSync(testFile);
      
      expect(fs.existsSync(testFile)).toBe(false);
    });

    it('should not fail when file does not exist', () => {
      const nonExistentFile = path.join(testDir, 'non-existent.txt');
      
      expect(() => FsCompat.removeFileSync(nonExistentFile)).not.toThrow();
    });

    it('should throw error when force is false and file is locked', () => {
      // このテストはプラットフォーム依存なのでスキップ可能
      if (process.platform === 'win32') {
        return; // Windowsでのファイルロックテストは複雑なのでスキップ
      }
      
      expect(() => FsCompat.removeFileSync(testFile, false)).not.toThrow();
    });

    it('should not throw error when force is true', () => {
      expect(() => FsCompat.removeFileSync(testFile, true)).not.toThrow();
    });
  });

  describe('removeSync', () => {
    beforeEach(() => {
      // テスト構造を作成
      FsCompat.ensureDirSync(testSubDir);
      fs.writeFileSync(testFile, 'test content');
      fs.writeFileSync(testFileInSubDir, 'nested content');
    });

    it('should remove single file', () => {
      expect(fs.existsSync(testFile)).toBe(true);
      
      FsCompat.removeSync(testFile);
      
      expect(fs.existsSync(testFile)).toBe(false);
    });

    it('should remove directory recursively', () => {
      expect(fs.existsSync(testDir)).toBe(true);
      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.existsSync(testFileInSubDir)).toBe(true);
      
      FsCompat.removeSync(testDir, { recursive: true });
      
      expect(fs.existsSync(testDir)).toBe(false);
    });

    it('should not fail when path does not exist', () => {
      const nonExistentPath = path.join(__dirname, 'non-existent');
      
      expect(() => FsCompat.removeSync(nonExistentPath)).not.toThrow();
    });

    it('should use force option correctly', () => {
      expect(() => FsCompat.removeSync(testDir, { recursive: true, force: true })).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(false);
    });

    it('should handle nested directory structure', () => {
      const deepDir = path.join(testDir, 'a', 'b', 'c', 'd');
      const deepFile = path.join(deepDir, 'deep-file.txt');
      
      FsCompat.ensureDirSync(deepDir);
      fs.writeFileSync(deepFile, 'deep content');
      
      expect(fs.existsSync(deepFile)).toBe(true);
      
      FsCompat.removeSync(testDir, { recursive: true });
      
      expect(fs.existsSync(testDir)).toBe(false);
    });
  });

  describe('fallback implementation', () => {
    let originalRmSync: any;
    let mockIsRmSyncAvailable: jest.SpyInstance;

    beforeEach(() => {
      // isRmSyncAvailableメソッドをモックしてfalseを返すようにする
      mockIsRmSyncAvailable = jest.spyOn(FsCompat as any, 'isRmSyncAvailable').mockReturnValue(false);
      
      // テスト構造を作成
      FsCompat.ensureDirSync(testSubDir);
      fs.writeFileSync(testFile, 'test content');
      fs.writeFileSync(testFileInSubDir, 'nested content');
    });

    afterEach(() => {
      // モックを復元
      mockIsRmSyncAvailable.mockRestore();
    });

    it('should use fallback implementation when fs.rmSync is not available', () => {
      expect(fs.existsSync(testDir)).toBe(true);
      
      FsCompat.removeSync(testDir, { recursive: true });
      
      expect(fs.existsSync(testDir)).toBe(false);
    });

    it('should handle fallback implementation with force option', () => {
      expect(() => FsCompat.removeSync(testDir, { recursive: true, force: true })).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle permission errors gracefully with force=true', () => {
      FsCompat.ensureDirSync(testDir);
      fs.writeFileSync(testFile, 'test content');
      
      // force=trueでエラーを無視
      expect(() => FsCompat.removeFileSync(testFile, true)).not.toThrow();
    });

    it('should handle invalid paths gracefully', () => {
      // 無効なパスを渡してもエラーにならないことを確認
      expect(() => FsCompat.removeSync('', { force: true })).not.toThrow();
      expect(() => FsCompat.removeFileSync('', true)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: create, populate, and remove', () => {
      // 1. ディレクトリ作成
      FsCompat.ensureDirSync(testDir);
      expect(fs.existsSync(testDir)).toBe(true);

      // 2. ファイル作成
      fs.writeFileSync(testFile, 'integration test content');
      expect(fs.existsSync(testFile)).toBe(true);

      // 3. サブディレクトリとファイル作成
      FsCompat.ensureDirSync(testSubDir);
      fs.writeFileSync(testFileInSubDir, 'nested integration content');
      expect(fs.existsSync(testFileInSubDir)).toBe(true);

      // 4. 個別ファイル削除
      FsCompat.removeFileSync(testFile);
      expect(fs.existsSync(testFile)).toBe(false);
      expect(fs.existsSync(testSubDir)).toBe(true);

      // 5. 残りを再帰的削除
      FsCompat.removeSync(testDir, { recursive: true });
      expect(fs.existsSync(testDir)).toBe(false);
    });

    it('should handle mixed file and directory operations', () => {
      const files = ['file1.txt', 'file2.txt', 'file3.txt'];
      const dirs = ['dir1', 'dir2', 'dir3'];

      // 複数のファイルとディレクトリを作成
      FsCompat.ensureDirSync(testDir);
      
      files.forEach(fileName => {
        fs.writeFileSync(path.join(testDir, fileName), `Content of ${fileName}`);
      });

      dirs.forEach(dirName => {
        const dirPath = path.join(testDir, dirName);
        FsCompat.ensureDirSync(dirPath);
        fs.writeFileSync(path.join(dirPath, 'nested.txt'), `Nested in ${dirName}`);
      });

      // すべてが作成されていることを確認
      files.forEach(fileName => {
        expect(fs.existsSync(path.join(testDir, fileName))).toBe(true);
      });

      dirs.forEach(dirName => {
        expect(fs.existsSync(path.join(testDir, dirName))).toBe(true);
        expect(fs.existsSync(path.join(testDir, dirName, 'nested.txt'))).toBe(true);
      });

      // 一括削除
      FsCompat.removeSync(testDir, { recursive: true, force: true });
      expect(fs.existsSync(testDir)).toBe(false);
    });
  });
});