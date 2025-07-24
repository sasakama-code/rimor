/**
 * トレンド分析エンジン - v0.4.0 Quality Score Calculator
 * 
 * 履歴データから高度なトレンド分析、予測、異常検知を実行
 */

import { HistoricalScore } from './history';

/**
 * 線形回帰分析結果
 */
export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  equation: string;
  reliability: 'high' | 'medium' | 'low';
  predictNext: (date: Date) => number;
}

/**
 * 指数平滑化予測結果
 */
export interface ExponentialSmoothingResult {
  nextValue: number;
  confidence: number;
  alpha: number;
  smoothedValues: number[];
  error: number;
}

/**
 * 季節性分析結果
 */
export interface SeasonalityResult {
  hasPattern: boolean;
  strength: number; // 0-1
  period: number;
  pattern: number[]; // 各期間の係数
  confidence: number;
}

/**
 * 異常値検知結果
 */
export interface Anomaly {
  date: Date;
  score: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  type: 'spike' | 'drop' | 'drift';
  explanation: string;
}

/**
 * ベースライン比較結果
 */
export interface BaselineComparison {
  improvement: number;
  percentChange: number;
  significance: 'high' | 'medium' | 'low';
  interpretation: string;
  confidenceLevel: number;
}

/**
 * 信頼区間付き予測
 */
export interface ConfidencePrediction {
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidenceLevel: number;
  method: string;
}

/**
 * 包括的トレンド分析結果
 */
