/**
 * Templated Reporter
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * 構造化データからテンプレートベースの決定論的レポートを生成
 */

import { injectable } from 'inversify';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  StructuredAnalysisResult,
  Issue,
  Severity,
  IssueType,
  ReportGenerationOptions
} from './types';

@injectable()
export class TemplatedReporter {
  private handlebars: typeof Handlebars;
  private summaryTemplate?: HandlebarsTemplateDelegate;
  private detailedTemplate?: HandlebarsTemplateDelegate;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * テンプレートを初期化
   */
  async initialize(): Promise<void> {
    const templatesDir = path.join(__dirname, 'templates');
    
    // サマリーテンプレートを読み込み
    const summarySource = await fs.readFile(
      path.join(templatesDir, 'summary.md.hbs'),
      'utf-8'
    );
    this.summaryTemplate = this.handlebars.compile(summarySource);

    // 詳細テンプレートを読み込み
    const detailedSource = await fs.readFile(
      path.join(templatesDir, 'detailed.md.hbs'),
      'utf-8'
    );
    this.detailedTemplate = this.handlebars.compile(detailedSource);
  }

  /**
   * サマリーレポートを生成
   */
  async generateSummaryReport(
    data: StructuredAnalysisResult,
    options?: ReportGenerationOptions
  ): Promise<string> {
    if (!this.summaryTemplate) {
      await this.initialize();
    }

    const context = this.prepareContext(data, options);
    return this.summaryTemplate!(context);
  }

  /**
   * 詳細レポートを生成
   */
  async generateDetailedReport(
    data: StructuredAnalysisResult,
    options?: ReportGenerationOptions
  ): Promise<string> {
    if (!this.detailedTemplate) {
      await this.initialize();
    }

    const context = this.prepareContext(data, options);
    return this.detailedTemplate!(context);
  }

  /**
   * カスタムテンプレートでレポートを生成
   */
  async generateCustomReport(
    data: StructuredAnalysisResult,
    templatePath: string,
    options?: ReportGenerationOptions
  ): Promise<string> {
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = this.handlebars.compile(templateSource);
    
    const context = this.prepareContext(data, options);
    return template(context);
  }

  /**
   * テンプレート用のコンテキストを準備
   */
  private prepareContext(
    data: StructuredAnalysisResult,
    options?: ReportGenerationOptions
  ): Record<string, unknown> {
    // オプションに基づいてデータをフィルタリング
    let filteredIssues = [...data.issues];

    if (options?.severityFilter && options.severityFilter.length > 0) {
      filteredIssues = filteredIssues.filter(
        issue => options.severityFilter!.includes(issue.severity)
      );
    }

    if (options?.typeFilter && options.typeFilter.length > 0) {
      filteredIssues = filteredIssues.filter(
        issue => options.typeFilter!.includes(issue.type)
      );
    }

    // オプションに基づいてデータを調整
    if (!options?.includeCodeSnippets) {
      filteredIssues = filteredIssues.map(issue => ({
        ...issue,
        codeSnippet: undefined
      }));
    }

    if (!options?.includeDataFlow) {
      filteredIssues = filteredIssues.map(issue => ({
        ...issue,
        dataFlow: undefined
      }));
    }

    if (!options?.includeRecommendations) {
      filteredIssues = filteredIssues.map(issue => ({
        ...issue,
        recommendation: undefined
      }));
    }

    return {
      ...data,
      issues: filteredIssues,
      options
    };
  }

