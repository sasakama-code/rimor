/**
 * taint-analysis.ts用の型定義
 * Issue #63: any型の削減と型安全性の向上
 */

import { Argv } from 'yargs';

/**
 * Taint Analysisコマンドのオプション型
 */
export interface TaintAnalysisOptions {
  path: string;
  output: 'text' | 'json' | 'jaif';
  exportJaif?: string;
  generateStubs?: string;
  incremental: boolean;
  maxDepth: number;
  confidence: number;
  libraryBehavior: 'conservative' | 'optimistic';
}

/**
 * Taint Analysisの課題型
 */
export interface TaintIssue {
  type: string;
  severity: string;
  message: string;
  location: {
    line: number;
    column: number;
  };
  file?: string;
  suggestion?: string;
}