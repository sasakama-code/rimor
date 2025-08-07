/**
 * テストコンテナヘルパー
 * v0.9.0 - E2Eテストのコンテナ独立性確保
 * 
 * TDD Red→Green→Refactorサイクル
 * t_wada推奨のテスト駆動開発アプローチ
 * 
 * 設計原則:
 * - SOLID: 依存性逆転原則（DIコンテナ活用）
 * - KISS: シンプルなインターフェース
 * - Defensive Programming: 適切なエラーハンドリングとリソース管理
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../../src/container/types';
import type { IAnalysisEngine } from '../../src/core/interfaces/IAnalysisEngine';
import type { ISecurityAuditor } from '../../src/core/interfaces/ISecurityAuditor';
import type { IReporter } from '../../src/core/interfaces/IReporter';
import type { IPluginManager } from '../../src/core/interfaces/IPluginManager';

/**
 * テスト用コンテナ設定オプション
 */
export interface TestContainerOptions {
  /** デフォルトプラグインを登録するか */
  registerDefaultPlugins?: boolean;
  /** デバッグログを有効化するか */
  enableDebugLogging?: boolean;
  /** パフォーマンス監視を有効化するか */
  enablePerformanceMonitoring?: boolean;
}

/**
 * テスト用の新規コンテナを作成
 * 各テストケースで独立したコンテナを使用するため
 * 
 * @param options テストコンテナ設定オプション
 * @returns 新規作成されたコンテナ
 */
export function createTestContainer(options: TestContainerOptions = {}): Container {
  const {
    registerDefaultPlugins = true,
    enableDebugLogging = false,
    enablePerformanceMonitoring = false
  } = options;

  // 新規コンテナインスタンスを作成
  const container = new Container();
  
  // Core service bindingsを動的にロード
  const { 
    AnalysisEngineImpl,
    SecurityAuditorImpl,
    StructuredReporterImpl,
    PluginManagerImpl
  } = require('../../src/core/implementations');
  
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
      if (registerDefaultPlugins) {
        // デフォルトプラグインを登録
        const TestExistencePlugin = require('../../src/plugins/testExistence').TestExistencePlugin;
        const AssertionExistsPlugin = require('../../src/plugins/assertionExists').AssertionExistsPlugin;
        const LegacyPluginAdapter = require('../../src/core/implementations/LegacyPluginAdapter').LegacyPluginAdapter;
        
        // レガシープラグインをアダプター経由で登録
        pluginManager.register(new LegacyPluginAdapter(new TestExistencePlugin()));
        pluginManager.register(new LegacyPluginAdapter(new AssertionExistsPlugin()));
      }
      
      return pluginManager;
    });
  
  // テスト環境設定
  container.bind<boolean>('EnableDebugLogging').toConstantValue(enableDebugLogging);
  container.bind<boolean>('EnablePerformanceMonitoring').toConstantValue(enablePerformanceMonitoring);
  
  return container;
}

/**
 * テストコンテナのクリーンアップ
 * メモリリークを防ぐため、適切にリソースを解放
 * 
 * @param container クリーンアップ対象のコンテナ
 */
export function cleanupTestContainer(container: Container): void {
  if (!container) {
    return;
  }
  
  try {
    // 全バインディングを解除
    container.unbindAll();
    
    // コンテナが管理するシングルトンインスタンスをクリア
    // Inversifyの内部APIを使用（将来的に変更される可能性あり）
    const containerAny = container as any;
    if (containerAny._bindingDictionary) {
      containerAny._bindingDictionary._map.clear();
    }
    if (containerAny._activations) {
      containerAny._activations._map.clear();
    }
    if (containerAny._deactivations) {
      containerAny._deactivations._map.clear();
    }
    if (containerAny._middleware) {
      containerAny._middleware = null;
    }
  } catch (error) {
    // クリーンアップ中のエラーは警告のみ
    console.warn('Container cleanup warning:', error);
  }
}

/**
 * テスト用のモックプラグインマネージャーを取得
 * プラグインのテストで使用
 * 
 * @param container DIコンテナ
 * @returns モックプラグインマネージャー
 */
export function getMockPluginManager(container: Container): IPluginManager {
  return container.get<IPluginManager>(TYPES.PluginManager);
}

/**
 * テスト用の分析エンジンを取得
 * 統合テストで使用
 * 
 * @param container DIコンテナ
 * @returns 分析エンジン
 */
export function getTestAnalysisEngine(container: Container): IAnalysisEngine {
  return container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
}