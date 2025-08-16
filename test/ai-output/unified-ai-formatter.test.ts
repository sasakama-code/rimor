/**
 * UnifiedAIFormatter テスト
 * Issue #58: AIエージェント向けコンテキスト出力機能
 * 
 * TDD Red Phase: 失敗するテストを先に作成
 * t_wadaのTDD原則に従う
 */

import { UnifiedAIFormatter } from '../../src/ai-output/unified-ai-formatter';
import {
  UnifiedAnalysisResult,
  RiskLevel,
  AIActionType,
  ExecutiveSummary,
  DetailedIssue,
  AIActionableRisk
} from '../../src/nist/types/unified-analysis-result';
import { AIJsonOutput } from '../../src/ai-output/types';

describe('UnifiedAIFormatter', () => {
  let formatter: UnifiedAIFormatter;

  beforeEach(() => {
    formatter = new UnifiedAIFormatter();
  });

  describe('formatAsAIJson', () => {
    it('UnifiedAnalysisResultをAI JSON形式に変換する', () => {
      // Arrange
      const unifiedResult: UnifiedAnalysisResult = createMockUnifiedResult();
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.overallAssessment).toBeDefined();
      expect(result.keyRisks).toBeDefined();
      expect(result.fullReportUrl).toBeDefined();
    });

    it('overallAssessmentに全体状況と最重要問題点を含める', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult);
      
      // Assert
      expect(result.overallAssessment).toContain('総合スコア: 45/100');
      expect(result.overallAssessment).toContain('グレード: D');
      expect(result.overallAssessment).toContain('CRITICAL: 5件');
      expect(result.overallAssessment).toContain('最重要問題');
    });

    it('aiKeyRisksを優先順位付きで変換する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult);
      
      // Assert
      expect(result.keyRisks).toHaveLength(2);
      expect(result.keyRisks[0].problem).toBe('SQLインジェクションの脆弱性');
      expect(result.keyRisks[0].context).toBeDefined();
      expect(result.keyRisks[0].context.codeSnippet).toContain('SELECT * FROM users');
      expect(result.keyRisks[0].suggestedAction).toBeDefined();
      expect(result.keyRisks[0].suggestedAction.type).toBe('SANITIZE_VARIABLE');
    });

    it('suggestedActionに具体的なアクション指示を含める', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult);
      
      // Assert
      const firstRisk = result.keyRisks[0];
      expect(firstRisk.suggestedAction).toEqual({
        type: 'SANITIZE_VARIABLE',
        description: 'SQLクエリのパラメータをサニタイズしてください',
        example: expect.stringContaining('parameterized query')
      });
    });

    it('CRITICALとHIGHリスクを優先的に含める', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResultWithMultipleRisks();
      const options = {
        includeRiskLevels: ['CRITICAL', 'HIGH']
      };
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult, options);
      
      // Assert
      const riskLevels = result.keyRisks.map((r: any) => r.riskLevel);
      expect(riskLevels[0]).toBe('CRITICAL');
      expect(riskLevels[1]).toBe('HIGH');
      expect(riskLevels.filter((l: string) => l === 'LOW')).toHaveLength(0);
      expect(result.keyRisks).toHaveLength(2);
    });

    it('最大10件のkeyRisksに制限する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResultWithManyRisks(20);
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult);
      
      // Assert
      expect(result.keyRisks).toHaveLength(10);
    });

    it('fullReportUrlにHTMLレポートへのパスを設定する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      const options = { reportPath: '.rimor/reports/index.html' };
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult, options);
      
      // Assert
      expect(result.fullReportUrl).toBe('.rimor/reports/index.html');
    });

    it('空のaiKeyRisksの場合でも正常に処理する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResultWithNoRisks();
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult);
      
      // Assert
      expect(result.keyRisks).toEqual([]);
      expect(result.overallAssessment).toContain('問題は検出されませんでした');
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な入力に対してエラーをスローする', () => {
      // Act & Assert
      expect(() => formatter.formatAsAIJson(null as any)).toThrow('Invalid UnifiedAnalysisResult');
    });

    it('必須フィールドが欠けている場合にエラーをスローする', () => {
      // Arrange
      const invalidResult = {} as UnifiedAnalysisResult;
      
      // Act & Assert
      expect(() => formatter.formatAsAIJson(invalidResult)).toThrow('Missing required fields');
    });
  });

  describe('HTMLレポート連携', () => {
    it('実際のHTMLレポートパスを使用する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      const actualHtmlPath = '/projects/rimor/.rimor/reports/analysis-report.html';
      const options = { 
        reportPath: actualHtmlPath
      };
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult, options);
      
      // Assert
      expect(result.fullReportUrl).toBe(actualHtmlPath);
    });

    it('HTMLレポートパスが指定されない場合はデフォルトパスを使用する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      const options = {};
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult, options);
      
      // Assert
      expect(result.fullReportUrl).toBe('.rimor/reports/index.html');
    });

    it('相対パスのHTMLレポートパスを正しく処理する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      const options = { 
        reportPath: '.rimor/reports',
        htmlReportPath: './reports/test-report.html'
      };
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult, options);
      
      // Assert
      expect(result.fullReportUrl).toBe('./reports/test-report.html');
    });

    it('絶対パスのHTMLレポートパスを正しく処理する', () => {
      // Arrange
      const unifiedResult = createMockUnifiedResult();
      const absolutePath = '/Users/test/project/.rimor/reports/report.html';
      const options = { 
        reportPath: '.rimor/reports',
        htmlReportPath: absolutePath
      };
      
      // Act
      const result = formatter.formatAsAIJson(unifiedResult, options);
      
      // Assert
      expect(result.fullReportUrl).toBe(absolutePath);
    });
  });
});

