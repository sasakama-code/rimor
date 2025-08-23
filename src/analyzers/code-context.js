"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCodeContextAnalyzer = exports.CodeContextAnalyzer = void 0;
const context_extractor_1 = require("./code-analysis/context-extractor");
const language_parser_1 = require("./code-analysis/language-parser");
const scope_analyzer_1 = require("./code-analysis/scope-analyzer");
const file_analyzer_1 = require("./code-analysis/file-analyzer");
/**
 * 高度なコードコンテキスト分析器 v0.6.0
 * モジュラーアーキテクチャによる分析品質向上
 * AI向け出力の品質向上のための詳細なコード解析
 */
class CodeContextAnalyzer {
    coreAnalyzer;
    languageAnalyzer;
    scopeAnalyzer;
    fileAnalyzer;
    constructor(resourceMonitor) {
        this.coreAnalyzer = new context_extractor_1.AdvancedCodeContextAnalyzer(resourceMonitor);
        this.languageAnalyzer = new language_parser_1.LanguageAnalyzer();
        this.scopeAnalyzer = new scope_analyzer_1.ScopeAnalyzer();
        this.fileAnalyzer = new file_analyzer_1.FileAnalyzer();
    }
    /**
     * 包括的なコードコンテキスト分析
     */
    async analyzeCodeContext(issue, projectPath, options = {}) {
        return this.coreAnalyzer.analyzeCodeContext(issue, projectPath, options);
    }
    /**
     * 関数情報の抽出
     */
    async extractFunctionInfo(content, language) {
        return this.languageAnalyzer.extractFunctionInfo(content, language);
    }
    /**
     * スコープコンテキストの分析
     */
    async analyzeScopeContext(content, targetLine) {
        return this.scopeAnalyzer.analyzeScopeContext(content, targetLine);
    }
    /**
     * 関連コードの検出
     */
    async detectRelatedCode(targetFile, projectPath, options = {}) {
        return this.fileAnalyzer.findRelatedFiles(targetFile, projectPath, options);
    }
    /**
     * スコープ階層の分析（エイリアス）
     * @deprecated analyzeScopeContextを使用してください
     */
    async analyzeScopeHierarchy(content, targetLine) {
        return this.analyzeScopeContext(content, targetLine);
    }
    /**
     * 関連ファイルの検索（エイリアス）
     * @deprecated detectRelatedCodeを使用してください
     */
    async findRelatedFiles(targetFile, projectPath, options = {}) {
        return this.detectRelatedCode(targetFile, projectPath, options);
    }
}
exports.CodeContextAnalyzer = CodeContextAnalyzer;
// 後方互換性のためのエクスポート
exports.AdvancedCodeContextAnalyzer = CodeContextAnalyzer;
//# sourceMappingURL=code-context.js.map