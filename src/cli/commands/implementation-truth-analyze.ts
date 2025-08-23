/**
 * Implementation Truth Analyze Command
 * v0.9.0 - AIコーディング時代の品質保証エンジン専用CLIコマンド実装
 * 
 * SOLID原則: 単一責任の原則に従ったコマンド実装
 * DRY原則: 既存のCLIコマンドパターンの継承
 * Defensive Programming: 入力値検証と例外処理の徹底
 */

import * as fs from 'fs';
import * as path from 'path';
import { UnifiedAnalysisEngine } from '../../core/UnifiedAnalysisEngine';
import { ImplementationTruthReportEngine } from '../../reporting/core/ImplementationTruthReportEngine';
import {
  ImplementationTruthAnalyzeOptions,
  ImplementationTruthAnalyzeResult,
  IImplementationTruthAnalyzeCommand,
  ReportSaveResult
} from './implementation-truth-analyze-types';

/**
 * Implementation Truth専用分析コマンド
 */
export class ImplementationTruthAnalyzeCommand implements IImplementationTruthAnalyzeCommand {
  private readonly analysisEngine: UnifiedAnalysisEngine;
  private readonly reportEngine: ImplementationTruthReportEngine;

  constructor(
    analysisEngine?: UnifiedAnalysisEngine,
    reportEngine?: ImplementationTruthReportEngine
  ) {
    // 依存関係注入（DIP: Dependency Inversion Principle）
    this.analysisEngine = analysisEngine || new UnifiedAnalysisEngine();
    this.reportEngine = reportEngine || new ImplementationTruthReportEngine();
  }

