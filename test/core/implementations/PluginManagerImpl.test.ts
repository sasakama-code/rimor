import 'reflect-metadata';
import { PluginManagerImpl } from '../../../src/core/implementations/PluginManagerImpl';
import { IPlugin, PluginMetadata, PluginExecutionResult } from '../../../src/core/interfaces/IPluginManager';
import { Issue } from '../../../src/core/types';

// モックプラグインクラス
class MockPlugin implements IPlugin {
  constructor(
    public metadata: PluginMetadata,
    private mockAnalyze?: (filePath: string) => Promise<Issue[]>
  ) {}
  
  async analyze(filePath: string): Promise<Issue[]> {
    if (this.mockAnalyze) {
      return this.mockAnalyze(filePath);
    }
    return [];
  }
}

describe('PluginManagerImpl', () => {
  let pluginManager: PluginManagerImpl;
  
  beforeEach(() => {
    pluginManager = new PluginManagerImpl();
  });
  
  describe('register', () => {
    it('should register a plugin successfully', () => {
      const plugin = new MockPlugin({
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        enabled: true
      });
      
      pluginManager.register(plugin);
      
      expect(pluginManager.getPlugin('test-plugin')).toBe(plugin);
    });
    
    it('should throw error when plugin has no metadata', () => {
      const invalidPlugin = {
        analyze: jest.fn()
      } as any;
      
      expect(() => pluginManager.register(invalidPlugin))
        .toThrow('プラグインには有効なメタデータが必要です');
    });
    
    it('should throw error when plugin metadata has no id', () => {
      const invalidPlugin = new MockPlugin({
        id: '',
        name: 'Invalid Plugin',
        version: '1.0.0',
        enabled: true
      });
      
      expect(() => pluginManager.register(invalidPlugin))
        .toThrow('プラグインには有効なメタデータが必要です');
    });
    
    it('should override existing plugin with same id', () => {
      const plugin1 = new MockPlugin({
        id: 'duplicate-id',
        name: 'Plugin 1',
        version: '1.0.0',
        enabled: true
      });
      
      const plugin2 = new MockPlugin({
        id: 'duplicate-id',
        name: 'Plugin 2',
        version: '2.0.0',
        enabled: true
      });
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      const registeredPlugin = pluginManager.getPlugin('duplicate-id');
      expect(registeredPlugin).toBe(plugin2);
      expect(registeredPlugin?.metadata.name).toBe('Plugin 2');
    });
  });
  
  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin = new MockPlugin({
        id: 'to-remove',
        name: 'Plugin to Remove',
        version: '1.0.0',
        enabled: true
      });
      
      pluginManager.register(plugin);
      expect(pluginManager.getPlugin('to-remove')).toBe(plugin);
      
      pluginManager.unregister('to-remove');
      expect(pluginManager.getPlugin('to-remove')).toBeUndefined();
    });
    
    it('should handle unregistering non-existent plugin gracefully', () => {
      // Should not throw
      expect(() => pluginManager.unregister('non-existent')).not.toThrow();
    });
  });
  
  describe('getPlugins', () => {
    it('should return empty array when no plugins registered', () => {
      expect(pluginManager.getPlugins()).toEqual([]);
    });
    
    it('should return all registered plugins', () => {
      const plugin1 = new MockPlugin({
        id: 'plugin-1',
        name: 'Plugin 1',
        version: '1.0.0',
        enabled: true
      });
      
      const plugin2 = new MockPlugin({
        id: 'plugin-2',
        name: 'Plugin 2',
        version: '1.0.0',
        enabled: false
      });
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      const plugins = pluginManager.getPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(plugin1);
      expect(plugins).toContain(plugin2);
    });
  });
  
  describe('getPlugin', () => {
    it('should return plugin by id', () => {
      const plugin = new MockPlugin({
        id: 'specific-plugin',
        name: 'Specific Plugin',
        version: '1.0.0',
        enabled: true
      });
      
      pluginManager.register(plugin);
      
      expect(pluginManager.getPlugin('specific-plugin')).toBe(plugin);
    });
    
    it('should return undefined for non-existent plugin', () => {
      expect(pluginManager.getPlugin('non-existent')).toBeUndefined();
    });
  });
  
  describe('run', () => {
    it('should run a specific plugin successfully', async () => {
      const mockIssues: Issue[] = [{
        type: 'test-issue',
        severity: 'high',
        message: 'Test issue found'
      }];
      
      const plugin = new MockPlugin({
        id: 'test-runner',
        name: 'Test Runner',
        version: '1.0.0',
        enabled: true
      }, async () => mockIssues);
      
      pluginManager.register(plugin);
      
      const result = await pluginManager.run('test-runner', '/test/file.ts');
      
      expect(result.pluginId).toBe('test-runner');
      expect(result.issues).toEqual(mockIssues);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });
    
    it('should return error when plugin not found', async () => {
      const result = await pluginManager.run('non-existent', '/test/file.ts');
      
      expect(result.pluginId).toBe('non-existent');
      expect(result.issues).toEqual([]);
      expect(result.executionTime).toBe(0);
      expect(result.error).toBe('プラグイン non-existent が見つかりません');
    });
    
    it('should return error when plugin is disabled', async () => {
      const plugin = new MockPlugin({
        id: 'disabled-plugin',
        name: 'Disabled Plugin',
        version: '1.0.0',
        enabled: false
      });
      
      pluginManager.register(plugin);
      
      const result = await pluginManager.run('disabled-plugin', '/test/file.ts');
      
      expect(result.pluginId).toBe('disabled-plugin');
      expect(result.issues).toEqual([]);
      expect(result.executionTime).toBe(0);
      expect(result.error).toBe('プラグイン disabled-plugin は無効化されています');
    });
    
    it('should handle plugin execution errors', async () => {
      const plugin = new MockPlugin({
        id: 'error-plugin',
        name: 'Error Plugin',
        version: '1.0.0',
        enabled: true
      }, async () => {
        throw new Error('Plugin execution failed');
      });
      
      pluginManager.register(plugin);
      
      const result = await pluginManager.run('error-plugin', '/test/file.ts');
      
      expect(result.pluginId).toBe('error-plugin');
      expect(result.issues).toEqual([]);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBe('Plugin execution failed');
    });
    
    it('should measure execution time', async () => {
      const plugin = new MockPlugin({
        id: 'slow-plugin',
        name: 'Slow Plugin',
        version: '1.0.0',
        enabled: true
      }, async () => {
        // Simulate slow execution
        await new Promise(resolve => setTimeout(resolve, 50));
        return [];
      });
      
      pluginManager.register(plugin);
      
      const result = await pluginManager.run('slow-plugin', '/test/file.ts');
      
      expect(result.executionTime).toBeGreaterThanOrEqual(50);
    });
  });
  
  describe('runAll', () => {
    it('should run all enabled plugins', async () => {
      const plugin1 = new MockPlugin({
        id: 'plugin-1',
        name: 'Plugin 1',
        version: '1.0.0',
        enabled: true
      }, async () => [{
        type: 'issue-1',
        severity: 'high',
        message: 'Issue from plugin 1'
      }]);
      
      const plugin2 = new MockPlugin({
        id: 'plugin-2',
        name: 'Plugin 2',
        version: '1.0.0',
        enabled: true
      }, async () => [{
        type: 'issue-2',
        severity: 'medium',
        message: 'Issue from plugin 2'
      }]);
      
      const plugin3 = new MockPlugin({
        id: 'plugin-3',
        name: 'Plugin 3',
        version: '1.0.0',
        enabled: false // disabled
      }, async () => [{
        type: 'issue-3',
        severity: 'info',
        message: 'Should not appear'
      }]);
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      pluginManager.register(plugin3);
      
      const results = await pluginManager.runAll('/test/file.ts');
      
      expect(results).toHaveLength(2); // Only enabled plugins
      expect(results[0].pluginId).toBe('plugin-1');
      expect(results[0].issues[0].type).toBe('issue-1');
      expect(results[1].pluginId).toBe('plugin-2');
      expect(results[1].issues[0].type).toBe('issue-2');
    });
    
    it('should return empty array when no plugins registered', async () => {
      const results = await pluginManager.runAll('/test/file.ts');
      expect(results).toEqual([]);
    });
    
    it('should handle plugin errors gracefully', async () => {
      const plugin1 = new MockPlugin({
        id: 'working-plugin',
        name: 'Working Plugin',
        version: '1.0.0',
        enabled: true
      }, async () => [{
        type: 'success',
        severity: 'info',
        message: 'Working'
      }]);
      
      const plugin2 = new MockPlugin({
        id: 'failing-plugin',
        name: 'Failing Plugin',
        version: '1.0.0',
        enabled: true
      }, async () => {
        throw new Error('Plugin failed');
      });
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      const results = await pluginManager.runAll('/test/file.ts');
      
      expect(results).toHaveLength(2);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBe('Plugin failed');
    });
  });
  
  describe('setEnabled', () => {
    it('should enable a disabled plugin', () => {
      const plugin = new MockPlugin({
        id: 'toggle-plugin',
        name: 'Toggle Plugin',
        version: '1.0.0',
        enabled: false
      });
      
      pluginManager.register(plugin);
      expect(plugin.metadata.enabled).toBe(false);
      
      pluginManager.setEnabled('toggle-plugin', true);
      expect(plugin.metadata.enabled).toBe(true);
    });
    
    it('should disable an enabled plugin', () => {
      const plugin = new MockPlugin({
        id: 'toggle-plugin',
        name: 'Toggle Plugin',
        version: '1.0.0',
        enabled: true
      });
      
      pluginManager.register(plugin);
      expect(plugin.metadata.enabled).toBe(true);
      
      pluginManager.setEnabled('toggle-plugin', false);
      expect(plugin.metadata.enabled).toBe(false);
    });
    
    it('should handle non-existent plugin gracefully', () => {
      // Should not throw
      expect(() => pluginManager.setEnabled('non-existent', true)).not.toThrow();
    });
  });
  
  describe('integration scenarios', () => {
    it('should handle plugin lifecycle correctly', async () => {
      // Register plugin
      const plugin = new MockPlugin({
        id: 'lifecycle-plugin',
        name: 'Lifecycle Plugin',
        version: '1.0.0',
        enabled: true
      }, async () => [{
        type: 'lifecycle-issue',
        severity: 'info',
        message: 'Lifecycle test'
      }]);
      
      pluginManager.register(plugin);
      
      // Run and verify
      let result = await pluginManager.run('lifecycle-plugin', '/test1.ts');
      expect(result.issues).toHaveLength(1);
      
      // Disable and run
      pluginManager.setEnabled('lifecycle-plugin', false);
      result = await pluginManager.run('lifecycle-plugin', '/test2.ts');
      expect(result.error).toContain('無効化されています');
      
      // Re-enable and run
      pluginManager.setEnabled('lifecycle-plugin', true);
      result = await pluginManager.run('lifecycle-plugin', '/test3.ts');
      expect(result.issues).toHaveLength(1);
      
      // Unregister and run
      pluginManager.unregister('lifecycle-plugin');
      result = await pluginManager.run('lifecycle-plugin', '/test4.ts');
      expect(result.error).toContain('見つかりません');
    });
  });
});