# Rimor v0.7.0 API仕様書
## TaintTyper型ベースセキュリティ解析システム API詳細仕様

### 目次
1. [概要](#概要)
2. [コア型システム](#コア型システム)
3. [解析エンジンAPI](#解析エンジンapi)
4. [プラグインシステムAPI](#プラグインシステムapi)
5. [検証・評価システムAPI](#検証評価システムapi)
6. [CLI API](#cli-api)
7. [設定システムAPI](#設定システムapi)
8. [エラーハンドリング](#エラーハンドリング)
9. [イベントシステム](#イベントシステム)
10. [拡張ポイント](#拡張ポイント)

---

## 概要

本仕様書では、Rimor v0.7.0のTaintTyper型ベースセキュリティ解析システムの全APIを詳述します。すべてのAPIはTypeScriptで定義され、型安全性とコンパイル時検証を保証します。

### API設計原則

- **型安全性**: すべてのAPIはTypeScriptの厳密な型チェックに準拠
- **モジュラー設計**: 各コンポーネントは独立してテスト・使用可能
- **ゼロランタイムオーバーヘッド**: すべての解析はコンパイル時に実行
- **拡張性**: プラグインシステムによる柔軟な機能拡張
- **パフォーマンス**: 5ms/file以下の目標を考慮した効率的設計

---

## コア型システム

### セキュリティ型定義

```typescript
/**
 * 汚染レベル列挙型（Dorothy Denningの格子理論に基づく）
 */
export enum TaintLevel {
  UNTAINTED = 0,           // ⊥（ボトム）- 完全に安全
  POSSIBLY_TAINTED = 1,    // 潜在的な汚染
  LIKELY_TAINTED = 2,      // 汚染の可能性が高い
  DEFINITELY_TAINTED = 3   // ⊤（トップ）- 確実に汚染
}

/**
 * セキュリティ型列挙型
 */
export enum SecurityType {
  USER_INPUT = 'user-input',
  DATABASE_QUERY = 'database-query',
  API_RESPONSE = 'api-response',
  SANITIZED_DATA = 'sanitized-data',
  VALIDATED_AUTH = 'validated-auth',
  ENCRYPTED_DATA = 'encrypted-data'
}

/**
 * 汚染メタデータ
 */
export interface TaintMetadata {
  /** 汚染源の識別子 */
  source: string;
  /** 汚染の伝播経路 */
  propagationPath: string[];
  /** 信頼度（0-1） */
  confidence: number;
  /** 位置情報 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 追加のコンテキスト情報 */
  context?: Record<string, any>;
}

/**
 * 汚染された値の表現
 */
export interface TaintedValue<T = any> {
  /** 実際の値 */
  value: T;
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** メタデータ */
  metadata: TaintMetadata;
}

/**
 * 安全な値の表現（ブランド型）
 */
export type SafeValue<T> = T & { __brand: 'safe-value' };
```

### テストケース型定義

```typescript
/**
 * テストケース基本型
 */
export interface TestCase {
  /** テストケース名 */
  name: string;
  /** テストファイルパス */
  file: string;
  /** テストコードの内容 */
  content: string;
  /** メタデータ */
  metadata: {
    /** フレームワーク種別 */
    framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'general';
    /** 言語 */
    language: 'javascript' | 'typescript';
    /** 最終更新日時 */
    lastModified: Date;
  };
}

/**
 * テストメソッド詳細型
 */
export interface TestMethod {
  /** メソッド名 */
  name: string;
  /** ファイルパス */
  filePath: string;
  /** メソッドの内容 */
  content: string;
  /** シグネチャ情報 */
  signature: MethodSignature;
  /** 位置情報 */
  location: {
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
  };
}

/**
 * メソッドシグネチャ
 */
export interface MethodSignature {
  /** メソッド名 */
  name: string;
  /** パラメータリスト */
  parameters: Parameter[];
  /** 戻り値の型 */
  returnType?: string;
  /** アノテーション */
  annotations: string[];
  /** アクセス修飾子 */
  visibility: 'private' | 'protected' | 'public';
}

/**
 * パラメータ定義
 */
export interface Parameter {
  /** パラメータ名 */
  name: string;
  /** 型情報 */
  type?: string;
  /** データソース */
  source?: 'user-input' | 'database' | 'api' | 'constant';
}
```

### セキュリティ問題型定義

```typescript
/**
 * セキュリティ問題基本型
 */
export interface SecurityIssue {
  /** 問題の一意識別子 */
  id: string;
  /** 問題の種別 */
  type: 'unsafe-taint-flow' | 'missing-sanitizer' | 'missing-auth-test' | 'type-inference-failed' | string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical' | 'error' | 'warning';
  /** 問題の説明 */
  message: string;
  /** 発生位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 修正提案 */
  suggestions?: string[];
  /** 汚染情報（該当する場合） */
  taintInfo?: TaintMetadata;
  /** 修正提案 */
  fixSuggestion?: string;
}

/**
 * セキュリティテストメトリクス
 */
export interface SecurityTestMetrics {
  /** セキュリティカバレッジ */
  securityCoverage: {
    /** 認証テストカバレッジ */
    authentication: number;
    /** 入力検証テストカバレッジ */
    inputValidation: number;
    /** APIセキュリティテストカバレッジ */
    apiSecurity: number;
    /** 全体カバレッジ */
    overall: number;
  };
  /** 汚染フロー検出精度 */
  taintFlowDetection: number;
  /** サニタイザーカバレッジ */
  sanitizerCoverage: number;
  /** 不変条件準拠度 */
  invariantCompliance: number;
}
```

---

## 解析エンジンAPI

### TypeBasedSecurityEngine

メイン解析エンジンのAPI仕様：

```typescript
/**
 * 型ベースセキュリティ解析エンジン設定
 */
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
}

/**
 * 型ベースセキュリティ解析エンジン
 */
export class TypeBasedSecurityEngine implements TypeBasedSecurityAnalysis, ModularAnalysis {
  constructor(config?: Partial<TypeBasedSecurityConfig>);

  /**
   * コンパイル時解析の実行（メインAPI）
   * @param testFiles 解析対象のテストファイル
   * @returns 解析結果
   */
  analyzeAtCompileTime(testFiles: TestCase[]): Promise<CompileTimeResult>;

  /**
   * 汚染レベルの推論
   * @param testFile 対象テストファイル
   * @returns 変数名→汚染レベルのマッピング
   */
  inferTaintLevels(testFile: TestCase): Promise<Map<string, TaintLevel>>;

  /**
   * セキュリティ型の推論
   * @param testFile 対象テストファイル
   * @returns 型推論結果
   */
  inferSecurityTypes(testFile: TestCase): Promise<TypeInferenceResult>;

  /**
   * セキュリティ不変条件の検証
   * @param testFile 対象テストファイル
   * @returns 不変条件違反のリスト
   */
  verifyInvariants(testFile: TestCase): Promise<SecurityViolation[]>;

  /**
   * テストメソッド単位の解析
   * @param method 解析対象メソッド
   * @returns メソッド解析結果
   */
  analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult>;

  /**
   * インクリメンタル解析
   * @param changes 変更されたメソッドのリスト
   * @returns インクリメンタル解析結果
   */
  incrementalAnalyze(changes: MethodChange[]): Promise<IncrementalResult>;

  /**
   * 設定の更新
   * @param newConfig 新しい設定
   */
  updateConfig(newConfig: Partial<TypeBasedSecurityConfig>): void;
}

/**
 * コンパイル時解析結果
 */
export interface CompileTimeResult {
  /** 検出された問題のリスト */
  issues: SecurityIssue[];
  /** 実行時間（ms） */
  executionTime: number;
  /** ランタイムへの影響（常に0） */
  runtimeImpact: 0;
  /** メソッド別解析結果 */
  methodResults?: MethodAnalysisResult[];
  /** 型システム検証結果 */
  typeValidation?: any;
  /** 統計情報 */
  statistics?: {
    totalFiles: number;
    analyzedMethods: number;
    cacheHits: number;
    cacheMisses: number;
    averageTimePerFile: number;
  };
}

/**
 * 型推論結果
 */
export interface TypeInferenceResult {
  /** 推論された型アノテーション */
  annotations?: SecurityTypeAnnotation[];
  /** 推論統計 */
  statistics: {
    totalVariables: number;
    inferred: number;
    failed: number;
    averageConfidence: number;
  };
  /** 推論時間（ms） */
  inferenceTime: number;
  /** 推論成功フラグ */
  successful?: boolean;
  /** 汚染レベルマップ */
  taintLevels?: Map<string, TaintLevel>;
  /** 信頼度 */
  confidence?: number;
}
```

### セキュリティ格子システム

```typescript
/**
 * セキュリティ格子（Dorothy Denningの格子理論実装）
 */
export class SecurityLattice {
  /**
   * 格子の結合演算（join）
   * @param a 汚染レベル A
   * @param b 汚染レベル B
   * @returns 結合結果
   */
  join(a: TaintLevel, b: TaintLevel): TaintLevel;

  /**
   * 格子の交わり演算（meet）
   * @param a 汚染レベル A
   * @param b 汚染レベル B
   * @returns 交わり結果
   */
  meet(a: TaintLevel, b: TaintLevel): TaintLevel;

  /**
   * 転送関数（transfer function）
   * @param stmt テスト文
   * @param input 入力汚染レベル
   * @returns 出力汚染レベル
   */
  transferFunction(stmt: TestStatement, input: TaintLevel): TaintLevel;

  /**
   * 汚染レベルの設定
   * @param nodeId ノードID
   * @param level 汚染レベル
   * @param metadata メタデータ
   */
  setTaintLevel(nodeId: string, level: TaintLevel, metadata: TaintMetadata): void;

  /**
   * セキュリティ不変条件の検証
   * @returns 不変条件違反のリスト
   */
  verifySecurityInvariants(): SecurityViolation[];
}

/**
 * セキュリティ不変条件違反
 */
export interface SecurityViolation {
  /** 違反の種別 */
  type: 'unsafe-taint-flow' | 'missing-sanitizer' | 'invariant-violation';
  /** 違反したノード/変数 */
  variable: string;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 説明メッセージ */
  message: string;
  /** 発生位置 */
  location?: {
    file: string;
    line: number;
    column: number;
  };
  /** 修正提案 */
  suggestedFix?: string;
  /** メタデータ */
  metadata: TaintMetadata;
}
```

### フロー感度解析

```typescript
/**
 * フロー感度解析システム
 */
export class FlowSensitiveAnalyzer {
  /**
   * セキュリティデータフローの追跡
   * @param method 解析対象メソッド
   * @returns データフローグラフ
   */
  trackSecurityDataFlow(method: TestMethod): DataFlowGraph;

  /**
   * フローグラフの構築
   * @param method 解析対象メソッド
   * @returns フローグラフ
   */
  buildFlowGraph(method: TestMethod): FlowGraph;

  /**
   * セキュリティ不変条件の検証
   * @param flowGraph フローグラフ
   * @returns 不変条件違反のリスト
   */
  verifySecurityInvariants(flowGraph: DataFlowGraph): SecurityViolation[];
}

/**
 * データフローグラフ
 */
export interface DataFlowGraph {
  /** ノードのリスト */
  nodes: FlowNode[];
  /** エッジのリスト */
  edges: FlowEdge[];
  /** パスのリスト */
  paths: FlowPath[];
}

/**
 * フローノード
 */
export interface FlowNode {
  /** ノードID */
  id: string;
  /** ノードの種別 */
  type: 'source' | 'sink' | 'sanitizer' | 'operation';
  /** 入力汚染レベル */
  inputTaint: TaintLevel;
  /** 出力汚染レベル */
  outputTaint: TaintLevel;
  /** 対応する文 */
  statement: TestStatement;
  /** メタデータ */
  metadata: TaintMetadata;
}

/**
 * フローエッジ
 */
export interface FlowEdge {
  /** エッジID */
  id: string;
  /** 開始ノード */
  from: string;
  /** 終了ノード */
  to: string;
  /** エッジの種別 */
  type: 'data-flow' | 'control-flow';
  /** 汚染の伝播 */
  taintPropagation: boolean;
}
```

---

## プラグインシステムAPI

### プラグイン基本インターフェース

```typescript
/**
 * テスト品質プラグイン基本インターフェース
 */
export interface ITestQualityPlugin {
  /** プラグインID */
  readonly id: string;
  /** プラグイン名 */
  readonly name: string;
  /** バージョン */
  readonly version: string;
  /** プラグインの種別 */
  readonly type: 'core' | 'framework' | 'pattern' | 'domain';

  /**
   * プラグインの適用可否判定
   * @param context プロジェクトコンテキスト
   * @returns 適用可能かどうか
   */
  isApplicable(context: ProjectContext): boolean;

  /**
   * パターンの検出
   * @param testFile テストファイル
   * @returns 検出結果
   */
  detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;

  /**
   * 品質の評価
   * @param patterns 検出されたパターン
   * @returns 品質スコア
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore;

  /**
   * 改善提案の生成
   * @param evaluation 品質評価結果
   * @returns 改善提案のリスト
   */
  suggestImprovements(evaluation: QualityScore): Improvement[];
}

/**
 * 型ベースセキュリティプラグイン（拡張インターフェース）
 */
export interface ITypeBasedSecurityPlugin extends ITestQualityPlugin {
  /** 必要とするセキュリティ型 */
  readonly requiredTypes: SecurityType[];
  /** 提供するセキュリティ型 */
  readonly providedTypes: SecurityType[];

  /**
   * メソッド単位の解析
   * @param method 解析対象メソッド
   * @returns 解析結果
   */
  analyzeMethod(method: TestMethod): MethodAnalysisResult;

  /**
   * データフローの追跡
   * @param method 解析対象メソッド
   * @returns フローグラフ
   */
  trackDataFlow(method: TestMethod): FlowGraph;

  /**
   * 汚染解析の実行
   * @param flow フローグラフ
   * @returns 汚染解析結果
   */
  analyzeTaint(flow: FlowGraph): TaintAnalysisResult;

  /**
   * セキュリティ型の推論
   * @param method 解析対象メソッド
   * @returns 型推論結果
   */
  inferSecurityTypes(method: TestMethod): TypeInferenceResult;

  /**
   * インクリメンタル更新
   * @param changes 変更のリスト
   * @returns 更新結果
   */
  updateAnalysis(changes: MethodChange[]): IncrementalUpdate;
}
```

### ドメイン辞書対応プラグイン

```typescript
/**
 * ドメイン辞書対応プラグイン
 */
export interface DictionaryAwarePlugin extends ITestQualityPlugin {
  /**
   * コンテキスト付き解析
   * @param testFile テストファイル
   * @param dictionary ドメイン辞書
   * @returns 文脈解析結果
   */
  analyzeWithContext(testFile: TestFile, dictionary: DomainDictionary): Promise<ContextualAnalysis>;

  /**
   * ドメイン品質の評価
   * @param patterns 検出パターン
   * @param context ドメインコンテキスト
   * @returns ドメイン品質スコア
   */
  evaluateDomainQuality(patterns: DetectionResult[], context: DomainContext): DomainQualityScore;
}

/**
 * プラグインマネージャー
 */
export class PluginManager {
  /**
   * プラグインの登録
   * @param plugin 登録するプラグイン
   */
  register(plugin: ITestQualityPlugin): void;

  /**
   * プラグインの取得
   * @param id プラグインID
   * @returns プラグインインスタンス
   */
  get(id: string): ITestQualityPlugin | undefined;

  /**
   * 適用可能なプラグインの取得
   * @param context プロジェクトコンテキスト
   * @returns 適用可能なプラグインのリスト
   */
  getApplicablePlugins(context: ProjectContext): ITestQualityPlugin[];

  /**
   * すべてのプラグインでの解析実行
   * @param testFile テストファイル
   * @param context プロジェクトコンテキスト
   * @returns 統合解析結果
   */
  runAllPlugins(testFile: TestFile, context: ProjectContext): Promise<PluginResults>;
}
```

---

## 検証・評価システムAPI

### 実世界プロジェクト検証

```typescript
/**
 * 実世界プロジェクト検証システム
 */
export class RealWorldProjectValidator {
  /**
   * 複数プロジェクトの包括的検証
   * @param projects 検証対象プロジェクトのリスト
   * @returns 検証結果のリスト
   */
  validateMultipleProjects(projects: RealWorldProject[]): Promise<ValidationResult[]>;

  /**
   * Express.jsプロジェクトの検証
   * @param projectPath プロジェクトパス
   * @returns 検証結果
   */
  validateExpressProject(projectPath: string): Promise<ValidationResult>;

  /**
   * Reactプロジェクトの検証
   * @param projectPath プロジェクトパス
   * @returns 検証結果
   */
  validateReactProject(projectPath: string): Promise<ValidationResult>;

  /**
   * NestJSプロジェクトの検証
   * @param projectPath プロジェクトパス
   * @returns 検証結果
   */
  validateNestJSProject(projectPath: string): Promise<ValidationResult>;
}

/**
 * 実世界プロジェクト情報
 */
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

/**
 * 検証結果
 */
export interface ValidationResult {
  /** プロジェクト情報 */
  project: RealWorldProject;
  /** 解析結果 */
  analysisResults: MethodAnalysisResult[];
  /** パフォーマンス測定 */
  performanceMetrics: {
    totalTime: number;
    timePerFile: number;
    memoryUsage: number;
    throughput: number;
  };
  /** 精度評価 */
  accuracyMetrics: {
    detectedIssues: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  /** セキュリティ評価 */
  securityAssessment: {
    overallScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    coverageByCategory: {
      authentication: number;
      inputValidation: number;
      authorization: number;
      dataProtection: number;
    };
  };
  /** フレームワーク固有の評価 */
  frameworkSpecificFindings: FrameworkSpecificFinding[];
}
```

### 精度評価システム

```typescript
/**
 * 精度評価システム
 */
export class AccuracyEvaluationSystem {
  /**
   * 包括的精度評価の実行
   * @param testCases テストケースのリスト
   * @param validationResults 検証結果（オプショナル）
   * @returns 詳細精度評価結果
   */
  evaluateAccuracy(
    testCases: TestCase[],
    validationResults?: ValidationResult[]
  ): Promise<DetailedAccuracyResult>;

  /**
   * リアルタイム精度監視
   * @param projects 監視対象プロジェクト
   */
  monitorAccuracyInRealTime(projects: RealWorldProject[]): Promise<void>;
}

/**
 * 精度測定結果
 */
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
    precision: number;
    /** 再現率（Recall） */
    recall: number;
    /** F1スコア */
    f1Score: number;
    /** 誤検知率 */
    falsePositiveRate: number;
    /** 偽陰性率 */
    falseNegativeRate: number;
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
```

### 大規模プロジェクト性能測定

```typescript
/**
 * 大規模プロジェクト性能測定システム
 */
export class LargeScalePerformanceValidator {
  /**
   * 大規模プロジェクトの性能測定
   * @param configs 測定設定のリスト
   * @returns 性能測定結果
   */
  measureLargeScalePerformance(configs: LargeScaleProjectConfig[]): Promise<PerformanceResult[]>;

  /**
   * スケーラビリティテストの実行
   * @param baseConfig 基本設定
   * @param minFiles 最小ファイル数
   * @param maxFiles 最大ファイル数
   * @param steps ステップ数
   * @returns スケーラビリティテスト結果
   */
  runScalabilityTest(
    baseConfig: LargeScaleProjectConfig,
    minFiles?: number,
    maxFiles?: number,
    steps?: number
  ): Promise<ScalabilityTestResult>;

  /**
   * エンタープライズ規模での検証
   * @returns エンタープライズ規模検証結果
   */
  validateEnterpriseScale(): Promise<PerformanceResult>;
}

/**
 * 大規模プロジェクト設定
 */
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

/**
 * 性能測定結果
 */
export interface PerformanceResult {
  /** プロジェクト設定 */
  config: LargeScaleProjectConfig;
  /** 実行時間メトリクス */
  timing: {
    totalTime: number;
    timePerFile: number;
    timePerMethod: number;
    setupTime: number;
    analysisTime: number;
    teardownTime: number;
  };
  /** メモリ使用量メトリクス */
  memory: {
    initialMemory: number;
    peakMemory: number;
    finalMemory: number;
    memoryPerFile: number;
  };
  /** 目標達成度 */
  targetAchievement: {
    fiveMsTarget: boolean;
    speedupTarget: boolean;
    actualSpeedup: number;
  };
}
```

---

## CLI API

### コマンドインターフェース

```typescript
/**
 * CLI コマンド基本インターフェース
 */
export interface CLICommand {
  /** コマンド名 */
  name: string;
  /** コマンドの説明 */
  description: string;
  /** オプションの定義 */
  options: CLIOption[];
  /** コマンドの実行 */
  execute(args: string[], options: Record<string, any>): Promise<void>;
}

/**
 * CLI オプション定義
 */
export interface CLIOption {
  /** オプション名 */
  name: string;
  /** 短縮形 */
  alias?: string;
  /** 説明 */
  description: string;
  /** デフォルト値 */
  default?: any;
  /** 必須フラグ */
  required?: boolean;
  /** 型 */
  type: 'string' | 'number' | 'boolean' | 'array';
}

/**
 * 解析コマンド
 */
export class AnalyzeCommand implements CLICommand {
  name = 'analyze';
  description = 'Run TaintTyper-based security analysis';
  
  /**
   * 解析の実行
   * @param targetPath 解析対象パス
   * @param options オプション
   */
  async execute(targetPath: string, options: AnalyzeOptions): Promise<void>;
}

/**
 * 解析オプション
 */
export interface AnalyzeOptions {
  /** 出力形式 */
  format?: 'text' | 'json' | 'xml' | 'junit';
  /** フレームワーク指定 */
  framework?: 'express' | 'react' | 'nestjs' | 'auto';
  /** 厳密度 */
  strictness?: 'strict' | 'moderate' | 'lenient';
  /** パターンマッチ */
  pattern?: string;
  /** 除外パターン */
  exclude?: string;
  /** 並列度 */
  parallelism?: number;
  /** AI最適化出力 */
  aiOutput?: boolean;
  /** 詳細ログ */
  verbose?: boolean;
  /** 出力ファイル */
  output?: string;
}

/**
 * 検証コマンド
 */
export class ValidateCommand implements CLICommand {
  name = 'validate';
  description = 'Validate real-world projects';
  
  /**
   * 検証の実行
   * @param options 検証オプション
   */
  async execute(options: ValidateCommandOptions): Promise<void>;

  /**
   * Express.js プロジェクト検証
   * @param projectPath プロジェクトパス
   * @param options オプション
   */
  async validateExpress(projectPath: string, options: ValidateCommandOptions): Promise<void>;

  /**
   * React プロジェクト検証
   * @param projectPath プロジェクトパス
   * @param options オプション
   */
  async validateReact(projectPath: string, options: ValidateCommandOptions): Promise<void>;

  /**
   * NestJS プロジェクト検証
   * @param projectPath プロジェクトパス
   * @param options オプション
   */
  async validateNestJS(projectPath: string, options: ValidateCommandOptions): Promise<void>;
}
```

---

## 設定システムAPI

### 設定管理

```typescript
/**
 * 設定管理システム
 */
export class ConfigManager {
  /**
   * 設定の読み込み
   * @param configPath 設定ファイルパス
   * @returns 設定オブジェクト
   */
  loadConfig(configPath?: string): Promise<RimorConfig>;

  /**
   * 設定の保存
   * @param config 設定オブジェクト
   * @param configPath 保存先パス
   */
  saveConfig(config: RimorConfig, configPath?: string): Promise<void>;

  /**
   * 設定の検証
   * @param config 設定オブジェクト
   * @returns 検証結果
   */
  validateConfig(config: RimorConfig): ConfigValidationResult;

  /**
   * デフォルト設定の取得
   * @returns デフォルト設定
   */
  getDefaultConfig(): RimorConfig;
}

/**
 * Rimor設定
 */
export interface RimorConfig {
  /** 解析設定 */
  analysis: {
    strictness: 'strict' | 'moderate' | 'lenient';
    enableCache: boolean;
    parallelism: number | 'auto';
    maxAnalysisTime: number;
  };
  
  /** セキュリティ設定 */
  security: {
    customSanitizers: string[];
    customSinks: string[];
    excludePatterns: string[];
    enableSandbox: boolean;
  };
  
  /** レポート設定 */
  reporting: {
    format: 'text' | 'json' | 'xml' | 'junit';
    includeAiOutput: boolean;
    outputDirectory: string;
    detailedReport: boolean;
  };
  
  /** パフォーマンス設定 */
  performance: {
    targetTimePerFile: number;
    maxMemoryUsage: number;
    enableProgressiveAi: boolean;
  };
  
  /** プラグイン設定 */
  plugins: {
    enabledPlugins: string[];
    pluginPaths: string[];
    pluginConfig: Record<string, any>;
  };
  
  /** ドメイン辞書設定 */
  dictionary: {
    dictionaryPath?: string;
    enableContextAnalysis: boolean;
    customTerms: Record<string, any>;
  };
}
```

---

## エラーハンドリング

### エラー型定義

```typescript
/**
 * Rimor基本エラー
 */
export class RimorError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'RIMOR_ERROR',
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'RimorError';
  }
}

/**
 * 解析エラー
 */
export class AnalysisError extends RimorError {
  constructor(message: string, public readonly filePath?: string, details?: Record<string, any>) {
    super(message, 'ANALYSIS_ERROR', { ...details, filePath });
    this.name = 'AnalysisError';
  }
}

/**
 * 設定エラー
 */
export class ConfigurationError extends RimorError {
  constructor(message: string, public readonly configKey?: string) {
    super(message, 'CONFIG_ERROR', { configKey });
    this.name = 'ConfigurationError';
  }
}

/**
 * パフォーマンスエラー
 */
export class PerformanceError extends RimorError {
  constructor(message: string, public readonly actualTime: number, public readonly targetTime: number) {
    super(message, 'PERFORMANCE_ERROR', { actualTime, targetTime });
    this.name = 'PerformanceError';
  }
}

/**
 * プラグインエラー
 */
export class PluginError extends RimorError {
  constructor(message: string, public readonly pluginId: string) {
    super(message, 'PLUGIN_ERROR', { pluginId });
    this.name = 'PluginError';
  }
}
```

### エラーハンドリングユーティリティ

```typescript
/**
 * エラーハンドリングユーティリティ
 */
export class ErrorHandler {
  /**
   * エラーの分類
   * @param error エラーオブジェクト
   * @returns エラー分類結果
   */
  classifyError(error: Error): ErrorClassification;

  /**
   * エラーの回復試行
   * @param error エラーオブジェクト
   * @param context エラーコンテキスト
   * @returns 回復可能かどうか
   */
  attemptRecovery(error: Error, context: ErrorContext): Promise<boolean>;

  /**
   * エラーレポートの生成
   * @param error エラーオブジェクト
   * @param context エラーコンテキスト
   * @returns エラーレポート
   */
  generateErrorReport(error: Error, context: ErrorContext): ErrorReport;
}

/**
 * エラー分類
 */
export interface ErrorClassification {
  category: 'user-error' | 'system-error' | 'performance-error' | 'plugin-error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestions: string[];
}
```

---

## イベントシステム

### イベント型定義

```typescript
/**
 * イベントベースシステム
 */
export class EventEmitter {
  /**
   * イベントリスナーの登録
   * @param event イベント名
   * @param listener リスナー関数
   */
  on<T extends keyof RimorEvents>(event: T, listener: RimorEvents[T]): void;

  /**
   * イベントの発火
   * @param event イベント名
   * @param data イベントデータ
   */
  emit<T extends keyof RimorEvents>(event: T, data: Parameters<RimorEvents[T]>[0]): void;

  /**
   * イベントリスナーの削除
   * @param event イベント名
   * @param listener リスナー関数
   */
  off<T extends keyof RimorEvents>(event: T, listener: RimorEvents[T]): void;
}

/**
 * Rimorイベント定義
 */
export interface RimorEvents {
  /** 解析開始 */
  'analysis:start': (data: { files: string[]; timestamp: Date }) => void;
  
  /** 解析完了 */
  'analysis:complete': (data: { results: AnalysisResult[]; duration: number }) => void;
  
  /** ファイル解析開始 */
  'analysis:file:start': (data: { file: string; timestamp: Date }) => void;
  
  /** ファイル解析完了 */
  'analysis:file:complete': (data: { file: string; issues: SecurityIssue[]; duration: number }) => void;
  
  /** エラー発生 */
  'error': (data: { error: Error; context: any }) => void;
  
  /** 進捗更新 */
  'progress': (data: { completed: number; total: number; percentage: number }) => void;
  
  /** パフォーマンス警告 */
  'performance:warning': (data: { file: string; actualTime: number; targetTime: number }) => void;
  
  /** キャッシュヒット */
  'cache:hit': (data: { key: string; timestamp: Date }) => void;
  
  /** キャッシュミス */
  'cache:miss': (data: { key: string; timestamp: Date }) => void;
}
```

---

## 拡張ポイント

### カスタマイゼーション

```typescript
/**
 * カスタムフォーマッター
 */
export interface OutputFormatter {
  /**
   * 解析結果のフォーマット
   * @param results 解析結果
   * @returns フォーマット済み文字列
   */
  format(results: AnalysisResult[]): string;
}

/**
 * カスタムレポーター
 */
export interface Reporter {
  /**
   * レポートの生成
   * @param results 解析結果
   * @param options レポートオプション
   */
  generateReport(results: AnalysisResult[], options: ReportOptions): Promise<void>;
}

/**
 * カスタムキャッシュプロバイダー
 */
export interface CacheProvider {
  /**
   * キャッシュの取得
   * @param key キー
   * @returns キャッシュされた値
   */
  get<T>(key: string): Promise<T | undefined>;

  /**
   * キャッシュの設定
   * @param key キー
   * @param value 値
   * @param ttl 有効期限（ms）
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * キャッシュの削除
   * @param key キー
   */
  delete(key: string): Promise<void>;

  /**
   * キャッシュのクリア
   */
  clear(): Promise<void>;
}
```

### プラグイン開発用ユーティリティ

```typescript
/**
 * プラグイン開発ヘルパー
 */
export class PluginHelper {
  /**
   * AST解析ヘルパー
   * @param code ソースコード
   * @returns AST
   */
  static parseCode(code: string): AST;

  /**
   * パターンマッチヘルパー
   * @param code ソースコード
   * @param patterns パターンのリスト
   * @returns マッチ結果
   */
  static matchPatterns(code: string, patterns: RegExp[]): MatchResult[];

  /**
   * 型情報抽出ヘルパー
   * @param node ASTノード
   * @returns 型情報
   */
  static extractTypeInfo(node: ASTNode): TypeInfo;

  /**
   * セキュリティパターン検出ヘルパー
   * @param code ソースコード
   * @returns セキュリティパターンのリスト
   */
  static detectSecurityPatterns(code: string): SecurityPattern[];
}

/**
 * テストユーティリティ
 */
export class TestUtils {
  /**
   * モックテストケースの生成
   * @param options 生成オプション
   * @returns モックテストケース
   */
  static createMockTestCase(options: MockTestCaseOptions): TestCase;

  /**
   * テスト実行環境のセットアップ
   * @param config テスト設定
   */
  static setupTestEnvironment(config: TestConfig): Promise<void>;

  /**
   * アサーションヘルパー
   * @param actual 実際の値
   * @param expected 期待値
   * @param message エラーメッセージ
   */
  static assertAnalysisResult(
    actual: AnalysisResult,
    expected: Partial<AnalysisResult>,
    message?: string
  ): void;
}
```

---

## 使用例

### 基本的な使用例

```typescript
import { TypeBasedSecurityEngine, TestCase } from 'rimor';

// エンジンの初期化
const engine = new TypeBasedSecurityEngine({
  strictness: 'moderate',
  enableCache: true,
  parallelism: 4
});

// テストケースの準備
const testCases: TestCase[] = [
  {
    name: 'AuthTest',
    file: './test/auth.test.ts',
    content: `
      it('should validate JWT token', () => {
        const token = jwt.sign({ userId: 123 }, secret);
        expect(validateToken(token)).toBe(true);
      });
    `,
    metadata: {
      framework: 'express',
      language: 'typescript',
      lastModified: new Date()
    }
  }
];

// 解析の実行
const result = await engine.analyzeAtCompileTime(testCases);

// 結果の確認
console.log(`検出された問題: ${result.issues.length}件`);
console.log(`実行時間: ${result.executionTime}ms`);
console.log(`ランタイムオーバーヘッド: ${result.runtimeImpact}ms`); // 常に0
```

### カスタムプラグインの作成例

```typescript
import { ITypeBasedSecurityPlugin, TestMethod, SecurityIssue } from 'rimor';

class CustomAuthPlugin implements ITypeBasedSecurityPlugin {
  readonly id = 'custom-auth-plugin';
  readonly name = 'Custom Authentication Plugin';
  readonly version = '1.0.0';
  readonly type = 'domain';
  readonly requiredTypes = [SecurityType.USER_INPUT];
  readonly providedTypes = [SecurityType.VALIDATED_AUTH];

  isApplicable(context: ProjectContext): boolean {
    return context.framework === 'express';
  }

  async analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult> {
    const issues: SecurityIssue[] = [];

    // カスタム解析ロジック
    if (method.name.includes('auth') && !method.content.includes('expect')) {
      issues.push({
        id: 'missing-auth-assertion',
        type: 'missing-auth-test',
        severity: 'warning',
        message: '認証テストにアサーションが不足しています',
        location: {
          file: method.filePath,
          line: 1,
          column: 1
        }
      });
    }

    return {
      methodName: method.name,
      issues,
      metrics: this.calculateMetrics(method),
      suggestions: [],
      analysisTime: 0
    };
  }

  // その他の必須メソッドの実装...
}

// プラグインの登録
const pluginManager = new PluginManager();
pluginManager.register(new CustomAuthPlugin());
```

---

## パフォーマンス考慮事項

### 最適化のガイドライン

1. **メモリ効率**: 大規模プロジェクトでは`parallelism`を調整してメモリ使用量を制御
2. **キャッシュ活用**: `enableCache: true`でリピート解析を高速化
3. **インクリメンタル解析**: 変更分のみの解析で開発時の応答性を向上
4. **バッチ処理**: 大量のファイルは適切なチャンクサイズで分割処理

### パフォーマンス監視

```typescript
// パフォーマンス監視の例
engine.on('performance:warning', (data) => {
  console.warn(`Performance warning: ${data.file} took ${data.actualTime}ms (target: ${data.targetTime}ms)`);
});

engine.on('analysis:complete', (data) => {
  const avgTime = data.duration / data.results.length;
  if (avgTime > 5.0) {
    console.warn(`Average analysis time ${avgTime.toFixed(2)}ms exceeds 5ms target`);
  }
});
```

---

本API仕様書は、Rimor v0.7.0の全機能を網羅しています。詳細な実装例やベストプラクティスについては、[ユーザーガイド](./user-guide.md)および関連ドキュメントを参照してください。

**Rimor v0.7.0** - TaintTyper型ベースセキュリティテスト品質監査システム  
API仕様書 v1.0.0 | 最終更新: 2024年