/**
 * PerformanceBenchmark.test.ts
 * パフォーマンスベンチマークシステムのテスト
 */

import { PerformanceBenchmark } from '../../../src/security/benchmarks/PerformanceBenchmark';

describe('PerformanceBenchmark - パフォーマンスベンチマークシステム', () => {
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
  });

  describe('基本的なベンチマーク機能', () => {
    it('小規模テストのベンチマークを実行すること', async () => {
      const result = await benchmark.runSmallTest();

      expect(result).toBeDefined();
      expect(result.testSize).toBe('small');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.filesAnalyzed).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });

    it('中規模テストのベンチマークを実行すること', async () => {
      const result = await benchmark.runMediumTest();

      expect(result).toBeDefined();
      expect(result.testSize).toBe('medium');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.filesAnalyzed).toBeGreaterThank(10);
      expect(result.success).toBe(true);
    });

    it('大規模テストのベンチマークを実行すること', async () => {
      const result = await benchmark.runLargeTest();

      expect(result).toBeDefined();
      expect(result.testSize).toBe('large');
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
  });

  describe('パフォーマンス測定', () => {
    it('実行時間を正確に測定すること', async () => {
      const startTime = Date.now();
      const result = await benchmark.runSmallTest();
      const endTime = Date.now();

      const measuredTime = endTime - startTime;
      expect(result.executionTime).toBeLessThanOrEqual(measuredTime + 100); // 誤差を考慮
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('メモリ使用量を測定すること', async () => {
      const result = await benchmark.runMediumTest();

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.initial).toBeGreaterThan(0);
      expect(result.memoryUsage.peak).toBeGreaterThanOrEqual(result.memoryUsage.initial);
      expect(result.memoryUsage.final).toBeGreaterThan(0);
    });

    it('複数回実行して統計を計算すること', async () => {
      const iterations = 3;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const result = await benchmark.runSmallTest();
        results.push(result.executionTime);
      }

      const statistics = benchmark.calculateStatistics(results);

      expect(statistics.average).toBeGreaterThan(0);
      expect(statistics.standardDeviation).toBeGreaterThanOrEqual(0);
      expect(statistics.min).toBeLessThanOrEqual(statistics.average);
      expect(statistics.max).toBeGreaterThanOrEqual(statistics.average);
    });
  });

  describe('比較機能', () => {
    it('異なるサイズのテスト結果を比較すること', async () => {
      const smallResult = await benchmark.runSmallTest();
      const mediumResult = await benchmark.runMediumTest();

      const comparison = benchmark.compareResults(smallResult, mediumResult);

      expect(comparison).toBeDefined();
      expect(comparison.performanceRatio).toBeGreaterThan(0);
      expect(comparison.scalabilityScore).toBeGreaterThan(0);
    });

    it('ベースラインとの比較を行うこと', async () => {
      const baselineResult = await benchmark.runSmallTest();
      const currentResult = await benchmark.runSmallTest();

      const regression = benchmark.detectRegression(baselineResult, currentResult);

      expect(regression).toBeDefined();
      expect(typeof regression.hasRegression).toBe('boolean');
      expect(regression.changePercentage).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('大規模テストのタイムアウトを適切に処理すること', async () => {
      // タイムアウトを短く設定
      benchmark.setTimeout(100); // 100ms

      const result = await benchmark.runLargeTest();

      // タイムアウトが発生してもクラッシュしない
      expect(result).toBeDefined();
      if (!result.success) {
        expect(result.error).toContain('timeout');
      }
    });

    it('メモリ不足を適切に処理すること', async () => {
      // メモリ制限を設定
      benchmark.setMemoryLimit(1); // 1MB

      const result = await benchmark.runMediumTest();

      expect(result).toBeDefined();
      // メモリ不足でも結果を返す
    });
  });

  describe('レポート生成', () => {
    it('詳細なパフォーマンスレポートを生成すること', async () => {
      const results = [
        await benchmark.runSmallTest(),
        await benchmark.runMediumTest(),
        await benchmark.runLargeTest()
      ];

      const report = benchmark.generateReport(results);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.details.length).toBe(3);
      expect(report.recommendations).toBeDefined();
    });

    it('CSVフォーマットでエクスポートできること', async () => {
      const results = [
        await benchmark.runSmallTest(),
        await benchmark.runMediumTest()
      ];

      const csvData = benchmark.exportToCsv(results);

      expect(csvData).toBeDefined();
      expect(csvData).toContain('testSize,executionTime,filesAnalyzed');
      expect(csvData.split('\n').length).toBeGreaterThan(2); // ヘッダー + データ行
    });
  });
});