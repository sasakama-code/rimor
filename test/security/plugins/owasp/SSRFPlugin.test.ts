/**
 * OWASP A10:2021 - Server-Side Request Forgery (SSRF) プラグインのテスト
 * t_wadaのTDD手法に従って実装
 */

import { SSRFPlugin } from '../../../../src/security/plugins/owasp/SSRFPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('SSRFPlugin', () => {
  let plugin: SSRFPlugin;

  beforeEach(() => {
    plugin = new SSRFPlugin();
  });

  // ステップ1: プラグインの存在確認
  it('should exist', () => {
    expect(plugin).toBeDefined();
  });

  // ステップ2: idプロパティ
  it('should have correct id', () => {
    expect(plugin.id).toBe('owasp-a10-ssrf');
  });

  // ステップ3: nameプロパティ
  it('should have correct name', () => {
    expect(plugin.name).toBe('OWASP A10: Server-Side Request Forgery');
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
    expect(plugin.owaspCategory).toBe('A10:2021');
  });

  // ステップ7: cweIdsプロパティ
  it('should have correct CWE IDs', () => {
    expect(plugin.cweIds).toEqual([
      'CWE-918', 'CWE-611', 'CWE-441'
    ]);
  });

  describe('isApplicable', () => {
    // ステップ8: HTTPクライアントライブラリがある場合
    it('should return true when HTTP client libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['axios', 'node-fetch']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ9: URLパーサーライブラリがある場合
    it('should return true when URL parser libraries are present', () => {
      const context: ProjectContext = {
        dependencies: ['url-parse', 'whatwg-url']
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    // ステップ10: 関連要素がない場合
    it('should return false when no SSRF-related elements are present', () => {
      const context: ProjectContext = {
        dependencies: ['lodash', 'moment'],
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
    // ステップ11: SSRFテストの検出
    it('should detect SSRF prevention test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/ssrf.test.js',
        content: `
          it('should reject internal IP addresses', () => {
            const url = 'http://169.254.169.254/latest/meta-data/';
            expect(() => makeRequest(url)).toThrow('Invalid URL');
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const ssrfPattern = patterns.find(p => p.patternId && p.patternId.includes('ssrf-prevention'));
      expect(ssrfPattern).toBeDefined();
    });

    // ステップ12: URL検証テストの検出
    it('should detect URL validation test patterns', async () => {
      const testFile: TestFile = {
        path: 'test/validation.test.js',
        content: `
          describe('URL validation', () => {
            it('should validate URL allowlist', () => {
              const allowedUrl = 'https://api.example.com/data';
              expect(isAllowedUrl(allowedUrl)).toBe(true);
            });
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const validationPattern = patterns.find(p => p.patternId && p.patternId.includes('url-validation'));
      expect(validationPattern).toBeDefined();
    });

    // ステップ13: 不足テストの検出
    it('should detect missing SSRF tests', async () => {
      const testFile: TestFile = {
        path: 'test/api.test.js',
        content: `
          it('should fetch external data', () => {
            const data = fetchData(userProvidedUrl);
            expect(data).toBeDefined();
          });
        `
      };

      const patterns = await plugin.detectPatterns(testFile);
      const missingPatterns = patterns.filter(p => p.patternId && p.patternId.startsWith('missing-ssrf-'));
      expect(missingPatterns.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality', () => {
    // ステップ14: 高品質スコアの評価
    it('should return high score when SSRF tests exist', () => {
      const patterns = [
        { patternId: 'ssrf-ssrf-prevention', metadata: { hasTest: true, testType: 'ssrf-prevention' }, confidence: 0.9 },
        { patternId: 'ssrf-url-validation', metadata: { hasTest: true, testType: 'url-validation' }, confidence: 0.9 },
        { patternId: 'ssrf-allowlist', metadata: { hasTest: true, testType: 'allowlist' }, confidence: 0.85 }
      ];

      const score = plugin.evaluateQuality(patterns);
      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.security).toBeGreaterThan(0.7);
    });

    // ステップ15: 低品質スコアの評価
    it('should return low score when SSRF tests are missing', () => {
      const patterns = [
        { patternId: 'missing-ssrf-prevention', metadata: { hasTest: false }, confidence: 0.9 },
        { patternId: 'missing-ssrf-validation', metadata: { hasTest: false }, confidence: 0.9 }
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
        dimensions: {}, // QualityScore型に必要
        confidence: 0.9, // QualityScore型に必要
        details: { coverage: 0.3 }
      };

      const improvements = plugin.suggestImprovements(lowScore);
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(i => i.title.includes('SSRF'))).toBe(true);
    });
  });

  describe('validateSecurityTests', () => {
    // ステップ17: セキュリティテスト検証
    it('should validate security tests and return results', async () => {
      const testFile: TestFile = {
        path: 'test/security.test.js',
        content: `
          it('should block requests to internal networks', () => {
            const internalUrl = 'http://192.168.1.1/admin';
            expect(isBlockedUrl(internalUrl)).toBe(true);
          });
        `
      };

      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A10:2021');
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    // ステップ18: 脆弱性パターンの検出
    it('should detect dangerous SSRF patterns', () => {
      const content = `
        const url = req.query.url;
        fetch(url).then(response => {
          res.send(response.data);
        });
        
        const imageUrl = req.body.imageUrl;
        request.get(imageUrl).pipe(fs.createWriteStream('image.jpg'));
      `;

      const issues = plugin.detectVulnerabilityPatterns(content);
      expect(issues.length).toBeGreaterThan(0);
      const ssrfIssue = issues.find(i => i.message.includes('SSRF'));
      expect(ssrfIssue).toBeDefined();
    });
  });

  describe('generateSecurityTests', () => {
    // ステップ19: セキュリティテストの生成
    it('should generate SSRF security test code', () => {
      const context: ProjectContext = {
        dependencies: ['axios', 'express'],
        testFramework: 'jest'
      };

      const tests = plugin.generateSecurityTests(context);
      expect(tests.length).toBeGreaterThan(0);
      expect(tests.some(test => test.includes('SSRF'))).toBe(true);
    });
  });
});