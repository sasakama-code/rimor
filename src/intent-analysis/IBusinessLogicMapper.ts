/**
 * Business Logic Mapper Interface
 * v0.9.0 Phase 2 - テストとビジネスロジックの関連付け
 */

import { CallGraphNode, TypeInfo } from './ITypeScriptAnalyzer';
import { DomainInference } from './IDomainInferenceEngine';

/**
 * ビジネスロジックのマッピング結果
 */
export interface BusinessLogicMapping {
  /**
   * テストファイルパス
   */
  testFilePath: string;
  
  /**
   * 関連するビジネスロジックファイル
   */
  businessLogicFiles: BusinessLogicFile[];
  
  /**
   * カバレッジの深さ（0-1）
   */
  coverageDepth: number;
  
  /**
   * ビジネスクリティカル度
   */
  businessCriticality: BusinessCriticality;
  
  /**
   * 影響範囲
   */
  impactScope: ImpactScope;
  
  /**
   * リスク評価
   */
  riskAssessment: RiskAssessment;
}

/**
 * ビジネスロジックファイル情報
 */
export interface BusinessLogicFile {
  /**
   * ファイルパス
   */
  filePath: string;
  
  /**
   * ドメイン情報
   */
  domain: DomainInference;
  
  /**
   * 関数/メソッド一覧
   */
  functions: BusinessFunction[];
  
  /**
   * 重要度スコア（0-100）
   */
  importanceScore: number;
}

/**
 * ビジネス関数情報
 */
export interface BusinessFunction {
  /**
   * 関数名
   */
  name: string;
  
  /**
   * 行番号
   */
  line: number;
  
  /**
   * テストされているか
   */
  isTested: boolean;
  
  /**
   * 複雑度
   */
  complexity: number;
  
  /**
   * 依存関係の数
   */
  dependencyCount: number;
  
  /**
   * ビジネスルールを含むか
   */
  containsBusinessRules: boolean;
}

/**
 * ビジネスクリティカル度
 */
export interface BusinessCriticality {
  /**
   * レベル
   */
  level: 'critical' | 'high' | 'medium' | 'low';
  
  /**
   * 理由
   */
  reasons: string[];
  
  /**
   * スコア（0-100）
   */
  score: number;
}

/**
 * 影響範囲
 */
export interface ImpactScope {
  /**
   * 直接影響を受けるファイル数
   */
  directImpact: number;
  
  /**
   * 間接影響を受けるファイル数
   */
  indirectImpact: number;
  
  /**
   * 影響を受けるドメイン
   */
  affectedDomains: string[];
  
  /**
   * クリティカルパスに含まれるか
   */
  onCriticalPath: boolean;
}

/**
 * リスク評価
 */
export interface RiskAssessment {
  /**
   * テストカバレッジ不足のリスク
   */
  coverageRisk: 'high' | 'medium' | 'low';
  
  /**
   * ビジネスロジック複雑度のリスク
   */
  complexityRisk: 'high' | 'medium' | 'low';
  
  /**
   * 変更頻度に基づくリスク
   */
  changeRisk: 'high' | 'medium' | 'low';
  
  /**
   * 総合リスクスコア（0-100）
   */
  overallRiskScore: number;
}

/**
 * ドメイン重要度設定
 */
export interface DomainImportanceConfig {
  /**
   * 重要度レベルごとの重み
   */
  weightMap?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  
  /**
   * クリティカルドメインのリスト
   */
  criticalDomains?: string[];
  
  /**
   * ドメインボーナスポイント
   */
  domainBonus?: number;
  
  /**
   * 特定ドメインの重要度強制設定を無効化
   */
  disableDomainOverrides?: boolean;
}

/**
 * ビジネスロジックマッパーのインターフェース
 */
export interface IBusinessLogicMapper {
  /**
   * テストファイルからビジネスロジックへのマッピング
   */
  mapTestToBusinessLogic(
    testFilePath: string,
    callGraph: CallGraphNode[],
    typeInfo: Map<string, TypeInfo>
  ): Promise<BusinessLogicMapping>;
  
  /**
   * ビジネス重要度の計算
   */
  calculateBusinessImportance(
    functions: BusinessFunction[],
    domain: DomainInference
  ): Promise<BusinessCriticality>;
  
  /**
   * 影響範囲の分析
   */
  analyzeImpactScope(
    callGraph: CallGraphNode[],
    startNode: CallGraphNode
  ): Promise<ImpactScope>;
  
  /**
   * ビジネスルールの検出
   */
  detectBusinessRules(
    functionBody: string,
    typeInfo: Map<string, TypeInfo>
  ): Promise<boolean>;
  
  /**
   * クリティカルパスの判定
   */
  isOnCriticalPath(
    node: CallGraphNode,
    domains: string[]
  ): Promise<boolean>;
  
  /**
   * ドメイン重要度設定を適用
   */
  setDomainImportanceConfig(config: DomainImportanceConfig): void;
}