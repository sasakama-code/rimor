/**
 * 統一型定義ファイル
 * 自動生成: 2025-08-16T16:46:34.070Z
 */

// 注意: FormattingStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/adapter.ts
export type FormattingStrategy = any;

// 注意: AISummaryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AISummary {
  totalIssues: number;
  totalFiles: number;
  overallScore: number;
  severityDistribution: Record<IssueSeverity, number>;
  categoryDistribution: Record<IssueCategory, number>;
  topIssues: Array<{
    category: IssueCategory;
    severity: IssueSeverity;
    count: number;
    message: string;
  }>;
  keyFindings: string[];
}

// 注意: AIFormattedIssueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIFormattedIssue {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  impact: 'high' | 'medium' | 'low';
  codeSnippet?: string;
}

// 注意: AIFormattedFileは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIFormattedFile {
  path: string;
  issueCount: number;
  issues: AIFormattedIssue[];
  score: number;
}

// 注意: AIContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIContext {
  projectType: string;
  framework: string;
  testFramework: string;
  languages: string[];
  dependencies: Record<string, string> | string[];
  configuration: {
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
    hasJest: boolean;
  };
}

// 注意: AIOptimizedOutputは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIOptimizedOutput {
  version: string;
  format: "ai-optimized";
  metadata: {
    projectType: string;
    language: string;
    testFramework: string;
    timestamp: string;
    rimVersion: string;
  };
  
  context: {
    rootPath: string;
    configFiles: Record<string, string>; // ファイル名: 内容
    dependencies: Record<string, string>; // パッケージ名: バージョン
    projectStructure: string; // ディレクトリ構造の簡潔な表現
  };
  
  qualityOverview: {
    projectScore: number;
    projectGrade: string;
    criticalIssues: number;
    totalIssues: number;
  };
  
  files: Array<{
    path: string;
    language: string;
    score: number;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      location: LocationInfo;
      description: string;
      context: CodeContext;
      fix: SuggestedFix;
    }>;
  }>;
  
  actionableTasks: Array<{
    id: string;
    priority: number;
    type: string;
    description: string;
    automatable: boolean;
    estimatedImpact: ImpactEstimation;
    steps: ActionStep[];
  }>;
  
  instructions: {
    forHuman: string;
    forAI: string;
  };
}

// 注意: CodeContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface CodeContext {
  // 問題のあるコード
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 関連するソースコード（テスト対象）
  relatedSource?: {
    path: string;
    content: string;
    relevantSection?: {
      startLine: number;
      endLine: number;
    };
  };
  
  // 周辺のコンテキスト
  surroundingCode: {
    before: string; // 前10行
    after: string;  // 後10行
  };
  
  // インポート文
  imports: string[];
  
  // 使用されている主要なAPI/関数
  usedAPIs: string[];
}

// 注意: LocationInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface LocationInfo {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

// 注意: SuggestedFixは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface SuggestedFix {
  type: 'add' | 'replace' | 'remove' | 'refactor';
  targetLocation: {
    file: string;
    startLine: number;
    endLine: number;
  };
  code: {
    template: string; // 修正コードのテンプレート
    placeholders?: Record<string, string>; // 置換が必要な部分
  };
  explanation: string;
  confidence: number; // 0.0-1.0
  dependencies?: string[]; // 必要な追加インポート等
}

// 注意: ActionStepは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface ActionStep {
  order: number;
  action: string;
  target: string;
  code?: string;
  explanation: string;
  automated: boolean;
}

// 注意: ImpactEstimationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface ImpactEstimation {
  scoreImprovement: number;
  issuesResolved: number;
  effortMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// 注意: AIMarkdownOutputは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIMarkdownOutput {
  header: string;
  projectContext: string;
  criticalIssuesSummary: string;
  fileAnalysis: FileAnalysisSection[];
  automatedTasks: TaskSection[];
  instructions: string;
}

// 注意: FileAnalysisSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface FileAnalysisSection {
  fileName: string;
  score: string;
  issues: IssueSection[];
}

// 注意: IssueSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface IssueSection {
  id: string;
  title: string;
  severity: string;
  location: string;
  currentCode: string;
  relatedSourceCode?: string;
  suggestedFix: string;
}

// 注意: TaskSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface TaskSection {
  id: string;
  title: string;
  priority: string;
  automatable: boolean;
  impact: string;
  steps: string[];
}

// 注意: AIPromptTemplateは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIPromptTemplate {
  // 汎用修正プロンプト
  genericFix: string;
  
  // 問題タイプ別プロンプト
  byIssueType: {
    [issueType: string]: string;
  };
  
  // フレームワーク別プロンプト
  byFramework: {
    [framework: string]: string;
  };
  
  // バッチ処理用プロンプト
  batchFix: string;
}

// 注意: FormatterOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface FormatterOptions {
  format: 'json' | 'markdown';
  maxTokens?: number;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  maxFileSize?: number;
  optimizeForAI?: boolean;
}

// 注意: EnhancedAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface EnhancedAnalysisResult {
  issues: Issue[];
  totalFiles: number;
  executionTime: number;
  projectScore?: ProjectScore;
  fileScores?: FileScore[];
  projectContext?: ProjectContext;
  
  // AI向け拡張情報
  aiContext?: {
    codeContext: Map<string, CodeContext>;
    suggestedFixes: Map<string, SuggestedFix[]>;
    actionableTasks: ActionStep[];
  };
}

// 注意: AIJsonOutputは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIJsonOutput {
  // AIが最初に読むべき全体状況と最重要問題点
  overallAssessment: string;
  
  // 対処すべき問題の優先順位付きリスト
  keyRisks: Array<{
    // 問題点の簡潔な自然言語での説明
    problem: string;
    
    // リスクレベル
    riskLevel: string;
    
    // 修正に必要な最小限のコードスニペットと行番号
    context: {
      filePath: string;
      codeSnippet: string;
      startLine: number;
      endLine: number;
    };
    
    // AIが次にとるべき具体的なアクション
    suggestedAction: {
      type: string; // ADD_ASSERTION, SANITIZE_VARIABLE, etc.
      description: string;
      example?: string; // 具体的なコード例
    };
  }>;
  
  // 人間が確認するための詳細なHTMLレポートへのリンク
  fullReportUrl: string;
}

// 注意: RiskLevelは6箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

// 注意: AIActionTypeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export type AIActionType = 'ADD_ASSERTION' | 'SANITIZE_VARIABLE' | 'REFACTOR_COMPLEX_CODE' | 'ADD_MISSING_TEST';

// 注意: ScoreBreakdownは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface ScoreBreakdown {
  label: string;        // 例: "クリティカルリスク", "Unsafe Taint Flow"
  calculation: string;  // 例: "-5点 x 21件"
  deduction: number;    // 例: -105
}

// 注意: ReportDimensionは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface ReportDimension {
  name: string;         // 例: "テスト意図実現度", "セキュリティリスク"
  score: number;        // 100点満点のスコア
  weight: number;       // 総合スコアへの寄与度 (0.0 ~ 1.0)
  impact: number;       // 総合スコアへの実際の影響点 (score * weight)
  breakdown: ScoreBreakdown[];
}

// 注意: ExecutiveSummaryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface ExecutiveSummary {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: ReportDimension[];
  statistics: {
    totalFiles: number;
    totalTests: number;
    totalIssues?: number; // 後方互換性のためオプショナル
    riskCounts: Record<RiskLevel, number>; // { CRITICAL: 5, HIGH: 12, ... }
  };
}

// 注意: DetailedIssueは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface DetailedIssue {
  filePath: string;
  startLine: number;
  endLine: number;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  type?: string;
  severity?: string;
  message?: string;
  category?: string;
  contextSnippet?: string; 
}

// 注意: AIActionableRiskは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIActionableRisk {
  id?: string; // 後方互換性のためオプショナル（riskIdと同じ値）
  riskId: string; // 安定した一意のID
  filePath: string;
  riskLevel: RiskLevel;
  title: string;
  problem: string; // AI向けの問題説明
  context: {
    codeSnippet: string;
    startLine: number;
    endLine: number;
  };
  suggestedAction: {
    type: AIActionType;
    description: string;
    example?: string; // 具体的なコード例
  };
}

// 注意: UnifiedAnalysisResultは6箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface UnifiedAnalysisResult {
  schemaVersion: "1.0";
  summary: ExecutiveSummary;
  detailedIssues: DetailedIssue[]; // 人間向けレポート用の全問題リスト
  aiKeyRisks: AIActionableRisk[];  // AI向けの優先順位付き問題リスト
}

// 注意: UnifiedAIFormatterOptionsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface UnifiedAIFormatterOptions {
  // レポートの出力先パス
  reportPath?: string;
  
  // 最大リスク数（デフォルト: 10）
  maxRisks?: number;
  
  // 含めるリスクレベル
  includeRiskLevels?: string[];
  
  // 実際のHTMLレポートパス (Issue #58)
  htmlReportPath?: string;
}

// 注意: AIOutputErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/types.ts
export interface AIOutputError extends Error {
  code: 'CONTEXT_EXTRACTION_FAILED' | 'FORMAT_GENERATION_FAILED' | 'SIZE_LIMIT_EXCEEDED' | 'TOKEN_LIMIT_EXCEEDED';
  details?: any;
}

// 注意: RiskAssessmentは7箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter-base.ts
export interface RiskAssessment {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  problem?: string;
  impact: string;
  likelihood: number;
  mitigation?: string;
}

// 注意: UnifiedAIOutputは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter-base.ts
export interface UnifiedAIOutput {
  keyRisks: RiskAssessment[];
  recommendations?: string[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  };
  context?: any;
}

// 注意: FormatterStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/ai-output/unified-ai-formatter.ts
interface FormatterStrategy {
  name: string;
  format(result: any, options?: any): any;
  formatAsync?(result: any, options?: any): Promise<any>;
}

// 注意: ImportLocationは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
export interface ImportLocation {
  file: string;
  line: number;
  column?: number;
}

// 注意: ImportDepthResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
export interface ImportDepthResult {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    path: string;
    depth: number;
  }>;
}

// 注意: UsageCategoryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
export interface UsageCategory {
  core: string[];
  peripheral: string[];
  unused: string[];
}

// 注意: UsageReportは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/UsageAnalyzer.ts
export interface UsageReport {
  summary: {
    totalPackages: number;
    usedPackages: number;
    unusedPackages: number;
  };
  frequency: Map<string, number>;
  categories: UsageCategory;
  recommendations: string[];
}

// 注意: PackageAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/package-analyzer.ts
export interface PackageAnalysisResult {
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  allDependencies: string[];
}

// 注意: VersionConstraintResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/package-analyzer.ts
export interface VersionConstraintResult {
  package: string;
  constraint: string;
  type: 'exact' | 'caret' | 'tilde' | 'range' | 'any';
  isRisky: boolean;
}

// 注意: ImportDepthAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-analysis/usage-analyzer.ts
export interface ImportDepthAnalysis {
  maxDepth: number;
  averageDepth: number;
  deepImports: Array<{
    file: string;
    depth: number;
  }>;
}

// 注意: VersionConstraintは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface VersionConstraint {
  package: string;
  declaredVersion: string;
  installedVersion?: string;
  constraint: 'exact' | 'range' | 'caret' | 'tilde' | 'wildcard';
  hasVulnerability?: boolean;
  suggestion?: string;
}

// 注意: PackageLockDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface PackageLockDependency {
  version: string;
  resolved?: string;
  integrity?: string;
  dev?: boolean;
  requires?: Record<string, string>;
  dependencies?: Record<string, PackageLockDependency>;
}

// 注意: PackageLockJsonは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface PackageLockJson {
  name?: string;
  version?: string;
  lockfileVersion?: number;
  requires?: boolean;
  packages?: Record<string, PackageLockDependency>;
  dependencies?: Record<string, PackageLockDependency>;
}

// 注意: YarnLockEntryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface YarnLockEntry {
  version: string;
  resolved?: string;
  integrity?: string;
  dependencies?: Record<string, string>;
}

// 注意: NpmShrinkwrapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface NpmShrinkwrap extends PackageLockJson {
  // npm-shrinkwrapはpackage-lock.jsonと同じ構造
}

// 注意: ExtendedPackageJsonは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface ExtendedPackageJson extends PackageJsonConfig {
  // 追加フィールドがある場合はここに定義
}

// 注意: DependencyVersionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface DependencyVersion {
  current: string;
  wanted?: string;
  latest?: string;
  location?: string;
  type?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
}

// 注意: DependencyUsageInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/dependency-types.ts
export interface DependencyUsageInfo {
  package: string;
  usedIn: string[];
  importCount: number;
  isDev: boolean;
  isOptional: boolean;
}

// 注意: AntiPatternは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/PatternDetector.ts
export interface AntiPattern {
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  recommendation: string;
  message?: string;
}

// 注意: DesignPatternは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/PatternDetector.ts
export interface DesignPattern {
  name: string;
  type: string;
  confidence: number;
  location: string;
}

// 注意: PatternAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
export interface PatternAnalysis {
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  score: number;
}

// 注意: PatternRecommendationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
export interface PatternRecommendation {
  pattern: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  estimatedEffort?: string;
}

// 注意: PatternReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/structure-analysis/pattern-detector.ts
export interface PatternReport {
  summary: {
    totalDesignPatterns: number;
    totalAntiPatterns: number;
    overallScore: number;
    grade: string;
  };
  designPatterns: DesignPattern[];
  antiPatterns: AntiPattern[];
  recommendations: PatternRecommendation[];
  metrics: {
    patternDiversity: number;
    antiPatternSeverity: number;
  };
}

// 注意: AnalysisOptionsは8箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: ExtractedCodeContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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
  imports: Array<{ source: string }>;
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
  
  // 言語
  language: string;
  
  // 依存関係
  dependencies: {
    dependencies: string[];
    dependents: string[];
  };
  
  // メタデータ
  metadata: {
    language: string;
    fileSize: number;
    analysisTime: number;
    confidence: number;
  };
}

// 注意: FunctionInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: ClassInfoは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: InterfaceInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: VariableInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface VariableInfo {
  name: string;
  type?: string;
  scope: string;
  line: number;
  isConst: boolean;
  isExported: boolean;
  usage: VariableUsage[];
  kind?: 'const' | 'let' | 'var';
}

// 注意: VariableUsageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface VariableUsage {
  line: number;
  type: 'read' | 'write' | 'declaration';
  context: string;
}

// 注意: ScopeInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: RelatedFileInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: DependencyAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface DependencyAnalysis {
  projectDependencies: ProjectDependency[];
  fileDependencies: FileDependency[];
  cyclicDependencies: CyclicDependency[];
  unusedDependencies: string[];
  missingDependencies: string[];
  devDependencies: ProjectDependency[];
  peerDependencies: ProjectDependency[];
}

// 注意: ProjectDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: DependencyUsageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface DependencyUsage {
  file: string;
  imports: string[];
  line: number;
}

// 注意: FileDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface FileDependency {
  file: string;
  imports: string[];
  exports: string[];
  dependsOn: string[];
  dependedBy: string[];
}

// 注意: CyclicDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface CyclicDependency {
  files: string[];
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

// 注意: ProjectStructureは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ProjectStructure {
  overview: ProjectOverview;
  directories: DirectoryInfo[];
  architecture: ArchitecturePattern;
  conventions: NamingConventions;
  metrics: ProjectMetrics;
}

// 注意: ProjectOverviewは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ProjectOverview {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  languages: LanguageDistribution[];
  frameworks: DetectedFramework[];
  testingFrameworks: DetectedFramework[];
  buildTools: DetectedFramework[];
}

// 注意: LanguageDistributionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface LanguageDistribution {
  language: string;
  fileCount: number;
  percentage: number;
  extensions: string[];
}

// 注意: DetectedFrameworkは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface DetectedFramework {
  name: string;
  version?: string;
  confidence: number;
  evidence: string[];
}

// 注意: DirectoryInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface DirectoryInfo {
  path: string;
  purpose: DirectoryPurpose;
  fileCount: number;
  subdirectories: string[];
  patterns: string[];
  conventions: string[];
}

// 注意: DirectoryPurposeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export type DirectoryPurpose = 
  | 'source' 
  | 'test' 
  | 'build' 
  | 'config' 
  | 'documentation' 
  | 'assets' 
  | 'vendor' 
  | 'unknown';

// 注意: ArchitecturePatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ArchitecturePattern {
  type: ArchitectureType;
  confidence: number;
  evidence: string[];
  suggestions: string[];
}

// 注意: ArchitectureTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
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

// 注意: NamingConventionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface NamingConventions {
  files: FileNamingConvention;
  directories: DirectoryNamingConvention;
  variables: VariableNamingConvention;
  functions: FunctionNamingConvention;
  classes: ClassNamingConvention;
}

// 注意: FileNamingConventionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface FileNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

// 注意: DirectoryNamingConventionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface DirectoryNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

// 注意: VariableNamingConventionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface VariableNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

// 注意: FunctionNamingConventionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface FunctionNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

// 注意: ClassNamingConventionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ClassNamingConvention {
  pattern: NamingPattern;
  confidence: number;
  examples: string[];
  violations: string[];
}

// 注意: NamingPatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export type NamingPattern = 
  | 'camelCase' 
  | 'PascalCase' 
  | 'snake_case' 
  | 'kebab-case' 
  | 'SCREAMING_SNAKE_CASE' 
  | 'mixed' 
  | 'unknown';

// 注意: ProjectMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ProjectMetrics {
  complexity: ComplexityMetrics;
  maintainability: MaintainabilityMetrics;
  testability: TestabilityMetrics;
  documentation: DocumentationMetrics;
}

// 注意: ComplexityMetricsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ComplexityMetrics {
  averageCyclomaticComplexity: number;
  maxComplexity: number;
  complexFiles: string[];
  totalFunctions: number;
  averageFunctionLength: number;
}

// 注意: MaintainabilityMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface MaintainabilityMetrics {
  maintainabilityIndex: number;
  duplicatedCodePercentage: number;
  averageFileSize: number;
  largeFiles: string[];
  longFunctions: string[];
}

// 注意: TestabilityMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface TestabilityMetrics {
  testCoverage: number;
  testableClasses: number;
  untestableClasses: number;
  mockability: number;
}

// 注意: DocumentationMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface DocumentationMetrics {
  documentedFunctions: number;
  documentedClasses: number;
  documentationCoverage: number;
  readmeQuality: number;
}

// 注意: ContextOptimizationOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface ContextOptimizationOptions {
  maxContextSize: number;
  prioritizeRelevantCode: boolean;
  includeCallStack: boolean;
  analyzeDataFlow: boolean;
  detectPatterns: boolean;
  generateSuggestions: boolean;
}

// 注意: AnalysisCacheは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/analyzers/types.ts
export interface AnalysisCache {
  fileHash: Map<string, string>;
  contexts: Map<string, unknown>; // IntegratedContext（循環参照を避けるためunknown）
  dependencies: Map<string, DependencyAnalysis>;
  structures: Map<string, ProjectStructure>;
  expiry: Date;
}

// 注意: AnalysisResultは9箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/ai-output-types.ts
export interface AnalysisResult {
  files?: Array<{
    path: string;
    issues: Issue[];
  }>;
  issues?: Issue[];
  totalIssues?: number;
  summary?: {
    totalFiles: number;
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
  };
}

// 注意: PluginResultは6箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/ai-output-types.ts
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  issues: Issue[];
  score?: number;
}

// 注意: AIOutputOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/ai-output.ts
export interface AIOutputOptions {
  path: string;
  format?: 'json' | 'markdown';
  output?: string;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  optimizeForAI?: boolean;
  maxTokens?: number;
  maxFileSize?: number;
  verbose?: boolean;
  // 既存のanalyzer設定
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
}

// 注意: AIRiskは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface AIRisk {
  problem: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  context: AIRiskContext;
  suggestedAction: AISuggestedAction;
}

// 注意: AIRiskContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface AIRiskContext {
  filePath: string;
  codeSnippet: string;
  startLine: number;
  endLine: number;
}

// 注意: AISuggestedActionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface AISuggestedAction {
  type: string;
  description: string;
  example: string;
}

// 注意: ReportOutputは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface ReportOutput {
  projectPath: string;
  timestamp: string;
  summary: ReportSummary;
  results: ReportResult[];
}

// 注意: ReportSummaryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface ReportSummary {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

// 注意: ReportResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface ReportResult {
  filePath: string;
  issues: Issue[];
  score: number;
  improvements: string[];
}

// 注意: AnalysisResultWithPluginsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface AnalysisResultWithPlugins {
  issues: Issue[];
  pluginResults?: Record<string, PluginResult>;
}

// 注意: Detectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface Detection {
  patternId: string;
  severity: string;
  location: Location;
  metadata?: {
    source?: string;
    sink?: string;
  };
}

// 注意: Locationは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface Location {
  file: string;
  line: number;
}

// 注意: TaintFlowDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface TaintFlowData {
  id: string;
  source: string;
  sink: string;
  taintLevel: string;
  path: Array<{ file: string; line: number }>;
}

// 注意: TaintSummaryDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-types.ts
export interface TaintSummaryData {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}

// 注意: AnalyzeOptionsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze-v0.8.ts
export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html' | 'ai-json';
  
  // v0.8.0 新オプション
  outputJson?: string;      // JSON出力先ファイル
  outputMarkdown?: string;  // Markdown出力先ファイル
  outputHtml?: string;      // HTML出力先ファイル
  outputAiJson?: string;    // AI JSON出力先ファイル (Issue #58)
  annotate?: boolean;       // インラインアノテーション生成
  annotateFormat?: 'inline' | 'block';  // アノテーション形式
  annotateOutput?: string;  // アノテーション出力先ディレクトリ
  preview?: boolean;        // アノテーションプレビューモード
  
  // 既存オプション
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
  clearCache?: boolean;
  showCacheStats?: boolean;
  performance?: boolean;
  showPerformanceReport?: boolean;
  
  // v0.8.0 追加オプション
  severity?: string[];      // フィルタする重要度
  includeDetails?: boolean; // 詳細情報を含む
  includeRecommendations?: boolean; // 推奨事項を含む
}

// 注意: JsonOutputは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/analyze.ts
interface JsonOutput {
      summary: {
        totalFiles: number;
        issuesFound: number;
        testCoverage: number;
        executionTime?: number;
      };
      issues: unknown[];
      targetPath: string;
      config: {
        targetPath: string;
        enabledPlugins: string[];
        format: string;
        processingMode: string;
      };
      performance?: {
        cacheStats?: unknown;
        parallelStats?: unknown;
        processingMode?: string;
        performanceReport?: unknown;
      };
    }

// 注意: DomainAnalyzeOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/domain-analyze.ts
export interface DomainAnalyzeOptions {
  /** 分析対象パス */
  path?: string;
  /** 出力フォーマット */
  format?: 'text' | 'json';
  /** 詳細ログ表示 */
  verbose?: boolean;
  /** 対話モード（デフォルト: true） */
  interactive?: boolean;
  /** 出力ディレクトリ */
  output?: string;
  /** 既存のドメイン定義を検証 */
  verify?: boolean;
  /** 最大クラスタ数 */
  maxClusters?: number;
  /** 最小キーワード頻度 */
  minKeywordFrequency?: number;
  /** 除外パターン */
  excludePatterns?: string[];
}

