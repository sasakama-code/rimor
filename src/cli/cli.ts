import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AnalyzeCommand } from './commands/analyze';
import { AIOutputCommand } from './commands/ai-output';
import { createTaintAnalysisCommand } from './commands/taint-analysis';
import { IntentAnalyzeCommand } from './commands/intent-analyze';
import { DomainAnalyzeCommand } from './commands/domain-analyze';
import { UnifiedAnalyzeCommand } from './commands/unified-analyze';
import { ImplementationTruthAnalyzeCommand, ImplementationTruthCliParser } from './commands/implementation-truth-analyze';
import { createBenchmarkExternalCommand } from './commands/benchmark-external';
import { container, TYPES } from '../container';
import * as os from 'os';

export class CLI {
  /**
   * 統合分析コマンドの共通オプション設定
   * DRY原則に従った重複排除
   */
  private createUnifiedAnalyzeOptions(yargs: any) {
    return yargs
      .positional('path', {
        describe: '分析対象のディレクトリパス',
        type: 'string',
        default: '.'
      })
      .option('format', {
        alias: 'f',
        describe: '出力フォーマット',
        type: 'string',
        choices: ['text', 'json', 'markdown', 'html', 'ai-json'],
        default: 'text'
      })
      .option('output', {
        alias: 'o',
        describe: '出力ファイルパス',
        type: 'string'
      })
      .option('verbose', {
        alias: 'v',
        describe: '詳細な出力を表示',
        type: 'boolean',
        default: false
      })
      .option('include-recommendations', {
        describe: '改善提案を含める',
        type: 'boolean',
        default: true
      })
      // 従来の互換性オプション
      .option('json', {
        describe: 'JSON形式で出力（--format=json の短縮形）',
        type: 'boolean',
        default: false
      })
      .option('parallel', {
        describe: '並列処理を有効化',
        type: 'boolean',
        default: false
      })
      .option('cache', {
        describe: 'キャッシュ機能を有効化',
        type: 'boolean',
        default: true
      })
      .option('include-details', {
        describe: '詳細情報を含める（データフロー分析など）',
        type: 'boolean',
        default: false
      })
      // 統合分析設定
      .option('enable-taint-analysis', {
        describe: 'Taint分析を有効化',
        type: 'boolean',
        default: true
      })
      .option('enable-intent-extraction', {
        describe: 'Intent抽出を有効化',
        type: 'boolean',
        default: true
      })
      .option('enable-gap-detection', {
        describe: 'Gap検出を有効化',
        type: 'boolean',
        default: true
      })
      .option('enable-nist-evaluation', {
        describe: 'NIST評価を有効化',
        type: 'boolean',
        default: true
      })
      // 実行設定
      .option('timeout', {
        describe: 'タイムアウト（ミリ秒）',
        type: 'number',
        default: 30000
      });
  }

