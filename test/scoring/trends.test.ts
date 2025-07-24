import { TrendAnalysisEngine } from '../../src/scoring/trends';
import { HistoricalScore } from '../../src/scoring/history';

describe('TrendAnalysisEngine', () => {
  let trendEngine: TrendAnalysisEngine;

  beforeEach(() => {
    trendEngine = new TrendAnalysisEngine();
  });

  describe('Linear Regression Analysis', () => {
    test('should calculate linear regression for improving trend', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 70, grade: 'C' },
        { date: new Date('2024-01-02'), score: 75, grade: 'C' },
        { date: new Date('2024-01-03'), score: 80, grade: 'B' },
        { date: new Date('2024-01-04'), score: 85, grade: 'B' },
        { date: new Date('2024-01-05'), score: 90, grade: 'A' }
      ];

      const regression = trendEngine.calculateLinearRegression(scores);

      expect(regression.slope).toBeGreaterThan(0);
      expect(regression.rSquared).toBeGreaterThan(0.8);
      expect(regression.equation).toBeDefined();
      expect(regression.predictNext(new Date('2024-01-06'))).toBeGreaterThan(90);
    });

    test('should calculate linear regression for declining trend', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 90, grade: 'A' },
        { date: new Date('2024-01-02'), score: 85, grade: 'B' },
        { date: new Date('2024-01-03'), score: 80, grade: 'B' },
        { date: new Date('2024-01-04'), score: 75, grade: 'C' },
        { date: new Date('2024-01-05'), score: 70, grade: 'C' }
      ];

      const regression = trendEngine.calculateLinearRegression(scores);

      expect(regression.slope).toBeLessThan(0);
      expect(regression.rSquared).toBeGreaterThan(0.8);
      expect(regression.predictNext(new Date('2024-01-06'))).toBeLessThan(70);
    });

    test('should handle noisy data with moderate correlation', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 70, grade: 'C' },
        { date: new Date('2024-01-02'), score: 72, grade: 'C' },
        { date: new Date('2024-01-03'), score: 68, grade: 'D' },
        { date: new Date('2024-01-04'), score: 76, grade: 'C' },
        { date: new Date('2024-01-05'), score: 74, grade: 'C' }
      ];

      const regression = trendEngine.calculateLinearRegression(scores);

      expect(regression.rSquared).toBeLessThanOrEqual(0.5);
      expect(regression.reliability).toBe('low');
    });
  });

  describe('Exponential Smoothing', () => {
    test('should calculate exponential smoothing prediction', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 70, grade: 'C' },
        { date: new Date('2024-01-02'), score: 72, grade: 'C' },
        { date: new Date('2024-01-03'), score: 75, grade: 'C' },
        { date: new Date('2024-01-04'), score: 78, grade: 'C' },
        { date: new Date('2024-01-05'), score: 80, grade: 'B' }
      ];

      const prediction = trendEngine.calculateExponentialSmoothing(scores, 0.3);

      expect(prediction.nextValue).toBeGreaterThan(75);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.smoothedValues).toHaveLength(scores.length);
    });

    test('should handle alpha parameter variations', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 80, grade: 'B' },
        { date: new Date('2024-01-02'), score: 82, grade: 'B' },
        { date: new Date('2024-01-03'), score: 85, grade: 'B' }
      ];

      const highAlpha = trendEngine.calculateExponentialSmoothing(scores, 0.9);
      const lowAlpha = trendEngine.calculateExponentialSmoothing(scores, 0.1);

      // 高いアルファ値は最新データにより敏感
      expect(Math.abs(highAlpha.nextValue - scores[scores.length - 1].score))
        .toBeLessThan(Math.abs(lowAlpha.nextValue - scores[scores.length - 1].score));
    });
  });

  describe('Seasonal Analysis', () => {
    test('should detect weekly patterns', () => {
      const scores: HistoricalScore[] = [];
      const baseDate = new Date('2024-01-01'); // Monday

      // 週次パターンを生成（月曜日が高く、金曜日が低い）
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const date = new Date(baseDate.getTime() + (week * 7 + day) * 24 * 60 * 60 * 1000);
          const score = 80 + (day === 0 ? 10 : day === 4 ? -10 : 0) + Math.random() * 5;
          scores.push({ date, score, grade: 'B' });
        }
      }

      const seasonality = trendEngine.analyzeSeasonality(scores, 'weekly');

      expect(seasonality.hasPattern).toBe(true);
      expect(seasonality.strength).toBeGreaterThan(0.3);
      expect(seasonality.pattern).toHaveLength(7);
      expect(seasonality.pattern[0]).toBeGreaterThan(seasonality.pattern[4]); // 月曜日 > 金曜日
    });

    test('should handle data without seasonal patterns', () => {
      const scores: HistoricalScore[] = [];
      const baseDate = new Date('2024-01-01');

      // ランダムなスコア（パターンなし）
      for (let i = 0; i < 30; i++) {
        const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        const score = 75 + Math.random() * 10;
        scores.push({ date, score, grade: 'C' });
      }

      const seasonality = trendEngine.analyzeSeasonality(scores, 'weekly');

      expect(seasonality.hasPattern).toBe(false);
      expect(seasonality.strength).toBeLessThan(0.3);
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect score anomalies using statistical methods', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 80, grade: 'B' },
        { date: new Date('2024-01-02'), score: 82, grade: 'B' },
        { date: new Date('2024-01-03'), score: 81, grade: 'B' },
        { date: new Date('2024-01-04'), score: 83, grade: 'B' },
        { date: new Date('2024-01-05'), score: 95, grade: 'A' }, // 異常値
        { date: new Date('2024-01-06'), score: 79, grade: 'C' },
        { date: new Date('2024-01-07'), score: 80, grade: 'B' }
      ];

      const anomalies = trendEngine.detectAnomalies(scores);

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].score).toBe(95);
      expect(['low', 'medium', 'high']).toContain(anomalies[0].severity);
      expect(anomalies[0].type).toBe('spike');
      expect(anomalies[0].explanation).toContain('標準偏差');
    });

    test('should detect gradual drift anomalies', () => {
      const scores: HistoricalScore[] = [];
      const baseDate = new Date('2024-01-01');

      // 最初は安定、途中から急激に低下
      for (let i = 0; i < 10; i++) {
        const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        const score = i < 5 ? 85 + Math.random() * 3 : 60 + Math.random() * 3;
        scores.push({ date, score, grade: score > 80 ? 'B' : 'D' });
      }

      const anomalies = trendEngine.detectAnomalies(scores, { detectDrift: true });

      expect(anomalies.length).toBeGreaterThan(0);
      const driftAnomaly = anomalies.find(a => a.type === 'drift');
      expect(driftAnomaly).toBeDefined();
    });
  });

  describe('Comparative Analysis', () => {
    test('should compare current performance with historical benchmarks', () => {
      const historicalScores: HistoricalScore[] = [
        { date: new Date('2023-12-01'), score: 75, grade: 'C' },
        { date: new Date('2023-12-02'), score: 76, grade: 'C' },
        { date: new Date('2023-12-03'), score: 78, grade: 'C' }
      ];

      const currentScores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 85, grade: 'B' },
        { date: new Date('2024-01-02'), score: 87, grade: 'B' },
        { date: new Date('2024-01-03'), score: 90, grade: 'A' }
      ];

      const comparison = trendEngine.compareWithBaseline(currentScores, historicalScores);

      expect(comparison.improvement).toBeGreaterThan(10);
      expect(comparison.percentChange).toBeGreaterThan(0);
      expect(comparison.significance).toBe('high');
      expect(comparison.interpretation).toContain('改善');
    });

    test('should identify performance regression', () => {
      const historicalScores: HistoricalScore[] = [
        { date: new Date('2023-12-01'), score: 90, grade: 'A' },
        { date: new Date('2023-12-02'), score: 92, grade: 'A' },
        { date: new Date('2023-12-03'), score: 89, grade: 'B' }
      ];

      const currentScores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 75, grade: 'C' },
        { date: new Date('2024-01-02'), score: 73, grade: 'C' },
        { date: new Date('2024-01-03'), score: 78, grade: 'C' }
      ];

      const comparison = trendEngine.compareWithBaseline(currentScores, historicalScores);

      expect(comparison.improvement).toBeLessThan(-10);
      expect(comparison.percentChange).toBeLessThan(0);
      expect(comparison.significance).toBe('high');
      expect(comparison.interpretation).toContain('低下');
    });
  });

  describe('Confidence Intervals', () => {
    test('should calculate prediction confidence intervals', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 70, grade: 'C' },
        { date: new Date('2024-01-02'), score: 72, grade: 'C' },
        { date: new Date('2024-01-03'), score: 75, grade: 'C' },
        { date: new Date('2024-01-04'), score: 78, grade: 'C' },
        { date: new Date('2024-01-05'), score: 80, grade: 'B' }
      ];

      const prediction = trendEngine.predictWithConfidence(
        scores,
        new Date('2024-01-06'),
        0.95 // 95% confidence level
      );

      expect(prediction.predictedValue).toBeGreaterThan(80);
      expect(prediction.confidenceInterval.lower).toBeLessThan(prediction.predictedValue);
      expect(prediction.confidenceInterval.upper).toBeGreaterThan(prediction.predictedValue);
      expect(prediction.confidenceLevel).toBe(0.95);
      expect(prediction.method).toBeDefined();
    });

    test('should provide wider intervals for less reliable predictions', () => {
      const noisyScores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 70, grade: 'C' },
        { date: new Date('2024-01-02'), score: 85, grade: 'B' },
        { date: new Date('2024-01-03'), score: 60, grade: 'D' },
        { date: new Date('2024-01-04'), score: 90, grade: 'A' },
        { date: new Date('2024-01-05'), score: 55, grade: 'F' }
      ];

      const stableScores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 78, grade: 'C' },
        { date: new Date('2024-01-02'), score: 79, grade: 'C' },
        { date: new Date('2024-01-03'), score: 80, grade: 'B' },
        { date: new Date('2024-01-04'), score: 81, grade: 'B' },
        { date: new Date('2024-01-05'), score: 82, grade: 'B' }
      ];

      const noisyPrediction = trendEngine.predictWithConfidence(noisyScores, new Date('2024-01-06'));
      const stablePrediction = trendEngine.predictWithConfidence(stableScores, new Date('2024-01-06'));

      const noisyRange = noisyPrediction.confidenceInterval.upper - noisyPrediction.confidenceInterval.lower;
      const stableRange = stablePrediction.confidenceInterval.upper - stablePrediction.confidenceInterval.lower;

      expect(noisyRange).toBeGreaterThan(stableRange);
    });
  });

  describe('Integration Tests', () => {
    test('should provide comprehensive trend analysis', () => {
      const scores: HistoricalScore[] = [
        { date: new Date('2024-01-01'), score: 60, grade: 'D' },
        { date: new Date('2024-01-02'), score: 65, grade: 'D' },
        { date: new Date('2024-01-03'), score: 70, grade: 'C' },
        { date: new Date('2024-01-04'), score: 75, grade: 'C' },
        { date: new Date('2024-01-05'), score: 80, grade: 'B' },
        { date: new Date('2024-01-06'), score: 85, grade: 'B' }
      ];

      const analysis = trendEngine.generateComprehensiveAnalysis(scores);

      expect(analysis.summary.trend).toBe('improving');
      expect(analysis.summary.strength).toBe('strong');
      expect(analysis.summary.reliability).toBe('high');

      expect(analysis.linearRegression).toBeDefined();
      expect(analysis.exponentialSmoothing).toBeDefined();
      expect(analysis.anomalies).toBeDefined();
      expect(analysis.seasonality).toBeDefined();

      expect(analysis.predictions.nextWeek).toBeGreaterThan(85);
      expect(analysis.predictions.nextMonth).toBeGreaterThan(90);

      expect(analysis.recommendations.some(r => r.includes('positive'))).toBe(true);
      expect(analysis.riskAssessment.level).toBe('low');
    });
  });
});