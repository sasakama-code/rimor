#!/usr/bin/env node

/**
 * セルフ監査履歴管理システム
 * 
 * 履歴ファイルの管理、比較、トレンド分析を行う
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// ====================================================================
// 設定とユーティリティ
// ====================================================================

const argv = yargs(hideBin(process.argv))
  .command('list', '履歴ファイル一覧表示')
  .command('clean', '古い履歴ファイルの削除')
  .command('compare <file1> <file2>', '2つの監査結果を比較')
  .command('trend', 'トレンド分析を実行')
  .command('stats', '履歴統計情報を表示')
  .option('base-dir', {
    alias: 'b',
    type: 'string',
    description: 'セルフ監査ベースディレクトリ',
    default: 'docs/self-audit'
  })
  .option('days', {
    alias: 'd',
    type: 'number',
    description: '保持期間（日数）',
    default: 30
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'ドライラン（実際の削除は行わない）',
    default: false
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    choices: ['table', 'json', 'markdown'],
    description: '出力形式',
    default: 'table'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: '詳細ログ出力',
    default: false
  })
  .help()
  .argv;

// ログ出力関数
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  verbose: (msg) => argv.verbose && console.log(`🔍 ${msg}`)
};

// ====================================================================
// 履歴管理クラス
// ====================================================================

class AuditHistoryManager {
  constructor() {
    this.baseDir = argv['base-dir'];
    this.resultsDir = path.join(this.baseDir, 'results');
    this.reportsDir = path.join(this.baseDir, 'reports');
    this.archivesDir = path.join(this.baseDir, 'archives');
  }

  /**
   * 履歴ファイル一覧表示
   */
  async listHistory() {
    log.info('履歴ファイル一覧を表示中...');

    const history = {
      results: this.getTimestampedFiles(this.resultsDir),
      reports: this.getTimestampedFiles(this.reportsDir),
      archives: this.getArchiveFiles(this.archivesDir)
    };

    if (argv.format === 'json') {
      console.log(JSON.stringify(history, null, 2));
      return;
    }

    if (argv.format === 'markdown') {
      this.displayMarkdownHistory(history);
      return;
    }

    // テーブル形式での表示
    this.displayTableHistory(history);
  }

  /**
   * タイムスタンプ付きファイルを取得
   */
  getTimestampedFiles(dir) {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);
    const timestampedFiles = files
      .filter(file => /\\d{8}_\\d{6}/.test(file))
      .map(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const timestamp = this.extractTimestamp(file);
        
        return {
          filename: file,
          path: filePath,
          timestamp: timestamp,
          date: this.formatTimestamp(timestamp),
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size)
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return timestampedFiles;
  }

  /**
   * アーカイブファイルを取得
   */
  getArchiveFiles(dir) {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);
    const archiveFiles = files
      .filter(file => file.startsWith('audit-') && file.endsWith('.tar.gz'))
      .map(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const timestamp = file.replace('audit-', '').replace('.tar.gz', '');
        
        return {
          filename: file,
          path: filePath,
          timestamp: timestamp,
          date: this.formatTimestamp(timestamp),
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size)
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return archiveFiles;
  }

  /**
   * テーブル形式で履歴表示
   */
  displayTableHistory(history) {
    if (history.results.length > 0) {
      console.log('\\n📊 Phase結果ファイル履歴:');
      console.log('┌────────────────────────────────────────────────┬─────────────────────┬──────────┐');
      console.log('│ ファイル名                                     │ 作成日時            │ サイズ   │');
      console.log('├────────────────────────────────────────────────┼─────────────────────┼──────────┤');
      
      history.results.slice(0, 10).forEach(file => {
        const name = file.filename.padEnd(46);
        const date = file.date.padEnd(19);
        const size = file.sizeFormatted.padStart(8);
        console.log(`│ ${name} │ ${date} │ ${size} │`);
      });
      
      console.log('└────────────────────────────────────────────────┴─────────────────────┴──────────┘');
      
      if (history.results.length > 10) {
        console.log(`   ... 他${history.results.length - 10}件`);
      }
    }

    if (history.reports.length > 0) {
      console.log('\\n📈 統合レポート履歴:');
      console.log('┌────────────────────────────────────────────────┬─────────────────────┬──────────┐');
      console.log('│ ファイル名                                     │ 作成日時            │ サイズ   │');
      console.log('├────────────────────────────────────────────────┼─────────────────────┼──────────┤');
      
      history.reports.slice(0, 10).forEach(file => {
        const name = file.filename.padEnd(46);
        const date = file.date.padEnd(19);
        const size = file.sizeFormatted.padStart(8);
        console.log(`│ ${name} │ ${date} │ ${size} │`);
      });
      
      console.log('└────────────────────────────────────────────────┴─────────────────────┴──────────┘');
    }

    if (history.archives.length > 0) {
      console.log('\\n🗄️  アーカイブ履歴:');
      console.log('┌────────────────────────────────────────────────┬─────────────────────┬──────────┐');
      console.log('│ ファイル名                                     │ 作成日時            │ サイズ   │');
      console.log('├────────────────────────────────────────────────┼─────────────────────┼──────────┤');
      
      history.archives.forEach(file => {
        const name = file.filename.padEnd(46);
        const date = file.date.padEnd(19);
        const size = file.sizeFormatted.padStart(8);
        console.log(`│ ${name} │ ${date} │ ${size} │`);
      });
      
      console.log('└────────────────────────────────────────────────┴─────────────────────┴──────────┘');
    }
  }

  /**
   * Markdown形式で履歴表示
   */
  displayMarkdownHistory(history) {
    console.log('# セルフ監査履歴一覧\\n');

    if (history.results.length > 0) {
      console.log('## Phase結果ファイル履歴\\n');
      console.log('| ファイル名 | 作成日時 | サイズ |');
      console.log('|------------|----------|--------|');
      
      history.results.slice(0, 10).forEach(file => {
        console.log(`| ${file.filename} | ${file.date} | ${file.sizeFormatted} |`);
      });
      
      if (history.results.length > 10) {
        console.log(`\\n*他${history.results.length - 10}件の履歴があります*\\n`);
      }
    }

    if (history.reports.length > 0) {
      console.log('\\n## 統合レポート履歴\\n');
      console.log('| ファイル名 | 作成日時 | サイズ |');
      console.log('|------------|----------|--------|');
      
      history.reports.slice(0, 10).forEach(file => {
        console.log(`| ${file.filename} | ${file.date} | ${file.sizeFormatted} |`);
      });
    }

    if (history.archives.length > 0) {
      console.log('\\n## アーカイブ履歴\\n');
      console.log('| ファイル名 | 作成日時 | サイズ |');
      console.log('|------------|----------|--------|');
      
      history.archives.forEach(file => {
        console.log(`| ${file.filename} | ${file.date} | ${file.sizeFormatted} |`);
      });
    }
  }

  /**
   * 古い履歴ファイルのクリーンアップ
   */
  async cleanHistory() {
    log.info(`${argv.days}日より古い履歴ファイルをクリーンアップ中...`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - argv.days);
    const cutoffTimestamp = this.dateToTimestamp(cutoffDate);

    let totalDeleted = 0;
    let totalSize = 0;

    // Phase結果ファイルのクリーンアップ
    const resultFiles = this.getTimestampedFiles(this.resultsDir);
    const oldResultFiles = resultFiles.filter(file => file.timestamp < cutoffTimestamp);

    for (const file of oldResultFiles) {
      if (argv['dry-run']) {
        log.verbose(`[DRY RUN] 削除予定: ${file.filename}`);
      } else {
        fs.unlinkSync(file.path);
        log.verbose(`削除: ${file.filename}`);
      }
      totalDeleted++;
      totalSize += file.size;
    }

    // 統合レポートファイルのクリーンアップ
    const reportFiles = this.getTimestampedFiles(this.reportsDir);
    const oldReportFiles = reportFiles.filter(file => file.timestamp < cutoffTimestamp);

    for (const file of oldReportFiles) {
      if (argv['dry-run']) {
        log.verbose(`[DRY RUN] 削除予定: ${file.filename}`);
      } else {
        fs.unlinkSync(file.path);
        log.verbose(`削除: ${file.filename}`);
      }
      totalDeleted++;
      totalSize += file.size;
    }

    // アーカイブファイルのクリーンアップ（より長期保存）
    const archiveFiles = this.getArchiveFiles(this.archivesDir);
    const archiveCutoffDate = new Date();
    archiveCutoffDate.setDate(archiveCutoffDate.getDate() - (argv.days * 3)); // アーカイブは3倍長く保持
    const archiveCutoffTimestamp = this.dateToTimestamp(archiveCutoffDate);
    const oldArchiveFiles = archiveFiles.filter(file => file.timestamp < archiveCutoffTimestamp);

    for (const file of oldArchiveFiles) {
      if (argv['dry-run']) {
        log.verbose(`[DRY RUN] 削除予定: ${file.filename}`);
      } else {
        fs.unlinkSync(file.path);
        log.verbose(`削除: ${file.filename}`);
      }
      totalDeleted++;
      totalSize += file.size;
    }

    if (argv['dry-run']) {
      log.info(`[DRY RUN] 削除予定ファイル数: ${totalDeleted}件`);
      log.info(`[DRY RUN] 削除予定サイズ: ${this.formatBytes(totalSize)}`);
    } else {
      log.success(`削除完了: ${totalDeleted}件 (${this.formatBytes(totalSize)})`);
    }
  }

  /**
   * 2つの監査結果を比較
   */
  async compareResults(file1, file2) {
    log.info(`監査結果比較: ${file1} vs ${file2}`);

    const result1Path = this.findFile(file1);
    const result2Path = this.findFile(file2);

    if (!result1Path || !result2Path) {
      log.error('比較対象ファイルが見つかりません');
      return;
    }

    try {
      const data1 = JSON.parse(fs.readFileSync(result1Path, 'utf8'));
      const data2 = JSON.parse(fs.readFileSync(result2Path, 'utf8'));

      this.displayComparison(data1, data2, path.basename(file1), path.basename(file2));
    } catch (error) {
      log.error(`比較エラー: ${error.message}`);
    }
  }

  /**
   * ファイル検索
   */
  findFile(filename) {
    const searchPaths = [
      path.join(this.resultsDir, filename),
      path.join(this.reportsDir, filename),
      path.resolve(filename)
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        return searchPath;
      }
    }

    return null;
  }

  /**
   * 比較結果表示
   */
  displayComparison(data1, data2, name1, name2) {
    console.log(`\\n📊 監査結果比較: ${name1} vs ${name2}\\n`);

    // 基本統計比較
    if (data1.summary && data2.summary) {
      console.log('## 基本統計比較\\n');
      
      const metrics = [
        { key: 'overallScore', label: '総合スコア', unit: '' },
        { key: 'totalIssues', label: '問題検出数', unit: '件' },
        { key: 'criticalIssues', label: '重要問題数', unit: '件' },
        { key: 'totalRecommendations', label: '推奨事項数', unit: '件' },
        { key: 'executionTime', label: '実行時間', unit: 'ms' }
      ];

      metrics.forEach(metric => {
        const val1 = data1.summary[metric.key] || 0;
        const val2 = data2.summary[metric.key] || 0;
        const diff = val2 - val1;
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
        
        console.log(`${metric.label}: ${val1}${metric.unit} → ${val2}${metric.unit} (${diffStr}${metric.unit}) ${arrow}`);
      });
    }

    // 品質メトリクス比較
    if (data1.aggregatedMetrics?.quality && data2.aggregatedMetrics?.quality) {
      console.log('\\n## 品質メトリクス比較\\n');
      
      const q1 = data1.aggregatedMetrics.quality;
      const q2 = data2.aggregatedMetrics.quality;
      
      if (q1.testCoverage !== undefined && q2.testCoverage !== undefined) {
        const diff = q2.testCoverage - q1.testCoverage;
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
        console.log(`テストカバレッジ: ${q1.testCoverage.toFixed(1)}% → ${q2.testCoverage.toFixed(1)}% (${diffStr}%) ${arrow}`);
      }
    }

    // セキュリティメトリクス比較  
    if (data1.aggregatedMetrics?.security && data2.aggregatedMetrics?.security) {
      console.log('\\n## セキュリティメトリクス比較\\n');
      
      const s1 = data1.aggregatedMetrics.security;
      const s2 = data2.aggregatedMetrics.security;
      
      if (s1.dependencies?.vulnerabilities && s2.dependencies?.vulnerabilities) {
        const v1 = Object.values(s1.dependencies.vulnerabilities).reduce((sum, val) => sum + val, 0);
        const v2 = Object.values(s2.dependencies.vulnerabilities).reduce((sum, val) => sum + val, 0);
        const diff = v2 - v1;
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        const arrow = diff > 0 ? '🔴' : diff < 0 ? '🟢' : '➡️';
        console.log(`脆弱性数: ${v1}件 → ${v2}件 (${diffStr}件) ${arrow}`);
      }
    }
  }

  /**
   * トレンド分析
   */
  async analyzeTrend() {
    log.info('トレンド分析を実行中...');

    const reportFiles = this.getTimestampedFiles(this.reportsDir)
      .filter(file => file.filename.includes('comprehensive-audit-summary'))
      .slice(0, 10); // 最新10件

    if (reportFiles.length < 2) {
      log.warning('トレンド分析には最低2件の履歴が必要です');
      return;
    }

    const trendData = [];
    for (const file of reportFiles) {
      try {
        const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        if (data.summary) {
          trendData.push({
            timestamp: file.timestamp,
            date: file.date,
            overallScore: data.summary.overallScore || 0,
            totalIssues: data.summary.totalIssues || 0,
            criticalIssues: data.summary.criticalIssues || 0,
            testCoverage: data.aggregatedMetrics?.quality?.testCoverage || 0
          });
        }
      } catch (error) {
        log.verbose(`ファイル読み込みエラー: ${file.filename}`);
      }
    }

    if (trendData.length < 2) {
      log.warning('有効なトレンドデータが不足しています');
      return;
    }

    trendData.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    console.log('\\n📈 品質トレンド分析\\n');

    // 総合スコアトレンド
    const firstScore = trendData[0].overallScore;
    const lastScore = trendData[trendData.length - 1].overallScore;
    const scoreTrend = lastScore - firstScore;
    const scoreTrendIcon = scoreTrend > 0 ? '📈' : scoreTrend < 0 ? '📉' : '➡️';

    console.log(`総合スコア: ${firstScore} → ${lastScore} (${scoreTrend > 0 ? '+' : ''}${scoreTrend}) ${scoreTrendIcon}`);

    // テストカバレッジトレンド
    if (trendData[0].testCoverage && trendData[trendData.length - 1].testCoverage) {
      const firstCoverage = trendData[0].testCoverage;
      const lastCoverage = trendData[trendData.length - 1].testCoverage;
      const coverageTrend = lastCoverage - firstCoverage;
      const coverageTrendIcon = coverageTrend > 0 ? '📈' : coverageTrend < 0 ? '📉' : '➡️';

      console.log(`テストカバレッジ: ${firstCoverage.toFixed(1)}% → ${lastCoverage.toFixed(1)}% (${coverageTrend > 0 ? '+' : ''}${coverageTrend.toFixed(1)}%) ${coverageTrendIcon}`);
    }

    // 問題数トレンド
    const firstIssues = trendData[0].totalIssues;
    const lastIssues = trendData[trendData.length - 1].totalIssues;
    const issuesTrend = lastIssues - firstIssues;
    const issuesTrendIcon = issuesTrend > 0 ? '🔴' : issuesTrend < 0 ? '🟢' : '➡️';

    console.log(`問題検出数: ${firstIssues}件 → ${lastIssues}件 (${issuesTrend > 0 ? '+' : ''}${issuesTrend}件) ${issuesTrendIcon}`);

    // 直近の推移表示
    console.log('\\n## 直近の推移\\n');
    trendData.slice(-5).forEach((data, index, arr) => {
      const prefix = index === arr.length - 1 ? '→' : '  ';
      console.log(`${prefix} ${data.date}: スコア${data.overallScore}, 問題${data.totalIssues}件, カバレッジ${data.testCoverage.toFixed(1)}%`);
    });
  }

  /**
   * 履歴統計情報表示
   */
  async showStats() {
    log.info('履歴統計情報を表示中...');

    const results = this.getTimestampedFiles(this.resultsDir);
    const reports = this.getTimestampedFiles(this.reportsDir);
    const archives = this.getArchiveFiles(this.archivesDir);

    const totalFiles = results.length + reports.length + archives.length;
    const totalSize = [...results, ...reports, ...archives]
      .reduce((sum, file) => sum + file.size, 0);

    console.log('\\n📊 履歴統計情報\\n');
    console.log(`総履歴ファイル数: ${totalFiles}件`);
    console.log(`- Phase結果ファイル: ${results.length}件`);
    console.log(`- 統合レポート: ${reports.length}件`);
    console.log(`- アーカイブ: ${archives.length}件`);
    console.log(`\\n総サイズ: ${this.formatBytes(totalSize)}`);

    if (results.length > 0) {
      const avgSize = results.reduce((sum, file) => sum + file.size, 0) / results.length;
      console.log(`Phase結果平均サイズ: ${this.formatBytes(avgSize)}`);
    }

    if (reports.length > 0) {
      const reportAvgSize = reports.reduce((sum, file) => sum + file.size, 0) / reports.length;
      console.log(`レポート平均サイズ: ${this.formatBytes(reportAvgSize)}`);
    }

    // 最新ファイル情報
    if (totalFiles > 0) {
      const allFiles = [...results, ...reports, ...archives]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      
      console.log(`\\n最新ファイル: ${allFiles[0].filename} (${allFiles[0].date})`);
      
      if (allFiles.length > 1) {
        console.log(`最古ファイル: ${allFiles[allFiles.length - 1].filename} (${allFiles[allFiles.length - 1].date})`);
      }
    }

    // クリーンアップ推奨
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - argv.days);
    const cutoffTimestamp = this.dateToTimestamp(cutoffDate);
    
    const oldFiles = [...results, ...reports]
      .filter(file => file.timestamp < cutoffTimestamp);
    
    if (oldFiles.length > 0) {
      const oldSize = oldFiles.reduce((sum, file) => sum + file.size, 0);
      console.log(`\\n⚠️  ${argv.days}日より古いファイル: ${oldFiles.length}件 (${this.formatBytes(oldSize)})`);
      console.log('   クリーンアップ推奨: npm run audit-history clean');
    }
  }

  /**
   * ユーティリティメソッド
   */
  extractTimestamp(filename) {
    const match = filename.match(/(\\d{8}_\\d{6})/);
    return match ? match[1] : '';
  }

  formatTimestamp(timestamp) {
    if (!timestamp || timestamp.length !== 15) return timestamp;
    
    const year = timestamp.substr(0, 4);
    const month = timestamp.substr(4, 2);
    const day = timestamp.substr(6, 2);
    const hour = timestamp.substr(9, 2);
    const minute = timestamp.substr(11, 2);
    const second = timestamp.substr(13, 2);
    
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  }

  dateToTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hour}${minute}${second}`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// ====================================================================
// メイン実行
// ====================================================================

async function main() {
  try {
    const manager = new AuditHistoryManager();
    const command = argv._[0];

    switch (command) {
      case 'list':
        await manager.listHistory();
        break;
      case 'clean':
        await manager.cleanHistory();
        break;
      case 'compare':
        // yargsのcommand設定により、file1, file2は個別のプロパティとして格納される
        const file1 = argv.file1 || argv._[1];
        const file2 = argv.file2 || argv._[2];
        
        if (!file1 || !file2) {
          log.error(`比較には2つのファイルを指定してください`);
          log.error(`現在の引数: file1="${file1}", file2="${file2}"`);
          log.error(`argv._: ${JSON.stringify(argv._)}, argv: ${JSON.stringify({file1: argv.file1, file2: argv.file2})}`);
          process.exit(1);
        }
        await manager.compareResults(file1, file2);
        break;
      case 'trend':
        await manager.analyzeTrend();
        break;
      case 'stats':
        await manager.showStats();
        break;
      default:
        log.info('使用方法: audit-history-manager.js <list|clean|compare|trend|stats> [options]');
        log.info('詳細: audit-history-manager.js --help');
        break;
    }
  } catch (error) {
    log.error(`実行エラー: ${error.message}`);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// スクリプトとして実行された場合のみmain()を呼び出し
if (require.main === module) {
  main();
}

module.exports = { AuditHistoryManager };