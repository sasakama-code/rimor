/**
 * 国際化メッセージシステム
 * v0.2.0: 日本語・英語対応
 */

export type MessageKey = 
  | 'plugin.create.welcome'
  | 'plugin.create.welcome.subtitle'
  | 'plugin.create.welcome.description'
  | 'plugin.create.error'
  | 'plugin.create.success'
  | 'plugin.create.analyzing'
  | 'plugin.create.generating'
  | 'plugin.create.template.creating'
  | 'plugin.create.template.unknown'
  | 'plugin.create.existing.creating'
  | 'plugin.create.existing.notfound'
  | 'plugin.create.help.header'
  | 'plugin.create.help.usage'
  | 'plugin.create.help.templates'
  | 'prompt.purpose'
  | 'prompt.prevention'
  | 'prompt.good_examples'
  | 'prompt.bad_examples'
  | 'progress.recorded'
  | 'progress.completed';

export const messages = {
  ja: {
    'plugin.create.welcome': '🧙 Rimorプラグイン作成アシスタント',
    'plugin.create.welcome.subtitle': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'plugin.create.welcome.description': 'ようこそ！いくつかの質問に答えるだけで、\nカスタムプラグインを作成できます。',
    'plugin.create.error': 'プラグイン作成エラー: {error}',
    'plugin.create.success': '🎉 プラグインを保存しました: {path}',
    'plugin.create.analyzing': '✨ サンプルを分析中...',
    'plugin.create.generating': '✅ プラグインを生成しました',
    'plugin.create.template.creating': 'テンプレート "{template}" からプラグインを作成中...',
    'plugin.create.template.unknown': '不明なテンプレート: {template}',
    'plugin.create.existing.creating': '既存プラグイン "{plugin}" からプラグインを作成中...',
    'plugin.create.existing.notfound': 'プラグインが見つかりません: {plugin}',
    'plugin.create.help.header': 'Rimor プラグイン作成',
    'plugin.create.help.usage': '使用方法:',
    'plugin.create.help.templates': '利用可能なテンプレート:',
    'prompt.purpose': '? どのようなテスト品質をチェックしたいですか？',
    'prompt.prevention': '? このチェックは何を防ぐことを目的としていますか？',
    'prompt.good_examples': '? 良いテストの例を教えてください（スキップ可能）',
    'prompt.bad_examples': '? 悪いテストの例を教えてください（スキップ可能）',
    'progress.recorded': '✓ 入力を記録しました',
    'progress.completed': '✅ 作業完了'
  },
  en: {
    'plugin.create.welcome': '🧙 Rimor Plugin Creation Assistant',
    'plugin.create.welcome.subtitle': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'plugin.create.welcome.description': 'Welcome! Create custom plugins by\nanswering a few simple questions.',
    'plugin.create.error': 'Plugin creation error: {error}',
    'plugin.create.success': '🎉 Plugin saved: {path}',
    'plugin.create.analyzing': '✨ Analyzing samples...',
    'plugin.create.generating': '✅ Plugin generated successfully',
    'plugin.create.template.creating': 'Creating plugin from template "{template}"...',
    'plugin.create.template.unknown': 'Unknown template: {template}',
    'plugin.create.existing.creating': 'Creating plugin from existing "{plugin}"...',
    'plugin.create.existing.notfound': 'Plugin not found: {plugin}',
    'plugin.create.help.header': 'Rimor Plugin Creation',
    'plugin.create.help.usage': 'Usage:',
    'plugin.create.help.templates': 'Available templates:',
    'prompt.purpose': '? What test quality aspect would you like to check?',
    'prompt.prevention': '? What does this check aim to prevent?',
    'prompt.good_examples': '? Please provide examples of good tests (optional)',
    'prompt.bad_examples': '? Please provide examples of bad tests (optional)',
    'progress.recorded': '✓ Input recorded',
    'progress.completed': '✅ Completed'
  }
};

/**
 * 現在の言語を取得
 * 環境変数 RIMOR_LANG または LANG から決定
 */
export function getCurrentLanguage(): 'ja' | 'en' {
  const rimorLang = process.env.RIMOR_LANG;
  const systemLang = process.env.LANG;
  
  if (rimorLang === 'en' || rimorLang === 'ja') {
    return rimorLang;
  }
  
  if (systemLang?.startsWith('ja')) {
    return 'ja';
  }
  
  return 'en'; // デフォルトは英語
}

/**
 * メッセージを取得（プレースホルダー置換付き）
 */
export function getMessage(key: MessageKey, params: Record<string, string> = {}): string {
  const lang = getCurrentLanguage();
  let message = messages[lang][key] || messages.en[key] || key;
  
  // プレースホルダー置換 {key} -> value
  Object.entries(params).forEach(([paramKey, value]) => {
    message = message.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
  });
  
  return message;
}

/**
 * 複数行メッセージの分割
 */
export function getMessageLines(key: MessageKey, params: Record<string, string> = {}): string[] {
  return getMessage(key, params).split('\n');
}