import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AnalyzeCommand } from './commands/analyze';

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
              choices: ['text', 'json'],
              default: 'text'
            })
            .option('json', {
              describe: 'JSON形式で出力（--format=json の短縮形）',
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
            format: format as 'text' | 'json'
          });
        }
      )
      .help('h')
      .alias('h', 'help')
      .version('0.1.1')
      .example('$0', 'カレントディレクトリを分析')
      .example('$0 ./src', 'srcディレクトリを分析')
      .example('$0 --verbose', '詳細モードで分析')
      .example('$0 --json', 'JSON形式で出力')
      .example('$0 ./src --format=json', 'JSON形式で出力')
      .demandCommand(0, 'オプション: コマンドなしでもカレントディレクトリを分析します')
      .strict()
      .parse();
  }
}