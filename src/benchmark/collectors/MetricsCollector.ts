/**
 * 詳細メトリクス収集システム
 * Phase 2: 高精度パフォーマンス測定とリアルタイム監視
 * 
 * SOLID原則に基づく設計:
 * - Single Responsibility: メトリクス収集に特化
 * - Open/Closed: 新しいメトリクスタイプの追加に開放
 * - Liskov Substitution: インターフェース契約の遵守
 * - Interface Segregation: 機能別インターフェース分離
 * - Dependency Inversion: 抽象への依存
 */

import { performance } from 'perf_hooks';
import * as v8 from 'v8';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import {
  MetricsCollectorConfig,
  MetricsSession,
  CollectedMetrics,
  MetricsCollectionResult,
  CPUMetrics,
  MemoryMetrics,
  IOMetrics,
  ThreadingMetrics,
  ExecutionTimeline,
  MetricsWarning,
  TimestampedMetric,
  StatisticalSummary,
  CPUSpike,
  Hotspot,
  ExecutionPhase
} from './types';

/**
 * CPUメトリクス専用コレクター
 * Single Responsibility原則の適用
 */
class CPUMetricsCollector {
  private samples: TimestampedMetric[] = [];
  private startUsage: NodeJS.CpuUsage;
  private sampleIntervalId?: NodeJS.Timeout;

  constructor(private samplingInterval: number) {
    this.startUsage = process.cpuUsage();
  }

  startSampling(): void {
    this.sampleIntervalId = setInterval(() => {
      const currentUsage = process.cpuUsage(this.startUsage);
      const totalUsage = currentUsage.user + currentUsage.system;
      const cpuPercent = (totalUsage / (this.samplingInterval * 1000)) * 100;
      
      this.samples.push({
        timestamp: Date.now(),
        value: Math.min(100, Math.max(0, cpuPercent))
      });
    }, this.samplingInterval);
  }

  stopSampling(): void {
    if (this.sampleIntervalId) {
      clearInterval(this.sampleIntervalId);
      this.sampleIntervalId = undefined;
    }
  }

  getMetrics(): CPUMetrics {
    const values = this.samples.map(s => s.value);
    const statistics = this.calculateStatistics(values);
    const spikes = this.detectSpikes();

    return {
      averageUsage: statistics.mean,
      peakUsage: statistics.max,
      samples: [...this.samples],
      statistics,
      spikes
    };
  }

  private calculateStatistics(values: number[]): StatisticalSummary {
    if (values.length === 0) {
      return { mean: 0, median: 0, standardDeviation: 0, percentile95: 0, min: 0, max: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const percentile95Index = Math.floor(sorted.length * 0.95);
    const percentile95 = sorted[percentile95Index] || 0;

    return {
      mean,
      median,
      standardDeviation,
      percentile95,
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0
    };
  }

  private detectSpikes(): CPUSpike[] {
    const spikes: CPUSpike[] = [];
    const threshold = 70; // 70%をスパイク判定閾値とする

    for (let i = 1; i < this.samples.length - 1; i++) {
      const current = this.samples[i];
      const prev = this.samples[i - 1];
      const next = this.samples[i + 1];

      if (current.value > threshold && 
          current.value > prev.value * 1.5 && 
          current.value > next.value * 1.5) {
        
        const severity = this.determineSeverity(current.value);
        spikes.push({
          timestamp: current.timestamp,
          peakValue: current.value,
          duration: this.samplingInterval, // 簡易実装
          severity
        });
      }
    }

    return spikes;
  }

  private determineSeverity(cpuValue: number): 'low' | 'medium' | 'high' | 'critical' {
    if (cpuValue >= 95) return 'critical';
    if (cpuValue >= 85) return 'high';
    if (cpuValue >= 75) return 'medium';
    return 'low';
  }

  reset(): void {
    this.samples = [];
    this.startUsage = process.cpuUsage();
  }
}

/**
 * メモリメトリクス専用コレクター
 */
class MemoryMetricsCollector {
  private initialMemoryUsage: NodeJS.MemoryUsage;
  private memorySnapshots: { timestamp: number; usage: NodeJS.MemoryUsage }[] = [];
  private gcCount = 0;
  private gcTotalTime = 0;
  private sampleIntervalId?: NodeJS.Timeout;

  constructor(private samplingInterval: number, private leakThreshold: number) {
    this.initialMemoryUsage = process.memoryUsage();
  }

  startSampling(): void {
    this.sampleIntervalId = setInterval(() => {
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage: process.memoryUsage()
      });
      
      // GC統計の更新（v8 API使用）
      try {
        const gcStats = v8.getHeapStatistics();
        // GC統計の処理（簡易実装）
      } catch (error) {
        // v8統計取得エラーは無視
      }
    }, this.samplingInterval);
  }

