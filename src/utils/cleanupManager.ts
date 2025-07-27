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
      reason: "",
      enabled: true
    },
    // 安全性重視: 他のプラグインファイルは削除対象から除外
    // ユーザーが意図的に作成したファイルの削除を防ぐ
    {
      pattern: /\.tmp$/,
      reason: "",
      enabled: true
    },
    {
      pattern: /\.bak$/,
      reason: "",
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
    console.log("");
    
    try {
      const cleanedFiles = await this.cleanupByRules(projectRoot);
      
      if (cleanedFiles.length > 0) {
        console.log("");
        cleanedFiles.forEach(file => {
          console.log(`   - ${file.relativePath} (${file.reason})`);
        });
      } else {
        console.log("");
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        "",
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
      console.log("");
      return true;
    } catch (error) {
      errorHandler.handleFileError(error, filePath, 'delete');
      return false;
    }
  }

  /**
   * コンパイルエラーの原因となるファイルを検出・削除（安全性重視）
   * @param errorMessage TypeScriptコンパイルエラーメッセージ
   */
  async handleCompileError(errorMessage: string): Promise<boolean> {
    // saved-plugin.tsによるエラーのみを自動削除対象とする
    const savedPluginError = errorMessage.includes('saved-plugin.ts') && 
                             (errorMessage.includes('Cannot find name \'IPlugin\'') ||
                              errorMessage.includes('TS2552') ||
                              errorMessage.includes('TS2304'));
    
    if (savedPluginError) {
      const savedPluginPath = 'src/plugins/generated/saved-plugin.ts';
      console.log("");
      return await this.emergencyDelete(
        savedPluginPath, 
        ""
      );
    }

    // その他のプラグインファイルエラーは警告のみ表示（削除しない）
    const pluginGeneratedMatch = errorMessage.match(/src\/plugins\/generated\/([^:]+\.ts)/);
    if (pluginGeneratedMatch) {
      const problematicFile = pluginGeneratedMatch[0];
      console.log("");
      console.log('   ' + "");
      console.log('   ' + "");
      // 削除は行わず、falseを返す
      return false;
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