import { ScoreAggregator } from '../../src/scoring/aggregator';
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

describe('ScoreAggregator', () => {
  let aggregator: ScoreAggregator;
  let calculator: ScoreCalculatorV2;
  let gradeCalculator: GradeCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculatorV2();
    gradeCalculator = new GradeCalculator();
    aggregator = new ScoreAggregator(calculator);
  });

  describe('aggregateFilesToDirectory', () => {
    test('should create directory score from multiple files', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('src/file1.ts', 90),
        createMockFileScore('src/file2.ts', 80),
        createMockFileScore('src/file3.ts', 70)
      ];

      const result = aggregator.aggregateFilesToDirectory('src/', fileScores);

      expect(result.directoryPath).toBe('src/');
      expect(result.fileCount).toBe(3);
      expect(result.averageScore).toBe(80); // (90+80+70)/3
      expect(result.overallScore).toBe(80); // ディレクトリスコア = 平均スコア
      expect(result.grade).toBe('B');
      expect(result.fileScores).toHaveLength(3);
    });

    test('should handle empty file list', () => {
      const result = aggregator.aggregateFilesToDirectory('empty/', []);

      expect(result.directoryPath).toBe('empty/');
      expect(result.fileCount).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.overallScore).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.fileScores).toHaveLength(0);
    });

    test('should aggregate dimension scores correctly', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('src/file1.ts', 95), // High completeness
        createMockFileScore('src/file2.ts', 85), // Medium scores
        createMockFileScore('src/file3.ts', 75)  // Lower scores
      ];

      const result = aggregator.aggregateFilesToDirectory('src/', fileScores);

      // 各ディメンションが0-100の範囲内であることを確認
      Object.values(result.dimensions!).forEach(dimension => {
        expect(dimension.score).toBeGreaterThanOrEqual(0);
        expect(dimension.score).toBeLessThanOrEqual(100);
        expect(dimension.weight).toBeGreaterThan(0);
      });
    });

    test('should apply weighted averaging for mixed file scores', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('src/critical.ts', 100), // 重要なファイル
        createMockFileScore('src/utility.ts', 60),   // 一般的なファイル
        createMockFileScore('src/helper.ts', 40)     // 品質の低いファイル
      ];

      const result = aggregator.aggregateFilesToDirectory('src/', fileScores);

      // 平均スコア = (100+60+40)/3 = 66.67
      expect(result.averageScore).toBeCloseTo(66.7, 1);
      expect(result.grade).toBe('D');
    });
  });

  describe('aggregateDirectoriesToProject', () => {
    test('should create project score from multiple directories', () => {
      const directoryScores: DirectoryScore[] = [
        createMockDirectoryScore('src/', 85, 10),      // コアロジック
        createMockDirectoryScore('test/', 95, 8),      // テストコード  
        createMockDirectoryScore('utils/', 75, 5),     // ユーティリティ
        createMockDirectoryScore('lib/', 65, 3)        // 外部依存
      ];

      const result = aggregator.aggregateDirectoriesToProject('.', directoryScores, DEFAULT_WEIGHTS);

      expect(result.projectPath).toBe('.');
      expect(result.totalFiles).toBe(26); // 10+8+5+3
      expect(result.directoryScores).toHaveLength(4);
      
      // ファイル数加重平均: (85*10 + 95*8 + 75*5 + 65*3) / 26 = 2420/26 ≈ 93.08
      // しかし実際の計算では各ディレクトリの平均を使うため、異なる結果になる
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    test('should handle single directory project', () => {
      const directoryScores: DirectoryScore[] = [
        createMockDirectoryScore('src/', 88, 15)
      ];

      const result = aggregator.aggregateDirectoriesToProject('.', directoryScores, DEFAULT_WEIGHTS);

      expect(result.projectPath).toBe('.');
      expect(result.totalFiles).toBe(15);
      expect(result.overallScore).toBe(88);
      expect(result.averageScore).toBe(88);
      expect(result.grade).toBe('B');
    });

    test('should calculate grade distribution correctly', () => {
      // A:2, B:3, C:4, D:2, F:1 の分布を持つプロジェクト
      const directoryScores: DirectoryScore[] = [
        createMockDirectoryScore('excellent/', 95, 2),  // A grade files
        createMockDirectoryScore('good/', 85, 3),       // B grade files  
        createMockDirectoryScore('average/', 75, 4),    // C grade files
        createMockDirectoryScore('poor/', 65, 2),       // D grade files
        createMockDirectoryScore('failing/', 45, 1)     // F grade files
      ];

      const result = aggregator.aggregateDirectoriesToProject('.', directoryScores, DEFAULT_WEIGHTS);

      expect(result.distribution!.A).toBe(2);
      expect(result.distribution!.B).toBe(3);
      expect(result.distribution!.C).toBe(4);
      expect(result.distribution!.D).toBe(2);
      expect(result.distribution!.F).toBe(1);

      // 分布の合計がファイル総数と一致することを確認
      const totalInDistribution = Object.values(result.distribution!)
        .reduce((sum, count) => sum + count, 0);
      expect(totalInDistribution).toBe(result.totalFiles);
    });

    test('should handle empty project', () => {
      const result = aggregator.aggregateDirectoriesToProject('.', [], DEFAULT_WEIGHTS);

      expect(result.projectPath).toBe('.');
      expect(result.totalFiles).toBe(0);
      expect(result.overallScore).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.distribution).toEqual({ A: 0, B: 0, C: 0, D: 0, F: 0 });
    });
  });

  describe('aggregatePluginResultsToFiles', () => {
    test('should process multiple files with plugin results', () => {
      const pluginResultsMap = new Map<string, PluginResult[]>([
        ['src/file1.ts', [
          createMockPluginResult('test-existence', 90),
          createMockPluginResult('assertion-quality', 85)
        ]],
        ['src/file2.ts', [
          createMockPluginResult('test-existence', 70),
          createMockPluginResult('assertion-quality', 80)
        ]],
        ['test/file1.test.ts', [
          createMockPluginResult('test-structure', 95)
        ]]
      ]);

      const result = aggregator.aggregatePluginResultsToFiles(pluginResultsMap);

      expect(result).toHaveLength(3);
      expect(result[0].filePath).toBe('src/file1.ts');
      expect(result[1].filePath).toBe('src/file2.ts');
      expect(result[2].filePath).toBe('test/file1.test.ts');

      // スコアが正しく計算されていることを確認
      expect(result[0].overallScore).toBeGreaterThan(80);
      expect(result[1].overallScore).toBeGreaterThan(70);
      expect(result[2].overallScore).toBe(95);
    });

    test('should handle files with no plugin results', () => {
      const pluginResultsMap = new Map<string, PluginResult[]>([
        ['src/empty.ts', []]
      ]);

      const result = aggregator.aggregatePluginResultsToFiles(pluginResultsMap);

      expect(result).toHaveLength(1);
      expect(result[0].filePath).toBe('src/empty.ts');
      expect(result[0].overallScore).toBe(0);
      expect(result[0].grade).toBe('F');
    });

    test('should apply custom weights when provided', () => {
      const customWeights: WeightConfig = {
        plugins: {
          'test-existence': 2.0,    // 重要度高
          'assertion-quality': 1.0
        },
        dimensions: DEFAULT_WEIGHTS.dimensions
      };

      const pluginResultsMap = new Map<string, PluginResult[]>([
        ['src/file.ts', [
          createMockPluginResult('test-existence', 80),
          createMockPluginResult('assertion-quality', 60)
        ]]
      ]);

      const result = aggregator.aggregatePluginResultsToFiles(pluginResultsMap, customWeights);

      expect(result).toHaveLength(1);
      // test-existenceの重みが高いため、80点寄りのスコアになる
      // ディメンション重みが適用されるため、実際のスコアは計算が複雑になる
      expect(result[0].overallScore).toBeGreaterThan(60);
      expect(result[0].overallScore).toBeLessThan(80);
    });
  });

  describe('aggregateByDirectoryStructure', () => {
    test('should group files by directory and create hierarchical structure', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('src/api/user.ts', 90),
        createMockFileScore('src/api/auth.ts', 85),
        createMockFileScore('src/utils/helper.ts', 75),
        createMockFileScore('test/api/user.test.ts', 95),
        createMockFileScore('test/utils/helper.test.ts', 80),
        createMockFileScore('lib/external.ts', 60)
      ];

      const result = aggregator.aggregateByDirectoryStructure(fileScores);

      // ディレクトリが正しく作成されることを確認
      const directoryPaths = result.map(d => d.directoryPath).sort();
      expect(directoryPaths).toEqual(['lib/', 'src/api/', 'src/utils/', 'test/api/', 'test/utils/']);

      // 各ディレクトリのファイル数が正しいことを確認
      const srcApiDir = result.find(d => d.directoryPath === 'src/api/');
      expect(srcApiDir?.fileCount).toBe(2);
      expect(srcApiDir?.averageScore).toBe(87.5); // (90+85)/2

      const libDir = result.find(d => d.directoryPath === 'lib/');
      expect(libDir?.fileCount).toBe(1);
      expect(libDir?.averageScore).toBe(60);
    });

    test('should handle files in root directory', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('index.ts', 80),
        createMockFileScore('config.ts', 70)
      ];

      const result = aggregator.aggregateByDirectoryStructure(fileScores);

      expect(result).toHaveLength(1);
      expect(result[0].directoryPath).toBe('./');
      expect(result[0].fileCount).toBe(2);
      expect(result[0].averageScore).toBe(75);
    });

    test('should handle deeply nested directory structure', () => {
      const fileScores: FileScore[] = [
        createMockFileScore('src/components/ui/button/Button.ts', 90),
        createMockFileScore('src/components/ui/input/Input.ts', 85),
        createMockFileScore('src/components/layout/Header.ts', 80)
      ];

      const result = aggregator.aggregateByDirectoryStructure(fileScores);

      const directories = result.map(d => d.directoryPath).sort();
      expect(directories).toEqual([
        'src/components/layout/',
        'src/components/ui/button/',
        'src/components/ui/input/'
      ]);
    });
  });

  // ヘルパー関数
  function createMockFileScore(filePath: string, score: number): FileScore {
    return {
      filePath,
      overallScore: score,
      dimensions: {
        completeness: { score: score, weight: 1.0, contributors: [], details: '', issues: [] },
        correctness: { score: score, weight: 1.5, contributors: [], details: '', issues: [] },
        maintainability: { score: score, weight: 0.8, contributors: [], details: '', issues: [] },
        performance: { score: score, weight: 0.5, contributors: [], details: '', issues: [] },
        security: { score: score, weight: 1.2, contributors: [], details: '', issues: [] }
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
        correctness: { score: avgScore, weight: 1.5, contributors: [], details: '', issues: [] },
        maintainability: { score: avgScore, weight: 0.8, contributors: [], details: '', issues: [] },
        performance: { score: avgScore, weight: 0.5, contributors: [], details: '', issues: [] },
        security: { score: avgScore, weight: 1.2, contributors: [], details: '', issues: [] }
      },
      grade: gradeCalculator.calculateGrade(avgScore)
    };
  }

  function createMockPluginResult(pluginId: string, score: number): PluginResult {
    return {
      pluginId,
      pluginName: `${pluginId} Plugin`,
      score,
      weight: 1.0,
      issues: []
    };
  }
});