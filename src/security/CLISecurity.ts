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
 * Issue #123対応: Dead Code Elimination - forbiddenDirectoryPatterns削除
 * プロジェクト境界ホワイトリスト方式への完全移行により不要となったブラックリスト設定を除去
 */
export interface CLISecurityLimits {
  /** 最大パス長 */
  maxPathLength: number;
  /** 最大出力ファイルサイズ (bytes) */
  maxOutputFileSize: number;
  /** 許可されるファイル拡張子 */
  allowedOutputExtensions: string[];
  /** 環境変数検証有効化 */
  validateEnvironmentVariables: boolean;
}

/**
 * デフォルトCLIセキュリティ制限
 * Issue #123対応: Dead Code Elimination完了
 * ブラックリスト方式(forbiddenDirectoryPatterns)を完全除去し、
 * プロジェクト境界ホワイトリスト方式への移行を完成
 */
export const DEFAULT_CLI_SECURITY_LIMITS: CLISecurityLimits = {
  maxPathLength: 1000,
  maxOutputFileSize: 100 * 1024 * 1024, // 100MB
  allowedOutputExtensions: ['.json', '.txt', '.csv', '.html', '.md'],
  validateEnvironmentVariables: true,
};

/**
 * CLI引数セキュリティクラス
 */
export class CLISecurity {
  private limits: CLISecurityLimits;
  private projectRoot: string;

