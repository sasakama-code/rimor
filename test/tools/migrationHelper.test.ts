import * as path from 'path';
import * as fs from 'fs';
import { MigrationHelper } from '../../src/tools/migrationHelper';
import { IPlugin } from '../../src/core/types';

const getTestPath = (filename: string) => path.join(__dirname, 'temp', filename);

describe('MigrationHelper', () => {
  let migrationHelper: MigrationHelper;
  const tempDir = path.join(__dirname, 'temp');

  beforeAll(() => {
    // テスト用ディレクトリを作成
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // テスト用ディレクトリを削除
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    migrationHelper = new MigrationHelper();
  });

  describe('Legacy Plugin Detection', () => {
    it('should detect legacy plugin structure', () => {
      const legacyPluginCode = `
export class TestExistencePlugin {
  name = 'test-existence';
  
  async analyze(filePath: string) {
    return [{
      type: 'missing-test',
      severity: 'high',
      message: 'Test file does not exist'
    }];
  }
}`;

      const isLegacy = migrationHelper.isLegacyPlugin(legacyPluginCode);
      expect(isLegacy).toBe(true);
    });

    it('should detect new plugin structure', () => {
      const newPluginCode = `
export class ModernPlugin extends BasePlugin {
  id = 'modern-plugin';
  name = 'Modern Plugin';
  version = '1.0.0';
  type = 'core';
  
  isApplicable(context: ProjectContext): boolean {
    return true;
  }
  
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    return [];
  }
}`;

      const isLegacy = migrationHelper.isLegacyPlugin(newPluginCode);
      expect(isLegacy).toBe(false);
    });

    it('should identify plugin files in directory', async () => {
      // テスト用プラグインファイルを作成
      const pluginFile1 = getTestPath('plugin1.ts');
      const pluginFile2 = getTestPath('plugin2.js');
      const normalFile = getTestPath('helper.ts');

      fs.writeFileSync(pluginFile1, `
export class Plugin1 {
  name = 'plugin1';
  async analyze() { return []; }
}`);

      fs.writeFileSync(pluginFile2, `
module.exports = {
  name: 'plugin2',
  analyze: async () => []
};`);

      fs.writeFileSync(normalFile, `
export const helper = () => 'helper';
`);

      const pluginFiles = await migrationHelper.findPluginFiles(tempDir);
      
      expect(pluginFiles).toHaveLength(2);
      expect(pluginFiles.map(f => path.basename(f)).sort()).toEqual(['plugin1.ts', 'plugin2.js']);
    });
  });

  describe('Plugin Migration', () => {
    it('should generate migration plan for legacy plugin', () => {
      const legacyPluginCode = `
export class TestExistencePlugin {
  name = 'test-existence';
  
  async analyze(filePath: string) {
    const issues = [];
    if (!fs.existsSync(filePath)) {
      issues.push({
        type: 'missing-test',
        severity: 'high',
        message: 'Test file does not exist',
        file: filePath
      });
    }
    return issues;
  }
}`;

      const migrationPlan = migrationHelper.generateMigrationPlan(legacyPluginCode);
      
      expect(migrationPlan).toBeDefined();
      expect(migrationPlan.pluginName).toBe('test-existence');
      expect(migrationPlan.migrationSteps).toContain('Convert to ITestQualityPlugin interface');
      expect(migrationPlan.migrationSteps).toContain('Implement detectPatterns method');
      expect(migrationPlan.migrationSteps).toContain('Implement evaluateQuality method');
      expect(migrationPlan.migrationSteps).toContain('Implement suggestImprovements method');
      expect(migrationPlan.estimatedComplexity).toBeDefined();
    });

    it('should create migration template', () => {
      const legacyPlugin = {
        name: 'assertion-checker',
        analyze: async (filePath: string) => [{
          type: 'weak-assertion',
          severity: 'medium' as const,
          message: 'Weak assertion detected'
        }]
      };

      const template = migrationHelper.createMigrationTemplate(legacyPlugin);
      
      expect(template).toContain('export class AssertionCheckerPlugin extends BasePlugin');
      expect(template).toContain('id = \'assertion-checker\'');
      expect(template).toContain('name = \'Assertion Checker\'');
      expect(template).toContain('detectPatterns(testFile: TestFile)');
      expect(template).toContain('evaluateQuality(patterns: DetectionResult[])');
      expect(template).toContain('suggestImprovements(evaluation: QualityScore)');
    });

    it('should generate migration guide', () => {
      const migrationPlan = {
        pluginName: 'test-plugin',
        migrationSteps: [
          'Convert to ITestQualityPlugin interface',
          'Implement new methods'
        ],
        estimatedComplexity: 'medium' as const,
        breakingChanges: ['Method signature changes'],
        compatibilityNotes: ['Use LegacyPluginAdapter for gradual migration']
      };

      const guide = migrationHelper.generateMigrationGuide(migrationPlan);
      
      expect(guide).toContain('# Migration Guide for test-plugin');
      expect(guide).toContain('## Migration Steps');
      expect(guide).toContain('## Breaking Changes');
      expect(guide).toContain('## Compatibility Notes');
      expect(guide).toContain('**Estimated Complexity:** medium');
    });
  });

  describe('Code Transformation', () => {
    it('should transform legacy plugin to new format', () => {
      const legacyCode = `
export class SimplePlugin {
  name = 'simple-test';
  
  async analyze(filePath: string) {
    return [{
      type: 'test-issue',
      severity: 'medium',
      message: 'Issue found'
    }];
  }
}`;

      const transformedCode = migrationHelper.transformPlugin(legacyCode);
      
      expect(transformedCode).toContain('extends BasePlugin');
      expect(transformedCode).toContain('ITestQualityPlugin');
      expect(transformedCode).toContain('detectPatterns');
      expect(transformedCode).toContain('evaluateQuality');
      expect(transformedCode).toContain('suggestImprovements');
    });

    it('should preserve plugin logic during transformation', () => {
      const legacyCode = `
export class LogicPlugin {
  name = 'logic-test';
  
  async analyze(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];
    
    if (content.includes('console.log')) {
      issues.push({
        type: 'console-log',
        severity: 'info',
        message: 'Console.log found'
      });
    }
    
    return issues;
  }
}`;

      const transformedCode = migrationHelper.transformPlugin(legacyCode);
      
      expect(transformedCode).toContain('fs.readFileSync');
      expect(transformedCode).toContain('console.log');
      expect(transformedCode).toContain('Console.log found');
    });

    it('should handle complex plugin transformations', () => {
      const complexLegacyCode = `
export class ComplexPlugin {
  name = 'complex-analyzer';
  private config = { threshold: 5 };
  
  private helper(code: string): number {
    return code.split('\\n').length;
  }
  
  async analyze(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = this.helper(content);
    const issues = [];
    
    if (lineCount > this.config.threshold) {
      issues.push({
        type: 'file-too-long',
        severity: 'medium',
        message: \`File has \${lineCount} lines\`,
        file: filePath,
        line: lineCount
      });
    }
    
    return issues;
  }
}`;

      const transformedCode = migrationHelper.transformPlugin(complexLegacyCode);
      
      expect(transformedCode).toContain('private config');
      expect(transformedCode).toContain('private helper');
      expect(transformedCode).toContain('this.helper(');
      expect(transformedCode).toContain('this.config.threshold');
    });
  });

  describe('Migration Validation', () => {
    it('should validate migrated plugin', async () => {
      const migratedCode = `
import { BasePlugin } from '../base/BasePlugin';
import { ITestQualityPlugin, TestFile, DetectionResult, QualityScore, Improvement } from '../../core/types';

export class MigratedPlugin extends BasePlugin implements ITestQualityPlugin {
  id = 'migrated-plugin';
  name = 'Migrated Plugin';
  version = '1.0.0';
  type = 'core' as const;
  
  isApplicable(): boolean {
    return true;
  }
  
  async detectPatterns(testFile: TestFile): Promise<DetectionResult[]> {
    return [];
  }
  
  evaluateQuality(patterns: DetectionResult[]): QualityScore {
    return {
      overall: 100,
      breakdown: { completeness: 100, correctness: 100, maintainability: 100 },
      confidence: 1.0
    };
  }
  
  suggestImprovements(evaluation: QualityScore): Improvement[] {
    return [];
  }
}`;

      const validation = migrationHelper.validateMigratedPlugin(migratedCode);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toBeDefined();
    });

    it('should detect validation errors', async () => {
      const invalidCode = `
export class InvalidPlugin {
  name = 'invalid';
  // Missing required methods
}`;

      const validation = migrationHelper.validateMigratedPlugin(invalidCode);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('missing required method'))).toBe(true);
    });
  });

  describe('Migration Reporting', () => {
    it('should generate migration report', async () => {
      // テスト用プラグインファイルを作成
      const pluginFiles = [
        { path: getTestPath('legacy1.ts'), content: 'export class Legacy1 { name = "legacy1"; async analyze() { return []; } }' },
        { path: getTestPath('legacy2.ts'), content: 'export class Legacy2 { name = "legacy2"; async analyze() { return []; } }' }
      ];

      pluginFiles.forEach(({ path, content }) => {
        fs.writeFileSync(path, content);
      });

      const report = await migrationHelper.generateMigrationReport(tempDir);
      
      expect(report).toBeDefined();
      expect(report.totalPlugins).toBeGreaterThanOrEqual(2);
      expect(report.legacyPlugins).toBeGreaterThanOrEqual(0);
      expect(report.modernPlugins).toBeGreaterThanOrEqual(0);
      expect(report.migrationEstimate).toBeDefined();
      expect(report.pluginDetails.length).toBeGreaterThanOrEqual(2);
    });

    it('should create migration summary', () => {
      const mockReport = {
        totalPlugins: 5,
        legacyPlugins: 3,
        modernPlugins: 2,
        migrationEstimate: {
          totalEffort: 'medium',
          estimatedHours: 24,
          complexPlugins: 1
        },
        pluginDetails: [
          { name: 'plugin1', type: 'legacy' as const, complexity: 'low' },
          { name: 'plugin2', type: 'legacy' as const, complexity: 'high' },
          { name: 'plugin3', type: 'modern' as const, complexity: 'n/a' }
        ]
      };

      const summary = migrationHelper.createMigrationSummary(mockReport);
      
      expect(summary).toContain('Migration Summary');
      expect(summary).toContain('**Total Plugins**: 5');
      expect(summary).toContain('**Legacy Plugins**: 3');
      expect(summary).toContain('**Estimated Hours**: 24');
    });
  });

  describe('Compatibility Checking', () => {
    it('should check API compatibility', () => {
      const legacyInterface = {
        name: 'string',
        analyze: '(filePath: string) => Promise<Issue[]>'
      };

      const newInterface = {
        id: 'string',
        name: 'string',
        detectPatterns: '(testFile: TestFile) => Promise<DetectionResult[]>',
        evaluateQuality: '(patterns: DetectionResult[]) => QualityScore'
      };

      const compatibility = migrationHelper.checkCompatibility(legacyInterface, newInterface);
      
      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.breakingChanges).toContain('Method analyze removed');
      expect(compatibility.newRequirements).toContain('Method detectPatterns required');
    });

    it('should suggest compatibility solutions', () => {
      const breakingChanges = [
        'Method analyze removed',
        'Property id required',
        'Return type changed'
      ];

      const solutions = migrationHelper.suggestCompatibilitySolutions(breakingChanges);
      
      expect(solutions).toContain('Use LegacyPluginAdapter for gradual migration');
      expect(solutions).toContain('Implement ITestQualityPlugin interface');
      expect(solutions).toContain('Update method signatures to match new interface');
    });
  });
});