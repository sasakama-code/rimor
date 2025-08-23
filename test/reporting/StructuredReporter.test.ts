/**
 * StructuredReporter Tests
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * 構造化レポーター機能のテスト
 */

import { StructuredReporter } from '../../src/reporting/StructuredReporter';
import { AnalysisResult } from '../../src/core/interfaces/IAnalysisEngine';
import { SecurityAuditResult, ThreatType } from '../../src/core/interfaces/ISecurityAuditor';
import { Severity, IssueType } from '../../src/reporting/types';
import type { IssueCategory } from '../../src/core/types';

describe('StructuredReporter', () => {
  let reporter: StructuredReporter;

  beforeEach(() => {
    reporter = new StructuredReporter();
  });

  describe('convertAnalysisResult', () => {
    it('should convert analysis result to structured format', async () => {
      const analysisResult: AnalysisResult = {
        totalFiles: 10,
        issues: [
          {
            id: 'missing-test-id',
            type: 'missing-test',
            file: 'src/auth.ts',
            line: 25,
            severity: 'high',
            message: 'No test file found for auth.ts',
            filePath: 'src/auth.ts',
            category: 'test-quality' as IssueCategory
          },
          {
            id: 'insufficient-assertion-id',
            type: 'insufficient-assertion',
            file: 'src/user.test.ts',
            line: 15,
            severity: 'medium',
            message: 'Test has no assertions',
            filePath: 'src/user.test.ts',
            category: 'assertion' as IssueCategory
          }
        ],
        executionTime: 1500
      };

      const result = await reporter.convertAnalysisResult(
        analysisResult,
        '/test/project',
        Date.now() - 1500
      );

      expect(result.metadata.version).toBe('0.8.0');
      expect(result.metadata.analyzedPath).toBe('/test/project');
      expect(result.metadata.duration).toBeGreaterThanOrEqual(1500);
      
      expect(result.summary.totalFiles).toBe(10);
      expect(result.summary.totalIssues).toBe(2);
      expect(result.summary.issueBySeverity.high).toBe(1);
      expect(result.summary.issueBySeverity.medium).toBe(1);
      
      expect(result.issues).toHaveLength(2);
      expect(result.issues[0].id).toMatch(/^[a-f0-9]{16}$/);
      expect(result.issues[0].severity).toBe(Severity.HIGH);
      expect(result.issues[0].type).toBe(IssueType.MISSING_TEST);
    });

    it('should handle empty analysis result', async () => {
      const analysisResult: AnalysisResult = {
        totalFiles: 0,
        issues: [],
        executionTime: 100
      };

      const result = await reporter.convertAnalysisResult(
        analysisResult,
        '/empty/project',
        Date.now()
      );

      expect(result.summary.totalFiles).toBe(0);
      expect(result.summary.totalIssues).toBe(0);
      expect(result.issues).toHaveLength(0);
      
      Object.values(result.summary.issueBySeverity).forEach(count => {
        expect(count).toBe(0);
      });
    });
  });

  describe('mergeSecurityResult', () => {
    it('should merge security audit result into structured format', async () => {
      const structuredResult = {
        metadata: {
          version: '0.8.0',
          timestamp: new Date().toISOString(),
          analyzedPath: '/test/project',
          duration: 1000
        },
        summary: {
          totalFiles: 5,
          totalIssues: 1,
          issueBySeverity: {
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
            info: 0
          },
          issueByType: {
            'MISSING_TEST': 1
          }
        },
        issues: [{
          id: 'test-1',
          type: IssueType.MISSING_TEST,
          category: 'test-coverage' as IssueCategory,
          severity: Severity.HIGH,
          location: {
            file: 'src/auth.ts',
            startLine: 1,
            endLine: 100
          },
          message: 'Test file missing for auth.ts'
        }],
        metrics: {
          testCoverage: { overall: 80, byModule: {} },
          codeQuality: {}
        }
      };

      const securityResult: SecurityAuditResult = {
        threats: [
          {
            type: ThreatType.INJECTION,
            severity: 'critical',
            file: 'src/db.ts',
            line: 50,
            column: 10,
            message: 'Potential SQL injection vulnerability',
            recommendation: 'Use parameterized queries'
          }
        ],
        summary: {
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          total: 1
        },
        executionTime: 500,
        filesScanned: 10
      };

      const merged = await reporter.mergeSecurityResult(
        structuredResult,
        securityResult
      );

      expect(merged.summary.totalIssues).toBe(2);
      expect(merged.summary.issueBySeverity.critical).toBe(1);
      expect(merged.summary.issueBySeverity.high).toBe(1);
      expect(merged.summary.issueByType['SQL_INJECTION']).toBe(1);
      expect(merged.summary.issueByType['MISSING_TEST']).toBe(1);
      expect(merged.issues).toHaveLength(2);
      
      // 両方の問題が含まれていることを確認
      const sqlIssue = merged.issues.find(i => i.type === IssueType.SQL_INJECTION);
      const testIssue = merged.issues.find(i => i.type === IssueType.MISSING_TEST);
      
      expect(sqlIssue).toBeDefined();
      expect(sqlIssue!.severity).toBe(Severity.CRITICAL);
      
      expect(testIssue).toBeDefined();
      expect(testIssue!.severity).toBe(Severity.HIGH);
    });
  });

  describe('toJSON', () => {
    it('should produce deterministic JSON output', () => {
      const data = {
        metadata: {
          version: '0.8.0',
          timestamp: '2024-01-01T00:00:00.000Z',
          analyzedPath: '/test',
          duration: 1000
        },
        summary: {
          totalFiles: 1,
          totalIssues: 1,
          issueBySeverity: {
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
            info: 0
          },
          issueByType: { 'TEST_QUALITY': 1 }
        },
        issues: [
          {
            id: '1234567890abcdef',
            type: IssueType.TEST_QUALITY,
            category: 'test-quality' as IssueCategory,
            severity: Severity.HIGH,
            location: {
              file: 'test.ts',
              startLine: 1,
              endLine: 1
            },
            message: 'Test issue'
          }
        ],
        metrics: {
          testCoverage: { overall: 80, byModule: {} },
          codeQuality: {}
        }
      };

      const json1 = reporter.toJSON(data);
      const json2 = reporter.toJSON(data);

      expect(json1).toBe(json2); // 決定論的出力
      expect(() => JSON.parse(json1)).not.toThrow();
      
      const parsed = JSON.parse(json1);
      expect(parsed.metadata.version).toBe('0.8.0');
    });

    it('should handle circular references', () => {
      const data: any = {
        metadata: {
          version: '0.8.0',
          timestamp: '2024-01-01T00:00:00.000Z',
          analyzedPath: '/test',
          duration: 1000
        }
      };
      
      // 循環参照を作成
      data.circular = data;

      expect(() => reporter.toJSON(data)).not.toThrow();
    });
  });

  describe('severity mapping', () => {
    it('should correctly map analysis severities to enum values', () => {
      const testCases = [
        { input: 'critical', expected: Severity.CRITICAL },
        { input: 'high', expected: Severity.HIGH },
        { input: 'medium', expected: Severity.MEDIUM },
        { input: 'low', expected: Severity.LOW },
        { input: 'info', expected: Severity.INFO },
        { input: 'unknown', expected: Severity.LOW },
        { input: undefined, expected: Severity.LOW }
      ];

      testCases.forEach(({ input, expected }) => {
        const mapped = (reporter as any).mapSeverity(input);
        expect(mapped).toBe(expected);
      });
    });
  });

  describe('issue type mapping', () => {
    it('should correctly map issue types to enum values', () => {
      const testCases = [
        { input: 'missing-test', expected: IssueType.MISSING_TEST },
        { input: 'insufficient-assertion', expected: IssueType.INSUFFICIENT_ASSERTION },
        { input: 'test-quality', expected: IssueType.TEST_QUALITY },
        { input: 'SQL_INJECTION', expected: IssueType.SQL_INJECTION },
        { input: 'XSS', expected: IssueType.XSS },
        { input: 'unknown-type', expected: IssueType.CODE_QUALITY }
      ];

      testCases.forEach(({ input, expected }) => {
        const mapped = (reporter as any).mapIssueType(input);
        expect(mapped).toBe(expected);
      });
    });
  });
});