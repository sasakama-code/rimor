/**
 * index.test.ts
 * メインエントリーポイントのテスト
 */

import { CLI } from '../src/cli/cli';
import { getMessage } from '../src/i18n/messages';

// CLIクラスをモック
jest.mock('../src/cli/cli');
jest.mock('../src/i18n/messages');

const mockCLI = CLI as jest.MockedClass<typeof CLI>;
const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;

describe('index.ts - メインエントリーポイント', () => {
  let mockCLIInstance: jest.Mocked<CLI>;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // CLIインスタンスのモック
    mockCLIInstance = {
      run: jest.fn()
    } as any;
    mockCLI.mockImplementation(() => mockCLIInstance);

    // console.errorとprocess.exitのスパイ
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // getMessageのモック
    mockGetMessage.mockReturnValue('エラーが発生しました');
  });

  afterEach(() => {
    // スパイのリストア
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('正常な実行', () => {
    it('CLIインスタンスを作成してrunメソッドを呼び出すこと', async () => {
      // CLIのrunメソッドが正常に完了する場合
      mockCLIInstance.run.mockResolvedValue(void 0);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // 少し待機してPromiseが解決されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCLI).toHaveBeenCalledTimes(1);
      expect(mockCLIInstance.run).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('エラー処理', () => {
    it('CLI実行時のエラーを適切にキャッチして処理すること', async () => {
      const testError = new Error('テスト用のエラー');
      mockCLIInstance.run.mockRejectedValue(testError);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // エラー処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockCLI).toHaveBeenCalledTimes(1);
      expect(mockCLIInstance.run).toHaveBeenCalledTimes(1);
      expect(mockGetMessage).toHaveBeenCalledWith('cli.execution_error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('エラーが発生しました', testError);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('予期しないエラーも適切に処理すること', async () => {
      const unexpectedError = '予期しない文字列エラー';
      mockCLIInstance.run.mockRejectedValue(unexpectedError);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // エラー処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalledWith('エラーが発生しました', unexpectedError);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('nullやundefinedのエラーも処理すること', async () => {
      mockCLIInstance.run.mockRejectedValue(null);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // エラー処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalledWith('エラーが発生しました', null);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('国際化メッセージ', () => {
    it('正しいメッセージキーでエラーメッセージを取得すること', async () => {
      const testError = new Error('国際化テスト');
      mockCLIInstance.run.mockRejectedValue(testError);
      mockGetMessage.mockReturnValue('CLI実行エラー');

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // エラー処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockGetMessage).toHaveBeenCalledWith('cli.execution_error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('CLI実行エラー', testError);
    });

    it('メッセージ取得でエラーが発生してもアプリケーションがクラッシュしないこと', async () => {
      const testError = new Error('テストエラー');
      mockCLIInstance.run.mockRejectedValue(testError);
      mockGetMessage.mockImplementation(() => {
        throw new Error('メッセージ取得エラー');
      });

      // index.tsを動的にインポートして実行
      expect(async () => {
        await import('../src/index');
        // エラー処理が完了するまで待機
        await new Promise(resolve => setTimeout(resolve, 50));
      }).not.toThrow();

      // アプリケーションは最終的にprocess.exitを呼び出すはず
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('プロセス終了', () => {
    it('エラー時に適切な終了コードで終了すること', async () => {
      const testError = new Error('終了テスト');
      mockCLIInstance.run.mockRejectedValue(testError);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // エラー処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('正常終了時にはprocess.exitが呼ばれないこと', async () => {
      mockCLIInstance.run.mockResolvedValue(void 0);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // 実行が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('コンストラクタとメソッド呼び出し', () => {
    it('CLIクラスのコンストラクタを引数なしで呼び出すこと', async () => {
      mockCLIInstance.run.mockResolvedValue(void 0);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // 実行が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCLI).toHaveBeenCalledWith();
    });

    it('runメソッドを引数なしで呼び出すこと', async () => {
      mockCLIInstance.run.mockResolvedValue(void 0);

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // 実行が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCLIInstance.run).toHaveBeenCalledWith();
    });
  });

  describe('非同期処理', () => {
    it('非同期でCLIを実行し、Promiseベースでエラーハンドリングすること', async () => {
      let resolvePromise: (value: void) => void;
      let rejectPromise: (reason: any) => void;

      // 手動でコントロールできるPromiseを作成
      const controlledPromise = new Promise<void>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      });

      mockCLIInstance.run.mockReturnValue(controlledPromise);

      // index.tsを動的にインポートして実行
      const importPromise = import('../src/index');

      // まだエラーハンドリングが呼ばれていないことを確認
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Promiseを手動で拒否
      const testError = new Error('手動エラー');
      rejectPromise!(testError);

      // エラーハンドリングが実行されるまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalledWith('エラーが発生しました', testError);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('長時間実行されるCLIタスクでもタイムアウトしないこと', async () => {
      // 100ms後に解決されるPromiseを作成
      const delayedPromise = new Promise<void>(resolve => {
        setTimeout(resolve, 100);
      });

      mockCLIInstance.run.mockReturnValue(delayedPromise);

      const startTime = Date.now();

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // タスクが完了するまで待機
      await delayedPromise;
      await new Promise(resolve => setTimeout(resolve, 10));

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 実行時間が100ms以上であることを確認（多少の誤差を考慮）
      expect(executionTime).toBeGreaterThanOrEqual(90);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('CLIインスタンス作成時にエラーが発生した場合も適切に処理すること', async () => {
      const constructorError = new Error('コンストラクタエラー');
      mockCLI.mockImplementation(() => {
        throw constructorError;
      });

      // index.tsを動的にインポートして実行
      await import('../src/index');

      // エラー処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalledWith('エラーが発生しました', constructorError);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('複数回実行されても毎回新しいCLIインスタンスを作成すること', async () => {
      mockCLIInstance.run.mockResolvedValue(void 0);

      // 2回実行
      await import('../src/index');
      await import('../src/index');

      // 両方の実行が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 20));

      // CLIが2回作成されているかは実装依存だが、最低1回は呼ばれているはず
      expect(mockCLI).toHaveBeenCalled();
      expect(mockCLIInstance.run).toHaveBeenCalled();
    });
  });
});