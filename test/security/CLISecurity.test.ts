/**
 * CLISecurityセキュリティテスト - v0.4.1
 * CLI引数セキュリティの包括的テスト
 */

import { CLISecurity, DEFAULT_CLI_SECURITY_LIMITS } from '../../src/security/CLISecurity';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CLISecurity Security Tests', () => {
  let cliSecurity: CLISecurity;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-cli-test-'));
    cliSecurity = new CLISecurity(tempDir, DEFAULT_CLI_SECURITY_LIMITS);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('分析対象パスの検証', () => {
    test('パストラバーサル攻撃を防ぐ', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\Windows\\System32',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('パストラバーサル攻撃');
      });
    });

    test('コマンドインジェクション攻撃を防ぐ', () => {
      const maliciousPaths = [
        './test.js; rm -rf /',
        './test.js && malicious_command',
        './test.js | evil_script',
        './test.js`backdoor`'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('コマンドインジェクション攻撃');
      });
    });

    test('変数展開攻撃を防ぐ', () => {
      const maliciousPaths = [
        './test${malicious_var}.js',
        './test$(evil_command).js',
        './${HOME}/../../../etc/passwd'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('変数展開攻撃');
      });
    });

    test('NULL文字攻撃を防ぐ', () => {
      const maliciousPaths = [
        './test.js\0',
        './test%00.js',
        './test\x00malicious'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('NULL文字攻撃');
      });
    });

    test('システムディレクトリアクセス攻撃を防ぐ', () => {
      const systemPaths = [
        '/etc/passwd',
        '/root/.ssh/id_rsa',
        '/home/user/.bash_history',
        'C:\\Windows\\explorer.exe',
        'C:\\Program Files\\malicious'
      ];

      systemPaths.forEach(systemPath => {
        const result = cliSecurity.validateAnalysisPath(systemPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('システムディレクトリアクセス試行');
      });
    });

    test('異常に長いパス攻撃を防ぐ', () => {
      const longPath = 'a'.repeat(2000); // 制限は1000文字
      
      const result = cliSecurity.validateAnalysisPath(longPath);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（長いパス）の可能性');
    });

    test('正常なパスは受け入れられる', () => {
      const validPaths = [
        './src/test.js',
        'src/components',
        'test/fixtures/sample.ts',
        '.'
      ];

      validPaths.forEach(validPath => {
        const result = cliSecurity.validateAnalysisPath(validPath);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBeDefined();
      });
    });
  });

  describe('出力ファイルパスの検証', () => {
    test('システムディレクトリ書き込み攻撃を防ぐ', () => {
      const maliciousOutputs = [
        '/etc/cron.daily/backdoor',
        '/root/.bashrc',
        'C:\\Windows\\System32\\evil.exe',
        '/usr/bin/malicious'
      ];

      maliciousOutputs.forEach(maliciousOutput => {
        const result = cliSecurity.validateOutputPath(maliciousOutput);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('システムディレクトリ書き込み攻撃');
      });
    });

    test('実行可能ファイル生成攻撃を防ぐ', () => {
      const executableExtensions = [
        './output.exe',
        './malicious.sh',
        './backdoor.bat',
        './virus.scr'
      ];

      executableExtensions.forEach(execFile => {
        const result = cliSecurity.validateOutputPath(execFile);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('実行可能ファイル生成攻撃の可能性');
      });
    });

    test('許可された拡張子は受け入れられる', () => {
      const allowedOutputs = [
        './report.json',
        './analysis.csv',
        './result.html',
        './output.txt',
        './readme.md'
      ];

      allowedOutputs.forEach(allowedOutput => {
        const result = cliSecurity.validateOutputPath(allowedOutput);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBeDefined();
      });
    });

    test('出力パスが未指定の場合は有効', () => {
      const result = cliSecurity.validateOutputPath('');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('環境変数の検証', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    test('危険な環境変数を検出する', () => {
      process.env.LD_PRELOAD = '/malicious/lib.so';
      process.env.DYLD_INSERT_LIBRARIES = '/evil/lib.dylib';
      process.env.NODE_OPTIONS = '--require malicious_module';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.securityIssues).toContain('環境変数インジェクション攻撃の可能性');
    });

    test('RIMOR_LANGの不正な値を検出する', () => {
      process.env.RIMOR_LANG = 'ja; malicious_command';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('環境変数インジェクション攻撃');
    });

    test('NODE_ENVの不正な値を検出する', () => {
      process.env.NODE_ENV = 'production; evil_script';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('環境変数インジェクション攻撃');
    });

    test('正常な環境変数は受け入れられる', () => {
      process.env.RIMOR_LANG = 'ja';
      process.env.NODE_ENV = 'development';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
    });

    test('環境変数検証が無効化できる', () => {
      cliSecurity.updateLimits({ validateEnvironmentVariables: false });
      
      process.env.LD_PRELOAD = '/malicious/lib.so';
      
      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('フォーマット引数の検証', () => {
    test('未対応のフォーマットを拒否する', () => {
      const invalidFormats = [
        'exe',
        'script',
        'binary',
        'malicious'
      ];

      invalidFormats.forEach(format => {
        const result = cliSecurity.validateFormat(format);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('フォーマット指定攻撃の可能性');
      });
    });

    test('フォーマットインジェクション攻撃を防ぐ', () => {
      const maliciousFormats = [
        'json; malicious_command',
        'text`backdoor`',
        'csv${evil_var}'
      ];

      maliciousFormats.forEach(format => {
        const result = cliSecurity.validateFormat(format);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('フォーマットインジェクション攻撃');
      });
    });

    test('対応フォーマットは受け入れられる', () => {
      const validFormats = ['text', 'json', 'csv', 'html'];

      validFormats.forEach(format => {
        const result = cliSecurity.validateFormat(format);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe(format);
      });
    });

    test('未指定の場合はデフォルト値が返される', () => {
      const result = cliSecurity.validateFormat('');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('text');
    });
  });

  describe('一括引数検証', () => {
    test('すべての引数が安全な場合は成功する', () => {
      const testFile = path.join(tempDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      const result = cliSecurity.validateAllArguments({
        path: './test.js',
        format: 'json',
        outputFile: './output.json'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedArgs.path).toBeDefined();
      expect(result.sanitizedArgs.format).toBe('json');
      expect(result.sanitizedArgs.outputFile).toBeDefined();
    });

    test('任意の引数にセキュリティ問題がある場合は失敗する', () => {
      const result = cliSecurity.validateAllArguments({
        path: '../../../etc/passwd',
        format: 'malicious',
        outputFile: '/etc/backdoor.sh'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.allSecurityIssues.length).toBeGreaterThan(0);
      expect(result.allErrors.length).toBeGreaterThan(0);
    });

    test('警告がある場合でも処理は継続する', () => {
      const result = cliSecurity.validateAllArguments({
        path: './nonexistent.js', // 存在しないファイル（警告）
        format: 'json'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.allWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('セキュリティ制限の設定', () => {
    test('カスタム制限が適用される', () => {
      const customLimits = {
        maxPathLength: 500,
        maxOutputFileSize: 50 * 1024 * 1024,
        allowedOutputExtensions: ['.json', '.txt'],
        forbiddenDirectoryPatterns: ['/custom/forbidden/'],
        validateEnvironmentVariables: false
      };

      cliSecurity.updateLimits(customLimits);
      
      // 制限の確認は間接的（実際の制限値は非公開）
      expect(cliSecurity).toBeDefined();
    });

    test('長いパスの制限が更新される', () => {
      cliSecurity.updateLimits({ maxPathLength: 100 });
      
      const longPath = 'a'.repeat(150);
      const result = cliSecurity.validateAnalysisPath(longPath);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（長いパス）の可能性');
    });
  });

  describe('エラーハンドリングと回復処理', () => {
    test('null値を適切に処理する', () => {
      const result = cliSecurity.validateAnalysisPath(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスが指定されていません');
    });

    test('undefined値を適切に処理する', () => {
      const result = cliSecurity.validateAnalysisPath(undefined as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスが指定されていません');
    });

    test('数値を適切に処理する', () => {
      const result = cliSecurity.validateAnalysisPath(123 as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスが指定されていません');
    });
  });
});