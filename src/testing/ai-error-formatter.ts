import { TestErrorContext } from './error-context';
import { UnifiedReportEngine } from '../reporting/core/UnifiedReportEngine';
import { AIJsonFormatter } from '../reporting/formatters/AIJsonFormatter';
import * as path from 'path';
import { sanitizeObject } from '../utils/stringSanitizer';

/**
 * AI向けテストエラーフォーマット
 */
export interface AITestErrorReport {
  version: string;
  format: 'ai-test-error';
  executionDate: string;
  summary: ErrorSummary;
  errorGroups: ErrorGroup[];
  contextualInstructions: ContextualInstructions;
  quickActions: QuickAction[];
  ciTraceability?: CITraceabilityInfo;
  executionInfo?: ExecutionInfo;
}

interface ExecutionInfo {
  startTime: string;
  endTime?: string;
  duration?: number;
  environment: string;
  totalFilesProcessed?: number;
  totalErrorsCollected?: number;
  jestReportedFailures?: number;
}

interface CITraceabilityInfo {
  runId: string;
  runNumber: string;
  workflow: string;
  job?: string;
  actor?: string;
  repository: string;
  branch: string;
  sha: string;
  prNumber?: string;
  deepLink?: string;
  prLink?: string;
  nodeVersion: string;
  os: string;
  timestamp: string;
}

interface ErrorSummary {
  totalErrors: number;
  criticalErrors: number;
  testFileCount: number;
  commonPatterns: string[];
  estimatedFixTime: number; // 分単位
}

interface ErrorGroup {
  pattern: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  errors: FormattedError[];
  commonSolution?: string;
}

interface FormattedError {
  id: string;
  testFile: string;
  testName: string;
  errorMessage: string;
  context: {
    failedAssertion: string;
    relevantCode: string;
    stackTrace: string;
  };
  suggestedFix: {
    explanation: string;
    code: string;
    confidence: number;
  };
  relatedInfo: {
    sourceFile?: string;
    dependencies: string[];
  };
  errorHash?: string; // CI環境でのエラー照合用
}

interface ContextualInstructions {
  forHuman: string;
  forAI: string;
  debuggingSteps: string[];
}

interface QuickAction {
  command: string;
  description: string;
  expectedOutcome: string;
}

/**
 * AI向けテストエラーフォーマッタ
 * Context Engineeringの原則に基づいてエラー情報を最適化
 */
export class AITestErrorFormatter {
  private readonly VERSION = '0.8.0';
  private reportEngine: UnifiedReportEngine;

  constructor() {
    this.reportEngine = new UnifiedReportEngine();
    this.reportEngine.setStrategy(new AIJsonFormatter());
  }

  /**
   * エラーコンテキストをAI向けにフォーマット
   */
  async formatErrors(
    errorContexts: TestErrorContext[],
    projectPath: string
  ): Promise<AITestErrorReport> {
    // エラーのグループ化（Context Isolation）
    const errorGroups = this.groupErrors(errorContexts);

    // サマリーの生成（Context Compression）
    const summary = this.generateSummary(errorContexts, errorGroups);

    // CIトレーサビリティ情報の抽出
    const ciTraceability = this.extractCITraceability(errorContexts);

    // 文脈的な指示の生成
    const contextualInstructions = this.generateInstructions(errorContexts, errorGroups);

    // クイックアクションの生成
    const quickActions = this.generateQuickActions(errorGroups);

    // 実行日時を取得
    const executionDate = new Date().toISOString();

    return {
      version: this.VERSION,
      format: 'ai-test-error',
      executionDate,
      summary,
      errorGroups,
      contextualInstructions,
      quickActions,
      ciTraceability,
    };
  }

