/**
 * レポートフォーマッター戦略
 * Strategy Patternによるフォーマット処理の抽象化
 * SOLID原則：開放閉鎖の原則（OCP）を適用
 */

import { UnifiedAnalysisResult } from '../../../orchestrator/types';
import { UnifiedAnalyzeOptions, UnifiedAnalyzeResult } from '../unified-analyze-types';

/**
 * レポートフォーマッター戦略インターフェース
 */
export interface IReportFormatter {
  format(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult;
  getSupportedFormat(): string;
}

/**
 * テキストフォーマッター
 */
export class TextReportFormatter implements IReportFormatter {
  format(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult {
    return {
      format: 'text',
      content: this.generateTextContent(analysisResult, options),
      verbose: options.verbose
    };
  }

  getSupportedFormat(): string {
    return 'text';
  }

  private generateTextContent(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): string {
    let content = '統合セキュリティ分析レポート\n';
    content += '='.repeat(50) + '\n\n';

    // 基本統計
    const report = analysisResult.unifiedReport;
    content += `総合グレード: ${report.summary.overallGrade}\n`;
    content += `総合スコア: ${report.overallRiskScore}/100\n`;
    content += `検出された問題: ${report.summary.totalIssues}件\n\n`;

    // 詳細情報（verboseオプション）
    if (options.verbose) {
      content += '詳細情報:\n';
      content += `- 重大な問題: ${report.summary.criticalIssues}件\n`;
      content += `- 高リスク問題: ${report.summary.highIssues}件\n`;
      content += `- 中リスク問題: ${report.summary.mediumIssues}件\n`;
      content += `- 低リスク問題: ${report.summary.lowIssues}件\n\n`;
    }

    // 推奨事項（オプション）
    if (options.includeRecommendations) {
      content += this.generateRecommendations();
    }

    return content;
  }

  private generateRecommendations(): string {
    return `推奨事項:\n- セキュリティ設定の見直し\n- テストカバレッジの向上\n- 定期的な監査の実施\n`;
  }
}

/**
 * JSONフォーマッター
 */
export class JsonReportFormatter implements IReportFormatter {
  format(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult {
    return {
      format: 'json',
      content: JSON.stringify(analysisResult, null, 2)
    };
  }

  getSupportedFormat(): string {
    return 'json';
  }
}

/**
 * Markdownフォーマッター
 */
export class MarkdownReportFormatter implements IReportFormatter {
  format(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult {
    return {
      format: 'markdown',
      content: this.generateMarkdownContent(analysisResult, options)
    };
  }

  getSupportedFormat(): string {
    return 'markdown';
  }

  private generateMarkdownContent(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): string {
    let content = '# 統合セキュリティ分析レポート\n\n';
    
    const report = analysisResult.unifiedReport;
    content += `**総合グレード**: ${report.summary.overallGrade}\n`;
    content += `**総合スコア**: ${report.overallRiskScore}/100\n`;
    content += `**検出された問題**: ${report.summary.totalIssues}件\n\n`;

    if (options.includeRecommendations) {
      content += '## 推奨事項\n\n';
      content += '- セキュリティ設定の見直し\n';
      content += '- テストカバレッジの向上\n';
      content += '- 定期的な監査の実施\n';
    }

    return content;
  }
}

/**
 * HTMLフォーマッター
 */
export class HtmlReportFormatter implements IReportFormatter {
  format(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult {
    return {
      format: 'html',
      content: this.generateHtmlContent(analysisResult, options)
    };
  }

  getSupportedFormat(): string {
    return 'html';
  }

  private generateHtmlContent(analysisResult: UnifiedAnalysisResult, options: UnifiedAnalyzeOptions): string {
    const report = analysisResult.unifiedReport;
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>統合セキュリティ分析レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; border-bottom: 2px solid #ddd; }
        .score { font-size: 1.5em; color: #007cba; }
        .grade { font-size: 2em; font-weight: bold; color: #d32f2f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>統合セキュリティ分析レポート</h1>
    </div>
    <div class="summary">
        <p class="grade">総合グレード: ${report.summary.overallGrade}</p>
        <p class="score">総合スコア: ${report.overallRiskScore}/100</p>
        <p>検出された問題: ${report.summary.totalIssues}件</p>
    </div>
</body>
</html>`;
  }
}

/**
 * レポートフォーマッターファクトリー
 * Factory Patternによるフォーマッター生成の管理
 */
export class ReportFormatterFactory {
  private static formatters: Map<string, () => IReportFormatter> = new Map([
    ['text', () => new TextReportFormatter()],
    ['json', () => new JsonReportFormatter()],
    ['markdown', () => new MarkdownReportFormatter()],
    ['html', () => new HtmlReportFormatter()]
  ]);

  static createFormatter(format: string): IReportFormatter {
    const formatterFactory = this.formatters.get(format);
    if (!formatterFactory) {
      throw new Error(`サポートされていないフォーマット: ${format}`);
    }
    return formatterFactory();
  }

  static getSupportedFormats(): string[] {
    return Array.from(this.formatters.keys());
  }
}