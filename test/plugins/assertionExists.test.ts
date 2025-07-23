import { AssertionExistsPlugin } from '../../src/plugins/assertionExists';
import * as fs from 'fs';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('AssertionExistsPlugin', () => {
  let plugin: AssertionExistsPlugin;
  
  beforeEach(() => {
    plugin = new AssertionExistsPlugin();
    jest.resetAllMocks();
  });

  test('should return empty array for non-test files', async () => {
    const result = await plugin.analyze('src/example.ts');
    expect(result).toEqual([]);
  });

  test('should detect missing assertions in test files', async () => {
    const testContent = `
      describe('test', () => {
        test('should do something', () => {
          const value = 42;
          console.log(value);
          // no assertions here
        });
      });
    `;
    
    mockFs.readFileSync.mockReturnValue(testContent);
    
    const result = await plugin.analyze('src/example.test.ts');
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('missing-assertion');
    expect(result[0].severity).toBe('warning');
    expect(result[0].message).toContain('アサーション（expect文など）が見つかりません');
  });

  test('should detect expect() assertions', async () => {
    const testContent = `
      describe('test', () => {
        test('should work', () => {
          expect(42).toBe(42);
        });
      });
    `;
    
    mockFs.readFileSync.mockReturnValue(testContent);
    
    const result = await plugin.analyze('src/example.test.ts');
    
    expect(result).toEqual([]);
  });

  test('should detect various assertion patterns', async () => {
    const patterns = [
      'expect(value).toBe(42)',
      'assert(condition)',
      'value.should.equal(42)',
      'chai.expect(value).to.equal(42)',
      'assert.equal(a, b)',
      'assert.strictEqual(a, b)',
      'expect(value).toEqual(expected)',
      'expect(fn).toHaveBeenCalled()',
      'expect(() => fn()).toThrow()',
      'expect(value).toBeNull()',
      'expect(value).toBeTruthy()',
      'expect(value).toBeFalsy()'
    ];
    
    for (const pattern of patterns) {
      const testContent = `
        test('should work', () => {
          ${pattern};
        });
      `;
      
      mockFs.readFileSync.mockReturnValue(testContent);
      
      const result = await plugin.analyze('src/example.test.ts');
      
      expect(result).toEqual([]);
    }
  });

  test('should ignore assertions in comments', async () => {
    const testContent = `
      test('should work', () => {
        // expect(value).toBe(42);
        /* expect(value).toBe(42); */
        const value = 42;
      });
    `;
    
    mockFs.readFileSync.mockReturnValue(testContent);
    
    const result = await plugin.analyze('src/example.test.ts');
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('missing-assertion');
  });

  test('should ignore assertions in strings', async () => {
    const testContent = `
      test('should work', () => {
        const message = "expect(value).toBe(42)";
        const template = \`expect(\${value}).toBe(42)\`;
        console.log(message);
      });
    `;
    
    mockFs.readFileSync.mockReturnValue(testContent);
    
    const result = await plugin.analyze('src/example.test.ts');
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('missing-assertion');
  });

  test('should handle file read errors gracefully', async () => {
    mockFs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    
    const result = await plugin.analyze('src/example.test.ts');
    
    expect(result).toEqual([]);
  });

  test('should work with different test file patterns', async () => {
    const testContent = 'expect(true).toBe(true);';
    mockFs.readFileSync.mockReturnValue(testContent);
    
    const testFiles = [
      'src/example.test.ts',
      'src/example.spec.ts',
      '__tests__/example.ts'
    ];
    
    for (const testFile of testFiles) {
      const result = await plugin.analyze(testFile);
      expect(result).toEqual([]);
    }
  });
});