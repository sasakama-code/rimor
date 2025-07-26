/**
 * 型ベースセキュリティ解析 - 型システムエクスポート
 * v0.7.0: TaintTyperベースのモジュラー型解析システム
 */

// 型定義のインポート
import {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintMetadata,
  TaintTraceStep,
  TaintedValue,
  SafeValue,
  TaintLattice
} from './taint';

import {
  SecurityType,
  SecurityValidation,
  SecurityRequirement,
  SecureTest,
  UnsafeTest,
  ValidatedAuthTest,
  ValidatedInputTest,
  AuthTestCoverage,
  BoundaryCondition,
  PotentialVulnerability,
  TestCase,
  TestStatement,
  Variable,
  SecurityTypeAnnotation,
  TypeInferenceResult,
  CompileTimeResult,
  SecurityIssue,
  SecurityTestMetrics
} from './security';

import {
  SecurityLattice,
  SecurityViolation,
  LatticeAnalysisStats
} from './lattice';

// 汚染レベルと格子理論のエクスポート
export {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintMetadata,
  TaintTraceStep,
  TaintedValue,
  SafeValue,
  TaintLattice
};

// セキュリティ型システムのエクスポート
export {
  SecurityType,
  SecurityValidation,
  SecurityRequirement,
  SecureTest,
  UnsafeTest,
  ValidatedAuthTest,
  ValidatedInputTest,
  AuthTestCoverage,
  BoundaryCondition,
  PotentialVulnerability,
  TestCase,
  TestStatement,
  Variable,
  SecurityTypeAnnotation,
  TypeInferenceResult,
  CompileTimeResult,
  SecurityIssue,
  SecurityTestMetrics
};

// セキュリティ格子システムのエクスポート
export {
  SecurityLattice,
  SecurityViolation,  
  LatticeAnalysisStats
};


/**
 * テストメソッド
 */
export interface TestMethod {
  /** メソッド名 */
  name: string;
  /** ファイルパス */
  filePath: string;
  /** メソッドの内容 */
  content: string;
  /** メソッドシグネチャ */
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
  /** パラメータ */
  parameters: Parameter[];
  /** 戻り値の型 */
  returnType?: string;
  /** アノテーション */
  annotations?: string[];
  /** アクセス修飾子 */
  visibility?: 'private' | 'protected' | 'public';
  /** 非同期かどうか */
  isAsync: boolean;
}

/**
 * パラメータ
 */
export interface Parameter {
  /** パラメータ名 */
  name: string;
  /** 型 */
  type?: string;
  /** データソース */
  source?: 'user-input' | 'database' | 'api' | 'constant';
}

/**
 * メソッド解析結果
 */
export interface MethodAnalysisResult {
  /** メソッド名 */
  methodName: string;
  /** 検出された問題 */
  issues: SecurityIssue[];
  /** 品質メトリクス */
  metrics: SecurityTestMetrics;
  /** 改善提案 */
  suggestions: SecurityImprovement[];
  /** 解析時間 */
  analysisTime: number;
}

/**
 * メソッド変更
 */
export interface MethodChange {
  /** 変更の種別 */
  type: 'added' | 'modified' | 'deleted';
  /** メソッド */
  method: TestMethod;
  /** 変更の詳細 */
  details: string;
}

/**
 * インクリメンタル解析結果
 */
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

/**
 * 解析結果
 */
export interface AnalysisResult {
  /** メソッド名 */
  methodName: string;
  /** 結果 */
  result: MethodAnalysisResult;
  /** エラー（ある場合） */
  error?: string;
}

/**
 * 汚染解析結果
 */
export interface TaintAnalysisResult {
  /** セキュリティ格子 */
  lattice: SecurityLattice;
  /** セキュリティ違反 */
  violations: SecurityViolation[];
  /** 汚染パス */
  taintPaths: any[];
  /** クリティカルフロー */
  criticalFlows: any[];
}

/**
 * インクリメンタル更新結果
 */
export interface IncrementalUpdate {
  /** 更新されたメソッド */
  updatedMethods: string[];
  /** 無効化されたキャッシュ */
  invalidatedCache: string[];
  /** 新しい問題 */
  newIssues: SecurityIssue[];
  /** 解決された問題 */
  resolvedIssues: string[];
}

/**
 * セキュリティ改善提案
 */
export interface SecurityImprovement {
  /** 改善ID */
  id: string;
  /** 優先度 */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** 改善の種別 */
  type: 'add-sanitizer' | 'add-validation' | 'fix-assertion' | 'enhance-coverage';
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** 位置 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 推奨されるコード */
  suggestedCode?: string;
  /** 影響の推定 */
  estimatedImpact: {
    /** セキュリティスコアの改善 */
    securityImprovement: number;
    /** 実装時間（分） */
    implementationMinutes: number;
  };
  /** 自動修正可能かどうか */
  automatable: boolean;
}

/**
 * 型ベースセキュリティ解析の設定
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
 * 型ベースセキュリティ解析のメインインターフェース
 */
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

/**
 * モジュラー解析のインターフェース
 */
export interface ModularAnalysis {
  /** テストメソッド単位の解析 */
  analyzeMethod(method: TestMethod): Promise<MethodAnalysisResult>;
  
  /** インクリメンタル解析 */
  incrementalAnalyze(changes: MethodChange[]): Promise<IncrementalResult>;
  
  /** 並列解析 */
  analyzeInParallel(methods: TestMethod[]): Promise<MethodAnalysisResult[]>;
}