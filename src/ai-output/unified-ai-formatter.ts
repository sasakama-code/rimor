/**
 * UnifiedAIFormatter v0.9.0
 * UnifiedAIFormatterStrategyへのエイリアス（後方互換性維持）
 * 
 * @deprecated UnifiedAIFormatterStrategyを直接使用してください
 */

import { UnifiedAIFormatterStrategy } from './UnifiedAIFormatterStrategy';
import { UnifiedAnalysisResult, AIJsonOutput, UnifiedAIFormatterOptions } from './types';

/**
 * 後方互換性のためのエイリアスクラス
 */
export class UnifiedAIFormatter {
  private strategy: UnifiedAIFormatterStrategy;

  constructor() {
    this.strategy = new UnifiedAIFormatterStrategy();
    this.strategy.setStrategy('base');
    console.warn('UnifiedAIFormatter is deprecated. Use UnifiedAIFormatterStrategy instead.');
  }

  formatAsAIJson(
    result: UnifiedAnalysisResult,
    options: UnifiedAIFormatterOptions = {}
  ): AIJsonOutput {
    return this.strategy.format(result, options);
  }

  formatAsAIJsonInternal(
    result: UnifiedAnalysisResult,
    options: UnifiedAIFormatterOptions = {}
  ): AIJsonOutput {
    return this.strategy.format(result, options);
  }
}