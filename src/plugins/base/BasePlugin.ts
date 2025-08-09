import * as path from 'path';
import {
  ITestQualityPlugin,
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  Evidence,
  CodeLocation,
  FixResult,
  Feedback
} from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';
import { LogMetadata, ErrorLogMetadata } from '../types/log-types';

export abstract class BasePlugin implements ITestQualityPlugin {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract type: 'core' | 'framework' | 'pattern' | 'domain' | 'security';

  abstract isApplicable(context: ProjectContext): boolean;
  abstract detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
  abstract evaluateQuality(patterns: DetectionResult[]): QualityScore;
  abstract suggestImprovements(evaluation: QualityScore): Improvement[];

  // オプション機能のデフォルト実装
  async autoFix?(_testFile: TestFile, _improvements: Improvement[]): Promise<FixResult> {
    return {
      success: false,
      modifiedFiles: [],
      errors: ['Auto-fix not implemented for this plugin']
    };
  }

  learn?(_feedback: Feedback): void {
    // デフォルト実装: 何もしない
  }

  // ヘルパーメソッド: ファイル種別判定
  protected isTestFile(filePath: string): boolean {
    return filePath.includes('.test.') || 
           filePath.includes('.spec.') || 
           filePath.includes('__tests__');
  }

  // ヘルパーメソッド: ファイル情報抽出
  protected getFileInfo(filePath: string) {
    return {
      baseName: path.basename(filePath, path.extname(filePath)).replace(/\.(test|spec)$/, ''),
      extension: path.extname(filePath),
      directory: path.dirname(filePath),
      isTestFile: this.isTestFile(filePath)
    };
  }

  // ヘルパーメソッド: コード位置作成
  protected createCodeLocation(
    file: string, 
    startLine: number, 
    endLine?: number,
    startColumn?: number,
    endColumn?: number
  ): CodeLocation {
    return {
      file,
      line: startLine,
      column: startColumn || 1,
      endLine: endLine ?? startLine,
      endColumn
    };
  }

  // ヘルパーメソッド: 検出結果作成
  protected createDetectionResult(
    patternId: string,
    patternName: string,
    location: CodeLocation,
    confidence: number,
    evidence: Evidence[],
    metadata?: Record<string, unknown>
  ): DetectionResult {
    return {
      patternId,
      patternName,
      location,
      confidence: Math.max(0, Math.min(1, confidence)), // 0-1の範囲に制限
      evidence,
      metadata
    };
  }

  // ヘルパーメソッド: 改善提案作成
  protected createImprovement(
    id: string,
    priority: 'critical' | 'high' | 'medium' | 'low',
    type: 'add-test' | 'fix-assertion' | 'improve-coverage' | 'refactor' | 'documentation' | 'performance' | 'security',
    title: string,
    description: string,
    location: CodeLocation,
    estimatedImpact: number,
    autoFixable: boolean = false
  ): Improvement {
    return {
      id,
      priority,
      type,
      title,
      description,
      location,
      estimatedImpact,
      autoFixable
    };
  }

  // ヘルパーメソッド: 基本的な品質スコア計算
  protected calculateBasicQualityScore(
    patterns: DetectionResult[],
    baseScore: number = 100,
    penaltyPerIssue: number = 5
  ): QualityScore {
    const totalIssues = patterns.length;
    const overall = Math.max(0, Math.min(100, baseScore - (totalIssues * penaltyPerIssue)));
    
    // 信頼度は検出されたパターンの平均信頼度
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 1.0;

    return {
      overall,
      dimensions: {
        completeness: 70,
        correctness: overall,
        maintainability: 75
      },
      confidence: avgConfidence
    };
  }

  // ヘルパーメソッド: コード内容の解析
  protected parseCodeContent(content: string) {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // 簡易的なコメント行検出
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || 
             trimmed.startsWith('/*') || 
             trimmed.startsWith('*') ||
             trimmed.endsWith('*/');
    });

    return {
      lines,
      totalLines: lines.length,
      nonEmptyLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      codeLines: nonEmptyLines.length - commentLines.length
    };
  }

  // ヘルパーメソッド: プロジェクト種別判定
  protected isTypeScriptProject(context: ProjectContext): boolean {
    return context.language === 'typescript';
  }

  protected isJavaScriptProject(context: ProjectContext): boolean {
    return context.language === 'javascript';
  }

  protected isJestProject(context: ProjectContext): boolean {
    return context.testFramework === 'jest';
  }

  protected isMochaProject(context: ProjectContext): boolean {
    return context.testFramework === 'mocha';
  }

  // ヘルパーメソッド: ログ出力（将来的なログシステム連携用）
  protected logDebug(message: string, metadata?: LogMetadata): void {
    // MVP: コンソール出力、将来的には適切なログシステムに置き換え
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.name}] DEBUG:`, message, metadata || '');
    }
  }

  protected logInfo(message: string, metadata?: LogMetadata): void {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[${this.name}] INFO:`, message, metadata || '');
    }
  }

  protected logWarning(message: string, metadata?: LogMetadata): void {
    console.warn(`[${this.name}] WARNING:`, message, metadata || '');
  }

  protected logError(message: string, error?: unknown): void {
    // 共通エラーハンドラーを使用
    errorHandler.handlePluginError(
      error instanceof Error ? error : new Error(message),
      this.name,
      'plugin_operation'
    );
  }

  // ヘルパーメソッド: パターン検索
  protected findPatternInCode(content: string, pattern: RegExp): Array<{
    match: string;
    line: number;
    column: number;
  }> {
    const lines = content.split('\n');
    const matches: Array<{ match: string; line: number; column: number }> = [];

    lines.forEach((line, lineIndex) => {
      let match;
      pattern.lastIndex = 0; // グローバル検索のリセット
      
      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          match: match[0],
          line: lineIndex + 1, // 1-based
          column: match.index + 1 // 1-based
        });
        
        // 無限ループ防止
        if (!pattern.global) break;
      }
    });

    return matches;
  }

  // ヘルパーメソッド: 文字列・コメント除去
  protected removeCommentsAndStrings(content: string): string {
    // 単行コメント除去
    let cleaned = content.replace(/\/\/.*$/gm, '');
    
    // 複数行コメント除去
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 文字列リテラル除去
    cleaned = cleaned.replace(/"[^"\\]*(\\.[^"\\]*)*"/g, '""');
    cleaned = cleaned.replace(/'[^'\\]*(\\.[^'\\]*)*'/g, "''");
    cleaned = cleaned.replace(/`[^`\\]*(\\.[^`\\]*)*`/g, '``');
    
    return cleaned;
  }
}