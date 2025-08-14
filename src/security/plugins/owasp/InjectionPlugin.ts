/**
 * OWASP A03:2021 - Injection
 * TDD実装
 */

import { ProjectContext, TestFile, DetectionResult, QualityScore, Improvement } from '../../../core/types';
import { SecurityIssue } from '../../../security/types/security';
import { OWASPCategory, OWASPTestResult } from './IOWASPSecurityPlugin';
import { getDependencyNames, hasDependency } from './dependency-utils';

export class InjectionPlugin {
  readonly id = 'owasp-a03-injection';
  readonly name = 'OWASP A03: Injection';
  readonly version = '1.0.0';
  readonly type = 'security' as const;
  readonly owaspCategory = OWASPCategory.A03_INJECTION;
  readonly cweIds = ['CWE-89', 'CWE-78', 'CWE-79', 'CWE-90'];

  isApplicable(context: ProjectContext): boolean {
    if (!context.dependencies) return false;
    
    // データベース関連の依存関係をチェック
    const dbDependencies = ['mysql', 'mysql2', 'pg', 'postgres', 'sqlite', 'sqlite3', 
                           'sequelize', 'typeorm', 'mongoose', 'mongodb', 'redis'];
    
    // コマンド実行関連の依存関係をチェック
    const cmdDependencies = ['child_process', 'exec-sh', 'shelljs', 'node-cmd'];
    
    // いずれかの依存関係が存在するかチェック
    const deps = getDependencyNames(context);
    return deps.some(dep => 
      dbDependencies.includes(dep.toLowerCase()) || 
      cmdDependencies.includes(dep.toLowerCase())
    );
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content.toLowerCase();
    
    // SQLインジェクション対策パターンの検出
    if (content.includes('sanitize') && content.includes('sql')) {
      patterns.push({
        patternId: 'injection-sql-injection-test',
        patternName: 'SQLインジェクション対策テスト',
        pattern: 'sql-injection-test',
        location: { file: testFile.path, line: 1, column: 0 },
        confidence: 0.9,
        securityRelevance: 0.95,
        metadata: { hasTest: true }
      });
    }
    
    // パラメータ化クエリのパターン検出
    if (content.includes('prepare') || content.includes('parameterized')) {
      if (!patterns.some(p => p.pattern === 'sql-injection-test')) {
        patterns.push({
          patternId: 'injection-sql-injection-test',
          patternName: 'SQLインジェクション対策テスト',
          pattern: 'sql-injection-test',
          location: { file: testFile.path, line: 1, column: 0 },
          confidence: 0.9,
          securityRelevance: 0.95,
          metadata: { hasTest: true }
        });
      }
    }
    
    // コマンドインジェクション対策パターンの検出
    if ((content.includes('command') || content.includes('exec')) && 
        (content.includes('injection') || content.includes('escape'))) {
      patterns.push({
        patternId: 'injection-command-injection-test',
        patternName: 'コマンドインジェクション対策テスト',
        pattern: 'command-injection-test',
        location: { file: testFile.path, line: 1, column: 0 },
        confidence: 0.9,
        securityRelevance: 0.9,
        metadata: { hasTest: true }
      });
    }
    
    // 入力検証パターンの検出
    if (content.includes('validate') && content.includes('input')) {
      patterns.push({
        patternId: 'injection-input-validation-test',
        patternName: '入力検証テスト',
        pattern: 'input-validation-test',
        location: { file: testFile.path, line: 1, column: 0 },
        confidence: 0.8,
        securityRelevance: 0.8,
        metadata: { hasTest: true }
      });
    }
    
    // 不足しているテストの検出
    if (!content.includes('injection') && !content.includes('sanitize') && 
        !content.includes('validate') && !content.includes('escape')) {
      patterns.push({
        patternId: 'missing-injection-test',
        patternName: 'インジェクション対策テストが不足',
        pattern: 'injection-test',
        location: { file: testFile.path, line: 0, column: 0 },
        confidence: 1.0,
        securityRelevance: 0.95,
        severity: 'critical',
        metadata: { hasTest: false }
      });
    }
    
    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // パターンの分析
    const hasSqlInjectionTest = patterns.some(p => 
      p.pattern === 'sql-injection-test' && p.metadata?.hasTest
    );
    const hasCommandInjectionTest = patterns.some(p => 
      p.pattern === 'command-injection-test' && p.metadata?.hasTest
    );
    const hasInputValidationTest = patterns.some(p => 
      p.pattern === 'input-validation-test' && p.metadata?.hasTest
    );
    
    // カバレッジの計算
    const sqlInjectionCoverage = hasSqlInjectionTest ? 100 : 0;
    const commandInjectionCoverage = hasCommandInjectionTest ? 100 : 0;
    const inputValidationCoverage = hasInputValidationTest ? 100 : 0;
    
    // スコアの計算
    const coverageScore = (sqlInjectionCoverage + commandInjectionCoverage + inputValidationCoverage) / 3 / 100;
    const overall = coverageScore * 0.9 + 0.1; // ベーススコア10%を追加
    const security = coverageScore;
    
    return {
      overall,
      security,
      coverage: coverageScore,
      maintainability: 0.6,
      dimensions: {
        completeness: Math.round(coverageScore * 100),
        correctness: 60,
        maintainability: 60
      },
      confidence: 0.9,
      details: {
        strengths: hasSqlInjectionTest ? ['SQLインジェクション対策済み'] : [],
        weaknesses: !hasSqlInjectionTest ? ['SQLインジェクション対策不足'] : [],
        suggestions: [],
        validationCoverage: sqlInjectionCoverage
      }
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    // SQLインジェクション対策テストの改善提案
    if (!evaluation.details?.validationCoverage || evaluation.details.validationCoverage < 50) {
      improvements.push({
        id: 'add-sql-injection-tests',
        title: 'SQLインジェクション対策テストの追加',
        description: 'パラメータ化クエリとSQL入力サニタイゼーションのテストを追加することで、SQLインジェクション脆弱性を防止できます。',
        priority: 'critical',
        type: 'add-test',
        category: 'security',
        location: { file: 'test/security/injection.test.ts', line: 1, column: 0 },
        automatable: true,
        impact: 35,
        suggestedCode: `describe('SQL Injection Prevention', () => {
  it('should sanitize SQL input', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeSQL(maliciousInput);
    expect(sanitized).not.toContain('DROP');
    expect(sanitized).not.toContain(';');
  });
  
  it('should use parameterized queries', () => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const result = stmt.get(userId);
    expect(stmt.source).not.toContain(userId);
  });
  
  it('should reject malformed SQL queries', () => {
    expect(() => executeQuery(maliciousSQL)).toThrow();
  });
});`,
        codeExample: `describe('SQL Injection Prevention', () => {
  it('should sanitize SQL input', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeSQL(maliciousInput);
    expect(sanitized).not.toContain('DROP');
    expect(sanitized).not.toContain(';');
  });
});`
      });
    }
    
    // コマンドインジェクション対策の改善提案
    if (!evaluation.details?.sanitizerCoverage || evaluation.details.sanitizerCoverage < 50) {
      improvements.push({
        id: 'add-command-injection-tests',
        title: 'コマンドインジェクション対策テストの追加',
        description: 'シェルコマンドの適切なエスケープとバリデーションのテストを追加します。',
        priority: 'critical',
        type: 'add-test',
        category: 'security',
        location: { file: 'test/security/injection.test.ts', line: 30, column: 0 },
        automatable: true,
        impact: 30
      });
    }
    
    // 入力検証の改善提案
    if (!evaluation.details?.boundaryCoverage || evaluation.details.boundaryCoverage < 50) {
      improvements.push({
        id: 'add-input-validation-tests',
        title: '入力検証テストの追加',
        description: 'すべてのユーザー入力に対する厳格な検証テストを追加します。',
        priority: 'high',
        type: 'add-test',
        category: 'security',
        location: { file: 'test/security/injection.test.ts', line: 60, column: 0 },
        automatable: true,
        impact: 25
      });
    }
    
    return improvements;
  }

  async validateSecurityTests(testFile: TestFile): Promise<OWASPTestResult> {
    const content = testFile.content.toLowerCase();
    const testPatterns: string[] = [];
    const recommendations: string[] = [];
    const missingTests: string[] = [];
    
    // テストパターンの検出
    if (content.includes('sql') && (content.includes('injection') || content.includes('sanitize'))) {
      testPatterns.push('sql-injection-prevention');
    }
    if (content.includes('command') && content.includes('injection')) {
      testPatterns.push('command-injection-prevention');
    }
    if (content.includes('validate') && content.includes('input')) {
      testPatterns.push('input-validation');
    }
    if (content.includes('parameterized') || content.includes('prepare')) {
      testPatterns.push('parameterized-queries');
    }
    if (content.includes('escape')) {
      testPatterns.push('output-escaping');
    }
    
    // カバレッジの計算
    const requiredPatterns = ['sql-injection-prevention', 'command-injection-prevention', 
                             'input-validation', 'parameterized-queries'];
    const foundPatterns = requiredPatterns.filter(p => testPatterns.includes(p));
    const coverage = Math.round((foundPatterns.length / requiredPatterns.length) * 100);
    
    // 推奨事項の生成
    if (!testPatterns.includes('sql-injection-prevention')) {
      recommendations.push('SQLインジェクション防止テストを追加してください');
      missingTests.push('sql-injection-prevention');
    }
    if (!testPatterns.includes('command-injection-prevention')) {
      recommendations.push('コマンドインジェクション防止テストを追加してください');
      missingTests.push('command-injection-prevention');
    }
    if (!testPatterns.includes('input-validation')) {
      recommendations.push('入力検証テストを追加してください');
      missingTests.push('input-validation');
    }
    if (!testPatterns.includes('parameterized-queries')) {
      recommendations.push('パラメータ化クエリのテストを追加してください');
      missingTests.push('parameterized-queries');
    }
    
    if (testPatterns.length > 0) {
      recommendations.push('インジェクション攻撃のテストケースを定期的に更新してください');
    }
    
    return {
      category: OWASPCategory.A03_INJECTION,
      coverage,
      issues: [],
      recommendations,
      testPatterns,
      missingTests
    };
  }

  detectVulnerabilityPatterns(content: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    // SQLインジェクションパターンの検出
    const sqlPatterns = [
      // 文字列連結によるSQL構築
      /["']SELECT\s+.*FROM\s+.*WHERE\s+.*["']\s*\+/gi,
      /["']INSERT\s+INTO\s+.*VALUES.*["']\s*\+/gi,
      /["']UPDATE\s+.*SET\s+.*["']\s*\+/gi,
      /["']DELETE\s+FROM\s+.*WHERE\s+.*["']\s*\+/gi,
      // テンプレートリテラルでの危険な使用
      /`SELECT\s+.*FROM\s+.*WHERE\s+.*\$\{[^}]+\}`/g,
      /`INSERT\s+INTO\s+.*VALUES.*\$\{[^}]+\}`/g
    ];
    
    sqlPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          id: 'sql-injection-' + Math.random().toString(36).substr(2, 9),
          type: 'sql-injection',
          severity: 'critical',
          message: '文字列連結によるSQL構築は危険です。パラメータ化クエリを使用してください。',
          location: {
            file: 'unknown',
            line: content.substring(0, match.index).split('\n').length,
            column: 0
          },
          recommendation: 'プリペアドステートメントまたはパラメータ化クエリを使用してください'
        });
      }
    });
    
    // コマンドインジェクションパターンの検出
    const cmdPatterns = [
      /exec\s*\(\s*['"`].*\s*\+/g,
      /exec\s*\(\s*`.*\$\{[^}]+\}`/g,
      /child_process\.(exec|spawn|execFile)\s*\([^,]+\+/g,
      /shell\.exec\s*\([^)]*\+/g
    ];
    
    cmdPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          id: 'command-injection-' + Math.random().toString(36).substr(2, 9),
          type: 'command-injection',
          severity: 'critical',
          message: 'ユーザー入力を含むコマンド実行は危険です。',
          location: {
            file: 'unknown',
            line: content.substring(0, match.index).split('\n').length,
            column: 0
          },
          recommendation: 'コマンドライン引数を適切にエスケープしてください'
        });
      }
    });
    
