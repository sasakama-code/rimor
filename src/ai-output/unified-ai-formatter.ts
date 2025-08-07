/**
 * UnifiedAIFormatter
 * Issue #58: AIエージェント向けコンテキスト出力機能
 * 
 * DRY原則適用: ベースクラスから継承した実装
 * SOLID原則: 単一責任の原則 - AI JSON変換に特化
 * KISS原則: シンプルな変換ロジック
 */

import { UnifiedAIFormatterBase } from './unified-ai-formatter-base';
import { 
  UnifiedAnalysisResult, 
  AIJsonOutput, 
  UnifiedAIFormatterOptions 
} from './types';

/**
 * UnifiedAnalysisResultからAI向けJSON形式への変換クラス
 * DRY原則: ベースクラスから共通ロジックを継承
 */
export class UnifiedAIFormatter extends UnifiedAIFormatterBase {

  /**
   * UnifiedAnalysisResultをAI JSON形式に変換
   * @param result NIST準拠の統合分析結果
   * @param options フォーマッターオプション
   * @returns AI向けJSON出力
   */
  formatAsAIJson(
    result: UnifiedAnalysisResult,
    options: UnifiedAIFormatterOptions = {}
  ): AIJsonOutput {
    // includeRiskLevelsオプションでフィルタリング
    if (options.includeRiskLevels && options.includeRiskLevels.length > 0) {
      const filteredResult = {
        ...result,
        aiKeyRisks: result.aiKeyRisks.filter(risk => 
          options.includeRiskLevels!.includes(risk.riskLevel)
        )
      };
      return super.formatAsAIJsonInternal(filteredResult, {
        htmlReportPath: options.htmlReportPath,
        maxRisks: options.maxRisks || this.DEFAULT_MAX_RISKS
      });
    }
    
    // ベースクラスの実装を使用
    return super.formatAsAIJsonInternal(result, {
      htmlReportPath: options.htmlReportPath,
      maxRisks: options.maxRisks || this.DEFAULT_MAX_RISKS
    });
  }







}