/**
 * 詳細メトリクス収集システムのテスト
 * Phase 2: TDD手法による性能メトリクス収集機能の実装
 */

import { MetricsCollector } from '../../../src/benchmark/collectors/MetricsCollector';
import { PerformanceProfiler } from '../../../src/benchmark/collectors/PerformanceProfiler';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;
  let profiler: PerformanceProfiler;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'metrics-test-'));
    collector = new MetricsCollector({
      enableCpuProfiling: true,
      enableMemoryProfiling: true,
      enableIoMonitoring: true,
      samplingInterval: 100 // 100ms間隔でサンプリング
    });
    profiler = new PerformanceProfiler();
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
    collector.cleanup();
  });

  describe('基本機能テスト', () => {
    it('メトリクス収集を開始・停止できること', async () => {
      const sessionId = await collector.startCollection('test-session');
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      const result = await collector.stopCollection(sessionId);
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('複数のセッションを並行して管理できること', async () => {
      const session1 = await collector.startCollection('session-1');
      const session2 = await collector.startCollection('session-2');

      expect(session1).not.toBe(session2);

      const result1 = await collector.stopCollection(session1);
      const result2 = await collector.stopCollection(session2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('存在しないセッションIDでエラーを返すこと', async () => {
      const result = await collector.stopCollection('non-existent-session');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('CPU使用率測定テスト', () => {
    it('CPU使用率を正確に測定すること', async () => {
      const sessionId = await collector.startCollection('cpu-test');
      
      // CPU負荷を生成
      await simulateCpuLoad(200); // 200ms間の負荷

      const result = await collector.stopCollection(sessionId);
      expect(result.success).toBe(true);
      expect(result.metrics.cpu).toBeDefined();
      expect(result.metrics.cpu.averageUsage).toBeGreaterThan(0);
      expect(result.metrics.cpu.peakUsage).toBeGreaterThanOrEqual(result.metrics.cpu.averageUsage);
      expect(result.metrics.cpu.samples.length).toBeGreaterThan(0);
    });

    it('CPU使用率の統計情報を提供すること', async () => {
      const sessionId = await collector.startCollection('cpu-stats-test');
      await simulateCpuLoad(300);
      const result = await collector.stopCollection(sessionId);

      const cpuStats = result.metrics.cpu;
      expect(cpuStats.statistics).toBeDefined();
      expect(cpuStats.statistics.mean).toBeDefined();
      expect(cpuStats.statistics.median).toBeDefined();
      expect(cpuStats.statistics.standardDeviation).toBeDefined();
      expect(cpuStats.statistics.percentile95).toBeDefined();
    });

    it('CPU使用率のスパイクを検出すること', async () => {
      const sessionId = await collector.startCollection('cpu-spike-test');
      
      // 通常負荷
      await simulateCpuLoad(100);
      // スパイク生成
      await simulateIntensiveCpuLoad(50);
      // 通常負荷
      await simulateCpuLoad(100);

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.cpu.spikes).toBeDefined();
      expect(result.metrics.cpu.spikes.length).toBeGreaterThan(0);
    });
  });

  describe('メモリ使用量詳細測定テスト', () => {
    it('ヒープメモリの詳細を測定すること', async () => {
      const sessionId = await collector.startCollection('memory-test');

      // メモリを消費する処理
      await simulateMemoryUsage(10 * 1024 * 1024); // 10MB

      const result = await collector.stopCollection(sessionId);
      expect(result.success).toBe(true);
      
      const memStats = result.metrics.memory;
      expect(memStats.heap.used).toBeDefined();
      expect(memStats.heap.total).toBeDefined();
      expect(memStats.heap.peak).toBeDefined();
      expect(memStats.heap.allocatedDelta).toBeGreaterThan(0);
    });

    it('メモリリークを検出すること', async () => {
      const sessionId = await collector.startCollection('memory-leak-test');

      // メモリリークをシミュレート
      const leaks: any[] = [];
      for (let i = 0; i < 1000; i++) {
        leaks.push(new Array(1000).fill(Math.random()));
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.memory.leakSuspicion).toBeDefined();
      expect(result.metrics.memory.leakSuspicion.detected).toBe(true);
      expect(result.metrics.memory.leakSuspicion.growthRate).toBeGreaterThan(0);
    });

    it('ガベージコレクション統計を収集すること', async () => {
      const sessionId = await collector.startCollection('gc-test');

      // GCを誘発する処理
      for (let i = 0; i < 100; i++) {
        const largArray = new Array(100000).fill(Math.random());
        await new Promise(resolve => setImmediate(resolve));
      }

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.memory.gc).toBeDefined();
      expect(result.metrics.memory.gc.collections).toBeGreaterThan(0);
      expect(result.metrics.memory.gc.totalTime).toBeGreaterThan(0);
      expect(result.metrics.memory.gc.averageTime).toBeGreaterThan(0);
    });
  });

  describe('I/O統計測定テスト', () => {
    it('ファイルI/O統計を測定すること', async () => {
      const sessionId = await collector.startCollection('io-test');

      // ファイルI/Oを実行
      const testFile = path.join(tempDir, 'io-test.txt');
      const data = 'test data '.repeat(1000);
      
      await fs.writeFile(testFile, data);
      await fs.readFile(testFile);
      await fs.unlink(testFile);

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.io).toBeDefined();
      expect(result.metrics.io.fileOperations.reads).toBeGreaterThan(0);
      expect(result.metrics.io.fileOperations.writes).toBeGreaterThan(0);
      expect(result.metrics.io.bytesRead).toBeGreaterThan(0);
      expect(result.metrics.io.bytesWritten).toBeGreaterThan(0);
    });

    it('ネットワークI/O統計を測定すること', async () => {
      const sessionId = await collector.startCollection('network-io-test');

      // ネットワークI/Oをシミュレート（HTTPリクエスト）
      try {
        const https = require('https');
        await new Promise((resolve, reject) => {
          const req = https.get('https://httpbin.org/get', (res: any) => {
            res.on('data', () => {});
            res.on('end', resolve);
          });
          req.on('error', reject);
          req.setTimeout(5000);
        });
      } catch (error) {
        // ネットワークエラーは無視
      }

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.io.network).toBeDefined();
    });
  });

  describe('並列処理効率測定テスト', () => {
    it('ワーカースレッドプール使用率を測定すること', async () => {
      const sessionId = await collector.startCollection('thread-pool-test');

      // 並列処理をシミュレート
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(simulateAsyncWork(100));
      }
      await Promise.all(promises);

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.threading).toBeDefined();
      expect(result.metrics.threading.activeWorkers).toBeDefined();
      expect(result.metrics.threading.queuedTasks).toBeDefined();
      expect(result.metrics.threading.efficiency).toBeDefined();
    });

    it('並列処理のスケーラビリティを評価すること', async () => {
      const results = [];

      // 異なるワーカー数でテスト
      for (const workerCount of [1, 2, 4, 8]) {
        collector.setWorkerCount(workerCount);
        const sessionId = await collector.startCollection(`scalability-${workerCount}`);

        const startTime = Date.now();
        const promises = [];
        for (let i = 0; i < 20; i++) {
          promises.push(simulateAsyncWork(50));
        }
        await Promise.all(promises);
        const endTime = Date.now();

        const result = await collector.stopCollection(sessionId);
        results.push({
          workerCount,
          executionTime: endTime - startTime,
          efficiency: result.metrics.threading.efficiency
        });
      }

      // スケーラビリティの検証
      expect(results.length).toBe(4);
      expect(results[3].efficiency).toBeGreaterThan(results[0].efficiency);
    });
  });

  describe('ホットスポット検出テスト', () => {
    it('パフォーマンスボトルネックを特定すること', async () => {
      const sessionId = await collector.startCollection('hotspot-test');

      // 意図的にボトルネックを作成
      await simulateBottleneck();
      await simulateNormalWork();

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.hotspots).toBeDefined();
      expect(result.metrics.hotspots.length).toBeGreaterThan(0);
      
      const topHotspot = result.metrics.hotspots[0];
      expect(topHotspot.functionName).toBeDefined();
      expect(topHotspot.executionTime).toBeGreaterThan(0);
      expect(topHotspot.percentage).toBeGreaterThan(0);
    });

    it('メモリ使用量の多い関数を特定すること', async () => {
      const sessionId = await collector.startCollection('memory-hotspot-test');

      await simulateMemoryIntensiveWork();
      await simulateNormalWork();

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.memoryHotspots).toBeDefined();
      expect(result.metrics.memoryHotspots.length).toBeGreaterThan(0);
    });
  });

  describe('タイムライン分析テスト', () => {
    it('実行時間のタイムラインを記録すること', async () => {
      const sessionId = await collector.startCollection('timeline-test');

      await simulatePhase('initialization', 100);
      await simulatePhase('processing', 200);
      await simulatePhase('finalization', 50);

      const result = await collector.stopCollection(sessionId);
      expect(result.metrics.timeline).toBeDefined();
      expect(result.metrics.timeline.phases.length).toBe(3);
      
      const phases = result.metrics.timeline.phases;
      expect(phases.find(p => p.name === 'initialization')).toBeDefined();
      expect(phases.find(p => p.name === 'processing')).toBeDefined();
      expect(phases.find(p => p.name === 'finalization')).toBeDefined();
    });

    it('フェーズ間の依存関係を分析すること', async () => {
      const sessionId = await collector.startCollection('dependency-test');

      await collector.markPhaseStart('phase1');
      await simulateNormalWork();
      await collector.markPhaseEnd('phase1');

      await collector.markPhaseStart('phase2', ['phase1']); // phase1に依存
      await simulateNormalWork();
      await collector.markPhaseEnd('phase2');

      const result = await collector.stopCollection(sessionId);
      const phase2 = result.metrics.timeline.phases.find(p => p.name === 'phase2');
      expect(phase2?.dependencies).toContain('phase1');
    });
  });

  describe('閾値ベース警告システムテスト', () => {
    it('CPU使用率の閾値超過で警告を発すること', async () => {
      collector.setThreshold('cpu.average', 50); // 50%を閾値に設定

      const sessionId = await collector.startCollection('cpu-threshold-test');
      await simulateIntensiveCpuLoad(200); // 高負荷を生成
      const result = await collector.stopCollection(sessionId);

      expect(result.warnings).toBeDefined();
      expect(result.warnings.some(w => w.type === 'cpu_threshold_exceeded')).toBe(true);
    });

    it('メモリ使用量の急激な増加で警告を発すること', async () => {
      collector.setThreshold('memory.growthRate', 50); // 50MB/s

      const sessionId = await collector.startCollection('memory-threshold-test');
      await simulateRapidMemoryGrowth();
      const result = await collector.stopCollection(sessionId);

      expect(result.warnings.some(w => w.type === 'memory_growth_warning')).toBe(true);
    });
  });
});

