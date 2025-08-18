import { 
  MetadataDrivenConfigManager, 
  ConfigGenerationOptions,
  PluginRecommendation 
} from '../../src/core/metadataDrivenConfig';
import { 
  PluginMetadataRegistry, 
  PluginMetadata,
  pluginMetadataRegistry 
} from '../../src/core/pluginMetadata';
import { RimorConfig } from '../../src/core/config';

describe('MetadataDrivenConfigManager', () => {
  let configManager: MetadataDrivenConfigManager;
  
  beforeEach(() => {
    configManager = MetadataDrivenConfigManager.getInstance();
    
    // テスト用メタデータを登録
    const testMetadata: PluginMetadata = {
      name: 'test-plugin',
      displayName: 'Test Plugin',
      description: 'A test plugin for unit testing',
      version: '1.0.0',
      category: 'core',
      tags: ['testing', 'unit-test'],
      parameters: [
        {
          name: 'threshold',
          type: 'number',
          required: false,
          defaultValue: 80,
          description: 'Test threshold percentage'
        }
      ],
      dependencies: [],
      performance: {
        estimatedTimePerFile: 15,
        memoryUsage: 'medium',
        recommendedBatchSize: 25
      },
      targetFiles: {
        patterns: ['**/*.test.ts'],
        excludePatterns: ['**/node_modules/**']
      },
      // issueTypesは現在のPluginMetadata型には存在しない
      // 必要に応じて拡張可能
    };
    
    pluginMetadataRegistry.register(testMetadata);
  });
  
  describe('設定生成', () => {
    test('should generate minimal config', () => {
      const config = configManager.generateConfig({ preset: 'minimal' });
      
      expect(config.plugins).toBeDefined();
      expect(config.output).toBeDefined();
      expect(config.metadata).toBeDefined();
      expect(config.metadata?.preset).toBe('minimal');
      
      // minimalプリセットは軽量プラグインのみを含む
      const pluginNames = Object.keys(config.plugins);
      const lightweightPlugins = pluginNames.filter(name => {
        const metadata = pluginMetadataRegistry.get(name);
        return metadata?.performance?.memoryUsage === 'low';
      });
      
      expect(lightweightPlugins.length).toBeGreaterThan(0);
    });
    
    test('should generate recommended config', () => {
      const config = configManager.generateConfig({ preset: 'recommended' });
      
      expect(config.plugins).toBeDefined();
      expect(Object.keys(config.plugins).length).toBeGreaterThan(0);
      expect(config.metadata?.preset).toBe('recommended');
    });
    
    test('should generate comprehensive config', () => {
      const config = configManager.generateConfig({ preset: 'comprehensive' });
      
      expect(config.plugins).toBeDefined();
      expect(Object.keys(config.plugins).length).toBeGreaterThan(0);
      expect(config.metadata?.preset).toBe('comprehensive');
      
      // 包括的プリセットはより多くのプラグインを含む
      const recommendedConfig = configManager.generateConfig({ preset: 'recommended' });
      expect(Object.keys(config.plugins).length).toBeGreaterThanOrEqual(
        Object.keys(recommendedConfig.plugins).length
      );
    });
    
    test('should generate performance-focused config', () => {
      const config = configManager.generateConfig({ preset: 'performance' });
      
      expect(config.plugins).toBeDefined();
      expect(config.metadata?.preset).toBe('performance');
      
      // パフォーマンス重視プリセットは高速プラグインのみ
      const pluginNames = Object.keys(config.plugins);
      pluginNames.forEach(name => {
        const metadata = pluginMetadataRegistry.get(name);
        expect(metadata?.performance?.estimatedTimePerFile).toBeLessThanOrEqual(15);
      });
    });
    
    test('should adjust config for CI environment', () => {
      const config = configManager.generateConfig({
        preset: 'recommended',
        targetEnvironment: 'ci'
      });
      
      expect(config.output.format).toBe('json');
      expect(config.metadata?.targetEnvironment).toBe('ci');
    });
    
    test('should adjust config for development environment', () => {
      const config = configManager.generateConfig({
        preset: 'recommended',
        targetEnvironment: 'development'
      });
      
      expect(config.output.format).toBe('text');
      expect(config.output.verbose).toBe(true);
      expect(config.metadata?.targetEnvironment).toBe('development');
    });
  });
  
  describe('推奨機能', () => {
    test('should generate plugin recommendations', () => {
      const baseConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const recommendations = configManager.generateRecommendations(baseConfig);
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
      
      if (recommendations.length > 0) {
        const rec = recommendations[0];
        expect(rec).toMatchObject({
          pluginName: expect.any(String),
          reason: expect.any(String),
          priority: expect.stringMatching(/^(high|medium|low)$/),
          estimatedImpact: expect.any(String)
        });
      }
    });
    
    test('should recommend based on dependencies', () => {
      // 依存関係を持つプラグインのメタデータを追加
      const dependentPlugin: PluginMetadata = {
        name: 'dependent-plugin',
        displayName: 'Dependent Plugin',
        description: 'Plugin with dependencies',
        version: '1.0.0',
        category: 'core',
        tags: ['dependent'],
        parameters: [],
        dependencies: [
          {
            pluginName: 'test-existence',
            optional: false,
            reason: 'Requires test existence checking'
          }
        ],
        performance: {
          estimatedTimePerFile: 20,
          memoryUsage: 'medium'
        },
        targetFiles: {
          patterns: ['**/*.ts'],
          excludePatterns: []
        }
      };
      
      pluginMetadataRegistry.register(dependentPlugin);
      
      const baseConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const recommendations = configManager.generateRecommendations(baseConfig);
      const dependentRecommendation = recommendations.find(rec => 
        rec.pluginName === 'dependent-plugin'
      );
      
      expect(dependentRecommendation).toBeDefined();
      expect(dependentRecommendation?.priority).toBe('high');
    });
  });
  
  describe('設定最適化', () => {
    test('should optimize config for execution time', () => {
      const baseConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true },
          'assertion-exists': { enabled: true },
          'test-plugin': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const optimized = configManager.optimizeConfig(baseConfig, {
        maxExecutionTime: 500 // 非常に短い時間制限
      });
      
      // 最適化後はプラグイン数が減っているはず
      expect(Object.keys(optimized.plugins).length).toBeLessThanOrEqual(
        Object.keys(baseConfig.plugins).length
      );
    });
    
    test('should optimize config for memory usage', () => {
      const baseConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true },
          'assertion-exists': { enabled: true },
          'test-plugin': { enabled: true } // medium memory usage
        },
        output: { format: 'text', verbose: false }
      };
      
      const optimized = configManager.optimizeConfig(baseConfig, {
        maxMemoryUsage: 'low'
      });
      
      // メモリ使用量の制限により、medium/highメモリプラグインは除外される
      Object.keys(optimized.plugins).forEach(pluginName => {
        const metadata = pluginMetadataRegistry.get(pluginName);
        expect(metadata?.performance?.memoryUsage).toBe('low');
      });
    });
    
    test('should respect plugin count constraints', () => {
      const baseConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true },
          'assertion-exists': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const optimized = configManager.optimizeConfig(baseConfig, {
        maxPluginCount: 1
      });
      
      expect(Object.keys(optimized.plugins).length).toBe(1);
    });
    
    test('should add plugins when minimum count is not met', () => {
      const baseConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const optimized = configManager.optimizeConfig(baseConfig, {
        minPluginCount: 3
      });
      
      expect(Object.keys(optimized.plugins).length).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('設定検証', () => {
    test('should validate valid config', () => {
      const validConfig: RimorConfig = {
        plugins: {
          'test-existence': { enabled: true },
          'assertion-exists': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const validation = configManager.validateConfig(validConfig);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    test('should detect unknown plugins', () => {
      const invalidConfig: RimorConfig = {
        plugins: {
          'unknown-plugin': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const validation = configManager.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('unknown-plugin')
      )).toBe(true);
    });
    
    test('should detect missing dependencies', () => {
      // 依存関係を持つプラグインを単独で設定
      const dependentPlugin: PluginMetadata = {
        name: 'dependent-only',
        displayName: 'Dependent Only',
        description: 'Plugin with missing dependency',
        version: '1.0.0',
        category: 'core',
        tags: [],
        parameters: [],
        dependencies: [
          {
            pluginName: 'missing-dependency',
            optional: false,
            reason: 'Required dependency'
          }
        ],
        performance: {
          estimatedTimePerFile: 10,
          memoryUsage: 'low'
        },
        targetFiles: {
          patterns: ['**/*.ts'],
          excludePatterns: []
        }
      };
      
      pluginMetadataRegistry.register(dependentPlugin);
      
      const invalidConfig: RimorConfig = {
        plugins: {
          'dependent-only': { enabled: true }
        },
        output: { format: 'text', verbose: false }
      };
      
      const validation = configManager.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('missing-dependency')
      )).toBe(true);
    });
    
    test('should warn about performance issues', () => {
      // 大量のプラグインを設定
      const heavyConfig: RimorConfig = {
        plugins: {},
        output: { format: 'text', verbose: false }
      };
      
      // 重いプラグインを大量追加
      for (let i = 0; i < 10; i++) {
        const heavyPlugin: PluginMetadata = {
          name: `heavy-plugin-${i}`,
          displayName: `Heavy Plugin ${i}`,
          description: 'Heavy processing plugin',
          version: '1.0.0',
          category: 'core',
          tags: [],
          parameters: [],
          dependencies: [],
          performance: {
            estimatedTimePerFile: 10000, // 非常に重い
            memoryUsage: 'high'
          },
          targetFiles: {
            patterns: ['**/*.ts'],
            excludePatterns: []
          }
        };
        
        pluginMetadataRegistry.register(heavyPlugin);
        heavyConfig.plugins[`heavy-plugin-${i}`] = { enabled: true };
      }
      
      const validation = configManager.validateConfig(heavyConfig);
      
      expect(validation.warnings.some(warning => 
        warning.includes('推定実行時間')
      )).toBe(true);
    });
  });
});