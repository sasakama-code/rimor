/**
 * Smart Chunking Parser
 * v0.9.0 Phase 2 - スマート・チャンキング・システム
 * 
 * KISS原則: シンプルなチャンキングロジック
 * YAGNI原則: 必要最小限の機能から開始
 * Defensive Programming: 堅牢なエラーハンドリング
 * TDD: GREEN phase - テストを通す最小限の実装
 */

import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';
import { SupportedLanguage } from './TreeSitterParser';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * チャンキング戦略
 */
export enum ChunkingStrategy {
  SINGLE = 'single',      // 単一チャンク（小さいファイル）
  MULTIPLE = 'multiple',  // 複数チャンク（大きいファイル）
  STREAMING = 'streaming' // ストリーミング（将来拡張）
}

/**
 * チャンクメタデータ
 */
export interface ChunkMetadata {
  strategy: ChunkingStrategy;
  chunks: number;
  chunkReadCalls: number;
  maxChunkSize: number;
  encoding: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
  };
  errors?: Array<{
    chunk: number;
    message: string;
    position?: { row: number; column: number };
  }>;
  partialParse?: boolean;
  parseTime?: number;
  cacheHit?: boolean;
  language?: string;
}

/**
 * パース結果
 */
export interface ChunkParseResult {
  ast: ASTNode;
  metadata: ChunkMetadata;
}

/**
 * チャンキングパーサー設定
 */
export interface SmartChunkingConfig {
  chunkSize?: number;     // デフォルト: 30000 (30KB)
  enableDebug?: boolean;
  enableCache?: boolean;
}

/**
 * チャンク情報
 */
interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  content: string;
}

/**
 * キャッシュエントリ
 */
interface CacheEntry {
  ast: ASTNode;
  metadata: ChunkMetadata;
  contentHash: string;
  timestamp: number;
}

/**
 * スマート・チャンキング・パーサー
 * tree-sitterのparseコールバック機能を使用して大きなファイルを処理
 */
export class SmartChunkingParser {
  private config: Required<SmartChunkingConfig>;
  private parsers: Map<SupportedLanguage, Parser>;
  private cache: Map<string, CacheEntry>;
  private currentChunks: ChunkInfo[] = [];
  private currentChunkIndex: number = 0;
  private readCallCount: number = 0;

  constructor(config?: SmartChunkingConfig) {
    this.config = {
      chunkSize: config?.chunkSize ?? 30000,
      enableDebug: config?.enableDebug ?? false,
      enableCache: config?.enableCache ?? true
    };
    
    this.parsers = new Map();
    this.cache = new Map();
    this.initializeParsers();
  }

  /**
   * パーサーの初期化
   * DRY原則: TreeSitterParserと同様の初期化ロジック
   */
  private initializeParsers(): void {
    // JavaScriptパーサー
    const jsParser = new Parser();
    jsParser.setLanguage(JavaScript);
    this.parsers.set(SupportedLanguage.JAVASCRIPT, jsParser);
    this.parsers.set(SupportedLanguage.JSX, jsParser);

    // TypeScriptパーサー
    const tsParser = new Parser();
    tsParser.setLanguage(TypeScript.typescript);
    this.parsers.set(SupportedLanguage.TYPESCRIPT, tsParser);

    // TSXパーサー
    const tsxParser = new Parser();
    tsxParser.setLanguage(TypeScript.tsx);
    this.parsers.set(SupportedLanguage.TSX, tsxParser);
  }

