import { BasePlugin } from '../base/BasePlugin';
import {
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  ImprovementType,
  ImprovementPriority
} from '../../core/types';
import { CoverageAnalyzer, CoverageSummary, CoverageThresholds, LowCoverageFile } from '../../analyzers/coverage/CoverageAnalyzer';
import { TestQualityEvaluator } from '../../analyzers/coverage/TestQualityEvaluator';
import * as path from 'path';

export interface FileCategories {
  security: string[];
  auth: string[];
  api: string[];
  utils: string[];
  business: string[];
  other: string[];
}

export interface SecurityCoverageThresholds extends CoverageThresholds {
  // セキュリティファイル用の厳しい閾値
}

/**
 * CoverageQualityPlugin
 * 
 * カバレッジ専門の品質評価プラグイン
 * issue #80で指摘された偽陰性問題を解決するため、
 * 実際のカバレッジデータに基づく厳格な評価を実施
 * 
 * 特徴:
 * - ファイルカテゴリ別の詳細分析
 * - セキュリティファイルに対する厳格評価
 * - 極低カバレッジの緊急検出
 * - 具体的な改善提案の生成
 */
export class CoverageQualityPlugin extends BasePlugin {
  id = 'coverage-quality';
  name = 'Coverage Quality Analyzer';
  version = '1.0.0';
  type = 'core' as const;

  private coverageAnalyzer: CoverageAnalyzer;
  private qualityEvaluator: TestQualityEvaluator;
  private currentTestFile?: TestFile;
  private currentProjectContext?: ProjectContext;

  // ファイルカテゴリのパターン（順序重要：より具体的なものを先に）
  private readonly categoryPatterns = {
    auth: [/\/auth\//, /authentication/, /login/, /session/, /credential/],
    security: [/security/, /encryption/, /crypto/, /jwt/, /oauth/],
    api: [/api/, /route/, /controller/, /endpoint/, /service/],
    utils: [/util/, /helper/, /common/, /shared/, /lib/],
    business: [/model/, /entity/, /domain/, /business/, /core/]
  };

  // セキュリティファイル用の厳しい閾値
  private readonly securityThresholds: CoverageThresholds = {
    lines: 90,
    statements: 90,
    functions: 85,
    branches: 80
  };

  constructor() {
    super();
    this.coverageAnalyzer = new CoverageAnalyzer();
    this.qualityEvaluator = new TestQualityEvaluator();
  }

  isApplicable(context: ProjectContext): boolean {
    // カバレッジ評価はすべてのプロジェクトで適用可能
    this.currentProjectContext = context;
    return true;
  }

  /**
   * プロジェクトコンテキストを設定（テスト用）
   */
  setProjectContext(context: ProjectContext): void {
    this.currentProjectContext = context;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    this.currentTestFile = testFile;
    // プロジェクトコンテキストが設定されていない場合は推定
    if (!this.currentProjectContext) {
      this.currentProjectContext = {
        rootPath: path.dirname(testFile.path).split(/[\/\\]test[\/\\]/)[0] || path.dirname(testFile.path),
        testFramework: 'jest',
        language: 'typescript'
      };
    }
    
    const patterns: DetectionResult[] = [];

    try {
      // カバレッジデータの取得
      const coverageData = await this.getCoverageForFile(testFile.path);
      
      if (!coverageData) {
        // カバレッジデータが取得できない場合
        patterns.push(this.createCoverageUnavailablePattern(testFile));
        return patterns;
      }

      // 低カバレッジパターンの検出
      const lowCoveragePattern = this.detectLowCoveragePattern(coverageData, testFile);
      if (lowCoveragePattern) {
        patterns.push(lowCoveragePattern);
      }

      // 極低カバレッジパターンの検出
      const criticalPattern = this.detectCriticalLowCoveragePattern(coverageData, testFile);
      if (criticalPattern) {
        patterns.push(criticalPattern);
      }

      // セキュリティファイルの特別検出
      if (this.isSecurityRelatedFile(testFile.path)) {
        const securityPattern = this.detectSecurityCoveragePattern(coverageData, testFile);
        if (securityPattern) {
          patterns.push(securityPattern);
        }
      }

      // 分岐カバレッジ特別検出
      const branchPattern = this.detectPoorBranchCoveragePattern(coverageData, testFile);
      if (branchPattern) {
        patterns.push(branchPattern);
      }

    } catch (error) {
      this.logError('Error detecting coverage patterns', error);
    }

    return patterns;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // パターンベースの基本スコア計算
    let baseScore = 100;
    let securityPenalty = 0;

    patterns.forEach(pattern => {
      switch (pattern.severity) {
        case 'critical':
          baseScore -= 40;
          break;
        case 'high':
          baseScore -= 25;
          break;
        case 'medium':
          baseScore -= 15;
          break;
        case 'low':
          baseScore -= 5;
          break;
      }

      // セキュリティ関連の追加ペナルティ
      if (pattern.patternId?.includes('security')) {
        securityPenalty += 10;
      }
    });

    const finalScore = Math.max(0, baseScore - securityPenalty);
    
    // 信頼度の計算
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0.8;

    return {
      overall: finalScore,
      dimensions: {
        completeness: Math.max(0, finalScore + 5),
        correctness: Math.max(0, finalScore - 5),
        maintainability: Math.max(0, finalScore)
      },
      confidence: avgConfidence
    };
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];
    const overallScore = evaluation.overall;

    // 極低品質に対する緊急改善提案
    if (overallScore < 20) {
      improvements.push(this.createImprovement(
        'critical-coverage-emergency',
        'critical',
        'add-test',
        '緊急: テストカバレッジの大幅改善が必要',
        'このファイルは極めて低いカバレッジです。至急、包括的なテストケースを追加してください。',
        { file: this.currentTestFile?.path || 'unknown', line: 1, column: 1 },
        0.9
      ));
    }

    // 低品質に対する高優先度改善提案
    if (overallScore < 50) {
      improvements.push(this.createImprovement(
        'high-priority-coverage',
        'high',
        'add-test',
        'カバレッジ向上の改善が必要',
        'テストカバレッジが基準を大幅に下回っています。未テストの機能に対してテストケースを追加してください。',
        { file: this.currentTestFile?.path || 'unknown', line: 1, column: 1 },
        0.8
      ));
    }

    // セキュリティファイル特別改善提案
    if (this.isSecurityRelatedFile(this.currentTestFile?.path)) {
      improvements.push(this.createImprovement(
        'security-coverage-improvement',
        'high',
        'add-test',
        'セキュリティファイルのカバレッジ強化',
        'セキュリティ関連ファイルは特に高いカバレッジが求められます。脆弱性につながる可能性のあるコードパスをすべてテストしてください。',
        { file: this.currentTestFile?.path || 'unknown', line: 1, column: 1 },
        0.85
      ));
    }

    // 分岐カバレッジ改善提案
    if (overallScore < 70) {
      improvements.push(this.createImprovement(
        'branch-coverage-improvement',
        'medium',
        'add-test',
        '分岐カバレッジの向上',
        'if文、switch文、条件演算子などの全ての分岐をテストしてください。特にエラーハンドリングの分岐も重要です。',
        { file: this.currentTestFile?.path || 'unknown', line: 1, column: 1 },
        0.7
      ));
    }

    return improvements;
  }

