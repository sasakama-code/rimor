import { TestExistencePlugin } from '../../src/plugins/testExistence';
import * as fs from 'fs';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('TestExistencePlugin', () => {
  let plugin: TestExistencePlugin;
  
  beforeEach(() => {
    plugin = new TestExistencePlugin();
    jest.resetAllMocks();
  });

  test('should return empty array for test files', async () => {
    const result = await plugin.analyze('src/example.test.ts');
    expect(result).toEqual([]);
  });

  test('should return empty array for excluded files', async () => {
    const result = await plugin.analyze('src/index.ts');
    expect(result).toEqual([]);
  });

  test('should detect missing test file', async () => {
    mockFs.existsSync.mockReturnValue(false);
    
    const result = await plugin.analyze('src/example.ts');
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('missing-test');
    expect(result[0].severity).toBe('error');
    expect(result[0].message).toBe('Test file does not exist: src/example.ts');
  });

  test('should return empty array when test file exists', async () => {
    mockFs.existsSync.mockReturnValue(true);
    
    const result = await plugin.analyze('src/example.ts');
    
    expect(result).toEqual([]);
  });
});