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
 * データの汚染度を表す列挙型
 */
export enum TaintLevel {
  /** 汚染されていない */
  UNTAINTED = 0,
  /** 汚染の可能性がある */
  POSSIBLY_TAINTED = 1,
  /** 汚染の可能性が高い */
  LIKELY_TAINTED = 2,
  /** 確実に汚染されている */
  DEFINITELY_TAINTED = 3,
  /** 高度に汚染されている */
  HIGHLY_TAINTED = 4,
  /** クリーン（レガシー互換） */
  CLEAN = 0
}

/**
 * 汚染源の種類
 */
export enum TaintSource {
  /** ユーザー入力 */
  USER_INPUT = 'user-input',
  /** 外部API */
  EXTERNAL_API = 'external-api',
  /** 環境変数 */
  ENVIRONMENT = 'environment',
  /** ファイルシステム */
  FILE_SYSTEM = 'file-system',
  /** データベース */
  DATABASE = 'database',
  /** ネットワーク */
  NETWORK = 'network'
}

/**
 * セキュリティシンク（機密性の高い操作）
 */
export enum SecuritySink {
  /** データベースクエリ */
  DATABASE_QUERY = 'database-query',
  /** システムコマンド実行 */
  SYSTEM_COMMAND = 'system-command',
  /** JavaScriptコード実行 */
  JAVASCRIPT_EXEC = 'javascript-exec',
  /** HTML出力 */
  HTML_OUTPUT = 'html-output',
  /** ファイル書き込み */
  FILE_WRITE = 'file-write',
  /** ネットワーク送信 */
  NETWORK_SEND = 'network-send',
  /** テストアサーション */
  TEST_ASSERTION = 'test-assertion'
}

/**
 * サニタイザーの種類
 */
export enum SanitizerType {
  /** HTMLエスケープ */
  HTML_ESCAPE = 'html-escape',
  /** SQLエスケープ */
  SQL_ESCAPE = 'sql-escape',
  /** 入力検証 */
  INPUT_VALIDATION = 'input-validation',
  /** 型変換 */
  TYPE_CONVERSION = 'type-conversion',
  /** 文字列サニタイズ */
  STRING_SANITIZE = 'string-sanitize',
  /** 認証トークン */
  AUTH_TOKEN = 'auth-token',
  /** パスワードハッシュ */
  PASSWORD_HASH = 'password-hash',
  /** XSSフィルター */
  XSS_FILTER = 'xss-filter',
  /** CSRFトークン */
  CSRF_TOKEN = 'csrf-token',
  /** JSONパース */
  JSON_PARSE = 'json-parse',
  /** カスタム */
  CUSTOM = 'custom'
}

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

/**
 * 改善タイプ
 */
export type ImprovementType = 'add' | 'modify' | 'remove' | 'refactor';

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