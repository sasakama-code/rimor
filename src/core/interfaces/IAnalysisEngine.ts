/**
 * Analysis Engine Interface
 * v0.9.0 - テスト意図実現度監査機能対応
 */

import { Issue } from '../types';
// 統一型定義をインポート
import { AnalysisResult as UnifiedAnalysisResult } from '../../types/analysis';

/**
 * ASTノード型定義（v0.9.0）
 */
export interface ASTNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children?: ASTNode[];
  isNamed?: boolean;
}

/**
 * 分析結果
 * 統一型を使用し、後方互換性のためにエクスポート
 */
export type AnalysisResult = UnifiedAnalysisResult;

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
   * AST生成（v0.9.0: Tree-sitter対応）
   */
  generateAST(filePath: string): Promise<ASTNode>;
  
  /**
   * キャッシュのクリア
   */
  clearCache?(): Promise<void>;
}