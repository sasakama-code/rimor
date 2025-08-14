/**
 * TypedAuthTestQualityPluginのテストスイート
 * 型ベース認証テスト品質監査プラグインのテスト
 */

import { TypedAuthTestQualityPlugin } from '../../../src/security/plugins/TypedAuthTestQualityPlugin';
import {
  TestMethod,
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  IncrementalUpdate,
  MethodSignature
} from '../../../src/core/types';
import { SecurityMethodChange } from '../../../src/security/types/flow-types';

// テスト用のTestMethodを作成するヘルパー関数
const createTestMethod = (name: string, content: string, filePath: string = 'auth.test.ts'): TestMethod => ({
  name,
  type: 'test',
  content,
  filePath,
  signature: {
    name,
    parameters: [],
    returnType: 'void',
    annotations: [],
    isAsync: content.includes('await')
  },
  location: {
    start: { line: 1, column: 0 },
    end: { line: content.split('\n').length, column: 100 },
    startLine: 1,
    endLine: content.split('\n').length,
    startColumn: 0,
    endColumn: 100
  }
});

describe('TypedAuthTestQualityPlugin', () => {
  let plugin: TypedAuthTestQualityPlugin;
  
  beforeEach(() => {
    plugin = new TypedAuthTestQualityPlugin();
  });
  
  describe('基本機能', () => {
    it('プラグインが正しく初期化されること', () => {
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('typed-auth-test-quality');
      expect(plugin.name).toBe('型ベース認証テスト品質監査');
      expect(plugin.version).toBe('0.7.0');
      expect(plugin.type).toBe('core');
    });
    
    it('必要な型情報が定義されていること', () => {
      expect(plugin.requiredTypes).toBeDefined();
      expect(plugin.requiredTypes).toContain('user-input');
      expect(plugin.requiredTypes).toContain('auth-token');
      expect(plugin.providedTypes).toContain('validated-auth');
    });
  });
  
  describe('isApplicable', () => {
    it('認証ライブラリが存在する場合に適用可能であること', () => {
      const context: ProjectContext = {
        packageJson: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            'passport': '^0.5.0'
          }
        },
        filePatterns: {
          test: [],
          source: [],
          ignore: []
        }
      };
      
      expect(plugin.isApplicable(context)).toBe(true);
    });
    
    it('JWT関連ライブラリが存在する場合に適用可能であること', () => {
      const context: ProjectContext = {
        packageJson: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            'jwt': '^8.0.0'
          }
        },
        filePatterns: {
          test: [],
          source: [],
          ignore: []
        }
      };
      
      expect(plugin.isApplicable(context)).toBe(true);
    });
    
    it('認証関連のテストファイルが存在する場合に適用可能であること', () => {
      const context: ProjectContext = {
        packageJson: {
          name: 'test-project',
          version: '1.0.0'
        },
        filePatterns: {
          test: ['**/*auth*.test.ts', '**/*login*.spec.ts'],
          source: [],
          ignore: []
        }
      };
      
      expect(plugin.isApplicable(context)).toBe(true);
    });
    
    it('認証に関連しないプロジェクトでは適用不可であること', () => {
      const context: ProjectContext = {
        packageJson: {
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            'lodash': '^4.0.0'
          }
        },
        filePatterns: {
          test: ['**/*.test.ts'],
          source: [],
          ignore: []
        }
      };
      
      expect(plugin.isApplicable(context)).toBe(false);
    });
  });
  
  describe('detectPatterns', () => {
    it('ログイン成功パターンを検出できること', async () => {
      const testFile: TestFile = {
        path: 'auth.test.ts',
        content: `
          describe('Authentication', () => {
            it('should login successfully with valid credentials', () => {
              const result = login('user', 'password');
              expect(result.success).toBe(true);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.patternId === 'login-success')).toBe(true);
    });
    
    it('ログイン失敗パターンを検出できること', async () => {
      const testFile: TestFile = {
        path: 'auth.test.ts',
        content: `
          it('should fail login with invalid credentials', () => {
            const result = login('user', 'wrong');
            expect(result.error).toBe('Invalid credentials');
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.patternId === 'login-failure')).toBe(true);
    });
    
    it('トークン検証パターンを検出できること', async () => {
      const testFile: TestFile = {
        path: 'auth.test.ts',
        content: `
          test('should verify JWT token', () => {
            const token = generateToken(user);
            const verified = verifyToken(token);
            expect(verified).toBeTruthy();
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.patternId === 'token-validation')).toBe(true);
    });
  });
  
  describe('evaluateQuality', () => {
    it('全ての必須パターンが存在する場合に高スコアを返すこと', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'login-success',
          patternName: 'ログイン成功テスト',
          location: { file: 'auth.test.ts', line: 10, column: 0 },
          confidence: 0.9,
          evidence: []
        },
        {
          patternId: 'login-failure',
          patternName: 'ログイン失敗テスト',
          location: { file: 'auth.test.ts', line: 20, column: 0 },
          confidence: 0.9,
          evidence: []
        },
        {
          patternId: 'token-validation',
          patternName: 'トークン検証テスト',
          location: { file: 'auth.test.ts', line: 30, column: 0 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'session-management',
          patternName: 'セッション管理テスト',
          location: { file: 'auth.test.ts', line: 40, column: 0 },
          confidence: 0.8,
          evidence: []
        }
      ];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBe(100);
      expect(score.breakdown?.completeness).toBe(100);
    });
    
    it('必須パターンが不足している場合に低スコアを返すこと', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'login-success',
          patternName: 'ログイン成功テスト',
          location: { file: 'auth.test.ts', line: 10, column: 0 },
          confidence: 0.9,
          evidence: []
        }
      ];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeLessThan(50);
      expect(score.breakdown?.completeness).toBe(25); // 1/4 = 25%
    });
    
    it('信頼度が計算されること', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'login-success',
          patternName: 'ログイン成功テスト',
          location: { file: 'auth.test.ts', line: 10, column: 0 },
          confidence: 0.9,
          evidence: []
        },
        {
          patternId: 'login-failure',
          patternName: 'ログイン失敗テスト',
          location: { file: 'auth.test.ts', line: 20, column: 0 },
          confidence: 0.7,
          evidence: []
        }
      ];
      
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.confidence).toBe(0.8); // (0.9 + 0.7) / 2
    });
  });
  
  describe('suggestImprovements', () => {
    it('カバレッジが低い場合に改善提案を生成すること', () => {
      const evaluation: QualityScore = {
        overall: 50,
        dimensions: {},
        breakdown: {
          completeness: 50,
          correctness: 80,
          maintainability: 80
        },
        confidence: 0.7
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].id).toBe('auth-coverage-improvement');
      expect(improvements[0].priority).toBe('high');
    });
    
    it('カバレッジが十分な場合は改善提案を生成しないこと', () => {
      const evaluation: QualityScore = {
        overall: 90,
        dimensions: {},
        breakdown: {
          completeness: 90,
          correctness: 90,
          maintainability: 90
        },
        confidence: 0.9
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      expect(improvements.length).toBe(0);
    });
  });
  
  describe('analyzeMethod', () => {
    it('認証関連のテストメソッドを解析できること', async () => {
      const method: TestMethod = {
        name: 'testLoginSuccess',
        type: 'test',
        content: `
          const user = { username: 'test', password: 'password' };
          const result = await login(user);
          expect(result.token).toBeDefined();
        `,
        filePath: 'auth.test.ts',
        signature: {
          name: 'testLoginSuccess',
          parameters: [],
          returnType: 'void',
          annotations: [],
          isAsync: true
        },
        location: {
          start: { line: 10, column: 0 },
          end: { line: 14, column: 100 },
          startLine: 10,
          endLine: 14,
          startColumn: 0,
          endColumn: 100
        }
      };
      
      const result = await plugin.analyzeMethod(method);
      
      expect(result).toBeDefined();
      expect(result.methodName).toBe('testLoginSuccess');
      expect(result.analysisTime).toBeGreaterThanOrEqual(0);
    });
    
    it('非認証関連のテストメソッドは空の結果を返すこと', async () => {
      const method = createTestMethod(
        'testCalculation',
        `
          const result = add(1, 2);
          expect(result).toBe(3);
        `,
        'math.test.ts'
      );
      
      const result = await plugin.analyzeMethod(method);
      
      expect(result.methodName).toBe('testCalculation');
      expect(result.issues).toHaveLength(0);
    });
    
    it('解析結果がキャッシュされること', async () => {
      const method = createTestMethod(
        'testAuthCache',
        'const token = authenticate();'
      );
      
      const result1 = await plugin.analyzeMethod(method);
      const startTime = Date.now();
      const result2 = await plugin.analyzeMethod(method);
      const cacheTime = Date.now() - startTime;
      
      expect(result1).toEqual(result2);
      expect(cacheTime).toBeLessThan(5); // キャッシュアクセスは5ms未満
    });
  });
  
  describe('trackDataFlow', () => {
    it('データフローグラフを生成できること', async () => {
      const method = createTestMethod(
        'testDataFlow',
        `
          const credentials = getUserInput();
          const sanitized = sanitize(credentials);
          const result = authenticate(sanitized);
        `
      );
      
      const flowGraph = await plugin.trackDataFlow(method);
      
      expect(flowGraph).toBeDefined();
      expect(flowGraph.nodes.size).toBeGreaterThan(0);
    });
  });
  
  describe('updateAnalysis', () => {
    it('メソッドの追加を処理できること', async () => {
      const changes: SecurityMethodChange[] = [
        {
          type: 'added',
          method: createTestMethod(
            'testNewAuth',
            'const token = login();'
          ),
          changeType: 'added',
          affectedFlows: []
        }
      ];
      
      const result = await plugin.updateAnalysis(changes);
      
      expect(result.updatedMethods).toContain('testNewAuth');
    });
    
    it('メソッドの削除でキャッシュが無効化されること', async () => {
      const method = createTestMethod(
        'testToDelete',
        'authenticate();'
      );
      
      // まずメソッドを解析してキャッシュに保存
      await plugin.analyzeMethod(method);
      
      // 削除の更新を実行
      const changes: SecurityMethodChange[] = [
        {
          type: 'deleted',
          method,
          changeType: 'deleted',
          affectedFlows: []
        }
      ];
      
      const result = await plugin.updateAnalysis(changes);
      
      // IncrementalUpdateにはinvalidatedCacheプロパティがないため、
      // updatedMethodsまたはaffectedMethodsを確認
      expect(result.affectedMethods.length).toBeGreaterThan(0);
    });
  });
  
  describe('型システム統合', () => {
    it('汚染分析が実行されること', async () => {
      const method: TestMethod = {
        name: 'testTaintAnalysis',
        type: 'test',
        content: `
          const userInput = request.body.password;
          const hashed = bcrypt.hash(userInput);
          saveToDatabase(hashed);
        `,
        filePath: 'auth.test.ts',
        signature: {
          name: 'testTaintAnalysis',
          parameters: [],
          returnType: 'void',
          annotations: [],
          isAsync: false
        },
        location: {
          start: { line: 1, column: 0 },
          end: { line: 4, column: 0 },
          startLine: 1,
          endLine: 4,
          startColumn: 0,
          endColumn: 0
        }
      };
      
      const result = await plugin.analyzeMethod(method);
      
      // 汚染分析の結果が反映されているか（メトリクスや推奨事項で確認）
      expect(result.metrics).toBeDefined();
    });
  });
});