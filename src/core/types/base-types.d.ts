/**
 * Base type definitions for Rimor
 * These are fundamental types that other modules depend on
 */
export type SecurityThreatType = 'xss' | 'sql-injection' | 'path-traversal' | 'command-injection' | 'other';
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
import type { TaintLevel, TaintSource, SecuritySink, SanitizerType } from '../../types/common-types';
export type { TaintLevel, TaintSource, SecuritySink, SanitizerType };
export type { Issue, SeverityLevel } from './core-definitions';
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security' | 'custom';
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'unknown';
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';
export type ImprovementType = 'add' | 'modify' | 'remove' | 'refactor' | 'add-test' | 'fix-assertion' | 'improve-coverage' | 'add-input-validation-tests' | 'enhance-sanitization-testing' | 'add-boundary-condition-tests' | 'improve-error-handling-tests' | 'documentation' | 'performance' | 'security';
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';
export interface Position {
    line: number;
    column: number;
    offset?: number;
    file?: string;
    method?: string;
}
export interface Location {
    file: string;
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
}
export interface FileLocation {
    file: string;
}
export interface RangeLocation extends FileLocation {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}
export interface CodeLocation {
    file: string;
    line: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    snippet?: string;
}
export interface TimeRange {
    start: Date;
    end: Date;
}
export interface ConfidenceInfo {
    level: number;
    reason?: string;
}
export interface BaseMetadata {
    createdAt?: Date;
    updatedAt?: Date;
    version?: string;
    tags?: string[];
    [key: string]: unknown;
}
import type { SeverityLevel, IssueCategory } from './core-definitions';
export type IssueSeverity = SeverityLevel;
export type { IssueCategory };
export interface BaseIssue {
    id?: string;
    type: string;
    severity: IssueSeverity;
    priority?: number;
    message: string;
    details?: string;
    filePath: string;
    file?: string;
    line?: number;
    endLine?: number;
    column?: number;
    endColumn?: number;
    location?: CodeLocation;
    position?: Position;
    recommendation?: string;
    suggestedFix?: string;
    autoFixable?: boolean;
    codeSnippet?: string;
    context?: string[];
    plugin?: string;
    rule?: string;
    category: IssueCategory;
    documentation?: string;
    examples?: string[];
    references?: string[];
    tags?: string[];
    confidence?: ConfidenceInfo;
    metadata?: Record<string, unknown>;
}
export interface Evidence {
    type: string;
    description: string;
    location: CodeLocation;
    code: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
}
export interface Feedback {
    helpful: boolean;
    accurate?: boolean;
    comment?: string;
    rating?: number;
    timestamp?: Date;
}
export interface FixResult {
    success: boolean;
    modifiedFiles: string[];
    changes?: Array<{
        file: string;
        diff: string;
    }>;
    errors?: string[];
    warnings?: string[];
}
export type TaintQualifier = TaintLevel;
//# sourceMappingURL=base-types.d.ts.map