import type { Reporter, Test, TestResult, AggregatedResult } from '@jest/reporters';
import { TestErrorContextCollector, TestErrorContext } from './error-context';
import { AITestErrorFormatter } from './ai-error-formatter';
import { CITraceabilityCollector, CITraceability } from './ci-traceability';
import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';
import { sanitizeForAIReport } from '../utils/stringSanitizer';

/**
 * Jest用AIエラーレポーター
 * Context Engineeringベースでエラー情報を収集・フォーマット
 */
/**
 * Jestレポーターオプション
 */
export interface JestAIReporterOptions {
  outputPath?: string;
  enableConsoleOutput?: boolean;
  [key: string]: unknown;
}

export class JestAIReporter implements Reporter {
  private errorCollector: TestErrorContextCollector;
  private errorFormatter: AITestErrorFormatter;
  private collectedErrors: TestErrorContext[] = [];
  private suiteErrors: Map<string, Error> = new Map();
  private outputPath: string;
  private enableConsoleOutput: boolean;
  private ciTraceability: CITraceability | null = null;
  private testRunStartTime: Date | null = null;
  private totalFailedTests: number = 0;
  private totalFailedSuites: number = 0;
  private processedTestFiles: Set<string> = new Set();

  constructor(globalConfig: unknown, options: JestAIReporterOptions = {}) {
    this.errorCollector = new TestErrorContextCollector();
    this.errorFormatter = new AITestErrorFormatter();

    // デフォルトの出力先を.rimor/reports/に設定
    const defaultOutputDir = path.join(process.cwd(), '.rimor', 'reports');

    // ディレクトリが存在しない場合は作成（エラーハンドリング強化）
    try {
      if (!fs.existsSync(defaultOutputDir)) {
        fs.mkdirSync(defaultOutputDir, { recursive: true });
      }
    } catch (error) {
      // ディレクトリ作成に失敗した場合は、現在のディレクトリを使用
      console.warn(
        'AI Reporter: .rimor/reports/ ディレクトリの作成に失敗しました。現在のディレクトリを使用します。'
      );
      this.outputPath = options.outputPath || path.join(process.cwd(), 'test-errors-ai.md');
      this.enableConsoleOutput = options.enableConsoleOutput !== false;
      return;
    }

    this.outputPath = options.outputPath || path.join(defaultOutputDir, 'test-errors-ai.md');
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
  }

  /**
   * テスト実行開始時
   */
  onRunStart(results: AggregatedResult, options: unknown): void {
    this.collectedErrors = [];
    this.suiteErrors.clear();
    this.testRunStartTime = new Date();
    this.totalFailedTests = 0;
    this.totalFailedSuites = 0;
    this.processedTestFiles.clear();

    // デバッグモード有効時の追加ログ
    if (process.env.DEBUG_AI_REPORTER === 'true') {
      console.log(
        `[AI Reporter Debug] Test run started at: ${this.testRunStartTime.toISOString()}`
      );
      console.log(
        `[AI Reporter Debug] Number of test suites: ${results.numTotalTestSuites || 'unknown'}`
      );
    }

    // CI環境情報を収集
    this.ciTraceability = CITraceabilityCollector.collect();

    if (this.enableConsoleOutput) {
      // CI環境では最小限の出力
      if (process.env.CI === 'true') {
        console.log('\n🤖 AI Error Reporter: 有効');
      } else {
        console.log('\n🤖 AI Error Reporter: エラー収集を開始します...');
        console.log(`📅 実行開始時刻: ${this.testRunStartTime.toISOString()}`);
        if (this.ciTraceability) {
          console.log(
            `📍 CI実行: ${this.ciTraceability.workflow} #${this.ciTraceability.runNumber}`
          );
        }
        console.log('');
      }
    }
  }

