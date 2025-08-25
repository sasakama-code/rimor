/**
 * CLI引数セキュリティ - セキュリティ強化 v0.4.1
 * CLI引数の安全な処理と検証を提供
 */

import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';
import { errorHandler, ErrorType } from '../utils/errorHandler';

/**
 * CLI引数検証結果
 */
export interface CLIValidationResult {
  isValid: boolean;
  sanitizedValue?: string;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

/**
 * CLI引数セキュリティ制限
 */
export interface CLISecurityLimits {
  /** 最大パス長 */
  maxPathLength: number;
  /** 最大出力ファイルサイズ (bytes) */
  maxOutputFileSize: number;
  /** 許可されるファイル拡張子 */
  allowedOutputExtensions: string[];
  /** 禁止されるディレクトリパターン */
  forbiddenDirectoryPatterns: string[];
  /** 環境変数検証有効化 */
  validateEnvironmentVariables: boolean;
}

/**
 * デフォルトCLIセキュリティ制限
 */
export const DEFAULT_CLI_SECURITY_LIMITS: CLISecurityLimits = {
  maxPathLength: 1000,
  maxOutputFileSize: 100 * 1024 * 1024, // 100MB
  allowedOutputExtensions: ['.json', '.txt', '.csv', '.html', '.md'],
  forbiddenDirectoryPatterns: [
    '/etc/',
    '/root/',
    '/home/',
    '/var/log/',
    '/usr/bin/',
    '/bin/',
    '/sbin/',
    '/tmp/../',
    'C:\\Windows\\',
    'C:\\Program Files\\',
    'C:\\Users\\Administrator\\'
  ],
  validateEnvironmentVariables: true
};

/**
 * CLI引数セキュリティクラス
 */
export class CLISecurity {
  private limits: CLISecurityLimits;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd(), limits: CLISecurityLimits = DEFAULT_CLI_SECURITY_LIMITS) {
    this.projectRoot = projectRoot;
    this.limits = limits;
  }

