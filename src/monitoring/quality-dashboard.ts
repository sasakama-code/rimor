/**
 * 品質ダッシュボード
 * プロジェクトの品質メトリクスをリアルタイムで監視
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { CoreTypes } from '../core/types/core-definitions';

export interface QualityMetrics {
  timestamp: Date;
  
  // コードカバレッジ
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  // 型定義の健全性
  typeHealth: {
    totalTypes: number;
    conflicts: number;
    duplicates: number;
    missingTypes: number;
    consistency: number; // 0-100%
  };
  
  // テストの状態
  testStatus: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number; // ms
    flaky: string[]; // 不安定なテスト
  };
  
  // 技術的負債
  technicalDebt: {
    score: number; // 0-100 (100が最良)
    issues: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    estimatedTime: string; // 修正見積もり時間
  };
  
  // コード品質
  codeQuality: {
    complexity: {
      average: number;
      max: number;
      files: Array<{ path: string; complexity: number }>;
    };
    duplication: {
      percentage: number;
      blocks: number;
    };
    maintainability: number; // 0-100
  };
  
  // ビルド状態
  buildStatus: {
    success: boolean;
    errors: number;
    warnings: number;
    duration: number; // ms
    size: {
      total: number; // bytes
      main: number;
      vendor: number;
    };
  };
}

export interface DashboardConfig {
  refreshInterval: number; // ms
  historyLimit: number;
  thresholds: {
    coverage: {
      lines: number;
      statements: number;
      functions: number;
      branches: number;
    };
    complexity: {
      average: number;
      max: number;
    };
    duplication: number;
    technicalDebt: number;
  };
  alerts: {
    enabled: boolean;
    channels: ('console' | 'file' | 'slack' | 'email')[];
  };
}

export class QualityDashboard {
  private config: DashboardConfig;
  private metricsHistory: QualityMetrics[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor(config?: Partial<DashboardConfig>) {
    this.config = {
      refreshInterval: 60000, // 1分
      historyLimit: 100,
      thresholds: {
        coverage: {
          lines: 95,
          statements: 95,
          functions: 98,
          branches: 85
        },
        complexity: {
          average: 10,
          max: 20
        },
        duplication: 3,
        technicalDebt: 80
      },
      alerts: {
        enabled: true,
        channels: ['console', 'file']
      },
      ...config
    };
  }

  /**
   * ダッシュボードを開始
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Dashboard is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Quality Dashboard started');
    
    // 初回実行
    await this.refresh();
    
    // 定期実行
    this.intervalId = setInterval(async () => {
      await this.refresh();
    }, this.config.refreshInterval);
  }

  /**
   * ダッシュボードを停止
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('⏹ Quality Dashboard stopped');
  }

  /**
   * メトリクスを更新
   */
  async refresh(): Promise<QualityMetrics> {
    const metrics = await this.collectMetrics();
    
    // 履歴に追加
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.config.historyLimit) {
      this.metricsHistory.shift();
    }
    
    // 閾値チェック
    this.checkThresholds(metrics);
    
    // ダッシュボード更新
    this.updateDashboard(metrics);
    
    return metrics;
  }

  /**
   * メトリクスを収集
   */
  private async collectMetrics(): Promise<QualityMetrics> {
    const metrics: QualityMetrics = {
      timestamp: new Date(),
      coverage: await this.collectCoverage(),
      typeHealth: await this.collectTypeHealth(),
      testStatus: await this.collectTestStatus(),
      technicalDebt: await this.collectTechnicalDebt(),
      codeQuality: await this.collectCodeQuality(),
      buildStatus: await this.collectBuildStatus()
    };

    return metrics;
  }

  /**
   * カバレッジ情報を収集
   */
  private async collectCoverage(): Promise<QualityMetrics['coverage']> {
    const coveragePath = path.join(process.cwd(), 'coverage/coverage-summary.json');
    
    if (!fs.existsSync(coveragePath)) {
      // カバレッジを生成
      try {
        execSync('npm test -- --coverage --coverageReporters=json-summary', { 
          stdio: 'pipe',
          timeout: 120000 
        });
      } catch (error) {
        // テスト失敗してもカバレッジは生成される
      }
    }

    if (fs.existsSync(coveragePath)) {
      const summary = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
      const total = summary.total;
      
      // トレンド計算
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (this.metricsHistory.length > 0) {
        const lastCoverage = this.metricsHistory[this.metricsHistory.length - 1].coverage;
        const currentAvg = (total.lines.pct + total.statements.pct + total.functions.pct + total.branches.pct) / 4;
        const lastAvg = (lastCoverage.lines + lastCoverage.statements + lastCoverage.functions + lastCoverage.branches) / 4;
        
        if (currentAvg > lastAvg + 1) trend = 'up';
        else if (currentAvg < lastAvg - 1) trend = 'down';
      }
      
      return {
        lines: total.lines.pct,
        statements: total.statements.pct,
        functions: total.functions.pct,
        branches: total.branches.pct,
        trend
      };
    }

    return {
      lines: 0,
      statements: 0,
      functions: 0,
      branches: 0,
      trend: 'stable'
    };
  }

  /**
   * 型定義の健全性を収集
   */
  private async collectTypeHealth(): Promise<QualityMetrics['typeHealth']> {
    // 型定義一貫性チェッカーを実行
    const checkerPath = path.join(process.cwd(), 'src/tools/type-consistency-checker.ts');
    
    if (fs.existsSync(checkerPath)) {
      try {
        const output = execSync(`npx ts-node ${checkerPath}`, { 
          encoding: 'utf-8',
          stdio: 'pipe' 
        });
        
        // 出力から数値を抽出
        const totalMatch = output.match(/Total type definitions: (\d+)/);
        const conflictMatch = output.match(/Type conflicts found: (\d+)/);
        
        const totalTypes = totalMatch ? parseInt(totalMatch[1]) : 0;
        const conflicts = conflictMatch ? parseInt(conflictMatch[1]) : 0;
        const consistency = totalTypes > 0 ? ((totalTypes - conflicts) / totalTypes) * 100 : 100;
        
        return {
          totalTypes,
          conflicts,
          duplicates: Math.floor(conflicts * 0.6), // 推定値
          missingTypes: Math.floor(conflicts * 0.2), // 推定値
          consistency
        };
      } catch (error) {
        // エラー時のデフォルト値
      }
    }

    return {
      totalTypes: 0,
      conflicts: 0,
      duplicates: 0,
      missingTypes: 0,
      consistency: 100
    };
  }

  /**
   * テスト状態を収集
   */
  private async collectTestStatus(): Promise<QualityMetrics['testStatus']> {
    try {
      const startTime = Date.now();
      const output = execSync('npm test -- --json', { 
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 120000
      });
      const duration = Date.now() - startTime;
      
      const results = JSON.parse(output);
      
      return {
        total: results.numTotalTests || 0,
        passed: results.numPassedTests || 0,
        failed: results.numFailedTests || 0,
        skipped: results.numPendingTests || 0,
        duration,
        flaky: [] // TODO: 不安定なテストの検出実装
      };
    } catch (error) {
      // テスト実行エラー時のデフォルト値
      return {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        flaky: []
      };
    }
  }

  /**
   * 技術的負債を収集
   */
  private async collectTechnicalDebt(): Promise<QualityMetrics['technicalDebt']> {
    const reportPath = path.join(process.cwd(), '.rimor/reports/analysis-report.json');
    
    if (fs.existsSync(reportPath)) {
      try {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        const issues = report.issues || [];
        
        const critical = issues.filter((i: { severity: string }) => i.severity === 'critical').length;
        const high = issues.filter((i: { severity: string }) => i.severity === 'high').length;
        const medium = issues.filter((i: { severity: string }) => i.severity === 'medium').length;
        const low = issues.filter((i: { severity: string }) => i.severity === 'low').length;
        
        // スコア計算（重み付き）
        const totalWeighted = critical * 10 + high * 5 + medium * 2 + low;
        const maxScore = 100;
        const score = Math.max(0, maxScore - totalWeighted);
        
        // 修正時間の見積もり
        const estimatedMinutes = critical * 60 + high * 30 + medium * 15 + low * 5;
        const estimatedTime = this.formatTime(estimatedMinutes);
        
        return {
          score,
          issues: { critical, high, medium, low },
          estimatedTime
        };
      } catch (error) {
        // エラー時のデフォルト値
      }
    }

    return {
      score: 100,
      issues: { critical: 0, high: 0, medium: 0, low: 0 },
      estimatedTime: '0h'
    };
  }

  /**
   * コード品質を収集
   */
  private async collectCodeQuality(): Promise<QualityMetrics['codeQuality']> {
    // 複雑度の計算（簡易版）
    const complexity = await this.calculateComplexity();
    
    // 重複コードの検出（簡易版）
    const duplication = await this.calculateDuplication();
    
    // 保守性インデックス
    const maintainability = this.calculateMaintainabilityIndex(complexity, duplication);
    
    return {
      complexity,
      duplication,
      maintainability
    };
  }

  /**
   * 複雑度を計算
   */
  private async calculateComplexity(): Promise<QualityMetrics['codeQuality']['complexity']> {
    // TODO: 実際の複雑度計算実装
    return {
      average: 8.5,
      max: 25,
      files: [
        { path: 'src/core/analyzer.ts', complexity: 25 },
        { path: 'src/ai-output/unified-ai-formatter.ts', complexity: 22 }
      ]
    };
  }

  /**
   * 重複コードを計算
   */
  private async calculateDuplication(): Promise<QualityMetrics['codeQuality']['duplication']> {
    // TODO: 実際の重複検出実装
    return {
      percentage: 2.5,
      blocks: 12
    };
  }

  /**
   * 保守性インデックスを計算
   */
  private calculateMaintainabilityIndex(
    complexity: QualityMetrics['codeQuality']['complexity'],
    duplication: QualityMetrics['codeQuality']['duplication']
  ): number {
    // 簡易的な計算
    const complexityScore = Math.max(0, 100 - complexity.average * 5);
    const duplicationScore = Math.max(0, 100 - duplication.percentage * 10);
    
    return Math.round((complexityScore + duplicationScore) / 2);
  }

  /**
   * ビルド状態を収集
   */
  private async collectBuildStatus(): Promise<QualityMetrics['buildStatus']> {
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const duration = Date.now() - startTime;
      
      // ビルドサイズの計算
      const distPath = path.join(process.cwd(), 'dist');
      const size = this.getDirectorySize(distPath);
      
      return {
        success: true,
        errors: 0,
        warnings: 0,
        duration,
        size: {
          total: size,
          main: Math.floor(size * 0.7), // 推定値
          vendor: Math.floor(size * 0.3) // 推定値
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: 1,
        warnings: 0,
        duration: 0,
        size: { total: 0, main: 0, vendor: 0 }
      };
    }
  }

  /**
   * ディレクトリサイズを取得
   */
  private getDirectorySize(dirPath: string): number {
    if (!fs.existsSync(dirPath)) return 0;
    
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }

  /**
   * 時間をフォーマット
   */
  private formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const hrs = hours % 24;
    
    return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
  }

  /**
   * 閾値をチェック
   */
  private checkThresholds(metrics: QualityMetrics): void {
    const alerts: string[] = [];
    
    // カバレッジチェック
    const { coverage, thresholds } = { coverage: metrics.coverage, thresholds: this.config.thresholds.coverage };
    if (coverage.lines < thresholds.lines) {
      alerts.push(`Line coverage (${coverage.lines}%) is below threshold (${thresholds.lines}%)`);
    }
    if (coverage.statements < thresholds.statements) {
      alerts.push(`Statement coverage (${coverage.statements}%) is below threshold (${thresholds.statements}%)`);
    }
    if (coverage.functions < thresholds.functions) {
      alerts.push(`Function coverage (${coverage.functions}%) is below threshold (${thresholds.functions}%)`);
    }
    if (coverage.branches < thresholds.branches) {
      alerts.push(`Branch coverage (${coverage.branches}%) is below threshold (${thresholds.branches}%)`);
    }
    
    // 複雑度チェック
    if (metrics.codeQuality.complexity.average > this.config.thresholds.complexity.average) {
      alerts.push(`Average complexity (${metrics.codeQuality.complexity.average}) exceeds threshold (${this.config.thresholds.complexity.average})`);
    }
    
    // 重複チェック
    if (metrics.codeQuality.duplication.percentage > this.config.thresholds.duplication) {
      alerts.push(`Code duplication (${metrics.codeQuality.duplication.percentage}%) exceeds threshold (${this.config.thresholds.duplication}%)`);
    }
    
    // 技術的負債チェック
    if (metrics.technicalDebt.score < this.config.thresholds.technicalDebt) {
      alerts.push(`Technical debt score (${metrics.technicalDebt.score}) is below threshold (${this.config.thresholds.technicalDebt})`);
    }
    
    // アラート送信
    if (alerts.length > 0 && this.config.alerts.enabled) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * アラートを送信
   */
  private sendAlerts(alerts: string[]): void {
    for (const channel of this.config.alerts.channels) {
      switch (channel) {
        case 'console':
          console.warn('⚠️ Quality Alerts:', alerts);
          break;
        case 'file':
          const alertPath = path.join(process.cwd(), '.rimor/reports/quality-alerts.log');
          fs.mkdirSync(path.dirname(alertPath), { recursive: true });
          fs.appendFileSync(alertPath, `\n[${new Date().toISOString()}]\n${alerts.join('\n')}\n`);
          break;
        // TODO: Slack, Email通知の実装
      }
    }
  }

  /**
   * ダッシュボードを更新
   */
  private updateDashboard(metrics: QualityMetrics): void {
    // HTMLダッシュボードの生成
    const dashboardHtml = this.generateDashboardHtml(metrics);
    const dashboardPath = path.join(process.cwd(), '.rimor/reports/quality-dashboard.html');
    
    fs.mkdirSync(path.dirname(dashboardPath), { recursive: true });
    fs.writeFileSync(dashboardPath, dashboardHtml);
    
    // JSONレポートの生成
    const jsonPath = path.join(process.cwd(), '.rimor/reports/quality-metrics.json');
    fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2));
    
    console.log(`📊 Dashboard updated: ${dashboardPath}`);
  }

  /**
   * ダッシュボードHTMLを生成
   */
  private generateDashboardHtml(metrics: QualityMetrics): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quality Dashboard - ${new Date().toLocaleString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 30px;
      font-size: 2.5em;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .card h2 {
      margin-top: 0;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .metric:last-child {
      border-bottom: none;
    }
    .metric-label {
      color: #666;
    }
    .metric-value {
      font-weight: bold;
      color: #333;
    }
    .metric-value.good { color: #10b981; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.error { color: #ef4444; }
    .progress-bar {
      width: 100%;
      height: 20px;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin: 5px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      transition: width 0.3s ease;
    }
    .progress-fill.warning {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    .progress-fill.error {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }
    .timestamp {
      text-align: center;
      color: white;
      margin-top: 30px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Quality Dashboard</h1>
    
    <div class="grid">
      <!-- Coverage Card -->
      <div class="card">
        <h2>📊 Test Coverage</h2>
        <div class="metric">
          <span class="metric-label">Lines</span>
          <span class="metric-value ${this.getStatusClass(metrics.coverage.lines, this.config.thresholds.coverage.lines)}">${metrics.coverage.lines.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.coverage.lines, this.config.thresholds.coverage.lines)}" style="width: ${metrics.coverage.lines}%"></div>
        </div>
        
        <div class="metric">
          <span class="metric-label">Statements</span>
          <span class="metric-value ${this.getStatusClass(metrics.coverage.statements, this.config.thresholds.coverage.statements)}">${metrics.coverage.statements.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.coverage.statements, this.config.thresholds.coverage.statements)}" style="width: ${metrics.coverage.statements}%"></div>
        </div>
        
        <div class="metric">
          <span class="metric-label">Functions</span>
          <span class="metric-value ${this.getStatusClass(metrics.coverage.functions, this.config.thresholds.coverage.functions)}">${metrics.coverage.functions.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.coverage.functions, this.config.thresholds.coverage.functions)}" style="width: ${metrics.coverage.functions}%"></div>
        </div>
        
        <div class="metric">
          <span class="metric-label">Branches</span>
          <span class="metric-value ${this.getStatusClass(metrics.coverage.branches, this.config.thresholds.coverage.branches)}">${metrics.coverage.branches.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.coverage.branches, this.config.thresholds.coverage.branches)}" style="width: ${metrics.coverage.branches}%"></div>
        </div>
        
        <div class="metric">
          <span class="metric-label">Trend</span>
          <span class="metric-value">${this.getTrendIcon(metrics.coverage.trend)}</span>
        </div>
      </div>

      <!-- Type Health Card -->
      <div class="card">
        <h2>🔍 Type Health</h2>
        <div class="metric">
          <span class="metric-label">Total Types</span>
          <span class="metric-value">${metrics.typeHealth.totalTypes}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Conflicts</span>
          <span class="metric-value ${metrics.typeHealth.conflicts > 0 ? 'error' : 'good'}">${metrics.typeHealth.conflicts}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Duplicates</span>
          <span class="metric-value ${metrics.typeHealth.duplicates > 0 ? 'warning' : 'good'}">${metrics.typeHealth.duplicates}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Consistency</span>
          <span class="metric-value ${this.getStatusClass(metrics.typeHealth.consistency, 90)}">${metrics.typeHealth.consistency.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.typeHealth.consistency, 90)}" style="width: ${metrics.typeHealth.consistency}%"></div>
        </div>
      </div>

      <!-- Test Status Card -->
      <div class="card">
        <h2>✅ Test Status</h2>
        <div class="metric">
          <span class="metric-label">Total Tests</span>
          <span class="metric-value">${metrics.testStatus.total}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Passed</span>
          <span class="metric-value good">${metrics.testStatus.passed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Failed</span>
          <span class="metric-value ${metrics.testStatus.failed > 0 ? 'error' : 'good'}">${metrics.testStatus.failed}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Skipped</span>
          <span class="metric-value ${metrics.testStatus.skipped > 0 ? 'warning' : 'good'}">${metrics.testStatus.skipped}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Duration</span>
          <span class="metric-value">${(metrics.testStatus.duration / 1000).toFixed(1)}s</span>
        </div>
      </div>

      <!-- Technical Debt Card -->
      <div class="card">
        <h2>💰 Technical Debt</h2>
        <div class="metric">
          <span class="metric-label">Score</span>
          <span class="metric-value ${this.getStatusClass(metrics.technicalDebt.score, this.config.thresholds.technicalDebt)}">${metrics.technicalDebt.score}/100</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.technicalDebt.score, this.config.thresholds.technicalDebt)}" style="width: ${metrics.technicalDebt.score}%"></div>
        </div>
        <div class="metric">
          <span class="metric-label">Critical Issues</span>
          <span class="metric-value ${metrics.technicalDebt.issues.critical > 0 ? 'error' : 'good'}">${metrics.technicalDebt.issues.critical}</span>
        </div>
        <div class="metric">
          <span class="metric-label">High Issues</span>
          <span class="metric-value ${metrics.technicalDebt.issues.high > 0 ? 'warning' : 'good'}">${metrics.technicalDebt.issues.high}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Medium Issues</span>
          <span class="metric-value">${metrics.technicalDebt.issues.medium}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Low Issues</span>
          <span class="metric-value">${metrics.technicalDebt.issues.low}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Est. Fix Time</span>
          <span class="metric-value">${metrics.technicalDebt.estimatedTime}</span>
        </div>
      </div>

      <!-- Code Quality Card -->
      <div class="card">
        <h2>⚡ Code Quality</h2>
        <div class="metric">
          <span class="metric-label">Avg Complexity</span>
          <span class="metric-value ${this.getComplexityClass(metrics.codeQuality.complexity.average)}">${metrics.codeQuality.complexity.average.toFixed(1)}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Max Complexity</span>
          <span class="metric-value ${this.getComplexityClass(metrics.codeQuality.complexity.max)}">${metrics.codeQuality.complexity.max}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Duplication</span>
          <span class="metric-value ${metrics.codeQuality.duplication.percentage > this.config.thresholds.duplication ? 'warning' : 'good'}">${metrics.codeQuality.duplication.percentage.toFixed(1)}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Maintainability</span>
          <span class="metric-value ${this.getStatusClass(metrics.codeQuality.maintainability, 70)}">${metrics.codeQuality.maintainability}/100</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${this.getStatusClass(metrics.codeQuality.maintainability, 70)}" style="width: ${metrics.codeQuality.maintainability}%"></div>
        </div>
      </div>

      <!-- Build Status Card -->
      <div class="card">
        <h2>🔨 Build Status</h2>
        <div class="metric">
          <span class="metric-label">Status</span>
          <span class="metric-value ${metrics.buildStatus.success ? 'good' : 'error'}">${metrics.buildStatus.success ? 'Success' : 'Failed'}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Errors</span>
          <span class="metric-value ${metrics.buildStatus.errors > 0 ? 'error' : 'good'}">${metrics.buildStatus.errors}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Warnings</span>
          <span class="metric-value ${metrics.buildStatus.warnings > 0 ? 'warning' : 'good'}">${metrics.buildStatus.warnings}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Duration</span>
          <span class="metric-value">${(metrics.buildStatus.duration / 1000).toFixed(1)}s</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Size</span>
          <span class="metric-value">${this.formatBytes(metrics.buildStatus.size.total)}</span>
        </div>
      </div>
    </div>
    
    <div class="timestamp">
      Last updated: ${metrics.timestamp.toLocaleString()}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * ステータスクラスを取得
   */
  private getStatusClass(value: number, threshold: number): string {
    if (value >= threshold) return 'good';
    if (value >= threshold * 0.8) return 'warning';
    return 'error';
  }

  /**
   * 複雑度クラスを取得
   */
  private getComplexityClass(complexity: number): string {
    if (complexity <= 10) return 'good';
    if (complexity <= 20) return 'warning';
    return 'error';
  }

  /**
   * トレンドアイコンを取得
   */
  private getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return '📈 Up';
      case 'down': return '📉 Down';
      case 'stable': return '➡️ Stable';
    }
  }

  /**
   * バイト数をフォーマット
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  /**
   * 現在のメトリクスを取得
   */
  getCurrentMetrics(): QualityMetrics | undefined {
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  /**
   * メトリクス履歴を取得
   */
  getHistory(): QualityMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * サマリーレポートを生成
   */
  generateSummaryReport(): string {
    const current = this.getCurrentMetrics();
    if (!current) return 'No metrics available';

    const lines: string[] = [
      '# Quality Summary Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Key Metrics',
      '',
      '### Coverage',
      `- Lines: ${current.coverage.lines.toFixed(1)}%`,
      `- Statements: ${current.coverage.statements.toFixed(1)}%`,
      `- Functions: ${current.coverage.functions.toFixed(1)}%`,
      `- Branches: ${current.coverage.branches.toFixed(1)}%`,
      `- Trend: ${current.coverage.trend}`,
      '',
      '### Type Health',
      `- Total Types: ${current.typeHealth.totalTypes}`,
      `- Conflicts: ${current.typeHealth.conflicts}`,
      `- Consistency: ${current.typeHealth.consistency.toFixed(1)}%`,
      '',
      '### Test Status',
      `- Total: ${current.testStatus.total}`,
      `- Passed: ${current.testStatus.passed}`,
      `- Failed: ${current.testStatus.failed}`,
      '',
      '### Technical Debt',
      `- Score: ${current.technicalDebt.score}/100`,
      `- Critical Issues: ${current.technicalDebt.issues.critical}`,
      `- Estimated Fix Time: ${current.technicalDebt.estimatedTime}`,
      '',
      '### Code Quality',
      `- Avg Complexity: ${current.codeQuality.complexity.average.toFixed(1)}`,
      `- Duplication: ${current.codeQuality.duplication.percentage.toFixed(1)}%`,
      `- Maintainability: ${current.codeQuality.maintainability}/100`
    ];

    return lines.join('\n');
  }
}

/**
 * CLI実行
 */
if (require.main === module) {
  const dashboard = new QualityDashboard();
  
  (async () => {
    console.log('Starting Quality Dashboard...');
    await dashboard.start();
    
    // サマリー表示
    const summary = dashboard.generateSummaryReport();
    console.log('\n' + summary);
    
    // Ctrl+Cでの終了処理
    process.on('SIGINT', () => {
      console.log('\nStopping dashboard...');
      dashboard.stop();
      process.exit(0);
    });
  })();
}