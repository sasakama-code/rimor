/**
 * コア型定義 - プロジェクト全体で使用される統一型定義
 * 
 * このファイルは型定義の一元管理を目的としています。
 * 全てのモジュールはこのファイルから型をインポートしてください。
 * 
 * @since v0.9.0
 */

/**
 * CoreTypes名前空間
 * プロジェクト全体で共通使用される型定義を集約
 */
export namespace CoreTypes {
  /**
   * リスクレベル - セキュリティや品質リスクの深刻度
   * CRITICAL > HIGH > MEDIUM > LOW > MINIMAL の順で深刻度が高い
   */
  export enum RiskLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    MINIMAL = 'MINIMAL'
  }

  /**
   * 重要度レベル - 問題や警告の重要度
   * 小文字で統一（TypeScript/ESLint標準に準拠）
   * error/warningはhigh/mediumへのマッピング用に追加
   */
  export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'error' | 'warning';

  /**
   * 問題カテゴリ - 検出された問題の分類
   */
  export type IssueCategory = 
    | 'testing'      // テスト関連
    | 'security'     // セキュリティ
    | 'performance'  // パフォーマンス
    | 'maintainability' // 保守性
    | 'reliability'  // 信頼性
    | 'complexity'   // 複雑度
    | 'duplication'  // 重複
    | 'style'        // コードスタイル
    | 'documentation' // ドキュメント
    | 'general'      // その他
    | 'test-quality' // テスト品質
    | 'coverage'     // カバレッジ
    | 'assertion'    // アサーション
    | 'pattern'      // パターン
    | 'structure'    // 構造
    | 'best-practice' // ベストプラクティス
    | 'error-handling' // エラーハンドリング
    | 'validation'   // バリデーション
    | 'code-quality' // コード品質
    | 'test-coverage' // テストカバレッジ
    | 'file-system'  // ファイルシステム
    | 'syntax';      // 構文

  /**
   * 問題（Issue）- 検出された問題の詳細情報
   */
  export interface Issue {
    // 識別情報
    id: string;
    type: string;
    
    // 深刻度と分類
    severity: SeverityLevel;
    category: IssueCategory;
    
    // 問題の説明
    message: string;
    description?: string;
    
    // 位置情報
    filePath?: string;
    file?: string; // 後方互換性のため追加（filePathと同じ）
    line?: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    
    // 追加情報
    ruleId?: string;
    suggestion?: string;
    fixable?: boolean;
    
    // メタデータ
    metadata?: Record<string, any>;
  }

  /**
   * リスク評価 - リスクの詳細評価情報
   */
  export interface RiskAssessment {
    // リスクレベルと分類
    riskLevel: RiskLevel;
    category: string;
    
    // リスクの説明
    description: string;
    problem?: string;
    title?: string;
    
    // リスク評価指標
    impact: string | number;
    likelihood: number; // 0.0 - 1.0
    score?: number; // リスクスコア
    
    // 対策
    mitigation?: string;
    mitigationStatus?: 'none' | 'partial' | 'comprehensive';
    
    // 追加情報
    affectedFiles?: string[];
    estimatedEffort?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
  }

  /**
   * 拡張Issue型 - formatterやreporting用の追加プロパティを含む
   */
  export interface ExtendedIssue extends Issue {
    // 位置情報の詳細
    position?: {
      line: number;
      column: number;
      endLine?: number;
      endColumn?: number;
    };
    
    // 追加のコンテキスト情報
    suggestedFix?: string;
    codeSnippet?: string;
    plugin?: string;
    rule?: string;
    
    // reporting用プロパティ
    location?: {
      file: string;
      startLine: number;
      endLine: number;
      column?: number;
    };
    recommendation?: string;
    references?: string[];
  }

  /**
   * AI用JSON出力形式 - AI向けに最適化された出力
   */
  export interface AIJsonOutput {
    // 全体評価
    overallAssessment: string;
    
    // 主要リスク（最大10件）
    keyRisks: Array<{
      problem: string;
      riskLevel: string;
      context: {
        filePath: string;
        codeSnippet: string;
        startLine: number;
        endLine: number;
      };
      suggestedAction: {
        type: string;
        description: string;
        example?: string;
      };
    }>;
    
    // 詳細レポートへのリンク
    fullReportUrl: string;
    
    // メタデータ
    metadata?: {
      timestamp: string;
      version: string;
      projectType?: string;
    };
  }

  /**
   * 詳細問題情報 - レポート用の詳細な問題情報
   */
  export interface DetailedIssue extends Issue {
    // リスク情報の追加
    riskLevel: RiskLevel;
    title: string;
    
    // コンテキスト情報
    contextSnippet?: string;
    relatedFiles?: string[];
    
    // 統計情報
    occurrences?: number;
    firstDetected?: Date;
    lastDetected?: Date;
  }

  /**
   * 品質スコア - コード品質の評価スコア
   */
  export interface QualityScore {
    // 総合スコア (0-100)
    overall: number;
    
    // 次元別スコア
    dimensions: {
      completeness?: number;
      correctness?: number;
      maintainability?: number;
      reliability?: number;
      security?: number;
    };
    
    // スコアの内訳
    breakdown?: {
      [key: string]: number;
    };
    
    // 信頼度 (0.0-1.0)
    confidence: number;
    
    // グレード
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  }

  /**
   * プロジェクトコンテキスト - プロジェクト全体の情報
   */
  export interface ProjectContext {
    // プロジェクト情報
    rootPath: string;
    projectName?: string;
    projectType?: string;
    
    // 技術スタック
    language?: string;
    framework?: string;
    testFramework?: string;
    
    // 設定
    configFiles?: string[];
    dependencies?: Record<string, string>;
    
    // 統計
    totalFiles?: number;
    totalLines?: number;
    testFiles?: number;
  }

  /**
   * 分析結果 - 分析実行の結果
   */
  export interface AnalysisResult {
    // 識別情報
    filePath: string;
    timestamp: Date;
    
    // 検出された問題
    issues: Issue[];
    
    // スコアと評価
    score?: QualityScore;
    riskAssessment?: RiskAssessment;
    
    // メタデータ
    executionTime?: number;
    pluginsUsed?: string[];
    errors?: Array<{
      plugin: string;
      error: string;
    }>;
  }

  /**
   * 改善提案 - コード改善の提案
   */
  export interface Improvement {
    // 識別情報
    id: string;
    type: 'refactor' | 'fix' | 'enhancement' | 'test' | 'documentation';
    
    // 優先度と影響
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact?: number | { scoreImprovement: number; effortMinutes: number };
    estimatedImpact?: number;
    
    // 提案内容
    title: string;
    description: string;
    category?: string;
    
    // 実装詳細
    suggestedCode?: string;
    diff?: string;
    autoFixable?: boolean;
    
    // 努力見積もり
    effort?: 'trivial' | 'low' | 'medium' | 'high' | 'very-high';
    estimatedTime?: string;
  }
}

