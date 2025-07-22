import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { InteractiveCreator } from '../../interactive/creator';
import { Session, SessionStep, Pattern } from '../../interactive/types';
import { OutputFormatter } from '../output';

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
      console.error(OutputFormatter.error(`プラグイン作成エラー: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  }

  /**
   * 対話モードの処理
   */
  private async handleInteractiveMode(): Promise<void> {
    console.log(OutputFormatter.header('🧙 Rimorプラグイン作成アシスタント'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log();
    console.log('ようこそ！いくつかの質問に答えるだけで、');
    console.log('カスタムプラグインを作成できます。');
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
        
        console.log(OutputFormatter.success('✓ 入力を記録しました'));
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
        return '? どのようなテスト品質をチェックしたいですか？\n> ';
      case SessionStep.PREVENTION_GOAL:
        return '? このチェックは何を防ぐことを目的としていますか？\n> ';
      case SessionStep.GOOD_EXAMPLES:
        return '? 良いテストの例を教えてください（スキップ可能）\n> ';
      case SessionStep.BAD_EXAMPLES:
        return '? 悪いテストの例を教えてください（スキップ可能）\n> ';
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
    console.log(OutputFormatter.info('✨ サンプルを分析中...'));

    const patterns = session.collectedData.patterns || [];
    const pluginName = this.generatePluginName(session);

    const plugin = await this.interactiveCreator.generatePlugin(patterns, {
      name: pluginName,
      description: session.collectedData.purpose || 'ユーザー生成プラグイン'
    });

    console.log(OutputFormatter.success('✅ プラグインを生成しました'));
    console.log();
    console.log('生成されたプラグイン:');
    console.log(`- 名前: ${plugin.metadata.name}`);
    console.log(`- 説明: ${plugin.metadata.description}`);
    console.log(`- パターン数: ${plugin.metadata.patterns.length}`);

    // プラグインの保存
    await this.interactiveCreator.savePlugin(plugin, pluginName);
    console.log();
    console.log(OutputFormatter.success(`🎉 プラグインを保存しました: src/plugins/generated/${pluginName}.ts`));
  }

  /**
   * テンプレートモードの処理
   */
  private async handleTemplateMode(templateName: string): Promise<void> {
    console.log(OutputFormatter.info(`テンプレート "${templateName}" からプラグインを作成中...`));

    const templateCode = await this.createFromTemplate(templateName);
    if (!templateCode) {
      console.error(OutputFormatter.error(`不明なテンプレート: ${templateName}`));
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
    console.log(OutputFormatter.info(`既存プラグイン "${pluginName}" からプラグインを作成中...`));

    const baseCode = await this.createFromExistingPlugin(pluginName);
    if (!baseCode) {
      console.error(OutputFormatter.error(`プラグインが見つかりません: ${pluginName}`));
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
import { IPlugin, Issue } from '../core/types';

/**
 * 基本プラグインテンプレート
 * 
 * 作成日: ${new Date().toISOString()}
 * 作成方法: template
 */
export class BasicPlugin implements IPlugin {
  name = 'basic-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
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
import { IPlugin, Issue } from '../core/types';

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
    console.log('使用方法:');
    console.log('  rimor plugin create --interactive     対話モードでプラグイン作成');
    console.log('  rimor plugin create --template basic  テンプレートからプラグイン作成');
    console.log('  rimor plugin create --from plugin-name 既存プラグインから派生作成');
    console.log();
    console.log('利用可能なテンプレート:');
    console.log('  basic          基本的なプラグインテンプレート');
    console.log('  pattern-match  パターンマッチングプラグイン');
    console.log();
  }
}