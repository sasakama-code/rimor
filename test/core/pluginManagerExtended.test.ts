import { PluginManagerExtended } from '../../src/core/pluginManagerExtended';
import { LegacyPluginAdapter } from '../../src/plugins/migration/LegacyPluginAdapter';
import { 
  IPlugin, 
  ITestQualityPlugin, 
  Issue, 
  ProjectContext, 
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement
} from '../../src/core/types';

// テスト用のレガシープラグイン
class MockLegacyPlugin implements IPlugin {
  name = 'mock-legacy';
  async analyze(_filePath: string): Promise<Issue[]> {
    return [
      {
        type: 'test-issue',
        severity: 'error',
        message: 'Test issue from legacy plugin'
      }
    ];
  }
}

// テスト用の新しいプラグイン
class MockNewPlugin implements ITestQualityPlugin {
  id = 'mock-new-plugin';
  name = 'Mock New Plugin';
  version = '1.0.0';
  type = 'core' as const;

  isApplicable(_context: ProjectContext): boolean {
    return true;
  }

  async detectPatterns(_testFile: TestFile): Promise<DetectionResult[]> {
    return [
      {
        patternId: 'new-pattern',
        patternName: 'New Pattern',
        location: { file: 'test.ts', line: 1, column: 1, endLine: 1 },
        confidence: 0.9,
        evidence: [{ 
          type: 'code', 
          description: 'Test evidence',
          location: { file: 'test.ts', line: 1, column: 1 },
          code: 'test code',
          confidence: 0.9
        }]
      }
    ];
  }

  evaluateQuality(_patterns: DetectionResult[]): QualityScore {
    return {
      overall: 85,
      breakdown: {
        completeness: 85,
        correctness: 85,
        maintainability: 85
      },
      confidence: 0.9,
      metadata: { explanation: 'Good quality' }
    };
  }

  suggestImprovements(_evaluation: QualityScore): Improvement[] {
    return [
      {
        id: 'improvement-1',
        priority: 'medium',
        type: 'add',
        title: 'Add test',
        description: 'Add comprehensive test',
        location: { file: 'test.ts', line: 1, column: 1, endLine: 1 },
        estimatedImpact: { scoreImprovement: 10, effortMinutes: 20 },
        automatable: false
      }
    ];
  }
}

