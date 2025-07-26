// 既存のシンプルなプラグインインターフェース（後方互換性のため保持）
export interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}

export interface Issue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
  line?: number;  // 行番号（オプション）
  file?: string;  // ファイルパス（オプション）
}

// 高度なプラグインインターフェース（v0.3.0）
export interface ITestQualityPlugin {
  // プラグイン識別情報
  id: string;
  name: string;
  version: string;
  type: 'core' | 'framework' | 'pattern' | 'domain';
  
  // プラグインの適用条件
  isApplicable(context: ProjectContext): boolean;
  
  // メイン機能
  detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  evaluateQuality(patterns: DetectionResult[]): QualityScore;
  suggestImprovements(evaluation: QualityScore): Improvement[];
  
  // オプション機能
  autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
  learn?(feedback: Feedback): void;
}

// プロジェクトコンテキスト
export interface ProjectContext {
  rootPath: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'other';
  testFramework?: string;
  packageJson?: any;
  tsConfig?: any;
  customConfig?: Record<string, any>;
  filePatterns: {
    test: string[];
    source: string[];
    ignore: string[];
  };
}

// テストファイル表現
export interface TestFile {
  path: string;
  content: string;
  ast?: any; // 将来的なAST対応
  metadata: {
    framework?: string;
    language: string;
    lastModified: Date;
  };
}

// プラグイン実行結果
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  detectionResults: DetectionResult[];
  qualityScore: QualityScore;
  improvements: Improvement[];
  executionTime: number;
  error?: string;
}

// パターン検出結果
export interface DetectionResult {
  patternId: string;
  patternName: string;
  location: CodeLocation;
  confidence: number; // 0.0-1.0
  evidence: Evidence[];
  metadata?: Record<string, any>;
}

export interface Evidence {
  type: string;
  description: string;
  location: CodeLocation;
  code: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// 品質評価
export interface QualityScore {
  overall: number; // 0-100
  breakdown: ScoreBreakdown;
  confidence: number; // 0.0-1.0
  metadata?: Record<string, any>;
}

// スコア内訳
export interface ScoreBreakdown {
  completeness: number;
  correctness: number;
  maintainability: number;
  [dimension: string]: number;
}

// 詳細スコア情報（内部処理用）
export interface DetailedScoreBreakdown {
  completeness: DetailedScore;
  correctness: DetailedScore;
  maintainability: DetailedScore;
  [dimension: string]: DetailedScore;
}

export interface DetailedScore {
  score: number;
  weight: number;
  issues: string[];
}

// 評価ディメンション
export type QualityDimension = 
  | 'completeness'    // 網羅性
  | 'correctness'     // 正確性
  | 'maintainability' // 保守性
  | 'performance'     // パフォーマンス
  | 'security';       // セキュリティ

// 改善提案
export interface Improvement {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'add' | 'modify' | 'remove' | 'refactor';
  title: string;
  description: string;
  location: CodeLocation;
  suggestedCode?: CodeSnippet;
  estimatedImpact: {
    scoreImprovement: number;
    effortMinutes: number;
  };
  automatable: boolean;
}

// 自動修正結果
export interface FixResult {
  success: boolean;
  applied: AppliedFix[];
  failed: FailedFix[];
  summary: string;
}

export interface AppliedFix {
  improvementId: string;
  filePath: string;
  changes: CodeChange[];
}

export interface FailedFix {
  improvementId: string;
  reason: string;
  manualSteps?: string[];
}

// コード位置情報
export interface CodeLocation {
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

// コード変更情報
export interface CodeChange {
  type: 'insert' | 'replace' | 'delete';
  location: CodeLocation;
  oldCode?: string;
  newCode?: string;
}

// コードスニペット
export interface CodeSnippet {
  language: string;
  code: string;
  description?: string;
}

// フィードバック
export interface Feedback {
  pluginId: string;
  improvementId?: string;
  rating: number; // 1-5
  comment?: string;
  outcome: 'accepted' | 'rejected' | 'modified';
}

// ========================================
// ドメイン辞書システム v0.6.0 型定義
// ========================================

// ドメイン辞書メイン構造
export interface DomainDictionary {
  version: string;
  domain: string;
  language: string;
  lastUpdated: Date;
  
  // 用語定義
  terms: DomainTerm[];
  
