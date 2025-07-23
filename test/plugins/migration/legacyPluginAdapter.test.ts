import { LegacyPluginAdapter } from '../../../src/plugins/migration/LegacyPluginAdapter';
import { IPlugin, Issue, ProjectContext, TestFile } from '../../../src/core/types';

// テスト用のレガシープラグイン
class MockLegacyPlugin implements IPlugin {
  name = 'mock-legacy-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    if (filePath.includes('error.ts')) {
      return [
        {
          type: 'missing-test',
          severity: 'error',
          message: 'テストファイルが存在しません',
          line: 1,
          file: filePath
        }
      ];
    }
    
    if (filePath.includes('warning.ts')) {
      return [
        {
          type: 'missing-assertion',
          severity: 'warning', 
          message: 'アサーションが不足しています'
        }
      ];
    }
    
    return [];
  }
}

describe('LegacyPluginAdapter', () => {
  let legacyPlugin: IPlugin;
  let adapter: LegacyPluginAdapter;
  let mockProjectContext: ProjectContext;
  let mockTestFile: TestFile;

  beforeEach(() => {
    legacyPlugin = new MockLegacyPlugin();
    adapter = new LegacyPluginAdapter(legacyPlugin);
    
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
      path: '/test/project/src/test.ts',
      content: 'test content',
      metadata: {
        framework: 'jest',
        language: 'typescript',
        lastModified: new Date()
      }
    };
  });

  it('should implement ITestQualityPlugin interface', () => {
    expect(adapter.id).toBe('legacy-adapter-mock-legacy-plugin');
    expect(adapter.name).toBe('Legacy Adapter: mock-legacy-plugin');
    expect(adapter.version).toBe('1.0.0');
    expect(adapter.type).toBe('core');
  });

  it('should always return true for isApplicable', () => {
    expect(adapter.isApplicable(mockProjectContext)).toBe(true);
  });

  it('should convert legacy plugin issues to detection results', async () => {
    const errorTestFile = { ...mockTestFile, path: '/test/project/error.ts' };
    const patterns = await adapter.detectPatterns(errorTestFile);
    
    expect(patterns).toHaveLength(1);
    expect(patterns[0].patternId).toBe('legacy-issue-missing-test');
    expect(patterns[0].patternName).toBe('Legacy Issue: missing-test');
    expect(patterns[0].confidence).toBe(0.7);
    expect(patterns[0].evidence).toHaveLength(1);
    expect(patterns[0].evidence[0].type).toBe('code');
    expect(patterns[0].evidence[0].description).toContain('テストファイルが存在しません');
  });

  it('should handle empty results from legacy plugin', async () => {
    const normalTestFile = { ...mockTestFile, path: '/test/project/normal.ts' };
    const patterns = await adapter.detectPatterns(normalTestFile);
    
    expect(patterns).toHaveLength(0);
  });

  it('should evaluate quality based on number of issues', () => {
    // エラー1個のパターン
    const errorPatterns = [
      {
        patternId: 'legacy-issue-missing-test',
        patternName: 'Legacy Issue: missing-test',
        location: { file: 'test.ts', line: 1, column: 1, endLine: 1 },
        confidence: 0.7,
        evidence: []
      }
    ];
    
    const errorQuality = adapter.evaluateQuality(errorPatterns);
    expect(errorQuality.overall).toBe(80); // 100 - (1 * 20)
    expect(errorQuality.confidence).toBe(0.7);

    // 問題なしのパターン
    const noIssueQuality = adapter.evaluateQuality([]);
    expect(noIssueQuality.overall).toBe(100);
    expect(noIssueQuality.confidence).toBe(1.0);
  });

  it('should suggest basic improvements based on issues', () => {
    const mockQuality = {
      overall: 80,
      breakdown: {
        completeness: 80,
        correctness: 60,
        maintainability: 80
      },
      confidence: 0.7
    };

    const improvements = adapter.suggestImprovements(mockQuality);
    expect(improvements).toHaveLength(1);
    expect(improvements[0].id).toBe('legacy-improvement');
    expect(improvements[0].priority).toBe('medium');
    expect(improvements[0].type).toBe('add');
    expect(improvements[0].title).toBe('Legacy plugin compatibility issues');
    expect(improvements[0].description).toContain('レガシープラグインで検出された問題');
    expect(improvements[0].automatable).toBe(false);
  });

  it('should handle errors from legacy plugin gracefully', async () => {
    const errorPlugin: IPlugin = {
      name: 'error-plugin',
      async analyze(_filePath: string): Promise<Issue[]> {
        throw new Error('Legacy plugin error');
      }
    };

    const errorAdapter = new LegacyPluginAdapter(errorPlugin);
    const patterns = await errorAdapter.detectPatterns(mockTestFile);
    
    expect(patterns).toHaveLength(0); // エラーの場合は空配列を返す
  });

  it('should handle issues without line numbers', async () => {
    const warningTestFile = { ...mockTestFile, path: '/test/project/warning.ts' };
    const patterns = await adapter.detectPatterns(warningTestFile);
    
    expect(patterns).toHaveLength(1);
    expect(patterns[0].location.line).toBe(1); // デフォルト値
    expect(patterns[0].location.endLine).toBe(undefined);
  });

  it('should calculate severity-based confidence', async () => {
    const errorTestFile = { ...mockTestFile, path: '/test/project/error.ts' };
    const warningTestFile = { ...mockTestFile, path: '/test/project/warning.ts' };
    
    const errorPatterns = await adapter.detectPatterns(errorTestFile);
    const warningPatterns = await adapter.detectPatterns(warningTestFile);
    
    // エラーの方が信頼度が高い
    expect(errorPatterns[0].confidence).toBeGreaterThan(warningPatterns[0].confidence);
  });

  it('should provide legacy plugin information in metadata', async () => {
    const errorTestFile = { ...mockTestFile, path: '/test/project/error.ts' };
    const patterns = await adapter.detectPatterns(errorTestFile);
    
    expect(patterns[0].metadata).toBeDefined();
    expect(patterns[0].metadata?.legacyPlugin).toBe('mock-legacy-plugin');
    expect(patterns[0].metadata?.originalIssue).toBeDefined();
  });
});