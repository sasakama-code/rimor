/**
 * HTMLReportBuilder
 * v0.9.0 - Phase 5-3: HTMLレポート生成
 * TDD Refactor Phase - Martin Fowler推奨の小さなステップでのリファクタリング
 * 
 * SOLID原則: 単一責任の原則 - HTML生成に特化
 * DRY原則: テンプレート部品の再利用
 * KISS原則: シンプルなHTML生成から開始
 */

import {
  UnifiedAnalysisResult,
  RiskLevel,
  ExecutiveSummary,
  DetailedIssue,
  ReportDimension
} from '../../nist/types/unified-analysis-result';

/**
 * Chart.js用のデータ形式
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
  }>;
}

/**
 * HTMLレポート生成クラス
 * YAGNI原則: 必要最小限の機能から実装
 */
export class HTMLReportBuilder {
  // リスクレベルごとの色定義
  private readonly riskColors: Record<RiskLevel, string> = {
    [RiskLevel.CRITICAL]: '#dc3545',
    [RiskLevel.HIGH]: '#fd7e14',
    [RiskLevel.MEDIUM]: '#ffc107',
    [RiskLevel.LOW]: '#28a745',
    [RiskLevel.MINIMAL]: '#6c757d'
  };

  // バッジクラス名
  private readonly badgeClasses: Record<RiskLevel, string> = {
    [RiskLevel.CRITICAL]: 'badge-critical',
    [RiskLevel.HIGH]: 'badge-high',
    [RiskLevel.MEDIUM]: 'badge-medium',
    [RiskLevel.LOW]: 'badge-low',
    [RiskLevel.MINIMAL]: 'badge-minimal'
  };

  /**
   * HTMLレポートを生成
   * Template Methodパターン: レポート構築のステップを定義
   */
  buildHTMLReport(analysisResult: UnifiedAnalysisResult): string {
    const { summary, detailedIssues } = analysisResult;

    return this.buildHTMLDocument(
      this.buildReportContent(summary, detailedIssues)
    );
  }

