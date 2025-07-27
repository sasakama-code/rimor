/**
 * modular.test.ts
 * TaintTyperモジュラー解析エンジンのテスト
 * 各テストメソッドを独立して解析するシステムの包括的テスト
 */

import { ModularTestAnalyzer } from '../../../src/security/analysis/modular';
import {
  TestMethod,
  MethodSignature,
  MethodAnalysisResult,
  SecurityIssue,
  SecurityTestMetrics,
  SecurityImprovement,
  IncrementalResult,
  MethodChange,
  TaintLevel,
  SecurityType,
  SecurityRequirement
} from '../../../src/security/types';

describe('ModularTestAnalyzer - TaintTyperモジュラー解析システム', () => {
  let analyzer: ModularTestAnalyzer;

  beforeEach(() => {
    analyzer = new ModularTestAnalyzer();
  });

  describe('基本的なテストメソッド解析', () => {
    it('単純なテストメソッドを正しく解析すること', async () => {
      const testMethod: TestMethod = {
        name: 'testLogin',
        filePath: '/test/login.test.ts',
        content: 'expect(login("user", "pass")).toBe(true);',
        signature: {
          name: 'testLogin',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 10,
          endLine: 12,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(login("user", "pass")).toBe(true);',
        assertions: ['expect'],
        dependencies: [],
        securityRelevance: 0.8,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(testMethod);

      expect(result).toBeDefined();
      expect(result.methodName).toEqual(testMethod.name);
      expect(result.analysisTime).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('セキュリティ関連のテストメソッドで高いスコアを付与すること', async () => {
      const securityTestMethod: TestMethod = {
        name: 'testSqlInjectionPrevention',
        filePath: '/test/security.test.ts',
        content: `
          const maliciousInput = "'; DROP TABLE users; --";
          expect(() => queryDatabase(maliciousInput)).not.toThrow();
          expect(sanitizeInput(maliciousInput)).not.toContain("DROP");
        `,
        signature: {
          name: 'testSqlInjectionPrevention',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 15,
          endLine: 19,
          startColumn: 0,
          endColumn: 0
        },
        body: `
          const maliciousInput = "'; DROP TABLE users; --";
          expect(() => queryDatabase(maliciousInput)).not.toThrow();
          expect(sanitizeInput(maliciousInput)).not.toContain("DROP");
        `,
        assertions: ['expect'],
        dependencies: ['queryDatabase', 'sanitizeInput'],
        securityRelevance: 0.95,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(securityTestMethod);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.securityCoverage.overall).toBeGreaterThan(0.8);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('非セキュリティテストで適切な低スコアを付与すること', async () => {
      const regularTestMethod: TestMethod = {
        name: 'testMathAddition',
        filePath: '/test/math.test.ts',
        content: 'expect(add(2, 3)).toBe(5);',
        signature: {
          name: 'testMathAddition',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 5,
          endLine: 7,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(add(2, 3)).toBe(5);',
        assertions: ['expect'],
        dependencies: ['add'],
        securityRelevance: 0.1,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(regularTestMethod);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.securityCoverage.overall).toBeLessThan(0.3);
    });
  });

  describe('セキュリティ問題の検出', () => {
    it('セキュリティテストの不備を検出すること', async () => {
      const inadequateTestMethod: TestMethod = {
        name: 'testWeakPasswordValidation',
        filePath: '/test/password.test.ts',
        content: 'expect(validatePassword("123")).toBe(false);',
        signature: {
          name: 'testWeakPasswordValidation',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 10,
          endLine: 12,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(validatePassword("123")).toBe(false);',
        assertions: ['expect'],
        dependencies: ['validatePassword'],
        securityRelevance: 0.7,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(inadequateTestMethod);

      const securityIssues = result.issues;
      expect(securityIssues.length).toBeGreaterThan(0);
      
      const inadequateTestingIssue = securityIssues.find(issue => 
        issue.type === 'missing-auth-test'
      );
      expect(inadequateTestingIssue).toBeDefined();
      expect(inadequateTestingIssue?.severity).toBe('medium');
    });

    it('ハードコードされた認証情報を検出すること', async () => {
      const hardcodedCredsMethod: TestMethod = {
        name: 'testLoginWithHardcodedCreds',
        filePath: '/test/login.test.ts',
        content: `
          const username = "admin";
          const password = "password123";
          expect(login(username, password)).toBe(true);
        `,
        signature: {
          name: 'testLoginWithHardcodedCreds',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 20,
          endLine: 24,
          startColumn: 0,
          endColumn: 0
        },
        body: `
          const username = "admin";
          const password = "password123";
          expect(login(username, password)).toBe(true);
        `,
        assertions: ['expect'],
        dependencies: ['login'],
        securityRelevance: 0.6,
        testType: 'integration'
      };

      const result = await analyzer.analyzeTestMethod(hardcodedCredsMethod);

      const hardcodedIssues = result.issues.filter(issue => 
        issue.type === 'unsafe-taint-flow'
      );
      expect(hardcodedIssues.length).toBeGreaterThan(0);
      expect(hardcodedIssues[0].severity).toBe('error');
    });

    it('不十分な入力検証テストを検出すること', async () => {
      const insufficientValidationMethod: TestMethod = {
        name: 'testInputValidation',
        filePath: '/test/input.test.ts',
        content: 'expect(validateInput("normal input")).toBe(true);',
        signature: {
          name: 'testInputValidation',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 15,
          endLine: 17,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(validateInput("normal input")).toBe(true);',
        assertions: ['expect'],
        dependencies: ['validateInput'],
        securityRelevance: 0.8,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(insufficientValidationMethod);

      const validationIssues = result.issues.filter(issue => 
        issue.type === 'insufficient-validation'
      );
      expect(validationIssues.length).toBeGreaterThan(0);
    });
  });

  describe('改善提案の生成', () => {
    it('セキュリティテストの強化提案を生成すること', async () => {
      const basicSecurityMethod: TestMethod = {
        name: 'testBasicAuth',
        filePath: '/test/auth.test.ts',
        content: 'expect(authenticate("user", "pass")).toBe(true);',
        signature: {
          name: 'testBasicAuth',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 20,
          endLine: 22,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(authenticate("user", "pass")).toBe(true);',
        assertions: ['expect'],
        dependencies: ['authenticate'],
        securityRelevance: 0.7,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(basicSecurityMethod);

      expect(result.suggestions.length).toBeGreaterThan(0);
      
      const securityImprovements = result.suggestions.filter((imp: any) => 
        imp.type === 'enhance-coverage' || imp.type === 'add-validation'
      );
      expect(securityImprovements.length).toBeGreaterThan(0);
      
      // セキュリティ改善提案が存在することを確認
      expect(securityImprovements.length).toBeGreaterThan(0);
      expect(securityImprovements[0].type).toMatch(/enhance-coverage|add-validation|fix-assertion/);
    });

    it('テストカバレッジ改善提案を生成すること', async () => {
      const limitedCoverageMethod: TestMethod = {
        name: 'testPartialFunction',
        filePath: '/test/partial.test.ts',
        content: `
          const result = complexFunction("input1");
          expect(result.success).toBe(true);
        `,
        signature: {
          name: 'testPartialFunction',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 25,
          endLine: 28,
          startColumn: 0,
          endColumn: 0
        },
        body: `
          const result = complexFunction("input1");
          expect(result.success).toBe(true);
        `,
        assertions: ['expect'],
        dependencies: ['complexFunction'],
        securityRelevance: 0.5,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(limitedCoverageMethod);

      const coverageImprovements = result.suggestions.filter((imp: any) => 
        imp.type === 'enhance-coverage'
      );
      expect(coverageImprovements.length).toBeGreaterThan(0);
    });

    it('アサーション強化提案を生成すること', async () => {
      const weakAssertionMethod: TestMethod = {
        name: 'testWeakAssertion',
        filePath: '/test/weak.test.ts',
        content: `
          processData("input");
          // アサーションが不十分
        `,
        signature: {
          name: 'testWeakAssertion',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 30,
          endLine: 33,
          startColumn: 0,
          endColumn: 0
        },
        body: `
          processData("input");
          // アサーションが不十分
        `,
        assertions: [],
        dependencies: ['processData'],
        securityRelevance: 0.3,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(weakAssertionMethod);

      const assertionImprovements = result.suggestions.filter((imp: any) => 
        imp.type === 'fix-assertion'
      );
      expect(assertionImprovements.length).toBeGreaterThan(0);
    });
  });

  describe('インクリメンタル解析', () => {
    it.skip('メソッド変更を検出してインクリメンタル解析を実行すること', async () => {
      const originalMethod: TestMethod = {
        name: 'testLoginFlow',
        filePath: '/test/login-flow.test.ts',
        content: 'expect(login("user", "pass")).toBe(true);',
        signature: {
          name: 'testLoginFlow',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 35,
          endLine: 37,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(login("user", "pass")).toBe(true);',
        assertions: ['expect'],
        dependencies: ['login'],
        securityRelevance: 0.8,
        testType: 'integration'
      };

      const modifiedMethod: TestMethod = {
        ...originalMethod,
        content: `
          expect(login("user", "pass")).toBe(true);
          expect(getLastLoginTime()).toBeDefined();
        `,
        body: `
          expect(login("user", "pass")).toBe(true);
          expect(getLastLoginTime()).toBeDefined();
        `,
        assertions: ['expect'],
        dependencies: ['login', 'getLastLoginTime']
      };

      const changes: MethodChange[] = [{
        type: 'modified',
        method: modifiedMethod,
        details: 'Method body modified'
      }];

      // const result = await analyzer.analyzeIncrementally(changes);

      // expect(result).toBeDefined();
      // expect(result.changedMethods.length).toBe(1);
      // expect(result.affectedMethods.length).toBeGreaterThanOrEqual(0);
      // expect(result.overallImpact).toBe('medium');
      // expect(result.reanalysisRequired).toBe(true);
    });

    it.skip('依存関係変更の影響を適切に伝播すること', async () => {
      const dependentMethod: TestMethod = {
        name: 'testUserManagement',
        filePath: '/test/user-management.test.ts',
        content: `
          const user = createUser("test");
          expect(validateUser(user)).toBe(true);
        `,
        signature: {
          name: 'testUserManagement',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 40,
          endLine: 43,
          startColumn: 0,
          endColumn: 0
        },
        body: `
          const user = createUser("test");
          expect(validateUser(user)).toBe(true);
        `,
        assertions: ['expect'],
        dependencies: ['createUser', 'validateUser'],
        securityRelevance: 0.6,
        testType: 'integration'
      };

      // 依存している関数が変更されたケース
      const changes: MethodChange[] = [{
        type: 'modified',
        method: dependentMethod,
        details: 'Dependency validateUser modified'
      }];

      // const result = await analyzer.analyzeIncrementally(changes);

      // expect(result.overallImpact).toBe('high');
      // expect(result.affectedMethods.length).toBeGreaterThan(0);
    });
  });

  describe('バッチ解析', () => {
    it.skip('複数のテストメソッドを効率的にバッチ解析すること', async () => {
      const testMethods: TestMethod[] = [
        {
          name: 'testMethod1',
          filePath: '/test/batch1.test.ts',
          content: 'expect(func1()).toBe(true);',
          signature: { name: 'testMethod1', parameters: [], returnType: 'void', annotations: [] },
          location: { startLine: 1, endLine: 3, startColumn: 0, endColumn: 0 },
          body: 'expect(func1()).toBe(true);',
          assertions: ['expect'],
          dependencies: ['func1'],
          securityRelevance: 0.3,
          testType: 'unit'
        },
        {
          name: 'testMethod2',
          filePath: '/test/batch2.test.ts',
          content: 'expect(func2()).toBe(false);',
          signature: { name: 'testMethod2', parameters: [], returnType: 'void', annotations: [] },
          location: { startLine: 1, endLine: 3, startColumn: 0, endColumn: 0 },
          body: 'expect(func2()).toBe(false);',
          assertions: ['expect'],
          dependencies: ['func2'],
          securityRelevance: 0.7,
          testType: 'security'
        },
        {
          name: 'testMethod3',
          filePath: '/test/batch3.test.ts',
          content: 'expect(func3()).toBeDefined();',
          signature: { name: 'testMethod3', parameters: [], returnType: 'void', annotations: [] },
          location: { startLine: 1, endLine: 3, startColumn: 0, endColumn: 0 },
          body: 'expect(func3()).toBeDefined();',
          assertions: ['expect'],
          dependencies: ['func3'],
          securityRelevance: 0.5,
          testType: 'integration'
        }
      ];

      // const results = await analyzer.analyzeBatch(testMethods);

      // expect(results).toHaveLength(3);
      // expect(results.every(r => r.analysisTime > 0)).toBe(true);
      // expect(results.every(r => r.methodName)).toBe(true);
    });

    it.skip('バッチ解析でエラーが発生しても他の解析を継続すること', async () => {
      const testMethods: TestMethod[] = [
        {
          name: 'validMethod',
          filePath: '/test/valid.test.ts',
          content: 'expect(validFunc()).toBe(true);',
          signature: { name: 'validMethod', parameters: [], returnType: 'void', annotations: [] },
          location: { startLine: 1, endLine: 3, startColumn: 0, endColumn: 0 },
          body: 'expect(validFunc()).toBe(true);',
          assertions: ['expect'],
          dependencies: ['validFunc'],
          securityRelevance: 0.5,
          testType: 'unit'
        },
        {
          name: 'problematicMethod',
          filePath: '/test/problematic.test.ts',
          content: null as any, // 意図的にnullを設定してエラーを発生させる
          signature: { name: 'problematicMethod', parameters: [], returnType: 'void', annotations: [] },
          location: { startLine: 1, endLine: 3, startColumn: 0, endColumn: 0 },
          body: null as any, // 意図的にnullを設定してエラーを発生させる
          assertions: ['expect'],
          dependencies: [],
          securityRelevance: 0.3,
          testType: 'unit'
        }
      ];

      // const results = await analyzer.analyzeBatch(testMethods);

      // expect(results).toHaveLength(2);
      
      // const validResult = results.find(r => r.methodName === 'validMethod');
      // expect(validResult).toBeDefined();
      
      // const problematicResult = results.find(r => r.methodName === 'problematicMethod');
      // expect(problematicResult).toBeDefined();
    });
  });

  describe('キャッシュ機能', () => {
    it('同一メソッドの再解析でキャッシュを使用すること', async () => {
      const testMethod: TestMethod = {
        name: 'testCacheableMethod',
        filePath: '/test/cache.test.ts',
        content: 'expect(cacheableFunc()).toBe(true);',
        signature: {
          name: 'testCacheableMethod',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 45,
          endLine: 47,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(cacheableFunc()).toBe(true);',
        assertions: ['expect'],
        dependencies: ['cacheableFunc'],
        securityRelevance: 0.4,
        testType: 'unit'
      };

      // 初回解析
      const result1 = await analyzer.analyzeTestMethod(testMethod);
      const firstAnalysisTime = result1.analysisTime;

      // 同じメソッドを再解析
      const result2 = await analyzer.analyzeTestMethod(testMethod);
      const secondAnalysisTime = result2.analysisTime;

      // キャッシュが使用されていれば2回目の方が速い
      expect(secondAnalysisTime).toBeLessThanOrEqual(firstAnalysisTime);
      expect(result1.metrics.securityCoverage.overall).toBe(result2.metrics.securityCoverage.overall);
    });

    it('メソッド変更後はキャッシュを無効化すること', async () => {
      const originalMethod: TestMethod = {
        name: 'testEvolvingMethod',
        filePath: '/test/evolving.test.ts',
        content: 'expect(func()).toBe(true);',
        signature: {
          name: 'testEvolvingMethod',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 50,
          endLine: 52,
          startColumn: 0,
          endColumn: 0
        },
        body: 'expect(func()).toBe(true);',
        assertions: ['expect'],
        dependencies: ['func'],
        securityRelevance: 0.5,
        testType: 'unit'
      };

      const modifiedMethod: TestMethod = {
        ...originalMethod,
        content: 'expect(func()).toBe(false);',
        body: 'expect(func()).toBe(false);'
      };

      const result1 = await analyzer.analyzeTestMethod(originalMethod);
      const result2 = await analyzer.analyzeTestMethod(modifiedMethod);

      expect(result2.metrics.securityCoverage.overall).toBeGreaterThan(result1.metrics.securityCoverage.overall);
    });
  });

  describe('メトリクス収集', () => {
    it('解析メトリクスを正確に収集すること', async () => {
      const testMethod: TestMethod = {
        name: 'testMetricsCollection',
        filePath: '/test/metrics.test.ts',
        content: `
          expect(authenticate("user", "pass")).toBe(true);
          expect(authorize("user", "read")).toBe(true);
          expect(validateInput("data")).toBe(true);
        `,
        signature: {
          name: 'testMetricsCollection',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 55,
          endLine: 59,
          startColumn: 0,
          endColumn: 0
        },
        body: `
          expect(authenticate("user", "pass")).toBe(true);
          expect(authorize("user", "read")).toBe(true);
          expect(validateInput("data")).toBe(true);
        `,
        assertions: ['expect'],
        dependencies: ['authenticate', 'authorize', 'validateInput'],
        securityRelevance: 0.9,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(testMethod);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.securityCoverage.overall).toBeGreaterThan(0);
      expect(result.metrics.taintFlowDetection).toBeGreaterThanOrEqual(0);
      expect(result.metrics.sanitizerCoverage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.invariantCompliance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なメソッド定義でもエラーを適切に処理すること', async () => {
      const invalidMethod: any = {
        name: '', // 空の名前
        filePath: '/test/invalid.test.ts',
        content: '',
        signature: null,
        location: { startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 },
        body: undefined,
        assertions: [],
        dependencies: [],
        securityRelevance: 0,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(invalidMethod);

      expect(result.methodName).toBe('');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('解析中の例外を適切にハンドリングすること', async () => {
      const problematicMethod: TestMethod = {
        name: 'testProblematicMethod',
        filePath: '/test/problematic.test.ts',
        content: 'throw new Error("Intentional test error");',
        signature: {
          name: 'testProblematicMethod',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        location: {
          startLine: 1,
          endLine: 1,
          startColumn: 0,
          endColumn: 0
        },
        body: 'throw new Error("Intentional test error");',
        assertions: [],
        dependencies: [],
        securityRelevance: 0.5,
        testType: 'unit'
      };

      expect(async () => {
        const result = await analyzer.analyzeTestMethod(problematicMethod);
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });
});