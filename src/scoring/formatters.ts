/**
 * レポートフォーマッター - v0.4.0 Quality Score Calculator
 *
 * 各種出力形式（CLI、JSON、CSV、HTML）のフォーマッター
 */

import { SummaryReport, DetailedReport, TrendReport } from './reports';

/**
 * CLI出力フォーマッター（カラー対応）
 */
export class CliFormatter {
  private useColors: boolean;

  constructor(useColors = true) {
    this.useColors = useColors;
  }

  /**
   * サマリーレポートをCLI形式でフォーマット
   */
  formatSummaryReport(report: SummaryReport): string {
    const output: string[] = [];

    // ヘッダー
    output.push(this.colorize('■ 品質スコア サマリーレポート', 'cyan', true));
    output.push('');

    // プロジェクト情報
    output.push(this.colorize('📁 プロジェクト情報', 'blue', true));
    output.push(`パス: ${report.projectInfo.path}`);
    output.push(
      `総合スコア: ${this.formatScore(report.projectInfo.overallScore)} ${this.formatGrade(report.projectInfo.grade)}`
    );
    output.push(
      `ファイル数: ${report.projectInfo.totalFiles} ディレクトリ数: ${report.projectInfo.totalDirectories}`
    );
    output.push(`実行時間: ${report.projectInfo.executionTime}ms`);
    output.push('');

    // ディメンション別スコア
    output.push(this.colorize('📊 ディメンション別スコア', 'blue', true));
    Object.entries(report.dimensionScores).forEach(([dimension, score]) => {
      const bar = this.createProgressBar(score, 20);
      const dimensionName = this.getDimensionName(dimension);
      output.push(`${dimensionName.padEnd(12)}: ${this.formatScore(score)} ${bar}`);
    });
    output.push('');

    // グレード分布
    output.push(this.colorize('🏆 グレード分布', 'blue', true));
    const totalFiles = Object.values(report.gradeDistribution).reduce(
      (sum, count) => sum + count,
      0
    );
    Object.entries(report.gradeDistribution).forEach(([grade, count]) => {
      if (count > 0) {
        const percentage = ((count / totalFiles) * 100).toFixed(1);
        const gradeDisplay = this.formatGrade(grade as any);
        output.push(`${gradeDisplay}: ${count}ファイル (${percentage}%)`);
      }
    });
    output.push('');

    // 主要課題
    if (report.topIssues.length > 0) {
      output.push(this.colorize('⚠️ 主要課題（上位5件）', 'blue', true));
      report.topIssues.slice(0, 5).forEach((issue, index) => {
        const severity = this.formatSeverity(issue.severity);
        const dimensionName = this.getDimensionName(issue.dimension);
        output.push(`${index + 1}. [${severity}] ${dimensionName}: ${issue.description}`);
        output.push(`   影響ファイル: ${issue.affectedFiles}個`);
      });
      output.push('');
    }

    // 推奨事項
    if (report.recommendations.length > 0) {
      output.push(this.colorize('💡 推奨事項', 'blue', true));
      report.recommendations.forEach((rec, index) => {
        output.push(`${index + 1}. ${rec}`);
      });
      output.push('');
    }

    // メタデータ
    output.push(this.colorize('📈 統計情報', 'blue', true));
    output.push(`平均ファイルスコア: ${report.metadata.averageFileScore}`);
    output.push(
      `最弱ディメンション: ${this.getDimensionName(report.metadata.worstPerformingDimension)}`
    );
    output.push(
      `最強ディメンション: ${this.getDimensionName(report.metadata.bestPerformingDimension)}`
    );
    output.push(
      `プラグイン数: ${report.metadata.pluginCount} 課題数: ${report.metadata.issueCount}`
    );

    return output.join('\n');
  }

