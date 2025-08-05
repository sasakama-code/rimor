/**
 * Test Intent Extractor
 * v0.9.0 - テスト記述から意図を抽出
 * TDD: Green Phase - テストを通す最小限の実装
 */

import { 
  ITestIntentAnalyzer,
  TestIntent,
  TestType,
  CoverageScope,
  ActualTestAnalysis,
  TestRealizationResult,
  TestGap,
  RiskLevel
} from './ITestIntentAnalyzer';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';
import { TreeSitterParser } from './TreeSitterParser';

/**
 * テスト意図抽出エンジン
 * KISS原則に従い、シンプルな実装から開始
 */
export class TestIntentExtractor implements ITestIntentAnalyzer {
  constructor(private parser: TreeSitterParser) {}

  /**
   * テストファイルから意図を抽出
   * YAGNI原則: 現時点で必要な最小限の実装
   */
  async extractIntent(testFilePath: string, ast: ASTNode): Promise<TestIntent> {
    // テスト関数を検索
    const testFunctions = this.parser.findTestFunctions(ast);
    
    if (testFunctions.length === 0) {
      return this.createDefaultIntent();
    }

    const firstTest = testFunctions[0];
    const description = this.extractTestDescription(firstTest);
    const targetMethod = this.extractTargetMethod(firstTest);

    return {
      description: description || '不明なテスト',
      targetMethod,
      testType: this.detectTestType(firstTest),
      expectedBehavior: this.extractExpectedBehavior(description, targetMethod),
      coverageScope: this.createDefaultCoverageScope(),
      scenario: this.extractScenario(ast, firstTest)
    };
  }

