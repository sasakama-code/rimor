/**
 * Analyze Command v0.8.0
 * Context Engineering対応の新しい分析コマンド
 */

import { container, initializeContainer, TYPES } from '../../container';
import { IAnalysisEngine } from '../../core/interfaces/IAnalysisEngine';
import { IReporter, ReportFormat, ReportOptions } from '../../core/interfaces/IReporter';
import { ISecurityAuditor } from '../../core/interfaces/ISecurityAuditor';
import { OutputFormatter } from '../output';
import { errorHandler } from '../../utils/errorHandler';
import { cleanupManager } from '../../utils/cleanupManager';
import { CLISecurity, DEFAULT_CLI_SECURITY_LIMITS } from '../../security/CLISecurity';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html';
  
  // v0.8.0 新オプション
  outputJson?: string;      // JSON出力先ファイル
  outputMarkdown?: string;  // Markdown出力先ファイル
  outputHtml?: string;      // HTML出力先ファイル
  annotate?: boolean;       // インラインアノテーション生成
  annotateFormat?: 'inline' | 'block';  // アノテーション形式
  annotateOutput?: string;  // アノテーション出力先ディレクトリ
  preview?: boolean;        // アノテーションプレビューモード
  
  // 既存オプション
  parallel?: boolean;
  batchSize?: number;
  concurrency?: number;
  cache?: boolean;
  clearCache?: boolean;
  showCacheStats?: boolean;
  performance?: boolean;
  showPerformanceReport?: boolean;
  
  // v0.8.0 追加オプション
  severity?: string[];      // フィルタする重要度
  includeDetails?: boolean; // 詳細情報を含む
  includeRecommendations?: boolean; // 推奨事項を含む
}

export class AnalyzeCommandV8 {
  private cliSecurity: CLISecurity;
  private container: typeof container;

  constructor(customContainer?: typeof container, customCliSecurity?: CLISecurity) {
    this.cliSecurity = customCliSecurity || new CLISecurity(process.cwd(), DEFAULT_CLI_SECURITY_LIMITS);
    this.container = customContainer || initializeContainer();
  }
  
