/**
 * プラグインメタデータ駆動設定システム
 * v0.3.0: 設定複雑性の削減とメタデータ統一
 */

export interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[];
  };
}

export interface PluginDependency {
  pluginName: string;
  version?: string;
  optional: boolean;
  reason: string;
}

export interface PluginMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: 'core' | 'framework' | 'domain' | 'legacy';
  tags: string[];
  author?: string;
  
  // 設定パラメータ
  parameters: PluginParameter[];
  
  // 依存関係
  dependencies: PluginDependency[];
  
  // パフォーマンス情報
  performance: {
    estimatedTimePerFile: number; // ミリ秒
    memoryUsage: 'low' | 'medium' | 'high';
    recommendedBatchSize?: number;
  };
  
  // 対象ファイル
  targetFiles: {
    include: string[];  // glob patterns
    exclude: string[];  // glob patterns
  };
  
  // 出力情報
  issueTypes: {
    type: string;
    severity: 'error' | 'warning' | 'info';
    description: string;
  }[];
}

export interface MetadataProvider {
  getMetadata(): PluginMetadata;
}

/**
 * プラグインメタデータの登録と管理
 */
export class PluginMetadataRegistry {
  private static instance: PluginMetadataRegistry;
  private metadataMap: Map<string, PluginMetadata> = new Map();
  
  private constructor() {}
  
  static getInstance(): PluginMetadataRegistry {
    if (!PluginMetadataRegistry.instance) {
      PluginMetadataRegistry.instance = new PluginMetadataRegistry();
    }
    return PluginMetadataRegistry.instance;
  }
  
  /**
   * プラグインメタデータを登録
   */
  register(metadata: PluginMetadata): void {
    this.metadataMap.set(metadata.name, metadata);
  }
  
  /**
   * プラグインメタデータを取得
   */
  get(pluginName: string): PluginMetadata | undefined {
    return this.metadataMap.get(pluginName);
  }
  
  /**
   * 全プラグインメタデータを取得
   */
  getAll(): PluginMetadata[] {
    return Array.from(this.metadataMap.values());
  }
  
  /**
   * カテゴリ別プラグインメタデータを取得
   */
  getByCategory(category: PluginMetadata['category']): PluginMetadata[] {
    return this.getAll().filter(metadata => metadata.category === category);
  }
  
  /**
   * タグ別プラグインメタデータを取得
   */
  getByTag(tag: string): PluginMetadata[] {
    return this.getAll().filter(metadata => metadata.tags.includes(tag));
  }
  
  /**
   * プラグインの依存関係を解決
   */
  resolveDependencies(pluginName: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const resolve = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      
      const metadata = this.get(name);
      if (!metadata) return;
      
      // 依存プラグインを先に解決
      for (const dep of metadata.dependencies) {
        if (!dep.optional) {
          resolve(dep.pluginName);
        }
      }
      
      result.push(name);
    };
    
