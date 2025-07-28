/**
 * Report Cache
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * レポート生成結果のキャッシュ管理
 */

import { injectable } from 'inversify';
import * as crypto from 'crypto';
import { StructuredAnalysisResult } from '../types';

interface CacheEntry {
  key: string;
  value: string;
  timestamp: number;
  ttl: number;
}

@injectable()
export class ReportCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultTTL = 3600000; // 1時間
  private readonly maxSize = 100; // 最大エントリ数
  
  /**
   * キャッシュキーを生成
   */
  generateKey(
    data: StructuredAnalysisResult,
    format: string,
    options?: any
  ): string {
    const content = JSON.stringify({
      data: this.extractKeyData(data),
      format,
      options
    });
    
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16);
  }
  
  /**
   * キャッシュから取得
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // TTLチェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  /**
   * キャッシュに保存
   */
  set(key: string, value: string, ttl?: number): void {
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * キャッシュサイズを取得
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * 最も古いエントリを削除
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * キー生成用のデータを抽出（メタデータを除外）
   */
  private extractKeyData(data: StructuredAnalysisResult): any {
    const { metadata, ...rest } = data;
    return {
      ...rest,
      // タイムスタンプと実行時間を除外
      metadata: {
        version: metadata.version,
        analyzedPath: metadata.analyzedPath
      }
    };
  }
  
  /**
   * キャッシュ統計を取得
   */
  getStats(): {
    size: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    // 簡易的な統計（実際の実装では詳細な統計を記録）
    return {
      size: this.cache.size,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }
}