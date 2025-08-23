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
    monitor = PerformanceMonitor.getInstance();
    monitor.reset();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('基本的なセッション管理', () => {
    it('セッションの開始と終了を正しく処理する', () => {
      monitor.startSession();
      
      const report = monitor.endSession();
      
      expect(report).toBeDefined();
      expect(report.totalMetrics.processingTime).toBeGreaterThanOrEqual(0);
      expect(report.totalMetrics.memoryUsage.heapUsed).toBeGreaterThanOrEqual(0);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalPlugins).toBe(0);
    });
  });

  describe('プラグイン実行の追跡', () => {
    it('単一プラグインの実行時間を正確に測定する', async () => {
      const pluginName = 'test-plugin';
      const filePath = 'test-file.ts';
      const expectedDuration = 20; // ms
      
      monitor.startSession();
      const startTime = Date.now();
      const id = monitor.startPluginExecution(pluginName, filePath);
      
      // 意図的な遅延
      await new Promise(resolve => setTimeout(resolve, expectedDuration));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      monitor.endPluginExecution(pluginName, filePath, id, []);
      
      const report = monitor.endSession();
      expect(report.totalMetrics.processingTime).toBeGreaterThanOrEqual(expectedDuration - 10); // 誤差許容
      expect(report.totalMetrics.processingTime).toBeLessThan(expectedDuration + 50); // 妥当な範囲内
    });

    it('複数プラグインの実行を同時に測定する', async () => {
      monitor.startSession();
      
      const plugin1 = 'plugin-1';
      const plugin2 = 'plugin-2';
      const plugin3 = 'plugin-3';
      const file = 'test.ts';
      
      const start1 = Date.now();
      const id1 = monitor.startPluginExecution(plugin1, file);
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration1 = Date.now() - start1;
      monitor.endPluginExecution(plugin1, file, id1, []);
      
      const start2 = Date.now();
      const id2 = monitor.startPluginExecution(plugin2, file);
      await new Promise(resolve => setTimeout(resolve, 5));
      const duration2 = Date.now() - start2;
      monitor.endPluginExecution(plugin2, file, id2, []);
      
      const start3 = Date.now();
      const id3 = monitor.startPluginExecution(plugin3, file);
      await new Promise(resolve => setTimeout(resolve, 5));
      const duration3 = Date.now() - start3;
      monitor.endPluginExecution(plugin3, file, id3, []);
      
      const report = monitor.endSession();
      expect(report.summary.totalPlugins).toBe(3);
      expect(report.totalMetrics.processingTime).toBeGreaterThanOrEqual(20);
    });

    it('複数プラグインのパフォーマンスを正しく記録する', async () => {
      monitor.startSession();
      
      const plugin1 = 'parent-plugin';
      const plugin2 = 'child-plugin';
      const file = 'test.ts';
      
      // 最初のプラグイン実行
      const start1 = Date.now();
      const id1 = monitor.startPluginExecution(plugin1, file);
      await new Promise(resolve => setTimeout(resolve, 5));
      const duration1 = Date.now() - start1;
      monitor.endPluginExecution(plugin1, file, id1, []);
      
      // 2番目のプラグイン実行
      const start2 = Date.now();
      const id2 = monitor.startPluginExecution(plugin2, file);
      await new Promise(resolve => setTimeout(resolve, 5));
      const duration2 = Date.now() - start2;
      monitor.endPluginExecution(plugin2, file, id2, []);
      
      const report = monitor.endSession();
      expect(report.summary.totalPlugins).toBe(2);
      expect(report.totalMetrics.processingTime).toBeGreaterThanOrEqual(10);
      expect(report.summary.memoryPeakUsage).toBeGreaterThan(0);
    });
  });

  describe('レポート生成', () => {
    it('詳細なパフォーマンスレポートを生成する', async () => {
      monitor.startSession();
      
      // 様々なプラグインを実行
      const testPlugins = [
        { name: 'database-plugin', delay: 15 },
        { name: 'api-plugin', delay: 20 },
        { name: 'cache-plugin', delay: 5 }
      ];
      
      for (const plugin of testPlugins) {
        const start = Date.now();
        const id = monitor.startPluginExecution(plugin.name, 'test.ts');
        await new Promise(resolve => setTimeout(resolve, plugin.delay));
        const duration = Date.now() - start;
        monitor.endPluginExecution(plugin.name, 'test.ts', id, []);
      }
      
      const report = monitor.endSession();
      
      expect(report).toBeDefined();
      expect(report.summary.totalPlugins).toBe(3);
      expect(report.summary.fastestPlugin).toBeDefined();
      expect(report.summary.slowestPlugin).toBeDefined();
      expect(report.totalMetrics.processingTime).toBeGreaterThanOrEqual(40);
    });

    it('詳細レポートの表示メソッドが正しく動作する', () => {
      monitor.startSession();
      const report = monitor.endSession();
      
      // displayReportメソッドが例外を投げないことを確認
      expect(() => monitor.displayReport(report, false)).not.toThrow();
      expect(() => monitor.displayReport(report, true)).not.toThrow();
    });
  });

  describe('状態管理', () => {
    it('リセット後に正しく動作する', async () => {
      monitor.startSession();
      
      // いくつかのプラグインを実行
      const id1 = monitor.startPluginExecution('before-reset', 'test.ts');
      await new Promise(resolve => setTimeout(resolve, 10));
      monitor.endPluginExecution('before-reset', 'test.ts', id1, []);
      
      const reportBefore = monitor.endSession();
      expect(reportBefore.summary.totalPlugins).toBe(1);
      
      // リセット
      monitor.reset();
      
      // リセット後も正常に動作
      monitor.startSession();
      const id2 = monitor.startPluginExecution('after-reset', 'test2.ts');
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endPluginExecution('after-reset', 'test2.ts', id2, []);
      
      const reportAfter = monitor.endSession();
      expect(reportAfter.summary.totalPlugins).toBe(1);
    });

    it('シングルトンパターンが正しく動作する', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});