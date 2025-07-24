import { 
  FileScore, 
  DirectoryScore, 
  ProjectScore,
  PluginResult,
  WeightConfig,
  DEFAULT_WEIGHTS
} from '../../src/scoring/types';
import { ScoreCalculatorV2 } from '../../src/scoring/calculator';
import { GradeCalculator } from '../../src/scoring/grades';

describe('ScoreCalculatorV2', () => {
  let calculator: ScoreCalculatorV2;
  let gradeCalculator: GradeCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculatorV2();
    gradeCalculator = new GradeCalculator();
  });

  describe('calculateFileScore', () => {
    test('should return zero score for empty plugin results', () => {
      const result = calculator.calculateFileScore('test.ts', []);
      
      expect(result.overallScore).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.filePath).toBe('test.ts');
    });

    test('should calculate correct score for single plugin result', () => {
      const pluginResults: PluginResult[] = [
        {
          pluginId: 'test-existence',
          pluginName: 'Test Existence Plugin',
          score: 80,
          weight: 1.0,
          issues: []
        }
      ];

      const result = calculator.calculateFileScore('test.ts', pluginResults);
      
      expect(result.overallScore).toBe(80);
      expect(result.grade).toBe('B');
      expect(result.pluginScores!['test-existence']).toBeDefined();
      expect(result.pluginScores!['test-existence'].score).toBe(80);
    });

    test('should apply weights correctly for multiple plugins', () => {
      const pluginResults: PluginResult[] = [
        {
          pluginId: 'plugin1',
          pluginName: 'Plugin 1',
          score: 60,
          weight: 1.0,
          issues: []
        },
        {
          pluginId: 'plugin2', 
          pluginName: 'Plugin 2',
          score: 100,
          weight: 2.0,
          issues: []
        }
      ];

      const result = calculator.calculateFileScore('test.ts', pluginResults);
      
      // 加重平均: (60*1 + 100*2) / (1+2) = 260/3 ≈ 86.67
      expect(result.overallScore).toBeCloseTo(86.67, 1);
      expect(result.grade).toBe('B');
    });

    test('should handle perfect score correctly', () => {
      const pluginResults: PluginResult[] = [
        {
          pluginId: 'perfect-plugin',
          pluginName: 'Perfect Plugin',
          score: 100,
          weight: 1.0,
          issues: []
        }
      ];

      const result = calculator.calculateFileScore('test.ts', pluginResults);
      
      expect(result.overallScore).toBe(100);
      expect(result.grade).toBe('A');
    });

    test('should calculate dimension scores correctly', () => {
      const pluginResults: PluginResult[] = [
        {
          pluginId: 'completeness-plugin',
          pluginName: 'Completeness Plugin',
          score: 85,
          weight: 1.0,
          issues: [],
          metadata: { dimensions: ['completeness'] }
        },
        {
          pluginId: 'correctness-plugin',
          pluginName: 'Correctness Plugin', 
          score: 75,
          weight: 1.5,
          issues: [],
          metadata: { dimensions: ['correctness'] }
        }
      ];

      const result = calculator.calculateFileScore('test.ts', pluginResults);
      
      expect(result.dimensions.completeness.score).toBeGreaterThan(0);
      expect(result.dimensions.correctness.score).toBeGreaterThan(0);
    });
  });

  describe('calculateDirectoryScore', () => {
    test('should return zero score for empty file scores', () => {
      const result = calculator.calculateDirectoryScore('src/', []);
      
      expect(result.overallScore).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.fileCount).toBe(0);
      expect(result.grade).toBe('F');
    });

    test('should calculate average correctly for multiple files', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('file1.ts', 80),
        createMockFileScore('file2.ts', 90),
        createMockFileScore('file3.ts', 70)
      ];

      const result = calculator.calculateDirectoryScore('src/', fileScores);
      
      expect(result.averageScore).toBe(80); // (80+90+70)/3
      expect(result.fileCount).toBe(3);
      expect(result.grade).toBe('B');
    });

    test('should aggregate dimension scores correctly', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('file1.ts', 85),
        createMockFileScore('file2.ts', 75)
      ];

      const result = calculator.calculateDirectoryScore('src/', fileScores);
      
      Object.values(result.dimensions!).forEach(dimension => {
        expect(dimension.score).toBeGreaterThanOrEqual(0);
        expect(dimension.score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('calculateProjectScore', () => {
    test('should calculate overall project score correctly', () => {
      const directoryScores: DirectoryScore[] = [
        createMockDirectoryScore('src/', 85, 10),
        createMockDirectoryScore('test/', 90, 5),
        createMockDirectoryScore('lib/', 75, 3)
      ];

      const result = calculator.calculateProjectScore(directoryScores, DEFAULT_WEIGHTS);
      
      expect(result.totalFiles).toBe(18); // 10+5+3
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.grade).toBeDefined();
    });

    test('should calculate distribution correctly', () => {
      const directoryScores: DirectoryScore[] = [
        createMockDirectoryScore('src/', 95, 2), // A grade files
        createMockDirectoryScore('test/', 85, 3), // B grade files
        createMockDirectoryScore('lib/', 55, 1)  // F grade files
      ];

      const result = calculator.calculateProjectScore(directoryScores, DEFAULT_WEIGHTS);
      
      expect(result.distribution!.A).toBeGreaterThan(0);
      expect(result.distribution!.B).toBeGreaterThan(0);
      expect(result.distribution!.F).toBeGreaterThan(0);
      
      const totalInDistribution = Object.values(result.distribution!)
        .reduce((sum, count) => sum + count, 0);
      expect(totalInDistribution).toBe(result.totalFiles);
    });
  });

  describe('aggregateScores with custom weights', () => {
    test('should apply custom dimension weights', () => {
      const customWeights: WeightConfig = {
        plugins: {},
        dimensions: {
          completeness: 0.5,
          correctness: 3.0, // 重要度最高
          maintainability: 1.0,
          performance: 0.1,
          security: 2.0
        }
      };

      const pluginResults: PluginResult[] = [
        {
          pluginId: 'correctness-plugin',
          pluginName: 'Correctness Plugin',
          score: 60,
          weight: 1.0,
          issues: [],
          metadata: { dimensions: ['correctness'] }
        },
        {
          pluginId: 'performance-plugin',
          pluginName: 'Performance Plugin',
          score: 100,
          weight: 1.0,
          issues: [],
          metadata: { dimensions: ['performance'] }
        }
      ];

      const result = calculator.calculateFileScore('test.ts', pluginResults, customWeights);
      
      // 正確性の重みが高いため、パフォーマンスの高得点よりも正確性の低得点が影響大
      expect(result.overallScore).toBeLessThan(80);
    });
  });

  // ヘルパー関数
  function createMockFileScore(filePath: string, score: number): FileScore {
    return {
      filePath,
      overallScore: score,
      dimensions: {
        completeness: { score: score, weight: 1.0, contributors: [], details: '', issues: [] },
        correctness: { score: score, weight: 1.0, contributors: [], details: '', issues: [] },
        maintainability: { score: score, weight: 1.0, contributors: [], details: '', issues: [] },
        performance: { score: score, weight: 1.0, contributors: [], details: '', issues: [] },
        security: { score: score, weight: 1.0, contributors: [], details: '', issues: [] }
      },
      pluginScores: {},
      grade: gradeCalculator.calculateGrade(score),
      weights: DEFAULT_WEIGHTS,
      metadata: {
        analysisTime: 0,
        pluginResults: [],
        issueCount: 0
      }
    };
  }

  function createMockDirectoryScore(dirPath: string, avgScore: number, fileCount: number): DirectoryScore {
    const fileScores: FileScore[] = [];
    for (let i = 0; i < fileCount; i++) {
      fileScores.push(createMockFileScore(`${dirPath}file${i}.ts`, avgScore));
    }

    return {
      directoryPath: dirPath,
      overallScore: avgScore,
      fileCount,
      fileScores,
      dimensionScores: {
        completeness: avgScore,
        correctness: avgScore,
        maintainability: avgScore,
        performance: avgScore,
        security: avgScore
      },
      averageScore: avgScore,
      dimensions: {
        completeness: { score: avgScore, weight: 1.0, contributors: [], details: '', issues: [] },
        correctness: { score: avgScore, weight: 1.0, contributors: [], details: '', issues: [] },
        maintainability: { score: avgScore, weight: 1.0, contributors: [], details: '', issues: [] },
        performance: { score: avgScore, weight: 1.0, contributors: [], details: '', issues: [] },
        security: { score: avgScore, weight: 1.0, contributors: [], details: '', issues: [] }
      },
      grade: gradeCalculator.calculateGrade(avgScore)
    };
  }
});

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
});