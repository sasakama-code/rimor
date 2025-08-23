/**
 * Implementation Truth Analyze Command Types
 * v0.9.0 - AIコーディング時代の品質保証エンジン専用CLIコマンド型定義
 * 
 * SOLID原則: インターフェース分離の原則に従った型定義の分離
 */

import { ImplementationTruthAnalysisResult } from '../../core/UnifiedAnalysisEngine';
import { ImplementationTruthReport, ImplementationTruthReportFormat } from '../../reporting/core/ImplementationTruthReportEngine';

/**
 * Implementation Truth分析コマンドのオプション
 */
export interface ImplementationTruthAnalyzeOptions {
  /**
   * プロダクションコードのパス
   */
  productionPath: string;

  /**
   * テストコードのパス（オプション）
   */
  testPath?: string;

  /**
   * 出力ファイルパス
   */
  output?: string;

  /**
   * 出力形式
   */
  format?: ImplementationTruthReportFormat;

  /**
   * 詳細レベル
   */
  detailLevel?: 'summary' | 'detailed' | 'comprehensive';

  /**
   * AI向け最適化
   */
  optimizeForAI?: boolean;

  /**
   * 詳細な進捗表示
   */
  verbose?: boolean;

  /**
   * メタデータを含むか
   */
  includeMetadata?: boolean;

  /**
   * コード例を含むか
   */
  includeCodeExamples?: boolean;

  /**
   * 技術的詳細を含むか
   */
  includeTechnicalDetails?: boolean;

  /**
   * 最小重要度（この重要度以下のものは除外）
   */
  minSeverity?: 'low' | 'medium' | 'high' | 'critical';

  /**
   * 自動的に.rimorディレクトリに保存するか
   */
  saveToRimor?: boolean;
}

/**
 * Implementation Truth分析コマンドの結果
 */
export interface ImplementationTruthAnalyzeResult {
  /**
   * 分析結果
   */
  analysisResult: ImplementationTruthAnalysisResult;

  /**
   * フォーマット済みレポート
   */
  formattedReport: ImplementationTruthReport;

  /**
   * 実行メタデータ
   */
  metadata: {
    /**
     * 実行時間（ミリ秒）
     */
    executionTime: number;

    /**
     * 分析したプロダクションコードパス
     */
    analyzedProductionPath: string;

    /**
     * 分析したテストコードパス
     */
    analyzedTestPath?: string;

    /**
     * タイムスタンプ
     */
    timestamp: string;

    /**
     * 使用したフォーマット
     */
    usedFormat: ImplementationTruthReportFormat;

    /**
     * 出力パス（保存した場合）
     */
    outputPath?: string;
  };

  /**
   * エラー情報（エラーが発生した場合）
   */
  errors?: string[];

  /**
   * 警告情報
   */
  warnings?: string[];
}

/**
 * Implementation Truth分析コマンドインターフェース
 */
export interface IImplementationTruthAnalyzeCommand {
  /**
   * コマンド実行
   */
  execute(options: ImplementationTruthAnalyzeOptions): Promise<ImplementationTruthAnalyzeResult>;
}

/**
 * CLI引数パース結果
 */
export interface ParsedCliArgs {
  /**
   * プロダクションコードパス
   */
  productionPath: string;

  /**
   * テストコードパス
   */
  testPath?: string;

  /**
   * その他のオプション
   */
  options: Omit<ImplementationTruthAnalyzeOptions, 'productionPath' | 'testPath'>;
}

/**
 * レポート保存結果
 */
export interface ReportSaveResult {
  /**
   * 保存に成功したか
   */
  success: boolean;

  /**
   * 保存パス
   */
  filePath?: string;

  /**
   * エラーメッセージ（失敗時）
   */
  error?: string;

  /**
   * ファイルサイズ（バイト）
   */
  fileSize?: number;
}