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

    // セキュリティ: 入力長制限
    if (trimmedInput.length > 10000) {
      return {
        action: 'error',
        step: session.currentStep,
        prompt: '入力が長すぎます（最大10,000文字）。',
        error: 'Input too long'
      };
    }

    // セキュリティ: 危険なパターンの検出
    const dangerousInputPatterns = [
      /\<script[^>]*\>/gi, // XSS攻撃
      /javascript:/gi, // JavaScript URL scheme
      /vbscript:/gi, // VBScript URL scheme
      /on\w+\s*=/gi, // イベントハンドラー
      /eval\s*\(/gi, // eval関数
      /require\s*\(/gi, // require関数
      /import\s*\(/gi, // 動的import
      /\.\.\//g, // パストラバーサル
      /\/etc\/|\/root\/|\/home\//gi, // システムディレクトリ
      /child_process|exec|spawn/gi, // プロセス実行
      /fs\.write|fs\.unlink|fs\.rmdir/gi, // ファイル操作
    ];

    for (const pattern of dangerousInputPatterns) {
      if (pattern.test(trimmedInput)) {
        return {
          action: 'error',
          step: session.currentStep,
          prompt: 'セキュリティ違反: 不正な入力が検出されました。安全な文字のみ使用してください。',
          error: `Dangerous pattern detected: ${pattern.source}`
        };
      }
    }

    // 制御文字のチェック
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(trimmedInput)) {
      return {
        action: 'error',
        step: session.currentStep,
        prompt: '無効な制御文字が含まれています。',
        error: 'Control characters detected'
      };
    }

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
    // セキュリティ: プラグイン名のサニタイゼーション
    const sanitizedName = this.sanitizePluginName(name);
    if (!sanitizedName) {
      throw new Error('無効なプラグイン名です');
    }

    const projectRoot = process.cwd();
    const pluginDir = path.join(projectRoot, 'src', 'plugins', 'generated');
    
    // セキュリティ: プロジェクト範囲内であることを確認
    const { PathSecurity } = await import('../utils/pathSecurity');
    if (!PathSecurity.validateProjectPath(pluginDir, projectRoot)) {
      throw new Error('セキュリティ違反: プラグインディレクトリがプロジェクト範囲外です');
    }

    // ディレクトリが存在しない場合は作成（非同期版を使用）
    try {
      await fs.promises.access(pluginDir);
    } catch {
      // ディレクトリが存在しない場合、作成する
      await fs.promises.mkdir(pluginDir, { recursive: true });
    }

    const fileName = `${sanitizedName}.ts`;
    const filePath = path.join(pluginDir, fileName);
    
    // セキュリティ: 最終的なファイルパスの検証
    if (!PathSecurity.validateProjectPath(filePath, projectRoot)) {
      throw new Error('セキュリティ違反: ファイルパスがプロジェクト範囲外です');
    }

    // 既存ファイルの上書き防止
    try {
      await fs.promises.access(filePath);
      throw new Error(`プラグインファイル ${fileName} は既に存在します`);
    } catch (error) {
      // ファイルが存在しない場合は続行
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    // セキュリティ: ファイルサイズ制限
    if (plugin.code.length > 100000) {
      throw new Error('プラグインファイルサイズが制限を超えています（最大100KB）');
    }
    
    await fs.promises.writeFile(filePath, plugin.code, 'utf-8');
  }

  /**
   * プラグイン名のサニタイゼーション
   */
  private sanitizePluginName(name: string): string | null {
    // 空文字チェック
    if (!name || name.trim().length === 0) {
      return null;
    }

    // 危険な文字を除去
    const sanitized = name
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '') // 英数字、アンダースコア、ハイフンのみ許可
      .replace(/^[^a-zA-Z]/, '') // 先頭は英字である必要
      .substring(0, 50); // 最大50文字

    // 長さチェック
    if (sanitized.length < 3) {
      return null;
    }

    // 予約語チェック
    const reservedNames = [
      'plugin', 'index', 'config', 'types', 'test', 'spec',
      'node_modules', 'dist', 'build', 'src', 'lib'
    ];
    
    if (reservedNames.includes(sanitized.toLowerCase())) {
      return null;
    }

    return sanitized;
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