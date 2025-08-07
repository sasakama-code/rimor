/**
 * analyze AI JSON Lightweight End-to-End Test
 * v0.9.0 - Issue #58: 軽量化されたE2Eテスト
 * 
 * TDD: Green Phase - タイムアウト問題の解決
 * t_wada推奨のテスト駆動開発アプローチ
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('analyze AI JSON Lite E2E Test', () => {
  const testProjectPath = '/tmp/rimor-test-' + Date.now();
  const cliPath = path.join(__dirname, '../../dist/index.js');
  
  // タイムアウトを短縮
  jest.setTimeout(30000);

  beforeAll(async () => {
    // 最小限のテストプロジェクトを作成
    await fs.mkdir(testProjectPath, { recursive: true });
    
    // 単純なテストファイルを1つだけ作成
    await fs.writeFile(
      path.join(testProjectPath, 'sample.test.ts'),
      `
      describe('Sample', () => {
        it('should work', () => {
          expect(true).toBe(true);
        });
      });
      `
    );
  });

  afterAll(async () => {
    // クリーンアップ
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // エラーを無視
    }
  });

  describe('AI JSON出力（軽量版）', () => {
    it('--format=ai-jsonオプションでAI JSON形式を出力できる', async () => {
      const command = `node ${cliPath} analyze ${testProjectPath} --format=ai-json`;
      
      let output: string;
      try {
        // タイムアウトを10秒に設定
        output = execSync(command, { 
          encoding: 'utf-8', 
          timeout: 10000,
          maxBuffer: 1024 * 1024 // 1MB
        });
      } catch (error: any) {
        // analyze コマンドは問題を検出すると exit code 1 を返すが、これは正常動作
        output = error.stdout || '';
      }
      
      // JSONが出力されることを確認
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      expect(jsonMatch).toBeTruthy();
      
      if (jsonMatch) {
        const aiJson = JSON.parse(jsonMatch[0]);
        
        // 基本的な構造の検証のみ
        expect(aiJson).toHaveProperty('overallAssessment');
        expect(aiJson).toHaveProperty('keyRisks');
        expect(aiJson).toHaveProperty('fullReportUrl');
      }
    });

    it('--output-ai-jsonオプションでファイルに出力できる', async () => {
      const outputPath = path.join(testProjectPath, 'ai-output.json');
      const command = `node ${cliPath} analyze ${testProjectPath} --format=ai-json --output-ai-json=${outputPath}`;
      
      try {
        execSync(command, { 
          encoding: 'utf-8', 
          timeout: 10000,
          maxBuffer: 1024 * 1024
        });
      } catch (error) {
        // 問題検出による exit code 1 は正常
      }
      
      // ファイルが生成されることを確認
      const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      
      if (fileExists) {
        // ファイル内容の基本検証
        const content = await fs.readFile(outputPath, 'utf-8');
        const aiJson = JSON.parse(content);
        
        expect(aiJson).toHaveProperty('overallAssessment');
        expect(aiJson).toHaveProperty('keyRisks');
        expect(aiJson).toHaveProperty('fullReportUrl');
      }
    });
  });
});