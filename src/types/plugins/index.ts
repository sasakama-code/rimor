/**
 * プラグイン関連の統一型定義
 * 
 * プラグインシステムの型定義を集約
 * ISP（インターフェース分離原則）に基づいた設計
 */

import type { Issue } from '../../core/types/core-definitions';

/**
 * プラグインの種類
 */
export type PluginType = 
  | 'ANALYZER'      // 分析プラグイン
  | 'FORMATTER'     // フォーマッタープラグイン
  | 'REPORTER'      // レポータープラグイン
  | 'TRANSFORMER'   // トランスフォーマープラグイン
  | 'VALIDATOR'     // バリデータープラグイン
  | 'SECURITY'      // セキュリティプラグイン
  | 'PERFORMANCE'   // パフォーマンスプラグイン
  | 'QUALITY';      // 品質プラグイン

/**
 * プラグインの状態
 */
export type PluginStatus = 
  | 'ACTIVE'        // アクティブ
  | 'INACTIVE'      // 非アクティブ
  | 'LOADING'       // ロード中
  | 'ERROR'         // エラー
  | 'DISABLED';     // 無効化

/**
 * プラグインの優先度
 */
export type PluginPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * プラグインメタデータ
 */
export interface PluginMetadata {
  /** プラグイン名 */
  name: string;
  /** バージョン */
  version: string;
  /** 説明 */
  description?: string;
  /** 作者 */
  author?: string;
  /** ライセンス */
  license?: string;
  /** タグ */
  tags?: string[];
  /** 依存関係 */
  dependencies?: Record<string, string>;
}

/**
 * プラグイン設定
 */
export interface PluginConfig {
  /** 有効/無効 */
  enabled: boolean;
  /** 優先度 */
  priority?: PluginPriority;
  /** オプション */
  options?: Record<string, any>;
  /** 除外パターン */
  excludePatterns?: string[];
  /** 含めるパターン */
  includePatterns?: string[];
}

/**
 * プラグインコンテキスト
 */
