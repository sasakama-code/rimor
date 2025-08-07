/**
 * Analyze AI JSON Command テスト
 * Issue #58: AIエージェント向けコンテキスト出力機能
 * 
 * TDD: 統合テスト
 * t_wadaのTDD原則に従う
 */

import { AnalyzeCommandV8 } from '../../../src/cli/commands/analyze-v0.8';
import { UnifiedAIFormatter } from '../../../src/ai-output/unified-ai-formatter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Analyze AI JSON Command', () => {
  let tempDir: string;
  let command: AnalyzeCommandV8;

  beforeEach(() => {
    // 一時ディレクトリの作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-ai-json-test-'));
    command = new AnalyzeCommandV8();
  });

  afterEach(() => {
    // 一時ディレクトリの削除
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('--format=ai-json オプション', () => {
    it('ai-json形式でコンソールに出力する', async () => {
      // Arrange
      const testProjectPath = createTestProject(tempDir);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Act
      await command.execute({
        path: testProjectPath,
        format: 'ai-json'
      });
      
      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.join('');
      const json = JSON.parse(output);
      
      expect(json).toHaveProperty('overallAssessment');
      expect(json).toHaveProperty('keyRisks');
      expect(json).toHaveProperty('fullReportUrl');
      
      consoleSpy.mockRestore();
    });

    it('--output-ai-json オプションでファイルに出力する', async () => {
      // Arrange
      const testProjectPath = createTestProject(tempDir);
      const outputPath = path.join(tempDir, 'output', 'ai-report.json');
      
      // Act
      await command.execute({
        path: testProjectPath,
        format: 'ai-json',
        outputAiJson: outputPath
      });
      
      // Assert
      expect(fs.existsSync(outputPath)).toBe(true);
      const content = fs.readFileSync(outputPath, 'utf-8');
      const json = JSON.parse(content);
      
      expect(json).toHaveProperty('overallAssessment');
      expect(json).toHaveProperty('keyRisks');
      expect(json).toHaveProperty('fullReportUrl');
    });
  });

  describe('AI JSONフォーマット', () => {
    it('overallAssessmentに必要な情報を含む', async () => {
      // Arrange
      const testProjectPath = createTestProject(tempDir);
      const outputPath = path.join(tempDir, 'ai-report.json');
      
      // Act
      await command.execute({
        path: testProjectPath,
        outputAiJson: outputPath
      });
      
      // Assert
      const json = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(json.overallAssessment).toContain('総合スコア');
      expect(json.overallAssessment).toContain('グレード');
    });

    it('keyRisksが正しい構造を持つ', async () => {
      // Arrange
      const testProjectPath = createTestProject(tempDir);
      const outputPath = path.join(tempDir, 'ai-report.json');
      
      // Act
      await command.execute({
        path: testProjectPath,
        outputAiJson: outputPath
      });
      
      // Assert
      const json = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      
      if (json.keyRisks.length > 0) {
        const firstRisk = json.keyRisks[0];
        expect(firstRisk).toHaveProperty('problem');
        expect(firstRisk).toHaveProperty('riskLevel');
        expect(firstRisk).toHaveProperty('context');
        expect(firstRisk.context).toHaveProperty('filePath');
        expect(firstRisk.context).toHaveProperty('codeSnippet');
        expect(firstRisk.context).toHaveProperty('startLine');
        expect(firstRisk.context).toHaveProperty('endLine');
        expect(firstRisk).toHaveProperty('suggestedAction');
        expect(firstRisk.suggestedAction).toHaveProperty('type');
        expect(firstRisk.suggestedAction).toHaveProperty('description');
      }
    });

    it('fullReportUrlが正しく設定される', async () => {
      // Arrange
      const testProjectPath = createTestProject(tempDir);
      const outputPath = path.join(tempDir, 'reports', 'ai-report.json');
      
      // Act
      await command.execute({
        path: testProjectPath,
        outputAiJson: outputPath
      });
      
      // Assert
      const json = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(json.fullReportUrl).toBe(path.join(tempDir, 'reports', 'index.html'));
    });
  });

  describe('エラーハンドリング', () => {
    it('存在しないパスでエラーメッセージを表示', async () => {
      // Arrange
      const nonExistentPath = path.join(tempDir, 'non-existent');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process.exit called');
      });
      
      // Act & Assert
      await expect(command.execute({
        path: nonExistentPath,
        format: 'ai-json'
      })).rejects.toThrow('Process.exit called');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('書き込み権限がないディレクトリでエラーメッセージを表示', async () => {
      // Arrange
      const testProjectPath = createTestProject(tempDir);
      const outputPath = '/root/ai-report.json'; // 通常書き込み権限がないパス
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      await command.execute({
        path: testProjectPath,
        format: 'ai-json',
        outputAiJson: outputPath
      });
      
      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      const errorMessage = consoleSpy.mock.calls.join('');
      expect(errorMessage).toContain('AI JSON生成に失敗しました');
      
      consoleSpy.mockRestore();
    });
  });
});

// テスト用のプロジェクト作成ヘルパー
function createTestProject(baseDir: string): string {
  const projectDir = path.join(baseDir, 'test-project');
  fs.mkdirSync(projectDir, { recursive: true });
  
  // package.json
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify({
      name: 'test-project',
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