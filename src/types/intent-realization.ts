/**
 * Intent Realization - テスト意図と実装の実現度に関する型定義
 * v0.9.0 - AIコーディング時代の品質保証エンジンへの進化
 * 
 * SOLID原則: 単一責任の原則に従った型分離
 * DRY原則: 共通概念の型定義統一
 */

import { TestIntent, TestGap, Severity } from '../intent-analysis/ITestIntentAnalyzer';
import { ImplementationTruth, MethodBehavior, SecurityProfile } from './implementation-truth';
import { SecurityIssue } from '../security/types';

/**
 * テスト意図と実装の実現度ギャップ
 */
export interface IntentRealizationGap {
  /**
   * ギャップの識別子
   */
  gapId: string;
  
  /**
   * ギャップの種類
   */
  type: IntentGapType;
  
  /**
   * ギャップの重要度
   */
  severity: Severity;
  
  /**
   * ギャップの説明
   */
  description: string;
  
  /**
   * 影響を受けるテスト意図
   */
  affectedIntent: TestIntent;
  
  /**
   * 影響を受ける実装の真実
   */
  affectedImplementation: MethodBehavior[];
  
  /**
   * 未検証の実装部分
   */
  untestedBehaviors: UntestedBehavior[];
  
  /**
   * 誤った前提に基づくテスト
   */
  incorrectAssumptions: TestAssumption[];
  
  /**
   * カバレッジの質的評価
   */
  qualitativeCoverage: QualitativeCoverage;
  
  /**
   * AIによる重要度スコア (0-1)
   */
  aiPriorityScore: number;
  
  /**
   * 改善提案
   */
  recommendations: GapRecommendation[];
  
  /**
   * セキュリティへの影響
   */
  securityImpact: SecurityImpact;
}

/**
 * 意図と実装のギャップの種類
 */
export enum IntentGapType {
  /** テスト対象メソッドの不一致 */
  WRONG_TARGET = 'wrong_target',
  
  /** 期待される振る舞いの未検証 */
  MISSING_BEHAVIOR_TEST = 'missing_behavior_test',
  
  /** エラーケースの未検証 */
  MISSING_ERROR_CASE = 'missing_error_case',
  
  /** 副作用の未検証 */
  MISSING_SIDE_EFFECT_TEST = 'missing_side_effect_test',
  
  /** セキュリティ要件の未検証 */
  MISSING_SECURITY_TEST = 'missing_security_test',
  
  /** データフローの未検証 */
  MISSING_DATA_FLOW_TEST = 'missing_data_flow_test',
  
  /** 依存関係の未検証 */
  MISSING_DEPENDENCY_TEST = 'missing_dependency_test',
  
  /** パフォーマンス要件の未検証 */
  MISSING_PERFORMANCE_TEST = 'missing_performance_test',
  
  /** 境界値の未検証 */
  MISSING_BOUNDARY_TEST = 'missing_boundary_test',
  
  /** 同時実行性の未検証 */
  MISSING_CONCURRENCY_TEST = 'missing_concurrency_test',
  
  /** 誤った期待値 */
  INCORRECT_EXPECTATION = 'incorrect_expectation',
  
  /** 不完全なモック */
  INCOMPLETE_MOCK = 'incomplete_mock',
  
  /** テストデータの不適切さ */
  INAPPROPRIATE_TEST_DATA = 'inappropriate_test_data'
}

/**
 * 未検証の振る舞い
 */
export interface UntestedBehavior {
  /**
   * 未検証のメソッド
   */
  method: MethodBehavior;
  
  /**
   * 未検証の理由
   */
  reason: UntestedReason;
  
  /**
   * 未検証によるリスクレベル
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * 推奨されるテスト方法
   */
  recommendedTestMethod: string;
  
  /**
   * 検証すべき条件
   */
  conditionsToTest: string[];
  
  /**
   * セキュリティ上の考慮事項
   */
  securityConsiderations: string[];
}

/**
 * 未検証の理由
 */
export enum UntestedReason {
  /** テストが存在しない */
  NO_TEST = 'no_test',
  
  /** テストが不完全 */
  INCOMPLETE_TEST = 'incomplete_test',
  
  /** テストが間違った対象をテストしている */
  WRONG_TARGET = 'wrong_target',
  
  /** モックが不適切 */
  INAPPROPRIATE_MOCK = 'inappropriate_mock',
  
  /** テストデータが不適切 */
  INAPPROPRIATE_DATA = 'inappropriate_data',
  
  /** 境界値がテストされていない */
  BOUNDARY_NOT_TESTED = 'boundary_not_tested',
  
  /** エラーケースがテストされていない */
  ERROR_CASE_NOT_TESTED = 'error_case_not_tested',
  
  /** 副作用がテストされていない */
  SIDE_EFFECT_NOT_TESTED = 'side_effect_not_tested'
}

/**
 * テストの誤った前提
 */
