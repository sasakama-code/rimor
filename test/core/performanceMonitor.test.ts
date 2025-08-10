/**
 * PerformanceMonitor 実質的品質テスト
 * Issue #66: パフォーマンス測定の実際の動作を検証
 * 
 * TDD原則: 測定精度と信頼性の保証
 * KISS原則: シンプルで理解しやすいテスト
 * Defensive Programming: 境界値とエラーケースの検証
 */

import { PerformanceMonitor } from '../../src/core/performanceMonitor';

describe('PerformanceMonitor - パフォーマンス測定の実質的検証', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    monitor.reset();
  });

  afterEach(() => {
    monitor.cleanup();
  });

  describe('基本的な時間測定', () => {
    it('操作の実行時間を正確に測定する', async () => {
      const operationName = 'test-operation';
      const expectedDuration = 100; // ms
      
      monitor.startOperation(operationName);
      
      // 意図的な遅延
      await new Promise(resolve => setTimeout(resolve, expectedDuration));
      
      const duration = monitor.endOperation(operationName);
      
      expect(duration).toBeGreaterThanOrEqual(expectedDuration - 10); // 誤差許容
      expect(duration).toBeLessThan(expectedDuration + 50); // 妥当な範囲内
      expect(typeof duration).toBe('number');
    });

    it('複数の操作を同時に測定する', async () => {
      const op1 = 'operation-1';
      const op2 = 'operation-2';
      const op3 = 'operation-3';
      
      monitor.startOperation(op1);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      monitor.startOperation(op2);
      await new Promise(resolve => setTimeout(resolve, 30));
      
      monitor.startOperation(op3);
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const duration3 = monitor.endOperation(op3);
      const duration2 = monitor.endOperation(op2);
      const duration1 = monitor.endOperation(op1);
      
      expect(duration1).toBeGreaterThan(duration2);
      expect(duration2).toBeGreaterThan(duration3);
      expect(duration1).toBeGreaterThanOrEqual(100);
      expect(duration2).toBeGreaterThanOrEqual(50);
      expect(duration3).toBeGreaterThanOrEqual(20);
    });

    it('ネストされた操作の測定を正しく処理する', async () => {
      const parentOp = 'parent-operation';
      const childOp = 'child-operation';
      
      monitor.startOperation(parentOp);
      await new Promise(resolve => setTimeout(resolve, 20));
      
      monitor.startOperation(childOp);
      await new Promise(resolve => setTimeout(resolve, 30));
      const childDuration = monitor.endOperation(childOp);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      const parentDuration = monitor.endOperation(parentOp);
      
      expect(parentDuration).toBeGreaterThan(childDuration);
      expect(parentDuration).toBeGreaterThanOrEqual(70);
      expect(childDuration).toBeGreaterThanOrEqual(30);
    });
  });

  describe('統計情報の収集と分析', () => {
    it('操作の統計情報を正確に計算する', async () => {
      const operationName = 'repeated-operation';
      const iterations = 5;
      const durations: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        monitor.startOperation(operationName);
        await new Promise(resolve => setTimeout(resolve, 20 + i * 10)); // 20, 30, 40, 50, 60ms
        const duration = monitor.endOperation(operationName);
        durations.push(duration);
      }
      
      const stats = monitor.getOperationStats(operationName);
      
      expect(stats).toBeDefined();
      expect(stats.count).toBe(iterations);
      expect(stats.totalTime).toBeGreaterThanOrEqual(200); // 20+30+40+50+60
      expect(stats.averageTime).toBeCloseTo(40, 0); // 平均40ms前後
      expect(stats.minTime).toBeGreaterThanOrEqual(20);
      expect(stats.maxTime).toBeGreaterThanOrEqual(60);
    });

    it('全体的なパフォーマンスサマリーを提供する', async () => {
      // 複数の異なる操作を実行
      const operations = ['fast', 'medium', 'slow'];
      const delays = [10, 50, 100];
      
      for (let i = 0; i < operations.length; i++) {
        monitor.startOperation(operations[i]);
        await new Promise(resolve => setTimeout(resolve, delays[i]));
        monitor.endOperation(operations[i]);
      }
      
      const summary = monitor.getSummary();
      
      expect(summary).toBeDefined();
      expect(summary.totalOperations).toBe(3);
      expect(summary.totalTime).toBeGreaterThanOrEqual(160);
      expect(summary.operations).toHaveLength(3);
      expect(summary.slowestOperation).toBe('slow');
      expect(summary.fastestOperation).toBe('fast');
    });

    it('パーセンタイル値を正確に計算する', async () => {
      const operationName = 'percentile-test';
      
      // 10個の操作を異なる時間で実行
      for (let i = 0; i < 10; i++) {
        monitor.startOperation(operationName);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 10)); // 10, 20, ..., 100ms
        monitor.endOperation(operationName);
      }
      
      const percentiles = monitor.getPercentiles(operationName);
      
      expect(percentiles).toBeDefined();
      expect(percentiles.p50).toBeGreaterThanOrEqual(50); // 中央値
      expect(percentiles.p50).toBeLessThanOrEqual(60);
      expect(percentiles.p95).toBeGreaterThanOrEqual(90);
      expect(percentiles.p99).toBeGreaterThanOrEqual(100);
      expect(percentiles.p95).toBeLessThanOrEqual(percentiles.p99);
    });
  });

  describe('メモリ使用量の追跡', () => {
    it('操作中のメモリ使用量を測定する', () => {
      const operationName = 'memory-intensive';
      
      monitor.startOperation(operationName, { trackMemory: true });
      
      // メモリを消費する操作
      const largeArray = new Array(1000000).fill(Math.random());
      
      const result = monitor.endOperation(operationName);
      const memoryStats = monitor.getMemoryStats(operationName);
      
      expect(memoryStats).toBeDefined();
      expect(memoryStats.heapUsed).toBeGreaterThan(0);
      expect(memoryStats.heapTotal).toBeGreaterThan(0);
      expect(memoryStats.external).toBeGreaterThanOrEqual(0);
      expect(memoryStats.heapUsed).toBeLessThan(memoryStats.heapTotal);
    });

    it('メモリリークを検出する', () => {
      const operationName = 'potential-leak';
      const leakyData: any[] = [];
      
      // 初期メモリを記録
      monitor.startOperation(operationName, { trackMemory: true });
      const initialMemory = process.memoryUsage().heapUsed;
      
      // メモリリークをシミュレート
      for (let i = 0; i < 100; i++) {
        leakyData.push(new Array(10000).fill(i));
      }
      
      monitor.endOperation(operationName);
      const memoryIncrease = monitor.getMemoryIncrease(operationName);
      
      expect(memoryIncrease).toBeGreaterThan(0);
      expect(memoryIncrease).toBeGreaterThan(1000000); // 少なくとも1MB増加
      
      // クリーンアップ
      leakyData.length = 0;
    });
  });

  describe('しきい値とアラート', () => {
    it('パフォーマンスしきい値を超えた場合にアラートを発生させる', async () => {
      const operationName = 'slow-operation';
      const threshold = 50; // ms
      
      monitor.setThreshold(operationName, threshold);
      monitor.startOperation(operationName);
      
      await new Promise(resolve => setTimeout(resolve, 100)); // しきい値を超える
      
      const result = monitor.endOperation(operationName);
      const alerts = monitor.getAlerts();
      
      expect(alerts).toHaveLength(1);
      expect(alerts[0].operation).toBe(operationName);
      expect(alerts[0].duration).toBeGreaterThan(threshold);
      expect(alerts[0].threshold).toBe(threshold);
      expect(alerts[0].exceeded).toBe(true);
    });

    it('複数のしきい値違反を追跡する', async () => {
      const operations = [
        { name: 'op1', threshold: 20, delay: 50 },
        { name: 'op2', threshold: 30, delay: 60 },
        { name: 'op3', threshold: 100, delay: 50 } // これは違反しない
      ];
      
      for (const op of operations) {
        monitor.setThreshold(op.name, op.threshold);
        monitor.startOperation(op.name);
        await new Promise(resolve => setTimeout(resolve, op.delay));
        monitor.endOperation(op.name);
      }
      
      const alerts = monitor.getAlerts();
      
      expect(alerts).toHaveLength(2); // op1とop2のみ違反
      expect(alerts.every(a => a.exceeded)).toBe(true);
      expect(alerts.map(a => a.operation)).toContain('op1');
      expect(alerts.map(a => a.operation)).toContain('op2');
      expect(alerts.map(a => a.operation)).not.toContain('op3');
    });
  });

  describe('レポート生成', () => {
    it('詳細なパフォーマンスレポートを生成する', async () => {
      // 様々な操作を実行
      const testOperations = [
        { name: 'database-query', delay: 150 },
        { name: 'api-call', delay: 200 },
        { name: 'cache-lookup', delay: 5 },
        { name: 'file-read', delay: 50 }
      ];
      
      for (const op of testOperations) {
        for (let i = 0; i < 3; i++) { // 各操作を3回実行
          monitor.startOperation(op.name);
          await new Promise(resolve => setTimeout(resolve, op.delay + Math.random() * 20));
          monitor.endOperation(op.name);
        }
      }
      
      const report = monitor.generateReport();
      
      expect(report).toBeDefined();
      expect(report).toContain('Performance Report');
      expect(report).toContain('database-query');
      expect(report).toContain('api-call');
      expect(report).toContain('cache-lookup');
      expect(report).toContain('file-read');
      expect(report).toContain('Average');
      expect(report).toContain('Min');
      expect(report).toContain('Max');
      expect(report.length).toBeGreaterThan(100); // 詳細なレポート
    });

    it('CSV形式でエクスポート可能なデータを提供する', () => {
      // データを準備
      monitor.startOperation('test-op');
      monitor.endOperation('test-op');
      
      const csvData = monitor.exportAsCSV();
      
      expect(csvData).toBeDefined();
      expect(csvData).toContain('Operation,Count,Total,Average,Min,Max');
      expect(csvData).toContain('test-op');
      expect(csvData.split('\n').length).toBeGreaterThanOrEqual(2); // ヘッダー + データ
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しない操作の終了を適切に処理する', () => {
      const result = monitor.endOperation('non-existent');
      
      expect(result).toBe(-1); // エラーを示す値
      expect(() => monitor.getOperationStats('non-existent')).not.toThrow();
    });

    it('二重開始を適切に処理する', () => {
      const operationName = 'double-start';
      
      monitor.startOperation(operationName);
      const firstStart = monitor.getOperationStartTime(operationName);
      
      // 同じ操作を再度開始
      monitor.startOperation(operationName);
      const secondStart = monitor.getOperationStartTime(operationName);
      
      // 最初の開始時刻を維持または新しい時刻で上書き
      expect(secondStart).toBeDefined();
      expect(typeof secondStart).toBe('number');
    });

    it('リセット後に正しく動作する', async () => {
      // いくつかの操作を実行
      monitor.startOperation('before-reset');
      await new Promise(resolve => setTimeout(resolve, 50));
      monitor.endOperation('before-reset');
      
      // リセット
      monitor.reset();
      
      // リセット後の状態を確認
      const summary = monitor.getSummary();
      expect(summary.totalOperations).toBe(0);
      expect(summary.totalTime).toBe(0);
      
      // リセット後も正常に動作
      monitor.startOperation('after-reset');
      await new Promise(resolve => setTimeout(resolve, 30));
      const duration = monitor.endOperation('after-reset');
      
      expect(duration).toBeGreaterThanOrEqual(30);
    });
  });
});