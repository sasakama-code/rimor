import { SignatureBasedInference } from '../../../src/security/analysis/inference';
import {
  MethodSignature,
  Parameter,
  SecurityRequirement,
  SecurityType,
  AuthTestCoverage,
  TaintLevel,
  SecurityTestMetrics,
  TestMethod
} from '../../../src/security/types';
import { TaintQualifier } from '../../../src/security/types/checker-framework-types';

describe('SignatureBasedInference', () => {
  let inference: SignatureBasedInference;

  beforeEach(() => {
    inference = new SignatureBasedInference();
  });

  describe('基本的な推論機能', () => {
    it('推論エンジンインスタンスを作成できる', () => {
      expect(inference).toBeInstanceOf(SignatureBasedInference);
    });
  });

  describe('inferRequirements', () => {
    it('認証が必要なメソッドを推論できる', () => {
      const signature: MethodSignature = {
        name: 'updateUserProfile',
        parameters: [
          { name: 'userId', type: 'string' },
          { name: 'profileData', type: 'UserProfile' }
        ],
        returnType: 'Promise<void>',
        decorators: ['@Authenticated'],
        location: { file: 'user.ts', line: 10, column: 1 }
      };

      const requirements = inference.inferRequirements(signature);
      
      expect(requirements).toContainEqual(
        expect.objectContaining({
          type: SecurityType.AUTHENTICATION,
          severity: 'high'
        })
      );
    });

    it('入力検証が必要なメソッドを推論できる', () => {
      const signature: MethodSignature = {
        name: 'processUserInput',
        parameters: [
          { name: 'userInput', type: 'string', taint: TaintQualifier.TAINTED },
          { name: 'options', type: 'ProcessOptions' }
        ],
        returnType: 'ProcessResult',
        location: { file: 'process.ts', line: 20, column: 1 }
      };

      const requirements = inference.inferRequirements(signature);
      
      expect(requirements).toContainEqual(
        expect.objectContaining({
          type: SecurityType.INPUT_VALIDATION,
          severity: 'high'
        })
      );
    });

    it('APIセキュリティが必要なメソッドを推論できる', () => {
      const signature: MethodSignature = {
        name: 'handleApiRequest',
        parameters: [
          { name: 'request', type: 'ApiRequest' },
          { name: 'response', type: 'ApiResponse' }
        ],
        returnType: 'Promise<void>',
        decorators: ['@ApiEndpoint', '@RateLimit'],
        location: { file: 'api.ts', line: 30, column: 1 }
      };

      const requirements = inference.inferRequirements(signature);
      
      const apiRequirements = requirements.filter(r => r.type === SecurityType.API_SECURITY);
      expect(apiRequirements).toHaveLength(1);
      expect(apiRequirements[0].checks).toContain('rate_limiting');
    });
  });

  describe('inferTypes', () => {
    it('メソッドから型を推論できる', () => {
      const method: TestMethod = {
        name: 'getUserData',
        body: `
          const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
          return user;
        `,
        parameters: [
          { name: 'userId', type: 'string' }
        ],
        returnType: 'Promise<User>',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const result = inference.inferTypes(method);
      
      expect(result).toBeDefined();
      expect(result.inferredTypes).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('汚染レベルを推論できる', () => {
      const method: TestMethod = {
        name: 'processRequest',
        body: `
          const data = request.body;
          const sanitized = validator.clean(data);
          return sanitized;
        `,
        parameters: [
          { name: 'request', type: 'Request', taint: TaintQualifier.TAINTED }
        ],
        returnType: 'any',
        location: { file: 'test.ts', line: 1, column: 1 }
      };

      const result = inference.inferTypes(method);
      
      expect(result.taintAnalysis).toBeDefined();
      expect(result.taintAnalysis?.outputTaint).toBe(TaintLevel.UNTAINTED);
    });
  });

  describe('evaluateAuthCoverage', () => {
    it('認証カバレッジを評価できる', () => {
      const methods: TestMethod[] = [
        {
          name: 'testAuthenticatedAccess',
          body: 'expectAuthenticated(user);',
          parameters: [],
          returnType: 'void',
          location: { file: 'auth.test.ts', line: 10, column: 1 }
        },
        {
          name: 'testUnauthenticatedAccess',
          body: 'expectUnauthenticated(request);',
          parameters: [],
          returnType: 'void',
          location: { file: 'auth.test.ts', line: 20, column: 1 }
        }
      ];

      const coverage = inference.evaluateAuthCoverage(methods);
      
      expect(coverage.totalCoverage).toBeGreaterThan(0);
      expect(coverage.missingScenarios).toBeDefined();
    });
  });

  describe('computeMetrics', () => {
    it('セキュリティテストメトリクスを計算できる', () => {
      const tests: TestMethod[] = [
        {
          name: 'testSQLInjection',
          body: 'expectSecure(query);',
          parameters: [],
          returnType: 'void',
          location: { file: 'security.test.ts', line: 1, column: 1 }
        },
        {
          name: 'testXSS',
          body: 'expectSanitized(output);',
          parameters: [],
          returnType: 'void',
          location: { file: 'security.test.ts', line: 10, column: 1 }
        }
      ];

      const metrics = inference.computeMetrics(tests);
      
      expect(metrics.coverageByType).toBeDefined();
      expect(metrics.totalTests).toBe(2);
      expect(metrics.securityScore).toBeGreaterThan(0);
    });
  });

  describe('複雑な推論シナリオ', () => {
    it('複数のセキュリティ要件を同時に推論できる', () => {
      const signature: MethodSignature = {
        name: 'processPayment',
        parameters: [
          { name: 'userId', type: 'string' },
          { name: 'paymentData', type: 'PaymentData', taint: TaintQualifier.TAINTED },
          { name: 'session', type: 'UserSession' }
        ],
        returnType: 'Promise<PaymentResult>',
        decorators: ['@Authenticated', '@Authorized("payment")', '@Transactional'],
        location: { file: 'payment.ts', line: 50, column: 1 }
      };

      const requirements = inference.inferRequirements(signature);
      
      const types = requirements.map(r => r.type);
      expect(types).toContain(SecurityType.AUTHENTICATION);
      expect(types).toContain(SecurityType.AUTHORIZATION);
      expect(types).toContain(SecurityType.INPUT_VALIDATION);
      expect(requirements.length).toBeGreaterThanOrEqual(3);
    });

    it('コンテキストに基づいて推論を調整できる', () => {
      const adminSignature: MethodSignature = {
        name: 'deleteUser',
        parameters: [
          { name: 'userId', type: 'string' },
          { name: 'adminToken', type: 'AdminToken' }
        ],
        returnType: 'Promise<void>',
        decorators: ['@RequiresAdmin'],
        location: { file: 'admin.ts', line: 100, column: 1 }
      };

      const requirements = inference.inferRequirements(adminSignature);
      
      const authReq = requirements.find(r => r.type === SecurityType.AUTHORIZATION);
      expect(authReq).toBeDefined();
      expect(authReq!.severity).toBe('critical');
      expect(authReq!.checks).toContain('admin_role_verification');
    });
  });

  describe('パフォーマンス', () => {
    it('大量のメソッドを効率的に処理できる', () => {
      const signatures: MethodSignature[] = Array.from({ length: 100 }, (_, i) => ({
        name: `method${i}`,
        parameters: [
          { name: 'param1', type: 'string' },
          { name: 'param2', type: 'number' }
        ],
        returnType: 'void',
        location: { file: 'test.ts', line: i * 10, column: 1 }
      }));

      const startTime = Date.now();
      signatures.forEach(sig => inference.inferRequirements(sig));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });
});