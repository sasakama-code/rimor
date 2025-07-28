/**
 * Reporter Interface
 * v0.8.0 - レポート生成のインターフェース定義
 */

import { AnalysisResult } from './IAnalysisEngine';
import { SecurityAuditResult } from './ISecurityAuditor';

/**
 * レポート形式
 */
export enum ReportFormat {
  TEXT = 'text',
  JSON = 'json',
  HTML = 'html',
  MARKDOWN = 'markdown'
}

/**
 * レポートオプション
 */
export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeDetails?: boolean;
  includeSummary?: boolean;
  includeRecommendations?: boolean;
  customTemplate?: string;
}

/**
 * レポート生成結果
 */
export interface ReportResult {
  success: boolean;
  outputPath?: string;
  content?: string;
  error?: string;
}

/**
 * レポーターインターフェース
 * 分析結果をユーザーフレンドリーな形式で出力
 */
export interface IReporter {
  /**
   * 分析結果レポートを生成
   */
  generateAnalysisReport(
    result: AnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * セキュリティ監査レポートを生成
   */
  generateSecurityReport(
    result: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * 統合レポートを生成
   */
  generateCombinedReport?(
    analysisResult: AnalysisResult,
    securityResult: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult>;
  
  /**
   * コンソール出力
   */
  printToConsole(content: string): void;
}