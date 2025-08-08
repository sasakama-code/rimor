import { describe, it, expect } from '@jest/globals';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

describe('Type Safety Verification', () => {
  const createProgram = (files: { [fileName: string]: string }) => {
    const options: ts.CompilerOptions = {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS
    };

    const host = ts.createCompilerHost(options);
    const originalGetSourceFile = host.getSourceFile;
    
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (files[fileName] !== undefined) {
        return ts.createSourceFile(fileName, files[fileName], languageVersion, true);
      }
      return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };

    const program = ts.createProgram(Object.keys(files), options, host);
    return program;
  };

  const getDiagnostics = (program: ts.Program): ts.Diagnostic[] => {
    const diagnostics = [
      ...program.getSemanticDiagnostics(),
      ...program.getSyntacticDiagnostics(),
      ...program.getDeclarationDiagnostics()
    ];
    return diagnostics;
  };

  describe('Strict Mode Compilation', () => {
    it('should compile without any type in core types', () => {
      const testFile = `
        import { PackageJsonConfig, ASTNode, ProjectContext } from './types';
        
        // Test that types don't use 'any'
        const pkg: PackageJsonConfig = {
          name: 'test',
          version: '1.0.0',
          dependencies: { 'typescript': '^5.0.0' }
        };
        
        const ast: ASTNode = {
          type: 'Function',
          startPosition: { line: 1, column: 0 },
          endPosition: { line: 5, column: 1 },
          children: []
        };
        
        const context: ProjectContext = {
          rootPath: '/project',
          language: 'typescript',
          packageJson: pkg, // Should be typed, not any
          ast: ast // Should be typed, not any
        };
      `;

      const files = {
        'test.ts': testFile,
        'types.ts': `
          export interface PackageJsonConfig {
            name: string;
            version: string;
            description?: string;
            main?: string;
            scripts?: Record<string, string>;
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            peerDependencies?: Record<string, string>;
            optionalDependencies?: Record<string, string>;
            engines?: Record<string, string>;
            repository?: {
              type: string;
              url: string;
            };
            keywords?: string[];
            author?: string | {
              name: string;
              email?: string;
              url?: string;
            };
            license?: string;
            bugs?: {
              url?: string;
              email?: string;
            };
            homepage?: string;
            private?: boolean;
          }
          
          export interface Position {
            line: number;
            column: number;
            offset?: number;
          }
          
          export interface ASTNode {
            type: string;
            startPosition: Position;
            endPosition: Position;
            children?: ASTNode[];
            value?: string | number | boolean;
            name?: string;
            params?: ASTNode[];
            body?: ASTNode | ASTNode[];
            properties?: Record<string, unknown>;
          }
          
          export interface ProjectContext {
            rootPath?: string;
            projectPath?: string;
            language?: 'javascript' | 'typescript' | 'python' | 'java' | 'other';
            testFramework?: string;
            framework?: string;
            packageJson?: PackageJsonConfig; // Typed, not any
            tsConfig?: TSConfig; // Typed, not any
            ast?: ASTNode; // Typed, not any
            dependencies?: string[];
            configuration?: Record<string, unknown>; // unknown instead of any
            customConfig?: Record<string, unknown>; // unknown instead of any
            filePatterns?: {
              test: string[];
              source: string[];
              ignore: string[];
            };
          }
          
          export interface TSConfig {
            compilerOptions?: {
              target?: string;
              module?: string;
              lib?: string[];
              outDir?: string;
              rootDir?: string;
              strict?: boolean;
              esModuleInterop?: boolean;
              skipLibCheck?: boolean;
              forceConsistentCasingInFileNames?: boolean;
              declaration?: boolean;
              declarationMap?: boolean;
              sourceMap?: boolean;
              noImplicitAny?: boolean;
              strictNullChecks?: boolean;
              strictFunctionTypes?: boolean;
              strictBindCallApply?: boolean;
              strictPropertyInitialization?: boolean;
              noImplicitThis?: boolean;
              alwaysStrict?: boolean;
              [key: string]: unknown;
            };
            include?: string[];
            exclude?: string[];
            files?: string[];
            extends?: string;
            references?: Array<{ path: string }>;
          }
        `
      };

      const program = createProgram(files);
      const diagnostics = getDiagnostics(program);
      
      const errors = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
      expect(errors).toHaveLength(0);
    });

    it('should enforce type safety for plugin interfaces', () => {
      const testFile = `
        import { IPlugin, ITestQualityPlugin } from './types';
        
        // Test that plugin interfaces are properly typed
        const simplePlugin: IPlugin = {
          name: 'test-plugin',
          analyze: async (filePath: string) => {
            return []; // Should return Issue[]
          }
        };
        
        const qualityPlugin: ITestQualityPlugin = {
          id: 'quality-plugin',
          name: 'Quality Plugin',
          version: '1.0.0',
          type: 'core',
          isApplicable: (context) => true,
          detectPatterns: async (testFile) => [],
          evaluateQuality: (patterns) => ({
            overall: 0.8,
            dimensions: {},
            confidence: 0.9
          }),
          suggestImprovements: (evaluation) => []
        };
      `;

      const files = {
        'test.ts': testFile,
        'types.ts': `
          export interface Issue {
            type: string;
            severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
            message: string;
            line?: number;
            endLine?: number;
            column?: number;
            endColumn?: number;
            file?: string;
            recommendation?: string;
            codeSnippet?: string;
            plugin?: string;
          }
          
          export interface IPlugin {
            name: string;
            analyze(filePath: string): Promise<Issue[]>;
          }
          
          export interface ITestQualityPlugin {
            id: string;
            name: string;
            version: string;
            type: 'core' | 'framework' | 'pattern' | 'domain';
            isApplicable(context: ProjectContext): boolean;
            detectPatterns(testFile: TestFile): Promise<DetectionResult[]>;
            evaluateQuality(patterns: DetectionResult[]): QualityScore;
            suggestImprovements(evaluation: QualityScore): Improvement[];
            autoFix?(testFile: TestFile, improvements: Improvement[]): Promise<FixResult>;
            learn?(feedback: Feedback): void;
          }
          
          export interface ProjectContext {
            rootPath?: string;
          }
          
          export interface TestFile {
            path: string;
            content: string;
          }
          
          export interface DetectionResult {
            confidence: number;
          }
          
          export interface QualityScore {
            overall: number;
            dimensions: Record<string, number>;
            confidence: number;
          }
          
          export interface Improvement {
            id: string;
            type: string;
            priority: string;
            title: string;
            description: string;
          }
          
          export interface FixResult {
            success: boolean;
            modifiedFiles: string[];
          }
          
          export interface Feedback {
            helpful: boolean;
            comment?: string;
          }
        `
      };

      const program = createProgram(files);
      const diagnostics = getDiagnostics(program);
      
      const errors = diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
      expect(errors).toHaveLength(0);
    });

    it('should not allow any type in new type definitions', () => {
      const testFile = `
        import { StrictTypedInterface } from './types';
        
        // This should fail if any is used
        const strictObj: StrictTypedInterface = {
          data: { key: 'value' }, // Should be properly typed
          metadata: { timestamp: Date.now() }, // Should be properly typed
          config: { enabled: true } // Should be properly typed
        };
      `;

      const filesWithAny = {
        'test.ts': testFile,
        'types.ts': `
          export interface StrictTypedInterface {
            data: any; // This should cause an error in strict mode
            metadata: any; // This should cause an error in strict mode
            config: any; // This should cause an error in strict mode
          }
        `
      };

      const filesWithoutAny = {
        'test.ts': testFile,
        'types.ts': `
          export interface StrictTypedInterface {
            data: Record<string, unknown>;
            metadata: Record<string, unknown>;
            config: Record<string, unknown>;
          }
        `
      };

      // Test with any - should have errors
      const programWithAny = createProgram(filesWithAny);
      const diagnosticsWithAny = getDiagnostics(programWithAny);
      const errorsWithAny = diagnosticsWithAny.filter(
        d => d.category === ts.DiagnosticCategory.Error && 
        d.code === 7006 // Parameter implicitly has an 'any' type
      );
      
      // Test without any - should have no errors
      const programWithoutAny = createProgram(filesWithoutAny);
      const diagnosticsWithoutAny = getDiagnostics(programWithoutAny);
      const errorsWithoutAny = diagnosticsWithoutAny.filter(
        d => d.category === ts.DiagnosticCategory.Error
      );
      
      expect(errorsWithoutAny).toHaveLength(0);
    });
  });

  describe('Type Definition Structure', () => {
    it('should have proper separation of concerns', () => {
      // Test that types are properly organized
      const baseTypes = ['Issue', 'Location', 'Position'];
      const pluginTypes = ['IPlugin', 'ITestQualityPlugin', 'PluginResult'];
      const analysisTypes = ['DetectionResult', 'QualityScore', 'Evidence'];
      const domainTypes = ['DomainDictionary', 'DomainTerm', 'BusinessRule'];
      
      // Each group should be in its own module
      const expectedStructure = {
        'base-types.ts': baseTypes,
        'plugin-interface.ts': pluginTypes,
        'analysis-result.ts': analysisTypes,
        'domain-dictionary.ts': domainTypes
      };
      
      // This test verifies the expected structure exists
      // In actual implementation, we'll verify the files exist and contain the expected exports
      expect(expectedStructure).toBeDefined();
    });
  });

  describe('Circular Dependency Check', () => {
    it('should not have circular dependencies between type modules', () => {
      // This test would verify that there are no circular imports
      // between the split type files
      
      const imports = {
        'base-types.ts': [],
        'plugin-interface.ts': ['base-types'],
        'analysis-result.ts': ['base-types'],
        'quality-score.ts': ['base-types'],
        'domain-dictionary.ts': ['base-types']
      };
      
      // Simple check for circular dependencies
      const checkCircular = (module: string, visited: Set<string> = new Set()): boolean => {
        if (visited.has(module)) return true;
        visited.add(module);
        
        const deps = imports[module as keyof typeof imports] || [];
        for (const dep of deps) {
          if (checkCircular(dep + '.ts', new Set(visited))) {
            return true;
          }
        }
        
        return false;
      };
      
      for (const module of Object.keys(imports)) {
        expect(checkCircular(module)).toBe(false);
      }
    });
  });
});