import { CoverageQualityPlugin } from '../../../src/plugins/core/CoverageQualityPlugin';
import { CoverageAnalyzer, CoverageSummary } from '../../../src/analyzers/coverage/CoverageAnalyzer';
import { TestQualityEvaluator } from '../../../src/analyzers/coverage/TestQualityEvaluator';
import { TestFile, ProjectContext, DetectionResult, QualityScore } from '../../../src/core/types';

// モック設定
jest.mock('../../../src/analyzers/coverage/CoverageAnalyzer');
jest.mock('../../../src/analyzers/coverage/TestQualityEvaluator');

const MockCoverageAnalyzer = CoverageAnalyzer as jest.MockedClass<typeof CoverageAnalyzer>;
const MockTestQualityEvaluator = TestQualityEvaluator as jest.MockedClass<typeof TestQualityEvaluator>;

describe('CoverageQualityPlugin', () => {
  let plugin: CoverageQualityPlugin;
  let mockCoverageAnalyzer: jest.Mocked<CoverageAnalyzer>;
  let mockEvaluator: jest.Mocked<TestQualityEvaluator>;

  const mockTestFile: TestFile = {
    path: '/src/auth/authentication.test.ts',
    content: `
      describe('Authentication', () => {
        it('should validate user credentials', () => {
          expect(true).toBe(true);
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
    
    plugin = new CoverageQualityPlugin();
    (plugin as any).coverageAnalyzer = mockCoverageAnalyzer;
    (plugin as any).qualityEvaluator = mockEvaluator;
    
    // プロジェクトコンテキストを設定
    plugin.setProjectContext(mockProjectContext);
    
    // getCoverageForFileメソッドをスパイしてモック
    jest.spyOn(plugin as any, 'getCoverageForFile');
    
    // CoverageAnalyzerのgetCoverageThresholdsメソッドをモック
    mockCoverageAnalyzer.getCoverageThresholds.mockReturnValue({
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 70
    });
  });

  describe('Plugin Metadata', () => {
    it('正しいプラグイン情報を持つ', () => {
      expect(plugin.id).toBe('coverage-quality');
      expect(plugin.name).toBe('Coverage Quality Analyzer');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('core');
    });

    it('すべてのプロジェクトで適用可能', () => {
      expect(plugin.isApplicable(mockProjectContext)).toBe(true);
    });
  });

  describe('detectPatterns', () => {
    it('低カバレッジファイルのパターンを検出', async () => {
      const mockLowCoverage: CoverageSummary = {
        lines: { total: 100, covered: 30, pct: 30 },
        statements: { total: 100, covered: 30, pct: 30 },
        functions: { total: 20, covered: 5, pct: 25 },
        branches: { total: 50, covered: 10, pct: 20 }
      };

      // getCoverageForFileのモックを設定
      (plugin as any).getCoverageForFile.mockResolvedValue(mockLowCoverage);
      
      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockLowCoverage);
      mockCoverageAnalyzer.findLowCoverageFiles.mockResolvedValue([
        {
          filePath: '/src/auth/authentication.ts',
          linesPct: 30,
          statementsPct: 30,
          functionsPct: 25,
          branchesPct: 20
        }
      ]);

      const patterns = await plugin.detectPatterns(mockTestFile);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.patternId?.includes('low-coverage'))).toBe(true);
    });

    it('セキュリティ関連ファイルの低カバレッジを特別に検出', async () => {
      const securityTestFile: TestFile = {
        path: '/src/security/auth.test.ts',
        content: 'security related test',
        framework: 'jest'
      };

      const mockSecurityLowCoverage: CoverageSummary = {
        lines: { total: 100, covered: 50, pct: 50 },
        statements: { total: 100, covered: 50, pct: 50 },
        functions: { total: 20, covered: 10, pct: 50 },
        branches: { total: 50, covered: 20, pct: 40 }
      };

      // getCoverageForFileのモックを設定
      (plugin as any).getCoverageForFile.mockResolvedValue(mockSecurityLowCoverage);
      
      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockSecurityLowCoverage);

      const patterns = await plugin.detectPatterns(securityTestFile);

      expect(patterns.some(p => 
        p.severity === 'high' && p.patternId?.includes('security')
      )).toBe(true);
    });

    it('極低カバレッジファイルをCRITICALとして検出', async () => {
      const mockCriticalLowCoverage: CoverageSummary = {
        lines: { total: 100, covered: 5, pct: 5 },
        statements: { total: 100, covered: 5, pct: 5 },
        functions: { total: 20, covered: 1, pct: 5 },
        branches: { total: 50, covered: 1, pct: 2 }
      };

      // getCoverageForFileのモックを設定
      (plugin as any).getCoverageForFile.mockResolvedValue(mockCriticalLowCoverage);
      
      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(mockCriticalLowCoverage);

      const patterns = await plugin.detectPatterns(mockTestFile);

      expect(patterns.some(p => p.severity === 'critical')).toBe(true);
    });

    it('カバレッジデータが取得できない場合は警告パターンを生成', async () => {
      // getCoverageForFileのモックを設定
      (plugin as any).getCoverageForFile.mockResolvedValue(null);
      
      mockCoverageAnalyzer.getFileCoverage.mockResolvedValue(null);

      const patterns = await plugin.detectPatterns(mockTestFile);

      expect(patterns.some(p => 
        p.patternId?.includes('coverage-unavailable')
      )).toBe(true);
    });
  });

  describe('evaluateQuality', () => {
    it('カバレッジベースの品質評価を実行', () => {
      const mockPatterns: DetectionResult[] = [
        {
          patternId: 'low-coverage-detected',
          severity: 'high',
          confidence: 0.9,
          patternName: 'Low coverage detected'
        }
      ];

      const quality = plugin.evaluateQuality(mockPatterns);

      // 実際の計算: baseScore 100 - high severity 25 = 75
      expect(quality.overall).toBe(75);
      expect(quality.confidence).toBe(0.9); // パターンの信頼度
      expect(quality.dimensions.completeness).toBe(80); // finalScore + 5
      expect(quality.dimensions.correctness).toBe(70); // finalScore - 5
    });

    it('セキュリティ関連ファイルの低品質に対してペナルティを適用', () => {
      const securityPatterns: DetectionResult[] = [
        {
          patternId: 'security-low-coverage',
          severity: 'medium',
          confidence: 0.95,
          patternName: 'Security module low coverage'
        }
      ];

      const quality = plugin.evaluateQuality(securityPatterns);

      // 実際の計算: baseScore 100 - medium severity 15 - security penalty 10 = 75
      expect(quality.overall).toBe(75);
      expect(quality.confidence).toBe(0.95);
    });
  });

  describe('suggestImprovements', () => {
    it('カバレッジ向上のための具体的な改善提案を生成', () => {
      const lowQuality: QualityScore = {
        overall: 35,
        dimensions: {
          completeness: 35,
          correctness: 30,
          maintainability: 40
        },
        confidence: 0.7
      };

      const improvements = plugin.suggestImprovements(lowQuality);

      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(imp => 
        imp.description.includes('カバレッジ') && imp.priority === 'high'
      )).toBe(true);
    });

    it('極低品質に対してCRITICAL改善提案を生成', () => {
      const criticalQuality: QualityScore = {
        overall: 15,
        dimensions: {
          completeness: 15,
          correctness: 10,
          maintainability: 20
        },
        confidence: 0.5
      };

      const improvements = plugin.suggestImprovements(criticalQuality);

      expect(improvements.some(imp => imp.priority === 'critical')).toBe(true);
      expect(improvements.some(imp => 
        imp.description.includes('緊急') || imp.description.includes('至急')
      )).toBe(true);
    });

    it('セキュリティ関連の改善提案を含む', () => {
      const securityLowQuality: QualityScore = {
        overall: 40,
        dimensions: {
          completeness: 40,
          correctness: 35,
          maintainability: 45
        },
        confidence: 0.6
      };

      // セキュリティファイルのテスト
      (plugin as any).currentTestFile = {
        path: '/src/security/encryption.test.ts',
        content: 'security test',
        framework: 'jest'
      };

      const improvements = plugin.suggestImprovements(securityLowQuality);

      expect(improvements.some(imp => 
        imp.description.includes('セキュリティ')
      )).toBe(true);
    });
  });

  describe('Coverage Analysis Features', () => {
    it('ファイルカテゴリ別の分析を実行', () => {
      const testPaths = [
        '/src/auth/login.test.ts',
        '/src/api/users.test.ts',
        '/src/utils/helpers.test.ts',
        '/src/security/encryption.test.ts'
      ];

      const categories = plugin.categorizeFiles(testPaths);

      expect(categories.security).toContain('/src/security/encryption.test.ts');
      expect(categories.auth).toContain('/src/auth/login.test.ts');
      expect(categories.api).toContain('/src/api/users.test.ts');
      expect(categories.utils).toContain('/src/utils/helpers.test.ts');
    });

    it('カバレッジ閾値を適切に設定', () => {
      const thresholds = plugin.getCoverageThresholds();

      expect(thresholds.lines).toBe(80);
      expect(thresholds.statements).toBe(80);
      expect(thresholds.functions).toBe(80);
      expect(thresholds.branches).toBe(70);
    });

    it('セキュリティファイルに対してより厳しい閾値を適用', () => {
      const securityThresholds = plugin.getSecurityCoverageThresholds();

      expect(securityThresholds.lines).toBe(90);
      expect(securityThresholds.statements).toBe(90);
      expect(securityThresholds.functions).toBe(85);
      expect(securityThresholds.branches).toBe(80);
    });
  });

  describe('Integration with CoverageAnalyzer', () => {
    it('プロジェクト全体のカバレッジサマリーを取得', async () => {
      const mockOverallCoverage: CoverageSummary = {
        lines: { total: 1000, covered: 603, pct: 60.35 },
        statements: { total: 1100, covered: 655, pct: 59.48 },
        functions: { total: 320, covered: 190, pct: 59.49 },
        branches: { total: 738, covered: 347, pct: 46.98 }
      };

      mockCoverageAnalyzer.getOverallCoverage.mockResolvedValue(mockOverallCoverage);

      const summary = await plugin.getProjectCoverageSummary(mockProjectContext);

      expect(summary).toEqual(mockOverallCoverage);
      expect(mockCoverageAnalyzer.getOverallCoverage).toHaveBeenCalled();
    });

    it('低カバレッジファイルリストを取得', async () => {
      const mockLowCoverageFiles = [
        {
          filePath: '/src/feature1.ts',
          linesPct: 25,
          statementsPct: 20,
          functionsPct: 30,
          branchesPct: 15
        },
        {
          filePath: '/src/feature2.ts',
          linesPct: 35,
          statementsPct: 30,
          functionsPct: 40,
          branchesPct: 25
        }
      ];

      mockCoverageAnalyzer.findLowCoverageFiles.mockResolvedValue(mockLowCoverageFiles);

      const lowFiles = await plugin.getLowCoverageFiles(mockProjectContext, 40);

      expect(lowFiles).toEqual(mockLowCoverageFiles);
      expect(mockCoverageAnalyzer.findLowCoverageFiles).toHaveBeenCalledWith(
        expect.stringContaining('coverage'),
        40
      );
    });
  });
});