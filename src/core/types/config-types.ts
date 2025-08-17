/**
 * 設定関連の共通型定義
 * 循環参照を防ぐため、config.tsとmetadataDrivenConfig.tsから分離
 */

export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
  priority?: number;  // プラグイン実行優先度（高いほど先に実行）
  [key: string]: unknown; // 動的プロパティサポート（型安全性向上）
}

export interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
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
  version?: string;
  category?: 'core' | 'framework' | 'domain' | 'legacy';
  tags?: string[];
  author?: string;
  
  // 設定パラメータ
  parameters?: PluginParameter[];
  
  // 依存関係
  dependencies?: PluginDependency[];
  
  // パフォーマンス情報
  performance?: {
    estimatedTimePerFile: number; // ミリ秒
    memoryUsage: 'low' | 'medium' | 'high';
    recommendedBatchSize?: number;
  };
  
  // 対象ファイル
  targetFiles?: {
    patterns: string[];
    excludePatterns?: string[];
  };
  
  // デフォルト設定（後方互換性）
  defaultConfig?: PluginConfig;
}

export interface RimorConfig {
  excludePatterns?: string[];
  plugins: Record<string, PluginConfig>;
  output: {
    format: 'text' | 'json';
    verbose: boolean;
    reportDir?: string;  // レポート出力ディレクトリ（デフォルト: .rimor/reports/）
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
  };
  thresholds?: {
    minScore?: number;
    minCoverage?: number;
    maxIssues?: number;
  };
  bootstrap?: {
    enabled?: boolean;
    preset?: string;
    targetEnvironment?: string;
  };
  caching?: {
    enabled?: boolean;
    ttl?: number;
    maxSize?: number;
  };
  parallel?: {
    enabled?: boolean;
    maxWorkers?: number;
    chunkSize?: number;
  };
  performanceMonitoring?: {
    enabled?: boolean;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
  };
}

export interface ConfigGenerationOptions {
  preset?: 'minimal' | 'recommended' | 'comprehensive' | 'performance';
  targetEnvironment?: 'development' | 'ci' | 'production';
  maxExecutionTime?: number;  // ミリ秒
  memoryLimit?: 'low' | 'medium' | 'high';
  includeExperimental?: boolean;
}

export interface PluginRecommendation {
  pluginName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}