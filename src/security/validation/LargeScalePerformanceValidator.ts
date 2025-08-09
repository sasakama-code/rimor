/**
 * 大規模プロジェクト性能測定・検証システム
 * TaintTyper実装の実世界での性能目標達成度を検証
 */

import {
  TestCase,
  TypeBasedSecurityConfig,
  MethodAnalysisResult,
  SecurityIssue
} from '../types';
import { TypeBasedSecurityEngine } from '../analysis/engine';
import { PerformanceBenchmark } from '../benchmarks/PerformanceBenchmark';
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * システム情報の型定義
 */
interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
  };
  memory: {
    total: number;
  };
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;
  nodeVersion: string;
  platform: string;
  osVersion: string;
}

/**
 * スケーラビリティデータポイント
 */
interface ScalabilityDataPoint {
  fileCount: number;
  totalTime: number;
  memoryUsed: number;
  throughput: number;
  executionTime: number;
  timePerFile: number;
  memoryUsage: number;
}

/**
 * 処理済み解析結果
 */
interface ProcessedAnalysisResult {
  issueCount: number;
  issueTypeDistribution: Map<string, number>;
  criticalIssues: number;
  highPriorityIssues: number;
  totalIssues: number;
  issuesPerFile: number;
}

/**
 * スケーラビリティ分析結果
 */
interface ScalabilityAnalysis {
  complexity: string;
  timeComplexity: string;
  spaceComplexity: string;
  regressionCoefficient: number;
  scalabilityScore: number;
  recommendedMaxFiles: number;
}

/**
 * 大規模プロジェクト設定
 */
export interface LargeScaleProjectConfig {
  /** プロジェクト名 */
  name: string;
  /** ファイル数の規模 */
  fileCount: number;
  /** テストメソッド数の規模 */
  methodCount: number;
  /** 平均ファイルサイズ（行数） */
  averageFileSize: number;
  /** 複雑度レベル */
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  /** フレームワーク */
  frameworks: ('express' | 'react' | 'nestjs' | 'nextjs')[];
}

/**
 * 性能測定結果
 */
export interface PerformanceResult {
  /** プロジェクト設定 */
  config: LargeScaleProjectConfig;
  /** 実行時間メトリクス */
  timing: {
    /** 総実行時間（ms） */
    totalTime: number;
    /** ファイルあたり平均時間（ms） */
    timePerFile: number;
    /** メソッドあたり平均時間（ms） */
    timePerMethod: number;
    /** セットアップ時間（ms） */
    setupTime: number;
    /** 解析時間（ms） */
    analysisTime: number;
    /** 後処理時間（ms） */
    teardownTime: number;
  };
  /** メモリ使用量メトリクス */
  memory: {
    /** 初期メモリ使用量（MB） */
    initialMemory: number;
    /** ピークメモリ使用量（MB） */
    peakMemory: number;
    /** 最終メモリ使用量（MB） */
    finalMemory: number;
    /** メモリ効率（MB/file） */
    memoryPerFile: number;
  };
  /** スループット メトリクス */
  throughput: {
    /** ファイル処理速度（files/sec） */
    filesPerSecond: number;
    /** メソッド処理速度（methods/sec） */
    methodsPerSecond: number;
    /** 問題検出速度（issues/sec） */
    issuesPerSecond: number;
  };
  /** 並列処理効率 */
  parallelism: {
    /** 使用CPU数 */
    coreCount: number;
    /** 並列度 */
    parallelism: number;
    /** CPU使用率 */
    cpuUtilization: number;
    /** 並列効率（理想値=1.0） */
    parallelEfficiency: number;
  };
  /** 目標達成度 */
  targetAchievement: {
    /** 5ms/file目標達成 */
    fiveMsTarget: boolean;
    /** 3-20x高速化達成 */
    speedupTarget: boolean;
    /** 実際の高速化倍率 */
    actualSpeedup: number;
  };
  /** 検出結果 */
  analysisResults: {
    /** 総検出問題数 */
    totalIssues: number;
    /** ファイルあたり平均問題数 */
    issuesPerFile: number;
    /** 問題種別分布 */
    issueTypeDistribution: Map<string, number>;
  };
}

