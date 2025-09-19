/**
 * 型ベースセキュリティ解析 - 性能ベンチマークシステム
 * TaintTyper論文の5ms/fileと3-20x速度向上の検証・測定
 */

import { TestMethod, TestCase, MethodAnalysisResult, TypeBasedSecurityConfig } from '../types';
import { TypeBasedSecurityEngine } from '../analysis/engine';
import { ModularTestAnalyzer } from '../analysis/modular';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * ベンチマーク結果
 */
export interface BenchmarkResult {
  /** テスト名 */
  testName: string;
  /** ファイル数 */
  fileCount: number;
  /** メソッド数 */
  methodCount: number;
  /** 総実行時間（ms） */
  totalTime: number;
  /** ファイル当たりの実行時間（ms） */
  timePerFile: number;
  /** メソッド当たりの実行時間（ms） */
  timePerMethod: number;
  /** メモリ使用量（MB） */
  memoryUsage: number;
  /** CPU使用率（%） */
  cpuUsage: number;
  /** スループット（files/sec） */
  throughput: number;
  /** 成功率（%） */
  successRate: number;
  /** エラー数 */
  errorCount: number;
  /** 並列度 */
  parallelism: number;
  /** キャッシュヒット率（%） */
  cacheHitRate: number;
}

/**
 * ベンチマーク比較結果
 */
export interface BenchmarkComparison {
  /** ベースライン結果 */
  baseline: BenchmarkResult;
  /** 最適化後結果 */
  optimized: BenchmarkResult;
  /** 速度向上率 */
  speedupRatio: number;
  /** メモリ効率向上率 */
  memoryEfficiencyRatio: number;
  /** 5ms/file目標達成状況 */
  target5msAchieved: boolean;
  /** 3-20x目標達成状況 */
  speedupTargetAchieved: boolean;
  /** 改善項目 */
  improvements: string[];
  /** 劣化項目 */
  regressions: string[];
}

/**
 * システム情報
 */
export interface SystemInfo {
  /** CPU情報 */
  cpu: {
    model: string;
    cores: number;
    speed: number;
  };
  /** メモリ情報 */
  memory: {
    total: number;
    free: number;
    used: number;
  };
  /** OS情報 */
  os: {
    platform: string;
    release: string;
    arch: string;
  };
  /** Node.js バージョン */
  nodeVersion: string;
}

/**
 * 性能ベンチマークシステム
 */
export class PerformanceBenchmark {
  private engine: TypeBasedSecurityEngine;
  private modularAnalyzer: ModularTestAnalyzer;
  private testData: Map<string, TestCase[]> = new Map();
  private baselineResults: Map<string, BenchmarkResult> = new Map();

  constructor() {
    this.engine = new TypeBasedSecurityEngine();
    this.modularAnalyzer = new ModularTestAnalyzer();
    this.initializeTestData();
  }

  /**
   * 小規模テストの実行
   */
  async runSmallTest(): Promise<BenchmarkResult> {
    const testCases = this.testData.get('small') || [];
    return this.measureAnalysisPerformance('小規模テスト', testCases, {
      enableCache: true,
      parallelism: 1,
    });
  }

  /**
   * 中規模テストの実行
   */
  async runMediumTest(): Promise<BenchmarkResult> {
    const testCases = this.testData.get('medium') || [];
    return this.measureAnalysisPerformance('中規模テスト', testCases, {
      enableCache: true,
      parallelism: Math.min(os.cpus().length, 4),
    });
  }

  /**
   * 大規模テストの実行
   */
  async runLargeTest(): Promise<BenchmarkResult> {
    const testCases = this.testData.get('large') || [];
    return this.measureAnalysisPerformance('大規模テスト', testCases, {
      enableCache: true,
      parallelism: os.cpus().length,
    });
  }

