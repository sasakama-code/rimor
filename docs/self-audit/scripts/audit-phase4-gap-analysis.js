#!/usr/bin/env node

/**
 * Phase 4: 差異分析・改善提案スクリプト (改善版)
 * 
 * 期待結果vs実際結果の差異分析と改善提案生成
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('output', { alias: 'o', type: 'string', default: 'phase4-gap-analysis.json' })
  .option('format', { alias: 'f', type: 'string', default: 'json' })
  .option('verbose', { alias: 'v', type: 'boolean', default: false })
  .option('archive', { type: 'boolean', default: false })
  .option('archive-dir', { type: 'string', default: 'audit-results/archives' })
  .help().argv;

const log = {
  info: (msg) => argv.verbose && console.log(`ℹ️  ${msg}`),
  success: (msg) => argv.verbose && console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

async function main() {
  try {
    log.info('Phase 4: 差異分析・改善提案開始');
    
    const results = {
      timestamp: new Date().toISOString(),
      phase: '4',
      name: '差異分析・改善提案',
      summary: { 
        expectedScore: 95,
        actualScore: 0,
        gapIdentified: 0,
        overallScore: 80
      },
      details: {
        expectedResults: {
          testCoverage: 95,
          securityCoverage: 90,
          issuesFound: 5
        },
        actualResults: {},
        gaps: [],
        improvementPlan: null
      },
      recommendations: [],
      executionTime: 0
    };

    const startTime = Date.now();

    // 他のPhase結果を読み込んで実際の結果を集計
    log.info('他のPhase結果を分析中...');
    
    const phaseResultsDir = path.dirname(argv.output);
    let actualTestCoverage = 0;
    let actualSecurityCoverage = 0;
    let actualIssuesFound = 0;

    // Phase 1結果
    try {
      const phase1Path = path.join(phaseResultsDir, 'phase1-basic.json');
      if (fs.existsSync(phase1Path)) {
        const phase1 = JSON.parse(fs.readFileSync(phase1Path, 'utf8'));
        actualTestCoverage = phase1.summary?.testCoverage || 0;
        actualIssuesFound += phase1.summary?.issuesFound || 0;
      }
    } catch (err) { 
      log.info(`Phase 1結果の読み込みに失敗: ${err.message}`);
      
      // verboseモードの場合は詳細なエラー情報を出力
      if (argv.verbose) {
        log.error(`Phase 1読み込み詳細エラー:`);
        log.error(`  ファイルパス: ${phase1Path}`);
        log.error(`  エラーコード: ${err.code || 'N/A'}`);
        log.error(`  エラータイプ: ${err.name || 'Unknown'}`);
        if (err.code === 'ENOENT') {
          log.error(`  原因: ファイルが存在しません`);
        } else if (err.name === 'SyntaxError') {
          log.error(`  原因: JSONの構文エラー`);
        }
      }
    }

    // Phase 2結果  
    try {
      const phase2Path = path.join(phaseResultsDir, 'phase2-security.json');
      if (fs.existsSync(phase2Path)) {
        const phase2 = JSON.parse(fs.readFileSync(phase2Path, 'utf8'));
        actualSecurityCoverage = phase2.summary?.testCoverage || 0;
        actualIssuesFound += phase2.summary?.issuesFound || 0;
      }
    } catch (err) { 
      log.info(`Phase 2結果の読み込みに失敗: ${err.message}`);
      
      // verboseモードの場合は詳細なエラー情報を出力
      if (argv.verbose) {
        log.error(`Phase 2読み込み詳細エラー:`);
        log.error(`  ファイルパス: ${phase2Path}`);
        log.error(`  エラーコード: ${err.code || 'N/A'}`);
        log.error(`  エラータイプ: ${err.name || 'Unknown'}`);
        if (err.code === 'ENOENT') {
          log.error(`  原因: ファイルが存在しません`);
        } else if (err.name === 'SyntaxError') {
          log.error(`  原因: JSONの構文エラー`);
        }
      }
    }

    results.details.actualResults = {
      testCoverage: actualTestCoverage,
      securityCoverage: actualSecurityCoverage,
      issuesFound: actualIssuesFound
    };

    // ギャップ分析
    const gaps = [];
    
    if (actualTestCoverage < results.details.expectedResults.testCoverage) {
      const gap = results.details.expectedResults.testCoverage - actualTestCoverage;
      gaps.push({
        category: 'testCoverage',
        expected: results.details.expectedResults.testCoverage,
        actual: actualTestCoverage,
        gap: gap,
        severity: gap > 20 ? 'high' : gap > 10 ? 'medium' : 'low'
      });
      
      results.recommendations.push({
        priority: gap > 20 ? 'high' : 'medium',
        category: 'testing',
        title: `テストカバレッジギャップ ${gap.toFixed(1)}%`,
        description: `期待値${results.details.expectedResults.testCoverage}%に対し実際は${actualTestCoverage.toFixed(1)}%`,
        suggestions: [
          '未テストファイルの特定とテスト作成',
          'エッジケースのテスト追加',
          'テスト品質の向上'
        ],
        impact: gap > 20 ? 'high' : 'medium'
      });
    }

    if (actualSecurityCoverage < results.details.expectedResults.securityCoverage) {
      const gap = results.details.expectedResults.securityCoverage - actualSecurityCoverage;
      gaps.push({
        category: 'securityCoverage',
        expected: results.details.expectedResults.securityCoverage,
        actual: actualSecurityCoverage,
        gap: gap,
        severity: 'high'
      });
      
      results.recommendations.push({
        priority: 'high',
        category: 'security',
        title: `セキュリティテストカバレッジギャップ ${gap.toFixed(1)}%`,
        description: `セキュリティモジュールのテストが不足しています`,
        suggestions: [
          'セキュリティ機能のユニットテスト作成',
          '統合セキュリティテストの実装',
          'TaintTyper機能のテスト強化'
        ],
        impact: 'high'
      });
    }

    results.details.gaps = gaps;
    results.summary.actualScore = Math.round((actualTestCoverage + actualSecurityCoverage) / 2);
    results.summary.gapIdentified = gaps.length;

    // 改善計画生成
    results.details.improvementPlan = {
      phase1: {
        duration: '1週間',
        target: '重要なギャップの修正',
        actions: gaps.filter(g => g.severity === 'high').map(g => `${g.category}の改善`)
      },
      phase2: {
        duration: '2週間', 
        target: '全体的な品質向上',
        actions: ['残りのテスト実装', '品質指標の達成']
      },
      phase3: {
        duration: '継続的',
        target: '品質維持・向上',
        actions: ['定期監査', '継続的改善']
      }
    };

    results.executionTime = Date.now() - startTime;
    
    fs.writeFileSync(argv.output, JSON.stringify(results, null, 2));
    log.success(`Phase 4完了: ${results.executionTime}ms (${gaps.length}個のギャップ特定)`);
    
  } catch (error) {
    log.error(`Phase 4実行エラー: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };