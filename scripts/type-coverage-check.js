#!/usr/bin/env node

/**
 * Type Coverage Check Script
 * 
 * bc依存を除去し、Node.jsのみで型カバレッジ閾値判定を行うスクリプト
 * 
 * Issue #94対応: GitHub ActionsワークフローのCI改善
 * TDD原則、SOLID原則、DRY原則、KISS原則、Defensive Programmingに準拠
 */

const fs = require('fs');
const path = require('path');
const {
  InputValidator,
  NumberUtils,
  JsonFileUtils,
  GitHubActionsUtils,
  ErrorHandler,
  COMMON_CONSTANTS
} = require('./utils/threshold-checker');

/**
 * 型カバレッジ閾値チェックの設定定数
 * 設定値の一元管理（DRY原則）
 */
const TYPE_COVERAGE_CONSTANTS = {
  DEFAULT_THRESHOLD: 95,
  DEFAULT_TYPE_COVERAGE_FILE: '.rimor/reports/type-coverage/type-coverage.json'
};

/**
 * 型カバレッジ数値比較ロジック（bc -l代替）
 * 単一責任原則（SRP）: 型カバレッジ閾値チェックのみを担当
 */
function checkTypeCoverage(coverage, threshold) {
  // 入力検証（共通ユーティリティ使用）
  InputValidator.validateCoverage(coverage, 'type coverage');
  InputValidator.validateThreshold(threshold);

  // 浮動小数点精度調整（共通ユーティリティ使用）
  const adjustedCoverage = NumberUtils.adjustPrecision(coverage);
  const adjustedThreshold = NumberUtils.adjustPrecision(threshold);

  // 型カバレッジ閾値判定（共通ユーティリティ使用）
  if (NumberUtils.isAboveThreshold(coverage, threshold)) {
    return {
      status: 'success',
      message: `✅ 型カバレッジ: ${adjustedCoverage}% (目標: ${adjustedThreshold}%)`
    };
  } else {
    return {
      status: 'warning',
      message: `⚠️ 型カバレッジが目標を下回っています: ${adjustedCoverage}% (目標: ${adjustedThreshold}%)`
    };
  }
}

/**
 * 型カバレッジファイル解析
 * 単一責任原則（SRP）: 型カバレッジファイル解析のみを担当
 */
function parseTypeCoverageFile(filePath, fsModule = fs) {
  return ErrorHandler.safeExecute(
    () => {
      // JSONファイルの安全な読み込み（共通ユーティリティ使用）
      const typeCoverageData = JsonFileUtils.safeReadJsonFile(filePath, fsModule);

      // データ構造の検証
      if (!typeCoverageData.metrics || typeof typeCoverageData.metrics.coverage !== 'number') {
        throw new Error('metrics.coverage not found in type coverage file');
      }

      return typeCoverageData.metrics.coverage;
    },
    null,
    'Type coverage file parsing failed'
  );
}

/**
 * GitHub Actions出力設定
 * インターフェース分離原則（ISP）: 必要な機能のみを提供
 */
function setGitHubOutput(key, value, fsModule = fs, processModule = process) {
  // 共通ユーティリティを使用
  GitHubActionsUtils.setOutput(key, value, fsModule, processModule);
}

/**
 * メッセージ出力関数
 * 単一責任原則（SRP）: メッセージ出力のみを担当
 */
function outputMessage(level, message, processModule = process) {
  // 共通ユーティリティを使用
  GitHubActionsUtils.outputMessage(level, message, processModule);
}

/**
 * メイン処理関数
 * 開放/閉鎖原則（OCP）: 設定により動作を拡張可能
 */
function main(options = {}) {
  // デフォルト設定（設定の外部化による柔軟性確保）
  const config = {
    typeCoverageFile: options.typeCoverageFile || TYPE_COVERAGE_CONSTANTS.DEFAULT_TYPE_COVERAGE_FILE,
    threshold: options.threshold || TYPE_COVERAGE_CONSTANTS.DEFAULT_THRESHOLD,
    fs: options.fs || fs,
    process: options.process || process
  };

  try {
    // 型カバレッジ値の取得
    const coverage = parseTypeCoverageFile(config.typeCoverageFile, config.fs);
    
    // 型カバレッジ閾値チェックの実行
    const result = checkTypeCoverage(coverage, config.threshold);
    
    // GitHub Actions出力の設定（共通ユーティリティ使用）
    GitHubActionsUtils.setOutput('coverage', coverage.toString(), config.fs, config.process);

    // 結果のコンソール出力（共通ユーティリティ使用）
    GitHubActionsUtils.outputMessage(result.status, result.message, config.process);

    return {
      success: result.status === 'success',
      coverage,
      message: result.message
    };
  } catch (error) {
    // エラーハンドリング（共通ユーティリティ使用）
    const errorMessage = `Type coverage check failed: ${error.message}`;
    
    // デフォルト出力設定とエラー処理
    const defaultOutputs = {
      'coverage': '0'
    };
    
    try {
      GitHubActionsUtils.setOutput('coverage', '0', config.fs, config.process);
      GitHubActionsUtils.outputMessage('error', errorMessage, config.process);
    } catch (outputError) {
      GitHubActionsUtils.outputMessage('error', `Failed to set default output: ${outputError.message}`, config.process);
    }

    throw new Error(errorMessage);
  }
}

// モジュールエクスポート（依存性逆転原則）
module.exports = {
  checkTypeCoverage,
  parseTypeCoverageFile,
  setGitHubOutput,
  outputMessage,
  main,
  TYPE_COVERAGE_CONSTANTS
};

// コマンドライン実行時の処理
if (require.main === module) {
  // コマンドライン引数の解析
  const args = process.argv.slice(2);
  const typeCoverageFile = args[0] || TYPE_COVERAGE_CONSTANTS.DEFAULT_TYPE_COVERAGE_FILE;
  const threshold = parseFloat(args[1]) || TYPE_COVERAGE_CONSTANTS.DEFAULT_THRESHOLD;

  // メイン処理の実行
  main({ typeCoverageFile, threshold })
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