/**
 * スケーラビリティテスト結果
 */
export interface ScalabilityTestResult {
  /** テスト条件 */
  testConditions: {
    /** 最小ファイル数 */
    minFiles: number;
    /** 最大ファイル数 */
    maxFiles: number;
    /** ステップ数 */
    steps: number;
  };
  /** スケーラビリティデータ */
  scalabilityData: {
    /** ファイル数 */
    fileCount: number;
    /** 実行時間（ms） */
    executionTime: number;
    /** ファイルあたり時間（ms） */
    timePerFile: number;
    /** メモリ使用量（MB） */
    memoryUsage: number;
  }[];
  /** スケーラビリティ分析 */
  analysis: {
    /** 時間計算量（O記法） */
    timeComplexity: string;
    /** 空間計算量（O記法） */
    spaceComplexity: string;
    /** スケーラビリティスコア（1-10） */
    scalabilityScore: number;
    /** 推奨最大ファイル数 */
    recommendedMaxFiles: number;
  };
}

/**
 * 大規模プロジェクト性能測定・検証システム
 */
export class LargeScalePerformanceValidator {
  private securityEngine: TypeBasedSecurityEngine;
  private benchmark: PerformanceBenchmark;
  private systemInfo: SystemInfo;

  constructor() {
    this.securityEngine = new TypeBasedSecurityEngine({
      strictness: 'moderate',
      enableCache: true,
      parallelism: Math.max(1, Math.floor(os.cpus().length * 0.8))
    });
    this.benchmark = new PerformanceBenchmark();
    this.systemInfo = this.collectSystemInfo();
  }

  /**
   * 大規模プロジェクトの性能測定を実行
   */
  async measureLargeScalePerformance(
    configs: LargeScaleProjectConfig[]
  ): Promise<PerformanceResult[]> {
    console.log('🚀 大規模プロジェクト性能測定開始');
    console.log(`システム情報: ${this.systemInfo.cpu.model}, ${this.systemInfo.memory.total}GB RAM`);
    console.log(`測定対象: ${configs.length}プロジェクト設定`);
    console.log('');

    const results: PerformanceResult[] = [];

    for (const config of configs) {
      console.log(`📊 ${config.name} 測定中...`);
      console.log(`   規模: ${config.fileCount}ファイル, ${config.methodCount}メソッド`);
      console.log(`   複雑度: ${config.complexity}, フレームワーク: ${config.frameworks.join(', ')}`);

      try {
        const result = await this.measureSingleProject(config);
        results.push(result);

        // 結果サマリーの表示
        console.log(`   ✅ 完了: ${result.timing.timePerFile.toFixed(2)}ms/file, メモリ${result.memory.peakMemory.toFixed(1)}MB`);
        console.log(`   目標達成: 5ms/file${result.targetAchievement.fiveMsTarget ? '✅' : '❌'}, 高速化${result.targetAchievement.actualSpeedup.toFixed(1)}x${result.targetAchievement.speedupTarget ? '✅' : '❌'}`);

      } catch (error) {
        console.error(`   ❌ ${config.name} 測定エラー:`, error);
      }

      console.log('');
    }

    // 全体サマリーの表示
    this.displayOverallSummary(results);

    return results;
  }

