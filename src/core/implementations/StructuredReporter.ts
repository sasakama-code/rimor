/**
 * Structured Reporter Implementation
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * IReporterインターフェースの構造化レポーター実装
 */

import { injectable, inject } from 'inversify';
import {
  IReporter,
  ReportOptions,
  ReportResult,
  ReportFormat
} from '../interfaces/IReporter';
import { AnalysisResult } from '../interfaces/IAnalysisEngine';
import { SecurityAuditResult } from '../interfaces/ISecurityAuditor';
import { StructuredReporter as StructuredReporterClass } from '../../reporting/StructuredReporter';
import { TemplatedReporter } from '../../reporting/TemplatedReporter';
import { AnnotationGenerator } from '../../reporting/AnnotationGenerator';
import { CodeAnnotator } from '../../reporting/CodeAnnotator';
import { TYPES } from '../../container/types';
import * as fs from 'fs/promises';
import * as path from 'path';

@injectable()
export class StructuredReporter implements IReporter {
  private structuredReporter: StructuredReporterClass;
  private templatedReporter: TemplatedReporter;
  private annotationGenerator: AnnotationGenerator;
  private codeAnnotator: CodeAnnotator;
  private startTime: number = Date.now();

  constructor() {
    // 手動でインスタンスを作成（DIコンテナから注入する場合は@injectを使用）
    this.structuredReporter = new StructuredReporterClass();
    this.templatedReporter = new TemplatedReporter();
    this.annotationGenerator = new AnnotationGenerator();
    this.codeAnnotator = new CodeAnnotator(this.annotationGenerator);
  }

  async initialize(): Promise<void> {
    await this.templatedReporter.initialize();
  }