  /**
   * ファイルのカテゴリ分類
   */
  categorizeFiles(filePaths: string[]): FileCategories {
    const categories: FileCategories = {
      security: [],
      auth: [],
      api: [],
      utils: [],
      business: [],
      other: []
    };

    filePaths.forEach(filePath => {
      const normalizedPath = filePath.toLowerCase();
      let categorized = false;

      // より具体的なカテゴリを優先して評価（auth -> security -> 他）
      const orderedCategories = ['auth', 'security', 'api', 'utils', 'business'];
      
      for (const category of orderedCategories) {
        const patterns = (this.categoryPatterns as any)[category];
        if (patterns && patterns.some((pattern: RegExp) => pattern.test(normalizedPath))) {
          (categories as any)[category].push(filePath);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories.other.push(filePath);
      }
    });

    return categories;
  }

  /**
   * 標準カバレッジ閾値の取得
   */
  getCoverageThresholds(): CoverageThresholds {
    return this.coverageAnalyzer.getCoverageThresholds();
  }

  /**
   * セキュリティファイル用の厳しい閾値の取得
   */
  getSecurityCoverageThresholds(): CoverageThresholds {
    return { ...this.securityThresholds };
  }

  /**
   * プロジェクト全体のカバレッジサマリーを取得
   */
  async getProjectCoverageSummary(context: ProjectContext): Promise<CoverageSummary | null> {
    this.currentProjectContext = context;
    const coveragePath = this.getCoveragePath(context);
    return await this.coverageAnalyzer.getOverallCoverage(coveragePath);
  }

  /**
   * 低カバレッジファイルリストを取得
   */
  async getLowCoverageFiles(context: ProjectContext, threshold: number = 40): Promise<LowCoverageFile[]> {
    const coveragePath = this.getCoveragePath(context);
    return await this.coverageAnalyzer.findLowCoverageFiles(coveragePath, threshold);
  }

  /**
   * 特定ファイルのカバレッジデータを取得
   */
  private async getCoverageForFile(testFilePath: string): Promise<CoverageSummary | null> {
    if (!this.currentProjectContext) {
      return null;
    }

    try {
      const coveragePath = this.getCoveragePath(this.currentProjectContext);
      const sourceFilePath = this.inferSourceFileFromTestFile(testFilePath);
      
      if (sourceFilePath) {
        return await this.coverageAnalyzer.getFileCoverage(coveragePath, sourceFilePath);
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * カバレッジディレクトリのパスを取得
   */
  private getCoveragePath(context: ProjectContext): string {
    if (context.rootPath) {
      return path.resolve(context.rootPath, 'coverage');
    }
    return './coverage';
  }

  /**
   * テストファイルパスからソースファイルパスを推測
   */
  private inferSourceFileFromTestFile(testFilePath: string): string | null {
    return testFilePath
      .replace(/\.test\.(ts|js|tsx|jsx)$/, '.$1')
      .replace(/\.spec\.(ts|js|tsx|jsx)$/, '.$1')
      .replace(/test\//, 'src/')
      .replace(/__tests__\//, 'src/');
  }

  /**
   * セキュリティ関連ファイルの判定
   */
  private isSecurityRelatedFile(filePath?: string): boolean {
    if (!filePath) return false;
    
    const normalizedPath = filePath.toLowerCase();
    return this.categoryPatterns.security.some(pattern => pattern.test(normalizedPath));
  }

  /**
   * カバレッジ取得不可パターンの作成
   */
  private createCoverageUnavailablePattern(testFile: TestFile): DetectionResult {
    return {
      patternId: 'coverage-unavailable',
      severity: 'medium',
      confidence: 0.8,
      patternName: 'カバレッジデータが取得できません',
      metadata: {
        recommendation: 'カバレッジ測定を有効にして、テスト実行時にカバレッジデータを生成してください'
      }
    };
  }

  /**
   * 低カバレッジパターンの検出
   */
  private detectLowCoveragePattern(coverage: CoverageSummary, testFile: TestFile): DetectionResult | null {
    const thresholds = this.getCoverageThresholds();
    
    if (coverage.lines.pct < thresholds.lines || 
        coverage.statements.pct < thresholds.statements ||
        coverage.functions.pct < thresholds.functions ||
        coverage.branches.pct < thresholds.branches) {
      
      return {
        patternId: 'low-coverage-detected',
        severity: 'high',
        confidence: 0.9,
        patternName: `カバレッジが基準を下回っています (行: ${coverage.lines.pct}%, 分岐: ${coverage.branches.pct}%)`,
        metadata: {
          recommendation: 'テストケースを追加してカバレッジを改善してください',
          coverageData: coverage
        }
      };
    }
    
    return null;
  }

  /**
   * 極低カバレッジパターンの検出
   */
  private detectCriticalLowCoveragePattern(coverage: CoverageSummary, testFile: TestFile): DetectionResult | null {
    const minCoverage = Math.min(
      coverage.lines.pct,
      coverage.statements.pct,
      coverage.functions.pct,
      coverage.branches.pct
    );

    if (minCoverage < 10) {
      return {
        patternId: 'critical-low-coverage',
        severity: 'critical',
        confidence: 0.95,
        patternName: `極めて低いカバレッジが検出されました (最低: ${minCoverage}%)`,
        metadata: {
          recommendation: '緊急でテストケースの大幅追加が必要です',
          minCoverage: minCoverage
        }
      };
    }

    return null;
  }

  /**
   * セキュリティファイルカバレッジパターンの検出
   */
  private detectSecurityCoveragePattern(coverage: CoverageSummary, testFile: TestFile): DetectionResult | null {
    const securityThresholds = this.getSecurityCoverageThresholds();
    
    if (coverage.lines.pct < securityThresholds.lines ||
        coverage.branches.pct < securityThresholds.branches) {
      
      return {
        patternId: 'security-low-coverage',
        severity: 'high',
        confidence: 0.9,
        patternName: `セキュリティファイルのカバレッジが不十分です (行: ${coverage.lines.pct}%, 分岐: ${coverage.branches.pct}%)`,
        metadata: {
          recommendation: 'セキュリティ脆弱性を防ぐため、より高いカバレッジが必要です',
          securityFile: true
        }
      };
    }

    return null;
  }

  /**
   * 分岐カバレッジ不足パターンの検出
   */
  private detectPoorBranchCoveragePattern(coverage: CoverageSummary, testFile: TestFile): DetectionResult | null {
    if (coverage.branches.pct < 50) {
      return {
        patternId: 'poor-branch-coverage',
        severity: 'medium',
        confidence: 0.85,
        patternName: `分岐カバレッジが著しく低いです (${coverage.branches.pct}%)`,
        metadata: {
          recommendation: 'if文、switch文、条件演算子の全ての分岐をテストしてください',
          branchCoverage: coverage.branches.pct
        }
      };
    }

    return null;
  }

  /**
   * 改善提案オブジェクトの作成
   */
  protected createImprovement(
    id: string,
    priority: ImprovementPriority,
    type: ImprovementType,
    title: string,
    description: string,
    location: { file: string; line: number; column: number },
    impact: number
  ): Improvement {
    return {
      id,
      priority,
      type,
      title,
      description,
      location,
      impact
    };
  }
}