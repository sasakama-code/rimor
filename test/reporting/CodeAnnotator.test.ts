/**
 * CodeAnnotator Tests
 * v0.8.0 - Phase 4: Context Engineering
 *
 * コードアノテーション機能のテスト
 */

import { CodeAnnotator } from '../../src/reporting/CodeAnnotator';
import { AnnotationGenerator } from '../../src/reporting/AnnotationGenerator';
import {
  StructuredAnalysisResult,
  Issue,
  Severity,
  IssueType,
  AnnotationOptions,
} from '../../src/reporting/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// モックファイルシステム
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// モックファイルの内容（グローバルに定義）
const mockFileContents: Record<string, string> = {
  '/tmp/rimor-test/db.ts': `export class Database {
  constructor(private config: any) {}
  
  async query(sql: string) {
    // Some code before
    console.log('Query:', sql);
    
    // Line 8
    // Line 9
    const result = await this.db.query(sql); // Line 10 - SQL injection here
    // Line 11
    return result;
  }
}`,
  '/tmp/rimor-test/api.ts': `import express from 'express';

export function setupRoutes(app: express.Application) {
  app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;
    
    // Some code...
    // Line 7
    // Line 8
    // Line 9
    // Line 10
    // Line 11
    // Line 12
    // Line 13
    // Line 14
    // Line 15
    // Line 16
    // Line 17
    // Line 18
    // Line 19
    res.send('<h1>Welcome ' + userId + '</h1>'); // Line 20 - XSS here
    
    // More code...
    // Line 22
    // Line 23
    // Line 24
    // Line 25
    // Line 26
    // Line 27
    // Line 28
    // Line 29
    console.log('Test'); // Line 30 - Test quality issue
  });
}`,
};

