/**
 * BaseSecurityPlugin テスト
 * 
 * TDD RED段階: セキュリティプラグインの基底クラステスト
 * SOLID原則に従い、セキュリティ固有の共通機能を提供
 */

import { BaseSecurityPlugin } from '../../../src/plugins/base/BaseSecurityPlugin';
import { BasePlugin } from '../../../src/plugins/base/BasePlugin';
import { ProjectContext, TestFile, DetectionResult, QualityScore, Improvement } from '../../../src/core/types';
import { createDefaultQualityScore } from '../../helpers/quality-score.helper';

// テスト用の具象クラス
class TestSecurityPlugin extends BaseSecurityPlugin {
  id = 'test-security';
  name = 'Test Security Plugin';
  version = '1.0.0';

  isApplicable(context: ProjectContext): boolean {
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns = this.detectSecurityPatterns(testFile.content);
    return patterns.map(p => ({
      patternId: p.type,
      patternName: p.type,
      severity: p.severity as 'low' | 'medium' | 'high' | 'critical',
      confidence: 0.8,
      location: {
        file: testFile.path,
        line: p.line || 1,
        column: p.column || 1
      },
      metadata: {
        description: p.description,
        category: 'security'
      }
    }));
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    const securityScore = this.evaluateSecurityScore(patterns);
    return createDefaultQualityScore({
      overall: securityScore * 100,
      dimensions: {
        completeness: securityScore,
        correctness: 1.0,
        maintainability: 0.8,
        performance: 0.8,
        security: securityScore
      },
      breakdown: {
        completeness: securityScore * 100,
        correctness: 100,
        maintainability: 80
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 1
    });
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    if (evaluation.overall < 50) {
      return [{
        id: 'fix-security-issues',
        priority: 'high',
        type: 'modify',
        category: 'security',
        title: 'Fix security vulnerabilities',
        description: 'Address detected security issues',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.5,
        impact: {
          scoreImprovement: 50,
          effortMinutes: 30
        },
        automatable: false
      }];
    }
    return [];
  }
}

describe('BaseSecurityPlugin', () => {
  let plugin: TestSecurityPlugin;

  beforeEach(() => {
    plugin = new TestSecurityPlugin();
  });

  describe('Inheritance hierarchy', () => {
    test('should extend BasePlugin', () => {
      expect(plugin instanceof BasePlugin).toBe(true);
      expect(plugin instanceof BaseSecurityPlugin).toBe(true);
    });

    test('should have type "security"', () => {
      expect(plugin.type).toBe('security');
    });
  });

  describe('detectSecurityPatterns', () => {
    test('should detect SQL injection patterns', () => {
      const content = `
        test('should query database', () => {
          const userId = request.params.id;
          const query = "SELECT * FROM users WHERE id = " + userId;
          db.query(query);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'sql-injection',
        severity: 'critical',
        description: expect.stringContaining('SQL injection')
      }));
    });

    test('should detect XSS patterns', () => {
      const content = `
        test('should render user input', () => {
          const userInput = request.body.comment;
          element.innerHTML = userInput;
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'xss',
        severity: 'high',
        description: expect.stringContaining('XSS')
      }));
    });

    test('should detect command injection patterns', () => {
      const content = `
        test('should execute command', () => {
          const filename = request.query.file;
          exec('cat ' + filename);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'command-injection',
        severity: 'critical',
        description: expect.stringContaining('Command injection')
      }));
    });

    test('should detect path traversal patterns', () => {
      const content = `
        test('should read file', () => {
          const filePath = request.params.path;
          fs.readFileSync('../' + filePath);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'path-traversal',
        severity: 'high',
        description: expect.stringContaining('Path traversal')
      }));
    });

    test('should detect hardcoded credentials', () => {
      const content = `
        test('should connect to database', () => {
          const connection = mysql.connect({
            password: "admin123",
            apiKey: "sk_test_1234567890"
          });
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'hardcoded-credentials',
        severity: 'high',
        description: expect.stringContaining('Hardcoded')
      }));
    });

    test('should detect weak cryptography', () => {
      const content = `
        test('should hash password', () => {
          const hash = crypto.createHash('md5');
          hash.update(password);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toContainEqual(expect.objectContaining({
        type: 'weak-crypto',
        severity: 'medium',
        description: expect.stringContaining('weak')
      }));
    });

    test('should return empty array for clean code', () => {
      const content = `
        test('should validate input', () => {
          const sanitized = validator.escape(userInput);
          const parameterized = db.query('SELECT * FROM users WHERE id = ?', [userId]);
        });
      `;

      // @ts-ignore - accessing protected method for testing
      const patterns = plugin.detectSecurityPatterns(content);

      expect(patterns).toHaveLength(0);
    });
  });

  describe('evaluateSecurityScore', () => {
    test('should return low score for critical vulnerabilities', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'sql-injection',
          patternName: 'SQL Injection',
          severity: 'critical',
          confidence: 0.9,
          location: {
            file: 'test.ts',
            line: 1,
            column: 1
          }
        }
      ];

      // @ts-ignore - accessing protected method for testing
      const score = plugin.evaluateSecurityScore(patterns);

      expect(score).toBeLessThan(0.3);
    });

    test('should return medium score for high severity issues', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'xss',
          patternName: 'XSS',
          severity: 'high',
          confidence: 0.8,
          location: {
            file: 'test.ts',
            line: 1,
            column: 1
          }
        }
      ];

