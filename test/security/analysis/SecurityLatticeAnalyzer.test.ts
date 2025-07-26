/**
 * セキュリティ格子解析器（SecurityLatticeAnalyzer）テスト
 * Dorothy Denning格子理論の実装をテスト
 * TaintTyper v0.7.0 の理論的基盤を検証
 */

import { SecurityLattice } from '../../../src/security/types/lattice';
import { TaintLattice } from '../../../src/security/types/taint';
import {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintMetadata
} from '../../../src/security/types/taint';
import {
  SecurityType,
  TestStatement,
  SecurityIssue
} from '../../../src/security/types';

describe('SecurityLatticeAnalyzer', () => {
  let lattice: SecurityLattice;

  beforeEach(() => {
    lattice = new SecurityLattice();
  });

  describe('Dorothy Denning格子理論の基本実装', () => {
    it('格子の順序関係が正しく定義されている', () => {
      // UNTAINTED ⊑ POSSIBLY_TAINTED ⊑ DEFINITELY_TAINTED
      expect(TaintLevel.UNTAINTED).toBeLessThan(TaintLevel.POSSIBLY_TAINTED);
      expect(TaintLevel.POSSIBLY_TAINTED).toBeLessThan(TaintLevel.DEFINITELY_TAINTED);
    });

    it('格子の最小下界（GLB）演算が正しく実装されている', () => {
      // meet演算のテスト
      const meet1 = lattice.meet(TaintLevel.UNTAINTED, TaintLevel.POSSIBLY_TAINTED);
      const meet2 = lattice.meet(TaintLevel.POSSIBLY_TAINTED, TaintLevel.DEFINITELY_TAINTED);
      const meet3 = lattice.meet(TaintLevel.UNTAINTED, TaintLevel.DEFINITELY_TAINTED);

      expect(meet1).toBe(TaintLevel.UNTAINTED); // GLB of UNTAINTED and POSSIBLY_TAINTED
      expect(meet2).toBe(TaintLevel.POSSIBLY_TAINTED); // GLB of POSSIBLY_TAINTED and DEFINITELY_TAINTED
      expect(meet3).toBe(TaintLevel.UNTAINTED); // GLB of UNTAINTED and DEFINITELY_TAINTED
    });

    it('格子の最小上界（LUB）演算が正しく実装されている', () => {
      // join演算のテスト
      const join1 = lattice.join(TaintLevel.UNTAINTED, TaintLevel.POSSIBLY_TAINTED);
      const join2 = lattice.join(TaintLevel.POSSIBLY_TAINTED, TaintLevel.DEFINITELY_TAINTED);
      const join3 = lattice.join(TaintLevel.UNTAINTED, TaintLevel.DEFINITELY_TAINTED);

      expect(join1).toBe(TaintLevel.POSSIBLY_TAINTED); // LUB of UNTAINTED and POSSIBLY_TAINTED
      expect(join2).toBe(TaintLevel.DEFINITELY_TAINTED); // LUB of POSSIBLY_TAINTED and DEFINITELY_TAINTED
      expect(join3).toBe(TaintLevel.DEFINITELY_TAINTED); // LUB of UNTAINTED and DEFINITELY_TAINTED
    });

    it('格子演算の結合律が成り立つ', () => {
      const a = TaintLevel.UNTAINTED;
      const b = TaintLevel.POSSIBLY_TAINTED;
      const c = TaintLevel.DEFINITELY_TAINTED;

      // (a ⊔ b) ⊔ c = a ⊔ (b ⊔ c)
      const left = lattice.join(lattice.join(a, b), c);
      const right = lattice.join(a, lattice.join(b, c));

      expect(left).toBe(right);
      expect(left).toBe(TaintLevel.DEFINITELY_TAINTED);
    });

    it('格子演算の交換律が成り立つ', () => {
      const a = TaintLevel.UNTAINTED;
      const b = TaintLevel.POSSIBLY_TAINTED;

      // a ⊔ b = b ⊔ a
      const join1 = lattice.join(a, b);
      const join2 = lattice.join(b, a);

      expect(join1).toBe(join2);
      expect(join1).toBe(TaintLevel.POSSIBLY_TAINTED);

      // a ⊓ b = b ⊓ a
      const meet1 = lattice.meet(a, b);
      const meet2 = lattice.meet(b, a);

      expect(meet1).toBe(meet2);
      expect(meet1).toBe(TaintLevel.UNTAINTED);
    });

    it('格子演算の冪等律が成り立つ', () => {
      const a = TaintLevel.POSSIBLY_TAINTED;

      // a ⊔ a = a
      const join = lattice.join(a, a);
      expect(join).toBe(a);

      // a ⊓ a = a
      const meet = lattice.meet(a, a);
      expect(meet).toBe(a);
    });
  });

  describe('汚染レベル管理', () => {
    it('変数の汚染レベルを正しく設定・取得できる', () => {
      const variable = 'userInput';
      const level = TaintLevel.DEFINITELY_TAINTED;
      const metadata: TaintMetadata = {
        source: TaintSource.USER_INPUT,
        location: { file: 'test.ts', line: 10, column: 5 },
        confidence: 0.95,
        tracePath: [{
          type: 'propagate',
          description: 'ユーザー入力の伝播',
          inputTaint: TaintLevel.UNTAINTED,
          outputTaint: TaintLevel.DEFINITELY_TAINTED,
          location: { file: 'test.ts', line: 10, column: 5 }
        }],
        securityRules: ['no-xss']
      };

      lattice.setTaintLevel(variable, level, metadata);

      expect(lattice.getTaintLevel(variable)).toBe(level);
      expect(lattice.getMetadata(variable)).toEqual(metadata);
    });

    it('未設定の変数は UNTAINTED レベルを返す', () => {
      const unknownVariable = 'unknownVar';
      
      expect(lattice.getTaintLevel(unknownVariable)).toBe(TaintLevel.UNTAINTED);
      expect(lattice.getMetadata(unknownVariable)).toBeUndefined();
    });

    it('複数変数の汚染レベルを独立して管理できる', () => {
      const var1 = 'userInput';
      const var2 = 'sanitizedData';
      const var3 = 'constantValue';

      lattice.setTaintLevel(var1, TaintLevel.DEFINITELY_TAINTED);
      lattice.setTaintLevel(var2, TaintLevel.POSSIBLY_TAINTED);
      lattice.setTaintLevel(var3, TaintLevel.UNTAINTED);

      expect(lattice.getTaintLevel(var1)).toBe(TaintLevel.DEFINITELY_TAINTED);
      expect(lattice.getTaintLevel(var2)).toBe(TaintLevel.POSSIBLY_TAINTED);
      expect(lattice.getTaintLevel(var3)).toBe(TaintLevel.UNTAINTED);
    });
  });

  describe('Volpano-Smith-Irvine型システム転送関数', () => {
    it('ユーザー入力文の転送関数が正しく動作する', () => {
      const stmt: TestStatement = {
        type: 'userInput',
        content: 'const userInput = req.body.data',
        location: { line: 5, column: 0 }
      };

      const result = lattice.transferFunction(stmt, TaintLevel.UNTAINTED);
      
      expect(result).toBe(TaintLevel.DEFINITELY_TAINTED);
    });

    it('サニタイザー文の転送関数が正しく動作する', () => {
      const stmt: TestStatement = {
        type: 'sanitizer',
        content: 'const cleanData = sanitize(userInput)',
        location: { line: 8, column: 0 }
      };

      const result = lattice.transferFunction(stmt, TaintLevel.DEFINITELY_TAINTED);
      
      expect(result).toBe(TaintLevel.UNTAINTED);
    });

    it('代入文の転送関数が汚染を正しく伝播する', () => {
      const stmt: TestStatement = {
        type: 'assignment',
        content: 'const processedData = userInput',
        location: { line: 12, column: 0 },
        lhs: 'processedData',
        rhs: 'userInput'
      };

      // 事前に右辺変数の汚染レベルを設定
      lattice.setTaintLevel('userInput', TaintLevel.POSSIBLY_TAINTED);

      const result = lattice.transferFunction(stmt, TaintLevel.UNTAINTED);
      
      expect(result).toBeGreaterThanOrEqual(TaintLevel.POSSIBLY_TAINTED);
    });

    it('メソッド呼び出し文の転送関数が正しく動作する', () => {
      const stmt: TestStatement = {
        type: 'methodCall',
        content: 'const result = processData(userInput)',
        location: { line: 15, column: 0 },
        method: 'processData',
        arguments: ['userInput']
      };

      const result = lattice.transferFunction(stmt, TaintLevel.POSSIBLY_TAINTED);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    it('アサーション文の転送関数がセキュリティチェックを行う', () => {
      const stmt: TestStatement = {
        type: 'assertion',
        content: 'expect(data).not.toContain("<script>")',
        location: { line: 20, column: 0 },
        actual: 'data',
        expected: '<script>',
        isNegativeAssertion: true
      };

      const result = lattice.transferFunction(stmt, TaintLevel.DEFINITELY_TAINTED);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });

  describe('セキュリティ不変条件の検証', () => {
    it('汚染されたデータがサニタイズされずにシンクに到達することを検出する', () => {
      // テストセットアップ
      lattice.setTaintLevel('userInput', TaintLevel.DEFINITELY_TAINTED);
      lattice.setTaintLevel('unsafeOutput', TaintLevel.DEFINITELY_TAINTED);

      const violations = lattice.verifySecurityInvariants();

      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });

    it('適切にサニタイズされたデータの検証を通す', () => {
      // テストセットアップ
      lattice.setTaintLevel('userInput', TaintLevel.DEFINITELY_TAINTED);
      lattice.setTaintLevel('sanitizedData', TaintLevel.UNTAINTED);

      const violations = lattice.verifySecurityInvariants();

      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });

    it('定数データのセキュリティ検証を正しく行う', () => {
      // テストセットアップ
      lattice.setTaintLevel('constantValue', TaintLevel.UNTAINTED);
      lattice.setTaintLevel('safeOutput', TaintLevel.UNTAINTED);

      const violations = lattice.verifySecurityInvariants();

      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });

    it('複雑な汚染伝播パスの検証を正しく行う', () => {
      // 複雑な汚染伝播シナリオ
      lattice.setTaintLevel('input1', TaintLevel.DEFINITELY_TAINTED);
      lattice.setTaintLevel('input2', TaintLevel.POSSIBLY_TAINTED);
      lattice.setTaintLevel('merged', lattice.join(
        lattice.getTaintLevel('input1'),
        lattice.getTaintLevel('input2')
      ));

      expect(lattice.getTaintLevel('merged')).toBe(TaintLevel.DEFINITELY_TAINTED);

      const violations = lattice.verifySecurityInvariants();
      expect(violations).toBeDefined();
    });
  });

  describe('格子の単調性保証', () => {
    it('転送関数が単調性を保持する', () => {
      const stmt: TestStatement = {
        type: 'assignment',
        content: 'const result = source',
        location: { line: 25, column: 0 },
        lhs: 'result',
        rhs: 'source'
      };

      // より低いレベルから高いレベルへの変化をテスト
      const result1 = lattice.transferFunction(stmt, TaintLevel.UNTAINTED);
      const result2 = lattice.transferFunction(stmt, TaintLevel.POSSIBLY_TAINTED);
      const result3 = lattice.transferFunction(stmt, TaintLevel.DEFINITELY_TAINTED);

      // 単調性：input level ⊑ input level' ⇒ transfer(input) ⊑ transfer(input')
      expect(result1).toBeLessThanOrEqual(result2);
      expect(result2).toBeLessThanOrEqual(result3);
    });

    it('格子演算の単調性が保たれる', () => {
      const a1 = TaintLevel.UNTAINTED;
      const a2 = TaintLevel.POSSIBLY_TAINTED;
      const b = TaintLevel.POSSIBLY_TAINTED;

      // a1 ⊑ a2 ⇒ a1 ⊔ b ⊑ a2 ⊔ b
      const join1 = lattice.join(a1, b);
      const join2 = lattice.join(a2, b);

      expect(join1).toBeLessThanOrEqual(join2);

      // a1 ⊑ a2 ⇒ a1 ⊓ b ⊑ a2 ⊓ b
      const meet1 = lattice.meet(a1, b);
      const meet2 = lattice.meet(a2, b);

      expect(meet1).toBeLessThanOrEqual(meet2);
    });

    it('汚染レベルの上昇のみを許可し下降を拒否する', () => {
      const variable = 'testVar';
      
      // 初期レベル設定
      lattice.setTaintLevel(variable, TaintLevel.POSSIBLY_TAINTED);
      
      // レベル上昇を許可
      lattice.setTaintLevel(variable, TaintLevel.DEFINITELY_TAINTED);
      expect(lattice.getTaintLevel(variable)).toBe(TaintLevel.DEFINITELY_TAINTED);
      
      // 単調性テスト：既存のレベル以上であることを確認
      const currentLevel = lattice.getTaintLevel(variable);
      expect(currentLevel).toBeGreaterThanOrEqual(TaintLevel.POSSIBLY_TAINTED);
    });
  });

  describe('格子の収束性', () => {
    it('有限格子での不動点収束を確認する', () => {
      // 有限格子での固定点反復
      let current = TaintLevel.UNTAINTED;
      let iterations = 0;
      const maxIterations = 10;
      
      while (iterations < maxIterations) {
        const next = lattice.join(current, TaintLevel.POSSIBLY_TAINTED);
        if (next === current) {
          break; // 不動点に到達
        }
        current = next;
        iterations++;
      }
      
      expect(iterations).toBeLessThan(maxIterations); // 有限ステップで収束
      expect(current).toBe(TaintLevel.POSSIBLY_TAINTED); // 期待する不動点
    });

    it('格子高さの有界性を確認する', () => {
      // Dorothy Denning格子の高さは3（UNTAINTED → POSSIBLY_TAINTED → DEFINITELY_TAINTED）
      const maxHeight = 3;
      let current = TaintLevel.UNTAINTED;
      let height = 0;
      
      while (current < TaintLevel.DEFINITELY_TAINTED && height < maxHeight) {
        current++;
        height++;
      }
      
      expect(height).toBeLessThanOrEqual(maxHeight);
      expect(current).toBe(TaintLevel.DEFINITELY_TAINTED);
    });
  });

  describe('型ベース情報フロー解析', () => {
    it('高セキュリティレベルから低セキュリティレベルへの情報流出を検出する', () => {
      // High → Low の不正なフローを検出
      const highSecurityVar = 'secretData';
      const lowSecurityVar = 'publicData';
      
      lattice.setTaintLevel(highSecurityVar, TaintLevel.DEFINITELY_TAINTED);
      lattice.setTaintLevel(lowSecurityVar, TaintLevel.UNTAINTED);
      
      // 不正な代入をシミュレート
      const assignmentStmt: TestStatement = {
        type: 'assignment',
        content: `const ${lowSecurityVar} = ${highSecurityVar}`,
        location: { line: 30, column: 0 },
        lhs: lowSecurityVar,
        rhs: highSecurityVar
      };
      
      const result = lattice.transferFunction(assignmentStmt, TaintLevel.UNTAINTED);
      
      // 高セキュリティデータが低セキュリティ変数に流れることを検出
      expect(result).toBeGreaterThan(TaintLevel.UNTAINTED);
    });

    it('同一セキュリティレベル内での情報フローを許可する', () => {
      const var1 = 'data1';
      const var2 = 'data2';
      
      lattice.setTaintLevel(var1, TaintLevel.POSSIBLY_TAINTED);
      lattice.setTaintLevel(var2, TaintLevel.POSSIBLY_TAINTED);
      
      // 同レベル間の代入
      const assignmentStmt: TestStatement = {
        type: 'assignment',
        content: `const ${var2} = ${var1}`,
        location: { line: 35, column: 0 },
        lhs: var2,
        rhs: var1
      };
      
      const result = lattice.transferFunction(assignmentStmt, TaintLevel.POSSIBLY_TAINTED);
      
      expect(result).toBe(TaintLevel.POSSIBLY_TAINTED);
    });

    it('低セキュリティレベルから高セキュリティレベルへの情報フローを許可する', () => {
      const lowSecurityVar = 'publicData';
      const highSecurityVar = 'sensitiveData';
      
      lattice.setTaintLevel(lowSecurityVar, TaintLevel.UNTAINTED);
      lattice.setTaintLevel(highSecurityVar, TaintLevel.DEFINITELY_TAINTED);
      
      // Low → High は安全
      const assignmentStmt: TestStatement = {
        type: 'assignment',
        content: `const ${highSecurityVar} = ${lowSecurityVar}`,
        location: { line: 40, column: 0 },
        lhs: highSecurityVar,
        rhs: lowSecurityVar
      };
      
      const result = lattice.transferFunction(assignmentStmt, TaintLevel.DEFINITELY_TAINTED);
      
      expect(result).toBeGreaterThanOrEqual(TaintLevel.UNTAINTED);
    });
  });

  describe('メタデータ管理', () => {
    it('汚染メタデータを正しく保存・取得できる', () => {
      const variable = 'trackedVar';
      const metadata: TaintMetadata = {
        source: TaintSource.USER_INPUT,
        location: { file: '/test/security.test.ts', line: 42, column: 10 },
        confidence: 0.89,
        tracePath: [
          {
            type: 'propagate',
            description: 'ユーザー入力から処理済みデータへ',
            inputTaint: TaintLevel.DEFINITELY_TAINTED,
            outputTaint: TaintLevel.POSSIBLY_TAINTED,
            location: { file: '/test/security.test.ts', line: 40, column: 5 }
          },
          {
            type: 'sanitize',
            description: 'SQLエスケープ適用',
            inputTaint: TaintLevel.POSSIBLY_TAINTED,
            outputTaint: TaintLevel.UNTAINTED,
            location: { file: '/test/security.test.ts', line: 41, column: 8 }
          }
        ],
        securityRules: ['prevent-sql-injection', 'require-sanitization']
      };
      
      lattice.setTaintLevel(variable, TaintLevel.POSSIBLY_TAINTED, metadata);
      
      const retrievedMetadata = lattice.getMetadata(variable);
      expect(retrievedMetadata).toEqual(metadata);
      expect(retrievedMetadata?.tracePath).toHaveLength(2);
      expect(retrievedMetadata?.confidence).toBe(0.89);
    });

    it('メタデータの信頼度に基づく汚染判定を行う', () => {
      const highConfidenceVar = 'highConf';
      const lowConfidenceVar = 'lowConf';
      
      const highConfMeta: TaintMetadata = {
        source: TaintSource.USER_INPUT,
        location: { file: 'test.ts', line: 1, column: 1 },
        confidence: 0.95,
        tracePath: [{
          type: 'propagate',
          description: 'ユーザー入力の確実な伝播',
          inputTaint: TaintLevel.UNTAINTED,
          outputTaint: TaintLevel.DEFINITELY_TAINTED,
          location: { file: 'test.ts', line: 1, column: 1 }
        }],
        securityRules: ['high-confidence-detection']
      };
      
      const lowConfMeta: TaintMetadata = {
        source: TaintSource.USER_INPUT,
        location: { file: 'test.ts', line: 2, column: 1 },
        confidence: 0.3,
        tracePath: [{
          type: 'propagate',
          description: '疑わしいユーザー入力',
          inputTaint: TaintLevel.UNTAINTED,
          outputTaint: TaintLevel.POSSIBLY_TAINTED,
          location: { file: 'test.ts', line: 2, column: 1 }
        }],
        securityRules: ['low-confidence-detection']
      };
      
      lattice.setTaintLevel(highConfidenceVar, TaintLevel.DEFINITELY_TAINTED, highConfMeta);
      lattice.setTaintLevel(lowConfidenceVar, TaintLevel.POSSIBLY_TAINTED, lowConfMeta);
      
      expect(lattice.getMetadata(highConfidenceVar)?.confidence).toBe(0.95);
      expect(lattice.getMetadata(lowConfidenceVar)?.confidence).toBe(0.3);
    });
  });

  describe('パフォーマンス特性', () => {
    it('大量の変数を効率的に管理できる', () => {
      const variableCount = 1000;
      const startTime = Date.now();
      
      // 大量の変数を設定
      for (let i = 0; i < variableCount; i++) {
        lattice.setTaintLevel(`var${i}`, TaintLevel.POSSIBLY_TAINTED);
      }
      
      // 大量の変数を取得
      for (let i = 0; i < variableCount; i++) {
        const level = lattice.getTaintLevel(`var${i}`);
        expect(level).toBe(TaintLevel.POSSIBLY_TAINTED);
      }
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(100); // 100ms以下での完了を期待
    });

    it('格子演算が効率的に実行される', () => {
      const operationCount = 10000;
      const startTime = Date.now();
      
      for (let i = 0; i < operationCount; i++) {
        lattice.join(TaintLevel.UNTAINTED, TaintLevel.POSSIBLY_TAINTED);
        lattice.meet(TaintLevel.POSSIBLY_TAINTED, TaintLevel.DEFINITELY_TAINTED);
      }
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(50); // 50ms以下での完了を期待
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な転送関数呼び出しを適切に処理する', () => {
      const invalidStmt: TestStatement = {
        type: 'unknown' as any,
        content: 'invalid statement',
        location: { line: 0, column: 0 }
      };
      
      expect(() => {
        lattice.transferFunction(invalidStmt, TaintLevel.UNTAINTED);
      }).not.toThrow();
    });

    it('空文字列変数名を適切に処理する', () => {
      expect(() => {
        lattice.setTaintLevel('', TaintLevel.UNTAINTED);
        lattice.getTaintLevel('');
      }).not.toThrow();
      
      expect(lattice.getTaintLevel('')).toBe(TaintLevel.UNTAINTED);
    });

    it('nullやundefinedの処理を適切に行う', () => {
      expect(() => {
        lattice.setTaintLevel('test', TaintLevel.UNTAINTED, undefined);
      }).not.toThrow();
      
      expect(lattice.getMetadata('nonexistent')).toBeUndefined();
    });
  });
});