// 注意: IntentAnalyzeOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/intent-analyze.ts
export interface IntentAnalyzeOptions {
  path: string;
  format?: 'text' | 'json' | 'html';
  verbose?: boolean;
  output?: string;
  parallel?: boolean;
  maxWorkers?: number;
  // Phase 2 高度な分析オプション
  withTypes?: boolean;    // 型情報を使った分析
  withDomain?: boolean;   // ドメイン推論を含む分析
  withBusiness?: boolean; // ビジネスロジックマッピングを含む分析
}

// 注意: TaintAnalysisOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/taint-analysis-types.ts
export interface TaintAnalysisOptions {
  path: string;
  output: 'text' | 'json' | 'jaif';
  exportJaif?: string;
  generateStubs?: string;
  incremental: boolean;
  maxDepth: number;
  confidence: number;
  libraryBehavior: 'conservative' | 'optimistic';
}

// 注意: TaintIssueは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/taint-analysis-types.ts
export interface TaintIssue {
  type: string;
  severity: string;
  message: string;
  location: {
    line: number;
    column: number;
  };
  file?: string;
  suggestion?: string;
}

// 注意: SampleProjectは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/validate-types.ts
export interface SampleProject {
  name: string;
  framework: "express" | "react" | "nestjs" | "nextjs" | "fastify";
  rootPath: string;
  testPaths: string[];
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large';
    testCount: number;
    lastValidated: Date;
  };
}

// 注意: TestCaseは6箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/validate-types.ts
export interface TestCase {
  name: string;
  file: string;
  content: string;
  metadata: {
    framework: string;
    language: string;
    lastModified: Date;
  };
}

// 注意: FrameworkBreakdownは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/validate-types.ts
export interface FrameworkBreakdown {
  [framework: string]: {
    count: number;
    avgAccuracy: number;
    avgPerformance: number;
    avgSecurityScore: number;
    totalTests?: number;
    passedTests?: number;
    failedTests?: number;
    coverage?: number;
    issues?: Array<{
      type: string;
      severity: string;
      count: number;
    }>;
  };
}

// 注意: ValidateCommandOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/cli/commands/validate.ts
export interface ValidateCommandOptions {
  /** 検証対象のプロジェクトパス */
  projectPath?: string;
  /** フレームワーク指定 */
  framework?: 'express' | 'react' | 'nestjs' | 'all';
  /** テストケース生成 */
  generateTests?: boolean;
  /** 出力ディレクトリ */
  outputDir?: string;
  /** 詳細レポート生成 */
  detailedReport?: boolean;
  /** パフォーマンス測定 */
  performanceBenchmark?: boolean;
  /** 精度評価 */
  accuracyEvaluation?: boolean;
}

// 注意: BasicAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
export interface BasicAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  errors?: Array<{ pluginName: string; error: string }>;
}

// 注意: ExtendedAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
export interface ExtendedAnalysisResult {
  filePath: string;
  qualityAnalysis: QualityAnalysisResult;
  aggregatedScore: QualityScore;
  recommendations: Improvement[];
  executionTime: number;
}

// 注意: BatchAnalysisSummaryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  files: ExtendedAnalysisResult[];
  executionTime: number;
}

// 注意: QualityAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/UnifiedAnalysisEngine.ts
export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
}

// 注意: CacheEntryは6箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/cacheManager.ts
export interface CacheEntry {
  filePath: string;
  fileHash: string;      // ファイル内容のハッシュ値
  fileSize: number;      // ファイルサイズ
  lastModified: number;  // 最終更新時刻（unixタイムスタンプ）
  pluginResults: Record<string, Issue[]>; // プラグイン名 -> 分析結果
  cachedAt: number;      // キャッシュ作成時刻
  accessCount: number;   // アクセス回数（LRU用）
  lastAccessed: number;  // 最終アクセス時刻（LRU用）
}

// 注意: CacheStatisticsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/cacheManager.ts
export interface CacheStatistics {
  totalEntries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  totalSizeBytes: number;
  avgFileSize: number;
  oldestEntry: number;
  newestEntry: number;
  evictions?: number;
}

// 注意: CacheOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/cacheManager.ts
export interface CacheOptions {
  enabled?: boolean;             // キャッシュ有効化フラグ
  maxEntries?: number;           // 最大エントリ数（デフォルト: 1000）
  maxSizeBytes?: number;         // 最大サイズ（バイト、デフォルト: 50MB）
  ttlMs?: number;                // TTL（ミリ秒、デフォルト: 1時間）
  persistToDisk?: boolean;       // ディスクへの永続化
  cacheDirectory?: string;       // キャッシュディレクトリ
  compressionEnabled?: boolean;  // 圧縮の有効化
}

// 注意: CachedAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/cachedAnalyzer.ts
export interface CachedAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  cacheStats: {
    cacheHits: number;
    cacheMisses: number;
    hitRatio: number;
    filesFromCache: number;
    filesAnalyzed: number;
  };
  performanceReport?: PerformanceReport;
}

// 注意: CachedAnalysisOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/cachedAnalyzer.ts
export interface CachedAnalysisOptions {
  enableCache?: boolean;
  cacheOptions?: {
    maxEntries?: number;
    maxSizeBytes?: number;
    ttlMs?: number;
  };
  showCacheStats?: boolean;
  enablePerformanceMonitoring?: boolean;
  showPerformanceReport?: boolean;
  maxCacheSize?: number;  // 後方互換性のため
  autoEviction?: boolean; // 後方互換性のため
}

// 注意: PluginManagerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/cachedAnalyzer.ts
interface PluginManager {
    getRegisteredPlugins(): IPlugin[];
  }

// 注意: PluginConfigは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/config.ts
export interface PluginConfig {
  enabled: boolean;
  excludeFiles?: string[];
  priority?: number;  // プラグイン実行優先度（高いほど先に実行）
  [key: string]: unknown; // 動的プロパティサポート（型安全性向上）
}

// 注意: PluginMetadataは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/config.ts
export interface PluginMetadata {
  name: string;
  displayName?: string;
  description?: string;
  defaultConfig: PluginConfig;
}

// 注意: RimorConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/config.ts
export interface RimorConfig {
  excludePatterns?: string[];
  plugins: Record<string, PluginConfig>;
  output: {
    format: 'text' | 'json';
    verbose: boolean;
    reportDir?: string;  // レポート出力ディレクトリ（デフォルト: .rimor/reports/）
  };
  metadata?: {
    generatedAt?: string;
    preset?: string;
    targetEnvironment?: string;
    pluginCount?: number;
    estimatedExecutionTime?: number;
  };
  scoring?: {
    enabled?: boolean;
    weights?: {
      plugins?: Record<string, number>;
      dimensions?: {
        completeness?: number;
        correctness?: number;
        maintainability?: number;
        performance?: number;
        security?: number;
      };
      fileTypes?: Record<string, number>;
    };
    gradeThresholds?: {
      A?: number;
      B?: number;
      C?: number;
      D?: number;
      F?: number;
    };
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
}

// 注意: ASTInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/engine.ts
export interface ASTInfo {
  fileName: string;
  sourceFile: ts.SourceFile;
  program?: ts.Program;
}

// 注意: ASTNodeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IAnalysisEngine.ts
export interface ASTNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: ASTNode[];
  isNamed?: boolean;
}

// 注意: IAnalysisEngineは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IAnalysisEngine.ts
export interface IAnalysisEngine {
  /**
   * 指定されたパスを分析
   */
  analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  /**
   * AST生成（v0.9.0: Tree-sitter対応）
   */
  generateAST(filePath: string): Promise<ASTNode>;
  
  /**
   * キャッシュのクリア
   */
  clearCache?(): Promise<void>;
}

// 注意: PluginExecutionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
export interface PluginExecutionResult {
  pluginId: string;
  issues: Issue[];
  executionTime: number;
  error?: string;
}

// 注意: IPluginは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
export interface IPlugin {
  metadata: PluginMetadata;
  analyze(filePath: string): Promise<Issue[]>;
}

// 注意: IPluginManagerは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IPluginManager.ts
export interface IPluginManager {
  /**
   * プラグインを登録
   */
  register(plugin: IPlugin): void;
  
  /**
   * プラグインを登録解除
   */
  unregister(pluginId: string): void;
  
  /**
   * 登録されたプラグインを取得
   */
  getPlugins(): IPlugin[];
  
  /**
   * 特定のプラグインを取得
   */
  getPlugin(pluginId: string): IPlugin | undefined;
  
  /**
   * 全プラグインを実行
   */
  runAll(filePath: string): Promise<PluginExecutionResult[]>;
  
  /**
   * 特定のプラグインを実行
   */
  run(pluginId: string, filePath: string): Promise<PluginExecutionResult>;
  
  /**
   * プラグインの有効/無効を切り替え
   */
  setEnabled(pluginId: string, enabled: boolean): void;
}

// 注意: ReportFormatは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
export enum ReportFormat {
  TEXT = 'text',
  JSON = 'json',
  HTML = 'html',
  MARKDOWN = 'markdown'
}

// 注意: ReportOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  customTemplate?: string;
}

// 注意: IReporterは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/IReporter.ts
export interface IReporter {
  /**
   * 分析結果レポートを生成
   */
  generateAnalysisReport(
    result: AnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * セキュリティ監査レポートを生成
   */
  generateSecurityReport(
    result: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * 統合レポートを生成
   */
  generateCombinedReport?(
    analysisResult: AnalysisResult,
    securityResult: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * コンソール出力
   */
  printToConsole(content: string): void;
}

// 注意: ThreatTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
export enum ThreatType {
  INJECTION = 'injection',
  XSS = 'xss',
  CSRF = 'csrf',
  AUTH_BYPASS = 'auth_bypass',
  DATA_EXPOSURE = 'data_exposure',
  INSECURE_CRYPTO = 'insecure_crypto',
  HARDCODED_SECRET = 'hardcoded_secret',
  PATH_TRAVERSAL = 'path_traversal',
  UNVALIDATED_INPUT = 'unvalidated_input'
}

// 注意: SecurityThreatは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
export interface SecurityThreat {
  type: ThreatType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column?: number;
  message: string;
  recommendation: string;
  cweId?: string; // Common Weakness Enumeration ID
  owaspCategory?: string; // OWASP Top 10 category
}

// 注意: SecurityAuditResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
export interface SecurityAuditResult {
  threats: SecurityThreat[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  executionTime: number;
  filesScanned: number;
}

// 注意: SecurityRuleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
export interface SecurityRule {
  id: string;
  name: string;
  pattern: string | RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

// 注意: SecurityAuditOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
export interface SecurityAuditOptions {
  includeTests?: boolean;
  deepScan?: boolean;
  customRules?: SecurityRule[]; // 型安全性を向上
}

// 注意: ISecurityAuditorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/interfaces/ISecurityAuditor.ts
export interface ISecurityAuditor {
  /**
   * セキュリティ監査を実行
   */
  audit(targetPath: string, options?: SecurityAuditOptions): Promise<SecurityAuditResult>;
  
  /**
   * 特定のファイルをスキャン
   */
  scanFile(filePath: string): Promise<SecurityThreat[]>;
  
  /**
   * カスタムルールの登録（将来の拡張用）
   */
  registerRule?(rule: SecurityRule): void;
}

// 注意: ConfigGenerationOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/metadataDrivenConfig.ts
export interface ConfigGenerationOptions {
  preset?: 'minimal' | 'recommended' | 'comprehensive' | 'performance';
  targetEnvironment?: 'development' | 'ci' | 'production';
  maxExecutionTime?: number;  // ミリ秒
  memoryLimit?: 'low' | 'medium' | 'high';
  includeExperimental?: boolean;
}

// 注意: PluginRecommendationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/metadataDrivenConfig.ts
export interface PluginRecommendation {
  pluginName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

// 注意: ParallelOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/parallelAnalyzer.ts
export interface ParallelOptions {
  batchSize?: number;        // バッチあたりのファイル数（デフォルト: 10）
  maxConcurrency?: number;   // 最大同時実行数（デフォルト: 4）
  enableStats?: boolean;     // 統計情報収集の有効化（デフォルト: true）
}

// 注意: PerformanceMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/performanceMonitor.ts
export interface PerformanceMetrics {
  processingTime: number;      // 処理時間（ミリ秒）
  memoryUsage: {
    heapUsed: number;         // 使用ヒープメモリ（バイト）
    heapTotal: number;        // 総ヒープメモリ（バイト）
    external: number;         // 外部メモリ（バイト）
    rss: number;              // RSS（Resident Set Size）
  };
  startTime: number;          // 開始時刻
  endTime: number;            // 終了時刻
}

// 注意: PluginPerformanceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/performanceMonitor.ts
export interface PluginPerformance {
  pluginName: string;
  filePath: string;
  metrics: PerformanceMetrics;
  issuesFound: number;
  errorOccurred: boolean;
}

// 注意: PerformanceReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/performanceMonitor.ts
export interface PerformanceReport {
  totalMetrics: PerformanceMetrics;
  pluginPerformances: PluginPerformance[];
  summary: {
    totalFiles: number;
    totalPlugins: number;
    avgTimePerFile: number;
    avgTimePerPlugin: number;
    slowestPlugin: string;
    fastestPlugin: string;
    memoryPeakUsage: number;
    memoryEfficiency: number;  // MB/s
  };
  detailed: {
    filePerformance: Array<{
      filePath: string;
      totalTime: number;
      pluginCount: number;
      avgTimePerPlugin: number;
    }>;
    pluginPerformance: Array<{
      pluginName: string;
      totalTime: number;
      fileCount: number;
      avgTimePerFile: number;
      errorRate: number;
    }>;
  };
}

// 注意: PluginParameterは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
export interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[];
  };
}

// 注意: PluginDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
export interface PluginDependency {
  pluginName: string;
  version?: string;
  optional: boolean;
  reason: string;
}

// 注意: MetadataProviderは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/pluginMetadata.ts
export interface MetadataProvider {
  getMetadata(): PluginMetadata;
}

// 注意: DetectionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
export interface DetectionResult {
  patternId?: string;
  pattern?: string; // Alias for patternId (backward compatibility)
  patternName?: string;
  location?: CodeLocation;
  confidence: number; // 0.0-1.0
  evidence?: Evidence[];
  severity?: SeverityLevel;
  securityRelevance?: number; // 0.0-1.0
  metadata?: Record<string, unknown>;
}

// 注意: FileMetricsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
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

// 注意: AggregatedAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
export interface AggregatedAnalysisResult {
  // Summary
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  
  // Issues
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  issuesByType: Record<string, number>;
  issuesByFile: Record<string, Issue[]>;
  
  // Quality
  overallQualityScore?: number;
  averageQualityScore?: number;
  qualityDistribution?: Record<string, number>;
  
  // Performance
  totalAnalysisTime: number;
  averageFileTime: number;
  slowestFiles?: Array<{ file: string; time: number }>;
  
  // Plugin performance
  pluginPerformance?: Record<string, {
    totalTime: number;
    averageTime: number;
    filesProcessed: number;
  }>;
  
  // File results
  fileResults: AnalysisResult[];
  
  // Metadata
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

// 注意: AnalysisContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
export interface AnalysisContext {
  // Current file
  file: string;
  content?: string;
  ast?: unknown; // Will be properly typed when AST types are defined
  
  // Project context
  projectRoot: string;
  projectType?: string;
  framework?: string;
  
  // Dependencies
  dependencies?: Map<string, string>;
  devDependencies?: Map<string, string>;
  
  // Previous results (for incremental analysis)
  previousResults?: AnalysisResult;
  previousMetrics?: FileMetrics;
  
  // Shared data between plugins
  sharedData?: Map<string, unknown>;
  
  // Options
  options: AnalysisOptions;
}

// 注意: AnalysisSessionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-result.ts
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

// 注意: BaseAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface BaseAnalysisResult {
  projectPath: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
}

// 注意: FileAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface FileAnalysisResult {
  filePath: string;
  issues: Issue[];
  patterns: DetectionResult[];
  metrics?: FileMetrics;
}

// 注意: ProjectAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface ProjectAnalysisResult extends BaseAnalysisResult {
  files: FileAnalysisResult[];
  summary: AnalysisSummary;
  issues: Issue[];
  improvements: Improvement[];
  qualityScore: QualityScore;
}

// 注意: AnalysisSummaryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface AnalysisSummary {
  totalFiles: number;
  analyzedFiles: number;
  skippedFiles: number;
  totalIssues: number;
  issuesBySeverity: Record<SeverityLevel, number>;
  totalPatterns: number;
  totalImprovements: number;
}

// 注意: TaintAnalysisResultは8箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface TaintAnalysisResult {
  flows: TaintFlow[];
  summary: TaintSummary;
  recommendations: string[];
}

// 注意: TaintFlowは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface TaintFlow {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
  confidence: number;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
}

// 注意: TaintLevelは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export type TaintLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

// 注意: TaintSummaryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface TaintSummary {
  totalFlows: number;
  criticalFlows: number;
  highFlows: number;
  mediumFlows: number;
  lowFlows: number;
  sourcesCount: number;
  sinksCount: number;
  sanitizersCount: number;
}

// 注意: SecurityAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface SecurityAnalysisResult extends BaseAnalysisResult {
  vulnerabilities: SecurityVulnerability[];
  taintAnalysis?: TaintAnalysisResult;
  securityScore: number;
  compliance: ComplianceResult;
}

// 注意: SecurityVulnerabilityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: SeverityLevel;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  cwe?: string;
  owasp?: string;
  fix?: string;
}

// 注意: ComplianceResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface ComplianceResult {
  standard: string;
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
}

// 注意: ComplianceViolationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: SeverityLevel;
  location?: {
    file: string;
    line: number;
  };
}

// 注意: DependencyAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface DependencyAnalysisResult {
  dependencies: DependencyInfo[];
  vulnerabilities: DependencyVulnerability[];
  outdated: OutdatedDependency[];
  unused: string[];
  missing: string[];
  circular: CircularDependency[];
}

// 注意: DependencyInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  resolved?: string;
  integrity?: string;
}

// 注意: DependencyVulnerabilityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface DependencyVulnerability {
  package: string;
  version: string;
  severity: SeverityLevel;
  vulnerability: string;
  recommendation: string;
}

// 注意: OutdatedDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface OutdatedDependency {
  package: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

// 注意: CircularDependencyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface CircularDependency {
  files: string[];
  severity: SeverityLevel;
  suggestion: string;
}

// 注意: MethodAnalysisResultは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface MethodAnalysisResult {
  name: string;
  file: string;
  line: number;
  issues: Issue[];
  complexity?: number;
  coverage?: number;
}

// 注意: MethodChangeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/analysis-types.ts
export interface MethodChange {
  type: 'added' | 'modified' | 'deleted';
  method: string | TestMethod;
  file?: string;
  line?: number;
  impact?: 'high' | 'medium' | 'low';
  details?: string;
}

// 注意: SecurityThreatTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type SecurityThreatType = 'xss' | 'sql-injection' | 'path-traversal' | 'command-injection' | 'other';

// 注意: SecurityTypeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export enum SecurityType {
  /** ユーザー入力型 */
  USER_INPUT = 'user-input',
  /** 認証トークン型 */
  AUTH_TOKEN = 'auth-token',
  /** 検証済み認証型 */
  VALIDATED_AUTH = 'validated-auth',
  /** 検証済み入力型 */
  VALIDATED_INPUT = 'validated-input',
  /** サニタイズ済み型 */
  SANITIZED_DATA = 'sanitized-data',
  /** セキュアSQL型 */
  SECURE_SQL = 'secure-sql',
  /** セキュアHTML型 */
  SECURE_HTML = 'secure-html',
  /** 認証型 */
  AUTHENTICATION = 'authentication',
  /** 認可型 */
  AUTHORIZATION = 'authorization',
  /** 入力検証型 */
  INPUT_VALIDATION = 'input-validation',
  /** APIセキュリティ型 */
  API_SECURITY = 'api-security'
}

// 注意: PluginTypeは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security' | 'custom';

// 注意: TestTypeは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'unknown';

// 注意: QualityDimensionは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type QualityDimension = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';

// 注意: ImprovementTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type ImprovementType = 
  // 基本的な改善タイプ
  | 'add' | 'modify' | 'remove' | 'refactor'
  // テスト関連の改善タイプ
  | 'add-test' | 'fix-assertion' | 'improve-coverage'
  // セキュリティ関連の改善タイプ
  | 'add-input-validation-tests' | 'enhance-sanitization-testing' 
  | 'add-boundary-condition-tests' | 'improve-error-handling-tests'
  // その他の改善タイプ
  | 'documentation' | 'performance' | 'security';

// 注意: ImprovementPriorityは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';

// 注意: Positionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface Position {
  line: number;
  column: number;
  offset?: number;
  file?: string; // ファイルパス（オプション）
  method?: string; // メソッド名（テストで使用）
}

// 注意: FileLocationは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface FileLocation {
  file: string;
}

// 注意: RangeLocationは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface RangeLocation extends FileLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// 注意: CodeLocationは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface CodeLocation {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: string;
}

// 注意: TimeRangeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface TimeRange {
  start: Date;
  end: Date;
}

// 注意: ConfidenceInfoは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface ConfidenceInfo {
  level: number; // 0.0 to 1.0
  reason?: string;
}

// 注意: BaseMetadataは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface BaseMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  tags?: string[];
  [key: string]: unknown; // Allow extension with additional properties
}

// 注意: IssueSeverityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type IssueSeverity = SeverityLevel;

// 注意: BaseIssueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface BaseIssue {
  // Identification
  id?: string;
  type: string;
  
  // Severity and priority
  severity: IssueSeverity;
  priority?: number;
  
  // Description
  message: string;
  details?: string;
  
  // Location
  filePath: string; // Required for compatibility
  file?: string;
  line?: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  location?: CodeLocation;
  position?: Position;
  
  // Resolution
  recommendation?: string;
  suggestedFix?: string;
  autoFixable?: boolean;
  
  // Context
  codeSnippet?: string;
  context?: string[];
  
  // Source
  plugin?: string;
  rule?: string;
  category: IssueCategory; // Required for compatibility
  
  // Additional info
  documentation?: string;
  examples?: string[];
  references?: string[];
  tags?: string[];
  
  // Confidence
  confidence?: ConfidenceInfo;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// 注意: Evidenceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

// 注意: Feedbackは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface Feedback {
  helpful: boolean;
  accurate?: boolean;
  comment?: string;
  rating?: number;
  timestamp?: Date;
}

// 注意: FixResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export interface FixResult {
  success: boolean;
  modifiedFiles: string[];
  changes?: Array<{
    file: string;
    diff: string;
  }>;
  errors?: string[];
  warnings?: string[];
}

// 注意: TaintQualifierは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/base-types.ts
export type TaintQualifier = TaintLevel;

// 注意: SeverityLevelは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'error' | 'warning';

// 注意: IssueCategoryは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export type IssueCategory = 
    | 'testing'      // テスト関連
    | 'security'     // セキュリティ
    | 'performance'  // パフォーマンス
    | 'maintainability' // 保守性
    | 'reliability'  // 信頼性
    | 'complexity'   // 複雑度
    | 'duplication'  // 重複
    | 'style'        // コードスタイル
    | 'documentation' // ドキュメント
    | 'general'      // その他
    | 'test-quality' // テスト品質
    | 'coverage'     // カバレッジ
    | 'assertion'    // アサーション
    | 'pattern'      // パターン
    | 'structure'    // 構造
    | 'best-practice' // ベストプラクティス
    | 'error-handling' // エラーハンドリング
    | 'validation'   // バリデーション
    | 'code-quality' // コード品質
    | 'test-coverage' // テストカバレッジ
    | 'file-system'  // ファイルシステム
    | 'syntax';

