/**
 * UnifiedAIFormatterBase Test
 * v0.9.0 - DRY原則適用のためのベースクラステスト
 * 
 * TDD Red Phase: テストを先に作成
 * t_wada推奨のテスト駆動開発アプローチ
 */

import { UnifiedAIFormatterBase } from '../../src/ai-output/unified-ai-formatter-base';
import { UnifiedAnalysisResult, AIActionableRisk } from '../../src/ai-output/types';

// テスト用の具象クラス
class TestFormatter extends UnifiedAIFormatterBase {
  // 抽象メソッドの実装
  format(result: any) {
    return {
      keyRisks: this.assessRisks(result.issues || []),
      summary: {
        totalIssues: result.issues?.length || 0,
        criticalIssues: result.issues?.filter((i: any) => i.severity === 'critical').length || 0,
        highIssues: result.issues?.filter((i: any) => i.severity === 'high').length || 0,
        overallRisk: 'MEDIUM' as const
      }
    };
  }

  // テスト用にprotectedメソッドを公開
  public testAssessRisks(issues: any[]) {
    return super.assessRisks(issues);
  }

  public testMapSeverityToRiskLevel(severity: any) {
    return super.mapSeverityToRiskLevel(severity);
  }

  public testAssessImpact(issue: any) {
    return super.assessImpact(issue);
  }

  public testAssessLikelihood(issue: any) {
    return super.assessLikelihood(issue);
  }

  // テスト用のプロパティアクセス
  public getDefaultMaxRisks() {
    return this.DEFAULT_MAX_RISKS;
  }

  public getDefaultReportPath() {
    return this.DEFAULT_REPORT_PATH;
  }

  // テスト用メソッド
  public validateInput(result: UnifiedAnalysisResult): void {
    if (!result) {
      throw new Error('Invalid UnifiedAnalysisResult');
    }
    if (!result.summary || !result.aiKeyRisks) {
      throw new Error('Missing required fields');
    }
  }

  public hasNoRisks(risks: AIActionableRisk[]): boolean {
    return risks.length === 0;
  }

  public identifyTopIssues(risks: AIActionableRisk[]): string[] {
    return risks.slice(0, 3).map(r => r.problem);
  }

  public sortByPriority(risks: AIActionableRisk[]): AIActionableRisk[] {
    const order: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'MINIMAL': 4 };
    return [...risks].sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
  }

  public formatAsAIJson(result: UnifiedAnalysisResult, options?: any) {
    return {
      keyRisks: this.assessRisks((result.detailedIssues || []).map((issue: any) => ({
        ...issue,
        type: issue.type || 'issue',
        severity: issue.severity || issue.riskLevel || 'medium',
        message: issue.message || issue.description,
        category: issue.category || 'general'
      }))),
      overallAssessment: result.summary?.overallScore 
        ? `総合スコア: ${result.summary.overallScore}/100`
        : '問題は検出されませんでした',
      fullReportUrl: options?.htmlReportPath || '.rimor/reports/index.html',
      actionableRisks: result.aiKeyRisks?.slice(0, options?.maxRisks || 10) || [],
      summary: {
        totalIssues: result.detailedIssues?.length || 0,
        criticalIssues: 0,
        highIssues: 0,
        overallRisk: 'MEDIUM' as const
      }
    };
  }
}

