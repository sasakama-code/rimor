/**
 * ISecurityAuditor Interface Tests
 * v0.8.0 - セキュリティ監査インターフェースのテスト
 */

import {
  ThreatType,
  SecurityThreat,
  SecurityAuditResult,
  SecurityRule,
  SecurityAuditOptions,
  ISecurityAuditor
} from '../../../src/core/interfaces/ISecurityAuditor';

describe('ISecurityAuditor Interface', () => {
  describe('ThreatType Enum', () => {
    it('should have all expected threat types', () => {
      expect(ThreatType.INJECTION).toBe('injection');
      expect(ThreatType.XSS).toBe('xss');
      expect(ThreatType.CSRF).toBe('csrf');
      expect(ThreatType.AUTH_BYPASS).toBe('auth_bypass');
      expect(ThreatType.DATA_EXPOSURE).toBe('data_exposure');
      expect(ThreatType.INSECURE_CRYPTO).toBe('insecure_crypto');
      expect(ThreatType.HARDCODED_SECRET).toBe('hardcoded_secret');
      expect(ThreatType.PATH_TRAVERSAL).toBe('path_traversal');
      expect(ThreatType.UNVALIDATED_INPUT).toBe('unvalidated_input');
    });

    it('should have correct number of threat types', () => {
      const threatTypes = Object.values(ThreatType);
      expect(threatTypes).toHaveLength(9);
    });
  });

  describe('SecurityThreat Type', () => {
    it('should have all required properties', () => {
      const threat: SecurityThreat = {
        type: ThreatType.INJECTION,
        severity: 'critical',
        file: 'src/api/user.ts',
        line: 42,
        message: 'SQL injection vulnerability detected',
        recommendation: 'Use parameterized queries'
      };

      expect(threat.type).toBe(ThreatType.INJECTION);
      expect(threat.severity).toBe('critical');
      expect(threat.file).toBe('src/api/user.ts');
      expect(threat.line).toBe(42);
      expect(threat.message).toBeDefined();
      expect(threat.recommendation).toBeDefined();
    });

    it('should allow optional properties', () => {
      const threatWithOptional: SecurityThreat = {
        type: ThreatType.XSS,
        severity: 'high',
        file: 'src/views/template.ts',
        line: 100,
        column: 15,
        message: 'XSS vulnerability in template rendering',
        recommendation: 'Sanitize user input',
        cweId: 'CWE-79',
        owaspCategory: 'A03:2021'
      };

      expect(threatWithOptional.column).toBe(15);
      expect(threatWithOptional.cweId).toBe('CWE-79');
      expect(threatWithOptional.owaspCategory).toBe('A03:2021');
    });

    it('should support all severity levels', () => {
      const severityLevels: Array<'critical' | 'high' | 'medium' | 'low'> = [
        'critical', 'high', 'medium', 'low'
      ];

      severityLevels.forEach(severity => {
        const threat: SecurityThreat = {
          type: ThreatType.DATA_EXPOSURE,
          severity,
          file: 'test.ts',
          line: 1,
          message: 'Test',
          recommendation: 'Fix it'
        };

        expect(threat.severity).toBe(severity);
      });
    });
  });

  describe('SecurityAuditResult Type', () => {
    it('should have correct structure', () => {
      const result: SecurityAuditResult = {
        threats: [],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0
        },
        executionTime: 1000,
        filesScanned: 50
      };

      expect(result.threats).toEqual([]);
      expect(result.summary.total).toBe(0);
      expect(result.executionTime).toBe(1000);
      expect(result.filesScanned).toBe(50);
    });

    it('should handle threats array correctly', () => {
      const threat: SecurityThreat = {
        type: ThreatType.HARDCODED_SECRET,
        severity: 'high',
        file: 'config.ts',
        line: 5,
        message: 'Hardcoded API key detected',
        recommendation: 'Use environment variables'
      };

      const result: SecurityAuditResult = {
        threats: [threat],
        summary: {
          critical: 0,
          high: 1,
          medium: 0,
          low: 0,
          total: 1
        },
        executionTime: 500,
        filesScanned: 10
      };

      expect(result.threats).toHaveLength(1);
      expect(result.threats[0].type).toBe(ThreatType.HARDCODED_SECRET);
      expect(result.summary.high).toBe(1);
      expect(result.summary.total).toBe(1);
    });
  });

  describe('SecurityRule Type', () => {
    it('should have correct structure', () => {
      const rule: SecurityRule = {
        id: 'custom-rule-001',
        name: 'Detect console.log',
        pattern: 'console\\.log',
        severity: 'low',
        message: 'Console log detected',
        recommendation: 'Remove console.log statements'
      };

      expect(rule.id).toBe('custom-rule-001');
      expect(rule.name).toBe('Detect console.log');
      expect(rule.pattern).toBe('console\\.log');
      expect(rule.severity).toBe('low');
    });

    it('should support RegExp patterns', () => {
      const rule: SecurityRule = {
        id: 'regex-rule',
        name: 'Detect eval',
        pattern: /eval\s*\(/,
        severity: 'critical',
        message: 'eval() usage detected',
        recommendation: 'Avoid using eval()'
      };

      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect((rule.pattern as RegExp).test('eval(')).toBe(true);
      expect((rule.pattern as RegExp).test('evaluate(')).toBe(false);
    });
  });

  describe('SecurityAuditOptions Type', () => {
    it('should have all optional properties', () => {
      const emptyOptions: SecurityAuditOptions = {};
      expect(emptyOptions).toBeDefined();
    });

    it('should support all option properties', () => {
      const fullOptions: SecurityAuditOptions = {
        includeTests: true,
        deepScan: true,
        customRules: [
          {
            id: 'rule1',
            name: 'Test Rule',
            pattern: 'test',
            severity: 'low',
            message: 'Test message',
            recommendation: 'Test recommendation'
          }
        ]
      };

      expect(fullOptions.includeTests).toBe(true);
      expect(fullOptions.deepScan).toBe(true);
      expect(fullOptions.customRules).toHaveLength(1);
      expect(fullOptions.customRules![0].id).toBe('rule1');
    });
  });

  describe('ISecurityAuditor Implementation', () => {
    class MockSecurityAuditor implements ISecurityAuditor {
      private customRules: SecurityRule[] = [];

      async audit(targetPath: string, options?: SecurityAuditOptions): Promise<SecurityAuditResult> {
        return {
          threats: [],
          summary: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: 0
          },
          executionTime: 100,
          filesScanned: 1
        };
      }

      async scanFile(filePath: string): Promise<SecurityThreat[]> {
        return [];
      }

      registerRule(rule: SecurityRule): void {
        this.customRules.push(rule);
      }
    }

    it('should implement required methods', () => {
      const auditor = new MockSecurityAuditor();
      
      expect(auditor.audit).toBeDefined();
      expect(auditor.scanFile).toBeDefined();
      expect(typeof auditor.audit).toBe('function');
      expect(typeof auditor.scanFile).toBe('function');
    });

    it('should implement optional registerRule method', () => {
      const auditor = new MockSecurityAuditor();
      expect(auditor.registerRule).toBeDefined();
      expect(typeof auditor.registerRule).toBe('function');
    });

    it('should allow implementation without registerRule', () => {
      class MinimalAuditor implements ISecurityAuditor {
        async audit(targetPath: string): Promise<SecurityAuditResult> {
          return {
            threats: [],
            summary: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              total: 0
            },
            executionTime: 0,
            filesScanned: 0
          };
        }

        async scanFile(filePath: string): Promise<SecurityThreat[]> {
          return [];
        }
      }

      const auditor = new MinimalAuditor();
      expect((auditor as any).registerRule).toBeUndefined();
    });

    it('should perform audit correctly', async () => {
      const auditor = new MockSecurityAuditor();
      const result = await auditor.audit('/path/to/project', {
        includeTests: false,
        deepScan: true
      });

      expect(result).toBeDefined();
      expect(result.threats).toEqual([]);
      expect(result.summary.total).toBe(0);
      expect(result.filesScanned).toBeGreaterThanOrEqual(0);
    });

    it('should scan file correctly', async () => {
      const auditor = new MockSecurityAuditor();
      const threats = await auditor.scanFile('/path/to/file.ts');

      expect(Array.isArray(threats)).toBe(true);
      expect(threats).toEqual([]);
    });
  });

  describe('Type Guards', () => {
    function isSecurityThreat(value: unknown): value is SecurityThreat {
      return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        'severity' in value &&
        'file' in value &&
        'line' in value &&
        'message' in value &&
        'recommendation' in value &&
        Object.values(ThreatType).includes((value as SecurityThreat).type) &&
        ['critical', 'high', 'medium', 'low'].includes((value as SecurityThreat).severity)
      );
    }

    function isSecurityAuditResult(value: unknown): value is SecurityAuditResult {
      return (
        typeof value === 'object' &&
        value !== null &&
        'threats' in value &&
        'summary' in value &&
        'executionTime' in value &&
        'filesScanned' in value &&
        Array.isArray((value as SecurityAuditResult).threats) &&
        typeof (value as SecurityAuditResult).summary === 'object' &&
        typeof (value as SecurityAuditResult).executionTime === 'number' &&
        typeof (value as SecurityAuditResult).filesScanned === 'number'
      );
    }

    function isSecurityRule(value: unknown): value is SecurityRule {
      return (
        typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        'name' in value &&
        'pattern' in value &&
        'severity' in value &&
        'message' in value &&
        'recommendation' in value
      );
    }

    it('should validate SecurityThreat correctly', () => {
      const valid: SecurityThreat = {
        type: ThreatType.INJECTION,
        severity: 'critical',
        file: 'test.ts',
        line: 10,
        message: 'Test threat',
        recommendation: 'Fix it'
      };

      const invalid = {
        type: 'invalid-type',
        severity: 'critical',
        file: 'test.ts',
        line: 10,
        message: 'Test threat',
        recommendation: 'Fix it'
      };

      expect(isSecurityThreat(valid)).toBe(true);
      expect(isSecurityThreat(invalid)).toBe(false);
      expect(isSecurityThreat(null)).toBe(false);
    });

    it('should validate SecurityAuditResult correctly', () => {
      const valid: SecurityAuditResult = {
        threats: [],
        summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0
        },
        executionTime: 100,
        filesScanned: 10
      };

      const invalid = {
        threats: 'not an array',
        summary: {},
        executionTime: 100,
        filesScanned: 10
      };

      expect(isSecurityAuditResult(valid)).toBe(true);
      expect(isSecurityAuditResult(invalid)).toBe(false);
    });

    it('should validate SecurityRule correctly', () => {
      const valid: SecurityRule = {
        id: 'rule1',
        name: 'Rule 1',
        pattern: 'pattern',
        severity: 'low',
        message: 'Message',
        recommendation: 'Recommendation'
      };

      const invalid = {
        id: 'rule1',
        name: 'Rule 1',
        // missing required fields
      };

      expect(isSecurityRule(valid)).toBe(true);
      expect(isSecurityRule(invalid)).toBe(false);
    });
  });
});