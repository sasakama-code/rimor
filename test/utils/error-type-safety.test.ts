import { describe, it, expect } from '@jest/globals';

// エラーガード関数
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return isError(error) && 'code' in error;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export function getErrorCode(error: unknown): string | undefined {
  if (isNodeError(error)) {
    return error.code;
  }
  return undefined;
}

describe('Error Type Safety', () => {
  describe('isError type guard', () => {
    it('should correctly identify Error instances', () => {
      const error = new Error('Test error');
      expect(isError(error)).toBe(true);
    });

    it('should correctly reject non-Error values', () => {
      expect(isError('string error')).toBe(false);
      expect(isError(123)).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({})).toBe(false);
    });
  });

  describe('isNodeError type guard', () => {
    it('should correctly identify Node.js errors', () => {
      const error = new Error('Test error') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      expect(isNodeError(error)).toBe(true);
    });

    it('should reject regular Error instances', () => {
      const error = new Error('Test error');
      expect(isNodeError(error)).toBe(false);
    });
  });

  describe('getErrorMessage helper', () => {
    it('should extract message from Error instances', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(getErrorMessage({})).toBe('Unknown error occurred');
    });
  });

  describe('getErrorCode helper', () => {
    it('should extract code from Node.js errors', () => {
      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      expect(getErrorCode(error)).toBe('ENOENT');
    });

    it('should return undefined for regular errors', () => {
      const error = new Error('Regular error');
      expect(getErrorCode(error)).toBeUndefined();
    });

    it('should return undefined for non-error values', () => {
      expect(getErrorCode('string')).toBeUndefined();
      expect(getErrorCode(123)).toBeUndefined();
      expect(getErrorCode(null)).toBeUndefined();
    });
  });

  describe('Type-safe error handling in practice', () => {
    it('should handle file system errors safely', async () => {
      const simulateFileOperation = async (): Promise<string> => {
        const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      };

      try {
        await simulateFileOperation();
      } catch (error: unknown) {
        // This is type-safe error handling
        if (isNodeError(error) && error.code === 'ENOENT') {
          expect(error.code).toBe('ENOENT');
        } else {
          throw new Error('Unexpected error type');
        }
      }
    });

    it('should handle mixed error types safely', () => {
      const testCases: unknown[] = [
        new Error('Standard error'),
        'String error',
        { message: 'Object error' },
        null,
        undefined
      ];

      testCases.forEach(testCase => {
        const message = getErrorMessage(testCase);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});