/**
 * NIST SP 800-30準拠の型定義
 * リスク評価フレームワークの標準型
 * 
 * SOLID原則: インターフェース分離の原則
 * KISS原則: 明確で理解しやすい型定義
 */

/**
 * 脅威源のタイプ
 */
export type ThreatSourceType = 'ADVERSARIAL' | 'ACCIDENTAL' | 'STRUCTURAL' | 'ENVIRONMENTAL';

/**
 * 能力レベル
 */
export type CapabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

/**
 * 意図レベル
 */
export type IntentLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

/**
 * ターゲティングレベル
 */
export type TargetingLevel = 'NONE' | 'OPPORTUNISTIC' | 'FOCUSED' | 'SPECIFIC';

/**
 * 可能性レベル
 */
export type LikelihoodLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

/**
 * 影響レベル
 */
export type ImpactLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

/**
 * 深刻度レベル
 */
export type SeverityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';

/**
 * 悪用可能性レベル
 */
export type ExploitabilityLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

/**
 * 検出可能性レベル
 */
export type DetectabilityLevel = 'VERY_HARD' | 'HARD' | 'MODERATE' | 'EASY' | 'VERY_EASY';

/**
 * 関連性レベル
 */
export type RelevanceLevel = 'CONFIRMED' | 'EXPECTED' | 'ANTICIPATED' | 'PREDICTED' | 'POSSIBLE';

/**
 * 脅威源
 * NIST SP 800-30 Table G-2準拠
 */
export interface ThreatSource {
  /** 脅威源ID */
  id: string;
  /** 脅威源名 */
  name: string;
  /** 脅威源タイプ */
  type: ThreatSourceType;
  /** 能力レベル */
  capability: CapabilityLevel;
  /** 意図レベル */
  intent: IntentLevel;
  /** ターゲティングレベル */
  targeting: TargetingLevel;
  /** 説明（オプション） */
  description?: string;
}

/**
 * 脅威イベント
 * NIST SP 800-30 Table G-3準拠
 */
export interface ThreatEvent {
  /** 脅威イベントID */
  id: string;
  /** 脅威イベントの説明 */
  description: string;
  /** 関連する脅威源ID */
  threatSources: string[];
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響度 */
  impact: ImpactLevel;
  /** 関連性 */
  relevance: RelevanceLevel;
  /** 戦術・技術・手順（オプション） */
  ttps?: string[];
}

/**
 * 脆弱性
 * NIST SP 800-30 Table H-4準拠
 */
export interface Vulnerability {
  /** 脆弱性ID */
  id: string;
  /** 脆弱性タイプ（オプション） */
  type?: string;
  /** 脆弱性の説明 */
  description: string;
  /** 深刻度 */
  severity: SeverityLevel;
  /** 悪用可能性 */
  exploitability: ExploitabilityLevel;
  /** 検出可能性 */
  detectability: DetectabilityLevel;
  /** 影響を受けるコンポーネント（オプション） */
  affectedComponent?: string;
  /** 影響を受ける資産 */
  affectedAssets?: string[];
  /** CVE ID（オプション） */
  cveId?: string;
  /** CWE ID（オプション） */
  cweId?: string;
  /** CVSS スコア（オプション） */
  cvss?: number;
  /** CVSSスコア（レガシー互換）（オプション） */
  cvssScore?: number;
  /** 攻撃ベクトル（オプション） */
  attackVector?: string;
}

/**
 * NISTリスクマトリクス
 * 脅威、脆弱性、影響の組み合わせ
 */
export interface NISTRiskMatrix {
  /** 脅威の可能性 */
  threatLikelihood: LikelihoodLevel;
  /** 脆弱性の深刻度 */
  vulnerabilitySeverity: SeverityLevel;
  /** 影響レベル */
  impactLevel: ImpactLevel;
}

/**
 * リスク評価
 * 総合的なリスク評価結果
 */
export interface RiskAssessment {
  /** 評価ID */
  id: string;
  /** 評価名 */
  name: string;
  /** 脅威源リスト */
  threatSources: ThreatSource[];
  /** 脅威イベントリスト */
  threatEvents: ThreatEvent[];
  /** 脆弱性リスト */
  vulnerabilities: Vulnerability[];
  /** コントロールの有効性（0.0-1.0） */
  controlEffectiveness: number;
  /** 評価日時（オプション） */
  assessmentDate?: Date;
  /** 評価者（オプション） */
  assessor?: string;
}

/**
 * 脅威イベント評価結果
 */
export interface ThreatEventAssessment {
  /** 脅威イベントID */
  eventId: string;
  /** 総合的な可能性 */
  overallLikelihood: LikelihoodLevel;
  /** 総合的な影響 */
  overallImpact: ImpactLevel;
  /** 寄与する脅威源 */
  contributingSources: string[];
}

/**
 * 環境脅威の影響
 */
export interface EnvironmentalImpact {
  /** 脅威源ID */
  threatSourceId: string;
  /** 発生可能性 */
  likelihood: LikelihoodLevel;
  /** 影響範囲 */
  scope: 'LIMITED' | 'MODERATE' | 'EXTENSIVE';
  /** 復旧時間 */
  recoveryTime: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
}

/**
 * 脅威（Threat）定義
 */
export interface Threat {
  id: string;
  name: string;
  category: string;
  likelihood: LikelihoodLevel | string;
  description: string;
}

/**
 * 影響（Impact）定義
 */
export interface Impact {
  id: string;
  description: string;
  level: ImpactLevel;
  affectedAssets: string[];
  businessImpact?: string;
  financialImpact?: number;
}

/**
 * リスクマトリクス定義
 */
export interface RiskMatrix {
  threatLikelihood: LikelihoodLevel;
  vulnerabilitySeverity: SeverityLevel;
  impactLevel: ImpactLevel;
}

/**
 * リスク評価結果
 */
export interface RiskAssessmentResult {
  /** 評価ID */
  assessmentId: string;
  /** 固有リスクレベル（コントロール前） */
  inherentRiskLevel: string;
  /** 軽減後リスクレベル（コントロール後） */
  mitigatedRiskLevel: string;
  /** 全体的なリスクレベル */
  overallRiskLevel: string;
  /** 推奨事項 */
  recommendations: RiskRecommendation[];
  /** 詳細な脅威評価 */
  threatAssessments?: ThreatEventAssessment[];
  /** リスクスコア（0-100） */
  riskScore?: number;
}

/**
 * リスク推奨事項
 */
export interface RiskRecommendation {
  /** 優先度 */
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 推奨アクション */
  action: string;
  /** 実施タイムライン */
  timeline: string;
  /** 期待される効果 */
  expectedBenefit: string;
  /** 実装の複雑さ */
  complexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 推定コスト */
  estimatedCost?: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * リスクを持つオブジェクト（ソート用）
 */
export interface RiskItem {
  /** アイテムID */
  id: string;
  /** リスクレベル */
  level: string;
  /** その他のプロパティ */
  [key: string]: any;
}