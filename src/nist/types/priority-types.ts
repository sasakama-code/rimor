/**
 * Priority Engine 型定義
 * リスク優先度計算のための型定義
 * 
 * SOLID原則: インターフェース分離の原則
 * DRY原則: 型定義の一元化
 */

import { RiskLevel } from './unified-analysis-result';

/**
 * ビジネスインパクトレベル
 */
export enum BusinessImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * 技術的複雑性レベル
 */
export enum TechnicalComplexity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

/**
 * 緊急度レベル
 */
export type UrgencyLevel = 'IMMEDIATE' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * 推定作業量
 */
export type EstimatedEffort = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

/**
 * リスク優先度計算リクエスト
 */
export interface RiskPriorityRequest {
  /** リスクID（オプション） */
  riskId?: string;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** ビジネスインパクト */
  businessImpact: BusinessImpact;
  /** 技術的複雑性 */
  technicalComplexity: TechnicalComplexity;
  /** 影響を受けるコンポーネント数 */
  affectedComponents: number;
  /** 依存関係の数 */
  dependencies: number;
  /** クリティカルパス上にあるか */
  isOnCriticalPath?: boolean;
  /** カスタム重み付け（オプション） */
  customWeights?: PriorityWeights;
}

/**
 * 優先度計算の重み付け
 */
export interface PriorityWeights {
  /** リスクレベルの重み（デフォルト: 0.4） */
  riskWeight?: number;
  /** ビジネスインパクトの重み（デフォルト: 0.3） */
  businessWeight?: number;
  /** 技術的複雑性の重み（デフォルト: 0.2） */
  complexityWeight?: number;
  /** スコープの重み（デフォルト: 0.1） */
  scopeWeight?: number;
}

/**
 * 優先度スコアの内訳
 */
export interface PriorityScoreBreakdown {
  /** 基本リスクスコア（0-100） */
  baseRiskScore: number;
  /** ビジネスインパクトスコア（0-1.5） */
  businessImpactScore: number;
  /** 技術的複雑性スコア（0-1） */
  technicalComplexityScore: number;
  /** スコープスコア（0-100） */
  scopeScore: number;
  /** 最終スコア（0-100） */
  finalScore: number;
}

/**
 * リソース配分の推奨
 */
export interface ResourceAllocation {
  /** 推奨チームサイズ */
  recommendedTeamSize: number;
  /** 推定人日 */
  estimatedManDays: number;
  /** 必要な専門知識 */
  requiredExpertise: string[];
  /** 推奨スキルレベル */
  recommendedSkillLevel: 'ジュニア' | 'ミッド' | 'シニア' | 'エキスパート';
}

/**
 * リスク優先度計算結果
 */
export interface RiskPriorityResult {
  /** リスクID */
  riskId?: string;
  /** 優先度スコア（0-100） */
  priority: number;
  /** 緊急度 */
  urgency: UrgencyLevel;
  /** 推奨アクション */
  recommendedAction: string;
  /** 対応タイムライン */
  timeline: string;
  /** ビジネスインパクト倍率 */
  businessImpactMultiplier: number;
  /** 対応しやすさスコア（0-1） */
  easinessScore: number;
  /** 推定作業量 */
  estimatedEffort: EstimatedEffort;
  /** スコープスコア */
  scopeScore: number;
  /** クリティカルパス倍率 */
  criticalPathMultiplier?: number;
  /** スコアの内訳 */
  scoreBreakdown: PriorityScoreBreakdown;
  /** リソース配分の推奨 */
  resourceAllocation?: ResourceAllocation;
}

/**
 * 優先度スコア
 */
export interface PriorityScore {
  /** 総合スコア */
  total: number;
  /** 構成要素 */
  components: {
    risk: number;
    business: number;
    technical: number;
    scope: number;
  };
}