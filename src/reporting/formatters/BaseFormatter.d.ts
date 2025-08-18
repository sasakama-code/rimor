/**
 * BaseFormatter
 * v0.9.0 - Issue #64: REFACTOR段階
 * Martin Fowlerの手法による共通ロジックの抽出
 *
 * SOLID原則: 単一責任（基本フォーマット機能）
 * DRY原則: 共通ロジックの一元化
 * Template Methodパターン: 共通処理とカスタマイズポイントの分離
 */
import { IFormattingStrategy } from '../core/types';
import { UnifiedAnalysisResult, RiskLevel, AIActionableRisk, ExecutiveSummary } from '../../nist/types/unified-analysis-result';
/**
 * フォーマッター基底クラス
 * Martin Fowlerの「Pull Up Method」リファクタリング適用
 */
export declare abstract class BaseFormatter implements IFormattingStrategy {
    abstract name: string;
    protected readonly riskPriorityMap: Record<string, number>;
    protected readonly riskLevelLabels: Record<string, string>;
    /**
     * Template Methodパターン: フォーマット処理の共通フロー
     */
    format(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string | object;
    /**
     * 非同期版のフォーマット処理
     */
    formatAsync(result: UnifiedAnalysisResult, options?: Record<string, unknown>): Promise<string | object>;
    /**
     * 入力検証（共通）
     * Defensive Programming: 不正な入力を早期に検出
     */
    protected validateInput(result: UnifiedAnalysisResult): void;
    /**
     * 前処理（オプション、サブクラスでオーバーライド可能）
     */
    protected preprocess(result: UnifiedAnalysisResult, options?: Record<string, unknown>): UnifiedAnalysisResult;
    /**
     * 具体的なフォーマット処理（サブクラスで実装必須）
     * Template Methodパターンの抽象メソッド
     */
    protected abstract doFormat(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string | object;
    /**
     * 後処理（オプション、サブクラスでオーバーライド可能）
     */
    protected postprocess(formatted: string | object, options?: Record<string, unknown>): string | object;
    /**
     * リスクのソート（共通）
     * Martin Fowlerの「Extract Method」リファクタリング適用
     */
    protected sortRisksByPriority(risks: AIActionableRisk[]): AIActionableRisk[];
    /**
     * リスクのフィルタリング（共通）
     */
    protected filterRisksByLevel(risks: AIActionableRisk[], levels?: string[]): AIActionableRisk[];
    /**
     * リスク統計の計算（共通）
     */
    protected calculateRiskStatistics(risks: AIActionableRisk[]): Record<string, number>;
    /**
     * サマリー情報のフォーマット（共通）
     */
    protected formatSummaryInfo(summary: ExecutiveSummary): {
        score: number;
        grade: string;
        fileCount: number;
        testCount: number;
    };
    /**
     * リスクレベルのテキスト表現を取得（共通）
     */
    protected getRiskLevelText(level: RiskLevel | string): string;
    /**
     * 推奨アクションのフォーマット（共通）
     */
    protected formatSuggestedAction(action: unknown): string;
    /**
     * タイムスタンプの生成（共通）
     */
    protected generateTimestamp(): string;
    /**
     * ローカライズされた日時の生成（共通）
     */
    protected generateLocalizedDateTime(locale?: string): string;
    /**
     * HTMLエスケープ（HTML系フォーマッター用）
     */
    protected escapeHtml(text: string): string;
    /**
     * 最大リスク数の取得（共通）
     */
    protected getMaxRisks(options?: Record<string, unknown>): number;
}
//# sourceMappingURL=BaseFormatter.d.ts.map