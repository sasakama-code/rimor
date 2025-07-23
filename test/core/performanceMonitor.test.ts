/**
 * PerformanceMonitor テストスイート
 * v0.3.0: パフォーマンス監視システムのテスト
 */

import { PerformanceMonitor, PerformanceMetrics, PluginPerformance } from '../../src/core/performanceMonitor';
import { Issue } from '../../src/core/types';

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  describe('constructor', () => {
    it('should create PerformanceMonitor instance', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
    });
  });

  describe('plugin performance monitoring', () => {
    it('should start and end plugin performance monitoring', async () => {
      const pluginName = 'TestPlugin';
      const filePath = 'test.ts';

      performanceMonitor.startPluginMonitoring(pluginName, filePath);
      
      // 短い処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const issues: Issue[] = [
        {
          type: 'test-issue',
          severity: 'warning',
          message: 'Test issue',
          file: filePath,
          line: 1
        }
      ];

      const performance = performanceMonitor.endPluginMonitoring(pluginName, filePath, issues);

      expect(performance).toBeDefined();
      expect(performance.pluginName).toBe(pluginName);
      expect(performance.filePath).toBe(filePath);
      expect(performance.issuesFound).toBe(1);
      expect(performance.errorOccurred).toBe(false);
      expect(performance.metrics.processingTime).toBeGreaterThan(0);
    });

    it('should handle plugin error monitoring', async () => {
      const pluginName = 'ErrorPlugin';
      const filePath = 'error.ts';

      performanceMonitor.startPluginMonitoring(pluginName, filePath);
      
      await new Promise(resolve => setTimeout(resolve, 5));
      
      const performance = performanceMonitor.endPluginMonitoring(pluginName, filePath, [], true);

      expect(performance.errorOccurred).toBe(true);
      expect(performance.issuesFound).toBe(0);
    });

    it('should handle multiple concurrent plugin monitoring', async () => {
      const plugins = ['Plugin1', 'Plugin2', 'Plugin3'];
      const filePath = 'concurrent.ts';

      // 複数のプラグインを同時に開始
      plugins.forEach(plugin => {
        performanceMonitor.startPluginMonitoring(plugin, filePath);
      });

      await new Promise(resolve => setTimeout(resolve, 15));

      // 順番に終了
      const performances = plugins.map(plugin => {
        return performanceMonitor.endPluginMonitoring(plugin, filePath, []);
      });

      expect(performances).toHaveLength(3);
      performances.forEach((perf, index) => {
        expect(perf.pluginName).toBe(plugins[index]);
        expect(perf.metrics.processingTime).toBeGreaterThan(0);
      });
    });
  });

  describe('overall performance monitoring', () => {
    it('should start and end overall monitoring', async () => {
      performanceMonitor.startOverallMonitoring();
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const report = performanceMonitor.endOverallMonitoring();

      expect(report).toBeDefined();
      expect(report.totalTime).toBeGreaterThan(0);
      expect(report.pluginTimes).toBeDefined();
      expect(report.memoryUsage).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should include plugin performance data in overall report', async () => {
      performanceMonitor.startOverallMonitoring();
      
      // プラグイン実行をシミュレート
      performanceMonitor.startPluginMonitoring('TestPlugin', 'test.ts');
      await new Promise(resolve => setTimeout(resolve, 10));
      performanceMonitor.endPluginMonitoring('TestPlugin', 'test.ts', []);
      
      const report = performanceMonitor.endOverallMonitoring();

      expect(report.pluginTimes).toHaveProperty('TestPlugin');
      expect(report.pluginTimes.TestPlugin).toBeGreaterThan(0);
    });
  });

  describe('performance metrics', () => {
    it('should capture accurate memory usage', () => {
      performanceMonitor.startPluginMonitoring('MemoryTest', 'memory.ts');
      
      const performance = performanceMonitor.endPluginMonitoring('MemoryTest', 'memory.ts', []);
      
      expect(performance.metrics.memoryUsage).toBeDefined();
      expect(performance.metrics.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(performance.metrics.memoryUsage.heapTotal).toBeGreaterThan(0);
      expect(performance.metrics.memoryUsage.rss).toBeGreaterThan(0);
    });

    it('should measure processing time accurately', async () => {
      const startTime = Date.now();
      
      performanceMonitor.startPluginMonitoring('TimingTest', 'timing.ts');
      await new Promise(resolve => setTimeout(resolve, 50));
      const performance = performanceMonitor.endPluginMonitoring('TimingTest', 'timing.ts', []);
      
      const endTime = Date.now();
      
      expect(performance.metrics.processingTime).toBeGreaterThanOrEqual(40);
      expect(performance.metrics.processingTime).toBeLessThan(endTime - startTime + 10);
    });
  });

  describe('error handling', () => {
    it('should handle ending monitoring without starting', () => {
      const performance = performanceMonitor.endPluginMonitoring('UnstartedPlugin', 'test.ts', []);
      
      expect(performance.metrics.processingTime).toBe(0);
      expect(performance.errorOccurred).toBe(false);
    });

    it('should handle ending overall monitoring without starting', () => {
      const report = performanceMonitor.endOverallMonitoring();
      
      expect(report.totalTime).toBe(0);
      expect(report.pluginTimes).toEqual({});
    });

    it('should reset monitoring state after completion', async () => {
      // 最初の監視
      performanceMonitor.startPluginMonitoring('ResetTest', 'reset.ts');
      await new Promise(resolve => setTimeout(resolve, 10));
      performanceMonitor.endPluginMonitoring('ResetTest', 'reset.ts', []);
      
      // 2回目の監視
      performanceMonitor.startPluginMonitoring('ResetTest', 'reset.ts');
      await new Promise(resolve => setTimeout(resolve, 15));
      const performance = performanceMonitor.endPluginMonitoring('ResetTest', 'reset.ts', []);
      
      // 2回目の結果が正確であることを確認
      expect(performance.metrics.processingTime).toBeGreaterThanOrEqual(10);
      expect(performance.metrics.processingTime).toBeLessThan(30);
    });
  });

  describe('report generation', () => {
    it('should generate performance summary', async () => {
      performanceMonitor.startOverallMonitoring();
      
      // 複数のプラグイン実行をシミュレート
      const plugins = ['FastPlugin', 'SlowPlugin', 'ErrorPlugin'];
      for (const plugin of plugins) {
        performanceMonitor.startPluginMonitoring(plugin, 'test.ts');
        await new Promise(resolve => setTimeout(resolve, plugin === 'SlowPlugin' ? 20 : 5));
        const hasError = plugin === 'ErrorPlugin';
        performanceMonitor.endPluginMonitoring(plugin, 'test.ts', [], hasError);
      }
      
      const report = performanceMonitor.endOverallMonitoring();
      
      expect(report.summary).toBeDefined();
      expect(report.summary.totalPlugins).toBe(3);
      expect(report.summary.successfulPlugins).toBe(2);
      expect(report.summary.failedPlugins).toBe(1);
      expect(report.summary.averagePluginTime).toBeGreaterThan(0);
    });
  });
});