// テスト用のモックデータ生成関数
function createMockUnifiedResult(): UnifiedAnalysisResult {
  return {
    schemaVersion: '1.0',
    summary: {
      overallScore: 45,
      overallGrade: 'D',
      dimensions: [
        {
          name: 'セキュリティリスク',
          score: 30,
          weight: 0.3,
          impact: 9,
          breakdown: [
            {
              label: 'SQLインジェクション',
              calculation: '-10点 x 5件',
              deduction: -50
            }
          ]
        }
      ],
      statistics: {
        totalFiles: 100,
        totalTests: 50,
        riskCounts: {
          CRITICAL: 5,
          HIGH: 10,
          MEDIUM: 15,
          LOW: 20,
          MINIMAL: 5
        }
      }
    },
    detailedIssues: [
      {
        filePath: 'src/api/users.ts',
        startLine: 42,
        endLine: 45,
        riskLevel: RiskLevel.CRITICAL,
        title: 'SQLインジェクションの脆弱性',
        description: 'ユーザー入力が直接SQLクエリに埋め込まれています',
        contextSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`;'
      }
    ],
    aiKeyRisks: [
      {
        riskId: 'sql-injection-001',
        filePath: 'src/api/users.ts',
        riskLevel: RiskLevel.CRITICAL,
        title: 'SQLインジェクションの脆弱性',
        problem: 'SQLインジェクションの脆弱性',
        context: {
          codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
          startLine: 42,
          endLine: 42
        },
        suggestedAction: {
          type: AIActionType.SANITIZE_VARIABLE,
          description: 'SQLクエリのパラメータをサニタイズしてください',
          example: 'const query = "SELECT * FROM users WHERE id = ?"; // Use parameterized query'
        }
      },
      {
        riskId: 'missing-test-001',
        filePath: 'src/utils/validator.ts',
        riskLevel: RiskLevel.HIGH,
        title: 'テストカバレッジ不足',
        problem: '重要なバリデーション関数にテストがありません',
        context: {
          codeSnippet: 'function validateEmail(email: string): boolean { ... }',
          startLine: 10,
          endLine: 15
        },
        suggestedAction: {
          type: AIActionType.ADD_MISSING_TEST,
          description: 'バリデーション関数のテストを追加してください',
          example: 'describe("validateEmail", () => { ... });'
        }
      }
    ]
  };
}

function createMockUnifiedResultWithMultipleRisks(): UnifiedAnalysisResult {
  const base = createMockUnifiedResult();
  // CRITICALとHIGHリスクのみ、LOWリスクも追加してフィルタリングをテスト
  base.aiKeyRisks = [
    base.aiKeyRisks[0], // CRITICAL
    base.aiKeyRisks[1], // HIGH
    {
      riskId: 'low-001',
      filePath: 'src/utils/logger.ts',
      riskLevel: RiskLevel.LOW,
      title: 'ログ出力の改善',
      problem: 'ログレベルが適切でない',
      context: {
        codeSnippet: 'console.log(data);',
        startLine: 5,
        endLine: 5
      },
      suggestedAction: {
        type: AIActionType.REFACTOR_COMPLEX_CODE,
        description: '適切なロガーを使用してください',
        example: 'logger.info(data);'
      }
    }
  ];
  return base;
}

function createMockUnifiedResultWithManyRisks(count: number): UnifiedAnalysisResult {
  const base = createMockUnifiedResult();
  base.aiKeyRisks = Array.from({ length: count }, (_, i) => ({
    riskId: `risk-${i}`,
    filePath: `src/file${i}.ts`,
    riskLevel: i < 5 ? RiskLevel.CRITICAL : RiskLevel.HIGH,
    title: `リスク ${i}`,
    problem: `問題 ${i}`,
    context: {
      codeSnippet: `code ${i}`,
      startLine: i,
      endLine: i
    },
    suggestedAction: {
      type: AIActionType.ADD_ASSERTION,
      description: `修正 ${i}`,
      example: `example ${i}`
    }
  }));
  return base;
}

function createMockUnifiedResultWithNoRisks(): UnifiedAnalysisResult {
  const base = createMockUnifiedResult();
  base.aiKeyRisks = [];
  base.summary.statistics.riskCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    MINIMAL: 0
  };
  base.summary.overallScore = 100;
  base.summary.overallGrade = 'A';
  return base;
}