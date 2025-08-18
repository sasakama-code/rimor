/**
 * 統合セキュリティ分析オーケストレータの型定義
 * SOLID原則に従った型設計
 */

// TaintTyper分析結果
export interface TaintAnalysisResult {
  vulnerabilities: TaintVulnerability[];
  summary: TaintSummary;
}

export interface TaintVulnerability {
  id: string;
  type: 'SQL_INJECTION' | 'COMMAND_INJECTION' | 'XSS' | 'PATH_TRAVERSAL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  source: SourceLocation;
  sink: SourceLocation;
  dataFlow: string[];
}

export interface TaintSummary {
  totalVulnerabilities: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
}

// 意図抽出分析結果
export interface IntentAnalysisResult {
  testIntents: TestIntent[];
  summary: IntentSummary;
}

export interface TestIntent {
  testName: string;
  expectedBehavior: string;
  securityRequirements: string[];
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface IntentSummary {
  totalTests: number;
  highRiskTests: number;
  mediumRiskTests: number;
  lowRiskTests: number;
}

// ギャップ分析結果
export interface GapAnalysisResult {
  gaps: SecurityGap[];
  summary: GapSummary;
}

export interface SecurityGap {
  testName: string;
  intention: string;
  actualImplementation: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendations: string[];
}

export interface GapSummary {
  totalGaps: number;
  criticalGaps: number;
  highGaps: number;
  mediumGaps: number;
  lowGaps: number;
}

// NIST評価結果
export interface NistEvaluationResult {
  riskAssessments: NistRiskAssessment[];
  summary: NistSummary;
}

export interface NistRiskAssessment {
  gapId: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  vulnerabilityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  nistScore: number; // 0-100
  recommendations: string[];
}

export interface NistSummary {
  overallScore: number; // 0-100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  totalAssessments: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
}

// 統合分析結果
export interface UnifiedAnalysisResult {
  taintAnalysis: TaintAnalysisResult;
  intentAnalysis: IntentAnalysisResult;
  gapAnalysis: GapAnalysisResult;
  nistEvaluation: NistEvaluationResult;
  unifiedReport: UnifiedReport;
}

export interface UnifiedReport {
  summary: UnifiedSummary;
  taintSummary: TaintSummary;
  intentSummary: IntentSummary;
  gapSummary: GapSummary;
  nistSummary: NistSummary;
  overallRiskScore: number; // 0-100
  metadata: ReportMetadata;
}

export interface UnifiedSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface ReportMetadata {
  analyzedPath: string;
  timestamp: string;
  rimorVersion: string;
  analysisType: string;
  executionTime: number; // milliseconds
}

// 共通型
export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

// オーケストレータ設定
export interface OrchestratorConfig {
  enableTaintAnalysis: boolean;
  enableIntentExtraction: boolean;
  enableGapDetection: boolean;
  enableNistEvaluation: boolean;
  parallelExecution: boolean;
  timeoutMs: number;
}

// エラー型
export class OrchestratorError extends Error {
  constructor(
    message: string,
    public readonly step: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}