  /**
   * マークダウン形式で出力
   */
  formatAsMarkdown(report: AITestErrorReport): string {
    // レポート全体をサニタイズ
    const sanitizedReport = sanitizeObject(report) as AITestErrorReport;

    let markdown = '# テストエラー分析レポート\n\n';

    // 実行日時情報
    markdown += '## 📅 実行情報\n';
    if (sanitizedReport.executionInfo) {
      markdown += `- **実行開始**: ${new Date(sanitizedReport.executionInfo.startTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`;
      if (sanitizedReport.executionInfo.endTime) {
        markdown += `- **実行終了**: ${new Date(sanitizedReport.executionInfo.endTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`;
        markdown += `- **実行時間**: ${sanitizedReport.executionInfo.duration}秒\n`;
      }
      markdown += `- **実行環境**: ${sanitizedReport.executionInfo.environment}\n`;
      if (sanitizedReport.executionInfo.totalFilesProcessed) {
        markdown += `- **処理ファイル数**: ${sanitizedReport.executionInfo.totalFilesProcessed}\n`;
      }
      if (
        sanitizedReport.executionInfo.totalErrorsCollected !== undefined &&
        sanitizedReport.executionInfo.jestReportedFailures !== undefined
      ) {
        markdown += `- **収集エラー数**: ${sanitizedReport.executionInfo.totalErrorsCollected} / Jest報告数: ${sanitizedReport.executionInfo.jestReportedFailures}\n`;
        if (
          sanitizedReport.executionInfo.totalErrorsCollected <
          sanitizedReport.executionInfo.jestReportedFailures
        ) {
          markdown += `- **⚠️ 警告**: 一部のエラーが収集されていない可能性があります\n`;
        }
      }
    } else {
      markdown += `- **レポート生成日時**: ${new Date(sanitizedReport.executionDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n`;
    }
    markdown += '\n';

    // CIトレーサビリティ情報またはローカル実行情報
    if (sanitizedReport.ciTraceability) {
      if (sanitizedReport.ciTraceability.runId === 'local') {
        markdown += '## 💻 ローカル実行情報\n';
        markdown += `- **実行ユーザー**: ${sanitizedReport.ciTraceability.actor}\n`;
        markdown += `- **実行環境**: Node.js ${sanitizedReport.ciTraceability.nodeVersion} on ${sanitizedReport.ciTraceability.os}\n`;
        markdown += `- **実行時刻**: ${sanitizedReport.ciTraceability.timestamp}\n`;
      } else {
        markdown += '## 🔍 CI実行情報\n';
        markdown += `- **ワークフロー**: ${sanitizedReport.ciTraceability.workflow} #${sanitizedReport.ciTraceability.runNumber}\n`;
        markdown += `- **リポジトリ**: ${sanitizedReport.ciTraceability.repository}\n`;
        markdown += `- **ブランチ**: ${sanitizedReport.ciTraceability.branch}\n`;
        markdown += `- **コミット**: ${sanitizedReport.ciTraceability.sha.substring(0, 7)}\n`;
        if (sanitizedReport.ciTraceability.prNumber) {
          markdown += `- **PR**: [#${sanitizedReport.ciTraceability.prNumber}](${sanitizedReport.ciTraceability.prLink})\n`;
        }
        if (sanitizedReport.ciTraceability.deepLink) {
          markdown += `- **CI実行**: [${sanitizedReport.ciTraceability.runId}](${sanitizedReport.ciTraceability.deepLink})\n`;
        }
        markdown += `- **実行環境**: Node.js ${sanitizedReport.ciTraceability.nodeVersion} on ${sanitizedReport.ciTraceability.os}\n`;
        markdown += `- **実行時刻**: ${sanitizedReport.ciTraceability.timestamp}\n`;
      }
      markdown += '\n';
    }

    // サマリー
    markdown += '## サマリー\n';
    markdown += `- **総エラー数**: ${sanitizedReport.summary.totalErrors}\n`;
    markdown += `- **重大エラー**: ${sanitizedReport.summary.criticalErrors}\n`;
    markdown += `- **影響テストファイル**: ${sanitizedReport.summary.testFileCount}\n`;
    markdown += `- **推定修正時間**: ${sanitizedReport.summary.estimatedFixTime}分\n\n`;

    if (sanitizedReport.summary.commonPatterns.length > 0) {
      markdown += '### 共通パターン\n';
      sanitizedReport.summary.commonPatterns.forEach(pattern => {
        markdown += `- ${pattern}\n`;
      });
      markdown += '\n';
    }

    // クイックアクション
    if (sanitizedReport.quickActions.length > 0) {
      markdown += '## 推奨アクション\n';
      sanitizedReport.quickActions.forEach((action, index) => {
        markdown += `### ${index + 1}. ${action.description}\n`;
        markdown += `\`\`\`bash\n${action.command}\n\`\`\`\n`;
        markdown += `期待される結果: ${action.expectedOutcome}\n\n`;
      });
    }

    // エラーグループ
    markdown += '## エラー詳細\n\n';
    sanitizedReport.errorGroups.forEach((group, groupIndex) => {
      markdown += `### グループ ${groupIndex + 1}: ${group.pattern} (優先度: ${group.priority})\n\n`;

      if (group.commonSolution) {
        markdown += `**共通の解決策**: ${group.commonSolution}\n\n`;
      }

      group.errors.forEach((error, errorIndex) => {
        markdown += `#### エラー ${groupIndex + 1}.${errorIndex + 1}: ${error.testName}\n`;
        markdown += `- **ファイル**: ${error.testFile}\n`;
        markdown += `- **エラー**: ${error.errorMessage}\n\n`;

        markdown += '**失敗コード**:\n';
        markdown += '```typescript\n';
        markdown += error.context.failedAssertion;
        markdown += '\n```\n\n';

        // 有効な修正案がある場合のみ修正案セクションを表示
        const hasValidFix =
          error.suggestedFix.code &&
          !error.suggestedFix.code.startsWith('// 自動修正案を生成できません') &&
          !error.suggestedFix.code.startsWith('// ') &&
          error.suggestedFix.confidence > 0.3;

        if (hasValidFix) {
          markdown += '**修正案**:\n';
          markdown += '```typescript\n';
          markdown += error.suggestedFix.code;
          markdown += '\n```\n';
          markdown += `${error.suggestedFix.explanation} (信頼度: ${Math.round(error.suggestedFix.confidence * 100)}%)\n\n`;
        } else {
          // 修正案がない場合は説明のみ表示
          markdown += `**対処方法**: ${error.suggestedFix.explanation}\n\n`;
        }
      });
    });

    // AI向け指示
    markdown += '## デバッグ手順\n\n';
    sanitizedReport.contextualInstructions.debuggingSteps.forEach((step, index) => {
      markdown += `${index + 1}. ${step}\n`;
    });

    markdown += '\n---\n\n';
    markdown += '## AI向け指示\n\n';
    markdown += sanitizedReport.contextualInstructions.forAI;

    return markdown;
  }

