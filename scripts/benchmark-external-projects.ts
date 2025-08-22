#!/usr/bin/env ts-node

/**
 * 外部TypeScriptプロジェクトベンチマーク実行スクリプト
 * issue #84: TypeScript有名プロジェクトを用いた性能ベンチマーク実装
 * 
 * 使用方法:
 * npm run benchmark:external
 * npm run benchmark:external -- --tier=1
 * npm run benchmark:external -- --project=typescript
 * npm run benchmark:external -- --quick
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';
import { ExternalProjectBenchmarkRunner } from '../src/benchmark/ExternalProjectBenchmarkRunner';
import { BenchmarkTargets } from '../src/benchmark/config/benchmark-targets';

/**
 * CLI引数の定義
 */
interface BenchmarkArgs {
  tier?: 1 | 2;
  project?: string;
  quick?: boolean;
  verbose?: boolean;
  parallel?: boolean;
  output?: string;
  iterations?: number;
  timeout?: number;
  'max-retries'?: number;
  'worker-count'?: number;
  'cache-dir'?: string;
  'baseline-comparison'?: boolean;
  help?: boolean;
}

/**
 * システムリソースの確認
 */
function checkSystemResources(): { canRun: boolean; warnings: string[] } {
  const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
  const cpuCount = os.cpus().length;
  
  const { recommended, warnings } = BenchmarkTargets.getRecommendedProjects(totalMemoryGB, cpuCount);
  
  const canRun = totalMemoryGB >= 2 && cpuCount >= 2; // 最小要件
  
  if (!canRun) {
    warnings.push('システムリソースが不足しています（最小要件: 2GB RAM, 2 CPU cores）');
  }
  
  return { canRun, warnings };
}

/**
 * ベンチマーク設定の表示
 */
