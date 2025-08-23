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
import { IFormattingStrategy, UnifiedReport, ReportGenerationOptions, ILegacyAdapter } from './types';
import { UnifiedAnalysisResult } from '../../nist/types/unified-analysis-result';
/**
 * 統合レポートエンジン
 * 戦略パターンを使用して様々な形式のレポート生成を統合
 */
export declare class UnifiedReportEngine {
    private strategy;
    private readonly legacyAdapters;
    constructor(defaultStrategy?: IFormattingStrategy);
    /**
     * フォーマット戦略を設定
     * SOLID原則: 開放閉鎖原則 - 新しい戦略の追加が容易
     */
    setStrategy(strategy: IFormattingStrategy): void;
    /**
     * 現在の戦略を取得
     */
    getCurrentStrategy(): IFormattingStrategy;
    /**
     * レポートを生成
     * KISS原則: シンプルな生成処理
     */
    generate(result: UnifiedAnalysisResult, options?: ReportGenerationOptions): Promise<UnifiedReport>;
    /**
     * レガシーアダプターを取得
     * 後方互換性のため
     */
    getLegacyAdapter(adapterName: string): ILegacyAdapter | undefined;
    /**
     * 戦略名からレポート形式を判定
     */
    private detectFormat;
    /**
     * レガシーアダプターの初期化
     * DRY原則: アダプター実装の共通化
     */
    private initializeLegacyAdapters;
}
//# sourceMappingURL=UnifiedReportEngine.d.ts.map