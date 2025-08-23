/**
 * 詳細パフォーマンスプロファイラーのテスト
 * Phase 2: TDD手法による高精度プロファイリング機能の実装
 */

import { PerformanceProfiler } from '../../../src/benchmark/collectors/PerformanceProfiler';
import { ProfilerConfiguration, ProfilingSession, HotspotAnalysis, MemoryLeakAnalysis, CallStackAnalysis } from '../../../src/benchmark/collectors/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;
  let tempDir: string;
  let config: ProfilerConfiguration;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'profiler-test-'));
    config = {
      samplingInterval: 10, // 10ms間隔で高精度サンプリング
      enableCallStackAnalysis: true,
      enableMemoryLeakDetection: true,
      enableHotspotDetection: true,
      enableExecutionTimeline: true,
      maxSamples: 10000,
      memoryLeakThreshold: 1024 * 1024 * 10, // 10MB
      hotspotThreshold: 0.05, // 5%
      outputDir: tempDir
    };
    profiler = new PerformanceProfiler(config);
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    await profiler.shutdown();
  });

  describe('プロファイリングセッション管理テスト', () => {
    it('プロファイリングセッションを開始・終了できること', async () => {
      const sessionId = await profiler.startProfiling('basic-session');
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      const session = await profiler.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session.status).toBe('active');

      const result = await profiler.stopProfiling(sessionId);
      expect(result.success).toBe(true);
      expect(result.profilingData).toBeDefined();
    });

    it('複数のセッションを並行実行できること', async () => {
      const session1 = await profiler.startProfiling('session-1');
      const session2 = await profiler.startProfiling('session-2');
      const session3 = await profiler.startProfiling('session-3');

      expect([session1, session2, session3].every(s => s !== undefined)).toBe(true);
      expect(new Set([session1, session2, session3]).size).toBe(3);

      // すべてのセッションが独立して動作することを確認
      await simulateWork('work-1', 100);
      await simulateWork('work-2', 150);
      await simulateWork('work-3', 200);

      const results = await Promise.all([
        profiler.stopProfiling(session1),
        profiler.stopProfiling(session2),
        profiler.stopProfiling(session3)
      ]);

      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.profilingData !== undefined)).toBe(true);
    });

    it('セッションの状態変更を正しく追跡すること', async () => {
      const sessionId = await profiler.startProfiling('state-tracking');
      
      let session = await profiler.getSession(sessionId);
      expect(session.status).toBe('active');
      expect(session.startTime).toBeDefined();

      await profiler.pauseProfiling(sessionId);
      session = await profiler.getSession(sessionId);
      expect(session.status).toBe('paused');

      await profiler.resumeProfiling(sessionId);
      session = await profiler.getSession(sessionId);
      expect(session.status).toBe('active');

      await profiler.stopProfiling(sessionId);
      session = await profiler.getSession(sessionId);
      expect(session.status).toBe('completed');
      expect(session.endTime).toBeDefined();
    });
  });

  describe('CPU使用率詳細分析テスト', () => {
    it('関数レベルのCPU使用率を測定すること', async () => {
      const sessionId = await profiler.startProfiling('cpu-function-level');

      // 異なるCPU負荷の関数を実行
      await cpuIntensiveFunction('light', 50);
      await cpuIntensiveFunction('medium', 150);
      await cpuIntensiveFunction('heavy', 300);

      const result = await profiler.stopProfiling(sessionId);
      const cpuAnalysis = result.profilingData.cpuAnalysis;

      expect(cpuAnalysis.functionProfiles).toBeDefined();
      expect(cpuAnalysis.functionProfiles.length).toBeGreaterThan(0);
      
      // 重い処理の関数がトップに来ることを確認
      const topFunction = cpuAnalysis.functionProfiles[0];
      expect(topFunction.functionName).toBe('cpuIntensiveFunction');
      expect(topFunction.totalTime).toBeGreaterThan(400); // 50+150+300ms以上
      expect(topFunction.percentage).toBeGreaterThan(50); // 全体の50%以上
    });

    it('コールスタック分析を実行すること', async () => {
      const sessionId = await profiler.startProfiling('callstack-analysis');

      await nestedFunction1();

      const result = await profiler.stopProfiling(sessionId);
      const callStackAnalysis = result.profilingData.callStackAnalysis;

      expect(callStackAnalysis.callPaths).toBeDefined();
      expect(callStackAnalysis.callPaths.length).toBeGreaterThan(0);
      
      // ネストした関数の呼び出しパスが記録されていることを確認
      const deepestPath = callStackAnalysis.callPaths.find(path => 
        path.functions.includes('nestedFunction3')
      );
      expect(deepestPath).toBeDefined();
      expect(deepestPath?.depth).toBe(3);
    });

    it('CPU使用率のタイムライン分析を行うこと', async () => {
      const sessionId = await profiler.startProfiling('cpu-timeline');

      // 時間変化する負荷パターンを作成
      await cpuBurstPattern();

      const result = await profiler.stopProfiling(sessionId);
      const timeline = result.profilingData.executionTimeline;

      expect(timeline.cpuUsageOverTime).toBeDefined();
      expect(timeline.cpuUsageOverTime.length).toBeGreaterThan(10); // 十分なサンプル数

      // CPU使用率にピークがあることを確認
      const maxUsage = Math.max(...timeline.cpuUsageOverTime.map(t => t.usage));
      expect(maxUsage).toBeGreaterThan(50); // 50%以上のピークがある
    });
  });

  describe('メモリリーク検出テスト', () => {
    it('メモリリークを検出すること', async () => {
      const sessionId = await profiler.startProfiling('memory-leak-detection');

      // メモリリークをシミュレート
      const memoryLeaker = new MemoryLeaker();
      await memoryLeaker.simulateLeak(100, 50); // 100回、50ms間隔

      const result = await profiler.stopProfiling(sessionId);
      const memoryAnalysis = result.profilingData.memoryAnalysis;

      expect(memoryAnalysis.leakDetection).toBeDefined();
      expect(memoryAnalysis.leakDetection.suspected).toBe(true);
      expect(memoryAnalysis.leakDetection.leakRate).toBeGreaterThan(0);
      expect(memoryAnalysis.leakDetection.suspiciousAllocations.length).toBeGreaterThan(0);
    });

    it('メモリ使用パターンを分析すること', async () => {
      const sessionId = await profiler.startProfiling('memory-pattern-analysis');

      // 異なるメモリ使用パターン
      await steadyMemoryUsage(200);
      await spikyMemoryUsage(100);
      await graduallIncreasingMemoryUsage(150);

      const result = await profiler.stopProfiling(sessionId);
      const memoryAnalysis = result.profilingData.memoryAnalysis;

      expect(memoryAnalysis.usagePatterns).toBeDefined();
      expect(memoryAnalysis.usagePatterns.steady.detected).toBe(true);
      expect(memoryAnalysis.usagePatterns.spiky.detected).toBe(true);
      expect(memoryAnalysis.usagePatterns.increasing.detected).toBe(true);
    });

    it('ガベージコレクション影響を分析すること', async () => {
      const sessionId = await profiler.startProfiling('gc-impact-analysis');

      // GCを誘発する処理
      await forceGarbageCollection();

      const result = await profiler.stopProfiling(sessionId);
      const gcAnalysis = result.profilingData.garbageCollectionAnalysis;

      expect(gcAnalysis.collections).toBeDefined();
      expect(gcAnalysis.collections.length).toBeGreaterThan(0);
      expect(gcAnalysis.totalPauseTime).toBeGreaterThan(0);
      expect(gcAnalysis.averagePauseTime).toBeGreaterThan(0);
      expect(gcAnalysis.impactOnPerformance).toBeDefined();
    });
  });

  describe('ホットスポット検出テスト', () => {
    it('パフォーマンスボトルネックを特定すること', async () => {
      const sessionId = await profiler.startProfiling('hotspot-detection');

      // 複数の処理の中に意図的なボトルネックを混入
      await fastOperation();
      await slowBottleneck(); // ボトルネック
      await mediumOperation();
      await anotherBottleneck(); // 別のボトルネック
      await fastOperation();

      const result = await profiler.stopProfiling(sessionId);
      const hotspotAnalysis = result.profilingData.hotspotAnalysis;

      expect(hotspotAnalysis.hotspots).toBeDefined();
      expect(hotspotAnalysis.hotspots.length).toBeGreaterThanOrEqual(2);

      // 最上位のホットスポットを確認
      const topHotspot = hotspotAnalysis.hotspots[0];
      expect(topHotspot.functionName).toMatch(/bottleneck|slowBottleneck/i);
      expect(topHotspot.percentage).toBeGreaterThan(20);
      expect(topHotspot.optimizationSuggestions).toBeDefined();
      expect(topHotspot.optimizationSuggestions.length).toBeGreaterThan(0);
    });

    it('I/Oボトルネックを検出すること', async () => {
      const sessionId = await profiler.startProfiling('io-bottleneck-detection');

      // I/Oボトルネックをシミュレート
      await slowFileOperations(tempDir);
      await fastComputations();

      const result = await profiler.stopProfiling(sessionId);
      const ioAnalysis = result.profilingData.ioAnalysis;

      expect(ioAnalysis.bottlenecks).toBeDefined();
      expect(ioAnalysis.bottlenecks.some(b => b.type === 'file-io')).toBe(true);
      expect(ioAnalysis.waitTime).toBeGreaterThan(0);
      expect(ioAnalysis.efficiency).toBeLessThan(1.0);
    });

    it('同期処理のボトルネックを分析すること', async () => {
      const sessionId = await profiler.startProfiling('sync-bottleneck');

      // 並列化可能だが同期実行されている処理
      await sequentialProcessing();
      
      const result = await profiler.stopProfiling(sessionId);
      const parallelismAnalysis = result.profilingData.parallelismAnalysis;

      expect(parallelismAnalysis.parallelizationOpportunities).toBeDefined();
      expect(parallelismAnalysis.parallelizationOpportunities.length).toBeGreaterThan(0);
      expect(parallelismAnalysis.estimatedSpeedup).toBeGreaterThan(1.5);
    });
  });

  describe('実行フロー分析テスト', () => {
    it('関数呼び出しフローを追跡すること', async () => {
      const sessionId = await profiler.startProfiling('execution-flow');

      await complexWorkflow();

      const result = await profiler.stopProfiling(sessionId);
      const flowAnalysis = result.profilingData.executionFlowAnalysis;

      expect(flowAnalysis.callGraph).toBeDefined();
      expect(flowAnalysis.callGraph.nodes.length).toBeGreaterThan(5);
      expect(flowAnalysis.callGraph.edges.length).toBeGreaterThan(0);
      expect(flowAnalysis.criticalPath).toBeDefined();
      expect(flowAnalysis.criticalPath.length).toBeGreaterThan(0);
    });

    it('非同期処理フローを分析すること', async () => {
      const sessionId = await profiler.startProfiling('async-flow');

      await asyncWorkflow();

      const result = await profiler.stopProfiling(sessionId);
      const asyncAnalysis = result.profilingData.asyncAnalysis;

      expect(asyncAnalysis.promiseChains).toBeDefined();
      expect(asyncAnalysis.promiseChains.length).toBeGreaterThan(0);
      expect(asyncAnalysis.concurrentOperations).toBeDefined();
      expect(asyncAnalysis.waitingTime).toBeDefined();
    });
  });

  describe('詳細レポート生成テスト', () => {
    it('HTMLレポートを生成すること', async () => {
      const sessionId = await profiler.startProfiling('html-report');

      await comprehensiveWorkload();

      const result = await profiler.stopProfiling(sessionId);
      const htmlReport = await profiler.generateHTMLReport(sessionId, {
        includeCharts: true,
        includeSourceCode: true,
        includeRecommendations: true
      });

      expect(htmlReport.filePath).toBeDefined();
      expect(await fs.access(htmlReport.filePath)).not.toThrow();
      
      const reportContent = await fs.readFile(htmlReport.filePath, 'utf-8');
      expect(reportContent).toContain('<html');
      expect(reportContent).toContain('Performance Profile Report');
      expect(reportContent).toContain('CPU Analysis');
      expect(reportContent).toContain('Memory Analysis');
    });

    it('JSONレポートを生成すること', async () => {
      const sessionId = await profiler.startProfiling('json-report');

      await comprehensiveWorkload();

      const result = await profiler.stopProfiling(sessionId);
      const jsonReport = await profiler.generateJSONReport(sessionId);

      expect(jsonReport.data).toBeDefined();
      expect(jsonReport.data.sessionInfo).toBeDefined();
      expect(jsonReport.data.cpuAnalysis).toBeDefined();
      expect(jsonReport.data.memoryAnalysis).toBeDefined();
      expect(jsonReport.data.recommendations).toBeDefined();
    });

    it('フレームグラフを生成すること', async () => {
      const sessionId = await profiler.startProfiling('flame-graph');

      await nestedWorkload();

      const result = await profiler.stopProfiling(sessionId);
      const flameGraph = await profiler.generateFlameGraph(sessionId);

      expect(flameGraph.svgData).toBeDefined();
      expect(flameGraph.svgData).toContain('<svg');
      expect(flameGraph.totalSamples).toBeGreaterThan(0);
    });
  });

  describe('リアルタイム監視テスト', () => {
    it('リアルタイムメトリクスを取得できること', async () => {
      const sessionId = await profiler.startProfiling('realtime-monitoring');

      // バックグラウンドで処理実行
      const workPromise = longRunningWork();

      // リアルタイムメトリクス取得
      await new Promise(resolve => setTimeout(resolve, 100));
      const realtimeMetrics = await profiler.getRealtimeMetrics(sessionId);

      expect(realtimeMetrics.currentCpuUsage).toBeDefined();
      expect(realtimeMetrics.currentMemoryUsage).toBeDefined();
      expect(realtimeMetrics.activeHotspots).toBeDefined();
      expect(realtimeMetrics.timestamp).toBeDefined();

      await workPromise;
      await profiler.stopProfiling(sessionId);
    });

    it('パフォーマンス警告を発行すること', async () => {
      profiler.setAlertThresholds({
        cpuUsage: 80,
        memoryGrowthRate: 100 * 1024 * 1024, // 100MB/s
        functionExecutionTime: 1000 // 1秒
      });

      const sessionId = await profiler.startProfiling('performance-alerts');

      // 警告を誘発する処理
      await extremelySlowOperation();

      const alerts = await profiler.getAlerts(sessionId);
      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(a => a.type === 'slow_function')).toBe(true);

      await profiler.stopProfiling(sessionId);
    });
  });
});

