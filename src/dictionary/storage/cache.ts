import * as fs from 'fs';
import * as path from 'path';
import { CachedEntry } from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * 辞書システム用キャッシュマネージャー
 * L1(メモリ) + L2(ディスク)の2段階キャッシュを実装
 */
export class DictionaryCache {
  private memoryCache: Map<string, CachedEntry> = new Map();
  private maxMemoryEntries: number;
  private defaultTTL: number; // TTL in milliseconds
  private diskCacheDir: string;
  private diskCacheEnabled: boolean;

  constructor(options: {
    maxMemoryEntries?: number;
    defaultTTL?: number; // in minutes
    diskCacheDir?: string;
    diskCacheEnabled?: boolean;
  } = {}) {
    this.maxMemoryEntries = options.maxMemoryEntries || 1000;
    this.defaultTTL = (options.defaultTTL || 60) * 60 * 1000; // Convert minutes to milliseconds
    this.diskCacheDir = options.diskCacheDir || path.join(process.cwd(), '.rimor', 'cache');
    this.diskCacheEnabled = options.diskCacheEnabled !== false;

    // ディスクキャッシュディレクトリの作成
    if (this.diskCacheEnabled && !fs.existsSync(this.diskCacheDir)) {
      fs.mkdirSync(this.diskCacheDir, { recursive: true });
    }
  }

