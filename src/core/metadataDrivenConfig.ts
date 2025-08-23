/**
 * メタデータ駆動設定システム
 * プラグインメタデータに基づく動的設定生成と管理
 */

import { pluginMetadataRegistry, defaultPluginMetadata } from './pluginMetadata';
import { errorHandler } from '../utils/errorHandler';
import type {
  PluginMetadata,
  RimorConfig,
  PluginConfig,
  ConfigGenerationOptions,
  PluginRecommendation
} from './types/config-types';

// 型定義を再エクスポート（後方互換性のため）
export type {
  ConfigGenerationOptions,
  PluginRecommendation
};

export class MetadataDrivenConfigManager {
  private static instance: MetadataDrivenConfigManager;
  
  private constructor() {
    this.initializeDefaultMetadata();
  }
  
  static getInstance(): MetadataDrivenConfigManager {
    if (!MetadataDrivenConfigManager.instance) {
      MetadataDrivenConfigManager.instance = new MetadataDrivenConfigManager();
    }
    return MetadataDrivenConfigManager.instance;
  }
  
  /**
   * デフォルトメタデータの初期化
   */
  private initializeDefaultMetadata(): void {
    Object.values(defaultPluginMetadata).forEach(metadata => {
      pluginMetadataRegistry.register(metadata);
    });
  }
  
  /**
   * メタデータ駆動の設定生成
   */
  generateConfig(options: ConfigGenerationOptions = {}): RimorConfig {
    const {
      preset = 'recommended',
      targetEnvironment = 'development',
      maxExecutionTime = 30000,
      memoryLimit = 'medium',
      includeExperimental = false
    } = options;
    
    const selectedPlugins = this.selectPluginsByPreset(preset, {
      targetEnvironment,
      maxExecutionTime,
      memoryLimit,
      includeExperimental
    });
    
    const plugins: Record<string, PluginConfig> = {};
    
    for (const pluginName of selectedPlugins) {
      const metadata = pluginMetadataRegistry.get(pluginName);
      if (!metadata) continue;
      
      plugins[pluginName] = this.generatePluginConfig(metadata, options);
    }
    
    return {
      plugins,
      output: {
        format: targetEnvironment === 'ci' ? 'json' : 'text',
        verbose: targetEnvironment === 'development'
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        preset,
        targetEnvironment,
        pluginCount: Object.keys(plugins).length,
        estimatedExecutionTime: this.estimateExecutionTime(selectedPlugins)
      }
    };
  }
  
  /**
   * プリセットに基づくプラグイン選択
   */
  private selectPluginsByPreset(
    preset: ConfigGenerationOptions['preset'],
    context: {
      targetEnvironment: string;
      maxExecutionTime: number;
      memoryLimit: string;
      includeExperimental: boolean;
    }
  ): string[] {
    const allPlugins = pluginMetadataRegistry.getAll();
    
    switch (preset) {
      case 'minimal':
        return allPlugins
          .filter(p => p.category === 'legacy' && p.performance?.memoryUsage === 'low')
          .map(p => p.name);
        
      case 'recommended':
        return allPlugins
          .filter(p => {
            if (p.category === 'core' && context.memoryLimit === 'low') return false;
            if (!context.includeExperimental && p.tags?.includes('experimental')) return false;
            return true;
          })
          .sort((a, b) => {
            // 優先度: legacy > core > framework > domain
            const categoryPriority: Record<string, number> = { legacy: 4, core: 3, framework: 2, domain: 1 };
            return (categoryPriority[b.category as string] || 0) - (categoryPriority[a.category as string] || 0);
          })
          .slice(0, context.targetEnvironment === 'ci' ? 8 : 12)
          .map(p => p.name);
        
      case 'comprehensive':
        return allPlugins
          .filter(p => {
            if (!context.includeExperimental && p.tags?.includes('experimental')) return false;
            return true;
          })
          .map(p => p.name);
        
      case 'performance':
        return allPlugins
          .filter(p => p.performance?.estimatedTimePerFile && p.performance.estimatedTimePerFile <= 15)
          .sort((a, b) => (a.performance?.estimatedTimePerFile || 0) - (b.performance?.estimatedTimePerFile || 0))
          .map(p => p.name);
        
      default:
        return allPlugins.map(p => p.name);
    }
  }
  
