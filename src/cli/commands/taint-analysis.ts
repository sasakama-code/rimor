/**
 * 汚染解析コマンド
 * arXiv:2504.18529v2の技術をCLIから利用可能にする
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { TaintAnalysisSystem } from '../../security/taint-analysis-system';
import { Argv } from 'yargs';
import { TaintAnalysisOptions, TaintIssue } from './taint-analysis-types';

/**
 * 汚染解析コマンドの作成
 */
export function createTaintAnalysisCommand() {
  return {
    command: 'taint-analysis <path>',
    aliases: ['taint'],
    describe: '型ベース汚染解析を実行（arXiv:2504.18529v2）',
    builder: (yargs: Argv) => {
      return yargs
        .positional('path', {
          describe: '解析対象のファイルまたはディレクトリ',
          type: 'string',
        })
        .option('output', {
          alias: 'o',
          describe: '出力形式',
          type: 'string',
          choices: ['text', 'json', 'jaif'],
          default: 'text',
        })
        .option('export-jaif', {
          describe: 'JAIF形式でアノテーションをエクスポート',
          type: 'string',
        })
        .option('generate-stubs', {
          describe: 'スタブファイルを生成',
          type: 'string',
        })
        .option('incremental', {
          describe: 'インクリメンタル解析を有効化',
          type: 'boolean',
          default: false,
        })
        .option('max-depth', {
          describe: '最大探索深度',
          type: 'number',
          default: 100,
        })
        .option('confidence', {
          describe: '信頼度閾値 (0-1)',
          type: 'number',
          default: 0.8,
        })
        .option('library-behavior', {
          describe: '未知のライブラリメソッドの扱い',
          type: 'string',
          choices: ['conservative', 'optimistic'],
          default: 'conservative',
        });
    },
    handler: async (argv: unknown) => {
      const options = argv as TaintAnalysisOptions;
      try {
        await runTaintAnalysis(options.path, options);
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    },
  };
}

/**
 * 汚染解析の実行
 */
async function runTaintAnalysis(targetPath: string, options: TaintAnalysisOptions): Promise<void> {
  const startTime = Date.now();

  // 解析システムの初期化
  const taintSystem = new TaintAnalysisSystem({
    inference: {
      enableSearchBased: true,
      enableLocalOptimization: true,
      enableIncremental: options.incremental || false,
      maxSearchDepth: options.maxDepth,
      confidenceThreshold: options.confidence,
    },
    library: {
      loadBuiltins: true,
      customLibraryPaths: [],
      unknownMethodBehavior: options.libraryBehavior,
    },
    compatibility: {
      exportJAIF: !!options.exportJaif,
      generateStubs: !!options.generateStubs,
      gradualMigration: false,
    },
  });

  console.log(chalk.blue('🔍 汚染解析を開始します...'));
  console.log(chalk.gray(`対象: ${targetPath}`));
  console.log();

  // ファイルまたはディレクトリの判定
  const stats = fs.statSync(targetPath);
  const files: string[] = [];

  if (stats.isDirectory()) {
    // ディレクトリの場合は再帰的にファイルを収集
    files.push(...collectFiles(targetPath, ['.ts', '.js', '.tsx', '.jsx']));
  } else {
    files.push(targetPath);
  }

  console.log(chalk.gray(`${files.length} ファイルを解析します`));

  // 解析結果の集約
  let totalIssues = 0;
  let totalAnnotations = 0;
  const allIssues: TaintIssue[] = [];
  const allAnnotations = new Map<string, string>();

  // 各ファイルを解析
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    process.stdout.write(chalk.gray(`解析中: ${relativePath}...`));

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const result = await taintSystem.analyzeCode(content, { fileName: file });

      totalIssues += result.issues.length;
      totalAnnotations += result.annotations.size;

      // 結果を集約
      allIssues.push(...result.issues.map(issue => ({ ...issue, file: relativePath })));
      for (const [location, qualifier] of result.annotations) {
        allAnnotations.set(`${relativePath}:${location}`, qualifier);
      }

      if (result.issues.length > 0) {
        process.stdout.write(chalk.red(` ✗ (${result.issues.length} issues)\n`));
      } else {
        process.stdout.write(chalk.green(' ✓\n'));
      }
    } catch (error) {
      process.stdout.write(chalk.red(` ✗ (error)\n`));
      console.error(chalk.red(`  エラー: ${error}`));
    }
  }

  const analysisTime = Date.now() - startTime;

  // 結果の表示
  console.log();
  console.log(chalk.bold('📊 解析結果サマリー'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`解析ファイル数: ${chalk.cyan(files.length)}`);
  console.log(
    `検出された問題: ${totalIssues > 0 ? chalk.red(totalIssues) : chalk.green(totalIssues)}`
  );
  console.log(`推論されたアノテーション: ${chalk.blue(totalAnnotations)}`);
  console.log(`解析時間: ${chalk.gray(analysisTime + 'ms')}`);
  console.log();

  // 問題の詳細表示
  if (allIssues.length > 0 && options.output === 'text') {
    console.log(chalk.bold('🚨 検出された問題'));
    console.log(chalk.gray('─'.repeat(50)));

    for (const issue of allIssues) {
      const severityColor =
        issue.severity === 'error'
          ? chalk.red
          : issue.severity === 'warning'
            ? chalk.yellow
            : chalk.blue;

      console.log(
        `${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.file}:${issue.location.line}:${issue.location.column}`
      );
      console.log(`  ${issue.message}`);
      if (issue.suggestion) {
        console.log(chalk.gray(`  💡 ${issue.suggestion}`));
      }
      console.log();
    }
  }

  // 出力形式に応じた処理
  if (options.output === 'json') {
    const jsonOutput = {
      summary: {
        filesAnalyzed: files.length,
        issuesFound: totalIssues,
        annotationsInferred: totalAnnotations,
        analysisTime,
      },
      issues: allIssues,
      annotations: Object.fromEntries(allAnnotations),
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
  }

  // JAIFエクスポート
  if (options.exportJaif) {
    const writer =
      new (require('../../security/compatibility/checker-framework-compatibility').AnnotationWriter)();
    const jaifContent = writer.toJAIF(allAnnotations);
    fs.writeFileSync(options.exportJaif, jaifContent);
    console.log(chalk.green(`✓ JAIFファイルをエクスポートしました: ${options.exportJaif}`));
  }

  // スタブファイル生成
  if (options.generateStubs) {
    // 実装は省略
    console.log(chalk.yellow('⚠ スタブファイル生成は未実装です'));
  }

  // 終了コード
  process.exit(totalIssues > 0 ? 1 : 0);
}

/**
 * ファイル収集
 */
function collectFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // node_modules等は除外
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}
