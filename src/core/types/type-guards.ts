/**
 * Type guard functions for runtime type checking
 */

import { 
  PackageJsonConfig, 
  ASTNode, 
  ProjectContext, 
  TestFile,
  Position 
} from './project-context';
import { 
  Issue, 
  SeverityLevel,
  ImprovementType,
  ImprovementPriority 
} from './base-types';
import { DetectionResult } from './analysis-result';
import { QualityScore } from './quality-score';
import { Improvement } from './improvements';

// Helper function to check if value is a valid object
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Helper function to check if value is a valid enum value
function isEnumValue<T extends string>(value: unknown, validValues: readonly T[]): value is T {
  return typeof value === 'string' && validValues.includes(value as T);
}

// Extract Method: 共通の型チェックパターン（DRY原則）
function validateOptionalString(value: unknown, fieldName: string): boolean {
  return value === undefined || typeof value === 'string';
}

function validateOptionalNumber(value: unknown, fieldName: string): boolean {
  return value === undefined || typeof value === 'number';
}

function validateOptionalBoolean(value: unknown, fieldName: string): boolean {
  return value === undefined || typeof value === 'boolean';
}

function validateRequiredString(value: unknown, fieldName: string): boolean {
  return typeof value === 'string';
}

function validateRequiredNumber(value: unknown, fieldName: string): boolean {
  return typeof value === 'number';
}

// Type guard for PackageJsonConfig
export function isValidPackageJson(value: unknown): value is PackageJsonConfig {
  if (!isObject(value)) return false;
  
  // Required fields
  if (typeof value.name !== 'string' || typeof value.version !== 'string') {
    return false;
  }
  
  // Optional fields validation
  if (value.description !== undefined && typeof value.description !== 'string') return false;
  if (value.main !== undefined && typeof value.main !== 'string') return false;
  if (value.type !== undefined && !isEnumValue(value.type, ['module', 'commonjs'])) return false;
  
  // Dependencies should be objects if present
  if (value.dependencies !== undefined && !isObject(value.dependencies)) return false;
  if (value.devDependencies !== undefined && !isObject(value.devDependencies)) return false;
  if (value.peerDependencies !== undefined && !isObject(value.peerDependencies)) return false;
  
  return true;
}

// Type guard for Position
export function isValidPosition(value: unknown): value is Position {
  if (!isObject(value)) return false;
  
  return (
    typeof value.line === 'number' &&
    typeof value.column === 'number' &&
    value.line >= 0 &&
    value.column >= 0 &&
    (value.offset === undefined || typeof value.offset === 'number')
  );
}

// Type guard for ASTNode
export function isValidASTNode(value: unknown): value is ASTNode {
  if (!isObject(value)) return false;
  
  // Required fields
  if (typeof value.type !== 'string') return false;
  if (!isValidPosition(value.startPosition)) return false;
  if (!isValidPosition(value.endPosition)) return false;
  
  // Optional children validation
  if (value.children !== undefined) {
    if (!Array.isArray(value.children)) return false;
    // Recursively check children
    for (const child of value.children) {
      if (!isValidASTNode(child)) return false;
    }
  }
  
  // Optional value validation
  if (value.value !== undefined) {
    const validTypes = ['string', 'number', 'boolean'];
    if (!validTypes.includes(typeof value.value) && value.value !== null) {
      return false;
    }
  }
  
  return true;
}

// Type guard for ProjectContext
export function isValidProjectContext(value: unknown): value is ProjectContext {
  if (!isObject(value)) return false;
  
  // All fields are optional, but if present, must be valid
  if (value.rootPath !== undefined && typeof value.rootPath !== 'string') return false;
  if (value.projectPath !== undefined && typeof value.projectPath !== 'string') return false;
  
  // Language validation
  const validLanguages = ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'other'];
  if (value.language !== undefined && !isEnumValue(value.language, validLanguages)) {
    return false;
  }
  
  // PackageJson validation
  if (value.packageJson !== undefined && !isValidPackageJson(value.packageJson)) {
    return false;
  }
  
  // File patterns validation
  if (value.filePatterns !== undefined) {
    if (!isObject(value.filePatterns)) return false;
    const patterns = value.filePatterns;
    if (
      !Array.isArray(patterns.test) ||
      !Array.isArray(patterns.source) ||
      !Array.isArray(patterns.ignore)
    ) {
      return false;
    }
  }
  
  return true;
}

// Type guard for TestFile
export function isValidTestFile(value: unknown): value is TestFile {
  if (!isObject(value)) return false;
  
  // Required fields
  if (typeof value.path !== 'string' || typeof value.content !== 'string') {
    return false;
  }
  
  // Optional fields
  if (value.framework !== undefined && typeof value.framework !== 'string') return false;
  if (value.testCount !== undefined && typeof value.testCount !== 'number') return false;
  if (value.hasTests !== undefined && typeof value.hasTests !== 'boolean') return false;
  
  // AST validation
  if (value.ast !== undefined && !isValidASTNode(value.ast)) return false;
  
  // Metadata validation
  if (value.metadata !== undefined) {
    if (!isObject(value.metadata)) return false;
    const metadata = value.metadata;
    if (typeof metadata.language !== 'string') return false;
    if (!(metadata.lastModified instanceof Date)) {
      // Check if it's a valid date string
      if (typeof metadata.lastModified === 'string') {
        const date = new Date(metadata.lastModified);
        if (isNaN(date.getTime())) return false;
      } else {
        return false;
      }
    }
  }
  
  return true;
}

