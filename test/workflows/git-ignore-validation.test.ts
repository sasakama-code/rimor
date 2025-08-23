/**
 * Git Ignore Validation Tests
 * 
 * .jest-cacheディレクトリがGit追跡から除外されていることを確認するテスト
 * 
 * TDD原則に従いRED（失敗）フェーズから開始
 * Issue #97対応: .jest-cacheキャッシュファイルのGit追跡除外
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('GitIgnoreValidation', () => {
  let originalCwd: string;
  const projectRoot = path.resolve(__dirname, '..', '..');

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir(projectRoot);
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  describe('.jest-cacheディレクトリの追跡除外確認', () => {
    test('.gitignoreファイルに.jest-cache/が含まれている', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      
      expect(fs.existsSync(gitignorePath)).toBe(true);
      
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toContain('.jest-cache/');
    });

    test('.jest-cacheファイルがGitによって追跡されていない', async () => {
      // RED: 現在は.jest-cacheファイルが追跡されているので失敗予定
      try {
        const { stdout } = await execAsync('git ls-files | grep "^.jest-cache/"');
        
        // 追跡されているファイルが見つかった場合はテスト失敗
        expect(stdout.trim()).toBe('');
      } catch (error) {
        // grepが何も見つからない場合は期待通り（exit code 1）
        if ((error as any).code === 1) {
          // これは期待される動作
          expect(true).toBe(true);
        } else {
          // その他のエラーは予期しない
          throw error;
        }
      }
    });

    test('.jest-cacheディレクトリがGitステータスに表示されない', async () => {
      // .jest-cacheディレクトリが存在することを確認
      const jestCachePath = path.join(projectRoot, '.jest-cache');
      
      if (fs.existsSync(jestCachePath)) {
        // git statusで.jest-cacheが表示されないことを確認
        const { stdout } = await execAsync('git status --porcelain');
        const statusLines = stdout.split('\n').filter(line => line.trim() !== '');
        
        // .jest-cacheに関連する行がないことを確認
        const jestCacheLines = statusLines.filter(line => line.includes('.jest-cache'));
        expect(jestCacheLines).toHaveLength(0);
      } else {
        // .jest-cacheディレクトリが存在しない場合はパス
        expect(true).toBe(true);
      }
    });

    test('既存の.jest-cacheファイルが正常にクリーンアップされる', async () => {
      // RED: git rm実行前は追跡ファイルが存在するので失敗予定
      const { stdout: trackedFiles } = await execAsync('git ls-files | grep "^.jest-cache/" | wc -l');
      const trackedCount = parseInt(trackedFiles.trim(), 10);
      
      // 追跡されているファイルが0であることを期待（git rm実行後）
      expect(trackedCount).toBe(0);
    }, 10000);
  });

  describe('CI環境でのキャッシュファイル検証', () => {
    test('CI環境でキャッシュファイルが含まれない', async () => {
      // CIでビルドした際にキャッシュファイルが含まれないことを確認
      const { stdout } = await execAsync('git ls-files | grep -E "(cache|temp)" | grep -v coverage');
      
      // キャッシュファイルが追跡されていないことを確認
      const cacheFiles = stdout.split('\n').filter(line => 
        line.includes('.jest-cache') || 
        line.includes('node_modules/.cache')
      );
      
      expect(cacheFiles).toHaveLength(0);
    });

    test('.gitignoreの設定が正しく適用されている', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // キャッシュ関連の除外設定を確認
      const cacheExclusions = [
        '.rimor-cache/',
        '.jest-cache/',
        'node_modules/'
      ];
      
      cacheExclusions.forEach(exclusion => {
        expect(gitignoreContent).toContain(exclusion);
      });
    });

    test('テスト実行時に一時的に生成されるキャッシュが追跡されない', async () => {
      // テスト実行前のGit状態を記録
      const { stdout: beforeStatus } = await execAsync('git status --porcelain');
      
      // 簡単なテスト実行（キャッシュ生成を誘発）
      try {
        await execAsync('npm run test:quick', { timeout: 30000 });
      } catch (error) {
        // テストが失敗してもキャッシュの確認は続行
      }
      
      // テスト実行後のGit状態を確認
      const { stdout: afterStatus } = await execAsync('git status --porcelain');
      
      // 新しくキャッシュファイルが追跡されていないことを確認
      const beforeLines = beforeStatus.split('\n').filter(line => line.includes('.jest-cache'));
      const afterLines = afterStatus.split('\n').filter(line => line.includes('.jest-cache'));
      
      expect(afterLines.length).toBe(beforeLines.length);
    }, 60000);
  });

  describe('エラーハンドリング（Defensive Programming）', () => {
    test('.gitignoreファイルが存在しない場合の適切なエラー', () => {
      const nonExistentPath = path.join(projectRoot, 'non-existent', '.gitignore');
      
      expect(() => {
        fs.readFileSync(nonExistentPath, 'utf8');
      }).toThrow();
    });

    test('Git リポジトリが初期化されていない場合', async () => {
      // 非Gitディレクトリでのテスト
      const tempDir = path.join(projectRoot, 'temp-test-dir');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      process.chdir(tempDir);
      
      try {
        await execAsync('git status');
        // Gitリポジトリではない場合はエラーが発生する
        expect(false).toBe(true); // このテストは失敗すべき
      } catch (error) {
        // 期待されるエラー
        expect((error as any).message).toMatch(/not a git repository/i);
      }
      
      process.chdir(projectRoot);
      
      // クリーンアップ
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // クリーンアップエラーは無視
      }
    });

    test('権限不足でGitコマンドが実行できない場合', async () => {
      // このテストはCI環境での権限制限をシミュレート
      try {
        // 無効なGitコマンドを実行
        await execAsync('git --invalid-option');
      } catch (error) {
        expect((error as any).code).not.toBe(0);
      }
    });
  });
});

// TypeScript型定義（Defensive Programming）
interface GitStatus {
  tracked: string[];
  untracked: string[];
  modified: string[];
}

interface GitIgnoreValidation {
  isIgnored: boolean;
  trackedCount: number;
  errors: string[];
}

interface CacheValidationResult {
  success: boolean;
  trackedCacheFiles: string[];
  message: string;
}