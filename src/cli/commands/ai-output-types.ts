/**
 * ai-output.ts用の型定義
 * Issue #63: any型の削減と型安全性の向上
 */

/**
 * 分析結果の型定義（core/analyzer.tsのAnalysisResultを拡張）
 */
export interface AnalysisResult {
  files?: Array<{
    path: string;
    issues: Issue[];
  }>;
  issues?: Issue[];
  totalIssues?: number;
  summary?: {
    totalFiles: number;
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
  };
}

/**
 * Issue型定義
 */
export interface Issue {
  type: string;
  severity?: 'error' | 'high' | 'warning' | 'medium' | 'info' | 'low';
  message: string;
  line?: number;
  column?: number;
  file?: string;
  rule?: string;
}

/**
 * プラグイン結果の型定義
 */
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  issues: Issue[];
  score?: number;
}