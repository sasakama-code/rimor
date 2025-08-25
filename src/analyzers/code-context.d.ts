import { Issue } from '../core/types';
import { AnalysisOptions, ExtractedCodeContext, FunctionInfo, ScopeInfo, RelatedFileInfo } from './types';
import { ResourceLimitMonitor } from '../utils/resourceLimits';
/**
 * 高度なコードコンテキスト分析器 v0.6.0
 * モジュラーアーキテクチャによる分析品質向上
 * AI向け出力の品質向上のための詳細なコード解析
 */
export declare class CodeContextAnalyzer {
    private coreAnalyzer;
    private languageAnalyzer;
    private scopeAnalyzer;
    private fileAnalyzer;
    constructor(resourceMonitor?: ResourceLimitMonitor);
    /**
     * 包括的なコードコンテキスト分析
     */
    analyzeCodeContext(issue: Issue, projectPath: string, options?: AnalysisOptions): Promise<ExtractedCodeContext>;
    /**
     * 関数情報の抽出
     */
    extractFunctionInfo(content: string, language: string): Promise<FunctionInfo[]>;
    /**
     * スコープコンテキストの分析
     */
    analyzeScopeContext(content: string, targetLine: number): Promise<ScopeInfo[]>;
    /**
     * 関連コードの検出
     */
    detectRelatedCode(targetFile: string, projectPath: string, options?: AnalysisOptions): Promise<RelatedFileInfo[]>;
    /**
     * スコープ階層の分析（エイリアス）
     * @deprecated analyzeScopeContextを使用してください
     */
    analyzeScopeHierarchy(content: string, targetLine: number): Promise<ScopeInfo[]>;
    /**
     * 関連ファイルの検索（エイリアス）
     * @deprecated detectRelatedCodeを使用してください
     */
    findRelatedFiles(targetFile: string, projectPath: string, options?: AnalysisOptions): Promise<RelatedFileInfo[]>;
}
export declare const AdvancedCodeContextAnalyzer: typeof CodeContextAnalyzer;
//# sourceMappingURL=code-context.d.ts.map