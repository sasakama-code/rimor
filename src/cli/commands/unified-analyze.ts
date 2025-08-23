/**
 * Unified Analyze Command
 * TDD Green Phase - テストを通す最小限の実装
 * Phase 2: CLIコマンド統合
 */

import * as fs from 'fs';
import * as path from 'path';
import { UnifiedSecurityAnalysisOrchestrator } from '../../orchestrator/UnifiedSecurityAnalysisOrchestrator';
import { OrchestratorConfig } from '../../orchestrator/types';
import { UnifiedAnalyzeOptions, UnifiedAnalyzeResult, IUnifiedAnalyzeCommand } from './unified-analyze-types';
import { 
  TextReportFormatter, 
  JsonReportFormatter, 
  MarkdownReportFormatter, 
  HtmlReportFormatter, 
  IReportFormatter 
} from './formatters/ReportFormatter';

export class UnifiedAnalyzeCommand implements IUnifiedAnalyzeCommand {
  private readonly orchestrator: UnifiedSecurityAnalysisOrchestrator;
  private readonly formatters: Map<string, IReportFormatter>;

  constructor(orchestrator?: UnifiedSecurityAnalysisOrchestrator) {
    // 依存関係注入（DIP: Dependency Inversion Principle）
    this.orchestrator = orchestrator || new UnifiedSecurityAnalysisOrchestrator();
    
    // Strategy Pattern: フォーマッター戦略の初期化
    this.formatters = new Map<string, IReportFormatter>();
    this.formatters.set('text', new TextReportFormatter());
    this.formatters.set('json', new JsonReportFormatter());
    this.formatters.set('markdown', new MarkdownReportFormatter());
    this.formatters.set('html', new HtmlReportFormatter());
  }

  /**
   * 統合分析コマンドの実行
   * 単一責任の原則に従い、コマンド実行の責務のみを担う
   */
  async execute(options: UnifiedAnalyzeOptions): Promise<UnifiedAnalyzeResult> {
    const startTime = Date.now();

    // 入力値検証（Defensive Programming）
    this.validateOptions(options);

    // .rimorディレクトリの作成
    this.ensureRimorDirectory();

    // プログレス表示
    if (options.verbose) {
      console.log(`分析開始: ${options.path}`);
    }

    try {
      // 統合分析実行
      const analysisResult = await this.orchestrator.analyzeTestDirectory(options.path);
      
      // 結果フォーマット
      const formattedResult = this.formatResult(analysisResult, options);
      
      // ファイル出力（.rimorディレクトリに統一）
      if (options.output) {
        const outputPath = this.getOutputPath(options.output, options.format);
        this.writeResultToFile(formattedResult.content, outputPath);
        if (options.verbose) {
          console.log(`レポート保存: ${outputPath}`);
        }
      }

      // 完了メッセージ
      if (options.verbose) {
        const executionTime = Date.now() - startTime;
        console.log(`分析完了 (${executionTime}ms)`);
      }

      return {
        ...formattedResult,
        metadata: {
          executionTime: Date.now() - startTime,
          analyzedPath: options.path,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      // エラーハンドリング（Defensive Programming）
      console.error(`エラー: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * オプション検証
   * 単一責任の原則：入力値検証の責務を分離
   */
  private validateOptions(options: UnifiedAnalyzeOptions): void {
    // パスの存在確認
    if (!fs.existsSync(options.path)) {
      throw new Error('指定されたパスが存在しません');
    }

    // ディレクトリ確認
    const stat = fs.statSync(options.path);
    if (!stat.isDirectory()) {
      throw new Error('指定されたパスはディレクトリである必要があります');
    }
  }

  /**
   * 結果フォーマット
   * Strategy Pattern: フォーマッター戦略による処理の委譲
   */
  private formatResult(analysisResult: any, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult {
    const format = options.format || 'text';

    // Strategy Pattern: フォーマッター戦略の選択
    if (format === 'ai-json') {
      // AI-JSON形式は独自実装（将来的にはStrategy化可能）
      return {
        format: 'ai-json',
        content: this.generateAIJsonReport(analysisResult, options),
        metadata: {
          executionTime: 0, // 後でexecuteメソッドで上書きされる
          analyzedPath: options.path,
          timestamp: new Date().toISOString()
        }
      };
    }

    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`サポートされていないフォーマット: ${format}`);
    }

    // Strategy Pattern: 戦略への処理委譲
    return formatter.format(analysisResult, options);
  }


  /**
   * AI JSON レポート生成
   * AI向け最適化された構造化データ
   */
  private generateAIJsonReport(analysisResult: any, options: UnifiedAnalyzeOptions): string {
    // AI向け最適化されたデータ構造
    const aiOptimizedData = {
      summary: {
        overallGrade: analysisResult.unifiedReport.summary.overallGrade,
        overallScore: analysisResult.unifiedReport.overallRiskScore,
        totalIssues: analysisResult.unifiedReport.summary.totalIssues,
        timestamp: new Date().toISOString()
      },
      security: {
        vulnerabilities: analysisResult.taintAnalysis.summary.totalVulnerabilities,
        riskLevel: analysisResult.nistEvaluation.summary.riskLevel
      },
      quality: {
        testIntents: analysisResult.intentAnalysis.summary.totalTests,
        gaps: analysisResult.gapAnalysis.summary.totalGaps,
        // Issue #83: カバレッジ統合データを含める
        coverageData: analysisResult.unifiedReport.qualityData || null
      },
      metadata: {
        analyzedPath: options.path,
        format: 'ai-json',
        rimorVersion: '0.9.0'
      }
    };

    return JSON.stringify(aiOptimizedData, null, 2);
  }

  /**
   * .rimorディレクトリの作成
   * ルートディレクトリを汚さないための専用ディレクトリ
   */
  private ensureRimorDirectory(): void {
    const rimorDir = '.rimor';
    if (!fs.existsSync(rimorDir)) {
      fs.mkdirSync(rimorDir, { recursive: true });
    }
  }

  /**
   * 出力パスの取得
   * .rimorディレクトリ内に統一
   */
  private getOutputPath(outputFile: string, format?: string): string {
    const rimorDir = '.rimor';
    
    // 絶対パスの場合はそのまま使用
    if (path.isAbsolute(outputFile)) {
      return outputFile;
    }
    
    // 相対パスの場合は.rimorディレクトリ内に配置
    let fileName = outputFile;
    
    // ファイル拡張子が指定されていない場合は、formatに基づいて追加
    if (!path.extname(fileName) && format) {
      const extensions: Record<string, string> = {
        'json': '.json',
        'ai-json': '.json',
        'markdown': '.md',
        'html': '.html',
        'text': '.txt'
      };
      fileName += extensions[format] || '.txt';
    }
    
    return path.join(rimorDir, fileName);
  }

  /**
   * ファイル出力
   * DRY原則：ファイル書き込み処理の一元化
   */
  private writeResultToFile(content: string, outputPath: string): void {
    // 出力ディレクトリの作成
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
  }
}