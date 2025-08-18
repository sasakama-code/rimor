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

export class UnifiedAnalyzeCommand implements IUnifiedAnalyzeCommand {
  private readonly orchestrator: UnifiedSecurityAnalysisOrchestrator;

  constructor(orchestrator?: UnifiedSecurityAnalysisOrchestrator) {
    // 依存関係注入（DIP: Dependency Inversion Principle）
    this.orchestrator = orchestrator || new UnifiedSecurityAnalysisOrchestrator();
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
   * Strategy Patternの適用を想定（現在は最小実装）
   */
  private formatResult(analysisResult: any, options: UnifiedAnalyzeOptions): UnifiedAnalyzeResult {
    const format = options.format || 'text';

    switch (format) {
      case 'json':
        return {
          format: 'json',
          content: JSON.stringify(analysisResult, null, 2)
        };

      case 'markdown':
        return {
          format: 'markdown',
          content: this.generateMarkdownReport(analysisResult, options)
        };

      case 'html':
        return {
          format: 'html',
          content: this.generateHtmlReport(analysisResult, options)
        };

      case 'text':
      default:
        return {
          format: 'text',
          content: this.generateTextReport(analysisResult, options),
          verbose: options.verbose
        };
    }
  }

  /**
   * テキストレポート生成
   * YAGNI原則：現時点では最小限の実装
   */
  private generateTextReport(analysisResult: any, options: UnifiedAnalyzeOptions): string {
    let content = '統合セキュリティ分析レポート\n';
    content += '='.repeat(50) + '\n\n';

    // 基本統計
    const report = analysisResult.unifiedReport;
    content += `総合グレード: ${report.summary.overallGrade}\n`;
    content += `総合スコア: ${report.overallRiskScore}/100\n`;
    content += `検出された問題: ${report.summary.totalIssues}件\n\n`;

    // 詳細情報（verboseオプション）
    if (options.verbose) {
      content += '詳細情報:\n';
      content += `- 重大な問題: ${report.summary.criticalIssues}件\n`;
      content += `- 高リスク問題: ${report.summary.highIssues}件\n`;
      content += `- 中リスク問題: ${report.summary.mediumIssues}件\n`;
      content += `- 低リスク問題: ${report.summary.lowIssues}件\n\n`;
    }

    // 推奨事項（オプション）
    if (options.includeRecommendations) {
      content += '推奨事項:\n';
      content += '- セキュリティ設定の見直し\n';
      content += '- テストカバレッジの向上\n';
      content += '- 定期的な監査の実施\n';
    }

    return content;
  }

  /**
   * Markdownレポート生成
   * YAGNI原則：現時点では最小限の実装
   */
  private generateMarkdownReport(analysisResult: any, options: UnifiedAnalyzeOptions): string {
    let content = '# 統合セキュリティ分析レポート\n\n';
    
    const report = analysisResult.unifiedReport;
    content += `**総合グレード**: ${report.summary.overallGrade}\n`;
    content += `**総合スコア**: ${report.overallRiskScore}/100\n`;
    content += `**検出された問題**: ${report.summary.totalIssues}件\n\n`;

    if (options.includeRecommendations) {
      content += '## 推奨事項\n\n';
      content += '- セキュリティ設定の見直し\n';
      content += '- テストカバレッジの向上\n';
      content += '- 定期的な監査の実施\n';
    }

    return content;
  }

  /**
   * HTMLレポート生成
   * YAGNI原則：現時点では最小限の実装
   */
  private generateHtmlReport(analysisResult: any, options: UnifiedAnalyzeOptions): string {
    const report = analysisResult.unifiedReport;
    
    let content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>統合セキュリティ分析レポート</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; border-bottom: 2px solid #ddd; }
        .score { font-size: 1.5em; color: #007cba; }
        .grade { font-size: 2em; font-weight: bold; color: #d32f2f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>統合セキュリティ分析レポート</h1>
    </div>
    <div class="summary">
        <p class="grade">総合グレード: ${report.summary.overallGrade}</p>
        <p class="score">総合スコア: ${report.overallRiskScore}/100</p>
        <p>検出された問題: ${report.summary.totalIssues}件</p>
    </div>
</body>
</html>`;
    
    return content;
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