  /**
   * 各テストファイル実行後
   */
  async onTestFileResult(
    test: Test,
    testResult: TestResult,
    results: AggregatedResult
  ): Promise<void> {
    // デバッグログ: 処理開始
    if (process.env.DEBUG_AI_REPORTER === 'true') {
      console.log(`[AI Reporter Debug] Processing test file: ${test.path}`);
      console.log(
        `[AI Reporter Debug] Failed tests: ${testResult.numFailingTests}, Suite error: ${!!testResult.testExecError}`
      );
    }

    // 重複処理を防ぐ（ただし、ファイルパスとエラー状態でより精密にチェック）
    const fileKey = `${test.path}-${testResult.numFailingTests}-${!!testResult.testExecError}`;
    if (this.processedTestFiles.has(fileKey)) {
      if (process.env.DEBUG_AI_REPORTER === 'true') {
        console.log(`[AI Reporter Debug] Skipping duplicate processing for: ${fileKey}`);
      }
      return;
    }
    this.processedTestFiles.add(fileKey);

    // スイートレベルのエラーをチェック（モジュール未検出、コンパイルエラーなど）
    if (testResult.testExecError) {
      this.totalFailedSuites++;
      await this.collectSuiteError(test.path, testResult.testExecError);
    }

    // 失敗したテストのみ処理
    if (testResult.numFailingTests === 0) {
      if (process.env.DEBUG_AI_REPORTER === 'true') {
        console.log(`[AI Reporter Debug] No failing tests in: ${test.path}`);
      }
      return;
    }

    // 失敗テスト数を追跡
    this.totalFailedTests += testResult.numFailingTests;

    // デバッグログ出力
    if (process.env.DEBUG_AI_REPORTER === 'true') {
      console.log(
        `[AI Reporter Debug] Processing ${test.path}: ${testResult.numFailingTests} failures`
      );
    }

    // エラーコンテキストの収集
    for (const assertion of testResult.testResults) {
      if (assertion.status === 'failed' && assertion.failureMessages.length > 0) {
        try {
          // 各エラーメッセージを処理（複数のエラーメッセージがある場合）
          for (const failureMessage of assertion.failureMessages) {
            if (!failureMessage || failureMessage.trim() === '') continue;

            // エラーオブジェクトの再構築
            const error = this.reconstructError(failureMessage);

            // コンテキスト収集
            const context = await this.errorCollector.collectErrorContext(
              error,
              test.path,
              assertion.fullName,
              process.cwd()
            );

            // トレーサビリティ情報を追加（CIとローカル両方）
            const traceabilityInfo = this.ciTraceability || {
              runId: 'local',
              runNumber: 'local',
              workflow: 'local',
              job: 'local',
              actor: process.env.USER || 'unknown',
              repository: 'local',
              branch: 'local',
              sha: 'local',
              nodeVersion: process.version,
              os: process.platform,
              timestamp: this.testRunStartTime?.toISOString() || new Date().toISOString(),
              errorHash: '',
            };

            context.ciTraceability = {
              ...traceabilityInfo,
              errorHash: CITraceabilityCollector.generateErrorHash({
                testFile: test.path,
                testName: assertion.fullName,
                errorMessage: failureMessage,
              }),
            };

            this.collectedErrors.push(context);

            if (this.enableConsoleOutput && process.env.CI !== 'true') {
              console.log(`  ❌ ${assertion.fullName}`);
            }
          }
        } catch (collectError) {
          // 収集エラーは無視（テスト実行を妨げない）
          if (process.env.CI !== 'true') {
            console.error('Error collecting context:', collectError);
          }
        }
      }
    }

    // デバッグログ: 現在の収集状況
    if (process.env.DEBUG_AI_REPORTER === 'true') {
      console.log(
        `[AI Reporter Debug] Total errors collected so far: ${this.collectedErrors.length}`
      );
    }
  }

  /**
   * テスト実行完了時
   */
  async onRunComplete(contexts: Set<unknown>, results: AggregatedResult): Promise<void> {
    // デバッグログ: 最終的な収集状況
    if (process.env.DEBUG_AI_REPORTER === 'true') {
      console.log(`\n[AI Reporter Debug] Final report:`);
      console.log(`  - Total failed tests (Jest): ${results.numFailedTests}`);
      console.log(`  - Total failed test suites (Jest): ${results.numFailedTestSuites}`);
      console.log(`  - Total errors collected: ${this.collectedErrors.length}`);
      console.log(`  - Total test files processed: ${this.processedTestFiles.size}`);
    }

    if (this.collectedErrors.length === 0) {
      if (this.enableConsoleOutput && process.env.CI !== 'true') {
        console.log('\n✅ すべてのテストがパスしました！\n');
      }
      return;
    }

    try {
      // AI向けレポートの生成
      const report = await this.errorFormatter.formatErrors(this.collectedErrors, process.cwd());

      // 実行情報をレポートに追加
      const endTime = new Date();
      const duration = this.testRunStartTime
        ? Math.round((endTime.getTime() - this.testRunStartTime.getTime()) / 1000)
        : undefined;

      (report as any).executionInfo = {
        startTime: this.testRunStartTime?.toISOString() || new Date().toISOString(),
        endTime: endTime.toISOString(),
        duration: duration,
        environment: process.env.CI === 'true' ? 'CI' : 'local',
        totalFilesProcessed: this.processedTestFiles.size,
        totalErrorsCollected: this.collectedErrors.length,
        jestReportedFailures: results.numFailedTests,
        jestReportedFailedSuites: results.numFailedTestSuites,
        totalSuiteErrors: this.suiteErrors.size,
      };

      // マークダウン形式で出力（PIIマスキング適用）
      const markdown = this.errorFormatter.formatAsMarkdown(report);
      const maskedMarkdown = PathSecurity.maskAllPaths(markdown, 'Rimor');
      await fs.promises.writeFile(this.outputPath, maskedMarkdown, 'utf-8');

      // JSON形式でも出力（PIIマスキング適用）
      const jsonPath = this.outputPath.replace(/\.md$/, '.json');
      const json = this.errorFormatter.formatAsJSON(report);
      const maskedJson = PathSecurity.maskAllPaths(json, 'Rimor');
      await fs.promises.writeFile(jsonPath, maskedJson, 'utf-8');

      // サマリー形式でも出力（CI環境でのPRコメント用）
      const summaryPath = this.outputPath.replace(/\.md$/, '-summary.md');
      const summaryMarkdown = this.errorFormatter.formatAsSummaryMarkdown(report);
      const maskedSummaryMarkdown = PathSecurity.maskAllPaths(summaryMarkdown, 'Rimor');
      await fs.promises.writeFile(summaryPath, maskedSummaryMarkdown, 'utf-8');

      if (this.enableConsoleOutput) {
        this.printSummary(report);
      }
    } catch (error) {
      if (process.env.CI !== 'true') {
        console.error('AI Error Reporter failed:', error);
      }
    }
  }

