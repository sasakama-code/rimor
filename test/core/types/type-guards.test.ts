import { describe, it, expect } from '@jest/globals';
import {
  isValidPackageJson,
  isValidASTNode,
  isValidProjectContext,
  isValidTestFile,
  isValidIssue,
  isValidDetectionResult,
  isValidQualityScore,
  isValidImprovement
} from '../../../src/core/types/type-guards';

describe('Type Guards', () => {
  describe('isValidPackageJson', () => {
    it('should return true for valid PackageJson', () => {
      const validPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'typescript': '^5.0.0'
        },
        devDependencies: {
          'jest': '^29.0.0'
        }
      };
      
      expect(isValidPackageJson(validPackageJson)).toBe(true);
    });

    it('should return false for invalid PackageJson', () => {
      expect(isValidPackageJson(null)).toBe(false);
      expect(isValidPackageJson(undefined)).toBe(false);
      expect(isValidPackageJson({})).toBe(false);
      expect(isValidPackageJson({ name: 'test' })).toBe(false); // missing version
      expect(isValidPackageJson({ version: '1.0.0' })).toBe(false); // missing name
    });

    it('should accept optional dependencies', () => {
      const minimalPackageJson = {
        name: 'test-project',
        version: '1.0.0'
      };
      
      expect(isValidPackageJson(minimalPackageJson)).toBe(true);
    });
  });

  describe('isValidASTNode', () => {
    it('should return true for valid ASTNode', () => {
      const validASTNode = {
        type: 'FunctionDeclaration',
        startPosition: { line: 1, column: 0 },
        endPosition: { line: 5, column: 1 },
        children: []
      };
      
      expect(isValidASTNode(validASTNode)).toBe(true);
    });

    it('should return false for invalid ASTNode', () => {
      expect(isValidASTNode(null)).toBe(false);
      expect(isValidASTNode(undefined)).toBe(false);
      expect(isValidASTNode({})).toBe(false);
      expect(isValidASTNode({ type: 'Function' })).toBe(false); // missing positions
      expect(isValidASTNode({ 
        type: 'Function',
        startPosition: { line: 1, column: 0 }
      })).toBe(false); // missing endPosition
    });

    it('should accept nodes without children', () => {
      const leafNode = {
        type: 'Identifier',
        startPosition: { line: 1, column: 0 },
        endPosition: { line: 1, column: 5 }
      };
      
      expect(isValidASTNode(leafNode)).toBe(true);
    });
  });

  describe('isValidProjectContext', () => {
    it('should return true for valid ProjectContext', () => {
      const validContext = {
        rootPath: '/project',
        language: 'typescript' as const,
        testFramework: 'jest',
        filePatterns: {
          test: ['**/*.test.ts'],
          source: ['src/**/*.ts'],
          ignore: ['node_modules/**']
        }
      };
      
      expect(isValidProjectContext(validContext)).toBe(true);
    });

    it('should return true for minimal ProjectContext', () => {
      const minimalContext = {};
      expect(isValidProjectContext(minimalContext)).toBe(true);
    });

    it('should return false for invalid ProjectContext', () => {
      expect(isValidProjectContext(null)).toBe(false);
      expect(isValidProjectContext(undefined)).toBe(false);
      expect(isValidProjectContext('string')).toBe(false);
    });

    it('should validate language enum values', () => {
      const invalidLanguage = {
        language: 'invalid-language'
      };
      
      expect(isValidProjectContext(invalidLanguage)).toBe(false);
    });
  });

  describe('isValidTestFile', () => {
    it('should return true for valid TestFile', () => {
      const validTestFile = {
        path: '/src/test.spec.ts',
        content: 'test content',
        framework: 'jest',
        testCount: 5,
        hasTests: true,
        metadata: {
          language: 'typescript',
          lastModified: new Date()
        }
      };
      
      expect(isValidTestFile(validTestFile)).toBe(true);
    });

    it('should return false for invalid TestFile', () => {
      expect(isValidTestFile(null)).toBe(false);
      expect(isValidTestFile(undefined)).toBe(false);
      expect(isValidTestFile({})).toBe(false);
      expect(isValidTestFile({ path: '/test.ts' })).toBe(false); // missing content
      expect(isValidTestFile({ content: 'test' })).toBe(false); // missing path
    });

    it('should accept minimal TestFile', () => {
      const minimalTestFile = {
        path: '/test.ts',
        content: ''
      };
      
      expect(isValidTestFile(minimalTestFile)).toBe(true);
    });
  });

  describe('isValidIssue', () => {
    it('should return true for valid Issue', () => {
      const validIssue = {
        type: 'error',
        severity: 'high' as const,
        message: 'Test error',
        line: 10,
        endLine: 15,
        column: 5,
        endColumn: 20,
        file: '/src/test.ts',
        recommendation: 'Fix the error',
        codeSnippet: 'const x = 1;',
        plugin: 'test-plugin'
      };
      
      expect(isValidIssue(validIssue)).toBe(true);
    });

    it('should return false for invalid Issue', () => {
      expect(isValidIssue(null)).toBe(false);
      expect(isValidIssue(undefined)).toBe(false);
      expect(isValidIssue({})).toBe(false);
      expect(isValidIssue({ type: 'error' })).toBe(false); // missing severity and message
      expect(isValidIssue({ 
        type: 'error',
        severity: 'high' 
      })).toBe(false); // missing message
    });

    it('should accept minimal Issue', () => {
      const minimalIssue = {
        type: 'warning',
        severity: 'low' as const,
        message: 'Simple warning'
      };
      
      expect(isValidIssue(minimalIssue)).toBe(true);
    });
  });

  describe('isValidDetectionResult', () => {
    it('should return true for valid DetectionResult', () => {
      const validResult = {
        patternId: 'pattern-1',
        patternName: 'Test Pattern',
        location: {
          file: '/test.ts',
          line: 10,
          column: 5
        },
        confidence: 0.95,
        evidence: [
          {
            type: 'code',
            description: 'Evidence description',
            location: {
              file: '/test.ts',
              line: 10,
              column: 5
            },
            code: 'const x = 1;'
          }
        ],
        severity: 'high' as const,
        securityRelevance: 0.8,
        metadata: { custom: 'data' }
      };
      
      expect(isValidDetectionResult(validResult)).toBe(true);
    });

    it('should return false for invalid DetectionResult', () => {
      expect(isValidDetectionResult(null)).toBe(false);
      expect(isValidDetectionResult(undefined)).toBe(false);
      expect(isValidDetectionResult({})).toBe(false);
      expect(isValidDetectionResult({ confidence: 'high' })).toBe(false); // confidence should be number
    });

    it('should validate confidence range', () => {
      const invalidConfidence1 = { confidence: -0.1 };
      const invalidConfidence2 = { confidence: 1.1 };
      const validConfidence = { confidence: 0.5 };
      
      expect(isValidDetectionResult(invalidConfidence1)).toBe(false);
      expect(isValidDetectionResult(invalidConfidence2)).toBe(false);
      expect(isValidDetectionResult(validConfidence)).toBe(true);
    });
  });

  describe('isValidQualityScore', () => {
    it('should return true for valid QualityScore', () => {
      const validScore = {
        overall: 0.85,
        dimensions: {
          completeness: 0.9,
          correctness: 0.8,
          maintainability: 0.85,
          performance: 0.9,
          security: 0.8
        },
        confidence: 0.95,
        details: {
          strengths: ['Good coverage'],
          weaknesses: ['Missing edge cases'],
          suggestions: ['Add more tests']
        }
      };
      
      expect(isValidQualityScore(validScore)).toBe(true);
    });

    it('should return false for invalid QualityScore', () => {
      expect(isValidQualityScore(null)).toBe(false);
      expect(isValidQualityScore(undefined)).toBe(false);
      expect(isValidQualityScore({})).toBe(false);
      expect(isValidQualityScore({ overall: 'high' })).toBe(false); // overall should be number
    });

    it('should validate score ranges', () => {
      const invalidScore1 = { 
        overall: -0.1,
        dimensions: {},
        confidence: 0.5
      };
      const invalidScore2 = { 
        overall: 1.1,
        dimensions: {},
        confidence: 0.5
      };
      const validScore = { 
        overall: 0.75,
        dimensions: {},
        confidence: 0.9
      };
      
      expect(isValidQualityScore(invalidScore1)).toBe(false);
      expect(isValidQualityScore(invalidScore2)).toBe(false);
      expect(isValidQualityScore(validScore)).toBe(true);
    });
  });

  describe('isValidImprovement', () => {
    it('should return true for valid Improvement', () => {
      const validImprovement = {
        id: 'imp-1',
        type: 'add-test' as const,
        priority: 'high' as const,
        title: 'Add missing test',
        description: 'Test for edge case is missing',
        location: {
          file: '/test.ts',
          line: 10,
          column: 5
        },
        suggestedCode: 'it("should handle edge case", () => {});',
        estimatedImpact: 0.2,
        effort: 'low' as const,
        autoFixable: true
      };
      
      expect(isValidImprovement(validImprovement)).toBe(true);
    });

    it('should return false for invalid Improvement', () => {
      expect(isValidImprovement(null)).toBe(false);
      expect(isValidImprovement(undefined)).toBe(false);
      expect(isValidImprovement({})).toBe(false);
      expect(isValidImprovement({ id: 'imp-1' })).toBe(false); // missing required fields
    });

    it('should accept minimal Improvement', () => {
      const minimalImprovement = {
        id: 'imp-1',
        type: 'refactor' as const,
        priority: 'medium' as const,
        title: 'Refactor test',
        description: 'Improve test structure'
      };
      
      expect(isValidImprovement(minimalImprovement)).toBe(true);
    });
  });
});