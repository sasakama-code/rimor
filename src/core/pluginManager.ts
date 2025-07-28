import { IPlugin, Issue } from './types';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PluginManager v0.8.0
 * 簡素化されたプラグイン実行管理（サンドボックスなし）
 */
export class PluginManager {
  private plugins: IPlugin[] = [];
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
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

    // 重複チェック
    const exists = this.plugins.some(p => p.name === plugin.name);
    if (exists) {
      errorHandler.handleError(
        new Error(`プラグイン名が重複しています: ${plugin.name}`),
        ErrorType.PLUGIN_ERROR,
        'すでに同名のプラグインが登録されています',
        { pluginName: plugin.name }
      );
      return;
    }

    this.plugins.push(plugin);
  }

  /**
   * 登録されたプラグイン一覧の取得
   */
  getRegisteredPlugins(): IPlugin[] {
    return [...this.plugins];
  }

  /**
   * すべてのプラグインを実行
   */
  async runAll(filePath: string): Promise<Issue[]> {
    const results: Issue[] = [];
    
    // プラグインの実行
    for (const plugin of this.plugins) {
      try {
        const issues = await plugin.analyze(filePath);
        if (Array.isArray(issues)) {
          results.push(...issues);
        }
      } catch (error) {
        errorHandler.handlePluginError(error, plugin.name, 'analyze');
      }
    }

    return results;
  }

  /**
   * 特定のプラグインのみを実行
   */
  async runPlugin(pluginName: string, filePath: string): Promise<Issue[]> {
    const plugin = this.plugins.find(p => p.name === pluginName);
    
    if (!plugin) {
      errorHandler.handleError(
        new Error(`プラグインが見つかりません: ${pluginName}`),
        ErrorType.PLUGIN_ERROR,
        '指定されたプラグインは登録されていません',
        { pluginName }
      );
      return [];
    }

    try {
      const issues = await plugin.analyze(filePath);
      return Array.isArray(issues) ? issues : [];
    } catch (error) {
      errorHandler.handlePluginError(error, pluginName, 'analyze');
      return [];
    }
  }

  /**
   * プラグインの削除
   */
  unregister(pluginName: string): boolean {
    const index = this.plugins.findIndex(p => p.name === pluginName);
    if (index !== -1) {
      this.plugins.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 全プラグインの削除
   */
  clear(): void {
    this.plugins = [];
  }
}