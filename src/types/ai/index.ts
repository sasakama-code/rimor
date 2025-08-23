/**
 * AI出力関連の統一型定義
 * 
 * AI分析結果のフォーマットと出力に関する型を集約
 * SOLID原則とKISS原則に基づいた設計
 */

import type { Issue } from '../../core/types/core-definitions';
import { CoreTypes } from '../../core/types/core-definitions';

/**
 * リスクレベルの定義
 * CoreTypesのRiskLevel enumを再エクスポート
 */
export const RiskLevel = CoreTypes.RiskLevel;
export type RiskLevel = CoreTypes.RiskLevel;

/**
 * AIアクションタイプ
 */
export type AIActionType = 
  | 'ADD_ASSERTION' 
  | 'SANITIZE_VARIABLE' 
  | 'REFACTOR_COMPLEX_CODE' 
  | 'ADD_MISSING_TEST'
  | 'FIX_SECURITY_ISSUE'
  | 'IMPROVE_PERFORMANCE';

/**
 * フォーマット戦略タイプ
 * YAGNI原則: 現時点では詳細な型定義は不要
 */
export type FormattingStrategy = unknown;

/**
 * AI分析のサマリー情報
 * SRP: サマリー情報の表現に特化
 * 
 * @example
 * ```typescript
 * const summary: AISummary = {
 *   totalIssues: 15,
 *   totalFiles: 5,
 *   overallScore: 85.5,
 *   severityDistribution: { 'HIGH': 2, 'MEDIUM': 8, 'LOW': 5 },
 *   categoryDistribution: { 'security': 3, 'performance': 7, 'maintainability': 5 },
 *   topIssues: [
 *     { category: 'security', severity: 'HIGH', count: 2, message: 'SQL injection vulnerability' }
 *   ],
 *   keyFindings: ['Critical security issues detected', 'Performance optimizations needed']
 * };
 * ```
 */
export interface AISummary {
  /** 総問題数 */
  totalIssues: number;
  /** 総ファイル数 */
  totalFiles: number;
  /** 全体スコア */
  overallScore: number;
  /** 深刻度別の分布 */
  severityDistribution: Record<string, number>;
  /** カテゴリ別の分布 */
  categoryDistribution: Record<string, number>;
  /** 主要な問題 */
  topIssues: Array<{
    category: string;
    severity: string;
    count: number;
    message: string;
  }>;
  /** 主要な発見事項 */
  keyFindings: string[];
}

/**
 * AIフォーマット済みの問題
 */
export interface AIFormattedIssue {
  /** カテゴリ */
  category: string;
  /** 深刻度 */
  severity: string;
  /** メッセージ */
  message: string;
  /** 行番号 */
  line?: number;
  /** 列番号 */
  column?: number;
  /** 修正提案 */
  suggestion?: string;
  /** 影響度 */
  impact: 'high' | 'medium' | 'low';
  /** コードスニペット */
  codeSnippet?: string;
}

/**
 * AIフォーマット済みのファイル
 */
export interface AIFormattedFile {
  /** ファイルパス */
  path: string;
  /** 問題数 */
  issueCount: number;
  /** 問題リスト */
  issues: AIFormattedIssue[];
  /** スコア */
  score: number;
}

/**
 * AIコンテキスト情報
 */
export interface AIContext {
  /** プロジェクトタイプ */
  projectType: string;
  /** フレームワーク */
  framework: string;
  /** テストフレームワーク */
  testFramework: string;
  /** 使用言語 */
  languages: string[];
  /** 依存関係 */
  dependencies: Record<string, string> | string[];
  /** 設定情報 */
  configuration: {
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
    hasJest: boolean;
    [key: string]: boolean;
  };
}

/**
 * コードコンテキスト情報
 */
export interface CodeContext {
  /** 前の行 */
  before: string[];
  /** 現在の行 */
  current: string;
  /** 後の行 */
  after: string[];
  /** 関数名 */
  functionName?: string;
  /** クラス名 */
  className?: string;
  /** モジュール名 */
  moduleName?: string;
}

/**
 * 位置情報
 */
export interface LocationInfo {
  /** ファイル */
  file: string;
  /** 開始行 */
  startLine: number;
  /** 終了行 */
  endLine: number;
  /** 開始列 */
  startColumn?: number;
  /** 終了列 */
  endColumn?: number;
}

/**
 * 修正提案
 */
export interface SuggestedFix {
  /** 説明 */
  description: string;
  /** コード変更 */
  codeChanges: Array<{
    file: string;
    before: string;
    after: string;
    location: LocationInfo;
  }>;
  /** 影響度評価 */
  impact: ImpactEstimation;
}

/**
 * アクションステップ
 */
export interface ActionStep {
  /** ステップ番号 */
  order: number;
  /** アクション */
  action: string;
  /** 詳細 */
  details: string;
  /** 必須かどうか */
  required: boolean;
  /** 推定時間（分） */
  estimatedMinutes?: number;
}

/**
 * 影響度評価
 */