describe('UnifiedAIFormatterBase', () => {
  let formatter: TestFormatter;

  beforeEach(() => {
    formatter = new TestFormatter();
  });

  describe('共通定数', () => {
    it('DEFAULT_MAX_RISKSが定義されている', () => {
      expect(formatter.getDefaultMaxRisks()).toBe(10);
    });

    it('DEFAULT_REPORT_PATHが定義されている', () => {
      expect(formatter.getDefaultReportPath()).toBe('.rimor/reports/index.html');
    });
  });

  describe('validateInput', () => {
    it('有効な入力を受け入れる', () => {
      const validInput: UnifiedAnalysisResult = {
        schemaVersion: '1.0',
        summary: {
          overallScore: 80,
          overallGrade: 'B',
          dimensions: [],
          statistics: {
            totalFiles: 10,
            totalTests: 5,
            riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 1, LOW: 2, MINIMAL: 0 }
          }
        },
        detailedIssues: [],
        aiKeyRisks: []
      };

      expect(() => formatter.validateInput(validInput)).not.toThrow();
    });

    it('nullの入力でエラーをスロー', () => {
      expect(() => formatter.validateInput(null as any)).toThrow('Invalid UnifiedAnalysisResult');
    });

    it('undefinedの入力でエラーをスロー', () => {
      expect(() => formatter.validateInput(undefined as any)).toThrow('Invalid UnifiedAnalysisResult');
    });

    it('summaryがない場合エラーをスロー', () => {
      const invalidInput = {
        schemaVersion: '1.0',
        detailedIssues: [],
        aiKeyRisks: []
      } as any;

      expect(() => formatter.validateInput(invalidInput)).toThrow('Missing required fields');
    });

    it('aiKeyRisksがない場合エラーをスロー', () => {
      const invalidInput = {
        schemaVersion: '1.0',
        summary: {
          overallScore: 80,
          overallGrade: 'B',
          dimensions: [],
          statistics: {
            totalFiles: 10,
            totalTests: 5,
            riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 1, LOW: 2, MINIMAL: 0 }
          }
        },
        detailedIssues: []
      } as any;

      expect(() => formatter.validateInput(invalidInput)).toThrow('Missing required fields');
    });
  });

  describe('hasNoRisks', () => {
    it('リスクがない場合trueを返す', () => {
      expect(formatter.hasNoRisks([])).toBe(true);
    });

    it('リスクがある場合falseを返す', () => {
      const risks: AIActionableRisk[] = [{
        riskId: '1',
        filePath: 'test.ts',
        riskLevel: 'HIGH',
        title: 'Test Risk',
        problem: 'Problem',
        context: {
          codeSnippet: '',
          startLine: 1,
          endLine: 2
        },
        suggestedAction: {
          type: 'ADD_MISSING_TEST',
          description: 'Add test'
        }
      }];
      
      expect(formatter.hasNoRisks(risks)).toBe(false);
    });
  });

  describe('identifyTopIssues', () => {
    it('上位3件の問題を抽出する', () => {
      const risks: AIActionableRisk[] = [
        { riskId: '1', problem: 'Issue 1', riskLevel: 'CRITICAL' } as AIActionableRisk,
        { riskId: '2', problem: 'Issue 2', riskLevel: 'HIGH' } as AIActionableRisk,
        { riskId: '3', problem: 'Issue 3', riskLevel: 'MEDIUM' } as AIActionableRisk,
        { riskId: '4', problem: 'Issue 4', riskLevel: 'LOW' } as AIActionableRisk
      ];

      const topIssues = formatter.identifyTopIssues(risks);
      
      expect(topIssues).toHaveLength(3);
      expect(topIssues).toEqual(['Issue 1', 'Issue 2', 'Issue 3']);
    });

    it('3件未満の場合は全て返す', () => {
      const risks: AIActionableRisk[] = [
        { riskId: '1', problem: 'Issue 1', riskLevel: 'HIGH' } as AIActionableRisk,
        { riskId: '2', problem: 'Issue 2', riskLevel: 'LOW' } as AIActionableRisk
      ];

      const topIssues = formatter.identifyTopIssues(risks);
      
      expect(topIssues).toHaveLength(2);
      expect(topIssues).toEqual(['Issue 1', 'Issue 2']);
    });

    it('空配列の場合は空配列を返す', () => {
      expect(formatter.identifyTopIssues([])).toEqual([]);
    });
  });

  describe('sortByPriority', () => {
    it('リスクレベルで優先順位をソートする', () => {
      const risks: AIActionableRisk[] = [
        { riskId: '1', riskLevel: 'LOW', problem: 'Low risk' } as AIActionableRisk,
        { riskId: '2', riskLevel: 'CRITICAL', problem: 'Critical risk' } as AIActionableRisk,
        { riskId: '3', riskLevel: 'HIGH', problem: 'High risk' } as AIActionableRisk,
        { riskId: '4', riskLevel: 'MEDIUM', problem: 'Medium risk' } as AIActionableRisk,
        { riskId: '5', riskLevel: 'MINIMAL', problem: 'Minimal risk' } as AIActionableRisk
      ];

      const sorted = formatter.sortByPriority(risks);
      
      expect(sorted[0].riskLevel).toBe('CRITICAL');
      expect(sorted[1].riskLevel).toBe('HIGH');
      expect(sorted[2].riskLevel).toBe('MEDIUM');
      expect(sorted[3].riskLevel).toBe('LOW');
      expect(sorted[4].riskLevel).toBe('MINIMAL');
    });

    it('同じリスクレベルの場合は順序を維持する', () => {
      const risks: AIActionableRisk[] = [
        { riskId: '1', riskLevel: 'HIGH', problem: 'First high' } as AIActionableRisk,
        { riskId: '2', riskLevel: 'HIGH', problem: 'Second high' } as AIActionableRisk,
        { riskId: '3', riskLevel: 'HIGH', problem: 'Third high' } as AIActionableRisk
      ];

      const sorted = formatter.sortByPriority(risks);
      
      expect(sorted[0].problem).toBe('First high');
      expect(sorted[1].problem).toBe('Second high');
      expect(sorted[2].problem).toBe('Third high');
    });
  });

  describe('formatAsAIJsonInternal', () => {
    it('UnifiedAnalysisResultをAIJsonOutputに変換する', () => {
      const input: UnifiedAnalysisResult = {
        schemaVersion: '1.0',
        summary: {
          overallScore: 85,
          overallGrade: 'B',
          dimensions: [],
          statistics: {
            totalFiles: 10,
            totalTests: 5,
            riskCounts: { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4, MINIMAL: 0 }
          }
        },
        detailedIssues: [],
        aiKeyRisks: [
          {
            riskId: '1',
            filePath: 'test.ts',
            riskLevel: 'CRITICAL',
            title: 'Critical Issue',
            problem: 'Security vulnerability',
            context: {
              codeSnippet: 'code',
              startLine: 1,
              endLine: 2
            },
            suggestedAction: {
              type: 'SANITIZE_VARIABLE',
              description: 'Sanitize input'
            }
          }
        ]
      };

      const output = formatter.formatAsAIJson(input);

      expect(output.overallAssessment).toContain('総合スコア: 85/100');
      expect(output.overallAssessment).toContain('グレード: B');
      expect(output.keyRisks).toHaveLength(1);
      expect(output.keyRisks[0].problem).toBe('Security vulnerability');
      expect(output.fullReportUrl).toBe('.rimor/reports/index.html');
    });

    it('リスクがない場合のメッセージを生成する', () => {
      const input: UnifiedAnalysisResult = {
        schemaVersion: '1.0',
        summary: {
          overallScore: 100,
          overallGrade: 'A',
          dimensions: [],
          statistics: {
            totalFiles: 10,
            totalTests: 10,
            riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, MINIMAL: 0 }
          }
        },
        detailedIssues: [],
        aiKeyRisks: []
      };

      const output = formatter.formatAsAIJson(input);

      expect(output.overallAssessment).toContain('優秀なコード品質');
      expect(output.keyRisks).toHaveLength(0);
    });

    it('最大リスク数を超える場合は制限する', () => {
      const risks: AIActionableRisk[] = [];
      for (let i = 0; i < 20; i++) {
        risks.push({
          riskId: `${i}`,
          filePath: 'test.ts',
          riskLevel: 'MEDIUM',
          title: `Issue ${i}`,
          problem: `Problem ${i}`,
          context: {
            codeSnippet: '',
            startLine: 1,
            endLine: 2
          },
          suggestedAction: {
            type: 'ADD_ASSERTION',
            description: 'Add assertion'
          }
        });
      }

      const input: UnifiedAnalysisResult = {
        schemaVersion: '1.0',
        summary: {
          overallScore: 50,
          overallGrade: 'D',
          dimensions: [],
          statistics: {
            totalFiles: 10,
            totalTests: 5,
            riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 20, LOW: 0, MINIMAL: 0 }
          }
        },
        detailedIssues: [],
        aiKeyRisks: risks
      };

      const output = formatter.formatAsAIJson(input);

      expect(output.keyRisks).toHaveLength(10); // DEFAULT_MAX_RISKS
    });
  });
});