// 注意: Issueは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export interface Issue {
    // 識別情報
    id: string;
    type: string;
    
    // 深刻度と分類
    severity: SeverityLevel;
    category: IssueCategory;
    
    // 問題の説明
    message: string;
    description?: string;
    
    // 位置情報
    filePath?: string;
    file?: string; // 後方互換性のため追加（filePathと同じ）
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    
    // 追加情報
    ruleId?: string;
    suggestion?: string;
    fixable?: boolean;
    
    // メタデータ
    metadata?: Record<string, any>;
  }

// 注意: ExtendedIssueは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export interface ExtendedIssue extends Issue {
    // 位置情報の詳細
    position?: {
      line: number;
      column: number;
      endLine?: number;
      endColumn?: number;
    };
    
    // 追加のコンテキスト情報
    suggestedFix?: string;
    codeSnippet?: string;
    plugin?: string;
    rule?: string;
    
    // reporting用プロパティ
    location?: {
      file: string;
      startLine: number;
      endLine: number;
      column?: number;
    };
    recommendation?: string;
    references?: string[];
  }

// 注意: QualityScoreは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export interface QualityScore {
    // 総合スコア (0-100)
    overall: number;
    
    // 次元別スコア
    dimensions: {
      completeness?: number;
      correctness?: number;
      maintainability?: number;
      reliability?: number;
      security?: number;
    };
    
    // スコアの内訳
    breakdown?: {
      [key: string]: number;
    };
    
    // 信頼度 (0.0-1.0)
    confidence: number;
    
    // グレード
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  }

// 注意: ProjectContextは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export interface ProjectContext {
    // プロジェクト情報
    rootPath: string;
    projectName?: string;
    projectType?: string;
    
    // 技術スタック
    language?: string;
    framework?: string;
    testFramework?: string;
    
    // 設定
    configFiles?: string[];
    dependencies?: Record<string, string>;
    
    // 統計
    totalFiles?: number;
    totalLines?: number;
    testFiles?: number;
  }

// 注意: Improvementは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/core-definitions.ts
export interface Improvement {
    // 識別情報
    id: string;
    type: 'refactor' | 'fix' | 'enhancement' | 'test' | 'documentation';
    
    // 優先度と影響
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact?: number | { scoreImprovement: number; effortMinutes: number };
    estimatedImpact?: number;
    
    // 提案内容
    title: string;
    description: string;
    category?: string;
    
    // 実装詳細
    suggestedCode?: string;
    diff?: string;
    autoFixable?: boolean;
    
    // 努力見積もり
    effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
    estimatedTime?: string;
  }

// 注意: DomainTermは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainTerm {
  // Identification
  id: string;
  term: string;
  
  // Variations
  aliases?: string[];
  abbreviations?: string[];
  plurals?: string[];
  
  // Classification
  category?: string;
  type?: 'entity' | 'action' | 'attribute' | 'relationship' | 'constraint' | 'event';
  domain?: string;
  subdomain?: string;
  
  // Definition
  definition: string;
  description?: string;
  examples?: string[];
  nonExamples?: string[];
  
  // Context
  context?: string[];
  relatedTerms?: string[];
  synonyms?: string[];
  antonyms?: string[];
  
  // Business rules
  rules?: string[];
  constraints?: string[];
  validations?: string[];
  
  // Technical mapping
  technicalName?: string;
  dataType?: string;
  format?: string;
  pattern?: string;
  
  // Importance
  importance?: 'low' | 'medium' | 'high' | 'critical';
  frequency?: number; // Usage frequency
  
  // Metadata
  source?: string;
  references?: string[];
  lastUpdated?: Date;
  version?: string;
  metadata?: BaseMetadata;
}

// 注意: BusinessRuleは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface BusinessRule {
  // Identification
  id: string;
  name: string;
  code?: string; // Rule code for reference
  
  // Classification
  type?: 'validation' | 'calculation' | 'constraint' | 'workflow' | 'authorization' | 'other';
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  
  // Definition
  description: string;
  statement: string; // Formal rule statement
  conditions?: string[];
  actions?: string[];
  exceptions?: string[];
  
  // Implementation
  implementation?: {
    pseudocode?: string;
    formula?: string;
    algorithm?: string;
    flowchart?: string;
  };
  
  // Testing
  testScenarios?: TestScenario[];
  acceptanceCriteria?: string[];
  edgeCases?: string[];
  
  // Related entities
  relatedTerms?: string[];
  relatedRules?: string[];
  dependencies?: string[];
  
  // Compliance
  compliance?: {
    standard?: string;
    regulation?: string;
    requirement?: string;
    auditTrail?: boolean;
  };
  
  // Metadata
  owner?: string;
  approvedBy?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  version?: string;
  metadata?: BaseMetadata;
}

// 注意: TestScenarioは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  given: string[]; // Preconditions
  when: string[]; // Actions
  then: string[]; // Expected outcomes
  priority?: 'low' | 'medium' | 'high';
  automated?: boolean;
}

// 注意: DomainDictionaryは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainDictionary {
  // Identification
  id: string;
  name: string;
  version: string;
  
  // Content
  terms: DomainTerm[];
  rules: BusinessRule[];
  relationships?: DomainRelationship[];
  
  // Organization
  categories?: DomainCategory[];
  domains?: string[];
  glossary?: Map<string, string>; // Quick lookup
  
  // Metadata
  language?: string;
  industry?: string;
  organization?: string;
  createdAt?: Date;
  updatedAt?: Date;
  author?: string;
  reviewers?: string[];
  metadata?: BaseMetadata;
}

// 注意: DomainRelationshipは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainRelationship {
  id: string;
  type: 'is-a' | 'has-a' | 'uses' | 'depends-on' | 'relates-to' | 'custom';
  source: string; // Term ID
  target: string; // Term ID
  cardinality?: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  required?: boolean;
  bidirectional?: boolean;
  description?: string;
  rules?: string[];
}

// 注意: DomainCategoryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainCategory {
  id: string;
  name: string;
  description?: string;
  parent?: string; // Parent category ID
  children?: string[]; // Child category IDs
  terms?: string[]; // Term IDs in this category
  icon?: string;
  color?: string;
  order?: number;
}

// 注意: DomainContextは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainContext {
  dictionary: DomainDictionary;
  activeTerms: Set<string>; // Currently relevant terms
  activeRules: Set<string>; // Currently applicable rules
  confidence: ConfidenceInfo;
  matches?: DomainMatch[];
  violations?: RuleViolation[];
}

// 注意: DomainMatchは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainMatch {
  termId: string;
  term: string;
  location: {
    file: string;
    line: number;
    column: number;
    text: string;
  };
  confidence: number;
  type: 'exact' | 'partial' | 'semantic' | 'inferred';
  context?: string;
}

// 注意: RuleViolationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  suggestion?: string;
  autoFixable?: boolean;
}

// 注意: DomainCoverageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface DomainCoverage {
  totalTerms: number;
  coveredTerms: number;
  uncoveredTerms: string[];
  coverage: number; // Percentage
  
  totalRules: number;
  implementedRules: number;
  violatedRules: number;
  compliance: number; // Percentage
  
  byCategory?: Map<string, {
    total: number;
    covered: number;
    coverage: number;
  }>;
  
  suggestions?: string[];
  gaps?: string[];
}

// 注意: IDomainKnowledgeExtractorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface IDomainKnowledgeExtractor {
  extractTerms(content: string): DomainTerm[];
  extractRules(content: string): BusinessRule[];
  extractRelationships(terms: DomainTerm[]): DomainRelationship[];
  buildDictionary(sources: string[]): DomainDictionary;
}

// 注意: IDomainAnalyzerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/domain-dictionary.ts
export interface IDomainAnalyzer {
  analyze(content: string, dictionary: DomainDictionary): DomainContext;
  findMatches(content: string, terms: DomainTerm[]): DomainMatch[];
  validateRules(content: string, rules: BusinessRule[]): RuleViolation[];
  calculateCoverage(matches: DomainMatch[], dictionary: DomainDictionary): DomainCoverage;
}

// 注意: Handlerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type Handler<T = void> = (event: Event) => T;

// 注意: AsyncHandlerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type AsyncHandler<T = void> = (event: Event) => Promise<T>;

// 注意: ErrorHandlerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ErrorHandler = (error: Error, context?: ErrorContext) => void;

// 注意: ErrorContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export interface ErrorContext {
  file?: string;
  line?: number;
  column?: number;
  method?: string;
  stack?: string;
}

// 注意: Callbackは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type Callback<T = void, E = Error> = (error: E | null, result?: T) => void;

// 注意: AsyncCallbackは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type AsyncCallback<T = void, E = Error> = (error: E | null, result?: T) => Promise<void>;

// 注意: EventListenerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export interface EventListener<T = unknown> {
  eventName: string;
  handler: (data: T) => void;
  once?: boolean;
}

// 注意: HandlebarsHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type HandlebarsHelper = (...args: unknown[]) => unknown;

// 注意: HandlebarsBlockHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export interface HandlebarsBlockHelper {
  (this: unknown, context: unknown, options: HandlebarsOptions): string;
}

// 注意: HandlebarsOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export interface HandlebarsOptions {
  fn: (context: unknown) => string;
  inverse: (context: unknown) => string;
  hash: Record<string, unknown>;
  data?: Record<string, unknown>;
}

// 注意: ArrayHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ArrayHelper<T> = (array: T[], ...args: unknown[]) => T[] | T | undefined;

// 注意: ObjectHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ObjectHelper<T = unknown> = (obj: Record<string, T>, ...args: unknown[]) => T | undefined;

// 注意: StringHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type StringHelper = (str: string, ...args: unknown[]) => string;

// 注意: NumberHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type NumberHelper = (num: number, ...args: unknown[]) => number | string;

// 注意: ConditionalHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ConditionalHelper = (...args: unknown[]) => boolean;

// 注意: TransformHelperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type TransformHelper<T, R> = (value: T, ...args: unknown[]) => R;

// 注意: FilterFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type FilterFunction<T> = (item: T, index?: number, array?: T[]) => boolean;

// 注意: MapperFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type MapperFunction<T, R> = (item: T, index?: number, array?: T[]) => R;

// 注意: ReducerFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ReducerFunction<T, R> = (accumulator: R, current: T, index?: number, array?: T[]) => R;

// 注意: ComparatorFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ComparatorFunction<T> = (a: T, b: T) => number;

// 注意: ValidatorFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ValidatorFunction<T> = (value: T) => boolean | string;

// 注意: SanitizerFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type SanitizerFunction<T = string> = (input: T) => T;

// 注意: ParserFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ParserFunction<T, R> = (input: T) => R | never;

// 注意: FormatterFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type FormatterFunction<T> = (value: T, format?: string) => string;

// 注意: MiddlewareFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type MiddlewareFunction<T = unknown, R = unknown> = (
  context: T,
  next: () => Promise<R>
) => Promise<R>;

// 注意: InterceptorFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export interface InterceptorFunction<T = unknown, R = unknown> {
  before?: (context: T) => T | Promise<T>;
  after?: (result: R, context: T) => R | Promise<R>;
  error?: (error: Error, context: T) => void | Promise<void>;
}

// 注意: TransformerFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type TransformerFunction<T, R> = (input: T) => R | Promise<R>;

// 注意: AggregatorFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type AggregatorFunction<T, R> = (items: T[]) => R;

// 注意: PredicateFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type PredicateFunction<T> = (value: T) => boolean;

// 注意: FactoryFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type FactoryFunction<T> = (...args: unknown[]) => T;

// 注意: BuilderFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type BuilderFunction<T> = (config: Partial<T>) => T;

// 注意: ResolverFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/handler-types.ts
export type ResolverFunction<T> = () => T | Promise<T>;

// 注意: CodeExampleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
export interface CodeExample {
  title: string;
  description?: string;
  before: string;
  after: string;
  language?: string;
  framework?: string;
}

// 注意: Referenceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
export interface Reference {
  type: 'documentation' | 'article' | 'video' | 'book' | 'tool' | 'other';
  title: string;
  url?: string;
  author?: string;
  description?: string;
}

// 注意: ImprovementPlanは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
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

// 注意: ImprovementPhaseは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
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

// 注意: ImprovementExecutionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
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

// 注意: ImprovementAnalyticsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
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

// 注意: IImprovementEngineは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/improvements.ts
export interface IImprovementEngine {
  analyze(context: unknown): Promise<Improvement[]>;
  prioritize(improvements: Improvement[]): Improvement[];
  createPlan(improvements: Improvement[]): ImprovementPlan;
  execute(improvement: Improvement): Promise<ImprovementExecutionResult>;
  track(plan: ImprovementPlan): ImprovementAnalytics;
}

// 注意: TestAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export interface TestAnalysisResult {
  file: TestFileType;
  issues: IssueType[];
  detectionResults: DetectionResultType[];
  qualityScore: QualityScoreType;
  improvements: ImprovementType[];
  domainContext?: DomainContextType;
}

// 注意: PluginExecutionContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export interface PluginExecutionContext {
  project: ProjectContextType;
  file: TestFileType;
  analysis: AnalysisContextType;
  dictionary?: DomainDictionaryType;
  options?: AnalysisOptionsType;
}

// 注意: QualityScoreMapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export type QualityScoreMap = Map<string, QualityScoreType>;

// 注意: ImprovementMapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export type ImprovementMap = Map<string, ImprovementType[]>;

// 注意: DetectionResultMapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export type DetectionResultMap = Map<string, DetectionResultType[]>;

// 注意: DeepPartialは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 注意: RequireAtLeastOneは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// 注意: Nullableは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/index.ts
export type Nullable<T> = T | null | undefined;

// 注意: ITestQualityPluginは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
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

// 注意: PluginCapabilitiesは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
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

// 注意: ConfigSchemaは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface ConfigSchema {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

// 注意: SchemaPropertyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
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

// 注意: ValidationRuleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

// 注意: ValidationResultは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  info?: string[];
}

// 注意: ValidationErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
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

// 注意: ValidationWarningは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface ValidationWarning {
  field?: string;
  message: string;
  suggestion?: string;
}

// 注意: IPluginLoaderは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface IPluginLoader {
  load(path: string): Promise<IPlugin | ITestQualityPlugin>;
  validate(plugin: unknown): boolean;
  isPluginFile(path: string): boolean;
}

// 注意: IPluginRegistryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface IPluginRegistry {
  register(plugin: IPlugin | ITestQualityPlugin): void;
  unregister(id: string): void;
  get(id: string): IPlugin | ITestQualityPlugin | undefined;
  getAll(): Array<IPlugin | ITestQualityPlugin>;
  has(id: string): boolean;
  clear(): void;
}

// 注意: IPluginExecutorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/plugin-interface.ts
export interface IPluginExecutor {
  execute(plugin: IPlugin | ITestQualityPlugin, context: AnalysisContext): Promise<PluginResult>;
  executeAll(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext): Promise<PluginResult[]>;
  executeParallel(plugins: Array<IPlugin | ITestQualityPlugin>, context: AnalysisContext, maxConcurrency?: number): Promise<PluginResult[]>;
}

// 注意: PackageJsonConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
export interface PackageJsonConfig {
  name: string;
  version: string;
  description?: string;
  main?: string;
  type?: 'module' | 'commonjs';
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  repository?: {
    type: string;
    url: string;
    directory?: string;
  } | string;
  keywords?: string[];
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  contributors?: Array<string | {
    name: string;
    email?: string;
    url?: string;
  }>;
  license?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  homepage?: string;
  private?: boolean;
  workspaces?: string[] | {
    packages?: string[];
    nohoist?: string[];
  };
  resolutions?: Record<string, string>;
  overrides?: Record<string, string>;
  exports?: Record<string, unknown>;
  files?: string[];
  bin?: string | Record<string, string>;
  man?: string | string[];
  directories?: {
    lib?: string;
    bin?: string;
    man?: string;
    doc?: string;
    example?: string;
    test?: string;
  };
  config?: Record<string, unknown>;
  publishConfig?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}

// 注意: TSConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
export interface TSConfig {
  compilerOptions?: {
    // Type Checking
    allowUnreachableCode?: boolean;
    allowUnusedLabels?: boolean;
    alwaysStrict?: boolean;
    exactOptionalPropertyTypes?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noImplicitAny?: boolean;
    noImplicitOverride?: boolean;
    noImplicitReturns?: boolean;
    noImplicitThis?: boolean;
    noPropertyAccessFromIndexSignature?: boolean;
    noUncheckedIndexedAccess?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    strict?: boolean;
    strictBindCallApply?: boolean;
    strictFunctionTypes?: boolean;
    strictNullChecks?: boolean;
    strictPropertyInitialization?: boolean;
    useUnknownInCatchVariables?: boolean;
    
    // Modules
    allowArbitraryExtensions?: boolean;
    allowImportingTsExtensions?: boolean;
    allowUmdGlobalAccess?: boolean;
    baseUrl?: string;
    customConditions?: string[];
    module?: string;
    moduleResolution?: 'node' | 'classic' | 'node16' | 'nodenext' | 'bundler';
    moduleSuffixes?: string[];
    noResolve?: boolean;
    paths?: Record<string, string[]>;
    resolveJsonModule?: boolean;
    resolvePackageJsonExports?: boolean;
    resolvePackageJsonImports?: boolean;
    rootDir?: string;
    rootDirs?: string[];
    typeRoots?: string[];
    types?: string[];
    
    // Emit
    declaration?: boolean;
    declarationDir?: string;
    declarationMap?: boolean;
    downlevelIteration?: boolean;
    emitBOM?: boolean;
    emitDeclarationOnly?: boolean;
    importHelpers?: boolean;
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error';
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    mapRoot?: string;
    newLine?: 'crlf' | 'lf';
    noEmit?: boolean;
    noEmitHelpers?: boolean;
    noEmitOnError?: boolean;
    outDir?: string;
    outFile?: string;
    preserveConstEnums?: boolean;
    preserveValueImports?: boolean;
    removeComments?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    stripInternal?: boolean;
    
    // JavaScript Support
    allowJs?: boolean;
    checkJs?: boolean;
    maxNodeModuleJsDepth?: number;
    
    // Editor Support
    disableSizeLimit?: boolean;
    plugins?: Array<{ name: string; [key: string]: unknown }>;
    
    // Interop Constraints
    allowSyntheticDefaultImports?: boolean;
    esModuleInterop?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    isolatedModules?: boolean;
    preserveSymlinks?: boolean;
    verbatimModuleSyntax?: boolean;
    
    // Language and Environment
    emitDecoratorMetadata?: boolean;
    experimentalDecorators?: boolean;
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev' | 'react-native';
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    jsxImportSource?: string;
    lib?: string[];
    moduleDetection?: 'auto' | 'legacy' | 'force';
    noLib?: boolean;
    reactNamespace?: string;
    target?: string;
    useDefineForClassFields?: boolean;
    
    // Compiler Diagnostics
    diagnostics?: boolean;
    explainFiles?: boolean;
    extendedDiagnostics?: boolean;
    generateCpuProfile?: string;
    listEmittedFiles?: boolean;
    listFiles?: boolean;
    traceResolution?: boolean;
    
    // Projects
    composite?: boolean;
    disableReferencedProjectLoad?: boolean;
    disableSolutionSearching?: boolean;
    disableSourceOfProjectReferenceRedirect?: boolean;
    incremental?: boolean;
    tsBuildInfoFile?: string;
    
    // Output Formatting
    noErrorTruncation?: boolean;
    preserveWatchOutput?: boolean;
    pretty?: boolean;
    
    // Completeness
    skipDefaultLibCheck?: boolean;
    skipLibCheck?: boolean;
    
    [key: string]: unknown; // Allow additional options
  };
  include?: string[];
  exclude?: string[];
  files?: string[];
  extends?: string;
  references?: Array<{ path: string; prepend?: boolean }>;
  compileOnSave?: boolean;
  typeAcquisition?: {
    enable?: boolean;
    include?: string[];
    exclude?: string[];
    disableFilenameBasedTypeAcquisition?: boolean;
  };
  watchOptions?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}

// 注意: TestFileは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
export interface TestFile {
  path: string;
  content: string;
  framework?: string;
  testMethods?: TestMethod[]; // Properly typed, not any
  testCount?: number;
  hasTests?: boolean;
  ast?: ASTNode; // Properly typed, not any
  metadata?: {
    framework?: string;
    language: string;
    lastModified: Date;
    size?: number;
    encoding?: string;
  };
}

// 注意: MethodSignatureは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
export interface MethodSignature {
  name: string;
  parameters: Array<{
    name: string;
    type?: string;
    source?: 'user-input' | 'database' | 'api' | 'constant';
  }>;
  returnType?: string;
  annotations: string[];
  isAsync: boolean;
  visibility?: 'private' | 'protected' | 'public';
}

// 注意: TestMethodは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/project-context.ts
export interface TestMethod {
  name: string;
  type: 'test' | 'suite' | 'hook' | 'helper';
  location: {
    start: Position;
    end: Position;
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
  };
  async?: boolean;
  skip?: boolean;
  only?: boolean;
  timeout?: number;
  tags?: string[];
  assertions?: number | string[];
  description?: string;
  // 追加プロパティ（後方互換性のため）
  content?: string;
  body?: string;
  filePath?: string;
  signature?: string | MethodSignature;
  testType?: 'unit' | 'integration' | 'e2e' | 'security' | 'performance' | 'smoke';
  // Security-related properties
  securityRelevance?: number;
}

// 注意: QualityDetailsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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
  
  // Security-specific metrics
  validationCoverage?: number; // 0.0-1.0
  sanitizerCoverage?: number; // 0.0-1.0
  boundaryCoverage?: number; // 0.0-1.0
  sanitizationQuality?: number; // 0.0-1.0
  boundaryTestingScore?: number; // 0.0-1.0
}

// 注意: QualityMetricsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

// 注意: QualityEvidenceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

// 注意: QualityTrendは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
export interface QualityTrend {
  direction: 'improving' | 'stable' | 'declining';
  change: number; // Percentage change
  changeRate: number; // Rate of change per time unit
  history: QualityHistoryPoint[];
  forecast?: QualityForecast;
}

// 注意: QualityHistoryPointは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
export interface QualityHistoryPoint {
  timestamp: Date;
  overall: number;
  dimensions: Partial<Record<QualityDimension, number>>;
  issueCount?: number;
  metadata?: Record<string, unknown>;
}

// 注意: QualityForecastは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
export interface QualityForecast {
  nextPeriod: number; // Predicted score
  confidence: number; // Confidence in prediction
  factors: string[]; // Factors affecting the forecast
  recommendations: string[]; // Actions to improve forecast
}

// 注意: QualityBenchmarksは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

// 注意: QualityGradeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
export interface QualityGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  label: string;
  description: string;
  color: string;
  recommendations: string[];
}

// 注意: QualityReportは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

// 注意: QualityRecommendationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

// 注意: QualityConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

// 注意: QualityRuleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/quality-score.ts
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

export type IssueMap = Map<string, Issue[]>;