  // 概念間の関係
  relationships: TermRelationship[];
  
  // ビジネスルール
  businessRules: BusinessRule[];
  
  // 品質基準
  qualityStandards: QualityStandard[];
  
  // コンテキストマッピング
  contextMappings: ContextMapping[];
}

// ドメイン用語定義
export interface DomainTerm {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  examples: {
    code: string;
    description: string;
  }[];
  relatedPatterns: string[];
  testRequirements: string[];
}

// 用語間の関係
export interface TermRelationship {
  id: string;
  type: 'synonym' | 'antonym' | 'parent' | 'child' | 'related';
  sourceTermId: string;
  targetTermId: string;
  strength: number; // 0.0-1.0
  description?: string;
}

// ビジネスルール定義
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  domain: string;
  condition: RuleCondition;
  requirements: TestRequirement[];
  priority: number;
  compliance?: {
    standard: string;
    clause: string;
  };
}

// ルール条件
export interface RuleCondition {
  type: 'code-pattern' | 'function-name' | 'data-type' | 'api-endpoint';
  pattern: string; // 正規表現またはパターン
  scope: 'file' | 'class' | 'function' | 'variable';
}

// テスト要件
export interface TestRequirement {
  type: 'must-have' | 'should-have' | 'nice-to-have';
  description: string;
  testPattern: string;
  example?: string;
}

// 品質基準
export interface QualityStandard {
  id: string;
  name: string;
  description: string;
  criteria: QualityCriterion[];
  weight: number;
}

// 品質基準項目
export interface QualityCriterion {
  name: string;
  description: string;
  threshold: number;
  measurement: 'count' | 'percentage' | 'ratio';
}

// コンテキストマッピング
export interface ContextMapping {
  id: string;
  context: string;
  termIds: string[];
  ruleIds: string[];
  priority: number;
}

// 知識抽出結果
export interface ExtractedKnowledge {
  terms: DomainTerm[];
  patterns: CodePattern[];
  rules: InferredRule[];
  confidence: number; // 0.0-1.0
}

// コードパターン
export interface CodePattern {
  id: string;
  name: string;
  pattern: string;
  description: string;
  examples: string[];
  frequency: number;
}

// 推論されたルール
export interface InferredRule {
  id: string;
  name: string;
  pattern: string;
  confidence: number;
  evidence: string[];
  suggestedRequirements: TestRequirement[];
}

// 学習オプション
export interface LearningOptions {
  includeComments: boolean;
  includeTests: boolean;
  minFrequency: number;
  maxTerms: number;
}

// テストパターン
export interface TestPatterns {
  patterns: CodePattern[];
  coverage: TestCoverage;
  quality: TestQualityMetrics;
}

// テストカバレッジ
export interface TestCoverage {
  functions: number;
  statements: number;
  branches: number;
  overall: number;
}

// テスト品質メトリクス
export interface TestQualityMetrics {
  assertionRatio: number;
  complexityScore: number;
  maintainabilityScore: number;
}

// コードコンテキスト
export interface CodeContext {
  filePath: string;
  language: string;
  functions: FunctionContext[];
  classes: ClassContext[] | string[];
  imports: ImportContext[];
  domainRelevance: number; // 0.0-1.0
  relatedTerms: DomainTerm[];
}

// 関数コンテキスト
export interface FunctionContext {
  name: string;
  parameters?: string[];
  returnType?: string;
  complexity: number;
  location?: CodeLocation;
}

// クラスコンテキスト
export interface ClassContext {
  name: string;
  methods?: string[];
  properties?: string[];
  location?: CodeLocation;
}

// インポートコンテキスト
export interface ImportContext {
  module: string;
  imports?: string[];
  type?: 'default' | 'named' | 'namespace';
  path?: string;
}

// 重要度レベル
export interface ImportanceLevel {
  level: 'critical' | 'high' | 'medium' | 'low';
  score: number; // 0-100
  reasons: string[];
}

// 文脈理解分析結果
export interface ContextualAnalysis {
  context: CodeContext;
  relevantTerms: TermRelevance[];
  applicableRules: BusinessRule[];
  requiredTests: TestRequirement[];
  qualityScore: number;
}

// 用語関連度
export interface TermRelevance {
  term: DomainTerm;
  relevance: number; // 0.0-1.0
  evidence: string[];
  locations: CodeLocation[];
}

// ドメインコンテキスト
export interface DomainContext {
  domain: string;
  primaryTerms: DomainTerm[];
  activeRules: BusinessRule[];
  qualityThreshold: number;
}

// ドメイン品質スコア
export interface DomainQualityScore {
  overall: number;
  dimensions: {
    domainAlignment: number;
    businessCompliance: number;
    technicalQuality: number;
  };
  recommendations: string[];
}

// 用語候補
export interface TermCandidate {
  term: string;
  frequency: number;
  contexts: string[];
  confidence: number;
  suggestedCategory: string;
  suggestedImportance: 'critical' | 'high' | 'medium' | 'low';
}

// 品質メトリクス
export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  coverage: number;
  overall: number;
}

