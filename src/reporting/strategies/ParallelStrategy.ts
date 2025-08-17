/**
 * ParallelStrategy
 * v0.9.0 - Issue #64: レポートシステムの統合
 * 
 * SOLID原則: 単一責任（並列処理機能のみ）
 * DRY原則: 並列処理ロジックの再利用
 * KISS原則: シンプルな並列実装
 */

import { IFormattingStrategy } from '../core/types';
import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';
import { Worker } from 'worker_threads';
import * as os from 'os';

/**
 * 並列処理戦略デコレーター
 * 基底戦略をラップして並列処理機能を追加
 */
export class ParallelStrategy implements IFormattingStrategy {
  name: string;
  private readonly maxWorkers: number;
  private workerPool: Worker[] = [];
  private taskQueue: Array<{
    resolve: (value: UnifiedAnalysisResult) => void;
    reject: (error: Error) => void;
    data: UnifiedAnalysisResult;
  }> = [];
  private activeWorkers = 0;

  constructor(
    private baseStrategy: IFormattingStrategy,
    maxWorkers?: number
  ) {
    this.name = baseStrategy.name;
    // CPUコア数に基づいてワーカー数を決定
    this.maxWorkers = maxWorkers || Math.max(1, os.cpus().length - 1);
  }

  /**
   * 並列処理でフォーマット
   */
  format(result: UnifiedAnalysisResult, options?: Record<string, unknown>): UnifiedAnalysisResult {
    // 同期版は基底戦略をそのまま使用
    // （並列処理の利点が少ないため）
    return this.baseStrategy.format(result, options);
  }

  /**
   * 非同期版の並列処理フォーマット
   */
  async formatAsync(result: UnifiedAnalysisResult, options?: Record<string, unknown>): Promise<UnifiedAnalysisResult> {
    // 小さいデータの場合は直接処理
    if (this.isSmallData(result)) {
      if (this.baseStrategy.formatAsync) {
        return this.baseStrategy.formatAsync(result, options);
      }
      return Promise.resolve(this.baseStrategy.format(result, options));
    }

    // 大きいデータの場合は並列処理
    return this.processInParallel(result, options);
  }

  /**
   * 並列処理の統計を取得
   */
  getParallelStats(): Record<string, unknown> {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeWorkers,
      queueLength: this.taskQueue.length,
      workerPoolSize: this.workerPool.length
    };
  }

  /**
   * ワーカープールを終了
   */
  async terminate(): Promise<void> {
    const terminatePromises = this.workerPool.map(worker => 
      worker.terminate()
    );
    await Promise.all(terminatePromises);
    this.workerPool = [];
    this.activeWorkers = 0;
  }

  /**
   * データサイズが小さいか判定
   */
  private isSmallData(result: UnifiedAnalysisResult): boolean {
    // リスクが10件未満の場合は小さいデータとみなす
    const risksCount = result.aiKeyRisks?.length || 0;
    return risksCount < 10;
  }

  /**
   * 並列処理を実行
   */
  private async processInParallel(
    result: UnifiedAnalysisResult, 
    options?: Record<string, unknown>
  ): Promise<UnifiedAnalysisResult> {
    // データを分割
    const chunks = this.splitData(result);
    
    if (chunks.length === 1) {
      // 分割不要の場合は通常処理
      if (this.baseStrategy.formatAsync) {
        return this.baseStrategy.formatAsync(result, options);
      }
      return Promise.resolve(this.baseStrategy.format(result, options));
    }

    // 各チャンクを並列処理
    const processedChunks = await Promise.all(
      chunks.map(chunk => this.processChunk(chunk, options))
    );

    // 結果を結合
    return this.mergeResults(processedChunks, result);
  }

  /**
   * データを分割
   */
  private splitData(result: UnifiedAnalysisResult): UnifiedAnalysisResult[] {
    const risks = result.aiKeyRisks || [];
    
    if (risks.length <= 10) {
      return [result];
    }

    // リスクを均等に分割
    const chunkSize = Math.ceil(risks.length / this.maxWorkers);
    const chunks: UnifiedAnalysisResult[] = [];
    
    for (let i = 0; i < risks.length; i += chunkSize) {
      const chunkRisks = risks.slice(i, i + chunkSize);
      chunks.push({
        ...result,
        aiKeyRisks: chunkRisks
      });
    }
    
    return chunks;
  }

  /**
   * チャンクを処理
   */
  private async processChunk(
    chunk: UnifiedAnalysisResult,
    options?: Record<string, unknown>
  ): Promise<UnifiedAnalysisResult> {
    // 実際のワーカー実装の代わりに、
    // ここでは基底戦略を直接使用（簡略化）
    if (this.baseStrategy.formatAsync) {
      return this.baseStrategy.formatAsync(chunk, options);
    }
    return Promise.resolve(this.baseStrategy.format(chunk, options));
  }

  /**
   * 結果を結合
   */
  private mergeResults(
    processedChunks: UnifiedAnalysisResult[], 
    originalResult: UnifiedAnalysisResult
  ): UnifiedAnalysisResult {
    // 戦略に応じた結合処理
    const strategyName = this.baseStrategy.name;
    
    switch (strategyName) {
      case 'ai-json':
        return this.mergeAIJsonResults(processedChunks, originalResult);
      
      case 'markdown':
        return this.mergeMarkdownResults(processedChunks);
      
      case 'html':
        return this.mergeHtmlResults(processedChunks, originalResult);
      
      default:
        // デフォルトは最初のチャンクを返す
        return processedChunks[0];
    }
  }

  /**
   * AI JSON結果を結合
   */
  private mergeAIJsonResults(chunks: UnifiedAnalysisResult[], original: UnifiedAnalysisResult): UnifiedAnalysisResult {
    const keyRisks: Array<Record<string, unknown>> = [];
    
    chunks.forEach(chunk => {
      if (chunk.keyRisks) {
        keyRisks.push(...chunk.keyRisks);
      }
    });
    
    return {
      overallAssessment: chunks[0].overallAssessment,
      keyRisks,
      fullReportUrl: chunks[0].fullReportUrl
    };
  }

  /**
   * Markdown結果を結合
   */
  private mergeMarkdownResults(chunks: string[]): string {
    // 最初のチャンクのヘッダーを使用し、
    // 残りのチャンクからリスク部分を抽出して結合
    if (chunks.length === 0) return '';
    
    const firstChunk = chunks[0];
    const additionalRisks = chunks.slice(1)
      .map(chunk => {
        // "## 主要なリスク"セクションを抽出
        const riskMatch = chunk.match(/## 主要なリスク[\s\S]*?(?=##|$)/);
        return riskMatch ? riskMatch[0] : '';
      })
      .filter(Boolean)
      .join('\n');
    
    return firstChunk + '\n' + additionalRisks;
  }

  /**
   * HTML結果を結合
   */
  private mergeHtmlResults(chunks: string[], original: UnifiedAnalysisResult): string {
    // 最初のチャンクをベースとして使用
    // （実際の実装では、より高度な結合ロジックが必要）
    return chunks[0];
  }
}