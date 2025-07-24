import { 
  DEFAULT_WEIGHTS, 
  GRADE_THRESHOLDS,
  DimensionType,
  GradeType,
  WeightConfig,
  FileScore,
  DirectoryScore,
  ProjectScore
} from '../../src/scoring/types';

describe('Scoring Types', () => {
  describe('DEFAULT_WEIGHTS', () => {
    test('should have all required dimension weights', () => {
      const dimensions = DEFAULT_WEIGHTS.dimensions;
      
      expect(dimensions.completeness).toBeDefined();
      expect(dimensions.correctness).toBeDefined();
      expect(dimensions.maintainability).toBeDefined();
      expect(dimensions.performance).toBeDefined();
      expect(dimensions.security).toBeDefined();
    });

    test('should have positive weight values', () => {
      const dimensions = DEFAULT_WEIGHTS.dimensions;
      
      expect(dimensions.completeness).toBeGreaterThan(0);
      expect(dimensions.correctness).toBeGreaterThan(0);
      expect(dimensions.maintainability).toBeGreaterThan(0);
      expect(dimensions.performance).toBeGreaterThan(0);
      expect(dimensions.security).toBeGreaterThan(0);
    });

    test('should prioritize correctness over other dimensions', () => {
      const dimensions = DEFAULT_WEIGHTS.dimensions;
      
      expect(dimensions.correctness).toBeGreaterThan(dimensions.completeness);
      expect(dimensions.correctness).toBeGreaterThan(dimensions.maintainability);
      expect(dimensions.correctness).toBeGreaterThan(dimensions.performance);
    });

    test('should have security higher priority than performance', () => {
      const dimensions = DEFAULT_WEIGHTS.dimensions;
      
      expect(dimensions.security).toBeGreaterThan(dimensions.performance);
    });
  });

  describe('GRADE_THRESHOLDS', () => {
    test('should have correct grade boundaries', () => {
      expect(GRADE_THRESHOLDS.A).toBe(90);
      expect(GRADE_THRESHOLDS.B).toBe(80);
      expect(GRADE_THRESHOLDS.C).toBe(70);
      expect(GRADE_THRESHOLDS.D).toBe(60);
      expect(GRADE_THRESHOLDS.F).toBe(0);
    });

    test('should have descending threshold order', () => {
      expect(GRADE_THRESHOLDS.A).toBeGreaterThan(GRADE_THRESHOLDS.B);
      expect(GRADE_THRESHOLDS.B).toBeGreaterThan(GRADE_THRESHOLDS.C);
      expect(GRADE_THRESHOLDS.C).toBeGreaterThan(GRADE_THRESHOLDS.D);
      expect(GRADE_THRESHOLDS.D).toBeGreaterThan(GRADE_THRESHOLDS.F);
    });

    test('should cover full 0-100 range', () => {
      expect(GRADE_THRESHOLDS.F).toBe(0);
      expect(GRADE_THRESHOLDS.A).toBeLessThanOrEqual(100);
    });
  });

  describe('Type Validation', () => {
    test('DimensionType should include all required dimensions', () => {
      const dimensions: DimensionType[] = [
        'completeness', 
        'correctness', 
        'maintainability', 
        'performance', 
        'security'
      ];
      
      expect(dimensions).toHaveLength(5);
    });

    test('GradeType should include all grade levels', () => {
      const grades: GradeType[] = ['A', 'B', 'C', 'D', 'F'];
      
      expect(grades).toHaveLength(5);
    });
  });

  describe('WeightConfig Structure', () => {
    test('should accept valid weight configuration', () => {
      const config: WeightConfig = {
        plugins: {
          'test-plugin': 1.0,
          'assertion-plugin': 1.5
        },
        dimensions: {
          completeness: 1.0,
          correctness: 2.0,
          maintainability: 0.8,
          performance: 0.5,
          security: 1.2
        },
        fileTypes: {
          '*.critical.test.ts': 2.0,
          '*.integration.test.ts': 1.5
        }
      };

      expect(config.plugins).toBeDefined();
      expect(config.dimensions).toBeDefined();
      expect(config.fileTypes).toBeDefined();
    });

    test('should allow optional fileTypes', () => {
      const config: WeightConfig = {
        plugins: {},
        dimensions: DEFAULT_WEIGHTS.dimensions
      };

      expect(config.fileTypes).toBeUndefined();
    });
  });
});