// 注意: WorkerTaskは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface WorkerTask<T = unknown> {
  id: string;
  type: 'analyze';
  data: T;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

// 注意: WorkerInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface WorkerInfo {
  worker: Worker;
  busy: boolean;
  taskQueue: WorkerTask<unknown>[];
}

// 注意: DomainRuleは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'quality' | 'performance' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  patterns: RulePattern[];
  tags?: string[];
}

// 注意: RulePatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RulePattern {
  type: 'regex' | 'ast' | 'keyword';
  pattern: string;
  message: string;
  fix?: string;
}

// 注意: RuleEvaluationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  fix?: string;
}

// 注意: InteractiveDomainValidatorConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface InteractiveDomainValidatorConfig {
  /** 確認をスキップするか */
  skipConfirmation?: boolean;
  /** 最大表示キーワード数 */
  maxDisplayKeywords?: number;
}

// 注意: KeywordExtractionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface KeywordExtractionResult {
  language: string;
  keywords: string[];
  confidence?: number;
}

// 注意: AnalysisMetadataは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnalysisMetadata {
  /** 分析対象パス */
  targetPath: string;
  
  /** 分析エンジンバージョン */
  engineVersion: string;
  
  /** 使用されたプラグイン */
  plugins: string[];
  
  /** 分析時間（ミリ秒） */
  analysisTime: number;
  
  /** ファイル統計 */
  fileStats: {
    totalFiles: number;
    analyzedFiles: number;
    testFiles: number;
    sourceFiles: number;
  };
}

// 注意: DomainAnalysisSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainAnalysisSection {
  /** ドメイン定義 */
  definition: DomainDefinition;
  
  /** 検出されたドメインクラスタ */
  clusters: DomainCluster[];
  
  /** ドメインカバレッジ */
  coverage: {
    /** カバーされているドメイン用語の割合 */
    termCoverage: number;
    
    /** テストされているビジネスルールの割合 */
    ruleCoverage: number;
    
    /** ドメイン固有のテストの割合 */
    domainTestRatio: number;
  };
  
  /** ドメイン固有の問題 */
  domainIssues: DomainIssue[];
  
  /** ドメイン用語（統計用） */
  terms?: Record<string, { count: number; files: string[] }>;
  
  /** ビジネスルール（統計用） */
  rules?: any[];
}

// 注意: DomainIssueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainIssue {
  /** 問題ID */
  id: string;
  
  /** ドメインクラスタID */
  clusterId: string;
  
  /** 問題の種類 */
  type: 'missing_test' | 'incomplete_coverage' | 'rule_violation' | 'terminology_mismatch';
  
  /** 重要度 */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** 問題の説明 */
  description: string;
  
  /** 影響を受けるファイル */
  affectedFiles: string[];
  
  /** 推奨される修正方法 */
  suggestedFix?: string;
}

// 注意: StaticAnalysisSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface StaticAnalysisSection {
  /** 検出された問題 */
  issues: Issue[];
  
  /** 問題の統計 */
  statistics: {
    totalIssues: number;
    bySeverity: Record<string, number>;
    byPlugin: Record<string, number>;
    byFile: Record<string, number>;
  };
  
  /** コード品質メトリクス */
  metrics: {
    /** テストカバレッジ（推定） */
    estimatedCoverage?: number;
    
    /** アサーション密度 */
    assertionDensity?: number;
    
    /** テスト構造品質スコア */
    testStructureScore?: number;
  };
}

// 注意: QualityScoreSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface QualityScoreSection {
  /** 総合スコア（0-100） */
  overall: number;
  
  /** カテゴリ別スコア */
  categories: {
    /** ドメイン適合度 */
    domainAlignment: number;
    
    /** テスト完全性 */
    testCompleteness: number;
    
    /** コード品質 */
    codeQuality: number;
    
    /** セキュリティ */
    security: number;
    
    /** 保守性 */
    maintainability: number;
  };
  
  /** スコアの根拠 */
  rationale: string[];
}

// 注意: RecommendationSectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RecommendationSection {
  /** 優先度付き改善提案 */
  items: Recommendation[];
  
  /** 推定改善効果 */
  estimatedImpact: {
    /** スコア改善見込み */
    scoreImprovement: number;
    
    /** 推定作業時間（時間） */
    estimatedEffort: number;
    
    /** ROI（投資対効果） */
    roi: number;
  };
}

// 注意: Recommendationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Recommendation {
  /** 提案ID */
  id: string;
  
  /** 優先度 */
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  /** 提案タイトル */
  title: string;
  
  /** 詳細説明 */
  description: string;
  
  /** 影響カテゴリ */
  category: 'domain' | 'test' | 'code' | 'security' | 'performance';
  
  /** 実装例 */
  example?: string;
  
  /** 関連ファイル */
  relatedFiles: string[];
  
  /** 推定作業時間（分） */
  estimatedMinutes: number;
}

// 注意: DomainAnalysisConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainAnalysisConfig {
  /** 分析対象プロジェクトのパス */
  projectPath: string;
  
  /** 除外するパターン（glob形式） */
  excludePatterns: string[];
  
  /** サポートする拡張子 */
  supportedExtensions: string[];
  
  /** 最小キーワード頻度（これ以下は無視） */
  minKeywordFrequency: number;
  
  /** 最大クラスタ数 */
  maxClusters: number;
}

// 注意: KeywordInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface KeywordInfo {
  /** キーワード */
  keyword: string;
  
  /** 出現頻度 */
  frequency: number;
  
  /** TF-IDFスコア */
  tfidfScore?: number;
  
  /** 出現ファイル */
  files: string[];
  
  /** 言語（日本語/英語など） */
  language?: string;
}

// 注意: DomainClusterは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainCluster {
  /** クラスタID */
  id: string;
  
  /** ドメイン名（ユーザーが確認・修正可能） */
  name: string;
  
  /** クラスタに含まれるキーワード */
  keywords: string[];
  
  /** クラスタの信頼度（0-1） */
  confidence: number;
  
  /** クラスタに関連するファイル */
  files: string[];
  
  /** 中心となるキーワード（重心） */
  centroid?: string[];
}

// 注意: IntegrityHashは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IntegrityHash {
  /** SHA-256ハッシュ値 */
  hash: string;
  
  /** ハッシュ生成時刻 */
  timestamp: Date;
  
  /** ハッシュ対象のデータバージョン */
  version: string;
}

// 注意: DomainAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainAnalysisResult {
  /** 検出されたドメインクラスタ */
  domains: DomainCluster[];
  
  /** 抽出されたキーワード情報 */
  keywords: Map<string, KeywordInfo>;
  
  /** 整合性ハッシュ */
  integrity?: IntegrityHash;
  
  /** 分析実行時刻 */
  timestamp: Date;
  
  /** 分析メタデータ */
  metadata?: {
    totalFiles: number;
    totalTokens: number;
    executionTime: number;
    languageDistribution?: Map<string, number>;
  };
}

// 注意: LanguageDetectionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LanguageDetectionResult {
  /** 検出された言語（ISO 639-3コード） */
  language: string;
  
  /** 信頼度スコア */
  confidence: number;
}

// 注意: TFIDFVectorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TFIDFVector {
  /** ドキュメントID（ファイルパス） */
  documentId: string;
  
  /** TF-IDFベクトル値 */
  vector: Map<string, number>;
}

// 注意: ClusteringConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ClusteringConfig {
  /** クラスタ数（K-MeansのK） */
  k: number;
  
  /** 最大反復回数 */
  maxIterations?: number;
  
  /** 収束閾値 */
  tolerance?: number;
}

// 注意: UserValidationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface UserValidationResult {
  /** ユーザーが承認したドメイン */
  approvedDomains: DomainCluster[];
  
  /** ユーザーが修正したドメイン */
  modifiedDomains: DomainCluster[];
  
  /** ユーザーが拒否したドメイン */
  rejectedDomains: DomainCluster[];
  
  /** 検証完了フラグ */
  validated: boolean;
}

// 注意: DomainDefinitionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainDefinition {
  /** スキーマバージョン */
  version: string;
  
  /** プロジェクト情報 */
  project: {
    name: string;
    path: string;
    analyzed: Date;
  };
  
  /** ドメインクラスタ */
  domains: DomainCluster[];
  
  /** 整合性ハッシュ */
  integrity: IntegrityHash;
  
  /** メタデータ */
  metadata?: Record<string, unknown>;
}

// 注意: UsageStatsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface UsageStats {
  totalAnalyses: number;
  averageTime: number;
  filesAnalyzed: number;
  issuesFound: number;
  frequency?: number;
}

// 注意: AccuracyAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface AccuracyAnalysis {
  falsePositiveRate: number;
  commonFalsePositives: string[];
  missedIssueRate?: number;
  topProblematicPatterns?: string[];
}

// 注意: PerformanceAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface PerformanceAnalysis {
  averageAnalysisTime: number;
  slowFiles: string[];
  slowestOperations?: string[];
  memoryUsageComplaints?: number;
}

// 注意: FeatureUsageAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface FeatureUsageAnalysis {
  mostUsed: Array<{ feature: string; count: number }>;
  requested: Array<{ feature: string; count: number }>;
  mostUsedFeatures?: string[];
  leastUsedFeatures?: string[];
  requestedFeatures?: string[];
}

// 注意: ProjectFeedbackは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ProjectFeedback {
  projectId: string;
  projectName: string;
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'other';
  projectSize: {
    fileCount: number;
    testCount: number;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
  };
  usageMetrics: {
    analysisFrequency: number; // per week
    averageAnalysisTime: number; // ms
    issuesDetected: number;
    issuesResolved: number;
  };
  userExperience: {
    satisfaction: number; // 1-10
    easeOfUse: number; // 1-10
    accuracyRating: number; // 1-10
    performanceRating: number; // 1-10
    overallValue: number; // 1-10
  };
  specificFeedback: {
    mostUsefulFeatures: string[];
    painPoints: string[];
    improvementSuggestions: string[];
    falsePositives: FalsePositiveReport[];
    missedIssues: MissedIssueReport[];
  };
  timestamp: Date;
}

// 注意: FalsePositiveReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FalsePositiveReport {
  issueType: string;
  description: string;
  codeSnippet: string;
  expectedBehavior: string;
  actualBehavior: string;
  impact: 'low' | 'medium' | 'high';
  frequency: number;
}

// 注意: MissedIssueReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MissedIssueReport {
  description: string;
  securityImplication: string;
  codeSnippet: string;
  suggestedDetection: string;
  impact: 'low' | 'medium' | 'high';
}

// 注意: FeedbackAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FeedbackAnalysisResult {
  overallSatisfaction: number;
  commonPainPoints: string[];
  prioritizedImprovements: ImprovementItem[];
  accuracyIssues: {
    falsePositiveRate: number;
    missedIssueRate: number;
    topProblematicPatterns: string[];
  };
  performanceIssues: {
    averageAnalysisTime: number;
    slowestOperations: string[];
    memoryUsageComplaints: number;
  };
  featureUsage: {
    mostUsedFeatures: string[];
    leastUsedFeatures: string[];
    requestedFeatures: string[];
  };
}

// 注意: ImprovementItemは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ImprovementItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  category: 'accuracy' | 'performance' | 'usability' | 'features';
  affectedUsers: number;
  estimatedImplementationTime: string;
}

// 注意: IndividualFeedbackは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface IndividualFeedback {
  issueId: string;
  falsePositive?: boolean;
  actualSeverity?: string;
  userComment?: string;
  timestamp?: Date;
  rule?: string;
  impact?: string;
}

// 注意: PerformanceDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface PerformanceData {
  file: string;
  analysisTime: number;
}

// 注意: TimeImpactDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface TimeImpactData {
  issueId: string;
  timeSpentInvestigating: number;
  wasRealIssue: boolean;
}

// 注意: MergeStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum MergeStrategy {
  SINGLE = 'single',           // 単一AST（マージ不要）
  SEQUENTIAL = 'sequential',   // 順次マージ
  HIERARCHICAL = 'hierarchical', // 階層的マージ
  INTELLIGENT = 'intelligent'  // インテリジェントマージ（重複削除等）
}

// 注意: MergeErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface MergeError {
  type: 'structure' | 'position' | 'validation';
  message: string;
  location?: { row: number; column: number };
}

// 注意: MergeMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MergeMetadata {
  strategy: MergeStrategy;
  nodeCount: number;
  mergedChunks: number;
  positionsAdjusted: boolean;
  hasOverlap: boolean;
  structureValid: boolean;
  errors: MergeError[];
  warnings: string[];
  duplicatesRemoved?: number;
  hasErrors?: boolean;
  errorNodes?: number;
  recoverable?: boolean;
  mergeTime?: number;
}

// 注意: MergeResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MergeResult {
  ast: ASTNode;
  metadata: MergeMetadata;
}

// 注意: ASTMergerConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ASTMergerConfig {
  validateStructure?: boolean;
  preservePositions?: boolean;
  mergeStrategy?: MergeStrategy;
  removeduplicates?: boolean;
}

// 注意: ParserStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum ParserStrategy {
  TREE_SITTER = 'tree-sitter',
  BABEL = 'babel',
  HYBRID = 'hybrid',
  SMART_CHUNKING = 'smart-chunking'
}

// 注意: ParseMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ParseMetadata {
  strategy: ParserStrategy;
  truncated: boolean;
  originalSize: number;
  parsedSize: number;
  parseTime: number;
  fallbackReason?: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
    lastCompleteBoundary?: number;
  };
  // SmartChunking関連
  chunked?: boolean;
  chunks?: number;
  astsMerged?: number;
  mergeStrategy?: string;
  syntaxBoundaryChunking?: boolean;
  hasErrors?: boolean;
  recoverable?: boolean;
  nodeCount?: number;
  cacheHit?: boolean;
  language?: string;
}

// 注意: ParseResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ParseResult {
  ast: ASTNode;
  metadata: ParseMetadata;
}

// 注意: HybridParserConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface HybridParserConfig {
  /** 32KB制限 - tree-sitterの最大サイズ */
  maxTreeSitterSize?: number;
  /** フォールバック戦略を有効化 */
  enableFallback?: boolean;
  /** スマート切り詰めを有効化 */
  enableSmartTruncation?: boolean;
  /** 警告表示を有効化 */
  enableWarnings?: boolean;
  /** SmartChunkingを有効化 */
  enableSmartChunking?: boolean;
  /** チャンキングを開始するサイズ */
  chunkingThreshold?: number;
}

// 注意: BusinessLogicMappingは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BusinessLogicMapping {
  /**
   * テストファイルパス
   */
  testFilePath: string;
  
  /**
   * 関連するビジネスロジックファイル
   */
  businessLogicFiles: BusinessLogicFile[];
  
  /**
   * カバレッジの深さ（0-1）
   */
  coverageDepth: number;
  
  /**
   * ビジネスクリティカル度
   */
  businessCriticality: BusinessCriticality;
  
  /**
   * 影響範囲
   */
  impactScope: ImpactScope;
  
  /**
   * リスク評価
   */
  riskAssessment: RiskAssessment;
}

// 注意: BusinessLogicFileは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BusinessLogicFile {
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * ドメイン情報
   */
  domain: DomainInference;
  
  /**
   * 関数/メソッド一覧
   */
  functions: BusinessFunction[];
  
  /**
   * 重要度スコア（0-100）
   */
  importanceScore: number;
}

// 注意: BusinessFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BusinessFunction {
  /**
   * 関数名
   */
  name: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * テストされているか
   */
  isTested: boolean;
  
  /**
   * 複雑度
   */
  complexity: number;
  
  /**
   * 依存関係の数
   */
  dependencyCount: number;
  
  /**
   * ビジネスルールを含むか
   */
  containsBusinessRules: boolean;
}

// 注意: BusinessCriticalityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BusinessCriticality {
  /**
   * レベル
   */
  level: 'critical' | 'high' | 'medium' | 'low';
  
  /**
   * 理由
   */
  reasons: string[];
  
  /**
   * スコア（0-100）
   */
  score: number;
}

// 注意: ImpactScopeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ImpactScope {
  /**
   * 直接影響を受けるファイル数
   */
  directImpact: number;
  
  /**
   * 間接影響を受けるファイル数
   */
  indirectImpact: number;
  
  /**
   * 影響を受けるドメイン
   */
  affectedDomains: string[];
  
  /**
   * クリティカルパスに含まれるか
   */
  onCriticalPath: boolean;
}

// 注意: DomainImportanceConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainImportanceConfig {
  /**
   * 重要度レベルごとの重み
   */
  weightMap?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /**
   * クリティカルドメインのリスト
   */
  criticalDomains?: string[];
  
  /**
   * ドメインボーナスポイント
   */
  domainBonus?: number;
  
  /**
   * 特定ドメインの重要度強制設定を無効化
   */
  disableDomainOverrides?: boolean;
}

// 注意: IBusinessLogicMapperは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IBusinessLogicMapper {
  /**
   * テストファイルからビジネスロジックへのマッピング
   */
  mapTestToBusinessLogic(
    testFilePath: string,
    callGraph: CallGraphNode[],
    typeInfo: Map<string, TypeInfo>
  ): Promise<BusinessLogicMapping>;
  
  /**
   * ビジネス重要度の計算
   */
  calculateBusinessImportance(
    functions: BusinessFunction[],
    domain: DomainInference
  ): Promise<BusinessCriticality>;
  
  /**
   * 影響範囲の分析
   */
  analyzeImpactScope(
    callGraph: CallGraphNode[],
    startNode: CallGraphNode
  ): Promise<ImpactScope>;
  
  /**
   * ビジネスルールの検出
   */
  detectBusinessRules(
    functionBody: string,
    typeInfo: Map<string, TypeInfo>
  ): Promise<boolean>;
  
  /**
   * クリティカルパスの判定
   */
  isOnCriticalPath(
    node: CallGraphNode,
    domains: string[]
  ): Promise<boolean>;
  
  /**
   * ドメイン重要度設定を適用
   */
  setDomainImportanceConfig(config: DomainImportanceConfig): void;
}

// 注意: DomainInferenceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainInference {
  /**
   * 推論されたドメイン名
   */
  domain: string;
  
  /**
   * 推論の信頼度（0-1）
   */
  confidence: number;
  
  /**
   * 関連する概念
   */
  concepts: string[];
  
  /**
   * ビジネス重要度
   */
  businessImportance: BusinessImportance;
  
  /**
   * 関連するドメイン（オプション）
   */
  relatedDomains?: string[];
}

// 注意: BusinessImportanceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type BusinessImportance = 'critical' | 'high' | 'medium' | 'low';

// 注意: DomainDictionaryEntryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainDictionaryEntry {
  /**
   * 用語
   */
  term: string;
  
  /**
   * ドメイン
   */
  domain: string;
  
  /**
   * 重み（0-1）
   */
  weight: number;
}

// 注意: ConfidenceConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ConfidenceConfig {
  /**
   * タイプ名に対する信頼度のマッピング
   */
  typeConfidenceMap?: Record<string, number>;
  
  /**
   * ドメインに対する信頼度のマッピング
   */
  domainConfidenceMap?: Record<string, number>;
  
  /**
   * デフォルトの信頼度
   */
  defaultConfidence?: number;
  
  /**
   * 複数の証拠が重なった場合の信頼度増加率
   */
  evidenceBoostFactor?: number;
}

// 注意: IDomainInferenceEngineは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IDomainInferenceEngine {
  /**
   * 型情報からドメインを推論
   */
  inferDomainFromType(typeInfo: TypeInfo): Promise<DomainInference>;
  
  /**
   * 文脈情報からドメインを推論
   */
  inferDomainFromContext(context: DomainContext): Promise<DomainInference>;
  
  /**
   * ドメインのビジネス重要度を取得
   */
  getDomainImportance(domain: string): Promise<BusinessImportance>;
  
  /**
   * ドメイン辞書を読み込む
   */
  loadDictionary(dictionary: DomainDictionary): Promise<void>;
  
  /**
   * 複数の推論結果を統合
   */
  mergeInferences(inferences: DomainInference[]): DomainInference;
  
  /**
   * 信頼度設定を適用
   */
  setConfidenceConfig(config: ConfidenceConfig): void;
}

// 注意: TestIntentは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestIntent {
  /**
   * テストの意図を表す説明文
   */
  description: string;
  
  /**
   * テスト対象のメソッド/関数名
   */
  targetMethod?: string;
  
  /**
   * テストシナリオ（Given-When-Then形式）
   */
  scenario?: {
    given?: string;
    when?: string;
    then?: string;
  };
  
  /**
   * テストのタイプ（unit, integration, e2e等）
   */
  testType: TestType;
  
  /**
   * 期待される動作
   */
  expectedBehavior: string[];
  
  /**
   * カバレッジ範囲
   */
  coverageScope: CoverageScope;
}

// 注意: CoverageScopeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CoverageScope {
  /**
   * ハッピーパスのカバレッジ
   */
  happyPath: boolean;
  
  /**
   * エラーケースのカバレッジ
   */
  errorCases: boolean;
  
  /**
   * エッジケースのカバレッジ
   */
  edgeCases: boolean;
  
  /**
   * 境界値のカバレッジ
   */
  boundaryValues: boolean;
}

// 注意: TestRealizationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestRealizationResult {
  /**
   * 意図した内容
   */
  intent: TestIntent;
  
  /**
   * 実際のテストコード分析結果
   */
  actual: ActualTestAnalysis;
  
  /**
   * ギャップ分析
   */
  gaps: TestGap[];
  
  /**
   * 実現度スコア（0-100）
   */
  realizationScore: number;
  
  /**
   * リスクレベル
   */
  riskLevel: IntentRiskLevel;
  
  /**
   * テストファイルパス（レポート生成用）
   */
  file?: string;
  
  /**
   * テストの説明（レポート生成用）
   */
  description?: string;
}

// 注意: ActualTestAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ActualTestAnalysis {
  /**
   * 実際にテストされているメソッド
   */
  actualTargetMethods: string[];
  
  /**
   * 実際のアサーション
   */
  assertions: TestAssertion[];
  
  /**
   * 実際のカバレッジ
   */
  actualCoverage: CoverageScope;
  
  /**
   * テストの複雑度
   */
  complexity: number;
}

// 注意: TestAssertionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestAssertion {
  type: string;
  expected: string;
  actual: string;
  location: {
    line: number;
    column: number;
  };
}

// 注意: TestGapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestGap {
  /**
   * ギャップの種類
   */
  type: GapType;
  
  /**
   * ギャップの説明
   */
  description: string;
  
  /**
   * 重要度
   */
  severity: Severity;
  
  /**
   * 改善提案
   */
  suggestions: string[];
}

// 注意: GapTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum GapType {
  MISSING_ASSERTION = 'missing_assertion',
  INCOMPLETE_COVERAGE = 'incomplete_coverage',
  WRONG_TARGET = 'wrong_target',
  MISSING_ERROR_CASE = 'missing_error_case',
  MISSING_EDGE_CASE = 'missing_edge_case',
  UNCLEAR_INTENT = 'unclear_intent'
}

// 注意: Severityは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// 注意: IntentRiskLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum IntentRiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
}

