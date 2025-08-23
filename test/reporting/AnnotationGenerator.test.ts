/**
 * AnnotationGenerator Tests
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * アノテーション生成機能のテスト
 */

import { AnnotationGenerator } from '../../src/reporting/AnnotationGenerator';
import {
  Issue,
  Severity,
  IssueType,
  AnnotationOptions,
  DataFlow
} from '../../src/reporting/types';

describe('AnnotationGenerator', () => {
  let generator: AnnotationGenerator;

  beforeEach(() => {
    generator = new AnnotationGenerator();
  });

  describe('generateAnnotation', () => {
    const baseIssue: Issue = {
      id: '1234567890abcdef',
      type: IssueType.SQL_INJECTION,
      severity: Severity.CRITICAL,
      category: 'security' as const,
      location: {
        file: 'src/db.ts',
        startLine: 50,
        endLine: 50
      },
      message: 'SQLインジェクション脆弱性が検出されました'
    };

    it('should generate inline annotation by default', () => {
      const annotation = generator.generateAnnotation(baseIssue);
      
      expect(annotation).toContain('// RIMOR-CRITICAL:');
      expect(annotation).toContain('[critical]');
      expect(annotation).toContain('SQL_INJECTION');
      expect(annotation).toContain('SQLインジェクション脆弱性が検出されました');
    });

    it('should generate inline annotation with custom prefix', () => {
      const options: AnnotationOptions = {
        prefix: 'SECURITY'
      };
      
      const annotation = generator.generateAnnotation(baseIssue, options);
      expect(annotation).toContain('// SECURITY-CRITICAL:');
    });

    it('should generate block annotation when specified', () => {
      const options: AnnotationOptions = {
        format: 'block'
      };
      
      const annotation = generator.generateAnnotation(baseIssue, options);
      
      expect(annotation).toContain('/**');
      expect(annotation).toContain(' * RIMOR Security Analysis Report');
      expect(annotation).toContain(' * Issue: SQL_INJECTION');
      expect(annotation).toContain(' * Severity: critical');
      expect(annotation).toContain(' * ID: 1234567890abcdef');
      expect(annotation).toContain(' */');
    });

    it('should include recommendation in block format', () => {
      const issueWithRec: Issue = {
        ...baseIssue,
        recommendation: 'パラメータ化クエリを使用してください'
      };
      
      const options: AnnotationOptions = {
        format: 'block'
      };
      
      const annotation = generator.generateAnnotation(issueWithRec, options);
      
      expect(annotation).toContain(' * Recommendation:');
      expect(annotation).toContain(' * パラメータ化クエリを使用してください');
    });

    it('should include data flow in inline format', () => {
      const dataFlow: DataFlow = {
        source: {
          location: { file: 'api.ts', startLine: 10, endLine: 10 },
          type: 'user_input'
        },
        sink: {
          location: { file: 'db.ts', startLine: 50, endLine: 50 },
          type: 'sql_query'
        },
        path: []
      };
      
      const issueWithFlow: Issue = {
        ...baseIssue,
        dataFlow
      };
      
      const options: AnnotationOptions = {
        includeDataFlow: true
      };
      
      const annotation = generator.generateAnnotation(issueWithFlow, options);
      
      expect(annotation).toContain('(Source: api.ts:10 -> Sink: db.ts:50)');
    });

    it('should include detailed data flow in block format', () => {
      const dataFlow: DataFlow = {
        source: {
          location: { file: 'api.ts', startLine: 10, endLine: 10 },
          type: 'user_input',
          description: 'HTTPパラメータ'
        },
        sink: {
          location: { file: 'db.ts', startLine: 50, endLine: 50 },
          type: 'sql_query',
          description: 'データベースクエリ'
        },
        path: [
          {
            location: { file: 'service.ts', startLine: 30, endLine: 30 },
            type: 'propagation',
            description: '値の伝播'
          }
        ]
      };
      
      const issueWithFlow: Issue = {
        ...baseIssue,
        dataFlow
      };
      
      const options: AnnotationOptions = {
        format: 'block',
        includeDataFlow: true
      };
      
      const annotation = generator.generateAnnotation(issueWithFlow, options);
      
      expect(annotation).toContain(' * Data Flow Analysis:');
      expect(annotation).toContain(' * Source: user_input');
      expect(annotation).toContain(' *   Location: api.ts:10');
      expect(annotation).toContain(' * Path:');
      expect(annotation).toContain(' *   1. 値の伝播');
      expect(annotation).toContain(' * Sink: sql_query');
    });

    it('should include references in block format', () => {
      const issueWithRefs: Issue = {
        ...baseIssue,
        references: [
          'https://owasp.org/sql-injection',
          'CWE-89'
        ]
      };
      
      const options: AnnotationOptions = {
        format: 'block'
      };
      
      const annotation = generator.generateAnnotation(issueWithRefs, options);
      
      expect(annotation).toContain(' * References:');
      expect(annotation).toContain(' * - https://owasp.org/sql-injection');
      expect(annotation).toContain(' * - CWE-89');
    });
  });

  describe('getSeverityTag', () => {
    it('should return correct tags for all severities', () => {
      const testCases = [
        { severity: Severity.CRITICAL, expected: 'CRITICAL' },
        { severity: Severity.HIGH, expected: 'HIGH' },
        { severity: Severity.MEDIUM, expected: 'MEDIUM' },
        { severity: Severity.LOW, expected: 'LOW' },
        { severity: Severity.INFO, expected: 'INFO' }
      ];

      testCases.forEach(({ severity, expected }) => {
        const issue: Issue = {
          id: '123',
          type: IssueType.CODE_QUALITY,
          severity,
          category: 'code-quality' as const,
          location: { file: 'test.ts', startLine: 1, endLine: 1 },
          message: 'Test'
        };
        
        const annotation = generator.generateAnnotation(issue);
        expect(annotation).toContain(`RIMOR-${expected}:`);
      });
    });
  });

  describe('getCommentStyle', () => {
    it('should return correct comment styles for different file types', () => {
      const testCases = [
        // C系言語
        { file: 'test.js', expectedInline: '//', expectedBlock: true },
        { file: 'test.ts', expectedInline: '//', expectedBlock: true },
        { file: 'test.java', expectedInline: '//', expectedBlock: true },
        { file: 'test.go', expectedInline: '//', expectedBlock: true },
        { file: 'test.rust', expectedInline: '//', expectedBlock: true },
        
        // スクリプト言語
        { file: 'test.py', expectedInline: '#', expectedBlock: true },
        { file: 'test.rb', expectedInline: '#', expectedBlock: true },
        { file: 'test.sh', expectedInline: '#', expectedBlock: false },
        
        // マークアップ
        { file: 'test.html', expectedInline: '<!--', expectedBlock: false },
        { file: 'test.xml', expectedInline: '<!--', expectedBlock: false },
        
        // その他
        { file: 'test.sql', expectedInline: '--', expectedBlock: true },
        { file: 'test.yaml', expectedInline: '#', expectedBlock: false }
      ];

      testCases.forEach(({ file, expectedInline, expectedBlock }) => {
        const style = generator.getCommentStyle(file);
        expect(style.inline).toBe(expectedInline);
        
        if (expectedBlock) {
          expect(style.blockStart).toBeDefined();
          expect(style.blockEnd).toBeDefined();
        }
      });
    });

    it('should default to // for unknown file types', () => {
      const style = generator.getCommentStyle('test.unknown');
      expect(style.inline).toBe('//');
    });
  });

  describe('generateLanguageSpecificAnnotation', () => {
    const issue: Issue = {
      id: '123',
      type: IssueType.XSS,
      severity: Severity.HIGH,
      category: 'security' as const,
      location: { file: 'test.py', startLine: 10, endLine: 10 },
      message: 'XSS脆弱性'
    };

    it('should generate Python-style inline annotation', () => {
      const annotation = generator.generateLanguageSpecificAnnotation(
        issue,
        'script.py'
      );
      
      expect(annotation).toContain('# RIMOR-HIGH:');
      expect(annotation).not.toContain('//');
    });

    it('should generate Python-style block annotation', () => {
      const options: AnnotationOptions = {
        format: 'block'
      };
      
      const annotation = generator.generateLanguageSpecificAnnotation(
        issue,
        'script.py',
        options
      );
      
      expect(annotation).toContain('"""');
      expect(annotation).not.toContain('/**');
      expect(annotation).not.toContain('*/');
    });

    it('should generate HTML-style annotation', () => {
      const annotation = generator.generateLanguageSpecificAnnotation(
        issue,
        'index.html'
      );
      
      expect(annotation).toContain('<!-- RIMOR-HIGH:');
      expect(annotation).not.toContain('//');
    });
  });

  describe('groupAnnotationsByLine', () => {
    it('should group annotations by file and sort by line number', () => {
      const issues: Issue[] = [
        {
          id: '1',
          type: IssueType.TEST_QUALITY,
          severity: Severity.MEDIUM,
          category: 'test-quality' as const,
          location: { file: 'test1.ts', startLine: 50, endLine: 50 },
          message: 'Issue 1'
        },
        {
          id: '2',
          type: IssueType.TEST_QUALITY,
          severity: Severity.HIGH,
          category: 'test-quality' as const,
          location: { file: 'test1.ts', startLine: 20, endLine: 20 },
          message: 'Issue 2'
        },
        {
          id: '3',
          type: IssueType.TEST_QUALITY,
          severity: Severity.LOW,
          category: 'test-quality' as const,
          location: { file: 'test2.ts', startLine: 10, endLine: 10 },
          message: 'Issue 3'
        }
      ];

      const grouped = generator.groupAnnotationsByLine(issues);
      
      expect(grouped.size).toBe(2);
      
      const test1Annotations = grouped.get('test1.ts')!;
      expect(test1Annotations).toHaveLength(2);
      expect(test1Annotations[0].lineNumber).toBe(19); // 0-indexed
      expect(test1Annotations[1].lineNumber).toBe(49);
      
      const test2Annotations = grouped.get('test2.ts')!;
      expect(test2Annotations).toHaveLength(1);
      expect(test2Annotations[0].lineNumber).toBe(9);
    });
  });

  describe('generateAnnotationReport', () => {
    it('should generate a complete annotation report', () => {
      const issues: Issue[] = [
        {
          id: '1',
          type: IssueType.SQL_INJECTION,
          severity: Severity.CRITICAL,
          category: 'security' as const,
          location: { file: 'db.ts', startLine: 100, endLine: 100 },
          message: 'SQL Injection',
          recommendation: 'Use parameterized queries'
        },
        {
          id: '2',
          type: IssueType.XSS,
          severity: Severity.HIGH,
          category: 'security' as const,
          location: { file: 'api.ts', startLine: 50, endLine: 50 },
          message: 'XSS vulnerability'
        }
      ];

      const report = generator.generateAnnotationReport(issues);
      
      expect(report).toContain('# Rimor Annotation Report');
      expect(report).toContain('Total issues found: 2');
      expect(report).toContain('## File: db.ts');
      expect(report).toContain('### Line 100: SQL_INJECTION');
      expect(report).toContain('**Recommendation**: Use parameterized queries');
      expect(report).toContain('## File: api.ts');
      expect(report).toContain('### Line 50: XSS');
    });
  });

  describe('edge cases', () => {
    it('should handle multi-line messages', () => {
      const issue: Issue = {
        id: '123',
        type: IssueType.CODE_QUALITY,
        severity: Severity.MEDIUM,
        category: 'code-quality' as const,
        location: { file: 'test.ts', startLine: 1, endLine: 5 },
        message: 'Line 1\nLine 2\nLine 3'
      };
      
      const options: AnnotationOptions = {
        format: 'block'
      };
      
      const annotation = generator.generateAnnotation(issue, options);
      
      expect(annotation).toContain(' * Line 1');
      expect(annotation).toContain(' * Line 2');
      expect(annotation).toContain(' * Line 3');
    });

    it('should handle very long single-line messages', () => {
      const issue: Issue = {
        id: '123',
        type: IssueType.CODE_QUALITY,
        severity: Severity.LOW,
        category: 'code-quality' as const,
        location: { file: 'test.ts', startLine: 1, endLine: 1 },
        message: 'A'.repeat(500)
      };
      
      const annotation = generator.generateAnnotation(issue);
      
      expect(annotation.length).toBeGreaterThan(500);
      expect(annotation).toContain('A'.repeat(100));
    });
  });
});