/**
 * 型ベースセキュリティ解析 - 型システムエクスポートのテスト
 */

import {
  // taint.tsからのエクスポート
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintLattice,
  // security.tsからのエクスポート
  SecurityType,
  SecureTest,
  TestCase,
  SecurityIssue,
  // lattice.tsからのエクスポート
  SecurityLattice,
  SecurityViolation,
  // index.ts独自の型定義
  TestMethod,
  MethodSignature,
  Parameter,
  MethodAnalysisResult,
  MethodChange,
  IncrementalResult,
  AnalysisResult,
  TaintAnalysisResult,
  IncrementalUpdate,
  SecurityImprovement,
  TypeBasedSecurityConfig,
  TypeBasedSecurityAnalysis,
  ModularAnalysis
} from '../../../src/security/types/index';

describe('エクスポートのテスト', () => {
  it('taint.tsからの型が正しくエクスポートされていること', () => {
    // Enumの値を確認
    expect(TaintLevel.CLEAN).toBe(0);
    expect(TaintSource.USER_INPUT).toBe('user-input');
    expect(SecuritySink.DATABASE_QUERY).toBe('database-query');
    expect(SanitizerType.HTML_ESCAPE).toBe('html-escape');
    
    // クラスのインスタンス化を確認
    expect(TaintLattice.join).toBeDefined();
  });

  it('security.tsからの型が正しくエクスポートされていること', () => {
    expect(SecurityType.USER_INPUT).toBe('user-input');
    
    // インターフェースの型チェック
    const testCase: TestCase = {
      name: 'test',
      file: 'test.ts',
      content: 'content',
      metadata: {
        framework: 'jest',
        language: 'typescript',
        lastModified: new Date()
      }
    };
    expect(testCase.name).toBe('test');
  });

  it('lattice.tsからの型が正しくエクスポートされていること', () => {
    const lattice = new SecurityLattice();
    expect(lattice).toBeDefined();
    expect(lattice.setTaintLevel).toBeDefined();
  });
});

