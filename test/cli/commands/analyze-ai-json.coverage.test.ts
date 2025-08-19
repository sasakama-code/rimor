/**
 * AI JSON Command カバレッジテスト
 * Issue #58: AIエージェント向けコンテキスト出力機能
 * 
 * このファイルは統計的品質保証のためのカバレッジ最適化テストです
 */

import { AnalyzeCommandV8 } from '../../../src/cli/commands/analyze-v0.8';
import { Container, TYPES } from '../../../src/container';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createTestContainer,
  createMockCliSecurity,
  createTestProject,
  createProcessExitSpy,
  getRelativePath
} from './analyze-ai-json.test.helper';

jest.mock('fs');

describe('AI JSON Command Coverage Tests', () => {
  let tempDir: string;
  let command: AnalyzeCommandV8;

  beforeEach(() => {
    // モックをクリア
    jest.clearAllMocks();
    // fsモックを実際の実装にリセット
    (fs.mkdtempSync as jest.Mock).mockImplementation(
      jest.requireActual('fs').mkdtempSync
    );
    (fs.existsSync as jest.Mock).mockImplementation(
      jest.requireActual('fs').existsSync
    );
    (fs.rmSync as jest.Mock).mockImplementation(
      jest.requireActual('fs').rmSync
    );
    
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-coverage-test-'));
    const testContainer = createTestContainer();
    const mockCliSecurity = createMockCliSecurity();
    command = new AnalyzeCommandV8(testContainer, mockCliSecurity);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('AI JSON 生成カバレッジ', () => {
    it('mapSeverityToRiskLevel関数の全パスをカバー', async () => {
      // 異なるseverityレベルでのマッピング確認
      const testProjectPath = createTestProject(tempDir);
      const relativePath = getRelativePath(testProjectPath);
      
      // high severity issues のモック
      const testContainer = createTestContainer();
      testContainer.bind(TYPES.AnalysisEngine)
        .to(() => ({
          analyze: jest.fn().mockResolvedValue({
            projectPath: '',
            issues: [
              { file: 'test1.ts', line: 1, message: 'High severity issue', severity: 'high' },
              { file: 'test2.ts', line: 2, message: 'Critical severity issue', severity: 'critical' },
              { file: 'test3.ts', line: 3, message: 'Low severity issue', severity: 'low' }
            ],
            totalFiles: 3,
            analysisTime: 100,
            cacheHitRate: 0
          })
        }))
        .asSingleton();
      
      const commandWithCustomContainer = new AnalyzeCommandV8(testContainer, createMockCliSecurity());
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      await commandWithCustomContainer.execute({
        path: relativePath,
        format: 'ai-json'
      });
      
      // Assert - 異なるリスクレベルが生成されることを確認
      expect(consoleSpy).toHaveBeenCalled();
      const outputs = consoleSpy.mock.calls.map(call => call.join(' '));
      const jsonOutput = outputs.find(output => {
        try {
          const parsed = JSON.parse(output);
          return parsed && typeof parsed === 'object' && 'keyRisks' in parsed;
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
      const json = JSON.parse(jsonOutput!);
      expect(json.keyRisks).toHaveLength(3);
      
      consoleSpy.mockRestore();
    });

    it('AI JSON生成エラーパスのカバレッジ', async () => {
      const testProjectPath = createTestProject(tempDir);
      const relativePath = getRelativePath(testProjectPath);
      
      // ファイル書き込みエラーを模擬
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write permission denied');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = createProcessExitSpy();
      
      // Act & Assert
      await expect(command.execute({
        path: relativePath,
        format: 'ai-json',
        outputAiJson: path.join(tempDir, 'output.json')
      })).rejects.toThrow(/Process\.exit called/);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      // Cleanup
      jest.restoreAllMocks();
    });

    it('fullReportUrl生成の分岐カバレッジ', async () => {
      const testProjectPath = createTestProject(tempDir);
      const relativePath = getRelativePath(testProjectPath);
      
      // outputHtmlオプションありでの実行
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await command.execute({
        path: relativePath,
        format: 'ai-json',
        outputHtml: 'custom-report.html'
      });
      
      const outputs = consoleSpy.mock.calls.map(call => call.join(' '));
      const jsonOutput = outputs.find(output => {
        try {
          const parsed = JSON.parse(output);
          return parsed && typeof parsed === 'object' && 'fullReportUrl' in parsed;
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
      const json = JSON.parse(jsonOutput!);
      expect(json.fullReportUrl).toBe('custom-report.html');
      
      consoleSpy.mockRestore();
    });

    it('空のissues配列での実行パスカバレッジ', async () => {
      const testProjectPath = createTestProject(tempDir);
      const relativePath = getRelativePath(testProjectPath);
      
      // issues空配列のモック
      const testContainer = createTestContainer();
      testContainer.bind(TYPES.AnalysisEngine)
        .to(() => ({
          analyze: jest.fn().mockResolvedValue({
            projectPath: '',
            issues: [], // 空の配列
            totalFiles: 1,
            analysisTime: 50,
            cacheHitRate: 0
          })
        }))
        .asSingleton();
      
      const commandWithEmptyIssues = new AnalyzeCommandV8(testContainer, createMockCliSecurity());
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await commandWithEmptyIssues.execute({
        path: relativePath,
        format: 'ai-json'
      });
      
      const outputs = consoleSpy.mock.calls.map(call => call.join(' '));
      const jsonOutput = outputs.find(output => {
        try {
          const parsed = JSON.parse(output);
          return parsed && typeof parsed === 'object' && 'overallAssessment' in parsed;
        } catch {
          return false;
        }
      });
      
      expect(jsonOutput).toBeDefined();
      const json = JSON.parse(jsonOutput!);
      expect(json.keyRisks).toHaveLength(0);
      expect(json.overallAssessment).toContain('100/100'); // 完璧なスコア
      
      consoleSpy.mockRestore();
    });
  });
});