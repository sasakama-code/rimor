
let chalkInstance: any = null;
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
      chalkInstance = {
        bold: (s: string) => s,
        green: (s: string) => s,
        red: (s: string) => s,
        yellow: (s: string) => s,
        blue: (s: string) => s,
        gray: (s: string) => s
      };
      chalkInstance.bold.blue = (s: string) => s;
    } else {
      const chalk = await import('chalk');
      chalkInstance = chalk.default;
    }
  } catch (error) {
    chalkInstance = {
      bold: (s: string) => s,
      green: (s: string) => s,
      red: (s: string) => s,
      yellow: (s: string) => s,
      blue: (s: string) => s,
      gray: (s: string) => s
    };
    chalkInstance.bold.blue = (s: string) => s;
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
      c.bold('\n' + ""),
      "",
      `${issuesFound > 0 ? '❌' : '✅'} ` + "",
      "",
      ""
    ].join('\n');
  }
  
  static async issueList(issues: Array<{severity: string, message: string, line?: number, file?: string}>): Promise<string> {
    const c = await getChalk();
    if (issues.length === 0) {
      return c.green('\n' + "");
    }
    
    const lines = [c.bold('\n' + "")];
    issues.forEach((issue, index) => {
      const severity = issue.severity === 'error' ? '❌' : '⚠️';
      const location = issue.line ? ' ' + "" : '';
      lines.push(`${index + 1}. ${severity} ${issue.message}${location}`);
    });
    
    return lines.join('\n');
  }
}