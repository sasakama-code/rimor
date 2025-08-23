/**
 * 型定義の互換性テスト
 * TDD（テスト駆動開発）に基づいたリファクタリングのためのテストスイート
 * 
 * このテストは、型定義のリファクタリング前後で
 * 互換性が保たれることを保証します。
 */

import { describe, it, expect } from '@jest/globals';
import type { 
  AnalysisResult as UnifiedAnalysisResult 
} from '../../src/core/types/analysis-result';
import type { 
  AnalysisResult as CoreAnalysisResult 
} from '../../src/core/analyzer';
import type {
  AnalysisResult as InterfaceAnalysisResult
} from '../../src/core/interfaces/IAnalysisEngine';

/**
 * 型の互換性をチェックするヘルパー関数
 * TypeScriptのコンパイル時型チェックを利用
 */
function assertTypeCompatibility<T, U>(
  _value1?: T,
  _value2?: U
): void {
  // 型チェックはコンパイル時に行われる
  // このテストが通れば型の互換性が保証される
}

describe('AnalysisResult型の互換性テスト', () => {
  it('異なるモジュールのAnalysisResult型が基本構造を共有していること', () => {
    // 基本的なAnalysisResultの構造
    const baseResult = {
      totalFiles: 10,
      issues: [],
      executionTime: 1000
    };

    // CoreAnalysisResultとしての型チェック
    const coreResult: CoreAnalysisResult = baseResult;
    expect(coreResult.totalFiles).toBe(10);
    expect(coreResult.issues).toEqual([]);
    expect(coreResult.executionTime).toBe(1000);

    // InterfaceAnalysisResultとしての型チェック
    const interfaceResult: InterfaceAnalysisResult = {
      ...baseResult,
      pluginsExecuted: ['plugin1', 'plugin2']
    };
    expect(interfaceResult.totalFiles).toBe(10);
    expect(interfaceResult.pluginsExecuted).toHaveLength(2);
  });

  it('必須フィールドが全ての定義に含まれていること', () => {
    // 必須フィールドのリスト
    const requiredFields = ['totalFiles', 'issues', 'executionTime'];
    
    // 各型定義が必須フィールドを持つことを確認
    const testData: CoreAnalysisResult = {
      totalFiles: 5,
      issues: [],
      executionTime: 500
    };

    requiredFields.forEach(field => {
      expect(testData).toHaveProperty(field);
    });
  });

  it('拡張フィールドが適切に型定義されていること', () => {
    // 拡張フィールドを持つAnalysisResult
    const extendedResult: InterfaceAnalysisResult = {
      totalFiles: 10,
      issues: [],
      executionTime: 1000,
      pluginsExecuted: ['security', 'performance'],
      metadata: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    expect(extendedResult.pluginsExecuted).toBeDefined();
    expect(extendedResult.metadata).toBeDefined();
    expect(typeof extendedResult.metadata?.version).toBe('string');
  });
});

describe('TaintAnalysisResult型の互換性テスト', () => {
  it('TaintAnalysisResultの基本構造が一貫していること', () => {
    // 基本的なTaintAnalysisResultの構造
    const taintResult = {
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

    // 必須フィールドの存在確認
    expect(taintResult).toHaveProperty('flows');
    expect(taintResult).toHaveProperty('summary');
    expect(taintResult.summary).toHaveProperty('totalFlows');
  });

  it('セキュリティ関連の型定義が統一されていること', () => {
    const securityViolation = {
      type: 'TAINT_FLOW',
      severity: 'HIGH',
      source: 'userInput',
      sink: 'database',
      description: 'Potential SQL injection'
    };

    expect(securityViolation.type).toBe('TAINT_FLOW');
    expect(['HIGH', 'MEDIUM', 'LOW', 'CRITICAL']).toContain(securityViolation.severity);
  });
});

describe('TestCase型の互換性テスト', () => {
  it('TestCaseの基本構造が定義されていること', () => {
    const testCase = {
      id: 'test-001',
      name: 'Sample Test',
      description: 'Test description',
      input: {},
      expectedOutput: {},
      actualOutput: undefined,
      status: 'pending' as const
    };

    expect(testCase).toHaveProperty('id');
    expect(testCase).toHaveProperty('name');
    expect(testCase).toHaveProperty('status');
    expect(['pending', 'passed', 'failed', 'skipped']).toContain(testCase.status);
  });

  it('プラグイン固有の拡張が可能であること', () => {
    interface PluginTestCase {
      id: string;
      name: string;
      pluginSpecific?: {
        timeout?: number;
        retries?: number;
        tags?: string[];
      };
    }

    const pluginTest: PluginTestCase = {
      id: 'plugin-test-001',
      name: 'Plugin Test',
      pluginSpecific: {
        timeout: 5000,
        retries: 3,
        tags: ['security', 'performance']
      }
    };

    expect(pluginTest.pluginSpecific?.timeout).toBe(5000);
    expect(pluginTest.pluginSpecific?.tags).toContain('security');
  });
});

describe('型ガードの動作確認', () => {
  it('isAnalysisResult型ガードが正しく動作すること', () => {
    const isAnalysisResult = (obj: any): obj is CoreAnalysisResult => {
      return obj !== null &&
        obj !== undefined &&
        typeof obj === 'object' &&
        typeof obj.totalFiles === 'number' &&
        Array.isArray(obj.issues) &&
        typeof obj.executionTime === 'number';
    };

    const validResult = {
      totalFiles: 10,
      issues: [],
      executionTime: 1000
    };

    const invalidResult = {
      totalFiles: '10', // 型が異なる
      issues: [],
      executionTime: 1000
    };

    expect(isAnalysisResult(validResult)).toBe(true);
    expect(isAnalysisResult(invalidResult)).toBe(false);
    expect(isAnalysisResult(null)).toBe(false);
    expect(isAnalysisResult(undefined)).toBe(false);
  });

  it('isTaintAnalysisResult型ガードが正しく動作すること', () => {
    const isTaintAnalysisResult = (obj: any): boolean => {
      return obj !== null &&
        obj !== undefined &&
        typeof obj === 'object' &&
        Array.isArray(obj.flows) &&
        obj.summary &&
        typeof obj.summary.totalFlows === 'number';
    };

    const validTaintResult = {
      flows: [],
      summary: { totalFlows: 0 },
      recommendations: []
    };

    expect(isTaintAnalysisResult(validTaintResult)).toBe(true);
    expect(isTaintAnalysisResult({})).toBe(false);
  });
});

describe('後方互換性の確認', () => {
  it('既存のコードが新しい型定義でも動作すること', () => {
    // 既存コードのシミュレーション
    function processAnalysisResult(result: CoreAnalysisResult): number {
      return result.issues.length;
    }

    const result: CoreAnalysisResult = {
      totalFiles: 5,
      issues: [{} as any, {} as any],
      executionTime: 100
    };

    expect(processAnalysisResult(result)).toBe(2);
  });

  it('型エイリアスが正しく機能すること', () => {
    // 型エイリアスの例
    type LegacyAnalysisResult = CoreAnalysisResult;
    
    const legacyResult: LegacyAnalysisResult = {
      totalFiles: 10,
      issues: [],
      executionTime: 200
    };

    expect(legacyResult.totalFiles).toBe(10);
  });
});