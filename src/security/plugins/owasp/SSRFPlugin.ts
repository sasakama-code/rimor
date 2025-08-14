/**
 * OWASP A10:2021 - Server-Side Request Forgery (SSRF)
 * サーバーサイドリクエストフォージェリに関するセキュリティテスト品質監査プラグイン
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
import { hasDependencyPattern, getDependencyNames } from './dependency-utils';

/**
 * A10: Server-Side Request Forgery (SSRF) プラグイン
 */
export class SSRFPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a10-ssrf';
  readonly name = 'OWASP A10: Server-Side Request Forgery';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A10_SSRF;
  readonly cweIds = ['CWE-918', 'CWE-611', 'CWE-441'];

  isApplicable(context: ProjectContext): boolean {
    // HTTPクライアントライブラリの確認
    const httpLibs = [
      'axios', 'node-fetch', 'got', 'request', 'superagent',
      'bent', 'needle', 'undici', 'http', 'https'
    ];
    
    // URLパーサーライブラリの確認
    const urlLibs = [
      'url-parse', 'whatwg-url', 'url', 'querystring'
    ];

    // いずれかのライブラリが存在すればtrue
    return hasDependencyPattern(context, [...httpLibs, ...urlLibs]);
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content.toLowerCase();
    
    // SSRFテストパターン
    const ssrfPatterns = [
      {
        id: 'ssrf-prevention',
        keywords: ['169.254.169.254', 'internal', 'reject', 'block', 'ssrf', 'metadata'],
        testType: 'ssrf-prevention'
      },
      {
        id: 'url-validation',
        keywords: ['url', 'validate', 'allowlist', 'whitelist', 'allowed', 'isallowed'],
        testType: 'url-validation'
      },
      {
        id: 'allowlist',
        keywords: ['allowlist', 'whitelist', 'permitted', 'trusted', 'domains'],
        testType: 'allowlist'
      }
    ];

    // パターン検出
    ssrfPatterns.forEach(({ id, keywords, testType }) => {
      const hasPattern = keywords.some(keyword => content.includes(keyword));
      if (hasPattern) {
        patterns.push({
          patternId: `ssrf-${id}`,
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
    const hasSSRFKeywords = ['ssrf', 'block', 'reject', 'validate', 'allowlist', 'whitelist'].some(
      keyword => content.includes(keyword)
    );
    
    const hasFetchPattern = content.includes('fetch') || content.includes('request');
    
    // fetchやrequestがあるのにSSRFテストがない場合
    if (hasFetchPattern && !hasSSRFKeywords) {
      patterns.push({
        patternId: 'missing-ssrf-prevention',
        patternName: 'SSRF防止テストが不足しています',
        confidence: 0.9,
        metadata: {
          hasTest: false
        }
      });
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const ssrfTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('ssrf-') && p.metadata?.hasTest
    );
    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-')
    );

    // カバレッジ計算
    const requiredPatterns = ['ssrf-prevention', 'url-validation', 'allowlist'];
    const foundPatterns = ssrfTests.map(p => p.metadata?.testType).filter(Boolean);
    const coverage = foundPatterns.length / requiredPatterns.length;

    // 総合スコア計算
    const overall = missingTests.length > 0 ? 
      Math.max(0.3, coverage * 0.5) : 
      Math.min(0.9, 0.7 + (coverage * 0.2));

    // セキュリティスコア計算
    const hasSSRFPrevention = ssrfTests.some(p => 
      p.metadata?.testType === 'ssrf-prevention'
    );
    const hasUrlValidation = ssrfTests.some(p => 
      p.metadata?.testType === 'url-validation'
    );
    const security = (hasSSRFPrevention ? 0.5 : 0) + (hasUrlValidation ? 0.3 : 0) + (coverage * 0.2);

    return {
      overall,
      security,
      confidence: 0.85,
      dimensions: {
        completeness: coverage * 100,
        correctness: ssrfTests.length > 0 ? 75 : 0,
        maintainability: (hasSSRFPrevention ? 50 : 0) + (hasUrlValidation ? 50 : 0)
      },
      details: {
        strengths: hasSSRFPrevention ? ['SSRF防止実装済み'] : [],
        weaknesses: !hasSSRFPrevention ? ['SSRF防止不足'] : [],
        suggestions: [],
        validationCoverage: hasSSRFPrevention ? 100 : 0
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    const score = evaluation.overall || 0;
    
    if (score < 0.7) {
      improvements.push({
        id: 'add-ssrf-tests',
        type: 'add-test',
        title: 'SSRF防止テストの追加',
        description: 'サーバーサイドリクエストフォージェリ攻撃を防ぐテストを追加してください',
        priority: 'high',
        impact: 30,
        location: {
          file: 'test/security.test.js',
          line: 0,
          column: 0
        },
        automatable: false,
        codeExample: `// SSRF防止テストの例\nit('should block requests to internal networks', () => {\n  const internalUrls = [\n    'http://169.254.169.254/',\n    'http://192.168.1.1/',\n    'http://localhost:8080/'\n  ];\n  \n  internalUrls.forEach(url => {\n    expect(() => makeRequest(url)).toThrow('Forbidden URL');\n  });\n});`
      });
    }
    
    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const patterns = await this.detectPatterns(testFile);
    const ssrfTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('ssrf-') && p.metadata?.hasTest
    );
    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-')
    );
    
    const testPatterns: string[] = [];
    const recommendations: string[] = [];
    
    // 検出されたテストパターン
    if (ssrfTests.some(p => p.metadata?.testType === 'ssrf-prevention')) {
      testPatterns.push('SSRF防止テスト');
    }
    if (ssrfTests.some(p => p.metadata?.testType === 'url-validation')) {
      testPatterns.push('URL検証テスト');
    }
    if (ssrfTests.some(p => p.metadata?.testType === 'allowlist')) {
      testPatterns.push('許可リストテスト');
    }
    
    // 推奨事項
    if (!ssrfTests.some(p => p.metadata?.testType === 'ssrf-prevention')) {
      recommendations.push('内部ネットワークやメタデータサービスへのアクセスを防ぐテストを追加してください');
    }
    if (!ssrfTests.some(p => p.metadata?.testType === 'url-validation')) {
      recommendations.push('URL検証とスキーム制限のテストを追加してください');
    }
    if (!ssrfTests.some(p => p.metadata?.testType === 'allowlist')) {
      recommendations.push('許可されたドメインのみへのアクセスをテストしてください');
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
    
    // 危険なSSRFパターン
    const ssrfPatterns = [
      {
        pattern: /(req\.query|req\.body|req\.params)\.[\w]+/g,
        nextPattern: /(fetch|axios|request|http\.get)\s*\(/g,
        message: '危険なSSRF: ユーザー入力をURLとして直接使用しています'
      },
      {
        pattern: /url\s*=\s*(req\.|request\.|params\.|query\.)/g,
        message: 'SSRF脆弱性: URLパラメータの検証がありません'
      },
      {
        pattern: /(createWriteStream|pipe).*imageUrl|imageUrl.*(pipe|createWriteStream)/g,
        message: 'SSRF経由のファイル書き込み: 外部URLからのファイル保存は危険です'
      }
    ];
    
    lines.forEach((line, lineIndex) => {
      ssrfPatterns.forEach(({ pattern, nextPattern, message }) => {
        if (nextPattern) {
          // 2行にまたがるパターンの検出
          if (line.match(pattern) && lineIndex < lines.length - 1) {
            const nextLine = lines[lineIndex + 1];
            if (nextLine.match(nextPattern)) {
              issues.push({
                id: `ssrf-vuln-${++issueId}`,
                severity: 'critical',
                type: 'CODE_EXECUTION',
                message,
                location: {
                  file: 'unknown',
                  line: lineIndex + 1,
                  column: 0
                }
              });
            }
          }
        } else {
          // 単一行パターンの検出
          const matches = line.match(pattern);
          if (matches) {
            issues.push({
              id: `ssrf-vuln-${++issueId}`,
              severity: 'critical',
              type: 'CODE_EXECUTION',
              message,
              location: {
                file: 'unknown',
                line: lineIndex + 1,
                column: matches.index || 0
              }
            });
          }
        }
      });
    });
    
    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];
    const deps = getDependencyNames(context);
    
    // 基本的なSSRF防止テスト
    tests.push(`// SSRF防止テスト\ndescribe('SSRF Prevention', () => {\n  it('should block requests to internal IPs', () => {\n    const dangerousUrls = [\n      'http://169.254.169.254/latest/meta-data/',\n      'http://192.168.1.1/admin',\n      'http://10.0.0.1/config',\n      'http://localhost:8080/internal',\n      'http://127.0.0.1:3000/api'\n    ];\n    \n    dangerousUrls.forEach(url => {\n      expect(() => makeExternalRequest(url)).toThrow('Forbidden URL');\n    });\n  });\n  \n  it('should validate URL schemes', () => {\n    const dangerousSchemes = [\n      'file:///etc/passwd',\n      'ftp://internal.server/',\n      'gopher://example.com/',\n      'dict://example.com/'\n    ];\n    \n    dangerousSchemes.forEach(url => {\n      expect(isAllowedScheme(url)).toBe(false);\n    });\n  });\n});`);
    
    // URL許可リストテスト
    tests.push(`// URL許可リストテスト\ndescribe('URL Allowlist', () => {\n  it('should only allow whitelisted domains', () => {\n    const allowedDomains = ['api.example.com', 'cdn.example.com'];\n    const testUrls = [\n      { url: 'https://api.example.com/data', expected: true },\n      { url: 'https://evil.com/steal', expected: false },\n      { url: 'https://api.example.com.evil.com/', expected: false }\n    ];\n    \n    testUrls.forEach(({ url, expected }) => {\n      expect(isAllowedDomain(url, allowedDomains)).toBe(expected);\n    });\n  });\n});`);
    
    // HTTPクライアント使用時の追加テスト
    if (deps.some((dep: string) => ['axios', 'node-fetch', 'got'].includes(dep))) {
      tests.push(`// HTTPクライアントセキュリティテスト\ndescribe('HTTP Client Security', () => {\n  it('should timeout on slow responses', async () => {\n    const slowUrl = 'https://slowserver.example.com/';\n    await expect(\n      makeRequestWithTimeout(slowUrl, { timeout: 5000 })\n    ).rejects.toThrow('Request timeout');\n  });\n  \n  it('should limit redirect depth', async () => {\n    const redirectUrl = 'https://redirect.example.com/infinite';\n    await expect(\n      makeRequestWithRedirectLimit(redirectUrl, { maxRedirects: 5 })\n    ).rejects.toThrow('Too many redirects');\n  });\n});`);
    }
    
    return tests;
  }
}