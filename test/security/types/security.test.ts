/**
 * 型ベースセキュリティ解析 - セキュリティ型システムのテスト
 */

import {
  SecurityType,
  SecurityValidation,
  SecurityRequirement,
  SecureTest,
  UnsafeTest,
  ValidatedAuthTest,
  ValidatedInputTest,
  AuthTestCoverage,
  BoundaryCondition,
  PotentialVulnerability,
  TestCase,
  TestStatement,
  Variable,
  SecurityTypeAnnotation,
  TypeInferenceResult,
  CompileTimeResult,
  SecurityIssue,
  SecurityTestMetrics
} from '../../../src/security/types/security';
import { TaintLevel, TaintSource, SanitizerType } from '../../../src/security/types/taint';

describe('SecurityType', () => {
  it('セキュリティ型が適切に定義されていること', () => {
    expect(SecurityType.USER_INPUT).toBe('user-input');
    expect(SecurityType.AUTH_TOKEN).toBe('auth-token');
    expect(SecurityType.VALIDATED_AUTH).toBe('validated-auth');
    expect(SecurityType.VALIDATED_INPUT).toBe('validated-input');
    expect(SecurityType.SANITIZED_DATA).toBe('sanitized-data');
    expect(SecurityType.SECURE_SQL).toBe('secure-sql');
    expect(SecurityType.SECURE_HTML).toBe('secure-html');
  });
});

