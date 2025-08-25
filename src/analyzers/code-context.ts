import { Issue } from '../core/types';
import { 
  AnalysisOptions, 
  ExtractedCodeContext,
  FunctionInfo,
  ScopeInfo,
  RelatedFileInfo
} from './types';
import { AdvancedCodeContextAnalyzer as CoreAdvancedCodeContextAnalyzer } from './code-analysis/context-extractor';
import { ResourceLimitMonitor } from '../utils/resourceLimits';
import { LanguageAnalyzer } from './code-analysis/language-parser';
import { ScopeAnalyzer } from './code-analysis/scope-analyzer';
import { FileAnalyzer } from './code-analysis/file-analyzer';

/**
 * 高度なコードコンテキスト分析器 v0.6.0
 * モジュラーアーキテクチャによる分析品質向上
 * AI向け出力の品質向上のための詳細なコード解析
 */
export class CodeContextAnalyzer {
  private coreAnalyzer: CoreAdvancedCodeContextAnalyzer;
  private languageAnalyzer: LanguageAnalyzer;
  private scopeAnalyzer: ScopeAnalyzer;
  private fileAnalyzer: FileAnalyzer;

  constructor(resourceMonitor?: ResourceLimitMonitor) {
    this.coreAnalyzer = new CoreAdvancedCodeContextAnalyzer(resourceMonitor);
    this.languageAnalyzer = new LanguageAnalyzer();
    this.scopeAnalyzer = new ScopeAnalyzer();
    this.fileAnalyzer = new FileAnalyzer();
  }

  /**
   * 包括的なコードコンテキスト分析
   */
  async analyzeCodeContext(
    issue: Issue, 
    projectPath: string, 
    options: AnalysisOptions = {}
  ): Promise<ExtractedCodeContext> {
    return this.coreAnalyzer.analyzeCodeContext(issue, projectPath, options);
  }

  /**
   * 関数情報の抽出
   */
  async extractFunctionInfo(content: string, language: string): Promise<FunctionInfo[]> {
    return this.languageAnalyzer.extractFunctionInfo(content, language);
  }

  /**
   * スコープコンテキストの分析
   */
  async analyzeScopeContext(content: string, targetLine: number): Promise<ScopeInfo[]> {
    return this.scopeAnalyzer.analyzeScopeContext(content, targetLine);
  }

  /**
   * 関連コードの検出
   */
  async detectRelatedCode(
    targetFile: string, 
    projectPath: string, 
    options: AnalysisOptions = {}
  ): Promise<RelatedFileInfo[]> {
    return this.fileAnalyzer.findRelatedFiles(targetFile, projectPath, options);
  }

  /**
   * スコープ階層の分析（エイリアス）
   * @deprecated analyzeScopeContextを使用してください
   */
  async analyzeScopeHierarchy(content: string, targetLine: number): Promise<ScopeInfo[]> {
    return this.analyzeScopeContext(content, targetLine);
  }

  /**
   * 関連ファイルの検索（エイリアス）
   * @deprecated detectRelatedCodeを使用してください
   */
  async findRelatedFiles(
    targetFile: string,
    projectPath: string,
    options: AnalysisOptions = {}
  ): Promise<RelatedFileInfo[]> {
    return this.detectRelatedCode(targetFile, projectPath, options);
  }
}

// 後方互換性のためのエクスポート
export const AdvancedCodeContextAnalyzer = CodeContextAnalyzer;