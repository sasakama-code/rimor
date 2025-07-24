import { Issue, ProjectContext } from '../core/types';
import { FileScore, ProjectScore } from '../scoring/types';

/**
 * AI向け出力形式の型定義 v0.5.0
 * AI-Optimized-Output-Requirements-v0.5.0.mdに基づく実装
 */

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

// エラー処理
export interface AIOutputError extends Error {
  code: 'CONTEXT_EXTRACTION_FAILED' | 'FORMAT_GENERATION_FAILED' | 'SIZE_LIMIT_EXCEEDED' | 'TOKEN_LIMIT_EXCEEDED';
  details?: any;
}