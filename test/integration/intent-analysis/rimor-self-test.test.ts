/**
 * Rimor Self Test - Intent Analysis Integration Test
 * v0.9.0 - Rimor自身のテストコードを分析する統合テスト
 * TDD Green Phase - 実際のプロジェクトでの動作確認
 */

import { IntentAnalyzeCommand } from '../../../src/cli/commands/intent-analyze';
import { TreeSitterParser } from '../../../src/intent-analysis/TreeSitterParser';
import { TestIntentExtractor } from '../../../src/intent-analysis/TestIntentExtractor';
import { GapType } from '../../../src/intent-analysis/ITestIntentAnalyzer';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Intent Analysis - Rimor Self Test', () => {
  const projectRoot = path.join(__dirname, '../../..');
  
  describe('Rimorのテストファイル分析', () => {
    it('Rimorプロジェクトのテストファイルを分析できること', async () => {
      // Arrange
      const testDirs = [
        'test/core',
        'test/plugins',
        'test/cli/commands'
      ];
      
      const parser = TreeSitterParser.getInstance();
      const extractor = new TestIntentExtractor(parser);
      const analyzedFiles: string[] = [];
      const issues: any[] = [];
      
      // Act
      for (const dir of testDirs) {
        const fullPath = path.join(projectRoot, dir);
        
        try {
          const files = await fs.readdir(fullPath);
          const testFiles = files.filter(f => f.endsWith('.test.ts'));
          
          for (const file of testFiles) {
            const filePath = path.join(fullPath, file);
            
            try {
              const ast = await parser.parseFile(filePath);
              const intent = await extractor.extractIntent(filePath, ast);
              const actual = await extractor.analyzeActualTest(filePath, ast);
              const result = await extractor.evaluateRealization(intent, actual);
              
              analyzedFiles.push(filePath);
              
              // ギャップがある場合は記録
              if (result.gaps.length > 0) {
                issues.push({
                  file: path.relative(projectRoot, filePath),
                  realizationScore: result.realizationScore,
                  gaps: result.gaps,
                  riskLevel: result.riskLevel
                });
              }
            } catch (error) {
              console.error(`Error analyzing ${file}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error reading directory ${dir}:`, error);
        }
      }
      
      // Assert
      console.log(`分析したファイル数: ${analyzedFiles.length}`);
      console.log(`検出された問題数: ${issues.length}`);
      
      expect(analyzedFiles.length).toBeGreaterThan(0);
      
      // 問題があった場合はレポート
      if (issues.length > 0) {
        console.log('\n検出された主な問題:');
        issues
          .sort((a, b) => a.realizationScore - b.realizationScore)
          .slice(0, 5)
          .forEach(issue => {
            console.log(`\n${issue.file}:`);
            console.log(`  実現度スコア: ${issue.realizationScore}%`);
            console.log(`  リスクレベル: ${issue.riskLevel}`);
            console.log(`  ギャップ数: ${issue.gaps.length}`);
          });
      }
    });
    
    it('CLIコマンドを使用してRimorプロジェクトを分析できること', async () => {
      // Arrange
      const command = new IntentAnalyzeCommand();
      const outputFile = path.join(projectRoot, 'test-output', 'rimor-intent-analysis.json');
      
      // 出力ディレクトリを作成
      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      
      // Act
      await command.execute({
        path: path.join(projectRoot, 'test'),
        format: 'json',
        output: outputFile,
        verbose: false
      });
      
      // Assert
      const outputExists = await fs.access(outputFile).then(() => true).catch(() => false);
      expect(outputExists).toBe(true);
      
      // 結果を読み込んで検証
      const results = JSON.parse(await fs.readFile(outputFile, 'utf-8'));
      
      console.log(`\nCLI分析結果:`);
      console.log(`  総ファイル数: ${results.totalFiles}`);
      console.log(`  総テスト数: ${results.totalTests}`);
      console.log(`  平均実現度スコア: ${results.averageRealizationScore.toFixed(2)}%`);
      console.log(`  高リスクテスト数: ${results.highRiskTests}`);
      
      expect(results.totalFiles).toBeGreaterThan(0);
      expect(results.averageRealizationScore).toBeGreaterThan(0);
      
      // クリーンアップ
      await fs.unlink(outputFile).catch(() => {});
    });
  });
  
  describe('特定のテストパターンの検出', () => {
    it('アサーションのないテストを検出できること', async () => {
      // Arrange
      const parser = TreeSitterParser.getInstance();
      const extractor = new TestIntentExtractor(parser);
      
      // サンプルファイルを作成
      const tempFile = path.join(projectRoot, 'test-output', 'no-assertion.test.ts');
      await fs.mkdir(path.dirname(tempFile), { recursive: true });
      
      const testContent = `
        describe('No Assertion Test', () => {
          it('should have no assertions', () => {
            const result = 1 + 1;
            // アサーションなし
          });
          
          it('should have assertion', () => {
            expect(1 + 1).toBe(2);
          });
        });
      `;
      
      await fs.writeFile(tempFile, testContent);
      
      // Act
      const ast = await parser.parseFile(tempFile);
      const intent = await extractor.extractIntent(tempFile, ast);
      const actual = await extractor.analyzeActualTest(tempFile, ast);
      const result = await extractor.evaluateRealization(intent, actual);
      
      // Assert
      const noAssertionGap = result.gaps.find(gap => 
        gap.type === GapType.MISSING_ASSERTION || gap.description.includes('assertion')
      );
      
      expect(noAssertionGap).toBeDefined();
      
      // クリーンアップ
      await fs.unlink(tempFile).catch(() => {});
    });
  });
});