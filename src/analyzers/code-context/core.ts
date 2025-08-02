import * as fs from 'fs';
import * as path from 'path';
import { Issue } from '../../core/types';
import { 
  AnalysisOptions, 
  ExtractedCodeContext, 
  FunctionInfo, 
  ClassInfo, 
  InterfaceInfo, 
  VariableInfo, 
  ScopeInfo, 
  RelatedFileInfo 
} from '../types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';
import { PathSecurity } from '../../utils/pathSecurity';
import { ResourceLimitMonitor, DEFAULT_ANALYSIS_LIMITS } from '../../utils/resourceLimits';
import { debug } from '../../utils/debug';
import { LanguageAnalyzer } from './language';
import { ScopeAnalyzer } from './scope';
import { FileAnalyzer } from './file';
import { CodeContextUtils } from './utils';

/**
 * 高度なコードコンテキスト分析器のコアクラス v0.5.0
 * AI向け出力の品質向上のための詳細なコード解析
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
      const filePath = PathSecurity.safeResolve(issue.file || '', projectPath, 'analyzeCodeContext');
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
      const [
        functions,
        classes,
        interfaces,
        variables,
        scopes,
        relatedFiles
      ] = await Promise.all([
        this.languageAnalyzer.extractFunctionInfo(fileContent, language),
        this.languageAnalyzer.extractClassInfo(fileContent, language),
        this.languageAnalyzer.extractInterfaceInfo(fileContent, language),
        this.languageAnalyzer.extractVariableInfo(fileContent, language),
        this.scopeAnalyzer.analyzeScopeContext(fileContent, issue.line || 1),
        this.fileAnalyzer.findRelatedFiles(filePath, projectPath, options)
      ]);

      return {
        targetCode: {
          content: fileContent,
          startLine: issue.line || 1,
          endLine: (issue.line || 1) + 10
        },
        surroundingCode: {
          before: '',
          after: ''
        },
        imports: this.languageAnalyzer.extractImports(fileContent, language),
        exports: this.languageAnalyzer.extractExports(fileContent, language),
        functions,
        classes,
        interfaces,
        variables,
        scopes,
        relatedFiles,
        usedAPIs: this.languageAnalyzer.extractUsedAPIs(fileContent, language),
        language,
        dependencies: await this.fileAnalyzer.analyzeDependencies(filePath, projectPath),
        metadata: {
          language,
          fileSize: fileContent.length,
          analysisTime: Date.now() - startTime,
          confidence: this.utils.calculateConfidence(fileContent, language)
        }
      };

    } catch (error) {
      errorHandler.handleError(
        error as Error, 
        ErrorType.PARSE_ERROR,
        'Code context analysis failed',
        {
          context: 'analyzeCodeContext',
          filePath: issue.file,
          line: issue.line
        },
        true
      );
      
      const language = issue.file ? this.languageAnalyzer.detectLanguage(issue.file) : 'unknown';
      return this.createEmptyContext(language, startTime);
    } finally {
      // リソース監視終了（将来の拡張用）
    }
  }

  /**
   * 空のコンテキストを作成
   */
  private createEmptyContext(language: string, startTime: number): ExtractedCodeContext {
    return {
      targetCode: {
        content: '',
        startLine: 1,
        endLine: 1
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
      dependencies: { dependencies: [], dependents: [] },
      metadata: {
        language,
        fileSize: 0,
        analysisTime: Date.now() - startTime,
        confidence: 0
      }
    };
  }
}