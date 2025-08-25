"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCodeContextAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pathSecurity_1 = require("../../utils/pathSecurity");
const resourceLimits_1 = require("../../utils/resourceLimits");
const debug_1 = require("../../utils/debug");
const language_parser_1 = require("./language-parser");
const scope_analyzer_1 = require("./scope-analyzer");
const file_analyzer_1 = require("./file-analyzer");
const utils_1 = require("./utils");
/**
 * コードコンテキスト抽出器 v0.6.0
 * 責務：コード文脈の抽出と統合
 * SOLID原則：単一責任原則に従い、コンテキスト抽出に特化
 */
class AdvancedCodeContextAnalyzer {
    resourceMonitor;
    languageAnalyzer;
    scopeAnalyzer;
    fileAnalyzer;
    utils;
    constructor(resourceMonitor) {
        this.resourceMonitor = resourceMonitor || new resourceLimits_1.ResourceLimitMonitor();
        this.languageAnalyzer = new language_parser_1.LanguageAnalyzer();
        this.scopeAnalyzer = new scope_analyzer_1.ScopeAnalyzer();
        this.fileAnalyzer = new file_analyzer_1.FileAnalyzer();
        this.utils = new utils_1.CodeContextUtils();
    }
    /**
     * 包括的なコードコンテキスト分析
     */
    async analyzeCodeContext(issue, projectPath, options = {}) {
        // リソース監視開始
        this.resourceMonitor.startAnalysis();
        const startTime = Date.now();
        try {
            const filePath = pathSecurity_1.PathSecurity.safeResolve(issue.file || '', projectPath, 'analyzeCodeContext');
            if (!filePath) {
                const language = this.languageAnalyzer.detectLanguage(issue.file || '');
                return this.createEmptyContext(language, startTime);
            }
            const language = this.languageAnalyzer.detectLanguage(filePath);
            // ファイル存在確認
            if (!fs.existsSync(filePath)) {
                debug_1.debug.warn(`ファイルが見つかりません: ${filePath}`);
                return this.createEmptyContext(language, startTime);
            }
            // リソース制限チェック
            const stats = fs.statSync(filePath);
            if (stats.size > resourceLimits_1.DEFAULT_ANALYSIS_LIMITS.maxFileSize) {
                console.warn(`ファイルサイズが制限を超えています: ${filePath} (${stats.size} bytes)`);
                return this.createEmptyContext(language, startTime);
            }
            // ファイル内容の読み込み
            let fileContent;
            try {
                fileContent = fs.readFileSync(filePath, 'utf-8');
            }
            catch (error) {
                console.error(`ファイル読み込みエラー: ${filePath}`, error);
                return this.createEmptyContext(language, startTime);
            }
            // 大きすぎるファイルの制限
            if (fileContent.length > resourceLimits_1.DEFAULT_ANALYSIS_LIMITS.maxFileSize) {
                console.warn(`ファイル内容が制限を超えています: ${filePath}`);
                fileContent = fileContent.substring(0, resourceLimits_1.DEFAULT_ANALYSIS_LIMITS.maxFileSize);
            }
            const executionTime = Date.now() - startTime;
            debug_1.debug.info(`📊 詳細コンテキスト分析: ${filePath} (${language}, ${executionTime}ms)`);
            // 各種分析の実行
            const [functions, classes, interfaces, variables, scopes, relatedFiles] = await Promise.all([
                this.languageAnalyzer.extractFunctionInfo(fileContent, language),
                this.languageAnalyzer.extractClassInfo(fileContent, language),
                this.languageAnalyzer.extractInterfaceInfo(fileContent, language),
                this.languageAnalyzer.extractVariableInfo(fileContent, language),
                this.scopeAnalyzer.analyzeScopeHierarchy(fileContent, language),
                this.fileAnalyzer.findRelatedFiles(filePath, projectPath, options)
            ]);
            // コンテキストの統合
            return this.createContext(language, functions, classes, interfaces, variables, scopes, relatedFiles, filePath, fileContent, startTime);
        }
        catch (error) {
            console.error('コードコンテキスト分析中にエラーが発生しました:', error);
            return this.createEmptyContext('unknown', startTime);
        }
        finally {
            // リソース監視の終了（必要に応じて実装）
        }
    }
    /**
     * コードコンテキストの抽出（簡易版）
     */
    async extractCodeContext(filePath, options = {}) {
        const issue = {
            id: `context-${Date.now()}`,
            type: 'context',
            filePath: filePath,
            file: filePath,
            line: 0,
            column: 0,
            rule: 'extraction',
            severity: 'low',
            message: 'Context extraction',
            category: 'documentation'
        };
        const projectPath = path.dirname(filePath);
        return this.analyzeCodeContext(issue, projectPath, options);
    }
    /**
     * 空のコンテキストを作成
     */
    createEmptyContext(language, startTime) {
        const executionTime = Date.now() - startTime;
        return {
            targetCode: {
                content: '',
                startLine: 0,
                endLine: 0
            },
            surroundingCode: {
                before: '',
                after: ''
            },
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            interfaces: [],
            variables: [],
            scopes: [],
            relatedFiles: [],
            usedAPIs: [],
            language,
            dependencies: {
                dependencies: [],
                dependents: []
            },
            metadata: {
                language,
                fileSize: 0,
                analysisTime: executionTime,
                confidence: 0
            }
        };
    }
    /**
     * 完全なコンテキストを作成
     */
    createContext(language, functions, classes, interfaces, variables, scopes, relatedFiles, filePath, fileContent, startTime) {
        const executionTime = Date.now() - startTime;
        const fileSize = Buffer.byteLength(fileContent, 'utf8');
        // コード行の取得
        const lines = fileContent.split('\n');
        const startLine = 1;
        const endLine = lines.length;
        // インポート・エクスポートの抽出
        const imports = [];
        const exports = [];
        // Import文の抽出
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
        let match;
        while ((match = importRegex.exec(fileContent)) !== null) {
            imports.push({ source: match[1] });
        }
        while ((match = requireRegex.exec(fileContent)) !== null) {
            imports.push({ source: match[1] });
        }
        // 使用APIの検出（簡易実装）
        const usedAPIs = [];
        return {
            targetCode: {
                content: fileContent,
                startLine,
                endLine
            },
            surroundingCode: {
                before: '',
                after: ''
            },
            imports,
            exports,
            functions,
            classes,
            interfaces,
            variables,
            scopes,
            relatedFiles,
            usedAPIs,
            language,
            dependencies: {
                dependencies: [],
                dependents: []
            },
            metadata: {
                language,
                fileSize,
                analysisTime: executionTime,
                confidence: 0.85
            }
        };
    }
}
exports.AdvancedCodeContextAnalyzer = AdvancedCodeContextAnalyzer;
//# sourceMappingURL=context-extractor.js.map