  /**
   * JSON形式で出力
   */
  formatAsJSON(report: AITestErrorReport): string {
    // 実行情報を含めてJSON出力
    const reportWithExecutionInfo = {
      ...report,
      executionDate: report.executionDate || new Date().toISOString(),
    };

    // レポート全体をサニタイズしてからJSON化
    const sanitizedReport = sanitizeObject(reportWithExecutionInfo);
    return JSON.stringify(sanitizedReport, null, 2);
  }

  /**
   * PRコメント用の簡潔なサマリーマークダウンを生成
   */
  formatAsSummaryMarkdown(report: AITestErrorReport): string {
    // レポート全体をサニタイズ
    const sanitizedReport = sanitizeObject(report) as AITestErrorReport;

    let summary = '## 🤖 AI Error Report Summary\n\n';

    // エラー統計
    summary += '### 📊 エラー統計\n';
    summary += `- **総エラー数**: ${sanitizedReport.summary.totalErrors}\n`;
    summary += `- **重大度別**:\n`;

    // 優先度別のエラー数を集計
    const priorityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    sanitizedReport.errorGroups.forEach(group => {
      priorityCounts[group.priority] += group.errors.length;
    });

    if (priorityCounts.critical > 0) {
      summary += `  - 🔴 Critical: ${priorityCounts.critical}\n`;
    }
    if (priorityCounts.high > 0) {
      summary += `  - 🟠 High: ${priorityCounts.high}\n`;
    }
    if (priorityCounts.medium > 0) {
      summary += `  - 🟡 Medium: ${priorityCounts.medium}\n`;
    }
    if (priorityCounts.low > 0) {
      summary += `  - 🟢 Low: ${priorityCounts.low}\n`;
    }

    summary += `- **影響ファイル数**: ${sanitizedReport.summary.testFileCount}\n`;
    summary += `- **推定修正時間**: ${sanitizedReport.summary.estimatedFixTime}分\n\n`;

    // CI情報（存在する場合）
    if (sanitizedReport.ciTraceability) {
      summary += '### 🔍 実行環境\n';
      summary += `- **Node.js**: ${sanitizedReport.ciTraceability.nodeVersion}\n`;
      summary += `- **OS**: ${sanitizedReport.ciTraceability.os}\n\n`;
    }

    // 検出されたパターン
    if (sanitizedReport.summary.commonPatterns.length > 0) {
      summary += '### 🔍 検出されたエラーパターン\n';
      const topPatterns = sanitizedReport.summary.commonPatterns.slice(0, 5);
      topPatterns.forEach(pattern => {
        summary += `- ${pattern}\n`;
      });
      if (sanitizedReport.summary.commonPatterns.length > 5) {
        summary += `- _他 ${sanitizedReport.summary.commonPatterns.length - 5} パターン_\n`;
      }
      summary += '\n';
    }

    // 最も重要なエラー（Critical/Highの最初の3つ）
    const importantErrors = sanitizedReport.errorGroups
      .filter(g => g.priority === 'critical' || g.priority === 'high')
      .flatMap(g => g.errors)
      .slice(0, 3);

    if (importantErrors.length > 0) {
      summary += '### ⚠️ 最重要エラー\n';
      importantErrors.forEach((error, index) => {
        summary += `${index + 1}. **${error.testName}**\n`;
        summary += `   - ファイル: \`${error.testFile}\`\n`;
        summary += `   - エラー: ${error.errorMessage.split('\n')[0]}\n`;
      });
      summary += '\n';
    }

    // クイックアクション（最初の2つ）
    if (sanitizedReport.quickActions.length > 0) {
      summary += '### 💡 推奨アクション\n';
      const topActions = sanitizedReport.quickActions.slice(0, 2);
      topActions.forEach(action => {
        summary += `- **${action.description}**: \`${action.command}\`\n`;
      });
      summary += '\n';
    }

    // 詳細レポートへの案内
    summary += '---\n';
    summary +=
      '📄 **詳細レポート**: GitHub Actionsのアーティファクトから`ai-error-report-*`をダウンロードしてください。\n';

    return summary;
  }

