#!/usr/bin/env node
import { Analyzer } from './core/analyzer';
import { TestExistencePlugin } from './plugins/testExistence';

async function main() {
  console.log('Hello Rimor!');
  console.log('Test quality audit tool - MVP Day 1');
  
  const targetPath = process.argv[2] || './src';
  console.log(`\nAnalyzing directory: ${targetPath}\n`);
  
  const analyzer = new Analyzer();
  analyzer.registerPlugin(new TestExistencePlugin());
  
  const result = await analyzer.analyze(targetPath);
  
  console.log(`\nAnalysis complete:`);
  console.log(`- Files analyzed: ${result.totalFiles}`);
  console.log(`- Issues found: ${result.issues.length}`);
  console.log(`- Execution time: ${result.executionTime}ms`);
  
  if (result.issues.length > 0) {
    console.log(`\n🔍 Detected Issues:`);
    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
    });
  }
}

main().catch(console.error);