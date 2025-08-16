/**
 * OWASP A02:2021 - Cryptographic Failures
 * 暗号化の失敗に関するセキュリティテスト品質監査プラグイン
 */

import {
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  SecurityIssue
} from '../../../core/types';
import { CryptographicFailuresQualityDetails } from './types';
import {
  IOWASPSecurityPlugin,
  OWASPCategory,
  OWASPTestResult,
  OWASPUtils,
  OWASPBasePlugin
} from './IOWASPSecurityPlugin';
import { hasDependencyPattern } from './dependency-utils';

/**
 * 暗号化テストパターン
 */
interface CryptoPattern {
  name: string;
  pattern: RegExp;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * A02: Cryptographic Failures プラグイン
 * 
 * 検出対象:
 * - 機密データの暗号化不足
 * - 弱い暗号アルゴリズムの使用
 * - 不適切な鍵管理
 * - 平文での機密データ送信
 * - 暗号化の実装エラー
 */
export class CryptographicFailuresPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a02-cryptographic-failures';
  readonly name = 'OWASP A02: Cryptographic Failures';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A02_CRYPTOGRAPHIC_FAILURES;
  readonly cweIds = [
    'CWE-259', // Use of Hard-coded Password
    'CWE-261', // Weak Cryptography for Passwords
    'CWE-296', // Improper Following of Chain of Trust for Certificate Validation
    'CWE-310', // Cryptographic Issues
    'CWE-319', // Cleartext Transmission of Sensitive Information
    'CWE-321', // Use of Hard-coded Cryptographic Key
    'CWE-322', // Key Exchange without Entity Authentication
    'CWE-323', // Reusing a Nonce, Key Pair in Encryption
    'CWE-324', // Use of a Key Past its Expiration Date
    'CWE-325', // Missing Required Cryptographic Step
    'CWE-326', // Inadequate Encryption Strength
    'CWE-327'  // Use of a Broken or Risky Cryptographic Algorithm
  ];

  // 暗号化テストパターン
  private readonly cryptoPatterns: CryptoPattern[] = [
    {
      name: 'encryption-algorithm',
      pattern: /(\bcrypto|encrypt|decrypt|cipher|aes|rsa|sha|hash|bcrypt|argon2|pbkdf2)/i,
      description: '暗号化アルゴリズムテスト',
      severity: 'high'
    },
    {
      name: 'secure-storage',
      pattern: /(secure.*storage|encrypt.*data|protect.*sensitive|data.*encryption)/i,
      description: '安全なデータ保存テスト',
      severity: 'high'
    },
    {
      name: 'key-management',
      pattern: /(key.*management|key.*rotation|key.*storage|secret.*key|private.*key)/i,
      description: '鍵管理テスト',
      severity: 'critical'
    },
    {
      name: 'tls-https',
      pattern: /(https|tls|ssl|certificate|secure.*connection)/i,
      description: 'TLS/HTTPS通信テスト',
      severity: 'high'
    },
    {
      name: 'password-hashing',
      pattern: /(password.*hash|bcrypt|argon2|pbkdf2|scrypt|hash.*password)/i,
      description: 'パスワードハッシュテスト',
      severity: 'critical'
    },
    {
      name: 'random-generation',
      pattern: /(crypto\.random|secure.*random|cryptographically.*secure|random.*bytes)/i,
      description: '安全な乱数生成テスト',
      severity: 'medium'
    },
    {
      name: 'data-at-rest',
      pattern: /(data.*at.*rest|database.*encrypt|file.*encrypt|disk.*encrypt)/i,
      description: '保存データの暗号化テスト',
      severity: 'high'
    },
    {
      name: 'data-in-transit',
      pattern: /(data.*in.*transit|transport.*security|network.*encrypt)/i,
      description: '転送中データの暗号化テスト',
      severity: 'high'
    }
  ];

