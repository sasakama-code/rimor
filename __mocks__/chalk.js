/**
 * chalk モック - Jest環境でのESモジュール問題回避
 * 再帰的プロキシによる完全メソッドチェーン対応
 */

// Chalkスタイルメソッド一覧
const colorMethods = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'gray', 'grey', 'black'];
const styleMethods = ['bold', 'dim', 'italic', 'underline', 'strikethrough', 'inverse', 'hidden'];
const bgMethods = ['bgRed', 'bgGreen', 'bgBlue', 'bgYellow', 'bgCyan', 'bgMagenta', 'bgWhite', 'bgBlack'];
const allMethods = [...colorMethods, ...styleMethods, ...bgMethods];

/**
 * 再帰的プロキシを作成してメソッドチェーン無限対応
 * @param {Function} baseFn - ベース関数（テキストを受け取る）
 * @param {Object} inheritedProps - 継承するプロパティ
 * @returns {Proxy} チェーン可能なプロキシオブジェクト
 */
function createChainableProxy(baseFn, inheritedProps = {}) {
  // 基本プロパティを設定
  const baseProps = {
    level: 1,
    enabled: true,
    supportsColor: { level: 1, hasBasic: true, has256: false, has16m: false },
    ...inheritedProps
  };
  
  return new Proxy(baseFn, {
    get(target, prop) {
      // 基本プロパティをチェック
      if (prop in baseProps) {
        return baseProps[prop];
      }
      
      // 既存のプロパティがある場合はそれを返す
      if (prop in target) {
        return target[prop];
      }
      
      // Chalkメソッドの場合は新しいチェーン可能なプロキシを返す（プロパティ継承）
      if (allMethods.includes(prop)) {
        return createChainableProxy((text) => text, baseProps);
      }
      
      // Symbol.toStringTag や inspect などの特殊プロパティ
      if (typeof prop === 'symbol' || prop === 'inspect' || prop === 'toString') {
        return target[prop];
      }
      
      // 不明なプロパティもチェーン可能にする（拡張性のため）
      return createChainableProxy((text) => text, baseProps);
    },
    
    apply(target, thisArg, argumentsList) {
      // 関数として呼ばれた場合はテキストをそのまま返す
      return argumentsList[0] || '';
    }
  });
}

// メインのchalkモック作成
const chalkMock = createChainableProxy((text) => text);

// 直接メソッドアクセスも対応
allMethods.forEach(method => {
  chalkMock[method] = createChainableProxy((text) => text);
});

// ES Modules と CommonJS 両方をサポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = chalkMock;
  module.exports.default = chalkMock;
} else {
  // ES Modules環境での対応
  global.chalkMock = chalkMock;
}