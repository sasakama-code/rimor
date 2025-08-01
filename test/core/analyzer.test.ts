import { Analyzer } from '../../src/core/analyzer';
import { IPlugin, Issue } from '../../src/core/types';
import * as fs from 'fs/promises';
import * as path from 'path';

class MockPlugin implements IPlugin {
  constructor(public name: string, private shouldFindIssue: boolean = true) {}
  
  async analyze(filePath: string): Promise<Issue[]> {
    if (this.shouldFindIssue && !filePath.includes('.test.')) {
      return [{
        type: 'test-missing',
        severity: 'error',
        message: `No test file found for ${filePath}`
      }];
    }
    return [];
  }
}

describe('Analyzer', () => {
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
    
    const analyzer = new Analyzer();
    analyzer.registerPlugin(new MockPlugin('test-existence'));
    
    const results = await analyzer.analyze(testDir);
    
    expect(results.totalFiles).toBe(2);
    expect(results.issues).toHaveLength(1);
    expect(results.issues[0].type).toBe('test-missing');
  });
  
  it('should handle empty directories', async () => {
    const analyzer = new Analyzer();
    analyzer.registerPlugin(new MockPlugin('test-existence'));
    
    const results = await analyzer.analyze(testDir);
    
    expect(results.totalFiles).toBe(0);
    expect(results.issues).toHaveLength(0);
  });
  
  it('should run multiple plugins', async () => {
    await fs.writeFile(path.join(testDir, 'src', 'example.ts'), 'export const foo = 1;');
    
    const analyzer = new Analyzer();
    analyzer.registerPlugin(new MockPlugin('plugin1'));
    analyzer.registerPlugin(new MockPlugin('plugin2'));
    
    const results = await analyzer.analyze(testDir);
    
    expect(results.issues).toHaveLength(2);
  });
});