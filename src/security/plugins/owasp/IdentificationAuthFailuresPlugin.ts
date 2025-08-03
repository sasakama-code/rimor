/**
 * OWASP A07:2021 - Identification and Authentication Failures
 * 認証・認可の失敗に関するセキュリティテスト品質監査プラグイン
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
 * A07: Identification and Authentication Failures プラグイン
 */
export class IdentificationAuthFailuresPlugin extends OWASPBasePlugin {
  readonly id = 'owasp-a07-identification-auth-failures';
  readonly name = 'OWASP A07: Identification and Authentication Failures';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A07_IDENTIFICATION_AUTH_FAILURES;
  readonly cweIds = ['CWE-287', 'CWE-297', 'CWE-384'];

  isApplicable(context: ProjectContext): boolean {
    // 認証関連ライブラリの確認
    const authLibraries = [
      'passport', 'jsonwebtoken', 'express-session', 'bcrypt', 'argon2',
      'oauth2-server', 'auth0', '@auth0/nextjs-auth0', 'next-auth',
      'firebase-auth', '@aws-amplify/auth'
    ];
    
    const hasAuthLibrary = context.dependencies?.some(dep =>
      authLibraries.some(lib => dep.includes(lib))
    ) || false;

    // 認証関連ファイルの確認
    const hasAuthFiles = context.filePatterns?.source?.some((pattern: string) =>
      pattern.includes('auth') || pattern.includes('login') || 
      pattern.includes('session') || pattern.includes('password')
    ) || false;

    return hasAuthLibrary || hasAuthFiles;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const lines = testFile.content.split('\n');

    // パスワード強度テストパターン
    const passwordStrengthPattern = /password.*strength|strong.*password|weak.*password|validatePassword/i;
    const bruteForcePattern = /brute.*force|rate.*limit|lockout|attempt.*limit/i;
    const mfaPattern = /multi.*factor|two.*factor|2fa|mfa|totp|authenticator/i;
    const sessionPattern = /session.*timeout|session.*expire|session.*hijack/i;

    lines.forEach((line, index) => {
      // パスワード強度テストの検出
      if (passwordStrengthPattern.test(line)) {
        patterns.push({
          patternId: 'auth-password-strength',
          pattern: 'password-strength',
          confidence: 0.85,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'high',
          metadata: { hasTest: true, testType: 'password-strength' }
        });
      }

      // ブルートフォース対策テストの検出
      if (bruteForcePattern.test(line)) {
        patterns.push({
          patternId: 'auth-brute-force',
          pattern: 'brute-force-protection',
          confidence: 0.9,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'critical',
          metadata: { hasTest: true, testType: 'brute-force' }
        });
      }

      // MFAテストの検出
      if (mfaPattern.test(line)) {
        patterns.push({
          patternId: 'auth-mfa',
          pattern: 'multi-factor-authentication',
          confidence: 0.9,
          location: { file: testFile.path, line: index + 1, column: 0 },
          severity: 'medium',
          metadata: { hasTest: true, testType: 'mfa' }
        });
      }
    });

    // 不足テストの検出
    const hasPasswordTest = patterns.some(p => 
      p.metadata?.testType === 'password-strength'
    );
    const hasBruteForceTest = patterns.some(p => 
      p.metadata?.testType === 'brute-force'
    );

    if (!hasPasswordTest) {
      patterns.push({
        patternId: 'missing-auth-password-strength',
        pattern: 'missing-password-strength-test',
        confidence: 1,
        severity: 'critical',
        metadata: { hasTest: false }
      });
    }

    if (!hasBruteForceTest) {
      patterns.push({
        patternId: 'missing-auth-brute-force',
        pattern: 'missing-brute-force-test',
        confidence: 1,
        severity: 'critical',
        metadata: { hasTest: false }
      });
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const authTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('auth-') && p.metadata?.hasTest
    );

    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-auth-')
    );

    // カバレッジ計算
    const requiredTests = ['password-strength', 'brute-force', 'mfa', 'session-management'];
    const testCoverage = (authTests.length / requiredTests.length) * 100;

    // セキュリティスコア計算
    const baseScore = OWASPUtils.calculateSecurityScore(
      testCoverage,
      missingTests.length
    );