  /**
   * プラグイン固有設定の生成
   */
  private generatePluginConfig(metadata: PluginMetadata, options: ConfigGenerationOptions): PluginConfig {
    const config: PluginConfig & Record<string, unknown> = {
      enabled: true,
      priority: this.calculatePluginPriority(metadata, options),
    };
    
    // パラメータのデフォルト値を設定
    for (const param of (metadata.parameters || [])) {
      if (param.defaultValue !== undefined) {
        config[param.name] = param.defaultValue;
      }
    }
    
    // 環境固有の調整
    if (options.targetEnvironment === 'ci') {
      // CI環境では高速化を優先
      if (metadata.performance?.recommendedBatchSize) {
        config.batchSize = Math.min(metadata.performance.recommendedBatchSize * 2, 100);
      }
    } else if (options.targetEnvironment === 'development') {
      // 開発環境では詳細なフィードバックを優先
      config.verbose = true;
    }
    
    return config;
  }
  
  /**
   * プラグイン優先度の計算
   */
  private calculatePluginPriority(metadata: PluginMetadata, options: ConfigGenerationOptions): number {
    let priority = 100;
    
    // カテゴリベースの優先度
    switch (metadata.category) {
      case 'legacy': priority += 50; break;
      case 'core': priority += 30; break;
      case 'framework': priority += 20; break;
      case 'domain': priority += 10; break;
    }
    
    // パフォーマンスベースの調整
    if (metadata.performance?.memoryUsage === 'low') priority += 20;
    if (metadata.performance?.estimatedTimePerFile && metadata.performance.estimatedTimePerFile <= 10) priority += 15;
    
    // 環境別調整
    if (options.targetEnvironment === 'ci' && metadata.tags?.includes('ci-friendly')) {
      priority += 25;
    }
    
    return Math.max(1, Math.min(200, priority));
  }
  
  /**
   * 実行時間の推定
   */
  private estimateExecutionTime(pluginNames: string[]): number {
    const assumedFileCount = 50; // 仮定するファイル数
    
    return pluginNames.reduce((total, pluginName) => {
      const metadata = pluginMetadataRegistry.get(pluginName);
      return total + (metadata?.performance?.estimatedTimePerFile ? metadata.performance.estimatedTimePerFile * assumedFileCount : 0);
    }, 0);
  }
  