  // 弱い暗号アルゴリズム
  private readonly weakAlgorithms = [
    'md5', 'sha1', 'des', 'rc4', 'ecb',
    'Math.random', 'pseudorandom', 'weak.*cipher'
  ];

  // 必須テストケース
  private readonly requiredTests = [
    'strong-encryption-test',
    'secure-key-storage-test',
    'password-hashing-test',
    'tls-configuration-test',
    'data-at-rest-encryption-test',
    'data-in-transit-encryption-test',
    'key-rotation-test',
    'crypto-implementation-test'
  ];

  /**
   * プラグインの適用可否判定
   */
  isApplicable(context: ProjectContext): boolean {
    // 暗号化関連のライブラリ使用をチェック
    const cryptoLibraries = [
      'crypto', 'bcrypt', 'jsonwebtoken', 'node-forge',
      'crypto-js', 'argon2', 'scrypt', 'pbkdf2',
      'https', 'tls', '@aws-sdk/client-kms'
    ];
    
    let hasCryptoLibrary = false;
    const deps = context.dependencies;
    
    if (Array.isArray(deps)) {
      hasCryptoLibrary = (deps as string[]).some((dep: string) => 
        cryptoLibraries.some(lib => dep.includes(lib))
      );
    } else if (deps && typeof deps === 'object') {
      hasCryptoLibrary = cryptoLibraries.some(lib => 
        Object.keys(deps as Record<string, string>).some(dep => dep.includes(lib))
      );
    }

    // 暗号化関連のファイルパターンをチェック
    const hasCryptoFiles = context.filePatterns?.source?.some((pattern: string) => 
      pattern.includes('crypto') || pattern.includes('encrypt') || 
      pattern.includes('security') || pattern.includes('hash')
    ) || false;

    return hasCryptoLibrary || hasCryptoFiles;
  }

  /**
   * パターン検出
   */
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content;
    const lines = content.split('\n');

