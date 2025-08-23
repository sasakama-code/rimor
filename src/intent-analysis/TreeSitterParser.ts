/**
 * Tree-sitter Parser
 * v0.9.0 - 高速構文解析のためのTree-sitterラッパー
 */

import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';

/**
 * サポートされる言語
 */
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  TSX = 'tsx',
  JSX = 'jsx'
}

/**
 * キャッシュエントリ
 * KISS原則: シンプルなキャッシュ構造
 */
interface CacheEntry {
  ast: ASTNode;
  contentHash: string;
  timestamp: number;
}

/**
 * Tree-sitterベースのパーサー（シングルトン実装）
 * YAGNI原則: 必要な時のみインスタンス化
 */
export class TreeSitterParser {
  private static instance: TreeSitterParser;
  private parsers: Map<SupportedLanguage, Parser>;
  private cache: Map<string, CacheEntry>;
  private maxCacheSize: number = 100; // 最大キャッシュサイズ
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  private constructor() {
    this.parsers = new Map();
    this.cache = new Map();
    this.initializeParsers();
  }

  /**
   * シングルトンインスタンスの取得
   */
  static getInstance(): TreeSitterParser {
    if (!TreeSitterParser.instance) {
      TreeSitterParser.instance = new TreeSitterParser();
    }
    return TreeSitterParser.instance;
  }

  /**
   * パーサーの初期化
   */
  private initializeParsers(): void {
    // JavaScriptパーサー
    const jsParser = new Parser();
    jsParser.setLanguage(JavaScript);
    this.parsers.set(SupportedLanguage.JAVASCRIPT, jsParser);
    this.parsers.set(SupportedLanguage.JSX, jsParser);

    // TypeScriptパーサー（エラーハンドリング付き）
    try {
      const TypeScript = require('tree-sitter-typescript');
      const tsParser = new Parser();
      tsParser.setLanguage(TypeScript.typescript);
      this.parsers.set(SupportedLanguage.TYPESCRIPT, tsParser);

      // TSXパーサー
      const tsxParser = new Parser();
      tsxParser.setLanguage(TypeScript.tsx);
      this.parsers.set(SupportedLanguage.TSX, tsxParser);
    } catch (error) {
      console.warn('TypeScript parser initialization failed:', error);
      // TypeScriptパーサーが利用できない場合は、JavaScriptパーサーで代用
      this.parsers.set(SupportedLanguage.TYPESCRIPT, jsParser);
      this.parsers.set(SupportedLanguage.TSX, jsParser);
    }
  }

  /**
   * ファイルを解析してASTを生成（キャッシュ対応）
   * DRY原則: キャッシュロジックの一元化
   */
  async parseFile(filePath: string): Promise<ASTNode> {
    // ファイルの統計情報を取得
    const stats = await fs.stat(filePath);
    const cacheKey = filePath;
    
    // キャッシュをチェック
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && cachedEntry.timestamp === stats.mtimeMs) {
      this.cacheHits++;
      return cachedEntry.ast;
    }
    
    // キャッシュミス - ファイルを読み込んで解析
    this.cacheMisses++;
    const content = await fs.readFile(filePath, 'utf-8');
    const contentHash = this.calculateHash(content);
    
    // 既存のキャッシュエントリのハッシュをチェック
    if (cachedEntry && cachedEntry.contentHash === contentHash) {
      // 内容は同じだがタイムスタンプが異なる場合、タイムスタンプのみ更新
      cachedEntry.timestamp = stats.mtimeMs;
      this.cacheHits++;
      return cachedEntry.ast;
    }
    
    // 新規パース
    const language = this.detectLanguage(filePath);
    const ast = this.parseContent(content, language);
    
    // キャッシュに保存
    this.addToCache(cacheKey, {
      ast,
      contentHash,
      timestamp: stats.mtimeMs
    });
    
