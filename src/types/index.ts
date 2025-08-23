/**
 * 統一型定義のエントリーポイント
 * 
 * すべての型定義モジュールを再エクスポート
 * 後方互換性を維持しながら新しい構造へ移行
 */

// 分析関連
export * from './analysis';
export type {
  AnalysisResult,
  BaseAnalysisResult,
  AnalysisResultWithMetadata,
  AnalysisResultWithPlugins,
  AnalysisResultWithParallelStats,
  FileAnalysisResult,
  // 後方互換性エイリアス
  CoreAnalysisResult,
  InterfaceAnalysisResult,
  ParallelAnalysisResult,
  CliAnalysisResult,
  SecurityAnalysisResult
} from './analysis';

// セキュリティ関連
export * from './security';
export type {
  TaintAnalysisResult,
  BaseTaintAnalysisResult,
  TaintAnalysisWithAnnotations,
  TaintAnalysisWithViolations,
  TaintAnalysisWithImprovements,
  TaintAnalysisWithMetrics,
  TaintFlow,
  TaintSeverity,
  TaintSummary,
  SecurityViolation,
  SecurityImprovement,
  ViolationType,
  ImprovementCategory,
  // 後方互換性エイリアス
  SecurityTaintResult,
  AnnotationTaintResult,
  FlowTaintResult,
  TaintResult
} from './security';

// テスト関連
export * from './testing';
export type {
  TestCase,
  BaseTestCase,
  TestCaseWithIO,
  TestCaseWithMetadata,
  TestCaseWithAssertions,
  TestCaseWithQuality,
  PluginTestCase,
  TestSuite,
  TestFile,
  TestStatus,
  TestType,
  Assertion,
  AssertionType,
  // 後方互換性エイリアス
  PluginTest,
  SecurityTestCase,
  ValidationTestCase,
  UnitTestCase,
  IntegrationTestCase
} from './testing';

// AI関連
export * from './ai';
export type {
  AIOptimizedOutput,
  AISummary,
  AIFormattedIssue,
  AIFormattedFile,
  AIContext,
  AIMarkdownOutput,
  AIPromptTemplate,
  AIActionableRisk,
  AIOutputError,
  RiskLevel,
  AIActionType,
  FormattingStrategy,
  CodeContext,
  LocationInfo,
  SuggestedFix,
  ActionStep,
  ImpactEstimation,
  FileAnalysisSection,
  IssueSection,
  TaskSection,
  FormatterOptions
} from './ai';

// ドメイン関連
export * from './domain';
export type {
  DomainContext,
  DomainDictionary,
  DomainTerm,
  DomainEntity,
  DomainEvent,
  DomainService,
  AggregateRoot,
  DomainModel,
  DomainAnalysisResult,
  DomainCategory,
  DomainLayer,
  DomainPattern,
  // 後方互換性エイリアス
  DomainAnalysis,
  DomainTerminology
} from './domain';

// プラグイン関連
export * from './plugins';
export type {
  IPlugin,
  IAnalyzerPlugin,
  IFormatterPlugin,
  IReporterPlugin,
  IValidatorPlugin,
  ISecurityPlugin,
  IPluginManager,
  PluginType,
  PluginStatus,
  PluginPriority,
  PluginMetadata,
  PluginConfig,
  PluginContext,
  PluginResult,
  ValidationResult,
  SecurityIssue,
  Vulnerability,
  // 後方互換性エイリアス
  Plugin,
  AnalyzerPlugin,
  SecurityPlugin
} from './plugins';

// ワーカー関連
export * from './workers';
export type {
  WorkerTask,
  WorkerInfo,
  TaskResult,
  WorkerPoolConfig,
  WorkerPoolStats,
  WorkerPoolEvent,
  IWorkerPool,
  TaskHandler,
  TaskRegistry,
  WorkerStatus,
  TaskStatus,
  TaskPriority,
  // 後方互換性エイリアス
  Task,
  Worker,
  PoolStats
} from './workers';

// 共通型
export * from './shared';
export type {
  DesignPattern,
  AntiPattern,
  PatternAnalysis,
  PatternRecommendation,
  PackageDependency,
  ImportInfo,
  UsageCategory,
  UsageReport,
  VersionConstraint,
  ExecutionEnvironment,
  ProjectMetrics,
  DesignPatternType,
  AntiPatternType,
  // 後方互換性エイリアス
  Pattern,
  Dependency,
  Import
} from './shared';

/**
 * 統一型定義のバージョン情報
 */
export const TYPES_VERSION = '2.0.0';

/**
 * 移行ステータス
 */
export const MIGRATION_STATUS = {
  completed: [
    'AnalysisResult',
    'TaintAnalysisResult',
    'TestCase',
    'AIOptimizedOutput',
    'DomainContext',
    'IPlugin',
    'WorkerTask',
    'DesignPattern'
  ],
  deprecated: [
    'unified-types.ts'
  ],
  version: TYPES_VERSION,
  date: new Date().toISOString()
};