/**
 * 統合フロー用DIコンテナ
 * TDD Green Phase - テストを通す最小限の実装
 * Phase 3: DIコンテナの修正
 */

import { UnifiedSecurityAnalysisOrchestrator } from './orchestrator/UnifiedSecurityAnalysisOrchestrator';
import { UnifiedAnalyzeCommand } from './cli/commands/unified-analyze';
import { 
  IAnalysisStrategyFactory,
  ITaintAnalysisStrategy,
  IIntentExtractionStrategy,
  IGapDetectionStrategy,
  INistEvaluationStrategy
} from './orchestrator/interfaces';
import { MockAnalysisStrategyFactory } from './orchestrator/strategies/MockAnalysisStrategies';
import { RealAnalysisStrategyFactory } from './orchestrator/strategies/RealAnalysisStrategies';
import { OrchestratorConfig } from './orchestrator/types';
import { AnalysisEngineWrapper } from './core/implementations/AnalysisEngineWrapper';
import { PluginManagerWrapper } from './core/implementations/PluginManagerWrapper';
import { ReporterWrapper } from './core/implementations/ReporterWrapper';
import { SecurityAuditorWrapper } from './core/implementations/SecurityAuditorWrapper';
import { IAnalysisEngine } from './core/interfaces/IAnalysisEngine';
import { IPluginManager } from './core/interfaces/IPluginManager';
import { IReporter } from './core/interfaces/IReporter';
import { ISecurityAuditor } from './core/interfaces/ISecurityAuditor';
import { UnifiedPluginManager } from './core/UnifiedPluginManager';
import { TestQualityIntegrator } from './analyzers/coverage/TestQualityIntegrator';

// 型定義のシンボル
export const TYPES = {
  // オーケストレータ関連
  UnifiedSecurityAnalysisOrchestrator: Symbol('UnifiedSecurityAnalysisOrchestrator'),
  AnalysisStrategyFactory: Symbol('AnalysisStrategyFactory'),
  
  // 分析戦略
  TaintAnalysisStrategy: Symbol('TaintAnalysisStrategy'),
  IntentExtractionStrategy: Symbol('IntentExtractionStrategy'),
  GapDetectionStrategy: Symbol('GapDetectionStrategy'),
  NistEvaluationStrategy: Symbol('NistEvaluationStrategy'),
  
  // CLIコマンド
  UnifiedAnalyzeCommand: Symbol('UnifiedAnalyzeCommand'),
  
  // 既存のTYPES（互換性のため保持）
  AnalysisEngine: Symbol('AnalysisEngine'),
  SecurityAuditor: Symbol('SecurityAuditor'),
  Reporter: Symbol('Reporter'),
  PluginManager: Symbol('PluginManager'),
  UnifiedPluginManager: Symbol('UnifiedPluginManager'),
  TestQualityIntegrator: Symbol('TestQualityIntegrator'),
  ConfigService: Symbol('ConfigService'),
  FileSystem: Symbol('FileSystem'),
  Logger: Symbol('Logger'),
  Plugin: Symbol('Plugin'),
  PathResolver: Symbol('PathResolver'),
  CacheManager: Symbol('CacheManager')
} as const;

// サービスライフサイクル
enum ServiceLifetime {
  Singleton,
  Transient,
  Scoped
}

// サービス登録情報
interface ServiceBinding {
  factory: () => any;
  lifetime: ServiceLifetime;
  instance?: any;
}

/**
 * シンプルなDIコンテナ
 * YAGNI原則：現時点では必要最小限の機能のみ実装
 */
export class Container {
  private bindings = new Map<symbol | string, ServiceBinding>();
  private isDisposed = false;
  private config?: OrchestratorConfig;

  constructor(config?: OrchestratorConfig) {
    this.config = config;
    this.registerDefaultBindings();
  }

  /**
   * デフォルトのサービスバインディングを登録
   * KISS原則：シンプルなバインディング設定
   */
  private registerDefaultBindings(): void {
    // 分析戦略ファクトリー（シングルトン）
    // Phase 6: 実戦略に切り替え（Mock戦略から移行）
    this.bind(TYPES.AnalysisStrategyFactory)
      .to(() => new RealAnalysisStrategyFactory(this.config || this.getDefaultConfig()))
      .asSingleton();

    // Issue #83: UnifiedPluginManagerとTestQualityIntegratorをバインド
    this.bind(TYPES.UnifiedPluginManager)
      .to(() => {
        const unifiedPluginManager = new UnifiedPluginManager();
        // TestExistencePluginを品質プラグインとして登録
        const TestExistencePlugin = require('./plugins/core/TestExistencePlugin').TestExistencePlugin;
        unifiedPluginManager.registerQuality(new TestExistencePlugin());
        return unifiedPluginManager;
      })
      .asSingleton();

    this.bind(TYPES.TestQualityIntegrator)
      .to(() => new TestQualityIntegrator())
      .asSingleton();

    // 統合オーケストレータ（シングルトン）
    this.bind(TYPES.UnifiedSecurityAnalysisOrchestrator)
      .to(() => {
        const factory = this.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);
        const unifiedPluginManager = this.get<UnifiedPluginManager>(TYPES.UnifiedPluginManager);
        const testQualityIntegrator = this.get<TestQualityIntegrator>(TYPES.TestQualityIntegrator);
        return new UnifiedSecurityAnalysisOrchestrator(
          this.config, 
          factory, 
          undefined, // validator (デフォルトを使用)
          unifiedPluginManager,
          testQualityIntegrator
        );
      })
      .asSingleton();

