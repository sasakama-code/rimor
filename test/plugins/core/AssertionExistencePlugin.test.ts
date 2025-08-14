/**
 * AssertionExistencePlugin テスト
 * 
 * TDD RED段階: BasePluginを継承したAssertionExistencePluginのテスト
 * 既存のassertionExists.tsの機能を維持しつつ、新しいアーキテクチャに移行
 */

import { AssertionExistencePlugin } from '../../../src/plugins/core/AssertionExistencePlugin';
import { ProjectContext, TestFile, DetectionResult, QualityScore, Improvement } from '../../../src/core/types';

describe('AssertionExistencePlugin', () => {
  let plugin: AssertionExistencePlugin;

  beforeEach(() => {
    plugin = new AssertionExistencePlugin();
  });

  describe('Plugin Interface Compliance', () => {
    test('should have correct plugin metadata', () => {
      expect(plugin.id).toBe('assertion-existence');
      expect(plugin.name).toBe('Assertion Existence Checker');
      expect(plugin.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(plugin.type).toBe('core');
    });

    test('should implement ITestQualityPlugin interface', () => {
      expect(plugin.isApplicable).toBeDefined();
      expect(plugin.detectPatterns).toBeDefined();
      expect(plugin.evaluateQuality).toBeDefined();
      expect(plugin.suggestImprovements).toBeDefined();
    });
  });

  describe('isApplicable', () => {
    test('should return true for projects with test framework', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: { name: 'test-project', version: '1.0.0', devDependencies: { jest: '^27.0.0' } },
        testFramework: 'jest'
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });

    test('should return true even without explicit test framework', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: { name: 'test-project', version: '1.0.0' }
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });
  });

  describe('detectPatterns', () => {
    test('should detect missing assertions in test', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: `
          describe('Component', () => {
            test('should render', () => {
              const component = new Component();
              component.render();
              // No assertions
            });
          });
        `
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        patternId: 'missing-assertions',
        patternName: expect.stringContaining('Missing Assertions'),
        severity: 'high',
        confidence: expect.any(Number)
      });
    });

    test('should not detect issues when assertions exist', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: `
          describe('Component', () => {
            test('should render correctly', () => {
              const component = new Component();
              expect(component.render()).toBe('rendered');
              expect(component.state).toEqual({ loaded: true });
            });
          });
        `
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(0);
    });

    test('should detect weak assertions', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: `
          describe('Component', () => {
            test('should work', () => {
              const component = new Component();
              expect(component).toBeTruthy();
              expect(component.render).toBeDefined();
            });
          });
        `
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        patternId: 'weak-assertions',
        patternName: 'Weak Assertions',
        severity: 'medium',
        confidence: expect.any(Number)
      });
    });

    test('should detect multiple test blocks with missing assertions', async () => {
      const testFile: TestFile = {
        path: '/test/project/src/component.test.ts',
        content: `
          describe('Component', () => {
            test('test 1', () => {
              const component = new Component();
            });
            
            test('test 2', () => {
              const result = calculate();
            });
            
            test('test 3', () => {
              expect(true).toBe(true);
            });
          });
        `
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results.length).toBeGreaterThan(1);
      expect(results.filter(r => r.patternId === 'missing-assertions')).toHaveLength(2);
    });
  });

  describe('evaluateQuality', () => {
    test('should return low score for missing assertions', () => {
      const patterns: DetectionResult[] = [{
        patternId: 'missing-assertions',
        patternName: 'Missing Assertions',
        severity: 'high',
        confidence: 0.9,
        location: {
          file: '/test/project/src/component.test.ts',
          line: 3,
          column: 1
        }
      }];

      const score = plugin.evaluateQuality(patterns);

      expect(score.overall).toBeLessThan(50);
      expect(score.breakdown?.correctness).toBeLessThan(50);
      expect(score.breakdown?.completeness).toBeLessThan(100);
    });

    test('should return medium score for weak assertions', () => {
      const patterns: DetectionResult[] = [{
        patternId: 'weak-assertions',
        patternName: 'Weak Assertions',
        severity: 'medium',
        confidence: 0.7,
        location: {
          file: '/test/project/src/component.test.ts',
          line: 5,
          column: 1
        }
      }];

      const score = plugin.evaluateQuality(patterns);

      expect(score.overall).toBeGreaterThan(40);
      expect(score.overall).toBeLessThan(80);
      expect(score.breakdown?.correctness).toBeGreaterThan(40);
      expect(score.breakdown?.correctness).toBeLessThan(80);
    });

    test('should return high score when no issues detected', () => {
      const patterns: DetectionResult[] = [];

      const score = plugin.evaluateQuality(patterns);

      expect(score.overall).toBeGreaterThan(90);
      expect(score.breakdown?.correctness).toBe(100);
      expect(score.breakdown?.completeness).toBe(100);
    });

    test('should aggregate scores for multiple issues', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'missing-assertions',
          patternName: 'Missing Assertions',
          severity: 'high',
          confidence: 0.9,
          location: {
            file: '/test/project/src/component.test.ts',
            line: 3,
            column: 1
          }
        },
        {
          patternId: 'weak-assertions',
          patternName: 'Weak Assertions',
          severity: 'medium',
          confidence: 0.7,
          location: {
            file: '/test/project/src/utils.test.ts',
            line: 10,
            column: 1
          }
        }
      ];

      const score = plugin.evaluateQuality(patterns);

      expect(score.overall).toBeLessThan(40);
      expect(score.confidence).toBeGreaterThan(0);
    });
  });

  describe('suggestImprovements', () => {
    test('should suggest adding assertions for tests without them', () => {
      const evaluation: QualityScore = {
        overall: 30,
        dimensions: {
          completeness: 50,
          correctness: 20,
          maintainability: 80
        },
        confidence: 0.9
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements).toHaveLength(1);
      expect(improvements[0]).toMatchObject({
        priority: 'high',
        type: 'modify',
        category: 'assertion-improvement',
        title: expect.stringContaining('Add missing assertions'),
        estimatedImpact: expect.objectContaining({
          scoreImprovement: expect.any(Number),
          effortMinutes: expect.any(Number)
        })
      });
      if (typeof improvements[0].estimatedImpact === 'object' && improvements[0].estimatedImpact !== null && 'scoreImprovement' in improvements[0].estimatedImpact) {
        expect(improvements[0].estimatedImpact.scoreImprovement).toBeGreaterThan(0);
      } else if (typeof improvements[0].estimatedImpact === 'number') {
        expect(improvements[0].estimatedImpact).toBeGreaterThan(0);
      }
    });

    test('should suggest strengthening weak assertions', () => {
      const evaluation: QualityScore = {
        overall: 60,
        dimensions: {
          completeness: 0.8,
          correctness: 0.5,
          maintainability: 0.8
        },
        breakdown: {
          completeness: 80,
          correctness: 50,
          maintainability: 80
        },
        confidence: 0.7
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements).toHaveLength(1);
      expect(improvements[0]).toMatchObject({
        priority: 'medium',
        type: 'modify',
        category: 'assertion-improvement',
        title: expect.stringContaining('Strengthen weak assertions'),
        estimatedImpact: expect.objectContaining({
          scoreImprovement: expect.any(Number),
          effortMinutes: expect.any(Number)
        })
      });
    });

    test('should prioritize improvements by severity', () => {
      const evaluation: QualityScore = {
        overall: 40,
        dimensions: {
          completeness: 0.5,
          correctness: 0.3,
          maintainability: 0.7
        },
        breakdown: {
          completeness: 50,
          correctness: 30,
          maintainability: 70
        },
        confidence: 0.8
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements.length).toBeGreaterThanOrEqual(1);
      expect(improvements[0].priority).toBe('high');
    });

    test('should return no improvements for good quality', () => {
      const evaluation: QualityScore = {
        overall: 95,
        dimensions: {
          completeness: 1.0,
          correctness: 1.0,
          maintainability: 0.9
        },
        breakdown: {
          completeness: 100,
          correctness: 100,
          maintainability: 90
        },
        confidence: 1
      };

      const improvements = plugin.suggestImprovements(evaluation);

      expect(improvements).toHaveLength(0);
    });
  });

  describe('Helper methods from BasePlugin', () => {
    test('should use inherited isTestFile method', () => {
      // @ts-ignore - accessing protected method for testing
      expect(plugin.isTestFile).toBeDefined();
      
      // @ts-ignore - testing protected method
      expect(plugin.isTestFile('component.test.ts')).toBe(true);
      // @ts-ignore - testing protected method
      expect(plugin.isTestFile('component.spec.js')).toBe(true);
      // @ts-ignore - testing protected method
      expect(plugin.isTestFile('component.ts')).toBe(false);
    });

    test('should use inherited removeCommentsAndStrings method', () => {
      // @ts-ignore - accessing protected method for testing
      expect(plugin.removeCommentsAndStrings).toBeDefined();
      
      const codeWithComments = `
        // This is a comment
        const test = "string value";
        /* Multi-line
           comment */
        expect(true).toBe(true);
      `;
      
      // @ts-ignore - testing protected method
      const cleaned = plugin.removeCommentsAndStrings(codeWithComments);
      expect(cleaned).not.toContain('This is a comment');
      expect(cleaned).not.toContain('string value');
      expect(cleaned).not.toContain('Multi-line');
      expect(cleaned).toContain('expect');
    });
  });
});