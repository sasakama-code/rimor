/**
 * OWASP A05:2021 - Security Misconfiguration
 * セキュリティ設定ミスに関するセキュリティテスト品質監査プラグイン
 */

import {
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  SecurityIssue
} from '../../../core/types';
import {
  IOWASPSecurityPlugin,
  OWASPCategory,
  OWASPTestResult,
  OWASPUtils,
  OWASPBasePlugin
} from './IOWASPSecurityPlugin';

/**
 * A05: Security Misconfiguration プラグイン
 * 
 * 検出対象:
 * - HTTPセキュリティヘッダーの欠如
 * - デフォルト設定の使用
 * - 不要な機能の有効化
 * - エラーメッセージの詳細表示
 * - 不適切なCORS設定
 */
export class SecurityMisconfigurationPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a05-security-misconfiguration';
  readonly name = 'OWASP A05: Security Misconfiguration';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A05_SECURITY_MISCONFIGURATION;
  readonly cweIds = ['CWE-16', 'CWE-611'];

  isApplicable(context: ProjectContext): boolean {
    // Webフレームワークの確認
    const webFrameworks = [
      'express', 'koa', 'hapi', 'fastify', '@nestjs/core',
      'helmet', 'cors', 'dotenv', 'config'
    ];
    
    const hasWebFramework = context.dependencies?.some(dep =>
      webFrameworks.some(fw => dep.includes(fw))
    ) || false;

    // 設定関連ファイルの確認
    const hasConfigFiles = context.filePatterns?.source?.some((pattern: string) =>
      pattern.includes('config') || pattern.includes('settings') || 
      pattern.includes('.env') || pattern.includes('security')
    ) || false;

    return hasWebFramework || hasConfigFiles;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const lines = testFile.content.split('\n');

    // セキュリティヘッダーテストパターン
    const securityHeadersPattern = /x-frame-options|content-security-policy|strict-transport-security|x-content-type-options/i;
    const corsPattern = /cors|origin|access-control/i;
    const defaultConfigPattern = /default|admin|password|root/i;
    const errorHandlingPattern = /error.*detail|stack.*trace|debug.*true/i;

    lines.forEach((line, index) => {
      // セキュリティヘッダーテストの検出
      if (securityHeadersPattern.test(line)) {
        patterns.push({
          patternId: 'config-security-headers',
          pattern: 'security-headers',
          confidence: 0.85,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'high',
          metadata: { hasTest: true, testType: 'security-headers' }
        });
      }

      // CORS設定テストの検出
      if (corsPattern.test(line) && (line.includes('origin') || line.includes('cors'))) {
        patterns.push({
          patternId: 'config-cors',
          pattern: 'cors-configuration',
          confidence: 0.8,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'medium',
          metadata: { hasTest: true, testType: 'cors' }
        });
      }

      // デフォルト設定の検出
      if (defaultConfigPattern.test(line) && line.includes('config')) {
        patterns.push({
          patternId: 'config-default-settings',
          pattern: 'default-configuration',
          confidence: 0.7,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'high',
          metadata: { vulnerability: true }
        });
      }
    });

    // 不足テストの検出
    const hasSecurityTests = patterns.some(p => 
      p.metadata?.testType === 'security-headers' || 
      p.metadata?.testType === 'cors'
    );

    if (!hasSecurityTests) {
      patterns.push({
        patternId: 'missing-config-security-headers',
        pattern: 'missing-security-headers-test',
        confidence: 1,
        severity: 'critical',
        metadata: { hasTest: false }
      });

      patterns.push({
        patternId: 'missing-config-cors',
        pattern: 'missing-cors-test',
        confidence: 1,
        severity: 'high',
        metadata: { hasTest: false }
      });
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const configTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('config-') && p.metadata?.hasTest
    );

    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-config-')
    );

    const vulnerabilities = patterns.filter(p => 
      p.metadata?.vulnerability
    );

    // カバレッジ計算
    const requiredTests = ['security-headers', 'cors', 'error-handling', 'default-settings'];
    const testCoverage = (configTests.length / requiredTests.length) * 100;

    // セキュリティスコア計算
    const baseScore = OWASPUtils.calculateSecurityScore(
      testCoverage,
      missingTests.length + vulnerabilities.length
    );

    const hasSecurityHeaders = configTests.some(p => 
      p.metadata?.testType === 'security-headers'
    );
    const hasCorsConfig = configTests.some(p => 
      p.metadata?.testType === 'cors'
    );

    const coverageScore = testCoverage / 100;
    const securityScore = hasSecurityHeaders ? 0.8 : 0.4;

    return {
      overall: baseScore,
      security: securityScore,
      coverage: testCoverage,
      confidence: 0.85,
      details: {
        testCoverage,
        securityHeadersImplemented: hasSecurityHeaders,
        corsConfigured: hasCorsConfig,
        vulnerabilityCount: vulnerabilities.length
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (evaluation.overall < 0.5) {
      improvements.push({
        id: 'add-security-headers-tests',
        priority: 'critical',
        type: 'add-test',
        title: 'セキュリティヘッダーテストの追加',
        description: 'HTTPセキュリティヘッダー（X-Frame-Options、CSP等）のテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { 
          scoreImprovement: 30, 
          effortMinutes: 30 
        },
        automatable: true
      });
    }

    if (!evaluation.details?.corsConfigured) {
      improvements.push({
        id: 'add-cors-tests',
        priority: 'high',
        type: 'add-test',
        title: 'CORS設定テストの追加',
        description: 'CORS（Cross-Origin Resource Sharing）の適切な設定をテストしてください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { 
          scoreImprovement: 20, 
          effortMinutes: 20 
        },
        automatable: true
      });
    }

    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    return {
      category: this.owaspCategory,
      coverage: 0,
      issues: [],
      recommendations: [],
      testPatterns: [],
      missingTests: []
    };
  }

  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // デフォルト認証情報
      if ((line.includes('admin') || line.includes('root')) && 
          (line.includes('password') || line.includes('username'))) {
        issues.push({
          id: `default-creds-${index}`,
          severity: 'critical',
          type: 'insufficient-validation',
          message: 'デフォルトの認証情報が使用されている可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // デバッグモード有効
      if (line.includes('debug') && (line.includes('true') || line.includes('enabled'))) {
        issues.push({
          id: `debug-enabled-${index}`,
          severity: 'warning',
          type: 'insufficient-validation',
          message: 'デバッグモードが有効になっています',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // エラー詳細の露出
      if (line.includes('stack') && line.includes('trace')) {
        issues.push({
          id: `stack-trace-${index}`,
          severity: 'warning',
          type: 'insufficient-validation',
          message: 'スタックトレースが露出する可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }
    });

    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];

    // 基本的なセキュリティヘッダーテスト
    tests.push('HTTPセキュリティヘッダーの検証テスト');
    tests.push('X-Frame-Options: DENYまたはSAMEORIGINの設定確認');
    tests.push('Content-Security-Policy（CSP）の適切な設定確認');
    tests.push('Strict-Transport-Security（HSTS）の有効化確認');

    // CORS設定テスト
    tests.push('CORS設定の検証テスト');
    tests.push('許可されたオリジンのみアクセス可能か確認');
    tests.push('認証情報を含むリクエストの適切な処理確認');

    // エラーハンドリングテスト
    tests.push('エラーハンドリングのセキュリティテスト');
    tests.push('本番環境でスタックトレースが表示されないことを確認');
    tests.push('デバッグ情報が無効化されていることを確認');

    // デフォルト設定テスト
    tests.push('デフォルト設定の変更確認テスト');
    tests.push('デフォルトパスワードが変更されていることを確認');
    tests.push('不要な機能が無効化されていることを確認');

    return tests;
  }
}