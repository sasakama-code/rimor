/**
 * コンテナ独立性テスト
 * v0.9.0 - E2Eテストのコンテナ独立性検証
 * 
 * TDD Red Phase: 失敗するテストを先に書く
 * t_wada推奨のテスト駆動開発アプローチ
 * 
 * 設計原則:
 * - SOLID: 単一責任原則（コンテナ独立性の検証に特化）
 * - KISS: シンプルで理解しやすいテスト
 * - Defensive Programming: エッジケースの検証
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { 
  createTestContainer, 
  cleanupTestContainer,
  getMockPluginManager,
  getTestAnalysisEngine
} from '../helpers/test-container';
import { TYPES } from '../../src/container/types';
import type { IPluginManager } from '../../src/core/interfaces/IPluginManager';
import type { IAnalysisEngine } from '../../src/core/interfaces/IAnalysisEngine';
import { IPlugin, PluginMetadata } from '../../src/core/interfaces';
import { Issue } from '../../src/core/types';

// テスト用のモックプラグイン
class TestPlugin implements IPlugin {
  metadata: PluginMetadata;
  
  constructor(id: string) {
    this.metadata = {
      id,
      name: `Test Plugin ${id}`,
      version: '1.0.0',
      enabled: true
    };
  }
  
  async analyze(filePath: string): Promise<Issue[]> {
    return [];
  }
}

describe('Container Isolation Tests', () => {
  let container1: Container;
  let container2: Container;
  
  afterEach(() => {
    // 各テスト後にコンテナをクリーンアップ
    if (container1) {
      cleanupTestContainer(container1);
    }
    if (container2) {
      cleanupTestContainer(container2);
    }
  });
  
  describe('コンテナの独立性', () => {
    it('各テストは独立したコンテナインスタンスを持つべき', () => {
      // Arrange
      container1 = createTestContainer();
      container2 = createTestContainer();
      
      // Assert
      expect(container1).not.toBe(container2);
      expect(container1).toBeInstanceOf(Container);
      expect(container2).toBeInstanceOf(Container);
    });
    
    it('コンテナごとに独立したサービスインスタンスが作成されるべき', () => {
      // Arrange
      container1 = createTestContainer();
      container2 = createTestContainer();
      
      // Act
      const engine1 = getTestAnalysisEngine(container1);
      const engine2 = getTestAnalysisEngine(container2);
      
      // Assert
      expect(engine1).not.toBe(engine2);
      expect(engine1).toBeDefined();
      expect(engine2).toBeDefined();
    });
    
    it('一つのコンテナでのプラグイン登録が他のコンテナに影響しないべき', () => {
      // Arrange
      container1 = createTestContainer({ registerDefaultPlugins: false });
      container2 = createTestContainer({ registerDefaultPlugins: false });
      
      const pluginManager1 = getMockPluginManager(container1);
      const pluginManager2 = getMockPluginManager(container2);
      
      const testPlugin = new TestPlugin('test-plugin-1');
      
      // Act
      pluginManager1.register(testPlugin);
      
      // Assert
      const plugins1 = pluginManager1.getPlugins();
      const plugins2 = pluginManager2.getPlugins();
      
      expect(plugins1.length).toBe(1);
      expect(plugins2.length).toBe(0);
      expect(plugins1[0].metadata.id).toBe('test-plugin-1');
    });
  });
  
  describe('シングルトンサービスの管理', () => {
    it('同じコンテナ内ではシングルトンが保持されるべき', () => {
      // Arrange
      container1 = createTestContainer();
      
      // Act
      const engine1 = container1.get<IAnalysisEngine>(TYPES.AnalysisEngine);
      const engine2 = container1.get<IAnalysisEngine>(TYPES.AnalysisEngine);
      
      // Assert
      expect(engine1).toBe(engine2);
    });
    
    it('cleanupTestContainer後は新しいインスタンスが作成されるべき', () => {
      // Arrange
      container1 = createTestContainer();
      const engineBefore = getTestAnalysisEngine(container1);
      
      // Act
      cleanupTestContainer(container1);
      container1 = createTestContainer();
      const engineAfter = getTestAnalysisEngine(container1);
      
      // Assert
      expect(engineBefore).not.toBe(engineAfter);
    });
    
    it('cleanupTestContainer呼び出しはエラーを投げないべき', () => {
      // Arrange
      container1 = createTestContainer();
      
      // Act & Assert
      expect(() => cleanupTestContainer(container1)).not.toThrow();
    });
  });
  
  describe('設定オプション', () => {
    it('デフォルトプラグインの登録を制御できるべき', () => {
      // Arrange & Act
      const containerWithPlugins = createTestContainer({ registerDefaultPlugins: true });
      const containerWithoutPlugins = createTestContainer({ registerDefaultPlugins: false });
      
      const pluginManagerWith = getMockPluginManager(containerWithPlugins);
      const pluginManagerWithout = getMockPluginManager(containerWithoutPlugins);
      
      // Assert
      expect(pluginManagerWith.getPlugins().length).toBeGreaterThan(0);
      expect(pluginManagerWithout.getPlugins().length).toBe(0);
      
      // Cleanup
      cleanupTestContainer(containerWithPlugins);
      cleanupTestContainer(containerWithoutPlugins);
    });
    
    it('デバッグログ設定が独立して管理されるべき', () => {
      // Arrange
      container1 = createTestContainer({ enableDebugLogging: true });
      container2 = createTestContainer({ enableDebugLogging: false });
      
      // Act
      const debug1 = container1.get<boolean>('EnableDebugLogging');
      const debug2 = container2.get<boolean>('EnableDebugLogging');
      
      // Assert
      expect(debug1).toBe(true);
      expect(debug2).toBe(false);
    });
  });
  
  describe('エラーハンドリング', () => {
    it('nullコンテナのクリーンアップでエラーが発生しないべき', () => {
      // Arrange & Act & Assert
      expect(() => cleanupTestContainer(null as any)).not.toThrow();
    });
    
    it('複数回のクリーンアップが安全に実行できるべき', () => {
      // Arrange
      container1 = createTestContainer();
      
      // Act & Assert - 複数回クリーンアップしてもエラーが出ない
      expect(() => {
        cleanupTestContainer(container1);
        cleanupTestContainer(container1);
        cleanupTestContainer(container1);
      }).not.toThrow();
    });
  });
  
  describe('メモリリーク防止', () => {
    it('複数のコンテナ作成と破棄が安全に実行できるべき', () => {
      // Arrange
      const containers: Container[] = [];
      
      // Act - 複数のコンテナを作成
      for (let i = 0; i < 10; i++) {
        const container = createTestContainer();
        containers.push(container);
      }
      
      // Assert - 全てのコンテナが正常に動作
      containers.forEach((container, index) => {
        const engine = getTestAnalysisEngine(container);
        expect(engine).toBeDefined();
      });
      
      // Cleanup - 全てのコンテナをクリーンアップ
      containers.forEach(container => {
        cleanupTestContainer(container);
      });
      
      // Assert - 全コンテナがクリーンアップされた
      expect(containers.length).toBe(10);
    });
  });
});