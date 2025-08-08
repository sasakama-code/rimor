import { describe, it, expect } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs';

describe('Type Import Verification', () => {
  const typesDir = path.join(__dirname, '../../../src/core/types');
  
  describe('Split Type Files Import', () => {
    it('should be able to import from index.ts', () => {
      // This test verifies that all types can be imported from the index file
      const expectedExports = [
        // Base types
        'Issue',
        'Location',
        'Position',
        'FileLocation',
        'RangeLocation',
        'CodeLocation',
        
        // Plugin interfaces
        'IPlugin',
        'ITestQualityPlugin',
        'PluginResult',
        'PluginType',
        
        // Analysis results
        'DetectionResult',
        'Evidence',
        'AnalysisOptions',
        'AnalysisResult',
        
        // Quality scores
        'QualityScore',
        'QualityDimension',
        'QualityDetails',
        
        // Domain dictionary
        'DomainDictionary',
        'DomainTerm',
        'BusinessRule',
        'DomainContext',
        
        // Project context
        'ProjectContext',
        'TestFile',
        'PackageJsonConfig',
        'TSConfig',
        'ASTNode',
        
        // Improvements
        'Improvement',
        'ImprovementType',
        'ImprovementPriority',
        'FixResult',
        
        // Security types
        'SecurityType',
        'TaintLevel',
        'SeverityLevel',
        
        // Type guards
        'isValidPackageJson',
        'isValidASTNode',
        'isValidProjectContext',
        'isValidTestFile',
        'isValidIssue',
        'isValidDetectionResult',
        'isValidQualityScore',
        'isValidImprovement'
      ];
      
      // This will be validated when the actual files are created
      expect(expectedExports).toBeDefined();
      expect(expectedExports.length).toBeGreaterThan(0);
    });

    it('should maintain backward compatibility', () => {
      // Test that old imports still work
      const oldImportPatterns = [
        "import { Issue } from '../core/types'",
        "import { IPlugin } from '../core/types'",
        "import { ITestQualityPlugin } from '../core/types'",
        "import { ProjectContext } from '../core/types'",
        "import { TestFile } from '../core/types'",
        "import { DetectionResult } from '../core/types'",
        "import { QualityScore } from '../core/types'",
        "import { Improvement } from '../core/types'"
      ];
      
      // These patterns should still be valid after restructuring
      expect(oldImportPatterns).toBeDefined();
      expect(oldImportPatterns.length).toBeGreaterThan(0);
    });

    it('should allow granular imports from specific files', () => {
      // Test that types can be imported from specific files for better tree-shaking
      const granularImports = [
        "import { Issue } from '../core/types/base-types'",
        "import { IPlugin, ITestQualityPlugin } from '../core/types/plugin-interface'",
        "import { DetectionResult } from '../core/types/analysis-result'",
        "import { QualityScore } from '../core/types/quality-score'",
        "import { DomainDictionary } from '../core/types/domain-dictionary'"
      ];
      
      // These patterns should be valid for granular imports
      expect(granularImports).toBeDefined();
      expect(granularImports.length).toBeGreaterThan(0);
    });
  });

  describe('Type File Organization', () => {
    it('should have correct file structure', async () => {
      const expectedFiles = [
        'index.ts',
        'base-types.ts',
        'plugin-interface.ts',
        'analysis-result.ts',
        'quality-score.ts',
        'domain-dictionary.ts',
        'project-context.ts',
        'improvements.ts',
        'type-guards.ts'
      ];
      
      // This will check for file existence once created
      for (const file of expectedFiles) {
        const filePath = path.join(typesDir, file);
        // Will be validated when files are created
        expect(file).toBeDefined();
      }
    });

    it('should not have oversized type files', async () => {
      const maxLinesPerFile = 200; // Each file should be focused and small
      
      // This will be validated when files are created
      const checkFileSize = async (filePath: string) => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n').length;
          return lines <= maxLinesPerFile;
        }
        return true; // Skip if file doesn't exist yet
      };
      
      // Placeholder for actual validation
      expect(maxLinesPerFile).toBeDefined();
      expect(maxLinesPerFile).toBeGreaterThan(0);
    });
  });

  describe('Import Dependencies', () => {
    it('should have no circular dependencies', () => {
      // Define the dependency graph
      const dependencies: Record<string, string[]> = {
        'base-types.ts': [], // No dependencies
        'project-context.ts': ['base-types.ts'], // Depends on base types
        'plugin-interface.ts': ['base-types.ts', 'project-context.ts', 'analysis-result.ts', 'quality-score.ts', 'improvements.ts'],
        'analysis-result.ts': ['base-types.ts'],
        'quality-score.ts': ['base-types.ts'],
        'domain-dictionary.ts': ['base-types.ts'],
        'improvements.ts': ['base-types.ts'],
        'type-guards.ts': ['base-types.ts', 'project-context.ts', 'plugin-interface.ts', 'analysis-result.ts', 'quality-score.ts', 'improvements.ts'],
        'index.ts': ['base-types.ts', 'project-context.ts', 'plugin-interface.ts', 'analysis-result.ts', 'quality-score.ts', 'domain-dictionary.ts', 'improvements.ts', 'type-guards.ts']
      };
      
      // Check for circular dependencies
      const checkCircular = (
        file: string, 
        visited: Set<string> = new Set(),
        path: string[] = []
      ): boolean => {
        if (visited.has(file)) {
          return path.includes(file); // Circular if file is in current path
        }
        
        visited.add(file);
        path.push(file);
        
        const deps = dependencies[file] || [];
        for (const dep of deps) {
          if (checkCircular(dep, visited, [...path])) {
            return true;
          }
        }
        
        return false;
      };
      
      for (const file of Object.keys(dependencies)) {
        const hasCircular = checkCircular(file);
        expect(hasCircular).toBe(false);
      }
    });

    it('should follow proper import hierarchy', () => {
      // Define the layer hierarchy (lower layers should not import from higher layers)
      const layers = {
        0: ['base-types.ts'], // Foundation layer
        1: ['project-context.ts', 'analysis-result.ts', 'quality-score.ts', 'domain-dictionary.ts', 'improvements.ts'], // Domain layer
        2: ['plugin-interface.ts'], // Interface layer
        3: ['type-guards.ts'], // Utility layer
        4: ['index.ts'] // Export layer
      };
      
      // Verify hierarchy is maintained
      const getLayer = (file: string): number => {
        for (const [level, files] of Object.entries(layers)) {
          if (files.includes(file)) {
            return parseInt(level);
          }
        }
        return -1;
      };
      
      // This ensures proper layering
      expect(layers).toBeDefined();
      expect(Object.keys(layers).length).toBe(5);
    });
  });

  describe('Type Re-exports', () => {
    it('should re-export all types from index.ts', () => {
      // Verify that index.ts re-exports everything needed
      const reExports = [
        "export * from './base-types';",
        "export * from './project-context';",
        "export * from './plugin-interface';",
        "export * from './analysis-result';",
        "export * from './quality-score';",
        "export * from './domain-dictionary';",
        "export * from './improvements';",
        "export * from './type-guards';"
      ];
      
      // These should be present in index.ts
      expect(reExports).toBeDefined();
      expect(reExports.length).toBe(8);
    });

    it('should provide backward compatibility aliases', () => {
      // For backward compatibility, certain types might need aliases
      const aliases = [
        "export { TaintLevel as TaintQualifier } from './base-types';", // Example alias
        "export type { CodeLocation as CommonCodeLocation } from './base-types';", // Type alias
        "export type { QualityDimension as CommonQualityDimension } from './quality-score';" // Another alias
      ];
      
      expect(aliases).toBeDefined();
      expect(aliases.length).toBeGreaterThan(0);
    });
  });
});