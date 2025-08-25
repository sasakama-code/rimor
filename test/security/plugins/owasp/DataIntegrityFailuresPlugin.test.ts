/**
 * OWASP A08:2021 - Software and Data Integrity Failures プラグインのテスト
 * t_wadaのTDD手法に従って実装
 */

import { DataIntegrityFailuresPlugin } from '../../../../src/security/plugins/owasp/DataIntegrityFailuresPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('DataIntegrityFailuresPlugin', () => {
  let plugin: DataIntegrityFailuresPlugin;

  beforeEach(() => {
    plugin = new DataIntegrityFailuresPlugin();
  });

  // ステップ1: プラグインの存在確認
  it('should exist', () => {
    expect(plugin).toBeDefined();
  });

  // ステップ2: idプロパティ
  it('should have correct id', () => {
    expect(plugin.id).toBe('owasp-a08-data-integrity-failures');
  });

  // ステップ3: nameプロパティ
  it('should have correct name', () => {
    expect(plugin.name).toBe('OWASP A08: Software and Data Integrity Failures');
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
    expect(plugin.owaspCategory).toBe('A08:2021');
  });

  // ステップ7: cweIdsプロパティ
  it('should have correct CWE IDs', () => {
    expect(plugin.cweIds).toEqual([
      'CWE-494', 'CWE-502', 'CWE-829'
    ]);
  });

  describe('isApplicable', () => {
    // ステップ8: CI/CDまたはデプロイ関連の依存関係がある場合
    it('should return true when CI/CD or deployment tools are present', () => {
      const context: ProjectContext = {
        dependencies: ['@actions/core', 'semantic-release']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ9: シリアライゼーション関連の依存関係がある場合
    it('should return true when serialization libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['serialize-javascript', 'node-serialize']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ10: 関連要素がない場合
    it('should return false when no integrity-related elements are present', () => {
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
    // ステップ11: 署名検証テストの検出
    it('should detect signature verification test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/integrity.test.js',
        content: `
          it('should verify package signature', () => {
            const signature = sign(package, privateKey);
            expect(verifySignature(package, signature, publicKey)).toBe(true);
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const signaturePattern = patterns.find(p => p.patternId && p.patternId.includes('signature-verification'));
      expect(signaturePattern).toBeDefined();
    });

    // ステップ12: デシリアライゼーションテストの検出
    it('should detect deserialization security test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/serialization.test.js',
        content: `
          describe('Safe deserialization', () => {
            it('should reject untrusted data', () => {
              const maliciousData = '{"__proto__":{"isAdmin":true}}';
              expect(() => deserialize(maliciousData)).toThrow();
            });
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const deserializationPattern = patterns.find(p => p.patternId && p.patternId.includes('deserialization'));
      expect(deserializationPattern).toBeDefined();
    });

    // ステップ13: 不足テストの検出
    it('should detect missing integrity tests', async () => {
      const testFile: TestFile = {
        path: 'test/basic.test.js',
        content: `
          it('should deploy application', () => {
            const result = deploy();
            expect(result.status).toBe('success');
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const missingPatterns = patterns.filter(p => p.patternId && p.patternId.startsWith('missing-integrity-'));
      expect(missingPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality', () => {
    // ステップ14: 高品質スコアの評価
    it('should return high score when integrity tests exist', () => {
      const patterns = [
        { patternId: 'integrity-signature-verification', metadata: { hasTest: true, testType: 'signature-verification' }, confidence: 0.9 },
        { patternId: 'integrity-deserialization', metadata: { hasTest: true, testType: 'deserialization' }, confidence: 0.9 },
        { patternId: 'integrity-cicd', metadata: { hasTest: true, testType: 'cicd' }, confidence: 0.85 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.security).toBeGreaterThan(0.7);
      expect(score.confidence).toBeGreaterThan(0.8);
    });

    // ステップ15: 低品質スコアの評価
    it('should return low score when integrity tests are missing', () => {
      const patterns = [
        { patternId: 'missing-integrity-signature', metadata: { hasTest: false }, confidence: 1 },
        { patternId: 'missing-integrity-deserialization', metadata: { hasTest: false }, confidence: 1 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeLessThan(0.3);
      expect(score.coverage).toBe(0);
    });
  });

  describe('suggestImprovements', () => {
    // ステップ16: 改善提案の生成
    it('should suggest improvements for low score', () => {
      const evaluation = {
        overall: 0.3,
        security: 0.3,
        coverage: 30,
        dimensions: {},
        confidence: 0.9,
        details: {
          strengths: [],
          weaknesses: ['署名検証未実装'],
          suggestions: ['デシリアライゼーション保護を追加'],
          signatureVerificationImplemented: false,
          deserializationSecure: false,
          cicdSecurityImplemented: false
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].priority).toBe('critical');
    });
  });

  describe('validateSecurityTests', () => {
    // ステップ17: セキュリティテストの検証
    it('should validate security tests and return results', async () => {
      const testFile: TestFile = {
        path: 'test/integrity.test.js',
        content: `
          it('should verify signature', () => {
            expect(verifySignature(data, sig)).toBe(true);
          });
        `
      };

      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A08:2021');
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    // ステップ18: 脆弱性パターンの検出
    it('should detect insecure deserialization patterns', () => {
      const content = `
        const data = JSON.parse(userInput);
        eval(data.code);
        const obj = unserialize(request.body);
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      expect(issues.length).toBeGreaterThan(0);
      const deserializationIssue = issues.find(i => i.message.includes('シリアライ'));
      expect(deserializationIssue).toBeDefined();
    });
  });

  describe('generateSecurityTests', () => {
    // ステップ19: セキュリティテストの生成
    it('should generate integrity security test code', () => {
      const context: ProjectContext = {
        dependencies: ['@actions/core', 'serialize-javascript'],
        testFramework: 'jest'
      };

      const tests = plugin.generateSecurityTests(context);
      expect(tests.length).toBeGreaterThan(0);
      expect(tests.some(test => test.includes('署名'))).toBe(true);
    });
  });
});