/**
 * 高度な予測アルゴリズム - v0.4.0 Quality Score Calculator
 * 
 * 複数の予測手法を組み合わせた高精度予測システム
 */

import { HistoricalScore } from './history';
import { TrendAnalysisEngine, LinearRegressionResult, ExponentialSmoothingResult } from './trends';

/**
 * ARIMA (AutoRegressive Integrated Moving Average) 予測結果
 */
export interface ARIMAPrediction {
  nextValue: number;
  confidence: number;
  forecast: number[];
  parameters: {
    p: number; // AR order
    d: number; // Integration order
    q: number; // MA order
  };
  residuals: number[];
  aic: number; // Akaike Information Criterion
}

/**
 * アンサンブル予測結果
 */
export interface EnsemblePrediction {
  prediction: number;
  confidence: number;
  methods: {
    linearRegression: { value: number; weight: number; confidence: number };
    exponentialSmoothing: { value: number; weight: number; confidence: number };
    arima: { value: number; weight: number; confidence: number };
    polynomial: { value: number; weight: number; confidence: number };
  };
  consensusStrength: number; // 予測手法間の一致度
  uncertainty: number;
}

/**
 * 多項式回帰結果
 */
export interface PolynomialRegressionResult {
  coefficients: number[];
  degree: number;
  rSquared: number;
  equation: string;
  predictNext: (date: Date) => number;
}

/**
 * 適応型予測結果
 */
export interface AdaptivePrediction {
  shortTerm: number;   // 1週間後
  mediumTerm: number;  // 1ヶ月後
  longTerm: number;    // 3ヶ月後
  adaptiveWeights: {
    recent: number;
    trend: number;
    seasonal: number;
    noise: number;
  };
  reliability: 'high' | 'medium' | 'low';
  recommendedHorizon: number; // 推奨予測期間（日数）
}

/**
 * 高度予測エンジンクラス
 */
export class AdvancedPredictionEngine {
  private trendEngine: TrendAnalysisEngine;

  constructor() {
    this.trendEngine = new TrendAnalysisEngine();
  }

  /**
   * ARIMA予測の実行
   */
  calculateARIMAPrediction(scores: HistoricalScore[], order: { p: number; d: number; q: number } = { p: 1, d: 1, q: 1 }): ARIMAPrediction {
    if (scores.length < 10) {
      throw new Error('ARIMA予測には最低10個のデータポイントが必要です');
    }

    const values = scores.map(s => s.score);
    
    // 単純なARIMA(1,1,1)の実装（実際のプロダクションではより洗練されたライブラリを使用）
    const { p, d, q } = order;
    
    // 差分系列の計算（Integration）
    const differenceOrder = d;
    let workingValues = [...values];
    
    for (let i = 0; i < differenceOrder; i++) {
      const diffValues: number[] = [];
      for (let j = 1; j < workingValues.length; j++) {
        diffValues.push(workingValues[j] - workingValues[j - 1]);
      }
      workingValues = diffValues;
    }

    // AR+MA項の計算（簡略化実装）
    const lastValues = workingValues.slice(-Math.max(p, q));
    const arComponent = this.calculateARComponent(lastValues, p);
    const maComponent = this.calculateMAComponent(workingValues, q);
    
    const forecastDiff = arComponent + maComponent;
    
    // 差分から元の値に戻す
    let nextValue = values[values.length - 1] + forecastDiff;
    
    // 制約を適用（0-100の範囲）
    nextValue = Math.max(0, Math.min(100, nextValue));

    // 残差の計算
    const residuals = this.calculateResiduals(workingValues, p, q);
    const residualVariance = this.calculateVariance(residuals);
    
    // 信頼度の計算
    const confidence = Math.max(0.1, 1 - (residualVariance / 100));

    // AIC計算（簡略化）
    const n = workingValues.length;
    const k = p + q + 1;
    const logLikelihood = -0.5 * n * Math.log(2 * Math.PI * residualVariance) - 0.5 * residuals.reduce((sum, r) => sum + r * r, 0) / residualVariance;
    const aic = 2 * k - 2 * logLikelihood;

    // 複数期間の予測
    const forecast = [nextValue];
    for (let i = 1; i < 5; i++) {
      const futureValue = nextValue + (i * forecastDiff * 0.8); // 減衰係数を適用
      forecast.push(Math.max(0, Math.min(100, futureValue)));
    }

    return {
      nextValue,
      confidence,
      forecast,
      parameters: order,
      residuals,
      aic
    };
  }

