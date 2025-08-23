/**
 * OWASP A01:2021 - Broken Access Control
 * TDD実装
 */

import { ProjectContext, TestFile, DetectionResult, QualityScore, Improvement } from '../../../core/types';
import { SecurityIssue } from '../../../security/types/security';
import { OWASPCategory, OWASPTestResult } from './IOWASPSecurityPlugin';

export class BrokenAccessControlPlugin {
  readonly id = 'owasp-a01-broken-access-control';
  readonly name = 'OWASP A01: Broken Access Control';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = 'A01:2021';
  readonly cweIds = ['CWE-22', 'CWE-284', 'CWE-285'];

  isApplicable(context: ProjectContext): boolean {
    const authLibraries = ['passport', 'jsonwebtoken'];
    const deps = context.dependencies;
    
    if (!deps) return false;
    
    if (Array.isArray(deps)) {
      return authLibraries.some(lib => (deps as string[]).includes(lib));
    } else if (typeof deps === 'object') {
      return authLibraries.some(lib => lib in deps);
    }
    
    return false;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    const content = testFile.content.toLowerCase();
    
    // アクセス制御関連のキーワード
    const accessControlKeywords = [
      'authorization',
      'authenticate',
      'admin',
      'role',
      'permission',
      'access',
      'deny',
      'token',
      '401',
      '403'
    ];
    
    // キーワードに基づく検出
    let hasAccessControlTest = false;
    for (const keyword of accessControlKeywords) {
      if (content.includes(keyword)) {
        hasAccessControlTest = true;
        break;
      }
    }
    
    if (hasAccessControlTest) {
      results.push({
        patternId: 'access-control-test',
        confidence: 0.8
      });
    }
    
    return results;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    if (patterns.length === 0) {
      return {
        overall: 30,
        security: 30,
        confidence: 0.8,
        dimensions: {
          security: 30,
          completeness: 20
        },
        details: {
          strengths: [],
          weaknesses: ['アクセス制御テストが検出されませんでした'],
          suggestions: ['認証・認可に関するテストを追加してください']
        }
      };
    }
    
    // アクセス制御テストが存在する場合
    const hasAccessControlTests = patterns.some(p => 
      p.patternId === 'access-control-test'
    );
    
    if (hasAccessControlTests) {
      return {
        overall: 80,
        security: 80,
        confidence: 0.9,
        dimensions: {
          security: 80,
          completeness: 75
        },
        details: {
          strengths: ['アクセス制御テストが適切に実装されています'],
          weaknesses: [],
          suggestions: ['さらなるセキュリティテストの強化を検討してください']
        }
      };
    }
    
    return {
      overall: 50,
      security: 50,
      confidence: 0.7,
      dimensions: {
        security: 50,
        completeness: 45
      },
      details: {
        strengths: ['基本的なテストは存在します'],
        weaknesses: ['アクセス制御の検証が不十分です'],
        suggestions: ['より詳細な認証・認可テストを追加してください']
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    if (evaluation.overall < 50) {
      // 低スコアの場合、基本的なアクセス制御テストの実装を提案
      improvements.push({
        id: 'add-access-control-tests',
        priority: 'high',
        type: 'add-test',
        title: 'アクセス制御テストの実装',
        description: '認証・認可に関するテストが不足しています。401/403エラーのテスト、ロールベースアクセス制御のテストを追加してください。',
        location: {
          file: 'test/',
          line: 1,
          column: 1
        },
        impact: 50,
        automatable: true
      });
    } else {
      // 高スコアの場合、より高度なテストを提案
      improvements.push({
        id: 'enhance-access-control-tests',
        priority: 'medium',
        type: 'add-test',
        title: 'アクセス制御テストの強化',
        description: 'より詳細な権限境界テストやセッション管理テストの追加を検討してください。',
        location: {
          file: 'test/',
          line: 1,
          column: 1
        },
        impact: 20,
        automatable: true
      });
    }
    
    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const content = testFile.content.toLowerCase();
    const testPatterns: string[] = [];
    const missingTests: string[] = [];
    const recommendations: string[] = [];
    const issues: SecurityIssue[] = [];
    
    // 必要なテストパターン
    const requiredPatterns = [
      { pattern: '401', name: '認証エラーテスト' },
      { pattern: '403', name: '認可エラーテスト' },
      { pattern: 'authorization', name: '認可テスト' },
      { pattern: 'role', name: 'ロールベースアクセス制御テスト' },
      { pattern: 'permission', name: 'パーミッションテスト' },
      { pattern: 'token', name: 'トークン検証テスト' }
    ];
    
    // 検出されたパターンを記録
    let detectedCount = 0;
    for (const req of requiredPatterns) {
      if (content.includes(req.pattern)) {
        testPatterns.push(req.name);
        detectedCount++;
      } else {
        missingTests.push(req.name);
      }
    }
    
    // カバレッジ計算
    const coverage = Math.round((detectedCount / requiredPatterns.length) * 100);
    
    // 推奨事項の生成
    if (coverage < 50) {
      recommendations.push('基本的なアクセス制御テストが不足しています');
      recommendations.push('401/403エラーのテストケースを追加してください');
      recommendations.push('ロールベースアクセス制御のテストを実装してください');
    } else if (coverage < 80) {
      recommendations.push('より包括的なアクセス制御テストを検討してください');
      recommendations.push('エッジケースや境界値のテストを追加してください');
    }
    
    // セキュリティ問題の検出
    if (!content.includes('401') && !content.includes('403')) {
      issues.push({
        id: 'missing-auth-error-tests',
        type: 'missing-auth-test',
        severity: 'critical',
        message: '認証・認可エラーのテストが見つかりません',
        location: {
          file: testFile.path,
          line: 1,
          column: 1
        }
      });
    }
    
    return {
      category: OWASPCategory.A01_BROKEN_ACCESS_CONTROL,
      coverage,
      issues,
      recommendations,
      testPatterns,
      missingTests
    };
  }

  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');
    
    // パストラバーサルパターンの検出
    const pathTraversalPatterns = [
      /sendFile\s*\(/i, // sendFileの使用を検出
      /readFile\s*\(/i, // readFileの使用を検出
      /\.\.\/|\.\.\\/, // ディレクトリトラバーサル
      /path\.join\s*\(/i // path.joinの使用を検出
    ];
    
    // ユーザー入力を示すパターン
    const userInputPatterns = [
      /req\.(query|params|body)/i,
      /req\.query\./i,
      /req\.params\./i
    ];
    
    // 認証チェックなしのパターン
    const adminPatterns = [
      /\/admin\//i,
      /\/api\/admin/i,
      /\/manage/i
    ];
    
    lines.forEach((line, index) => {
      // パストラバーサルチェック
      let hasFileOperation = false;
      for (const pattern of pathTraversalPatterns) {
        if (pattern.test(line)) {
          hasFileOperation = true;
          break;
        }
      }
      
      if (hasFileOperation) {
        // 近くの行でユーザー入力を使用しているかチェック
        const contextStart = Math.max(0, index - 3);
        const contextEnd = Math.min(lines.length - 1, index + 3);
        let hasUserInput = false;
        
        for (let i = contextStart; i <= contextEnd; i++) {
          for (const inputPattern of userInputPatterns) {
            if (inputPattern.test(lines[i])) {
              hasUserInput = true;
              break;
            }
          }
          if (hasUserInput) break;
        }
        
        if (hasUserInput) {
          issues.push({
            id: `path-traversal-${index}`,
            type: 'insufficient-validation',
            severity: 'critical',
            message: 'パストラバーサルの脆弱性が検出されました。ユーザー入力を直接ファイルパスに使用しています。',
            location: {
              file: 'unknown',
              line: index + 1,
              column: 1
            }
          });
        }
      }
      
      // 認証なしアクセスチェック
      let hasAdminRoute = false;
      for (const pattern of adminPatterns) {
        if (pattern.test(line)) {
          hasAdminRoute = true;
          break;
        }
      }
      
      if (hasAdminRoute) {
        // 前後の行で認証チェックがあるか確認
        const contextStart = Math.max(0, index - 5);
        const contextEnd = Math.min(lines.length - 1, index + 5);
        let hasAuthCheck = false;
        
        for (let i = contextStart; i <= contextEnd; i++) {
          if (/auth|authenticate|isAuthenticated|requireAuth|checkAuth/i.test(lines[i])) {
            hasAuthCheck = true;
            break;
          }
        }
        
        if (!hasAuthCheck) {
          issues.push({
            id: `missing-auth-${index}`,
            type: 'missing-auth-test',
            severity: 'critical',
            message: '認証チェックなしで管理者機能にアクセスしている可能性があります。',
            location: {
              file: 'unknown',
              line: index + 1,
              column: 1
            }
          });
        }
      }
    });
    
    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];
    const deps = context.dependencies;
    const hasExpress = Array.isArray(deps) ? deps.includes('express') : (deps && typeof deps === 'object' && 'express' in deps);
    const hasPassport = Array.isArray(deps) ? deps.includes('passport') : (deps && typeof deps === 'object' && 'passport' in deps);
    const hasJWT = Array.isArray(deps) ? deps.includes('jsonwebtoken') : (deps && typeof deps === 'object' && 'jsonwebtoken' in deps);
    
    // 基本的な認証テスト
    tests.push(`
describe('Access Control - Authentication', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);
    
    expect(response.body).toHaveProperty('error');
  });
});`);
    
    // 認可テスト
    tests.push(`
describe('Access Control - Authorization', () => {
  it('should return 403 for unauthorized access', async () => {
    const userToken = 'valid-user-token';
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', \`Bearer \${userToken}\`)
      .expect(403);
    
    expect(response.body).toHaveProperty('error', 'Forbidden');
  });
});`);
    
    // JWTベースのテスト
    if (hasJWT) {
      tests.push(`
describe('JWT Token Validation', () => {
  it('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
  
  it('should validate token expiration', async () => {
    const expiredToken = generateExpiredToken();
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', \`Bearer \${expiredToken}\`)
      .expect(401);
  });
});`);
    }
    
    // Passportベースのテスト
    if (hasPassport) {
      tests.push(`
describe('Passport Authentication', () => {
  it('should authenticate with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' })
      .expect(200);
    
    expect(response.body).toHaveProperty('token');
  });
  
  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'wrongpass' })
      .expect(401);
  });
});`);
    }
    
    // ロールベースアクセス制御
    tests.push(`
describe('Role-Based Access Control', () => {
  it('should enforce role-based permissions', async () => {
    const userToken = generateUserToken({ role: 'user' });
    const response = await request(app)
      .delete('/api/users/123')
      .set('Authorization', \`Bearer \${userToken}\`)
      .expect(403);
  });
  
  it('should allow admin access to protected resources', async () => {
    const adminToken = generateUserToken({ role: 'admin' });
    const response = await request(app)
      .delete('/api/users/123')
      .set('Authorization', \`Bearer \${adminToken}\`)
      .expect(200);
  });
});`);
    
    // パストラバーサル防止
    tests.push(`
describe('Path Traversal Prevention', () => {
  it('should prevent directory traversal attacks', async () => {
    const response = await request(app)
      .get('/api/files?path=../../../etc/passwd')
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Invalid path');
  });
});`);
    
    return tests;
  }
}