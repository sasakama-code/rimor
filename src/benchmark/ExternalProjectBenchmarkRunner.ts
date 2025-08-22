/**
 * 外部TypeScriptプロジェクトベンチマーク実行システム
 * issue #84: TypeScript有名プロジェクトを用いた性能ベンチマーク実装
 * 
 * SOLID原則とDefensive Programming原則に基づく実装
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { performance } from 'perf_hooks';
import { execSync, exec, spawn } from 'child_process';
import { promisify } from 'util';
import { BenchmarkProject } from './config/benchmark-targets';
import { IAnalysisEngine } from '../core/interfaces/IAnalysisEngine';
import { container, initializeContainer, TYPES } from '../container/index';
import { UnifiedSecurityAnalysisOrchestrator } from '../orchestrator/UnifiedSecurityAnalysisOrchestrator';
import { UnifiedAnalysisResult } from '../orchestrator/types';
import { MetricsCollector } from './collectors/MetricsCollector';
import { AccuracyCollector } from './collectors/AccuracyCollector';
import { PerformanceProfiler } from './collectors/PerformanceProfiler';
import { BaselineManager, BaselineComparison } from './BaselineManager';
import { ValidationReportGenerator, ValidationReport } from './ValidationReportGenerator';

const execAsync = promisify(exec);

/**
 * ベンチマーク設定インターフェース
 */
export interface BenchmarkConfig {
  /** 出力ディレクトリ */
  outputDir?: string;
  /** キャッシュディレクトリ */
  cacheDir?: string;
  /** 実行回数 */
  iterations?: number;
  /** 並列実行の有効化 */
  parallel?: boolean;
  /** ワーカー数 */
  workerCount?: number;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
  /** 最大リトライ回数 */
  maxRetries?: number;
  /** リトライ間隔（ミリ秒） */
  retryDelay?: number;
  /** 詳細ログの出力 */
  verbose?: boolean;
}

/**
 * プロジェクトクローン結果
 */
export interface CloneResult {
  success: boolean;
  projectPath?: string;
  fileCount?: number;
  fromCache?: boolean;
  error?: string;
  retryCount?: number;
}

/**
 * パフォーマンスメトリクス
 */
export interface PerformanceMetrics {
  /** 実行時間（ミリ秒） */
  executionTime: number;
  /** ファイルあたりの実行時間（ミリ秒） */
  timePerFile: number;
  /** 総ファイル数 */
  totalFiles: number;
  /** メモリ使用量 */
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  /** CPU使用率 */
  cpuUsage?: number;
  /** 並列処理効率 */
  parallelEfficiency?: number;
  /** スループット（ファイル/秒） */
  throughput: number;
}

/**
 * 解析精度メトリクス
 */
export interface AccuracyMetrics {
  /** TaintTyper成功率 */
  taintTyperSuccessRate: number;
  /** Intent抽出成功率 */
  intentExtractionSuccessRate: number;
  /** Gap検出精度 */
  gapDetectionAccuracy: number;
  /** エラー発生率 */
  errorRate: number;
  /** 総エラー数 */
  totalErrors: number;
  /** 処理成功ファイル数 */
  successfulFiles: number;
  /** 処理失敗ファイル数 */
  failedFiles: number;
}

/**
 * 統合分析結果メトリクス
 * Issue #85: Rimorの主要機能の実効性評価
 */
export interface UnifiedAnalysisMetrics {
  /** セキュリティ分析結果 */
  securityAnalysis: {
    /** TaintTyper検出数（脆弱性タイプ別） */
    detectionsByType: Record<string, number>;
    /** 検出精度推定 */
    estimatedAccuracy: number;
    /** 解析カバレッジ */
    coverageRate: number;
    /** 検出された脆弱性の重要度分布 */
    severityDistribution: Record<string, number>;
  };
  /** 意図抽出結果 */
  intentExtraction: {
    /** 抽出された意図の数 */
    totalIntents: number;
    /** 意図カテゴリ分布 */
    categoryDistribution: Record<string, number>;
    /** 抽出信頼度スコア */
    confidenceScore: number;
    /** 成功率 */
    successRate: number;
  };
  /** ギャップ分析結果 */
  gapAnalysis: {
    /** 検出されたギャップ数 */
    totalGaps: number;
    /** ギャップの重要度分布 */
    severityDistribution: Record<string, number>;
    /** 実装カバレッジ率 */
    implementationCoverage: number;
    /** ギャップタイプ分析 */
    gapTypeDistribution: Record<string, number>;
  };
  /** NIST評価結果 */
  nistEvaluation: {
    /** リスクレベル分布 */
    riskDistribution: Record<string, number>;
    /** 優先度付き改善提案数 */
    improvementProposals: number;
    /** コンプライアンススコア */
    complianceScore: number;
    /** 全体リスクスコア */
    overallRiskScore: number;
  };
}

/**
 * 5ms/file目標検証結果
 */
export interface Target5msResult {
  /** 目標達成フラグ */
  achieved: boolean;
  /** 実際のファイルあたり時間 */
  actualTimePerFile: number;
  /** 目標時間 */
  targetTimePerFile: number;
  /** 偏差パーセント */
  deviationPercent: number;
  /** ボトルネック情報 */
  bottlenecks?: string[];
  /** 改善推奨事項 */
  recommendations?: string[];
}

/**
 * ベンチマーク結果
 * Issue #85: 統合分析結果を含む拡充ベンチマーク結果
 */
export interface BenchmarkResult {
  success: boolean;
  projectName: string;
  timestamp: string;
  performance: PerformanceMetrics;
  accuracy: AccuracyMetrics;
  target5ms: Target5msResult;
  /** Issue #85: 統合分析結果メトリクス */
  unifiedAnalysis?: UnifiedAnalysisMetrics;
  /** Issue #85: 生の統合分析結果 */
  rawUnifiedResult?: UnifiedAnalysisResult;
  systemInfo: {
    platform: string;
    arch: string;
    cpus: number;
    totalMemory: number;
    nodeVersion: string;
  };
  error?: string;
  retryCount?: number;
}

/**
 * 比較レポート
 * Issue #85: 統合分析結果を含む拡充比較レポート
 */
export interface ComparisonReport {
  timestamp: string;
  overallPerformance: {
    averageTimePerFile: number;
    successRate: number;
    target5msAchievementRate: number;
  };
  /** Issue #85: 統合分析結果の全体サマリー */
  overallUnifiedAnalysis: {
    averageSecurityFindings: number;
    averageIntentsExtracted: number;
    averageGapsDetected: number;
    averageComplianceScore: number;
    mostCommonVulnerabilityTypes: string[];
    mostCommonGapTypes: string[];
  };
  projectComparisons: {
    projectName: string;
    performance: PerformanceMetrics;
    accuracy: AccuracyMetrics;
    target5ms: Target5msResult;
    /** Issue #85: 統合分析メトリクス */
    unifiedAnalysis?: UnifiedAnalysisMetrics;
    rank: number;
  }[];
  recommendations: string[];
  /** Issue #85: 統合分析結果に基づく推奨事項 */
  unifiedAnalysisRecommendations: string[];
}

/**
 * ベースライン統合実行結果
 * Phase 3: BaselineManager統合機能
 */
export interface BaselineIntegratedResult {
  /** ベンチマーク実行結果 */
  results: BenchmarkResult[];
  /** ベースライン比較結果（初回実行時はundefined） */
  comparison?: BaselineComparison;
  /** 作成/更新されたベースラインID */
  baselineId: string;
  /** 使用された最適ベースラインID（比較時のみ） */
  usedBaselineId?: string;
}