    const hasPasswordTest = authTests.some(p => 
      p.metadata?.testType === 'password-strength'
    );
    const hasBruteForceTest = authTests.some(p => 
      p.metadata?.testType === 'brute-force'
    );
    const hasMfaTest = authTests.some(p => 
      p.metadata?.testType === 'mfa'
    );

    const coverageScore = testCoverage / 100;
    const securityScore = (hasPasswordTest ? 0.4 : 0) + 
                         (hasBruteForceTest ? 0.4 : 0) + 
                         (hasMfaTest ? 0.2 : 0);

    return {
      overall: baseScore,
      security: securityScore,
      coverage: testCoverage,
      confidence: 0.85,
      details: {
        testCoverage,
        passwordTestImplemented: hasPasswordTest,
        bruteForceProtection: hasBruteForceTest,
        mfaImplemented: hasMfaTest,
        missingTestsCount: missingTests.length
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    if (!evaluation.details?.passwordTestImplemented) {
      improvements.push({
        id: 'add-password-strength-tests',
        priority: 'critical',
        type: 'add-test',
        title: 'パスワード強度テストの追加',
        description: 'パスワードの複雑性要件（長さ、大小文字、数字、特殊文字）を検証するテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { 
          scoreImprovement: 30, 
          effortMinutes: 30 
        },
        automatable: true
      });
    }

    if (!evaluation.details?.bruteForceProtection) {
      improvements.push({
        id: 'add-brute-force-tests',
        priority: 'critical',
        type: 'add-test',
        title: 'ブルートフォース対策テストの追加',
        description: 'ログイン試行回数制限、アカウントロックアウト、レート制限のテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { 
          scoreImprovement: 30, 
          effortMinutes: 45 
        },
        automatable: true
      });
    }

