/**
 * 高精度パフォーマンスプロファイラー
 * Phase 2: 詳細プロファイリングとリアルタイム監視システム
 * 
 * SOLID原則に基づく設計:
 * - Single Responsibility: 各分析機能を専用クラスに分離
 * - Open/Closed: 新しい分析タイプの追加に開放
 * - Interface Segregation: 機能別インターフェース分離
 * - Dependency Inversion: プロファイリング戦略の抽象化
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  ProfilerConfiguration,
  ProfilingSession,
  ProfilingResult,
  ProfilingData,
  CPUAnalysis,
  CallStackAnalysis,
  MemoryAnalysis,
  GarbageCollectionAnalysis,
  IOAnalysis,
  ParallelismAnalysis,
  ExecutionFlowAnalysis,
  AsyncAnalysis,
  HotspotAnalysis,
  RealtimeMetrics,
  PerformanceAlert,
  AlertThresholds,
  HTMLReportResult,
  JSONReportResult,
  FlameGraphResult,
  HTMLReportOptions,
  FunctionProfile,
  CallPath,
  MemoryLeakDetection,
  ExecutionTimeline
} from './types';

/**
 * CPU分析専用エンジン
 * Single Responsibility原則の適用
 */
class CPUAnalysisEngine {
  private samples: { timestamp: number; stackTrace: string[]; cpuUsage: number }[] = [];
  private functionTimes: Map<string, { totalTime: number; callCount: number; samples: number[] }> = new Map();
  private samplingInterval: number;

  constructor(samplingInterval: number) {
    this.samplingInterval = samplingInterval;
  }

  startSampling(): void {
    // CPU使用率とスタックトレースのサンプリング
    const sampleId = setInterval(() => {
      const stackTrace = this.captureStackTrace();
      const cpuUsage = this.getCurrentCPUUsage();
      
      this.samples.push({
        timestamp: Date.now(),
        stackTrace,
        cpuUsage
      });

      // 関数時間の記録
      stackTrace.forEach(func => {
        if (!this.functionTimes.has(func)) {
          this.functionTimes.set(func, { totalTime: 0, callCount: 0, samples: [] });
        }
        const funcData = this.functionTimes.get(func)!;
        funcData.totalTime += this.samplingInterval;
        funcData.callCount++;
        funcData.samples.push(cpuUsage);
      });

    }, this.samplingInterval);

    // サンプリングIDを保存（停止時に使用）
    (this as any).sampleId = sampleId;
  }

  stopSampling(): void {
    if ((this as any).sampleId) {
      clearInterval((this as any).sampleId);
      (this as any).sampleId = undefined;
    }
  }

  generateAnalysis(): CPUAnalysis {
    const functionProfiles = this.generateFunctionProfiles();
    const hotspots = this.detectCPUHotspots(functionProfiles);

    return {
      functionProfiles,
      hotspots,
      totalSamples: this.samples.length,
      samplingRate: 1000 / this.samplingInterval // Hz
    };
  }

  private captureStackTrace(): string[] {
    // スタックトレースの取得（V8 API使用）
    const originalPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack as any;
    Error.prepareStackTrace = originalPrepareStackTrace;

    return (stack || [])
      .slice(2) // この関数と呼び出し元を除外
      .map((site: any) => {
        const functionName = site.getFunctionName() || '<anonymous>';
        const fileName = site.getFileName() || '<unknown>';
        const lineNumber = site.getLineNumber() || 0;
        return `${functionName} (${path.basename(fileName)}:${lineNumber})`;
      })
      .slice(0, 20); // 最大20レベルまで
  }

  private getCurrentCPUUsage(): number {
    // Node.jsのCPU使用率計算（簡易実装）
    const usage = process.cpuUsage();
    return (usage.user + usage.system) / 1000; // マイクロ秒をミリ秒に変換
  }

