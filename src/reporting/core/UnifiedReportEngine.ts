/**
 * UnifiedReportEngine
 * v0.9.0 - Issue #64: レポートシステムの統合
 * TDD GREEN段階 - 最小限の実装でテストを通す
 * 
 * SOLID原則: 単一責任（レポート生成のみ）、開放閉鎖（戦略の追加が容易）
 * DRY原則: 共通ロジックの集約
 * KISS原則: シンプルな戦略パターン
 * YAGNI原則: 必要最小限の機能実装
 */

import {
  IFormattingStrategy,
  ReportFormat,
  UnifiedReport,
  ReportGenerationOptions,
  ILegacyAdapter
} from './types';
import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';
import { MarkdownFormatter } from '../formatters/MarkdownFormatter';

/**
 * 統合レポートエンジン
 * 戦略パターンを使用して様々な形式のレポート生成を統合
 */
export class UnifiedReportEngine {
  private strategy: IFormattingStrategy;
  private readonly legacyAdapters: Map<string, ILegacyAdapter> = new Map();

  constructor(defaultStrategy?: IFormattingStrategy) {
    // デフォルト戦略はMarkdown
    this.strategy = defaultStrategy || new MarkdownFormatter();
    this.initializeLegacyAdapters();
  }

  /**
   * フォーマット戦略を設定
   * SOLID原則: 開放閉鎖原則 - 新しい戦略の追加が容易
   */
  setStrategy(strategy: IFormattingStrategy): void {
    if (!strategy) {
      // nullの場合はデフォルトにフォールバック
      this.strategy = new MarkdownFormatter();
      return;
    }
    this.strategy = strategy;
  }

  /**
   * 現在の戦略を取得
   */
  getCurrentStrategy(): IFormattingStrategy {
    return this.strategy;
  }

  /**
   * レポートを生成
   * KISS原則: シンプルな生成処理
   */
  async generate(
    result: UnifiedAnalysisResult,
    options?: ReportGenerationOptions
  ): Promise<UnifiedReport> {
    // 入力検証
    if (!result) {
      throw new Error('Invalid analysis result');
    }

    const startTime = Date.now();

    try {
      // 戦略に応じたフォーマット処理
      let content: any;
      
      // formatAsyncが定義されている場合は優先的に使用
      if (this.strategy.formatAsync) {
        content = await this.strategy.formatAsync(result, options);
      } else if (this.strategy.format) {
        content = await Promise.resolve(this.strategy.format(result, options));
      } else {
        throw new Error('Strategy must implement format or formatAsync method');
      }

      const processingTime = Date.now() - startTime;

      // レポート形式を判定
      const format = this.detectFormat(this.strategy.name);

      // 統合レポート形式で返す
      const report: UnifiedReport = {
        format,
        content,
        timestamp: new Date().toISOString(),
        metadata: options?.includeMetadata !== false ? {
          generatedBy: 'UnifiedReportEngine',
          version: '0.9.0',
          processingTime
        } : undefined
      };

      return report;
    } catch (error) {
      // エラーハンドリング（Defensive Programming）
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Report generation failed');
    }
  }

  /**
   * レガシーアダプターを取得
   * 後方互換性のため
   */
  getLegacyAdapter(adapterName: string): ILegacyAdapter | undefined {
    const adapter = this.legacyAdapters.get(adapterName);
    
    if (adapter) {
      // deprecated警告を出力
      console.warn(
        `Warning: ${adapterName} is deprecated. ${adapter.deprecationMessage}`
      );
    }
    
    return adapter;
  }

  /**
   * 戦略名からレポート形式を判定
   */
  private detectFormat(strategyName: string): ReportFormat {
    const formatMap: Record<string, ReportFormat> = {
      'ai-json': 'ai-json',
      'markdown': 'markdown',
      'html': 'html',
      'executive-summary': 'executive-summary',
      'structured-json': 'structured-json'
    };

    return formatMap[strategyName] || 'markdown';
  }

  /**
   * レガシーアダプターの初期化
   * DRY原則: アダプター実装の共通化
   */
  private initializeLegacyAdapters(): void {
    // UnifiedAIFormatterのアダプター
    this.legacyAdapters.set('UnifiedAIFormatter', {
      format: async (result: UnifiedAnalysisResult, options?: any) => {
        // AIJsonFormatterを内部で使用
        const { AIJsonFormatter } = await import('../formatters/AIJsonFormatter');
        const formatter = new AIJsonFormatter();
        this.setStrategy(formatter);
        const report = await this.generate(result, options);
        return report.content;
      },
      isDeprecated: true,
      deprecationMessage: 'Use UnifiedReportEngine with AIJsonFormatter strategy instead'
    });

    // StructuredReporterのアダプター
    this.legacyAdapters.set('StructuredReporter', {
      format: async (result: UnifiedAnalysisResult, options?: any) => {
        // MarkdownFormatterを内部で使用
        const formatter = new MarkdownFormatter();
        this.setStrategy(formatter);
        const report = await this.generate(result, options);
        return report.content;
      },
      isDeprecated: true,
      deprecationMessage: 'Use UnifiedReportEngine with MarkdownFormatter strategy instead'
    });
  }
}