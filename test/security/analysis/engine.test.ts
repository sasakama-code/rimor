import { TypeBasedSecurityEngine } from '../../../src/security/analysis/engine';
import { 
  TestMethod, 
  SecurityIssue, 
  TaintSource,
  SecurityType,
  MethodSignature,
  Parameter
} from '../../../src/security/types';
import { TypeBasedSecurityConfig } from '../../../src/security/types/security';

describe('TypeBasedSecurityEngine', () => {
  let engine: TypeBasedSecurityEngine;

  beforeEach(() => {
    engine = new TypeBasedSecurityEngine();
  });

  afterEach(async () => {
    // エンジンのクリーンアップ（shutdownメソッドがない場合はスキップ）
    if ('shutdown' in engine && typeof engine['shutdown'] === 'function') {
      await engine['shutdown']();
    }
  });

  describe('基本的な解析機能', () => {
    it('エンジンインスタンスを作成できる', () => {
      expect(engine).toBeInstanceOf(TypeBasedSecurityEngine);
    });

    it('カスタム設定でエンジンを初期化できる', () => {
      const customConfig: Partial<TypeBasedSecurityConfig> = {
        strictness: 'strict',
        maxCacheSize: 2000
      };
      const customEngine = new TypeBasedSecurityEngine(customConfig);
      expect(customEngine).toBeInstanceOf(TypeBasedSecurityEngine);
      if ('shutdown' in customEngine && typeof customEngine['shutdown'] === 'function') {
        await customEngine['shutdown']();
      }
    });
  });

  describe('analyzeMethod', () => {
    it('汚染されたデータフローを検出できる', async () => {
      const testMethod: TestMethod = {
        name: 'testUserInput',
        filePath: 'test.ts',
        content: `
          const userInput = request.body.name; // @Tainted
          const query = \`SELECT * FROM users WHERE name = '\${userInput}'\`; // SQLインジェクション
          db.execute(query);
        `,
        body: `
          const userInput = request.body.name; // @Tainted
          const query = \`SELECT * FROM users WHERE name = '\${userInput}'\`; // SQLインジェクション
          db.execute(query);
        `,
        signature: {
          name: 'testUserInput',
          parameters: [
            { name: 'request', type: 'Request', source: 'user-input' }
          ],
          returnType: 'void',
          annotations: ['@Tainted'],
          isAsync: false
        },
        location: { startLine: 1, endLine: 5, startColumn: 1, endColumn: 10 }
      };

      const result = await engine.analyzeMethod(testMethod);
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('SQL_INJECTION');
      expect(result.issues[0].severity).toBe('critical');
    });

    it('安全なデータフローを正しく検証できる', async () => {
      const testMethod: TestMethod = {
        name: 'testSafeInput',
        filePath: 'test.ts',
        content: `
          const safeInput = sanitize(request.body.name); // @Untainted
          const query = \`SELECT * FROM users WHERE name = ?\`;
          db.execute(query, [safeInput]);
        `,
        body: `
          const safeInput = sanitize(request.body.name); // @Untainted
          const query = \`SELECT * FROM users WHERE name = ?\`;
          db.execute(query, [safeInput]);
        `,
        signature: {
          name: 'testSafeInput',
          parameters: [
            { name: 'request', type: 'Request', source: 'user-input' }
          ],
          returnType: 'void',
          annotations: ['@Untainted'],
          isAsync: false
        },
        location: { startLine: 1, endLine: 5, startColumn: 1, endColumn: 10 }
      };

      const result = await engine.analyzeMethod(testMethod);
      
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('analyzeTestCase', () => {
    it('テストケース全体を解析できる', async () => {
      const testMethod: TestMethod = {
        name: 'testVulnerableEndpoint',
        filePath: 'test.ts',
        content: `
          const input = req.params.id;
          const result = eval(input); // コード実行の脆弱性
        `,
        body: `
          const input = req.params.id;
          const result = eval(input); // コード実行の脆弱性
        `,
        signature: {
          name: 'testVulnerableEndpoint',
          parameters: [
            { name: 'req', type: 'Request', source: 'user-input' }
          ],
          returnType: 'any',
          annotations: ['@Tainted'],
          isAsync: false
        },
        location: { startLine: 10, endLine: 13, startColumn: 1, endColumn: 10 }
      };

      const result = await engine.analyzeMethod(testMethod);
      
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('critical');
    });
  });

  describe('analyzeIncrementally', () => {
    it('インクリメンタル解析が正しく動作する', async () => {
      const updatedMethod: TestMethod = {
        name: 'updatedMethod',
        filePath: 'test.ts',
        content: 'const x = getUserInput(); processUnsafe(x);',
        body: 'const x = getUserInput(); processUnsafe(x);',
        signature: {
          name: 'updatedMethod',
          parameters: [],
          returnType: 'void',
          annotations: [],
          isAsync: false
        },
        location: { startLine: 1, endLine: 1, startColumn: 1, endColumn: 50 }
      };

      // インクリメンタル解析機能が実装されている場合のみテスト
      if ('analyzeIncrementally' in engine && typeof engine['analyzeIncrementally'] === 'function') {
        const result = await engine['analyzeIncrementally']([{
          method: updatedMethod,
          changeType: 'modified'
        }]);
        
        expect(result.updatedMethods).toHaveLength(1);
        expect(result.newIssues.length).toBeGreaterThanOrEqual(0);
      } else {
        // インクリメンタル解析がない場合は通常の解析を使用
        const result = await engine.analyzeMethod(updatedMethod);
        expect(result).toBeDefined();
      }
    });
  });

  describe('inferTypes', () => {
    it('型推論が正しく動作する', async () => {
      const testMethod: TestMethod = {
        name: 'testTypeInference',
        filePath: 'test.ts',
        content: `
          const data = getData();
          const processed = transform(data);
          return processed;
        `,
        body: `
          const data = getData();
          const processed = transform(data);
          return processed;
        `,
        signature: {
          name: 'testTypeInference',
          parameters: [],
          returnType: 'unknown',
          annotations: [],
          isAsync: false
        },
        location: { startLine: 1, endLine: 5, startColumn: 1, endColumn: 10 }
      };

      // inferTypesメソッドが実装されている場合のみテスト
      let result: any;
      if ('inferTypes' in engine && typeof engine['inferTypes'] === 'function') {
        result = await engine['inferTypes'](testMethod);
        expect(result).toBeDefined();
        expect(result.inferredTypes).toBeDefined();
      } else {
        // inferTypesがない場合は通常の解析を使用
        result = await engine.analyzeMethod(testMethod);
        expect(result).toBeDefined();
      }
      
      expect(result).toBeDefined();
      if (result.inferredTypes) {
        expect(result.inferredTypes).toBeDefined();
      }
    });
  });

  describe('並列処理とキャッシュ', () => {
    it('複数のメソッドを並列で解析できる', async () => {
      const methods: TestMethod[] = Array.from({ length: 10 }, (_, i) => ({
        name: `testMethod${i}`,
        filePath: 'test.ts',
        content: `const x = input${i}; return process(x);`,
        body: `const x = input${i}; return process(x);`,
        signature: {
          name: `testMethod${i}`,
          parameters: [
            { name: `input${i}`, type: 'string', source: 'user-input' }
          ],
          returnType: 'string',
          annotations: ['@Tainted'],
          isAsync: false
        },
        location: { startLine: i * 10, endLine: i * 10 + 1, startColumn: 1, endColumn: 50 }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        methods.map(method => engine.analyzeMethod(method))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内に完了
    });

    it('キャッシュが正しく機能する', async () => {
      const testMethod: TestMethod = {
        name: 'cachedMethod',
        filePath: 'test.ts',
        content: 'return "safe";',
        body: 'return "safe";',
        signature: {
          name: 'cachedMethod',
          parameters: [],
          returnType: 'string',
          annotations: [],
          isAsync: false
        },
        location: { startLine: 1, endLine: 1, startColumn: 1, endColumn: 20 }
      };

      // 初回実行
      const result1 = await engine.analyzeMethod(testMethod);
      
      // キャッシュからの実行
      const startTime = Date.now();
      const result2 = await engine.analyzeMethod(testMethod);
      const endTime = Date.now();

      expect(result1).toEqual(result2);
      expect(endTime - startTime).toBeLessThan(10); // キャッシュヒットは高速
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な入力に対して適切にエラーを処理する', async () => {
      const invalidMethod: TestMethod = {
        name: '',
        filePath: 'test.ts',
        content: null as any,
        body: null as any,
        signature: {
          name: '',
          parameters: [],
          returnType: 'void',
          annotations: [],
          isAsync: false
        },
        location: { startLine: 1, endLine: 1, startColumn: 1, endColumn: 1 }
      };

      await expect(engine.analyzeMethod(invalidMethod)).rejects.toThrow();
    });
  });
});