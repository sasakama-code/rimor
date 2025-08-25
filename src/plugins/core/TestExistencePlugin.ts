/**
 * TestExistencePlugin
 * 
 * テストファイルの存在を確認するプラグイン
 * BasePluginを継承し、ITestQualityPluginインターフェースを実装
 */

import * as fs from 'fs';
import * as path from 'path';
import { BasePlugin } from '../base/BasePlugin';
import { 
  ProjectContext, 
  TestFile, 
  DetectionResult, 
  QualityScore, 
  Improvement,
  Issue 
} from '../../core/types';
import { PluginConfig } from '../../core/config';
import { PathSecurity } from '../../utils/pathSecurity';
import { TestQualityIntegrator } from '../../analyzers/coverage/TestQualityIntegrator';
import { CoverageAnalyzer } from '../../analyzers/coverage/CoverageAnalyzer';

export class TestExistencePlugin extends BasePlugin {
  id = 'test-existence';
  name = 'Test File Existence Checker';
  version = '1.0.0';
  type = 'core' as const;
  
  private config?: PluginConfig;
  private qualityIntegrator: TestQualityIntegrator;
  private coverageAnalyzer: CoverageAnalyzer;
  private currentProjectContext?: ProjectContext;

  constructor(config?: PluginConfig) {
    super();
    this.config = config;
    this.qualityIntegrator = new TestQualityIntegrator();
    this.coverageAnalyzer = new CoverageAnalyzer();
  }

  isApplicable(context: ProjectContext): boolean {
    // プロジェクトコンテキストを保存
    this.currentProjectContext = context;
    // コアプラグインなので常に適用可能
    return true;
  }

  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    // テストファイルの内容をチェック
    if (!testFile.content || testFile.content.trim().length === 0) {
      results.push({
        patternId: 'missing-test-file',
        patternName: 'Missing Test File',
        severity: 'high',
        confidence: 0.9,
        location: {
          file: testFile.path,
          line: 1,
          column: 1
        },
        metadata: {
          description: `No test file found for ${PathSecurity.toRelativeOrMasked(testFile.path)}`,
          category: 'test-existence'
        }
      });
    } else {
      // テストファイルは存在するが、実際のテストが含まれていない場合
      const hasTests = this.containsTests(testFile.content);
      if (!hasTests) {
        results.push({
          patternId: 'empty-test-file',
          patternName: 'Empty Test File',
          severity: 'medium',
          confidence: 0.8,
          location: {
            file: testFile.path,
            line: 1,
            column: 1
          },
          metadata: {
            description: `Test file exists but contains no tests: ${PathSecurity.toRelativeOrMasked(testFile.path)}`,
            category: 'test-existence'
          }
        });
      }
    }

