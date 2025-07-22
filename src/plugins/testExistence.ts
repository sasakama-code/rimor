import * as fs from 'fs';
import * as path from 'path';
import { IPlugin, Issue } from '../core/types';

export class TestExistencePlugin implements IPlugin {
  name = 'test-existence';
  
  async analyze(filePath: string): Promise<Issue[]> {
    // テストファイル自体や除外対象ファイルはスキップ
    if (this.isTestFile(filePath) || this.shouldExclude(filePath)) return [];
    
    const expectedTestPaths = this.generateTestPaths(filePath);
    const exists = expectedTestPaths.some(testPath => fs.existsSync(testPath));
    
    if (!exists) {
      return [{
        type: 'missing-test',
        severity: 'error' as const,
        message: `テストファイルが存在しません: ${filePath}`
      }];
    }
    
    return [];
  }
  
  private isTestFile(filePath: string): boolean {
    return filePath.includes('.test.') || 
           filePath.includes('.spec.') || 
           filePath.includes('__tests__');
  }
  
  private shouldExclude(filePath: string): boolean {
    const fileName = path.basename(filePath);
    const excludePatterns = [
      'index.ts', 'index.js',           // エントリーポイント
      'types.ts', 'types.js',           // 型定義
      'config.ts', 'config.js',         // 設定ファイル
      'constants.ts', 'constants.js'    // 定数ファイル
    ];
    
    return excludePatterns.includes(fileName);
  }
  
  private generateTestPaths(filePath: string): string[] {
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);
    
    // TypeScript拡張子への対応
    const testExtensions = [ext];
    if (ext === '.js') testExtensions.push('.ts');
    if (ext === '.jsx') testExtensions.push('.tsx');
    
    const paths: string[] = [];
    for (const testExt of testExtensions) {
      paths.push(
        path.join(dir, `${baseName}.test${testExt}`),
        path.join(dir, `${baseName}.spec${testExt}`),
        path.join(dir, '__tests__', `${baseName}.test${testExt}`),
        path.join(dir, '__tests__', `${baseName}.spec${testExt}`)
      );
    }
    
    return paths;
  }
}