/**
 * HybridParser Integration Tests
 * v0.9.0 Phase 2 - SmartChunkingParser統合テスト
 * 
 * TDD: RED phase - 統合テストから開始
 * t_wadaの推奨: インテグレーションテストで全体動作を保証
 */

import { HybridParser, ParserStrategy } from '../../src/intent-analysis/HybridParser';
import { SmartChunkingParser } from '../../src/intent-analysis/SmartChunkingParser';
import { ASTMerger } from '../../src/intent-analysis/ASTMerger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('HybridParser with SmartChunkingParser Integration', () => {
  let parser: HybridParser;
  let tempDir: string;

  beforeEach(async () => {
    parser = new HybridParser({
      enableWarnings: false,
      enableFallback: true,
      enableSmartTruncation: true,
      enableSmartChunking: true,  // 新機能: SmartChunking有効化
      chunkingThreshold: 32767    // チャンキングを開始するサイズ
    });
    
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hybrid-integration-test-'));
  });

  afterEach(async () => {
    parser.clearCache();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('SmartChunkingParser統合', () => {
    it('32KB以上のファイルでSmartChunkingParserを使用', async () => {
      // Arrange
      const largeContent = 'const x = 1;\n'.repeat(3000); // 約36KB
      const testFile = path.join(tempDir, 'large-chunking.js');
      await fs.writeFile(testFile, largeContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.chunked).toBe(true);
      expect(result.metadata.chunks).toBeGreaterThan(1);
      expect(result.metadata.mergeStrategy).toBe('sequential');
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('program');
    });

    it('50KB以上の大型ファイルの効率的な処理', async () => {
      // Arrange
      const veryLargeContent = `
        function processData${Math.random()}() {
          const data = [];
          for (let i = 0; i < 1000; i++) {
            data.push({
              id: i,
              value: Math.random() * 100,
              timestamp: Date.now()
            });
          }
          return data;
        }
      `.repeat(200); // 約50KB+
      
      const testFile = path.join(tempDir, 'very-large.js');
      await fs.writeFile(testFile, veryLargeContent);

      // Act
      const startTime = Date.now();
      const result = await parser.parseFile(testFile);
      const parseTime = Date.now() - startTime;

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.chunks).toBeGreaterThan(1);
      expect(result.metadata.astsMerged).toBeGreaterThan(1);
      expect(parseTime).toBeLessThan(1000); // 1秒以内
      expect(result.ast.children).toBeDefined();
      expect(result.ast.children!.length).toBeGreaterThan(0);
    });

    it('構文境界を考慮したチャンキング', async () => {
      // Arrange
      const structuredContent = `
        class UserService {
          constructor() {
            this.users = [];
          }
          
          addUser(user) {
            this.users.push(user);
          }
          
          getUser(id) {
            return this.users.find(u => u.id === id);
          }
        }
        
        class ProductService {
          constructor() {
            this.products = [];
          }
          
          addProduct(product) {
            this.products.push(product);
          }
          
          getProduct(id) {
            return this.products.find(p => p.id === id);
          }
        }
      `.repeat(100); // 構造化された大型ファイル
      
      const testFile = path.join(tempDir, 'structured.js');
      await fs.writeFile(testFile, structuredContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.syntaxBoundaryChunking).toBe(true);
      const classes = result.ast.children?.filter(node => 
        node.type === 'class_declaration'
      );
      expect(classes).toBeDefined();
      expect(classes!.length).toBeGreaterThan(0);
    });
  });

  describe('フォールバック戦略の優先順位', () => {
    it('SmartChunkingが失敗した場合はBabelにフォールバック', async () => {
      // Arrange
      const invalidSyntaxLarge = `
        const x = {
          ${'nested: {'.repeat(1000)}
          value: "deep"
          ${'}}'.repeat(1000)}
        }
      `; // 深くネストした無効な構文
      
      const testFile = path.join(tempDir, 'invalid-large.js');
      await fs.writeFile(testFile, invalidSyntaxLarge);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.BABEL);
      expect(result.metadata.fallbackReason).toContain('SmartChunking failed');
      expect(result.ast).toBeDefined();
    });

    it('戦略の優先順位: TreeSitter → SmartChunking → Babel', async () => {
      // Arrange
      const smallFile = path.join(tempDir, 'small.js');
      const mediumFile = path.join(tempDir, 'medium.js');
      const largeFile = path.join(tempDir, 'large.js');
      
      await fs.writeFile(smallFile, 'const x = 1;'); // < 32KB
      await fs.writeFile(mediumFile, 'x'.repeat(32767)); // = 32KB
      await fs.writeFile(largeFile, 'x'.repeat(40000)); // > 32KB

      // Act
      const smallResult = await parser.parseFile(smallFile);
      const mediumResult = await parser.parseFile(mediumFile);
      const largeResult = await parser.parseFile(largeFile);

      // Assert
      expect(smallResult.metadata.strategy).toBe(ParserStrategy.TREE_SITTER);
      expect(mediumResult.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(largeResult.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
    });
  });

  describe('パフォーマンスとキャッシュ', () => {
    it('チャンク済みASTのキャッシュが効果的', async () => {
      // Arrange
      const content = 'const x = 1;\n'.repeat(3000);
      const testFile = path.join(tempDir, 'cache-test.js');
      await fs.writeFile(testFile, content);

      // Act
      const result1 = await parser.parseFile(testFile);
      const result2 = await parser.parseFile(testFile);

      // Assert
      expect(result1.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result2.metadata.cacheHit).toBe(true);
      expect(result2.metadata.parseTime).toBeLessThan(result1.metadata.parseTime!);
    });

    it('100KB超のファイルでも高速処理', async () => {
      // Arrange
      const hugeContent = 'function test() { return 42; }\n'.repeat(5000); // 100KB+
      const testFile = path.join(tempDir, 'huge.js');
      await fs.writeFile(testFile, hugeContent);

      // Act
      const startTime = Date.now();
      const result = await parser.parseFile(testFile);
      const totalTime = Date.now() - startTime;

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(totalTime).toBeLessThan(2000); // 2秒以内
      expect(result.metadata.nodeCount).toBeGreaterThan(1000);
    });
  });

  describe('TypeScript/JSX対応', () => {
    it('大型TypeScriptファイルのSmartChunking', async () => {
      // Arrange
      const tsContent = `
        interface User {
          id: number;
          name: string;
          email: string;
        }
        
        class UserRepository {
          private users: User[] = [];
          
          async findById(id: number): Promise<User | undefined> {
            return this.users.find(u => u.id === id);
          }
          
          async save(user: User): Promise<void> {
            this.users.push(user);
          }
        }
      `.repeat(150);
      
      const testFile = path.join(tempDir, 'large.ts');
      await fs.writeFile(testFile, tsContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.language).toBe('typescript');
      expect(result.ast).toBeDefined();
    });

    it('大型JSXファイルのSmartChunking', async () => {
      // Arrange
      const jsxContent = `
        const Component = () => {
          return (
            <div className="container">
              <h1>Title</h1>
              <p>Content</p>
              <button onClick={() => console.log('clicked')}>
                Click me
              </button>
            </div>
          );
        };
      `.repeat(150);
      
      const testFile = path.join(tempDir, 'large.jsx');
      await fs.writeFile(testFile, jsxContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.ast).toBeDefined();
    });
  });

  describe('エラーハンドリングとリカバリ', () => {
    it('部分的な構文エラーでも処理継続', async () => {
      // Arrange
      const partialErrorContent = `
        function valid1() { return 1; }
        function invalid() { return 2 // エラー
        function valid2() { return 3; }
      `.repeat(500);
      
      const testFile = path.join(tempDir, 'partial-error.js');
      await fs.writeFile(testFile, partialErrorContent);

      // Act
      const result = await parser.parseFile(testFile);

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(result.metadata.hasErrors).toBe(true);
      expect(result.metadata.recoverable).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.ast.children!.length).toBeGreaterThan(0);
    });

    it('メモリ効率的な処理', async () => {
      // Arrange
      const memoryBefore = process.memoryUsage().heapUsed;
      const largeContent = 'const x = 1;\n'.repeat(10000); // 非常に大きいファイル
      const testFile = path.join(tempDir, 'memory-test.js');
      await fs.writeFile(testFile, largeContent);

      // Act
      const result = await parser.parseFile(testFile);
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = (memoryAfter - memoryBefore) / 1024 / 1024; // MB

      // Assert
      expect(result.metadata.strategy).toBe(ParserStrategy.SMART_CHUNKING);
      expect(memoryIncrease).toBeLessThan(100); // 100MB未満の増加
    });
  });
});