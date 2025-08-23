/**
 * コードコンテキスト分析ユーティリティ機能
 */
export declare class CodeContextUtils {
    /**
     * 分析の信頼度を計算
     */
    calculateConfidence(fileContent: string, language: string): number;
    /**
     * ファイルの複雑度スコアを計算
     */
    calculateComplexityScore(fileContent: string): number;
    /**
     * コードの品質指標を計算
     */
    calculateQualityMetrics(fileContent: string, language: string): {
        linesOfCode: number;
        commentRatio: number;
        complexity: number;
        maintainabilityIndex: number;
    };
    /**
     * テストカバレッジの推定
     */
    estimateTestCoverage(fileContent: string, relatedTestFiles: string[]): number;
    /**
     * ファイルの重要度スコアを計算
     */
    calculateImportanceScore(fileContent: string, filePath: string, dependentCount?: number): number;
    /**
     * コードの可読性スコアを計算
     */
    calculateReadabilityScore(fileContent: string): number;
    /**
     * セキュリティリスクスコアを計算
     */
    calculateSecurityRiskScore(fileContent: string): number;
    /**
     * パフォーマンス問題の検出
     */
    detectPerformanceIssues(fileContent: string): string[];
    /**
     * ベストプラクティス違反の検出
     */
    detectBestPracticeViolations(fileContent: string, language: string): string[];
    /**
     * 依存関係の循環検出用のヘルパー
     */
    buildDependencyGraph(files: Array<{
        path: string;
        imports: string[];
    }>): Map<string, string[]>;
    /**
     * ファイルサイズ分析
     */
    analyzeFileSize(fileContent: string): {
        bytes: number;
        lines: number;
        codeLines: number;
        commentLines: number;
        emptyLines: number;
    };
}
//# sourceMappingURL=utils.d.ts.map