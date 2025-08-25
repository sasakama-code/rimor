/**
 * TypedAuthTestQualityPlugin specific type definitions
 */

import { QualifiedType } from '../types/checker-framework-types';
import { TaintLevel } from '../../core/types';
import { SecurityViolation } from '../types/lattice';
import { TypeInferenceResult } from '../types';

/**
 * AST node representation for auth-related analysis
 */
export interface AuthASTNode {
  type: string;
  value?: string;
  name?: string;
  operator?: string;
  left?: AuthASTNode;
  right?: AuthASTNode;
  object?: AuthASTNode;
  property?: AuthASTNode;
  callee?: AuthASTNode;
  arguments?: AuthASTNode[];
  children?: AuthASTNode[];
  statement?: {
    content: string;
    [key: string]: unknown;
  };
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

/**
 * Extended type inference result with auth-specific fields
 */
export interface AuthTypeInferenceResult extends TypeInferenceResult {
  inferredTypes?: Record<string, string>;
  typeConstraints?: Array<{
    variable: string;
    constraint: string;
  }>;
  typeErrors?: Array<{
    message: string;
    location?: {
      line: number;
      column?: number;
    };
  }>;
}

/**
 * Auth taint path information
 */
export interface AuthTaintPath {
  source: string;
  sink: string;
  nodes: string[];
  taintLevel: TaintLevel;
  isAuthRelated: boolean;
}

/**
 * Auth critical flow information
 */
export interface AuthCriticalFlow {
  id: string;
  path: string[];
  violationType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  authContext: string;
}

/**
 * Error information for analysis failures
 */
export interface AnalysisError {
  message: string;
  stack?: string;
  code?: string;
}

/**
 * Type guards
 */
export function isAuthASTNode(value: unknown): value is AuthASTNode {
  if (typeof value !== 'object' || value === null) return false;
  const node = value as Record<string, unknown>;
  return typeof node.type === 'string';
}

export function isAuthTypeInferenceResult(value: unknown): value is AuthTypeInferenceResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return true; // Basic check, can be enhanced
}

export function isAnalysisError(value: unknown): value is AnalysisError {
  if (typeof value !== 'object' || value === null) return false;
  const error = value as Record<string, unknown>;
  return typeof error.message === 'string';
}