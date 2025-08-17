/**
 * 統一された分析結果型定義
 * 
 * SOLID原則に従い、インターフェース分離原則（ISP）と
 * 単一責任原則（SRP）を適用した設計
 */

import type { Issue } from '../../core/types/core-definitions';

/**
 * 分析結果の基本インターフェース
 * すべての分析結果型の基底となる最小限の構造
 * 
 * KISS原則: シンプルで必要最小限のフィールドのみ
 * 
 * @example
 * ```typescript
 * const result: BaseAnalysisResult = {
 *   totalFiles: 10,
 *   issues: [],
 *   executionTime: 1500
 * };
 * ```
 */
export interface BaseAnalysisResult {
  /** 分析されたファイル数 */
  totalFiles: number;
  
  /** 検出された問題のリスト */
  issues: Issue[];
  
  /** 実行時間（ミリ秒） */
  executionTime: number;
}

/**
 * メタデータを持つ分析結果
 * オプショナルな追加情報をサポート
 */
export interface AnalysisResultWithMetadata {
  /** 分析のメタデータ */
  metadata?: {
    /** 開始時刻 */
    startTime?: string;
    /** 終了時刻 */
    endTime?: string;
    /** バージョン情報 */
    version?: string;
    /** その他のメタデータ */
    [key: string]: unknown;
  };
}

/**
 * プラグイン情報を持つ分析結果
 * プラグインシステムとの統合をサポート
 */
export interface AnalysisResultWithPlugins {
  /** 実行されたプラグインのリスト */
  pluginsExecuted?: string[];
  /** プラグイン固有の結果 */
  pluginResults?: Record<string, any>;
}

/**
 * 並列処理統計を持つ分析結果
 * パフォーマンス最適化のための情報
 */
export interface AnalysisResultWithParallelStats extends BaseAnalysisResult {
  /** 並列処理の統計情報 */
  parallelStats?: {
    /** バッチ数 */
    batchCount: number;
    /** 使用されたスレッド数 */
    threadsUsed?: number;
    /** 速度向上率 */
    speedup?: number;
    /** 平均バッチ時間 */
    avgBatchTime?: number;
    /** 最大バッチ時間 */
    maxBatchTime?: number;
    /** 並行レベル */
    concurrencyLevel?: number;
    /** その他の統計 */
    [key: string]: unknown;
  };
}

/**
 * ファイル別の分析結果
 * 個別ファイルの詳細情報を含む
 */
export interface FileAnalysisResult extends BaseAnalysisResult {
  /** ファイルの絶対パス */
  filePath: string;
  /** プロジェクトルートからの相対パス */
  relativePath?: string;
  /** ファイル固有のメタデータ */
  fileMetadata?: {
    /** ファイルサイズ（バイト） */
    size?: number;
    /** 最終更新日時 */
    lastModified?: string;
    /** ファイルのハッシュ値 */
    hash?: string;
  };
}

/**
 * 統一された分析結果型
 * すべてのオプショナル機能を含む包括的な型
 * 
 * DRY原則: 既存の型を組み合わせて重複を避ける
 */
export interface AnalysisResult extends 
  BaseAnalysisResult,
  AnalysisResultWithMetadata,
  AnalysisResultWithPlugins,
  AnalysisResultWithParallelStats {
  /** ファイル別の詳細結果（オプション） */
  files?: Array<{
    path: string;
    issues: Issue[];
  }>;
}

/**
 * 型ガード: オブジェクトがAnalysisResultかどうかを判定
 * Defensive Programming: 実行時の型安全性を確保
 */
export function isAnalysisResult(obj: unknown): obj is AnalysisResult {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.totalFiles === 'number' &&
    Array.isArray(obj.issues) &&
    typeof obj.executionTime === 'number';
}

/**
 * 型ガード: プラグインメタデータを持つかどうかを判定
 */
export function hasPluginMetadata(obj: unknown): obj is AnalysisResultWithPlugins {
  return obj &&
    typeof obj === 'object' &&
    (obj.pluginsExecuted === undefined || Array.isArray(obj.pluginsExecuted)) &&
    (obj.pluginResults === undefined || typeof obj.pluginResults === 'object');
}

/**
 * 型ガード: 並列処理統計を持つかどうかを判定
 */
export function hasParallelStats(obj: unknown): obj is AnalysisResultWithParallelStats {
  return obj &&
    typeof obj === 'object' &&
    obj.parallelStats &&
    typeof obj.parallelStats.batchCount === 'number' &&
    typeof obj.parallelStats.threadsUsed === 'number';
}

/**
 * 後方互換性のための型エイリアス
 * 既存のコードベースからの段階的移行をサポート
 * 
 * @deprecated これらのエイリアスは将来のバージョンで削除予定
 */
export type CoreAnalysisResult = BaseAnalysisResult;
export type InterfaceAnalysisResult = AnalysisResult;
export type ParallelAnalysisResult = AnalysisResultWithParallelStats;
export type CliAnalysisResult = AnalysisResult;
export type SecurityAnalysisResult = AnalysisResult;

/**
 * ファクトリ関数: 基本的なAnalysisResultを作成
 * YAGNI原則: 現時点で必要な最小限の実装
 */
export function createAnalysisResult(
  totalFiles: number,
  issues: Issue[],
  executionTime: number
): AnalysisResult {
  return {
    totalFiles,
    issues,
    executionTime
  };
}

/**
 * ヘルパー関数: 分析結果をマージ
 * 複数の分析結果を統合する際に使用
 */
export function mergeAnalysisResults(results: AnalysisResult[]): AnalysisResult {
  if (results.length === 0) {
    return createAnalysisResult(0, [], 0);
  }

  const totalFiles = results.reduce((sum, r) => sum + r.totalFiles, 0);
  const issues = results.flatMap(r => r.issues);
  const executionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  
  // プラグイン情報をマージ
  const allPlugins = results
    .filter(r => r.pluginsExecuted)
    .flatMap(r => r.pluginsExecuted!);
  const uniquePlugins = [...new Set(allPlugins)];

  return {
    totalFiles,
    issues,
    executionTime,
    pluginsExecuted: uniquePlugins.length > 0 ? uniquePlugins : undefined
  };
}