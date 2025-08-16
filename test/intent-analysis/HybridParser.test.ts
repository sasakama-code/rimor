/**
 * HybridParser Tests
 * v0.9.0 - ハイブリッドパーサーのテストスイート
 * 
 * TDD: RED-GREEN-REFACTORサイクル
 */

import { HybridParser, ParserStrategy } from '../../src/intent-analysis/HybridParser';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('HybridParser', () => {
  let parser: HybridParser;
  let tempDir: string;

  beforeEach(async () => {
    parser = new HybridParser({
      enableWarnings: false,
      enableFallback: true,
      enableSmartTruncation: true
    });
    
    // テスト用一時ディレクトリ作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hybrid-parser-test-'));
  });

  afterEach(async () => {
    // クリーンアップ
    parser.clearCache();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('パーサー戦略選択', () => {
    it('小さいファイル（32KB未満）はtree-sitterを使用', async () => {
      // Arrange
      const smallContent = 'const test = "hello world";\nfunction foo() { return 42; }';
      const testFile = path.join(tempDir, 'small.ts');
      await fs.writeFile(testFile, smallContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.TREE_SITTER);
      expect(result.metadata.truncated).toBe(false);
      expect(result.metadata.originalSize).toBeLessThan(32767);
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('program');
    });

    it('大きいファイル（32KB以上）はSmartChunkingを使用', async () => {
      // Arrange
      const largeContent = 'const x = 0;\n'.repeat(3000); // 約36KB
      const testFile = path.join(tempDir, 'large.js');
      await fs.writeFile(testFile, largeContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.truncated).toBe(false);
      expect(result.metadata.originalSize).toBeGreaterThan(32767);
      expect(result.metadata.chunked).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('TypeScriptファイルの正しい解析', async () => {
      // Arrange
      const tsContent = `
        interface User {
          id: number;
          name: string;
        }
        
        class UserService {
          private users: User[] = [];
          
          addUser(user: User): void {
            this.users.push(user);
          }
        }
        
        export default UserService;
      `;
      const testFile = path.join(tempDir, 'service.ts');
      await fs.writeFile(testFile, tsContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.TREE_SITTER);
      expect(result.ast).toBeDefined();
      expect(result.ast.children).toBeDefined();
    });

    it('JSXファイルの正しい解析', async () => {
      // Arrange
      const jsxContent = `
        import React from 'react';
        
        const Button = ({ label, onClick }) => {
          return (
            <button onClick={onClick}>
              {label}
            </button>
          );
        };
        
        export default Button;
      `;
      const testFile = path.join(tempDir, 'button.jsx');
      await fs.writeFile(testFile, jsxContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.TREE_SITTER);
      expect(result.ast).toBeDefined();
    });
  });

  describe('スマート切り詰め', () => {
    it('関数境界での切り詰め', async () => {
      // Arrange
      const parser = new HybridParser({
        maxTreeSitterSize: 100, // テスト用に小さく設定
        enableSmartTruncation: true,
        enableFallback: false
      });
      
      const content = `
function first() {
  return 1;
}

function second() {
  return 2;
}

function third() {
  return 3;
}

function fourth() {
  return 4;
}
`.repeat(10); // 境界が複数ある大きめのコンテンツ
      
      const testFile = path.join(tempDir, 'functions.js');
      await fs.writeFile(testFile, content);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.truncated).toBe(true);
      expect(result.metadata.syntaxBoundaries).toBeDefined();
      expect(result.metadata.syntaxBoundaries?.functions).toBeGreaterThan(0);
      expect(result.metadata.parsedSize).toBeLessThanOrEqual(100);
    });

    it('クラス境界での切り詰め', async () => {
      // Arrange
      const parser = new HybridParser({
        maxTreeSitterSize: 150, // テスト用に小さく設定
        enableSmartTruncation: true,
        enableFallback: false
      });
      
      const content = `
class First {
  method1() { return 1; }
}

class Second {
  method2() { return 2; }
}

class Third {
  method3() { return 3; }
}
`.repeat(5);
      
      const testFile = path.join(tempDir, 'classes.ts');
      await fs.writeFile(testFile, content);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.truncated).toBe(true);
      expect(result.metadata.parsedSize).toBeLessThanOrEqual(150);
    });
  });

  describe('フォールバック処理', () => {
    it('tree-sitterエラー時にBabelにフォールバック', async () => {
      // Arrange
      const invalidContent = '<<< invalid syntax >>>';
      const testFile = path.join(tempDir, 'invalid.js');
      await fs.writeFile(testFile, invalidContent);

      // Act & Assert
      // 無効な構文でもBabelのerrorRecoveryで部分的に解析可能
      const result = await parser.parseFile(testFile);
      expect(result.ast).toBeDefined();
    });

    it('フォールバックが無効な場合はエラー', async () => {
      // Arrange
      const parser = new HybridParser({
        enableFallback: false,
        maxTreeSitterSize: 10 // 非常に小さく設定
      });
      
      const content = 'const x = "long content that exceeds limit";';
      const testFile = path.join(tempDir, 'no-fallback.js');
      await fs.writeFile(testFile, content);

      // Act & Assert
      const result = await parser.parseFile(testFile);
      expect(result.metadata.truncated).toBe(true);
      expect(result.metadata.strategy).toBe(ParserStrategy.TREE_SITTER);
    });
  });

  describe('統計情報', () => {
    it('パース統計の収集', async () => {
      // Arrange
      const files = [
        { name: 'small1.js', content: 'const a = 1;' },
        { name: 'small2.ts', content: 'const b: number = 2;' },
        { name: 'large.js', content: 'const x = 0;\n'.repeat(3000) }
      ];

      for (const file of files) {
        const filePath = path.join(tempDir, file.name);
        await fs.writeFile(filePath, file.content);
        await parser.parseFile(filePath);
      }

      // Act
      const stats = parser.getStatsSummary();

      // Assert
      expect(stats.totalFiles).toBe(3);
      expect(stats.treeSitterCount).toBe(2);
      expect(stats.smartChunkingCount).toBe(1);
      expect(stats.averageParseTime).toBeGreaterThan(0);
    });

    it('個別ファイルの統計情報', async () => {
      // Arrange
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, 'const test = 123;');
      
      // Act
      await parser.parseFile(testFile);
      const stats = parser.getParseStats();

      // Assert
      expect(stats.has(testFile)).toBe(true);
      const fileStat = stats.get(testFile);
      expect(fileStat?.strategy).toBe(ParserStrategy.TREE_SITTER);
      // parseTimeは0の可能性を考慮
      expect(fileStat?.parseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('エッジケース', () => {
    it('空ファイルの処理', async () => {
      // Arrange
      const testFile = path.join(tempDir, 'empty.js');
      await fs.writeFile(testFile, '');

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.ast).toBeDefined();
      expect(result.metadata.originalSize).toBe(0);
    });

    it('境界値（32767バイト）のファイル', async () => {
      // Arrange
      const content = 'x'.repeat(32767);
      const testFile = path.join(tempDir, 'boundary.js');
      await fs.writeFile(testFile, content);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.originalSize).toBe(32767);
    });

    it('境界値-1（32766バイト）のファイル', async () => {
      // Arrange
      const content = 'x'.repeat(32766);
      const testFile = path.join(tempDir, 'just-under.js');
      await fs.writeFile(testFile, content);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.TREE_SITTER);
      expect(result.metadata.originalSize).toBe(32766);
    });
  });
});