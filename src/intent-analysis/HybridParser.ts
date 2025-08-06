/**
 * Hybrid Parser
 * v0.9.0 - ハイブリッド・パーサー戦略実装
 * 
 * KISS原則: シンプルな切り替えロジック
 * YAGNI原則: 最小限の機能から開始
 * Defensive Programming: 堅牢なフォールバック戦略
 */

import * as babelParser from '@babel/parser';
import * as t from '@babel/types';
import { TreeSitterParser, SupportedLanguage } from './TreeSitterParser';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * パーサー戦略の種類
 */
export enum ParserStrategy {
  TREE_SITTER = 'tree-sitter',
  BABEL = 'babel',
  HYBRID = 'hybrid'
}

/**
 * パース結果のメタデータ
 */
export interface ParseMetadata {
  strategy: ParserStrategy;
  truncated: boolean;
  originalSize: number;
  parsedSize: number;
  parseTime: number;
  fallbackReason?: string;
  syntaxBoundaries?: {
    functions: number;
    classes: number;
    lastCompleteBoundary?: number;
  };
}

/**
 * パース結果
 */
export interface ParseResult {
  ast: ASTNode;
  metadata: ParseMetadata;
}

/**
 * ハイブリッドパーサー設定
 */
export interface HybridParserConfig {
  /** 32KB制限 - tree-sitterの最大サイズ */
  maxTreeSitterSize?: number;
  /** フォールバック戦略を有効化 */
  enableFallback?: boolean;
  /** スマート切り詰めを有効化 */
  enableSmartTruncation?: boolean;
  /** 警告表示を有効化 */
  enableWarnings?: boolean;
}

/**
 * ハイブリッドパーサー
 * 32KB未満: tree-sitter使用（高速・高精度）
 * 32KB以上: @babel/parserにフォールバック
 */
export class HybridParser {
  private treeSitterParser: TreeSitterParser;
  private config: Required<HybridParserConfig>;
  private parseStats: Map<string, ParseMetadata>;

  constructor(config?: HybridParserConfig) {
    this.treeSitterParser = TreeSitterParser.getInstance();
    this.config = {
      maxTreeSitterSize: config?.maxTreeSitterSize ?? 32767,
      enableFallback: config?.enableFallback ?? true,
      enableSmartTruncation: config?.enableSmartTruncation ?? true,
      enableWarnings: config?.enableWarnings ?? false
    };
    this.parseStats = new Map();
  }

  /**
   * ファイルを解析
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    const startTime = Date.now();
    const content = await fs.readFile(filePath, 'utf-8');
    const originalSize = Buffer.byteLength(content, 'utf-8');

    // ファイルサイズによる戦略選択
    if (originalSize < this.config.maxTreeSitterSize) {
      // tree-sitterを使用
      try {
        const ast = await this.parseWithTreeSitter(content, filePath);
        const metadata: ParseMetadata = {
          strategy: ParserStrategy.TREE_SITTER,
          truncated: false,
          originalSize,
          parsedSize: originalSize,
          parseTime: Date.now() - startTime
        };
        this.parseStats.set(filePath, metadata);
        return { ast, metadata };
      } catch (error: any) {
        if (this.config.enableWarnings) {
          console.warn(`TreeSitter parsing failed for ${filePath}: ${error.message}`);
        }
        // フォールバック
        if (this.config.enableFallback) {
          return this.parseWithBabelFallback(content, filePath, originalSize, startTime, error.message);
        }
        throw error;
      }
    }

    // 32KB以上のファイル
    if (this.config.enableFallback) {
      return this.parseWithBabelFallback(content, filePath, originalSize, startTime, 'File exceeds 32KB limit');
    }

    // スマート切り詰めを試みる
    if (this.config.enableSmartTruncation) {
      return this.parseWithSmartTruncation(content, filePath, originalSize, startTime);
    }

    // 通常の切り詰め
    return this.parseWithTruncation(content, filePath, originalSize, startTime);
  }

  /**
   * tree-sitterでパース
   */
  private async parseWithTreeSitter(content: string, filePath: string): Promise<ASTNode> {
    const language = this.detectLanguage(filePath);
    return this.treeSitterParser.parseContent(content, language);
  }

