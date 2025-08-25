/**
 * ベンチマーク測定システムの型定義
 * Phase 2: 詳細メトリクス収集と解析精度測定のための型システム
 */

// ===== 基本型定義 =====

export interface TimestampedMetric {
  timestamp: number;
  value: number;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  standardDeviation: number;
  percentile95: number;
  min: number;
  max: number;
}

// ===== MetricsCollector関連 =====

export interface MetricsCollectorConfig {
  enableCpuProfiling?: boolean;
  enableMemoryProfiling?: boolean;
  enableIoMonitoring?: boolean;
  samplingInterval?: number; // ms
  maxSamples?: number;
  memoryLeakThreshold?: number; // bytes
  hotspotThreshold?: number; // percentage
  outputDir?: string;
}

export interface MetricsSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  config: MetricsCollectorConfig;
}

export interface CPUMetrics {
  averageUsage: number;
  peakUsage: number;
  samples: TimestampedMetric[];
  statistics: StatisticalSummary;
  spikes: CPUSpike[];
}

export interface CPUSpike {
  timestamp: number;
  peakValue: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemoryMetrics {
  heap: {
    used: number;
    total: number;
    peak: number;
    allocatedDelta: number;
  };
  leakSuspicion: {
    detected: boolean;
    growthRate: number; // bytes/second
    confidence: number;
  };
  gc: {
    collections: number;
    totalTime: number;
    averageTime: number;
    impactPercentage: number;
  };
}

export interface IOMetrics {
  fileOperations: {
    reads: number;
    writes: number;
    deletes: number;
  };
  bytesRead: number;
  bytesWritten: number;
  network?: {
    requests: number;
    bytesReceived: number;
    bytesSent: number;
    averageLatency: number;
  };
}

export interface ThreadingMetrics {
  activeWorkers: number;
  queuedTasks: number;
  efficiency: number; // 0-1
  scalabilityScore: number;
}

export interface Hotspot {
  functionName: string;
  executionTime: number;
  percentage: number;
  callCount: number;
  optimizationSuggestions: string[];
}

export interface ExecutionPhase {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  dependencies?: string[];
}

export interface ExecutionTimeline {
  phases: ExecutionPhase[];
  totalDuration: number;
  criticalPath: string[];
}

export interface MetricsWarning {
  type: 'cpu_threshold_exceeded' | 'memory_growth_warning' | 'io_bottleneck' | 'hotspot_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CollectedMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  io: IOMetrics;
  threading: ThreadingMetrics;
  hotspots: Hotspot[];
  memoryHotspots: Hotspot[];
  timeline: ExecutionTimeline;
}

export interface MetricsCollectionResult {
  success: boolean;
  metrics?: CollectedMetrics;
  warnings: MetricsWarning[];
  error?: string;
}

// ===== AccuracyCollector関連 =====

export interface AccuracyCollectorConfig {
  enableTaintAnalysis?: boolean;
  enableIntentExtraction?: boolean;
  enableGapDetection?: boolean;
  confidenceThreshold?: number;
  sampleSize?: number;
}

export interface TaintAnalysisResult {
  file: string;
  expected: boolean;
  actual: boolean;
  confidence: number;
  analysisTime: number;
  vulnerabilityType?: string;
  timestamp?: number;
}

export interface IntentExtractionResult {
  file: string;
  expectedIntent: string;
  extractedIntent: string;
  similarity: number;
  confidence: number;
  analysisTime: number;
  category?: string;
  framework?: string;
  timestamp?: number;
}

export interface GapDetectionResult {
  productionFile: string;
  testFile: string;
  expectedGaps: number;
  detectedGaps: number;
  confidence: number;
  analysisTime: number;
  gapType?: string;
  timestamp?: number;
}

export interface TaintAnalysisMetrics {
  overallAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  byVulnerabilityType: Record<string, AccuracyStats>;
  byConfidenceLevel: {
    high: AccuracyStats; // 0.9以上
    medium: AccuracyStats; // 0.7-0.9
    low: AccuracyStats; // 0.7未満
  };
}

export interface IntentExtractionMetrics {
  overallAccuracy: number;
  averageSimilarity: number;
  exactMatches: number;
  partialMatches: number;
  mismatches: number;
  byCategory: Record<string, AccuracyStats>;
  byFramework: Record<string, AccuracyStats>;
}

export interface GapDetectionMetrics {
  overallAccuracy: number;
  precision: number;
  recall: number;
  averageGapsDetected: number;
  byGapType: Record<string, AccuracyStats>;
}

export interface AccuracyStats {
  accuracy: number;
  sampleCount: number;
  averageConfidence: number;
}

export interface IntegratedAccuracyMetrics {
  overallScore: number;
  weightedAccuracy: number;
  confidenceScore: number;
}

export interface AccuracyTrend {
  improvementRate: number; // per hour
  degradationPoints: number[];
  stabilityScore: number;
}

export interface AccuracyAlert {
  type: 'accuracy_threshold_breach' | 'confidence_drop' | 'trend_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  affectedMetric: string;
}

export interface AccuracyMetrics {
  taintAnalysis: TaintAnalysisMetrics;
  intentExtraction: IntentExtractionMetrics;
  gapDetection: GapDetectionMetrics;
  integrated: IntegratedAccuracyMetrics;
  trends?: AccuracyTrend;
}

export interface CurrentAccuracySnapshot {
  sessionId: string;
  currentAccuracy: number;
  sampleCount: number;
  alerts: AccuracyAlert[];
  timestamp: number;
}

export interface AccuracyMeasurementResult {
  success: boolean;
  accuracyMetrics?: AccuracyMetrics;
  error?: string;
}

// ===== PerformanceProfiler関連 =====

export interface ProfilerConfiguration {
  samplingInterval: number;
  enableCallStackAnalysis?: boolean;
  enableMemoryLeakDetection?: boolean;
  enableHotspotDetection?: boolean;
  enableExecutionTimeline?: boolean;
  maxSamples?: number;
  memoryLeakThreshold?: number;
  hotspotThreshold?: number;
  outputDir?: string;
}

export interface ProfilingSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed' | 'error';
  config: ProfilerConfiguration;
  sampleCount: number;
}

