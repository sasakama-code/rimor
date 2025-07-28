import { IPlugin, Issue } from './types';
import { PluginManager } from './pluginManager';
import { findTestFiles } from './fileDiscovery';
import { debug } from '../utils/debug';
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
    return debug.measureAsync('analyze', async () => {
      debug.info(`Starting analysis of: ${targetPath}`);
      
      const startTime = Date.now();
      const allIssues: Issue[] = [];
      let fileCount = 0;
      
      // 単一ファイルかディレクトリかを判定
      const { stat } = await import('fs/promises');
      const stats = await stat(targetPath).catch((error) => {
        debug.error(`Failed to stat ${targetPath}:`, error);
        return null;
      });
      
      if (stats?.isFile()) {
        // 単一ファイルの場合
        debug.verbose(`Analyzing single file: ${targetPath}`);
        if (targetPath.endsWith('.ts') || targetPath.endsWith('.js')) {
          fileCount = 1;
          try {
            const issues = await this.pluginManager.runAll(targetPath);
            allIssues.push(...issues);
            debug.verbose(`Found ${issues.length} issues in ${targetPath}`);
          } catch (error) {
            debug.error(`Failed to analyze file ${targetPath}:`, error);
          }
        } else {
          debug.warn(`Skipping non-JS/TS file: ${targetPath}`);
        }
      } else {
        // ディレクトリの場合（従来の処理）
        debug.verbose(`Analyzing directory: ${targetPath}`);
        for await (const filePath of this.findAllFiles(targetPath)) {
          fileCount++;
          debug.trace(`Processing file ${fileCount}: ${filePath}`);
          try {
            const issues = await this.pluginManager.runAll(filePath);
            allIssues.push(...issues);
            debug.verbose(`File ${fileCount}/${targetPath}: Found ${issues.length} issues`);
          } catch (error) {
            debug.error(`Failed to analyze file ${filePath}:`, error);
          }
        }
        debug.info(`Analyzed ${fileCount} files in directory`);
      }
      
      const executionTime = Date.now() - startTime;
      
      debug.info(`Analysis completed: ${fileCount} files, ${allIssues.length} issues found in ${executionTime}ms`);
      debug.inspect('Analysis result summary', {
        totalFiles: fileCount,
        totalIssues: allIssues.length,
        executionTime,
        issuesByType: allIssues.reduce((acc, issue) => {
          acc[issue.type] = (acc[issue.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      return {
        totalFiles: fileCount,
        issues: allIssues,
        executionTime
      };
    });
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