import { TestCompletenessPlugin } from '../src/plugins/core/TestCompletenessPlugin';
import { ProjectContext, TestFile } from '../src/core/types';

describe('TestCompletenessPlugin', () => {
  let plugin: TestCompletenessPlugin;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    plugin = new TestCompletenessPlugin();
    mockProjectContext = {
      rootPath: '/test/project',
      language: 'typescript',
      testFramework: 'jest',
      filePatterns: {
        test: ['**/*.test.ts', '**/*.spec.ts'],
        source: ['**/*.ts'],
        ignore: ['**/node_modules/**']
      }
    };
  });

  it('should have correct plugin metadata', () => {
    expect(plugin.id).toBe('test-completeness');
    expect(plugin.name).toBe('Test Completeness Analyzer');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.type).toBe('core');
  });

  it('should be applicable to all contexts', () => {
    expect(plugin.isApplicable(mockProjectContext)).toBe(true);
    
    const jsContext = { ...mockProjectContext, language: 'javascript' as const };
    expect(plugin.isApplicable(jsContext)).toBe(true);
  });

  describe('detectPatterns', () => {
    it('should detect comprehensive test patterns', async () => {
      const comprehensiveTestFile: TestFile = {
        path: '/test/project/comprehensive.test.ts',
        content: `
          describe('UserService', () => {
            beforeEach(() => {
              // setup code
            });
            
            afterEach(() => {
              // cleanup code
            });
            
            it('should create user successfully', () => {
              expect(userService.create(userData)).toBe(user);
            });
            
            it('should handle invalid input', () => {
              expect(() => userService.create(null)).toThrow();
            });
            
            it('should update user profile', () => {
              expect(userService.update(userId, updates)).toBe(updatedUser);
            });
            
            it('should delete user', () => {
              expect(userService.delete(userId)).toBe(true);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(comprehensiveTestFile);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0].patternId).toBe('comprehensive-test-suite');
      expect(patterns[0].patternName).toBe('Comprehensive Test Suite');
      expect(patterns[0].confidence).toBeGreaterThan(0.8);
    });

    it('should detect incomplete test patterns', async () => {
      const incompleteTestFile: TestFile = {
        path: '/test/project/incomplete.test.ts',
        content: `
          describe('UserService', () => {
            it('should create user', () => {
              // Only one test case
              expect(userService.create(userData)).toBe(user);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(incompleteTestFile);
      
      // 不完全なテストは複数のパターンを検出する可能性がある
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.patternId === 'incomplete-test-coverage')).toBe(true);
      const incompletePattern = patterns.find(p => p.patternId === 'incomplete-test-coverage');
      expect(incompletePattern?.confidence).toBeGreaterThan(0.6);
    });

    it('should detect missing edge case patterns', async () => {
      const missingEdgeCasesFile: TestFile = {
        path: '/test/project/missing-edge-cases.test.ts',
        content: `
          describe('Calculator', () => {
            it('should add two numbers', () => {
              expect(calculator.add(2, 3)).toBe(5);
            });
            
            it('should subtract two numbers', () => {
              expect(calculator.subtract(5, 2)).toBe(3);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(missingEdgeCasesFile);
      
      expect(patterns.some(p => p.patternId === 'missing-edge-cases')).toBe(true);
    });

    it('should detect empty test suites', async () => {
      const emptyTestFile: TestFile = {
        path: '/test/project/empty.test.ts',
        content: `
          describe('EmptyService', () => {
            // No test cases
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(emptyTestFile);
      
      expect(patterns.some(p => p.patternId === 'empty-test-suite')).toBe(true);
    });
  });

  describe('evaluateQuality', () => {
    it('should give high score for comprehensive tests', () => {
      const comprehensivePatterns = [
        {
          patternId: 'comprehensive-test-suite',
          patternName: 'Comprehensive Test Suite',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 20 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(comprehensivePatterns);
      
      expect(score.overall).toBeGreaterThan(80);
      expect(score.breakdown.completeness).toBeDefined();
      expect(score.breakdown.completeness).toBeGreaterThan(80);
    });

    it('should give low score for incomplete tests', () => {
      const incompletePatterns = [
        {
          patternId: 'incomplete-test-coverage',
          patternName: 'Incomplete Test Coverage',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 5 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'missing-edge-cases',
          patternName: 'Missing Edge Cases',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 5 },
          confidence: 0.7,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(incompletePatterns);
      
      expect(score.overall).toBeLessThan(60);
      // Score should reflect incomplete test coverage
    });

    it('should calculate confidence based on pattern confidence', () => {
      const mixedPatterns = [
        {
          patternId: 'pattern1',
          patternName: 'Pattern 1',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 1 },
          confidence: 0.9,
          evidence: []
        },
        {
          patternId: 'pattern2',
          patternName: 'Pattern 2',
          location: { file: 'test.ts', line: 2, column: 1, endLine: 2 },
          confidence: 0.5,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(mixedPatterns);
      
      expect(score.confidence).toBe(0.7); // (0.9 + 0.5) / 2
    });
  });

  describe('suggestImprovements', () => {
    it('should suggest improvements for incomplete coverage', () => {
      const lowQualityScore = {
        overall: 40,
        breakdown: {
          completeness: 40,
          correctness: 40,
          maintainability: 40
        },
        confidence: 0.8
      };

      const improvements = plugin.suggestImprovements(lowQualityScore);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].priority).toBe('high');
      expect(improvements[0].type).toBe('add');
      expect(improvements[0].title).toContain('テストケース');
    });

    it('should suggest setup/teardown improvements', () => {
      const setupIssueScore = {
        overall: 60,
        breakdown: {
          completeness: 60,
          correctness: 60,
          maintainability: 60
        },
        confidence: 0.7
      };

      const improvements = plugin.suggestImprovements(setupIssueScore);
      
      expect(improvements.some(imp => imp.title.includes('セットアップ'))).toBe(true);
    });

    it('should not suggest improvements for high quality tests', () => {
      const highQualityScore = {
        overall: 95,
        breakdown: {
          completeness: 95,
          correctness: 95,
          maintainability: 95
        },
        confidence: 0.9
      };

      const improvements = plugin.suggestImprovements(highQualityScore);
      
      expect(improvements).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle files with no test content', async () => {
      const noTestFile: TestFile = {
        path: '/test/project/no-tests.test.ts',
        content: `
          // Just comments
          /* No actual tests */
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(noTestFile);
      
      expect(patterns.some(p => p.patternId === 'empty-test-suite')).toBe(true);
    });

    it('should handle syntax errors gracefully', async () => {
      const syntaxErrorFile: TestFile = {
        path: '/test/project/syntax-error.test.ts',
        content: `
          describe('Test', () => {
            it('should work' => { // Missing parenthesis
              expect(true).toBe(true);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      // Should not throw an error
      const patterns = await plugin.detectPatterns(syntaxErrorFile);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});