/**
 * Central export point for all type definitions
 * This file provides both granular and aggregated exports for flexibility
 */
export * from './base-types';
export { ExtendedIssue, IssueCategory } from './core-definitions';
export * from './project-context';
export type { IncrementalUpdate } from '../../security/types/flow-types';
export type { MethodSignature } from './project-context';
export * from './plugin-interface';
export * from './analysis-result';
export * from './quality-score';
export * from './improvements';
export * from './domain-dictionary';
export { BaseAnalysisResult, FileAnalysisResult, ProjectAnalysisResult, AnalysisSummary, TaintAnalysisResult, TaintFlow, TaintSummary, SecurityAnalysisResult, SecurityVulnerability, ComplianceResult, ComplianceViolation, DependencyAnalysisResult, DependencyInfo, DependencyVulnerability, OutdatedDependency, CircularDependency, MethodAnalysisResult, MethodChange } from './analysis-types';
export * from './handler-types';
export { BoundaryCondition, ITypeBasedSecurityPlugin, AuthTestCoverage, AuthTestMetrics, SecurityIssue, SecurityTestMetrics } from '../../security/types/security';
export { SecurityImprovement } from '../../security/types/flow-types';
export * from './type-guards';
export { isValidPackageJson, isValidASTNode, isValidProjectContext, isValidTestFile, isValidIssue, isValidDetectionResult, isValidQualityScore, isValidImprovement, isValidArray, isValidIssueArray, isValidDetectionResultArray, isValidImprovementArray, isIssue, isTestFile, isDetectionResult, isProjectContext } from './type-guards';
export { isIPlugin, isITestQualityPlugin } from './plugin-interface';
export { isQualityScore } from './quality-score';
export { isAnalysisResult } from './analysis-result';
import type { Issue as IssueType } from './base-types';
import type { TestFile as TestFileType, ProjectContext as ProjectContextType } from './project-context';
import type { DetectionResult as DetectionResultType, AnalysisContext as AnalysisContextType, AnalysisOptions as AnalysisOptionsType } from './analysis-result';
import type { QualityScore as QualityScoreType } from './quality-score';
import type { Improvement as ImprovementType } from './improvements';
import type { DomainDictionary as DomainDictionaryType, DomainContext as DomainContextType } from './domain-dictionary';
export type { TaintQualifier } from './base-types';
export interface TestAnalysisResult {
    file: TestFileType;
    issues: IssueType[];
    detectionResults: DetectionResultType[];
    qualityScore: QualityScoreType;
    improvements: ImprovementType[];
    domainContext?: DomainContextType;
}
export interface PluginExecutionContext {
    project: ProjectContextType;
    file: TestFileType;
    analysis: AnalysisContextType;
    dictionary?: DomainDictionaryType;
    options?: AnalysisOptionsType;
}
export type QualityScoreMap = Map<string, QualityScoreType>;
export type ImprovementMap = Map<string, ImprovementType[]>;
export type DetectionResultMap = Map<string, DetectionResultType[]>;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];
export type Nullable<T> = T | null | undefined;
export declare const TYPE_DEFINITIONS_VERSION = "2.0.0";
export declare const MIGRATION_GUIDE_URL = "https://github.com/rimor/docs/migration-v2";
declare const _default: {
    VERSION: string;
    MIGRATION_GUIDE: string;
};
export default _default;
//# sourceMappingURL=index.d.ts.map