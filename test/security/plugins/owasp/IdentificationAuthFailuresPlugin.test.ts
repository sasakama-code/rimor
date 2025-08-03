/**
 * OWASP A07:2021 - Identification and Authentication Failures プラグインのテスト
 * t_wadaのTDD手法に従って実装
 */

import { IdentificationAuthFailuresPlugin } from '../../../../src/security/plugins/owasp/IdentificationAuthFailuresPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('IdentificationAuthFailuresPlugin', () => {
  let plugin: IdentificationAuthFailuresPlugin;

  beforeEach(() => {
    plugin = new IdentificationAuthFailuresPlugin();
  });

  // ステップ1: プラグインの存在確認
  it('should exist', () => {
    expect(plugin).toBeDefined();
  });

  // ステップ2: idプロパティ
  it('should have correct id', () => {
    expect(plugin.id).toBe('owasp-a07-identification-auth-failures');
  });

  // ステップ3: nameプロパティ
  it('should have correct name', () => {
    expect(plugin.name).toBe('OWASP A07: Identification and Authentication Failures');
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
    expect(plugin.owaspCategory).toBe('A07:2021');
  });

  // ステップ7: cweIdsプロパティ
  it('should have correct CWE IDs', () => {
    expect(plugin.cweIds).toEqual([
      'CWE-287', 'CWE-297', 'CWE-384'
    ]);
  });

  describe('isApplicable', () => {
    // ステップ8: 認証関連の依存関係がある場合
    it('should return true when authentication libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['passport', 'jsonwebtoken']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ9: 認証関連ファイルがある場合
    it('should return true when authentication-related files are present', () => {
      const context: ProjectContext = {
        filePatterns: {
          source: ['src/auth/login.js', 'src/authentication.js'],
          test: [],
          ignore: []
        }
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ10: 関連要素がない場合
    it('should return false when no authentication elements are present', () => {
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
    // ステップ11: パスワード強度テストの検出
    it('should detect password strength test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/auth.test.js',
        content: `
          it('should require strong passwords', () => {
            const weakPassword = '123456';
            expect(validatePassword(weakPassword)).toBe(false);
            const strongPassword = 'SecureP@ssw0rd123!';
            expect(validatePassword(strongPassword)).toBe(true);
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const passwordPattern = patterns.find(p => p.patternId && p.patternId.includes('password-strength'));
      expect(passwordPattern).toBeDefined();
    });

    // ステップ12: ブルートフォース対策テストの検出
    it('should detect brute force protection test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/auth.test.js',
        content: `
          describe('Rate limiting', () => {
            it('should block after 5 failed attempts', () => {
              for (let i = 0; i < 5; i++) {
                login('user', 'wrongpassword');
              }
              const result = login('user', 'wrongpassword');
              expect(result.blocked).toBe(true);
            });
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const bruteForcePattern = patterns.find(p => p.patternId && p.patternId.includes('brute-force'));
      expect(bruteForcePattern).toBeDefined();
    });

    // ステップ13: 不足テストの検出
    it('should detect missing authentication tests', async () => {
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
      const missingPatterns = patterns.filter(p => p.patternId && p.patternId.startsWith('missing-auth-'));
      expect(missingPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality', () => {
    // ステップ14: 高品質スコアの評価
    it('should return high score when authentication tests exist', () => {
      const patterns = [
        { patternId: 'auth-password-strength', metadata: { hasTest: true, testType: 'password-strength' }, confidence: 0.9 },
        { patternId: 'auth-brute-force', metadata: { hasTest: true, testType: 'brute-force' }, confidence: 0.9 },
        { patternId: 'auth-mfa', metadata: { hasTest: true, testType: 'mfa' }, confidence: 0.85 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.security).toBeGreaterThan(0.7);
      expect(score.confidence).toBeGreaterThan(0.8);
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
        details: {
          passwordTestImplemented: false,
          bruteForceProtection: false,
          mfaImplemented: false
        }
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
        path: 'test/auth.test.js',
        content: `
          it('should validate password strength', () => {
            expect(validatePassword('weak')).toBe(false);
          });
          it('should rate limit login attempts', () => {
            expect(rateLimiter.isBlocked()).toBe(true);
          });
        `
      };

      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A07:2021');
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    // ステップ17: 脆弱性パターンの検出
    it('should detect weak authentication patterns', () => {
      const content = `
        const password = '123456';
        const adminPassword = 'admin';
        
        function authenticate(user, pass) {
          if (pass === 'password') {
            return true;
          }
        }
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      expect(issues.length).toBeGreaterThan(0);
      const weakPasswordIssue = issues.find(i => i.message.includes('弱いパスワード'));
      expect(weakPasswordIssue).toBeDefined();
    });
  });

  describe('generateSecurityTests', () => {
    // ステップ18: セキュリティテストの生成
    it('should generate authentication security test code', () => {
      const context: ProjectContext = {
        dependencies: ['passport', 'bcrypt'],
        testFramework: 'jest'
      };

      const tests = plugin.generateSecurityTests(context);
      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0]).toBeDefined();
      expect(tests.some(test => test.includes('パスワード'))).toBe(true);
    });
  });
});