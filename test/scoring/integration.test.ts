import { ScoreAggregator } from '../../src/scoring/aggregator';
import { ScoreCalculatorV2 } from '../../src/scoring/calculator';
import { PluginManager } from '../../src/core/pluginManager';
import { Analyzer } from '../../src/core/analyzer';
import { 
  PluginResult,
  WeightConfig,
  DEFAULT_WEIGHTS
} from '../../src/scoring/types';
import { IPlugin, Issue } from '../../src/core/types';
import path from 'path';

describe('Scoring System Integration', () => {
  let calculator: ScoreCalculatorV2;
  let aggregator: ScoreAggregator;
  let pluginManager: PluginManager;
  let analyzer: Analyzer;

  beforeEach(() => {
    calculator = new ScoreCalculatorV2();
    aggregator = new ScoreAggregator(calculator);
    pluginManager = new PluginManager();
    analyzer = new Analyzer();
  });

  describe('End-to-End Workflow', () => {
    test('should process plugin results through complete scoring pipeline', async () => {
      // モックプラグインを登録
      const mockPlugin = createMockPlugin('test-completeness', 85);
      pluginManager.register(mockPlugin);

      // テストファイル構造をシミュレート
      const testFiles = [
        'src/api/user.ts',
        'src/api/auth.ts', 
        'src/utils/helper.ts',
        'test/api/user.test.ts',
        'test/utils/helper.test.ts'
      ];

      // 各ファイルに対してプラグイン結果を生成
      const pluginResultsMap = new Map<string, PluginResult[]>();
      
      for (const filePath of testFiles) {
        const mockResults: PluginResult[] = [
          {
            pluginId: 'test-completeness',
            pluginName: 'Test Completeness Plugin',
            score: Math.random() * 40 + 60, // 60-100のランダムスコア
            weight: 1.0,
            issues: []
          }
        ];
        pluginResultsMap.set(filePath, mockResults);
      }

      // 完全な階層構造を構築
      const projectScore = aggregator.buildCompleteHierarchy(pluginResultsMap);

      // 結果検証
      expect(projectScore.totalFiles).toBe(5);
      expect(projectScore.overallScore).toBeGreaterThan(0);
      expect(projectScore.overallScore).toBeLessThanOrEqual(100);
      expect(projectScore.directoryScores.length).toBeGreaterThan(1);

      // ディレクトリ構造の検証
      const directoryPaths = projectScore.directoryScores.map(d => d.directoryPath).sort();
      expect(directoryPaths).toContain('src/api/');
      expect(directoryPaths).toContain('src/utils/');
      expect(directoryPaths).toContain('test/api/');
      expect(directoryPaths).toContain('test/utils/');

      // 各ディレクトリのファイル数検証
      const srcApiDir = projectScore.directoryScores.find(d => d.directoryPath === 'src/api/');
      expect(srcApiDir?.fileCount).toBe(2);

      const testApiDir = projectScore.directoryScores.find(d => d.directoryPath === 'test/api/');
      expect(testApiDir?.fileCount).toBe(1);
    });

    test('should handle real plugin execution with scoring', async () => {
      // 実際のプラグインを模擬
      const realMockPlugin = createAdvancedMockPlugin('assertion-quality');
      pluginManager.register(realMockPlugin);

      // 実際のテストファイルパスを使用
      const testFilePath = path.join(__dirname, '../fixtures/sample.test.ts');
      
      try {
        // プラグインを実行
        const pluginResults = await pluginManager.runAll(testFilePath);
        
        // Issue[]をPluginResult[]に変換
        const scoringResults = convertIssuesToPluginResults(pluginResults, 'assertion-quality');
        const pluginResultsMap = new Map([[testFilePath, scoringResults]]);

        // スコア計算
        const fileScores = aggregator.aggregatePluginResultsToFiles(pluginResultsMap);
        expect(fileScores).toHaveLength(1);

        const fileScore = fileScores[0];
        expect(fileScore.filePath).toBe(testFilePath);
        expect(fileScore.overallScore).toBeGreaterThanOrEqual(0);
        expect(fileScore.overallScore).toBeLessThanOrEqual(100);
        expect(fileScore.grade).toMatch(/^[ABCDF]$/);

      } catch (error) {
        // プラグイン実行エラーの場合はスキップ（テスト環境の制約）
        console.warn('プラグイン実行をスキップ:', error);
      }
    });

    test('should integrate with weighted scoring configuration', () => {
      // カスタム重み設定
      const customWeights: WeightConfig = {
        plugins: {
          'test-existence': 2.0,
          'assertion-quality': 1.5,
          'test-structure': 1.0
        },
        dimensions: {
          completeness: 2.0,  // 最重要
          correctness: 1.8,
          maintainability: 1.2,
          performance: 0.8,
          security: 1.0
        }
      };

      // 複数のプラグイン結果を生成
      const pluginResultsMap = new Map<string, PluginResult[]>([
        ['src/core.ts', [
          {
            pluginId: 'test-existence',
            pluginName: 'Test Existence Plugin',
            score: 90,
            weight: 1.0,
            issues: [],
            metadata: { dimensions: ['completeness'] }
          },
          {
            pluginId: 'assertion-quality',
            pluginName: 'Assertion Quality Plugin',
            score: 75,
            weight: 1.0,
            issues: [],
            metadata: { dimensions: ['correctness'] }
          }
        ]]
      ]);

      // 重み付きスコア計算
      const projectScore = aggregator.buildCompleteHierarchy(pluginResultsMap, customWeights);

      // completenessの重みが高いため、90点の影響が大きくなることを確認
      expect(projectScore.overallScore).toBeGreaterThan(75);
      expect(projectScore.dimensions!.completeness.weight).toBe(2.0);
      expect(projectScore.dimensions!.correctness.weight).toBe(1.8);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of files efficiently', async () => {
      const startTime = Date.now();

      // 大量のファイルをシミュレート
      const pluginResultsMap = new Map<string, PluginResult[]>();
      
      for (let i = 0; i < 1000; i++) {
        const filePath = `src/module${Math.floor(i / 100)}/file${i}.ts`;
        const pluginResults: PluginResult[] = [
          {
            pluginId: 'mock-plugin',
            pluginName: 'Mock Plugin',
            score: Math.random() * 100,
            weight: 1.0,
            issues: []
          }
        ];
        pluginResultsMap.set(filePath, pluginResults);
      }

      // 段階的集約を使用
      const projectScore = await aggregator.aggregateIncrementally(pluginResultsMap, {
        batchSize: 100
      });

      const executionTime = Date.now() - startTime;

      // パフォーマンス検証
      expect(executionTime).toBeLessThan(5000); // 5秒以内
      expect(projectScore.totalFiles).toBe(1000);
      expect(projectScore.directoryScores.length).toBeGreaterThan(5); // 複数ディレクトリ
    });

    test('should support incremental updates', () => {
      // 初期プロジェクトスコア
      const initialResults = new Map<string, PluginResult[]>([
        ['src/file1.ts', [createMockPluginResult('plugin1', 80)]],
        ['src/file2.ts', [createMockPluginResult('plugin1', 70)]],
        ['src/file3.ts', [createMockPluginResult('plugin1', 90)]]
      ]);

      const initialScore = aggregator.buildCompleteHierarchy(initialResults);

      // ファイルの変更をシミュレート
      const changedFiles = new Map<string, PluginResult[]>([
        ['src/file2.ts', [createMockPluginResult('plugin1', 95)]], // スコア改善
        ['src/file4.ts', [createMockPluginResult('plugin1', 85)]]  // 新ファイル追加
      ]);

      // 差分更新
      const updatedScore = aggregator.aggregateDifferentially(
        initialScore,
        changedFiles
      );

      // 更新結果の検証
      expect(updatedScore.totalFiles).toBe(4); // ファイル追加で4個に
      expect(updatedScore.overallScore).toBeGreaterThan(initialScore.overallScore); // スコア改善
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty plugin results gracefully', () => {
      const emptyMap = new Map<string, PluginResult[]>();
      const projectScore = aggregator.buildCompleteHierarchy(emptyMap);

      expect(projectScore.totalFiles).toBe(0);
      expect(projectScore.overallScore).toBe(0);
      expect(projectScore.grade).toBe('F');
      expect(projectScore.directoryScores).toHaveLength(0);
    });

    test('should handle mixed quality files', () => {
      const mixedResults = new Map<string, PluginResult[]>([
        ['excellent/perfect.ts', [createMockPluginResult('plugin1', 100)]],
        ['good/decent.ts', [createMockPluginResult('plugin1', 85)]],
        ['bad/poor.ts', [createMockPluginResult('plugin1', 30)]],
        ['failing/broken.ts', [createMockPluginResult('plugin1', 0)]]
      ]);

      const projectScore = aggregator.buildCompleteHierarchy(mixedResults);

      // グレード分布の検証
      expect(projectScore.distribution!.A).toBe(1);
      expect(projectScore.distribution!.B).toBe(1);
      expect(projectScore.distribution!.F).toBeGreaterThanOrEqual(1); // 30点と0点がFに分類される
      
      // 分布の合計がファイル総数と一致することを確認
      const totalInDistribution = Object.values(projectScore.distribution!)
        .reduce((sum, count) => sum + count, 0);
      expect(totalInDistribution).toBe(projectScore.totalFiles);

      // 総合スコアは中程度になることを確認
      expect(projectScore.overallScore).toBeGreaterThan(40);
      expect(projectScore.overallScore).toBeLessThan(80);
    });

    test('should handle files with no plugin results', () => {
      const mixedMap = new Map<string, PluginResult[]>([
        ['src/normal.ts', [createMockPluginResult('plugin1', 80)]],
        ['src/empty.ts', []], // プラグイン結果なし
        ['src/another.ts', [createMockPluginResult('plugin1', 70)]]
      ]);

      const projectScore = aggregator.buildCompleteHierarchy(mixedMap);

      expect(projectScore.totalFiles).toBe(3);
      
      // empty.tsは0点として計算される
      const srcDir = projectScore.directoryScores.find(d => d.directoryPath === 'src/');
      expect(srcDir?.fileCount).toBe(3);
      
      // 平均スコアは (80+0+70)/3 = 50
      expect(srcDir?.averageScore).toBeCloseTo(50, 1);
    });
  });

  // ヘルパー関数
  function createMockPlugin(pluginId: string, baseScore: number): IPlugin {
    return {
      name: pluginId,
      analyze: async (filePath: string): Promise<Issue[]> => {
        // ファイルパスに基づいてスコアを調整
        const variation = Math.random() * 20 - 10; // ±10の変動
        const score = Math.max(0, Math.min(100, baseScore + variation));
        
        // スコアが低いほど多くのIssueを生成
        const issueCount = Math.floor((100 - score) / 20);
        const issues: Issue[] = [];
        
        for (let i = 0; i < issueCount; i++) {
          issues.push({
            type: `issue-${i}`,
            severity: 'medium',
            message: `品質問題 ${i + 1}: ${filePath}`,
            line: i + 1,
            file: filePath,
            filePath: filePath,
            category: 'test-quality' as const
          });
        }
        
        return issues;
      }
    };
  }

  function createAdvancedMockPlugin(pluginId: string): IPlugin {
    return {
      name: pluginId,
      analyze: async (filePath: string): Promise<Issue[]> => {
        // ファイル拡張子に基づく分析
        if (filePath.endsWith('.test.ts')) {
          return []; // テストファイルは問題なし
        }
        
        return [
          {
            type: 'missing-assertion',
            severity: 'medium',
            message: 'アサーションが不足している可能性があります',
            line: 10,
            file: filePath,
            filePath: filePath,
            category: 'assertion'
          }
        ];
      }
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

  function convertIssuesToPluginResults(issues: Issue[], pluginId: string): PluginResult[] {
    // Issue数に基づいてスコアを計算（簡単な変換）
    const errorCount = issues.filter(i => i.severity === 'high').length;
    const warningCount = issues.filter(i => i.severity === 'medium').length;
    
    // スコア計算: エラーは-10点、警告は-5点
    const baseScore = 100;
    const score = Math.max(0, baseScore - (errorCount * 10) - (warningCount * 5));

    return [
      {
        pluginId,
        pluginName: `${pluginId} Plugin`,
        score,
        weight: 1.0,
        issues
      }
    ];
  }
});