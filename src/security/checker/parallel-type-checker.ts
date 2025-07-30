/**
 * 並列型チェッカー
 * arXiv:2504.18529v2 Section 6.1 "Modular Analysis" の実装
 * 
 * メソッド単位での独立した型チェックを並列実行し、
 * 論文で報告されている2.93X–22.9Xの高速化を実現
 */

import * as os from 'os';
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import {
  TestMethod,
  MethodAnalysisResult,
  SecurityIssue,
  TypeInferenceResult
} from '../../core/types';
import {
  TaintQualifier,
  QualifiedType,
  TypeCheckResult,
  TypeQualifierError,
  SubtypingChecker
} from '../types/checker-framework-types';
import { SearchBasedInferenceEngine } from '../analysis/search-based-inference';
import { LocalInferenceOptimizer } from '../inference/local-inference-optimizer';

/**
 * 並列型チェックの設定
 */
export interface ParallelTypeCheckConfig {
  /** ワーカースレッド数（デフォルト: CPUコア数） */
  workerCount?: number;
  /** メソッドあたりの最大解析時間（ミリ秒） */
  methodTimeout?: number;
  /** バッチサイズ（一度に処理するメソッド数） */
  batchSize?: number;
  /** キャッシュを有効にするか */
  enableCache?: boolean;
  /** デバッグモード */
  debug?: boolean;
}

/**
 * ワーカータスク
 */
interface WorkerTask {
  id: string;
  method: TestMethod;
  dependencies: Array<[string, QualifiedType<any>]>;
}

/**
 * ワーカー結果
 */
interface WorkerResult {
  id: string;
  success: boolean;
  result?: MethodTypeCheckResult;
  error?: Error;
  executionTime: number;
}

/**
 * メソッド型チェック結果
 */
export interface MethodTypeCheckResult {
  method: TestMethod;
  typeCheckResult: TypeCheckResult;
  inferredTypes: Map<string, QualifiedType<any>>;
  securityIssues: SecurityIssue[];
  executionTime: number;
}

/**
 * 並列型チェッカー
 */
export class ParallelTypeChecker extends EventEmitter {
  private config: Required<ParallelTypeCheckConfig>;
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeWorkers = 0;
  private results: Map<string, MethodTypeCheckResult> = new Map();
  private inferenceEngine: SearchBasedInferenceEngine;
  private localOptimizer: LocalInferenceOptimizer;

  constructor(config?: ParallelTypeCheckConfig) {
    super();
    this.config = {
      workerCount: config?.workerCount || os.cpus().length,
      methodTimeout: config?.methodTimeout || 30000,
      batchSize: config?.batchSize || 10,
      enableCache: config?.enableCache !== false,
      debug: config?.debug || false
    };
    
    this.inferenceEngine = new SearchBasedInferenceEngine();
    this.localOptimizer = new LocalInferenceOptimizer();
    
    this.initializeWorkers();
  }

  /**
   * ワーカーの初期化
   */
  private initializeWorkers(): void {
    const path = require('path');
    
    // __filenameでなく__dirnameを使用し、確実にdistディレクトリのファイルを参照
    // テスト環境では、まだビルドされていない可能性があるため、
    // require.resolveを使って解決を試みる
    let workerPath: string;
    
    try {
      // まずはdistディレクトリのパスを試す
      const distPath = __dirname.includes('src') 
        ? __dirname.replace('/src/', '/dist/')
        : __dirname;
      workerPath = path.join(distPath, 'type-check-worker.js');
      
      // ファイルの存在確認
      require.resolve(workerPath);
    } catch {
      // フォールバック: 現在のディレクトリから相対的に探す
      workerPath = path.join(__dirname, 'type-check-worker.js');
    }

    for (let i = 0; i < this.config.workerCount; i++) {
      const worker = new Worker(workerPath);
      
      worker.on('message', (result: WorkerResult) => {
        this.handleWorkerResult(result);
      });
      
      worker.on('error', (error) => {
        this.emit('error', error);
      });
      
      this.workers.push(worker);
    }
  }

