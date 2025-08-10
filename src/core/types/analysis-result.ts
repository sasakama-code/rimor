/**
 * Analysis result types
 */

import { 
  SeverityLevel, 
  CodeLocation, 
  Evidence, 
  BaseMetadata,
  ConfidenceInfo,
  Issue
} from './base-types';
import { QualityDetails } from './quality-score';

// Pattern detection result
export interface DetectionResult {
  patternId?: string;
  pattern?: string; // Alias for patternId (backward compatibility)
  patternName?: string;
  location?: CodeLocation;
  confidence: number; // 0.0-1.0
  evidence?: Evidence[];
  severity?: SeverityLevel;
  securityRelevance?: number; // 0.0-1.0
  metadata?: Record<string, unknown>;
}

// Analysis options
export interface AnalysisOptions {
  // File patterns
  includePatterns?: string[];
  excludePatterns?: string[];
  
  // Analysis depth
  maxDepth?: number;
  followSymlinks?: boolean;
  
  // Performance options
  parallel?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  
  // Caching
  useCache?: boolean;
  cacheDir?: string;
  cacheTTL?: number;
  
  // Output options
  verbose?: boolean;
  quiet?: boolean;
  format?: 'json' | 'text' | 'html' | 'markdown';
  outputFile?: string;
  
  // Plugin options
  enabledPlugins?: string[];
  disabledPlugins?: string[];
  pluginConfig?: Record<string, unknown>;
  
  // Security options
  enableSecurityChecks?: boolean;
  securityLevel?: 'low' | 'medium' | 'high' | 'paranoid';
  
  // Quality thresholds
  minQualityScore?: number;
  maxIssues?: number;
  failOnWarnings?: boolean;
  
  // Custom options
  customOptions?: Record<string, unknown>;
}

// Analysis result
export interface AnalysisResult {
  // File information
  filePath: string;
  relativePath?: string;
  
  // Results
  issues: Issue[];
  detectionResults?: DetectionResult[];
  
  // Metrics
  metrics?: FileMetrics;
  
  // Quality assessment
  qualityScore?: number;
  qualityDetails?: QualityDetails;
  
  // Performance data
  analysisTime?: number;
  pluginTimings?: Record<string, number>;
  
  // Metadata
  timestamp?: Date;
  analyzerId?: string;
  analyzerVersion?: string;
  metadata?: BaseMetadata;
}

// File metrics
export interface FileMetrics {
  lines: number;
  statements?: number;
  functions?: number;
  classes?: number;
  complexity?: number;
  testCount?: number;
  assertionCount?: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  dependencies?: number;
  maintainabilityIndex?: number;
}



// Aggregated analysis results
export interface AggregatedAnalysisResult {
  // Summary
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  
  // Issues
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  issuesByType: Record<string, number>;
  issuesByFile: Record<string, Issue[]>;
  
  // Quality
  overallQualityScore?: number;
  averageQualityScore?: number;
  qualityDistribution?: Record<string, number>;
  
  // Performance
  totalAnalysisTime: number;
  averageFileTime: number;
  slowestFiles?: Array<{ file: string; time: number }>;
  
  // Plugin performance
  pluginPerformance?: Record<string, {
    totalTime: number;
    averageTime: number;
    filesProcessed: number;
  }>;
  
  // File results
  fileResults: AnalysisResult[];
  
  // Metadata
  startTime: Date;
  endTime: Date;
  configuration?: AnalysisOptions;
  environment?: {
    nodeVersion: string;
    platform: string;
    cpus: number;
    memory: number;
  };
}

// Analysis context for plugins
export interface AnalysisContext {
  // Current file
  file: string;
  content?: string;
  ast?: unknown; // Will be properly typed when AST types are defined
  
  // Project context
  projectRoot: string;
  projectType?: string;
  framework?: string;
  
  // Dependencies
  dependencies?: Map<string, string>;
  devDependencies?: Map<string, string>;
  
  // Previous results (for incremental analysis)
  previousResults?: AnalysisResult;
  previousMetrics?: FileMetrics;
  
  // Shared data between plugins
  sharedData?: Map<string, unknown>;
  
  // Options
  options: AnalysisOptions;
}

// Analysis session
export interface AnalysisSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: {
    current: number;
    total: number;
    percentage: number;
    currentFile?: string;
  };
  results?: AggregatedAnalysisResult;
  errors?: Error[];
  warnings?: string[];
  logs?: string[];
  metadata?: BaseMetadata;
}

// Type guard for AnalysisResult
export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as any;
  
  // Check required fields
  if (typeof result.projectRoot !== 'string') return false;
  // timestamp can be Date or string
  if (!(result.timestamp instanceof Date) && typeof result.timestamp !== 'string') return false;
  if (!Array.isArray(result.results)) return false;
  
  // Check summary
  if (!result.summary || typeof result.summary !== 'object') return false;
  const summary = result.summary;
  if (typeof summary.totalFiles !== 'number') return false;
  if (typeof summary.filesWithIssues !== 'number') return false;
  if (typeof summary.totalIssues !== 'number') return false;
  
  return true;
}