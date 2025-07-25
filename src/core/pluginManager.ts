import { IPlugin, Issue } from './types';
import { PluginSandbox, DEFAULT_SANDBOX_LIMITS, SandboxLimits } from '../security/PluginSandbox';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { PathSecurity } from '../utils/pathSecurity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * セキュア対応PluginManager v0.4.1
 * プラグインサンドボックスを使用した安全なプラグイン実行管理
 */
export class PluginManager {
  private plugins: IPlugin[] = [];
  private sandboxedPlugins: Map<string, string> = new Map(); // プラグイン名 -> プラグインコード
  private sandbox: PluginSandbox;
  private projectRoot: string;
  private sandboxEnabled: boolean;

  constructor(projectRoot: string = process.cwd(), sandboxLimits?: SandboxLimits) {
    this.projectRoot = projectRoot;
    this.sandbox = new PluginSandbox(projectRoot, sandboxLimits || DEFAULT_SANDBOX_LIMITS);
    this.sandboxEnabled = true; // デフォルトでサンドボックス有効
  }

  /**
   * レガシープラグイン（IPlugin実装）の登録
   */
  register(plugin: IPlugin): void {
    // プラグイン名の検証
    if (!plugin.name || typeof plugin.name !== 'string') {
      errorHandler.handleError(
        new Error('プラグイン名が不正です'),
        ErrorType.PLUGIN_ERROR,
        'プラグインの登録に失敗しました',
        { pluginName: plugin.name }
      );
      return;
    }

    // プラグイン名の安全性チェック
    if (!/^[a-zA-Z0-9_-]+$/.test(plugin.name)) {
      errorHandler.handleError(
        new Error(`不正なプラグイン名: ${plugin.name}`),
        ErrorType.PLUGIN_ERROR,
        'プラグイン名に使用禁止文字が含まれています',
        { pluginName: plugin.name }
      );
      return;
    }

    this.plugins.push(plugin);
  }

