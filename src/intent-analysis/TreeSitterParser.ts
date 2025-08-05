/**
 * Tree-sitter Parser
 * v0.9.0 - 高速構文解析のためのTree-sitterラッパー
 */

import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import * as fs from 'fs/promises';
import * as path from 'path';
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
 * Tree-sitterベースのパーサー（シングルトン実装）
 * YAGNI原則: 必要な時のみインスタンス化
 */
export class TreeSitterParser {
  private static instance: TreeSitterParser;
  private parsers: Map<SupportedLanguage, Parser>;

  private constructor() {
    this.parsers = new Map();
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
   * ファイルを解析してASTを生成
   */
  async parseFile(filePath: string): Promise<ASTNode> {
    const content = await fs.readFile(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);
    return this.parseContent(content, language);
  }

  /**
   * コンテンツを解析してASTを生成
   */
  parseContent(content: string, language: SupportedLanguage): ASTNode {
    const parser = this.parsers.get(language);
    if (!parser) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const tree = parser.parse(content);
    if (!tree || !tree.rootNode) {
      throw new Error(`Failed to parse content for language: ${language}`);
    }
    // ルートノードにはフルテキストを含める
    return this.convertToASTNode(tree.rootNode, true);
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

    const astNode: ASTNode = {
      type: node.type,
      text: includeText || node.type === 'identifier' || node.type === 'call_expression' || node.namedChildCount === 0 ? node.text : '',
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
    for (const node of this.traverseAST(ast)) {
      if (node.type === nodeType) {
        results.push(node);
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

    for (const node of this.traverseAST(ast)) {
      if (node.type === 'call_expression' && node.children) {
        const identifier = node.children.find(child => 
          child.type === 'identifier' && testPatterns.has(child.text)
        );
        if (identifier) {
          results.push(node);
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
    const expectPattern = /^expect\([^)]+\)\.\w+\([^)]*\)$/;
    const assertPattern = /assert\.\w+\(/;

    for (const node of this.traverseAST(ast)) {
      if (node.type === 'call_expression' && node.text) {
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