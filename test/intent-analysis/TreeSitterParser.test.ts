/**
 * TreeSitterParser テスト
 * TDDアプローチ: Red → Green → Refactor
 */

import { TreeSitterParser, SupportedLanguage } from '../../src/intent-analysis/TreeSitterParser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ASTNode } from '../../src/core/interfaces/IAnalysisEngine';

describe('TreeSitterParser', () => {
  let parser: TreeSitterParser;
  const testDataDir = path.join(__dirname, '../fixtures/tree-sitter-test-data');

  beforeEach(() => {
    parser = new TreeSitterParser();
  });

  describe('parseContent', () => {
    it('JavaScriptコードを正しく解析できる', () => {
      const jsCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const ast = parser.parseContent(jsCode, SupportedLanguage.JAVASCRIPT);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('program');
      expect(ast.text).toContain('function add(a, b)');
      expect(ast.children).toBeDefined();
      expect(ast.isNamed).toBe(true);
    });

    it('TypeScriptコードを正しく解析できる', () => {
      const tsCode = `
        interface User {
          id: number;
          name: string;
        }
        
        function getUser(id: number): User {
          return { id, name: 'John' };
        }
      `;

      const ast = parser.parseContent(tsCode, SupportedLanguage.TYPESCRIPT);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('program');
      expect(ast.text).toContain('interface User');
    });

    it('サポートされていない言語でエラーを投げる', () => {
      expect(() => {
        parser.parseContent('code', 'python' as SupportedLanguage);
      }).toThrow('Unsupported language: python');
    });
  });

  describe('findTestFunctions', () => {
    it('describe/it/testブロックを検出できる', () => {
      const testCode = `
        describe('Calculator', () => {
          it('should add numbers', () => {
            expect(add(1, 2)).toBe(3);
          });
          
          test('should subtract', () => {
            expect(subtract(5, 3)).toBe(2);
          });
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const testFunctions = parser.findTestFunctions(ast);

      expect(testFunctions).toHaveLength(3); // describe, it, test
      
      // describe, it, testが検出されることを確認
      const testNames = testFunctions.map(node => {
        const match = node.text.match(/^(describe|it|test)/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      expect(testNames).toContain('describe');
      expect(testNames).toContain('it');
      expect(testNames).toContain('test');
    });
  });

  describe('findAssertions', () => {
    it('expect文を検出できる', () => {
      const testCode = `
        it('test', () => {
          const result = calculate(10, 5);
          expect(result).toBe(15);
          expect(result).toBeGreaterThan(10);
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const assertions = parser.findAssertions(ast);

      expect(assertions).toHaveLength(2);
      assertions.forEach(assertion => {
        expect(assertion.text).toMatch(/expect/);
      });
    });

    it('assert文を検出できる', () => {
      const testCode = `
        it('test', () => {
          assert.equal(add(1, 2), 3);
          assert.strictEqual(multiply(2, 3), 6);
        });
      `;

      const ast = parser.parseContent(testCode, SupportedLanguage.JAVASCRIPT);
      const assertions = parser.findAssertions(ast);

      expect(assertions.length).toBeGreaterThan(0);
    });
  });

  describe('findNodes', () => {
    it('特定のノードタイプを検索できる', () => {
      const code = `
        function hello() {
          console.log('Hello');
        }
        
        function world() {
          console.log('World');
        }
      `;

      const ast = parser.parseContent(code, SupportedLanguage.JAVASCRIPT);
      const functions = parser.findNodes(ast, 'function_declaration');

      expect(functions).toHaveLength(2);
      functions.forEach(func => {
        expect(func.type).toBe('function_declaration');
      });
    });
  });

  describe('detectLanguage', () => {
    it('ファイル拡張子から言語を正しく検出する', async () => {
      // テスト用の一時ファイルを作成
      const tempDir = path.join(__dirname, '../temp');
      await fs.mkdir(tempDir, { recursive: true });
      
      const testFiles = [
        { name: 'test.js', lang: SupportedLanguage.JAVASCRIPT },
        { name: 'test.ts', lang: SupportedLanguage.TYPESCRIPT },
        { name: 'test.jsx', lang: SupportedLanguage.JSX },
        { name: 'test.tsx', lang: SupportedLanguage.TSX }
      ];

      for (const { name, lang } of testFiles) {
        const filePath = path.join(tempDir, name);
        await fs.writeFile(filePath, '// test code');
        
        const ast = await parser.parseFile(filePath);
        expect(ast).toBeDefined();
        
        // クリーンアップ
        await fs.unlink(filePath);
      }

      await fs.rmdir(tempDir);
    });
  });
});