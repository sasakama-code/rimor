/**
 * Test Intent Analyzer Interface
 * v0.9.0 - テスト意図実現度監査機能のコアインターフェース
 */

import { ASTNode } from '../core/interfaces/IAnalysisEngine';

/**
 * テスト意図の表現
 */
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

/**
 * テストタイプ
 */
export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

/**
 * カバレッジスコープ
 */
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

/**
 * テスト実現度の評価結果
 */
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
  riskLevel: RiskLevel;
}

/**
 * 実際のテスト分析結果
 */
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

/**
 * テストアサーション
 */
export interface TestAssertion {
  type: string;
  expected: string;
  actual: string;
  location: {
    line: number;
    column: number;
  };
}

/**
 * テストギャップ
 */
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

/**
 * ギャップタイプ
 */
export enum GapType {
  MISSING_ASSERTION = 'missing_assertion',
  INCOMPLETE_COVERAGE = 'incomplete_coverage',
  WRONG_TARGET = 'wrong_target',
  MISSING_ERROR_CASE = 'missing_error_case',
  MISSING_EDGE_CASE = 'missing_edge_case',
  UNCLEAR_INTENT = 'unclear_intent'
}

/**
 * 重要度
 */
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * リスクレベル
 */
export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
}

/**
 * テスト意図分析器インターフェース
 */
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
  assessRisk(gaps: TestGap[]): RiskLevel;
}