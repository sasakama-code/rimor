import { ReportGenerator } from '../../src/scoring/reports';
import { 
  ProjectScore, 
  FileScore, 
  DirectoryScore, 
  DEFAULT_WEIGHTS 
} from '../../src/scoring/types';
import path from 'path';
import fs from 'fs';

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  const testOutputDir = path.join(__dirname, '../fixtures/reports');

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
    
    // テスト用出力ディレクトリを作成
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用ファイルをクリーンアップ
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('generateSummaryReport', () => {
    test('should generate comprehensive summary report', () => {
      const projectScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 85.5,
        grade: 'B',
        totalFiles: 10,
        totalDirectories: 3,
        fileScores: createMockFileScores(),
        directoryScores: createMockDirectoryScores(),
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date('2024-01-01T10:00:00Z'),
          executionTime: 250,
          pluginCount: 3,
          issueCount: 5
        }
      };

      const report = reportGenerator.generateSummaryReport(projectScore);

      expect(report.projectInfo.path).toBe('/test/project');
      expect(report.projectInfo.overallScore).toBe(85.5);
      expect(report.projectInfo.grade).toBe('B');
      expect(report.projectInfo.totalFiles).toBe(10);

      expect(report.dimensionScores).toHaveProperty('completeness');
      expect(report.dimensionScores).toHaveProperty('correctness');
      expect(report.dimensionScores).toHaveProperty('maintainability');
      expect(report.dimensionScores).toHaveProperty('performance');
      expect(report.dimensionScores).toHaveProperty('security');

      expect(report.gradeDistribution).toHaveProperty('A');
      expect(report.gradeDistribution).toHaveProperty('B');
      expect(report.gradeDistribution).toHaveProperty('C');
      expect(report.gradeDistribution).toHaveProperty('D');
      expect(report.gradeDistribution).toHaveProperty('F');

      expect(report.topIssues).toBeDefined();
      expect(Array.isArray(report.topIssues)).toBe(true);

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should calculate dimension scores correctly', () => {
      const projectScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 75.0,
        grade: 'C',
        totalFiles: 4,
        totalDirectories: 2,
        fileScores: [
          createFileScore('file1.test.ts', 80, 'B', {
            completeness: { score: 85, weight: 1.0 },
            correctness: { score: 90, weight: 1.5 },
            maintainability: { score: 75, weight: 1.0 },
            performance: { score: 70, weight: 0.8 },
            security: { score: 80, weight: 1.2 }
          }),
          createFileScore('file2.test.ts', 70, 'C', {
            completeness: { score: 75, weight: 1.0 },
            correctness: { score: 80, weight: 1.5 },
            maintainability: { score: 65, weight: 1.0 },
            performance: { score: 60, weight: 0.8 },
            security: { score: 70, weight: 1.2 }
          })
        ],
        directoryScores: [],
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 100,
          pluginCount: 2,
          issueCount: 3
        }
      };

      const report = reportGenerator.generateSummaryReport(projectScore);

      expect(report.dimensionScores.completeness).toBe(80); // (85 + 75) / 2
      expect(report.dimensionScores.correctness).toBe(85);  // (90 + 80) / 2
      expect(report.dimensionScores.maintainability).toBe(70); // (75 + 65) / 2
      expect(report.dimensionScores.performance).toBe(65);  // (70 + 60) / 2
      expect(report.dimensionScores.security).toBe(75);    // (80 + 70) / 2
    });

    test('should calculate grade distribution correctly', () => {
      const fileScores = [
        createFileScore('a.test.ts', 95, 'A'),
        createFileScore('b.test.ts', 92, 'A'),
        createFileScore('c.test.ts', 85, 'B'),
        createFileScore('d.test.ts', 75, 'C'),
        createFileScore('e.test.ts', 65, 'D'),
        createFileScore('f.test.ts', 55, 'F')
      ];

      const projectScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 77.8,
        grade: 'C',
        totalFiles: 6,
        totalDirectories: 1,
        fileScores,
        directoryScores: [],
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 150,
          pluginCount: 2,
          issueCount: 8
        }
      };

      const report = reportGenerator.generateSummaryReport(projectScore);

      expect(report.gradeDistribution.A).toBe(2);
      expect(report.gradeDistribution.B).toBe(1);
      expect(report.gradeDistribution.C).toBe(1);
      expect(report.gradeDistribution.D).toBe(1);
      expect(report.gradeDistribution.F).toBe(1);
    });
  });

  describe('generateDetailedReport', () => {
    test('should generate detailed file-by-file report', () => {
      const projectScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 82.5,
        grade: 'B',
        totalFiles: 3,
        totalDirectories: 2,
        fileScores: createMockFileScores().slice(0, 3),
        directoryScores: createMockDirectoryScores(),
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 180,
          pluginCount: 3,
          issueCount: 4
        }
      };

      const report = reportGenerator.generateDetailedReport(projectScore);

      expect(report.summary).toBeDefined();
      expect(report.fileDetails).toHaveLength(3);

      const fileDetail = report.fileDetails[0];
      expect(fileDetail).toHaveProperty('filePath');
      expect(fileDetail).toHaveProperty('score');
      expect(fileDetail).toHaveProperty('grade');
      expect(fileDetail).toHaveProperty('dimensions');
      expect(fileDetail).toHaveProperty('issues');
      expect(fileDetail).toHaveProperty('suggestions');

      expect(report.directoryDetails).toHaveLength(2);

      const dirDetail = report.directoryDetails[0];
      expect(dirDetail).toHaveProperty('directoryPath');
      expect(dirDetail).toHaveProperty('score');
      expect(dirDetail).toHaveProperty('grade');
      expect(dirDetail).toHaveProperty('fileCount');
    });

    test('should include actionable suggestions for each file', () => {
      const fileScore = createFileScore('low-score.test.ts', 45, 'F', {
        completeness: { score: 30, weight: 1.0 },
        correctness: { score: 40, weight: 1.5 },
        maintainability: { score: 50, weight: 1.0 },
        performance: { score: 60, weight: 0.8 },
        security: { score: 35, weight: 1.2 }
      });

      const projectScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 45,
        grade: 'F',
        totalFiles: 1,
        totalDirectories: 1,
        fileScores: [fileScore],
        directoryScores: [],
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 50,
          pluginCount: 2,
          issueCount: 6
        }
      };

      const report = reportGenerator.generateDetailedReport(projectScore);
      const fileDetail = report.fileDetails[0];

      expect(fileDetail.suggestions.length).toBeGreaterThan(0);
      expect(fileDetail.suggestions.some(s => s.includes('完全性'))).toBe(true);
      expect(fileDetail.suggestions.some(s => s.includes('正確性'))).toBe(true);
      expect(fileDetail.suggestions.some(s => s.includes('セキュリティ'))).toBe(true);
    });
  });

  describe('generateTrendReport', () => {
    test('should generate trend analysis report', () => {
      const currentScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 85,
        grade: 'B',
        totalFiles: 5,
        totalDirectories: 2,
        fileScores: createMockFileScores().slice(0, 5),
        directoryScores: [],
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 200,
          pluginCount: 3,
          issueCount: 3
        }
      };

      const historicalScores = [
        { date: new Date('2024-01-01'), score: 75, grade: 'C' as const },
        { date: new Date('2024-01-02'), score: 78, grade: 'C' as const },
        { date: new Date('2024-01-03'), score: 82, grade: 'B' as const },
        { date: new Date('2024-01-04'), score: 85, grade: 'B' as const }
      ];

      const report = reportGenerator.generateTrendReport(currentScore, historicalScores);

      expect(report.currentScore).toBe(85);
      expect(report.previousScore).toBe(82);
      expect(report.trend).toBe('improving');
      expect(report.improvementRate).toBeCloseTo(3.66, 1); // (85-82)/82 * 100

      expect(report.historicalData).toHaveLength(4);
      expect(report.predictions).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    test('should detect declining trends', () => {
      const currentScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 70,
        grade: 'C',
        totalFiles: 3,
        totalDirectories: 1,
        fileScores: [],
        directoryScores: [],
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 100,
          pluginCount: 2,
          issueCount: 8
        }
      };

      const historicalScores = [
        { date: new Date('2024-01-01'), score: 85, grade: 'B' as const },
        { date: new Date('2024-01-02'), score: 80, grade: 'B' as const },
        { date: new Date('2024-01-03'), score: 75, grade: 'C' as const },
        { date: new Date('2024-01-04'), score: 70, grade: 'C' as const }
      ];

      const report = reportGenerator.generateTrendReport(currentScore, historicalScores);

      expect(report.trend).toBe('declining');
      expect(report.improvementRate).toBeLessThan(0);
      expect(report.recommendations.some(r => r.includes('劣化'))).toBe(true);
    });

    test('should handle stable trends', () => {
      const currentScore: ProjectScore = {
        projectPath: '/test/project',
        overallScore: 82,
        grade: 'B',
        totalFiles: 4,
        totalDirectories: 1,
        fileScores: [],
        directoryScores: [],
        weights: DEFAULT_WEIGHTS,
        metadata: {
          generatedAt: new Date(),
          executionTime: 120,
          pluginCount: 2,
          issueCount: 2
        }
      };

      const historicalScores = [
        { date: new Date('2024-01-01'), score: 81, grade: 'B' as const },
        { date: new Date('2024-01-02'), score: 83, grade: 'B' as const },
        { date: new Date('2024-01-03'), score: 82, grade: 'B' as const },
        { date: new Date('2024-01-04'), score: 82, grade: 'B' as const }
      ];

      const report = reportGenerator.generateTrendReport(currentScore, historicalScores);

      expect(report.trend).toBe('stable');
      expect(Math.abs(report.improvementRate)).toBeLessThan(2);
    });
  });

  // Helper functions
  function createMockFileScores(): FileScore[] {
    return [
      createFileScore('src/api/user.test.ts', 92, 'A'),
      createFileScore('src/api/product.test.ts', 88, 'B'),
      createFileScore('src/utils/helper.test.ts', 75, 'C'),
      createFileScore('src/services/auth.test.ts', 82, 'B'),
      createFileScore('src/components/button.test.ts', 68, 'D'),
      createFileScore('src/legacy/old.test.ts', 55, 'F')
    ];
  }

  function createMockDirectoryScores(): DirectoryScore[] {
    return [
      {
        directoryPath: 'src/api',
        overallScore: 90,
        grade: 'A',
        fileCount: 2,
        fileScores: [],
        dimensionScores: {
          completeness: 88,
          correctness: 92,
          maintainability: 85,
          performance: 90,
          security: 95
        }
      },
      {
        directoryPath: 'src/utils',
        overallScore: 75,
        grade: 'C',
        fileCount: 1,
        fileScores: [],
        dimensionScores: {
          completeness: 70,
          correctness: 80,
          maintainability: 75,
          performance: 70,
          security: 80
        }
      }
    ];
  }

  function createFileScore(
    filePath: string, 
    score: number, 
    grade: 'A' | 'B' | 'C' | 'D' | 'F',
    customDimensions?: Record<string, { score: number; weight: number }>
  ): FileScore {
    const defaultDimensions = {
      completeness: { score: score, weight: 1.0, issues: [] },
      correctness: { score: score, weight: 1.5, issues: [] },
      maintainability: { score: score, weight: 1.0, issues: [] },
      performance: { score: score, weight: 0.8, issues: [] },
      security: { score: score, weight: 1.2, issues: [] }
    };

    const dimensions = customDimensions ? 
      Object.entries(customDimensions).reduce((acc, [key, val]) => {
        acc[key] = { ...val, issues: [] };
        return acc;
      }, {} as any) : 
      defaultDimensions;

    return {
      filePath,
      overallScore: score,
      dimensions,
      grade,
      weights: DEFAULT_WEIGHTS,
      metadata: {
        analysisTime: 50,
        pluginResults: [],
        issueCount: Math.floor((100 - score) / 20)
      }
    };
  }
});