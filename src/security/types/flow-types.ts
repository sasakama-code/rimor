/**
 * Security Flow Analysis Types
 */

import { 
  TestMethod,
  Position
} from '../../core/types';

import {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  SeverityLevel
} from '../../types/common-types';

// 共通型定義からの再エクスポート
export {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  Position
};

// Extended TestMethod with additional properties for flow analysis
export interface TestMethodExtended extends TestMethod {
  filePath?: string;
  content?: string;
}

// Flow Graph types
export interface FlowGraph {
  nodes: Map<string, FlowNode>;
  edges: FlowEdge[];
  entryNode?: string;
  exitNodes: string[];
  violations?: SecurityViolation[];
  taintSources?: TaintSourceInfo[];
  sanitizers?: SanitizerInfo[];
  securitySinks?: SecuritySinkInfo[];
  paths?: FlowPath[];
}

export interface FlowNode {
  id: string;
  type: 'entry' | 'exit' | 'statement' | 'branch' | 'merge' | 'call' | 'return';
  statement?: TestStatement;
  location?: Position;
  predecessors: string[];
  successors: string[];
  taintState?: TaintState;
  typeState?: TypeState;
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: TaintMetadata;
}

export interface FlowEdge {
  from: string;
  to: string;
  condition?: string;
  type?: 'normal' | 'true' | 'false' | 'exception';
}

export interface FlowPath {
  id?: string;
  nodes: string[];
  edges: FlowEdge[];
  isFeasible: boolean;
  condition?: string;
  taintLevel?: TaintLevel;
  reachesSecuritySink?: boolean;
  passedThroughSanitizer?: boolean;
}

// Test Statement types
export interface TestStatement {
  id: string;
  type: 'assertion' | 'setup' | 'action' | 'teardown' | 'declaration' | 'expression' | 'entry' | 'assignment' | 'methodCall' | 'sanitizer';
  content: string;
  location: Position;
  variables?: string[];
  calls?: MethodCall[];
  actual?: string;
  lhs?: string;
  rhs?: string;
  method?: string;
  returnValue?: string;
  arguments?: string[];
}

export interface MethodCall {
  name: string;
  arguments: string[];
  returnType?: string;
}

// Taint Analysis types
export interface TaintState {
  variables: Map<string, TaintLevel>;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
}

export interface TypeState {
  variables: Map<string, string>;
  constraints: TypeConstraint[];
}

export interface TypeConstraint {
  variable: string;
  type?: string;
  constraint: 'equals' | 'subtype' | 'supertype' | string;
  reason?: string;
}

export interface TaintMetadata {
  level: TaintLevel;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
  propagationPath?: string[];
  location?: Position;
}

// Security Violations
export interface SecurityViolation {
  type: 'taint' | 'type' | 'flow' | 'invariant' | 'unsanitized-taint-flow' | 'missing-sanitizer' | 'unsafe-assertion' | 'sql-injection' | 'xss' | 'command-injection';
  severity: SeverityLevel;
  message: string;
  location?: Position;
  path?: FlowPath;
  fix?: string;
  suggestedFix?: string;
  variable?: string;
  taintLevel?: TaintLevel;
  metadata?: TaintMetadata;
}

// Analysis Results
export interface TaintSourceInfo {
  source: TaintSource;
  location: Position;
  variable: string;
  confidence: number;
}

export interface SanitizerInfo {
  type: SanitizerType;
  location: Position;
  variable: string;
  effectiveness: number;
}

export interface SecuritySinkInfo {
  sink: SecuritySink;
  location: Position;
  variable: string;
  risk: number;
}

export interface AnalysisOptions {
  enableTaintAnalysis?: boolean;
  enableTypeAnalysis?: boolean;
  enableFlowAnalysis?: boolean;
  maxPathLength?: number;
  timeout?: number;
}

export interface TaintPropagationResult {
  tainted: Map<string, TaintLevel>;
  propagationPaths: FlowPath[];
  violations: TaintViolation[];
}

export interface TaintFlowAnalysisResult {
  sources: TaintSourceInfo[];
  sinks: SecuritySinkInfo[];
  sanitizers: SanitizerInfo[];
  flows: TaintFlow[];
  violations: TaintViolation[];
}

export interface TaintFlow {
  source: TaintSourceInfo;
  sink: SecuritySinkInfo;
  path: FlowPath;
  isSanitized: boolean;
  sanitizers?: SanitizerInfo[];
}

export interface TaintViolation {
  source: TaintSourceInfo;
  sink: SecuritySinkInfo;
  path: FlowPath;
  message: string;
  severity: SeverityLevel;
}