  /**
   * スケーラビリティテストを実行
   */
  async runScalabilityTest(
    baseConfig: LargeScaleProjectConfig,
    minFiles: number = 100,
    maxFiles: number = 2000,
    steps: number = 10
  ): Promise<ScalabilityTestResult> {
    console.log('📈 スケーラビリティテスト開始');
    console.log(`ファイル数範囲: ${minFiles} - ${maxFiles}ファイル, ${steps}ステップ`);
    console.log('');

    const scalabilityData: ScalabilityDataPoint[] = [];
    const fileStep = Math.floor((maxFiles - minFiles) / steps);

    for (let i = 0; i <= steps; i++) {
      const fileCount = minFiles + (i * fileStep);
      
      console.log(`🔍 ${fileCount}ファイル測定中...`);

      const testConfig: LargeScaleProjectConfig = {
        ...baseConfig,
        name: `${baseConfig.name}_${fileCount}files`,
        fileCount,
        methodCount: Math.floor(fileCount * 2.5) // ファイルあたり平均2.5メソッド
      };

      const startTime = Date.now();
      const initialMemory = this.getMemoryUsage();

      try {
        await this.measureSingleProject(testConfig);
        
        const executionTime = Date.now() - startTime;
        const finalMemory = this.getMemoryUsage();
        const timePerFile = executionTime / fileCount;

        scalabilityData.push({
          fileCount,
          totalTime: executionTime,
          memoryUsed: finalMemory - initialMemory,
          throughput: fileCount / (executionTime / 1000),
          executionTime,
          timePerFile,
          memoryUsage: finalMemory - initialMemory
        });

        console.log(`   完了: ${timePerFile.toFixed(2)}ms/file, ${((finalMemory - initialMemory) / 1024 / 1024).toFixed(1)}MB追加`);

      } catch (error) {
        console.error(`   エラー: ${fileCount}ファイル測定失敗:`, error);
        // エラーがあっても継続
        scalabilityData.push({
          fileCount,
          totalTime: 0,
          memoryUsed: 0,
          throughput: 0,
          executionTime: 0,
          timePerFile: 0,
          memoryUsage: 0
        });
      }
    }

    // スケーラビリティ分析
    const analysis = this.analyzeScalability(scalabilityData);

    const result: ScalabilityTestResult = {
      testConditions: { minFiles, maxFiles, steps },
      scalabilityData,
      analysis
    };

    // 結果の表示
    this.displayScalabilityResults(result);

    return result;
  }

  /**
   * エンタープライズ規模での検証
   */
  async validateEnterpriseScale(): Promise<PerformanceResult> {
    console.log('🏢 エンタープライズ規模検証開始');
    console.log('対象: 5000ファイル, 12500メソッド, 複雑な依存関係');
    console.log('');

    const enterpriseConfig: LargeScaleProjectConfig = {
      name: 'Enterprise Scale Validation',
      fileCount: 5000,
      methodCount: 12500,
      averageFileSize: 150,
      complexity: 'enterprise',
      frameworks: ['express', 'react', 'nestjs', 'nextjs']
    };

    const result = await this.measureSingleProject(enterpriseConfig);

    console.log('🎯 エンタープライズ規模検証結果:');
    console.log(`   総実行時間: ${(result.timing.totalTime / 1000).toFixed(1)}秒`);
    console.log(`   ファイルあたり時間: ${result.timing.timePerFile.toFixed(2)}ms (目標5ms以下)`);
    console.log(`   ピークメモリ: ${result.memory.peakMemory.toFixed(1)}MB`);
    console.log(`   スループット: ${result.throughput.filesPerSecond.toFixed(1)} files/sec`);
    console.log(`   並列効率: ${(result.parallelism.parallelEfficiency * 100).toFixed(1)}%`);
    console.log(`   検出問題数: ${result.analysisResults.totalIssues}件`);

    const success = result.targetAchievement.fiveMsTarget && result.memory.peakMemory < 2000;
    console.log(`   🏆 エンタープライズ対応: ${success ? '✅ 達成' : '❌ 要改善'}`);

    return result;
  }

