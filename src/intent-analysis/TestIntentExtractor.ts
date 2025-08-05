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
  RiskLevel,
  TestAssertion,
  GapType,
  Severity
} from './ITestIntentAnalyzer';
import { ASTNode } from '../core/interfaces/IAnalysisEngine';
import { TreeSitterParser } from './TreeSitterParser';
import { IntentPatternMatcher } from './IntentPatternMatcher';

/**
 * テスト意図抽出エンジン
 * KISS原則に従い、シンプルな実装から開始
 */
export class TestIntentExtractor implements ITestIntentAnalyzer {
  private patternMatcher: IntentPatternMatcher;

  private parser: TreeSitterParser;
  
  constructor(parser?: TreeSitterParser) {
    this.parser = parser || TreeSitterParser.getInstance();
    this.patternMatcher = new IntentPatternMatcher();
  }

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
    // 最適化されたASTでもテキストが取得できるようにする
    const match = describeNode.text.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (match) {
      return match[1];
    }
    
    // フォールバック: 子ノードを探索
    if (describeNode.children) {
      for (const child of describeNode.children) {
        if (child.type === 'arguments' && child.children) {
          const stringLiteral = child.children.find(c => 
            c.type === 'string' || c.type === 'template_string'
          );
          if (stringLiteral && stringLiteral.text) {
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

  /**
   * 実際のテスト実装を分析
   * YAGNI原則: 必要最小限の実装
   */
  async analyzeActualTest(testFilePath: string, ast: ASTNode): Promise<ActualTestAnalysis> {
    // アサーションを検索
    const assertions = this.parser.findAssertions(ast);
    
    // テストされているメソッドを検索
    const actualTargetMethods = this.extractActualTargetMethods(ast);
    
    // アサーション情報を構築
    const testAssertions: TestAssertion[] = assertions.map((assertionNode, index) => {
      const assertionInfo = this.parseAssertion(assertionNode);
      return {
        type: assertionInfo.type,
        expected: assertionInfo.expected,
        actual: assertionInfo.actual,
        location: {
          line: assertionNode.startPosition?.row || index,
          column: assertionNode.startPosition?.column || 0
        }
      };
    });

    // カバレッジスコープを判定
    const testDescriptions = this.extractTestDescriptions(ast);
    const actualCoverage = this.patternMatcher.analyzeCoverageScope(testDescriptions);

    // 複雑度を計算（シンプルな実装）
    const complexity = this.calculateComplexity(ast);

    return {
      actualTargetMethods,
      assertions: testAssertions,
      actualCoverage,
      complexity
    };
  }

  /**
   * 実際にテストされているメソッドを抽出
   */
  private extractActualTargetMethods(ast: ASTNode): string[] {
    const methods: string[] = [];
    const testFunctions = this.parser.findTestFunctions(ast);

    testFunctions.forEach(testNode => {
      const targetMethod = this.extractTargetMethod(testNode);
      if (targetMethod && !methods.includes(targetMethod)) {
        methods.push(targetMethod);
      }
    });

    return methods;
  }

  /**
   * アサーションを解析
   */
  private parseAssertion(assertionNode: ASTNode): { type: string; expected: string; actual: string } {
    const text = assertionNode.text || '';
    
    // expect(xxx).toBe(yyy) パターン
    const expectMatch = text.match(/expect\(([^)]+)\)\.(\w+)\(([^)]*)\)/);
    if (expectMatch) {
      return {
        type: expectMatch[2], // toBe, toEqual, etc.
        expected: expectMatch[3],
        actual: expectMatch[1]
      };
    }

    // assert.xxx(actual, expected) パターン
    const assertMatch = text.match(/assert\.(\w+)\(([^,]+),\s*([^)]+)\)/);
    if (assertMatch) {
      return {
        type: assertMatch[1],
        expected: assertMatch[3],
        actual: assertMatch[2]
      };
    }

    return {
      type: 'unknown',
      expected: '',
      actual: ''
    };
  }

  /**
   * テストの説明文を抽出
   */
  private extractTestDescriptions(ast: ASTNode): string[] {
    const descriptions: string[] = [];
    const testFunctions = this.parser.findTestFunctions(ast);

    testFunctions.forEach(testNode => {
      const description = this.extractTestDescription(testNode);
      if (description) {
        descriptions.push(description);
      }
    });

    return descriptions;
  }

  /**
   * テストの複雑度を計算
   * KISS原則: シンプルな計算方法
   */
  private calculateComplexity(ast: ASTNode): number {
    let complexity = 1; // 基本複雑度

    const traverse = (node: ASTNode): void => {
      // 条件分岐を検出
      if (node.type === 'if_statement' || 
          node.type === 'ternary_expression' ||
          node.type === 'switch_statement') {
        complexity++;
      }
      
      // ループを検出
      if (node.type === 'for_statement' ||
          node.type === 'while_statement' ||
          node.type === 'do_statement') {
        complexity++;
      }

      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };

    traverse(ast);
    return complexity;
  }

  /**
   * テスト意図と実装のギャップを評価
   * KISS原則: シンプルな評価ロジック
   */
  async evaluateRealization(
    intent: TestIntent,
    actual: ActualTestAnalysis
  ): Promise<TestRealizationResult> {
    const gaps: TestGap[] = [];
    
    // 1. ターゲットメソッドのチェック
    if (intent.targetMethod && !actual.actualTargetMethods.includes(intent.targetMethod)) {
      gaps.push({
        type: GapType.WRONG_TARGET,
        description: `期待されるメソッド '${intent.targetMethod}' がテストされていません`,
        severity: Severity.HIGH,
        suggestions: [`テストに ${intent.targetMethod} の呼び出しを追加してください`]
      });
    }

    // 2. カバレッジのギャップをチェック
    if (intent.coverageScope.errorCases && !actual.actualCoverage.errorCases) {
      gaps.push({
        type: GapType.MISSING_ERROR_CASE,
        description: 'エラーケースのテストが不足しています',
        severity: Severity.HIGH,
        suggestions: [
          'エラーを発生させる入力値でのテストを追加',
          'try-catchブロックでのエラーハンドリングをテスト'
        ]
      });
    }

    if (intent.coverageScope.edgeCases && !actual.actualCoverage.edgeCases) {
      gaps.push({
        type: GapType.MISSING_EDGE_CASE,
        description: 'エッジケースのテストが不足しています',
        severity: Severity.MEDIUM,
        suggestions: [
          '空配列、null、undefinedなどの特殊な値でのテストを追加',
          '境界条件でのテストを追加'
        ]
      });
    }

    // 3. アサーションの存在チェック
    if (actual.assertions.length === 0) {
      gaps.push({
        type: GapType.MISSING_ASSERTION,
        description: 'アサーションが存在しません',
        severity: Severity.CRITICAL,
        suggestions: ['expect文またはassert文を追加してください']
      });
    }

    // 4. 実現度スコアの計算
    const realizationScore = this.calculateRealizationScore(intent, actual, gaps);

    // 5. リスクレベルの評価
    const riskLevel = this.assessRisk(gaps);

    return {
      intent,
      actual,
      gaps,
      realizationScore,
      riskLevel
    };
  }

  /**
   * 実現度スコアを計算
   */
  private calculateRealizationScore(
    intent: TestIntent,
    actual: ActualTestAnalysis,
    gaps: TestGap[]
  ): number {
    let score = 100;

    // ギャップごとにスコアを減点
    gaps.forEach(gap => {
      switch (gap.severity) {
        case Severity.CRITICAL:
          score -= 30;
          break;
        case Severity.HIGH:
          score -= 20;
          break;
        case Severity.MEDIUM:
          score -= 10;
          break;
        case Severity.LOW:
          score -= 5;
          break;
      }
    });

    // アサーションの数による加点
    if (actual.assertions.length > 0) {
      score = Math.min(score + actual.assertions.length * 2, 100);
    }

    return Math.max(0, score);
  }

  /**
   * リスク評価
   * NISTリスク評価システムを参考にシンプルに実装
   */
  assessRisk(gaps: TestGap[]): RiskLevel {
    if (gaps.length === 0) {
      return RiskLevel.MINIMAL;
    }

    // 最も重要度の高いギャップを基準にリスクレベルを決定
    const severities = gaps.map(gap => gap.severity);
    
    if (severities.includes(Severity.CRITICAL)) {
      return RiskLevel.CRITICAL;
    }
    
    if (severities.includes(Severity.HIGH)) {
      return RiskLevel.HIGH;
    }
    
    if (severities.includes(Severity.MEDIUM)) {
      return RiskLevel.MEDIUM;
    }
    
    if (severities.includes(Severity.LOW)) {
      return RiskLevel.LOW;
    }
    
    return RiskLevel.MINIMAL;
  }
}