  /**
   * プラグイン推奨の生成
   */
  generateRecommendations(currentConfig: RimorConfig): PluginRecommendation[] {
    const recommendations: PluginRecommendation[] = [];
    const currentPlugins = new Set(Object.keys(currentConfig.plugins));
    const allPlugins = pluginMetadataRegistry.getAll();
    
    for (const metadata of allPlugins) {
      if (currentPlugins.has(metadata.name)) continue;
      
      // 依存関係に基づく推奨
      const satisfiedDependencies = (metadata.dependencies || []).filter(dep => 
        currentPlugins.has(dep.pluginName)
      );
      
      if (satisfiedDependencies.length > 0) {
        recommendations.push({
          pluginName: metadata.name,
          reason: `依存プラグイン「${satisfiedDependencies[0].pluginName}」が有効になっています`,
          priority: 'high',
          estimatedImpact: '既存の分析を補完し、より包括的な結果を提供'
        });
      }
      
      // カテゴリベースの推奨
      if (metadata.category === 'core' && !currentPlugins.has(metadata.name)) {
        const corePluginCount = Array.from(currentPlugins)
          .filter(name => pluginMetadataRegistry.get(name)?.category === 'core')
          .length;
        
        if (corePluginCount < 2) {
          recommendations.push({
            pluginName: metadata.name,
            reason: 'コア品質分析機能の向上',
            priority: 'medium',
            estimatedImpact: 'テスト品質の詳細な分析を提供'
          });
        }
      }
      
      // パフォーマンス最適化の推奨
      if (metadata.performance?.estimatedTimePerFile && metadata.performance.estimatedTimePerFile <= 5 && metadata.performance?.memoryUsage === 'low') {
        recommendations.push({
          pluginName: metadata.name,
          reason: '高速で軽量な分析を提供',
          priority: 'low',
          estimatedImpact: 'パフォーマンスへの影響を最小限に抑えた追加分析'
        });
      }
    }
    
    // 優先度でソート
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5); // 最大5件
  }
  
  /**
   * 設定の最適化
   */
  optimizeConfig(config: RimorConfig, targetMetrics: {
    maxExecutionTime?: number;
    maxMemoryUsage?: 'low' | 'medium' | 'high';
    minPluginCount?: number;
    maxPluginCount?: number;
  }): RimorConfig {
    const optimizedConfig = JSON.parse(JSON.stringify(config)) as RimorConfig;
    const pluginEntries = Object.entries(optimizedConfig.plugins);
    
    // 実行時間制約
    if (targetMetrics.maxExecutionTime) {
      const currentEstimate = this.estimateExecutionTime(pluginEntries.map(([name]) => name));
      
      if (currentEstimate > targetMetrics.maxExecutionTime) {
        // 高速なプラグインのみを選択
        const sortedBySpeed = pluginEntries
          .map(([name, config]) => ({
            name,
            config,
            metadata: pluginMetadataRegistry.get(name)
          }))
          .filter(item => item.metadata)
          .sort((a, b) => (a.metadata?.performance?.estimatedTimePerFile || 0) - (b.metadata?.performance?.estimatedTimePerFile || 0));
        
        optimizedConfig.plugins = {};
        let runningTotal = 0;
        
        for (const item of sortedBySpeed) {
          const estimatedAdd = (item.metadata?.performance?.estimatedTimePerFile || 0) * 50; // 仮定ファイル数
          if (runningTotal + estimatedAdd <= targetMetrics.maxExecutionTime) {
            optimizedConfig.plugins[item.name] = item.config;
            runningTotal += estimatedAdd;
          }
        }
      }
    }
    
    // メモリ制約
    if (targetMetrics.maxMemoryUsage) {
      const memoryPriority = { low: 3, medium: 2, high: 1 };
      const maxAllowed = memoryPriority[targetMetrics.maxMemoryUsage];
      
      Object.keys(optimizedConfig.plugins).forEach(pluginName => {
        const metadata = pluginMetadataRegistry.get(pluginName);
        if (metadata?.performance?.memoryUsage && memoryPriority[metadata.performance.memoryUsage] < maxAllowed) {
          delete optimizedConfig.plugins[pluginName];
        }
      });
    }
    
    // プラグイン数制約
    const currentCount = Object.keys(optimizedConfig.plugins).length;
    
    if (targetMetrics.maxPluginCount && currentCount > targetMetrics.maxPluginCount) {
      // 優先度の高いプラグインのみを保持
      const sortedByPriority = Object.entries(optimizedConfig.plugins)
        .sort(([, a], [, b]) => (b.priority || 100) - (a.priority || 100))
        .slice(0, targetMetrics.maxPluginCount);
      
      optimizedConfig.plugins = Object.fromEntries(sortedByPriority);
    }
    
    if (targetMetrics.minPluginCount && currentCount < targetMetrics.minPluginCount) {
      // 推奨プラグインを追加
      const recommendations = this.generateRecommendations(optimizedConfig);
      const needed = targetMetrics.minPluginCount - currentCount;
      
      recommendations.slice(0, needed).forEach(rec => {
        const metadata = pluginMetadataRegistry.get(rec.pluginName);
        if (metadata) {
          optimizedConfig.plugins[rec.pluginName] = this.generatePluginConfig(metadata, {});
        }
      });
    }
    
    return optimizedConfig;
  }
  
  /**
   * 設定の妥当性検証
   */
  validateConfig(config: RimorConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    // プラグイン存在チェック
    for (const pluginName of Object.keys(config.plugins)) {
      const metadata = pluginMetadataRegistry.get(pluginName);
      if (!metadata) {
        errors.push(`未知のプラグイン: ${pluginName}`);
        continue;
      }
      
      // 必須パラメータチェック
      const pluginConfig = config.plugins[pluginName];
      for (const param of (metadata.parameters || [])) {
        if (param.required && !(param.name in pluginConfig)) {
          errors.push(`プラグイン「${pluginName}」に必須パラメータ「${param.name}」がありません`);
        }
      }
      
      // 依存関係チェック
      for (const dep of (metadata.dependencies || [])) {
        if (!dep.optional && !config.plugins[dep.pluginName]) {
          errors.push(`プラグイン「${pluginName}」は「${dep.pluginName}」に依存していますが、有効になっていません`);
        }
      }
    }
    
    // パフォーマンス警告
    const totalEstimatedTime = this.estimateExecutionTime(Object.keys(config.plugins));
    if (totalEstimatedTime > 60000) { // 1分以上
      warnings.push(`推定実行時間が${Math.round(totalEstimatedTime / 1000)}秒です。パフォーマンスを考慮してプラグインを減らすことを検討してください`);
    }
    
    // 競合検出
    const conflicts = pluginMetadataRegistry.detectConflicts();
    const enabledConflicts = conflicts.filter(conflict => 
      config.plugins[conflict.plugin1] && config.plugins[conflict.plugin2]
    );
    
    for (const conflict of enabledConflicts) {
      warnings.push(`プラグイン「${conflict.plugin1}」と「${conflict.plugin2}」で競合が検出されました: ${conflict.reason}`);
    }
    
    // 改善提案
    const recommendations = this.generateRecommendations(config);
    if (recommendations.length > 0) {
      suggestions.push(`推奨プラグイン: ${recommendations.slice(0, 3).map(r => r.pluginName).join(', ')}`);
    }
    
    if (Object.keys(config.plugins).length < 3) {
      suggestions.push('より包括的な分析のため、追加プラグインの導入を検討してください');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const metadataDrivenConfigManager = MetadataDrivenConfigManager.getInstance();