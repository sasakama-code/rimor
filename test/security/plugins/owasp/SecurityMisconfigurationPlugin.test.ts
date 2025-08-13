/**
 * OWASP A05:2021 - Security Misconfiguration プラグインのテスト
 * t_wadaのTDD手法に従って実装
 */

import { SecurityMisconfigurationPlugin } from '../../../../src/security/plugins/owasp/SecurityMisconfigurationPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('SecurityMisconfigurationPlugin', () => {
  let plugin: SecurityMisconfigurationPlugin;

  beforeEach(() => {
    plugin = new SecurityMisconfigurationPlugin();
  });

  // ステップ1: プラグインの存在確認
  it('should exist', () => {
    expect(plugin).toBeDefined();
  });

  // ステップ2: idプロパティ
  it('should have correct id', () => {
    expect(plugin.id).toBe('owasp-a05-security-misconfiguration');
  });

  // ステップ3: nameプロパティ
  it('should have correct name', () => {
    expect(plugin.name).toBe('OWASP A05: Security Misconfiguration');
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
    expect(plugin.owaspCategory).toBe('A05:2021');
  });

  // ステップ7: cweIdsプロパティ
  it('should have correct CWE IDs', () => {
    expect(plugin.cweIds).toEqual([
      'CWE-16', 'CWE-611'
    ]);
  });

  describe('isApplicable', () => {
    // ステップ8: Webフレームワークがある場合
    it('should return true when web framework is present', () => {
      const context: ProjectContext = {
        dependencies: ['express', 'helmet']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ9: 設定関連ファイルがある場合
    it('should return true when configuration files are present', () => {
      const context: ProjectContext = {
        filePatterns: {
          source: ['src/config/security.js', 'src/settings.js'],
          test: [],
          ignore: []
        }
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ10: 関連要素がない場合
    it('should return false when no related elements are present', () => {
      const context: ProjectContext = {
        dependencies: ['lodash', 'axios'],
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
    // ステップ11: HTTPSヘッダーテストの検出
    it('should detect security headers test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/security.test.js',
        content: `
          it('should set security headers', () => {
            const response = request(app).get('/');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['content-security-policy']).toBeDefined();
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const securityHeadersPattern = patterns.find(p => p.patternId && p.patternId.includes('security-headers'));
      expect(securityHeadersPattern).toBeDefined();
      expect(securityHeadersPattern?.confidence).toBeGreaterThan(0.8);
    });

    // ステップ12: CORS設定テストの検出
    it('should detect CORS configuration test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/cors.test.js',
        content: `
          describe('CORS configuration', () => {
            it('should reject unauthorized origins', () => {
              const response = request(app)
                .get('/api')
                .set('Origin', 'http://evil.com');
              expect(response.status).toBe(403);
            });
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const corsPattern = patterns.find(p => p.patternId && p.patternId.includes('cors'));
      expect(corsPattern).toBeDefined();
    });

    // ステップ13: 不足テストの検出
    it('should detect missing security configuration tests', async () => {
      const testFile: TestFile = {
        path: 'test/basic.test.js',
        content: `
          it('should return user data', () => {
            const user = getUser(1);
            expect(user.name).toBe('John');
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const missingPatterns = patterns.filter(p => p.patternId && p.patternId.startsWith('missing-config-'));
      expect(missingPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality', () => {
    // ステップ14: 高品質スコアの評価
    it('should return high score when security configuration tests exist', () => {
      const patterns = [
        { patternId: 'config-security-headers', metadata: { hasTest: true }, confidence: 0.9 },
        { patternId: 'config-cors', metadata: { hasTest: true }, confidence: 0.8 },
        { patternId: 'config-error-handling', metadata: { hasTest: true }, confidence: 0.85 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeGreaterThan(0.3);
      expect(score.security).toBe(0.4);
      expect(score.confidence).toBe(0.85);
    });
  });

  describe('suggestImprovements', () => {
    // ステップ15: 改善提案の生成
    it('should suggest improvements for low score', () => {
      const evaluation = {
        overall: 0.3,
        security: 0.3,
        coverage: 30,
        confidence: 0.9,
        dimensions: {} // QualityScore型に必要
      };

      const improvements = plugin.suggestImprovements(evaluation);
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].priority).toBe('critical');
    });
  });

  describe('validateSecurityTests', () => {
    // ステップ16: セキュリティテストの検証
    it('should validate security tests and return results', async () => {
      const testFile: TestFile = {
        path: 'test/config.test.js',
        content: `
          it('should have secure headers', () => {
            expect(app.get('x-frame-options')).toBe('DENY');
          });
        `
      };

      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A05:2021');
      expect(result.coverage).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    // ステップ17: デフォルト設定の検出
    it('should detect default configuration vulnerabilities', () => {
      const content = `
        const config = {
          username: 'admin',
          password: 'admin123',
          debug: true
        };
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      expect(issues.length).toBeGreaterThan(0);
      const defaultConfigIssue = issues.find(i => i.message.includes('デフォルト'));
      expect(defaultConfigIssue).toBeDefined();
    });
  });

  describe('generateSecurityTests', () => {
    // ステップ18: セキュリティテストの生成
    it('should generate security test code', () => {
      const context: ProjectContext = {
        dependencies: ['express', 'helmet'],
        testFramework: 'jest'
      };

      const tests = plugin.generateSecurityTests(context);
      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0]).toBeDefined();
    });
  });
});