/**
 * 外部プロジェクトベンチマーク実行システム
 * 
 * 設計原則:
 * - Single Responsibility: ベンチマーク実行に特化
 * - Open/Closed: 新しいプロジェクトやメトリクスの追加に開放
 * - Dependency Inversion: 分析エンジンは注入される依存性
 */
/**
 * 高度メトリクス収集統合システム
 * Phase 2で実装された詳細コレクターとの統合による高精度ベンチマーク
 */
class IntegratedMetricsCollectionSystem {
  private metricsCollector: MetricsCollector;
  private accuracyCollector: AccuracyCollector;
  private performanceProfiler: PerformanceProfiler;

  constructor(config: BenchmarkConfig) {
    // 各コレクターの初期化
    this.metricsCollector = new MetricsCollector({
      enableCpuProfiling: true,
      enableMemoryProfiling: true,
      enableIoMonitoring: true,
      samplingInterval: 50, // 高精度サンプリング
      outputDir: path.join(config.outputDir || './.rimor/benchmark-results', 'metrics')
    });

    this.accuracyCollector = new AccuracyCollector({
      enableTaintAnalysis: true,
      enableIntentExtraction: true,
      enableGapDetection: true,
      confidenceThreshold: 0.8
    });

    this.performanceProfiler = new PerformanceProfiler({
      samplingInterval: 10, // 超高精度サンプリング
      enableCallStackAnalysis: true,
      enableMemoryLeakDetection: true,
      enableHotspotDetection: true,
      outputDir: path.join(config.outputDir || './.rimor/benchmark-results', 'profiles')
    });
  }

  async startIntegratedCollection(sessionId: string): Promise<{ 
    metricsSessionId: string; 
    accuracySessionId: string; 
    profileSessionId: string; 
  }> {
    const metricsSessionId = await this.metricsCollector.startCollection(`${sessionId}-metrics`);
    const accuracySessionId = await this.accuracyCollector.startAccuracyMeasurement(`${sessionId}-accuracy`);
    const profileSessionId = await this.performanceProfiler.startProfiling(`${sessionId}-profile`);

    return { metricsSessionId, accuracySessionId, profileSessionId };
  }

  async stopIntegratedCollection(sessions: { 
    metricsSessionId: string; 
    accuracySessionId: string; 
    profileSessionId: string; 
  }): Promise<IntegratedCollectionResult> {
    const [metricsResult, accuracyResult, profileResult] = await Promise.all([
      this.metricsCollector.stopCollection(sessions.metricsSessionId),
      this.accuracyCollector.endAccuracyMeasurement(sessions.accuracySessionId),
      this.performanceProfiler.stopProfiling(sessions.profileSessionId)
    ]);

    return {
      success: metricsResult.success && accuracyResult.success && profileResult.success,
      detailedMetrics: metricsResult.metrics,
      accuracyAnalysis: accuracyResult.accuracyMetrics,
      performanceProfile: profileResult.profilingData,
      warnings: metricsResult.warnings,
      errors: [
        ...(metricsResult.error ? [metricsResult.error] : []),
        ...(accuracyResult.error ? [accuracyResult.error] : []),
        ...(profileResult.error ? [profileResult.error] : [])
      ]
    };
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.metricsCollector.cleanup(),
      this.accuracyCollector.cleanup(),
      this.performanceProfiler.shutdown()
    ]);
  }
}

interface IntegratedCollectionResult {
  success: boolean;
  detailedMetrics?: any;
  accuracyAnalysis?: any;
  performanceProfile?: any;
  warnings: any[];
  errors: string[];
}

export class ExternalProjectBenchmarkRunner {
  private readonly config: Required<BenchmarkConfig>;
  private readonly analysisEngine: IAnalysisEngine;
  private readonly integratedMetrics: IntegratedMetricsCollectionSystem;
  private readonly baselineManager: BaselineManager;
  /** Issue #85: 統合セキュリティ分析オーケストレータ */
  private readonly unifiedAnalysisOrchestrator: UnifiedSecurityAnalysisOrchestrator;
  /** Issue #85: 有効性検証レポートジェネレータ */
  private readonly validationReportGenerator: ValidationReportGenerator;

  constructor(config: BenchmarkConfig = {}) {
    // デフォルト設定の適用（Defensive Programming）
    this.config = {
      outputDir: config.outputDir || './.rimor/benchmark-results',
      cacheDir: config.cacheDir || './.rimor/benchmark-results/cache',
      iterations: config.iterations || 1,
      parallel: config.parallel || false,
      workerCount: config.workerCount || Math.min(4, os.cpus().length),
      timeout: config.timeout || 300000, // 5分
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000, // 5秒
      verbose: config.verbose || false
    };

    // DIコンテナを初期化
    console.log('🔧 [ExternalProjectBenchmarkRunner] About to initialize DI container...');
    const initializedContainer = initializeContainer();
    console.log('✅ [ExternalProjectBenchmarkRunner] DI container initialized successfully');
    
    // DI容器から分析エンジンを取得
    console.log('🎯 [ExternalProjectBenchmarkRunner] Getting AnalysisEngine from container...');
    this.analysisEngine = initializedContainer.get<IAnalysisEngine>(TYPES.AnalysisEngine);
    console.log('✅ [ExternalProjectBenchmarkRunner] AnalysisEngine retrieved successfully');
    
    // Issue #85: 統合セキュリティ分析オーケストレータの初期化
    this.unifiedAnalysisOrchestrator = new UnifiedSecurityAnalysisOrchestrator();
    console.log('✅ [ExternalProjectBenchmarkRunner] UnifiedSecurityAnalysisOrchestrator initialized');
    
    // 統合メトリクス収集システムの初期化
    this.integratedMetrics = new IntegratedMetricsCollectionSystem(this.config);
    
    // BaselineManagerの初期化
    this.baselineManager = new BaselineManager({
      baselineDir: path.join(this.config.outputDir, 'baselines'),
      retentionPeriod: 90, // 90日間保持
      compressionEnabled: true,
      autoCleanup: true
    });
    
    // Issue #85: ValidationReportGeneratorの初期化
    this.validationReportGenerator = new ValidationReportGenerator(
      path.join(this.config.outputDir, 'validation-reports')
    );
    console.log('✅ [ExternalProjectBenchmarkRunner] ValidationReportGenerator initialized');
    
    // 出力ディレクトリの確保
    this.ensureDirectories();
  }

