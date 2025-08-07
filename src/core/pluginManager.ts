/**
 * PluginManager v0.9.0
 * UnifiedPluginManagerへのエイリアス（後方互換性維持）
 * 
 * @deprecated UnifiedPluginManagerを直接使用してください
 */

import { UnifiedPluginManager } from './UnifiedPluginManager';
import { IPlugin } from './types';

export class PluginManager extends UnifiedPluginManager {
  constructor(projectRoot: string = process.cwd()) {
    super(projectRoot);
    console.warn('PluginManager is deprecated. Use UnifiedPluginManager instead.');
  }

  /**
   * 後方互換性のためのメソッドオーバーライド
   * レガシープラグインのみを返す
   */
  getPlugins(): IPlugin[] {
    return this.getLegacyPlugins();
  }

  /**
   * 後方互換性のための register メソッド
   * レガシープラグインとして登録
   */
  register(plugin: IPlugin): void {
    this.registerLegacy(plugin);
  }
}