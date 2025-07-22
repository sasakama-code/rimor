import * as fs from 'fs';
import * as path from 'path';

export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
}

export interface RimorConfig {
  excludePatterns: string[];
  plugins: {
    'test-existence': PluginConfig;
    'assertion-exists': PluginConfig;
  };
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

  async loadConfig(startDir: string): Promise<RimorConfig> {
    const configPath = await this.findConfigFile(startDir);
    
    if (configPath) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return this.mergeWithDefaults(userConfig);
      } catch (error) {
        console.warn(`設定ファイルの読み込みに失敗しました: ${configPath}`);
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
    return {
      excludePatterns: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ],
      plugins: {
        'test-existence': {
          enabled: true,
          excludeFiles: ['index.ts', 'index.js', 'types.ts', 'types.js', 'config.ts', 'config.js']
        },
        'assertion-exists': {
          enabled: true
        }
      },
      output: {
        format: 'text',
        verbose: false
      }
    };
  }

  private mergeWithDefaults(userConfig: Partial<RimorConfig>): RimorConfig {
    const defaults = this.getDefaultConfig();
    
    return {
      excludePatterns: userConfig.excludePatterns || defaults.excludePatterns,
      plugins: {
        'test-existence': {
          ...defaults.plugins['test-existence'],
          ...userConfig.plugins?.['test-existence']
        },
        'assertion-exists': {
          ...defaults.plugins['assertion-exists'],
          ...userConfig.plugins?.['assertion-exists']
        }
      },
      output: {
        ...defaults.output,
        ...userConfig.output
      }
    };
  }
}