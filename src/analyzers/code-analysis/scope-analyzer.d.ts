import { ScopeInfo } from '../types';
/**
 * スコープ分析機能
 */
export declare class ScopeAnalyzer {
    /**
     * スコープコンテキストの分析
     */
    analyzeScopeContext(fileContent: string, targetLine: number): Promise<ScopeInfo[]>;
    /**
     * コンテンツからスコープ階層を分析
     */
    analyzeScopeHierarchy(content: string, language: string): Promise<ScopeInfo[]>;
    /**
     * スコープの抽出（エイリアス）
     * @deprecated analyzeScopeContextを使用してください
     */
    extractScopes(content: string, language: string): ScopeInfo[];
    /**
     * 特定の行のスコープを特定
     */
    findScopeAtLine(scopes: ScopeInfo[], targetLine: number): ScopeInfo | null;
    /**
     * スコープ階層の取得
     */
    getScopeHierarchy(scopes: ScopeInfo[], targetLine: number): ScopeInfo[];
    /**
     * スコープ内の変数一覧取得
     */
    getVariablesInScope(scope: ScopeInfo): string[];
    /**
     * スコープ内の関数一覧取得
     */
    getFunctionsInScope(scope: ScopeInfo): string[];
    /**
     * 行からスコープタイプを判定
     */
    private determineScopeType;
    /**
     * 行から変数名を抽出
     */
    private extractVariableFromLine;
    /**
     * 行から関数名を抽出
     */
    private extractFunctionFromLine;
    /**
     * ネストレベルの計算
     */
    calculateNestingLevel(line: string, currentLevel: number): number;
    /**
     * クロージャーの検出
     */
    detectClosures(fileContent: string): Array<{
        startLine: number;
        endLine: number;
        capturedVariables: string[];
    }>;
    /**
     * キャプチャされた変数の検出
     */
    private findCapturedVariables;
    /**
     * 使用されている変数の抽出
     */
    private extractUsedVariables;
    /**
     * JavaScriptキーワードの判定
     */
    private isKeyword;
    /**
     * クロージャーの終了行を検出
     */
    private findClosureEnd;
    /**
     * スコープ内での変数のシャドウイングを検出
     */
    detectVariableShadowing(scopes: ScopeInfo[]): Array<{
        variable: string;
        outerScope: ScopeInfo;
        innerScope: ScopeInfo;
    }>;
}
//# sourceMappingURL=scope-analyzer.d.ts.map