  /**
   * Implementation Truth分析コマンドの実行
   * 単一責任の原則に従い、コマンド実行の責務のみを担う
   */
  async execute(options: ImplementationTruthAnalyzeOptions): Promise<ImplementationTruthAnalyzeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    // 入力値検証（Defensive Programming）
    try {
      this.validateOptions(options);
    } catch (error) {
      errors.push(`オプション検証エラー: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`コマンド実行失敗: ${errors.join(', ')}`);
    }

    // .rimorディレクトリの作成
    if (options.saveToRimor !== false) {
      this.ensureRimorDirectory();
    }

    // プログレス表示
    if (options.verbose) {
      console.log(`🔍 Implementation Truth分析開始`);
      console.log(`   プロダクションコード: ${options.productionPath}`);
      if (options.testPath) {
        console.log(`   テストコード: ${options.testPath}`);
      }
      console.log(`   出力形式: ${options.format || 'ai-json'}`);
    }

    try {
      // 1. Implementation Truth分析実行
      if (options.verbose) {
        console.log('🔧 プロダクションコード解析中...');
      }
      
      const analysisResult = await this.analysisEngine.analyzeWithImplementationTruth(
        options.productionPath,
        options.testPath
      );

      if (options.verbose) {
        console.log(`✅ 分析完了: ${analysisResult.summary.vulnerabilitiesDetected}個の脆弱性, ${analysisResult.totalGapsDetected}個のギャップを検出`);
      }

      // 2. レポート生成
      if (options.verbose) {
        console.log('📋 レポート生成中...');
      }

      // 重要度フィルタリング
      const filteredResult = options.minSeverity ? 
        this.filterBySeverity(analysisResult, options.minSeverity) : 
        analysisResult;

      this.reportEngine.setFormat(options.format || 'ai-json');
      const formattedReport = await this.reportEngine.generate(filteredResult, {
        format: options.format,
        detailLevel: options.detailLevel,
        optimizeForAI: options.optimizeForAI,
        includeMetadata: options.includeMetadata,
        includeCodeExamples: options.includeCodeExamples,
        includeTechnicalDetails: options.includeTechnicalDetails
      });

      if (options.verbose) {
        console.log(`📄 レポート生成完了 (形式: ${formattedReport.format})`);
      }

      // 3. ファイル出力
      let outputPath: string | undefined;
      if (options.output) {
        const saveResult = await this.saveReport(formattedReport, options);
        if (saveResult.success && saveResult.filePath) {
          outputPath = saveResult.filePath;
          if (options.verbose) {
            console.log(`💾 レポート保存: ${outputPath} (${saveResult.fileSize} bytes)`);
          }
        } else if (saveResult.error) {
          warnings.push(`レポート保存に失敗: ${saveResult.error}`);
        }
      }

      // 4. 完了メッセージ
      const executionTime = Date.now() - startTime;
      if (options.verbose) {
        console.log(`🎉 分析完了 (${executionTime}ms)`);
        console.log(`   総合スコア: ${analysisResult.overallScore.toFixed(1)}/100`);
        console.log(`   実現度スコア: ${analysisResult.summary.realizationScore.toFixed(1)}%`);
        console.log(`   高重要度問題: ${analysisResult.highSeverityGaps}個`);
      }

      return {
        analysisResult: filteredResult,
        formattedReport,
        metadata: {
          executionTime,
          analyzedProductionPath: options.productionPath,
          analyzedTestPath: options.testPath,
          timestamp: new Date().toISOString(),
          usedFormat: options.format || 'ai-json',
          outputPath
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      // エラーハンドリング（Defensive Programming）
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ 分析エラー: ${errorMessage}`);
      errors.push(errorMessage);
      throw new Error(`Implementation Truth分析失敗: ${errorMessage}`);
    }
  }

  /**
   * オプション検証
   * 単一責任の原則：入力値検証の責務を分離
   */
  private validateOptions(options: ImplementationTruthAnalyzeOptions): void {
    // プロダクションコードパスの存在確認
    if (!options.productionPath) {
      throw new Error('プロダクションコードパスが指定されていません');
    }

    if (!fs.existsSync(options.productionPath)) {
      throw new Error(`プロダクションコードパスが存在しません: ${options.productionPath}`);
    }

    // ファイルまたはディレクトリの確認
    const stat = fs.statSync(options.productionPath);
    if (!stat.isFile() && !stat.isDirectory()) {
      throw new Error('プロダクションコードパスはファイルまたはディレクトリである必要があります');
    }

    // テストパスの確認（指定されている場合）
    if (options.testPath) {
      if (!fs.existsSync(options.testPath)) {
        throw new Error(`テストコードパスが存在しません: ${options.testPath}`);
      }

      const testStat = fs.statSync(options.testPath);
      if (!testStat.isFile() && !testStat.isDirectory()) {
        throw new Error('テストコードパスはファイルまたはディレクトリである必要があります');
      }
    }

    // 出力パスの親ディレクトリ確認（指定されている場合）
    if (options.output) {
      const outputDir = path.dirname(path.resolve(options.output));
      if (!fs.existsSync(outputDir)) {
        throw new Error(`出力先ディレクトリが存在しません: ${outputDir}`);
      }
    }

    // フォーマットの検証
    const validFormats = ['ai-json', 'markdown', 'html', 'summary'];
    if (options.format && !validFormats.includes(options.format)) {
      throw new Error(`無効な出力形式: ${options.format}。有効な形式: ${validFormats.join(', ')}`);
    }

    // 詳細レベルの検証
    const validDetailLevels = ['summary', 'detailed', 'comprehensive'];
    if (options.detailLevel && !validDetailLevels.includes(options.detailLevel)) {
      throw new Error(`無効な詳細レベル: ${options.detailLevel}。有効なレベル: ${validDetailLevels.join(', ')}`);
    }

    // 最小重要度の検証
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (options.minSeverity && !validSeverities.includes(options.minSeverity)) {
      throw new Error(`無効な重要度: ${options.minSeverity}。有効な重要度: ${validSeverities.join(', ')}`);
    }
  }

  /**
   * .rimorディレクトリの確保
   */
  private ensureRimorDirectory(): void {
    const rimorDir = path.resolve('.rimor');
    if (!fs.existsSync(rimorDir)) {
      fs.mkdirSync(rimorDir, { recursive: true });
    }
  }

  /**
   * 重要度によるフィルタリング
   */
  private filterBySeverity(result: any, minSeverity: string): any {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const minIndex = severityOrder.indexOf(minSeverity);
    
    if (minIndex === -1) {
      return result; // 無効な重要度の場合はフィルタしない
    }

    // 脆弱性のフィルタリング
    const filteredVulnerabilities = result.implementationTruth.vulnerabilities.filter(
      (vuln: any) => {
        const vulnIndex = severityOrder.indexOf(vuln.severity);
        return vulnIndex >= minIndex;
      }
    );

    // ギャップのフィルタリング
    const filteredIntentResults = result.intentRealizationResults.map((intentResult: any) => ({
      ...intentResult,
      gaps: intentResult.gaps.filter((gap: any) => {
        const gapIndex = severityOrder.indexOf(gap.severity);
        return gapIndex >= minIndex;
      })
    }));

    return {
      ...result,
      implementationTruth: {
        ...result.implementationTruth,
        vulnerabilities: filteredVulnerabilities
      },
      intentRealizationResults: filteredIntentResults,
      totalGapsDetected: filteredIntentResults.reduce(
        (total: number, r: any) => total + r.gaps.length, 0
      ),
      highSeverityGaps: filteredIntentResults.reduce(
        (total: number, r: any) => total + r.gaps.filter(
          (g: any) => g.severity === 'critical' || g.severity === 'high'
        ).length, 0
      )
    };
  }

  /**
   * レポート保存
   */
  private async saveReport(report: any, options: ImplementationTruthAnalyzeOptions): Promise<ReportSaveResult> {
    try {
      let outputPath: string;
      
      if (options.output) {
        outputPath = path.resolve(options.output);
      } else {
        // デフォルトのファイル名生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = this.getFileExtension(options.format || 'ai-json');
        const fileName = `implementation-truth-analysis-${timestamp}.${extension}`;
        
        if (options.saveToRimor !== false) {
          outputPath = path.resolve('.rimor', fileName);
        } else {
          outputPath = path.resolve(fileName);
        }
      }

      // レポート内容の取得
      let content: string;
      if (typeof report.content === 'string') {
        content = report.content;
      } else {
        content = JSON.stringify(report.content, null, 2);
      }

      // ファイル書き込み
      await fs.promises.writeFile(outputPath, content, 'utf-8');
      
      // ファイルサイズ取得
      const stats = await fs.promises.stat(outputPath);
      
      return {
        success: true,
        filePath: outputPath,
        fileSize: stats.size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 形式に応じた拡張子を取得
   */
  private getFileExtension(format: string): string {
    switch (format) {
      case 'ai-json':
        return 'json';
      case 'markdown':
        return 'md';
      case 'html':
        return 'html';
      case 'summary':
        return 'txt';
      default:
        return 'json';
    }
  }
}

/**
 * CLI引数パーサー
 */
export class ImplementationTruthCliParser {
  /**
   * CLI引数をパース
   */
  static parseArgs(args: string[]): { productionPath: string; options: ImplementationTruthAnalyzeOptions } {
    const options: Partial<ImplementationTruthAnalyzeOptions> = {};
    let productionPath = '';

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--production-path':
        case '-p':
          productionPath = args[++i];
          break;
        case '--test-path':
        case '-t':
          options.testPath = args[++i];
          break;
        case '--output':
        case '-o':
          options.output = args[++i];
          break;
        case '--format':
        case '-f':
          options.format = args[++i] as any;
          break;
        case '--detail-level':
        case '-d':
          options.detailLevel = args[++i] as any;
          break;
        case '--min-severity':
        case '-s':
          options.minSeverity = args[++i] as any;
          break;
        case '--optimize-for-ai':
          options.optimizeForAI = true;
          break;
        case '--include-code-examples':
          options.includeCodeExamples = true;
          break;
        case '--include-technical-details':
          options.includeTechnicalDetails = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--no-rimor-save':
          options.saveToRimor = false;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
        default:
          if (!productionPath && !arg.startsWith('-')) {
            productionPath = arg;
          }
          break;
      }
    }

    if (!productionPath) {
      throw new Error('プロダクションコードパスが指定されていません');
    }

    return {
      productionPath,
      options: {
        productionPath,
        ...options
      } as ImplementationTruthAnalyzeOptions
    };
  }

  /**
   * ヘルプメッセージを表示
   */
  static showHelp(): void {
    console.log(`
Implementation Truth Analyze - Rimor v0.9.0
AIコーディング時代の品質保証エンジン

使用法:
  rimor implementation-truth-analyze <production-path> [options]

引数:
  production-path              プロダクションコードのパス

オプション:
  -t, --test-path <path>       テストコードのパス
  -o, --output <path>          出力ファイルパス
  -f, --format <format>        出力形式 (ai-json, markdown, html, summary)
  -d, --detail-level <level>   詳細レベル (summary, detailed, comprehensive)
  -s, --min-severity <level>   最小重要度 (low, medium, high, critical)
  --optimize-for-ai           AI向け最適化を有効化
  --include-code-examples     コード例を含める
  --include-technical-details 技術的詳細を含める
  -v, --verbose               詳細な進捗表示
  --no-rimor-save             .rimorディレクトリに保存しない
  -h, --help                  ヘルプを表示

例:
  # 基本的な分析
  rimor implementation-truth-analyze ./src/main.ts

  # テストコードも指定して詳細分析
  rimor implementation-truth-analyze ./src --test-path ./test --format markdown -v

  # AI向け最適化でJSON出力
  rimor implementation-truth-analyze ./src --format ai-json --optimize-for-ai --include-code-examples
    `);
  }
}