  private generateFunctionProfiles(): FunctionProfile[] {
    const profiles: FunctionProfile[] = [];

    this.functionTimes.forEach((data, functionName) => {
      const averageTime = data.samples.length > 0 
        ? data.samples.reduce((sum, sample) => sum + sample, 0) / data.samples.length 
        : 0;

      const totalSamplingTime = this.samples.length * this.samplingInterval;
      const percentage = totalSamplingTime > 0 ? (data.totalTime / totalSamplingTime) * 100 : 0;

      profiles.push({
        functionName,
        totalTime: data.totalTime,
        averageTime,
        callCount: data.callCount,
        percentage
      });
    });

    return profiles.sort((a, b) => b.totalTime - a.totalTime);
  }

  private detectCPUHotspots(functionProfiles: FunctionProfile[]): any[] {
    const threshold = 5; // 5%以上をホットスポットとする
    return functionProfiles
      .filter(profile => profile.percentage >= threshold)
      .map(profile => ({
        functionName: profile.functionName,
        executionTime: profile.totalTime,
        percentage: profile.percentage,
        callCount: profile.callCount,
        optimizationSuggestions: this.generateOptimizationSuggestions(profile)
      }));
  }

  private generateOptimizationSuggestions(profile: FunctionProfile): string[] {
    const suggestions: string[] = [];
    
    if (profile.percentage > 20) {
      suggestions.push('関数の処理内容を見直し、最適化を検討');
    }
    if (profile.callCount > 1000) {
      suggestions.push('頻繁に呼び出される関数のキャッシュを検討');
    }
    if (profile.averageTime > 10) {
      suggestions.push('関数の分割による処理時間短縮を検討');
    }

    return suggestions;
  }

  reset(): void {
    this.samples = [];
    this.functionTimes.clear();
  }
}

/**
 * メモリ分析専用エンジン
 */
class MemoryAnalysisEngine {
  private memorySnapshots: { timestamp: number; usage: NodeJS.MemoryUsage }[] = [];
  private gcEvents: { timestamp: number; pauseTime: number; beforeSize: number; afterSize: number; type: string }[] = [];
  private samplingInterval: number;
  private leakThreshold: number;

  constructor(samplingInterval: number, leakThreshold: number) {
    this.samplingInterval = samplingInterval;
    this.leakThreshold = leakThreshold;
  }

  startSampling(): void {
    const sampleId = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage: memoryUsage
      });
    }, this.samplingInterval);

    (this as any).sampleId = sampleId;

    // GCイベントの監視（V8フック使用）
    this.setupGCMonitoring();
  }

  stopSampling(): void {
    if ((this as any).sampleId) {
      clearInterval((this as any).sampleId);
      (this as any).sampleId = undefined;
    }
  }

  generateAnalysis(): MemoryAnalysis {
    const usageOverTime = this.memorySnapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      value: snapshot.usage.heapUsed
    }));

    const leakDetection = this.analyzeMemoryLeak();
    const usagePatterns = this.analyzeUsagePatterns();
    const peakUsage = Math.max(...this.memorySnapshots.map(s => s.usage.heapUsed));
    const averageUsage = this.memorySnapshots.reduce((sum, s) => sum + s.usage.heapUsed, 0) / this.memorySnapshots.length;

    return {
      usageOverTime,
      leakDetection,
      usagePatterns,
      peakUsage,
      averageUsage
    };
  }

  private analyzeMemoryLeak(): MemoryLeakDetection {
    if (this.memorySnapshots.length < 10) {
      return {
        suspected: false,
        leakRate: 0,
        suspiciousAllocations: [],
        confidence: 0
      };
    }

    // 線形回帰による成長率計算
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
    const leakRate = slope * (1000 / this.samplingInterval); // bytes/second

    const suspected = leakRate > this.leakThreshold / 100; // 閾値の1%以上の成長
    const confidence = Math.min(1.0, Math.abs(leakRate) / (this.leakThreshold / 10));

    return {
      suspected,
      leakRate,
      suspiciousAllocations: [], // 実際の実装では詳細な割り当て情報を含む
      confidence
    };
  }

  private analyzeUsagePatterns(): any {
    const values = this.memorySnapshots.map(s => s.usage.heapUsed);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // パターンの検出
    const steady = stdDev < mean * 0.1; // 10%未満の変動
    const spiky = this.detectSpikes(values).length > values.length * 0.1; // 10%以上がスパイク
    const increasing = this.calculateTrend(values) > 0;
    const decreasing = this.calculateTrend(values) < 0;

    return {
      steady: { detected: steady, variance: stdDev },
      spiky: { detected: spiky, spikeCount: this.detectSpikes(values).length },
      increasing: { detected: increasing, growthRate: this.calculateTrend(values) },
      decreasing: { detected: decreasing, reductionRate: Math.abs(this.calculateTrend(values)) }
    };
  }

  private detectSpikes(values: number[]): number[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const threshold = mean + stdDev * 2; // 2標準偏差以上をスパイクとする

    return values.map((val, index) => val > threshold ? index : -1).filter(i => i >= 0);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  private setupGCMonitoring(): void {
    // GCイベントの監視（実際の実装ではV8 APIを使用）
    // 簡易実装として定期的にヒープ統計をチェック
    try {
      const v8 = require('v8');
      const initialStats = v8.getHeapStatistics();
      
      setInterval(() => {
        const currentStats = v8.getHeapStatistics();
        // GCイベントの検出と記録（簡易実装）
        if (currentStats.used_heap_size < initialStats.used_heap_size * 0.9) {
          this.gcEvents.push({
            timestamp: Date.now(),
            pauseTime: 10, // 仮の値
            beforeSize: initialStats.used_heap_size,
            afterSize: currentStats.used_heap_size,
            type: 'minor'
          });
        }
      }, this.samplingInterval * 10);
    } catch (error) {
      // V8 API利用不可の場合は無視
    }
  }

  reset(): void {
    this.memorySnapshots = [];
    this.gcEvents = [];
  }
}

