/**
 * 分析型の型ガード実装
 * TDDアプローチでのGREENフェーズ
 */

import {
  ProjectAnalysisResult,
  FileAnalysisResult,
  TaintAnalysisResult,
  TaintFlow,
  TaintLevel,
  TaintSummary,
  SecurityAnalysisResult,
  SecurityVulnerability,
  ComplianceResult,
  DependencyAnalysisResult,
  DependencyInfo,
  DependencyVulnerability,
  OutdatedDependency,
  CircularDependency
} from './analysis-types';
import { SeverityLevel } from './base-types';

/**
 * オブジェクトチェック用ヘルパー
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 文字列配列チェック用ヘルパー
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * TaintLevel型ガード
 */
function isTaintLevel(value: unknown): value is TaintLevel {
  return typeof value === 'string' && 
    ['critical', 'high', 'medium', 'low', 'info'].includes(value);
}

/**
 * SeverityLevel型ガード
 */
function isSeverityLevel(value: unknown): value is SeverityLevel {
  return typeof value === 'string' &&
    ['info', 'low', 'medium', 'high', 'critical'].includes(value);
}

/**
 * ProjectAnalysisResult型ガード
 */
export function isProjectAnalysisResult(value: unknown): value is ProjectAnalysisResult {
  if (!isObject(value)) return false;

  // 必須フィールドのチェック
  if (typeof value.projectPath !== 'string') return false;
  if (!(value.timestamp instanceof Date || typeof value.timestamp === 'string')) return false;
  if (typeof value.duration !== 'number') return false;
  if (typeof value.success !== 'boolean') return false;

  // files配列のチェック
  if (!Array.isArray(value.files)) return false;

  // summaryのチェック
  if (!isObject(value.summary)) return false;
  const summary = value.summary;
  if (typeof summary.totalFiles !== 'number') return false;
  if (typeof summary.analyzedFiles !== 'number') return false;
  if (typeof summary.skippedFiles !== 'number') return false;
  if (typeof summary.totalIssues !== 'number') return false;
  if (!isObject(summary.issuesBySeverity)) return false;

  // issues配列のチェック
  if (!Array.isArray(value.issues)) return false;

  // improvements配列のチェック
  if (!Array.isArray(value.improvements)) return false;

  // qualityScoreのチェック
  if (!isObject(value.qualityScore)) return false;
  const qualityScore = value.qualityScore;
  if (typeof qualityScore.overall !== 'number') return false;
  if (typeof qualityScore.confidence !== 'number') return false;
  if (!isObject(qualityScore.dimensions)) return false;

  return true;
}

/**
 * TaintFlow型ガード
 */
export function isTaintFlow(value: unknown): value is TaintFlow {
  if (!isObject(value)) return false;

  if (typeof value.id !== 'string') return false;
  if (typeof value.source !== 'string') return false;
  if (typeof value.sink !== 'string') return false;
  if (!isStringArray(value.path)) return false;
  if (!isTaintLevel(value.taintLevel)) return false;
  if (typeof value.confidence !== 'number') return false;

  // locationは省略可能
  if (value.location !== undefined) {
    if (!isObject(value.location)) return false;
    const location = value.location;
    if (typeof location.file !== 'string') return false;
    if (typeof location.line !== 'number') return false;
  }

  return true;
}

/**
 * TaintSummary型ガード
 */
export function isTaintSummary(value: unknown): value is TaintSummary {
  if (!isObject(value)) return false;

  const requiredNumbers = [
    'totalFlows', 'criticalFlows', 'highFlows',
    'mediumFlows', 'lowFlows', 'sourcesCount',
    'sinksCount', 'sanitizersCount'
  ];

  for (const field of requiredNumbers) {
    if (typeof value[field] !== 'number') return false;
  }

  return true;
}

/**
 * TaintAnalysisResult型ガード
 */
