/**
 * Code Annotator
 * v0.9.0 - Phase 4: Context Engineering
 *
 * ソースコードファイルにインライン・アノテーションを追加
 */

import { injectable, inject } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AnnotationGenerator } from './AnnotationGenerator';
import { StructuredAnalysisResult, Issue, AnnotationOptions } from './types';

interface FileAnnotation {
  filePath: string;
  originalContent: string;
  annotatedContent: string;
  annotationCount: number;
}

@injectable()
export class CodeAnnotator {
  constructor(@inject(AnnotationGenerator) private annotationGenerator: AnnotationGenerator) {}

  /**
   * Issue #156対応: EOL検出・保持ユーティリティ
   * DRY原則適用: EOL処理ロジックの共通化
   * Martin Fowler リファクタリング: Defensive Programming強化
   */
  private detectEOL(content: string): string {
    // Defensive Programming: 引数検証
    if (typeof content !== 'string') {
      return '\n'; // デフォルト値で安全に処理
    }

    // 空文字列の場合もデフォルト値を返す
    if (content.length === 0) {
      return '\n';
    }

    // Windows形式（CRLF）を最優先で検出
    if (content.includes('\r\n')) {
      return '\r\n';
    }
    // Unix形式（LF）
    if (content.includes('\n')) {
      return '\n';
    }
    // Mac Classic形式（CR）- 後方互換性のため
    if (content.includes('\r')) {
      return '\r';
    }
    // デフォルト: Unix標準形式
    return '\n';
  }

  /**
   * Issue #156対応: EOL保持対応のsplit/join操作
   * Martin Fowler リファクタリング: 引数検証とエラーハンドリング強化
   */
  private splitPreservingEOL(content: string): { lines: string[]; eol: string } {
    // Defensive Programming: 引数検証
    if (typeof content !== 'string') {
      return { lines: [], eol: '\n' };
    }

    const eol = this.detectEOL(content);
    const lines = content.split(eol);

    // 空の配列が返された場合の安全な処理
    return {
      lines: lines.length > 0 ? lines : [''],
      eol,
    };
  }

  /**
   * Issue #156対応: 元のEOL形式でのjoin操作
   * Martin Fowler リファクタリング: 引数検証強化
   */
  private joinPreservingEOL(lines: string[], eol: string): string {
    // Defensive Programming: 引数検証
    if (!Array.isArray(lines)) {
      return '';
    }

    if (typeof eol !== 'string') {
      eol = '\n'; // デフォルトEOLで安全に処理
    }

    return lines.join(eol);
  }

  /**
   * 分析結果に基づいてソースコードにアノテーションを追加
   */
  async annotateFiles(
    result: StructuredAnalysisResult,
    options?: AnnotationOptions
  ): Promise<FileAnnotation[]> {
    // ファイル別に問題をグループ化
    const issuesByFile = this.groupIssuesByFile(result.issues);
    const annotations: FileAnnotation[] = [];

    for (const [filePath, issues] of issuesByFile.entries()) {
      try {
        const annotation = await this.annotateFile(filePath, issues, options);
        if (annotation) {
          annotations.push(annotation);
        }
      } catch (error) {
        console.error(`Failed to annotate ${filePath}:`, error);
      }
    }

    return annotations;
  }

