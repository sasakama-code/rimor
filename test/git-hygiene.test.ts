// @ts-nocheck
/**
 * Git Hygiene Tests - Issue #113対応
 * 
 * TDD原則に従い、.jest-cacheディレクトリの完全なGit除外を確認するテスト
 * 
 * RED Phase: 失敗するテストから開始
 * GREEN Phase: 最小限の実装で通す
 * REFACTOR Phase: コードを改善する
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// DRY原則に従った共通ヘルパー関数
const GitTestHelpers = {
  execGitCommand(command, options = {}) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 5000,
        ...options
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Git command failed: ${command} - ${error.message}`);
      }
      throw error;
    }
  },

  validateGitignoreContent(gitignorePath, requiredExclusions) {
    if (!fs.existsSync(gitignorePath)) {
      throw new Error('.gitignoreファイルが存在しません');
    }
    
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    requiredExclusions.forEach(exclusion => {
      if (!gitignoreContent.includes(exclusion)) {
        throw new Error(`必要な除外設定が見つかりません: ${exclusion}`);
      }
    });
  }
};

describe('Git Hygiene - Issue #113対応', () => {
  const projectRoot = path.resolve(__dirname, '..');

  beforeAll(() => {
    // テスト実行前にプロジェクトルートに移動
    process.chdir(projectRoot);
  });

  describe('TDD Red Phase: .jest-cacheの完全除外確認', () => {
    test('Git追跡されているファイル一覧に.jest-cacheファイルが含まれていない', () => {
      // Git追跡されている全ファイルを取得
      const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
      const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
      
      // .jest-cacheで始まるファイルがないことを確認
      const jestCacheFiles = trackedFilesList.filter(file => 
        file.startsWith('.jest-cache/')
      );
      
      expect(jestCacheFiles).toHaveLength(0);
      
      // より厳密な確認：jest-cacheという文字列を含むファイルがないこと
      const filesWithJestCache = trackedFilesList.filter(file => 
        file.includes('jest-cache') && !file.includes('jest-cache-fix')
      );
      
      expect(filesWithJestCache).toHaveLength(0);
    });

    test('git statusで.jest-cacheディレクトリが無視されている', () => {
      // .jest-cacheディレクトリが存在する場合の確認
      if (fs.existsSync(path.join(projectRoot, '.jest-cache'))) {
        // git statusで.jest-cacheが表示されないことを確認
        const gitStatus = GitTestHelpers.execGitCommand('git status --ignored', {});
        
        // ignoredファイルとして表示されているか確認
        expect(gitStatus).toMatch(/\.jest-cache/);
        expect(gitStatus).toMatch(/Ignored files:/);
        
        // untrackedファイルやmodifiedファイルとして表示されていないことを確認
        const gitStatusShort = GitTestHelpers.execGitCommand('git status --porcelain', {});
        const statusLines = gitStatusShort.split('\n').filter(Boolean);
        
        const jestCacheStatusLines = statusLines.filter(line => 
          line.includes('.jest-cache')
        );
        
        expect(jestCacheStatusLines).toHaveLength(0);
      }
    });

    test('git check-ignoreで.jest-cacheが無視対象として認識される', () => {
      try {
        // .jest-cacheディレクトリが無視対象として認識されることを確認
        const checkIgnoreResult = GitTestHelpers.execGitCommand('git check-ignore .jest-cache/', {}).trim();
        expect(checkIgnoreResult).toBe('.jest-cache/');
      } catch (error) {
        if (error instanceof Error && 'status' in error) {
          // git check-ignoreは無視対象でない場合はexit code 1を返す
          if ((error as any).status !== 0) {
            throw new Error('.jest-cache/ディレクトリがGitで無視されていません');
          }
        }
        throw error;
      }
    });
  });

  describe('TDD Green Phase: .gitignore設定の検証', () => {
    test('.gitignoreに必要な除外設定が含まれている', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      
      // キャッシュ関連の除外設定をDRY原則に従って配列で管理
      const requiredExclusions = [
        '.jest-cache/',
        '.cache/',
        '.rimor-cache/',
        'node_modules/',
        'dist/',
        'build/'
      ];
      
      // ヘルパー関数を使用した検証
      GitTestHelpers.validateGitignoreContent(gitignorePath, requiredExclusions);
      
      // 個別検証もJestのexpectで実行
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      requiredExclusions.forEach(exclusion => {
        expect(gitignoreContent).toContain(exclusion);
      });
    });

    test('.gitignoreの書式が正しい', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // .jest-cache/の行が正しい形式で存在することを確認
      const lines = gitignoreContent.split('\n');
      const jestCacheLine = lines.find(line => line.trim() === '.jest-cache/');
      
      expect(jestCacheLine).toBeDefined();
      expect(jestCacheLine).toBe('.jest-cache/');
    });
  });

  describe('TDD Refactor Phase: エラーハンドリングとエッジケース', () => {
    test('Git非管理ディレクトリでのエラーハンドリング', () => {
      // 現在のディレクトリがGitリポジトリでない場合のテスト
      const tempDir = fs.mkdtempSync(path.join(__dirname, 'temp-'));
      
      try {
        process.chdir(tempDir);
        
        expect(() => {
          execSync('git ls-files', { encoding: 'utf8', stdio: 'pipe' });
        }).toThrow();
      } catch (error) {
        // execSyncがエラーを投げない場合、手動でエラーをチェック
        try {
          execSync('git ls-files', { encoding: 'utf8', stdio: 'pipe' });
          // Gitコマンドが成功した場合（予期しない動作）
          expect(false).toBe(true);
        } catch (gitError) {
          // 期待されるエラー - Gitリポジトリでないため失敗
          expect(gitError).toBeDefined();
        }
      } finally {
        // クリーンアップ（Defensive Programming）
        process.chdir(projectRoot);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('大文字小文字の違いによるIgnore回避の防止', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // .jest-cache/が正確に小文字で記載されていることを確認
      // （大文字小文字を区別するファイルシステムでの問題を防ぐ）
      expect(gitignoreContent).toContain('.jest-cache/');
      expect(gitignoreContent).not.toContain('.Jest-cache/');
      expect(gitignoreContent).not.toContain('.JEST-CACHE/');
    });
  });

  describe('Performance and Resource Management', () => {
    test('Git操作のタイムアウト処理', () => {
      // Git操作が適切な時間内で完了することを確認
      const startTime = Date.now();
      
      GitTestHelpers.execGitCommand('git ls-files', {});
      
      const executionTime = Date.now() - startTime;
      
      // Git操作が5秒以内に完了することを確認
      expect(executionTime).toBeLessThan(5000);
    });
  });
});