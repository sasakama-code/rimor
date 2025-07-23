import * as path from 'path';
import { AnalyzerExtended } from '../../src/core/analyzerExtended';
import { TestCompletenessPlugin } from '../../src/plugins/core/TestCompletenessPlugin';
import { AssertionQualityPlugin } from '../../src/plugins/core/AssertionQualityPlugin';
import { TestStructurePlugin } from '../../src/plugins/core/TestStructurePlugin';
import { ProjectContext } from '../../src/core/types';

const getFixturePath = (filename: string) => path.join(__dirname, '..', 'fixtures', filename);

describe('AnalyzerExtended', () => {
  let analyzer: AnalyzerExtended;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    analyzer = new AnalyzerExtended();
    mockProjectContext = {
      rootPath: '/test/project',
      language: 'typescript',
      testFramework: 'jest',
      filePatterns: {
        test: ['**/*.test.ts', '**/*.spec.ts'],
        source: ['**/*.ts'],
        ignore: ['**/node_modules/**']
      }
    };
  });

  it('should integrate with quality plugins', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    const assertionPlugin = new AssertionQualityPlugin();
    const structurePlugin = new TestStructurePlugin();
    
    analyzer.registerQualityPlugin(completenessPlugin);
    analyzer.registerQualityPlugin(assertionPlugin);
    analyzer.registerQualityPlugin(structurePlugin);

    const result = await analyzer.analyzeWithQuality(getFixturePath('sample.test.ts'), mockProjectContext);
    
    expect(result.qualityAnalysis).toBeDefined();
    expect(result.qualityAnalysis.pluginResults).toHaveLength(3);
    expect(result.aggregatedScore).toBeDefined();
    expect(result.aggregatedScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedScore.overall).toBeLessThanOrEqual(100);
  });

  it('should maintain backward compatibility with legacy analyze method', async () => {
    const legacyResult = await analyzer.analyze(path.dirname(getFixturePath('sample.test.ts')));
    
    expect(legacyResult.totalFiles).toBeDefined();
    expect(legacyResult.issues).toBeDefined();
    expect(legacyResult.executionTime).toBeDefined();
    expect(Array.isArray(legacyResult.issues)).toBe(true);
  });

  it('should provide comprehensive analysis results', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    analyzer.registerQualityPlugin(completenessPlugin);

    const result = await analyzer.analyzeWithQuality(getFixturePath('comprehensive.test.ts'), mockProjectContext);
    
    expect(result.filePath).toBe(getFixturePath('comprehensive.test.ts'));
    expect(result.qualityAnalysis.executionStats).toBeDefined();
    expect(result.aggregatedScore.breakdown).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should aggregate scores from multiple plugins', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    const assertionPlugin = new AssertionQualityPlugin();
    
    analyzer.registerQualityPlugin(completenessPlugin);
    analyzer.registerQualityPlugin(assertionPlugin);

    const result = await analyzer.analyzeWithQuality(getFixturePath('multi-plugin.test.ts'), mockProjectContext);
    
    expect(result.aggregatedScore.breakdown.completeness).toBeDefined();
    expect(result.aggregatedScore.breakdown.correctness).toBeDefined();
    
    // 集約されたスコアは個別プラグインのスコアの加重平均
    expect(result.aggregatedScore.overall).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedScore.overall).toBeLessThanOrEqual(100);
  });

  it('should handle plugin errors gracefully', async () => {
    class ErrorPlugin extends TestCompletenessPlugin {
      async detectPatterns(): Promise<any[]> {
        throw new Error('Plugin error');
      }
    }

    const errorPlugin = new ErrorPlugin();
    analyzer.registerQualityPlugin(errorPlugin);

    const result = await analyzer.analyzeWithQuality(getFixturePath('error.test.ts'), mockProjectContext);
    
    // エラーが発生してもアナライザーは継続動作する
    expect(result.qualityAnalysis.pluginResults).toHaveLength(1);
    expect(result.qualityAnalysis.pluginResults[0].error).toBeDefined();
    expect(result.aggregatedScore).toBeDefined();
  });

  it('should provide actionable recommendations', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    const assertionPlugin = new AssertionQualityPlugin();
    
    analyzer.registerQualityPlugin(completenessPlugin);
    analyzer.registerQualityPlugin(assertionPlugin);

    const result = await analyzer.analyzeWithQuality(getFixturePath('needs-improvement.test.ts'), mockProjectContext);
    
    expect(Array.isArray(result.recommendations)).toBe(true);
    
    if (result.recommendations.length > 0) {
      const recommendation = result.recommendations[0];
      expect(recommendation.priority).toBeDefined();
      expect(['critical', 'high', 'medium', 'low']).toContain(recommendation.priority);
      expect(recommendation.title).toBeDefined();
      expect(recommendation.description).toBeDefined();
      expect(recommendation.estimatedImpact).toBeDefined();
    }
  });

  it('should calculate confidence scores correctly', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    analyzer.registerQualityPlugin(completenessPlugin);

    const result = await analyzer.analyzeWithQuality(getFixturePath('confidence.test.ts'), mockProjectContext);
    
    expect(result.aggregatedScore.confidence).toBeGreaterThanOrEqual(0);
    expect(result.aggregatedScore.confidence).toBeLessThanOrEqual(1);
    
    // 信頼度は個別プラグインの信頼度の加重平均
    const pluginConfidences = result.qualityAnalysis.pluginResults.map(r => r.qualityScore.confidence);
    if (pluginConfidences.length > 0) {
      const avgConfidence = pluginConfidences.reduce((sum, c) => sum + c, 0) / pluginConfidences.length;
      expect(Math.abs(result.aggregatedScore.confidence - avgConfidence)).toBeLessThan(0.1);
    }
  });

  it('should support filtering by plugin types', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    const assertionPlugin = new AssertionQualityPlugin();
    const structurePlugin = new TestStructurePlugin();
    
    analyzer.registerQualityPlugin(completenessPlugin);
    analyzer.registerQualityPlugin(assertionPlugin);
    analyzer.registerQualityPlugin(structurePlugin);

    const result = await analyzer.analyzeWithQuality(
      getFixturePath('filtered.test.ts'), 
      mockProjectContext,
      { skipPlugins: ['test-structure'] }
    );
    
    expect(result.qualityAnalysis.pluginResults).toHaveLength(2);
    expect(result.qualityAnalysis.pluginResults.every(r => r.pluginId !== 'test-structure')).toBe(true);
  });

  it('should provide performance metrics', async () => {
    const completenessPlugin = new TestCompletenessPlugin();
    analyzer.registerQualityPlugin(completenessPlugin);

    const startTime = Date.now();
    const result = await analyzer.analyzeWithQuality(getFixturePath('performance.test.ts'), mockProjectContext);
    const endTime = Date.now();
    
    expect(result.qualityAnalysis.executionStats.totalExecutionTime).toBeGreaterThanOrEqual(0);
    expect(result.qualityAnalysis.executionStats.totalExecutionTime).toBeLessThan(endTime - startTime + 100);
    expect(result.qualityAnalysis.executionStats.totalPlugins).toBe(1);
    expect(result.qualityAnalysis.executionStats.successfulPlugins).toBe(1);
    expect(result.qualityAnalysis.executionStats.failedPlugins).toBe(0);
  });

  it('should integrate with legacy plugins', async () => {
    // 既存のlegacyプラグインも使用可能であることをテスト
    const legacyPlugin = {
      name: 'legacy-test-plugin',
      async analyze(_filePath: string) {
        return [{
          type: 'legacy-issue',
          severity: 'warning' as const,
          message: 'Legacy plugin issue detected'
        }];
      }
    };

    analyzer.registerPlugin(legacyPlugin);

    const result = await analyzer.analyze(getFixturePath('legacy.test.ts'));
    
    expect(result.issues.some(issue => issue.type === 'legacy-issue')).toBe(true);
  });

  describe('batch analysis', () => {
    it('should support analyzing multiple files', async () => {
      const completenessPlugin = new TestCompletenessPlugin();
      analyzer.registerQualityPlugin(completenessPlugin);

      const files = [
        getFixturePath('test1.test.ts'),
        getFixturePath('test2.test.ts'),
        getFixturePath('test3.test.ts')
      ];

      const results = await analyzer.analyzeMultiple(files, mockProjectContext);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.filePath).toBeDefined();
        expect(result.qualityAnalysis).toBeDefined();
        expect(result.aggregatedScore).toBeDefined();
      });
    });

    it('should provide summary statistics for batch analysis', async () => {
      const completenessPlugin = new TestCompletenessPlugin();
      analyzer.registerQualityPlugin(completenessPlugin);

      const files = [
        getFixturePath('good.test.ts'),
        getFixturePath('bad.test.ts')
      ];

      const results = await analyzer.analyzeMultiple(files, mockProjectContext);
      const summary = analyzer.generateSummary(results);
      
      expect(summary.totalFiles).toBe(2);
      expect(summary.averageScore).toBeGreaterThanOrEqual(0);
      expect(summary.averageScore).toBeLessThanOrEqual(100);
      expect(summary.scoreDistribution).toBeDefined();
      expect(summary.commonIssues).toBeDefined();
      expect(Array.isArray(summary.commonIssues)).toBe(true);
    });
  });

  // CI環境での非同期ハンドル問題解決
  afterAll(async () => {
    // 非同期ファイル操作の完了を待機
    await new Promise(resolve => setTimeout(resolve, 100));
  });
});