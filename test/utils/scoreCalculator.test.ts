import { ScoreCalculatorV2 as ScoreCalculator } from '../../src/scoring/calculator';
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
          dimensions: { completeness: 85, correctness: 75, maintainability: 80 },
          confidence: 0.9
        },
        {
          overall: 70,
          dimensions: { completeness: 75, correctness: 65, maintainability: 70 },
          confidence: 0.8
        }
      ];

      const aggregated = calculator.aggregateScores(pluginScores);

      expect(aggregated.score).toBeCloseTo(75.3, 1); // 加重平均 (80*0.9 + 70*0.8) / (0.9+0.8)
      expect(aggregated.confidence).toBeCloseTo(0.85, 2);
      expect(aggregated.metadata.aggregatedFrom).toBe(2);
    });

    it('should handle empty scores array', () => {
      const aggregated = calculator.aggregateScores([]);

      expect(aggregated.score).toBe(0);
      expect(aggregated.confidence).toBe(0);
      expect(aggregated.metadata.aggregatedFrom).toBe(0);
    });

    it('should handle single score', () => {
      const score: QualityScore = {
        overall: 85,
        dimensions: { completeness: 90, correctness: 80, maintainability: 85 },
        confidence: 0.95
      };

      const aggregated = calculator.aggregateScores([score]);

      expect(aggregated.score).toBe(85);
      expect(aggregated.confidence).toBe(0.95);
      expect(aggregated.metadata.aggregatedFrom).toBe(1);
    });
  });

});