  /**
   * プラグインコードファイルからの安全な読み込みと登録
   */
  async registerFromFile(pluginPath: string, pluginName?: string): Promise<boolean> {
    try {
      // パス検証
      const resolvedPath = PathSecurity.safeResolve(pluginPath, this.projectRoot, 'plugin-registration');
      if (!resolvedPath) {
        errorHandler.handleError(
          new Error(`不正なプラグインパス: ${pluginPath}`),
          ErrorType.PERMISSION_DENIED,
          'プラグインファイルへのアクセスが拒否されました',
          { pluginPath }
        );
        return false;
      }

      // ファイル存在確認
      if (!fs.existsSync(resolvedPath)) {
        errorHandler.handleError(
          new Error(`プラグインファイルが存在しません: ${resolvedPath}`),
          ErrorType.FILE_NOT_FOUND,
          'プラグインファイルの読み込みに失敗しました',
          { pluginPath: resolvedPath }
        );
        return false;
      }

      // ファイルサイズチェック
      const fileStats = fs.statSync(resolvedPath);
      const maxFileSize = 5 * 1024 * 1024; // 5MB
      if (fileStats.size > maxFileSize) {
        errorHandler.handleError(
          new Error(`プラグインファイルが大きすぎます: ${fileStats.size} bytes`),
          ErrorType.SYSTEM_ERROR,
          'プラグインファイルサイズが制限を超過しています',
          { pluginPath: resolvedPath, fileSize: fileStats.size, maxSize: maxFileSize }
        );
        return false;
      }

      // プラグインコード読み込み
      const pluginCode = fs.readFileSync(resolvedPath, 'utf-8');
      const finalPluginName = pluginName || path.basename(resolvedPath, path.extname(resolvedPath));

      // サンドボックス登録
      this.sandboxedPlugins.set(finalPluginName, pluginCode);

      return true;
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        'プラグインファイルの読み込み中にエラーが発生しました',
        { pluginPath, pluginName }
      );
      return false;
    }
  }

  /**
   * 登録されたプラグイン一覧の取得
   */
  getRegisteredPlugins(): IPlugin[] {
    return [...this.plugins];
  }

  /**
   * サンドボックス化されたプラグイン一覧の取得
   */
  getSandboxedPluginNames(): string[] {
    return Array.from(this.sandboxedPlugins.keys());
  }

  /**
   * すべてのプラグインを安全に実行
   */
  async runAll(filePath: string): Promise<Issue[]> {
    const results: Issue[] = [];
    
    // ファイルパス検証
    const resolvedFilePath = PathSecurity.safeResolve(filePath, this.projectRoot, 'plugin-analysis');
    if (!resolvedFilePath) {
      errorHandler.handleError(
        new Error(`不正な分析対象ファイルパス: ${filePath}`),
        ErrorType.PERMISSION_DENIED,
        'ファイル分析が拒否されました',
        { filePath }
      );
      return results;
    }

    // レガシープラグインの実行（サンドボックス無効時のみ）
    if (!this.sandboxEnabled) {
      for (const plugin of this.plugins) {
        try {
          const issues = await plugin.analyze(resolvedFilePath);
          if (Array.isArray(issues)) {
            results.push(...issues);
          }
        } catch (error) {
          errorHandler.handlePluginError(error, plugin.name, 'legacy-analyze');
        }
      }
    }

    // サンドボックス化プラグインの実行
    for (const [pluginName, pluginCode] of this.sandboxedPlugins) {
      try {
        const executionResult = await this.sandbox.executePlugin(
          pluginCode,
          pluginName,
          resolvedFilePath
        );

        if (executionResult.success) {
          results.push(...executionResult.issues);
        } else {
          errorHandler.handleError(
            new Error(executionResult.error || 'プラグイン実行失敗'),
            ErrorType.PLUGIN_ERROR,
            `サンドボックス化プラグイン ${pluginName} の実行に失敗しました`,
            { 
              pluginName,
              executionTime: executionResult.executionTime,
              memoryUsed: executionResult.memoryUsed,
              error: executionResult.error
            }
          );
        }
      } catch (error) {
        errorHandler.handlePluginError(error, pluginName, 'sandboxed-analyze');
      }
    }

    return results;
  }

  /**
   * 特定のプラグインのみを実行
   */
  async runPlugin(pluginName: string, filePath: string): Promise<Issue[]> {
    // ファイルパス検証
    const resolvedFilePath = PathSecurity.safeResolve(filePath, this.projectRoot, 'single-plugin-analysis');
    if (!resolvedFilePath) {
      errorHandler.handleError(
        new Error(`不正な分析対象ファイルパス: ${filePath}`),
        ErrorType.PERMISSION_DENIED,
        'ファイル分析が拒否されました',
        { filePath, pluginName }
      );
      return [];
    }

    // サンドボックス化プラグインの実行
    if (this.sandboxedPlugins.has(pluginName)) {
      const pluginCode = this.sandboxedPlugins.get(pluginName)!;
      try {
        const executionResult = await this.sandbox.executePlugin(
          pluginCode,
          pluginName,
          resolvedFilePath
        );

        if (executionResult.success) {
          return executionResult.issues;
        } else {
          errorHandler.handleError(
            new Error(executionResult.error || 'プラグイン実行失敗'),
            ErrorType.PLUGIN_ERROR,
            `プラグイン ${pluginName} の実行に失敗しました`,
            { 
              pluginName,
              executionTime: executionResult.executionTime,
              memoryUsed: executionResult.memoryUsed,
              error: executionResult.error
            }
          );
          return [];
        }
      } catch (error) {
        errorHandler.handlePluginError(error, pluginName, 'single-plugin-analyze');
        return [];
      }
    }

    // レガシープラグインの実行
    const legacyPlugin = this.plugins.find(p => p.name === pluginName);
    if (legacyPlugin && !this.sandboxEnabled) {
      try {
        const issues = await legacyPlugin.analyze(resolvedFilePath);
        return Array.isArray(issues) ? issues : [];
      } catch (error) {
        errorHandler.handlePluginError(error, pluginName, 'legacy-single-analyze');
        return [];
      }
    }

    // プラグインが見つからない場合
    errorHandler.handleError(
      new Error(`プラグイン ${pluginName} が見つかりません`),
      ErrorType.PLUGIN_ERROR,
      'プラグインの実行に失敗しました',
      { pluginName, availablePlugins: this.getSandboxedPluginNames() }
    );
    return [];
  }

  /**
   * サンドボックス機能の有効/無効切り替え
   */
  setSandboxEnabled(enabled: boolean): void {
    this.sandboxEnabled = enabled;
    
    // テスト環境では警告・ログを抑制
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
      return;
    }
    
    if (enabled) {
      console.log('🛡️  プラグインサンドボックス機能を有効化しました');
    } else {
      console.warn('⚠️  プラグインサンドボックス機能を無効化しました（セキュリティリスクあり）');
    }
  }

  /**
   * サンドボックス制限の更新
   */
  updateSandboxLimits(newLimits: Partial<SandboxLimits>): void {
    this.sandbox.updateLimits(newLimits);
  }

  /**
   * プラグイン実行統計の取得
   */
  getExecutionStats(): {
    totalPlugins: number;
    sandboxedPlugins: number;
    legacyPlugins: number;
    sandboxEnabled: boolean;
  } {
    return {
      totalPlugins: this.plugins.length + this.sandboxedPlugins.size,
      sandboxedPlugins: this.sandboxedPlugins.size,
      legacyPlugins: this.plugins.length,
      sandboxEnabled: this.sandboxEnabled
    };
  }

  /**
   * プラグインの登録解除
   */
  unregister(pluginName: string): boolean {
    // サンドボックス化プラグインの削除
    if (this.sandboxedPlugins.has(pluginName)) {
      this.sandboxedPlugins.delete(pluginName);
      return true;
    }

    // レガシープラグインの削除
    const pluginIndex = this.plugins.findIndex(p => p.name === pluginName);
    if (pluginIndex !== -1) {
      this.plugins.splice(pluginIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * 全プラグインの登録解除
   */
  clear(): void {
    this.plugins = [];
    this.sandboxedPlugins.clear();
  }
}