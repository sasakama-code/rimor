import { GradeCalculator } from '../../src/scoring/grades';
import { GRADE_THRESHOLDS } from '../../src/scoring/types';

describe('GradeCalculator', () => {
  let gradeCalculator: GradeCalculator;

  beforeEach(() => {
    gradeCalculator = new GradeCalculator();
  });

  describe('calculateGrade', () => {
    test('should return A for scores 90-100', () => {
      expect(gradeCalculator.calculateGrade(100)).toBe('A');
      expect(gradeCalculator.calculateGrade(95)).toBe('A');
      expect(gradeCalculator.calculateGrade(90)).toBe('A');
    });

    test('should return B for scores 80-89', () => {
      expect(gradeCalculator.calculateGrade(89.9)).toBe('B');
      expect(gradeCalculator.calculateGrade(85)).toBe('B');
      expect(gradeCalculator.calculateGrade(80)).toBe('B');
    });

    test('should return C for scores 70-79', () => {
      expect(gradeCalculator.calculateGrade(79.9)).toBe('C');
      expect(gradeCalculator.calculateGrade(75)).toBe('C');
      expect(gradeCalculator.calculateGrade(70)).toBe('C');
    });

    test('should return D for scores 60-69', () => {
      expect(gradeCalculator.calculateGrade(69.9)).toBe('D');
      expect(gradeCalculator.calculateGrade(65)).toBe('D');
      expect(gradeCalculator.calculateGrade(60)).toBe('D');
    });

    test('should return F for scores below 60', () => {
      expect(gradeCalculator.calculateGrade(59.9)).toBe('F');
      expect(gradeCalculator.calculateGrade(30)).toBe('F');
      expect(gradeCalculator.calculateGrade(0)).toBe('F');
    });

    test('should handle edge cases correctly', () => {
      expect(gradeCalculator.calculateGrade(-1)).toBe('F');
      expect(gradeCalculator.calculateGrade(101)).toBe('A');
    });

    test('should handle decimal precision correctly', () => {
      expect(gradeCalculator.calculateGrade(89.99)).toBe('B');
      expect(gradeCalculator.calculateGrade(90.01)).toBe('A');
    });
  });

  describe('getMinScoreForGrade', () => {
    test('should return correct minimum scores for each grade', () => {
      expect(gradeCalculator.getMinScoreForGrade('A')).toBe(90);
      expect(gradeCalculator.getMinScoreForGrade('B')).toBe(80);
      expect(gradeCalculator.getMinScoreForGrade('C')).toBe(70);
      expect(gradeCalculator.getMinScoreForGrade('D')).toBe(60);
      expect(gradeCalculator.getMinScoreForGrade('F')).toBe(0);
    });
  });

  describe('getGradeColor', () => {
    test('should return appropriate ANSI color codes', () => {
      expect(gradeCalculator.getGradeColor('A')).toBe('\x1b[32m'); // Green
      expect(gradeCalculator.getGradeColor('B')).toBe('\x1b[36m'); // Cyan
      expect(gradeCalculator.getGradeColor('C')).toBe('\x1b[33m'); // Yellow
      expect(gradeCalculator.getGradeColor('D')).toBe('\x1b[35m'); // Magenta
      expect(gradeCalculator.getGradeColor('F')).toBe('\x1b[31m'); // Red
    });
  });

  describe('getGradeDescription', () => {
    test('should return appropriate Japanese descriptions', () => {
      expect(gradeCalculator.getGradeDescription('A')).toBe('優秀');
      expect(gradeCalculator.getGradeDescription('B')).toBe('良好');
      expect(gradeCalculator.getGradeDescription('C')).toBe('標準');
      expect(gradeCalculator.getGradeDescription('D')).toBe('要改善');
      expect(gradeCalculator.getGradeDescription('F')).toBe('不合格');
    });
  });

  describe('calculateGradeDistribution', () => {
    test('should correctly count grades from scores', () => {
      const scores = [95, 85, 75, 65, 55, 90, 80, 70, 60, 50];
      const distribution = gradeCalculator.calculateGradeDistribution(scores);

      expect(distribution.A).toBe(2); // 95, 90
      expect(distribution.B).toBe(2); // 85, 80
      expect(distribution.C).toBe(2); // 75, 70
      expect(distribution.D).toBe(2); // 65, 60
      expect(distribution.F).toBe(2); // 55, 50
    });

    test('should handle empty score array', () => {
      const distribution = gradeCalculator.calculateGradeDistribution([]);
      
      expect(distribution.A).toBe(0);
      expect(distribution.B).toBe(0);
      expect(distribution.C).toBe(0);
      expect(distribution.D).toBe(0);
      expect(distribution.F).toBe(0);
    });

    test('should handle all same grade scores', () => {
      const scores = [85, 87, 82, 89]; // All B grades
      const distribution = gradeCalculator.calculateGradeDistribution(scores);

      expect(distribution.A).toBe(0);
      expect(distribution.B).toBe(4);
      expect(distribution.C).toBe(0);
      expect(distribution.D).toBe(0);
      expect(distribution.F).toBe(0);
    });
  });

  describe('calculateGradePercentages', () => {
    test('should correctly calculate percentages', () => {
      const distribution = { A: 1, B: 2, C: 3, D: 2, F: 2 }; // Total: 10
      const percentages = gradeCalculator.calculateGradePercentages(distribution);

      expect(percentages.A).toBe(10.0);  // 1/10 * 100
      expect(percentages.B).toBe(20.0);  // 2/10 * 100
      expect(percentages.C).toBe(30.0);  // 3/10 * 100
      expect(percentages.D).toBe(20.0);  // 2/10 * 100
      expect(percentages.F).toBe(20.0);  // 2/10 * 100
    });

    test('should handle zero total distribution', () => {
      const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      const percentages = gradeCalculator.calculateGradePercentages(distribution);

      expect(percentages.A).toBe(0);
      expect(percentages.B).toBe(0);
      expect(percentages.C).toBe(0);
      expect(percentages.D).toBe(0);
      expect(percentages.F).toBe(0);
    });

    test('should handle rounding correctly', () => {
      const distribution = { A: 1, B: 1, C: 1, D: 0, F: 0 }; // Total: 3
      const percentages = gradeCalculator.calculateGradePercentages(distribution);

      // 1/3 * 100 = 33.333... → rounded to 33.3
      expect(percentages.A).toBe(33.3);
      expect(percentages.B).toBe(33.3);
      expect(percentages.C).toBe(33.3);
      expect(percentages.D).toBe(0);
      expect(percentages.F).toBe(0);
    });
  });

  describe('calculateImprovementNeeded', () => {
    test('should calculate points needed to reach target grade', () => {
      expect(gradeCalculator.calculateImprovementNeeded(85, 'A')).toBe(5);  // 90 - 85
      expect(gradeCalculator.calculateImprovementNeeded(75, 'B')).toBe(5);  // 80 - 75
      expect(gradeCalculator.calculateImprovementNeeded(65, 'C')).toBe(5);  // 70 - 65
      expect(gradeCalculator.calculateImprovementNeeded(55, 'D')).toBe(5);  // 60 - 55
    });

    test('should return 0 if already at or above target grade', () => {
      expect(gradeCalculator.calculateImprovementNeeded(95, 'A')).toBe(0);
      expect(gradeCalculator.calculateImprovementNeeded(85, 'B')).toBe(0);
      expect(gradeCalculator.calculateImprovementNeeded(90, 'B')).toBe(0); // A grade targeting B
    });

    test('should handle F grade improvement', () => {
      expect(gradeCalculator.calculateImprovementNeeded(30, 'F')).toBe(0); // Already F
      expect(gradeCalculator.calculateImprovementNeeded(30, 'D')).toBe(30); // 60 - 30
    });
  });

  describe('compareGrades', () => {
    test('should detect grade improvements', () => {
      expect(gradeCalculator.compareGrades('C', 'B')).toBe(1); // 改善
      expect(gradeCalculator.compareGrades('F', 'A')).toBe(2); // 大幅改善
      expect(gradeCalculator.compareGrades('D', 'C')).toBe(1); // 改善
    });

    test('should detect grade degradations', () => {
      expect(gradeCalculator.compareGrades('B', 'C')).toBe(-1); // 悪化
      expect(gradeCalculator.compareGrades('A', 'F')).toBe(-2); // 大幅悪化
      expect(gradeCalculator.compareGrades('C', 'D')).toBe(-1); // 悪化
    });

    test('should detect no change', () => {
      expect(gradeCalculator.compareGrades('A', 'A')).toBe(0);
      expect(gradeCalculator.compareGrades('B', 'B')).toBe(0);
      expect(gradeCalculator.compareGrades('C', 'C')).toBe(0);
      expect(gradeCalculator.compareGrades('D', 'D')).toBe(0);
      expect(gradeCalculator.compareGrades('F', 'F')).toBe(0);
    });

    test('should handle edge cases for large improvements/degradations', () => {
      expect(gradeCalculator.compareGrades('F', 'A')).toBe(2);  // F→A: 大幅改善
      expect(gradeCalculator.compareGrades('A', 'F')).toBe(-2); // A→F: 大幅悪化
      expect(gradeCalculator.compareGrades('F', 'B')).toBe(2);  // F→B: 大幅改善
      expect(gradeCalculator.compareGrades('B', 'F')).toBe(-2); // B→F: 大幅悪化
    });
  });

  describe('Integration with GRADE_THRESHOLDS', () => {
    test('should use correct thresholds from types', () => {
      expect(gradeCalculator.getMinScoreForGrade('A')).toBe(GRADE_THRESHOLDS.A);
      expect(gradeCalculator.getMinScoreForGrade('B')).toBe(GRADE_THRESHOLDS.B);
      expect(gradeCalculator.getMinScoreForGrade('C')).toBe(GRADE_THRESHOLDS.C);
      expect(gradeCalculator.getMinScoreForGrade('D')).toBe(GRADE_THRESHOLDS.D);
      expect(gradeCalculator.getMinScoreForGrade('F')).toBe(GRADE_THRESHOLDS.F);
    });

    test('should be consistent with threshold boundaries', () => {
      // 境界値での一貫性確認
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.A)).toBe('A');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.B)).toBe('B');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.C)).toBe('C');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.D)).toBe('D');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.F)).toBe('F');

      // 境界値の直下
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.A - 0.1)).toBe('B');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.B - 0.1)).toBe('C');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.C - 0.1)).toBe('D');
      expect(gradeCalculator.calculateGrade(GRADE_THRESHOLDS.D - 0.1)).toBe('F');
    });
  });
});