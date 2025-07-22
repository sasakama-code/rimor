import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AnalyzeCommand } from './commands/analyze';

export class CLI {
  async run(): Promise<void> {
    await yargs(hideBin(process.argv))
      .scriptName('rimor')
      .usage('$0 <command> [options]')
      .command(
        'analyze <path>',
        'テスト品質を分析します',
        (yargs) => {
          return yargs
            .positional('path', {
              describe: '分析対象のディレクトリパス',
              type: 'string',
              demandOption: true
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
            });
        },
        async (argv) => {
          const analyzeCommand = new AnalyzeCommand();
          await analyzeCommand.execute({
            path: argv.path,
            verbose: argv.verbose,
            format: argv.format as 'text' | 'json'
          });
        }
      )
      .command(
        '$0 <path>',
        'デフォルトコマンド（analyzeと同等）',
        (yargs) => {
          return yargs
            .positional('path', {
              describe: '分析対象のディレクトリパス',
              type: 'string',
              demandOption: true
            });
        },
        async (argv) => {
          const analyzeCommand = new AnalyzeCommand();
          await analyzeCommand.execute({
            path: argv.path,
            verbose: false
          });
        }
      )
      .help('h')
      .alias('h', 'help')
      .version('0.1.0')
      .example('$0 analyze ./src', 'srcディレクトリを分析')
      .example('$0 analyze ./src --verbose', '詳細モードで分析')
      .example('$0 analyze ./src --format=json', 'JSON形式で出力')
      .demandCommand(1, 'コマンドを指定してください')
      .strict()
      .parse();
  }
}