    if (!evaluation.details?.mfaImplemented) {
      improvements.push({
        id: 'add-mfa-tests',
        priority: 'high',
        type: 'add-test',
        title: '多要素認証テストの追加',
        description: 'TOTP、SMS、バックアップコードなどのMFA機能のテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { 
          scoreImprovement: 20, 
          effortMinutes: 60 
        },
        automatable: true
      });
    }

    if (evaluation.overall < 0.5) {
      improvements.push({
        id: 'add-session-management-tests',
        priority: 'high',
        type: 'add-test',
        title: 'セッション管理テストの追加',
        description: 'セッションタイムアウト、セッション固定攻撃対策、セキュアなセッション生成のテストを実装してください',
        location: { file: '', line: 0, column: 0 },
        estimatedImpact: { 
          scoreImprovement: 25, 
          effortMinutes: 40 
        },
        automatable: true
      });
    }

    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const patterns = await this.detectPatterns(testFile);
    const evaluation = this.evaluateQuality(patterns);
    const vulnerabilities = this.detectVulnerabilityPatterns(testFile.content);
    
    const authTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('auth-') && p.metadata?.hasTest
    );
    
    const missingTests = patterns.filter(p => 
      p.patternId && p.patternId.startsWith('missing-auth-')
    );

    const testPatterns: string[] = [];
    const recommendations: string[] = [];

    // 検出されたテストパターン
    if (authTests.some(p => p.metadata?.testType === 'password-strength')) {
      testPatterns.push('パスワード強度検証テスト');
    }
    if (authTests.some(p => p.metadata?.testType === 'brute-force')) {
      testPatterns.push('ブルートフォース対策テスト');
    }
    if (authTests.some(p => p.metadata?.testType === 'mfa')) {
      testPatterns.push('多要素認証テスト');
    }

    // 推奨事項
    if (!authTests.some(p => p.metadata?.testType === 'password-strength')) {
      recommendations.push('パスワード強度検証テストを追加してください');
    }
    if (!authTests.some(p => p.metadata?.testType === 'brute-force')) {
      recommendations.push('ブルートフォース攻撃対策テストを追加してください');
    }
    if (!authTests.some(p => p.metadata?.testType === 'session-management')) {
      recommendations.push('セッション管理テストを追加してください');
    }

    const missingTestDescriptions = missingTests.map(p => {
      switch(p.patternId) {
        case 'missing-auth-password-strength':
          return 'パスワード強度検証テスト';
        case 'missing-auth-brute-force':
          return 'ブルートフォース対策テスト';
        default:
          return '認証関連テスト';
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

    // 弱いパスワードパターン
    const weakPasswords = ['123456', 'password', 'admin', 'qwerty', '12345678', 'abc123'];
    const hardcodedPasswordPattern = /password\s*[=:]\s*['"`]([^'"`]+)['"`]/i;

    lines.forEach((line, index) => {
      // ハードコードされたパスワード
      const passwordMatch = line.match(hardcodedPasswordPattern);
      if (passwordMatch) {
        const password = passwordMatch[1];
        if (weakPasswords.includes(password.toLowerCase()) || password.length < 8) {
          issues.push({
            id: `weak-password-${index}`,
            severity: 'critical',
            type: 'insufficient-validation',
            message: '弱いパスワードがハードコードされています',
            location: { 
              file: '', 
              line: index + 1, 
              column: 0 
            }
          });
        }
      }

      // 平文パスワード比較
      if ((line.includes('===') || line.includes('==')) && 
          line.includes('password') && !line.includes('hash')) {
        issues.push({
          id: `plaintext-password-${index}`,
          severity: 'critical',
          type: 'insufficient-validation',
          message: 'パスワードが平文で比較されている可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // 認証バイパスの可能性
      if (line.includes('return true') && 
          (line.includes('authenticate') || line.includes('auth') || line.includes('login'))) {
        issues.push({
          id: `auth-bypass-${index}`,
          severity: 'warning',
          type: 'insufficient-validation',
          message: '認証バイパスの可能性があります',
          location: { 
            file: '', 
            line: index + 1, 
            column: 0 
          }
        });
      }

      // セッション固定攻撃の可能性
      if (line.includes('session') && line.includes('request') && !line.includes('regenerate')) {
        issues.push({
          id: `session-fixation-${index}`,
          severity: 'warning',
          type: 'insufficient-validation',
          message: 'セッション固定攻撃の脆弱性がある可能性があります',
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

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];

    // パスワード強度テスト
    tests.push('パスワード強度検証テスト');
    tests.push('最小文字数（8文字以上）の確認');
    tests.push('大文字・小文字・数字・特殊文字の組み合わせ確認');
    tests.push('一般的な弱いパスワードのブラックリスト確認');

    // ブルートフォース対策テスト
    tests.push('ログイン試行回数制限テスト');
    tests.push('アカウントロックアウト機能テスト');
    tests.push('レート制限（Rate Limiting）テスト');
    tests.push('CAPTCHA実装テスト');

    // 多要素認証テスト
    tests.push('TOTP（Time-based One-Time Password）実装テスト');
    tests.push('SMS認証テスト');
    tests.push('バックアップコード機能テスト');
    tests.push('MFAバイパス防止テスト');

    // セッション管理テスト
    tests.push('セッションタイムアウトテスト');
    tests.push('セッション固定攻撃対策テスト');
    tests.push('セッション再生成テスト');
    tests.push('並行セッション管理テスト');

    // パスワードリセットテスト
    tests.push('安全なパスワードリセットトークン生成テスト');
    tests.push('トークン有効期限テスト');
    tests.push('パスワードリセット通知テスト');

    // 認証バイパステスト
    tests.push('認証なしでのリソースアクセス防止テスト');
    tests.push('権限昇格防止テスト');
    tests.push('JWT検証テスト');

    // フレームワーク固有のテスト
    if (context.dependencies?.includes('passport')) {
      tests.push('Passport.js認証ミドルウェアテスト');
      tests.push('Passport戦略（Strategy）実装テスト');
    }

    if (context.dependencies?.includes('jsonwebtoken')) {
      tests.push('JWT署名検証テスト');
      tests.push('JWT有効期限テスト');
      tests.push('JWTリフレッシュトークンテスト');
    }

    if (context.dependencies?.includes('bcrypt')) {
      tests.push('bcryptハッシュ強度テスト');
      tests.push('パスワードハッシュ比較テスト');
    }

    return tests;
  }
}