import { FunctionInfo, ClassInfo, InterfaceInfo, VariableInfo } from '../types';
/**
 * 言語固有の解析機能
 */
export declare class LanguageAnalyzer {
    /**
     * ファイル拡張子から言語を検出
     */
    detectLanguage(filePath: string): string;
    /**
     * 関数情報の抽出
     */
    extractFunctionInfo(fileContent: string, language: string): Promise<FunctionInfo[]>;
    /**
     * クラス情報の抽出
     */
    extractClassInfo(fileContent: string, language: string): ClassInfo[];
    /**
     * インターフェース情報の抽出
     */
    extractInterfaceInfo(fileContent: string, language: string): InterfaceInfo[];
    /**
     * 変数情報の抽出
     */
    extractVariableInfo(fileContent: string, language: string): VariableInfo[];
    /**
     * インポート文の抽出
     */
    extractImports(fileContent: string, language: string): Array<{
        source: string;
    }>;
    /**
     * エクスポート文の抽出
     */
    extractExports(fileContent: string, language: string): string[];
    /**
     * 使用されているAPIの抽出
     */
    extractUsedAPIs(fileContent: string, language: string): string[];
    private extractJavaScriptFunctions;
    private extractJavaScriptClasses;
    private extractTypeScriptInterfaces;
    private extractJavaScriptVariables;
    private extractPythonFunctions;
    private extractPythonClasses;
    private extractPythonVariables;
    private extractJavaFunctions;
    private extractJavaClasses;
    private extractJavaInterfaces;
    private getImportRegexes;
    private getExportRegexes;
    private getAPIPatterns;
    private extractParameters;
    private extractReturnType;
    private calculateComplexity;
    private extractFunctionCalls;
    private extractVariablesFromLines;
    private extractDocumentation;
    private extractClassMembers;
    private extractInterfaceMembers;
    private extractVariableType;
    private determineScope;
    private extractExtendsClass;
    private extractImplementsInterfaces;
    private extractExtendsInterface;
    private isExported;
    /**
     * 言語固有の機能を解析
     */
    parseLanguageSpecificFeatures(fileContent: string, language: string): Record<string, unknown>;
}
//# sourceMappingURL=language-parser.d.ts.map