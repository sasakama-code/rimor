/**
 * Domain Analysis Types
 * v0.9.0 - 統計的ドメイン分析の型定義
 */

/**
 * ドメイン分析の設定
 * KISS原則: シンプルで明確な設定構造
 */
export interface DomainAnalysisConfig {
  /** 分析対象プロジェクトのパス */
  projectPath: string;
  
  /** 除外するパターン（glob形式） */
  excludePatterns: string[];
  
  /** サポートする拡張子 */
  supportedExtensions: string[];
  
  /** 最小キーワード頻度（これ以下は無視） */
  minKeywordFrequency: number;
  
  /** 最大クラスタ数 */
  maxClusters: number;
}

/**
 * キーワード情報
 */
export interface KeywordInfo {
  /** キーワード */
  keyword: string;
  
  /** 出現頻度 */
  frequency: number;
  
  /** TF-IDFスコア */
  tfidfScore?: number;
  
  /** 出現ファイル */
  files: string[];
  
  /** 言語（日本語/英語など） */
  language?: string;
}

/**
 * ドメインクラスタ
 * SOLID原則: 単一責任の原則
 */
export interface DomainCluster {
  /** クラスタID */
  id: string;
  
  /** ドメイン名（ユーザーが確認・修正可能） */
  name: string;
  
  /** クラスタに含まれるキーワード */
  keywords: string[];
  
  /** クラスタの信頼度（0-1） */
  confidence: number;
  
  /** クラスタに関連するファイル */
  files: string[];
  
  /** 中心となるキーワード（重心） */
  centroid?: string[];
}

/**
 * 整合性ハッシュ
 * Defensive Programming: 改ざん防止
 */
export interface IntegrityHash {
  /** SHA-256ハッシュ値 */
  hash: string;
  
  /** ハッシュ生成時刻 */
  timestamp: Date;
  
  /** ハッシュ対象のデータバージョン */
  version: string;
}

/**
 * ドメイン分析結果
 * DRY原則: 結果構造の統一
 */
export interface DomainAnalysisResult {
  /** 検出されたドメインクラスタ */
  domains: DomainCluster[];
  
  /** 抽出されたキーワード情報 */
  keywords: Map<string, KeywordInfo>;
  
  /** 整合性ハッシュ */
  integrity?: IntegrityHash;
  
  /** 分析実行時刻 */
  timestamp: Date;
  
  /** 分析メタデータ */
  metadata?: {
    totalFiles: number;
    totalTokens: number;
    executionTime: number;
    languageDistribution?: Map<string, number>;
  };
}

/**
 * 言語検出結果
 */
export interface LanguageDetectionResult {
  /** 検出された言語（ISO 639-3コード） */
  language: string;
  
  /** 信頼度スコア */
  confidence: number;
}

/**
 * TF-IDFベクトル
 */
export interface TFIDFVector {
  /** ドキュメントID（ファイルパス） */
  documentId: string;
  
  /** TF-IDFベクトル値 */
  vector: Map<string, number>;
}

/**
 * クラスタリング設定
 */
export interface ClusteringConfig {
  /** クラスタ数（K-MeansのK） */
  k: number;
  
  /** 最大反復回数 */
  maxIterations?: number;
  
  /** 収束閾値 */
  tolerance?: number;
}

/**
 * ユーザー検証結果
 */
export interface UserValidationResult {
  /** ユーザーが承認したドメイン */
  approvedDomains: DomainCluster[];
  
  /** ユーザーが修正したドメイン */
  modifiedDomains: DomainCluster[];
  
  /** ユーザーが拒否したドメイン */
  rejectedDomains: DomainCluster[];
  
  /** 検証完了フラグ */
  validated: boolean;
}

/**
 * ドメイン定義ファイル（.rimor/domain.json）
 */
export interface DomainDefinition {
  /** スキーマバージョン */
  version: string;
  
  /** プロジェクト情報 */
  project: {
    name: string;
    path: string;
    analyzed: Date;
  };
  
  /** ドメインクラスタ */
  domains: DomainCluster[];
  
  /** 整合性ハッシュ */
  integrity: IntegrityHash;
  
  /** メタデータ */
  metadata?: Record<string, any>;
}