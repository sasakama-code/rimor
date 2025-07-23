import { AssertionQualityPlugin } from '../src/plugins/core/AssertionQualityPlugin';
import { ProjectContext, TestFile } from '../src/core/types';

describe('AssertionQualityPlugin', () => {
  let plugin: AssertionQualityPlugin;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    plugin = new AssertionQualityPlugin();
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
    expect(plugin.id).toBe('assertion-quality');
    expect(plugin.name).toBe('Assertion Quality Analyzer');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.type).toBe('core');
  });

  it('should be applicable to all contexts', () => {
    expect(plugin.isApplicable(mockProjectContext)).toBe(true);
    
    const jsContext = { ...mockProjectContext, language: 'javascript' as const };
    expect(plugin.isApplicable(jsContext)).toBe(true);
  });

  describe('detectPatterns', () => {
    it('should detect high-quality assertions', async () => {
      const highQualityTestFile: TestFile = {
        path: '/test/project/high-quality.test.ts',
        content: `
          describe('UserService', () => {
            it('should create user with specific properties', () => {
              const result = userService.create({ name: 'John', email: 'john@example.com' });
              
              expect(result).toBeDefined();
              expect(result.id).toMatch(/^user-\\d+$/);
              expect(result.name).toBe('John');
              expect(result.email).toBe('john@example.com');
              expect(result.createdAt).toBeInstanceOf(Date);
              expect(result.isActive).toBe(true);
            });
            
            it('should handle invalid input with specific error', () => {
              expect(() => userService.create(null))
                .toThrow('Invalid user data provided');
              expect(() => userService.create({ name: '' }))
                .toThrow(/email is required/i);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(highQualityTestFile);
      
      expect(patterns.some(p => p.patternId === 'high-quality-assertions')).toBe(true);
      const highQualityPattern = patterns.find(p => p.patternId === 'high-quality-assertions');
      expect(highQualityPattern?.confidence).toBeGreaterThan(0.8);
    });

    it('should detect weak assertions', async () => {
      const weakAssertionTestFile: TestFile = {
        path: '/test/project/weak-assertions.test.ts',
        content: `
          describe('UserService', () => {
            it('should work', () => {
              const result = userService.create(userData);
              expect(result).toBeTruthy();
              expect(result).toBeDefined();
            });
            
            it('should not fail', () => {
              expect(userService.update).not.toBeUndefined();
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(weakAssertionTestFile);
      
      expect(patterns.some(p => p.patternId === 'weak-assertions')).toBe(true);
    });

    it('should detect missing assertions', async () => {
      const missingAssertionsFile: TestFile = {
        path: '/test/project/missing-assertions.test.ts',
        content: `
          describe('UserService', () => {
            it('should create user', () => {
              const result = userService.create(userData);
              // No assertions!
            });
            
            it('should call external service', () => {
              userService.notifyExternalService(userId);
              // No verification of the call
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(missingAssertionsFile);
      
      expect(patterns.some(p => p.patternId === 'missing-assertions')).toBe(true);
    });

    it('should detect assertion variety issues', async () => {
      const limitedAssertionsFile: TestFile = {
        path: '/test/project/limited-assertions.test.ts',
        content: `
          describe('Calculator', () => {
            it('should add numbers', () => {
              expect(calculator.add(2, 3)).toBe(5);
            });
            
            it('should subtract numbers', () => {
              expect(calculator.subtract(5, 2)).toBe(3);
            });
            
            it('should multiply numbers', () => {
              expect(calculator.multiply(2, 4)).toBe(8);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(limitedAssertionsFile);
      
      expect(patterns.some(p => p.patternId === 'limited-assertion-variety')).toBe(true);
    });

    it('should detect magic numbers in assertions', async () => {
      const magicNumbersFile: TestFile = {
        path: '/test/project/magic-numbers.test.ts',
        content: `
          describe('BusinessLogic', () => {
            it('should calculate discount', () => {
              const result = businessLogic.calculateDiscount(1000, 'premium');
              expect(result).toBe(850); // Magic number
              expect(result).toBeGreaterThan(800); // Magic number
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(magicNumbersFile);
      
      expect(patterns.some(p => p.patternId === 'magic-numbers-in-assertions')).toBe(true);
    });
  });

  describe('evaluateQuality', () => {
    it('should give high score for high-quality assertions', () => {
      const highQualityPatterns = [
        {
          patternId: 'high-quality-assertions',
          patternName: 'High Quality Assertions',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 20 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(highQualityPatterns);
      
      expect(score.overall).toBeGreaterThan(80);
      expect(score.breakdown.correctness).toBeDefined();
      expect(score.breakdown.correctness).toBeGreaterThan(80);
    });

    it('should give low score for weak assertions', () => {
      const weakPatterns = [
        {
          patternId: 'weak-assertions',
          patternName: 'Weak Assertions',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 10 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'missing-assertions',
          patternName: 'Missing Assertions',
          location: { file: 'test.ts', line: 11, column: 1, endLine: 15 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(weakPatterns);
      
      expect(score.overall).toBeLessThan(50);
      expect(score.breakdown.correctness).toBeLessThan(50);
    });

    it('should calculate weighted scores properly', () => {
      const mixedPatterns = [
        {
          patternId: 'high-quality-assertions',
          patternName: 'High Quality Assertions',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 10 },
          confidence: 0.9,
          evidence: []
        },
        {
          patternId: 'limited-assertion-variety',
          patternName: 'Limited Assertion Variety',
          location: { file: 'test.ts', line: 11, column: 1, endLine: 20 },
          confidence: 0.7,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(mixedPatterns);
      
      expect(score.overall).toBeGreaterThan(50);
      expect(score.overall).toBeLessThan(90);
      expect(score.confidence).toBe(0.8); // (0.9 + 0.7) / 2
    });
  });

  describe('suggestImprovements', () => {
    it('should suggest improvements for weak assertions', () => {
      const weakAssertionScore = {
        overall: 30,
        breakdown: {
          completeness: 30,
          correctness: 30,
          maintainability: 30
        },
        confidence: 0.8
      };

      const improvements = plugin.suggestImprovements(weakAssertionScore);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].priority).toBe('high');
      expect(improvements[0].type).toBe('modify');
      expect(improvements[0].title).toContain('アサーション');
    });

    it('should suggest specific improvements for different issues', () => {
      const diverseIssueScore = {
        overall: 40,
        breakdown: {
          completeness: 40,
          correctness: 40,
          maintainability: 40
        },
        confidence: 0.7
      };

      const improvements = plugin.suggestImprovements(diverseIssueScore);
      
      expect(improvements.some(imp => imp.title.includes('多様な'))).toBe(true);
      expect(improvements.some(imp => imp.title.includes('定数'))).toBe(true);
    });

    it('should not suggest improvements for excellent assertions', () => {
      const excellentScore = {
        overall: 95,
        breakdown: {
          completeness: 95,
          correctness: 95,
          maintainability: 95
        },
        confidence: 0.9
      };

      const improvements = plugin.suggestImprovements(excellentScore);
      
      expect(improvements).toHaveLength(0);
    });
  });

  describe('framework-specific detection', () => {
    it('should detect Jest-specific assertion patterns', async () => {
      const jestSpecificFile: TestFile = {
        path: '/test/project/jest-specific.test.ts',
        content: `
          describe('Component', () => {
            it('should handle async operations', async () => {
              await expect(asyncOperation()).resolves.toBe('success');
              await expect(failingOperation()).rejects.toThrow('error');
            });
            
            it('should verify mock calls', () => {
              expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
              expect(mockFn).toHaveBeenCalledTimes(2);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(jestSpecificFile);
      
      // Jest固有のパターンが適切に検出されることを確認
      expect(patterns.some(p => p.evidence.some(e => e.description.includes('async')))).toBe(true);
    });

    it('should adapt to different test frameworks', () => {
      const mochaContext = { ...mockProjectContext, testFramework: 'mocha' };
      expect(plugin.isApplicable(mochaContext)).toBe(true);
      
      const chaiContext = { ...mockProjectContext, testFramework: 'chai' };
      expect(plugin.isApplicable(chaiContext)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle complex assertion chains', async () => {
      const complexAssertionsFile: TestFile = {
        path: '/test/project/complex-assertions.test.ts',
        content: `
          describe('ComplexLogic', () => {
            it('should handle nested objects', () => {
              const result = complexLogic.process(data);
              
              expect(result).toMatchObject({
                status: expect.stringMatching(/^(success|pending)$/),
                data: expect.objectContaining({
                  id: expect.any(String),
                  items: expect.arrayContaining([
                    expect.objectContaining({ name: 'test' })
                  ])
                }),
                metadata: {
                  processedAt: expect.any(Date),
                  version: expect.stringMatching(/^\\d+\\.\\d+\\.\\d+$/)
                }
              });
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(complexAssertionsFile);
      
      // 複雑なアサーションが適切に解析されることを確認
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should handle files with no assertions gracefully', async () => {
      const noAssertionsFile: TestFile = {
        path: '/test/project/no-assertions.test.ts',
        content: `
          describe('EmptyTest', () => {
            it('should do something', () => {
              // No assertions at all
              const result = someFunction();
              console.log(result);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(noAssertionsFile);
      
      expect(patterns.some(p => p.patternId === 'missing-assertions')).toBe(true);
    });
  });
});