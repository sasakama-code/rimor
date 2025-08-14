/**
 * AssertionExistencePlugin
 * 
 * テストファイル内のアサーションの存在と品質を確認するプラグイン
 * BasePluginを継承し、ITestQualityPluginインターフェースを実装
 */

import * as fs from 'fs';
import { BasePlugin } from '../base/BasePlugin';
import { 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement,
  Issue 
} from '../../core/types';
import { TestPatterns } from '../../utils/regexPatterns';
import { RegexHelper } from '../../utils/regexHelper';
import { PathSecurity } from '../../utils/pathSecurity';

export class AssertionExistencePlugin extends BasePlugin {
  id = 'assertion-existence';
  name = 'Assertion Existence Checker';
  version = '1.0.0';
  type = 'core' as const;

  isApplicable(context: ProjectContext): boolean {
    // コアプラグインなので常に適用可能
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    // テストファイルの内容をチェック
    if (!testFile.content || !this.isTestFile(testFile.path)) {
      return results;
    }

    // テスト内のアサーションを検出
    const assertionInfo = this.analyzeAssertions(testFile.content);

    // ファイル全体にアサーションがない場合のみ報告
    if (assertionInfo.hasNoAssertions) {
      results.push({
        patternId: 'missing-assertions',
        patternName: 'Missing Assertions',
        severity: 'high',
        confidence: 0.9,
        location: {
          file: testFile.path,
          line: assertionInfo.testLine || 1,
          column: 1
        },
        metadata: {
          description: `Test has no assertions in ${PathSecurity.toRelativeOrMasked(testFile.path)}`,
          category: 'assertion-quality'
        }
      });
    } else if (assertionInfo.hasWeakAssertions) {
      results.push({
        patternId: 'weak-assertions',
        patternName: 'Weak Assertions',
        severity: 'medium',
        confidence: 0.7,
        location: {
          file: testFile.path,
          line: assertionInfo.weakAssertionLine || 1,
          column: 1
        },
        metadata: {
          description: `Test contains only weak assertions in ${PathSecurity.toRelativeOrMasked(testFile.path)}`,
          category: 'assertion-quality'
        }
      });
    } else {
      // ファイル全体にアサーションがある場合のみ、個別のテストブロックをチェック
      const testBlocks = this.extractTestBlocks(testFile.content);
      testBlocks.forEach((block, index) => {
        if (!this.detectAssertions(block.content)) {
          results.push({
            patternId: 'missing-assertions',
            patternName: 'Missing Assertions in Test Block',
            severity: 'high',
            confidence: 0.85,
            location: {
              file: testFile.path,
              line: block.line,
              column: 1
            },
            metadata: {
              description: `Test block '${block.name}' has no assertions`,
              category: 'assertion-quality'
            }
          });
        }
      });
    }

    return results;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    let correctness = 100;
    let completeness = 100;

    patterns.forEach(pattern => {
      if (pattern.patternId === 'missing-assertions') {
        correctness *= 0.3;
        completeness *= 0.5;
      } else if (pattern.patternId === 'weak-assertions') {
        correctness *= 0.6;
        completeness *= 0.8;
      }
    });

    const overall = (correctness + completeness) / 2;

    return {
      overall,
      dimensions: {
        completeness,
        correctness,
        maintainability: 80
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 1
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    // QualityScoreのoverallスコアから改善提案を生成
    if (evaluation.overall < 50) {
      improvements.push({
        id: 'add-assertions',
        priority: 'high',
        type: 'fix-assertion',
        category: 'assertion-improvement',
        title: 'Add missing assertions',
        description: 'Add assertions to tests that currently have none',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.4,
        autoFixable: false
      });
    } else if (evaluation.overall < 80) {
      improvements.push({
        id: 'strengthen-assertions',
        priority: 'medium',
        type: 'fix-assertion',
        category: 'assertion-improvement',
        title: 'Strengthen weak assertions',
        description: 'Replace weak assertions with more specific assertions',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.2,
        autoFixable: false
      });
    }

    return improvements;
  }

  /**
   * レガシーインターフェース (IPlugin) との互換性のためのメソッド
   */
  async analyze(filePath: string): Promise<Issue[]> {
    // テストファイル以外はスキップ
    if (!this.isTestFile(filePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasAssertions = this.detectAssertions(content);

      if (!hasAssertions) {
        return [{
          type: 'missing-assertion',
          severity: 'medium' as const,
          message: "アサーション（expect文など）が見つかりません",
          filePath: filePath,
          category: 'assertion' as const
        }];
      }

      return [];
    } catch (error) {
      // ファイル読み込みエラーは無視
      return [];
    }
  }

  /**
   * アサーションの分析
   */
  private analyzeAssertions(content: string): {
    hasNoAssertions: boolean;
    hasWeakAssertions: boolean;
    testLine?: number;
    weakAssertionLine?: number;
  } {
    const cleanContent = this.removeCommentsAndStrings(content);
    const lines = cleanContent.split('\n');
    
    let hasNoAssertions = !this.detectAssertions(cleanContent);
    let hasWeakAssertions = false;
    let testLine: number | undefined;
    let weakAssertionLine: number | undefined;

    // 弱いアサーションのパターン
    const weakPatterns = [
      /expect\([^)]+\)\.toBeTruthy\(\)/,
      /expect\([^)]+\)\.toBeFalsy\(\)/,
      /expect\([^)]+\)\.toBeDefined\(\)/,
      /expect\([^)]+\)\.toBeUndefined\(\)/,
      /assert\.ok\(/,
      /assert\(/
    ];

    lines.forEach((line, index) => {
      // テストブロックの検出
      if (/\b(test|it|describe)\s*\(/.test(line) && !testLine) {
        testLine = index + 1;
      }

      // 弱いアサーションの検出
      if (weakPatterns.some(pattern => pattern.test(line))) {
        hasWeakAssertions = true;
        if (!weakAssertionLine) {
          weakAssertionLine = index + 1;
        }
      }
    });

    // 強いアサーションがある場合は弱いアサーション警告を出さない
    const strongPatterns = [
      /expect\([^)]+\)\.toBe\(/,
      /expect\([^)]+\)\.toEqual\(/,
      /expect\([^)]+\)\.toMatch\(/,
      /expect\([^)]+\)\.toContain\(/,
      /expect\([^)]+\)\.toHaveBeenCalled/,
      /assert\.equal\(/,
      /assert\.deepEqual\(/
    ];

    const hasStrongAssertions = strongPatterns.some(pattern => 
      pattern.test(cleanContent)
    );

    if (hasStrongAssertions) {
      hasWeakAssertions = false;
    }

    return {
      hasNoAssertions,
      hasWeakAssertions: hasWeakAssertions && !hasNoAssertions,
      testLine,
      weakAssertionLine
    };
  }

  /**
   * テストブロックを抽出
   */
  private extractTestBlocks(content: string): Array<{
    name: string;
    content: string;
    line: number;
  }> {
    const blocks: Array<{ name: string; content: string; line: number }> = [];
    const lines = content.split('\n');
    
    const testPattern = /\b(test|it)\s*\(\s*['"`]([^'"`]+)['"`]/;
    
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(testPattern);
      if (match) {
        const name = match[2];
        const blockContent = this.extractBlockContent(lines, i);
        blocks.push({
          name,
          content: blockContent,
          line: i + 1
        });
      }
    }

    return blocks;
  }

  /**
   * ブロックの内容を抽出
   */
  private extractBlockContent(lines: string[], startIndex: number): string {
    let braceCount = 0;
    let blockStarted = false;
    let content = '';

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          blockStarted = true;
        } else if (char === '}') {
          braceCount--;
        }
      }

      if (blockStarted) {
        content += line + '\n';
      }

      if (blockStarted && braceCount === 0) {
        break;
      }
    }

    return content;
  }

  /**
   * アサーションを検出
   */
  private detectAssertions(content: string): boolean {
    const assertionPatterns = TestPatterns.ALL_ASSERTIONS;
    const cleanContent = this.removeCommentsAndStrings(content);
    return RegexHelper.testAny(assertionPatterns, cleanContent);
  }
}