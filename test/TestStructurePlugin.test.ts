import { TestStructurePlugin } from '../src/plugins/core/TestStructurePlugin';
import { ProjectContext, TestFile } from '../src/core/types';

describe('TestStructurePlugin', () => {
  let plugin: TestStructurePlugin;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    plugin = new TestStructurePlugin();
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
    expect(plugin.id).toBe('test-structure');
    expect(plugin.name).toBe('Test Structure Analyzer');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.type).toBe('core');
  });

  it('should be applicable to all contexts', () => {
    expect(plugin.isApplicable(mockProjectContext)).toBe(true);
    
    const jsContext = { ...mockProjectContext, language: 'javascript' as const };
    expect(plugin.isApplicable(jsContext)).toBe(true);
  });

  describe('detectPatterns', () => {
    it('should detect well-structured AAA pattern tests', async () => {
      const wellStructuredTestFile: TestFile = {
        path: '/test/project/well-structured.test.ts',
        content: `
          describe('UserService', () => {
            beforeEach(() => {
              // Setup code
              mockDatabase.clear();
            });
            
            it('should create user successfully', () => {
              // Arrange
              const userData = { name: 'John', email: 'john@example.com' };
              const mockSave = jest.fn().mockResolvedValue({ id: 1, ...userData });
              
              // Act  
              const result = userService.create(userData);
              
              // Assert
              expect(result.name).toBe('John');
              expect(result.email).toBe('john@example.com');
              expect(mockSave).toHaveBeenCalledWith(userData);
            });
            
            afterEach(() => {
              // Cleanup
              jest.clearAllMocks();
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(wellStructuredTestFile);
      
      expect(patterns.some(p => p.patternId === 'well-structured-tests')).toBe(true);
      const structuredPattern = patterns.find(p => p.patternId === 'well-structured-tests');
      expect(structuredPattern?.confidence).toBeGreaterThan(0.8);
    });

    it('should detect poor test organization', async () => {
      const poorlyOrganizedTestFile: TestFile = {
        path: '/test/project/poorly-organized.test.ts',
        content: `
          describe('UserService', () => {
            it('should work with users', () => {
              const userData = { name: 'John' };
              const result = userService.create(userData);
              expect(result).toBeDefined();
              const users = userService.findAll();
              expect(users.length).toBeGreaterThan(0);
              userService.delete(result.id);
              const updatedUsers = userService.findAll();
              expect(updatedUsers.length).toBe(users.length - 1);
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(poorlyOrganizedTestFile);
      
      expect(patterns.some(p => p.patternId === 'poor-test-organization')).toBe(true);
    });

    it('should detect missing setup and teardown', async () => {
      const missingSetupFile: TestFile = {
        path: '/test/project/missing-setup.test.ts',
        content: `
          describe('DatabaseService', () => {
            it('should save data', () => {
              const data = { id: 1, name: 'test' };
              databaseService.save(data);
              expect(databaseService.find(1)).toEqual(data);
            });
            
            it('should update data', () => {
              const updatedData = { id: 1, name: 'updated' };
              databaseService.update(1, updatedData);
              expect(databaseService.find(1)).toEqual(updatedData);
            });
            
            it('should delete data', () => {
              databaseService.delete(1);
              expect(databaseService.find(1)).toBeNull();
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(missingSetupFile);
      
      expect(patterns.some(p => p.patternId === 'missing-setup-teardown')).toBe(true);
    });

    it('should detect nested describe blocks', async () => {
      const nestedDescribeFile: TestFile = {
        path: '/test/project/nested-describes.test.ts',
        content: `
          describe('UserService', () => {
            describe('create method', () => {
              describe('with valid data', () => {
                it('should create user', () => {
                  expect(true).toBe(true);
                });
                
                describe('with admin role', () => {
                  it('should create admin user', () => {
                    expect(true).toBe(true);
                  });
                });
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

      const patterns = await plugin.detectPatterns(nestedDescribeFile);
      
      expect(patterns.some(p => p.patternId === 'deeply-nested-describes')).toBe(true);
    });

    it('should detect inconsistent naming patterns', async () => {
      const inconsistentNamingFile: TestFile = {
        path: '/test/project/inconsistent-naming.test.ts',
        content: `
          describe('UserService', () => {
            it('should create user', () => {
              expect(true).toBe(true);
            });
            
            it('Creates a new user successfully', () => {
              expect(true).toBe(true);
            });
            
            it('Test user deletion', () => {
              expect(true).toBe(true);
            });
            
            it('user update functionality works', () => {
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

      const patterns = await plugin.detectPatterns(inconsistentNamingFile);
      
      expect(patterns.some(p => p.patternId === 'inconsistent-naming')).toBe(true);
    });

    it('should detect large test files', async () => {
      const largeTestContent = `
        describe('LargeService', () => {
          ${Array.from({ length: 50 }, (_, i) => `
            it('should handle case ${i}', () => {
              expect(service.process(${i})).toBeDefined();
            });
          `).join('\n')}
        });
      `;

      const largeTestFile: TestFile = {
        path: '/test/project/large-test.test.ts',
        content: largeTestContent,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(largeTestFile);
      
      expect(patterns.some(p => p.patternId === 'large-test-file')).toBe(true);
    });
  });

  describe('evaluateQuality', () => {
    it('should give high score for well-structured tests', () => {
      const wellStructuredPatterns = [
        {
          patternId: 'well-structured-tests',
          patternName: 'Well Structured Tests',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 30 },
          confidence: 0.9,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(wellStructuredPatterns);
      
      expect(score.overall).toBeGreaterThan(85);
      expect(score.breakdown.maintainability).toBeDefined();
      expect(score.breakdown.maintainability).toBeGreaterThan(85);
    });

    it('should give low score for poorly structured tests', () => {
      const poorlyStructuredPatterns = [
        {
          patternId: 'poor-test-organization',
          patternName: 'Poor Test Organization',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 20 },
          confidence: 0.8,
          evidence: []
        },
        {
          patternId: 'missing-setup-teardown',
          patternName: 'Missing Setup Teardown',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 20 },
          confidence: 0.7,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(poorlyStructuredPatterns);
      
      expect(score.overall).toBeLessThan(50);
      // Score should reflect poor structure
    });

    it('should handle mixed quality patterns', () => {
      const mixedPatterns = [
        {
          patternId: 'well-structured-tests',
          patternName: 'Well Structured Tests',
          location: { file: 'test.ts', line: 1, column: 1, endLine: 15 },
          confidence: 0.9,
          evidence: []
        },
        {
          patternId: 'inconsistent-naming',
          patternName: 'Inconsistent Naming',
          location: { file: 'test.ts', line: 16, column: 1, endLine: 30 },
          confidence: 0.6,
          evidence: []
        }
      ];

      const score = plugin.evaluateQuality(mixedPatterns);
      
      expect(score.overall).toBeGreaterThan(60);
      expect(score.overall).toBeLessThanOrEqual(90);
    });
  });

  describe('suggestImprovements', () => {
    it('should suggest improvements for poor organization', () => {
      const poorOrganizationScore = {
        overall: 35,
        breakdown: {
          completeness: 35,
          correctness: 35,
          maintainability: 35
        },
        confidence: 0.8
      };

      const improvements = plugin.suggestImprovements(poorOrganizationScore);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements[0].priority).toBe('high');
      expect(improvements[0].type).toBe('refactor');
      expect(improvements[0].title).toContain('AAA');
    });

    it('should suggest specific improvements for different issues', () => {
      const diverseIssueScore = {
        overall: 45,
        breakdown: {
          completeness: 45,
          correctness: 45,
          maintainability: 45
        },
        confidence: 0.7
      };

      const improvements = plugin.suggestImprovements(diverseIssueScore);
      
      expect(improvements.some(imp => imp.title.includes('ネスト'))).toBe(true);
      expect(improvements.some(imp => imp.title.includes('命名'))).toBe(true);
      expect(improvements.some(imp => imp.title.includes('分割'))).toBe(true);
    });

    it('should not suggest improvements for excellent structure', () => {
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

  describe('edge cases', () => {
    it('should handle empty test files', async () => {
      const emptyTestFile: TestFile = {
        path: '/test/project/empty.test.ts',
        content: `
          // Empty test file
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(emptyTestFile);
      
      // 空のファイルでもエラーが発生しないことを確認
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should handle complex test structures', async () => {
      const complexTestFile: TestFile = {
        path: '/test/project/complex.test.ts',
        content: `
          describe.each([
            ['case1', { input: 1, expected: 2 }],
            ['case2', { input: 2, expected: 4 }],
          ])('parameterized test %s', (name, { input, expected }) => {
            it('should multiply by 2', () => {
              expect(multiply(input)).toBe(expected);
            });
          });
          
          describe('with mocks', () => {
            let mockService: jest.Mocked<ExternalService>;
            
            beforeEach(() => {
              mockService = createMockService();
            });
            
            it.concurrent('should handle async operations', async () => {
              await expect(asyncOperation()).resolves.toBeDefined();
            });
            
            it.skip('temporarily disabled test', () => {
              // This test is temporarily disabled
            });
          });
        `,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const patterns = await plugin.detectPatterns(complexTestFile);
      
      // 複雑な構造でも適切に分析されることを確認
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});