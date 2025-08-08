/**
 * Base type definitions for Rimor
 * These are fundamental types that other modules depend on
 */

// Severity levels for issues and security concerns
export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

// Security-related types
export type SecurityType = 'xss' | 'sql-injection' | 'path-traversal' | 'command-injection' | 'other';
export type TaintLevel = 'untainted' | 'tainted' | 'sanitized' | 'unknown';
export type TaintSource = 'user-input' | 'database' | 'file-system' | 'network' | 'environment' | 'unknown';
export type SecuritySink = 'database' | 'file-system' | 'network' | 'command' | 'eval' | 'dom' | 'unknown';
export type SanitizerType = 'escape' | 'validate' | 'encode' | 'filter' | 'none';

// Plugin types
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security' | 'custom';

// Test types
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'unknown';

// Quality dimensions
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';

// Improvement types and priorities
export type ImprovementType = 'add-test' | 'fix-assertion' | 'improve-coverage' | 'refactor' | 'documentation' | 'performance' | 'security';
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';

// Position in source code
export interface Position {
  line: number;
  column: number;
  offset?: number;
}

// Location types
export interface Location {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface FileLocation {
  file: string;
}

export interface RangeLocation extends FileLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface CodeLocation {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: string;
}

// Time range for historical data
export interface TimeRange {
  start: Date;
  end: Date;
}

// Confidence information
export interface ConfidenceInfo {
  level: number; // 0.0 to 1.0
  reason?: string;
}

// Base metadata that can be attached to various entities
export interface BaseMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  tags?: string[];
  [key: string]: unknown; // Allow extension with additional properties
}

// Issue representation
export interface Issue {
  // Identification
  id?: string;
  type: string;
  
  // Severity and priority
  severity: SeverityLevel;
  priority?: number;
  
  // Description
  message: string;
  details?: string;
  
  // Location
  file?: string;
  line?: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  location?: CodeLocation;
  
  // Resolution
  recommendation?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
  
  // Context
  codeSnippet?: string;
  context?: string[];
  
  // Source
  plugin?: string;
  rule?: string;
  category?: string;
  
  // Additional info
  documentation?: string;
  examples?: string[];
  references?: string[];
  tags?: string[];
  
  // Confidence
  confidence?: ConfidenceInfo;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Evidence for detection results
export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

// Feedback for learning systems
export interface Feedback {
  helpful: boolean;
  accurate?: boolean;
  comment?: string;
  rating?: number;
  timestamp?: Date;
}

// Fix result from auto-fix operations
export interface FixResult {
  success: boolean;
  modifiedFiles: string[];
  changes?: Array<{
    file: string;
    diff: string;
  }>;
  errors?: string[];
  warnings?: string[];
}

// Backward compatibility aliases
export type TaintQualifier = TaintLevel; // Type alias for backward compatibility