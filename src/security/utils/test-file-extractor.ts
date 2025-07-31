/**
 * テストファイル抽出ユーティリティ
 * プロジェクトからテストファイルを検索・抽出する
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { TestCase } from '../../types';

export class TestFileExtractor {
  /**
   * プロジェクトディレクトリからテストファイルを抽出
   * @param projectPath プロジェクトのルートパス
   * @returns テストケースの配列
   */
  static async extractFromProject(projectPath: string): Promise<TestCase[]> {
    const testPatterns = [
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js',
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.js'
    ];

    const ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.git/**'
    ];

    const testFiles: TestCase[] = [];

    for (const pattern of testPatterns) {
      const files = glob.sync(path.join(projectPath, pattern), {
        ignore: ignorePatterns,
        absolute: true
      });

      for (const filePath of files) {
        try {
          const content = await fs.promises.readFile(filePath, 'utf8');
          const relativePath = path.relative(projectPath, filePath);
          
          testFiles.push({
            filePath: relativePath,
            content,
            methods: this.extractTestMethods(content)
          });
        } catch (error) {
          console.warn(`警告: ファイル読み込みエラー ${filePath}:`, error.message);
        }
      }
    }

    return testFiles;
  }

  /**
   * テストファイルからテストメソッドを抽出
   * @param content ファイルの内容
   * @returns テストメソッド名の配列
   */
  private static extractTestMethods(content: string): string[] {
    const methods: string[] = [];
    
    // Jest/Mocha形式のテストメソッドを検出
    const testPatterns = [
      /(?:it|test|describe)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /(?:it|test|describe)\.(?:each|only|skip)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of testPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        methods.push(match[1]);
      }
    }

    return methods;
  }

  /**
   * ファイルがテストファイルかどうかを判定
   * @param filePath ファイルパス
   * @returns テストファイルの場合true
   */
  static isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.test\.[jt]sx?$/,
      /\.spec\.[jt]sx?$/,
      /__tests__\//
    ];

    return testPatterns.some(pattern => pattern.test(filePath));
  }
}