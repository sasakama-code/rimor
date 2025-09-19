/**
 * ベンチマークレポート生成システム
 * Phase 4: レポート生成・可視化機能
 *
 * SOLID原則に基づく設計:
 * - Single Responsibility: レポート生成に特化
 * - Open/Closed: 新しいフォーマットの追加に開放的
 * - Liskov Substitution: フォーマット実装の互換性
 * - Interface Segregation: フォーマット別インターフェース分離
 * - Dependency Inversion: テンプレートエンジンへの依存性注入
 *
 * Defensive Programming原則:
 * - 入力検証とサニタイゼーション
 * - エラーハンドリングとフォールバック
 * - リソース管理とクリーンアップ
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BenchmarkResult, BaselineIntegratedResult } from '../ExternalProjectBenchmarkRunner';
import { BaselineComparison } from '../BaselineManager';

/**
 * レポート生成設定
 */
export interface ReportGeneratorConfig {
  /** 出力ディレクトリ */
  outputDir: string;
  /** テンプレートディレクトリ */
  templateDir?: string;
  /** グラフ機能有効化 */
  enableCharts?: boolean;
  /** 生データ含有 */
  includeRawData?: boolean;
  /** カスタムテンプレート */
  customTemplates?: {
    markdown?: string;
    html?: string;
    csv?: string;
  };
}

/**
 * HTMLレポート生成オプション
 */
export interface HTMLReportOptions {
  /** グラフ含有 */
  includeCharts?: boolean;
  /** テーマ */
  theme?: 'light' | 'dark';
  /** インタラクティブ機能 */
  interactive?: boolean;
  /** 検索機能 */
  includeSearch?: boolean;
  /** フィルタ機能 */
  includeFilter?: boolean;
}

/**
 * CSVエクスポートオプション
 */
export interface CSVExportOptions {
  /** 比較データ含有 */
  includeComparison?: boolean;
  /** 比較データ */
  comparison?: BaselineComparison;
  /** 区切り文字 */
  delimiter?: string;
  /** 文字エンコーディング */
  encoding?: 'utf8';
}

/**
 * ダッシュボード生成オプション
 */
export interface DashboardOptions {
  /** 履歴データ含有 */
  includeHistoricalData?: boolean;
  /** 傾向分析含有 */
  includeTrendAnalysis?: boolean;
  /** 推奨事項含有 */
  includeRecommendations?: boolean;
  /** 自動更新間隔（秒） */
  autoRefreshInterval?: number;
}

/**
 * 全フォーマット生成オプション
 */
export interface AllFormatsOptions {
  markdown?: boolean;
  html?: boolean;
  csv?: boolean;
  dashboard?: boolean;
}

/**
 * 全フォーマット生成結果
 */
export interface AllFormatsResult {
  markdown?: string;
  html?: string;
  csv?: string;
  dashboard?: string;
}

/**
 * ベンチマークレポート生成クラス
 * 複数フォーマット対応（Markdown, HTML, CSV, Dashboard）
 */
export class BenchmarkReportGenerator {
  private readonly config: Required<ReportGeneratorConfig>;

  constructor(config: ReportGeneratorConfig) {
    // デフォルト設定の適用（Defensive Programming）
    this.config = {
      outputDir: config.outputDir,
      templateDir: config.templateDir || path.join(__dirname, '../templates'),
      enableCharts: config.enableCharts ?? true,
      includeRawData: config.includeRawData ?? false,
      customTemplates: config.customTemplates || {},
    };

    // 出力ディレクトリの確保
    this.ensureOutputDirectories();
  }