// 注意: ITestIntentAnalyzerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ITestIntentAnalyzer {
  /**
   * テストファイルから意図を抽出
   */
  extractIntent(testFilePath: string, ast: ASTNode): Promise<TestIntent>;
  
  /**
   * 実際のテスト実装を分析
   */
  analyzeActualTest(testFilePath: string, ast: ASTNode): Promise<ActualTestAnalysis>;
  
  /**
   * テスト意図と実装のギャップを評価
   */
  evaluateRealization(
    intent: TestIntent,
    actual: ActualTestAnalysis
  ): Promise<TestRealizationResult>;
  
  /**
   * リスク評価
   */
  assessRisk(gaps: TestGap[]): IntentRiskLevel;
}

// 注意: TypeInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeInfo {
  /**
   * 型の名前
   */
  typeName: string;
  
  /**
   * プリミティブ型かどうか
   */
  isPrimitive: boolean;
  
  /**
   * ジェネリック型の場合の型引数
   */
  typeArguments?: TypeInfo[];
  
  /**
   * ユニオン型の場合の構成型
   */
  unionTypes?: TypeInfo[];
  
  /**
   * 関数型の場合のシグネチャ
   */
  functionSignature?: {
    parameters: TypeInfo[];
    returnType: TypeInfo;
  };
}

// 注意: CallGraphNodeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CallGraphNode {
  /**
   * 関数/メソッド名
   */
  name: string;
  
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * この関数が呼び出す関数
   */
  calls: CallGraphNode[];
  
  /**
   * この関数を呼び出す関数
   */
  calledBy: CallGraphNode[];
}

// 注意: MockInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MockInfo {
  /**
   * モックされているモジュール/関数
   */
  mockedTarget: string;
  
  /**
   * モックのタイプ（jest.mock, sinon.stub等）
   */
  mockType: 'jest.mock' | 'jest.fn' | 'sinon.stub' | 'other';
  
  /**
   * モックの実装があるかどうか
   */
  hasImplementation: boolean;
  
  /**
   * モックの場所
   */
  location: {
    file: string;
    line: number;
  };
}

// 注意: ExecutionPathは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ExecutionPath {
  /**
   * パスのID
   */
  id: string;
  
  /**
   * パスの開始点
   */
  start: CallGraphNode;
  
  /**
   * パスの終了点
   */
  end: CallGraphNode;
  
  /**
   * 経由するノード
   */
  nodes: CallGraphNode[];
  
  /**
   * 条件分岐
   */
  conditions: string[];
  
  /**
   * このパスがテストされているか
   */
  isTested: boolean;
}

// 注意: ITypeScriptAnalyzerは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ITypeScriptAnalyzer {
  /**
   * TypeScriptプロジェクトを初期化
   */
  initialize(configPath: string): Promise<void>;
  
  /**
   * ファイルの型情報を取得
   */
  getTypeInfo(filePath: string, position: number): Promise<TypeInfo | undefined>;
  
  /**
   * 関数/メソッドの呼び出しグラフを構築
   */
  buildCallGraph(filePath: string): Promise<CallGraphNode[]>;
  
  /**
   * モックの使用状況を検出
   */
  detectMocks(filePath: string): Promise<MockInfo[]>;
  
  /**
   * 実行パスを解析
   */
  analyzeExecutionPaths(filePath: string): Promise<ExecutionPath[]>;
  
  /**
   * 型の互換性をチェック
   */
  checkTypeCompatibility(expected: TypeInfo, actual: TypeInfo): boolean;
  
  /**
   * 未使用のエクスポートを検出
   */
  findUnusedExports(filePath: string): Promise<string[]>;
}

// 注意: TestPatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type TestPattern = 'happy-path' | 'error-case' | 'edge-case' | 'boundary-value' | 'unknown';

// 注意: DetailedPatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type DetailedPattern = TestPattern | 'null-check' | 'empty-array' | 'null-return';

// 注意: ChunkingStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum ChunkingStrategy {
  SINGLE = 'single',      // 単一チャンク（小さいファイル）
  MULTIPLE = 'multiple',  // 複数チャンク（大きいファイル）
  STREAMING = 'streaming' // ストリーミング（将来拡張）
}

// 注意: ChunkMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ChunkMetadata {
  strategy: ChunkingStrategy;
  chunks: number;
  chunkReadCalls: number;
  maxChunkSize: number;
  encoding: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
  };
  errors?: Array<{
    chunk: number;
    message: string;
    position?: { row: number; column: number };
  }>;
  partialParse?: boolean;
  parseTime?: number;
  cacheHit?: boolean;
  language?: string;
}

// 注意: ChunkParseResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ChunkParseResult {
  ast: ASTNode;
  metadata: ChunkMetadata;
}

// 注意: SmartChunkingConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SmartChunkingConfig {
  chunkSize?: number;     // デフォルト: 30000 (30KB)
  enableDebug?: boolean;
  enableCache?: boolean;
}

// 注意: ChunkInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  content: string;
}

// 注意: DomainGapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface DomainGap {
  type: string;
  domain: string;
  description: string;
  recommendation?: string;
  severity: Severity;
}

// 注意: BusinessMappingは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface BusinessMapping {
  domain: string;
  functions: string[];
  coveredFunctions: string[];
  uncoveredFunctions: string[];
  coverage: number;
}

// 注意: Suggestionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface Suggestion {
  type: string;
  description: string;
  priority: string;
  impact: string;
  example?: string;
}

// 注意: SupportedLanguageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  TSX = 'tsx',
  JSX = 'jsx'
}

// 注意: WorkerDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface WorkerData {
  files: string[];
}

// 注意: WorkerResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface WorkerResult {
  results: TestRealizationResult[];
  error?: string;
}

// 注意: VulnerabilityRecommendationは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface VulnerabilityRecommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  timeline: string;
  technicalDetails?: string;
  references?: string[];
}

// 注意: CombinedVulnerabilityAssessmentは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CombinedVulnerabilityAssessment {
  overallRiskLevel: RiskLevel;
  vulnerabilityCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  minimalCount: number;
  recommendations?: VulnerabilityRecommendation[];
}

// 注意: VulnerabilityChainは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface VulnerabilityChain {
  chainId: string;
  vulnerabilityIds: string[];
  chainedRisk: RiskLevel;
  description: string;
  attackScenario?: string;
}

// 注意: CriticalPathは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CriticalPath {
  pathId: string;
  pathName: string;
  components: string[];
  businessValue: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  downTimeImpact: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}

// 注意: CriticalPathImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CriticalPathImpact {
  riskLevel: RiskLevel;
  businessImpactScore: number;
  urgency: 'IMMEDIATE' | 'URGENT' | 'PLANNED' | 'DEFERRED';
}

// 注意: AffectedAssetは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AffectedAsset {
  assetId: string;
  type: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}

// 注意: DowntimeInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DowntimeInfo {
  estimatedHours: number;
  revenuePerHour: number;
  operationalCostPerHour: number;
}

// 注意: FinancialImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FinancialImpact {
  totalLoss: number;
  revenueLoss: number;
  operationalCost: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// 注意: ComplianceInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ComplianceInfo {
  regulation: string;
  violationType: string;
  affectedRecords: number;
  maxPenalty: number;
}

// 注意: ComplianceImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ComplianceImpact {
  riskLevel: RiskLevel;
  potentialPenalty: number;
  reputationalDamage: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
}

// 注意: IncidentInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IncidentInfo {
  type: string;
  publicExposure: 'HIGH' | 'MEDIUM' | 'LOW';
  mediaAttention: 'SIGNIFICANT' | 'MODERATE' | 'MINIMAL';
  customerImpact: number;
}

// 注意: ReputationImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ReputationImpact {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recoveryTime: 'YEARS' | 'MONTHS' | 'WEEKS' | 'DAYS';
  customerTrustLoss: number;
}

// 注意: CustomerImpactInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CustomerImpactInfo {
  affectedCustomers: number;
  averageLifetimeValue: number;
  churnProbability: number;
}

// 注意: CustomerChurnRiskは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CustomerChurnRisk {
  potentialRevenueLoss: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// 注意: IntegratedImpactsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IntegratedImpacts {
  technical: { severity: string; score: number };
  business: { severity: string; score: number };
  financial: { severity: string; score: number };
  reputation: { severity: string; score: number };
}

// 注意: OverallImpactResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface OverallImpactResult {
  combinedScore: number;
  primaryRisk: string;
  riskLevel: RiskLevel;
}

// 注意: TimeFactorsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TimeFactors {
  immediateImpact: string;
  shortTermImpact: string;
  longTermImpact: string;
  recoveryTime: number;
}

// 注意: TemporalImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TemporalImpact {
  urgencyLevel: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  escalationRisk: boolean;
}

// 注意: ImpactInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ImpactInfo {
  level: ImpactLevel;
  type: string;
  affectedSystems: string[];
}

// 注意: MitigationStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MitigationStrategy {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  strategy: string;
  estimatedEffort: string;
}

// 注意: IncidentDetailは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IncidentDetail {
  impactLevel: ImpactLevel;
  affectedComponents: number;
  estimatedDowntime: number;
}

// 注意: RecoveryPlanは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RecoveryPlan {
  phases: RecoveryPhase[];
  totalEstimatedTime: number;
  criticalMilestones: string[];
}

// 注意: RecoveryPhaseは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RecoveryPhase {
  name: string;
  duration: number;
  tasks: string[];
}

// 注意: VulnerabilityAssessmentは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface VulnerabilityAssessment {
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** 悪用可能性の確率（0-1） */
  exploitProbability: number;
  /** 総合スコア（0-100） */
  overallScore: number;
  /** 評価の詳細説明 */
  description?: string;
}

// 注意: RiskComponentsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskComponents {
  threatScore: number;
  vulnerabilityScore: number;
  impactScore: number;
  likelihoodScore: number;
}

// 注意: RiskWeightsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskWeights {
  threat: number;
  vulnerability: number;
  impact: number;
  likelihood: number;
}

// 注意: OverallRiskScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface OverallRiskScore {
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
}

// 注意: AggregatedRiskは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AggregatedRisk {
  totalRisks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  minimalCount: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
}

// 注意: CategoryRiskは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CategoryRisk {
  count: number;
  averageScore: number;
  maxRiskLevel: RiskLevel;
  risks: any[];
}

// 注意: RiskTrendは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskTrend {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  changeRate: number;
  projection: number;
}

// 注意: RecommendedActionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RecommendedAction {
  priority: 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  estimatedEffort: string;
  expectedRiskReduction: number;
}

// 注意: ThreatSourceTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ThreatSourceType = 'ADVERSARIAL' | 'ACCIDENTAL' | 'STRUCTURAL' | 'ENVIRONMENTAL';

// 注意: CapabilityLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type CapabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

// 注意: IntentLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type IntentLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

// 注意: TargetingLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type TargetingLevel = 'NONE' | 'OPPORTUNISTIC' | 'FOCUSED' | 'SPECIFIC';

// 注意: LikelihoodLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type LikelihoodLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

// 注意: ImpactLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ImpactLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

// 注意: ExploitabilityLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ExploitabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

// 注意: DetectabilityLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type DetectabilityLevel = 'VERY_HARD' | 'HARD' | 'MODERATE' | 'EASY' | 'VERY_EASY';

// 注意: RelevanceLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type RelevanceLevel = 'CONFIRMED' | 'EXPECTED' | 'ANTICIPATED' | 'PREDICTED' | 'POSSIBLE';

// 注意: ThreatSourceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ThreatSource {
  /** 脅威源ID */
  id: string;
  /** 脅威源名 */
  name: string;
  /** 脅威源タイプ */
  type: ThreatSourceType;
  /** 能力レベル */
  capability: CapabilityLevel;
  /** 意図レベル */
  intent: IntentLevel;
  /** ターゲティングレベル */
  targeting: TargetingLevel;
  /** 説明（オプション） */
  description?: string;
}

// 注意: ThreatEventは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ThreatEvent {
  /** 脅威イベントID */
  id: string;
  /** 脅威イベントの説明 */
  description: string;
  /** 関連する脅威源ID */
  threatSources: string[];
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響度 */
  impact: ImpactLevel;
  /** 関連性 */
  relevance: RelevanceLevel;
  /** 戦術・技術・手順（オプション） */
  ttps?: string[];
}

// 注意: Vulnerabilityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Vulnerability {
  /** 脆弱性ID */
  id: string;
  /** 脆弱性タイプ（オプション） */
  type?: string;
  /** 脆弱性の説明 */
  description: string;
  /** 深刻度 */
  severity: SeverityLevel;
  /** 悪用可能性 */
  exploitability: ExploitabilityLevel;
  /** 検出可能性 */
  detectability: DetectabilityLevel;
  /** 影響を受けるコンポーネント（オプション） */
  affectedComponent?: string;
  /** 影響を受ける資産 */
  affectedAssets?: string[];
  /** CVE ID（オプション） */
  cveId?: string;
  /** CWE ID（オプション） */
  cweId?: string;
  /** CVSS スコア（オプション） */
  cvss?: number;
  /** CVSSスコア（レガシー互換）（オプション） */
  cvssScore?: number;
  /** 攻撃ベクトル（オプション） */
  attackVector?: string;
}

// 注意: NISTRiskMatrixは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface NISTRiskMatrix {
  /** 脅威の可能性 */
  threatLikelihood: LikelihoodLevel;
  /** 脆弱性の深刻度 */
  vulnerabilitySeverity: SeverityLevel;
  /** 影響レベル */
  impactLevel: ImpactLevel;
}

// 注意: ThreatEventAssessmentは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ThreatEventAssessment {
  /** 脅威イベントID */
  eventId: string;
  /** 総合的な可能性 */
  overallLikelihood: LikelihoodLevel;
  /** 総合的な影響 */
  overallImpact: ImpactLevel;
  /** 寄与する脅威源 */
  contributingSources: string[];
}

// 注意: EnvironmentalImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface EnvironmentalImpact {
  /** 脅威源ID */
  threatSourceId: string;
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響範囲 */
  scope: 'LIMITED' | 'MODERATE' | 'EXTENSIVE';
  /** 復旧時間 */
  recoveryTime: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
}

// 注意: Threatは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Threat {
  id: string;
  name: string;
  category: string;
  likelihood: LikelihoodLevel | string;
  description: string;
}

// 注意: Impactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Impact {
  id: string;
  description: string;
  level: ImpactLevel;
  affectedAssets: string[];
  businessImpact?: string;
  financialImpact?: number;
}

// 注意: RiskMatrixは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskMatrix {
  threatLikelihood: LikelihoodLevel;
  vulnerabilitySeverity: SeverityLevel;
  impactLevel: ImpactLevel;
}

// 注意: RiskRecommendationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskRecommendation {
  /** 優先度 */
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 推奨アクション */
  action: string;
  /** 実施タイムライン */
  timeline: string;
  /** 期待される効果 */
  expectedBenefit: string;
  /** 実装の複雑さ */
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 推定コスト */
  estimatedCost?: 'LOW' | 'MEDIUM' | 'HIGH';
}

// 注意: RiskItemは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskItem {
  /** アイテムID */
  id: string;
  /** リスクレベル */
  level: string;
  /** その他のプロパティ */
  [key: string]: any;
}

// 注意: BusinessImpactは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum BusinessImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 注意: TechnicalComplexityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum TechnicalComplexity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

// 注意: UrgencyLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type UrgencyLevel = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';

// 注意: EstimatedEffortは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type EstimatedEffort = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

// 注意: RiskPriorityRequestは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskPriorityRequest {
  /** リスクID（オプション） */
  riskId?: string;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** ビジネスインパクト */
  businessImpact: BusinessImpact;
  /** 技術的複雑性 */
  technicalComplexity: TechnicalComplexity;
  /** 影響を受けるコンポーネント数 */
  affectedComponents: number;
  /** 依存関係の数 */
  dependencies: number;
  /** クリティカルパス上にあるか */
  isOnCriticalPath?: boolean;
  /** カスタム重み付け（オプション） */
  customWeights?: PriorityWeights;
}

// 注意: PriorityWeightsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PriorityWeights {
  /** リスクレベルの重み（デフォルト: 0.4） */
  riskWeight?: number;
  /** ビジネスインパクトの重み（デフォルト: 0.3） */
  businessWeight?: number;
  /** 技術的複雑性の重み（デフォルト: 0.2） */
  complexityWeight?: number;
  /** スコープの重み（デフォルト: 0.1） */
  scopeWeight?: number;
}

// 注意: PriorityScoreBreakdownは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PriorityScoreBreakdown {
  /** 基本リスクスコア（0-100） */
  baseRiskScore: number;
  /** ビジネスインパクトスコア（0-1.5） */
  businessImpactScore: number;
  /** 技術的複雑性スコア（0-1） */
  technicalComplexityScore: number;
  /** スコープスコア（0-100） */
  scopeScore: number;
  /** 最終スコア（0-100） */
  finalScore: number;
}

// 注意: ResourceAllocationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ResourceAllocation {
  /** 推奨チームサイズ */
  recommendedTeamSize: number;
  /** 推定人日 */
  estimatedManDays: number;
  /** 必要な専門知識 */
  requiredExpertise: string[];
  /** 推奨スキルレベル */
  recommendedSkillLevel: 'ジュニア' | 'ミッド' | 'シニア' | 'エキスパート';
}

// 注意: RiskPriorityResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskPriorityResult {
  /** リスクID */
  riskId?: string;
  /** 優先度スコア（0-100） */
  priority: number;
  /** 緊急度 */
  urgency: UrgencyLevel;
  /** 推奨アクション */
  recommendedAction: string;
  /** 対応タイムライン */
  timeline: string;
  /** ビジネスインパクト倍率 */
  businessImpactMultiplier: number;
  /** 対応しやすさスコア（0-1） */
  easinessScore: number;
  /** 推定作業量 */
  estimatedEffort: EstimatedEffort;
  /** スコープスコア */
  scopeScore: number;
  /** クリティカルパス倍率 */
  criticalPathMultiplier?: number;
  /** スコアの内訳 */
  scoreBreakdown: PriorityScoreBreakdown;
  /** リソース配分の推奨 */
  resourceAllocation?: ResourceAllocation;
}

// 注意: PriorityScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PriorityScore {
  /** 総合スコア */
  total: number;
  /** 構成要素 */
  components: {
    risk: number;
    business: number;
    technical: number;
    scope: number;
  };
}

// 注意: MigrationStatsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MigrationStats {
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  MINIMAL: number;
}

// 注意: BatchMigrationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BatchMigrationResult<T> {
  /** 移行後の値 */
  migrated: T[];
  /** 移行統計 */
  stats: MigrationStats;
}

// 注意: DomainQualityScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DomainQualityScore extends QualityScore {
  domainCoverage?: number;
  businessRuleCompliance?: number;
  terminologyConsistency?: number;
}

// 注意: SecurityPatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityPattern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  column?: number;
}

// 注意: LogLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// 注意: LogMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LogMetadata {
  /** タイムスタンプ */
  timestamp?: number;
  /** プラグイン名 */
  plugin?: string;
  /** ファイルパス */
  filePath?: string;
  /** 行番号 */
  line?: number;
  /** 列番号 */
  column?: number;
  /** 追加のカスタムデータ */
  [key: string]: unknown;
}

// 注意: ErrorLogMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ErrorLogMetadata extends LogMetadata {
  /** エラー情報 */
  error?: {
    message?: string;
    stack?: string;
    name?: string;
    code?: string;
  };
}

// 注意: LogEntryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: LogMetadata | ErrorLogMetadata;
}

// 注意: PluginPerformanceConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PluginPerformanceConfig {
  /** バッチサイズ */
  batchSize?: number;
  /** 並列実行数 */
  parallelism?: number;
  /** メモリ制限（MB） */
  memoryLimit?: number;
  /** CPU使用率制限（%） */
  cpuLimit?: number;
}

// 注意: ExtendedPluginConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ExtendedPluginConfig extends PluginConfig {
  /** パフォーマンス設定 */
  performance?: PluginPerformanceConfig;
  /** 対象ファイルパターン */
  include?: string[];
  /** 除外ファイルパターン */
  exclude?: string[];
  /** 依存プラグイン */
  dependencies?: string[];
}

// 注意: TestCaseTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type TestCaseType = 'test' | 'describe' | 'it' | 'suite' | 'spec';

// 注意: TestFileStatsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestFileStats {
  /** 総テストケース数 */
  totalTests: number;
  /** describeブロック数 */
  describeBlocks: number;
  /** スキップされたテスト数 */
  skippedTests: number;
  /** フォーカスされたテスト数 */
  focusedTests: number;
  /** 最大ネストレベル */
  maxNestingLevel: number;
}

// 注意: AnnotationLineは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface AnnotationLine {
  lineNumber: number;
  annotation: string;
}

// 注意: FileAnnotationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface FileAnnotation {
  filePath: string;
  originalContent: string;
  annotatedContent: string;
  annotationCount: number;
}

// 注意: IFormattingStrategyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IFormattingStrategy {
  name: string;
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): string | object;
  formatAsync?(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
}

// 注意: UnifiedReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface UnifiedReport {
  format: ReportFormat;
  content: string | object;
  timestamp: string;
  metadata?: {
    generatedBy: string;
    version: string;
    processingTime?: number;
  };
}

// 注意: ReportGenerationOptionsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ReportGenerationOptions {
  format?: ReportFormat;
  includeMetadata?: boolean;
  cacheEnabled?: boolean;
  parallelProcessing?: boolean;
  maxRisks?: number;
  includeRiskLevels?: string[];
  htmlReportPath?: string;
}

// 注意: ILegacyAdapterは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ILegacyAdapter {
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
  isDeprecated: boolean;
  deprecationMessage: string;
}

// 注意: DataFlowNodeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DataFlowNode {
  location: CodeLocation;
  type: string;
  description?: string;
}

// 注意: DataFlowは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DataFlow {
  source: DataFlowNode;
  sink: DataFlowNode;
  path: DataFlowNode[];
}

// 注意: ModuleCoverageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ModuleCoverage {
  coverage: number;
  testedFiles: number;
  untestedFiles: number;
}

// 注意: TestCoverageMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestCoverageMetrics {
  overall: number;
  byModule: Record<string, ModuleCoverage>;
  missingTests?: Array<{
    file: string;
    reason: string;
  }>;
}

// 注意: HighComplexityMethodは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface HighComplexityMethod {
  method: string;
  complexity: number;
  location: CodeLocation;
}

// 注意: CodeQualityMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CodeQualityMetrics {
  complexity?: {
    average: number;
    max: number;
    highComplexityMethods: HighComplexityMethod[];
  };
  maintainability?: {
    score: number;
    issues: string[];
  };
}

// 注意: AnalysisMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnalysisMetrics {
  testCoverage: TestCoverageMetrics;
  codeQuality: CodeQualityMetrics;
}

// 注意: StructuredAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface StructuredAnalysisResult {
  metadata: AnalysisMetadata;
  summary: AnalysisSummary;
  issues: Issue[];
  metrics: AnalysisMetrics;
  plugins?: Record<string, PluginResult>;
}

// 注意: AnnotationOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnnotationOptions {
  prefix?: string;
  format?: 'inline' | 'block';
  includeDataFlow?: boolean;
  overwrite?: boolean;
}

