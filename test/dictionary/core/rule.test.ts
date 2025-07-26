import { BusinessRuleManager } from '../../../src/dictionary/core/rule';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('BusinessRuleManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRule', () => {
    const validParams = {
      id: 'test-rule-1',
      name: 'Test Rule',
      description: 'This is a test rule',
      domain: 'test-domain',
      condition: {
        type: 'function-name' as const,
        pattern: 'test.*',
        scope: 'function' as const
      },
      priority: 100
    };

    test('有効なパラメータでルールが正常に作成される', () => {
      const rule = BusinessRuleManager.createRule(validParams);
      
      expect(rule.id).toBe('test-rule-1');
      expect(rule.name).toBe('Test Rule');
      expect(rule.description).toBe('This is a test rule');
      expect(rule.domain).toBe('test-domain');
      expect(rule.condition).toEqual(validParams.condition);
      expect(rule.priority).toBe(100);
    });

    test('IDが未指定の場合、エラーが発生する', () => {
      const invalidParams = { ...validParams, id: '' };
      
      expect(() => {
        BusinessRuleManager.createRule(invalidParams);
      }).toThrow('必須フィールドが不足しています');
    });

    test('名前が未指定の場合、エラーが発生する', () => {
      const invalidParams = { ...validParams, name: '' };
      
      expect(() => {
        BusinessRuleManager.createRule(invalidParams);
      }).toThrow('必須フィールドが不足しています');
    });

    test('説明が未指定の場合、エラーが発生する', () => {
      const invalidParams = { ...validParams, description: '' };
      
      expect(() => {
        BusinessRuleManager.createRule(invalidParams);
      }).toThrow('必須フィールドが不足しています');
    });

    test('ドメインが未指定の場合、エラーが発生する', () => {
      const invalidParams = { ...validParams, domain: '' };
      
      expect(() => {
        BusinessRuleManager.createRule(invalidParams);
      }).toThrow('必須フィールドが不足しています');
    });

    test('デフォルト値が正しく設定される', () => {
      const minimalParams = {
        id: 'test-rule-1',
        name: 'Test Rule',
        description: 'This is a test rule',
        domain: 'test-domain',
        condition: {
          type: 'function-name' as const,
          pattern: 'test.*',
          scope: 'function' as const
        }
      };
      
      const rule = BusinessRuleManager.createRule(minimalParams);
      
      expect(rule.requirements).toEqual([]);
      expect(rule.priority).toBe(100);
    });

    test('要件が指定された場合、正しく設定される', () => {
      const paramsWithRequirements = {
        ...validParams,
        requirements: [
          {
            type: 'must-have',
            description: 'Must test this function',
            testPattern: 'test.*Function',
            rationale: 'Critical business logic'
          }
        ]
      };
      
      const rule = BusinessRuleManager.createRule(paramsWithRequirements as any);
      
      expect(rule.requirements).toHaveLength(1);
      expect(rule.requirements[0].type).toBe('must-have');
    });

    test('コンプライアンス情報が指定された場合、正しく設定される', () => {
      const paramsWithCompliance = {
        ...validParams,
        compliance: {
          standard: 'ISO-27001',
          clause: '12.6.1'
        }
      };
      
      const rule = BusinessRuleManager.createRule(paramsWithCompliance);
      
      expect(rule.compliance).toEqual({
        standard: 'ISO-27001',
        clause: '12.6.1'
      });
    });
  });

  describe('validateRule', () => {
    const validRule = {
      id: 'test-rule-1',
      name: 'Test Rule',
      description: 'This is a test rule',
      domain: 'test-domain',
      condition: {
        type: 'function-name' as const,
        pattern: 'test.*',
        scope: 'function' as const
      },
      requirements: [],
      priority: 100
    };

    test('有効なルールで検証が成功する', () => {
      const result = BusinessRuleManager.validateRule(validRule);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-rule-1');
    });

    test('IDが不正な場合、検証エラーが発生する', () => {
      const invalidRule = { ...validRule, id: '' };
      
      expect(() => {
        BusinessRuleManager.validateRule(invalidRule);
      }).toThrow();
    });

    test.skip('パターンが不正な場合、検証エラーが発生する', () => {
      const invalidRule = {
        ...validRule,
        condition: {
          ...validRule.condition,
          pattern: '*invalid[regex{'
        }
      };
      
      expect(() => {
        BusinessRuleManager.validateRule(invalidRule);
      }).toThrow();
    });

    test('優先度が範囲外の場合、検証エラーが発生する', () => {
      const invalidRule = { ...validRule, priority: -1 };
      
      expect(() => {
        BusinessRuleManager.validateRule(invalidRule);
      }).toThrow();
    });
  });

  describe('isApplicableToCode', () => {
    const testRule = {
      id: 'test-rule-1',
      name: 'Test Function Rule',
      description: 'Rule for test functions',
      domain: 'test-domain',
      condition: {
        type: 'function-name' as const,
        pattern: 'test.*',
        scope: 'function' as const
      },
      requirements: [],
      priority: 100
    };

    test('パターンに一致するコードで適用可能と判定される', () => {
      const code = 'function testFunction() { return true; }';
      
      const result = BusinessRuleManager.isApplicableToCode(testRule, code, {
        filePath: 'test.ts',
        functionName: 'testFunction'
      });
      
      expect(result).toBe(true);
    });

    test('パターンに一致しないコードで適用不可と判定される', () => {
      const code = 'function calculate() { return 42; }';
      
      const result = BusinessRuleManager.isApplicableToCode(testRule, code, {
        filePath: 'test.ts',
        functionName: 'calculate'
      });
      
      expect(result).toBe(false);
    });

    test('複数の一致があるコードで全て検出される', () => {
      const code = `
        function testFunction() { return true; }
        function testValidator() { return false; }
        function calculate() { return 42; }
      `;
      
      const result = BusinessRuleManager.isApplicableToCode(testRule, code, {
        filePath: 'test.ts',
        functionName: 'testFunction'
      });
      
      expect(result).toBe(true);
    });

    test('異なるルールタイプで適切に処理される', () => {
      const codePatternRule = {
        ...testRule,
        condition: {
          type: 'code-pattern' as const,
          pattern: 'expect\\(',
          scope: 'file' as const
        }
      };
      
      const code = 'expect(result).toBe(true);';
      
      const result = BusinessRuleManager.isApplicableToCode(codePatternRule, code, {
        filePath: 'test.ts',
        functionName: 'testFunction'
      });
      
      expect(result).toBe(true);
    });
  });

  /* describe.skip('generateTestRequirements', () => {
    const testRule = {
      id: 'test-rule-1',
      name: 'Test Function Rule',
      description: 'Rule for test functions',
      domain: 'test-domain',
      condition: {
        type: 'function-name' as const,
        pattern: 'test.*',
        scope: 'function' as const
      },
      requirements: [],
      priority: 100
    };

    test('一致するコードからテスト要件が生成される', () => {
      const code = 'function testFunction() { return processData(); }';
      
      const requirements = BusinessRuleManager.generateTestRequirements(
        testRule,
        code,
        ['testFunction']
      );
      
      expect(requirements).toHaveLength(1);
      expect(requirements[0].type).toBe('must-have');
      expect(requirements[0].description).toContain('testFunction');
    });

    test('複数の一致から複数の要件が生成される', () => {
      const code = `
        function testFunction() { return true; }
        function testValidator() { return false; }
      `;
      
      const requirements = BusinessRuleManager.generateTestRequirements(
        testRule,
        code,
        ['testFunction', 'testValidator']
      );
      
      expect(requirements).toHaveLength(2);
    });

    test('優先度に基づいて適切な要件タイプが設定される', () => {
      const highPriorityRule = { ...testRule, priority: 1 };
      const lowPriorityRule = { ...testRule, priority: 500 };
      
      const code = 'function testFunction() { return true; }';
      
      const highPriorityReqs = BusinessRuleManager.generateTestRequirements(
        highPriorityRule,
        code,
        ['testFunction']
      );
      
      const lowPriorityReqs = BusinessRuleManager.generateTestRequirements(
        lowPriorityRule,
        code,
        ['testFunction']
      );
      
      expect(highPriorityReqs[0].type).toBe('must-have');
      expect(lowPriorityReqs[0].type).toBe('should-have');
    });
  }); */

  /* describe.skip('getConflictingRules', () => {
    const rules = [
      {
        id: 'rule1',
        name: 'Rule 1',
        description: 'First rule',
        domain: 'test-domain',
        condition: {
          type: 'function-name' as const,
          pattern: 'test.*',
          scope: 'function' as const
        },
        requirements: [],
        priority: 100
      },
      {
        id: 'rule2',
        name: 'Rule 2',
        description: 'Second rule',
        domain: 'test-domain',
        condition: {
          type: 'function-name' as const,
          pattern: 'test.*',
          scope: 'function' as const
        },
        requirements: [],
        priority: 200
      },
      {
        id: 'rule3',
        name: 'Rule 3',
        description: 'Third rule',
        domain: 'other-domain',
        condition: {
          type: 'function-name' as const,
          pattern: 'process.*',
          scope: 'function' as const
        },
        requirements: [],
        priority: 150
      }
    ];

    test('同じパターンのルールが競合として検出される', () => {
      const conflicts = BusinessRuleManager.getConflictingRules(rules);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].rules).toHaveLength(2);
      expect(conflicts[0].rules.map(r => r.id)).toEqual(['rule1', 'rule2']);
    });

    test('異なるパターンのルールは競合しない', () => {
      const nonConflictingRules = [rules[0], rules[2]];
      
      const conflicts = BusinessRuleManager.getConflictingRules(nonConflictingRules);
      
      expect(conflicts).toHaveLength(0);
    });

    test('競合の理由が正しく説明される', () => {
      const conflicts = BusinessRuleManager.getConflictingRules(rules);
      
      expect(conflicts[0].reason).toContain('同じパターン');
    });
  }); */

  describe('エラーハンドリング', () => {
    test('不正なパラメータでエラーハンドリングされる', () => {
      expect(() => {
        BusinessRuleManager.createRule(null as any);
      }).toThrow();
    });

    test('検証エラーが適切に処理される', () => {
      const invalidRule = {
        id: '',
        name: 'Test',
        description: 'Test',
        domain: 'test',
        condition: {
          type: 'function-name' as const,
          pattern: '[invalid',
          scope: 'function' as const
        },
        requirements: [],
        priority: 100
      };
      
      expect(() => {
        BusinessRuleManager.validateRule(invalidRule);
      }).toThrow();
    });
  });
});