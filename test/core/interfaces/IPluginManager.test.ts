/**
 * IPluginManager Interface Tests
 * v0.8.0 - プラグインマネージャーインターフェースのテスト
 */

import {
  PluginMetadata,
  PluginExecutionResult,
  IPlugin,
  IPluginManager
} from '../../../src/core/interfaces/IPluginManager';
import { Issue } from '../../../src/core/types';

describe('IPluginManager Interface', () => {
  describe('PluginMetadata Type', () => {
    it('should have correct required properties', () => {
      const metadata: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        enabled: true
      };

      expect(metadata.id).toBe('test-plugin');
      expect(metadata.name).toBe('Test Plugin');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.enabled).toBe(true);
    });

    it('should allow optional description', () => {
      const metadataWithDescription: PluginMetadata = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'A test plugin for validation',
        enabled: false
      };

      expect(metadataWithDescription.description).toBe('A test plugin for validation');
      expect(metadataWithDescription.enabled).toBe(false);
    });
  });

  describe('PluginExecutionResult Type', () => {
    it('should have correct structure', () => {
      const result: PluginExecutionResult = {
        pluginId: 'test-plugin',
        issues: [],
        executionTime: 100
      };

      expect(result.pluginId).toBe('test-plugin');
      expect(result.issues).toEqual([]);
      expect(result.executionTime).toBe(100);
    });

    it('should allow optional error property', () => {
      const resultWithError: PluginExecutionResult = {
        pluginId: 'failed-plugin',
        issues: [],
        executionTime: 50,
        error: 'Plugin execution failed'
      };

      expect(resultWithError.error).toBe('Plugin execution failed');
    });

    it('should handle issues array', () => {
      const resultWithIssues: PluginExecutionResult = {
        pluginId: 'test-plugin',
        issues: [
          {
            file: 'test.ts',
            line: 10,
            column: 5,
            message: 'Test issue',
            severity: 'medium'
          } as Issue
        ],
        executionTime: 200
      };

      expect(resultWithIssues.issues).toHaveLength(1);
      expect(resultWithIssues.issues[0].file).toBe('test.ts');
    });
  });

  describe('IPlugin Implementation', () => {
    class MockPlugin implements IPlugin {
      metadata: PluginMetadata = {
        id: 'mock-plugin',
        name: 'Mock Plugin',
        version: '1.0.0',
        enabled: true
      };

      async analyze(filePath: string): Promise<Issue[]> {
        return [];
      }
    }

    it('should implement required properties and methods', () => {
      const plugin = new MockPlugin();
      
      expect(plugin.metadata).toBeDefined();
      expect(plugin.metadata.id).toBe('mock-plugin');
      expect(plugin.analyze).toBeDefined();
      expect(typeof plugin.analyze).toBe('function');
    });

    it('should return correct types from analyze method', async () => {
      const plugin = new MockPlugin();
      const result = await plugin.analyze('test.ts');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe('IPluginManager Implementation', () => {
    class MockPluginManager implements IPluginManager {
      private plugins: Map<string, IPlugin> = new Map();

      register(plugin: IPlugin): void {
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
          if (plugin.metadata.enabled) {
            const startTime = Date.now();
            try {
              const issues = await plugin.analyze(filePath);
              results.push({
                pluginId: plugin.metadata.id,
                issues,
                executionTime: Date.now() - startTime
              });
            } catch (error) {
              results.push({
                pluginId: plugin.metadata.id,
                issues: [],
                executionTime: Date.now() - startTime,
                error: String(error)
              });
            }
          }
        }
        return results;
      }

      async run(pluginId: string, filePath: string): Promise<PluginExecutionResult> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
          throw new Error(`Plugin ${pluginId} not found`);
        }

        const startTime = Date.now();
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
            error: String(error)
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

    it('should implement all required methods', () => {
      const manager = new MockPluginManager();
      
      expect(manager.register).toBeDefined();
      expect(manager.unregister).toBeDefined();
      expect(manager.getPlugins).toBeDefined();
      expect(manager.getPlugin).toBeDefined();
      expect(manager.runAll).toBeDefined();
      expect(manager.run).toBeDefined();
      expect(manager.setEnabled).toBeDefined();
    });

    it('should manage plugins correctly', () => {
      const manager = new MockPluginManager();
      const plugin: IPlugin = {
        metadata: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          enabled: true
        },
        analyze: async () => []
      };

      // Register plugin
      manager.register(plugin);
      expect(manager.getPlugins()).toHaveLength(1);
      expect(manager.getPlugin('test')).toBe(plugin);

      // Set enabled state
      manager.setEnabled('test', false);
      expect(plugin.metadata.enabled).toBe(false);

      // Unregister plugin
      manager.unregister('test');
      expect(manager.getPlugins()).toHaveLength(0);
      expect(manager.getPlugin('test')).toBeUndefined();
    });

    it('should run plugins correctly', async () => {
      const manager = new MockPluginManager();
      const plugin: IPlugin = {
        metadata: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          enabled: true
        },
        analyze: async (filePath: string) => {
          return [{
            file: filePath,
            line: 1,
            column: 1,
            message: 'Test issue',
            severity: 'info'
          } as Issue];
        }
      };

      manager.register(plugin);

      // Run single plugin
      const singleResult = await manager.run('test', 'file.ts');
      expect(singleResult.pluginId).toBe('test');
      expect(singleResult.issues).toHaveLength(1);
      expect(singleResult.executionTime).toBeGreaterThanOrEqual(0);

      // Run all plugins
      const allResults = await manager.runAll('file.ts');
      expect(allResults).toHaveLength(1);
      expect(allResults[0].pluginId).toBe('test');
    });
  });

  describe('Type Guards', () => {
    function isPluginMetadata(value: unknown): value is PluginMetadata {
      return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        'version' in value &&
        'enabled' in value &&
        typeof (value as PluginMetadata).id === 'string' &&
        typeof (value as PluginMetadata).name === 'string' &&
        typeof (value as PluginMetadata).version === 'string' &&
        typeof (value as PluginMetadata).enabled === 'boolean'
      );
    }

    function isPluginExecutionResult(value: unknown): value is PluginExecutionResult {
      return (
        typeof value === 'object' &&
        value !== null &&
        'pluginId' in value &&
        'issues' in value &&
        'executionTime' in value &&
        typeof (value as PluginExecutionResult).pluginId === 'string' &&
        Array.isArray((value as PluginExecutionResult).issues) &&
        typeof (value as PluginExecutionResult).executionTime === 'number'
      );
    }

    it('should validate PluginMetadata correctly', () => {
      const valid: PluginMetadata = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        enabled: true
      };

      const invalid = {
        id: 'test',
        name: 'Test',
        // missing required fields
      };

      expect(isPluginMetadata(valid)).toBe(true);
      expect(isPluginMetadata(invalid)).toBe(false);
      expect(isPluginMetadata(null)).toBe(false);
    });

    it('should validate PluginExecutionResult correctly', () => {
      const valid: PluginExecutionResult = {
        pluginId: 'test',
        issues: [],
        executionTime: 100
      };

      const invalid = {
        pluginId: 'test',
        issues: 'not an array', // wrong type
        executionTime: 100
      };

      expect(isPluginExecutionResult(valid)).toBe(true);
      expect(isPluginExecutionResult(invalid)).toBe(false);
    });
  });
});