  /**
   * HTMLドキュメントを構築
   */
  private buildHTMLDocument(content: string): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    ${this.buildHTMLHead()}
</head>
<body>
    <div class="container">
        ${content}
    </div>
    ${this.generateScripts()}
</body>
</html>`;
  }

  /**
   * HTMLヘッダーを構築
   */
  private buildHTMLHead(): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rimor 分析レポート</title>
    ${this.generateStyles()}`;
  }

  /**
   * レポートコンテンツを構築
   */
  private buildReportContent(summary: ExecutiveSummary, detailedIssues: DetailedIssue[]): string {
    return `
        <h1>Rimor テスト品質分析レポート</h1>
        ${this.generateReportGuide()}
        ${this.generateExecutiveSummary(summary)}
        ${this.generateRiskDistribution(summary)}
        ${this.generateDimensionsSection(summary)}
        ${this.generateIssuesList(detailedIssues)}
        ${this.generateFilterControls()}
    `;
  }

  /**
   * Chart.js用のデータを生成
   */
  generateChartData(analysisResult: UnifiedAnalysisResult): ChartData {
    const { summary } = analysisResult;
    const riskCounts = summary.statistics.riskCounts;

    return {
      labels: Object.values(RiskLevel),
      datasets: [{
        label: 'リスク件数',
        data: [
          riskCounts[RiskLevel.CRITICAL],
          riskCounts[RiskLevel.HIGH],
          riskCounts[RiskLevel.MEDIUM],
          riskCounts[RiskLevel.LOW],
          riskCounts[RiskLevel.MINIMAL]
        ],
        backgroundColor: Object.values(this.riskColors)
      }]
    };
  }

  /**
   * スタイルを生成
   * Extract Method: CSS定義を分離
   */
  private generateStyles(): string {
    return `
    <style>
        ${this.getBaseStyles()}
        ${this.getBadgeStyles()}
        ${this.getComponentStyles()}
    </style>`;
  }

  /**
   * ベーススタイル
   */
  private getBaseStyles(): string {
    return `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hidden { display: none; }
    `;
  }

  /**
   * バッジスタイル
   */
  private getBadgeStyles(): string {
    return `
        .badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .badge-critical { background: ${this.riskColors[RiskLevel.CRITICAL]}; }
        .badge-high { background: ${this.riskColors[RiskLevel.HIGH]}; }
        .badge-medium { background: ${this.riskColors[RiskLevel.MEDIUM]}; color: #333; }
        .badge-low { background: ${this.riskColors[RiskLevel.LOW]}; }
        .badge-minimal { background: ${this.riskColors[RiskLevel.MINIMAL]}; }
    `;
  }

  /**
   * コンポーネントスタイル
   */
  private getComponentStyles(): string {
    return `
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .score { font-size: 48px; font-weight: bold; }
        .grade { font-size: 36px; margin-left: 20px; }
        .issue-item { border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .dimension-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .dimension-table th, .dimension-table td { padding: 10px; border: 1px solid #dee2e6; }
        .filter-controls { margin: 20px 0; }
    `;
  }

  /**
   * レポートの見方ガイドを生成
   */
  private generateReportGuide(): string {
    return `
    <section class="report-guide">
        <h2>レポートの見方</h2>
        <p>総合スコアは100点満点で、以下の基準で評価されます：</p>
        <ul>
            <li>A: 90-100 - 優秀</li>
            <li>B: 80-89 - 良好</li>
            <li>C: 70-79 - 改善の余地あり</li>
            <li>D: 60-69 - 要改善</li>
            <li>F: 0-59 - 重大な問題あり</li>
        </ul>
    </section>`;
  }

  /**
   * エグゼクティブサマリーを生成
   */
  private generateExecutiveSummary(summary: ExecutiveSummary): string {
    return `
    <section class="summary-card">
        <h2>エグゼクティブサマリー</h2>
        <div>
            <span class="label">総合スコア</span>
            <span class="score">${summary.overallScore}</span>
            <span class="grade">グレード: ${summary.overallGrade}</span>
        </div>
        <div style="margin-top: 20px;">
            <p>分析ファイル数: ${summary.statistics.totalFiles}</p>
            <p>テスト数: ${summary.statistics.totalTests}</p>
        </div>
    </section>`;
  }

  /**
   * リスク分布を生成
   * Introduce Explaining Variable: リスクレベルごとのHTML生成を分離
   */
  private generateRiskDistribution(summary: ExecutiveSummary): string {
    const { riskCounts } = summary.statistics;
    const riskCountsHTML = this.formatRiskCounts(riskCounts);
    
    return `
    <section class="risk-distribution">
        <h2>リスク分布</h2>
        <div>${riskCountsHTML}</div>
    </section>`;
  }

  /**
   * リスクカウントをフォーマット
   */
  private formatRiskCounts(riskCounts: Record<RiskLevel, number>): string {
    return Object.entries(riskCounts)
      .map(([level, count]) => `<p>${level}: ${count}</p>`)
      .join('');
  }

  /**
   * ディメンション別スコアを生成
   */
  private generateDimensionsSection(summary: ExecutiveSummary): string {
    if (!summary.dimensions || summary.dimensions.length === 0) {
      return '';
    }

    return `
    <section class="dimensions-section">
        <h2>評価ディメンション</h2>
        <table class="dimension-table">
            <thead>
                <tr>
                    <th>ディメンション</th>
                    <th>スコア</th>
                    <th>重み</th>
                    <th>影響度</th>
                </tr>
            </thead>
            <tbody>
                ${summary.dimensions.map(dim => `
                <tr>
                    <td>${dim.name}</td>
                    <td>${dim.score}</td>
                    <td>重み: ${dim.weight}</td>
                    <td>${dim.impact.toFixed(1)}</td>
                </tr>`).join('')}
            </tbody>
        </table>
    </section>`;
  }

  /**
   * 問題リストを生成
   */
  private generateIssuesList(issues: DetailedIssue[]): string {
    if (issues.length === 0) {
      return `
      <section class="issues-section">
          <h2>検出された問題</h2>
          <p>問題は検出されませんでした</p>
      </section>`;
    }

    return `
    <section class="issues-section">
        <h2>検出された問題</h2>
        ${issues.map(issue => this.generateIssueItem(issue)).join('')}
    </section>`;
  }

  /**
   * 個別の問題項目を生成
   */
  private generateIssueItem(issue: DetailedIssue): string {
    const badgeClass = this.badgeClasses[issue.riskLevel];
    
    return `
    <div class="issue-item" data-risk-level="${issue.riskLevel}">
        <span class="badge ${badgeClass}">${issue.riskLevel}</span>
        <h3>${issue.title}</h3>
        <p>${issue.description}</p>
        <p><strong>ファイル:</strong> ${issue.filePath}</p>
        <p><strong>行:</strong> ${issue.startLine}-${issue.endLine}</p>
        ${issue.contextSnippet ? `<pre>${issue.contextSnippet}</pre>` : ''}
    </div>`;
  }

  /**
   * フィルタリングコントロールを生成
   */
  private generateFilterControls(): string {
    return `
    <div class="filter-controls">
        <label for="risk-filter">リスクレベルでフィルタ:</label>
        <select id="risk-filter">
            <option value="ALL">すべて</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="MINIMAL">MINIMAL</option>
        </select>
    </div>`;
  }

  /**
   * JavaScriptを生成
   */
  private generateScripts(): string {
    return `
    <script>
        // フィルタリング機能
        document.getElementById('risk-filter')?.addEventListener('change', (e) => {
            const selectedLevel = e.target.value;
            const issues = document.querySelectorAll('.issue-item');
            
            issues.forEach(issue => {
                if (selectedLevel === 'ALL' || issue.dataset.riskLevel === selectedLevel) {
                    issue.classList.remove('hidden');
                } else {
                    issue.classList.add('hidden');
                }
            });
        });
    </script>`;
  }
}