  /**
   * 詳細レポートをCLI形式でフォーマット
   */
  formatDetailedReport(report: DetailedReport): string {
    const output: string[] = [];

    // サマリー部分
    output.push(this.formatSummaryReport(report.summary));
    output.push('\n' + '='.repeat(80) + '\n');

    // ファイル詳細
    output.push(this.colorize('📄 ファイル詳細', 'cyan', true));
    output.push('');

    report.fileDetails.forEach((file, index) => {
      output.push(this.colorize(`${index + 1}. ${file.filePath}`, 'yellow', true));
      output.push(`スコア: ${this.formatScore(file.score)} ${this.formatGrade(file.grade)}`);

      // ディメンション詳細
      output.push('ディメンション:');
      file.dimensions.forEach(dim => {
        const bar = this.createProgressBar(dim.score, 15);
        const name = this.getDimensionName(dim.name);
        output.push(
          `  ${name.padEnd(12)}: ${this.formatScore(dim.score)} ${bar} (重み: ${dim.weight})`
        );

        if (dim.issues.length > 0) {
          output.push(`    課題: ${dim.issues.join(', ')}`);
        }
      });

      // 提案
      if (file.suggestions.length > 0) {
        output.push('提案:');
        file.suggestions.forEach(suggestion => {
          output.push(`  • ${suggestion}`);
        });
      }

      output.push('');
    });

    // ディレクトリ詳細
    if (report.directoryDetails.length > 0) {
      output.push('\n' + '-'.repeat(80) + '\n');
      output.push(this.colorize('📁 ディレクトリ詳細', 'cyan', true));
      output.push('');

      report.directoryDetails.forEach((dir, index) => {
        output.push(this.colorize(`${index + 1}. ${dir.directoryPath}`, 'yellow', true));
        output.push(
          `スコア: ${this.formatScore(dir.score)} ${this.formatGrade(dir.grade)} (${dir.fileCount}ファイル)`
        );

        // ディメンション内訳
        output.push('ディメンション内訳:');
        Object.entries(dir.dimensionBreakdown).forEach(([dimension, score]) => {
          const name = this.getDimensionName(dimension);
          const bar = this.createProgressBar(score, 15);
          output.push(`  ${name.padEnd(12)}: ${this.formatScore(score)} ${bar}`);
        });

        if (dir.worstFile) {
          output.push(`最低スコア: ${dir.worstFile}`);
        }
        if (dir.bestFile) {
          output.push(`最高スコア: ${dir.bestFile}`);
        }
        output.push('');
      });
    }

    return output.join('\n');
  }

  /**
   * トレンドレポートをCLI形式でフォーマット
   */
  formatTrendReport(report: TrendReport): string {
    const output: string[] = [];

    output.push(this.colorize('■ トレンド分析レポート', 'cyan', true));
    output.push('');

    // 現在の状況
    output.push(this.colorize('📈 現在の状況', 'blue', true));
    output.push(`現在のスコア: ${this.formatScore(report.currentScore)}`);
    output.push(`前回のスコア: ${this.formatScore(report.previousScore)}`);

    const trendIcon = this.getTrendIcon(report.trend);
    const trendColor = this.getTrendColor(report.trend);
    output.push(
      `トレンド: ${this.colorize(trendIcon + ' ' + this.getTrendName(report.trend), trendColor, true)}`
    );

    if (report.improvementRate !== 0) {
      const rateDisplay =
        report.improvementRate > 0
          ? `+${report.improvementRate.toFixed(2)}%`
          : `${report.improvementRate.toFixed(2)}%`;
      output.push(`変化率: ${this.colorize(rateDisplay, trendColor)}`);
    }
    output.push('');

    // 履歴データ（直近5件）
    if (report.historicalData.length > 0) {
      output.push(this.colorize('📊 履歴データ（直近5件）', 'blue', true));
      const recentData = report.historicalData.slice(-5);
      recentData.forEach(data => {
        const date = data.date.toLocaleDateString('ja-JP');
        output.push(`${date}: ${this.formatScore(data.score)} ${this.formatGrade(data.grade)}`);
      });
      output.push('');
    }

    // 予測
    if (report.predictions) {
      output.push(this.colorize('🔮 予測', 'blue', true));
      output.push(`来週予測: ${this.formatScore(report.predictions.nextWeekScore)}`);
      output.push(`来月予測: ${this.formatScore(report.predictions.nextMonthScore)}`);
      output.push(`信頼度: ${(report.predictions.confidence * 100).toFixed(1)}%`);
      output.push('');
    }

    // ディメンション別トレンド
    if (report.dimensionTrends.length > 0) {
      output.push(this.colorize('📊 ディメンション別トレンド', 'blue', true));
      report.dimensionTrends.forEach(dimTrend => {
        const name = this.getDimensionName(dimTrend.dimension);
        const trendIcon = this.getTrendIcon(dimTrend.trend as any);
        output.push(`${name}: ${trendIcon} ${this.getTrendName(dimTrend.trend as any)}`);
      });
      output.push('');
    }

    // 推奨事項
    if (report.recommendations.length > 0) {
      output.push(this.colorize('💡 推奨事項', 'blue', true));
      report.recommendations.forEach((rec, index) => {
        output.push(`${index + 1}. ${rec}`);
      });
    }

    return output.join('\n');
  }

  /**
   * カラー表示（ANSI エスケープシーケンス）
   */
  private colorize(text: string, color: string, bold = false): string {
    if (!this.useColors) return text;

    const colors: Record<string, string> = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
    };