describe('PluginManagerExtended', () => {
  let manager: PluginManagerExtended;
  let mockProjectContext: ProjectContext;
  let mockTestFile: TestFile;

  beforeEach(() => {
    manager = new PluginManagerExtended();
    
    mockProjectContext = {
      rootPath: '/test/project',
      language: 'typescript',
      testFramework: 'jest',
      filePatterns: {
        test: ['**/*.test.ts'],
        source: ['**/*.ts'],
        ignore: ['**/node_modules/**']
      }
    };

    mockTestFile = {
      path: '/test/project/test.ts',
      content: 'test content',
      metadata: {
        framework: 'jest',
        language: 'typescript',
        lastModified: new Date()
      }
    };
  });

  it('should register and run new ITestQualityPlugin', async () => {
    const plugin = new MockNewPlugin();
    manager.registerQualityPlugin(plugin);

    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext);
    
    expect(result.pluginResults).toHaveLength(1);
    expect(result.pluginResults[0].pluginId).toBe('mock-new-plugin');
    expect(result.pluginResults[0].detectionResults).toHaveLength(1);
    expect(result.pluginResults[0].qualityScore.overall).toBe(85);
    expect(result.pluginResults[0].improvements).toHaveLength(1);
  });

  it('should register and run legacy IPlugin through adapter', async () => {
    const legacyPlugin = new MockLegacyPlugin();
    manager.registerLegacyPlugin(legacyPlugin);

    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext);
    
    expect(result.pluginResults).toHaveLength(1);
    expect(result.pluginResults[0].pluginId).toBe('legacy-adapter-mock-legacy');
    expect(result.pluginResults[0].detectionResults).toHaveLength(1);
    expect(result.pluginResults[0].detectionResults[0].patternId).toBe('legacy-issue-test-issue');
  });

  it('should run both legacy and new plugins together', async () => {
    const legacyPlugin = new MockLegacyPlugin();
    const newPlugin = new MockNewPlugin();
    
    manager.registerLegacyPlugin(legacyPlugin);
    manager.registerQualityPlugin(newPlugin);

    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext);
    
    expect(result.pluginResults).toHaveLength(2);
    
    const legacyResult = result.pluginResults.find(r => r.pluginId.includes('legacy'));
    const newResult = result.pluginResults.find(r => r.pluginId === 'mock-new-plugin');
    
    expect(legacyResult).toBeDefined();
    expect(newResult).toBeDefined();
  });

  it('should filter plugins by applicability', async () => {
    class NonApplicablePlugin implements ITestQualityPlugin {
      id = 'non-applicable';
      name = 'Non Applicable Plugin';
      version = '1.0.0';
      type = 'framework' as const;

      isApplicable(_context: ProjectContext): boolean {
        return false; // 適用不可
      }

      async detectPatterns(_testFile: TestFile): Promise<DetectionResult[]> {
        return [];
      }

      evaluateQuality(_patterns: DetectionResult[]): QualityScore {
        return {
          overall: 100,
          breakdown: { completeness: 50, correctness: 50, maintainability: 50 },
          confidence: 1.0,
          metadata: { explanation: 'Not applicable' }
        };
      }

      suggestImprovements(_evaluation: QualityScore): Improvement[] {
        return [];
      }
    }

    const applicablePlugin = new MockNewPlugin();
    const nonApplicablePlugin = new NonApplicablePlugin();
    
    manager.registerQualityPlugin(applicablePlugin);
    manager.registerQualityPlugin(nonApplicablePlugin);

    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext);
    
    // 適用可能なプラグインのみ実行される
    expect(result.pluginResults).toHaveLength(1);
    expect(result.pluginResults[0].pluginId).toBe('mock-new-plugin');
  });

  it('should handle plugin timeouts', async () => {
    class SlowPlugin implements ITestQualityPlugin {
      id = 'slow-plugin';
      name = 'Slow Plugin';
      version = '1.0.0';
      type = 'core' as const;

      isApplicable(_context: ProjectContext): boolean {
        return true;
      }

      async detectPatterns(_testFile: TestFile): Promise<DetectionResult[]> {
        // 長時間の処理をシミュレート
        await new Promise(resolve => setTimeout(resolve, 300));
        return [];
      }

      evaluateQuality(_patterns: DetectionResult[]): QualityScore {
        return {
          overall: 100,
          breakdown: { completeness: 50, correctness: 50, maintainability: 50 },
          confidence: 1.0,
          metadata: { explanation: 'Slow processing' }
        };
      }

      suggestImprovements(_evaluation: QualityScore): Improvement[] {
        return [];
      }
    }

    const slowPlugin = new SlowPlugin();
    manager.registerQualityPlugin(slowPlugin);
    
    // タイムアウト設定を短く設定
    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext, { timeout: 200 });
    
    // タイムアウトした場合はエラー結果が含まれる
    expect(result.pluginResults).toHaveLength(1);
    expect(result.pluginResults[0].error).toBeDefined();
    expect(result.pluginResults[0].error).toContain('timeout');
  });

  it('should handle plugin errors gracefully', async () => {
    class ErrorPlugin implements ITestQualityPlugin {
      id = 'error-plugin';
      name = 'Error Plugin';
      version = '1.0.0';
      type = 'core' as const;

      isApplicable(_context: ProjectContext): boolean {
        return true;
      }

      async detectPatterns(_testFile: TestFile): Promise<DetectionResult[]> {
        throw new Error('Plugin error');
      }

      evaluateQuality(_patterns: DetectionResult[]): QualityScore {
        return {
          overall: 0,
          breakdown: { completeness: 50, correctness: 50, maintainability: 50 },
          confidence: 0,
          metadata: { explanation: 'Error occurred' }
        };
      }

      suggestImprovements(_evaluation: QualityScore): Improvement[] {
        return [];
      }
    }

    const errorPlugin = new ErrorPlugin();
    manager.registerQualityPlugin(errorPlugin);

    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext);
    
    expect(result.pluginResults).toHaveLength(1);
    expect(result.pluginResults[0].error).toBeDefined();
    expect(result.pluginResults[0].error).toContain('Plugin error');
  });

  it('should provide execution statistics', async () => {
    const plugin = new MockNewPlugin();
    manager.registerQualityPlugin(plugin);

    const result = await manager.runQualityAnalysis(mockTestFile, mockProjectContext);
    
    expect(result.executionStats).toBeDefined();
    expect(result.executionStats.totalPlugins).toBe(1);
    expect(result.executionStats.successfulPlugins).toBe(1);
    expect(result.executionStats.failedPlugins).toBe(0);
    expect(result.executionStats.totalExecutionTime).toBeGreaterThanOrEqual(0);
  });

  it('should support backward compatibility with legacy runAll method', async () => {
    const legacyPlugin = new MockLegacyPlugin();
    manager.registerLegacyPlugin(legacyPlugin);

    // 既存のrunAllメソッドも動作する
    const issues = await manager.runAll('/test/path');
    
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('test-issue');
    expect(issues[0].message).toBe('Test issue from legacy plugin');
  });
});