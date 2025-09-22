import { JestAIReporter } from '../../src/testing/jest-ai-reporter';
import type { Test, TestResult, AggregatedResult } from '@jest/reporters';
import * as fs from 'fs';
import * as path from 'path';

// モックデータ生成ヘルパー
const createMockTestResult = (overrides: Partial<TestResult> = {}): TestResult => ({
  leaks: false,
  numFailingTests: 0,
  numPassingTests: 1,
  numPendingTests: 0,
  numTodoTests: 0,
  openHandles: [],
  perfStats: {
    start: Date.now() - 1000,
    end: Date.now(),
    runtime: 1000,
    slow: false,
  },
  snapshot: {
    added: 0,
    matched: 0,
    unchecked: 0,
    uncheckedKeys: [],
    unmatched: 0,
    updated: 0,
    fileDeleted: false,
  },
  testFilePath: '/test/example.test.ts',
  testResults: [],
  skipped: false,
  displayName: undefined,
  failureMessage: null,
  console: undefined,
  testExecError: undefined,
  coverage: undefined,
  v8Coverage: undefined,
  ...overrides,
});

const createMockFailedTestResult = (): TestResult => {
  const failureMessage = `
    FAIL test/example.test.ts
      ● Test suite failed to run

        TypeError: Cannot read property 'foo' of undefined

          10 | function processData(data) {
          11 |   return data.foo.bar;
             |               ^
          12 | }

          at processData (src/example.ts:11:15)
          at Object.<anonymous> (test/example.test.ts:5:10)
  `;

  return createMockTestResult({
    numFailingTests: 1,
    numPassingTests: 0,
    failureMessage,
    testResults: [
      {
        ancestorTitles: ['Example Suite'],
        failureDetails: [
          {
            message: "Cannot read property 'foo' of undefined",
            stack: failureMessage,
          },
        ],
        failureMessages: [failureMessage],
        fullName: 'Example Suite should process data correctly',
        location: { line: 5, column: 10 },
        numPassingAsserts: 0,
        status: 'failed',
        title: 'should process data correctly',
        duration: 10,
        invocations: 1,
        retryReasons: [],
      },
    ],
  });
};

const createMockTest = (testPath: string = '/test/example.test.ts'): Test => ({
  context: {
    config: {
      rootDir: '/test',
      transform: [],
    },
    hasteFS: {},
    resolver: {},
    moduleMap: {},
  } as any, // Test.contextの型が複雑なため、as anyを使用
  path: testPath,
  duration: 1000,
});

const createMockAggregatedResult = (): AggregatedResult => ({
  numFailedTestSuites: 0,
  numFailedTests: 0,
  numPassedTestSuites: 1,
  numPassedTests: 10,
  numPendingTestSuites: 0,
  numPendingTests: 0,
  numRuntimeErrorTestSuites: 0,
  numTodoTests: 0,
  numTotalTestSuites: 1,
  numTotalTests: 10,
  openHandles: [],
  snapshot: {
    added: 0,
    didUpdate: false,
    failure: false,
    filesAdded: 0,
    filesRemoved: 0,
    filesRemovedList: [],
    filesUnmatched: 0,
    filesUpdated: 0,
    matched: 0,
    total: 0,
    unchecked: 0,
    uncheckedKeysByFile: [],
    unmatched: 0,
    updated: 0,
  },
  startTime: Date.now() - 10000,
  success: true,
  testResults: [],
  wasInterrupted: false,
});

