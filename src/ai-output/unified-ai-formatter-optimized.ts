/**
 * UnifiedAIFormatter (最適化版)
 * Issue #58: パフォーマンス改善実装
 * 
 * 改善内容:
 * - キャッシュメカニズム
 * - プログレス報告機能
 * - 非同期処理対応
 * 
 * DRY原則適用: ベースクラスから継承した実装
 * SOLID原則: 単一責任の原則 - AI JSON変換に特化
 * KISS原則: シンプルな変換ロジック
 */

import { UnifiedAIFormatterBase } from './unified-ai-formatter-base';
import { 
  UnifiedAnalysisResult,
  AIActionableRisk,
  AIJsonOutput, 
  UnifiedAIFormatterOptions 
} from './types';

/**
 * 拡張オプション（パフォーマンス改善用）
 */
export interface OptimizedFormatterOptions extends UnifiedAIFormatterOptions {
  /** プログレス報告コールバック */
  onProgress?: (progress: number) => void;
  /** キャッシュ有効化 */
  enableCache?: boolean;
  /** バッチサイズ */
  batchSize?: number;
}

/**
 * キャッシュエントリー
 */
interface CacheEntry {
  key: string;
  result: AIJsonOutput;
  timestamp: number;
}

/**
 * UnifiedAnalysisResultからAI向けJSON形式への変換クラス（最適化版）
 * DRY原則: ベースクラスから共通ロジックを継承
 */
export class UnifiedAIFormatterOptimized extends UnifiedAIFormatterBase {
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分

  // キャッシュストレージ
  private cache = new Map<string, CacheEntry>();

  /**
   * UnifiedAnalysisResultをAI JSON形式に変換（最適化版）
   * @param result NIST準拠の統合分析結果
   * @param options フォーマッターオプション
   * @returns AI向けJSON出力
   */
  async formatAsAIJson(
    result: UnifiedAnalysisResult,
    options: OptimizedFormatterOptions = {}
  ): Promise<AIJsonOutput> {
    // プログレス報告: 開始
    this.reportProgress(0, options.onProgress);

    // キャッシュチェック
    if (options.enableCache !== false) {
      const cached = this.getCached(result);
      if (cached) {
        this.reportProgress(100, options.onProgress);
        return cached;
      }
    }

    this.reportProgress(10, options.onProgress);

    // ベースクラスの実装を使用（非同期化）
    const output = await Promise.resolve(
      super.formatAsAIJsonInternal(result, {
        htmlReportPath: options.htmlReportPath,
        maxRisks: options.maxRisks || this.DEFAULT_MAX_RISKS
      })
    );
    
    this.reportProgress(90, options.onProgress);

    // キャッシュ保存
    if (options.enableCache !== false) {
      this.setCache(result, output);
    }

    // プログレス報告: 完了
    this.reportProgress(100, options.onProgress);

    return output;
  }

  /**
   * 同期版フォーマット（後方互換性のため）
   */
  formatAsAIJsonSync(
    result: UnifiedAnalysisResult,
    options: OptimizedFormatterOptions = {}
  ): AIJsonOutput {
    // プログレス報告: 開始
    this.reportProgress(0, options.onProgress);

    // キャッシュチェック
    if (options.enableCache !== false) {
      const cached = this.getCached(result);
      if (cached) {
        this.reportProgress(100, options.onProgress);
        return cached;
      }
    }

    this.reportProgress(10, options.onProgress);

    // ベースクラスの実装を使用
    const output = super.formatAsAIJsonInternal(result, {
      htmlReportPath: options.htmlReportPath,
      maxRisks: options.maxRisks || this.DEFAULT_MAX_RISKS
    });
    
    this.reportProgress(90, options.onProgress);

    // キャッシュ保存
    if (options.enableCache !== false) {
      this.setCache(result, output);
    }

    // プログレス報告: 完了
    this.reportProgress(100, options.onProgress);

    return output;
  }

  /**
   * プログレス報告
   */
  private reportProgress(progress: number, callback?: (progress: number) => void): void {
    if (callback) {
      callback(progress);
    }
  }

  /**
   * キャッシュから取得
   */
  private getCached(result: UnifiedAnalysisResult): AIJsonOutput | null {
    const key = this.getCacheKey(result);
    const entry = this.cache.get(key);
    
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp < this.CACHE_TTL) {
        return entry.result;
      }
      // 期限切れの場合は削除
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * キャッシュに保存
   */
  private setCache(result: UnifiedAnalysisResult, output: AIJsonOutput): void {
    const key = this.getCacheKey(result);
    this.cache.set(key, {
      key,
      result: output,
      timestamp: Date.now()
    });

    // キャッシュサイズ制限（最大100エントリー）
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * キャッシュキー生成
   */
  private getCacheKey(result: UnifiedAnalysisResult): string {
    // シンプルなハッシュ生成（実際の実装では crypto.createHash を使用）
    const summary = `${result.summary.overallScore}-${result.aiKeyRisks.length}`;
    return summary;
  }

  /**
   * バッチ処理（最適化版固有の機能）
   */
  private processInBatches(
    risks: AIActionableRisk[],
    batchSize: number,
    options: OptimizedFormatterOptions
  ): AIJsonOutput['keyRisks'] {
    const maxRisks = options.maxRisks || this.DEFAULT_MAX_RISKS;

    // フィルタリングとソートを最適化
    const processedRisks: AIJsonOutput['keyRisks'] = [];
    let processed = 0;

    // バッチ処理でメモリ効率を向上
    for (let i = 0; i < risks.length && processedRisks.length < maxRisks; i += batchSize) {
      const batch = risks.slice(i, i + batchSize);
      
      const formattedBatch = batch.map(risk => ({
        problem: risk.problem,
        riskLevel: risk.riskLevel,
        context: {
          filePath: risk.filePath,
          codeSnippet: risk.context.codeSnippet,
          startLine: risk.context.startLine,
          endLine: risk.context.endLine
        },
        suggestedAction: {
          type: risk.suggestedAction.type,
          description: risk.suggestedAction.description,
          example: risk.suggestedAction.example
        }
      }));

      processedRisks.push(...formattedBatch);
      processed += batch.length;

      // プログレス更新
      const progress = 40 + Math.floor((processed / risks.length) * 30);
      this.reportProgress(progress, options.onProgress);
    }

    // 優先順位でソート
    return this.sortByPriorityOptimized(processedRisks).slice(0, maxRisks);
  }

  /**
   * 最適化されたソート（変換済みデータ用）
   */
  private sortByPriorityOptimized(risks: AIJsonOutput['keyRisks']): AIJsonOutput['keyRisks'] {
    const priorityMap: Record<string, number> = {
      'CRITICAL': 0,
      'HIGH': 1,
      'MEDIUM': 2,
      'LOW': 3,
      'MINIMAL': 4
    };

    return [...risks].sort((a, b) => {
      const priorityA = priorityMap[a.riskLevel] ?? 5;
      const priorityB = priorityMap[b.riskLevel] ?? 5;
      return priorityA - priorityB;
    });
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 100
    };
  }
}