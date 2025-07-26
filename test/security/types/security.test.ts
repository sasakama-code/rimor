/**
 * security.test.ts
 * セキュリティ型システムのテスト
 */

describe('Security Type System - セキュリティ型システム', () => {
  describe('SecurityType - セキュリティ型', () => {
    it('セキュリティ型の基本定義が正しいこと', () => {
      const { SecurityType } = require('../../../src/security/types/security');
      
      expect(SecurityType.SAFE).toBeDefined();
      expect(SecurityType.TAINTED).toBeDefined();
      expect(SecurityType.VALIDATED).toBeDefined();
      expect(SecurityType.ENCRYPTED).toBeDefined();
      expect(SecurityType.HASHED).toBeDefined();
    });

    it('セキュリティ型の階層関係が定義されていること', () => {
      const { SecurityType, isSubtype } = require('../../../src/security/types/security');
      
      expect(isSubtype(SecurityType.VALIDATED, SecurityType.SAFE)).toBe(true);
      expect(isSubtype(SecurityType.ENCRYPTED, SecurityType.SAFE)).toBe(true);
      expect(isSubtype(SecurityType.TAINTED, SecurityType.SAFE)).toBe(false);
    });
  });

  describe('SecurityAnnotation - セキュリティ注釈', () => {
    it('セキュリティ注釈を解析できること', () => {
      const { SecurityAnnotation } = require('../../../src/security/types/security');
      
      const annotation = new SecurityAnnotation('@Trusted(level=HIGH)');
      
      expect(annotation.type).toBe('Trusted');
      expect(annotation.level).toBe('HIGH');
      expect(annotation.isValid()).toBe(true);
    });

    it('複数の注釈を組み合わせられること', () => {
      const { SecurityAnnotation } = require('../../../src/security/types/security');
      
      const combined = SecurityAnnotation.combine([
        new SecurityAnnotation('@Validated'),
        new SecurityAnnotation('@Sanitized(method=HTML_ESCAPE)')
      ]);
      
      expect(combined.types).toContain('Validated');
      expect(combined.types).toContain('Sanitized');
      expect(combined.properties.method).toBe('HTML_ESCAPE');
    });
  });

  describe('SecurityConstraint - セキュリティ制約', () => {
    it('セキュリティ制約を定義できること', () => {
      const { SecurityConstraint } = require('../../../src/security/types/security');
      
      const constraint = new SecurityConstraint({
        name: 'NoTaintedInput',
        condition: (value) => value.securityType !== 'TAINTED',
        severity: 'high',
        message: 'Tainted input not allowed'
      });
      
      expect(constraint.name).toBe('NoTaintedInput');
      expect(constraint.severity).toBe('high');
    });

    it('制約違反を検出できること', () => {
      const { SecurityConstraint, SecurityValue } = require('../../../src/security/types/security');
      
      const constraint = new SecurityConstraint({
        name: 'RequireValidation',
        condition: (value) => value.annotations.includes('@Validated'),
        severity: 'medium',
        message: 'Input must be validated'
      });
      
      const unvalidatedValue = new SecurityValue('data', [], 'TAINTED');
      const violation = constraint.check(unvalidatedValue);
      
      expect(violation).toBeDefined();
      expect(violation.constraint).toBe('RequireValidation');
      expect(violation.severity).toBe('medium');
    });
  });

  describe('SecurityValue - セキュリティ値', () => {
    it('セキュリティ値を作成できること', () => {
      const { SecurityValue } = require('../../../src/security/types/security');
      
      const value = new SecurityValue(
        'user input', 
        ['@UserInput', '@Tainted'], 
        'TAINTED'
      );
      
      expect(value.content).toBe('user input');
      expect(value.securityType).toBe('TAINTED');
      expect(value.annotations).toContain('@UserInput');
    });

    it('セキュリティ変換を適用できること', () => {
      const { SecurityValue, SecurityTransform } = require('../../../src/security/types/security');
      
      const taintedValue = new SecurityValue('data', ['@Tainted'], 'TAINTED');
      const sanitizer = new SecurityTransform('sanitize', 'TAINTED', 'VALIDATED');
      
      const sanitized = sanitizer.apply(taintedValue);
      
      expect(sanitized.securityType).toBe('VALIDATED');
      expect(sanitized.annotations).toContain('@Sanitized');
    });
  });

  describe('SecurityPolicy - セキュリティポリシー', () => {
    it('セキュリティポリシーを定義できること', () => {
      const { SecurityPolicy } = require('../../../src/security/types/security');
      
      const policy = new SecurityPolicy({
        name: 'WebAppPolicy',
        rules: [
          { pattern: /userInput/, requiredType: 'VALIDATED' },
          { pattern: /password/, requiredType: 'HASHED' },
          { pattern: /session/, requiredType: 'ENCRYPTED' }
        ]
      });
      
      expect(policy.name).toBe('WebAppPolicy');
      expect(policy.rules.length).toBe(3);
    });

    it('ポリシー違反を検出できること', () => {
      const { SecurityPolicy, SecurityValue } = require('../../../src/security/types/security');
      
      const policy = new SecurityPolicy({
        name: 'StrictPolicy',
        rules: [
          { pattern: /password/, requiredType: 'HASHED' }
        ]
      });
      
      const plainPassword = new SecurityValue('password123', [], 'TAINTED');
      const violations = policy.checkValue('password', plainPassword);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].rule).toBeDefined();
      expect(violations[0].expectedType).toBe('HASHED');
      expect(violations[0].actualType).toBe('TAINTED');
    });
  });

  describe('SecurityContext - セキュリティコンテキスト', () => {
    it('セキュリティコンテキストを管理できること', () => {
      const { SecurityContext } = require('../../../src/security/types/security');
      
      const context = new SecurityContext();
      context.setVariable('userId', { type: 'VALIDATED', source: 'DATABASE' });
      context.setVariable('userInput', { type: 'TAINTED', source: 'USER_INPUT' });
      
      expect(context.getVariable('userId').type).toBe('VALIDATED');
      expect(context.getVariable('userInput').type).toBe('TAINTED');
    });

    it('スコープベースのコンテキスト管理ができること', () => {
      const { SecurityContext } = require('../../../src/security/types/security');
      
      const context = new SecurityContext();
      context.setVariable('global', { type: 'SAFE', source: 'CONSTANT' });
      
      context.pushScope();
      context.setVariable('local', { type: 'TAINTED', source: 'USER_INPUT' });
      
      expect(context.getVariable('global')).toBeDefined();
      expect(context.getVariable('local')).toBeDefined();
      
      context.popScope();
      
      expect(context.getVariable('global')).toBeDefined();
      expect(context.getVariable('local')).toBeUndefined();
    });
  });

  describe('SecurityAnalyzer - セキュリティ分析器', () => {
    it('関数のセキュリティ型を推論できること', () => {
      const { SecurityAnalyzer } = require('../../../src/security/types/security');
      
      const analyzer = new SecurityAnalyzer();
      const functionCode = `
        function processUser(userId: ValidatedId, userInput: TaintedString): SafeResult {
          const validated = validate(userInput);
          return combine(userId, validated);
        }
      `;
      
      const analysis = analyzer.analyzeFunction(functionCode);
      
      expect(analysis.parameters).toHaveLength(2);
      expect(analysis.parameters[0].securityType).toBe('VALIDATED');
      expect(analysis.parameters[1].securityType).toBe('TAINTED');
      expect(analysis.returnType.securityType).toBe('SAFE');
    });

    it('型不整合を検出できること', () => {
      const { SecurityAnalyzer } = require('../../../src/security/types/security');
      
      const analyzer = new SecurityAnalyzer();
      const inconsistentCode = `
        function unsafeFunction(input: TaintedString): SafeResult {
          return input; // 型不整合：TaintedStringをSafeResultとして返す
        }
      `;
      
      const errors = analyzer.checkTypeConsistency(inconsistentCode);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe('type-mismatch');
      expect(errors[0].expected).toBe('SafeResult');
      expect(errors[0].actual).toBe('TaintedString');
    });
  });

  describe('SecurityTypeChecker - セキュリティ型チェッカー', () => {
    it('代入の安全性をチェックできること', () => {
      const { SecurityTypeChecker } = require('../../../src/security/types/security');
      
      const checker = new SecurityTypeChecker();
      
      // 安全な代入
      const safeAssignment = checker.checkAssignment('VALIDATED', 'SAFE');
      expect(safeAssignment.safe).toBe(true);
      
      // 危険な代入
      const unsafeAssignment = checker.checkAssignment('TAINTED', 'SAFE');
      expect(unsafeAssignment.safe).toBe(false);
      expect(unsafeAssignment.reason).toContain('security violation');
    });

    it('関数呼び出しの安全性をチェックできること', () => {
      const { SecurityTypeChecker } = require('../../../src/security/types/security');
      
      const checker = new SecurityTypeChecker();
      
      const functionSignature = {
        name: 'processData',
        parameters: [
          { name: 'input', requiredType: 'VALIDATED' },
          { name: 'options', requiredType: 'SAFE' }
        ]
      };
      
      const arguments = [
        { value: 'data', type: 'TAINTED' },
        { value: 'opts', type: 'SAFE' }
      ];
      
      const check = checker.checkFunctionCall(functionSignature, arguments);
      
      expect(check.safe).toBe(false);
      expect(check.violations.length).toBe(1);
      expect(check.violations[0].parameter).toBe('input');
    });
  });

  describe('統合テスト', () => {
    it('完全なセキュリティ型分析パイプラインが動作すること', () => {
      const {
        SecurityAnalyzer,
        SecurityTypeChecker,
        SecurityPolicy,
        SecurityContext
      } = require('../../../src/security/types/security');
      
      const code = `
        function loginUser(username: ValidatedString, password: TaintedString): AuthResult {
          const hashedPassword = hash(password);
          const user = findUser(username);
          return authenticate(user, hashedPassword);
        }
      `;
      
      const analyzer = new SecurityAnalyzer();
      const checker = new SecurityTypeChecker();
      const policy = new SecurityPolicy({
        name: 'AuthPolicy',
        rules: [
          { pattern: /password/, requiredType: 'HASHED' }
        ]
      });
      
      // 分析実行
      const analysis = analyzer.analyzeFunction(code);
      const typeErrors = checker.checkTypeConsistency(code);
      const policyViolations = policy.checkFunction(analysis);
      
      expect(analysis).toBeDefined();
      expect(typeErrors.length).toBe(0); // 型整合
      expect(policyViolations.length).toBe(0); // ポリシー準拠
    });

    it('セキュリティ違反の連鎖を検出できること', () => {
      const { SecurityAnalyzer } = require('../../../src/security/types/security');
      
      const analyzer = new SecurityAnalyzer();
      const vulnerableCode = `
        function vulnerableChain(userInput: TaintedString): DatabaseResult {
          const processed = processInput(userInput); // 不十分なサニタイゼーション
          const query = buildQuery(processed); // SQLインジェクション可能
          return executeQuery(query); // 危険な実行
        }
      `;
      
      const securityIssues = analyzer.findSecurityIssues(vulnerableCode);
      
      expect(securityIssues.length).toBeGreaterThan(0);
      expect(securityIssues.some(issue => issue.type === 'sql-injection')).toBe(true);
      expect(securityIssues.some(issue => issue.severity === 'critical')).toBe(true);
    });
  });
});