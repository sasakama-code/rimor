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
import { PathSecurity } from '../../utils/pathSecurity';
import {
  AIJsonOutput,
  AIRisk,
  AnalysisResultWithPlugins,
  PluginResult,
  Detection,
  TaintFlowData,
  TaintSummaryData,
  convertToAIJson
} from './analyze-types';
import { Issue, TaintAnalysisResult, TaintFlow, ProjectAnalysisResult } from '../../core/types';
import { TaintLevel } from '../../core/types/analysis-types';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html' | 'ai-json';
  
  // v0.8.0 新オプション
  outputJson?: string;      // JSON出力先ファイル
  outputMarkdown?: string;  // Markdown出力先ファイル
  outputHtml?: string;      // HTML出力先ファイル
  outputAiJson?: string;    // AI JSON出力先ファイル (Issue #58)
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
  private generatedHtmlPath?: string; // HTMLレポートパスを保持

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
      format: (cliValidation.sanitizedArgs.format || options.format) as AnalyzeOptions['format']
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
      if ('initialize' in reporter && typeof (reporter as Record<string, unknown>).initialize === 'function') {
        await (reporter as { initialize(): Promise<void> }).initialize();
      }
      
      // 進行状況の表示（PIIマスキング適用）
      if (!sanitizedOptions.outputJson && !sanitizedOptions.outputMarkdown && !sanitizedOptions.outputHtml && sanitizedOptions.format !== 'json') {
        console.log(await OutputFormatter.header("Rimor v0.8.0 - Context Engineering"));
        const maskedPath = PathSecurity.toRelativeOrMasked(targetPath);
        console.log(await OutputFormatter.info(`分析対象: ${maskedPath}`));
        
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
          // HTMLレポートパスを保存（AI JSON生成時に使用）
          this.generatedHtmlPath = result.outputPath;
          console.log(await OutputFormatter.success(`HTMLレポートを生成しました: ${result.outputPath}`));
        } else {
          console.error(await OutputFormatter.error(`HTMLレポート生成に失敗しました: ${result.error}`));
        }
      }
      
      // AI JSON出力 (Issue #58)
      if (sanitizedOptions.format === 'ai-json' || sanitizedOptions.outputAiJson) {
        await this.generateAIJson(analysisResult, sanitizedOptions);
        return;
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
          // JSON形式の場合は直接出力（フォーマッターを通さない）
          if (sanitizedOptions.format === 'json') {
            console.log(result.content);
          } else {
            reporter.printToConsole(result.content);
          }
        } else if (!result.success) {
          console.error(await OutputFormatter.error(`レポート生成に失敗しました: ${result.error}`));
        }
      }
      
      // 終了コード設定
      if (analysisResult.issues.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error("Original error:", error);
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
   * AI JSON生成 (Issue #58)
   * UnifiedAnalysisResultをAI向けJSON形式に変換して出力
   */
  private async generateAIJson(
    analysisResult: AnalysisResultWithPlugins,
    options: AnalyzeOptions
  ): Promise<void> {
    try {
      // 簡易実装: 分析結果から直接AI JSONを生成
      const issueCount = analysisResult?.issues?.length || 0;
      const score = issueCount === 0 ? 100 : Math.max(0, 100 - issueCount * 10);
      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
      
      const aiJson: AIJsonOutput = {
        overallAssessment: `プロジェクト品質評価結果:\n総合スコア: ${score}/100\nグレード: ${grade}\n\n検出された問題: ${issueCount}件`,
        keyRisks: (analysisResult?.issues?.slice(0, 10).map((issue) => {
          const risk: AIRisk = {
            problem: issue.message || '問題が検出されました',
            riskLevel: this.mapSeverityToRiskLevel(issue.severity),
            context: {
              filePath: issue.file || 'unknown',
              codeSnippet: '',
              startLine: issue.line || 0,
              endLine: issue.line || 0
            },
            suggestedAction: {
              type: 'ADD_MISSING_TEST',
              description: 'テストを追加してください',
              example: ''
            }
          };
          return risk;
        }) || []) as AIRisk[],
        fullReportUrl: options.outputHtml || '.rimor/reports/index.html'
      };
      
      // 出力
      if (options.outputAiJson) {
        const outputPath = path.resolve(options.outputAiJson);
        const outputDir = path.dirname(outputPath);
        
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, JSON.stringify(aiJson, null, 2));
        console.log(await OutputFormatter.success(`AI JSONレポートを生成しました: ${outputPath}`));
      } else {
        // コンソール出力
        console.log(JSON.stringify(aiJson, null, 2));
      }
    } catch (error) {
      // エラーの詳細を出力
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(await OutputFormatter.error(`AI JSON生成に失敗しました: ${errorMessage}`));
      
      // スタックトレースも出力（verboseモード時）
      if (options.verbose && error instanceof Error) {
        console.error('詳細:', error.stack);
      }
      
      // エラーコード1で終了
      process.exit(1);
    }
  }
  
  /**
   * アノテーション生成処理
   */
  private async generateAnnotations(
    analysisResult: AnalysisResultWithPlugins,
    reporter: IReporter & { generateAnnotations?: Function; printToConsole?: Function },
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
      
      const result = await (reporter.generateAnnotations as Function)(
        analysisResult,
        annotationOptions
      );
      
      if (result.success) {
        if (options.preview) {
          console.log(await OutputFormatter.header("アノテーションプレビュー"));
          if (reporter.printToConsole) {
            reporter.printToConsole(result.content!);
          }
        } else {
          console.log(await OutputFormatter.success("アノテーションを生成しました"));
          if (reporter.printToConsole) {
            reporter.printToConsole(result.content!);
          }
        }
      } else {
        console.error(await OutputFormatter.error(`アノテーション生成に失敗しました: ${result.error}`));
      }
    } else {
      console.error(await OutputFormatter.error("このバージョンのReporterはアノテーション生成をサポートしていません"));
    }
  }
  
  /**
   * Taint解析結果を取得
   * @param targetPath 分析対象パス
   * @param analysisResult 既存の分析結果
   * @returns TaintAnalysisResult
   */
  private async getTaintAnalysisResult(targetPath: string, analysisResult: AnalysisResultWithPlugins): Promise<TaintAnalysisResult> {
    try {
      // 既存の分析結果からTaint関連の情報を抽出
      if (analysisResult?.pluginResults?.['taint-analysis']) {
        // 既にTaint解析が実行されている場合はその結果を使用
        return this.convertToTaintAnalysisResult(analysisResult.pluginResults['taint-analysis']);
      }
      
      // 分析結果からissuesを基にTaintAnalysisResultを生成
      // 実際のTaint解析は重いため、既存の分析結果から変換する
      if (analysisResult?.issues && Array.isArray(analysisResult.issues)) {
        return this.convertIssuesToTaintResult(analysisResult.issues);
      }
      
      // フォールバック: デフォルト値を返す
      return this.getDefaultTaintResult();
      
    } catch (error) {
      // エラー時はフォールバック
      console.warn('Taint解析結果の取得に失敗しました。デフォルト値を使用します。', error);
      return this.getDefaultTaintResult();
    }
  }
  
  /**
   * デフォルトのTaintAnalysisResultを返す
   */
  private getDefaultTaintResult(): TaintAnalysisResult {
    return {
      flows: [],
      summary: {
        totalFlows: 0,
        criticalFlows: 0,
        highFlows: 0,
        mediumFlows: 0,
        lowFlows: 0,
        sourcesCount: 0,
        sinksCount: 0,
        sanitizersCount: 0
      },
      recommendations: []
    };
  }
  
  /**
   * 分析結果のissuesをTaintAnalysisResult形式に変換
   */
  private convertIssuesToTaintResult(issues: Issue[]): TaintAnalysisResult {
    // セキュリティ関連のissueをTaintフローとして扱う
    const securityIssues = issues.filter(issue => 
      issue.type?.includes('security') || 
      issue.type?.includes('taint') ||
      issue.type?.includes('injection') ||
      issue.type?.includes('xss') ||
      issue.type?.includes('sql') ||
      issue.severity === 'critical' ||
      issue.severity === 'high'
    );
    
    const flows: TaintFlow[] = securityIssues.map((issue, index) => ({
      id: `flow-${index}`,
      source: 'user-input',
      sink: this.inferSinkFromIssue(issue),
      taintLevel: this.mapSeverityToLevel(issue.severity) as TaintLevel,
      path: [],
      confidence: 0.8,
      location: {
        file: issue.file || 'unknown',
        line: issue.line || 0
      }
    }));
    
    const summary = {
      totalFlows: flows.length,
      criticalFlows: flows.filter(f => f.taintLevel === 'critical').length,
      highFlows: flows.filter(f => f.taintLevel === 'high').length,
      mediumFlows: flows.filter(f => f.taintLevel === 'medium').length,
      lowFlows: flows.filter(f => f.taintLevel === 'low').length,
      sourcesCount: flows.length > 0 ? 1 : 0,
      sinksCount: new Set(flows.map(f => f.sink)).size,
      sanitizersCount: 0
    };
    
    return { flows, summary, recommendations: [] } as TaintAnalysisResult;
  }
  
  /**
   * issueからsinkのタイプを推論
   */
  private inferSinkFromIssue(issue: Issue): string {
    const type = issue.type?.toLowerCase() || '';
    if (type.includes('sql')) return 'database';
    if (type.includes('xss')) return 'html-output';
    if (type.includes('command')) return 'shell-command';
    if (type.includes('file')) return 'file-system';
    return 'unknown-sink';
  }
  
  /**
   * プラグイン結果をTaintAnalysisResult形式に変換
   */
  private convertToTaintAnalysisResult(pluginResults: PluginResult): TaintAnalysisResult {
    // プラグイン結果からTaintAnalysisResult形式への変換
    const flows: TaintFlow[] = pluginResults.detections?.map((detection) => ({
      id: detection.patternId,
      source: detection.metadata?.source || 'unknown',
      sink: detection.metadata?.sink || 'unknown',
      taintLevel: this.mapSeverityToLevel(detection.severity) as TaintLevel,
      path: [],
      confidence: 0.8,
      location: detection.location
    })) || [];
    
    const summary = {
      totalFlows: flows.length,
      criticalFlows: flows.filter((f) => f.taintLevel === 'critical').length,
      highFlows: flows.filter((f) => f.taintLevel === 'high').length,
      mediumFlows: flows.filter((f) => f.taintLevel === 'medium').length,
      lowFlows: flows.filter((f) => f.taintLevel === 'low').length,
      sourcesCount: new Set(flows.map((f) => f.source)).size,
      sinksCount: new Set(flows.map((f) => f.sink)).size,
      sanitizersCount: 0
    };
    
    return { flows, summary, recommendations: [] } as TaintAnalysisResult;
  }
  
  /**
   * プロジェクト解析結果をTaintAnalysisResult形式に変換
   */
  private convertProjectAnalysisToTaintResult(projectAnalysis: ProjectAnalysisResult): TaintAnalysisResult {
    // プロジェクト解析結果からの変換ロジック
    const flows: TaintFlow[] = projectAnalysis.issues?.map((issue) => ({
      id: `flow-${Math.random()}`,
      source: 'user-input',
      sink: 'database',
      taintLevel: this.mapSeverityToLevel(issue.severity) as TaintLevel,
      path: [],
      confidence: 0.8
    })) || [];
    
    const summary = {
      totalFlows: flows.length,
      criticalFlows: flows.filter((f) => f.taintLevel === 'critical').length,
      highFlows: flows.filter((f) => f.taintLevel === 'high').length,
      mediumFlows: flows.filter((f) => f.taintLevel === 'medium').length,
      lowFlows: flows.filter((f) => f.taintLevel === 'low').length,
      sourcesCount: 0,
      sinksCount: 0,
      sanitizersCount: 0
    };
    
    return { flows, summary, recommendations: [] } as TaintAnalysisResult;
  }
  
  /**
   * 重要度レベルのマッピング
   */
  private mapSeverityToLevel(severity?: string): TaintLevel {
    const mapping: Record<string, string> = {
      'error': 'critical',
      'critical': 'critical',
      'high': 'high',
      'warning': 'medium',
      'medium': 'medium',
      'info': 'low',
      'low': 'low'
    };
    const key = severity?.toLowerCase();
    return (key && mapping[key] ? mapping[key] : 'medium') as TaintLevel;
  }

  /**
   * Severityをリスクレベルにマッピング
   */
  private mapSeverityToRiskLevel(severity?: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'CRITICAL';
      case 'high':
      case 'warning':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'info':
      case 'low':
      default:
        return 'LOW';
    }
  }
}