import { CoverageAnalyzer } from '../../src/analyzers/coverage/CoverageAnalyzer';
import { TestQualityEvaluator } from '../../src/analyzers/coverage/TestQualityEvaluator';
import { TestCompletenessPlugin } from '../../src/plugins/core/TestCompletenessPlugin';
import { CoverageQualityPlugin } from '../../src/plugins/core/CoverageQualityPlugin';
import { TestFile, ProjectContext } from '../../src/core/types';
import * as path from 'path';
import * as fs from 'fs';

describe('Coverage Integration Tests', () => {
  let coverageAnalyzer: CoverageAnalyzer;
  let qualityEvaluator: TestQualityEvaluator;
  let testCompletenessPlugin: TestCompletenessPlugin;
  let coverageQualityPlugin: CoverageQualityPlugin;

  const testProjectContext: ProjectContext = {
    rootPath: path.resolve(__dirname, '../..'),
    testFramework: 'jest',
    language: 'typescript'
  };

  const mockTestFile: TestFile = {
    path: path.resolve(__dirname, '../../demo/sample-project/test/calculator.test.js'),
    content: '',
    framework: 'jest'
  };

  beforeAll(async () => {
    // テストファイルの内容を読み込み
    if (fs.existsSync(mockTestFile.path)) {
      mockTestFile.content = fs.readFileSync(mockTestFile.path, 'utf-8');
    } else {
      // モックコンテンツを使用
      mockTestFile.content = `
        const calculator = require('../src/calculator');
        
        describe('Calculator', () => {
          it('should add two numbers', () => {
            expect(calculator.add(2, 3)).toBe(5);
          });
          
          it('should subtract two numbers', () => {
            expect(calculator.subtract(5, 3)).toBe(2);
          });
        });
      `;
    }
  });

  beforeEach(() => {
    coverageAnalyzer = new CoverageAnalyzer();
    qualityEvaluator = new TestQualityEvaluator();
    testCompletenessPlugin = new TestCompletenessPlugin();
    coverageQualityPlugin = new CoverageQualityPlugin();
  });

  describe('Real Coverage Data Integration', () => {
    it('実際のカバレッジデータを使用した統合テスト', async () => {
      const coveragePath = path.resolve(__dirname, '../../coverage');
      
      // カバレッジディレクトリが存在する場合のみテスト実行
      if (!fs.existsSync(coveragePath)) {
        console.log('Coverage directory not found, skipping integration test');
        return;
      }

      // プロジェクト全体のカバレッジ取得
      const overallCoverage = await coverageAnalyzer.getOverallCoverage(coveragePath);
      
      if (overallCoverage) {
        console.log('Overall Coverage:', {
          lines: overallCoverage.lines.pct,
          statements: overallCoverage.statements.pct,
          functions: overallCoverage.functions.pct,
          branches: overallCoverage.branches.pct
        });

        // issue #80で報告された60.35%カバレッジに対する評価をテスト
        const qualityScore = qualityEvaluator.evaluateTestQuality(overallCoverage);
        
        console.log('Quality Score:', qualityScore);
        
        // 60%前後のカバレッジに対して適切なスコア（40-60点）が算出されることを確認
        if (overallCoverage.lines.pct < 70) {
          expect(qualityScore.overall).toBeLessThan(70);
          expect(qualityScore.overall).toBeGreaterThan(20);
        }

        // グレード評価のテスト
        const grade = qualityEvaluator.generateQualityGrade(qualityScore.overall);
        console.log('Quality Grade:', grade);
        
        expect(['A', 'B', 'C', 'D', 'F']).toContain(grade);
      }
    });

    it('低カバレッジファイルの検出統合テスト', async () => {
      const coveragePath = path.resolve(__dirname, '../../coverage');
      
      if (!fs.existsSync(coveragePath)) {
        console.log('Coverage directory not found, skipping low coverage test');
        return;
      }

      // 閾値30%で低カバレッジファイルを検出
      const lowCoverageFiles = await coverageAnalyzer.findLowCoverageFiles(coveragePath, 30);
      
      console.log(`Found ${lowCoverageFiles.length} low coverage files`);
      
      if (lowCoverageFiles.length > 0) {
        console.log('Low coverage files:', lowCoverageFiles.map(f => ({
          file: f.filePath,
          lines: f.linesPct
        })));

        // 低カバレッジファイルが適切にソートされていることを確認
        for (let i = 1; i < lowCoverageFiles.length; i++) {
          expect(lowCoverageFiles[i].linesPct).toBeGreaterThanOrEqual(lowCoverageFiles[i-1].linesPct);
        }
      }
    });
  });

  describe('Plugin Integration Tests', () => {
    it('TestCompletenessPluginとカバレッジ統合テスト', async () => {
      // プラグインが適用可能かテスト
      expect(testCompletenessPlugin.isApplicable(testProjectContext)).toBe(true);

      // パターン検出のテスト
      const patterns = await testCompletenessPlugin.detectPatterns(mockTestFile);
      
      console.log(`Detected ${patterns.length} patterns`);
      
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);

      // 品質評価のテスト
      const quality = testCompletenessPlugin.evaluateQuality(patterns);
      
      console.log('TestCompleteness Quality:', quality);
      
      expect(quality.overall).toBeGreaterThanOrEqual(0);
      expect(quality.overall).toBeLessThanOrEqual(100);
      expect(quality.confidence).toBeGreaterThan(0);
      expect(quality.confidence).toBeLessThanOrEqual(1);

      // 改善提案のテスト
      const improvements = testCompletenessPlugin.suggestImprovements(quality);
      
      console.log(`Generated ${improvements.length} improvements`);
      
      expect(Array.isArray(improvements)).toBe(true);
    });

    it('CoverageQualityPluginの統合テスト', async () => {
      // プロジェクトコンテキストの設定
      coverageQualityPlugin.setProjectContext(testProjectContext);
      
      // プラグインが適用可能かテスト
      expect(coverageQualityPlugin.isApplicable(testProjectContext)).toBe(true);

      // パターン検出のテスト
      const patterns = await coverageQualityPlugin.detectPatterns(mockTestFile);
      
      console.log(`CoverageQuality detected ${patterns.length} patterns`);
      
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);

      // 品質評価のテスト
      const quality = coverageQualityPlugin.evaluateQuality(patterns);
      
      console.log('CoverageQuality Quality:', quality);
      
      expect(quality.overall).toBeGreaterThanOrEqual(0);
      expect(quality.overall).toBeLessThanOrEqual(100);

      // 改善提案のテスト
      const improvements = coverageQualityPlugin.suggestImprovements(quality);
      
      console.log(`CoverageQuality generated ${improvements.length} improvements`);
      
      expect(Array.isArray(improvements)).toBe(true);

      // ファイルカテゴリ分析のテスト
      const testPaths = [
        '/src/auth/login.test.ts',
        '/src/security/encryption.test.ts',
        '/src/api/users.test.ts',
        '/src/utils/helpers.test.ts'
      ];

      const categories = coverageQualityPlugin.categorizeFiles(testPaths);
      
      console.log('File categories:', categories);
      
      expect(categories.auth.length + categories.security.length + 
             categories.api.length + categories.utils.length + 
             categories.other.length).toBe(testPaths.length);
    });
  });

  describe('End-to-End Issue #80 Verification', () => {
    it('issue #80: 60.35%カバレッジで適切に低スコアを算出', async () => {
      // issue #80で報告された実際のカバレッジデータを模擬
      const issueData = {
        lines: { total: 15735, covered: 9497, pct: 60.35 },
        statements: { total: 16696, covered: 9932, pct: 59.48 },
        functions: { total: 3207, covered: 1908, pct: 59.49 },
        branches: { total: 7387, covered: 3471, pct: 46.98 }
      };

      // TestQualityEvaluatorでの評価テスト
      const qualityScore = qualityEvaluator.evaluateTestQuality(issueData);
      
      console.log('Issue #80 Test - Quality Score:', qualityScore);
      
      // 60.35%のカバレッジに対して適切に低スコア（40-50点程度）を算出
      expect(qualityScore.overall).toBeLessThanOrEqual(60);
      expect(qualityScore.overall).toBeGreaterThanOrEqual(35);

      // グレード評価のテスト
      const grade = qualityEvaluator.generateQualityGrade(qualityScore.overall);
      
      console.log('Issue #80 Test - Grade:', grade);
      
      // 60%以下のカバレッジに対してC, D, Fグレードを期待
      expect(['C', 'D', 'F']).toContain(grade);

      // 改善提案の生成テスト
      const suggestions = qualityEvaluator.generateImprovementSuggestions(issueData);
      
      console.log(`Issue #80 Test - Generated ${suggestions.length} suggestions`);
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // 高優先度の改善提案が含まれることを確認
      expect(suggestions.some(s => s.priority === 'high' || s.priority === 'critical')).toBe(true);
    });

    it('issue #80: 偽陰性が解決されたことの確認', async () => {
      // 修正前（静的解析のみ）と修正後（カバレッジ統合）の比較
      
      const lowCoverageData = {
        lines: { total: 100, covered: 40, pct: 40 },
        statements: { total: 100, covered: 35, pct: 35 },
        functions: { total: 20, covered: 8, pct: 40 },
        branches: { total: 50, covered: 15, pct: 30 }
      };

      const qualityScore = qualityEvaluator.evaluateTestQuality(lowCoverageData);
      
      console.log('False Negative Test - Quality Score:', qualityScore);
      
      // 低カバレッジに対して適切に低スコアを算出（偽陰性の解決）
      expect(qualityScore.overall).toBeLessThan(60);
      
      // 信頼度も適切に低下していることを確認
      expect(qualityScore.confidence).toBeLessThan(0.8);

      console.log('✅ Issue #80 偽陰性問題が解決されました');
    });
  });

  describe('Performance Tests', () => {
    it('カバレッジ解析のパフォーマンステスト', async () => {
      const coveragePath = path.resolve(__dirname, '../../coverage');
      
      if (!fs.existsSync(coveragePath)) {
        console.log('Coverage directory not found, skipping performance test');
        return;
      }

      const startTime = Date.now();
      
      // 複数の操作を並行実行
      const [overallCoverage, lowCoverageFiles] = await Promise.all([
        coverageAnalyzer.getOverallCoverage(coveragePath),
        coverageAnalyzer.findLowCoverageFiles(coveragePath, 50)
      ]);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`Coverage analysis completed in ${executionTime}ms`);
      
      // パフォーマンス要件: 5秒以内で完了
      expect(executionTime).toBeLessThan(5000);
      
      if (overallCoverage) {
        console.log('Performance test - Overall coverage obtained');
      }
      
      console.log(`Performance test - Found ${lowCoverageFiles.length} low coverage files`);
    });
  });
});