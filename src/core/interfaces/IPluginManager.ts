/**
 * Plugin Manager Interface
 * v0.8.0 - 簡素化されたプラグインマネージャーのインターフェース定義
 */

import { Issue } from '../types';

/**
 * プラグインメタデータ
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
}

/**
 * プラグイン実行結果
 */
export interface PluginExecutionResult {
  pluginId: string;
  issues: Issue[];
  executionTime: number;
  error?: string;
}

/**
 * 基本プラグインインターフェース
 */
export interface IPlugin {
  metadata: PluginMetadata;
  analyze(filePath: string): Promise<Issue[]>;
}

/**
 * プラグインマネージャーインターフェース
 * 簡素化版：サンドボックスやレガシーサポートを削除
 */
export interface IPluginManager {
  /**
   * プラグインを登録
   */
  register(plugin: IPlugin): void;
  
  /**
   * プラグインを登録解除
   */
  unregister(pluginId: string): void;
  
  /**
   * 登録されたプラグインを取得
   */
  getPlugins(): IPlugin[];
  
  /**
   * 特定のプラグインを取得
   */
  getPlugin(pluginId: string): IPlugin | undefined;
  
  /**
   * 全プラグインを実行
   */
  runAll(filePath: string): Promise<PluginExecutionResult[]>;
  
  /**
   * 特定のプラグインを実行
   */
  run(pluginId: string, filePath: string): Promise<PluginExecutionResult>;
  
  /**
   * プラグインの有効/無効を切り替え
   */
  setEnabled(pluginId: string, enabled: boolean): void;
}