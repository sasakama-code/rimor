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

export class TestStructurePlugin extends BasePlugin {
  id = 'test-structure';
  name = 'Test Structure Analyzer';
  version = '1.0.0';
  type = 'core' as const;

  private readonly AAA_PATTERNS = TestPatterns.AAA_COMMENTS;
  private readonly NAMING_PATTERNS = TestPatterns.NAMING_CONVENTIONS;

  isApplicable(_context: ProjectContext): boolean {
    // すべてのプロジェクトで適用可能
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const patterns: DetectionResult[] = [];
    const content = testFile.content;

    try {
      // パターン1: 構造化されたテストの検出
      const wellStructuredPattern = this.detectWellStructuredTests(content, testFile);
      if (wellStructuredPattern) {
        patterns.push(wellStructuredPattern);
      }

      // パターン2: 不適切なテスト構造の検出
      const poorOrganizationPattern = this.detectPoorTestOrganization(content, testFile);
      if (poorOrganizationPattern) {
        patterns.push(poorOrganizationPattern);
      }

      // パターン3: セットアップ・ティアダウンの欠如検出
      const missingSetupPattern = this.detectMissingSetupTeardown(content, testFile);
      if (missingSetupPattern) {
        patterns.push(missingSetupPattern);
      }

      // パターン4: 深いネスト構造の検出
      const deeplyNestedPattern = this.detectDeeplyNestedDescribes(content, testFile);
      if (deeplyNestedPattern) {
        patterns.push(deeplyNestedPattern);
      }

      // パターン5: 一貫性のない命名の検出
      const inconsistentNamingPattern = this.detectInconsistentNaming(content, testFile);
      if (inconsistentNamingPattern) {
        patterns.push(inconsistentNamingPattern);
      }

      // パターン6: 大きすぎるテストファイルの検出
      const largeFilePattern = this.detectLargeTestFile(content, testFile);
      if (largeFilePattern) {
        patterns.push(largeFilePattern);
      }

    } catch (error) {
      this.logError('Error detecting test structure patterns', error);
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    let maintainabilityScore = 100;
    const issues: string[] = [];

    // パターンに基づいてスコアを調整
    patterns.forEach(pattern => {
      switch (pattern.patternId) {
        case 'well-structured-tests':
          // 構造化されたテストがある場合はボーナス
          maintainabilityScore = Math.min(100, maintainabilityScore + 5);
          break;
        case 'poor-test-organization':
          maintainabilityScore -= 40;
          issues.push("");
          break;
        case 'missing-setup-teardown':
          maintainabilityScore -= 25;
          issues.push("");
          break;
        case 'deeply-nested-describes':
          maintainabilityScore -= 15;
          issues.push("");
          break;
        case 'inconsistent-naming':
          maintainabilityScore -= 10;
          issues.push("");
          break;
        case 'large-test-file':
          maintainabilityScore -= 15;
          issues.push("");
          break;
      }
    });

    maintainabilityScore = Math.max(0, Math.min(100, maintainabilityScore));

    // 信頼度は検出されたパターンの平均信頼度
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 1.0;

    return {
      overall: maintainabilityScore,
      dimensions: {
        completeness: 70,
        correctness: 75,
        maintainability: maintainabilityScore
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

    const maintainabilityScore = evaluation.dimensions?.maintainability || 0;
    
    // 改善提案を生成（スコアベース）
    if (maintainabilityScore < 50) {
      improvements.push(this.createImprovement(
        'structure',
        'high',
        'refactor',
        'AAAパターンの適用',
        'Arrange-Act-Assertパターンを使用してテストを構造化し、各段階を明確に分離してください',
        this.createCodeLocation('unknown', 1, 1),
        0.3
      ));

      improvements.push(this.createImprovement(
        'setup',
        'medium',
        'add-test',
        'セットアップ・ティアダウンの追加',
        'beforeEach/afterEachを使用して適切なテスト環境の準備と後処理を行ってください',
        this.createCodeLocation('unknown', 1, 1),
        0.2
      ));
    }

    if (maintainabilityScore < 70) {
      improvements.push(this.createImprovement(
        'nesting',
        'medium',
        'refactor',
        'ネスト構造の簡素化',
        'describeブロックのネストを2-3レベルに制限し、より平坦な構造に変更してください',
        this.createCodeLocation('unknown', 1, 1),
        0.15
      ));

      improvements.push(this.createImprovement(
        'naming',
        'low',
        'refactor',
        '一貫した命名規則の適用',
        'すべてのテストケースで「should + 動詞」の形式など、一貫した命名規則を使用してください',
        this.createCodeLocation('unknown', 1, 1),
        0.1
      ));

      improvements.push(this.createImprovement(
        'size',
        'medium',
        'refactor',
        'テストファイルの分割',
        '大きなテストファイルを機能やクラスごとに複数のファイルに分割してください',
        this.createCodeLocation('unknown', 1, 1),
        0.15
      ));
    }

    return improvements;
  }

  private detectWellStructuredTests(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    
    // AAA パターンコメントの検出
    const aaaComments = this.AAA_PATTERNS.filter(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(content); // コメントを含む元のcontentで検索
    });

    // beforeEach/afterEachの存在
    const setupTeardown = [
      /beforeEach\s*\(/g,
      /afterEach\s*\(/g,
      /beforeAll\s*\(/g,
      /afterAll\s*\(/g
    ].filter(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(cleanContent);
    });

    // 適切な構造の指標
    const testCases = this.findPatternInCode(cleanContent, TestPatterns.TEST_CASE).length;
    const describeSuites = this.findPatternInCode(cleanContent, TestPatterns.DESCRIBE_SUITE).length;
    
    // 良い構造の条件：AAA コメント使用、セットアップ・ティアダウン存在、適切な比率
    if (aaaComments.length >= 2 && setupTeardown.length >= 1 && testCases > 0 && describeSuites > 0) {
      return this.createDetectionResult(
        'well-structured-tests',
        'Well Structured Tests',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.9,
        [{
          type: 'structure',
          description: `構造化されたテスト: ${aaaComments.length}個のAAAパターンコメント、${setupTeardown.length}個のセットアップ・ティアダウン`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.9
        }]
      );
    }

    return null;
  }

  private detectPoorTestOrganization(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const testCases = this.findPatternInCode(cleanContent, TestPatterns.TEST_CASE);
    
    if (testCases.length === 0) return null;

    // 単一のテストケース内で複数の操作を行っているかチェック
    const totalExpectStatements = this.findPatternInCode(cleanContent, TestPatterns.EXPECT_STATEMENT).length;
    const multipleOperationPatterns = TestPatterns.SERVICE_OPERATIONS;

    let totalOperations = 0;
    multipleOperationPatterns.forEach(pattern => {
      const matches = RegexHelper.resetAndMatch(pattern, cleanContent);
      totalOperations += matches ? matches.length : 0;
    });

    // 1つのテストケースで4つ以上の操作や期待値がある場合
    if (testCases.length === 1 && (totalOperations >= 4 || totalExpectStatements >= 4)) {
      return this.createDetectionResult(
        'poor-test-organization',
        'Poor Test Organization',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.8,
        [{
          type: 'structure',
          description: `構造不良: 単一のテストケースで${totalOperations}個の操作と${totalExpectStatements}個の検証を行っています`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.8
        }]
      );
    }

    return null;
  }

  private detectMissingSetupTeardown(content: string, testFile: TestFile): DetectionResult | null {
    const cleanContent = this.removeCommentsAndStrings(content);
    const testCases = this.findPatternInCode(cleanContent, TestPatterns.TEST_CASE).length;
    const setupTeardownMethods = [
      TestPatterns.BEFORE_EACH,
      TestPatterns.AFTER_EACH,
      TestPatterns.BEFORE_ALL,
      TestPatterns.AFTER_ALL
    ];

    const setupTeardownCount = setupTeardownMethods.filter(pattern => {
      return RegexHelper.resetAndTest(pattern, cleanContent);
    }).length;

    // テストケースが3個以上あるのにセットアップ・ティアダウンがない場合
    if (testCases >= 3 && setupTeardownCount === 0) {
      return this.createDetectionResult(
        'missing-setup-teardown',
        'Missing Setup Teardown',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.7,
        [{
          type: 'structure',
          description: `セットアップ・ティアダウン不足: ${testCases}個のテストケースに対してbeforeEach/afterEachがありません`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.7
        }]
      );
    }

    return null;
  }

  private detectDeeplyNestedDescribes(content: string, testFile: TestFile): DetectionResult | null {
    const lines = content.split('\n');
    let maxNestLevel = 0;
    let currentNestLevel = 0;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('describe(') || trimmedLine.includes('describe ')) {
        currentNestLevel++;
        maxNestLevel = Math.max(maxNestLevel, currentNestLevel);
      }
      if (trimmedLine.includes('});') && currentNestLevel > 0) {
        currentNestLevel--;
      }
    });

    // ネストが3レベル以上の場合（より緩い条件）
    if (maxNestLevel >= 3) {
      return this.createDetectionResult(
        'deeply-nested-describes',
        'Deeply Nested Describes',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.8,
        [{
          type: 'structure',
          description: `深いネスト: 最大${maxNestLevel}レベルのdescribeブロックが検出されました`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.8
        }]
      );
    }

    return null;
  }

  private detectInconsistentNaming(content: string, testFile: TestFile): DetectionResult | null {
    const testCases = this.findPatternInCode(content, /it\s*\(\s*['"`][^'"`]+['"`]/g);
    
    if (testCases.length < 3) return null;

    const namingStyles: { [key: string]: number } = {
      'should': 0,
      'test': 0,
      'creates': 0,
      'other': 0
    };

    testCases.forEach(testCase => {
      const testName = testCase.match.toLowerCase();
      if (testName.includes('should')) {
        namingStyles['should']++;
      } else if (testName.includes('test')) {
        namingStyles['test']++;
      } else if (testName.includes('creates') || testName.includes('create')) {
        namingStyles['creates']++;
      } else {
        namingStyles['other']++;
      }
    });

    // 複数の命名スタイルが混在している場合
    const usedStyles = Object.values(namingStyles).filter(count => count > 0).length;
    if (usedStyles >= 3) {
      return this.createDetectionResult(
        'inconsistent-naming',
        'Inconsistent Naming',
        this.createCodeLocation(testFile.path, 1, this.parseCodeContent(content).totalLines),
        0.6,
        [{
          type: 'naming',
          description: `命名の一貫性不足: ${usedStyles}種類の異なる命名スタイルが混在しています`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.6
        }]
      );
    }

    return null;
  }

  private detectLargeTestFile(content: string, testFile: TestFile): DetectionResult | null {
    const parsed = this.parseCodeContent(content);
    const testCases = this.findPatternInCode(content, TestPatterns.TEST_CASE).length;

    // 500行以上または30個以上のテストケースがある場合
    if (parsed.totalLines > 500 || testCases > 30) {
      return this.createDetectionResult(
        'large-test-file',
        'Large Test File',
        this.createCodeLocation(testFile.path, 1, parsed.totalLines),
        0.7,
        [{
          type: 'structure',
          description: `大きなテストファイル: ${parsed.totalLines}行、${testCases}個のテストケース`,
          location: this.createCodeLocation(testFile.path, 1, 1),
          code: content.substring(0, 100) + '...',
          confidence: 0.7
        }]
      );
    }

    return null;
  }

  private generateExplanation(score: number, issueCount: number): string {
    if (score >= 90) {
      return 'テスト構造が非常に良好で、保守性の高いテストコードになっています';
    } else if (score >= 70) {
      return 'テスト構造は良好ですが、いくつかの改善点があります';
    } else if (score >= 50) {
      return `テスト構造に課題があります。${issueCount}個の問題を解決する必要があります`;
    } else {
      return `テスト構造が不適切で、大幅な改善が必要です。${issueCount}個の重要な問題があります`;
    }
  }
}