  /**
   * エラーメッセージからErrorオブジェクトを再構築
   */
  private reconstructError(failureMessage: string): Error {
    const error = new Error();

    // ANSIエスケープシーケンスを除去してからパース
    const sanitizedMessage = sanitizeForAIReport(failureMessage);

    // Jestのエラーメッセージフォーマットを解析
    const lines = sanitizedMessage.split('\n');

    // エラーメッセージの抽出（様々なエラータイプに対応）
    const errorTypeMatch = sanitizedMessage.match(
      /(Error|TypeError|ReferenceError|SyntaxError|RangeError): (.+?)(?:\n|$)/
    );
    if (errorTypeMatch) {
      error.message = `${errorTypeMatch[1]}: ${errorTypeMatch[2]}`;
    } else {
      // アサーションエラーの場合
      const assertMatch = sanitizedMessage.match(
        /expect\(.*?\)[\s\S]*?Expected: (.+?)\n[\s\S]*?Received: (.+?)(?:\n|$)/
      );
      if (assertMatch) {
        error.message = `Expected: ${assertMatch[1]}, Received: ${assertMatch[2]}`;
        const errorWithDetails = error as Error & { expected?: string; actual?: string };
        errorWithDetails.expected = assertMatch[1];
        errorWithDetails.actual = assertMatch[2];
      } else {
        // その他のエラーメッセージパターン
        const firstNonEmptyLine = lines.find(line => line.trim().length > 0);
        error.message = firstNonEmptyLine || 'Unknown error';
      }
    }

    // スタックトレースの抽出（サニタイズ済み）
    const stackStart = sanitizedMessage.indexOf('    at ');
    if (stackStart !== -1) {
      error.stack = sanitizedMessage.substring(stackStart);
    }

    return error;
  }

  /**
   * スイートレベルのエラーを収集
   */
  private async collectSuiteError(testFilePath: string, execError: unknown): Promise<void> {
    try {
      const rawErrorMessage =
        typeof execError === 'string'
          ? execError
          : (execError as any)?.message || 'Test suite execution failed';

      // エラーメッセージをサニタイズ
      const errorMessage = sanitizeForAIReport(rawErrorMessage);

      // モジュール未検出エラーのパターンをチェック
      const isModuleNotFound =
        errorMessage.includes('Cannot find module') || errorMessage.includes('Module not found');
      const isCompilationError =
        errorMessage.includes('SyntaxError') ||
        errorMessage.includes('TypeError') ||
        errorMessage.includes('ReferenceError');

      // エラータイプを判定
      const errorType = isModuleNotFound
        ? 'MODULE_NOT_FOUND'
        : isCompilationError
          ? 'COMPILATION_ERROR'
          : 'SUITE_EXECUTION_ERROR';

      // エラーコンテキストを作成
      const context: TestErrorContext = {
        timestamp: new Date().toISOString(),
        testFile: testFilePath,
        testName: `[Test Suite] ${path.basename(testFilePath)}`,
        errorType: errorType as any,

        error: {
          message: errorMessage,
          stack: sanitizeForAIReport((execError as any)?.stack || ''),
        },

        codeContext: {
          failedLine: 0,
          failedCode: '',
          surroundingCode: {
            before: '',
            after: '',
          },
          testStructure: {
            describes: [],
            currentTest: `[Suite] ${path.basename(testFilePath)}`,
            hooks: [],
          },
        },

        environment: {
          nodeVersion: process.version,
          ciEnvironment: process.env.CI === 'true',
          memoryUsage: process.memoryUsage(),
        },

        relatedFiles: {
          dependencies: [],
          configFiles: [],
        },

        ciTraceability: this.ciTraceability || undefined,

        suggestedActions: [
          {
            priority:
              errorType === 'MODULE_NOT_FOUND'
                ? 'high'
                : errorType === 'COMPILATION_ERROR'
                  ? 'high'
                  : 'medium',
            action: this.generateSuiteErrorFix(errorType, errorMessage),
            reasoning: `Test suite failed to load due to ${errorType}`,
          },
        ],
      };

      this.collectedErrors.push(context);
      this.suiteErrors.set(testFilePath, execError as Error);

      if (this.enableConsoleOutput && process.env.CI !== 'true') {
        console.log(`  ⚠️ Suite Error [${errorType}]: ${path.basename(testFilePath)}`);
      }
    } catch (error) {
      if (process.env.DEBUG_AI_REPORTER === 'true') {
        console.error('Failed to collect suite error:', error);
      }
    }
  }

