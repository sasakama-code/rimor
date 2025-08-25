import { describe, it, expect } from '@jest/globals';
import { IPlugin } from '../../src/core/types';

// プラグインシステムの型安全性テスト
describe('Plugin System Type Safety', () => {
  describe('Plugin Map Type Safety', () => {
    // プラグインマップの型定義
    class PluginRegistry {
      private plugins: Map<string, IPlugin> = new Map();
      
      register(name: string, plugin: IPlugin): void {
        this.plugins.set(name, plugin);
      }
      
      get(name: string): IPlugin | undefined {
        return this.plugins.get(name);
      }
      
      // 型安全なプラグイン設定
      configure<T extends Record<string, unknown>>(
        name: string, 
        config: T
      ): void {
        const plugin = this.plugins.get(name);
        if (plugin) {
          // 設定を適用する際の型チェック
          Object.assign(plugin, { config });
        }
      }
    }
    
    it('should handle plugin registration with proper types', () => {
      const registry = new PluginRegistry();
      const testPlugin: IPlugin = {
        name: 'test-plugin',
        analyze: async (filePath: string) => {
          return [];
        }
      };
      
      registry.register('test', testPlugin);
      const retrieved = registry.get('test');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test-plugin');
    });
    
    it('should handle plugin configuration safely', () => {
      const registry = new PluginRegistry();
      const plugin: IPlugin = {
        name: 'configurable-plugin',
        analyze: async () => []
      };
      
      registry.register('config-test', plugin);
      registry.configure('config-test', {
        timeout: 5000,
        enabled: true,
        options: { verbose: false }
      });
      
      expect(registry.get('config-test')).toBeDefined();
    });
  });
  
  describe('Test Case Extraction Type Safety', () => {
    interface TestCase {
      name: string;
      type: 'test' | 'describe' | 'it';
      line?: number;
    }
    
    class TestExtractor {
      extractTestCases(content: string): TestCase[] {
        const testRegex = /(?:(it|test|describe))\s*\(['"]([^'"]+)['"]/g;
        const testCases: TestCase[] = [];
        let match;
        
        while ((match = testRegex.exec(content)) !== null) {
          testCases.push({
            type: match[1] as 'test' | 'describe' | 'it',
            name: match[2]
          });
        }
        
        return testCases;
      }
    }
    
    it('should extract test cases with proper types', () => {
      const extractor = new TestExtractor();
      const content = `
        describe('Test Suite', () => {
          it('should work', () => {});
          test('another test', () => {});
        });
      `;
      
      const testCases = extractor.extractTestCases(content);
      
      expect(testCases).toHaveLength(3);
      expect(testCases[0].type).toBe('describe');
      expect(testCases[1].type).toBe('it');
      expect(testCases[2].type).toBe('test');
    });
  });
  
  describe('Plugin Logging Type Safety', () => {
    // ログメタデータの型定義
    interface LogMetadata {
      timestamp?: number;
      plugin?: string;
      [key: string]: unknown;
    }
    
    enum LogLevel {
      DEBUG = 'debug',
      INFO = 'info',
      WARNING = 'warning',
      ERROR = 'error'
    }
    
    class TypedLogger {
      log(level: LogLevel, message: string, metadata?: LogMetadata): void {
        const logEntry = {
          level,
          message,
          timestamp: Date.now(),
          ...metadata
        };
        
        // 実際のログ出力（テストでは省略）
        if (process.env.NODE_ENV === 'test') {
          // テスト環境では出力を抑制
          return;
        }
        
        console.log(JSON.stringify(logEntry));
      }
      
      debug(message: string, metadata?: LogMetadata): void {
        this.log(LogLevel.DEBUG, message, metadata);
      }
      
      info(message: string, metadata?: LogMetadata): void {
        this.log(LogLevel.INFO, message, metadata);
      }
      
      warning(message: string, metadata?: LogMetadata): void {
        this.log(LogLevel.WARNING, message, metadata);
      }
      
      error(message: string, error?: Error, metadata?: LogMetadata): void {
        this.log(LogLevel.ERROR, message, {
          ...metadata,
          error: {
            message: error?.message,
            stack: error?.stack,
            name: error?.name
          }
        });
      }
    }
    
    it('should handle logging with type-safe metadata', () => {
      const logger = new TypedLogger();
      
      // 型安全なメタデータ
      logger.debug('Debug message', {
        plugin: 'test-plugin',
        timestamp: Date.now(),
        customField: 'value'
      });
      
      logger.info('Info message');
      
      logger.warning('Warning message', {
        plugin: 'warning-plugin'
      });
      
      const error = new Error('Test error');
      logger.error('Error occurred', error, {
        plugin: 'error-plugin'
      });
      
      // テストが例外を投げないことを確認
      expect(true).toBe(true);
    });
  });
  
  describe('Plugin Factory Type Safety', () => {
    interface PluginConfig {
      enabled?: boolean;
      priority?: number;
      options?: Record<string, unknown>;
    }
    
    class PluginFactory {
      createPlugin(
        pluginName: string, 
        config?: PluginConfig
      ): IPlugin | null {
        // 実際の実装では動的インポートを使用
        // ここではモックで代用
        const mockPlugin: IPlugin = {
          name: pluginName,
          analyze: async () => [],
          ...(config && { config })
        };
        
        return mockPlugin;
      }
      
      // 型ガード付きプラグイン作成
      createTypedPlugin<T extends IPlugin>(
        pluginClass: new (config?: PluginConfig) => T,
        config?: PluginConfig
      ): T {
        return new pluginClass(config);
      }
    }
    
    it('should create plugins with proper configuration types', () => {
      const factory = new PluginFactory();
      
      const plugin = factory.createPlugin('test-plugin', {
        enabled: true,
        priority: 10,
        options: {
          verbose: true,
          timeout: 5000
        }
      });
      
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('test-plugin');
    });
    
    it('should create typed plugins with constructor', () => {
      class CustomPlugin implements IPlugin {
        name = 'custom-plugin';
        config?: PluginConfig;
        
        constructor(config?: PluginConfig) {
          this.config = config;
        }
        
        async analyze(filePath: string) {
          return [];
        }
      }
      
      const factory = new PluginFactory();
      const plugin = factory.createTypedPlugin(CustomPlugin, {
        enabled: true,
        priority: 5
      });
      
      expect(plugin).toBeInstanceOf(CustomPlugin);
      expect(plugin.config?.enabled).toBe(true);
      expect(plugin.config?.priority).toBe(5);
    });
  });
});