export interface ReachabilityAnalysisResult {
  reachableNodes: Set<string>;
  unreachableNodes: Set<string>;
  deadCode: FlowNode[];
}

export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: FlowPath[];
}

export interface TypeFlowAnalysisResult {
  typeStates: Map<string, TypeState>;
  transitions: TypeTransition[];
  violations: TypeViolation[];
}

export interface TypeTransition {
  from: TypeState;
  to: TypeState;
  edge: FlowEdge;
}

export interface TypeViolation {
  location: Position;
  expected?: string;
  actual?: string;
  message: string;
  severity?: 'error' | 'warning';
}

export interface TypeError extends TypeViolation {
  severity: 'error' | 'warning';
}

// Security Test Metrics
export interface SecurityTestMetrics {
  taintCoverage: number;
  sanitizerCoverage: number;
  sinkCoverage: number;
  securityAssertions: number;
  vulnerableFlows: number;
}

// Security Improvements
export interface SecurityImprovement {
  type: 'add-sanitizer' | 'add-validation' | 'add-assertion' | 'fix-flow';
  location: Position;
  description: string;
  suggestedCode?: string;
  impact: 'low' | 'medium' | 'high';
}

// Method Analysis
export interface MethodAnalysisResult {
  method: TestMethod;
  methodName?: string;
  flowGraph: FlowGraph;
  taintAnalysis?: TaintFlowAnalysisResult;
  typeAnalysis?: TypeFlowAnalysisResult;
  violations: SecurityViolation[];
  metrics: SecurityTestMetrics;
  improvements: SecurityImprovement[];
  issues?: SecurityIssue[];
  suggestions?: string[];
}

// Taint Analysis Result
export interface TaintAnalysisResult {
  methods: MethodAnalysisResult[];
  overallMetrics: SecurityTestMetrics;
  violations: SecurityViolation[];
  improvements: SecurityImprovement[];
}

// Type Inference
export interface TypeInferenceResult {
  inferredTypes: Record<string, string>;
  typeConstraints: TypeConstraint[];
  typeErrors: TypeViolation[];
}

// Incremental Analysis
export interface MethodChange {
  method: TestMethod;
  type?: 'added' | 'modified' | 'deleted';
  changeType: 'added' | 'modified' | 'deleted';
  affectedFlows: FlowPath[];
}

export interface IncrementalUpdate {
  changes: MethodChange[];
  affectedMethods: TestMethod[];
  updatedMethods?: MethodAnalysisResult[];
  reanalysisRequired: boolean;
}

// Additional types for InputValidationSecurityPlugin
export interface InputTaintPath {
  source: string;
  sink: string;
  path: string[];
  isCritical: boolean;
  sanitizers: string[];
}

export interface CriticalFlow {
  id: string;
  source: string;
  sink: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface IncrementalChange {
  methodName?: string;
  filePath?: string;
  content?: string;
  type?: 'added' | 'modified' | 'deleted' | 'security';
  method?: {
    name: string;
    content?: string;
    [key: string]: unknown;
  };
}

export interface IncrementalAnalysisResult {
  affectedTests: string[];
  changesProcessed: number;
  qualityImprovement: number;
  newIssuesFound: SecurityIssue[];
  resolvedIssues: SecurityIssue[];
  securityImpact: 'high' | 'medium' | 'low';
}

export interface TestMethodAnalysisResult {
  taintFlow: Omit<FlowGraph, 'sanitizers' | 'taintSources' | 'securitySinks'> & {
    sources?: string[];
    sanitizers?: string[];
    sinks?: string[];
  };
  issues: SecurityIssue[];
  securityScore: number;
  securityMetrics?: {
    inputValidationCoverage: number;
    sanitizationCoverage: number;
  };
  // テストで使用されているプロパティを追加
  affectedTests?: any[];
  qualityImprovement?: number;
  newIssuesFound?: any[];
  resolvedIssues?: any[];
}

// Security Issues
export interface SecurityIssue {
  id: string;
  type: 'taint' | 'injection' | 'validation' | 'authentication' | 'authorization' | 'unsafe-taint-flow' | 'missing-sanitizer' | 'sanitization' | 'boundary';
  severity: SeverityLevel;
  message: string;
  location: Position;
  evidence?: string[];
  recommendation?: string;
  cwe?: string;
  owasp?: string;
  suggestedFix?: string;
  codeSnippet?: string;
  taintInfo?: { // テストで使用されているため追加
    source: TaintSource;
    sink?: string;
    flow?: string[];
  };
}