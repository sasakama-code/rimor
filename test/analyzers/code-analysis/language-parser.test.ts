import { LanguageAnalyzer } from '../../../src/analyzers/code-analysis/language-parser';
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
      expect(functions[0].isAsync).toBe(true);
    });

    it('should extract function information from TypeScript React (TSX) code', async () => {
      const code = `
        import React from 'react';
        
        function TestComponent(props: { title: string }): JSX.Element {
          const handleClick = () => {
            console.log('clicked');
          };
          
          return <div onClick={handleClick}>{props.title}</div>;
        }
        
        const ArrowComponent = (props: { value: number }) => {
          return <span>{props.value}</span>;
        };
      `;
      
      const functions = await analyzer.extractFunctionInfo(code, 'typescriptreact');
      
      expect(functions).toBeInstanceOf(Array);
      expect(functions.length).toBeGreaterThan(0);
      expect(functions.some(f => f.name === 'TestComponent')).toBe(true);
      expect(functions.some(f => f.name === 'ArrowComponent')).toBe(true);
    });

    it('should extract function information from JavaScript React (JSX) code', async () => {
      const code = `
        import React from 'react';
        
        function TestComponent(props) {
          const handleClick = () => {
            console.log('clicked');
          };
          
          return <div onClick={handleClick}>{props.title}</div>;
        }
        
        const ArrowComponent = (props) => {
          return <span>{props.value}</span>;
        };
      `;
      
      const functions = await analyzer.extractFunctionInfo(code, 'javascriptreact');
      
      expect(functions).toBeInstanceOf(Array);
      expect(functions.length).toBeGreaterThan(0);
      expect(functions.some(f => f.name === 'TestComponent')).toBe(true);
      expect(functions.some(f => f.name === 'ArrowComponent')).toBe(true);
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

    it('should extract class information from TypeScript React (TSX) code', () => {
      const code = `
        import React, { Component } from 'react';
        
        interface Props {
          title: string;
        }
        
        class TestComponent extends Component<Props> {
          private state = { count: 0 };
          
          handleClick = () => {
            this.setState({ count: this.state.count + 1 });
          };
          
          render() {
            return <div onClick={this.handleClick}>{this.props.title}: {this.state.count}</div>;
          }
        }
      `;
      
      const classes = analyzer.extractClassInfo(code, 'typescriptreact');
      
      expect(classes).toBeInstanceOf(Array);
      expect(classes.length).toBe(1);
      expect(classes[0]).toHaveProperty('name', 'TestComponent');
      expect(classes[0]).toHaveProperty('extends', 'Component');
    });

    it('should extract class information from JavaScript React (JSX) code', () => {
      const code = `
        import React, { Component } from 'react';
        
        class TestComponent extends Component {
          constructor(props) {
            super(props);
            this.state = { count: 0 };
          }
          
          handleClick = () => {
            this.setState({ count: this.state.count + 1 });
          };
          
          render() {
            return <div onClick={this.handleClick}>{this.props.title}: {this.state.count}</div>;
          }
        }
      `;
      
      const classes = analyzer.extractClassInfo(code, 'javascriptreact');
      
      expect(classes).toBeInstanceOf(Array);
      expect(classes.length).toBe(1);
      expect(classes[0]).toHaveProperty('name', 'TestComponent');
      expect(classes[0]).toHaveProperty('extends', 'Component');
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

    it('should extract interface information from TypeScript React (TSX) code', () => {
      const code = `
        import React from 'react';
        
        interface ComponentProps {
          title: string;
          count: number;
          onUpdate?: (value: number) => void;
        }
        
        interface ComponentState {
          loading: boolean;
          error: string | null;
        }
        
        interface Theme {
          primary: string;
          secondary: string;
        }
      `;
      
      const interfaces = analyzer.extractInterfaceInfo(code, 'typescriptreact');
      
      expect(interfaces).toBeInstanceOf(Array);
      expect(interfaces.length).toBe(3);
      expect(interfaces.some(i => i.name === 'ComponentProps')).toBe(true);
      expect(interfaces.some(i => i.name === 'ComponentState')).toBe(true);
      expect(interfaces.some(i => i.name === 'Theme')).toBe(true);
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

    it('should extract variable information from TypeScript React (TSX) code', () => {
      const code = `
        import React, { useState } from 'react';
        
        const initialState: number = 0;
        let componentRef: HTMLDivElement | null = null;
        
        function App() {
          const [count, setCount] = useState(initialState);
          const isDark: boolean = true;
          var theme = 'dark';
          
          return <div ref={componentRef}>{count}</div>;
        }
      `;
      
      const variables = analyzer.extractVariableInfo(code, 'typescriptreact');
      
      expect(variables).toBeInstanceOf(Array);
      expect(variables.length).toBeGreaterThan(0);
      expect(variables.some(v => v.name === 'initialState')).toBe(true);
      expect(variables.some(v => v.name === 'componentRef')).toBe(true);
    });

    it('should extract variable information from JavaScript React (JSX) code', () => {
      const code = `
        import React, { useState } from 'react';
        
        const initialState = 0;
        let componentRef = null;
        
        function App() {
          const [count, setCount] = useState(initialState);
          const isDark = true;
          var theme = 'dark';
          
          return <div ref={componentRef}>{count}</div>;
        }
      `;
      
      const variables = analyzer.extractVariableInfo(code, 'javascriptreact');
      
      expect(variables).toBeInstanceOf(Array);
      expect(variables.length).toBeGreaterThan(0);
      expect(variables.some(v => v.name === 'initialState')).toBe(true);
      expect(variables.some(v => v.name === 'componentRef')).toBe(true);
    });

    // Issue #108: Variable scope determination tests
    describe('Variable Scope Detection (Issue #108)', () => {
      it('should correctly identify global scope variables', () => {
        const code = `
          const globalConst = "value";
          let globalLet = 42;
          var globalVar = true;
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        expect(variables).toHaveLength(3);
        expect(variables.every(v => v.scope === 'global')).toBe(true);
        expect(variables.find(v => v.name === 'globalConst')?.scope).toBe('global');
        expect(variables.find(v => v.name === 'globalLet')?.scope).toBe('global');
        expect(variables.find(v => v.name === 'globalVar')?.scope).toBe('global');
      });

      it('should correctly identify function scope variables', () => {
        const code = `
          function testFunction() {
            const funcConst = "value";
            let funcLet = 42;
            var funcVar = true;
          }
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        expect(variables).toHaveLength(3);
        expect(variables.every(v => v.scope === 'local')).toBe(true);
        expect(variables.find(v => v.name === 'funcConst')?.scope).toBe('local');
        expect(variables.find(v => v.name === 'funcLet')?.scope).toBe('local');
        expect(variables.find(v => v.name === 'funcVar')?.scope).toBe('local');
      });

      it('should correctly identify class scope variables', () => {
        const code = `
          class TestClass {
            private classPrivate = "private";
            public classPublic = "public";
            
            constructor() {
              const constructorConst = "value";
              let constructorLet = 42;
            }
          }
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        const privateVar = variables.find(v => v.name === 'classPrivate');
        const publicVar = variables.find(v => v.name === 'classPublic');
        const constructorConstVar = variables.find(v => v.name === 'constructorConst');
        const constructorLetVar = variables.find(v => v.name === 'constructorLet');

        expect(privateVar?.scope).toBe('local'); // Class scope
        expect(publicVar?.scope).toBe('local'); // Class scope
        expect(constructorConstVar?.scope).toBe('local'); // Function scope
        expect(constructorLetVar?.scope).toBe('local'); // Function scope
      });

      it('should correctly identify nested scope variables', () => {
        const code = `
          const globalVar = "global";
          
          function outerFunction() {
            const outerVar = "outer";
            
            function innerFunction() {
              const innerVar = "inner";
            }
            
            if (true) {
              const blockVar = "block";
            }
          }
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        const globalVar = variables.find(v => v.name === 'globalVar');
        const outerVar = variables.find(v => v.name === 'outerVar');
        const innerVar = variables.find(v => v.name === 'innerVar');
        const blockVar = variables.find(v => v.name === 'blockVar');

        expect(globalVar?.scope).toBe('global');
        expect(outerVar?.scope).toBe('local');
        expect(innerVar?.scope).toBe('local');
        expect(blockVar?.scope).toBe('local'); // Block scope variables are treated as local in our implementation
      });

      it('should correctly identify arrow function scope variables', () => {
        const code = `
          const arrowFunc = (param: string) => {
            const arrowVar = "arrow";
            let arrowLet = 42;
          };
          
          const simpleArrow = (x: number) => x * 2;
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        const arrowFuncVar = variables.find(v => v.name === 'arrowFunc');
        const simpleArrowVar = variables.find(v => v.name === 'simpleArrow');
        const arrowVar = variables.find(v => v.name === 'arrowVar');
        const arrowLet = variables.find(v => v.name === 'arrowLet');

        expect(arrowFuncVar?.scope).toBe('global'); // Declaration at global scope
        expect(simpleArrowVar?.scope).toBe('global'); // Declaration at global scope
        expect(arrowVar?.scope).toBe('local'); // Inside arrow function
        expect(arrowLet?.scope).toBe('local'); // Inside arrow function
      });

      it('should handle array destructuring with proper scope', () => {
        const code = `
          const [globalA, globalB] = [1, 2];
          
          function testFunc() {
            const [localA, localB] = [3, 4];
          }
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        const globalA = variables.find(v => v.name === 'globalA');
        const globalB = variables.find(v => v.name === 'globalB');
        const localA = variables.find(v => v.name === 'localA');
        const localB = variables.find(v => v.name === 'localB');

        expect(globalA?.scope).toBe('global');
        expect(globalB?.scope).toBe('global');
        expect(localA?.scope).toBe('local');
        expect(localB?.scope).toBe('local');
      });

      it('should handle object destructuring with proper scope', () => {
        const code = `
          const { globalName, globalEmail } = user;
          
          function testFunc() {
            const { localName, localEmail } = localUser;
          }
        `;
        
        const variables = analyzer.extractVariableInfo(code, 'typescript');
        
        const globalName = variables.find(v => v.name === 'globalName');
        const globalEmail = variables.find(v => v.name === 'globalEmail');
        const localName = variables.find(v => v.name === 'localName');
        const localEmail = variables.find(v => v.name === 'localEmail');

        expect(globalName?.scope).toBe('global');
        expect(globalEmail?.scope).toBe('global');
        expect(localName?.scope).toBe('local');
        expect(localEmail?.scope).toBe('local');
      });
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

  // Issue #109 - Enhanced export detection tests  
  describe('extractExports (Issue #109)', () => {
    describe('Named exports', () => {
      it('should extract const/let/var exports', () => {
        const code = `
          export const CONSTANT_VALUE = 42;
          export let variableValue = "test";
          export var oldStyleVar = true;
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['CONSTANT_VALUE', 'variableValue', 'oldStyleVar']);
      });

      it('should extract function exports', () => {
        const code = `
          export function normalFunction() {}
          export async function asyncFunction() {}
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['normalFunction', 'asyncFunction']);
      });

      it('should extract class exports', () => {
        const code = `
          export class MyClass {}
          export abstract class AbstractClass {}
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['MyClass', 'AbstractClass']);
      });

      it('should extract type/interface exports (TypeScript)', () => {
        const code = `
          export type MyType = string;
          export interface MyInterface {}
          export enum MyEnum {}
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['MyType', 'MyInterface', 'MyEnum']);
      });
    });

    describe('Default exports', () => {
      it('should extract named default exports', () => {
        const code = `
          export default function namedFunction() {}
          export default class NamedClass {}
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toContain('namedFunction');
        expect(exports).toContain('NamedClass');
      });

      it('should handle anonymous default exports', () => {
        const code = `
          export default function() {}
          export default class {}
          export default 42;
          export default "anonymous";
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toContain('default');
        expect(exports.filter(e => e === 'default')).toHaveLength(4);
      });
    });

    describe('Braced exports', () => {
      it('should extract braced exports without aliases', () => {
        const code = `
          export { foo, bar, baz };
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['foo', 'bar', 'baz']);
      });

      it('should extract braced exports with aliases', () => {
        const code = `
          export { foo as bar, baz as qux };
          export { original as renamed, another };
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toContain('bar');
        expect(exports).toContain('qux');
        expect(exports).toContain('renamed');
        expect(exports).toContain('another');
        expect(exports).not.toContain('foo');
        expect(exports).not.toContain('baz');
        expect(exports).not.toContain('original');
      });

      it('should handle mixed braced exports', () => {
        const code = `
          export { normal, renamed as alias, another };
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['normal', 'alias', 'another']);
      });
    });

    describe('Re-exports', () => {
      it('should extract re-exports with aliases', () => {
        const code = `
          export { foo, bar as baz } from './module';
          export { Component as MyComponent } from 'react';
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toContain('foo');
        expect(exports).toContain('baz');
        expect(exports).toContain('MyComponent');
        expect(exports).not.toContain('bar');
        expect(exports).not.toContain('Component');
      });

      it('should handle star re-exports', () => {
        const code = `
          export * from './module';
          export * as Utils from './utils';
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toContain('Utils');
      });
    });

    describe('CommonJS exports', () => {
      it('should extract CommonJS property exports', () => {
        const code = `
          exports.foo = "value";
          exports.bar = function() {};
          module.exports.baz = 42;
        `;
        
        const exports = analyzer.extractExports(code, 'javascript');
        
        expect(exports).toEqual(['foo', 'bar', 'baz']);
      });

      it('should extract CommonJS object assignment', () => {
        const code = `
          module.exports = { foo, bar, baz };
          exports = { qux, quux };
        `;
        
        const exports = analyzer.extractExports(code, 'javascript');
        
        expect(exports).toEqual(['foo', 'bar', 'baz', 'qux', 'quux']);
      });

      it('should handle complex CommonJS patterns', () => {
        const code = `
          module.exports = {
            method1: function() {},
            method2: () => {},
            constant: 42,
            nested: { value: true }
          };
        `;
        
        const exports = analyzer.extractExports(code, 'javascript');
        
        expect(exports).toContain('method1');
        expect(exports).toContain('method2');
        expect(exports).toContain('constant');
        expect(exports).toContain('nested');
      });

      it('should handle CommonJS function/class assignment', () => {
        const code = `
          module.exports = function MyFunction() {};
          module.exports = class MyClass {};
          exports = MyExportedVariable;
        `;
        
        const exports = analyzer.extractExports(code, 'javascript');
        
        expect(exports).toContain('MyFunction');
        expect(exports).toContain('MyClass');
        expect(exports).toContain('MyExportedVariable');
      });
    });

    describe('Edge cases', () => {
      it('should handle multiline exports', () => {
        const code = `
          export {
            foo,
            bar as baz,
            qux
          } from './module';
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['foo', 'baz', 'qux']);
      });

      it('should ignore comments and strings', () => {
        const code = `
          // export const commentedOut = "fake";
          /* export function blockCommented() {} */
          const normalString = "export const notAnExport = true;";
          export const realExport = 42;
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['realExport']);
      });

      it('should handle exports with TypeScript type annotations', () => {
        const code = `
          export const typedConstant: string = "value";
          export function typedFunction(param: number): string { return ""; }
          export class TypedClass implements MyInterface {}
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toEqual(['typedConstant', 'typedFunction', 'TypedClass']);
      });

      it('should handle nested destructuring in exports', () => {
        const code = `
          export const { foo, bar: { nested } } = complexObject;
          export const [first, second] = arrayValue;
        `;
        
        const exports = analyzer.extractExports(code, 'typescript');
        
        expect(exports).toContain('foo');
        expect(exports).toContain('nested');
        expect(exports).toContain('first');
        expect(exports).toContain('second');
      });
    });

    describe('Language-specific behavior', () => {
      it('should handle JSX component exports', () => {
        const code = `
          export function MyComponent(props: Props) {
            return <div>{props.children}</div>;
          }
          export const ArrowComponent = (props) => <span>{props.value}</span>;
        `;
        
        const exports = analyzer.extractExports(code, 'typescriptreact');
        
        expect(exports).toEqual(['MyComponent', 'ArrowComponent']);
      });

      it('should not extract TypeScript-specific syntax in JavaScript', () => {
        const code = `
          export const value = 42;
          // Note: type and interface should not be recognized in JavaScript
          // export type MyType = string;  // This would be syntax error in JS
        `;
        
        const jsExports = analyzer.extractExports(code, 'javascript');
        const tsExports = analyzer.extractExports(code, 'typescript');
        
        expect(jsExports).toEqual(['value']);
        expect(tsExports).toEqual(['value']);
      });
    });
  });

  describe('parseLanguageSpecificFeatures', () => {
    it('should parse language-specific features for TypeScript React (TSX) code', () => {
      const code = `
        import React from 'react';
        
        @Component
        class TestComponent<T> {
          async fetchData(): Promise<T> {
            return Promise.resolve();
          }
          
          render() {
            return <div>Hello World</div>;
          }
        }
      `;
      
      const features = analyzer.parseLanguageSpecificFeatures(code, 'typescriptreact');
      
      expect(features).toHaveProperty('language', 'typescriptreact');
      expect(features).toHaveProperty('hasAsync', true);
      expect(features).toHaveProperty('hasGenerics', true);
      expect(features).toHaveProperty('hasDecorators', true);
      expect(features).toHaveProperty('hasJSX', true);
    });

    it('should parse language-specific features for JavaScript React (JSX) code', () => {
      const code = `
        import React from 'react';
        
        function TestComponent(props) {
          const handleClick = async () => {
            await fetch('/api/data');
          };
          
          return (
            <div onClick={handleClick}>
              <span>Hello World</span>
            </div>
          );
        }
      `;
      
      const features = analyzer.parseLanguageSpecificFeatures(code, 'javascriptreact');
      
      expect(features).toHaveProperty('language', 'javascriptreact');
      expect(features).toHaveProperty('hasAsync', true);
      expect(features).toHaveProperty('hasGenerics', false);
      expect(features).toHaveProperty('hasDecorators', false);
      expect(features).toHaveProperty('hasJSX', true);
    });
  });
});
