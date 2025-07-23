import { IPlugin, Issue } from './types';

export class PluginManager {
  private plugins: IPlugin[] = [];
  
  register(plugin: IPlugin): void {
    this.plugins.push(plugin);
  }
  
  getRegisteredPlugins(): IPlugin[] {
    return [...this.plugins];
  }
  
  async runAll(filePath: string): Promise<Issue[]> {
    const results: Issue[] = [];
    
    for (const plugin of this.plugins) {
      try {
        const issues = await plugin.analyze(filePath);
        results.push(...issues);
      } catch (error) {
        // MVP: 最小限のエラーハンドリング - エラーは無視
        // 技術的負債: エラーログを追加する必要あり
      }
    }
    
    return results;
  }
}