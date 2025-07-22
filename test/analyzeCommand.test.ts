import { AnalyzeCommand } from '../src/cli/commands/analyze';
import { OutputFormatter } from '../src/cli/output';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('AnalyzeCommand', () => {
  let tempDir: string;
  let command: AnalyzeCommand;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-analyze-test-'));
    command = new AnalyzeCommand();
    
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('text output format', () => {
    it('should display analysis results in text format', async () => {
      // Create test files
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'main.ts'), 'export function main() {}');

      await command.execute({
        path: tempDir,
        format: 'text'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        OutputFormatter.header('Rimor テスト品質監査')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        OutputFormatter.info(`分析対象: ${path.resolve(tempDir)}`)
      );
    });

    it('should show verbose information in text format', async () => {
      // Create config to test verbose mode
      const configContent = {
        output: { verbose: true }
      };
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));

      await command.execute({
        path: tempDir,
        format: 'text',
        verbose: true
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        OutputFormatter.info('詳細モードで実行中...')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        OutputFormatter.info('利用プラグイン: TestExistencePlugin, AssertionExistsPlugin')
      );
    });
  });

  describe('JSON output format', () => {
    it('should output analysis results in JSON format', async () => {
      // Create test files with issues
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'main.ts'), 'export function main() {}');

      await command.execute({
        path: tempDir,
        format: 'json'
      });

      // Find the JSON.stringify call
      const jsonCalls = consoleLogSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].startsWith('{')
      );
      
      expect(jsonCalls.length).toBeGreaterThan(0);
      
      const jsonOutput = JSON.parse(jsonCalls[0][0]);
      
      expect(jsonOutput).toHaveProperty('summary');
      expect(jsonOutput).toHaveProperty('issues');
      expect(jsonOutput).toHaveProperty('config');
      
      expect(jsonOutput.summary).toHaveProperty('totalFiles');
      expect(jsonOutput.summary).toHaveProperty('issuesFound');
      expect(jsonOutput.summary).toHaveProperty('testCoverage');
      expect(jsonOutput.summary).toHaveProperty('executionTime');
      
      expect(jsonOutput.config).toHaveProperty('targetPath');
      expect(jsonOutput.config).toHaveProperty('enabledPlugins');
      expect(jsonOutput.config).toHaveProperty('format', 'json');
    });

    it('should include plugin information in JSON issues', async () => {
      // Create test file and empty test file
      const srcDir = path.join(tempDir, 'src');
      const testDir = path.join(tempDir, 'test');
      fs.mkdirSync(srcDir);
      fs.mkdirSync(testDir);
      
      fs.writeFileSync(path.join(srcDir, 'main.ts'), 'export function main() {}');
      fs.writeFileSync(path.join(testDir, 'main.test.ts'), '// empty test file');

      await command.execute({
        path: tempDir,
        format: 'json'
      });

      const jsonCalls = consoleLogSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].startsWith('{')
      );
      
      const jsonOutput = JSON.parse(jsonCalls[0][0]);
      
      if (jsonOutput.issues && jsonOutput.issues.length > 0) {
        const issue = jsonOutput.issues[0];
        expect(issue).toHaveProperty('plugin');
        expect(['test-existence', 'assertion-exists']).toContain(issue.plugin);
      }
    });
  });

  describe('configuration integration', () => {
    it('should respect config file settings', async () => {
      const configContent = {
        plugins: {
          'test-existence': { enabled: false },
          'assertion-exists': { enabled: true }
        },
        output: { format: 'json', verbose: false }
      };
      
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));

      await command.execute({
        path: tempDir
      });

      const jsonCalls = consoleLogSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && call[0].startsWith('{')
      );
      
      const jsonOutput = JSON.parse(jsonCalls[0][0]);
      expect(jsonOutput.config.enabledPlugins).toEqual(['AssertionExistsPlugin']);
    });

    it('should prioritize command line options over config file', async () => {
      const configContent = {
        output: { format: 'json' }
      };
      
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));

      await command.execute({
        path: tempDir,
        format: 'text'
      });

      // Should use text format from command line, not json from config
      expect(consoleLogSpy).toHaveBeenCalledWith(
        OutputFormatter.header('Rimor テスト品質監査')
      );
    });
  });

  describe('error handling', () => {
    it('should handle non-existent path', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await command.execute({
        path: '/non/existent/path',
        format: 'text'
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        OutputFormatter.error('指定されたパスが存在しません: /non/existent/path')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      consoleErrorSpy.mockRestore();
    });

    it('should exit with code 1 when issues are found', async () => {
      // Create a file without test to trigger issues
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'main.ts'), 'export function main() {}');

      await command.execute({
        path: tempDir,
        format: 'text'
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('single file analysis', () => {
    it('should handle single file input', async () => {
      const testFile = path.join(tempDir, 'test.ts');
      fs.writeFileSync(testFile, 'export function test() {}');

      await command.execute({
        path: testFile,
        format: 'text'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        OutputFormatter.info('単一ファイルモードで実行中...')
      );
    });
  });
});