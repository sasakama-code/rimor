import { LegacyPluginAdapter } from '../../../src/core/implementations/LegacyPluginAdapter';
import { IPlugin as ILegacyPlugin, Issue } from '../../../src/core/types';
import { PluginMetadata } from '../../../src/core/interfaces/IPluginManager';

// モックレガシープラグイン
class MockLegacyPlugin implements ILegacyPlugin {
  constructor(
    public name: string,
    private mockAnalyze?: (filePath: string) => Promise<Issue[]>
  ) {}
  
  async analyze(filePath: string): Promise<Issue[]> {
    if (this.mockAnalyze) {
      return this.mockAnalyze(filePath);
    }
    return [];
  }
}

describe('LegacyPluginAdapter', () => {
  describe('constructor', () => {
    it('should adapt legacy plugin with minimal metadata', () => {
      const legacyPlugin = new MockLegacyPlugin('test-plugin');
      const adapter = new LegacyPluginAdapter(legacyPlugin);
      
      expect(adapter.metadata.id).toBe('test-plugin');
      expect(adapter.metadata.name).toBe('test-plugin');
      expect(adapter.metadata.version).toBe('1.0.0');
      expect(adapter.metadata.enabled).toBe(true);
      expect(adapter.metadata.description).toBeUndefined();
    });
    
    it('should use provided metadata over defaults', () => {
      const legacyPlugin = new MockLegacyPlugin('legacy-name');
      const customMetadata: Partial<PluginMetadata> = {
        id: 'custom-id',
        name: 'Custom Name',
        version: '2.0.0',
        description: 'Custom description',
        enabled: false
      };
      
      const adapter = new LegacyPluginAdapter(legacyPlugin, customMetadata);
      
      expect(adapter.metadata.id).toBe('custom-id');
      expect(adapter.metadata.name).toBe('Custom Name');
      expect(adapter.metadata.version).toBe('2.0.0');
      expect(adapter.metadata.description).toBe('Custom description');
      expect(adapter.metadata.enabled).toBe(false);
    });
    
    it('should use legacy plugin name as fallback for id and name', () => {
      const legacyPlugin = new MockLegacyPlugin('fallback-plugin');
      const partialMetadata: Partial<PluginMetadata> = {
        version: '3.0.0',
        description: 'Partial metadata'
      };
      
      const adapter = new LegacyPluginAdapter(legacyPlugin, partialMetadata);
      
      expect(adapter.metadata.id).toBe('fallback-plugin');
      expect(adapter.metadata.name).toBe('fallback-plugin');
      expect(adapter.metadata.version).toBe('3.0.0');
      expect(adapter.metadata.description).toBe('Partial metadata');
    });
    
    it('should default enabled to true when not specified', () => {
      const legacyPlugin = new MockLegacyPlugin('enabled-test');
      const adapter = new LegacyPluginAdapter(legacyPlugin, {});
      
      expect(adapter.metadata.enabled).toBe(true);
    });
    
    it('should handle enabled false correctly', () => {
      const legacyPlugin = new MockLegacyPlugin('disabled-test');
      const adapter = new LegacyPluginAdapter(legacyPlugin, { enabled: false });
      
      expect(adapter.metadata.enabled).toBe(false);
    });
  });
  
  describe('analyze', () => {
    it('should delegate analyze to legacy plugin', async () => {
      const mockIssues: Issue[] = [
        {
          type: 'test-issue',
          severity: 'high',
          message: 'Test issue from legacy plugin'
        }
      ];
      
      const analyzeFunction = jest.fn().mockResolvedValue(mockIssues);
      const legacyPlugin = new MockLegacyPlugin('analyze-test', analyzeFunction);
      const adapter = new LegacyPluginAdapter(legacyPlugin);
      
      const result = await adapter.analyze('/test/file.ts');
      
      expect(analyzeFunction).toHaveBeenCalledWith('/test/file.ts');
      expect(result).toBe(mockIssues);
    });
    
    it('should pass through analyze errors', async () => {
      const error = new Error('Legacy plugin error');
      const analyzeFunction = jest.fn().mockRejectedValue(error);
      const legacyPlugin = new MockLegacyPlugin('error-test', analyzeFunction);
      const adapter = new LegacyPluginAdapter(legacyPlugin);
      
      await expect(adapter.analyze('/test/file.ts')).rejects.toThrow('Legacy plugin error');
    });
    
    it('should handle empty results', async () => {
      const legacyPlugin = new MockLegacyPlugin('empty-test', async () => []);
      const adapter = new LegacyPluginAdapter(legacyPlugin);
      
      const result = await adapter.analyze('/test/file.ts');
      
      expect(result).toEqual([]);
    });
  });
  
  describe('integration with PluginManager', () => {
    it('should be compatible with IPlugin interface', () => {
      const legacyPlugin = new MockLegacyPlugin('interface-test');
      const adapter = new LegacyPluginAdapter(legacyPlugin);
      
      // Verify adapter implements IPlugin interface
      expect(adapter.metadata).toBeDefined();
      expect(typeof adapter.analyze).toBe('function');
      
      // Verify metadata structure
      expect(adapter.metadata).toHaveProperty('id');
      expect(adapter.metadata).toHaveProperty('name');
      expect(adapter.metadata).toHaveProperty('version');
      expect(adapter.metadata).toHaveProperty('enabled');
    });
    
    it('should work with real legacy plugin examples', async () => {
      // Simulate TestExistencePlugin style
      const testExistencePlugin: ILegacyPlugin = {
        name: 'test-existence',
        analyze: async (filePath: string) => {
          if (!filePath.includes('.test.')) {
            return [{
              type: 'missing-test',
              severity: 'high' as const,
              message: `テストファイルが存在しません: ${filePath}`
            }];
          }
          return [];
        }
      };
      
      const adapter = new LegacyPluginAdapter(testExistencePlugin);
      
      expect(adapter.metadata.id).toBe('test-existence');
      expect(adapter.metadata.name).toBe('test-existence');
      
      const issues = await adapter.analyze('src/main.ts');
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('missing-test');
      
      const noIssues = await adapter.analyze('src/main.test.ts');
      expect(noIssues).toHaveLength(0);
    });
  });
  
  describe('edge cases', () => {
    it('should handle legacy plugin with empty name', () => {
      const legacyPlugin = new MockLegacyPlugin('');
      const adapter = new LegacyPluginAdapter(legacyPlugin, { id: 'empty-name-plugin' });
      
      expect(adapter.metadata.id).toBe('empty-name-plugin');
      expect(adapter.metadata.name).toBe('');
    });
    
    it('should preserve all metadata fields when fully specified', () => {
      const legacyPlugin = new MockLegacyPlugin('full-metadata');
      const fullMetadata: PluginMetadata = {
        id: 'full-id',
        name: 'Full Name',
        version: '5.0.0',
        description: 'Full description',
        enabled: true
      };
      
      const adapter = new LegacyPluginAdapter(legacyPlugin, fullMetadata);
      
      expect(adapter.metadata).toEqual(fullMetadata);
    });
    
    it('should handle concurrent analyze calls', async () => {
      let callCount = 0;
      const legacyPlugin = new MockLegacyPlugin('concurrent-test', async (filePath) => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return [{
          type: `call-${callCount}`,
          severity: 'info',
          message: `Call ${callCount} for ${filePath}`
        }];
      });
      
      const adapter = new LegacyPluginAdapter(legacyPlugin);
      
      // 並行実行
      const [result1, result2, result3] = await Promise.all([
        adapter.analyze('/test1.ts'),
        adapter.analyze('/test2.ts'),
        adapter.analyze('/test3.ts')
      ]);
      
      expect(callCount).toBe(3);
      expect(result1[0].type).toMatch(/^call-\d$/);
      expect(result2[0].type).toMatch(/^call-\d$/);
      expect(result3[0].type).toMatch(/^call-\d$/);
    });
  });
});