export interface ImpactEstimation {
  /** セキュリティへの影響 */
  security: RiskLevel;
  /** パフォーマンスへの影響 */
  performance: RiskLevel;
  /** 保守性への影響 */
  maintainability: RiskLevel;
  /** 実装難易度 */
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * AIマークダウン出力
 */
export interface AIMarkdownOutput {
  /** サマリーセクション */
  summary: string;
  /** ファイル分析セクション */
  fileAnalysis: FileAnalysisSection[];
  /** 問題セクション */
  issues: IssueSection[];
  /** タスクセクション */
  tasks: TaskSection[];
  /** 推奨事項 */
  recommendations: string[];
}

/**
 * ファイル分析セクション
 */
export interface FileAnalysisSection {
  /** ファイルパス */
  filePath: string;
  /** 分析内容 */
  content: string;
  /** メトリクス */
  metrics?: Record<string, any>;
}

/**
 * 問題セクション
 */
export interface IssueSection {
  /** タイトル */
  title: string;
  /** 深刻度 */
  severity: string;
  /** 内容 */
  content: string;
  /** コード例 */
  codeExample?: string;
}

/**
 * タスクセクション
 */
export interface TaskSection {
  /** タイトル */
  title: string;
  /** 優先度 */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** タスクリスト */
  tasks: string[];
}

/**
 * AIプロンプトテンプレート
 */
export interface AIPromptTemplate {
  /** テンプレート名 */
  name: string;
  /** プロンプト */
  prompt: string;
  /** 変数 */
  variables: Record<string, string>;
  /** 例 */
  examples?: string[];
}

/**
 * フォーマッターオプション
 */
export interface FormatterOptions {
  /** 最大問題数 */
  maxIssues?: number;
  /** 最小深刻度 */
  minSeverity?: string;
  /** コンテキスト行数 */
  contextLines?: number;
  /** 詳細レベル */
  verbosity?: 'minimal' | 'normal' | 'detailed';
}

/**
 * AI最適化出力
 * DRY原則: 既存の型を組み合わせて定義
 */
export interface AIOptimizedOutput {
  /** バージョン */
  version: string;
  /** フォーマット */
  format: "ai-optimized";
  /** メタデータ */
  metadata: {
    projectType: string;
    language: string;
    testFramework: string;
    timestamp: string;
    rimVersion: string;
  };
  /** コンテキスト */
  context: {
    rootPath: string;
    configFiles: Record<string, string>;
    dependencies: Record<string, string>;
    projectStructure: string;
  };
  /** 品質概要 */
  qualityOverview: {
    projectScore: number;
    projectGrade: string;
    criticalIssues: number;
    totalIssues: number;
  };
  /** ファイル情報 */
  files: Array<{
    path: string;
    language: string;
    score: number;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      location: LocationInfo;
      message: string;
      suggestion?: string;
      context?: CodeContext;
    }>;
  }>;
  /** サマリー */
  summary: AISummary;
  /** アクション可能なリスク */
  actionableRisks?: AIActionableRisk[];
}

/**
 * アクション可能なリスク
 */
export interface AIActionableRisk {
  /** リスクID */
  id: string;
  /** タイトル */
  title: string;
  /** リスクレベル */
  level: RiskLevel;
  /** 説明 */
  description: string;
  /** 影響を受けるファイル */
  affectedFiles: string[];
  /** 推奨アクション */
  suggestedActions: ActionStep[];
  /** 影響度評価 */
  impact: ImpactEstimation;
}

/**
 * AIエラー
 */
export interface AIOutputError extends Error {
  /** エラーコード */
  code: string;
  /** 詳細 */
  details?: unknown;
}

/**
 * 型ガード: AIOptimizedOutputかどうかを判定
 */
export function isAIOptimizedOutput(obj: unknown): obj is AIOptimizedOutput {
  return !!(obj !== null &&
    typeof obj === 'object' &&
    'format' in obj &&
    'version' in obj &&
    'metadata' in obj &&
    'context' in obj &&
    'qualityOverview' in obj &&
    'files' in obj &&
    (obj as any).format === 'ai-optimized' &&
    (obj as any).version !== undefined &&
    (obj as any).metadata !== undefined &&
    (obj as any).context !== undefined &&
    (obj as any).qualityOverview !== undefined &&
    Array.isArray((obj as any).files));
}

/**
 * 型ガード: AIFormattedIssueかどうかを判定
 */
export function isAIFormattedIssue(obj: unknown): obj is AIFormattedIssue {
  return !!(obj !== null &&
    typeof obj === 'object' &&
    'category' in obj &&
    'severity' in obj &&
    'message' in obj &&
    'impact' in obj &&
    typeof (obj as any).category === 'string' &&
    typeof (obj as any).severity === 'string' &&
    typeof (obj as any).message === 'string' &&
    ['high', 'medium', 'low'].includes((obj as any).impact));
}

/**
 * ヘルパー関数: リスクレベルを数値に変換
 */
export function riskLevelToNumber(level: RiskLevel): number {
  const mapping: Record<RiskLevel, number> = {
    'CRITICAL': 5,
    'HIGH': 4,
    'MEDIUM': 3,
    'LOW': 2,
    'MINIMAL': 1
  };
  return mapping[level] || 0;
}

/**
 * ヘルパー関数: 数値をリスクレベルに変換
 */
export function numberToRiskLevel(num: number): RiskLevel {
  if (num >= 5) return RiskLevel.CRITICAL;
  if (num >= 4) return RiskLevel.HIGH;
  if (num >= 3) return RiskLevel.MEDIUM;
  if (num >= 2) return RiskLevel.LOW;
  return RiskLevel.MINIMAL;
}