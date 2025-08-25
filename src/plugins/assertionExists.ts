/**
 * @deprecated このファイルは非推奨です。代わりに './core/AssertionExistencePlugin' を使用してください。
 * This file is deprecated. Use './core/AssertionExistencePlugin' instead.
 * 
 * 後方互換性のために残されています。
 * Kept for backward compatibility.
 */

import { AssertionExistencePlugin } from './core/AssertionExistencePlugin';

// レガシー名のエイリアス（後方互換性のため）
export class AssertionExistsPlugin extends AssertionExistencePlugin {
  constructor() {
    super();
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[DEPRECATION WARNING] AssertionExistsPlugin is deprecated. ' +
        'Please use AssertionExistencePlugin from "./core/AssertionExistencePlugin" instead.'
      );
    }
  }
}

export { AssertionExistencePlugin };
export default AssertionExistencePlugin;