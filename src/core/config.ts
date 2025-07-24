import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { errorHandler } from '../utils/errorHandler';
import { getMessage } from '../i18n/messages';
import { metadataDrivenConfigManager, ConfigGenerationOptions } from './metadataDrivenConfig';
import { pluginMetadataRegistry } from './pluginMetadata';

export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
  priority?: number;  // プラグイン実行優先度（高いほど先に実行）
  [key: string]: any; // 動的プロパティサポート
}

export interface PluginMetadata {
  name: string;
  displayName?: string;
  description?: string;
  defaultConfig: PluginConfig;
}

export interface RimorConfig {
  excludePatterns?: string[];
  plugins: Record<string, PluginConfig>;
  output: {
    format: 'text' | 'json';
    verbose: boolean;
  };
  metadata?: {
    generatedAt?: string;
    preset?: string;
    targetEnvironment?: string;
    pluginCount?: number;
    estimatedExecutionTime?: number;
  };
  scoring?: {
    enabled?: boolean;
    weights?: {
      plugins?: Record<string, number>;
      dimensions?: {
        completeness?: number;
        correctness?: number;
        maintainability?: number;
        performance?: number;
        security?: number;
      };
      fileTypes?: Record<string, number>;
    };
    gradeThresholds?: {
      A?: number;
      B?: number;
      C?: number;
      D?: number;
      F?: number;
    };
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
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
        // セキュリティ: 設定ファイルのパス検証
        const { PathSecurity } = await import('../utils/pathSecurity');
        const projectRoot = process.cwd();
        
        if (!PathSecurity.validateProjectPath(configPath, projectRoot)) {
          errorHandler.handleError(
            new Error('設定ファイルがプロジェクト範囲外です'),
            undefined,
            'セキュリティ違反: 設定ファイルアクセス拒否',
            { configPath }
          );
          return this.getDefaultConfig();
        }

        // セキュリティ: ファイルサイズ制限
        const fileStats = fs.statSync(configPath);
        if (fileStats.size > 1024 * 1024) { // 1MB制限
          errorHandler.handleError(
            new Error('設定ファイルサイズが制限を超えています'),
            undefined,
            '設定ファイルが大きすぎます',
            { configPath, size: fileStats.size }
          );
          return this.getDefaultConfig();
        }

        const configData = fs.readFileSync(configPath, 'utf-8');
        
        // セキュリティ: 安全なJSON解析
        const userConfig = this.safeParseConfig(configData);
        if (!userConfig) {
          errorHandler.handleError(
            new Error('設定ファイルの形式が無効です'),
            undefined,
            '設定ファイル解析失敗',
            { configPath }
          );
          return this.getDefaultConfig();
        }

        // セキュリティ: 設定内容の検証
        const validatedConfig = this.validateConfig(userConfig);
        return this.mergeWithDefaults(validatedConfig);
      } catch (error) {
        errorHandler.handleConfigError(error, configPath);
        return this.getDefaultConfig();
      }
    }
    
    return this.getDefaultConfig();
  }
  
  /**
   * メタデータ駆動設定の生成と読み込み
   */
  async loadOrGenerateConfig(
    startDir: string = process.cwd(),
    options: ConfigGenerationOptions = {}
  ): Promise<RimorConfig> {
    const configPath = await this.findConfigFile(startDir);
    
    if (configPath) {
      // 既存設定ファイルがある場合は通常の読み込み
      return this.loadConfig(startDir);
    }
    
    // 設定ファイルが存在しない場合、メタデータ駆動設定を生成
    console.log(getMessage('config.file.not_found'));
    
    // プラグインを自動発見
    await this.discoverAvailablePlugins();
    
    // メタデータベースの設定生成
    const generatedConfig = metadataDrivenConfigManager.generateConfig(options);
    
    // 設定検証
    const validation = metadataDrivenConfigManager.validateConfig(generatedConfig);
    if (!validation.isValid) {
      console.warn(getMessage('config.generated.warning', { errors: validation.errors.join(', ') }));
      return this.getDefaultConfig();
    }
    
    // 警告があれば表示
    if (validation.warnings.length > 0) {
      console.warn(getMessage('config.validation.warning', { warnings: validation.warnings.join(', ') }));
    }
    
    // 提案があれば表示
    if (validation.suggestions.length > 0) {
      console.log(getMessage('config.improvement.suggestion', { suggestions: validation.suggestions.join(', ') }));
    }
    
    console.log(`メタデータ駆動設定を生成しました（プラグイン数: ${Object.keys(generatedConfig.plugins).length}）`);
    return generatedConfig;
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
        { file: 'core/AssertionQualityPlugin.ts', name: 'assertion-quality', displayName: 'Assertion Quality', description: getMessage('config.plugin.description.assertion_quality') },
        { file: 'core/TestCompletenessPlugin.ts', name: 'test-completeness', displayName: 'Test Completeness', description: getMessage('config.plugin.description.test_completeness') },
        { file: 'core/TestStructurePlugin.ts', name: 'test-structure', displayName: 'Test Structure', description: getMessage('config.plugin.description.test_structure') }
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
        getMessage('config.plugin.auto_detection_failed'),
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

  /**
   * 安全な設定ファイル解析
   */
  private safeParseConfig(data: string): any | null {
    try {
      // 基本的な検証
      if (!data || data.trim().length === 0) {
        return null;
      }

      // サイズ制限
      if (data.length > 512 * 1024) { // 512KB
        return null;
      }

      // 危険なパターンの検出
      const dangerousPatterns = [
        /__proto__/g,
        /constructor/g,
        /prototype/g,
        /function\s*\(/gi,
        /eval\s*\(/gi,
        /require\s*\(/gi,
        /import\s*\(/gi,
        /process\./gi,
        /global\./gi,
        /child_process/gi,
        /fs\./gi,
        /path\./gi,
        /\.\.\//g, // パストラバーサル
        /\/etc\/|\/root\/|\/home\//gi, // システムディレクトリ
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(data)) {
          errorHandler.handleError(
            new Error('設定ファイルに危険なコードが含まれています'),
            undefined,
            'セキュリティ違反: 設定ファイル改ざん検出',
            { pattern: pattern.source }
          );
          return null;
        }
      }

      const parsed = JSON.parse(data);
      
      // オブジェクトの深度制限（DoS攻撃防止）
      if (this.getObjectDepth(parsed) > 5) {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  /**
   * 設定内容の検証
   */
  private validateConfig(config: any): Partial<RimorConfig> {
    if (!config || typeof config !== 'object') {
      return {};
    }

    const validatedConfig: Partial<RimorConfig> = {};

    // excludePatternsの検証
    if (Array.isArray(config.excludePatterns)) {
      validatedConfig.excludePatterns = config.excludePatterns
        .filter((pattern: any) => typeof pattern === 'string' && pattern.length < 200)
        .slice(0, 50); // 最大50個
    }

    // pluginsの検証
    if (config.plugins && typeof config.plugins === 'object') {
      validatedConfig.plugins = {};
      
      for (const [pluginName, pluginConfig] of Object.entries(config.plugins)) {
        if (this.validatePluginName(pluginName) && this.validatePluginConfig(pluginConfig)) {
          validatedConfig.plugins[pluginName] = pluginConfig as PluginConfig;
        }
      }
    }

    // outputの検証
    if (config.output && typeof config.output === 'object') {
      validatedConfig.output = {
        format: ['text', 'json'].includes(config.output.format) ? config.output.format : 'text',
        verbose: typeof config.output.verbose === 'boolean' ? config.output.verbose : false
      };
    }

    // scoringの検証
    if (config.scoring && typeof config.scoring === 'object') {
      validatedConfig.scoring = this.validateScoringConfig(config.scoring);
    }

    return validatedConfig;
  }

  /**
   * プラグイン名の検証
   */
  private validatePluginName(name: string): boolean {
    if (typeof name !== 'string' || name.length === 0 || name.length > 50) {
      return false;
    }

    // 英数字、ハイフン、アンダースコアのみ許可
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return false;
    }

    return true;
  }

  /**
   * プラグイン設定の検証
   */
  private validatePluginConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // enabledは必須
    if (typeof config.enabled !== 'boolean') {
      return false;
    }

    // excludeFilesが存在する場合は配列である必要
    if (config.excludeFiles && !Array.isArray(config.excludeFiles)) {
      return false;
    }

    // priorityが存在する場合は数値である必要
    if (config.priority && typeof config.priority !== 'number') {
      return false;
    }

    return true;
  }

  /**
   * スコアリング設定の検証
   */
  private validateScoringConfig(scoring: any): any {
    const validatedScoring: any = {};

    if (typeof scoring.enabled === 'boolean') {
      validatedScoring.enabled = scoring.enabled;
    }

    // weightsの検証は複雑なので基本的な型チェックのみ
    if (scoring.weights && typeof scoring.weights === 'object') {
      validatedScoring.weights = scoring.weights;
    }

    if (scoring.gradeThresholds && typeof scoring.gradeThresholds === 'object') {
      validatedScoring.gradeThresholds = scoring.gradeThresholds;
    }

    if (scoring.options && typeof scoring.options === 'object') {
      validatedScoring.options = scoring.options;
    }

    return validatedScoring;
  }

  /**
   * オブジェクトの深度を取得
   */
  private getObjectDepth(obj: any, depth = 0): number {
    if (depth > 5) return depth; // 最大深度制限

    if (obj && typeof obj === 'object') {
      const depths = Object.values(obj).map(value => this.getObjectDepth(value, depth + 1));
      return Math.max(depth, ...depths);
    }
    
    return depth;
  }
}