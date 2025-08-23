/**
 * TypeScript Analyzer Test
 * v0.9.0 Phase 2 - TDD Red Phase
 */

import { TypeScriptAnalyzer } from '../../src/intent-analysis/TypeScriptAnalyzer';
import { TypeInfo, MockInfo, CallGraphNode } from '../../src/intent-analysis/ITypeScriptAnalyzer';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('TypeScriptAnalyzer', () => {
  let analyzer: TypeScriptAnalyzer;
  let tempDir: string;
  
  beforeAll(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = path.join(os.tmpdir(), 'ts-analyzer-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    
    // tsconfig.jsonを作成
    const tsConfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      }
    };
    await fs.writeFile(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    analyzer = new TypeScriptAnalyzer();
  });
  
  afterAll(async () => {
    // 一時ディレクトリをクリーンアップ
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('初期化', () => {
    it('TypeScriptプロジェクトを初期化できること', async () => {
      // Act
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Assert
      expect(analyzer.isInitialized()).toBe(true);
    });
  });
  
  describe('型情報の取得', () => {
    it('変数の型情報を取得できること', async () => {
      // Arrange
      const testFile = path.join(tempDir, 'test-types.ts');
      const content = `
        const numberValue: number = 42;
        const stringValue: string = "hello";
        const booleanValue: boolean = true;
        const arrayValue: number[] = [1, 2, 3];
      `;
      await fs.writeFile(testFile, content);
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const numberType = await analyzer.getTypeInfo(testFile, content.indexOf('numberValue'));
      const stringType = await analyzer.getTypeInfo(testFile, content.indexOf('stringValue'));
      const booleanType = await analyzer.getTypeInfo(testFile, content.indexOf('booleanValue'));
      const arrayType = await analyzer.getTypeInfo(testFile, content.indexOf('arrayValue'));
      
      // Assert
      expect(numberType?.typeName).toBe('number');
      expect(numberType?.isPrimitive).toBe(true);
      
      expect(stringType?.typeName).toBe('string');
      expect(stringType?.isPrimitive).toBe(true);
      
      expect(booleanType?.typeName).toBe('boolean');
      expect(booleanType?.isPrimitive).toBe(true);
      
      expect(arrayType?.typeName).toBe('Array');
      expect(arrayType?.typeArguments?.[0]?.typeName).toBe('number');
    });
    
    it('関数の型情報を取得できること', async () => {
      // Arrange
      const testFile = path.join(tempDir, 'test-functions.ts');
      const content = `
        function add(a: number, b: number): number {
          return a + b;
        }
        
        const multiply = (x: number, y: number): number => x * y;
      `;
      await fs.writeFile(testFile, content);
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const addType = await analyzer.getTypeInfo(testFile, content.indexOf('add'));
      const multiplyType = await analyzer.getTypeInfo(testFile, content.indexOf('multiply'));
      
      // Assert
      expect(addType?.functionSignature).toBeDefined();
      expect(addType?.functionSignature?.parameters).toHaveLength(2);
      expect(addType?.functionSignature?.returnType.typeName).toBe('number');
      
      expect(multiplyType?.functionSignature).toBeDefined();
      expect(multiplyType?.functionSignature?.parameters).toHaveLength(2);
    });
  });
  
  describe('呼び出しグラフの構築', () => {
    it('関数の呼び出し関係を解析できること', async () => {
      // Arrange
      const testFile = path.join(tempDir, 'test-call-graph.ts');
      const content = `
        function main() {
          const result = calculate(10, 20);
          log(result);
        }
        
        function calculate(a: number, b: number): number {
          return add(a, b);
        }
        
        function add(x: number, y: number): number {
          return x + y;
        }
        
        function log(value: any): void {
          console.log(value);
        }
      `;
      await fs.writeFile(testFile, content);
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const callGraph = await analyzer.buildCallGraph(testFile);
      
      // Assert
      const mainNode = callGraph.find(node => node.name === 'main');
      expect(mainNode).toBeDefined();
      expect(mainNode?.calls).toHaveLength(2); // calculate, log
      
      const calculateNode = callGraph.find(node => node.name === 'calculate');
      expect(calculateNode?.calls).toHaveLength(1); // add
      expect(calculateNode?.calledBy).toContainEqual(expect.objectContaining({ name: 'main' }));
    });
  });
  
  describe('モック検出', () => {
    it('Jest mockの使用を検出できること', async () => {
      // Arrange
      const testFile = path.join(tempDir, 'test-mocks.test.ts');
      const content = `
        import { someFunction } from './module';
        
        jest.mock('./module');
        
        describe('Mock Test', () => {
          it('should use mocked function', () => {
            const mockFn = jest.fn().mockReturnValue(42);
            (someFunction as jest.Mock) = mockFn;
            
            expect(someFunction()).toBe(42);
          });
        });
      `;
      await fs.writeFile(testFile, content);
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const mocks = await analyzer.detectMocks(testFile);
      
      // Assert
      expect(mocks).toHaveLength(2); // jest.mock, jest.fn
      
      const moduleMock = mocks.find(m => m.mockType === 'jest.mock');
      expect(moduleMock?.mockedTarget).toBe('./module');
      
      const fnMock = mocks.find(m => m.mockType === 'jest.fn');
      expect(fnMock?.hasImplementation).toBe(true);
    });
  });
  
  describe('型の互換性チェック', () => {
    it('互換性のある型を正しく判定できること', async () => {
      // Arrange
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      const numberType: TypeInfo = { typeName: 'number', isPrimitive: true };
      const stringType: TypeInfo = { typeName: 'string', isPrimitive: true };
      const anyType: TypeInfo = { typeName: 'any', isPrimitive: false };
      
      // Act & Assert
      expect(analyzer.checkTypeCompatibility(numberType, numberType)).toBe(true);
      expect(analyzer.checkTypeCompatibility(numberType, stringType)).toBe(false);
      expect(analyzer.checkTypeCompatibility(numberType, anyType)).toBe(true);
      expect(analyzer.checkTypeCompatibility(anyType, numberType)).toBe(true);
    });
  });
});