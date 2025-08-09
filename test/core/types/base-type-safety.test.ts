import { describe, it, expect } from '@jest/globals';

// 型定義のテスト
describe('Base Type Safety - No any types', () => {
  describe('Plugin Metadata Types', () => {
    // defaultValueはunknown型であるべき
    interface PluginParameter {
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required: boolean;
      defaultValue?: unknown; // NOT any
      description: string;
    }

    it('should handle plugin parameters without any type', () => {
      const param: PluginParameter = {
        name: 'timeout',
        type: 'number',
        required: false,
        defaultValue: 5000,
        description: 'Timeout in milliseconds'
      };

      // unknown型は明示的な型チェックが必要
      if (typeof param.defaultValue === 'number') {
        expect(param.defaultValue).toBe(5000);
      }
    });

    it('should require type checking for unknown values', () => {
      const param: PluginParameter = {
        name: 'config',
        type: 'object',
        required: false,
        defaultValue: { key: 'value' },
        description: 'Configuration object'
      };

      // unknown型の型ガード
      function isConfigObject(value: unknown): value is Record<string, unknown> {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      }

      if (isConfigObject(param.defaultValue)) {
        expect(param.defaultValue.key).toBe('value');
      }
    });
  });

  describe('Record Types with unknown', () => {
    // Record<string, any>をRecord<string, unknown>に置き換え
    interface ConfigWithUnknown {
      metadata?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    }

    it('should handle Record<string, unknown> safely', () => {
      const config: ConfigWithUnknown = {
        metadata: {
          version: '1.0.0',
          author: 'test',
          tags: ['test', 'sample'],
          active: true
        },
        settings: {
          timeout: 3000,
          debug: false
        }
      };

      // unknown型は型チェックが必要
      if (config.metadata) {
        const version = config.metadata.version;
        if (typeof version === 'string') {
          expect(version).toBe('1.0.0');
        }

        const tags = config.metadata.tags;
        if (Array.isArray(tags)) {
          expect(tags).toHaveLength(2);
        }
      }
    });
  });

  describe('AST and Complex Types', () => {
    interface TypedASTNode {
      type: string;
      children?: TypedASTNode[];
      value?: string | number | boolean;
      properties?: Record<string, unknown>;
    }

    it('should handle AST nodes without any type', () => {
      const astNode: TypedASTNode = {
        type: 'FunctionDeclaration',
        children: [
          {
            type: 'Identifier',
            value: 'testFunction'
          },
          {
            type: 'BlockStatement',
            children: []
          }
        ],
        properties: {
          async: false,
          generator: false
        }
      };

      expect(astNode.type).toBe('FunctionDeclaration');
      expect(astNode.children).toHaveLength(2);
      
      if (astNode.properties) {
        const asyncProp = astNode.properties.async;
        if (typeof asyncProp === 'boolean') {
          expect(asyncProp).toBe(false);
        }
      }
    });
  });

  describe('Function Parameters with unknown', () => {
    // 関数パラメータの型安全性
    class TypeSafeProcessor {
      processData(data: unknown): string {
        // 型ガードを使用
        if (typeof data === 'string') {
          return data.toUpperCase();
        }
        if (typeof data === 'number') {
          return data.toString();
        }
        if (data && typeof data === 'object') {
          return JSON.stringify(data);
        }
        return 'unknown data';
      }

      validatePlugin(plugin: unknown): boolean {
        // プラグインの型チェック
        if (!plugin || typeof plugin !== 'object') {
          return false;
        }
        
        const p = plugin as Record<string, unknown>;
        return typeof p.name === 'string' && 
               typeof p.analyze === 'function';
      }
    }

    it('should process data safely with unknown type', () => {
      const processor = new TypeSafeProcessor();
      
      expect(processor.processData('test')).toBe('TEST');
      expect(processor.processData(123)).toBe('123');
      expect(processor.processData({ key: 'value' })).toBe('{"key":"value"}');
      expect(processor.processData(null)).toBe('unknown data');
    });

    it('should validate plugins with type checking', () => {
      const processor = new TypeSafeProcessor();
      
      const validPlugin = {
        name: 'TestPlugin',
        analyze: () => []
      };
      
      expect(processor.validatePlugin(validPlugin)).toBe(true);
      expect(processor.validatePlugin({ name: 'Invalid' })).toBe(false);
      expect(processor.validatePlugin(null)).toBe(false);
      expect(processor.validatePlugin('string')).toBe(false);
    });
  });

  describe('Array Processing without any', () => {
    function processArray(items: unknown[]): number[] {
      return items
        .filter((item): item is number => typeof item === 'number')
        .map(num => num * 2);
    }

    function extractStrings(items: unknown[]): string[] {
      return items
        .filter((item): item is string => typeof item === 'string');
    }

    it('should process arrays with type guards', () => {
      const mixedArray: unknown[] = [1, 'test', 2, { key: 'value' }, 3, null];
      
      const numbers = processArray(mixedArray);
      expect(numbers).toEqual([2, 4, 6]);
      
      const strings = extractStrings(mixedArray);
      expect(strings).toEqual(['test']);
    });
  });
});