export interface ComprehensiveAnalysis {
  summary: {
    trend: 'improving' | 'declining' | 'stable';
    strength: 'strong' | 'moderate' | 'weak';
    reliability: 'high' | 'medium' | 'low';
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  linearRegression: LinearRegressionResult;
  exponentialSmoothing: ExponentialSmoothingResult;
  seasonality: SeasonalityResult;
  anomalies: Anomaly[];
  predictions: {
    nextWeek: number;
    nextMonth: number;
    confidence: ConfidencePrediction;
  };
  recommendations: string[];
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
}

/**
 * トレンド分析エンジンクラス
 */
export class TrendAnalysisEngine {
  /**
   * 線形回帰分析を実行
   */
  calculateLinearRegression(scores: HistoricalScore[]): LinearRegressionResult {
    if (scores.length < 2) {
      throw new Error('線形回帰には最低2つのデータポイントが必要です');
    }

    // 日付を数値に変換（最初の日付からの日数）
    const baseDate = scores[0].date.getTime();
    const x = scores.map(s => (s.date.getTime() - baseDate) / (24 * 60 * 60 * 1000));
    const y = scores.map(s => s.score);

    const n = scores.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    // 回帰係数の計算
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // 決定係数（R²）の計算
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    // 信頼性判定
    let reliability: 'high' | 'medium' | 'low';
    if (rSquared > 0.8) reliability = 'high';
    else if (rSquared > 0.5) reliability = 'medium';
    else reliability = 'low';

    // 予測関数
    const predictNext = (date: Date): number => {
      const daysSinceBase = (date.getTime() - baseDate) / (24 * 60 * 60 * 1000);
      return slope * daysSinceBase + intercept;
    };

    return {
      slope,
      intercept,
      rSquared,
      equation: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`,
      reliability,
      predictNext
    };
  }

  /**
   * 指数平滑化による予測
   */
  calculateExponentialSmoothing(scores: HistoricalScore[], alpha: number = 0.3): ExponentialSmoothingResult {
    if (scores.length === 0) {
      throw new Error('指数平滑化にはデータが必要です');
    }

    const values = scores.map(s => s.score);
    const smoothedValues: number[] = [];
    
    // 初期値設定
    smoothedValues[0] = values[0];

    // 指数平滑化の実行
    for (let i = 1; i < values.length; i++) {
      smoothedValues[i] = alpha * values[i] + (1 - alpha) * smoothedValues[i - 1];
    }

    // 次の値を予測（最後の値に基づく）
    const lastActual = values[values.length - 1];
    const lastSmoothed = smoothedValues[smoothedValues.length - 1];
    const nextValue = alpha * lastActual + (1 - alpha) * lastSmoothed;

    // 予測誤差の計算（MAE）
    const errors = values.slice(1).map((val, i) => Math.abs(val - smoothedValues[i]));
    const meanError = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;

    // 信頼度の計算（誤差が小さいほど高い）
    const maxScore = 100;
    const confidence = Math.max(0, 1 - (meanError / maxScore));

    return {
      nextValue,
      confidence,
      alpha,
      smoothedValues,
      error: meanError
    };
  }

  /**
   * 季節性分析
   */
  analyzeSeasonality(scores: HistoricalScore[], period: 'weekly' | 'monthly' = 'weekly'): SeasonalityResult {
    if (scores.length < 14) {
      return {
        hasPattern: false,
        strength: 0,
        period: period === 'weekly' ? 7 : 30,
        pattern: [],
        confidence: 0
      };
    }

    const periodLength = period === 'weekly' ? 7 : 30;
    const values = scores.map(s => s.score);

    // 期間別の平均を計算
    const periodAverages: number[] = new Array(periodLength).fill(0);
    const periodCounts: number[] = new Array(periodLength).fill(0);

    scores.forEach((score, index) => {
      const periodIndex = index % periodLength;
      periodAverages[periodIndex] += score.score;
      periodCounts[periodIndex]++;
    });

    // 平均値を計算
    const pattern = periodAverages.map((sum, i) => 
      periodCounts[i] > 0 ? sum / periodCounts[i] : 0
    );

    // 季節性の強度を計算
    const overallMean = values.reduce((a, b) => a + b, 0) / values.length;
    const totalVariance = values.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0);
    const seasonalVariance = pattern.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) * periodCounts.reduce((a, b) => a + b, 0) / periodLength;
    
    const strength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;
    const hasPattern = strength > 0.3;
    const confidence = Math.min(1, strength * 2);

    return {
      hasPattern,
      strength,
      period: periodLength,
      pattern,
      confidence
    };
  }

  /**
   * 異常値検知
   */
  detectAnomalies(scores: HistoricalScore[], options: { detectDrift?: boolean } = {}): Anomaly[] {
    if (scores.length < 5) {
      return [];
    }

    const values = scores.map(s => s.score);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    const anomalies: Anomaly[] = [];

    // 統計的異常値検知
    scores.forEach((score, index) => {
      if (stdDev === 0) return; // 標準偏差が0の場合はスキップ
      
      const zScore = Math.abs(score.score - mean) / stdDev;
      
      if (zScore > 2.0) { // 2.0σを超える（閾値を低く）
        const severity: 'low' | 'medium' | 'high' = 
          zScore > 3.5 ? 'high' : zScore > 3 ? 'medium' : 'low';
        
        const type: 'spike' | 'drop' = score.score > mean ? 'spike' : 'drop';

        anomalies.push({
          date: score.date,
          score: score.score,
          expected: mean,
          deviation: Math.abs(score.score - mean),
          severity,
          type,
          explanation: `${zScore.toFixed(2)}標準偏差外れ値（平均: ${mean.toFixed(1)}、標準偏差: ${stdDev.toFixed(1)}）`
        });
      }
    });

    // ドリフト検知（オプション）
    if (options.detectDrift && scores.length >= 10) {
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      
      const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const driftMagnitude = Math.abs(secondMean - firstMean);
      
      if (driftMagnitude > stdDev) {
        const midIndex = Math.floor(scores.length / 2);
        anomalies.push({
          date: scores[midIndex].date,
          score: secondMean,
          expected: firstMean,
          deviation: driftMagnitude,
          severity: driftMagnitude > 2 * stdDev ? 'high' : 'medium',
          type: 'drift',
          explanation: `期間内でのドリフト検知（前半平均: ${firstMean.toFixed(1)}、後半平均: ${secondMean.toFixed(1)}）`
        });
      }
    }

    return anomalies.sort((a, b) => b.deviation - a.deviation);
  }

  /**
   * ベースラインとの比較
   */
  compareWithBaseline(currentScores: HistoricalScore[], baselineScores: HistoricalScore[]): BaselineComparison {
    if (currentScores.length === 0 || baselineScores.length === 0) {
      throw new Error('比較には両方のデータセットが必要です');
    }

    const currentMean = currentScores.reduce((sum, s) => sum + s.score, 0) / currentScores.length;
    const baselineMean = baselineScores.reduce((sum, s) => sum + s.score, 0) / baselineScores.length;

    const improvement = currentMean - baselineMean;
    const percentChange = baselineMean !== 0 ? (improvement / baselineMean) * 100 : 0;

    // 統計的有意性の簡易検定
    const currentStdDev = Math.sqrt(currentScores.reduce((sum, s) => sum + Math.pow(s.score - currentMean, 2), 0) / currentScores.length);
    const baselineStdDev = Math.sqrt(baselineScores.reduce((sum, s) => sum + Math.pow(s.score - baselineMean, 2), 0) / baselineScores.length);
    
    const pooledStdDev = Math.sqrt((currentStdDev * currentStdDev + baselineStdDev * baselineStdDev) / 2);
    const standardError = pooledStdDev * Math.sqrt(1 / currentScores.length + 1 / baselineScores.length);
    const tScore = Math.abs(improvement) / standardError;

    let significance: 'high' | 'medium' | 'low';
    if (tScore > 2.5) significance = 'high';
    else if (tScore > 1.5) significance = 'medium';
    else significance = 'low';

    // 解釈の生成
    let interpretation: string;
    if (Math.abs(percentChange) < 2) {
      interpretation = '性能に有意な変化は見られません';
    } else if (improvement > 0) {
      interpretation = `性能が${percentChange.toFixed(1)}%改善されました（統計的有意性: ${significance}）`;
    } else {
      interpretation = `性能が${Math.abs(percentChange).toFixed(1)}%低下しました（統計的有意性: ${significance}）`;
    }

    return {
      improvement,
      percentChange,
      significance,
      interpretation,
      confidenceLevel: significance === 'high' ? 0.95 : significance === 'medium' ? 0.8 : 0.6
    };
  }

  /**
   * 信頼区間付き予測
   */
  predictWithConfidence(
    scores: HistoricalScore[], 
    targetDate: Date, 
    confidenceLevel: number = 0.95
  ): ConfidencePrediction {
    if (scores.length < 3) {
      throw new Error('信頼区間計算には最低3つのデータポイントが必要です');
    }

    // 線形回帰による予測
    const regression = this.calculateLinearRegression(scores);
    const predictedValue = regression.predictNext(targetDate);

    // 残差の計算
    const baseDate = scores[0].date.getTime();
    const residuals = scores.map(score => {
      const daysSinceBase = (score.date.getTime() - baseDate) / (24 * 60 * 60 * 1000);
      const predicted = regression.slope * daysSinceBase + regression.intercept;
      return score.score - predicted;
    });

    // 残差の標準偏差
    const residualMean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const residualStdDev = Math.sqrt(
      residuals.reduce((sum, r) => sum + Math.pow(r - residualMean, 2), 0) / (residuals.length - 1)
    );

    // t分布の近似（95%信頼区間でt≈2）
    const tValue = confidenceLevel === 0.95 ? 2 : confidenceLevel === 0.9 ? 1.645 : 1.96;
    const margin = tValue * residualStdDev;

    return {
      predictedValue,
      confidenceInterval: {
        lower: Math.max(0, predictedValue - margin),
        upper: Math.min(100, predictedValue + margin)
      },
      confidenceLevel,
      method: 'Linear Regression with t-distribution'
    };
  }

  /**
   * 包括的トレンド分析
   */
  generateComprehensiveAnalysis(scores: HistoricalScore[]): ComprehensiveAnalysis {
    if (scores.length < 5) {
      throw new Error('包括的分析には最低5つのデータポイントが必要です');
    }

    // 各種分析の実行
    const linearRegression = this.calculateLinearRegression(scores);
    const exponentialSmoothing = this.calculateExponentialSmoothing(scores);
    const seasonality = this.analyzeSeasonality(scores);
    const anomalies = this.detectAnomalies(scores, { detectDrift: true });

    // サマリーの生成
    const trend = linearRegression.slope > 1 ? 'improving' : 
                  linearRegression.slope < -1 ? 'declining' : 'stable';
    
    const strength = Math.abs(linearRegression.slope) > 2 ? 'strong' :
                     Math.abs(linearRegression.slope) > 0.5 ? 'moderate' : 'weak';

    const reliability = linearRegression.reliability;

    // データ品質評価
    const dataQuality = scores.length >= 30 ? 'excellent' :
                        scores.length >= 15 ? 'good' :
                        scores.length >= 10 ? 'fair' : 'poor';

    // 予測の生成
    const nextWeek = linearRegression.predictNext(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const nextMonth = linearRegression.predictNext(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const confidence = this.predictWithConfidence(scores, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(trend, strength, anomalies, seasonality);

    // リスク評価
    const riskAssessment = this.assessRisk(trend, anomalies, linearRegression.reliability);

    return {
      summary: {
        trend,
        strength,
        reliability,
        dataQuality
      },
      linearRegression,
      exponentialSmoothing,
      seasonality,
      anomalies,
      predictions: {
        nextWeek,
        nextMonth,
        confidence
      },
      recommendations,
      riskAssessment
    };
  }

  // Private helper methods

  private generateRecommendations(
    trend: 'improving' | 'declining' | 'stable',
    strength: 'strong' | 'moderate' | 'weak',
    anomalies: Anomaly[],
    seasonality: SeasonalityResult
  ): string[] {
    const recommendations: string[] = [];

    switch (trend) {
      case 'improving':
        recommendations.push('positive trend detected - continue current practices');
        if (strength === 'strong') {
          recommendations.push('strong improvement momentum - consider scaling successful strategies');
        }
        break;
      case 'declining':
        recommendations.push('declining trend requires immediate attention');
        recommendations.push('review recent changes and identify root causes');
        break;
      case 'stable':
        recommendations.push('stable performance - look for optimization opportunities');
        break;
    }

    if (anomalies.length > 0) {
      recommendations.push(`${anomalies.length} anomalies detected - investigate causes`);
    }

    if (seasonality.hasPattern) {
      recommendations.push('seasonal patterns detected - consider time-based optimizations');
    }

    return recommendations;
  }

  private assessRisk(
    trend: 'improving' | 'declining' | 'stable',
    anomalies: Anomaly[],
    reliability: 'high' | 'medium' | 'low'
  ): { level: 'low' | 'medium' | 'high'; factors: string[] } {
    const factors: string[] = [];
    let riskScore = 0;

    if (trend === 'declining') {
      riskScore += 3;
      factors.push('declining performance trend');
    }

    if (anomalies.length > 2) {
      riskScore += 2;
      factors.push('multiple anomalies detected');
    }

    if (reliability === 'low') {
      riskScore += 1;
      factors.push('low prediction reliability');
    }

    const level = riskScore >= 4 ? 'high' : riskScore >= 2 ? 'medium' : 'low';

    return { level, factors };
  }
}