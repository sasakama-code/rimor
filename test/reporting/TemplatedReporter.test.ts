/**
 * TemplatedReporter Tests
 * v0.8.0 - Phase 4: Context Engineering
 * 
 * テンプレートベースレポーター機能のテスト
 */

import { TemplatedReporter } from '../../src/reporting/TemplatedReporter';
import {
  StructuredAnalysisResult,
  Severity,
  IssueType,
  ReportGenerationOptions
} from '../../src/reporting/types';
import * as fs from 'fs/promises';
import * as path from 'path';

// モックデータ
const mockStructuredResult: StructuredAnalysisResult = {
  metadata: {
    version: '0.8.0',
    timestamp: '2024-01-15T10:00:00.000Z',
    analyzedPath: '/test/project',
    duration: 2500
  },
  summary: {
    totalFiles: 20,
    totalIssues: 5,
    issueBySeverity: {
      critical: 1,
      high: 2,
      medium: 1,
      low: 1,
      info: 0
    },
    issueByType: {
      'SQL_INJECTION': 1,
      'XSS': 1,
      'MISSING_TEST': 2,
      'TEST_QUALITY': 1
    }
  },
  issues: [
    {
      id: '1234567890abcdef',
      type: IssueType.SQL_INJECTION,
      category: 'security',
      severity: Severity.CRITICAL,
      location: {
        file: 'src/database.ts',
        startLine: 45,
        endLine: 45,
        startColumn: 10,
        endColumn: 50
      },
      message: 'SQLインジェクション脆弱性: ユーザー入力が直接SQLクエリに使用されています',
      recommendation: 'パラメータ化クエリまたはプリペアドステートメントを使用してください',
      codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
      dataFlow: {
        source: {
          location: { file: 'src/api.ts', startLine: 20, endLine: 20 },
          type: 'user_input',
          description: 'HTTPリクエストパラメータ'
        },
        sink: {
          location: { file: 'src/database.ts', startLine: 45, endLine: 45 },
          type: 'sql_query',
          description: 'SQLクエリ実行'
        },
        path: [
          {
            location: { file: 'src/controller.ts', startLine: 30, endLine: 30 },
            type: 'propagation',
            description: 'パラメータの受け渡し'
          }
        ]
      }
    },
    {
      id: '234567890abcdef1',
      type: IssueType.MISSING_TEST,
      category: 'test-coverage',
      severity: Severity.HIGH,
      location: {
        file: 'src/auth.ts',
        startLine: 1,
        endLine: 100
      },
      message: 'テストファイルが存在しません',
      recommendation: 'auth.test.tsファイルを作成し、認証ロジックのテストを実装してください'
    }
  ],
  metrics: {
    testCoverage: {
      overall: 65,
      byModule: {
        'src/core': { coverage: 80, testedFiles: 8, untestedFiles: 2 },
        'src/utils': { coverage: 90, testedFiles: 9, untestedFiles: 1 },
        'src/api': { coverage: 40, testedFiles: 4, untestedFiles: 6 }
      },
      missingTests: [
        { file: 'src/auth.ts', reason: 'テストファイルが存在しません' },
        { file: 'src/payment.ts', reason: 'テストカバレッジが10%未満です' }
      ]
    },
    codeQuality: {
      complexity: {
        average: 5.2,
        max: 25,
        highComplexityMethods: [
          {
            method: 'processPayment',
            complexity: 25,
            location: { file: 'src/payment.ts', startLine: 50, endLine: 150 }
          }
        ]
      },
      maintainability: {
        score: 72,
        issues: [
          '重複コードが検出されました',
          '長すぎるメソッドが存在します'
        ]
      }
    }
  },
  plugins: {
    'test-existence': { executed: true, duration: 500, issues: 2 },
    'assertion-quality': { executed: true, duration: 300, issues: 3 }
  }
};

