/**
 * トレンド分析コマンド - v0.4.0 Quality Score Calculator
 * 
 * 高度なトレンド分析と予測機能を提供
 */

import { ScoreHistoryManager } from '../../scoring/history';
import { TrendAnalysisEngine } from '../../scoring/trends';
import { AdvancedPredictionEngine } from '../../scoring/prediction';
// import { Command } from 'commander'; // Commander not used in this implementation
import * as path from 'path';

export interface TrendCommandOptions {
  projectPath?: string;
  days?: string;
  method?: 'linear' | 'exponential' | 'arima' | 'polynomial' | 'ensemble';
  format?: 'table' | 'json' | 'chart';
  prediction?: boolean;
  anomalies?: boolean;
  seasonal?: boolean;
  confidence?: string;
  file?: string;
}

/**
 * トレンド分析コマンドの実装
 */
export class TrendCommand {
  private historyManager: ScoreHistoryManager;
  private trendEngine: TrendAnalysisEngine;
  private predictionEngine: AdvancedPredictionEngine;

  constructor() {
    this.historyManager = new ScoreHistoryManager();
    this.trendEngine = new TrendAnalysisEngine();
    this.predictionEngine = new AdvancedPredictionEngine();
  }

  /**
   * コマンド設定用メソッド（現在は使用していない）
   */
  setupCommand(program: any): void {
    const trendCmd = program
      .command('trend')
      .description('高度なトレンド分析と予測を実行')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .option('-d, --days <number>', '分析対象日数', '30')
      .option('-m, --method <method>', '分析手法 (linear|exponential|arima|polynomial|ensemble)', 'ensemble')
      .option('-f, --format <format>', '出力フォーマット (table|json|chart)', 'table')
      .option('-P, --prediction', '予測分析を実行', false)
      .option('-a, --anomalies', '異常値検知を実行', false)
      .option('-s, --seasonal', '季節性分析を実行', false)
      .option('-c, --confidence <level>', '信頼区間レベル', '0.95')
      .option('--file <filepath>', '特定ファイルのトレンド分析')
      .action(async (options: TrendCommandOptions) => {
        await this.executeCommand(options);
      });

    // サブコマンド: predict
    trendCmd
      .command('predict')
      .description('将来のスコアを予測')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .option('-h, --horizon <days>', '予測期間（日数）', '7')
      .option('-m, --method <method>', '予測手法 (ensemble|arima|polynomial)', 'ensemble')
      .option('-f, --format <format>', '出力形式 (table|json)', 'table')
      .action(async (options: { projectPath?: string; horizon?: string; method?: string; format?: string }) => {
        await this.executePredictionCommand(options);
      });

    // サブコマンド: anomalies
    trendCmd
      .command('anomalies')
      .description('異常値検知を実行')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .option('-t, --threshold <value>', '異常値判定閾値（標準偏差倍数）', '2.0')
      .option('--drift', 'ドリフト検知を有効化', false)
      .option('-f, --format <format>', '出力形式 (table|json)', 'table')
      .action(async (options: { projectPath?: string; threshold?: string; drift?: boolean; format?: string }) => {
        await this.executeAnomalyCommand(options);
      });

    // サブコマンド: compare
    trendCmd
      .command('compare')
      .description('期間比較分析')
      .option('-p, --project-path <path>', 'プロジェクトパス', process.cwd())
      .option('--baseline <days>', 'ベースライン期間（日数）', '30')
      .option('--current <days>', '比較対象期間（日数）', '7')
      .option('-f, --format <format>', '出力形式 (table|json)', 'table')
      .action(async (options: { projectPath?: string; baseline?: string; current?: string; format?: string }) => {
        await this.executeComparisonCommand(options);
      });
  }

