/**
 * ファイル分析結果キャッシュマネージャー
 * v0.3.0: インクリメンタル分析とパフォーマンス最適化
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Issue } from './types';
import { getMessage } from '../i18n/messages';
import { errorHandler } from '../utils/errorHandler';

export interface CacheEntry {
  filePath: string;
  fileHash: string;      // ファイル内容のハッシュ値
  fileSize: number;      // ファイルサイズ
  lastModified: number;  // 最終更新時刻（unixタイムスタンプ）
  pluginResults: Record<string, Issue[]>; // プラグイン名 -> 分析結果
  cachedAt: number;      // キャッシュ作成時刻
  accessCount: number;   // アクセス回数（LRU用）
  lastAccessed: number;  // 最終アクセス時刻（LRU用）
}

export interface CacheStatistics {
  totalEntries: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  totalSizeBytes: number;
  avgFileSize: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheOptions {
  enabled?: boolean;             // キャッシュ有効化フラグ
  maxEntries?: number;           // 最大エントリ数（デフォルト: 1000）
  maxSizeBytes?: number;         // 最大サイズ（バイト、デフォルト: 50MB）
  ttlMs?: number;                // TTL（ミリ秒、デフォルト: 1時間）
  persistToDisk?: boolean;       // ディスクへの永続化
  cacheDirectory?: string;       // キャッシュディレクトリ
  compressionEnabled?: boolean;  // 圧縮の有効化
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;
  private stats: CacheStatistics;
  private cacheFilePath: string;
  private initialized: boolean = false;
  
  private constructor(options: CacheOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      maxEntries: options.maxEntries ?? 1000,
      maxSizeBytes: options.maxSizeBytes ?? 50 * 1024 * 1024, // 50MB
      ttlMs: options.ttlMs ?? 60 * 60 * 1000, // 1時間
      persistToDisk: options.persistToDisk ?? true,
      cacheDirectory: options.cacheDirectory ?? path.join(process.cwd(), '.rimor-cache'),
      compressionEnabled: options.compressionEnabled ?? false
    };
    
    this.stats = {
      totalEntries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRatio: 0,
      totalSizeBytes: 0,
      avgFileSize: 0,
      oldestEntry: Date.now(),
      newestEntry: Date.now()
    };
    
    this.cacheFilePath = path.join(this.options.cacheDirectory, 'analysis-cache.json');
  }
  
  static getInstance(options?: CacheOptions): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(options);
    }
    return CacheManager.instance;
  }
  
  /**
   * 遅延初期化（レイジー初期化）
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized || !this.options.enabled) {
      return;
    }
    
    await this.initializeCache();
    this.initialized = true;
  }
  
  /**
   * キャッシュの初期化
   */
  private async initializeCache(): Promise<void> {
    try {
      if (this.options.persistToDisk) {
        await this.loadCacheFromDisk();
      }
      
      // 古いエントリを削除
      await this.cleanupExpiredEntries();
      
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        getMessage('cache.error.initialization'),
        { cacheDirectory: this.options.cacheDirectory },
        true
      );
    }
  }
  
  /**
   * ファイルの分析結果をキャッシュから取得
   */
  async get(filePath: string, pluginName: string): Promise<Issue[] | null> {
    if (!this.options.enabled) return null;
    
    await this.ensureInitialized();
    
    try {
      const fileStats = await fs.stat(filePath);
      const cacheKey = this.generateCacheKey(filePath);
      const entry = this.cache.get(cacheKey);
      
      if (!entry) {
        this.stats.cacheMisses++;
        return null;
      }
      
      // ファイルが変更されているかチェック
      if (this.isFileModified(entry, fileStats)) {
        this.cache.delete(cacheKey);
        this.stats.cacheMisses++;
        return null;
      }
      
      // TTLチェック
      if (this.isExpired(entry)) {
        this.cache.delete(cacheKey);
        this.stats.cacheMisses++;
        return null;
      }
      
      // プラグイン結果の取得
      const pluginResults = entry.pluginResults[pluginName];
      if (!pluginResults) {
        this.stats.cacheMisses++;
        return null;
      }
      
      // アクセス情報更新（LRU用）
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      this.stats.cacheHits++;
      this.updateHitRatio();
      
      return pluginResults;
      
    } catch (error) {
      errorHandler.handleFileError(error, filePath, 'cache_get');
      return null;
    }
  }
  
  /**
   * ファイルの分析結果をキャッシュに保存
   */
  async set(filePath: string, pluginName: string, results: Issue[]): Promise<void> {
    if (!this.options.enabled) return;
    
    await this.ensureInitialized();
    
    try {
      const fileStats = await fs.stat(filePath);
      const cacheKey = this.generateCacheKey(filePath);
      const fileHash = await this.calculateFileHash(filePath);
      
      let entry = this.cache.get(cacheKey);
      
      if (!entry) {
        entry = {
          filePath,
          fileHash,
          fileSize: fileStats.size,
          lastModified: fileStats.mtimeMs,
          pluginResults: {},
          cachedAt: Date.now(),
          accessCount: 1,
          lastAccessed: Date.now()
        };
        this.cache.set(cacheKey, entry);
        this.stats.totalEntries++;
      }
      
      // プラグイン結果を更新
      entry.pluginResults[pluginName] = results;
      entry.lastAccessed = Date.now();
      
      // サイズ統計更新
      this.updateSizeStatistics();
      
      // キャッシュサイズ制限チェック
      await this.enforceCacheLimits();
      
      // ディスクに永続化（同期）
      if (this.options.persistToDisk) {
        await this.saveCacheToDisk();
      }
      
    } catch (error) {
      errorHandler.handleFileError(error, filePath, 'cache_set');
    }
  }
  
  /**
   * 複数ファイルの分析結果を一括取得
   */
  async getBatch(requests: Array<{filePath: string, pluginName: string}>): Promise<Array<{
    filePath: string;
    pluginName: string;
    results: Issue[] | null;
    fromCache: boolean;
  }>> {
    const results = await Promise.all(
      requests.map(async (req) => {
        const results = await this.get(req.filePath, req.pluginName);
        return {
          filePath: req.filePath,
          pluginName: req.pluginName,
          results,
          fromCache: results !== null
        };
      })
    );
    
    return results;
  }
  
  /**
   * 複数ファイルの分析結果を一括保存
   */
  async setBatch(entries: Array<{
    filePath: string;
    pluginName: string;
    results: Issue[];
  }>): Promise<void> {
    await Promise.all(
      entries.map(entry => 
        this.set(entry.filePath, entry.pluginName, entry.results)
      )
    );
  }
  
  /**
   * 特定ファイルのキャッシュを無効化
   */
  async invalidate(filePath: string): Promise<void> {
    const cacheKey = this.generateCacheKey(filePath);
    const deleted = this.cache.delete(cacheKey);
    
    if (deleted) {
      this.stats.totalEntries--;
      this.updateSizeStatistics();
    }
  }
  
  /**
   * プロジェクト全体のキャッシュを無効化
   */
  async invalidateAll(): Promise<void> {
    this.cache.clear();
    this.stats.totalEntries = 0;
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
    this.stats.totalSizeBytes = 0;
    this.updateHitRatio();
    
    if (this.options.persistToDisk) {
      await this.deleteCacheFile();
    }
  }
  
  /**
   * キャッシュ統計の取得
   */
  getStatistics(): CacheStatistics {
    return { ...this.stats };
  }
  
  /**
   * キャッシュの詳細情報
   */
  getDetailedInfo(): {
    options: CacheOptions;
    statistics: CacheStatistics;
    entries: Array<{
      filePath: string;
      fileSize: number;
      pluginCount: number;
      lastAccessed: Date;
      age: number;
    }>;
  } {
    const entries = Array.from(this.cache.values()).map(entry => ({
      filePath: entry.filePath,
      fileSize: entry.fileSize,
      pluginCount: Object.keys(entry.pluginResults).length,
      lastAccessed: new Date(entry.lastAccessed),
      age: Date.now() - entry.cachedAt
    }));
    
    return {
      options: this.options,
      statistics: this.stats,
      entries: entries.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
    };
  }
  
  /**
   * プリウォーミング（事前キャッシュ）
   */
  async preWarm(filePaths: string[], pluginNames: string[]): Promise<void> {
    console.log(`キャッシュプリウォーミング開始: ${filePaths.length}ファイル × ${pluginNames.length}プラグイン`);
    
    const startTime = Date.now();
    const existingFiles = await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          await fs.access(filePath);
          return filePath;
        } catch {
          return null;
        }
      })
    );
    
    const validFiles = existingFiles.filter(Boolean) as string[];
    console.log(`有効ファイル: ${validFiles.length}/${filePaths.length}`);
    
    // バッチ処理でプリウォーミング
    const batchSize = 50;
    for (let i = 0; i < validFiles.length; i += batchSize) {
      const batch = validFiles.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (filePath) => {
          for (const pluginName of pluginNames) {
            await this.get(filePath, pluginName); // キャッシュミスは正常
          }
        })
      );
    }
    
    const elapsed = Date.now() - startTime;
    console.log(`プリウォーミング完了: ${elapsed}ms`);
  }
  
  // プライベートメソッド
  
  private generateCacheKey(filePath: string): string {
    return crypto.createHash('md5').update(path.resolve(filePath)).digest('hex');
  }
  
  private async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  private isFileModified(entry: CacheEntry, fileStats: fsSync.Stats): boolean {
    return entry.lastModified !== fileStats.mtimeMs || 
           entry.fileSize !== fileStats.size;
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return (Date.now() - entry.cachedAt) > this.options.ttlMs;
  }
  
  private updateHitRatio(): void {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.hitRatio = total > 0 ? this.stats.cacheHits / total : 0;
  }
  
  private updateSizeStatistics(): void {
    let totalSize = 0;
    let oldestTime = Date.now();
    let newestTime = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += entry.fileSize;
      oldestTime = Math.min(oldestTime, entry.cachedAt);
      newestTime = Math.max(newestTime, entry.cachedAt);
    }
    
    this.stats.totalSizeBytes = totalSize;
    this.stats.avgFileSize = this.stats.totalEntries > 0 ? totalSize / this.stats.totalEntries : 0;
    this.stats.oldestEntry = oldestTime;
    this.stats.newestEntry = newestTime;
  }
  
  private async enforceCacheLimits(): Promise<void> {
    // エントリ数制限
    if (this.cache.size > this.options.maxEntries) {
      await this.evictLRUEntries(this.cache.size - this.options.maxEntries);
    }
    
    // サイズ制限
    if (this.stats.totalSizeBytes > this.options.maxSizeBytes) {
      await this.evictBySize();
    }
  }
  
  private async evictLRUEntries(count: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    for (let i = 0; i < count && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.totalEntries--;
    }
    
    this.updateSizeStatistics();
  }
  
  private async evictBySize(): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    while (this.stats.totalSizeBytes > this.options.maxSizeBytes && entries.length > 0) {
      const [key] = entries.shift()!;
      this.cache.delete(key);
      this.stats.totalEntries--;
      this.updateSizeStatistics();
    }
  }
  
  private async cleanupExpiredEntries(): Promise<void> {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.stats.totalEntries--;
    }
    
    if (expiredKeys.length > 0) {
      this.updateSizeStatistics();
      console.log(`期限切れキャッシュエントリを${expiredKeys.length}件削除しました`);
    }
  }
  
  private async loadCacheFromDisk(): Promise<void> {
    try {
      await fs.mkdir(this.options.cacheDirectory, { recursive: true });
      
      if (!fsSync.existsSync(this.cacheFilePath)) {
        return;
      }
      
      const data = await fs.readFile(this.cacheFilePath, 'utf-8');
      const cacheData = JSON.parse(data);
      
      this.cache = new Map(cacheData.entries || []);
      this.stats = { ...this.stats, ...cacheData.stats };
      
      console.log(`ディスクから${this.cache.size}件のキャッシュエントリを読み込みました`);
      
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        getMessage('cache.error.read_failed'),
        { cacheFilePath: this.cacheFilePath },
        true
      );
    }
  }
  
  private async saveCacheToDisk(): Promise<void> {
    try {
      await fs.mkdir(this.options.cacheDirectory, { recursive: true });
      
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
        timestamp: Date.now()
      };
      
      await fs.writeFile(this.cacheFilePath, JSON.stringify(cacheData, null, 2));
      
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        getMessage('cache.error.save_failed'),
        { cacheFilePath: this.cacheFilePath },
        true
      );
    }
  }
  
  private async deleteCacheFile(): Promise<void> {
    try {
      if (fsSync.existsSync(this.cacheFilePath)) {
        await fs.unlink(this.cacheFilePath);
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        undefined,
        getMessage('cache.error.delete_failed'),
        { cacheFilePath: this.cacheFilePath },
        true
      );
    }
  }
}

/**
 * シングルトンインスタンスへの便利なアクセス
 */
export const cacheManager = CacheManager.getInstance();