/**
 * 外部プロジェクトベンチマークCLIコマンド実装
 * Issue #86: CLI完全統合対応
 *
 * Issue #84で実装された外部プロジェクトベンチマーク機能と
 * Issue #85で追加された統合分析・有効性検証システムのCLI統合
 */

import yargs from 'yargs';
import * as os from 'os';
import * as path from 'path';
import chalk from 'chalk';
import { ExternalProjectBenchmarkRunner } from '../../benchmark/ExternalProjectBenchmarkRunner';
import { BenchmarkTargets } from '../../benchmark/config/benchmark-targets';
import { ValidationReportGenerator } from '../../benchmark/ValidationReportGenerator';
import {
  BenchmarkExternalOptions,
  ProjectSelectionResult,
  BenchmarkExternalResult,
  AVAILABLE_PROJECTS,
  PROJECT_TIERS,
  DEFAULT_OPTIONS,
} from './benchmark-external-types';

/**
 * システムリソースの確認
 */
function checkSystemResources(): { canRun: boolean; warnings: string[] } {
  const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
  const cpuCount = os.cpus().length;

  const { recommended, warnings } = BenchmarkTargets.getRecommendedProjects(
    totalMemoryGB,
    cpuCount
  );

  const canRun = totalMemoryGB >= 2 && cpuCount >= 2; // 最小要件

  if (!canRun) {
    warnings.push('システムリソースが不足しています（最小要件: 2GB RAM, 2 CPU cores）');
  }

  return { canRun, warnings };
}

/**
 * プロジェクト選択とバリデーション
 */
function selectProjects(options: BenchmarkExternalOptions): ProjectSelectionResult {
  let targetProjects: any[] = [];
  let description = '';

  if (options.project) {
    const project = BenchmarkTargets.getProjectByName(options.project);
    if (!project) {
      throw new Error(
        `プロジェクト "${options.project}" が見つかりません。利用可能: ${AVAILABLE_PROJECTS.join(', ')}`
      );
    }
    targetProjects = [project];
    description = `特定プロジェクト: ${options.project}`;
  } else if (options.tier && options.tier !== 'all') {
    const tierNum = parseInt(options.tier) as 1 | 2;
    targetProjects = BenchmarkTargets.getProjectsByTier(tierNum);
    description = `Tier ${options.tier} プロジェクト`;
  } else if (options.tier === 'all') {
    targetProjects = BenchmarkTargets.getAllProjects();
    description = '全プロジェクト';
  } else {
    // デフォルト: Tier 1のみ（高速実行モードでない場合は全プロジェクト）
    targetProjects = options.quick
      ? BenchmarkTargets.getTier1Projects()
      : BenchmarkTargets.getTier1Projects();
    description = options.quick
      ? 'Tier 1 プロジェクト（高速モード）'
      : 'Tier 1 プロジェクト（デフォルト）';
  }

  const estimatedTime = BenchmarkTargets.getEstimatedExecutionTime(targetProjects);

  return {
    projects: targetProjects,
    description,
    estimatedTime,
  };
}

/**
 * ベンチマーク設定の構築
 */
function buildBenchmarkConfig(options: BenchmarkExternalOptions) {
  return {
    outputDir: options.output || DEFAULT_OPTIONS.output,
    cacheDir: options.cacheDir,
    iterations: options.quick ? 1 : options.iterations || DEFAULT_OPTIONS.iterations,
    parallel: options.parallel || DEFAULT_OPTIONS.parallel,
    workerCount: options.workerCount || (options.parallel ? Math.min(4, os.cpus().length) : 1),
    timeout: options.quick ? 60000 : options.timeout || DEFAULT_OPTIONS.timeout,
    maxRetries: options.maxRetries || DEFAULT_OPTIONS.maxRetries,
    verbose: options.verbose || DEFAULT_OPTIONS.verbose,
  };
}

/**
 * 実行情報の表示
 */
