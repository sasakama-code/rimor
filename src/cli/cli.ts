import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AnalyzeCommand } from './commands/analyze';
import { AIOutputCommand } from './commands/ai-output';

export class CLI {
  async run(): Promise<void> {
    await yargs(hideBin(process.argv))
      .scriptName('rimor')
      .usage('$0 <command> [options]')
      .command(
        ['analyze [path]', '$0 [path]'],
        'テスト品質を分析します',
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
              choices: ['text', 'json', 'csv', 'html'],
              default: 'text'
            })
            .option('json', {
              describe: 'JSON形式で出力（--format=json の短縮形）',
              type: 'boolean',
              default: false
            })
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
            .option('scoring', {
              describe: '品質スコア計算を有効化',
              type: 'boolean',
              default: false
            })
            .option('report-type', {
              describe: 'レポートタイプ',
              type: 'string',
              choices: ['summary', 'detailed', 'trend'],
              default: 'summary'
            })
            .option('no-color', {
              describe: 'カラー出力を無効化',
              type: 'boolean',
              default: false
            })
            .option('output', {
              alias: 'o',
              describe: '出力ファイルパス',
              type: 'string'
            });
        },
        async (argv) => {
          const analyzeCommand = new AnalyzeCommand();
          // --json フラグが指定された場合は format を json に上書き
          const format = argv.json ? 'json' : argv.format;
          await analyzeCommand.execute({
            path: argv.path || '.',
            verbose: argv.verbose,
            format: format as 'text' | 'json' | 'csv' | 'html',
            performance: argv.performance,
            showPerformanceReport: argv['show-performance-report'],
            scoring: argv.scoring,
            reportType: argv['report-type'] as 'summary' | 'detailed' | 'trend',
            noColor: argv['no-color'],
            outputFile: argv.output
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
      .command(
        'plugin create',
        'プラグインを作成します',
        (yargs) => {
          return yargs
            .option('interactive', {
              alias: 'i',
              describe: '対話モードでプラグイン作成',
              type: 'boolean',
              default: false
            })
            .option('template', {
              alias: 't',
              describe: 'テンプレートからプラグイン作成',
              type: 'string',
              choices: ['basic', 'pattern-match', 'async-await', 'api-test', 'validation']
            })
            .option('from', {
              describe: '既存プラグインから派生作成',
              type: 'string'
            });
        },
        async (argv) => {
          const { PluginCreateCommand } = await import('./commands/plugin-create');
          const command = new PluginCreateCommand();
          await command.execute({
            interactive: argv.interactive,
            template: argv.template,
            from: argv.from
          });
        }
      )
      .command(
        'history [subcommand]',
        'プロジェクトのスコア履歴を表示・管理',
        (yargs) => {
          return yargs
            .command(
              'show',
              'スコア履歴を表示',
              (yargs) => {
                return yargs
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  })
                  .option('limit', {
                    alias: 'l',
                    describe: '表示する履歴の件数',
                    type: 'number',
                    default: 10
                  })
                  .option('format', {
                    alias: 'f',
                    describe: '出力フォーマット',
                    type: 'string',
                    choices: ['table', 'json', 'csv'],
                    default: 'table'
                  })
                  .option('trend', {
                    alias: 't',
                    describe: 'トレンド分析を表示',
                    type: 'boolean',
                    default: false
                  })
                  .option('prediction', {
                    alias: 'P',
                    describe: '予測分析を表示',
                    type: 'boolean',
                    default: false
                  })
                  .option('stats', {
                    alias: 's',
                    describe: '統計情報を表示',
                    type: 'boolean',
                    default: false
                  })
                  .option('file', {
                    describe: '特定ファイルの履歴を表示',
                    type: 'string'
                  });
              },
              async (argv) => {
                const { HistoryCommand } = await import('./commands/history');
                const command = new HistoryCommand();
                const options = {
                  projectPath: argv['project-path'],
                  limit: argv.limit?.toString(),
                  format: argv.format as 'table' | 'json' | 'csv',
                  trend: argv.trend,
                  prediction: argv.prediction,
                  stats: argv.stats,
                  file: argv.file
                };
                
                if (argv.stats) {
                  await command['displayHistoryStats'](argv['project-path']);
                } else if (argv.file) {
                  await command['displayFileHistory'](argv['project-path'], argv.file, options);
                } else {
                  await command['displayProjectHistory'](argv['project-path'], argv.limit || 10, options);
                }
              }
            )
            .command(
              'clean',
              '古い履歴ファイルを削除',
              (yargs) => {
                return yargs
                  .option('days', {
                    alias: 'd',
                    describe: '保持日数',
                    type: 'number',
                    default: 90
                  })
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  });
              },
              async (argv) => {
                const { HistoryCommand } = await import('./commands/history');
                const command = new HistoryCommand();
                await command['cleanHistory'](argv['project-path'], argv.days);
              }
            )
            .command(
              'export',
              '履歴データをエクスポート',
              (yargs) => {
                return yargs
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  })
                  .option('output', {
                    alias: 'o',
                    describe: '出力ファイル名',
                    type: 'string',
                    default: 'rimor-history-export.json'
                  })
                  .option('format', {
                    alias: 'f',
                    describe: 'エクスポート形式',
                    type: 'string',
                    choices: ['json', 'csv'],
                    default: 'json'
                  });
              },
              async (argv) => {
                const { HistoryCommand } = await import('./commands/history');
                const command = new HistoryCommand();
                await command['exportHistory']({
                  projectPath: argv['project-path'],
                  output: argv.output,
                  format: argv.format
                });
              }
            )
            .demandCommand(1, 'サブコマンドを指定してください: show, clean, export');
        }
      )
      .command(
        'trend [subcommand]',
        '高度なトレンド分析と予測を実行',
        (yargs) => {
          return yargs
            .command(
              'analyze',
              'トレンド分析を実行',
              (yargs) => {
                return yargs
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  })
                  .option('days', {
                    alias: 'd',
                    describe: '分析対象日数',
                    type: 'number',
                    default: 30
                  })
                  .option('method', {
                    alias: 'm',
                    describe: '分析手法',
                    type: 'string',
                    choices: ['linear', 'exponential', 'arima', 'polynomial', 'ensemble'],
                    default: 'ensemble'
                  })
                  .option('format', {
                    alias: 'f',
                    describe: '出力フォーマット',
                    type: 'string',
                    choices: ['table', 'json', 'chart'],
                    default: 'table'
                  })
                  .option('prediction', {
                    alias: 'P',
                    describe: '予測分析を実行',
                    type: 'boolean',
                    default: false
                  })
                  .option('anomalies', {
                    alias: 'a',
                    describe: '異常値検知を実行',
                    type: 'boolean',
                    default: false
                  })
                  .option('seasonal', {
                    alias: 's',
                    describe: '季節性分析を実行',
                    type: 'boolean',
                    default: false
                  })
                  .option('file', {
                    describe: '特定ファイルのトレンド分析',
                    type: 'string'
                  });
              },
              async (argv) => {
                const { TrendCommand } = await import('./commands/trend');
                const command = new TrendCommand();
                await command['executeCommand']({
                  projectPath: argv['project-path'],
                  days: argv.days?.toString(),
                  method: argv.method as any,
                  format: argv.format as any,
                  prediction: argv.prediction,
                  anomalies: argv.anomalies,
                  seasonal: argv.seasonal,
                  file: argv.file
                });
              }
            )
            .command(
              'predict',
              '将来のスコアを予測',
              (yargs) => {
                return yargs
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  })
                  .option('horizon', {
                    alias: 'h',
                    describe: '予測期間（日数）',
                    type: 'number',
                    default: 7
                  })
                  .option('method', {
                    alias: 'm',
                    describe: '予測手法',
                    type: 'string',
                    choices: ['ensemble', 'arima', 'polynomial'],
                    default: 'ensemble'
                  })
                  .option('format', {
                    alias: 'f',
                    describe: '出力形式',
                    type: 'string',
                    choices: ['table', 'json'],
                    default: 'table'
                  });
              },
              async (argv) => {
                const { TrendCommand } = await import('./commands/trend');
                const command = new TrendCommand();
                await command['executePredictionCommand']({
                  projectPath: argv['project-path'],
                  horizon: argv.horizon?.toString(),
                  method: argv.method,
                  format: argv.format
                });
              }
            )
            .command(
              'anomalies',
              '異常値検知を実行',
              (yargs) => {
                return yargs
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  })
                  .option('threshold', {
                    alias: 't',
                    describe: '異常値判定閾値（標準偏差倍数）',
                    type: 'number',
                    default: 2.0
                  })
                  .option('drift', {
                    describe: 'ドリフト検知を有効化',
                    type: 'boolean',
                    default: false
                  })
                  .option('format', {
                    alias: 'f',
                    describe: '出力形式',
                    type: 'string',
                    choices: ['table', 'json'],
                    default: 'table'
                  });
              },
              async (argv) => {
                const { TrendCommand } = await import('./commands/trend');
                const command = new TrendCommand();
                await command['executeAnomalyCommand']({
                  projectPath: argv['project-path'],
                  threshold: argv.threshold?.toString(),
                  drift: argv.drift,
                  format: argv.format
                });
              }
            )
            .command(
              'compare',
              '期間比較分析',
              (yargs) => {
                return yargs
                  .option('project-path', {
                    alias: 'p',
                    describe: 'プロジェクトパス',
                    type: 'string',
                    default: process.cwd()
                  })
                  .option('baseline', {
                    describe: 'ベースライン期間（日数）',
                    type: 'number',
                    default: 30
                  })
                  .option('current', {
                    describe: '比較対象期間（日数）',
                    type: 'number',
                    default: 7
                  })
                  .option('format', {
                    alias: 'f',
                    describe: '出力形式',
                    type: 'string',
                    choices: ['table', 'json'],
                    default: 'table'
                  });
              },
              async (argv) => {
                const { TrendCommand } = await import('./commands/trend');
                const command = new TrendCommand();
                await command['executeComparisonCommand']({
                  projectPath: argv['project-path'],
                  baseline: argv.baseline?.toString(),
                  current: argv.current?.toString(),
                  format: argv.format
                });
              }
            )
            .demandCommand(1, 'サブコマンドを指定してください: analyze, predict, anomalies, compare');
        }
      )
      .help('h')
      .alias('h', 'help')
      .version('0.4.0')
      .example('$0', 'カレントディレクトリを分析')
      .example('$0 ./src', 'srcディレクトリを分析')
      .example('$0 --verbose', '詳細モードで分析')
      .example('$0 --json', 'JSON形式で出力')
      .example('$0 ./src --format=json', 'JSON形式で出力')
      .example('$0 --scoring', '品質スコア計算を有効化')
      .example('$0 --scoring --report-type=detailed --format=html', '詳細スコアレポートをHTML形式で出力')
      .example('$0 --scoring --format=csv --output=report.csv', 'スコアレポートをCSVファイルに出力')
      .example('$0 ai-output', 'AI向けJSON形式で出力')
      .example('$0 ai-output --format=markdown -o ai-report.md', 'AI向けMarkdown形式でファイル出力')
      .example('$0 ai-output --include-context --optimize-for-ai', 'コンテキスト情報付きでAI最適化出力')
      .example('$0 plugin create -i', '対話モードでプラグイン作成')
      .example('$0 plugin create --template basic', 'テンプレートからプラグイン作成')
      .example('$0 history show -l 20 --trend', '20件の履歴をトレンド分析付きで表示')
      .example('$0 history export -f csv', '履歴データをCSV形式でエクスポート')
      .example('$0 trend analyze --prediction --anomalies', 'トレンド分析を予測・異常値検知付きで実行')
      .example('$0 trend predict -h 14', '14日後のスコアを予測')
      .example('$0 trend compare --baseline 60 --current 14', '過去60日と直近14日を比較')
      .demandCommand(0, 'オプション: コマンドなしでもカレントディレクトリを分析します')
      .strict()
      .parse();
  }
}