/**
 * ホットスポット検出エンジン
 */
class HotspotDetectionEngine {
  private executionTimes: Map<string, number[]> = new Map();
  private threshold: number;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  recordExecution(location: string, executionTime: number): void {
    if (!this.executionTimes.has(location)) {
      this.executionTimes.set(location, []);
    }
    this.executionTimes.get(location)!.push(executionTime);
  }

  detectHotspots(): HotspotAnalysis {
    const hotspots: any[] = [];
    const memoryHotspots: any[] = [];

    this.executionTimes.forEach((times, location) => {
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / times.length;
      const maxTime = Math.max(...times);

      if (averageTime > this.threshold) {
        hotspots.push({
          functionName: location,
          executionTime: totalTime,
          percentage: 0, // 全体に対する割合は後で計算
          callCount: times.length,
          optimizationSuggestions: this.generateSuggestions(averageTime, maxTime)
        });
      }
    });

    return {
      hotspots: hotspots.sort((a, b) => b.executionTime - a.executionTime),
      memoryHotspots,
      totalHotspots: hotspots.length
    };
  }

  private generateSuggestions(avgTime: number, maxTime: number): string[] {
    const suggestions: string[] = [];
    
    if (avgTime > 100) {
      suggestions.push('処理時間が長いため、アルゴリズムの見直しを検討');
    }
    if (maxTime > avgTime * 3) {
      suggestions.push('実行時間のばらつきが大きいため、条件分岐の最適化を検討');
    }
    
    return suggestions;
  }

  reset(): void {
    this.executionTimes.clear();
  }
}

/**
 * メインのパフォーマンスプロファイラー
 * Facade パターンによる統一インターフェース
 */
export class PerformanceProfiler extends EventEmitter {
  private sessions: Map<string, ProfilingSession> = new Map();
  private cpuEngine!: CPUAnalysisEngine;
  private memoryEngine!: MemoryAnalysisEngine;
  private hotspotEngine!: HotspotDetectionEngine;
  private config: Required<ProfilerConfiguration>;
  private alertThresholds: AlertThresholds = {};

