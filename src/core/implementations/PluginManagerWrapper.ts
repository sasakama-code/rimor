/**
 * Plugin Manager Wrapper
 * inversifyデコレータを使用せず、シンプルなDIコンテナ向けのラッパー
 * Phase 6: 既存コンポーネントとの共存
 */

import {
  IPluginManager,
  IPlugin,
  PluginExecutionResult
} from '../interfaces/IPluginManager';

/**
 * Plugin Manager Wrapper
 * 既存のPluginManagerImplをinversifyなしで動作させる
 */
export class PluginManagerWrapper implements IPluginManager {
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
    
    for (const plugin of this.plugins.values()) {
      if (!plugin.metadata.enabled) {
        continue;
      }
      
      const startTime = performance.now();
      try {
        const issues = await plugin.analyze(filePath);
        const executionTime = performance.now() - startTime;
        results.push({
          pluginId: plugin.metadata.id,
          issues: issues,
          executionTime: executionTime
        });
      } catch (error) {
        const executionTime = performance.now() - startTime;
        results.push({
          pluginId: plugin.metadata.id,
          issues: [],
          executionTime: executionTime,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }
  
  async run(pluginId: string, filePath: string): Promise<PluginExecutionResult> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return {
        pluginId: pluginId,
        issues: [],
        executionTime: 0,
        error: 'Plugin not found'
      };
    }
    
    const startTime = performance.now();
    try {
      const issues = await plugin.analyze(filePath);
      const executionTime = performance.now() - startTime;
      return {
        pluginId: plugin.metadata.id,
        issues: issues,
        executionTime: executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        pluginId: plugin.metadata.id,
        issues: [],
        executionTime: executionTime,
        error: error instanceof Error ? error.message : String(error)
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