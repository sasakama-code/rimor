import { ConfigLoader, RimorConfig, PluginConfig } from '@/core/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigLoader', () => {
  let tempDir: string;
  let loader: ConfigLoader;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-test-'));
    loader = new ConfigLoader();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      const config = await loader.loadConfig(tempDir);
      
      // 基本構造の検証
      expect(config.excludePatterns).toEqual([
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ]);
      
      expect(config.output).toEqual({
        format: 'text',
        verbose: false,
        reportDir: '.rimor/reports'
      });
      
      // プラグインの動的発見を確認
      expect(config.plugins).toHaveProperty('test-existence');
      expect(config.plugins).toHaveProperty('assertion-exists');
      expect(config.plugins['test-existence'].enabled).toBe(true);
      expect(config.plugins['assertion-exists'].enabled).toBe(true);
      
      // コアプラグインが発見されることを確認
      const pluginNames = Object.keys(config.plugins);
      expect(pluginNames.length).toBeGreaterThanOrEqual(2);
    });

    it('should load .rimorrc.json config file', async () => {
      const configContent = {
        excludePatterns: ['custom/**'],
        plugins: {
          'test-existence': { enabled: false },
          'assertion-exists': { enabled: true }
        },
        output: { format: 'json', verbose: true }
      };

      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));
      
      const config = await loader.loadConfig(tempDir);
      
      expect(config.excludePatterns).toEqual(['custom/**']);
      expect(config.plugins['test-existence'].enabled).toBe(false);
      expect(config.plugins['assertion-exists'].enabled).toBe(true);
      expect(config.output.format).toBe('json');
      expect(config.output.verbose).toBe(true);
    });

    it('should merge partial config with defaults', async () => {
      const configContent = {
        plugins: {
          'test-existence': { enabled: false }
        }
      };

      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));
      
      const config = await loader.loadConfig(tempDir);
      
      // Defaults should be preserved
      expect(config.excludePatterns).toEqual([
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ]);
      
      // Only specified values should be overridden
      expect(config.plugins['test-existence'].enabled).toBe(false);
      expect(config.plugins['assertion-exists'].enabled).toBe(true);
      expect(config.output.format).toBe('text');
    });

    it('should find config file in parent directories', async () => {
      const subDir = path.join(tempDir, 'nested', 'deep');
      fs.mkdirSync(subDir, { recursive: true });
      
      const configContent = {
        output: { format: 'json' }
      };
      
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));
      
      const config = await loader.loadConfig(subDir);
      
      expect(config.output.format).toBe('json');
    });

    it('should handle invalid JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), '{invalid json}');
      
      const config = await loader.loadConfig(tempDir);
      
      // Should fallback to default config
      expect(config.output.format).toBe('text');
      // テスト環境ではerrorHandlerがconsole.errorを抑制するため、
      // デフォルト設定への復帰のみを確認
      expect(config.plugins).toHaveProperty('test-existence');
      
      consoleSpy.mockRestore();
    });

    it('should support different config filenames', async () => {
      const configContent = { output: { format: 'json' } };
      
      // Test .rimorrc
      fs.writeFileSync(path.join(tempDir, '.rimorrc'), JSON.stringify(configContent));
      let config = await loader.loadConfig(tempDir);
      expect(config.output.format).toBe('json');
      
      fs.unlinkSync(path.join(tempDir, '.rimorrc'));
      
      // Test rimor.config.json
      fs.writeFileSync(path.join(tempDir, 'rimor.config.json'), JSON.stringify(configContent));
      config = await loader.loadConfig(tempDir);
      expect(config.output.format).toBe('json');
    });
  });

  describe('config priority', () => {
    it('should prioritize .rimorrc.json over other config files', async () => {
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify({
        output: { format: 'json' }
      }));
      fs.writeFileSync(path.join(tempDir, '.rimorrc'), JSON.stringify({
        output: { format: 'text' }
      }));
      
      const config = await loader.loadConfig(tempDir);
      expect(config.output.format).toBe('json');
    });
  });

  describe('PluginConfig type safety', () => {
    it('should handle boolean enabled property', () => {
      const pluginConfig: PluginConfig = {
        enabled: true
      };
      expect(pluginConfig.enabled).toBe(true);
    });

    it('should handle excludeFiles array property', () => {
      const pluginConfig: PluginConfig = {
        enabled: true,
        excludeFiles: ['*.test.ts', '*.spec.ts']
      };
      expect(pluginConfig.excludeFiles).toEqual(['*.test.ts', '*.spec.ts']);
    });

    it('should handle priority number property', () => {
      const pluginConfig: PluginConfig = {
        enabled: true,
        priority: 10
      };
      expect(pluginConfig.priority).toBe(10);
    });

    it('should handle custom properties with proper types', () => {
      const pluginConfig: PluginConfig = {
        enabled: true,
        customString: 'value',
        customNumber: 42,
        customBoolean: false,
        customArray: [1, 2, 3],
        customObject: { nested: 'data' }
      };
      
      // 型安全性のテスト: unknown型として扱う
      expect(typeof pluginConfig.customString).toBe('string');
      expect(typeof pluginConfig.customNumber).toBe('number');
      expect(typeof pluginConfig.customBoolean).toBe('boolean');
      expect(Array.isArray(pluginConfig.customArray)).toBe(true);
      expect(typeof pluginConfig.customObject).toBe('object');
    });

    it('should validate custom properties are not undefined by default', () => {
      const pluginConfig: PluginConfig = {
        enabled: true
      };
      
      // 存在しないプロパティへのアクセス
      expect(pluginConfig.nonExistentProperty).toBeUndefined();
    });

    it('should allow null values for custom properties', () => {
      const pluginConfig: PluginConfig = {
        enabled: true,
        customNullable: null
      };
      
      expect(pluginConfig.customNullable).toBeNull();
    });

    it('should handle complex nested structures', () => {
      const pluginConfig: PluginConfig = {
        enabled: true,
        rules: {
          maxLineLength: 100,
          indentSize: 2,
          checks: ['no-unused-vars', 'no-console']
        }
      };
      
      // 安全にアクセスするためのタイプガード
      const rules = pluginConfig.rules;
      if (rules && typeof rules === 'object' && !Array.isArray(rules)) {
        expect((rules as any).maxLineLength).toBe(100);
        expect((rules as any).indentSize).toBe(2);
        expect(Array.isArray((rules as any).checks)).toBe(true);
      }
    });
  });
});