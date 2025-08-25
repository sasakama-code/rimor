
type ChalkInstance = typeof import('chalk').default;

let chalkInstance: ChalkInstance | null = null;
let chalkPromise: Promise<any> | null = null;

function getChalk() {
  if (!chalkPromise) {
    chalkPromise = loadChalk();
  }
  return chalkPromise;
}

async function loadChalk() {
  if (chalkInstance) {
    return chalkInstance;
  }

  try {
    if (process.env.NODE_ENV === 'test') {
      const mockChalk: any = {
        bold: Object.assign((s: string) => s, {
          blue: (s: string) => s
        }),
        green: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        blue: (s: string) => s,
        gray: (s: string) => s
      };
      chalkInstance = mockChalk as ChalkInstance;
    } else {
      const chalk = await import('chalk');
      chalkInstance = chalk.default;
    }
  } catch (error) {
    const mockChalk: any = {
      bold: Object.assign((s: string) => s, {
        blue: (s: string) => s
      }),
      green: (s: string) => s,
      red: (s: string) => s,
      yellow: (s: string) => s,
      blue: (s: string) => s,
      gray: (s: string) => s
    };
    chalkInstance = mockChalk as ChalkInstance;
  }
  
  return chalkInstance;
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
      c.bold('\n分析サマリー'),
      `分析対象: ${filesAnalyzed}ファイル`,
      `${issuesFound > 0 ? '❌' : '✅'} テスト不足: ${issuesFound}件`,
      `テストカバレッジ: ${testCoverage}%`,
      `実行時間: ${executionTime}ms`
    ].join('\n');
  }
  
  static async issueList(issues: Array<{severity: string, message: string, line?: number, file?: string}>): Promise<string> {
    const c = await getChalk();
    if (issues.length === 0) {
      return c.green('\n問題は見つかりませんでした！');
    }
    
    const lines = [c.bold('\n見つかった問題:')];
    issues.forEach((issue, index) => {
      const severity = (issue.severity === 'error' || issue.severity === 'high') ? '❌' : '⚠️';
      const location = issue.line ? ` (行: ${issue.line})` : '';
      lines.push(`${index + 1}. ${severity} ${issue.message}${location}`);
    });
    
    return lines.join('\n');
  }
}