describe('TemplatedReporter', () => {
  let reporter: TemplatedReporter;

  beforeEach(async () => {
    reporter = new TemplatedReporter();
    await reporter.initialize();
  });

  describe('initialization', () => {
    it('should load templates successfully', async () => {
      const newReporter = new TemplatedReporter();
      await expect(newReporter.initialize()).resolves.not.toThrow();
    });
  });

  describe('generateSummaryReport', () => {
    it('should generate summary report with basic data', async () => {
      const report = await reporter.generateSummaryReport(mockStructuredResult);

      expect(report).toContain('Rimor 分析レポート');
      expect(report).toContain('/test/project');
      expect(report).toContain('20 ファイル');
      expect(report).toContain('5 件');
      expect(report).toContain('**Critical**: 1 件');
      expect(report).toContain('**High**: 2 件');
    });

    it('should include test coverage information', async () => {
      const report = await reporter.generateSummaryReport(mockStructuredResult);

      expect(report).toContain('**全体カバレッジ**: 65%');
      expect(report).toContain('src/auth.ts');
      expect(report).toContain('テストファイルが存在しません');
    });

    it('should include code quality metrics', async () => {
      const report = await reporter.generateSummaryReport(mockStructuredResult);

      expect(report).toContain('**平均複雑度**: 5.2');
      expect(report).toContain('**最大複雑度**: 25');
      expect(report).toContain('processPayment');
    });

    it('should handle empty issues gracefully', async () => {
      const emptyResult: StructuredAnalysisResult = {
        ...mockStructuredResult,
        issues: [],
        summary: {
          ...mockStructuredResult.summary,
          totalIssues: 0,
          issueBySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          }
        }
      };

      const report = await reporter.generateSummaryReport(emptyResult);
      expect(report).toContain('- **検出された問題**: 0 件');
    });
  });

  describe('generateDetailedReport', () => {
    it('should generate detailed report with all sections', async () => {
      const report = await reporter.generateDetailedReport(mockStructuredResult);

      // ヘッダー情報
      expect(report).toContain('Rimor 詳細分析レポート');
      expect(report).toContain('エグゼクティブサマリー');
      expect(report).toContain('検出された問題の詳細');
      expect(report).toContain('テストカバレッジ分析');
      expect(report).toContain('コード品質メトリクス');
    });

    it('should include data flow analysis for security issues', async () => {
      const report = await reporter.generateDetailedReport(mockStructuredResult, {
        includeDataFlow: true
      });

      expect(report).toContain('汚染データフロー解析');
      expect(report).toContain('**Source** (user_input)');
      expect(report).toContain('ファイル: `src/api.ts`');
      expect(report).toContain('**Sink** (sql_query)');
      expect(report).toContain('伝播経路');
    });

    it('should filter by severity when specified', async () => {
      const options: ReportGenerationOptions = {
        severityFilter: [Severity.CRITICAL, Severity.HIGH]
      };

      const report = await reporter.generateDetailedReport(mockStructuredResult, options);
      
      // Critical と High の問題は含まれる
      expect(report).toContain('SQL_INJECTION');
      expect(report).toContain('MISSING_TEST');
      
      // フィルタリングされた結果の確認（実際の実装に依存）
    });

    it('should exclude recommendations when specified', async () => {
      const options: ReportGenerationOptions = {
        includeRecommendations: false
      };

      const report = await reporter.generateDetailedReport(mockStructuredResult, options);
      
      // 推奨事項が含まれないことを確認
      expect(report).not.toContain('推奨される対応');
    });
  });

  describe('generateCustomReport', () => {
    it('should generate report using custom template', async () => {
      // カスタムテンプレートを一時的に作成
      const customTemplate = `
# Custom Report for {{metadata.analyzedPath}}

Total Issues: {{summary.totalIssues}}

{{#each issues}}
- {{this.type}}: {{this.message}}
{{/each}}
`;
      
      const tempFile = path.join(__dirname, 'temp-custom.hbs');
      await fs.writeFile(tempFile, customTemplate, 'utf-8');

      try {
        const report = await reporter.generateCustomReport(
          mockStructuredResult,
          tempFile
        );

        expect(report).toContain('Custom Report for /test/project');
        expect(report).toContain('Total Issues: 5');
        expect(report).toContain('SQL_INJECTION:');
        expect(report).toContain('MISSING_TEST:');
      } finally {
        // クリーンアップ
        await fs.unlink(tempFile).catch(() => {});
      }
    });
  });

  describe('Handlebars helpers', () => {
    it('should format date correctly', async () => {
      const report = await reporter.generateSummaryReport(mockStructuredResult);
      
      // 日本語形式の日付が含まれることを確認
      expect(report).toMatch(/2024\/01\/15 \d{2}:\d{2}:\d{2}/);
    });

    it('should format duration correctly', async () => {
      const testData = {
        ...mockStructuredResult,
        metadata: {
          ...mockStructuredResult.metadata,
          duration: 2500
        }
      };

      const report = await reporter.generateSummaryReport(testData);
      expect(report).toContain('2.50秒');
    });

    it('should calculate percentages correctly', async () => {
      const report = await reporter.generateDetailedReport(mockStructuredResult);
      
      // 重要度別の割合計算
      // Critical: 1/5 = 20%
      expect(report).toContain('20.0%');
    });

    it('should use severity icons correctly', async () => {
      const report = await reporter.generateSummaryReport(mockStructuredResult);
      
      expect(report).toContain('🔴'); // Critical
      expect(report).toContain('🟠'); // High
    });
  });

  describe('edge cases', () => {
    it('should handle missing optional fields', async () => {
      const minimalResult: StructuredAnalysisResult = {
        metadata: {
          version: '0.8.0',
          timestamp: new Date().toISOString(),
          analyzedPath: '/test',
          duration: 100
        },
        summary: {
          totalFiles: 1,
          totalIssues: 0,
          issueBySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
          },
          issueByType: {}
        },
        issues: [],
        metrics: {
          testCoverage: { overall: 0, byModule: {} },
          codeQuality: {}
        }
      };

      await expect(
        reporter.generateSummaryReport(minimalResult)
      ).resolves.not.toThrow();
    });

    it('should handle very long issue messages', async () => {
      const longMessageResult = {
        ...mockStructuredResult,
        issues: [{
          ...mockStructuredResult.issues[0],
          message: 'A'.repeat(1000) // 非常に長いメッセージ
        }]
      };

      const report = await reporter.generateDetailedReport(longMessageResult);
      expect(report).toContain('A'.repeat(100)); // 少なくとも一部が含まれる
    });
  });
});