export interface TestAssumption {
  /**
   * 前提の説明
   */
  assumption: string;
  
  /**
   * 実際の実装との相違点
   */
  actualBehavior: string;
  
  /**
   * 相違の深刻度
   */
  severity: Severity;
  
  /**
   * 影響を受けるテストケース
   */
  affectedTestCases: string[];
  
  /**
   * 修正提案
   */
  correctionSuggestion: string;
  
  /**
   * 修正の優先度
   */
  correctionPriority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 質的なカバレッジ評価
 */
export interface QualitativeCoverage {
  /**
   * クリティカルパスのカバー率
   */
  criticalPathsCovered: number;
  
  /**
   * エッジケースのカバー率
   */
  edgeCasesCovered: number;
  
  /**
   * セキュリティチェックのカバー率
   */
  securityChecksCovered: number;
  
  /**
   * エラーハンドリングのカバー率
   */
  errorHandlingCovered: number;
  
  /**
   * 副作用のカバー率
   */
  sideEffectsCovered: number;
  
  /**
   * データフローのカバー率
   */
  dataFlowCovered: number;
  
  /**
   * 依存関係のカバー率
   */
  dependencyCovered: number;
  
  /**
   * パフォーマンス要件のカバー率
   */
  performanceRequirementsCovered: number;
  
  /**
   * 全体的な質的カバー率
   */
  overallQualityCoverage: number;
}

/**
 * ギャップ改善提案
 */
export interface GapRecommendation {
  /**
   * 提案の識別子
   */
  recommendationId: string;
  
  /**
   * 提案の種類
   */
  type: RecommendationType;
  
  /**
   * 提案の説明
   */
  description: string;
  
  /**
   * 実装方法の詳細
   */
  implementationDetails: string;
  
  /**
   * 提案の優先度
   */
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * 実装の難易度
   */
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  
  /**
   * 予想される効果
   */
  expectedImpact: ExpectedImpact;
  
  /**
   * 関連するファイル
   */
  relatedFiles: string[];
  
  /**
   * 実装例
   */
  codeExample?: string;
  
  /**
   * 参考資料
   */
  references: string[];
}

/**
 * 提案の種類
 */
export enum RecommendationType {
  /** 新しいテストケースの追加 */
  ADD_TEST_CASE = 'add_test_case',
  
  /** 既存テストの改善 */
  IMPROVE_TEST = 'improve_test',
  
  /** モックの改善 */
  IMPROVE_MOCK = 'improve_mock',
  
  /** テストデータの改善 */
  IMPROVE_TEST_DATA = 'improve_test_data',
  
  /** セキュリティテストの追加 */
  ADD_SECURITY_TEST = 'add_security_test',
  
  /** パフォーマンステストの追加 */
  ADD_PERFORMANCE_TEST = 'add_performance_test',
  
  /** エラーケーステストの追加 */
  ADD_ERROR_CASE_TEST = 'add_error_case_test',
  
  /** 境界値テストの追加 */
  ADD_BOUNDARY_TEST = 'add_boundary_test',
  
  /** 統合テストの追加 */
  ADD_INTEGRATION_TEST = 'add_integration_test',
  
  /** テスト構造の改善 */
  IMPROVE_TEST_STRUCTURE = 'improve_test_structure',
  
  /** アサーションの強化 */
  STRENGTHEN_ASSERTIONS = 'strengthen_assertions',
  
  /** テストの分離 */
  ISOLATE_TESTS = 'isolate_tests'
}

/**
 * 期待される効果
 */
export interface ExpectedImpact {
  /**
   * テスト品質の向上度 (0-1)
   */
  testQualityImprovement: number;
  
  /**
   * セキュリティ向上度 (0-1)
   */
  securityImprovement: number;
  
  /**
   * カバレッジ向上度 (0-1)
   */
  coverageImprovement: number;
  
  /**
   * 保守性向上度 (0-1)
   */
  maintainabilityImprovement: number;
  
  /**
   * 実装所要時間（時間）
   */
  estimatedImplementationTime: number;
  
  /**
   * 長期的な価値 (0-1)
   */
  longTermValue: number;
}

/**
 * セキュリティへの影響
 */
export interface SecurityImpact {
  /**
   * セキュリティリスクレベル
   */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * 影響を受けるセキュリティ領域
   */
  affectedSecurityDomains: SecurityDomain[];
  
  /**
   * 潜在的な脆弱性
   */
  potentialVulnerabilities: SecurityIssue[];
  
  /**
   * 攻撃ベクター
   */
  attackVectors: AttackVector[];
  
  /**
   * 影響の説明
   */
  impactDescription: string;
  
  /**
   * 緩和策
   */
  mitigationStrategies: MitigationStrategy[];
}

/**
 * セキュリティ領域
 */
export enum SecurityDomain {
  /** 認証 */
  AUTHENTICATION = 'authentication',
  
  /** 認可 */
  AUTHORIZATION = 'authorization',
  
