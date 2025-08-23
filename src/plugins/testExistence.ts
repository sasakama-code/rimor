/**
 * @deprecated このファイルは非推奨です。代わりに './core/TestExistencePlugin' を使用してください。
 * This file is deprecated. Use './core/TestExistencePlugin' instead.
 * 
 * 後方互換性のために残されています。
 * Kept for backward compatibility.
 */

import { TestExistencePlugin } from './core/TestExistencePlugin';

// 非推奨警告を一度だけ表示
if (process.env.NODE_ENV !== 'test') {
  console.warn(
    '[DEPRECATION WARNING] testExistence.ts is deprecated. ' +
    'Please use TestExistencePlugin from "./core/TestExistencePlugin" instead.'
  );
}

export { TestExistencePlugin };
export default TestExistencePlugin;