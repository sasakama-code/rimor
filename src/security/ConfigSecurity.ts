/**
 * 設定ファイルセキュリティ - セキュリティ強化 v0.4.1
 * 設定ファイルの安全な読み込み・解析・検証を提供
 */

import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';
import { errorHandler, ErrorType } from '../utils/errorHandler';

/**
 * 設定ファイルセキュリティ制限
 */
export interface ConfigSecurityLimits {
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 最大オブジェクト深度 */
  maxObjectDepth: number;
  /** 最大プロパティ数 */
  maxProperties: number;
  /** 最大配列長 */
  maxArrayLength: number;
  /** 最大文字列長 */
  maxStringLength: number;
}

/**
 * デフォルトセキュリティ制限
 */
export const DEFAULT_CONFIG_SECURITY_LIMITS: ConfigSecurityLimits = {
  maxFileSize: 512 * 1024, // 512KB
  maxObjectDepth: 5,
  maxProperties: 100,
  maxArrayLength: 50,
  maxStringLength: 500
};

/**
 * 設定ファイル検証結果
 */
export interface ConfigValidationResult {
  isValid: boolean;
  sanitizedConfig?: any;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

/**
 * セキュア設定ファイル処理クラス
 */
export class ConfigSecurity {
  private limits: ConfigSecurityLimits;

  constructor(limits: ConfigSecurityLimits = DEFAULT_CONFIG_SECURITY_LIMITS) {
    this.limits = limits;
  }