// 注意: LegacyConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LegacyConfig {
  plugins?: Record<string, {
    weight?: number;
    [key: string]: unknown;
  }>;
  quality?: {
    thresholds?: {
      excellent?: number;
      good?: number;
      acceptable?: number;
      poor?: number;
    };
    strictMode?: boolean;
  };
  strictMode?: boolean;
  scoring?: {
    enabled?: boolean;
    weights?: Partial<WeightConfig>;
    gradeThresholds?: Partial<Record<GradeType, number>>;
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
  [key: string]: unknown;
}

// 注意: JsonValueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;

// 注意: JsonObjectは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface JsonObject {
  [key: string]: JsonValue;
}

// 注意: JsonArrayは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface JsonArray extends Array<JsonValue> {}

// 注意: SanitizedConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SanitizedConfig {
  [key: string]: JsonValue;
}

// 注意: PartialScoringConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PartialScoringConfig {
  enabled?: boolean;
  weights?: {
    plugins?: Record<string, number>;
    dimensions?: Partial<Record<string, number>>;
  };
  gradeThresholds?: Partial<Record<GradeType, number>>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}

// 注意: ScoringConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ScoringConfig {
  enabled: boolean;
  weights: WeightConfig;
  gradeThresholds: Record<GradeType, number>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}

// 注意: ConfigValidationResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// 注意: SummaryReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SummaryReport {
  projectInfo: {
    path: string;
    overallScore: number;
    grade: GradeType;
    totalFiles: number;
    totalDirectories: number;
    generatedAt: Date;
    executionTime: number;
  };
  dimensionScores: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  topIssues: {
    dimension: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    affectedFiles: number;
  }[];
  recommendations: string[];
  metadata: {
    pluginCount: number;
    issueCount: number;
    averageFileScore: number;
    worstPerformingDimension: string;
    bestPerformingDimension: string;
  };
}

// 注意: DetailedReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DetailedReport {
  summary: SummaryReport;
  fileDetails: {
    filePath: string;
    score: number;
    grade: GradeType;
    dimensions: {
      name: string;
      score: number;
      weight: number;
      issues: string[];
    }[];
    issues: {
      dimension: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
      line?: number;
    }[];
    suggestions: string[];
  }[];
  directoryDetails: {
    directoryPath: string;
    score: number;
    grade: GradeType;
    fileCount: number;
    dimensionBreakdown: Record<string, number>;
    worstFile: string;
    bestFile: string;
  }[];
}

// 注意: TrendReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TrendReport {
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'declining' | 'stable';
  improvementRate: number; // パーセンテージ
  historicalData: {
    date: Date;
    score: number;
    grade: GradeType;
  }[];
  predictions: {
    nextWeekScore: number;
    nextMonthScore: number;
    confidence: number;
  };
  dimensionTrends: {
    dimension: string;
    trend: 'improving' | 'declining' | 'stable';
    changeRate: number;
  }[];
  recommendations: string[];
}

// 注意: HistoricalScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface HistoricalScore {
  date: Date;
  score: number;
  grade: GradeType;
}

// 注意: DimensionScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DimensionScore {
  score: number; // 0-100 (旧value)
  weight: number; // 重み付け係数
  issues: Issue[]; // 課題一覧
  contributors?: {
    pluginId: string;
    contribution: number;
  }[];
  details?: string;
}

// 注意: ScoreTrendは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ScoreTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  history: {
    timestamp: Date;
    score: number;
    commit?: string;
  }[];
  prediction?: {
    nextScore: number;
    confidence: number;
  };
}

// 注意: FileScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FileScore {
  filePath: string;
  overallScore: number; // 0-100
  dimensions: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  weights: WeightConfig; // レポート生成で必要
  metadata: {
    analysisTime: number;
    pluginResults: PluginResult[];
    issueCount: number;
  };
  pluginScores?: {
    [pluginId: string]: {
      score: number;
      weight: number;
      issues: Issue[];
    };
  };
  trend?: ScoreTrend;
}

// 注意: DirectoryScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DirectoryScore {
  directoryPath: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  fileCount: number;
  fileScores: FileScore[];
  dimensionScores: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  // レガシーサポート
  averageScore?: number;
  dimensions?: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  trend?: ScoreTrend;
}

// 注意: ProjectScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ProjectScore {
  projectPath: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalFiles: number;
  totalDirectories: number; // レポートで必要
  fileScores: FileScore[];
  directoryScores: DirectoryScore[];
  weights: WeightConfig;
  metadata: {
    generatedAt: Date;
    executionTime: number;
    pluginCount: number;
    issueCount: number;
  };
  // レガシーサポート
  averageScore?: number;
  dimensions?: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  distribution?: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  trend?: ScoreTrend;
}

// 注意: AggregatedScoreは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AggregatedScore {
  score: number;
  confidence: number;
  metadata: {
    aggregatedFrom: number;
    totalWeight: number;
    algorithm: string;
  };
}

// 注意: WeightConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface WeightConfig {
  // プラグイン重み
  plugins: {
    [pluginId: string]: number;
  };
  
  // ディメンション重み
  dimensions: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  
  // ファイルタイプ別重み
  fileTypes?: {
    [pattern: string]: number; // 例: "*.critical.test.ts": 2.0
  };
}

// 注意: ScoreHistoryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ScoreHistory {
  version: string;
  projectId: string;
  entries: Array<{
    timestamp: Date;
    commit?: string;
    branch?: string;
    scores: {
      project: ProjectScore;
      files: Map<string, FileScore>;
    };
    metadata: {
      rimorVersion: string;
      plugins: string[];
      duration: number;
    };
  }>;
}

// 注意: ScoreCacheは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ScoreCache {
  fileHash: Map<string, string>; // ファイルパス -> ハッシュ
  scores: Map<string, FileScore>; // ハッシュ -> スコア
  expiry: Date;
}

// 注意: DimensionTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type DimensionType = 'completeness' | 'correctness' | 'maintainability' | 'performance' | 'security';

// 注意: GradeTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type GradeType = 'A' | 'B' | 'C' | 'D' | 'F';

// 注意: IScoreCalculatorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IScoreCalculator {
  // ファイル単位のスコア算出
  calculateFileScore(
    file: string,
    pluginResults: PluginResult[]
  ): FileScore;
  
  // ディレクトリ単位のスコア算出
  calculateDirectoryScore(
    directory: string,
    fileScores: FileScore[]
  ): DirectoryScore;
  
  // プロジェクト全体のスコア算出
  calculateProjectScore(
    directoryScores: DirectoryScore[]
  ): ProjectScore;
  
  // カスタム集約ロジック
  aggregateScores(
    scores: QualityScore[],
    weights?: WeightConfig
  ): AggregatedScore;
}

// 注意: CLIValidationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CLIValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

// 注意: CLISecurityLimitsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CLISecurityLimits {
  /** 最大パス長 */
  maxPathLength: number;
  /** 最大出力ファイルサイズ (bytes) */
  maxOutputFileSize: number;
  /** 許可されるファイル拡張子 */
  allowedOutputExtensions: string[];
  /** 禁止されるディレクトリパターン */
  forbiddenDirectoryPatterns: string[];
  /** 環境変数検証有効化 */
  validateEnvironmentVariables: boolean;
}

// 注意: ConfigSecurityLimitsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ConfigSecurityLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大オブジェクト深度 */
  maxObjectDepth: number;
  /** 最大プロパティ数 */
  maxProperties: number;
  /** 最大配列長 */
  maxArrayLength: number;
  /** 最大文字列長 */
  maxStringLength: number;
}

// 注意: AggregatedResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface AggregatedResult {
  issues: SecurityIssue[];
  suggestions: SecurityImprovement[];
  totalMethods: number;
  averageScore: number;
}

// 注意: PerformanceStatsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface PerformanceStats {
  cacheHitRate: number;
  averageAnalysisTime: number;
  memoryUsage: number;
  workerUtilization: number;
}

// 注意: TaintSourceInfoは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintSourceInfo {
  id: string;
  name: string;
  type: TaintSource;
  location: { line: number; column: number };
  confidence: number;
  taintLevel?: 'high' | 'medium' | 'low';
}

// 注意: SanitizerInfoは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SanitizerInfo {
  id: string;
  type: SanitizerType;
  location: { line: number; column: number };
  effectiveness: number;
}

// 注意: SecuritySinkInfoは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecuritySinkInfo {
  id: string;
  type: string;
  location: { line: number; column: number };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 注意: TaintPropagationResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintPropagationResult {
  path: string[];
  taintLevel: TaintLevel;
  reachesExit: boolean;
}

// 注意: TaintFlowAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintFlowAnalysisResult {
  sanitizers: Array<{ function: string; type: SanitizerType }>;
  finalTaintLevel: 'clean' | 'tainted';
  paths: number;
  violations: SecurityViolation[];
}

// 注意: TaintViolationは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintViolation {
  type: string;
  severity: string;
  source: string;
  sink: string;
  description: string;
}

// 注意: ReachabilityAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ReachabilityAnalysisResult {
  deadCode: Array<{ function: string }>;
  reachabilityScore: number;
  totalNodes: number;
  unreachableNodes: number;
}

// 注意: CycleDetectionResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CycleDetectionResult {
  functions: string[];
  severity: 'low' | 'medium' | 'high';
}

// 注意: TypeFlowAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeFlowAnalysisResult {
  typeTransitions: TypeTransition[];
  finalType: string;
}

// 注意: TypeTransitionは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeTransition {
  from: string;
  to: string;
  location: { line: number; column: number };
}

// 注意: TypeViolationは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeViolation {
  type: string;
  from: string;
  to: string;
  severity: string;
  location: { line: number; column: number };
}

// 注意: QualityPredictionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface QualityPrediction {
  complexity: number;
  securityRelevance: number;
  testingNeeds: TestingNeeds;
  recommendedTestTypes: string[];
  estimatedTestCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 注意: TestingNeedsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface TestingNeeds {
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number;
  requiredCoverage: number;
}

// 注意: VariableDeclarationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface VariableDeclaration {
  name: string;
  type: string;
  initializer: string;
  line: number;
}

// 注意: InferredSecurityTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface InferredSecurityType {
  type: SecurityType;
  taintLevel: TaintLevel;
  confidence: number;
  evidence: string[];
}

// 注意: SecurityApiCallは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface SecurityApiCall {
  method: string;
  securityType: SecurityType;
  resultTaintLevel: TaintLevel;
  variable?: string;
}

// 注意: UserInputDetectionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface UserInputDetection {
  variable: string;
  source: string;
  confidence: number;
}

// 注意: LocalContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface LocalContext {
  method: string;
  variables: string[];
  imports: string[];
  libraries: string[];
  complexity: number;
}

// 注意: AnalyzedSignatureは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface AnalyzedSignature extends MethodSignature {
  securityRelevant: boolean;
  taintSources: string[];
  potentialSinks: string[];
  requiredValidations: string[];
}

// 注意: TaintPathは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface TaintPath {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
}

// 注意: CriticalFlowは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CriticalFlow {
  id: string;
  source: string;
  sink: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

// 注意: TaintPropagationStepは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintPropagationStep {
  from: string;
  to: string;
  operation: string;
  taintLevel: TaintLevel;
}

// 注意: FlowPathは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FlowPath {
  id?: string;
  nodes: string[];
  taintLevel?: TaintLevel;
  passedThroughSanitizer?: boolean;
  reachesSecuritySink?: boolean;
  confidence?: number;
  metadata?: {
    source?: string;
    sink?: string;
    variables?: string[];
    [key: string]: unknown;
  };
}

// 注意: ExtendedFlowNodeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ExtendedFlowNode {
  id: string;
  type: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  successors?: string[];
  predecessors?: string[];
  inputTaint?: TaintLevel;
  outputTaint?: TaintLevel;
  metadata?: {
    [key: string]: unknown;
  };
}

// 注意: PathAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PathAnalysisResult {
  riskLevel: string;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
  variables: string[];
  vulnerabilities: string[];
  mitigationSteps: string[];
}

// 注意: TypeSummaryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeSummary {
  /** 識別されたセキュリティ型 */
  securityTypes: SecurityTypeSummary[];
  /** 必要だが不足している型 */
  missingTypes: MissingTypeSummary[];
  /** 汚染源の数 */
  taintSources: number;
  /** サニタイザーの数 */
  sanitizers: number;
  /** 全体的な型安全性スコア */
  typeSafetyScore: number;
  /** 推奨される次のアクション */
  recommendedActions: string[];
}

// 注意: SecurityTypeSummaryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityTypeSummary {
  type: SecurityType;
  count: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// 注意: MissingTypeSummaryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MissingTypeSummary {
  expectedType: SecurityType;
  location: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  suggestedFix: string;
}

// 注意: FlowAnalysisDetailは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FlowAnalysisDetail {
  method: string;
  flowPaths: FlowPathDetail[];
  taintPropagation: TaintPropagationDetail[];
  criticalPaths: CriticalPathDetail[];
  securityRisks: SecurityRiskDetail[];
  optimizationSuggestions: OptimizationSuggestion[];
}

// 注意: FlowPathDetailは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FlowPathDetail {
  pathId: string;
  source: string;
  sink: string;
  taintLevel: TaintLevel;
  sanitized: boolean;
  pathLength: number;
  riskAssessment: string;
}

// 注意: TaintPropagationDetailは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintPropagationDetail {
  variable: string;
  initialTaint: TaintLevel;
  finalTaint: TaintLevel;
  propagationSteps: TaintPropagationStep[];
  sanitizationPoints: string[];
}

// 注意: LocalTaintPropagationStepは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LocalTaintPropagationStep {
  step: number;
  operation: string;
  taintChange: { from: TaintLevel; to: TaintLevel };
  reason: string;
}

// 注意: CriticalPathDetailは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CriticalPathDetail {
  pathId: string;
  severity: 'high' | 'critical';
  description: string;
  affectedVariables: string[];
  potentialVulnerabilities: string[];
  mitigationSteps: string[];
}

// 注意: SecurityRiskDetailは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityRiskDetail {
  riskId: string;
  category: 'injection' | 'xss' | 'auth' | 'data-leak' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedCode: string;
  remediation: string;
  automatable: boolean;
}

// 注意: OptimizationSuggestionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface OptimizationSuggestion {
  type: 'performance' | 'security' | 'maintainability';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

// 注意: CompleteTypeAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CompleteTypeAnalysis {
  typeInference: DetailedTypeInference;
  flowGraphs: DetailedFlowGraph[];
  latticeAnalysis: DetailedLatticeAnalysis;
  securityInvariants: SecurityInvariantAnalysis[];
  comprehensiveReport: ComprehensiveAnalysisReport;
}

// 注意: DetailedTypeInferenceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DetailedTypeInference {
  totalVariables: number;
  typedVariables: number;
  inferenceAccuracy: number;
  typeDistribution: Map<SecurityType, number>;
  uncertainTypes: UncertainTypeInfo[];
  typeConflicts: TypeConflictInfo[];
}

// 注意: UncertainTypeInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface UncertainTypeInfo {
  variable: string;
  possibleTypes: SecurityType[];
  confidence: number;
  evidence: string[];
}

// 注意: TypeConflictInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeConflictInfo {
  variable: string;
  conflictingTypes: SecurityType[];
  resolutionSuggestion: string;
}

// 注意: DetailedFlowGraphは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DetailedFlowGraph {
  methodName: string;
  nodeCount: number;
  edgeCount: number;
  complexity: number;
  taintSources: number;
  sanitizers: number;
  sinks: number;
  vulnerablePaths: number;
}

// 注意: DetailedLatticeAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DetailedLatticeAnalysis {
  latticeHeight: number;
  joinOperations: number;
  meetOperations: number;
  fixpointIterations: number;
  convergenceTime: number;
  stabilityMetrics: LatticeStabilityMetrics;
}

// 注意: LatticeStabilityMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LatticeStabilityMetrics {
  monotonicity: number;
  consistency: number;
  convergenceRate: number;
}

// 注意: SecurityInvariantAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityInvariantAnalysis {
  invariantId: string;
  description: string;
  status: 'satisfied' | 'violated' | 'unknown';
  violationCount: number;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

// 注意: ComprehensiveAnalysisReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ComprehensiveAnalysisReport {
  executiveSummary: string;
  keyFindings: string[];
  riskAssessment: RiskAssessment;
  recommendationPriorities: RecommendationPriority[];
  metricsComparison: MetricsComparison;
  futureTrends: string[];
}

// 注意: RiskFactorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high';
  description: string;
}

// 注意: RecommendationPriorityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RecommendationPriority {
  priority: number;
  category: string;
  description: string;
  impact: string;
  effort: string;
  timeline: string;
}

// 注意: MetricsComparisonは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MetricsComparison {
  current: SecurityTestMetrics;
  baseline: SecurityTestMetrics;
  improvement: MetricsImprovement;
  benchmarks: BenchmarkComparison[];
}

// 注意: MetricsImprovementは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MetricsImprovement {
  overall: number;
  byCategory: Map<string, number>;
  trend: 'improving' | 'stable' | 'declining';
}

// 注意: BenchmarkComparisonは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BenchmarkComparison {
  category: string;
  industry: string;
  ourScore: number;
  benchmarkScore: number;
  percentile: number;
}

// 注意: ProgressiveAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ProgressiveAnalysisResult {
  phase: number;
  summary: TypeSummary;
  detailedAnalysis: MethodAnalysisResult[];
  nextSteps: string[];
  completionPercentage: number;
  estimatedRemainingTime?: number;
}

// 注意: AIContextInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AIContextInfo {
  analysisComplexity: 'low' | 'medium' | 'high';
  recommendedApproach: string;
  keyInsights: string[];
  prioritizedActions: string[];
  confidenceMetrics: {
    overall: number;
    byCategory: Map<string, number>;
  };
}

// 注意: InferenceStateは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface InferenceState {
  /** 変数名から型クオリファイアへのマッピング */
  typeMap: Map<string, TaintQualifier>;
  /** 生成された制約のリスト */
  constraints: TypeConstraint[];
  /** 推論の信頼度 */
  confidence: Map<string, number>;
  /** 探索の履歴 */
  searchHistory: SearchStep[];
}

// 注意: SearchStepは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface SearchStep {
  variable: string;
  previousType: TaintQualifier | null;
  newType: TaintQualifier;
  reason: string;
  timestamp: number;
}

// 注意: SolverResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface SolverResult {
  success: boolean;
  solution: Map<string, TaintQualifier>;
  unsatisfiableConstraints: TypeConstraint[];
  iterations: number;
}

// 注意: TypeChangeCandidateは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface TypeChangeCandidate {
  variable: string;
  oldType: TaintQualifier;
  newType: TaintQualifier;
  reason: string;
}

// 注意: DecoratorTargetは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type DecoratorTarget = Object | Function | { prototype?: Object; new?(...args: unknown[]): unknown };

// 注意: PropertyKeyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type PropertyKey = string | symbol;

// 注意: Timestampは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type Timestamp = number;

// 注意: TaintMetadataは4箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintMetadata {
  level: 'tainted' | 'untainted' | 'poly';
  source?: string;
  reason?: string;
  timestamp: Timestamp;
}

// 注意: PolyTaintMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PolyTaintMetadata {
  level?: 'poly';
  polymorphic?: boolean;
  description?: string;
  parameterIndices?: number[];
  propagationRule?: 'any' | 'all';
  timestamp: Timestamp;
}

// 注意: SuppressTaintMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SuppressTaintMetadata {
  suppressed: boolean;
  reason: string;
  timestamp: Timestamp;
}

// 注意: ParameterTaintMetadataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ParameterTaintMetadata = TaintMetadata[];

// 注意: ClassAnnotationInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ClassAnnotationInfo {
  taint?: TaintMetadata;
  poly?: PolyTaintMetadata;
  suppress?: SuppressTaintMetadata;
}

// 注意: ClassAnnotationMapは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ClassAnnotationMap = Map<string, ClassAnnotationInfo>;

// 注意: DecoratorDescriptorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type DecoratorDescriptor = PropertyDescriptor | number | undefined;

// 注意: DecoratorFunctionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DecoratorFunction {
  (target: DecoratorTarget, propertyKey?: PropertyKey, descriptor?: DecoratorDescriptor): void;
}

// 注意: CompositeDecoratorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type CompositeDecorator = PropertyDecorator & ParameterDecorator & MethodDecorator;

// 注意: ExtendedMethodDecoratorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ExtendedMethodDecorator {
  (target: DecoratorTarget, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor | void;
}

// 注意: TaintValidationErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
}

// 注意: MetadataStorageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MetadataStorage {
  taint: Map<PropertyKey, TaintMetadata>;
  polyTaint: Map<PropertyKey, PolyTaintMetadata>;
  suppress: Map<PropertyKey, SuppressTaintMetadata>;
  parameters: Map<PropertyKey, ParameterTaintMetadata>;
}

// 注意: MetadataCollectorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MetadataCollector {
  getTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): TaintMetadata | undefined;
  getParameterTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): ParameterTaintMetadata;
  getPolyTaintMetadata(target: DecoratorTarget, propertyKey: PropertyKey): PolyTaintMetadata | undefined;
  getSuppressMetadata(target: DecoratorTarget, propertyKey: PropertyKey): SuppressTaintMetadata | undefined;
  collectClassAnnotations(target: DecoratorTarget): ClassAnnotationMap;
  validateAnnotations(target: DecoratorTarget): string[];
}

// 注意: MethodArgumentsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type MethodArguments = unknown[];

// 注意: DecoratorContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DecoratorContext {
  target: DecoratorTarget;
  propertyKey?: PropertyKey;
  descriptor?: DecoratorDescriptor;
  parameterIndex?: number;
}

// 注意: BenchmarkConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BenchmarkConfig {
  /** テストサイズ */
  testSizes: ('small' | 'medium' | 'large' | 'xlarge')[];
  /** 実行回数（平均を取る） */
  iterations: number;
  /** 5ms/file目標の許容誤差（%） */
  target5msTolerance: number;
  /** 速度向上目標の許容範囲 */
  speedupTargetRange: { min: number; max: number };
  /** 性能劣化の警告閾値（%） */
  regressionThreshold: number;
  /** 出力ディレクトリ */
  outputDir: string;
  /** CI環境での実行かどうか */
  isCiEnvironment: boolean;
  /** 詳細ログの出力 */
  verbose: boolean;
}

// 注意: BenchmarkHistoryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BenchmarkHistory {
  /** タイムスタンプ */
  timestamp: string;
  /** Git commit hash */
  commitHash?: string;
  /** ブランチ名 */
  branch?: string;
  /** ベンチマーク結果 */
  results: BenchmarkComparison[];
  /** システム情報のハッシュ */
  systemHash: string;
  /** 性能スコア */
  performanceScore: number;
}

// 注意: RegressionDetectionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RegressionDetectionResult {
  /** 回帰が検出されたかどうか */
  hasRegression: boolean;
  /** 回帰項目 */
  regressions: PerformanceRegression[];
  /** 改善項目 */
  improvements: PerformanceImprovement[];
  /** 総合評価 */
  overallAssessment: 'excellent' | 'good' | 'warning' | 'critical';
  /** 推奨アクション */
  recommendedActions: string[];
}

// 注意: PerformanceRegressionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PerformanceRegression {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 劣化率（%） */
  degradationPercent: number;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 説明 */
  description: string;
}

// 注意: PerformanceImprovementは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PerformanceImprovement {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 改善率（%） */
  improvementPercent: number;
  /** 説明 */
  description: string;
}

