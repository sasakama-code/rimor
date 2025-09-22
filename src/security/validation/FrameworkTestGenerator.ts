/**
 * フレームワーク別テストケース生成システム
 * Express.js、React、NestJS向けの実世界セキュリティテストケース自動生成
 */

import { TestCase } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * テストケーステンプレート
 */
export interface TestTemplate {
  /** テンプレート名 */
  name: string;
  /** フレームワーク */
  framework: 'express' | 'react' | 'nestjs' | 'nextjs' | 'fastify';
  /** カテゴリ */
  category:
    | 'authentication'
    | 'input-validation'
    | 'authorization'
    | 'data-protection'
    | 'api-security';
  /** セキュリティパターン */
  securityPattern: string;
  /** テストコードテンプレート */
  template: string;
  /** 期待される検出パターン */
  expectedFindings: string[];
  /** 複雑度 */
  complexity: 'basic' | 'intermediate' | 'advanced';
}

/**
 * 生成設定
 */
export interface GenerationConfig {
  /** 出力ディレクトリ */
  outputDir: string;
  /** 生成するテスト数 */
  testCount: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  /** フレームワーク設定 */
  frameworkConfig: {
    [key: string]: {
      version: string;
      dependencies: string[];
      testFramework: 'jest' | 'mocha' | 'vitest';
    };
  };
}

/**
 * フレームワーク別テストケース生成システム
 */