  /**
   * スイートエラーの修正提案を生成
   */
  private generateSuiteErrorFix(errorType: string, errorMessage: string): string {
    switch (errorType) {
      case 'MODULE_NOT_FOUND':
        const moduleMatch = errorMessage.match(/Cannot find module ['"](.+?)['"]/);
        const moduleName = moduleMatch ? moduleMatch[1] : 'unknown';
        return `1. ビルドを実行: npm run build\n2. 依存関係を確認: npm install\n3. モジュールパスを確認: ${moduleName}`;

      case 'COMPILATION_ERROR':
        return '1. TypeScriptのコンパイルエラーを確認: npx tsc --noEmit\n2. ビルドを再実行: npm run build:full';

      default:
        return 'テストファイルの構文とインポートを確認してください';
    }
  }

  /**
   * コンソールにサマリーを出力
   */
  private printSummary(report: {
    summary: {
      totalErrors: number;
      criticalErrors: number;
      testFileCount: number;
      estimatedFixTime: number;
      commonPatterns: string[];
    };
    quickActions: Array<{
      description: string;
      command: string;
    }>;
  }): void {
    // CI環境では最小限の出力
    if (process.env.CI === 'true') {
      const maskedPath = PathSecurity.toRelativeOrMasked(this.outputPath);
      console.log(
        `\n🤖 AI Error Report: ${report.summary.totalErrors}個のエラーを検出 → ${maskedPath}\n`
      );
      return;
    }

    // ローカル環境では詳細な出力
    console.log('\n' + '='.repeat(80));
    console.log('🤖 AI Error Report Summary');
    console.log('='.repeat(80));

    // 実行日時を表示
    if (this.testRunStartTime) {
      console.log(`\n📅 実行日時: ${this.testRunStartTime.toISOString()}`);
    }

    console.log(`\n📊 統計:`);
    console.log(`  - 総エラー数: ${report.summary.totalErrors}`);
    console.log(`  - 重大エラー: ${report.summary.criticalErrors}`);
    console.log(`  - 影響ファイル: ${report.summary.testFileCount}`);
    console.log(`  - 推定修正時間: ${report.summary.estimatedFixTime}分`);

    // エラー数の不一致を警告
    if (this.totalFailedTests > 0 && report.summary.totalErrors < this.totalFailedTests) {
      console.log(
        `\n⚠️  警告: Jestが検出した失敗テスト数(${this.totalFailedTests})と記録されたエラー数(${report.summary.totalErrors})に差があります`
      );
      console.log(`    一部のエラーが記録されていない可能性があります`);
    }

    if (report.summary.commonPatterns.length > 0) {
      console.log(`\n🔍 検出されたパターン:`);
      report.summary.commonPatterns.forEach(pattern => {
        console.log(`  - ${pattern}`);
      });
    }

    if (report.quickActions.length > 0) {
      console.log(`\n💡 推奨アクション:`);
      report.quickActions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action.description}`);
        console.log(`     $ ${action.command}`);
      });
    }

    // 出力パスをマスキングして表示
    const maskedPath = PathSecurity.toRelativeOrMasked(this.outputPath);
    console.log(`\n📄 詳細レポート: ${maskedPath}`);
    console.log('='.repeat(80) + '\n');
  }
}

/**
 * Jestカスタムレポーターのエクスポート
 * jest.config.mjsで使用
 */
export default JestAIReporter;
