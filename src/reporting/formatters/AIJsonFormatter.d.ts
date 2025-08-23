/**
 * AIJsonFormatter
 * v0.9.0 - Issue #64: レポートシステムの統合
 * REFACTOR段階: BaseFormatterを継承
 *
 * SOLID原則: 単一責任（AI JSON形式の生成のみ）
 * DRY原則: 共通ロジックをBaseFormatterに委譲
 * KISS原則: シンプルなJSON生成
 */
import { BaseFormatter } from './BaseFormatter';
import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';
import { AIJsonOutput } from '../../core/types/core-definitions';
/**
 * AI向けJSON形式のフォーマッター
 * UnifiedAIFormatterStrategyの機能を統合
 * Martin Fowlerの「Replace Inheritance with Delegation」の逆適用
 */
export declare class AIJsonFormatter extends BaseFormatter {
    name: string;
    /**
     * AI向けJSON形式でレポートを生成
     * Template Methodパターンの具体実装
     */
    protected doFormat(result: UnifiedAnalysisResult, options?: Record<string, unknown>): AIJsonOutput;
    /**
     * 全体評価を生成
     */
    private generateOverallAssessment;
    /**
     * suggestedActionをオブジェクト形式にフォーマット
     */
    private formatActionObject;
}
//# sourceMappingURL=AIJsonFormatter.d.ts.map