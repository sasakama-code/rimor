import { AnalysisOptions, RelatedFileInfo } from '../types';
/**
 * ファイル構造解析機能
 */
export declare class FileAnalyzer {
    private languageAnalyzer;
    constructor();
    /**
     * 関連ファイルの検索
     */
    findRelatedFiles(currentFilePath: string, projectPath: string, options: AnalysisOptions): Promise<RelatedFileInfo[]>;
    /**
     * テストファイルの検索
     */
    findTestFiles(filePath: string, projectPath: string): Promise<RelatedFileInfo[]>;
    /**
     * 同階層ファイルの検索
     */
    findSiblingFiles(filePath: string, projectPath: string): Promise<RelatedFileInfo[]>;
    /**
     * プロジェクト内の全ソースファイルを検索
     */
    findAllSourceFiles(projectPath: string): string[];
    /**
     * ファイル間の依存関係分析
     */
    analyzeDependencies(filePath: string, projectPath: string): Promise<{
        dependencies: string[];
        dependents: string[];
    }>;
    /**
     * 関連ファイルの分析
     */
    private analyzeRelatedFile;
    /**
     * ファイル間の類似性計算
     */
    private calculateFileSimilarity;
    /**
     * 単語の抽出
     */
    private extractWords;
    /**
     * 類似性の計算（Jaccard係数）
     */
    private calculateSimilarity;
    /**
     * ファイル構造の分析
     */
    analyzeFileStructure(filePath: string, projectPath: string): Promise<any>;
    /**
     * 関数名の抽出
     */
    private extractFunctionNames;
    /**
     * インポートパスの解決
     */
    private resolveImportPath;
    /**
     * 可能なファイルパスの生成
     */
    private generatePossiblePaths;
    /**
     * ディレクトリの深さ制限チェック
     */
    private isWithinDepthLimit;
    /**
     * ファイルサイズ制限チェック
     */
    private isWithinSizeLimit;
    /**
     * 循環依存の検出
     */
    detectCircularDependencies(filePath: string, projectPath: string): Promise<string[]>;
}
//# sourceMappingURL=file-analyzer.d.ts.map