// ===== テストヘルパー関数 =====

class MemoryLeaker {
  private leakedData: any[] = [];

  async simulateLeak(iterations: number, intervalMs: number): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      // 意図的にメモリをリークさせる
      this.leakedData.push(new Array(1000).fill(Math.random()));
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}

async function simulateWork(name: string, durationMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    Math.sqrt(Math.random());
  }
}

async function cpuIntensiveFunction(intensity: string, durationMs: number): Promise<void> {
  const start = Date.now();
  const multiplier = intensity === 'light' ? 1 : intensity === 'medium' ? 10 : 100;
  
  while (Date.now() - start < durationMs) {
    for (let i = 0; i < multiplier * 100; i++) {
      Math.pow(Math.random(), Math.random());
    }
  }
}

async function nestedFunction1(): Promise<void> {
  await nestedFunction2();
}

async function nestedFunction2(): Promise<void> {
  await nestedFunction3();
}

async function nestedFunction3(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function cpuBurstPattern(): Promise<void> {
  // 低→高→低→高のパターン
  const patterns = [50, 200, 30, 250, 40];
  for (const duration of patterns) {
    await cpuIntensiveFunction('medium', duration);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}

async function steadyMemoryUsage(durationMs: number): Promise<void> {
  const buffer = new ArrayBuffer(1024 * 1024); // 1MB
  await new Promise(resolve => setTimeout(resolve, durationMs));
}

async function spikyMemoryUsage(durationMs: number): Promise<void> {
  const buffers: ArrayBuffer[] = [];
  const spikes = 5;
  const spikeInterval = durationMs / spikes;
  
  for (let i = 0; i < spikes; i++) {
    buffers.push(new ArrayBuffer(1024 * 1024 * 2)); // 2MBスパイク
    await new Promise(resolve => setTimeout(resolve, spikeInterval));
  }
}

async function graduallIncreasingMemoryUsage(durationMs: number): Promise<void> {
  const buffers: ArrayBuffer[] = [];
  const steps = 10;
  const stepInterval = durationMs / steps;
  
  for (let i = 0; i < steps; i++) {
    buffers.push(new ArrayBuffer(1024 * 1024 * (i + 1))); // 段階的に増加
    await new Promise(resolve => setTimeout(resolve, stepInterval));
  }
}

async function forceGarbageCollection(): Promise<void> {
  // GCを誘発するために大量のオブジェクトを作成して破棄
  for (let i = 0; i < 1000; i++) {
    const largeArray = new Array(10000).fill(Math.random());
    if (i % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}

async function fastOperation(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));
}

async function slowBottleneck(): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < 500) {
    JSON.parse(JSON.stringify(new Array(1000).fill(Math.random())));
  }
}

