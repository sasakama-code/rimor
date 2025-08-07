/**
 * UnifiedResultGenerator テスト
 * 全評価結果を統合してUnifiedAnalysisResultを生成するジェネレーターのテスト
 * 
 * TDD Red Phase: 失敗するテストを先に作成
 * t_wadaのTDD原則に従う
 */

import { UnifiedResultGenerator } from '../../../src/nist/generators/UnifiedResultGenerator';
import { PriorityEngine } from '../../../src/nist/priority/PriorityEngine';
import { TaintVulnerabilityAdapter } from '../../../src/nist/adapters/TaintVulnerabilityAdapter';
import { VulnerabilityEvaluator } from '../../../src/nist/evaluators/VulnerabilityEvaluator';
import { NistRiskEvaluator } from '../../../src/nist/evaluators/NistRiskEvaluator';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  AIActionType,
  ExecutiveSummary,
  DetailedIssue,
  AIActionableRisk
} from '../../../src/nist/types/unified-analysis-result';
import { 
  TaintAnalysisResult, 
  TaintLevel 
} from '../../../src/security/types/taint-analysis-types';
import { 
  RiskPriorityRequest,
  BusinessImpact,
  TechnicalComplexity
} from '../../../src/nist/types/priority-types';

describe('UnifiedResultGenerator', () => {
  let generator: UnifiedResultGenerator;
  let priorityEngine: PriorityEngine;
  let taintAdapter: TaintVulnerabilityAdapter;
  let vulnerabilityEvaluator: VulnerabilityEvaluator;
  let nistEvaluator: NistRiskEvaluator;

  beforeEach(() => {
    priorityEngine = new PriorityEngine();
    vulnerabilityEvaluator = new VulnerabilityEvaluator();
    taintAdapter = new TaintVulnerabilityAdapter(vulnerabilityEvaluator);
    nistEvaluator = new NistRiskEvaluator();
    
    generator = new UnifiedResultGenerator(
      priorityEngine,
      taintAdapter,
      nistEvaluator
    );
  });

  describe('統合分析結果の生成', () => {
    it('Taint解析結果から完全なUnifiedAnalysisResultを生成する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'FLOW-001',
            sourceLocation: { file: 'api.ts', line: 20, column: 5 },
            sinkLocation: { file: 'db.ts', line: 100, column: 10 },
            taintLevel: TaintLevel.HIGH,
            confidence: 0.85,
            path: ['api.ts:20', 'service.ts:50', 'db.ts:100'],
            description: 'SQLインジェクション脆弱性',
            cweId: '89'
          },
          {
            id: 'FLOW-002',
            sourceLocation: { file: 'input.ts', line: 15, column: 3 },
            sinkLocation: { file: 'output.ts', line: 30, column: 8 },
            taintLevel: TaintLevel.MEDIUM,
            confidence: 0.7,
            path: ['input.ts:15', 'output.ts:30'],
            description: 'XSS脆弱性',
            cweId: '79'
          }
        ],
        summary: {
          totalFlows: 2,
          criticalFlows: 0,
          highFlows: 1,
          mediumFlows: 1,
          lowFlows: 0
        }
      };

      const result = await generator.generate(taintResult);

      expect(result.schemaVersion).toBe('1.0');
      expect(result.summary).toBeDefined();
      expect(result.detailedIssues).toHaveLength(2);
      expect(result.aiKeyRisks).toHaveLength(2);
    });

    it('エグゼクティブサマリーを正しく生成する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'FLOW-001',
            sourceLocation: { file: 'critical.ts', line: 10, column: 5 },
            sinkLocation: { file: 'exec.ts', line: 50, column: 10 },
            taintLevel: TaintLevel.CRITICAL,
            confidence: 0.95,
            path: ['critical.ts:10', 'exec.ts:50'],
            description: 'リモートコード実行',
            cweId: '94'
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 1,
          highFlows: 0,
          mediumFlows: 0,
          lowFlows: 0
        }
      };

      const result = await generator.generate(taintResult);
      const summary = result.summary;

      expect(summary.overallScore).toBeLessThan(50);
      expect(summary.overallGrade).toMatch(/[D|F]/);
      expect(summary.dimensions).toHaveLength(3);
      expect(summary.statistics.totalFiles).toBeGreaterThan(0);
      expect(summary.statistics.riskCounts[RiskLevel.CRITICAL]).toBe(1);
    });

    it('詳細な問題リストを生成する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'FLOW-001',
            sourceLocation: { file: 'auth.ts', line: 25, column: 10 },
            sinkLocation: { file: 'session.ts', line: 75, column: 15 },
            taintLevel: TaintLevel.HIGH,
            confidence: 0.8,
            path: ['auth.ts:25', 'middleware.ts:40', 'session.ts:75'],
            description: '認証バイパスの可能性',
            cweId: '287'
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 0,
          highFlows: 1,
          mediumFlows: 0,
          lowFlows: 0
        }
      };

      const result = await generator.generate(taintResult);
      const issue = result.detailedIssues[0];

      expect(issue.filePath).toBe('session.ts');
      expect(issue.startLine).toBe(75);
      expect(issue.riskLevel).toBe(RiskLevel.HIGH);
      expect(issue.title).toContain('認証');
      expect(issue.description).toContain('認証バイパスの可能性');
      expect(issue.contextSnippet).toBeDefined();
    });

    it('AIアクション可能なリスクを優先順位付きで生成する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'FLOW-001',
            sourceLocation: { file: 'low.ts', line: 5, column: 1 },
            sinkLocation: { file: 'log.ts', line: 10, column: 5 },
            taintLevel: TaintLevel.LOW,
            confidence: 0.5,
            path: ['low.ts:5', 'log.ts:10'],
            description: '情報漏洩の可能性',
            cweId: '200'
          },
          {
            id: 'FLOW-002',
            sourceLocation: { file: 'high.ts', line: 15, column: 3 },
            sinkLocation: { file: 'db.ts', line: 30, column: 8 },
            taintLevel: TaintLevel.HIGH,
            confidence: 0.9,
            path: ['high.ts:15', 'db.ts:30'],
            description: 'SQLインジェクション',
            cweId: '89'
          }
        ],
        summary: {
          totalFlows: 2,
          criticalFlows: 0,
          highFlows: 1,
          mediumFlows: 0,
          lowFlows: 1
        }
      };

      const result = await generator.generate(taintResult);
      const aiRisks = result.aiKeyRisks;

      expect(aiRisks).toHaveLength(2);
      expect(aiRisks[0].riskId).toBe('FLOW-002');
      expect(aiRisks[0].riskLevel).toBe(RiskLevel.HIGH);
      expect(aiRisks[0].suggestedAction.type).toBe(AIActionType.SANITIZE_VARIABLE);
      expect(aiRisks[0].suggestedAction.example).toBeDefined();
    });
  });

  describe('スコア計算とグレード付け', () => {
    it('複数のディメンションからスコアを計算する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'FLOW-001',
            sourceLocation: { file: 'test.ts', line: 10, column: 5 },
            sinkLocation: { file: 'prod.ts', line: 20, column: 10 },
            taintLevel: TaintLevel.MEDIUM,
            confidence: 0.75,
            path: ['test.ts:10', 'prod.ts:20'],
            description: '中程度のリスク'
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 0,
          highFlows: 0,
          mediumFlows: 1,
          lowFlows: 0
        }
      };

      const result = await generator.generate(taintResult);
      const dimensions = result.summary.dimensions;

      const intentDimension = dimensions.find(d => d.name === 'テスト意図実現度');
      const securityDimension = dimensions.find(d => d.name === 'セキュリティリスク');
      const coverageDimension = dimensions.find(d => d.name === 'カバレッジ完全性');

      expect(intentDimension).toBeDefined();
      expect(securityDimension).toBeDefined();
      expect(coverageDimension).toBeDefined();
      
      expect(intentDimension!.weight).toBeGreaterThan(0);
      expect(securityDimension!.weight).toBeGreaterThan(0);
      expect(coverageDimension!.weight).toBeGreaterThan(0);
      
      const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('リスクレベルに応じた適切なグレードを付与する', async () => {
      const scenarios = [
        { riskLevel: TaintLevel.SAFE, expectedGrade: 'A' },
        { riskLevel: TaintLevel.LOW, expectedGrade: 'A' },
        { riskLevel: TaintLevel.MEDIUM, expectedGrade: 'C' },
        { riskLevel: TaintLevel.HIGH, expectedGrade: 'D' },
        { riskLevel: TaintLevel.CRITICAL, expectedGrade: 'F' }
      ];

      for (const scenario of scenarios) {
        const taintResult: TaintAnalysisResult = {
          flows: scenario.riskLevel === TaintLevel.SAFE ? [] : [
            {
              id: 'FLOW-TEST',
              sourceLocation: { file: 'test.ts', line: 1, column: 1 },
              sinkLocation: { file: 'test.ts', line: 2, column: 1 },
              taintLevel: scenario.riskLevel,
              confidence: 0.9,
              path: ['test.ts:1', 'test.ts:2'],
              description: 'テストリスク'
            }
          ],
          summary: {
            totalFlows: scenario.riskLevel === TaintLevel.SAFE ? 0 : 1,
            criticalFlows: scenario.riskLevel === TaintLevel.CRITICAL ? 1 : 0,
            highFlows: scenario.riskLevel === TaintLevel.HIGH ? 1 : 0,
            mediumFlows: scenario.riskLevel === TaintLevel.MEDIUM ? 1 : 0,
            lowFlows: scenario.riskLevel === TaintLevel.LOW ? 1 : 0
          }
        };

        const result = await generator.generate(taintResult);
        expect(result.summary.overallGrade).toBe(scenario.expectedGrade);
      }
    });
  });

  describe('AIアクション生成', () => {
    it('リスクタイプに応じた適切なAIアクションを提案する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'SQL-001',
            sourceLocation: { file: 'input.ts', line: 10, column: 5 },
            sinkLocation: { file: 'db.ts', line: 50, column: 10 },
            taintLevel: TaintLevel.HIGH,
            confidence: 0.9,
            path: ['input.ts:10', 'db.ts:50'],
            description: 'SQLインジェクション脆弱性',
            cweId: '89'
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 0,
          highFlows: 1,
          mediumFlows: 0,
          lowFlows: 0
        }
      };

      const result = await generator.generate(taintResult);
      const aiRisk = result.aiKeyRisks[0];

      expect(aiRisk.suggestedAction.type).toBe(AIActionType.SANITIZE_VARIABLE);
      expect(aiRisk.suggestedAction.description).toContain('サニタイズ');
      expect(aiRisk.suggestedAction.example).toContain('パラメータ化');
    });

    it('コンテキスト情報を含むAIリスクを生成する', async () => {
      const taintResult: TaintAnalysisResult = {
        flows: [
          {
            id: 'XSS-001',
            sourceLocation: { file: 'form.ts', line: 25, column: 8 },
            sinkLocation: { file: 'render.ts', line: 60, column: 12 },
            taintLevel: TaintLevel.MEDIUM,
            confidence: 0.75,
            path: ['form.ts:25', 'process.ts:40', 'render.ts:60'],
            description: 'XSS脆弱性',
            cweId: '79'
          }
        ],
        summary: {
          totalFlows: 1,
          criticalFlows: 0,
          highFlows: 0,
          mediumFlows: 1,
          lowFlows: 0
        }
      };

      const result = await generator.generate(taintResult);
      const aiRisk = result.aiKeyRisks[0];

      expect(aiRisk.context.codeSnippet).toBeDefined();
      expect(aiRisk.context.startLine).toBe(60);
      expect(aiRisk.context.endLine).toBeGreaterThanOrEqual(60);
      expect(aiRisk.problem).toContain('XSS');
    });
  });

  describe('エラーハンドリング', () => {
    it('空のTaint結果でも有効なUnifiedAnalysisResultを返す', async () => {
      const emptyTaintResult: TaintAnalysisResult = {
        flows: [],
        summary: {
          totalFlows: 0,
          criticalFlows: 0,
          highFlows: 0,
          mediumFlows: 0,
          lowFlows: 0
        }
      };

      const result = await generator.generate(emptyTaintResult);

      expect(result.schemaVersion).toBe('1.0');
      expect(result.summary.overallScore).toBe(100);
      expect(result.summary.overallGrade).toBe('A');
      expect(result.detailedIssues).toHaveLength(0);
      expect(result.aiKeyRisks).toHaveLength(0);
    });

    it('不正な入力に対して適切なエラーを返す', async () => {
      await expect(generator.generate(null as any)).rejects.toThrow('Invalid taint result');
      await expect(generator.generate(undefined as any)).rejects.toThrow('Invalid taint result');
    });
  });
});