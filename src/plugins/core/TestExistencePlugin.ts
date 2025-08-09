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

export class TestExistencePlugin extends BasePlugin {
  id = 'test-existence';
  name = 'Test File Existence Checker';
  version = '1.0.0';
  type = 'core' as const;
  
  private config?: PluginConfig;

  constructor(config?: PluginConfig) {
    super();
    this.config = config;
  }

  isApplicable(context: ProjectContext): boolean {
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
      confidence: patterns.length > 0 ? 
        patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 1
    };
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
        type: 'missing-test',
        severity: 'high' as const,
        message: `テストファイルが存在しません: ${maskedPath}`
      }];
    }

    return [];
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