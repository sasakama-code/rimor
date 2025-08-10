/**
 * MetricsCalculator
 * Issue #65: メトリクス計算専用モジュール
 * 
 * SOLID原則: 単一責任（メトリクス計算のみ）
 * DRY原則: 計算ロジックの共通化
 * KISS原則: シンプルな計算アルゴリズム
 * YAGNI原則: 必要最小限の機能実装
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { 
  ProjectMetrics,
  ComplexityMetrics,
  MaintainabilityMetrics,
  TestabilityMetrics,
  DocumentationMetrics
} from '../types';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

/**
 * プロジェクトメトリクスを計算する専用クラス
 */
export class MetricsCalculator {
  /**
   * プロジェクト全体のメトリクスを計算
   */
  async calculateProjectMetrics(projectPath: string): Promise<ProjectMetrics> {
    const files = this.getAllFiles(projectPath);
    const codeFiles = files.filter(file => this.isCodeFile(file));
    const testFiles = files.filter(file => this.isTestFile(file));
    const codeContents = await this.readAllCodeFiles(codeFiles);
    
    const complexity = await this.calculateComplexityMetrics(codeContents, codeFiles);
    const maintainability = await this.calculateMaintainabilityMetrics(codeContents, codeFiles);
    const testability = await this.calculateTestabilityMetrics(codeFiles, testFiles, codeContents);
    const documentation = await this.calculateDocumentationMetrics(codeFiles, codeContents);
    
    return {
      complexity,
      maintainability,
      testability,
      documentation
    };
  }
  
  /**
   * サイクロマティック複雑度を計算
   */
  calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // ベース複雑度
    
