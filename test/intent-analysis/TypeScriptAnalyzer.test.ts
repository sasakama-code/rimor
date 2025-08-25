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

  describe('Program非参加ファイルの型解決 (Issue #106)', () => {
    it('Program外ファイルからのimport型を正確に解決できること', async () => {
      // Arrange
      // 基本型定義ファイルを作成（Program内）
      const typesFile = path.join(tempDir, 'types.ts');
      const typesContent = `
        export interface User {
          id: number;
          name: string;
          email?: string;
        }
        
        export type UserId = number;
        
        export interface ApiResponse<T> {
          data: T;
          status: number;
        }
      `;
      await fs.writeFile(typesFile, typesContent);
      
      // Program外のテストファイルを作成
      const externalFile = path.join(tempDir, 'external.ts');
      const externalContent = `
        import { User, UserId, ApiResponse } from './types';
        
        const user: User = {
          id: 1,
          name: "Test User",
          email: "test@example.com"
        };
        
        const userId: UserId = 123;
        
        const response: ApiResponse<User> = {
          data: user,
          status: 200
        };
      `;
      await fs.writeFile(externalFile, externalContent);
      
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const userType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('user: User'));
      const userIdType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('userId: UserId'));
      const responseType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('response: ApiResponse'));
      
      // Assert - TypeScriptコンパイラの型解決によりimport型が正確に処理される
      // issue #106の改善により、TypeCheckerを通した正確な型情報が取得できる
      expect(userType?.typeName).toBe('User');
      
      // 型エイリアス: TypeScriptは型エイリアスを実際の型に展開することがある
      expect(userIdType?.typeName).toBe('number'); // UserId = numberの展開結果
      
      // ジェネリクス型: 完全な型情報が取得できるようになった
      expect(responseType?.typeName).toBe('ApiResponse<User>');
    });
    
    it('Program外ファイルでの複雑な型エイリアスを正確に解決できること', async () => {
      // Arrange
      const utilsFile = path.join(tempDir, 'utils.ts');
      const utilsContent = `
        export type StringOrNumber = string | number;
        export type Optional<T> = T | undefined;
        export type EventHandler<T = Event> = (event: T) => void;
      `;
      await fs.writeFile(utilsFile, utilsContent);
      
      const externalFile = path.join(tempDir, 'external-complex.ts');
      const externalContent = `
        import { StringOrNumber, Optional, EventHandler } from './utils';
        
        const value: StringOrNumber = "test";
        const optionalValue: Optional<string> = undefined;
        const handler: EventHandler<MouseEvent> = (e) => console.log(e);
      `;
      await fs.writeFile(externalFile, externalContent);
      
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const valueType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('value: StringOrNumber'));
      const optionalType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('optionalValue: Optional'));
      const handlerType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('handler: EventHandler'));
      
      // Assert - TypeCheckerによる正確な型解決が実現
      // Program参加により、型エイリアスが正確に認識される
      expect(valueType?.typeName).toBe('StringOrNumber'); // 型エイリアス名が保持される
      expect(optionalType?.typeName).toBe('Optional<string>'); // ジェネリクス型エイリアスが正確に表示
      expect(handlerType?.typeName).toBe('EventHandler<MouseEvent>'); // 完全な型情報が取得
    });
    
    it('Program外ファイルでの型ガードを正確に解析できること', async () => {
      // Arrange
      const guardsFile = path.join(tempDir, 'guards.ts');
      const guardsContent = `
        export interface Dog {
          breed: string;
          bark(): void;
        }
        
        export interface Cat {
          meow(): void;
        }
        
        export function isDog(animal: Dog | Cat): animal is Dog {
          return 'breed' in animal;
        }
      `;
      await fs.writeFile(guardsFile, guardsContent);
      
      const externalFile = path.join(tempDir, 'external-guards.ts');
      const externalContent = `
        import { Dog, Cat, isDog } from './guards';
        
        function handleAnimal(animal: Dog | Cat) {
          if (isDog(animal)) {
            // この時点でanimalはDog型として扱われるべき
            console.log(animal.breed);
          }
        }
      `;
      await fs.writeFile(externalFile, externalContent);
      
      await analyzer.initialize(path.join(tempDir, 'tsconfig.json'));
      
      // Act
      const isDogType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('isDog(animal)'));
      const animalInGuardType = await analyzer.getTypeInfo(externalFile, externalContent.indexOf('animal.breed'));
      
      // Assert - TypeCheckerによる型ガード関数の正確な解析
      // 型ガード関数の完全な関数シグネチャが取得される
      expect(isDogType?.typeName).toBe('(animal: Dog | Cat) => animal is Dog');
      
      // 型ガード内での型の絞り込みが有効になる
      // animal変数自体がDog型として正確に認識されている
      expect(animalInGuardType?.typeName).toBe('Dog'); // 型ガード内でDog型に絞り込まれている
    });
  });
});