  /**
   * キャッシュからデータを取得
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // L1: メモリキャッシュから取得
      const memoryEntry = this.getFromMemory(key);
      if (memoryEntry) {
        return memoryEntry as T;
      }

      // L2: ディスクキャッシュから取得
      if (this.diskCacheEnabled) {
        const diskEntry = await this.getFromDisk(key);
        if (diskEntry) {
          // メモリキャッシュにも保存
          this.setInMemory(key, diskEntry, diskEntry.ttl);
          return diskEntry.value as T;
        }
      }

      return null;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュ取得に失敗しました');
      return null;
    }
  }

  /**
   * キャッシュにデータを保存
   */
  async set<T>(key: string, value: T, ttlMinutes?: number): Promise<void> {
    try {
      const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.defaultTTL;

      // L1: メモリキャッシュに保存
      this.setInMemory(key, value, ttl);

      // L2: ディスクキャッシュに保存
      if (this.diskCacheEnabled) {
        await this.setOnDisk(key, value, ttl);
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュ保存に失敗しました');
    }
  }

  /**
   * キャッシュからデータを削除
   */
  async delete(key: string): Promise<void> {
    try {
      // メモリキャッシュから削除
      this.memoryCache.delete(key);

      // ディスクキャッシュから削除
      if (this.diskCacheEnabled) {
        const diskPath = this.getDiskPath(key);
        if (fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュ削除に失敗しました');
    }
  }

  /**
   * キーの存在確認
   */
  async has(key: string): Promise<boolean> {
    try {
      // メモリキャッシュをチェック
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key)!;
        if (!this.isExpired(entry)) {
          return true;
        }
      }

      // ディスクキャッシュをチェック
      if (this.diskCacheEnabled) {
        const diskPath = this.getDiskPath(key);
        if (fs.existsSync(diskPath)) {
          const entry = await this.loadDiskEntry(diskPath);
          return entry !== null && !this.isExpired(entry);
        }
      }

      return false;
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュ存在確認に失敗しました');
      return false;
    }
  }

  /**
   * 全キャッシュをクリア
   */
  async clear(): Promise<void> {
    try {
      // メモリキャッシュをクリア
      this.memoryCache.clear();

      // ディスクキャッシュをクリア
      if (this.diskCacheEnabled && fs.existsSync(this.diskCacheDir)) {
        const files = fs.readdirSync(this.diskCacheDir);
        for (const file of files) {
          if (file.endsWith('.cache')) {
            fs.unlinkSync(path.join(this.diskCacheDir, file));
          }
        }
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュクリアに失敗しました');
    }
  }

  /**
   * 期限切れエントリの削除
   */
  async cleanup(): Promise<void> {
    try {
      // メモリキャッシュのクリーンアップ
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
        }
      }

      // ディスクキャッシュのクリーンアップ
      if (this.diskCacheEnabled && fs.existsSync(this.diskCacheDir)) {
        const files = fs.readdirSync(this.diskCacheDir);
        for (const file of files) {
          if (file.endsWith('.cache')) {
            const filePath = path.join(this.diskCacheDir, file);
            const entry = await this.loadDiskEntry(filePath);
            if (!entry || this.isExpired(entry)) {
              fs.unlinkSync(filePath);
            }
          }
        }
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュクリーンアップに失敗しました');
    }
  }

  /**
   * キャッシュ統計情報の取得
   */
  getStats(): {
    memoryEntries: number;
    diskEntries: number;
    memorySize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    hitRatio: number;
  } {
    try {
      let diskEntries = 0;
      let oldestEntry: Date | null = null;
      let newestEntry: Date | null = null;

      // ディスクキャッシュのエントリ数を取得
      if (this.diskCacheEnabled && fs.existsSync(this.diskCacheDir)) {
        const files = fs.readdirSync(this.diskCacheDir);
        diskEntries = files.filter(file => file.endsWith('.cache')).length;
      }

      // メモリキャッシュの統計
      for (const entry of this.memoryCache.values()) {
        if (!oldestEntry || entry.timestamp < oldestEntry) {
          oldestEntry = entry.timestamp;
        }
        if (!newestEntry || entry.timestamp > newestEntry) {
          newestEntry = entry.timestamp;
        }
      }

      // メモリサイズの概算（JSON文字列長ベース）
      const memorySize = Array.from(this.memoryCache.values()).reduce((total, entry) => {
        return total + JSON.stringify(entry.value).length;
      }, 0);

      // ヒット率の計算（簡易的）
      const totalAccesses = Array.from(this.memoryCache.values()).reduce((total, entry) => {
        return total + entry.accessCount;
      }, 0);
      const hitRatio = totalAccesses > 0 ? this.memoryCache.size / totalAccesses : 0;

      return {
        memoryEntries: this.memoryCache.size,
        diskEntries,
        memorySize,
        oldestEntry,
        newestEntry,
        hitRatio
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'キャッシュ統計取得に失敗しました');
      return {
        memoryEntries: 0,
        diskEntries: 0,
        memorySize: 0,
        oldestEntry: null,
        newestEntry: null,
        hitRatio: 0
      };
    }
  }

  /**
   * メモリキャッシュサイズの制限設定
   */
  setMaxMemoryEntries(max: number): void {
    this.maxMemoryEntries = max;
    this.enforceMemoryLimit();
  }

  /**
   * TTLの設定
   */
  setDefaultTTL(ttlMinutes: number): void {
    this.defaultTTL = ttlMinutes * 60 * 1000;
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * メモリキャッシュから取得
   */
  private getFromMemory(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.memoryCache.delete(key);
      return null;
    }

    // アクセス回数を更新
    entry.accessCount++;
    return entry.value;
  }

  /**
   * メモリキャッシュに保存
   */
  private setInMemory(key: string, value: any, ttl: number): void {
    const entry: CachedEntry = {
      key,
      value,
      timestamp: new Date(),
      ttl,
      accessCount: 0
    };

    this.memoryCache.set(key, entry);
    this.enforceMemoryLimit();
  }

  /**
   * ディスクキャッシュから取得
   */
  private async getFromDisk(key: string): Promise<CachedEntry | null> {
    try {
      const diskPath = this.getDiskPath(key);
      if (!fs.existsSync(diskPath)) return null;

      const entry = await this.loadDiskEntry(diskPath);
      if (!entry || this.isExpired(entry)) {
        if (fs.existsSync(diskPath)) {
          fs.unlinkSync(diskPath);
        }
        return null;
      }

      return entry;
    } catch (error) {
      return null;
    }
  }

  /**
   * ディスクキャッシュに保存
   */
  private async setOnDisk(key: string, value: any, ttl: number): Promise<void> {
    try {
      const entry: CachedEntry = {
        key,
        value,
        timestamp: new Date(),
        ttl,
        accessCount: 0
      };

      const diskPath = this.getDiskPath(key);
      const entryData = JSON.stringify(entry);
      fs.writeFileSync(diskPath, entryData, 'utf-8');
    } catch (error) {
      // ディスクキャッシュの保存エラーは無視（メモリキャッシュは有効）
    }
  }

  /**
   * ディスクキャッシュエントリの読み込み
   */
  private async loadDiskEntry(filePath: string): Promise<CachedEntry | null> {
    try {
      const entryData = fs.readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(entryData) as CachedEntry;
      
      // 日付オブジェクトの復元
      entry.timestamp = new Date(entry.timestamp);
      
      return entry;
    } catch (error) {
      return null;
    }
  }

  /**
   * ディスクキャッシュのファイルパス生成
   */
  private getDiskPath(key: string): string {
    // キーをファイル名として安全な形式に変換
    const safeKey = key.replace(/[^a-zA-Z0-9\-_]/g, '_');
    return path.join(this.diskCacheDir, `${safeKey}.cache`);
  }

  /**
   * エントリの期限切れ判定
   */
  private isExpired(entry: CachedEntry): boolean {
    const now = Date.now();
    const expirationTime = entry.timestamp.getTime() + entry.ttl;
    return now > expirationTime;
  }

  /**
   * メモリキャッシュのサイズ制限を強制
   */
  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= this.maxMemoryEntries) return;