  /**
   * 単一プロジェクトの性能測定
   */
  private async measureSingleProject(config: LargeScaleProjectConfig): Promise<PerformanceResult> {
    const startTime = Date.now();
    const initialMemory = this.getMemoryUsage();

    // Step 1: テストケース生成
    const setupStartTime = Date.now();
    const testCases = await this.generateLargeScaleTestCases(config);
    const setupTime = Date.now() - setupStartTime;

    let peakMemory = this.getMemoryUsage();

    // Step 2: 解析実行
    const analysisStartTime = Date.now();
    const analysisResult = await this.securityEngine.analyzeAtCompileTime(testCases);
    const analysisTime = Date.now() - analysisStartTime;

    peakMemory = Math.max(peakMemory, this.getMemoryUsage());

    // Step 3: 後処理
    const teardownStartTime = Date.now();
    const analysisResults = this.processAnalysisResults(analysisResult);
    const teardownTime = Date.now() - teardownStartTime;

    const finalMemory = this.getMemoryUsage();
    const totalTime = Date.now() - startTime;

    // 基準値との比較（従来手法を5ms/fileと仮定）
    const baselineTimePerFile = 5.0;
    const actualTimePerFile = totalTime / config.fileCount;
    const speedup = baselineTimePerFile / actualTimePerFile;

    const result: PerformanceResult = {
      config,
      timing: {
        totalTime,
        timePerFile: actualTimePerFile,
        timePerMethod: totalTime / config.methodCount,
        setupTime,
        analysisTime,
        teardownTime
      },
      memory: {
        initialMemory: initialMemory / 1024 / 1024, // MB
        peakMemory: peakMemory / 1024 / 1024, // MB
        finalMemory: finalMemory / 1024 / 1024, // MB
        memoryPerFile: (peakMemory - initialMemory) / 1024 / 1024 / config.fileCount
      },
      throughput: {
        filesPerSecond: config.fileCount / (totalTime / 1000),
        methodsPerSecond: config.methodCount / (totalTime / 1000),
        issuesPerSecond: analysisResults.totalIssues / (totalTime / 1000)
      },
      parallelism: {
        coreCount: os.cpus().length,
        parallelism: this.securityEngine['config']?.parallelism || 1,
        cpuUtilization: 0.8, // 推定値
        parallelEfficiency: Math.min(1.0, speedup / this.securityEngine['config']?.parallelism || 1)
      },
      targetAchievement: {
        fiveMsTarget: actualTimePerFile <= 5.0,
        speedupTarget: speedup >= 3.0 && speedup <= 20.0,
        actualSpeedup: speedup
      },
      analysisResults: {
        totalIssues: analysisResults.totalIssues,
        issuesPerFile: analysisResults.issuesPerFile,
        issueTypeDistribution: analysisResults.issueTypeDistribution
      }
    };

    return result;
  }

  /**
   * 大規模テストケースの生成
   */
  private async generateLargeScaleTestCases(config: LargeScaleProjectConfig): Promise<TestCase[]> {
    const testCases: TestCase[] = [];
    const methodsPerFile = Math.ceil(config.methodCount / config.fileCount);

    for (let fileIndex = 0; fileIndex < config.fileCount; fileIndex++) {
      const framework = config.frameworks[fileIndex % config.frameworks.length];
      const testCase = this.generateTestCase(fileIndex, framework, methodsPerFile, config);
      testCases.push(testCase);
    }

    return testCases;
  }

  /**
   * 個別テストケースの生成
   */
  private generateTestCase(
    fileIndex: number,
    framework: string,
    methodsPerFile: number,
    config: LargeScaleProjectConfig
  ): TestCase {
    const fileName = `test_${framework}_${fileIndex.toString().padStart(4, '0')}.test.ts`;
    const content = this.generateTestContent(framework, methodsPerFile, config);

    return {
      name: `Test_${framework}_${fileIndex}`,
      file: `/large-scale-test/${fileName}`,
      content,
      metadata: {
        framework: framework as any,
        language: 'typescript',
        lastModified: new Date()
      }
    };
  }

  /**
   * テスト内容の生成
   */
  private generateTestContent(
    framework: string,
    methodCount: number,
    config: LargeScaleProjectConfig
  ): string {
    let content = `describe('${framework} Large Scale Tests', () => {\n`;

    for (let methodIndex = 0; methodIndex < methodCount; methodIndex++) {
      const complexity = this.getComplexityLevel(config.complexity, methodIndex);
      content += this.generateMethodContent(framework, methodIndex, complexity);
    }

    content += '});';
    return content;
  }

