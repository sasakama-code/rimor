/**
 * analyze-v0.8.ts用の型定義
 * TDDアプローチ - GREENフェーズ
 */

import {
  ProjectAnalysisResult,
  TaintAnalysisResult,
  Issue,
  TaintFlow,
  TaintSummary
} from '../../core/types';

// AI JSON出力用の型定義
export interface AIJsonOutput {
  overallAssessment: string;
  keyRisks: AIRisk[];
  fullReportUrl: string;
}

export interface AIRisk {
  problem: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  context: AIRiskContext;
  suggestedAction: AISuggestedAction;
}

export interface AIRiskContext {
  filePath: string;
  codeSnippet: string;
  startLine: number;
  endLine: number;
}

export interface AISuggestedAction {
  type: string;
  description: string;
  example: string;
}

// レポート出力用の型定義
export interface ReportOutput {
  projectPath: string;
  timestamp: string;
  summary: ReportSummary;
  results: ReportResult[];
}

export interface ReportSummary {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

export interface ReportResult {
  filePath: string;
  issues: Issue[];
  score: number;
  improvements: string[];
}

// 型ガード関数
export function isAIJsonOutput(value: unknown): value is AIJsonOutput {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.overallAssessment === 'string' &&
    Array.isArray(obj.keyRisks) &&
    obj.keyRisks.every(isAIRisk) &&
    typeof obj.fullReportUrl === 'string'
  );
}

export function isAIRisk(value: unknown): value is AIRisk {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.problem === 'string' &&
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(obj.riskLevel as string) &&
    isAIRiskContext(obj.context) &&
    isAISuggestedAction(obj.suggestedAction)
  );
}

function isAIRiskContext(value: unknown): value is AIRiskContext {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.filePath === 'string' &&
    typeof obj.codeSnippet === 'string' &&
    typeof obj.startLine === 'number' &&
    typeof obj.endLine === 'number'
  );
}

function isAISuggestedAction(value: unknown): value is AISuggestedAction {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.type === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.example === 'string'
  );
}

export function isReportOutput(value: unknown): value is ReportOutput {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.projectPath === 'string' &&
    typeof obj.timestamp === 'string' &&
    isReportSummary(obj.summary) &&
    Array.isArray(obj.results) &&
    obj.results.every(isReportResult)
  );
}

function isReportSummary(value: unknown): value is ReportSummary {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.totalFiles === 'number' &&
    typeof obj.analyzedFiles === 'number' &&
    typeof obj.totalIssues === 'number' &&
    typeof obj.criticalIssues === 'number' &&
    typeof obj.highIssues === 'number' &&
    typeof obj.mediumIssues === 'number' &&
    typeof obj.lowIssues === 'number'
  );
}

function isReportResult(value: unknown): value is ReportResult {
  if (!value || typeof value !== 'object') return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.filePath === 'string' &&
    Array.isArray(obj.issues) &&
    typeof obj.score === 'number' &&
    Array.isArray(obj.improvements) &&
    obj.improvements.every((imp: unknown) => typeof imp === 'string')
  );
}

// 変換関数
export function convertToAIJson(analysisResult: unknown): AIJsonOutput {
  const result = analysisResult as Partial<ProjectAnalysisResult>;
  const issues = result.issues || [];
  const issueCount = issues.length;
  const score = issueCount === 0 ? 100 : Math.max(0, 100 - issueCount * 10);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  
  return {
    overallAssessment: `プロジェクト品質評価結果:\n総合スコア: ${score}/100\nグレード: ${grade}\n\n検出された問題: ${issueCount}件`,
    keyRisks: issues.slice(0, 10).map((issue) => ({
      problem: issue.message || '問題が検出されました',
      riskLevel: mapSeverityToRiskLevel(issue.severity),
      context: {
        filePath: issue.file || 'unknown',
        codeSnippet: '',
        startLine: issue.line || 0,
        endLine: issue.line || 0
      },
      suggestedAction: {
        type: 'ADD_MISSING_TEST',
        description: 'テストを追加してください',
        example: ''
      }
    })),
    fullReportUrl: '.rimor/reports/index.html'
  };
}

export function convertToReportOutput(taintResult: unknown): ReportOutput {
  const result = taintResult as Partial<TaintAnalysisResult>;
  const flows = result.flows || [];
  const summary = result.summary || createDefaultTaintSummary();
  
  return {
    projectPath: '/project',
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      analyzedFiles: 0,
      totalIssues: flows.length,
      criticalIssues: summary.criticalFlows || 0,
      highIssues: summary.highFlows || 0,
      mediumIssues: summary.mediumFlows || 0,
      lowIssues: summary.lowFlows || 0
    },
    results: []
  };
}

// ヘルパー関数
function mapSeverityToRiskLevel(severity?: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  switch (severity?.toLowerCase()) {
    case 'error':
    case 'critical':
      return 'CRITICAL';
    case 'high':
    case 'warning':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    case 'info':
    case 'low':
    default:
      return 'LOW';
  }
}

function createDefaultTaintSummary(): TaintSummary {
  return {
    totalFlows: 0,
    criticalFlows: 0,
    highFlows: 0,
    mediumFlows: 0,
    lowFlows: 0,
    sourcesCount: 0,
    sinksCount: 0,
    sanitizersCount: 0
  };
}

// 分析結果の型定義
export interface AnalysisResultWithPlugins {
  issues: Issue[];
  pluginResults?: Record<string, PluginResult>;
}

export interface PluginResult {
  detections?: Detection[];
}

export interface Detection {
  patternId: string;
  severity: string;
  location: Location;
  metadata?: {
    source?: string;
    sink?: string;
  };
}

export interface Location {
  file: string;
  line: number;
}

// Taint解析結果の変換用型
export interface TaintFlowData {
  id: string;
  source: string;
  sink: string;
  taintLevel: string;
  path: Array<{ file: string; line: number }>;
}

export interface TaintSummaryData {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}