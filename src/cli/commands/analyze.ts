/**
 * Analyze Command
 * Context Engineering対応の分析コマンド
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
import { UnifiedAnalysisEngine } from '../../core/UnifiedAnalysisEngine';
import { ImplementationTruthReportEngine } from '../../reporting/core/ImplementationTruthReportEngine';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json' | 'markdown' | 'html' | 'ai-json';
  
  // 新オプション
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
  
  // 追加オプション
  severity?: string[];      // フィルタする重要度
  includeDetails?: boolean; // 詳細情報を含む
  includeRecommendations?: boolean; // 推奨事項を含む
  
  // v0.9.0 Implementation Truth オプション
  implementationTruth?: boolean;    // Implementation Truth分析を有効化
  testPath?: string;               // テストコードのパス（Implementation Truth用）
  productionCode?: boolean;        // プロダクションコード分析モード
  aiOutput?: boolean;              // AI向け最適化出力
  debug?: boolean;                 // デバッグモード（詳細なエラー情報を表示）
}

export class AnalyzeCommand {
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
      
      // 分析実行 - Implementation Truth機能統合
      let analysisResult;
      let implementationTruthResult = null;
      
      if (sanitizedOptions.implementationTruth || sanitizedOptions.productionCode || sanitizedOptions.aiOutput) {
        // v0.9.0 Implementation Truth分析を実行
        const unifiedEngine = new UnifiedAnalysisEngine();
        
        if (sanitizedOptions.verbose) {
          console.log(await OutputFormatter.info("分析モード: v0.9.0 (Implementation Truth Analysis)"));
          if (sanitizedOptions.testPath) {
            console.log(await OutputFormatter.info(`テストコードパス: ${sanitizedOptions.testPath}`));
          }
        }
        
        try {
          implementationTruthResult = await unifiedEngine.analyzeWithImplementationTruth(
            targetPath,
            sanitizedOptions.testPath
          );
          
          // 従来の形式に変換（互換性維持）
          analysisResult = this.convertImplementationTruthToAnalysisResult(implementationTruthResult);
          
          if (sanitizedOptions.verbose) {
            console.log(await OutputFormatter.success(
              `Implementation Truth分析完了: ${implementationTruthResult.summary.vulnerabilitiesDetected}個の脆弱性, ${implementationTruthResult.totalGapsDetected}個のギャップを検出`
            ));
          }
        } catch (error) {
          // エラー分類と詳細ハンドリング
          const errorInfo = this.categorizeImplementationTruthError(error);
          
          console.warn(await OutputFormatter.warning('Implementation Truth分析でエラーが発生しました。従来の分析にフォールバックします。'));
          console.warn(await OutputFormatter.warning(`エラー種別: ${errorInfo.category}`));
          console.warn(await OutputFormatter.warning(`概要: ${errorInfo.summary}`));
          
          // デバッグモードでの詳細情報表示
          if (sanitizedOptions.debug) {
            console.error(await OutputFormatter.error('=== デバッグ情報 ==='));
            console.error(await OutputFormatter.error(`エラー詳細: ${errorInfo.details}`));
            if (errorInfo.possibleCauses.length > 0) {
              console.error(await OutputFormatter.error('考えられる原因:'));
              for (const cause of errorInfo.possibleCauses) {
                console.error(await OutputFormatter.error(`  - ${cause}`));
              }
            }
            if (errorInfo.troubleshootingSteps.length > 0) {
              console.error(await OutputFormatter.error('トラブルシューティング手順:'));
              for (let index = 0; index < errorInfo.troubleshootingSteps.length; index++) {
                const step = errorInfo.troubleshootingSteps[index];
                console.error(await OutputFormatter.error(`  ${index + 1}. ${step}`));
              }
            }
            if (error instanceof Error && error.stack) {
              console.error(await OutputFormatter.error('スタックトレース:'));
              console.error(error.stack);
            }
          } else {
            console.info(await OutputFormatter.info('詳細なエラー情報は --debug オプションで確認できます'));
          }
          
          // フォールバック実行
          console.info(await OutputFormatter.info('従来の分析エンジンで続行します...'));
          analysisResult = await analysisEngine.analyze(targetPath);
        }
      } else {
        // 従来のv0.8.0分析を実行
        analysisResult = await analysisEngine.analyze(targetPath);
      }
      
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
            analysisResult as any,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult as any, reportOptions);
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
            analysisResult as any,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult as any, reportOptions);
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
            analysisResult as any,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult as any, reportOptions);
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
            analysisResult as any,
            securityResult,
            reportOptions
          );
        } else {
          result = await reporter.generateAnalysisReport(analysisResult as any, reportOptions);
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
      // AI JSON生成エラーの詳細分類
      const errorInfo = this.categorizeAIJsonError(error);
      
      console.error(await OutputFormatter.error('AI JSON生成でエラーが発生しました。'));
      console.error(await OutputFormatter.error(`エラー種別: ${errorInfo.category}`));
      console.error(await OutputFormatter.error(`概要: ${errorInfo.summary}`));
      
      // デバッグモードでの詳細情報表示
      if (options.debug) {
        console.error(await OutputFormatter.error('=== AI JSON生成デバッグ情報 ==='));
        console.error(await OutputFormatter.error(`エラー詳細: ${errorInfo.details}`));
        if (errorInfo.possibleCauses.length > 0) {
          console.error(await OutputFormatter.error('考えられる原因:'));
          for (const cause of errorInfo.possibleCauses) {
            console.error(await OutputFormatter.error(`  - ${cause}`));
          }
        }
        if (errorInfo.troubleshootingSteps.length > 0) {
          console.error(await OutputFormatter.error('トラブルシューティング手順:'));
          for (let index = 0; index < errorInfo.troubleshootingSteps.length; index++) {
            const step = errorInfo.troubleshootingSteps[index];
            console.error(await OutputFormatter.error(`  ${index + 1}. ${step}`));
          }
        }
        if (error instanceof Error && error.stack) {
          console.error(await OutputFormatter.error('スタックトレース:'));
          console.error(error.stack);
        }
      } else if (options.verbose && error instanceof Error) {
        console.error('詳細:', error.stack);
      } else {
        console.info(await OutputFormatter.info('詳細なエラー情報は --debug オプションで確認できます'));
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

  /**
   * Implementation Truth分析結果を従来の分析結果形式に変換
   * 互換性維持のための変換メソッド
   */
  private convertImplementationTruthToAnalysisResult(implementationTruthResult: any): ProjectAnalysisResult {
    const issues: Issue[] = [];
    
    // 脆弱性をIssueに変換
    if (implementationTruthResult.implementationTruth?.vulnerabilities) {
      for (const vulnerability of implementationTruthResult.implementationTruth.vulnerabilities) {
        issues.push({
          id: `vuln-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: vulnerability.type || 'security',
          severity: vulnerability.severity || 'medium',
          message: vulnerability.description || vulnerability.message || '',
          file: vulnerability.location?.file || '',
          line: vulnerability.location?.line || 0,
          column: vulnerability.location?.column || 0
        } as any);
      }
    }
    
    // 意図実現度ギャップをIssueに変換
    if (implementationTruthResult.intentRealizationResults) {
      for (const intentResult of implementationTruthResult.intentRealizationResults) {
        for (const gap of intentResult.gaps || []) {
          issues.push({
            id: `gap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: gap.type || 'intent-gap',
            severity: gap.severity || 'medium',
            message: gap.description || '',
            file: intentResult.testFile || '',
            line: gap.location?.line || 0,
            column: gap.location?.column || 0
          } as any);
        }
      }
    }
    
    // メタデータの生成
    const metadata = {
      version: '0.9.0',
      analysisMode: 'implementation-truth',
      timestamp: new Date().toISOString(),
      analysisEngine: 'UnifiedAnalysisEngine',
      implementationTruthData: implementationTruthResult // 元データを保持
    };
    
    return {
      projectPath: '.',
      timestamp: new Date(),
      duration: implementationTruthResult.metadata?.executionTime || 0,
      success: true,
      files: [],
      summary: {
        totalFiles: implementationTruthResult.summary?.totalFiles || 0,
        analyzedFiles: implementationTruthResult.summary?.totalFiles || 0,
        totalIssues: issues.length
      } as any,
      issues,
      improvements: [],
      qualityScore: {
        overall: implementationTruthResult.overallScore || 0
      } as any,
      metadata,
      // 互換性のための追加プロパティ
      totalFiles: implementationTruthResult.summary?.totalFiles || 0,
      executionTime: implementationTruthResult.metadata?.executionTime || 0
    } as any;
  }

  /**
   * Implementation Truth分析のエラーを分類し、詳細情報を提供
   * デバッグモードでのトラブルシューティング支援
   */
  private categorizeImplementationTruthError(error: unknown): {
    category: string;
    summary: string;
    details: string;
    possibleCauses: string[];
    troubleshootingSteps: string[];
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    // ファイルシステム関連エラー
    if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
      return {
        category: 'ファイルシステムエラー',
        summary: '指定されたファイルまたはディレクトリが見つかりません',
        details: errorMessage,
        possibleCauses: [
          '指定されたパスが存在しない',
          'ファイルが移動または削除された',
          '相対パスの解決に失敗している',
          'アクセス権限が不足している'
        ],
        troubleshootingSteps: [
          'パスが正しく指定されているか確認してください',
          'ファイルまたはディレクトリが存在するか確認してください',
          '絶対パスで指定してみてください',
          'アクセス権限を確認してください (ls -la)'
        ]
      };
    }

    // パーミッション関連エラー
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      return {
        category: 'アクセス権限エラー',
        summary: 'ファイルまたはディレクトリへのアクセス権限が不足しています',
        details: errorMessage,
        possibleCauses: [
          'ファイルの読み取り権限がない',
          'ディレクトリの実行権限がない',
          'ファイルが他のプロセスによってロックされている',
          '管理者権限が必要'
        ],
        troubleshootingSteps: [
          'ファイルの権限を確認してください (ls -la)',
          'chmod +r で読み取り権限を付与してください',
          'sudo で実行してみてください（注意して使用）',
          'ファイルがロックされていないか確認してください'
        ]
      };
    }

    // TypeScript解析エラー
    if (errorMessage.includes('TypeScript') || errorMessage.includes('syntax error') || errorMessage.includes('parsing')) {
      return {
        category: 'TypeScript解析エラー',
        summary: 'TypeScriptコードの解析中にエラーが発生しました',
        details: errorMessage,
        possibleCauses: [
          'TypeScriptの構文エラー',
          'サポートされていないTypeScript機能の使用',
          'tsconfig.jsonの設定に問題がある',
          '依存関係の型定義が不足している'
        ],
        troubleshootingSteps: [
          'TypeScriptコンパイラーでコードを確認してください (tsc --noEmit)',
          'tsconfig.jsonの設定を確認してください',
          '型定義ファイル（@types/*）をインストールしてください',
          'コードの構文エラーを修正してください'
        ]
      };
    }

    // メモリ不足エラー
    if (errorMessage.includes('out of memory') || errorMessage.includes('heap') || 
        errorMessage.includes('Maximum call stack')) {
      return {
        category: 'メモリ不足エラー',
        summary: 'メモリ不足またはスタックオーバーフローが発生しました',
        details: errorMessage,
        possibleCauses: [
          '分析対象のコードベースが大きすぎる',
          '無限ループや深い再帰が発生している',
          'Node.jsのヒープサイズが不足している',
          'メモリリークが発生している'
        ],
        troubleshootingSteps: [
          'Node.jsのヒープサイズを増加してください (--max-old-space-size=4096)',
          '分析対象を小さく分割してください',
          '不要なファイルを除外してください',
          'システムのメモリ使用量を確認してください'
        ]
      };
    }

    // ネットワーク関連エラー
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || 
        errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
      return {
        category: 'ネットワークエラー',
        summary: 'ネットワーク接続または外部サービスへのアクセスに失敗しました',
        details: errorMessage,
        possibleCauses: [
          'インターネット接続が不安定',
          '外部APIサービスが利用できない',
          'プロキシ設定に問題がある',
          'ファイアウォールによるブロック'
        ],
        troubleshootingSteps: [
          'インターネット接続を確認してください',
          'プロキシ設定を確認してください',
          'しばらく時間をおいて再試行してください',
          'ファイアウォール設定を確認してください'
        ]
      };
    }

    // 依存関係エラー
    if (errorMessage.includes('module') || errorMessage.includes('import') || 
        errorMessage.includes('require') || errorMessage.includes('dependency')) {
      return {
        category: '依存関係エラー',
        summary: 'モジュールまたは依存関係の解決に失敗しました',
        details: errorMessage,
        possibleCauses: [
          '必要なnpmパッケージがインストールされていない',
          'node_modulesが破損している',
          'パッケージのバージョンに互換性がない',
          'モジュールパスの解決に失敗している'
        ],
        troubleshootingSteps: [
          'npm install または yarn install を実行してください',
          'node_modules を削除して再インストールしてください',
          'package.jsonの依存関係を確認してください',
          'パッケージのバージョン互換性を確認してください'
        ]
      };
    }

    // その他の一般的なエラー
    return {
      category: '一般的なエラー',
      summary: 'Implementation Truth分析中に予期しないエラーが発生しました',
      details: errorMessage,
      possibleCauses: [
        'ソフトウェアのバグ',
        'サポートされていない環境またはNode.jsバージョン',
        '一時的なシステム問題',
        '予期しないコード構造'
      ],
      troubleshootingSteps: [
        'Node.jsのバージョンを確認してください (推奨: 18.x以上)',
        'Rimorを最新バージョンにアップデートしてください',
        '一時ファイルとキャッシュをクリアしてください',
        'このエラーをGitHubのIssueとして報告してください',
        '問題が再現する最小ケースを作成してください'
      ]
    };
  }

  /**
   * AI JSON生成のエラーを分類し、詳細情報を提供
   */
  private categorizeAIJsonError(error: unknown): {
    category: string;
    summary: string;
    details: string;
    possibleCauses: string[];
    troubleshootingSteps: string[];
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // ファイル書き込みエラー
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
      return {
        category: 'ファイル書き込みエラー',
        summary: 'AI JSONファイルの書き込み権限が不足しています',
        details: errorMessage,
        possibleCauses: [
          '出力ディレクトリの書き込み権限がない',
          'ファイルが他のプロセスで使用中',
          'ディスク容量不足'
        ],
        troubleshootingSteps: [
          '出力ディレクトリの権限を確認してください',
          '別の出力パスを指定してください',
          'ディスク容量を確認してください'
        ]
      };
    }

    // JSON シリアライゼーションエラー
    if (errorMessage.includes('circular') || errorMessage.includes('Converting circular')) {
      return {
        category: 'JSON変換エラー',
        summary: '循環参照によりJSONシリアライゼーションに失敗しました',
        details: errorMessage,
        possibleCauses: [
          '分析結果に循環参照が含まれている',
          'オブジェクト構造に問題がある'
        ],
        troubleshootingSteps: [
          'レポート形式をJSONに変更してみてください',
          '分析対象を小さく分割してください',
          'この問題をGitHubに報告してください'
        ]
      };
    }

    // メモリ不足エラー
    if (errorMessage.includes('out of memory') || errorMessage.includes('heap')) {
      return {
        category: 'メモリ不足エラー',
        summary: 'AI JSON生成時にメモリ不足が発生しました',
        details: errorMessage,
        possibleCauses: [
          '分析結果が大きすぎる',
          'Node.jsのヒープサイズ不足'
        ],
        troubleshootingSteps: [
          'Node.jsのヒープサイズを増加してください',
          '分析対象を小さく分割してください',
          '不要な詳細オプションを無効化してください'
        ]
      };
    }

    return {
      category: 'AI JSON生成エラー',
      summary: 'AI JSON生成中に予期しないエラーが発生しました',
      details: errorMessage,
      possibleCauses: [
        'データ構造の問題',
        'ソフトウェアのバグ'
      ],
      troubleshootingSteps: [
        'JSONまたはMarkdown形式で出力してみてください',
        'この問題をGitHubに報告してください'
      ]
    };
  }
}