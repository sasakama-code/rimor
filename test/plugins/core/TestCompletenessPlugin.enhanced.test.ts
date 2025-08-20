import { TestCompletenessPlugin } from '../../../src/plugins/core/TestCompletenessPlugin';
import { CoverageAnalyzer } from '../../../src/analyzers/coverage/CoverageAnalyzer';
import { TestQualityEvaluator } from '../../../src/analyzers/coverage/TestQualityEvaluator';
import { TestFile, ProjectContext } from '../../../src/core/types';

// モック設定
jest.mock('../../../src/analyzers/coverage/CoverageAnalyzer');
jest.mock('../../../src/analyzers/coverage/TestQualityEvaluator');

const MockCoverageAnalyzer = CoverageAnalyzer as jest.MockedClass<typeof CoverageAnalyzer>;
const MockTestQualityEvaluator = TestQualityEvaluator as jest.MockedClass<typeof TestQualityEvaluator>;

describe('TestCompletenessPlugin (Enhanced with Coverage)', () => {
  let plugin: TestCompletenessPlugin;
  let mockCoverageAnalyzer: jest.Mocked<CoverageAnalyzer>;
  let mockEvaluator: jest.Mocked<TestQualityEvaluator>;

  const mockTestFile: TestFile = {
    path: '/test/example.test.ts',
    content: `
      describe('Example Test', () => {
        it('should pass basic test', () => {
          expect(true).toBe(true);
        });
        
        it('should handle edge cases', () => {
          expect(null).toBeNull();
        });
      });
    `,
    framework: 'jest'
  };

  const mockProjectContext: ProjectContext = {
    rootPath: '/project',
    testFramework: 'jest',
    language: 'typescript'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCoverageAnalyzer = new MockCoverageAnalyzer() as jest.Mocked<CoverageAnalyzer>;
    mockEvaluator = new MockTestQualityEvaluator() as jest.Mocked<TestQualityEvaluator>;
    
    plugin = new TestCompletenessPlugin();
    // プライベートプロパティにモックを注入
    (plugin as any).coverageAnalyzer = mockCoverageAnalyzer;
    (plugin as any).qualityEvaluator = mockEvaluator;
  });

  describe('evaluateQuality with Coverage Integration', () => {
    it('高カバレッジの場合は高品質スコアを返す', async () => {
      const mockCoverage = {
        lines: { total: 100, covered: 90, pct: 90 },
        statements: { total: 100, covered: 90, pct: 90 },
        functions: { total: 20, covered: 18, pct: 90 },
        branches: { total: 50, covered: 40, pct: 80 }
      };

      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockCoverage);
      mockEvaluator.evaluateTestQuality.mockReturnValue({
        overall: 85,
        dimensions: {
          completeness: 85,
          correctness: 80,
          maintainability: 75
        },
        confidence: 0.9
      });

      const patterns = await plugin.detectPatterns(mockTestFile);
      const quality = plugin.evaluateQuality(patterns);

      expect(quality.overall).toBeGreaterThanOrEqual(80);
      expect(mockCoverageAnalyzer.getFileCoverage).toHaveBeenCalledWith(
        expect.stringContaining('coverage'),
        mockTestFile.path
      );
    });

    it('issue #80のような低カバレッジの場合は低品質スコアを返す', async () => {
      const mockPoorCoverage = {
        lines: { total: 15735, covered: 9497, pct: 60.35 },
        statements: { total: 16696, covered: 9932, pct: 59.48 },
        functions: { total: 3207, covered: 1908, pct: 59.49 },
        branches: { total: 7387, covered: 3471, pct: 46.98 }
      };

      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockPoorCoverage);
      mockEvaluator.evaluateTestQuality.mockReturnValue({
        overall: 45,
        dimensions: {
          completeness: 45,
          correctness: 40,
          maintainability: 50
        },
        confidence: 0.6
      });

      const patterns = await plugin.detectPatterns(mockTestFile);
      const quality = plugin.evaluateQuality(patterns);

      // issue #80で期待される45/100程度のスコア
      expect(quality.overall).toBeLessThanOrEqual(50);
      expect(quality.overall).toBeGreaterThanOrEqual(40);
    });

    it('カバレッジデータが取得できない場合は従来の静的解析のみで評価', async () => {
      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(null);

      const patterns = await plugin.detectPatterns(mockTestFile);
      const quality = plugin.evaluateQuality(patterns);

      expect(quality.overall).toBeDefined();
      expect(mockCoverageAnalyzer.getFileCoverage).toHaveBeenCalled();
      // 静的解析のみの場合の評価ロジックが実行されることを確認
    });
  });

  describe('suggestImprovements with Coverage', () => {
    it('低カバレッジに対する具体的な改善提案を生成', async () => {
      const mockPoorCoverage = {
        lines: { total: 100, covered: 50, pct: 50 },
        statements: { total: 100, covered: 50, pct: 50 },
        functions: { total: 20, covered: 10, pct: 50 },
        branches: { total: 50, covered: 15, pct: 30 }
      };

      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockPoorCoverage);
      mockEvaluator.generateImprovementSuggestions.mockReturnValue([
        {
          id: 'coverage-improvement',
          priority: 'high',
          type: 'add-test',
          title: 'カバレッジ向上',
          description: '分岐カバレッジを70%以上に改善してください',
          location: { file: mockTestFile.path, line: 1, column: 1 },
          impact: 0.8
        }
      ]);

      const quality = {
        overall: 45,
        dimensions: { completeness: 45, correctness: 40, maintainability: 50 },
        confidence: 0.6
      };

      const improvements = plugin.suggestImprovements(quality);

      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(imp => imp.description.includes('カバレッジ'))).toBe(true);
    });

    it('極低カバレッジファイルに対してはCRITICAL改善提案を生成', async () => {
      const mockVeryPoorCoverage = {
        lines: { total: 100, covered: 2, pct: 2 },
        statements: { total: 100, covered: 2, pct: 2 },
        functions: { total: 20, covered: 0, pct: 0 },
        branches: { total: 50, covered: 0, pct: 0 }
      };

      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockVeryPoorCoverage);
      mockEvaluator.generateImprovementSuggestions.mockReturnValue([
        {
          id: 'critical-coverage',
          priority: 'critical',
          type: 'add-test',
          title: 'CRITICAL: テストケース不足',
          description: 'このファイルは極めて低いカバレッジです',
          location: { file: mockTestFile.path, line: 1, column: 1 },
          impact: 0.9
        }
      ]);

      const quality = {
        overall: 15,
        dimensions: { completeness: 15, correctness: 10, maintainability: 20 },
        confidence: 0.3
      };

      const improvements = plugin.suggestImprovements(quality);

      expect(improvements.some(imp => imp.priority === 'critical')).toBe(true);
    });
  });

  describe('Enhanced Pattern Detection', () => {
    it('カバレッジ情報と組み合わせてより正確な問題検出', async () => {
      const mockLowBranchCoverage = {
        lines: { total: 100, covered: 80, pct: 80 },
        statements: { total: 100, covered: 80, pct: 80 },
        functions: { total: 20, covered: 16, pct: 80 },
        branches: { total: 50, covered: 10, pct: 20 } // 分岐カバレッジだけ極端に低い
      };

      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockLowBranchCoverage);

      const patterns = await plugin.detectPatterns(mockTestFile);

      // 分岐カバレッジが低い場合は何らかのパターンが検出されることを期待
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Coverage Path Detection', () => {
    it('カバレッジディレクトリを適切に検出する', () => {
      const coveragePath = plugin.getCoveragePath(mockProjectContext);
      
      expect(coveragePath).toMatch(/coverage$/);
    });

    it('カスタムカバレッジパスを処理する', () => {
      const customContext = {
        ...mockProjectContext,
        coverageDir: 'custom-coverage'
      };

      const coveragePath = plugin.getCoveragePath(customContext as any);
      
      expect(coveragePath).toMatch(/custom-coverage$/);
    });
  });
});