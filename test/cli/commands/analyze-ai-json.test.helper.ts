/**
 * AI JSON Command テスト用ヘルパー
 * 共通のDIコンテナセットアップとモック化を提供
 */

import { Container, TYPES } from '../../../src/container';
import { CLISecurity } from '../../../src/security/CLISecurity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * テスト用DIコンテナを作成
 */
export function createTestContainer(): Container {
  const testContainer = new Container();
  
  // AnalysisEngine のモック
  testContainer.bind(TYPES.AnalysisEngine)
    .to(() => ({
      analyze: jest.fn().mockResolvedValue({
        projectPath: '',
        issues: [
          {
            file: 'test.ts',
            line: 1,
            message: 'テスト用のissue',
            severity: 'medium'
          }
        ],
        totalFiles: 1,
        analysisTime: 100,
        cacheHitRate: 0
      })
    }))
    .asSingleton();
  
  // Reporter のモック
  testContainer.bind(TYPES.Reporter)
    .to(() => ({
      generateAnalysisReport: jest.fn().mockResolvedValue({
        success: true,
        outputPath: 'test-report.html',
        content: 'Test report content'
      }),
      generateCombinedReport: jest.fn().mockResolvedValue({
        success: true,
        outputPath: 'test-report.html', 
        content: 'Test report content'
      }),
      printToConsole: jest.fn()
    }))
    .asSingleton();
  
  // SecurityAuditor のモック
  testContainer.bind(TYPES.SecurityAuditor)
    .to(() => ({
      audit: jest.fn().mockResolvedValue(null)
    }))
    .asSingleton();
  
  // PluginManager のモック
  testContainer.bind(TYPES.PluginManager)
    .to(() => ({
      register: jest.fn(),
      getAll: jest.fn().mockReturnValue([])
    }))
    .asSingleton();
  
  return testContainer;
}

/**
 * テスト用CLISecurityモックを作成
 */
export function createMockCliSecurity(): CLISecurity {
  return {
    validateAllArguments: jest.fn().mockReturnValue({
      isValid: true,
      allErrors: [],
      allWarnings: [],
      allSecurityIssues: [],
      sanitizedArgs: {
        path: null, // オリジナルのpathを使用
        format: null // オリジナルのformatを使用
      },
      path: { isValid: true, sanitizedValue: '', errors: [], warnings: [], securityIssues: [] },
      format: { isValid: true, sanitizedValue: '', errors: [], warnings: [], securityIssues: [] },
      outputFile: { isValid: true, sanitizedValue: '', errors: [], warnings: [], securityIssues: [] }
    })
  } as any;
}

/**
 * テスト用のプロジェクト作成ヘルパー
 */
export function createTestProject(baseDir: string, projectName: string = 'test-project'): string {
  const projectDir = path.join(baseDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });
  
  // package.json
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify({
      name: projectName,
      version: '1.0.0',
      devDependencies: {
        jest: '^27.0.0'
      }
    }, null, 2)
  );
  
  // ソースファイル
  const srcDir = path.join(projectDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(srcDir, 'index.ts'),
    `export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}`
  );
  
  // テストファイル
  const testDir = path.join(projectDir, 'test');
  fs.mkdirSync(testDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(testDir, 'index.test.ts'),
    `import { add } from '../src/index';

describe('add', () => {
  it('should add two numbers', () => {
    // Missing assertion
    const result = add(1, 2);
  });
});`
  );
  
  return projectDir;
}

/**
 * process.exitのモックSpyを作成
 */
export function createProcessExitSpy() {
  return jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
    // テスト環境では実際に終了せず、エラーを投げる
    throw new Error(`Process.exit called with code ${code}`);
  });
}

/**
 * 相対パスに変換してセキュリティ検証を回避
 */
export function getRelativePath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}