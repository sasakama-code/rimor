/**
 * SecurityTestPatternPlugin
 * 
 * セキュリティテストパターンの検出に特化したプラグイン
 * BaseSecurityPluginを継承し、セキュリティテストの品質を評価
 */

import { BaseSecurityPlugin } from '../base/BaseSecurityPlugin';
import { 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement 
} from '../../core/types';
import { PathSecurity } from '../../utils/pathSecurity';

export class SecurityTestPatternPlugin extends BaseSecurityPlugin {
  id = 'security-test-pattern';
  name = 'Security Test Pattern Plugin';
  version = '1.0.0';

  isApplicable(context: ProjectContext): boolean {
    // セキュリティテストが必要なプロジェクトで適用
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    if (!testFile.content) {
      return results;
    }

    // セキュリティテストパターンの検出
    const securityTests = this.analyzeSecurityTests(testFile.content);
    
    // セキュリティテストが不足している場合
    if (securityTests.missingTests.length > 0) {
      securityTests.missingTests.forEach(missing => {
        results.push({
          patternId: `missing-security-test-${missing.type}`,
          patternName: `Missing Security Test: ${missing.type}`,
          severity: 'medium',
          confidence: 0.7,
          location: {
            file: testFile.path,
            line: 1,
            column: 1
          },
          metadata: {
            description: `Missing security test for ${missing.type}`,
            category: 'security'
          }
        });
      });
    }

    // 弱いセキュリティテストの検出
    if (securityTests.weakTests.length > 0) {
      securityTests.weakTests.forEach(weak => {
        results.push({
          patternId: `weak-security-test`,
          patternName: 'Weak Security Test',
          severity: 'low',
          confidence: 0.6,
          location: {
            file: testFile.path,
            line: weak.line,
            column: 1
          },
          metadata: {
            description: `Weak security test: ${weak.description}`,
            category: 'security'
          }
        });
      });
    }

    // BaseSecurityPluginの汎用パターン検出も利用
    const securityPatterns = this.detectSecurityPatterns(testFile.content);
    securityPatterns.forEach(pattern => {
      if (this.isTestRelated(pattern.type)) {
        results.push({
          patternId: pattern.type,
          patternName: pattern.type,
          severity: pattern.severity,
          confidence: 0.75,
          location: {
            file: testFile.path,
            line: pattern.line || 1,
            column: pattern.column || 1
          },
          metadata: {
            description: pattern.description,
            category: 'security'
          }
        });
      }
    });

    return results;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const securityScore = this.evaluateSecurityScore(patterns);
    
    // セキュリティテスト特有の評価ロジック
    let testCoverageScore = 1;
    patterns.forEach(pattern => {
      if (pattern.patternId && pattern.patternId.startsWith('missing-security-test-')) {
        testCoverageScore *= 0.7;
      } else if (pattern.patternId === 'weak-security-test') {
        testCoverageScore *= 0.85;
      }
    });

    const overall = ((securityScore + testCoverageScore) / 2) * 100;

    return {
      overall,
      dimensions: {
        completeness: testCoverageScore * 100,
        correctness: securityScore * 100,
        maintainability: 80
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 1
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (evaluation.overall < 50) {
      improvements.push({
        id: 'add-security-tests',
        priority: 'high',
        type: 'security',
        category: 'security',
        title: 'Add missing security tests',
        description: 'Add security tests for authentication, authorization, and input validation',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.4,
        autoFixable: false
      });
    } else if (evaluation.overall < 80) {
      improvements.push({
        id: 'strengthen-security-tests',
        priority: 'medium',
        type: 'security',
        category: 'security',
        title: 'Strengthen security tests',
        description: 'Improve existing security tests with more comprehensive scenarios',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.25,
        autoFixable: false
      });
    }

    return improvements;
  }

  /**
   * セキュリティテストの分析
   */
  private analyzeSecurityTests(content: string): {
    missingTests: Array<{ type: string }>;
    weakTests: Array<{ description: string; line: number }>;
  } {
    const missingTests: Array<{ type: string }> = [];
    const weakTests: Array<{ description: string; line: number }> = [];
    
    // 必要なセキュリティテストのチェック
    const requiredSecurityTests = [
      { type: 'input-validation', pattern: /test.*input.*validat/i },
      { type: 'authentication', pattern: /test.*auth/i },
      { type: 'authorization', pattern: /test.*authoriz/i },
      { type: 'csrf-protection', pattern: /test.*csrf/i },
      { type: 'rate-limiting', pattern: /test.*rate.*limit/i },
      { type: 'encryption', pattern: /test.*encrypt/i }
    ];

    requiredSecurityTests.forEach(required => {
      if (!required.pattern.test(content)) {
        missingTests.push({ type: required.type });
      }
    });

    // 弱いセキュリティテストのパターン
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // テストで実際の脆弱性を意図的に作っている場合
      if (/test.*vulnerability|test.*exploit/i.test(line)) {
        if (!/mock|stub|fake/i.test(line)) {
          weakTests.push({
            description: 'Test contains actual vulnerability code',
            line: index + 1
          });
        }
      }

      // セキュリティテストでハードコードされた値を使用
      if (/test.*security/i.test(line)) {
        if (/password\s*=\s*["']test["']/i.test(line)) {
          weakTests.push({
            description: 'Security test uses weak test credentials',
            line: index + 1
          });
        }
      }
    });

    return { missingTests, weakTests };
  }

  /**
   * テストに関連するセキュリティパターンかチェック
   */
  private isTestRelated(patternType: string): boolean {
    const testRelatedPatterns = [
      'hardcoded-credentials',
      'weak-crypto'
    ];
    
    return testRelatedPatterns.includes(patternType);
  }
}