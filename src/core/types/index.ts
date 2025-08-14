/**
 * Central export point for all type definitions
 * This file provides both granular and aggregated exports for flexibility
 */

// Base types
export * from './base-types';

// Project context types
export * from './project-context';

// Re-export commonly used security types for convenience
export type { IncrementalUpdate } from '../../security/types/flow-types';
export type { MethodSignature } from './project-context';

// Plugin interface types
export * from './plugin-interface';

// Analysis result types
export * from './analysis-result';

// Quality score types
export * from './quality-score';

// Improvement types
export * from './improvements';

// Domain dictionary types
export * from './domain-dictionary';

// Analysis types (any型除去用の詳細型定義)
// 重複を避けるため、必要な型のみを選択的にエクスポート
export {
  BaseAnalysisResult,
  FileAnalysisResult,
  ProjectAnalysisResult,
  AnalysisSummary,
  TaintAnalysisResult,
  TaintFlow,
  TaintSummary,
  SecurityAnalysisResult,
  SecurityVulnerability,
  ComplianceResult,
  ComplianceViolation,
  DependencyAnalysisResult,
  DependencyInfo,
  DependencyVulnerability,
  OutdatedDependency,
  CircularDependency,
  MethodAnalysisResult,
  MethodChange
} from './analysis-types';

// Handler types (コールバック・ハンドラー用型定義)
export * from './handler-types';

// Security types (re-export from security module)
export { 
  BoundaryCondition,
  ITypeBasedSecurityPlugin,
  AuthTestCoverage,
  AuthTestMetrics,
  SecurityIssue,
  SecurityTestMetrics
} from '../../security/types/security';

export { SecurityImprovement } from '../../security/types/flow-types';

// Type guards
export * from './type-guards';

// Note: These re-exports are already handled by export * above,
// but we list them here for clarity and documentation purposes

// Export type guards
export {
  isValidPackageJson,
  isValidASTNode,
  isValidProjectContext,
  isValidTestFile,
  isValidIssue,
  isValidDetectionResult,
  isValidQualityScore,
  isValidImprovement,
  isValidArray,
  isValidIssueArray,
  isValidDetectionResultArray,
  isValidImprovementArray,
  // Aliases for backward compatibility
  isIssue,
  isTestFile,
  isDetectionResult,
  isProjectContext
} from './type-guards';

// Export plugin type guards
export {
  isIPlugin,
  isITestQualityPlugin
} from './plugin-interface';

// Export quality score type guard
export {
  isQualityScore
} from './quality-score';

// Export analysis result type guard
export {
  isAnalysisResult
} from './analysis-result';

// Import types for composite interfaces
import type { 
  Issue as IssueType
} from './base-types';
import type { 
  TestFile as TestFileType,
  ProjectContext as ProjectContextType
} from './project-context';
import type { 
  DetectionResult as DetectionResultType,
  AnalysisContext as AnalysisContextType,
  AnalysisOptions as AnalysisOptionsType
} from './analysis-result';
import type { QualityScore as QualityScoreType } from './quality-score';
import type { Improvement as ImprovementType } from './improvements';
import type { 
  DomainDictionary as DomainDictionaryType,
  DomainContext as DomainContextType
} from './domain-dictionary';

// Backward compatibility aliases
export type { TaintQualifier } from './base-types';

// Composite type for common use cases
export interface TestAnalysisResult {
  file: TestFileType;
  issues: IssueType[];
  detectionResults: DetectionResultType[];
  qualityScore: QualityScoreType;
  improvements: ImprovementType[];
  domainContext?: DomainContextType;
}

// Unified plugin execution context
export interface PluginExecutionContext {
  project: ProjectContextType;
  file: TestFileType;
  analysis: AnalysisContextType;
  dictionary?: DomainDictionaryType;
  options?: AnalysisOptionsType;
}

// Type aliases for common patterns
export type IssueMap = Map<string, IssueType[]>;
export type QualityScoreMap = Map<string, QualityScoreType>;
export type ImprovementMap = Map<string, ImprovementType[]>;
export type DetectionResultMap = Map<string, DetectionResultType[]>;

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Nullable<T> = T | null | undefined;

// Version info for migration support
export const TYPE_DEFINITIONS_VERSION = '2.0.0';
export const MIGRATION_GUIDE_URL = 'https://github.com/rimor/docs/migration-v2';

// Default export for convenience
export default {
  VERSION: TYPE_DEFINITIONS_VERSION,
  MIGRATION_GUIDE: MIGRATION_GUIDE_URL
};