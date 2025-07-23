/**
 * PluginMetadata テストスイート
 * v0.3.0: プラグインメタデータ駆動設定システムのテスト
 */

import { 
  PluginMetadata, 
  PluginParameter, 
  PluginDependency, 
  validatePluginMetadata, 
  createPluginFromMetadata,
  mergePluginMetadata 
} from '../../src/core/pluginMetadata';

describe('PluginMetadata', () => {
  const mockMetadata: PluginMetadata = {
    name: 'TestPlugin',
    displayName: 'Test Plugin',
    description: 'A test plugin for unit testing',
    version: '1.0.0',
    author: 'Test Author',
    category: 'core',
    tags: ['test', 'unit-test'],
    parameters: [
      {
        name: 'threshold',
        type: 'number',
        required: true,
        defaultValue: 10,
        description: 'Threshold value for testing',
        validation: {
          min: 0,
          max: 100
        }
      },
      {
        name: 'pattern',
        type: 'string',
        required: false,
        defaultValue: '*.test.ts',
        description: 'File pattern to match',
        validation: {
          pattern: /\*\.(ts|js)$/
        }
      }
    ],
    dependencies: [
      {
        pluginName: 'BasePlugin',
        version: '>=1.0.0',
        optional: false,
        reason: 'Required for base functionality'
      }
    ],
    supportedFileTypes: ['.ts', '.js'],
    configurationSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        threshold: { type: 'number' }
      }
    }
  };

  describe('metadata validation', () => {
    it('should validate correct metadata', () => {
      const result = validatePluginMetadata(mockMetadata);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject metadata with missing required fields', () => {
      const invalidMetadata = { ...mockMetadata };
      delete (invalidMetadata as any).name;

      const result = validatePluginMetadata(invalidMetadata as PluginMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('name'))).toBe(true);
    });

    it('should validate parameter types', () => {
      const invalidMetadata: PluginMetadata = {
        ...mockMetadata,
        parameters: [
          {
            name: 'invalidParam',
            type: 'invalid' as any,
            required: true,
            description: 'Invalid parameter type'
          }
        ]
      };

      const result = validatePluginMetadata(invalidMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('type'))).toBe(true);
    });

    it('should validate version format', () => {
      const invalidMetadata: PluginMetadata = {
        ...mockMetadata,
        version: 'invalid-version'
      };

      const result = validatePluginMetadata(invalidMetadata);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('version'))).toBe(true);
    });
  });

  describe('parameter validation', () => {
    it('should validate number parameter with range', () => {
      const parameter: PluginParameter = {
        name: 'count',
        type: 'number',
        required: true,
        description: 'Count parameter',
        validation: { min: 1, max: 10 }
      };

      // Valid value
      expect(() => validateParameterValue(parameter, 5)).not.toThrow();
      
      // Invalid values
      expect(() => validateParameterValue(parameter, 0)).toThrow();
      expect(() => validateParameterValue(parameter, 11)).toThrow();
    });

    it('should validate string parameter with pattern', () => {
      const parameter: PluginParameter = {
        name: 'filename',
        type: 'string',
        required: true,
        description: 'Filename parameter',
        validation: { pattern: /\.ts$/ }
      };

      // Valid value
      expect(() => validateParameterValue(parameter, 'test.ts')).not.toThrow();
      
      // Invalid value
      expect(() => validateParameterValue(parameter, 'test.js')).toThrow();
    });

    it('should validate enum parameter', () => {
      const parameter: PluginParameter = {
        name: 'level',
        type: 'string',
        required: true,
        description: 'Level parameter',
        validation: { enum: ['low', 'medium', 'high'] }
      };

      // Valid value
      expect(() => validateParameterValue(parameter, 'medium')).not.toThrow();
      
      // Invalid value
      expect(() => validateParameterValue(parameter, 'extreme')).toThrow();
    });
  });

  describe('plugin creation from metadata', () => {
    it('should create plugin instance from metadata', () => {
      const plugin = createPluginFromMetadata(mockMetadata, {
        threshold: 15,
        pattern: '*.spec.ts'
      });

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('TestPlugin');
      expect(plugin.metadata).toEqual(mockMetadata);
    });

    it('should use default values for missing parameters', () => {
      const plugin = createPluginFromMetadata(mockMetadata, {
        threshold: 20
        // pattern is missing, should use default
      });

      expect(plugin.configuration).toHaveProperty('pattern', '*.test.ts');
      expect(plugin.configuration).toHaveProperty('threshold', 20);
    });

    it('should validate required parameters', () => {
      expect(() => {
        createPluginFromMetadata(mockMetadata, {
          // threshold is required but missing
          pattern: '*.test.ts'
        });
      }).toThrow();
    });
  });

  describe('metadata merging', () => {
    it('should merge metadata correctly', () => {
      const baseMetadata: Partial<PluginMetadata> = {
        name: 'BasePlugin',
        version: '1.0.0',
        parameters: [
          {
            name: 'baseParam',
            type: 'string',
            required: false,
            description: 'Base parameter'
          }
        ]
      };

      const extensionMetadata: Partial<PluginMetadata> = {
        name: 'ExtendedPlugin',
        version: '2.0.0',
        parameters: [
          {
            name: 'extParam',
            type: 'number',
            required: true,
            description: 'Extension parameter'
          }
        ]
      };

      const merged = mergePluginMetadata(baseMetadata, extensionMetadata);

      expect(merged.name).toBe('ExtendedPlugin');
      expect(merged.version).toBe('2.0.0');
      expect(merged.parameters).toHaveLength(2);
      expect(merged.parameters?.some(p => p.name === 'baseParam')).toBe(true);
      expect(merged.parameters?.some(p => p.name === 'extParam')).toBe(true);
    });

    it('should handle conflicting parameters in merge', () => {
      const baseMetadata: Partial<PluginMetadata> = {
        parameters: [
          {
            name: 'conflictParam',
            type: 'string',
            required: false,
            description: 'Base conflict parameter'
          }
        ]
      };

      const extensionMetadata: Partial<PluginMetadata> = {
        parameters: [
          {
            name: 'conflictParam',
            type: 'number',
            required: true,
            description: 'Extension conflict parameter'
          }
        ]
      };

      const merged = mergePluginMetadata(baseMetadata, extensionMetadata);

      // Extension should override base
      const conflictParam = merged.parameters?.find(p => p.name === 'conflictParam');
      expect(conflictParam).toBeDefined();
      expect(conflictParam?.type).toBe('number');
      expect(conflictParam?.required).toBe(true);
    });
  });

  describe('dependency resolution', () => {
    it('should check dependency compatibility', () => {
      const dependency: PluginDependency = {
        pluginName: 'RequiredPlugin',
        version: '>=2.0.0',
        optional: false,
        reason: 'Core functionality'
      };

      // Compatible version
      expect(isDependencyCompatible(dependency, '2.1.0')).toBe(true);
      expect(isDependencyCompatible(dependency, '3.0.0')).toBe(true);
      
      // Incompatible version
      expect(isDependencyCompatible(dependency, '1.9.0')).toBe(false);
    });

    it('should handle optional dependencies', () => {
      const optionalDependency: PluginDependency = {
        pluginName: 'OptionalPlugin',
        version: '>=1.0.0',
        optional: true,
        reason: 'Enhanced functionality'
      };

      // Optional dependency should not block execution if missing
      expect(isDependencyCompatible(optionalDependency, undefined)).toBe(true);
      expect(isDependencyCompatible(optionalDependency, '1.0.0')).toBe(true);
      expect(isDependencyCompatible(optionalDependency, '0.9.0')).toBe(false);
    });
  });
});

// Helper functions for testing
function validateParameterValue(parameter: PluginParameter, value: any): void {
  if (parameter.validation) {
    const { min, max, pattern, enum: enumValues } = parameter.validation;
    
    if (parameter.type === 'number' && typeof value === 'number') {
      if (min !== undefined && value < min) {
        throw new Error(`Value ${value} is below minimum ${min}`);
      }
      if (max !== undefined && value > max) {
        throw new Error(`Value ${value} is above maximum ${max}`);
      }
    }
    
    if (parameter.type === 'string' && typeof value === 'string') {
      if (pattern && !pattern.test(value)) {
        throw new Error(`Value ${value} does not match pattern ${pattern}`);
      }
      if (enumValues && !enumValues.includes(value)) {
        throw new Error(`Value ${value} is not in allowed values: ${enumValues.join(', ')}`);
      }
    }
  }
}

function isDependencyCompatible(dependency: PluginDependency, availableVersion: string | undefined): boolean {
  if (dependency.optional && !availableVersion) {
    return true;
  }
  
  if (!availableVersion) {
    return false;
  }
  
  // Simple version check (in real implementation, use semver library)
  if (!dependency.version) {
    return true;
  }
  
  const required = dependency.version.replace('>=', '');
  return availableVersion >= required;
}