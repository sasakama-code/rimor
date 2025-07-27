import { AdvancedCodeContextAnalyzer } from '../../src/analyzers/code-context';
import { Issue } from '../../src/core/types';
import { AnalysisOptions, ExtractedCodeContext, FunctionInfo, ScopeInfo, VariableInfo, RelatedFileInfo } from '../../src/analyzers/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AdvancedCodeContextAnalyzer', () => {
  let analyzer: any;
  let testProjectPath: string;

  beforeEach(() => {
    analyzer = new AdvancedCodeContextAnalyzer();
    
    // テスト用プロジェクトディレクトリを作成
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-context-test-'));
    
    // 複雑なTypeScriptファイルを作成
    const complexCode = `import { Request, Response } from 'express';
import { UserService } from './services/UserService';
import * as jwt from 'jsonwebtoken';

interface UserData {
  id: number;
  name: string;
  email: string;
}

class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
  
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const user = await this.userService.findById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  async createUser(req: Request, res: Response): Promise<void> {
    const { name, email } = req.body;
    
    // バリデーションロジック
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    
    const newUser = await this.userService.create({ name, email });
    res.status(201).json(newUser);
  }
}

export { UserController };`;

    fs.mkdirSync(path.join(testProjectPath, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testProjectPath, 'src/UserController.ts'), complexCode);
    
    // テストファイルも作成
    const testCode = `import { UserController } from '../src/UserController';
import { Request, Response } from 'express';

describe('UserController', () => {
  let controller: UserController;
  
  beforeEach(() => {
    controller = new UserController();
  });
  
  describe('getUserById', () => {
    it('should return user data when user exists', async () => {
      const req = { params: { id: '1' } } as unknown as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;
      
      await controller.getUserById(req, res);
      
      // Missing proper assertions
    });
  });
});`;

    fs.writeFileSync(path.join(testProjectPath, 'src/UserController.test.ts'), testCode);
    
    // 設定ファイル群
    fs.writeFileSync(path.join(testProjectPath, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        strict: true,
        esModuleInterop: true
      }
    }, null, 2));
    
    fs.writeFileSync(path.join(testProjectPath, 'package.json'), JSON.stringify({
      name: 'test-project',
      dependencies: {
        'express': '^4.18.0',
        'jsonwebtoken': '^9.0.0'
      },
      devDependencies: {
        'jest': '^29.0.0',
        '@types/express': '^4.17.0',
        '@types/jest': '^29.0.0'
      }
    }, null, 2));
  });

  afterEach(() => {
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('Class Instantiation', () => {
    test('should create AdvancedCodeContextAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(AdvancedCodeContextAnalyzer);
    });

    test('should have required public methods', () => {
      expect(typeof analyzer.analyzeCodeContext).toBe('function');
      expect(typeof analyzer.extractFunctionInfo).toBe('function');
      expect(typeof analyzer.analyzeScopeContext).toBe('function');
      expect(typeof analyzer.detectRelatedCode).toBe('function');
    });
  });

  describe('analyzeCodeContext', () => {
    test('should analyze TypeScript file and extract comprehensive context', async () => {
      const issue: Issue = {
        type: 'missing-assertion',
        severity: 'error',
        message: 'Missing proper assertions',
        line: 21,
        file: path.join(testProjectPath, 'src/UserController.test.ts')
      };

      const options: AnalysisOptions = {
        includeImports: true,
        includeExports: true,
        analyzeFunctions: true,
        analyzeClasses: true,
        contextLines: 10
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, options);

      expect(context).toBeDefined();
      expect(context.targetCode.content).toContain('Missing proper assertions');
      expect(context.imports).toHaveLength(2);
      expect(context.imports).toEqual(
        expect.arrayContaining([
          expect.stringContaining('UserController'),
          expect.stringContaining('express')
        ])
      );
      expect(context.functions).toBeDefined();
      expect(context.classes).toBeDefined();
      expect(context.scopes).toBeDefined();
    });

    test('should handle complex TypeScript with classes and interfaces', async () => {
      const issue: Issue = {
        type: 'missing-error-handling',
        severity: 'warning', 
        message: 'Missing error handling',
        line: 20,
        file: path.join(testProjectPath, 'src/UserController.ts')
      };

      const options: AnalysisOptions = {
        includeImports: true,
        analyzeFunctions: true,
        analyzeClasses: true,
        analyzeInterfaces: true
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, options);

      expect(context.classes).toHaveLength(1);
      expect(context.classes[0].name).toBe('UserController');
      expect(context.classes[0].methods).toContain('getUserById');
      expect(context.classes[0].methods).toContain('createUser');
      
      expect(context.interfaces).toHaveLength(1);
      expect(context.interfaces[0].name).toBe('UserData');
      expect(context.interfaces[0].properties).toEqual(
        expect.arrayContaining(['id', 'name', 'email'])
      );
    });

    test('should extract function-level context accurately', async () => {
      const issue: Issue = {
        type: 'missing-validation',
        severity: 'warning',
        message: 'Missing input validation',
        line: 35,
        file: path.join(testProjectPath, 'src/UserController.ts')
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {
        analyzeFunctions: true,
        analyzeVariables: true
      });

      const targetFunction = context.functions.find((f: FunctionInfo) => f.name === 'createUser');
      expect(targetFunction).toBeDefined();
      expect(targetFunction!.parameters).toEqual(
        expect.arrayContaining(['req', 'res'])
      );
      expect(targetFunction!.isAsync).toBe(true);
      expect(targetFunction!.returnType).toBe('Promise<void>');
    });

    test('should analyze scope context with variable tracking', async () => {
      const issue: Issue = {
        type: 'unused-variable',
        severity: 'warning',
        message: 'Variable may be unused',
        line: 33,
        file: path.join(testProjectPath, 'src/UserController.ts')
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {
        analyzeVariables: true,
        analyzeScopes: true
      });

      expect(context.scopes).toBeDefined();
      expect(context.scopes.length).toBeGreaterThan(0);
      expect(context.variables).toBeDefined();
      expect(context.variables.some((v: VariableInfo) => v.name === 'name' || v.name === 'email')).toBe(true);
    });

    test('should detect related source files', async () => {
      // 関連するソースファイルを作成
      const serviceCode = `export class UserService {
  async findById(id: number) {
    // Implementation
  }
  
  async create(userData: { name: string; email: string }) {
    // Implementation
  }
}`;
      
      fs.mkdirSync(path.join(testProjectPath, 'src/services'), { recursive: true });
      fs.writeFileSync(path.join(testProjectPath, 'src/services/UserService.ts'), serviceCode);

      const issue: Issue = {
        type: 'missing-test-coverage',
        severity: 'warning',
        message: 'Missing test coverage for UserService interaction',
        line: 18,
        file: path.join(testProjectPath, 'src/UserController.test.ts')
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {
        detectRelatedFiles: true,
        maxRelatedFiles: 5
      });

      expect(context.relatedFiles).toBeDefined();
      expect(context.relatedFiles.length).toBeGreaterThan(0);
      expect(context.relatedFiles.some((f: RelatedFileInfo) => f.path.includes('UserController.ts'))).toBe(true);
    });
  });

  describe('extractFunctionInfo', () => {
    test('should extract detailed function information', async () => {
      const filePath = path.join(testProjectPath, 'src/UserController.ts');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      const functions = await analyzer.extractFunctionInfo(fileContent, 'typescript');

      expect(functions).toHaveLength(2);
      
      const getUserByIdFunc = functions.find((f: FunctionInfo) => f.name === 'getUserById');
      expect(getUserByIdFunc).toBeDefined();
      expect(getUserByIdFunc!.isAsync).toBe(true);
      expect(getUserByIdFunc!.parameters).toEqual(['req', 'res']);
      expect(getUserByIdFunc!.startLine).toBeGreaterThan(0);
      expect(getUserByIdFunc!.endLine).toBeGreaterThan(getUserByIdFunc!.startLine);
    });

    test('should handle different programming languages', async () => {
      // JavaScriptファイルの作成
      const jsCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const processOrder = async (order) => {
  const total = calculateTotal(order.items);
  return { orderId: order.id, total };
};`;

      fs.writeFileSync(path.join(testProjectPath, 'src/calculator.js'), jsCode);
      const functions = await analyzer.extractFunctionInfo(jsCode, 'javascript');

      expect(functions).toHaveLength(2);
      expect(functions.some((f: FunctionInfo) => f.name === 'calculateTotal')).toBe(true);
      expect(functions.some((f: FunctionInfo) => f.name === 'processOrder')).toBe(true);
    });
  });

  describe('analyzeScopeContext', () => {
    test('should analyze variable scopes correctly', async () => {
      const code = `function outer() {
  const outerVar = 'outer';
  
  function inner() {
    const innerVar = 'inner';
    console.log(outerVar, innerVar);
  }
  
  return inner;
}`;

      const scopes = await analyzer.analyzeScopeContext(code, 6); // Line with console.log

      expect(scopes).toBeDefined();
      expect(scopes.length).toBeGreaterThanOrEqual(1);
      expect(scopes.some((s: ScopeInfo) => s.variables.includes('outerVar'))).toBe(true);
      expect(scopes.some((s: ScopeInfo) => s.variables.includes('innerVar'))).toBe(true);
    });

    test('should identify block scopes', async () => {
      const code = `if (condition) {
  const blockVar = 'block';
  let anotherVar = 42;
}`;

      const scopes = await analyzer.analyzeScopeContext(code, 2);

      expect(scopes).toBeDefined();
      expect(scopes.length).toBeGreaterThanOrEqual(1);
      expect(scopes[0].type).toBe('block');  
      expect(scopes[0].variables).toEqual(
        expect.arrayContaining(['blockVar', 'anotherVar'])
      );
    });
  });

  describe('detectRelatedCode', () => {
    test('should find related files based on imports', async () => {
      const targetFile = path.join(testProjectPath, 'src/UserController.ts');
      
      const relatedFiles = await analyzer.detectRelatedCode(targetFile, testProjectPath, {
        maxRelatedFiles: 10,
        includeTests: true,
        includeServices: true
      });

      expect(relatedFiles).toBeDefined();
      expect(Array.isArray(relatedFiles)).toBe(true);
      expect(relatedFiles.some((f: RelatedFileInfo) => f.path.includes('UserController.test.ts'))).toBe(true);
    });

    test('should analyze dependency relationships', async () => {
      // 先にservicesディレクトリとUserServiceファイルを作成
      const serviceCode = `export class UserService {
  async findById(id: number) {
    return { id, name: 'Test User', email: 'test@example.com' };
  }
  
  async create(userData: { name: string; email: string }) {
    return { id: 1, ...userData };
  }
}`;
      
      fs.mkdirSync(path.join(testProjectPath, 'src/services'), { recursive: true });
      fs.writeFileSync(path.join(testProjectPath, 'src/services/UserService.ts'), serviceCode);

      const targetFile = path.join(testProjectPath, 'src/UserController.ts');
      
      const relatedFiles = await analyzer.detectRelatedCode(targetFile, testProjectPath, {
        analyzeDependencies: true,
        includeTransitiveDeps: false,
        detectRelatedFiles: true
      });

      expect(relatedFiles).toBeDefined();
      expect(relatedFiles.some((f: RelatedFileInfo) => f.relationship === 'import')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent files gracefully', async () => {
      const issue: Issue = {
        type: 'missing-file',
        severity: 'error',
        message: 'File not found',
        line: 1,
        file: '/non/existent/file.ts'
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {});

      expect(context).toBeDefined();
      expect(context.targetCode.content).toBe('');
      expect(context.imports).toHaveLength(0);
    });

    test('should handle malformed code', async () => {
      const malformedCode = `function broken( {
        // Missing closing brace and parameter
        console.log("broken");
      `;
      
      fs.writeFileSync(path.join(testProjectPath, 'src/broken.ts'), malformedCode);
      
      const issue: Issue = {
        type: 'syntax-error',
        severity: 'error',
        message: 'Syntax error',
        line: 1,
        file: path.join(testProjectPath, 'src/broken.ts')
      };

      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {
        analyzeFunctions: true
      });

      // Should not throw, but may have limited analysis
      expect(context).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should complete analysis within reasonable time', async () => {
      const issue: Issue = {
        type: 'performance-test',
        severity: 'warning',
        message: 'Performance test',
        line: 1,
        file: path.join(testProjectPath, 'src/UserController.ts')
      };

      const startTime = Date.now();
      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {
        includeImports: true,
        analyzeFunctions: true,
        analyzeClasses: true,
        detectRelatedFiles: true
      });
      const endTime = Date.now();

      expect(context).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // 5秒以内
    });

    test('should handle large files efficiently', async () => {
      // 大きなファイルを生成
      const largeCode = Array.from({ length: 1000 }, (_, i) => 
        `function func${i}() { return ${i}; }`
      ).join('\n');
      
      fs.writeFileSync(path.join(testProjectPath, 'src/large.ts'), largeCode);

      const issue: Issue = {
        type: 'large-file-test',
        severity: 'warning',
        message: 'Large file test',
        line: 500,
        file: path.join(testProjectPath, 'src/large.ts')
      };

      const startTime = Date.now();
      const context = await analyzer.analyzeCodeContext(issue, testProjectPath, {
        analyzeFunctions: true,
        contextLines: 20
      });
      const endTime = Date.now();

      expect(context.functions.length).toBeGreaterThan(900);
      expect(endTime - startTime).toBeLessThan(3000); // 3秒以内
    });
  });
});