  /** 入力検証 */
  INPUT_VALIDATION = 'input_validation',
  
  /** 出力エンコーディング */
  OUTPUT_ENCODING = 'output_encoding',
  
  /** セッション管理 */
  SESSION_MANAGEMENT = 'session_management',
  
  /** 暗号化 */
  CRYPTOGRAPHY = 'cryptography',
  
  /** ログ記録 */
  LOGGING = 'logging',
  
  /** エラーハンドリング */
  ERROR_HANDLING = 'error_handling',
  
  /** データ保護 */
  DATA_PROTECTION = 'data_protection',
  
  /** 通信セキュリティ */
  COMMUNICATION_SECURITY = 'communication_security'
}

/**
 * 攻撃ベクター
 */
export interface AttackVector {
  /**
   * 攻撃の種類
   */
  attackType: string;
  
  /**
   * 攻撃の説明
   */
  description: string;
  
  /**
   * 悪用可能性
   */
  exploitability: 'low' | 'medium' | 'high';
  
  /**
   * 影響の範囲
   */
  impactScope: 'local' | 'network' | 'global';
  
  /**
   * 関連するCWE ID
   */
  cweId?: string;
}

/**
 * 緩和策
 */
export interface MitigationStrategy {
  /**
   * 緩和策の種類
   */
  type: 'preventive' | 'detective' | 'corrective';
  
  /**
   * 緩和策の説明
   */
  description: string;
  
  /**
   * 実装方法
   */
  implementation: string;
  
  /**
   * 効果的度
   */
  effectiveness: 'low' | 'medium' | 'high';
  
  /**
   * 実装コスト
   */
  implementationCost: 'low' | 'medium' | 'high';
}

/**
 * 意図実現度の総合評価結果
 */
export interface IntentRealizationResult {
  /**
   * 評価対象のファイル
   */
  filePath: string;
  
  /**
   * 評価実行時刻
   */
  timestamp: string;
  
  /**
   * テスト意図
   */
  testIntent: TestIntent;
  
  /**
   * 実装の真実
   */
  implementationTruth: ImplementationTruth;
  
  /**
   * 検出されたギャップ
   */
  gaps: IntentRealizationGap[];
  
  /**
   * 実現度スコア (0-100)
   */
  realizationScore: number;
  
  /**
   * 品質指標
   */
  qualityMetrics: QualityMetrics;
  
  /**
   * 改善提案の一覧
   */
  recommendations: GapRecommendation[];
  
  /**
   * セキュリティ評価
   */
  securityAssessment: SecurityAssessment;
  
  /**
   * 総合評価
   */
  overallAssessment: OverallAssessment;
}

/**
 * 品質指標
 */
export interface QualityMetrics {
  /**
   * テストカバレッジ率
   */
  testCoverage: number;
  
  /**
   * 質的カバレッジ率
   */
  qualitativeCoverage: number;
  
  /**
   * セキュリティカバレッジ率
   */
  securityCoverage: number;
  
  /**
   * テスト保守性スコア
   */
  maintainabilityScore: number;
  
  /**
   * テスト実行時間
   */
  executionTime: number;
  
  /**
   * 複雑度スコア
   */
  complexityScore: number;
  
  /**
   * 重複度スコア
   */
  duplicationScore: number;
}

/**
 * セキュリティ評価
 */
export interface SecurityAssessment {
  /**
   * 全体的なセキュリティリスク
   */
  overallSecurityRisk: 'low' | 'medium' | 'high' | 'critical';
  
  /**
   * セキュリティテストの充実度
   */
  securityTestCoverage: number;
  
  /**
   * 未検証のセキュリティ要件
   */
  untestedSecurityRequirements: string[];
  
  /**
   * セキュリティテストの推奨事項
   */
  securityTestRecommendations: GapRecommendation[];
  
  /**
   * OWASP Top 10への対応状況
   */
  owaspTop10Coverage: OwaspCoverage[];
}

/**
 * OWASP Top 10カバレッジ
 */
export interface OwaspCoverage {
  /**
   * OWASP項目
   */
  owaspCategory: string;
  
  /**
   * カバレッジ率
   */
  coverageRate: number;
  
  /**
   * テスト状況
   */
  testStatus: 'not_tested' | 'partially_tested' | 'fully_tested';
  
  /**
   * 推奨事項
   */
  recommendations: string[];
}

/**
 * 総合評価
 */
export interface OverallAssessment {
  /**
   * 総合スコア (0-100)
   */
  overallScore: number;
  
  /**
   * 評価グレード
   */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  /**
   * 強み
   */
  strengths: string[];
  
  /**
   * 弱点
   */
  weaknesses: string[];
  
  /**
   * 優先的な改善事項
   */
  priorityImprovements: string[];
  
  /**
   * 次のステップ
   */
  nextSteps: string[];
  
  /**
   * 長期的な改善計画
   */
  longTermImprovementPlan: string[];
}