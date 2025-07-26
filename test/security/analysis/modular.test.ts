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
        signature: {
          name: 'testLogin',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(login("user", "pass")).toBe(true);',
        assertions: ['expect'],
        dependencies: [],
        securityRelevance: 0.8,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(testMethod);

      expect(result).toBeDefined();
      expect(result.method).toEqual(testMethod);
      expect(result.analysisComplete).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.improvements)).toBe(true);
      expect(typeof result.securityScore).toBe('number');
    });

    it('セキュリティ関連のテストメソッドで高いスコアを付与すること', async () => {
      const securityTestMethod: TestMethod = {
        name: 'testSqlInjectionPrevention',
        signature: {
          name: 'testSqlInjectionPrevention',
          parameters: [],
          returnType: 'void',
          annotations: []
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

      expect(result.securityScore).toBeGreaterThan(0.8);
      expect(result.riskMitigation).toBeGreaterThan(0.5);
      expect(result.testCoverageContribution).toBeGreaterThan(0.0);
    });

    it('非セキュリティテストで適切な低スコアを付与すること', async () => {
      const regularTestMethod: TestMethod = {
        name: 'testMathAddition',
        signature: {
          name: 'testMathAddition',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(add(2, 3)).toBe(5);',
        assertions: ['expect'],
        dependencies: ['add'],
        securityRelevance: 0.1,
        testType: 'unit'
      };

      const result = await analyzer.analyzeTestMethod(regularTestMethod);

      expect(result.securityScore).toBeLessThan(0.3);
      expect(result.riskMitigation).toBeLessThan(0.2);
    });
  });

  describe('セキュリティ問題の検出', () => {
    it('セキュリティテストの不備を検出すること', async () => {
      const inadequateTestMethod: TestMethod = {
        name: 'testWeakPasswordValidation',
        signature: {
          name: 'testWeakPasswordValidation',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(validatePassword("123")).toBe(false);',
        assertions: ['expect'],
        dependencies: ['validatePassword'],
        securityRelevance: 0.7,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(inadequateTestMethod);

      const securityIssues = result.issues.filter(issue => issue.category === 'security');
      expect(securityIssues.length).toBeGreaterThan(0);
      
      const inadequateTestingIssue = securityIssues.find(issue => 
        issue.type === 'inadequate-security-testing'
      );
      expect(inadequateTestingIssue).toBeDefined();
      expect(inadequateTestingIssue?.severity).toBe('medium');
    });

    it('ハードコードされた認証情報を検出すること', async () => {
      const hardcodedCredsMethod: TestMethod = {
        name: 'testLoginWithHardcodedCreds',
        signature: {
          name: 'testLoginWithHardcodedCreds',
          parameters: [],
          returnType: 'void',
          annotations: []
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
        issue.type === 'hardcoded-credentials'
      );
      expect(hardcodedIssues.length).toBeGreaterThan(0);
      expect(hardcodedIssues[0].severity).toBe('high');
    });

    it('不十分な入力検証テストを検出すること', async () => {
      const insufficientValidationMethod: TestMethod = {
        name: 'testInputValidation',
        signature: {
          name: 'testInputValidation',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(validateInput("normal input")).toBe(true);',
        assertions: ['expect'],
        dependencies: ['validateInput'],
        securityRelevance: 0.8,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(insufficientValidationMethod);

      const validationIssues = result.issues.filter(issue => 
        issue.type === 'insufficient-input-validation-testing'
      );
      expect(validationIssues.length).toBeGreaterThan(0);
    });
  });

  describe('改善提案の生成', () => {
    it('セキュリティテストの強化提案を生成すること', async () => {
      const basicSecurityMethod: TestMethod = {
        name: 'testBasicAuth',
        signature: {
          name: 'testBasicAuth',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(authenticate("user", "pass")).toBe(true);',
        assertions: ['expect'],
        dependencies: ['authenticate'],
        securityRelevance: 0.7,
        testType: 'security'
      };

      const result = await analyzer.analyzeTestMethod(basicSecurityMethod);

      expect(result.improvements.length).toBeGreaterThan(0);
      
      const securityImprovements = result.improvements.filter(imp => 
        imp.category === 'security-testing'
      );
      expect(securityImprovements.length).toBeGreaterThan(0);
      
      const edgeCaseImprovement = securityImprovements.find(imp => 
        imp.type === 'add-edge-case-tests'
      );
      expect(edgeCaseImprovement).toBeDefined();
      expect(edgeCaseImprovement?.priority).toBe('high');
    });

    it('テストカバレッジ改善提案を生成すること', async () => {
      const limitedCoverageMethod: TestMethod = {
        name: 'testPartialFunction',
        signature: {
          name: 'testPartialFunction',
          parameters: [],
          returnType: 'void',
          annotations: []
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

      const coverageImprovements = result.improvements.filter(imp => 
        imp.type === 'increase-test-coverage'
      );
      expect(coverageImprovements.length).toBeGreaterThan(0);
    });

    it('アサーション強化提案を生成すること', async () => {
      const weakAssertionMethod: TestMethod = {
        name: 'testWeakAssertion',
        signature: {
          name: 'testWeakAssertion',
          parameters: [],
          returnType: 'void',
          annotations: []
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

      const assertionImprovements = result.improvements.filter(imp => 
        imp.type === 'strengthen-assertions'
      );
      expect(assertionImprovements.length).toBeGreaterThan(0);
    });
  });

  describe('インクリメンタル解析', () => {
    it('メソッド変更を検出してインクリメンタル解析を実行すること', async () => {
      const originalMethod: TestMethod = {
        name: 'testLoginFlow',
        signature: {
          name: 'testLoginFlow',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(login("user", "pass")).toBe(true);',
        assertions: ['expect'],
        dependencies: ['login'],
        securityRelevance: 0.8,
        testType: 'integration'
      };

      const modifiedMethod: TestMethod = {
        ...originalMethod,
        body: `
          expect(login("user", "pass")).toBe(true);
          expect(getLastLoginTime()).toBeDefined();
        `,
        assertions: ['expect'],
        dependencies: ['login', 'getLastLoginTime']
      };

      const changes: MethodChange[] = [{
        type: 'body-modified',
        oldMethod: originalMethod,
        newMethod: modifiedMethod,
        impact: 'medium'
      }];

      const result = await analyzer.analyzeIncrementally(changes);

      expect(result).toBeDefined();
      expect(result.changedMethods.length).toBe(1);
      expect(result.affectedMethods.length).toBeGreaterThanOrEqual(0);
      expect(result.overallImpact).toBe('medium');
      expect(result.reanalysisRequired).toBe(true);
    });

    it('依存関係変更の影響を適切に伝播すること', async () => {
      const dependentMethod: TestMethod = {
        name: 'testUserManagement',
        signature: {
          name: 'testUserManagement',
          parameters: [],
          returnType: 'void',
          annotations: []
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
        type: 'dependency-modified',
        oldMethod: dependentMethod,
        newMethod: dependentMethod,
        impact: 'high',
        affectedDependencies: ['validateUser']
      }];

      const result = await analyzer.analyzeIncrementally(changes);

      expect(result.overallImpact).toBe('high');
      expect(result.affectedMethods.length).toBeGreaterThan(0);
    });
  });

  describe('バッチ解析', () => {
    it('複数のテストメソッドを効率的にバッチ解析すること', async () => {
      const testMethods: TestMethod[] = [
        {
          name: 'testMethod1',
          signature: { name: 'testMethod1', parameters: [], returnType: 'void', annotations: [] },
          body: 'expect(func1()).toBe(true);',
          assertions: ['expect'],
          dependencies: ['func1'],
          securityRelevance: 0.3,
          testType: 'unit'
        },
        {
          name: 'testMethod2',
          signature: { name: 'testMethod2', parameters: [], returnType: 'void', annotations: [] },
          body: 'expect(func2()).toBe(false);',
          assertions: ['expect'],
          dependencies: ['func2'],
          securityRelevance: 0.7,
          testType: 'security'
        },
        {
          name: 'testMethod3',
          signature: { name: 'testMethod3', parameters: [], returnType: 'void', annotations: [] },
          body: 'expect(func3()).toBeDefined();',
          assertions: ['expect'],
          dependencies: ['func3'],
          securityRelevance: 0.5,
          testType: 'integration'
        }
      ];

      const results = await analyzer.analyzeBatch(testMethods);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.analysisComplete)).toBe(true);
      expect(results.every(r => r.executionTime > 0)).toBe(true);
    });

    it('バッチ解析でエラーが発生しても他の解析を継続すること', async () => {
      const testMethods: TestMethod[] = [
        {
          name: 'validMethod',
          signature: { name: 'validMethod', parameters: [], returnType: 'void', annotations: [] },
          body: 'expect(validFunc()).toBe(true);',
          assertions: ['expect'],
          dependencies: ['validFunc'],
          securityRelevance: 0.5,
          testType: 'unit'
        },
        {
          name: 'problematicMethod',
          signature: { name: 'problematicMethod', parameters: [], returnType: 'void', annotations: [] },
          body: null as any, // 意図的にnullを設定してエラーを発生させる
          assertions: ['expect'],
          dependencies: [],
          securityRelevance: 0.3,
          testType: 'unit'
        }
      ];

      const results = await analyzer.analyzeBatch(testMethods);

      expect(results).toHaveLength(2);
      
      const validResult = results.find(r => r.method.name === 'validMethod');
      expect(validResult?.analysisComplete).toBe(true);
      
      const problematicResult = results.find(r => r.method.name === 'problematicMethod');
      expect(problematicResult?.analysisComplete).toBe(false);
      expect(problematicResult?.error).toBeDefined();
    });
  });

  describe('キャッシュ機能', () => {
    it('同一メソッドの再解析でキャッシュを使用すること', async () => {
      const testMethod: TestMethod = {
        name: 'testCacheableMethod',
        signature: {
          name: 'testCacheableMethod',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(cacheableFunc()).toBe(true);',
        assertions: ['expect'],
        dependencies: ['cacheableFunc'],
        securityRelevance: 0.4,
        testType: 'unit'
      };

      // 初回解析
      const result1 = await analyzer.analyzeTestMethod(testMethod);
      const firstAnalysisTime = result1.executionTime;

      // 同じメソッドを再解析
      const result2 = await analyzer.analyzeTestMethod(testMethod);
      const secondAnalysisTime = result2.executionTime;

      // キャッシュが使用されていれば2回目の方が速い
      expect(secondAnalysisTime).toBeLessThanOrEqual(firstAnalysisTime);
      expect(result1.securityScore).toBe(result2.securityScore);
    });

    it('メソッド変更後はキャッシュを無効化すること', async () => {
      const originalMethod: TestMethod = {
        name: 'testEvolvingMethod',
        signature: {
          name: 'testEvolvingMethod',
          parameters: [],
          returnType: 'void',
          annotations: []
        },
        body: 'expect(func()).toBe(true);',
        assertions: ['expect'],
        dependencies: ['func'],
        securityRelevance: 0.3,
        testType: 'unit'
      };

      const modifiedMethod: TestMethod = {
        ...originalMethod,
        body: 'expect(func()).toBe(true); expect(func2()).toBe(false);',
        dependencies: ['func', 'func2'],
        securityRelevance: 0.6
      };

      // 初回解析
      const result1 = await analyzer.analyzeTestMethod(originalMethod);

      // メソッド変更後の解析
      const result2 = await analyzer.analyzeTestMethod(modifiedMethod);

      // キャッシュが無効化されて異なる結果になることを確認
      expect(result1.securityScore).not.toBe(result2.securityScore);
      expect(result2.securityScore).toBeGreaterThan(result1.securityScore);
    });
  });

  describe('メトリクス収集', () => {
    it('解析メトリクスを正確に収集すること', async () => {
      const testMethod: TestMethod = {
        name: 'testMetricsCollection',
        signature: {
          name: 'testMetricsCollection',
          parameters: [],
          returnType: 'void',
          annotations: []
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
      expect(result.metrics.totalAssertions).toBe(3);
      expect(result.metrics.securityAssertions).toBeGreaterThan(0);
      expect(result.metrics.coverageContribution).toBeGreaterThan(0);
      expect(result.metrics.complexityScore).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なメソッド定義でもエラーを適切に処理すること', async () => {
      const invalidMethod = {
        name: '', // 空の名前
        signature: null as any,
        body: undefined as any,
        assertions: [],
        dependencies: [],
        securityRelevance: 0,
        testType: 'unit' as const
      };

      const result = await analyzer.analyzeTestMethod(invalidMethod);

      expect(result.analysisComplete).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('解析中の例外を適切にハンドリングすること', async () => {
      const problematicMethod: TestMethod = {
        name: 'testProblematicMethod',
        signature: {
          name: 'testProblematicMethod',
          parameters: [],
          returnType: 'void',
          annotations: []
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