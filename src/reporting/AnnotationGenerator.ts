/**
 * Annotation Generator
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * 検出された問題に対応するインライン・アノテーションを生成
 */

import { injectable } from 'inversify';
import {
  Issue,
  Severity,
  IssueType,
  CodeLocation,
  DataFlow,
  AnnotationOptions
} from './types';

interface AnnotationLine {
  lineNumber: number;
  annotation: string;
}

@injectable()
export class AnnotationGenerator {
  private readonly defaultPrefix = 'RIMOR';

  /**
   * 問題に対するアノテーションを生成
   */
  generateAnnotation(issue: Issue, options?: AnnotationOptions): string {
    const prefix = options?.prefix || this.defaultPrefix;
    const format = options?.format || 'inline';

    if (format === 'block') {
      return this.generateBlockAnnotation(issue, prefix, options);
    } else {
      return this.generateInlineAnnotation(issue, prefix, options);
    }
  }

  /**
   * インラインアノテーションを生成
   */
  private generateInlineAnnotation(
    issue: Issue,
    prefix: string,
    options?: AnnotationOptions
  ): string {
    const parts: string[] = [];

    // プレフィックスと重要度
    parts.push(`${prefix}-${this.getSeverityTag(issue.severity)}:`);

    // 問題タイプ
    parts.push(`[${issue.severity}]`);
    parts.push(issue.type);

    // メッセージ
    parts.push('-');
    parts.push(issue.message);

    // データフロー情報（オプション）
    if (options?.includeDataFlow && issue.dataFlow) {
      parts.push(this.formatDataFlowInline(issue.dataFlow));
    }

    return `// ${parts.join(' ')}`;
  }

  /**
   * ブロックアノテーションを生成
   */
  private generateBlockAnnotation(
    issue: Issue,
    prefix: string,
    options?: AnnotationOptions
  ): string {
    const lines: string[] = [];

    // 開始行
    lines.push('/**');
    lines.push(` * ${prefix} Security Analysis Report`);
    lines.push(` * `);
    
    // 問題の詳細
    lines.push(` * Issue: ${issue.type}`);
    lines.push(` * Severity: ${issue.severity}`);
    lines.push(` * ID: ${issue.id}`);
    lines.push(` * `);
    
    // メッセージ（複数行対応）
    const messageLines = issue.message.split('\n');
    messageLines.forEach(line => {
      lines.push(` * ${line}`);
    });

    // 推奨事項
    if (issue.recommendation) {
      lines.push(` * `);
      lines.push(` * Recommendation:`);
      const recommendationLines = issue.recommendation.split('\n');
      recommendationLines.forEach(line => {
        lines.push(` * ${line}`);
      });
    }

    // データフロー情報
    if (options?.includeDataFlow && issue.dataFlow) {
      lines.push(` * `);
      lines.push(` * Data Flow Analysis:`);
      lines.push(...this.formatDataFlowBlock(issue.dataFlow));
    }

    // 参考資料
    if (issue.references && issue.references.length > 0) {
      lines.push(` * `);
      lines.push(` * References:`);
      issue.references.forEach(ref => {
        lines.push(` * - ${ref}`);
      });
    }

    // 終了行
    lines.push(' */');

    return lines.join('\n');
  }

  /**
   * 複数の問題に対するアノテーションを行番号でグループ化
   */
  groupAnnotationsByLine(
    issues: Issue[],
    options?: AnnotationOptions
  ): Map<string, AnnotationLine[]> {
    const annotationsByFile = new Map<string, AnnotationLine[]>();

    issues.forEach(issue => {
      const file = issue.location.file;
      if (!annotationsByFile.has(file)) {
        annotationsByFile.set(file, []);
      }

      const annotation = this.generateAnnotation(issue, options);
      const annotationLine: AnnotationLine = {
        lineNumber: issue.location.startLine - 1, // 0-indexed
        annotation
      };

      annotationsByFile.get(file)!.push(annotationLine);
    });

    // 各ファイルのアノテーションを行番号でソート
    annotationsByFile.forEach((annotations, file) => {
      annotations.sort((a, b) => a.lineNumber - b.lineNumber);
    });

    return annotationsByFile;
  }

