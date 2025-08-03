/**
 * OWASP A09:2021 - Security Logging and Monitoring Failures
 * セキュリティログと監視の失敗に関するセキュリティテスト品質監査プラグイン
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
 * A09: Security Logging and Monitoring Failures プラグイン
 */
export class LoggingMonitoringFailuresPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a09-logging-monitoring-failures';
  readonly name = 'OWASP A09: Security Logging and Monitoring Failures';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A09_SECURITY_LOGGING_FAILURES;
  readonly cweIds = ['CWE-117', 'CWE-223', 'CWE-778'];

  isApplicable(context: ProjectContext): boolean {
    // ログライブラリの確認
    const loggingLibs = [
      'winston', 'bunyan', 'pino', 'log4js', 'morgan',
      'log-level', 'loglevel', 'debug', 'consola'
    ];
    
    // モニタリング・APMツールの確認
    const monitoringTools = [
      '@sentry/node', 'elastic-apm-node', 'newrelic', 'raygun',
      'rollbar', 'bugsnag', 'applicationinsights', 'datadog-metrics'
    ];

    const deps = context.dependencies || [];
    
    // いずれかのライブラリ/ツールが存在すればtrue
    return deps.some(dep => 
      loggingLibs.includes(dep) || monitoringTools.includes(dep)
    );
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content.toLowerCase();
    
    // セキュリティログテストパターン
    const loggingPatterns = [
      {
        id: 'security-logging',
        keywords: ['log', 'security', 'event', 'auth_failure', 'authentication', 'logger.security'],
        testType: 'security-logging'
      },
      {
        id: 'audit-trail',
        keywords: ['audit', 'trail', 'record', 'compliance', 'activity'],
        testType: 'audit-trail'
      },
      {
        id: 'monitoring',
        keywords: ['monitor', 'alert', 'suspicious', 'activity', 'notify', 'alarm'],
        testType: 'monitoring'
      }
    ];

    // パターン検出
    loggingPatterns.forEach(({ id, keywords, testType }) => {
      const hasPattern = keywords.some(keyword => content.includes(keyword));
      if (hasPattern) {
        patterns.push({
          patternId: `logging-${id}`,
          patternName: `${testType}テストを検出しました`,
          confidence: 0.9,
          metadata: {
            hasTest: true,
            testType
          }
        });
      }
    });

    // 不足テストの検出
    if (!content.includes('log') && !content.includes('monitor')) {
      patterns.push({
        patternId: 'missing-logging-security',
        patternName: 'セキュリティログテストが不足しています',
        confidence: 0.9,
        metadata: {
          hasTest: false
        }
      });
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const loggingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('logging-') && p.metadata?.hasTest
    );
    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-')
    );

    // カバレッジ計算
    const requiredPatterns = ['security-logging', 'audit-trail', 'monitoring'];
    const foundPatterns = loggingTests.map(p => p.metadata?.testType).filter(Boolean);
    const coverage = foundPatterns.length / requiredPatterns.length;

    // 総合スコア計算
    const overall = missingTests.length > 0 ? 
      Math.max(0.3, coverage * 0.5) : 
      Math.min(0.9, 0.7 + (coverage * 0.2));

    // セキュリティスコア計算
    const hasSecurityLogging = loggingTests.some(p => 
      p.metadata?.testType === 'security-logging'
    );
    const hasAuditTrail = loggingTests.some(p => 
      p.metadata?.testType === 'audit-trail'
    );
    const security = (hasSecurityLogging ? 0.5 : 0) + (hasAuditTrail ? 0.3 : 0) + (coverage * 0.2);

    return {
      overall,
      security,
      details: {
        coverage,
        loggingTestCount: loggingTests.length,
        missingTestCount: missingTests.length,
        hasSecurityLogging,
        hasAuditTrail
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    const score = evaluation.overall || 0;
    
    if (score < 0.7) {
      improvements.push({
        id: 'add-logging-tests',
        type: 'missing-pattern',
        title: 'セキュリティログテストの追加',
        description: 'セキュリティイベントのログ記録をテストしてください',
        priority: 'high',
        estimatedImpact: {
          scoreImprovement: 0.3,
          effortMinutes: 30
        },
        location: {
          file: 'test/security.test.js',
          line: 0,
          column: 0
        },
        automatable: false,
        codeExample: `// セキュリティログテストの例\nit('should log authentication failures', () => {\n  const result = authenticate('invalid', 'wrong');\n  expect(logger.warn).toHaveBeenCalledWith(\n    expect.objectContaining({\n      event: 'auth_failure',\n      username: 'invalid'\n    })\n  );\n});`
      });
    }
    
    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const patterns = await this.detectPatterns(testFile);
    const loggingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('logging-') && p.metadata?.hasTest
    );
    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-')
    );
    
    const testPatterns: string[] = [];
    const recommendations: string[] = [];
    
    // 検出されたテストパターン
    if (loggingTests.some(p => p.metadata?.testType === 'security-logging')) {
      testPatterns.push('セキュリティイベントログテスト');
    }
    if (loggingTests.some(p => p.metadata?.testType === 'audit-trail')) {
      testPatterns.push('監査証跡テスト');
    }
    if (loggingTests.some(p => p.metadata?.testType === 'monitoring')) {
      testPatterns.push('モニタリングテスト');
    }
    
    // 推奨事項
    if (!loggingTests.some(p => p.metadata?.testType === 'security-logging')) {
      recommendations.push('認証失敗、アクセス拒否などのセキュリティイベントログテストを追加してください');
    }
    if (!loggingTests.some(p => p.metadata?.testType === 'audit-trail')) {
      recommendations.push('重要な操作の監査証跡記録テストを追加してください');
    }
    
    const coverage = testPatterns.length / 3; // 3つの必須パターン
    
    return {
      category: this.owaspCategory,
      coverage: coverage * 100,
      issues: [],
      recommendations,
      testPatterns,
      missingTests: missingTests.map(p => p.patternName || '')
    };
  }

  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');
    let issueId = 0;
    
    // エラーハンドリングでログなしパターン
    const noLoggingPatterns = [
      {
        pattern: /catch\s*\([^)]*\)\s*{[^}]*}/g,
        check: (match: string) => !match.includes('log') && !match.includes('console'),
        message: 'エラーハンドリングでログ記録がありません'
      },
      {
        pattern: /(authenticate|login|authorize)\s*\([^)]*\)[^{]*{[^}]*}/g,
        check: (match: string) => !match.includes('log'),
        message: '認証/認可処理でログ記録がありません'
      },
      {
        pattern: /(delete|remove|drop|truncate)[^;{]*[;{]/gi,
        check: (match: string) => !match.includes('log') && !match.includes('audit'),
        message: '重要な削除操作で監査ログがありません'
      }
    ];
    
    lines.forEach((line, lineIndex) => {
      noLoggingPatterns.forEach(({ pattern, check, message }) => {
        const matches = line.match(pattern);
        if (matches && matches.some(check)) {
          issues.push({
            id: `logging-vuln-${++issueId}`,
            severity: 'warning',
            type: 'missing-auth-test',
            message,
            location: {
              file: 'unknown',
              line: lineIndex + 1,
              column: 0
            }
          });
        }
      });
    });
    
    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];
    const deps = context.dependencies || [];
    
    // 基本的なログテスト
    tests.push(`// セキュリティイベントログテスト\ndescribe('Security Logging', () => {\n  it('should log authentication failures', () => {\n    const result = authenticate('invalid', 'wrong');\n    expect(logger.warn).toHaveBeenCalledWith(\n      expect.objectContaining({\n        event: 'auth_failure',\n        timestamp: expect.any(String),\n        ip: expect.any(String)\n      })\n    );\n  });\n  \n  it('should log access denied events', () => {\n    const result = accessResource('/admin', regularUser);\n    expect(logger.warn).toHaveBeenCalledWith(\n      expect.objectContaining({\n        event: 'access_denied',\n        resource: '/admin',\n        user: regularUser.id\n      })\n    );\n  });\n});`);
    
    // 監査ログテスト
    tests.push(`// 監査証跡テスト\ndescribe('Audit Trail', () => {\n  it('should record data modifications', () => {\n    const oldData = { id: 1, name: 'Old' };\n    const newData = { id: 1, name: 'New' };\n    updateRecord(oldData, newData);\n    \n    expect(auditLog.record).toHaveBeenCalledWith({\n      action: 'UPDATE',\n      before: oldData,\n      after: newData,\n      user: expect.any(String),\n      timestamp: expect.any(Date)\n    });\n  });\n});`);
    
    // モニタリングツール使用時のテスト
    if (deps.some(dep => ['@sentry/node', 'elastic-apm-node'].includes(dep))) {
      tests.push(`// アラートシステムテスト\ndescribe('Security Monitoring', () => {\n  it('should alert on suspicious patterns', () => {\n    // 5回の連続ログイン失敗\n    for (let i = 0; i < 5; i++) {\n      authenticate('user', 'wrong');\n    }\n    \n    expect(alertSystem.trigger).toHaveBeenCalledWith({\n      type: 'brute_force_attempt',\n      severity: 'high'\n    });\n  });\n});`);
    }
    
    return tests;
  }
}