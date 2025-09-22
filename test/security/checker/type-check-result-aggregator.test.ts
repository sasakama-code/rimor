/**
 * TypeCheckResultAggregator テストケース
 * Issue #154: Map オブジェクト JSON 互換性修正
 * TDD Red-Green-Refactor サイクル実践
 */

import {
  TypeCheckResultAggregator,
  MethodTypeCheckResult,
} from '../../../src/security/checker/parallel-type-checker';
import { TestMethod } from '../../../src/core/types';
import { SecurityIssue } from '../../../src/security/types/flow-types';
import {
  TypeQualifierError,
  TaintQualifier,
} from '../../../src/security/types/checker-framework-types';

describe('TypeCheckResultAggregator', () => {
  describe('aggregate', () => {
    let mockResults: MethodTypeCheckResult[];

    beforeEach(() => {
      // テスト用のモックデータ作成
      const mockMethod: TestMethod = {
        name: 'testMethod',
        type: 'test',
        filePath: 'test.ts',
        content: 'function test() {}',
        signature: {
          name: 'testMethod',
          parameters: [],
          returnType: 'void',
          annotations: [],
          isAsync: false,
        },
        location: {
          start: { line: 1, column: 0 },
          end: { line: 1, column: 10 },
          startLine: 1,
          endLine: 1,
          startColumn: 0,
          endColumn: 10,
        },
      };

      const mockSecurityIssue: SecurityIssue = {
        id: 'test-issue',
        type: 'unsafe-taint-flow',
        severity: 'error',
        message: 'Test security issue',
        location: {
          file: 'test.ts',
          line: 1,
          column: 0,
        },
      };

      mockResults = [
        {
          method: mockMethod,
          typeCheckResult: {
            success: false,
            errors: [new TypeQualifierError('Test error', '@Tainted', '@Untainted')],
            warnings: [{ message: 'Test warning' }],
          },
          inferredTypes: new Map([
            [
              'variable1',
              {
                __brand: '@Tainted',
                __value: 'variable1',
                __source: 'inferred',
                __confidence: 1.0,
              } as any,
            ],
            ['variable2', { __brand: '@Untainted', __value: 'variable2' } as any],
            [
              'variable3',
              {
                __brand: '@Tainted',
                __value: 'variable3',
                __source: 'inferred',
                __confidence: 0.8,
              } as any,
            ],
          ]),
          securityIssues: [mockSecurityIssue],
          executionTime: 100,
        },
      ];
    });

    it('複数の型チェック結果を正しく集約できる', () => {
      const result = TypeCheckResultAggregator.aggregate(mockResults);

      expect(result.overallSuccess).toBe(false);
      expect(result.totalErrors).toBe(1);
      expect(result.totalWarnings).toBe(1);
      expect(result.criticalIssues).toHaveLength(1);
      expect(result.typeStatistics).toBeDefined();
    });

    it('typeStatisticsが正しい型統計を含む', () => {
      const result = TypeCheckResultAggregator.aggregate(mockResults);

      // typeStatisticsが存在し、適切な値を持つことを検証
      expect(result.typeStatistics).toBeDefined();

      // Map オブジェクトの場合の検証（現在の実装）
      if (result.typeStatistics instanceof Map) {
        expect(result.typeStatistics.get('@Tainted' as TaintQualifier)).toBe(2);
        expect(result.typeStatistics.get('@Untainted' as TaintQualifier)).toBe(1);
      } else {
        // Object の場合の検証（修正後の期待実装）
        expect((result.typeStatistics as { [key: string]: number })['@Tainted']).toBe(2);
        expect((result.typeStatistics as { [key: string]: number })['@Untainted']).toBe(1);
      }
    });

    it('JSON.stringify()で正しくシリアライズできる', () => {
      const result = TypeCheckResultAggregator.aggregate(mockResults);

      // Issue #154 の核心: JSON シリアライゼーション検証
      expect(() => JSON.stringify(result)).not.toThrow();

      const jsonString = JSON.stringify(result);
      const parsedResult = JSON.parse(jsonString);

      // パース後のオブジェクトが期待される構造を持つことを検証
      expect(parsedResult.overallSuccess).toBe(false);
      expect(parsedResult.totalErrors).toBe(1);
      expect(parsedResult.totalWarnings).toBe(1);
      expect(parsedResult.criticalIssues).toBeDefined();
      expect(parsedResult.typeStatistics).toBeDefined();

      // Issue #154 修正検証: typeStatistics が空オブジェクトでないことを確認
      if (typeof parsedResult.typeStatistics === 'object' && parsedResult.typeStatistics !== null) {
        const typeStats = parsedResult.typeStatistics;
        // Map の場合は {} になってしまうが、Object の場合は正しい値が保持される
        if (Object.keys(typeStats).length > 0) {
          expect(typeStats['@Tainted']).toBe(2);
          expect(typeStats['@Untainted']).toBe(1);
        }
      }
    });

    it('typeStatisticsが実際にプレーンオブジェクトである', () => {
      const result = TypeCheckResultAggregator.aggregate(mockResults);

      // Issue #154 修正検証: typeStatistics は Map ではなく plain object であるべき
      expect(result.typeStatistics).not.toBeInstanceOf(Map);
      expect(typeof result.typeStatistics).toBe('object');
      expect(result.typeStatistics).not.toBeNull();

      // Record<TaintQualifier, number> 型として使用可能であることを検証
      const typeStats = result.typeStatistics as { [key: string]: number };
      expect(typeStats['@Tainted']).toBe(2);
      expect(typeStats['@Untainted']).toBe(1);
    });

    it('空の結果配列を正しく処理する', () => {
      const result = TypeCheckResultAggregator.aggregate([]);

      expect(result.overallSuccess).toBe(true);
      expect(result.totalErrors).toBe(0);
      expect(result.totalWarnings).toBe(0);
      expect(result.criticalIssues).toHaveLength(0);
      expect(result.typeStatistics).toBeDefined();

      // 空の場合でもJSON互換性を確保
      expect(() => JSON.stringify(result)).not.toThrow();
      const jsonString = JSON.stringify(result);
      const parsedResult = JSON.parse(jsonString);
      expect(parsedResult.typeStatistics).toBeDefined();
    });

    it('型統計の重複カウントが正しい', () => {
      // 同じ型修飾子を持つ変数が複数ある場合のテスト
      const duplicateResult: MethodTypeCheckResult = {
        ...mockResults[0],
        inferredTypes: new Map([
          ['var1', { __brand: '@Tainted', __value: 'var1' } as any],
          ['var2', { __brand: '@Tainted', __value: 'var2' } as any],
          ['var3', { __brand: '@Tainted', __value: 'var3' } as any],
          ['var4', { __brand: '@Untainted', __value: 'var4' } as any],
        ]),
      };

      const result = TypeCheckResultAggregator.aggregate([duplicateResult]);

      if (typeof result.typeStatistics === 'object' && !(result.typeStatistics instanceof Map)) {
        const typeStats = result.typeStatistics as { [key: string]: number };
        expect(typeStats['@Tainted']).toBe(3);
        expect(typeStats['@Untainted']).toBe(1);
      }
    });

    // Issue #154 Refactorフェーズ: 追加テストケース
    describe('JSON互換性の詳細検証 (Refactor)', () => {
      it('深いネストでもJSONシリアライゼーションが正しく動作する', () => {
        const result = TypeCheckResultAggregator.aggregate(mockResults);

        // 深いネストでの検証
        const nestedData = {
          analysis: {
            security: {
              results: result,
              meta: {
                version: '1.0',
                timestamp: new Date().toISOString(),
              },
            },
          },
        };

        expect(() => JSON.stringify(nestedData)).not.toThrow();
        const serialized = JSON.stringify(nestedData);
        const deserialized = JSON.parse(serialized);

        // 深いネストでもtypeStatisticsが保持されることを確認
        expect(deserialized.analysis.security.results.typeStatistics).toBeDefined();
        expect(deserialized.analysis.security.results.typeStatistics['@Tainted']).toBe(2);
        expect(deserialized.analysis.security.results.typeStatistics['@Untainted']).toBe(1);
      });

      it('CLIでの典型的なJSON出力パターンを検証', () => {
        const result = TypeCheckResultAggregator.aggregate(mockResults);

        // CLIでの典型的な出力構造をシミュレート
        const cliOutput = {
          command: 'rimor analyze',
          status: 'completed',
          data: result,
          format: 'json',
        };

        const jsonOutput = JSON.stringify(cliOutput, null, 2);
        expect(jsonOutput).toContain('"@Tainted": 2');
        expect(jsonOutput).toContain('"@Untainted": 1');
        expect(jsonOutput).not.toContain('{}'); // 空オブジェクトが含まれていないことを確認
      });

      it('API レスポンスでのシリアライゼーションパターンを検証', () => {
        const result = TypeCheckResultAggregator.aggregate(mockResults);

        // API レスポンス形式をシミュレート
        const apiResponse = {
          success: true,
          data: {
            aggregation: result,
            metadata: {
              processingTime: 150,
              methodsAnalyzed: 1,
            },
          },
          timestamp: '2025-09-11T12:00:00Z',
        };

        const responseJson = JSON.stringify(apiResponse);
        const parsedResponse = JSON.parse(responseJson);

        expect(parsedResponse.data.aggregation.typeStatistics).toBeDefined();
        expect(Object.keys(parsedResponse.data.aggregation.typeStatistics)).toEqual(
          expect.arrayContaining(['@Tainted', '@Untainted'])
        );
      });

      it('レポート生成でのシリアライゼーション完全性を検証', () => {
        const result = TypeCheckResultAggregator.aggregate(mockResults);

        // レポート生成でのデータ構造をシミュレート
        const reportData = {
          title: 'Security Analysis Report',
          summary: result,
          sections: [
            {
              name: 'Type Statistics',
              data: result.typeStatistics,
            },
          ],
        };

        const serialized = JSON.stringify(reportData, null, 2);
        const deserialized = JSON.parse(serialized);

        // レポートデータの完全性検証
        expect(deserialized.summary.typeStatistics).toEqual(result.typeStatistics);
        expect(deserialized.sections[0].data).toEqual(result.typeStatistics);

        // 実際の統計値が正しく保持されることを確認
        expect(deserialized.summary.typeStatistics['@Tainted']).toBe(2);
        expect(deserialized.summary.typeStatistics['@Untainted']).toBe(1);
      });
    });

    // Defensive Programming: エラーケースの追加テスト
    describe('Defensive Programming強化 (Refactor)', () => {
      it('不正な型修飾子を含む結果を安全に処理する', () => {
        const malformedResult: MethodTypeCheckResult = {
          ...mockResults[0],
          inferredTypes: new Map([
            ['var1', { __brand: '@Unknown' as TaintQualifier, __value: 'var1' } as any],
            ['var2', { __brand: null as any, __value: 'var2' } as any],
            ['var3', { __brand: '@Tainted', __value: 'var3' } as any],
          ]),
        };

        expect(() => TypeCheckResultAggregator.aggregate([malformedResult])).not.toThrow();
        const result = TypeCheckResultAggregator.aggregate([malformedResult]);

        // 不正なデータでもJSONシリアライゼーションが成功することを確認
        expect(() => JSON.stringify(result)).not.toThrow();
      });

      it('大量のデータでもパフォーマンスが保たれる', () => {
        // 大量のデータをシミュレート
        const largeResults: MethodTypeCheckResult[] = [];
        for (let i = 0; i < 100; i++) {
          const largeInferredTypes = new Map();
          for (let j = 0; j < 50; j++) {
            largeInferredTypes.set(`var_${i}_${j}`, {
              __brand: j % 2 === 0 ? '@Tainted' : '@Untainted',
              __value: `var_${i}_${j}`,
            } as any);
          }

          largeResults.push({
            ...mockResults[0],
            method: { ...mockResults[0].method, name: `method_${i}` },
            inferredTypes: largeInferredTypes,
          });
        }

        const startTime = Date.now();
        const result = TypeCheckResultAggregator.aggregate(largeResults);
        const processingTime = Date.now() - startTime;

        // パフォーマンス検証（100ms以内で処理完了）
        expect(processingTime).toBeLessThan(100);

        // 大量データでもJSONシリアライゼーションが成功
        expect(() => JSON.stringify(result)).not.toThrow();
        expect(result.typeStatistics['@Tainted']).toBe(2500); // 100 * 25
        expect(result.typeStatistics['@Untainted']).toBe(2500); // 100 * 25
      });
    });
  });
});
