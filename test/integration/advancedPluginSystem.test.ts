import * as path from 'path';
import { AnalyzerExtended } from '../../src/core/analyzerExtended';
import { PluginManagerExtended } from '../../src/core/pluginManagerExtended';
import { TestCompletenessPlugin } from '../../src/plugins/core/TestCompletenessPlugin';
import { AssertionQualityPlugin } from '../../src/plugins/core/AssertionQualityPlugin';
import { TestStructurePlugin } from '../../src/plugins/core/TestStructurePlugin';
import { LegacyPluginAdapter } from '../../src/plugins/migration/LegacyPluginAdapter';
import { ProjectContext, IPlugin, PluginResult, TestFile } from '../../src/core/types';

const getFixturePath = (filename: string) => path.join(__dirname, '../fixtures', filename);

describe('Advanced Plugin System Integration', () => {
  let analyzer: AnalyzerExtended;
  let pluginManager: PluginManagerExtended;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    analyzer = new AnalyzerExtended();
    pluginManager = new PluginManagerExtended();
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

  describe('End-to-End Plugin Workflow', () => {
    it('should execute complete analysis workflow with multiple plugins', async () => {
      // プラグインの登録
      const completenessPlugin = new TestCompletenessPlugin();
      const assertionPlugin = new AssertionQualityPlugin();
      const structurePlugin = new TestStructurePlugin();

      analyzer.registerQualityPlugin(completenessPlugin);
      analyzer.registerQualityPlugin(assertionPlugin);
      analyzer.registerQualityPlugin(structurePlugin);

      // 分析実行
      const result = await analyzer.analyzeWithQuality(
        getFixturePath('comprehensive.test.ts'),
        mockProjectContext
      );

      // 結果検証
      expect(result.qualityAnalysis.pluginResults).toHaveLength(3);
      expect(result.aggregatedScore.overall).toBeGreaterThanOrEqual(0);
      expect(result.aggregatedScore.overall).toBeLessThanOrEqual(100);
      expect(result.aggregatedScore.breakdown).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should handle mixed legacy and new plugin architectures', async () => {
      // 新しいプラグイン
      const newPlugin = new TestCompletenessPlugin();
      analyzer.registerQualityPlugin(newPlugin);

      // 既存のプラグイン（アダプター経由）
      const legacyPlugin: IPlugin = {
        name: 'legacy-test-plugin',
        async analyze(filePath: string) {
          return [{
            type: 'legacy-issue',
            severity: 'warning' as const,
            message: 'Legacy plugin detected issue'
          }];
        }
      };
      analyzer.registerPlugin(legacyPlugin);

      // 分析実行
      const newResult = await analyzer.analyzeWithQuality(
        getFixturePath('sample.test.ts'),
        mockProjectContext
      );
      const legacyResult = await analyzer.analyze(path.dirname(getFixturePath('sample.test.ts')));

      // 新システムの結果検証（レガシープラグインと新プラグインの両方が実行される）
      expect(newResult.qualityAnalysis.pluginResults.length).toBeGreaterThan(0);
      expect(newResult.aggregatedScore).toBeDefined();

      // レガシーシステムの結果検証
      expect(legacyResult.issues.some(issue => issue.type === 'legacy-issue')).toBe(true);
    });

    it('should provide consistent results across analysis modes', async () => {
      const plugin = new AssertionQualityPlugin();
      analyzer.registerQualityPlugin(plugin);

      const singleResult = await analyzer.analyzeWithQuality(
        getFixturePath('sample.test.ts'),
        mockProjectContext
      );

      const batchResults = await analyzer.analyzeMultiple(
        [getFixturePath('sample.test.ts')],
        mockProjectContext
      );

      // 単一ファイル分析とバッチ分析の結果が一致することを確認
      expect(batchResults).toHaveLength(1);
      expect(batchResults[0].aggregatedScore.overall).toBe(singleResult.aggregatedScore.overall);
      expect(batchResults[0].qualityAnalysis.pluginResults).toHaveLength(
        singleResult.qualityAnalysis.pluginResults.length
      );
    });
  });

  describe('Plugin Manager Integration', () => {
    it('should manage plugin lifecycle correctly', async () => {
      const plugin1 = new TestCompletenessPlugin();
      const plugin2 = new AssertionQualityPlugin();

      // プラグイン登録
      pluginManager.registerQualityPlugin(plugin1);
      pluginManager.registerQualityPlugin(plugin2);

      expect(pluginManager.getRegisteredPlugins().qualityPlugins).toHaveLength(2);

      // プラグイン実行
      const testFile = {
        path: getFixturePath('sample.test.ts'),
        content: '',
        metadata: {
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const results = await pluginManager.runQualityPlugins([testFile], mockProjectContext);
      
      expect(results).toHaveLength(1);
      expect(results[0].pluginResults).toHaveLength(2);
      expect(results[0].pluginResults.every(r => r.pluginId && r.qualityScore)).toBe(true);
    });

    it('should handle plugin errors gracefully', async () => {
      class ErrorPlugin extends TestCompletenessPlugin {
        async detectPatterns(): Promise<any[]> {
          throw new Error('Plugin execution failed');
        }
      }

      const errorPlugin = new ErrorPlugin();
      const goodPlugin = new AssertionQualityPlugin();

      pluginManager.registerQualityPlugin(errorPlugin);
      pluginManager.registerQualityPlugin(goodPlugin);

      const testFile = {
        path: getFixturePath('sample.test.ts'),
        content: '',
        metadata: {
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const results = await pluginManager.runQualityPlugins([testFile], mockProjectContext);

      expect(results).toHaveLength(1);
      expect(results[0].pluginResults).toHaveLength(2);
      
      // エラープラグインの結果
      const errorResult = results[0].pluginResults.find(r => r.error);
      expect(errorResult).toBeDefined();
      expect(errorResult?.error).toContain('Plugin execution failed');

      // 正常プラグインの結果
      const successResult = results[0].pluginResults.find(r => !r.error);
      expect(successResult).toBeDefined();
      expect(successResult?.qualityScore).toBeDefined();
    });

    it('should respect plugin execution timeouts', async () => {
      class SlowPlugin extends TestCompletenessPlugin {
        async detectPatterns(): Promise<any[]> {
          await new Promise(resolve => setTimeout(resolve, 100));
          return [];
        }
      }

      const slowPlugin = new SlowPlugin();
      pluginManager.registerQualityPlugin(slowPlugin);

      const testFile = {
        path: getFixturePath('sample.test.ts'),
        content: '',
        metadata: {
          language: 'typescript',
          lastModified: new Date()
        }
      };

      // 短いタイムアウトで実行
      const results = await pluginManager.runQualityPlugins(
        [testFile], 
        mockProjectContext, 
        { timeout: 50 }
      );

      expect(results).toHaveLength(1);
      expect(results[0].pluginResults).toHaveLength(1);
      expect(results[0].pluginResults[0].error).toContain('timeout');
    });
  });

  describe('Legacy Plugin Adapter', () => {
    it('should seamlessly integrate legacy plugins', async () => {
      const legacyPlugin: IPlugin = {
        name: 'test-existence-legacy',
        async analyze(filePath: string) {
          return [{
            type: 'missing-test',
            severity: 'error' as const,
            message: 'Test file does not exist',
            file: filePath
          }];
        }
      };

      const adapter = new LegacyPluginAdapter(legacyPlugin);
      pluginManager.registerQualityPlugin(adapter);

      const testFile = {
        path: getFixturePath('sample.test.ts'),
        content: '',
        metadata: {
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const results = await pluginManager.runQualityPlugins([testFile], mockProjectContext);

      expect(results).toHaveLength(1);
      expect(results[0].pluginResults).toHaveLength(1);
      
      const result = results[0].pluginResults[0];
      expect(result.pluginId).toBe('legacy-adapter-test-existence-legacy');
      expect(result.detectionResults).toHaveLength(1);
      expect(result.detectionResults[0].patternName).toBe('Legacy Issue: missing-test');
    });

    it('should maintain backward compatibility', async () => {
      const legacyPlugin: IPlugin = {
        name: 'compatibility-test',
        async analyze() {
          return [{
            type: 'compatibility-issue',
            severity: 'warning' as const,
            message: 'Backward compatibility maintained'
          }];
        }
      };

      // レガシー方式での登録
      analyzer.registerPlugin(legacyPlugin);

      // レガシー方式での実行
      const legacyResult = await analyzer.analyze(path.dirname(getFixturePath('sample.test.ts')));

      expect(legacyResult.issues.some(issue => 
        issue.type === 'compatibility-issue' && 
        issue.message === 'Backward compatibility maintained'
      )).toBe(true);
    });
  });

  describe('Quality Score Aggregation', () => {
    it('should aggregate scores from multiple plugins correctly', async () => {
      const plugin1 = new TestCompletenessPlugin();
      const plugin2 = new AssertionQualityPlugin();
      const plugin3 = new TestStructurePlugin();

      analyzer.registerQualityPlugin(plugin1);
      analyzer.registerQualityPlugin(plugin2);
      analyzer.registerQualityPlugin(plugin3);

      const result = await analyzer.analyzeWithQuality(
        getFixturePath('comprehensive.test.ts'),
        mockProjectContext
      );

      // 集約スコアの検証
      expect(result.aggregatedScore.overall).toBeGreaterThanOrEqual(0);
      expect(result.aggregatedScore.overall).toBeLessThanOrEqual(100);
      expect(result.aggregatedScore.confidence).toBeGreaterThanOrEqual(0);
      expect(result.aggregatedScore.confidence).toBeLessThanOrEqual(1);

      // 内訳の検証
      expect(result.aggregatedScore.breakdown.completeness).toBeGreaterThanOrEqual(0);
      expect(result.aggregatedScore.breakdown.correctness).toBeGreaterThanOrEqual(0);
      expect(result.aggregatedScore.breakdown.maintainability).toBeGreaterThanOrEqual(0);

      // 推奨事項の検証
      expect(Array.isArray(result.recommendations)).toBe(true);
      if (result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          expect(rec.priority).toBeDefined();
          expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority);
          expect(rec.title).toBeDefined();
          expect(rec.description).toBeDefined();
        });
      }
    });

    it('should handle weighted scoring correctly', async () => {
      // 高信頼度プラグイン
      class HighConfidencePlugin extends TestCompletenessPlugin {
        evaluateQuality(patterns: any[]): any {
          const baseScore = super.evaluateQuality(patterns);
          return {
            ...baseScore,
            confidence: 0.95
          };
        }
      }

      // 低信頼度プラグイン
      class LowConfidencePlugin extends AssertionQualityPlugin {
        evaluateQuality(patterns: any[]): any {
          const baseScore = super.evaluateQuality(patterns);
          return {
            ...baseScore,
            confidence: 0.3
          };
        }
      }

      const highConfPlugin = new HighConfidencePlugin();
      const lowConfPlugin = new LowConfidencePlugin();

      analyzer.registerQualityPlugin(highConfPlugin);
      analyzer.registerQualityPlugin(lowConfPlugin);

      const result = await analyzer.analyzeWithQuality(
        getFixturePath('sample.test.ts'),
        mockProjectContext
      );

      // 高信頼度プラグインの結果がより重視されていることを確認
      const highConfResult = result.qualityAnalysis.pluginResults.find(r => 
        r.qualityScore.confidence > 0.9
      );
      const lowConfResult = result.qualityAnalysis.pluginResults.find(r => 
        r.qualityScore.confidence < 0.5
      );

      expect(highConfResult).toBeDefined();
      expect(lowConfResult).toBeDefined();
      
      // 集約された信頼度は両者の中間値になるはず
      expect(result.aggregatedScore.confidence).toBeGreaterThan(0.3);
      expect(result.aggregatedScore.confidence).toBeLessThan(0.95);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large number of files efficiently', async () => {
      const plugin = new AssertionQualityPlugin();
      analyzer.registerQualityPlugin(plugin);

      const files = [
        getFixturePath('test1.test.ts'),
        getFixturePath('test2.test.ts'),
        getFixturePath('test3.test.ts'),
        getFixturePath('sample.test.ts'),
        getFixturePath('comprehensive.test.ts')
      ];

      const startTime = Date.now();
      const results = await analyzer.analyzeMultiple(files, mockProjectContext);
      const endTime = Date.now();

      expect(results).toHaveLength(files.length);
      expect(endTime - startTime).toBeLessThan(10000); // 10秒以内

      // すべてのファイルが正常に処理されていることを確認
      results.forEach(result => {
        expect(result.qualityAnalysis.pluginResults).toHaveLength(1);
        expect(result.aggregatedScore).toBeDefined();
      });
    });

    it('should provide meaningful summary statistics', async () => {
      const plugin = new TestCompletenessPlugin();
      analyzer.registerQualityPlugin(plugin);

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
});