import type { Reporter, Test, TestResult, AggregatedResult } from '@jest/reporters';
import { TestErrorContextCollector, TestErrorContext } from './error-context.js';
import { AITestErrorFormatter } from './ai-error-formatter.js';
import { CITraceabilityCollector, CITraceability } from './ci-traceability.js';
import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity.js';

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
  private outputPath: string;
  private enableConsoleOutput: boolean;
  private ciTraceability: CITraceability | null = null;
  
  constructor(globalConfig: unknown, options: JestAIReporterOptions = {}) {
    this.errorCollector = new TestErrorContextCollector();
    this.errorFormatter = new AITestErrorFormatter();
    
    // デフォルトの出力先を.rimor/reports/に設定
    const defaultOutputDir = path.join(process.cwd(), '.rimor', 'reports');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(defaultOutputDir)) {
      fs.mkdirSync(defaultOutputDir, { recursive: true });
    }
    
    this.outputPath = options.outputPath || path.join(defaultOutputDir, 'test-errors-ai.md');
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
  }
  
  /**
   * テスト実行開始時
   */
  onRunStart(results: AggregatedResult, options: unknown): void {
    this.collectedErrors = [];
    
    // CI環境情報を収集
    this.ciTraceability = CITraceabilityCollector.collect();
    
    if (this.enableConsoleOutput) {
      // CI環境では最小限の出力
      if (process.env.CI === 'true') {
        console.log('\n🤖 AI Error Reporter: 有効');
      } else {
        console.log('\n🤖 AI Error Reporter: エラー収集を開始します...');
        if (this.ciTraceability) {
          console.log(`📍 CI実行: ${this.ciTraceability.workflow} #${this.ciTraceability.runNumber}`);
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
    // 失敗したテストのみ処理
    if (testResult.numFailingTests === 0) {
      return;
    }
    
    // エラーコンテキストの収集
    for (const assertion of testResult.testResults) {
      if (assertion.status === 'failed' && assertion.failureMessages.length > 0) {
        try {
          // エラーオブジェクトの再構築
          const error = this.reconstructError(assertion.failureMessages[0]);
          
          // コンテキスト収集
          const context = await this.errorCollector.collectErrorContext(
            error,
            test.path,
            assertion.fullName,
            process.cwd()
          );
          
          // CIトレーサビリティ情報を追加
          if (this.ciTraceability) {
            context.ciTraceability = {
              ...this.ciTraceability,
              errorHash: CITraceabilityCollector.generateErrorHash({
                testFile: test.path,
                testName: assertion.fullName,
                errorMessage: assertion.failureMessages[0]
              })
            };
          }
          
          this.collectedErrors.push(context);
          
          if (this.enableConsoleOutput && process.env.CI !== 'true') {
            console.log(`  ❌ ${assertion.fullName}`);
          }
        } catch (collectError) {
          // 収集エラーは無視（テスト実行を妨げない）
          if (process.env.CI !== 'true') {
            console.error('Error collecting context:', collectError);
          }
        }
      }
    }
  }
  
  /**
   * テスト実行完了時
   */
  async onRunComplete(contexts: Set<unknown>, results: AggregatedResult): Promise<void> {
    if (this.collectedErrors.length === 0) {
      if (this.enableConsoleOutput && process.env.CI !== 'true') {
        console.log('\n✅ すべてのテストがパスしました！\n');
      }
      return;
    }
    
    try {
      // AI向けレポートの生成
      const report = await this.errorFormatter.formatErrors(
        this.collectedErrors,
        process.cwd()
      );
      
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
    
    // Jestのエラーメッセージフォーマットを解析
    const lines = failureMessage.split('\n');
    
    // エラーメッセージの抽出
    const messageMatch = failureMessage.match(/Error: (.+?)(?:\n|$)/);
    if (messageMatch) {
      error.message = messageMatch[1];
    } else {
      // アサーションエラーの場合
      const assertMatch = failureMessage.match(/expect\(.*?\)[\s\S]*?Expected: (.+?)\n[\s\S]*?Received: (.+?)(?:\n|$)/);
      if (assertMatch) {
        error.message = `Expected: ${assertMatch[1]}, Received: ${assertMatch[2]}`;
        const errorWithDetails = error as Error & { expected?: string; actual?: string };
        errorWithDetails.expected = assertMatch[1];
        errorWithDetails.actual = assertMatch[2];
      } else {
        error.message = lines[0] || 'Unknown error';
      }
    }
    
    // スタックトレースの抽出
    const stackStart = failureMessage.indexOf('    at ');
    if (stackStart !== -1) {
      error.stack = failureMessage.substring(stackStart);
    }
    
    return error;
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
      console.log(`\n🤖 AI Error Report: ${report.summary.totalErrors}個のエラーを検出 → ${maskedPath}\n`);
      return;
    }
    
    // ローカル環境では詳細な出力
    console.log('\n' + '='.repeat(80));
    console.log('🤖 AI Error Report Summary');
    console.log('='.repeat(80));
    
    console.log(`\n📊 統計:`);
    console.log(`  - 総エラー数: ${report.summary.totalErrors}`);
    console.log(`  - 重大エラー: ${report.summary.criticalErrors}`);
    console.log(`  - 影響ファイル: ${report.summary.testFileCount}`);
    console.log(`  - 推定修正時間: ${report.summary.estimatedFixTime}分`);
    
    if (report.summary.commonPatterns.length > 0) {
      console.log(`\n🔍 検出されたパターン:`);
      report.summary.commonPatterns.forEach((pattern) => {
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