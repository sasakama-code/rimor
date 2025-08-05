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
 * Tree-sitterベースのパーサー
 */
export class TreeSitterParser {
  private parsers: Map<SupportedLanguage, Parser>;

  constructor() {
    this.parsers = new Map();
    this.initializeParsers();
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
    return this.convertToASTNode(tree.rootNode);
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

    if (node.children.length > 0) {
      astNode.children = node.children.map(child => this.convertToASTNode(child));
    }

    return astNode;
  }

  /**
   * 特定のノードタイプを検索
   */
  findNodes(ast: ASTNode, nodeType: string): ASTNode[] {
    const results: ASTNode[] = [];
    
    const traverse = (node: ASTNode): void => {
      if (node.type === nodeType) {
        results.push(node);
      }
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };

    traverse(ast);
    return results;
  }

  /**
   * テスト関数を検索
   */
  findTestFunctions(ast: ASTNode): ASTNode[] {
    const testPatterns = ['test', 'it', 'describe', 'suite', 'context'];
    const results: ASTNode[] = [];

    const traverse = (node: ASTNode): void => {
      if (node.type === 'call_expression' && node.children) {
        const identifier = node.children.find(child => 
          child.type === 'identifier' && testPatterns.includes(child.text)
        );
        if (identifier) {
          results.push(node);
        }
      }
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };

    traverse(ast);
    return results;
  }

  /**
   * アサーションを検索
   * KISS原則: シンプルなパターンマッチング
   */
  findAssertions(ast: ASTNode): ASTNode[] {
    const results: ASTNode[] = [];
    const seenAssertions = new Set<string>();

    const traverse = (node: ASTNode): void => {
      // expect(xxx).toBe() のような完全なアサーションチェーンを検出
      if (node.type === 'call_expression' && node.text) {
        if (node.text.match(/^expect\([^)]+\)\.\w+\([^)]*\)$/)) {
          // 重複を避ける
          if (!seenAssertions.has(node.text)) {
            seenAssertions.add(node.text);
            results.push(node);
          }
        }
        // assert.xxx() パターン
        else if (node.text.match(/assert\.\w+\(/)) {
          if (!seenAssertions.has(node.text)) {
            seenAssertions.add(node.text);
            results.push(node);
          }
        }
      }
      
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };

    traverse(ast);
    return results;
  }
}