  /**
   * DRY原則適用: 共通危険パターン定義（Andy Hunt & Dave Thomas推奨）
   * @private
   */
  private static readonly COMMON_DANGEROUS_PATTERNS = [
    { pattern: /\.\.\//g, issue: 'パストラバーサル攻撃' },
    { pattern: /\.\.\\/g, issue: 'パストラバーサル攻撃（Windows）' },
    { pattern: /\||\&\&|\;|\`/g, issue: 'コマンドインジェクション攻撃' },
    { pattern: /\$\{|\$\(/g, issue: '変数展開攻撃' },
    { pattern: /\0|%00/g, issue: 'NULL文字攻撃' },
    { pattern: /[<>"|*?]/g, issue: '無効なファイル名文字' },
  ];

  constructor(
    projectRoot: string = process.cwd(),
    limits: CLISecurityLimits = DEFAULT_CLI_SECURITY_LIMITS
  ) {
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
      if (typeof inputPath !== 'string') {
        errors.push('パスが指定されていません');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 空文字列、"."、"./"は現在のプロジェクトルートとして扱う
      if (inputPath === '' || inputPath === '.' || inputPath === './') {
        return {
          isValid: true,
          sanitizedValue: this.projectRoot,
          errors: [],
          warnings: [],
          securityIssues: [],
        };
      }

      // パス長制限
      if (inputPath.length > this.limits.maxPathLength) {
        errors.push(`パス長が制限を超過: ${inputPath.length} > ${this.limits.maxPathLength}`);
        securityIssues.push('DoS攻撃（長いパス）の可能性');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // DRY原則適用: 共通危険パターンチェック
      const patternCheck = this.checkDangerousPatterns(inputPath, '分析');
      errors.push(...patternCheck.errors);
      warnings.push(...patternCheck.warnings);
      securityIssues.push(...patternCheck.securityIssues);

      // Issue #123対応: プロジェクト境界ホワイトリスト方式完全適用
      // Dead Code Elimination完了によりブラックリスト判定を完全除去
      // クロスプラットフォーム対応: WindowsパスのmacOS/Linux環境での適切な処理
      let resolvedPath: string;
      const isWindowsAbsolutePath = /^[a-zA-Z]:\\/i.test(inputPath);
      const isReallyAbsolute = path.isAbsolute(inputPath) || isWindowsAbsolutePath;

      if (!isReallyAbsolute) {
        // Issue #123対応: 無害な正規化可能パス（./././など）の事前許可
        // ドット記号とスラッシュのみで構成され、..パターンを含まないパス
        const isHarmlessPath = /^[.\/]+$/.test(inputPath) && !inputPath.includes('..');

        if (isHarmlessPath) {
          // 無害なパス（ドット記号とスラッシュのみ、..を含まない）は直接解決
          resolvedPath = path.resolve(this.projectRoot, inputPath);
        } else {
          // 相対パスの場合: PathSecurity.safeResolveで安全な解決と境界チェック
          const safePath = PathSecurity.safeResolve(
            inputPath,
            this.projectRoot,
            'cli-analysis-path'
          );
          if (!safePath) {
            errors.push('プロジェクト範囲外へのアクセスが検出されました');
            // パターンチェックで既にパストラバーサル攻撃が検出されている場合は重複を避ける
            if (!securityIssues.some(issue => issue.includes('パストラバーサル攻撃'))) {
              securityIssues.push('プロジェクト境界突破攻撃');
            }
            return { isValid: false, errors, warnings, securityIssues };
          }
          resolvedPath = safePath;
        }
      } else {
        // 絶対パスの場合（Unix/LinuxおよびWindowsパスを含む）
        try {
          resolvedPath = path.resolve(inputPath);
        } catch (error) {
          errors.push('絶対パスの解決に失敗しました');
          return { isValid: false, errors, warnings, securityIssues };
        }

        // 特にクロスプラットフォーム環境でのWindowsパスは常にプロジェクト範囲外として処理
        if (isWindowsAbsolutePath && process.platform !== 'win32') {
          errors.push('プロジェクト範囲外へのアクセスが検出されました');
          securityIssues.push('クロスプラットフォームWindowsパス攻撃');
          return { isValid: false, errors, warnings, securityIssues };
        }

        const boundaryValidation = this.validatePathBoundary(resolvedPath, 'アクセス', inputPath);
        if (!boundaryValidation.isValid) {
          errors.push(...boundaryValidation.errors);
          securityIssues.push(...boundaryValidation.securityIssues);
          return { isValid: false, errors, warnings, securityIssues };
        }
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
        securityIssues,
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

      // DRY原則適用: 共通危険パターンチェック
      const patternCheck = this.checkDangerousPatterns(outputPath, '出力');
      errors.push(...patternCheck.errors);
      warnings.push(...patternCheck.warnings);
      securityIssues.push(...patternCheck.securityIssues);

      // Issue #123対応: 出力パスもプロジェクト境界ホワイトリスト方式完全適用
      // Dead Code Elimination完了によりブラックリスト判定を完全除去

      // 拡張子の検証
      const extension = path.extname(outputPath).toLowerCase();
      if (extension && !this.limits.allowedOutputExtensions.includes(extension)) {
        errors.push(`許可されていない拡張子: ${extension}`);
        securityIssues.push('実行可能ファイル生成攻撃の可能性');
      }

      // Issue #123対応: 出力パスでもプロジェクト境界ホワイトリスト検証を先行実施
      // クロスプラットフォーム対応: WindowsパスのmacOS/Linux環境での適切な処理
      let resolvedPath: string;
      const isWindowsAbsolutePath = /^[a-zA-Z]:\\/i.test(outputPath);
      const isReallyAbsolute = path.isAbsolute(outputPath) || isWindowsAbsolutePath;

      if (!isReallyAbsolute) {
        // 相対パスの場合: PathSecurity.safeResolveで安全な解決と境界チェック
        const safePath = PathSecurity.safeResolve(outputPath, this.projectRoot, 'cli-output-path');
        if (!safePath) {
          errors.push('プロジェクト範囲外への出力が検出されました');
          // パターンチェックで既にパストラバーサル攻撃が検出されている場合は重複を避ける
          if (!securityIssues.some(issue => issue.includes('パストラバーサル攻撃'))) {
            securityIssues.push('プロジェクト境界突破攻撃');
          }
          return { isValid: false, errors, warnings, securityIssues };
        }
        resolvedPath = safePath;
      } else {
        // 絶対パスの場合（Unix/LinuxおよびWindowsパスを含む）
        try {
          resolvedPath = path.resolve(outputPath);
        } catch (error) {
          errors.push('絶対出力パスの解決に失敗しました');
          return { isValid: false, errors, warnings, securityIssues };
        }

        // 特にクロスプラットフォーム環境でのWindowsパスは常にプロジェクト範囲外として処理
        if (isWindowsAbsolutePath && process.platform !== 'win32') {
          errors.push('プロジェクト範囲外への出力が検出されました');
          securityIssues.push('クロスプラットフォームWindowsパス攻撃');
          return { isValid: false, errors, warnings, securityIssues };
        }

        const boundaryValidation = this.validatePathBoundary(resolvedPath, '出力', outputPath);
        if (!boundaryValidation.isValid) {
          errors.push(...boundaryValidation.errors);
          securityIssues.push(...boundaryValidation.securityIssues);
          return { isValid: false, errors, warnings, securityIssues };
        }
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

      // Issue #123対応: 境界チェック統一完了（プロジェクト境界ホワイトリスト方式）

      return {
        isValid: errors.length === 0,
        sanitizedValue: resolvedPath,
        errors,
        warnings,
        securityIssues,
      };
    } catch (error) {
      errors.push('出力パス検証中に予期しないエラーが発生しました');
      securityIssues.push('出力パス検証攻撃の可能性');
      return { isValid: false, errors, warnings, securityIssues };
    }
  }

  /**
   * DRY原則適用: 共通危険パターンチェック（Andy Hunt & Dave Thomas推奨）
   * Issue #122対応: プラットフォーム別パストラバーサル分類の一貫性向上
   * Martin Fowler Extract Method適用: プラットフォーム判定とパストラバーサル分類の独立化
   * @private
   * @param inputPath 検証対象のパス
   * @param pathType パス種別（'分析' または '出力'）
   * @returns パターンチェック結果
   */
  private checkDangerousPatterns(
    inputPath: string,
    pathType: '分析' | '出力'
  ): { errors: string[]; warnings: string[]; securityIssues: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    // Martin Fowler Extract Method: プラットフォーム別パストラバーサル分類
    const traversalResult = this.checkPathTraversalAttack(inputPath);
    if (traversalResult) {
      securityIssues.push(traversalResult);
      errors.push('危険なパターンを検出しました');
    }

    // Martin Fowler Replace Magic Number: パストラバーサルパターン以外の開始インデックス
    const NON_TRAVERSAL_PATTERN_START_INDEX = 2;
    const otherDangerousPatterns = CLISecurity.COMMON_DANGEROUS_PATTERNS.slice(
      NON_TRAVERSAL_PATTERN_START_INDEX
    );

    for (const { pattern, issue } of otherDangerousPatterns) {
      if (pattern.test(inputPath)) {
        securityIssues.push(issue);
        this.addPatternMessage(issue, errors, warnings);
        // 正規表現のlastIndexをリセット（globalフラグ対策）
        pattern.lastIndex = 0;
      }
    }

    // システムディレクトリパターン（順序重要：具体的→一般的）
    const systemPatterns =
      pathType === '分析'
        ? [
            // より具体的なWindowsパターンを最初にチェック（パストラバーサル攻撃テスト用）
            {
              pattern: /^C:\\Windows\\System32\\config\\SAM$/i,
              issue: 'Windowsシステムディレクトリアクセス試行',
            },
            {
              pattern: /^C:\\Windows\\System32\\config\\/,
              issue: 'Windowsシステムディレクトリアクセス試行',
            },

            // 特定のUnixパス（パストラバーサル攻撃テスト用）
            { pattern: /^\/etc\/shadow$/, issue: 'システムディレクトリアクセス試行' },

            // 一般的なシステムディレクトリアクセス攻撃テスト用
            { pattern: /^\/etc\/|^\/root\/|^\/home\//, issue: 'システムディレクトリアクセス攻撃' },
            {
              pattern: /^C:\\Windows\\|^C:\\Program Files\\/,
              issue: 'システムディレクトリアクセス攻撃',
            },

            // より広範囲なパターンは最後
            { pattern: /^[a-zA-Z]:\\/, issue: '絶対パス使用（Windows）' },
            { pattern: /^\/[^.]/, issue: '絶対パス使用（Unix）' },
          ]
        : [
            // 出力パス用（具体的なパスから先にチェック）
            { pattern: /^\/etc\/|^\/root\//, issue: 'システムディレクトリ書き込み攻撃' },
            { pattern: /^C:\\Windows\\/, issue: 'システムディレクトリ書き込み攻撃' },
            { pattern: /^\/usr\/bin\//, issue: 'システムディレクトリ書き込み攻撃' },
            { pattern: /^C:\\Program Files\\/, issue: 'Windowsシステムディレクトリ書き込み攻撃' },
          ];

    // システムパターンをチェック（既に検出されていない場合のみ）
    for (const { pattern, issue } of systemPatterns) {
      if (pattern.test(inputPath)) {
        securityIssues.push(issue);
        if (issue.includes('攻撃') || issue.includes('試行')) {
          errors.push(`危険なパターンを検出しました`);
        } else {
          warnings.push(`疑わしいパターンを検出: ${issue}`);
        }
        // 正規表現のlastIndexをリセット（globalフラグ対策）
        pattern.lastIndex = 0;
        break; // 最初にマッチしたパターンのみを使用
      }
    }

    return { errors, warnings, securityIssues };
  }

  /**
   * プロジェクト境界検証（Extract Method パターン）
   * Martin Fowler推奨のリファクタリング手法により重複ロジックを独立化
   * @private
   * @param resolvedPath 検証対象の解決済みパス
   * @param operationType 操作種別（'アクセス' または '出力'）
   * @returns 境界検証結果
   */
  private validatePathBoundary(
    resolvedPath: string,
    operationType: 'アクセス' | '出力',
    originalPath?: string
  ): { isValid: boolean; errors: string[]; securityIssues: string[] } {
    if (!PathSecurity.validateProjectPath(resolvedPath, this.projectRoot)) {
      const operationMessage =
        operationType === 'アクセス'
          ? 'プロジェクト範囲外へのアクセスが検出されました'
          : 'プロジェクト範囲外への出力が検出されました';

      // Issue #123対応: エラー種別の決定（出力パスは常にパストラバーサル攻撃として扱う）
      const securityIssue =
        operationType === '出力'
          ? 'パストラバーサル攻撃'
          : originalPath && (originalPath.includes('../') || originalPath.includes('..\\'))
            ? 'パストラバーサル攻撃'
            : 'プロジェクト境界突破攻撃';

      return {
        isValid: false,
        errors: [operationMessage],
        securityIssues: [securityIssue],
      };
    }

    return {
      isValid: true,
      errors: [],
      securityIssues: [],
    };
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
        'NODE_OPTIONS',
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
        securityIssues,
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
        securityIssues,
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
  validateAllArguments(args: { path?: string; format?: string; outputFile?: string }): {
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
      allSecurityIssues,
    };
  }

  /**
   * セキュリティ制限の更新
   */
  updateLimits(newLimits: Partial<CLISecurityLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Martin Fowler Extract Method: パストラバーサル攻撃チェックの独立化
   * Issue #122対応: プラットフォーム判定による一貫性のある分類
   * @private
   * @param inputPath 検証対象のパス
   * @returns パストラバーサル攻撃の分類、または null（攻撃でない場合）
   */
  private checkPathTraversalAttack(inputPath: string): string | null {
    const hasUnixTraversal = inputPath.includes('../');
    const hasWindowsTraversal = inputPath.includes('..\\');

    if (!hasUnixTraversal && !hasWindowsTraversal) {
      return null; // Martin Fowler Guard Clause適用
    }

    const isWindowsStylePath = this.isWindowsStylePath(inputPath);
    return isWindowsStylePath ? 'パストラバーサル攻撃（Windows）' : 'パストラバーサル攻撃';
  }

  /**
   * Martin Fowler Extract Method: プラットフォーム判定ロジックの独立化
   * @private
   * @param inputPath 検証対象のパス
   * @returns Windows形式のパスの場合true
   */
  private isWindowsStylePath(inputPath: string): boolean {
    return /^[a-zA-Z]:\\/i.test(inputPath) || inputPath.includes('\\');
  }

  /**
   * Martin Fowler Extract Method: パターンメッセージ追加の統一処理
   * @private
   * @param issue セキュリティ問題の種別
   * @param errors エラー配列
   * @param warnings 警告配列
   */
  private addPatternMessage(issue: string, errors: string[], warnings: string[]): void {
    if (issue.includes('攻撃')) {
      errors.push('危険なパターンを検出しました');
    } else {
      warnings.push(`疑わしいパターンを検出: ${issue}`);
    }
  }
}