  constructor(config: ProfilerConfiguration) {
    super();
    
    this.config = {
      samplingInterval: config.samplingInterval,
      enableCallStackAnalysis: config.enableCallStackAnalysis ?? true,
      enableMemoryLeakDetection: config.enableMemoryLeakDetection ?? true,
      enableHotspotDetection: config.enableHotspotDetection ?? true,
      enableExecutionTimeline: config.enableExecutionTimeline ?? true,
      maxSamples: config.maxSamples ?? 10000,
      memoryLeakThreshold: config.memoryLeakThreshold ?? 1024 * 1024 * 10, // 10MB
      hotspotThreshold: config.hotspotThreshold ?? 0.05, // 5%
      outputDir: config.outputDir ?? './.rimor/profiler'
    };

    this.initializeEngines();
  }

  private initializeEngines(): void {
    this.cpuEngine = new CPUAnalysisEngine(this.config.samplingInterval);
    this.memoryEngine = new MemoryAnalysisEngine(
      this.config.samplingInterval, 
      this.config.memoryLeakThreshold
    );
    this.hotspotEngine = new HotspotDetectionEngine(this.config.hotspotThreshold * 1000);
  }

  /**
   * プロファイリングセッションの開始
   */
  async startProfiling(sessionId: string): Promise<string> {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Profiling session ${sessionId} already exists`);
    }

    const session: ProfilingSession = {
      id: sessionId,
      startTime: Date.now(),
      status: 'active',
      config: this.config,
      sampleCount: 0
    };

    this.sessions.set(sessionId, session);

    // 各エンジンの開始
    if (this.config.enableCallStackAnalysis) {
      this.cpuEngine.startSampling();
    }
    if (this.config.enableMemoryLeakDetection) {
      this.memoryEngine.startSampling();
    }

    this.emit('profiling_started', { sessionId, timestamp: Date.now() });
    
    return sessionId;
  }

  /**
   * プロファイリングセッションの停止
   */
  async stopProfiling(sessionId: string): Promise<ProfilingResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: `Profiling session ${sessionId} not found`
      };
    }

    try {
      // 各エンジンの停止
      this.cpuEngine.stopSampling();
      this.memoryEngine.stopSampling();

      // プロファイリングデータの収集
      const profilingData = await this.collectProfilingData(session);

      // セッション情報の更新
      session.endTime = Date.now();
      session.status = 'completed';

      this.emit('profiling_completed', { sessionId, profilingData });

      return {
        success: true,
        profilingData
      };

    } catch (error) {
      session.status = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * セッション情報の取得
   */
  async getSession(sessionId: string): Promise<ProfilingSession | undefined> {
    return this.sessions.get(sessionId);
  }

  /**
   * プロファイリングの一時停止
   */
  async pauseProfiling(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'active') {
      session.status = 'paused';
      this.cpuEngine.stopSampling();
      this.memoryEngine.stopSampling();
    }
  }

  /**
   * プロファイリングの再開
   */
  async resumeProfiling(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'active';
      this.cpuEngine.startSampling();
      this.memoryEngine.startSampling();
    }
  }

  /**
   * プロファイリングデータの収集
   */
  private async collectProfilingData(session: ProfilingSession): Promise<ProfilingData> {
    const cpuAnalysis = this.cpuEngine.generateAnalysis();
    const memoryAnalysis = this.memoryEngine.generateAnalysis();
    const hotspotAnalysis = this.hotspotEngine.detectHotspots();

    // 簡易実装の他の分析データ
    const callStackAnalysis: CallStackAnalysis = {
      callPaths: [],
      deepestPath: { functions: [], depth: 0, totalTime: 0, percentage: 0 },
      mostExpensivePath: { functions: [], depth: 0, totalTime: 0, percentage: 0 }
    };

    const garbageCollectionAnalysis: GarbageCollectionAnalysis = {
      collections: [],
      totalPauseTime: 0,
      averagePauseTime: 0,
      impactOnPerformance: 0,
      efficiency: 1.0
    };

    const ioAnalysis: IOAnalysis = {
      bottlenecks: [],
      totalWaitTime: 0,
      waitTime: 0,
      efficiency: 1.0
    };

    const parallelismAnalysis: ParallelismAnalysis = {
      parallelizationOpportunities: [],
      currentParallelism: 1,
      estimatedSpeedup: 1.0,
      efficiency: 1.0
    };

    const executionFlowAnalysis: ExecutionFlowAnalysis = {
      callGraph: { nodes: [], edges: [] },
      criticalPath: [],
      bottleneckNodes: []
    };

    const asyncAnalysis: AsyncAnalysis = {
      promiseChains: [],
      concurrentOperations: [],
      waitingTime: 0,
      efficiency: 1.0
    };

    const executionTimeline: ExecutionTimeline = {
      phases: [],
      totalDuration: session.endTime ? session.endTime - session.startTime : 0,
      criticalPath: []
    };

    const recommendations = this.generateRecommendations(cpuAnalysis, memoryAnalysis, hotspotAnalysis);

    return {
      sessionInfo: session,
      cpuAnalysis,
      callStackAnalysis,
      memoryAnalysis,
      garbageCollectionAnalysis,
      ioAnalysis,
      parallelismAnalysis,
      executionFlowAnalysis,
      asyncAnalysis,
      hotspotAnalysis,
      executionTimeline,
      recommendations
    };
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(
    cpuAnalysis: CPUAnalysis, 
    memoryAnalysis: MemoryAnalysis, 
    hotspotAnalysis: HotspotAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // CPU関連の推奨事項
    if (hotspotAnalysis.hotspots.length > 0) {
      recommendations.push(`${hotspotAnalysis.hotspots.length}個のCPUホットスポットが検出されました。最適化を検討してください。`);
    }

    // メモリ関連の推奨事項
    if (memoryAnalysis.leakDetection.suspected) {
      recommendations.push('メモリリークの可能性があります。メモリ使用量を監視し、不要な参照を削除してください。');
    }

    // 全般的な推奨事項
    if (cpuAnalysis.functionProfiles.length > 100) {
      recommendations.push('多数の関数が実行されています。プロファイル結果を基に最適化対象を絞り込むことを推奨します。');
    }

    return recommendations;
  }

  /**
   * HTMLレポートの生成
   */
  async generateHTMLReport(sessionId: string, options: HTMLReportOptions = {}): Promise<HTMLReportResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const reportContent = this.generateHTMLContent(session, options);
    const fileName = `profile-${sessionId}-${Date.now()}.html`;
    const filePath = path.join(this.config.outputDir, fileName);

    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.writeFile(filePath, reportContent, 'utf-8');

    const stats = await fs.stat(filePath);

    return {
      filePath,
      size: stats.size,
      generatedAt: Date.now()
    };
  }

  /**
   * JSONレポートの生成
   */
  async generateJSONReport(sessionId: string): Promise<JSONReportResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const profilingData = await this.collectProfilingData(session);
    
    return {
      data: profilingData,
      size: JSON.stringify(profilingData).length,
      generatedAt: Date.now()
    };
  }

  /**
   * フレームグラフの生成
   */
  async generateFlameGraph(sessionId: string): Promise<FlameGraphResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const cpuAnalysis = this.cpuEngine.generateAnalysis();
    const svgData = this.generateFlameGraphSVG(cpuAnalysis);

    return {
      svgData,
      totalSamples: cpuAnalysis.totalSamples,
      generatedAt: Date.now()
    };
  }

  /**
   * リアルタイムメトリクスの取得
   */
  async getRealtimeMetrics(sessionId: string): Promise<RealtimeMetrics> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error(`Active session ${sessionId} not found`);
    }

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const hotspots = this.hotspotEngine.detectHotspots().hotspots.slice(0, 5);

    return {
      currentCpuUsage: (cpuUsage.user + cpuUsage.system) / 1000,
      currentMemoryUsage: memoryUsage.heapUsed,
      activeHotspots: hotspots,
      timestamp: Date.now()
    };
  }

  /**
   * アラート閾値の設定
   */
  setAlertThresholds(thresholds: AlertThresholds): void {
    this.alertThresholds = { ...thresholds };
  }

  /**
   * アラートの取得
   */
  async getAlerts(sessionId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    const realtimeMetrics = await this.getRealtimeMetrics(sessionId);

    // CPU使用率アラート
    if (this.alertThresholds.cpuUsage && realtimeMetrics.currentCpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'high_cpu',
        severity: 'high',
        message: `CPU使用率が閾値(${this.alertThresholds.cpuUsage}%)を超えています`,
        timestamp: Date.now()
      });
    }

    // 関数実行時間アラート
    const slowFunctions = realtimeMetrics.activeHotspots.filter(h => 
      this.alertThresholds.functionExecutionTime && h.executionTime > this.alertThresholds.functionExecutionTime
    );

    slowFunctions.forEach(func => {
      alerts.push({
        type: 'slow_function',
        severity: 'medium',
        message: `関数${func.functionName}の実行時間が閾値を超えています`,
        timestamp: Date.now(),
        location: func.functionName
      });
    });

    return alerts;
  }

  /**
   * HTMLコンテンツの生成
   */
  private generateHTMLContent(session: ProfilingSession, options: HTMLReportOptions): string {
    const theme = options.theme || 'light';
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Profile Report - ${session.id}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'}; color: ${theme === 'dark' ? '#ffffff' : '#000000'}; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background-color: ${theme === 'dark' ? '#333' : '#f5f5f5'}; border-radius: 3px; }
        .chart { width: 100%; height: 300px; background-color: ${theme === 'dark' ? '#2a2a2a' : '#fafafa'}; border: 1px solid #ccc; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Profile Report</h1>
        <p>Session ID: ${session.id}</p>
        <p>Start Time: ${new Date(session.startTime).toISOString()}</p>
        <p>Duration: ${session.endTime ? ((session.endTime - session.startTime) / 1000).toFixed(2) : 'N/A'} seconds</p>
    </div>
    
    <div class="section">
        <h2>CPU Analysis</h2>
        <div class="metric">Sampling Rate: ${1000 / session.config.samplingInterval} Hz</div>
        <div class="metric">Total Samples: ${session.sampleCount || 'N/A'}</div>
        ${options.includeCharts ? '<div class="chart">[CPU Usage Chart Placeholder]</div>' : ''}
    </div>
    
    <div class="section">
        <h2>Memory Analysis</h2>
        <div class="metric">Peak Usage: N/A</div>
        <div class="metric">Average Usage: N/A</div>
        ${options.includeCharts ? '<div class="chart">[Memory Usage Chart Placeholder]</div>' : ''}
    </div>
    
    ${options.includeRecommendations ? `
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>継続的な監視を推奨します</li>
            <li>ホットスポットの最適化を検討してください</li>
        </ul>
    </div>` : ''}
</body>
</html>`;
  }

