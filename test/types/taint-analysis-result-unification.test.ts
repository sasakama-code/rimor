/**
 * TaintAnalysisResult型の統一テスト（TDD）
 * Red -> Green -> Refactor サイクルに従って実装
 */

import { describe, it, expect } from '@jest/globals';

/**
 * 統一されたTaintAnalysisResult型の仕様
 * セキュリティ分析に特化した型定義
 */
describe('統一TaintAnalysisResult型の仕様', () => {
  describe('基本構造', () => {
    it('必須フィールドを持つこと', () => {
      // 統一型の仕様定義（Red phase）
      type TaintFlow = {
        id: string;
        source: string;
        sink: string;
        path: string[];
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      };

      type TaintSummary = {
        totalFlows: number;
        criticalFlows: number;
        highRiskFlows: number;
        mediumRiskFlows: number;
        lowRiskFlows: number;
      };

      type TaintAnalysisResult = {
        flows: TaintFlow[];
        summary: TaintSummary;
        recommendations: string[];
      };

      const result: TaintAnalysisResult = {
        flows: [],
        summary: {
          totalFlows: 0,
          criticalFlows: 0,
          highRiskFlows: 0,
          mediumRiskFlows: 0,
          lowRiskFlows: 0
        },
        recommendations: []
      };

      expect(result.flows).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFlows).toBe(0);
      expect(result.recommendations).toBeDefined();
    });

    it('セキュリティ違反情報をサポートすること', () => {
      type SecurityViolation = {
        type: 'TAINT_FLOW' | 'ACCESS_CONTROL' | 'INJECTION' | 'XSS' | 'CSRF';
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        source: string;
        sink: string;
        description: string;
        location?: {
          file: string;
          line: number;
          column?: number;
        };
      };

      type TaintAnalysisResultWithViolations = {
        flows: any[];
        summary: any;
        violations: SecurityViolation[];
        recommendations: string[];
      };

      const result: TaintAnalysisResultWithViolations = {
        flows: [],
        summary: { totalFlows: 0 },
        violations: [{
          type: 'TAINT_FLOW',
          severity: 'HIGH',
          source: 'userInput',
          sink: 'database',
          description: 'Potential SQL injection',
          location: {
            file: 'src/api/users.ts',
            line: 42
          }
        }],
        recommendations: ['Sanitize user input', 'Use parameterized queries']
      };

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('TAINT_FLOW');
      expect(result.violations[0].severity).toBe('HIGH');
    });
  });

  describe('拡張パターン', () => {
    it('アノテーション情報を含む拡張ができること', () => {
      interface BaseTaintAnalysisResult {
        flows: any[];
        summary: any;
        recommendations: string[];
      }

      interface TaintAnalysisWithAnnotations extends BaseTaintAnalysisResult {
        annotations?: {
          taintedProperties: string[];
          untaintedProperties: string[];
          polyTaintMethods: string[];
          suppressedMethods: string[];
        };
      }

      const result: TaintAnalysisWithAnnotations = {
        flows: [],
        summary: { totalFlows: 0 },
        recommendations: [],
        annotations: {
          taintedProperties: ['userInput', 'queryParam'],
          untaintedProperties: ['sanitizedData'],
          polyTaintMethods: ['processData'],
          suppressedMethods: ['internalMethod']
        }
      };

      expect(result.annotations?.taintedProperties).toContain('userInput');
      expect(result.annotations?.untaintedProperties).toContain('sanitizedData');
    });

    it('メトリクス情報を含む拡張ができること', () => {
      interface TaintAnalysisWithMetrics {
        flows: any[];
        summary: any;
        recommendations: string[];
        metrics?: {
          analysisTime: number;
          filesAnalyzed: number;
          methodsAnalyzed: number;
          coverage: number;
          falsePositiveRate?: number;
        };
      }

      const result: TaintAnalysisWithMetrics = {
        flows: [],
        summary: { totalFlows: 0 },
        recommendations: [],
        metrics: {
          analysisTime: 1500,
          filesAnalyzed: 10,
          methodsAnalyzed: 50,
          coverage: 85.5,
          falsePositiveRate: 5.2
        }
      };

      expect(result.metrics?.coverage).toBe(85.5);
      expect(result.metrics?.falsePositiveRate).toBe(5.2);
    });

    it('改善提案情報を含む拡張ができること', () => {
      interface SecurityImprovement {
        category: 'INPUT_VALIDATION' | 'OUTPUT_ENCODING' | 'ACCESS_CONTROL' | 'CRYPTO';
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        description: string;
        estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
        impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      }

      interface TaintAnalysisWithImprovements {
        flows: any[];
        summary: any;
        recommendations: string[];
        improvements?: SecurityImprovement[];
      }

      const result: TaintAnalysisWithImprovements = {
        flows: [],
        summary: { totalFlows: 0 },
        recommendations: [],
        improvements: [{
          category: 'INPUT_VALIDATION',
          priority: 'HIGH',
          description: 'Add input validation for user parameters',
          estimatedEffort: 'LOW',
          impact: 'HIGH'
        }]
      };

      expect(result.improvements?.[0].category).toBe('INPUT_VALIDATION');
      expect(result.improvements?.[0].impact).toBe('HIGH');
    });
  });

  describe('型ガード', () => {
    it('isTaintAnalysisResult型ガードが正しく動作すること', () => {
      const isTaintAnalysisResult = (obj: any): boolean => {
        return obj !== null &&
          obj !== undefined &&
          typeof obj === 'object' &&
          Array.isArray(obj.flows) &&
          obj.summary &&
          typeof obj.summary === 'object' &&
          typeof obj.summary.totalFlows === 'number' &&
          Array.isArray(obj.recommendations);
      };

      expect(isTaintAnalysisResult({
        flows: [],
        summary: { totalFlows: 0 },
        recommendations: []
      })).toBe(true);

      expect(isTaintAnalysisResult({
        flows: [],
        summary: { totalFlows: 0 }
        // recommendationsが欠けている
      })).toBe(false);

      expect(isTaintAnalysisResult({
        flows: 'not-array', // 型が違う
        summary: { totalFlows: 0 },
        recommendations: []
      })).toBe(false);

      expect(isTaintAnalysisResult(null)).toBe(false);
    });

    it('hasSecurityViolations型ガードが正しく動作すること', () => {
      const hasSecurityViolations = (obj: any): boolean => {
        return obj &&
          obj.violations &&
          Array.isArray(obj.violations) &&
          obj.violations.every((v: any) => 
            v.type && v.severity && v.source && v.sink && v.description
          );
      };

      expect(hasSecurityViolations({
        violations: [{
          type: 'TAINT_FLOW',
          severity: 'HIGH',
          source: 'input',
          sink: 'output',
          description: 'test'
        }]
      })).toBe(true);

      expect(hasSecurityViolations({
        violations: []
      })).toBe(true); // 空配列もOK

      expect(hasSecurityViolations({
        violations: [{ type: 'INVALID' }] // 必須フィールドが欠けている
      })).toBe(false);
    });
  });

  describe('統合パターン', () => {
    it('異なるセキュリティモジュールの結果を統合できること', () => {
      // アノテーションベースの結果
      const annotationResult = {
        flows: [],
        summary: { totalFlows: 0 },
        recommendations: [],
        taintedProperties: ['input1'],
        untaintedProperties: ['safe1']
      };

      // フロー分析ベースの結果
      const flowResult = {
        flows: [{
          id: 'flow1',
          source: 'userInput',
          sink: 'database',
          path: ['method1', 'method2'],
          severity: 'HIGH' as const
        }],
        summary: { totalFlows: 1 },
        recommendations: ['Use prepared statements']
      };

      // 統合関数のシミュレーション
      function mergeTaintResults(results: any[]): any {
        const mergedFlows = results.flatMap(r => r.flows || []);
        const mergedRecommendations = [...new Set(results.flatMap(r => r.recommendations || []))];
        
        return {
          flows: mergedFlows,
          summary: {
            totalFlows: mergedFlows.length
          },
          recommendations: mergedRecommendations
        };
      }

      const merged = mergeTaintResults([annotationResult, flowResult]);
      expect(merged.flows).toHaveLength(1);
      expect(merged.recommendations).toContain('Use prepared statements');
    });
  });

  describe('後方互換性', () => {
    it('既存の異なる構造の型を新しい統一型に変換できること', () => {
      // 旧形式1: シンプルな構造
      interface OldFormat1 {
        flows: any[];
        summary: any;
      }

      // 旧形式2: 詳細な構造
      interface OldFormat2 {
        methods: Array<{
          methodName: string;
          result: any;
        }>;
        overallMetrics: any;
        violations: any[];
        improvements: any[];
      }

      // 統一型への変換関数
      function toUnifiedTaintResult(old: any): any {
        if ('methods' in old) {
          // OldFormat2からの変換
          return {
            flows: [],
            summary: old.overallMetrics || { totalFlows: 0 },
            violations: old.violations || [],
            improvements: old.improvements || [],
            recommendations: []
          };
        } else {
          // OldFormat1からの変換
          return {
            flows: old.flows || [],
            summary: old.summary || { totalFlows: 0 },
            recommendations: []
          };
        }
      }

      const old1: OldFormat1 = {
        flows: [{ id: 'test' }],
        summary: { totalFlows: 1 }
      };

      const unified = toUnifiedTaintResult(old1);
      expect(unified.flows).toHaveLength(1);
      expect(unified.recommendations).toBeDefined();
    });

    it('型エイリアスで移行をサポートすること', () => {
      // 統一型
      interface UnifiedTaintAnalysisResult {
        flows: any[];
        summary: any;
        recommendations: string[];
      }

      // 各モジュールの型エイリアス
      type SecurityTaintResult = UnifiedTaintAnalysisResult;
      type AnnotationTaintResult = UnifiedTaintAnalysisResult;
      type FlowTaintResult = UnifiedTaintAnalysisResult;

      const result: SecurityTaintResult = {
        flows: [],
        summary: { totalFlows: 0 },
        recommendations: []
      };

      // 同じ型として扱える
      const annotationResult: AnnotationTaintResult = result;
      const flowResult: FlowTaintResult = result;

      expect(annotationResult.summary.totalFlows).toBe(0);
      expect(flowResult.recommendations).toHaveLength(0);
    });
  });
});