  /**
   * Babelパーサーでフォールバック
   */
  private async parseWithBabelFallback(
    content: string,
    filePath: string,
    originalSize: number,
    startTime: number,
    fallbackReason: string
  ): Promise<ParseResult> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const isTypeScript = ext === '.ts' || ext === '.tsx';
      const isJSX = ext === '.jsx' || ext === '.tsx';

      // Babelパーサーオプション
      const plugins: babelParser.ParserPlugin[] = [];
      
      if (isTypeScript) {
        plugins.push('typescript');
      }
      if (isJSX) {
        plugins.push('jsx');
      }
      
      // 追加プラグイン
      plugins.push(
        'classProperties',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator'
      );
      
      const parserOptions: babelParser.ParserOptions = {
        sourceType: 'module',
        plugins,
        errorRecovery: true
      };

      // Babelでパース
      const babelAst = babelParser.parse(content, parserOptions);
      
      // BabelのASTをASTNodeに変換
      const ast = this.convertBabelToASTNode(babelAst);

      const metadata: ParseMetadata = {
        strategy: ParserStrategy.BABEL,
        truncated: false,
        originalSize,
        parsedSize: originalSize,
        parseTime: Date.now() - startTime,
        fallbackReason,
        syntaxBoundaries: this.analyzeSyntaxBoundaries(babelAst)
      };

