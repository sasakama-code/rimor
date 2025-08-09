/**
 * Type check worker type definitions
 */

import { QualifiedType } from '../types/checker-framework-types';
import { SecurityIssue } from '../types';
import { TestMethod } from '../../core/types';

/**
 * Worker message for type checking
 */
export interface TypeCheckWorkerMessage {
  id: string;
  method: TestMethod;
  dependencies: Array<[string, unknown]>;
}

/**
 * Worker result from type checking
 */
export interface TypeCheckWorkerResult {
  id: string;
  success: boolean;
  result?: TypeInferenceWorkerResult;
  error?: string;
  executionTime: number;
}

/**
 * Type inference result from worker
 */
export interface TypeInferenceWorkerResult {
  inferredTypes: Map<string, QualifiedType<unknown>>;
  violations: SecurityViolation[];
  securityIssues: SecurityIssue[];
  warnings: TypeCheckWarning[];
}

/**
 * Security violation details
 */
export interface SecurityViolation {
  variable: string;
  type: QualifiedType<unknown>;
  location: CodeLocation;
  message: string;
}

/**
 * Type check warning
 */
export interface TypeCheckWarning {
  message: string;
  location?: CodeLocation;
}

/**
 * Code location information
 */
export interface CodeLocation {
  line: number;
  column?: number;
  file?: string;
}

/**
 * Local analysis result from method analysis
 */
export interface LocalAnalysisResult {
  escapingVariables?: string[];
  annotations?: Array<{
    variable: string;
    annotation: string;
  }>;
  flows?: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  userInputs?: string[];
  databaseInputs?: string[];
  apiInputs?: string[];
  controlFlows?: Array<{
    type: string;
    condition?: string;
    variables?: string[];
  }>;
}

/**
 * Method analysis context
 */
export interface MethodAnalysisContext {
  name: string;
  content: string;
  filePath: string;
  parameters?: Array<{
    name: string;
    type?: string;
  }>;
  returnType?: string;
}

/**
 * Type guards
 */
export function isTypeCheckWorkerMessage(value: unknown): value is TypeCheckWorkerMessage {
  if (typeof value !== 'object' || value === null) return false;
  const msg = value as Record<string, unknown>;
  return typeof msg.id === 'string' &&
         typeof msg.method === 'object' &&
         Array.isArray(msg.dependencies);
}

export function isTypeCheckWorkerResult(value: unknown): value is TypeCheckWorkerResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return typeof result.id === 'string' &&
         typeof result.success === 'boolean' &&
         typeof result.executionTime === 'number';
}

export function isLocalAnalysisResult(value: unknown): value is LocalAnalysisResult {
  if (typeof value !== 'object' || value === null) return false;
  const analysis = value as Record<string, unknown>;
  // All properties are optional, so just check it's an object
  return true;
}