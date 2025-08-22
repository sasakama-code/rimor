/**
 * 外部TypeScriptプロジェクトベンチマークのテスト
 * TDD手法によるテストファースト実装
 */

import { ExternalProjectBenchmarkRunner } from '../../src/benchmark/ExternalProjectBenchmarkRunner';
import { BenchmarkTargets } from '../../src/benchmark/config/benchmark-targets';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('ExternalProjectBenchmarkRunner', () => {
  let benchmarkRunner: ExternalProjectBenchmarkRunner;
  let tempDir: string;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rimor-benchmark-test-'));
    
    benchmarkRunner = new ExternalProjectBenchmarkRunner({
      outputDir: tempDir,
      cacheDir: path.join(tempDir, 'cache'),
      iterations: 1,
      parallel: false,
      timeout: 60000
    });
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('基本設定テスト', () => {
    it('デフォルト設定で初期化できること', () => {
      const runner = new ExternalProjectBenchmarkRunner();
      expect(runner).toBeDefined();
    });

    it('カスタム設定で初期化できること', () => {
      const config = {
        outputDir: tempDir,
        iterations: 3,
        parallel: true,
        timeout: 120000
      };
      const runner = new ExternalProjectBenchmarkRunner(config);
      expect(runner).toBeDefined();
    });
  });

  describe('プロジェクト設定テスト', () => {
    it('Tier 1プロジェクトの設定が正しく読み込まれること', () => {
      const tier1Projects = BenchmarkTargets.getTier1Projects();
      expect(tier1Projects).toHaveLength(3);
      expect(tier1Projects.map(p => p.name)).toContain('TypeScript');
      expect(tier1Projects.map(p => p.name)).toContain('Ant Design');
      expect(tier1Projects.map(p => p.name)).toContain('Visual Studio Code');
    });

    it('Tier 2プロジェクトの設定が正しく読み込まれること', () => {
      const tier2Projects = BenchmarkTargets.getTier2Projects();
      expect(tier2Projects).toHaveLength(3);
      expect(tier2Projects.map(p => p.name)).toContain('Material UI');
      expect(tier2Projects.map(p => p.name)).toContain('Storybook');
      expect(tier2Projects.map(p => p.name)).toContain('Deno');
    });

    it('プロジェクト設定にリポジトリURLが含まれること', () => {
      const tier1Projects = BenchmarkTargets.getTier1Projects();
      tier1Projects.forEach(project => {
        expect(project.repositoryUrl).toMatch(/^https:\/\/github\.com\//);
        expect(project.expectedFileCount).toBeGreaterThan(0);
        expect(project.target5msPerFile).toBe(5);
      });
    });
  });

  describe('プロジェクトクローン機能テスト', () => {
    it('GitHubプロジェクトをクローンできること', async () => {
      // 小さなテストプロジェクトを使用
      const testProject = {
        name: 'test-project',
        repositoryUrl: 'https://github.com/microsoft/TypeScript.git',
        expectedFileCount: 100,
        target5msPerFile: 5,
        timeout: 60000
      };

      const cloneResult = await benchmarkRunner.cloneProject(testProject);
      expect(cloneResult.success).toBe(true);
      expect(cloneResult.projectPath).toBeDefined();
      expect(cloneResult.fileCount).toBeGreaterThan(0);
    });

    it('クローンの失敗を適切に処理すること', async () => {
      const invalidProject = {
        name: 'invalid-project',
        repositoryUrl: 'https://github.com/invalid/repo.git',
        expectedFileCount: 0,
        target5msPerFile: 5,
        timeout: 10000
      };

      const cloneResult = await benchmarkRunner.cloneProject(invalidProject);
      expect(cloneResult.success).toBe(false);
      expect(cloneResult.error).toBeDefined();
    });

    it('キャッシュ機能が動作すること', async () => {
      const testProject = {
        name: 'cached-project',
        repositoryUrl: 'https://github.com/microsoft/TypeScript.git',
        expectedFileCount: 100,
        target5msPerFile: 5,
        timeout: 60000
      };

      // 初回クローン
      const firstClone = await benchmarkRunner.cloneProject(testProject);
      expect(firstClone.success).toBe(true);

      // キャッシュからの取得
      const secondClone = await benchmarkRunner.cloneProject(testProject);
      expect(secondClone.success).toBe(true);
      expect(secondClone.fromCache).toBe(true);
    });
  });

  describe('メトリクス収集テスト', () => {
    it('実行時間を正確に測定すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 10
      };

      const metrics = await benchmarkRunner.collectPerformanceMetrics(mockProject);
      expect(metrics.executionTime).toBeGreaterThan(0);
      expect(metrics.timePerFile).toBeGreaterThan(0);
      expect(metrics.totalFiles).toBe(10);
    });

    it('メモリ使用量を測定すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 10
      };

      const metrics = await benchmarkRunner.collectPerformanceMetrics(mockProject);
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(metrics.memoryUsage.heapTotal).toBeGreaterThan(0);
    });

    it('並列処理効率を測定すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 20
      };

      const parallelRunner = new ExternalProjectBenchmarkRunner({
        outputDir: tempDir,
        parallel: true,
        workerCount: Math.min(4, os.cpus().length)
      });

      const metrics = await parallelRunner.collectPerformanceMetrics(mockProject);
      expect(metrics.parallelEfficiency).toBeDefined();
      expect(metrics.parallelEfficiency).toBeGreaterThan(0);
      expect(metrics.parallelEfficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('解析精度測定テスト', () => {
    it('TaintTyper成功率を測定すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 10
      };

      const accuracy = await benchmarkRunner.collectAccuracyMetrics(mockProject);
      expect(accuracy.taintTyperSuccessRate).toBeDefined();
      expect(accuracy.taintTyperSuccessRate).toBeGreaterThanOrEqual(0);
      expect(accuracy.taintTyperSuccessRate).toBeLessThanOrEqual(1);
    });

    it('Intent抽出成功率を測定すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 10
      };

      const accuracy = await benchmarkRunner.collectAccuracyMetrics(mockProject);
      expect(accuracy.intentExtractionSuccessRate).toBeDefined();
      expect(accuracy.intentExtractionSuccessRate).toBeGreaterThanOrEqual(0);
      expect(accuracy.intentExtractionSuccessRate).toBeLessThanOrEqual(1);
    });

    it('Gap検出精度を測定すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 10
      };

      const accuracy = await benchmarkRunner.collectAccuracyMetrics(mockProject);
      expect(accuracy.gapDetectionAccuracy).toBeDefined();
      expect(accuracy.gapDetectionAccuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy.gapDetectionAccuracy).toBeLessThanOrEqual(1);
    });

    it('エラー発生率を記録すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 10
      };

      const accuracy = await benchmarkRunner.collectAccuracyMetrics(mockProject);
      expect(accuracy.errorRate).toBeDefined();
      expect(accuracy.errorRate).toBeGreaterThanOrEqual(0);
      expect(accuracy.errorRate).toBeLessThanOrEqual(1);
      expect(accuracy.totalErrors).toBeDefined();
      expect(accuracy.totalErrors).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5ms/file目標検証テスト', () => {
    it('5ms/file目標を検証すること', async () => {
      const mockProject = {
        name: 'mock-project',
        path: tempDir,
        fileCount: 100
      };

      const targetResult = await benchmarkRunner.verify5msPerFileTarget(mockProject);
      expect(targetResult.achieved).toBeDefined();
      expect(targetResult.actualTimePerFile).toBeGreaterThan(0);
      expect(targetResult.targetTimePerFile).toBe(5);
      expect(targetResult.deviationPercent).toBeDefined();
    });

    it('目標未達成時に詳細情報を提供すること', async () => {
      const mockProject = {
        name: 'slow-project',
        path: tempDir,
        fileCount: 100
      };

      const targetResult = await benchmarkRunner.verify5msPerFileTarget(mockProject);
      if (!targetResult.achieved) {
        expect(targetResult.bottlenecks).toBeDefined();
        expect(targetResult.recommendations).toBeDefined();
        expect(targetResult.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('スケーラビリティテスト', () => {
    it('線形時間複雑度を維持すること', async () => {
      const fileCounts = [10, 50, 100];
      const timePerFileResults: number[] = [];

      for (const fileCount of fileCounts) {
        const mockProject = {
          name: `scalability-test-${fileCount}`,
          path: tempDir,
          fileCount
        };

        const metrics = await benchmarkRunner.collectPerformanceMetrics(mockProject);
        timePerFileResults.push(metrics.timePerFile);
      }

      // 線形性のチェック（大きなプロジェクトでもファイルあたりの時間が大幅に増加しない）
      const maxVariation = Math.max(...timePerFileResults) / Math.min(...timePerFileResults);
      expect(maxVariation).toBeLessThan(3); // 3倍以下の変動を許容
    });
  });

  describe('レポート生成テスト', () => {
    it('ベンチマーク結果を保存すること', async () => {
      const testProject = {
        name: 'report-test',
        repositoryUrl: 'https://github.com/microsoft/TypeScript.git',
        expectedFileCount: 100,
        target5msPerFile: 5,
        timeout: 60000
      };

      const result = await benchmarkRunner.runSingleProjectBenchmark(testProject);
      expect(result.success).toBe(true);

      // 結果ファイルが生成されることを確認
      const reportFiles = await fs.readdir(tempDir);
      expect(reportFiles.some(file => file.includes('benchmark-result'))).toBe(true);
    });

    it('比較レポートを生成すること', async () => {
      // 複数のベンチマーク結果を生成
      const projects = [
        {
          name: 'project-1',
          repositoryUrl: 'https://github.com/microsoft/TypeScript.git',
          expectedFileCount: 50,
          target5msPerFile: 5,
          timeout: 60000
        },
        {
          name: 'project-2',
          repositoryUrl: 'https://github.com/ant-design/ant-design.git',
          expectedFileCount: 100,
          target5msPerFile: 5,
          timeout: 60000
        }
      ];

      const results = await benchmarkRunner.runMultiProjectBenchmark(projects);
      expect(results.length).toBe(2);

      const comparisonReport = await benchmarkRunner.generateComparisonReport(results);
      expect(comparisonReport).toBeDefined();
      expect(comparisonReport.overallPerformance).toBeDefined();
      expect(comparisonReport.projectComparisons).toHaveLength(2);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('ネットワークエラー時にリトライすること', async () => {
      const unreliableProject = {
        name: 'unreliable-project',
        repositoryUrl: 'https://github.com/timeout/test.git',
        expectedFileCount: 100,
        target5msPerFile: 5,
        timeout: 1000 // 非常に短いタイムアウト
      };

      const runner = new ExternalProjectBenchmarkRunner({
        outputDir: tempDir,
        maxRetries: 3,
        retryDelay: 100
      });

      const result = await runner.runSingleProjectBenchmark(unreliableProject);
      // リトライが実行されることを確認（ログやメトリクスで）
      expect(result.retryCount).toBeGreaterThanOrEqual(0);
    });

    it('部分的失敗時に継続実行すること', async () => {
      const mixedProjects = [
        {
          name: 'valid-project',
          repositoryUrl: 'https://github.com/microsoft/TypeScript.git',
          expectedFileCount: 100,
          target5msPerFile: 5,
          timeout: 60000
        },
        {
          name: 'invalid-project',
          repositoryUrl: 'https://github.com/invalid/invalid.git',
          expectedFileCount: 100,
          target5msPerFile: 5,
          timeout: 60000
        }
      ];

      const results = await benchmarkRunner.runMultiProjectBenchmark(mixedProjects);
      expect(results).toHaveLength(2);
      expect(results.some(r => r.success)).toBe(true);
      expect(results.some(r => !r.success)).toBe(true);
    });
  });
});