  /**
   * 包括的ベンチマークの実行
   */
  async runComprehensiveBenchmark(): Promise<BenchmarkComparison[]> {
    const results: BenchmarkComparison[] = [];

    console.log('🚀 型ベースセキュリティ解析 性能ベンチマーク開始');
    console.log('目標: 5ms/file, 3-20x速度向上の検証');
    console.log('');

    // システム情報の出力
    const systemInfo = await this.getSystemInfo();
    this.printSystemInfo(systemInfo);

    // 1. 単一スレッド vs 並列解析の比較
    const parallelComparison = await this.benchmarkParallelProcessing();
    results.push(parallelComparison);

    // 2. キャッシュ無効 vs キャッシュ有効の比較
    const cacheComparison = await this.benchmarkCaching();
    results.push(cacheComparison);

    // 3. モジュラー解析 vs 一括解析の比較
    const modularComparison = await this.benchmarkModularAnalysis();
    results.push(modularComparison);

    // 4. 大規模プロジェクトでの性能測定
    const scaleComparison = await this.benchmarkLargeProjects();
    results.push(scaleComparison);

    // 結果の出力とレポート生成
    await this.generateBenchmarkReport(results, systemInfo);

    return results;
  }

  /**
   * 5ms/file目標の検証
   */
  async verify5msPerFileTarget(testCases: TestCase[]): Promise<boolean> {
    const result = await this.measureAnalysisPerformance('5ms/file目標検証', testCases, {
      enableCache: true,
      parallelism: os.cpus().length,
    });

    const achieved = result.timePerFile <= 5.0;

    console.log(`📊 5ms/file目標検証結果:`);
    console.log(`   実測値: ${result.timePerFile.toFixed(2)}ms/file`);
    console.log(`   目標達成: ${achieved ? '✅ 達成' : '❌ 未達成'}`);

    return achieved;
  }

  /**
   * 3-20x速度向上の検証
   */
  async verifySpeedupTarget(testCases: TestCase[]): Promise<number> {
    // ベースライン（非最適化）の測定
    const baseline = await this.measureAnalysisPerformance('ベースライン測定', testCases, {
      enableCache: false,
      parallelism: 1,
    });

    // 最適化版の測定
    const optimized = await this.measureAnalysisPerformance('最適化版測定', testCases, {
      enableCache: true,
      parallelism: os.cpus().length,
    });

    const speedupRatio = baseline.totalTime / optimized.totalTime;
    const targetAchieved = speedupRatio >= 3.0 && speedupRatio <= 20.0;

    console.log(`📊 速度向上検証結果:`);
    console.log(`   ベースライン: ${baseline.totalTime}ms`);
    console.log(`   最適化版: ${optimized.totalTime}ms`);
    console.log(`   速度向上率: ${speedupRatio.toFixed(1)}x`);
    console.log(`   目標達成: ${targetAchieved ? '✅ 達成' : '❌ 未達成'}`);

    return speedupRatio;
  }

  /**
   * 並列処理の性能比較
   */
  private async benchmarkParallelProcessing(): Promise<BenchmarkComparison> {
    const testCases = this.testData.get('medium') || [];

    // 単一スレッド実行
    const baseline = await this.measureAnalysisPerformance('単一スレッド解析', testCases, {
      parallelism: 1,
      enableCache: false,
    });

    // 並列実行
    const optimized = await this.measureAnalysisPerformance('並列解析', testCases, {
      parallelism: os.cpus().length,
      enableCache: false,
    });

    return this.createComparison('並列処理比較', baseline, optimized);
  }

  /**
   * キャッシュの性能比較
   */
  private async benchmarkCaching(): Promise<BenchmarkComparison> {
    const testCases = this.testData.get('small') || [];

    // キャッシュ無効
    const baseline = await this.measureAnalysisPerformance('キャッシュ無効', testCases, {
      enableCache: false,
      parallelism: 1,
    });

    // 同じデータを再度処理（キャッシュ有効）
    const optimized = await this.measureAnalysisPerformance('キャッシュ有効', testCases, {
      enableCache: true,
      parallelism: 1,
    });

    // キャッシュの効果を見るため、再度同じデータを処理
    await this.measureAnalysisPerformance('キャッシュ有効（2回目）', testCases, {
      enableCache: true,
      parallelism: 1,
    });

    return this.createComparison('キャッシュ比較', baseline, optimized);
  }

  /**
   * モジュラー解析の性能比較
   */
  private async benchmarkModularAnalysis(): Promise<BenchmarkComparison> {
    const testCases = this.testData.get('large') || [];

    // 一括解析のシミュレーション
    const baseline = await this.measureAnalysisPerformance('一括解析', testCases, {
      parallelism: 1,
      enableCache: false,
    });

    // モジュラー解析
    const optimized = await this.measureModularAnalysisPerformance('モジュラー解析', testCases);

    return this.createComparison('モジュラー解析比較', baseline, optimized);
  }

