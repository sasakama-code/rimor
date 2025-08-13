/**
 * 分析結果の型定義
 * any型除去のための詳細な型定義
 */

import { Issue, SeverityLevel } from './base-types';
import { DetectionResult } from './analysis-result';
import { QualityScore } from './quality-score';
import { Improvement } from './improvements';

/**
 * 分析結果の基本インターフェース
 */
export interface BaseAnalysisResult {
  projectPath: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * ファイル分析結果
 */
export interface FileAnalysisResult {
  filePath: string;
  issues: Issue[];
  patterns: DetectionResult[];
  metrics?: FileMetrics;
}

/**
 * ファイルメトリクス
 */
export interface FileMetrics {
  lines: number;
  functions: number;
  complexity: number;
  coverage?: number;
}

/**
 * プロジェクト分析結果
 */
export interface ProjectAnalysisResult extends BaseAnalysisResult {
  files: FileAnalysisResult[];
  summary: AnalysisSummary;
  issues: Issue[];
  improvements: Improvement[];
  qualityScore: QualityScore;
}

/**
 * 分析サマリー
 */
export interface AnalysisSummary {
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  totalPatterns: number;
  totalImprovements: number;
}

/**
 * 汚染分析結果
 */
export interface TaintAnalysisResult {
  flows: TaintFlow[];
  summary: TaintSummary;
  recommendations: string[];
}

/**
 * 汚染フロー
 */
export interface TaintFlow {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
  confidence: number;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
}

/**
 * 汚染レベル
 */
export type TaintLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * 汚染サマリー
 */
export interface TaintSummary {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}

/**
 * セキュリティ分析結果
 */
export interface SecurityAnalysisResult extends BaseAnalysisResult {
  vulnerabilities: SecurityVulnerability[];
  taintAnalysis?: TaintAnalysisResult;
  securityScore: number;
  compliance: ComplianceResult;
}

/**
 * セキュリティ脆弱性
 */
export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: SeverityLevel;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  cwe?: string;
  owasp?: string;
  fix?: string;
}

/**
 * コンプライアンス結果
 */
export interface ComplianceResult {
  standard: string;
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
}

/**
 * コンプライアンス違反
 */
export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: SeverityLevel;
  location?: {
    file: string;
    line: number;
  };
}

/**
 * 依存関係分析結果
 */
export interface DependencyAnalysisResult {
  dependencies: DependencyInfo[];
  vulnerabilities: DependencyVulnerability[];
  outdated: OutdatedDependency[];
  unused: string[];
  missing: string[];
  circular: CircularDependency[];
}

/**
 * 依存関係情報
 */
export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  resolved?: string;
  integrity?: string;
}

/**
 * 依存関係の脆弱性
 */
export interface DependencyVulnerability {
  package: string;
  version: string;
  severity: SeverityLevel;
  vulnerability: string;
  recommendation: string;
}

/**
 * 古い依存関係
 */
export interface OutdatedDependency {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

/**
 * 循環依存
 */
export interface CircularDependency {
  files: string[];
  severity: SeverityLevel;
  suggestion: string;
}

/**
 * Method Analysis Result
 */
export interface MethodAnalysisResult {
  name: string;
  file: string;
  line: number;
  issues: Issue[];
  complexity?: number;
  coverage?: number;
}

/**
 * Method Change
 */
export interface MethodChange {
  type: 'added' | 'modified' | 'deleted';
  method: string;
  file: string;
  line: number;
  impact: 'high' | 'medium' | 'low';
}