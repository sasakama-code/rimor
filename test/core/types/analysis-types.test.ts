/**
 * 分析型の型ガードテスト
 * TDDアプローチでのRED フェーズ
 */

import {
  ProjectAnalysisResult,
  TaintAnalysisResult,
  TaintFlow,
  SecurityAnalysisResult,
  DependencyAnalysisResult
} from '../../../src/core/types/analysis-types';

// 実装された型ガード関数をインポート
import {
  isProjectAnalysisResult,
  isTaintAnalysisResult,
  isTaintFlow,
  isSecurityAnalysisResult,
  isDependencyAnalysisResult
} from '../../../src/core/types/analysis-type-guards';

describe('Analysis Types - Type Guards', () => {
  describe('isProjectAnalysisResult', () => {
    it('有効なProjectAnalysisResultを検証できる', () => {
      const validResult = {
        projectPath: '/path/to/project',
        timestamp: new Date(),
        duration: 1000,
        success: true,
        files: [],
        summary: {
          totalFiles: 10,
          analyzedFiles: 8,
          skippedFiles: 2,
          totalIssues: 5,
          issuesBySeverity: {
            critical: 1,
            high: 2,
            medium: 2,
            low: 0,
            info: 0
          },
          totalPatterns: 15,
          totalImprovements: 3
        },
        issues: [],
        improvements: [],
        qualityScore: {
          overall: 0.75,
          confidence: 0.9,
          dimensions: {
            completeness: 0.8,
            correctness: 0.7,
            maintainability: 0.75
          }
        }
      };

      expect(isProjectAnalysisResult(validResult)).toBe(true);
    });

    it('無効なデータを拒否する', () => {
      expect(isProjectAnalysisResult(null)).toBe(false);
      expect(isProjectAnalysisResult(undefined)).toBe(false);
      expect(isProjectAnalysisResult('string')).toBe(false);
      expect(isProjectAnalysisResult(123)).toBe(false);
      expect(isProjectAnalysisResult([])).toBe(false);
    });

    it('必須フィールドが欠けている場合は拒否する', () => {
      const incomplete = {
        projectPath: '/path/to/project',
        // timestamp missing
        duration: 1000,
        success: true
      };
      expect(isProjectAnalysisResult(incomplete)).toBe(false);
    });
  });

  describe('isTaintAnalysisResult', () => {
    it('有効なTaintAnalysisResultを検証できる', () => {
      const validResult = {
        flows: [
          {
            id: 'flow-1',
            source: 'user-input',
            sink: 'database',
            path: ['input', 'processor', 'database'],
            taintLevel: 'high' as const,
            confidence: 0.85,
            location: {
              file: 'test.ts',
              line: 42
            }
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 0,
          highFlows: 1,
          mediumFlows: 0,
          lowFlows: 0,
          sourcesCount: 1,
          sinksCount: 1,
          sanitizersCount: 0
        },
        recommendations: ['入力検証を追加してください']
      };

      expect(isTaintAnalysisResult(validResult)).toBe(true);
    });

    it('無効なtaintLevelを拒否する', () => {
      const invalidResult = {
        flows: [
          {
            id: 'flow-1',
            source: 'user-input',
            sink: 'database',
            path: [],
            taintLevel: 'invalid-level', // 無効な値
            confidence: 0.85
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 0,
          highFlows: 0,
          mediumFlows: 0,
          lowFlows: 0,
          sourcesCount: 1,
          sinksCount: 1,
          sanitizersCount: 0
        },
        recommendations: []
      };

      expect(isTaintAnalysisResult(invalidResult)).toBe(false);
    });
  });

  describe('isSecurityAnalysisResult', () => {
    it('有効なSecurityAnalysisResultを検証できる', () => {
      const validResult = {
        projectPath: '/path/to/project',
        timestamp: new Date(),
        duration: 2000,
        success: true,
        vulnerabilities: [
          {
            id: 'vuln-1',
            type: 'SQL Injection',
            severity: 'critical' as const,
            description: 'SQLインジェクションの可能性',
            location: {
              file: 'db.ts',
              line: 100
            },
            cwe: 'CWE-89',
            owasp: 'A03:2021'
          }
        ],
        securityScore: 65,
        compliance: {
          standard: 'OWASP Top 10',
          passed: false,
          score: 65,
          violations: []
        }
      };

      expect(isSecurityAnalysisResult(validResult)).toBe(true);
    });
  });

  describe('isDependencyAnalysisResult', () => {
    it('有効なDependencyAnalysisResultを検証できる', () => {
      const validResult = {
        dependencies: [
          {
            name: 'express',
            version: '4.18.0',
            type: 'production' as const
          }
        ],
        vulnerabilities: [],
        outdated: [
          {
            package: 'lodash',
            current: '4.17.20',
            wanted: '4.17.21',
            latest: '4.17.21',
            type: 'patch' as const
          }
        ],
        unused: ['unused-package'],
        missing: [],
        circular: []
      };

      expect(isDependencyAnalysisResult(validResult)).toBe(true);
    });

    it('無効な依存関係タイプを拒否する', () => {
      const invalidResult = {
        dependencies: [
          {
            name: 'express',
            version: '4.18.0',
            type: 'invalid-type' // 無効な値
          }
        ],
        vulnerabilities: [],
        outdated: [],
        unused: [],
        missing: [],
        circular: []
      };

      expect(isDependencyAnalysisResult(invalidResult)).toBe(false);
    });
  });
});