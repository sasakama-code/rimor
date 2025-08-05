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
});