/**
 * Dependency Injection コンテナ設定
 * v0.8.0 - Inversifyを使用した簡素化されたDIコンテナ
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import type { IAnalysisEngine } from '../core/interfaces/IAnalysisEngine';
import type { ISecurityAuditor } from '../core/interfaces/ISecurityAuditor';
import type { IReporter } from '../core/interfaces/IReporter';
import type { IPluginManager } from '../core/interfaces/IPluginManager';
import { UnifiedPluginManager } from '../core/UnifiedPluginManager';

// Create the DI container
const container = new Container();

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !isProduction;

/**
 * Initialize the DI container with bindings
 */
function initializeContainer(): Container {
  console.log('🔧 Initializing DI Container...');

  try {
    // Clear existing bindings
    container.unbindAll();
    console.log('🗑️  Existing bindings cleared');

    // Core service bindings
    console.log('📋 About to bind core services...');
    bindCoreServices();
    console.log('✅ Core services bound successfully');

    // Environment-specific bindings
    if (isDevelopment) {
      bindDevelopmentServices();
    } else {
      bindProductionServices();
    }

    console.log(
      `✅ DI Container initialized. Environment: ${isDevelopment ? 'development' : 'production'}`
    );
    console.log(`📋 Container ready`);

    return container;
  } catch (error) {
    console.error('❌ Error during DI container initialization:', error);
    throw error;
  }
}

/**
 * Bind core services
 */
function bindCoreServices(): void {
  console.log('🔌 Binding core services...');

  try {
    // Lazy load to avoid circular dependencies
    console.log('📦 Loading implementation classes...');
    const {
      AnalysisEngine,
      SecurityAuditor,
      StructuredReporter,
      PluginManager,
    } = require('../core/implementations');

    const { UnifiedAnalysisEngine } = require('../core/engine');
    console.log('📦 Loaded implementation classes successfully');

    // Issue #81対応: UnifiedPluginManagerを最初に登録
    console.log('🎯 Binding UnifiedPluginManager...');
    container
      .bind<UnifiedPluginManager>(TYPES.UnifiedPluginManager)
      .to(UnifiedPluginManager)
      .inSingletonScope()
      .onActivation((context, unifiedPluginManager) => {
        console.log('🎯 Initializing UnifiedPluginManager with quality plugins');
        try {
          // TestExistencePluginを品質プラグインとして登録
          const TestExistencePlugin =
            require('../plugins/core/TestExistencePlugin').TestExistencePlugin;

          // 品質プラグインとして直接登録（カバレッジ統合機能を有効化）
          unifiedPluginManager.registerQuality(new TestExistencePlugin());

          console.log(
            `✅ UnifiedPluginManager initialized with ${unifiedPluginManager.getQualityPlugins().length} quality plugins`
          );
        } catch (pluginError) {
          console.error('❌ Error initializing UnifiedPluginManager plugins:', pluginError);
        }

        return unifiedPluginManager;
      });
    console.log('✅ UnifiedPluginManager bound successfully');

    // UnifiedAnalysisEngineを登録
    console.log('⚡ Binding UnifiedAnalysisEngine...');
    container.bind<any>(TYPES.UnifiedAnalysisEngine).to(UnifiedAnalysisEngine).inSingletonScope();
    console.log('✅ UnifiedAnalysisEngine bound successfully');

    // Core service bindings
    console.log('🎛️  Binding AnalysisEngine...');
    container.bind<IAnalysisEngine>(TYPES.AnalysisEngine).to(AnalysisEngine).inSingletonScope();
    console.log('✅ AnalysisEngine bound successfully');

    console.log('🔐 Binding SecurityAuditor...');
    container.bind<ISecurityAuditor>(TYPES.SecurityAuditor).to(SecurityAuditor).inSingletonScope();
    console.log('✅ SecurityAuditor bound successfully');

    console.log('📋 Binding Reporter...');
    container.bind<IReporter>(TYPES.Reporter).to(StructuredReporter).inSingletonScope();
    console.log('✅ Reporter bound successfully');

    console.log('🔌 Binding PluginManager...');
    container
      .bind<IPluginManager>(TYPES.PluginManager)
      .to(PluginManager)
      .inSingletonScope()
      .onActivation((context, pluginManager) => {
        console.log('🔌 Initializing PluginManager with legacy plugins');
        try {
          // レガシープラグインを登録
          const AssertionExistsPlugin = require('../plugins/assertionExists').AssertionExistsPlugin;
          const LegacyPluginAdapter =
            require('../core/implementations/LegacyPluginAdapter').LegacyPluginAdapter;

          // レガシーAssertionExistsPluginを登録
          pluginManager.register(new LegacyPluginAdapter(new AssertionExistsPlugin()));

          console.log(
            `✅ PluginManager initialized with ${pluginManager.getPlugins().length} plugins`
          );
        } catch (pluginError) {
          console.error('❌ Error initializing PluginManager plugins:', pluginError);
        }

        return pluginManager;
      });
    console.log('✅ PluginManager bound successfully');
  } catch (error) {
    console.error('❌ Error in bindCoreServices:', error);
    throw error;
  }
}

/**
 * Development-specific bindings
 */
function bindDevelopmentServices(): void {
  // Development環境では詳細なログ出力を有効化
  container.bind<boolean>('EnableDebugLogging').toConstantValue(true);
  container.bind<boolean>('EnablePerformanceMonitoring').toConstantValue(true);
}

/**
 * Production-specific bindings
 */
function bindProductionServices(): void {
  // Production環境では最適化を重視
  container.bind<boolean>('EnableDebugLogging').toConstantValue(false);
  container.bind<boolean>('EnablePerformanceMonitoring').toConstantValue(false);
}

// Export configured container
export { container, initializeContainer, TYPES };
