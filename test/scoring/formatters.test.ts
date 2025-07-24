import { 
  CliFormatter, 
  JsonFormatter, 
  CsvFormatter, 
  HtmlFormatter 
} from '../../src/scoring/formatters';
import { 
  SummaryReport, 
  DetailedReport, 
  TrendReport 
} from '../../src/scoring/reports';

describe('Formatters', () => {
  // Mock data for testing
  const mockSummaryReport: SummaryReport = {
    projectInfo: {
      path: '/test/project',
      overallScore: 85,
      grade: 'B',
      totalFiles: 10,
      totalDirectories: 3,
      executionTime: 150,
      generatedAt: new Date('2024-01-01')
    },
    dimensionScores: {
      completeness: 80,
      correctness: 90,
      maintainability: 85,
      performance: 80,
      security: 85
    },
    gradeDistribution: {
      A: 2,
      B: 5,
      C: 2,
      D: 1,
      F: 0
    },
    topIssues: [
      {
        dimension: 'completeness',
        severity: 'high',
        description: 'Missing test file',
        affectedFiles: 3
      }
    ],
    recommendations: [
      'Add missing test files',
      'Improve code documentation'
    ],
    metadata: {
      averageFileScore: 82,
      worstPerformingDimension: 'completeness',
      bestPerformingDimension: 'correctness',
      pluginCount: 5,
      issueCount: 3
    }
  };

  const mockDetailedReport: DetailedReport = {
    summary: mockSummaryReport,
    fileDetails: [
      {
        filePath: 'src/test.ts',
        score: 85,
        grade: 'B',
        dimensions: [
          {
            name: 'completeness',
            score: 80,
            weight: 0.3,
            issues: ['Missing test file']
          }
        ],
        issues: [
          {
            dimension: 'completeness',
            severity: 'medium' as const,
            message: 'Missing test file',
            line: 1
          }
        ],
        suggestions: ['Add test file']
      }
    ],
    directoryDetails: [
      {
        directoryPath: 'src/',
        score: 85,
        grade: 'B',
        fileCount: 5,
        dimensionBreakdown: {
          completeness: 80,
          correctness: 90
        },
        worstFile: 'src/bad.ts',
        bestFile: 'src/good.ts'
      }
    ]
  };

  const mockTrendReport: TrendReport = {
    currentScore: 85,
    previousScore: 82,
    trend: 'improving',
    improvementRate: 3.66,
    historicalData: [
      {
        date: new Date('2024-01-01'),
        score: 80,
        grade: 'B'
      }
    ],
    predictions: {
      nextWeekScore: 87,
      nextMonthScore: 90,
      confidence: 0.75
    },
    dimensionTrends: [
      {
        dimension: 'completeness',
        trend: 'improving',
        changeRate: 5.2
      }
    ],
    recommendations: ['Continue current improvement trend']
  };

  describe('CliFormatter', () => {
    let formatter: CliFormatter;

    beforeEach(() => {
      formatter = new CliFormatter();
    });

    test('should create CliFormatter instance', () => {
      expect(formatter).toBeInstanceOf(CliFormatter);
    });

    test('should format summary report', () => {
      const result = formatter.formatSummaryReport(mockSummaryReport);
      
      expect(result).toContain('品質スコア サマリーレポート');
      expect(result).toContain('プロジェクト情報');
      expect(result).toContain('85');
      expect(result).toContain('[B]');
      expect(result).toContain('ディメンション別スコア');
    });

    test('should format detailed report', () => {
      const result = formatter.formatDetailedReport(mockDetailedReport);
      
      expect(result).toContain('品質スコア サマリーレポート');
      expect(result).toContain('ファイル詳細');
      expect(result).toContain('src/test.ts');
    });

    test('should format trend report', () => {
      const result = formatter.formatTrendReport(mockTrendReport);
      
      expect(result).toContain('トレンド分析レポート');
      expect(result).toContain('現在のスコア');
      expect(result).toContain('85');
      expect(result).toContain('82');
    });

    test('should handle colors disabled', () => {
      const noColorFormatter = new CliFormatter(false);
      const result = noColorFormatter.formatSummaryReport(mockSummaryReport);
      
      expect(result).toContain('品質スコア サマリーレポート');
      expect(result).not.toContain('\x1b['); // ANSI escape codes
    });
  });

  describe('JsonFormatter', () => {
    let formatter: JsonFormatter;

    beforeEach(() => {
      formatter = new JsonFormatter();
    });

    test('should create JsonFormatter instance', () => {
      expect(formatter).toBeInstanceOf(JsonFormatter);
    });

    test('should format summary report as JSON', () => {
      const result = formatter.formatSummaryReport(mockSummaryReport);
      const parsed = JSON.parse(result);
      
      expect(parsed.projectInfo.overallScore).toBe(85);
      expect(parsed.projectInfo.grade).toBe('B');
      expect(parsed.dimensionScores.completeness).toBe(80);
    });

    test('should format detailed report as JSON', () => {
      const result = formatter.formatDetailedReport(mockDetailedReport);
      const parsed = JSON.parse(result);
      
      expect(parsed.summary.projectInfo.overallScore).toBe(85);
      expect(parsed.fileDetails).toHaveLength(1);
      expect(parsed.fileDetails[0].filePath).toBe('src/test.ts');
    });

    test('should format trend report as JSON', () => {
      const result = formatter.formatTrendReport(mockTrendReport);
      const parsed = JSON.parse(result);
      
      expect(parsed.currentScore).toBe(85);
      expect(parsed.trend).toBe('improving');
      expect(parsed.predictions.confidence).toBe(0.75);
    });
  });

  describe('CsvFormatter', () => {
    let formatter: CsvFormatter;

    beforeEach(() => {
      formatter = new CsvFormatter();
    });

    test('should create CsvFormatter instance', () => {
      expect(formatter).toBeInstanceOf(CsvFormatter);
    });

    test('should format summary report as CSV', () => {
      const result = formatter.formatSummaryReport(mockSummaryReport);
      const lines = result.split('\n');
      
      expect(lines).toHaveLength(2); // Header + data row
      expect(lines[0]).toContain('ファイルパス,プロジェクトパス,総合スコア');
      expect(lines[1]).toContain('/test/project,85,B');
    });

    test('should format detailed report as CSV', () => {
      const result = formatter.formatDetailedReport(mockDetailedReport);
      const lines = result.split('\n');
      
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toContain('ファイルパス,スコア,グレード');
      expect(lines[1]).toContain('src/test.ts,85,B');
    });

    test('should format trend report as CSV', () => {
      const result = formatter.formatTrendReport(mockTrendReport);
      const lines = result.split('\n');
      
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toContain('日付,スコア,グレード,トレンド');
      expect(result).toContain('85');
      expect(result).toContain('improving');
    });
  });

  describe('HtmlFormatter', () => {
    let formatter: HtmlFormatter;

    beforeEach(() => {
      formatter = new HtmlFormatter();
    });

    test('should create HtmlFormatter instance', () => {
      expect(formatter).toBeInstanceOf(HtmlFormatter);
    });

    test('should format summary report as HTML', () => {
      const result = formatter.formatSummaryReport(mockSummaryReport);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<title>品質スコア サマリーレポート');
      expect(result).toContain('85');
      expect(result).toContain('grade-B');
    });

    test('should format detailed report as HTML', () => {
      const result = formatter.formatDetailedReport(mockDetailedReport);
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('ファイル詳細');
      expect(result).toContain('src/test.ts');
    });

    test('should format trend report as HTML', () => {
      const result = formatter.formatTrendReport(mockTrendReport);
      
      expect(result).toContain('トレンド分析');
      expect(result).toContain('85');
      expect(result).toContain('improving');
    });
  });

  describe('Formatter Edge Cases', () => {
    test('should handle empty issues and recommendations', () => {
      const emptyReport: SummaryReport = {
        ...mockSummaryReport,
        topIssues: [],
        recommendations: []
      };

      const cliFormatter = new CliFormatter();
      const result = cliFormatter.formatSummaryReport(emptyReport);
      
      expect(result).toContain('品質スコア サマリーレポート');
      expect(result).not.toContain('主要課題');
      expect(result).not.toContain('推奨事項');
    });

    test('should handle zero grade distribution', () => {
      const zeroGradeReport: SummaryReport = {
        ...mockSummaryReport,
        gradeDistribution: {
          A: 0,
          B: 0, 
          C: 0,
          D: 0,
          F: 0
        }
      };

      const formatter = new CsvFormatter();
      const result = formatter.formatSummaryReport(zeroGradeReport);
      
      expect(result).toContain('0,0,0,0,0');
    });

    test('should handle missing predictions in trend report', () => {
      const trendWithoutPredictions: TrendReport = {
        ...mockTrendReport,
        predictions: {
          nextWeekScore: 0,
          nextMonthScore: 0,
          confidence: 0
        }
      };

      const formatter = new JsonFormatter();
      const result = formatter.formatTrendReport(trendWithoutPredictions);
      const parsed = JSON.parse(result);
      
      expect(parsed.predictions.confidence).toBe(0);
    });
  });
});