      this.parseStats.set(filePath, metadata);
      return { ast, metadata };
    } catch (error: any) {
      if (this.config.enableWarnings) {
        console.warn(`Babel parsing also failed for ${filePath}: ${error.message}`);
      }
      throw new Error(`Both parsers failed for ${filePath}: ${error.message}`);
    }
  }

  /**
   * スマート切り詰め（関数・クラス境界で切る）
   */
  private async parseWithSmartTruncation(
    content: string,
    filePath: string,
    originalSize: number,
    startTime: number
  ): Promise<ParseResult> {
    // 関数・クラス境界を検出
    const boundaries = this.findSyntaxBoundaries(content);
    
    // 32KB以下の最後の完全な境界を見つける
    let truncatePosition = this.config.maxTreeSitterSize;
    for (const boundary of boundaries.reverse()) {
      if (boundary < this.config.maxTreeSitterSize) {
        truncatePosition = boundary;
        break;
      }
    }

    // 切り詰めて解析
    const truncatedContent = content.substring(0, truncatePosition);
    const ast = await this.parseWithTreeSitter(truncatedContent, filePath);

    const metadata: ParseMetadata = {
      strategy: ParserStrategy.TREE_SITTER,
      truncated: true,
      originalSize,
      parsedSize: truncatePosition,
      parseTime: Date.now() - startTime,
      syntaxBoundaries: {
        functions: boundaries.filter(b => b < truncatePosition).length,
        classes: 0, // TODO: クラス境界も検出
        lastCompleteBoundary: truncatePosition
      }
    };

    this.parseStats.set(filePath, metadata);
    return { ast, metadata };
  }

  /**
   * 通常の切り詰め（行境界）
   */
  private async parseWithTruncation(
    content: string,
    filePath: string,
    originalSize: number,
    startTime: number
  ): Promise<ParseResult> {
    let truncatedContent = content.substring(0, this.config.maxTreeSitterSize);
    const lastNewline = truncatedContent.lastIndexOf('\n');
    if (lastNewline > 0) {
      truncatedContent = truncatedContent.substring(0, lastNewline);
    }

    const ast = await this.parseWithTreeSitter(truncatedContent, filePath);

    const metadata: ParseMetadata = {
      strategy: ParserStrategy.TREE_SITTER,
      truncated: true,
      originalSize,
      parsedSize: truncatedContent.length,
      parseTime: Date.now() - startTime
    };

    this.parseStats.set(filePath, metadata);
    return { ast, metadata };
  }

  /**
   * 構文境界を検出
   */
  private findSyntaxBoundaries(content: string): number[] {
    const boundaries: number[] = [];
    const functionPattern = /^(export\s+)?(async\s+)?function\s+\w+/gm;
    const classPattern = /^(export\s+)?class\s+\w+/gm;
    const arrowFunctionPattern = /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/gm;

    let match;
    
    // 関数境界
    while ((match = functionPattern.exec(content)) !== null) {
      boundaries.push(match.index);
    }
    
    // クラス境界
    while ((match = classPattern.exec(content)) !== null) {
      boundaries.push(match.index);
    }
    
    // アロー関数境界
    while ((match = arrowFunctionPattern.exec(content)) !== null) {
      boundaries.push(match.index);
    }

    return boundaries.sort((a, b) => a - b);
  }

  /**
   * BabelのASTを分析して構文境界情報を取得
   */
  private analyzeSyntaxBoundaries(ast: t.File): { functions: number; classes: number } {
    let functions = 0;
    let classes = 0;

    // traverseの代わりに再帰的にノードを走査
    const walk = (node: t.Node) => {
      if (t.isFunctionDeclaration(node) || 
          t.isFunctionExpression(node) || 
          t.isArrowFunctionExpression(node)) {
        functions++;
      }
      if (t.isClassDeclaration(node) || t.isClassExpression(node)) {
        classes++;
      }
      
      // 子ノードを再帰的に処理
      for (const key in node) {
        const value = (node as any)[key];
        if (value && typeof value === 'object') {
          if (Array.isArray(value)) {
            for (const child of value) {
              if (t.isNode(child)) {
                walk(child);
              }
            }
          } else if (t.isNode(value)) {
            walk(value);
          }
        }
      }
    };
    
    walk(ast);
    return { functions, classes };
  }

  /**
   * BabelのASTをASTNodeに変換
   */
  private convertBabelToASTNode(node: t.Node): ASTNode {
    const astNode: ASTNode = {
      type: node.type,
      text: '', // Babelは全体テキストを持たない
      startPosition: {
        row: node.loc?.start.line ?? 0,
        column: node.loc?.start.column ?? 0
      },
      endPosition: {
        row: node.loc?.end.line ?? 0,
        column: node.loc?.end.column ?? 0
      },
      isNamed: true
    };

    // 識別子の場合はテキストを設定
    if (t.isIdentifier(node)) {
      astNode.text = node.name;
    }

    // 子ノードを処理
    const children: ASTNode[] = [];
    for (const key in node) {
      const value = (node as any)[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const child of value) {
            if (t.isNode(child)) {
              children.push(this.convertBabelToASTNode(child));
            }
          }
        } else if (t.isNode(value)) {
          children.push(this.convertBabelToASTNode(value));
        }
      }
    }

    if (children.length > 0) {
      astNode.children = children;
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
   * パース統計を取得
   */
  getParseStats(): Map<string, ParseMetadata> {
    return new Map(this.parseStats);
  }

  /**
   * 統計サマリーを取得
   */
  getStatsSummary(): {
    totalFiles: number;
    treeSitterCount: number;
    babelCount: number;
    truncatedCount: number;
    averageParseTime: number;
  } {
    const stats = Array.from(this.parseStats.values());
    const treeSitterCount = stats.filter(s => s.strategy === ParserStrategy.TREE_SITTER).length;
    const babelCount = stats.filter(s => s.strategy === ParserStrategy.BABEL).length;
    const truncatedCount = stats.filter(s => s.truncated).length;
    const averageParseTime = stats.reduce((sum, s) => sum + s.parseTime, 0) / (stats.length || 1);

    return {
      totalFiles: stats.length,
      treeSitterCount,
      babelCount,
      truncatedCount,
      averageParseTime
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.treeSitterParser.clearCache();
    this.parseStats.clear();
  }
}