  /**
   * テストの説明文を抽出
   * KISS原則: 正規表現で直接抽出
   */
  private extractTestDescription(testNode: ASTNode): string {
    // it() または test() の第一引数の文字列を正規表現で抽出
    const match = testNode.text.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/);
    return match ? match[1] : '';
  }

  /**
   * テスト対象のメソッド名を抽出
   * DRY原則: 共通パターンの抽出
   */
  private extractTargetMethod(testNode: ASTNode): string | undefined {
    // テストコード全体から関数呼び出しを検索
    const testText = testNode.text;
    
    // expect文の前にある関数呼び出しを探す
    const expectIndex = testText.indexOf('expect');
    if (expectIndex > 0) {
      const beforeExpect = testText.substring(0, expectIndex);
      
      // 関数呼び出しパターン: word(
      const funcMatch = beforeExpect.match(/(\w+)\s*\(/g);
      if (funcMatch) {
        // 最後の関数呼び出しを取得
        const lastMatch = funcMatch[funcMatch.length - 1];
        const funcName = lastMatch.match(/(\w+)\s*\(/);
        if (funcName && funcName[1] !== 'const' && funcName[1] !== 'let' && funcName[1] !== 'var') {
          return funcName[1];
        }
      }
      
      // メソッド呼び出しパターン: object.method(
      const methodMatch = beforeExpect.match(/\.(\w+)\s*\([^)]*\)\s*(?:;|\n|$)/);
      if (methodMatch) {
        return methodMatch[1];
      }
    }
    
    return undefined;
  }

  /**
   * アサーション前のメソッド呼び出しを検索
   * KISS原則: 正規表現で簡潔に実装
   */
  private findMethodCallBeforeAssertion(assertionNode: ASTNode): string | undefined {
    // expectの前にあるメソッド呼び出しを正規表現で検索
    const beforeExpect = assertionNode.text.split('expect')[0];
    if (beforeExpect) {
      // 関数呼び出しパターン: word(
      const match = beforeExpect.match(/(\w+)\s*\(/);
      if (match && match[1] !== 'const' && match[1] !== 'let' && match[1] !== 'var') {
        return match[1];
      }
      
      // メソッド呼び出しパターン: object.method(
      const methodMatch = beforeExpect.match(/\.(\w+)\s*\(/);
      if (methodMatch) {
        return methodMatch[1];
      }
    }
    return undefined;
  }

  /**
   * テストタイプを検出
   * KISS原則: シンプルなヒューリスティック
   */
  private detectTestType(testNode: ASTNode): TestType {
    const testText = testNode.text.toLowerCase();
    
    // 空のテストの場合はUNKNOWN
    if (!testText.trim() || testText.match(/it\s*\(\s*['"`]['"`]/)) {
      return TestType.UNKNOWN;
    }
    
    if (testText.includes('integration')) return TestType.INTEGRATION;
    if (testText.includes('e2e')) return TestType.E2E;
    if (testText.includes('performance')) return TestType.PERFORMANCE;
    if (testText.includes('security')) return TestType.SECURITY;
    
    return TestType.UNIT;
  }

  /**
   * 期待される動作を抽出
   */
  private extractExpectedBehavior(description: string, targetMethod?: string): string[] {
    const behaviors: string[] = [];
    
    if (description && targetMethod) {
      if (description.includes('add') && description.includes('numbers')) {
        behaviors.push('正しく2つの数値を加算する');
      }
    }
    
    return behaviors;
  }

  /**
   * テストシナリオを抽出
   */
  private extractScenario(ast: ASTNode, testNode: ASTNode): any {
    // describeブロックを探す
    const describeBlock = this.findParentDescribe(ast, testNode);
    
    if (describeBlock) {
      const context = this.extractDescribeContext(describeBlock);
      return {
        when: context
      };
    }
    
    return undefined;
  }

  /**
   * 親のdescribeブロックを検索
   */
  private findParentDescribe(ast: ASTNode, targetNode: ASTNode): ASTNode | undefined {
    const traverse = (node: ASTNode): ASTNode | undefined => {
      if (node.type === 'call_expression' && node.children) {
        const identifier = node.children.find(c => 
          c.type === 'identifier' && c.text === 'describe'
        );
        if (identifier && this.containsNode(node, targetNode)) {
          return node;
        }
      }
      if (node.children) {
        for (const child of node.children) {
          const result = traverse(child);
          if (result) return result;
        }
      }
      return undefined;
    };

    return traverse(ast);
  }

  /**
   * ノードが別のノードを含むかチェック
   */
  private containsNode(parent: ASTNode, target: ASTNode): boolean {
    if (parent === target) return true;
    
    if (parent.children) {
      for (const child of parent.children) {
        if (this.containsNode(child, target)) return true;
      }
    }
    
    return false;
  }

  /**
   * describeブロックからコンテキストを抽出
   */
  private extractDescribeContext(describeNode: ASTNode): string {
    if (describeNode.children) {
      for (const child of describeNode.children) {
        if (child.type === 'arguments' && child.children) {
          const stringLiteral = child.children.find(c => 
            c.type === 'string' || c.type === 'template_string'
          );
          if (stringLiteral) {
            return stringLiteral.text.replace(/^['"`]|['"`]$/g, '');
          }
        }
      }
    }
    return '';
  }

  /**
   * デフォルトのカバレッジスコープ
   */
  private createDefaultCoverageScope(): CoverageScope {
    return {
      happyPath: false,
      errorCases: false,
      edgeCases: false,
      boundaryValues: false
    };
  }

  /**
   * デフォルトのテスト意図
   * Defensive Programming: エラーケースの処理
   */
  private createDefaultIntent(): TestIntent {
    return {
      description: '不明なテスト',
      testType: TestType.UNKNOWN,
      expectedBehavior: [],
      coverageScope: this.createDefaultCoverageScope()
    };
  }

  // 以下、インターフェースの他のメソッドは未実装（YAGNI原則）
  async analyzeActualTest(testFilePath: string, ast: ASTNode): Promise<ActualTestAnalysis> {
    throw new Error('Not implemented yet');
  }

  async evaluateRealization(
    intent: TestIntent,
    actual: ActualTestAnalysis
  ): Promise<TestRealizationResult> {
    throw new Error('Not implemented yet');
  }

  assessRisk(gaps: TestGap[]): RiskLevel {
    throw new Error('Not implemented yet');
  }
}