  /**
   * アノテーション用のスタンドアロンレポートを生成
   */
  generateAnnotationReport(issues: Issue[]): string {
    const lines: string[] = [];
    
    lines.push('# Rimor Annotation Report');
    lines.push('');
    lines.push('## Summary');
    lines.push(`Total issues found: ${issues.length}`);
    lines.push('');
    
    // ファイル別にグループ化
    const issuesByFile = new Map<string, Issue[]>();
    issues.forEach(issue => {
      const file = issue.location.file;
      if (!issuesByFile.has(file)) {
        issuesByFile.set(file, []);
      }
      issuesByFile.get(file)!.push(issue);
    });

    // ファイルごとにアノテーションを生成
    issuesByFile.forEach((fileIssues, file) => {
      lines.push(`## File: ${file}`);
      lines.push('');
      
      // 行番号でソート
      fileIssues.sort((a, b) => a.location.startLine - b.location.startLine);
      
      fileIssues.forEach(issue => {
        lines.push(`### Line ${issue.location.startLine}: ${issue.type}`);
        lines.push('');
        lines.push('```');
        lines.push(this.generateAnnotation(issue, { format: 'inline' }));
        lines.push('```');
        lines.push('');
        
        if (issue.recommendation) {
          lines.push(`**Recommendation**: ${issue.recommendation}`);
          lines.push('');
        }
      });
    });

    return lines.join('\n');
  }

  /**
   * 重要度タグを取得
   */
  private getSeverityTag(severity: Severity): string {
    const tags: Record<Severity, string> = {
      [Severity.CRITICAL]: 'CRITICAL',
      [Severity.HIGH]: 'HIGH',
      [Severity.MEDIUM]: 'MEDIUM',
      [Severity.LOW]: 'LOW',
      [Severity.INFO]: 'INFO'
    };
    return tags[severity] || 'UNKNOWN';
  }

  /**
   * データフローをインライン形式でフォーマット
   */
  private formatDataFlowInline(dataFlow: DataFlow): string {
    const source = `${dataFlow.source.location.file}:${dataFlow.source.location.startLine}`;
    const sink = `${dataFlow.sink.location.file}:${dataFlow.sink.location.startLine}`;
    return `(Source: ${source} -> Sink: ${sink})`;
  }

  /**
   * データフローをブロック形式でフォーマット
   */
  private formatDataFlowBlock(dataFlow: DataFlow): string[] {
    const lines: string[] = [];

    // Source
    lines.push(` * Source: ${dataFlow.source.type}`);
    lines.push(` *   Location: ${dataFlow.source.location.file}:${dataFlow.source.location.startLine}`);

    // Path
    if (dataFlow.path && dataFlow.path.length > 0) {
      lines.push(` * Path:`);
      dataFlow.path.forEach((step, index) => {
        lines.push(` *   ${index + 1}. ${step.description || step.type}`);
        lines.push(` *      ${step.location.file}:${step.location.startLine}`);
      });
    }

    // Sink
    lines.push(` * Sink: ${dataFlow.sink.type}`);
    lines.push(` *   Location: ${dataFlow.sink.location.file}:${dataFlow.sink.location.startLine}`);

    return lines;
  }

  /**
   * ファイル拡張子に基づいてコメントスタイルを決定
   */
  getCommentStyle(filePath: string): { inline: string; blockStart?: string; blockEnd?: string } {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    
    const styles: Record<string, { inline: string; blockStart?: string; blockEnd?: string }> = {
      // C系言語
      'js': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'jsx': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'ts': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'tsx': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'java': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'c': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'cpp': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'cs': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'go': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'rust': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      'php': { inline: '//', blockStart: '/*', blockEnd: '*/' },
      
      // スクリプト言語
      'py': { inline: '#', blockStart: '"""', blockEnd: '"""' },
      'rb': { inline: '#', blockStart: '=begin', blockEnd: '=end' },
      'sh': { inline: '#' },
      'bash': { inline: '#' },
      
      // マークアップ
      'html': { inline: '<!--', blockEnd: '-->' },
      'xml': { inline: '<!--', blockEnd: '-->' },
      'vue': { inline: '<!--', blockEnd: '-->' },
      
      // その他
      'sql': { inline: '--', blockStart: '/*', blockEnd: '*/' },
      'yaml': { inline: '#' },
      'yml': { inline: '#' }
    };

    return styles[ext] || { inline: '//' };
  }

  /**
   * 言語に応じたアノテーションを生成
   */
  generateLanguageSpecificAnnotation(
    issue: Issue,
    filePath: string,
    options?: AnnotationOptions
  ): string {
    const commentStyle = this.getCommentStyle(filePath);
    const baseAnnotation = this.generateAnnotation(issue, options);

    // インラインコメントスタイルに変換
    if (baseAnnotation.startsWith('//')) {
      return baseAnnotation.replace('//', commentStyle.inline);
    }

    // ブロックコメントスタイルに変換
    if (baseAnnotation.startsWith('/**') && commentStyle.blockStart) {
      let converted = baseAnnotation.replace('/**', commentStyle.blockStart);
      if (commentStyle.blockEnd) {
        converted = converted.replace('*/', commentStyle.blockEnd);
      }
      return converted;
    }

    return baseAnnotation;
  }
}