async function mediumOperation(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function anotherBottleneck(): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < 300) {
    Array.from({length: 1000}, () => Math.random()).sort();
  }
}

async function slowFileOperations(tempDir: string): Promise<void> {
  const filePath = path.join(tempDir, 'slow-io-test.txt');
  const data = 'slow data '.repeat(100000);
  
  await fs.writeFile(filePath, data);
  await fs.readFile(filePath);
  await fs.unlink(filePath);
}

async function fastComputations(): Promise<void> {
  for (let i = 0; i < 1000; i++) {
    Math.sqrt(i);
  }
}

async function sequentialProcessing(): Promise<void> {
  // 並列化可能だが同期実行
  await processItem(1);
  await processItem(2);
  await processItem(3);
  await processItem(4);
}

async function processItem(id: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function complexWorkflow(): Promise<void> {
  await initializeWorkflow();
  await processWorkflowStep1();
  await processWorkflowStep2();
  await finalizeWorkflow();
}

async function initializeWorkflow(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function processWorkflowStep1(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function processWorkflowStep2(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 80));
}

async function finalizeWorkflow(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 30));
}

async function asyncWorkflow(): Promise<void> {
  const promise1 = asyncTask1();
  const promise2 = asyncTask2();
  const promise3 = asyncTask3();
  
  await Promise.all([promise1, promise2, promise3]);
}

async function asyncTask1(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function asyncTask2(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 150));
}

async function asyncTask3(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 120));
}

async function comprehensiveWorkload(): Promise<void> {
  await cpuIntensiveFunction('medium', 100);
  await simulateMemoryUsage(1024 * 1024);
  await slowFileOperations(path.join(os.tmpdir(), 'profiler-test-workload'));
  await asyncWorkflow();
}

async function nestedWorkload(): Promise<void> {
  await level1Function();
}

async function level1Function(): Promise<void> {
  await level2Function();
}

async function level2Function(): Promise<void> {
  await level3Function();
}

async function level3Function(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function longRunningWork(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    await new Promise(resolve => setTimeout(resolve, 10));
    Math.sqrt(Math.random());
  }
}

async function extremelySlowOperation(): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < 1500) { // 1.5秒の遅い処理
    JSON.stringify(new Array(10000).fill(Math.random()));
  }
}