      // @ts-ignore - accessing protected method for testing
      const score = plugin.evaluateSecurityScore(patterns);

      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.6);
    });

    test('should return higher score for medium severity issues', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'weak-crypto',
          patternName: 'Weak Crypto',
          severity: 'medium',
          confidence: 0.7,
          location: {
            file: 'test.ts',
            line: 1,
            column: 1
          }
        }
      ];

      // @ts-ignore - accessing protected method for testing
      const score = plugin.evaluateSecurityScore(patterns);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(0.8);
    });

    test('should return perfect score for no issues', () => {
      const patterns: DetectionResult[] = [];

      // @ts-ignore - accessing protected method for testing
      const score = plugin.evaluateSecurityScore(patterns);

      expect(score).toBe(1);
    });

    test('should aggregate multiple issues appropriately', () => {
      const patterns: DetectionResult[] = [
        {
          patternId: 'sql-injection',
          patternName: 'SQL Injection',
          severity: 'critical',
          confidence: 0.9,
          location: {
            file: 'test1.ts',
            line: 1,
            column: 1
          }
        },
        {
          patternId: 'xss',
          patternName: 'XSS',
          severity: 'high',
          confidence: 0.8,
          location: {
            file: 'test2.ts',
            line: 1,
            column: 1
          }
        },
        {
          patternId: 'weak-crypto',
          patternName: 'Weak Crypto',
          severity: 'medium',
          confidence: 0.7,
          location: {
            file: 'test3.ts',
            line: 1,
            column: 1
          }
        }
      ];

      // @ts-ignore - accessing protected method for testing
      const score = plugin.evaluateSecurityScore(patterns);

      // With multiple issues including critical, score should be very low
      expect(score).toBeLessThan(0.2);
    });
  });

  describe('Security pattern detection helpers', () => {
    test('should identify taint sources', () => {
      // @ts-ignore - accessing protected method for testing
      const isTaintSource = plugin.isTaintSource;
      
      if (isTaintSource) {
        expect(isTaintSource('request.params')).toBe(true);
        expect(isTaintSource('request.body')).toBe(true);
        expect(isTaintSource('request.query')).toBe(true);
        expect(isTaintSource('process.env')).toBe(true);
        expect(isTaintSource('localStorage')).toBe(true);
        expect(isTaintSource('const value')).toBe(false);
      }
    });

    test('should identify dangerous sinks', () => {
      // @ts-ignore - accessing protected method for testing
      const isDangerousSink = plugin.isDangerousSink;
      
      if (isDangerousSink) {
        expect(isDangerousSink('eval')).toBe(true);
        expect(isDangerousSink('exec')).toBe(true);
        expect(isDangerousSink('innerHTML')).toBe(true);
        expect(isDangerousSink('db.query')).toBe(true);
        expect(isDangerousSink('console.log')).toBe(false);
      }
    });
  });

  describe('Integration with ITestQualityPlugin', () => {
    test('should properly implement isApplicable', () => {
      const context: ProjectContext = {
        projectPath: '/test/project',
        packageJson: {
          name: 'test-project',
          version: '1.0.0'
        },
        testFramework: 'jest'
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });

    test('should integrate with detectPatterns', async () => {
      const testFile: TestFile = {
        path: '/test/security.test.ts',
        content: `
          test('vulnerable test', () => {
            const query = "SELECT * FROM users WHERE id = " + userId;
          });
        `
      };

      const results = await plugin.detectPatterns(testFile);

      expect(results).toHaveLength(1);
      expect(results[0].metadata?.category).toBe('security');
      expect(results[0].severity).toBe('critical');
    });
  });
});