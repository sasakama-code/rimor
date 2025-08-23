/**
 * Quality score and assessment types
 */
import { QualityDimension, BaseMetadata } from './base-types';
export { QualityDimension } from './base-types';
export interface QualityScore {
    overall: number;
    dimensions: Partial<Record<QualityDimension, number>>;
    customDimensions?: Record<string, number>;
    security?: number;
    coverage?: number;
    maintainability?: number;
    breakdown?: {
        completeness?: number;
        reliability?: number;
        effectiveness?: number;
        maintainability?: number;
        correctness?: number;
    };
    confidence: number;
    details?: QualityDetails;
    trend?: QualityTrend;
    benchmarks?: QualityBenchmarks;
    metadata?: BaseMetadata;
}
export interface QualityDetails {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    risks?: string[];
    opportunities?: string[];
    criticalIssues?: string[];
    warnings?: string[];
    info?: string[];
    metrics?: QualityMetrics;
    evidence?: QualityEvidence[];
    validationCoverage?: number;
    sanitizerCoverage?: number;
    boundaryCoverage?: number;
    sanitizationQuality?: number;
    boundaryTestingScore?: number;
}
export interface QualityMetrics {
    testCoverage?: number;
    assertionDensity?: number;
    testComplexity?: number;
    testMaintainability?: number;
    codeComplexity?: number;
    duplicateCode?: number;
    codeSmells?: number;
    technicalDebt?: number;
    documentationCoverage?: number;
    commentDensity?: number;
    securityScore?: number;
    vulnerabilities?: number;
    securityHotspots?: number;
    performanceScore?: number;
    slowTests?: number;
    memoryLeaks?: number;
    customMetrics?: Record<string, number>;
}
export interface QualityEvidence {
    type: 'positive' | 'negative' | 'neutral';
    dimension: QualityDimension | string;
    description: string;
    impact: number;
    location?: {
        file: string;
        line?: number;
        column?: number;
    };
    code?: string;
    suggestion?: string;
}
export interface QualityTrend {
    direction: 'improving' | 'stable' | 'declining';
    change: number;
    changeRate: number;
    history: QualityHistoryPoint[];
    forecast?: QualityForecast;
}
export interface QualityHistoryPoint {
    timestamp: Date;
    overall: number;
    dimensions: Partial<Record<QualityDimension, number>>;
    issueCount?: number;
    metadata?: Record<string, unknown>;
}
export interface QualityForecast {
    nextPeriod: number;
    confidence: number;
    factors: string[];
    recommendations: string[];
}
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
export interface QualityGrade {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    label: string;
    description: string;
    color: string;
    recommendations: string[];
}
export interface QualityReport {
    id: string;
    projectId?: string;
    projectName?: string;
    timestamp: Date;
    analysisTime: number;
    overallScore: QualityScore;
    fileScores?: Map<string, QualityScore>;
    moduleScores?: Map<string, QualityScore>;
    grade: QualityGrade;
    summary: {
        totalFiles: number;
        analyzedFiles: number;
        averageScore: number;
        highQualityFiles: number;
        lowQualityFiles: number;
        criticalIssues: number;
    };
    topIssues?: Array<{
        type: string;
        count: number;
        severity: string;
        impact: number;
    }>;
    recommendations: QualityRecommendation[];
    comparison?: {
        previous?: QualityScore;
        baseline?: QualityScore;
        target?: QualityScore;
    };
    metadata?: BaseMetadata;
}
export interface QualityRecommendation {
    id: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'quick-win' | 'improvement' | 'refactoring' | 'architectural';
    title: string;
    description: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    dimension: QualityDimension | string;
    examples?: string[];
    resources?: string[];
    estimatedTime?: string;
}
export interface QualityConfig {
    dimensionWeights?: Partial<Record<QualityDimension, number>>;
    thresholds?: {
        minimum?: number;
        target?: number;
        excellent?: number;
    };
    gradingScale?: Array<{
        grade: string;
        minScore: number;
        maxScore: number;
    }>;
    rules?: QualityRule[];
    customDimensions?: Array<{
        name: string;
        weight: number;
        description: string;
    }>;
    options?: {
        includeHistory?: boolean;
        includeBenchmarks?: boolean;
        includeForecasts?: boolean;
        historicalPeriods?: number;
        benchmarkSource?: string;
    };
}
export interface QualityRule {
    id: string;
    name: string;
    dimension: QualityDimension | string;
    condition: string;
    impact: number;
    severity: 'info' | 'warning' | 'error';
    message: string;
    autoFixable?: boolean;
}
export declare function isQualityScore(value: unknown): value is QualityScore;
//# sourceMappingURL=quality-score.d.ts.map