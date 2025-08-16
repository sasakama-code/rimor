import { CoreTypes, TypeGuards, TypeUtils } from '../core/types/core-definitions';
import { Issue, ProjectContext, IssueSeverity, IssueCategory } from '../core/types';
import { FileScore, ProjectScore } from '../scoring/types';

/**
 * AI向け出力形式の型定義 v0.5.0
 * AI-Optimized-Output-Requirements-v0.5.0.mdに基づく実装
 */

// AI formatted types for the formatter
export interface AISummary {
  totalIssues: number;
  totalFiles: number;
  overallScore: number;
  severityDistribution: Record<IssueSeverity, number>;
  categoryDistribution: Record<IssueCategory, number>;
  topIssues: Array<{
    category: IssueCategory;
    severity: IssueSeverity;
    count: number;
    message: string;
  }>;
  keyFindings: string[];
}

export interface AIFormattedIssue {
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  impact: 'high' | 'medium' | 'low';
  codeSnippet?: string;
}

export interface AIFormattedFile {
  path: string;
  issueCount: number;
  issues: AIFormattedIssue[];
  score: number;
}

export interface AIContext {
  projectType: string;
  framework: string;
  testFramework: string;
  languages: string[];
  dependencies: Record<string, string> | string[];
  configuration: {
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
    hasJest: boolean;
  };
}

// メイン出力構造
export interface AIOptimizedOutput {
  version: string;
  format: "ai-optimized";
  metadata: {
    projectType: string;
    language: string;
    testFramework: string;
    timestamp: string;
    rimVersion: string;
  };
  
  context: {
    rootPath: string;
    configFiles: Record<string, string>; // ファイル名: 内容
    dependencies: Record<string, string>; // パッケージ名: バージョン
    projectStructure: string; // ディレクトリ構造の簡潔な表現
  };
  
  qualityOverview: {
    projectScore: number;
    projectGrade: string;
    criticalIssues: number;
    totalIssues: number;
  };
  
  files: Array<{
    path: string;
    language: string;
    score: number;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      location: LocationInfo;
      description: string;
      context: CodeContext;
      fix: SuggestedFix;
    }>;
  }>;
  
  actionableTasks: Array<{
    id: string;
    priority: number;
    type: string;
    description: string;
    automatable: boolean;
    estimatedImpact: ImpactEstimation;
    steps: ActionStep[];
  }>;
  
  instructions: {
    forHuman: string;
    forAI: string;
  };
}

// コードコンテキスト構造
export interface CodeContext {
  // 問題のあるコード
  targetCode: {
    content: string;
    startLine: number;
    endLine: number;
  };
  
  // 関連するソースコード（テスト対象）
  relatedSource?: {
    path: string;
    content: string;
    relevantSection?: {
      startLine: number;
      endLine: number;
    };
  };
  
  // 周辺のコンテキスト
  surroundingCode: {
    before: string; // 前10行
    after: string;  // 後10行
  };
  
  // インポート文
  imports: string[];
  
  // 使用されている主要なAPI/関数
  usedAPIs: string[];
}

// 位置情報
export interface LocationInfo {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

// 修正提案構造
export interface SuggestedFix {
  type: 'add' | 'replace' | 'remove' | 'refactor';
  targetLocation: {
    file: string;
    startLine: number;
    endLine: number;
  };
  code: {
    template: string; // 修正コードのテンプレート
    placeholders?: Record<string, string>; // 置換が必要な部分
  };
  explanation: string;
  confidence: number; // 0.0-1.0
  dependencies?: string[]; // 必要な追加インポート等
}

// アクション可能タスク
export interface ActionStep {
  order: number;
  action: string;
  target: string;
  code?: string;
  explanation: string;
  automated: boolean;
}

export interface ImpactEstimation {
  scoreImprovement: number;
  issuesResolved: number;
  effortMinutes: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// AI向けMarkdown出力構造
export interface AIMarkdownOutput {
  header: string;
  projectContext: string;
  criticalIssuesSummary: string;
  fileAnalysis: FileAnalysisSection[];
  automatedTasks: TaskSection[];
  instructions: string;
}

export interface FileAnalysisSection {
  fileName: string;
  score: string;
  issues: IssueSection[];
}

// Migrated to CoreTypes
export interface IssueSection {
  id: string;
  title: string;
  severity: string;
  location: string;
  currentCode: string;
  relatedSourceCode?: string;
  suggestedFix: string;
}

export interface TaskSection {
  id: string;
  title: string;
  priority: string;
  automatable: boolean;
  impact: string;
  steps: string[];
}

// AIプロンプトテンプレート
export interface AIPromptTemplate {
  // 汎用修正プロンプト
  genericFix: string;
  
  // 問題タイプ別プロンプト
  byIssueType: {
    [issueType: string]: string;
  };
  
  // フレームワーク別プロンプト
  byFramework: {
    [framework: string]: string;
  };
  
