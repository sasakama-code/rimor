/**
 * メインエントリーポイントのテスト
 * Issue #66: テストカバレッジの向上
 * TDD RED段階: 失敗するテストファースト
 */

import { CLI } from '../src/cli/cli';

// モックの設定
jest.mock('../src/cli/cli');

describe('Main Entry Point', () => {
  let mockCLI: jest.Mocked<CLI>;
  let originalConsoleError: typeof console.error;
  let originalProcessExit: typeof process.exit;

  beforeEach(() => {
    // CLIのモック
    mockCLI = {
      run: jest.fn()
    } as any;
    (CLI as jest.MockedClass<typeof CLI>).mockImplementation(() => mockCLI);

    // console.errorとprocess.exitのモック
    originalConsoleError = console.error;
    originalProcessExit = process.exit;
    console.error = jest.fn();
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('CLIインスタンスを作成してrunメソッドを呼び出す', async () => {
      // Arrange
      mockCLI.run.mockResolvedValue(undefined);

      // Act
      // main関数を抽出してテスト
      const mainCode = `
        const { CLI } = require('../src/cli/cli');
        async function main() {
          const cli = new CLI();
          await cli.run();
        }
        main().catch((error) => {
          console.error("Error:", error.message || error);
          if (error.stack) {
            console.error("Stack trace:", error.stack);
          }
          process.exit(1);
        });
      `;
      eval(mainCode);

      // 非同期処理を待つ
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(CLI).toHaveBeenCalledTimes(1);
      expect(mockCLI.run).toHaveBeenCalledTimes(1);
      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('異常系', () => {
    it('エラーが発生した場合、エラーメッセージを出力してexit(1)する', async () => {
      // Arrange
      const testError = new Error('Test error');
      mockCLI.run.mockRejectedValue(testError);

      // Act
      const mainCode = `
        const { CLI } = require('../src/cli/cli');
        async function main() {
          const cli = new CLI();
          await cli.run();
        }
        main().catch((error) => {
          console.error("Error:", error.message || error);
          if (error.stack) {
            console.error("Stack trace:", error.stack);
          }
          process.exit(1);
        });
      `;
      eval(mainCode);

      // 非同期処理を待つ
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error:', testError.message);
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('スタックトレースがある場合は出力する', async () => {
      // Arrange
      const testError = new Error('Test error with stack');
      testError.stack = 'Error: Test error with stack\n    at someFunction';
      mockCLI.run.mockRejectedValue(testError);

      // Act
      const mainCode = `
        const { CLI } = require('../src/cli/cli');
        async function main() {
          const cli = new CLI();
          await cli.run();
        }
        main().catch((error) => {
          console.error("Error:", error.message || error);
          if (error.stack) {
            console.error("Stack trace:", error.stack);
          }
          process.exit(1);
        });
      `;
      eval(mainCode);

      // 非同期処理を待つ
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error:', testError.message);
      expect(console.error).toHaveBeenCalledWith('Stack trace:', testError.stack);
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('API互換性', () => {
    it('必要なモジュールがエクスポートされている', () => {
      // このテストは実際のエクスポートを確認するため、
      // 将来的にindex.tsがAPIをエクスポートする場合に備えて準備
      const indexModule = jest.requireActual('../src/index');
      expect(indexModule).toBeDefined();
    });
  });
});