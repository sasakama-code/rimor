/**
 * プラグイン設定の型定義
 */

/**
 * 基本的なプラグイン設定
 */
export interface PluginConfig {
  /** プラグインの有効/無効 */
  enabled?: boolean;
  /** 実行優先度（数値が大きいほど優先） */
  priority?: number;
  /** タイムアウト時間（ミリ秒） */
  timeout?: number;
  /** 詳細ログ出力 */
  verbose?: boolean;
  /** プラグイン固有のオプション */
  options?: Record<string, unknown>;
}

/**
 * プラグインのパフォーマンス設定
 */
export interface PluginPerformanceConfig {
  /** バッチサイズ */
  batchSize?: number;
  /** 並列実行数 */
  parallelism?: number;
  /** メモリ制限（MB） */
  memoryLimit?: number;
  /** CPU使用率制限（%） */
  cpuLimit?: number;
}

/**
 * 拡張プラグイン設定
 */
export interface ExtendedPluginConfig extends PluginConfig {
  /** パフォーマンス設定 */
  performance?: PluginPerformanceConfig;
  /** 対象ファイルパターン */
  include?: string[];
  /** 除外ファイルパターン */
  exclude?: string[];
  /** 依存プラグイン */
  dependencies?: string[];
}