    // 分岐文をカウント
    const patterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*[^:]+:/g, // 三項演算子
      /\|\|/g, // OR演算子
      /&&/g   // AND演算子
    ];
    
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    // else ifは二重カウントを避ける
    const elseIfMatches = code.match(/\belse\s+if\b/g);
    if (elseIfMatches) {
      complexity -= elseIfMatches.length; // else ifで1回多くカウントされているため
    }
    
    return complexity;
  }
  
  /**
   * ネストの深さを計算
   */
  calculateNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }
  
  /**
   * 保守性インデックスを計算
   * Maintainability Index = 171 - 5.2 * ln(HV) - 0.23 * CC - 16.2 * ln(LOC)
   * 簡略化版
   */
  calculateMaintainabilityIndex(code: string): number {
    const lines = code.split('\n').filter(line => line.trim().length > 0).length;
    const complexity = this.calculateCyclomaticComplexity(code);
    
    // 簡略化した計算
    const index = 171 - 5.2 * Math.log(lines * 10) - 0.23 * complexity - 16.2 * Math.log(lines);
    
    // 0-100の範囲に正規化
    return Math.max(0, Math.min(100, index));
  }
  
  /**
   * コード重複を検出
   */
  detectCodeDuplication(files: Map<string, string>): {
    percentage: number;
    locations: string[];
  } {
    const lines: Map<string, string[]> = new Map();
    const duplicates: Set<string> = new Set();
    const locations: Set<string> = new Set();
    
    // 各ファイルの行を収集
    files.forEach((content, filePath) => {
      const fileLines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10); // 短い行は除外
      
      fileLines.forEach(line => {
        const existing = lines.get(line);
        if (existing) {
          duplicates.add(line);
          locations.add(filePath);
          existing.forEach(loc => locations.add(loc));
        } else {
          lines.set(line, [filePath]);
        }
      });
    });
    
    const totalLines = Array.from(lines.keys()).length;
    const percentage = totalLines > 0 ? (duplicates.size / totalLines) * 100 : 0;
    
    return {
      percentage,
      locations: Array.from(locations)
    };
  }
  
  /**
   * テストカバレッジ可能性を評価
   */
  calculateTestability(sourceFiles: string[], testFiles: string[]): {
    coverage: number;
    untestedFiles: string[];
  } {
    const untestedFiles: string[] = [];
    
    sourceFiles.forEach(sourceFile => {
      const baseName = path.basename(sourceFile, path.extname(sourceFile));
      const hasTest = testFiles.some(testFile => 
        testFile.includes(baseName) && testFile.includes('test')
      );
      
      if (!hasTest) {
        untestedFiles.push(sourceFile);
      }
    });
    
    const coverage = sourceFiles.length > 0 
      ? (sourceFiles.length - untestedFiles.length) / sourceFiles.length 
      : 0;
    
    return {
      coverage,
      untestedFiles
    };
  }
  
  /**
   * テスト可能性スコアを計算
   */
  calculateTestabilityScore(code: string): number {
    let score = 100;
    
    // 依存関係の数をチェック
    const constructorMatch = code.match(/constructor\s*\(([^)]*)\)/);
    if (constructorMatch) {
      const params = constructorMatch[1].split(',').filter(p => p.trim().length > 0);
      score -= params.length * 5; // 各依存関係で5ポイント減点
    }
    
    // privateメソッドの数をチェック
    const privateMethodCount = (code.match(/private\s+\w+\s*\(/g) || []).length;
    score -= privateMethodCount * 3; // 各privateメソッドで3ポイント減点
    
    // 複雑度をチェック
    const complexity = this.calculateCyclomaticComplexity(code);
    if (complexity > 10) {
      score -= (complexity - 10) * 2;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * ドキュメント化率を計算
   */
  calculateDocumentationCoverage(code: string): number {
    // JSDocコメントを持つ関数/クラスをカウント
    const jsdocPattern = /\/\*\*[\s\S]*?\*\/\s*(?:function|class|interface|export\s+(?:function|class))/g;
    const documentedCount = (code.match(jsdocPattern) || []).length;
    
    // 全体の関数/クラスをカウント
    const functionPattern = /(?:function|class|interface)\s+\w+/g;
    const totalCount = (code.match(functionPattern) || []).length;
    
    return totalCount > 0 ? documentedCount / totalCount : 0;
  }
  
  /**
   * コメント密度を計算
   */
  calculateCommentDensity(code: string): number {
    const lines = code.split('\n');
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    }).length;
    
    return lines.length > 0 ? commentLines / lines.length : 0;
  }
  
  /**
   * メトリクスの総合レポートを生成
   */
  generateMetricsReport(metrics: ProjectMetrics): string {
    const lines = [
      '=== Project Metrics Report ===',
      '',
      '## Complexity',
      `Average Cyclomatic Complexity: ${metrics.complexity.averageCyclomaticComplexity.toFixed(2)}`,
      `Maximum Complexity: ${metrics.complexity.maxComplexity}`,
      `Total Functions: ${metrics.complexity.totalFunctions}`,
      `Average Function Length: ${metrics.complexity.averageFunctionLength.toFixed(0)} lines`,
      '',
      '## Maintainability',
      `Maintainability Index: ${metrics.maintainability.maintainabilityIndex.toFixed(1)}`,
      `Average File Size: ${metrics.maintainability.averageFileSize} lines`,
      `Code Duplication: ${metrics.maintainability.duplicatedCodePercentage.toFixed(1)}%`,
      '',
      '## Testability',
      `Test Coverage: ${(metrics.testability.testCoverage * 100).toFixed(1)}%`,
      `Testable Classes: ${metrics.testability.testableClasses}`,
      `Untestable Classes: ${metrics.testability.untestableClasses}`,
      `Mockability: ${(metrics.testability.mockability * 100).toFixed(1)}%`,
      '',
      '## Documentation',
      `Documented Functions: ${metrics.documentation.documentedFunctions}`,
      `Documented Classes: ${metrics.documentation.documentedClasses}`,
      `Documentation Coverage: ${(metrics.documentation.documentationCoverage * 100).toFixed(1)}%`,
      `README Quality: ${(metrics.documentation.readmeQuality * 100).toFixed(1)}%`
    ];
    
    return lines.join('\n');
  }
  
  /**
   * 複雑度メトリクスを計算
   */
  private async calculateComplexityMetrics(
    codeContents: Map<string, string>,
    files: string[]
  ): Promise<ComplexityMetrics> {
    let totalComplexity = 0;
    let maxComplexity = 1;
    let totalFunctions = 0;
    let totalFunctionLength = 0;
    const complexFiles: string[] = [];
    
    codeContents.forEach((content, filePath) => {
      const complexity = this.calculateCyclomaticComplexity(content);
      totalComplexity += complexity;
      maxComplexity = Math.max(maxComplexity, complexity);
      
      if (complexity > 10) {
        complexFiles.push(filePath);
      }
      
      // 関数数と長さをカウント（簡易版）
      const functions = (content.match(/function|=>|\w+\s*\(/g) || []).length;
      totalFunctions += functions;
      totalFunctionLength += functions * 15; // 簡易的に15行と仮定
    });
    
    return {
      averageCyclomaticComplexity: files.length > 0 ? totalComplexity / files.length : 0,
      maxComplexity,
      complexFiles,
      totalFunctions,
      averageFunctionLength: totalFunctions > 0 ? totalFunctionLength / totalFunctions : 0
    };
  }
  
  /**
   * 保守性メトリクスを計算
   */
  private async calculateMaintainabilityMetrics(
    codeContents: Map<string, string>,
    files: string[]
  ): Promise<MaintainabilityMetrics> {
    let totalIndex = 0;
    let totalLines = 0;
    const largeFiles: string[] = [];
    const longFunctions: string[] = [];
    
    codeContents.forEach((content, filePath) => {
      const index = this.calculateMaintainabilityIndex(content);
      totalIndex += index;
      
      const lines = content.split('\n').length;
      totalLines += lines;
      
      // 大きいファイルの検出
      if (lines > 500) {
        largeFiles.push(filePath);
      }
      
      // 長い関数の検出（簡易版）
      if (lines > 100) {
        longFunctions.push(filePath);
      }
    });
    
    const duplicationResult = this.detectCodeDuplication(codeContents);
    
    return {
      maintainabilityIndex: files.length > 0 ? totalIndex / files.length : 0,
      duplicatedCodePercentage: duplicationResult.percentage,
      averageFileSize: files.length > 0 ? totalLines / files.length : 0,
      largeFiles,
      longFunctions
    };
  }
  
  /**
   * テスタビリティメトリクスを計算
   */
  private async calculateTestabilityMetrics(
    codeFiles: string[],
    testFiles: string[],
    codeContents: Map<string, string>
  ): Promise<TestabilityMetrics> {
    const testabilityResult = this.calculateTestability(codeFiles, testFiles);
    
    let testableClasses = 0;
    let untestableClasses = 0;
    
    codeContents.forEach((content) => {
      const score = this.calculateTestabilityScore(content);
      
      // クラスのテスタビリティを評価
      const classes = (content.match(/class\s+\w+/g) || []).length;
      if (classes > 0) {
        if (score > 60) {
          testableClasses += classes;
        } else {
          untestableClasses += classes;
        }
      }
    });
    
    // モック可能性の計算（簡易版）
    const mockability = testableClasses > 0 
      ? testableClasses / (testableClasses + untestableClasses)
      : 0;
    
    return {
      testCoverage: testabilityResult.coverage,
      testableClasses,
      untestableClasses,
      mockability
    };
  }
  
  /**
   * ドキュメンテーションメトリクスを計算
   */
  private async calculateDocumentationMetrics(
    files: string[],
    codeContents: Map<string, string>
  ): Promise<DocumentationMetrics> {
    let documentedFunctions = 0;
    let documentedClasses = 0;
    let totalFunctions = 0;
    let totalClasses = 0;
    
    codeContents.forEach((content) => {
      // JSDocコメントを持つ関数/クラスをカウント
      const jsdocFunctions = (content.match(/\/\*\*[\s\S]*?\*\/\s*(?:function|async\s+function)/g) || []).length;
      const jsdocClasses = (content.match(/\/\*\*[\s\S]*?\*\/\s*class/g) || []).length;
      
      documentedFunctions += jsdocFunctions;
      documentedClasses += jsdocClasses;
      
      // 全体の関数/クラスをカウント
      const functions = (content.match(/function|async\s+function|\w+\s*\(.*?\)\s*=>/g) || []).length;
      const classes = (content.match(/class\s+\w+/g) || []).length;
      
      totalFunctions += functions;
      totalClasses += classes;
    });
    
    const documentationCoverage = (totalFunctions + totalClasses) > 0
      ? (documentedFunctions + documentedClasses) / (totalFunctions + totalClasses)
      : 0;
    
    // README品質の簡易評価
    const readmeQuality = 0.7; // 簡易実装
    
    return {
      documentedFunctions,
      documentedClasses,
      documentationCoverage,
      readmeQuality
    };
  }
  
  /**
   * すべてのファイルを取得
   */
  private getAllFiles(projectPath: string): string[] {
    const pattern = path.join(projectPath, '**/*.{js,jsx,ts,tsx}');
    return glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
  }
  
  /**
   * コードファイルかどうかを判定
   */
  private isCodeFile(file: string): boolean {
    return !this.isTestFile(file) && !file.includes('config') && !file.includes('.d.ts');
  }
  
  /**
   * テストファイルかどうかを判定
   */
  private isTestFile(file: string): boolean {
    return file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__');
  }
  
  /**
   * すべてのコードファイルを読み込み
   */
  private async readAllCodeFiles(files: string[]): Promise<Map<string, string>> {
    const contents = new Map<string, string>();
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        contents.set(file, content);
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return contents;
  }
}