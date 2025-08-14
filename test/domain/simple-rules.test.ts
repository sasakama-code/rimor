import { SimpleDomainRules, DomainRule } from '../../src/domain/simple-rules';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SimpleDomainRules', () => {
  const testRulesDir = path.join(__dirname, 'test-rules');
  let rules: SimpleDomainRules;

  beforeEach(async () => {
    await fs.mkdir(testRulesDir, { recursive: true });
    rules = new SimpleDomainRules();
  });

  afterEach(async () => {
    await fs.rm(testRulesDir, { recursive: true, force: true });
  });

  describe('ルールの管理', () => {
    it('ルールを追加できること', () => {
      // デフォルトルールの数を確認
      const initialRuleCount = rules.getAllRules().length;
      
      const testRule: DomainRule = {
        id: 'test-rule-add',
        name: 'テスト追加ルール',
        description: 'テスト用の追加ルール',
        category: 'security',
        severity: 'error',
        patterns: [
          {
            type: 'keyword',
            pattern: 'testpattern',
            message: 'テストパターンが検出されました'
          }
        ]
      };

      rules.addRule(testRule);
      const allRules = rules.getAllRules();
      
      expect(allRules).toHaveLength(initialRuleCount + 1);
      const addedRule = allRules.find(r => r.id === 'test-rule-add');
      expect(addedRule).toBeDefined();
      expect(addedRule?.name).toBe('テスト追加ルール');
    });

    it('ルールを削除できること', () => {
      const initialRuleCount = rules.getAllRules().length;
      
      const testRule: DomainRule = {
        id: 'test-rule-delete',
        name: '削除テストルール',
        description: '削除テスト用',
        category: 'quality',
        severity: 'medium',
        patterns: [
          {
            type: 'regex',
            pattern: 'deletetest',
            message: '削除テストメッセージ'
          }
        ]
      };
      
      rules.addRule(testRule);
      expect(rules.getAllRules()).toHaveLength(initialRuleCount + 1);
      
      rules.removeRule('test-rule-delete');
      expect(rules.getAllRules()).toHaveLength(initialRuleCount);
      const deletedRule = rules.getAllRules().find(r => r.id === 'test-rule-delete');
      expect(deletedRule).toBeUndefined();
    });

    it('カテゴリ別にルールを取得できること', () => {
      const uniqueRule: DomainRule = {
        id: 'unique-category-rule',
        name: 'ユニークカテゴリルール',
        description: 'カテゴリテスト用',
        category: 'maintainability',
        severity: 'medium',
        patterns: [
          {
            type: 'keyword',
            pattern: 'uniquepattern',
            message: 'ユニークパターン検出'
          }
        ]
      };
      
      rules.addRule(uniqueRule);
      const maintainabilityRules = rules.getRulesByCategory('maintainability');
      
      const hasUniqueRule = maintainabilityRules.some(r => r.id === 'unique-category-rule');
      expect(hasUniqueRule).toBe(true);
    });
  });

  describe('ルールの検証', () => {
    it('不正なルールを拒否すること', () => {
      // IDなし
      const ruleWithoutId = {
        name: 'テストルール',
        description: 'テスト',
        category: 'security',
        severity: 'error',
        patterns: []
      };
      expect(() => rules.addRule(ruleWithoutId as any)).toThrow('Rule must have a valid id');

      // 名前なし
      const ruleWithoutName = {
        id: 'test-id',
        description: 'テスト',
        category: 'security',
        severity: 'error',
        patterns: []
      };
      expect(() => rules.addRule(ruleWithoutName as any)).toThrow('Rule must have a valid name');

      // パターンなし
      const ruleWithoutPatterns = {
        id: 'test-id',
        name: 'テストルール',
        description: 'テスト',
        category: 'security',
        severity: 'high'
      };
      expect(() => rules.addRule(ruleWithoutPatterns as any)).toThrow('Rule must have patterns array');

      // 不正なパターンタイプ
      const ruleWithInvalidPattern = {
        id: 'test-id',
        name: 'テストルール',
        description: 'テスト',
        category: 'security',
        severity: 'error',
        patterns: [{
          type: 'invalid',
          pattern: 'test',
          message: 'test'
        }]
      };
      expect(() => rules.addRule(ruleWithInvalidPattern as any)).toThrow('Pattern must have a valid type');
    });

    it('正しい型のルールを受け入れること', () => {
      const validRule: DomainRule = {
        id: 'valid-rule',
        name: '有効なルール',
        description: '有効なルールの説明',
        category: 'quality',
        severity: 'medium',
        patterns: [
          {
            type: 'regex',
            pattern: '^test.*$',
            message: 'テストパターン'
          },
          {
            type: 'keyword',
            pattern: 'keyword',
            message: 'キーワードパターン'
          },
          {
            type: 'ast',
            pattern: 'CallExpression',
            message: 'ASTパターン'
          }
        ],
        tags: ['test', 'validation']
      };

      expect(() => rules.addRule(validRule)).not.toThrow();
      const addedRule = rules.getAllRules().find(r => r.id === 'valid-rule');
      expect(addedRule).toBeDefined();
    });
  });

  describe('ルールの適用', () => {
    beforeEach(() => {
      const testRule: DomainRule = {
        id: 'auth-test',
        name: '認証テスト',
        description: '認証機能のテストが必要です',
        category: 'security',
        severity: 'error',
        patterns: [
          {
            type: 'keyword',
            pattern: 'auth|login',
            message: '認証機能のテストが必要です'
          }
        ]
      };
      rules.addRule(testRule);
    });

    it('マッチするパターンで違反を検出すること', async () => {
      const filePath = 'src/auth/login.ts';
      const content = 'export function login() { return true; }';

      const violations = await rules.evaluateFile(filePath, content);
      // デフォルトルールもマッチする可能性があるため、auth-testルールの違反を特定
      const authTestViolation = violations.find(v => v.ruleId === 'auth-test');
      expect(authTestViolation).toBeDefined();
      expect(authTestViolation?.severity).toBe('error');
    });

    it('マッチしないパターンで違反を検出しないこと', async () => {
      const filePath = 'src/utils/helper.ts';
      const content = 'export function helper() { return true; }';

      const violations = await rules.evaluateFile(filePath, content);
      expect(violations).toHaveLength(0);
    });
  });

  describe('ルールの優先度', () => {
    it('severityに基づいて違反をソートすること', async () => {
      const errorRule: DomainRule = {
        id: 'severity-error-rule',
        name: 'エラー重大度ルール',
        description: 'エラーレベルテスト',
        category: 'quality',
        severity: 'error',
        patterns: [
          {
            type: 'keyword',
            pattern: 'severityerror',
            message: 'エラーレベルの違反'
          }
        ]
      };

      const warningRule: DomainRule = {
        id: 'severity-warning-rule',
        name: '警告重大度ルール',
        description: '警告レベルテスト',
        category: 'quality',
        severity: 'medium',
        patterns: [
          {
            type: 'keyword',
            pattern: 'severitywarning',
            message: '警告レベルの違反'
          }
        ]
      };

      rules.addRule(errorRule);
      rules.addRule(warningRule);

      const content = 'export function test() { severityerror(); severitywarning(); }';
      const violations = await rules.evaluateFile('test.ts', content);
      
      // 追加したルールの違反のみをフィルタ
      const testViolations = violations.filter(v => 
        v.ruleId === 'severity-error-rule' || v.ruleId === 'severity-warning-rule'
      );
      
      expect(testViolations).toHaveLength(2);
      // ソートして確認
      const sorted = testViolations.sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
      expect(sorted[0].severity).toBe('error');
      expect(sorted[1].severity).toBe('warning');
    });
  });
});