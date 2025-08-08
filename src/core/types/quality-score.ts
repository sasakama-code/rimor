/**
 * Quality score and assessment types
 */

import { QualityDimension, BaseMetadata } from './base-types';

// Quality score
export interface QualityScore {
  // Overall score
  overall: number; // 0.0-1.0
  
  // Dimensional scores
  dimensions: Partial<Record<QualityDimension, number>>; // 0.0-1.0 each
  
  // Additional custom dimensions
  customDimensions?: Record<string, number>;
  
  // Confidence in the score
  confidence: number; // 0.0-1.0
  
  // Detailed breakdown
  details?: QualityDetails;
  
  // Historical comparison
  trend?: QualityTrend;
  
  // Benchmarks
  benchmarks?: QualityBenchmarks;
  
  // Metadata
  metadata?: BaseMetadata;
}

// Quality details
export interface QualityDetails {
  // Analysis findings
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  
  // Risk assessment
  risks?: string[];
  opportunities?: string[];
  
  // Specific issues
  criticalIssues?: string[];
  warnings?: string[];
  info?: string[];
  
  // Metrics breakdown
  metrics?: QualityMetrics;
  
  // Evidence
  evidence?: QualityEvidence[];
}

// Quality metrics
export interface QualityMetrics {
  // Test metrics
  testCoverage?: number;
  assertionDensity?: number;
  testComplexity?: number;
  testMaintainability?: number;
  
  // Code metrics
  codeComplexity?: number;
  duplicateCode?: number;
  codeSmells?: number;
  technicalDebt?: number;
  
  // Documentation metrics
  documentationCoverage?: number;
  commentDensity?: number;
  
  // Security metrics
  securityScore?: number;
  vulnerabilities?: number;
  securityHotspots?: number;
  
  // Performance metrics
  performanceScore?: number;
  slowTests?: number;
  memoryLeaks?: number;
  
  // Custom metrics
  customMetrics?: Record<string, number>;
}

// Quality evidence
export interface QualityEvidence {
  type: 'positive' | 'negative' | 'neutral';
  dimension: QualityDimension | string;
  description: string;
  impact: number; // -1.0 to 1.0
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  code?: string;
  suggestion?: string;
}

// Quality trend over time
export interface QualityTrend {
  direction: 'improving' | 'stable' | 'declining';
  change: number; // Percentage change
  changeRate: number; // Rate of change per time unit
  history: QualityHistoryPoint[];
  forecast?: QualityForecast;
}

// Historical quality point
export interface QualityHistoryPoint {
  timestamp: Date;
  overall: number;
  dimensions: Partial<Record<QualityDimension, number>>;
  issueCount?: number;
  metadata?: Record<string, unknown>;
}

// Quality forecast
export interface QualityForecast {
  nextPeriod: number; // Predicted score
  confidence: number; // Confidence in prediction
  factors: string[]; // Factors affecting the forecast
  recommendations: string[]; // Actions to improve forecast
}

// Quality benchmarks
export interface QualityBenchmarks {
  industry?: {
    average: number;
    percentile: number;
    rank?: number;
    totalProjects?: number;
  };
  project?: {
    best: number;
    worst: number;
    average: number;
    median: number;
    standardDeviation: number;
  };
  team?: {
    average: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  customBenchmarks?: Record<string, number>;
}

// Quality grade based on score
export interface QualityGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  label: string;
  description: string;
  color: string;
  recommendations: string[];
}

// Quality report
export interface QualityReport {
  // Identification
  id: string;
  projectId?: string;
  projectName?: string;
  
  // Timing
  timestamp: Date;
  analysisTime: number;
  
  // Scores
  overallScore: QualityScore;
  fileScores?: Map<string, QualityScore>;
  moduleScores?: Map<string, QualityScore>;
  
  // Grade
  grade: QualityGrade;
  
  // Summary
  summary: {
    totalFiles: number;
    analyzedFiles: number;
    averageScore: number;
    highQualityFiles: number;
    lowQualityFiles: number;
    criticalIssues: number;
  };
  
  // Top issues
  topIssues?: Array<{
    type: string;
    count: number;
    severity: string;
    impact: number;
  }>;
  
  // Recommendations
  recommendations: QualityRecommendation[];
  
  // Comparison
  comparison?: {
    previous?: QualityScore;
    baseline?: QualityScore;
    target?: QualityScore;
  };
  
  // Metadata
  metadata?: BaseMetadata;
}

// Quality recommendation
export interface QualityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'quick-win' | 'improvement' | 'refactoring' | 'architectural';
  title: string;
  description: string;
  impact: number; // Expected improvement in score
  effort: 'low' | 'medium' | 'high'; // Implementation effort
  dimension: QualityDimension | string;
  examples?: string[];
  resources?: string[];
  estimatedTime?: string;
}

// Quality configuration
export interface QualityConfig {
  // Weights for dimensions
  dimensionWeights?: Partial<Record<QualityDimension, number>>;
  
  // Thresholds
  thresholds?: {
    minimum?: number;
    target?: number;
    excellent?: number;
  };
  
  // Grading scale
  gradingScale?: Array<{
    grade: string;
    minScore: number;
    maxScore: number;
  }>;
  
  // Rules
  rules?: QualityRule[];
  
  // Custom dimensions
  customDimensions?: Array<{
    name: string;
    weight: number;
    description: string;
  }>;
  
  // Options
  options?: {
    includeHistory?: boolean;
    includeBenchmarks?: boolean;
    includeForecasts?: boolean;
    historicalPeriods?: number;
    benchmarkSource?: string;
  };
}

// Quality rule
export interface QualityRule {
  id: string;
  name: string;
  dimension: QualityDimension | string;
  condition: string; // Expression to evaluate
  impact: number; // Score impact when violated
  severity: 'info' | 'warning' | 'error';
  message: string;
  autoFixable?: boolean;
}