  /**
   * 多項式回帰による予測
   */
  calculatePolynomialRegression(scores: HistoricalScore[], degree: number = 2): PolynomialRegressionResult {
    if (scores.length < degree + 2) {
      throw new Error(`多項式回帰には最低${degree + 2}個のデータポイントが必要です`);
    }

    // 時間軸の正規化（0から1の範囲）
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i / (n - 1));
    const y = scores.map(s => s.score);

    // 最小二乗法による係数計算
    const coefficients = this.fitPolynomial(x, y, degree);

    // R²の計算
    const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < y.length; i++) {
      const predicted = this.evaluatePolynomial(coefficients, x[i]);
      ssRes += Math.pow(y[i] - predicted, 2);
      ssTot += Math.pow(y[i] - yMean, 2);
    }
    
    const rSquared = 1 - (ssRes / ssTot);

    // 方程式の文字列表現
    const equation = this.polynomialToString(coefficients);

    // 予測関数
    const baseDate = scores[0].date.getTime();
    const timeSpan = scores[scores.length - 1].date.getTime() - baseDate;
    
    const predictNext = (date: Date): number => {
      const normalizedTime = (date.getTime() - baseDate) / timeSpan;
      const prediction = this.evaluatePolynomial(coefficients, normalizedTime);
      return Math.max(0, Math.min(100, prediction));
    };

    return {
      coefficients,
      degree,
      rSquared,
      equation,
      predictNext
    };
  }

  /**
   * アンサンブル予測（複数手法の統合）
   */
  generateEnsemblePrediction(scores: HistoricalScore[], targetDate?: Date): EnsemblePrediction {
    if (scores.length < 5) {
      throw new Error('アンサンブル予測には最低5個のデータポイントが必要です');
    }

    const predictions: any = {};
    const weights: any = {};
    
    try {
      // 線形回帰
      const linearRegression = this.trendEngine.calculateLinearRegression(scores);
      const targetDateForPrediction = targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      predictions.linearRegression = linearRegression.predictNext(targetDateForPrediction);
      weights.linearRegression = this.calculateMethodWeight(linearRegression.rSquared, 'linear');
    } catch (error) {
      predictions.linearRegression = scores[scores.length - 1].score;
      weights.linearRegression = 0.1;
    }

    try {
      // 指数平滑法
      const exponentialSmoothing = this.trendEngine.calculateExponentialSmoothing(scores);
      predictions.exponentialSmoothing = exponentialSmoothing.nextValue;
      weights.exponentialSmoothing = this.calculateMethodWeight(exponentialSmoothing.confidence, 'exponential');
    } catch (error) {
      predictions.exponentialSmoothing = scores[scores.length - 1].score;
      weights.exponentialSmoothing = 0.1;
    }

    try {
      // ARIMA
      const arima = this.calculateARIMAPrediction(scores);
      predictions.arima = arima.nextValue;
      weights.arima = this.calculateMethodWeight(arima.confidence, 'arima');
    } catch (error) {
      predictions.arima = scores[scores.length - 1].score;
      weights.arima = 0.1;
    }

    try {
      // 多項式回帰
      const polynomial = this.calculatePolynomialRegression(scores, 2);
      const targetDateForPrediction = targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      predictions.polynomial = polynomial.predictNext(targetDateForPrediction);
      weights.polynomial = this.calculateMethodWeight(polynomial.rSquared, 'polynomial');
    } catch (error) {
      predictions.polynomial = scores[scores.length - 1].score;
      weights.polynomial = 0.1;
    }

    // 重み付き平均による最終予測
    const totalWeight = Object.values(weights).reduce((sum: number, w: any) => sum + w, 0);
    const normalizedWeights = Object.fromEntries(
      Object.entries(weights).map(([key, weight]: [string, any]) => [key, weight / totalWeight])
    );

    let finalPrediction = Object.entries(predictions).reduce((sum, [method, value]: [string, any]) => {
      const weight = normalizedWeights[method] || 0;
      const safeValue = isNaN(value) || !isFinite(value) ? scores[scores.length - 1].score : value;
      return sum + safeValue * weight;
    }, 0);
    
    // NaNチェック
    if (isNaN(finalPrediction) || !isFinite(finalPrediction) || finalPrediction === 0) {
      finalPrediction = scores[scores.length - 1].score;
    }

    // 全体的な信頼度
    const weightedConfidence = Object.entries(normalizedWeights).reduce((sum, [method, weight]: [string, any]) => {
      const methodConfidence = this.getMethodConfidence(method, predictions[method], scores);
      return sum + methodConfidence * weight;
    }, 0);
    
    // コンセンサス強度を計算
    const predictionValues = Object.values(predictions) as number[];
    const validPredictions = predictionValues.filter(val => !isNaN(val) && isFinite(val));
    let consensusStrength = 0;
    
    if (validPredictions.length > 0) {
      const mean = validPredictions.reduce((sum, val) => sum + val, 0) / validPredictions.length;
      const variance = validPredictions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validPredictions.length;
      consensusStrength = Math.max(0, 1 - (Math.sqrt(variance) / 20));
    }

    return {
      prediction: Math.max(0, Math.min(100, finalPrediction)),
      confidence: weightedConfidence,
      methods: {
        linearRegression: {
          value: predictions.linearRegression,
          weight: normalizedWeights.linearRegression,
          confidence: weights.linearRegression
        },
        exponentialSmoothing: {
          value: predictions.exponentialSmoothing,
          weight: normalizedWeights.exponentialSmoothing,
          confidence: weights.exponentialSmoothing
        },
        arima: {
          value: predictions.arima,
          weight: normalizedWeights.arima,
          confidence: weights.arima
        },
        polynomial: {
          value: predictions.polynomial,
          weight: normalizedWeights.polynomial,
          confidence: weights.polynomial
        }
      },
      consensusStrength,
      uncertainty: Math.max(0, 1 - consensusStrength)
    };
  }

  /**
   * 適応型予測（時間軸別最適化）
   */
  generateAdaptivePrediction(scores: HistoricalScore[]): AdaptivePrediction {
    if (scores.length < 7) {
      throw new Error('適応型予測には最低7個のデータポイントが必要です');
    }

    // 時間軸別の重み付けを計算
    const recentWeight = this.calculateRecentDataWeight(scores);
    const trendWeight = this.calculateTrendWeight(scores);
    const seasonalWeight = this.calculateSeasonalWeight(scores);
    const noiseWeight = 1 - (recentWeight + trendWeight + seasonalWeight);

    // 各時間軸での予測
    const shortTermDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const mediumTermDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const longTermDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const shortTerm = this.generateEnsemblePrediction(scores.slice(-7), shortTermDate).prediction;
    const mediumTerm = this.generateEnsemblePrediction(scores.slice(-14), mediumTermDate).prediction;
    const longTerm = this.generateEnsemblePrediction(scores, longTermDate).prediction;

    // 信頼性評価
    const dataQuality = this.assessDataQuality(scores);
    const reliability = dataQuality > 0.8 ? 'high' : dataQuality > 0.5 ? 'medium' : 'low';

    // 推奨予測期間
    const recommendedHorizon = this.calculateRecommendedHorizon(scores, reliability);

    return {
      shortTerm: Math.max(0, Math.min(100, shortTerm)),
      mediumTerm: Math.max(0, Math.min(100, mediumTerm)),
      longTerm: Math.max(0, Math.min(100, longTerm)),
      adaptiveWeights: {
        recent: recentWeight,
        trend: trendWeight,
        seasonal: seasonalWeight,
        noise: Math.max(0, noiseWeight)
      },
      reliability,
      recommendedHorizon
    };
  }

  // Private helper methods

  private calculateARComponent(values: number[], p: number): number {
    if (p === 0 || values.length < p) return 0;
    
    // 簡単なAR(1)実装
    const lastValue = values[values.length - 1];
    const prevValue = values[values.length - 2] || lastValue;
    const phi = 0.7; // AR係数（実際は推定が必要）
    
    return phi * (lastValue - prevValue);
  }

  private calculateMAComponent(values: number[], q: number): number {
    if (q === 0 || values.length < q + 1) return 0;
    
    // 簡単なMA(1)実装
    const errors = this.calculateResiduals(values, 1, 0);
    const lastError = errors[errors.length - 1] || 0;
    const theta = 0.3; // MA係数（実際は推定が必要）
    
    return theta * lastError;
  }

  private calculateResiduals(values: number[], p: number, q: number): number[] {
    const residuals: number[] = [];
    
    for (let i = Math.max(p, q); i < values.length; i++) {
      const actual = values[i];
      const predicted = values[i - 1]; // 簡略化した予測値
      residuals.push(actual - predicted);
    }
    
    return residuals;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  private fitPolynomial(x: number[], y: number[], degree: number): number[] {
    const n = x.length;
    const m = degree + 1;
    
    // 正規方程式の行列を構築
    const A: number[][] = [];
    const b: number[] = [];
    
    for (let i = 0; i < m; i++) {
      const row: number[] = [];
      for (let j = 0; j < m; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += Math.pow(x[k], i + j);
        }
        row.push(sum);
      }
      A.push(row);
      
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += y[k] * Math.pow(x[k], i);
      }
      b.push(sum);
    }
    
    // ガウス消去法で係数を求める（簡略化実装）
    return this.solveLinearSystem(A, b);
  }

  private solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // 前進消去
    for (let i = 0; i < n; i++) {
      // ピボット選択
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // 消去
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // 後退代入
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }
    
    return x;
  }

  private evaluatePolynomial(coefficients: number[], x: number): number {
    let result = 0;
    for (let i = 0; i < coefficients.length; i++) {
      result += coefficients[i] * Math.pow(x, i);
    }
    return result;
  }

  private polynomialToString(coefficients: number[]): string {
    const terms: string[] = [];
    
    for (let i = coefficients.length - 1; i >= 0; i--) {
      const coeff = coefficients[i];
      if (Math.abs(coeff) < 1e-10) continue;
      
      let term = '';
      if (i === 0) {
        term = coeff.toFixed(3);
      } else if (i === 1) {
        term = `${coeff.toFixed(3)}x`;
      } else {
        term = `${coeff.toFixed(3)}x^${i}`;
      }
      
      terms.push(term);
    }
    
    return terms.length > 0 ? `y = ${terms.join(' + ')}` : 'y = 0';
  }

  private calculateMethodWeight(confidence: number, method: string): number {
    const baseWeight = confidence;
    
    // 手法別の調整
    switch (method) {
      case 'linear': return baseWeight * 1.0;
      case 'exponential': return baseWeight * 1.1;
      case 'arima': return baseWeight * 0.9;
      case 'polynomial': return baseWeight * 0.8;
      default: return baseWeight;
    }
  }

  private getMethodConfidence(method: string, prediction: number, scores: HistoricalScore[]): number {
    // 手法の一般的信頼性に基づいた評価
    const baseConfidence: { [key: string]: number } = {
      linearRegression: 0.7,
      exponentialSmoothing: 0.8,
      arima: 0.75,
      polynomial: 0.65
    };
    
    return baseConfidence[method] || 0.5;
  }

  private calculateRecentDataWeight(scores: HistoricalScore[]): number {
    // 最新データの重要度（急激な変化がある場合は高く）
    const recentScores = scores.slice(-3);
    const olderScores = scores.slice(-6, -3);
    
    if (recentScores.length < 2 || olderScores.length < 2) return 0.3;
    
    const recentMean = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
    const olderMean = olderScores.reduce((sum, s) => sum + s.score, 0) / olderScores.length;
    
    const change = Math.abs(recentMean - olderMean);
    return Math.min(0.5, change / 20); // 最大50%
  }

  private calculateTrendWeight(scores: HistoricalScore[]): number {
    // トレンドの明確さに基づく重み
    const metrics = this.trendEngine.calculateLinearRegression(scores);
    return Math.min(0.4, metrics.rSquared * 0.4);
  }

  private calculateSeasonalWeight(scores: HistoricalScore[]): number {
    // 季節性パターンの強さに基づく重み
    const seasonality = this.trendEngine.analyzeSeasonality(scores);
    return seasonality.hasPattern ? Math.min(0.3, seasonality.strength * 0.3) : 0;
  }

  private assessDataQuality(scores: HistoricalScore[]): number {
    // データ品質の評価
    const completeness = scores.length >= 30 ? 1 : scores.length / 30;
    
    // データの一貫性（欠損値がないことを前提）
    const consistency = 1;
    
    // データの変動性（適度な変動があることが重要）
    const values = scores.map(s => s.score);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    // 変動性の評価（高すぎる変動は低品質、低すぎる変動も低品質）
    const stdDev = Math.sqrt(variance);
    let variability;
    if (stdDev < 1) {
      variability = 0.3; // 変動が少なすぎる
    } else if (stdDev > 25) {
      variability = 0.2; // 変動が大きすぎる
    } else {
      variability = Math.min(1, 15 / stdDev); // 適度な変動
    }
    
    return (completeness + consistency + variability) / 3;
  }

  private calculateRecommendedHorizon(scores: HistoricalScore[], reliability: 'high' | 'medium' | 'low'): number {
    const baseHorizon = {
      high: 30,
      medium: 14,
      low: 7
    };
    
    // データ量による調整
    const dataAdjustment = Math.min(1, scores.length / 20);
    
    return Math.floor(baseHorizon[reliability] * dataAdjustment);
  }
}