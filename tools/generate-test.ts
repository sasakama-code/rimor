#!/usr/bin/env node
/**
 * テスト自動生成ツール
 * インターフェースや関数から自動的にテストケースを生成
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface TestCase {
  name: string;
  input: any;
  expected: any;
  type: 'normal' | 'edge' | 'error';
}

interface GeneratedTest {
  modulePath: string;
  testPath: string;
  testCases: TestCase[];
  imports: string[];
}

export class TestGenerator {
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor(private configPath: string = 'tsconfig.json') {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath)
    );

    this.program = ts.createProgram(
      parsedConfig.fileNames,
      parsedConfig.options
    );
    this.checker = this.program.getTypeChecker();
  }

  /**
   * モジュールからテストを生成
   */
  generateTestsForModule(modulePath: string): GeneratedTest {
    const sourceFile = this.program.getSourceFile(modulePath);
    if (!sourceFile) {
      throw new Error(`Cannot find source file: ${modulePath}`);
    }

    const testCases: TestCase[] = [];
    const imports: Set<string> = new Set();

    // 関数とメソッドを探す
    ts.forEachChild(sourceFile, node => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const cases = this.generateTestCasesForFunction(node);
        testCases.push(...cases);
        imports.add(node.name.text);
      } else if (ts.isClassDeclaration(node) && node.name) {
        const cases = this.generateTestCasesForClass(node);
        testCases.push(...cases);
        imports.add(node.name.text);
      } else if (ts.isInterfaceDeclaration(node)) {
        const cases = this.generateTestCasesForInterface(node);
        testCases.push(...cases);
      }
    });

    const testPath = this.getTestPath(modulePath);

    return {
      modulePath,
      testPath,
      testCases,
      imports: Array.from(imports)
    };
  }

  /**
   * 関数のテストケース生成
   */
  private generateTestCasesForFunction(func: ts.FunctionDeclaration): TestCase[] {
    const cases: TestCase[] = [];
    const funcName = func.name?.text || 'anonymous';
    const params = func.parameters;

    // 通常ケース
    cases.push({
      name: `should return expected value for valid input`,
      input: this.generateValidInput(params),
      expected: this.generateExpectedOutput(func),
      type: 'normal'
    });

    // エッジケース
    cases.push({
      name: `should handle edge cases`,
      input: this.generateEdgeCaseInput(params),
      expected: this.generateEdgeCaseOutput(func),
      type: 'edge'
    });

    // エラーケース
    if (params.length > 0) {
      cases.push({
        name: `should handle invalid input`,
        input: this.generateInvalidInput(params),
        expected: 'Error',
        type: 'error'
      });
    }

    return cases;
  }

  /**
   * クラスのテストケース生成
   */
  private generateTestCasesForClass(cls: ts.ClassDeclaration): TestCase[] {
    const cases: TestCase[] = [];
    const className = cls.name?.text || 'anonymous';

    // コンストラクタテスト
    cases.push({
      name: `should create instance of ${className}`,
      input: {},
      expected: `instanceof ${className}`,
      type: 'normal'
    });

    // メソッドのテスト
    cls.members.forEach(member => {
      if (ts.isMethodDeclaration(member) && member.name) {
        const methodName = member.name.getText();
        cases.push({
          name: `should call ${methodName} method`,
          input: this.generateValidInput(member.parameters),
          expected: 'defined',
          type: 'normal'
        });
      }
    });

    return cases;
  }

  /**
   * インターフェースのテストケース生成
   */
  private generateTestCasesForInterface(iface: ts.InterfaceDeclaration): TestCase[] {
    const cases: TestCase[] = [];
    const ifaceName = iface.name.text;

    // 型ガードテスト
    cases.push({
      name: `should validate ${ifaceName} structure`,
      input: this.generateMockFromInterface(iface),
      expected: true,
      type: 'normal'
    });

    // 必須プロパティテスト
    iface.members.forEach(member => {
      if (ts.isPropertySignature(member) && !member.questionToken) {
        const propName = member.name?.getText();
        cases.push({
          name: `should require ${propName} property`,
          input: { missing: propName },
          expected: false,
          type: 'edge'
        });
      }
    });

    return cases;
  }

  /**
   * 有効な入力を生成
   */
  private generateValidInput(params: ts.NodeArray<ts.ParameterDeclaration>): any {
    const input: any = {};
    
    params.forEach(param => {
      const paramName = param.name.getText();
      const paramType = param.type;
      
      if (paramType) {
        input[paramName] = this.generateValueForType(paramType);
      }
    });

    return input;
  }

  /**
   * エッジケース入力を生成
   */
  private generateEdgeCaseInput(params: ts.NodeArray<ts.ParameterDeclaration>): any {
    const input: any = {};
    
    params.forEach(param => {
      const paramName = param.name.getText();
      const paramType = param.type;
      
      if (paramType) {
        input[paramName] = this.generateEdgeValueForType(paramType);
      }
    });

    return input;
  }

  /**
   * 無効な入力を生成
   */
  private generateInvalidInput(params: ts.NodeArray<ts.ParameterDeclaration>): any {
    return params.length > 0 ? null : undefined;
  }

  /**
   * 期待される出力を生成
   */
  private generateExpectedOutput(func: ts.FunctionDeclaration): any {
    const returnType = func.type;
    
    if (returnType) {
      return this.generateValueForType(returnType);
    }
    
    return undefined;
  }

  /**
   * エッジケースの出力を生成
   */
  private generateEdgeCaseOutput(func: ts.FunctionDeclaration): any {
    const returnType = func.type;
    
    if (returnType) {
      return this.generateEdgeValueForType(returnType);
    }
    
    return undefined;
  }

  /**
   * 型から値を生成
   */
  private generateValueForType(type: ts.TypeNode): any {
    const typeText = type.getText();
    
    switch (typeText) {
      case 'string': return 'test-string';
      case 'number': return 42;
      case 'boolean': return true;
      case 'void': return undefined;
      case 'any': return {};
      default:
        if (typeText.includes('[]')) {
          return [];
        }
        if (typeText.includes('|')) {
          // Union型の最初の型を使用
          const firstType = typeText.split('|')[0].trim();
          return this.generateValueForTypeString(firstType);
        }
        return {};
    }
  }

  /**
   * 型文字列から値を生成
   */
  private generateValueForTypeString(typeStr: string): any {
    switch (typeStr) {
      case 'string': return 'test';
      case 'number': return 1;
      case 'boolean': return true;
      case 'null': return null;
      case 'undefined': return undefined;
      default: return {};
    }
  }

  /**
   * エッジケース値を生成
   */
  private generateEdgeValueForType(type: ts.TypeNode): any {
    const typeText = type.getText();
    
    switch (typeText) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'void': return undefined;
      default:
        if (typeText.includes('[]')) {
          return [];
        }
        return null;
    }
  }

  /**
   * インターフェースからモックを生成
   */
  private generateMockFromInterface(iface: ts.InterfaceDeclaration): any {
    const mock: any = {};
    
    iface.members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const propName = member.name?.getText();
        const propType = member.type;
        
        if (propName && propType) {
          mock[propName] = this.generateValueForType(propType);
        }
      }
    });

    return mock;
  }

  /**
   * テストファイルパスを取得
   */
  private getTestPath(modulePath: string): string {
    const parsed = path.parse(modulePath);
    const testDir = path.join('test', path.relative('src', parsed.dir));
    
    return path.join(testDir, `${parsed.name}.test${parsed.ext}`);
  }

  /**
   * テストファイルを生成
   */
  generateTestFile(generatedTest: GeneratedTest): string {
    const { modulePath, testCases, imports } = generatedTest;
    const relativePath = path.relative(
      path.dirname(generatedTest.testPath),
      modulePath.replace('.ts', '')
    ).replace(/\\/g, '/');

    const output: string[] = [];
    
    // ヘッダー
    output.push(`/**
 * Auto-generated test file
 * Generated at: ${new Date().toISOString()}
 * Source: ${modulePath}
 */
`);

    // インポート
    output.push(`import { ${imports.join(', ')} } from '${relativePath}';`);
    output.push('');

    // テストスイート
    output.push(`describe('${path.basename(modulePath, '.ts')}', () => {`);
    
    // Setup
    output.push(`  beforeEach(() => {
    // Test setup
  });
`);

    // テストケース
    const groupedCases = this.groupTestCases(testCases);
    
    for (const [group, cases] of Object.entries(groupedCases)) {
      output.push(`  describe('${group}', () => {`);
      
      cases.forEach(testCase => {
        output.push(`    it('${testCase.name}', () => {`);
        output.push(`      // Arrange`);
        output.push(`      const input = ${JSON.stringify(testCase.input, null, 2).split('\n').join('\n      ')};`);
        output.push(``);
        output.push(`      // Act`);
        output.push(`      // TODO: Call the function/method with input`);
        output.push(``);
        output.push(`      // Assert`);
        
        if (testCase.type === 'error') {
          output.push(`      // expect(() => functionUnderTest(input)).toThrow();`);
        } else {
          output.push(`      // expect(result).toEqual(${JSON.stringify(testCase.expected)});`);
        }
        
        output.push(`    });`);
        output.push(``);
      });
      
      output.push(`  });`);
      output.push(``);
    }

    output.push(`});`);

    return output.join('\n');
  }

  /**
   * テストケースをグループ化
   */
  private groupTestCases(testCases: TestCase[]): Record<string, TestCase[]> {
    const groups: Record<string, TestCase[]> = {
      'Normal cases': [],
      'Edge cases': [],
      'Error cases': []
    };

    testCases.forEach(tc => {
      switch (tc.type) {
        case 'normal':
          groups['Normal cases'].push(tc);
          break;
        case 'edge':
          groups['Edge cases'].push(tc);
          break;
        case 'error':
          groups['Error cases'].push(tc);
          break;
      }
    });

    // 空のグループを削除
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }
}

/**
 * CLI実行
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const modulePath = args[0];
  
  if (!modulePath) {
    console.error('Usage: generate-test <module-path>');
    process.exit(1);
  }

  const generator = new TestGenerator();
  
  try {
    const generatedTest = generator.generateTestsForModule(modulePath);
    const testContent = generator.generateTestFile(generatedTest);
    
    // テストファイルを作成
    const testPath = generatedTest.testPath;
    fs.mkdirSync(path.dirname(testPath), { recursive: true });
    fs.writeFileSync(testPath, testContent);
    
    console.log(`✅ Test file generated: ${testPath}`);
    console.log(`📊 Generated ${generatedTest.testCases.length} test cases`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}