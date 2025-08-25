/**
 * validate.ts用の型定義
 * Issue #63: any型の削減と型安全性の向上
 */

/**
 * サンプルプロジェクトの型定義
 */
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

/**
 * テストケースの型定義
 */
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

/**
 * フレームワーク分析結果の型定義
 */
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