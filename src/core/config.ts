import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { errorHandler } from '../utils/errorHandler';

export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
}

export interface PluginMetadata {
  name: string;
  displayName?: string;
  description?: string;
  defaultConfig: PluginConfig;
}

export interface RimorConfig {
  excludePatterns: string[];
  plugins: Record<string, PluginConfig>;
  output: {
    format: 'text' | 'json';
    verbose: boolean;
  };
}

export class ConfigLoader {
  private static readonly CONFIG_FILENAMES = [
    '.rimorrc.json',
    '.rimorrc',
    'rimor.config.json'
  ];
  
  private availablePlugins: PluginMetadata[] = [];

  async loadConfig(startDir: string): Promise<RimorConfig> {
    // 利用可能なプラグインを動的に発見
    await this.discoverAvailablePlugins();
    
    const configPath = await this.findConfigFile(startDir);
    
    if (configPath) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return this.mergeWithDefaults(userConfig);
      } catch (error) {
        errorHandler.handleConfigError(error, configPath);
        return this.getDefaultConfig();
      }
    }
    
    return this.getDefaultConfig();
  }

  private async findConfigFile(startDir: string): Promise<string | null> {
    let currentDir = path.resolve(startDir);
    const rootDir = path.parse(currentDir).root;

    while (currentDir !== rootDir) {
      for (const filename of ConfigLoader.CONFIG_FILENAMES) {
        const configPath = path.join(currentDir, filename);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  private getDefaultConfig(): RimorConfig {
    const plugins: Record<string, PluginConfig> = {};
    
    // 発見されたプラグインのデフォルト設定を動的に生成
    for (const plugin of this.availablePlugins) {
      plugins[plugin.name] = {
        ...plugin.defaultConfig,
        enabled: true // デフォルトで有効化
      };
    }
    
    return {
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ],
      plugins,
      output: {
        format: 'text',
        verbose: false
      }
    };
  }

  private mergeWithDefaults(userConfig: Partial<RimorConfig>): RimorConfig {
    const defaults = this.getDefaultConfig();
    
    // プラグイン設定のマージ
    const plugins: Record<string, PluginConfig> = {};
    
    // デフォルトプラグインを基準にマージ
    for (const [pluginName, defaultConfig] of Object.entries(defaults.plugins)) {
      plugins[pluginName] = {
        ...defaultConfig,
        ...userConfig.plugins?.[pluginName]
      };
    }
    
    // ユーザー設定にのみ存在するプラグインも追加
    if (userConfig.plugins) {
      for (const [pluginName, userPluginConfig] of Object.entries(userConfig.plugins)) {
        if (!plugins[pluginName]) {
          plugins[pluginName] = userPluginConfig;
        }
      }
    }
    
    return {
      excludePatterns: userConfig.excludePatterns || defaults.excludePatterns,
      plugins,
      output: {
        ...defaults.output,
        ...userConfig.output
      }
    };
  }
  
  /**
   * プラグインディレクトリを走査して利用可能なプラグインを自動発見
   */
  private async discoverAvailablePlugins(): Promise<void> {
    try {
      const pluginDir = path.join(__dirname, '../plugins');
      const pluginFiles = await glob('**/*.ts', { cwd: pluginDir });
      
      this.availablePlugins = [];
      
      // レガシープラグイン (既存の簡単なプラグイン)
      const legacyPlugins = [
        { file: 'testExistence.ts', name: 'test-existence', displayName: 'Test Existence', description: 'テストファイルの存在確認' },
        { file: 'assertionExists.ts', name: 'assertion-exists', displayName: 'Assertion Exists', description: 'アサーションの存在確認' }
      ];
      
      for (const legacy of legacyPlugins) {
        if (pluginFiles.includes(legacy.file)) {
          this.availablePlugins.push({
            name: legacy.name,
            displayName: legacy.displayName,
            description: legacy.description,
            defaultConfig: {
              enabled: true,
              excludeFiles: legacy.name === 'test-existence' ? 
                ['index.ts', 'index.js', 'types.ts', 'types.js', 'config.ts', 'config.js'] : undefined
            }
          });
        }
      }
      
      // コアプラグイン (高度な品質分析プラグイン)
      const corePlugins = [
        { file: 'core/AssertionQualityPlugin.ts', name: 'assertion-quality', displayName: 'Assertion Quality', description: 'アサーション品質分析' },
        { file: 'core/TestCompletenessPlugin.ts', name: 'test-completeness', displayName: 'Test Completeness', description: 'テスト網羅性分析' },
        { file: 'core/TestStructurePlugin.ts', name: 'test-structure', displayName: 'Test Structure', description: 'テスト構造分析' }
      ];
      
      for (const core of corePlugins) {
        if (pluginFiles.includes(core.file)) {
          this.availablePlugins.push({
            name: core.name,
            displayName: core.displayName,
            description: core.description,
            defaultConfig: {
              enabled: false // コアプラグインはデフォルト無効（パフォーマンス考慮）
            }
          });
        }
      }
      
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        'プラグイン自動検出に失敗しました。デフォルト設定を使用します。',
        undefined,
        true
      );
      // フォールバック: 最低限のレガシープラグイン
      this.availablePlugins = [
        {
          name: 'test-existence',
          displayName: 'Test Existence',
          description: 'テストファイルの存在確認',
          defaultConfig: { enabled: true, excludeFiles: ['index.ts', 'index.js', 'types.ts', 'types.js', 'config.ts', 'config.js'] }
        },
        {
          name: 'assertion-exists',
          displayName: 'Assertion Exists', 
          description: 'アサーションの存在確認',
          defaultConfig: { enabled: true }
        }
      ];
    }
  }
  
  /**
   * 利用可能なプラグイン一覧を取得
   */
  getAvailablePlugins(): PluginMetadata[] {
    return this.availablePlugins;
  }
}