    return results;
  }

  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    // Issue #81対応: カバレッジ統合による正確な品質評価
    try {
      // テストファイルの情報を構築
      const testFile: TestFile = this.buildTestFileFromPatterns(patterns);
      
      // カバレッジデータを同期的に取得（簡易版）
      const coverage = this.getCoverageDataSync(testFile);
      
      // TestQualityIntegratorによる統合評価
      return this.qualityIntegrator.evaluateIntegratedQuality(
        testFile, 
        coverage, 
        this.currentProjectContext || null
      );
    } catch (error) {
      // フォールバック: 従来の簡易評価
      return this.fallbackEvaluation(patterns);
    }
  }

  suggestImprovements(evaluation: QualityScore): Improvement[] {
    const improvements: Improvement[] = [];

    // QualityScoreのoverallスコアから改善提案を生成
    if (evaluation.overall < 50) {
      improvements.push({
        id: 'add-test-file',
        priority: 'high',
        type: 'add-test',
        category: 'test-creation',
        title: 'Create missing test file',
        description: 'Create test file for untested source files',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.5,
        autoFixable: false
      });
    } else if (evaluation.overall < 80) {
      improvements.push({
        id: 'add-test-cases',
        priority: 'medium',
        type: 'improve-coverage',
        category: 'test-improvement',
        title: 'Add test cases',
        description: 'Add test cases to existing test files',
        location: {
          file: '',
          line: 1,
          column: 1
        },
        estimatedImpact: 0.3,
        autoFixable: false
      });
    }

    return improvements;
  }

  /**
   * レガシーインターフェース (IPlugin) との互換性のためのメソッド
   */
  async analyze(filePath: string): Promise<Issue[]> {
    // テストファイル自体や除外対象ファイルはスキップ
    if (this.isTestFile(filePath) || this.shouldExclude(filePath)) {
      return [];
    }

    const expectedTestPaths = this.generateTestPaths(filePath);
    const exists = expectedTestPaths.some(testPath => fs.existsSync(testPath));

    if (!exists) {
      const maskedPath = PathSecurity.toRelativeOrMasked(filePath);
      return [{
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'missing-test',
        severity: 'high' as const,
        message: `テストファイルが存在しません: ${maskedPath}`,
        filePath: filePath,
        category: 'test-quality' as const
      }];
    }

    return [];
  }

  /**
   * パターンからTestFileオブジェクトを構築
   */
  private buildTestFileFromPatterns(patterns: DetectionResult[]): TestFile {
    // パターンから最初のファイルパスを取得
    const firstPattern = patterns.find(p => p.location?.file);
    const filePath = firstPattern?.location?.file || 'unknown';
    
    // ファイルの内容を取得（存在する場合）
    let content = '';
    try {
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf-8');
      }
    } catch (error) {
      // ファイル読み取りエラーは無視して空文字列を使用
    }
    
    return {
      path: filePath,
      content: content
    };
  }

  /**
   * カバレッジデータを同期的に取得（簡易版）
   */
  private getCoverageDataSync(testFile: TestFile) {
    if (!this.currentProjectContext?.rootPath) {
      return null;
    }
    
    try {
      // 全体カバレッジを取得（個別ファイルより確実）
      const coveragePath = path.resolve(this.currentProjectContext.rootPath, 'coverage');
      
      // coverage-summary.jsonの存在チェック
      const summaryPath = path.join(coveragePath, 'coverage-summary.json');
      if (!fs.existsSync(summaryPath)) {
        return null;
      }
      
      // 全体カバレッジデータを同期的に読み込み
      const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      if (!summaryData.total) {
        return null;
      }
      
      return {
        lines: {
          total: summaryData.total.lines.total,
          covered: summaryData.total.lines.covered,
          pct: summaryData.total.lines.pct
        },
        statements: {
          total: summaryData.total.statements.total,
          covered: summaryData.total.statements.covered,
          pct: summaryData.total.statements.pct
        },
        functions: {
          total: summaryData.total.functions.total,
          covered: summaryData.total.functions.covered,
          pct: summaryData.total.functions.pct
        },
        branches: {
          total: summaryData.total.branches.total,
          covered: summaryData.total.branches.covered,
          pct: summaryData.total.branches.pct
        }
      };
    } catch (error) {
      return null;
    }
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
   * フォールバック評価（従来のロジック）
   */
  private fallbackEvaluation(patterns: DetectionResult[]): QualityScore {
    let completeness = 100;
    let coverage = 100;

    patterns.forEach(pattern => {
      if (pattern.patternId === 'missing-test-file') {
        completeness = 0;
        coverage = 0;
      } else if (pattern.patternId === 'empty-test-file') {
        completeness = 50;
        coverage = 50;
      }
    });

    const overall = (completeness + coverage) / 2;

    return {
      overall,
      dimensions: {
        completeness,
        correctness: overall,
        maintainability: 80
      },
      breakdown: {
        completeness,
        correctness: overall
      },
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 1
    };
  }

  /**
   * ファイルにテストが含まれているかチェック
   */
  private containsTests(content: string): boolean {
    const testPatterns = [
      /describe\s*\(/,
      /test\s*\(/,
      /it\s*\(/,
      /expect\s*\(/,
      /assert\./,
      /should\./
    ];

    const cleanedContent = this.removeCommentsAndStrings(content);
    return testPatterns.some(pattern => pattern.test(cleanedContent));
  }

  /**
   * 除外するべきファイルかチェック
   */
  private shouldExclude(filePath: string): boolean {
    const fileName = path.basename(filePath);

    // 設定ファイルのexcludeFilesを優先使用
    const configExcludeFiles = this.config?.excludeFiles || [];
    if (configExcludeFiles.includes(fileName)) {
      return true;
    }

    // generatedディレクトリの除外
    if (filePath.includes('/generated/') || filePath.includes('\\generated\\')) {
      return true;
    }

    // デフォルトの除外パターン
    const defaultExcludePatterns = [
      'index.ts', 'index.js',
      'types.ts', 'types.js',
      'config.ts', 'config.js',
      'constants.ts', 'constants.js'
    ];

    return defaultExcludePatterns.includes(fileName);
  }

  /**
   * テストファイルのパスを生成
   */
  private generateTestPaths(filePath: string): string[] {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);

    // TypeScript拡張子への対応
    const testExtensions = [ext];
    if (ext === '.js') testExtensions.push('.ts');
    if (ext === '.jsx') testExtensions.push('.tsx');

    const paths: string[] = [];
    for (const testExt of testExtensions) {
      // 同一ディレクトリ
      paths.push(
        path.join(dir, `${baseName}.test${testExt}`),
        path.join(dir, `${baseName}.spec${testExt}`),
        path.join(dir, '__tests__', `${baseName}.test${testExt}`),
        path.join(dir, '__tests__', `${baseName}.spec${testExt}`)
      );

      // test/ルートディレクトリ構造
      const relativePath = path.relative('src', filePath);
      if (!relativePath.startsWith('..')) {
        const testDir = path.dirname(relativePath);
        const projectRoot = this.findProjectRoot(filePath);

        if (projectRoot) {
          paths.push(
            path.join(projectRoot, 'test', testDir, `${baseName}.test${testExt}`),
            path.join(projectRoot, 'test', testDir, `${baseName}.spec${testExt}`)
          );

          // フラットな命名のパターン
          if (testDir === 'cli/commands' && baseName === 'analyze') {
            paths.push(
              path.join(projectRoot, 'test', 'analyzeCommand.test.ts'),
              path.join(projectRoot, 'test', 'analyzeCommand.spec.ts')
            );
          }

          // ルートレベルのテストファイル
          if (testDir === '.') {
            paths.push(
              path.join(projectRoot, 'test', `${baseName}.test${testExt}`),
              path.join(projectRoot, 'test', `${baseName}.spec${testExt}`)
            );
          }
        }
      }
    }

    return paths;
  }

  /**
   * プロジェクトルートを検索
   */
  private findProjectRoot(filePath: string): string | null {
    let currentDir = path.dirname(filePath);

    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }
}