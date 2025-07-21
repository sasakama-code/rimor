import { IPlugin, Issue } from './types';
import { PluginManager } from './pluginManager';
import { findTestFiles } from './fileDiscovery';
import * as path from 'path';

export interface AnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
}

export class Analyzer {
  private pluginManager: PluginManager;
  
  constructor() {
    this.pluginManager = new PluginManager();
  }
  
  registerPlugin(plugin: IPlugin): void {
    this.pluginManager.register(plugin);
  }
  
  async analyze(targetPath: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const allIssues: Issue[] = [];
    let fileCount = 0;
    
    // すべてのファイルを探索（MVP: 簡易実装）
    for await (const filePath of this.findAllFiles(targetPath)) {
      fileCount++;
      const issues = await this.pluginManager.runAll(filePath);
      allIssues.push(...issues);
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      totalFiles: fileCount,
      issues: allIssues,
      executionTime
    };
  }
  
  private async* findAllFiles(dir: string): AsyncGenerator<string> {
    // MVP: テストファイルと通常ファイルの両方を探索
    // 技術的負債: より効率的なファイル探索が必要
    const { readdir } = await import('fs/promises');
    const { resolve } = await import('path');
    
    try {
      const dirents = await readdir(dir, { withFileTypes: true });
      
      for (const dirent of dirents) {
        const fullPath = resolve(dir, dirent.name);
        
        if (dirent.isDirectory() && dirent.name !== 'node_modules') {
          yield* this.findAllFiles(fullPath);
        } else if (dirent.isFile() && (dirent.name.endsWith('.ts') || dirent.name.endsWith('.js'))) {
          yield fullPath;
        }
      }
    } catch (error) {
      // MVP: エラーは無視
    }
  }
}