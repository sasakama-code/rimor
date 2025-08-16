/**
 * VulnerableComponentsPlugin のテストスイート
 * TDD: REDフェーズ - 失敗するテストを先に書く
 */

import { VulnerableComponentsPlugin } from '../../../../src/security/plugins/owasp/VulnerableComponentsPlugin';
import { OWASPCategory } from '../../../../src/security/plugins/owasp/IOWASPSecurityPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';
import { VulnerableComponentsQualityDetails } from '../../../../src/security/plugins/owasp/types';

describe('VulnerableComponentsPlugin', () => {
  let plugin: VulnerableComponentsPlugin;

  beforeEach(() => {
    plugin = new VulnerableComponentsPlugin();
  });

  describe('基本プロパティ', () => {
    it('正しいプラグイン情報を持つ', () => {
      expect(plugin.id).toBe('owasp-a06-vulnerable-components');
      expect(plugin.name).toBe('OWASP A06: Vulnerable and Outdated Components');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('security');
      expect(plugin.owaspCategory).toBe(OWASPCategory.A06_VULNERABLE_COMPONENTS);
    });

    it('正しいCWE IDを持つ', () => {
      expect(plugin.cweIds).toContain('CWE-937');
      expect(plugin.cweIds).toContain('CWE-1035');
      expect(plugin.cweIds).toContain('CWE-1104');
    });
  });

  describe('isApplicable', () => {
    it('package.jsonが存在する場合はtrueを返す', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express', 'react', 'lodash'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });

    it('依存関係が存在しない場合はfalseを返す', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: [],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      expect(plugin.isApplicable(context)).toBe(false);
    });
  });

  describe('detectPatterns', () => {
    it('脆弱性チェックのテストパターンを検出する', async () => {
      const testFile: TestFile = {
        path: 'vulnerability.test.ts',
        content: `
describe('Vulnerability Tests', () => {
  it('should check for known vulnerabilities', () => {
    const result = checkVulnerabilities(dependencies);
    expect(result.vulnerabilities).toHaveLength(0);
  });
  
  it('should audit npm packages', () => {
    const auditResult = npmAudit();
    expect(auditResult.critical).toBe(0);
  });
});`
      };

      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.pattern === 'vulnerability-scan')).toBe(true);
      expect(patterns.some(p => p.metadata?.hasTest)).toBe(true);
    });

    it('依存関係の更新テストパターンを検出する', async () => {
      const testFile: TestFile = {
        path: 'dependency.test.ts',
        content: `
it('should check for outdated dependencies', () => {
  const outdated = checkOutdatedDependencies();
  expect(outdated.length).toBe(0);
});

it('should validate dependency versions', () => {
  const versions = getDependencyVersions();
  expect(versions.every(v => !v.isVulnerable)).toBe(true);
});`
      };

      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.pattern === 'dependency-check')).toBe(true);
    });

    it('不足しているテストを検出する', async () => {
      const testFile: TestFile = {
        path: 'incomplete.test.ts',
        content: `
describe('Basic Tests', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});`
      };

      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.patternId?.startsWith('missing-vulnerable-'))).toBe(true);
      expect(patterns.some((p: any) => p.severity === 'critical')).toBe(true);
    });
  });

  describe('evaluateQuality', () => {
    it('包括的な脆弱性テストに高スコアを付ける', () => {
      const patterns = [
        {
          patternId: 'vulnerable-vulnerability-scan',
          patternName: '脆弱性スキャンテスト',
          pattern: 'vulnerability-scan',
          location: { file: '', line: 1, column: 0 },
          confidence: 0.9,
          securityRelevance: 0.95,
          metadata: { hasTest: true }
        },
        {
          patternId: 'vulnerable-dependency-check',
          patternName: '依存関係チェックテスト',
          pattern: 'dependency-check',
          location: { file: '', line: 10, column: 0 },
          confidence: 0.9,
          securityRelevance: 0.9,
          metadata: { hasTest: true }
        },
        {
          patternId: 'vulnerable-license-check',
          patternName: 'ライセンスチェックテスト',
          pattern: 'license-check',
          location: { file: '', line: 20, column: 0 },
          confidence: 0.8,
          securityRelevance: 0.7,
          metadata: { hasTest: true }
        }
      ];

      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.security).toBeGreaterThan(0.7);
      expect((score.details as VulnerableComponentsQualityDetails)?.vulnerabilityScanCoverage).toBe(100);
      expect((score.details as VulnerableComponentsQualityDetails)?.dependencyCheckCoverage).toBe(100);
    });

    it('不完全なテストに低スコアを付ける', () => {
      const patterns = [
        {
          patternId: 'missing-vulnerable-vulnerability-scan',
          patternName: '脆弱性スキャンテストが不足',
          pattern: 'vulnerability-scan',
          location: { file: '', line: 0, column: 0 },
          confidence: 1.0,
          securityRelevance: 0.95,
          metadata: { hasTest: false }
        }
      ];

      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeLessThan(0.5);
      expect(score.security).toBeLessThan(0.5);
      expect((score.details as VulnerableComponentsQualityDetails)?.vulnerabilityScanCoverage).toBe(0);
    });
  });

  describe('suggestImprovements', () => {
    it('脆弱性スキャンテストが不足している場合の改善提案を生成する', () => {
      const evaluation = {
        overall: 0.3,
        security: 0.3,
        coverage: 0.2,
        maintainability: 0.0,
        dimensions: {},
        breakdown: { completeness: 20, correctness: 0, maintainability: 0 },
        confidence: 0.9,
        details: {
          strengths: [],
          weaknesses: ['脆弱性スキャン不足'],
          suggestions: ['依存関係チェックを追加'],
          vulnerabilityScanCoverage: 0,
          dependencyCheckCoverage: 0,
          licenseCheckCoverage: 0
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(i => i.id === 'add-vulnerability-scan-tests')).toBe(true);
      expect(improvements.some(i => i.priority === 'critical')).toBe(true);
      expect(improvements.some(i => i.codeExample)).toBe(true);
    });
  });

  describe('validateSecurityTests', () => {
    it('セキュリティテストの検証結果を返す', async () => {
      const testFile: TestFile = {
        path: 'security.test.ts',
        content: `
describe('Component Security', () => {
  it('should scan for vulnerabilities', () => {
    const scan = runVulnerabilityScan();
    expect(scan.critical).toBe(0);
  });
  
  it('should check dependency updates', () => {
    const updates = checkDependencyUpdates();
    expect(updates.security).toHaveLength(0);
  });
});`
      };

      const result = await plugin.validateSecurityTests(testFile);
      
      expect(result.category).toBe(OWASPCategory.A06_VULNERABLE_COMPONENTS);
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.testPatterns.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    it('既知の脆弱なパッケージを検出する', () => {
      const content = `
{
  "dependencies": {
    "express": "3.0.0",
    "lodash": "4.17.4",
    "minimist": "0.0.8"
  }
}`;

      const issues = plugin.detectVulnerabilityPatterns(content);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i: any) => i.type === 'vulnerable-dependency')).toBe(true);
      expect(issues.some((i: any) => i.severity === 'critical')).toBe(true);
    });

    it('古いバージョンの使用を検出する', () => {
      const content = `
const jquery = require('jquery@1.6.0');
const angular = require('angular@1.2.0');`;

      const issues = plugin.detectVulnerabilityPatterns(content);
      
      expect(issues.some((i: any) => i.type === 'outdated-version')).toBe(true);
    });
  });

  describe('generateSecurityTests', () => {
    it('基本的なセキュリティテストを生成する', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express', 'react'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      const tests = plugin.generateSecurityTests(context);
      
      expect(tests.length).toBeGreaterThan(0);
      expect(tests.some(t => t.includes('脆弱性'))).toBe(true);
      expect(tests.some(t => t.includes('依存関係'))).toBe(true);
    });

    it('npm使用時の追加テストを生成する', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express'],
        filePatterns: { test: [], source: ['package.json'], ignore: [] }
      };

      const tests = plugin.generateSecurityTests(context);
      
      expect(tests.some(t => t.includes('npm audit'))).toBe(true);
    });
  });

  describe('validateEnterpriseRequirements', () => {
    it('エンタープライズ要件を満たすテストを検証する', () => {
      const testFile: TestFile = {
        path: 'enterprise.test.ts',
        content: `
describe('Enterprise Component Security', () => {
  it('should enforce dependency approval process', () => {
    const unapproved = checkUnapprovedDependencies();
    expect(unapproved).toHaveLength(0);
  });
  
  it('should maintain software bill of materials', () => {
    const sbom = generateSBOM();
    expect(sbom.format).toBe('SPDX');
  });
  
  it('should check license compliance', () => {
    const licenses = checkLicenseCompliance();
    expect(licenses.nonCompliant).toHaveLength(0);
  });
});`
      };

      expect(plugin.validateEnterpriseRequirements!(testFile)).toBe(true);
    });
  });
});