  /**
   * Markdownレポート生成
   *
   * @param results ベンチマーク結果配列
   * @param comparison オプションのベースライン比較結果
   * @returns 生成されたレポートファイルパス
   */
  async generateMarkdownReport(
    results: BenchmarkResult[],
    comparison?: BaselineComparison
  ): Promise<string> {
    // 入力検証（Defensive Programming）
    if (!Array.isArray(results)) {
      throw new Error('結果配列が無効です');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-report-${timestamp}.md`;
    const filepath = path.join(this.config.outputDir, 'markdown', filename);

    const successfulResults = results.filter(r => r.success);

    // Markdownコンテンツ生成
    const markdownContent = this.generateMarkdownContent(successfulResults, comparison);

    // ファイル書き込み
    await this.ensureDirectory(path.dirname(filepath));
    await fs.writeFile(filepath, markdownContent, 'utf-8');

    return filepath;
  }

  /**
   * HTMLレポート生成
   *
   * @param results ベンチマーク結果配列
   * @param options HTML生成オプション
   * @returns 生成されたレポートファイルパス
   */
  async generateHTMLReport(
    results: BenchmarkResult[],
    options: HTMLReportOptions = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-report-${timestamp}.html`;
    const filepath = path.join(this.config.outputDir, 'html', filename);

    const successfulResults = results.filter(r => r.success);

    // HTMLコンテンツ生成
    const htmlContent = await this.generateHTMLContent(successfulResults, options);

    // ファイル書き込み
    await this.ensureDirectory(path.dirname(filepath));
    await fs.writeFile(filepath, htmlContent, 'utf-8');

    return filepath;
  }

  /**
   * CSVエクスポート
   *
   * @param results ベンチマーク結果配列
   * @param options CSVエクスポートオプション
   * @returns 生成されたCSVファイルパス
   */
  async generateCSVExport(
    results: BenchmarkResult[],
    options: CSVExportOptions = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-data-${timestamp}.csv`;
    const filepath = path.join(this.config.outputDir, 'csv', filename);

    const successfulResults = results.filter(r => r.success);

    // CSVコンテンツ生成
    const csvContent = this.generateCSVContent(successfulResults, options);

    // ファイル書き込み
    await this.ensureDirectory(path.dirname(filepath));
    await fs.writeFile(filepath, csvContent, options.encoding || 'utf-8');

    return filepath;
  }

  /**
   * ダッシュボード生成
   *
   * @param integratedResults 統合ベンチマーク結果配列（履歴データ）
   * @param options ダッシュボード生成オプション
   * @returns 生成されたダッシュボードファイルパス
   */
  async generateDashboard(
    integratedResults: BaselineIntegratedResult[],
    options: DashboardOptions = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-dashboard-${timestamp}.html`;
    const filepath = path.join(this.config.outputDir, 'dashboard', filename);

    // ダッシュボードコンテンツ生成
    const dashboardContent = await this.generateDashboardContent(integratedResults, options);

    // ファイル書き込み
    await this.ensureDirectory(path.dirname(filepath));
    await fs.writeFile(filepath, dashboardContent, 'utf-8');

    return filepath;
  }

  /**
   * 全フォーマット一括生成
   *
   * @param results ベンチマーク結果配列
   * @param formats 生成するフォーマット設定
   * @returns 各フォーマットのファイルパス
   */
  async generateAllFormats(
    results: BenchmarkResult[],
    formats: AllFormatsOptions = {}
  ): Promise<AllFormatsResult> {
    const allReports: AllFormatsResult = {};

    // 並列生成で効率化
    const tasks: Promise<void>[] = [];

    if (formats.markdown !== false) {
      tasks.push(
        this.generateMarkdownReport(results).then(path => {
          allReports.markdown = path;
        })
      );
    }

    if (formats.html !== false) {
      tasks.push(
        this.generateHTMLReport(results).then(path => {
          allReports.html = path;
        })
      );
    }

    if (formats.csv !== false) {
      tasks.push(
        this.generateCSVExport(results).then(path => {
          allReports.csv = path;
        })
      );
    }

    if (formats.dashboard !== false) {
      // ダッシュボードは統合結果が必要なため、簡易版を作成
      const mockIntegratedResult: BaselineIntegratedResult = {
        results,
        baselineId: 'generated-' + Date.now().toString(),
      };

      tasks.push(
        this.generateDashboard([mockIntegratedResult]).then(path => {
          allReports.dashboard = path;
        })
      );
    }

    // 全タスク完了待ち
    await Promise.all(tasks);

    return allReports;
  }

  // ===== プライベートメソッド =====

  /**
   * 出力ディレクトリの確保
   */
  private async ensureOutputDirectories(): Promise<void> {
    const dirs = ['markdown', 'html', 'csv', 'dashboard'].map(subdir =>
      path.join(this.config.outputDir, subdir)
    );

    await Promise.all(dirs.map(dir => this.ensureDirectory(dir)));
  }

  /**
   * ディレクトリ存在確認と作成
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // ディレクトリ作成失敗は警告のみ
      console.warn(`ディレクトリ作成警告: ${error}`);
    }
  }

  /**
   * Markdownコンテンツ生成
   */
  private generateMarkdownContent(
    results: BenchmarkResult[],
    comparison?: BaselineComparison
  ): string {
    const timestamp = new Date().toLocaleString('ja-JP');

    let content = `# ベンチマーク実行レポート\\n\\n`;
    content += `**生成日時**: ${timestamp}\\n`;
    content += `**対象プロジェクト数**: ${results.length}\\n\\n`;

    // 概要統計
    content += `## 📊 概要統計\\n\\n`;
    const stats = this.calculateSummaryStatistics(results);
    content += `| 指標 | 値 |\\n`;
    content += `|------|-----|\\n`;
    content += `| 平均実行時間 | ${stats.averageTimePerFile.toFixed(2)}ms/file |\\n`;
    content += `| 5ms/file目標達成率 | ${(stats.target5msAchievementRate * 100).toFixed(1)}% |\\n`;
    content += `| 全体成功率 | ${(stats.successRate * 100).toFixed(1)}% |\\n`;
    content += `| 平均精度 | ${(stats.averageAccuracy * 100).toFixed(1)}% |\\n\\n`;

    // プロジェクト別詳細
    content += `## 📋 プロジェクト別結果\\n\\n`;
    content += `| プロジェクト | 実行時間(ms/file) | 5ms目標 | TaintTyper精度 | メモリ使用量(MB) |\\n`;
    content += `|------------|------------------|---------|---------------|-----------------|\\n`;

    results.forEach(result => {
      const target5msIcon = result.target5ms.achieved ? '✅' : '❌';
      const memoryMB = Math.round(result.performance.memoryUsage.heapUsed / 1024 / 1024);

      content += `| ${result.projectName} | ${result.performance.timePerFile.toFixed(2)} | ${target5msIcon} | ${(result.accuracy.taintTyperSuccessRate * 100).toFixed(1)}% | ${memoryMB} |\\n`;
    });

    content += `\\n`;

    // ベースライン比較（存在する場合）
    if (comparison) {
      content += `## 📈 ベースライン比較結果\\n\\n`;
      content += `**全体改善率**: ${comparison.overallImprovement.toFixed(2)}%\\n\\n`;

      content += `### プロジェクト別比較\\n\\n`;
      content += `| プロジェクト | 性能改善率 | 精度改善率 | 5ms目標状況 |\\n`;
      content += `|------------|-----------|-----------|-------------|\\n`;

      comparison.projectComparisons.forEach(comp => {
        const statusIcon =
          comp.target5msStatus === 'improved'
            ? '🎯'
            : comp.target5msStatus === 'maintained'
              ? '✅'
              : '⚠️';

        content += `| ${comp.projectName} | ${comp.performanceImprovement.toFixed(1)}% | ${comp.accuracyImprovement.toFixed(1)}% | ${comp.target5msStatus} ${statusIcon} |\\n`;
      });

      content += `\\n`;
    }

    // 推奨事項
    content += `## 💡 推奨事項\\n\\n`;
    const recommendations = this.generateRecommendations(results, comparison);
    recommendations.forEach((rec, index) => {
      content += `${index + 1}. ${rec}\\n`;
    });

    return content;
  }

  /**
   * HTMLコンテンツ生成
   */
  private async generateHTMLContent(
    results: BenchmarkResult[],
    options: HTMLReportOptions
  ): Promise<string> {
    const timestamp = new Date().toLocaleString('ja-JP');
    const stats = this.calculateSummaryStatistics(results);

    let html = `<!DOCTYPE html>\\n<html lang="ja">\\n<head>\\n`;
    html += `    <meta charset="UTF-8">\\n`;
    html += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n`;
    html += `    <title>ベンチマーク実行レポート</title>\\n`;

    // Chart.js CDN
    if (options.includeCharts) {
      html += `    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\\n`;
    }

    html += `    <style>\\n`;
    html += `        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }\\n`;
    html += `        .container { max-width: 1200px; margin: 0 auto; }\\n`;
    html += `        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 2rem 0; }\\n`;
    html += `        .stat-card { background: #f8f9fa; border-radius: 8px; padding: 1.5rem; border-left: 4px solid #007bff; }\\n`;
    html += `        .stat-value { font-size: 2rem; font-weight: bold; color: #007bff; }\\n`;
    html += `        .stat-label { color: #6c757d; margin-top: 0.5rem; }\\n`;
    html += `        table { width: 100%; border-collapse: collapse; margin: 2rem 0; }\\n`;
    html += `        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #dee2e6; }\\n`;
    html += `        th { background-color: #e9ecef; font-weight: 600; }\\n`;
    html += `        .chart-container { width: 100%; height: 400px; margin: 2rem 0; }\\n`;
    html += `    </style>\\n`;
    html += `</head>\\n<body>\\n`;

    html += `    <div class="container">\\n`;
    html += `        <h1>📊 ベンチマーク実行レポート</h1>\\n`;
    html += `        <p><strong>生成日時:</strong> ${timestamp}</p>\\n`;
    html += `        <p><strong>対象プロジェクト数:</strong> ${results.length}</p>\\n`;

    // 統計カード
    html += `        <div class="stats-grid">\\n`;
    html += `            <div class="stat-card">\\n`;
    html += `                <div class="stat-value">${stats.averageTimePerFile.toFixed(2)}ms</div>\\n`;
    html += `                <div class="stat-label">平均実行時間/ファイル</div>\\n`;
    html += `            </div>\\n`;
    html += `            <div class="stat-card">\\n`;
    html += `                <div class="stat-value">${(stats.target5msAchievementRate * 100).toFixed(1)}%</div>\\n`;
    html += `                <div class="stat-label">5ms/file目標達成率</div>\\n`;
    html += `            </div>\\n`;
    html += `            <div class="stat-card">\\n`;
    html += `                <div class="stat-value">${(stats.successRate * 100).toFixed(1)}%</div>\\n`;
    html += `                <div class="stat-label">全体成功率</div>\\n`;
    html += `            </div>\\n`;
    html += `            <div class="stat-card">\\n`;
    html += `                <div class="stat-value">${(stats.averageAccuracy * 100).toFixed(1)}%</div>\\n`;
    html += `                <div class="stat-label">平均精度</div>\\n`;
    html += `            </div>\\n`;
    html += `        </div>\\n`;

    // グラフ（Chart.js）
    if (options.includeCharts) {
      html += `        <h2>📈 パフォーマンス可視化</h2>\\n`;
      html += `        <div class="chart-container">\\n`;
      html += `            <canvas id="performanceChart"></canvas>\\n`;
      html += `        </div>\\n`;
      html += `        <div class="chart-container">\\n`;
      html += `            <canvas id="accuracyChart"></canvas>\\n`;
      html += `        </div>\\n`;
    }

    // プロジェクト詳細テーブル
    html += `        <h2>📋 プロジェクト別詳細</h2>\\n`;
    html += `        <table>\\n`;
    html += `            <thead>\\n`;
    html += `                <tr>\\n`;
    html += `                    <th>プロジェクト</th>\\n`;
    html += `                    <th>実行時間(ms/file)</th>\\n`;
    html += `                    <th>5ms目標</th>\\n`;
    html += `                    <th>TaintTyper精度</th>\\n`;
    html += `                    <th>メモリ使用量(MB)</th>\\n`;
    html += `                </tr>\\n`;
    html += `            </thead>\\n`;
    html += `            <tbody>\\n`;

    results.forEach(result => {
      const target5msIcon = result.target5ms.achieved ? '✅' : '❌';
      const memoryMB = Math.round(result.performance.memoryUsage.heapUsed / 1024 / 1024);

      html += `                <tr>\\n`;
      html += `                    <td>${result.projectName}</td>\\n`;
      html += `                    <td>${result.performance.timePerFile.toFixed(2)}</td>\\n`;
      html += `                    <td>${target5msIcon}</td>\\n`;
      html += `                    <td>${(result.accuracy.taintTyperSuccessRate * 100).toFixed(1)}%</td>\\n`;
      html += `                    <td>${memoryMB}</td>\\n`;
      html += `                </tr>\\n`;
    });

    html += `            </tbody>\\n`;
    html += `        </table>\\n`;
    html += `    </div>\\n`;

    // Chart.js スクリプト
    if (options.includeCharts) {
      html += this.generateChartJavaScript(results);
    }

    html += `</body>\\n</html>`;

    return html;
  }