export interface PluginContext {
  /** プロジェクトルート */
  projectRoot: string;
  /** 設定 */
  config: PluginConfig;
  /** ロガー */
  logger?: {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
  /** キャッシュ */
  cache?: Map<string, any>;
  /** メトリクス */
  metrics?: {
    startTime: number;
    filesProcessed: number;
    issuesFound: number;
  };
}

/**
 * 基本プラグインインターフェース
 * SRP: プラグインの基本契約のみを定義
 */
export interface IPlugin {
  /** プラグイン名 */
  name: string;
  /** プラグインタイプ */
  type: PluginType;
  /** メタデータ */
  metadata?: PluginMetadata;
  /** 初期化 */
  initialize?(context: PluginContext): Promise<void>;
  /** 実行 */
  execute(input: unknown, context?: PluginContext): Promise<unknown>;
  /** クリーンアップ */
  cleanup?(): Promise<void>;
}

/**
 * 分析プラグイン
 */
export interface IAnalyzerPlugin extends IPlugin {
  type: 'ANALYZER';
  /** ファイル分析 */
  analyzeFile(filePath: string, content: string): Promise<Issue[]>;
  /** プロジェクト分析 */
  analyzeProject?(projectPath: string): Promise<Issue[]>;
}

/**
 * フォーマッタープラグイン
 */
export interface IFormatterPlugin extends IPlugin {
  type: 'FORMATTER';
  /** フォーマット */
  format(data: unknown, options?: Record<string, unknown>): Promise<string>;
  /** サポートされるフォーマット */
  supportedFormats: string[];
}

/**
 * レポータープラグイン
 */
export interface IReporterPlugin extends IPlugin {
  type: 'REPORTER';
  /** レポート生成 */
  generateReport(data: unknown, outputPath?: string): Promise<void>;
  /** サポートされる出力形式 */
  supportedOutputs: string[];
}

/**
 * バリデータープラグイン
 */
export interface IValidatorPlugin extends IPlugin {
  type: 'VALIDATOR';
  /** 検証 */
  validate(data: unknown, schema?: unknown): Promise<ValidationResult>;
  /** サポートされるスキーマ */
  supportedSchemas?: string[];
}

/**
 * セキュリティプラグイン
 */
export interface ISecurityPlugin extends IPlugin {
  type: 'SECURITY';
  /** セキュリティスキャン */
  scan(target: string): Promise<SecurityIssue[]>;
  /** 脆弱性チェック */
  checkVulnerabilities?(dependencies: Record<string, string>): Promise<Vulnerability[]>;
}

/**
 * 検証結果
 */
export interface ValidationResult {
  /** 有効かどうか */
  valid: boolean;
  /** エラー */
  errors?: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
  /** 警告 */
  warnings?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * セキュリティ問題
 */
export interface SecurityIssue {
  /** タイプ */
  type: string;
  /** 深刻度 */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** 場所 */
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  /** 修正方法 */
  remediation?: string;
  /** 参照 */
  references?: string[];
}

/**
 * 脆弱性情報
 */
export interface Vulnerability {
  /** CVE ID */
  cveId?: string;
  /** パッケージ名 */
  package: string;
  /** 現在のバージョン */
  version: string;
  /** 脆弱性のあるバージョン */
  vulnerableVersions: string;
  /** 修正バージョン */
  fixedVersion?: string;
  /** 深刻度 */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 説明 */
  description: string;
}

/**
 * プラグイン実行結果
 */
export interface PluginResult {
  /** プラグイン名 */
  pluginName: string;
  /** 成功/失敗 */
  success: boolean;
  /** 結果データ */
  data?: unknown;
  /** エラー */
  error?: Error;
  /** 実行時間 */
  executionTime: number;
  /** メトリクス */
  metrics?: Record<string, any>;
}

/**
 * プラグインマネージャーインターフェース
 */
export interface IPluginManager {
  /** プラグイン登録 */
  register(plugin: IPlugin): void;
  /** プラグイン登録解除 */
  unregister(pluginName: string): void;
  /** プラグイン取得 */
  getPlugin(name: string): IPlugin | undefined;
  /** すべてのプラグイン取得 */
  getAllPlugins(): IPlugin[];
  /** プラグイン実行 */
  execute(pluginName: string, input: unknown): Promise<PluginResult>;
  /** すべてのプラグイン実行 */
  executeAll(input: unknown): Promise<PluginResult[]>;
}

/**
 * 型ガード: IPluginかどうかを判定
 */
export function isPlugin(obj: unknown): obj is IPlugin {
  return obj !== null &&
    typeof obj === 'object' &&
    'name' in obj &&
    'type' in obj &&
    'execute' in obj &&
    typeof (obj as any).name === 'string' &&
    (obj as any).type !== undefined &&
    typeof (obj as any).execute === 'function';
}

/**
 * 型ガード: IAnalyzerPluginかどうかを判定
 */
export function isAnalyzerPlugin(obj: unknown): obj is IAnalyzerPlugin {
  return isPlugin(obj) &&
    obj.type === 'ANALYZER' &&
    typeof (obj as IAnalyzerPlugin).analyzeFile === 'function';
}

/**
 * 型ガード: ISecurityPluginかどうかを判定
 */
export function isSecurityPlugin(obj: unknown): obj is ISecurityPlugin {
  return isPlugin(obj) &&
    obj.type === 'SECURITY' &&
    typeof (obj as ISecurityPlugin).scan === 'function';
}

/**
 * ヘルパー関数: プラグイン優先度を数値に変換
 */
export function priorityToNumber(priority: PluginPriority): number {
  const mapping: Record<PluginPriority, number> = {
    'HIGH': 3,
    'MEDIUM': 2,
    'LOW': 1
  };
  return mapping[priority] || 0;
}

/**
 * ヘルパー関数: プラグインのソート
 */
export function sortPluginsByPriority(plugins: Array<{priority?: PluginPriority}>): void {
  plugins.sort((a, b) => {
    const aPriority = priorityToNumber(a.priority || 'MEDIUM');
    const bPriority = priorityToNumber(b.priority || 'MEDIUM');
    return bPriority - aPriority;
  });
}

/**
 * 後方互換性のための型エイリアス
 * @deprecated
 */
export type Plugin = IPlugin;
export type AnalyzerPlugin = IAnalyzerPlugin;
export type SecurityPlugin = ISecurityPlugin;