  /**
   * 単一ファイルにアノテーションを追加
   */
  async annotateFile(
    filePath: string,
    issues: Issue[],
    options?: AnnotationOptions
  ): Promise<FileAnnotation | null> {
    try {
      // ファイルの内容を読み込み
      const originalContent = await fs.readFile(filePath, 'utf-8');
      // Issue #156対応: EOL保持対応のsplit操作
      const { lines, eol } = this.splitPreservingEOL(originalContent);

      // 行番号でソート（逆順）して、後ろから挿入
      const sortedIssues = [...issues].sort(
        (a, b) => (b.location?.startLine || 0) - (a.location?.startLine || 0)
      );

      let annotationCount = 0;

      // 各問題に対してアノテーションを挿入
      for (const issue of sortedIssues) {
        const annotation = this.annotationGenerator.generateLanguageSpecificAnnotation(
          issue,
          filePath,
          options
        );

        // アノテーションを該当行の前に挿入
        const lineIndex = (issue.location?.startLine || 1) - 1;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          // 既存のインデントを保持
          const indent = this.extractIndent(lines[lineIndex]);
          const indentedAnnotation = this.applyIndent(annotation, indent);

          // アノテーションを挿入
          lines.splice(lineIndex, 0, indentedAnnotation);
          annotationCount++;
        }
      }

      // Issue #156対応: 元のEOL形式でのjoin操作
      const annotatedContent = this.joinPreservingEOL(lines, eol);

      return {
        filePath,
        originalContent,
        annotatedContent,
        annotationCount,
      };
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * アノテーション付きファイルを保存
   */
  async saveAnnotatedFiles(
    annotations: FileAnnotation[],
    outputDir?: string,
    options?: AnnotationOptions
  ): Promise<void> {
    for (const annotation of annotations) {
      if (options?.overwrite) {
        // 元のファイルを上書き
        await fs.writeFile(annotation.filePath, annotation.annotatedContent, 'utf-8');
      } else {
        // 別のディレクトリに保存
        const outputPath = this.getOutputPath(annotation.filePath, outputDir);
        await this.ensureDirectoryExists(path.dirname(outputPath));
        await fs.writeFile(outputPath, annotation.annotatedContent, 'utf-8');
      }
    }
  }

  /**
   * アノテーションのサマリーレポートを生成
   */
  generateAnnotationSummary(annotations: FileAnnotation[]): string {
    const lines: string[] = [];

    lines.push('# Annotation Summary');
    lines.push('');
    lines.push(`Total files annotated: ${annotations.length}`);

    const totalAnnotations = annotations.reduce((sum, ann) => sum + ann.annotationCount, 0);
    lines.push(`Total annotations added: ${totalAnnotations}`);
    lines.push('');

    if (annotations.length > 0) {
      lines.push('## Annotated Files:');
      lines.push('');

      annotations.forEach(ann => {
        lines.push(`- ${ann.filePath}: ${ann.annotationCount} annotations`);
      });
    }

    return lines.join('\n');
  }

  /**
   * 差分レポートを生成
   */
  generateDiffReport(annotations: FileAnnotation[]): string {
    const lines: string[] = [];

    lines.push('# Annotation Diff Report');
    lines.push('');

    annotations.forEach(ann => {
      lines.push(`## File: ${ann.filePath}`);
      lines.push('');
      lines.push(`Annotations added: ${ann.annotationCount}`);
      lines.push('');

      // 簡易的な差分表示
      // Issue #156対応: EOL保持対応のsplit操作
      const { lines: originalLines } = this.splitPreservingEOL(ann.originalContent);
      const { lines: annotatedLines } = this.splitPreservingEOL(ann.annotatedContent);

      let lineNumber = 1;
      let i = 0,
        j = 0;

      while (i < originalLines.length || j < annotatedLines.length) {
        if (i >= originalLines.length) {
          // 新しい行（アノテーション）
          lines.push(`+ ${lineNumber}: ${annotatedLines[j]}`);
          j++;
        } else if (j >= annotatedLines.length) {
          // 削除された行（ないはず）
          lines.push(`- ${lineNumber}: ${originalLines[i]}`);
          i++;
        } else if (originalLines[i] === annotatedLines[j]) {
          // 変更なし
          i++;
          j++;
        } else {
          // アノテーションが挿入された
          lines.push(`+ ${lineNumber}: ${annotatedLines[j]}`);
          j++;
        }
        lineNumber++;
      }

      lines.push('');
    });

    // Issue #156対応: レポート出力は標準的なLF形式を使用
    return lines.join('\n');
  }

  /**
   * 問題をファイル別にグループ化
   */
  private groupIssuesByFile(issues: Issue[]): Map<string, Issue[]> {
    const grouped = new Map<string, Issue[]>();

    issues.forEach(issue => {
      if (!issue.location) return;
      const file = issue.location.file;
      if (!grouped.has(file)) {
        grouped.set(file, []);
      }
      grouped.get(file)!.push(issue);
    });

    return grouped;
  }

  /**
   * 行のインデントを抽出
   */
  private extractIndent(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }

  /**
   * アノテーションにインデントを適用
   * Issue #156対応: EOL保持対応
   */
  private applyIndent(annotation: string, indent: string): string {
    // Issue #156対応: EOL保持対応のsplit/join操作
    const { lines, eol } = this.splitPreservingEOL(annotation);
    const indentedLines = lines.map(line => indent + line);
    return this.joinPreservingEOL(indentedLines, eol);
  }

  /**
   * 出力パスを生成
   */
  private getOutputPath(originalPath: string, outputDir?: string): string {
    if (!outputDir) {
      // デフォルト: 元のファイル名に.annotatedを追加
      const dir = path.dirname(originalPath);
      const ext = path.extname(originalPath);
      const base = path.basename(originalPath, ext);
      return path.join(dir, `${base}.annotated${ext}`);
    }

    // 指定されたディレクトリに同じ構造で保存
    const relativePath = path.relative(process.cwd(), originalPath);
    return path.join(outputDir, relativePath);
  }

  /**
   * ディレクトリが存在することを確認（なければ作成）
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * プレビューモードでアノテーションを表示
   */
  previewAnnotations(result: StructuredAnalysisResult, options?: AnnotationOptions): string {
    const lines: string[] = [];

    lines.push('# Annotation Preview');
    lines.push('');
    lines.push('The following annotations would be added:');
    lines.push('');

    const issuesByFile = this.groupIssuesByFile(result.issues);

    issuesByFile.forEach((issues, filePath) => {
      lines.push(`## ${filePath}`);
      lines.push('');

      // 行番号でソート
      const sortedIssues = [...issues].sort(
        (a, b) => (a.location?.startLine || 0) - (b.location?.startLine || 0)
      );

      sortedIssues.forEach(issue => {
        const annotation = this.annotationGenerator.generateLanguageSpecificAnnotation(
          issue,
          filePath,
          options
        );

        lines.push(`Line ${issue.location?.startLine || 0}:`);
        lines.push('```');
        lines.push(annotation);
        lines.push('```');
        lines.push('');
      });
    });

    // Issue #156対応: プレビュー出力は標準的なLF形式を使用
    return lines.join('\n');
  }

  /**
   * アノテーションをクリーンアップ（削除）
   */
  async cleanupAnnotations(filePath: string, prefix?: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      // Issue #156対応: EOL保持対応のsplit操作
      const { lines, eol } = this.splitPreservingEOL(content);

      const annotationPrefix = prefix || 'RIMOR';
      const cleanedLines = lines.filter(line => {
        // アノテーション行を検出して除外
        const trimmed = line.trim();
        return !(
          trimmed.startsWith(`// ${annotationPrefix}-`) ||
          trimmed.startsWith(`# ${annotationPrefix}-`) ||
          trimmed.startsWith(`<!-- ${annotationPrefix}-`) ||
          trimmed.includes(`* ${annotationPrefix} Security Analysis Report`)
        );
      });

      if (cleanedLines.length < lines.length) {
        // Issue #156対応: 元のEOL形式でのjoin操作
        const cleanedContent = this.joinPreservingEOL(cleanedLines, eol);
        await fs.writeFile(filePath, cleanedContent, 'utf-8');
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error cleaning up annotations in ${filePath}:`, error);
      return false;
    }
  }
}
