/**
 * Analysis Engine Interface
 * v0.8.0 - 統合された分析エンジンのインターフェース定義
 */

import { Issue } from '../types';

/**
 * 分析結果
 */
export interface AnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  metadata?: {
    parallelProcessed?: boolean;
    cacheUtilized?: boolean;
    filesFromCache?: number;
    filesAnalyzed?: number;
  };
}

/**
 * 分析オプション
 */
export interface AnalysisOptions {
  parallel?: boolean;
  cache?: boolean;
  concurrency?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
}

/**
 * 統合分析エンジンインターフェース
 * 従来の3つのAnalyzer（Analyzer, ParallelAnalyzer, CachedAnalyzer）を統合
 */
export interface IAnalysisEngine {
  /**
   * 指定されたパスを分析
   */
  analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult>;
  
  /**
   * AST生成（将来の拡張用）
   */
  generateAST?(filePath: string): Promise<any>;
  
  /**
   * キャッシュのクリア
   */
  clearCache?(): Promise<void>;
}