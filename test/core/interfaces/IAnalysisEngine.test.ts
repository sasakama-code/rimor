/**
 * IAnalysisEngine Interface Tests
 * v0.9.0 - インターフェース型定義と型ガードのテスト
 */

import {
  ASTNode,
  AnalysisResult,
  AnalysisOptions,
  IAnalysisEngine
} from '../../../src/core/interfaces/IAnalysisEngine';
import { Issue } from '../../../src/core/types';

describe('IAnalysisEngine Interface', () => {
  describe('ASTNode Type', () => {
    it('should have correct type structure', () => {
      const validNode: ASTNode = {
        type: 'function_declaration',
        text: 'function test() {}',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 18 },
        children: [],
        isNamed: true
      };

      expect(validNode.type).toBe('function_declaration');
      expect(validNode.startPosition.row).toBe(0);
      expect(validNode.endPosition.column).toBe(18);
      expect(validNode.children).toBeDefined();
      expect(validNode.isNamed).toBe(true);
    });

    it('should allow optional properties', () => {
      const minimalNode: ASTNode = {
        type: 'identifier',
        text: 'test',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 4 }
      };

      expect(minimalNode.children).toBeUndefined();
      expect(minimalNode.isNamed).toBeUndefined();
    });

    it('should support nested children', () => {
      const parentNode: ASTNode = {
        type: 'block',
        text: '{ }',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 3 },
        children: [
          {
            type: 'statement',
            text: 'return',
            startPosition: { row: 0, column: 1 },
            endPosition: { row: 0, column: 2 }
          }
        ]
      };

      expect(parentNode.children).toHaveLength(1);
      expect(parentNode.children![0].type).toBe('statement');
    });
  });

  describe('AnalysisResult Type', () => {
    it('should have required properties', () => {
      const result: AnalysisResult = {
        totalFiles: 10,
        issues: [],
        executionTime: 1000
      };

      expect(result.totalFiles).toBe(10);
      expect(result.issues).toEqual([]);
      expect(result.executionTime).toBe(1000);
    });

    it('should allow optional metadata', () => {
      const resultWithMetadata: AnalysisResult = {
        totalFiles: 5,
        issues: [
          {
            file: 'test.ts',
            line: 10,
            column: 5,
            message: 'Test issue',
            severity: 'warning'
          } as Issue
        ],
        executionTime: 500,
        pluginsExecuted: ['plugin1', 'plugin2'],
        metadata: {
          parallelProcessed: true,
          cacheUtilized: true,
          filesFromCache: 3,
          filesAnalyzed: 2
        }
      };

      expect(resultWithMetadata.pluginsExecuted).toHaveLength(2);
      expect(resultWithMetadata.metadata?.parallelProcessed).toBe(true);
      expect(resultWithMetadata.metadata?.filesFromCache).toBe(3);
    });
  });

  describe('AnalysisOptions Type', () => {
    it('should have all optional properties', () => {
      const emptyOptions: AnalysisOptions = {};
      expect(emptyOptions).toBeDefined();
    });

    it('should accept all option properties', () => {
      const fullOptions: AnalysisOptions = {
        parallel: true,
        cache: true,
        concurrency: 4,
        excludePatterns: ['node_modules/**', 'dist/**'],
        includePatterns: ['src/**/*.ts']
      };

      expect(fullOptions.parallel).toBe(true);
      expect(fullOptions.cache).toBe(true);
      expect(fullOptions.concurrency).toBe(4);
      expect(fullOptions.excludePatterns).toHaveLength(2);
      expect(fullOptions.includePatterns).toHaveLength(1);
    });
  });

  describe('IAnalysisEngine Implementation', () => {
    class MockAnalysisEngine implements IAnalysisEngine {
      async analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult> {
        return {
          totalFiles: 1,
          issues: [],
          executionTime: 100
        };
      }

      async generateAST(filePath: string): Promise<ASTNode> {
        return {
          type: 'program',
          text: '',
          startPosition: { row: 0, column: 0 },
          endPosition: { row: 0, column: 0 }
        };
      }

      async clearCache(): Promise<void> {
        // Optional method
      }
    }

    it('should implement required methods', () => {
      const engine = new MockAnalysisEngine();
      
      expect(engine.analyze).toBeDefined();
      expect(engine.generateAST).toBeDefined();
      expect(engine.clearCache).toBeDefined();
    });

    it('should allow optional clearCache method', () => {
      class MinimalEngine implements IAnalysisEngine {
        async analyze(targetPath: string): Promise<AnalysisResult> {
          return {
            totalFiles: 0,
            issues: [],
            executionTime: 0
          };
        }

        async generateAST(filePath: string): Promise<ASTNode> {
          return {
            type: 'empty',
            text: '',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 0 }
          };
        }
      }

      const engine = new MinimalEngine();
      expect('clearCache' in engine).toBe(false);
    });
  });

  describe('Type Guards', () => {
    function isASTNode(value: unknown): value is ASTNode {
      return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        'text' in value &&
        'startPosition' in value &&
        'endPosition' in value &&
        typeof (value as ASTNode).type === 'string' &&
        typeof (value as ASTNode).text === 'string'
      );
    }

    function isAnalysisResult(value: unknown): value is AnalysisResult {
      return (
        typeof value === 'object' &&
        value !== null &&
        'totalFiles' in value &&
        'issues' in value &&
        'executionTime' in value &&
        typeof (value as AnalysisResult).totalFiles === 'number' &&
        Array.isArray((value as AnalysisResult).issues) &&
        typeof (value as AnalysisResult).executionTime === 'number'
      );
    }

    it('should validate ASTNode correctly', () => {
      const validNode: ASTNode = {
        type: 'test',
        text: 'test',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 4 }
      };

      const invalidNode = {
        type: 'test',
        // missing required properties
      };

      expect(isASTNode(validNode)).toBe(true);
      expect(isASTNode(invalidNode)).toBe(false);
      expect(isASTNode(null)).toBe(false);
      expect(isASTNode(undefined)).toBe(false);
    });

    it('should validate AnalysisResult correctly', () => {
      const validResult: AnalysisResult = {
        totalFiles: 5,
        issues: [],
        executionTime: 100
      };

      const invalidResult = {
        totalFiles: '5', // wrong type
        issues: [],
        executionTime: 100
      };

      expect(isAnalysisResult(validResult)).toBe(true);
      expect(isAnalysisResult(invalidResult)).toBe(false);
      expect(isAnalysisResult({})).toBe(false);
    });
  });
});