  stopSampling(): void {
    if (this.sampleIntervalId) {
      clearInterval(this.sampleIntervalId);
      this.sampleIntervalId = undefined;
    }
  }

  getMetrics(): MemoryMetrics {
    if (this.memorySnapshots.length === 0) {
      const current = process.memoryUsage();
      return {
        heap: {
          used: current.heapUsed,
          total: current.heapTotal,
          peak: current.heapUsed,
          allocatedDelta: 0
        },
        leakSuspicion: {
          detected: false,
          growthRate: 0,
          confidence: 0
        },
        gc: {
          collections: 0,
          totalTime: 0,
          averageTime: 0,
          impactPercentage: 0
        }
      };
    }

    const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
    const peak = Math.max(...this.memorySnapshots.map(s => s.usage.heapUsed));
    const allocatedDelta = latest.usage.heapUsed - this.initialMemoryUsage.heapUsed;

    const leakDetection = this.analyzeMemoryLeak();

    return {
      heap: {
        used: latest.usage.heapUsed,
        total: latest.usage.heapTotal,
        peak,
        allocatedDelta
      },
      leakSuspicion: leakDetection,
      gc: {
        collections: this.gcCount,
        totalTime: this.gcTotalTime,
        averageTime: this.gcCount > 0 ? this.gcTotalTime / this.gcCount : 0,
        impactPercentage: this.calculateGCImpact()
      }
    };
  }

  private analyzeMemoryLeak(): { detected: boolean; growthRate: number; confidence: number } {
    if (this.memorySnapshots.length < 10) {
      return { detected: false, growthRate: 0, confidence: 0 };
    }

    // 線形回帰による成長率の計算
    const points = this.memorySnapshots.map((snapshot, index) => ({
      x: index,
      y: snapshot.usage.heapUsed
    }));

    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const growthRate = slope * (1000 / this.samplingInterval); // bytes/second

    const detected = growthRate > this.leakThreshold / 10; // 閾値の10%を判定基準
    const confidence = Math.min(1.0, Math.abs(growthRate) / this.leakThreshold);

    return { detected, growthRate, confidence };
  }

  private calculateGCImpact(): number {
    if (this.memorySnapshots.length === 0) return 0;
    
    const totalTime = this.memorySnapshots[this.memorySnapshots.length - 1].timestamp - 
                     this.memorySnapshots[0].timestamp;
    
    return totalTime > 0 ? (this.gcTotalTime / totalTime) * 100 : 0;
  }

  reset(): void {
    this.initialMemoryUsage = process.memoryUsage();
    this.memorySnapshots = [];
    this.gcCount = 0;
    this.gcTotalTime = 0;
  }
}

/**
 * I/Oメトリクス専用コレクター
 */
class IOMetricsCollector {
  private fileOperations = { reads: 0, writes: 0, deletes: 0 };
  private bytesRead = 0;
  private bytesWritten = 0;
  private networkStats = {
    requests: 0,
    bytesReceived: 0,
    bytesSent: 0,
    totalLatency: 0
  };

  // ファイルI/O操作の記録（フック関数で実装）
  recordFileRead(bytes: number): void {
    this.fileOperations.reads++;
    this.bytesRead += bytes;
  }

  recordFileWrite(bytes: number): void {
    this.fileOperations.writes++;
    this.bytesWritten += bytes;
  }

  recordFileDelete(): void {
    this.fileOperations.deletes++;
  }

  recordNetworkRequest(bytesReceived: number, bytesSent: number, latency: number): void {
    this.networkStats.requests++;
    this.networkStats.bytesReceived += bytesReceived;
    this.networkStats.bytesSent += bytesSent;
    this.networkStats.totalLatency += latency;
  }

  getMetrics(): IOMetrics {
    return {
      fileOperations: { ...this.fileOperations },
      bytesRead: this.bytesRead,
      bytesWritten: this.bytesWritten,
      network: {
        requests: this.networkStats.requests,
        bytesReceived: this.networkStats.bytesReceived,
        bytesSent: this.networkStats.bytesSent,
        averageLatency: this.networkStats.requests > 0 
          ? this.networkStats.totalLatency / this.networkStats.requests 
          : 0
      }
    };
  }

  reset(): void {
    this.fileOperations = { reads: 0, writes: 0, deletes: 0 };
    this.bytesRead = 0;
    this.bytesWritten = 0;
    this.networkStats = {
      requests: 0,
      bytesReceived: 0,
      bytesSent: 0,
      totalLatency: 0
    };
  }
}

/**
 * メインのメトリクス収集システム
 * Facade パターンによる統一インターフェース提供
 */
