import { TestErrorContext } from './error-context';
import { AIOptimizedFormatter } from '../ai-output/formatter';
import * as path from 'path';

/**
 * AI向けテストエラーフォーマット
 */
export interface AITestErrorReport {
  version: string;
  format: 'ai-test-error';
  summary: ErrorSummary;
  errorGroups: ErrorGroup[];
  contextualInstructions: ContextualInstructions;
  quickActions: QuickAction[];
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
  private aiOptimizedFormatter: AIOptimizedFormatter;
  
  constructor() {
    this.aiOptimizedFormatter = new AIOptimizedFormatter();
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
    
    // 文脈的な指示の生成
    const contextualInstructions = this.generateInstructions(
      errorContexts,
      errorGroups
    );
    
    // クイックアクションの生成
    const quickActions = this.generateQuickActions(errorGroups);
    
    return {
      version: this.VERSION,
      format: 'ai-test-error',
      summary,
      errorGroups,
      contextualInstructions,
      quickActions
    };
  }
  
  /**
   * マークダウン形式で出力
   */
  formatAsMarkdown(report: AITestErrorReport): string {
    let markdown = '# テストエラー分析レポート\n\n';
    
    // サマリー
    markdown += '## サマリー\n';
    markdown += `- **総エラー数**: ${report.summary.totalErrors}\n`;
    markdown += `- **重大エラー**: ${report.summary.criticalErrors}\n`;
    markdown += `- **影響テストファイル**: ${report.summary.testFileCount}\n`;
    markdown += `- **推定修正時間**: ${report.summary.estimatedFixTime}分\n\n`;
    
    if (report.summary.commonPatterns.length > 0) {
      markdown += '### 共通パターン\n';
      report.summary.commonPatterns.forEach(pattern => {
        markdown += `- ${pattern}\n`;
      });
      markdown += '\n';
    }
    
    // クイックアクション
    if (report.quickActions.length > 0) {
      markdown += '## 推奨アクション\n';
      report.quickActions.forEach((action, index) => {
        markdown += `### ${index + 1}. ${action.description}\n`;
        markdown += `\`\`\`bash\n${action.command}\n\`\`\`\n`;
        markdown += `期待される結果: ${action.expectedOutcome}\n\n`;
      });
    }
    
    // エラーグループ
    markdown += '## エラー詳細\n\n';
    report.errorGroups.forEach((group, groupIndex) => {
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
        
        markdown += '**修正案**:\n';
        markdown += '```typescript\n';
        markdown += error.suggestedFix.code;
        markdown += '\n```\n';
        markdown += `${error.suggestedFix.explanation} (信頼度: ${Math.round(error.suggestedFix.confidence * 100)}%)\n\n`;
      });
    });
    
    // AI向け指示
    markdown += '## デバッグ手順\n\n';
    report.contextualInstructions.debuggingSteps.forEach((step, index) => {
      markdown += `${index + 1}. ${step}\n`;
    });
    
    markdown += '\n---\n\n';
    markdown += '## AI向け指示\n\n';
    markdown += report.contextualInstructions.forAI;
    
    return markdown;
  }
  
  /**
   * JSON形式で出力
   */
  formatAsJSON(report: AITestErrorReport): string {
    return JSON.stringify(report, null, 2);
  }
  
  /**
   * エラーのグループ化（類似エラーをまとめる）
   */
  private groupErrors(contexts: TestErrorContext[]): ErrorGroup[] {
    const groups = new Map<string, ErrorGroup>();
    
    contexts.forEach(context => {
      const pattern = this.detectErrorPattern(context);
      
      if (!groups.has(pattern)) {
        groups.set(pattern, {
          pattern,
          priority: this.calculatePriority(context),
          errors: [],
          commonSolution: this.findCommonSolution(pattern)
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
    if (context.errorType === 'FILE_NOT_FOUND' || 
        context.error.message.includes('Cannot find module')) {
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
    const id = `${context.testFile}-${context.testName}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '-');
    
    return {
      id,
      testFile: path.relative(process.cwd(), context.testFile),
      testName: context.testName,
      errorMessage: context.error.message,
      context: {
        failedAssertion: context.codeContext.failedCode,
        relevantCode: this.extractRelevantCode(context),
        stackTrace: context.error.stack || ''
      },
      suggestedFix: this.generateFixSuggestion(context),
      relatedInfo: {
        sourceFile: context.relatedFiles.sourceFile,
        dependencies: context.relatedFiles.dependencies
      }
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
    const topAction = context.suggestedActions
      .sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
      })[0];
    
    if (topAction) {
      return {
        explanation: topAction.reasoning,
        code: topAction.codeSnippet || context.codeContext.failedCode,
        confidence: topAction.priority === 'high' ? 0.9 : 0.7
      };
    }
    
    // デフォルトの提案
    return {
      explanation: 'エラーメッセージを確認して適切な修正を行ってください',
      code: context.codeContext.failedCode,
      confidence: 0.5
    };
  }
  
  /**
   * 共通の解決策を検索
   */
  private findCommonSolution(pattern: string): string | undefined {
    const solutions: Record<string, string> = {
      'モジュール未検出エラー': 'npm install を実行するか、インポートパスを確認してください',
      'タイムアウトエラー': 'jest.setTimeout() でタイムアウト時間を延長するか、非同期処理を確認してください',
      'アサーション不一致': '期待値と実際の値を確認し、テストロジックを修正してください',
      '型エラー': 'TypeScriptの型定義を確認し、適切な型アノテーションを追加してください',
      'Null/Undefined参照エラー': 'オプショナルチェイニング（?.）やnullチェックを追加してください',
      'モック関連エラー': 'モックの設定を確認し、jest.mock() の呼び出しを適切に配置してください'
    };
    
    return solutions[pattern];
  }
  
  /**
   * サマリーの生成
   */
  private generateSummary(
    contexts: TestErrorContext[],
    groups: ErrorGroup[]
  ): ErrorSummary {
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
        low: 5
      };
      return total + (group.errors.length * timePerError[group.priority]);
    }, 0);
    
    return {
      totalErrors: contexts.length,
      criticalErrors,
      testFileCount: testFiles.size,
      commonPatterns: groups.map(g => g.pattern),
      estimatedFixTime: Math.ceil(estimatedTime)
    };
  }
  
  /**
   * 文脈的な指示の生成
   */
  private generateInstructions(
    contexts: TestErrorContext[],
    groups: ErrorGroup[]
  ): ContextualInstructions {
    const hasTypeScriptErrors = groups.some(g => 
      g.errors.some(e => e.errorMessage.includes('TS'))
    );
    
    const debuggingSteps = [
      hasTypeScriptErrors ? 'TypeScriptコンパイルエラーを最初に修正' : null,
      'criticalエラーから順に修正',
      '各修正後にnpm testで確認',
      '関連するソースファイルも確認',
      'すべてのテストがパスすることを確認'
    ].filter(Boolean) as string[];
    
    return {
      forHuman: `${contexts.length}個のテストエラーが検出されました。` +
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
      
      debuggingSteps
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
        expectedOutcome: 'すべての型エラーが表示されます'
      });
    }
    
    // モジュール未検出エラーがある場合
    if (groups.some(g => g.pattern === 'モジュール未検出エラー')) {
      actions.push({
        command: 'npm install',
        description: '依存関係のインストール',
        expectedOutcome: '不足しているモジュールがインストールされます'
      });
    }
    
    // 常に含めるアクション
    actions.push({
      command: 'npm test -- --no-coverage',
      description: 'カバレッジなしでテスト実行（高速）',
      expectedOutcome: '修正したテストの結果を素早く確認できます'
    });
    
    return actions;
  }
}