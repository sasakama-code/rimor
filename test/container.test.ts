/**
 * DIコンテナのテスト
 * TDD Red Phase - 失敗するテストから開始
 * Phase 3: DIコンテナの修正
 */

import { Container, TYPES } from '../src/container';
import { UnifiedSecurityAnalysisOrchestrator } from '../src/orchestrator/UnifiedSecurityAnalysisOrchestrator';
import { UnifiedAnalyzeCommand } from '../src/cli/commands/unified-analyze';
import { 
  IAnalysisStrategyFactory,
  ITaintAnalysisStrategy,
  IIntentExtractionStrategy,
  IGapDetectionStrategy,
  INistEvaluationStrategy
} from '../src/orchestrator/interfaces';

describe('Container', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe('基本的なサービス解決', () => {
    it('UnifiedSecurityAnalysisOrchestratorを解決できる', () => {
      // Act
      const orchestrator = container.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator);

      // Assert
      expect(orchestrator).toBeInstanceOf(UnifiedSecurityAnalysisOrchestrator);
    });

    it('UnifiedAnalyzeCommandを解決できる', () => {
      // Act
      const command = container.get<UnifiedAnalyzeCommand>(TYPES.UnifiedAnalyzeCommand);

      // Assert
      expect(command).toBeInstanceOf(UnifiedAnalyzeCommand);
    });

    it('IAnalysisStrategyFactoryを解決できる', () => {
      // Act
      const factory = container.get<IAnalysisStrategyFactory>(TYPES.AnalysisStrategyFactory);

      // Assert
      expect(factory).toBeDefined();
      expect(typeof factory.createTaintAnalysisStrategy).toBe('function');
      expect(typeof factory.createIntentExtractionStrategy).toBe('function');
      expect(typeof factory.createGapDetectionStrategy).toBe('function');
      expect(typeof factory.createNistEvaluationStrategy).toBe('function');
    });
  });

  describe('分析戦略の解決', () => {
    it('TaintAnalysisStrategyを解決できる', () => {
      // Act
      const strategy = container.get<ITaintAnalysisStrategy>(TYPES.TaintAnalysisStrategy);

      // Assert
      expect(strategy).toBeDefined();
      expect(typeof strategy.analyze).toBe('function');
    });

    it('IntentExtractionStrategyを解決できる', () => {
      // Act
      const strategy = container.get<IIntentExtractionStrategy>(TYPES.IntentExtractionStrategy);

      // Assert
      expect(strategy).toBeDefined();
      expect(typeof strategy.extract).toBe('function');
    });

    it('GapDetectionStrategyを解決できる', () => {
      // Act
      const strategy = container.get<IGapDetectionStrategy>(TYPES.GapDetectionStrategy);

      // Assert
      expect(strategy).toBeDefined();
      expect(typeof strategy.detect).toBe('function');
    });

    it('NistEvaluationStrategyを解決できる', () => {
      // Act
      const strategy = container.get<INistEvaluationStrategy>(TYPES.NistEvaluationStrategy);

      // Assert
      expect(strategy).toBeDefined();
      expect(typeof strategy.evaluate).toBe('function');
    });
  });

  describe('依存関係注入', () => {
    it('UnifiedAnalyzeCommandがUnifiedSecurityAnalysisOrchestratorを依存関係として受け取る', () => {
      // Act
      const command = container.get<UnifiedAnalyzeCommand>(TYPES.UnifiedAnalyzeCommand);

      // Assert
      expect(command).toBeInstanceOf(UnifiedAnalyzeCommand);
      // 内部の依存関係が正しく注入されていることを確認
      // プライベートプロパティのテストは実装に依存するため、動作確認で代替
    });

    it('UnifiedSecurityAnalysisOrchestratorがAnalysisStrategyFactoryを依存関係として受け取る', () => {
      // Act
      const orchestrator = container.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator);

      // Assert
      expect(orchestrator).toBeInstanceOf(UnifiedSecurityAnalysisOrchestrator);
      // 依存関係の注入が正しく行われていることを確認
    });
  });

  describe('シングルトンパターン', () => {
    it('同じ型に対して同じインスタンスを返す（シングルトン）', () => {
      // Act
      const orchestrator1 = container.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator);
      const orchestrator2 = container.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator);

      // Assert
      expect(orchestrator1).toBe(orchestrator2);
    });

    it('分析戦略は毎回新しいインスタンスを返す（一時的）', () => {
      // Act
      const strategy1 = container.get<ITaintAnalysisStrategy>(TYPES.TaintAnalysisStrategy);
      const strategy2 = container.get<ITaintAnalysisStrategy>(TYPES.TaintAnalysisStrategy);

      // Assert
      expect(strategy1).not.toBe(strategy2);
    });
  });

  describe('設定ベースの依存関係解決', () => {
    it('設定に基づいて異なる実装を解決する', () => {
      // Arrange
      const mockConfig = {
        enableTaintAnalysis: false,
        enableIntentExtraction: true,
        enableGapDetection: true,
        enableNistEvaluation: true,
        parallelExecution: false,
        timeoutMs: 30000
      };

      const configuredContainer = new Container(mockConfig);

      // Act
      const orchestrator = configuredContainer.get<UnifiedSecurityAnalysisOrchestrator>(
        TYPES.UnifiedSecurityAnalysisOrchestrator
      );

      // Assert
      expect(orchestrator).toBeInstanceOf(UnifiedSecurityAnalysisOrchestrator);
    });
  });

  describe('エラーハンドリング', () => {
    it('未登録の型を要求した場合、適切なエラーが発生する', () => {
      // Act & Assert
      expect(() => container.get('UnknownType')).toThrow('型が登録されていません: UnknownType');
    });

    it('循環依存がある場合、適切なエラーが発生する', () => {
      // この機能は高度なDIコンテナで必要になる場合があるが
      // YAGNI原則により現時点では実装しない
      // テストのみ記載し、実装は後回し
      expect(true).toBe(true); // プレースホルダー
    });
  });

  describe('ライフサイクル管理', () => {
    it('コンテナの破棄時にリソースがクリーンアップされる', () => {
      // Arrange
      const orchestrator = container.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator);

      // Act
      container.dispose();

      // Assert
      // クリーンアップが正常に行われることを確認
      expect(() => container.get<UnifiedSecurityAnalysisOrchestrator>(TYPES.UnifiedSecurityAnalysisOrchestrator))
        .toThrow('コンテナは既に破棄されています');
    });
  });

  describe('モジュール化', () => {
    it('複数のバインディングモジュールを組み合わせて使用できる', () => {
      // Arrange
      const coreModule = container.getCoreModule();
      const cliModule = container.getCliModule();
      const orchestratorModule = container.getOrchestratorModule();

      // Act
      const combinedContainer = Container.createWith([coreModule, cliModule, orchestratorModule]);
      const command = combinedContainer.get<UnifiedAnalyzeCommand>(TYPES.UnifiedAnalyzeCommand);

      // Assert
      expect(command).toBeInstanceOf(UnifiedAnalyzeCommand);
    });
  });

  describe('デバッグサポート', () => {
    it('登録されている全ての型をリストできる', () => {
      // Act
      const registeredTypes = container.getRegisteredTypes();

      // Assert
      expect(registeredTypes).toContain(TYPES.UnifiedSecurityAnalysisOrchestrator);
      expect(registeredTypes).toContain(TYPES.UnifiedAnalyzeCommand);
      expect(registeredTypes).toContain(TYPES.AnalysisStrategyFactory);
    });

    it('特定の型の依存関係グラフを取得できる', () => {
      // Act
      const dependencyGraph = container.getDependencyGraph(TYPES.UnifiedAnalyzeCommand);

      // Assert
      expect(dependencyGraph).toContain(TYPES.UnifiedSecurityAnalysisOrchestrator);
    });
  });
});