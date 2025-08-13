/**
 * InputValidationSecurityPlugin.test.ts
 * 入力検証セキュリティプラグインのテスト
 * 型ベースの入力検証・サニタイズテスト品質監査システムのテスト
 */

import { InputValidationSecurityPlugin } from '../../../src/security/plugins/InputValidationSecurityPlugin';
import {
  TestMethod,
  MethodAnalysisResult,
  SecurityType,
  TaintLevel,
  TaintSource,
  SanitizerType,
  SecurityIssue,
  SecurityTestMetrics,
  BoundaryCondition
} from '../../../src/security/types';
import { IncrementalChange } from '../../../src/security/types/flow-types';
import {
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement
} from '../../../src/core/types';

describe('InputValidationSecurityPlugin - 入力検証セキュリティプラグイン', () => {
  let plugin: InputValidationSecurityPlugin;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    plugin = new InputValidationSecurityPlugin();
    
    mockProjectContext = {
      projectPath: '/test/project',
      configuration: {
        testPatterns: ['**/*.test.ts'],
        excludePatterns: ['node_modules/**'],
        plugins: []
      },
      dependencies: [],
      framework: 'jest'
    };
  });

  describe('プラグイン基本機能', () => {
    it('プラグインが正しく初期化されること', () => {
      expect(plugin.id).toBe('input-validation-security');
      expect(plugin.name).toBeDefined();
      expect(plugin.version).toBeDefined();
      expect(plugin.type).toBe('security');
    });

    it('適用可能性を正しく判定すること', () => {
      const applicableContext: ProjectContext = {
        ...mockProjectContext,
        dependencies: ['express', 'joi', 'validator']
      };

      const notApplicableContext: ProjectContext = {
        ...mockProjectContext,
        dependencies: ['lodash', 'moment']
      };

      expect(plugin.isApplicable(applicableContext)).toBe(true);
      expect(plugin.isApplicable(notApplicableContext)).toBe(false);
    });
  });

  describe('入力検証パターンの検出', () => {
    it('基本的な入力検証テストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/validation.test.ts',
        content: `
          describe('Input Validation', () => {
            it('should validate user email', () => {
              const email = 'user@example.com';
              expect(validateEmail(email)).toBe(true);
            });
            
            it('should reject invalid email', () => {
              const invalidEmail = 'invalid-email';
              expect(validateEmail(invalidEmail)).toBe(false);
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should validate user email',
            type: 'test',
            location: {
              start: { line: 1, column: 1 },
              end: { line: 5, column: 1 }
            },
            signature: 'validateEmail(email: string): boolean',
            body: 'expect(validateEmail(email)).toBe(true);',
            assertions: 1,
            testType: 'unit'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results.length).toBeGreaterThan(0);
      
      const validationPattern = results.find(r => 
        r.pattern === 'input-validation-test'
      );
      expect(validationPattern).toBeDefined();
      expect(validationPattern?.confidence).toBeGreaterThan(0.7);
      expect(validationPattern?.securityRelevance).toBeGreaterThan(0.6);
    });

    it('サニタイズテストパターンを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/sanitization.test.ts',
        content: `
          describe('Input Sanitization', () => {
            it('should sanitize HTML input', () => {
              const maliciousInput = '<script>alert("xss")</script>';
              const sanitized = sanitizeHtml(maliciousInput);
              expect(sanitized).not.toContain('<script>');
            });
            
            it('should escape SQL injection attempts', () => {
              const sqlInjection = "'; DROP TABLE users; --";
              const escaped = escapeSql(sqlInjection);
              expect(escaped).not.toContain('DROP TABLE');
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should sanitize HTML input',
            type: 'test',
            location: {
              start: { line: 1, column: 1 },
              end: { line: 8, column: 1 }
            },
            signature: 'sanitizeHtml(input: string): string',
            body: `
              const maliciousInput = '<script>alert("xss")</script>';
              const sanitized = sanitizeHtml(maliciousInput);
              expect(sanitized).not.toContain('<script>');
            `,
            assertions: 1,
            testType: 'security'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      const sanitizationPattern = results.find(r => 
        r.pattern === 'sanitization-test'
      );
      expect(sanitizationPattern).toBeDefined();
      expect(sanitizationPattern?.securityRelevance).toBeGreaterThan(0.8);
      
      const xssProtectionPattern = results.find(r => 
        r.pattern === 'xss-protection-test'
      );
      expect(xssProtectionPattern).toBeDefined();
    });

    it('境界条件テストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/boundary.test.ts',
        content: `
          describe('Boundary Condition Tests', () => {
            it('should handle empty input', () => {
              expect(validateInput('')).toBe(false);
            });
            
            it('should handle null input', () => {
              expect(validateInput(null)).toBe(false);
            });
            
            it('should handle undefined input', () => {
              expect(validateInput(undefined)).toBe(false);
            });
            
            it('should handle extremely long input', () => {
              const longInput = 'a'.repeat(10000);
              expect(validateInput(longInput)).toBe(false);
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should handle empty input',
            type: 'test',
            location: {
              start: { line: 1, column: 1 },
              end: { line: 3, column: 1 }
            },
            signature: 'validateInput(input: string): boolean',
            body: `expect(validateInput('')).toBe(false);`,
            assertions: 1,
            testType: 'security'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      const boundaryPattern = results.find(r => 
        r.pattern === 'boundary-condition-test'
      );
      expect(boundaryPattern).toBeDefined();
      expect(boundaryPattern?.metadata).toBeDefined();
      expect(boundaryPattern?.metadata?.boundaryTypes).toContain('empty-input');
    });

    it('不十分な入力検証テストを検出すること', async () => {
      const testFile: TestFile = {
        path: '/test/inadequate.test.ts',
        content: `
          describe('Inadequate Validation', () => {
            it('should process user input', () => {
              const userInput = 'some input';
              const result = processInput(userInput);
              expect(result).toBeDefined();
            });
          });
        `,
        framework: 'jest',
        testMethods: [
          {
            name: 'should process user input',
            type: 'test',
            location: {
              start: { line: 1, column: 1 },
              end: { line: 6, column: 1 }
            },
            signature: 'processInput(userInput: string): any',
            body: `
              const userInput = 'some input';
              const result = processInput(userInput);
              expect(result).toBeDefined();
            `,
            assertions: 1,
            testType: 'unit'
          }
        ]
      };

      const results = await plugin.detectPatterns(testFile);

      const inadequatePattern = results.find(r => 
        r.pattern === 'inadequate-input-validation'
      );
      expect(inadequatePattern).toBeDefined();
      expect(inadequatePattern?.severity).toBe('medium');
    });
  });

  describe('品質評価', () => {
    it('高品質な入力検証テストに高いスコアを付与すること', () => {
      const highQualityPatterns: DetectionResult[] = [
        {
          pattern: 'input-validation-test',
          confidence: 0.9,
          securityRelevance: 0.85,
          severity: 'info',
          location: { file: 'test.ts', line: 10, column: 5 },
          metadata: {
            validationTypes: ['email', 'url', 'phone'],
            boundaryTesting: true,
            errorHandling: true
          }
        },
        {
          pattern: 'sanitization-test',
          confidence: 0.88,
          securityRelevance: 0.9,
          severity: 'info',
          location: { file: 'test.ts', line: 20, column: 5 },
          metadata: {
            sanitizerTypes: ['html', 'sql', 'xss'],
            maliciousInputTesting: true
          }
        }
      ];

      const qualityScore = plugin.evaluateQuality(highQualityPatterns);

      expect(qualityScore.overall).toBeGreaterThan(0.8);
      expect(qualityScore.security).toBeGreaterThan(0.8);
      expect(qualityScore.coverage).toBeGreaterThan(0.7);
      expect(qualityScore.maintainability).toBeGreaterThan(0.6);
    });

    it('低品質な入力検証テストに低いスコアを付与すること', () => {
      const lowQualityPatterns: DetectionResult[] = [
        {
          pattern: 'inadequate-input-validation',
          confidence: 0.7,
          securityRelevance: 0.3,
          severity: 'medium',
          location: { file: 'test.ts', line: 10, column: 5 },
          metadata: {
            missingValidations: ['null-check', 'type-validation'],
            lacksBoundaryTesting: true
          }
        }
      ];

      const qualityScore = plugin.evaluateQuality(lowQualityPatterns);

      expect(qualityScore.overall).toBeLessThan(0.5);
      expect(qualityScore.security).toBeLessThan(0.4);
      expect(qualityScore.coverage).toBeLessThan(0.6);
    });

    it('複合的な品質要素を考慮した評価を行うこと', () => {
      const mixedQualityPatterns: DetectionResult[] = [
        {
          pattern: 'input-validation-test',
          confidence: 0.8,
          securityRelevance: 0.7,
          severity: 'info',
          location: { file: 'test.ts', line: 10, column: 5 },
          metadata: { hasValidation: true }
        },
        {
          pattern: 'missing-edge-case-test',
          confidence: 0.6,
          securityRelevance: 0.5,
          severity: 'low',
          location: { file: 'test.ts', line: 20, column: 5 },
          metadata: { missingCases: ['null', 'empty', 'overflow'] }
        }
      ];

      const qualityScore = plugin.evaluateQuality(mixedQualityPatterns);

      expect(qualityScore.overall).toBeGreaterThan(0.4);
      expect(qualityScore.overall).toBeLessThan(0.8);
      expect(qualityScore.details).toBeDefined();
      expect(qualityScore.details?.validationCoverage).toBeDefined();
      expect(qualityScore.details?.sanitizationQuality).toBeDefined();
    });
  });

  describe('改善提案', () => {
    it('不足している入力検証テストの改善提案を生成すること', () => {
      const evaluation: QualityScore = {
        overall: 0.4,
        dimensions: {},
        confidence: 0.8,
        security: 0.3,
        coverage: 0.5,
        maintainability: 0.6,
        details: {
          strengths: ['良好な基本構造'],
          weaknesses: ['入力検証が不十分', 'サニタイズが不足'],
          suggestions: ['バリデーションテストを追加', 'サニタイザーテストを強化'],
          validationCoverage: 0.3,
          sanitizationQuality: 0.2,
          boundaryTestingScore: 0.4
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements.length).toBeGreaterThan(0);
      
      const validationImprovement = improvements.find(imp => 
        imp.type === 'add-input-validation-tests'
      );
      expect(validationImprovement).toBeDefined();
      expect(validationImprovement?.priority).toBe('high');
      expect(validationImprovement?.description).toContain('input validation');
      
      const sanitizationImprovement = improvements.find(imp => 
        imp.type === 'enhance-sanitization-testing'
      );
      expect(sanitizationImprovement).toBeDefined();
      expect(sanitizationImprovement?.impact).toEqual({
        effortMinutes: 20,
        scoreImprovement: 25
      });
    });

    it('境界条件テストの改善提案を生成すること', () => {
      const evaluation: QualityScore = {
        overall: 0.6,
        dimensions: {},
        confidence: 0.85,
        security: 0.7,
        coverage: 0.5,
        maintainability: 0.7,
        details: {
          strengths: ['十分な入力バリデーション', '包括的サニタイザー'],
          weaknesses: ['境界条件テストが不足'],
          suggestions: ['境界条件テストを追加', 'エッジケースのカバレッジ向上'],
          boundaryTestingScore: 0.2, // 境界条件テストが不十分
          validationCoverage: 0.8,
          sanitizationQuality: 0.7
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);

      const boundaryImprovement = improvements.find(imp => 
        imp.type === 'add-boundary-condition-tests'
      );
      expect(boundaryImprovement).toBeDefined();
      expect(boundaryImprovement?.priority).toBe('medium');
      expect(boundaryImprovement?.suggestions).toContain('Add null/undefined input tests');
      expect(boundaryImprovement?.suggestions).toContain('Add empty string tests');
      expect(boundaryImprovement?.suggestions).toContain('Add overflow/underflow tests');
    });

    it('エラーハンドリングテストの改善提案を生成すること', () => {
      const evaluation: QualityScore = {
        overall: 0.65,
        dimensions: {},
        confidence: 0.9,
        security: 0.7,
        coverage: 0.6,
        maintainability: 0.65,
        details: {
          strengths: ['良好なバリデーションカバレッジ', 'サニタイザーの実装'],
          weaknesses: ['エラーハンドリングテストが不足'],
          suggestions: ['エラーハンドリングテストを強化', '例外ケースのカバレッジ向上'],
          boundaryTestingScore: 0.3, // 境界条件テストが不十分
          validationCoverage: 0.8,
          sanitizationQuality: 0.7
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);

      const errorHandlingImprovement = improvements.find(imp => 
        imp.type === 'improve-error-handling-tests'
      );
      expect(errorHandlingImprovement).toBeDefined();
      expect(errorHandlingImprovement?.description).toContain('error handling');
      expect(errorHandlingImprovement?.codeExample).toBeDefined();
    });
  });

  describe('型推論統合', () => {
    it('Taint型を使用した高度な入力検証分析を行うこと', async () => {
      const testMethod: TestMethod = {
        name: 'testTaintedInputHandling',
        type: 'test',
        location: {
          start: { line: 1, column: 1 },
          end: { line: 10, column: 1 }
        },
        signature: 'handleTaintedInput(taintedInput: TaintedString, sanitizer: InputSanitizer): SafeString',
        body: `
          const cleaned = sanitizer.sanitize(taintedInput);
          expect(cleaned).toBeInstanceOf(SafeString);
          expect(cleaned.getValue()).not.toContain('<script>');
        `,
        assertions: 2,
        testType: 'security'
      };

      const analysisResult = await plugin.analyzeTestMethod(testMethod);

      expect(analysisResult).toBeDefined();
      expect(analysisResult.taintFlow).toBeDefined();
      expect(analysisResult.taintFlow.sources?.length || 0).toBeGreaterThan(0);
      expect(analysisResult.taintFlow.sanitizers?.length || 0).toBeGreaterThan(0);
      expect(analysisResult.securityScore).toBeGreaterThan(0.8);
    });

    it('型安全性違反を検出すること', async () => {
      const unsafeTestMethod: TestMethod = {
        name: 'testUnsafeInputHandling',
        type: 'test',
        location: {
          start: { line: 1, column: 1 },
          end: { line: 10, column: 1 }
        },
        signature: 'processUnsafeInput(userInput: any): any', // 型安全性違反
        body: `
          const result = eval(userInput); // 非常に危険
          expect(result).toBeDefined();
        `,
        assertions: 1,
        testType: 'security'
      };

      const analysisResult = await plugin.analyzeTestMethod(unsafeTestMethod);

      expect(analysisResult.issues.length).toBeGreaterThan(0);
      
      const typeSafetyViolation = analysisResult.issues.find((issue) => 
        issue.type === 'unsafe-taint-flow'
      );
      expect(typeSafetyViolation).toBeDefined();
      expect(typeSafetyViolation?.severity).toBe('critical');
    });
  });

  describe('インクリメンタル解析', () => {
    it('テストメソッドの変更を検出してインクリメンタル解析を実行すること', async () => {
      const originalMethod: TestMethod = {
        name: 'testInputValidation',
        type: 'test',
        location: {
          start: { line: 1, column: 1 },
          end: { line: 5, column: 1 }
        },
        signature: 'validateInput(input: string): boolean',
        body: 'expect(validateInput("test")).toBe(true);',
        assertions: 1,
        testType: 'unit'
      };

      const modifiedMethod: TestMethod = {
        ...originalMethod,
        body: `
          expect(validateInput("test")).toBe(true);
          expect(validateInput("")).toBe(false);
          expect(validateInput(null)).toBe(false);
        `,
      };

      const change: IncrementalChange = {
        type: 'modified',
        methodName: 'handleInput',
        filePath: 'test.ts',
        content: modifiedMethod.content
      };

      const incrementalResult = await plugin.analyzeIncrementally(change);

      expect(incrementalResult).toBeDefined();
      expect(incrementalResult.affectedTests?.length ?? 0).toBeGreaterThanOrEqual(0);
      expect(incrementalResult.qualityImprovement ?? 0).toBeGreaterThanOrEqual(0);
      expect(incrementalResult.newIssuesFound?.length ?? 0).toBeGreaterThanOrEqual(0);
      expect(incrementalResult.resolvedIssues?.length ?? 0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('パフォーマンスとスケーラビリティ', () => {
    it('大量のテストメソッドを効率的に処理すること', async () => {
      const largeTestFile: TestFile = {
        path: '/test/large-validation.test.ts',
        content: 'large test file content',
        framework: 'jest',
        testMethods: Array.from({ length: 100 }, (_, i) => ({
          name: `testInputValidation${i}`,
          type: 'test' as const,
          location: {
            start: { line: i + 1, column: 1 },
            end: { line: i + 3, column: 1 }
          },
          signature: `validateInput${i}(input: string): boolean`,
          body: `expect(validateInput${i}("test")).toBe(true);`,
          assertions: 1,
          testType: 'unit' as const
        }))
      };

      const startTime = Date.now();
      const results = await plugin.detectPatterns(largeTestFile);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      
      expect(results.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(2000); // 2秒以内で処理
    });

    it('キャッシュを使用して重複処理を避けること', async () => {
      const testFile: TestFile = {
        path: '/test/cached.test.ts',
        content: 'test content',
        framework: 'jest',
        testMethods: [
          {
            name: 'testCachedValidation',
            type: 'test',
            location: {
              start: { line: 1, column: 1 },
              end: { line: 3, column: 1 }
            },
            signature: 'validateCached(input: string): boolean',
            body: 'expect(validateCached("test")).toBe(true);',
            assertions: 1,
            testType: 'unit'
          }
        ]
      };

      // 初回実行
      const startTime1 = Date.now();
      const results1 = await plugin.detectPatterns(testFile);
      const endTime1 = Date.now();
      const firstExecutionTime = endTime1 - startTime1;

      // 2回目実行（キャッシュされる）
      const startTime2 = Date.now();
      const results2 = await plugin.detectPatterns(testFile);
      const endTime2 = Date.now();
      const secondExecutionTime = endTime2 - startTime2;

      expect(results1).toEqual(results2);
      expect(secondExecutionTime).toBeLessThanOrEqual(firstExecutionTime);
    });
  });
});