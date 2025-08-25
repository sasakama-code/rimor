/**
 * InjectionPlugin のテストスイート
 * TDD: REDフェーズ - 失敗するテストを先に書く
 */

import { InjectionPlugin } from '../../../../src/security/plugins/owasp/InjectionPlugin';
import { InjectionQualityDetails } from '../../../../src/security/plugins/owasp/types';
import { OWASPCategory } from '../../../../src/security/plugins/owasp/IOWASPSecurityPlugin';
import { ProjectContext, TestFile } from '../../../../src/core/types';

describe('InjectionPlugin', () => {
  let plugin: InjectionPlugin;

  beforeEach(() => {
    plugin = new InjectionPlugin();
  });

  describe('基本プロパティ', () => {
    it('正しいプラグイン情報を持つ', () => {
      expect(plugin.id).toBe('owasp-a03-injection');
      expect(plugin.name).toBe('OWASP A03: Injection');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.type).toBe('security');
      expect(plugin.owaspCategory).toBe(OWASPCategory.A03_INJECTION);
    });

    it('正しいCWE IDを持つ', () => {
      expect(plugin.cweIds).toContain('CWE-89'); // SQL Injection
      expect(plugin.cweIds).toContain('CWE-78'); // OS Command Injection
      expect(plugin.cweIds).toContain('CWE-79'); // XSS (一部のインジェクション)
      expect(plugin.cweIds).toContain('CWE-90'); // LDAP Injection
    });
  });

  describe('isApplicable', () => {
    it('データベース依存関係が存在する場合はtrueを返す', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['mysql', 'express', 'sequelize'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });

    it('コマンド実行ライブラリが存在する場合はtrueを返す', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['child_process', 'exec-sh'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      expect(plugin.isApplicable(context)).toBe(true);
    });

    it('関連する依存関係が存在しない場合はfalseを返す', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['react', 'lodash'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      expect(plugin.isApplicable(context)).toBe(false);
    });
  });

  describe('detectPatterns', () => {
    it('SQLインジェクション対策のテストパターンを検出する', async () => {
      const testFile: TestFile = {
        path: 'sql-injection.test.ts',
        content: `
describe('SQL Injection Prevention', () => {
  it('should sanitize user input', () => {
    const input = "'; DROP TABLE users; --";
    const sanitized = sanitizeSQL(input);
    expect(sanitized).not.toContain('DROP');
  });
  
  it('should use parameterized queries', () => {
    const query = db.prepare('SELECT * FROM users WHERE id = ?');
    query.run(userId);
  });
});`
      };

      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.pattern === 'sql-injection-test')).toBe(true);
      expect(patterns.some(p => p.metadata?.hasTest)).toBe(true);
    });

    it('コマンドインジェクション対策のテストパターンを検出する', async () => {
      const testFile: TestFile = {
        path: 'command-injection.test.ts',
        content: `
it('should prevent command injection', () => {
  const userInput = '; rm -rf /';
  expect(() => execCommand(userInput)).toThrow();
});

it('should escape shell arguments', () => {
  const escaped = escapeShellArg('test; echo hack');
  expect(escaped).toBe("'test; echo hack'");
});`
      };

      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.pattern === 'command-injection-test')).toBe(true);
    });

    it('不足しているテストを検出する', async () => {
      const testFile: TestFile = {
        path: 'incomplete.test.ts',
        content: `
describe('User Service', () => {
  it('should create user', () => {
    const user = createUser({ name: 'test' });
    expect(user).toBeDefined();
  });
});`
      };

      const patterns = await plugin.detectPatterns(testFile);
      
      expect(patterns.some(p => p.patternId?.startsWith('missing-injection-'))).toBe(true);
      expect(patterns.some((p: any) => p.severity === 'critical')).toBe(true);
    });
  });

  describe('evaluateQuality', () => {
    it('包括的なインジェクション対策テストに高スコアを付ける', () => {
      const patterns = [
        {
          patternId: 'injection-sql-injection-test',
          patternName: 'SQLインジェクション対策テスト',
          pattern: 'sql-injection-test',
          location: { file: '', line: 1, column: 0 },
          confidence: 0.9,
          securityRelevance: 0.95,
          metadata: { hasTest: true }
        },
        {
          patternId: 'injection-command-injection-test',
          patternName: 'コマンドインジェクション対策テスト',
          pattern: 'command-injection-test',
          location: { file: '', line: 10, column: 0 },
          confidence: 0.9,
          securityRelevance: 0.9,
          metadata: { hasTest: true }
        },
        {
          patternId: 'injection-input-validation-test',
          patternName: '入力検証テスト',
          pattern: 'input-validation-test',
          location: { file: '', line: 20, column: 0 },
          confidence: 0.8,
          securityRelevance: 0.8,
          metadata: { hasTest: true }
        }
      ];

      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.security).toBeGreaterThan(0.7);
      expect((score.details as InjectionQualityDetails)?.sqlInjectionCoverage).toBe(100);
      expect((score.details as InjectionQualityDetails)?.commandInjectionCoverage).toBe(100);
    });

    it('不完全なテストに低スコアを付ける', () => {
      const patterns = [
        {
          patternId: 'missing-injection-sql-injection-test',
          patternName: 'SQLインジェクション対策テストが不足',
          pattern: 'sql-injection-test',
          location: { file: '', line: 0, column: 0 },
          confidence: 1.0,
          securityRelevance: 0.95,
          metadata: { hasTest: false }
        }
      ];

      const score = plugin.evaluateQuality(patterns);
      
      expect(score.overall).toBeLessThan(0.5);
      expect(score.security).toBeLessThan(0.5);
      expect((score.details as InjectionQualityDetails)?.sqlInjectionCoverage).toBe(0);
    });
  });

  describe('suggestImprovements', () => {
    it('SQLインジェクション対策テストが不足している場合の改善提案を生成する', () => {
      const evaluation = {
        overall: 0.3,
        security: 0.3,
        coverage: 0.2,
        maintainability: 0.0,
        dimensions: {},
        breakdown: { completeness: 20, correctness: 0, maintainability: 0 },
        confidence: 0.9,
        details: {
          strengths: [],
          weaknesses: ['SQLインジェクション対策が不足'],
          suggestions: ['入力検証を追加'],
          sqlInjectionCoverage: 0,
          commandInjectionCoverage: 0,
          inputValidationCoverage: 0
        }
      };

      const improvements = plugin.suggestImprovements(evaluation);
      
      expect(improvements.length).toBeGreaterThan(0);
      expect(improvements.some(i => i.id === 'add-sql-injection-tests')).toBe(true);
      expect(improvements.some(i => i.priority === 'critical')).toBe(true);
      expect(improvements.some(i => i.codeExample)).toBe(true);
    });
  });

  describe('validateSecurityTests', () => {
    it('セキュリティテストの検証結果を返す', async () => {
      const testFile: TestFile = {
        path: 'security.test.ts',
        content: `
describe('Injection Security', () => {
  it('should prevent SQL injection', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const result = executeQuery(maliciousInput);
    expect(result).not.toContain('DROP');
  });
  
  it('should validate all user inputs', () => {
    const input = validateInput(userInput);
    expect(input).toMatch(/^[a-zA-Z0-9]+$/);
  });
});`
      };

      const result = await plugin.validateSecurityTests(testFile);
      
      expect(result.category).toBe(OWASPCategory.A03_INJECTION);
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.testPatterns.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    it('危険なSQL構築パターンを検出する', () => {
      const content = `
function getUser(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}

const sql = \`SELECT * FROM products WHERE name = '\${productName}'\`;`;

      const issues = plugin.detectVulnerabilityPatterns(content);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((i: any) => i.type === 'sql-injection')).toBe(true);
      expect(issues.some((i: any) => i.severity === 'critical')).toBe(true);
    });

    it('危険なコマンド実行パターンを検出する', () => {
      const content = `
const exec = require('child_process').exec;
exec('ls ' + userInput);

const command = \`rm -rf \${userPath}\`;
shell.exec(command);`;

      const issues = plugin.detectVulnerabilityPatterns(content);
      
      expect(issues.some((i: any) => i.type === 'command-injection')).toBe(true);
    });

    it('危険なeval使用を検出する', () => {
      const content = `
const code = req.body.code;
eval(code);

new Function(userInput)();`;

      const issues = plugin.detectVulnerabilityPatterns(content);
      
      expect(issues.some((i: any) => i.type === 'code-injection')).toBe(true);
    });
  });

  describe('generateSecurityTests', () => {
    it('基本的なインジェクション対策テストを生成する', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['mysql', 'express'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      const tests = plugin.generateSecurityTests(context);
      
      expect(tests.length).toBeGreaterThan(0);
      expect(tests.some(t => t.includes('SQL'))).toBe(true);
      expect(tests.some(t => t.includes('sanitize'))).toBe(true);
    });

    it('データベース使用時の追加テストを生成する', () => {
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['mongodb', 'mongoose'],
        filePatterns: { test: [], source: [], ignore: [] }
      };

      const tests = plugin.generateSecurityTests(context);
      
      expect(tests.some(t => t.includes('NoSQL'))).toBe(true);
    });
  });

  describe('validateEnterpriseRequirements', () => {
    it('エンタープライズ要件を満たすテストを検証する', () => {
      const testFile: TestFile = {
        path: 'enterprise.test.ts',
        content: `
describe('Enterprise Injection Security', () => {
  it('should use prepared statements exclusively', () => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    expect(stmt.usesParameterBinding).toBe(true);
  });
  
  it('should validate against injection attack patterns', () => {
    const patterns = loadInjectionPatterns();
    patterns.forEach(pattern => {
      expect(isBlocked(pattern)).toBe(true);
    });
  });
  
  it('should log all injection attempts', () => {
    const maliciousInput = "'; DROP TABLE--";
    tryQuery(maliciousInput);
    expect(securityLog.attempts).toContain(maliciousInput);
  });
});`
      };

      expect(plugin.validateEnterpriseRequirements!(testFile)).toBe(true);
    });
  });
});