/**
 * BrokenAccessControlPlugin のテストスイート
 * TDD: REDフェーズ - 最小限のテストから始める
 */

import { BrokenAccessControlPlugin } from '../../../../src/security/plugins/owasp/BrokenAccessControlPlugin';
import { ProjectContext, TestFile, DetectionResult } from '../../../../src/core/types';

describe('BrokenAccessControlPlugin', () => {
  it('存在する', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin).toBeDefined();
  });

  it('正しいidを持つ', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.id).toBe('owasp-a01-broken-access-control');
  });

  it('正しいnameを持つ', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.name).toBe('OWASP A01: Broken Access Control');
  });

  it('正しいversionを持つ', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.version).toBe('1.0.0');
  });

  it('正しいtypeを持つ', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.type).toBe('security');
  });

  it('正しいowaspCategoryを持つ', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.owaspCategory).toBe('A01:2021');
  });

  it('正しいcweIdsを持つ', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.cweIds).toBeDefined();
    expect(Array.isArray(plugin.cweIds)).toBe(true);
    expect(plugin.cweIds.length).toBeGreaterThan(0);
  });

  it('Broken Access Control関連のCWE IDを含む', () => {
    const plugin = new BrokenAccessControlPlugin();
    expect(plugin.cweIds).toContain('CWE-22'); // Path Traversal
    expect(plugin.cweIds).toContain('CWE-284'); // Improper Access Control
    expect(plugin.cweIds).toContain('CWE-285'); // Improper Authorization
  });

  describe('isApplicable', () => {
    it('認証ライブラリが存在する場合はtrueを返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['passport'],
        filePatterns: { test: [], source: [], ignore: [] }
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });

    it('認証ライブラリが存在しない場合はfalseを返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express'],
        filePatterns: { test: [], source: [], ignore: [] }
      };
      expect(plugin.isApplicable(context)).toBe(false);
    });

    it('jsonwebtokenライブラリが存在する場合はtrueを返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['jsonwebtoken'],
        filePatterns: { test: [], source: [], ignore: [] }
      };
      expect(plugin.isApplicable(context)).toBe(true);
    });
  });

  describe('detectPatterns', () => {
    it('メソッドが存在する', async () => {
      const plugin = new BrokenAccessControlPlugin();
      const testFile: TestFile = {
        path: '/test/auth.test.ts',
        content: 'test code'
      };
      
      const result = await plugin.detectPatterns(testFile);
      expect(result).toBeDefined();
    });

    it('アクセス制御テストパターンを検出する', async () => {
      const plugin = new BrokenAccessControlPlugin();
      const testFile: TestFile = {
        path: '/test/auth.test.ts',
        content: `
          describe('Authorization', () => {
            it('should deny access without token', async () => {
              const response = await request(app)
                .get('/admin/users')
                .expect(401);
            });
            
            it('should verify admin role', async () => {
              const response = await request(app)
                .get('/admin/users')
                .set('Authorization', 'Bearer token')
                .expect(200);
            });
          });
        `
      };
      
      const result = await plugin.detectPatterns(testFile);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].confidence).toBeGreaterThan(0);
    });
  });

  describe('evaluateQuality', () => {
    it('メソッドが存在する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const patterns = [{
        patternId: 'access-control-test',
        confidence: 0.8
      }];
      
      const result = plugin.evaluateQuality(patterns);
      expect(result).toBeDefined();
    });

    it('アクセス制御テストが存在する場合は高いスコアを返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const patterns = [{
        patternId: 'access-control-test',
        confidence: 0.8
      }];
      
      const result = plugin.evaluateQuality(patterns);
      expect(result.overall).toBeGreaterThan(70);
      expect(result.security).toBeDefined();
      expect(result.security).toBeGreaterThan(70);
    });

    it('アクセス制御テストが存在しない場合は低いスコアを返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const patterns: DetectionResult[] = [];
      
      const result = plugin.evaluateQuality(patterns);
      expect(result.overall).toBeLessThan(50);
      expect(result.security).toBeLessThan(50);
    });
  });

  describe('suggestImprovements', () => {
    it('メソッドが存在する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const evaluation = {
        overall: 30,
        security: 30,
        dimensions: {},
        confidence: 0.8
      };
      
      const result = plugin.suggestImprovements(evaluation);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('低いスコアの場合は改善提案を返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const evaluation = {
        overall: 30,
        security: 30,
        dimensions: {},
        confidence: 0.8,
        details: {
          message: 'アクセス制御テストが検出されませんでした'
        }
      };
      
      const result = plugin.suggestImprovements(evaluation);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].priority).toBe('high');
      expect(result[0].title).toContain('アクセス制御');
    });

    it('高いスコアの場合は追加の改善提案を返す', () => {
      const plugin = new BrokenAccessControlPlugin();
      const evaluation = {
        overall: 80,
        security: 80,
        dimensions: {},
        confidence: 0.9,
        details: {
          message: 'アクセス制御テストが適切に実装されています'
        }
      };
      
      const result = plugin.suggestImprovements(evaluation);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].priority).toBe('medium');
    });
  });

  describe('validateSecurityTests', () => {
    it('メソッドが存在する', async () => {
      const plugin = new BrokenAccessControlPlugin();
      const testFile: TestFile = {
        path: '/test/auth.test.ts',
        content: 'test code'
      };
      
      const result = await plugin.validateSecurityTests(testFile);
      expect(result).toBeDefined();
    });

    it('アクセス制御テストが存在する場合は高いカバレッジを返す', async () => {
      const plugin = new BrokenAccessControlPlugin();
      const testFile: TestFile = {
        path: '/test/auth.test.ts',
        content: `
          describe('Authorization', () => {
            it('should deny access without token', async () => {
              const response = await request(app)
                .get('/admin/users')
                .expect(401);
            });
            
            it('should verify admin role', async () => {
              const response = await request(app)
                .get('/admin/users')
                .set('Authorization', 'Bearer token')
                .expect(200);
            });

            it('should test RBAC permissions', async () => {
              // Role-based access control test
            });
          });
        `
      };
      
      const result = await plugin.validateSecurityTests(testFile);
      expect(result.category).toBe('A01:2021');
      expect(result.coverage).toBeGreaterThan(70);
      expect(result.testPatterns.length).toBeGreaterThan(0);
    });

    it('アクセス制御テストが不足している場合は推奨事項を返す', async () => {
      const plugin = new BrokenAccessControlPlugin();
      const testFile: TestFile = {
        path: '/test/auth.test.ts',
        content: 'describe("Basic test", () => {});'
      };
      
      const result = await plugin.validateSecurityTests(testFile);
      expect(result.coverage).toBeLessThan(30);
      expect(result.missingTests.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('detectVulnerabilityPatterns', () => {
    it('メソッドが存在する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const content = 'some code';
      
      const result = plugin.detectVulnerabilityPatterns(content);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('パストラバーサルの脆弱性パターンを検出する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const content = `
        app.get('/download', (req, res) => {
          const file = req.query.file;
          res.sendFile(file); // 危険：パス検証なし
        });
      `;
      
      const result = plugin.detectVulnerabilityPatterns(content);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('insufficient-validation');
      expect(result[0].message).toContain('パストラバーサル');
    });

    it('認証チェックなしのアクセスパターンを検出する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const content = `
        app.get('/admin/users', (req, res) => {
          // 認証チェックなしで管理者機能にアクセス
          return res.json(getAllUsers());
        });
      `;
      
      const result = plugin.detectVulnerabilityPatterns(content);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].message).toContain('認証');
    });
  });

  describe('generateSecurityTests', () => {
    it('メソッドが存在する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express', 'passport'],
        filePatterns: { test: [], source: [], ignore: [] }
      };
      
      const result = plugin.generateSecurityTests(context);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('基本的なアクセス制御テストを生成する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express', 'passport'],
        filePatterns: { test: [], source: [], ignore: [] }
      };
      
      const result = plugin.generateSecurityTests(context);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('401');
      expect(result.some(test => test.includes('403'))).toBe(true);
    });

    it('依存関係に基づいた適切なテストを生成する', () => {
      const plugin = new BrokenAccessControlPlugin();
      const context: ProjectContext = {
        rootPath: '/test',
        dependencies: ['express', 'jsonwebtoken'],
        filePatterns: { test: [], source: [], ignore: [] }
      };
      
      const result = plugin.generateSecurityTests(context);
      expect(result.some(test => test.includes('token'))).toBe(true);
      expect(result.some(test => test.includes('Authorization'))).toBe(true);
    });
  });
});