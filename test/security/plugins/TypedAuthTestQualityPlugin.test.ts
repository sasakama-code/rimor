/**
 * TypedAuthTestQualityPlugin.test.ts
 * 型付き認証テスト品質プラグインのテスト
 * 認証・認可テストの品質監査システムのテスト
 */

import { TypedAuthTestQualityPlugin } from '../../../src/security/plugins/TypedAuthTestQualityPlugin';
import {
  TestMethod,
  SecurityType,
  TaintLevel,
  TaintSource
} from '../../../src/security/types';
import {
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore
} from '../../../src/core/types';

describe('TypedAuthTestQualityPlugin - 型付き認証テスト品質プラグイン', () => {
  let plugin: TypedAuthTestQualityPlugin;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    plugin = new TypedAuthTestQualityPlugin();
    
    mockProjectContext = {
      projectPath: '/test/project',
      configuration: {
        testPatterns: ['**/*.test.ts'],
        excludePatterns: ['node_modules/**'],
        plugins: []
      },
      dependencies: ['passport', 'jsonwebtoken', 'bcrypt'],
      framework: 'jest'
    };
  });

  describe('プラグイン基本機能', () => {
    it('プラグインが正しく初期化されること', () => {
      expect(plugin.id).toBe('typed-auth-test-quality');
      expect(plugin.name).toBeDefined();
      expect(plugin.version).toBeDefined();
      expect(plugin.type).toBe('security');
    });

    it('認証関連プロジェクトで適用可能と判定すること', () => {
      expect(plugin.isApplicable(mockProjectContext)).toBe(true);
      
      const nonAuthContext = {
        ...mockProjectContext,
        dependencies: ['lodash', 'moment']
      };
      expect(plugin.isApplicable(nonAuthContext)).toBe(false);
    });
  });

  describe('認証テストパターンの検出', () => {
    it('ログインテストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/auth.test.ts',
        content: `
          describe('Authentication', () => {
            it('should authenticate valid user', async () => {
              const user = { username: 'test', password: 'password' };
              const result = await login(user);
              expect(result.authenticated).toBe(true);
              expect(result.token).toBeDefined();
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should authenticate valid user',
            signature: {
              name: 'login',
              parameters: [
                { name: 'user', type: 'UserCredentials', annotations: [] }
              ],
              returnType: 'AuthResult',
              annotations: []
            },
            body: `
              const user = { username: 'test', password: 'password' };
              const result = await login(user);
              expect(result.authenticated).toBe(true);
              expect(result.token).toBeDefined();
            `,
            assertions: ['expect'],
            dependencies: ['login'],
            securityRelevance: 0.9,
            testType: 'security'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results.length).toBeGreaterThan(0);
      
      const loginPattern = results.find(r => 
        r.pattern === 'authentication-test'
      );
      expect(loginPattern).toBeDefined();
      expect(loginPattern?.confidence).toBeGreaterThan(0.8);
      expect(loginPattern?.securityRelevance).toBeGreaterThan(0.8);
    });

    it('認可テストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/authorization.test.ts',
        content: `
          describe('Authorization', () => {
            it('should deny access to unauthorized user', async () => {
              const user = { role: 'user' };
              const result = await checkPermission(user, 'admin');
              expect(result.authorized).toBe(false);
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should deny access to unauthorized user',
            signature: {
              name: 'checkPermission',
              parameters: [
                { name: 'user', type: 'User', annotations: [] },
                { name: 'permission', type: 'string', annotations: [] }
              ],
              returnType: 'AuthorizationResult',
              annotations: []
            },
            body: `
              const user = { role: 'user' };
              const result = await checkPermission(user, 'admin');
              expect(result.authorized).toBe(false);
            `,
            assertions: ['expect'],
            dependencies: ['checkPermission'],
            securityRelevance: 0.85,
            testType: 'security'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      const authzPattern = results.find(r => 
        r.pattern === 'authorization-test'
      );
      expect(authzPattern).toBeDefined();
      expect(authzPattern?.metadata.permissionChecks).toBe(true);
    });

    it('JWTトークンテストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/jwt.test.ts',
        content: `
          describe('JWT Token', () => {
            it('should validate JWT token', () => {
              const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
              const decoded = verifyToken(token);
              expect(decoded.userId).toBeDefined();
              expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should validate JWT token',
            signature: {
              name: 'verifyToken',
              parameters: [
                { name: 'token', type: 'string', annotations: [] }
              ],
              returnType: 'DecodedToken',
              annotations: []
            },
            body: `
              const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
              const decoded = verifyToken(token);
              expect(decoded.userId).toBeDefined();
              expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
            `,
            assertions: ['expect'],
            dependencies: ['verifyToken'],
            securityRelevance: 0.8,
            testType: 'security'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      const jwtPattern = results.find(r => 
        r.pattern === 'jwt-validation-test'
      );
      expect(jwtPattern).toBeDefined();
      expect(jwtPattern?.metadata.tokenValidation).toBe(true);
    });

    it('不十分な認証テストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/weak-auth.test.ts',
        content: `
          describe('Weak Auth Test', () => {
            it('should login user', () => {
              const result = login('admin', 'password');
              expect(result).toBeDefined();
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should login user',
            signature: {
              name: 'login',
              parameters: [
                { name: 'username', type: 'string', annotations: [] },
                { name: 'password', type: 'string', annotations: [] }
              ],
              returnType: 'any',
              annotations: []
            },
            body: `
              const result = login('admin', 'password');
              expect(result).toBeDefined();
            `,
            assertions: ['expect'],
            dependencies: ['login'],
            securityRelevance: 0.4,
            testType: 'unit'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      const weakPattern = results.find(r => 
        r.pattern === 'weak-authentication-test'
      );
      expect(weakPattern).toBeDefined();
      expect(weakPattern?.severity).toBe('medium');
    });
  });

  describe('品質評価', () => {
    it('高品質な認証テストに高いスコアを付与すること', () => {
      const highQualityPatterns: DetectionResult[] = [
        {
          pattern: 'authentication-test',
          confidence: 0.9,
          securityRelevance: 0.95,
          severity: 'info',
          location: { file: 'test.ts', line: 10, column: 5 },
          metadata: {
            hasPasswordValidation: true,
            hasTokenGeneration: true,
            hasErrorHandling: true,
            testsBruteForce: true
          }
        },
        {
          pattern: 'authorization-test',
          confidence: 0.88,
          securityRelevance: 0.9,
          severity: 'info',
          location: { file: 'test.ts', line: 20, column: 5 },
          metadata: {
            permissionChecks: true,
            roleBasedAccess: true,
            resourceProtection: true
          }
        }
      ];

      const qualityScore = plugin.evaluateQuality(highQualityPatterns);

      expect(qualityScore.overall).toBeGreaterThan(0.85);
      expect(qualityScore.security).toBeGreaterThan(0.9);
      expect(qualityScore.details.authenticationCoverage).toBeGreaterThan(0.8);
      expect(qualityScore.details.authorizationCoverage).toBeGreaterThan(0.8);
    });

    it('低品質な認証テストに適切なスコアを付与すること', () => {
      const lowQualityPatterns: DetectionResult[] = [
        {
          pattern: 'weak-authentication-test',
          confidence: 0.7,
          securityRelevance: 0.4,
          severity: 'medium',
          location: { file: 'test.ts', line: 10, column: 5 },
          metadata: {
            missingValidations: ['password-strength', 'brute-force-protection'],
            hardcodedCredentials: true
          }
        }
      ];

      const qualityScore = plugin.evaluateQuality(lowQualityPatterns);

      expect(qualityScore.overall).toBeLessThan(0.5);
      expect(qualityScore.security).toBeLessThan(0.4);
      expect(qualityScore.details.securityTestGaps.length).toBeGreaterThan(0);
    });
  });

  describe('改善提案', () => {
    it('不足している認証テストの改善提案を生成すること', () => {
      const evaluation: QualityScore = {
        overall: 0.4,
        security: 0.3,
        coverage: 0.5,
        maintainability: 0.6,
        details: {
          authenticationCoverage: 0.3,
          authorizationCoverage: 0.2,
          tokenValidationCoverage: 0.1,
          securityTestGaps: ['brute-force-protection', 'session-management']
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements.length).toBeGreaterThan(0);
      
      const authImprovement = improvements.find(imp => 
        imp.type === 'enhance-authentication-tests'
      );
      expect(authImprovement).toBeDefined();
      expect(authImprovement?.priority).toBe('high');
      expect(authImprovement?.suggestions).toContain('Add brute force protection tests');
      
      const tokenImprovement = improvements.find(imp => 
        imp.type === 'add-token-validation-tests'
      );
      expect(tokenImprovement).toBeDefined();
    });

    it('セッション管理テストの改善提案を生成すること', () => {
      const evaluation: QualityScore = {
        overall: 0.6,
        security: 0.5,
        coverage: 0.7,
        maintainability: 0.6,
        details: {
          sessionManagementCoverage: 0.2, // セッション管理が不十分
          authenticationCoverage: 0.8,
          authorizationCoverage: 0.7
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);

      const sessionImprovement = improvements.find(imp => 
        imp.type === 'improve-session-management-tests'
      );
      expect(sessionImprovement).toBeDefined();
      expect(sessionImprovement?.suggestions).toContain('Add session timeout tests');
      expect(sessionImprovement?.suggestions).toContain('Add session fixation protection tests');
    });
  });

  describe('型推論と汚染分析', () => {
    it('認証情報の汚染分析を行うこと', async () => {
      const testMethod: TestMethod = {
        name: 'testCredentialHandling',
        signature: {
          name: 'handleCredentials',
          parameters: [
            { name: 'userInput', type: 'TaintedCredentials', annotations: ['@UserInput'] },
            { name: 'hasher', type: 'PasswordHasher', annotations: [] }
          ],
          returnType: 'HashedCredentials',
          annotations: []
        },
        body: `
          const hashed = hasher.hash(userInput.password);
          expect(hashed).not.toBe(userInput.password);
          expect(hashed.length).toBeGreaterThan(20);
        `,
        assertions: ['expect'],
        dependencies: ['hasher'],
        securityRelevance: 0.95,
        testType: 'security'
      };

      const analysisResult = await plugin.analyzeTestMethod(testMethod);

      expect(analysisResult.taintFlow).toBeDefined();
      expect(analysisResult.taintFlow.sources).toContain(TaintSource.USER_INPUT);
      expect(analysisResult.taintFlow.sanitizers.length).toBeGreaterThan(0);
      expect(analysisResult.securityScore).toBeGreaterThan(0.8);
    });

    it('認証トークンの型安全性を検証すること', async () => {
      const testMethod: TestMethod = {
        name: 'testTokenSafety',
        signature: {
          name: 'processToken',
          parameters: [
            { name: 'token', type: 'SecureToken', annotations: ['@Validated'] }
          ],
          returnType: 'TokenClaims',
          annotations: []
        },
        body: `
          const claims = jwt.verify(token, SECRET_KEY);
          expect(claims.sub).toBeDefined();
          expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
        `,
        assertions: ['expect'],
        dependencies: ['jwt'],
        securityRelevance: 0.9,
        testType: 'security'
      };

      const analysisResult = await plugin.analyzeTestMethod(testMethod);

      expect(analysisResult.typeViolations).toHaveLength(0);
      expect(analysisResult.securityScore).toBeGreaterThan(0.85);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量の認証テストを効率的に処理すること', async () => {
      const largeTestFile: TestFile = {
        path: '/test/large-auth.test.ts',
        content: 'large auth test file',
        framework: 'jest',
        testMethods: Array.from({ length: 50 }, (_, i) => ({
          name: `testAuth${i}`,
          signature: {
            name: `authenticate${i}`,
            parameters: [
              { name: 'credentials', type: 'UserCredentials', annotations: [] }
            ],
            returnType: 'AuthResult',
            annotations: []
          },
          body: `expect(authenticate${i}(credentials)).toBeDefined();`,
          assertions: ['expect'],
          dependencies: [`authenticate${i}`],
          securityRelevance: 0.7 + (i % 10) * 0.02,
          testType: 'security'
        }))
      };

      const startTime = Date.now();
      const results = await plugin.detectPatterns(largeTestFile);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      
      expect(results.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(3000); // 3秒以内
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な認証テスト定義でもクラッシュしないこと', async () => {
      const invalidTestFile: TestFile = {
        path: '/test/invalid.test.ts',
        content: '',
        framework: 'jest',
        testMethods: [
          {
            name: '',
            signature: null as any,
            body: undefined as any,
            assertions: [],
            dependencies: [],
            securityRelevance: 0,
            testType: 'unit'
          }
        ]
      };

      expect(async () => {
        const results = await plugin.detectPatterns(invalidTestFile);
        expect(results).toBeDefined();
      }).not.toThrow();
    });
  });
});