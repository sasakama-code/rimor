/**
 * プラグインシステム統一エクスポート
 * 
 * 全てのプラグインを一箇所からインポートできるようにする
 * SOLID原則に従い、整理されたディレクトリ構造を反映
 */

// Base Plugins
export { BasePlugin } from './base/BasePlugin';
export { BaseSecurityPlugin } from './base/BaseSecurityPlugin';

// Core Plugins
export { TestExistencePlugin } from './core/TestExistencePlugin';
export { AssertionExistencePlugin } from './core/AssertionExistencePlugin';
export { AssertionQualityPlugin } from './core/AssertionQualityPlugin';
export { TestCompletenessPlugin } from './core/TestCompletenessPlugin';
export { TestStructurePlugin } from './core/TestStructurePlugin';

// Security Plugins
export { TaintAnalysisPlugin } from './security/TaintAnalysisPlugin';
export { SecurityTestPatternPlugin } from './security/SecurityTestPatternPlugin';

// Legacy exports (deprecated - 後方互換性のため維持)
export { TestExistencePlugin as TestExistencePluginLegacy } from './testExistence';
export { AssertionExistsPlugin, AssertionExistencePlugin as AssertionExistsPluginLegacy } from './assertionExists';

// Plugin type definitions
export type PluginType = 'core' | 'framework' | 'pattern' | 'domain' | 'security';

// Plugin registry helper
export const PLUGIN_REGISTRY = {
  core: [
    'TestExistencePlugin',
    'AssertionExistencePlugin',
    'AssertionQualityPlugin',
    'TestCompletenessPlugin',
    'TestStructurePlugin'
  ],
  security: [
    'TaintAnalysisPlugin',
    'SecurityTestPatternPlugin'
  ]
} as const;

// Plugin factory helper
export function createPlugin(pluginName: string, config?: Record<string, unknown>) {
  // 動的にプラグインをインポート・作成するヘルパー
  // 実際の使用時は各プラグインを直接インポートして使用することを推奨
  throw new Error(`Please import and instantiate ${pluginName} directly instead of using the factory.`);
}