  /**
   * フレームグラフSVGの生成
   */
  private generateFlameGraphSVG(cpuAnalysis: CPUAnalysis): string {
    // 簡易的なフレームグラフSVGの生成
    const width = 1000;
    const height = 400;
    
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <text x="10" y="30" font-family="Arial" font-size="16" fill="#000000">Flame Graph - ${cpuAnalysis.totalSamples} samples</text>
  <!-- 実際の実装では関数プロファイルに基づいて矩形を描画 -->
  ${cpuAnalysis.functionProfiles.slice(0, 10).map((profile, index) => `
    <rect x="10" y="${50 + index * 30}" width="${profile.percentage * 8}" height="25" fill="#ff6b6b"/>
    <text x="15" y="${68 + index * 30}" font-family="Arial" font-size="12" fill="#000000">${profile.functionName} (${profile.percentage.toFixed(1)}%)</text>
  `).join('')}
</svg>`;
  }

  /**
   * リソースのクリーンアップ
   */
  async shutdown(): Promise<void> {
    // すべてのアクティブセッションを停止
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'active' || session.status === 'paused') {
        await this.stopProfiling(sessionId);
      }
    }

    // エンジンのリセット
    this.cpuEngine.reset();
    this.memoryEngine.reset();
    this.hotspotEngine.reset();

    this.sessions.clear();
    this.removeAllListeners();
  }
}