export class MetricsCollector extends EventEmitter {
  private sessions: Map<string, MetricsSession> = new Map();
  private cpuCollector!: CPUMetricsCollector;
  private memoryCollector!: MemoryMetricsCollector;
  private ioCollector!: IOMetricsCollector;
  private config: Required<MetricsCollectorConfig>;
  private thresholds: Map<string, number> = new Map();
  private executionPhases: Map<string, ExecutionPhase[]> = new Map();
  private workerCount = 1;

  constructor(config: MetricsCollectorConfig = {}) {
    super();
    
    // デフォルト設定の適用（Defensive Programming）
    this.config = {
      enableCpuProfiling: config.enableCpuProfiling ?? true,
      enableMemoryProfiling: config.enableMemoryProfiling ?? true,
      enableIoMonitoring: config.enableIoMonitoring ?? true,
      samplingInterval: config.samplingInterval ?? 100,
      maxSamples: config.maxSamples ?? 10000,
      memoryLeakThreshold: config.memoryLeakThreshold ?? 1024 * 1024 * 10, // 10MB
      hotspotThreshold: config.hotspotThreshold ?? 0.05, // 5%
      outputDir: config.outputDir ?? './.rimor/metrics'
    };

    this.initializeCollectors();
  }

  private initializeCollectors(): void {
    this.cpuCollector = new CPUMetricsCollector(this.config.samplingInterval);
    this.memoryCollector = new MemoryMetricsCollector(
      this.config.samplingInterval, 
      this.config.memoryLeakThreshold
    );
    this.ioCollector = new IOMetricsCollector();
  }

  /**
   * メトリクス収集セッションを開始
   */
  async startCollection(sessionId: string): Promise<string> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    const session: MetricsSession = {
      id: sessionId,
      startTime: Date.now(),
      status: 'active',
      config: this.config
    };

    this.sessions.set(sessionId, session);
    this.executionPhases.set(sessionId, []);

    // 各コレクターの開始
    if (this.config.enableCpuProfiling) {
      this.cpuCollector.startSampling();
    }

    if (this.config.enableMemoryProfiling) {
      this.memoryCollector.startSampling();
    }

    this.emit('session_started', { sessionId, timestamp: Date.now() });
    
