import { ScoreCalculator } from '../../src/utils/scoreCalculator';
import { QualityScore, DetectionResult } from '../../src/core/types';

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  describe('aggregateScores', () => {
    it('should aggregate scores from multiple plugins correctly', () => {
      const pluginScores: QualityScore[] = [
        {
          overall: 80,
          breakdown: { completeness: 85, correctness: 75, maintainability: 80 },
          confidence: 0.9
        },
        {
          overall: 70,
          breakdown: { completeness: 75, correctness: 65, maintainability: 70 },
          confidence: 0.8
        }
      ];

      const aggregated = calculator.aggregateScores(pluginScores);

      expect(aggregated.overall).toBeCloseTo(75.3, 1); // 加重平均 (80*0.9 + 70*0.8) / (0.9+0.8)
      expect(aggregated.breakdown?.completeness).toBeCloseTo(80.3, 1);
      expect(aggregated.breakdown?.correctness).toBeCloseTo(70.3, 1);
      expect(aggregated.breakdown?.maintainability).toBeCloseTo(75.3, 1);
      expect(aggregated.confidence).toBeCloseTo(0.85, 2);
    });

    it('should handle empty scores array', () => {
      const aggregated = calculator.aggregateScores([]);

      expect(aggregated.overall).toBe(0);
      expect(aggregated.breakdown?.completeness).toBe(0);
      expect(aggregated.breakdown?.correctness).toBe(0);
      expect(aggregated.breakdown?.maintainability).toBe(0);
      expect(aggregated.confidence).toBe(0);
    });

    it('should handle single score', () => {
      const score: QualityScore = {
        overall: 85,
        breakdown: { completeness: 90, correctness: 80, maintainability: 85 },
        confidence: 0.95
      };

      const aggregated = calculator.aggregateScores([score]);

      expect(aggregated.overall).toBe(85);
      expect(aggregated.breakdown?.completeness).toBe(90);
      expect(aggregated.breakdown?.correctness).toBe(80);
      expect(aggregated.breakdown?.maintainability).toBe(85);
      expect(aggregated.confidence).toBe(0.95);
    });
  });

  describe('calculateWeightedScore', () => {
    it('should calculate weighted score correctly', () => {
      const values = [80, 70, 90];
      const weights = [0.5, 0.3, 0.2];

      const result = calculator.calculateWeightedScore(values, weights);

      expect(result).toBeCloseTo(79, 1); // (80*0.5 + 70*0.3 + 90*0.2) / 1.0
    });

    it('should handle equal weights when weights array is empty', () => {
      const values = [80, 70, 90];
      const weights: number[] = [];

      const result = calculator.calculateWeightedScore(values, weights);

      expect(result).toBeCloseTo(80, 0); // (80 + 70 + 90) / 3
    });

    it('should normalize weights correctly', () => {
      const values = [80, 70];
      const weights = [2, 1]; // Should be normalized to [0.67, 0.33]

      const result = calculator.calculateWeightedScore(values, weights);

      expect(result).toBeCloseTo(76.67, 1); // (80*2/3 + 70*1/3)
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should calculate average confidence correctly', () => {
      const scores: QualityScore[] = [
        { overall: 80, breakdown: { completeness: 0, correctness: 0, maintainability: 0 }, confidence: 0.9 },
        { overall: 70, breakdown: { completeness: 0, correctness: 0, maintainability: 0 }, confidence: 0.8 },
        { overall: 90, breakdown: { completeness: 0, correctness: 0, maintainability: 0 }, confidence: 0.7 }
      ];

      const confidence = calculator.calculateConfidenceScore(scores);

      expect(confidence).toBeCloseTo(0.8, 1); // (0.9 + 0.8 + 0.7) / 3
    });

    it('should return 0 for empty scores', () => {
      const confidence = calculator.calculateConfidenceScore([]);

      expect(confidence).toBe(0);
    });
  });

  describe('normalizeScore', () => {
    it('should clamp scores to valid range', () => {
      expect(calculator.normalizeScore(-10)).toBe(0);
      expect(calculator.normalizeScore(150)).toBe(100);
      expect(calculator.normalizeScore(75)).toBe(75);
    });

    it('should round scores to specified decimal places', () => {
      expect(calculator.normalizeScore(75.6789, 2)).toBe(75.68);
      expect(calculator.normalizeScore(75.6789, 0)).toBe(76);
    });
  });

  describe('calculateTrendScore', () => {
    it('should calculate positive trend correctly', () => {
      const historicalScores = [60, 70, 80, 85];

      const trend = calculator.calculateTrendScore(historicalScores);

      expect(trend).toBeGreaterThan(0);
      expect(trend).toBeLessThanOrEqual(1);
    });

    it('should calculate negative trend correctly', () => {
      const historicalScores = [90, 80, 70, 60];

      const trend = calculator.calculateTrendScore(historicalScores);

      expect(trend).toBeLessThan(0);
      expect(trend).toBeGreaterThanOrEqual(-1);
    });

    it('should return 0 for stable scores', () => {
      const historicalScores = [75, 75, 75, 75];

      const trend = calculator.calculateTrendScore(historicalScores);

      expect(trend).toBeCloseTo(0, 1);
    });

    it('should handle insufficient data', () => {
      const historicalScores = [75];

      const trend = calculator.calculateTrendScore(historicalScores);

      expect(trend).toBe(0);
    });
  });

  describe('generateScoreBreakdown', () => {
    it('should generate detailed breakdown from detection results', () => {
      const detectionResults: DetectionResult[] = [
        {
          patternId: 'complete-test-suite',
          patternName: 'Complete Test Suite',
          location: { file: 'test.ts', line: 1, column: 1 },
          confidence: 0.9,
          evidence: [],
          metadata: { dimension: 'completeness' }
        },
        {
          patternId: 'strong-assertion',
          patternName: 'Strong Assertion',
          location: { file: 'test.ts', line: 10, column: 5 },
          confidence: 0.8,
          evidence: [],
          metadata: { dimension: 'correctness' }
        }
      ];

      const breakdown = calculator.generateScoreBreakdown(detectionResults);

      expect(breakdown.completeness).toBeGreaterThan(0);
      expect(breakdown.correctness).toBeGreaterThan(0);
      expect(breakdown.maintainability).toBeDefined();
    });

    it('should handle empty detection results', () => {
      const breakdown = calculator.generateScoreBreakdown([]);

      expect(breakdown.completeness).toBe(0);
      expect(breakdown.correctness).toBe(0);
      expect(breakdown.maintainability).toBe(0);
    });
  });
});