  /**
   * CSVコンテンツ生成
   */
  private generateCSVContent(results: BenchmarkResult[], options: CSVExportOptions): string {
    const delimiter = options.delimiter || ',';
    let csv = '';

    // ヘッダー行
    let headers = [
      'プロジェクト名',
      '実行時間(ms/file)',
      '総ファイル数',
      '5ms目標達成',
      'TaintTyper精度(%)',
      'Intent抽出精度(%)',
      'Gap検出精度(%)',
      'メモリ使用量(MB)',
      'CPU使用率(%)',
      'スループット(files/sec)',
    ];

    if (options.includeComparison) {
      headers.push('性能改善率(%)', '精度改善率(%)', '目標達成状況');
    }

    csv += headers.join(delimiter) + '\\n';

    // データ行
    results.forEach(result => {
      const memoryMB = Math.round(result.performance.memoryUsage.heapUsed / 1024 / 1024);

      let row = [
        result.projectName,
        result.performance.timePerFile.toFixed(2),
        result.performance.totalFiles.toString(),
        result.target5ms.achieved ? 'TRUE' : 'FALSE',
        (result.accuracy.taintTyperSuccessRate * 100).toFixed(1),
        (result.accuracy.intentExtractionSuccessRate * 100).toFixed(1),
        (result.accuracy.gapDetectionAccuracy * 100).toFixed(1),
        memoryMB.toString(),
        (result.performance.cpuUsage || 0).toFixed(1),
        result.performance.throughput.toFixed(1),
      ];

      if (options.includeComparison && options.comparison) {
        const projectComparison = options.comparison.projectComparisons.find(
          comp => comp.projectName === result.projectName
        );

        if (projectComparison) {
          row.push(
            projectComparison.performanceImprovement.toFixed(1),
            projectComparison.accuracyImprovement.toFixed(1),
            projectComparison.target5msStatus
          );
        } else {
          row.push('N/A', 'N/A', 'N/A');
        }
      }

      csv += row.join(delimiter) + '\\n';
    });

    return csv;
  }

