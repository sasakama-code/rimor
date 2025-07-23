/**
 * クリーンアップマネージャー
 * 不要なファイルの自動削除とプロジェクト整理を担当
 */

import * as fs from 'fs';
import * as path from 'path';
import { errorHandler } from './errorHandler';

export interface CleanupRule {
  pattern: string | RegExp;
  reason: string;
  enabled: boolean;
}

export class CleanupManager {
  private static instance: CleanupManager;
  private readonly defaultRules: CleanupRule[] = [
    {
      pattern: /^src\/plugins\/generated\/saved-plugin\.ts$/,
      reason: '不正なプラグインファイル（型エラーを含む自動生成ファイル）',
      enabled: true
    },
    {
      pattern: /^src\/plugins\/generated\/.*\.ts$/,
      reason: 'テスト生成ファイル（コンパイルエラーを含む可能性）',
      enabled: false // デフォルトは無効（個別判定が必要）
    },
    {
      pattern: /\.tmp$/,
      reason: '一時ファイル',
      enabled: true
    },
    {
      pattern: /\.bak$/,
      reason: 'バックアップファイル',
      enabled: true
    }
  ];

  private constructor() {}

  static getInstance(): CleanupManager {
    if (!CleanupManager.instance) {
      CleanupManager.instance = new CleanupManager();
    }
    return CleanupManager.instance;
  }

  /**
   * プロジェクト開始時のクリーンアップ実行
   * @param projectRoot プロジェクトルートディレクトリ
   */
  async performStartupCleanup(projectRoot: string = process.cwd()): Promise<void> {
    console.log('🧹 プロジェクト開始時クリーンアップを実行中...');
    
    try {
      const cleanedFiles = await this.cleanupByRules(projectRoot);
      
      if (cleanedFiles.length > 0) {
        console.log(`✅ ${cleanedFiles.length}個のファイルをクリーンアップしました`);
        cleanedFiles.forEach(file => {
          console.log(`   - ${file.relativePath} (${file.reason})`);
        });
      } else {
        console.log('✅ クリーンアップ対象ファイルはありませんでした');
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        'プロジェクト開始時クリーンアップでエラーが発生しました',
        { projectRoot },
        true
      );
    }
  }

  /**
   * 特定のファイルが問題を起こしている場合の緊急削除
   * @param filePath 問題のあるファイルのパス
   * @param reason 削除理由
   */
  async emergencyDelete(filePath: string, reason: string): Promise<boolean> {
    try {
      const absolutePath = path.resolve(filePath);
      
      if (!fs.existsSync(absolutePath)) {
        return true; // 既に存在しない場合は削除成功とみなす
      }

      fs.unlinkSync(absolutePath);
      console.log(`🗑️  緊急削除: ${filePath} (${reason})`);
      return true;
    } catch (error) {
      errorHandler.handleFileError(error, filePath, 'delete');
      return false;
    }
  }

  /**
   * コンパイルエラーの原因となるファイルを検出・削除
   * @param errorMessage TypeScriptコンパイルエラーメッセージ
   */
  async handleCompileError(errorMessage: string): Promise<boolean> {
    // saved-plugin.tsによるエラーを検出
    const savedPluginError = errorMessage.includes('saved-plugin.ts') && 
                             errorMessage.includes('Cannot find name \'IPlugin\'');
    
    if (savedPluginError) {
      const savedPluginPath = 'src/plugins/generated/saved-plugin.ts';
      console.log('⚠️  コンパイルエラーの原因ファイルを検出しました');
      return await this.emergencyDelete(
        savedPluginPath, 
        'TypeScriptコンパイルエラーの原因（IPlugin型定義エラー）'
      );
    }

    // その他のプラグイン生成ファイルのエラーを検出
    const pluginGeneratedMatch = errorMessage.match(/src\/plugins\/generated\/([^:]+\.ts)/);
    if (pluginGeneratedMatch) {
      const problematicFile = pluginGeneratedMatch[0];
      console.log(`⚠️  生成プラグインファイルでエラーを検出: ${problematicFile}`);
      return await this.emergencyDelete(
        problematicFile,
        'TypeScriptコンパイルエラーの原因（生成プラグインファイル）'
      );
    }

    return false;
  }

  /**
   * ルールベースのクリーンアップ実行
   * @param rootDir 対象ディレクトリ
   */
  private async cleanupByRules(rootDir: string): Promise<Array<{relativePath: string, reason: string}>> {
    const cleanedFiles: Array<{relativePath: string, reason: string}> = [];
    const enabledRules = this.defaultRules.filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      const matches = await this.findFilesByRule(rootDir, rule);
      
      for (const match of matches) {
        try {
          fs.unlinkSync(match.absolutePath);
          cleanedFiles.push({
            relativePath: match.relativePath,
            reason: rule.reason
          });
        } catch (error) {
          errorHandler.handleFileError(error, match.absolutePath, 'delete');
        }
      }
    }

    return cleanedFiles;
  }

  /**
   * ルールに合致するファイルを検索
   * @param rootDir 検索対象ディレクトリ
   * @param rule クリーンアップルール
   */
  private async findFilesByRule(
    rootDir: string, 
    rule: CleanupRule
  ): Promise<Array<{absolutePath: string, relativePath: string}>> {
    const matches: Array<{absolutePath: string, relativePath: string}> = [];

    const searchDir = (dir: string): void => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        if (entry.isDirectory()) {
          // node_modules等の除外
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            searchDir(fullPath);
          }
        } else if (entry.isFile()) {
          let isMatch = false;

          if (rule.pattern instanceof RegExp) {
            isMatch = rule.pattern.test(relativePath);
          } else {
            isMatch = relativePath.includes(rule.pattern);
          }

          if (isMatch) {
            matches.push({
              absolutePath: fullPath,
              relativePath: relativePath
            });
          }
        }
      }
    };

    searchDir(rootDir);
    return matches;
  }

  /**
   * クリーンアップルールの追加
   * @param pattern ファイルパターン
   * @param reason 削除理由
   * @param enabled 有効かどうか
   */
  addRule(pattern: string | RegExp, reason: string, enabled: boolean = true): void {
    this.defaultRules.push({ pattern, reason, enabled });
  }

  /**
   * 現在のクリーンアップルールを取得
   */
  getRules(): CleanupRule[] {
    return [...this.defaultRules];
  }
}

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const cleanupManager = CleanupManager.getInstance();