  /**
   * メソッド内容の生成
   */
  private generateMethodContent(framework: string, methodIndex: number, complexity: string): string {
    const methodName = `method_${methodIndex}`;
    
    switch (framework) {
      case 'express':
        return this.generateExpressMethod(methodName, complexity);
      case 'react':
        return this.generateReactMethod(methodName, complexity);
      case 'nestjs':
        return this.generateNestJSMethod(methodName, complexity);
      default:
        return this.generateGenericMethod(methodName, complexity);
    }
  }

  /**
   * Express.js用メソッド生成
   */
  private generateExpressMethod(methodName: string, complexity: string): string {
    const baseTemplate = `
  it('${methodName} - Express security test', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const userInput = req.body.data;
    `;

    switch (complexity) {
      case 'simple':
        return baseTemplate + `
    expect(userInput).toBeDefined();
    const result = processData(userInput);
    expect(result).toBeTruthy();
  });
`;
      case 'moderate':
        return baseTemplate + `
    const sanitized = sanitizeInput(userInput);
    const validated = validateInput(sanitized);
    expect(validated).toBeTruthy();
    const query = buildQuery(validated);
    const result = await database.execute(query);
    expect(result).toBeDefined();
  });
`;
      case 'complex':
        return baseTemplate + `
    if (!isValidInput(userInput)) {
      throw new ValidationError('Invalid input');
    }
    const sanitized = sanitizeInput(userInput);
    const encrypted = encrypt(sanitized);
    const signed = signData(encrypted);
    const stored = await secureStorage.store(signed);
    expect(stored.id).toBeDefined();
    const retrieved = await secureStorage.retrieve(stored.id);
    const verified = verifySignature(retrieved);
    expect(verified).toBe(true);
  });
`;
      default:
        return baseTemplate + `
    expect(userInput).toBeDefined();
  });
`;
    }
  }

  /**
   * React用メソッド生成
   */
  private generateReactMethod(methodName: string, complexity: string): string {
    const baseTemplate = `
  it('${methodName} - React security test', () => {
    const userInput = '<script>alert("xss")</script>';
    `;

    switch (complexity) {
      case 'simple':
        return baseTemplate + `
    const sanitized = sanitizeHtml(userInput);
    expect(sanitized).not.toContain('<script>');
  });
`;
      case 'moderate':
        return baseTemplate + `
    const component = render(<UserProfile userInput={userInput} />);
    const sanitizedContent = component.getByTestId('content');
    expect(sanitizedContent.innerHTML).not.toContain('<script>');
    expect(sanitizedContent.innerHTML).not.toContain('onerror=');
  });
`;
      case 'complex':
        return baseTemplate + `
    const formData = { comment: userInput, metadata: { source: 'user' } };
    const validatedData = validateFormData(formData);
    const sanitizedData = sanitizeFormData(validatedData);
    const component = render(<CommentForm initialData={sanitizedData} />);
    const form = component.getByRole('form');
    fireEvent.submit(form);
    expect(component.queryByText('Error')).toBeNull();
  });
`;
      default:
        return baseTemplate + `
    expect(userInput).toBeDefined();
  });
`;
    }
  }

  /**
   * NestJS用メソッド生成
   */
  private generateNestJSMethod(methodName: string, complexity: string): string {
    const baseTemplate = `
  it('${methodName} - NestJS security test', async () => {
    const mockRequest = { body: { data: 'test data' }, user: { id: 1 } };
    `;

    switch (complexity) {
      case 'simple':
        return baseTemplate + `
    const guard = new AuthGuard();
    const canActivate = await guard.canActivate(mockContext(mockRequest));
    expect(canActivate).toBe(true);
  });
`;
      case 'moderate':
        return baseTemplate + `
    const dto = plainToClass(CreateUserDto, mockRequest.body);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    const service = new UserService();
    const result = await service.create(dto);
    expect(result.id).toBeDefined();
  });
`;
      case 'complex':
        return baseTemplate + `
    const authGuard = new JwtAuthGuard();
    const rolesGuard = new RolesGuard();
    const context = mockExecutionContext(mockRequest);
    const authResult = await authGuard.canActivate(context);
    expect(authResult).toBe(true);
    const rolesResult = await rolesGuard.canActivate(context);
    expect(rolesResult).toBe(true);
    const dto = plainToClass(ComplexDto, mockRequest.body);
    const validationErrors = await validate(dto, { whitelist: true });
    expect(validationErrors).toHaveLength(0);
    const sanitized = sanitizeDto(dto);
    const service = new ComplexService();
    const result = await service.complexOperation(sanitized);
    expect(result.success).toBe(true);
  });
`;
      default:
        return baseTemplate + `
    expect(mockRequest).toBeDefined();
  });
`;
    }
  }

