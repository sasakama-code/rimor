import { QualityScore, DetectionResult, ScoreBreakdown } from '../core/types';

export class ScoreCalculator {
  /**
   * 複数のプラグインスコアを集約して統合スコアを計算
   */
  aggregateScores(pluginScores: QualityScore[]): QualityScore {
    if (pluginScores.length === 0) {
      return {
        overall: 0,
        breakdown: { completeness: 0, correctness: 0, maintainability: 0 },
        confidence: 0,
        metadata: {}
      };
    }

    if (pluginScores.length === 1) {
      return { ...pluginScores[0] };
    }

    const weights = pluginScores.map(score => score.confidence || 0);
    const totalWeight = weights.reduce((sum, weight) => sum + (weight || 0), 0);

    if (totalWeight === 0) {
      return {
        overall: 0,
        breakdown: { completeness: 0, correctness: 0, maintainability: 0 },
        confidence: 0,
        metadata: {}
      };
    }

    // 加重平均によるスコア計算
    const aggregatedOverall = pluginScores.reduce((sum, score, index) => {
      return sum + (score.overall * (weights[index] || 0));
    }, 0) / (totalWeight || 1);

    const aggregatedBreakdown: ScoreBreakdown = {
      completeness: pluginScores.reduce((sum, score, index) => {
        return sum + ((score.breakdown?.completeness || 0) * (weights[index] || 0));
      }, 0) / (totalWeight || 1),
      correctness: pluginScores.reduce((sum, score, index) => {
        return sum + ((score.breakdown?.correctness || 0) * (weights[index] || 0));
      }, 0) / (totalWeight || 1),
      maintainability: pluginScores.reduce((sum, score, index) => {
        return sum + ((score.breakdown?.maintainability || 0) * (weights[index] || 0));
      }, 0) / (totalWeight || 1)
    };

    const aggregatedConfidence = this.calculateConfidenceScore(pluginScores);

    return {
      overall: this.normalizeScore(aggregatedOverall),
      breakdown: {
        completeness: this.normalizeScore(aggregatedBreakdown.completeness),
        correctness: this.normalizeScore(aggregatedBreakdown.correctness),
        maintainability: this.normalizeScore(aggregatedBreakdown.maintainability)
      },
      confidence: aggregatedConfidence,
      metadata: {
        aggregatedFrom: pluginScores.length,
        totalWeight
      }
    };
  }

  /**
   * 加重平均スコアを計算
   */
  calculateWeightedScore(values: number[], weights: number[] = []): number {
    if (values.length === 0) return 0;

    if (weights.length === 0 || weights.length !== values.length) {
      // 重みが指定されていない場合は単純平均
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = values.reduce((sum, value, index) => {
      return sum + (value * weights[index]);
    }, 0);

    return weightedSum / totalWeight;
  }

  /**
   * 信頼度スコアを計算
   */
  calculateConfidenceScore(scores: QualityScore[]): number {
    if (scores.length === 0) return 0;

    const totalConfidence = scores.reduce((sum, score) => sum + (score.confidence || 0), 0);
    return totalConfidence / scores.length;
  }

  /**
   * スコアを正規化（0-100の範囲にクランプし、小数点以下を調整）
   */
  normalizeScore(score: number, decimalPlaces: number = 1): number {
    const clamped = Math.max(0, Math.min(100, score));
    return Math.round(clamped * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
  }

  /**
   * トレンドスコアを計算（改善傾向を数値化）
   */
  calculateTrendScore(historicalScores: number[]): number {
    if (historicalScores.length < 2) return 0;

    // 線形回帰による傾向分析
    const n = historicalScores.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = historicalScores.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + (x * historicalScores[i]), 0);
    const sumXX = indices.reduce((sum, x) => sum + (x * x), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // 傾きを-1から1の範囲に正規化
    return Math.max(-1, Math.min(1, slope / 10));
  }

  /**
   * 検出結果からスコア内訳を生成
   */
  generateScoreBreakdown(detectionResults: DetectionResult[]): ScoreBreakdown {
    if (detectionResults.length === 0) {
      return { completeness: 0, correctness: 0, maintainability: 0 };
    }

    const dimensionScores = {
      completeness: [] as number[],
      correctness: [] as number[],
      maintainability: [] as number[]
    };

    // 検出結果を次元別に分類
    detectionResults.forEach(result => {
      const dimension = result.metadata?.dimension as string;
      if (dimension && dimension in dimensionScores) {
        // 信頼度に基づいてスコアを計算（高い信頼度 = 高いスコア）
        const score = result.confidence * 100;
        (dimensionScores as any)[dimension].push(score);
      }
    });

    // 各次元の平均スコアを計算
    const breakdown: ScoreBreakdown = {
      completeness: dimensionScores.completeness.length > 0 
        ? dimensionScores.completeness.reduce((sum, score) => sum + score, 0) / dimensionScores.completeness.length
        : 0,
      correctness: dimensionScores.correctness.length > 0
        ? dimensionScores.correctness.reduce((sum, score) => sum + score, 0) / dimensionScores.correctness.length
        : 0,
      maintainability: dimensionScores.maintainability.length > 0
        ? dimensionScores.maintainability.reduce((sum, score) => sum + score, 0) / dimensionScores.maintainability.length
        : 0
    };

    return {
      completeness: this.normalizeScore(breakdown.completeness),
      correctness: this.normalizeScore(breakdown.correctness),
      maintainability: this.normalizeScore(breakdown.maintainability)
    };
  }
}