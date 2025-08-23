/**
 * Threshold Checker Utility
 * 
 * 共通の閾値チェック機能を提供するユーティリティ
 * DRY原則に従い、重複するロジックを一元化
 * 
 * Issue #94対応: bc依存除去のための共通ユーティリティ
 */

const fs = require('fs');

/**
 * 共通設定定数
 */
const COMMON_CONSTANTS = {
  PRECISION: 2, // bc -l互換の小数点精度
  MIN_THRESHOLD: 0,
  MAX_THRESHOLD: 100
};

/**
 * 入力検証ユーティリティ（Defensive Programming）
 * 単一責任原則（SRP）: 入力検証のみを担当
 */
class InputValidator {
  /**
   * 数値検証
   */
  static validateNumber(value, name) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid ${name} value`);
    }
  }

  /**
   * 閾値検証
   */
  static validateThreshold(threshold) {
    this.validateNumber(threshold, 'threshold');
    if (threshold < COMMON_CONSTANTS.MIN_THRESHOLD || threshold > COMMON_CONSTANTS.MAX_THRESHOLD) {
      throw new Error('Invalid threshold value');
    }
  }

  /**
   * カバレッジ値検証
   */
  static validateCoverage(coverage, type = 'coverage') {
    this.validateNumber(coverage, type);
  }
}

/**
 * 数値処理ユーティリティ
 * bc -l互換の浮動小数点処理を提供
 */
class NumberUtils {
  /**
   * 浮動小数点精度調整（bc -l互換性）
   */
  static adjustPrecision(value, precision = COMMON_CONSTANTS.PRECISION) {
    return Number(value.toFixed(precision));
  }

  /**
   * 数値比較（精度調整済み）
   */
  static compare(value1, value2, precision = COMMON_CONSTANTS.PRECISION) {
    const adjusted1 = this.adjustPrecision(value1, precision);
    const adjusted2 = this.adjustPrecision(value2, precision);
    
    if (adjusted1 > adjusted2) return 1;
    if (adjusted1 < adjusted2) return -1;
    return 0;
  }

  /**
   * 閾値判定
   */
  static isAboveThreshold(value, threshold, precision = COMMON_CONSTANTS.PRECISION) {
    return this.compare(value, threshold, precision) >= 0;
  }
}

/**
 * JSONファイル処理ユーティリティ
 * 単一責任原則（SRP）: JSONファイル操作のみを担当
 */
class JsonFileUtils {
  /**
   * ファイル存在チェック
   */
  static checkFileExists(filePath, fsModule = fs) {
    if (!fsModule.existsSync(filePath)) {
      throw new Error('File not found');
    }
  }

  /**
   * JSONファイル読み込み
   */
  static readJsonFile(filePath, fsModule = fs) {
    try {
      const fileContent = fsModule.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * 安全なJSONファイル読み込み
   */
  static safeReadJsonFile(filePath, fsModule = fs) {
    this.checkFileExists(filePath, fsModule);
    return this.readJsonFile(filePath, fsModule);
  }
}

/**
 * GitHub Actions統合ユーティリティ
 * インターフェース分離原則（ISP）: GitHub Actions固有の機能のみ
 */
class GitHubActionsUtils {
  /**
   * 環境変数設定
   */
  static setEnvironmentVariable(key, value, fsModule = fs, processModule = process) {
    if (!processModule.env.GITHUB_ENV) {
      throw new Error('GITHUB_ENV environment variable is not set');
    }

    try {
      const envEntry = `${key}=${value}\n`;
      fsModule.writeFileSync(processModule.env.GITHUB_ENV, envEntry, { flag: 'a' });
    } catch (error) {
      throw new Error(`Failed to set GitHub environment variable: ${error.message}`);
    }
  }

  /**
   * 出力設定
   */
  static setOutput(key, value, fsModule = fs, processModule = process) {
    if (!processModule.env.GITHUB_OUTPUT) {
      throw new Error('GITHUB_OUTPUT environment variable is not set');
    }

    try {
      const outputEntry = `${key}=${value}\n`;
      fsModule.writeFileSync(processModule.env.GITHUB_OUTPUT, outputEntry, { flag: 'a' });
    } catch (error) {
      throw new Error(`Failed to set GitHub output: ${error.message}`);
    }
  }

  /**
   * メッセージ出力
   */
  static outputMessage(level, message, processModule = process) {
    const formattedMessage = level === 'error' ? `::error::${message}` :
                            level === 'warning' ? `::warning::${message}` :
                            message;
    
    const stream = level === 'error' ? processModule.stderr : processModule.stdout;
    stream.write(`${formattedMessage}\n`);
  }
}

/**
 * エラーハンドリングユーティリティ
 * Defensive Programming原則の実装
 */
class ErrorHandler {
  /**
   * 安全な関数実行
   */
  static safeExecute(fn, fallbackValue = null, errorMessage = 'Operation failed') {
    try {
      return fn();
    } catch (error) {
      const detailedMessage = `${errorMessage}: ${error.message}`;
      throw new Error(detailedMessage);
    }
  }

  /**
   * GitHub Actions環境での安全実行
   */
  static safeGitHubExecution(operation, defaultEnvVars = {}, processModule = process) {
    try {
      return operation();
    } catch (error) {
      // デフォルト環境変数の設定試行
      for (const [key, value] of Object.entries(defaultEnvVars)) {
        try {
          GitHubActionsUtils.setEnvironmentVariable(key, value, fs, processModule);
        } catch (envError) {
          GitHubActionsUtils.outputMessage('error', 
            `Failed to set default environment variable ${key}: ${envError.message}`, 
            processModule
          );
        }
      }
      throw error;
    }
  }
}

// モジュールエクスポート（依存性逆転原則）
module.exports = {
  InputValidator,
  NumberUtils,
  JsonFileUtils,
  GitHubActionsUtils,
  ErrorHandler,
  COMMON_CONSTANTS
};