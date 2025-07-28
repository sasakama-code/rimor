/**
 * Reporter Implementation
 * v0.8.0 - 基本的なレポート生成実装
 */

import { injectable } from 'inversify';
import {
  IReporter,
  ReportOptions,
  ReportResult,
  ReportFormat
} from '../interfaces/IReporter';
import { AnalysisResult } from '../interfaces/IAnalysisEngine';
import { SecurityAuditResult } from '../interfaces/ISecurityAuditor';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class ReporterImpl implements IReporter {
  
  async generateAnalysisReport(
    result: AnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      let content: string;
      
      switch (options.format) {
        case ReportFormat.JSON:
          content = this.generateJsonReport(result);
          break;
        case ReportFormat.HTML:
          content = this.generateHtmlReport(result);
          break;
        case ReportFormat.MARKDOWN:
          content = this.generateMarkdownReport(result);
          break;
        case ReportFormat.TEXT:
        default:
          content = this.generateTextReport(result);
          break;
      }
      
      if (options.outputPath) {
        await this.saveToFile(content, options.outputPath);
        return {
          success: true,
          outputPath: options.outputPath
        };
      }
      
      return {
        success: true,
        content
      };
    } catch (error) {
      return {
        success: false,
        error: `レポート生成に失敗しました: ${error}`
      };
    }
  }
  
  async generateSecurityReport(
    result: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      let content: string;
      
      switch (options.format) {
        case ReportFormat.JSON:
          content = JSON.stringify(result, null, 2);
          break;
        case ReportFormat.HTML:
          content = this.generateSecurityHtmlReport(result);
          break;
        case ReportFormat.MARKDOWN:
          content = this.generateSecurityMarkdownReport(result);
          break;
        case ReportFormat.TEXT:
        default:
          content = this.generateSecurityTextReport(result);
          break;
      }
      
      if (options.outputPath) {
        await this.saveToFile(content, options.outputPath);
        return {
          success: true,
          outputPath: options.outputPath
        };
      }
      
      return {
        success: true,
        content
      };
    } catch (error) {
      return {
        success: false,
        error: `セキュリティレポート生成に失敗しました: ${error}`
      };
    }
  }
  
  printToConsole(content: string): void {
    console.log(content);
  }
  
  // Private methods
  
  private generateTextReport(result: AnalysisResult): string {
    const lines = [
      '=== Rimor 分析レポート ===',
      '',
      `分析対象ファイル数: ${result.totalFiles}`,
      `検出された問題数: ${result.issues.length}`,
      `実行時間: ${result.executionTime}ms`,
      ''
    ];
    
    if (result.issues.length > 0) {
      lines.push('検出された問題:');
      result.issues.forEach((issue, index) => {
        lines.push(`${index + 1}. [${issue.severity}] ${issue.message}`);
        lines.push(`   ファイル: ${issue.file}`);
        if (issue.line) {
          lines.push(`   行: ${issue.line}`);
        }
        lines.push('');
      });
    } else {
      lines.push('問題は検出されませんでした。');
    }
    
    return lines.join('\n');
  }
  
  private generateJsonReport(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }
  
  private generateHtmlReport(result: AnalysisResult): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Rimor Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 10px; border-radius: 5px; }
    .issue { margin: 10px 0; padding: 10px; border-left: 3px solid #ff6b6b; }
    .issue.warning { border-color: #ffd93d; }
    .issue.info { border-color: #6bcf7f; }
  </style>
</head>
<body>
  <h1>Rimor 分析レポート</h1>
  <div class="summary">
    <p>分析対象ファイル数: ${result.totalFiles}</p>
    <p>検出された問題数: ${result.issues.length}</p>
    <p>実行時間: ${result.executionTime}ms</p>
  </div>
  <h2>検出された問題</h2>
  ${result.issues.map((issue, index) => `
    <div class="issue ${issue.severity}">
      <h3>#${index + 1} [${issue.severity}] ${issue.message}</h3>
      <p>ファイル: ${issue.file}</p>
      ${issue.line ? `<p>行: ${issue.line}</p>` : ''}
    </div>
  `).join('')}
</body>
</html>`;
  }
  
  private generateMarkdownReport(result: AnalysisResult): string {
    const lines = [
      '# Rimor 分析レポート',
      '',
      '## サマリー',
      '',
      `- 分析対象ファイル数: ${result.totalFiles}`,
      `- 検出された問題数: ${result.issues.length}`,
      `- 実行時間: ${result.executionTime}ms`,
      '',
      '## 検出された問題',
      ''
    ];
    
    if (result.issues.length > 0) {
      result.issues.forEach((issue, index) => {
        lines.push(`### ${index + 1}. [${issue.severity}] ${issue.message}`);
        lines.push('');
        lines.push(`- **ファイル**: ${issue.file}`);
        if (issue.line) {
          lines.push(`- **行**: ${issue.line}`);
        }
        lines.push('');
      });
    } else {
      lines.push('問題は検出されませんでした。');
    }
    
    return lines.join('\n');
  }
  
  private generateSecurityTextReport(result: SecurityAuditResult): string {
    const lines = [
      '=== Rimor セキュリティ監査レポート ===',
      '',
      `スキャンしたファイル数: ${result.filesScanned}`,
      `検出された脅威数: ${result.summary.total}`,
      '',
      'サマリー:',
      `  Critical: ${result.summary.critical}`,
      `  High: ${result.summary.high}`,
      `  Medium: ${result.summary.medium}`,
      `  Low: ${result.summary.low}`,
      `実行時間: ${result.executionTime}ms`,
      ''
    ];
    
    if (result.threats.length > 0) {
      lines.push('検出された脅威:');
      result.threats.forEach((threat, index) => {
        lines.push(`${index + 1}. [${threat.severity}] ${threat.type}`);
        lines.push(`   ${threat.message}`);
        lines.push(`   ファイル: ${threat.file}:${threat.line}`);
        lines.push(`   推奨事項: ${threat.recommendation}`);
        lines.push('');
      });
    } else {
      lines.push('セキュリティ脅威は検出されませんでした。');
    }
    
    return lines.join('\n');
  }
  
  private generateSecurityHtmlReport(result: SecurityAuditResult): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Rimor Security Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 10px; border-radius: 5px; }
    .threat { margin: 10px 0; padding: 10px; }
    .threat.critical { border-left: 3px solid #ff0000; background: #ffe0e0; }
    .threat.high { border-left: 3px solid #ff6b6b; background: #fff0f0; }
    .threat.medium { border-left: 3px solid #ffd93d; background: #fffef0; }
    .threat.low { border-left: 3px solid #6bcf7f; background: #f0fff0; }
  </style>
</head>
<body>
  <h1>Rimor セキュリティ監査レポート</h1>
  <div class="summary">
    <p>スキャンしたファイル数: ${result.filesScanned}</p>
    <p>検出された脅威数: ${result.summary.total}</p>
    <ul>
      <li>Critical: ${result.summary.critical}</li>
      <li>High: ${result.summary.high}</li>
      <li>Medium: ${result.summary.medium}</li>
      <li>Low: ${result.summary.low}</li>
    </ul>
    <p>実行時間: ${result.executionTime}ms</p>
  </div>
  <h2>検出された脅威</h2>
  ${result.threats.map((threat, index) => `
    <div class="threat ${threat.severity}">
      <h3>#${index + 1} [${threat.severity}] ${threat.type}</h3>
      <p>${threat.message}</p>
      <p><strong>ファイル:</strong> ${threat.file}:${threat.line}</p>
      <p><strong>推奨事項:</strong> ${threat.recommendation}</p>
    </div>
  `).join('')}
</body>
</html>`;
  }
  
  private generateSecurityMarkdownReport(result: SecurityAuditResult): string {
    const lines = [
      '# Rimor セキュリティ監査レポート',
      '',
      '## サマリー',
      '',
      `- スキャンしたファイル数: ${result.filesScanned}`,
      `- 検出された脅威数: ${result.summary.total}`,
      `  - Critical: ${result.summary.critical}`,
      `  - High: ${result.summary.high}`,
      `  - Medium: ${result.summary.medium}`,
      `  - Low: ${result.summary.low}`,
      `- 実行時間: ${result.executionTime}ms`,
      '',
      '## 検出された脅威',
      ''
    ];
    
    if (result.threats.length > 0) {
      result.threats.forEach((threat, index) => {
        lines.push(`### ${index + 1}. [${threat.severity}] ${threat.type}`);
        lines.push('');
        lines.push(threat.message);
        lines.push('');
        lines.push(`- **ファイル**: ${threat.file}:${threat.line}`);
        lines.push(`- **推奨事項**: ${threat.recommendation}`);
        lines.push('');
      });
    } else {
      lines.push('セキュリティ脅威は検出されませんでした。');
    }
    
    return lines.join('\n');
  }
  
  private async saveToFile(content: string, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(outputPath, content, 'utf-8');
  }
}