    const colorCode = colors[color] || '';
    const boldCode = bold ? '\x1b[1m' : '';
    const resetCode = '\x1b[0m';

    return `${boldCode}${colorCode}${text}${resetCode}`;
  }

  /**
   * スコア表示フォーマット
   */
  private formatScore(score: number): string {
    const rounded = Math.round(score);
    let color: string;

    if (rounded >= 90) color = 'green';
    else if (rounded >= 80) color = 'blue';
    else if (rounded >= 70) color = 'yellow';
    else if (rounded >= 60) color = 'magenta';
    else color = 'red';

    return this.colorize(rounded.toString().padStart(3), color);
  }

  /**
   * グレード表示フォーマット
   */
  private formatGrade(grade: string): string {
    const colors: Record<string, string> = {
      A: 'green',
      B: 'blue',
      C: 'yellow',
      D: 'magenta',
      F: 'red',
    };

    return this.colorize(`[${grade}]`, colors[grade] || 'white');
  }

  /**
   * 重要度表示フォーマット
   */
  private formatSeverity(severity: string): string {
    const colors: Record<string, string> = {
      high: 'red',
      medium: 'yellow',
      low: 'green',
    };

    const labels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };

    return this.colorize(labels[severity] || severity, colors[severity] || 'white');
  }

  /**
   * プログレスバー作成
   */
  private createProgressBar(value: number, width: number): string {
    const percentage = Math.max(0, Math.min(100, value)) / 100;
    const filled = Math.round(width * percentage);
    const empty = width - filled;

    const filledChar = '█';
    const emptyChar = '░';

    let color: string;
    if (value >= 80) color = 'green';
    else if (value >= 60) color = 'yellow';
    else color = 'red';

    const bar = filledChar.repeat(filled) + emptyChar.repeat(empty);
    return this.colorize(bar, color);
  }

  /**
   * ディメンション名を日本語に変換
   */
  private getDimensionName(dimension: string): string {
    const names: Record<string, string> = {
      completeness: '完全性',
      correctness: '正確性',
      maintainability: '保守性',
      performance: 'パフォーマンス',
      security: 'セキュリティ',
    };

    return names[dimension] || dimension;
  }

  /**
   * トレンドアイコン取得
   */
  private getTrendIcon(trend: string): string {
    const icons: Record<string, string> = {
      improving: '📈',
      declining: '📉',
      stable: '➡️',
    };

    return icons[trend] || '❓';
  }

  /**
   * トレンド名を日本語に変換
   */
  private getTrendName(trend: string): string {
    const names: Record<string, string> = {
      improving: '改善傾向',
      declining: '低下傾向',
      stable: '安定',
    };

    return names[trend] || trend;
  }

  /**
   * トレンド色取得
   */
  private getTrendColor(trend: string): string {
    const colors: Record<string, string> = {
      improving: 'green',
      declining: 'red',
      stable: 'blue',
    };

    return colors[trend] || 'white';
  }
}

/**
 * JSON出力フォーマッター
 */
