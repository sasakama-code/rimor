/**
 * Analysis result types
 */
import { SeverityLevel, CodeLocation, Evidence, BaseMetadata, Issue } from './base-types';
import { QualityDetails, QualityScore } from './quality-score';
import { ProjectContext } from './project-context';
export interface DetectionResult {
    patternId?: string;
    pattern?: string;
    patternName?: string;
    location?: CodeLocation;
    confidence: number;
    evidence?: Evidence[];
    severity?: SeverityLevel;
    securityRelevance?: number;
    metadata?: Record<string, unknown>;
}
export interface AnalysisOptions {
    includePatterns?: string[];
    excludePatterns?: string[];
    maxDepth?: number;
    followSymlinks?: boolean;
    parallel?: boolean;
    maxConcurrency?: number;
    timeout?: number;
    useCache?: boolean;
    cacheDir?: string;
    cacheTTL?: number;
    verbose?: boolean;
    quiet?: boolean;
    format?: 'json' | 'text' | 'html' | 'markdown';
    outputFile?: string;
    enabledPlugins?: string[];
    disabledPlugins?: string[];
    pluginConfig?: Record<string, unknown>;
    enableSecurityChecks?: boolean;
    securityLevel?: 'low' | 'medium' | 'high' | 'paranoid';
    minQualityScore?: number;
    maxIssues?: number;
    failOnWarnings?: boolean;
    customOptions?: Record<string, unknown>;
}
export interface AnalysisResult {
    filePath: string;
    relativePath?: string;
    issues: Issue[];
    detectionResults?: DetectionResult[];
    metrics?: FileMetrics;
    score?: QualityScore;
    qualityScore?: number;
    qualityDetails?: QualityDetails;
    context?: ProjectContext;
    analysisTime?: number;
    pluginTimings?: Record<string, number>;
    timestamp?: Date;
    analyzerId?: string;
    analyzerVersion?: string;
    metadata?: BaseMetadata;
}
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
export interface AggregatedAnalysisResult {
    totalFiles: number;
    analyzedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    totalIssues: number;
    issuesBySeverity: Record<SeverityLevel, number>;
    issuesByType: Record<string, number>;
    issuesByFile: Record<string, Issue[]>;
    overallQualityScore?: number;
    averageQualityScore?: number;
    qualityDistribution?: Record<string, number>;
    totalAnalysisTime: number;
    averageFileTime: number;
    slowestFiles?: Array<{
        file: string;
        time: number;
    }>;
    pluginPerformance?: Record<string, {
        totalTime: number;
        averageTime: number;
        filesProcessed: number;
    }>;
    fileResults: AnalysisResult[];
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
export interface AnalysisContext {
    file: string;
    content?: string;
    ast?: unknown;
    projectRoot: string;
    projectType?: string;
    framework?: string;
    dependencies?: Map<string, string>;
    devDependencies?: Map<string, string>;
    previousResults?: AnalysisResult;
    previousMetrics?: FileMetrics;
    sharedData?: Map<string, unknown>;
    options: AnalysisOptions;
}
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
export declare function isAnalysisResult(value: unknown): value is AnalysisResult;
//# sourceMappingURL=analysis-result.d.ts.map