    // eval使用の検出
    const evalPatterns = [
      /eval\s*\(/g,
      /new\s+Function\s*\(/g,
      /setTimeout\s*\([^,]+,\s*0\s*\)/g // 文字列を実行する可能性
    ];
    
    evalPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          id: 'code-injection-' + Math.random().toString(36).substr(2, 9),
          type: 'code-injection',
          severity: 'critical',
          message: '動的コード実行は重大なセキュリティリスクです。',
          location: {
            file: 'unknown',
            line: content.substring(0, match.index).split('\n').length,
            column: 0
          },
          recommendation: 'evalやFunctionコンストラクタの使用を避けてください'
        });
      }
    });
    
    return issues;
  }

  generateSecurityTests(context: ProjectContext): string[] {
    const tests: string[] = [];
    
    // 基本的なSQLインジェクション対策テスト
    tests.push(`describe('SQLインジェクション対策', () => {
  it('悪意のある入力をサニタイズする', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeSQL(maliciousInput);
    expect(sanitized).not.toContain('DROP');
    expect(sanitized).not.toContain("'");
    expect(sanitized).not.toContain(';');
  });
  
  it('パラメータ化クエリを使用する', () => {
    const userId = "1 OR 1=1";
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const result = stmt.get(userId);
    // クエリに直接値が含まれていないことを確認
    expect(stmt.source).not.toContain(userId);
  });
});`);
    
    // コマンドインジェクション対策テスト
    tests.push(`describe('コマンドインジェクション対策', () => {
  it('危険なコマンド入力を防ぐ', () => {
    const userInput = '; rm -rf /';
    expect(() => execCommand(userInput)).toThrow('Invalid input');
  });
  
  it('シェル引数を適切にエスケープする', () => {
    const input = 'test; echo "hacked"';
    const escaped = escapeShellArg(input);
    expect(escaped).not.toContain(';');
    expect(escaped).toBe("'test; echo \\"hacked\\"'");
  });
});`);
    
    // 入力検証テスト
    tests.push(`describe('入力検証', () => {
  it('すべてのユーザー入力を検証する', () => {
    const inputs = ['<script>alert(1)</script>', 'SELECT * FROM', 'eval('];
    inputs.forEach(input => {
      const validated = validateInput(input);
      expect(validated).not.toMatch(/<script|SELECT|eval/);
    });
  });
  
  it('ホワイトリスト方式で入力を検証する', () => {
    const input = 'test123!@#';
    const validated = validateAlphanumeric(input);
    expect(validated).toMatch(/^[a-zA-Z0-9]+$/);
  });
});`);
    
    // データベース使用時の追加テスト
    const mongoDbDeps = ['mongodb', 'mongoose'];
    if (mongoDbDeps.some(dep => hasDependency(context, dep))) {
      tests.push(`describe('NoSQLインジェクション対策', () => {
  it('MongoDBクエリインジェクションを防ぐ', () => {
    const userInput = { $ne: null };
    const sanitized = sanitizeMongoQuery(userInput);
    expect(sanitized).not.toHaveProperty('$ne');
  });
  
  it('オブジェクト型の入力を検証する', () => {
    const query = { username: { $regex: '.*' } };
    const validated = validateMongoQuery(query);
    expect(validated.username).toBeTypeOf('string');
  });
});`);
    }
    
    return tests;
  }

  validateEnterpriseRequirements(testFile: TestFile): boolean {
    const content = testFile.content.toLowerCase();
    
    // エンタープライズ要件のチェック項目
    const requirements = [
      // プリペアドステートメントの使用
      content.includes('prepare') || content.includes('prepared statement'),
      // インジェクション攻撃パターンの検証
      content.includes('injection') && content.includes('pattern'),
      // セキュリティログの記録
      content.includes('log') && (content.includes('attempt') || content.includes('security')),
      // パラメータバインディングの確認
      content.includes('parameter') && content.includes('bind')
    ];
    
    // 少なくとも3つ以上の要件を満たしているかチェック
    const metRequirements = requirements.filter(req => req).length;
    return metRequirements >= 3;
  }
}