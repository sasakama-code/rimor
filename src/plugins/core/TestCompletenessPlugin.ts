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

export class TestCompletenessPlugin extends BasePlugin {
  id = 'test-completeness';
  name = 'Test Completeness Analyzer';
  version = '1.0.0';
  type = 'core' as const;

  isApplicable(_context: ProjectContext): boolean {
    // すべてのプロジェクトで適用可能
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content;
    const parsed = this.parseCodeContent(content);

    try {
      // パターン1: 包括的なテストスイート検出
      const comprehensivePattern = this.detectComprehensiveTestSuite(content, testFile);
      if (comprehensivePattern) {
        patterns.push(comprehensivePattern);
      }

      // パターン2: 不完全なテストカバレッジ検出
      const incompletePattern = this.detectIncompleteTestCoverage(content, testFile);
      if (incompletePattern) {
        patterns.push(incompletePattern);
      }

      // パターン3: エッジケースの欠如検出
      const missingEdgeCasesPattern = this.detectMissingEdgeCases(content, testFile);
      if (missingEdgeCasesPattern) {
        patterns.push(missingEdgeCasesPattern);
      }

      // パターン4: 空のテストスイート検出
      const emptyTestSuitePattern = this.detectEmptyTestSuite(content, testFile);
      if (emptyTestSuitePattern) {
        patterns.push(emptyTestSuitePattern);
      }

      // パターン5: セットアップ・ティアダウンの欠如
      const missingSetupPattern = this.detectMissingSetupTeardown(content, testFile);
      if (missingSetupPattern) {
        patterns.push(missingSetupPattern);
      }

    } catch (error) {
      this.logError('Error detecting patterns', error);
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    let completenessScore = 100;
    const issues: string[] = [];

    // パターンに基づいてスコアを調整
    patterns.forEach(pattern => {
      switch (pattern.patternId) {
        case 'comprehensive-test-suite':
          // 包括的なテストは高評価
          completenessScore = Math.max(completenessScore, 90);
          break;
        case 'incomplete-test-coverage':
          completenessScore -= 30;
          issues.push("");
          break;
        case 'missing-edge-cases':
          completenessScore -= 20;
          issues.push("");
          break;
        case 'empty-test-suite':
          completenessScore -= 40;
          issues.push("");
          break;
        case 'missing-setup-teardown':
          completenessScore -= 10;
          issues.push("");
          break;
      }
    });

    completenessScore = Math.max(0, Math.min(100, completenessScore));

    // 信頼度は検出されたパターンの平均信頼度
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 1.0;

    return {
      overall: completenessScore,
      dimensions: {
        completeness: completenessScore,
        correctness: 75,
        maintainability: 70
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

    const completenessScore = evaluation.dimensions?.completeness || 0;
    
    // 改善提案を生成（スコアベース）
    if (completenessScore < 30) {
      improvements.push(this.createImprovement(
        'empty-suite',
        'critical',
        'add-test',
        'テストケースの実装',
        '空のテストスイートに具体的なテストケースを追加してください',
        this.createCodeLocation('unknown', 1, 1),
        0.4
      ));
    }

    if (completenessScore < 50) {
      improvements.push(this.createImprovement(
        'completeness',
        'high',
        'add-test',
        "",
        "",
        this.createCodeLocation('unknown', 1, 1),
        0.3
      ));
    }

    if (completenessScore < 70) {
      improvements.push(this.createImprovement(
        'edge-cases',
        'medium',
        'add-test',
        'エッジケーステストの追加',
        '境界値、null値、空文字列、大きなデータサイズなどのエッジケースをテストしてください',
        this.createCodeLocation('unknown', 1, 1),
        0.2
      ));

      improvements.push(this.createImprovement(
        'setup',
        'low',
        'add-test',
        'セットアップ・ティアダウンの追加',
        'beforeEach/afterEachでテストの前処理・後処理を適切に行ってください',
        this.createCodeLocation('unknown', 1, 1),
        0.1
      ));
    }

    return improvements;
  }

  private detectComprehensiveTestSuite(content: string, testFile: TestFile): DetectionResult | null {
    const crudPatterns = TestPatterns.CRUD_OPERATIONS;
    const errorPatterns = TestPatterns.ERROR_HANDLING;
    const setupPatterns = [TestPatterns.BEFORE_EACH, TestPatterns.AFTER_EACH];
    
    const allPatterns = [...crudPatterns, ...errorPatterns, ...setupPatterns];
    const matchedPatterns = allPatterns.filter(pattern => RegexHelper.resetAndTest(pattern, content));
    
    if (matchedPatterns.length >= 4) {
      return this.createDetectionResult(
        'comprehensive-test-suite',
        'Comprehensive Test Suite',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.9,
        [{
          type: 'structure',
          description: `包括的なテストスイート: ${matchedPatterns.length}個のテストパターンを検出`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.9
        }]
      );
    }

    return null;
  }

  private detectIncompleteTestCoverage(content: string, testFile: TestFile): DetectionResult | null {
    const testCases = this.findPatternInCode(content, TestPatterns.TEST_CASE);
    const describeSuites = this.findPatternInCode(content, TestPatterns.DESCRIBE_SUITE);

    // テストケース数が少ない、またはdescribeに対してitが少ない場合
    if (testCases.length < 3 || (describeSuites.length > 0 && testCases.length / describeSuites.length < 2)) {
      return this.createDetectionResult(
        'incomplete-test-coverage',
        'Incomplete Test Coverage',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.7,
        [{
          type: 'structure',
          description: `テストケース数不足: ${testCases.length}件のテストケース`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.7
        }]
      );
    }

    return null;
  }

  private detectMissingEdgeCases(content: string, testFile: TestFile): DetectionResult | null {
    const edgeCasePatterns = TestPatterns.EDGE_CASES;

    const edgeCaseMatches = edgeCasePatterns.filter(pattern => RegexHelper.resetAndTest(pattern, content));
    
    if (edgeCaseMatches.length < 2) {
      return this.createDetectionResult(
        'missing-edge-cases',
        'Missing Edge Cases',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.6,
        [{
          type: 'code',
          description: `エッジケーステスト不足: ${edgeCaseMatches.length}個のエッジケースパターンのみ検出`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.6
        }]
      );
    }

    return null;
  }

  private detectEmptyTestSuite(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const describeSuites = this.findPatternInCode(cleanContent, TestPatterns.DESCRIBE_SUITE);
    const testCases = this.findPatternInCode(cleanContent, TestPatterns.TEST_CASE);

    // 1. describeブロックがあるのにテストケースがない場合
    // 2. ファイル全体にテストケースがない場合（コメントのみなど）
    if ((describeSuites.length > 0 && testCases.length === 0) || 
        (testCases.length === 0 && this.parseCodeContent(cleanContent).codeLines < 3)) {
      return this.createDetectionResult(
        'empty-test-suite',
        'Empty Test Suite',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.9,
        [{
          type: 'structure',
          description: describeSuites.length > 0 
            ? `空のテストスイート: ${describeSuites.length}個のdescribeブロックに対してテストケースが0個`
            : 'テストケースが存在しません',
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.9
        }]
      );
    }

    return null;
  }

  private detectMissingSetupTeardown(content: string, testFile: TestFile): DetectionResult | null {
    const testCases = this.findPatternInCode(content, TestPatterns.TEST_CASE);
    const beforeEach = this.findPatternInCode(content, TestPatterns.BEFORE_EACH);
    const afterEach = this.findPatternInCode(content, TestPatterns.AFTER_EACH);

    // テストケースが複数あるのにセットアップ・ティアダウンがない場合
    if (testCases.length >= 3 && beforeEach.length === 0 && afterEach.length === 0) {
      return this.createDetectionResult(
        'missing-setup-teardown',
        'Missing Setup/Teardown',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.5,
        [{
          type: 'structure',
          description: `セットアップ・ティアダウン不足: ${testCases.length}個のテストケースに対してbeforeEach/afterEachがありません`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.5
        }]
      );
    }

    return null;
  }

  private generateExplanation(score: number, issueCount: number): string {
    if (score >= 90) {
      return 'テストの完全性が非常に高く、包括的なテストケースが実装されています';
    } else if (score >= 70) {
      return 'テストの完全性は良好ですが、いくつかの改善点があります';
    } else if (score >= 50) {
      return `テストの完全性に課題があります。${issueCount}個の問題を解決する必要があります`;
    } else {
      return `テストの完全性が低く、大幅な改善が必要です。${issueCount}個の重要な問題があります`;
    }
  }
}