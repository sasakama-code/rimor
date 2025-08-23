/**
 * OWASP Top 10セキュリティプラグイン共通インターフェース
 * OWASP Top 10:2021に基づくセキュリティテスト品質監査
 */

import {
  ITestQualityPlugin,
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  SecurityIssue,
  TestMethod
} from '../../../core/types';

/**
 * OWASP Top 10カテゴリ定義
 */
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

/**
 * OWASPセキュリティテスト結果
 */
export interface OWASPTestResult {
  category: OWASPCategory;
  coverage: number;
  issues: SecurityIssue[];
  recommendations: string[];
  testPatterns: string[];
  missingTests: string[];
}

/**
 * OWASPセキュリティプラグインインターフェース
 */
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

/**
 * OWASP共通ユーティリティ
 */
export class OWASPUtils {
  /**
   * セキュリティキーワードの検出
   */
  static detectSecurityKeywords(content: string, keywords: string[]): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }
  
  /**
   * テストカバレッジの計算
   */
  static calculateTestCoverage(foundTests: string[], requiredTests: string[]): number {
    if (requiredTests.length === 0) return 100;
    const covered = foundTests.filter(test => 
      requiredTests.some(required => test.includes(required))
    ).length;
    return Math.round((covered / requiredTests.length) * 100);
  }
  
  /**
   * セキュリティスコアの計算
   */
  static calculateSecurityScore(
    testCoverage: number,
    issueCount: number,
    maxIssues: number = 10
  ): number {
    const coverageScore = testCoverage / 100;
    const issueScore = Math.max(0, 1 - (issueCount / maxIssues));
    return (coverageScore * 0.7 + issueScore * 0.3);
  }
  
  /**
   * CWE IDのフォーマット
   */
  static formatCweId(id: string | number): string {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return `CWE-${numId}`;
  }
}

/**
 * OWASPプラグイン基底クラス
 */
export abstract class OWASPBasePlugin implements IOWASPSecurityPlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly type: 'security';
  abstract readonly owaspCategory: OWASPCategory;
  abstract readonly cweIds: string[];
  
  abstract isApplicable(context: ProjectContext): boolean;
  abstract detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  abstract evaluateQuality(patterns: DetectionResult[]): QualityScore;
  abstract suggestImprovements(evaluation: QualityScore): Improvement[];
  abstract validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult>;
  abstract detectVulnerabilityPatterns(content: string): SecurityIssue[];
  abstract generateSecurityTests(context: ProjectContext): string[];
}