export function isTaintAnalysisResult(value: unknown): value is TaintAnalysisResult {
  if (!isObject(value)) return false;

  // flows配列のチェック
  if (!Array.isArray(value.flows)) return false;
  if (!value.flows.every(flow => isTaintFlow(flow))) return false;

  // summaryのチェック
  if (!isTaintSummary(value.summary)) return false;

  // recommendations配列のチェック
  if (!isStringArray(value.recommendations)) return false;

  return true;
}

/**
 * SecurityVulnerability型ガード
 */
export function isSecurityVulnerability(value: unknown): value is SecurityVulnerability {
  if (!isObject(value)) return false;

  if (typeof value.id !== 'string') return false;
  if (typeof value.type !== 'string') return false;
  if (!isSeverityLevel(value.severity)) return false;
  if (typeof value.description !== 'string') return false;

  // locationのチェック
  if (!isObject(value.location)) return false;
  const location = value.location;
  if (typeof location.file !== 'string') return false;
  if (typeof location.line !== 'number') return false;

  return true;
}

/**
 * ComplianceResult型ガード
 */
export function isComplianceResult(value: unknown): value is ComplianceResult {
  if (!isObject(value)) return false;

  if (typeof value.standard !== 'string') return false;
  if (typeof value.passed !== 'boolean') return false;
  if (typeof value.score !== 'number') return false;
  if (!Array.isArray(value.violations)) return false;

  return true;
}

/**
 * SecurityAnalysisResult型ガード
 */
export function isSecurityAnalysisResult(value: unknown): value is SecurityAnalysisResult {
  if (!isObject(value)) return false;

  // 基本フィールドのチェック
  if (typeof value.projectPath !== 'string') return false;
  if (!(value.timestamp instanceof Date || typeof value.timestamp === 'string')) return false;
  if (typeof value.duration !== 'number') return false;
  if (typeof value.success !== 'boolean') return false;

  // vulnerabilities配列のチェック
  if (!Array.isArray(value.vulnerabilities)) return false;
  if (!value.vulnerabilities.every(vuln => isSecurityVulnerability(vuln))) return false;

  // securityScoreのチェック
  if (typeof value.securityScore !== 'number') return false;

  // complianceのチェック
  if (!isComplianceResult(value.compliance)) return false;

  return true;
}

/**
 * DependencyInfo型ガード
 */
export function isDependencyInfo(value: unknown): value is DependencyInfo {
  if (!isObject(value)) return false;

  if (typeof value.name !== 'string') return false;
  if (typeof value.version !== 'string') return false;
  
  const validTypes = ['production', 'development', 'peer', 'optional'];
  if (typeof value.type !== 'string' || !validTypes.includes(value.type)) return false;

  return true;
}

/**
 * OutdatedDependency型ガード
 */
export function isOutdatedDependency(value: unknown): value is OutdatedDependency {
  if (!isObject(value)) return false;

  if (typeof value.package !== 'string') return false;
  if (typeof value.current !== 'string') return false;
  if (typeof value.wanted !== 'string') return false;
  if (typeof value.latest !== 'string') return false;

  const validTypes = ['major', 'minor', 'patch'];
  if (typeof value.type !== 'string' || !validTypes.includes(value.type)) return false;

  return true;
}

/**
 * DependencyAnalysisResult型ガード
 */
export function isDependencyAnalysisResult(value: unknown): value is DependencyAnalysisResult {
  if (!isObject(value)) return false;

  // dependencies配列のチェック
  if (!Array.isArray(value.dependencies)) return false;
  if (!value.dependencies.every(dep => isDependencyInfo(dep))) return false;

  // vulnerabilities配列のチェック
  if (!Array.isArray(value.vulnerabilities)) return false;

  // outdated配列のチェック
  if (!Array.isArray(value.outdated)) return false;
  if (!value.outdated.every(dep => isOutdatedDependency(dep))) return false;

  // unused配列のチェック
  if (!isStringArray(value.unused)) return false;

  // missing配列のチェック
  if (!isStringArray(value.missing)) return false;

  // circular配列のチェック
  if (!Array.isArray(value.circular)) return false;

  return true;
}