  /**
   * 統合分析コマンドの共通ハンドラー
   * 単一責任の原則に従った処理の分離
   */
  private async handleUnifiedAnalyze(argv: any): Promise<void> {
    try {
      // DIコンテナからUnifiedAnalyzeCommandを取得
      const unifiedAnalyzeCommand = container.get<UnifiedAnalyzeCommand>(TYPES.UnifiedAnalyzeCommand);
      
      // --json フラグが指定された場合は format を json に上書き
      const format = argv.json ? 'json' : argv.format;
      
      await unifiedAnalyzeCommand.execute({
        path: argv.path || '.',
        format: format as 'text' | 'json' | 'markdown' | 'html' | 'ai-json',
        output: argv.output,
        verbose: argv.verbose,
        includeRecommendations: argv['include-recommendations'],
        // 従来の互換性オプション
        parallel: argv.parallel,
        cache: argv.cache,
        includeDetails: argv['include-details'],
        // 統合分析設定
        enableTaintAnalysis: argv['enable-taint-analysis'],
        enableIntentExtraction: argv['enable-intent-extraction'],
        enableGapDetection: argv['enable-gap-detection'],
        enableNistEvaluation: argv['enable-nist-evaluation'],
        // 実行設定
        timeout: argv.timeout
      });
    } catch (error) {
      console.error('統合分析中にエラーが発生しました:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  async run(): Promise<void> {
    await yargs(hideBin(process.argv))
      .scriptName('rimor')
      .usage('$0 <command> [options]')
      .command(
        'analyze-legacy [path]',
        'テスト品質を分析します（v0.8.0 Context Engineering対応・従来版）',
        (yargs) => {
          return yargs
            .positional('path', {
              describe: '分析対象のディレクトリパス（デフォルト: カレントディレクトリ）',
              type: 'string',
              default: '.'
            })
            .option('verbose', {
              alias: 'v',
              describe: '詳細な出力を表示',
              type: 'boolean',
              default: false
            })
            .option('format', {
              alias: 'f',
              describe: '出力フォーマット',
              type: 'string',
              choices: ['text', 'json', 'markdown', 'html', 'ai-json'],
              default: 'text'
            })
            .option('json', {
              describe: 'JSON形式で出力（--format=json の短縮形）',
              type: 'boolean',
              default: false
            })
            // v0.8.0 新オプション
            .option('output-json', {
              describe: '分析結果をJSON形式でファイルに出力',
              type: 'string'
            })
            .option('output-markdown', {
              describe: '分析結果をMarkdown形式でファイルに出力',
              type: 'string'
            })
            .option('output-html', {
              describe: '分析結果をHTML形式でファイルに出力',
              type: 'string'
            })
            .option('output-ai-json', {
              describe: '分析結果をAI JSON形式でファイルに出力',
              type: 'string'
            })
            .option('annotate', {
              describe: 'ソースコードにインライン・アノテーションを追加',
              type: 'boolean',
              default: false
            })
            .option('annotate-format', {
              describe: 'アノテーション形式',
              type: 'string',
              choices: ['inline', 'block'],
              default: 'inline'
            })
            .option('annotate-output', {
              describe: 'アノテーション付きファイルの出力先ディレクトリ',
              type: 'string'
            })
            .option('preview', {
              describe: 'アノテーションのプレビューモード（ファイルを変更しない）',
              type: 'boolean',
              default: false
            })
            .option('include-details', {
              describe: '詳細情報を含める（データフロー分析など）',
              type: 'boolean',
              default: false
            })
            .option('include-recommendations', {
              describe: '改善提案を含める',
              type: 'boolean',
              default: true
            })
            .option('severity', {
              describe: 'フィルタする重要度（複数指定可）',
              type: 'array',
              choices: ['critical', 'high', 'medium', 'low', 'info']
            })
            // 既存オプション
            .option('performance', {
              describe: 'パフォーマンス監視を有効化',
              type: 'boolean',
              default: false
            })
            .option('show-performance-report', {
              describe: 'パフォーマンスレポートを表示',
              type: 'boolean',
              default: false
            })
            .option('parallel', {
              describe: '並列処理を有効化',
              type: 'boolean',
              default: false
            })
            .option('cache', {
              describe: 'キャッシュ機能を有効化',
              type: 'boolean',
              default: true
            })
            .option('clear-cache', {
              describe: 'キャッシュをクリア',
              type: 'boolean',
              default: false
            })
            .option('show-cache-stats', {
              describe: 'キャッシュ統計を表示',
              type: 'boolean',
              default: false
            })
            // v0.9.0 Implementation Truth オプション
            .option('implementation-truth', {
              describe: 'Implementation Truth分析を有効化（v0.9.0新機能）',
              type: 'boolean',
              default: false
            })
            .option('test-path', {
              alias: 't',
              describe: 'テストコードのパス（Implementation Truth用）',
              type: 'string'
            })
            .option('production-code', {
              describe: 'プロダクションコード分析モードを有効化',
              type: 'boolean',
              default: false
            })
            .option('ai-output', {
              describe: 'AI向け最適化出力を有効化',
              type: 'boolean',
              default: false
            })
            .option('debug', {
              describe: 'デバッグモードを有効化（詳細なエラー情報を表示）',
              type: 'boolean',
              default: false
            });
        },
        async (argv) => {
          const analyzeCommand = new AnalyzeCommand();
          // --json フラグが指定された場合は format を json に上書き
          const format = argv.json ? 'json' : argv.format;
          await analyzeCommand.execute({
            path: argv.path || '.',
            verbose: argv.verbose,
            format: format as 'text' | 'json' | 'markdown' | 'html',
            // v0.8.0 新オプション
            outputJson: argv['output-json'],
            outputMarkdown: argv['output-markdown'],
            outputHtml: argv['output-html'],
            outputAiJson: argv['output-ai-json'],
            annotate: argv.annotate,
            annotateFormat: argv['annotate-format'] as 'inline' | 'block',
            annotateOutput: argv['annotate-output'],
            preview: argv.preview,
            includeDetails: argv['include-details'],
            includeRecommendations: argv['include-recommendations'],
            severity: argv.severity as string[],
            // 既存オプション
            performance: argv.performance,
            showPerformanceReport: argv['show-performance-report'],
            parallel: argv.parallel,
            cache: argv.cache,
            clearCache: argv['clear-cache'],
            showCacheStats: argv['show-cache-stats'],
            // v0.9.0 Implementation Truth オプション
            implementationTruth: argv.implementationTruth,
            testPath: argv.testPath,
            productionCode: argv.productionCode,
            aiOutput: argv.aiOutput
          });
        }
      )
      .command(
        'ai-output [path]',
        'AI向け出力形式で分析結果を生成',
        (yargs) => {
          return yargs
            .positional('path', {
              describe: '分析対象のディレクトリパス（デフォルト: カレントディレクトリ）',
              type: 'string',
              default: '.'
            })
            .option('format', {
              alias: 'f',
              describe: '出力形式',
              type: 'string',
              choices: ['json', 'markdown'],
              default: 'json'
            })
            .option('output', {
              alias: 'o',
              describe: '出力ファイルパス',
              type: 'string'
            })
            .option('include-context', {
              describe: 'プロジェクトコンテキスト情報を含める',
              type: 'boolean',
              default: false
            })
            .option('include-source-code', {
              describe: 'ソースコードを含める',
              type: 'boolean',
              default: false
            })
            .option('optimize-for-ai', {
              describe: 'AI向けに最適化',
              type: 'boolean',
              default: false
            })
            .option('max-tokens', {
              describe: '最大トークン数',
              type: 'number'
            })
            .option('max-file-size', {
              describe: '最大ファイルサイズ（バイト）',
              type: 'number'
            })
            .option('verbose', {
              alias: 'v',
              describe: '詳細な出力を表示',
              type: 'boolean',
              default: false
            })
            .option('parallel', {
              describe: '並列処理を有効化',
              type: 'boolean',
              default: false
            })
            .option('cache', {
              describe: 'キャッシュ機能を有効化',
              type: 'boolean',
              default: true
            });
        },
        async (argv) => {
          const aiOutputCommand = new AIOutputCommand();
          await aiOutputCommand.execute({
            path: argv.path || '.',
            format: argv.format as 'json' | 'markdown',
            output: argv.output,
            includeContext: argv['include-context'],
            includeSourceCode: argv['include-source-code'],
            optimizeForAI: argv['optimize-for-ai'],
            maxTokens: argv['max-tokens'],
            maxFileSize: argv['max-file-size'],
            verbose: argv.verbose,
            parallel: argv.parallel,
            cache: argv.cache
          });
        }
      )
      .command(createTaintAnalysisCommand())
      .command(
        'intent-analyze [path]',
        'テスト意図実現度を監査します（v0.9.0新機能）',
        (yargs) => {
          return yargs
            .positional('path', {
              describe: '分析対象のディレクトリまたはファイルパス',
              type: 'string',
              default: '.'
            })
            .option('format', {
              alias: 'f',
              describe: '出力フォーマット',
              type: 'string',
              choices: ['text', 'json', 'html'],
              default: 'text'
            })
            .option('output', {
              alias: 'o',
              describe: '出力ファイルパス（HTML形式の場合）',
              type: 'string'
            })
            .option('verbose', {
              alias: 'v',
              describe: '詳細な出力を表示',
              type: 'boolean',
              default: false
            })
            .option('parallel', {
              alias: 'p',
              describe: '並列処理を有効化',
              type: 'boolean',
              default: false
            })
            .option('max-workers', {
              describe: '最大ワーカー数（デフォルト: CPUコア数）',
              type: 'number'
            })
            // Phase 2 高度な分析オプション
            .option('with-types', {
              describe: '型情報を使用した高度な分析を実行',
              type: 'boolean',
              default: false
            })
            .option('with-domain', {
              describe: 'ドメイン推論を含む分析を実行',
              type: 'boolean',
              default: false
            })
            .option('with-business', {
              describe: 'ビジネスロジックマッピングを含む分析を実行',
              type: 'boolean',
              default: false
            });
        },
        async (argv) => {
          const intentAnalyzeCommand = new IntentAnalyzeCommand();
          await intentAnalyzeCommand.execute({
            path: argv.path || '.',
            format: argv.format as 'text' | 'json' | 'html',
            output: argv.output,
            verbose: argv.verbose,
            parallel: argv.parallel,
            maxWorkers: argv['max-workers'],
            // Phase 2オプション
            withTypes: argv['with-types'],
            withDomain: argv['with-domain'],
            withBusiness: argv['with-business']
          });
        }
      )
      .command(
        'domain-analyze [path]',
        '統計的ドメイン解析を実行（v0.9.0新機能）',
        (yargs) => {
          return yargs
            .positional('path', {
              describe: '分析対象のディレクトリパス',
              type: 'string',
              default: '.'
            })
            .option('format', {
              alias: 'f',
              describe: '出力フォーマット',
              type: 'string',
              choices: ['text', 'json'],
              default: 'text'
            })
            .option('verbose', {
              alias: 'v',
              describe: '詳細ログを表示',
              type: 'boolean',
              default: false
            })
            .option('interactive', {
              alias: 'i',
              describe: '対話型モード',
              type: 'boolean',
              default: true
            })
            .option('verify', {
              describe: '既存のドメイン定義を検証',
              type: 'boolean',
              default: false
            })
            .option('output', {
              alias: 'o',
              describe: '出力先ディレクトリ',
              type: 'string'
            })
            .option('max-clusters', {
              describe: '最大クラスタ数',
              type: 'number',
              default: 5
            })
            .option('min-keyword-frequency', {
              describe: '最小キーワード頻度',
              type: 'number',
              default: 3
            })
            .option('exclude', {
              describe: '除外パターン（カンマ区切り）',
              type: 'string'
            });
        },
        async (argv) => {
          const domainAnalyzeCommand = new DomainAnalyzeCommand();
          await domainAnalyzeCommand.execute({
            path: argv.path || '.',
            format: argv.format as 'text' | 'json',
            verbose: argv.verbose,
            interactive: argv.interactive,
            verify: argv.verify,
            output: argv.output,
            maxClusters: argv['max-clusters'],
            minKeywordFrequency: argv['min-keyword-frequency'],
            excludePatterns: argv.exclude?.split(',')
          });
        }
      )
      .command(
        ['analyze [path]', '$0 [path]'],
        '統合セキュリティ分析（v0.9.0 unified-analyze統合版・デフォルト）',
        (yargs) => this.createUnifiedAnalyzeOptions(yargs),
        (argv) => this.handleUnifiedAnalyze(argv)
      )
      .command(
        'unified-analyze [path]',
        '統合セキュリティ分析（TaintTyper + Intent + Gap + NIST評価・後方互換性）',
        (yargs) => this.createUnifiedAnalyzeOptions(yargs),
        (argv) => this.handleUnifiedAnalyze(argv)
      )
      .command(
        'bootstrap [subcommand]',
        'プロジェクトのセットアップとブートストラップ',
        (yargs) => {
          return yargs
            .command(
              ['init', '$0'],
              'プロジェクトの初期化ウィザード',
              (yargs) => {
                return yargs
                  .option('force', {
                    describe: '既存設定を上書きする',
                    type: 'boolean',
                    default: false
                  })
                  .option('auto', {
                    describe: '自動モードで実行',
                    type: 'boolean',
                    default: false
                  })
                  .option('template', {
                    describe: 'テンプレートを指定',
                    type: 'string',
                    choices: ['basic', 'ecommerce', 'financial', 'web-api'],
                    default: 'basic'
                  })
                  .option('domain', {
                    describe: 'ドメイン名を指定',
                    type: 'string'
                  });
              },
              async (argv) => {
                const { BootstrapCommand } = await import('./commands/bootstrap');
                await BootstrapCommand.executeInit({
                  force: argv.force,
                  auto: argv.auto,
                  template: argv.template,
                  domain: argv.domain
                });
              }
            )
            .command(
              'status',
              'セットアップ状況の確認',
              (yargs) => yargs,
              async () => {
                const { BootstrapCommand } = await import('./commands/bootstrap');
                await BootstrapCommand.executeStatus();
              }
            )
            .command(
              'validate',
              'セットアップの検証',
              (yargs) => yargs,
              async () => {
                const { BootstrapCommand } = await import('./commands/bootstrap');
                await BootstrapCommand.executeValidate();
              }
            )
            .command(
              'clean',
              'セットアップのクリーンアップ',
              (yargs) => {
                return yargs
                  .option('confirm', {
                    describe: '削除を確認する',
                    type: 'boolean',
                    default: false
                  });
              },
              async (argv) => {
                const { BootstrapCommand } = await import('./commands/bootstrap');
                await BootstrapCommand.executeClean({
                  confirm: argv.confirm
                });
              }
            )
            .demandCommand(1, 'サブコマンドを指定してください: init, status, validate, clean');
        }
      )
      .command(
        'benchmark [subcommand]',
        '型ベースセキュリティ解析の性能ベンチマーク（TaintTyper目標検証）',
        (yargs) => {
          return yargs
            .command(
              ['run', '$0'],
              '完全ベンチマークスイートの実行',
              (yargs) => {
                return yargs
                  .option('sizes', {
                    alias: 's',
                    describe: 'テストサイズ (small,medium,large)',
                    type: 'string',
                    default: 'small,medium,large'
                  })
                  .option('iterations', {
                    alias: 'i',
                    describe: '実行回数',
                    type: 'number',
                    default: 3
                  })
                  .option('output', {
                    alias: 'o',
                    describe: '出力ディレクトリ',
                    type: 'string',
                    default: './benchmark-results'
                  })
                  .option('verbose', {
                    alias: 'v',
                    describe: '詳細ログの出力',
                    type: 'boolean',
                    default: false
                  });
              },
              async (argv) => {
                const { BenchmarkRunner } = await import('../security/benchmarks');
                console.log('🚀 型ベースセキュリティ解析 ベンチマーク実行');
                console.log('目標: 5ms/file, 3-20x速度向上の検証\n');

                try {
                  const runner = new BenchmarkRunner({
                    testSizes: argv.sizes.split(',').map((s: string) => s.trim()) as any,
                    iterations: argv.iterations,
                    outputDir: argv.output,
                    verbose: argv.verbose,
                    isCiEnvironment: false
                  });

                  const result = await runner.runFullBenchmarkSuite();
                  
                  console.log('\n📊 ベンチマーク完了:');
                  console.log(`   総合評価: ${getAssessmentEmoji(result.overallAssessment)} ${result.overallAssessment}`);
                  console.log(`   回帰検出: ${result.hasRegression ? '⚠️  あり' : '✅ なし'}`);
                  console.log(`   改善項目: ${result.improvements.length}件`);
                  console.log(`   劣化項目: ${result.regressions.length}件`);

                  if (result.recommendedActions.length > 0) {
                    console.log('\n💡 推奨アクション:');
                    result.recommendedActions.forEach(action => console.log(`   • ${action}`));
                  }

                  process.exit(result.overallAssessment === 'critical' ? 1 : 0);
                } catch (error) {
                  console.error('❌ ベンチマーク実行エラー:', error);
                  process.exit(1);
                }
              }
            )
            .command(
              'quick',
              '高速ベンチマーク（CI最適化）',
              (yargs) => {
                return yargs
                  .option('output', {
                    alias: 'o',
                    describe: '出力ディレクトリ',
                    type: 'string',
                    default: './ci-benchmark-results'
                  });
              },
              async (argv) => {
                const { BenchmarkRunner } = await import('../security/benchmarks');
                console.log('⚡ 高速ベンチマーク実行（CI最適化）');

                try {
                  const runner = new BenchmarkRunner({
                    testSizes: ['small'],
                    iterations: 1,
                    outputDir: argv.output,
                    isCiEnvironment: true,
                    verbose: false
                  });

                  const result = await runner.runQuickBenchmark();
                  
                  console.log(`✅ 高速ベンチマーク完了: ${result.overallAssessment}`);
                  process.exit(result.overallAssessment === 'critical' ? 1 : 0);
                } catch (error) {
                  console.error('❌ 高速ベンチマーク実行エラー:', error);
                  process.exit(1);
                }
              }
            )
            .command(
              'verify',
              'TaintTyper論文の性能目標検証',
              (yargs) => yargs,
              async () => {
                const { BenchmarkRunner } = await import('../security/benchmarks');
                console.log('🎯 TaintTyper性能目標検証');
                console.log('検証項目: 5ms/file, 3-20x速度向上\n');

                try {
                  const runner = new BenchmarkRunner();
                  const result = await runner.verifyPerformanceTargets();
                  
                  console.log('\n🎯 性能目標検証結果:');
                  result.details.forEach(detail => console.log(`   ${detail}`));
                  
                  const allAchieved = result.target5ms && result.speedupTarget;
                  console.log(`\n${allAchieved ? '✅' : '❌'} 総合判定: ${allAchieved ? '目標達成' : '目標未達成'}`);
                  
                  if (!allAchieved) {
                    console.log('\n💡 改善提案:');
                    if (!result.target5ms) {
                      console.log('   • ファイル当たりの解析時間を最適化してください');
                      console.log('   • キャッシュ機能の活用を検討してください');
                    }
                    if (!result.speedupTarget) {
                      console.log('   • 並列処理の最適化を検討してください');
                      console.log('   • モジュラー解析の改善を検討してください');
                    }
                  }

                  process.exit(allAchieved ? 0 : 1);
                } catch (error) {
                  console.error('❌ 性能目標検証エラー:', error);
                  process.exit(1);
                }
              }
            )
            .command(
              'trend',
              '性能トレンドの分析',
              (yargs) => {
                return yargs
                  .option('days', {
                    alias: 'd',
                    describe: '分析期間（日数）',
                    type: 'number',
                    default: 30
                  });
              },
              async (argv) => {
                const { BenchmarkRunner } = await import('../security/benchmarks');
                console.log(`📈 過去${argv.days}日間の性能トレンド分析`);

                try {
                  const runner = new BenchmarkRunner();
                  const result = await runner.analyzePerformanceTrends(argv.days);
                  
                  console.log(`\n📈 トレンド分析結果:`);
                  console.log(`   トレンド: ${getTrendEmoji(result.trend)} ${result.trend}`);
                  console.log(`   平均スコア: ${result.averageScore.toFixed(1)}`);
                  console.log(`   スコア変動: ${result.scoreVariation.toFixed(1)}`);
                  
                  if (result.improvements.length > 0) {
                    console.log(`\n✅ 改善項目:`);
                    result.improvements.forEach(item => console.log(`   • ${item}`));
                  }
                  
                  if (result.degradations.length > 0) {
                    console.log(`\n⚠️  劣化項目:`);
                    result.degradations.forEach(item => console.log(`   • ${item}`));
                  }
                  
                  if (result.recommendations.length > 0) {
                    console.log(`\n💡 推奨事項:`);
                    result.recommendations.forEach(rec => console.log(`   • ${rec}`));
                  }

                } catch (error) {
                  console.error('❌ トレンド分析エラー:', error);
                  process.exit(1);
                }
              }
            )
            .command(
              'measure',
              '単体性能測定',
              (yargs) => {
                return yargs
                  .option('files', {
                    alias: 'f',
                    describe: 'テストファイル数',
                    type: 'number',
                    default: 100
                  })
                  .option('parallel', {
                    alias: 'p',
                    describe: '並列数',
                    type: 'number',
                    default: 0
                  })
                  .option('cache', {
                    alias: 'c',
                    describe: 'キャッシュ有効',
                    type: 'boolean',
                    default: false
                  });
              },
              async (argv) => {
                const { PerformanceBenchmark } = await import('../security/benchmarks');
                console.log('📊 単体性能測定実行');

                try {
                  const benchmark = new PerformanceBenchmark();
                  const fileCount = argv.files;
                  const parallelism = argv.parallel || os.cpus().length;
                  
                  console.log(`設定: ${fileCount}ファイル, 並列度${parallelism}, キャッシュ${argv.cache ? '有効' : '無効'}`);

                  // テストケース生成
                  const testCases = Array.from({ length: fileCount }, (_, i) => ({
                    name: `measure-test-${i}`,
                    file: `measure-test-${i}.test.ts`,
                    content: generateMeasureTestContent(),
                    metadata: {
                      framework: 'jest',
                      language: 'typescript',
                      lastModified: new Date()
                    }
                  }));

                  // 5ms/file目標検証
                  const target5msAchieved = await benchmark.verify5msPerFileTarget(testCases);
                  
                  // 速度向上検証
                  const speedupRatio = await benchmark.verifySpeedupTarget(testCases);
                  
                  console.log('\n📊 測定結果:');
                  console.log(`   5ms/file目標: ${target5msAchieved ? '✅ 達成' : '❌ 未達成'}`);
                  console.log(`   速度向上率: ${speedupRatio.toFixed(1)}x`);
                  console.log(`   3-20x目標: ${speedupRatio >= 3 && speedupRatio <= 20 ? '✅ 達成' : '❌ 未達成'}`);

                } catch (error) {
                  console.error('❌ 単体性能測定エラー:', error);
                  process.exit(1);
                }
              }
            )
            .command(createBenchmarkExternalCommand())
            .demandCommand(1, 'サブコマンドを指定してください: run, quick, verify, trend, measure, external');
        }
      )
      .command(
        'implementation-truth-analyze <production-path>',
        'プロダクションコードとテストの実装の真実分析（v0.9.0 AIコーディング時代対応）',
        (yargs) => {
          return yargs
            .positional('production-path', {
              describe: 'プロダクションコードのパス',
              type: 'string'
            })
            .option('test-path', {
              alias: 't',
              describe: 'テストコードのパス',
              type: 'string'
            })
            .option('output', {
              alias: 'o',
              describe: '出力ファイルパス',
              type: 'string'
            })
            .option('format', {
              alias: 'f',
              describe: '出力形式',
              type: 'string',
              choices: ['ai-json', 'markdown', 'html', 'summary'],
              default: 'ai-json'
            })
            .option('detail-level', {
              alias: 'd',
              describe: '詳細レベル',
              type: 'string',
              choices: ['summary', 'detailed', 'comprehensive'],
              default: 'detailed'
            })
            .option('min-severity', {
              alias: 's',
              describe: '最小重要度（これ以下は除外）',
              type: 'string',
              choices: ['low', 'medium', 'high', 'critical'],
              default: 'low'
            })
            .option('optimize-for-ai', {
              describe: 'AI向け最適化を有効化',
              type: 'boolean',
              default: false
            })
            .option('include-code-examples', {
              describe: 'コード例を含める',
              type: 'boolean',
              default: false
            })
            .option('include-technical-details', {
              describe: '技術的詳細を含める',
              type: 'boolean',
              default: false
            })
            .option('verbose', {
              alias: 'v',
              describe: '詳細な進捗表示',
              type: 'boolean',
              default: false
            })
            .option('no-rimor-save', {
              describe: '.rimorディレクトリに保存しない',
              type: 'boolean',
              default: false
            });
        },
        async (argv) => {
          console.log('🔍 Implementation Truth分析を開始します...');

          try {
            const command = new ImplementationTruthAnalyzeCommand();
            const options = {
              productionPath: argv.productionPath as string,
              testPath: argv.testPath as string | undefined,
              output: argv.output as string | undefined,
              format: argv.format as any,
              detailLevel: argv.detailLevel as any,
              minSeverity: argv.minSeverity as any,
              optimizeForAI: argv.optimizeForAi,
              includeCodeExamples: argv.includeCodeExamples,
              includeTechnicalDetails: argv.includeTechnicalDetails,
              verbose: argv.verbose,
              saveToRimor: !argv.noRimorSave,
              includeMetadata: true
            };

            const result = await command.execute(options);

            // コンソール出力（詳細モードでない場合）
            if (!argv.verbose) {
              console.log('\n🎯 分析結果サマリー:');
              console.log(`   総合スコア: ${result.analysisResult.overallScore.toFixed(1)}/100`);
              console.log(`   脆弱性: ${result.analysisResult.summary.vulnerabilitiesDetected}個`);
              console.log(`   ギャップ: ${result.analysisResult.totalGapsDetected}個`);
              console.log(`   高重要度問題: ${result.analysisResult.highSeverityGaps}個`);
              console.log(`   実行時間: ${result.metadata.executionTime}ms`);
              
              if (result.metadata.outputPath) {
                console.log(`   📄 レポート: ${result.metadata.outputPath}`);
              }
            }

            // AI-JSON形式の場合はサンプル出力を表示
            if (argv.format === 'ai-json' && !argv.output) {
              console.log('\n📋 AI向け出力例（最初の5行）:');
              const content = typeof result.formattedReport.content === 'string' 
                ? result.formattedReport.content 
                : JSON.stringify(result.formattedReport.content, null, 2);
              
              const lines = content.split('\n').slice(0, 5);
              lines.forEach(line => console.log(`   ${line}`));
              if (content.split('\n').length > 5) {
                console.log('   ... （続きはファイル出力で確認できます）');
              }
            }

            console.log('\n✅ Implementation Truth分析が完了しました！');

          } catch (error) {
            console.error(`❌ 分析エラー: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
          }
        }
      )
      .help('h')
      .alias('h', 'help')
      .version('0.9.0')
      .example('$0', 'カレントディレクトリを統合分析（デフォルト）')
      .example('$0 ./src', 'srcディレクトリを統合分析')
      .example('$0 --verbose', '詳細モードで統合分析')
      .example('$0 --json', 'JSON形式で統合分析結果を出力')
      .example('$0 ./src --format=json', 'JSON形式で統合分析結果を出力')
      // v0.9.0 統合分析の例
      .example('$0 analyze ./src --format=markdown --output=report.md', 'Markdown形式で統合分析レポートを保存')
      .example('$0 analyze ./src --verbose --enable-taint-analysis --enable-nist-evaluation', '詳細モードでTaint分析とNIST評価を実行')
      .example('$0 analyze ./src --parallel --timeout=60000', '並列処理で高速統合分析（60秒タイムアウト）')
      .example('$0 analyze ./src --format=ai-json --output=ai-report.json', 'AI向けJSON形式で統合分析結果を出力')
      .example('$0 analyze ./src --include-details --include-recommendations', '詳細情報と改善提案を含む統合分析')
      // v0.8.0 従来版（analyze-legacy）の例
      .example('$0 analyze-legacy . --output-json report.json', '従来版で分析結果をJSON形式でファイルに保存')
      .example('$0 analyze-legacy . --annotate --preview', '従来版でアノテーションをプレビュー')
      .example('$0 analyze-legacy . --include-details --severity=critical,high', '従来版で重要度フィルタ付き詳細分析')
      // 既存の例
      .example('$0 ai-output', 'AI向けJSON形式で出力')
      .example('$0 ai-output --format=markdown -o ai-report.md', 'AI向けMarkdown形式でファイル出力')
      .example('$0 ai-output --include-context --optimize-for-ai', 'コンテキスト情報付きでAI最適化出力')
      .example('$0 bootstrap init', 'プロジェクト初期化ウィザード')
      .example('$0 bootstrap init --auto --domain=ecommerce', '自動モードでecommerceドメインを設定')
      .example('$0 bootstrap status', 'セットアップ状況の確認')
      .example('$0 bootstrap validate', 'セットアップの検証')
      .example('$0 bootstrap clean --confirm', 'セットアップの完全削除')
      .example('$0 benchmark run', '完全ベンチマークスイートの実行')
      .example('$0 benchmark quick', 'CI向け高速ベンチマーク')
      .example('$0 benchmark verify', 'TaintTyper性能目標の検証')
      .example('$0 benchmark trend -d 7', '過去7日間の性能トレンド分析')
      .example('$0 benchmark measure -f 50 --cache', '50ファイルでキャッシュ有効測定')
      // 統合分析の例
      .example('$0 unified-analyze', '統合セキュリティ分析（全機能実行）')
      .example('$0 unified-analyze --format=json --output=report.json', 'JSON形式で統合レポート出力')
      .example('$0 unified-analyze --verbose --format=markdown', 'Markdown形式で詳細レポート生成')
      .example('$0 unified-analyze ./src --parallel', '並列実行で高速統合分析')
      // Implementation Truth分析の例
      .example('$0 implementation-truth-analyze ./src/main.ts', 'プロダクションコードの実装の真実分析')
      .example('$0 implementation-truth-analyze ./src --test-path ./test', 'プロダクションコードとテストコードの統合分析')
      .example('$0 implementation-truth-analyze ./src --format markdown --output report.md', 'Markdown形式でレポート出力')
      .example('$0 implementation-truth-analyze ./src --optimize-for-ai --include-code-examples', 'AI向け最適化でコード例付き分析')
      .example('$0 implementation-truth-analyze ./src --min-severity high --verbose', '高重要度以上の問題を詳細表示')
      .example('$0 implementation-truth-analyze ./src --detail-level comprehensive --include-technical-details', '包括的で技術的詳細を含む分析')
      .demandCommand(0, 'オプション: コマンドなしでもカレントディレクトリを分析します')
      .strict()
      .parse();
  }
}

/**
 * 評価レベルの絵文字取得
 */
function getAssessmentEmoji(assessment: string): string {
  switch (assessment) {
    case 'excellent': return '🌟';
    case 'good': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '❌';
    default: return '❓';
  }
}

/**
 * トレンドの絵文字取得
 */
function getTrendEmoji(trend: string): string {
  switch (trend) {
    case 'improving': return '📈';
    case 'stable': return '➖';
    case 'degrading': return '📉';
    case 'insufficient-data': return '❓';
    default: return '❓';
  }
}

/**
 * 測定用テスト内容生成
 */
function generateMeasureTestContent(): string {
  return `
describe('Performance Measurement Test', () => {
  it('should authenticate user with token validation', async () => {
    const user = { username: 'testuser', password: 'password123' };
    const token = await authService.login(user);
    expect(token).toBeDefined();
    expect(jwt.verify(token, secret)).toBeTruthy();
  });

  it('should validate and sanitize user input', async () => {
    const rawInput = req.body.data;
    const sanitized = sanitize(rawInput);
    const validated = validate(sanitized);
    expect(validated).toBeValid();
    expect(sanitized).not.toContain('<script>');
  });

  it('should handle boundary conditions properly', async () => {
    expect(() => processData(null)).toThrow();
    expect(() => processData(undefined)).toThrow();
    expect(() => processData('')).toThrow();
    expect(processData('valid-data')).toBeDefined();
  });
});
`;
}