    // 統合分析コマンド（シングルトン）
    this.bind(TYPES.UnifiedAnalyzeCommand)
      .to(() => {
        const orchestrator = this.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator);
        return new UnifiedAnalyzeCommand(orchestrator);
      })
      .asSingleton();

    // 分析戦略（一時的 - 毎回新しいインスタンス）
    this.bind(TYPES.TaintAnalysisStrategy)
      .to(() => {
        const factory = this.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);
        return factory.createTaintAnalysisStrategy();
      })
      .asTransient();

    this.bind(TYPES.IntentExtractionStrategy)
      .to(() => {
        const factory = this.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);
        return factory.createIntentExtractionStrategy();
      })
      .asTransient();

    this.bind(TYPES.GapDetectionStrategy)
      .to(() => {
        const factory = this.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);
        return factory.createGapDetectionStrategy();
      })
      .asTransient();

    this.bind(TYPES.NistEvaluationStrategy)
      .to(() => {
        const factory = this.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);
        return factory.createNistEvaluationStrategy();
      })
      .asTransient();

    // 既存コンポーネント（Phase 6: 共存対応）
    this.bind(TYPES.PluginManager)
      .to(() => new PluginManagerWrapper())
      .asSingleton();

    this.bind(TYPES.Reporter)
      .to(() => new ReporterWrapper())
      .asSingleton();

    this.bind(TYPES.AnalysisEngine)
      .to(() => {
        const pluginManager = this.get<IPluginManager>(TYPES.PluginManager);
        return new AnalysisEngineWrapper(pluginManager);
      })
      .asSingleton();

    this.bind(TYPES.SecurityAuditor)
      .to(() => new SecurityAuditorWrapper())
      .asSingleton();
  }

  /**
   * サービスバインディング
   * Fluent APIによる設定
   */
  bind(type: symbol | string): BindingBuilder {
    return new BindingBuilder(type, this.bindings);
  }

  /**
   * サービスバインディング解除
   * テストで使用される
   */
  unbind(type: symbol | string): void {
    this.validateContainerState();
    this.bindings.delete(type);
  }

  /**
   * サービス解決
   * 単一責任の原則：サービス取得の責務のみ担う
   * Defensive Programming: 堅牢なエラーハンドリング
   */
  get<T>(type: symbol | string): T {
    this.validateContainerState();
    this.validateTypeRegistration(type);

    const binding = this.bindings.get(type)!; // 既に検証済み
    
    try {
      return this.resolveService<T>(binding);
    } catch (error) {
      throw new ContainerResolutionError(
        `サービスの解決に失敗しました: ${type.toString()}`,
        type,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * コンテナ状態の検証
   * DRY原則: 検証ロジックの一元化
   */
  private validateContainerState(): void {
    if (this.isDisposed) {
      throw new ContainerStateError('コンテナは既に破棄されています');
    }
  }

  /**
   * 型登録の検証
   * DRY原則: 検証ロジックの一元化
   */
  private validateTypeRegistration(type: symbol | string): void {
    if (!this.bindings.has(type)) {
      const registeredTypes = this.getRegisteredTypes().map(t => t.toString()).join(', ');
      throw new ContainerRegistrationError(
        `型が登録されていません: ${type.toString()}\n登録済みの型: [${registeredTypes}]`
      );
    }
  }

  /**
   * サービス解決の実装
   * ライフサイクルに応じたインスタンス管理
   */
  private resolveService<T>(binding: ServiceBinding): T {
    switch (binding.lifetime) {
      case ServiceLifetime.Singleton:
        if (!binding.instance) {
          binding.instance = binding.factory();
        }
        return binding.instance as T;

      case ServiceLifetime.Transient:
        return binding.factory() as T;

      case ServiceLifetime.Scoped:
        // スコープドライフタイムは将来実装（YAGNI）
        return binding.factory() as T;

      default:
        throw new Error(`サポートされていないライフタイム: ${binding.lifetime}`);
    }
  }

  /**
   * コンテナの破棄
   * リソースクリーンアップ
   */
  dispose(): void {
    this.bindings.clear();
    this.isDisposed = true;
  }

  /**
   * 登録されている型のリスト取得
   * デバッグサポート機能
   */
  getRegisteredTypes(): (symbol | string)[] {
    return Array.from(this.bindings.keys());
  }

  /**
   * 依存関係グラフの取得
   * デバッグサポート機能（簡易実装）
   */
  getDependencyGraph(type: symbol | string): (symbol | string)[] {
    // 簡易実装：現時点では直接の依存関係のみ返す
    // 完全な依存関係グラフは将来実装（YAGNI）
    const dependencies: (symbol | string)[] = [];

    if (type === TYPES.UnifiedAnalyzeCommand) {
      dependencies.push(TYPES.UnifiedSecurityAnalysisOrchestrator);
    }

    if (type === TYPES.UnifiedSecurityAnalysisOrchestrator) {
      dependencies.push(TYPES.AnalysisStrategyFactory);
    }

    return dependencies;
  }

  /**
   * モジュール化サポート
   * モジュールパターンによる設定の分離
   */
  getCoreModule(): BindingModule {
    return {
      name: 'core',
      configure: (container: Container) => {
        container.bind(TYPES.AnalysisStrategyFactory)
          .to(() => new MockAnalysisStrategyFactory())
          .asSingleton();
      }
    };
  }

  getCliModule(): BindingModule {
    return {
      name: 'cli',
      configure: (container: Container) => {
        container.bind(TYPES.UnifiedAnalyzeCommand)
          .to(() => {
            const orchestrator = container.get<UnifiedSecurityAnalysisOrchestrator>(
              TYPES.UnifiedSecurityAnalysisOrchestrator
            );
            return new UnifiedAnalyzeCommand(orchestrator);
          })
          .asSingleton();
      }
    };
  }

  getOrchestratorModule(): BindingModule {
    return {
      name: 'orchestrator',
      configure: (container: Container) => {
        container.bind(TYPES.UnifiedSecurityAnalysisOrchestrator)
          .to(() => {
            const factory = container.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);
            return new UnifiedSecurityAnalysisOrchestrator(container.config, factory);
          })
          .asSingleton();
      }
    };
  }

  /**
   * 複数モジュールからのコンテナ作成
   * Module Patternによる設定の組み合わせ
   */
  static createWith(modules: BindingModule[]): Container {
    const container = new Container();
    
    // デフォルトバインディングをクリア
    container.bindings.clear();
    
    // モジュールを順次適用
    modules.forEach(module => {
      try {
        module.configure(container);
      } catch (error) {
        throw new Error(`モジュール '${module.name}' の設定中にエラーが発生しました: ${error}`);
      }
    });
    
    return container;
  }

  /**
   * デフォルト設定取得
   * Phase 5: 実戦略で使用する設定を提供
   */
  private getDefaultConfig(): OrchestratorConfig {
    return {
      enableTaintAnalysis: true,
      enableIntentExtraction: true,
      enableGapDetection: true,
      enableNistEvaluation: true,
      parallelExecution: false,
      timeoutMs: 30000
    };
  }
}

/**
 * バインディング設定用のビルダークラス
 * Fluent APIパターンの実装
 */
class BindingBuilder {
  constructor(
    private type: symbol | string,
    private bindings: Map<symbol | string, ServiceBinding>
  ) {}

  to(factory: () => any): LifetimeBuilder {
    return new LifetimeBuilder(this.type, factory, this.bindings);
  }

  /**
   * 定数値にバインド（inversify互換性のため）
   * テストでよく使用されるパターン
   */
  toConstantValue(value: any): void {
    this.bindings.set(this.type, {
      factory: () => value,
      lifetime: ServiceLifetime.Singleton,
      instance: value
    });
  }
}

/**
 * ライフタイム設定用のビルダークラス
 */
class LifetimeBuilder {
  constructor(
    private type: symbol | string,
    private factory: () => any,
    private bindings: Map<symbol | string, ServiceBinding>
  ) {}

  asSingleton(): void {
    this.bindings.set(this.type, {
      factory: this.factory,
      lifetime: ServiceLifetime.Singleton
    });
  }

  asTransient(): void {
    this.bindings.set(this.type, {
      factory: this.factory,
      lifetime: ServiceLifetime.Transient
    });
  }

  asScoped(): void {
    this.bindings.set(this.type, {
      factory: this.factory,
      lifetime: ServiceLifetime.Scoped
    });
  }
}

/**
 * バインディングモジュールインターフェース
 * Module Patternによる設定の抽象化
 */
interface BindingModule {
  name: string;
  configure(container: Container): void;
}

/**
 * コンテナ関連エラークラス群
 * 異なるエラータイプを明確に区別
 */
class ContainerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ContainerStateError extends ContainerError {}
class ContainerRegistrationError extends ContainerError {}
class ContainerResolutionError extends ContainerError {
  constructor(message: string, public readonly type: symbol | string, public readonly cause: Error) {
    super(message);
  }
}

// デフォルトコンテナインスタンス（互換性のため）
export const container = new Container();

// エラークラスのエクスポート
export { ContainerError, ContainerStateError, ContainerRegistrationError, ContainerResolutionError };

/**
 * コンテナ初期化関数
 * Phase 5: ビルドエラー修正のためのエクスポート
 */
export function initializeContainer(config?: OrchestratorConfig): Container {
  return new Container(config);
}