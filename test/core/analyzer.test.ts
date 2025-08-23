import { UnifiedAnalysisEngine } from '../../src/core/UnifiedAnalysisEngine';
import { IPlugin, Issue } from '../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

class MockPlugin implements IPlugin {
  constructor(public name: string, private shouldFindIssue: boolean = true) {}
  
  async analyze(filePath: string): Promise<Issue[]> {
    if (this.shouldFindIssue && !filePath.includes('.test.')) {
      return [{
        id: 'test-missing-id',
        type: 'test-missing',
        severity: 'high',
        message: `No test file found for ${filePath}`,
        filePath: filePath,
        category: 'test-quality' as const
      }];
    }
    return [];
  }
}

describe('UnifiedAnalysisEngine (Analyzer backward compatibility)', () => {
  const testDir = './test-fixtures-analyzer';
  
  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });
  
  it('should analyze files and collect issues', async () => {
    await fs.writeFile(path.join(testDir, 'src', 'example.ts'), 'export const foo = 1;');
    await fs.writeFile(path.join(testDir, 'src', 'example.test.ts'), 'test("foo", () => {});');
    
    const analyzer = new UnifiedAnalysisEngine();
    analyzer.registerPlugin(new MockPlugin('test-existence'));
    
    const results = await analyzer.analyze(testDir);
    
    // UnifiedAnalysisEngineはテストファイルのみを検索するため、1ファイルのみ
    expect(results.totalFiles).toBe(1);
    expect(results.issues).toHaveLength(0);
    expect(results.executionTime).toBeGreaterThan(0);
  });
  
  it('should handle empty directories', async () => {
    const analyzer = new UnifiedAnalysisEngine();
    analyzer.registerPlugin(new MockPlugin('test-existence'));
    
    const results = await analyzer.analyze(testDir);
    
    // UnifiedAnalysisEngineは空ディレクトリの場合、ディレクトリ自体を対象とする
    expect(results.totalFiles).toBe(1);
    expect(results.issues).toHaveLength(1);
  });
  
  it('should run multiple plugins', async () => {
    await fs.writeFile(path.join(testDir, 'src', 'example.ts'), 'export const foo = 1;');
    
    const analyzer = new UnifiedAnalysisEngine();
    analyzer.registerPlugin(new MockPlugin('plugin1'));
    analyzer.registerPlugin(new MockPlugin('plugin2'));
    
    const results = await analyzer.analyze(testDir);
    
    expect(results.issues).toHaveLength(2);
  });
});