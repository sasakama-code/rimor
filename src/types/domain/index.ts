/**
 * ドメイン関連の統一型定義
 * 
 * ドメイン駆動設計に基づく型定義を集約
 * SOLID原則に従った設計
 */

/**
 * ドメイン分類
 */
export type DomainCategory = 
  | 'CORE'           // コアドメイン
  | 'SUPPORTING'     // 支援ドメイン
  | 'GENERIC'        // 汎用ドメイン
  | 'EXTERNAL';      // 外部ドメイン

/**
 * ドメインレイヤー
 */
export type DomainLayer = 
  | 'PRESENTATION'   // プレゼンテーション層
  | 'APPLICATION'    // アプリケーション層
  | 'DOMAIN'         // ドメイン層
  | 'INFRASTRUCTURE'; // インフラストラクチャ層

/**
 * ドメインパターン
 */
export type DomainPattern = 
  | 'ENTITY'
  | 'VALUE_OBJECT'
  | 'AGGREGATE'
  | 'REPOSITORY'
  | 'FACTORY'
  | 'SERVICE'
  | 'DOMAIN_EVENT'
  | 'SPECIFICATION';

/**
 * ドメインコンテキスト
 * DDD（ドメイン駆動設計）の境界づけられたコンテキスト
 */
export interface DomainContext {
  /** コンテキスト名 */
  name: string;
  /** 説明 */
  description?: string;
  /** カテゴリ */
  category: DomainCategory;
  /** レイヤー */
  layer: DomainLayer;
  /** エンティティ */
  entities: string[];
  /** 値オブジェクト */
  valueObjects: string[];
  /** サービス */
  services: string[];
  /** リポジトリ */
  repositories: string[];
  /** イベント */
  events: string[];
  /** 依存関係 */
  dependencies: string[];
}

/**
 * ドメイン用語
 */
export interface DomainTerm {
  /** 用語 */
  term: string;
  /** 定義 */
  definition: string;
  /** 別名 */
  aliases?: string[];
  /** カテゴリ */
  category?: string;
  /** 例 */
  examples?: string[];
  /** 関連用語 */
  relatedTerms?: string[];
}

/**
 * ドメイン辞書
 * ユビキタス言語の管理
 */
export interface DomainDictionary {
  /** 辞書名 */
  name: string;
  /** バージョン */
  version: string;
  /** 言語 */
  language: string;
  /** 用語集 */
  terms: DomainTerm[];
  /** カテゴリ */
  categories: string[];
  /** 最終更新日 */
  lastUpdated: string;
}

/**
 * ドメインエンティティ
 */
export interface DomainEntity {
  /** ID */
  id: string;
  /** 名前 */
  name: string;
  /** タイプ */
  type: DomainPattern;
  /** プロパティ */
  properties: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  /** メソッド */
  methods: Array<{
    name: string;
    parameters: string[];
    returnType: string;
    description?: string;
  }>;
  /** 不変条件 */
  invariants?: string[];
  /** ビジネスルール */
  businessRules?: string[];
}

/**
 * ドメインイベント
 */
export interface DomainEvent {
  /** イベント名 */
  name: string;
  /** タイムスタンプ */
  timestamp: string;
  /** 集約ID */
  aggregateId: string;
  /** ペイロード */
  payload: Record<string, any>;
  /** メタデータ */
  metadata?: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    [key: string]: unknown;
  };
}

/**
 * ドメインサービス
 */
export interface DomainService {
  /** サービス名 */
  name: string;
  /** 責務 */
  responsibilities: string[];
  /** 操作 */
  operations: Array<{
    name: string;
    input: Record<string, any>;
    output: Record<string, any>;
    description: string;
  }>;
  /** 依存サービス */
  dependencies?: string[];
}

/**
 * 集約ルート
 */
export interface AggregateRoot {
  /** ID */
  id: string;
  /** 名前 */
  name: string;
  /** エンティティ */
  entities: DomainEntity[];
  /** 値オブジェクト */
  valueObjects: unknown[];
  /** ドメインイベント */
  events: DomainEvent[];
  /** 境界 */
  boundary: {
    included: string[];
    excluded: string[];
  };
}

/**
 * ドメインモデル
 */
export interface DomainModel {
  /** モデル名 */
  name: string;
  /** バージョン */
  version: string;
  /** コンテキスト */
  contexts: DomainContext[];
  /** 集約 */
  aggregates: AggregateRoot[];
  /** 辞書 */
  dictionary: DomainDictionary;
  /** 関係 */
  relationships: Array<{
    from: string;
    to: string;
    type: 'ASSOCIATION' | 'AGGREGATION' | 'COMPOSITION' | 'INHERITANCE';
    cardinality: '1-1' | '1-N' | 'N-1' | 'N-N';
  }>;
}

/**
 * ドメイン分析結果
 */
export interface DomainAnalysisResult {
  /** モデル */
  model: DomainModel;
  /** 検出されたパターン */
  patterns: Array<{
    type: DomainPattern;
    location: string;
    confidence: number;
  }>;
  /** 問題点 */
  issues: Array<{
    type: 'MISSING_ENTITY' | 'AMBIGUOUS_TERM' | 'CIRCULAR_DEPENDENCY' | 'VIOLATION';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    location?: string;
  }>;
  /** 推奨事項 */
  recommendations: string[];
  /** メトリクス */
  metrics: {
    entityCount: number;
    serviceCount: number;
    eventCount: number;
    complexityScore: number;
    cohesion: number;
    coupling: number;
  };
}

/**
 * 型ガード: DomainContextかどうかを判定
 */
export function isDomainContext(obj: unknown): obj is DomainContext {
  return !!(obj !== null &&
    typeof obj === 'object' &&
    'name' in obj &&
    'category' in obj &&
    'layer' in obj &&
    'entities' in obj &&
    typeof (obj as any).name === 'string' &&
    (obj as any).category !== undefined &&
    (obj as any).layer !== undefined &&
    Array.isArray((obj as any).entities));
}

/**
 * 型ガード: DomainEntityかどうかを判定
 */
export function isDomainEntity(obj: unknown): obj is DomainEntity {
  return obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'type' in obj &&
    'properties' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string' &&
    (obj as any).type !== undefined &&
    Array.isArray((obj as any).properties);
}

/**
 * 型ガード: DomainEventかどうかを判定
 */
export function isDomainEvent(obj: unknown): obj is DomainEvent {
  return obj !== null &&
    typeof obj === 'object' &&
    'name' in obj &&
    'timestamp' in obj &&
    'aggregateId' in obj &&
    'payload' in obj &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).timestamp === 'string' &&
    typeof (obj as any).aggregateId === 'string' &&
    (obj as any).payload !== undefined;
}

/**
 * ヘルパー関数: ドメインモデルの複雑度を計算
 */
export function calculateDomainComplexity(model: DomainModel): number {
  const entityCount = model.aggregates.reduce((sum, agg) => sum + agg.entities.length, 0);
  const relationshipCount = model.relationships.length;
  const contextCount = model.contexts.length;
  
  // 簡単な複雑度計算
  return entityCount * 2 + relationshipCount * 3 + contextCount;
}

/**
 * ヘルパー関数: ドメイン用語の正規化
 */
export function normalizeDomainTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * 後方互換性のための型エイリアス
 * @deprecated
 */
export type DomainAnalysis = DomainAnalysisResult;
export type DomainTerminology = DomainDictionary;