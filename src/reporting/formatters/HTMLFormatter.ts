/**
 * HTMLFormatter
 * v0.9.0 - Issue #64: レポートシステムの統合
 * REFACTOR段階: BaseFormatterを継承
 *
 * SOLID原則: 単一責任（HTML形式の生成のみ）
 * DRY原則: 共通ロジックをBaseFormatterに委譲
 * KISS原則: シンプルなHTML生成
 */

import { BaseFormatter } from './BaseFormatter';
import { UnifiedAnalysisResult, RiskLevel } from '../../nist/types/unified-analysis-result';

/**
 * HTML形式のフォーマッター
 * HTMLReportBuilderの機能を統合
 */
export class HTMLFormatter extends BaseFormatter {
  name = 'html';

  // リスクレベルごとの色定義
  private readonly riskColors: Record<string, string> = {
    CRITICAL: '#dc3545',
    HIGH: '#fd7e14',
    MEDIUM: '#ffc107',
    LOW: '#28a745',
    MINIMAL: '#6c757d',
  };

  /**
   * HTML形式でレポートを生成
   * Template Methodパターンの具体実装
   */
  protected doFormat(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string {
    const html: string[] = [];

    // HTMLヘッダー
    html.push('<!DOCTYPE html>');
    html.push('<html lang="ja">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push('  <title>Rimor 分析レポート</title>');
    html.push(this.generateStyles());
    html.push('</head>');
    html.push('<body>');

    // コンテナ
    html.push('  <div class="container">');

    // ヘッダー
    html.push('    <header class="header">');
    html.push('      <h1>Rimor 分析レポート</h1>');
    html.push(
      `      <p class="timestamp">生成日時: ${this.generateLocalizedDateTime('ja-JP')}</p>`
    );
    // プロジェクトパスは省略（UnifiedAnalysisResultに含まれない）
    html.push('    </header>');

    // エグゼクティブサマリー
    if (result.summary) {
      html.push('    <section class="summary-section">');
      html.push('      <h2>エグゼクティブサマリー</h2>');
      html.push('      <div class="summary-cards">');

      // スコアカード
      html.push('        <div class="card score-card">');
      html.push('          <div class="card-title">総合スコア</div>');
      html.push(`          <div class="score-value">${result.summary.overallScore}/100</div>`);
      html.push(`          <div class="grade">グレード: ${result.summary.overallGrade}</div>`);
      html.push('        </div>');

      // 統計カード
      html.push('        <div class="card stats-card">');
      html.push('          <div class="card-title">プロジェクト統計</div>');
      html.push(
        `          <div class="stat-item">ファイル数: ${result.summary.statistics.totalFiles}</div>`
      );
      html.push(
        `          <div class="stat-item">テスト数: ${result.summary.statistics.totalTests || 0}</div>`
      );
      html.push('        </div>');

      // リスク統計カード
      html.push('        <div class="card risk-stats-card">');
      html.push('          <div class="card-title">リスク分布</div>');
      html.push(this.generateRiskStats(result.summary.statistics.riskCounts));
      html.push('        </div>');

      html.push('      </div>');

      // ディメンション別スコア
      if (result.summary.dimensions && result.summary.dimensions.length > 0) {
        html.push('      <h3>評価ディメンション</h3>');
        html.push('      <div class="dimensions">');
        result.summary.dimensions.forEach(dim => {
          html.push('        <div class="dimension-item">');
          html.push(`          <span class="dimension-name">${dim.name}</span>`);
          html.push(`          <span class="dimension-score">スコア: ${dim.score}</span>`);
          html.push(`          <span class="dimension-weight">重み: ${dim.weight}</span>`);
          html.push('        </div>');
        });
        html.push('      </div>');
      }

      html.push('    </section>');
    }

    // 主要なリスク
    if (result.aiKeyRisks && result.aiKeyRisks.length > 0) {
      html.push('    <section class="risks-section">');
      html.push('      <h2>主要なリスク</h2>');

      const maxRisks = (options?.maxRisks as number) ?? 10;
      const risksToShow = result.aiKeyRisks.slice(0, maxRisks);

      risksToShow.forEach((risk, index) => {
        html.push('      <div class="risk-item">');
        html.push(`        <h3>${index + 1}. ${risk.title || risk.problem}</h3>`);
        html.push(
          `        <span class="risk-level risk-level-${risk.riskLevel.toLowerCase()}">${risk.riskLevel}</span>`
        );
        html.push(`        <p class="file-path">📁 ${risk.filePath}</p>`);

        if (risk.problem) {
          html.push(`        <p class="problem">問題: ${risk.problem}</p>`);
        }

        if (risk.context && risk.context.codeSnippet) {
          html.push('        <pre class="code-snippet"><code>');
          html.push(this.escapeHtml(risk.context.codeSnippet));
          html.push('</code></pre>');
        }

        if (risk.suggestedAction) {
          const action =
            typeof risk.suggestedAction === 'string'
              ? risk.suggestedAction
              : risk.suggestedAction.description;
          html.push(`        <p class="suggested-action">💡 推奨: ${action}</p>`);
        }

        html.push('      </div>');
      });

      html.push('    </section>');
    }

    // 詳細な問題リスト
    if (result.detailedIssues && result.detailedIssues.length > 0) {
      html.push('    <section class="detailed-issues-section">');
      html.push('      <h2>検出された問題</h2>');

      // フィルタードロップダウン
      html.push('      <div class="filter-container">');
      html.push('        <select id="risk-filter" class="risk-filter">');
      html.push('          <option value="ALL">すべて</option>');
      html.push('          <option value="CRITICAL">CRITICAL</option>');
      html.push('          <option value="HIGH">HIGH</option>');
      html.push('          <option value="MEDIUM">MEDIUM</option>');
      html.push('          <option value="LOW">LOW</option>');
      html.push('          <option value="MINIMAL">MINIMAL</option>');
      html.push('        </select>');
      html.push('      </div>');

      html.push('      <div class="issues-list table">');
      result.detailedIssues.forEach((issue, index) => {
        html.push(`        <div class="issue-item" data-risk-level="${issue.riskLevel}">`);
        html.push(`          <h3>${index + 1}. ${issue.title}</h3>`);
        html.push(
          `          <span class="badge badge-${issue.riskLevel.toLowerCase()}">${issue.riskLevel}</span>`
        );
        html.push(`          <p class="file-path">📁 ${issue.filePath}</p>`);
        html.push(`          <p class="line-range">行: ${issue.startLine}-${issue.endLine}</p>`);
        html.push(`          <p class="description">${issue.description}</p>`);

        if (issue.contextSnippet) {
          html.push('          <pre class="code-snippet"><code>');
          html.push(this.escapeHtml(issue.contextSnippet));
          html.push('</code></pre>');
        }

        html.push('        </div>');
      });
      html.push('      </div>');

      html.push('    </section>');
    } else if (result.detailedIssues && result.detailedIssues.length === 0) {
      html.push('    <section class="no-issues">');
      html.push('      <p>問題は検出されませんでした</p>');
      html.push('    </section>');
    }

    // フッター
    html.push('    <footer class="footer">');
    html.push('      <p>Generated by Rimor UnifiedReportEngine v0.9.0</p>');
    html.push('    </footer>');

    html.push('  </div>');
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  /**
   * CSSスタイルを生成
   */
  private generateStyles(): string {
    return `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #2c3e50; margin-bottom: 10px; }
    h2 { color: #34495e; margin: 20px 0; }
    h3 { color: #555; margin: 15px 0; }
    .timestamp, .project-path { color: #666; font-size: 14px; }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card-title {
      font-weight: bold;
      color: #666;
      margin-bottom: 10px;
    }
    .score-value {
      font-size: 36px;
      font-weight: bold;
      color: #2c3e50;
    }
    .grade { color: #666; }
    .stat-item { margin: 5px 0; }
    
    .risk-level {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .risk-level-critical { background: #dc3545; color: white; }
    .risk-level-high { background: #fd7e14; color: white; }
    .risk-level-medium { background: #ffc107; color: #333; }
    .risk-level-low { background: #28a745; color: white; }
    .risk-level-minimal { background: #6c757d; color: white; }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-critical { background: #dc3545; color: white; }
    .badge-high { background: #fd7e14; color: white; }
    .badge-medium { background: #ffc107; color: #333; }
    .badge-low { background: #28a745; color: white; }
    .badge-minimal { background: #6c757d; color: white; }
    
    .risk-item {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .file-path { color: #666; font-family: monospace; margin: 10px 0; }
    .problem { margin: 10px 0; }
    .code-snippet {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .suggested-action {
      background: #e8f5e9;
      padding: 10px;
      border-left: 3px solid #4caf50;
      margin: 10px 0;
    }
    
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 40px;
      padding: 20px;
    }
  </style>`;
  }

  /**
   * リスク統計HTMLを生成
   */
  private generateRiskStats(riskCounts: Record<string, number>): string {
    const html: string[] = [];

    Object.entries(riskCounts).forEach(([level, count]) => {
      const color = this.riskColors[level] || '#999';
      html.push(`<div class="stat-item">`);
      html.push(`  <span style="color: ${color}">●</span> ${level}: ${count}`);
      html.push(`</div>`);
    });

    return html.join('\n');
  }
}
