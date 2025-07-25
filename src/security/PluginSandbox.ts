/**
 * プラグインサンドボックス - セキュリティ強化 v0.4.1
 * プラグインの安全な実行環境を提供し、システムリソースへのアクセスを制限
 */

import * as vm from 'vm';
import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { IPlugin, Issue } from '../core/types';

/**
 * サンドボックス実行制限設定
 */
export interface SandboxLimits {
  /** 最大実行時間 (ms) */
  maxExecutionTime: number;
  /** 最大メモリ使用量 (MB) */
  maxMemoryUsage: number;
  /** 最大ファイルサイズ (bytes) */
  maxFileSize: number;
  /** 許可されたモジュール一覧 */
  allowedModules: string[];
  /** 禁止されたグローバル変数 */
  forbiddenGlobals: string[];
}

/**
 * デフォルトサンドボックス制限
 */
export const DEFAULT_SANDBOX_LIMITS: SandboxLimits = {
  maxExecutionTime: 30000, // 30秒
  maxMemoryUsage: 64, // 64MB
  maxFileSize: 1024 * 1024 * 5, // 5MB
  allowedModules: [
    'path',
    'crypto',
    'util'
  ],
  forbiddenGlobals: [
    'process',
    'global',
    'Buffer',
    'require',
    'module',
    'exports',
    '__dirname',
    '__filename',
    'setTimeout',
    'setInterval',
    'setImmediate',
    'clearTimeout',
    'clearInterval',
    'clearImmediate'
  ]
};

/**
 * プラグイン実行結果
 */
export interface SandboxExecutionResult {
  success: boolean;
  issues: Issue[];
  error?: string;
  executionTime: number;
  memoryUsed: number;
}

/**
 * セキュアプラグインサンドボックス
 */
export class PluginSandbox {
  private limits: SandboxLimits;
  private projectRoot: string;

  constructor(projectRoot: string, limits: SandboxLimits = DEFAULT_SANDBOX_LIMITS) {
    this.projectRoot = projectRoot;
    this.limits = limits;
  }

  /**
   * プラグインを安全に実行
   */
  async executePlugin(
    pluginCode: string,
    pluginName: string,
    filePath: string
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // 入力検証
      if (!this.validatePlugin(pluginCode, pluginName)) {
        return {
          success: false,
          issues: [],
          error: `不正なプラグインコード: ${pluginName}`,
          executionTime: 0,
          memoryUsed: 0
        };
      }

      // ファイルパス検証
      if (!PathSecurity.validateProjectPath(filePath, this.projectRoot)) {
        return {
          success: false,
          issues: [],
          error: `不正なファイルパス: ${filePath}`,
          executionTime: 0,
          memoryUsed: 0
        };
      }

      // サンドボックス環境の構築
      const sandboxContext = this.createSandboxContext(filePath);
      
      // プラグインコードのラップ
      const wrappedCode = this.wrapPluginCode(pluginCode, pluginName);
      
      // VM実行
      const result = await this.executeInVM(wrappedCode, sandboxContext);
      
      const executionTime = Date.now() - startTime;
      const memoryUsed = Math.round((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024);

      // 実行時間制限チェック
      if (executionTime > this.limits.maxExecutionTime) {
        errorHandler.handleError(
          new Error(`プラグイン実行時間超過: ${pluginName}`),
          ErrorType.TIMEOUT,
          `プラグイン ${pluginName} の実行時間が制限を超過しました`,
          { executionTime, limit: this.limits.maxExecutionTime }
        );
        
        return {
          success: false,
          issues: [],
          error: `実行時間超過: ${executionTime}ms > ${this.limits.maxExecutionTime}ms`,
          executionTime,
          memoryUsed
        };
      }

      // メモリ使用量制限チェック
      if (memoryUsed > this.limits.maxMemoryUsage) {
        errorHandler.handleError(
          new Error(`プラグインメモリ使用量超過: ${pluginName}`),
          ErrorType.SYSTEM_ERROR,
          `プラグイン ${pluginName} のメモリ使用量が制限を超過しました`,
          { memoryUsed, limit: this.limits.maxMemoryUsage }
        );
        
        return {
          success: false,
          issues: [],
          error: `メモリ使用量超過: ${memoryUsed}MB > ${this.limits.maxMemoryUsage}MB`,
          executionTime,
          memoryUsed
        };
      }

      return {
        success: true,
        issues: result.issues || [],
        executionTime,
        memoryUsed
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const memoryUsed = Math.round((process.memoryUsage().heapUsed - startMemory) / 1024 / 1024);

      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        `プラグイン ${pluginName} の実行中にエラーが発生しました`,
        { pluginName, filePath }
      );

      return {
        success: false,
        issues: [],
        error: error instanceof Error ? error.message : '不明なエラー',
        executionTime,
        memoryUsed
      };
    }
  }