export class JsonFormatter {
  /**
   * サマリーレポートをJSON形式でフォーマット
   */
  formatSummaryReport(report: SummaryReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * 詳細レポートをJSON形式でフォーマット
   */
  formatDetailedReport(report: DetailedReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * トレンドレポートをJSON形式でフォーマット
   */
  formatTrendReport(report: TrendReport): string {
    return JSON.stringify(report, null, 2);
  }
}

/**
 * CSV出力フォーマッター
 */
export class CsvFormatter {
  /**
   * サマリーレポートをCSV形式でフォーマット
   */
  formatSummaryReport(report: SummaryReport): string {
    const headers = [
      'ファイルパス',
      'プロジェクトパス',
      '総合スコア',
      'グレード',
      '総ファイル数',
      '総ディレクトリ数',
      '完全性',
      '正確性',
      '保守性',
      'パフォーマンス',
      'セキュリティ',
      'A級ファイル数',
      'B級ファイル数',
      'C級ファイル数',
      'D級ファイル数',
      'F級ファイル数',
      '平均ファイルスコア',
      '最弱ディメンション',
      '最強ディメンション',
      'プラグイン数',
      '課題数',
    ];

    const row = [
      '',
      report.projectInfo.path,
      report.projectInfo.overallScore,
      report.projectInfo.grade,
      report.projectInfo.totalFiles,
      report.projectInfo.totalDirectories,
      report.dimensionScores.completeness,
      report.dimensionScores.correctness,
      report.dimensionScores.maintainability,
      report.dimensionScores.performance,
      report.dimensionScores.security,
      report.gradeDistribution.A,
      report.gradeDistribution.B,
      report.gradeDistribution.C,
      report.gradeDistribution.D,
      report.gradeDistribution.F,
      report.metadata.averageFileScore,
      report.metadata.worstPerformingDimension,
      report.metadata.bestPerformingDimension,
      report.metadata.pluginCount,
      report.metadata.issueCount,
    ];

    return [headers.join(','), row.join(',')].join('\n');
  }

  /**
   * 詳細レポートをCSV形式でフォーマット
   */
  formatDetailedReport(report: DetailedReport): string {
    const headers = [
      'ファイルパス',
      'スコア',
      'グレード',
      '完全性スコア',
      '完全性重み',
      '正確性スコア',
      '正確性重み',
      '保守性スコア',
      '保守性重み',
      'パフォーマンススコア',
      'パフォーマンス重み',
      'セキュリティスコア',
      'セキュリティ重み',
      '課題数',
      '提案数',
    ];

    const rows = [headers.join(',')];

    report.fileDetails.forEach(file => {
      const dimensionMap = file.dimensions.reduce(
        (acc, dim) => {
          acc[dim.name] = { score: dim.score, weight: dim.weight };
          return acc;
        },
        {} as Record<string, { score: number; weight: number }>
      );

      const row = [
        file.filePath,
        file.score,
        file.grade,
        dimensionMap.completeness?.score || 0,
        dimensionMap.completeness?.weight || 0,
        dimensionMap.correctness?.score || 0,
        dimensionMap.correctness?.weight || 0,
        dimensionMap.maintainability?.score || 0,
        dimensionMap.maintainability?.weight || 0,
        dimensionMap.performance?.score || 0,
        dimensionMap.performance?.weight || 0,
        dimensionMap.security?.score || 0,
        dimensionMap.security?.weight || 0,
        file.issues.length,
        file.suggestions.length,
      ];

      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * トレンドレポートをCSV形式でフォーマット
   */
  formatTrendReport(report: TrendReport): string {
    const headers = [
      '日付',
      'スコア',
      'グレード',
      'トレンド',
      '変化率',
      '来週予測',
      '来月予測',
      '予測信頼度',
    ];

    const rows = [headers.join(',')];

    // 現在のデータ
    const currentRow = [
      new Date().toISOString().split('T')[0],
      report.currentScore,
      '', // 現在のグレードが直接的に提供されていない
      report.trend,
      report.improvementRate,
      report.predictions.nextWeekScore,
      report.predictions.nextMonthScore,
      report.predictions.confidence,
    ];
    rows.push(currentRow.join(','));

    // 履歴データ
    report.historicalData.forEach(data => {
      const row = [
        data.date.toISOString().split('T')[0],
        data.score,
        data.grade,
        '',
        '',
        '',
        '',
        '',
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }
}

/**
 * HTML出力フォーマッター
 */
export class HtmlFormatter {
  /**
   * サマリーレポートをHTML形式でフォーマット
   */
  formatSummaryReport(report: SummaryReport): string {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>品質スコア サマリーレポート - ${report.projectInfo.path}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007ACC; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #007ACC; border-left: 4px solid #007ACC; padding-left: 10px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; min-width: 150px; text-align: center; }
        .score { font-size: 2em; font-weight: bold; }
        .grade { font-size: 1.2em; padding: 5px 10px; border-radius: 3px; color: white; }
        .grade-A { background-color: #28a745; }
        .grade-B { background-color: #007bff; }
        .grade-C { background-color: #ffc107; color: black; }
        .grade-D { background-color: #fd7e14; }
        .grade-F { background-color: #dc3545; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 5px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-green { background: #28a745; }
        .progress-yellow { background: #ffc107; }
        .progress-red { background: #dc3545; }
        .issue { margin: 10px 0; padding: 10px; border-left: 3px solid #ffc107; background: #fff3cd; }
        .issue.high { border-color: #dc3545; background: #f8d7da; }
        .issue.medium { border-color: #ffc107; background: #fff3cd; }
        .issue.low { border-color: #28a745; background: #d1eddd; }
        .recommendation { margin: 10px 0; padding: 10px; background: #d4edda; border-left: 3px solid #28a745; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #007ACC; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>品質スコア サマリーレポート</h1>
            <p>生成日時: ${report.projectInfo.generatedAt.toLocaleString('ja-JP')}</p>
        </div>

        <div class="section">
            <h2>📁 プロジェクト情報</h2>
            <div class="metric">
                <div>パス</div>
                <div>${report.projectInfo.path}</div>
            </div>
            <div class="metric">
                <div>総合スコア</div>
                <div class="score">${report.projectInfo.overallScore}</div>
                <div class="grade grade-${report.projectInfo.grade}">${report.projectInfo.grade}</div>
            </div>
            <div class="metric">
                <div>ファイル数</div>
                <div>${report.projectInfo.totalFiles}</div>
            </div>
            <div class="metric">
                <div>ディレクトリ数</div>
                <div>${report.projectInfo.totalDirectories}</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 ディメンション別スコア</h2>
            ${Object.entries(report.dimensionScores)
              .map(([dimension, score]) => {
                const progressClass =
                  score >= 80 ? 'progress-green' : score >= 60 ? 'progress-yellow' : 'progress-red';
                const dimensionName = this.getDimensionName(dimension);
                return `
                <div style="margin: 15px 0;">
                    <div>${dimensionName}: ${score}</div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${score}%"></div>
                    </div>
                </div>
              `;
              })
              .join('')}
        </div>

        <div class="section">
            <h2>🏆 グレード分布</h2>
            <table>
                <tr><th>グレード</th><th>ファイル数</th><th>割合</th></tr>
                ${Object.entries(report.gradeDistribution)
                  .map(([grade, count]) => {
                    const total = Object.values(report.gradeDistribution).reduce(
                      (sum, c) => sum + c,
                      0
                    );
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                    return `<tr><td class="grade grade-${grade}">${grade}</td><td>${count}</td><td>${percentage}%</td></tr>`;
                  })
                  .join('')}
            </table>
        </div>

        ${
          report.topIssues.length > 0
            ? `
        <div class="section">
            <h2>⚠️ 主要課題</h2>
            ${report.topIssues
              .slice(0, 5)
              .map(
                issue => `
                <div class="issue ${issue.severity}">
                    <strong>${this.getDimensionName(issue.dimension)}</strong>: ${issue.description}
                    <br>影響ファイル: ${issue.affectedFiles}個
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        ${
          report.recommendations.length > 0
            ? `
        <div class="section">
            <h2>💡 推奨事項</h2>
            ${report.recommendations
              .map(
                rec => `
                <div class="recommendation">${rec}</div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        <div class="section">
            <h2>📈 統計情報</h2>
            <table>
                <tr><td>平均ファイルスコア</td><td>${report.metadata.averageFileScore}</td></tr>
                <tr><td>最弱ディメンション</td><td>${this.getDimensionName(report.metadata.worstPerformingDimension)}</td></tr>
                <tr><td>最強ディメンション</td><td>${this.getDimensionName(report.metadata.bestPerformingDimension)}</td></tr>
                <tr><td>プラグイン数</td><td>${report.metadata.pluginCount}</td></tr>
                <tr><td>課題数</td><td>${report.metadata.issueCount}</td></tr>
            </table>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * 詳細レポートをHTML形式でフォーマット（簡略化版）
   */
  formatDetailedReport(report: DetailedReport): string {
    // 詳細レポートは長くなるため、サマリー + ファイルリストの簡略版
    return (
      this.formatSummaryReport(report.summary) +
      `
    <div class="section">
        <h2>📄 ファイル詳細</h2>
        <table>
            <tr><th>ファイルパス</th><th>スコア</th><th>グレード</th><th>課題数</th><th>提案数</th></tr>
            ${report.fileDetails
              .map(
                file => `
                <tr>
                    <td>${file.filePath}</td>
                    <td>${file.score}</td>
                    <td class="grade grade-${file.grade}">${file.grade}</td>
                    <td>${file.issues.length}</td>
                    <td>${file.suggestions.length}</td>
                </tr>
            `
              )
              .join('')}
        </table>
    </div>
    `
    );
  }

  /**
   * トレンドレポートをHTML形式でフォーマット（簡略化版）
   */
  formatTrendReport(report: TrendReport): string {
    return `
    <div class="section">
        <h2>📈 トレンド分析</h2>
        <div class="metric">
            <div>現在のスコア</div>
            <div class="score">${report.currentScore}</div>
        </div>
        <div class="metric">
            <div>前回のスコア</div>
            <div class="score">${report.previousScore}</div>
        </div>
        <div class="metric">
            <div>トレンド</div>
            <div>${report.trend}</div>
        </div>
        <div class="metric">
            <div>変化率</div>
            <div>${report.improvementRate.toFixed(2)}%</div>
        </div>
    </div>
    `;
  }

  private getDimensionName(dimension: string): string {
    const names: Record<string, string> = {
      completeness: '完全性',
      correctness: '正確性',
      maintainability: '保守性',
      performance: 'パフォーマンス',
      security: 'セキュリティ',
    };
    return names[dimension] || dimension;
  }
}
