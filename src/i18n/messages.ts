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
  | 'progress.completed'
  // Critical Error Messages
  | 'error.file.not_found'
  | 'error.file.permission_denied'
  | 'error.file.operation_failed'
  | 'error.plugin.execution_failed'
  | 'error.config.invalid_file'
  | 'error.config.invalid_content'
  | 'error.parse.failed'
  | 'error.timeout.operation'
  | 'error.unknown'
  | 'error.default.file_not_found'
  | 'error.default.permission_denied'
  | 'error.default.invalid_config'
  | 'error.default.plugin_error'
  | 'error.default.parse_error'
  | 'error.default.timeout'
  | 'error.default.generic'
  // CLI Analysis Messages
  | 'cli.error.path_not_found'
  | 'cli.error.analysis_failed'
  | 'cli.execution_error'
  // Plugin Messages
  | 'plugin.assertion.not_found'
  | 'plugin.test.not_found'
  // Console Output Messages
  | 'output.summary.header'
  | 'output.summary.files_analyzed'
  | 'output.summary.test_shortage'
  | 'output.summary.test_coverage'
  | 'output.summary.execution_time'
  | 'output.issues.none_found'
  | 'output.issues.header'
  | 'output.issues.line_number'
  // Analysis Mode Messages
  | 'analysis.mode.single_file'
  | 'analysis.mode.verbose'
  | 'analysis.mode.parallel'
  | 'analysis.header.main'
  | 'analysis.info.target_path'
  | 'analysis.info.enabled_plugins'
  | 'analysis.info.batch_size'
  | 'analysis.info.max_concurrency'
  | 'analysis.stats.parallel_header'
  | 'analysis.stats.batch_count'
  | 'analysis.stats.avg_batch_time'
  | 'analysis.stats.max_batch_time'
  | 'analysis.stats.concurrency_level'
  // Cleanup Manager Messages
  | 'cleanup.reason.invalid_plugin'
  | 'cleanup.reason.temp_file'
  | 'cleanup.reason.backup_file'
  | 'cleanup.startup.running'
  | 'cleanup.startup.completed'
  | 'cleanup.startup.none_found'
  | 'cleanup.startup.error'
  | 'cleanup.emergency.deleted'
  | 'cleanup.error.known_file_detected'
  | 'cleanup.error.compile_cause'
  | 'cleanup.warning.plugin_compile_error'
  | 'cleanup.warning.user_file_protection'
  | 'cleanup.instruction.manual_fix'
  // Core Plugin Messages
  | 'plugin.assertion.weak_detected'
  | 'plugin.assertion.missing_assertions'
  | 'plugin.assertion.limited_variety'
  | 'plugin.assertion.magic_numbers'
  | 'plugin.completeness.incomplete_coverage'
  | 'plugin.completeness.missing_edge_cases'
  | 'plugin.completeness.empty_suite'
  | 'plugin.completeness.missing_setup'
  | 'plugin.structure.poor_organization'
  | 'plugin.structure.missing_setup'
  | 'plugin.structure.deep_nesting'
  | 'plugin.structure.inconsistent_naming'
  | 'plugin.structure.large_file';

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
    'progress.completed': '✅ 作業完了',
    // Critical Error Messages
    'error.file.not_found': 'ファイルが見つかりません: {filePath}',
    'error.file.permission_denied': 'ファイルへのアクセス権限がありません: {filePath}',
    'error.file.operation_failed': 'ファイル操作でエラーが発生しました: {filePath}',
    'error.plugin.execution_failed': 'プラグイン「{pluginName}」でエラーが発生しました',
    'error.config.invalid_file': '設定ファイルが不正です: {configPath}',
    'error.config.invalid_content': '設定が不正です',
    'error.parse.failed': '{type}の解析でエラーが発生しました',
    'error.timeout.operation': '操作がタイムアウトしました: {operation} ({timeoutMs}ms)',
    'error.unknown': 'エラーが発生しました: {message}',
    'error.default.file_not_found': 'ファイルが見つかりません: {message}',
    'error.default.permission_denied': 'アクセス権限がありません: {message}',
    'error.default.invalid_config': '設定が不正です: {message}',
    'error.default.plugin_error': 'プラグインエラー: {message}',
    'error.default.parse_error': '解析エラー: {message}',
    'error.default.timeout': 'タイムアウト: {message}',
    'error.default.generic': 'エラーが発生しました: {message}',
    // CLI Analysis Messages
    'cli.error.path_not_found': '指定されたパスが存在しません: {targetPath}',
    'cli.error.analysis_failed': '分析中にエラーが発生しました',
    'cli.execution_error': 'CLI実行中にエラーが発生しました:',
    // Plugin Messages
    'plugin.assertion.not_found': 'アサーション（expect文など）が見つかりません: {filePath}',
    'plugin.test.not_found': 'テストファイルが存在しません: {filePath}',
    // Console Output Messages
    'output.summary.header': '📊 サマリー:',
    'output.summary.files_analyzed': '📁 分析対象: {count}ファイル',
    'output.summary.test_shortage': 'テスト不足: {count}件',
    'output.summary.test_coverage': '📈 テストカバレッジ: {percentage}%',
    'output.summary.execution_time': '⏱️  実行時間: {time}ms',
    'output.issues.none_found': '🎉 問題は見つかりませんでした！',
    'output.issues.header': '🔍 検出された問題:',
    'output.issues.line_number': '(行{line})',
    // Analysis Mode Messages
    'analysis.mode.single_file': '単一ファイルモードで実行中...',
    'analysis.mode.verbose': '詳細モードで実行中...',
    'analysis.mode.parallel': '並列処理モードで実行中...',
    'analysis.header.main': 'Rimor テスト品質監査',
    'analysis.info.target_path': '分析対象: {path}',
    'analysis.info.enabled_plugins': '利用プラグイン: {plugins}',
    'analysis.info.batch_size': 'バッチサイズ: {size}',
    'analysis.info.max_concurrency': '最大同時実行数: {count}',
    'analysis.stats.parallel_header': '並列処理統計:',
    'analysis.stats.batch_count': '  バッチ数: {count}',
    'analysis.stats.avg_batch_time': '  平均バッチ時間: {time}ms',
    'analysis.stats.max_batch_time': '  最大バッチ時間: {time}ms',
    'analysis.stats.concurrency_level': '  同時実行レベル: {level}',
    // Cleanup Manager Messages
    'cleanup.reason.invalid_plugin': '不正なプラグインファイル（型エラーを含む自動生成ファイル）',
    'cleanup.reason.temp_file': '一時ファイル',
    'cleanup.reason.backup_file': 'バックアップファイル',
    'cleanup.startup.running': '🧹 プロジェクト開始時クリーンアップを実行中...',
    'cleanup.startup.completed': '✅ {count}個のファイルをクリーンアップしました',
    'cleanup.startup.none_found': '✅ クリーンアップ対象ファイルはありませんでした',
    'cleanup.startup.error': 'プロジェクト開始時クリーンアップでエラーが発生しました',
    'cleanup.emergency.deleted': '🗑️  緊急削除: {filePath} ({reason})',
    'cleanup.error.known_file_detected': '⚠️  既知の問題ファイル（saved-plugin.ts）を検出しました',
    'cleanup.error.compile_cause': 'TypeScriptコンパイルエラーの原因（IPlugin型定義エラー - 自動生成された既知の問題ファイル）',
    'cleanup.warning.plugin_compile_error': '⚠️  プラグインファイルでコンパイルエラーを検出: {file}',
    'cleanup.warning.user_file_protection': '💡 ユーザー作成ファイルの可能性があるため、自動削除は行いません',
    'cleanup.instruction.manual_fix': '📝 ファイル内容を確認し、必要に応じて手動で修正または削除してください',
    // Core Plugin Messages
    'plugin.assertion.weak_detected': '弱いアサーションが検出されました',
    'plugin.assertion.missing_assertions': 'アサーションが不足しています',
    'plugin.assertion.limited_variety': 'アサーションの種類が限定的です',
    'plugin.assertion.magic_numbers': 'マジックナンバーがアサーションに含まれています',
    'plugin.completeness.incomplete_coverage': 'テストカバレッジが不完全です',
    'plugin.completeness.missing_edge_cases': 'エッジケースのテストが不足しています',
    'plugin.completeness.empty_suite': '空のテストスイートがあります',
    'plugin.completeness.missing_setup': 'セットアップ・ティアダウンが不足しています',
    'plugin.structure.poor_organization': 'テストの構造が不適切です',
    'plugin.structure.missing_setup': 'セットアップ・ティアダウンが不足しています',
    'plugin.structure.deep_nesting': 'ネストが深すぎます',
    'plugin.structure.inconsistent_naming': '命名が一貫していません',
    'plugin.structure.large_file': 'テストファイルが大きすぎます'
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
    'progress.completed': '✅ Completed',
    // Critical Error Messages
    'error.file.not_found': 'File not found: {filePath}',
    'error.file.permission_denied': 'Permission denied for file: {filePath}',
    'error.file.operation_failed': 'File operation failed: {filePath}',
    'error.plugin.execution_failed': 'Plugin "{pluginName}" execution failed',
    'error.config.invalid_file': 'Invalid configuration file: {configPath}',
    'error.config.invalid_content': 'Invalid configuration',
    'error.parse.failed': 'Failed to parse {type}',
    'error.timeout.operation': 'Operation timed out: {operation} ({timeoutMs}ms)',
    'error.unknown': 'An error occurred: {message}',
    'error.default.file_not_found': 'File not found: {message}',
    'error.default.permission_denied': 'Permission denied: {message}',
    'error.default.invalid_config': 'Invalid configuration: {message}',
    'error.default.plugin_error': 'Plugin error: {message}',
    'error.default.parse_error': 'Parse error: {message}',
    'error.default.timeout': 'Timeout: {message}',
    'error.default.generic': 'Error occurred: {message}',
    // CLI Analysis Messages
    'cli.error.path_not_found': 'Specified path does not exist: {targetPath}',
    'cli.error.analysis_failed': 'Error occurred during analysis',
    'cli.execution_error': 'CLI execution error:',
    // Plugin Messages
    'plugin.assertion.not_found': 'No assertions (expect statements) found: {filePath}',
    'plugin.test.not_found': 'Test file does not exist: {filePath}',
    // Console Output Messages
    'output.summary.header': '📊 Summary:',
    'output.summary.files_analyzed': '📁 Files analyzed: {count}',
    'output.summary.test_shortage': 'Test issues: {count}',
    'output.summary.test_coverage': '📈 Test coverage: {percentage}%',
    'output.summary.execution_time': '⏱️  Execution time: {time}ms',
    'output.issues.none_found': '🎉 No issues found!',
    'output.issues.header': '🔍 Issues detected:',
    'output.issues.line_number': '(line {line})',
    // Analysis Mode Messages
    'analysis.mode.single_file': 'Running in single file mode...',
    'analysis.mode.verbose': 'Running in verbose mode...',
    'analysis.mode.parallel': 'Running in parallel processing mode...',
    'analysis.header.main': 'Rimor Test Quality Audit',
    'analysis.info.target_path': 'Analysis target: {path}',
    'analysis.info.enabled_plugins': 'Enabled plugins: {plugins}',
    'analysis.info.batch_size': 'Batch size: {size}',
    'analysis.info.max_concurrency': 'Max concurrency: {count}',
    'analysis.stats.parallel_header': 'Parallel processing statistics:',
    'analysis.stats.batch_count': '  Batch count: {count}',
    'analysis.stats.avg_batch_time': '  Average batch time: {time}ms',
    'analysis.stats.max_batch_time': '  Max batch time: {time}ms',
    'analysis.stats.concurrency_level': '  Concurrency level: {level}',
    // Cleanup Manager Messages
    'cleanup.reason.invalid_plugin': 'Invalid plugin file (auto-generated file with type errors)',
    'cleanup.reason.temp_file': 'Temporary file',
    'cleanup.reason.backup_file': 'Backup file',
    'cleanup.startup.running': '🧹 Running startup cleanup...',
    'cleanup.startup.completed': '✅ Cleaned up {count} files',
    'cleanup.startup.none_found': '✅ No files to clean up',
    'cleanup.startup.error': 'Error occurred during startup cleanup',
    'cleanup.emergency.deleted': '🗑️  Emergency deletion: {filePath} ({reason})',
    'cleanup.error.known_file_detected': '⚠️  Known problematic file (saved-plugin.ts) detected',
    'cleanup.error.compile_cause': 'TypeScript compilation error cause (IPlugin type definition error - known auto-generated problematic file)',
    'cleanup.warning.plugin_compile_error': '⚠️  Plugin file compilation error detected: {file}',
    'cleanup.warning.user_file_protection': '💡 Automatic deletion skipped as this may be a user-created file',
    'cleanup.instruction.manual_fix': '📝 Please review the file content and manually fix or delete if necessary',
    // Core Plugin Messages
    'plugin.assertion.weak_detected': 'Weak assertions detected',
    'plugin.assertion.missing_assertions': 'Missing assertions',
    'plugin.assertion.limited_variety': 'Limited assertion variety',
    'plugin.assertion.magic_numbers': 'Magic numbers in assertions',
    'plugin.completeness.incomplete_coverage': 'Incomplete test coverage',
    'plugin.completeness.missing_edge_cases': 'Missing edge case tests',
    'plugin.completeness.empty_suite': 'Empty test suite',
    'plugin.completeness.missing_setup': 'Missing setup/teardown',
    'plugin.structure.poor_organization': 'Poor test organization',
    'plugin.structure.missing_setup': 'Missing setup/teardown',
    'plugin.structure.deep_nesting': 'Too deeply nested',
    'plugin.structure.inconsistent_naming': 'Inconsistent naming',
    'plugin.structure.large_file': 'Test file too large'
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