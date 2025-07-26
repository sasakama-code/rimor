/**
 * chalk モック - Jest環境でのESモジュール問題回避
 */

// 基本的なstyleチェーンをシミュレート
const mockChain = (text) => text;

// chalk メソッドをモック化
const chalkMock = (text) => text;

// 基本的なカラー・スタイルメソッドを追加
['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'gray', 'grey', 'black'].forEach(color => {
  chalkMock[color] = mockChain;
});

['bold', 'dim', 'italic', 'underline', 'strikethrough', 'inverse', 'hidden'].forEach(style => {
  chalkMock[style] = mockChain;
});

// 背景色
['bgRed', 'bgGreen', 'bgBlue', 'bgYellow', 'bgCyan', 'bgMagenta', 'bgWhite', 'bgBlack'].forEach(bg => {
  chalkMock[bg] = mockChain;
});

// チェーンサポート（メソッドチェーンを可能にする）
Object.keys(chalkMock).forEach(key => {
  if (typeof chalkMock[key] === 'function') {
    Object.keys(chalkMock).forEach(subKey => {
      chalkMock[key][subKey] = mockChain;
    });
  }
});

// ES Modules と CommonJS 両方をサポート
module.exports = chalkMock;
module.exports.default = chalkMock;