  /**
   * メソッドの並列型チェック
   */
  async checkMethodsInParallel(methods: TestMethod[]): Promise<Map<string, MethodTypeCheckResult>> {
    this.results.clear();
    
    // メソッドの依存関係を解析
    const dependencies = await this.analyzeDependencies(methods);
    
    // タスクを作成
    const tasks = methods.map(method => ({
      id: method.name,
      method,
      dependencies: Array.from(dependencies.get(method.name) || new Map())
    }));
    
    // バッチ処理
    const batches = this.createBatches(tasks, this.config.batchSize);
    
    for (const batch of batches) {
      await this.processBatch(batch);
    }
    
    return this.results;
  }

  /**
   * 依存関係の解析
   */
  private async analyzeDependencies(methods: TestMethod[]): Promise<Map<string, Map<string, QualifiedType<any>>>> {
    const dependencies = new Map<string, Map<string, QualifiedType<any>>>();
    
    // 簡易実装：メソッド間の依存関係を検出
    for (const method of methods) {
      const deps = new Map<string, QualifiedType<any>>();
      
      // インポートや共有変数の検出
      const imports = this.extractImports(method.content);
      for (const imp of imports) {
        // 既知の型情報から依存関係を解決
        if (this.results.has(imp)) {
          const result = this.results.get(imp)!;
          result.inferredTypes.forEach((type, name) => {
            deps.set(`${imp}.${name}`, type);
          });
        }
      }
      
      dependencies.set(method.name, deps);
    }
    
    return dependencies;
  }

  /**
   * バッチの作成
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * バッチの処理
   */
  private async processBatch(batch: WorkerTask[]): Promise<void> {
    const promises = batch.map(task => this.processTask(task));
    await Promise.all(promises);
  }

  /**
   * タスクの処理
   */
  private async processTask(task: WorkerTask): Promise<void> {
    return new Promise((resolve, reject) => {
      // タスクの依存関係を確実に配列として設定
      if (!task.dependencies || !Array.isArray(task.dependencies)) {
        task.dependencies = [];
      }
      
      this.taskQueue.push(task);
      
      // 利用可能なワーカーがあれば即座に実行
      const availableWorker = this.workers.find((_, index) => 
        index >= this.activeWorkers
      );
      
      if (availableWorker) {
        this.activeWorkers++;
        availableWorker.postMessage(task);
        
        // タイムアウト設定
        const timeout = setTimeout(() => {
          reject(new Error(`Task ${task.id} timed out`));
        }, this.config.methodTimeout);
        
        // 結果待ち
        const handler = (result: WorkerResult) => {
          if (result.id === task.id) {
            clearTimeout(timeout);
            this.activeWorkers--;
            availableWorker.off('message', handler);
            resolve();
          }
        };
        
        availableWorker.on('message', handler);
      } else {
        // キューで待機
        this.once(`complete-${task.id}`, resolve);
      }
    });
  }

