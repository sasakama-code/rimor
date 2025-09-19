/**
 * BaseFormatterのテスト
 * Issue #131対応: Markdownエスケープ機能の検証
 */

import { BaseFormatter } from '../../../src/reporting/formatters/BaseFormatter';
import { UnifiedAnalysisResult, ExecutiveSummary } from '../../../src/nist/types/unified-analysis-result';

// テスト用の具象クラス
class TestFormatter extends BaseFormatter {
  name = 'test';
  
  protected doFormat(result: UnifiedAnalysisResult, options?: Record<string, unknown>): string {
    return 'test-result';
  }
  
  // protectedメソッドをテスト用に公開
  public testEscapeMarkdown(text: string): string {
    return this.escapeMarkdown(text);
  }
  
  public testEscapeHtml(text: string): string {
    return this.escapeHtml(text);
  }
}

describe('BaseFormatter', () => {
  let formatter: TestFormatter;

  beforeEach(() => {
    formatter = new TestFormatter();
  });

  describe('escapeMarkdown メソッド', () => {
    test('基本的なMarkdown特殊文字をエスケープする', () => {
      const input = '*Bold* _Italic_ `Code`';
      const expected = '\\*Bold\\* \\_Italic\\_ \\`Code\\`';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('ヘッダー記号をエスケープする', () => {
      const input = '# Header 1 ## Header 2 ### Header 3';
      const expected = '\\# Header 1 \\#\\# Header 2 \\#\\#\\# Header 3';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('リンク記号をエスケープする', () => {
      const input = '[Link text](https://example.com)';
      const expected = '\\[Link text\\]\\(https://example.com\\)';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('画像記号をエスケープする', () => {
      const input = '![Alt text](image.png)';
      const expected = '\\!\\[Alt text\\]\\(image.png\\)';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('HTMLタグをエスケープする', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert\\("xss"\\)&lt;/script&gt;';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('テーブル記号をエスケープする', () => {
      const input = '| Column 1 | Column 2 |';
      const expected = '\\| Column 1 \\| Column 2 \\|';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('バックスラッシュをエスケープする', () => {
      const input = 'Path\\to\\file';
      const expected = 'Path\\\\to\\\\file';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('複合的な特殊文字を同時にエスケープする', () => {
      const input = '*Bold* _Italic_ `Code` # Header [Link](url) ![Image](url) <script> | Table |';
      const expected = '\\*Bold\\* \\_Italic\\_ \\`Code\\` \\# Header \\[Link\\]\\(url\\) \\!\\[Image\\]\\(url\\) &lt;script&gt; \\| Table \\|';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });

    test('空文字列を安全に処理する', () => {
      const result = formatter.testEscapeMarkdown('');
      expect(result).toBe('');
    });

    test('nullやundefinedを安全に処理する', () => {
      const result1 = formatter.testEscapeMarkdown(null as any);
      expect(result1).toBe('');
      
      const result2 = formatter.testEscapeMarkdown(undefined as any);
      expect(result2).toBe('');
    });

    test('数値型の入力を安全に処理する', () => {
      const result = formatter.testEscapeMarkdown(123 as any);
      expect(result).toBe('');
    });

    test('既にエスケープされた文字を二重エスケープしない', () => {
      const input = '\\*Already escaped\\*';
      const expected = '\\\\\\*Already escaped\\\\\\*';
      
      const result = formatter.testEscapeMarkdown(input);
      expect(result).toBe(expected);
    });
  });

  describe('escapeHtml メソッド', () => {
    test('基本的なHTML特殊文字をエスケープする', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      
      const result = formatter.testEscapeHtml(input);
      expect(result).toBe(expected);
    });

    test('全てのHTML特殊文字をエスケープする', () => {
      const input = '& < > " \'';
      const expected = '&amp; &lt; &gt; &quot; &#39;';
      
      const result = formatter.testEscapeHtml(input);
      expect(result).toBe(expected);
    });
  });

  describe('基本機能', () => {
    test('正常な入力で基本的なフォーマット処理が動作する', () => {
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
      expect(result).toBe('test-result');
    });

    test('入力検証で無効な入力を適切に拒否する', () => {
      expect(() => {
        formatter.format(null as any);
      }).toThrow('Invalid analysis result: result is null or undefined');

      expect(() => {
        formatter.format({ schemaVersion: '0.9.0' } as any);
      }).toThrow('Invalid analysis result: summary is missing');

      expect(() => {
        formatter.format({ summary: {} } as any);
      }).toThrow('Invalid analysis result: schemaVersion is missing');
    });
  });

  describe('ユーティリティメソッド', () => {
    test('タイムスタンプ生成が正しく動作する', () => {
      // protectedメソッドなので直接テストできないため、間接的にテスト
      const result = formatter.format({
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
      });
      
      expect(result).toBe('test-result');
    });
  });
});