describe('インターフェース定義のテスト', () => {
  describe('SecurityValidation', () => {
    it('検証情報を正しく定義できること', () => {
      const validation: SecurityValidation = {
        type: 'input-validation',
        location: {
          file: 'auth.test.ts',
          line: 42,
          method: 'validateUserInput'
        },
        timestamp: new Date('2025-07-30T10:00:00Z')
      };

      expect(validation.type).toBe('input-validation');
      expect(validation.location.file).toBe('auth.test.ts');
      expect(validation.location.line).toBe(42);
      expect(validation.location.method).toBe('validateUserInput');
      expect(validation.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('SecurityRequirement', () => {
    it('セキュリティ要件を正しく定義できること', () => {
      const requirement: SecurityRequirement = {
        id: 'AUTH-001',
        type: 'auth-test',
        required: ['login-success', 'login-failure', 'token-expiry'],
        minTaintLevel: TaintLevel.POSSIBLY_TAINTED,
        applicableSources: [TaintSource.USER_INPUT, TaintSource.EXTERNAL_API]
      };

      expect(requirement.id).toBe('AUTH-001');
      expect(requirement.type).toBe('auth-test');
      expect(requirement.required).toContain('login-success');
      expect(requirement.minTaintLevel).toBe(TaintLevel.POSSIBLY_TAINTED);
      expect(requirement.applicableSources).toContain(TaintSource.USER_INPUT);
    });
  });

  describe('BoundaryCondition', () => {
    it('境界条件を正しく定義できること', () => {
      const boundaries: BoundaryCondition[] = [
        { type: 'min', value: 0, tested: true },
        { type: 'max', value: 100, tested: false },
        { type: 'null', value: null, tested: true },
        { type: 'empty', value: '', tested: true },
        { type: 'invalid-format', value: 'not-a-number', tested: false },
        { type: 'overflow', value: Number.MAX_SAFE_INTEGER + 1, tested: true }
      ];

      expect(boundaries).toHaveLength(6);
      expect(boundaries[0].type).toBe('min');
      expect(boundaries[1].tested).toBe(false);
      expect(boundaries[2].value).toBeNull();
    });
  });

  describe('PotentialVulnerability', () => {
    it('潜在的脆弱性を正しく定義できること', () => {
      const vulnerability: PotentialVulnerability = {
        type: 'sql-injection',
        description: 'ユーザー入力が直接SQLクエリに組み込まれています',
        impact: 'critical',
        location: {
          file: 'userRepository.ts',
          line: 123,
          method: 'findUserByName'
        },
        fixSuggestion: 'パラメータ化クエリを使用してください'
      };

      expect(vulnerability.type).toBe('sql-injection');
      expect(vulnerability.impact).toBe('critical');
      expect(vulnerability.location.method).toBe('findUserByName');
      expect(vulnerability.fixSuggestion).toContain('パラメータ化クエリ');
    });
  });

  describe('TestCase', () => {
    it('テストケースを正しく定義できること', () => {
      const testCase: TestCase = {
        name: 'should validate user input',
        file: 'validation.test.ts',
        content: 'it("should validate user input", () => { /* test code */ })',
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date('2025-07-30T10:00:00Z')
        }
      };

      expect(testCase.name).toBe('should validate user input');
      expect(testCase.metadata.framework).toBe('jest');
      expect(testCase.metadata.language).toBe('typescript');
    });
  });

  describe('TestStatement', () => {
    it('各種テスト文を正しく定義できること', () => {
      const assignmentStmt: TestStatement = {
        type: 'assignment',
        content: 'const userInput = request.body.name;',
        location: { line: 10, column: 5 },
        lhs: 'userInput',
        rhs: 'request.body.name'
      };

      const methodCallStmt: TestStatement = {
        type: 'methodCall',
        content: 'const result = sanitizeInput(userInput);',
        location: { line: 11, column: 5 },
        method: 'sanitizeInput',
        arguments: ['userInput'],
        returnValue: 'result'
      };

      const assertionStmt: TestStatement = {
        type: 'assertion',
        content: 'expect(result).toBe("sanitized");',
        location: { line: 12, column: 5 },
        actual: 'result',
        expected: '"sanitized"',
        isNegativeAssertion: false
      };

      expect(assignmentStmt.type).toBe('assignment');
      expect(assignmentStmt.lhs).toBe('userInput');
      expect(methodCallStmt.method).toBe('sanitizeInput');
      expect(assertionStmt.isNegativeAssertion).toBe(false);
    });
  });

  describe('Variable', () => {
    it('変数情報を正しく定義できること', () => {
      const variables: Variable[] = [
        { name: 'userInput', type: 'string', scope: 'local' },
        { name: 'userId', type: 'number', scope: 'parameter' },
        { name: 'authToken', type: 'string', scope: 'field' },
        { name: 'CONFIG', type: 'object', scope: 'global' }
      ];

      expect(variables[0].scope).toBe('local');
      expect(variables[1].scope).toBe('parameter');
      expect(variables[2].scope).toBe('field');
      expect(variables[3].scope).toBe('global');
    });
  });

  describe('SecurityTypeAnnotation', () => {
    it('セキュリティ型注釈を正しく定義できること', () => {
      const annotation: SecurityTypeAnnotation = {
        target: 'userInput',
        securityType: SecurityType.USER_INPUT,
        securityLevel: TaintLevel.LIKELY_TAINTED,
        taintLevel: TaintLevel.LIKELY_TAINTED,
        confidence: 0.95,
        evidence: [
          'Variable receives data from request.body',
          'No sanitization detected before use'
        ],
        flowPolicy: 'must-sanitize-before-use'
      };

      expect(annotation.target).toBe('userInput');
      expect(annotation.securityType).toBe(SecurityType.USER_INPUT);
      expect(annotation.confidence).toBe(0.95);
      expect(annotation.evidence).toHaveLength(2);
    });

    it('レガシー互換性のためにvariableフィールドも使用できること', () => {
      const annotation: SecurityTypeAnnotation = {
        variable: 'legacyVar',
        securityType: SecurityType.VALIDATED_INPUT,
        taintLevel: TaintLevel.CLEAN,
        confidence: 1.0,
        evidence: ['Validated by input validator']
      };

      expect(annotation.variable).toBe('legacyVar');
      expect(annotation.target).toBeUndefined();
    });
  });

  describe('TypeInferenceResult', () => {
    it('型推論結果を正しく定義できること', () => {
      const result: TypeInferenceResult = {
        annotations: [
          {
            target: 'userInput',
            securityType: SecurityType.USER_INPUT,
            taintLevel: TaintLevel.LIKELY_TAINTED,
            confidence: 0.9,
            evidence: ['From request body']
          }
        ],
        statistics: {
          totalVariables: 10,
          inferred: 8,
          failed: 2,
          averageConfidence: 0.85
        },
        inferenceTime: 150
      };

      expect(result.annotations).toHaveLength(1);
      expect(result.statistics.inferred).toBe(8);
      expect(result.statistics.failed).toBe(2);
      expect(result.inferenceTime).toBe(150);
    });
  });

  describe('CompileTimeResult', () => {
    it('コンパイル時解析結果を正しく定義できること', () => {
      const result: CompileTimeResult = {
        issues: [
          {
            id: 'SEC-001',
            severity: 'error',
            type: 'missing-sanitizer',
            message: 'ユーザー入力がサニタイズされていません',
            location: {
              file: 'controller.ts',
              line: 42,
              column: 10,
              method: 'handleRequest'
            },
            fixSuggestion: 'sanitizeInput()を使用してください'
          }
        ],
        executionTime: 500,
        runtimeImpact: 0,
        statistics: {
          filesAnalyzed: 25,
          methodsAnalyzed: 150,
          inferenceSuccessRate: 0.92
        }
      };

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('error');
      expect(result.runtimeImpact).toBe(0);
      expect(result.statistics.inferenceSuccessRate).toBe(0.92);
    });
  });

  describe('SecurityIssue', () => {
    it('セキュリティ問題を正しく定義できること', () => {
      const issue: SecurityIssue = {
        id: 'TAINT-001',
        severity: 'critical',
        type: 'unsafe-taint-flow',
        message: '汚染されたデータが安全でないシンクに流れています',
        location: {
          file: 'database.ts',
          line: 100,
          column: 15,
          method: 'executeQuery'
        },
        fixSuggestion: 'SQLクエリをパラメータ化してください',
        taintInfo: {
          source: TaintSource.USER_INPUT,
          confidence: 0.98,
          location: {
            file: 'database.ts',
            line: 100,
            column: 15
          },
          tracePath: [],
          securityRules: ['no-raw-sql']
        }
      };

      expect(issue.type).toBe('unsafe-taint-flow');
      expect(issue.severity).toBe('critical');
      expect(issue.taintInfo?.source).toBe(TaintSource.USER_INPUT);
    });
  });

  describe('SecurityTestMetrics', () => {
    it('セキュリティテストメトリクスを正しく定義できること', () => {
      const metrics: SecurityTestMetrics = {
        securityCoverage: {
          authentication: 0.85,
          inputValidation: 0.92,
          apiSecurity: 0.78,
          overall: 0.85
        },
        taintFlowDetection: 0.94,
        sanitizerCoverage: 0.88,
        invariantCompliance: 0.91
      };

      expect(metrics.securityCoverage.authentication).toBe(0.85);
      expect(metrics.securityCoverage.overall).toBe(0.85);
      expect(metrics.taintFlowDetection).toBe(0.94);
      expect(metrics.invariantCompliance).toBe(0.91);
    });
  });
});

describe('ブランド型のテスト', () => {
  describe('SecureTest', () => {
    it('セキュアテスト型を使用できること', () => {
      const baseTest: TestCase = {
        name: 'secure authentication test',
        file: 'auth.test.ts',
        content: 'test code',
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const secureTest: SecureTest<TestCase> = {
        ...baseTest,
        __validated: [
          {
            type: 'auth-validation',
            location: {
              file: 'auth.test.ts',
              line: 10,
              method: 'testAuth'
            },
            timestamp: new Date()
          }
        ],
        __taintLevel: TaintLevel.CLEAN,
        __securityType: SecurityType.VALIDATED_AUTH
      };

      expect(secureTest.name).toBe('secure authentication test');
      expect(secureTest.__taintLevel).toBe(TaintLevel.CLEAN);
      expect(secureTest.__securityType).toBe(SecurityType.VALIDATED_AUTH);
    });
  });

  describe('UnsafeTest', () => {
    it('危険テスト型を使用できること', () => {
      const baseTest: TestCase = {
        name: 'unsafe test',
        file: 'unsafe.test.ts',
        content: 'test code',
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const unsafeTest: UnsafeTest<TestCase> = {
        ...baseTest,
        __missing: [
          {
            id: 'REQ-001',
            type: 'input-validation',
            required: ['boundary-test', 'sanitization-test'],
            minTaintLevel: TaintLevel.POSSIBLY_TAINTED,
            applicableSources: [TaintSource.USER_INPUT]
          }
        ],
        __vulnerabilities: [
          {
            type: 'xss',
            description: 'HTMLが適切にエスケープされていません',
            impact: 'high',
            location: {
              file: 'unsafe.test.ts',
              line: 20,
              method: 'renderHTML'
            },
            fixSuggestion: 'escapeHtml()を使用してください'
          }
        ],
        __riskLevel: 'high'
      };

      expect(unsafeTest.__missing).toHaveLength(1);
      expect(unsafeTest.__vulnerabilities[0].type).toBe('xss');
      expect(unsafeTest.__riskLevel).toBe('high');
    });
  });

  describe('ValidatedAuthTest', () => {
    it('認証テスト型を使用できること', () => {
      const baseTest: TestCase = {
        name: 'authentication test',
        file: 'auth.test.ts',
        content: 'test code',
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const authTest: ValidatedAuthTest = {
        ...baseTest,
        __brand: 'auth-validated',
        __covers: ['success', 'failure', 'token-expiry', 'brute-force'],
        __tokenValidation: true,
        __sessionManagement: true
      };

      expect(authTest.__brand).toBe('auth-validated');
      expect(authTest.__covers).toContain('token-expiry');
      expect(authTest.__tokenValidation).toBe(true);
    });
  });

  describe('ValidatedInputTest', () => {
    it('入力検証テスト型を使用できること', () => {
      const baseTest: TestCase = {
        name: 'input validation test',
        file: 'validation.test.ts',
        content: 'test code',
        metadata: {
          framework: 'jest',
          language: 'typescript',
          lastModified: new Date()
        }
      };

      const inputTest: ValidatedInputTest = {
        ...baseTest,
        __brand: 'input-validated',
        __sanitizers: [SanitizerType.HTML_ESCAPE, SanitizerType.SQL_ESCAPE],
        __boundaries: [
          { type: 'min', value: 0, tested: true },
          { type: 'max', value: 100, tested: true },
          { type: 'null', value: null, tested: true }
        ],
        __typeValidation: true
      };

      expect(inputTest.__brand).toBe('input-validated');
      expect(inputTest.__sanitizers).toContain(SanitizerType.HTML_ESCAPE);
      expect(inputTest.__boundaries).toHaveLength(3);
      expect(inputTest.__typeValidation).toBe(true);
    });
  });
});

describe('AuthTestCoverage型のテスト', () => {
  it('すべての認証テストカバレッジタイプが使用できること', () => {
    const coverageTypes: AuthTestCoverage[] = [
      'success',
      'failure',
      'token-expiry',
      'brute-force',
      'session-hijack',
      'csrf',
      'privilege-escalation'
    ];

    expect(coverageTypes).toHaveLength(7);
    coverageTypes.forEach(coverage => {
      expect(typeof coverage).toBe('string');
    });
  });
});