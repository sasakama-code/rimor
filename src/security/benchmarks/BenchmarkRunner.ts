/**
 * 型ベースセキュリティ解析 - ベンチマーク実行システム
 * CI/CD環境での自動ベンチマーク実行とパフォーマンス回帰検出
 */

import { PerformanceBenchmark, BenchmarkResult, BenchmarkComparison } from './PerformanceBenchmark';
import { TestCase } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * ベンチマーク設定
 */
export interface BenchmarkConfig {
  /** テストサイズ */
  testSizes: ('small' | 'medium' | 'large' | 'xlarge')[];
  /** 実行回数（平均を取る） */
  iterations: number;
  /** 5ms/file目標の許容誤差（%） */
  target5msTolerance: number;
  /** 速度向上目標の許容範囲 */
  speedupTargetRange: { min: number; max: number };
  /** 性能劣化の警告閾値（%） */
  regressionThreshold: number;
  /** 出力ディレクトリ */
  outputDir: string;
  /** CI環境での実行かどうか */
  isCiEnvironment: boolean;
  /** 詳細ログの出力 */
  verbose: boolean;
}

/**
 * ベンチマーク履歴データ
 */
export interface BenchmarkHistory {
  /** タイムスタンプ */
  timestamp: string;
  /** Git commit hash */
  commitHash?: string;
  /** ブランチ名 */
  branch?: string;
  /** ベンチマーク結果 */
  results: BenchmarkComparison[];
  /** システム情報のハッシュ */
  systemHash: string;
  /** 性能スコア */
  performanceScore: number;
}

/**
 * パフォーマンス回帰検出結果
 */
export interface RegressionDetectionResult {
  /** 回帰が検出されたかどうか */
  hasRegression: boolean;
  /** 回帰項目 */
  regressions: PerformanceRegression[];
  /** 改善項目 */
  improvements: PerformanceImprovement[];
  /** 総合評価 */
  overallAssessment: 'excellent' | 'good' | 'warning' | 'critical';
  /** 推奨アクション */
  recommendedActions: string[];
}

/**
 * パフォーマンス回帰
 */
export interface PerformanceRegression {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 劣化率（%） */
  degradationPercent: number;
  /** 重要度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 説明 */
  description: string;
}

/**
 * パフォーマンス改善
 */
export interface PerformanceImprovement {
  /** 項目名 */
  metric: string;
  /** 前回の値 */
  previousValue: number;
  /** 現在の値 */
  currentValue: number;
  /** 改善率（%） */
  improvementPercent: number;
  /** 説明 */
  description: string;
}

/**
 * ベンチマーク実行システム
 */
export class BenchmarkRunner {
  private benchmark: PerformanceBenchmark;
  private config: BenchmarkConfig;
  private historyFile: string;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = {
      testSizes: ['small', 'medium', 'large'],
      iterations: 3,
      target5msTolerance: 10,
      speedupTargetRange: { min: 3, max: 20 },
      regressionThreshold: 15,
      outputDir: './benchmark-results',
      isCiEnvironment: process.env.CI === 'true',
      verbose: false,
      ...config
    };

