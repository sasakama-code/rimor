import * as fs from 'fs';
import * as path from 'path';
import { IPlugin, Issue } from '../core/types';
import { PluginConfig } from '../core/config';

export class TestExistencePlugin implements IPlugin {
  name = 'test-existence';
  private config?: PluginConfig;
  
  constructor(config?: PluginConfig) {
    this.config = config;
  }
  
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
    
    // 設定ファイルのexcludeFilesを優先使用
    const configExcludeFiles = this.config?.excludeFiles || [];
    if (configExcludeFiles.includes(fileName)) {
      return true;
    }
    
    // generatedディレクトリの除外（テスト生成ファイル）
    if (filePath.includes('/generated/') || filePath.includes('\\generated\\')) {
      return true;
    }
    
    // フォールバック: デフォルトの除外パターン
    const defaultExcludePatterns = [
      'index.ts', 'index.js',           // エントリーポイント
      'types.ts', 'types.js',           // 型定義
      'config.ts', 'config.js',         // 設定ファイル
      'constants.ts', 'constants.js'    // 定数ファイル
    ];
    
    return defaultExcludePatterns.includes(fileName);
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
      // 既存パターン: 同一ディレクトリ
      paths.push(
        path.join(dir, `${baseName}.test${testExt}`),
        path.join(dir, `${baseName}.spec${testExt}`),
        path.join(dir, '__tests__', `${baseName}.test${testExt}`),
        path.join(dir, '__tests__', `${baseName}.spec${testExt}`)
      );
      
      // 新規パターン: test/ルートディレクトリ構造
      // src/core/analyzer.ts → test/core/analyzer.test.ts
      const relativePath = path.relative('src', filePath);
      if (!relativePath.startsWith('..')) {
        const testDir = path.dirname(relativePath);
        const projectRoot = this.findProjectRoot(filePath);
        
        if (projectRoot) {
          // test/ディレクトリ構造のパターン
          paths.push(
            path.join(projectRoot, 'test', testDir, `${baseName}.test${testExt}`),
            path.join(projectRoot, 'test', testDir, `${baseName}.spec${testExt}`)
          );
          
          // フラットな命名のパターン (analyzeCommand.test.ts等)
          if (testDir === 'cli/commands' && baseName === 'analyze') {
            paths.push(
              path.join(projectRoot, 'test', 'analyzeCommand.test.ts'),
              path.join(projectRoot, 'test', 'analyzeCommand.spec.ts')
            );
          }
          
          // ルートレベルのテストファイル
          if (testDir === '.') {
            paths.push(
              path.join(projectRoot, 'test', `${baseName}.test${testExt}`),
              path.join(projectRoot, 'test', `${baseName}.spec${testExt}`)
            );
          }
        }
      }
    }
    
    return paths;
  }
  
  private findProjectRoot(filePath: string): string | null {
    let currentDir = path.dirname(filePath);
    
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }
}