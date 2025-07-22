import chalk from 'chalk';

export class OutputFormatter {
  static header(title: string): string {
    return chalk.bold.blue(`🔍 ${title}\n`) + 
           chalk.gray('━'.repeat(title.length + 4));
  }
  
  static success(message: string): string {
    return chalk.green(`✅ ${message}`);
  }
  
  static error(message: string): string {
    return chalk.red(`❌ ${message}`);
  }
  
  static warning(message: string): string {
    return chalk.yellow(`⚠️  ${message}`);
  }
  
  static info(message: string): string {
    return chalk.blue(`ℹ️  ${message}`);
  }
  
  static summary(filesAnalyzed: number, issuesFound: number, executionTime: number): string {
    const testCoverage = filesAnalyzed > 0 ? Math.round(((filesAnalyzed - issuesFound) / filesAnalyzed) * 100) : 0;
    
    return [
      chalk.bold('\n📊 サマリー:'),
      `📁 分析対象: ${filesAnalyzed}ファイル`,
      `${issuesFound > 0 ? '❌' : '✅'} テスト不足: ${issuesFound}件`,
      `📈 テストカバレッジ: ${testCoverage}%`,
      `⏱️  実行時間: ${executionTime}ms`
    ].join('\n');
  }
  
  static issueList(issues: Array<{severity: string, message: string, line?: number, file?: string}>): string {
    if (issues.length === 0) {
      return chalk.green('\n🎉 問題は見つかりませんでした！');
    }
    
    const lines = [chalk.bold('\n🔍 検出された問題:')];
    issues.forEach((issue, index) => {
      const severity = issue.severity === 'error' ? '❌' : '⚠️';
      const location = issue.line ? ` (行${issue.line})` : '';
      lines.push(`${index + 1}. ${severity} ${issue.message}${location}`);
    });
    
    return lines.join('\n');
  }
}