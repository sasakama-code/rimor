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
  | 'plugin.structure.large_file'
  // Core System Messages
  | 'config.file.not_found'
  | 'config.generated.warning'
  | 'config.validation.warning'
  | 'config.improvement.suggestion'
  | 'config.plugin.auto_detection_failed'
  | 'config.plugin.description.assertion_quality'
  | 'config.plugin.description.test_completeness'
  | 'config.plugin.description.test_structure'
  // Cache System Messages
  | 'cache.error.initialization'
  | 'cache.error.read_failed'
  | 'cache.error.save_failed'
  | 'cache.error.delete_failed'
  | 'cache.info.header'
  | 'cache.info.cleared'
  | 'cache.info.optimized'
  | 'cache.info.already_optimized'
  | 'cache.stats.header'
  // Performance Monitor Messages
  | 'performance.report.header'
  | 'performance.report.separator'
  // CLI Plugin Create Messages
  | 'plugin_create.cli.generated_plugin'
  | 'plugin_create.cli.usage_header'
  | 'plugin_create.cli.interactive_description'
  | 'plugin_create.cli.template_description'
  | 'plugin_create.cli.from_description'
  | 'plugin_create.cli.templates_header'
  | 'plugin_create.cli.template.basic'
  | 'plugin_create.cli.template.pattern_match'
  | 'plugin_create.cli.template.async_await'
  | 'plugin_create.cli.template.api_test'
  | 'plugin_create.cli.template.validation'
  // Interactive Creator Messages
  | 'interactive.error.unknown_step'
  | 'interactive.error.generic'
  | 'interactive.generator.no_patterns'
  // Legacy Plugin Messages
  | 'legacy.plugin.compatibility_issues'
  // Test Plugin Messages
  | 'test_completeness.suggestion.comprehensive'
  | 'test_completeness.action.add_cases'
  // Utility Messages
  | 'regex.error.global_flag_required'
  | 'validation.error.invalid_plugin_code';

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
    'plugin.structure.large_file': 'テストファイルが大きすぎます',
    // Core System Messages
    'config.file.not_found': '設定ファイルが見つかりません。メタデータ駆動設定を生成中...',
    'config.generated.warning': '生成された設定に問題があります: {errors}',
    'config.validation.warning': '設定に関する警告: {warnings}',
    'config.improvement.suggestion': '設定改善の提案: {suggestions}',
    'config.plugin.auto_detection_failed': 'プラグイン自動検出に失敗しました。デフォルト設定を使用します。',
    'config.plugin.description.assertion_quality': 'アサーション品質分析',
    'config.plugin.description.test_completeness': 'テスト網羅性分析',
    'config.plugin.description.test_structure': 'テスト構造分析',
    // Cache System Messages
    'cache.error.initialization': 'キャッシュ初期化中にエラーが発生しました',
    'cache.error.read_failed': 'キャッシュファイル読み込み中にエラーが発生しました',
    'cache.error.save_failed': 'キャッシュファイル保存中にエラーが発生しました',
    'cache.error.delete_failed': 'キャッシュファイル削除中にエラーが発生しました',
    'cache.info.header': '🗄️  キャッシュ情報:',
    'cache.info.cleared': '✅ キャッシュをクリアしました',
    'cache.info.optimized': '✅ キャッシュを最適化しました（{count}件のエントリを削除）',
    'cache.info.already_optimized': '✅ キャッシュは既に最適化されています',
    'cache.stats.header': '📊 キャッシュ統計:',
    // Performance Monitor Messages
    'performance.report.header': '📊 パフォーマンスレポート',
    'performance.report.separator': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    // CLI Plugin Create Messages
    'plugin_create.cli.generated_plugin': '生成されたプラグイン:',
    'plugin_create.cli.usage_header': '使用方法:',
    'plugin_create.cli.interactive_description': '対話モードでプラグイン作成',
    'plugin_create.cli.template_description': 'テンプレートからプラグイン作成',
    'plugin_create.cli.from_description': '既存プラグインから派生作成',
    'plugin_create.cli.templates_header': '利用可能なテンプレート:',
    'plugin_create.cli.template.basic': '基本的なプラグインテンプレート',
    'plugin_create.cli.template.pattern_match': 'パターンマッチングプラグイン',
    'plugin_create.cli.template.async_await': '非同期テスト専用プラグイン',
    'plugin_create.cli.template.api_test': 'APIテスト専用プラグイン',
    'plugin_create.cli.template.validation': 'バリデーション専用プラグイン',
    // Interactive Creator Messages
    'interactive.error.unknown_step': 'システムエラー：不明なステップです。',
    'interactive.error.generic': 'エラーが発生しました。もう一度お試しください。',
    'interactive.generator.no_patterns': '// パターンが指定されていないため、チェックは実行されません',
    // Legacy Plugin Messages
    'legacy.plugin.compatibility_issues': 'レガシープラグインで検出された問題を解決してください',
    // Test Plugin Messages
    'test_completeness.suggestion.comprehensive': 'CRUD操作、エラーハンドリング、境界値テストなど、包括的なテストケースを追加してください',
    'test_completeness.action.add_cases': 'テストケースの追加',
    // Utility Messages
    'regex.error.global_flag_required': 'グローバルフラグ(g)が設定されている正規表現が必要です',
    'validation.error.invalid_plugin_code': 'プラグインコードが無効です'
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
    'plugin.structure.large_file': 'Test file too large',
    // Core System Messages
    'config.file.not_found': 'Configuration file not found. Generating metadata-driven configuration...',
    'config.generated.warning': 'Issues found in generated configuration: {errors}',
    'config.validation.warning': 'Configuration warnings: {warnings}',
    'config.improvement.suggestion': 'Configuration improvement suggestions: {suggestions}',
    'config.plugin.auto_detection_failed': 'Plugin auto-detection failed. Using default configuration.',
    'config.plugin.description.assertion_quality': 'Assertion quality analysis',
    'config.plugin.description.test_completeness': 'Test completeness analysis',
    'config.plugin.description.test_structure': 'Test structure analysis',
    // Cache System Messages
    'cache.error.initialization': 'Error occurred during cache initialization',
    'cache.error.read_failed': 'Error occurred while reading cache file',
    'cache.error.save_failed': 'Error occurred while saving cache file',
    'cache.error.delete_failed': 'Error occurred while deleting cache file',
    'cache.info.header': '🗄️  Cache Information:',
    'cache.info.cleared': '✅ Cache cleared',
    'cache.info.optimized': '✅ Cache optimized ({count} entries removed)',
    'cache.info.already_optimized': '✅ Cache is already optimized',
    'cache.stats.header': '📊 Cache Statistics:',
    // Performance Monitor Messages
    'performance.report.header': '📊 Performance Report',
    'performance.report.separator': '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    // CLI Plugin Create Messages
    'plugin_create.cli.generated_plugin': 'Generated plugin:',
    'plugin_create.cli.usage_header': 'Usage:',
    'plugin_create.cli.interactive_description': 'Create plugin in interactive mode',
    'plugin_create.cli.template_description': 'Create plugin from template',
    'plugin_create.cli.from_description': 'Create plugin derived from existing plugin',
    'plugin_create.cli.templates_header': 'Available templates:',
    'plugin_create.cli.template.basic': 'Basic plugin template',
    'plugin_create.cli.template.pattern_match': 'Pattern matching plugin',
    'plugin_create.cli.template.async_await': 'Async/await test plugin',
    'plugin_create.cli.template.api_test': 'API test plugin',
    'plugin_create.cli.template.validation': 'Validation plugin',
    // Interactive Creator Messages
    'interactive.error.unknown_step': 'System error: Unknown step.',
    'interactive.error.generic': 'An error occurred. Please try again.',
    'interactive.generator.no_patterns': '// No patterns specified, check will not be executed',
    // Legacy Plugin Messages
    'legacy.plugin.compatibility_issues': 'Please resolve issues detected in legacy plugin',
    // Test Plugin Messages
    'test_completeness.suggestion.comprehensive': 'Please add comprehensive test cases including CRUD operations, error handling, edge cases, etc.',
    'test_completeness.action.add_cases': 'Add test cases',
    // Utility Messages
    'regex.error.global_flag_required': 'Regular expression with global flag (g) is required',
    'validation.error.invalid_plugin_code': 'Plugin code is invalid'
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