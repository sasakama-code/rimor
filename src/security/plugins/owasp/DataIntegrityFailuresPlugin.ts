/**
 * OWASP A08:2021 - Software and Data Integrity Failures
 * ソフトウェアとデータの完全性障害に関するセキュリティテスト品質監査プラグイン
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
 * A08: Software and Data Integrity Failures プラグイン
 */
export class DataIntegrityFailuresPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a08-data-integrity-failures';
  readonly name = 'OWASP A08: Software and Data Integrity Failures';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A08_DATA_INTEGRITY_FAILURES;
  readonly cweIds = ['CWE-494', 'CWE-502', 'CWE-829'];

  isApplicable(context: ProjectContext): boolean {
    // CI/CD関連ツールの確認
    const cicdTools = [
      '@actions/core', '@actions/github', 'semantic-release', 'standard-version',
      'release-it', 'shipjs', 'auto', 'lerna', 'nx', 'changesets',
      'jenkins', 'travis-ci', 'circle-ci', 'gitlab-ci'
    ];
    
    // シリアライゼーション関連ライブラリの確認
    const serializationLibs = [
      'serialize-javascript', 'node-serialize', 'js-yaml', 'msgpack',
      'protobufjs', 'avro-js', 'pickle', 'marshal'
    ];

    // 署名・検証関連ライブラリの確認
    const signingLibs = [
      'jsonwebtoken', 'node-forge', 'crypto', 'openpgp',
      'node-rsa', 'jsrsasign'
    ];
    
    const hasCicdTool = hasDependencyPattern(context, cicdTools);
    const hasSerializationLib = hasDependencyPattern(context, serializationLibs);
    const hasSigningLib = hasDependencyPattern(context, signingLibs);

    // CI/CD関連ファイルの確認
    const hasCicdFiles = context.filePatterns?.source?.some((pattern: string) =>
      pattern.includes('.github/workflows') || pattern.includes('ci/cd') || 
      pattern.includes('deploy') || pattern.includes('release')
    ) || false;

    return hasCicdTool || hasSerializationLib || hasSigningLib || hasCicdFiles;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const lines = testFile.content.split('\n');

    // 署名検証テストパターン
    const signaturePattern = /sign|signature|verify.*signature|checksum|hash.*verify/i;
    const deserializationPattern = /deserialize|unmarshal|parse.*json|yaml.*load|pickle/i;
    const cicdPattern = /deploy|release|publish|ci.*cd|pipeline/i;
    const integrityPattern = /integrity|tamper|corrupt|checksum.*valid/i;

    lines.forEach((line, index) => {
      // 署名検証テストの検出
      if (signaturePattern.test(line)) {
        patterns.push({
          patternId: 'integrity-signature-verification',
          pattern: 'signature-verification',
          confidence: 0.85,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'high',
          metadata: { hasTest: true, testType: 'signature-verification' }
        });
      }

      // デシリアライゼーションセキュリティテストの検出
      if (deserializationPattern.test(line) && 
          (line.includes('untrusted') || line.includes('malicious') || line.includes('safe'))) {
        patterns.push({
          patternId: 'integrity-deserialization',
          pattern: 'secure-deserialization',
          confidence: 0.9,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'critical',
          metadata: { hasTest: true, testType: 'deserialization' }
        });
      }

      // CI/CDセキュリティテストの検出
      if (cicdPattern.test(line) && integrityPattern.test(line)) {
        patterns.push({
          patternId: 'integrity-cicd',
          pattern: 'cicd-security',
          confidence: 0.8,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'high',
          metadata: { hasTest: true, testType: 'cicd' }
        });
      }
    });

    // 不足テストの検出
    const hasSignatureTest = patterns.some(p => 
      p.metadata?.testType === 'signature-verification'
    );
    const hasDeserializationTest = patterns.some(p => 
      p.metadata?.testType === 'deserialization'
    );
    const hasCicdTest = patterns.some(p => 
      p.metadata?.testType === 'cicd'
    );

    if (!hasSignatureTest) {
      patterns.push({
        patternId: 'missing-integrity-signature',
        pattern: 'missing-signature-test',
        confidence: 1,
        severity: 'critical',
        metadata: { hasTest: false }
      });
    }

    if (!hasDeserializationTest) {
      patterns.push({
        patternId: 'missing-integrity-deserialization',
        pattern: 'missing-deserialization-test',
        confidence: 1,
        severity: 'critical',
        metadata: { hasTest: false }
      });
    }

    if (!hasCicdTest) {
      patterns.push({
        patternId: 'missing-integrity-cicd',
        pattern: 'missing-cicd-security-test',
        confidence: 1,
        severity: 'high',
        metadata: { hasTest: false }
      });
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const integrityTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('integrity-') && p.metadata?.hasTest
    );

    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-integrity-')
    );

    // カバレッジ計算
    const requiredTests = ['signature-verification', 'deserialization', 'cicd', 'update-integrity'];
    const testCoverage = (integrityTests.length / requiredTests.length) * 100;

    // セキュリティスコア計算
    const baseScore = OWASPUtils.calculateSecurityScore(
      testCoverage,
      missingTests.length
    );

    const hasSignatureTest = integrityTests.some(p => 
      p.metadata?.testType === 'signature-verification'
    );
    const hasDeserializationTest = integrityTests.some(p => 
      p.metadata?.testType === 'deserialization'
    );
    const hasCicdTest = integrityTests.some(p => 
      p.metadata?.testType === 'cicd'
    );

    const coverageScore = testCoverage / 100;
    const securityScore = (hasSignatureTest ? 0.35 : 0) + 
                         (hasDeserializationTest ? 0.35 : 0) + 
                         (hasCicdTest ? 0.3 : 0);

    return {
      overall: baseScore,
      security: securityScore,
      coverage: testCoverage,
      confidence: 0.85,
      dimensions: {
        completeness: testCoverage,
        correctness: integrityTests.length > 0 ? 75 : 0,
        maintainability: (hasSignatureTest ? 50 : 0) + (hasDeserializationTest ? 25 : 0) + (hasCicdTest ? 25 : 0)
      },
      details: {
        strengths: hasSignatureTest ? ['署名検証実装済み'] : [],
        weaknesses: !hasSignatureTest ? ['署名検証不足'] : [],
        suggestions: [],
        validationCoverage: hasSignatureTest ? 100 : 0
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (!evaluation.details?.validationCoverage || evaluation.details.validationCoverage < 100) {
      improvements.push({
        id: 'add-signature-verification-tests',
        priority: 'critical',
        type: 'add-test',
        title: '署名検証テストの追加',
        description: 'パッケージ、コード、アップデートの署名検証テストを実装してください',
        location: { file: '', line: 0, column: 0 },
        impact: 35,
        automatable: true
      });
    }

    if (!evaluation.details?.sanitizerCoverage || evaluation.details.sanitizerCoverage < 50) {
      improvements.push({
        id: 'add-secure-deserialization-tests',
        priority: 'critical',
        type: 'add-test',
        title: '安全なデシリアライゼーションテストの追加',
        description: '信頼できないデータのデシリアライゼーションを防ぐテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        impact: 35,
        automatable: true
      });
    }

    if (!evaluation.details?.boundaryCoverage || evaluation.details.boundaryCoverage < 50) {
      improvements.push({
        id: 'add-cicd-security-tests',
        priority: 'high',
        type: 'add-test',
        title: 'CI/CDパイプラインセキュリティテストの追加',
        description: 'ビルド、デプロイプロセスの完全性チェックテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        impact: 30,
        automatable: true
      });
    }

    if (evaluation.overall < 0.5) {
      improvements.push({
        id: 'add-update-integrity-tests',
        priority: 'high',
        type: 'add-test',
        title: 'アップデート完全性テストの追加',
        description: '自動更新プロセスの署名検証と完全性チェックテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        impact: 25,
        automatable: true
      });
    }

    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const patterns = await this.detectPatterns(testFile);
    const evaluation = this.evaluateQuality(patterns);
    const vulnerabilities = this.detectVulnerabilityPatterns(testFile.content);
    
    const integrityTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('integrity-') && p.metadata?.hasTest
    );
    
    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-integrity-')
    );

    const testPatterns: string[] = [];
    const recommendations: string[] = [];

    // 検出されたテストパターン
    if (integrityTests.some(p => p.metadata?.testType === 'signature-verification')) {
      testPatterns.push('署名検証テスト');
    }
    if (integrityTests.some(p => p.metadata?.testType === 'deserialization')) {
      testPatterns.push('安全なデシリアライゼーションテスト');
    }
    if (integrityTests.some(p => p.metadata?.testType === 'cicd')) {
      testPatterns.push('CI/CDセキュリティテスト');
    }

    // 推奨事項
    if (!integrityTests.some(p => p.metadata?.testType === 'signature-verification')) {
      recommendations.push('コード署名と検証テストを追加してください');
    }
    if (!integrityTests.some(p => p.metadata?.testType === 'deserialization')) {
      recommendations.push('デシリアライゼーションのセキュリティテストを追加してください');
    }
    if (!integrityTests.some(p => p.metadata?.testType === 'update-integrity')) {
      recommendations.push('アップデートプロセスの完全性チェックテストを追加してください');
    }

    const missingTestDescriptions = missingTests.map(p => {
      switch(p.patternId) {
        case 'missing-integrity-signature':
          return '署名検証テスト';
        case 'missing-integrity-deserialization':
          return '安全なデシリアライゼーションテスト';
        case 'missing-integrity-cicd':
          return 'CI/CDセキュリティテスト';
        default:
          return 'データ完全性テスト';
      }
    });

    return {
      category: this.owaspCategory,
      coverage: evaluation.coverage || 0,
      issues: vulnerabilities,
      recommendations,
      testPatterns,
      missingTests: missingTestDescriptions
    };
  }

  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');
    
    // 安全でないデシリアライゼーションパターンの検出
    const deserializationPatterns = [
      {
        pattern: /JSON\.parse\s*\([^)]*userInput[^)]*\)/gi,
        message: '安全でないデシリアライゼーション: ユーザー入力を直接JSON.parseしています',
        type: 'CODE_EXECUTION' as const
      },
      {
        pattern: /eval\s*\([^)]*\)/gi,
        message: '危険なコード実行: evalの使用は深刻なセキュリティリスクです',
        type: 'CODE_EXECUTION' as const
      },
      {
        pattern: /unserialize\s*\([^)]*\)/gi,
        message: '安全でないデシリアライゼーション: unserializeは任意のコード実行につながる可能性があります',
        type: 'CODE_EXECUTION' as const
      }
    ];

    let issueId = 0;
    lines.forEach((line, lineIndex) => {
      deserializationPatterns.forEach(({ pattern, message, type }) => {
        const matches = line.match(pattern);
        if (matches) {
          issues.push({
            id: `integrity-vuln-${++issueId}`,
            severity: 'critical',
            type,
            message,
            location: {
              file: 'unknown',
              line: lineIndex + 1,
              column: matches.index || 0
            }
          });
        }
      });
    });

    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];
    const deps = getDependencyNames(context);
    
    // 基本的な署名検証テスト
    tests.push(`// 署名検証テスト
describe('Code Integrity Tests', () => {
  it('should verify package signatures before installation', () => {
    const packageData = getPackageData();
    const signature = packageData.signature;
    const isValid = verifySignature(packageData, signature, PUBLIC_KEY);
    expect(isValid).toBe(true);
  });
});`);

    // CI/CDツール使用時のテスト
    const cicdTools = ['@actions/core', 'semantic-release', 'jenkins', 'travis-ci'];
    if (deps.some((dep: string) => cicdTools.includes(dep))) {
      tests.push(`// CI/CDパイプラインセキュリティテスト
describe('CI/CD Security', () => {
  it('should validate deployment pipeline integrity', () => {
    const pipelineConfig = loadPipelineConfig();
    expect(pipelineConfig.signedCommits).toBe(true);
    expect(pipelineConfig.artifactVerification).toBe(true);
  });
});`);
    }

    // シリアライゼーション関連のテスト
    const serializeTools = ['serialize-javascript', 'node-serialize', 'js-yaml'];
    if (deps.some((dep: string) => serializeTools.includes(dep))) {
      tests.push(`// 安全なデシリアライゼーションテスト
describe('Deserialization Security', () => {
  it('should reject malicious payloads', () => {
    const maliciousPayload = '{"__proto__":{"isAdmin":true}}';
    expect(() => deserialize(maliciousPayload)).toThrow();
  });
  
  it('should validate data before deserialization', () => {
    const untrustedData = getUserInput();
    const schema = getValidationSchema();
    const isValid = validateBeforeDeserialize(untrustedData, schema);
    expect(isValid).toBeDefined();
  });
});`);
    }

    return tests;
  }
}