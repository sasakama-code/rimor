/**
 * 対話型プラグイン作成システム専用の型定義
 * v0.2.0 - Interactive Plugin Creator Requirements準拠
 */

/**
 * 対話セッションのステップ
 */
export enum SessionStep {
  PURPOSE = 'purpose',
  PREVENTION_GOAL = 'prevention_goal', 
  GOOD_EXAMPLES = 'good_examples',
  BAD_EXAMPLES = 'bad_examples',
  GENERATE = 'generate',
  VALIDATE = 'validate',
  COMPLETED = 'completed'
}

/**
 * 対話セッション情報
 */
export interface Session {
  /** セッションID */
  id: string;
  /** セッション開始時刻 */
  startTime: Date;
  /** 現在のステップ */
  currentStep: SessionStep;
  /** 収集されたデータ */
  collectedData: {
    /** どのようなテスト品質をチェックしたいか */
    purpose?: string;
    /** 何を防ぐことを目的としているか */
    preventionGoal?: string;
    /** 良いテストの例 */
    goodExamples?: string[];
    /** 悪いテストの例 */
    badExamples?: string[];
    /** 抽出されたパターン */
    patterns?: Pattern[];
  };
}

/**
 * パターン情報
 */
export interface Pattern {
  /** パターンのタイプ */
  type: 'string-match' | 'regex' | 'structure';
  /** パターンの値 */
  value: string;
  /** パターンの説明 */
  description: string;
  /** 信頼度スコア (0-1) */
  confidence: number;
}

/**
 * 生成されたプラグイン
 */
export interface GeneratedPlugin {
  /** 生成されたTypeScriptコード */
  code: string;
  /** プラグインのメタデータ */
  metadata: PluginMetadata;
}

/**
 * プラグインメタデータ
 */
export interface PluginMetadata {
  /** プラグイン名 */
  name: string;
  /** プラグインの説明 */
  description: string;
  /** 作成者（常に'interactive'） */
  createdBy: 'interactive';
  /** 作成日時 */
  createdAt: Date;
  /** 使用されたパターン */
  patterns: Pattern[];
}

/**
 * 次のステップ情報
 */
export interface NextStep {
  /** アクション */
  action: 'continue' | 'generate' | 'validate' | 'complete' | 'error';
  /** 次のステップ */
  step: SessionStep;
  /** ユーザーに表示するプロンプト */
  prompt: string;
  /** エラーメッセージ（エラー時のみ） */
  error?: string;
}

/**
 * 検証結果
 */
export interface ValidationResult {
  /** 検証が成功したか */
  isValid: boolean;
  /** 検出された問題数 */
  issuesFound: number;
  /** 検出されたファイル数 */
  filesAnalyzed: number;
  /** 実行時間（ms） */
  executionTime: number;
  /** 検証メッセージ */
  message: string;
  /** エラー詳細（失敗時のみ） */
  error?: string;
}

/**
 * 対話型プラグイン作成インターフェース
 */
export interface IInteractivePluginCreator {
  /** 対話セッションの開始 */
  startSession(): Promise<Session>;
  
  /** ユーザー入力の処理 */
  processInput(session: Session, input: string): Promise<NextStep>;
  
  /** サンプルコードの分析 */
  analyzeSamples(goodExamples: string[], badExamples: string[]): Promise<Pattern[]>;
  
  /** プラグインの生成 */
  generatePlugin(patterns: Pattern[], metadata: Partial<PluginMetadata>): Promise<GeneratedPlugin>;
  
  /** プラグインの検証 */
  validatePlugin(plugin: GeneratedPlugin, testFiles: string[]): Promise<ValidationResult>;
  
  /** プラグインの保存 */
  savePlugin(plugin: GeneratedPlugin, name: string): Promise<void>;
}