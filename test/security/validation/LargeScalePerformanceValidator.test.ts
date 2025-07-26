/**
 * LargeScalePerformanceValidator.test.ts
 * 大規模性能バリデーターのテスト
 */

import { LargeScalePerformanceValidator } from '../../../src/security/validation/LargeScalePerformanceValidator';

describe('LargeScalePerformanceValidator - 大規模性能バリデーター', () => {
  let validator: LargeScalePerformanceValidator;

  beforeEach(() => {
    validator = new LargeScalePerformanceValidator();
  });

  describe('スケーラビリティテスト', () => {
    it('小規模プロジェクト（<100ファイル）の性能を検証すること', async () => {
      const smallProject = {
        fileCount: 50,
        totalLinesOfCode: 5000,
        testFiles: 25
      };

      const result = await validator.validateSmallScale(smallProject);

      expect(result).toBeDefined();
      expect(result.passed).toBe(true);
      expect(result.executionTime).toBeLessThan(5000); // 5秒以内
      expect(result.memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB以内
      expect(result.performanceScore).toBeGreaterThan(0.8);
    });

    it('中規模プロジェクト（100-1000ファイル）の性能を検証すること', async () => {
      const mediumProject = {
        fileCount: 500,
        totalLinesOfCode: 50000,
        testFiles: 250
      };

      const result = await validator.validateMediumScale(mediumProject);

      expect(result).toBeDefined();
      expect(result.executionTime).toBeLessThan(30000); // 30秒以内
      expect(result.memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB以内
      expect(result.performanceScore).toBeGreaterThan(0.7);
    });

    it('大規模プロジェクト（1000+ファイル）の性能を検証すること', async () => {
      const largeProject = {
        fileCount: 2000,
        totalLinesOfCode: 200000,
        testFiles: 1000
      };

      const result = await validator.validateLargeScale(largeProject);

      expect(result).toBeDefined();
      expect(result.executionTime).toBeLessThan(120000); // 2分以内
      expect(result.memoryUsage).toBeLessThan(1024 * 1024 * 1024); // 1GB以内
      expect(result.performanceScore).toBeGreaterThan(0.6);
    });
  });

  describe('パフォーマンス回帰テスト', () => {
    it('以前のバージョンとの性能比較を行うこと', async () => {
      const baselineData = {
        version: '0.6.0',
        executionTime: 10000,
        memoryUsage: 200 * 1024 * 1024,
        filesProcessed: 500
      };

      const currentData = {
        version: '0.7.0',
        executionTime: 12000,
        memoryUsage: 180 * 1024 * 1024,
        filesProcessed: 500
      };

      const comparison = validator.comparePerformance(baselineData, currentData);

      expect(comparison).toBeDefined();
      expect(comparison.executionTimeChange).toBeCloseTo(0.2, 1); // 20%増加
      expect(comparison.memoryUsageChange).toBeCloseTo(-0.1, 1); // 10%減少
      expect(comparison.overallRegression).toBeDefined();
    });

    it('性能劣化を検出すること', async () => {
      const goodData = {
        version: '0.6.0',
        executionTime: 5000,
        memoryUsage: 100 * 1024 * 1024,
        filesProcessed: 200
      };

      const degradedData = {
        version: '0.7.0',
        executionTime: 15000, // 3倍に増加
        memoryUsage: 300 * 1024 * 1024, // 3倍に増加
        filesProcessed: 200
      };

      const regression = validator.detectRegression(goodData, degradedData);

      expect(regression.hasRegression).toBe(true);
      expect(regression.severity).toBe('high');
      expect(regression.affectedMetrics).toContain('executionTime');
      expect(regression.affectedMetrics).toContain('memoryUsage');
    });
  });

  describe('リソース制限テスト', () => {
    it('メモリ制限下での動作を検証すること', async () => {
      const memoryLimit = 256 * 1024 * 1024; // 256MB
      validator.setMemoryLimit(memoryLimit);

      const project = {
        fileCount: 1000,
        totalLinesOfCode: 100000,
        testFiles: 500
      };

      const result = await validator.validateWithMemoryLimit(project);

      expect(result).toBeDefined();
      expect(result.memoryUsage).toBeLessThanOrEqual(memoryLimit);
      expect(result.passed).toBe(true);
    });

    it('CPU制限下での動作を検証すること', async () => {
      const cpuLimit = 2; // 2コア
      validator.setCpuLimit(cpuLimit);

      const project = {
        fileCount: 800,
        totalLinesOfCode: 80000,
        testFiles: 400
      };

      const result = await validator.validateWithCpuLimit(project);

      expect(result).toBeDefined();
      expect(result.cpuUsage).toBeLessThanOrEqual(cpuLimit * 100); // CPU使用率%
    });

    it('時間制限下での動作を検証すること', async () => {
      const timeLimit = 60000; // 60秒
      validator.setTimeLimit(timeLimit);

      const project = {
        fileCount: 1500,
        totalLinesOfCode: 150000,
        testFiles: 750
      };

      const startTime = Date.now();
      const result = await validator.validateWithTimeLimit(project);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThanOrEqual(timeLimit + 5000); // 誤差を考慮
    });
  });

  describe('並列処理性能テスト', () => {
    it('並列処理による性能向上を検証すること', async () => {
      const project = {
        fileCount: 400,
        totalLinesOfCode: 40000,
        testFiles: 200
      };

      // シーケンシャル実行
      const sequentialResult = await validator.validateSequential(project);
      
      // 並列実行
      const parallelResult = await validator.validateParallel(project);

      expect(parallelResult.executionTime).toBeLessThan(sequentialResult.executionTime);
      
      const speedup = sequentialResult.executionTime / parallelResult.executionTime;
      expect(speedup).toBeGreaterThan(1.5); // 最低1.5倍の高速化
    });

    it('適切な並列度を決定すること', async () => {
      const project = {
        fileCount: 800,
        totalLinesOfCode: 80000,
        testFiles: 400
      };

      const optimalParallelism = validator.determineOptimalParallelism(project);

      expect(optimalParallelism).toBeGreaterThan(1);
      expect(optimalParallelism).toBeLessThanOrEqual(require('os').cpus().length);
    });
  });

  describe('負荷テスト', () => {
    it('高負荷状態での安定性を検証すること', async () => {
      const highLoadProject = {
        fileCount: 5000,
        totalLinesOfCode: 500000,
        testFiles: 2500
      };

      const result = await validator.validateUnderHighLoad(highLoadProject);

      expect(result).toBeDefined();
      expect(result.stability).toBeGreaterThan(0.95); // 95%以上の安定性
      expect(result.errorRate).toBeLessThan(0.01); // エラー率1%未満
    });

    it('メモリリークの検出を行うこと', async () => {
      const project = {
        fileCount: 1000,
        totalLinesOfCode: 100000,
        testFiles: 500
      };

      const memoryLeakTest = await validator.detectMemoryLeaks(project);

      expect(memoryLeakTest).toBeDefined();
      expect(memoryLeakTest.hasMemoryLeak).toBe(false);
      expect(memoryLeakTest.memoryGrowthRate).toBeLessThan(0.1); // 10%未満の増加率
    });
  });

  describe('ベンチマーク統合', () => {
    it('業界標準ベンチマークとの比較を行うこと', async () => {
      const project = {
        fileCount: 1000,
        totalLinesOfCode: 100000,
        testFiles: 500
      };

      const benchmarkResult = await validator.compareWithIndustryBenchmark(project);

      expect(benchmarkResult).toBeDefined();
      expect(benchmarkResult.rimorPerformance).toBeDefined();
      expect(benchmarkResult.industryAverage).toBeDefined();
      expect(benchmarkResult.ranking).toBeGreaterThan(0);
      expect(benchmarkResult.ranking).toBeLessThanOrEqual(100);
    });

    it('競合ツールとの性能比較を行うこと', async () => {
      const project = {
        fileCount: 500,
        totalLinesOfCode: 50000,
        testFiles: 250
      };

      const competitorComparison = await validator.compareWithCompetitors(project);

      expect(competitorComparison).toBeDefined();
      expect(competitorComparison.rimorRank).toBeGreaterThan(0);
      expect(competitorComparison.competitorResults.length).toBeGreaterThan(0);
    });
  });

  describe('レポート生成', () => {
    it('詳細な性能レポートを生成すること', async () => {
      const project = {
        fileCount: 800,
        totalLinesOfCode: 80000,
        testFiles: 400
      };

      const result = await validator.validateMediumScale(project);
      const report = validator.generatePerformanceReport(result);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.charts).toBeDefined();
    });

    it('トレンド分析レポートを生成すること', async () => {
      const historicalData = [
        { version: '0.5.0', executionTime: 8000, memoryUsage: 150 * 1024 * 1024 },
        { version: '0.6.0', executionTime: 7000, memoryUsage: 140 * 1024 * 1024 },
        { version: '0.7.0', executionTime: 6500, memoryUsage: 130 * 1024 * 1024 }
      ];

      const trendReport = validator.generateTrendReport(historicalData);

      expect(trendReport).toBeDefined();
      expect(trendReport.performanceTrend).toBe('improving');
      expect(trendReport.projectedPerformance).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なプロジェクトデータを適切に処理すること', async () => {
      const invalidProject = {
        fileCount: -1,
        totalLinesOfCode: 0,
        testFiles: null
      };

      expect(async () => {
        const result = await validator.validateSmallScale(invalidProject);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('リソース不足時のグレースフルな処理を行うこと', async () => {
      const resourceHungryProject = {
        fileCount: 10000,
        totalLinesOfCode: 1000000,
        testFiles: 5000
      };

      // 非常に小さなメモリ制限を設定
      validator.setMemoryLimit(50 * 1024 * 1024); // 50MB

      const result = await validator.validateLargeScale(resourceHungryProject);

      expect(result).toBeDefined();
      expect(result.passed).toBe(false);
      expect(result.failureReason).toContain('memory');
    });
  });
});