  /**
   * ダッシュボードコンテンツ生成
   */
  private async generateDashboardContent(
    integratedResults: BaselineIntegratedResult[],
    options: DashboardOptions
  ): Promise<string> {
    const timestamp = new Date().toLocaleString('ja-JP');
    const latestResult = integratedResults[integratedResults.length - 1];
    const results = latestResult.results.filter(r => r.success);

    let html = `<!DOCTYPE html>\\n<html lang="ja">\\n<head>\\n`;
    html += `    <meta charset="UTF-8">\\n`;
    html += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n`;
    html += `    <title>Rimor ベンチマーク ダッシュボード</title>\\n`;
    html += `    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\\n`;
    html += `    <style>\\n`;
    html += `        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8f9fa; }\\n`;
    html += `        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem; max-width: 1400px; margin: 0 auto; }\\n`;
    html += `        .panel { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }\\n`;
    html += `        .panel h2 { margin-top: 0; color: #343a40; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem; }\\n`;
    html += `        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }\\n`;
    html += `        .metric { text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px; }\\n`;
    html += `        .metric-value { font-size: 1.8rem; font-weight: bold; color: #007bff; }\\n`;
    html += `        .metric-label { font-size: 0.9rem; color: #6c757d; margin-top: 0.25rem; }\\n`;
    html += `        .chart-panel { grid-column: 1 / -1; }\\n`;
    html += `        .chart-container { height: 300px; margin: 1rem 0; }\\n`;
    html += `        .recommendations { background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 1rem; border-radius: 4px; }\\n`;
    html += `    </style>\\n`;
    html += `</head>\\n<body>\\n`;

    html += `    <div class="dashboard">\\n`;
    html += `        <div class="panel">\\n`;
    html += `            <h2>📊 パフォーマンス概要</h2>\\n`;
    html += `            <p><strong>最終更新:</strong> ${timestamp}</p>\\n`;

    const stats = this.calculateSummaryStatistics(results);
    html += `            <div class="metric-grid">\\n`;
    html += `                <div class="metric">\\n`;
    html += `                    <div class="metric-value">${stats.averageTimePerFile.toFixed(1)}ms</div>\\n`;
    html += `                    <div class="metric-label">平均実行時間</div>\\n`;
    html += `                </div>\\n`;
    html += `                <div class="metric">\\n`;
    html += `                    <div class="metric-value">${(stats.target5msAchievementRate * 100).toFixed(0)}%</div>\\n`;
    html += `                    <div class="metric-label">5ms目標達成</div>\\n`;
    html += `                </div>\\n`;
    html += `                <div class="metric">\\n`;
    html += `                    <div class="metric-value">${(stats.averageAccuracy * 100).toFixed(0)}%</div>\\n`;
    html += `                    <div class="metric-label">平均精度</div>\\n`;
    html += `                </div>\\n`;
    html += `                <div class="metric">\\n`;
    html += `                    <div class="metric-value">${results.length}</div>\\n`;
    html += `                    <div class="metric-label">対象プロジェクト</div>\\n`;
    html += `                </div>\\n`;
    html += `            </div>\\n`;
    html += `        </div>\\n`;

    // 傾向分析パネル
    if (options.includeTrendAnalysis && integratedResults.length > 1) {
      html += `        <div class="panel">\\n`;
      html += `            <h2>📈 傾向分析</h2>\\n`;
      html += `            <div class="chart-container">\\n`;
      html += `                <canvas id="trendChart"></canvas>\\n`;
      html += `            </div>\\n`;
      html += `        </div>\\n`;
    }

    // メインパフォーマンスチャート
    html += `        <div class="panel chart-panel">\\n`;
    html += `            <h2>📊 プロジェクト別パフォーマンス</h2>\\n`;
    html += `            <div class="chart-container">\\n`;
    html += `                <canvas id="performanceChart"></canvas>\\n`;
    html += `            </div>\\n`;
    html += `        </div>\\n`;

    // 推奨事項パネル
    if (options.includeRecommendations) {
      html += `        <div class="panel">\\n`;
      html += `            <h2>💡 推奨事項</h2>\\n`;
      const recommendations = this.generateRecommendations(results, latestResult.comparison);
      html += `            <div class="recommendations">\\n`;
      html += `                <ul>\\n`;
      recommendations.forEach(rec => {
        html += `                    <li>${rec}</li>\\n`;
      });
      html += `                </ul>\\n`;
      html += `            </div>\\n`;
      html += `        </div>\\n`;
    }

    html += `    </div>\\n`;

    // ダッシュボード用JavaScript
    html += this.generateDashboardJavaScript(integratedResults, options);

    html += `</body>\\n</html>`;

    return html;
  }

  /**
   * Chart.js JavaScript生成
   */
  private generateChartJavaScript(results: BenchmarkResult[]): string {
    const projectNames = results.map(r => r.projectName);
    const timePerFile = results.map(r => r.performance.timePerFile);
    const accuracy = results.map(r => r.accuracy.taintTyperSuccessRate * 100);

    return `
    <script>
    // パフォーマンスチャート
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(perfCtx, {
        type: 'bar',
        data: {
            labels: ${JSON.stringify(projectNames)},
            datasets: [{
                label: '実行時間 (ms/file)',
                data: ${JSON.stringify(timePerFile)},
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'プロジェクト別実行時間'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'ms/file'
                    }
                }
            }
        }
    });
    
    // 精度チャート
    const accCtx = document.getElementById('accuracyChart').getContext('2d');
    new Chart(accCtx, {
        type: 'line',
        data: {
            labels: ${JSON.stringify(projectNames)},
            datasets: [{
                label: 'TaintTyper精度 (%)',
                data: ${JSON.stringify(accuracy)},
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'プロジェクト別精度'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '精度 (%)'
                    }
                }
            }
        }
    });
    </script>
    `;
  }

  /**
   * ダッシュボード用JavaScript生成
   */
  private generateDashboardJavaScript(
    integratedResults: BaselineIntegratedResult[],
    options: DashboardOptions
  ): string {
    const latestResults = integratedResults[integratedResults.length - 1].results.filter(
      r => r.success
    );
    const projectNames = latestResults.map(r => r.projectName);
    const timePerFile = latestResults.map(r => r.performance.timePerFile);

    let script = `
    <script>
    // メインパフォーマンスチャート
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(perfCtx, {
        type: 'bar',
        data: {
            labels: ${JSON.stringify(projectNames)},
            datasets: [{
                label: '実行時間 (ms/file)',
                data: ${JSON.stringify(timePerFile)},
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'ms/file'
                    }
                }
            }
        }
    });
    `;

    // 時系列トレンドチャート
    if (options.includeTrendAnalysis && integratedResults.length > 1) {
      const trendData = integratedResults.map(result => {
        const avgTime =
          result.results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.performance.timePerFile, 0) /
          result.results.filter(r => r.success).length;
        return avgTime;
      });

      const trendLabels = integratedResults.map((_, index) => `実行 ${index + 1}`);

      script += `
      // 時系列トレンドチャート
      const trendCtx = document.getElementById('trendChart').getContext('2d');
      new Chart(trendCtx, {
          type: 'line',
          data: {
              labels: ${JSON.stringify(trendLabels)},
              datasets: [{
                  label: '平均実行時間',
                  data: ${JSON.stringify(trendData)},
                  borderColor: 'rgba(75, 192, 192, 1)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.4
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      display: false
                  }
              },
              scales: {
                  y: {
                      beginAtZero: true,
                      title: {
                          display: true,
                          text: 'ms/file'
                      }
                  }
              }
          }
      });
      `;
    }

    // 自動更新機能
    if (options.autoRefreshInterval) {
      script += `
      // 自動更新
      setTimeout(function() {
          location.reload();
      }, ${options.autoRefreshInterval * 1000});
      `;
    }

    script += `
    </script>
    `;

    return script;
  }

  /**
   * 概要統計の計算
   */
  private calculateSummaryStatistics(results: BenchmarkResult[]) {
    if (results.length === 0) {
      return {
        averageTimePerFile: 0,
        target5msAchievementRate: 0,
        successRate: 0,
        averageAccuracy: 0,
      };
    }

    const averageTimePerFile =
      results.reduce((sum, r) => sum + r.performance.timePerFile, 0) / results.length;
    const target5msAchieved = results.filter(r => r.target5ms.achieved).length;
    const target5msAchievementRate = target5msAchieved / results.length;
    const successRate = 1.0; // フィルタ済みなので100%
    const averageAccuracy =
      results.reduce((sum, r) => sum + r.accuracy.taintTyperSuccessRate, 0) / results.length;

    return {
      averageTimePerFile,
      target5msAchievementRate,
      successRate,
      averageAccuracy,
    };
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(
    results: BenchmarkResult[],
    comparison?: BaselineComparison
  ): string[] {
    const recommendations: string[] = [];

    const stats = this.calculateSummaryStatistics(results);

    // 基本的な推奨事項
    if (stats.target5msAchievementRate >= 0.9) {
      recommendations.push('優秀な性能です。現在の最適化戦略を継続してください。');
    } else if (stats.target5msAchievementRate >= 0.7) {
      recommendations.push('良好な性能ですが、一部プロジェクトで改善の余地があります。');
    } else {
      recommendations.push('全体的な性能改善が必要です。ボトルネック分析を実施してください。');
    }

    // メモリ使用量チェック
    const avgMemoryMB =
      results.reduce((sum, r) => sum + r.performance.memoryUsage.heapUsed, 0) /
      results.length /
      1024 /
      1024;
    if (avgMemoryMB > 200) {
      recommendations.push('メモリ使用量が高めです。メモリプロファイリングを検討してください。');
    }

    // 精度関連
    if (stats.averageAccuracy < 0.85) {
      recommendations.push('解析精度の向上が必要です。設定の見直しを検討してください。');
    }

    // ベースライン比較に基づく推奨事項
    if (comparison) {
      if (comparison.overallImprovement > 10) {
        recommendations.push('大幅な性能改善が見られます。最新の最適化手法の効果が出ています。');
      } else if (comparison.overallImprovement < -5) {
        recommendations.push('性能劣化が検出されました。最近の変更内容を確認してください。');
      }

      if (comparison.target5msImprovements.degraded.length > 0) {
        recommendations.push(
          `${comparison.target5msImprovements.degraded.join(', ')} で5ms目標未達成になりました。優先的に対応してください。`
        );
      }
    }

    return recommendations;
  }
}