function displayBenchmarkInfo(args: BenchmarkArgs): void {
  console.log('🚀 Rimor外部プロジェクトベンチマーク');
  console.log('=====================================\n');
  
  // システム情報
  console.log('📊 システム情報:');
  console.log(`   プラットフォーム: ${os.platform()}`);
  console.log(`   アーキテクチャ: ${os.arch()}`);
  console.log(`   CPU cores: ${os.cpus().length}`);
  console.log(`   総メモリ: ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`   Node.js: ${process.version}\n`);
  
  // 実行設定
  console.log('⚙️  実行設定:');
  if (args.tier) {
    console.log(`   ティア: ${args.tier}`);
  }
  if (args.project) {
    console.log(`   プロジェクト: ${args.project}`);
  }
  if (args.quick) {
    console.log('   モード: 高速実行');
  }
  console.log(`   並列実行: ${args.parallel ? '有効' : '無効'}`);
  console.log(`   実行回数: ${args.iterations || 1}`);
  console.log(`   タイムアウト: ${(args.timeout || 300000) / 1000}秒\n`);
}

/**
 * 対象プロジェクトの表示
 */
function displayTargetProjects(projects: any[]): void {
  console.log('🎯 対象プロジェクト:');
  projects.forEach((project, index) => {
    console.log(`   ${index + 1}. ${project.name}`);
    console.log(`      - ファイル数(予想): ${project.expectedFileCount}`);
    console.log(`      - 目標時間: ${project.target5msPerFile}ms/file`);
    console.log(`      - タイムアウト: ${project.timeout / 1000}秒`);
  });
  console.log();
}

/**
 * 結果サマリーの表示
 */
function displayResultSummary(results: any[]): void {
  console.log('📋 ベンチマーク結果サマリー');
  console.log('==========================\n');
  
  const successfulResults = results.filter(r => r.success);
  const successRate = results.length > 0 ? (successfulResults.length / results.length) * 100 : 0;
  
  console.log(`✅ 成功率: ${successRate.toFixed(1)}% (${successfulResults.length}/${results.length})`);
  
  if (successfulResults.length > 0) {
    const avgTimePerFile = successfulResults.reduce((sum, r) => sum + r.performance.timePerFile, 0) / successfulResults.length;
    const target5msAchieved = successfulResults.filter(r => r.target5ms.achieved).length;
    const target5msRate = (target5msAchieved / successfulResults.length) * 100;
    
    console.log(`⏱️  平均実行時間: ${avgTimePerFile.toFixed(2)}ms/file`);
    console.log(`🎯 5ms/file目標達成: ${target5msRate.toFixed(1)}% (${target5msAchieved}/${successfulResults.length})`);
    
    // 個別結果
    console.log('\n📊 個別プロジェクト結果:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const timeInfo = result.success ? `${result.performance.timePerFile.toFixed(2)}ms/file` : 'エラー';
      const target5msStatus = result.success && result.target5ms.achieved ? '🎯' : '⚠️';
      
      console.log(`   ${status} ${result.projectName}: ${timeInfo} ${target5msStatus}`);
      
      if (!result.success && result.error) {
        console.log(`      エラー: ${result.error}`);
      }
    });
  }
  
  console.log();
}

/**
 * 改善推奨事項の表示
 */
function displayRecommendations(comparisonReport: any): void {
  if (comparisonReport.recommendations && comparisonReport.recommendations.length > 0) {
    console.log('💡 改善推奨事項:');
    comparisonReport.recommendations.forEach((rec: string, index: number) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log();
  }
}

/**
 * ベースライン統合結果の表示
 * Phase 3: BaselineManager統合機能対応
 */
function displayIntegratedResults(integratedResult: any): void {
  const { results, comparison, baselineId, usedBaselineId } = integratedResult;
  
  console.log('📊 ベースライン統合ベンチマーク結果');
  console.log('=================================\n');
  
  // 基本結果表示
  displayResultSummary(results);
  
  // ベースライン情報
  console.log('🔗 ベースライン情報:');
  console.log(`   新規作成: ${baselineId}`);
  if (usedBaselineId) {
    console.log(`   比較対象: ${usedBaselineId}`);
  }
  console.log();
  
  // 比較結果の表示
  if (comparison) {
    console.log('📈 ベースライン比較結果:');
    console.log(`   全体改善率: ${comparison.overallImprovement.toFixed(2)}%`);
    
    console.log('\n📊 プロジェクト別比較:');
    comparison.projectComparisons.forEach((comp: any) => {
      const improvementIcon = comp.performanceImprovement > 0 ? '📈' : comp.performanceImprovement < 0 ? '📉' : '➡️';
      const targetIcon = comp.target5msStatus === 'improved' ? '🎯' : comp.target5msStatus === 'maintained' ? '✅' : '⚠️';
      
      console.log(`   ${improvementIcon} ${comp.projectName}:`);
      console.log(`      性能改善: ${comp.performanceImprovement.toFixed(1)}%`);
      console.log(`      精度改善: ${comp.accuracyImprovement.toFixed(1)}%`);
      console.log(`      5ms目標: ${comp.target5msStatus} ${targetIcon}`);
    });
    
    // 推奨事項
    if (comparison.recommendations && comparison.recommendations.length > 0) {
      console.log('\n💡 ベースライン比較推奨事項:');
      comparison.recommendations.forEach((rec: string, index: number) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  } else {
    console.log('📝 初回実行のため、ベースライン比較はありません。');
    console.log('   次回実行時からベースライン比較が利用可能になります。');
  }
  
  console.log();
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  // 非推奨警告の表示
  console.log(chalk.yellow('⚠️  非推奨警告:'));
  console.log(chalk.yellow('   このスクリプトは非推奨です。代わりに以下のCLIコマンドを使用してください:'));
  console.log(chalk.cyan('   rimor benchmark external [options]'));
  console.log(chalk.yellow('   詳細: rimor benchmark external --help'));
  console.log(chalk.yellow('   この警告は将来のバージョンで削除される予定です。\n'));
  // CLI引数の解析
  const argv = await yargs(hideBin(process.argv))
    .option('tier', {
      describe: 'ベンチマーク対象ティア (1: 最優先, 2: 追加評価)',
      type: 'number',
      choices: [1, 2]
    })
    .option('project', {
      describe: '特定プロジェクト名 (typescript, ant-design, vscode, material-ui, storybook, deno)',
      type: 'string'
    })
    .option('quick', {
      describe: '高速実行モード（最小設定）',
      type: 'boolean',
      default: false
    })
    .option('verbose', {
      alias: 'v',
      describe: '詳細ログを表示',
      type: 'boolean',
      default: false
    })
    .option('parallel', {
      describe: '並列実行を有効化',
      type: 'boolean',
      default: false
    })
    .option('output', {
      alias: 'o',
      describe: '出力ディレクトリ',
      type: 'string',
      default: './.rimor/benchmark-results'
    })
    .option('iterations', {
      describe: '実行回数',
      type: 'number',
      default: 1
    })
    .option('timeout', {
      describe: 'タイムアウト（ミリ秒）',
      type: 'number',
      default: 300000
    })
    .option('max-retries', {
      describe: '最大リトライ回数',
      type: 'number',
      default: 3
    })
    .option('worker-count', {
      describe: '並列ワーカー数',
      type: 'number'
    })
    .option('cache-dir', {
      describe: 'キャッシュディレクトリ',
      type: 'string'
    })
    .help()
    .alias('help', 'h')
    .example('$0', '全プロジェクトでベンチマーク実行')
    .example('$0 --tier=1', 'Tier 1プロジェクトのみ実行')
    .example('$0 --project=typescript', 'TypeScriptプロジェクトのみ実行')
    .example('$0 --quick --parallel', '高速モードで並列実行')
    .example('$0 --verbose --iterations=3', '詳細ログ付きで3回実行')
    .argv as BenchmarkArgs;

  // システムリソースの確認
  const { canRun, warnings } = checkSystemResources();
  
  if (warnings.length > 0) {
    console.log('⚠️  警告:');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log();
  }
  
  if (!canRun) {
    console.error('❌ システムリソースが不足しているため、ベンチマークを実行できません。');
    process.exit(1);
  }

  // 対象プロジェクトの決定
  let targetProjects: any[] = [];
  
  if (argv.project) {
    const project = BenchmarkTargets.getProjectByName(argv.project);
    if (!project) {
      console.error(`❌ プロジェクト "${argv.project}" が見つかりません。`);
      console.log('利用可能なプロジェクト:');
      BenchmarkTargets.getAllProjects().forEach(p => console.log(`   - ${p.name.toLowerCase()}`));
      process.exit(1);
    }
    targetProjects = [project];
  } else if (argv.tier) {
    targetProjects = BenchmarkTargets.getProjectsByTier(argv.tier);
  } else {
    // デフォルト: Tier 1のみ（高速実行モードでない場合は全プロジェクト）
    targetProjects = argv.quick ? BenchmarkTargets.getTier1Projects() : BenchmarkTargets.getAllProjects();
  }

  // ベンチマーク設定
  const benchmarkConfig = {
    outputDir: argv.output,
    cacheDir: argv['cache-dir'],
    iterations: argv.quick ? 1 : argv.iterations,
    parallel: argv.parallel,
    workerCount: argv['worker-count'] || (argv.parallel ? Math.min(4, os.cpus().length) : 1),
    timeout: argv.quick ? 60000 : argv.timeout, // 高速モードでは1分
    maxRetries: argv['max-retries'],
    verbose: argv.verbose
  };

  // 情報表示
  displayBenchmarkInfo(argv);
  displayTargetProjects(targetProjects);

  // 推定実行時間の表示
  const estimatedTime = BenchmarkTargets.getEstimatedExecutionTime(targetProjects);
  console.log(`⏱️  推定実行時間: ${estimatedTime.toFixed(1)}秒\n`);

  // 実行確認（高速モード以外）
  if (!argv.quick && targetProjects.length > 1) {
    console.log('⚠️  複数プロジェクトのベンチマークは時間がかかります。');
    console.log('   高速実行には --quick オプションを使用してください。\n');
  }

  try {
    // ベンチマーク実行
    console.log('🚀 ベンチマーク実行開始...\n');
    
    const runner = new ExternalProjectBenchmarkRunner(benchmarkConfig);
    const results = await runner.runMultiProjectBenchmark(targetProjects);
    
    // 比較レポートの生成
    const comparisonReport = await runner.generateComparisonReport(results);
    
    // 結果表示
    displayResultSummary(results);
    displayRecommendations(comparisonReport);
    
    // 成功基準の検証
    const successCriteria = BenchmarkTargets.getSuccessCriteria();
    const overallSuccess = comparisonReport.overallPerformance.target5msAchievementRate >= 
                          successCriteria.performance.target5msPerFile.target;
    
    console.log('🎯 成功基準の検証:');
    console.log(`   5ms/file目標達成率: ${(comparisonReport.overallPerformance.target5msAchievementRate * 100).toFixed(1)}% (目標: 80%以上)`);
    console.log(`   全体成功率: ${(comparisonReport.overallPerformance.successRate * 100).toFixed(1)}% (目標: 95%以上)`);
    
    if (overallSuccess) {
      console.log('\n✅ ベンチマーク成功！性能目標を達成しました。');
    } else {
      console.log('\n⚠️  ベンチマーク完了。一部目標が未達成です。');
    }
    
    // 出力ファイルの場所を表示
    console.log(`\n📄 詳細結果: ${argv.output}/reports/`);
    
    // 終了コード
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.error('❌ ベンチマーク実行エラー:', error);
    process.exit(1);
  }
}

/**
 * エラーハンドリング
 */
process.on('uncaughtException', (error) => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未処理のPromise拒否:', reason);
  process.exit(1);
});

// Ctrl+C対応
process.on('SIGINT', () => {
  console.log('\n🛑 ベンチマークがキャンセルされました。');
  process.exit(130);
});

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ メイン関数実行エラー:', error);
    process.exit(1);
  });
}