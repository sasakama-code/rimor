/**
 * OWASP A06:2021 - Vulnerable and Outdated Components
 * TDD実装
 */

import { ProjectContext, TestFile, DetectionResult, QualityScore, Improvement, SecurityIssue } from '../../../core/types';
import { SeverityLevel } from '../../../types/common-types';
import { OWASPCategory, OWASPTestResult } from './IOWASPSecurityPlugin';

export class VulnerableComponentsPlugin {
  readonly id = 'owasp-a06-vulnerable-components';
  readonly name = 'OWASP A06: Vulnerable and Outdated Components';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A06_VULNERABLE_COMPONENTS;
  readonly cweIds = ['CWE-937', 'CWE-1035', 'CWE-1104'];

  isApplicable(context: ProjectContext): boolean {
    // 依存関係が存在する場合は適用可能
    return context.dependencies !== undefined && context.dependencies.length > 0;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content.toLowerCase();
    
    // 脆弱性スキャンパターンの検出
    if (content.includes('vulnerabilit') || content.includes('audit')) {
      patterns.push({
        patternId: 'vulnerable-vulnerability-scan',
        patternName: '脆弱性スキャンテスト',
        pattern: 'vulnerability-scan',
        location: { file: testFile.path, line: 1, column: 0 },
        confidence: 0.9,
        securityRelevance: 0.95,
        metadata: { hasTest: true }
      });
    }
    
    // 依存関係チェックパターンの検出
    if (content.includes('dependency') || content.includes('outdated') || content.includes('version')) {
      patterns.push({
        patternId: 'vulnerable-dependency-check',
        patternName: '依存関係チェックテスト',
        pattern: 'dependency-check',
        location: { file: testFile.path, line: 1, column: 0 },
        confidence: 0.9,
        securityRelevance: 0.9,
        metadata: { hasTest: true }
      });
    }
    
    // 不足しているテストの検出
    if (!content.includes('vulnerabilit') && !content.includes('dependency')) {
      patterns.push({
        patternId: 'missing-vulnerable-vulnerability-scan',
        patternName: '脆弱性スキャンテストが不足',
        pattern: 'vulnerability-scan',
        location: { file: testFile.path, line: 0, column: 0 },
        confidence: 1.0,
        securityRelevance: 0.95,
        severity: 'critical',
        metadata: { hasTest: false }
      });
    }
    
    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // パターンの分析
    const hasVulnerabilityScan = patterns.some(p => 
      p.pattern === 'vulnerability-scan' && p.metadata?.hasTest
    );
    const hasDependencyCheck = patterns.some(p => 
      p.pattern === 'dependency-check' && p.metadata?.hasTest
    );
    const hasLicenseCheck = patterns.some(p => 
      p.pattern === 'license-check' && p.metadata?.hasTest
    );
    
    // カバレッジの計算
    const vulnerabilityScanCoverage = hasVulnerabilityScan ? 100 : 0;
    const dependencyCheckCoverage = hasDependencyCheck ? 100 : 0;
    const licenseCheckCoverage = hasLicenseCheck ? 100 : 0;
    
    // スコアの計算
    const coverageScore = (vulnerabilityScanCoverage + dependencyCheckCoverage + licenseCheckCoverage) / 3 / 100;
    const overall = coverageScore * 0.8 + 0.2; // ベーススコア20%を追加
    const security = coverageScore;
    
    return {
      overall,
      security,
      coverage: coverageScore,
      maintainability: 0.5,
      dimensions: {
        completeness: Math.round(coverageScore * 100),
        correctness: 50,
        maintainability: 50
      },
      confidence: 0.9,
      details: {
        strengths: hasVulnerabilityScan ? ['脆弱性スキャン実装済み'] : [],
        weaknesses: !hasVulnerabilityScan ? ['脆弱性スキャン不足'] : [],
        suggestions: [],
        validationCoverage: vulnerabilityScanCoverage
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    // 脆弱性スキャンテストの改善提案
    if (!evaluation.details?.validationCoverage || evaluation.details.validationCoverage < 50) {
      improvements.push({
        id: 'add-vulnerability-scan-tests',
        title: '脆弱性スキャンテストの追加',
        description: '依存関係の脆弱性をチェックするテストを追加することで、セキュリティリスクを早期に発見できます。',
        priority: 'critical',
        type: 'add-test',
        category: 'security',
        location: { file: 'test/security/vulnerable-components.test.ts', line: 1, column: 0 },
        automatable: true,
        impact: 30,
        suggestedCode: `describe('Vulnerability Scan Tests', () => {
  it('should check for known vulnerabilities', async () => {
    const result = await runVulnerabilityScan();
    expect(result.vulnerabilities).toHaveLength(0);
    expect(result.critical).toBe(0);
  });
  
  it('should audit npm packages', async () => {
    const auditResult = await npmAudit();
    expect(auditResult.critical).toBe(0);
    expect(auditResult.high).toBe(0);
  });
});`,
        codeExample: `describe('Vulnerability Scan Tests', () => {
  it('should check for known vulnerabilities', async () => {
    const result = await runVulnerabilityScan();
    expect(result.vulnerabilities).toHaveLength(0);
    expect(result.critical).toBe(0);
  });
  
  it('should audit npm packages', async () => {
    const auditResult = await npmAudit();
    expect(auditResult.critical).toBe(0);
    expect(auditResult.high).toBe(0);
  });
});`
      });
    }
    
    // 依存関係チェックの改善提案
    if (!evaluation.details?.sanitizerCoverage || evaluation.details.sanitizerCoverage < 50) {
      improvements.push({
        id: 'add-dependency-check-tests',
        title: '依存関係チェックテストの追加',
        description: '古い依存関係や更新が必要なパッケージを検出するテストを追加します。',
        priority: 'high',
        type: 'add-test',
        category: 'security',
        location: { file: 'test/security/vulnerable-components.test.ts', line: 20, column: 0 },
        automatable: true,
        impact: 20
      });
    }
    
    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const content = testFile.content.toLowerCase();
    const testPatterns: string[] = [];
    const recommendations: string[] = [];
    const missingTests: string[] = [];
    
    // テストパターンの検出
    if (content.includes('vulnerabilit') || content.includes('scan')) {
      testPatterns.push('vulnerability-scan');
    }
    if (content.includes('dependency') || content.includes('update')) {
      testPatterns.push('dependency-update');
    }
    if (content.includes('audit')) {
      testPatterns.push('npm-audit');
    }
    
    // カバレッジの計算
    const requiredPatterns = ['vulnerability-scan', 'dependency-update', 'npm-audit'];
    const foundPatterns = requiredPatterns.filter(p => testPatterns.includes(p));
    const coverage = Math.round((foundPatterns.length / requiredPatterns.length) * 100);
    
    // 推奨事項の生成
    if (!testPatterns.includes('vulnerability-scan')) {
      recommendations.push('脆弱性スキャンテストを追加してください');
      missingTests.push('vulnerability-scan');
    }
    if (!testPatterns.includes('dependency-update')) {
      recommendations.push('依存関係更新チェックテストを追加してください');
      missingTests.push('dependency-update');
    }
    if (!testPatterns.includes('npm-audit')) {
      recommendations.push('npm auditテストを追加してください');
      missingTests.push('npm-audit');
    }
    
    if (testPatterns.length > 0) {
      recommendations.push('定期的にセキュリティテストを実行してください');
    }
    
    return {
      category: OWASPCategory.A06_VULNERABLE_COMPONENTS,
      coverage,
      issues: [],
      recommendations,
      testPatterns,
      missingTests
    };
  }

  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    // 既知の脆弱なパッケージとバージョン
    const vulnerablePackages = [
      { name: 'express', vulnerableVersions: ['3.0.0', '2.x.x'], severity: 'critical' },
      { name: 'lodash', vulnerableVersions: ['4.17.4', '4.17.11'], severity: 'critical' },
      { name: 'minimist', vulnerableVersions: ['0.0.8', '0.0.10'], severity: 'critical' },
      { name: 'jquery', vulnerableVersions: ['1.6.0', '1.x.x'], severity: 'high' },
      { name: 'angular', vulnerableVersions: ['1.2.0', '1.0.x'], severity: 'high' }
    ];
    
    // パッケージ.jsonの依存関係チェック
    vulnerablePackages.forEach(pkg => {
      const regex = new RegExp(`"${pkg.name}"\\s*:\\s*"([^"]+)"`, 'g');
      const matches = content.matchAll(regex);
      
      for (const match of matches) {
        const version = match[1];
        if (pkg.vulnerableVersions.some(v => version.includes(v.replace('.x.x', '')))) {
          issues.push({
            id: 'vulnerable-dependency-' + Math.random().toString(36).substr(2, 9),
            type: 'vulnerable-dependency',
            severity: pkg.severity as SeverityLevel,
            message: `脆弱性のある${pkg.name}バージョン${version}が検出されました`,
            location: {
              file: 'package.json',
              line: content.substring(0, match.index).split('\n').length,
              column: 0
            },
            recommendation: `${pkg.name}を最新の安全なバージョンに更新してください`
          });
        }
      }
    });
    
    // require文での古いバージョン検出
    const requireRegex = /require\(['"]([^@]+)@([^'"]+)['"]\)/g;
    const requireMatches = content.matchAll(requireRegex);
    
    for (const match of requireMatches) {
      const packageName = match[1];
      const version = match[2];
      
      // 古いバージョンの検出（簡易的なチェック）
      if (version.match(/^[01]\./)) { // 0.x または 1.x
        issues.push({
          id: 'outdated-version-' + Math.random().toString(36).substr(2, 9),
          type: 'outdated-version',
          severity: 'medium' as SeverityLevel,
          message: `古いバージョンの${packageName}@${version}が使用されています`,
          location: {
            file: 'unknown',
            line: content.substring(0, match.index).split('\n').length,
            column: 0
          },
          recommendation: `${packageName}を最新バージョンに更新してください`
        });
      }
    }
    
    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];
    
    // 基本的な脆弱性スキャンテスト
    tests.push(`describe('脆弱性スキャンテスト', () => {
  it('既知の脆弱性がないことを確認する', async () => {
    const vulnerabilities = await scanForVulnerabilities();
    expect(vulnerabilities.critical).toBe(0);
    expect(vulnerabilities.high).toBe(0);
  });
});`);
    
    // 依存関係チェックテスト
    tests.push(`describe('依存関係セキュリティテスト', () => {
  it('古い依存関係がないことを確認する', async () => {
    const outdatedDeps = await checkOutdatedDependencies();
    expect(outdatedDeps.length).toBe(0);
  });
  
  it('脆弱な依存関係がないことを確認する', async () => {
    const vulnerableDeps = await checkVulnerableDependencies();
    expect(vulnerableDeps.length).toBe(0);
  });
});`);
    
    // package.jsonが存在する場合、npm auditテストを追加
    if (context.filePatterns?.source?.includes('package.json')) {
      tests.push(`describe('npm auditセキュリティテスト', () => {
  it('npm auditでクリティカルな脆弱性がないことを確認する', async () => {
    const { stdout } = await exec('npm audit --json');
    const auditResult = JSON.parse(stdout);
    expect(auditResult.metadata.vulnerabilities.critical).toBe(0);
    expect(auditResult.metadata.vulnerabilities.high).toBe(0);
  });
});`);
    }
    
    return tests;
  }

  validateEnterpriseRequirements(testFile: TestFile): boolean {
    return true;
  }
}