import { Analyzer } from '../../core/analyzer';
import { TestExistencePlugin } from '../../plugins/testExistence';
import { AssertionExistsPlugin } from '../../plugins/assertionExists';
import { OutputFormatter } from '../output';
import { ConfigLoader, RimorConfig } from '../../core/config';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
  format?: 'text' | 'json';
}

export class AnalyzeCommand {
  private analyzer!: Analyzer;
  private config: RimorConfig | null = null;
  
  private async initializeWithConfig(targetPath: string): Promise<void> {
    const configLoader = new ConfigLoader();
    this.config = await configLoader.loadConfig(targetPath);
    
    this.analyzer = new Analyzer();
    
    // 設定に基づいてプラグインを登録
    if (this.config.plugins['test-existence'].enabled) {
      this.analyzer.registerPlugin(new TestExistencePlugin(this.config.plugins['test-existence']));
    }
    
    if (this.config.plugins['assertion-exists'].enabled) {
      this.analyzer.registerPlugin(new AssertionExistsPlugin());
    }
  }
  
  async execute(options: AnalyzeOptions): Promise<void> {
    try {
      const targetPath = path.resolve(options.path);
      
      // パスの存在確認
      if (!fs.existsSync(targetPath)) {
        console.error(OutputFormatter.error(`指定されたパスが存在しません: ${targetPath}`));
        process.exit(1);
      }
      
      // 設定ファイル読み込みとプラグイン初期化
      await this.initializeWithConfig(targetPath);
      
      // 出力フォーマット決定（オプション > 設定ファイル > デフォルト）
      const format = options.format || this.config?.output.format || 'text';
      const verbose = options.verbose ?? this.config?.output.verbose ?? false;
      
      if (format === 'text') {
        // 単一ファイル対応の確認
        const stats = fs.statSync(targetPath);
        if (stats.isFile()) {
          console.log(OutputFormatter.info('単一ファイルモードで実行中...'));
        }
        
        console.log(OutputFormatter.header('Rimor テスト品質監査'));
        console.log(OutputFormatter.info(`分析対象: ${targetPath}`));
        
        if (verbose) {
          console.log(OutputFormatter.info('詳細モードで実行中...'));
          const enabledPlugins = this.getEnabledPluginNames();
          console.log(OutputFormatter.info(`利用プラグイン: ${enabledPlugins.join(', ')}`));
        }
      }
      
      const result = await this.analyzer.analyze(targetPath);
      
      // 結果の表示
      if (format === 'json') {
        const jsonOutput = this.formatAsJson(result, targetPath);
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        console.log(OutputFormatter.issueList(result.issues));
        console.log(OutputFormatter.summary(result.totalFiles, result.issues.length, result.executionTime));
      }
      
      // 終了コード設定
      if (result.issues.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(OutputFormatter.error(`分析中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }
  
  private getEnabledPluginNames(): string[] {
    const plugins = [];
    if (this.config?.plugins['test-existence'].enabled) {
      plugins.push('TestExistencePlugin');
    }
    if (this.config?.plugins['assertion-exists'].enabled) {
      plugins.push('AssertionExistsPlugin');
    }
    return plugins;
  }
  
  private formatAsJson(result: any, targetPath: string): object {
    return {
      summary: {
        totalFiles: result.totalFiles,
        issuesFound: result.issues.length,
        testCoverage: result.totalFiles > 0 ? Math.round(((result.totalFiles - result.issues.filter((i: any) => i.type === 'missing-test').length) / result.totalFiles) * 100) : 0,
        executionTime: result.executionTime
      },
      issues: result.issues.map((issue: any) => ({
        ...issue,
        plugin: this.getPluginNameFromIssueType(issue.type)
      })),
      config: {
        targetPath,
        enabledPlugins: this.getEnabledPluginNames(),
        format: 'json'
      }
    };
  }
  
  private getPluginNameFromIssueType(type: string): string {
    switch (type) {
      case 'missing-test':
        return 'test-existence';
      case 'missing-assertion':
        return 'assertion-exists';
      default:
        return 'unknown';
    }
  }
}