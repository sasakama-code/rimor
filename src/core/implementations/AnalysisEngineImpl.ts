/**
 * Analysis Engine Implementation
 * v0.8.0 - 既存のAnalyzerクラスをDI対応にラップ
 */

import { injectable } from 'inversify';
import { IAnalysisEngine, AnalysisResult, AnalysisOptions } from '../interfaces/IAnalysisEngine';
import { Analyzer } from '../analyzer';
import { ParallelAnalyzer } from '../parallelAnalyzer';
import { CachedAnalyzer } from '../cachedAnalyzer';

@injectable()
export class AnalysisEngineImpl implements IAnalysisEngine {
  private analyzer: Analyzer | ParallelAnalyzer | CachedAnalyzer;
  
  constructor() {
    // デフォルトは基本のAnalyzer
    this.analyzer = new Analyzer();
  }
  
  async analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult> {
    // オプションに基づいて適切なAnalyzerを選択
    if (options?.cache) {
      this.analyzer = new CachedAnalyzer({
        enableCache: true,
        showCacheStats: false,
        enablePerformanceMonitoring: false,
        showPerformanceReport: false
      });
    } else if (options?.parallel) {
      this.analyzer = new ParallelAnalyzer({
        maxConcurrency: options.concurrency,
        enableStats: false
      });
    } else {
      this.analyzer = new Analyzer();
    }
    
    const result = await this.analyzer.analyze(targetPath);
    
    return {
      totalFiles: result.totalFiles,
      issues: result.issues,
      executionTime: result.executionTime,
      metadata: {
        parallelProcessed: options?.parallel,
        cacheUtilized: options?.cache,
        filesFromCache: (result as any).cacheStats?.filesFromCache,
        filesAnalyzed: (result as any).cacheStats?.filesAnalyzed
      }
    };
  }
  
  async clearCache(): Promise<void> {
    if (this.analyzer instanceof CachedAnalyzer) {
      await this.analyzer.clearCache();
    }
  }
}