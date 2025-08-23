/**
 * 共通型定義ファイル
 * プロジェクト全体で使用される型を一元管理
 */
/**
 * セキュリティ型の統一定義
 * この定義が唯一の信頼できる情報源（SSOT）として機能
 */
export declare enum SecurityType {
    /** ユーザー入力型 */
    USER_INPUT = "user-input",
    /** 認証トークン型 */
    AUTH_TOKEN = "auth-token",
    /** 検証済み認証型 */
    VALIDATED_AUTH = "validated-auth",
    /** 検証済み入力型 */
    VALIDATED_INPUT = "validated-input",
    /** サニタイズ済み型 */
    SANITIZED_DATA = "sanitized-data",
    /** セキュアSQL型 */
    SECURE_SQL = "secure-sql",
    /** セキュアHTML型 */
    SECURE_HTML = "secure-html",
    /** 認証型 */
    AUTHENTICATION = "authentication",
    /** 認可型 */
    AUTHORIZATION = "authorization",
    /** 入力検証型 */
    INPUT_VALIDATION = "input-validation",
    /** APIセキュリティ型 */
    API_SECURITY = "api-security"
}
/**
 * 汚染レベル（TaintLevel）
 * データの汚染度を表す型（文字列型に統一）
 */
export type TaintLevel = 'untainted' | 'tainted' | 'sanitized' | 'unknown' | 'possibly_tainted' | 'highly_tainted';
export declare const TaintLevel: {
    readonly UNTAINTED: "untainted";
    readonly TAINTED: "tainted";
    readonly SANITIZED: "sanitized";
    readonly UNKNOWN: "unknown";
    readonly CLEAN: "untainted";
    readonly DEFINITELY_TAINTED: "tainted";
    readonly LIKELY_TAINTED: "tainted";
    readonly POSSIBLY_TAINTED: "possibly_tainted";
    readonly HIGHLY_TAINTED: "highly_tainted";
};
/**
 * 汚染源の種類
 */
export type TaintSource = 'user-input' | 'database' | 'file-system' | 'network' | 'environment' | 'unknown';
export declare const TaintSource: {
    readonly USER_INPUT: "user-input";
    readonly DATABASE: "database";
    readonly FILE_SYSTEM: "file-system";
    readonly NETWORK: "network";
    readonly ENVIRONMENT: "environment";
    readonly UNKNOWN: "unknown";
    readonly EXTERNAL_API: "network";
};
/**
 * セキュリティシンク（機密性の高い操作）
 */
export type SecuritySink = 'database' | 'file-system' | 'network' | 'command' | 'eval' | 'dom' | 'unknown' | 'database-query' | 'html-output' | 'javascript-exec' | 'system-command' | 'file-write' | 'test-assertion';
export declare const SecuritySink: {
    readonly DATABASE: "database";
    readonly FILE_SYSTEM: "file-system";
    readonly NETWORK: "network";
    readonly COMMAND: "command";
    readonly EVAL: "eval";
    readonly DOM: "dom";
    readonly UNKNOWN: "unknown";
    readonly DATABASE_QUERY: "database-query";
    readonly HTML_OUTPUT: "html-output";
    readonly JAVASCRIPT_EXEC: "javascript-exec";
    readonly SYSTEM_COMMAND: "system-command";
    readonly FILE_WRITE: "file-write";
    readonly TEST_ASSERTION: "test-assertion";
};
/**
 * サニタイザーの種類
 */
export type SanitizerType = 'escape' | 'validate' | 'encode' | 'filter' | 'none' | 'html-escape' | 'sql-escape' | 'input-validation' | 'type-conversion' | 'string-sanitize' | 'json-parse';
export declare const SanitizerType: {
    readonly ESCAPE: "escape";
    readonly VALIDATE: "validate";
    readonly ENCODE: "encode";
    readonly FILTER: "filter";
    readonly NONE: "none";
    readonly HTML_ESCAPE: "html-escape";
    readonly SQL_ESCAPE: "sql-escape";
    readonly INPUT_VALIDATION: "input-validation";
    readonly TYPE_CONVERSION: "type-conversion";
    readonly STRING_SANITIZE: "string-sanitize";
    readonly JSON_PARSE: "json-parse";
};
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
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
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
export interface CodeLocation extends FileLocation, RangeLocation {
}
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
    confidence: number;
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
    [key: string]: unknown;
}
//# sourceMappingURL=common-types.d.ts.map