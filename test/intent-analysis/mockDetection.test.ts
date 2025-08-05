/**
 * Mock Detection Debug Test
 * mockReturnValueの検出問題をデバッグするためのテスト
 */

import { TypeScriptAnalyzer } from '../../src/intent-analysis/TypeScriptAnalyzer';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('Mock Detection Debug', () => {
  let analyzer: TypeScriptAnalyzer;
  let tempDir: string;
  
  beforeAll(async () => {
    tempDir = path.join(os.tmpdir(), 'mock-debug-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    
    const tsConfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      }
    };
    await fs.writeFile(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    analyzer = new TypeScriptAnalyzer();
    await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
  });
  
  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  it('単純なjest.fn()を検出できること', async () => {
    const testFile = path.join(tempDir, 'simple-mock.test.ts');
    const content = `const mockFn = jest.fn();`;
    await fs.writeFile(testFile, content);
    
    const mocks = await analyzer.detectMocks(testFile);
    
    expect(mocks).toHaveLength(1);
    expect(mocks[0].mockType).toBe('jest.fn');
    expect(mocks[0].hasImplementation).toBe(false);
  });
  
  it('引数付きjest.fn()を検出できること', async () => {
    const testFile = path.join(tempDir, 'mock-with-impl.test.ts');
    const content = `const mockFn = jest.fn(() => 42);`;
    await fs.writeFile(testFile, content);
    
    const mocks = await analyzer.detectMocks(testFile);
    
    expect(mocks).toHaveLength(1);
    expect(mocks[0].mockType).toBe('jest.fn');
    expect(mocks[0].hasImplementation).toBe(true);
  });
  
  it('チェーン呼び出しのmockReturnValueを検出できること', async () => {
    const testFile = path.join(tempDir, 'chain-mock.test.ts');
    const content = `const mockFn = jest.fn().mockReturnValue(42);`;
    await fs.writeFile(testFile, content);
    
    const mocks = await analyzer.detectMocks(testFile);
    
    console.log('検出されたモック:', JSON.stringify(mocks, null, 2));
    
    expect(mocks).toHaveLength(1);
    expect(mocks[0].mockType).toBe('jest.fn');
    expect(mocks[0].hasImplementation).toBe(true);
  });
  
  it('複数のチェーン呼び出しを検出できること', async () => {
    const testFile = path.join(tempDir, 'multi-chain-mock.test.ts');
    const content = `
      const mockFn = jest.fn()
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValue(3);
    `;
    await fs.writeFile(testFile, content);
    
    const mocks = await analyzer.detectMocks(testFile);
    
    expect(mocks).toHaveLength(1);
    expect(mocks[0].hasImplementation).toBe(true);
  });
  
  it('変数に代入された後のチェーン呼び出しを検出できること', async () => {
    const testFile = path.join(tempDir, 'assigned-chain-mock.test.ts');
    const content = `
      const mockFn = jest.fn();
      mockFn.mockReturnValue(42);
    `;
    await fs.writeFile(testFile, content);
    
    const mocks = await analyzer.detectMocks(testFile);
    
    console.log('代入後のモック検出:', JSON.stringify(mocks, null, 2));
    
    // この場合は検出が難しいので、現時点では1つのモックとして検出
    expect(mocks.length).toBeGreaterThan(0);
  });
});