    return sessionId;
  }

  /**
   * メトリクス収集セッションを停止
   */
  async stopCollection(sessionId: string): Promise<MetricsCollectionResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        warnings: [],
        error: `Session ${sessionId} not found`
      };
    }

    try {
      // 各コレクターの停止
      this.cpuCollector.stopSampling();
      this.memoryCollector.stopSampling();

      // メトリクスの収集
      const metrics = await this.collectAllMetrics(sessionId);
      const warnings = this.generateWarnings(metrics);

      // セッション情報の更新
      session.endTime = Date.now();
      session.status = 'completed';

      this.emit('session_completed', { sessionId, metrics, warnings });

      return {
        success: true,
        metrics,
        warnings
      };

    } catch (error) {
      session.status = 'error';
      return {
        success: false,
        warnings: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 全メトリクスの収集
   */
  private async collectAllMetrics(sessionId: string): Promise<CollectedMetrics> {
    const cpuMetrics = this.cpuCollector.getMetrics();
    const memoryMetrics = this.memoryCollector.getMetrics();
    const ioMetrics = this.ioCollector.getMetrics();
    const threadingMetrics = this.getThreadingMetrics();
    const hotspots = this.detectHotspots(cpuMetrics);
    const memoryHotspots = this.detectMemoryHotspots(memoryMetrics);
    const timeline = this.generateExecutionTimeline(sessionId);

    return {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      io: ioMetrics,
      threading: threadingMetrics,
      hotspots,
      memoryHotspots,
      timeline
    };
  }

  /**
   * 並列処理メトリクスの生成
   */
  private getThreadingMetrics(): ThreadingMetrics {
    // Node.jsのシングルスレッド性質を考慮した簡易実装
    const activeWorkers = this.workerCount;
    const queuedTasks = 0; // 実際の実装ではワーカープールから取得
    const efficiency = 0.8; // 仮の値、実際には実測値を使用
    const scalabilityScore = Math.min(1.0, efficiency * (activeWorkers / 4));

    return {
      activeWorkers,
      queuedTasks,
      efficiency,
      scalabilityScore
    };
  }

  /**
   * CPUホットスポットの検出
   */
  private detectHotspots(cpuMetrics: CPUMetrics): Hotspot[] {
    const hotspots: Hotspot[] = [];
    
    // CPU使用率が閾値を超える時点を特定
    const threshold = this.config.hotspotThreshold * 100;
    const highUsageSamples = cpuMetrics.samples.filter(sample => sample.value > threshold);

    if (highUsageSamples.length > 0) {
      const totalHighUsageTime = highUsageSamples.length * this.config.samplingInterval;
      const percentage = (totalHighUsageTime / (cpuMetrics.samples.length * this.config.samplingInterval)) * 100;

      hotspots.push({
        functionName: 'high_cpu_usage', // 実際の実装では関数名を特定
        executionTime: totalHighUsageTime,
        percentage,
        callCount: highUsageSamples.length,
        optimizationSuggestions: [
          'CPU集約的な処理の最適化を検討',
          '並列処理による負荷分散',
          'キャッシュの活用'
        ]
      });
    }

    return hotspots;
  }

  /**
   * メモリホットスポットの検出
   */
  private detectMemoryHotspots(memoryMetrics: MemoryMetrics): Hotspot[] {
    const hotspots: Hotspot[] = [];

    if (memoryMetrics.leakSuspicion.detected) {
      hotspots.push({
        functionName: 'memory_leak_suspect',
        executionTime: 0,
        percentage: memoryMetrics.leakSuspicion.confidence * 100,
        callCount: 1,
        optimizationSuggestions: [
          'メモリリークの原因特定',
          '不要なオブジェクト参照の削除',
          'WeakMapやWeakSetの活用'
        ]
      });
    }

    return hotspots;
  }

  /**
   * 実行タイムラインの生成
   */
  private generateExecutionTimeline(sessionId: string): ExecutionTimeline {
    const phases = this.executionPhases.get(sessionId) || [];
    const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const criticalPath = this.calculateCriticalPath(phases);

    return {
      phases,
      totalDuration,
      criticalPath
    };
  }

  /**
   * クリティカルパスの計算
   */
  private calculateCriticalPath(phases: ExecutionPhase[]): string[] {
    // 簡易実装: 最も時間のかかったフェーズをクリティカルパスとする
    return phases
      .sort((a, b) => b.duration - a.duration)
      .slice(0, Math.min(3, phases.length))
      .map(phase => phase.name);
  }

  /**
   * 警告の生成
   */
  private generateWarnings(metrics: CollectedMetrics): MetricsWarning[] {
    const warnings: MetricsWarning[] = [];

    // CPU使用率警告
    const cpuThreshold = this.thresholds.get('cpu.average');
    if (cpuThreshold && metrics.cpu.averageUsage > cpuThreshold) {
      warnings.push({
        type: 'cpu_threshold_exceeded',
        severity: 'high',
        message: `CPU使用率が閾値(${cpuThreshold}%)を超過しました: ${metrics.cpu.averageUsage.toFixed(1)}%`,
        timestamp: Date.now()
      });
    }

    // メモリ増加警告
    if (metrics.memory.leakSuspicion.detected) {
      warnings.push({
        type: 'memory_growth_warning',
        severity: 'medium',
        message: `メモリリークの可能性があります (成長率: ${(metrics.memory.leakSuspicion.growthRate / 1024).toFixed(1)} KB/s)`,
        timestamp: Date.now()
      });
    }

    // ホットスポット警告
    if (metrics.hotspots.length > 0) {
      warnings.push({
        type: 'hotspot_detected',
        severity: 'medium',
        message: `${metrics.hotspots.length}個のパフォーマンスホットスポットが検出されました`,
        timestamp: Date.now(),
        metadata: { hotspotCount: metrics.hotspots.length }
      });
    }

    return warnings;
  }

  /**
   * 閾値の設定
   */
  setThreshold(metric: string, value: number): void {
    this.thresholds.set(metric, value);
  }

  /**
   * ワーカー数の設定
   */
  setWorkerCount(count: number): void {
    this.workerCount = Math.max(1, count);
  }

  /**
   * 実行フェーズの開始マーク
   */
  async markPhaseStart(sessionId: string, phaseName: string, dependencies?: string[]): Promise<void> {
    const phases = this.executionPhases.get(sessionId) || [];
    
    const phase: ExecutionPhase = {
      name: phaseName,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      dependencies
    };

    phases.push(phase);
    this.executionPhases.set(sessionId, phases);
  }

  /**
   * 実行フェーズの終了マーク
   */
  async markPhaseEnd(sessionId: string, phaseName: string): Promise<void> {
    const phases = this.executionPhases.get(sessionId) || [];
    const phase = phases.find(p => p.name === phaseName && p.endTime === 0);
    
    if (phase) {
      phase.endTime = Date.now();
      phase.duration = phase.endTime - phase.startTime;
    }
  }

  /**
   * リソースのクリーンアップ
   */
  cleanup(): void {
    // すべてのアクティブセッションを停止
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'active') {
        this.stopCollection(sessionId).catch(console.error);
      }
    }

    // コレクターのリセット
    this.cpuCollector.reset();
    this.memoryCollector.reset();
    this.ioCollector.reset();

    this.sessions.clear();
    this.executionPhases.clear();
    this.removeAllListeners();
  }
}