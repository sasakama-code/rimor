import { PluginGenerator } from '../../src/interactive/generator';
import { Pattern, PluginMetadata } from '../../src/interactive/types';

describe('PluginGenerator', () => {
  let generator: PluginGenerator;

  beforeEach(() => {
    generator = new PluginGenerator();
  });

  describe('generate', () => {
    it('should generate a basic plugin from patterns', () => {
      const patterns: Pattern[] = [{
        type: 'string-match',
        value: 'expect(',
        description: 'アサーションのチェック',
        confidence: 0.8
      }];
      
      const metadata: PluginMetadata = {
        name: 'test-assertion-plugin',
        description: 'テストアサーションチェックプラグイン',
        createdBy: 'interactive',
        createdAt: new Date(),
        patterns: patterns
      };

      const code = generator.generate(patterns, metadata);

      expect(code).toContain('export class');
      expect(code).toContain('implements IPlugin');
      expect(code).toContain('test-assertion-plugin');
      expect(code).toContain('expect(');
      expect(code).toContain('analyze(filePath: string)');
      expect(code).toContain('Promise<Issue[]>');
    });

    it('should handle multiple patterns in generated plugin', () => {
      const patterns: Pattern[] = [
        {
          type: 'string-match',
          value: 'expect(',
          description: 'アサーション',
          confidence: 0.9
        },
        {
          type: 'string-match',
          value: 'describe(',
          description: 'テストスイート',
          confidence: 0.7
        }
      ];
      
      const metadata: PluginMetadata = {
        name: 'multi-pattern-plugin',
        description: '複数パターンチェック',
        createdBy: 'interactive',
        createdAt: new Date(),
        patterns: patterns
      };

      const code = generator.generate(patterns, metadata);

      expect(code).toContain('expect(');
      expect(code).toContain('describe(');
      expect(code).toContain('multi-pattern-plugin');
    });

    it('should generate plugin with proper TypeScript syntax', () => {
      const patterns: Pattern[] = [{
        type: 'string-match',
        value: '.toBe(',
        description: '厳密等価性チェック',
        confidence: 0.85
      }];
      
      const metadata: PluginMetadata = {
        name: 'syntax-check-plugin',
        description: '構文チェック',
        createdBy: 'interactive',
        createdAt: new Date(),
        patterns: patterns
      };

      const code = generator.generate(patterns, metadata);

      // TypeScript構文の確認
      expect(code).toContain("import { IPlugin, Issue } from '../core/types';");
      expect(code).toContain('async analyze(filePath: string): Promise<Issue[]>');
      expect(code).toContain('const content = await fs.readFile(filePath, \'utf-8\');');
      expect(code).toMatch(/severity: 'warning'|severity: 'error'/);
    });

    it('should handle empty patterns gracefully', () => {
      const patterns: Pattern[] = [];
      
      const metadata: PluginMetadata = {
        name: 'empty-plugin',
        description: '空のパターン',
        createdBy: 'interactive',
        createdAt: new Date(),
        patterns: patterns
      };

      const code = generator.generate(patterns, metadata);

      expect(code).toContain('export class');
      expect(code).toContain('implements IPlugin');
      expect(code).toContain('return issues;');
    });

    it('should generate class name from plugin name', () => {
      const patterns: Pattern[] = [{
        type: 'string-match',
        value: 'test',
        description: 'test pattern',
        confidence: 0.5
      }];
      
      const metadata: PluginMetadata = {
        name: 'my-custom-plugin',
        description: 'カスタムプラグイン',
        createdBy: 'interactive',
        createdAt: new Date(),
        patterns: patterns
      };

      const code = generator.generate(patterns, metadata);

      expect(code).toContain('class MyCustomPlugin');
      expect(code).toContain('name = \'my-custom-plugin\'');
    });

    it('should include pattern confidence in generated code comments', () => {
      const patterns: Pattern[] = [{
        type: 'string-match',
        value: 'expect(',
        description: 'High confidence pattern',
        confidence: 0.95
      }];
      
      const metadata: PluginMetadata = {
        name: 'confidence-test',
        description: 'Confidence test plugin',
        createdBy: 'interactive',
        createdAt: new Date(),
        patterns: patterns
      };

      const code = generator.generate(patterns, metadata);

      expect(code).toContain('// 信頼度: 0.95');
      expect(code).toContain('// パターン: expect(');
    });
  });

  describe('generateClassName', () => {
    it('should convert kebab-case to PascalCase', () => {
      const className = generator.generateClassName('my-test');
      expect(className).toBe('MyTestPlugin');
    });

    it('should handle single words', () => {
      const className = generator.generateClassName('test');
      expect(className).toBe('TestPlugin');
    });

    it('should handle underscores', () => {
      const className = generator.generateClassName('my_test');
      expect(className).toBe('MyTestPlugin');
    });

    it('should handle mixed separators', () => {
      const className = generator.generateClassName('my-test_check');
      expect(className).toBe('MyTestCheckPlugin');
    });

    it('should not add Plugin suffix if already present', () => {
      const className = generator.generateClassName('my-test-plugin');
      expect(className).toBe('MyTestPlugin');
    });
  });

  describe('generatePatternCheck', () => {
    it('should generate string-match check correctly', () => {
      const pattern: Pattern = {
        type: 'string-match',
        value: 'expect(',
        description: 'Expectation check',
        confidence: 0.8
      };

      const checkCode = generator.generatePatternCheck(pattern, 0);

      expect(checkCode).toContain('if (!content.includes(\'expect(\'))');
      expect(checkCode).toContain('type: \'missing-pattern\'');
      expect(checkCode).toContain('message: \'パターンが見つかりません: expect(\'');
      expect(checkCode).toContain('// 信頼度: 0.8');
    });

    it('should handle special characters in patterns', () => {
      const pattern: Pattern = {
        type: 'string-match',
        value: '.toBe(',
        description: 'Method call check',
        confidence: 0.7
      };

      const checkCode = generator.generatePatternCheck(pattern, 0);

      expect(checkCode).toContain('.toBe(');
      expect(checkCode).not.toContain('undefined');
    });
  });
});