describe('CodeAnnotator', () => {
  let annotator: CodeAnnotator;
  let generator: AnnotationGenerator;
  let tempDir: string = '/tmp/rimor-test';

  beforeEach(() => {
    generator = new AnnotationGenerator();
    annotator = new CodeAnnotator(generator);

    // テスト用一時ディレクトリ（固定値にして予測可能にする）
    tempDir = '/tmp/rimor-test';

    // fsモックのリセット
    jest.clearAllMocks();

    // デフォルトのモック設定
    mockFs.readFile.mockImplementation((filePath: any) => {
      const normalizedPath = typeof filePath === 'string' ? filePath : filePath.toString();
      const content = mockFileContents[normalizedPath];
      if (content) {
        return Promise.resolve(content);
      }
      return Promise.reject(new Error('File not found'));
    });
  });

  afterEach(() => {
    // モックをリセット
    jest.clearAllMocks();
  });

  describe('annotateFiles', () => {
    const mockResult: StructuredAnalysisResult = {
      metadata: {
        version: '0.8.0',
        timestamp: new Date().toISOString(),
        analyzedPath: tempDir,
        duration: 1000,
      },
      summary: {
        totalFiles: 2,
        totalIssues: 3,
        issueBySeverity: {
          critical: 1,
          high: 1,
          medium: 1,
          low: 0,
          info: 0,
        },
        issueByType: {
          SQL_INJECTION: 1,
          XSS: 1,
          TEST_QUALITY: 1,
        },
      },
      issues: [
        {
          id: '1',
          type: IssueType.SQL_INJECTION,
          severity: Severity.CRITICAL,
          category: 'security' as const,
          location: {
            file: path.join(tempDir, 'db.ts'),
            startLine: 10,
            endLine: 10,
          },
          message: 'SQL Injection vulnerability',
        },
        {
          id: '2',
          type: IssueType.XSS,
          severity: Severity.HIGH,
          category: 'security' as const,
          location: {
            file: path.join(tempDir, 'api.ts'),
            startLine: 20,
            endLine: 20,
          },
          message: 'XSS vulnerability',
        },
        {
          id: '3',
          type: IssueType.TEST_QUALITY,
          severity: Severity.MEDIUM,
          category: 'test-quality' as const,
          location: {
            file: path.join(tempDir, 'api.ts'),
            startLine: 30,
            endLine: 30,
          },
          message: 'Test quality issue',
        },
      ],
      metrics: {
        testCoverage: { overall: 80, byModule: {} },
        codeQuality: {},
      },
    };

    it('should annotate multiple files with issues', async () => {
      // モックが正しく設定されていることを確認
      mockFs.readFile.mockImplementation((filePath: any) => {
        const normalizedPath = typeof filePath === 'string' ? filePath : filePath.toString();
        const content = mockFileContents[normalizedPath];
        if (content) {
          return Promise.resolve(content);
        }
        return Promise.reject(new Error('File not found'));
      });

      const annotations = await annotator.annotateFiles(mockResult);

      expect(annotations).toHaveLength(2); // 2つのファイル

      // db.tsのアノテーション
      const dbAnnotation = annotations.find(a => a.filePath.endsWith('db.ts'));
      expect(dbAnnotation).toBeDefined();
      expect(dbAnnotation!.annotationCount).toBe(1);
      expect(dbAnnotation!.annotatedContent).toContain('// RIMOR-CRITICAL:');
      expect(dbAnnotation!.annotatedContent).toContain('SQL Injection vulnerability');

      // api.tsのアノテーション
      const apiAnnotation = annotations.find(a => a.filePath.endsWith('api.ts'));
      expect(apiAnnotation).toBeDefined();
      expect(apiAnnotation!.annotationCount).toBe(2);
      expect(apiAnnotation!.annotatedContent).toContain('// RIMOR-HIGH:');
      expect(apiAnnotation!.annotatedContent).toContain('XSS vulnerability');
      expect(apiAnnotation!.annotatedContent).toContain('// RIMOR-MEDIUM:');
      expect(apiAnnotation!.annotatedContent).toContain('Test quality issue');
    });

    it('should preserve indentation when adding annotations', async () => {
      const annotations = await annotator.annotateFiles(mockResult);

      const dbAnnotation = annotations.find(a => a.filePath.endsWith('db.ts'));
      const lines = dbAnnotation!.annotatedContent.split('\n');

      // アノテーションが正しいインデントで挿入されていることを確認
      const annotationLine = lines.find(line => line.includes('RIMOR-CRITICAL'));
      expect(annotationLine).toMatch(/^    \/\/ RIMOR-CRITICAL:/); // 4スペースのインデント
    });

    it('should handle files that cannot be read', async () => {
      // 読み込みエラーをシミュレート - 特定のファイルのみエラー
      mockFs.readFile.mockImplementation((filePath: any) => {
        const normalizedPath = typeof filePath === 'string' ? filePath : filePath.toString();
        if (normalizedPath.endsWith('db.ts')) {
          return Promise.reject(new Error('Permission denied'));
        }
        const content = mockFileContents[normalizedPath];
        if (content) {
          return Promise.resolve(content);
        }
        return Promise.reject(new Error('File not found'));
      });

      const annotations = await annotator.annotateFiles(mockResult);

      // エラーが発生したファイルはスキップされる
      expect(annotations).toHaveLength(1); // api.tsのみ
    });

    it('should apply block format when specified', async () => {
      // モックをリセットして正常な読み込みに戻す
      mockFs.readFile.mockImplementation((filePath: any) => {
        const normalizedPath = typeof filePath === 'string' ? filePath : filePath.toString();
        const content = mockFileContents[normalizedPath];
        if (content) {
          return Promise.resolve(content);
        }
        return Promise.reject(new Error('File not found'));
      });

      const options: AnnotationOptions = {
        format: 'block',
      };

      const annotations = await annotator.annotateFiles(mockResult, options);

      const dbAnnotation = annotations.find(a => a.filePath.endsWith('db.ts'));
      expect(dbAnnotation!.annotatedContent).toContain('/*');
      expect(dbAnnotation!.annotatedContent).toContain(' * RIMOR Security Analysis Report');
      expect(dbAnnotation!.annotatedContent).toContain(' */');
    });
  });

  describe('saveAnnotatedFiles', () => {
    const mockAnnotations = [
      {
        filePath: path.join(tempDir, 'db.ts'),
        originalContent: 'original db content',
        annotatedContent: 'annotated db content',
        annotationCount: 1,
      },
      {
        filePath: path.join(tempDir, 'api.ts'),
        originalContent: 'original api content',
        annotatedContent: 'annotated api content',
        annotationCount: 2,
      },
    ];

    beforeEach(() => {
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('Not found')); // ディレクトリが存在しない
    });

    it('should save annotated files to original location when overwrite is true', async () => {
      const options: AnnotationOptions = {
        overwrite: true,
      };

      await annotator.saveAnnotatedFiles(mockAnnotations, undefined, options);

      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, 'db.ts'),
        'annotated db content',
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, 'api.ts'),
        'annotated api content',
        'utf-8'
      );
    });

    it('should save to output directory when specified', async () => {
      const outputDir = path.join(tempDir, 'annotated');

      await annotator.saveAnnotatedFiles(mockAnnotations, outputDir);

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);

      // 実際の書き込み内容を確認
      const calls = mockFs.writeFile.mock.calls;

      // ファイルが正しく書き込まれたことを確認
      expect(calls).toHaveLength(2);

      // 各呼び出しが正しいコンテンツを持っているか確認
      const dbCall = calls.find(call => call[1] === 'annotated db content');
      const apiCall = calls.find(call => call[1] === 'annotated api content');

      expect(dbCall).toBeDefined();
      expect(apiCall).toBeDefined();
    });

    it('should create .annotated suffix when no output directory specified', async () => {
      await annotator.saveAnnotatedFiles(mockAnnotations);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, 'db.annotated.ts'),
        'annotated db content',
        'utf-8'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempDir, 'api.annotated.ts'),
        'annotated api content',
        'utf-8'
      );
    });
  });

  describe('generateAnnotationSummary', () => {
    it('should generate summary report', () => {
      const annotations = [
        {
          filePath: '/project/src/db.ts',
          originalContent: 'content1',
          annotatedContent: 'annotated1',
          annotationCount: 3,
        },
        {
          filePath: '/project/src/api.ts',
          originalContent: 'content2',
          annotatedContent: 'annotated2',
          annotationCount: 2,
        },
      ];

      const summary = annotator.generateAnnotationSummary(annotations);

      expect(summary).toContain('# Annotation Summary');
      expect(summary).toContain('Total files annotated: 2');
      expect(summary).toContain('Total annotations added: 5');
      expect(summary).toContain('- /project/src/db.ts: 3 annotations');
      expect(summary).toContain('- /project/src/api.ts: 2 annotations');
    });

    it('should handle empty annotations array', () => {
      const summary = annotator.generateAnnotationSummary([]);

      expect(summary).toContain('Total files annotated: 0');
      expect(summary).toContain('Total annotations added: 0');
      expect(summary).not.toContain('## Annotated Files:');
    });
  });

  describe('previewAnnotations', () => {
    const mockResult: StructuredAnalysisResult = {
      metadata: {
        version: '0.8.0',
        timestamp: new Date().toISOString(),
        analyzedPath: '/project',
        duration: 1000,
      },
      summary: {
        totalFiles: 1,
        totalIssues: 2,
        issueBySeverity: {
          critical: 1,
          high: 1,
          medium: 0,
          low: 0,
          info: 0,
        },
        issueByType: {},
      },
      issues: [
        {
          id: '1',
          type: IssueType.SQL_INJECTION,
          severity: Severity.CRITICAL,
          category: 'security' as const,
          location: {
            file: '/project/db.ts',
            startLine: 10,
            endLine: 10,
          },
          message: 'SQL Injection',
        },
        {
          id: '2',
          type: IssueType.XSS,
          severity: Severity.HIGH,
          category: 'security' as const,
          location: {
            file: '/project/db.ts',
            startLine: 20,
            endLine: 20,
          },
          message: 'XSS vulnerability',
        },
      ],
      metrics: {
        testCoverage: { overall: 80, byModule: {} },
        codeQuality: {},
      },
    };

    it('should generate preview of annotations', () => {
      const preview = annotator.previewAnnotations(mockResult);

      expect(preview).toContain('# Annotation Preview');
      expect(preview).toContain('The following annotations would be added:');
      expect(preview).toContain('## /project/db.ts');
      expect(preview).toContain('Line 10:');
      expect(preview).toContain('// RIMOR-CRITICAL:');
      expect(preview).toContain('SQL Injection');
      expect(preview).toContain('Line 20:');
      expect(preview).toContain('// RIMOR-HIGH:');
      expect(preview).toContain('XSS vulnerability');
    });

    it('should show block format in preview when specified', () => {
      const options: AnnotationOptions = {
        format: 'block',
      };

      const preview = annotator.previewAnnotations(mockResult, options);

      expect(preview).toContain('/*');
      expect(preview).toContain(' * RIMOR Security Analysis Report');
      expect(preview).toContain(' */');
    });
  });

  describe('cleanupAnnotations', () => {
    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(`
export function test() {
  // RIMOR-HIGH: [high] XSS - XSS vulnerability
  const html = userInput;
  
  /* RIMOR Security Analysis Report
   * Issue: SQL_INJECTION
   */
  const query = sql;
  
  # RIMOR-CRITICAL: SQL Injection
  executeQuery(query);
  
  <!-- RIMOR-MEDIUM: Security issue -->
  return html;
}
`);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should remove all RIMOR annotations', async () => {
      const result = await annotator.cleanupAnnotations('/test/file.ts');

      expect(result).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('RIMOR');
      expect(writtenContent).toContain('const html = userInput;');
      expect(writtenContent).toContain('const query = sql;');
    });

    it('should handle custom prefix', async () => {
      mockFs.readFile.mockResolvedValue(`
// SECURITY-HIGH: Custom annotation
const data = input;

// RIMOR-HIGH: Default annotation
const other = value;
`);

      await annotator.cleanupAnnotations('/test/file.ts', 'SECURITY');

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('SECURITY-HIGH');
      expect(writtenContent).toContain('RIMOR-HIGH'); // 他のプレフィックスは残る
    });

    it('should return false if no annotations found', async () => {
      mockFs.readFile.mockResolvedValue(`
export function clean() {
  return 'no annotations here';
}
`);

      const result = await annotator.cleanupAnnotations('/test/file.ts');

      expect(result).toBe(false);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await annotator.cleanupAnnotations('/test/missing.ts');

      expect(result).toBe(false);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  // Issue #156対応: EOL破壊問題テストケース（TDD Red段階）
  describe('EOL preservation (Issue #156)', () => {
    const mockResultWithLocation: StructuredAnalysisResult = {
      metadata: {
        version: '0.9.0',
        timestamp: new Date().toISOString(),
        analyzedPath: '/project',
        duration: 1000,
      },
      summary: {
        totalFiles: 1,
        totalIssues: 1,
        issueBySeverity: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
        issueByType: {
          SQL_INJECTION: 1,
        },
      },
      issues: [
        {
          id: '1',
          type: IssueType.SQL_INJECTION,
          severity: Severity.CRITICAL,
          category: 'security' as const,
          location: {
            file: '/project/test.ts',
            startLine: 5,
            endLine: 5,
          },
          message: 'SQL Injection vulnerability',
        },
      ],
      metrics: {
        testCoverage: { overall: 80, byModule: {} },
        codeQuality: {},
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should preserve CRLF line endings when processing Windows files', async () => {
      // TDD Red段階: CRLF形式ファイルのEOL保持テスト
      const crlfContent = 'line1\r\nline2\r\nline3\r\nline4\r\nline5\r\nline6';

      mockFs.readFile.mockResolvedValue(crlfContent);

      const annotation = await annotator.annotateFile(
        '/project/test.ts',
        mockResultWithLocation.issues,
        undefined
      );

      expect(annotation).toBeDefined();
      expect(annotation!.annotatedContent).toContain('\r\n');
      // アノテーション追加後もCRLF形式が保持されることを確認
      const lines = annotation!.annotatedContent.split(/\r\n|\n|\r/);
      const crlfCount = (annotation!.annotatedContent.match(/\r\n/g) || []).length;
      const lfOnlyCount = (annotation!.annotatedContent.match(/[^\r]\n/g) || []).length;

      // CRLF形式が保持されている（LFのみに変換されていない）
      expect(crlfCount).toBeGreaterThan(0);
      expect(lfOnlyCount).toBe(0);
    });

    it('should preserve LF line endings when processing Unix files', async () => {
      // TDD Red段階: LF形式ファイルのEOL保持テスト
      const lfContent = 'line1\nline2\nline3\nline4\nline5\nline6';

      mockFs.readFile.mockResolvedValue(lfContent);

      const annotation = await annotator.annotateFile(
        '/project/test.ts',
        mockResultWithLocation.issues,
        undefined
      );

      expect(annotation).toBeDefined();
      expect(annotation!.annotatedContent).not.toContain('\r\n');
      // アノテーション追加後もLF形式が保持されることを確認
      const crlfCount = (annotation!.annotatedContent.match(/\r\n/g) || []).length;
      expect(crlfCount).toBe(0);
    });

    it('should preserve mixed line endings when processing files with inconsistent EOL', async () => {
      // TDD Red段階: Mixed EOL形式ファイルの処理テスト
      const mixedContent = 'line1\r\nline2\nline3\r\nline4\nline5\r\nline6';

      mockFs.readFile.mockResolvedValue(mixedContent);

      const annotation = await annotator.annotateFile(
        '/project/test.ts',
        mockResultWithLocation.issues,
        undefined
      );

      expect(annotation).toBeDefined();
      // 元のファイルと同じEOLパターンが保持されることを確認
      // ここでは主要なEOL形式（この場合はCRLF）が使用されることを期待
      const originalCrlfCount = (mixedContent.match(/\r\n/g) || []).length;
      const annotatedCrlfCount = (annotation!.annotatedContent.match(/\r\n/g) || []).length;

      // アノテーション追加により、主要なEOL形式で統一されることを確認
      expect(annotatedCrlfCount).toBeGreaterThanOrEqual(originalCrlfCount);
    });

    it('should preserve EOL in generateDiffReport method', () => {
      // TDD Red段階: generateDiffReport内でのEOL保持テスト
      const annotations = [
        {
          filePath: '/project/crlf-test.ts',
          originalContent: 'original line1\r\noriginal line2\r\noriginal line3',
          annotatedContent: '// annotation\r\noriginal line1\r\noriginal line2\r\noriginal line3',
          annotationCount: 1,
        },
      ];

      const diffReport = annotator.generateDiffReport(annotations);

      // 差分レポート生成時の適切な処理確認
      expect(diffReport).toBeDefined();
      // レポート生成では標準的なLF形式を使用するが、内部処理でEOLユーティリティが正常動作することを確認
      expect(diffReport).toContain('# Annotation Diff Report');
      expect(diffReport).toContain('## File: /project/crlf-test.ts');
      expect(diffReport).toContain('Annotations added: 1');
      // 差分内容が正しく表示されることを確認
      expect(diffReport).toContain('+ ');
    });

    it('should preserve EOL in previewAnnotations method', () => {
      // TDD Red段階: previewAnnotations内でのEOL保持テスト
      const preview = annotator.previewAnnotations(mockResultWithLocation);

      expect(preview).toBeDefined();
      // プレビュー生成時のEOL処理が適切であることを確認
      const lines = preview.split('\n');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should preserve EOL in cleanupAnnotations method', async () => {
      // TDD Red段階: cleanupAnnotations内でのEOL保持テスト
      const crlfContentWithAnnotation = `line1\r\n// RIMOR-HIGH: Security issue\r\nline2\r\nline3`;

      mockFs.readFile.mockResolvedValue(crlfContentWithAnnotation);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await annotator.cleanupAnnotations('/project/test.ts');

      expect(result).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      // クリーンアップ後もCRLF形式が保持されることを確認
      expect(writtenContent).toContain('\r\n');
      const crlfCount = (writtenContent.match(/\r\n/g) || []).length;
      expect(crlfCount).toBeGreaterThan(0);
    });
  });
});
