import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
/**
 * UnifiedAnalysisResult v2.0
 * Issue #52: NIST SP 800-30準拠リスク評価機能
 * 
 * 後続のレポート機能（#57, #58）が利用する統一データ形式
 * SOLID原則: インターフェース分離の原則に準拠
 */

/**
 * リスクレベルの定義
 * v0.9.0の intent-analyze 機能で導入された大文字の定義を
 * プロジェクトの正式な標準とする
 */
// CoreTypesのRiskLevel enumを再エクスポート
export const RiskLevel = CoreTypes.RiskLevel;
export type RiskLevel = CoreTypes.RiskLevel;

/**
 * AIエージェントへのアクション提案の種別
 */
export enum AIActionType {
  ADD_ASSERTION = 'ADD_ASSERTION',
  SANITIZE_VARIABLE = 'SANITIZE_VARIABLE',
  REFACTOR_COMPLEX_CODE = 'REFACTOR_COMPLEX_CODE',
  ADD_MISSING_TEST = 'ADD_MISSING_TEST'
}

/**
 * 評価ディメンションごとの詳細なスコア内訳
 */
export interface ScoreBreakdown {
  /** 項目ラベル（例: "クリティカルリスク", "Unsafe Taint Flow"） */
  label: string;
  /** 計算式の説明（例: "-5点 x 21件"） */
  calculation: string;
  /** 減点数（負の値） */
  deduction: number;
}

/**
 * 多角的な評価ディメンション
 */
export interface ReportDimension {
  /** ディメンション名（例: "テスト意図実現度", "セキュリティリスク"） */
  name: string;
  /** 100点満点のスコア */
  score: number;
  /** 総合スコアへの寄与度 (0.0 ~ 1.0) */
  weight: number;
  /** 総合スコアへの実際の影響点 (score * weight) */
  impact: number;
  /** スコアの内訳 */
  breakdown: ScoreBreakdown[];
}

/**
 * 人間向けレポートとAI向け出力の双方に必要なサマリー情報
 */
export interface ExecutiveSummary {
  /** 総合スコア（100点満点） */
  overallScore: number;
  /** 総合評価グレード */
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** 評価ディメンションの詳細 */
  dimensions: ReportDimension[];
  /** 統計情報 */
  statistics: {
    /** 分析対象ファイル総数 */
    totalFiles: number;
    /** テストファイル総数 */
    totalTests: number;
    /** リスクレベル別の件数 */
    riskCounts: Record<RiskLevel, number>;
  };
}

/**
 * レポートに表示される個別の問題の詳細
 */
export interface DetailedIssue {
  /** 問題が発生しているファイルパス */
  filePath: string;
  /** 問題の開始行番号 */
  startLine: number;
  /** 問題の終了行番号 */
  endLine: number;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** 問題のタイトル */
  title: string;
  /** 問題の詳細説明 */
  description: string;
  /** コードスニペット（オプション） */
  contextSnippet?: string;
}

/**
 * AIエージェントが直接利用できる、構造化されたリスク情報
 */
export interface AIActionableRisk {
  /** 安定した一意のリスクID */
  riskId: string;
  /** リスクが存在するファイルパス */
  filePath: string;
  /** リスクレベル */
  riskLevel: RiskLevel;
  /** リスクのタイトル */
  title: string;
  /** AI向けの問題説明 */
  problem: string;
  /** コード文脈情報 */
  context: {
    /** 関連するコードスニペット */
    codeSnippet: string;
    /** 開始行番号 */
    startLine: number;
    /** 終了行番号 */
    endLine: number;
  };
  /** 推奨されるアクション */
  suggestedAction: {
    /** アクションタイプ */
    type: AIActionType;
    /** アクションの説明 */
    description: string;
    /** 具体的なコード例（オプション） */
    example?: string;
  };
}

/**
 * このIssue (#52) が生成する統一された分析結果の最終形式
 */
export interface UnifiedAnalysisResult {
  /** スキーマバージョン */
  schemaVersion: '1.0';
  /** エグゼクティブサマリー */
  summary: ExecutiveSummary;
  /** 人間向けレポート用の全問題リスト */
  detailedIssues: DetailedIssue[];
  /** AI向けの優先順位付き問題リスト */
  aiKeyRisks: AIActionableRisk[];
}