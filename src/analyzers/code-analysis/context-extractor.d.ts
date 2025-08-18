import { Issue } from '../../core/types';
import { AnalysisOptions, ExtractedCodeContext } from '../types';
import { ResourceLimitMonitor } from '../../utils/resourceLimits';
/**
 * コードコンテキスト抽出器 v0.6.0
 * 責務：コード文脈の抽出と統合
 * SOLID原則：単一責任原則に従い、コンテキスト抽出に特化
 */
export declare class AdvancedCodeContextAnalyzer {
    private resourceMonitor;
    private languageAnalyzer;
    private scopeAnalyzer;
    private fileAnalyzer;
    private utils;
    constructor(resourceMonitor?: ResourceLimitMonitor);
    /**
     * 包括的なコードコンテキスト分析
     */
    analyzeCodeContext(issue: Issue, projectPath: string, options?: AnalysisOptions): Promise<ExtractedCodeContext>;
    /**
     * コードコンテキストの抽出（簡易版）
     */
    extractCodeContext(filePath: string, options?: AnalysisOptions): Promise<ExtractedCodeContext>;
    /**
     * 空のコンテキストを作成
     */
    private createEmptyContext;
    /**
     * 完全なコンテキストを作成
     */
    private createContext;
}
//# sourceMappingURL=context-extractor.d.ts.map