  /**
   * Handlebarsヘルパーを登録
   */
  private registerHelpers(): void {
    // 日付フォーマット
    this.handlebars.registerHelper('formatDate', (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    });

    // 実行時間フォーマット
    this.handlebars.registerHelper('formatDuration', (duration: number) => {
      if (duration < 1000) {
        return `${duration}ms`;
      } else if (duration < 60000) {
        return `${(duration / 1000).toFixed(2)}秒`;
      } else {
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}分${seconds}秒`;
      }
    });

    // パーセンテージ計算
    this.handlebars.registerHelper('percentage', (value: number, total: number) => {
      if (total === 0) return '0';
      return ((value / total) * 100).toFixed(1);
    });

    // 重要度でフィルタリング
    this.handlebars.registerHelper('filterBySeverity', (issues: Issue[], severity: string) => {
      return issues.filter(issue => issue.severity === severity);
    });

    // 重要度でグループ化
    this.handlebars.registerHelper('groupBySeverity', (issues: Issue[]) => {
      const grouped: Record<string, Issue[]> = {};
      const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
      
      severityOrder.forEach(severity => {
        grouped[severity] = issues.filter(issue => issue.severity === severity);
      });
      
      return grouped;
    });

    // 重要度アイコン
    this.handlebars.registerHelper('severityIcon', (severity: Severity) => {
      const icons: Record<Severity, string> = {
        [Severity.CRITICAL]: '🔴',
        [Severity.HIGH]: '🟠',
        [Severity.MEDIUM]: '🟡',
        [Severity.LOW]: '🟢',
        [Severity.INFO]: 'ℹ️'
      };
      return icons[severity] || '❓';
    });

    // 重要度ラベル
    this.handlebars.registerHelper('severityLabel', (severity: string) => {
      const labels: Record<string, string> = {
        'critical': 'Critical Issues',
        'high': 'High Priority Issues',
        'medium': 'Medium Priority Issues',
        'low': 'Low Priority Issues',
        'info': 'Informational Issues'
      };
      return labels[severity] || severity;
    });

    // 問題タイプの説明
    this.handlebars.registerHelper('issueTypeDescription', (type: string) => {
      const descriptions: Record<string, string> = {
        [IssueType.SQL_INJECTION]: 'SQLインジェクション脆弱性',
        [IssueType.XSS]: 'クロスサイトスクリプティング脆弱性',
        [IssueType.PATH_TRAVERSAL]: 'パストラバーサル脆弱性',
        [IssueType.COMMAND_INJECTION]: 'コマンドインジェクション脆弱性',
        [IssueType.LDAP_INJECTION]: 'LDAPインジェクション脆弱性',
        [IssueType.XPATH_INJECTION]: 'XPathインジェクション脆弱性',
        [IssueType.MISSING_TEST]: 'テストファイルの欠如',
        [IssueType.INSUFFICIENT_ASSERTION]: '不十分なアサーション',
        [IssueType.TEST_QUALITY]: 'テスト品質の問題',
        [IssueType.CODE_QUALITY]: 'コード品質の問題',
        [IssueType.SECURITY_MISCONFIGURATION]: 'セキュリティ設定の問題',
        [IssueType.SENSITIVE_DATA_EXPOSURE]: '機密データの露出'
      };
      return descriptions[type] || type;
    });

    // ファイル拡張子から言語を検出
    this.handlebars.registerHelper('detectLanguage', (filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const languageMap: Record<string, string> = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.rb': 'ruby',
        '.go': 'go',
        '.php': 'php',
        '.cs': 'csharp',
        '.cpp': 'cpp',
        '.c': 'c',
        '.rs': 'rust'
      };
      return languageMap[ext] || 'text';
    });

    // インデックスをインクリメント
    this.handlebars.registerHelper('inc', (value: number) => {
      return value + 1;
    });

    // デフォルト値
    this.handlebars.registerHelper('default', (value: unknown, defaultValue: unknown) => {
      return value !== undefined && value !== null ? value : defaultValue;
    });

    // 条件付き表示
    this.handlebars.registerHelper('gt', (a: number, b: number) => {
      return a > b;
    });

    this.handlebars.registerHelper('lt', (a: number, b: number) => {
      return a < b;
    });

    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => {
      return a === b;
    });

    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => {
      return a !== b;
    });

    this.handlebars.registerHelper('and', (...args: unknown[]) => {
      // 最後の引数はHandlebarsのオプションオブジェクトなので除外
      const values = args.slice(0, -1);
      return values.every(v => !!v);
    });

    this.handlebars.registerHelper('or', (...args: unknown[]) => {
      // 最後の引数はHandlebarsのオプションオブジェクトなので除外
      const values = args.slice(0, -1);
      return values.some(v => !!v);
    });
  }

  /**
   * テンプレートのプリコンパイル（パフォーマンス向上）
   */
  async precompileTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, 'templates');
    const templateFiles = await fs.readdir(templatesDir);

    for (const file of templateFiles) {
      if (file.endsWith('.hbs')) {
        const source = await fs.readFile(
          path.join(templatesDir, file),
          'utf-8'
        );
        const precompiled = this.handlebars.precompile(source);
        
        // プリコンパイル済みテンプレートを保存（将来の最適化用）
        const outputPath = path.join(
          templatesDir,
          file.replace('.hbs', '.precompiled.js')
        );
        await fs.writeFile(
          outputPath,
          `module.exports = ${precompiled};`,
          'utf-8'
        );
      }
    }
  }
}