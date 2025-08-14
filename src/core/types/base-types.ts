/**
 * Base type definitions for Rimor
 * These are fundamental types that other modules depend on
 */

// Severity levels for issues and security concerns
export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

// Security-related types
export type SecurityThreatType = 'xss' | 'sql-injection' | 'path-traversal' | 'command-injection' | 'other';

// SecurityType列挙型（値として使用可能）
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

// 共通型定義からインポート（重複を避けるため）
import type { TaintLevel, TaintSource, SecuritySink, SanitizerType } from '../../types/common-types';
export type { TaintLevel, TaintSource, SecuritySink, SanitizerType };

// Plugin types
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security' | 'custom';

// Test types
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'unknown';

// Quality dimensions
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';

// Improvement types and priorities
export type ImprovementType = 
  // 基本的な改善タイプ
  | 'add' | 'modify' | 'remove' | 'refactor'
  // テスト関連の改善タイプ
  | 'add-test' | 'fix-assertion' | 'improve-coverage'
  // セキュリティ関連の改善タイプ
  | 'add-input-validation-tests' | 'enhance-sanitization-testing' 
  | 'add-boundary-condition-tests' | 'improve-error-handling-tests'
  // その他の改善タイプ
  | 'documentation' | 'performance' | 'security';
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';

// Position in source code
export interface Position {
  line: number;
  column: number;
  offset?: number;
  file?: string; // ファイルパス（オプション）
  method?: string; // メソッド名（テストで使用）
}

// Location types
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

// Time range for historical data
export interface TimeRange {
  start: Date;
  end: Date;
}

// Confidence information
export interface ConfidenceInfo {
  level: number; // 0.0 to 1.0
  reason?: string;
}

// Base metadata that can be attached to various entities
export interface BaseMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  tags?: string[];
  [key: string]: unknown; // Allow extension with additional properties
}

// Issue severity levels
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

// Issue categories
export type IssueCategory = 
  | 'test-quality' 
  | 'coverage' 
  | 'assertion' 
  | 'pattern' 
  | 'structure' 
  | 'best-practice' 
  | 'performance' 
  | 'security' 
  | 'documentation';

// Issue representation
export interface Issue {
  // Identification
  id?: string;
  type: string;
  
  // Severity and priority
  severity: IssueSeverity;
  priority?: number;
  
  // Description
  message: string;
  details?: string;
  
  // Location
  filePath: string; // Required for compatibility
  file?: string;
  line?: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  location?: CodeLocation;
  position?: Position;
  
  // Resolution
  recommendation?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
  
  // Context
  codeSnippet?: string;
  context?: string[];
  
  // Source
  plugin?: string;
  rule?: string;
  category: IssueCategory; // Required for compatibility
  
  // Additional info
  documentation?: string;
  examples?: string[];
  references?: string[];
  tags?: string[];
  
  // Confidence
  confidence?: ConfidenceInfo;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Evidence for detection results
export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

// Feedback for learning systems
export interface Feedback {
  helpful: boolean;
  accurate?: boolean;
  comment?: string;
  rating?: number;
  timestamp?: Date;
}

// Fix result from auto-fix operations
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

// Backward compatibility aliases
export type TaintQualifier = TaintLevel; // Type alias for backward compatibility