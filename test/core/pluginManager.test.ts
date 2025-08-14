import { PluginManager } from '../../src/core/pluginManager';
import { IPlugin, Issue } from '../../src/core/types';

class TestPlugin implements IPlugin {
  constructor(public name: string, private issues: Issue[]) {}
  
  async analyze(filePath: string): Promise<Issue[]> {
    return this.issues;
  }
}

describe('PluginManager', () => {
  it('should register and run single plugin', async () => {
    const manager = new PluginManager();
    const issues: Issue[] = [
      { type: 'test-missing', severity: 'high', message: 'No test file found', filePath: 'src/example.ts', category: 'test-coverage' }
    ];
    const plugin = new TestPlugin('test-plugin', issues);
    
    manager.register(plugin);
    const results = await manager.runAll('src/example.ts');
    
    expect(results).toEqual(issues);
  });
  
  it('should run multiple plugins and combine results', async () => {
    const manager = new PluginManager();
    const issues1: Issue[] = [
      { type: 'test-missing', severity: 'high', message: 'No test file found', filePath: 'src/example.ts', category: 'test-coverage' }
    ];
    const issues2: Issue[] = [
      { type: 'assertion-missing', severity: 'medium', message: 'No assertions in test', filePath: 'src/example.ts', category: 'assertion' }
    ];
    
    manager.register(new TestPlugin('plugin1', issues1));
    manager.register(new TestPlugin('plugin2', issues2));
    
    const results = await manager.runAll('src/example.ts');
    
    expect(results).toHaveLength(2);
    expect(results).toEqual([...issues1, ...issues2]);
  });
  
  it('should handle plugin errors gracefully', async () => {
    const manager = new PluginManager();
    const errorPlugin: IPlugin = {
      name: 'error-plugin',
      analyze: async () => {
        throw new Error('Plugin error');
      }
    };
    
    manager.register(errorPlugin);
    const results = await manager.runAll('src/example.ts');
    
    expect(results).toEqual([]);
  });
});