// 辞書差分
export interface DictionaryDiff {
  added: {
    terms: DomainTerm[];
    rules: BusinessRule[];
  };
  modified: {
    terms: { old: DomainTerm; new: DomainTerm }[];
    rules: { old: BusinessRule; new: BusinessRule }[];
  };
  removed: {
    terms: DomainTerm[];
    rules: BusinessRule[];
  };
}

// 使用統計
export interface UsageStatistics {
  termUsage: Map<string, number>;
  ruleApplication: Map<string, number>;
  contextHits: Map<string, number>;
  lastAccessed: Map<string, Date>;
}

// キャッシュエントリ
export interface CachedEntry {
  key: string;
  value: any;
  timestamp: Date;
  ttl: number;
  accessCount: number;
}

// ドメイン辞書対応プラグインインターフェース
export interface DictionaryAwarePlugin extends ITestQualityPlugin {
  // 辞書を使用した分析
  analyzeWithContext(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis>;
  
  // ドメイン固有の品質評価
  evaluateDomainQuality(
    patterns: DetectionResult[],
    context: DomainContext
  ): DomainQualityScore;
}

// ========================================
// 型ベースセキュリティテスト品質監査システム v0.7.0 統合型定義
// ========================================

// 型ベースセキュリティプラグインインターフェース
export interface ITypeBasedSecurityPlugin extends ITestQualityPlugin {
  // 型システムとの統合
  readonly requiredTypes: SecurityType[];
  readonly providedTypes: SecurityType[];
  
  // モジュラー解析
  analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult>;
  
  // フロー感度
  trackDataFlow(method: TestMethod): Promise<FlowGraph>;
  
  // 格子ベースの汚染解析
  analyzeTaint(flow: FlowGraph): Promise<TaintAnalysisResult>;
  
  // 型推論
  inferSecurityTypes(method: TestMethod): Promise<TypeInferenceResult>;
  
  // インクリメンタル更新
  updateAnalysis(changes: MethodChange[]): Promise<IncrementalUpdate>;
}

// セキュリティ型列挙
export enum SecurityType {
  USER_INPUT = 'user-input',
  AUTH_TOKEN = 'auth-token',
  VALIDATED_AUTH = 'validated-auth',
  VALIDATED_INPUT = 'validated-input',
  SANITIZED_DATA = 'sanitized-data',
  SECURE_SQL = 'secure-sql',
  SECURE_HTML = 'secure-html'
}

// 汚染レベル列挙  
export enum TaintLevel {
  UNTAINTED = 0,
  POSSIBLY_TAINTED = 1,
  LIKELY_TAINTED = 2,
  DEFINITELY_TAINTED = 3
}

// テストメソッド
export interface TestMethod {
  name: string;
  filePath: string;
  content: string;
  signature: MethodSignature;
  location: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  };
}

// メソッドシグネチャ
export interface MethodSignature {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  annotations: string[];
  visibility: 'private' | 'protected' | 'public';
}

// パラメータ
export interface Parameter {
  name: string;
  type?: string;
  source?: 'user-input' | 'database' | 'api' | 'constant';
}

// メソッド解析結果
export interface MethodAnalysisResult {
  methodName: string;
  issues: SecurityIssue[];
  metrics: SecurityTestMetrics;
  suggestions: SecurityImprovement[];
  analysisTime: number;
}