    // LRU（Least Recently Used）アルゴリズムで古いエントリを削除
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => {
      // アクセス回数と時刻を考慮したLRUスコア
      const scoreA = a[1].accessCount * 0.7 + a[1].timestamp.getTime() * 0.3;
      const scoreB = b[1].accessCount * 0.7 + b[1].timestamp.getTime() * 0.3;
      return scoreA - scoreB;
    });

    // 最も使用頻度の低いエントリから削除
    const entriesToRemove = entries.slice(0, this.memoryCache.size - this.maxMemoryEntries + 1);
    for (const [key] of entriesToRemove) {
      this.memoryCache.delete(key);
    }
  }
}

/**
 * 辞書専用キャッシュマネージャー
 * 辞書の用語やルールに特化したキャッシング
 */
export class DictionarySpecificCache extends DictionaryCache {
  private termCache: Map<string, any> = new Map();
  private ruleCache: Map<string, any> = new Map();
  private analysisCache: Map<string, any> = new Map();

  constructor(options?: any) {
    super({
      maxMemoryEntries: 500,
      defaultTTL: 30, // 30 minutes
      diskCacheDir: path.join(process.cwd(), '.rimor', 'dictionary-cache'),
      ...options
    });
  }

  /**
   * 用語のキャッシュ
   */
  async cacheTerm(termId: string, term: any): Promise<void> {
    this.termCache.set(termId, term);
    await this.set(`term:${termId}`, term, 60); // 1 hour TTL
  }

  /**
   * ルールのキャッシュ
   */
  async cacheRule(ruleId: string, rule: any): Promise<void> {
    this.ruleCache.set(ruleId, rule);
    await this.set(`rule:${ruleId}`, rule, 60); // 1 hour TTL
  }

  /**
   * 分析結果のキャッシュ
   */
  async cacheAnalysis(fileHash: string, analysis: any): Promise<void> {
    this.analysisCache.set(fileHash, analysis);
    await this.set(`analysis:${fileHash}`, analysis, 15); // 15 minutes TTL
  }

  /**
   * 用語の取得
   */
  async getTerm(termId: string): Promise<any | null> {
    // メモリから取得
    if (this.termCache.has(termId)) {
      return this.termCache.get(termId);
    }

    // 一般キャッシュから取得
    const term = await this.get(`term:${termId}`);
    if (term) {
      this.termCache.set(termId, term);
    }
    return term;
  }

  /**
   * ルールの取得
   */
  async getRule(ruleId: string): Promise<any | null> {
    // メモリから取得
    if (this.ruleCache.has(ruleId)) {
      return this.ruleCache.get(ruleId);
    }

    // 一般キャッシュから取得
    const rule = await this.get(`rule:${ruleId}`);
    if (rule) {
      this.ruleCache.set(ruleId, rule);
    }
    return rule;
  }

  /**
   * 分析結果の取得
   */
  async getAnalysis(fileHash: string): Promise<any | null> {
    // メモリから取得
    if (this.analysisCache.has(fileHash)) {
      return this.analysisCache.get(fileHash);
    }

    // 一般キャッシュから取得
    const analysis = await this.get(`analysis:${fileHash}`);
    if (analysis) {
      this.analysisCache.set(fileHash, analysis);
    }
    return analysis;
  }

  /**
   * 辞書特化クリーンアップ
   */
  async cleanupDictionaryCache(): Promise<void> {
    this.termCache.clear();
    this.ruleCache.clear();
    this.analysisCache.clear();
    await this.cleanup();
  }

  /**
   * 辞書キャッシュ統計
   */
  getDictionaryStats(): {
    general: any;
    terms: number;
    rules: number;
    analyses: number;
  } {
    return {
      general: this.getStats(),
      terms: this.termCache.size,
      rules: this.ruleCache.size,
      analyses: this.analysisCache.size
    };
  }
}