  async execute(options: AnalyzeOptions): Promise<void> {
    // CLI引数の検証
    const cliValidation = this.cliSecurity.validateAllArguments({
      path: options.path,
      format: options.format,
      outputFile: options.outputJson || options.outputMarkdown || options.outputHtml
    });

    // セキュリティ問題への対応
    if (cliValidation.allSecurityIssues.length > 0) {
      console.error(await OutputFormatter.error('🛡️  セキュリティ問題を検出しました:'));
      for (const issue of cliValidation.allSecurityIssues) {
        console.error(await OutputFormatter.error(`  - ${issue}`));
      }
    }

    // エラーがある場合は実行停止
    if (!cliValidation.isValid) {
      console.error(await OutputFormatter.error('❌ CLI引数の検証に失敗しました:'));
      for (const error of cliValidation.allErrors) {
        console.error(await OutputFormatter.error(`  - ${error}`));
      }
      process.exit(1);
    }

    // 警告の表示
    if (cliValidation.allWarnings.length > 0) {
      console.warn(await OutputFormatter.warning('⚠️  以下の警告があります:'));
      for (const warning of cliValidation.allWarnings) {
        console.warn(await OutputFormatter.warning(`  - ${warning}`));
      }
    }

    // サニタイズされた引数を使用
    const sanitizedOptions: AnalyzeOptions = {
      ...options,
      path: cliValidation.sanitizedArgs.path || options.path,
      format: (cliValidation.sanitizedArgs.format || options.format) as any
    };

    // クリーンアップ実行
    await cleanupManager.performStartupCleanup();
    
    try {
      const targetPath = path.resolve(sanitizedOptions.path);
      
      // パスの存在確認
      if (!fs.existsSync(targetPath)) {
        console.error(await OutputFormatter.error(`指定されたパスが存在しません: ${targetPath}`));
        process.exit(1);
      }
      
      // DIコンテナからサービスを取得
      const analysisEngine = this.container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
      const reporter = this.container.get<IReporter>(TYPES.Reporter);
      const securityAuditor = this.container.get<ISecurityAuditor>(TYPES.SecurityAuditor);
      
      // 初期化
      if ('initialize' in reporter) {
        await (reporter as any).initialize();
      }
      
      // 進行状況の表示
      if (!sanitizedOptions.outputJson && !sanitizedOptions.outputMarkdown && !sanitizedOptions.outputHtml) {
        console.log(await OutputFormatter.header("Rimor v0.8.0 - Context Engineering"));
        console.log(await OutputFormatter.info(`分析対象: ${targetPath}`));
        
        if (sanitizedOptions.verbose) {
          console.log(await OutputFormatter.info("分析モード: v0.8.0 (DI Container + Context Engineering)"));
        }
      }
      
      // 分析実行
      const analysisResult = await analysisEngine.analyze(targetPath);
      
      // セキュリティ監査実行（オプション）
      let securityResult = null;
      if (options.includeDetails) {
        securityResult = await securityAuditor.audit(targetPath);
      }
      
      // アノテーション生成モード
      if (sanitizedOptions.annotate) {
        await this.generateAnnotations(analysisResult, reporter, sanitizedOptions);
        return;
      }
      
      // JSON出力
      if (sanitizedOptions.outputJson) {
        const reportOptions: ReportOptions = {
          format: ReportFormat.JSON,
          outputPath: sanitizedOptions.outputJson,
          includeDetails: sanitizedOptions.includeDetails,
          includeRecommendations: sanitizedOptions.includeRecommendations
        };
        
        let result;
        if (securityResult) {
          result = await reporter.generateCombinedReport!(
            analysisResult,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult, reportOptions);
        }
        
        if (result.success) {
          console.log(await OutputFormatter.success(`JSONレポートを生成しました: ${result.outputPath}`));
        } else {
          console.error(await OutputFormatter.error(`JSONレポート生成に失敗しました: ${result.error}`));
        }
      }
      
      // Markdown出力
      if (sanitizedOptions.outputMarkdown) {
        const reportOptions: ReportOptions = {
          format: ReportFormat.MARKDOWN,
          outputPath: sanitizedOptions.outputMarkdown,
          includeDetails: sanitizedOptions.includeDetails,
          includeSummary: true,
          includeRecommendations: sanitizedOptions.includeRecommendations
        };
        
        let result;
        if (securityResult) {
          result = await reporter.generateCombinedReport!(
            analysisResult,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult, reportOptions);
        }
        
        if (result.success) {
          console.log(await OutputFormatter.success(`Markdownレポートを生成しました: ${result.outputPath}`));
        } else {
          console.error(await OutputFormatter.error(`Markdownレポート生成に失敗しました: ${result.error}`));
        }
      }
      
      // HTML出力
      if (sanitizedOptions.outputHtml) {
        const reportOptions: ReportOptions = {
          format: ReportFormat.HTML,
          outputPath: sanitizedOptions.outputHtml,
          includeDetails: sanitizedOptions.includeDetails,
          includeSummary: true,
          includeRecommendations: sanitizedOptions.includeRecommendations
        };
        
        let result;
        if (securityResult) {
          result = await reporter.generateCombinedReport!(
            analysisResult,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult, reportOptions);
        }
        
        if (result.success) {
          console.log(await OutputFormatter.success(`HTMLレポートを生成しました: ${result.outputPath}`));
        } else {
          console.error(await OutputFormatter.error(`HTMLレポート生成に失敗しました: ${result.error}`));
        }
      }
      
      // デフォルト出力（コンソール）
      if (!sanitizedOptions.outputJson && !sanitizedOptions.outputMarkdown && !sanitizedOptions.outputHtml) {
        const format = sanitizedOptions.format || 'text';
        const reportOptions: ReportOptions = {
          format: format === 'text' ? ReportFormat.TEXT : 
                  format === 'json' ? ReportFormat.JSON :
                  format === 'markdown' ? ReportFormat.MARKDOWN :
                  ReportFormat.TEXT,
          includeDetails: sanitizedOptions.includeDetails,
          includeSummary: true,
          includeRecommendations: sanitizedOptions.includeRecommendations
        };
        
        let result;
        if (securityResult) {
          result = await reporter.generateCombinedReport!(
            analysisResult,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult, reportOptions);
        }
        
        if (result.success && result.content) {
          reporter.printToConsole(result.content);
        } else if (!result.success) {
          console.error(await OutputFormatter.error(`レポート生成に失敗しました: ${result.error}`));
        }
      }
      
      // 終了コード設定
      if (analysisResult.issues.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      const errorInfo = errorHandler.handleError(
        error,
        undefined,
        "分析中にエラーが発生しました"
      );
      console.error(await OutputFormatter.error(errorInfo.message));
      process.exit(1);
    }
  }
  
  /**
   * アノテーション生成処理
   */
  private async generateAnnotations(
    analysisResult: any,
    reporter: any,
    options: AnalyzeOptions
  ): Promise<void> {
    // StructuredReporterImplのgenerateAnnotationsメソッドを使用
    if ('generateAnnotations' in reporter) {
      const annotationOptions = {
        outputDir: options.annotateOutput,
        overwrite: false,
        preview: options.preview,
        format: options.annotateFormat || 'inline',
        includeDataFlow: options.includeDetails
      };
      
      const result = await reporter.generateAnnotations(
        analysisResult,
        annotationOptions
      );
      
      if (result.success) {
        if (options.preview) {
          console.log(await OutputFormatter.header("アノテーションプレビュー"));
          reporter.printToConsole(result.content!);
        } else {
          console.log(await OutputFormatter.success("アノテーションを生成しました"));
          reporter.printToConsole(result.content!);
        }
      } else {
        console.error(await OutputFormatter.error(`アノテーション生成に失敗しました: ${result.error}`));
      }
    } else {
      console.error(await OutputFormatter.error("このバージョンのReporterはアノテーション生成をサポートしていません"));
    }
  }
}