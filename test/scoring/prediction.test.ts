import { AdvancedPredictionEngine } from '../../src/scoring/prediction';
import { HistoricalScore } from '../../src/scoring/history';

describe('AdvancedPredictionEngine', () => {
  let predictionEngine: AdvancedPredictionEngine;

  beforeEach(() => {
    predictionEngine = new AdvancedPredictionEngine();
  });

  describe('ARIMA Prediction', () => {
    test('should calculate ARIMA prediction for trending data', () => {
      const scores: HistoricalScore[] = Array.from({ length: 15 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 70 + i * 2 + Math.sin(i) * 3, // トレンド + ノイズ
        grade: 'C' as const
      }));

      const arima = predictionEngine.calculateARIMAPrediction(scores);

      expect(arima.nextValue).toBeGreaterThan(0);
      expect(arima.nextValue).toBeLessThanOrEqual(100);
      expect(arima.confidence).toBeGreaterThan(0);
      expect(arima.confidence).toBeLessThanOrEqual(1);
      expect(arima.forecast).toHaveLength(5);
      expect(arima.parameters).toEqual({ p: 1, d: 1, q: 1 });
      expect(arima.aic).toBeGreaterThan(0);
    });

    test('should handle custom ARIMA order parameters', () => {
      const scores: HistoricalScore[] = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 80 + Math.random() * 10,
        grade: 'B' as const
      }));

      const customOrder = { p: 2, d: 0, q: 1 };
      const arima = predictionEngine.calculateARIMAPrediction(scores, customOrder);

      expect(arima.parameters).toEqual(customOrder);
      expect(arima.nextValue).toBeDefined();
    });

    test('should throw error for insufficient data', () => {
      const scores: HistoricalScore[] = Array.from({ length: 5 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75,
        grade: 'C' as const
      }));

      expect(() => {
        predictionEngine.calculateARIMAPrediction(scores);
      }).toThrow('ARIMA予測には最低10個のデータポイントが必要です');
    });
  });

  describe('Polynomial Regression', () => {
    test('should calculate polynomial regression with quadratic fit', () => {
      const scores: HistoricalScore[] = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 60 + i * i, // 二次関数
        grade: 'C' as const
      }));

      const polynomial = predictionEngine.calculatePolynomialRegression(scores, 2);

      expect(polynomial.degree).toBe(2);
      expect(polynomial.coefficients).toHaveLength(3);
      expect(polynomial.rSquared).toBeGreaterThan(0.8); // 二次データなので高いR²
      expect(polynomial.equation).toContain('x^2');
      
      const futureDate = new Date('2024-01-11');
      const prediction = polynomial.predictNext(futureDate);
      expect(prediction).toBeGreaterThan(0);
      expect(prediction).toBeLessThanOrEqual(100);
    });

    test('should handle linear polynomial (degree 1)', () => {
      const scores: HistoricalScore[] = Array.from({ length: 8 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 70 + i * 3, // 線形
        grade: 'C' as const
      }));

      const polynomial = predictionEngine.calculatePolynomialRegression(scores, 1);

      expect(polynomial.degree).toBe(1);
      expect(polynomial.coefficients).toHaveLength(2);
      expect(polynomial.rSquared).toBeGreaterThan(0.9);
    });

    test('should throw error for insufficient data points', () => {
      const scores: HistoricalScore[] = Array.from({ length: 3 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75,
        grade: 'C' as const
      }));

      expect(() => {
        predictionEngine.calculatePolynomialRegression(scores, 2);
      }).toThrow('多項式回帰には最低4個のデータポイントが必要です');
    });
  });

  describe('Ensemble Prediction', () => {
    test('should combine multiple prediction methods', () => {
      const scores: HistoricalScore[] = Array.from({ length: 15 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75 + i * 2 + Math.sin(i * 0.5) * 5,
        grade: 'C' as const
      }));

      const ensemble = predictionEngine.generateEnsemblePrediction(scores);

      expect(ensemble.prediction).toBeGreaterThan(0);
      expect(ensemble.prediction).toBeLessThanOrEqual(100);
      expect(ensemble.confidence).toBeGreaterThan(0);
      expect(ensemble.confidence).toBeLessThanOrEqual(1);
      
      // 全ての手法が含まれているか確認
      expect(ensemble.methods.linearRegression).toBeDefined();
      expect(ensemble.methods.exponentialSmoothing).toBeDefined();
      expect(ensemble.methods.arima).toBeDefined();
      expect(ensemble.methods.polynomial).toBeDefined();
      
      // 重みの合計が1になるか確認
      const totalWeight = Object.values(ensemble.methods).reduce((sum, method) => sum + method.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 2);
      
      expect(ensemble.consensusStrength).toBeGreaterThanOrEqual(0);
      expect(ensemble.uncertainty).toBeGreaterThan(0);
    });

    test('should handle prediction with specific target date', () => {
      const scores: HistoricalScore[] = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 80 + i,
        grade: 'B' as const
      }));

      const targetDate = new Date('2024-01-15');
      const ensemble = predictionEngine.generateEnsemblePrediction(scores, targetDate);

      expect(ensemble.prediction).toBeDefined();
      expect(ensemble.methods.linearRegression.value).toBeGreaterThan(scores[scores.length - 1].score);
    });

    test('should provide reasonable consensus strength', () => {
      // より一貫したデータで高いコンセンサスを期待
      const consistentScores: HistoricalScore[] = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 80 + i * 0.5, // 一貫した小さな増加
        grade: 'B' as const
      }));

      const ensemble = predictionEngine.generateEnsemblePrediction(consistentScores);
      expect(ensemble.consensusStrength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Adaptive Prediction', () => {
    test('should provide multi-horizon adaptive predictions', () => {
      const scores: HistoricalScore[] = Array.from({ length: 20 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 70 + i * 1.5 + Math.sin(i * 0.3) * 8,
        grade: 'C' as const
      }));

      const adaptive = predictionEngine.generateAdaptivePrediction(scores);

      expect(adaptive.shortTerm).toBeGreaterThan(0);
      expect(adaptive.shortTerm).toBeLessThanOrEqual(100);
      expect(adaptive.mediumTerm).toBeGreaterThan(0);
      expect(adaptive.mediumTerm).toBeLessThanOrEqual(100);
      expect(adaptive.longTerm).toBeGreaterThan(0);
      expect(adaptive.longTerm).toBeLessThanOrEqual(100);
      
      // 適応的重みの検証
      expect(adaptive.adaptiveWeights.recent).toBeGreaterThanOrEqual(0);
      expect(adaptive.adaptiveWeights.trend).toBeGreaterThanOrEqual(0);
      expect(adaptive.adaptiveWeights.seasonal).toBeGreaterThanOrEqual(0);
      expect(adaptive.adaptiveWeights.noise).toBeGreaterThanOrEqual(0);
      
      // 重みの合計が妥当な範囲内にあるか
      const totalWeight = Object.values(adaptive.adaptiveWeights).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeGreaterThan(0.5);
      expect(totalWeight).toBeLessThanOrEqual(1.5);
      
      expect(['high', 'medium', 'low']).toContain(adaptive.reliability);
      expect(adaptive.recommendedHorizon).toBeGreaterThan(0);
    });

    test('should assess reliability based on data quality', () => {
      // 高品質データ（十分な量、一貫性）
      const highQualityScores: HistoricalScore[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 80 + i * 0.5 + Math.random() * 2, // 安定したトレンド
        grade: 'B' as const
      }));

      const highQualityPrediction = predictionEngine.generateAdaptivePrediction(highQualityScores);
      expect(['high', 'medium']).toContain(highQualityPrediction.reliability);

      // 低品質データ（少量、ノイジー）
      const lowQualityScores: HistoricalScore[] = Array.from({ length: 8 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 50 + Math.random() * 40, // 高いノイズ
        grade: 'D' as const
      }));

      const lowQualityPrediction = predictionEngine.generateAdaptivePrediction(lowQualityScores);
      expect(['medium', 'low']).toContain(lowQualityPrediction.reliability);
    });

    test('should throw error for insufficient data', () => {
      const scores: HistoricalScore[] = Array.from({ length: 5 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75,
        grade: 'C' as const
      }));

      expect(() => {
        predictionEngine.generateAdaptivePrediction(scores);
      }).toThrow('適応型予測には最低7個のデータポイントが必要です');
    });
  });

  describe('Integration and Edge Cases', () => {
    test('should handle boundary score values (0 and 100)', () => {
      const boundaryScores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 0, grade: 'F' as const },
        { date: new Date('2024-01-02'), score: 100, grade: 'A' as const },
        { date: new Date('2024-01-03'), score: 0, grade: 'F' as const },
        { date: new Date('2024-01-04'), score: 100, grade: 'A' as const },
        { date: new Date('2024-01-05'), score: 50, grade: 'D' as const },
        { date: new Date('2024-01-06'), score: 50, grade: 'D' as const },
        { date: new Date('2024-01-07'), score: 50, grade: 'D' as const },
        { date: new Date('2024-01-08'), score: 50, grade: 'D' as const },
        { date: new Date('2024-01-09'), score: 50, grade: 'D' as const },
        { date: new Date('2024-01-10'), score: 50, grade: 'D' as const }
      ];

      const ensemble = predictionEngine.generateEnsemblePrediction(boundaryScores);
      expect(ensemble.prediction).toBeGreaterThanOrEqual(0);
      expect(ensemble.prediction).toBeLessThanOrEqual(100);
    });

    test('should handle constant score values', () => {
      const constantScores: HistoricalScore[] = Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 75, // 全て同じ値
        grade: 'C' as const
      }));

      const ensemble = predictionEngine.generateEnsemblePrediction(constantScores);
      expect(ensemble.prediction).toBeGreaterThan(50);
      expect(ensemble.prediction).toBeLessThan(100);
      expect(ensemble.consensusStrength).toBeGreaterThanOrEqual(0); // コンセンサスの確認
    });

    test('should handle highly volatile scores', () => {
      const volatileScores: HistoricalScore[] = Array.from({ length: 15 }, (_, i) => ({
        date: new Date(`2024-01-${i + 1}`),
        score: 50 + Math.random() * 50, // 高い変動性
        grade: 'D' as const
      }));

      const adaptive = predictionEngine.generateAdaptivePrediction(volatileScores);
      expect(['high', 'medium', 'low']).toContain(adaptive.reliability);
      expect(adaptive.recommendedHorizon).toBeGreaterThan(0);
    });
  });
});