  // バッチ処理用プロンプト
  batchFix: string;
}

// フォーマッター設定
export interface FormatterOptions {
  format: 'json' | 'markdown';
  maxTokens?: number;
  includeContext?: boolean;
  includeSourceCode?: boolean;
  maxFileSize?: number;
  optimizeForAI?: boolean;
}

// 拡張分析結果（既存のAnalysisResultを拡張）
export interface EnhancedAnalysisResult {
  issues: Issue[];
  totalFiles: number;
  executionTime: number;
  projectScore?: ProjectScore;
  fileScores?: FileScore[];
  projectContext?: ProjectContext;
  
  // AI向け拡張情報
  aiContext?: {
    codeContext: Map<string, CodeContext>;
    suggestedFixes: Map<string, SuggestedFix[]>;
    actionableTasks: ActionStep[];
  };
}

// AI JSON出力形式 (Issue #58)
// Migrated to CoreTypes
export interface AIJsonOutput {
  // AIが最初に読むべき全体状況と最重要問題点
  overallAssessment: string;
  
  // 対処すべき問題の優先順位付きリスト
  keyRisks: Array<{
    // 問題点の簡潔な自然言語での説明
    problem: string;
    
    // リスクレベル
    riskLevel: string;
    
    // 修正に必要な最小限のコードスニペットと行番号
    context: {
      filePath: string;
      codeSnippet: string;
      startLine: number;
      endLine: number;
    };
    
    // AIが次にとるべき具体的なアクション
    suggestedAction: {
      type: string; // ADD_ASSERTION, SANITIZE_VARIABLE, etc.
      description: string;
      example?: string; // 具体的なコード例
    };
  }>;
  
  // 人間が確認するための詳細なHTMLレポートへのリンク
  fullReportUrl: string;
}

// リスクレベルの定義 (Issue #58)
// Migrated to CoreTypes
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

// AIエージェントへのアクション提案の種別 (Issue #58)
export type AIActionType = 'ADD_ASSERTION' | 'SANITIZE_VARIABLE' | 'REFACTOR_COMPLEX_CODE' | 'ADD_MISSING_TEST';

// 評価ディメンションごとの詳細なスコア内訳 (Issue #58)
export interface ScoreBreakdown {
  label: string;        // 例: "クリティカルリスク", "Unsafe Taint Flow"
  calculation: string;  // 例: "-5点 x 21件"
  deduction: number;    // 例: -105
}

// 多角的な評価ディメンション (Issue #58)
export interface ReportDimension {
  name: string;         // 例: "テスト意図実現度", "セキュリティリスク"
  score: number;        // 100点満点のスコア
  weight: number;       // 総合スコアへの寄与度 (0.0 ~ 1.0)
  impact: number;       // 総合スコアへの実際の影響点 (score * weight)
  breakdown: ScoreBreakdown[];
}

// 人間向けレポートとAI向け出力の双方に必要なサマリー情報 (Issue #58)
export interface ExecutiveSummary {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: ReportDimension[];
  statistics: {
    totalFiles: number;
    totalTests: number;
    totalIssues?: number; // 後方互換性のためオプショナル
    riskCounts: Record<RiskLevel, number>; // { CRITICAL: 5, HIGH: 12, ... }
  };
}

// レポートに表示される個別の問題の詳細 (Issue #58)
export interface DetailedIssue {
  filePath: string;
  startLine: number;
  endLine: number;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  type?: string;
  severity?: string;
  message?: string;
  category?: string;
  contextSnippet?: string; 
}

// AIエージェントが直接利用できる、構造化されたリスク情報 (Issue #58)
export interface AIActionableRisk {
  id?: string; // 後方互換性のためオプショナル（riskIdと同じ値）
  riskId: string; // 安定した一意のID
  filePath: string;
  riskLevel: RiskLevel;
  title: string;
  problem: string; // AI向けの問題説明
  context: {
    codeSnippet: string;
    startLine: number;
    endLine: number;
  };
  suggestedAction: {
    type: AIActionType;
    description: string;
    example?: string; // 具体的なコード例
  };
}

// Issue #52 が生成する統一された分析結果の最終形式 (Issue #58)
export interface UnifiedAnalysisResult {
  schemaVersion: "1.0";
  summary: ExecutiveSummary;
  detailedIssues: DetailedIssue[]; // 人間向けレポート用の全問題リスト
  aiKeyRisks: AIActionableRisk[];  // AI向けの優先順位付き問題リスト
}

// UnifiedAIFormatterのオプション
export interface UnifiedAIFormatterOptions {
  // レポートの出力先パス
  reportPath?: string;
  
  // 最大リスク数（デフォルト: 10）
  maxRisks?: number;
  
  // 含めるリスクレベル
  includeRiskLevels?: string[];
  
  // 実際のHTMLレポートパス (Issue #58)
  htmlReportPath?: string;
}

// エラー処理
export interface AIOutputError extends Error {
  code: 'CONTEXT_EXTRACTION_FAILED' | 'FORMAT_GENERATION_FAILED' | 'SIZE_LIMIT_EXCEEDED' | 'TOKEN_LIMIT_EXCEEDED';
  details?: any;
}