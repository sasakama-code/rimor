/**
 * AssertionQualityPlugin 実質的品質テスト
 * Issue #66: アサーション品質評価の実際の動作を検証
 * 
 * TDD原則: アサーション品質の客観的評価
 * SOLID原則: 単一責任（アサーション品質のみ）
 * YAGNI原則: 必要な品質チェックのみ実装
 */

import { AssertionQualityPlugin } from '../../../src/plugins/core/AssertionQualityPlugin';
import { TestFile, ProjectContext, DetectionResult, QualityScore } from '../../../src/core/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AssertionQualityPlugin - アサーション品質の実質的検証', () => {
  let plugin: AssertionQualityPlugin;
  let testProjectPath: string;

  beforeEach(() => {
    plugin = new AssertionQualityPlugin();
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'assertion-test-'));
  });

  afterEach(() => {
    fs.rmSync(testProjectPath, { recursive: true, force: true });
  });

  describe('プラグインの基本機能', () => {
    it('プラグインが正しく初期化される', () => {
      expect(plugin).toBeDefined();
      expect(plugin.id).toBe('assertion-quality');
      expect(plugin.name).toContain('Assertion');
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(plugin.type).toBe('core');
    });

    it('適用可能なコンテキストを正しく判定する', () => {
      const jsContext: ProjectContext = {
        language: 'javascript',
        testFramework: 'jest'
      };
      
      const pythonContext: ProjectContext = {
        language: 'python',
        testFramework: 'pytest'
      };
      
      expect(plugin.isApplicable(jsContext)).toBe(true);
      expect(plugin.isApplicable(pythonContext)).toBe(true);
      
      // サポートされていない言語
      const rustContext: ProjectContext = {
        language: 'rust',
        testFramework: 'cargo'
      };
      expect(plugin.isApplicable(rustContext)).toBe(false);
    });
  });

  describe('アサーションパターンの検出', () => {
    it('基本的なアサーションを検出する', async () => {
      const testFile: TestFile = {
        path: path.join(testProjectPath, 'basic.test.ts'),
        content: `
          describe('BasicTest', () => {
            it('should have basic assertions', () => {
              expect(1 + 1).toBe(2);
              expect(true).toBeTruthy();
              expect(null).toBeNull();
            });
          });
        `,
        testCount: 1,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns).toBeDefined();
      expect(patterns.length).toBeGreaterThan(0);
      
      expect(patterns.some(p => p.patternName === 'Basic Assertions')).toBe(true);
      expect(patterns.every(p => p.confidence > 0)).toBe(true);
    });

    it('弱いアサーションを検出する', async () => {
      const testFile: TestFile = {
        path: path.join(testProjectPath, 'weak.test.ts'),
        content: `
          describe('WeakTest', () => {
            it('has weak assertions', () => {
              const result = someFunction();
              expect(result).toBeDefined();
              expect(result).not.toBeNull();
              expect(result).toBeTruthy();
            });
          });
        `,
        testCount: 1,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      const weakAssertions = patterns.filter(p => 
        p.patternName === 'Weak Assertions' || 
        (p.patternName && p.patternName.toLowerCase().includes('weak'))
      );
      
      expect(weakAssertions.length).toBeGreaterThan(0);
      expect(weakAssertions[0].confidence).toBeGreaterThan(0.5);
      expect(weakAssertions[0].evidence).toBeDefined();
    });

    it('強力なアサーションを検出する', async () => {
      const testFile: TestFile = {
        path: path.join(testProjectPath, 'strong.test.ts'),
        content: `
          describe('StrongTest', () => {
            it('has strong assertions', () => {
              const user = { id: 1, name: 'John', age: 30 };
              
              expect(user).toEqual({ id: 1, name: 'John', age: 30 });
              expect(user.name).toMatch(/^[A-Z][a-z]+$/);
              expect(user.age).toBeGreaterThanOrEqual(18);
              expect(user.age).toBeLessThan(100);
              expect(() => validateUser(user)).not.toThrow();
            });
          });
        `,
        testCount: 1,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      const strongAssertions = patterns.filter(p => 
        p.patternName === 'strong-assertion' || 
        p.patternName === 'deep-equality' ||
        p.severity === 'info'
      );
      
      expect(strongAssertions.length).toBeGreaterThan(0);
      expect(strongAssertions.every(p => p.confidence >= 0.8)).toBe(true);
    });

    it('アサーションがないテストを検出する', async () => {
      const testFile: TestFile = {
        path: path.join(testProjectPath, 'no-assertion.test.ts'),
        content: `
          describe('NoAssertionTest', () => {
            it('has no assertions', () => {
              const result = someFunction();
              console.log(result);
              // No assertions here
            });
            
            it('another test without assertions', () => {
              const data = fetchData();
              processData(data);
            });
          });
        `,
        testCount: 2,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      const noAssertionPatterns = patterns.filter(p => 
        p.patternName === 'no-assertion' || 
        p.patternName === 'missing-assertion'
      );
      
      expect(noAssertionPatterns.length).toBeGreaterThan(0);
      expect(noAssertionPatterns[0].severity).toBe('high');
      expect(noAssertionPatterns[0].confidence).toBeGreaterThan(0.9);
    });
  });

  describe('アサーション品質の評価', () => {
    it('高品質なアサーションに高スコアを付ける', async () => {
      const highQualityPatterns: DetectionResult[] = [
        {
          patternId: 'deep-equality',
          patternName: 'deep-equality',
          confidence: 0.95,
          severity: 'info',
          location: { file: 'test.ts', line: 10 }
        },
        {
          patternId: 'error-assertion',
          patternName: 'error-assertion',
          confidence: 0.9,
          severity: 'info',
          location: { file: 'test.ts', line: 15 }
        },
        {
          patternId: 'boundary-check',
          patternName: 'boundary-check',
          confidence: 0.85,
          severity: 'info',
          location: { file: 'test.ts', line: 20 }
        }
      ];
      
      const score = plugin.evaluateQuality(highQualityPatterns);
      
      expect(score.overall).toBeGreaterThan(0.8);
      expect(score.confidence).toBeGreaterThan(0.8);
      expect(score.dimensions.correctness).toBeGreaterThan(0.7);
      expect(score.dimensions.completeness).toBeGreaterThan(0.7);
    });

    it('低品質なアサーションに低スコアを付ける', async () => {
      const lowQualityPatterns: DetectionResult[] = [
        {
          patternId: 'weak-assertion',
          patternName: 'weak-assertion',
          confidence: 0.8,
          severity: 'low',
          location: { file: 'test.ts', line: 10 }
        },
        {
          patternId: 'no-assertion',
          patternName: 'no-assertion',
          confidence: 0.95,
          severity: 'high',
          location: { file: 'test.ts', line: 15 }
        }
      ];
      
      const score = plugin.evaluateQuality(lowQualityPatterns);
      
      expect(score.overall).toBeLessThan(0.5);
      expect(score.confidence).toBeGreaterThan(0.7); // 検出自体は確実
      expect(score.dimensions.correctness).toBeLessThan(0.5);
      expect(score.dimensions.completeness).toBeLessThan(0.4);
    });

    it('混在するアサーション品質を適切に評価する', async () => {
      const mixedPatterns: DetectionResult[] = [
        {
          patternId: 'strong-assertion',
          patternName: 'strong-assertion',
          confidence: 0.9,
          severity: 'info',
          location: { file: 'test.ts', line: 10 }
        },
        {
          patternId: 'weak-assertion',
          patternName: 'weak-assertion',
          confidence: 0.85,
          severity: 'low',
          location: { file: 'test.ts', line: 20 }
        },
        {
          patternId: 'basic-assertion',
          patternName: 'basic-assertion',
          confidence: 0.8,
          severity: 'info',
          location: { file: 'test.ts', line: 30 }
        }
      ];
      
      const score = plugin.evaluateQuality(mixedPatterns);
      
      expect(score.overall).toBeGreaterThan(0.4);
      expect(score.overall).toBeLessThan(0.8);
      expect(score.dimensions).toBeDefined();
      expect(Object.keys(score.dimensions).length).toBeGreaterThan(2);
    });
  });

  describe('改善提案の生成', () => {
    it('弱いアサーションに対する改善提案を生成する', () => {
      const evaluation: QualityScore = {
        overall: 0.3,
        confidence: 0.85,
        dimensions: {
          correctness: 0.4,
          completeness: 0.2,
          maintainability: 0.3
        }
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      expect(improvements).toBeDefined();
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].type).toBe('fix-assertion');
      expect(improvements[0].priority).toBe('high');
      expect(improvements[0].description).toContain('アサーション');
      expect(improvements[0].estimatedImpact).toBeGreaterThan(0.3);
    });

    it('アサーション欠如に対する追加提案を生成する', () => {
      const evaluation: QualityScore = {
        overall: 0.1,
        confidence: 0.95,
        dimensions: {
          correctness: 0.1,
          completeness: 0.2,
          maintainability: 0.0
        }
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      const addAssertionSuggestions = improvements.filter(i => 
        i.type === 'add-test' || i.type === 'fix-assertion'
      );
      
      expect(addAssertionSuggestions.length).toBeGreaterThan(0);
      expect(addAssertionSuggestions[0].priority).toBe('critical');
      expect(addAssertionSuggestions[0].autoFixable).toBe(false);
    });

    it('高品質な場合は最小限の提案に留める', () => {
      const evaluation: QualityScore = {
        overall: 0.9,
        confidence: 0.95,
        dimensions: {
          correctness: 0.95,
          completeness: 0.85,
          maintainability: 0.9
        }
      };
      
      const improvements = plugin.suggestImprovements(evaluation);
      
      expect(improvements.length).toBeLessThanOrEqual(2);
      if (improvements.length > 0) {
        expect(improvements[0].priority).toBe('low');
        expect(improvements[0].estimatedImpact).toBeLessThan(0.2);
      }
    });
  });

  describe('実際のテストファイル分析', () => {
    it('Jest形式のテストファイルを正しく分析する', async () => {
      const jestTestContent = `
        import { Calculator } from '../src/Calculator';
        
        describe('Calculator', () => {
          let calc: Calculator;
          
          beforeEach(() => {
            calc = new Calculator();
          });
          
          describe('addition', () => {
            it('should add two positive numbers', () => {
              expect(calc.add(2, 3)).toBe(5);
            });
            
            it('should handle negative numbers', () => {
              expect(calc.add(-5, 3)).toBe(-2);
              expect(calc.add(-5, -3)).toBe(-8);
            });
            
            it('should handle zero', () => {
              expect(calc.add(0, 5)).toBe(5);
              expect(calc.add(5, 0)).toBe(5);
              expect(calc.add(0, 0)).toBe(0);
            });
          });
          
          describe('division', () => {
            it('should divide numbers', () => {
              expect(calc.divide(10, 2)).toBe(5);
            });
            
            it('should throw on division by zero', () => {
              expect(() => calc.divide(10, 0)).toThrow('Division by zero');
            });
          });
        });
      `;
      
      const testFile: TestFile = {
        path: path.join(testProjectPath, 'calculator.test.ts'),
        content: jestTestContent,
        framework: 'jest',
        testCount: 5,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeGreaterThan(0.7); // 良好な品質
      expect(patterns.some(p => p.patternName === 'error-assertion')).toBe(true);
      expect(patterns.some(p => p.patternName === 'boundary-check')).toBe(true);
    });

    it('パフォーマンステストのアサーションを評価する', async () => {
      const perfTestContent = `
        describe('Performance Tests', () => {
          it('should complete within time limit', async () => {
            const startTime = Date.now();
            await performHeavyOperation();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(duration).toBeLessThan(1000);
            expect(duration).toBeGreaterThanOrEqual(0);
          });
          
          it('should handle concurrent requests', async () => {
            const promises = Array(100).fill(null).map(() => makeRequest());
            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(100);
            expect(results.every(r => r.status === 200)).toBe(true);
            expect(new Set(results.map(r => r.id)).size).toBe(100); // All unique
          });
        });
      `;
      
      const testFile: TestFile = {
        path: path.join(testProjectPath, 'performance.test.ts'),
        content: perfTestContent,
        testCount: 2,
        hasTests: true
      };
      
      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.patternName === 'performance-assertion')).toBe(true);
      expect(patterns.some(p => p.patternName === 'array-assertion')).toBe(true);
      const score = plugin.evaluateQuality(patterns);
      expect(score.dimensions.performance).toBeGreaterThan(0.6);
    });
  });
});