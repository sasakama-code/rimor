/**
 * OWASP A04:2021 - Insecure Design
 * 安全でない設計に関するセキュリティテスト品質監査プラグイン
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
 * 設計セキュリティパターン
 */
interface DesignPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * A04: Insecure Design プラグイン
 * 
 * 検出対象:
 * - 脅威モデリングの不足
 * - セキュアな設計パターンの欠如
 * - ビジネスロジックの脆弱性
 * - セキュリティ要件の不足
 * - 設計段階でのセキュリティ考慮不足
 */
export class InsecureDesignPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a04-insecure-design';
  readonly name = 'OWASP A04: Insecure Design';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A04_INSECURE_DESIGN;
  readonly cweIds = [
    'CWE-73',  // External Control of File Name or Path
    'CWE-183', // Permissive List of Allowed Inputs
    'CWE-209', // Generation of Error Message Containing Sensitive Information
    'CWE-213', // Exposure of Sensitive Information Due to Incompatible Policies
    'CWE-235', // Improper Handling of Extra Parameters
    'CWE-256', // Unprotected Storage of Credentials
    'CWE-257', // Storing Passwords in a Recoverable Format
    'CWE-266', // Incorrect Privilege Assignment
    'CWE-269', // Improper Privilege Management
    'CWE-280', // Improper Handling of Insufficient Permissions
    'CWE-311', // Missing Encryption of Sensitive Data
    'CWE-312', // Cleartext Storage of Sensitive Information
    'CWE-313', // Cleartext Storage in a File or on Disk
    'CWE-316', // Cleartext Storage of Sensitive Information in Memory
    'CWE-419', // Unprotected Primary Channel
    'CWE-430', // Deployment of Wrong Handler
    'CWE-434', // Unrestricted Upload of File with Dangerous Type
    'CWE-444', // Inconsistent Interpretation of HTTP Requests
    'CWE-451', // User Interface (UI) Misrepresentation of Critical Information
    'CWE-488', // Exposure of Data Element to Wrong Session
    'CWE-489', // Active Debug Code
    'CWE-540', // Inclusion of Sensitive Information in Source Code
    'CWE-548', // Exposure of Information Through Directory Listing
    'CWE-552', // Files or Directories Accessible to External Parties
    'CWE-566', // Authorization Bypass Through User-Controlled SQL Primary Key
    'CWE-601', // URL Redirection to Untrusted Site
    'CWE-639', // Authorization Bypass Through User-Controlled Key
    'CWE-651', // Exposure of WSDL File Containing Sensitive Information
    'CWE-668', // Exposure of Resource to Wrong Sphere
    'CWE-706', // Use of Incorrectly-Resolved Name or Reference
    'CWE-862', // Missing Authorization
    'CWE-863', // Incorrect Authorization
    'CWE-913', // Improper Control of Dynamically-Managed Code Resources
    'CWE-922', // Insecure Storage of Sensitive Information
    'CWE-1275' // Sensitive Cookie with Improper SameSite Attribute
  ];

  // 設計セキュリティパターン
  private readonly designPatterns: DesignPattern[] = [
    {
      name: 'threat-modeling',
      pattern: /(threat.*model|stride|dread|security.*risk|risk.*assessment)/i,
      description: '脅威モデリングテスト',
      severity: 'critical'
    },
    {
      name: 'secure-by-design',
      pattern: /(secure.*by.*design|security.*design|design.*pattern|security.*architecture)/i,
      description: 'セキュアバイデザインテスト',
      severity: 'high'
    },
    {
      name: 'business-logic',
      pattern: /(business.*logic|business.*rule|workflow.*security|transaction.*integrity)/i,
      description: 'ビジネスロジックセキュリティテスト',
      severity: 'high'
    },
    {
      name: 'rate-limiting',
      pattern: /(rate.*limit|throttl|quota|api.*limit|request.*limit)/i,
      description: 'レート制限テスト',
      severity: 'high'
    },
    {
      name: 'fail-secure',
      pattern: /(fail.*secure|fail.*safe|error.*handl|exception.*security|graceful.*degrad)/i,
      description: 'フェイルセキュアテスト',
      severity: 'medium'
    },
    {
      name: 'defense-in-depth',
      pattern: /(defense.*in.*depth|layer.*security|multiple.*control|redundant.*security)/i,
      description: '多層防御テスト',
      severity: 'high'
    },
    {
      name: 'least-privilege',
      pattern: /(least.*privilege|minimum.*permission|principle.*of.*least|minimal.*access)/i,
      description: '最小権限の原則テスト',
      severity: 'high'
    },
    {
      name: 'separation-of-duties',
      pattern: /(separation.*of.*duties|segregation.*of.*duties|dual.*control|four.*eyes)/i,
      description: '職務分離テスト',
      severity: 'medium'
    }
  ];

  // 必須テストケース
  private readonly requiredTests = [
    'threat-model-validation-test',
    'business-logic-abuse-test',
    'rate-limiting-test',
    'fail-secure-test',
    'defense-in-depth-test',
    'least-privilege-test',
    'secure-defaults-test',
    'trust-boundary-test'
  ];

  /**
   * プラグインの適用可否判定
   */
  isApplicable(context: ProjectContext): boolean {
    // 設計・アーキテクチャ関連のファイルパターンをチェック
    const hasDesignFiles = context.filePatterns?.source?.some((pattern: string) => 
      pattern.includes('design') || pattern.includes('architecture') || 
      pattern.includes('service') || pattern.includes('domain') ||
      pattern.includes('business') || pattern.includes('workflow')
    ) || false;

    // APIやサービス層のライブラリをチェック
    const hasServiceLibraries = context.dependencies?.some(dep => 
      dep.includes('express') || dep.includes('fastify') || 
      dep.includes('koa') || dep.includes('nestjs') ||
      dep.includes('graphql') || dep.includes('grpc')
    ) || false;

    return hasDesignFiles || hasServiceLibraries;
  }

  /**
   * パターン検出
   */
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content;
    const lines = content.split('\n');

    // 設計パターンの検出
    lines.forEach((line, index) => {
      this.designPatterns.forEach(designPattern => {
        if (designPattern.pattern.test(line)) {
          patterns.push({
            patternId: `design-${designPattern.name}`,
            patternName: designPattern.description,
            pattern: designPattern.name,
            location: { 
              file: testFile.path, 
              line: index + 1, 
              column: 0 
            },
            confidence: 0.85,
            securityRelevance: designPattern.severity === 'critical' ? 1.0 : 
                              designPattern.severity === 'high' ? 0.9 : 
                              designPattern.severity === 'medium' ? 0.7 : 0.5,
            severity: designPattern.severity,
            metadata: {
              owaspCategory: this.owaspCategory,
              testType: designPattern.name,
              hasTest: true
            },
            evidence: [{
              type: 'design-test',
              description: `${designPattern.description}が検出されました`,
              location: { 
                file: testFile.path, 
                line: index + 1, 
                column: 0 
              },
              code: line.trim(),
              confidence: 0.85
            }]
          });
        }
      });

      // 設計上の脆弱性の検出
      if (this.detectDesignVulnerability(line)) {
        patterns.push({
          patternId: `design-vulnerability-${index}`,
          patternName: '設計上の脆弱性',
          pattern: 'design-vulnerability',
          location: { 
            file: testFile.path, 
            line: index + 1, 
            column: 0 
          },
          confidence: 0.9,
          securityRelevance: 0.95,
          severity: 'high',
          metadata: {
            owaspCategory: this.owaspCategory,
            vulnerability: true
          },
          evidence: [{
            type: 'vulnerability',
            description: '設計上の脆弱性が検出されました',
            location: { 
              file: testFile.path, 
              line: index + 1, 
              column: 0 
            },
            code: line.trim(),
            confidence: 0.9
          }]
        });
      }
    });

    // 不足しているテストパターンの検出
    const missingPatterns = this.detectMissingTests(content);
    patterns.push(...missingPatterns);

    return patterns;
  }

  /**
   * 品質評価
   */
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const designTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('design-') && p.metadata?.hasTest
    );

    const vulnerabilities = patterns.filter(p => 
      p.metadata?.vulnerability
    );

    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-design-')
    );

    // カバレッジ計算
    const testCoverage = OWASPUtils.calculateTestCoverage(
      designTests.map(p => p.pattern).filter((p): p is string => p !== undefined),
      this.requiredTests
    );

    // セキュリティスコア計算
    const vulnerabilityPenalty = Math.min(vulnerabilities.length * 0.1, 0.4);
    const baseScore = OWASPUtils.calculateSecurityScore(
      testCoverage,
      missingTests.length + vulnerabilities.length
    );
    const securityScore = Math.max(0, baseScore - vulnerabilityPenalty);

    // 各種テストの存在確認
    const hasThreatModelingTest = designTests.some(p => 
      p.pattern && p.pattern.includes('threat-modeling')
    );
    const hasBusinessLogicTest = designTests.some(p => 
      p.pattern && p.pattern.includes('business-logic')
    );
    const hasRateLimitingTest = designTests.some(p => 
      p.pattern && p.pattern.includes('rate-limiting')
    );
    const hasDefenseInDepthTest = designTests.some(p => 
      p.pattern && p.pattern.includes('defense-in-depth')
    );

    const coverageScore = testCoverage / 100;
    const maintainabilityScore = (hasThreatModelingTest ? 0.3 : 0) + 
                                (hasBusinessLogicTest ? 0.25 : 0) + 
                                (hasRateLimitingTest ? 0.25 : 0) +
                                (hasDefenseInDepthTest ? 0.2 : 0);

    return {
      overall: securityScore,
      security: securityScore,
      coverage: coverageScore,
      maintainability: maintainabilityScore,
      dimensions: {
        completeness: testCoverage,
        correctness: designTests.length > 0 ? 80 - (vulnerabilities.length * 15) : 0,
        maintainability: maintainabilityScore * 100
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0,
      details: {
        strengths: hasThreatModelingTest ? ['脅威モデリング実装済み'] : [],
        weaknesses: !hasThreatModelingTest ? ['脅威モデリング不足'] : [],
        suggestions: [],
        validationCoverage: hasThreatModelingTest ? 100 : 0
      }
    };
  }

  /**
   * 改善提案
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    // 脅威モデリングテストが不足している場合
    if (!evaluation.details?.validationCoverage || evaluation.details.validationCoverage < 100) {
      improvements.push({
        id: 'add-threat-modeling-tests',
        priority: 'critical',
        type: 'add-test',
        title: '脅威モデリングテストの追加',
        description: 'STRIDEやDREADなどの手法を使用した脅威モデリングテストを追加してください',
        location: { file: '', line: 0, column: 0 },
        impact: 35,
        automatable: false,
        codeExample: `
describe('Threat Modeling Tests', () => {
  it('should validate STRIDE threat model', () => {
    const threats = {
      spoofing: ['Authentication bypass', 'Session hijacking'],
      tampering: ['Data manipulation', 'Request forgery'],
      repudiation: ['Action denial', 'Log tampering'],
      informationDisclosure: ['Data leakage', 'Error exposure'],
      denialOfService: ['Resource exhaustion', 'Rate limit bypass'],
      elevationOfPrivilege: ['Privilege escalation', 'Admin access']
    };
    
    Object.entries(threats).forEach(([category, items]) => {
      items.forEach(threat => {
        expect(hasSecurityControl(threat)).toBe(true);
      });
    });
  });
});`
      });
    }

    // ビジネスロジックテストが不足している場合
    if (!evaluation.details?.sanitizerCoverage || evaluation.details.sanitizerCoverage < 100) {
      improvements.push({
        id: 'add-business-logic-tests',
        priority: 'high',
        type: 'add-test',
        title: 'ビジネスロジックセキュリティテストの追加',
        description: 'ビジネスルールの悪用を防ぐテストを追加してください',
        location: { file: '', line: 0, column: 0 },
        impact: 30,
        automatable: false,
        suggestions: [
          'トランザクションの一貫性テスト',
          'ワークフローのバイパステスト',
          '同時実行制御テスト',
          'ビジネスルール違反テスト'
        ]
      });
    }

    // レート制限テストが不足している場合
    if (!evaluation.details?.boundaryCoverage || evaluation.details.boundaryCoverage < 100) {
      improvements.push({
        id: 'add-rate-limiting-tests',
        priority: 'high',
        type: 'add-test',
        title: 'レート制限テストの追加',
        description: 'APIやリソースへの過剰なアクセスを防ぐテストを追加してください',
        location: { file: '', line: 0, column: 0 },
        impact: 25,
        automatable: false,
        codeExample: `
it('should enforce rate limiting', async () => {
  const requests = Array(100).fill(null).map(() => 
    request(app).get('/api/resource')
  );
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429);
  
  expect(rateLimited.length).toBeGreaterThan(0);
  expect(rateLimited[0].headers['retry-after']).toBeDefined();
});`
      });
    }

    // 多層防御テストが不足している場合
    if (!evaluation.dimensions?.security || evaluation.dimensions.security < 80) {
      improvements.push({
        id: 'add-defense-in-depth-tests',
        priority: 'high',
        type: 'add-test',
        title: '多層防御テストの追加',
        description: '複数のセキュリティ層が正しく機能することを検証してください',
        location: { file: '', line: 0, column: 0 },
        impact: 20,
        automatable: false
      });
    }

    // 設計上の脆弱性が検出された場合
    if (evaluation.details?.weaknesses && evaluation.details.weaknesses.length > 0) {
      improvements.push({
        id: 'fix-design-vulnerabilities',
        priority: 'critical',
        type: 'refactor',
        title: '設計上の脆弱性の修正',
        description: `${evaluation.details.weaknesses.length}個の設計上の脆弱性が検出されました。セキュアな設計パターンに修正してください`,
        location: { file: '', line: 0, column: 0 },
        impact: 40,
        automatable: false
      });
    }

    return improvements;
  }

  /**
   * セキュリティテストの検証
   */
  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const patterns = await this.detectPatterns(testFile);
    const issues = this.detectVulnerabilityPatterns(testFile.content);
    
    const testPatterns = patterns.filter(p => p.metadata?.hasTest)
      .map(p => p.pattern)
      .filter((p): p is string => p !== undefined);
    
    const missingTests = this.requiredTests.filter(test => 
      !testPatterns.some(pattern => pattern && pattern.includes(test.split('-')[0]))
    );

    const coverage = OWASPUtils.calculateTestCoverage(testPatterns, this.requiredTests);

    return {
      category: this.owaspCategory,
      coverage,
      issues,
      recommendations: this.generateRecommendations(coverage, missingTests, issues),
      testPatterns,
      missingTests
    };
  }

  /**
   * 脆弱性パターンの検出
   */
  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // 無制限のリソース使用
      if (line.includes('while(true)') || line.includes('for(;;)')) {
        issues.push({
          id: `unlimited-resource-${index}`,
          severity: 'critical',
          type: 'insufficient-validation',
          message: '無制限のリソース使用の可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // エラー情報の漏洩
      if (line.includes('console.error(error)') || 
          line.includes('res.send(error.stack)')) {
        issues.push({
          id: `error-exposure-${index}`,
          severity: 'warning',
          type: 'insufficient-validation',
          message: 'エラー情報が外部に漏洩する可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // 信頼できない入力の直接使用
      if (line.includes('eval(') || line.includes('Function(')) {
        issues.push({
          id: `dangerous-eval-${index}`,
          severity: 'critical',
          type: 'CODE_EXECUTION',
          message: '動的コード実行の脆弱性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // レート制限の欠如
      if ((line.includes('app.post') || line.includes('app.get')) && 
          !content.includes('rateLimit')) {
        issues.push({
          id: `missing-rate-limit-${index}`,
          severity: 'warning',
          type: 'insufficient-validation',
          message: 'レート制限が実装されていない可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }
    });

    return issues;
  }

  /**
   * 推奨セキュリティテストの生成
   */
  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];

    // 基本的な設計セキュリティテスト
    tests.push('脅威モデリング（STRIDE）の検証テスト');
    tests.push('ビジネスロジックの悪用防止テスト');
    tests.push('レート制限とクォータ管理テスト');
    
    // API使用時のテスト
    if (context.dependencies?.some(dep => 
        dep.includes('express') || dep.includes('fastify'))) {
      tests.push('APIエンドポイントのレート制限テスト');
      tests.push('APIバージョニングとの後方互換性テスト');
      tests.push('APIアクセスパターンの異常検知テスト');
    }

    // マイクロサービス使用時のテスト
    if (context.dependencies?.some(dep => 
        dep.includes('grpc') || dep.includes('rabbitmq'))) {
      tests.push('サービス間通信のセキュリティテスト');
      tests.push('分散トランザクションの一貫性テスト');
      tests.push('サーキットブレーカーパターンテスト');
    }

    // セキュアな設計パターン
    tests.push('フェイルセキュアメカニズムテスト');
    tests.push('多層防御の有効性テスト');
    tests.push('最小権限の原則の遵守テスト');
    tests.push('職務分離の実装テスト');

    return tests;
  }

  /**
   * エンタープライズ要件の検証
   */
  validateEnterpriseRequirements(testFile: TestFile): boolean {
    const content = testFile.content;
    
    // エンタープライズレベルの設計要件
    const requirements = [
      /enterprise.*architect|solution.*architect/i,  // エンタープライズアーキテクチャ
      /microservice|service.*mesh/i,                // マイクロサービス
      /saga.*pattern|cqrs|event.*sourc/i,          // 高度な設計パターン
      /circuit.*breaker|bulkhead/i,                // 復元力パターン
      /zero.*trust|security.*by.*design/i,         // ゼロトラスト設計
      /compliance.*requirement|regulatory/i,         // コンプライアンス要件
      /disaster.*recovery|high.*availability/i      // 高可用性設計
    ];

    return requirements.filter(req => req.test(content)).length >= 3;
  }

  // プライベートメソッド

  /**
   * 設計上の脆弱性の検出
   */
  private detectDesignVulnerability(line: string): boolean {
    const vulnerablePatterns = [
      /public\s+class.*Admin.*no.*auth/i,
      /allow.*all.*origin/i,
      /trust.*all.*certificate/i,
      /disable.*security/i,
      /skip.*validation/i,
      /TODO.*security/i,
      /FIXME.*auth/i
    ];

    return vulnerablePatterns.some(pattern => pattern.test(line));
  }

  /**
   * 不足しているテストの検出
   */
  private detectMissingTests(content: string): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const foundTests = this.designPatterns.filter(pattern => 
      pattern.pattern.test(content)
    ).map(p => p.name);

    const criticalMissing = [
      'threat-modeling',
      'business-logic',
      'rate-limiting'
    ];

    criticalMissing.forEach(test => {
      if (!foundTests.includes(test)) {
        patterns.push({
          patternId: `missing-design-${test}`,
          patternName: `${test}テストが不足`,
          pattern: test,
          location: { file: '', line: 0, column: 0 },
          confidence: 1.0,
          securityRelevance: 0.95,
          severity: 'critical',
          metadata: {
            owaspCategory: this.owaspCategory,
            testType: test,
            hasTest: false
          },
          evidence: [{
            type: 'missing-test',
            description: `重要な設計セキュリティテスト（${test}）が実装されていません`,
            location: { file: '', line: 0, column: 0 },
            code: '',
            confidence: 1.0
          }]
        });
      }
    });

    return patterns;
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(
    coverage: number, 
    missingTests: string[], 
    issues: SecurityIssue[]
  ): string[] {
    const recommendations: string[] = [];

    if (coverage < 50) {
      recommendations.push('設計セキュリティテストのカバレッジが非常に低いです。セキュアバイデザインの原則に従ってテストを追加してください');
    }

    if (missingTests.includes('threat-model-validation-test')) {
      recommendations.push('脅威モデリングを実施し、識別された脅威に対するテストを追加してください');
    }

    if (missingTests.includes('business-logic-abuse-test')) {
      recommendations.push('ビジネスロジックの悪用シナリオを想定したテストを追加してください');
    }

    if (issues.some(i => i.message.includes('無制限のリソース'))) {
      recommendations.push('リソース枯渇攻撃を防ぐため、適切な制限とタイムアウトを実装してください');
    }

    if (issues.some(i => i.message.includes('レート制限'))) {
      recommendations.push('すべてのAPIエンドポイントにレート制限を実装してください');
    }

    recommendations.push('定期的なセキュリティ設計レビューと脅威モデリングの更新を推奨します');

    return recommendations;
  }
}