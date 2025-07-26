import { Issue } from '../core/types';

/**
 * Analyzers用の型定義 v0.5.0
 * 高度なコンテキスト分析のための型システム
 */

// 分析オプション
export interface AnalysisOptions {
  includeImports?: boolean;
  includeExports?: boolean;
  analyzeFunctions?: boolean;
  analyzeClasses?: boolean;
  analyzeInterfaces?: boolean;
  analyzeVariables?: boolean;
  analyzeScopes?: boolean;
  detectRelatedFiles?: boolean;
  contextLines?: number;
  maxRelatedFiles?: number;
  includeTests?: boolean;
  includeServices?: boolean;
  analyzeDependencies?: boolean;
  includeTransitiveDeps?: boolean;
  includeSiblings?: boolean;
}

// 拡張されたコードコンテキスト
export interface ExtractedCodeContext {
  // 基本情報
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 周辺コード
  surroundingCode: {
    before: string;
    after: string;
  };
  
  // インポート/エクスポート
  imports: string[];
  exports: string[];
  
  // 構造情報
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  variables: VariableInfo[];
  scopes: ScopeInfo[];
  
  // 関連ファイル
  relatedFiles: RelatedFileInfo[];
  
  // 使用されているAPI/ライブラリ
  usedAPIs: string[];
  
  // メタデータ
  metadata: {
    language: string;
    fileSize: number;
    analysisTime: number;
    confidence: number;
  };
}

// 関数情報
export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  documentation?: string;
  complexity?: number;
  calls: string[]; // 呼び出している関数
  calledBy: string[]; // この関数を呼び出している関数
  variables?: string[]; // 関数内で定義されている変数
}

// クラス情報
export interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: string[];
  properties: string[];
  extends?: string;
  implements: string[];
  isExported: boolean;
  documentation?: string;
}

// インターフェース情報
export interface InterfaceInfo {
  name: string;
  startLine: number;
  endLine: number;
  properties: string[];
  methods: string[];
  extends: string[];
  isExported: boolean;
  documentation?: string;
}

// 変数情報
export interface VariableInfo {
  name: string;
  type?: string;
  scope: string;
  line: number;
  isConst: boolean;
  isExported: boolean;
  usage: VariableUsage[];
}

export interface VariableUsage {
  line: number;
  type: 'read' | 'write' | 'declaration';
  context: string;
}

// スコープ情報
export interface ScopeInfo {
  type: 'global' | 'function' | 'class' | 'block' | 'module';
  startLine: number;
  endLine: number;
  variables: string[];
  parent?: ScopeInfo;
  children: ScopeInfo[];
  functions?: string[];
  level?: number;
  parentScope?: string;
}

// 関連ファイル情報
export interface RelatedFileInfo {
  path: string;
  relationship: 'import' | 'export' | 'test' | 'similar' | 'dependency' | 'sibling';
  confidence: number;
  reason: string;
  size?: number;
  lastModified?: Date;
  language?: string;
  similarity?: number;
  exports?: string[];
  functions?: string[];
}

// 依存関係分析結果
export interface DependencyAnalysis {
  projectDependencies: ProjectDependency[];
  fileDependencies: FileDependency[];
  cyclicDependencies: CyclicDependency[];
  unusedDependencies: string[];
  missingDependencies: string[];
  devDependencies: ProjectDependency[];
  peerDependencies: ProjectDependency[];
}

export interface ProjectDependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  installedVersion?: string;
  description?: string;
  homepage?: string;
  license?: string;
  usage: DependencyUsage[];
}

export interface DependencyUsage {
  file: string;
  imports: string[];
  line: number;
}

export interface FileDependency {
  file: string;
  imports: string[];
  exports: string[];
  dependsOn: string[];
  dependedBy: string[];
}

export interface CyclicDependency {
  files: string[];
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

// プロジェクト構造分析結果
export interface ProjectStructure {
  overview: ProjectOverview;
  directories: DirectoryInfo[];
  architecture: ArchitecturePattern;
  conventions: NamingConventions;
  metrics: ProjectMetrics;
}

export interface ProjectOverview {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  languages: LanguageDistribution[];
  frameworks: DetectedFramework[];
  testingFrameworks: DetectedFramework[];
  buildTools: DetectedFramework[];
}

export interface LanguageDistribution {
  language: string;
  fileCount: number;
  percentage: number;
  extensions: string[];
}

export interface DetectedFramework {
  name: string;
  version?: string;
  confidence: number;
  evidence: string[];
}

export interface DirectoryInfo {
  path: string;
  purpose: DirectoryPurpose;
  fileCount: number;
  subdirectories: string[];
  patterns: string[];
  conventions: string[];
}

export type DirectoryPurpose = 
  | 'source' 
  | 'test' 
  | 'build' 
  | 'config' 
  | 'documentation' 
  | 'assets' 
  | 'vendor' 
  | 'unknown';

export interface ArchitecturePattern {
  type: ArchitectureType;
  confidence: number;
  evidence: string[];
  suggestions: string[];
}

export type ArchitectureType = 
  | 'mvc' 
  | 'mvvm' 
  | 'microservices' 
  | 'layered' 
  | 'clean' 
  | 'hexagonal' 
  | 'modular' 
  | 'monolithic' 
  | 'unknown';

export interface NamingConventions {
  files: FileNamingConvention;
  directories: DirectoryNamingConvention;
  variables: VariableNamingConvention;
  functions: FunctionNamingConvention;
  classes: ClassNamingConvention;
}

export interface FileNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

export interface DirectoryNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

export interface VariableNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

export interface FunctionNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

export interface ClassNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

export type NamingPattern = 
  | 'camelCase' 
  | 'PascalCase' 
  | 'snake_case' 
  | 'kebab-case' 
  | 'SCREAMING_SNAKE_CASE' 
  | 'mixed' 
  | 'unknown';

export interface ProjectMetrics {
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  testability: TestabilityMetrics;
  documentation: DocumentationMetrics;
}

export interface ComplexityMetrics {
  averageCyclomaticComplexity: number;
  maxComplexity: number;
  complexFiles: string[];
  totalFunctions: number;
  averageFunctionLength: number;
}

export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  duplicatedCodePercentage: number;
  averageFileSize: number;
  largeFiles: string[];
  longFunctions: string[];
}

export interface TestabilityMetrics {
  testCoverage: number;
  testableClasses: number;
  untestableClasses: number;
  mockability: number;
}

export interface DocumentationMetrics {
  documentedFunctions: number;
  documentedClasses: number;
  documentationCoverage: number;
  readmeQuality: number;
}

// コンテキスト最適化設定
export interface ContextOptimizationOptions {
  maxContextSize: number;
  prioritizeRelevantCode: boolean;
  includeCallStack: boolean;
  analyzeDataFlow: boolean;
  detectPatterns: boolean;
  generateSuggestions: boolean;
}

// 分析結果のキャッシュ
export interface AnalysisCache {
  fileHash: Map<string, string>;
  contexts: Map<string, any>; // IntegratedContext（循環参照を避けるためany）
  dependencies: Map<string, DependencyAnalysis>;
  structures: Map<string, ProjectStructure>;
  expiry: Date;
}