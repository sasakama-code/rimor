/**
 * PluginManagerExtended v0.9.0
 * UnifiedPluginManagerへのエイリアス（後方互換性維持）
 * 
 * @deprecated UnifiedPluginManagerを直接使用してください
 */

import { 
  UnifiedPluginManager, 
  QualityAnalysisResult, 
  AnalysisOptions 
} from './UnifiedPluginManager';
import { 
  IPlugin, 
  ITestQualityPlugin, 
  ProjectContext, 
  TestFile 
} from './types';

// 後方互換性のための再エクスポート
export { QualityAnalysisResult, AnalysisOptions } from './UnifiedPluginManager';

export class PluginManagerExtended extends UnifiedPluginManager {
  constructor(projectRoot: string = process.cwd()) {
    super(projectRoot);
    console.warn('PluginManagerExtended is deprecated. Use UnifiedPluginManager instead.');
  }

  /**
   * 後方互換性のためのメソッドオーバーライド
   * 品質プラグインのみを返す
   */
  getPlugins(): ITestQualityPlugin[] {
    return this.getQualityPlugins();
  }

  /**
   * 後方互換性のための register メソッド
   * レガシープラグインとして登録
   */
  register(plugin: IPlugin): void {
    this.registerLegacy(plugin);
  }

  /**
   * 後方互換性のためのメソッド
   */
  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.registerQuality(plugin);
  }

  /**
   * 後方互換性のためのメソッド
   */
  registerLegacyPlugin(plugin: IPlugin): void {
    this.registerLegacy(plugin);
  }
}