// Type guard for Issue
export function isValidIssue(value: unknown): value is Issue {
  if (!isObject(value)) return false;
  
  // Required fields
  if (typeof value.type !== 'string') return false;
  if (typeof value.message !== 'string') return false;
  
  // Severity validation
  const validSeverities: SeverityLevel[] = ['info', 'low', 'medium', 'high', 'critical'];
  if (!isEnumValue(value.severity, validSeverities)) return false;
  
  // Optional numeric fields
  const numericFields = ['line', 'endLine', 'column', 'endColumn'];
  for (const field of numericFields) {
    if (value[field] !== undefined && typeof value[field] !== 'number') {
      return false;
    }
  }
  
  // Optional string fields
  const stringFields = ['file', 'recommendation', 'codeSnippet', 'plugin'];
  for (const field of stringFields) {
    if (value[field] !== undefined && typeof value[field] !== 'string') {
      return false;
    }
  }
  
  return true;
}

// Alias exports for backward compatibility
export const isIssue = isValidIssue;
export const isTestFile = isValidTestFile;
export const isDetectionResult = isValidDetectionResult;
export const isProjectContext = isValidProjectContext;

// Type guard for DetectionResult
export function isValidDetectionResult(value: unknown): value is DetectionResult {
  if (!isObject(value)) return false;
  
  // Confidence is required and must be between 0 and 1
  if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
    return false;
  }
  
  // Optional fields
  if (value.patternId !== undefined && typeof value.patternId !== 'string') return false;
  if (value.patternName !== undefined && typeof value.patternName !== 'string') return false;
  
  // Security relevance validation
  if (value.securityRelevance !== undefined) {
    if (
      typeof value.securityRelevance !== 'number' ||
      value.securityRelevance < 0 ||
      value.securityRelevance > 1
    ) {
      return false;
    }
  }
  
  // Severity validation
  if (value.severity !== undefined) {
    const validSeverities: SeverityLevel[] = ['info', 'low', 'medium', 'high', 'critical'];
    if (!isEnumValue(value.severity, validSeverities)) return false;
  }
  
  return true;
}

// Type guard for QualityScore
export function isValidQualityScore(value: unknown): value is QualityScore {
  if (!isObject(value)) return false;
  
  // Required fields with range validation
  if (typeof value.overall !== 'number' || value.overall < 0 || value.overall > 1) {
    return false;
  }
  
  if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
    return false;
  }
  
  // Dimensions should be an object
  if (!isObject(value.dimensions)) return false;
  
  // Validate dimension scores
  for (const [key, score] of Object.entries(value.dimensions)) {
    if (typeof score !== 'number' || score < 0 || score > 1) {
      return false;
    }
  }
  
  // Optional details validation
  if (value.details !== undefined) {
    if (!isObject(value.details)) return false;
    const details = value.details;
    if (!Array.isArray(details.strengths)) return false;
    if (!Array.isArray(details.weaknesses)) return false;
    if (!Array.isArray(details.suggestions)) return false;
  }
  
  return true;
}

// Type guard for Improvement
export function isValidImprovement(value: unknown): value is Improvement {
  if (!isObject(value)) return false;
  
  // Required fields
  if (typeof value.id !== 'string') return false;
  if (typeof value.title !== 'string') return false;
  if (typeof value.description !== 'string') return false;
  
  // Type validation
  const validTypes: ImprovementType[] = [
    'add-test', 'fix-assertion', 'improve-coverage', 
    'refactor', 'documentation', 'performance', 'security'
  ];
  if (!isEnumValue(value.type, validTypes)) return false;
  
  // Priority validation
  const validPriorities: ImprovementPriority[] = ['low', 'medium', 'high', 'critical'];
  if (!isEnumValue(value.priority, validPriorities)) return false;
  
  // Optional fields
  if (value.estimatedImpact !== undefined) {
    if (
      typeof value.estimatedImpact !== 'number' ||
      value.estimatedImpact < 0 ||
      value.estimatedImpact > 1
    ) {
      return false;
    }
  }
  
  if (value.effort !== undefined) {
    const validEfforts = ['trivial', 'low', 'medium', 'high', 'very-high'];
    if (!isEnumValue(value.effort, validEfforts)) return false;
  }
  
  if (value.autoFixable !== undefined && typeof value.autoFixable !== 'boolean') {
    return false;
  }
  
  return true;
}

// Helper function to validate array of items
export function isValidArray<T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is T[] {
  if (!Array.isArray(value)) return false;
  return value.every(item => itemValidator(item));
}

// Composite validators
export function isValidIssueArray(value: unknown): value is Issue[] {
  return isValidArray(value, isValidIssue);
}

export function isValidDetectionResultArray(value: unknown): value is DetectionResult[] {
  return isValidArray(value, isValidDetectionResult);
}

export function isValidImprovementArray(value: unknown): value is Improvement[] {
  return isValidArray(value, isValidImprovement);
}