// 注意: PerformanceTrendAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PerformanceTrendAnalysis {
  /** トレンド方向 */
  trend: 'improving' | 'stable' | 'degrading' | 'insufficient-data';
  /** 平均スコア */
  averageScore: number;
  /** スコアのばらつき */
  scoreVariation: number;
  /** 改善項目 */
  improvements: string[];
  /** 劣化項目 */
  degradations: string[];
  /** 推奨事項 */
  recommendations: string[];
}

// 注意: BenchmarkResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BenchmarkResult {
  /** テスト名 */
  testName: string;
  /** ファイル数 */
  fileCount: number;
  /** メソッド数 */
  methodCount: number;
  /** 総実行時間（ms） */
  totalTime: number;
  /** ファイル当たりの実行時間（ms） */
  timePerFile: number;
  /** メソッド当たりの実行時間（ms） */
  timePerMethod: number;
  /** メモリ使用量（MB） */
  memoryUsage: number;
  /** CPU使用率（%） */
  cpuUsage: number;
  /** スループット（files/sec） */
  throughput: number;
  /** 成功率（%） */
  successRate: number;
  /** エラー数 */
  errorCount: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュヒット率（%） */
  cacheHitRate: number;
}

// 注意: SystemInfoは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SystemInfo {
  /** CPU情報 */
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  /** メモリ情報 */
  memory: {
    total: number;
    free: number;
    used: number;
  };
  /** OS情報 */
  os: {
    platform: string;
    release: string;
    arch: string;
  };
  /** Node.js バージョン */
  nodeVersion: string;
}

// 注意: ParallelTypeCheckConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ParallelTypeCheckConfig {
  /** ワーカースレッド数（デフォルト: CPUコア数） */
  workerCount?: number;
  /** メソッドあたりの最大解析時間（ミリ秒） */
  methodTimeout?: number;
  /** バッチサイズ（一度に処理するメソッド数） */
  batchSize?: number;
  /** キャッシュを有効にするか */
  enableCache?: boolean;
  /** デバッグモード */
  debug?: boolean;
}

// 注意: MethodTypeCheckResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MethodTypeCheckResult {
  method: TestMethod;
  typeCheckResult: TypeCheckResult;
  inferredTypes: Map<string, QualifiedType<unknown>>;
  securityIssues: SecurityIssue[];
  executionTime: number;
}

// 注意: TypeCheckWorkerMessageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeCheckWorkerMessage {
  id: string;
  method: TestMethod;
  dependencies: Array<[string, unknown]>;
}

// 注意: TypeCheckWorkerResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeCheckWorkerResult {
  id: string;
  success: boolean;
  result?: TypeInferenceWorkerResult;
  error?: string;
  executionTime: number;
}

// 注意: TypeInferenceWorkerResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeInferenceWorkerResult {
  inferredTypes: Map<string, QualifiedType<unknown>>;
  violations: SecurityViolation[];
  securityIssues: SecurityIssue[];
  warnings: TypeCheckWarning[];
}

// 注意: SecurityViolationは5箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityViolation {
  type: string;
  description?: string;
  location: CodeLocation;
}

// 注意: TypeCheckWarningは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeCheckWarning {
  message: string;
  location?: CodeLocation;
}

// 注意: LocalAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LocalAnalysisResult {
  escapingVariables?: string[];
  annotations?: Array<{
    variable: string;
    annotation: string;
  }>;
  flows?: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  userInputs?: string[];
  databaseInputs?: string[];
  apiInputs?: string[];
  controlFlows?: Array<{
    type: string;
    condition?: string;
    variables?: string[];
  }>;
}

// 注意: MethodAnalysisContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MethodAnalysisContext {
  name: string;
  content: string;
  filePath: string;
  parameters?: Array<{
    name: string;
    type?: string;
  }>;
  returnType?: string;
}

// 注意: MethodCallは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MethodCall {
  name: string;
  arguments: string[];
  returnType?: string;
}

// 注意: ParsedAnnotationFileは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ParsedAnnotationFile {
  annotations: Map<string, string>;
  getAnnotation(className: string, methodName: string, type: string, idx?: number): string;
}

// 注意: StubFileDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface StubFileData {
  getMethodAnnotation(className: string, methodName: string): string;
}

// 注意: CheckerFrameworkTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface CheckerFrameworkType {
  qualifier: string;
  baseType: string;
}

// 注意: FlowAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface FlowAnalysisResult {
  getTypeAt(varName: string, lineNum: number): string;
  getTypeInBranch(varName: string, branch: string): string;
}

// 注意: ParameterInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ParameterInfo {
  name?: string;
  type: string;
  annotation?: string;
  index: number;
}

// 注意: MethodInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}

// 注意: FieldInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FieldInfo {
  name: string;
  type: string;
  annotations?: string[];
  visibility?: 'public' | 'private' | 'protected';
}

// 注意: MigrationPlanは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MigrationPlan {
  phases: MigrationPhase[];
  totalFiles: number;
  estimatedHours: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// 注意: MigrationPhaseは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MigrationPhase {
  name: string;
  description: string;
  files: string[];
  order: number;
  dependencies?: string[];
}

// 注意: LibraryConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LibraryConfig {
  name: string;
  version: string;
  includePaths?: string[];
  excludePaths?: string[];
  customAnnotations?: Record<string, string>;
}

// 注意: MethodCallCheckResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MethodCallCheckResult {
  safe: boolean;
  violations?: string[];
  warnings?: string[];
  suggestedFixes?: string[];
}

// 注意: PolyTaintInstantiationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PolyTaintInstantiationResult {
  qualifier: string;
  confidence: number;
  reason: string;
}

// 注意: QualifiedValueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type QualifiedValue<T = unknown> = TaintedType<T> | UntaintedType<T>;

// 注意: AnnotatedTypeFactoryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnnotatedTypeFactory {
  getAnnotatedType(tree: unknown): AnnotatedType;
  createType(baseType: string, annotations: string[]): AnnotatedType;
}

// 注意: AnnotatedTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnnotatedType {
  baseType: string;
  annotations: string[];
  isSubtypeOf(other: AnnotatedType): boolean;
}

// 注意: CheckerVisitorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CheckerVisitor {
  visitMethodInvocation(node: unknown): void;
  visitAssignment(node: unknown): void;
  visitReturn(node: unknown): void;
}

// 注意: LegacyCompatibleTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type LegacyCompatibleType<T> = QualifiedType<T> & {
  __legacyLevel?: TaintLevel;
};

// 注意: LocalVariableAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LocalVariableAnalysisResult {
  /** メソッド内のローカル変数リスト */
  localVariables: string[];
  /** 推論された型マップ */
  inferredTypes: Map<string, TaintQualifier>;
  /** スコープ情報 */
  scopeInfo: Map<string, string>;
  /** エスケープする変数（メソッド外で参照される） */
  escapingVariables: string[];
  /** 最適化が適用されたか */
  optimizationApplied: boolean;
  /** スキップされた冗長チェック数 */
  redundantChecksSkipped: number;
}

// 注意: InferenceOptimizationResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface InferenceOptimizationResult {
  /** 型マップ */
  typeMap: Map<string, TaintQualifier>;
  /** 最適化メトリクス */
  optimizationMetrics: {
    localVariablesOptimized: number;
    cacheHits: number;
    inferenceTimeMs: number;
  };
  /** 警告メッセージ */
  warnings: string[];
}

// 注意: CacheHitStatisticsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CacheHitStatistics {
  hits: number;
  misses: number;
  hitRate: number;
}

// 注意: ChangeInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ChangeInfo {
  methodName: string;
  newHash: string;
  changeType: ChangeType;
  affectedLines: number[];
}

// 注意: ChangeTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
type ChangeType = 'signature' | 'body' | 'comment';

// 注意: ChangeDetectionResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ChangeDetectionResult {
  type: ChangeType;
  affectedLines: number[];
}

// 注意: LatticeAnalysisStatsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LatticeAnalysisStats {
  variablesAnalyzed: number;
  taintedVariables: number;
  untaintedVariables: number;
  polyTaintVariables: number;
  violationsFound: number;
  analysisTime: number;
}

// 注意: CryptoPatternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface CryptoPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 注意: OWASPCategoryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum OWASPCategory {
  A01_BROKEN_ACCESS_CONTROL = 'A01:2021',
  A02_CRYPTOGRAPHIC_FAILURES = 'A02:2021',
  A03_INJECTION = 'A03:2021',
  A04_INSECURE_DESIGN = 'A04:2021',
  A05_SECURITY_MISCONFIGURATION = 'A05:2021',
  A06_VULNERABLE_COMPONENTS = 'A06:2021',
  A07_IDENTIFICATION_AUTH_FAILURES = 'A07:2021',
  A08_DATA_INTEGRITY_FAILURES = 'A08:2021',
  A09_SECURITY_LOGGING_FAILURES = 'A09:2021',
  A10_SSRF = 'A10:2021'
}

// 注意: OWASPTestResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface OWASPTestResult {
  category: OWASPCategory;
  coverage: number;
  issues: SecurityIssue[];
  recommendations: string[];
  testPatterns: string[];
  missingTests: string[];
}

// 注意: IOWASPSecurityPluginは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IOWASPSecurityPlugin extends ITestQualityPlugin {
  /**
   * OWASPカテゴリ
   */
  owaspCategory: OWASPCategory;
  
  /**
   * CWE（Common Weakness Enumeration）IDのリスト
   */
  cweIds: string[];
  
  /**
   * セキュリティテストパターンの検証
   */
  validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult>;
  
  /**
   * 脆弱性パターンの検出
   */
  detectVulnerabilityPatterns(content: string): SecurityIssue[];
  
  /**
   * 推奨されるセキュリティテストの生成
   */
  generateSecurityTests(context: ProjectContext): string[];
  
  /**
   * エンタープライズ要件の検証
   */
  validateEnterpriseRequirements?(testFile: TestFile): boolean;
}

// 注意: InjectionQualityDetailsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface InjectionQualityDetails extends QualityDetails {
  sqlInjectionCoverage?: number;
  commandInjectionCoverage?: number;
}

// 注意: VulnerableComponentsQualityDetailsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface VulnerableComponentsQualityDetails extends QualityDetails {
  vulnerabilityScanCoverage?: number;
  dependencyCheckCoverage?: number;
}

// 注意: CryptographicFailuresQualityDetailsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CryptographicFailuresQualityDetails extends QualityDetails {
  weakAlgorithmsDetected?: number;
}

// 注意: AuthASTNodeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AuthASTNode {
  type: string;
  value?: string;
  name?: string;
  operator?: string;
  left?: AuthASTNode;
  right?: AuthASTNode;
  object?: AuthASTNode;
  property?: AuthASTNode;
  callee?: AuthASTNode;
  arguments?: AuthASTNode[];
  children?: AuthASTNode[];
  statement?: {
    content: string;
    [key: string]: unknown;
  };
  location?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

// 注意: AuthTypeInferenceResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AuthTypeInferenceResult extends TypeInferenceResult {
  inferredTypes: Record<string, string>;
  typeConstraints: TypeConstraint[];
  typeErrors: TypeViolation[];
}

// 注意: AuthTaintPathは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AuthTaintPath {
  source: string;
  sink: string;
  nodes: string[];
  taintLevel: TaintLevel;
  isAuthRelated: boolean;
}

// 注意: AuthCriticalFlowは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AuthCriticalFlow {
  id: string;
  path: string[];
  violationType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  authContext: string;
}

// 注意: AnalysisErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnalysisError {
  message: string;
  stack?: string;
  code?: string;
}

// 注意: TaintPropagationRuleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type TaintPropagationRule = 'any' | 'all' | 'none';

// 注意: TaintAnalysisConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintAnalysisConfig {
  /** 推論エンジンの設定 */
  inference: {
    /** 探索ベース推論を有効化 */
    enableSearchBased: boolean;
    /** ローカル最適化を有効化 */
    enableLocalOptimization: boolean;
    /** インクリメンタル解析を有効化 */
    enableIncremental: boolean;
    /** 最大探索深度 */
    maxSearchDepth: number;
    /** 信頼度閾値 */
    confidenceThreshold: number;
  };
  /** ライブラリサポート設定 */
  library: {
    /** 組み込みライブラリの定義を読み込む */
    loadBuiltins: boolean;
    /** カスタムライブラリ定義のパス */
    customLibraryPaths: string[];
    /** 未知のメソッドの扱い */
    unknownMethodBehavior: 'conservative' | 'optimistic';
  };
  /** Checker Framework互換性 */
  compatibility: {
    /** .jaifファイルの出力を有効化 */
    exportJAIF: boolean;
    /** スタブファイルの生成を有効化 */
    generateStubs: boolean;
    /** 段階的移行モード */
    gradualMigration: boolean;
  };
}

// 注意: IncrementalAnalysisResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IncrementalAnalysisResult {
  analyzedFiles: string[];
  skippedFiles: string[];
  totalTime: number;
}

// 注意: PropagationRuleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type PropagationRule = 'any' | 'all';

// 注意: TypeQualifierHierarchyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeQualifierHierarchy {
  '@Tainted': {
    subtypes: ['@Untainted'];
    supertypes: [];
  };
  '@Untainted': {
    subtypes: [];
    supertypes: ['@Tainted'];
  };
  '@PolyTaint': {
    subtypes: ['@Tainted', '@Untainted'];
    supertypes: ['@Tainted', '@Untainted'];
  };
}

// 注意: TaintedTypeは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintedType<T> {
  readonly __brand: '@Tainted';
  readonly __value: T;
  readonly __source: string;
  readonly __confidence: number;
}

// 注意: UntaintedTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface UntaintedType<T> {
  readonly __brand: '@Untainted';
  readonly __value: T;
  readonly __sanitizedBy?: string;
  readonly __validatedAt?: number;
}

// 注意: PolyTaintTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PolyTaintType<T> {
  readonly __brand: '@PolyTaint';
  readonly __value: T;
  readonly __parameterIndices: number[];
  readonly __propagationRule: PropagationRule;
}

// 注意: QualifiedTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type QualifiedType<T> = TaintedType<T> | UntaintedType<T> | PolyTaintType<T>;

// 注意: TypeInferenceHintは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeInferenceHint {
  variable: string;
  possibleTypes: TaintQualifier[];
  confidence: number;
  evidence: string[];
}

// 注意: TypeConstraintは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeConstraint {
  type: 'subtype' | 'equality' | 'flow';
  lhs: string | TaintQualifier;
  rhs: string | TaintQualifier;
  location: {
    file: string;
    line: number;
    column: number;
  };
}

export interface TypeQualifierError {
  message: string;
  severity: 'error' | 'warning';
  location?: {
    line: number;
    column?: number;
  };
}

// 注意: TypeCheckResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeCheckResult {
  success: boolean;
  errors: TypeQualifierError[];
  warnings: Array<{
    message: string;
    location?: { file: string; line: number; column: number };
  }>;
}

// 注意: TestMethodExtendedは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestMethodExtended extends TestMethod {
  filePath?: string;
  content?: string;
}

// 注意: FlowGraphは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
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

// 注意: FlowNodeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
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

// 注意: FlowEdgeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FlowEdge {
  from: string;
  to: string;
  condition?: string;
  type?: 'normal' | 'true' | 'false' | 'exception';
}

// 注意: TestStatementは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
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

// 注意: TaintStateは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintState {
  variables: Map<string, TaintLevel>;
  sources: TaintSource[];
  sinks: SecuritySink[];
  sanitizers: SanitizerType[];
}

// 注意: TypeStateは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeState {
  variables: Map<string, string>;
  constraints: TypeConstraint[];
}

// 注意: TypeErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeError extends TypeViolation {
  severity: 'error' | 'warning';
}

// 注意: SecurityTestMetricsは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityTestMetrics {
  taintCoverage: number;
  sanitizerCoverage: number;
  sinkCoverage: number;
  securityAssertions: number;
  vulnerableFlows: number;
}

// 注意: SecurityImprovementは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityImprovement {
  id?: string;
  type: 'add-sanitizer' | 'add-validation' | 'add-assertion' | 'fix-flow';
  title?: string;
  location: Position;
  description: string;
  suggestedCode?: string;
  impact: 'low' | 'medium' | 'high';
  priority?: 'low' | 'medium' | 'high';
  estimatedImpact?: {
    securityImprovement: number;
    implementationMinutes: number;
  };
  automatable?: boolean;
}

// 注意: TypeInferenceResultは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeInferenceResult {
  inferredTypes: Record<string, string>;
  typeConstraints: TypeConstraint[];
  typeErrors: TypeViolation[];
}

// 注意: SecurityMethodChangeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityMethodChange {
  method: TestMethod;
  type?: 'added' | 'modified' | 'deleted';
  changeType: 'added' | 'modified' | 'deleted';
  affectedFlows: FlowPath[];
}

// 注意: IncrementalUpdateは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IncrementalUpdate {
  changes: SecurityMethodChange[];
  affectedMethods: TestMethod[];
  updatedMethods?: MethodAnalysisResult[];
  reanalysisRequired: boolean;
}

// 注意: InputTaintPathは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface InputTaintPath {
  source: string;
  sink: string;
  path: string[];
  isCritical: boolean;
  sanitizers: string[];
}

// 注意: IncrementalChangeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
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

// 注意: TestMethodAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
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

// 注意: SecurityIssueは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
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
    confidence?: number;
  };
}

// 注意: Parameterは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Parameter {
  /** パラメータ名 */
  name: string;
  /** 型 */
  type?: string;
  /** データソース */
  source?: 'user-input' | 'database' | 'api' | 'constant';
  /** アノテーション（セキュリティプラグイン用） */
  annotations?: string[];
}

// 注意: IncrementalResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IncrementalResult {
  /** 解析されたメソッド数 */
  analyzed: number;
  /** キャッシュから取得されたメソッド数 */
  cached: number;
  /** 総実行時間 */
  totalTime: number;
  /** 結果 */
  results: MethodAnalysisResult[];
}

// 注意: TypeBasedSecurityConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeBasedSecurityConfig {
  /** 解析の厳密さ */
  strictness: 'strict' | 'moderate' | 'lenient';
  /** 最大解析時間（ms） */  
  maxAnalysisTime: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュの有効化 */
  enableCache: boolean;
  /** カスタムサニタイザー */
  customSanitizers: string[];
  /** カスタムシンク */
  customSinks: string[];
  /** 除外パターン */
  excludePatterns: string[];
  /** デバッグモード */
  debug?: boolean;
}

// 注意: TypeBasedSecurityAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TypeBasedSecurityAnalysis {
  /** 汚染レベルの推論 */
  inferTaintLevels(testFile: TestCase): Promise<Map<string, TaintLevel>>;
  
  /** セキュリティ型の推論 */
  inferSecurityTypes(testFile: TestCase): Promise<TypeInferenceResult>;
  
  /** セキュリティ不変条件の検証 */
  verifyInvariants(testFile: TestCase): Promise<SecurityViolation[]>;
  
  /** コンパイル時解析の実行 */
  analyzeAtCompileTime(testFiles: TestCase[]): Promise<CompileTimeResult>;
}

// 注意: ModularAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ModularAnalysis {
  /** テストメソッド単位の解析 */
  analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult>;
  
  /** インクリメンタル解析 */
  incrementalAnalyze(changes: SecurityMethodChange[]): Promise<IncrementalResult>;
  
  /** 並列解析 */
  analyzeInParallel(methods: TestMethod[]): Promise<MethodAnalysisResult[]>;
}

// 注意: SecurityTypeStringは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
type SecurityTypeString = 'authentication' | 'authorization' | 'input-validation' | 'api-security';

// 注意: SecurityValidationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityValidation {
  /** 検証の種別 */
  type: string;
  /** 検証が実行された場所 */
  location: {
    file: string;
    line: number;
    method: string;
  };
  /** 検証の時刻 */
  timestamp: Date;
}

// 注意: SecurityRequirementは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityRequirement {
  /** 要件ID */
  id: string;
  /** 要件の種別 */
  type: 'auth-test' | 'input-validation' | 'api-security' | 'session-management' | SecurityTypeString;
  /** 必須テストケース */
  required: string[];
  /** 最小汚染レベル */
  minTaintLevel: TaintLevel;
  /** 適用される汚染源 */
  applicableSources: TaintSource[];
  /** チェック項目（テスト用） */
  checks?: string[];
  /** 重要度（テスト用） */
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// 注意: SecureTestは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type SecureTest<T extends TestCase> = T & {
  readonly __validated: SecurityValidation[];
  readonly __taintLevel: TaintLevel;
  readonly __securityType: SecurityType;
};

// 注意: UnsafeTestは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type UnsafeTest<T extends TestCase> = T & {
  readonly __missing: SecurityRequirement[];
  readonly __vulnerabilities: PotentialVulnerability[];
  readonly __riskLevel: 'low' | 'medium' | 'high' | 'critical';
};

// 注意: ValidatedAuthTestは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ValidatedAuthTest = TestCase & {
  readonly __brand: 'auth-validated';
  readonly __covers: AuthTestCoverage[];
  readonly __tokenValidation: boolean;
  readonly __sessionManagement: boolean;
};

// 注意: ValidatedInputTestは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type ValidatedInputTest = TestCase & {
  readonly __brand: 'input-validated';
  readonly __sanitizers: SanitizerType[];
  readonly __boundaries: BoundaryCondition[];
  readonly __typeValidation: boolean;
};

// 注意: SecurityAnalysisReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityAnalysisReport {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  issues: SecurityIssue[];
  metrics?: SecurityTestMetrics;
  recommendations?: string[];
  timestamp: Date;
}

// 注意: ITypeBasedSecurityPluginは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ITypeBasedSecurityPlugin {
  id: string;
  name: string;
  version: string;
  
  // Main analysis methods
  analyzeTestMethod(method: TestMethod): Promise<TestMethodAnalysisResult>;
  analyzeIncrementally?(update: IncrementalChange): Promise<TestMethodAnalysisResult>;
  generateReport?(): SecurityAnalysisReport;
}

// 注意: AuthTestCoverageは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type AuthTestCoverage = 
  | 'success'
  | 'failure'
  | 'token-expiry'
  | 'brute-force'
  | 'session-hijack'
  | 'csrf'
  | 'privilege-escalation';

// 注意: AuthTestMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AuthTestMetrics {
  loginTests: number;
  logoutTests: number;
  tokenTests: number;
  sessionTests: number;
  permissionTests: number;
  total: number;
  percentage: number;
}

// 注意: BoundaryValueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type BoundaryValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

// 注意: BoundaryConditionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface BoundaryCondition {
  /** 境界の種別 */
  type: 'min' | 'max' | 'null' | 'empty' | 'invalid-format' | 'overflow';
  /** 境界値 */
  value: BoundaryValue;
  /** テスト済みかどうか */
  tested: boolean;
}

// 注意: PotentialVulnerabilityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PotentialVulnerability {
  /** 脆弱性の種別 */
  type: 'sql-injection' | 'xss' | 'csrf' | 'auth-bypass' | 'data-leak';
  /** 脆弱性の説明 */
  description: string;
  /** 影響範囲 */
  impact: 'low' | 'medium' | 'high' | 'critical';
  /** 検出された場所 */
  location: {
    file: string;
    line: number;
    method: string;
  };
  /** 修正提案 */
  fixSuggestion: string;
}

