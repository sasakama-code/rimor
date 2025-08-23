/**
 * ファイル探索ユーティリティ
 * プロジェクトディレクトリを再帰的に探索し、分析対象ファイルを収集
 * SOLID原則: 単一責任 - ファイル探索のみに責務を集中
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FileScannerConfig {
  /** 対象ファイル拡張子 */
  extensions: string[];
  /** ファイル名パターン（*.test.*, *.spec.*など） */
  filePatterns?: string[];
  /** 除外ディレクトリ */
  excludeDirectories: string[];
  /** 除外ファイルパターン */
  excludePatterns: RegExp[];
  /** 最大ファイル数（Defensive Programming） */
  maxFiles?: number;
}

export interface ScanResult {
  /** ソースファイル */
  sourceFiles: string[];
  /** テストファイル */
  testFiles: string[];
  /** 設定ファイル */
  configFiles: string[];
  /** 統計情報 */
  statistics: {
    totalFiles: number;
    scannedDirectories: number;
    excludedFiles: number;
    scanTime: number;
  };
}

/**
 * ファイルスキャナー
 * DRY原則: ファイル探索ロジックの一元化
 */
export class FileScanner {
  private config: FileScannerConfig;
  private statistics = {
    totalFiles: 0,
    scannedDirectories: 0,
    excludedFiles: 0,
    scanTime: 0
  };

  constructor(config?: Partial<FileScannerConfig>) {
    this.config = {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      filePatterns: [],
      excludeDirectories: ['node_modules', '.git', 'dist', 'build', 'coverage', '.nyc_output', '.next', '.vscode'],
      excludePatterns: [
        /\.d\.ts$/, // TypeScript型定義ファイル
        /\.min\.(js|css)$/, // 最小化ファイル
        /\.map$/ // ソースマップ
      ],
      maxFiles: 10000,
      ...config
    };
  }