  /**
   * プラグインコードの検証
   */
  private validatePlugin(pluginCode: string, pluginName: string): boolean {
    // サイズ制限チェック
    if (pluginCode.length > this.limits.maxFileSize) {
      return false;
    }

    // 危険なコードパターンの検出
    const dangerousPatterns = [
      /require\s*\(\s*['"`][^'"`]*child_process[^'"`]*['"`]\s*\)/gi,
      /require\s*\(\s*['"`][^'"`]*fs[^'"`]*['"`]\s*\)/gi,
      /require\s*\(\s*['"`][^'"`]*vm[^'"`]*['"`]\s*\)/gi,
      /require\s*\(\s*['"`][^'"`]*cluster[^'"`]*['"`]\s*\)/gi,
      /require\s*\(\s*['"`][^'"`]*worker_threads[^'"`]*['"`]\s*\)/gi,
      /process\./gi,
      /global\./gi,
      /Function\s*\(/gi,
      /eval\s*\(/gi,
      /new\s+Function/gi,
      /setTimeout|setInterval|setImmediate/gi,
      /Buffer\s*\(/gi,
      /__proto__/gi,
      /constructor\.prototype/gi,
      /\.constructor\s*\(/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(pluginCode)) {
        errorHandler.handleError(
          new Error(`危険なコードパターンを検出: ${pluginName}`),
          ErrorType.PLUGIN_ERROR,
          `プラグイン ${pluginName} に危険なコードが含まれています`,
          { pattern: pattern.source }
        );
        return false;
      }
    }

    // プラグイン名の検証
    if (!/^[a-zA-Z0-9_-]+$/.test(pluginName)) {
      return false;
    }

    return true;
  }

  /**
   * サンドボックスコンテキストの作成
   */
  private createSandboxContext(filePath: string): vm.Context {
    // 制限されたfsオブジェクト
    const secureFs = {
      readFileSync: (path: string, encoding?: BufferEncoding) => {
        const resolvedPath = PathSecurity.safeResolve(path, this.projectRoot, 'plugin-fs-read');
        if (!resolvedPath) {
          throw new Error(`ファイルアクセスが拒否されました: ${path}`);
        }
        return fs.readFileSync(resolvedPath, encoding);
      },
      existsSync: (path: string) => {
        const resolvedPath = PathSecurity.safeResolve(path, this.projectRoot, 'plugin-fs-exists');
        if (!resolvedPath) {
          return false;
        }
        return fs.existsSync(resolvedPath);
      },
      statSync: (path: string) => {
        const resolvedPath = PathSecurity.safeResolve(path, this.projectRoot, 'plugin-fs-stat');
        if (!resolvedPath) {
          throw new Error(`ファイルアクセスが拒否されました: ${path}`);
        }
        return fs.statSync(resolvedPath);
      }
    };

    // 制限されたpathオブジェクト
    const securePath = {
      basename: path.basename,
      dirname: path.dirname,
      extname: path.extname,
      join: path.join,
      resolve: (...paths: string[]) => {
        const resolved = path.resolve(...paths);
        if (!PathSecurity.validateProjectPath(resolved, this.projectRoot)) {
          throw new Error(`パス解決が拒否されました: ${paths.join(', ')}`);
        }
        return resolved;
      },
      relative: path.relative,
      parse: path.parse,
      format: path.format
    };

    // セキュアコンテキスト
    const sandboxContext: any = {
      // セキュアなモジュール
      fs: secureFs,
      path: securePath,
      
      // ユーティリティ
      console: {
        log: (...args: any[]) => console.log(`[Plugin]`, ...args),
        error: (...args: any[]) => console.error(`[Plugin Error]`, ...args),
        warn: (...args: any[]) => console.warn(`[Plugin Warning]`, ...args)
      },
      
      // プラグイン用ヘルパー
      filePath,
      projectRoot: this.projectRoot,
      
      // 結果オブジェクト
      result: { issues: [] },
      
      // 基本的なJavaScript機能
      Object: Object,
      Array: Array,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Date: Date,
      Math: Math,
      JSON: JSON,
      
      // 禁止されたグローバルは明示的にundefined
      ...this.limits.forbiddenGlobals.reduce((acc, global) => {
        acc[global] = undefined;
        return acc;
      }, {} as any)
    };

    return vm.createContext(sandboxContext);
  }

  /**
   * プラグインコードのラップ
   */
  private wrapPluginCode(pluginCode: string, pluginName: string): string {
    return `
(function() {
  'use strict';
  
  try {
    // プラグインコード実行
    ${pluginCode}
    
    // プラグインクラスのインスタンス化と実行
    if (typeof Plugin !== 'undefined') {
      const plugin = new Plugin();
      if (plugin.analyze && typeof plugin.analyze === 'function') {
        const pluginResult = plugin.analyze(filePath);
        if (Array.isArray(pluginResult)) {
          result.issues = pluginResult;
        } else if (pluginResult && Array.isArray(pluginResult.issues)) {
          result.issues = pluginResult.issues;
        }
      }
    }
    
    return result;
  } catch (pluginError) {
    result.error = pluginError.message || 'プラグイン実行エラー';
    return result;
  }
})();
`;
  }

  /**
   * VM内でコードを実行
   */
  private async executeInVM(code: string, context: vm.Context): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // タイムアウト設定
        const timer = setTimeout(() => {
          reject(new Error(`プラグイン実行がタイムアウトしました`));
        }, this.limits.maxExecutionTime);

        try {
          const result = vm.runInContext(code, context, {
            timeout: this.limits.maxExecutionTime,
            displayErrors: false
          });
          
          clearTimeout(timer);
          resolve(result);
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * サンドボックス制限の更新
   */
  updateLimits(newLimits: Partial<SandboxLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }
}