  /**
   * 設定ファイルの安全な読み込みと検証
   */
  async loadAndValidateConfig(configPath: string, projectRoot: string): Promise<ConfigValidationResult> {
    try {
      // パス検証
      if (!PathSecurity.validateProjectPath(configPath, projectRoot)) {
        return {
          isValid: false,
          errors: ['設定ファイルのパスが不正です'],
          warnings: [],
          securityIssues: ['パストラバーサル攻撃を検出']
        };
      }

      // ファイル存在確認
      if (!fs.existsSync(configPath)) {
        return {
          isValid: false,
          errors: ['設定ファイルが存在しません'],
          warnings: [],
          securityIssues: []
        };
      }

      // ファイルサイズチェック
      const fileStats = fs.statSync(configPath);
      if (fileStats.size > this.limits.maxFileSize) {
        return {
          isValid: false,
          errors: [`設定ファイルサイズが制限を超過: ${fileStats.size} > ${this.limits.maxFileSize}`],
          warnings: [],
          securityIssues: ['DoS攻撃の可能性']
        };
      }

      // ファイル読み込み
      const configContent = fs.readFileSync(configPath, 'utf-8');

      // 内容の前処理セキュリティチェック
      const preValidation = this.preValidateConfigContent(configContent);
      if (!preValidation.isValid) {
        return preValidation;
      }

      // JSON解析
      const parseResult = this.secureJsonParse(configContent);
      if (!parseResult.success) {
        return {
          isValid: false,
          errors: [parseResult.error || 'JSON解析に失敗'],
          warnings: [],
          securityIssues: parseResult.securityIssues || []
        };
      }

      // 構造検証とサニタイゼーション
      const validationResult = this.validateAndSanitizeConfig(parseResult.data);
      
      // parseResultのsecurityIssuesを結果にマージ
      if (parseResult.securityIssues && parseResult.securityIssues.length > 0) {
        validationResult.securityIssues = [
          ...validationResult.securityIssues,
          ...parseResult.securityIssues
        ];
      }
      
      return validationResult;

    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.INVALID_CONFIG,
        '設定ファイルの読み込み中にエラーが発生しました',
        { configPath }
      );

      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : '不明なエラー'],
        warnings: [],
        securityIssues: []
      };
    }
  }

  /**
   * 設定ファイル内容の事前検証
   */
  private preValidateConfigContent(content: string): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    // 基本検証
    if (!content || content.trim().length === 0) {
      errors.push('設定ファイルが空です');
      return { isValid: false, errors, warnings, securityIssues };
    }

    if (content.length > this.limits.maxFileSize) {
      errors.push('設定ファイルの内容が大きすぎます');
      securityIssues.push('DoS攻撃の可能性');
      return { isValid: false, errors, warnings, securityIssues };
    }

    // 危険なパターンの詳細検出
    const criticalPatterns = [
      { pattern: /__proto__\s*:/gi, issue: 'プロトタイプ汚染攻撃' },
      { pattern: /constructor\s*:/gi, issue: 'コンストラクタ汚染攻撃' },
      { pattern: /prototype\s*:/gi, issue: 'プロトタイプ操作攻撃' },
      { pattern: /function\s*\(/gi, issue: '任意関数実行攻撃' },
      { pattern: /eval\s*\(/gi, issue: 'eval実行攻撃' },
      { pattern: /require\s*\(/gi, issue: '任意モジュール読み込み攻撃' },
      { pattern: /import\s*\(/gi, issue: '動的import攻撃' },
      { pattern: /process\./gi, issue: 'プロセス操作攻撃' },
      { pattern: /global\./gi, issue: 'グローバル変数操作攻撃' },
      { pattern: /child_process/gi, issue: 'コマンド実行攻撃' },
      { pattern: /fs\./gi, issue: 'ファイルシステム攻撃' },
      { pattern: /path\./gi, issue: 'パス操作攻撃' },
      { pattern: /\.\.\//g, issue: 'パストラバーサル攻撃' },
      { pattern: /\/etc\/|\/root\/|\/home\//gi, issue: 'システムディレクトリアクセス攻撃' },
      { pattern: /\\x[0-9a-f]{2}/gi, issue: 'エスケープシーケンス攻撃' },
      { pattern: /\\u[0-9a-f]{4}/gi, issue: 'Unicode攻撃' },
      { pattern: /document\.|window\./gi, issue: 'DOM操作攻撃（環境混在）' }
    ];

    for (const { pattern, issue } of criticalPatterns) {
      if (pattern.test(content)) {
        securityIssues.push(issue);
        
        // 重要度に応じてエラーまたは警告に分類
        if (issue.includes('プロトタイプ') || issue.includes('eval') || issue.includes('実行')) {
          errors.push(`危険なパターンを検出: ${issue}`);
        } else {
          warnings.push(`疑わしいパターンを検出: ${issue}`);
        }
      }
    }

    // 異常に長い行の検出
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > this.limits.maxStringLength) {
        warnings.push(`異常に長い行を検出: ${i + 1}行目 (${lines[i].length}文字)`);
        securityIssues.push('データ圧迫攻撃の可能性');
      }
    }

    // ネストの深度概算チェック
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('JSON構造が不正です（括弧の不一致）');
    }

    if (openBraces > this.limits.maxObjectDepth * 10) {
      warnings.push('非常に深いネスト構造を検出');
      securityIssues.push('DoS攻撃（深いネスト）の可能性');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityIssues
    };
  }

  /**
   * セキュアなJSON解析
   */
  private secureJsonParse(content: string): { success: boolean; data?: any; error?: string; securityIssues?: string[] } {
    try {
      // JSON.parseの前にコンテンツをさらに検証
      const securityIssues: string[] = [];

      // プロトタイプ汚染の具体的防止
      const cleanedContent = content
        .replace(/"__proto__"\s*:/gi, '"__proto_blocked__":')
        .replace(/"constructor"\s*:/gi, '"constructor_blocked__":')  
        .replace(/"prototype"\s*:/gi, '"prototype_blocked__":');

      if (cleanedContent !== content) {
        securityIssues.push('プロトタイプ汚染攻撃を無効化');
      }

      // 安全なJSON解析
      const parsed = JSON.parse(cleanedContent);

      // 解析後の追加検証
      const postParseValidation = this.validateParsedObject(parsed, 0);
      if (!postParseValidation.isValid) {
        return {
          success: false,
          error: postParseValidation.errors.join(', '),
          securityIssues: [...securityIssues, ...postParseValidation.securityIssues]
        };
      }

      return {
        success: true,
        data: parsed,
        securityIssues
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON解析エラー',
        securityIssues: ['JSON解析攻撃の可能性']
      };
    }
  }

  /**
   * 解析済みオブジェクトの検証
   */
  private validateParsedObject(obj: any, depth: number): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    // 深度制限チェック
    if (depth > this.limits.maxObjectDepth) {
      errors.push(`オブジェクト深度が制限を超過: ${depth} > ${this.limits.maxObjectDepth}`);
      securityIssues.push('DoS攻撃（深いネスト）');
      return { isValid: false, errors, warnings, securityIssues };
    }

    if (obj === null || obj === undefined) {
      return { isValid: true, errors, warnings, securityIssues };
    }

    if (Array.isArray(obj)) {
      // 配列の検証
      if (obj.length > this.limits.maxArrayLength) {
        errors.push(`配列長が制限を超過: ${obj.length} > ${this.limits.maxArrayLength}`);
        securityIssues.push('DoS攻撃（大きな配列）');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 配列要素の再帰検証
      for (let i = 0; i < obj.length; i++) {
        const elementValidation = this.validateParsedObject(obj[i], depth + 1);
        if (!elementValidation.isValid) {
          errors.push(...elementValidation.errors.map(e => `配列[${i}]: ${e}`));
          warnings.push(...elementValidation.warnings);
          securityIssues.push(...elementValidation.securityIssues);
        }
      }

    } else if (typeof obj === 'object') {
      // オブジェクトの検証
      const keys = Object.keys(obj);
      
      if (keys.length > this.limits.maxProperties) {
        errors.push(`プロパティ数が制限を超過: ${keys.length} > ${this.limits.maxProperties}`);
        securityIssues.push('DoS攻撃（大きなオブジェクト）');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 危険なプロパティ名の検出
      const dangerousKeys = keys.filter(key => 
        key === '__proto__' || 
        key === 'constructor' || 
        key === 'prototype' ||
        key.includes('..') ||
        key.includes('/') ||
        key.includes('\\')
      );

      if (dangerousKeys.length > 0) {
        errors.push(`危険なプロパティ名を検出: ${dangerousKeys.join(', ')}`);
        securityIssues.push('プロパティ汚染攻撃');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // プロパティ値の再帰検証
      for (const key of keys) {
        const propValidation = this.validateParsedObject(obj[key], depth + 1);
        if (!propValidation.isValid) {
          errors.push(...propValidation.errors.map(e => `${key}: ${e}`));
          warnings.push(...propValidation.warnings);
          securityIssues.push(...propValidation.securityIssues);
        }
      }

    } else if (typeof obj === 'string') {
      // 文字列の検証
      if (obj.length > this.limits.maxStringLength) {
        warnings.push(`文字列長が制限を超過: ${obj.length} > ${this.limits.maxStringLength}`);
        securityIssues.push('DoS攻撃（長い文字列）');
      }

      // 危険な文字列パターンの検出
      const dangerousStringPatterns = [
        /javascript:/gi,
        /data:/gi,
        /vbscript:/gi,
        /<script/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /function\s*\(/gi
      ];

      for (const pattern of dangerousStringPatterns) {
        if (pattern.test(obj)) {
          warnings.push(`危険な文字列パターンを検出: ${pattern.source}`);
          securityIssues.push('文字列攻撃の可能性');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityIssues
    };
  }

  /**
   * 設定オブジェクトの検証とサニタイゼーション
   */
  private validateAndSanitizeConfig(config: any): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    try {
      // ディープクローンで元オブジェクトを保護
      const sanitizedConfig = JSON.parse(JSON.stringify(config));

      // 基本構造の検証
      if (!sanitizedConfig || typeof sanitizedConfig !== 'object') {
        errors.push('設定ファイルはオブジェクト形式である必要があります');
        return { isValid: false, errors, warnings, securityIssues };
      }

      // 必須フィールドの存在確認
      if (!sanitizedConfig.plugins) {
        sanitizedConfig.plugins = {};
        warnings.push('pluginsセクションが存在しないため、空のオブジェクトを作成しました');
      }

      if (!sanitizedConfig.output) {
        sanitizedConfig.output = { format: 'text', verbose: false };
        warnings.push('outputセクションが存在しないため、デフォルト値を設定しました');
      }

      // プラグイン設定の検証
      if (sanitizedConfig.plugins && typeof sanitizedConfig.plugins === 'object') {
        for (const [pluginName, pluginConfig] of Object.entries(sanitizedConfig.plugins)) {
          // プラグイン名の検証
          if (!/^[a-zA-Z0-9_-]+$/.test(pluginName)) {
            errors.push(`不正なプラグイン名: ${pluginName}`);
            securityIssues.push('プラグイン名攻撃');
            continue;
          }

          // プラグイン設定の検証
          if (!pluginConfig || typeof pluginConfig !== 'object') {
            errors.push(`プラグイン ${pluginName} の設定が不正です`);
            continue;
          }

          const config = pluginConfig as any;
          
          // 必須フィールドの検証
          if (typeof config.enabled !== 'boolean') {
            warnings.push(`プラグイン ${pluginName} のenabled設定をデフォルト値(false)に設定`);
            config.enabled = false;
          }

          // excludeFilesの検証
          if (config.excludeFiles && !Array.isArray(config.excludeFiles)) {
            warnings.push(`プラグイン ${pluginName} のexcludeFiles設定を削除（配列ではない）`);
            delete config.excludeFiles;
          }

          // priorityの検証
          if (config.priority && (typeof config.priority !== 'number' || config.priority < 0)) {
            warnings.push(`プラグイン ${pluginName} のpriority設定を削除（不正な値）`);
            delete config.priority;
          }
        }
      }

      // excludePatternsの検証
      if (sanitizedConfig.excludePatterns) {
        if (!Array.isArray(sanitizedConfig.excludePatterns)) {
          warnings.push('excludePatternsは配列である必要があります。削除しました。');
          delete sanitizedConfig.excludePatterns;
        } else {
          // パターンの検証とフィルタリング
          sanitizedConfig.excludePatterns = sanitizedConfig.excludePatterns.filter((pattern: any) => {
            if (typeof pattern !== 'string') {
              warnings.push('excludePatternsに文字列以外の値を検出。除外しました。');
              return false;
            }
            
            if (pattern.length > 200) {
              warnings.push(`除外パターンが長すぎます: ${pattern.substring(0, 50)}...`);
              securityIssues.push('DoS攻撃（長いパターン）');
              return false;
            }

            if (pattern.includes('..') || pattern.includes('/etc/') || pattern.includes('/root/')) {
              warnings.push(`危険な除外パターンを削除: ${pattern}`);
              securityIssues.push('パストラバーサル攻撃');
              return false;
            }

            return true;
          });
        }
      }

      return {
        isValid: errors.length === 0,
        sanitizedConfig,
        errors,
        warnings,
        securityIssues
      };

    } catch (error) {
      return {
        isValid: false,
        errors: ['設定検証中に予期しないエラーが発生しました'],
        warnings,
        securityIssues: ['設定処理攻撃の可能性']
      };
    }
  }

  /**
   * セキュリティ制限の更新
   */
  updateLimits(newLimits: Partial<ConfigSecurityLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }
}