    this.benchmark = new PerformanceBenchmark();
    this.historyFile = path.join(this.config.outputDir, 'benchmark-history.json');
  }

  /**
   * 完全なベンチマークスイートの実行
   */
  async runFullBenchmarkSuite(): Promise<RegressionDetectionResult> {
    console.log('🚀 完全ベンチマークスイート実行開始');
    console.log(`🔧 設定: ${this.config.testSizes.join(', ')} (${this.config.iterations}回平均)`);
    console.log('');

    // 出力ディレクトリの作成
    await this.ensureOutputDirectory();

    // 複数回実行して平均を取る
    const allResults: BenchmarkComparison[][] = [];
    
    for (let i = 0; i < this.config.iterations; i++) {
      console.log(`📊 実行 ${i + 1}/${this.config.iterations}:`);
      const results = await this.benchmark.runComprehensiveBenchmark();
      allResults.push(results);
      
      if (i < this.config.iterations - 1) {
        console.log('⏱️  次の実行まで少し待機中...');
        await this.delay(2000); // 2秒待機
      }
    }

    // 結果の平均計算
    const averageResults = this.calculateAverageResults(allResults);

    // 履歴との比較
    const regressionResult = await this.detectPerformanceRegression(averageResults);

    // 結果の保存
    await this.saveResults(averageResults, regressionResult);

    // CI環境での終了コードの設定
    if (this.config.isCiEnvironment) {
      this.setCiExitCode(regressionResult);
    }

    return regressionResult;
  }

  /**
   * 高速ベンチマーク（CI向け）
   */
  async runQuickBenchmark(): Promise<RegressionDetectionResult> {
    console.log('⚡ 高速ベンチマーク実行（CI最適化）');

    // 小規模テストのみで実行
    const quickConfig: BenchmarkConfig = {
      ...this.config,
      testSizes: ['small'],
      iterations: 1,
      verbose: false
    };

    const originalConfig = this.config;
    this.config = quickConfig;

    try {
      const result = await this.runFullBenchmarkSuite();
      console.log('✅ 高速ベンチマーク完了');
      return result;
    } finally {
      this.config = originalConfig;
    }
  }

  /**
   * 特定の性能目標の検証
   */
  async verifyPerformanceTargets(): Promise<{
    target5ms: boolean;
    speedupTarget: boolean;
    details: string[];
  }> {
    console.log('🎯 性能目標検証実行中...');

    // 中規模テストデータで検証
    const testCases = this.generateTestCases(100, 'medium');
    
    // 5ms/file目標の検証
    const target5msAchieved = await this.benchmark.verify5msPerFileTarget(testCases);
    
    // 3-20x速度向上の検証
    const speedupRatio = await this.benchmark.verifySpeedupTarget(testCases);
    const speedupTargetAchieved = speedupRatio >= this.config.speedupTargetRange.min && 
                                  speedupRatio <= this.config.speedupTargetRange.max;

    const details = [
      `5ms/file目標: ${target5msAchieved ? '✅ 達成' : '❌ 未達成'}`,
      `速度向上目標: ${speedupTargetAchieved ? '✅ 達成' : '❌ 未達成'} (${speedupRatio.toFixed(1)}x)`
    ];

    console.log('🎯 性能目標検証結果:');
    details.forEach(detail => console.log(`   ${detail}`));

    return {
      target5ms: target5msAchieved,
      speedupTarget: speedupTargetAchieved,
      details
    };
  }

  /**
   * 性能トレンドの分析
   */
  async analyzePerformanceTrends(days: number = 30): Promise<PerformanceTrendAnalysis> {
    console.log(`📈 過去${days}日間の性能トレンド分析中...`);

    const history = await this.loadBenchmarkHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentHistory = history.filter(entry => 
      new Date(entry.timestamp) >= cutoffDate
    );

    if (recentHistory.length < 2) {
      console.log('⚠️  十分な履歴データがありません');
      return {
        trend: 'insufficient-data',
        averageScore: 0,
        scoreVariation: 0,
        improvements: [],
        degradations: [],
        recommendations: ['より多くのベンチマークデータを蓄積してください']
      };
    }

    const scores = recentHistory.map(entry => entry.performanceScore);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const scoreVariation = this.calculateStandardDeviation(scores);

    // トレンドの判定
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const trendDirection = this.determineTrend(scores);

    const analysis: PerformanceTrendAnalysis = {
      trend: trendDirection,
      averageScore,
      scoreVariation,
      improvements: this.extractTrendImprovements(recentHistory),
      degradations: this.extractTrendDegradations(recentHistory),
      recommendations: this.generateTrendRecommendations(trendDirection, scoreVariation)
    };

    console.log(`📈 トレンド分析結果: ${trendDirection} (平均スコア: ${averageScore.toFixed(1)})`);

    return analysis;
  }

  /**
   * ベンチマーク結果の平均計算
   */
  private calculateAverageResults(allResults: BenchmarkComparison[][]): BenchmarkComparison[] {
    if (allResults.length === 0) return [];

    const resultCount = allResults[0].length;
    const averageResults: BenchmarkComparison[] = [];

    for (let i = 0; i < resultCount; i++) {
      const comparisonGroup = allResults.map(results => results[i]);
      const averageComparison = this.averageBenchmarkComparisons(comparisonGroup);
      averageResults.push(averageComparison);
    }

    return averageResults;
  }

  /**
   * ベンチマーク比較の平均計算
   */
  private averageBenchmarkComparisons(comparisons: BenchmarkComparison[]): BenchmarkComparison {
    const avgBaseline = this.averageBenchmarkResults(comparisons.map(c => c.baseline));
    const avgOptimized = this.averageBenchmarkResults(comparisons.map(c => c.optimized));

    const avgSpeedupRatio = comparisons.reduce((sum, c) => sum + c.speedupRatio, 0) / comparisons.length;
    const avgMemoryEfficiencyRatio = comparisons.reduce((sum, c) => sum + c.memoryEfficiencyRatio, 0) / comparisons.length;

    return {
      baseline: avgBaseline,
      optimized: avgOptimized,
      speedupRatio: avgSpeedupRatio,
      memoryEfficiencyRatio: avgMemoryEfficiencyRatio,
      target5msAchieved: avgOptimized.timePerFile <= 5.0,
      speedupTargetAchieved: avgSpeedupRatio >= this.config.speedupTargetRange.min && 
                            avgSpeedupRatio <= this.config.speedupTargetRange.max,
      improvements: comparisons[0].improvements, // 最初のものを使用
      regressions: comparisons[0].regressions
    };
  }

  /**
   * ベンチマーク結果の平均計算
   */
  private averageBenchmarkResults(results: BenchmarkResult[]): BenchmarkResult {
    const count = results.length;
    
    return {
      testName: results[0].testName,
      fileCount: results[0].fileCount,
      methodCount: Math.round(results.reduce((sum, r) => sum + r.methodCount, 0) / count),
      totalTime: results.reduce((sum, r) => sum + r.totalTime, 0) / count,
      timePerFile: results.reduce((sum, r) => sum + r.timePerFile, 0) / count,
      timePerMethod: results.reduce((sum, r) => sum + r.timePerMethod, 0) / count,
      memoryUsage: results.reduce((sum, r) => sum + r.memoryUsage, 0) / count,
      cpuUsage: results.reduce((sum, r) => sum + r.cpuUsage, 0) / count,
      throughput: results.reduce((sum, r) => sum + r.throughput, 0) / count,
      successRate: results.reduce((sum, r) => sum + r.successRate, 0) / count,
      errorCount: Math.round(results.reduce((sum, r) => sum + r.errorCount, 0) / count),
      parallelism: results[0].parallelism,
      cacheHitRate: results.reduce((sum, r) => sum + r.cacheHitRate, 0) / count
    };
  }

  /**
   * パフォーマンス回帰の検出
   */
  private async detectPerformanceRegression(
    currentResults: BenchmarkComparison[]
  ): Promise<RegressionDetectionResult> {
    const history = await this.loadBenchmarkHistory();
    
    if (history.length === 0) {
      console.log('📝 初回ベンチマーク実行 - 履歴データなし');
      return {
        hasRegression: false,
        regressions: [],
        improvements: [],
        overallAssessment: 'good',
        recommendedActions: ['ベンチマーク履歴の蓄積を開始しました']
      };
    }

    const lastEntry = history[history.length - 1];
    const regressions: PerformanceRegression[] = [];
    const improvements: PerformanceImprovement[] = [];

    // 各ベンチマーク結果を比較
    for (let i = 0; i < Math.min(currentResults.length, lastEntry.results.length); i++) {
      const current = currentResults[i];
      const previous = lastEntry.results[i];

      // 実行時間の比較
      const timeRegression = this.compareMetric(
        'execution_time',
        previous.optimized.totalTime,
        current.optimized.totalTime,
        'lower_is_better'
      );
      
      if (timeRegression.type === 'regression') {
        regressions.push(timeRegression as PerformanceRegression);
      } else if (timeRegression.type === 'improvement') {
        improvements.push(timeRegression as PerformanceImprovement);
      }

      // メモリ使用量の比較
      const memoryRegression = this.compareMetric(
        'memory_usage',
        previous.optimized.memoryUsage,
        current.optimized.memoryUsage,
        'lower_is_better'
      );
      
      if (memoryRegression.type === 'regression') {
        regressions.push(memoryRegression as PerformanceRegression);
      } else if (memoryRegression.type === 'improvement') {
        improvements.push(memoryRegression as PerformanceImprovement);
      }

      // 成功率の比較
      const successRegression = this.compareMetric(
        'success_rate',
        previous.optimized.successRate,
        current.optimized.successRate,
        'higher_is_better'
      );
      
      if (successRegression.type === 'regression') {
        regressions.push(successRegression as PerformanceRegression);
      } else if (successRegression.type === 'improvement') {
        improvements.push(successRegression as PerformanceImprovement);
      }
    }

    const hasRegression = regressions.some(r => r.severity === 'high' || r.severity === 'critical');
    const overallAssessment = this.assessOverallPerformance(regressions, improvements);
    const recommendedActions = this.generateRecommendedActions(regressions, improvements);

    console.log(`🔍 回帰検出結果: ${hasRegression ? '⚠️  回帰検出' : '✅ 問題なし'}`);
    console.log(`📊 総合評価: ${overallAssessment}`);

    return {
      hasRegression,
      regressions,
      improvements,
      overallAssessment,
      recommendedActions
    };
  }

  /**
   * メトリクス比較
   */
  private compareMetric(
    metricName: string,
    previousValue: number,
    currentValue: number,
    comparison: 'higher_is_better' | 'lower_is_better'
  ): { type: 'regression' | 'improvement' | 'stable' } & (PerformanceRegression | PerformanceImprovement) {
    const changePercent = Math.abs((currentValue - previousValue) / previousValue) * 100;
    
    if (changePercent < 5) {
      return { type: 'stable' } as any;
    }

    const isWorse = comparison === 'lower_is_better' ? 
      currentValue > previousValue : 
      currentValue < previousValue;

    if (isWorse && changePercent >= this.config.regressionThreshold) {
      return {
        type: 'regression',
        metric: metricName,
        previousValue,
        currentValue,
        degradationPercent: changePercent,
        severity: changePercent >= 50 ? 'critical' : changePercent >= 30 ? 'high' : 'medium',
        description: `${metricName}が${changePercent.toFixed(1)}%劣化しました`
      };
    } else if (!isWorse && changePercent >= 10) {
      return {
        type: 'improvement',
        metric: metricName,
        previousValue,
        currentValue,
        improvementPercent: changePercent,
        description: `${metricName}が${changePercent.toFixed(1)}%改善されました`
      };
    }

    return { type: 'stable' } as any;
  }

  /**
   * 総合パフォーマンス評価
   */
  private assessOverallPerformance(
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[]
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    const criticalRegressions = regressions.filter(r => r.severity === 'critical').length;
    const highRegressions = regressions.filter(r => r.severity === 'high').length;
    const significantImprovements = improvements.filter(i => i.improvementPercent >= 20).length;

    if (criticalRegressions > 0) return 'critical';
    if (highRegressions > 1) return 'warning';
    if (highRegressions === 1 && significantImprovements === 0) return 'warning';
    if (significantImprovements > 2) return 'excellent';
    return 'good';
  }

  /**
   * 推奨アクションの生成
   */
  private generateRecommendedActions(
    regressions: PerformanceRegression[],
    improvements: PerformanceImprovement[]
  ): string[] {
    const actions: string[] = [];

    if (regressions.length === 0) {
      actions.push('性能劣化は検出されませんでした');
      if (improvements.length > 0) {
        actions.push('性能改善が確認されました - 良い状態です');
      }
    } else {
      actions.push(`${regressions.length}件の性能劣化が検出されました`);
      
      const criticalCount = regressions.filter(r => r.severity === 'critical').length;
      if (criticalCount > 0) {
        actions.push(`緊急対応が必要な劣化が${criticalCount}件あります`);
      }

      actions.push('最近の変更内容を確認し、性能に影響する修正を調査してください');
      actions.push('プロファイリングツールを使用して詳細な解析を実行してください');
    }

    return actions;
  }

  /**
   * 結果の保存
   */
  private async saveResults(
    results: BenchmarkComparison[],
    regressionResult: RegressionDetectionResult
  ): Promise<void> {
    // 履歴データの更新
    const history = await this.loadBenchmarkHistory();
    const performanceScore = this.calculatePerformanceScore(results);
    
    const newEntry: BenchmarkHistory = {
      timestamp: new Date().toISOString(),
      commitHash: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA,
      branch: process.env.GITHUB_REF_NAME || process.env.CI_COMMIT_REF_NAME,
      results,
      systemHash: this.generateSystemHash(),
      performanceScore
    };

    history.push(newEntry);

    // 古い履歴の削除（最新100件のみ保持）
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));

    // 詳細レポートの保存
    const reportPath = path.join(this.config.outputDir, `benchmark-${Date.now()}.json`);
    const detailedReport = {
      timestamp: newEntry.timestamp,
      config: this.config,
      results,
      regressionResult,
      performanceScore
    };

    await fs.writeFile(reportPath, JSON.stringify(detailedReport, null, 2));

    console.log(`💾 結果を保存しました: ${reportPath}`);
  }

  /**
   * ベンチマーク履歴の読み込み
   */
  private async loadBenchmarkHistory(): Promise<BenchmarkHistory[]> {
    try {
      const content = await fs.readFile(this.historyFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  /**
   * 出力ディレクトリの確保
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }
  }

  /**
   * CI環境での終了コードの設定
   */
  private setCiExitCode(regressionResult: RegressionDetectionResult): void {
    if (regressionResult.overallAssessment === 'critical') {
      console.log('❌ クリティカルな性能劣化のため、CI を失敗させます');
      process.exit(1);
    } else if (regressionResult.overallAssessment === 'warning') {
      console.log('⚠️  性能劣化が検出されましたが、CI は継続します');
      // 警告レベルでは失敗させない
    } else {
      console.log('✅ 性能テスト合格');
    }
  }

  /**
   * 遅延関数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 性能スコアの計算
   */
  private calculatePerformanceScore(results: BenchmarkComparison[]): number {
    let totalScore = 0;
    let weights = 0;

    results.forEach(result => {
      // 5ms/file目標の達成度
      const timeScore = result.target5msAchieved ? 30 : Math.max(0, 30 - (result.optimized.timePerFile - 5) * 5);
      
      // 速度向上の達成度
      const speedupScore = result.speedupTargetAchieved ? 25 : Math.min(25, result.speedupRatio * 5);
      
      // 成功率
      const successScore = result.optimized.successRate * 0.2;
      
      // メモリ効率
      const memoryScore = Math.max(0, 15 - result.optimized.memoryUsage * 0.5);
      
      totalScore += timeScore + speedupScore + successScore + memoryScore;
      weights += 90; // 最大スコア
    });

    return weights > 0 ? (totalScore / weights) * 100 : 0;
  }

  /**
   * システムハッシュの生成
   */
  private generateSystemHash(): string {
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      nodeVersion: process.version
    };
    
    return crypto.createHash('md5').update(JSON.stringify(systemInfo)).digest('hex').substring(0, 8);
  }

  /**
   * テストケースの生成（ベンチマーク用）
   */
  private generateTestCases(count: number, size: string): TestCase[] {
    const testCases: TestCase[] = [];

    for (let i = 0; i < count; i++) {
      testCases.push({
        name: `benchmark-test-${size}-${i}`,
        file: `benchmark-test-${size}-${i}.test.ts`,
        content: this.generateTestContent(size),
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      });
    }

    return testCases;
  }

  /**
   * テスト内容の生成
   */
  private generateTestContent(size: string): string {
    const methodCount = size === 'small' ? 3 : size === 'medium' ? 8 : 15;
    const methods: string[] = [];

    for (let i = 0; i < methodCount; i++) {
      methods.push(`
  it('should handle test case ${i}', async () => {
    const input = getUserInput();
    const sanitized = sanitize(input);
    const result = await processData(sanitized);
    expect(result).toBeDefined();
  });`);
    }

    return `
describe('Benchmark Test Suite', () => {
${methods.join('')}
});
`;
  }

  /**
   * 標準偏差の計算
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * トレンドの判定
   */
  private determineTrend(scores: number[]): 'improving' | 'stable' | 'degrading' | 'insufficient-data' {
    if (scores.length < 3) return 'insufficient-data';

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.ceil(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = Math.abs((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent < 5) return 'stable';
    return secondAvg > firstAvg ? 'improving' : 'degrading';
  }

  /**
   * トレンド改善項目の抽出
   */
  private extractTrendImprovements(history: BenchmarkHistory[]): string[] {
    // 簡易実装
    return ['実行時間の継続的改善', 'メモリ使用量の最適化'];
  }

  /**
   * トレンド劣化項目の抽出
   */
  private extractTrendDegradations(history: BenchmarkHistory[]): string[] {
    // 簡易実装
    return [];
  }

  /**
   * トレンド推奨事項の生成
   */
  private generateTrendRecommendations(
    trend: string,
    variation: number
  ): string[] {
    const recommendations: string[] = [];

    switch (trend) {
      case 'improving':
        recommendations.push('良好なトレンドです。現在の最適化戦略を継続してください');
        break;
      case 'degrading':
        recommendations.push('性能劣化の傾向があります。最近の変更を確認してください');
        recommendations.push('プロファイリングによる詳細調査を推奨します');
        break;
      case 'stable':
        if (variation > 20) {
          recommendations.push('性能にばらつきがあります。実行環境の一貫性を確認してください');
        } else {
          recommendations.push('安定した性能を維持しています');
        }
        break;
      default:
        recommendations.push('データ蓄積中です。継続的な測定を行ってください');
    }

    return recommendations;
  }
}

/**
 * パフォーマンストレンド分析結果
 */
export interface PerformanceTrendAnalysis {
  /** トレンド方向 */
  trend: 'improving' | 'stable' | 'degrading' | 'insufficient-data';
  /** 平均スコア */
  averageScore: number;
  /** スコアのばらつき */
  scoreVariation: number;
  /** 改善項目 */
  improvements: string[];
  /** 劣化項目 */
  degradations: string[];
  /** 推奨事項 */
  recommendations: string[];
}