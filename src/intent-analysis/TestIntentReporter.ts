/**
 * Test Intent Reporter
 * v0.9.0 - テスト意図実現度のレポート生成
 * TDD Green Phase - テストを通す最小限の実装
 */

import { TestRealizationResult, IntentRiskLevel, Severity } from './ITestIntentAnalyzer';

/**
 * レポートサマリー
 */
export interface ReportSummary {
  totalFiles: number;
  criticalRiskCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRealizationScore: number;
}

/**
 * テスト意図実現度レポーター
 * KISS原則: シンプルなレポート生成から開始
 */
export class TestIntentReporter {
  /**
   * Markdown形式のレポートを生成
   * YAGNI原則: 必要最小限の実装
   */
  generateMarkdownReport(results: TestRealizationResult[]): string {
    const summary = this.generateSummary(results);
    let markdown = '# テスト意図実現度監査レポート\n\n';
    
    // サマリーセクション
    markdown += '## サマリー\n\n';
    
    // 警告表示
    if (summary.criticalRiskCount > 0) {
      markdown += '⚠️ **警告**: CRITICALレベルのリスクが検出されました\n\n';
    }
    
    // リスク統計
    markdown += `- CRITICALリスク: ${summary.criticalRiskCount}件\n`;
    markdown += `- HIGHリスク: ${summary.highRiskCount}件\n`;
    markdown += `- MEDIUMリスク: ${summary.mediumRiskCount}件\n`;
    markdown += `- LOWリスク: ${summary.lowRiskCount}件\n\n`;
    
    // 統計情報
    markdown += '## 統計情報\n\n';
    markdown += `- 分析ファイル数: ${summary.totalFiles}\n`;
    markdown += `- 平均実現度: ${summary.averageRealizationScore.toFixed(1)}%\n`;
    
    if (results.length > 0) {
      const scores = results.map(r => r.realizationScore);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      markdown += `- 最低実現度: ${minScore}%\n`;
      markdown += `- 最高実現度: ${maxScore}%\n`;
    }
    
    markdown += '\n';
    
    // 改善提案セクション
    const allGaps = results.flatMap(r => r.gaps);
    if (allGaps.length > 0) {
      markdown += '## 改善提案（優先度順）\n\n';
      
      // 重要度でソート
      const sortedGaps = allGaps.sort((a, b) => {
        const severityOrder = {
          [Severity.CRITICAL]: 0,
          [Severity.HIGH]: 1,
          [Severity.MEDIUM]: 2,
          [Severity.LOW]: 3
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      
      sortedGaps.forEach(gap => {
        markdown += `- **[${gap.severity.toUpperCase()}]** ${gap.description}\n`;
        gap.suggestions.forEach(suggestion => {
          markdown += `  - ${suggestion}\n`;
        });
      });
      
      markdown += '\n';
    }
    
    // 個別ファイルの結果
    results.forEach(result => {
      const file = result.file || 'unknown';
      const description = result.description || result.intent.description;
      
      markdown += `### ${file}\n\n`;
      markdown += `- テスト: ${description}\n`;
      markdown += `- 実現度: ${result.realizationScore}%\n`;
      markdown += `- リスクレベル: ${result.riskLevel.toUpperCase()}\n`;
      
      if (result.gaps.length > 0) {
        markdown += '- ギャップ:\n';
        result.gaps.forEach(gap => {
          markdown += `  - ${gap.description}\n`;
        });
      }
      
      markdown += '\n';
    });
    
    return markdown;
  }

  /**
   * HTML形式のレポートを生成
   * KISS原則: シンプルなHTML構造
   */
  generateHTMLReport(results: TestRealizationResult[]): string {
    const summary = this.generateSummary(results);
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>テスト意図実現度監査レポート</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .critical { background-color: #ff4444; color: white; padding: 2px 8px; border-radius: 4px; }
    .high { background-color: #ff8800; color: white; padding: 2px 8px; border-radius: 4px; }
    .medium { background-color: #ffaa00; color: white; padding: 2px 8px; border-radius: 4px; }
    .low { background-color: #44aa00; color: white; padding: 2px 8px; border-radius: 4px; }
    .minimal { background-color: #00aa44; color: white; padding: 2px 8px; border-radius: 4px; }
    .progress-bar { background-color: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; }
    .progress-fill { background-color: #4CAF50; height: 100%; }
  </style>
</head>
<body>
  <h1>テスト意図実現度監査レポート</h1>
`;
    
    // 個別ファイルの結果
    results.forEach(result => {
      const file = result.file || 'unknown';
      const description = result.description || result.intent.description;
      const riskClass = result.riskLevel.toLowerCase();
      
      html += `<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">`;
      html += `<h3>${file}</h3>`;
      html += `<p>${description}</p>`;
      html += `<p>実現度: ${result.realizationScore}%</p>`;
      html += `<div class="progress-bar"><div class="progress-fill" style="width: ${result.realizationScore}%"></div></div>`;
      html += `<p>リスクレベル: <span class="${riskClass}">${result.riskLevel.toUpperCase()}</span></p>`;
      html += `</div>`;
    });
    
    html += `</body></html>`;
    return html;
  }

  /**
   * サマリー情報を生成
   * DRY原則: 共通のサマリー生成ロジック
   */
  generateSummary(results: TestRealizationResult[]): ReportSummary {
    const totalFiles = results.length;
    let criticalRiskCount = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let totalScore = 0;
    
    results.forEach(result => {
      totalScore += result.realizationScore;
      
      switch (result.riskLevel) {
        case IntentRiskLevel.CRITICAL:
          criticalRiskCount++;
          break;
        case IntentRiskLevel.HIGH:
          highRiskCount++;
          break;
        case IntentRiskLevel.MEDIUM:
          mediumRiskCount++;
          break;
        case IntentRiskLevel.LOW:
          lowRiskCount++;
          break;
      }
    });
    
    const averageRealizationScore = totalFiles > 0 ? totalScore / totalFiles : 0;
    
    return {
      totalFiles,
      criticalRiskCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      averageRealizationScore
    };
  }
}