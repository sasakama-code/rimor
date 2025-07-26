/**
 * 型ベースセキュリティ解析 - ベンチマークシステムエクスポート
 * v0.7.0: TaintTyper論文の5ms/fileと3-20x速度向上の検証システム
 */

// メインクラスのエクスポート
export { PerformanceBenchmark } from './PerformanceBenchmark';
export { BenchmarkRunner } from './BenchmarkRunner';

// インターフェースのエクスポート
export type {
  BenchmarkResult,
  BenchmarkComparison,
  SystemInfo
} from './PerformanceBenchmark';

export type {
  BenchmarkConfig,
  BenchmarkHistory,
  RegressionDetectionResult,
  PerformanceRegression,
  PerformanceImprovement,
  PerformanceTrendAnalysis
} from './BenchmarkRunner';

/**
 * ベンチマーク実行のヘルパー関数
 */
export async function runQuickPerformanceCheck(): Promise<boolean> {
  const { BenchmarkRunner } = await import('./BenchmarkRunner');
  const runner = new BenchmarkRunner({
    testSizes: ['small'],
    iterations: 1,
    verbose: false
  });
  
  const result = await runner.runQuickBenchmark();
  return result.overallAssessment !== 'critical';
}

/**
 * CI環境向けベンチマーク実行
 */
export async function runCiBenchmark(): Promise<void> {
  const { BenchmarkRunner } = await import('./BenchmarkRunner');
  const runner = new BenchmarkRunner({
    isCiEnvironment: true,
    testSizes: ['small', 'medium'],
    iterations: 2,
    outputDir: './ci-benchmark-results'
  });
  
  await runner.runFullBenchmarkSuite();
}

/**
 * 性能目標検証
 */
export async function verifyTargets(): Promise<{
  target5ms: boolean;
  speedupTarget: boolean;
  summary: string;
}> {
  const { BenchmarkRunner } = await import('./BenchmarkRunner');
  const runner = new BenchmarkRunner();
  const result = await runner.verifyPerformanceTargets();
  
  const summary = `5ms/file: ${result.target5ms ? '✅' : '❌'}, 速度向上: ${result.speedupTarget ? '✅' : '❌'}`;
  
  return {
    target5ms: result.target5ms,
    speedupTarget: result.speedupTarget,
    summary
  };
}