// ===== テストヘルパー関数 =====

async function simulateCpuLoad(durationMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    Math.sqrt(Math.random());
  }
}

async function simulateIntensiveCpuLoad(durationMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    // より集約的な計算
    for (let i = 0; i < 1000; i++) {
      Math.pow(Math.random(), Math.random());
    }
  }
}

async function simulateMemoryUsage(bytes: number): Promise<void> {
  const buffer = new ArrayBuffer(bytes);
  await new Promise(resolve => setTimeout(resolve, 100));
  return buffer;
}

async function simulateAsyncWork(durationMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, durationMs));
}

async function simulateBottleneck(): Promise<void> {
  // 意図的に遅い処理
  const start = Date.now();
  while (Date.now() - start < 500) {
    JSON.stringify(new Array(1000).fill(Math.random()));
  }
}

async function simulateNormalWork(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function simulateMemoryIntensiveWork(): Promise<void> {
  const arrays: number[][] = [];
  for (let i = 0; i < 100; i++) {
    arrays.push(new Array(10000).fill(Math.random()));
  }
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function simulatePhase(name: string, durationMs: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, durationMs));
}

async function simulateRapidMemoryGrowth(): Promise<void> {
  const arrays: any[] = [];
  for (let i = 0; i < 1000; i++) {
    arrays.push(new Array(10000).fill(i));
    if (i % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}