/**
 * Reporter Wrapper
 * inversifyデコレータを使用せず、シンプルなDIコンテナ向けのラッパー
 * Phase 6: 既存コンポーネントとの共存
 */

import { 
  IReporter, 
  ReportOptions, 
  ReportResult, 
  ReportFormat 
} from '../interfaces/IReporter';
import { AnalysisResult } from '../interfaces/IAnalysisEngine';
import { SecurityAuditResult } from '../interfaces/ISecurityAuditor';

/**
 * Reporter Wrapper
 * 既存のReporterImplをinversifyなしで動作させる
 */
export class ReporterWrapper implements IReporter {

  async generateAnalysisReport(
    result: AnalysisResult, 
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const content = this.formatAnalysisReport(result, options);
      
      if (options.outputPath) {
        await this.saveReport(content, options.outputPath);
      }
      
      return {
        success: true,
        outputPath: options.outputPath,
        content: content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async generateSecurityReport(
    result: SecurityAuditResult, 
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const content = this.formatSecurityReport(result, options);
      
      if (options.outputPath) {
        await this.saveReport(content, options.outputPath);
      }
      
      return {
        success: true,
        outputPath: options.outputPath,
        content: content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  printToConsole(content: string): void {
    console.log(content);
  }
  
  // 下位互換性のため保持
  async generateReport(analysisResults: any, options?: any): Promise<string> {
    // 基本的なレポート生成の実装
    try {
      const report = this.formatReport(analysisResults, options);
      return report;
    } catch (error) {
      console.error('レポート生成中にエラー:', error);
      return this.generateErrorReport(error);
    }
  }
  
  async saveReport(report: string, outputPath: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      // ディレクトリの作成
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // レポートファイルの書き込み
      fs.writeFileSync(outputPath, report, 'utf8');
    } catch (error) {
      throw new Error(`レポートの保存に失敗しました: ${error}`);
    }
  }
  
  /**
   * 分析結果レポートのフォーマット
   */
  private formatAnalysisReport(result: AnalysisResult, options: ReportOptions): string {
    switch (options.format) {
      case ReportFormat.JSON:
        return JSON.stringify(result, null, 2);
      
      case ReportFormat.MARKDOWN:
        return this.generateAnalysisMarkdownReport(result, options);
      
      case ReportFormat.HTML:
        return this.generateAnalysisHtmlReport(result, options);
      
      case ReportFormat.TEXT:
      default:
        return this.generateAnalysisTextReport(result, options);
    }
  }

  /**
   * セキュリティレポートのフォーマット
   */
  private formatSecurityReport(result: SecurityAuditResult, options: ReportOptions): string {
    switch (options.format) {
      case ReportFormat.JSON:
        return JSON.stringify(result, null, 2);
      
      case ReportFormat.MARKDOWN:
        return this.generateSecurityMarkdownReport(result, options);
      
      case ReportFormat.HTML:
        return this.generateSecurityHtmlReport(result, options);
      
      case ReportFormat.TEXT:
      default:
        return this.generateSecurityTextReport(result, options);
    }
  }

  /**
   * 分析結果のフォーマット（下位互換性）
   */
  private formatReport(analysisResults: any, options?: any): string {
    const format = options?.format || 'text';
    
    switch (format) {
      case 'json':
        return JSON.stringify(analysisResults, null, 2);
      
      case 'markdown':
        return this.generateMarkdownReport(analysisResults);
      
      case 'html':
        return this.generateHtmlReport(analysisResults);
      
      case 'text':
      default:
        return this.generateTextReport(analysisResults);
    }
  }
  
  /**
   * テキストレポート生成
   */
  private generateTextReport(results: any): string {
    let report = '分析レポート\n';
    report += '='.repeat(50) + '\n\n';
    
    if (results.summary) {
      report += `総合スコア: ${results.summary.overallScore || 'N/A'}\n`;
      report += `検出された問題: ${results.summary.totalIssues || 0}件\n\n`;
    }
    
    if (results.issues && Array.isArray(results.issues)) {
      report += '検出された問題:\n';
      results.issues.forEach((issue: any, index: number) => {
        report += `${index + 1}. ${issue.message || 'Unknown issue'}\n`;
        if (issue.severity) {
          report += `   重要度: ${issue.severity}\n`;
        }
        if (issue.file) {
          report += `   ファイル: ${issue.file}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }
  
  /**
   * Markdownレポート生成
   */
  private generateMarkdownReport(results: any): string {
    let report = '# 分析レポート\n\n';
    
    if (results.summary) {
      report += `**総合スコア:** ${results.summary.overallScore || 'N/A'}\n`;
      report += `**検出された問題:** ${results.summary.totalIssues || 0}件\n\n`;
    }
    
    if (results.issues && Array.isArray(results.issues)) {
      report += '## 検出された問題\n\n';
      results.issues.forEach((issue: any, index: number) => {
        report += `### ${index + 1}. ${issue.message || 'Unknown issue'}\n\n`;
        if (issue.severity) {
          report += `- **重要度:** ${issue.severity}\n`;
        }
        if (issue.file) {
          report += `- **ファイル:** ${issue.file}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }
  
  /**
   * HTMLレポート生成
   */
  private generateHtmlReport(results: any): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>分析レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; border-bottom: 2px solid #ddd; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
        .issue { margin: 10px 0; padding: 10px; border-left: 3px solid #007cba; }
        .issue.high { border-color: #d32f2f; }
        .issue.medium { border-color: #f57c00; }
        .issue.low { border-color: #388e3c; }
    </style>
</head>
<body>
    <div class="header">
        <h1>分析レポート</h1>
    </div>
`;
    
    if (results.summary) {
      html += `
    <div class="summary">
        <h2>サマリー</h2>
        <p><strong>総合スコア:</strong> ${results.summary.overallScore || 'N/A'}</p>
        <p><strong>検出された問題:</strong> ${results.summary.totalIssues || 0}件</p>
    </div>
`;
    }
    
    if (results.issues && Array.isArray(results.issues)) {
      html += '<div class="issues"><h2>検出された問題</h2>';
      results.issues.forEach((issue: any, index: number) => {
        const severityClass = issue.severity ? issue.severity.toLowerCase() : '';
        html += `
        <div class="issue ${severityClass}">
            <h3>${index + 1}. ${issue.message || 'Unknown issue'}</h3>
            ${issue.severity ? `<p><strong>重要度:</strong> ${issue.severity}</p>` : ''}
            ${issue.file ? `<p><strong>ファイル:</strong> ${issue.file}</p>` : ''}
        </div>
`;
      });
      html += '</div>';
    }
    
    html += `
</body>
</html>`;
    
    return html;
  }
  
  /**
   * エラーレポート生成
   */
  private generateErrorReport(error: any): string {
    return `エラーレポート
===================

レポート生成中にエラーが発生しました:
${error instanceof Error ? error.message : String(error)}

スタックトレース:
${error instanceof Error && error.stack ? error.stack : 'N/A'}
`;
  }

  /**
   * 分析結果テキストレポート生成
   */
  private generateAnalysisTextReport(result: AnalysisResult, options: ReportOptions): string {
    let report = '分析レポート\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `分析ファイル数: ${result.totalFiles}\n`;
    report += `検出された問題: ${result.issues.length}件\n`;
    report += `実行時間: ${result.executionTime}ms\n\n`;
    
    if (result.issues && Array.isArray(result.issues)) {
      report += '検出された問題:\n';
      result.issues.forEach((issue: any, index: number) => {
        report += `${index + 1}. ${issue.message || 'Unknown issue'}\n`;
        if (issue.severity) {
          report += `   重要度: ${issue.severity}\n`;
        }
        if (issue.file) {
          report += `   ファイル: ${issue.file}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }

  /**
   * セキュリティ結果テキストレポート生成
   */
  private generateSecurityTextReport(result: SecurityAuditResult, options: ReportOptions): string {
    let report = 'セキュリティ監査レポート\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `スキャンファイル数: ${result.filesScanned}\n`;
    report += `実行時間: ${result.executionTime}ms\n`;
    report += `検出された脅威: ${result.summary.total}件\n\n`;
    
    report += '重要度別サマリー:\n';
    report += `  Critical: ${result.summary.critical}件\n`;
    report += `  High: ${result.summary.high}件\n`;
    report += `  Medium: ${result.summary.medium}件\n`;
    report += `  Low: ${result.summary.low}件\n\n`;
    
    if (result.threats && Array.isArray(result.threats)) {
      report += '検出された脅威:\n';
      result.threats.forEach((threat: any, index: number) => {
        report += `${index + 1}. ${threat.type || 'Unknown threat'}\n`;
        if (threat.severity) {
          report += `   重要度: ${threat.severity}\n`;
        }
        if (threat.message) {
          report += `   説明: ${threat.message}\n`;
        }
        if (threat.file) {
          report += `   ファイル: ${threat.file}:${threat.line || 0}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }

  /**
   * 分析結果Markdownレポート生成
   */
  private generateAnalysisMarkdownReport(result: AnalysisResult, options: ReportOptions): string {
    let report = '# 分析レポート\n\n';
    
    report += `**分析ファイル数:** ${result.totalFiles}\n`;
    report += `**検出された問題:** ${result.issues.length}件\n`;
    report += `**実行時間:** ${result.executionTime}ms\n\n`;
    
    if (result.issues && Array.isArray(result.issues)) {
      report += '## 検出された問題\n\n';
      result.issues.forEach((issue: any, index: number) => {
        report += `### ${index + 1}. ${issue.message || 'Unknown issue'}\n\n`;
        if (issue.severity) {
          report += `- **重要度:** ${issue.severity}\n`;
        }
        if (issue.file) {
          report += `- **ファイル:** ${issue.file}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }

  /**
   * セキュリティ結果Markdownレポート生成
   */
  private generateSecurityMarkdownReport(result: SecurityAuditResult, options: ReportOptions): string {
    let report = '# セキュリティ監査レポート\n\n';
    
    report += `**スキャンファイル数:** ${result.filesScanned}\n`;
    report += `**実行時間:** ${result.executionTime}ms\n`;
    report += `**検出された脅威:** ${result.summary.total}件\n\n`;
    
    report += '## 重要度別サマリー\n\n';
    report += `- **Critical:** ${result.summary.critical}件\n`;
    report += `- **High:** ${result.summary.high}件\n`;
    report += `- **Medium:** ${result.summary.medium}件\n`;
    report += `- **Low:** ${result.summary.low}件\n\n`;
    
    if (result.threats && Array.isArray(result.threats)) {
      report += '## 検出された脅威\n\n';
      result.threats.forEach((threat: any, index: number) => {
        report += `### ${index + 1}. ${threat.type || 'Unknown threat'}\n\n`;
        if (threat.severity) {
          report += `- **重要度:** ${threat.severity}\n`;
        }
        if (threat.message) {
          report += `- **説明:** ${threat.message}\n`;
        }
        if (threat.file) {
          report += `- **ファイル:** ${threat.file}:${threat.line || 0}\n`;
        }
        report += '\n';
      });
    }
    
    return report;
  }

  /**
   * 分析結果HTMLレポート生成
   */
  private generateAnalysisHtmlReport(result: AnalysisResult, options: ReportOptions): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>分析レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; border-bottom: 2px solid #ddd; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
        .issue { margin: 10px 0; padding: 10px; border-left: 3px solid #007cba; }
    </style>
</head>
<body>
    <div class="header">
        <h1>分析レポート</h1>
    </div>
    <div class="summary">
        <p><strong>分析ファイル数:</strong> ${result.totalFiles}</p>
        <p><strong>検出された問題:</strong> ${result.issues.length}件</p>
        <p><strong>実行時間:</strong> ${result.executionTime}ms</p>
    </div>
</body>
</html>`;
  }

  /**
   * セキュリティ結果HTMLレポート生成
   */
  private generateSecurityHtmlReport(result: SecurityAuditResult, options: ReportOptions): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>セキュリティ監査レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; border-bottom: 2px solid #ddd; }
        .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; }
        .vulnerability { margin: 10px 0; padding: 10px; border-left: 3px solid #d32f2f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>セキュリティ監査レポート</h1>
    </div>
    <div class="summary">
        <p><strong>スキャンファイル数:</strong> ${result.filesScanned}</p>
        <p><strong>実行時間:</strong> ${result.executionTime}ms</p>
        <p><strong>検出された脅威:</strong> ${result.summary.total}件</p>
        <p><strong>Critical:</strong> ${result.summary.critical}件</p>
        <p><strong>High:</strong> ${result.summary.high}件</p>
        <p><strong>Medium:</strong> ${result.summary.medium}件</p>
        <p><strong>Low:</strong> ${result.summary.low}件</p>
    </div>
</body>
</html>`;
  }
}