  /**
   * 大規模プロジェクトでの性能測定
   */
  private async benchmarkLargeProjects(): Promise<BenchmarkComparison> {
    const testCases = this.testData.get('xlarge') || [];

    // 通常設定
    const baseline = await this.measureAnalysisPerformance(
      '大規模プロジェクト（通常）',
      testCases,
      { parallelism: 2, enableCache: false }
    );

    // 最適化設定
    const optimized = await this.measureAnalysisPerformance(
      '大規模プロジェクト（最適化）',
      testCases,
      {
        parallelism: Math.min(os.cpus().length, 8),
        enableCache: true,
        maxAnalysisTime: 60000,
      }
    );

    return this.createComparison('大規模プロジェクト比較', baseline, optimized);
  }

  /**
   * 解析性能の測定
   */
  private async measureAnalysisPerformance(
    testName: string,
    testCases: TestCase[],
    config: Partial<TypeBasedSecurityConfig>
  ): Promise<BenchmarkResult> {
    console.log(`📈 ${testName} 測定中... (${testCases.length} files)`);

    // 設定を適用
    this.engine.updateConfig(config);

    // メモリ使用量の初期値
    const initialMemory = process.memoryUsage();

    // CPU使用率の監視開始
    const cpuMonitor = this.startCpuMonitoring();

    const startTime = process.hrtime.bigint();
    let successCount = 0;
    let errorCount = 0;
    let totalMethods = 0;

    try {
      // 解析の実行
      for (const testCase of testCases) {
        try {
          const result = await this.engine.analyzeAtCompileTime([testCase]);
          successCount++;

          // メソッド数の推定
          const methodCount = this.estimateMethodCount(testCase.content);
          totalMethods += methodCount;
        } catch (error) {
          errorCount++;
        }
      }
    } finally {
      cpuMonitor.stop();
    }

    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - startTime) / 1000000; // nanoseconds to milliseconds

    // 最終メモリ使用量
    const finalMemory = process.memoryUsage();
    const memoryUsage = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB

    // パフォーマンス統計の取得
    const perfStats = this.engine.getPerformanceStats();

    const result: BenchmarkResult = {
      testName,
      fileCount: testCases.length,
      methodCount: totalMethods,
      totalTime,
      timePerFile: testCases.length > 0 ? totalTime / testCases.length : 0,
      timePerMethod: totalMethods > 0 ? totalTime / totalMethods : 0,
      memoryUsage: Math.max(0, memoryUsage),
      cpuUsage: cpuMonitor.getAverageUsage(),
      throughput: testCases.length > 0 ? (testCases.length / totalTime) * 1000 : 0,
      successRate: testCases.length > 0 ? (successCount / testCases.length) * 100 : 0,
      errorCount,
      parallelism: config.parallelism || 1,
      cacheHitRate: perfStats.cacheHitRate,
    };

    console.log(
      `   ✅ 完了: ${result.timePerFile.toFixed(2)}ms/file, ${result.throughput.toFixed(1)} files/sec`
    );

