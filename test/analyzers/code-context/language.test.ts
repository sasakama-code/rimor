import { LanguageAnalyzer } from '../../../src/analyzers/code-context/language';
import * as fs from 'fs';

jest.mock('fs');

describe('LanguageAnalyzer', () => {
  let analyzer: LanguageAnalyzer;

  beforeEach(() => {
    analyzer = new LanguageAnalyzer();
    jest.clearAllMocks();
  });

  describe('detectLanguage', () => {
    it('should detect TypeScript from .ts extension', () => {
      const language = analyzer.detectLanguage('/test/file.ts');
      expect(language).toBe('typescript');
    });

    it('should detect JavaScript from .js extension', () => {
      const language = analyzer.detectLanguage('/test/file.js');
      expect(language).toBe('javascript');
    });

    it('should detect React JSX from .jsx extension', () => {
      const language = analyzer.detectLanguage('/test/file.jsx');
      expect(language).toBe('javascriptreact');
    });

    it('should detect React TSX from .tsx extension', () => {
      const language = analyzer.detectLanguage('/test/file.tsx');
      expect(language).toBe('typescriptreact');
    });

    it('should return unknown for unsupported extensions', () => {
      const language = analyzer.detectLanguage('/test/file.xyz');
      expect(language).toBe('unknown');
    });
  });

  describe('extractFunctionInfo', () => {
    it('should extract function information from TypeScript code', async () => {
      const code = `
        function testFunction(param1: string, param2: number): void {
          console.log(param1, param2);
        }
        
        const arrowFunc = (x: number) => x * 2;
      `;
      
      const functions = await analyzer.extractFunctionInfo(code, 'typescript');
      
      expect(functions).toBeInstanceOf(Array);
      expect(functions.length).toBeGreaterThan(0);
      expect(functions[0]).toHaveProperty('name');
      expect(functions[0]).toHaveProperty('parameters');
      expect(functions[0]).toHaveProperty('returnType');
    });

    it('should handle async functions', async () => {
      const code = `
        async function fetchData(): Promise<string> {
          return "data";
        }
      `;
      
      const functions = await analyzer.extractFunctionInfo(code, 'typescript');
      
      expect(functions.length).toBe(1);
      expect(functions[0].async).toBe(true);
    });
  });

  describe('extractClassInfo', () => {
    it('should extract class information from TypeScript code', () => {
      const code = `
        class TestClass {
          private property: string;
          
          constructor(value: string) {
            this.property = value;
          }
          
          public method(): void {
            console.log(this.property);
          }
        }
      `;
      
      const classes = analyzer.extractClassInfo(code, 'typescript');
      
      expect(classes).toBeInstanceOf(Array);
      expect(classes.length).toBe(1);
      expect(classes[0]).toHaveProperty('name', 'TestClass');
      expect(classes[0]).toHaveProperty('methods');
      expect(classes[0]).toHaveProperty('properties');
    });

    it('should handle class inheritance', () => {
      const code = `
        class BaseClass {}
        class DerivedClass extends BaseClass {}
      `;
      
      const classes = analyzer.extractClassInfo(code, 'typescript');
      
      expect(classes.length).toBe(2);
      expect(classes[1].extends).toBe('BaseClass');
    });
  });

  describe('extractInterfaceInfo', () => {
    it('should extract interface information from TypeScript code', () => {
      const code = `
        interface User {
          id: number;
          name: string;
          email?: string;
        }
        
        interface Admin extends User {
          permissions: string[];
        }
      `;
      
      const interfaces = analyzer.extractInterfaceInfo(code, 'typescript');
      
      expect(interfaces).toBeInstanceOf(Array);
      expect(interfaces.length).toBe(2);
      expect(interfaces[0]).toHaveProperty('name', 'User');
      expect(interfaces[0]).toHaveProperty('properties');
    });
  });

  describe('extractVariableInfo', () => {
    it('should extract variable information from TypeScript code', () => {
      const code = `
        const constant: string = "value";
        let mutable: number = 42;
        var oldStyle = true;
      `;
      
      const variables = analyzer.extractVariableInfo(code, 'typescript');
      
      expect(variables).toBeInstanceOf(Array);
      expect(variables.length).toBe(3);
      expect(variables[0]).toHaveProperty('name');
      expect(variables[0]).toHaveProperty('type');
      expect(variables[0]).toHaveProperty('kind');
    });
  });

  describe('extractImports', () => {
    it('should extract import statements', () => {
      const code = `
        import { Component } from '@angular/core';
        import * as fs from 'fs';
        import defaultExport from './module';
      `;
      
      const imports = analyzer.extractImports(code, 'typescript');
      
      expect(imports).toBeInstanceOf(Array);
      expect(imports.length).toBe(3);
      expect(imports[0]).toHaveProperty('source', '@angular/core');
    });
  });

  describe('extractExports', () => {
    it('should extract export statements', () => {
      const code = `
        export const value = 42;
        export { MyClass } from './class';
        export default function() {}
      `;
      
      const exports = analyzer.extractExports(code, 'typescript');
      
      expect(exports).toBeInstanceOf(Array);
      expect(exports.length).toBeGreaterThan(0);
    });
  });
});
