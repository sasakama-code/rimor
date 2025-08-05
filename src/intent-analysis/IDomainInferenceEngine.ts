/**
 * Domain Inference Engine Interface
 * v0.9.0 Phase 2 - 型名からドメイン概念を推論
 */

import { TypeInfo } from './ITypeScriptAnalyzer';

/**
 * ドメイン推論結果
 */
export interface DomainInference {
  /**
   * 推論されたドメイン名
   */
  domain: string;
  
  /**
   * 推論の信頼度（0-1）
   */
  confidence: number;
  
  /**
   * 関連する概念
   */
  concepts: string[];
  
  /**
   * ビジネス重要度
   */
  businessImportance: BusinessImportance;
  
  /**
   * 関連するドメイン（オプション）
   */
  relatedDomains?: string[];
}

/**
 * ビジネス重要度
 */
export type BusinessImportance = 'critical' | 'high' | 'medium' | 'low';

/**
 * 文脈情報
 */
export interface DomainContext {
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * クラス名
   */
  className?: string;
  
  /**
   * インポートされているモジュール
   */
  imports: string[];
  
  /**
   * 名前空間
   */
  namespace?: string;
}

/**
 * ドメイン辞書エントリ
 */
export interface DomainDictionaryEntry {
  /**
   * 用語
   */
  term: string;
  
  /**
   * ドメイン
   */
  domain: string;
  
  /**
   * 重み（0-1）
   */
  weight: number;
}

/**
 * ドメインルール
 */
export interface DomainRule {
  /**
   * パターン（正規表現）
   */
  pattern: RegExp;
  
  /**
   * ドメイン
   */
  domain: string;
  
  /**
   * 重み（0-1）
   */
  weight: number;
}

/**
 * ドメイン辞書
 */
export interface DomainDictionary {
  /**
   * 用語リスト
   */
  terms: DomainDictionaryEntry[];
  
  /**
   * ルールリスト
   */
  rules: DomainRule[];
}

/**
 * ドメイン推論エンジンのインターフェース
 */
export interface IDomainInferenceEngine {
  /**
   * 型情報からドメインを推論
   */
  inferDomainFromType(typeInfo: TypeInfo): Promise<DomainInference>;
  
  /**
   * 文脈情報からドメインを推論
   */
  inferDomainFromContext(context: DomainContext): Promise<DomainInference>;
  
  /**
   * ドメインのビジネス重要度を取得
   */
  getDomainImportance(domain: string): Promise<BusinessImportance>;
  
  /**
   * ドメイン辞書を読み込む
   */
  loadDictionary(dictionary: DomainDictionary): Promise<void>;
  
  /**
   * 複数の推論結果を統合
   */
  mergeInferences(inferences: DomainInference[]): DomainInference;
}