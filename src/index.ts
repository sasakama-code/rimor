#!/usr/bin/env node
import { Analyzer } from './core/analyzer';
import { IPlugin, Issue } from './core/types';

// 最小限のサンプルプラグイン
class HelloPlugin implements IPlugin {
  name = 'hello-plugin';
  
  async analyze(filePath: string): Promise<Issue[]> {
    console.log(`Analyzing: ${filePath}`);
    return [];
  }
}

async function main() {
  console.log('Hello Rimor!');
  console.log('Test quality audit tool - MVP Day 1');
  
  const targetPath = process.argv[2] || './src';
  console.log(`\nAnalyzing directory: ${targetPath}\n`);
  
  const analyzer = new Analyzer();
  analyzer.registerPlugin(new HelloPlugin());
  
  const result = await analyzer.analyze(targetPath);
  
  console.log(`\nAnalysis complete:`);
  console.log(`- Files analyzed: ${result.totalFiles}`);
  console.log(`- Issues found: ${result.issues.length}`);
  console.log(`- Execution time: ${result.executionTime}ms`);
}

main().catch(console.error);