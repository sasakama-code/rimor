/**
 * Plugin Manager Implementation
 * v0.8.0 - 簡素化されたプラグインマネージャー実装
 */

import { injectable } from 'inversify';
import {
  IPluginManager,
  IPlugin,
  PluginExecutionResult
} from '../interfaces/IPluginManager';

@injectable()
export class PluginManager implements IPluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  
  register(plugin: IPlugin): void {
    if (!plugin.metadata || !plugin.metadata.id) {
      throw new Error('プラグインには有効なメタデータが必要です');
    }
    
    this.plugins.set(plugin.metadata.id, plugin);
  }
  
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }
  
  getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }
  
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  async runAll(filePath: string): Promise<PluginExecutionResult[]> {
    const results: PluginExecutionResult[] = [];
    
    const enabledPlugins = Array.from(this.plugins.values()).filter(p => p.metadata.enabled);
    
    if (enabledPlugins.length === 0) {
      console.log('⚠️  No enabled plugins found in PluginManager.runAll');
    } else if (results.length === 0) {
      console.log(`🔌 Running ${enabledPlugins.length} enabled plugins for file: ${filePath.substring(filePath.length - 50)}`);
    }
    
    for (const plugin of this.plugins.values()) {
      if (plugin.metadata.enabled) {
        const result = await this.run(plugin.metadata.id, filePath);
        results.push(result);
      }
    }
    
    return results;
  }
  
  async run(pluginId: string, filePath: string): Promise<PluginExecutionResult> {
    const startTime = Date.now();
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      return {
        pluginId,
        issues: [],
        executionTime: 0,
        error: `プラグイン ${pluginId} が見つかりません`
      };
    }
    
    if (!plugin.metadata.enabled) {
      return {
        pluginId,
        issues: [],
        executionTime: 0,
        error: `プラグイン ${pluginId} は無効化されています`
      };
    }
    
    try {
      const issues = await plugin.analyze(filePath);
      return {
        pluginId,
        issues,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        pluginId,
        issues: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '不明なエラー'
      };
    }
  }
  
  setEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.metadata.enabled = enabled;
    }
  }
}