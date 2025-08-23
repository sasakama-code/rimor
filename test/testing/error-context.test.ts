/**
 * TestErrorContext テストスイート
 * v0.8.0: 型安全性テストの追加
 */

import { TestErrorContext, TestErrorContextCollector } from '../../src/testing/error-context';
import { ErrorType } from '../../src/utils/errorHandler';
import * as fs from 'fs';
import * as path from 'path';

// モック設定
jest.mock('fs');
jest.mock('../../src/analyzers/code-context', () => ({
  CodeContextAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeFile: jest.fn().mockResolvedValue({
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      testSuites: []
    })
  }))
}));

describe('TestErrorContext type safety', () => {
  describe('TestErrorContext interface', () => {
    it('should handle basic error properties', () => {
      const context: TestErrorContext = {
        timestamp: new Date().toISOString(),
        testFile: 'test.spec.ts',
        testName: 'should work',
        errorType: ErrorType.UNKNOWN,
        error: {
          message: 'Expected true to be false',
          stack: 'at Test...',
          actual: true,
          expected: false
        },
        codeContext: {
          failedLine: 10,
          failedCode: 'expect(true).toBe(false)',
          surroundingCode: {
            before: 'it("should work", () => {',
            after: '});'
          },
          testStructure: {
            describes: ['Suite'],
            currentTest: 'should work',
            hooks: []
          }
        },
        environment: {
          nodeVersion: '18.0.0',
          jestVersion: '29.0.0',
          ciEnvironment: false,
          memoryUsage: process.memoryUsage()
        },
        relatedFiles: {
          sourceFile: 'src/module.ts',
          dependencies: [],
          configFiles: []
        },
        suggestedActions: []
      };

      expect(context.error.message).toBe('Expected true to be false');
      expect(context.error.actual).toBe(true);
      expect(context.error.expected).toBe(false);
    });

    it('should handle unknown actual and expected values', () => {
      const context: TestErrorContext = {
        timestamp: new Date().toISOString(),
        testFile: 'test.spec.ts',
        testName: 'should work',
        errorType: ErrorType.UNKNOWN,
        error: {
          message: 'Error',
          actual: { complex: 'object', nested: { deep: true } },
          expected: [1, 2, 3, { four: 4 }]
        },
        codeContext: {
          failedLine: 10,
          failedCode: 'expect(actual).toEqual(expected)',
          surroundingCode: {
            before: '',
            after: ''
          },
          testStructure: {
            describes: [],
            currentTest: 'test',
            hooks: []
          }
        },
        environment: {
          nodeVersion: '18.0.0',
          ciEnvironment: false,
          memoryUsage: process.memoryUsage()
        },
        relatedFiles: {
          dependencies: [],
          configFiles: []
        },
        suggestedActions: []
      };

      // unknown型として扱われることを確認
      expect(typeof context.error.actual).toBe('object');
      expect(typeof context.error.expected).toBe('object');
      expect(Array.isArray(context.error.expected)).toBe(true);
    });

    it('should handle optional ciTraceability property', () => {
      const contextWithCI: TestErrorContext = {
        timestamp: new Date().toISOString(),
        testFile: 'test.spec.ts',
        testName: 'should work',
        errorType: ErrorType.UNKNOWN,
        error: {
          message: 'Error'
        },
        codeContext: {
          failedLine: 10,
          failedCode: 'code',
          surroundingCode: {
            before: '',
            after: ''
          },
          testStructure: {
            describes: [],
            currentTest: 'test',
            hooks: []
          }
        },
        environment: {
          nodeVersion: '18.0.0',
          ciEnvironment: true,
          memoryUsage: process.memoryUsage()
        },
        relatedFiles: {
          dependencies: [],
          configFiles: []
        },
        ciTraceability: {
          jobId: 'job-123',
          runId: 'run-456',
          workflow: 'CI/CD Pipeline',
          branch: 'main',
          commit: 'abc123',
          metadata: {
            triggeredBy: 'push',
            timestamp: Date.now()
          }
        },
        suggestedActions: []
      };

      expect(contextWithCI.ciTraceability).toBeDefined();
      expect((contextWithCI.ciTraceability as any).jobId).toBe('job-123');
    });

    it('should handle null values for optional properties', () => {
      const context: TestErrorContext = {
        timestamp: new Date().toISOString(),
        testFile: 'test.spec.ts',
        testName: 'should work',
        errorType: ErrorType.UNKNOWN,
        error: {
          message: 'Error',
          actual: null,
          expected: null
        },
        codeContext: {
          failedLine: 10,
          failedCode: 'code',
          surroundingCode: {
            before: '',
            after: ''
          },
          testStructure: {
            describes: [],
            currentTest: 'test',
            hooks: []
          }
        },
        environment: {
          nodeVersion: '18.0.0',
          ciEnvironment: false,
          memoryUsage: process.memoryUsage()
        },
        relatedFiles: {
          dependencies: [],
          configFiles: []
        },
        ciTraceability: null as any,
        suggestedActions: []
      };

      expect(context.error.actual).toBeNull();
      expect(context.error.expected).toBeNull();
      expect(context.ciTraceability).toBeNull();
    });
  });

  describe('TestErrorContextCollector', () => {
    let collector: TestErrorContextCollector;

    beforeEach(() => {
      collector = new TestErrorContextCollector();
    });

    it('should collect error context with unknown error type', async () => {
      const unknownError = {
        message: 'Custom error',
        code: 'ERR_CUSTOM',
        customProperty: 'custom value',
        nested: {
          deep: true
        }
      };

      const context = await collector.collectErrorContext(
        unknownError,
        '/path/to/test.spec.ts',
        'test name',
        '/project/root'
      );

      expect(context.error.message).toBe('Custom error');
      expect(context.testFile).toBe('/path/to/test.spec.ts');
      expect(context.testName).toBe('test name');
    });

    it('should handle standard Error objects', async () => {
      const standardError = new Error('Standard error message');
      standardError.stack = 'at Test...';

      const context = await collector.collectErrorContext(
        standardError,
        '/path/to/test.spec.ts',
        'test name',
        '/project/root'
      );

      expect(context.error.message).toBe('Standard error message');
      expect(context.error.stack).toBe('at Test...');
    });

    it('should handle assertion errors with actual/expected', async () => {
      const assertionError = {
        message: 'Expected value to be different',
        actual: { value: 10 },
        expected: { value: 20 },
        stack: 'at Test...'
      };

      const context = await collector.collectErrorContext(
        assertionError,
        '/path/to/test.spec.ts',
        'test name',
        '/project/root'
      );

      expect(context.error.actual).toEqual({ value: 10 });
      expect(context.error.expected).toEqual({ value: 20 });
    });

    it('should handle primitive error values', async () => {
      const stringError = 'Simple string error';

      const context = await collector.collectErrorContext(
        stringError,
        '/path/to/test.spec.ts',
        'test name',
        '/project/root'
      );

      expect(context.error.message).toBe('Simple string error');
    });
  });
});