export interface FunctionProfile {
  functionName: string;
  totalTime: number;
  averageTime: number;
  callCount: number;
  percentage: number;
  sourceLocation?: {
    file: string;
    line: number;
    column: number;
  };
}

export interface CPUAnalysis {
  functionProfiles: FunctionProfile[];
  hotspots: Hotspot[];
  totalSamples: number;
  samplingRate: number;
}

export interface CallPath {
  functions: string[];
  depth: number;
  totalTime: number;
  percentage: number;
}

export interface CallStackAnalysis {
  callPaths: CallPath[];
  deepestPath: CallPath;
  mostExpensivePath: CallPath;
}

export interface MemoryLeakDetection {
  suspected: boolean;
  leakRate: number; // bytes/second
  suspiciousAllocations: {
    location: string;
    size: number;
    timestamp: number;
  }[];
  confidence: number;
}

export interface MemoryUsagePattern {
  steady: { detected: boolean; variance: number };
  spiky: { detected: boolean; spikeCount: number };
  increasing: { detected: boolean; growthRate: number };
  decreasing: { detected: boolean; reductionRate: number };
}

export interface MemoryAnalysis {
  usageOverTime: TimestampedMetric[];
  leakDetection: MemoryLeakDetection;
  usagePatterns: MemoryUsagePattern;
  peakUsage: number;
  averageUsage: number;
}

export interface GarbageCollectionEvent {
  timestamp: number;
  pauseTime: number;
  beforeSize: number;
  afterSize: number;
  type: 'minor' | 'major' | 'full';
}

export interface GarbageCollectionAnalysis {
  collections: GarbageCollectionEvent[];
  totalPauseTime: number;
  averagePauseTime: number;
  impactOnPerformance: number; // percentage
  efficiency: number;
}

export interface IOBottleneck {
  type: 'file-io' | 'network-io' | 'database';
  location: string;
  waitTime: number;
  percentage: number;
}

export interface IOAnalysis {
  bottlenecks: IOBottleneck[];
  totalWaitTime: number;
  waitTime: number;
  efficiency: number;
}

export interface ParallelizationOpportunity {
  location: string;
  currentExecutionTime: number;
  estimatedParallelTime: number;
  potentialSpeedup: number;
  confidence: number;
}

export interface ParallelismAnalysis {
  parallelizationOpportunities: ParallelizationOpportunity[];
  currentParallelism: number;
  estimatedSpeedup: number;
  efficiency: number;
}

export interface ExecutionFlowNode {
  id: string;
  name: string;
  executionTime: number;
  startTime: number;
  endTime: number;
}

export interface ExecutionFlowEdge {
  from: string;
  to: string;
  weight: number; // execution time
}

export interface ExecutionFlowGraph {
  nodes: ExecutionFlowNode[];
  edges: ExecutionFlowEdge[];
}

export interface ExecutionFlowAnalysis {
  callGraph: ExecutionFlowGraph;
  criticalPath: string[];
  bottleneckNodes: string[];
}

export interface AsyncOperation {
  id: string;
  type: 'promise' | 'callback' | 'async-await';
  startTime: number;
  endTime: number;
  waitingTime: number;
}

export interface AsyncAnalysis {
  promiseChains: AsyncOperation[][];
  concurrentOperations: AsyncOperation[];
  waitingTime: number;
  efficiency: number;
}

export interface ProfilingData {
  sessionInfo: ProfilingSession;
  cpuAnalysis: CPUAnalysis;
  callStackAnalysis: CallStackAnalysis;
  memoryAnalysis: MemoryAnalysis;
  garbageCollectionAnalysis: GarbageCollectionAnalysis;
  ioAnalysis: IOAnalysis;
  parallelismAnalysis: ParallelismAnalysis;
  executionFlowAnalysis: ExecutionFlowAnalysis;
  asyncAnalysis: AsyncAnalysis;
  hotspotAnalysis: HotspotAnalysis;
  executionTimeline: ExecutionTimeline;
  recommendations: string[];
}

export interface HotspotAnalysis {
  hotspots: Hotspot[];
  memoryHotspots: Hotspot[];
  totalHotspots: number;
}

export interface ProfilingResult {
  success: boolean;
  profilingData?: ProfilingData;
  error?: string;
}

export interface RealtimeMetrics {
  currentCpuUsage: number;
  currentMemoryUsage: number;
  activeHotspots: Hotspot[];
  timestamp: number;
}

export interface PerformanceAlert {
  type: 'slow_function' | 'memory_leak' | 'high_cpu' | 'io_bottleneck';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  location?: string;
}

export interface AlertThresholds {
  cpuUsage?: number; // percentage
  memoryGrowthRate?: number; // bytes/second
  functionExecutionTime?: number; // milliseconds
  ioWaitTime?: number; // milliseconds
}

export interface HTMLReportOptions {
  includeCharts?: boolean;
  includeSourceCode?: boolean;
  includeRecommendations?: boolean;
  theme?: 'light' | 'dark';
}

export interface HTMLReportResult {
  filePath: string;
  size: number;
  generatedAt: number;
}

export interface JSONReportResult {
  data: ProfilingData;
  size: number;
  generatedAt: number;
}

export interface FlameGraphResult {
  svgData: string;
  totalSamples: number;
  generatedAt: number;
}