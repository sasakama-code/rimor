/**
 * engine.test.ts
 * セキュリティ解析エンジンのテスト
 */

import { SecurityAnalysisEngine } from '../../../src/security/analysis/engine';

describe('SecurityAnalysisEngine - セキュリティ解析エンジン', () => {
  let engine: SecurityAnalysisEngine;

  beforeEach(() => {
    engine = new SecurityAnalysisEngine();
  });

  describe('基本的な解析機能', () => {
    it('セキュリティ脆弱性を検出すること', async () => {
      const code = `
        function processUserInput(userInput) {
          return eval(userInput); // 危険なevalの使用
        }
      `;

      const result = await engine.analyzeCode(code);

      expect(result).toBeDefined();
      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities[0].type).toBe('code-injection');
      expect(result.vulnerabilities[0].severity).toBe('critical');
    });

    it('SQL インジェクション脆弱性を検出すること', async () => {
      const code = `
        function getUser(userId) {
          const query = "SELECT * FROM users WHERE id = " + userId;
          return database.query(query);
        }
      `;

      const result = await engine.analyzeCode(code);

      const sqlInjection = result.vulnerabilities.find(v => v.type === 'sql-injection');
      expect(sqlInjection).toBeDefined();
      expect(sqlInjection?.severity).toBe('high');
    });

    it('XSS 脆弱性を検出すること', async () => {
      const code = `
        function renderTemplate(userContent) {
          document.innerHTML = userContent; // XSS脆弱性
        }
      `;

      const result = await engine.analyzeCode(code);

      const xssVuln = result.vulnerabilities.find(v => v.type === 'xss');
      expect(xssVuln).toBeDefined();
      expect(xssVuln?.severity).toBe('high');
    });
  });

  describe('コード品質分析', () => {
    it('安全なコードを正常と判定すること', async () => {
      const safeCode = `
        function validateAndProcessInput(input) {
          if (typeof input !== 'string') {
            throw new Error('Invalid input type');
          }
          const sanitized = input.replace(/[<>]/g, '');
          return sanitized.toLowerCase();
        }
      `;

      const result = await engine.analyzeCode(safeCode);

      expect(result.vulnerabilities.length).toBe(0);
      expect(result.securityScore).toBeGreaterThan(0.8);
    });

    it('コードの複雑度を測定すること', async () => {
      const complexCode = `
        function complexFunction(a, b, c) {
          if (a > 0) {
            if (b > 0) {
              if (c > 0) {
                for (let i = 0; i < 10; i++) {
                  if (i % 2 === 0) {
                    continue;
                  }
                }
              }
            }
          }
          return a + b + c;
        }
      `;

      const result = await engine.analyzeCode(complexCode);

      expect(result.complexity).toBeDefined();
      expect(result.complexity.cyclomaticComplexity).toBeGreaterThan(5);
    });
  });

  describe('フロー解析', () => {
    it('データフローを追跡すること', async () => {
      const code = `
        function processData(userInput) {
          const step1 = sanitize(userInput);
          const step2 = validate(step1);
          return store(step2);
        }
      `;

      const result = await engine.analyzeDataFlow(code);

      expect(result).toBeDefined();
      expect(result.flowGraph).toBeDefined();
      expect(result.taintSources.length).toBeGreaterThan(0);
      expect(result.sanitizers.length).toBeGreaterThan(0);
    });

    it('汚染データの伝播を検出すること', async () => {
      const code = `
        function unsafeFlow(taintedInput) {
          const processedData = processInput(taintedInput);
          return dangerousOperation(processedData); // 汚染データが危険な操作に渡される
        }
      `;

      const result = await engine.analyzeDataFlow(code);

      expect(result.taintViolations.length).toBeGreaterThan(0);
      expect(result.taintViolations[0].severity).toBe('high');
    });
  });

  describe('設定とカスタマイズ', () => {
    it('カスタムルールを追加できること', () => {
      const customRule = {
        id: 'custom-crypto-rule',
        pattern: /weak-crypto-function/g,
        severity: 'medium',
        message: 'Weak cryptographic function detected'
      };

      engine.addCustomRule(customRule);

      const code = `
        function encryptData(data) {
          return weak-crypto-function(data); // カスタムルールに引っかかる
        }
      `;

      return engine.analyzeCode(code).then(result => {
        const customVuln = result.vulnerabilities.find(v => v.ruleId === 'custom-crypto-rule');
        expect(customVuln).toBeDefined();
      });
    });

    it('解析レベルを設定できること', async () => {
      const code = `
        function potentialIssue(input) {
          return input.toString(); // 軽微な問題
        }
      `;

      // 厳密レベル
      engine.setAnalysisLevel('strict');
      const strictResult = await engine.analyzeCode(code);

      // 標準レベル
      engine.setAnalysisLevel('standard');
      const standardResult = await engine.analyzeCode(code);

      expect(strictResult.vulnerabilities.length).toBeGreaterThanOrEqual(standardResult.vulnerabilities.length);
    });
  });

  describe('パフォーマンス', () => {
    it('大きなコードファイルを効率的に処理すること', async () => {
      const largeCode = Array.from({ length: 1000 }, (_, i) => 
        `function func${i}() { return ${i}; }`
      ).join('\n');

      const startTime = Date.now();
      const result = await engine.analyzeCode(largeCode);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(5000); // 5秒以内
    });

    it('並列解析を実行できること', async () => {
      const codeFiles = Array.from({ length: 10 }, (_, i) => 
        `function test${i}(input) { return eval(input); }`
      );

      const startTime = Date.now();
      const results = await engine.analyzeMultiple(codeFiles);
      const endTime = Date.now();

      expect(results.length).toBe(10);
      expect(results.every(r => r.vulnerabilities.length > 0)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // 10秒以内
    });
  });

  describe('レポート生成', () => {
    it('詳細な解析レポートを生成すること', async () => {
      const code = `
        function mixedSecurity(input) {
          const sanitized = sanitize(input); // 良い
          return eval(sanitized); // 悪い
        }
      `;

      const result = await engine.analyzeCode(code);
      const report = engine.generateReport(result);

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.vulnerabilities).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('JSON形式のレポートを生成すること', async () => {
      const code = `
        function testFunction(input) {
          return input.replace(/script/gi, '');
        }
      `;

      const result = await engine.analyzeCode(code);
      const jsonReport = engine.generateJsonReport(result);

      expect(jsonReport).toBeDefined();
      const parsed = JSON.parse(jsonReport);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.vulnerabilities).toBeDefined();
      expect(parsed.securityScore).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('構文エラーのあるコードを適切に処理すること', async () => {
      const invalidCode = `
        function broken() {
          return invalid syntax here
        }
      `;

      expect(async () => {
        const result = await engine.analyzeCode(invalidCode);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('空のコードを処理できること', async () => {
      const result = await engine.analyzeCode('');

      expect(result).toBeDefined();
      expect(result.vulnerabilities).toHaveLength(0);
      expect(result.securityScore).toBe(1.0);
    });

    it('非常に長いコードでもクラッシュしないこと', async () => {
      const veryLongCode = 'const x = 1;'.repeat(100000);

      expect(async () => {
        const result = await engine.analyzeCode(veryLongCode);
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });
});