  /**
   * メインコマンド実行
   */
  private async executeCommand(options: TrendCommandOptions): Promise<void> {
    const projectPath = path.resolve(options.projectPath || process.cwd());
    const days = parseInt(options.days || '30');

    try {
      const scores = await this.historyManager.getRecentScores(projectPath, days);

      if (scores.length < 3) {
        console.log('⚠️  トレンド分析には最低3件の履歴データが必要です');
        return;
      }

      if (options.file) {
        await this.analyzeFileTrend(projectPath, options.file, options);
        return;
      }

      await this.analyzeProjectTrend(scores, options);

    } catch (error) {
      console.error('トレンド分析でエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * プロジェクトトレンド分析
   */
  private async analyzeProjectTrend(scores: any[], options: TrendCommandOptions): Promise<void> {
    const method = options.method || 'ensemble';

    switch (options.format) {
      case 'json':
        await this.displayTrendAsJson(scores, method, options);
        break;
      case 'chart':
        await this.displayTrendAsChart(scores, method, options);
        break;
      default:
        await this.displayTrendAsTable(scores, method, options);
        break;
    }
  }

  /**
   * テーブル形式でのトレンド表示
   */
  private async displayTrendAsTable(scores: any[], method: string, options: TrendCommandOptions): Promise<void> {
    console.log(`\\n📈 トレンド分析結果 (${method.toUpperCase()})\\n`);

    // 基本トレンド分析
    if (method === 'linear' || method === 'ensemble') {
      const linearRegression = this.trendEngine.calculateLinearRegression(scores);
      console.log('🔍 線形回帰分析');
      console.log(`  傾き: ${linearRegression.slope.toFixed(4)}/日`);
      console.log(`  切片: ${linearRegression.intercept.toFixed(2)}`);
      console.log(`  決定係数(R²): ${linearRegression.rSquared.toFixed(3)}`);
      console.log(`  信頼性: ${linearRegression.reliability}`);
      console.log(`  方程式: ${linearRegression.equation}\\n`);
    }

    if (method === 'exponential' || method === 'ensemble') {
      const exponentialSmoothing = this.trendEngine.calculateExponentialSmoothing(scores);
      console.log('📊 指数平滑法');
      console.log(`  次期予測値: ${exponentialSmoothing.nextValue.toFixed(2)}`);
      console.log(`  信頼度: ${(exponentialSmoothing.confidence * 100).toFixed(1)}%`);
      console.log(`  平滑化係数(α): ${exponentialSmoothing.alpha}`);
      console.log(`  予測誤差(MAE): ${exponentialSmoothing.error.toFixed(2)}\\n`);
    }

    if (options.seasonal) {
      console.log('🌊 季節性分析');
      const seasonality = this.trendEngine.analyzeSeasonality(scores);
      console.log(`  季節パターン: ${seasonality.hasPattern ? 'あり' : 'なし'}`);
      console.log(`  パターン強度: ${(seasonality.strength * 100).toFixed(1)}%`);
      console.log(`  信頼度: ${(seasonality.confidence * 100).toFixed(1)}%\\n`);
    }

    if (options.anomalies) {
      console.log('🚨 異常値検知');
      const anomalies = this.trendEngine.detectAnomalies(scores, { detectDrift: true });
      
      if (anomalies.length === 0) {
        console.log('  検出された異常値はありません\\n');
      } else {
        console.log(`  検出数: ${anomalies.length}件`);
        for (const anomaly of anomalies.slice(0, 5)) {
          const dateStr = anomaly.date.toISOString().split('T')[0];
          console.log(`  ${dateStr}: ${anomaly.type} (${anomaly.severity}) - ${anomaly.score.toFixed(1)}`);
        }
        console.log();
      }
    }

    if (options.prediction) {
      console.log('🔮 予測分析');
      try {
        if (method === 'ensemble') {
          const ensemble = this.predictionEngine.generateEnsemblePrediction(scores);
          console.log(`  統合予測: ${ensemble.prediction.toFixed(2)}`);
          console.log(`  信頼度: ${(ensemble.confidence * 100).toFixed(1)}%`);
          console.log(`  コンセンサス: ${(ensemble.consensusStrength * 100).toFixed(1)}%`);
        } else if (method === 'arima') {
          const arima = this.predictionEngine.calculateARIMAPrediction(scores);
          console.log(`  ARIMA予測: ${arima.nextValue.toFixed(2)}`);
          console.log(`  信頼度: ${(arima.confidence * 100).toFixed(1)}%`);
        }
        console.log();
      } catch (error) {
        console.log(`  予測分析エラー: ${error instanceof Error ? error.message : String(error)}\\n`);
      }
    }
  }

  /**
   * JSON形式でのトレンド表示
   */
  private async displayTrendAsJson(scores: any[], method: string, options: TrendCommandOptions): Promise<void> {
    const result: any = {
      method,
      dataPoints: scores.length,
      analysis: {}
    };

    try {
      if (method === 'linear' || method === 'ensemble') {
        result.analysis.linearRegression = this.trendEngine.calculateLinearRegression(scores);
      }

      if (method === 'exponential' || method === 'ensemble') {
        result.analysis.exponentialSmoothing = this.trendEngine.calculateExponentialSmoothing(scores);
      }

      if (options.seasonal) {
        result.analysis.seasonality = this.trendEngine.analyzeSeasonality(scores);
      }

      if (options.anomalies) {
        result.analysis.anomalies = this.trendEngine.detectAnomalies(scores, { detectDrift: true });
      }

      if (options.prediction && method === 'ensemble') {
        result.analysis.prediction = this.predictionEngine.generateEnsemblePrediction(scores);
      }

      console.log(JSON.stringify(result, null, 2));

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.log(JSON.stringify(result, null, 2));
    }
  }

  /**
   * チャート形式での表示（ASCII）
   */
  private async displayTrendAsChart(scores: any[], method: string, options: TrendCommandOptions): Promise<void> {
    console.log('\\n📊 スコア推移チャート\\n');

    const width = 60;
    const height = 20;
    
    // スコアの正規化
    const minScore = Math.min(...scores.map(s => s.score));
    const maxScore = Math.max(...scores.map(s => s.score));
    const range = maxScore - minScore;

    if (range === 0) {
      console.log('スコアに変動がないため、チャートを表示できません');
      return;
    }

    const chart: string[][] = Array(height).fill(null).map(() => Array(width).fill(' '));

    // データポイントをプロット
    for (let i = 0; i < Math.min(scores.length, width); i++) {
      const score = scores[scores.length - width + i]?.score || scores[scores.length - 1].score;
      const normalizedScore = (score - minScore) / range;
      const y = Math.floor((1 - normalizedScore) * (height - 1));
      const x = i;
      
      if (y >= 0 && y < height && x >= 0 && x < width) {
        chart[y][x] = '●';
      }
    }

    // トレンドライン（線形回帰）
    if (method === 'linear' || method === 'ensemble') {
      try {
        const regression = this.trendEngine.calculateLinearRegression(scores);
        const baseDate = scores[0].date.getTime();
        
        for (let x = 0; x < width; x++) {
          const dateOffset = (x / width) * (scores[scores.length - 1].date.getTime() - baseDate);
          const predictedDate = new Date(baseDate + dateOffset);
          const predictedScore = regression.predictNext(predictedDate);
          
          if (predictedScore >= minScore && predictedScore <= maxScore) {
            const normalizedScore = (predictedScore - minScore) / range;
            const y = Math.floor((1 - normalizedScore) * (height - 1));
            
            if (y >= 0 && y < height && chart[y][x] === ' ') {
              chart[y][x] = '-';
            }
          }
        }
      } catch (error) {
        // トレンドライン描画エラーは無視
      }
    }

    // Y軸ラベル
    for (let i = 0; i < height; i++) {
      const value = maxScore - (i / (height - 1)) * range;
      const label = value.toFixed(1).padStart(6);
      console.log(`${label} │${chart[i].join('')}│`);
    }

    // X軸
    console.log(' '.repeat(7) + '└' + '─'.repeat(width) + '┘');
    console.log(' '.repeat(9) + '時間経過 →');

    // 凡例
    console.log('\\n凡例: ● データポイント  - トレンドライン');
  }

  /**
   * 予測コマンドの実行
   */
  private async executePredictionCommand(options: { projectPath?: string; horizon?: string; method?: string; format?: string }): Promise<void> {
    const projectPath = path.resolve(options.projectPath || process.cwd());
    const horizon = parseInt(options.horizon || '7');
    const method = options.method || 'ensemble';

    try {
      const scores = await this.historyManager.getRecentScores(projectPath, 30);

      if (scores.length < 5) {
        console.log('⚠️  予測分析には最低5件の履歴データが必要です');
        return;
      }

      console.log(`\\n🔮 ${horizon}日後の予測 (${method.toUpperCase()})\\n`);

      const targetDate = new Date(Date.now() + horizon * 24 * 60 * 60 * 1000);

      if (method === 'ensemble') {
        const ensemble = this.predictionEngine.generateEnsemblePrediction(scores, targetDate);
        
        if (options.format === 'json') {
          console.log(JSON.stringify(ensemble, null, 2));
        } else {
          console.log(`予測スコア: ${ensemble.prediction.toFixed(2)}`);
          console.log(`信頼度: ${(ensemble.confidence * 100).toFixed(1)}%`);
          console.log(`不確実性: ${(ensemble.uncertainty * 100).toFixed(1)}%`);
          console.log();
          console.log('手法別内訳:');
          Object.entries(ensemble.methods).forEach(([methodName, data]) => {
            console.log(`  ${methodName}: ${data.value.toFixed(2)} (重み: ${(data.weight * 100).toFixed(1)}%)`);
          });
        }
      } else if (method === 'arima') {
        const arima = this.predictionEngine.calculateARIMAPrediction(scores);
        
        if (options.format === 'json') {
          console.log(JSON.stringify(arima, null, 2));
        } else {
          console.log(`ARIMA予測: ${arima.nextValue.toFixed(2)}`);
          console.log(`信頼度: ${(arima.confidence * 100).toFixed(1)}%`);
          console.log(`AIC: ${arima.aic.toFixed(2)}`);
        }
      }

    } catch (error) {
      console.error('予測分析でエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * 異常値検知コマンドの実行
   */
  private async executeAnomalyCommand(options: { projectPath?: string; threshold?: string; drift?: boolean; format?: string }): Promise<void> {
    const projectPath = path.resolve(options.projectPath || process.cwd());
    const threshold = parseFloat(options.threshold || '2.0');

    try {
      const scores = await this.historyManager.getRecentScores(projectPath, 60);

      if (scores.length < 5) {
        console.log('⚠️  異常値検知には最低5件の履歴データが必要です');
        return;
      }

      const anomalies = this.trendEngine.detectAnomalies(scores, { detectDrift: options.drift });

      if (options.format === 'json') {
        console.log(JSON.stringify(anomalies, null, 2));
        return;
      }

      console.log('\\n🚨 異常値検知結果\\n');

      if (anomalies.length === 0) {
        console.log('検出された異常値はありません');
        return;
      }

      console.log('日付'.padEnd(12) + 'スコア'.padEnd(8) + '期待値'.padEnd(8) + '偏差'.padEnd(8) + '重要度'.padEnd(8) + 'タイプ');
      console.log('─'.repeat(70));

      for (const anomaly of anomalies) {
        const dateStr = anomaly.date.toISOString().split('T')[0];
        const severityIcon = anomaly.severity === 'high' ? '🔴' : anomaly.severity === 'medium' ? '🟡' : '🟢';
        const typeIcon = anomaly.type === 'spike' ? '📈' : anomaly.type === 'drop' ? '📉' : '↗️';

        console.log(
          dateStr.padEnd(12) +
          anomaly.score.toFixed(1).padEnd(8) +
          anomaly.expected.toFixed(1).padEnd(8) +
          anomaly.deviation.toFixed(1).padEnd(8) +
          `${severityIcon} ${anomaly.severity}`.padEnd(12) +
          `${typeIcon} ${anomaly.type}`
        );
      }

      console.log(`\\n検出数: ${anomalies.length}件`);

    } catch (error) {
      console.error('異常値検知でエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * 期間比較コマンドの実行
   */
  private async executeComparisonCommand(options: { projectPath?: string; baseline?: string; current?: string; format?: string }): Promise<void> {
    const projectPath = path.resolve(options.projectPath || process.cwd());
    const baselineDays = parseInt(options.baseline || '30');
    const currentDays = parseInt(options.current || '7');

    try {
      const allScores = await this.historyManager.getRecentScores(projectPath, baselineDays + currentDays);

      if (allScores.length < baselineDays + currentDays) {
        console.log('⚠️  比較分析に十分な履歴データがありません');
        return;
      }

      const currentScores = allScores.slice(0, currentDays);
      const baselineScores = allScores.slice(currentDays, currentDays + baselineDays);

      const comparison = this.trendEngine.compareWithBaseline(currentScores, baselineScores);

      if (options.format === 'json') {
        console.log(JSON.stringify(comparison, null, 2));
        return;
      }

      console.log('\\n📊 期間比較分析\\n');
      console.log(`ベースライン期間: 過去${baselineDays}日`);
      console.log(`比較対象期間: 直近${currentDays}日\\n`);

      const improvementIcon = comparison.improvement > 0 ? '📈' : comparison.improvement < 0 ? '📉' : '➡️';
      console.log(`${improvementIcon} 性能変化: ${comparison.improvement > 0 ? '+' : ''}${comparison.improvement.toFixed(2)}`);
      console.log(`📊 変化率: ${comparison.percentChange > 0 ? '+' : ''}${comparison.percentChange.toFixed(1)}%`);
      console.log(`🎯 統計的有意性: ${comparison.significance}`);
      console.log(`📝 解釈: ${comparison.interpretation}`);

    } catch (error) {
      console.error('期間比較分析でエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * ファイル別トレンド分析
   */
  private async analyzeFileTrend(projectPath: string, filePath: string, options: TrendCommandOptions): Promise<void> {
    const fileHistory = await this.historyManager.getFileScoreHistory(projectPath, filePath);

    if (fileHistory.length < 3) {
      console.log(`⚠️  ファイル "${filePath}" のトレンド分析には最低3件の履歴データが必要です`);
      return;
    }

    // HistoricalScore形式に変換
    const scores = fileHistory.map(entry => ({
      date: entry.timestamp,
      score: entry.score,
      grade: entry.grade
    }));

    console.log(`\\n📄 ファイル別トレンド分析: ${filePath}\\n`);

    await this.analyzeProjectTrend(scores, options);
  }
}