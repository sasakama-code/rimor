import * as fs from 'fs';
import * as path from 'path';
import { Issue, ExtendedIssue } from '../../core/types';
import {
  AnalysisOptions,
  ExtractedCodeContext,
  FunctionInfo,
  ClassInfo,
  InterfaceInfo,
  VariableInfo,
  ScopeInfo,
  RelatedFileInfo,
} from '../types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';
import { PathSecurity } from '../../utils/pathSecurity';
import { ResourceLimitMonitor, DEFAULT_ANALYSIS_LIMITS } from '../../utils/resourceLimits';
import { debug } from '../../utils/debug';
import { LanguageAnalyzer } from './language-parser';
import { ScopeAnalyzer } from './scope-analyzer';
import { FileAnalyzer } from './file-analyzer';
import { CodeContextUtils } from './utils';

/**
 * コードコンテキスト抽出器 v0.6.0
 * 責務：コード文脈の抽出と統合
 * SOLID原則：単一責任原則に従い、コンテキスト抽出に特化
 */
export class AdvancedCodeContextAnalyzer {
  private resourceMonitor: ResourceLimitMonitor;
  private languageAnalyzer: LanguageAnalyzer;
  private scopeAnalyzer: ScopeAnalyzer;
  private fileAnalyzer: FileAnalyzer;
  private utils: CodeContextUtils;

  constructor(resourceMonitor?: ResourceLimitMonitor) {
    this.resourceMonitor = resourceMonitor || new ResourceLimitMonitor();
    this.languageAnalyzer = new LanguageAnalyzer();
    this.scopeAnalyzer = new ScopeAnalyzer();
    this.fileAnalyzer = new FileAnalyzer();
    this.utils = new CodeContextUtils();
  }

  /**
   * 包括的なコードコンテキスト分析
   */
  async analyzeCodeContext(
    issue: Issue,
    projectPath: string,
    options: AnalysisOptions = {}
  ): Promise<ExtractedCodeContext> {
    // リソース監視開始
    this.resourceMonitor.startAnalysis();
    const startTime = Date.now();

    try {
      const filePath = PathSecurity.safeResolve(
        issue.file || '',
        projectPath,
        'analyzeCodeContext'
      );
      if (!filePath) {
        const language = this.languageAnalyzer.detectLanguage(issue.file || '');
        return this.createEmptyContext(language, startTime);
      }
      const language = this.languageAnalyzer.detectLanguage(filePath);

      // ファイル存在確認
      if (!fs.existsSync(filePath)) {
        debug.warn(`ファイルが見つかりません: ${filePath}`);
        return this.createEmptyContext(language, startTime);
      }

      // リソース制限チェック
      const stats = fs.statSync(filePath);
      if (stats.size > DEFAULT_ANALYSIS_LIMITS.maxFileSize) {
        console.warn(`ファイルサイズが制限を超えています: ${filePath} (${stats.size} bytes)`);
        return this.createEmptyContext(language, startTime);
      }

      // ファイル内容の読み込み
      let fileContent: string;
      try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        console.error(`ファイル読み込みエラー: ${filePath}`, error);
        return this.createEmptyContext(language, startTime);
      }

      // 大きすぎるファイルの制限
      if (fileContent.length > DEFAULT_ANALYSIS_LIMITS.maxFileSize) {
        console.warn(`ファイル内容が制限を超えています: ${filePath}`);
        fileContent = fileContent.substring(0, DEFAULT_ANALYSIS_LIMITS.maxFileSize);
      }

      const executionTime = Date.now() - startTime;
      debug.info(`📊 詳細コンテキスト分析: ${filePath} (${language}, ${executionTime}ms)`);

      // 各種分析の実行
      const [functions, classes, interfaces, variables, scopes, relatedFiles] = await Promise.all([
        this.languageAnalyzer.extractFunctionInfo(fileContent, language),
        this.languageAnalyzer.extractClassInfo(fileContent, language),
        this.languageAnalyzer.extractInterfaceInfo(fileContent, language),
        this.languageAnalyzer.extractVariableInfo(fileContent, language),
        this.scopeAnalyzer.analyzeScopeHierarchy(fileContent, language),
        this.fileAnalyzer.findRelatedFiles(filePath, projectPath, options),
      ]);

      // コンテキストの統合
      return this.createContext(
        language,
        functions,
        classes,
        interfaces,
        variables,
        scopes,
        relatedFiles,
        filePath,
        fileContent,
        startTime
      );
    } catch (error) {
      console.error('コードコンテキスト分析中にエラーが発生しました:', error);
      return this.createEmptyContext('unknown', startTime);
    } finally {
      // リソース監視の終了（必要に応じて実装）
    }
  }

  /**
   * コードコンテキストの抽出（簡易版）
   */
  async extractCodeContext(
    filePath: string,
    options: AnalysisOptions = {}
  ): Promise<ExtractedCodeContext> {
    const issue: ExtendedIssue = {
      id: `context-${Date.now()}`,
      type: 'context',
      filePath: filePath,
      file: filePath,
      line: 0,
      column: 0,
      rule: 'extraction',
      severity: 'low',
      message: 'Context extraction',
      category: 'documentation',
    };

    const projectPath = path.dirname(filePath);
    return this.analyzeCodeContext(issue, projectPath, options);
  }

  /**
   * 空のコンテキストを作成
   */
  private createEmptyContext(language: string, startTime: number): ExtractedCodeContext {
    const executionTime = Date.now() - startTime;
    return {
      targetCode: {
        content: '',
        startLine: 0,
        endLine: 0,
      },
      surroundingCode: {
        before: '',
        after: '',
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
        dependents: [],
      },
      metadata: {
        language,
        fileSize: 0,
        analysisTime: executionTime,
        confidence: 0,
      },
    };
  }

  /**
   * 完全なコンテキストを作成
   */
  private createContext(
    language: string,
    functions: FunctionInfo[],
    classes: ClassInfo[],
    interfaces: InterfaceInfo[],
    variables: VariableInfo[],
    scopes: ScopeInfo[],
    relatedFiles: RelatedFileInfo[],
    filePath: string,
    fileContent: string,
    startTime: number
  ): ExtractedCodeContext {
    const executionTime = Date.now() - startTime;
    const fileSize = Buffer.byteLength(fileContent, 'utf8');

    // コード行の取得
    const lines = fileContent.split('\n');
    const startLine = 1;
    const endLine = lines.length;

    // インポート・エクスポートの抽出
    const imports: Array<{ source: string }> = [];
    const exports: string[] = [];

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
    const usedAPIs: string[] = [];

    return {
      targetCode: {
        content: fileContent,
        startLine,
        endLine,
      },
      surroundingCode: {
        before: '',
        after: '',
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
        dependents: [],
      },
      metadata: {
        language,
        fileSize,
        analysisTime: executionTime,
        confidence: 0.85,
      },
    };
  }
}
