import { Issue } from '../core/types';
import { 
  AnalysisOptions, 
  ExtractedCodeContext
} from './types';
import { AdvancedCodeContextAnalyzer as CoreAdvancedCodeContextAnalyzer } from './code-context/core';
import { ResourceLimitMonitor } from '../utils/resourceLimits';

/**
 * 高度なコードコンテキスト分析器 v0.6.0
 * モジュラーアーキテクチャによる分析品質向上
 * AI向け出力の品質向上のための詳細なコード解析
 */
export class CodeContextAnalyzer {
  private coreAnalyzer: CoreAdvancedCodeContextAnalyzer;

  constructor(resourceMonitor?: ResourceLimitMonitor) {
    this.coreAnalyzer = new CoreAdvancedCodeContextAnalyzer(resourceMonitor);
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
}

// 後方互換性のためのエクスポート
export const AdvancedCodeContextAnalyzer = CodeContextAnalyzer;