import { CoreTypes, TypeGuards, TypeUtils } from '../../core/types/core-definitions';
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
 * CoreTypes.Issueを使用
 */
// Migrated to CoreTypes - Import from core-definitions
import type { Issue } from '../../core/types/core-definitions';
export type { Issue };

/**
 * プラグイン結果の型定義
 */
export interface PluginResult {
  pluginId: string;
  pluginName: string;
  issues: Issue[];
  score?: number;
}