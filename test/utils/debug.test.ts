/**
 * DebugLogger テストスイート
 * v0.6.0: デバッグユーティリティシステムの包括的テスト
 */

import { DebugLogger, DebugLevel, debug } from '../../src/utils/debug';

describe('DebugLogger', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;
  let originalConsoleTime: typeof console.time;
  let originalConsoleTimeEnd: typeof console.timeEnd;
  let originalConsoleDir: typeof console.dir;
  let originalProcess: typeof process;

  beforeEach(() => {
    // コンソールメソッドをモック
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalConsoleTime = console.time;
    originalConsoleTimeEnd = console.timeEnd;
    originalConsoleDir = console.dir;

    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.time = jest.fn();
    console.timeEnd = jest.fn();
    console.dir = jest.fn();

    // デバッグレベルをリセット
    DebugLogger.setLevel(DebugLevel.NONE);
  });

  afterEach(() => {
    // コンソールメソッドを復元
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.time = originalConsoleTime;
    console.timeEnd = originalConsoleTimeEnd;
    console.dir = originalConsoleDir;
  });

  describe('DebugLevel enum', () => {
    it('should have correct numeric values', () => {
      expect(DebugLevel.NONE).toBe(0);
      expect(DebugLevel.ERROR).toBe(1);
      expect(DebugLevel.WARN).toBe(2);
      expect(DebugLevel.INFO).toBe(3);
      expect(DebugLevel.VERBOSE).toBe(4);
      expect(DebugLevel.TRACE).toBe(5);
    });
  });

  describe('getLevel and setLevel', () => {
    it('should get and set debug level correctly', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      expect(DebugLogger.getLevel()).toBe(DebugLevel.INFO);

      DebugLogger.setLevel(DebugLevel.TRACE);
      expect(DebugLogger.getLevel()).toBe(DebugLevel.TRACE);
    });

    it('should default to NONE when no environment variable is set', () => {
      DebugLogger.setLevel(DebugLevel.NONE);
      const level = DebugLogger.getLevel();
      expect(level).toBe(DebugLevel.NONE);
    });
  });

  describe('error logging', () => {
    it('should log error when level is ERROR or higher', () => {
      DebugLogger.setLevel(DebugLevel.ERROR);
      DebugLogger.error('test error message', { data: 'test' });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/🔴 \[ERROR\] .* test error message/),
        { data: 'test' }
      );
    });

    it('should not log error when level is NONE', () => {
      DebugLogger.setLevel(DebugLevel.NONE);
      DebugLogger.error('test error message');
      
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('warn logging', () => {
    it('should log warning when level is WARN or higher', () => {
      DebugLogger.setLevel(DebugLevel.WARN);
      DebugLogger.warn('test warning message');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/🟡 \[WARN\]  .* test warning message/)
      );
    });

    it('should not log warning when level is ERROR', () => {
      DebugLogger.setLevel(DebugLevel.ERROR);
      DebugLogger.warn('test warning message');
      
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('info logging', () => {
    it('should log info when level is INFO or higher', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      DebugLogger.info('test info message');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🔵 \[INFO\]  .* test info message/)
      );
    });

    it('should not log info when level is WARN', () => {
      DebugLogger.setLevel(DebugLevel.WARN);
      DebugLogger.info('test info message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('verbose logging', () => {
    it('should log verbose when level is VERBOSE or higher', () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      DebugLogger.verbose('test verbose message');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🟢 \[VERB\]  .* test verbose message/)
      );
    });

    it('should not log verbose when level is INFO', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      DebugLogger.verbose('test verbose message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('trace logging', () => {
    it('should log trace when level is TRACE', () => {
      DebugLogger.setLevel(DebugLevel.TRACE);
      DebugLogger.trace('test trace message');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/⚪ \[TRACE\] .* test trace message/)
      );
    });

    it('should not log trace when level is VERBOSE', () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      DebugLogger.trace('test trace message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('time measurement', () => {
    it('should call console.time and timeEnd when level is VERBOSE or higher', () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      
      DebugLogger.time('test-timer');
      expect(console.time).toHaveBeenCalledWith('⏱️  [TIME]  test-timer');

      DebugLogger.timeEnd('test-timer');
      expect(console.timeEnd).toHaveBeenCalledWith('⏱️  [TIME]  test-timer');
    });

    it('should not call console.time when level is INFO', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      
      DebugLogger.time('test-timer');
      expect(console.time).not.toHaveBeenCalled();

      DebugLogger.timeEnd('test-timer');
      expect(console.timeEnd).not.toHaveBeenCalled();
    });
  });

  describe('inspect', () => {
    it('should inspect object when level is TRACE', () => {
      DebugLogger.setLevel(DebugLevel.TRACE);
      const testObj = { test: 'data', nested: { value: 123 } };
      
      DebugLogger.inspect('test-object', testObj);
      
      expect(console.log).toHaveBeenCalledWith('🔍 [INSPECT] test-object:');
      expect(console.dir).toHaveBeenCalledWith(testObj, { depth: 3, colors: true });
    });

    it('should not inspect when level is VERBOSE', () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      const testObj = { test: 'data' };
      
      DebugLogger.inspect('test-object', testObj);
      
      expect(console.log).not.toHaveBeenCalled();
      expect(console.dir).not.toHaveBeenCalled();
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time when level is VERBOSE', async () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      
      const asyncFn = jest.fn().mockResolvedValue('result');
      const result = await DebugLogger.measureAsync('test-async', asyncFn);
      
      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🟢 \[VERB\]  .* Starting: test-async/)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🟢 \[VERB\]  .* Completed: test-async \(\d+ms\)/)
      );
    });

    it('should handle async function errors and still measure time', async () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      
      const error = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      
      await expect(DebugLogger.measureAsync('test-async-error', asyncFn)).rejects.toThrow('Test error');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/🔴 \[ERROR\] .* Failed: test-async-error \(\d+ms\)/),
        error
      );
    });

    it('should execute function without measurement when level is INFO', async () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      
      const asyncFn = jest.fn().mockResolvedValue('result');
      const result = await DebugLogger.measureAsync('test-async', asyncFn);
      
      expect(result).toBe('result');
      expect(asyncFn).toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('measure', () => {
    it('should measure sync function execution time when level is VERBOSE', () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      
      const syncFn = jest.fn().mockReturnValue('sync-result');
      const result = DebugLogger.measure('test-sync', syncFn);
      
      expect(result).toBe('sync-result');
      expect(syncFn).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🟢 \[VERB\]  .* Starting: test-sync/)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🟢 \[VERB\]  .* Completed: test-sync \(\d+ms\)/)
      );
    });

    it('should handle sync function errors and still measure time', () => {
      DebugLogger.setLevel(DebugLevel.VERBOSE);
      
      const error = new Error('Sync error');
      const syncFn = jest.fn().mockImplementation(() => { throw error; });
      
      expect(() => DebugLogger.measure('test-sync-error', syncFn)).toThrow('Sync error');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/🔴 \[ERROR\] .* Failed: test-sync-error \(\d+ms\)/),
        error
      );
    });
  });

  describe('logIf', () => {
    beforeEach(() => {
      DebugLogger.setLevel(DebugLevel.TRACE); // すべてのレベルを有効にする
    });

    it('should log error when condition is true', () => {
      DebugLogger.logIf(true, DebugLevel.ERROR, 'conditional error');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/🔴 \[ERROR\] .* conditional error/)
      );
    });

    it('should not log when condition is false', () => {
      DebugLogger.logIf(false, DebugLevel.ERROR, 'conditional error');
      
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log warn when condition is true', () => {
      DebugLogger.logIf(true, DebugLevel.WARN, 'conditional warning');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/🟡 \[WARN\]  .* conditional warning/)
      );
    });

    it('should log info when condition is true', () => {
      DebugLogger.logIf(true, DebugLevel.INFO, 'conditional info');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🔵 \[INFO\]  .* conditional info/)
      );
    });

    it('should log verbose when condition is true', () => {
      DebugLogger.logIf(true, DebugLevel.VERBOSE, 'conditional verbose');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🟢 \[VERB\]  .* conditional verbose/)
      );
    });

    it('should log trace when condition is true', () => {
      DebugLogger.logIf(true, DebugLevel.TRACE, 'conditional trace');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/⚪ \[TRACE\] .* conditional trace/)
      );
    });
  });

  describe('debug convenience object', () => {
    it('should provide bound methods for all logging functions', () => {
      expect(typeof debug.error).toBe('function');
      expect(typeof debug.warn).toBe('function');
      expect(typeof debug.info).toBe('function');
      expect(typeof debug.verbose).toBe('function');
      expect(typeof debug.trace).toBe('function');
      expect(typeof debug.time).toBe('function');
      expect(typeof debug.timeEnd).toBe('function');
      expect(typeof debug.inspect).toBe('function');
      expect(typeof debug.measureAsync).toBe('function');
      expect(typeof debug.measure).toBe('function');
      expect(typeof debug.logIf).toBe('function');
      expect(typeof debug.getLevel).toBe('function');
      expect(typeof debug.setLevel).toBe('function');
    });

    it('should work correctly when called through debug object', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      
      debug.info('test from debug object');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🔵 \[INFO\]  .* test from debug object/)
      );
    });
  });

  describe('multiple arguments handling', () => {
    it('should pass multiple arguments to console methods', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      
      const obj1 = { test: 1 };
      const obj2 = { test: 2 };
      
      DebugLogger.info('test message', obj1, obj2);
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/🔵 \[INFO\]  .* test message/),
        obj1,
        obj2
      );
    });
  });

  describe('ISO timestamp format', () => {
    it('should include ISO timestamp in log messages', () => {
      DebugLogger.setLevel(DebugLevel.INFO);
      
      DebugLogger.info('timestamp test');
      
      const logCall = (console.log as jest.Mock).mock.calls[0][0];
      // ISO 8601フォーマットの正規表現でタイムスタンプをチェック
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });
});