/**
 * 設定管理のテスト
 * Issue #66: テストカバレッジの向上
 * TDD RED段階: 失敗するテストファースト
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadConfig,
  validateConfig,
  mergeConfigs,
  saveConfig,
  DEFAULT_CONFIG,
  PluginConfig,
  RimorConfig,
  registerPlugin,
  getAvailablePlugins,
  createDefaultConfig
} from '../../src/core/config';

// モックの設定
jest.mock('fs');
jest.mock('glob');
jest.mock('../../src/utils/errorHandler');
jest.mock('../../src/core/metadataDrivenConfig');
jest.mock('../../src/core/pluginMetadata');
jest.mock('../../src/security/ConfigSecurity');

describe('Configuration Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('デフォルト設定を読み込む', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act
      const config = loadConfig();

      // Assert
      expect(config).toBeDefined();
      expect(config.output.format).toBe('text');
      expect(config.output.verbose).toBe(false);
      expect(config.plugins).toBeDefined();
    });

    it('カスタム設定ファイルを読み込む', () => {
      // Arrange
      const customConfig: RimorConfig = {
        excludePatterns: ['node_modules/**'],
        plugins: {
          testExistence: { enabled: true }
        },
        output: {
          format: 'json',
          verbose: true
        }
      };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(customConfig));

      // Act
      const config = loadConfig('.rimor.json');

      // Assert
      expect(config.output.format).toBe('json');
      expect(config.output.verbose).toBe(true);
      expect(config.plugins.testExistence.enabled).toBe(true);
    });

    it('不正なJSONファイルの場合はデフォルト設定を返す', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      // Act
      const config = loadConfig('.rimor.json');

      // Assert
      expect(config).toBeDefined();
      expect(config.output.format).toBe('text');
      expect(config.plugins).toBeDefined();
    });
  });

  describe('validateConfig', () => {
    it('有効な設定を検証する', () => {
      // Arrange
      const validConfig: RimorConfig = {
        plugins: {
          testPlugin: { enabled: true }
        },
        output: {
          format: 'text',
          verbose: false
        }
      };

      // Act
      const result = validateConfig(validConfig);

      // Assert
      expect(result).toBe(true);
    });

    it('無効な出力フォーマットの場合はfalseを返す', () => {
      // Arrange
      const invalidConfig: any = {
        plugins: {},
        output: {
          format: 'invalid',
          verbose: false
        }
      };

      // Act
      const result = validateConfig(invalidConfig);

      // Assert
      expect(result).toBe(false);
    });

    it('pluginsプロパティがない場合はfalseを返す', () => {
      // Arrange
      const invalidConfig: any = {
        output: {
          format: 'text',
          verbose: false
        }
      };

      // Act
      const result = validateConfig(invalidConfig);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('mergeConfigs', () => {
    it('デフォルト設定とユーザー設定をマージする', () => {
      // Arrange
      const baseConfig: RimorConfig = {
        plugins: {
          plugin1: { enabled: true }
        },
        output: {
          format: 'text',
          verbose: false
        }
      };
      const userConfig: Partial<RimorConfig> = {
        output: {
          format: 'json',
          verbose: true
        }
      };

      // Act
      const merged = mergeConfigs(baseConfig, userConfig);

      // Assert
      expect(merged.output.format).toBe('json');
      expect(merged.output.verbose).toBe(true);
      expect(merged.plugins.plugin1.enabled).toBe(true);
    });

    it('深いマージを正しく処理する', () => {
      // Arrange
      const baseConfig: RimorConfig = {
        plugins: {
          plugin1: { enabled: true, priority: 1 }
        },
        output: {
          format: 'text',
          verbose: false,
          reportDir: '.rimor/reports'
        }
      };
      const userConfig: Partial<RimorConfig> = {
        plugins: {
          plugin1: { enabled: false },
          plugin2: { enabled: true }
        },
        output: {
          format: 'text',
          verbose: true
        }
      };

      // Act
      const merged = mergeConfigs(baseConfig, userConfig);

      // Assert
      expect(merged.plugins.plugin1.enabled).toBe(false);
      expect(merged.plugins.plugin1.priority).toBe(1);
      expect(merged.plugins.plugin2.enabled).toBe(true);
      expect(merged.output.format).toBe('text');
      expect(merged.output.verbose).toBe(true);
      expect(merged.output.reportDir).toBe('.rimor/reports');
    });
  });

  describe('saveConfig', () => {
    it('設定をファイルに保存する', () => {
      // Arrange
      const config: RimorConfig = {
        plugins: {
          testPlugin: { enabled: true }
        },
        output: {
          format: 'json',
          verbose: true
        }
      };
      const filePath = '.rimor.json';

      // Act
      saveConfig(config, filePath);

      // Assert
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(config, null, 2)
      );
    });

    it('保存時のエラーを適切に処理する', () => {
      // Arrange
      const config: RimorConfig = DEFAULT_CONFIG;
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write error');
      });

      // Act & Assert
      expect(() => saveConfig(config, 'test.json')).toThrow('Write error');
    });
  });

  describe('プラグイン管理', () => {
    it('新しいプラグインを登録する', () => {
      // Arrange
      const pluginMetadata = {
        name: 'newPlugin',
        displayName: 'New Plugin',
        description: 'A new plugin',
        defaultConfig: { enabled: false }
      };

      // Act
      registerPlugin(pluginMetadata);
      const plugins = getAvailablePlugins();

      // Assert
      expect(plugins).toContain('newPlugin');
    });

    it('利用可能なプラグインのリストを取得する', () => {
      // Act
      const plugins = getAvailablePlugins();

      // Assert
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });
  });

  describe('createDefaultConfig', () => {
    it('プリセットに基づいてデフォルト設定を作成する', () => {
      // Act
      const config = createDefaultConfig('minimal');

      // Assert
      expect(config).toBeDefined();
      expect(config.plugins).toBeDefined();
      expect(config.output).toBeDefined();
    });

    it('すべてのプラグインを有効にした設定を作成する', () => {
      // Act
      const config = createDefaultConfig('all');

      // Assert
      expect(config).toBeDefined();
      Object.values(config.plugins).forEach(plugin => {
        expect(plugin.enabled).toBeDefined();
      });
    });
  });

  describe('セキュリティチェック', () => {
    it('設定のセキュリティ検証を実行する', () => {
      // Arrange
      const config: RimorConfig = DEFAULT_CONFIG;

      // Act
      const isSecure = validateConfig(config, { checkSecurity: true });

      // Assert
      expect(isSecure).toBeDefined();
    });

    it('不正なパスを含む設定を拒否する', () => {
      // Arrange
      const maliciousConfig: any = {
        plugins: {},
        output: {
          format: 'text',
          verbose: false,
          reportDir: '../../../etc/passwd'
        }
      };

      // Act
      const result = validateConfig(maliciousConfig, { checkSecurity: true });

      // Assert
      expect(result).toBe(false);
    });
  });
});