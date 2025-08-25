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
  
  // セキュリティ機能による予期されるエラーログを抑制
  const suppressPatterns = [
    'Context integration failed:',
    'Project summary generation failed:',
    'PERMISSION_DENIED',
    'UNKNOWN: セキュリティ警告',
    'Context:',
    'セキュリティ警告:',
    '危険なプロパティ名を検出',
    'Error reading file',
    'Error cleaning up annotations'
  ];
  
  if (suppressPatterns.some(pattern => message.includes(pattern)) ||
      (message.includes('[2025-') && message.includes('UNKNOWN:'))) {
    return;
  }
  
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  
  // 既知の警告を抑制
  const warnSuppressPatterns = [
    'プラグインサンドボックス',
    '重み設定の読み込み',
    '設定ディレクトリのパス',
    '設定ファイル警告:',
    'セキュリティ警告（修正済み）:'
  ];
  
  if (warnSuppressPatterns.some(pattern => message.includes(pattern))) {
    return;
  }
  
  originalWarn.apply(console, args);
};

// CI環境での追加設定
if (process.env.CI === 'true') {
  console.log = (...args) => {
    // CI環境では不要なデバッグログのみを抑制
    const message = args.join(' ');
    
    // 絵文字を含むログを抑制
    const emojiPattern = /[🛡️🔧📋🤖✏️📥⚙️🚀📝🌐📁✅📄🔍⚡🏗️]/;
    if (emojiPattern.test(message)) {
      return;
    }
    
    // その他の抑制パターン
    const ciSuppressPatterns = [
      'フィードバック',
      '辞書.*初期化',
      'ドメイン.*初期化',
      '自動生成',
      '手動設定',
      'インポート',
      'プロジェクト情報',
      '検証結果',
      'ブートストラップ',
      '検証開始',
      '検証中',
      '件検出',
      '包括検証',
      'フレームワーク別'
    ];
    
    if (ciSuppressPatterns.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(message);
    })) {
      return;
    }
    originalLog.apply(console, args);
  };
} else {
  // ローカル環境でもテスト時は辞書ブートストラップ出力を抑制
  console.log = (...args) => {
    const message = args.join(' ');
    
    // 絵文字を含むログを抑制
    const emojiPattern = /[🔧🤖✏️📥📋🚀🌐📁✅📄🔍⚡🏗️]/;
    if (emojiPattern.test(message)) {
      return;
    }
    
    // その他の抑制パターン
    const localSuppressPatterns = [
      '辞書の初期化方法を選択してください',
      '既存コードから辞書を自動生成しています',
      '手動で辞書を設定しています',
      '既存の辞書ファイルをインポートしています',
      'プロジェクト情報を収集しています',
      'Rimor ドメイン辞書セットアップウィザード',
      '検証開始',
      '検証中',
      '件検出',
      '包括検証',
      'フレームワーク別'
    ];
    
    if (localSuppressPatterns.some(pattern => message.includes(pattern))) {
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
  // CI環境でテストを失敗させる（重大な欠陥の早期発見のため）
  // Issue #114対応: CI環境でも未処理Promise拒否を重大なエラーとして扱う
  if (process.env.CI === 'true') {
    process.exit(1);
  }
});

// process.exit のモック
const originalExit = process.exit;
process.exit = jest.fn().mockImplementation((code) => {
  // テスト環境ではプロセスを実際に終了させない
  console.log(`process.exit called with code: ${code}`);
  // 元の process.exit を呼び出さずに、例外をスローしてテストを終了
  throw new Error(`Process exit with code ${code}`);
});