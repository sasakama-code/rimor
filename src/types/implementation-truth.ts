/**
 * Implementation Truth - プロダクションコードの実装の真実を表現する型定義
 * v0.9.0 - AIコーディング時代の品質保証エンジンへの進化
 * 
 * Defensive Programming: 厳密な型定義によるコンパイル時安全性確保
 * SOLID原則: 単一責任の原則に従った型分離
 */

import { TaintLevel, TaintSource } from '../types/common-types';
import { SecurityIssue } from '../security/types';

/**
 * メソッドの振る舞いを表現
 */
export interface MethodBehavior {
  /**
   * メソッド名
   */
  name: string;
  
  /**
   * メソッドの引数定義
   */
  parameters: MethodParameter[];
  
  /**
   * 戻り値の型情報
   */
  returnType: TypeInfo;
  
  /**
   * メソッド内部で呼び出される他のメソッド
   */
  callsToMethods: string[];
  
  /**
   * データフロー情報
   */
  dataFlow: DataFlow;
  
  /**
   * 副作用の情報
   */
  sideEffects: SideEffect[];
  
  /**
   * 例外処理の情報
   */
  exceptionHandling: ExceptionInfo[];
  
  /**
   * セキュリティ関連の情報
   */
  securityProfile: MethodSecurityProfile;
}

/**
 * メソッドのパラメータ情報
 */
export interface MethodParameter {
  name: string;
  type: TypeInfo;
  isOptional: boolean;
  defaultValue?: unknown;
  taintLevel: TaintLevel;
}

/**
 * 型情報
 */
export interface TypeInfo {
  name: string;
  isArray: boolean;
  isNullable: boolean;
  genericTypes?: TypeInfo[];
  properties?: PropertyInfo[];
}

/**
 * プロパティ情報
 */
export interface PropertyInfo {
  name: string;
  type: TypeInfo;
  isReadonly: boolean;
  isOptional: boolean;
}

/**
 * データフロー情報
 */
export interface DataFlow {
  /**
   * 入力データの経路
   */
  inputPaths: DataPath[];
  
  /**
   * 出力データの経路
   */
  outputPaths: DataPath[];
  
  /**
   * データの変換処理
   */
  transformations: DataTransformation[];
  
  /**
   * 汚染データの伝播経路
   */
  taintPropagation: TaintPropagation[];
}

/**
 * データの経路情報
 */
export interface DataPath {
  source: string;
  destination: string;
  dataType: TypeInfo;
  taintLevel: TaintLevel;
  isValidated: boolean;
  isSanitized: boolean;
}

/**
 * データ変換処理
 */
export interface DataTransformation {
  inputType: TypeInfo;
  outputType: TypeInfo;
  transformationMethod: string;
  preservesTaint: boolean;
  validationApplied: boolean;
}

/**
 * 汚染データの伝播情報
 */
export interface TaintPropagation {
  fromVariable: string;
  toVariable: string;
  propagationType: 'direct' | 'indirect' | 'conditional';
  taintLevel: TaintLevel;
  source: TaintSource;
}

/**
 * 副作用の情報
 */
export interface SideEffect {
  type: 'file_write' | 'database_write' | 'network_call' | 'state_mutation' | 'logging' | 'other';
  description: string;
  affectedResources: string[];
  isPersistent: boolean;
  securityImplications: SecurityIssue[];
}

/**
 * 例外処理情報
 */
export interface ExceptionInfo {
  exceptionType: string;
  handlingMethod: 'try_catch' | 'throws' | 'unhandled';
  recoverability: 'recoverable' | 'non_recoverable';
  securityRisk: 'low' | 'medium' | 'high';
}

/**
 * メソッドのセキュリティプロファイル
 */
export interface MethodSecurityProfile {
  /**
   * 認証が必要かどうか
   */
  requiresAuthentication: boolean;
  
  /**
   * 認可が必要かどうか
   */
  requiresAuthorization: boolean;
  
  /**
   * 入力検証が実装されているか
   */
  hasInputValidation: boolean;
  
  /**
   * 出力のサニタイゼーションが実装されているか
   */
  hasOutputSanitization: boolean;
  
  /**
   * セキュリティ脆弱性
   */
  vulnerabilities: SecurityIssue[];
  
  /**
   * 機密データへのアクセス
   */
  accessesSensitiveData: boolean;
  
  /**
   * セキュリティログが実装されているか
   */
  hasSecurityLogging: boolean;
}

/**
 * 依存関係の情報
 */
export interface Dependency {
  /**
   * 依存先のモジュール名
   */
  moduleName: string;
  
  /**
   * 依存関係の種類
   */
  type: 'import' | 'require' | 'dynamic_import' | 'inheritance' | 'composition';
  
  /**
   * 依存の深さ（直接依存は1）
   */
  depth: number;
  
  /**
   * 循環依存かどうか
   */
  isCircular: boolean;
  
  /**
   * セキュリティリスクレベル
   */
  securityRiskLevel: 'low' | 'medium' | 'high';
  
  /**
   * 依存先のバージョン情報
   */
  version?: string;
}

/**
 * セキュリティプロファイル（全体）
 */
export interface SecurityProfile {
  /**
   * 全体的なリスクレベル
   */
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * セキュリティ脆弱性の一覧
   */
  vulnerabilities: SecurityIssue[];
  
  /**
   * セキュリティ対策の実装状況
   */
  securityMeasures: SecurityMeasure[];
  
  /**
   * 機密データの取り扱い状況
   */
  sensitiveDataHandling: SensitiveDataHandling[];
  
