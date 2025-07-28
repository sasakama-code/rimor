import { SimpleDomainRules } from '../../src/domain/simple-rules';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('SimpleDomainRules', () => {
  const testRulesDir = path.join(__dirname, 'test-rules');
  const testRulesFile = path.join(testRulesDir, 'domain-rules.yml');
  let rules: SimpleDomainRules;

  beforeEach(async () => {
    await fs.mkdir(testRulesDir, { recursive: true });
    rules = new SimpleDomainRules();
  });

  afterEach(async () => {
    await fs.rm(testRulesDir, { recursive: true, force: true });
  });

  describe('ルールのロードと検証', () => {
    it('YAMLファイルからルールをロードできること', async () => {
      const testRules = {
        rules: [
          {
            id: 'auth-test-required',
            name: '認証機能のテスト必須',
            pattern: 'auth|login|session',
            severity: 'error',
            message: '認証関連の機能には必ずテストが必要です'
          },
          {
            id: 'api-test-coverage',
            name: 'APIエンドポイントのテストカバレッジ',
            pattern: 'api|endpoint|route',
            severity: 'warning',
            message: 'APIエンドポイントには十分なテストカバレッジが必要です'
          }
        ]
      };

      await fs.writeFile(testRulesFile, yaml.dump(testRules));
      
      const loadedRules = await rules.loadRules(testRulesFile);
      expect(loadedRules).toHaveLength(2);
      expect(loadedRules[0].id).toBe('auth-test-required');
      expect(loadedRules[1].id).toBe('api-test-coverage');
    });

    it('無効なルールファイルでエラーを返すこと', async () => {
      await fs.writeFile(testRulesFile, 'invalid yaml content {{');
      
      await expect(rules.loadRules(testRulesFile)).rejects.toThrow();
    });

    it('空のルールファイルで空配列を返すこと', async () => {
      await fs.writeFile(testRulesFile, yaml.dump({ rules: [] }));
      
      const loadedRules = await rules.loadRules(testRulesFile);
      expect(loadedRules).toHaveLength(0);
    });
  });

  describe('ルールの適用', () => {
    beforeEach(async () => {
      const testRules = {
        rules: [
          {
            id: 'auth-test',
            name: '認証テスト',
            pattern: 'auth|login',
            severity: 'error',
            message: '認証機能のテストが必要です'
          }
        ]
      };
      await fs.writeFile(testRulesFile, yaml.dump(testRules));
      await rules.loadRules(testRulesFile);
    });

    it('マッチするパターンで違反を検出すること', async () => {
      const testFile = {
        path: 'src/auth/login.ts',
        content: 'export function login() { return true; }'
      };

      const violations = await rules.checkFile(testFile);
      expect(violations).toHaveLength(1);
      expect(violations[0].ruleId).toBe('auth-test');
      expect(violations[0].severity).toBe('error');
    });

    it('マッチしないパターンで違反を検出しないこと', async () => {
      const testFile = {
        path: 'src/utils/helper.ts',
        content: 'export function helper() { return true; }'
      };

      const violations = await rules.checkFile(testFile);
      expect(violations).toHaveLength(0);
    });

    it('対応するテストファイルが存在する場合は違反を検出しないこと', async () => {
      const srcFile = path.join(testRulesDir, 'src', 'auth', 'login.ts');
      const testFile = path.join(testRulesDir, 'src', 'auth', 'login.test.ts');
      
      await fs.mkdir(path.dirname(srcFile), { recursive: true });
      await fs.writeFile(srcFile, 'export function login() {}');
      await fs.writeFile(testFile, 'test("login", () => {})');

      const file = {
        path: srcFile,
        content: await fs.readFile(srcFile, 'utf-8')
      };

      const violations = await rules.checkFile(file);
      expect(violations).toHaveLength(0);
    });
  });

  describe('ルールの優先度', () => {
    it('severityに基づいて違反をソートすること', async () => {
      const testRules = {
        rules: [
          {
            id: 'rule1',
            name: 'ルール1',
            pattern: 'test1',
            severity: 'warning',
            message: '警告'
          },
          {
            id: 'rule2',
            name: 'ルール2',
            pattern: 'test2',
            severity: 'error',
            message: 'エラー'
          },
          {
            id: 'rule3',
            name: 'ルール3',
            pattern: 'test3',
            severity: 'info',
            message: '情報'
          }
        ]
      };

      await fs.writeFile(testRulesFile, yaml.dump(testRules));
      await rules.loadRules(testRulesFile);

      const testFile = {
        path: 'test.ts',
        content: 'test1 test2 test3'
      };

      const violations = await rules.checkFile(testFile);
      expect(violations).toHaveLength(3);
      expect(violations[0].severity).toBe('error');
      expect(violations[1].severity).toBe('warning');
      expect(violations[2].severity).toBe('info');
    });
  });
});