/**
 * Improvement and suggestion types
 */

import { 
  ImprovementType, 
  ImprovementPriority, 
  CodeLocation,
  BaseMetadata 
} from './base-types';

// Improvement suggestion
export interface Improvement {
  // Identification
  id: string;
  
  // Classification
  type: ImprovementType;
  priority: ImprovementPriority;
  category?: string;
  
  // Description
  title: string;
  description: string;
  rationale?: string;
  
  // Location
  location?: CodeLocation;
  affectedFiles?: string[];
  
  // Implementation
  suggestedCode?: string;
  codeSnippet?: string;
  diff?: string;
  
  // Impact assessment
  estimatedImpact?: number; // 0.0-1.0
  qualityImprovement?: {
    before: number;
    after: number;
    dimensions: Partial<Record<string, number>>;
  };
  
  // Effort estimation
  effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
  estimatedTime?: string; // e.g., "2 hours", "1 day"
  complexity?: number; // 1-10
  
  // Automation
  autoFixable?: boolean;
  automationLevel?: 'none' | 'partial' | 'full';
  requiresReview?: boolean;
  
  // Dependencies
  dependencies?: string[]; // IDs of other improvements that should be done first
  conflicts?: string[]; // IDs of improvements that conflict with this one
  
  // Additional context
  examples?: CodeExample[];
  references?: Reference[];
  tags?: string[];
  
  // Metadata
  metadata?: BaseMetadata;
}

// Code example
export interface CodeExample {
  title: string;
  description?: string;
  before: string;
  after: string;
  language?: string;
  framework?: string;
}

// Reference
export interface Reference {
  type: 'documentation' | 'article' | 'video' | 'book' | 'tool' | 'other';
  title: string;
  url?: string;
  author?: string;
  description?: string;
}

// Improvement plan
export interface ImprovementPlan {
  // Identification
  id: string;
  name: string;
  description?: string;
  
  // Improvements
  improvements: Improvement[];
  
  // Grouping
  phases?: ImprovementPhase[];
  categories?: Map<string, Improvement[]>;
  
  // Prioritization
  priorityOrder: string[]; // Improvement IDs in priority order
  criticalPath?: string[]; // IDs of improvements on the critical path
  
  // Estimates
  totalEffort?: string;
  totalImpact?: number;
  estimatedDuration?: string;
  
  // Execution strategy
  strategy?: 'sequential' | 'parallel' | 'mixed';
  maxParallel?: number;
  
  // Progress tracking
  status?: 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  progress?: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    percentage: number;
  };
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  approvedBy?: string;
  metadata?: BaseMetadata;
}

// Improvement phase
export interface ImprovementPhase {
  id: string;
  name: string;
  description?: string;
  improvements: string[]; // Improvement IDs
  order: number;
  duration?: string;
  dependencies?: string[]; // Other phase IDs
  status?: 'pending' | 'in-progress' | 'completed';
}

// Improvement execution result
export interface ImprovementExecutionResult {
  improvementId: string;
  success: boolean;
  
  // Changes made
  modifiedFiles?: string[];
  additions?: number;
  deletions?: number;
  diff?: string;
  
  // Quality impact
  qualityBefore?: number;
  qualityAfter?: number;
  actualImpact?: number;
  
  // Execution details
  executionTime?: number;
  executedAt?: Date;
  executedBy?: string;
  method?: 'manual' | 'automated' | 'assisted';
  
  // Issues encountered
  errors?: string[];
  warnings?: string[];
  rollbackRequired?: boolean;
  rollbackPerformed?: boolean;
  
  // Review
  reviewed?: boolean;
  reviewedBy?: string;
  reviewComments?: string;
  approved?: boolean;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Improvement analytics
export interface ImprovementAnalytics {
  // Summary statistics
  totalImprovements: number;
  completedImprovements: number;
  successRate: number;
  averageImpact: number;
  averageExecutionTime: number;
  
  // By type
  byType: Record<ImprovementType, {
    count: number;
    completed: number;
    averageImpact: number;
    successRate: number;
  }>;
  
  // By priority
  byPriority: Record<ImprovementPriority, {
    count: number;
    completed: number;
    averageTime: number;
  }>;
  
  // By effort
  byEffort: Record<string, {
    count: number;
    completed: number;
    totalTime: number;
  }>;
  
  // Trends
  trends: {
    improvementsPerDay: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    velocityTrend: 'accelerating' | 'stable' | 'decelerating';
  };
  
  // Top improvements
  topImprovements: Array<{
    id: string;
    title: string;
    impact: number;
    effort: string;
  }>;
  
  // Bottlenecks
  bottlenecks?: string[];
  blockers?: string[];
  
  // Forecast
  estimatedCompletion?: Date;
  projectedQuality?: number;
}

// Improvement recommendation engine interface
export interface IImprovementEngine {
  analyze(context: unknown): Promise<Improvement[]>;
  prioritize(improvements: Improvement[]): Improvement[];
  createPlan(improvements: Improvement[]): ImprovementPlan;
  execute(improvement: Improvement): Promise<ImprovementExecutionResult>;
  track(plan: ImprovementPlan): ImprovementAnalytics;
}