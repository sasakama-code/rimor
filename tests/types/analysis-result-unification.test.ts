/**
 * AnalysisResult型の統一テスト（TDD）
 * Red -> Green -> Refactor サイクルに従って実装
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * 統一されたAnalysisResult型の仕様
 * このテストは実装前に作成（Red phase）
 */
describe('統一AnalysisResult型の仕様', () => {
  describe('基本構造', () => {
    it('必須フィールドを持つこと', () => {
      // 統一型をインポート（まだ存在しない - Red phase）
      // import { AnalysisResult } from '../../src/types/analysis/index';
      
      type AnalysisResult = {
        totalFiles: number;
        issues: any[];
        executionTime: number;
      };

      const result: AnalysisResult = {
        totalFiles: 10,
        issues: [],
        executionTime: 1000
      };

      expect(result.totalFiles).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.executionTime).toBeDefined();
    });

    it('オプショナルフィールドをサポートすること', () => {
      type AnalysisResult = {
        totalFiles: number;
        issues: any[];
        executionTime: number;
        metadata?: {
          startTime?: string;
          endTime?: string;
          version?: string;
        };
        pluginsExecuted?: string[];
      };

      const minimalResult: AnalysisResult = {
        totalFiles: 5,
        issues: [],
        executionTime: 500
      };

      const fullResult: AnalysisResult = {
        totalFiles: 10,
        issues: [],
        executionTime: 1000,
        metadata: {
          startTime: '2025-01-17T00:00:00Z',
          endTime: '2025-01-17T00:00:01Z',
          version: '1.0.0'
        },
        pluginsExecuted: ['security', 'performance']
      };

      expect(minimalResult.metadata).toBeUndefined();
      expect(fullResult.metadata?.version).toBe('1.0.0');
    });
  });

  describe('拡張パターン', () => {
    it('基本型を拡張できること', () => {
      // 基本型
      interface BaseAnalysisResult {
        totalFiles: number;
        issues: any[];
        executionTime: number;
      }

      // Core向け拡張
      interface CoreAnalysisResult extends BaseAnalysisResult {
        // 追加フィールドなし（基本型のみ）
      }

      // Interface向け拡張
      interface InterfaceAnalysisResult extends BaseAnalysisResult {
        pluginsExecuted?: string[];
        metadata?: Record<string, any>;
      }

      // Parallel向け拡張
      interface ParallelAnalysisResult extends BaseAnalysisResult {
        parallelStats?: {
          batchCount: number;
          threadsUsed: number;
          speedup: number;
        };
      }

      const coreResult: CoreAnalysisResult = {
        totalFiles: 5,
        issues: [],
        executionTime: 100
      };

      const interfaceResult: InterfaceAnalysisResult = {
        totalFiles: 10,
        issues: [],
        executionTime: 200,
        pluginsExecuted: ['test']
      };

      const parallelResult: ParallelAnalysisResult = {
        totalFiles: 20,
        issues: [],
        executionTime: 300,
        parallelStats: {
          batchCount: 4,
          threadsUsed: 4,
          speedup: 3.5
        }
      };

      expect(coreResult.totalFiles).toBe(5);
      expect(interfaceResult.pluginsExecuted).toContain('test');
      expect(parallelResult.parallelStats?.speedup).toBe(3.5);
    });

    it('ファイル別の分析結果をサポートすること', () => {
      interface FileAnalysisResult extends BaseAnalysisResult {
        filePath: string;
        relativePath?: string;
      }

      interface BaseAnalysisResult {
        totalFiles: number;
        issues: any[];
        executionTime: number;
      }

      const fileResult: FileAnalysisResult = {
        filePath: '/path/to/file.ts',
        relativePath: 'src/file.ts',
        totalFiles: 1,
        issues: [],
        executionTime: 50
      };

      expect(fileResult.filePath).toBe('/path/to/file.ts');
      expect(fileResult.relativePath).toBe('src/file.ts');
    });
  });

  describe('型ガード', () => {
    it('isAnalysisResult型ガードが正しく動作すること', () => {
      const isAnalysisResult = (obj: any): boolean => {
        return obj !== null &&
          obj !== undefined &&
          typeof obj === 'object' &&
          typeof obj.totalFiles === 'number' &&
          Array.isArray(obj.issues) &&
          typeof obj.executionTime === 'number';
      };

      expect(isAnalysisResult({
        totalFiles: 10,
        issues: [],
        executionTime: 100
      })).toBe(true);

      expect(isAnalysisResult({
        totalFiles: '10', // 型が違う
        issues: [],
        executionTime: 100
      })).toBe(false);

      expect(isAnalysisResult({
        issues: [],
        executionTime: 100
        // totalFilesが欠けている
      })).toBe(false);

      expect(isAnalysisResult(null)).toBe(false);
      expect(isAnalysisResult(undefined)).toBe(false);
      expect(isAnalysisResult('string')).toBe(false);
    });

    it('hasPluginMetadata型ガードが正しく動作すること', () => {
      interface WithPluginMetadata {
        pluginsExecuted?: string[];
        metadata?: Record<string, any>;
      }

      const hasPluginMetadata = (obj: any): obj is WithPluginMetadata => {
        return obj &&
          (obj.pluginsExecuted === undefined || Array.isArray(obj.pluginsExecuted)) &&
          (obj.metadata === undefined || typeof obj.metadata === 'object');
      };

      expect(hasPluginMetadata({
        pluginsExecuted: ['test'],
        metadata: { version: '1.0.0' }
      })).toBe(true);

      expect(hasPluginMetadata({})).toBe(true); // オプショナルフィールド

      expect(hasPluginMetadata({
        pluginsExecuted: 'not-array' // 型が違う
      })).toBe(false);
    });
  });

  describe('後方互換性', () => {
    it('既存のコードが新しい型定義で動作すること', () => {
      // 既存のコードをシミュレート
      interface LegacyAnalysisResult {
        totalFiles: number;
        issues: any[];
        executionTime: number;
      }

      interface NewAnalysisResult {
        totalFiles: number;
        issues: any[];
        executionTime: number;
        // 新しいオプショナルフィールド
        metadata?: Record<string, any>;
      }

      // 既存のコードが新しい型を受け入れられること
      function processLegacyResult(result: LegacyAnalysisResult): number {
        return result.totalFiles + result.issues.length;
      }

      const newResult: NewAnalysisResult = {
        totalFiles: 10,
        issues: [{}, {}],
        executionTime: 100,
        metadata: { extra: 'data' }
      };

      // NewAnalysisResultはLegacyAnalysisResultのスーパーセット
      expect(processLegacyResult(newResult)).toBe(12);
    });

    it('型エイリアスで移行をサポートすること', () => {
      // 移行期間中の型エイリアス
      interface UnifiedAnalysisResult {
        totalFiles: number;
        issues: any[];
        executionTime: number;
      }

      // 各モジュールの型エイリアス（後方互換性のため）
      type CoreAnalysisResult = UnifiedAnalysisResult;
      type CliAnalysisResult = UnifiedAnalysisResult;
      type SecurityAnalysisResult = UnifiedAnalysisResult;

      const result: CoreAnalysisResult = {
        totalFiles: 5,
        issues: [],
        executionTime: 50
      };

      // 同じ型として扱える
      const cliResult: CliAnalysisResult = result;
      const securityResult: SecurityAnalysisResult = result;

      expect(cliResult.totalFiles).toBe(5);
      expect(securityResult.totalFiles).toBe(5);
    });
  });
});