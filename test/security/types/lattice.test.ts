/**
 * 型ベースセキュリティ解析 - セキュリティ格子システムのテスト
 */

import {
  SecurityLattice,
  SecurityViolation,
  LatticeAnalysisStats
} from '../../../src/security/types/lattice';
import {
  TaintLevel,
  TaintSource,
  TaintMetadata,
  TaintTraceStep
} from '../../../src/security/types/taint';
import { SecuritySink, SanitizerType } from '../../../src/types/common-types';
import { TestStatement } from '../../../src/security/types/security';

describe('SecurityLattice', () => {
  let lattice: SecurityLattice;

  beforeEach(() => {
    lattice = new SecurityLattice();
  });

  describe('基本操作', () => {
    it('汚染レベルを設定・取得できること', () => {
      lattice.setTaintLevel('userInput', TaintLevel.DEFINITELY_TAINTED);
      expect(lattice.getTaintLevel('userInput')).toBe(TaintLevel.DEFINITELY_TAINTED);
    });

    it('存在しない変数の汚染レベルはUNTAINTEDを返すこと', () => {
      expect(lattice.getTaintLevel('nonExistent')).toBe(TaintLevel.UNTAINTED);
    });

    it('メタデータを設定・取得できること', () => {
      const metadata: TaintMetadata = {
        level: TaintLevel.DEFINITELY_TAINTED,
        sources: [TaintSource.USER_INPUT],
        sinks: [SecuritySink.DATABASE],
        sanitizers: [SanitizerType.INPUT_VALIDATION],
        propagationPath: ['input', 'process', 'output']
      };

      lattice.setTaintLevel('userInput', TaintLevel.DEFINITELY_TAINTED, metadata);
      expect(lattice.getMetadata('userInput')).toEqual(metadata);
    });

    it('メタデータなしでも汚染レベルを設定できること', () => {
      lattice.setTaintLevel('variable', TaintLevel.POSSIBLY_TAINTED);
      expect(lattice.getTaintLevel('variable')).toBe(TaintLevel.POSSIBLY_TAINTED);
      expect(lattice.getMetadata('variable')).toBeUndefined();
    });
  });

  describe('格子演算', () => {
    it('join演算が正しく動作すること', () => {
      expect(lattice.join(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
      
      expect(lattice.join(TaintLevel.LIKELY_TAINTED, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.LIKELY_TAINTED);
    });

    it('meet演算が正しく動作すること', () => {
      expect(lattice.meet(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.CLEAN);
      
      expect(lattice.meet(TaintLevel.LIKELY_TAINTED, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
    });
  });

  describe('transferFunction', () => {
    it('サニタイザー文で汚染が除去されること', () => {
      const sanitizerStmt: TestStatement = {
        type: 'sanitizer',
        content: 'sanitize(input)',
        location: { line: 10, column: 5 }
      };

      const result = lattice.transferFunction(sanitizerStmt, TaintLevel.HIGHLY_TAINTED);
      expect(result).toBe(TaintLevel.UNTAINTED);
    });

    it('ユーザー入力文で最高レベルの汚染が設定されること', () => {
      const userInputStmt: TestStatement = {
        type: 'userInput',
        content: 'const input = req.body.data',
        location: { line: 20, column: 5 }
      };

      const result = lattice.transferFunction(userInputStmt, TaintLevel.CLEAN);
      expect(result).toBe(TaintLevel.DEFINITELY_TAINTED);
    });

    describe('代入文', () => {
      it('右辺の汚染が伝播すること', () => {
        lattice.setTaintLevel('taintedVar', TaintLevel.LIKELY_TAINTED);
        
        const assignmentStmt: TestStatement = {
          type: 'assignment',
          content: 'const newVar = taintedVar',
          location: { line: 30, column: 5 },
          lhs: 'newVar',
          rhs: 'taintedVar'
        };

        const result = lattice.transferFunction(assignmentStmt, TaintLevel.CLEAN);
        expect(result).toBe(TaintLevel.LIKELY_TAINTED);
      });

      it('右辺がない場合は入力レベルを保持すること', () => {
        const assignmentStmt: TestStatement = {
          type: 'assignment',
          content: 'let x',
          location: { line: 40, column: 5 },
          lhs: 'x'
        };

        const result = lattice.transferFunction(assignmentStmt, TaintLevel.POSSIBLY_TAINTED);
        expect(result).toBe(TaintLevel.POSSIBLY_TAINTED);
      });
    });

    describe('メソッド呼び出し', () => {
      it('サニタイザーメソッドで汚染が除去されること', () => {
        const methodStmt: TestStatement = {
          type: 'methodCall',
          content: 'const clean = escapeHtml(dirty)',
          location: { line: 50, column: 5 },
          method: 'escapeHtml',
          arguments: ['dirty']
        };

        const result = lattice.transferFunction(methodStmt, TaintLevel.HIGHLY_TAINTED);
        expect(result).toBe(TaintLevel.UNTAINTED);
      });

      it('通常のメソッドで引数の汚染が伝播すること', () => {
        lattice.setTaintLevel('dirtyData', TaintLevel.LIKELY_TAINTED);
        
        const methodStmt: TestStatement = {
          type: 'methodCall',
          content: 'const result = process(dirtyData)',
          location: { line: 60, column: 5 },
          method: 'process',
          arguments: ['dirtyData']
        };

        const result = lattice.transferFunction(methodStmt, TaintLevel.CLEAN);
        expect(result).toBe(TaintLevel.LIKELY_TAINTED);
      });

      it('引数がない場合は入力レベルを保持すること', () => {
        const methodStmt: TestStatement = {
          type: 'methodCall',
          content: 'const result = getData()',
          location: { line: 70, column: 5 },
          method: 'getData'
        };

        const result = lattice.transferFunction(methodStmt, TaintLevel.POSSIBLY_TAINTED);
        expect(result).toBe(TaintLevel.POSSIBLY_TAINTED);
      });
    });

    describe('アサーション', () => {
      it('汚染されたデータのアサーションで警告が出ること', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        lattice.setTaintLevel('taintedData', TaintLevel.LIKELY_TAINTED);
        
        const assertionStmt: TestStatement = {
          type: 'assertion',
          content: 'expect(taintedData).toBe("expected")',
          location: { line: 80, column: 5 },
          actual: 'taintedData',
          expected: '"expected"',
          isNegativeAssertion: false
        };

        const result = lattice.transferFunction(assertionStmt, TaintLevel.CLEAN);
        expect(result).toBe(TaintLevel.LIKELY_TAINTED);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Potentially unsafe assertion: testing tainted data at line 80'
        );

        consoleSpy.mockRestore();
      });

      it('否定アサーションでは警告が出ないこと', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        lattice.setTaintLevel('taintedData', TaintLevel.HIGHLY_TAINTED);
        
        const assertionStmt: TestStatement = {
          type: 'assertion',
          content: 'expect(taintedData).not.toBe("dangerous")',
          location: { line: 90, column: 5 },
          actual: 'taintedData',
          expected: '"dangerous"',
          isNegativeAssertion: true
        };

        lattice.transferFunction(assertionStmt, TaintLevel.CLEAN);
        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });

    it('不明な文タイプでは入力レベルを保持すること', () => {
      const unknownStmt: TestStatement = {
        type: 'unknown' as any,
        content: 'unknown statement',
        location: { line: 100, column: 5 }
      };

      const result = lattice.transferFunction(unknownStmt, TaintLevel.POSSIBLY_TAINTED);
      expect(result).toBe(TaintLevel.POSSIBLY_TAINTED);
    });
  });

  describe('verifySecurityInvariants', () => {
    it('サニタイズされていない汚染フローを検出できること', () => {
      const metadata: TaintMetadata = {
        level: TaintLevel.DEFINITELY_TAINTED,
        sources: [TaintSource.USER_INPUT],
        sinks: [SecuritySink.DATABASE],
        sanitizers: [],
        propagationPath: ['input', 'process', 'output']
      };

      lattice.setTaintLevel('userInput', TaintLevel.DEFINITELY_TAINTED, metadata);
      
      const violations = lattice.verifySecurityInvariants();
      
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('unsanitized-taint-flow');
      expect(violations[0].variable).toBe('userInput');
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].suggestedFix).toContain('escape()またはvalidate()');
    });

    it('低レベルの汚染では違反を報告しないこと', () => {
      const metadata: TaintMetadata = {
        level: TaintLevel.POSSIBLY_TAINTED,
        sources: [TaintSource.ENVIRONMENT],
        sinks: [SecuritySink.FILE_SYSTEM],
        sanitizers: [],
        propagationPath: ['env', 'process']
      };

      lattice.setTaintLevel('envVar', TaintLevel.POSSIBLY_TAINTED, metadata);
      
      const violations = lattice.verifySecurityInvariants();
      
      expect(violations).toHaveLength(0);
    });

    it('複数の違反を検出できること', () => {
      // 違反1: ユーザー入力
      const userInputMetadata: TaintMetadata = {
        level: TaintLevel.DEFINITELY_TAINTED,
        sources: [TaintSource.USER_INPUT],
        sinks: [SecuritySink.DATABASE],
        sanitizers: [],
        propagationPath: ['input', 'process']
      };

      // 違反2: 外部API
      const apiMetadata: TaintMetadata = {
        level: TaintLevel.LIKELY_TAINTED,
        sources: [TaintSource.EXTERNAL_API],
        sinks: [SecuritySink.EVAL],
        sanitizers: [],
        propagationPath: ['api', 'eval']
      };

      lattice.setTaintLevel('userInput', TaintLevel.DEFINITELY_TAINTED, userInputMetadata);
      lattice.setTaintLevel('apiResponse', TaintLevel.LIKELY_TAINTED, apiMetadata);
      
      const violations = lattice.verifySecurityInvariants();
      
      expect(violations).toHaveLength(2);
      expect(violations[0].variable).toBe('userInput');
      expect(violations[1].variable).toBe('apiResponse');
      expect(violations[1].suggestedFix).toContain('JSON.parse()');
    });
  });

  describe('ユーティリティメソッド', () => {
    it('格子の状態をクリアできること', () => {
      lattice.setTaintLevel('var1', TaintLevel.DEFINITELY_TAINTED);
      lattice.setTaintLevel('var2', TaintLevel.POSSIBLY_TAINTED);
      
      lattice.clear();
      
      expect(lattice.getTaintLevel('var1')).toBe(TaintLevel.UNTAINTED);
      expect(lattice.getTaintLevel('var2')).toBe(TaintLevel.UNTAINTED);
    });

    it('格子の状態をクローンできること', () => {
      const metadata: TaintMetadata = {
        level: TaintLevel.DEFINITELY_TAINTED,
        sources: [TaintSource.USER_INPUT],
        sinks: [SecuritySink.DATABASE],
        sanitizers: [],
        propagationPath: ['input', 'process']
      };

      lattice.setTaintLevel('original', TaintLevel.DEFINITELY_TAINTED, metadata);
      
      const clone = lattice.clone();
      
      // クローンは同じ値を持つ
      expect(clone.getTaintLevel('original')).toBe(TaintLevel.DEFINITELY_TAINTED);
      expect(clone.getMetadata('original')).toEqual(metadata);
      
      // クローンを変更してもオリジナルに影響しない
      clone.setTaintLevel('original', TaintLevel.CLEAN);
      expect(lattice.getTaintLevel('original')).toBe(TaintLevel.DEFINITELY_TAINTED);
    });
  });
});

describe('インターフェース定義のテスト', () => {
  describe('SecurityViolation', () => {
    it('セキュリティ違反を正しく定義できること', () => {
      const violation: SecurityViolation = {
        type: 'unsanitized-taint-flow',
        message: 'Unsanitized user input flows to database',
        variable: 'userInput',
        taintLevel: TaintLevel.DEFINITELY_TAINTED,
        metadata: {
          level: TaintLevel.DEFINITELY_TAINTED,
          sources: [TaintSource.USER_INPUT],
          sinks: [SecuritySink.DATABASE],
          sanitizers: [],
          propagationPath: ['input', 'process']
        },
        severity: 'critical',
        suggestedFix: '入力値をescape()でサニタイズしてください'
      };

      expect(violation.type).toBe('unsanitized-taint-flow');
      expect(violation.severity).toBe('critical');
    });

    it('すべての違反タイプが使用できること', () => {
      const violationTypes: SecurityViolation['type'][] = [
        'unsanitized-taint-flow',
        'missing-sanitizer',
        'unsafe-assertion',
        'sql-injection',
        'xss',
        'command-injection'
      ];

      violationTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('LatticeAnalysisStats', () => {
    it('格子分析の統計情報を正しく定義できること', () => {
      const stats: LatticeAnalysisStats = {
        variablesAnalyzed: 50,
        taintedVariables: 15,
        violationsFound: 3,
        analysisTime: 250,
        latticeHeight: 4
      };

      expect(stats.variablesAnalyzed).toBe(50);
      expect(stats.taintedVariables).toBe(15);
      expect(stats.violationsFound).toBe(3);
      expect(stats.analysisTime).toBe(250);
      expect(stats.latticeHeight).toBe(4);
    });
  });
});