  /**
   * 分析対象パスの検証
   */
  validateAnalysisPath(inputPath: string): CLIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    try {
      // 基本検証
      if (!inputPath || typeof inputPath !== 'string') {
        errors.push('パスが指定されていません');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // パス長制限
      if (inputPath.length > this.limits.maxPathLength) {
        errors.push(`パス長が制限を超過: ${inputPath.length} > ${this.limits.maxPathLength}`);
        securityIssues.push('DoS攻撃（長いパス）の可能性');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 危険なパターンの検出
      const dangerousPatterns = [
        { pattern: /\.\.\//g, issue: 'パストラバーサル攻撃' },
        { pattern: /\.\.\\/g, issue: 'パストラバーサル攻撃（Windows）' },
        { pattern: /\/etc\/|\/root\/|\/home\//gi, issue: 'システムディレクトリアクセス試行' },
        { pattern: /C:\\Windows\\|C:\\Program Files\\/gi, issue: 'Windowsシステムディレクトリアクセス試行' },
        { pattern: /^[a-zA-Z]:\\/gi, issue: '絶対パス使用（Windows）' },
        { pattern: /^\/[^.]/gi, issue: '絶対パス使用（Unix）' },
        { pattern: /\||\&\&|\;|\`/g, issue: 'コマンドインジェクション攻撃' },
        { pattern: /\$\{|\$\(/g, issue: '変数展開攻撃' },
        { pattern: /\0|%00/g, issue: 'NULL文字攻撃' },
        { pattern: /[<>"|*?]/g, issue: '無効なファイル名文字' }
      ];

      for (const { pattern, issue } of dangerousPatterns) {
        if (pattern.test(inputPath)) {
          securityIssues.push(issue);
          if (issue.includes('攻撃')) {
            errors.push(`危険なパターンを検出: ${issue}`);
          } else {
            warnings.push(`疑わしいパターンを検出: ${issue}`);
          }
        }
      }

      // 禁止ディレクトリパターンのチェック
      for (const forbiddenPattern of this.limits.forbiddenDirectoryPatterns) {
        if (inputPath.includes(forbiddenPattern)) {
          errors.push(`禁止されたディレクトリへのアクセス: ${forbiddenPattern}`);
          securityIssues.push('システムディレクトリアクセス攻撃');
        }
      }

      // パス解決と検証
      let resolvedPath: string;
      try {
        resolvedPath = path.resolve(inputPath);
      } catch (error) {
        errors.push('パスの解決に失敗しました');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // プロジェクト範囲外アクセスの検証（相対パスの場合のみ）
      if (!path.isAbsolute(inputPath)) {
        const safePath = PathSecurity.safeResolve(inputPath, this.projectRoot, 'cli-analysis-path');
        if (!safePath) {
          errors.push('プロジェクト範囲外へのアクセスが検出されました');
          securityIssues.push('パストラバーサル攻撃');
          return { isValid: false, errors, warnings, securityIssues };
        }
        resolvedPath = safePath;
      }

      // ファイル/ディレクトリ存在確認
      if (!fs.existsSync(resolvedPath)) {
        warnings.push('指定されたパスは存在しません');
      } else {
        const stats = fs.statSync(resolvedPath);
        if (!stats.isFile() && !stats.isDirectory()) {
          warnings.push('指定されたパスは通常のファイルまたはディレクトリではありません');
        }
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: resolvedPath,
        errors,
        warnings,
        securityIssues
      };

    } catch (error) {
      errors.push('パス検証中に予期しないエラーが発生しました');
      securityIssues.push('パス検証攻撃の可能性');
      return { isValid: false, errors, warnings, securityIssues };
    }
  }

  /**
   * 出力ファイルパスの検証
   */
  validateOutputPath(outputPath: string): CLIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    try {
      // 基本検証
      if (!outputPath || typeof outputPath !== 'string') {
        return { isValid: true, errors, warnings, securityIssues }; // 出力パスは任意
      }

      // パス長制限
      if (outputPath.length > this.limits.maxPathLength) {
        errors.push(`出力パス長が制限を超過: ${outputPath.length} > ${this.limits.maxPathLength}`);
        securityIssues.push('DoS攻撃（長い出力パス）の可能性');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 危険なパターンの検出
      const dangerousPatterns = [
        { pattern: /\.\.\//g, issue: 'パストラバーサル攻撃' },
        { pattern: /\.\.\\/g, issue: 'パストラバーサル攻撃（Windows）' },
        { pattern: /\/etc\/|\/root\/|\/home\//gi, issue: 'システムディレクトリ書き込み試行' },
        { pattern: /C:\\Windows\\|C:\\Program Files\\/gi, issue: 'Windowsシステムディレクトリ書き込み試行' },
        { pattern: /\||\&\&|\;|\`/g, issue: 'コマンドインジェクション攻撃' },
        { pattern: /\$\{|\$\(/g, issue: '変数展開攻撃' },
        { pattern: /\0|%00/g, issue: 'NULL文字攻撃' },
        { pattern: /[<>"|*?]/g, issue: '無効なファイル名文字' }
      ];

      for (const { pattern, issue } of dangerousPatterns) {
        if (pattern.test(outputPath)) {
          securityIssues.push(issue);
          if (issue.includes('攻撃') || issue.includes('試行')) {
            errors.push(`危険なパターンを検出: ${issue}`);
          } else {
            warnings.push(`疑わしいパターンを検出: ${issue}`);
          }
        }
      }

      // 禁止ディレクトリパターンのチェック
      for (const forbiddenPattern of this.limits.forbiddenDirectoryPatterns) {
        if (outputPath.includes(forbiddenPattern)) {
          errors.push(`禁止されたディレクトリへの出力: ${forbiddenPattern}`);
          securityIssues.push('システムディレクトリ書き込み攻撃');
        }
      }

      // 拡張子の検証
      const extension = path.extname(outputPath).toLowerCase();
      if (extension && !this.limits.allowedOutputExtensions.includes(extension)) {
        errors.push(`許可されていない拡張子: ${extension}`);
        securityIssues.push('実行可能ファイル生成攻撃の可能性');
      }

      // パス解決と検証
      let resolvedPath: string;
      try {
        resolvedPath = path.resolve(outputPath);
      } catch (error) {
        errors.push('出力パスの解決に失敗しました');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 出力ディレクトリの存在確認と作成権限チェック
      const outputDir = path.dirname(resolvedPath);
      if (!fs.existsSync(outputDir)) {
        try {
          // 親ディレクトリの書き込み権限チェック
          const parentDir = path.dirname(outputDir);
          if (fs.existsSync(parentDir)) {
            fs.accessSync(parentDir, fs.constants.W_OK);
          } else {
            warnings.push('出力ディレクトリの親ディレクトリが存在しません');
          }
        } catch (error) {
          errors.push('出力ディレクトリへの書き込み権限がありません');
          securityIssues.push('権限昇格攻撃の可能性');
        }
      } else {
        // 既存ファイルの上書き確認
        if (fs.existsSync(resolvedPath)) {
          const stats = fs.statSync(resolvedPath);
          if (stats.size > this.limits.maxOutputFileSize) {
            warnings.push('出力ファイルが大きすぎます（上書きされます）');
            securityIssues.push('ディスク使用量攻撃の可能性');
          }
        }
      }

      // プロジェクト範囲外書き込みの検証（相対パスの場合のみ）
      if (!path.isAbsolute(outputPath)) {
        const safePath = PathSecurity.safeResolve(outputPath, this.projectRoot, 'cli-output-path');
        if (!safePath) {
          errors.push('プロジェクト範囲外への出力が検出されました');
          securityIssues.push('パストラバーサル攻撃');
          return { isValid: false, errors, warnings, securityIssues };
        }
        resolvedPath = safePath;
      }

      return {
        isValid: errors.length === 0,
        sanitizedValue: resolvedPath,
        errors,
        warnings,
        securityIssues
      };

    } catch (error) {
      errors.push('出力パス検証中に予期しないエラーが発生しました');
      securityIssues.push('出力パス検証攻撃の可能性');
      return { isValid: false, errors, warnings, securityIssues };
    }
  }

  /**
   * 環境変数の検証
   */
  validateEnvironmentVariables(): CLIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    if (!this.limits.validateEnvironmentVariables) {
      return { isValid: true, errors, warnings, securityIssues };
    }

    try {
      // 危険な環境変数の検出
      const dangerousEnvVars = [
        'LD_PRELOAD',
        'LD_LIBRARY_PATH',
        'DYLD_INSERT_LIBRARIES',
        'DYLD_LIBRARY_PATH',
        'PATH_ORIGINAL',
        'SHELL_OVERRIDE',
        'NODE_OPTIONS'
      ];

      for (const envVar of dangerousEnvVars) {
        if (process.env[envVar]) {
          warnings.push(`危険な環境変数が設定されています: ${envVar}`);
          securityIssues.push('環境変数インジェクション攻撃の可能性');
        }
      }

      // RIMOR固有の環境変数の検証
      const rimorLang = process.env.RIMOR_LANG;
      if (rimorLang) {
        // 言語設定の検証
        const allowedLanguages = ['ja', 'en', 'zh', 'ko'];
        if (!allowedLanguages.includes(rimorLang)) {
          warnings.push(`未対応の言語設定: ${rimorLang}`);
          securityIssues.push('環境変数操作攻撃の可能性');
        }

        // 危険なパターンの検出
        if (/[^a-zA-Z_-]/.test(rimorLang)) {
          errors.push('RIMOR_LANGに無効な文字が含まれています');
          securityIssues.push('環境変数インジェクション攻撃');
        }
      }

      // NODE_ENVの検証
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv) {
        const allowedEnvs = ['development', 'production', 'test'];
        if (!allowedEnvs.includes(nodeEnv)) {
          warnings.push(`未対応のNODE_ENV設定: ${nodeEnv}`);
        }

        if (/[^a-zA-Z_-]/.test(nodeEnv)) {
          errors.push('NODE_ENVに無効な文字が含まれています');
          securityIssues.push('環境変数インジェクション攻撃');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        securityIssues
      };

    } catch (error) {
      errors.push('環境変数検証中に予期しないエラーが発生しました');
      securityIssues.push('環境変数検証攻撃の可能性');
      return { isValid: false, errors, warnings, securityIssues };
    }
  }

  /**
   * フォーマット引数の検証
   */
  validateFormat(format: string): CLIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    try {
      if (!format || typeof format !== 'string') {
        return { isValid: true, sanitizedValue: 'text', errors, warnings, securityIssues };
      }

      // 許可されたフォーマット
      const allowedFormats = ['text', 'json', 'csv', 'html', 'markdown', 'ai-json'];
      
      if (!allowedFormats.includes(format.toLowerCase())) {
        errors.push(`未対応のフォーマット: ${format}`);
        securityIssues.push('フォーマット指定攻撃の可能性');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 危険なパターンの検出
      if (/[^a-zA-Z0-9_-]/.test(format)) {
        errors.push('フォーマット指定に無効な文字が含まれています');
        securityIssues.push('フォーマットインジェクション攻撃');
        return { isValid: false, errors, warnings, securityIssues };
      }

      return {
        isValid: true,
        sanitizedValue: format.toLowerCase(),
        errors,
        warnings,
        securityIssues
      };

    } catch (error) {
      errors.push('フォーマット検証中に予期しないエラーが発生しました');
      securityIssues.push('フォーマット検証攻撃の可能性');
      return { isValid: false, errors, warnings, securityIssues };
    }
  }

  /**
   * すべてのCLI引数を一括検証
   */
  validateAllArguments(args: {
    path?: string;
    format?: string;
    outputFile?: string;
  }): {
    isValid: boolean;
    sanitizedArgs: {
      path?: string;
      format?: 'text' | 'json' | 'csv' | 'html' | 'markdown' | 'ai-json';
      outputFile?: string;
    };
    allErrors: string[];
    allWarnings: string[];
    allSecurityIssues: string[];
  } {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const allSecurityIssues: string[] = [];
    const sanitizedArgs: {
      path?: string;
      format?: 'text' | 'json' | 'csv' | 'html' | 'markdown' | 'ai-json';
      outputFile?: string;
    } = {};

    // 環境変数検証
    const envValidation = this.validateEnvironmentVariables();
    allErrors.push(...envValidation.errors);
    allWarnings.push(...envValidation.warnings);
    allSecurityIssues.push(...envValidation.securityIssues);

    // パス検証
    if (args.path) {
      const pathValidation = this.validateAnalysisPath(args.path);
      allErrors.push(...pathValidation.errors);
      allWarnings.push(...pathValidation.warnings);
      allSecurityIssues.push(...pathValidation.securityIssues);
      if (pathValidation.isValid) {
        sanitizedArgs.path = pathValidation.sanitizedValue;
      }
    }

    // フォーマット検証
    const formatValidation = this.validateFormat(args.format || 'text');
    allErrors.push(...formatValidation.errors);
    allWarnings.push(...formatValidation.warnings);
    allSecurityIssues.push(...formatValidation.securityIssues);
    if (formatValidation.isValid) {
      sanitizedArgs.format = formatValidation.sanitizedValue as 'text' | 'json' | 'csv' | 'html';
    }

    // 出力ファイル検証
    if (args.outputFile) {
      const outputValidation = this.validateOutputPath(args.outputFile);
      allErrors.push(...outputValidation.errors);
      allWarnings.push(...outputValidation.warnings);
      allSecurityIssues.push(...outputValidation.securityIssues);
      if (outputValidation.isValid) {
        sanitizedArgs.outputFile = outputValidation.sanitizedValue;
      }
    }

    return {
      isValid: allErrors.length === 0,
      sanitizedArgs,
      allErrors,
      allWarnings,
      allSecurityIssues
    };
  }

  /**
   * セキュリティ制限の更新
   */
  updateLimits(newLimits: Partial<CLISecurityLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }
}