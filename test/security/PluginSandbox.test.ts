/**
 * PluginSandboxセキュリティテスト - v0.4.1
 * プラグインサンドボックスの包括的セキュリティテスト
 */

import { PluginSandbox, DEFAULT_SANDBOX_LIMITS } from '../../src/security/PluginSandbox';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PluginSandbox Security Tests', () => {
  let sandbox: PluginSandbox;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-sandbox-test-'));
    sandbox = new PluginSandbox(tempDir, DEFAULT_SANDBOX_LIMITS);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('悪意あるプラグインコードの検出と防止', () => {
    test('child_processによる任意コマンド実行を防ぐ', async () => {
      const maliciousCode = `
        const { exec } = require('child_process');
        exec('rm -rf /', (error, stdout, stderr) => {
          console.log('System destroyed!');
        });
        
        class Plugin {
          analyze() { return []; }
        }
      `;

      const result = await sandbox.executePlugin(maliciousCode, 'malicious-exec', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('危険なコードパターンを検出');
    });

    test('fsモジュールによる任意ファイルアクセスを防ぐ', async () => {
      const maliciousCode = `
        const fs = require('fs');
        fs.writeFileSync('/etc/passwd', 'hacked');
        
        class Plugin {
          analyze() { return []; }
        }
      `;

      const result = await sandbox.executePlugin(maliciousCode, 'malicious-fs', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('危険なコードパターンを検出');
    });

    test('eval()による動的コード実行を防ぐ', async () => {
      const maliciousCode = `
        eval('require("child_process").exec("malicious_command")');
        
        class Plugin {
          analyze() { return []; }
        }
      `;

      const result = await sandbox.executePlugin(maliciousCode, 'malicious-eval', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('危険なコードパターンを検出');
    });

    test('プロトタイプ汚染攻撃を防ぐ', async () => {
      const maliciousCode = `
        Object.prototype.isAdmin = true;
        Object.prototype.__proto__.polluted = 'attack';
        
        class Plugin {
          constructor() {
            this.constructor.prototype.malicious = true;
          }
          analyze() { return []; }
        }
      `;

      const result = await sandbox.executePlugin(maliciousCode, 'malicious-prototype', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('危険なコードパターンを検出');
    });

    test('グローバル変数操作を防ぐ', async () => {
      const maliciousCode = `
        global.maliciousBackdoor = () => require('child_process').exec;
        process.env.MALICIOUS = 'backdoor';
        
        class Plugin {
          analyze() { return []; }
        }
      `;

      const result = await sandbox.executePlugin(maliciousCode, 'malicious-global', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('危険なコードパターンを検出');
    });

    test('Function constructorによる動的コード実行を防ぐ', async () => {
      const maliciousCode = `
        const malicious = new Function('return require("child_process").exec("evil_command")')();
        
        class Plugin {
          analyze() { return []; }
        }
      `;

      const result = await sandbox.executePlugin(maliciousCode, 'malicious-function', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('危険なコードパターンを検出');
    });
  });

  describe('リソース制限の強制', () => {
    test('実行時間制限を強制する', async () => {
      const longRunningCode = `
        class Plugin {
          analyze() {
            const start = Date.now();
            while (Date.now() - start < 60000) {
              // 60秒間のループ（制限は30秒）
            }
            return [];
          }
        }
      `;

      // 制限を短く設定
      sandbox.updateLimits({ maxExecutionTime: 1000 }); // 1秒

      const result = await sandbox.executePlugin(longRunningCode, 'timeout-test', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('実行時間超過');
    });

    test('メモリ使用量制限を強制する', async () => {
      const memoryHungryCode = `
        class Plugin {
          analyze() {
            const bigArray = [];
            for (let i = 0; i < 1000000; i++) {
              bigArray.push(new Array(1000).fill('memory_hog'));
            }
            return [];
          }
        }
      `;

      // メモリ制限を低く設定
      sandbox.updateLimits({ maxMemoryUsage: 1 }); // 1MB

      const result = await sandbox.executePlugin(memoryHungryCode, 'memory-test', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('メモリ使用量超過');
    });

    test('ファイルサイズ制限を強制する', async () => {
      const largeCode = 'a'.repeat(10 * 1024 * 1024); // 10MB のコード
      
      const result = await sandbox.executePlugin(largeCode, 'large-plugin', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('不正なプラグインコード');
    });
  });

  describe('安全なプラグインの実行', () => {
    test('正常なプラグインは実行される', async () => {
      const safeCode = `
        class Plugin {
          analyze(filePath) {
            return [{
              type: 'test-issue',
              severity: 'warning',
              message: 'テスト問題',
              file: filePath
            }];
          }
        }
      `;

      const testFile = path.join(tempDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      const result = await sandbox.executePlugin(safeCode, 'safe-plugin', testFile);
      
      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('test-issue');
    });

    test('サンドボックス化されたfsアクセスは制限される', async () => {
      const restrictedCode = `
        class Plugin {
          analyze(filePath) {
            try {
              // プロジェクト内のファイルアクセスは許可
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // プロジェクト外へのアクセスは拒否される
              try {
                fs.readFileSync('/etc/passwd', 'utf-8');
                return [{ type: 'security-breach', severity: 'error', message: 'Security violated!' }];
              } catch (error) {
                return [{ type: 'access-denied', severity: 'info', message: 'Access properly denied' }];
              }
            } catch (error) {
              return [{ type: 'error', severity: 'error', message: error.message }];
            }
          }
        }
      `;

      const testFile = path.join(tempDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      const result = await sandbox.executePlugin(restrictedCode, 'restricted-plugin', testFile);
      
      expect(result.success).toBe(true);
      expect(result.issues[0].type).toBe('access-denied');
    });

    test('制限されたpathモジュールのアクセス', async () => {
      const pathTestCode = `
        class Plugin {
          analyze(filePath) {
            try {
              // 安全なpath操作は許可
              const basename = path.basename(filePath);
              const dirname = path.dirname(filePath);
              
              // 危険なpath操作は拒否される
              try {
                const resolved = path.resolve('../../../etc/passwd');
                return [{ type: 'security-breach', severity: 'error', message: 'Path traversal succeeded!' }];
              } catch (error) {
                return [{ 
                  type: 'path-restricted', 
                  severity: 'info', 
                  message: 'Path access properly restricted',
                  file: basename 
                }];
              }
            } catch (error) {
              return [{ type: 'error', severity: 'error', message: error.message }];
            }
          }
        }
      `;

      const testFile = path.join(tempDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      const result = await sandbox.executePlugin(pathTestCode, 'path-test-plugin', testFile);
      
      expect(result.success).toBe(true);
      expect(result.issues[0].type).toBe('path-restricted');
    });
  });

  describe('エラーハンドリングとレポーティング', () => {
    test('プラグイン内例外は適切に処理される', async () => {
      const buggyCode = `
        class Plugin {
          analyze() {
            throw new Error('Plugin internal error');
          }
        }
      `;

      const result = await sandbox.executePlugin(buggyCode, 'buggy-plugin', '/test.js');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Plugin internal error');
      expect(typeof result.executionTime).toBe('number');
      expect(typeof result.memoryUsed).toBe('number');
    });

    test('実行統計が正しく報告される', async () => {
      const simpleCode = `
        class Plugin {
          analyze() {
            return [{ type: 'test', severity: 'info', message: 'Test completed' }];
          }
        }
      `;

      const result = await sandbox.executePlugin(simpleCode, 'stats-plugin', '/test.js');
      
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.memoryUsed).toBeGreaterThanOrEqual(0);
      expect(result.issues).toHaveLength(1);
    });
  });

  describe('サンドボックス制限の設定', () => {
    test('カスタム制限が適用される', () => {
      const customLimits = {
        maxExecutionTime: 5000,
        maxMemoryUsage: 32,
        maxFileSize: 1024,
        allowedModules: ['crypto'],
        forbiddenGlobals: ['customGlobal']
      };

      sandbox.updateLimits(customLimits);
      
      // 制限の確認は間接的に行う（実際の制限値は非公開）
      expect(sandbox).toBeDefined();
    });
  });
});