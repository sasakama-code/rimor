import { PluginValidator } from '../../src/interactive/validator';
import { GeneratedPlugin, ValidationResult } from '../../src/interactive/types';
import * as fs from 'fs';
import * as path from 'path';

describe('PluginValidator', () => {
  let validator: PluginValidator;
  let tempDir: string;

  beforeEach(() => {
    validator = new PluginValidator();
    tempDir = path.join(__dirname, '../../temp');
    
    // テスト用一時ディレクトリの作成
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // テスト用一時ファイルのクリーンアップ
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    }
  });

  describe('validate', () => {
    it('should validate generated plugin successfully', async () => {
      // テスト用のプラグインとファイルを作成
      const plugin: GeneratedPlugin = {
        code: createTestPluginCode(),
        metadata: {
          name: 'test-validation-plugin',
          description: 'テスト検証プラグイン',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: [{
            type: 'string-match',
            value: 'expect(',
            description: 'アサーション',
            confidence: 0.8
          }]
        }
      };

      // テスト対象ファイルを作成
      const testFile = path.join(tempDir, 'sample.test.js');
      fs.writeFileSync(testFile, 'expect(result).toBe(true);');

      const testFiles = [testFile];
      const result = await validator.validate(plugin, testFiles);

      expect(result.isValid).toBe(true);
      expect(result.filesAnalyzed).toBe(1);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.message).toContain('検証完了');
    });

    it('should detect issues when pattern is not found', async () => {
      const plugin: GeneratedPlugin = {
        code: createTestPluginCode(),
        metadata: {
          name: 'missing-pattern-plugin',
          description: '不足パターンプラグイン',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: [{
            type: 'string-match',
            value: 'expect(',
            description: 'アサーション',
            confidence: 0.8
          }]
        }
      };

      // expectを含まないテストファイルを作成
      const testFile = path.join(tempDir, 'bad.test.js');
      fs.writeFileSync(testFile, 'console.log("no assertions here");');

      const testFiles = [testFile];
      const result = await validator.validate(plugin, testFiles);

      expect(result.isValid).toBe(true); // プラグイン自体は有効
      expect(result.issuesFound).toBeGreaterThan(0);
      expect(result.filesAnalyzed).toBe(1);
      expect(result.message).toContain('問題を検出');
    });

    it('should handle empty file list', async () => {
      const plugin: GeneratedPlugin = {
        code: createTestPluginCode(),
        metadata: {
          name: 'empty-list-plugin',
          description: '空リストプラグイン',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: []
        }
      };

      const result = await validator.validate(plugin, []);

      expect(result.isValid).toBe(true);
      expect(result.filesAnalyzed).toBe(0);
      expect(result.issuesFound).toBe(0);
      expect(result.message).toContain('対象ファイルなし');
    });

    it('should handle validation errors gracefully', async () => {
      const invalidPlugin: GeneratedPlugin = {
        code: 'invalid typescript code that wont compile',
        metadata: {
          name: 'invalid-plugin',
          description: '無効なプラグイン',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: []
        }
      };

      const testFile = path.join(tempDir, 'any.test.js');
      fs.writeFileSync(testFile, 'any content');

      const result = await validator.validate(invalidPlugin, [testFile]);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toContain('エラー');
    });

    it('should measure execution time accurately', async () => {
      const plugin: GeneratedPlugin = {
        code: createTestPluginCode(),
        metadata: {
          name: 'timing-test-plugin',
          description: 'タイミングテストプラグイン',
          createdBy: 'interactive',
          createdAt: new Date(),
          patterns: []
        }
      };

      const testFiles = Array.from({ length: 3 }, (_, i) => {
        const filePath = path.join(tempDir, `timing-${i}.test.js`);
        fs.writeFileSync(filePath, `test content ${i}`);
        return filePath;
      });

      const startTime = Date.now();
      const result = await validator.validate(plugin, testFiles);
      const actualTime = Date.now() - startTime;

      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.executionTime).toBeLessThanOrEqual(actualTime + 50); // 50ms許容
    });
  });

  describe('createPluginInstance', () => {
    it('should create plugin instance from valid code', async () => {
      const validCode = createTestPluginCode();
      
      const instance = await validator.createPluginInstance(validCode, 'TestValidatorPlugin');
      
      expect(instance).toBeDefined();
      expect(instance.name).toBe('test-validator-plugin');
      expect(typeof instance.analyze).toBe('function');
    });

    it('should handle creation errors', async () => {
      const invalidCode = 'this is not valid javascript';
      
      await expect(validator.createPluginInstance(invalidCode, 'InvalidPlugin'))
        .rejects.toThrow();
    });
  });
});

/**
 * テスト用の有効なプラグインコードを生成
 */
function createTestPluginCode(): string {
  return `
import * as fs from 'fs';
import { IPlugin, Issue } from '../core/types';

export class TestValidatorPlugin implements IPlugin {
  name = 'test-validator-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    if (!content.includes('expect(')) {
      issues.push({
        type: 'missing-pattern',
        severity: 'warning',
        message: 'パターンが見つかりません: expect(',
        file: filePath
      });
    }

    return issues;
  }
}
`;
}