// 注意: Variableは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Variable {
  /** 変数名 */
  name: string;
  /** 型情報 */
  type?: string;
  /** スコープ */
  scope: 'local' | 'parameter' | 'field' | 'global';
}

// 注意: SecurityTypeAnnotationは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface SecurityTypeAnnotation {
  /** 変数や式 */
  target?: string;
  /** 変数名（レガシー互換性） */
  variable?: string;
  /** セキュリティ型 */
  securityType: SecurityType;
  /** セキュリティレベル */
  securityLevel?: TaintLevel;
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** 推論の信頼度 */
  confidence: number;
  /** 推論の根拠 */
  evidence: string[];
  /** フローポリシー */
  flowPolicy?: string;
}

// 注意: CompileTimeResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CompileTimeResult {
  /** 検出された問題 */
  issues: SecurityIssue[];
  /** 実行時間 */
  executionTime: number;
  /** ランタイムへの影響（常に0） */
  runtimeImpact: 0;
  /** 解析統計 */
  statistics: {
    /** 解析されたファイル数 */
    filesAnalyzed: number;
    /** 解析されたメソッド数 */
    methodsAnalyzed: number;
    /** 型推論の成功率 */
    inferenceSuccessRate: number;
  };
}

// 注意: TaintVulnerabilityAssessmentは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintVulnerabilityAssessment {
  /** 脆弱性ID */
  vulnerabilityId: string;
  /** Taintフロー */
  taintFlow: TaintFlow;
  /** リスクスコア（0-100） */
  riskScore: number;
  /** 悪用可能性（0-1） */
  exploitability: number;
  /** 影響度（0-1） */
  impact: number;
  /** 推奨される修正方法 */
  remediation: string[];
  /** 参考リンク */
  references?: string[];
}

// 注意: TaintChainRiskは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintChainRisk {
  /** チェーンID */
  chainId: string;
  /** チェーンを構成するフローID */
  flowIds: string[];
  /** 連鎖的リスクスコア */
  chainRiskScore: number;
  /** チェーンの説明 */
  description: string;
  /** 攻撃シナリオ */
  attackScenario: string;
  /** 緩和策 */
  mitigation: string[];
}

// 注意: TaintTraceStepは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TaintTraceStep {
  /** ステップの種別 */
  type: 'propagate' | 'sanitize' | 'merge' | 'branch';
  /** 操作の説明 */
  description: string;
  /** 操作前の汚染レベル */
  inputTaint: TaintLevel;
  /** 操作後の汚染レベル */
  outputTaint: TaintLevel;
  /** 操作が行われた位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
}

// 注意: SafeValueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type SafeValue<T> = T & {
  readonly __safe: true;
  readonly __validated: true;
};

// 注意: TestCaseAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestCaseAnalysisResult {
  testCase?: {
    file?: string;
    [key: string]: unknown;
  };
  groundTruth?: GroundTruthData;
  detectedIssues?: SecurityIssue[];
  analysis?: {
    missedIssues?: Array<SecurityIssue | GroundTruthIssue>;
    falseAlarms?: Array<SecurityIssue | GroundTruthIssue>;
    correctDetections?: Array<SecurityIssue | GroundTruthIssue>;
    [key: string]: unknown;
  };
}

// 注意: GroundTruthDataは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface GroundTruthData {
  /** テストファイル識別子 */
  testFileId: string;
  /** メソッド名 */
  methodName: string;
  /** 実際のセキュリティ問題 */
  actualSecurityIssues: GroundTruthIssue[];
  /** 実際の汚染レベル */
  actualTaintLevels: Map<string, TaintLevel>;
  /** 必要なセキュリティテスト */
  requiredSecurityTests: string[];
  /** 手動検証の結果 */
  manualVerificationResult: 'safe' | 'unsafe' | 'needs-attention';
  /** 検証者情報 */
  verifiedBy: string;
  /** 検証日時 */
  verifiedAt: Date;
}

// 注意: GroundTruthIssueは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface GroundTruthIssue {
  /** 問題の種類 */
  type: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 説明 */
  description: string;
  /** 確信度 */
  confidence: number;
}

// 注意: AccuracyMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AccuracyMetrics {
  /** 総テストケース数 */
  totalTestCases: number;
  /** 解析済みテストケース数 */
  analyzedTestCases: number;
  
  /** 自動推論関連 */
  inference: {
    /** 自動推論率（目標85%以上） */
    automaticInferenceRate: number;
    /** 推論精度（目標90%以上） */
    inferenceAccuracy: number;
    /** 推論失敗数 */
    inferenceFailed: number;
  };
  
  /** 検出精度関連 */
  detection: {
    /** 真陽性（正しく検出） */
    truePositives: number;
    /** 偽陽性（誤検知）目標15%以下 */
    falsePositives: number;
    /** 真陰性（正しく非検出） */
    trueNegatives: number;
    /** 偽陰性（見逃し）目標5%以下 */
    falseNegatives: number;
    /** 精度（Precision） */
    precision: number | null;
    /** 再現率（Recall） */
    recall: number | null;
    /** F1スコア */
    f1Score: number | null;
    /** 誤検知率 */
    falsePositiveRate: number;
    /** 偽陰性率 */
    falseNegativeRate: number;
  };
  
  /** 型システム関連 */
  typeSystem: {
    /** 型推論成功率 */
    typeInferenceSuccessRate: number;
    /** 汚染追跡精度 */
    taintTrackingAccuracy: number;
    /** セキュリティ不変条件検証率 */
    invariantVerificationRate: number;
  };
  
  /** パフォーマンス関連 */
  performance: {
    /** 平均解析時間（ms/file）目標5ms以下 */
    averageAnalysisTime: number;
    /** 目標達成率 */
    targetAchievementRate: number;
    /** スループット（files/sec） */
    throughput: number;
  };
}

// 注意: DetailedAccuracyResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DetailedAccuracyResult {
  /** 全体メトリクス */
  overallMetrics: AccuracyMetrics;
  /** テストケース別詳細 */
  perTestCaseResults: TestCaseAccuracyResult[];
  /** フレームワーク別結果 */
  perFrameworkResults: Map<string, AccuracyMetrics>;
  /** 問題別分析 */
  issueTypeAnalysis: Map<string, IssueTypeAccuracy>;
  /** 時系列精度変化 */
  accuracyTrends: AccuracyTrend[];
  /** 推奨改善策 */
  recommendedImprovements: AccuracyImprovement[];
}

// 注意: TestCaseAccuracyResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestCaseAccuracyResult {
  /** テストケース */
  testCase: TestCase;
  /** 正解データ */
  groundTruth: GroundTruthData;
  /** 実際の検出結果 */
  detectedIssues: SecurityIssue[];
  /** 精度評価 */
  accuracy: {
    correct: boolean;
    precision: number | null;
    recall: number | null;
    inferenceSuccessful: boolean;
  };
  /** 詳細分析 */
  analysis: {
    missedIssues: GroundTruthIssue[];
    falseAlarms: SecurityIssue[];
    correctDetections: SecurityIssue[];
  };
}

// 注意: AccuracyTrendは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AccuracyTrend {
  /** 測定日時 */
  timestamp: Date;
  /** 精度メトリクス */
  metrics: AccuracyMetrics;
  /** 変更内容 */
  changes: string[];
}

// 注意: AccuracyImprovementは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AccuracyImprovement {
  /** 改善項目 */
  area: 'inference' | 'detection' | 'type-system' | 'performance';
  /** 現在の値 */
  currentValue: number;
  /** 目標値 */
  targetValue: number;
  /** 改善策 */
  recommendations: string[];
  /** 推定効果 */
  estimatedImpact: number;
  /** 実装難易度 */
  implementationComplexity: 'low' | 'medium' | 'high';
}

// 注意: TestTemplateは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestTemplate {
  /** テンプレート名 */
  name: string;
  /** フレームワーク */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** カテゴリ */
  category: 'authentication' | 'input-validation' | 'authorization' | 'data-protection' | 'api-security';
  /** セキュリティパターン */
  securityPattern: string;
  /** テストコードテンプレート */
  template: string;
  /** 期待される検出パターン */
  expectedFindings: string[];
  /** 複雑度 */
  complexity: 'basic' | 'intermediate' | 'advanced';
}

// 注意: GenerationConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface GenerationConfig {
  /** 出力ディレクトリ */
  outputDir: string;
  /** 生成するテスト数 */
  testCount: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  /** フレームワーク設定 */
  frameworkConfig: {
    [key: string]: {
      version: string;
      dependencies: string[];
      testFramework: 'jest' | 'mocha' | 'vitest';
    };
  };
}

// 注意: ScalabilityDataPointは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ScalabilityDataPoint {
  fileCount: number;
  totalTime: number;
  memoryUsed: number;
  throughput: number;
  executionTime: number;
  timePerFile: number;
  memoryUsage: number;
}

// 注意: ProcessedAnalysisResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ProcessedAnalysisResult {
  issueCount: number;
  issueTypeDistribution: Map<string, number>;
  criticalIssues: number;
  highPriorityIssues: number;
  totalIssues: number;
  issuesPerFile: number;
}

// 注意: ScalabilityAnalysisは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ScalabilityAnalysis {
  complexity: string;
  timeComplexity: string;
  spaceComplexity: string;
  regressionCoefficient: number;
  scalabilityScore: number;
  recommendedMaxFiles: number;
}

// 注意: LargeScaleProjectConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface LargeScaleProjectConfig {
  /** プロジェクト名 */
  name: string;
  /** ファイル数の規模 */
  fileCount: number;
  /** テストメソッド数の規模 */
  methodCount: number;
  /** 平均ファイルサイズ（行数） */
  averageFileSize: number;
  /** 複雑度レベル */
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  /** フレームワーク */
  frameworks: ('express' | 'react' | 'nestjs' | 'nextjs')[];
}

// 注意: PerformanceResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface PerformanceResult {
  /** プロジェクト設定 */
  config: LargeScaleProjectConfig;
  /** 実行時間メトリクス */
  timing: {
    /** 総実行時間（ms） */
    totalTime: number;
    /** ファイルあたり平均時間（ms） */
    timePerFile: number;
    /** メソッドあたり平均時間（ms） */
    timePerMethod: number;
    /** セットアップ時間（ms） */
    setupTime: number;
    /** 解析時間（ms） */
    analysisTime: number;
    /** 後処理時間（ms） */
    teardownTime: number;
  };
  /** メモリ使用量メトリクス */
  memory: {
    /** 初期メモリ使用量（MB） */
    initialMemory: number;
    /** ピークメモリ使用量（MB） */
    peakMemory: number;
    /** 最終メモリ使用量（MB） */
    finalMemory: number;
    /** メモリ効率（MB/file） */
    memoryPerFile: number;
  };
  /** スループット メトリクス */
  throughput: {
    /** ファイル処理速度（files/sec） */
    filesPerSecond: number;
    /** メソッド処理速度（methods/sec） */
    methodsPerSecond: number;
    /** 問題検出速度（issues/sec） */
    issuesPerSecond: number;
  };
  /** 並列処理効率 */
  parallelism: {
    /** 使用CPU数 */
    coreCount: number;
    /** 並列度 */
    parallelism: number;
    /** CPU使用率 */
    cpuUtilization: number;
    /** 並列効率（理想値=1.0） */
    parallelEfficiency: number;
  };
  /** 目標達成度 */
  targetAchievement: {
    /** 5ms/file目標達成 */
    fiveMsTarget: boolean;
    /** 3-20x高速化達成 */
    speedupTarget: boolean;
    /** 実際の高速化倍率 */
    actualSpeedup: number;
  };
  /** 検出結果 */
  analysisResults: {
    /** 総検出問題数 */
    totalIssues: number;
    /** ファイルあたり平均問題数 */
    issuesPerFile: number;
    /** 問題種別分布 */
    issueTypeDistribution: Map<string, number>;
  };
}

// 注意: ScalabilityTestResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ScalabilityTestResult {
  /** テスト条件 */
  testConditions: {
    /** 最小ファイル数 */
    minFiles: number;
    /** 最大ファイル数 */
    maxFiles: number;
    /** ステップ数 */
    steps: number;
  };
  /** スケーラビリティデータ */
  scalabilityData: {
    /** ファイル数 */
    fileCount: number;
    /** 実行時間（ms） */
    executionTime: number;
    /** ファイルあたり時間（ms） */
    timePerFile: number;
    /** メモリ使用量（MB） */
    memoryUsage: number;
  }[];
  /** スケーラビリティ分析 */
  analysis: {
    /** 時間計算量（O記法） */
    timeComplexity: string;
    /** 空間計算量（O記法） */
    spaceComplexity: string;
    /** スケーラビリティスコア（1-10） */
    scalabilityScore: number;
    /** 推奨最大ファイル数 */
    recommendedMaxFiles: number;
  };
}

// 注意: RealWorldProjectは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RealWorldProject {
  /** プロジェクト名 */
  name: string;
  /** フレームワーク種別 */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** プロジェクトルートパス */
  rootPath: string;
  /** テストディレクトリパス */
  testPaths: string[];
  /** 期待される検証結果 */
  expectedFindings: {
    securityIssues: number;
    coverageScore: number;
    expectedPatterns: string[];
  };
  /** メタデータ */
  metadata: {
    description: string;
    complexity: 'small' | 'medium' | 'large' | 'enterprise';
    testCount: number;
    lastValidated: Date;
  };
}

// 注意: FrameworkSpecificFindingは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FrameworkSpecificFinding {
  /** フレームワーク */
  framework: string;
  /** カテゴリ */
  category: string;
  /** 発見事項 */
  finding: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 推奨対策 */
  recommendation: string;
}

// 注意: AITestErrorReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AITestErrorReport {
  version: string;
  format: 'ai-test-error';
  executionDate: string;
  summary: ErrorSummary;
  errorGroups: ErrorGroup[];
  contextualInstructions: ContextualInstructions;
  quickActions: QuickAction[];
  ciTraceability?: CITraceabilityInfo;
  executionInfo?: ExecutionInfo;
}

// 注意: ExecutionInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ExecutionInfo {
  startTime: string;
  endTime?: string;
  duration?: number;
  environment: string;
  totalFilesProcessed?: number;
  totalErrorsCollected?: number;
  jestReportedFailures?: number;
}

// 注意: CITraceabilityInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface CITraceabilityInfo {
  runId: string;
  runNumber: string;
  workflow: string;
  job?: string;
  actor?: string;
  repository: string;
  branch: string;
  sha: string;
  prNumber?: string;
  deepLink?: string;
  prLink?: string;
  nodeVersion: string;
  os: string;
  timestamp: string;
}

// 注意: ErrorSummaryは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  testFileCount: number;
  commonPatterns: string[];
  estimatedFixTime: number; // 分単位
}

// 注意: ErrorGroupは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ErrorGroup {
  pattern: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  errors: FormattedError[];
  commonSolution?: string;
}

// 注意: FormattedErrorは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface FormattedError {
  id: string;
  testFile: string;
  testName: string;
  errorMessage: string;
  context: {
    failedAssertion: string;
    relevantCode: string;
    stackTrace: string;
  };
  suggestedFix: {
    explanation: string;
    code: string;
    confidence: number;
  };
  relatedInfo: {
    sourceFile?: string;
    dependencies: string[];
  };
  errorHash?: string; // CI環境でのエラー照合用
}

// 注意: ContextualInstructionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface ContextualInstructions {
  forHuman: string;
  forAI: string;
  debuggingSteps: string[];
}

// 注意: QuickActionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface QuickAction {
  command: string;
  description: string;
  expectedOutcome: string;
}

// 注意: CITraceabilityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CITraceability {
  // GitHub Actions情報
  runId: string;           // GITHUB_RUN_ID
  runNumber: string;       // GITHUB_RUN_NUMBER
  workflow: string;        // GITHUB_WORKFLOW
  job: string;            // GITHUB_JOB
  actor: string;          // GITHUB_ACTOR
  
  // リポジトリ情報
  repository: string;      // GITHUB_REPOSITORY
  branch: string;         // GITHUB_REF_NAME
  sha: string;           // GITHUB_SHA
  prNumber?: string;      // PR番号（該当する場合）
  
  // 実行環境
  nodeVersion: string;    // マトリックス情報から取得
  os: string;            // ランナーOS (RUNNER_OS)
  timestamp: string;      // 実行日時
  
  // エラー照合用
  errorHash: string;      // エラーの一意識別子
}

// 注意: TestErrorContextは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestErrorContext {
  // 基本情報
  timestamp: string;
  testFile: string;
  testName: string;
  errorType: ErrorType;
  
  // エラー詳細
  error: {
    message: string;
    stack?: string;
    actual?: unknown;
    expected?: unknown;
  };
  
  // コードコンテキスト（Select Context）
  codeContext: {
    failedLine: number;
    failedCode: string;
    surroundingCode: {
      before: string;
      after: string;
    };
    testStructure: TestStructure;
  };
  
  // 環境情報（Write Context）
  environment: {
    nodeVersion: string;
    jestVersion?: string;
    ciEnvironment: boolean;
    memoryUsage: NodeJS.MemoryUsage;
  };
  
  // 関連ファイル（Isolate Context）
  relatedFiles: {
    sourceFile?: string;
    dependencies: string[];
    configFiles: string[];
  };
  
  // CIトレーサビリティ情報（オプション）
  ciTraceability?: unknown;
  
  // 推奨アクション（Compress Context）
  suggestedActions: SuggestedAction[];
}

// 注意: TestStructureは3箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface TestStructure {
  describes: Array<{ location: CodeLocation; name: string }>;
  tests: Array<{ location: CodeLocation; name: string }>;
}

// 注意: SuggestedActionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface SuggestedAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  codeSnippet?: string;
}

// 注意: JestAIReporterOptionsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface JestAIReporterOptions {
  outputPath?: string;
  enableConsoleOutput?: boolean;
  [key: string]: unknown;
}

// 注意: MigrationReportは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface MigrationReport {
  totalPlugins: number;
  legacyPlugins: number;
  modernPlugins: number;
  migrationEstimate: {
    totalEffort: string;
    estimatedHours: number;
    complexPlugins: number;
  };
  pluginDetails: Array<{
    name: string;
    type: 'legacy' | 'modern';
    complexity: string;
    filePath?: string;
  }>;
}

// 注意: CompatibilityResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CompatibilityResult {
  isCompatible: boolean;
  breakingChanges: string[];
  newRequirements: string[];
  suggestions: string[];
}

// 注意: TypeDefinitionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface TypeDefinition {
  name: string;
  filePath: string;
  definition: string;
  kind: 'interface' | 'type' | 'enum';
  exportStatus: 'exported' | 'internal';
}

// 注意: TypeConflictは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
interface TypeConflict {
  typeName: string;
  definitions: TypeDefinition[];
  conflictType: 'duplicate' | 'inconsistent';
}

// 注意: TaintSourceは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type TaintSource = 'user-input' | 'database' | 'file-system' | 'network' | 'environment' | 'unknown';

// 注意: SecuritySinkは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type SecuritySink = 'database' | 'file-system' | 'network' | 'command' | 'eval' | 'dom' | 'unknown' | 'database-query' | 'html-output' | 'javascript-exec' | 'system-command' | 'file-write' | 'test-assertion';

// 注意: SanitizerTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export type SanitizerType = 'escape' | 'validate' | 'encode' | 'filter' | 'none' | 'html-escape' | 'sql-escape' | 'input-validation' | 'type-conversion' | 'string-sanitize' | 'json-parse';

// 注意: CleanupRuleは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface CleanupRule {
  pattern: string | RegExp;
  reason: string;
  enabled: boolean;
}

// 注意: ParsedFileは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ParsedFile {
  filePath: string;
  content: string;
  lines: string[];
}

// 注意: Patternは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Pattern {
  line: number;
  column: number;
  match: string;
}

// 注意: Assertionは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Assertion {
  type: string;
  location: CodeLocation;
}

// 注意: Importは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface Import {
  module: string;
  type?: string;
  imports?: string[];
}

// 注意: FileComplexityMetricsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface FileComplexityMetrics {
  totalLines: number;
  codeLines: number;
  testCount: number;
  assertionCount: number;
  avgComplexityPerTest: number;
  maxNestingDepth: number;
}

// 注意: DebugLevelは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  VERBOSE = 4,
  TRACE = 5
}

// 注意: ErrorTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  WARNING = 'WARNING',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// 注意: ErrorInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  recoverable: boolean;
}

// 注意: AnalysisLimitsは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface AnalysisLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大処理ファイル数 */
  maxFilesProcessed: number;
  /** 最大分析時間 (ms) */
  maxAnalysisTime: number;
  /** 最大メモリ使用量 (MB) */
  maxMemoryUsage: number;
  /** 最大コンテキスト行数 */
  maxContextLines: number;
  /** 最大ディレクトリ探索深度 */
  maxDepth: number;
  /** 最大プラグイン結果数 */
  maxPluginResults: number;
  /** 最大キャッシュサイズ (MB) */
  maxCacheSize: number;
}

// 注意: DashboardConfigは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface DashboardConfig {
  refreshInterval: number; // ms
  historyLimit: number;
  thresholds: {
    coverage: {
      lines: number;
      statements: number;
      functions: number;
      branches: number;
    };
    complexity: {
      average: number;
      max: number;
    };
    duplication: number;
    technicalDebt: number;
  };
  alerts: {
    enabled: boolean;
    channels: ('console' | 'file' | 'slack' | 'email')[];
  };
}

// 注意: RiskAssessmentInfoは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskAssessmentInfo {
  riskLevel: RiskLevel;
  score: number;
  category: string;
  affectedAssets: string[];
}

// 注意: IssueTypeAccuracyは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IssueTypeAccuracy {
  /** 問題の種別 */
  issueType: string;
  /** 検出数 */
  detected: number;
  /** 正解数 */
  actual: number;
  /** 精度 */
  precision: number | null;
  /** 再現率 */
  recall: number | null;
  /** 典型的な誤検知パターン */
  commonFalsePositives: string[];
  /** 典型的な見逃しパターン */
  commonMisses: string[];
}

// 注意: RiskAssessmentResultは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface RiskAssessmentResult {
  /** 評価ID */
  assessmentId: string;
  /** 固有リスクレベル（コントロール前） */
  inherentRiskLevel: string;
  /** 軽減後リスクレベル（コントロール後） */
  mitigatedRiskLevel: string;
  /** 全体的なリスクレベル */
  overallRiskLevel: string;
  /** 推奨事項 */
  recommendations: RiskRecommendation[];
  /** 詳細な脅威評価 */
  threatAssessments?: ThreatEventAssessment[];
  /** リスクスコア（0-100） */
  riskScore?: number;
}

// 注意: IssueTypeは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export enum IssueType {
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  LDAP_INJECTION = 'LDAP_INJECTION',
  XPATH_INJECTION = 'XPATH_INJECTION',
  MISSING_TEST = 'MISSING_TEST',
  INSUFFICIENT_ASSERTION = 'INSUFFICIENT_ASSERTION',
  TEST_QUALITY = 'TEST_QUALITY',
  CODE_QUALITY = 'CODE_QUALITY',
  SECURITY_MISCONFIGURATION = 'SECURITY_MISCONFIGURATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE'
}

// 注意: IssueBySeverityは2箇所で定義されています
// 選択元: /Users/sasakama/Projects/Rimor/src/core/types/unified-types.ts
export interface IssueBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}
