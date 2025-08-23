#!/usr/bin/env node
/**
 * 週次品質レポートツール
 * 毎週の品質メトリクスを集計し、改善提案を生成
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { QualityDashboard } from '../src/monitoring/quality-dashboard';
import { TypeConsistencyChecker } from '../src/tools/type-consistency-checker';
import { CoreTypes } from '../src/core/types/core-definitions';

interface WeeklyReport {
  period: {
    start: Date;
    end: Date;
    weekNumber: number;
  };
  
  metrics: {
    coverage: {
      current: number;
      previous: number;
      change: number;
      target: number;
      status: 'achieved' | 'improving' | 'declining' | 'stagnant';
    };
    
    typeHealth: {
      conflicts: number;
      resolved: number;
      new: number;
      consistency: number;
    };
    
    testHealth: {
      totalTests: number;
      newTests: number;
      failureRate: number;
      flakyTests: string[];
    };
    
    codeQuality: {
      complexity: {
        average: number;
        trend: 'improving' | 'worsening' | 'stable';
      };
      duplication: number;
      technicalDebt: {
        score: number;
        added: number;
        resolved: number;
      };
    };
  };
  
  achievements: string[];
  concerns: string[];
  recommendations: CoreTypes.Improvement[];
  
  teamMetrics?: {
    commits: number;
    pullRequests: number;
    contributors: string[];
    productivity: number; // 0-100
  };
}

export class WeeklyQualityReporter {
  private dashboard: QualityDashboard;
  private previousReports: WeeklyReport[] = [];
  private reportPath: string;

  constructor(reportPath = '.rimor/reports/weekly') {
    this.dashboard = new QualityDashboard();
    this.reportPath = reportPath;
    this.loadPreviousReports();
  }

  /**
   * 過去のレポートを読み込み
   */
  private loadPreviousReports(): void {
    const reportsDir = path.join(process.cwd(), this.reportPath);
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.json'))
      .sort();

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(reportsDir, file), 'utf-8');
        this.previousReports.push(JSON.parse(content));
      } catch (error) {
        console.warn(`Failed to load report: ${file}`);
      }
    }
  }

  /**
   * 週次レポートを生成
   */
  async generateWeeklyReport(): Promise<WeeklyReport> {
    console.log('📊 Generating weekly quality report...');
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    
    // メトリクス収集
    const currentMetrics = await this.collectCurrentMetrics();
    const previousMetrics = this.getPreviousMetrics();
    
    // Git統計収集
    const teamMetrics = this.collectTeamMetrics(weekStart, now);
    
    // レポート生成
    const report: WeeklyReport = {
      period: {
        start: weekStart,
        end: now,
        weekNumber: this.getWeekNumber(now)
      },
      
      metrics: {
        coverage: this.analyzeCoverage(currentMetrics, previousMetrics),
        typeHealth: await this.analyzeTypeHealth(),
        testHealth: this.analyzeTestHealth(currentMetrics),
        codeQuality: this.analyzeCodeQuality(currentMetrics, previousMetrics)
      },
      
      achievements: [],
      concerns: [],
      recommendations: [],
      teamMetrics
    };

    // 成果と懸念事項を特定
    this.identifyAchievements(report);
    this.identifyConcerns(report);
    
    // 改善提案を生成
    report.recommendations = this.generateRecommendations(report);
    
    // レポート保存
    await this.saveReport(report);
    
    return report;
  }

  /**
   * 現在のメトリクスを収集
   */
  private async collectCurrentMetrics(): Promise<any> {
    await this.dashboard.refresh();
    return this.dashboard.getCurrentMetrics();
  }

  /**
   * 前週のメトリクスを取得
   */
  private getPreviousMetrics(): any {
    if (this.previousReports.length === 0) {
      return null;
    }
    return this.previousReports[this.previousReports.length - 1].metrics;
  }

  /**
   * カバレッジ分析
   */
  private analyzeCoverage(current: any, previous: any): WeeklyReport['metrics']['coverage'] {
    const currentAvg = current ? 
      (current.coverage.lines + current.coverage.statements + 
       current.coverage.functions + current.coverage.branches) / 4 : 0;
    
    const previousAvg = previous ? 
      (previous.coverage.current || 0) : 0;
    
    const change = currentAvg - previousAvg;
    const target = 95;
    
    let status: 'achieved' | 'improving' | 'declining' | 'stagnant';
    if (currentAvg >= target) {
      status = 'achieved';
    } else if (change > 1) {
      status = 'improving';
    } else if (change < -1) {
      status = 'declining';
    } else {
      status = 'stagnant';
    }
    
    return {
      current: currentAvg,
      previous: previousAvg,
      change,
      target,
      status
    };
  }

  /**
   * 型定義の健全性分析
   */
  private async analyzeTypeHealth(): Promise<WeeklyReport['metrics']['typeHealth']> {
    const checker = new TypeConsistencyChecker();
    await checker.collectTypeDefinitions('src');
    const conflicts = checker.detectConflicts();
    
    // 前週との比較
    const previousConflicts = this.previousReports.length > 0 ?
      this.previousReports[this.previousReports.length - 1].metrics.typeHealth.conflicts : 0;
    
    return {
      conflicts: conflicts.length,
      resolved: Math.max(0, previousConflicts - conflicts.length),
      new: Math.max(0, conflicts.length - previousConflicts),
      consistency: conflicts.length === 0 ? 100 : 
        Math.max(0, 100 - (conflicts.length * 2))
    };
  }

  /**
   * テストの健全性分析
   */
  private analyzeTestHealth(current: any): WeeklyReport['metrics']['testHealth'] {
    const testStatus = current?.testStatus || {
      total: 0,
      passed: 0,
      failed: 0,
      flaky: []
    };
    
    const previousTests = this.previousReports.length > 0 ?
      this.previousReports[this.previousReports.length - 1].metrics.testHealth.totalTests : 0;
    
    return {
      totalTests: testStatus.total,
      newTests: Math.max(0, testStatus.total - previousTests),
      failureRate: testStatus.total > 0 ? 
        (testStatus.failed / testStatus.total) * 100 : 0,
      flakyTests: testStatus.flaky || []
    };
  }

  /**
   * コード品質分析
   */
  private analyzeCodeQuality(current: any, previous: any): WeeklyReport['metrics']['codeQuality'] {
    const currentQuality = current?.codeQuality || {
      complexity: { average: 0 },
      duplication: { percentage: 0 },
      maintainability: 100
    };
    
    const currentDebt = current?.technicalDebt || {
      score: 100,
      issues: { critical: 0, high: 0, medium: 0, low: 0 }
    };
    
    const previousComplexity = previous?.codeQuality?.complexity?.average || 0;
    const previousDebt = previous?.codeQuality?.technicalDebt?.score || 100;
    
    let complexityTrend: 'improving' | 'worsening' | 'stable';
    if (currentQuality.complexity.average < previousComplexity - 0.5) {
      complexityTrend = 'improving';
    } else if (currentQuality.complexity.average > previousComplexity + 0.5) {
      complexityTrend = 'worsening';
    } else {
      complexityTrend = 'stable';
    }
    
    return {
      complexity: {
        average: currentQuality.complexity.average,
        trend: complexityTrend
      },
      duplication: currentQuality.duplication.percentage || 0,
      technicalDebt: {
        score: currentDebt.score,
        added: Math.max(0, previousDebt - currentDebt.score),
        resolved: Math.max(0, currentDebt.score - previousDebt)
      }
    };
  }

  /**
   * チームメトリクスを収集
   */
  private collectTeamMetrics(start: Date, end: Date): WeeklyReport['teamMetrics'] {
    try {
      // Git統計を収集
      const since = start.toISOString().split('T')[0];
      const until = end.toISOString().split('T')[0];
      
      // コミット数
      const commitCount = execSync(
        `git log --since="${since}" --until="${until}" --oneline | wc -l`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim();
      
      // コントリビューター
      const contributors = execSync(
        `git log --since="${since}" --until="${until}" --format="%an" | sort -u`,
        { encoding: 'utf-8', stdio: 'pipe' }
      ).trim().split('\n').filter(Boolean);
      
      // PRの数（GitHubの場合）
      let prCount = 0;
      try {
        const prOutput = execSync(
          `gh pr list --state all --search "created:${since}..${until}" --json number | jq length`,
          { encoding: 'utf-8', stdio: 'pipe' }
        ).trim();
        prCount = parseInt(prOutput) || 0;
      } catch {
        // GitHub CLIが利用できない場合はスキップ
      }
      
      // 生産性スコア（簡易計算）
      const productivity = Math.min(100, 
        (parseInt(commitCount) * 10) + 
        (contributors.length * 20) + 
        (prCount * 5)
      );
      
      return {
        commits: parseInt(commitCount),
        pullRequests: prCount,
        contributors,
        productivity
      };
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 成果を特定
   */
  private identifyAchievements(report: WeeklyReport): void {
    const achievements: string[] = [];
    
    // カバレッジ目標達成
    if (report.metrics.coverage.status === 'achieved') {
      achievements.push(`✅ テストカバレッジ目標（${report.metrics.coverage.target}%）を達成`);
    } else if (report.metrics.coverage.change > 5) {
      achievements.push(`📈 テストカバレッジが${report.metrics.coverage.change.toFixed(1)}%向上`);
    }
    
    // 型定義の改善
    if (report.metrics.typeHealth.resolved > 0) {
      achievements.push(`🔧 ${report.metrics.typeHealth.resolved}件の型定義競合を解決`);
    }
    
    // 新規テスト追加
    if (report.metrics.testHealth.newTests > 10) {
      achievements.push(`🎯 ${report.metrics.testHealth.newTests}件の新規テストを追加`);
    }
    
    // 技術的負債の削減
    if (report.metrics.codeQuality.technicalDebt.resolved > 5) {
      achievements.push(`💰 技術的負債スコアが${report.metrics.codeQuality.technicalDebt.resolved}ポイント改善`);
    }
    
    // 複雑度の改善
    if (report.metrics.codeQuality.complexity.trend === 'improving') {
      achievements.push(`⚡ コードの複雑度が改善傾向`);
    }
    
    // チーム生産性
    if (report.teamMetrics && report.teamMetrics.productivity > 80) {
      achievements.push(`🚀 高い開発生産性（${report.teamMetrics.productivity}%）を維持`);
    }
    
    report.achievements = achievements;
  }

  /**
   * 懸念事項を特定
   */
  private identifyConcerns(report: WeeklyReport): void {
    const concerns: string[] = [];
    
    // カバレッジの低下
    if (report.metrics.coverage.status === 'declining') {
      concerns.push(`⚠️ テストカバレッジが${Math.abs(report.metrics.coverage.change).toFixed(1)}%低下`);
    } else if (report.metrics.coverage.status === 'stagnant' && 
               report.metrics.coverage.current < report.metrics.coverage.target) {
      concerns.push(`⚠️ テストカバレッジが目標値を下回っている（現在: ${report.metrics.coverage.current.toFixed(1)}%）`);
    }
    
    // 型定義の競合増加
    if (report.metrics.typeHealth.new > 0) {
      concerns.push(`❌ ${report.metrics.typeHealth.new}件の新たな型定義競合が発生`);
    }
    
    // テスト失敗率
    if (report.metrics.testHealth.failureRate > 5) {
      concerns.push(`❌ テスト失敗率が高い（${report.metrics.testHealth.failureRate.toFixed(1)}%）`);
    }
    
    // 不安定なテスト
    if (report.metrics.testHealth.flakyTests.length > 0) {
      concerns.push(`⚠️ ${report.metrics.testHealth.flakyTests.length}件の不安定なテストが存在`);
    }
    
    // 複雑度の悪化
    if (report.metrics.codeQuality.complexity.trend === 'worsening') {
      concerns.push(`📊 コードの複雑度が悪化傾向`);
    }
    
    // 重複コード
    if (report.metrics.codeQuality.duplication > 5) {
      concerns.push(`📋 コードの重複率が高い（${report.metrics.codeQuality.duplication.toFixed(1)}%）`);
    }
    
    // 技術的負債の増加
    if (report.metrics.codeQuality.technicalDebt.added > 5) {
      concerns.push(`💸 技術的負債が${report.metrics.codeQuality.technicalDebt.added}ポイント増加`);
    }
    
    report.concerns = concerns;
  }

  /**
   * 改善提案を生成
   */
  private generateRecommendations(report: WeeklyReport): CoreTypes.Improvement[] {
    const recommendations: CoreTypes.Improvement[] = [];
    let idCounter = 1;

    // カバレッジ改善
    if (report.metrics.coverage.current < report.metrics.coverage.target) {
      const gap = report.metrics.coverage.target - report.metrics.coverage.current;
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'test',
        priority: gap > 10 ? 'critical' : 'high',
        title: 'テストカバレッジの向上',
        description: `現在のカバレッジ（${report.metrics.coverage.current.toFixed(1)}%）を目標値（${report.metrics.coverage.target}%）まで向上させる`,
        category: 'testing',
        estimatedTime: `${Math.ceil(gap * 2)}h`,
        effort: gap > 20 ? 'high' : 'medium',
        autoFixable: false
      });
    }

    // 型定義の競合解決
    if (report.metrics.typeHealth.conflicts > 0) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'refactor',
        priority: report.metrics.typeHealth.conflicts > 50 ? 'critical' : 'high',
        title: '型定義の競合解決',
        description: `${report.metrics.typeHealth.conflicts}件の型定義競合を解決し、CoreTypesに統一する`,
        category: 'maintainability',
        suggestedCode: 'npm run migrate-types -- --execute',
        estimatedTime: `${Math.ceil(report.metrics.typeHealth.conflicts / 10)}h`,
        effort: 'medium',
        autoFixable: true
      });
    }

    // 不安定なテストの修正
    if (report.metrics.testHealth.flakyTests.length > 0) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'fix',
        priority: 'high',
        title: '不安定なテストの修正',
        description: `${report.metrics.testHealth.flakyTests.length}件の不安定なテストを安定化させる`,
        category: 'reliability',
        estimatedTime: `${report.metrics.testHealth.flakyTests.length * 30}m`,
        effort: 'medium',
        autoFixable: false
      });
    }

    // 複雑度の削減
    if (report.metrics.codeQuality.complexity.average > 15) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'refactor',
        priority: 'medium',
        title: 'コード複雑度の削減',
        description: `平均複雑度（${report.metrics.codeQuality.complexity.average.toFixed(1)}）を10以下に削減する`,
        category: 'maintainability',
        estimatedTime: '4h',
        effort: 'high',
        autoFixable: false
      });
    }

    // 重複コードの削除
    if (report.metrics.codeQuality.duplication > 3) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'refactor',
        priority: 'low',
        title: '重複コードの削除',
        description: `コードの重複率（${report.metrics.codeQuality.duplication.toFixed(1)}%）を3%以下に削減する`,
        category: 'maintainability',
        estimatedTime: '2h',
        effort: 'low',
        autoFixable: false
      });
    }

    // TDD実践の推奨
    if (report.metrics.testHealth.newTests < 5 && report.teamMetrics && report.teamMetrics.commits > 10) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'enhancement',
        priority: 'medium',
        title: 'TDD実践の強化',
        description: '新機能開発時にテスト駆動開発を徹底し、テストカバレッジを維持する',
        category: 'testing',
        estimatedTime: 'ongoing',
        effort: 'medium',
        autoFixable: false
      });
    }

    return recommendations;
  }

  /**
   * 週番号を取得
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * レポートを保存
   */
  private async saveReport(report: WeeklyReport): Promise<void> {
    const reportDir = path.join(process.cwd(), this.reportPath);
    fs.mkdirSync(reportDir, { recursive: true });
    
    const weekNumber = report.period.weekNumber.toString().padStart(2, '0');
    const year = report.period.end.getFullYear();
    
    // JSON形式で保存
    const jsonPath = path.join(reportDir, `${year}-week${weekNumber}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    // Markdown形式で保存
    const mdPath = path.join(reportDir, `${year}-week${weekNumber}.md`);
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(mdPath, markdown);
    
    // HTML形式で保存
    const htmlPath = path.join(reportDir, `${year}-week${weekNumber}.html`);
    const html = this.generateHtmlReport(report);
    fs.writeFileSync(htmlPath, html);
    
    console.log(`📊 Weekly report saved:`);
    console.log(`   - JSON: ${jsonPath}`);
    console.log(`   - Markdown: ${mdPath}`);
    console.log(`   - HTML: ${htmlPath}`);
  }

  /**
   * Markdownレポートを生成
   */
  private generateMarkdownReport(report: WeeklyReport): string {
    const lines: string[] = [
      `# 週次品質レポート - Week ${report.period.weekNumber}`,
      '',
      `期間: ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}`,
      '',
      '## 📈 主要メトリクス',
      '',
      '### テストカバレッジ',
      `- 現在: ${report.metrics.coverage.current.toFixed(1)}%`,
      `- 前週: ${report.metrics.coverage.previous.toFixed(1)}%`,
      `- 変化: ${report.metrics.coverage.change > 0 ? '+' : ''}${report.metrics.coverage.change.toFixed(1)}%`,
      `- 状態: ${this.getStatusEmoji(report.metrics.coverage.status)} ${report.metrics.coverage.status}`,
      '',
      '### 型定義の健全性',
      `- 競合: ${report.metrics.typeHealth.conflicts}件`,
      `- 解決済み: ${report.metrics.typeHealth.resolved}件`,
      `- 新規: ${report.metrics.typeHealth.new}件`,
      `- 一貫性: ${report.metrics.typeHealth.consistency.toFixed(1)}%`,
      '',
      '### テストの状態',
      `- 総テスト数: ${report.metrics.testHealth.totalTests}`,
      `- 新規テスト: ${report.metrics.testHealth.newTests}`,
      `- 失敗率: ${report.metrics.testHealth.failureRate.toFixed(1)}%`,
    ];

    if (report.metrics.testHealth.flakyTests.length > 0) {
      lines.push(`- 不安定なテスト: ${report.metrics.testHealth.flakyTests.join(', ')}`);
    }

    lines.push(
      '',
      '### コード品質',
      `- 平均複雑度: ${report.metrics.codeQuality.complexity.average.toFixed(1)} (${report.metrics.codeQuality.complexity.trend})`,
      `- 重複率: ${report.metrics.codeQuality.duplication.toFixed(1)}%`,
      `- 技術的負債スコア: ${report.metrics.codeQuality.technicalDebt.score}/100`,
      ''
    );

    if (report.teamMetrics) {
      lines.push(
        '### チーム活動',
        `- コミット数: ${report.teamMetrics.commits}`,
        `- PR数: ${report.teamMetrics.pullRequests}`,
        `- 貢献者: ${report.teamMetrics.contributors.join(', ')}`,
        `- 生産性: ${report.teamMetrics.productivity}%`,
        ''
      );
    }

    if (report.achievements.length > 0) {
      lines.push(
        '## 🎉 今週の成果',
        '',
        ...report.achievements.map(a => `- ${a}`),
        ''
      );
    }

    if (report.concerns.length > 0) {
      lines.push(
        '## ⚠️ 注意事項',
        '',
        ...report.concerns.map(c => `- ${c}`),
        ''
      );
    }

    if (report.recommendations.length > 0) {
      lines.push(
        '## 💡 改善提案',
        ''
      );

      for (const rec of report.recommendations) {
        lines.push(
          `### ${rec.title}`,
          `- 優先度: ${rec.priority}`,
          `- タイプ: ${rec.type}`,
          `- 説明: ${rec.description}`,
          `- 見積時間: ${rec.estimatedTime}`,
          ''
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * HTMLレポートを生成
   */
  private generateHtmlReport(report: WeeklyReport): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>週次品質レポート - Week ${report.period.weekNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .period {
      color: #666;
      margin-bottom: 30px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    .metric-card h3 {
      margin-top: 0;
      color: #4b5563;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      color: #1f2937;
    }
    .metric-change {
      color: #6b7280;
      font-size: 0.9em;
    }
    .metric-change.positive { color: #10b981; }
    .metric-change.negative { color: #ef4444; }
    .achievements {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .concerns {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .recommendations {
      background: #fefce8;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>週次品質レポート - Week ${report.period.weekNumber}</h1>
    <div class="period">
      ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>テストカバレッジ</h3>
        <div class="metric-value">${report.metrics.coverage.current.toFixed(1)}%</div>
        <div class="metric-change ${report.metrics.coverage.change >= 0 ? 'positive' : 'negative'}">
          ${report.metrics.coverage.change > 0 ? '↑' : '↓'} ${Math.abs(report.metrics.coverage.change).toFixed(1)}%
        </div>
      </div>

      <div class="metric-card">
        <h3>型定義の健全性</h3>
        <div class="metric-value">${report.metrics.typeHealth.consistency.toFixed(1)}%</div>
        <div class="metric-change">
          競合: ${report.metrics.typeHealth.conflicts}件
        </div>
      </div>

      <div class="metric-card">
        <h3>テスト状態</h3>
        <div class="metric-value">${report.metrics.testHealth.totalTests}</div>
        <div class="metric-change">
          新規: +${report.metrics.testHealth.newTests}
        </div>
      </div>

      <div class="metric-card">
        <h3>技術的負債</h3>
        <div class="metric-value">${report.metrics.codeQuality.technicalDebt.score}/100</div>
        <div class="metric-change ${report.metrics.codeQuality.technicalDebt.resolved > 0 ? 'positive' : ''}">
          ${report.metrics.codeQuality.technicalDebt.resolved > 0 ? '改善' : ''}
        </div>
      </div>
    </div>

    ${report.achievements.length > 0 ? `
    <div class="achievements">
      <h2>🎉 今週の成果</h2>
      <ul>
        ${report.achievements.map(a => `<li>${a}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${report.concerns.length > 0 ? `
    <div class="concerns">
      <h2>⚠️ 注意事項</h2>
      <ul>
        ${report.concerns.map(c => `<li>${c}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
      <h2>💡 改善提案</h2>
      <ul>
        ${report.recommendations.map(r => `
          <li>
            <strong>${r.title}</strong> (優先度: ${r.priority})
            <br>
            ${r.description}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
  }

  /**
   * ステータス絵文字を取得
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'achieved': return '✅';
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stagnant': return '➡️';
      default: return '';
    }
  }

  /**
   * 比較レポートを生成
   */
  async generateComparisonReport(weeks: number = 4): Promise<string> {
    const reports = this.previousReports.slice(-weeks);
    
    if (reports.length === 0) {
      return 'No previous reports available for comparison';
    }

    const lines: string[] = [
      `# ${weeks}週間の品質トレンド`,
      '',
      '## カバレッジ推移',
      ''
    ];

    for (const report of reports) {
      lines.push(
        `Week ${report.period.weekNumber}: ${report.metrics.coverage.current.toFixed(1)}%`
      );
    }

    // TODO: グラフ生成などの実装

    return lines.join('\n');
  }
}

/**
 * CLI実行
 */
if (require.main === module) {
  (async () => {
    const reporter = new WeeklyQualityReporter();
    
    console.log('📊 Starting weekly quality report generation...\n');
    
    const report = await reporter.generateWeeklyReport();
    
    console.log('\n✅ Report generated successfully!\n');
    
    // サマリー表示
    console.log('Summary:');
    console.log(`- Coverage: ${report.metrics.coverage.current.toFixed(1)}% (${report.metrics.coverage.status})`);
    console.log(`- Type Health: ${report.metrics.typeHealth.consistency.toFixed(1)}%`);
    console.log(`- Tests: ${report.metrics.testHealth.totalTests} total, ${report.metrics.testHealth.newTests} new`);
    console.log(`- Technical Debt: ${report.metrics.codeQuality.technicalDebt.score}/100`);
    
    if (report.achievements.length > 0) {
      console.log('\nAchievements:');
      report.achievements.forEach(a => console.log(`  ${a}`));
    }
    
    if (report.concerns.length > 0) {
      console.log('\nConcerns:');
      report.concerns.forEach(c => console.log(`  ${c}`));
    }
    
    if (report.recommendations.length > 0) {
      console.log('\nTop Recommendations:');
      report.recommendations.slice(0, 3).forEach(r => {
        console.log(`  - ${r.title} (${r.priority})`);
      });
    }
  })();
}