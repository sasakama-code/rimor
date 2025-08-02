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

// Create the DI container
const container = new Container();

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !isProduction;

/**
 * Initialize the DI container with bindings
 */
function initializeContainer(): Container {
  // Clear existing bindings
  container.unbindAll();
  
  // Core service bindings
  bindCoreServices();
  
  // Environment-specific bindings
  if (isDevelopment) {
    bindDevelopmentServices();
  } else {
    bindProductionServices();
  }
  
  return container;
}

/**
 * Bind core services
 */
function bindCoreServices(): void {
  // Lazy load to avoid circular dependencies
  const { 
    AnalysisEngineImpl,
    SecurityAuditorImpl,
    StructuredReporterImpl,
    PluginManagerImpl
  } = require('../core/implementations');
  
  // Interfaces are types, not values - use import type syntax
  
  // Core service bindings
  container.bind<IAnalysisEngine>(TYPES.AnalysisEngine)
    .to(AnalysisEngineImpl)
    .inSingletonScope();
    
  container.bind<ISecurityAuditor>(TYPES.SecurityAuditor)
    .to(SecurityAuditorImpl)
    .inSingletonScope();
    
  container.bind<IReporter>(TYPES.Reporter)
    .to(StructuredReporterImpl)
    .inSingletonScope();
    
  container.bind<IPluginManager>(TYPES.PluginManager)
    .to(PluginManagerImpl)
    .inSingletonScope()
    .onActivation((context, pluginManager) => {
      // デフォルトプラグインを登録
      const TestExistencePlugin = require('../plugins/testExistence').TestExistencePlugin;
      const AssertionExistsPlugin = require('../plugins/assertionExists').AssertionExistsPlugin;
      const LegacyPluginAdapter = require('../core/implementations/LegacyPluginAdapter').LegacyPluginAdapter;
      
      // レガシープラグインをアダプター経由で登録
      pluginManager.register(new LegacyPluginAdapter(new TestExistencePlugin()));
      pluginManager.register(new LegacyPluginAdapter(new AssertionExistsPlugin()));
      
      return pluginManager;
    });
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