    resolve(pluginName);
    return result;
  }
  
  /**
   * プラグインの競合を検出
   */
  detectConflicts(): Array<{
    plugin1: string;
    plugin2: string;
    reason: string;
  }> {
    const conflicts: Array<{
      plugin1: string;
      plugin2: string;
      reason: string;
    }> = [];
    
    const allPlugins = this.getAll();
    
    for (let i = 0; i < allPlugins.length; i++) {
      for (let j = i + 1; j < allPlugins.length; j++) {
        const plugin1 = allPlugins[i];
        const plugin2 = allPlugins[j];
        
        // 同じissueTypeを出力する場合は競合の可能性
        const commonIssueTypes = plugin1.issueTypes
          .map(it => it.type)
          .filter(type => plugin2.issueTypes.some(it2 => it2.type === type));
        
        if (commonIssueTypes.length > 0) {
          conflicts.push({
            plugin1: plugin1.name,
            plugin2: plugin2.name,
            reason: `共通のissueTypeを出力: ${commonIssueTypes.join(', ')}`
          });
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * メタデータ検証
   */
  validateMetadata(metadata: PluginMetadata): string[] {
    const errors: string[] = [];
    
    if (!metadata.name || metadata.name.trim() === '') {
      errors.push('プラグイン名が必要です');
    }
    
    if (!metadata.displayName || metadata.displayName.trim() === '') {
      errors.push('表示名が必要です');
    }
    
    if (!metadata.description || metadata.description.trim() === '') {
      errors.push('説明が必要です');
    }
    
    if (!metadata.version || !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      errors.push('有効なバージョン番号が必要です (例: 1.0.0)');
    }
    
    // パラメータ検証
    for (const param of metadata.parameters) {
      if (!param.name || param.name.trim() === '') {
        errors.push(`パラメータ名が必要です`);
      }
      if (param.required && param.defaultValue === undefined) {
        errors.push(`必須パラメータ「${param.name}」にデフォルト値が必要です`);
      }
    }
    
    // 依存関係循環チェック
    const checkCircular = (pluginName: string, visited: Set<string>): boolean => {
      if (visited.has(pluginName)) return true;
      visited.add(pluginName);
      
      const pluginMetadata = this.get(pluginName);
      if (!pluginMetadata) return false;
      
      for (const dep of pluginMetadata.dependencies) {
        if (!dep.optional && checkCircular(dep.pluginName, new Set(visited))) {
          return true;
        }
      }
      
      return false;
    };
    
    if (checkCircular(metadata.name, new Set())) {
      errors.push('循環依存関係が検出されました');
    }
    
    return errors;
  }
  
  /**
   * メタデータ統計の取得
   */
  getStatistics(): {
    totalPlugins: number;
    categoryBreakdown: Record<string, number>;
    averageParameterCount: number;
    dependencyComplexity: number;
  } {
    const allPlugins = this.getAll();
    
    const categoryBreakdown = allPlugins.reduce((acc, plugin) => {
      acc[plugin.category] = (acc[plugin.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalParameters = allPlugins.reduce((sum, plugin) => sum + plugin.parameters.length, 0);
    const totalDependencies = allPlugins.reduce((sum, plugin) => sum + plugin.dependencies.length, 0);
    
    return {
      totalPlugins: allPlugins.length,
      categoryBreakdown,
      averageParameterCount: allPlugins.length > 0 ? totalParameters / allPlugins.length : 0,
      dependencyComplexity: allPlugins.length > 0 ? totalDependencies / allPlugins.length : 0
    };
  }
}

/**
 * デフォルトプラグインメタデータの定義
 */
export const defaultPluginMetadata: Record<string, PluginMetadata> = {
  'test-existence': {
    name: 'test-existence',
    displayName: 'Test Existence Checker',
    description: 'ソースファイルに対応するテストファイルの存在確認',
    version: '1.0.0',
    category: 'legacy',
    tags: ['testing', 'coverage', 'basic'],
    parameters: [
      {
        name: 'excludeFiles',
        type: 'array',
        required: false,
        defaultValue: ['index.ts', 'index.js', 'types.ts', 'types.js', 'config.ts', 'config.js'],
        description: 'テスト対象から除外するファイル名の配列'
      }
    ],
    dependencies: [],
    performance: {
      estimatedTimePerFile: 5,
      memoryUsage: 'low',
      recommendedBatchSize: 50
    },
    targetFiles: {
      include: ['**/*.ts', '**/*.js'],
      exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
    },
    issueTypes: [
      {
        type: 'missing-test',
        severity: 'error',
        description: 'テストファイルが存在しません'
      }
    ]
  },
  
  'assertion-exists': {
    name: 'assertion-exists',
    displayName: 'Assertion Checker',
    description: 'テストファイル内のアサーション文の存在確認',
    version: '1.0.0',
    category: 'legacy',
    tags: ['testing', 'assertions', 'basic'],
    parameters: [],
    dependencies: [],
    performance: {
      estimatedTimePerFile: 10,
      memoryUsage: 'low',
      recommendedBatchSize: 30
    },
    targetFiles: {
      include: ['**/*.test.*', '**/*.spec.*'],
      exclude: ['**/node_modules/**']
    },
    issueTypes: [
      {
        type: 'missing-assertion',
        severity: 'warning',
        description: 'アサーション文が見つかりません'
      }
    ]
  },
  
  'assertion-quality': {
    name: 'assertion-quality',
    displayName: 'Assertion Quality Analyzer',
    description: 'アサーションの品質と適切性を分析',
    version: '1.0.0',
    category: 'core',
    tags: ['testing', 'quality', 'assertions', 'advanced'],
    parameters: [
      {
        name: 'weakAssertionThreshold',
        type: 'number',
        required: false,
        defaultValue: 50,
        description: '弱いアサーションの許容割合（%）',
        validation: { min: 0, max: 100 }
      }
    ],
    dependencies: [
      {
        pluginName: 'assertion-exists',
        optional: true,
        reason: 'アサーション存在確認と組み合わせることで包括的な分析が可能'
      }
    ],
    performance: {
      estimatedTimePerFile: 25,
      memoryUsage: 'medium',
      recommendedBatchSize: 20
    },
    targetFiles: {
      include: ['**/*.test.*', '**/*.spec.*'],
      exclude: ['**/node_modules/**']
    },
    issueTypes: [
      {
        type: 'weak-assertion',
        severity: 'warning',
        description: '弱いアサーションが検出されました'
      },
      {
        type: 'assertion-quality-low',
        severity: 'warning',
        description: 'アサーション品質が低下しています'
      }
    ]
  }
};

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const pluginMetadataRegistry = PluginMetadataRegistry.getInstance();