  /**
   * 汎用メソッド生成
   */
  private generateGenericMethod(methodName: string, complexity: string): string {
    return `
  it('${methodName} - Generic security test', () => {
    const data = 'test data';
    expect(data).toBeDefined();
  });
`;
  }

  /**
   * 複雑度レベルの決定
   */
  private getComplexityLevel(baseComplexity: string, methodIndex: number): string {
    switch (baseComplexity) {
      case 'simple':
        return 'simple';
      case 'moderate':
        return methodIndex % 3 === 0 ? 'moderate' : 'simple';
      case 'complex':
        return methodIndex % 4 === 0 ? 'complex' : (methodIndex % 2 === 0 ? 'moderate' : 'simple');
      case 'enterprise':
        const rand = methodIndex % 10;
        if (rand < 2) return 'complex';
        if (rand < 6) return 'moderate';
        return 'simple';
      default:
        return 'simple';
    }
  }

  /**
   * 解析結果の処理
   */
  private processAnalysisResults(analysisResult: {issues?: SecurityIssue[]}): ProcessedAnalysisResult {
    const issues = analysisResult.issues || [];
    const issueTypeDistribution = new Map<string, number>();

    issues.forEach((issue: SecurityIssue) => {
      const count = issueTypeDistribution.get(issue.type) || 0;
      issueTypeDistribution.set(issue.type, count + 1);
    });

    return {
      issueCount: issues.length,
      criticalIssues: issues.filter((i: SecurityIssue) => i.severity === 'critical').length,
      highPriorityIssues: issues.filter((i: SecurityIssue) => i.severity === 'high').length,
      totalIssues: issues.length,
      issuesPerFile: 0, // 後で計算
      issueTypeDistribution
    };
  }

  /**
   * スケーラビリティ分析
   */
  private analyzeScalability(data: ScalabilityDataPoint[]): ScalabilityAnalysis {
    if (data.length < 3) {
      return {
        complexity: 'unknown',
        timeComplexity: 'O(?)',
        spaceComplexity: 'O(?)',
        regressionCoefficient: 0,
        scalabilityScore: 5,
        recommendedMaxFiles: 1000
      };
    }

    // 時間計算量の分析（簡易版）
    const timeGrowthRates = [];
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      if (prev.fileCount > 0 && curr.fileCount > 0) {
        const fileRatio = curr.fileCount / prev.fileCount;
        const timeRatio = (curr.executionTime || curr.totalTime) / (prev.executionTime || prev.totalTime);
        timeGrowthRates.push(timeRatio / fileRatio);
      }
    }

    const avgGrowthRate = timeGrowthRates.reduce((sum, rate) => sum + rate, 0) / timeGrowthRates.length;
    
    let timeComplexity: string;
    let scalabilityScore: number;

    if (avgGrowthRate < 1.2) {
      timeComplexity = 'O(n)';
      scalabilityScore = 9;
    } else if (avgGrowthRate < 1.5) {
      timeComplexity = 'O(n log n)';
      scalabilityScore = 7;
    } else if (avgGrowthRate < 2.0) {
      timeComplexity = 'O(n^1.5)';
      scalabilityScore = 5;
    } else {
      timeComplexity = 'O(n^2)';
      scalabilityScore = 3;
    }

    const recommendedMaxFiles = Math.floor(10000 / Math.max(1, avgGrowthRate));

