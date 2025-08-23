/**
 * AI Output Legacy Adapter
 * v0.9.0 - Issue #64: 後方互換性のためのアダプター
 * 
 * 既存のai-outputディレクトリの機能を新しいUnifiedReportEngineに橋渡し
 * SOLID原則: アダプターパターンによる既存コードの保護
 * DRY原則: 新しいシステムへの委譲
 */

import { UnifiedReportEngine } from '../reporting/core/UnifiedReportEngine';
import { AIJsonFormatter } from '../reporting/formatters/AIJsonFormatter';
import { CachingStrategy } from '../reporting/strategies/CachingStrategy';
import { ParallelStrategy } from '../reporting/strategies/ParallelStrategy';
import { UnifiedAnalysisResult } from '../nist/types/unified-analysis-result';
import { UnifiedAIFormatterOptions, AIJsonOutput } from './types';

/**
 * UnifiedAIFormatterのレガシーアダプター
 * @deprecated Use UnifiedReportEngine with AIJsonFormatter instead
 */
export class UnifiedAIFormatter {
  protected engine: UnifiedReportEngine;
  protected formatter: AIJsonFormatter;

  constructor() {
    console.warn(
      'UnifiedAIFormatter is deprecated. ' +
      'Use UnifiedReportEngine with AIJsonFormatter instead.'
    );
    
    this.engine = new UnifiedReportEngine();
    this.formatter = new AIJsonFormatter();
    this.engine.setStrategy(this.formatter);
  }

  /**
   * レガシーAPIのformat メソッド
   */
  async format(
    result: UnifiedAnalysisResult, 
    options?: UnifiedAIFormatterOptions
  ): Promise<AIJsonOutput> {
    const report = await this.engine.generate(result, options);
    return report.content as AIJsonOutput;
  }

  /**
   * レガシーAPIのformatSync メソッド
   */
  formatSync(
    result: UnifiedAnalysisResult, 
    options?: UnifiedAIFormatterOptions
  ): AIJsonOutput {
    const report = this.engine.generate(result, options);
    return report as any;
  }
}

/**
 * UnifiedAIFormatterBaseのレガシーアダプター
 * @deprecated Use UnifiedReportEngine with AIJsonFormatter instead
 */
export class UnifiedAIFormatterBase extends UnifiedAIFormatter {
  constructor() {
    super();
    console.warn(
      'UnifiedAIFormatterBase is deprecated. ' +
      'Use UnifiedReportEngine with AIJsonFormatter instead.'
    );
  }
}

/**
 * UnifiedAIFormatterOptimizedのレガシーアダプター
 * @deprecated Use UnifiedReportEngine with CachingStrategy instead
 */
export class UnifiedAIFormatterOptimized extends UnifiedAIFormatter {
  constructor() {
    super();
    console.warn(
      'UnifiedAIFormatterOptimized is deprecated. ' +
      'Use UnifiedReportEngine with CachingStrategy instead.'
    );
    
    // キャッシュ戦略を適用
    const cached = new CachingStrategy(this.formatter);
    this.engine.setStrategy(cached);
  }
}

/**
 * UnifiedAIFormatterParallelのレガシーアダプター
 * @deprecated Use UnifiedReportEngine with ParallelStrategy instead
 */
export class UnifiedAIFormatterParallel extends UnifiedAIFormatter {
  constructor() {
    super();
    console.warn(
      'UnifiedAIFormatterParallel is deprecated. ' +
      'Use UnifiedReportEngine with ParallelStrategy instead.'
    );
    
    // 並列処理戦略を適用
    const parallel = new ParallelStrategy(this.formatter);
    this.engine.setStrategy(parallel);
  }
}

/**
 * FormatterStrategyアダプター
 * @deprecated Use IFormattingStrategy from reporting/core/types instead
 */
export type FormattingStrategy = any; // 後方互換性のための型定義

// 後方互換性のためのエクスポート
export { AIJsonOutput, UnifiedAIFormatterOptions } from './types';