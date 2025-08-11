/**
 * IReporter Interface Tests
 * v0.8.0 - レポーターインターフェースのテスト
 */

import {
  ReportFormat,
  ReportOptions,
  ReportResult,
  IReporter
} from '../../../src/core/interfaces/IReporter';
import { AnalysisResult } from '../../../src/core/interfaces/IAnalysisEngine';
import { SecurityAuditResult } from '../../../src/core/interfaces/ISecurityAuditor';

describe('IReporter Interface', () => {
  describe('ReportFormat Enum', () => {
    it('should have correct enum values', () => {
      expect(ReportFormat.TEXT).toBe('text');
      expect(ReportFormat.JSON).toBe('json');
      expect(ReportFormat.HTML).toBe('html');
      expect(ReportFormat.MARKDOWN).toBe('markdown');
    });

    it('should have all expected formats', () => {
      const formats = Object.values(ReportFormat);
      expect(formats).toContain('text');
      expect(formats).toContain('json');
      expect(formats).toContain('html');
      expect(formats).toContain('markdown');
      expect(formats).toHaveLength(4);
    });
  });

  describe('ReportOptions Type', () => {
    it('should have required format property', () => {
      const options: ReportOptions = {
        format: ReportFormat.JSON
      };

      expect(options.format).toBe('json');
    });

    it('should allow all optional properties', () => {
      const fullOptions: ReportOptions = {
        format: ReportFormat.HTML,
        outputPath: '/path/to/report.html',
        includeDetails: true,
        includeSummary: true,
        includeRecommendations: true,
        customTemplate: '<html>{{content}}</html>'
      };

      expect(fullOptions.outputPath).toBe('/path/to/report.html');
      expect(fullOptions.includeDetails).toBe(true);
      expect(fullOptions.includeSummary).toBe(true);
      expect(fullOptions.includeRecommendations).toBe(true);
      expect(fullOptions.customTemplate).toBe('<html>{{content}}</html>');
    });

    it('should support minimal options', () => {
      const minimalOptions: ReportOptions = {
        format: ReportFormat.TEXT
      };

      expect(minimalOptions.outputPath).toBeUndefined();
      expect(minimalOptions.includeDetails).toBeUndefined();
      expect(minimalOptions.includeSummary).toBeUndefined();
    });
  });

  describe('ReportResult Type', () => {
    it('should have required success property', () => {
      const result: ReportResult = {
        success: true
      };

      expect(result.success).toBe(true);
    });

    it('should allow success with output path', () => {
      const successResult: ReportResult = {
        success: true,
        outputPath: '/path/to/output.json',
        content: '{"result": "success"}'
      };

      expect(successResult.success).toBe(true);
      expect(successResult.outputPath).toBe('/path/to/output.json');
      expect(successResult.content).toBe('{"result": "success"}');
    });

    it('should allow failure with error', () => {
      const failureResult: ReportResult = {
        success: false,
        error: 'Failed to generate report'
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBe('Failed to generate report');
      expect(failureResult.outputPath).toBeUndefined();
    });
  });

  describe('IReporter Implementation', () => {
    class MockReporter implements IReporter {
      async generateAnalysisReport(
        result: AnalysisResult,
        options: ReportOptions
      ): Promise<ReportResult> {
        return {
          success: true,
          content: JSON.stringify(result)
        };
      }

      async generateSecurityReport(
        result: SecurityAuditResult,
        options: ReportOptions
      ): Promise<ReportResult> {
        return {
          success: true,
          content: JSON.stringify(result)
        };
      }

      async generateCombinedReport(
        analysisResult: AnalysisResult,
        securityResult: SecurityAuditResult,
        options: ReportOptions
      ): Promise<ReportResult> {
        return {
          success: true,
          content: JSON.stringify({ analysisResult, securityResult })
        };
      }

      printToConsole(content: string): void {
        console.log(content);
      }
    }

    it('should implement all required methods', () => {
      const reporter = new MockReporter();
      
      expect(reporter.generateAnalysisReport).toBeDefined();
      expect(reporter.generateSecurityReport).toBeDefined();
      expect(reporter.printToConsole).toBeDefined();
      expect(typeof reporter.generateAnalysisReport).toBe('function');
      expect(typeof reporter.generateSecurityReport).toBe('function');
      expect(typeof reporter.printToConsole).toBe('function');
    });

    it('should implement optional generateCombinedReport', () => {
      const reporter = new MockReporter();
      expect(reporter.generateCombinedReport).toBeDefined();
      expect(typeof reporter.generateCombinedReport).toBe('function');
    });

    it('should generate analysis report correctly', async () => {
      const reporter = new MockReporter();
      const analysisResult: AnalysisResult = {
        totalFiles: 10,
        issues: [],
        executionTime: 1000
      };

      const result = await reporter.generateAnalysisReport(
        analysisResult,
        { format: ReportFormat.JSON }
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(JSON.parse(result.content!).totalFiles).toBe(10);
    });

    it('should generate security report correctly', async () => {
      const reporter = new MockReporter();
      const securityResult: SecurityAuditResult = {
        threats: [],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0
        },
        executionTime: 500,
        filesScanned: 20
      };

      const result = await reporter.generateSecurityReport(
        securityResult,
        { format: ReportFormat.JSON }
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(JSON.parse(result.content!).filesScanned).toBe(20);
    });

    it('should allow reporter without generateCombinedReport', () => {
      class MinimalReporter implements IReporter {
        async generateAnalysisReport(
          result: AnalysisResult,
          options: ReportOptions
        ): Promise<ReportResult> {
          return { success: true };
        }

        async generateSecurityReport(
          result: SecurityAuditResult,
          options: ReportOptions
        ): Promise<ReportResult> {
          return { success: true };
        }

        printToConsole(content: string): void {
          // Implementation
        }
      }

      const reporter = new MinimalReporter();
      expect(reporter.generateCombinedReport).toBeUndefined();
    });
  });

  describe('Type Guards', () => {
    function isReportOptions(value: unknown): value is ReportOptions {
      return (
        typeof value === 'object' &&
        value !== null &&
        'format' in value &&
        Object.values(ReportFormat).includes((value as ReportOptions).format)
      );
    }

    function isReportResult(value: unknown): value is ReportResult {
      return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        typeof (value as ReportResult).success === 'boolean'
      );
    }

    it('should validate ReportOptions correctly', () => {
      const valid: ReportOptions = {
        format: ReportFormat.JSON
      };

      const invalid = {
        format: 'invalid-format'
      };

      const incomplete = {
        includeDetails: true
        // missing format
      };

      expect(isReportOptions(valid)).toBe(true);
      expect(isReportOptions(invalid)).toBe(false);
      expect(isReportOptions(incomplete)).toBe(false);
      expect(isReportOptions(null)).toBe(false);
    });

    it('should validate ReportResult correctly', () => {
      const valid: ReportResult = {
        success: true,
        content: 'Report content'
      };

      const validFailure: ReportResult = {
        success: false,
        error: 'Error message'
      };

      const invalid = {
        // missing success property
        content: 'Report content'
      };

      expect(isReportResult(valid)).toBe(true);
      expect(isReportResult(validFailure)).toBe(true);
      expect(isReportResult(invalid)).toBe(false);
      expect(isReportResult(undefined)).toBe(false);
    });
  });

  describe('Report Format Usage', () => {
    it('should handle different report formats', () => {
      const formats: ReportFormat[] = [
        ReportFormat.TEXT,
        ReportFormat.JSON,
        ReportFormat.HTML,
        ReportFormat.MARKDOWN
      ];

      formats.forEach(format => {
        const options: ReportOptions = {
          format,
          includeDetails: true
        };

        expect(options.format).toBeDefined();
        expect(typeof options.format).toBe('string');
      });
    });

    it('should support format-specific options', () => {
      const htmlOptions: ReportOptions = {
        format: ReportFormat.HTML,
        customTemplate: '<html>{{content}}</html>',
        includeDetails: true,
        includeSummary: true
      };

      const jsonOptions: ReportOptions = {
        format: ReportFormat.JSON,
        outputPath: '/path/to/report.json'
      };

      const markdownOptions: ReportOptions = {
        format: ReportFormat.MARKDOWN,
        includeRecommendations: true
      };

      expect(htmlOptions.customTemplate).toBeDefined();
      expect(jsonOptions.outputPath).toBeDefined();
      expect(markdownOptions.includeRecommendations).toBe(true);
    });
  });
});