export class FrameworkTestGenerator {
  private templates: Map<string, TestTemplate[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * 全フレームワーク用テストケース生成
   */
  async generateAllFrameworkTests(config: GenerationConfig): Promise<Map<string, TestCase[]>> {
    const enableLogs = !process.env.DISABLE_SECURITY_VALIDATION_LOGS;

    if (enableLogs) {
      console.log('🏗️  フレームワーク別テストケース生成開始');
      console.log('対象: Express.js, React, NestJS');
      console.log('');
    }

    const results = new Map<string, TestCase[]>();

    // Express.js用テストケース生成
    const expressTests = await this.generateExpressTests(config);
    results.set('express', expressTests);
    if (enableLogs) {
      console.log(`✅ Express.js: ${expressTests.length}件のテストケース生成`);
    }

    // React用テストケース生成
    const reactTests = await this.generateReactTests(config);
    results.set('react', reactTests);
    if (enableLogs) {
      console.log(`✅ React: ${reactTests.length}件のテストケース生成`);
    }

    // NestJS用テストケース生成
    const nestjsTests = await this.generateNestJSTests(config);
    results.set('nestjs', nestjsTests);
    if (enableLogs) {
      console.log(`✅ NestJS: ${nestjsTests.length}件のテストケース生成`);
    }

    // 生成結果の保存
    await this.saveGeneratedTests(results, config.outputDir);

    if (enableLogs) {
      console.log('');
      console.log(`📁 全テストケースを ${config.outputDir} に保存しました`);
    }

    return results;
  }

  /**
   * Express.js用テストケース生成
   */
  async generateExpressTests(config: GenerationConfig): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    const templates = this.templates.get('express') || [];

    // 認証テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'authentication'),
        config.testCount
      )
    );

    // 入力検証テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'input-validation'),
        config.testCount
      )
    );

    // API セキュリティテスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'api-security'),
        config.testCount
      )
    );

    return tests;
  }

  /**
   * React用テストケース生成
   */
  async generateReactTests(config: GenerationConfig): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    const templates = this.templates.get('react') || [];

    // XSS対策テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'input-validation'),
        config.testCount
      )
    );

    // 認証状態テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'authentication'),
        config.testCount
      )
    );

    // データ保護テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'data-protection'),
        config.testCount
      )
    );

    return tests;
  }

  /**
   * NestJS用テストケース生成
   */
  async generateNestJSTests(config: GenerationConfig): Promise<TestCase[]> {
    const tests: TestCase[] = [];
    const templates = this.templates.get('nestjs') || [];

    // ガード/インターセプターテスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'authorization'),
        config.testCount
      )
    );

    // DTO検証テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'input-validation'),
        config.testCount
      )
    );

    // JWT認証テスト
    tests.push(
      ...this.generateFromTemplate(
        templates.filter(t => t.category === 'authentication'),
        config.testCount
      )
    );

    return tests;
  }

  /**
   * テンプレートからテストケース生成
   */
  private generateFromTemplate(
    templates: TestTemplate[],
    testCount: GenerationConfig['testCount']
  ): TestCase[] {
    const tests: TestCase[] = [];

    templates.forEach(template => {
      const count = testCount[template.complexity] || 1;

      for (let i = 0; i < count; i++) {
        const testName = `${template.name}_${template.complexity}_${i + 1}`;
        const content = this.generateTestContent(template, i);

        tests.push({
          name: testName,
          file: `${testName}.test.ts`,
          content,
          metadata: {
            framework: template.framework,
            language: 'typescript',
            lastModified: new Date(),
          },
        });
      }
    });

    return tests;
  }

  /**
   * テスト内容の生成
   */
  private generateTestContent(template: TestTemplate, variation: number): string {
    let content = template.template;

    // 変数の置換
    content = content.replace(/\{\{TEST_INDEX\}\}/g, variation.toString());
    content = content.replace(/\{\{RANDOM_VALUE\}\}/g, Math.random().toString(36).substring(7));
    content = content.replace(/\{\{TIMESTAMP\}\}/g, Date.now().toString());

    return content;
  }

  /**
   * テンプレートの初期化
   */
  private initializeTemplates(): void {
    // Express.js テンプレート
    this.templates.set('express', [
      {
        name: 'express_auth_jwt_test',
        framework: 'express',
        category: 'authentication',
        securityPattern: 'jwt-authentication',
        complexity: 'intermediate',
        expectedFindings: ['missing-auth-test', 'unsafe-taint-flow'],
        template: `
describe('JWT Authentication Security Tests', () => {
  let app: Express;
  let server: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    server = app.listen(3001);
  });

  afterEach(() => {
    server.close();
  });

  it('should validate JWT token properly - Test {{TEST_INDEX}}', async () => {
    const validToken = jwt.sign(
      { userId: 'test-{{RANDOM_VALUE}}', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/protected')
      .set('Authorization', \`Bearer \${validToken}\`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.userId).toBe('test-{{RANDOM_VALUE}}');
  });

  it('should reject invalid JWT token - Test {{TEST_INDEX}}', async () => {
    const invalidToken = 'invalid.jwt.token{{RANDOM_VALUE}}';

    await request(app)
      .get('/protected')
      .set('Authorization', \`Bearer \${invalidToken}\`)
      .expect(401);
  });

  it('should handle JWT expiration - Test {{TEST_INDEX}}', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-{{RANDOM_VALUE}}' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    await request(app)
      .get('/protected')
      .set('Authorization', \`Bearer \${expiredToken}\`)
      .expect(401);
  });

  it('should sanitize JWT payload data - Test {{TEST_INDEX}}', async () => {
    const maliciousPayload = {
      userId: '<script>alert("xss")</script>',
      role: 'admin"; DROP TABLE users; --'
    };

    const token = jwt.sign(maliciousPayload, process.env.JWT_SECRET || 'test-secret');
    
    // JWT検証後、ペイロードが適切にサニタイズされているかテスト
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
    const sanitized = sanitizeJWTPayload(decoded);
    
    expect(sanitized.userId).not.toContain('<script>');
    expect(sanitized.role).not.toContain('DROP TABLE');
  });
});`,
      },
      {
        name: 'express_input_validation_test',
        framework: 'express',
        category: 'input-validation',
        securityPattern: 'input-sanitization',
        complexity: 'basic',
        expectedFindings: ['missing-sanitizer', 'unsafe-taint-flow'],
        template: `
describe('Input Validation Security Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    app.post('/api/users', (req, res) => {
      const { username, email, bio } = req.body;
      
      // 入力検証とサニタイズのテスト対象
      const sanitizedUsername = sanitize(username);
      const validatedEmail = validateEmail(email);
      const cleanBio = escapeHtml(bio);
      
      res.json({ 
        username: sanitizedUsername, 
        email: validatedEmail, 
        bio: cleanBio 
      });
    });
  });

  it('should sanitize malicious input - Test {{TEST_INDEX}}', async () => {
    const maliciousInput = {
      username: '<script>alert("xss{{RANDOM_VALUE}}")</script>',
      email: 'test@example.com',
      bio: '{{RANDOM_VALUE}}<img src=x onerror=alert("xss")>'
    };

    const response = await request(app)
      .post('/api/users')
      .send(maliciousInput)
      .expect(200);

    expect(response.body.username).not.toContain('<script>');
    expect(response.body.bio).not.toContain('onerror=');
  });

  it('should validate email format - Test {{TEST_INDEX}}', async () => {
    const invalidEmails = [
      'invalid-email{{RANDOM_VALUE}}',
      'test@',
      '@example.com',
      'test..test@example.com'
    ];

    for (const email of invalidEmails) {
      await request(app)
        .post('/api/users')
        .send({ username: 'test', email, bio: 'test' })
        .expect(400);
    }
  });

  it('should prevent SQL injection in database queries - Test {{TEST_INDEX}}', async () => {
    const sqlInjectionPayload = {
      username: "admin'; DROP TABLE users; --",
      email: 'test{{RANDOM_VALUE}}@example.com',
      bio: '1; DELETE FROM profiles WHERE 1=1; --'
    };

    const response = await request(app)
      .post('/api/users')
      .send(sqlInjectionPayload)
      .expect(200);

    // サニタイズ後のデータが SQL インジェクションコードを含まないことを確認
    expect(response.body.username).not.toContain('DROP TABLE');
    expect(response.body.bio).not.toContain('DELETE FROM');
  });
});`,
      },
    ]);

    // React テンプレート
    this.templates.set('react', [
      {
        name: 'react_xss_prevention_test',
        framework: 'react',
        category: 'input-validation',
        securityPattern: 'xss-prevention',
        complexity: 'intermediate',
        expectedFindings: ['unsafe-taint-flow', 'missing-sanitizer'],
        template: `
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from '../components/UserProfile';
import { sanitizeHtml } from '../utils/sanitizer';

describe('XSS Prevention Security Tests', () => {
  it('should sanitize user-generated content - Test {{TEST_INDEX}}', () => {
    const maliciousProps = {
      username: '<script>alert("xss{{RANDOM_VALUE}}")</script>',
      bio: '<img src=x onerror=alert("malicious{{RANDOM_VALUE}}")>',
      website: 'javascript:alert("xss")'
    };

    render(<UserProfile {...maliciousProps} />);
    
    // スクリプトタグが実行されないことを確認
    expect(screen.queryByText('<script>')).toBeNull();
    expect(screen.queryByText('onerror=')).toBeNull();
    
    // サニタイズされたコンテンツが表示されることを確認
    const sanitizedBio = sanitizeHtml(maliciousProps.bio);
    expect(screen.getByText(sanitizedBio)).toBeInTheDocument();
  });

  it('should handle dangerouslySetInnerHTML safely - Test {{TEST_INDEX}}', () => {
    const DangerousComponent = ({ htmlContent }: { htmlContent: string }) => {
      const sanitizedContent = sanitizeHtml(htmlContent);
      return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
    };

    const maliciousHtml = \`
      <div>
        正常なコンテンツ
        <script>alert('xss{{RANDOM_VALUE}}')</script>
        <img src="x" onerror="alert('img xss')">
      </div>
    \`;

    render(<DangerousComponent htmlContent={maliciousHtml} />);
    
    // サニタイズにより、スクリプトが除去されていることを確認
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img[onerror]')).toBeNull();
  });

  it('should validate form input before submission - Test {{TEST_INDEX}}', async () => {
    const CommentForm = () => {
      const [comment, setComment] = React.useState('');
      
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const sanitizedComment = sanitizeHtml(comment);
        // コメント送信処理
        console.log('Submitting:', sanitizedComment);
      };

      return (
        <form onSubmit={handleSubmit}>
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-testid="comment-input"
          />
          <button type="submit">Submit</button>
        </form>
      );
    };

    render(<CommentForm />);
    
    const textarea = screen.getByTestId('comment-input');
    const maliciousComment = '<script>document.cookie="stolen{{RANDOM_VALUE}}"</script>';
    
    fireEvent.change(textarea, { target: { value: maliciousComment } });
    fireEvent.click(screen.getByText('Submit'));
    
    // スクリプトが実行されていないことを確認
    expect(document.cookie).not.toContain('stolen{{RANDOM_VALUE}}');
  });
});`,
      },
      {
        name: 'react_auth_state_test',
        framework: 'react',
        category: 'authentication',
        securityPattern: 'auth-state-management',
        complexity: 'advanced',
        expectedFindings: ['unsafe-taint-flow', 'missing-auth-test'],
        template: `
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

describe('Authentication State Security Tests', () => {
  const TestComponent = () => {
    const { user, token, isAuthenticated } = useAuth();
    return (
      <div>
        <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
        <div data-testid="user-data">{JSON.stringify(user)}</div>
        <div data-testid="token-data">{token}</div>
      </div>
    );
  };

  it('should not expose sensitive data in unauthenticated state - Test {{TEST_INDEX}}', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('null');
    expect(screen.getByTestId('token-data')).toHaveTextContent('');
  });

  it('should sanitize user data from token - Test {{TEST_INDEX}}', async () => {
    const maliciousToken = btoa(JSON.stringify({
      userId: '<script>alert("token xss{{RANDOM_VALUE}}")</script>',
      email: 'test@example.com',
      role: 'admin"; DROP TABLE users; --'
    }));

    const AuthProviderWithToken = ({ children }: { children: React.ReactNode }) => {
      React.useEffect(() => {
        // トークンからユーザーデータを取得する際のサニタイズテスト
        localStorage.setItem('authToken', maliciousToken);
      }, []);

      return <AuthProvider>{children}</AuthProvider>;
    };

    render(
      <AuthProviderWithToken>
        <TestComponent />
      </AuthProviderWithToken>
    );

    await waitFor(() => {
      const userData = screen.getByTestId('user-data').textContent;
      expect(userData).not.toContain('<script>');
      expect(userData).not.toContain('DROP TABLE');
    });
  });

  it('should protect routes based on authentication state - Test {{TEST_INDEX}}', () => {
    const ProtectedContent = () => <div data-testid="protected">Protected Content</div>;
    const LoginPrompt = () => <div data-testid="login">Please Login</div>;

    render(
      <AuthProvider>
        <ProtectedRoute 
          component={ProtectedContent}
          fallback={LoginPrompt}
        />
      </AuthProvider>
    );

    // 未認証状態ではログインプロンプトが表示される
    expect(screen.getByTestId('login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });
});`,
      },
    ]);

    // NestJS テンプレート
    this.templates.set('nestjs', [
      {
        name: 'nestjs_guard_security_test',
        framework: 'nestjs',
        category: 'authorization',
        securityPattern: 'guards-interceptors',
        complexity: 'advanced',
        expectedFindings: ['missing-auth-test', 'unsafe-taint-flow'],
        template: `
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('Guard Security Tests', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        RolesGuard,
        Reflector
      ],
    }).compile();

    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should validate JWT token in guard - Test {{TEST_INDEX}}', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ0ZXN0LXt7UkFORE9NX1ZBTFVFXX0iLCJyb2xlIjoidXNlciJ9.invalid-signature'
          },
          user: null
        })
      })
    } as ExecutionContext;

    // 無効なトークンシグネチャのテスト
    const result = await jwtAuthGuard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should enforce role-based access control - Test {{TEST_INDEX}}', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            userId: 'test-{{RANDOM_VALUE}}',
            role: 'user', // admin role required for protected route
            permissions: ['read']
          }
        })
      }),
      getHandler: () => ({}),
      getClass: () => ({})
    } as ExecutionContext;

    // Required roles: ['admin']
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    
    const result = await rolesGuard.canActivate(mockContext);
    expect(result).toBe(false); // user role should not access admin route
  });

  it('should sanitize user input in guard context - Test {{TEST_INDEX}}', async () => {
    const maliciousRequest = {
      headers: {
        authorization: 'Bearer valid.jwt.token',
        'x-forwarded-for': '<script>alert("header xss{{RANDOM_VALUE}}")</script>',
        'user-agent': 'Mozilla/5.0; DROP TABLE sessions; --'
      },
      user: {
        userId: '{{RANDOM_VALUE}}',
        role: 'user'
      },
      body: {
        comment: '<img src=x onerror=alert("body xss")>',
        metadata: { source: 'client"; DELETE FROM logs; --' }
      }
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => maliciousRequest
      })
    } as ExecutionContext;

    // Guard should sanitize request data
    const sanitizedRequest = sanitizeGuardContext(mockContext);
    const request = sanitizedRequest.switchToHttp().getRequest();
    
    expect(request.headers['x-forwarded-for']).not.toContain('<script>');
    expect(request.headers['user-agent']).not.toContain('DROP TABLE');
    expect(request.body.comment).not.toContain('onerror=');
    expect(request.body.metadata.source).not.toContain('DELETE FROM');
  });
});`,
      },
      {
        name: 'nestjs_dto_validation_test',
        framework: 'nestjs',
        category: 'input-validation',
        securityPattern: 'dto-validation',
        complexity: 'intermediate',
        expectedFindings: ['missing-sanitizer', 'unsafe-taint-flow'],
        template: `
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

describe('DTO Validation Security Tests', () => {
  it('should validate and sanitize CreateUserDto - Test {{TEST_INDEX}}', async () => {
    const maliciousData = {
      username: '<script>alert("dto xss{{RANDOM_VALUE}}")</script>',
      email: 'invalid-email{{RANDOM_VALUE}}',
      password: '123', // too short
      bio: 'Normal bio with <img src=x onerror=alert("xss")> malicious content',
      website: 'javascript:alert("malicious{{RANDOM_VALUE}}")'
    };

    const dto = plainToClass(CreateUserDto, maliciousData);
    const errors = await validate(dto);

    // Validation errors should be present
    expect(errors.length).toBeGreaterThan(0);
    
    // Check that malicious content is detected
    const usernameError = errors.find(error => error.property === 'username');
    const emailError = errors.find(error => error.property === 'email');
    const passwordError = errors.find(error => error.property === 'password');
    
    expect(usernameError).toBeDefined();
    expect(emailError).toBeDefined();
    expect(passwordError).toBeDefined();
  });

  it('should sanitize HTML content in DTO - Test {{TEST_INDEX}}', async () => {
    const dataWithHtml = {
      username: 'validuser{{RANDOM_VALUE}}',
      email: 'test{{RANDOM_VALUE}}@example.com',  
      password: 'StrongPassword123!',
      bio: 'My bio contains <b>bold</b> text and <script>alert("xss")</script>',
      website: 'https://example.com'
    };

    const dto = plainToClass(CreateUserDto, dataWithHtml);
    const errors = await validate(dto);

    if (errors.length === 0) {
      // DTO validation passed, check if HTML is sanitized
      expect(dto.bio).toContain('<b>bold</b>'); // Safe HTML should remain
      expect(dto.bio).not.toContain('<script>'); // Dangerous HTML should be removed
    }
  });

  it('should handle SQL injection attempts in DTO - Test {{TEST_INDEX}}', async () => {
    const sqlInjectionData = {
      username: "admin'; DROP TABLE users; --",
      email: 'test{{RANDOM_VALUE}}@example.com',
      password: 'Password123!',
      bio: "Regular user' UNION SELECT * FROM admin_users WHERE '1'='1",
      website: 'https://example.com'
    };

    const dto = plainToClass(CreateUserDto, sqlInjectionData);
    await validate(dto);

    // Check that SQL injection patterns are sanitized or rejected
    expect(dto.username).not.toContain('DROP TABLE');
    expect(dto.bio).not.toContain('UNION SELECT');
  });

  it('should validate nested object DTOs - Test {{TEST_INDEX}}', async () => {
    const nestedMaliciousData = {
      personalInfo: {
        firstName: '<script>alert("nested xss{{RANDOM_VALUE}}")</script>',
        lastName: 'User"; DELETE FROM profiles; --',
        address: {
          street: '123 Main St <img src=x onerror=alert("address xss")>',
          city: 'Test City',
          postalCode: '12345'
        }
      },
      preferences: {
        theme: 'dark", "maliciousField": "injected{{RANDOM_VALUE}}',
        notifications: true
      }
    };

    const dto = plainToClass(UpdateProfileDto, nestedMaliciousData);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    // Nested validation should catch malicious content
    expect(errors.length).toBeGreaterThan(0);
    
    // Check that nested properties are sanitized
    if (dto.personalInfo) {
      expect(dto.personalInfo.firstName).not.toContain('<script>');
      expect(dto.personalInfo.lastName).not.toContain('DELETE FROM');
      if (dto.personalInfo.address) {
        expect(dto.personalInfo.address.street).not.toContain('onerror=');
      }
    }
  });
});`,
      },
    ]);
  }

  /**
   * 生成されたテストの保存
   */
  private async saveGeneratedTests(
    results: Map<string, TestCase[]>,
    outputDir: string
  ): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    for (const [framework, tests] of results) {
      const frameworkDir = path.join(outputDir, framework);
      await fs.mkdir(frameworkDir, { recursive: true });

      for (const test of tests) {
        const filePath = path.join(frameworkDir, test.file);
        await fs.writeFile(filePath, test.content, 'utf-8');
      }

      // フレームワーク別のサマリー生成
      const summaryPath = path.join(frameworkDir, 'test-summary.json');
      const summary = {
        framework,
        totalTests: tests.length,
        categories: this.categorizTests(tests),
        generatedAt: new Date().toISOString(),
      };

      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    }
  }

  /**
   * テストのカテゴリ分析
   */
  private categorizTests(tests: TestCase[]): Record<string, number> {
    const categories: Record<string, number> = {};

    tests.forEach(test => {
      const category = this.extractCategory(test.content);
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }

  /**
   * テスト内容からカテゴリを抽出
   */
  private extractCategory(content: string): string {
    if (content.includes('authentication') || content.includes('JWT') || content.includes('auth')) {
      return 'authentication';
    }
    if (content.includes('validation') || content.includes('sanitize') || content.includes('XSS')) {
      return 'input-validation';
    }
    if (
      content.includes('Guard') ||
      content.includes('authorization') ||
      content.includes('role')
    ) {
      return 'authorization';
    }
    if (content.includes('DTO') || content.includes('class-validator')) {
      return 'dto-validation';
    }
    return 'other';
  }

  /**
   * デフォルト生成設定の取得
   */
  static getDefaultConfig(): GenerationConfig {
    return {
      outputDir: './generated-tests',
      testCount: {
        basic: 3,
        intermediate: 2,
        advanced: 1,
      },
      frameworkConfig: {
        express: {
          version: '4.18.0',
          dependencies: ['express', 'jsonwebtoken', 'express-validator'],
          testFramework: 'jest',
        },
        react: {
          version: '18.2.0',
          dependencies: ['react', '@testing-library/react', '@testing-library/jest-dom'],
          testFramework: 'jest',
        },
        nestjs: {
          version: '10.0.0',
          dependencies: ['@nestjs/core', '@nestjs/testing', 'class-validator'],
          testFramework: 'jest',
        },
      },
    };
  }
}
