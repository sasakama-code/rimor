/**
 * Improvement and suggestion types
 */
import { ImprovementType, ImprovementPriority, CodeLocation, BaseMetadata } from './base-types';
export interface Improvement {
    id: string;
    type: ImprovementType;
    priority: ImprovementPriority;
    category?: string;
    title: string;
    description: string;
    rationale?: string;
    location?: CodeLocation;
    affectedFiles?: string[];
    suggestedCode?: string;
    codeSnippet?: string;
    diff?: string;
    estimatedImpact?: number;
    impact?: number | {
        scoreImprovement: number;
        effortMinutes: number;
    };
    qualityImprovement?: {
        before: number;
        after: number;
        dimensions: Partial<Record<string, number>>;
    };
    effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
    estimatedTime?: string;
    complexity?: number;
    autoFixable?: boolean;
    automatable?: boolean;
    automationLevel?: 'none' | 'partial' | 'full';
    requiresReview?: boolean;
    dependencies?: string[];
    conflicts?: string[];
    examples?: CodeExample[];
    references?: Reference[];
    tags?: string[];
    suggestions?: string[];
    codeExample?: string;
    metadata?: BaseMetadata;
}
export interface CodeExample {
    title: string;
    description?: string;
    before: string;
    after: string;
    language?: string;
    framework?: string;
}
export interface Reference {
    type: 'documentation' | 'article' | 'video' | 'book' | 'tool' | 'other';
    title: string;
    url?: string;
    author?: string;
    description?: string;
}
export interface ImprovementPlan {
    id: string;
    name: string;
    description?: string;
    improvements: Improvement[];
    phases?: ImprovementPhase[];
    categories?: Map<string, Improvement[]>;
    priorityOrder: string[];
    criticalPath?: string[];
    totalEffort?: string;
    totalImpact?: number;
    estimatedDuration?: string;
    strategy?: 'sequential' | 'parallel' | 'mixed';
    maxParallel?: number;
    status?: 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
    progress?: {
        total: number;
        completed: number;
        inProgress: number;
        pending: number;
        percentage: number;
    };
    createdAt?: Date;
    updatedAt?: Date;
    approvedBy?: string;
    metadata?: BaseMetadata;
}
export interface ImprovementPhase {
    id: string;
    name: string;
    description?: string;
    improvements: string[];
    order: number;
    duration?: string;
    dependencies?: string[];
    status?: 'pending' | 'in-progress' | 'completed';
}
export interface ImprovementExecutionResult {
    improvementId: string;
    success: boolean;
    modifiedFiles?: string[];
    additions?: number;
    deletions?: number;
    diff?: string;
    qualityBefore?: number;
    qualityAfter?: number;
    actualImpact?: number;
    executionTime?: number;
    executedAt?: Date;
    executedBy?: string;
    method?: 'manual' | 'automated' | 'assisted';
    errors?: string[];
    warnings?: string[];
    rollbackRequired?: boolean;
    rollbackPerformed?: boolean;
    reviewed?: boolean;
    reviewedBy?: string;
    reviewComments?: string;
    approved?: boolean;
    metadata?: Record<string, unknown>;
}
export interface ImprovementAnalytics {
    totalImprovements: number;
    completedImprovements: number;
    successRate: number;
    averageImpact: number;
    averageExecutionTime: number;
    byType: Record<ImprovementType, {
        count: number;
        completed: number;
        averageImpact: number;
        successRate: number;
    }>;
    byPriority: Record<ImprovementPriority, {
        count: number;
        completed: number;
        averageTime: number;
    }>;
    byEffort: Record<string, {
        count: number;
        completed: number;
        totalTime: number;
    }>;
    trends: {
        improvementsPerDay: number;
        qualityTrend: 'improving' | 'stable' | 'declining';
        velocityTrend: 'accelerating' | 'stable' | 'decelerating';
    };
    topImprovements: Array<{
        id: string;
        title: string;
        impact: number;
        effort: string;
    }>;
    bottlenecks?: string[];
    blockers?: string[];
    estimatedCompletion?: Date;
    projectedQuality?: number;
}
export interface IImprovementEngine {
    analyze(context: unknown): Promise<Improvement[]>;
    prioritize(improvements: Improvement[]): Improvement[];
    createPlan(improvements: Improvement[]): ImprovementPlan;
    execute(improvement: Improvement): Promise<ImprovementExecutionResult>;
    track(plan: ImprovementPlan): ImprovementAnalytics;
}
//# sourceMappingURL=improvements.d.ts.map