    return {
      complexity: timeComplexity,
      timeComplexity,
      spaceComplexity: 'O(n)', // 簡略化
      regressionCoefficient: avgGrowthRate,
      scalabilityScore,
      recommendedMaxFiles
    };
  }

  /**
   * システム情報の収集
   */
  private collectSystemInfo(): SystemInfo {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const totalMemoryGB = Math.round(totalMemory / 1024 / 1024 / 1024);

    return {
      cpu: {
        model: cpus[0].model,
        cores: cpus.length
      },
      memory: {
        total: totalMemoryGB
      },
      cpuModel: cpus[0].model,
      cpuCores: cpus.length,
      totalMemory: totalMemoryGB,
      nodeVersion: process.version,
      platform: os.platform(),
      osVersion: os.release()
    };
  }

  /**
   * メモリ使用量の取得
   */
  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }

  /**
   * 全体サマリーの表示
   */
  private displayOverallSummary(results: PerformanceResult[]): void {
    console.log('📊 大規模プロジェクト性能測定 全体サマリー');
    console.log('='.repeat(50));
    
    const avgTimePerFile = results.reduce((sum, r) => sum + r.timing.timePerFile, 0) / results.length;
    const avgSpeedup = results.reduce((sum, r) => sum + r.targetAchievement.actualSpeedup, 0) / results.length;
    const fiveMsTargetAchieved = results.filter(r => r.targetAchievement.fiveMsTarget).length;
    const speedupTargetAchieved = results.filter(r => r.targetAchievement.speedupTarget).length;

    console.log(`測定プロジェクト数: ${results.length}`);
    console.log(`平均処理時間: ${avgTimePerFile.toFixed(2)}ms/file`);
    console.log(`平均高速化倍率: ${avgSpeedup.toFixed(1)}x`);
    console.log(`5ms/file目標達成: ${fiveMsTargetAchieved}/${results.length}プロジェクト (${(fiveMsTargetAchieved/results.length*100).toFixed(1)}%)`);
    console.log(`3-20x高速化達成: ${speedupTargetAchieved}/${results.length}プロジェクト (${(speedupTargetAchieved/results.length*100).toFixed(1)}%)`);
    
    console.log('');
    console.log('🎯 TaintTyper実装の性能評価:');
    
    if (avgTimePerFile <= 5.0 && avgSpeedup >= 3.0) {
      console.log('🏆 優秀: 全ての性能目標を達成しています');
    } else if (avgTimePerFile <= 10.0 && avgSpeedup >= 2.0) {
      console.log('✅ 良好: 実用的な性能を達成しています');
    } else if (avgTimePerFile <= 20.0) {
      console.log('⚠️  改善必要: 性能目標に向けた最適化が必要です');
    } else {
      console.log('❌ 要対策: 大幅な性能改善が必要です');
    }
    
    console.log('');
  }

  /**
   * スケーラビリティ結果の表示
   */
  private displayScalabilityResults(result: ScalabilityTestResult): void {
    console.log('📈 スケーラビリティテスト結果');
    console.log('='.repeat(40));
    
    console.log(`時間計算量: ${result.analysis.timeComplexity}`);
    console.log(`空間計算量: ${result.analysis.spaceComplexity}`);
    console.log(`スケーラビリティスコア: ${result.analysis.scalabilityScore}/10`);
    console.log(`推奨最大ファイル数: ${result.analysis.recommendedMaxFiles}`);
    
    console.log('');
    console.log('📊 スケーラビリティデータ:');
    console.log('Files\t\tTime(ms)\tms/file\tMemory(MB)');
    console.log('-'.repeat(50));
    
    result.scalabilityData.forEach(data => {
      console.log(
        `${data.fileCount.toString().padStart(5)}\t\t` +
        `${data.executionTime.toString().padStart(7)}\t` +
        `${data.timePerFile.toFixed(2).padStart(6)}\t` +
        `${(data.memoryUsage / 1024 / 1024).toFixed(1).padStart(8)}`
      );
    });
    
    console.log('');
  }
}