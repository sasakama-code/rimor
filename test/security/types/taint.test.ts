/**
 * taint.test.ts
 * Taint型システムのテスト
 * Dorothy Denning格子理論に基づく汚染分析システム
 */

describe('Taint Type System - 汚染型システム', () => {
  describe('TaintLevel - 汚染レベル', () => {
    it('汚染レベルの階層関係が正しく定義されていること', () => {
      const { TaintLevel } = require('../../../src/security/types/taint');
      
      expect(TaintLevel.CLEAN).toBeDefined();
      expect(TaintLevel.POSSIBLY_TAINTED).toBeDefined();
      expect(TaintLevel.DEFINITELY_TAINTED).toBeDefined();
      expect(TaintLevel.HIGHLY_TAINTED).toBeDefined();
    });

    it('汚染レベルの比較が正しく動作すること', () => {
      const { TaintLevel, compareTaintLevels } = require('../../../src/security/types/taint');
      
      expect(compareTaintLevels(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED)).toBeLessThan(0);
      expect(compareTaintLevels(TaintLevel.DEFINITELY_TAINTED, TaintLevel.POSSIBLY_TAINTED)).toBeGreaterThan(0);
      expect(compareTaintLevels(TaintLevel.CLEAN, TaintLevel.CLEAN)).toBe(0);
    });
  });

  describe('TaintSource - 汚染源', () => {
    it('汚染源の種類が適切に定義されていること', () => {
      const { TaintSource } = require('../../../src/security/types/taint');
      
      expect(TaintSource.USER_INPUT).toBeDefined();
      expect(TaintSource.DATABASE).toBeDefined();
      expect(TaintSource.NETWORK).toBeDefined();
      expect(TaintSource.FILE_SYSTEM).toBeDefined();
      expect(TaintSource.ENVIRONMENT).toBeDefined();
    });

    it('汚染源の危険度が正しく設定されていること', () => {
      const { TaintSource, getTaintSourceRisk } = require('../../../src/security/types/taint');
      
      expect(getTaintSourceRisk(TaintSource.USER_INPUT)).toBe('high');
      expect(getTaintSourceRisk(TaintSource.DATABASE)).toBe('medium');
      expect(getTaintSourceRisk(TaintSource.ENVIRONMENT)).toBe('low');
    });
  });

  describe('TaintedValue - 汚染値', () => {
    it('汚染値を正しく生成できること', () => {
      const { TaintedValue, TaintLevel, TaintSource } = require('../../../src/security/types/taint');
      
      const taintedValue = new TaintedValue('user input', TaintLevel.DEFINITELY_TAINTED, TaintSource.USER_INPUT);
      
      expect(taintedValue.value).toBe('user input');
      expect(taintedValue.taintLevel).toBe(TaintLevel.DEFINITELY_TAINTED);
      expect(taintedValue.source).toBe(TaintSource.USER_INPUT);
    });

    it('汚染値の結合が正しく動作すること', () => {
      const { TaintedValue, TaintLevel, TaintSource } = require('../../../src/security/types/taint');
      
      const value1 = new TaintedValue('clean', TaintLevel.CLEAN, null);
      const value2 = new TaintedValue('tainted', TaintLevel.DEFINITELY_TAINTED, TaintSource.USER_INPUT);
      
      const combined = TaintedValue.combine(value1, value2);
      
      expect(combined.taintLevel).toBe(TaintLevel.DEFINITELY_TAINTED);
      expect(combined.source).toBe(TaintSource.USER_INPUT);
    });
  });

  describe('Sanitizer - サニタイザー', () => {
    it('サニタイザーの種類が定義されていること', () => {
      const { SanitizerType } = require('../../../src/security/types/taint');
      
      expect(SanitizerType.HTML_ESCAPE).toBeDefined();
      expect(SanitizerType.SQL_ESCAPE).toBeDefined();
      expect(SanitizerType.INPUT_VALIDATION).toBeDefined();
      expect(SanitizerType.CRYPTO_HASH).toBeDefined();
    });

    it('サニタイザーが汚染を適切に除去すること', () => {
      const { TaintedValue, Sanitizer, TaintLevel, TaintSource, SanitizerType } = require('../../../src/security/types/taint');
      
      const taintedInput = new TaintedValue('<script>alert("xss")</script>', TaintLevel.DEFINITELY_TAINTED, TaintSource.USER_INPUT);
      const htmlSanitizer = new Sanitizer(SanitizerType.HTML_ESCAPE);
      
      const sanitized = htmlSanitizer.sanitize(taintedInput);
      
      expect(sanitized.taintLevel).toBe(TaintLevel.CLEAN);
      expect(sanitized.value).not.toContain('<script>');
    });

    it('不完全なサニタイザーが部分的な汚染除去を行うこと', () => {
      const { TaintedValue, Sanitizer, TaintLevel, TaintSource, SanitizerType } = require('../../../src/security/types/taint');
      
      const highlyTainted = new TaintedValue('malicious data', TaintLevel.HIGHLY_TAINTED, TaintSource.USER_INPUT);
      const weakSanitizer = new Sanitizer(SanitizerType.INPUT_VALIDATION, 0.5); // 50%の効果
      
      const partiallySanitized = weakSanitizer.sanitize(highlyTainted);
      
      expect(partiallySanitized.taintLevel).toBe(TaintLevel.POSSIBLY_TAINTED);
    });
  });

  describe('TaintPropagation - 汚染伝播', () => {
    it('汚染の伝播ルールが正しく適用されること', () => {
      const { TaintPropagation, TaintedValue, TaintLevel, TaintSource } = require('../../../src/security/types/taint');
      
      const clean = new TaintedValue('clean', TaintLevel.CLEAN, null);
      const tainted = new TaintedValue('tainted', TaintLevel.DEFINITELY_TAINTED, TaintSource.USER_INPUT);
      
      // 汚染値と清浄値の演算
      const result = TaintPropagation.propagate('concat', [clean, tainted]);
      
      expect(result.taintLevel).toBe(TaintLevel.DEFINITELY_TAINTED);
      expect(result.source).toBe(TaintSource.USER_INPUT);
    });

    it('複数の汚染源からの最高レベルが選択されること', () => {
      const { TaintPropagation, TaintedValue, TaintLevel, TaintSource } = require('../../../src/security/types/taint');
      
      const lowTaint = new TaintedValue('low', TaintLevel.POSSIBLY_TAINTED, TaintSource.ENVIRONMENT);
      const highTaint = new TaintedValue('high', TaintLevel.HIGHLY_TAINTED, TaintSource.USER_INPUT);
      
      const result = TaintPropagation.propagate('merge', [lowTaint, highTaint]);
      
      expect(result.taintLevel).toBe(TaintLevel.HIGHLY_TAINTED);
      expect(result.source).toBe(TaintSource.USER_INPUT);
    });
  });

  describe('TaintAnalyzer - 汚染分析器', () => {
    it('関数の汚染分析を実行できること', () => {
      const { TaintAnalyzer } = require('../../../src/security/types/taint');
      
      const analyzer = new TaintAnalyzer();
      const functionCode = `
        function processInput(userInput) {
          const escaped = escapeHtml(userInput);
          return database.store(escaped);
        }
      `;
      
      const analysis = analyzer.analyzeFunction(functionCode);
      
      expect(analysis).toBeDefined();
      expect(analysis.taintSources.length).toBeGreaterThan(0);
      expect(analysis.sanitizers.length).toBeGreaterThan(0);
      expect(analysis.taintFlow).toBeDefined();
    });

    it('汚染違反を検出できること', () => {
      const { TaintAnalyzer } = require('../../../src/security/types/taint');
      
      const analyzer = new TaintAnalyzer();
      const unsafeCode = `
        function unsafeFunction(userInput) {
          return eval(userInput); // 直接実行 - 汚染違反
        }
      `;
      
      const violations = analyzer.detectViolations(unsafeCode);
      
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].type).toBe('taint-violation');
      expect(violations[0].severity).toBe('critical');
    });
  });

  describe('TaintLattice - 汚染格子', () => {
    it('Dorothy Denning格子理論に基づく順序関係が正しいこと', () => {
      const { TaintLattice, TaintLevel } = require('../../../src/security/types/taint');
      
      const lattice = new TaintLattice();
      
      // 格子の底（最小要素）はCLEAN
      expect(lattice.isBottom(TaintLevel.CLEAN)).toBe(true);
      expect(lattice.isBottom(TaintLevel.DEFINITELY_TAINTED)).toBe(false);
      
      // 格子の頂（最大要素）はHIGHLY_TAINTED
      expect(lattice.isTop(TaintLevel.HIGHLY_TAINTED)).toBe(true);
      expect(lattice.isTop(TaintLevel.CLEAN)).toBe(false);
    });

    it('上限（join）演算が正しく動作すること', () => {
      const { TaintLattice, TaintLevel } = require('../../../src/security/types/taint');
      
      const lattice = new TaintLattice();
      
      const join1 = lattice.join(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED);
      expect(join1).toBe(TaintLevel.POSSIBLY_TAINTED);
      
      const join2 = lattice.join(TaintLevel.DEFINITELY_TAINTED, TaintLevel.HIGHLY_TAINTED);
      expect(join2).toBe(TaintLevel.HIGHLY_TAINTED);
    });

    it('下限（meet）演算が正しく動作すること', () => {
      const { TaintLattice, TaintLevel } = require('../../../src/security/types/taint');
      
      const lattice = new TaintLattice();
      
      const meet1 = lattice.meet(TaintLevel.DEFINITELY_TAINTED, TaintLevel.POSSIBLY_TAINTED);
      expect(meet1).toBe(TaintLevel.POSSIBLY_TAINTED);
      
      const meet2 = lattice.meet(TaintLevel.HIGHLY_TAINTED, TaintLevel.CLEAN);
      expect(meet2).toBe(TaintLevel.CLEAN);
    });
  });

  describe('型推論統合', () => {
    it('TypeScript型注釈から汚染情報を推論できること', () => {
      const { TaintTypeInference } = require('../../../src/security/types/taint');
      
      const inference = new TaintTypeInference();
      const typeAnnotation = '@TaintedString(level=HIGH, source=USER_INPUT)';
      
      const taintInfo = inference.inferFromAnnotation(typeAnnotation);
      
      expect(taintInfo.level).toBe('HIGH');
      expect(taintInfo.source).toBe('USER_INPUT');
    });

    it('汚染型の互換性チェックが動作すること', () => {
      const { TaintTypeChecker, TaintLevel } = require('../../../src/security/types/taint');
      
      const checker = new TaintTypeChecker();
      
      // 汚染値を清浄な変数に代入しようとする
      const isCompatible = checker.isAssignmentSafe(
        TaintLevel.DEFINITELY_TAINTED,
        TaintLevel.CLEAN
      );
      
      expect(isCompatible).toBe(false);
    });
  });
});