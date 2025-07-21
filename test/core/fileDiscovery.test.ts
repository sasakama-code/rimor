import { findTestFiles, isTestFile } from '../../src/core/fileDiscovery';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('findTestFiles', () => {
  it('should find test files in current directory', async () => {
    const testFiles: string[] = [];
    const generator = findTestFiles('./test');
    
    for await (const file of generator) {
      testFiles.push(file);
    }
    
    expect(testFiles.length).toBeGreaterThan(0);
    expect(testFiles.some(file => file.includes('fileDiscovery.test.ts'))).toBe(true);
  });
  
  it('should find test files recursively', async () => {
    const mockDir = './test-fixtures';
    await fs.mkdir(mockDir, { recursive: true });
    await fs.mkdir(path.join(mockDir, '__tests__'), { recursive: true });
    
    await fs.writeFile(path.join(mockDir, 'example.test.js'), '');
    await fs.writeFile(path.join(mockDir, 'example.spec.ts'), '');
    await fs.writeFile(path.join(mockDir, '__tests__', 'nested.js'), '');
    await fs.writeFile(path.join(mockDir, 'not-a-test.js'), '');
    
    const testFiles: string[] = [];
    const generator = findTestFiles(mockDir);
    
    for await (const file of generator) {
      testFiles.push(file);
    }
    
    expect(testFiles).toHaveLength(3);
    expect(testFiles.some(file => file.includes('example.test.js'))).toBe(true);
    expect(testFiles.some(file => file.includes('example.spec.ts'))).toBe(true);
    expect(testFiles.some(file => file.includes('nested.js'))).toBe(true);
    expect(testFiles.some(file => file.includes('not-a-test.js'))).toBe(false);
    
    await fs.rm(mockDir, { recursive: true, force: true });
  });
});

describe('isTestFile', () => {
  it('should identify test files correctly', () => {
    expect(isTestFile('example.test.js')).toBe(true);
    expect(isTestFile('example.spec.js')).toBe(true);
    expect(isTestFile('example.test.ts')).toBe(true);
    expect(isTestFile('example.spec.ts')).toBe(true);
    expect(isTestFile('example.js')).toBe(false);
    expect(isTestFile('test.js')).toBe(false);
  });
});