/**
 * 型ガード関数
 */
export namespace TypeGuards {
  export function isRiskLevel(value: unknown): value is CoreTypes.RiskLevel {
    return typeof value === 'string' && 
      ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].includes(value as string);
  }

  export function isSeverityLevel(value: unknown): value is CoreTypes.SeverityLevel {
    return typeof value === 'string' && 
      ['critical', 'high', 'medium', 'low', 'info'].includes(value as string);
  }

  export function isIssue(value: unknown): value is CoreTypes.Issue {
    return !!(value !== null &&
      typeof value === 'object' &&
      'id' in value &&
      'type' in value &&
      'severity' in value &&
      'message' in value &&
      typeof (value as any).id === 'string' &&
      typeof (value as any).type === 'string' &&
      isSeverityLevel((value as any).severity) &&
      typeof (value as any).message === 'string');
  }

  export function isRiskAssessment(value: unknown): value is CoreTypes.RiskAssessment {
    return !!(value !== null &&
      typeof value === 'object' &&
      'riskLevel' in value &&
      'category' in value &&
      'description' in value &&
      isRiskLevel((value as any).riskLevel) &&
      typeof (value as any).category === 'string' &&
      typeof (value as any).description === 'string');
  }
}

/**
 * ユーティリティ関数
 */
export namespace TypeUtils {
  /**
   * RiskLevelを数値に変換（比較用）
   */
  export function riskLevelToNumber(level: CoreTypes.RiskLevel): number {
    const mapping: Record<CoreTypes.RiskLevel, number> = {
      [CoreTypes.RiskLevel.CRITICAL]: 5,
      [CoreTypes.RiskLevel.HIGH]: 4,
      [CoreTypes.RiskLevel.MEDIUM]: 3,
      [CoreTypes.RiskLevel.LOW]: 2,
      [CoreTypes.RiskLevel.MINIMAL]: 1
    };
    return mapping[level];
  }

  /**
   * SeverityLevelを数値に変換（比較用）
   */
  export function severityLevelToNumber(level: CoreTypes.SeverityLevel): number {
    const mapping: Record<CoreTypes.SeverityLevel, number> = {
      'critical': 4,
      'error': 3, // errorはhighと同等
      'high': 3,
      'warning': 2, // warningはmediumと同等
      'medium': 2,
      'low': 1,
      'info': 0
    };
    return mapping[level];
  }

  /**
   * リスクレベルの比較
   */
  export function compareRiskLevels(a: CoreTypes.RiskLevel, b: CoreTypes.RiskLevel): number {
    return riskLevelToNumber(b) - riskLevelToNumber(a);
  }

  /**
   * 重要度レベルの比較
   */
  export function compareSeverityLevels(a: CoreTypes.SeverityLevel, b: CoreTypes.SeverityLevel): number {
    return severityLevelToNumber(b) - severityLevelToNumber(a);
  }
}

// 後方互換性のためのエクスポート（非推奨）
/** @deprecated Use CoreTypes.RiskLevel instead */
export type RiskLevel = CoreTypes.RiskLevel;

/** @deprecated Use CoreTypes.SeverityLevel instead */
export type SeverityLevel = CoreTypes.SeverityLevel;

/** @deprecated Use CoreTypes.IssueCategory instead */
export type IssueCategory = CoreTypes.IssueCategory;

/** @deprecated Use CoreTypes.Issue instead */
export type Issue = CoreTypes.Issue;

/** @deprecated Use CoreTypes.ExtendedIssue instead */
export type ExtendedIssue = CoreTypes.ExtendedIssue;

/** @deprecated Use CoreTypes.RiskAssessment instead */
export type RiskAssessment = CoreTypes.RiskAssessment;

/** @deprecated Use CoreTypes.AIJsonOutput instead */
export type AIJsonOutput = CoreTypes.AIJsonOutput;