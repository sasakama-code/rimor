import { Analyzer } from '../../core/analyzer';
import { TestExistencePlugin } from '../../plugins/testExistence';
import { OutputFormatter } from '../output';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyzeOptions {
  verbose?: boolean;
  path: string;
}

export class AnalyzeCommand {
  private analyzer: Analyzer;
  
  constructor() {
    this.analyzer = new Analyzer();
    this.analyzer.registerPlugin(new TestExistencePlugin());
  }
  
  async execute(options: AnalyzeOptions): Promise<void> {
    try {
      const targetPath = path.resolve(options.path);
      
      // パスの存在確認
      if (!fs.existsSync(targetPath)) {
        console.error(OutputFormatter.error(`指定されたパスが存在しません: ${targetPath}`));
        process.exit(1);
      }
      
      console.log(OutputFormatter.header('Rimor テスト品質監査'));
      console.log(OutputFormatter.info(`分析対象: ${targetPath}`));
      
      if (options.verbose) {
        console.log(OutputFormatter.info('詳細モードで実行中...'));
      }
      
      const result = await this.analyzer.analyze(targetPath);
      
      // 結果の表示
      console.log(OutputFormatter.issueList(result.issues));
      console.log(OutputFormatter.summary(result.totalFiles, result.issues.length, result.executionTime));
      
      // 終了コード設定
      if (result.issues.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(OutputFormatter.error(`分析中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }
}