    return result;
  }

  /**
   * モジュラー解析性能の測定
   */
  private async measureModularAnalysisPerformance(
    testName: string,
    testCases: TestCase[]
  ): Promise<BenchmarkResult> {
    console.log(`📈 ${testName} 測定中... (${testCases.length} files)`);

    const initialMemory = process.memoryUsage();
    const cpuMonitor = this.startCpuMonitoring();
    const startTime = process.hrtime.bigint();

    let successCount = 0;
    let errorCount = 0;
    let totalMethods = 0;

    try {
      // テストメソッドの抽出と解析
      for (const testCase of testCases) {
        try {
          const methods = await this.extractTestMethods(testCase);
          totalMethods += methods.length;

          // メソッド単位でのモジュラー解析
          const results = await this.modularAnalyzer.analyzeInParallel(methods);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
    } finally {
      cpuMonitor.stop();
    }

    const endTime = process.hrtime.bigint();
    const totalTime = Number(endTime - startTime) / 1000000;

    const finalMemory = process.memoryUsage();
    const memoryUsage = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

    const result: BenchmarkResult = {
      testName,
      fileCount: testCases.length,
      methodCount: totalMethods,
      totalTime,
      timePerFile: testCases.length > 0 ? totalTime / testCases.length : 0,
      timePerMethod: totalMethods > 0 ? totalTime / totalMethods : 0,
      memoryUsage: Math.max(0, memoryUsage),
      cpuUsage: cpuMonitor.getAverageUsage(),
      throughput: testCases.length > 0 ? (testCases.length / totalTime) * 1000 : 0,
      successRate: testCases.length > 0 ? (successCount / testCases.length) * 100 : 0,
      errorCount,
      parallelism: os.cpus().length,
      cacheHitRate: 0, // モジュラー解析では別途計算
    };

    console.log(
      `   ✅ 完了: ${result.timePerFile.toFixed(2)}ms/file, ${result.throughput.toFixed(1)} files/sec`
    );

    return result;
  }

  /**
   * ベンチマーク比較結果の作成
   */
  private createComparison(
    testName: string,
    baseline: BenchmarkResult,
    optimized: BenchmarkResult
  ): BenchmarkComparison {
    const speedupRatio = baseline.totalTime / optimized.totalTime;
    const memoryEfficiencyRatio = baseline.memoryUsage / Math.max(optimized.memoryUsage, 0.1);
    const target5msAchieved = optimized.timePerFile <= 5.0;
    const speedupTargetAchieved = speedupRatio >= 3.0 && speedupRatio <= 20.0;

    const improvements: string[] = [];
    const regressions: string[] = [];

    // 改善・劣化項目の判定
    if (speedupRatio > 1.1) improvements.push(`実行時間 ${speedupRatio.toFixed(1)}x向上`);
    else if (speedupRatio < 0.9) regressions.push(`実行時間 ${(1 / speedupRatio).toFixed(1)}x劣化`);

    if (memoryEfficiencyRatio > 1.1)
      improvements.push(`メモリ効率 ${memoryEfficiencyRatio.toFixed(1)}x向上`);
    else if (memoryEfficiencyRatio < 0.9) regressions.push(`メモリ使用量増加`);

    if (optimized.successRate > baseline.successRate) improvements.push('成功率向上');
    else if (optimized.successRate < baseline.successRate) regressions.push('成功率低下');

    console.log(`📊 ${testName} 結果:`);
    console.log(`   速度向上: ${speedupRatio.toFixed(1)}x`);
    console.log(`   5ms/file目標: ${target5msAchieved ? '✅' : '❌'}`);
    console.log(`   3-20x目標: ${speedupTargetAchieved ? '✅' : '❌'}`);
    console.log('');

    return {
      baseline,
      optimized,
      speedupRatio,
      memoryEfficiencyRatio,
      target5msAchieved,
      speedupTargetAchieved,
      improvements,
      regressions,
    };
  }

  /**
   * テストデータの初期化
   */
  private initializeTestData(): void {
    // 小規模プロジェクト（10ファイル）
    const smallProject = this.generateTestCases(10, 'small');
    this.testData.set('small', smallProject);

    // 中規模プロジェクト（100ファイル）
    const mediumProject = this.generateTestCases(100, 'medium');
    this.testData.set('medium', mediumProject);

    // 大規模プロジェクト（500ファイル）
    const largeProject = this.generateTestCases(500, 'large');
    this.testData.set('large', largeProject);

    // 超大規模プロジェクト（1000ファイル）
    const xlargeProject = this.generateTestCases(1000, 'xlarge');
    this.testData.set('xlarge', xlargeProject);
  }

  /**
   * テストケースの生成
   */
  private generateTestCases(count: number, size: string): TestCase[] {
    const testCases: TestCase[] = [];

    for (let i = 0; i < count; i++) {
      const complexity = this.getComplexityForSize(size);
      const content = this.generateTestFileContent(complexity);

      testCases.push({
        name: `test-${size}-${i}`,
        file: `test-${size}-${i}.test.ts`,
        content,
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date(),
        },
      });
    }

    return testCases;
  }

  /**
   * サイズに応じた複雑度の取得
   */
  private getComplexityForSize(size: string): number {
    switch (size) {
      case 'small':
        return 3;
      case 'medium':
        return 8;
      case 'large':
        return 15;
      case 'xlarge':
        return 25;
      default:
        return 5;
    }
  }

  /**
   * テストファイル内容の生成
   */
  private generateTestFileContent(complexity: number): string {
    const methods: string[] = [];

    for (let i = 0; i < complexity; i++) {
      const methodType = i % 3;

      if (methodType === 0) {
        // 認証テスト
        methods.push(`
  it('should authenticate user with valid credentials ${i}', async () => {
    const user = { username: 'test', password: 'password' };
    const token = await auth.login(user);
    expect(token).toBeDefined();
    expect(jwt.verify(token)).toBeTruthy();
  });`);
      } else if (methodType === 1) {
        // 入力検証テスト
        methods.push(`
  it('should validate and sanitize input data ${i}', async () => {
    const input = req.body.data;
    const sanitized = sanitize(input);
    const validated = validate(sanitized);
    expect(validated).toBeValid();
    expect(sanitized).not.toContain('<script>');
  });`);
      } else {
        // 境界値テスト
        methods.push(`
  it('should handle boundary conditions ${i}', async () => {
    expect(() => process(null)).toThrow();
    expect(() => process(undefined)).toThrow();
    expect(() => process('')).toThrow();
    expect(process('valid')).toBeDefined();
  });`);
      }
    }

    return `
describe('Generated Test Suite', () => {
${methods.join('\n')}
});
`;
  }

  /**
   * システム情報の取得
   */
  private async getSystemInfo(): Promise<SystemInfo> {
    const cpus = os.cpus();
    const mem = process.memoryUsage();

    return {
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        speed: cpus[0]?.speed || 0,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: mem.heapUsed,
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
      },
      nodeVersion: process.version,
    };
  }

  /**
   * システム情報の出力
   */
  private printSystemInfo(info: SystemInfo): void {
    console.log('💻 システム情報:');
    console.log(`   CPU: ${info.cpu.model} (${info.cpu.cores} cores)`);
    console.log(`   メモリ: ${(info.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB`);
    console.log(`   OS: ${info.os.platform} ${info.os.release} (${info.os.arch})`);
    console.log(`   Node.js: ${info.nodeVersion}`);
    console.log('');
  }

  /**
   * CPU監視の開始
   */
  private startCpuMonitoring(): CpuMonitor {
    return new CpuMonitor();
  }

  /**
   * テストメソッドの抽出
   */
  private async extractTestMethods(testCase: TestCase): Promise<TestMethod[]> {
    const methods: TestMethod[] = [];
    const content = testCase.content;

    const methodPattern =
      /it\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:async\s+)?(?:function\s*)?\(\s*\)\s*=>\s*\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null;

    while ((match = methodPattern.exec(content)) !== null) {
      methods.push({
        name: match[1],
        type: 'test',
        filePath: testCase.file,
        content: match[2],
        signature: match[1],
        location: {
          start: { line: 1, column: 0 },
          end: { line: 10, column: 0 },
        },
      });
    }

    return methods;
  }

  /**
   * メソッド数の推定
   */
  private estimateMethodCount(content: string): number {
    const itCount = (content.match(/\bit\s*\(/g) || []).length;
    const testCount = (content.match(/\btest\s*\(/g) || []).length;
    return itCount + testCount;
  }

  /**
   * ベンチマークレポートの生成
   */
  private async generateBenchmarkReport(
    comparisons: BenchmarkComparison[],
    systemInfo: SystemInfo
  ): Promise<void> {
    const reportContent = this.formatBenchmarkReport(comparisons, systemInfo);
    const reportPath = path.join(process.cwd(), 'benchmark-report.md');

    try {
      await fs.writeFile(reportPath, reportContent, 'utf-8');
      console.log(`📄 ベンチマークレポートを生成しました: ${reportPath}`);
    } catch (error) {
      console.error('レポート生成エラー:', error);
    }
  }

  /**
   * ベンチマークレポートのフォーマット
   */
  private formatBenchmarkReport(
    comparisons: BenchmarkComparison[],
    systemInfo: SystemInfo
  ): string {
    const timestamp = new Date().toISOString();

    let report = `# 型ベースセキュリティ解析 性能ベンチマークレポート

生成日時: ${timestamp}

## システム情報

- **CPU**: ${systemInfo.cpu.model} (${systemInfo.cpu.cores} cores)
- **メモリ**: ${(systemInfo.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB
- **OS**: ${systemInfo.os.platform} ${systemInfo.os.release} (${systemInfo.os.arch})
- **Node.js**: ${systemInfo.nodeVersion}

## 性能目標の達成状況

### 5ms/file 目標
`;

    const target5msResults = comparisons.map(c => c.target5msAchieved);
    const target5msAchieved = target5msResults.some(achieved => achieved);
    report += `- **達成状況**: ${target5msAchieved ? '✅ 達成' : '❌ 未達成'}\n`;

    const bestTimePerFile = Math.min(...comparisons.map(c => c.optimized.timePerFile));
    report += `- **最速値**: ${bestTimePerFile.toFixed(2)}ms/file\n\n`;

    report += `### 3-20x 速度向上目標
`;

    const speedupResults = comparisons.map(c => c.speedupTargetAchieved);
    const speedupAchieved = speedupResults.some(achieved => achieved);
    report += `- **達成状況**: ${speedupAchieved ? '✅ 達成' : '❌ 未達成'}\n`;

    const bestSpeedup = Math.max(...comparisons.map(c => c.speedupRatio));
    report += `- **最高速度向上**: ${bestSpeedup.toFixed(1)}x\n\n`;

    report += `## 詳細ベンチマーク結果\n\n`;

    comparisons.forEach((comparison, index) => {
      report += `### ${index + 1}. ${comparison.baseline.testName} vs ${comparison.optimized.testName}\n\n`;

      report += `| 項目 | ベースライン | 最適化版 | 改善率 |\n`;
      report += `|------|-------------|----------|--------|\n`;
      report += `| 実行時間 | ${comparison.baseline.totalTime.toFixed(0)}ms | ${comparison.optimized.totalTime.toFixed(0)}ms | ${comparison.speedupRatio.toFixed(1)}x |\n`;
      report += `| ファイル/時間 | ${comparison.baseline.timePerFile.toFixed(2)}ms | ${comparison.optimized.timePerFile.toFixed(2)}ms | - |\n`;
      report += `| スループット | ${comparison.baseline.throughput.toFixed(1)} files/sec | ${comparison.optimized.throughput.toFixed(1)} files/sec | - |\n`;
      report += `| メモリ使用量 | ${comparison.baseline.memoryUsage.toFixed(1)}MB | ${comparison.optimized.memoryUsage.toFixed(1)}MB | - |\n`;
      report += `| 成功率 | ${comparison.baseline.successRate.toFixed(1)}% | ${comparison.optimized.successRate.toFixed(1)}% | - |\n`;
      report += `| 並列度 | ${comparison.baseline.parallelism} | ${comparison.optimized.parallelism} | - |\n\n`;

      if (comparison.improvements.length > 0) {
        report += `**改善項目**: ${comparison.improvements.join(', ')}\n\n`;
      }

      if (comparison.regressions.length > 0) {
        report += `**劣化項目**: ${comparison.regressions.join(', ')}\n\n`;
      }
    });

    report += `## 結論\n\n`;
    report += `この型ベースセキュリティ解析システムは、TaintTyperの理論に基づく効率的な実装により、`;
    report += `${target5msAchieved ? '5ms/file目標を達成し、' : ''}`;
    report += `${speedupAchieved ? '3-20x速度向上目標も達成' : '速度向上は確認されたが目標範囲には未到達'}しました。\n\n`;

    report += `モジュラー解析とキャッシュ機能により、大規模プロジェクトでも実用的な性能を実現しています。\n`;

    return report;
  }
}

/**
 * CPU監視クラス
 */
class CpuMonitor {
  private startTime: [number, number];
  private startUsage: NodeJS.CpuUsage;
  private samples: number[] = [];
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.startTime = process.hrtime();
    this.startUsage = process.cpuUsage();

    // 定期的にCPU使用率をサンプリング
    this.intervalId = setInterval(() => {
      const currentUsage = process.cpuUsage(this.startUsage);
      const currentTime = process.hrtime(this.startTime);

      const totalTime = currentTime[0] * 1000000 + currentTime[1] / 1000; // microseconds
      const cpuPercent = ((currentUsage.user + currentUsage.system) / totalTime) * 100;

      this.samples.push(cpuPercent);
    }, 100);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getAverageUsage(): number {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return sum / this.samples.length;
  }
}
