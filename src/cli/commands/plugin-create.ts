import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { InteractiveCreator } from '../../interactive/creator';
import { Session, SessionStep, Pattern } from '../../interactive/types';
import { OutputFormatter } from '../output';
import { getMessage, getMessageLines } from '../../i18n/messages';

export interface PluginCreateOptions {
  interactive?: boolean;
  template?: string;
  from?: string;
}

/**
 * プラグイン作成CLIコマンド
 * v0.2.0では対話モードとテンプレート機能を実装
 */
export class PluginCreateCommand {
  private interactiveCreator: InteractiveCreator;

  constructor() {
    this.interactiveCreator = new InteractiveCreator();
  }

  /**
   * コマンドの実行
   */
  async execute(options: PluginCreateOptions): Promise<void> {
    try {
      if (options.interactive) {
        await this.handleInteractiveMode();
      } else if (options.template) {
        await this.handleTemplateMode(options.template);
      } else if (options.from) {
        await this.handleFromExistingMode(options.from);
      } else {
        this.showHelp();
      }
    } catch (error) {
      console.error(OutputFormatter.error(getMessage('plugin.create.error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })));
      process.exit(1);
    }
  }

  /**
   * 対話モードの処理
   */
  private async handleInteractiveMode(): Promise<void> {
    console.log(OutputFormatter.header(getMessage('plugin.create.welcome')));
    console.log(getMessage('plugin.create.welcome.subtitle'));
    console.log();
    const descriptionLines = getMessageLines('plugin.create.welcome.description');
    descriptionLines.forEach(line => console.log(line));
    console.log();

    const session = await this.interactiveCreator.startSession();
    await this.handleInteractiveFlow(session);
  }

  /**
   * 対話フローの処理
   */
  private async handleInteractiveFlow(session: Session): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      while (session.currentStep !== SessionStep.COMPLETED) {
        const prompt = this.getPromptForStep(session.currentStep);
        const input = await this.askQuestion(rl, prompt);
        
        const nextStep = await this.interactiveCreator.processInput(session, input);
        
        if (nextStep.action === 'error') {
          console.log(OutputFormatter.error(nextStep.prompt));
          continue;
        }
        
        if (nextStep.action === 'generate') {
          await this.generateAndSavePlugin(session);
          break;
        }
        
        console.log(OutputFormatter.success(getMessage('progress.recorded')));
      }
    } finally {
      rl.close();
    }
  }

  /**
   * ステップに応じたプロンプトの取得
   */
  private getPromptForStep(step: SessionStep): string {
    switch (step) {
      case SessionStep.PURPOSE:
        return getMessage('prompt.purpose') + '\n> ';
      case SessionStep.PREVENTION_GOAL:
        return getMessage('prompt.prevention') + '\n> ';
      case SessionStep.GOOD_EXAMPLES:
        return getMessage('prompt.good_examples') + '\n> ';
      case SessionStep.BAD_EXAMPLES:
        return getMessage('prompt.bad_examples') + '\n> ';
      default:
        return '> ';
    }
  }

  /**
   * 質問の実行
   */
  private askQuestion(rl: readline.Interface, prompt: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * プラグインの生成と保存
   */
  private async generateAndSavePlugin(session: Session): Promise<void> {
    console.log();
    console.log(OutputFormatter.info(getMessage('plugin.create.analyzing')));

    const patterns = session.collectedData.patterns || [];
    const pluginName = this.generatePluginName(session);

    const plugin = await this.interactiveCreator.generatePlugin(patterns, {
      name: pluginName,
      description: session.collectedData.purpose || 'ユーザー生成プラグイン'
    });

    console.log(OutputFormatter.success(getMessage('plugin.create.generating')));
    console.log();
    console.log(getMessage('plugin_create.cli.generated_plugin'));
    console.log(`- 名前: ${plugin.metadata.name}`);
    console.log(`- 説明: ${plugin.metadata.description}`);
    console.log(`- パターン数: ${plugin.metadata.patterns.length}`);

    // プラグインの保存
    await this.interactiveCreator.savePlugin(plugin, pluginName);
    console.log();
    console.log(OutputFormatter.success(getMessage('plugin.create.success', {
      path: `src/plugins/generated/${pluginName}.ts`
    })));
  }

  /**
   * テンプレートモードの処理
   */
  private async handleTemplateMode(templateName: string): Promise<void> {
    console.log(OutputFormatter.info(getMessage('plugin.create.template.creating', { template: templateName })));

    const templateCode = await this.createFromTemplate(templateName);
    if (!templateCode) {
      console.error(OutputFormatter.error(getMessage('plugin.create.template.unknown', { template: templateName })));
      return;
    }

    const pluginName = `${templateName}-plugin`;
    const filePath = path.join('src', 'plugins', 'generated', `${pluginName}.ts`);
    
    // ディレクトリの作成
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, templateCode, 'utf-8');
    console.log(OutputFormatter.success(`✅ テンプレートプラグインを作成しました: ${filePath}`));
  }

  /**
   * 既存プラグインからの作成
   */
  private async handleFromExistingMode(pluginName: string): Promise<void> {
    console.log(OutputFormatter.info(getMessage('plugin.create.existing.creating', { plugin: pluginName })));

    const baseCode = await this.createFromExistingPlugin(pluginName);
    if (!baseCode) {
      console.error(OutputFormatter.error(getMessage('plugin.create.existing.notfound', { plugin: pluginName })));
      return;
    }

    const newPluginName = `${pluginName}-custom`;
    const filePath = path.join('src', 'plugins', 'generated', `${newPluginName}.ts`);
    
    // ディレクトリの作成
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, baseCode, 'utf-8');
    console.log(OutputFormatter.success(`✅ 派生プラグインを作成しました: ${filePath}`));
  }

