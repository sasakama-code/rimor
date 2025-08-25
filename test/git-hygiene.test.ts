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

describe('Git Hygiene - Issue #113, #118対応', () => {
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

  describe('Issue #118対応: 包括的キャッシュファイル検出（TDD-RED）', () => {
    test('Git追跡対象にTypeScriptビルドキャッシュファイルが含まれていない', () => {
      // Git追跡されている全ファイルを取得
      const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
      const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
      
      // TypeScriptビルドキャッシュファイルの検出パターン
      const buildCachePatterns = [
        /\.tsbuildinfo$/,           // TypeScriptビルド情報
        /^\.ts-jest\//,            // ts-jestキャッシュ
        /^\.cache\//,              // 一般キャッシュ
        /^\.turbo\//,              // Turboキャッシュ  
        /^\.nx\/cache\//,          // Nxキャッシュ
        /^\.vite\/cache\//,        // Viteキャッシュ
        /^\.parcel-cache\//,       // Parcelキャッシュ
        /\.webpack-cache\//         // Webpackキャッシュ
      ];
      
      const detectedCacheFiles = trackedFilesList.filter(file => 
        buildCachePatterns.some(pattern => pattern.test(file))
      );
      
      // キャッシュファイルが検出された場合は詳細情報を提供
      if (detectedCacheFiles.length > 0) {
        const errorMessage = `検出されたキャッシュファイル:\n${detectedCacheFiles.join('\n')}`;
        console.error(`[SECURITY RISK] ${errorMessage}`);
      }
      
      expect(detectedCacheFiles).toHaveLength(0);
    });

    test('Git追跡対象にJestトランスフォームキャッシュが含まれていない', () => {
      const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
      const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
      
      // Jest transform cacheの特定パターン（Issue #118で具体的に指摘されたパターン）
      const jestTransformCacheFiles = trackedFilesList.filter(file => 
        file.includes('jest-transform-cache-') && 
        file.includes('/34/') &&
        file.includes('IntentPatternMatcher_')
      );
      
      expect(jestTransformCacheFiles).toHaveLength(0);
    });

    test('潜在的PII露出リスクファイルの検出', () => {
      const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
      const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
      
      // PII露出リスクがある可能性のあるファイルパターン
      const piiRiskPatterns = [
        /\.map$/,                  // ソースマップファイル
        /\.log$/,                  // ログファイル  
        /cache.*\.json$/,          // キャッシュJSON（機密情報の可能性）
        /\.env\.local$/,          // ローカル環境変数
        /\.cache.*\.js$/,         // キャッシュJSファイル
        /debug.*\.log$/           // デバッグログ
      ];
      
      const potentialPIIFiles = trackedFilesList.filter(file => 
        piiRiskPatterns.some(pattern => pattern.test(file))
      );
      
      // 許可されたファイル（プロジェクトで意図的に管理しているファイル）を除外
      const allowedExceptions = [
        'package-lock.json',
        'src/reporting/schema.json',
        // その他の意図的に管理されているファイル
      ];
      
      const actualRiskFiles = potentialPIIFiles.filter(file => 
        !allowedExceptions.some(exception => file.includes(exception))
      );
      
      if (actualRiskFiles.length > 0) {
        const riskMessage = `潜在的PII露出リスクファイル:\n${actualRiskFiles.join('\n')}`;
        console.warn(`[PII RISK WARNING] ${riskMessage}`);
      }
      
      expect(actualRiskFiles).toHaveLength(0);
    });

    test('大容量バイナリキャッシュファイルの検出', () => {
      const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
      const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
      
      // 大容量になりがちなバイナリキャッシュファイルのパターン
      const largeBinaryPatterns = [
        /\.cache$/,
        /\.tmp$/,
        /\.swap$/,
        /\.pid$/,
        /\.lock$/,
        /node_modules\.cache/,
        /coverage\/.*\.json$/
      ];
      
      const largeBinaryFiles = trackedFilesList.filter(file => 
        largeBinaryPatterns.some(pattern => pattern.test(file))
      );
      
      expect(largeBinaryFiles).toHaveLength(0);
    });
  });

  describe('Issue #118対応: CI/CD統合セキュリティ強化（フェーズ1.2-RED）', () => {
    test('CI環境でのキャッシュファイル検出強化', () => {
      const originalCI = process.env.CI;
      
      try {
        // CI環境をシミュレート
        process.env.CI = 'true';
        
        const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
        const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
        
        // CI環境で特に重要なキャッシュファイルパターン
        const ciCriticalCachePatterns = [
          /^\.github\/.*\.cache$/,     // GitHub Actionsキャッシュ
          /^node_modules\.cache$/,     // NPMキャッシュファイル
          /^\.npm\/_cacache\//,        // NPMキャッシュ詳細
          /\/coverage\/.*\.tmp$/,      // カバレッジ一時ファイル
          /\/\.coverage\//,            // カバレッジディレクトリ
          /test-results\/.*\.cache$/   // テスト結果キャッシュ
        ];
        
        const ciCacheFiles = trackedFilesList.filter(file => 
          ciCriticalCachePatterns.some(pattern => pattern.test(file))
        );
        
        if (ciCacheFiles.length > 0) {
          console.error(`[CI SECURITY RISK] 検出されたCI環境キャッシュファイル:\n${ciCacheFiles.join('\n')}`);
        }
        
        expect(ciCacheFiles).toHaveLength(0);
      } finally {
        // 環境変数を復元
        if (originalCI !== undefined) {
          process.env.CI = originalCI;
        } else {
          delete process.env.CI;
        }
      }
    });

    test('セキュリティリスクレベル評価システム', () => {
      const trackedFiles = GitTestHelpers.execGitCommand('git ls-files', {});
      const trackedFilesList = trackedFiles.split('\n').filter(Boolean);
      
      // NIST準拠のリスクレベル分類
      const riskClassification = {
        CRITICAL: [
          /\.env$/,              // 環境変数ファイル
          /\.key$/,              // 秘密鍵
          /\.pem$/,              // 証明書
          /\.p12$/,              // PKCS12証明書
          /password/i,           // パスワード含有ファイル
          /secret/i              // シークレット含有ファイル
        ],
        HIGH: [
          /\.map$/,              // ソースマップ（PII露出）
          /\.log$/,              // ログファイル
          /\.cache$/,            // キャッシュファイル
          /node_modules\/.*/,    // 依存関係
          /\.backup$/            // バックアップファイル
        ],
        MEDIUM: [
          /\.tmp$/,              // 一時ファイル
          /\.swp$/,              // viスワップファイル
          /\.DS_Store$/,         // macOSメタデータ
          /Thumbs\.db$/          // Windowsメタデータ
        ]
      };
      
      const riskResults = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: []
      };
      
      // リスク分類の実行
      Object.entries(riskClassification).forEach(([level, patterns]) => {
        riskResults[level] = trackedFilesList.filter(file =>
          patterns.some(pattern => pattern.test(file))
        );
      });
      
      // CRITICAL: 許容度ゼロ
      if (riskResults.CRITICAL.length > 0) {
        console.error(`[CRITICAL SECURITY RISK] ${riskResults.CRITICAL.join(', ')}`);
      }
      expect(riskResults.CRITICAL).toHaveLength(0);
      
      // HIGH: 許容度ゼロ（Issue #118修正後）
      if (riskResults.HIGH.length > 0) {
        console.error(`[HIGH SECURITY RISK] ${riskResults.HIGH.join(', ')}`);
      }
      expect(riskResults.HIGH).toHaveLength(0);
      
      // MEDIUM: 警告のみ（許容範囲）
      if (riskResults.MEDIUM.length > 0) {
        console.warn(`[MEDIUM RISK WARNING] ${riskResults.MEDIUM.join(', ')}`);
      }
      // MEDIUMは警告のみで失敗させない
    });

    test('自動修復機能の検証', () => {
      // git check-ignoreコマンドで無視パターンの動作確認
      const criticalPatterns = [
        '.jest-cache/',
        '.ts-jest/',
        '*.tsbuildinfo',
        '*.map',
        '.cache/',
        '.turbo/',
        '.nx/cache/',
        '.vite/cache/',
        '.parcel-cache/'
      ];
      
      criticalPatterns.forEach(pattern => {
        try {
          const result = GitTestHelpers.execGitCommand(`git check-ignore "${pattern}"`, {}).trim();
          expect(result).toBe(pattern);
        } catch (error) {
          if (error instanceof Error && 'status' in error) {
            if ((error as any).status !== 0) {
              throw new Error(`パターン "${pattern}" がGitで正しく無視されていません`);
            }
          }
          throw error;
        }
      });
    });

    test('エラー報告品質の検証', () => {
      // 意図的に存在しないGitコマンドを実行してエラーハンドリングをテスト
      expect(() => {
        GitTestHelpers.execGitCommand('git nonexistent-command', {});
      }).toThrow(/Command failed|Git command failed/);
      
      // 不正なパラメータでのテスト
      expect(() => {
        GitTestHelpers.execGitCommand('git ls-files --invalid-option', {});
      }).toThrow();
    });

    test('大容量リポジトリでのパフォーマンス検証', () => {
      const startTime = Date.now();
      
      // 大容量のファイルリスト取得操作
      const result = GitTestHelpers.execGitCommand('git ls-files', {});
      const fileCount = result.split('\n').filter(Boolean).length;
      
      const executionTime = Date.now() - startTime;
      
      // ファイル数に関係なく、パフォーマンスが許容範囲内であることを確認
      const maxTimePerFile = 10; // ms per file
      const expectedMaxTime = Math.max(5000, fileCount * maxTimePerFile);
      
      expect(executionTime).toBeLessThan(expectedMaxTime);
      expect(fileCount).toBeGreaterThan(0);
      
      console.log(`パフォーマンス情報: ${fileCount}ファイル処理に${executionTime}ms（${(executionTime/fileCount).toFixed(2)}ms/file）`);
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