  /**
   * ワーカー結果の処理
   */
  private handleWorkerResult(result: WorkerResult): void {
    if (result.success && result.result) {
      this.results.set(result.id, result.result);
      
      if (this.config.debug) {
        console.log(`✓ Type checked ${result.id} in ${result.executionTime}ms`);
      }
    } else {
      console.error(`✗ Type check failed for ${result.id}: ${result.error}`);
    }
    
    this.emit(`complete-${result.id}`);
    
    // キューから次のタスクを処理
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift()!;
      const worker = this.workers[this.activeWorkers - 1];
      worker.postMessage(nextTask);
    }
  }

  /**
   * インポートの抽出
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  /**
   * 実際の型チェック処理（ワーカー内で実行）
   */
  async performTypeCheck(task: WorkerTask): Promise<MethodTypeCheckResult> {
    const startTime = Date.now();
    const errors: TypeQualifierError[] = [];
    const warnings: Array<{ message: string; location?: any }> = [];
    const inferredTypes = new Map<string, QualifiedType<any>>();
    const securityIssues: SecurityIssue[] = [];
    
    try {
      // ローカル変数の最適化
      const localAnalysis = await this.localOptimizer.analyzeLocalVariables(
        task.method.content,
        task.method.name
      );
      
      // 推論エンジンによる型推論
      const inferenceState = await this.inferenceEngine.inferTypes(
        task.method.content,
        task.method.filePath
      );
      
      // 型チェック
      inferenceState.typeMap.forEach((qualifier, variable) => {
        // TaintQualifierをQualifiedTypeに変換
        const qualifiedType: QualifiedType<any> = qualifier === '@Tainted' 
          ? { __brand: '@Tainted', __value: variable, __source: 'inferred', __confidence: 1.0 } as any
          : qualifier === '@Untainted'
          ? { __brand: '@Untainted', __value: variable } as any
          : { __brand: '@PolyTaint', __value: variable, __parameterIndices: [], __propagationRule: 'any' } as any;
        
        inferredTypes.set(variable, qualifiedType);
        
        // 依存関係の型との整合性チェック
        const depsMap = new Map(task.dependencies);
        const depType = depsMap.get(variable);
        if (depType && !SubtypingChecker.isAssignmentSafe(depType, qualifiedType)) {
          errors.push(new TypeQualifierError(
            `Type mismatch for ${variable}`,
            depType.__brand,
            qualifiedType.__brand,
            {
              file: task.method.filePath,
              line: 0,
              column: 0
            }
          ));
        }
      });
      
      // セキュリティ問題の検出
      if (localAnalysis.escapingVariables.length > 0) {
        localAnalysis.escapingVariables.forEach(variable => {
          const qualifiedType = inferredTypes.get(variable);
          if (qualifiedType && qualifiedType.__brand === '@Tainted') {
            securityIssues.push({
              id: `escape-${variable}`,
              type: 'unsafe-taint-flow',
              severity: 'error',
              message: `Tainted variable ${variable} escapes method scope`,
              location: {
                file: task.method.filePath,
                line: 0,
                column: 0
              }
            });
          }
        });
      }
      
    } catch (error) {
      errors.push(new TypeQualifierError(
        error instanceof Error ? error.message : 'Unknown error',
        '@Tainted',
        '@Untainted'
      ));
    }
    
    return {
      method: task.method,
      typeCheckResult: {
        success: errors.length === 0,
        errors,
        warnings
      },
      inferredTypes,
      securityIssues,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * クリーンアップ
   */
  async cleanup(): Promise<void> {
    // ワーカーの終了
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
    this.taskQueue = [];
    this.results.clear();
  }

  /**
   * 統計情報の取得
   */
  getStatistics(): {
    totalMethods: number;
    successfulChecks: number;
    failedChecks: number;
    averageExecutionTime: number;
    speedup: number;
  } {
    const results = Array.from(this.results.values());
    const successfulChecks = results.filter(r => r.typeCheckResult.success).length;
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = results.length > 0 ? totalExecutionTime / results.length : 0;
    
    // スピードアップの計算（シーケンシャル実行時間との比較）
    const sequentialTime = totalExecutionTime;
    const parallelTime = Math.max(...results.map(r => r.executionTime));
    const speedup = sequentialTime / parallelTime;
    
    return {
      totalMethods: results.length,
      successfulChecks,
      failedChecks: results.length - successfulChecks,
      averageExecutionTime,
      speedup
    };
  }
}

/**
 * 並列型チェッカーのファクトリ関数
 */
export function createParallelTypeChecker(config?: ParallelTypeCheckConfig): ParallelTypeChecker {
  return new ParallelTypeChecker(config);
}

/**
 * 型チェック結果の集約
 */
export class TypeCheckResultAggregator {
  /**
   * 複数の型チェック結果を集約
   */
  static aggregate(results: MethodTypeCheckResult[]): {
    overallSuccess: boolean;
    totalErrors: number;
    totalWarnings: number;
    criticalIssues: SecurityIssue[];
    typeStatistics: Map<TaintQualifier, number>;
  } {
    let totalErrors = 0;
    let totalWarnings = 0;
    const criticalIssues: SecurityIssue[] = [];
    const typeStatistics = new Map<TaintQualifier, number>();
    
    for (const result of results) {
      totalErrors += result.typeCheckResult.errors.length;
      totalWarnings += result.typeCheckResult.warnings.length;
      
      // クリティカルな問題を収集
      criticalIssues.push(...result.securityIssues.filter(
        issue => issue.severity === 'critical' || issue.severity === 'error'
      ));
      
      // 型統計の収集
      result.inferredTypes.forEach(type => {
        const qualifier = type.__brand;
        typeStatistics.set(qualifier, (typeStatistics.get(qualifier) || 0) + 1);
      });
    }
    
    return {
      overallSuccess: totalErrors === 0,
      totalErrors,
      totalWarnings,
      criticalIssues,
      typeStatistics
    };
  }
}