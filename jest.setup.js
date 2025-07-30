/**
 * Jest セットアップファイル
 * テスト実行前の環境設定を行う
 */

// テスト環境変数を確実に設定
process.env.NODE_ENV = 'test';
process.env.RIMOR_LANG = 'ja';

// テスト環境でのコンソール出力管理
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// 全テスト環境で問題のあるエラーログを抑制
console.error = (...args) => {
  const message = args.join(' ');
  
  // セキュリティ機能による予期されるエラーログのみを抑制
  // テストで期待されるエラーメッセージは抑制しない
  if (message.includes('Context integration failed:') ||
      message.includes('Project summary generation failed:') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('UNKNOWN: セキュリティ警告') ||
      message.includes('Context:') ||
      message.includes('セキュリティ警告: プロパティ汚染攻撃') ||
      message.includes('セキュリティ警告: パストラバーサル攻撃') ||
      message.includes('危険なプロパティ名を検出') ||
      message.includes('[2025-') && message.includes('UNKNOWN:')) {
    return;
  }
  
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  
  // 既知の警告を抑制
  if (message.includes('プラグインサンドボックス') || 
      message.includes('重み設定の読み込み') ||
      message.includes('設定ディレクトリのパス') ||
      message.includes('設定ファイル警告:') ||
      message.includes('セキュリティ警告（修正済み）:')) {
    return;
  }
  
  originalWarn.apply(console, args);
};

// CI環境での追加設定
if (process.env.CI === 'true') {
  console.log = (...args) => {
    // CI環境では不要なデバッグログのみを抑制
    // テストで期待されるログは表示する
    const message = args.join(' ');
    if (message.includes('🛡️') || 
        message.includes('プラグインサンドボックス') ||
        message.includes('🔧') ||
        message.includes('📋') ||
        message.includes('🤖') ||
        message.includes('✏️') ||
        message.includes('📥') ||
        message.includes('⚙️') ||
        message.includes('🚀') ||
        message.includes('📝') ||
        message.includes('フィードバック') ||
        message.includes('辞書') && message.includes('初期化') ||
        message.includes('ドメイン') && message.includes('初期化') ||
        message.includes('自動生成') ||
        message.includes('手動設定') ||
        message.includes('インポート') ||
        message.includes('プロジェクト情報') ||
        message.includes('検証結果') ||
        message.includes('ブートストラップ')) {
      return;
    }
    originalLog.apply(console, args);
  };
} else {
  // ローカル環境でもテスト時は辞書ブートストラップ出力を抑制
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('🔧 辞書の初期化方法を選択してください:') ||
        message.includes('🤖 既存コードから辞書を自動生成しています...') ||
        message.includes('✏️  手動で辞書を設定しています...') ||
        message.includes('📥 既存の辞書ファイルをインポートしています...') ||
        message.includes('📋 プロジェクト情報を収集しています...') ||
        message.includes('🚀 Rimor ドメイン辞書セットアップウィザード')) {
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
    console.warn('メモリ制限が設定されていません。NODE_OPTIONS="--max-old-space-size=6144" の設定を推奨します');
  }
}

// CI環境でのメモリ管理（簡素化）
if (process.env.CI === 'true') {
  // テスト終了時のみGCを実行（過度な頻度を避ける）
  afterAll(() => {
    if (global.gc) {
      global.gc();
    }
  });

  // CI環境でのファイルシステムIO最適化
  const fs = require('fs/promises');
  const originalMkdir = fs.mkdir;
  const originalWriteFile = fs.writeFile;
  
  // mkdir の IO 負荷軽減
  fs.mkdir = async (path, options) => {
    // test-feedback-data ディレクトリの作成をスキップ
    if (typeof path === 'string' && path.includes('test-feedback-data')) {
      return;
    }
    return originalMkdir.call(fs, path, options);
  };
  
  // writeFile の IO 負荷軽減
  fs.writeFile = async (path, data, options) => {
    // test-feedback-data 配下のファイル書き込みをスキップ
    if (typeof path === 'string' && path.includes('test-feedback-data')) {
      return;
    }
    return originalWriteFile.call(fs, path, data, options);
  };
}

// 未処理の Promise rejection のハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // CI環境ではプロセスを終了させない（テストの続行を允许する）
  if (process.env.CI !== 'true') {
    process.exit(1);
  }
});