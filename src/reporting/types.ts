import { CoreTypes, TypeGuards, TypeUtils } from '../core/types/core-definitions';
/**
 * Reporting Type Definitions
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * 決定論的レポーティングのための型定義
 * JSONスキーマ（schema.json）に準拠
 */

/**
 * 分析結果のメタデータ
 */
export interface AnalysisMetadata {
  version: string;
  timestamp: string;
  analyzedPath: string;
  duration: number;
}

/**
 * 重要度レベル
 */
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * 問題タイプの分類
 */
// Migrated to CoreTypes
export enum IssueType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  LDAP_INJECTION = 'LDAP_INJECTION',
  XPATH_INJECTION = 'XPATH_INJECTION',
  MISSING_TEST = 'MISSING_TEST',
  INSUFFICIENT_ASSERTION = 'INSUFFICIENT_ASSERTION',
  TEST_QUALITY = 'TEST_QUALITY',
  CODE_QUALITY = 'CODE_QUALITY',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE'
}

/**
 * コード位置情報
 */
export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

/**
 * データフローの要素
 */
export interface DataFlowNode {
  location: CodeLocation;
  type: string;
  description?: string;
}

/**
 * 汚染データフロー情報
 */
export interface DataFlow {
  source: DataFlowNode;
  sink: DataFlowNode;
  path: DataFlowNode[];
}

/**
 * 検出された問題
 * CoreTypes.Issueを使用してください
 */
// Migrated to CoreTypes - Import from core-definitions
import type { Issue as CoreIssue } from '../core/types/core-definitions';
export type Issue = CoreIssue & {
  location?: CodeLocation;
  dataFlow?: DataFlow;
  recommendation?: string;
  codeSnippet?: string;
  references?: string[];
};

/**
 * 重要度別の問題数
 */
// Migrated to CoreTypes
export interface IssueBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

/**
 * 分析サマリー
 */
export interface AnalysisSummary {
  totalFiles: number;
  totalIssues: number;
  issueBySeverity: IssueBySeverity;
  issueByType: Record<string, number>;
}

/**
 * モジュール別カバレッジ
 */
export interface ModuleCoverage {
  coverage: number;
  testedFiles: number;
  untestedFiles: number;
}

/**
 * テストカバレッジメトリクス
 */
export interface TestCoverageMetrics {
  overall: number;
  byModule: Record<string, ModuleCoverage>;
  missingTests?: Array<{
    file: string;
    reason: string;
  }>;
}

/**
 * 複雑度の高いメソッド
 */
export interface HighComplexityMethod {
  method: string;
  complexity: number;
  location: CodeLocation;
}

/**
 * コード品質メトリクス
 */
export interface CodeQualityMetrics {
  complexity?: {
    average: number;
    max: number;
    highComplexityMethods: HighComplexityMethod[];
  };
  maintainability?: {
    score: number;
    issues: string[];
  };
}

/**
 * 分析メトリクス
 */
export interface AnalysisMetrics {
  testCoverage: TestCoverageMetrics;
  codeQuality: CodeQualityMetrics;
}

/**
 * プラグイン実行結果
 */
export interface PluginResult {
  executed: boolean;
  duration?: number;
  issues?: number;
  metadata?: Record<string, any>;
}

/**
 * 構造化分析結果
 * これが「単一の真実の源」となる
 */
export interface StructuredAnalysisResult {
  metadata: AnalysisMetadata;
  summary: AnalysisSummary;
  issues: Issue[];
  metrics: AnalysisMetrics;
  plugins?: Record<string, PluginResult>;
}

/**
 * レポート生成オプション
 */
export interface ReportGenerationOptions {
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  includeCodeSnippets?: boolean;
  includeDataFlow?: boolean;
  severityFilter?: Severity[];
  typeFilter?: IssueType[];
}

/**
 * アノテーション生成オプション
 */
export interface AnnotationOptions {
  prefix?: string;
  format?: 'inline' | 'block';
  includeDataFlow?: boolean;
  overwrite?: boolean;
}