/**
 * CacheFileValidator - キャッシュファイル検証ユーティリティ
 * Issue #128対応: 未引用ハッシュファイル検出とキャッシュファイル管理
 *
 * 適用設計原則:
 * - SOLID原則: 単一責任原則によるキャッシュファイル検証の専門化
 * - DRY原則: 重複するキャッシュファイル処理の統一化
 * - KISS原則: シンプルで理解しやすいAPI設計
 * - Defensive Programming: エラー耐性と安全な処理の実装
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * キャッシュファイル検証クラス
 * Martin Fowler推奨のExtract Methodリファクタリング適用
 */
export class CacheFileValidator {
  /**
   * 危険なキャッシュファイルパターン
   * Issue #118対応の包括的キャッシュファイル除外に対応
   */
  private static readonly DANGEROUS_CACHE_PATTERNS = [
    '.jest-cache/**/*',
    '.cache/**/*',
    '.rimor-cache/**/*',
    '**/*.tsbuildinfo',
    '.turbo/**/*',
    '.nx/cache/**/*',
    '.vite/cache/**/*',
    '.parcel-cache/**/*',
    '*.webpack-cache/**/*',
    '.rpt2_cache/**/*',
    '.rollup-cache/**/*',
  ] as const;

  /**
   * 未引用ハッシュパターン
   * Issue #128の具体的問題パターン: fe91943ff0a283cbe97fabe367f9a72e
   */
  private static readonly INVALID_HASH_PATTERN = /^[a-f0-9]{32}$/;

  /**
   * 必須の.gitignoreキャッシュ除外パターン
   */
  private static readonly REQUIRED_GITIGNORE_PATTERNS = [
    '.jest-cache',
    '.cache',
    '.rimor-cache',
  ] as const;

  /**
   * 未引用ハッシュファイル検出
   * Issue #128の核心問題対応
   *
   * @param projectRoot プロジェクトルートパス
   * @returns 問題のあるファイルパスの配列
   */
  static async detectUnquotedHashFiles(projectRoot: string): Promise<string[]> {
    const problemFiles: string[] = [];

    try {
      for (const pattern of this.DANGEROUS_CACHE_PATTERNS) {
        const files = await this.safeGlob(path.join(projectRoot, pattern));

        for (const file of files) {
          if (await this.hasUnquotedHashContent(file)) {
            problemFiles.push(file);
          }
        }
      }
    } catch (error) {
      // Defensive Programming: エラーハンドリング
      console.warn('キャッシュファイル検証エラー:', error);
    }

    return problemFiles;
  }

  /**
   * .gitignoreにキャッシュファイル除外設定があるかチェック
   * Issue #118対応の検証
   *
   * @param projectRoot プロジェクトルートパス
   * @returns 適切な設定があればtrue
   */
  static validateGitignoreSettings(projectRoot: string): boolean {
    try {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        return false;
      }

      const content = fs.readFileSync(gitignorePath, 'utf-8');

      // DRY原則: 必要なキャッシュファイル除外パターンの統一チェック
      return this.REQUIRED_GITIGNORE_PATTERNS.every(
        pattern => content.includes(pattern + '/') || content.includes(pattern)
      );
    } catch (error) {
      // Defensive Programming: エラー処理
      console.warn('gitignore検証エラー:', error);
      return false;
    }
  }

  /**
   * プロジェクト全体のキャッシュファイル健全性チェック
   * 統合的なキャッシュファイル管理検証
   *
   * @param projectRoot プロジェクトルートパス
   * @returns 検証結果サマリー
   */
  static async validateProjectCacheHealth(projectRoot: string): Promise<{
    hasProblematicFiles: boolean;
    problematicFiles: string[];
    hasValidGitignore: boolean;
    isHealthy: boolean;
  }> {
    const [problematicFiles, hasValidGitignore] = await Promise.all([
      this.detectUnquotedHashFiles(projectRoot),
      Promise.resolve(this.validateGitignoreSettings(projectRoot)),
    ]);

    return {
      hasProblematicFiles: problematicFiles.length > 0,
      problematicFiles,
      hasValidGitignore,
      isHealthy: problematicFiles.length === 0 && hasValidGitignore,
    };
  }

  /**
   * 安全なglobファイル検索
   * Extract Method適用: エラー耐性を持つglob処理
   *
   * @private
   * @param pattern globパターン
   * @returns ファイルパス配列
   */
  private static async safeGlob(pattern: string): Promise<string[]> {
    try {
      const files = await glob(pattern);
      // Defensive Programming: 型安全性チェック
      return Array.isArray(files) ? files : [];
    } catch (error) {
      console.warn(`Glob検索エラー (${pattern}):`, error);
      return [];
    }
  }

  /**
   * ファイルに未引用ハッシュが含まれるかチェック
   * Extract Method適用: ハッシュ検証ロジックの独立化
   *
   * @private
   * @param filePath ファイルパス
   * @returns 未引用ハッシュが含まれればtrue
   */
  private static async hasUnquotedHashContent(filePath: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Issue #128の具体的パターン: 先頭行に未引用ハッシュがあるかチェック
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        return this.INVALID_HASH_PATTERN.test(firstLine);
      }

      return false;
    } catch (error) {
      // ファイル読み込みエラーは問題なしとして処理
      return false;
    }
  }

  /**
   * キャッシュファイルクリーンアップの推奨実行
   * YAGNI原則に基づく必要最小限の機能
   *
   * @param projectRoot プロジェクトルートパス
   * @returns クリーンアップされたディレクトリ数
   */
  static async suggestCacheCleanup(projectRoot: string): Promise<{
    suggestions: string[];
    safeToClean: boolean;
  }> {
    const suggestions: string[] = [];
    let safeToClean = true;

    try {
      // .gitignoreの設定確認
      if (!this.validateGitignoreSettings(projectRoot)) {
        suggestions.push('.gitignoreにキャッシュファイル除外設定を追加してください');
        safeToClean = false;
      }

      // 問題のあるキャッシュファイル確認
      const problematicFiles = await this.detectUnquotedHashFiles(projectRoot);
      if (problematicFiles.length > 0) {
        suggestions.push(
          `${problematicFiles.length}個の問題のあるキャッシュファイルが検出されました`
        );
        suggestions.push(...problematicFiles.map(file => `  - ${file}`));
        safeToClean = false;
      }

      if (suggestions.length === 0) {
        suggestions.push('キャッシュファイル管理は正常です');
      }
    } catch (error) {
      suggestions.push(`検証エラーが発生しました: ${error}`);
      safeToClean = false;
    }

    return { suggestions, safeToClean };
  }
}
