/**
 * MarkdownFormatter
 * v0.9.0 - Issue #64: レポートシステムの統合
 * REFACTOR段階: BaseFormatterを継承
 *
 * SOLID原則: 単一責任（Markdown形式の生成のみ）
 * DRY原則: 共通ロジックをBaseFormatterに委譲
 * KISS原則: シンプルなMarkdown生成
 */
import { BaseFormatter } from './BaseFormatter';
import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';
/**
 * Markdown形式のフォーマッター
 * StructuredReporterの機能を統合
 */
export declare class MarkdownFormatter extends BaseFormatter {
    name: string;
    /**
     * Markdown形式でレポートを生成
     * Template Methodパターンの具体実装
     */
    protected doFormat(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string;
}
//# sourceMappingURL=MarkdownFormatter.d.ts.map