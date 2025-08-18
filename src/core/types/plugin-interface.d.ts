/**
 * Plugin interface definitions
 */
import { Issue, PluginType, BaseMetadata, Feedback, FixResult } from './base-types';
import { ProjectContext, TestFile } from './project-context';
import { DetectionResult, AnalysisContext, AnalysisResult } from './analysis-result';
import { QualityScore } from './quality-score';
import { Improvement } from './improvements';
export interface IPlugin {
    name: string;
    analyze(filePath: string): Promise<Issue[]>;
}
export interface ITestQualityPlugin {
    id: string;
    name: string;
    version: string;
    type: PluginType;
    capabilities?: PluginCapabilities;
    isApplicable(context: ProjectContext): boolean;
    detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
    evaluateQuality(patterns: DetectionResult[]): QualityScore;
    suggestImprovements(evaluation: QualityScore): Improvement[];
    autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
    learn?(feedback: Feedback): void;
    configure?(config: Record<string, unknown>): void;
    validate?(testFile: TestFile): Promise<ValidationResult>;
    initialize?(context: ProjectContext): Promise<void>;
    beforeAnalysis?(context: AnalysisContext): Promise<void>;
    afterAnalysis?(result: AnalysisResult): Promise<void>;
    cleanup?(): Promise<void>;
    metadata?: PluginMetadata;
}
export interface PluginCapabilities {
    languages?: string[];
    frameworks?: string[];
    fileTypes?: string[];
    features?: string[];
    autoFix?: boolean;
    learning?: boolean;
    incremental?: boolean;
    parallel?: boolean;
    streaming?: boolean;
}
export interface PluginMetadata extends BaseMetadata {
    author?: string | {
        name: string;
        email?: string;
        url?: string;
    };
    description?: string;
    documentation?: string;
    homepage?: string;
    repository?: string;
    license?: string;
    keywords?: string[];
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    engines?: {
        node?: string;
        rimor?: string;
    };
    config?: PluginConfig;
}
export interface PluginConfig {
    schema?: ConfigSchema;
    defaults?: Record<string, unknown>;
    validation?: ValidationRule[];
    env?: Record<string, string>;
    features?: Record<string, boolean>;
}
export interface ConfigSchema {
    type: 'object';
    properties: Record<string, SchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
}
export interface SchemaProperty {
    type: string;
    description?: string;
    default?: unknown;
    enum?: unknown[];
    minimum?: number;
    maximum?: number;
    pattern?: string;
    items?: SchemaProperty;
    properties?: Record<string, SchemaProperty>;
    required?: string[];
}
export interface ValidationRule {
    field: string;
    rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
    value?: unknown;
    message: string;
    validator?: (value: unknown) => boolean;
}
export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
    info?: string[];
}
export interface ValidationError {
    field?: string;
    rule?: string;
    message: string;
    location?: {
        file: string;
        line?: number;
        column?: number;
    };
}
export interface ValidationWarning {
    field?: string;
    message: string;
    suggestion?: string;
}
export interface PluginResult {
    pluginId: string;
    pluginName: string;
    pluginVersion?: string;
    detectionResults: DetectionResult[];
    qualityScore: QualityScore;
    improvements: Improvement[];
    validation?: ValidationResult;
    executionTime: number;
    memoryUsage?: number;
    error?: string;
    errors?: string[];
    warnings?: string[];
    metadata?: Record<string, unknown>;
}
export interface IPluginManager {
    register(plugin: IPlugin | ITestQualityPlugin): void;
    unregister(pluginId: string): void;
    discover(directory: string): Promise<void>;
    load(pluginPath: string): Promise<IPlugin | ITestQualityPlugin>;
    execute(context: AnalysisContext): Promise<PluginResult[]>;
    executePlugin(pluginId: string, context: AnalysisContext): Promise<PluginResult>;
    getPlugin(pluginId: string): IPlugin | ITestQualityPlugin | undefined;
    getPlugins(): Array<IPlugin | ITestQualityPlugin>;
    getPluginIds(): string[];
    hasPlugin(pluginId: string): boolean;
    configure(pluginId: string, config: Record<string, unknown>): void;
    getConfig(pluginId: string): Record<string, unknown> | undefined;
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
}
export interface IPluginLoader {
    load(path: string): Promise<IPlugin | ITestQualityPlugin>;
    validate(plugin: unknown): boolean;
    isPluginFile(path: string): boolean;
}
export interface IPluginRegistry {
    register(plugin: IPlugin | ITestQualityPlugin): void;
    unregister(id: string): void;
    get(id: string): IPlugin | ITestQualityPlugin | undefined;
    getAll(): Array<IPlugin | ITestQualityPlugin>;
    has(id: string): boolean;
    clear(): void;
}
export interface IPluginExecutor {
    execute(plugin: IPlugin | ITestQualityPlugin, context: AnalysisContext): Promise<PluginResult>;
    executeAll(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext): Promise<PluginResult[]>;
    executeParallel(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext, maxConcurrency?: number): Promise<PluginResult[]>;
}
export declare function isIPlugin(value: unknown): value is IPlugin;
export declare function isITestQualityPlugin(value: unknown): value is ITestQualityPlugin;
//# sourceMappingURL=plugin-interface.d.ts.map