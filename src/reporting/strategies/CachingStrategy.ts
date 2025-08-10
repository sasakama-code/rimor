/**
 * CachingStrategy
 * v0.9.0 - Issue #64: レポートシステムの統合
 * 
 * SOLID原則: 単一責任（キャッシュ機能のみ）
 * DRY原則: キャッシュロジックの再利用
 * KISS原則: シンプルなキャッシュ実装
 */

import { IFormattingStrategy, ReportGenerationOptions } from '../core/types';
import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';
import * as crypto from 'crypto';

/**
 * キャッシュエントリー
 */
interface CacheEntry {
  key: string;
  value: string | object;
  timestamp: number;
  hits: number;
}

/**
 * キャッシュ戦略デコレーター
 * 基底戦略をラップしてキャッシュ機能を追加
 */
export class CachingStrategy implements IFormattingStrategy {
  name: string;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize = 100;
  private readonly cacheTTL = 5 * 60 * 1000; // 5分
  private totalRequests = 0;
  private cacheHits = 0;

  constructor(private baseStrategy: IFormattingStrategy) {
    this.name = baseStrategy.name;
  }

  /**
   * キャッシュ付きフォーマット処理
   */
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): string | object {
    const cacheKey = this.generateCacheKey(result, options);
    this.totalRequests++;

    // キャッシュチェック
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.cacheHits++;
      return cached;
    }

    // キャッシュミスの場合、基底戦略で処理
    const formatted = this.baseStrategy.format(result, options);
    
    // 結果をキャッシュ
    this.putToCache(cacheKey, formatted);
    
    return formatted;
  }

  /**
   * 非同期版のキャッシュ付きフォーマット処理
   */
  async formatAsync(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object> {
    const cacheKey = this.generateCacheKey(result, options);
    this.totalRequests++;

    // キャッシュチェック
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.cacheHits++;
      return cached;
    }

    // キャッシュミスの場合、基底戦略で処理
    let formatted: string | object;
    
    if (this.baseStrategy.formatAsync) {
      formatted = await this.baseStrategy.formatAsync(result, options);
    } else {
      formatted = await Promise.resolve(this.baseStrategy.format(result, options));
    }
    
    // 結果をキャッシュ
    this.putToCache(cacheKey, formatted);
    
    return formatted;
  }

  /**
   * キャッシュヒット率を取得
   */
  getCacheHitRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.cacheHits / this.totalRequests) * 100;
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): object {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.getCacheHitRate(),
      totalRequests: this.totalRequests,
      cacheHits: this.cacheHits,
      cacheMisses: this.totalRequests - this.cacheHits
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * キャッシュキーを生成
   */
  private generateCacheKey(result: UnifiedAnalysisResult, options?: any): string {
    // 結果とオプションのハッシュを生成
    const data = {
      schemaVersion: result.schemaVersion,
      summary: result.summary,
      risksCount: result.aiKeyRisks?.length || 0,
      options: options
    };
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * キャッシュから取得
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // TTLチェック
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    // ヒット数を増やす
    entry.hits++;
    
    return entry.value;
  }

  /**
   * キャッシュに保存
   */
  private putToCache(key: string, value: any): void {
    // キャッシュサイズ制限チェック
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntry();
    }
    
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      hits: 0
    };
    
    this.cache.set(key, entry);
  }

  /**
   * 最も古いエントリーを削除（LRU）
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    // Map.entriesのイテレーターを配列に変換
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}