    // 暗号化パターンの検出
    lines.forEach((line, index) => {
      this.cryptoPatterns.forEach(cryptoPattern => {
        if (cryptoPattern.pattern.test(line)) {
          patterns.push({
            patternId: `crypto-${cryptoPattern.name}`,
            patternName: cryptoPattern.description,
            pattern: cryptoPattern.name,
            location: { 
              file: testFile.path, 
              line: index + 1, 
              column: 0 
            },
            confidence: 0.85,
            securityRelevance: cryptoPattern.severity === 'critical' ? 1.0 : 
                              cryptoPattern.severity === 'high' ? 0.9 : 
                              cryptoPattern.severity === 'medium' ? 0.7 : 0.5,
            severity: cryptoPattern.severity,
            metadata: {
              owaspCategory: this.owaspCategory,
              testType: cryptoPattern.name,
              hasTest: true
            },
            evidence: [{
              type: 'crypto-test',
              description: `${cryptoPattern.description}が検出されました`,
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

      // 弱い暗号アルゴリズムの検出
      this.weakAlgorithms.forEach(weakAlgo => {
        if (line.toLowerCase().includes(weakAlgo)) {
          patterns.push({
            patternId: `weak-crypto-${weakAlgo}`,
            patternName: `弱い暗号アルゴリズム: ${weakAlgo}`,
            pattern: weakAlgo,
            location: { 
              file: testFile.path, 
              line: index + 1, 
              column: 0 
            },
            confidence: 0.95,
            securityRelevance: 0.95,
            severity: 'critical',
            metadata: {
              owaspCategory: this.owaspCategory,
              weakness: 'weak-algorithm',
              algorithm: weakAlgo
            },
            evidence: [{
              type: 'weak-crypto',
              description: `弱い暗号アルゴリズム（${weakAlgo}）が使用されています`,
              location: { 
                file: testFile.path, 
                line: index + 1, 
                column: 0 
              },
              code: line.trim(),
              confidence: 0.95
            }]
          });
        }
      });
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
    const cryptoTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('crypto-') && p.metadata?.hasTest
    );

    const weakCryptoUsage = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('weak-crypto-')
    );

    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-crypto-')
    );

    // カバレッジ計算
    const testCoverage = OWASPUtils.calculateTestCoverage(
      cryptoTests.map(p => p.pattern).filter((p): p is string => p !== undefined),
      this.requiredTests
    );

    // 弱い暗号の使用によるペナルティ
    const weakCryptoPenalty = Math.min(weakCryptoUsage.length * 0.1, 0.5);

    // セキュリティスコア計算
    const baseScore = OWASPUtils.calculateSecurityScore(
      testCoverage,
      missingTests.length + weakCryptoUsage.length
    );
    const securityScore = Math.max(0, baseScore - weakCryptoPenalty);

    // 各種テストの存在確認
    const hasEncryptionTest = cryptoTests.some(p => 
      p.pattern && p.pattern.includes('encryption')
    );
    const hasKeyManagementTest = cryptoTests.some(p => 
      p.pattern && p.pattern.includes('key-management')
    );
    const hasPasswordHashingTest = cryptoTests.some(p => 
      p.pattern && p.pattern.includes('password-hashing')
    );
    const hasTLSTest = cryptoTests.some(p => 
      p.pattern && p.pattern.includes('tls')
    );

    const coverageScore = testCoverage / 100;
    const maintainabilityScore = (hasEncryptionTest ? 0.25 : 0) + 
                                (hasKeyManagementTest ? 0.25 : 0) + 
                                (hasPasswordHashingTest ? 0.25 : 0) +
                                (hasTLSTest ? 0.25 : 0);

    return {
      overall: securityScore,
      security: securityScore,
      coverage: coverageScore,
      maintainability: maintainabilityScore,
      dimensions: {
        completeness: testCoverage,
        correctness: cryptoTests.length > 0 ? 75 - (weakCryptoUsage.length * 10) : 0,
        maintainability: maintainabilityScore * 100
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0,
      details: {
        strengths: hasEncryptionTest ? ['暗号化テスト実装済み'] : [],
        weaknesses: !hasEncryptionTest ? ['暗号化テスト不足'] : [],
        suggestions: [],
        validationCoverage: hasEncryptionTest ? 100 : 0,
        sanitizerCoverage: hasKeyManagementTest ? 100 : 0,
        boundaryCoverage: hasPasswordHashingTest ? 100 : 0,
        weakAlgorithmsDetected: weakCryptoUsage.length
      } as CryptographicFailuresQualityDetails
    };
  }

  /**
   * 改善提案
   */
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    // 暗号化テストが不足している場合
    if (!evaluation.details?.validationCoverage || evaluation.details.validationCoverage < 100) {
      improvements.push({
        id: 'add-encryption-tests',
        priority: 'critical',
        type: 'add-test',
        title: '暗号化アルゴリズムテストの追加',
        description: 'データの暗号化・復号化が正しく行われることを検証するテストを追加してください',
        location: { file: '', line: 0, column: 0 },
        impact: 25,
        automatable: false,
        codeExample: `
describe('Encryption Tests', () => {
  it('should encrypt sensitive data with AES-256-GCM', async () => {
    const plaintext = 'sensitive data';
    const key = await crypto.generateKey('aes', { length: 256 });
    
    const encrypted = await encrypt(plaintext, key, 'aes-256-gcm');
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
  });

  it('should not use weak algorithms', () => {
    expect(() => encrypt('data', 'key', 'des')).toThrow('Weak algorithm');
    expect(() => encrypt('data', 'key', 'md5')).toThrow('Weak algorithm');
  });
});`
      });
    }

    // 鍵管理テストが不足している場合
    if (!evaluation.details?.sanitizerCoverage || evaluation.details.sanitizerCoverage < 100) {
      improvements.push({
        id: 'add-key-management-tests',
        priority: 'critical',
        type: 'add-test',
        title: '暗号鍵管理テストの追加',
        description: '暗号鍵の安全な生成・保存・ローテーションをテストしてください',
        location: { file: '', line: 0, column: 0 },
        impact: 30,
        automatable: false,
        suggestions: [
          '鍵の安全な生成テスト',
          '鍵の暗号化保存テスト',
          '鍵のローテーションテスト',
          'ハードコードされた鍵の検出テスト'
        ]
      });
    }

    // パスワードハッシュテストが不足している場合
    if (!evaluation.details?.boundaryCoverage || evaluation.details.boundaryCoverage < 100) {
      improvements.push({
        id: 'add-password-hashing-tests',
        priority: 'critical',
        type: 'add-test',
        title: 'パスワードハッシュテストの追加',
        description: '安全なパスワードハッシュアルゴリズムの使用を検証してください',
        location: { file: '', line: 0, column: 0 },
        impact: 25,
        automatable: false,
        codeExample: `
it('should hash passwords with bcrypt or argon2', async () => {
  const password = 'userPassword123';
  
  // bcryptの例
  const bcryptHash = await bcrypt.hash(password, 12);
  expect(bcryptHash).toMatch(/^\\$2[ayb]\\$.{56}$/);
  
  // argon2の例
  const argon2Hash = await argon2.hash(password);
  expect(argon2Hash).toMatch(/^\\$argon2id\\$/);
  
  // 弱いハッシュの拒否
  expect(() => md5(password)).toThrow();
});`
      });
    }

    // TLSテストが不足している場合
    if (!evaluation.dimensions?.security || evaluation.dimensions.security < 80) {
      improvements.push({
        id: 'add-tls-tests',
        priority: 'high',
        type: 'add-test',
        title: 'TLS/HTTPS設定テストの追加',
        description: '安全な通信設定を検証するテストを追加してください',
        location: { file: '', line: 0, column: 0 },
        impact: 20,
        automatable: false
      });
    }

    // 弱い暗号アルゴリズムが検出された場合
    if (evaluation.details?.weaknesses && evaluation.details.weaknesses.length > 0) {
      improvements.push({
        id: 'replace-weak-algorithms',
        priority: 'critical',
        type: 'refactor',
        title: '弱い暗号アルゴリズムの置換',
        description: `${evaluation.details.weaknesses.length}個の弱い暗号アルゴリズムが検出されました。安全なアルゴリズムに置換してください`,
        location: { file: '', line: 0, column: 0 },
        impact: 35,
        automatable: true
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
      // ハードコードされた暗号鍵
      if (/['\"]([A-Za-z0-9+\/]{32,}|[A-Fa-f0-9]{32,})['\"]/.test(line) && 
          !line.includes('test') && !line.includes('example')) {
        issues.push({
          id: `hardcoded-key-${index}`,
          severity: 'critical',
          type: 'insufficient-validation',
          message: 'ハードコードされた暗号鍵の可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // 弱い暗号アルゴリズムの使用
      this.weakAlgorithms.forEach(weak => {
        if (line.toLowerCase().includes(weak) && !line.includes('should not') && !line.includes('reject')) {
          issues.push({
            id: `weak-algo-${weak}-${index}`,
            severity: 'critical',
            type: 'insufficient-validation',
            message: `弱い暗号アルゴリズム（${weak}）が使用されています`,
            location: { 
              file: '', 
              line: index + 1, 
              column: 0 
            }
          });
        }
      });

      // HTTPでの機密データ送信
      if (line.includes('http://') && 
          (line.includes('password') || line.includes('token') || line.includes('secret'))) {
        issues.push({
          id: `cleartext-transmission-${index}`,
          severity: 'critical',
          type: 'insufficient-validation',
          message: '機密データが平文で送信される可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // Math.randomの使用
      if (line.includes('Math.random') && 
          (line.includes('token') || line.includes('id') || line.includes('key'))) {
        issues.push({
          id: `insecure-random-${index}`,
          severity: 'critical',
          type: 'insufficient-validation',
          message: '暗号学的に安全でない乱数生成器が使用されています',
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

    // 基本的な暗号化テスト
    tests.push('強力な暗号アルゴリズム（AES-256等）の使用テスト');
    tests.push('暗号鍵の安全な生成・管理テスト');
    tests.push('パスワードの安全なハッシュ化テスト');
    
    // bcrypt使用時のテスト
    if (hasDependencyPattern(context, ['bcrypt'])) {
      tests.push('bcryptのコストファクター検証テスト');
      tests.push('bcryptのソルト生成テスト');
    }

    // JWT使用時のテスト
    if (hasDependencyPattern(context, ['jsonwebtoken'])) {
      tests.push('JWT署名アルゴリズムの検証テスト');
      tests.push('JWT秘密鍵の安全な管理テスト');
    }

    // HTTPS/TLS関連
    tests.push('HTTPS強制の検証テスト');
    tests.push('TLS設定の安全性テスト');
    tests.push('証明書検証テスト');

    // データ保護
    tests.push('保存データの暗号化テスト');
    tests.push('転送中データの暗号化テスト');
    tests.push('機密データのメモリクリアテスト');

    return tests;
  }

  /**
   * エンタープライズ要件の検証
   */
  validateEnterpriseRequirements(testFile: TestFile): boolean {
    const content = testFile.content;
    
    // エンタープライズレベルの暗号化要件
    const requirements = [
      /fips.*140|fips.*complian/i,           // FIPS 140準拠
      /key.*management.*system|kms/i,        // 鍵管理システム
      /hsm|hardware.*security/i,             // ハードウェアセキュリティモジュール
      /encrypt.*at.*rest.*and.*in.*transit/i, // 包括的暗号化
      /key.*rotation|rotate.*key/i,          // 鍵ローテーション
      /data.*classification/i,               // データ分類
      /crypto.*audit|encryption.*log/i       // 暗号化監査
    ];

    return requirements.filter(req => req.test(content)).length >= 3;
  }

  // プライベートメソッド

  /**
   * 不足しているテストの検出
   */
  private detectMissingTests(content: string): DetectionResult[] {
    const patterns: DetectionResult[] = [];
    const foundTests = this.cryptoPatterns.filter(pattern => 
      pattern.pattern.test(content)
    ).map(p => p.name);

    const criticalMissing = [
      'encryption-algorithm',
      'key-management',
      'password-hashing'
    ];

    criticalMissing.forEach(test => {
      if (!foundTests.includes(test)) {
        patterns.push({
          patternId: `missing-crypto-${test}`,
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
            description: `重要な暗号化テスト（${test}）が実装されていません`,
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
      recommendations.push('暗号化テストのカバレッジが非常に低いです。OWASP推奨の暗号化テストスイートを実装してください');
    }

    if (missingTests.includes('strong-encryption-test')) {
      recommendations.push('強力な暗号アルゴリズム（AES-256-GCM等）の使用を検証するテストを追加してください');
    }

    if (missingTests.includes('password-hashing-test')) {
      recommendations.push('パスワードハッシュにbcrypt、argon2、またはscryptを使用し、適切なコストファクターを設定してください');
    }

    if (issues.some(i => i.message.includes('弱い暗号アルゴリズム'))) {
      recommendations.push('弱い暗号アルゴリズム（MD5、SHA1、DES等）を最新の安全なアルゴリズムに置換してください');
    }

    if (issues.some(i => i.message.includes('ハードコード'))) {
      recommendations.push('暗号鍵をハードコードせず、環境変数や鍵管理システムを使用してください');
    }

    recommendations.push('定期的な暗号化設定の監査と、暗号アルゴリズムの最新動向の把握を推奨します');

    return recommendations;
  }
}