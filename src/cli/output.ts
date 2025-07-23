import chalk from 'chalk';
import { getMessage } from '../i18n/messages';

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
      chalk.bold('\n' + getMessage('output.summary.header')),
      getMessage('output.summary.files_analyzed', { count: filesAnalyzed.toString() }),
      `${issuesFound > 0 ? '❌' : '✅'} ` + getMessage('output.summary.test_shortage', { count: issuesFound.toString() }),
      getMessage('output.summary.test_coverage', { percentage: testCoverage.toString() }),
      getMessage('output.summary.execution_time', { time: executionTime.toString() })
    ].join('\n');
  }
  
  static issueList(issues: Array<{severity: string, message: string, line?: number, file?: string}>): string {
    if (issues.length === 0) {
      return chalk.green('\n' + getMessage('output.issues.none_found'));
    }
    
    const lines = [chalk.bold('\n' + getMessage('output.issues.header'))];
    issues.forEach((issue, index) => {
      const severity = issue.severity === 'error' ? '❌' : '⚠️';
      const location = issue.line ? ' ' + getMessage('output.issues.line_number', { line: issue.line.toString() }) : '';
      lines.push(`${index + 1}. ${severity} ${issue.message}${location}`);
    });
    
    return lines.join('\n');
  }
}