/**
 * Taint Analysis 型定義
 * TaintAnalysisSystemで使用される型定義
 * 
 * SOLID原則: インターフェース分離の原則
 */

import { TaintLevel as BaseTaintLevel } from '../../types/common-types';

/**
 * 拡張されたTaintLevel
 * NISTリスク評価と統合するため、より詳細なレベル定義
 */
export enum TaintLevel {
  SAFE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

/**
 * Taintフローの情報
 */
export interface TaintFlow {
  /** フローID */
  id: string;
  /** ソースの位置 */
  sourceLocation: {
    file: string;
    line: number;
    column: number;
  };
  /** シンクの位置 */
  sinkLocation: {
    file: string;
    line: number;
    column: number;
  };
  /** 汚染レベル */
  taintLevel: TaintLevel;
  /** 信頼度（0-1） */
  confidence: number;
  /** 汚染パス */
  path: string[];
  /** 説明 */
  description: string;
  /** 関連するCWE ID（オプション） */
  cweId?: string;
  /** 攻撃ベクトル（オプション） */
  attackVector?: string;
}

/**
 * Taint解析結果のサマリー
 */
export interface TaintSummary {
  /** 総フロー数 */
  totalFlows: number;
  /** クリティカルフロー数 */
  criticalFlows: number;
  /** 高レベルフロー数 */
  highFlows: number;
  /** 中レベルフロー数 */
  mediumFlows: number;
  /** 低レベルフロー数 */
  lowFlows: number;
}

/**
 * Taint解析結果
 */
export interface TaintAnalysisResult {
  /** 検出されたTaintフロー */
  flows: TaintFlow[];
  /** サマリー情報 */
  summary: TaintSummary;
  /** 解析メタデータ（オプション） */
  metadata?: {
    /** 解析開始時刻 */
    startTime: Date;
    /** 解析終了時刻 */
    endTime: Date;
    /** 解析対象ファイル数 */
    filesAnalyzed: number;
    /** 使用したルール数 */
    rulesApplied: number;
  };
}

/**
 * Taint脆弱性の評価結果
 */
export interface TaintVulnerabilityAssessment {
  /** 脆弱性ID */
  vulnerabilityId: string;
  /** Taintフロー */
  taintFlow: TaintFlow;
  /** リスクスコア（0-100） */
  riskScore: number;
  /** 悪用可能性（0-1） */
  exploitability: number;
  /** 影響度（0-1） */
  impact: number;
  /** 推奨される修正方法 */
  remediation: string[];
  /** 参考リンク */
  references?: string[];
}

/**
 * Taintチェーンリスク
 */
export interface TaintChainRisk {
  /** チェーンID */
  chainId: string;
  /** チェーンを構成するフローID */
  flowIds: string[];
  /** 連鎖的リスクスコア */
  chainRiskScore: number;
  /** チェーンの説明 */
  description: string;
  /** 攻撃シナリオ */
  attackScenario: string;
  /** 緩和策 */
  mitigation: string[];
}