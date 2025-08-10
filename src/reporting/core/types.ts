/**
 * 統合レポートシステム型定義
 * v0.9.0 - Issue #64: レポートシステムの統合
 * 
 * SOLID原則: インターフェース分離原則
 * DRY原則: 共通型の一元管理
 * KISS原則: シンプルな型定義
 */

import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';

/**
 * レポート形式の種別
 */
export type ReportFormat = 
  | 'ai-json' 
  | 'markdown' 
  | 'html' 
  | 'executive-summary'
  | 'structured-json';

/**
 * フォーマット戦略インターフェース
 * SOLID原則: 依存性逆転原則 - 抽象に依存
 */
export interface IFormattingStrategy {
  name: string;
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): string | object;
  formatAsync?(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
}

/**
 * 統合レポート出力形式
 */
export interface UnifiedReport {
  format: ReportFormat;
  content: string | object;
  timestamp: string;
  metadata?: {
    generatedBy: string;
    version: string;
    processingTime?: number;
  };
}

/**
 * レポート生成オプション
 */
export interface ReportGenerationOptions {
  format?: ReportFormat;
  includeMetadata?: boolean;
  cacheEnabled?: boolean;
  parallelProcessing?: boolean;
  maxRisks?: number;
  includeRiskLevels?: string[];
  htmlReportPath?: string;
}

/**
 * レガシーアダプターインターフェース
 * 後方互換性のための抽象
 */
export interface ILegacyAdapter {
  format(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<string | object>;
  isDeprecated: boolean;
  deprecationMessage: string;
}