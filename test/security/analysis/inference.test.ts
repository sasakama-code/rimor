import { SignatureBasedInference } from '../../../src/security/analysis/inference';
import {
  MethodSignature,
  Parameter,
  SecurityRequirement,
  AuthTestCoverage,
  TaintLevel,
  SecurityTestMetrics,
  TestMethod
} from '../../../src/security/types';
import { TaintQualifier, SecurityType } from '../../../src/core/types';

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
        annotations: ['@Authenticated'],
        isAsync: true
      };

      const requirements = inference.inferRequirements(signature);
      
      const authReq = requirements.find(r => r.type === 'auth-test');
      expect(authReq).toBeDefined();
    });

    it('入力検証が必要なメソッドを推論できる', () => {
      const signature: MethodSignature = {
        name: 'processUserInput',
        parameters: [
          { name: 'userInput', type: 'string' }, // taint情報は別途管理
          { name: 'options', type: 'ProcessOptions' }
        ],
        returnType: 'ProcessResult',
        annotations: [],
        isAsync: false
      };

      const requirements = inference.inferRequirements(signature);
      
      const inputReq = requirements.find(r => r.type === 'input-validation');
      expect(inputReq).toBeDefined();
    });

    it('APIセキュリティが必要なメソッドを推論できる', () => {
      const signature: MethodSignature = {
        name: 'handleApiRequest',
        parameters: [
          { name: 'request', type: 'ApiRequest' },
          { name: 'response', type: 'ApiResponse' }
        ],
        returnType: 'Promise<void>',
        annotations: ['@ApiEndpoint', '@RateLimit'],
        isAsync: true
      };

      const requirements = inference.inferRequirements(signature);
      
      const apiRequirements = requirements.filter(r => r.type === 'api-security');
      expect(apiRequirements).toHaveLength(1);
      expect(apiRequirements[0].checks).toBeDefined();
      expect(apiRequirements[0].checks).toContain('rate_limiting');
    });
  });

  // TODO: inferTypesメソッドが実装されたら有効化する
  // describe('inferTypes', () => {
  //   it('メソッドから型を推論できる', () => {
  //     const method: TestMethod = {
  //       name: 'getUserData',
  //       filePath: 'test.ts',
  //       content: `
  //         const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  //         return user;
  //       `,
  //       body: `
  //         const user = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  //         return user;
  //       `,
  //       signature: {
  //         name: 'getUserData',
  //         parameters: [
  //           { name: 'userId', type: 'string' }
  //         ],
  //         returnType: 'Promise<User>',
  //         annotations: [],
  //         isAsync: true
  //       },
  //       location: {
  //         startLine: 1,
  //         endLine: 5,
  //         startColumn: 1,
  //         endColumn: 10
  //       }
  //     };

  //     // inferTypesメソッドが実装されていない場合はスキップ
  //     if (!inference.inferTypes) {
  //       return;
  //     }
  //     const result = inference.inferTypes(method);
      
  //     expect(result).toBeDefined();
  //     expect(result.inferredTypes).toBeDefined();
  //     expect(result.confidence).toBeGreaterThan(0);
  //   });

  //   it('汚染レベルを推論できる', () => {
  //     const method: TestMethod = {
  //       name: 'processRequest',
  //       filePath: 'test.ts',
  //       content: `
  //         const data = request.body;
  //         const sanitized = validator.clean(data);
  //         return sanitized;
  //       `,
  //       body: `
  //         const data = request.body;
  //         const sanitized = validator.clean(data);
  //         return sanitized;
  //       `,
  //       signature: {
  //         name: 'processRequest',
  //         parameters: [
  //           { name: 'request', type: 'Request' } // taint情報は別途管理
  //         ],
  //         returnType: 'any',
  //         annotations: [],
  //         isAsync: false
  //       },
  //       location: {
  //         startLine: 1,
  //         endLine: 6,
  //         startColumn: 1,
  //         endColumn: 10
  //       }
  //     };

  //     // inferTypesメソッドが実装されていない場合はスキップ
  //     if (!inference.inferTypes) {
  //       return;
  //     }
  //     const result = inference.inferTypes(method);
      
  //     expect(result.taintAnalysis).toBeDefined();
  //     expect(result.taintAnalysis?.outputTaint).toBe(TaintLevel.UNTAINTED);
  //   });
  // });

  // TODO: evaluateAuthCoverageメソッドが実装されたら有効化する
  // describe('evaluateAuthCoverage', () => {
  //   it('認証カバレッジを評価できる', () => {
  //     const methods: TestMethod[] = [
  //       {
  //         name: 'testAuthenticatedAccess',
  //         filePath: 'auth.test.ts',
  //         content: 'expectAuthenticated(user);',
  //         body: 'expectAuthenticated(user);',
  //         signature: {
  //           name: 'testAuthenticatedAccess',
  //           parameters: [],
  //           returnType: 'void',
  //           annotations: [],
  //           isAsync: false
  //         },
  //         location: {
  //           startLine: 10,
  //           endLine: 10,
  //           startColumn: 1,
  //           endColumn: 30
  //         }
  //       },
  //       {
  //         name: 'testUnauthenticatedAccess',
  //         filePath: 'auth.test.ts',
  //         content: 'expectUnauthenticated(request);',
  //         body: 'expectUnauthenticated(request);',
  //         signature: {
  //           name: 'testUnauthenticatedAccess',
  //           parameters: [],
  //           returnType: 'void',
  //           annotations: [],
  //           isAsync: false
  //         },
  //         location: {
  //           startLine: 20,
  //           endLine: 20,
  //           startColumn: 1,
  //           endColumn: 35
  //         }
  //       }
  //     ];

  //     // evaluateAuthCoverageメソッドが実装されていない場合はスキップ
  //     if (!inference.evaluateAuthCoverage) {
  //       return;
  //     }
  //     const coverage = inference.evaluateAuthCoverage(methods);
      
  //     expect(coverage.totalCoverage).toBeGreaterThan(0);
  //     expect(coverage.missingScenarios).toBeDefined();
  //   });
  // });

  // TODO: computeMetricsメソッドが実装されたら有効化する
  // describe('computeMetrics', () => {
  //   it('セキュリティテストメトリクスを計算できる', () => {
  //     const tests: TestMethod[] = [
  //       {
  //         name: 'testSQLInjection',
  //         filePath: 'security.test.ts',
  //         content: 'expectSecure(query);',
  //         body: 'expectSecure(query);',
  //         signature: {
  //           name: 'testSQLInjection',
  //           parameters: [],
  //           returnType: 'void',
  //           annotations: [],
  //           isAsync: false
  //         },
  //         location: {
  //           startLine: 1,
  //           endLine: 1,
  //           startColumn: 1,
  //           endColumn: 25
  //         }
  //       },
  //       {
  //         name: 'testXSS',
  //         filePath: 'security.test.ts',
  //         content: 'expectSanitized(output);',
  //         body: 'expectSanitized(output);',
  //         signature: {
  //           name: 'testXSS',
  //           parameters: [],
  //           returnType: 'void',
  //           annotations: [],
  //           isAsync: false
  //         },
  //         location: {
  //           startLine: 10,
  //           endLine: 10,
  //           startColumn: 1,
  //           endColumn: 30
  //         }
  //       }
  //     ];

  //     // computeMetricsメソッドが実装されていない場合はスキップ
  //     if (!inference.computeMetrics) {
  //       return;
  //     }
  //     const metrics = inference.computeMetrics(tests);
      
  //     expect(metrics.coverageByType).toBeDefined();
  //     expect(metrics.totalTests).toBe(2);
  //     expect(metrics.securityScore).toBeGreaterThan(0);
  //   });
  // });

  describe('複雑な推論シナリオ', () => {
    it('複数のセキュリティ要件を同時に推論できる', () => {
      const signature: MethodSignature = {
        name: 'processPayment',
        parameters: [
          { name: 'userId', type: 'string' },
          { name: 'paymentData', type: 'PaymentData' }, // taint情報は別途管理
          { name: 'session', type: 'UserSession' }
        ],
        returnType: 'Promise<PaymentResult>',
        annotations: ['@Authenticated', '@Authorized("payment")', '@Transactional'],
        isAsync: true
      };

      const requirements = inference.inferRequirements(signature);
      
      const types = requirements.map(r => r.type);
      expect(types.some(t => t === 'auth-test')).toBe(true);
      expect(types.some(t => t === 'api-security')).toBe(true);
      expect(types.some(t => t === 'input-validation')).toBe(true);
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
        annotations: ['@RequiresAdmin'],
        isAsync: true
      };

      const requirements = inference.inferRequirements(adminSignature);
      
      const authReq = requirements.find(r => r.type === 'auth-test');
      expect(authReq).toBeDefined();
      expect(authReq?.severity).toBe('critical');
      expect(authReq?.checks).toBeDefined();
      expect(authReq?.checks).toContain('admin_role_verification');
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
        annotations: [],
        isAsync: false,
        returnType: 'void'
      }));

      const startTime = Date.now();
      signatures.forEach(sig => inference.inferRequirements(sig));
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });
});