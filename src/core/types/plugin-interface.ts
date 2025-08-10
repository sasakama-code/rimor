/**
 * Plugin interface definitions
 */

import { Issue, PluginType, BaseMetadata, Feedback, FixResult } from './base-types';
import { ProjectContext, TestFile } from './project-context';
import { DetectionResult, AnalysisContext, AnalysisResult } from './analysis-result';
import { QualityScore } from './quality-score';
import { Improvement } from './improvements';

// Simple plugin interface (backward compatibility)
export interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}

// Advanced test quality plugin interface
export interface ITestQualityPlugin {
  // Plugin identification
  id: string;
  name: string;
  version: string;
  type: PluginType;
  
  // Plugin capabilities
  capabilities?: PluginCapabilities;
  
  // Plugin applicability
  isApplicable(context: ProjectContext): boolean;
  
  // Main functionality
  detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  evaluateQuality(patterns: DetectionResult[]): QualityScore;
  suggestImprovements(evaluation: QualityScore): Improvement[];
  
  // Optional functionality
  autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
  learn?(feedback: Feedback): void;
  configure?(config: Record<string, unknown>): void;
  validate?(testFile: TestFile): Promise<ValidationResult>;
  
  // Lifecycle hooks
  initialize?(context: ProjectContext): Promise<void>;
  beforeAnalysis?(context: AnalysisContext): Promise<void>;
  afterAnalysis?(result: AnalysisResult): Promise<void>;
  cleanup?(): Promise<void>;
  
  // Metadata
  metadata?: PluginMetadata;
}

// Plugin capabilities
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

// Plugin metadata
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

// Plugin configuration
export interface PluginConfig {
  // Configuration schema
  schema?: ConfigSchema;
  
  // Default values
  defaults?: Record<string, unknown>;
  
  // Validation rules
  validation?: ValidationRule[];
  
  // Environment variables
  env?: Record<string, string>;
  
  // Feature flags
  features?: Record<string, boolean>;
}

// Configuration schema
export interface ConfigSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

// Schema property
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

// Validation rule
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  info?: string[];
}

// Validation error
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

// Validation warning
export interface ValidationWarning {
  field?: string;
  message: string;
  suggestion?: string;
}

// Plugin result
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  pluginVersion?: string;
  
  // Results
  detectionResults: DetectionResult[];
  qualityScore: QualityScore;
  improvements: Improvement[];
  
  // Validation
  validation?: ValidationResult;
  
  // Performance
  executionTime: number;
  memoryUsage?: number;
  
  // Errors and warnings
  error?: string;
  errors?: string[];
  warnings?: string[];
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Plugin manager interface
export interface IPluginManager {
  // Plugin registration
  register(plugin: IPlugin | ITestQualityPlugin): void;
  unregister(pluginId: string): void;
  
  // Plugin discovery
  discover(directory: string): Promise<void>;
  load(pluginPath: string): Promise<IPlugin | ITestQualityPlugin>;
  
  // Plugin execution
  execute(context: AnalysisContext): Promise<PluginResult[]>;
  executePlugin(pluginId: string, context: AnalysisContext): Promise<PluginResult>;
  
  // Plugin management
  getPlugin(pluginId: string): IPlugin | ITestQualityPlugin | undefined;
  getPlugins(): Array<IPlugin | ITestQualityPlugin>;
  getPluginIds(): string[];
  hasPlugin(pluginId: string): boolean;
  
  // Configuration
  configure(pluginId: string, config: Record<string, unknown>): void;
  getConfig(pluginId: string): Record<string, unknown> | undefined;
  
  // Lifecycle
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

// Plugin loader interface
export interface IPluginLoader {
  load(path: string): Promise<IPlugin | ITestQualityPlugin>;
  validate(plugin: unknown): boolean;
  isPluginFile(path: string): boolean;
}

// Plugin registry interface
export interface IPluginRegistry {
  register(plugin: IPlugin | ITestQualityPlugin): void;
  unregister(id: string): void;
  get(id: string): IPlugin | ITestQualityPlugin | undefined;
  getAll(): Array<IPlugin | ITestQualityPlugin>;
  has(id: string): boolean;
  clear(): void;
}

// Plugin executor interface
export interface IPluginExecutor {
  execute(plugin: IPlugin | ITestQualityPlugin, context: AnalysisContext): Promise<PluginResult>;
  executeAll(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext): Promise<PluginResult[]>;
  executeParallel(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext, maxConcurrency?: number): Promise<PluginResult[]>;
}

// Type guards for plugins
export function isIPlugin(value: unknown): value is IPlugin {
  if (!value || typeof value !== 'object') return false;
  const plugin = value as any;
  return typeof plugin.name === 'string' && 
         typeof plugin.analyze === 'function';
}

export function isITestQualityPlugin(value: unknown): value is ITestQualityPlugin {
  if (!value || typeof value !== 'object') return false;
  const plugin = value as any;
  return typeof plugin.id === 'string' &&
         typeof plugin.name === 'string' &&
         typeof plugin.version === 'string' &&
         typeof plugin.type === 'string' &&
         typeof plugin.isApplicable === 'function' &&
         typeof plugin.detectPatterns === 'function' &&
         typeof plugin.evaluateQuality === 'function' &&
         typeof plugin.suggestImprovements === 'function';
}