  /**
   * テンプレートからプラグインコードを生成
   */
  private async createFromTemplate(templateName: string): Promise<string | null> {
    switch (templateName) {
      case 'basic':
        return this.getBasicTemplate();
      case 'pattern-match':
        return this.getPatternMatchTemplate();
      case 'async-await':
        return this.getAsyncAwaitTemplate();
      case 'api-test':
        return this.getApiTestTemplate();
      case 'validation':
        return this.getValidationTemplate();
      default:
        return null;
    }
  }

  /**
   * 既存プラグインからプラグインコードを生成
   */
  private async createFromExistingPlugin(pluginName: string): Promise<string | null> {
    const pluginPath = path.join('src', 'plugins', `${pluginName}.ts`);
    
    if (!fs.existsSync(pluginPath)) {
      return null;
    }

    const originalCode = await fs.promises.readFile(pluginPath, 'utf-8');
    
    // クラス名を変更してカスタム版を作成
    return originalCode
      .replace(/class (\w+)/g, 'class $1Custom')
      .replace(/name = '([^']+)'/g, "name = '$1-custom'");
  }

  /**
   * 基本テンプレートの取得
   */
  private getBasicTemplate(): string {
    return `import * as fs from 'fs';
import { IPlugin, Issue } from '../../core/types';

/**
 * 基本プラグインテンプレート
 * 
 * 作成日: ${new Date().toISOString()}
 * 作成方法: template
 */
export class BasicPlugin implements IPlugin {
  name = 'basic-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // ここにチェックロジックを実装してください
    // 例: 特定のパターンの存在チェック
    
    return issues;
  }
}`;
  }

  /**
   * パターンマッチテンプレートの取得
   */
  private getPatternMatchTemplate(): string {
    return `import * as fs from 'fs';
import { IPlugin, Issue } from '../../core/types';

/**
 * パターンマッチプラグインテンプレート
 * 
 * 作成日: ${new Date().toISOString()}
 * 作成方法: template
 */
export class PatternMatchPlugin implements IPlugin {
  name = 'pattern-match-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // パターンマッチの例
    if (!content.includes('expect(')) {
      issues.push({
        type: 'missing-pattern',
        severity: 'warning',
        message: 'テストにアサーション (expect) が見つかりません',
        file: filePath
      });
    }

    return issues;
  }
}`;
  }

  /**
   * 非同期テスト専用テンプレートの取得
   */
  private getAsyncAwaitTemplate(): string {
    return `import * as fs from 'fs';
import { IPlugin, Issue } from '../../core/types';

/**
 * 非同期テストパターンプラグイン
 * async/awaitの適切な使用をチェック
 * 
 * 作成日: ${new Date().toISOString()}
 * 作成方法: template (async-await)
 */
export class AsyncAwaitPlugin implements IPlugin {
  name = 'async-await-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // async関数でawaitが使われているかチェック
    const asyncFunctionRegex = /test\\s*\\(.*?,\\s*async\\s*\\(/g;
    const awaitRegex = /await\\s+/g;
    
    const asyncMatches = content.match(asyncFunctionRegex);
    const awaitMatches = content.match(awaitRegex);
    
    if (asyncMatches && asyncMatches.length > 0) {
      if (!awaitMatches || awaitMatches.length === 0) {
        issues.push({
          type: 'missing-await',
          severity: 'warning',
          message: 'async関数内でawaitが使用されていません',
          file: filePath
        });
      }
    }

    // Promiseが適切にawaitされているかチェック
    if (content.includes('.then(') && content.includes('async')) {
      issues.push({
        type: 'promise-anti-pattern',
        severity: 'warning',
        message: 'async/await使用時は.then()ではなくawaitを使用してください',
        file: filePath
      });
    }

    return issues;
  }
}`;
  }

  /**
   * APIテスト専用テンプレートの取得
   */
  private getApiTestTemplate(): string {
    return `import * as fs from 'fs';
import { IPlugin, Issue } from '../../core/types';

/**
 * APIテストパターンプラグイン
 * APIレスポンスの適切な検証をチェック
 * 
 * 作成日: ${new Date().toISOString()}
 * 作成方法: template (api-test)
 */
export class ApiTestPlugin implements IPlugin {
  name = 'api-test-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // HTTPステータスコードの検証をチェック
    if (content.includes('response') && !content.includes('.status')) {
      issues.push({
        type: 'missing-status-check',
        severity: 'warning',
        message: 'APIレスポンスのステータスコード検証が不足しています',
        file: filePath
      });
    }

    // エラーレスポンスのテストをチェック
    const hasErrorTest = content.includes('400') || content.includes('404') || 
                        content.includes('500') || content.includes('error');
    if (content.includes('api') && !hasErrorTest) {
      issues.push({
        type: 'missing-error-test',
        severity: 'error',
        message: 'APIエラーケースのテストが不足しています',
        file: filePath
      });
    }

    // レスポンスボディの検証をチェック
    if (content.includes('response') && !content.includes('.body') && !content.includes('.data')) {
      issues.push({
        type: 'missing-body-validation',
        severity: 'warning',
        message: 'APIレスポンスボディの検証が不足しています',
        file: filePath
      });
    }

    return issues;
  }
}`;
  }

  /**
   * バリデーション専用テンプレートの取得
   */
  private getValidationTemplate(): string {
    return `import * as fs from 'fs';
import { IPlugin, Issue } from '../../core/types';

/**
 * バリデーションテストパターンプラグイン
 * 入力値検証の適切なテストをチェック
 * 
 * 作成日: ${new Date().toISOString()}
 * 作成方法: template (validation)
 */
export class ValidationPlugin implements IPlugin {
  name = 'validation-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // 境界値テストをチェック
    const hasBoundaryTest = content.includes('null') || content.includes('undefined') ||
                           content.includes('empty') || content.includes('0') ||
                           content.includes('negative');
    
    if (content.includes('validate') && !hasBoundaryTest) {
      issues.push({
        type: 'missing-boundary-test',
        severity: 'error',
        message: 'バリデーション関数の境界値テストが不足しています',
        file: filePath
      });
    }

    // 無効な入力値のテストをチェック
    const hasInvalidTest = content.includes('invalid') || content.includes('wrong') ||
                          content.includes('bad') || content.includes('error');
    
    if (content.includes('validate') && !hasInvalidTest) {
      issues.push({
        type: 'missing-invalid-input-test',
        severity: 'warning',
        message: '無効な入力値に対するテストが不足しています',
        file: filePath
      });
    }

    // 型チェックのテスト
    const hasTypeTest = content.includes('typeof') || content.includes('instanceof') ||
                       content.includes('string') || content.includes('number');
    
    if (content.includes('validate') && !hasTypeTest) {
      issues.push({
        type: 'missing-type-validation',
        severity: 'warning',
        message: '型バリデーションのテストが不足しています',
        file: filePath
      });
    }

    return issues;
  }
}`;
  }

  /**
   * プラグイン名の生成
   */
  private generatePluginName(session: Session): string {
    const purpose = session.collectedData.purpose || 'custom';
    return purpose
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30) + '-plugin';
  }

  /**
   * ヘルプの表示
   */
  private showHelp(): void {
    console.log(OutputFormatter.header('Rimor プラグイン作成'));
    console.log();
    console.log(getMessage('plugin_create.cli.usage_header'));
    console.log('  rimor plugin create --interactive     ' + getMessage('plugin_create.cli.interactive_description'));
    console.log('  rimor plugin create --template basic  ' + getMessage('plugin_create.cli.template_description'));
    console.log('  rimor plugin create --from plugin-name ' + getMessage('plugin_create.cli.from_description'));
    console.log();
    console.log(getMessage('plugin_create.cli.templates_header'));
    console.log('  basic          ' + getMessage('plugin_create.cli.template.basic'));
    console.log('  pattern-match  ' + getMessage('plugin_create.cli.template.pattern_match'));
    console.log('  async-await    ' + getMessage('plugin_create.cli.template.async_await'));
    console.log('  api-test       ' + getMessage('plugin_create.cli.template.api_test'));
    console.log('  validation     ' + getMessage('plugin_create.cli.template.validation'));
    console.log();
  }
}