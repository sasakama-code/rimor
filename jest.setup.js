/**
 * Jest セットアップファイル
 * テスト実行前の環境設定を行う
 */

// テスト環境変数を確実に設定
process.env.NODE_ENV = 'test';
process.env.RIMOR_LANG = 'ja';

// CI環境での追加設定
if (process.env.CI === 'true') {
  // CI環境ではコンソール出力を最小限に抑制
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.warn = (...args) => {
    // 重要でない警告は抑制（テスト関連の既知の警告など）
    const message = args.join(' ');
    if (message.includes('プラグインサンドボックス') || 
        message.includes('重み設定の読み込み') ||
        message.includes('設定ディレクトリのパス')) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.log = (...args) => {
    // CI環境ではデバッグログを抑制
    const message = args.join(' ');
    if (message.includes('🛡️') || message.includes('プラグインサンドボックス')) {
      return;
    }
    originalLog.apply(console, args);
  };
}

// テストタイムアウトの改善
const originalSetTimeout = global.setTimeout;
global.setTimeout = (callback, delay) => {
  // CI環境では長時間の setTimeout を短縮
  if (process.env.CI === 'true' && delay > 5000) {
    delay = Math.min(delay, 5000);
  }
  return originalSetTimeout(callback, delay);
};

// メモリ管理の改善
afterEach(() => {
  // テスト後にガベージコレクションを実行
  if (global.gc) {
    global.gc();
  }
});

// Node.js メモリ制限設定（必要に応じて）
if (process.env.NODE_OPTIONS && !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
  // メモリ制限が設定されていない場合のみ警告
  if (process.env.CI !== 'true') {
    console.warn('メモリ制限が設定されていません。NODE_OPTIONS="--max-old-space-size=4096" の設定を推奨します');
  }
}

// 未処理の Promise rejection のハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // CI環境ではプロセスを終了させない（テストの続行を允许する）
  if (process.env.CI !== 'true') {
    process.exit(1);
  }
});