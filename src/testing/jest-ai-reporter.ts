import type { Reporter, Test, TestResult, AggregatedResult } from '@jest/reporters';
import { TestErrorContextCollector } from './error-context';
import { AITestErrorFormatter } from './ai-error-formatter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Jest用AIエラーレポーター
 * Context Engineeringベースでエラー情報を収集・フォーマット
 */
export class JestAIReporter implements Reporter {
  private errorCollector: TestErrorContextCollector;
  private errorFormatter: AITestErrorFormatter;
  private collectedErrors: any[] = [];
  private outputPath: string;
  private enableConsoleOutput: boolean;
  
  constructor(globalConfig: any, options: any = {}) {
    this.errorCollector = new TestErrorContextCollector();
    this.errorFormatter = new AITestErrorFormatter();
    this.outputPath = options.outputPath || 'test-errors-ai.md';
    this.enableConsoleOutput = options.enableConsoleOutput !== false;
  }
  
  /**
   * テスト実行開始時
   */
  onRunStart(results: AggregatedResult, options: any): void {
    this.collectedErrors = [];
    
    if (this.enableConsoleOutput) {
      console.log('\n🤖 AI Error Reporter: エラー収集を開始します...\n');
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
          
          this.collectedErrors.push(context);
          
          if (this.enableConsoleOutput) {
            console.log(`  ❌ ${assertion.fullName}`);
          }
        } catch (collectError) {
          // 収集エラーは無視（テスト実行を妨げない）
          console.error('Error collecting context:', collectError);
        }
      }
    }
  }
  
  /**
   * テスト実行完了時
   */
  async onRunComplete(contexts: Set<any>, results: AggregatedResult): Promise<void> {
    if (this.collectedErrors.length === 0) {
      if (this.enableConsoleOutput) {
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
      
      // マークダウン形式で出力
      const markdown = this.errorFormatter.formatAsMarkdown(report);
      await fs.promises.writeFile(this.outputPath, markdown, 'utf-8');
      
      // JSON形式でも出力（オプション）
      const jsonPath = this.outputPath.replace(/\.md$/, '.json');
      const json = this.errorFormatter.formatAsJSON(report);
      await fs.promises.writeFile(jsonPath, json, 'utf-8');
      
      if (this.enableConsoleOutput) {
        this.printSummary(report);
      }
      
    } catch (error) {
      console.error('AI Error Reporter failed:', error);
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
        (error as any).expected = assertMatch[1];
        (error as any).actual = assertMatch[2];
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
  private printSummary(report: any): void {
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
      report.summary.commonPatterns.forEach((pattern: string) => {
        console.log(`  - ${pattern}`);
      });
    }
    
    if (report.quickActions.length > 0) {
      console.log(`\n💡 推奨アクション:`);
      report.quickActions.forEach((action: any, index: number) => {
        console.log(`  ${index + 1}. ${action.description}`);
        console.log(`     $ ${action.command}`);
      });
    }
    
    console.log(`\n📄 詳細レポート: ${this.outputPath}`);
    console.log('='.repeat(80) + '\n');
  }
}

/**
 * Jestカスタムレポーターのエクスポート
 * jest.config.mjsで使用
 */
export default JestAIReporter;