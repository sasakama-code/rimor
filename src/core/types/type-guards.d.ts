/**
 * Type guard functions for runtime type checking
 */
import { PackageJsonConfig, ASTNode, ProjectContext, TestFile, Position } from './project-context';
import { Issue } from './base-types';
import { DetectionResult } from './analysis-result';
import { QualityScore } from './quality-score';
import { Improvement } from './improvements';
export declare function isValidPackageJson(value: unknown): value is PackageJsonConfig;
export declare function isValidPosition(value: unknown): value is Position;
export declare function isValidASTNode(value: unknown): value is ASTNode;
export declare function isValidProjectContext(value: unknown): value is ProjectContext;
export declare function isValidTestFile(value: unknown): value is TestFile;
export declare function isValidIssue(value: unknown): value is Issue;
export declare const isIssue: typeof isValidIssue;
export declare const isTestFile: typeof isValidTestFile;
export declare const isDetectionResult: typeof isValidDetectionResult;
export declare const isProjectContext: typeof isValidProjectContext;
export declare function isValidDetectionResult(value: unknown): value is DetectionResult;
export declare function isValidQualityScore(value: unknown): value is QualityScore;
export declare function isValidImprovement(value: unknown): value is Improvement;
export declare function isValidArray<T>(value: unknown, itemValidator: (item: unknown) => item is T): value is T[];
export declare function isValidIssueArray(value: unknown): value is Issue[];
export declare function isValidDetectionResultArray(value: unknown): value is DetectionResult[];
export declare function isValidImprovementArray(value: unknown): value is Improvement[];
//# sourceMappingURL=type-guards.d.ts.map