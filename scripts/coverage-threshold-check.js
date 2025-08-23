#!/usr/bin/env node

/**
 * Coverage Threshold Check Script
 * 
 * bc依存を除去し、Node.jsのみでカバレッジ閾値判定を行うスクリプト
 * 
 * Issue #94対応: GitHub ActionsワークフローのCI改善
 * TDD原則、SOLID原則、DRY原則、KISS原則、Defensive Programmingに準拠
 */

const fs = require('fs');
const path = require('path');

/**
 * カバレッジ閾値チェックの設定定数
 * 設定値の一元管理（DRY原則）
 */
const THRESHOLD_CONSTANTS = {
  DEFAULT_THRESHOLD: 80,
  DEFAULT_COVERAGE_FILE: 'coverage/coverage-summary.json',
  PRECISION: 2 // 小数点精度（bc -l互換性）
};

/**
 * 数値比較ロジック（bc -l代替）
 * 単一責任原則（SRP）: 閾値チェックのみを担当
 */
function checkThreshold(coverage, threshold) {
  // 入力検証（Defensive Programming）
  if (typeof coverage !== 'number' || isNaN(coverage)) {
    throw new Error('Invalid coverage value');
  }
  
  if (typeof threshold !== 'number' || isNaN(threshold) || threshold < 0 || threshold > 100) {
    throw new Error('Invalid threshold value');
  }

  // 浮動小数点精度調整（bc -l互換性）
  const adjustedCoverage = Number(coverage.toFixed(THRESHOLD_CONSTANTS.PRECISION));
  const adjustedThreshold = Number(threshold.toFixed(THRESHOLD_CONSTANTS.PRECISION));

  // 閾値判定
  if (adjustedCoverage >= adjustedThreshold) {
    return {
      status: 'success',
      message: `Coverage: ${adjustedCoverage}%`
    };
  } else {
    return {
      status: 'failure',
      message: `Coverage is below ${adjustedThreshold}% threshold: ${adjustedCoverage}%`
    };
  }
}

/**
 * カバレッジファイル解析
 * 単一責任原則（SRP）: ファイル解析のみを担当
 */
function parseCoverageFile(filePath, fsModule = fs) {
  // ファイル存在チェック（Defensive Programming）
  if (!fsModule.existsSync(filePath)) {
    throw new Error('Coverage file not found');
  }

  try {
    // JSONファイルの読み込みと解析
    const fileContent = fsModule.readFileSync(filePath, 'utf8');
    const coverageData = JSON.parse(fileContent);

    // データ構造の検証
    if (!coverageData.total || !coverageData.total.statements || typeof coverageData.total.statements.pct !== 'number') {
      throw new Error('Invalid coverage file structure');
    }

    return coverageData.total.statements.pct;
  } catch (error) {
    if (error.message.includes('Invalid coverage file structure')) {
      throw error;
    }
    throw new Error('Invalid JSON format');
  }
}

/**
 * GitHub Actions環境変数設定
 * インターフェース分離原則（ISP）: 必要な機能のみを提供
 */
function setGitHubEnv(key, value, fsModule = fs, processModule = process) {
  // GITHUB_ENV環境変数の存在チェック（Defensive Programming）
  if (!processModule.env.GITHUB_ENV) {
    throw new Error('GITHUB_ENV environment variable is not set');
  }

  try {
    // GitHub Actions環境変数ファイルへの追記
    const envEntry = `${key}=${value}\n`;
    fsModule.writeFileSync(processModule.env.GITHUB_ENV, envEntry, { flag: 'a' });
  } catch (error) {
    throw new Error(`Failed to set GitHub environment variable: ${error.message}`);
  }
}

/**
 * メイン処理関数
 * 開放/閉鎖原則（OCP）: 設定により動作を拡張可能
 */
function main(options = {}) {
  // デフォルト設定（設定の外部化による柔軟性確保）
  const config = {
    coverageFile: options.coverageFile || THRESHOLD_CONSTANTS.DEFAULT_COVERAGE_FILE,
    threshold: options.threshold || THRESHOLD_CONSTANTS.DEFAULT_THRESHOLD,
    fs: options.fs || fs,
    process: options.process || process
  };

  try {
    // カバレッジ値の取得
    const coverage = parseCoverageFile(config.coverageFile, config.fs);
    
    // 閾値チェックの実行
    const result = checkThreshold(coverage, config.threshold);
    
    // GitHub Actions環境変数の設定
    setGitHubEnv('COVERAGE_PCT', coverage.toString(), config.fs, config.process);
    setGitHubEnv('COVERAGE_STATUS', result.status, config.fs, config.process);

    // 結果のコンソール出力
    if (result.status === 'success') {
      console.log(result.message);
    } else {
      console.log(`::warning::${result.message}`);
    }

    return {
      success: result.status === 'success',
      coverage,
      message: result.message
    };
  } catch (error) {
    // エラーハンドリング（Defensive Programming）
    const errorMessage = `Coverage threshold check failed: ${error.message}`;
    console.error(`::error::${errorMessage}`);
    
    // 失敗時のデフォルト環境変数設定
    try {
      setGitHubEnv('COVERAGE_PCT', '0', config.fs, config.process);
      setGitHubEnv('COVERAGE_STATUS', 'failure', config.fs, config.process);
    } catch (envError) {
      console.error(`::error::Failed to set default environment variables: ${envError.message}`);
    }

    throw new Error(errorMessage);
  }
}

// モジュールエクスポート（依存性逆転原則）
module.exports = {
  checkThreshold,
  parseCoverageFile,
  setGitHubEnv,
  main,
  THRESHOLD_CONSTANTS
};

// コマンドライン実行時の処理
if (require.main === module) {
  // コマンドライン引数の解析
  const args = process.argv.slice(2);
  const coverageFile = args[0] || THRESHOLD_CONSTANTS.DEFAULT_COVERAGE_FILE;
  const threshold = parseFloat(args[1]) || THRESHOLD_CONSTANTS.DEFAULT_THRESHOLD;

  // メイン処理の実行
  main({ coverageFile, threshold })
    .then(result => {
      // 成功時の終了処理
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      // エラー時の終了処理
      console.error(`Script execution failed: ${error.message}`);
      process.exit(1);
    });
}