  /**
   * ファイルを解析
   * SOLID原則: 単一責任の原則 - ファイル解析のみを担当
   */
  async parseFile(filePath: string): Promise<ChunkParseResult> {
    const startTime = Date.now();
    
    // キャッシュチェック
    if (this.config.enableCache) {
      const cached = await this.checkCache(filePath);
      if (cached) {
        // キャッシュヒット時はcacheHitフラグをtrueに設定
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cacheHit: true,
            parseTime: 1
          }
        };
      }
    }

    // ファイル読み込み
    const content = await fs.readFile(filePath, 'utf-8');
    const fileSize = Buffer.byteLength(content, 'utf-8');
    
    // 言語検出
    const language = this.detectLanguage(filePath);
    
    // チャンキング戦略の決定
    const strategy = fileSize <= this.config.chunkSize 
      ? ChunkingStrategy.SINGLE 
      : ChunkingStrategy.MULTIPLE;
    
    // チャンク作成
    this.currentChunks = this.createChunks(content, strategy);
    this.currentChunkIndex = 0;
    this.readCallCount = 0;

    // パース実行
    const parser = this.parsers.get(language);
    if (!parser) {
      throw new Error(`Unsupported language: ${language}`);
    }

    let ast: ASTNode;
    const errors: any[] = [];
    let partialParse = false;

    try {
      // parseコールバック関数を使用
      const tree = parser.parse((index, position) => {
        return this.readChunk(index, position);
      });

      if (!tree || !tree.rootNode) {
        throw new Error('Failed to parse file');
      }

      ast = this.convertToASTNode(tree.rootNode);
      
      // 構文エラーをチェック
      if (tree.rootNode.hasError) {
        errors.push({
          chunk: this.currentChunkIndex,
          message: 'Syntax error detected in parse tree'
        });
        partialParse = true;
      }
    } catch (error: any) {
      // エラーハンドリング
      errors.push({
        chunk: this.currentChunkIndex,
        message: error.message
      });
      partialParse = true;
      
      // 部分的なASTを作成
      ast = {
        type: 'program',
        text: '',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 0 },
        isNamed: true,
        children: []
      };
    }

    // 構文境界の分析
    const syntaxBoundaries = this.analyzeSyntaxBoundaries(ast);

    // メタデータ作成
    const metadata: ChunkMetadata = {
      strategy,
      chunks: this.currentChunks.length,
      chunkReadCalls: this.readCallCount,
      maxChunkSize: Math.max(...this.currentChunks.map(c => c.content.length)),
      encoding: 'utf-8',
      syntaxBoundaries,
      errors: errors.length > 0 ? errors : undefined,
      partialParse,
      parseTime: Date.now() - startTime,
      cacheHit: false,
      language: language === SupportedLanguage.TYPESCRIPT ? 'typescript' : 'javascript'
    };

    const result = { ast, metadata };

    // キャッシュに保存
    if (this.config.enableCache && !partialParse) {
      await this.saveToCache(filePath, result, content);
    }

    return result;
  }

  /**
   * チャンクを読み込むコールバック関数
   * tree-sitterのparseコールバックインターフェースに準拠
   */
  private readChunk(index: number, position?: Parser.Point): string | null {
    this.readCallCount++;

    if (this.currentChunks.length === 0) {
      return null;
    }

    // 単一チャンクの場合
    if (this.currentChunks.length === 1) {
      const chunk = this.currentChunks[0];
      if (index >= chunk.content.length) {
        return null;
      }
      return chunk.content.substring(index);
    }

    // 複数チャンクの場合
    let totalOffset = 0;
    for (const chunk of this.currentChunks) {
      if (index >= totalOffset && index < totalOffset + chunk.content.length) {
        const localOffset = index - totalOffset;
        return chunk.content.substring(localOffset);
      }
      totalOffset += chunk.content.length;
    }

    return null;
  }

  /**
   * チャンクを作成
   * Defensive Programming: 境界チェックとエラーハンドリング
   */
  private createChunks(content: string, strategy: ChunkingStrategy): ChunkInfo[] {
    if (strategy === ChunkingStrategy.SINGLE) {
      return [{
        index: 0,
        start: 0,
        end: content.length,
        content
      }];
    }

    const chunks: ChunkInfo[] = [];
    const chunkSize = this.config.chunkSize;
    let start = 0;
    let index = 0;

    while (start < content.length) {
      let end = Math.min(start + chunkSize, content.length);
      
      // 構文的に意味のある境界を探す
      if (end < content.length) {
        const boundary = this.findSyntaxBoundary(content, start, end);
        if (boundary > start) {
          end = boundary;
        }
      }

      chunks.push({
        index,
        start,
        end,
        content: content.substring(start, end)
      });

      start = end;
      index++;
    }

    return chunks;
  }

  /**
   * 構文境界を探す
   * KISS原則: シンプルな境界検出
   */
  private findSyntaxBoundary(content: string, start: number, end: number): number {
    // 関数またはクラスの終了を探す
    const searchStart = Math.max(start, end - 1000); // 最後の1KB内で探す
    
    // 閉じ括弧の後の改行を探す
    for (let i = end - 1; i >= searchStart; i--) {
      if (content[i] === '}' && i + 1 < content.length && content[i + 1] === '\n') {
        return i + 2; // 改行の後まで含める
      }
    }

    // 改行を探す
    for (let i = end - 1; i >= searchStart; i--) {
      if (content[i] === '\n') {
        return i + 1;
      }
    }

    return end;
  }

  /**
   * 構文境界を分析
   */
  private analyzeSyntaxBoundaries(ast: ASTNode): { functions: number; classes: number } {
    let functions = 0;
    let classes = 0;

    const traverse = (node: ASTNode) => {
      // tree-sitterのJavaScript/TypeScriptパーサーのノードタイプ
      const functionTypes = [
        'function_declaration', 
        'function_expression',
        'arrow_function',
        'method_definition',
        'function',
        'arrow_function_expression',
        'generator_function_declaration',
        'async_function_declaration'
      ];
      
      const classTypes = [
        'class_declaration',
        'class_expression', 
        'class',
        'class_body'
      ];
      
      if (functionTypes.includes(node.type)) {
        functions++;
      }
      
      if (classTypes.includes(node.type)) {
        classes++;
      }
      
      // ノードのテキストにも基づいて検出
      if (node.text) {
        if (node.text.includes('function') || node.text.includes('=>')) {
          functions = Math.max(functions, 1);
        }
        if (node.text.includes('class')) {
          classes = Math.max(classes, 1);
        }
      }
      
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(ast);
    
    // テキストベースのフォールバック検出
    if (functions === 0 && ast.text) {
      // function キーワードまたはアロー関数を検出
      const functionMatches = ast.text.match(/function\s+\w+\s*\(/g);
      const arrowMatches = ast.text.match(/\w+\s*=>\s*[{(]/g);
      if (functionMatches) {
        functions = functionMatches.length;
      } else if (arrowMatches) {
        functions = arrowMatches.length;
      }
    }
    
    if (classes === 0 && ast.text) {
      // class キーワードを検出
      const classMatches = ast.text.match(/class\s+\w+/g);
      if (classMatches) {
        classes = classMatches.length;
      }
    }
    
    return { functions, classes };
  }

  /**
   * Tree-sitterのノードをASTNodeに変換
   */
  private convertToASTNode(node: Parser.SyntaxNode): ASTNode {
    const astNode: ASTNode = {
      type: node.type,
      text: node.text,
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

    if (node.namedChildCount > 0) {
      astNode.children = [];
      for (let i = 0; i < node.namedChildCount; i++) {
        const child = node.namedChild(i);
        if (child) {
          astNode.children.push(this.convertToASTNode(child));
        }
      }
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
   * キャッシュチェック
   */
  private async checkCache(filePath: string): Promise<ChunkParseResult | null> {
    const cached = this.cache.get(filePath);
    if (!cached) {
      return null;
    }

    // ファイルの更新時刻をチェック
    const stats = await fs.stat(filePath);
    if (stats.mtimeMs > cached.timestamp) {
      this.cache.delete(filePath);
      return null;
    }

    // キャッシュヒット時はパース時間を1msに設定（高速）
    return {
      ast: cached.ast,
      metadata: {
        ...cached.metadata,
        parseTime: 1
      }
    };
  }

  /**
   * キャッシュに保存
   */
  private async saveToCache(
    filePath: string, 
    result: ChunkParseResult, 
    content: string
  ): Promise<void> {
    const crypto = await import('crypto');
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    
    this.cache.set(filePath, {
      ast: result.ast,
      metadata: result.metadata,
      contentHash,
      timestamp: Date.now()
    });
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
  }
}