  async generateAnalysisReport(
    result: AnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      // 分析開始時刻を記録
      if (!this.startTime) {
        this.startTime = Date.now();
      }

      // 構造化データに変換
      const structuredResult = await this.structuredReporter.convertAnalysisResult(
        result,
        options.outputPath || process.cwd(),
        this.startTime
      );

      let content: string;

      switch (options.format) {
        case ReportFormat.JSON:
          content = this.structuredReporter.toJSON(structuredResult);
          break;

        case ReportFormat.MARKDOWN:
          if (!this.templatedReporter) {
            await this.initialize();
          }
          if (options.includeDetails) {
            content = await this.templatedReporter.generateDetailedReport(
              structuredResult,
              {
                includeDetails: options.includeDetails,
                includeSummary: options.includeSummary,
                includeRecommendations: options.includeRecommendations,
                includeCodeSnippets: true,
                includeDataFlow: true
              }
            );
          } else {
            content = await this.templatedReporter.generateSummaryReport(
              structuredResult,
              {
                includeDetails: false,
                includeSummary: true,
                includeRecommendations: options.includeRecommendations
              }
            );
          }
          break;

        case ReportFormat.HTML:
          // HTML形式は将来の拡張用
          content = await this.generateHtmlReport(structuredResult);
          break;

        case ReportFormat.TEXT:
        default:
          // デフォルトはサマリーMarkdown
          if (!this.templatedReporter) {
            await this.initialize();
          }
          content = await this.templatedReporter.generateSummaryReport(
            structuredResult
          );
          break;
      }

      // カスタムテンプレートが指定されている場合
      if (options.customTemplate) {
        content = await this.templatedReporter.generateCustomReport(
          structuredResult,
          options.customTemplate,
          {
            includeDetails: options.includeDetails,
            includeSummary: options.includeSummary,
            includeRecommendations: options.includeRecommendations
          }
        );
      }

      // ファイルに保存
      if (options.outputPath) {
        await this.saveToFile(content, options.outputPath);
        return {
          success: true,
          outputPath: options.outputPath
        };
      }

      return {
        success: true,
        content
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateSecurityReport(
    result: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      // ダミーの分析結果を作成（セキュリティ結果のみ）
      const dummyAnalysisResult: AnalysisResult = {
        totalFiles: 0,
        issues: [],
        executionTime: 0
      };

      // 構造化データに変換
      const structuredResult = await this.structuredReporter.convertAnalysisResult(
        dummyAnalysisResult,
        options.outputPath || process.cwd(),
        this.startTime
      );

      // セキュリティ結果をマージ
      const mergedResult = await this.structuredReporter.mergeSecurityResult(
        structuredResult,
        result
      );

      // 分析レポートと同じ処理
      return this.generateReportFromStructured(mergedResult, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateCombinedReport(
    analysisResult: AnalysisResult,
    securityResult: SecurityAuditResult,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      // 構造化データに変換
      const structuredResult = await this.structuredReporter.convertAnalysisResult(
        analysisResult,
        options.outputPath || process.cwd(),
        this.startTime
      );

      // セキュリティ結果をマージ
      const mergedResult = await this.structuredReporter.mergeSecurityResult(
        structuredResult,
        securityResult
      );

      // レポート生成
      return this.generateReportFromStructured(mergedResult, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * アノテーション機能を追加
   */
  async generateAnnotations(
    analysisResult: AnalysisResult,
    options: {
      outputDir?: string;
      overwrite?: boolean;
      preview?: boolean;
      format?: 'inline' | 'block';
      includeDataFlow?: boolean;
    }
  ): Promise<ReportResult> {
    try {
      // 構造化データに変換
      const structuredResult = await this.structuredReporter.convertAnalysisResult(
        analysisResult,
        process.cwd(),
        this.startTime
      );

      if (options.preview) {
        // プレビューモード
        const preview = this.codeAnnotator.previewAnnotations(
          structuredResult,
          {
            format: options.format,
            includeDataFlow: options.includeDataFlow
          }
        );

        return {
          success: true,
          content: preview
        };
      }

      // 実際にアノテーションを追加
      const annotations = await this.codeAnnotator.annotateFiles(
        structuredResult,
        {
          format: options.format,
          includeDataFlow: options.includeDataFlow,
          overwrite: options.overwrite
        }
      );

      // アノテーションを保存
      await this.codeAnnotator.saveAnnotatedFiles(
        annotations,
        options.outputDir,
        { overwrite: options.overwrite }
      );

      // サマリーレポートを生成
      const summary = this.codeAnnotator.generateAnnotationSummary(annotations);

      return {
        success: true,
        content: summary
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  printToConsole(content: string): void {
    console.log(content);
  }

  /**
   * 構造化データからレポートを生成
   */
  private async generateReportFromStructured(
    structuredResult: import('../../reporting/types').StructuredAnalysisResult,
    options: ReportOptions
  ): Promise<ReportResult> {
    let content: string;

    switch (options.format) {
      case ReportFormat.JSON:
        content = this.structuredReporter.toJSON(structuredResult);
        break;

      case ReportFormat.MARKDOWN:
        if (options.includeDetails) {
          content = await this.templatedReporter.generateDetailedReport(
            structuredResult,
            {
              includeDetails: options.includeDetails,
              includeSummary: options.includeSummary,
              includeRecommendations: options.includeRecommendations,
              includeCodeSnippets: true,
              includeDataFlow: true
            }
          );
        } else {
          content = await this.templatedReporter.generateSummaryReport(
            structuredResult
          );
        }
        break;

      case ReportFormat.HTML:
        content = await this.generateHtmlReport(structuredResult);
        break;

      case ReportFormat.TEXT:
      default:
        content = await this.templatedReporter.generateSummaryReport(
          structuredResult
        );
        break;
    }

    if (options.outputPath) {
      await this.saveToFile(content, options.outputPath);
      return {
        success: true,
        outputPath: options.outputPath
      };
    }

    return {
      success: true,
      content
    };
  }

  /**
   * HTML形式のレポートを生成（簡易実装）
   */
  private async generateHtmlReport(structuredResult: import('../../reporting/types').StructuredAnalysisResult): Promise<string> {
    const markdown = await this.templatedReporter.generateDetailedReport(
      structuredResult
    );

    // 簡易的なMarkdown to HTML変換
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rimor Analysis Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 { color: #2c3e50; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 2px; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
    .critical { color: #e74c3c; }
    .high { color: #e67e22; }
    .medium { color: #f39c12; }
    .low { color: #27ae60; }
    .info { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    ${this.markdownToHtml(markdown)}
  </div>
</body>
</html>`;

    return html;
  }

  /**
   * 簡易的なMarkdownからHTMLへの変換
   */
  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * ファイルに保存
   */
  private async saveToFile(content: string, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}