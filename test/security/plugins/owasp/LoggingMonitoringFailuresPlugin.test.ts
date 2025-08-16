/**
 * OWASP A09:2021 - Security Logging and Monitoring Failures プラグインのテスト
 * t_wadaのTDD手法に従って実装
 */

import { LoggingMonitoringFailuresPlugin } from '../../../../src/security/plugins/owasp/LoggingMonitoringFailuresPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('LoggingMonitoringFailuresPlugin', () => {
  let plugin: LoggingMonitoringFailuresPlugin;

  beforeEach(() => {
    plugin = new LoggingMonitoringFailuresPlugin();
  });

  // ステップ1: プラグインの存在確認
  it('should exist', () => {
    expect(plugin).toBeDefined();
  });

  // ステップ2: idプロパティ
  it('should have correct id', () => {
    expect(plugin.id).toBe('owasp-a09-logging-monitoring-failures');
  });

  // ステップ3: nameプロパティ
  it('should have correct name', () => {
    expect(plugin.name).toBe('OWASP A09: Security Logging and Monitoring Failures');
  });

  // ステップ4: versionプロパティ
  it('should have correct version', () => {
    expect(plugin.version).toBe('1.0.0');
  });

  // ステップ5: typeプロパティ
  it('should have correct type', () => {
    expect(plugin.type).toBe('security');
  });

  // ステップ6: owaspCategoryプロパティ
  it('should have correct OWASP category', () => {
    expect(plugin.owaspCategory).toBe('A09:2021');
  });

  // ステップ7: cweIdsプロパティ
  it('should have correct CWE IDs', () => {
    expect(plugin.cweIds).toEqual([
      'CWE-117', 'CWE-223', 'CWE-778'
    ]);
  });

  describe('isApplicable', () => {
    // ステップ8: ログライブラリがある場合
    it('should return true when logging libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['winston', 'bunyan']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ9: モニタリングツールがある場合
    it('should return true when monitoring tools are present', () => {
      const context: ProjectContext = {
        dependencies: ['@sentry/node', 'elastic-apm-node']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ10: 関連要素がない場合
    it('should return false when no logging/monitoring elements are present', () => {
      const context: ProjectContext = {
        dependencies: ['lodash', 'express'],
        filePatterns: {
          source: ['src/utils.js'],
          test: [],
          ignore: []
        }
      };
      expect(plugin.isApplicable(context)).toBe(false);
    });
  });

  describe('detectPatterns', () => {
    // ステップ11: ログテストの検出
    it('should detect security logging test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/logging.test.js',
        content: `
          it('should log security events', () => {
            const event = { type: 'auth_failure', user: 'test' };
            logger.security(event);
            expect(logSpy).toHaveBeenCalledWith(event);
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const loggingPattern = patterns.find(p => p.patternId && p.patternId.includes('security-logging'));
      expect(loggingPattern).toBeDefined();
    });

    // ステップ12: モニタリングテストの検出
    it('should detect monitoring test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/monitoring.test.js',
        content: `
          describe('Security monitoring', () => {
            it('should alert on suspicious activity', () => {
              const activity = detectSuspiciousActivity();
              expect(alertSystem.notify).toHaveBeenCalled();
            });
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const monitoringPattern = patterns.find(p => p.patternId && p.patternId.includes('monitoring'));
      expect(monitoringPattern).toBeDefined();
    });

    // ステップ13: 不足テストの検出
    it('should detect missing logging tests', async () => {
      const testFile: TestFile = {
        path: 'test/basic.test.js',
        content: `
          it('should authenticate user', () => {
            const result = authenticate(user, password);
            expect(result.success).toBe(true);
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const missingPatterns = patterns.filter(p => p.patternId && p.patternId.startsWith('missing-logging-'));
      expect(missingPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality', () => {
    // ステップ14: 高品質スコアの評価
    it('should return high score when logging tests exist', () => {
      const patterns = [
        { patternId: 'logging-security-logging', metadata: { hasTest: true, testType: 'security-logging' }, confidence: 0.9 },
        { patternId: 'logging-audit-trail', metadata: { hasTest: true, testType: 'audit-trail' }, confidence: 0.9 },
        { patternId: 'logging-monitoring', metadata: { hasTest: true, testType: 'monitoring' }, confidence: 0.85 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.security).toBeGreaterThan(0.7);
    });

    // ステップ15: 低品質スコアの評価
    it('should return low score when logging tests are missing', () => {
      const patterns = [
        { patternId: 'missing-logging-security', metadata: { hasTest: false }, confidence: 0.9 },
        { patternId: 'missing-logging-audit', metadata: { hasTest: false }, confidence: 0.9 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeLessThan(0.5);
    });
  });

  describe('suggestImprovements', () => {
    // ステップ16: 改善提案の生成
    it('should suggest improvements for low score', () => {
      const lowScore = {
        overall: 0.3,
        security: 0.3,
        dimensions: {},
        confidence: 0.8,
        details: {
          strengths: [],
          weaknesses: ['ログカバレッジ不足'],
          suggestions: ['ログ出力を追加'],
          coverage: 0.3
        }
      };

      const improvements = plugin.suggestImprovements(lowScore);
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(i => i.title.includes('ログ'))).toBe(true);
    });
  });

  describe('validateSecurityTests', () => {
    // ステップ17: セキュリティテスト検証
    it('should validate security tests and return results', async () => {
      const testFile: TestFile = {
        path: 'test/security.test.js',
        content: `
          it('should log authentication failures', () => {
            const result = authenticate('invalid', 'wrong');
            expect(logger.warn).toHaveBeenCalledWith('Authentication failed');
          });
        `
      };

      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A09:2021');
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    // ステップ18: 脆弱性パターンの検出
    it('should detect insufficient logging patterns', () => {
      const content = `
        try {
          authenticate(user, password);
        } catch (error) {
          // エラーログなし
        }
        
        if (isAdmin) {
          deleteAllData(); // 監査ログなし
        }
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      expect(issues.length).toBeGreaterThan(0);
      const loggingIssue = issues.find(i => i.message.includes('ログ'));
      expect(loggingIssue).toBeDefined();
    });
  });

  describe('generateSecurityTests', () => {
    // ステップ19: セキュリティテストの生成
    it('should generate logging security test code', () => {
      const context: ProjectContext = {
        dependencies: ['winston', '@sentry/node'],
        testFramework: 'jest'
      };

      const tests = plugin.generateSecurityTests(context);
      expect(tests.length).toBeGreaterThan(0);
      expect(tests.some(test => test.includes('ログ'))).toBe(true);
    });
  });
});