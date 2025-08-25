/**
 * IntentPatternMatcher テスト
 * TDDアプローチ: Red → Green → Refactor
 * t_wadaの推奨するTDDサイクルに従って実装
 */

import { IntentPatternMatcher, TestPattern } from '../../src/intent-analysis/IntentPatternMatcher';
import { TestType, CoverageScope } from '../../src/intent-analysis/ITestIntentAnalyzer';
import { ASTNode } from '../../src/core/interfaces/IAnalysisEngine';

describe('IntentPatternMatcher', () => {
  let matcher: IntentPatternMatcher;

  beforeEach(() => {
    matcher = new IntentPatternMatcher();
  });

  describe('identifyTestPattern', () => {
    it('ハッピーパステストを識別できる', () => {
      const testDescription = 'should return valid user when valid ID is provided';
      const pattern = matcher.identifyTestPattern(testDescription);
      
      expect(pattern).toBe('happy-path');
    });

    it('エラーケーステストを識別できる', () => {
      const testDescription = 'should throw error when invalid input is provided';
      const pattern = matcher.identifyTestPattern(testDescription);
      
      expect(pattern).toBe('error-case');
    });

    it('エッジケーステストを識別できる', () => {
      const testDescription = 'should handle edge case when array is empty';
      const pattern = matcher.identifyTestPattern(testDescription);
      
      expect(pattern).toBe('edge-case');
    });

    it('境界値テストを識別できる', () => {
      const testDescription = 'should handle maximum boundary value correctly';
      const pattern = matcher.identifyTestPattern(testDescription);
      
      expect(pattern).toBe('boundary-value');
    });

    it('パターンが不明な場合はunknownを返す', () => {
      const testDescription = 'some random test';
      const pattern = matcher.identifyTestPattern(testDescription);
      
      expect(pattern).toBe('unknown');
    });
  });

  describe('analyzeCoverageScope', () => {
    it('複数のテストからカバレッジスコープを判定できる', () => {
      const testDescriptions = [
        'should return valid result',
        'should throw error on invalid input',
        'should handle empty array edge case',
        'should handle maximum value boundary'
      ];

      const scope = matcher.analyzeCoverageScope(testDescriptions);

      expect(scope.happyPath).toBe(true);
      expect(scope.errorCases).toBe(true);
      expect(scope.edgeCases).toBe(true);
      expect(scope.boundaryValues).toBe(true);
    });

    it('一部のカバレッジのみの場合を正しく判定できる', () => {
      const testDescriptions = [
        'should return valid result',
        'should handle normal case'
      ];

      const scope = matcher.analyzeCoverageScope(testDescriptions);

      expect(scope.happyPath).toBe(true);
      expect(scope.errorCases).toBe(false);
      expect(scope.edgeCases).toBe(false);
      expect(scope.boundaryValues).toBe(false);
    });
  });

  describe('extractPatternFromAST', () => {
    it('ASTからテストパターンを抽出できる', () => {
      // KISS原則: シンプルなモックASTを使用
      const mockAST: ASTNode = {
        type: 'call_expression',
        text: 'it("should throw error when null is passed", () => { expect(() => func(null)).toThrow(); })',
        isNamed: true,
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 100 }
      };

      const patterns = matcher.extractPatternFromAST(mockAST);

      expect(patterns).toContain('error-case');
      expect(patterns).toContain('null-check');
    });

    it('複数のパターンを検出できる', () => {
      const mockAST: ASTNode = {
        type: 'call_expression',
        text: 'it("should handle empty array edge case and return null", () => { expect(func([])).toBeNull(); })',
        isNamed: true,
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 100 }
      };

      const patterns = matcher.extractPatternFromAST(mockAST);

      expect(patterns).toContain('edge-case');
      expect(patterns).toContain('empty-array');
      expect(patterns).toContain('null-return');
    });
  });

  describe('suggestMissingPatterns', () => {
    it('不足しているテストパターンを提案できる', () => {
      const existingPatterns: TestPattern[] = ['happy-path'];
      const suggestions = matcher.suggestMissingPatterns(existingPatterns);

      expect(suggestions).toContain('error-case');
      expect(suggestions).toContain('edge-case');
      expect(suggestions).toContain('boundary-value');
    });

    it('全てのパターンが存在する場合は空配列を返す', () => {
      const existingPatterns: TestPattern[] = ['happy-path', 'error-case', 'edge-case', 'boundary-value'];
      const suggestions = matcher.suggestMissingPatterns(existingPatterns);

      expect(suggestions).toHaveLength(0);
    });
  });

  // Issue #119 対応: 曖昧な部分一致による誤検知問題のテスト
  describe('containsAnyKeyword - 偽陽性検出防止テスト (Issue #119)', () => {
    describe('語境界を考慮しない検索による偽陽性テスト', () => {
      it('abnormalがnormalキーワードで偽陽性を起こさない', () => {
        const testDescription = 'should handle abnormal behavior correctly';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'normal'キーワードにより'happy-path'と誤判定される（Red Phase）
        expect(pattern).not.toBe('happy-path');
        expect(pattern).toBe('unknown'); // abnormalは既知パターンに該当しない
      });

      it('erroringがerrorキーワードで偽陽性を起こさない', () => {
        const testDescription = 'should prevent erroring out unexpectedly';  
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'error'キーワードにより'error-case'と誤判定される（Red Phase）
        expect(pattern).not.toBe('error-case');
        expect(pattern).toBe('unknown'); // erroringは異なる意味
      });

      it('validation_functionがvalidキーワードで偽陽性を起こさない', () => {
        const testDescription = 'should test validation_function correctly';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'valid'キーワードにより'happy-path'と誤判定される（Red Phase）  
        expect(pattern).not.toBe('happy-path');
        expect(pattern).toBe('unknown'); // validation_functionは関数名であってvalidとは異なる
      });

      it('invalidationがinvalidキーワードで偽陽性を起こさない', () => {
        const testDescription = 'should handle cache invalidation properly';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'invalid'キーワードにより'error-case'と誤判定される（Red Phase）
        expect(pattern).not.toBe('error-case'); 
        expect(pattern).toBe('unknown'); // invalidationはキャッシュ無効化の意味
      });

      it('success_callbackがsuccessキーワードで偽陽性を起こさない', () => {
        const testDescription = 'should execute success_callback after completion';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'success'キーワードにより'happy-path'と誤判定される（Red Phase）
        expect(pattern).not.toBe('happy-path');
        expect(pattern).toBe('unknown'); // success_callbackは関数名
      });
    });

    describe('記法ゆれによる検索漏れテスト', () => {
      it('kebab-caseの記法でもerrorキーワードを正しく検出する', () => {
        const testDescription = 'should handle error-case scenarios properly';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'error case'と'error-case'が同一視されない（Red Phase）
        expect(pattern).toBe('error-case'); // 統一後は適切に検出されるべき
      });

      it('snake_caseの記法でもvalidキーワードを正しく検出する', () => {
        const testDescription = 'should return valid_result when conditions met';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 現在の実装では'valid result'と'valid_result'が同一視されない（Red Phase）
        expect(pattern).toBe('happy-path'); // 統一後は適切に検出されるべき
      });
    });

    describe('多言語混在処理テスト', () => {
      it('英語キーワードは語境界を考慮して検出する', () => {
        const testDescription = 'testing abnormal conditions thoroughly';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // abnormalのnormal部分で誤検知してはいけない
        expect(pattern).not.toBe('happy-path');
      });

      it('日本語キーワードは部分一致で正しく検出する', () => {
        const testDescription = 'エラーハンドリングのテストを実行する';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 日本語の「エラー」は部分一致で検出されるべき
        expect(pattern).toBe('error-case');
      });
    });

    describe('特殊文字エスケープテスト', () => {
      it('正規表現メタ文字を含むキーワードを正しく処理する', () => {
        // 仮想的なテスト：将来的に正規表現メタ文字を含むキーワードが追加された場合
        const testDescription = 'should handle *.js files correctly';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // メタ文字がエスケープされず正規表現として解釈されてはいけない
        expect(pattern).toBe('unknown'); // 現状は該当キーワードなしなのでunknown
      });

      it('括弧を含むテキストでの誤検知を防ぐ', () => {
        const testDescription = 'should test function(normal, extra) parameters';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // function(normal, extra)のnormal部分での誤検知を防ぐ
        expect(pattern).not.toBe('happy-path');
      });
    });

    describe('境界値・特殊ケーステスト', () => {
      it('空文字列での堅牢性テスト', () => {
        const testDescription = '';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        expect(pattern).toBe('unknown');
      });

      it('キーワードのみの文字列での正確な検出', () => {
        const testDescription = 'error';
        const pattern = matcher.identifyTestPattern(testDescription);
        
        // 単語境界を考慮して正確に検出されるべき
        expect(pattern).toBe('error-case');
      });

      it('超長文字列での性能テスト', () => {
        const longText = 'should handle '.repeat(1000) + 'error case properly';
        const pattern = matcher.identifyTestPattern(longText);
        
        expect(pattern).toBe('error-case');
      });
    });
  });
});