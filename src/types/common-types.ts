/**
 * 共通型定義ファイル
 * プロジェクト全体で使用される型を一元管理
 */

/**
 * セキュリティ型の統一定義
 * この定義が唯一の信頼できる情報源（SSOT）として機能
 */
export enum SecurityType {
  /** ユーザー入力型 */
  USER_INPUT = 'user-input',
  /** 認証トークン型 */
  AUTH_TOKEN = 'auth-token',
  /** 検証済み認証型 */
  VALIDATED_AUTH = 'validated-auth',
  /** 検証済み入力型 */
  VALIDATED_INPUT = 'validated-input',
  /** サニタイズ済み型 */
  SANITIZED_DATA = 'sanitized-data',
  /** セキュアSQL型 */
  SECURE_SQL = 'secure-sql',
  /** セキュアHTML型 */
  SECURE_HTML = 'secure-html',
  /** 認証型 */
  AUTHENTICATION = 'authentication',
  /** 認可型 */
  AUTHORIZATION = 'authorization',
  /** 入力検証型 */
  INPUT_VALIDATION = 'input-validation',
  /** APIセキュリティ型 */
  API_SECURITY = 'api-security'
}

/**
 * 汚染レベル（TaintLevel）
 * データの汚染度を表す型（文字列型に統一）
 */
export type TaintLevel = 'untainted' | 'tainted' | 'sanitized' | 'unknown' | 'possibly_tainted' | 'highly_tainted';

// Enum values for runtime usage
export const TaintLevel = {
  UNTAINTED: 'untainted' as const,
  TAINTED: 'tainted' as const,
  SANITIZED: 'sanitized' as const,
  UNKNOWN: 'unknown' as const,
  // レガシー互換性と追加の汚染レベル
  CLEAN: 'untainted' as const,  // CLEANをUNTAINTEDにマップ
  DEFINITELY_TAINTED: 'tainted' as const,
  LIKELY_TAINTED: 'tainted' as const,
  POSSIBLY_TAINTED: 'possibly_tainted' as const,
  HIGHLY_TAINTED: 'highly_tainted' as const
} as const;

/**
 * 汚染源の種類
 */
export type TaintSource = 'user-input' | 'database' | 'file-system' | 'network' | 'environment' | 'unknown';

// Enum values for runtime usage  
export const TaintSource = {
  USER_INPUT: 'user-input' as const,
  DATABASE: 'database' as const,
  FILE_SYSTEM: 'file-system' as const,
  NETWORK: 'network' as const,
  ENVIRONMENT: 'environment' as const,
  UNKNOWN: 'unknown' as const,
  // レガシー互換性のため
  EXTERNAL_API: 'network' as const
} as const;

/**
 * セキュリティシンク（機密性の高い操作）
 */
export type SecuritySink = 'database' | 'file-system' | 'network' | 'command' | 'eval' | 'dom' | 'unknown';

// Enum values for runtime usage
export const SecuritySink = {
  DATABASE: 'database' as const,
  FILE_SYSTEM: 'file-system' as const,
  NETWORK: 'network' as const,
  COMMAND: 'command' as const,
  EVAL: 'eval' as const,
  DOM: 'dom' as const,
  UNKNOWN: 'unknown' as const,
  // レガシー互換性のため
  DATABASE_QUERY: 'database' as const
} as const;

/**
 * サニタイザーの種類
 */
export type SanitizerType = 'escape' | 'validate' | 'encode' | 'filter' | 'none';

// Enum values for runtime usage
export const SanitizerType = {
  ESCAPE: 'escape' as const,
  VALIDATE: 'validate' as const,
  ENCODE: 'encode' as const,
  FILTER: 'filter' as const,
  NONE: 'none' as const,
  // レガシー互換性のため
  HTML_ESCAPE: 'escape' as const,
  SQL_ESCAPE: 'escape' as const,
  INPUT_VALIDATION: 'validate' as const,
  TYPE_CONVERSION: 'validate' as const
} as const;

/**
 * 重要度レベル
 */
export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical' | 'error' | 'warning';

/**
 * プラグインタイプ
 */
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security';

/**
 * テストタイプ
 */
export type TestType = 'unit' | 'integration' | 'e2e' | 'security';

/**
 * 品質ディメンション
 */
export type QualityDimension = 
  | 'completeness'    // 網羅性
  | 'correctness'     // 正確性
  | 'maintainability' // 保守性
  | 'performance'     // パフォーマンス
  | 'security';       // セキュリティ

// ImprovementTypeはcore/types/base-types.tsで定義済み
// 重複を避けるためここでは定義しない

/**
 * 改善優先度
 */
export type ImprovementPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * 基本的な位置情報
 */
export interface Location {
  line: number;
  column: number;
}

/**
 * ファイル位置情報
 */
export interface FileLocation extends Location {
  file: string;
}

/**
 * 範囲を持つ位置情報
 */
export interface RangeLocation extends Location {
  endLine?: number;
  endColumn?: number;
}

/**
 * コード位置情報（統合版）
 */
export interface CodeLocation extends FileLocation, RangeLocation {}

/**
 * 時間範囲
 */
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * 信頼度情報
 */
export interface ConfidenceInfo {
  confidence: number; // 0.0-1.0
  evidence: string[];
}

/**
 * 基本的なメタデータ
 */
export interface BaseMetadata {
  id: string;
  name: string;
  description?: string;
  timestamp?: Date;
  [key: string]: any;
}