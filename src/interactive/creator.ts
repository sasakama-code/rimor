import * as fs from 'fs';
import * as path from 'path';
import { 
  Session, 
  SessionStep, 
  NextStep, 
  Pattern, 
  GeneratedPlugin, 
  PluginMetadata,
  ValidationResult,
  IInteractivePluginCreator 
} from './types';
import { getMessage } from '../i18n/messages';
import { PatternAnalyzer } from './analyzer';
import { PluginGenerator } from './generator';
import { PluginValidator } from './validator';

/**
 * 対話型プラグイン作成システムのメインエンジン
 */
export class InteractiveCreator implements IInteractivePluginCreator {
  private patternAnalyzer: PatternAnalyzer;
  private pluginGenerator: PluginGenerator;
  private pluginValidator: PluginValidator;

  constructor() {
    this.patternAnalyzer = new PatternAnalyzer();
    this.pluginGenerator = new PluginGenerator();
    this.pluginValidator = new PluginValidator();
  }

  /**
   * 対話セッションを開始
   */
  async startSession(): Promise<Session> {
    const sessionId = this.generateSessionId();
    return {
      id: sessionId,
      startTime: new Date(),
      currentStep: SessionStep.PURPOSE,
      collectedData: {}
    };
  }

  /**
   * ユーザー入力を処理し、次のステップを決定
   */
  async processInput(session: Session, input: string): Promise<NextStep> {
    // 入力の基本検証
    if (!input || input.trim().length === 0) {
      return {
        action: 'error',
        step: session.currentStep,
        prompt: '入力が空です。もう一度入力してください。',
        error: 'Empty input provided'
      };
    }

    const trimmedInput = input.trim();

    try {
      switch (session.currentStep) {
        case SessionStep.PURPOSE:
          return await this.handlePurposeInput(session, trimmedInput);

        case SessionStep.PREVENTION_GOAL:
          return await this.handlePreventionGoalInput(session, trimmedInput);

        case SessionStep.GOOD_EXAMPLES:
          return await this.handleGoodExamplesInput(session, trimmedInput);

        case SessionStep.BAD_EXAMPLES:
          return await this.handleBadExamplesInput(session, trimmedInput);

        default:
          return {
            action: 'error',
            step: session.currentStep,
            prompt: getMessage('interactive.error.unknown_step'),
            error: `不明なステップ: ${session.currentStep}`
          };
      }
    } catch (error) {
      return {
        action: 'error',
        step: session.currentStep,
        prompt: getMessage('interactive.error.generic'),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * サンプルコードの分析
   */
  async analyzeSamples(goodExamples: string[], badExamples: string[]): Promise<Pattern[]> {
    return this.patternAnalyzer.analyzeExamples(goodExamples, badExamples);
  }

  /**
   * プラグインの生成
   */
  async generatePlugin(patterns: Pattern[], metadata: Partial<PluginMetadata>): Promise<GeneratedPlugin> {
    const completeMetadata: PluginMetadata = {
      name: metadata.name || 'user-generated-plugin',
      description: metadata.description || 'ユーザー生成プラグイン',
      createdBy: 'interactive',
      createdAt: new Date(),
      patterns: patterns
    };

    const code = this.pluginGenerator.generate(patterns, completeMetadata);

    return {
      code,
      metadata: completeMetadata
    };
  }

  /**
   * プラグインの検証
   */
  async validatePlugin(plugin: GeneratedPlugin, testFiles: string[]): Promise<ValidationResult> {
    return this.pluginValidator.validate(plugin, testFiles);
  }

  /**
   * プラグインの保存
   */
  async savePlugin(plugin: GeneratedPlugin, name: string): Promise<void> {
    const pluginDir = path.join(process.cwd(), 'src', 'plugins', 'generated');
    
    // ディレクトリが存在しない場合は作成（非同期版を使用）
    try {
      await fs.promises.access(pluginDir);
    } catch {
      // ディレクトリが存在しない場合、作成する
      await fs.promises.mkdir(pluginDir, { recursive: true });
    }

    const fileName = `${name}.ts`;
    const filePath = path.join(pluginDir, fileName);
    
    await fs.promises.writeFile(filePath, plugin.code, 'utf-8');
  }

  /**
   * 目的入力の処理
   */
  private async handlePurposeInput(session: Session, input: string): Promise<NextStep> {
    session.collectedData.purpose = input;
    session.currentStep = SessionStep.PREVENTION_GOAL;

    return {
      action: 'continue',
      step: SessionStep.PREVENTION_GOAL,
      prompt: 'このチェックは何を防ぐことを目的としていますか？'
    };
  }

  /**
   * 防止目標入力の処理
   */
  private async handlePreventionGoalInput(session: Session, input: string): Promise<NextStep> {
    session.collectedData.preventionGoal = input;
    session.currentStep = SessionStep.GOOD_EXAMPLES;

    return {
      action: 'continue',
      step: SessionStep.GOOD_EXAMPLES,
      prompt: '良いテストの例を教えてください（スキップする場合は "skip" と入力）：'
    };
  }

  /**
   * 良い例入力の処理
   */
  private async handleGoodExamplesInput(session: Session, input: string): Promise<NextStep> {
    if (input.toLowerCase() !== 'skip') {
      session.collectedData.goodExamples = session.collectedData.goodExamples || [];
      session.collectedData.goodExamples.push(input);
    }

    session.currentStep = SessionStep.BAD_EXAMPLES;

    return {
      action: 'continue',
      step: SessionStep.BAD_EXAMPLES,
      prompt: '悪いテストの例を教えてください（スキップする場合は "skip" と入力）：'
    };
  }

  /**
   * 悪い例入力の処理
   */
  private async handleBadExamplesInput(session: Session, input: string): Promise<NextStep> {
    if (input.toLowerCase() !== 'skip') {
      session.collectedData.badExamples = session.collectedData.badExamples || [];
      session.collectedData.badExamples.push(input);
    }

    // パターン分析の実行
    const goodExamples = session.collectedData.goodExamples || [];
    const badExamples = session.collectedData.badExamples || [];
    
    session.collectedData.patterns = await this.analyzeSamples(goodExamples, badExamples);
    session.currentStep = SessionStep.GENERATE;

    return {
      action: 'generate',
      step: SessionStep.GENERATE,
      prompt: 'サンプルを分析しました。プラグインを生成します...'
    };
  }

  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `session-${timestamp}-${randomStr}`;
  }
}