  /**
   * セキュリティ監査の結果
   */
  auditResults: SecurityAuditResult[];
}

/**
 * セキュリティ対策の情報
 */
export interface SecurityMeasure {
  type: 'input_validation' | 'output_encoding' | 'authentication' | 'authorization' | 'encryption' | 'logging' | 'other';
  description: string;
  isImplemented: boolean;
  coverage: number; // 0-100の実装率
  effectiveness: 'low' | 'medium' | 'high';
}

/**
 * 機密データの取り扱い情報
 */
export interface SensitiveDataHandling {
  dataType: 'password' | 'api_key' | 'personal_info' | 'financial' | 'health' | 'other';
  handlingMethod: string;
  isEncrypted: boolean;
  isLogged: boolean;
  accessControl: 'public' | 'restricted' | 'confidential';
  complianceRequirements: string[];
}

/**
 * セキュリティ監査結果
 */
export interface SecurityAuditResult {
  auditType: 'automated' | 'manual' | 'penetration_test';
  timestamp: string;
  findings: SecurityFinding[];
  overallScore: number; // 0-100
  recommendations: string[];
}

/**
 * セキュリティ発見事項
 */
export interface SecurityFinding {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  remediation: string;
  cweId?: string;
  cveId?: string;
}

/**
 * プロダクションコードから抽出された実装の真実
 */
export interface ImplementationTruth {
  /**
   * 解析対象のファイルパス
   */
  filePath: string;
  
  /**
   * 解析実行時刻
   */
  timestamp: string;
  
  /**
   * 実際の振る舞い情報
   */
  actualBehaviors: {
    /**
     * メソッドの振る舞い一覧
     */
    methods: MethodBehavior[];
    
    /**
     * データフロー一覧
     */
    dataFlows: DataFlow[];
    
    /**
     * 依存関係一覧
     */
    dependencies: Dependency[];
    
    /**
     * セキュリティプロファイル
     */
    securityProfile: SecurityProfile;
  };
  
  /**
   * TaintTyperによる脆弱性情報
   */
  vulnerabilities: SecurityIssue[];
  
  /**
   * コードの構造情報
   */
  structure: {
    /**
     * 複雑度メトリクス
     */
    complexity: ComplexityMetrics;
    
    /**
     * カバレッジマップ
     */
    coverage: CoverageMap;
    
    /**
     * クリティカルパス
     */
    criticalPaths: ExecutionPath[];
  };
  
  /**
   * メタデータ
   */
  metadata: {
    /**
     * 解析エンジンのバージョン
     */
    engineVersion: string;
    
    /**
     * 解析にかかった時間（ミリ秒）
     */
    analysisTime: number;
    
    /**
     * 解析の信頼度 (0-1)
     */
    confidence: number;
    
    /**
     * 解析時に発生した警告
     */
    warnings: string[];
  };
}

/**
 * 複雑度メトリクス
 */
export interface ComplexityMetrics {
  /**
   * 循環的複雑度
   */
  cyclomaticComplexity: number;
  
  /**
   * 認知的複雑度
   */
  cognitiveComplexity: number;
  
  /**
   * ネストの深さ
   */
  nestingDepth: number;
  
  /**
   * ファンイン（呼び出され回数）
   */
  fanIn: number;
  
  /**
   * ファンアウト（呼び出し回数）
   */
  fanOut: number;
  
  /**
   * コード行数
   */
  linesOfCode: number;
  
  /**
   * 重複コード率
   */
  duplicationRate: number;
}

/**
 * カバレッジマップ
 */
export interface CoverageMap {
  /**
   * 行カバレッジ
   */
  lineCoverage: LineCoverage[];
  
  /**
   * 分岐カバレッジ
   */
  branchCoverage: BranchCoverage[];
  
  /**
   * 関数カバレッジ
   */
  functionCoverage: FunctionCoverage[];
  
  /**
   * 条件カバレッジ
   */
  conditionCoverage: ConditionCoverage[];
}

/**
 * 行カバレッジ情報
 */
export interface LineCoverage {
  line: number;
  isCovered: boolean;
  executionCount: number;
}

/**
 * 分岐カバレッジ情報
 */
export interface BranchCoverage {
  line: number;
  branchId: string;
  isCovered: boolean;
  executionCount: number;
}

/**
 * 関数カバレッジ情報
 */
export interface FunctionCoverage {
  functionName: string;
  startLine: number;
  endLine: number;
  isCovered: boolean;
  executionCount: number;
}

/**
 * 条件カバレッジ情報
 */
export interface ConditionCoverage {
  line: number;
  conditionId: string;
  trueCount: number;
  falseCount: number;
  isCovered: boolean;
}

/**
 * 実行パス情報
 */
export interface ExecutionPath {
  /**
   * パスの識別子
   */
  pathId: string;
  
  /**
   * パスを構成するステップ
   */
  steps: ExecutionStep[];
  
  /**
   * パスの複雑度
   */
  complexity: number;
  
  /**
   * パスの実行頻度
   */
  executionFrequency: number;
  
  /**
   * クリティカルパスかどうか
   */
  isCritical: boolean;
  
  /**
   * セキュリティリスクレベル
   */
  securityRisk: 'low' | 'medium' | 'high';
}

/**
 * 実行ステップ情報
 */
export interface ExecutionStep {
  stepId: string;
  methodName: string;
  line: number;
  instruction: string;
  dataAccess: string[];
  securityImplications: string[];
}