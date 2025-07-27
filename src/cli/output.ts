import { getMessage } from '../i18n/messages';

let chalk: any = null;

async function getChalk() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
  }
  return chalk;
}

export class OutputFormatter {
  static async header(title: string): Promise<string> {
    const c = await getChalk();
    return c.bold.blue(`🔍 ${title}\n`) + 
           c.gray('━'.repeat(title.length + 4));
  }
  
  static async success(message: string): Promise<string> {
    const c = await getChalk();
    return c.green(`✅ ${message}`);
  }
  
  static async error(message: string): Promise<string> {
    const c = await getChalk();
    return c.red(`❌ ${message}`);
  }
  
  static async warning(message: string): Promise<string> {
    const c = await getChalk();
    return c.yellow(`⚠️  ${message}`);
  }
  
  static async info(message: string): Promise<string> {
    const c = await getChalk();
    return c.blue(`ℹ️  ${message}`);
  }
  
  static async summary(filesAnalyzed: number, issuesFound: number, executionTime: number): Promise<string> {
    const c = await getChalk();
    const testCoverage = filesAnalyzed > 0 ? Math.round(((filesAnalyzed - issuesFound) / filesAnalyzed) * 100) : 0;
    
    return [
      c.bold('\n' + getMessage('output.summary.header')),
      getMessage('output.summary.files_analyzed', { count: filesAnalyzed.toString() }),
      `${issuesFound > 0 ? '❌' : '✅'} ` + getMessage('output.summary.test_shortage', { count: issuesFound.toString() }),
      getMessage('output.summary.test_coverage', { percentage: testCoverage.toString() }),
      getMessage('output.summary.execution_time', { time: executionTime.toString() })
    ].join('\n');
  }
  
  static async issueList(issues: Array<{severity: string, message: string, line?: number, file?: string}>): Promise<string> {
    const c = await getChalk();
    if (issues.length === 0) {
      return c.green('\n' + getMessage('output.issues.none_found'));
    }
    
    const lines = [c.bold('\n' + getMessage('output.issues.header'))];
    issues.forEach((issue, index) => {
      const severity = issue.severity === 'error' ? '❌' : '⚠️';
      const location = issue.line ? ' ' + getMessage('output.issues.line_number', { line: issue.line.toString() }) : '';
      lines.push(`${index + 1}. ${severity} ${issue.message}${location}`);
    });
    
    return lines.join('\n');
  }
}