describe('index.ts独自のインターフェース定義のテスト', () => {
  describe('TestMethod', () => {
    it('テストメソッドを正しく定義できること', () => {
      const testMethod: TestMethod = {
        name: 'testAuthentication',
        filePath: 'auth.test.ts',
        content: 'it("should authenticate user", () => { /* test */ })',
        body: '/* test body */',
        securityRelevance: 0.95,
        assertions: ['expect(user).toBeDefined()'],
        dependencies: ['authService', 'userRepository'],
        testType: 'security',
        signature: {
          name: 'testAuthentication',
          parameters: [],
          annotations: ['@SecurityTest'],
          isAsync: true
        },
        location: {
          startLine: 10,
          endLine: 20,
          startColumn: 0,
          endColumn: 50
        }
      };

      expect(testMethod.name).toBe('testAuthentication');
      expect(testMethod.securityRelevance).toBe(0.95);
      expect(testMethod.testType).toBe('security');
      expect(testMethod.signature.isAsync).toBe(true);
    });
  });

  describe('MethodSignature', () => {
    it('メソッドシグネチャを正しく定義できること', () => {
      const signature: MethodSignature = {
        name: 'validateInput',
        parameters: [
          {
            name: 'userInput',
            type: 'string',
            source: 'user-input',
            annotations: ['@Tainted']
          }
        ],
        returnType: 'boolean',
        annotations: ['@SecurityCritical'],
        visibility: 'public',
        isAsync: false
      };

      expect(signature.name).toBe('validateInput');
      expect(signature.parameters[0].source).toBe('user-input');
      expect(signature.visibility).toBe('public');
    });
  });

  describe('Parameter', () => {
    it('すべてのパラメータソースタイプが使用できること', () => {
      const parameters: Parameter[] = [
        { name: 'input', type: 'string', source: 'user-input' },
        { name: 'data', type: 'object', source: 'database' },
        { name: 'response', type: 'any', source: 'api' },
        { name: 'config', type: 'Config', source: 'constant' }
      ];

      expect(parameters[0].source).toBe('user-input');
      expect(parameters[1].source).toBe('database');
      expect(parameters[2].source).toBe('api');
      expect(parameters[3].source).toBe('constant');
    });
  });

  describe('MethodAnalysisResult', () => {
    it('メソッド解析結果を正しく定義できること', () => {
      const result: MethodAnalysisResult = {
        methodName: 'testUserInput',
        issues: [
          {
            id: 'SEC-001',
            severity: 'critical',
            type: 'missing-sanitizer',
            message: 'ユーザー入力がサニタイズされていません',
            location: {
              file: 'test.ts',
              line: 42,
              column: 10
            }
          }
        ],
        metrics: {
          securityCoverage: {
            authentication: 0.8,
            inputValidation: 0.9,
            apiSecurity: 0.7,
            overall: 0.8
          },
          taintFlowDetection: 0.95,
          sanitizerCoverage: 0.85,
          invariantCompliance: 0.9
        },
        suggestions: [],
        analysisTime: 150
      };

      expect(result.methodName).toBe('testUserInput');
      expect(result.issues).toHaveLength(1);
      expect(result.metrics.securityCoverage.overall).toBe(0.8);
    });
  });

  describe('MethodChange', () => {
    it('メソッド変更を正しく定義できること', () => {
      const methodChange: MethodChange = {
        type: 'modified',
        method: {
          name: 'testAuth',
          filePath: 'auth.test.ts',
          content: 'updated content',
          signature: {
            name: 'testAuth',
            parameters: [],
            annotations: [],
            isAsync: false
          },
          location: {
            startLine: 10,
            endLine: 20,
            startColumn: 0,
            endColumn: 50
          }
        },
        details: 'アサーションを追加しました'
      };

      expect(methodChange.type).toBe('modified');
      expect(methodChange.details).toContain('アサーション');
    });

    it('すべての変更タイプが使用できること', () => {
      const changeTypes: MethodChange['type'][] = ['added', 'modified', 'deleted'];
      changeTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('IncrementalResult', () => {
    it('インクリメンタル解析結果を正しく定義できること', () => {
      const result: IncrementalResult = {
        analyzed: 10,
        cached: 25,
        totalTime: 500,
        results: []
      };

      expect(result.analyzed).toBe(10);
      expect(result.cached).toBe(25);
      expect(result.totalTime).toBe(500);
    });
  });

  describe('TaintAnalysisResult', () => {
    it('汚染解析結果を正しく定義できること', () => {
      const result: TaintAnalysisResult = {
        lattice: new SecurityLattice(),
        violations: [],
        taintPaths: [
          { from: 'userInput', to: 'database', level: TaintLevel.DEFINITELY_TAINTED }
        ],
        criticalFlows: [
          { source: 'userInput', sink: 'eval', risk: 'critical' }
        ]
      };

      expect(result.lattice).toBeDefined();
      expect(result.taintPaths).toHaveLength(1);
      expect(result.criticalFlows).toHaveLength(1);
    });
  });

  describe('IncrementalUpdate', () => {
    it('インクリメンタル更新結果を正しく定義できること', () => {
      const update: IncrementalUpdate = {
        updatedMethods: ['testAuth', 'testInput'],
        invalidatedCache: ['cache-001', 'cache-002'],
        newIssues: [
          {
            id: 'NEW-001',
            severity: 'warning',
            type: 'missing-auth-test',
            message: '認証テストが不足しています',
            location: {
              file: 'auth.test.ts',
              line: 50,
              column: 0
            }
          }
        ],
        resolvedIssues: ['OLD-001', 'OLD-002']
      };

      expect(update.updatedMethods).toHaveLength(2);
      expect(update.invalidatedCache).toHaveLength(2);
      expect(update.newIssues).toHaveLength(1);
      expect(update.resolvedIssues).toHaveLength(2);
    });
  });

  describe('SecurityImprovement', () => {
    it('セキュリティ改善提案を正しく定義できること', () => {
      const improvement: SecurityImprovement = {
        id: 'IMP-001',
        priority: 'high',
        type: 'add-sanitizer',
        title: 'HTMLエスケープの追加',
        description: 'ユーザー入力をHTML出力する前にエスケープ処理を追加してください',
        location: {
          file: 'render.ts',
          line: 100,
          column: 10
        },
        suggestedCode: 'const safe = escapeHtml(userInput);',
        estimatedImpact: {
          securityImprovement: 0.3,
          implementationMinutes: 5
        },
        automatable: true
      };

      expect(improvement.priority).toBe('high');
      expect(improvement.type).toBe('add-sanitizer');
      expect(improvement.automatable).toBe(true);
      expect(improvement.estimatedImpact.implementationMinutes).toBe(5);
    });

    it('すべての改善タイプが使用できること', () => {
      const improvementTypes: SecurityImprovement['type'][] = [
        'add-sanitizer',
        'add-validation',
        'fix-assertion',
        'enhance-coverage'
      ];
      improvementTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('TypeBasedSecurityConfig', () => {
    it('設定を正しく定義できること', () => {
      const config: TypeBasedSecurityConfig = {
        strictness: 'strict',
        maxAnalysisTime: 5000,
        parallelism: 4,
        enableCache: true,
        customSanitizers: ['customEscape', 'customValidate'],
        customSinks: ['customExec', 'customEval'],
        excludePatterns: ['*.spec.ts', '*.mock.ts'],
        debug: true
      };

      expect(config.strictness).toBe('strict');
      expect(config.parallelism).toBe(4);
      expect(config.customSanitizers).toContain('customEscape');
      expect(config.excludePatterns).toContain('*.spec.ts');
    });

    it('すべての厳密さレベルが使用できること', () => {
      const strictnessLevels: TypeBasedSecurityConfig['strictness'][] = [
        'strict',
        'moderate',
        'lenient'
      ];
      strictnessLevels.forEach(level => {
        expect(typeof level).toBe('string');
      });
    });
  });

  describe('TypeBasedSecurityAnalysis', () => {
    it('インターフェースメソッドが定義されていること', () => {
      // モックオブジェクトでインターフェースの構造を確認
      const mockAnalysis: TypeBasedSecurityAnalysis = {
        inferTaintLevels: jest.fn(),
        inferSecurityTypes: jest.fn(),
        verifyInvariants: jest.fn(),
        analyzeAtCompileTime: jest.fn()
      };

      expect(mockAnalysis.inferTaintLevels).toBeDefined();
      expect(mockAnalysis.inferSecurityTypes).toBeDefined();
      expect(mockAnalysis.verifyInvariants).toBeDefined();
      expect(mockAnalysis.analyzeAtCompileTime).toBeDefined();
    });
  });

  describe('ModularAnalysis', () => {
    it('インターフェースメソッドが定義されていること', () => {
      // モックオブジェクトでインターフェースの構造を確認
      const mockAnalysis: ModularAnalysis = {
        analyzeMethod: jest.fn(),
        incrementalAnalyze: jest.fn(),
        analyzeInParallel: jest.fn()
      };

      expect(mockAnalysis.analyzeMethod).toBeDefined();
      expect(mockAnalysis.incrementalAnalyze).toBeDefined();
      expect(mockAnalysis.analyzeInParallel).toBeDefined();
    });
  });
});