/**
 * analyze-v0.8.tsの型安全性テスト
 * TDDアプローチ - REDフェーズ
 */

import { 
  ProjectAnalysisResult,
  TaintAnalysisResult,
  Issue
} from '../../../src/core/types';

import {
  AIJsonOutput,
  AIRisk,
  AIRiskContext,
  AISuggestedAction,
  ReportOutput,
  ReportSummary,
  ReportResult,
  isAIJsonOutput,
  isAIRisk,
  isReportOutput,
  convertToAIJson,
  convertToReportOutput
} from '../../../src/cli/commands/analyze-types';

describe('AnalyzeCommand v0.8 - Type Safety', () => {
  describe('AIJsonOutput型', () => {
    it('有効なAIJsonOutputを検証できる', () => {
      const validOutput: AIJsonOutput = {
        overallAssessment: 'プロジェクト品質評価結果:\n総合スコア: 85/100',
        keyRisks: [
          {
            problem: 'テストカバレッジ不足',
            riskLevel: 'HIGH',
            context: {
              filePath: 'src/test.ts',
              codeSnippet: 'function test() {}',
              startLine: 10,
              endLine: 15
            },
            suggestedAction: {
              type: 'ADD_TEST',
              description: 'テストを追加してください',
              example: 'describe("test", () => { ... })'
            }
          }
        ],
        fullReportUrl: '.rimor/reports/index.html'
      };

      expect(isAIJsonOutput(validOutput)).toBe(true);
    });

    it('無効なriskLevelを拒否する', () => {
      const invalidOutput = {
        overallAssessment: 'test',
        keyRisks: [
          {
            problem: 'test',
            riskLevel: 'INVALID', // 無効な値
            context: {
              filePath: 'test.ts',
              codeSnippet: '',
              startLine: 0,
              endLine: 0
            },
            suggestedAction: {
              type: 'TEST',
              description: 'test',
              example: ''
            }
          }
        ],
        fullReportUrl: 'test.html'
      };

      expect(isAIJsonOutput(invalidOutput)).toBe(false);
    });
  });

  describe('変換関数', () => {
    it('ProjectAnalysisResultをAIJsonOutputに変換できる', () => {
      const analysisResult: Partial<ProjectAnalysisResult> = {
        projectPath: '/test/project',
        issues: [
          {
            type: 'missing-test',
            message: 'テストが不足しています',
            severity: 'high',
            file: 'src/index.ts',
            line: 10
          }
        ],
        qualityScore: {
          overall: 0.85,
          confidence: 0.9,
          dimensions: {
            completeness: 0.8,
            correctness: 0.9,
            maintainability: 0.85
          }
        }
      };

      const aiJson = convertToAIJson(analysisResult);
      
      expect(aiJson).toBeDefined();
      expect(aiJson.keyRisks).toHaveLength(1);
      expect(aiJson.keyRisks[0].riskLevel).toBe('HIGH');
    });

    it('空の分析結果を処理できる', () => {
      const emptyResult = {
        projectPath: '/test/project',
        issues: [],
        qualityScore: {
          overall: 1.0,
          confidence: 1.0,
          dimensions: {}
        }
      };

      const aiJson = convertToAIJson(emptyResult);
      
      expect(aiJson.keyRisks).toHaveLength(0);
      expect(aiJson.overallAssessment).toContain('100');
    });
  });

  describe('TaintAnalysisResult変換', () => {
    it('TaintAnalysisResultをReportOutputに変換できる', () => {
      const taintResult: Partial<TaintAnalysisResult> = {
        flows: [
          {
            id: 'flow-1',
            source: 'user-input',
            sink: 'database',
            path: ['input', 'processor', 'db'],
            taintLevel: 'high',
            confidence: 0.9
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
        recommendations: ['入力検証を追加']
      };

      const report = convertToReportOutput(taintResult);
      
      expect(report).toBeDefined();
      expect(report.summary.highIssues).toBe(1);
    });
  });
});