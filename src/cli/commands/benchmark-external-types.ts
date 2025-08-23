/**
 * 外部プロジェクトベンチマークCLIコマンドの型定義
 * Issue #86: CLI完全統合対応
 * 
 * Issue #84で実装された外部プロジェクトベンチマーク機能と
 * Issue #85で追加された統合分析・有効性検証システムのCLI統合
 */

/**
 * ベンチマーク外部コマンドのオプション
 */
export interface BenchmarkExternalOptions {
  /** 特定プロジェクト名（positional引数） */
  project?: string;
  
  /** ベンチマーク対象ティア */
  tier?: '1' | '2' | 'all';
  
  /** 高速実行モード */
  quick?: boolean;
  
  /** 詳細ログを表示 */
  verbose?: boolean;
  
  /** 並列実行を有効化 */
  parallel?: boolean;
  
  /** 出力ディレクトリ */
  output?: string;
  
  /** 実行回数 */
  iterations?: number;
  
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  
  /** 最大リトライ回数 */
  maxRetries?: number;
  
  /** 並列ワーカー数 */
  workerCount?: number;
  
  /** キャッシュディレクトリ */
  cacheDir?: string;
  
  /** ベースライン比較を実行 */
  baselineComparison?: boolean;
  
  /** Issue #85: 有効性検証レポートを生成 */
  validationReport?: boolean;
}

/**
 * プロジェクト選択の結果
 */
export interface ProjectSelectionResult {
  /** 選択されたプロジェクト配列 */
  projects: any[];
  /** 選択の説明 */
  description: string;
  /** 推定実行時間（秒） */
  estimatedTime: number;
}

/**
 * コマンド実行結果
 */
export interface BenchmarkExternalResult {
  /** 実行成功フラグ */
  success: boolean;
  /** 実行したプロジェクト数 */
  projectCount: number;
  /** 総実行時間 */
  totalExecutionTime: number;
  /** 成功したプロジェクト数 */
  successfulProjects: number;
  /** 全体有効性スコア（Issue #85） */
  overallEffectivenessScore?: number;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

/**
 * 利用可能なプロジェクト一覧
 */
export const AVAILABLE_PROJECTS = [
  'typescript',
  'ant-design', 
  'vscode',
  'material-ui',
  'storybook',
  'deno'
] as const;

export type ProjectName = typeof AVAILABLE_PROJECTS[number];

/**
 * プロジェクトティアの定義
 */
export const PROJECT_TIERS = {
  1: ['typescript', 'ant-design', 'vscode'], // 最優先プロジェクト
  2: ['material-ui', 'storybook', 'deno']     // 追加評価プロジェクト
} as const;

/**
 * デフォルト設定値
 */
export const DEFAULT_OPTIONS = {
  tier: '1' as const,
  quick: false,
  verbose: false,
  parallel: false,
  output: './.rimor/benchmark-results',
  iterations: 1,
  timeout: 300000, // 5分
  maxRetries: 3,
  baselineComparison: false,
  validationReport: true // Issue #85機能はデフォルトで有効
} as const;