  /**
   * プロジェクトディレクトリをスキャン
   * Defensive Programming: 異常ケースの堅牢な処理
   */
  async scanProject(projectPath: string): Promise<ScanResult> {
    const startTime = performance.now();
    this.resetStatistics();

    // 入力検証
    if (!fs.existsSync(projectPath)) {
      throw new Error(`プロジェクトパスが存在しません: ${projectPath}`);
    }

    const stat = fs.statSync(projectPath);
    if (!stat.isDirectory()) {
      throw new Error(`プロジェクトパスがディレクトリではありません: ${projectPath}`);
    }

    const result: ScanResult = {
      sourceFiles: [],
      testFiles: [],
      configFiles: [],
      statistics: this.statistics
    };

    try {
      await this.scanDirectory(path.resolve(projectPath), result);
      
      this.statistics.scanTime = performance.now() - startTime;
      result.statistics = { ...this.statistics };

      return result;

    } catch (error) {
      throw new Error(`ファイルスキャンに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ディレクトリを再帰的にスキャン
   * KISS原則: シンプルな再帰処理
   */
  private async scanDirectory(dirPath: string, result: ScanResult): Promise<void> {
    // 最大ファイル数チェック（Defensive Programming）
    if (this.statistics.totalFiles >= (this.config.maxFiles || 10000)) {
      console.warn(`最大ファイル数に達しました: ${this.config.maxFiles}`);
      return;
    }

    try {
      const entries = fs.readdirSync(dirPath);
      this.statistics.scannedDirectories++;

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        
        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // 除外ディレクトリのチェック
            if (!this.shouldSkipDirectory(entry)) {
              await this.scanDirectory(fullPath, result);
            }
          } else if (stat.isFile()) {
            if (this.shouldIncludeFile(fullPath)) {
              this.categorizeFile(fullPath, result);
              this.statistics.totalFiles++;
            } else {
              this.statistics.excludedFiles++;
            }
          }
        } catch (error) {
          // 個別ファイルエラーはログのみ（Defensive Programming）
          console.debug(`ファイル処理エラー (${fullPath}):`, error);
        }
      }
    } catch (error) {
      console.warn(`ディレクトリ読み込みエラー (${dirPath}):`, error);
    }
  }

  /**
   * ディレクトリをスキップすべきかチェック
   * Open-Closed原則: 設定で拡張可能
   */
  private shouldSkipDirectory(dirName: string): boolean {
    return this.config.excludeDirectories.includes(dirName) || 
           dirName.startsWith('.');
  }

  /**
   * ファイルを含めるべきかチェック
   * Strategy Pattern準拠: 判定ロジックの分離
   */
  private shouldIncludeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // ファイル名パターンチェック（優先）
    if (this.config.filePatterns && this.config.filePatterns.length > 0) {
      const matchesPattern = this.config.filePatterns.some(pattern => 
        this.matchesFilePattern(fileName, pattern)
      );
      
      if (matchesPattern) {
        // パターンに一致する場合は拡張子チェックをスキップ
        return !this.isExcludedFile(fileName);
      } else {
        // パターンに一致しない場合は通常の拡張子チェック
        return this.config.extensions.includes(ext) && !this.isExcludedFile(fileName);
      }
    }

    // 拡張子チェック（通常のファイル）
    if (!this.config.extensions.includes(ext)) {
      return false;
    }

    return !this.isExcludedFile(fileName);
  }

  /**
   * ファイル名パターンマッチング
   * @param fileName ファイル名
   * @param pattern パターン（*.test.*, *.spec.*など）
   * @returns マッチするかどうか
   */
  private matchesFilePattern(fileName: string, pattern: string): boolean {
    // パターンを正規表現に変換
    // *.test.* → ^.*\.test\..*$
    // *.spec.* → ^.*\.spec\..*$
    const regexPattern = pattern
      .replace(/\./g, '\\.')  // ドットをエスケープ
      .replace(/\*/g, '.*');  // アスタリスクを.*に変換
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(fileName);
  }

  /**
   * 除外ファイルのチェック
   * @param fileName ファイル名
   * @returns 除外すべきファイルかどうか
   */
  private isExcludedFile(fileName: string): boolean {
    for (const pattern of this.config.excludePatterns) {
      if (pattern.test(fileName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * ファイルをカテゴリ別に分類
   * 単一責任の原則: ファイル分類専用
   */
  private categorizeFile(filePath: string, result: ScanResult): void {
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();

    // テストファイルの判定
    if (this.isTestFile(fileName, dirName)) {
      result.testFiles.push(filePath);
    }
    // 設定ファイルの判定
    else if (this.isConfigFile(fileName)) {
      result.configFiles.push(filePath);
    }
    // その他はソースファイル
    else {
      result.sourceFiles.push(filePath);
    }
  }

  /**
   * テストファイルかどうかチェック
   * YAGNI原則: 現時点で必要な判定条件のみ
   */
  private isTestFile(fileName: string, dirName: string): boolean {
    const testPatterns = [
      '.test.',
      '.spec.',
      '__tests__',
      '/test/',
      '/tests/',
      '\\test\\',
      '\\tests\\'
    ];

    return testPatterns.some(pattern => 
      fileName.includes(pattern) || dirName.includes(pattern)
    );
  }

  /**
   * 設定ファイルかどうかチェック
   */
  private isConfigFile(fileName: string): boolean {
    const configPatterns = [
      'package.json',
      'tsconfig.json',
      'jest.config.',
      'webpack.config.',
      '.eslintrc',
      '.prettierrc',
      'rimor.config.'
    ];

    return configPatterns.some(pattern => fileName.includes(pattern));
  }

  /**
   * 統計情報をリセット
   * DRY原則: 初期化処理の一元化
   */
  private resetStatistics(): void {
    this.statistics = {
      totalFiles: 0,
      scannedDirectories: 0,
      excludedFiles: 0,
      scanTime: 0
    };
  }

  /**
   * 特定拡張子のファイルのみを取得
   * インターフェース分離の原則: 特化した機能の提供
   */
  async getFilesByExtension(projectPath: string, extensions: string[]): Promise<string[]> {
    const originalConfig = { ...this.config };
    this.config.extensions = extensions;

    try {
      const result = await this.scanProject(projectPath);
      return [...result.sourceFiles, ...result.testFiles];
    } finally {
      this.config = originalConfig;
    }
  }

  /**
   * テストファイルのみを取得
   * 利便性のための専用メソッド
   */
  async getTestFiles(projectPath: string): Promise<string[]> {
    const result = await this.scanProject(projectPath);
    return result.testFiles;
  }

  /**
   * ソースファイルのみを取得
   * 利便性のための専用メソッド
   */
  async getSourceFiles(projectPath: string): Promise<string[]> {
    const result = await this.scanProject(projectPath);
    return result.sourceFiles;
  }
}

/**
 * デフォルトファイルスキャナーのインスタンス
 * Singleton Pattern: グローバルで使用可能
 */
export const defaultFileScanner = new FileScanner();