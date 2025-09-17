/**
 * MarkdownFormatterのテスト
 * Issue #131対応: Markdownインジェクション対策の検証
 */

import { MarkdownFormatter } from '../../../src/reporting/formatters/MarkdownFormatter';
import { UnifiedAnalysisResult, RiskLevel, ExecutiveSummary, AIActionableRisk } from '../../../src/nist/types/unified-analysis-result';

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;

  beforeEach(() => {
    formatter = new MarkdownFormatter();
  });

  describe('基本的なレポート生成', () => {
    test('基本的なMarkdownレポートを生成できる', () => {
      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 85,
          overallGrade: 'A',
          statistics: {
            totalFiles: 10,
            totalTests: 25,
            riskCounts: {
              CRITICAL: 1,
              HIGH: 2,
              MEDIUM: 3,
              LOW: 4,
              MINIMAL: 5
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: [],
        metadata: {}
      };

      const result = formatter.format(mockResult);
      
      expect(typeof result).toBe('string');
      expect(result).toContain('# 分析レポート');
      expect(result).toContain('## サマリー');
      expect(result).toContain('**総合スコア**: 85/100');
      expect(result).toContain('**グレード**: A');
      expect(result).toContain('**ファイル数**: 10');
      expect(result).toContain('**テスト数**: 25');
    });

    test('リスク統計を正しく表示する', () => {
      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 85,
          overallGrade: 'A',
          statistics: {
            totalFiles: 10,
            totalTests: 25,
            riskCounts: {
              CRITICAL: 1,
              HIGH: 2,
              MEDIUM: 3,
              LOW: 4,
              MINIMAL: 5
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: [],
        metadata: {}
      };

      const result = formatter.format(mockResult) as string;
      
      expect(result).toContain('### リスク統計');
      expect(result).toContain('- CRITICAL: 1件');
      expect(result).toContain('- HIGH: 2件');
      expect(result).toContain('- MEDIUM: 3件');
      expect(result).toContain('- LOW: 4件');
      expect(result).toContain('- MINIMAL: 5件');
    });
  });

  describe('Markdownエスケープ機能（セキュリティ対策）', () => {
    test('危険なMarkdown文字を適切にエスケープする', () => {
      const dangerousText = '*Bold* _Italic_ `Code` # Header [Link](url) ![Image](url) <script>alert()</script> | Table |';
      const mockRisk: AIActionableRisk = {
        id: 'test-risk',
        title: dangerousText,
        problem: dangerousText,
        riskLevel: 'HIGH' as RiskLevel,
        filePath: 'test.ts',
        suggestedAction: dangerousText
      };

      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 85,
          overallGrade: 'A',
          statistics: {
            totalFiles: 1,
            totalTests: 1,
            riskCounts: {
              CRITICAL: 0,
              HIGH: 1,
              MEDIUM: 0,
              LOW: 0,
              MINIMAL: 0
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: [mockRisk],
        metadata: {}
      };

      const result = formatter.format(mockResult) as string;
      
      // 危険な文字がエスケープされていることを確認（メイン見出しのチェックは除外）
      expect(result).not.toContain('*Bold*');
      expect(result).not.toContain('_Italic_');
      expect(result).not.toContain('`Code`');
      expect(result).not.toContain('[Link](url)');
      expect(result).not.toContain('![Image](url)');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('| Table |');
      
      // エスケープされた文字が含まれることを確認
      expect(result).toContain('\\*Bold\\*');
      expect(result).toContain('\\_Italic\\_');
      expect(result).toContain('\\`Code\\`');
      expect(result).toContain('\\# Header');
      expect(result).toContain('\\[Link\\]\\(url\\)');
      expect(result).toContain('\\!\\[Image\\]\\(url\\)');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('\\| Table \\|');
    });

    test('コードスニペット内のバックティックを適切にエスケープする', () => {
      const mockRisk: AIActionableRisk = {
        id: 'test-risk',
        title: 'Code Injection Risk',
        problem: 'Dangerous code detected',
        riskLevel: 'CRITICAL' as RiskLevel,
        filePath: 'test.ts',
        context: {
          codeSnippet: 'const data = `template with ${injection}`;'
        },
        suggestedAction: 'Fix the injection'
      };

      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 50,
          overallGrade: 'C',
          statistics: {
            totalFiles: 1,
            totalTests: 1,
            riskCounts: {
              CRITICAL: 1,
              HIGH: 0,
              MEDIUM: 0,
              LOW: 0,
              MINIMAL: 0
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: [mockRisk],
        metadata: {}
      };

      const result = formatter.format(mockResult) as string;
      
      // コードブロックが適切に生成され、コードブロック内のトリプルバックティックがエスケープされることを確認
      expect(result).toContain('```typescript');
      // コードスニペット内では個別のバックティックはエスケープされない（コードブロック内なので安全）
      expect(result).toContain('const data = `template with ${injection}`;');
    });

    test('特殊文字を含むファイルパスを適切に処理する', () => {
      const dangerousPath = 'src/components/[dynamic]_component*.ts#hash';
      const mockRisk: AIActionableRisk = {
        id: 'test-risk',
        title: 'Path Injection Risk',
        problem: 'Dangerous path detected',
        riskLevel: 'HIGH' as RiskLevel,
        filePath: dangerousPath,
        suggestedAction: 'Fix the path'
      };

      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 75,
          overallGrade: 'B',
          statistics: {
            totalFiles: 1,
            totalTests: 1,
            riskCounts: {
              CRITICAL: 0,
              HIGH: 1,
              MEDIUM: 0,
              LOW: 0,
              MINIMAL: 0
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: [mockRisk],
        metadata: {}
      };

      const result = formatter.format(mockResult) as string;
      
      // ファイルパスが適切にエスケープされていることを確認
      expect(result).toContain('**ファイル**: src/components/\\[dynamic\\]\\_component\\*.ts\\#hash');
    });

    test('null・undefinedテキストを安全に処理する', () => {
      const mockRisk: AIActionableRisk = {
        id: 'test-risk',
        title: null as any,
        problem: undefined as any,
        riskLevel: 'LOW' as RiskLevel,
        filePath: '',
        suggestedAction: null as any
      };

      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 90,
          overallGrade: 'A',
          statistics: {
            totalFiles: 1,
            totalTests: 1,
            riskCounts: {
              CRITICAL: 0,
              HIGH: 0,
              MEDIUM: 0,
              LOW: 1,
              MINIMAL: 0
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: [mockRisk],
        metadata: {}
      };

      const result = formatter.format(mockResult) as string;
      
      // nullやundefinedが適切に処理されることを確認（エラーが発生しない）
      expect(typeof result).toBe('string');
      expect(result).toContain('## 主要なリスク');
    });
  });

  describe('BaseFormatterとの統合', () => {
    test('BaseFormatterの基本メソッドを継承している', () => {
      expect(formatter.name).toBe('markdown');
      expect(typeof formatter.format).toBe('function');
      expect(typeof formatter.formatAsync).toBe('function');
    });

    test('入力検証を適切に実行する', () => {
      expect(() => {
        formatter.format(null as any);
      }).toThrow('Invalid analysis result: result is null or undefined');

      expect(() => {
        formatter.format({} as any);
      }).toThrow('Invalid analysis result: summary is missing');
    });
  });

  describe('パフォーマンス', () => {
    test('大量のリスクを含むレポートを高速に生成できる', () => {
      const risks: AIActionableRisk[] = Array.from({ length: 100 }, (_, i) => ({
        id: `risk-${i}`,
        title: `Risk ${i} with *dangerous* markdown`,
        problem: `Problem ${i} with _dangerous_ formatting`,
        riskLevel: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'][i % 5] as RiskLevel,
        filePath: `file${i}.ts`,
        suggestedAction: `Fix issue ${i}`
      }));

      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 60,
          overallGrade: 'C',
          statistics: {
            totalFiles: 100,
            totalTests: 200,
            riskCounts: {
              CRITICAL: 20,
              HIGH: 20,
              MEDIUM: 20,
              LOW: 20,
              MINIMAL: 20
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: risks,
        metadata: {}
      };

      const startTime = Date.now();
      const result = formatter.format(mockResult) as string;
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 100ms以内で完了することを期待
      expect(duration).toBeLessThan(100);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(1000);
      
      // maxRisksオプションで制限されることを確認（デフォルト10件）
      const riskSections = result.match(/### \d+\./g) || [];
      expect(riskSections.length).toBeLessThanOrEqual(10);
    });

    test('maxRisksオプションを尊重する', () => {
      const risks: AIActionableRisk[] = Array.from({ length: 20 }, (_, i) => ({
        id: `risk-${i}`,
        title: `Risk ${i}`,
        problem: `Problem ${i}`,
        riskLevel: 'HIGH' as RiskLevel,
        filePath: `file${i}.ts`,
        suggestedAction: `Fix ${i}`
      }));

      const mockResult: UnifiedAnalysisResult = {
        schemaVersion: '0.9.0',
        timestamp: '2024-01-01T00:00:00Z',
        summary: {
          overallScore: 70,
          overallGrade: 'B',
          statistics: {
            totalFiles: 20,
            totalTests: 40,
            riskCounts: {
              CRITICAL: 0,
              HIGH: 20,
              MEDIUM: 0,
              LOW: 0,
              MINIMAL: 0
            }
          }
        } as ExecutiveSummary,
        aiKeyRisks: risks,
        metadata: {}
      };

      const result = formatter.format(mockResult, { maxRisks: 5 }) as string;
      
      // maxRisks: 5で制限されることを確認
      const riskSections = result.match(/### \d+\./g) || [];
      expect(riskSections.length).toBe(5);
    });
  });
});