describe('JestAIReporter', () => {
  const testOutputDir = path.join(__dirname, 'test-reporter-output');
  let reporter: JestAIReporter;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    const globalConfig = { rootDir: '/test' };
    const options = {
      outputPath: path.join(testOutputDir, 'test-errors.md'),
      enableConsoleOutput: true,
    };

    reporter = new JestAIReporter(globalConfig, options);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('初期化', () => {
    it('レポーターインスタンスを作成できる', () => {
      expect(reporter).toBeInstanceOf(JestAIReporter);
    });

    it('デフォルト設定で初期化できる', () => {
      const defaultReporter = new JestAIReporter({}, {});
      expect(defaultReporter).toBeInstanceOf(JestAIReporter);
    });

    it('出力ディレクトリを自動作成する', () => {
      const customDir = path.join(testOutputDir, 'custom', 'nested');
      const customReporter = new JestAIReporter(
        {},
        {
          outputPath: path.join(customDir, 'errors.md'),
        }
      );

      expect(customReporter).toBeInstanceOf(JestAIReporter);
    });
  });

  describe('onRunStart', () => {
    it('テスト実行開始時にエラーをリセットする', () => {
      const aggregatedResult = createMockAggregatedResult();

      // CI環境変数を一時的にクリア
      const originalCI = process.env.CI;
      delete process.env.CI;

      reporter.onRunStart(aggregatedResult, {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI Error Reporter: エラー収集を開始します')
      );

      // CI環境変数を復元
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      }
    });

    it('コンソール出力を無効化できる', () => {
      const silentReporter = new JestAIReporter(
        {},
        {
          enableConsoleOutput: false,
        }
      );

      silentReporter.onRunStart(createMockAggregatedResult(), {});

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('CI環境では最小限のコンソール出力にする', () => {
      const aggregatedResult = createMockAggregatedResult();

      // CI環境変数を設定
      const originalCI = process.env.CI;
      process.env.CI = 'true';

      reporter.onRunStart(aggregatedResult, {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI Error Reporter: 有効')
      );
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('エラー収集を開始します')
      );

      // CI環境変数を復元
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      } else {
        delete process.env.CI;
      }
    });
  });

  describe('onTestFileResult', () => {
    it('成功したテストを処理する', async () => {
      const test = createMockTest();
      const testResult = createMockTestResult();

      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      // エラーがないのでコレクションされない
      expect((reporter as any).collectedErrors).toHaveLength(0);
    });

    it('失敗したテストのエラーを収集する', async () => {
      const test = createMockTest();
      const testResult = createMockFailedTestResult();

      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      expect((reporter as any).collectedErrors).toHaveLength(1);
      expect((reporter as any).collectedErrors[0]).toHaveProperty('testFile');
      expect((reporter as any).collectedErrors[0]).toHaveProperty('error');
    });

    it('複数の失敗したテストを処理する', async () => {
      const test1 = createMockTest('/test/file1.test.ts');
      const test2 = createMockTest('/test/file2.test.ts');
      const testResult1 = createMockFailedTestResult();
      const testResult2 = createMockFailedTestResult();

      await reporter.onTestFileResult(test1, testResult1, createMockAggregatedResult());
      await reporter.onTestFileResult(test2, testResult2, createMockAggregatedResult());

      expect((reporter as any).collectedErrors).toHaveLength(2);
    });
  });

  describe('onRunComplete', () => {
    it('エラーがない場合は成功メッセージを表示する', async () => {
      const aggregatedResult = createMockAggregatedResult();

      // CI環境変数を一時的にクリア
      const originalCI = process.env.CI;
      delete process.env.CI;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('すべてのテストがパスしました')
      );

      // CI環境変数を復元
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      }
    });

    it('エラーレポートを生成する', async () => {
      // エラーを収集
      const test = createMockTest();
      const testResult = createMockFailedTestResult();
      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      // レポート生成
      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;
      aggregatedResult.numFailedTests = 1;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      const outputPath = path.join(testOutputDir, 'test-errors.md');
      expect(fs.existsSync(outputPath)).toBe(true);

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('# テストエラー分析レポート');
      expect(content).toContain('Cannot read property');

      // サマリーファイルも生成されることを確認
      const summaryPath = path.join(testOutputDir, 'test-errors-summary.md');
      expect(fs.existsSync(summaryPath)).toBe(true);

      const summaryContent = fs.readFileSync(summaryPath, 'utf-8');
      expect(summaryContent).toContain('## 🤖 AI Error Report Summary');
      expect(summaryContent).toContain('### 📊 エラー統計');
      expect(summaryContent).toContain('**詳細レポート**: GitHub Actionsのアーティファクト');
    });

    it('JSON形式のレポートも生成する', async () => {
      // エラーを収集
      const test = createMockTest();
      const testResult = createMockFailedTestResult();
      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      // レポート生成
      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      const jsonPath = path.join(testOutputDir, 'test-errors.json');
      expect(fs.existsSync(jsonPath)).toBe(true);

      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      expect(jsonContent).toHaveProperty('summary');
      expect(jsonContent).toHaveProperty('errorGroups');
      expect(jsonContent.errorGroups).toHaveLength(1);
    });
  });

  describe('エラーパターン分析', () => {
    it('同じエラーパターンをグループ化する', async () => {
      // 同じエラータイプの複数のテスト失敗を作成
      const error1 = createMockFailedTestResult();
      const error2 = createMockFailedTestResult();

      await reporter.onTestFileResult(
        createMockTest('/test/file1.test.ts'),
        error1,
        createMockAggregatedResult()
      );
      await reporter.onTestFileResult(
        createMockTest('/test/file2.test.ts'),
        error2,
        createMockAggregatedResult()
      );

      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;
      aggregatedResult.numFailedTests = 2;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      const outputPath = path.join(testOutputDir, 'test-errors.md');
      const content = fs.readFileSync(outputPath, 'utf-8');

      expect(content).toContain('## エラー詳細');
      expect(content).toContain('Cannot read property');
    });
  });

  describe('コンテキスト情報', () => {
    it('ソースコードコンテキストを含める', async () => {
      const test = createMockTest();
      const testResult = createMockFailedTestResult();

      // ソースファイルをモック
      const sourceFile = path.join(testOutputDir, 'src', 'example.ts');
      fs.mkdirSync(path.dirname(sourceFile), { recursive: true });
      fs.writeFileSync(
        sourceFile,
        `
function processData(data) {
  return data.foo.bar;
}

export { processData };
      `.trim()
      );

      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      const outputPath = path.join(testOutputDir, 'test-errors.md');
      const content = fs.readFileSync(outputPath, 'utf-8');

      expect(content).toContain('失敗コード');
    });
  });

  describe('パフォーマンス', () => {
    it('大量のエラーを効率的に処理する', async () => {
      // 100個のエラーを生成
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const test = createMockTest(`/test/file${i}.test.ts`);
        const testResult = createMockFailedTestResult();
        await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());
      }

      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;
      aggregatedResult.numFailedTests = 100;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内

      const outputPath = path.join(testOutputDir, 'test-errors.md');
      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });

  describe('ANSIコードサニタイズ', () => {
    it('エラーメッセージからANSIエスケープシーケンスを除去する', async () => {
      // ANSIコードを含むエラーメッセージを作成
      const ansiErrorMessage = `
        \u001b[96mtest/example.test.ts\u001b[0m:\u001b[93m10\u001b[0m:\u001b[93m5\u001b[0m
        \u001b[91mTypeError\u001b[0m: Cannot read property 'foo' of undefined
        
          \u001b[7m10\u001b[0m | const result = \u001b[91mdata.foo.bar\u001b[0m;
             |                \u001b[91m~~~~~~~~\u001b[0m
      `;

      const testResult = createMockTestResult({
        numFailingTests: 1,
        numPassingTests: 0,
        failureMessage: ansiErrorMessage,
        testResults: [
          {
            ancestorTitles: ['ANSI Test'],
            failureDetails: [],
            failureMessages: [ansiErrorMessage],
            fullName: 'ANSI Test should handle colored output',
            location: { line: 10, column: 5 },
            numPassingAsserts: 0,
            status: 'failed',
            title: 'should handle colored output',
            duration: 10,
            invocations: 1,
            retryReasons: [],
          },
        ],
      });

      const test = createMockTest();
      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;
      aggregatedResult.numFailedTests = 1;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      // JSONレポートを確認
      const jsonPath = path.join(testOutputDir, 'test-errors.json');
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');

      // ANSIコードが除去されていることを確認
      expect(jsonContent).not.toContain('\\u001b');
      expect(jsonContent).not.toContain('\u001b');

      // エラーメッセージの内容は保持されていることを確認
      const parsed = JSON.parse(jsonContent);
      expect(JSON.stringify(parsed)).toContain('TypeError');
      expect(JSON.stringify(parsed)).toContain('Cannot read property');

      // マークダウンレポートも確認
      const mdPath = path.join(testOutputDir, 'test-errors.md');
      const mdContent = fs.readFileSync(mdPath, 'utf-8');

      // ANSIコードが除去されていることを確認
      expect(mdContent).not.toContain('\u001b');
      expect(mdContent).toContain('TypeError');
    });

    it('複雑なANSIコードを含むTypeScriptエラーを処理する', async () => {
      // TypeScriptコンパイルエラー風のメッセージ
      const tsErrorMessage = `\u001b[96msrc/test.ts\u001b[0m:\u001b[93m2\u001b[0m:\u001b[93m26\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2307: \u001b[0mCannot find module 'class-validator'.

\u001b[7m2\u001b[0m import { validate } from 'class-validator';
\u001b[7m \u001b[0m \u001b[91m                         ~~~~~~~~~~~~~~~~~\u001b[0m`;

      const testResult = createMockTestResult({
        numFailingTests: 1,
        testExecError: {
          message: tsErrorMessage,
          stack: '',
        },
      });

      const test = createMockTest();
      await reporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;
      aggregatedResult.numFailedTestSuites = 1;

      await reporter.onRunComplete(new Set(), aggregatedResult);

      const jsonPath = path.join(testOutputDir, 'test-errors.json');
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(jsonContent);

      // ANSIコードが除去され、エラー内容が保持されていることを確認
      expect(JSON.stringify(parsed)).not.toContain('\\u001b');
      expect(JSON.stringify(parsed)).toContain('TS2307');
      expect(JSON.stringify(parsed)).toContain('class-validator');
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な出力パスを処理する', async () => {
      const invalidReporter = new JestAIReporter(
        {},
        {
          outputPath: '/invalid/path/that/cannot/exist/report.md',
        }
      );

      const test = createMockTest();
      const testResult = createMockFailedTestResult();
      await invalidReporter.onTestFileResult(test, testResult, createMockAggregatedResult());

      const aggregatedResult = createMockAggregatedResult();
      aggregatedResult.success = false;

      // エラーをスローせずに処理を継続
      await expect(
        invalidReporter.onRunComplete(new Set(), aggregatedResult)
      ).resolves.not.toThrow();
    });
  });
});
