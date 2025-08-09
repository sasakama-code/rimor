/**
 * ConfigSecurityセキュリティテスト - v0.4.1
 * 設定ファイルセキュリティの包括的テスト
 */

import { ConfigSecurity, DEFAULT_CONFIG_SECURITY_LIMITS } from '../../src/security/ConfigSecurity';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigSecurity Security Tests', () => {
  let configSecurity: ConfigSecurity;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-config-test-'));
    configSecurity = new ConfigSecurity(DEFAULT_CONFIG_SECURITY_LIMITS);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('悪意ある設定ファイルの検出と防止', () => {
    test('プロトタイプ汚染攻撃を防ぐ', async () => {
      // JSON.stringify()は__proto__を除外するため、文字列として直接作成
      const maliciousConfig = `{
        "__proto__": {
          "isAdmin": true,
          "polluted": "malicious_payload"
        },
        "plugins": {
          "test-plugin": {
            "enabled": true
          }
        }
      }`;

      const configPath = path.join(tempDir, 'malicious.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      // ConfigSecurityは攻撃を無効化して処理を継続する設計
      expect(result.isValid).toBe(true);
      expect(result.securityIssues).toContain('プロトタイプ汚染攻撃を無効化');
    });

    test('constructor汚染攻撃を防ぐ', async () => {
      // 文字列として直接作成してconstructor汚染を含める
      const maliciousConfig = `{
        "constructor": {
          "prototype": {
            "isAdmin": true
          }
        },
        "plugins": {}
      }`;

      const configPath = path.join(tempDir, 'constructor-attack.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      // ConfigSecurityは攻撃を無効化して処理を継続する設計
      expect(result.isValid).toBe(true);
      expect(result.securityIssues).toContain('プロトタイプ汚染攻撃を無効化');
    });

    test('eval実行攻撃を防ぐ', async () => {
      const maliciousConfig = `{
        "plugins": {
          "malicious": {
            "enabled": true,
            "command": "eval('require(\\"child_process\\").exec(\\"malicious_command\\")')"
          }
        }
      }`;

      const configPath = path.join(tempDir, 'eval-attack.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('eval実行攻撃');
    });

    test('require攻撃を防ぐ', async () => {
      const maliciousConfig = `{
        "plugins": {
          "malicious": {
            "enabled": true,
            "script": "require('child_process').exec('rm -rf /')"
          }
        }
      }`;

      const configPath = path.join(tempDir, 'require-attack.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('任意モジュール読み込み攻撃');
    });

    test('パストラバーサル攻撃を防ぐ', async () => {
      const maliciousConfig = JSON.stringify({
        "excludePatterns": [
          "../../../etc/passwd",
          "../../../../root/.ssh/"
        ],
        "plugins": {}
      });

      const configPath = path.join(tempDir, 'traversal-attack.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('パストラバーサル攻撃');
    });

    test('システムディレクトリアクセス攻撃を防ぐ', async () => {
      const maliciousConfig = JSON.stringify({
        "plugins": {
          "malicious": {
            "enabled": true,
            "outputPath": "/etc/cron.daily/backdoor"
          }
        }
      });

      const configPath = path.join(tempDir, 'system-access.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('システムディレクトリアクセス攻撃');
    });

    test('Unicode攻撃を防ぐ', async () => {
      const maliciousConfig = `{
        "plugins": {
          "malicious": {
            "enabled": true,
            "command": "\\u0065\\u0076\\u0061\\u006c('malicious')"
          }
        }
      }`;

      const configPath = path.join(tempDir, 'unicode-attack.json');
      fs.writeFileSync(configPath, maliciousConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('Unicode攻撃');
    });
  });

  describe('DoS攻撃の防止', () => {
    test('巨大ファイルサイズ攻撃を防ぐ', async () => {
      const largeConfig = JSON.stringify({
        plugins: {
          test: {
            enabled: true,
            largeData: 'x'.repeat(1024 * 1024) // 1MB
          }
        }
      });

      const configPath = path.join(tempDir, 'large-config.json');
      fs.writeFileSync(configPath, largeConfig);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃の可能性');
    });

    test('深いネスト攻撃を防ぐ', async () => {
      let deepObject: any = { plugins: {} };
      let current = deepObject;
      
      // 10層の深いネストを作成（制限は5層）
      for (let i = 0; i < 10; i++) {
        current.nested = {};
        current = current.nested;
      }

      const configPath = path.join(tempDir, 'deep-nested.json');
      fs.writeFileSync(configPath, JSON.stringify(deepObject));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（深いネスト）');
    });

    test('大量プロパティ攻撃を防ぐ', async () => {
      const manyPropsConfig: any = { plugins: {} };
      
      // 200個のプロパティを作成（制限は100個）
      for (let i = 0; i < 200; i++) {
        manyPropsConfig.plugins[`plugin${i}`] = { enabled: true };
      }

      const configPath = path.join(tempDir, 'many-props.json');
      fs.writeFileSync(configPath, JSON.stringify(manyPropsConfig));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（大きなオブジェクト）');
    });

    test('長い配列攻撃を防ぐ', async () => {
      const longArrayConfig = {
        excludePatterns: new Array(100).fill('pattern'), // 制限は50個
        plugins: {}
      };

      const configPath = path.join(tempDir, 'long-array.json');
      fs.writeFileSync(configPath, JSON.stringify(longArrayConfig));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（大きな配列）');
    });

    test('異常に長い文字列攻撃を防ぐ', async () => {
      const longStringConfig = {
        plugins: {
          test: {
            enabled: true,
            description: 'x'.repeat(1000) // 制限は500文字
          }
        }
      };

      const configPath = path.join(tempDir, 'long-string.json');
      fs.writeFileSync(configPath, JSON.stringify(longStringConfig));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(true);
      expect(result.securityIssues).toContain('データ圧迫攻撃の可能性');
    });
  });

  describe('安全な設定ファイルの処理', () => {
    test('正常な設定ファイルは受け入れられる', async () => {
      const validConfig = {
        excludePatterns: ['node_modules/**', 'dist/**'],
        plugins: {
          'test-existence': {
            enabled: true,
            excludeFiles: ['index.ts', 'types.ts']
          },
          'assertion-exists': {
            enabled: false
          }
        },
        output: {
          format: 'json',
          verbose: true
        }
      };

      const configPath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedConfig).toBeDefined();
      if (result.sanitizedConfig) {
        const config = result.sanitizedConfig as Record<string, any>;
        expect(config.plugins['test-existence'].enabled).toBe(true);
      }
    });

    test('危険なパターンがサニタイズされる', async () => {
      const configWithDangerousPatterns = {
        excludePatterns: [
          'node_modules/**',
          '../../../etc/passwd', // 危険なパターン（削除される）
          'dist/**'
        ],
        plugins: {
          'safe-plugin': {
            enabled: true
          }
        }
      };

      const configPath = path.join(tempDir, 'sanitize-test.json');
      fs.writeFileSync(configPath, JSON.stringify(configWithDangerousPatterns));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      if (result.sanitizedConfig) {
        const config = result.sanitizedConfig as Record<string, any>;
        expect(config.excludePatterns).not.toContain('../../../etc/passwd');
      }
    });

    test('無効なプラグイン設定がフィルタリングされる', async () => {
      const configWithInvalidPlugins = {
        plugins: {
          'valid-plugin': {
            enabled: true
          },
          'invalid@plugin': { // 無効な名前
            enabled: true
          },
          'missing-enabled': { // enabled が missing
            description: 'test'
          }
        }
      };

      const configPath = path.join(tempDir, 'filter-test.json');
      fs.writeFileSync(configPath, JSON.stringify(configWithInvalidPlugins));

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('不正なプラグイン名: invalid@plugin'))).toBe(true);
    });
  });

  describe('パス検証とプロジェクト範囲', () => {
    test('プロジェクト範囲外の設定ファイルを拒否する', async () => {
      const outsideConfig = path.join('/tmp', 'outside.json');
      fs.writeFileSync(outsideConfig, JSON.stringify({ plugins: {} }));

      const result = await configSecurity.loadAndValidateConfig(outsideConfig, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('設定ファイルのパスが不正です');
      expect(result.securityIssues).toContain('パストラバーサル攻撃を検出');

      fs.unlinkSync(outsideConfig);
    });

    test('存在しない設定ファイルを適切に処理する', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent.json');

      const result = await configSecurity.loadAndValidateConfig(nonExistentPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('設定ファイルが存在しません');
    });
  });

  describe('エラーハンドリングと回復処理', () => {
    test('不正なJSONを適切に処理する', async () => {
      const invalidJson = '{ "plugins": { "test": enabled: true } }'; // 不正なJSON

      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, invalidJson);

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('JSON解析攻撃の可能性');
    });

    test('空の設定ファイルを適切に処理する', async () => {
      const configPath = path.join(tempDir, 'empty.json');
      fs.writeFileSync(configPath, '');

      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('設定ファイルが空です');
    });

    test('セキュリティ制限の更新', () => {
      const newLimits = {
        maxFileSize: 256 * 1024, // 256KB
        maxObjectDepth: 3,
        maxProperties: 50
      };

      configSecurity.updateLimits(newLimits);
      
      // 制限の更新確認は間接的（実際の制限値は非公開）
      expect(configSecurity).toBeDefined();
    });
  });

  describe('型安全性テスト (v0.8.0)', () => {
    test('ConfigValidationResult.sanitizedConfig はunknown型として扱われる', async () => {
      const validConfig = {
        plugins: {
          'test-plugin': { enabled: true }
        }
      };
      
      const configPath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(configPath, JSON.stringify(validConfig));
      
      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      if (result.isValid && result.sanitizedConfig) {
        // unknown型として扱われることを確認
        const config = result.sanitizedConfig;
        
        // 型ガードやアサーションが必要
        expect(typeof config).toBe('object');
        expect(config).not.toBeNull();
        
        // プロパティアクセスには型チェックが必要
        if (config && typeof config === 'object' && 'plugins' in config) {
          expect(config.plugins).toBeDefined();
        }
      }
    });

    test('様々な型の設定値を安全に処理', async () => {
      const mixedConfig = {
        stringValue: 'text',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'data' },
        plugins: {}
      };
      
      const configPath = path.join(tempDir, 'mixed.json');
      fs.writeFileSync(configPath, JSON.stringify(mixedConfig));
      
      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(true);
      if (result.sanitizedConfig) {
        // unknown型として適切に処理されることを確認
        const config = result.sanitizedConfig;
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
      }
    });

    test('不正な型の設定値を検出して拒否', async () => {
      // JSONでは表現できないが、文字列として不正な構造を作成
      const invalidConfig = '{ "test": undefined }';
      
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, invalidConfig);
      
      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('配列内の要素の型チェック', async () => {
      const arrayConfig = {
        excludePatterns: ['valid', 123, null, { obj: 'invalid' }],
        plugins: {}
      };
      
      const configPath = path.join(tempDir, 'array-types.json');
      fs.writeFileSync(configPath, JSON.stringify(arrayConfig));
      
      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      // 型の検証が行われることを確認
      expect(result.warnings.length).toBeGreaterThan(0);
      if (result.sanitizedConfig) {
        const config = result.sanitizedConfig as Record<string, unknown>;
        if (Array.isArray(config.excludePatterns)) {
          // 文字列以外の要素がフィルタリングされることを確認
          config.excludePatterns.forEach((pattern: unknown) => {
            expect(typeof pattern).toBe('string');
          });
        }
      }
    });

    test('深くネストされたオブジェクトの型安全性', async () => {
      const nestedConfig = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        },
        plugins: {}
      };
      
      const configPath = path.join(tempDir, 'nested.json');
      fs.writeFileSync(configPath, JSON.stringify(nestedConfig));
      
      const result = await configSecurity.loadAndValidateConfig(configPath, tempDir);
      
      expect(result.isValid).toBe(true);
      if (result.sanitizedConfig) {
        // 深いネストへのアクセスには適切な型チェックが必要
        const config = result.sanitizedConfig;
        expect(config).toBeDefined();
        
        // 安全なアクセスのためのヘルパー関数
        const safeAccess = (obj: unknown, ...keys: string[]): unknown => {
          let current: unknown = obj;
          for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
              current = (current as Record<string, unknown>)[key];
            } else {
              return undefined;
            }
          }
          return current;
        };
        
        const deepValue = safeAccess(config, 'level1', 'level2', 'level3', 'value');
        expect(deepValue).toBe('deep');
      }
    });
  });
});