    return ast;
  }

  /**
   * コンテンツのハッシュ値を計算
   * KISS原則: シンプルなハッシュ計算
   */
  private calculateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * キャッシュに追加（LRU方式）
   * Defensive Programming: キャッシュサイズの制限
   */
  private addToCache(key: string, entry: CacheEntry): void {
    // キャッシュサイズが上限に達した場合、最も古いエントリを削除
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    // 新しいエントリを追加（既存の場合は更新）
    this.cache.delete(key); // 順序を更新するため一旦削除
    this.cache.set(key, entry);
  }

  /**
   * キャッシュ統計を取得
   * YAGNI原則: 必要最小限の統計情報
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * フォールバックパーサーで解析
   */
  private parseWithFallback(content: string, parser: Parser): ASTNode {
    try {
      const tree = parser.parse(content);
      if (tree && tree.rootNode) {
        return this.convertToASTNode(tree.rootNode, true);
      }
    } catch (error) {
      console.warn('Fallback parser also failed:', error);
    }
    
    // 最終フォールバック: 空のASTを返す
    return {
      type: 'program',
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      children: [],
      text: content.substring(0, 100), // 最初の100文字だけ保持
      isNamed: true // isNamedプロパティを必ず含める
    };
  }

  /**
   * コンテンツを解析してASTを生成
   * Defensive Programming: 32KB制限の対応
   */
  parseContent(content: string, language: SupportedLanguage): ASTNode {
    const parser = this.parsers.get(language);
    if (!parser) {
      // フォールバック: 未対応言語の場合はJavaScriptパーサーを使用
      const jsParser = this.parsers.get(SupportedLanguage.JAVASCRIPT);
      if (!jsParser) {
        throw new Error(`Parser initialization failed`);
      }
      console.warn(`Unsupported language: ${language}, falling back to JavaScript parser`);
      return this.parseWithFallback(content, jsParser);
    }

    // tree-sitter の32KB制限をチェック（32767バイトまで）
    const MAX_CONTENT_SIZE = 32767;
    let parseContent = content;
    let isTruncated = false;
    
    if (content.length >= MAX_CONTENT_SIZE) {
      // 32KB以下に切り詰める（最後の完全な行まで）
      parseContent = content.substring(0, MAX_CONTENT_SIZE);
      const lastNewline = parseContent.lastIndexOf('\n');
      if (lastNewline > 0) {
        parseContent = parseContent.substring(0, lastNewline);
      }
      isTruncated = true;
    }

    let tree;
    try {
      tree = parser.parse(parseContent);
    } catch (parseError) {
      console.warn(`Parse error for ${language}:`, parseError);
      // パースエラーの場合はフォールバック
      const jsParser = this.parsers.get(SupportedLanguage.JAVASCRIPT);
      if (jsParser) {
        return this.parseWithFallback(parseContent, jsParser);
      }
      throw new Error(`Failed to parse content for language: ${language}`);
    }

    if (!tree || !tree.rootNode) {
      // tree がnullの場合もフォールバック
      const jsParser = this.parsers.get(SupportedLanguage.JAVASCRIPT);
      if (jsParser) {
        return this.parseWithFallback(parseContent, jsParser);
      }
      throw new Error(`Failed to parse content for language: ${language}`);
    }
    
    // ルートノードにはフルテキストを含める（切り詰められた場合は部分的）
    const astNode = this.convertToASTNode(tree.rootNode, true);
    
    // 切り詰められた場合はメタデータに記録
    if (isTruncated) {
      (astNode as any)._truncated = true;
      (astNode as any)._originalLength = content.length;
    }
    
    return astNode;
  }

  /**
   * ファイル拡張子から言語を検出
   */
  private detectLanguage(filePath: string): SupportedLanguage {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.js':
        return SupportedLanguage.JAVASCRIPT;
      case '.jsx':
        return SupportedLanguage.JSX;
      case '.ts':
        return SupportedLanguage.TYPESCRIPT;
      case '.tsx':
        return SupportedLanguage.TSX;
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Tree-sitterのノードをASTNodeに変換（最適化版）
   * KISS原則: 必要最小限の情報のみコピー
   */
  private convertToASTNode(node: Parser.SyntaxNode, includeText: boolean = false): ASTNode {
    if (!node) {
      throw new Error('Cannot convert null or undefined node to ASTNode');
    }

    // 重要なノードタイプは常にテキストを含める
    const importantTypes = ['identifier', 'call_expression', 'function_declaration', 
                           'class_declaration', 'method_definition', 'arrow_function'];
    const shouldIncludeText = includeText || 
                             importantTypes.includes(node.type) || 
                             node.namedChildCount === 0 ||
                             node.text.length < 200; // 小さいノードはテキストを含める

    const astNode: ASTNode = {
      type: node.type,
      text: shouldIncludeText ? node.text : '',
      startPosition: {
        row: node.startPosition.row,
        column: node.startPosition.column
      },
      endPosition: {
        row: node.endPosition.row,
        column: node.endPosition.column
      },
      isNamed: node.isNamed
    };

    // 名前付き子ノードのみを処理（パフォーマンス最適化）
    if (node.namedChildCount > 0) {
      astNode.children = [];
      for (let i = 0; i < node.namedChildCount; i++) {
        const child = node.namedChild(i);
        if (child) {
          // 子ノードも重要な情報を保持
          astNode.children.push(this.convertToASTNode(child, false));
        }
      }
    }

    return astNode;
  }

  /**
   * ASTを効率的にトラバース（ジェネレーター版）
   * DRY原則: 共通のトラバース処理
   */
  private *traverseAST(node: ASTNode): Generator<ASTNode> {
    yield node;
    if (node.children) {
      for (const child of node.children) {
        yield* this.traverseAST(child);
      }
    }
  }

  /**
   * 特定のノードタイプを検索（最適化版）
   */
  findNodes(ast: ASTNode, nodeType: string): ASTNode[] {
    const results: ASTNode[] = [];
    
    // nodeTypeに基づくフォールバック検索も追加
    for (const node of this.traverseAST(ast)) {
      if (node.type === nodeType) {
        results.push(node);
      } else if (nodeType === 'function_declaration' && node.text) {
        // function宣言のテキストベース検索
        if (node.text.includes('function ') && node.text.includes('(')) {
          results.push(node);
        }
      }
    }
    return results;
  }

  /**
   * テスト関数を検索（最適化版）
   */
  findTestFunctions(ast: ASTNode): ASTNode[] {
    const testPatterns = new Set(['test', 'it', 'describe', 'suite', 'context']);
    const results: ASTNode[] = [];

    // テキストベースのフォールバック検索も追加
    for (const node of this.traverseAST(ast)) {
      if (node.type === 'call_expression') {
        // 子ノードベースの検索
        if (node.children) {
          const identifier = node.children.find(child => 
            child.type === 'identifier' && testPatterns.has(child.text)
          );
          if (identifier) {
            results.push(node);
            continue;
          }
        }
        
        // テキストベースの検索（フォールバック）
        if (node.text) {
          for (const pattern of testPatterns) {
            if (node.text.startsWith(`${pattern}(`) || node.text.includes(`${pattern}(`)) {
              results.push(node);
              break;
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * アサーションを検索（最適化版）
   * KISS原則: シンプルなパターンマッチング
   */
  findAssertions(ast: ASTNode): ASTNode[] {
    const results: ASTNode[] = [];
    const seenAssertions = new Set<string>();
    
    // 正規表現をプリコンパイル（パフォーマンス最適化）
    const expectPattern = /expect\([^)]*\)/;
    const assertPattern = /assert\.\w+\(/;

    for (const node of this.traverseAST(ast)) {
      // call_expressionノードまたはテキストにexpect/assertを含むノード
      if (node.text) {
        // より緩い条件でマッチング
        if ((expectPattern.test(node.text) || assertPattern.test(node.text)) && 
            !seenAssertions.has(node.text)) {
          seenAssertions.add(node.text);
          results.push(node);
        }
      }
    }

    return results;
  }
}