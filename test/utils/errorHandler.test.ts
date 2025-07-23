/**
 * ErrorHandler テストスイート
 * v0.3.0: エラーハンドリングシステムのテスト
 */

import { ErrorHandler, ErrorType, ErrorInfo } from '../../src/utils/errorHandler';
import { Issue } from '../../src/core/types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create ErrorHandler instance', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
    });
  });

  describe('error handling', () => {
    it('should handle general errors', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error, 'test-context');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('UNKNOWN');
      expect(call).toContain('Test error');
    });

    it('should handle file system errors', () => {
      const fsError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      
      errorHandler.handleFileSystemError(fsError, '/path/to/file.ts');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('FILE_SYSTEM');
    });

    it('should handle plugin errors', () => {
      const pluginError = new Error('Plugin failed');
      
      errorHandler.handlePluginError(pluginError, 'TestPlugin', 'test.ts');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('PLUGIN_ERROR');
      expect(call).toContain('TestPlugin');
    });

    it('should handle configuration errors', () => {
      const configError = new Error('Invalid configuration');
      
      errorHandler.handleConfigurationError(configError, { option: 'value' });
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('CONFIGURATION');
    });

    it('should handle validation errors', () => {
      const validationError = new Error('Validation failed');
      
      errorHandler.handleValidationError(validationError, 'field', 'invalid-value');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('VALIDATION');
    });
  });

  describe('error formatting', () => {
    it('should format error with timestamp', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should include error type in message', () => {
      const error = new Error('Test error');
      
      errorHandler.handleError(error, 'test-context');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('UNKNOWN:');
    });

    it('should format recoverable errors with warning prefix', () => {
      const error = new Error('Recoverable error');
      
      errorHandler.handleRecoverableError(error, 'test-context');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).startsWith('⚠️');
    });

    it('should format fatal errors with error prefix', () => {
      const error = new Error('Fatal error');
      
      errorHandler.handleFatalError(error, 'test-context');
      
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).startsWith('❌');
    });
  });

  describe('error context', () => {
    it('should include context information', () => {
      const error = new Error('Context error');
      const context = { file: 'test.ts', line: 42 };
      
      errorHandler.handleError(error, context);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleSpy.mock.calls[1][0];
      expect(contextCall).toContain('Context:');
    });

    it('should handle complex context objects', () => {
      const error = new Error('Complex context');
      const context = {
        plugin: 'TestPlugin',
        file: 'complex.ts',
        config: { enabled: true, threshold: 10 },
        metadata: { version: '1.0.0' }
      };
      
      errorHandler.handleError(error, context);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const contextCall = consoleSpy.mock.calls[1][1];
      expect(contextCall).toContain('"plugin": "TestPlugin"');
    });
  });

  describe('error statistics', () => {
    it('should track error counts', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      errorHandler.handleError(error1);
      errorHandler.handlePluginError(error2, 'TestPlugin');
      
      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByType.UNKNOWN).toBe(1);
      expect(stats.errorsByType.PLUGIN_ERROR).toBe(1);
    });

    it('should track recoverable vs fatal errors', () => {
      const recoverableError = new Error('Recoverable');
      const fatalError = new Error('Fatal');
      
      errorHandler.handleRecoverableError(recoverableError);
      errorHandler.handleFatalError(fatalError);
      
      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.recoverableErrors).toBe(1);
      expect(stats.fatalErrors).toBe(1);
    });

    it('should provide error rate information', () => {
      const error = new Error('Rate test');
      
      errorHandler.handleError(error);
      
      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.errorRate).toBeDefined();
      expect(typeof stats.errorRate).toBe('number');
    });
  });

  describe('error reporting', () => {
    it('should generate error report', () => {
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3')
      ];
      
      errors.forEach(error => errorHandler.handleError(error));
      
      const report = errorHandler.generateErrorReport();
      
      expect(report).toContain('Error Report');
      expect(report).toContain('Total Errors: 3');
      expect(report).toContain('UNKNOWN: 3');
    });

    it('should include recent errors in report', () => {
      const error = new Error('Recent error');
      
      errorHandler.handleError(error, 'recent-context');
      
      const report = errorHandler.generateErrorReport();
      
      expect(report).toContain('Recent error');
      expect(report).toContain('recent-context');
    });
  });

  describe('error recovery', () => {
    it('should provide recovery suggestions', () => {
      const fileError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      
      errorHandler.handleFileSystemError(fileError, '/missing/file.ts');
      
      const suggestions = errorHandler.getRecoverySuggestions('FILE_SYSTEM');
      
      expect(suggestions).toContain('file');
      expect(suggestions.some(s => s.includes('check'))).toBe(true);
    });

    it('should handle unknown error types in recovery', () => {
      const suggestions = errorHandler.getRecoverySuggestions('UNKNOWN_TYPE' as ErrorType);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('development mode features', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Dev error');
      error.stack = 'Error: Dev error\n    at test location';
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const stackCall = consoleSpy.mock.calls[1];
      expect(stackCall[0]).toContain('Stack trace:');
    });

    it('should hide stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Prod error');
      error.stack = 'Error: Prod error\n    at test location';
      
      errorHandler.handleError(error);
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });
});