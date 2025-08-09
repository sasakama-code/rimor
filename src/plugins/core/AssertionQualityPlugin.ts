import { BasePlugin } from '../base/BasePlugin';
import {
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement
} from '../../core/types';
import { TestPatterns } from '../../utils/regexPatterns';
import { RegexHelper } from '../../utils/regexHelper';

export class AssertionQualityPlugin extends BasePlugin {
  id = 'assertion-quality';
  name = 'Assertion Quality Analyzer';
  version = '1.0.0';
  type = 'core' as const;

  // 共通パターンライブラリから正規表現を取得
  private readonly WEAK_ASSERTION_PATTERNS = TestPatterns.WEAK_ASSERTIONS;
  private readonly STRONG_ASSERTION_PATTERNS = TestPatterns.STRONG_ASSERTIONS;
  private readonly MAGIC_NUMBER_PATTERN = TestPatterns.MAGIC_NUMBER_ASSERTIONS;

  isApplicable(_context: ProjectContext): boolean {
    // すべてのプロジェクトで適用可能
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content;

    try {
      // パターン1: 高品質なアサーションの検出
      const highQualityPattern = this.detectHighQualityAssertions(content, testFile);
      if (highQualityPattern) {
        patterns.push(highQualityPattern);
      }

      // パターン2: 弱いアサーションの検出
      const weakAssertionPattern = this.detectWeakAssertions(content, testFile);
      if (weakAssertionPattern) {
        patterns.push(weakAssertionPattern);
      }

      // パターン3: アサーションの欠如検出
      const missingAssertionPattern = this.detectMissingAssertions(content, testFile);
      if (missingAssertionPattern) {
        patterns.push(missingAssertionPattern);
      }

      // パターン4: アサーションの種類の限定性検出
      const limitedVarietyPattern = this.detectLimitedAssertionVariety(content, testFile);
      if (limitedVarietyPattern) {
        patterns.push(limitedVarietyPattern);
      }

      // パターン5: マジックナンバーの検出
      const magicNumberPattern = this.detectMagicNumbersInAssertions(content, testFile);
      if (magicNumberPattern) {
        patterns.push(magicNumberPattern);
      }

      // パターン6: Jest固有の高度なアサーション検出
      const jestAdvancedPattern = this.detectJestAdvancedPatterns(content, testFile);
      if (jestAdvancedPattern) {
        patterns.push(jestAdvancedPattern);
      }

    } catch (error) {
      this.logError('Error detecting assertion patterns', error);
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    let correctnessScore = 100;
    const issues: string[] = [];

    // パターンに基づいてスコアを調整
    patterns.forEach(pattern => {
      switch (pattern.patternId) {
        case 'high-quality-assertions':
          // 高品質なアサーションがある場合はボーナス
          correctnessScore = Math.min(100, correctnessScore + 10);
          break;
        case 'weak-assertions':
          correctnessScore -= 25;
          issues.push("");
          break;
        case 'missing-assertions':
          correctnessScore -= 40;
          issues.push("");
          break;
        case 'limited-assertion-variety':
          correctnessScore -= 15;
          issues.push("");
          break;
        case 'magic-numbers-in-assertions':
          correctnessScore -= 10;
          issues.push("");
          break;
      }
    });

    correctnessScore = Math.max(0, Math.min(100, correctnessScore));

    // 信頼度は検出されたパターンの平均信頼度
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 1.0;

    return {
      overall: correctnessScore,
      dimensions: {
        completeness: 70,
        correctness: correctnessScore,
        maintainability: 75
      },
      confidence: avgConfidence
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    
    if (evaluation.overall >= 85) {
      // 高品質の場合は改善提案なし
      return improvements;
    }

    const correctnessScore = evaluation.dimensions?.correctness || 0;
    
    // 改善提案を生成（スコアベース）
    if (correctnessScore < 50) {
      improvements.push(this.createImprovement(
        'weak-assertions',
        'high',
        'refactor',
        '具体的なアサーションの使用',
        'toBeTruthy()やtoBeDefined()ではなく、toBe()、toEqual()、toMatch()など具体的な値を検証するアサーションを使用してください',
        this.createCodeLocation('unknown', 1, 1),
        0.25
      ));

      improvements.push(this.createImprovement(
        'missing-assertions',
        'critical',
        'add-test',
        'アサーションの追加',
        'テストケースに適切なアサーション文を追加して、期待される結果を明確に検証してください',
        this.createCodeLocation('unknown', 1, 1),
        0.4
      ));
    }

    if (correctnessScore < 70) {
      improvements.push(this.createImprovement(
        'variety',
        'medium',
        'refactor',
        '多様なアサーションの活用',
        'toMatch()、toContain()、toHaveLength()、toThrow()など、多様なアサーションメソッドを活用してください',
        this.createCodeLocation('unknown', 1, 1),
        0.15
      ));

      improvements.push(this.createImprovement(
        'magic-numbers',
        'low',
        'refactor',
        '定数の使用によるマジックナンバー除去',
        'アサーション内の数値リテラルを名前付き定数に置き換えて、テストの意図を明確にしてください',
        this.createCodeLocation('unknown', 1, 1),
        0.1
      ));
    }

    return improvements;
  }

  private detectHighQualityAssertions(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const strongAssertions = this.STRONG_ASSERTION_PATTERNS.reduce((count, pattern) => {
      const matches = RegexHelper.resetAndMatch(pattern, cleanContent);
      return count + (matches ? matches.length : 0);
    }, 0);

    const testCases = this.findPatternInCode(cleanContent, TestPatterns.TEST_CASE).length;
    
    // テストケースあたりの強いアサーション数が2以上で、3つ以上の異なるアサーションタイプが使われている場合
    if (testCases > 0 && strongAssertions / testCases >= 2) {
      const usedPatternTypes = this.STRONG_ASSERTION_PATTERNS.filter(pattern => {
        return RegexHelper.resetAndTest(pattern, cleanContent);
      }).length;

      if (usedPatternTypes >= 3) {
        return this.createDetectionResult(
          'high-quality-assertions',
          'High Quality Assertions',
          this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
          0.9,
          [{
            type: 'code',
            description: `高品質なアサーション: ${strongAssertions}個の具体的なアサーション、${usedPatternTypes}種類のアサーションタイプを使用`,
            location: this.createCodeLocation(testFile.path, 1, 1),
            code: content.substring(0, 100) + '...',
            confidence: 0.9
          }]
        );
      }
    }

    return null;
  }

  private detectWeakAssertions(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const weakAssertions = this.WEAK_ASSERTION_PATTERNS.reduce((count, pattern) => {
      const matches = RegexHelper.resetAndMatch(pattern, cleanContent);
      return count + (matches ? matches.length : 0);
    }, 0);

    const totalAssertions = this.findPatternInCode(cleanContent, TestPatterns.EXPECT_STATEMENT).length;
    
    // 弱いアサーションが全体の30%以上を占める場合
    if (totalAssertions > 0 && weakAssertions / totalAssertions >= 0.3) {
      return this.createDetectionResult(
        'weak-assertions',
        'Weak Assertions',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.8,
        [{
          type: 'code',
          description: `弱いアサーション: ${weakAssertions}/${totalAssertions}個のアサーションが曖昧な検証を行っています`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.8
        }]
      );
    }

    return null;
  }

  private detectMissingAssertions(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const testCases = this.findPatternInCode(cleanContent, TestPatterns.TEST_CASE);
    const assertions = this.findPatternInCode(cleanContent, TestPatterns.EXPECT_STATEMENT);

    // テストケースがあるのにアサーションがないか、極端に少ない場合
    if (testCases.length > 0 && (assertions.length === 0 || assertions.length / testCases.length < 0.5)) {
      return this.createDetectionResult(
        'missing-assertions',
        'Missing Assertions',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.9,
        [{
          type: 'structure',
          description: `アサーション不足: ${testCases.length}個のテストケースに対して${assertions.length}個のアサーションのみ`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.9
        }]
      );
    }

    return null;
  }

  private detectLimitedAssertionVariety(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const allAssertionPatterns = [...this.STRONG_ASSERTION_PATTERNS, ...this.WEAK_ASSERTION_PATTERNS];
    
    const usedPatterns = allAssertionPatterns.filter(pattern => {
      return RegexHelper.resetAndTest(pattern, cleanContent);
    });

    const totalAssertions = this.findPatternInCode(cleanContent, TestPatterns.EXPECT_STATEMENT).length;
    
    // アサーションが3個以上あるが、使用されているパターンが1種類以下の場合（より緩い条件）
    if (totalAssertions >= 3 && usedPatterns.length <= 1) {
      return this.createDetectionResult(
        'limited-assertion-variety',
        'Limited Assertion Variety',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.7,
        [{
          type: 'code',
          description: `アサーションの多様性不足: ${totalAssertions}個のアサーションで${usedPatterns.length}種類のパターンのみ使用`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.7
        }]
      );
    }

    return null;
  }

  private detectMagicNumbersInAssertions(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const magicNumbers = this.findPatternInCode(cleanContent, this.MAGIC_NUMBER_PATTERN);
    
    // 2個以上のマジックナンバーがある場合に検出（より緩い条件）
    if (magicNumbers.length >= 2) {
      return this.createDetectionResult(
        'magic-numbers-in-assertions',
        'Magic Numbers in Assertions',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.6,
        [{
          type: 'code',
          description: `マジックナンバー: ${magicNumbers.length}個の数値リテラルがアサーションで直接使用されています`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.6
        }]
      );
    }

    return null;
  }

  private detectJestAdvancedPatterns(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const jestAdvancedPatterns = TestPatterns.JEST_ADVANCED;

    const advancedUsage = jestAdvancedPatterns.filter(pattern => {
      return RegexHelper.resetAndTest(pattern, cleanContent);
    });

    // 2つ以上のJest高度機能が使われている場合
    if (advancedUsage.length >= 2) {
      return this.createDetectionResult(
        'jest-advanced-patterns',
        'Jest Advanced Patterns',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.8,
        [{
          type: 'code',
          description: `Jest高度機能の使用: ${advancedUsage.length}種類の高度なasync/awaitパターンやモック検証を使用`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.8
        }]
      );
    }

    return null;
  }

  private generateExplanation(score: number, issueCount: number): string {
    if (score >= 90) {
      return 'アサーションの品質が非常に高く、具体的で意味のある検証が行われています';
    } else if (score >= 70) {
      return 'アサーションの品質は良好ですが、いくつかの改善点があります';
    } else if (score >= 50) {
      return `アサーションの品質に課題があります。${issueCount}個の問題を解決する必要があります`;
    } else {
      return `アサーションの品質が低く、大幅な改善が必要です。${issueCount}個の重要な問題があります`;
    }
  }
}