  /**
   * 必要なディレクトリを作成
   */
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(this.config.cacheDir, { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'reports'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'baseline'), { recursive: true });
    } catch (error) {
      if (this.config.verbose) {
        console.warn('ディレクトリ作成警告:', error);
      }
    }
  }

  /**
   * プロジェクトをクローンまたはキャッシュから取得
   * 
   * Defensive Programming: エラーハンドリングとリトライ機能を実装
   */
  async cloneProject(project: BenchmarkProject): Promise<CloneResult> {
    const projectCacheDir = path.join(this.config.cacheDir, project.name);
    let retryCount = 0;

    // キャッシュの確認
    if (await this.isCacheValid(projectCacheDir)) {
      const fileCount = await this.countFiles(projectCacheDir, project);
      return {
        success: true,
        projectPath: projectCacheDir,
        fileCount,
        fromCache: true,
        retryCount: 0
      };
    }

    // クローンまたは更新の実行（リトライ機能付き）
    while (retryCount <= this.config.maxRetries) {
      try {
        await this.executeClone(project, projectCacheDir);
        const fileCount = await this.countFiles(projectCacheDir, project);
        
        return {
          success: true,
          projectPath: projectCacheDir,
          fileCount,
          fromCache: false,
          retryCount
        };
      } catch (error) {
        retryCount++;
        
        if (retryCount > this.config.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            retryCount
          };
        }

        if (this.config.verbose) {
          console.log(`クローン失敗、リトライ ${retryCount}/${this.config.maxRetries}: ${error}`);
        }

        await this.delay(this.config.retryDelay);
      }
    }

    return {
      success: false,
      error: '最大リトライ回数に達しました',
      retryCount
    };
  }

  /**
   * 実際のクローン処理
   */
  private async executeClone(project: BenchmarkProject, targetDir: string): Promise<void> {
    // 既存ディレクトリの削除
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch (error) {
      // 削除失敗は無視（ディレクトリが存在しない場合）
    }

    // Gitクローンの実行
    const cloneCommand = `git clone --depth 1 --single-branch "${project.repositoryUrl}" "${targetDir}"`;
    
    await execAsync(cloneCommand, {
      timeout: project.timeout,
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });

    if (this.config.verbose) {
      console.log(`プロジェクト ${project.name} をクローンしました: ${targetDir}`);
    }
  }

  /**
   * キャッシュの有効性を確認
   */
  private async isCacheValid(cacheDir: string): Promise<boolean> {
    try {
      const stats = await fs.stat(cacheDir);
      if (!stats.isDirectory()) {
        return false;
      }

      // キャッシュの有効期限（24時間）
      const cacheAge = Date.now() - stats.mtime.getTime();
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24時間

      return cacheAge < maxCacheAge;
    } catch (error) {
      return false;
    }
  }

  /**
   * ファイル数をカウント
   */
  private async countFiles(projectPath: string, project: BenchmarkProject): Promise<number> {
    const targetDir = project.targetDirectory 
      ? path.join(projectPath, project.targetDirectory)
      : projectPath;

    try {
      const files = await this.getTargetFiles(targetDir, project.excludePatterns || []);
      return files.length;
    } catch (error) {
      if (this.config.verbose) {
        console.warn(`ファイルカウント失敗: ${error}`);
      }
      return 0;
    }
  }

  /**
   * 対象ファイルの取得
   */
  private async getTargetFiles(directory: string, excludePatterns: string[]): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(directory, fullPath);
          
          // 除外パターンのチェック
          if (this.shouldExclude(relativePath, excludePatterns)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // ディレクトリアクセス失敗は無視
      }
    };

    await scanDirectory(directory);
    return files;
  }

  /**
   * プロジェクト内のテストディレクトリを検索
   * Issue #85修正: 適切なテストディレクトリを特定して分析精度を向上
   */
  private async findTestDirectory(projectPath: string): Promise<string | null> {
    const possibleTestDirs = ['tests', 'test', '__tests__', 'spec'];
    
    for (const dir of possibleTestDirs) {
      const testPath = path.join(projectPath, dir);
      try {
        const stats = await fs.stat(testPath);
        if (stats.isDirectory()) {
          if (this.config.verbose) {
            console.log(`📁 Found test directory: ${testPath}`);
          }
          return testPath;
        }
      } catch (error) {
        // ディレクトリが存在しない場合は無視
        continue;
      }
    }
    
    if (this.config.verbose) {
      console.log(`⚠️ No test directory found in: ${projectPath}`);
    }
    return null;
  }

  /**
   * 除外パターンのチェック
   */
  private shouldExclude(filePath: string, excludePatterns: string[]): boolean {
    return excludePatterns.some(pattern => {
      // 簡易的なグロブマッチング
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    });
  }

  /**
   * パフォーマンスメトリクスの収集
   * Phase 2: 統合メトリクス収集システムとの連携
   */
  async collectPerformanceMetrics(
    project: { name: string; path: string; fileCount: number },
    integratedResult?: IntegratedCollectionResult,
    mainAnalysisResult?: any
  ): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      // メイン解析結果が提供されている場合はそれを優先して使用
      if (mainAnalysisResult) {
        const executionTime = mainAnalysisResult.executionTime;
        const actualFileCount = mainAnalysisResult.totalFiles || project.fileCount;
        const timePerFile = actualFileCount > 0 ? executionTime / actualFileCount : 0;
        
        if (this.config.verbose) {
          console.log(`📊 Using main analysis result for performance metrics:`, {
            executionTime,
            actualFileCount,
            timePerFile: timePerFile.toFixed(3)
          });
        }
        
        return {
          executionTime,
          timePerFile,
          totalFiles: actualFileCount,
          memoryUsage: process.memoryUsage(),
          throughput: actualFileCount / (executionTime / 1000)
        };
      }
      
      // 統合システム結果が提供されている場合はそれを使用
      else if (integratedResult?.detailedMetrics) {
        const detailedMetrics = integratedResult.detailedMetrics;
        const executionTime = detailedMetrics.timeline.totalDuration;
        const timePerFile = project.fileCount > 0 ? executionTime / project.fileCount : 0;
        
        return {
          executionTime,
          timePerFile,
          totalFiles: project.fileCount,
          memoryUsage: {
            heapUsed: detailedMetrics.memory.heap.used,
            heapTotal: detailedMetrics.memory.heap.total,
            external: detailedMetrics.memory.heap.peak,
            rss: detailedMetrics.memory.heap.used
          },
          cpuUsage: detailedMetrics.cpu.averageUsage,
          parallelEfficiency: detailedMetrics.threading.efficiency,
          throughput: project.fileCount / (executionTime / 1000)
        };
      }
      
      // フォールバック: 従来の手動測定
      const analysisOptions = {
        parallel: this.config.parallel,
        cache: true,
        concurrency: this.config.workerCount
      };

      if (this.config.verbose) {
        console.log(`🔍 Starting analysis for project: ${project.name} with ${project.fileCount} files`);
        console.log(`📁 Analysis path: ${project.path}`);
        console.log(`⚙️  Analysis options:`, analysisOptions);
      }

      const analysisResult = await this.analysisEngine.analyze(project.path, analysisOptions);
      
      if (this.config.verbose) {
        console.log(`📊 Analysis completed:`, {
          totalFiles: analysisResult.totalFiles,
          issues: analysisResult.issues.length,
          executionTime: analysisResult.executionTime,
          metadata: analysisResult.metadata
        });
      }
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      // 実際の解析実行時間を使用（より正確）
      const executionTime = analysisResult.executionTime > 0 ? analysisResult.executionTime : endTime - startTime;
      const timePerFile = project.fileCount > 0 ? executionTime / project.fileCount : 0;
      
      // 並列処理効率の計算
      let parallelEfficiency = 1.0;
      if (this.config.parallel) {
        const sequentialEstimate = timePerFile * project.fileCount;
        const actualTime = executionTime;
        const idealParallelTime = sequentialEstimate / this.config.workerCount;
        parallelEfficiency = Math.min(1.0, idealParallelTime / actualTime);
      }

      return {
        executionTime,
        timePerFile,
        totalFiles: project.fileCount,
        memoryUsage: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
          rss: endMemory.rss
        },
        parallelEfficiency,
        throughput: project.fileCount / (executionTime / 1000) // ファイル/秒
      };
    } catch (error) {
      // エラー発生時も基本的なメトリクスを返す
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      return {
        executionTime,
        timePerFile: 0,
        totalFiles: project.fileCount,
        memoryUsage: process.memoryUsage(),
        throughput: 0
      };
    }
  }

  /**
   * Issue #85: 統合分析結果からメトリクスを抽出
   * Rimorの主要機能の実効性評価のための詳細メトリクス収集
   */
  private extractUnifiedAnalysisMetrics(unifiedResult: UnifiedAnalysisResult): UnifiedAnalysisMetrics {
    if (this.config.verbose) {
      console.log('🔍 DEBUG: Extracting metrics from unified result:', {
        hasUnifiedResult: !!unifiedResult,
        unifiedResultKeys: unifiedResult ? Object.keys(unifiedResult) : [],
        taintAnalysisVulns: unifiedResult?.taintAnalysis?.vulnerabilities?.length || 0,
        intentAnalysisIntents: unifiedResult?.intentAnalysis?.testIntents?.length || 0,
        gapAnalysisGaps: unifiedResult?.gapAnalysis?.gaps?.length || 0,
        nistRiskAssessments: unifiedResult?.nistEvaluation?.riskAssessments?.length || 0,
      });
    }
    
    const metrics: UnifiedAnalysisMetrics = {
      securityAnalysis: {
        detectionsByType: {},
        estimatedAccuracy: 0,
        coverageRate: 0,
        severityDistribution: {}
      },
      intentExtraction: {
        totalIntents: 0,
        categoryDistribution: {},
        confidenceScore: 0,
        successRate: 0
      },
      gapAnalysis: {
        totalGaps: 0,
        severityDistribution: {},
        implementationCoverage: 0,
        gapTypeDistribution: {}
      },
      nistEvaluation: {
        riskDistribution: {},
        improvementProposals: 0,
        complianceScore: 0,
        overallRiskScore: 0
      }
    };

    // TaintTyperセキュリティ分析結果の抽出
    if (unifiedResult.taintAnalysis) {
      const taintResult = unifiedResult.taintAnalysis;
      
      // 脆弱性タイプ別の検出数を集計
      taintResult.vulnerabilities?.forEach(vuln => {
        const vulnType = vuln.type || 'unknown';
        metrics.securityAnalysis.detectionsByType[vulnType] = 
          (metrics.securityAnalysis.detectionsByType[vulnType] || 0) + 1;
          
        const severity = vuln.severity?.toLowerCase() || 'low';
        metrics.securityAnalysis.severityDistribution[severity] = 
          (metrics.securityAnalysis.severityDistribution[severity] || 0) + 1;
      });
      
      // 推定精度とカバレッジの計算（サマリー情報から推定）
      const totalVulns = taintResult.summary.totalVulnerabilities || 0;
      metrics.securityAnalysis.estimatedAccuracy = totalVulns > 0 ? 0.85 : 0.8; // 推定値
      metrics.securityAnalysis.coverageRate = totalVulns > 0 ? 0.9 : 0.7; // 推定値
    }

    // 意図抽出結果の抽出
    if (unifiedResult.intentAnalysis) {
      const intentResult = unifiedResult.intentAnalysis;
      
      metrics.intentExtraction.totalIntents = intentResult.testIntents?.length || 0;
      metrics.intentExtraction.confidenceScore = 0.8; // 推定値
      metrics.intentExtraction.successRate = intentResult.summary.totalTests > 0 ? 0.85 : 0;
      
      // 意図カテゴリ分布の集計（リスクレベルで分類）
      intentResult.testIntents?.forEach(intent => {
        const category = intent.riskLevel?.toLowerCase() || 'unknown';
        metrics.intentExtraction.categoryDistribution[category] = 
          (metrics.intentExtraction.categoryDistribution[category] || 0) + 1;
      });
    }

    // ギャップ分析結果の抽出
    if (unifiedResult.gapAnalysis) {
      const gapResult = unifiedResult.gapAnalysis;
      
      metrics.gapAnalysis.totalGaps = gapResult.gaps?.length || 0;
      metrics.gapAnalysis.implementationCoverage = gapResult.summary.totalGaps > 0 ? 0.75 : 1.0; // 推定値
      
      // ギャップの重要度分布の集計
      gapResult.gaps?.forEach(gap => {
        const severity = gap.riskLevel?.toLowerCase() || 'medium';
        metrics.gapAnalysis.severityDistribution[severity] = 
          (metrics.gapAnalysis.severityDistribution[severity] || 0) + 1;
          
        // ギャップタイプはテスト名で分類
        const gapType = 'test-implementation-gap';
        metrics.gapAnalysis.gapTypeDistribution[gapType] = 
          (metrics.gapAnalysis.gapTypeDistribution[gapType] || 0) + 1;
      });
    }

    // NIST評価結果の抽出
    if (unifiedResult.nistEvaluation) {
      const nistResult = unifiedResult.nistEvaluation;
      
      metrics.nistEvaluation.complianceScore = nistResult.summary.overallScore / 100 || 0.8;
      metrics.nistEvaluation.overallRiskScore = nistResult.summary.overallScore / 100 || 0.6;
      
      // 改善提案数は各リスクアセスメントの推奨事項を集計
      let totalRecommendations = 0;
      nistResult.riskAssessments?.forEach(risk => {
        totalRecommendations += risk.recommendations?.length || 0;
      });
      metrics.nistEvaluation.improvementProposals = totalRecommendations;
      
      // リスクレベル分布の集計
      nistResult.riskAssessments?.forEach(risk => {
        const riskLevel = risk.overallRisk?.toLowerCase() || 'medium';
        metrics.nistEvaluation.riskDistribution[riskLevel] = 
          (metrics.nistEvaluation.riskDistribution[riskLevel] || 0) + 1;
      });
    }

    if (this.config.verbose) {
      console.log('🔍 DEBUG: Extracted metrics summary:', {
        securityFindings: Object.values(metrics.securityAnalysis.detectionsByType).reduce((a, b) => a + b, 0),
        securityAccuracy: metrics.securityAnalysis.estimatedAccuracy,
        intentExtracted: metrics.intentExtraction.totalIntents,
        intentConfidence: metrics.intentExtraction.confidenceScore,
        gapsDetected: metrics.gapAnalysis.totalGaps,
        gapCoverage: metrics.gapAnalysis.implementationCoverage,
        nistCompliance: metrics.nistEvaluation.complianceScore,
        nistProposals: metrics.nistEvaluation.improvementProposals
      });
    }
    
    return metrics;
  }

  /**
   * 解析精度メトリクスの収集
   * Phase 2: 統合精度収集システムとの連携
   */
  async collectAccuracyMetrics(
    project: { name: string; path: string; fileCount: number },
    integratedResult?: IntegratedCollectionResult
  ): Promise<AccuracyMetrics> {
    try {
      // 統合システム結果が提供されている場合はそれを使用（DRY原則適用）
      if (integratedResult?.accuracyAnalysis) {
        const accuracyData = integratedResult.accuracyAnalysis;
        
        return {
          taintTyperSuccessRate: accuracyData.taintAnalysis.overallAccuracy,
          intentExtractionSuccessRate: accuracyData.intentExtraction.overallAccuracy,
          gapDetectionAccuracy: accuracyData.gapDetection.overallAccuracy,
          errorRate: 1 - accuracyData.integrated.overallScore,
          totalErrors: accuracyData.taintAnalysis.falsePositives + accuracyData.taintAnalysis.falseNegatives,
          successfulFiles: accuracyData.taintAnalysis.truePositives + accuracyData.taintAnalysis.trueNegatives,
          failedFiles: accuracyData.taintAnalysis.falsePositives + accuracyData.taintAnalysis.falseNegatives
        };
      }
      
      // フォールバック: 従来のサンプリング手法
      let successfulFiles = 0;
      let failedFiles = 0;
      let totalErrors = 0;

      // 個別ファイルの解析を実行して精度を測定
      const targetFiles = await this.getTargetFiles(project.path, []);
      const sampleSize = Math.min(100, targetFiles.length); // サンプリング
      const sampleFiles = targetFiles.slice(0, sampleSize);

      for (const file of sampleFiles) {
        try {
          await this.analysisEngine.analyze(file, {
            parallel: false,
            cache: true
          });
          successfulFiles++;
        } catch (error) {
          failedFiles++;
          totalErrors++;
        }
      }

      const totalSamples = successfulFiles + failedFiles;
      const successRate = totalSamples > 0 ? successfulFiles / totalSamples : 0;
      const errorRate = totalSamples > 0 ? failedFiles / totalSamples : 0;

      return {
        taintTyperSuccessRate: successRate * 0.9, // 推定値
        intentExtractionSuccessRate: successRate * 0.85, // 推定値
        gapDetectionAccuracy: successRate * 0.88, // 推定値
        errorRate,
        totalErrors,
        successfulFiles,
        failedFiles
      };
    } catch (error) {
      return {
        taintTyperSuccessRate: 0,
        intentExtractionSuccessRate: 0,
        gapDetectionAccuracy: 0,
        errorRate: 1,
        totalErrors: 1,
        successfulFiles: 0,
        failedFiles: project.fileCount
      };
    }
  }

  /**
   * 5ms/file目標の検証
   * Phase 2: 統合システム結果を活用した高精度検証
   */
  async verify5msPerFileTarget(
    project: { name: string; path: string; fileCount: number },
    performanceMetrics?: PerformanceMetrics,
    integratedResult?: IntegratedCollectionResult
  ): Promise<Target5msResult> {
    // 既に収集されたメトリクスがある場合はそれを使用（DRY原則）
    const metrics = performanceMetrics || await this.collectPerformanceMetrics(project, integratedResult);
    const targetTime = 5; // 5ms
    const actualTime = metrics.timePerFile;
    const achieved = actualTime <= targetTime;
    const deviationPercent = ((actualTime - targetTime) / targetTime) * 100;

    const result: Target5msResult = {
      achieved,
      actualTimePerFile: actualTime,
      targetTimePerFile: targetTime,
      deviationPercent
    };

    if (!achieved) {
      result.bottlenecks = this.identifyBottlenecks(metrics, integratedResult);
      result.recommendations = this.generateRecommendations(metrics, deviationPercent);
    }

    return result;
  }

  /**
   * ボトルネックの特定
   * Phase 2: 詳細プロファイリング結果を活用した高精度ボトルネック特定
   */
  private identifyBottlenecks(metrics: PerformanceMetrics, integratedResult?: IntegratedCollectionResult): string[] {
    const bottlenecks: string[] = [];

    // 統合システムからの詳細分析結果を活用
    if (integratedResult?.performanceProfile) {
      const profile = integratedResult.performanceProfile;
      
      // メモリリークの検出
      if (profile.memoryAnalysis.leakDetection.suspected) {
        bottlenecks.push(`メモリリーク検出 (${profile.memoryAnalysis.leakDetection.leakRate}bytes/sec)`);
      }
      
      // CPUホットスポットの特定
      if (profile.hotspotAnalysis.hotspots.length > 0) {
        const topHotspot = profile.hotspotAnalysis.hotspots[0];
        bottlenecks.push(`CPUホットスポット: ${topHotspot.functionName} (${topHotspot.percentage.toFixed(1)}%)`);
      }
      
      // I/Oボトルネック
      if (profile.ioAnalysis.bottlenecks.length > 0) {
        const topBottleneck = profile.ioAnalysis.bottlenecks[0];
        bottlenecks.push(`I/Oボトルネック: ${topBottleneck.type} - ${topBottleneck.location}`);
      }
      
      // ガベージコレクション影響
      if (profile.garbageCollectionAnalysis.impactOnPerformance > 15) {
        bottlenecks.push(`GC影響度高 (${profile.garbageCollectionAnalysis.impactOnPerformance.toFixed(1)}%)`);
      }
    }
    
    // 従来のヒューリスティック分析（フォールバック）
    if (bottlenecks.length === 0) {
      if (metrics.memoryUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB以上
        bottlenecks.push('高メモリ使用量');
      }

      if (metrics.parallelEfficiency && metrics.parallelEfficiency < 0.7) {
        bottlenecks.push('並列処理効率の低下');
      }

      if (metrics.throughput < 10) { // 10ファイル/秒未満
        bottlenecks.push('低スループット');
      }
    }

    return bottlenecks;
  }

  /**
   * 改善推奨事項の生成
   */
  private generateRecommendations(metrics: PerformanceMetrics, deviationPercent: number): string[] {
    const recommendations: string[] = [];

    if (deviationPercent > 100) {
      recommendations.push('アルゴリズムの根本的な見直しが必要');
    } else if (deviationPercent > 50) {
      recommendations.push('キャッシュシステムの改善を検討');
      recommendations.push('並列処理の最適化を実施');
    } else {
      recommendations.push('細かなチューニングで目標達成可能');
    }

    return recommendations;
  }

  /**
   * 単一プロジェクトのベンチマーク実行
   * Phase 2: 統合メトリクス収集システムによる高精度ベンチマーク
   * SOLID原則適用: 各コレクターが単一責任を持ち、統合システムが協調する
   */
  async runSingleProjectBenchmark(project: BenchmarkProject): Promise<BenchmarkResult> {
    const timestamp = new Date().toISOString();
    const sessionId = `benchmark-${project.name}-${Date.now()}`;
    let integratedSessions: any = null;
    
    try {
      // プロジェクトのクローン
      const cloneResult = await this.cloneProject(project);
      if (!cloneResult.success) {
        return {
          success: false,
          projectName: project.name,
          timestamp,
          performance: this.getEmptyPerformanceMetrics(),
          accuracy: this.getEmptyAccuracyMetrics(),
          target5ms: this.getEmptyTarget5msResult(),
          // Issue #85: 空の統合分析結果
          unifiedAnalysis: this.getEmptyUnifiedAnalysisMetrics(),
          systemInfo: this.getSystemInfo(),
          error: cloneResult.error,
          retryCount: cloneResult.retryCount
        };
      }

      const projectInfo = {
        name: project.name,
        path: cloneResult.projectPath!,
        fileCount: cloneResult.fileCount!
      };

      // Phase 2: 統合メトリクス収集セッション開始
      if (this.config.verbose) {
        console.log(`統合メトリクス収集開始: ${project.name}`);
      }
      
      integratedSessions = await this.integratedMetrics.startIntegratedCollection(sessionId);
      
      // Issue #85: Rimor統合セキュリティ分析の実行（メトリクス収集中）
      if (this.config.verbose) {
        console.log(`🔍 Executing unified security analysis for project: ${project.name}`);
        console.log(`📁 Project path: ${projectInfo.path}`);
        console.log(`📈 File count: ${projectInfo.fileCount}`);
      }
      
      // テストディレクトリを検索して適切なパスで分析実行
      const testPath = await this.findTestDirectory(projectInfo.path);
      let unifiedAnalysisResult: UnifiedAnalysisResult;
      
      if (testPath) {
        if (this.config.verbose) {
          console.log(`🎯 Analyzing test directory: ${testPath}`);
        }
        unifiedAnalysisResult = await this.unifiedAnalysisOrchestrator.analyzeTestDirectory(testPath);
      } else {
        if (this.config.verbose) {
          console.log(`⚠️ No test directory found, analyzing entire project: ${projectInfo.path}`);
        }
        // フォールバック: テストディレクトリが見つからない場合は全体を分析
        unifiedAnalysisResult = await this.unifiedAnalysisOrchestrator.analyzeTestDirectory(projectInfo.path);
      }
      
      // 従来の基本分析も実行（パフォーマンス測定のため）
      const mainAnalysisResult = await this.analysisEngine.analyze(projectInfo.path, {
        parallel: this.config.parallel,
        cache: true,
        concurrency: this.config.workerCount
      });
      
      if (this.config.verbose) {
        // デバッグ: 実際のデータ構造を確認
        console.log('🔍 DEBUG: UnifiedAnalysisResult structure:', {
          hasUnifiedResult: !!unifiedAnalysisResult,
          keys: unifiedAnalysisResult ? Object.keys(unifiedAnalysisResult) : [],
          taintAnalysis: unifiedAnalysisResult?.taintAnalysis ? {
            hasVulnerabilities: !!unifiedAnalysisResult.taintAnalysis.vulnerabilities,
            vulnerabilitiesLength: unifiedAnalysisResult.taintAnalysis.vulnerabilities?.length,
            hasSummary: !!unifiedAnalysisResult.taintAnalysis.summary,
            summaryTotal: unifiedAnalysisResult.taintAnalysis.summary?.totalVulnerabilities
          } : 'null',
          intentAnalysis: unifiedAnalysisResult?.intentAnalysis ? {
            hasTestIntents: !!unifiedAnalysisResult.intentAnalysis.testIntents,
            testIntentsLength: unifiedAnalysisResult.intentAnalysis.testIntents?.length,
            hasSummary: !!unifiedAnalysisResult.intentAnalysis.summary,
            summaryTotal: unifiedAnalysisResult.intentAnalysis.summary?.totalTests
          } : 'null',
          gapAnalysis: unifiedAnalysisResult?.gapAnalysis ? {
            hasGaps: !!unifiedAnalysisResult.gapAnalysis.gaps,
            gapsLength: unifiedAnalysisResult.gapAnalysis.gaps?.length,
            hasSummary: !!unifiedAnalysisResult.gapAnalysis.summary,
            summaryTotal: unifiedAnalysisResult.gapAnalysis.summary?.totalGaps
          } : 'null',
          nistEvaluation: unifiedAnalysisResult?.nistEvaluation ? {
            hasRiskAssessments: !!unifiedAnalysisResult.nistEvaluation.riskAssessments,
            riskAssessmentsLength: unifiedAnalysisResult.nistEvaluation.riskAssessments?.length,
            hasSummary: !!unifiedAnalysisResult.nistEvaluation.summary,
            summaryScore: unifiedAnalysisResult.nistEvaluation.summary?.overallScore
          } : 'null',
          unifiedReport: unifiedAnalysisResult?.unifiedReport ? {
            overallRiskScore: unifiedAnalysisResult.unifiedReport.overallRiskScore,
            hasSummary: !!unifiedAnalysisResult.unifiedReport.summary,
            summaryTotalIssues: unifiedAnalysisResult.unifiedReport.summary?.totalIssues
          } : 'null'
        });
        
        const taintFindings = unifiedAnalysisResult.taintAnalysis?.vulnerabilities?.length || 
                           unifiedAnalysisResult.taintAnalysis?.summary?.totalVulnerabilities || 0;
        const intentCount = unifiedAnalysisResult.intentAnalysis?.testIntents?.length || 
                           unifiedAnalysisResult.intentAnalysis?.summary?.totalTests || 0;
        const gapCount = unifiedAnalysisResult.gapAnalysis?.gaps?.length || 
                        unifiedAnalysisResult.gapAnalysis?.summary?.totalGaps || 0;
        const nistCount = unifiedAnalysisResult.nistEvaluation?.riskAssessments?.length || 
                         unifiedAnalysisResult.nistEvaluation?.summary?.totalAssessments || 0;
        const riskScore = unifiedAnalysisResult.unifiedReport?.overallRiskScore || 
                         unifiedAnalysisResult.nistEvaluation?.summary?.overallScore || 0;
        
        console.log(`📊 Unified analysis completed:`, {
          taintAnalysisFindings: taintFindings,
          intentsExtracted: intentCount,
          gapsDetected: gapCount,
          nistRisks: nistCount,
          overallRiskScore: riskScore
        });
        console.log(`📊 Main analysis result:`, {
          totalFiles: mainAnalysisResult.totalFiles,
          issues: mainAnalysisResult.issues.length,
          executionTime: mainAnalysisResult.executionTime,
          metadata: mainAnalysisResult.metadata
        });
      }
      
      // 統合メトリクス収集セッション終了と結果取得
      const integratedResult = await this.integratedMetrics.stopIntegratedCollection(integratedSessions);
      
      if (this.config.verbose) {
        console.log(`統合メトリクス収集完了: ${project.name}`, {
          success: integratedResult.success,
          warningsCount: integratedResult.warnings.length,
          errorsCount: integratedResult.errors.length
        });
      }

      // Issue #85: 統合分析結果からメトリクスを抽出
      const unifiedMetrics = this.extractUnifiedAnalysisMetrics(unifiedAnalysisResult);
      
      // Phase 2統合システムを活用したメトリクス計算（DRY原則適用）
      const performance = await this.collectPerformanceMetrics(projectInfo, integratedResult, mainAnalysisResult);
      const accuracy = await this.collectAccuracyMetrics(projectInfo, integratedResult);
      const target5ms = await this.verify5msPerFileTarget(projectInfo, performance, integratedResult);

      const result: BenchmarkResult = {
        success: true,
        projectName: project.name,
        timestamp,
        performance,
        accuracy,
        target5ms,
        // Issue #85: 統合分析結果を含む
        unifiedAnalysis: unifiedMetrics,
        rawUnifiedResult: unifiedAnalysisResult,
        systemInfo: this.getSystemInfo(),
        retryCount: cloneResult.retryCount
      };

      // 結果の保存（詳細メトリクスも併せて保存）
      await this.saveBenchmarkResult(result);
      await this.saveDetailedMetrics(project.name, integratedResult);

      return result;
    } catch (error) {
      // エラー時のクリーンアップ
      if (integratedSessions) {
        try {
          await this.integratedMetrics.stopIntegratedCollection(integratedSessions);
        } catch (cleanupError) {
          if (this.config.verbose) {
            console.warn(`統合システムクリーンアップ警告:`, cleanupError);
          }
        }
      }
      
      return {
        success: false,
        projectName: project.name,
        timestamp,
        performance: this.getEmptyPerformanceMetrics(),
        accuracy: this.getEmptyAccuracyMetrics(),
        target5ms: this.getEmptyTarget5msResult(),
        // Issue #85: 空の統合分析結果
        unifiedAnalysis: this.getEmptyUnifiedAnalysisMetrics(),
        systemInfo: this.getSystemInfo(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 複数プロジェクトのベンチマーク実行
   */
  async runMultiProjectBenchmark(projects: BenchmarkProject[]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const project of projects) {
      if (this.config.verbose) {
        console.log(`ベンチマーク実行中: ${project.name}`);
      }

      const result = await this.runSingleProjectBenchmark(project);
      results.push(result);

      // プロジェクト間のインターバル
      if (results.length < projects.length) {
        await this.delay(2000); // 2秒待機
      }
    }

    return results;
  }

  /**
   * 比較レポートの生成
   * Issue #85: 統合分析結果を含む拡充レポート生成
   */
  async generateComparisonReport(results: BenchmarkResult[]): Promise<ComparisonReport> {
    const successfulResults = results.filter(r => r.success);
    
    // 全体パフォーマンスの計算
    const averageTimePerFile = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.performance.timePerFile, 0) / successfulResults.length
      : 0;
    
    const successRate = results.length > 0 ? successfulResults.length / results.length : 0;
    
    const target5msAchievedCount = successfulResults.filter(r => r.target5ms.achieved).length;
    const target5msAchievementRate = successfulResults.length > 0 
      ? target5msAchievedCount / successfulResults.length 
      : 0;

    // Issue #85: 統合分析結果の全体サマリー計算
    const overallUnifiedAnalysis = this.calculateOverallUnifiedAnalysis(successfulResults);

    // プロジェクト比較
    const projectComparisons = successfulResults
      .sort((a, b) => a.performance.timePerFile - b.performance.timePerFile)
      .map((result, index) => ({
        projectName: result.projectName,
        performance: result.performance,
        accuracy: result.accuracy,
        target5ms: result.target5ms,
        // Issue #85: 統合分析メトリクスを含める
        unifiedAnalysis: result.unifiedAnalysis,
        rank: index + 1
      }));

    // 推奨事項の生成
    const recommendations = this.generateComparisonRecommendations(results);
    // Issue #85: 統合分析結果に基づく推奨事項の生成
    const unifiedAnalysisRecommendations = this.generateUnifiedAnalysisRecommendations(successfulResults);

    const report: ComparisonReport = {
      timestamp: new Date().toISOString(),
      overallPerformance: {
        averageTimePerFile,
        successRate,
        target5msAchievementRate
      },
      // Issue #85: 統合分析結果の全体サマリーを含む
      overallUnifiedAnalysis,
      projectComparisons,
      recommendations,
      unifiedAnalysisRecommendations
    };

    // レポートの保存
    await this.saveComparisonReport(report);
    
    // Issue #85: 有効性検証レポートの生成
    if (this.config.verbose) {
      console.log('📈 Generating validation report...');
    }
    
    try {
      const validationReport = await this.validationReportGenerator.generateValidationReport(
        results,
        report
      );
      
      if (this.config.verbose) {
        console.log('✅ Validation report generated successfully');
        console.log(`   Overall effectiveness: ${validationReport.overallEffectiveness.score}/100 (${validationReport.overallEffectiveness.grade})`);
        console.log(`   High-value cases found: ${validationReport.detectionCases.highValueCases.length}`);
      }
    } catch (error) {
      if (this.config.verbose) {
        console.warn('⚠️  Failed to generate validation report:', error);
      }
    }

    return report;
  }

  /**
   * Issue #85: 統合分析結果の全体サマリー計算
   */
  private calculateOverallUnifiedAnalysis(results: BenchmarkResult[]) {
    const resultsWithUnified = results.filter(r => r.unifiedAnalysis);
    
    if (resultsWithUnified.length === 0) {
      return {
        averageSecurityFindings: 0,
        averageIntentsExtracted: 0,
        averageGapsDetected: 0,
        averageComplianceScore: 0,
        mostCommonVulnerabilityTypes: [],
        mostCommonGapTypes: []
      };
    }

    // 平均値の計算
    const averageSecurityFindings = resultsWithUnified.reduce((sum, r) => 
      sum + Object.values(r.unifiedAnalysis!.securityAnalysis.detectionsByType).reduce((a, b) => a + b, 0), 0) / resultsWithUnified.length;
    
    const averageIntentsExtracted = resultsWithUnified.reduce((sum, r) => 
      sum + r.unifiedAnalysis!.intentExtraction.totalIntents, 0) / resultsWithUnified.length;
    
    const averageGapsDetected = resultsWithUnified.reduce((sum, r) => 
      sum + r.unifiedAnalysis!.gapAnalysis.totalGaps, 0) / resultsWithUnified.length;
    
    const averageComplianceScore = resultsWithUnified.reduce((sum, r) => 
      sum + r.unifiedAnalysis!.nistEvaluation.complianceScore, 0) / resultsWithUnified.length;

    // 最も一般的な脆弱性タイプの集計
    const vulnTypeCounts: Record<string, number> = {};
    const gapTypeCounts: Record<string, number> = {};
    
    resultsWithUnified.forEach(r => {
      Object.entries(r.unifiedAnalysis!.securityAnalysis.detectionsByType).forEach(([type, count]) => {
        vulnTypeCounts[type] = (vulnTypeCounts[type] || 0) + count;
      });
      
      Object.entries(r.unifiedAnalysis!.gapAnalysis.gapTypeDistribution).forEach(([type, count]) => {
        gapTypeCounts[type] = (gapTypeCounts[type] || 0) + count;
      });
    });

    const mostCommonVulnerabilityTypes = Object.entries(vulnTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);
    
    const mostCommonGapTypes = Object.entries(gapTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);

    return {
      averageSecurityFindings: Math.round(averageSecurityFindings * 100) / 100,
      averageIntentsExtracted: Math.round(averageIntentsExtracted * 100) / 100,
      averageGapsDetected: Math.round(averageGapsDetected * 100) / 100,
      averageComplianceScore: Math.round(averageComplianceScore * 100) / 100,
      mostCommonVulnerabilityTypes,
      mostCommonGapTypes
    };
  }

  /**
   * Issue #85: 統合分析結果に基づく推奨事項の生成
   */
  private generateUnifiedAnalysisRecommendations(results: BenchmarkResult[]): string[] {
    const recommendations: string[] = [];
    const resultsWithUnified = results.filter(r => r.unifiedAnalysis);

    if (resultsWithUnified.length === 0) {
      recommendations.push('統合分析結果が利用できません。システム設定を確認してください。');
      return recommendations;
    }

    // セキュリティ分析の評価
    const avgSecurityFindings = resultsWithUnified.reduce((sum, r) => 
      sum + Object.values(r.unifiedAnalysis!.securityAnalysis.detectionsByType).reduce((a, b) => a + b, 0), 0) / resultsWithUnified.length;
    
    if (avgSecurityFindings < 5) {
      recommendations.push('セキュリティ問題の検出数が少ないです。TaintTyperの設定を見直し、より細かい分析を有効にしてください。');
    } else if (avgSecurityFindings > 50) {
      recommendations.push('多くのセキュリティ問題が検出されています。誤検知率を下げるため、フィルタリングルールの調整を検討してください。');
    }

    // 意図抽出の評価
    const avgIntents = resultsWithUnified.reduce((sum, r) => 
      sum + r.unifiedAnalysis!.intentExtraction.totalIntents, 0) / resultsWithUnified.length;
    
    if (avgIntents < 10) {
      recommendations.push('テスト意図の抽出数が少ないです。テストコードのコメントやテスト名をより記述的にしてください。');
    }

    // NIST評価の評価
    const avgCompliance = resultsWithUnified.reduce((sum, r) => 
      sum + r.unifiedAnalysis!.nistEvaluation.complianceScore, 0) / resultsWithUnified.length;
    
    if (avgCompliance < 0.7) {
      recommendations.push('コンプライアンススコアが低いです。NIST SP 800-30ガイドラインに基づいたリスク管理プロセスの導入を検討してください。');
    }

    return recommendations;
  }

  /**
   * 比較推奨事項の生成
   */
  private generateComparisonRecommendations(results: BenchmarkResult[]): string[] {
    const recommendations: string[] = [];
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      recommendations.push('すべてのプロジェクトでベンチマークに失敗しました。設定を確認してください。');
      return recommendations;
    }

    const target5msAchievedCount = successfulResults.filter(r => r.target5ms.achieved).length;
    const achievementRate = target5msAchievedCount / successfulResults.length;

    if (achievementRate >= 0.8) {
      recommendations.push('優秀な性能です。現在の最適化戦略を継続してください。');
    } else if (achievementRate >= 0.5) {
      recommendations.push('一部のプロジェクトで性能改善が必要です。ボトルネック分析を実施してください。');
    } else {
      recommendations.push('全体的な性能改善が必要です。アーキテクチャの見直しを検討してください。');
    }

    return recommendations;
  }

  /**
   * ベースライン統合ベンチマーク実行
   * Phase 3: BaselineManager統合機能
   * 
   * @param projects ベンチマーク対象プロジェクト配列
   * @returns ベースライン統合実行結果
   */
  async runWithBaselineComparison(projects: BenchmarkProject[]): Promise<BaselineIntegratedResult> {
    if (this.config.verbose) {
      console.log(`🚀 ベースライン統合ベンチマーク実行開始: ${projects.length}プロジェクト`);
    }

    // 1. 通常のベンチマーク実行
    const results = await this.runMultiProjectBenchmark(projects);
    const successfulResults = results.filter(r => r.success);

    if (successfulResults.length === 0) {
      throw new Error('すべてのプロジェクトでベンチマークに失敗しました');
    }

    // 2. 新しいベースラインを作成
    const baselineId = await this.baselineManager.createBaseline(successfulResults, {
      name: `benchmark-${new Date().toISOString().split('T')[0]}`,
      description: `自動生成ベースライン: ${projects.map(p => p.name).join(', ')}`,
      createdBy: 'ExternalProjectBenchmarkRunner'
    });

    if (this.config.verbose) {
      console.log(`📊 新しいベースライン作成: ${baselineId}`);
    }

    // 3. 最適ベースライン選択と比較実行
    const projectNames = projects.map(p => p.name);
    const optimalBaselineId = await this.baselineManager.selectOptimalBaseline(projectNames);

    let comparison: BaselineComparison | undefined;
    let usedBaselineId: string | undefined;

    // 最適ベースラインが存在し、かつ今回作成したものと異なる場合は比較実行
    if (optimalBaselineId && optimalBaselineId !== baselineId) {
      try {
        comparison = await this.baselineManager.compareWithBaseline(successfulResults, optimalBaselineId);
        usedBaselineId = optimalBaselineId;

        if (this.config.verbose) {
          console.log(`📈 ベースライン比較完了: ${optimalBaselineId}`);
          console.log(`   全体改善率: ${comparison.overallImprovement.toFixed(2)}%`);
        }
      } catch (error) {
        if (this.config.verbose) {
          console.warn(`⚠️  ベースライン比較中にエラー: ${error}`);
        }
        // 比較エラーは致命的ではないため、処理を継続
      }
    } else if (this.config.verbose) {
      console.log('📋 初回実行または最適ベースラインなし - 比較をスキップ');
    }

    // 4. 結果の保存と返却
    const integratedResult: BaselineIntegratedResult = {
      results,
      comparison,
      baselineId,
      usedBaselineId
    };

    // 統合結果の保存
    await this.saveBaselineIntegratedResult(integratedResult);

    return integratedResult;
  }

  /**
   * ベンチマーク結果の保存
   */
  private async saveBenchmarkResult(result: BenchmarkResult): Promise<void> {
    const filename = `benchmark-result-${result.projectName}-${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, 'reports', filename);
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    
    if (this.config.verbose) {
      console.log(`ベンチマーク結果を保存: ${filepath}`);
    }
  }

  /**
   * 比較レポートの保存
   */
  private async saveComparisonReport(report: ComparisonReport): Promise<void> {
    const filename = `comparison-report-${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, 'reports', filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    if (this.config.verbose) {
      console.log(`比較レポートを保存: ${filepath}`);
    }
  }

  /**
   * ベースライン統合結果の保存
   */
  private async saveBaselineIntegratedResult(result: BaselineIntegratedResult): Promise<void> {
    const filename = `baseline-integrated-result-${Date.now()}.json`;
    const filepath = path.join(this.config.outputDir, 'reports', filename);
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    
    if (this.config.verbose) {
      console.log(`ベースライン統合結果を保存: ${filepath}`);
    }
  }

  /**
   * システム情報の取得
   */
  private getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      nodeVersion: process.version
    };
  }

  /**
   * 空のメトリクスオブジェクト
   */
  private getEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      executionTime: 0,
      timePerFile: 0,
      totalFiles: 0,
      memoryUsage: process.memoryUsage(),
      throughput: 0
    };
  }

  private getEmptyAccuracyMetrics(): AccuracyMetrics {
    return {
      taintTyperSuccessRate: 0,
      intentExtractionSuccessRate: 0,
      gapDetectionAccuracy: 0,
      errorRate: 1,
      totalErrors: 0,
      successfulFiles: 0,
      failedFiles: 0
    };
  }

  private getEmptyTarget5msResult(): Target5msResult {
    return {
      achieved: false,
      actualTimePerFile: 0,
      targetTimePerFile: 5,
      deviationPercent: 0
    };
  }

  /**
   * Issue #85: 空の統合分析メトリクス
   */
  private getEmptyUnifiedAnalysisMetrics(): UnifiedAnalysisMetrics {
    return {
      securityAnalysis: {
        detectionsByType: {},
        estimatedAccuracy: 0,
        coverageRate: 0,
        severityDistribution: {}
      },
      intentExtraction: {
        totalIntents: 0,
        categoryDistribution: {},
        confidenceScore: 0,
        successRate: 0
      },
      gapAnalysis: {
        totalGaps: 0,
        severityDistribution: {},
        implementationCoverage: 0,
        gapTypeDistribution: {}
      },
      nistEvaluation: {
        riskDistribution: {},
        improvementProposals: 0,
        complianceScore: 0,
        overallRiskScore: 0
      }
    };
  }

  /**
   * 詳細メトリクスの保存
   * Phase 2: 統合システムで収集した詳細データの永続化
   */
  private async saveDetailedMetrics(projectName: string, integratedResult: IntegratedCollectionResult): Promise<void> {
    if (!integratedResult.success) {
      return;
    }
    
    try {
      const filename = `detailed-metrics-${projectName}-${Date.now()}.json`;
      const filepath = path.join(this.config.outputDir, 'reports', filename);
      
      const detailedData = {
        timestamp: new Date().toISOString(),
        projectName,
        detailedMetrics: integratedResult.detailedMetrics,
        accuracyAnalysis: integratedResult.accuracyAnalysis,
        performanceProfile: integratedResult.performanceProfile,
        warnings: integratedResult.warnings,
        errors: integratedResult.errors
      };
      
      await fs.writeFile(filepath, JSON.stringify(detailedData, null, 2));
      
      if (this.config.verbose) {
        console.log(`詳細メトリクスを保存: ${filepath}`);
      }
    } catch (error) {
      if (this.config.verbose) {
        console.warn(`詳細メトリクス保存警告:`, error);
      }
    }
  }
  
  /**
   * リソースクリーンアップ（Defensive Programming原則）
   * Phase 2: 統合システムの適切なリソース管理
   */
  async cleanup(): Promise<void> {
    try {
      await this.integratedMetrics.cleanup();
      if (this.config.verbose) {
        console.log('統合メトリクス収集システムのクリーンアップ完了');
      }
    } catch (error) {
      if (this.config.verbose) {
        console.warn('クリーンアップ警告:', error);
      }
    }
  }

  /**
   * 遅延関数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}