  /**
   * エラーのグループ化（類似エラーをまとめる）
   */
  private extractCITraceability(contexts: TestErrorContext[]): CITraceabilityInfo | undefined {
    // 最初のコンテキストからCIトレーサビリティ情報を取得
    const firstContextWithCI = contexts.find(ctx => (ctx as any).ciTraceability);
    if (!firstContextWithCI) {
      return undefined;
    }

    const ci = (firstContextWithCI as any).ciTraceability;
    const { CITraceabilityCollector } = require('./ci-traceability');

    return {
      runId: ci.runId,
      runNumber: ci.runNumber,
      workflow: ci.workflow,
      repository: ci.repository,
      branch: ci.branch,
      sha: ci.sha,
      prNumber: ci.prNumber,
      deepLink: CITraceabilityCollector.generateDeepLink(ci),
      prLink: ci.prNumber ? CITraceabilityCollector.generatePRLink(ci) : undefined,
      nodeVersion: ci.nodeVersion,
      os: ci.os,
      timestamp: ci.timestamp,
    };
  }

  private groupErrors(contexts: TestErrorContext[]): ErrorGroup[] {
    const groups = new Map<string, ErrorGroup>();

    contexts.forEach(context => {
      const pattern = this.detectErrorPattern(context);

      if (!groups.has(pattern)) {
        groups.set(pattern, {
          pattern,
          priority: this.calculatePriority(context),
          errors: [],
          commonSolution: this.findCommonSolution(pattern),
        });
      }

      const formattedError = this.formatSingleError(context);
      groups.get(pattern)!.errors.push(formattedError);
    });

    // 優先度でソート
    return Array.from(groups.values()).sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * エラーパターンの検出
   */
  private detectErrorPattern(context: TestErrorContext): string {
    const message = context.error.message.toLowerCase();

    // 一般的なパターンの検出
    if (message.includes('cannot find module')) {
      return 'モジュール未検出エラー';
    }
    if (message.includes('timeout')) {
      return 'タイムアウトエラー';
    }
    if (message.includes('expected') && message.includes('received')) {
      return 'アサーション不一致';
    }
    if (message.includes('typeerror')) {
      return '型エラー';
    }
    if (message.includes('undefined') || message.includes('null')) {
      return 'Null/Undefined参照エラー';
    }
    if (message.includes('mock')) {
      return 'モック関連エラー';
    }

    return 'その他のエラー';
  }

  /**
   * 優先度の計算
   */
  private calculatePriority(context: TestErrorContext): ErrorGroup['priority'] {
    // TypeScriptコンパイルエラーは最優先
    if (context.error.message.includes('TS') && context.error.message.match(/TS\d{4}/)) {
      return 'critical';
    }

    // モジュール未検出やインポートエラーは高優先度
    if (
      context.errorType === 'FILE_NOT_FOUND' ||
      context.error.message.includes('Cannot find module')
    ) {
      return 'high';
    }

    // アサーション不一致は中優先度
    if (context.error.message.includes('Expected')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 単一エラーのフォーマット
   */
  private formatSingleError(context: TestErrorContext): FormattedError {
    const id = `${context.testFile}-${context.testName}-${Date.now()}`.replace(
      /[^a-zA-Z0-9-]/g,
      '-'
    );

    return {
      id,
      testFile: path.relative(process.cwd(), context.testFile),
      testName: context.testName,
      errorMessage: context.error.message,
      context: {
        failedAssertion: context.codeContext.failedCode,
        relevantCode: this.extractRelevantCode(context),
        stackTrace: context.error.stack || '',
      },
      suggestedFix: this.generateFixSuggestion(context),
      relatedInfo: {
        sourceFile: context.relatedFiles.sourceFile,
        dependencies: context.relatedFiles.dependencies,
      },
      errorHash: (context as any).ciTraceability?.errorHash,
    };
  }

  /**
   * 関連コードの抽出
   */
  private extractRelevantCode(context: TestErrorContext): string {
    const { surroundingCode, failedCode } = context.codeContext;

    // 失敗した行を中心に前後のコードを含める
    const before = surroundingCode.before.split('\n').slice(-5).join('\n');
    const after = surroundingCode.after.split('\n').slice(0, 5).join('\n');

    return `${before}\n>>> ${failedCode} <<<\n${after}`;
  }

  /**
   * 修正提案の生成
   */
  private generateFixSuggestion(context: TestErrorContext): FormattedError['suggestedFix'] {
    // 推奨アクションから最も優先度の高いものを選択
    const topAction = context.suggestedActions.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    })[0];

    if (topAction && topAction.codeSnippet) {
      return {
        explanation: topAction.reasoning,
        code: topAction.codeSnippet,
        confidence: topAction.priority === 'high' ? 0.9 : 0.7,
      };
    }

    // パターンベースの修正提案生成
    const pattern = this.detectErrorPattern(context);
    const patternBasedFix = this.generatePatternBasedFix(context, pattern);

    if (patternBasedFix) {
      return patternBasedFix;
    }

    // デフォルトの提案（修正案なし）
    return {
      explanation:
        'エラーメッセージとスタックトレースを確認して、問題の原因を特定してください。関連するソースファイルとテストコードの両方を確認することをお勧めします。',
      code: '',
      confidence: 0,
    };
  }

  /**
   * パターンベースの修正提案生成
   */
  private generatePatternBasedFix(
    context: TestErrorContext,
    pattern: string
  ): FormattedError['suggestedFix'] | null {
    const { failedCode } = context.codeContext;
    const errorMessage = context.error.message;

    // アサーション不一致の場合
    if (pattern === 'アサーション不一致') {
      // expect().toContain()エラーの場合
      if (errorMessage.includes('toContain') && failedCode.includes('expect')) {
        const actualMatch = errorMessage.match(/Received: \[(.*?)\]/);
        if (actualMatch && actualMatch[1]) {
          return {
            explanation: `配列に期待値が含まれていません。実際の配列の内容を確認して、期待値を修正してください。`,
            code: `// 実際の配列: [${actualMatch[1]}]\n// 期待値を配列の実際の要素に変更するか、\n// テスト対象のコードを修正してください`,
            confidence: 0.6,
          };
        }
      }

      // expect().toBe()エラーの場合
      if (errorMessage.includes('Expected:') && errorMessage.includes('Received:')) {
        const expectedMatch = errorMessage.match(/Expected: (.+?)(?:\n|$)/);
        const receivedMatch = errorMessage.match(/Received: (.+?)(?:\n|$)/);

        if (expectedMatch && receivedMatch) {
          return {
            explanation: `期待値と実際の値が一致しません。期待値: ${expectedMatch[1]}, 実際: ${receivedMatch[1]}`,
            code: `// 期待値を実際の値に合わせる場合:\n// ${failedCode.replace(expectedMatch[1], receivedMatch[1])}\n// または、テスト対象のコードを修正してください`,
            confidence: 0.5,
          };
        }
      }
    }

    // モジュール未検出エラーの場合
    if (pattern === 'モジュール未検出エラー') {
      const moduleMatch = errorMessage.match(/Cannot find module '(.+?)'/);
      if (moduleMatch && moduleMatch[1]) {
        const moduleName = moduleMatch[1];
        return {
          explanation: `モジュール '${moduleName}' が見つかりません。`,
          code: `// 以下のいずれかを実行:\n// 1. npm install ${moduleName}\n// 2. インポートパスを修正\n// 3. tsconfig.jsonのパスマッピングを確認`,
          confidence: 0.7,
        };
      }
    }

    // TypeScriptエラーの場合
    if (pattern === '型エラー' && errorMessage.includes('TS')) {
      const tsErrorMatch = errorMessage.match(/TS(\d{4}): (.+)/);
      if (tsErrorMatch) {
        const errorCode = tsErrorMatch[1];
        const errorDesc = tsErrorMatch[2];
        return {
          explanation: `TypeScriptエラー TS${errorCode}: ${errorDesc}`,
          code: `// TypeScriptエラーを修正してください\n// 型定義の追加、型アサーションの使用、\n// またはコードロジックの修正が必要です`,
          confidence: 0.4,
        };
      }
    }

    return null;
  }

  /**
   * 共通の解決策を検索
   */
  private findCommonSolution(pattern: string): string | undefined {
    const solutions: Record<string, string> = {
      モジュール未検出エラー: 'npm install を実行するか、インポートパスを確認してください',
      タイムアウトエラー:
        'jest.setTimeout() でタイムアウト時間を延長するか、非同期処理を確認してください',
      アサーション不一致: '期待値と実際の値を確認し、テストロジックを修正してください',
      型エラー: 'TypeScriptの型定義を確認し、適切な型アノテーションを追加してください',
      'Null/Undefined参照エラー': 'オプショナルチェイニング（?.）やnullチェックを追加してください',
      モック関連エラー: 'モックの設定を確認し、jest.mock() の呼び出しを適切に配置してください',
    };

    return solutions[pattern];
  }

  /**
   * サマリーの生成
   */
  private generateSummary(contexts: TestErrorContext[], groups: ErrorGroup[]): ErrorSummary {
    const testFiles = new Set(contexts.map(c => c.testFile));
    const criticalErrors = groups
      .filter(g => g.priority === 'critical')
      .reduce((sum, g) => sum + g.errors.length, 0);

    // 修正時間の推定（エラータイプと数に基づく）
    const estimatedTime = groups.reduce((total, group) => {
      const timePerError = {
        critical: 30,
        high: 20,
        medium: 10,
        low: 5,
      };
      return total + group.errors.length * timePerError[group.priority];
    }, 0);

    // デバッグ情報：エラー数の不一致を警告
    if (process.env.DEBUG_AI_REPORTER === 'true') {
      console.log(`[AI Formatter Debug] Total errors to format: ${contexts.length}`);
      console.log(`[AI Formatter Debug] Test files with errors: ${testFiles.size}`);
      console.log(`[AI Formatter Debug] Error groups: ${groups.length}`);
    }

    return {
      totalErrors: contexts.length,
      criticalErrors,
      testFileCount: testFiles.size,
      commonPatterns: groups.map(g => g.pattern),
      estimatedFixTime: Math.ceil(estimatedTime),
    };
  }

  /**
   * 文脈的な指示の生成
   */
  private generateInstructions(
    contexts: TestErrorContext[],
    groups: ErrorGroup[]
  ): ContextualInstructions {
    const hasTypeScriptErrors = groups.some(g => g.errors.some(e => e.errorMessage.includes('TS')));

    const debuggingSteps = [
      hasTypeScriptErrors ? 'TypeScriptコンパイルエラーを最初に修正' : null,
      'criticalエラーから順に修正',
      '各修正後にnpm testで確認',
      '関連するソースファイルも確認',
      'すべてのテストがパスすることを確認',
    ].filter(Boolean) as string[];

    return {
      forHuman:
        `${contexts.length}個のテストエラーが検出されました。` +
        `推定修正時間は${groups[0].errors.length * 15}分です。` +
        `優先度順に修正を進めてください。`,

      forAI: `以下のテストエラーを修正してください：

プロジェクト: Rimor (テスト品質分析ツール)
言語: TypeScript
テストフレームワーク: Jest

修正要件:
- 既存のコードスタイルを維持
- 型安全性を確保
- テストの可読性を保持
- 各修正後にテストを実行

優先順位:
1. TypeScriptコンパイルエラー（critical）
2. モジュール未検出エラー（high）
3. その他のエラー

各エラーグループには共通の解決策が提示されています。
効率的に修正を進めてください。`,

      debuggingSteps,
    };
  }

  /**
   * クイックアクションの生成
   */
  private generateQuickActions(groups: ErrorGroup[]): QuickAction[] {
    const actions: QuickAction[] = [];

    // TypeScriptエラーがある場合
    if (groups.some(g => g.pattern === '型エラー')) {
      actions.push({
        command: 'npx tsc --noEmit',
        description: 'TypeScriptコンパイルチェック',
        expectedOutcome: 'すべての型エラーが表示されます',
      });
    }

    // モジュール未検出エラーがある場合
    if (groups.some(g => g.pattern === 'モジュール未検出エラー')) {
      actions.push({
        command: 'npm install',
        description: '依存関係のインストール',
        expectedOutcome: '不足しているモジュールがインストールされます',
      });
    }

    // 常に含めるアクション
    actions.push({
      command: 'npm test -- --no-coverage',
      description: 'カバレッジなしでテスト実行（高速）',
      expectedOutcome: '修正したテストの結果を素早く確認できます',
    });

    return actions;
  }
}
