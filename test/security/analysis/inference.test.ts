/**
 * inference.test.ts
 * 型ベースセキュリティ解析の推論エンジンテスト
 * TaintTyper v0.7.0 - Dorothy Denning格子理論ベースの高度なセキュリティテスト推論
 */

import { SignatureBasedInference } from '../../../src/security/analysis/inference';
import {
  MethodSignature,
  Parameter,
  SecurityRequirement,
  SecurityType,
  TaintLevel,
  TaintSource,
  TypeInferenceResult
} from '../../../src/security/types';

describe('SignatureBasedInference - 型ベースセキュリティ推論エンジン', () => {
  let inference: SignatureBasedInference;

  beforeEach(() => {
    inference = new SignatureBasedInference();
  });

  describe('認証関連メソッドの推論', () => {
    it('login関数から認証テスト要件を正しく推論すること', () => {
      const loginSignature: MethodSignature = {
        name: 'login',
        parameters: [
          { name: 'username', type: 'string', annotations: [] },
          { name: 'password', type: 'string', annotations: [] }
        ],
        returnType: 'Promise<AuthResult>',
        annotations: []
      };

      const requirements = inference.inferRequirements(loginSignature);

      // 認証関連の要件が含まれることを確認
      expect(requirements).toHaveLength(2); // auth-req と credential-req
      
      const authReq = requirements.find(r => r.id.includes('auth-req'));
      expect(authReq).toBeDefined();
      expect(authReq?.type).toBe('auth-test');
      
      const credentialReq = requirements.find(r => r.id.includes('credential-req'));
      expect(credentialReq).toBeDefined();
      expect(credentialReq?.required).toContain('credential-validation');
      expect(credentialReq?.required).toContain('brute-force-protection');
      expect(credentialReq?.required).toContain('timing-attack-protection');
      expect(credentialReq?.minTaintLevel).toBe(TaintLevel.DEFINITELY_TAINTED);
    });

    it('authenticate関数から適切なテスト要件を推論すること', () => {
      const authSignature: MethodSignature = {
        name: 'authenticate',
        parameters: [
          { name: 'token', type: 'string', annotations: [] }
        ],
        returnType: 'boolean',
        annotations: []
      };

      const requirements = inference.inferRequirements(authSignature);

      expect(requirements.length).toBeGreaterThan(0);
      const authReq = requirements.find(r => r.type === 'auth-test');
      expect(authReq).toBeDefined();
      expect(authReq?.applicableSources).toContain(TaintSource.USER_INPUT);
    });

    it('非認証関連メソッドでは認証要件が推論されないこと', () => {
      const regularSignature: MethodSignature = {
        name: 'calculateSum',
        parameters: [
          { name: 'a', type: 'number', annotations: [] },
          { name: 'b', type: 'number', annotations: [] }
        ],
        returnType: 'number',
        annotations: []
      };

      const requirements = inference.inferRequirements(regularSignature);

      const authRequirements = requirements.filter(r => r.type === 'auth-test');
      expect(authRequirements).toHaveLength(0);
    });
  });

  describe('入力検証要件の推論', () => {
    it('ユーザー入力を受け取る関数から入力検証要件を推論すること', () => {
      const userInputSignature: MethodSignature = {
        name: 'validateUserInput',
        parameters: [
          { name: 'userInput', type: 'string', annotations: [] },
          { name: 'schema', type: 'ValidationSchema', annotations: [] }
        ],
        returnType: 'ValidationResult',
        annotations: []
      };

      const requirements = inference.inferRequirements(userInputSignature);

      const inputValidationReqs = requirements.filter(r => 
        r.type === 'input-validation-test'
      );
      expect(inputValidationReqs.length).toBeGreaterThan(0);
      
      const inputReq = inputValidationReqs[0];
      expect(inputReq.minTaintLevel).toBe(TaintLevel.DEFINITELY_TAINTED);
      expect(inputReq.applicableSources).toContain(TaintSource.USER_INPUT);
    });

    it('SQL関連メソッドからSQLインジェクション防止要件を推論すること', () => {
      const sqlSignature: MethodSignature = {
        name: 'executeQuery',
        parameters: [
          { name: 'query', type: 'string', annotations: [] },
          { name: 'params', type: 'any[]', annotations: [] }
        ],
        returnType: 'Promise<QueryResult>',
        annotations: []
      };

      const requirements = inference.inferRequirements(sqlSignature);

      const sqlInjectionReqs = requirements.filter(r => 
        r.required?.includes('sql-injection-protection')
      );
      expect(sqlInjectionReqs.length).toBeGreaterThan(0);
    });

    it('XSS脆弱性対象メソッドから適切な要件を推論すること', () => {
      const renderSignature: MethodSignature = {
        name: 'renderTemplate',
        parameters: [
          { name: 'template', type: 'string', annotations: [] },
          { name: 'data', type: 'any', annotations: [] }
        ],
        returnType: 'string',
        annotations: []
      };

      const requirements = inference.inferRequirements(renderSignature);

      const xssReqs = requirements.filter(r => 
        r.required?.includes('xss-protection')
      );
      expect(xssReqs.length).toBeGreaterThan(0);
    });
  });

  describe('API セキュリティ要件の推論', () => {
    it('REST API エンドポイントから適切な要件を推論すること', () => {
      const apiSignature: MethodSignature = {
        name: 'handleApiRequest',
        parameters: [
          { name: 'request', type: 'ApiRequest', annotations: [] },
          { name: 'response', type: 'ApiResponse', annotations: [] }
        ],
        returnType: 'Promise<void>',
        annotations: []
      };

      const requirements = inference.inferRequirements(apiSignature);

      const apiSecurityReqs = requirements.filter(r => 
        r.type === 'api-security-test'
      );
      expect(apiSecurityReqs.length).toBeGreaterThan(0);
      
      const apiReq = apiSecurityReqs[0];
      expect(apiReq.required).toContain('rate-limiting');
      expect(apiReq.required).toContain('cors-validation');
      expect(apiReq.required).toContain('request-size-limits');
    });

    it('ファイルアップロード関数から適切な要件を推論すること', () => {
      const uploadSignature: MethodSignature = {
        name: 'uploadFile',
        parameters: [
          { name: 'file', type: 'File', annotations: [] },
          { name: 'destination', type: 'string', annotations: [] }
        ],
        returnType: 'Promise<UploadResult>',
        annotations: []
      };

      const requirements = inference.inferRequirements(uploadSignature);

      const uploadReqs = requirements.filter(r => 
        r.required?.includes('file-type-validation') ||
        r.required?.includes('file-size-limits') ||
        r.required?.includes('malware-scanning')
      );
      expect(uploadReqs.length).toBeGreaterThan(0);
    });
  });

  describe('セッション管理要件の推論', () => {
    it('セッション操作関数から適切な要件を推論すること', () => {
      const sessionSignature: MethodSignature = {
        name: 'createSession',
        parameters: [
          { name: 'userId', type: 'string', annotations: [] },
          { name: 'sessionData', type: 'SessionData', annotations: [] }
        ],
        returnType: 'Session',
        annotations: []
      };

      const requirements = inference.inferRequirements(sessionSignature);

      const sessionReqs = requirements.filter(r => 
        r.type === 'session-security-test'
      );
      expect(sessionReqs.length).toBeGreaterThan(0);
      
      const sessionReq = sessionReqs[0];
      expect(sessionReq.required).toContain('session-fixation-protection');
      expect(sessionReq.required).toContain('session-timeout');
      expect(sessionReq.required).toContain('secure-cookie-settings');
    });

    it('セッション無効化関数から適切な要件を推論すること', () => {
      const invalidateSignature: MethodSignature = {
        name: 'invalidateSession',
        parameters: [
          { name: 'sessionId', type: 'string', annotations: [] }
        ],
        returnType: 'boolean',
        annotations: []
      };

      const requirements = inference.inferRequirements(invalidateSignature);

      const invalidationReqs = requirements.filter(r => 
        r.required?.includes('proper-cleanup') ||
        r.required?.includes('logout-confirmation')
      );
      expect(invalidationReqs.length).toBeGreaterThan(0);
    });
  });

  describe('型推論結果の生成', () => {
    it('複雑なメソッドシグネチャから包括的な推論結果を生成すること', () => {
      const complexSignature: MethodSignature = {
        name: 'processUserPayment',
        parameters: [
          { name: 'userId', type: 'string', annotations: [] },
          { name: 'paymentData', type: 'PaymentInfo', annotations: [] },
          { name: 'amount', type: 'number', annotations: [] }
        ],
        returnType: 'Promise<PaymentResult>',
        annotations: []
      };

      const result = inference.analyzeTypeRequirements(complexSignature);

      expect(result).toBeDefined();
      expect(result.signature).toEqual(complexSignature);
      expect(result.securityRelevance).toBeGreaterThan(0.5); // 高いセキュリティ関連性
      expect(result.testingNeeds.length).toBeGreaterThan(0);
      expect(result.recommendedTestTypes.length).toBeGreaterThan(0);
      expect(result.estimatedTestCount).toBeGreaterThan(1);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('セキュリティ関連性が低いメソッドでは適切な推論結果を生成すること', () => {
      const lowSecuritySignature: MethodSignature = {
        name: 'formatDate',
        parameters: [
          { name: 'date', type: 'Date', annotations: [] },
          { name: 'format', type: 'string', annotations: [] }
        ],
        returnType: 'string',
        annotations: []
      };

      const result = inference.analyzeTypeRequirements(lowSecuritySignature);

      expect(result.securityRelevance).toBeLessThan(0.3); // 低いセキュリティ関連性
      expect(result.riskLevel).toBe('low');
      expect(result.estimatedTestCount).toBeLessThanOrEqual(2);
    });
  });

  describe('テスト推奨の生成', () => {
    it('認証メソッドに対して適切なテストタイプを推奨すること', () => {
      const authSignature: MethodSignature = {
        name: 'verifyCredentials',
        parameters: [
          { name: 'username', type: 'string', annotations: [] },
          { name: 'password', type: 'string', annotations: [] }
        ],
        returnType: 'AuthResult',
        annotations: []
      };

      const result = inference.analyzeTypeRequirements(authSignature);

      expect(result.recommendedTestTypes).toContain('unit');
      expect(result.recommendedTestTypes).toContain('security');
      expect(result.recommendedTestTypes).toContain('integration');
    });

    it('入力検証メソッドに対して適切なテスト数を推定すること', () => {
      const validationSignature: MethodSignature = {
        name: 'sanitizeInput',
        parameters: [
          { name: 'userInput', type: 'string', annotations: [] },
          { name: 'allowedChars', type: 'string[]', annotations: [] }
        ],
        returnType: 'string',
        annotations: []
      };

      const result = inference.analyzeTypeRequirements(validationSignature);

      // セキュリティ関連の入力検証は多くのテストケースが必要
      expect(result.estimatedTestCount).toBeGreaterThanOrEqual(5);
      expect(result.recommendedTestTypes).toContain('edge-case');
      expect(result.recommendedTestTypes).toContain('security');
    });
  });

  describe('エラーハンドリングとエッジケース', () => {
    it('空のパラメータリストを持つメソッドを処理できること', () => {
      const emptyParamsSignature: MethodSignature = {
        name: 'getCurrentUser',
        parameters: [],
        returnType: 'User',
        annotations: []
      };

      expect(() => {
        const requirements = inference.inferRequirements(emptyParamsSignature);
        expect(Array.isArray(requirements)).toBe(true);
      }).not.toThrow();
    });

    it('undefined/null値を含むシグネチャを適切に処理すること', () => {
      const malformedSignature: MethodSignature = {
        name: 'testMethod',
        parameters: [
          { name: 'param1', type: 'string', annotations: [] },
          { name: '', type: 'any', annotations: [] } // 空の名前
        ],
        returnType: 'void',
        annotations: []
      };

      expect(() => {
        const requirements = inference.inferRequirements(malformedSignature);
        expect(Array.isArray(requirements)).toBe(true);
      }).not.toThrow();
    });

    it('非常に長いメソッド名やパラメータを処理できること', () => {
      const longSignature: MethodSignature = {
        name: 'a'.repeat(1000), // 1000文字のメソッド名
        parameters: Array.from({ length: 50 }, (_, i) => ({
          name: `param${i}`,
          type: 'string',
          annotations: []
        })),
        returnType: 'any',
        annotations: []
      };

      expect(() => {
        const requirements = inference.inferRequirements(longSignature);
        expect(Array.isArray(requirements)).toBe(true);
      }).not.toThrow();
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のメソッドシグネチャを効率的に処理できること', () => {
      const signatures = Array.from({ length: 100 }, (_, i) => ({
        name: `method${i}`,
        parameters: [
          { name: 'param1', type: 'string', annotations: [] },
          { name: 'param2', type: 'number', annotations: [] }
        ],
        returnType: 'any',
        annotations: []
      }));

      const startTime = Date.now();
      
      signatures.forEach(sig => {
        inference.inferRequirements(sig);
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 100個のシグネチャを1秒以内で処理できることを確認
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe('知識ベースの統合', () => {
    it('セキュリティ知識ベースが適切に初期化されること', () => {
      expect(inference).toBeDefined();
      
      // 知識ベースの動作を間接的に確認
      const testSignature: MethodSignature = {
        name: 'login',
        parameters: [
          { name: 'username', type: 'string', annotations: [] },
          { name: 'password', type: 'string', annotations: [] }
        ],
        returnType: 'AuthResult',
        annotations: []
      };

      const requirements = inference.inferRequirements(testSignature);
      
      // 知識ベースが機能していれば適切な推論結果が得られる
      expect(requirements.length).toBeGreaterThan(0);
    });
  });
});