// フローグラフ
export interface FlowGraph {
  nodes: FlowNode[];
  entry: string;
  exit: string;
  taintSources: FlowNode[];
  securitySinks: FlowNode[];
  sanitizers: FlowNode[];
  paths: FlowPath[];
}

// フローノード
export interface FlowNode {
  id: string;
  statement: TestStatement;
  inputTaint: TaintLevel;
  outputTaint: TaintLevel;
  metadata?: TaintMetadata;
  successors: string[];
  predecessors: string[];
}

// フローパス
export interface FlowPath {
  id: string;
  nodes: string[];
  taintLevel: TaintLevel;
  passedThroughSanitizer: boolean;
  reachesSecuritySink: boolean;
  length: number;
}

// テストステートメント
export interface TestStatement {
  type: 'assignment' | 'methodCall' | 'assertion' | 'sanitizer' | 'userInput';
  content: string;
  location: { line: number; column: number };
  lhs?: string;
  rhs?: string;
  method?: string;
  arguments?: any[];
  returnValue?: string;
  actual?: string;
  expected?: string;
  isNegativeAssertion?: boolean;
}

// 汚染メタデータ
export interface TaintMetadata {
  source: TaintSource;
  confidence: number;
  location: { file: string; line: number; column: number };
  tracePath: TaintTraceStep[];
  securityRules: string[];
}

// 汚染源
export enum TaintSource {
  USER_INPUT = 'user-input',
  EXTERNAL_API = 'external-api',
  ENVIRONMENT = 'environment',
  FILE_SYSTEM = 'file-system',
  DATABASE = 'database',
  NETWORK = 'network'
}

// 汚染追跡ステップ
export interface TaintTraceStep {
  type: 'propagate' | 'sanitize' | 'merge' | 'branch';
  description: string;
  inputTaint: TaintLevel;
  outputTaint: TaintLevel;
  location: { file: string; line: number; column: number };
}

// 汚染解析結果
export interface TaintAnalysisResult {
  lattice: any; // SecurityLattice
  violations: SecurityViolation[];
  taintPaths: TaintPath[];
  criticalFlows: CriticalFlow[];
}

// セキュリティ違反
export interface SecurityViolation {
  type: 'unsanitized-taint-flow' | 'missing-sanitizer' | 'unsafe-assertion';
  variable: string;
  taintLevel: TaintLevel;
  metadata: TaintMetadata;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
}

// 汚染パス
export interface TaintPath {
  id: string;
  source: string;
  sink: string;
  path: string[];
  taintLevel: TaintLevel;
}

// クリティカルフロー
export interface CriticalFlow {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 型推論結果
export interface TypeInferenceResult {
  annotations: SecurityTypeAnnotation[];
  statistics: {
    totalVariables: number;
    inferred: number;
    failed: number;
    averageConfidence: number;
  };
  inferenceTime: number;
}

// セキュリティ型注釈
export interface SecurityTypeAnnotation {
  target: string;
  securityType: SecurityType;
  taintLevel: TaintLevel;
  confidence: number;
  evidence: string[];
}

// メソッド変更
export interface MethodChange {
  type: 'added' | 'modified' | 'deleted';
  method: TestMethod;
  details: string;
}

// インクリメンタル更新
export interface IncrementalUpdate {
  updatedMethods: string[];
  invalidatedCache: string[];
  newIssues: SecurityIssue[];
  resolvedIssues: string[];
}

// セキュリティ問題
export interface SecurityIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type: 'missing-sanitizer' | 'unsafe-taint-flow' | 'missing-auth-test' | 'insufficient-validation';
  message: string;
  location: { file: string; line: number; column: number; method?: string };
  fixSuggestion?: string;
  taintInfo?: TaintMetadata;
}

// セキュリティテストメトリクス
export interface SecurityTestMetrics {
  securityCoverage: {
    authentication: number;
    inputValidation: number;
    apiSecurity: number;
    overall: number;
  };
  taintFlowDetection: number;
  sanitizerCoverage: number;
  invariantCompliance: number;
}

// セキュリティ改善提案
export interface SecurityImprovement {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'add-sanitizer' | 'add-validation' | 'fix-assertion' | 'enhance-coverage';
  title: string;
  description: string;
  location: { file: string; line: number; column: number };
  suggestedCode?: string;
  estimatedImpact: { securityImprovement: number; implementationMinutes: number };
  automatable: boolean;
}