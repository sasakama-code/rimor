#!/usr/bin/env node

/**
 * Coverage Comment Script
 * 
 * GitHub ActionsでPRにカバレッジレポートを冪等に投稿するスクリプト
 * 
 * TDD原則、SOLID原則、DRY原則、KISS原則、Defensive Programmingに準拠
 */

const fs = require('fs');
const path = require('path');

// 定数定義（設定値の一元管理）
const COVERAGE_CONSTANTS = {
  THRESHOLDS: {
    lines: 95,
    statements: 95,
    functions: 98,
    branches: 85
  },
  COMMENT_HEADER: '## 📊 Coverage Report (CI)',
  COVERAGE_FILE_PATH: 'coverage/coverage-summary.json'
};

/**
 * カバレッジコメントを投稿する主要関数
 * 単一責任原則（SRP）に従い、コメントの投稿のみを担当
 */
async function postCoverageComment({ github, core, fs: fsModule, process: processModule, context }) {
  try {
    core.info('カバレッジコメントの投稿を開始...');

    // 入力検証（Defensive Programming）
    validateInputs({ github, core, context });

    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const prNumber = context.payload.pull_request?.number;

    if (!prNumber) {
      throw new Error('プルリクエスト番号が取得できません');
    }

    // カバレッジレポートの生成
    const coverageReport = generateCoverageReport(fsModule || fs, core);
    
    // 既存コメントの検索（冪等性の実装）
    const { data: comments } = await github.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber
    });

    const existingComment = findExistingCoverageComment(comments);

    // コメントの作成または更新
    if (existingComment) {
      core.info(`既存のカバレッジコメント（ID: ${existingComment.id}）を更新します`);
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: coverageReport
      });
    } else {
      core.info('新しいカバレッジコメントを作成します');
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: coverageReport
      });
    }

    core.info('カバレッジコメントの投稿が完了しました');
  } catch (error) {
    core.setFailed(`カバレッジコメントの投稿に失敗: ${error.message}`);
    throw error;
  }
}

/**
 * カバレッジレポートを生成する関数
 * 単一責任原則（SRP）に従い、レポート生成のみを担当
 */
function generateCoverageReport(fsModule, core) {
  const coverageFilePath = COVERAGE_CONSTANTS.COVERAGE_FILE_PATH;

  // ファイル存在チェック（Defensive Programming）
  if (!fsModule.existsSync(coverageFilePath)) {
    const warningMessage = 'カバレッジレポートが見つかりませんでした';
    core.warning(warningMessage);
    return `${COVERAGE_CONSTANTS.COMMENT_HEADER}\n\n⚠️ ${warningMessage}`;
  }

  try {
    // カバレッジファイルの読み込みと解析
    const coverageData = JSON.parse(fsModule.readFileSync(coverageFilePath, 'utf8'));
    const { total } = coverageData;

    // カバレッジテーブルの生成
    const coverageTable = formatCoverageTable(total, COVERAGE_CONSTANTS.THRESHOLDS);
    
    // 閾値達成の判定
    const thresholdStatus = checkThresholdStatus(total, COVERAGE_CONSTANTS.THRESHOLDS);
    
    // レポート全体の組み立て
    const report = [
      COVERAGE_CONSTANTS.COMMENT_HEADER,
      '',
      coverageTable,
      '',
      thresholdStatus
    ].join('\n');

    return report;
  } catch (error) {
    const errorMessage = `カバレッジレポートの解析に失敗しました: ${error.message}`;
    core.setFailed(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * 既存のカバレッジコメントを検索する関数
 * 開放/閉鎖原則（OCP）に従い、検索条件の拡張が容易
 */
function findExistingCoverageComment(comments) {
  return comments.find(comment => 
    comment.user?.type === 'Bot' && 
    comment.body?.includes(COVERAGE_CONSTANTS.COMMENT_HEADER)
  );
}

/**
 * カバレッジテーブルをフォーマットする関数
 * 単一責任原則（SRP）に従い、フォーマットのみを担当
 */
function formatCoverageTable(coverage, thresholds) {
  const metrics = ['lines', 'statements', 'functions', 'branches'];
  
  const header = '| Metric | Coverage | Threshold | Status |';
  const separator = '|--------|----------|-----------|--------|';
  
  const rows = metrics.map(metric => {
    const actual = coverage[metric]?.pct || 0;
    const threshold = thresholds[metric] || 0;
    const status = actual >= threshold ? '✅' : '❌';
    
    return `| ${capitalizeFirst(metric)} | ${actual}% | ${threshold}% | ${status} |`;
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * 閾値達成状況をチェックする関数
 * リスコフ置換原則（LSP）に従い、予期される動作を保証
 */
function checkThresholdStatus(coverage, thresholds) {
  const allMetsPassed = Object.keys(thresholds).every(metric => {
    const actual = coverage[metric]?.pct || 0;
    const threshold = thresholds[metric];
    return actual >= threshold;
  });

  if (allMetsPassed) {
    return '✅ **カバレッジ目標を達成しています！**';
  } else {
    const failedMetrics = Object.keys(thresholds)
      .filter(metric => {
        const actual = coverage[metric]?.pct || 0;
        const threshold = thresholds[metric];
        return actual < threshold;
      })
      .map(metric => `${capitalizeFirst(metric)}: ${coverage[metric]?.pct || 0}% < ${thresholds[metric]}%`);

    return [
      '⚠️ **カバレッジ目標を下回っています。**',
      '',
      '**改善が必要な項目:**',
      ...failedMetrics.map(item => `- ${item}`)
    ].join('\n');
  }
}

/**
 * 入力検証関数（Defensive Programming）
 * インターフェース分離原則（ISP）に従い、必要な機能のみを要求
 */
function validateInputs({ github, core, context }) {
  if (!github?.rest?.issues) {
    throw new Error('GitHub API clientが不正です');
  }
  
  if (!core?.info || !core?.setFailed) {
    throw new Error('GitHub Actions core moduleが不正です');
  }
  
  if (!context?.repo?.owner || !context?.repo?.repo) {
    throw new Error('GitHubコンテキストが不正です');
  }
}

/**
 * ユーティリティ関数：文字列の最初の文字を大文字にする
 * DRY原則に従い、共通機能として抽出
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Node.jsモジュールとしてエクスポート（依存性逆転原則）
module.exports = {
  postCoverageComment,
  generateCoverageReport,
  findExistingCoverageComment,
  formatCoverageTable,
  checkThresholdStatus,
  validateInputs,
  COVERAGE_CONSTANTS
};

// GitHub Actionsから直接呼び出される場合の処理
if (require.main === module) {
  // GitHub Actions環境でのグローバル変数の使用
  /* eslint-disable-next-line no-undef */
  const { github, core, context } = globalThis;
  
  if (github && core && context) {
    postCoverageComment({ github, core, context })
      .catch(error => {
        core.setFailed(`スクリプト実行エラー: ${error.message}`);
        process.exit(1);
      });
  } else {
    console.error('GitHub Actions環境で実行してください');
    process.exit(1);
  }
}