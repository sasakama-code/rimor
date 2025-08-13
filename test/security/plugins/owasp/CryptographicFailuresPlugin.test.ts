/**
 * OWASP A02:2021 - Cryptographic Failures プラグインのテスト
 * t_wadaのTDD手法に従って実装
 */

import { CryptographicFailuresPlugin } from '../../../../src/security/plugins/owasp/CryptographicFailuresPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('CryptographicFailuresPlugin', () => {
  let plugin: CryptographicFailuresPlugin;

  beforeEach(() => {
    plugin = new CryptographicFailuresPlugin();
  });

  // ステップ1: プラグインの存在確認
  it('should exist', () => {
    expect(plugin).toBeDefined();
  });

  // ステップ2: idプロパティ
  it('should have correct id', () => {
    expect(plugin.id).toBe('owasp-a02-cryptographic-failures');
  });

  // ステップ3: nameプロパティ
  it('should have correct name', () => {
    expect(plugin.name).toBe('OWASP A02: Cryptographic Failures');
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
    expect(plugin.owaspCategory).toBe('A02:2021');
  });

  // ステップ7: cweIdsプロパティ
  it('should have correct CWE IDs', () => {
    expect(plugin.cweIds).toEqual([
      'CWE-259', 'CWE-261', 'CWE-296', 'CWE-310',
      'CWE-319', 'CWE-321', 'CWE-322', 'CWE-323',
      'CWE-324', 'CWE-325', 'CWE-326', 'CWE-327'
    ]);
  });

  describe('isApplicable', () => {
    // ステップ8: 暗号化ライブラリがある場合
    it('should return true when crypto libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['bcrypt', 'jsonwebtoken', 'express']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ9: 暗号化ライブラリがない場合
    it('should return false when no crypto libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['express', 'lodash', 'axios']
      };
      expect(plugin.isApplicable(context)).toBe(false);
    });

    // ステップ10: 暗号化関連のファイルパターンがある場合
    it('should return true when crypto file patterns are present', () => {
      const context: ProjectContext = {
        dependencies: [],
        filePatterns: {
          source: ['src/crypto/encryption.js', 'src/security/hash.js'],
          test: [],
          ignore: []
        }
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });
  });

  describe('detectPatterns', () => {
    // ステップ11: 暗号化テストパターンの検出
    it('should detect encryption test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/crypto.test.js',
        content: `
          describe('Encryption', () => {
            it('should encrypt data using AES-256', () => {
              const encrypted = encrypt(data, key);
              expect(encrypted).toBeDefined();
            });
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      expect(patterns.length).toBeGreaterThan(0);
      
      const encryptionPattern = patterns.find(p => p.patternId && p.patternId.includes('crypto-encryption'));
      expect(encryptionPattern).toBeDefined();
      expect(encryptionPattern?.confidence).toBeGreaterThan(0.7);
    });

    // ステップ12: 弱い暗号アルゴリズムの検出
    it('should detect weak cryptographic algorithms', async () => {
      const testFile: TestFile = {
        path: 'test/auth.test.js',
        content: `
          const crypto = require('crypto');
          const hash = crypto.createHash('md5');
          hash.update(password);
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const weakCryptoPattern = patterns.find(p => p.patternId && p.patternId.startsWith('weak-crypto-'));
      expect(weakCryptoPattern).toBeDefined();
      expect(weakCryptoPattern?.metadata?.algorithm).toBe('md5');
    });
  });

  describe('evaluateQuality', () => {
    // ステップ13: 高品質スコアの評価
    it('should return high score when comprehensive crypto tests exist', () => {
      const patterns = [
        { patternId: 'crypto-encryption-algorithm', metadata: { hasTest: true }, confidence: 0.9 },
        { patternId: 'crypto-key-management', metadata: { hasTest: true }, confidence: 0.9 },
        { patternId: 'crypto-password-hashing', metadata: { hasTest: true }, confidence: 0.9 },
        { patternId: 'crypto-tls', metadata: { hasTest: true }, confidence: 0.9 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeGreaterThan(0.2);
      expect(score.security).toBeGreaterThan(0.2);
      expect(score.confidence).toBe(0.9);
    });

    // ステップ14: 低品質スコアの評価（弱い暗号使用時）
    it('should return low score when weak crypto is detected', () => {
      const patterns = [
        { patternId: 'crypto-encryption-algorithm', metadata: { hasTest: true }, confidence: 0.9 },
        { patternId: 'weak-crypto-md5', metadata: { algorithm: 'md5' }, confidence: 0.95 },
        { patternId: 'weak-crypto-des', metadata: { algorithm: 'des' }, confidence: 0.95 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeLessThan(0.5);
      expect(score.details?.weakAlgorithmsDetected).toBe(2);
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
        dimensions: {}, // QualityScore型に必要
        details: {
          testCoverage: 30
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].priority).toBe('critical');
      expect(improvements[0].type).toBeDefined();
    });
  });

  describe('validateSecurityTests', () => {
    // ステップ16: セキュリティテストの検証
    it('should validate security tests and return results', async () => {
      const testFile: TestFile = {
        path: 'test/crypto.test.js',
        content: `
          describe('Crypto tests', () => {
            it('should use secure encryption', () => {
              const cipher = crypto.createCipher('aes-256-gcm', key);
            });
          });
        `
      };

      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A02:2021');
      expect(result.coverage).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.missingTests).toBeInstanceOf(Array);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    // ステップ17: ハードコードされた鍵の検出
    it('should detect hardcoded cryptographic keys', () => {
      const content = `
        const secretKey = "Th1sIsAHardCodedSecretKey12345678";
        const cipher = crypto.createCipher('aes-256-cbc', secretKey);
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      expect(issues.length).toBeGreaterThan(0);
      const hardcodedKeyIssue = issues.find(i => i.message.includes('ハードコード'));
      expect(hardcodedKeyIssue).toBeDefined();
      expect(hardcodedKeyIssue?.severity).toBe('critical');
    });

    // ステップ18: Math.randomの使用検出
    it('should detect insecure random number generation', () => {
      const content = `
        const token = Math.random().toString(36).substring(7);
        const sessionId = Math.random() * 1000000;
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      const insecureRandomIssue = issues.find(i => i.message.includes('安全でない乱数'));
      expect(insecureRandomIssue).toBeDefined();
      expect(insecureRandomIssue?.severity).toBe('critical');
    });
  });

  describe('generateSecurityTests', () => {
    // ステップ19: セキュリティテストの生成
    it('should generate security test code', () => {
      const context: ProjectContext = {
        dependencies: ['bcrypt', 'jsonwebtoken'],
        testFramework: 'jest'
      };

      const tests = plugin.generateSecurityTests(context);
      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0]).toBeDefined();
      expect(tests.some(t => t.includes('暗号'))).toBe(true);
    });
  });
});