function displayExecutionInfo(
  options: BenchmarkExternalOptions,
  selection: ProjectSelectionResult,
  config: any
): void {
  console.log(chalk.cyan('[ExternalBenchmark] Rimor外部プロジェクトベンチマーク'));
  console.log(chalk.cyan('=====================================\n'));

  // システム情報
  console.log(chalk.yellow('📊 システム情報:'));
  console.log(`   プラットフォーム: ${os.platform()}`);
  console.log(`   アーキテクチャ: ${os.arch()}`);
  console.log(`   CPU cores: ${os.cpus().length}`);
  console.log(`   総メモリ: ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log(`   Node.js: ${process.version}\n`);

  // 実行設定
  console.log(chalk.yellow('⚙️  実行設定:'));
  console.log(`   対象: ${selection.description}`);
  if (options.quick) {
    console.log('   モード: 高速実行');
  }
  console.log(`   並列実行: ${config.parallel ? '有効' : '無効'}`);
  console.log(`   実行回数: ${config.iterations}`);
  console.log(`   タイムアウト: ${config.timeout / 1000}秒`);
  console.log(`   有効性検証: ${options.validationReport !== false ? '有効' : '無効'}`);
  console.log(`   推定実行時間: ${selection.estimatedTime.toFixed(1)}秒\n`);

  // 対象プロジェクト
  console.log(chalk.yellow('🎯 対象プロジェクト:'));
  selection.projects.forEach((project, index) => {
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
function displayResultSummary(results: any[], validationReport?: any): void {
  console.log(chalk.green('📋 ベンチマーク結果サマリー'));
  console.log(chalk.green('==========================\n'));

  const successfulResults = results.filter(r => r.success);
  const successRate = results.length > 0 ? (successfulResults.length / results.length) * 100 : 0;

  console.log(
    `✅ 成功率: ${successRate.toFixed(1)}% (${successfulResults.length}/${results.length})`
  );

  if (successfulResults.length > 0) {
    const avgTimePerFile =
      successfulResults.reduce((sum, r) => sum + r.performance.timePerFile, 0) /
      successfulResults.length;
    const target5msAchieved = successfulResults.filter(r => r.target5ms.achieved).length;
    const target5msRate = (target5msAchieved / successfulResults.length) * 100;

    console.log(`⏱️  平均実行時間: ${avgTimePerFile.toFixed(2)}ms/file`);
    console.log(
      `🎯 5ms/file目標達成: ${target5msRate.toFixed(1)}% (${target5msAchieved}/${successfulResults.length})`
    );

    // 全体有効性検証結果の表示
    if (validationReport) {
      console.log(`\n🔍 全体有効性検証結果:`);
      console.log(
        `   🏆 全体有効性スコア: ${validationReport.overallEffectiveness.score.toFixed(1)}/100 (グレード: ${validationReport.overallEffectiveness.grade})`
      );
      console.log(
        `   🔐 TaintTyper有効性: ${validationReport.featureEffectiveness.taintTyper.effectivenessScore.toFixed(1)}/100`
      );
      console.log(
        `   🎯 Intent抽出有効性: ${validationReport.featureEffectiveness.intentExtraction.effectivenessScore.toFixed(1)}/100`
      );
      console.log(
        `   📊 Gap分析有効性: ${validationReport.featureEffectiveness.gapAnalysis.effectivenessScore.toFixed(1)}/100`
      );
      console.log(
        `   📋 NIST評価有効性: ${validationReport.featureEffectiveness.nistEvaluation.effectivenessScore.toFixed(1)}/100`
      );
    }

    // 個別結果
    console.log('\n📊 個別プロジェクト結果:');
    results.forEach(result => {
      console.log(`\n   【${result.projectName}】`);

      // パフォーマンス結果
      const status = result.success ? '✅' : '❌';
      const timeInfo = result.success
        ? `${result.performance.timePerFile.toFixed(2)}ms/file`
        : 'エラー';
      const target5msStatus = result.success && result.target5ms.achieved ? '🎯' : '⚠️';
      console.log(`   ${status} パフォーマンス: ${timeInfo} ${target5msStatus}`);

      // 有効性検証結果（プロジェクトごと）
      if (result.success && result.unifiedAnalysis) {
        console.log(`   📊 有効性検証:`);

        // TaintTyper結果
        const taintDetections = Object.values(
          result.unifiedAnalysis.securityAnalysis.detectionsByType
        ).reduce((a, b) => (a as number) + (b as number), 0);
        console.log(
          `      - TaintTyper: 検出数 ${taintDetections}件、精度 ${(result.unifiedAnalysis.securityAnalysis.estimatedAccuracy * 100).toFixed(0)}%、カバレッジ ${(result.unifiedAnalysis.securityAnalysis.coverageRate * 100).toFixed(0)}%`
        );

        // Intent抽出結果
        console.log(
          `      - Intent抽出: 抽出数 ${result.unifiedAnalysis.intentExtraction.totalIntents}件、成功率 ${(result.unifiedAnalysis.intentExtraction.successRate * 100).toFixed(0)}%、信頼度 ${(result.unifiedAnalysis.intentExtraction.confidenceScore * 100).toFixed(0)}%`
        );

        // Gap分析結果
        console.log(
          `      - Gap分析: ギャップ数 ${result.unifiedAnalysis.gapAnalysis.totalGaps}件、実装カバレッジ ${(result.unifiedAnalysis.gapAnalysis.implementationCoverage * 100).toFixed(0)}%`
        );

        // NIST評価結果
        console.log(
          `      - NIST評価: リスクスコア ${result.unifiedAnalysis.nistEvaluation.overallRiskScore.toFixed(1)}/10、コンプライアンス ${(result.unifiedAnalysis.nistEvaluation.complianceScore * 100).toFixed(0)}%、改善提案 ${result.unifiedAnalysis.nistEvaluation.improvementProposals}件`
        );
      } else if (result.success && !result.unifiedAnalysis) {
        console.log(`   📊 有効性検証: 無効化されています`);
      }

      if (!result.success && result.error) {
        console.log(`      ❌ エラー: ${result.error}`);
      }
    });
  }

  console.log();
}

/**
 * 外部プロジェクトベンチマークコマンドの実装
 */
export async function benchmarkExternalCommand(
  projectName: string | undefined,
  options: BenchmarkExternalOptions
): Promise<BenchmarkExternalResult> {
  try {
    // プロジェクト名が指定された場合はoptionsに設定
    if (projectName) {
      options.project = projectName;
    }

    // システムリソースの確認
    const { canRun, warnings } = checkSystemResources();

    if (warnings.length > 0) {
      console.log(chalk.yellow('⚠️  警告:'));
      warnings.forEach(warning => console.log(`   ${warning}`));
      console.log();
    }

    if (!canRun) {
      throw new Error('システムリソースが不足しているため、ベンチマークを実行できません。');
    }

    // プロジェクト選択
    const selection = selectProjects(options);
    const config = buildBenchmarkConfig(options);

    // 実行情報表示
    displayExecutionInfo(options, selection, config);

    // 実行確認（高速モード以外）
    if (!options.quick && selection.projects.length > 1) {
      console.log(chalk.yellow('⚠️  複数プロジェクトのベンチマークは時間がかかります。'));
      console.log('   高速実行には --quick オプションを使用してください。\n');
    }

    // ベンチマーク実行
    console.log(chalk.cyan('[ExternalBenchmark] ベンチマーク実行開始...\n'));

    const runner = new ExternalProjectBenchmarkRunner(config);
    const results = await runner.runMultiProjectBenchmark(selection.projects);

    // 比較レポートの生成
    const comparisonReport = await runner.generateComparisonReport(results);

    // 有効性検証レポートの生成（デフォルトで有効）
    let validationReport;
    if (options.validationReport !== false) {
      const validator = new ValidationReportGenerator();
      validationReport = await validator.generateValidationReport(results, comparisonReport);
    }

    // 結果表示
    displayResultSummary(results, validationReport);

    // 成功基準の検証
    const successCriteria = BenchmarkTargets.getSuccessCriteria();
    const overallSuccess =
      comparisonReport.overallPerformance.target5msAchievementRate >=
      successCriteria.performance.target5msPerFile.target;

    console.log(chalk.yellow('🎯 成功基準の検証:'));
    console.log(
      `   5ms/file目標達成率: ${(comparisonReport.overallPerformance.target5msAchievementRate * 100).toFixed(1)}% (目標: 80%以上)`
    );
    console.log(
      `   全体成功率: ${(comparisonReport.overallPerformance.successRate * 100).toFixed(1)}% (目標: 95%以上)`
    );

    if (overallSuccess) {
      console.log(chalk.green('\n✅ ベンチマーク成功！性能目標を達成しました。'));
    } else {
      console.log(chalk.yellow('\n⚠️  ベンチマーク完了。一部目標が未達成です。'));
    }

    // 出力ファイルの場所を表示
    console.log(`\n📄 詳細結果: ${config.outputDir}/reports/`);

    return {
      success: overallSuccess,
      projectCount: results.length,
      totalExecutionTime: results.reduce((sum, r) => sum + (r.performance?.executionTime || 0), 0),
      successfulProjects: results.filter(r => r.success).length,
      overallEffectivenessScore: validationReport?.overallEffectiveness?.score,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('❌ ベンチマーク実行エラー:'), errorMessage);

    return {
      success: false,
      projectCount: 0,
      totalExecutionTime: 0,
      successfulProjects: 0,
      error: errorMessage,
    };
  }
}

/**
 * yargsコマンド定義の作成
 */
export function createBenchmarkExternalCommand() {
  return {
    command: 'external [project]',
    describe: '外部TypeScriptプロジェクトでベンチマーク実行（Issue #84 + #85統合）',
    builder: (yargs: any) => {
      return yargs
        .positional('project', {
          describe:
            '特定プロジェクト名 (typescript, ant-design, vscode, material-ui, storybook, deno)',
          type: 'string',
        })
        .option('tier', {
          describe: 'ベンチマーク対象ティア (1, 2, all)',
          type: 'string',
          choices: ['1', '2', 'all'],
          default: DEFAULT_OPTIONS.tier,
        })
        .option('quick', {
          describe: '高速実行モード（最小設定）',
          type: 'boolean',
          default: DEFAULT_OPTIONS.quick,
        })
        .option('verbose', {
          alias: 'v',
          describe: '詳細ログを表示',
          type: 'boolean',
          default: DEFAULT_OPTIONS.verbose,
        })
        .option('parallel', {
          describe: '並列実行を有効化',
          type: 'boolean',
          default: DEFAULT_OPTIONS.parallel,
        })
        .option('output', {
          alias: 'o',
          describe: '出力ディレクトリ',
          type: 'string',
          default: DEFAULT_OPTIONS.output,
        })
        .option('iterations', {
          describe: '実行回数',
          type: 'number',
          default: DEFAULT_OPTIONS.iterations,
        })
        .option('timeout', {
          describe: 'タイムアウト（ミリ秒）',
          type: 'number',
          default: DEFAULT_OPTIONS.timeout,
        })
        .option('max-retries', {
          describe: '最大リトライ回数',
          type: 'number',
          default: DEFAULT_OPTIONS.maxRetries,
        })
        .option('worker-count', {
          describe: '並列ワーカー数',
          type: 'number',
        })
        .option('cache-dir', {
          describe: 'キャッシュディレクトリ',
          type: 'string',
        })
        .option('baseline-comparison', {
          describe: 'ベースライン比較を実行',
          type: 'boolean',
          default: DEFAULT_OPTIONS.baselineComparison,
        })
        .option('validation-report', {
          describe: '有効性検証レポートを生成',
          type: 'boolean',
          default: DEFAULT_OPTIONS.validationReport,
        })
        .example('$0 benchmark external', '全プロジェクトでベンチマーク実行')
        .example('$0 benchmark external --tier=1', 'Tier 1プロジェクトのみ実行')
        .example('$0 benchmark external typescript', 'TypeScriptプロジェクトのみ実行')
        .example('$0 benchmark external --quick --parallel', '高速モードで並列実行')
        .example('$0 benchmark external --verbose --iterations=3', '詳細ログ付きで3回実行');
    },
    handler: async (argv: any) => {
      const options: BenchmarkExternalOptions = {
        project: argv.project,
        tier: argv.tier,
        quick: argv.quick,
        verbose: argv.verbose,
        parallel: argv.parallel,
        output: argv.output,
        iterations: argv.iterations,
        timeout: argv.timeout,
        maxRetries: argv['max-retries'],
        workerCount: argv['worker-count'],
        cacheDir: argv['cache-dir'],
        baselineComparison: argv['baseline-comparison'],
        validationReport: argv['validation-report'],
      };

      const result = await benchmarkExternalCommand(argv.project, options);
      process.exit(result.success ? 0 : 1);
    },
  };
}
