import {
  stripAnsiCodes,
  removeExcessiveWhitespace,
  processEscapedCharacters,
  trimTrailingWhitespace,
  sanitizeForAIReport,
  sanitizeObject,
  sanitizeJsonString
} from '../../src/utils/stringSanitizer';

describe('stringSanitizer', () => {
  describe('stripAnsiCodes', () => {
    it('ANSIエスケープシーケンスを除去する', () => {
      const input = '\u001b[31mError\u001b[0m: \u001b[96mFile not found\u001b[0m';
      const expected = 'Error: File not found';
      expect(stripAnsiCodes(input)).toBe(expected);
    });

    it('複雑なANSIコードを除去する', () => {
      const input = '\u001b[7m2\u001b[0m import { validate } from \u001b[91m\'class-validator\'\u001b[0m;';
      const expected = '2 import { validate } from \'class-validator\';';
      expect(stripAnsiCodes(input)).toBe(expected);
    });

    it('ANSIコードがない場合はそのまま返す', () => {
      const input = 'Normal text without any codes';
      expect(stripAnsiCodes(input)).toBe(input);
    });

    it('複数行のANSIコードを除去する', () => {
      const input = `\u001b[96mline1\u001b[0m
\u001b[93mline2\u001b[0m
\u001b[91mline3\u001b[0m`;
      const expected = `line1
line2
line3`;
      expect(stripAnsiCodes(input)).toBe(expected);
    });
  });

  describe('removeExcessiveWhitespace', () => {
    it('3行以上の連続空白行を2行に削減する', () => {
      const input = 'line1\n\n\n\nline2';
      const expected = 'line1\n\nline2';
      expect(removeExcessiveWhitespace(input)).toBe(expected);
    });

    it('2行以下の空白行はそのまま', () => {
      const input = 'line1\n\nline2';
      expect(removeExcessiveWhitespace(input)).toBe(input);
    });
  });

  describe('processEscapedCharacters', () => {
    it('エスケープされた改行文字を処理する', () => {
      const input = 'line1\\nline2\\nline3';
      const expected = 'line1\nline2\nline3';
      expect(processEscapedCharacters(input)).toBe(expected);
    });

    it('エスケープされたタブ文字を処理する', () => {
      const input = 'column1\\tcolumn2\\tcolumn3';
      const expected = 'column1\tcolumn2\tcolumn3';
      expect(processEscapedCharacters(input)).toBe(expected);
    });

    it('複合的なエスケープ文字を処理する', () => {
      const input = 'line1\\n\\tindented\\nline2';
      const expected = 'line1\n\tindented\nline2';
      expect(processEscapedCharacters(input)).toBe(expected);
    });
  });

  describe('trimTrailingWhitespace', () => {
    it('行末の空白を除去する', () => {
      const input = 'line1    \nline2  \nline3';
      const expected = 'line1\nline2\nline3';
      expect(trimTrailingWhitespace(input)).toBe(expected);
    });

    it('行末にタブがある場合も除去する', () => {
      const input = 'line1\t\t\nline2\t\nline3';
      const expected = 'line1\nline2\nline3';
      expect(trimTrailingWhitespace(input)).toBe(expected);
    });
  });

  describe('sanitizeForAIReport', () => {
    it('全てのサニタイズ処理を適用する', () => {
      const input = `\u001b[96mError\u001b[0m: Test failed\\n\\n\\n\\nDetails:    
\u001b[91m  at test.ts:10\u001b[0m   `;
      const expected = `Error: Test failed

Details:
  at test.ts:10`;
      expect(sanitizeForAIReport(input)).toBe(expected);
    });

    it('実際のJestエラーメッセージをサニタイズする', () => {
      const input = `\u001b[96mdocs/test.ts\u001b[0m:\u001b[93m2\u001b[0m:\u001b[93m26\u001b[0m - \u001b[91merror\u001b[0m\u001b[90m TS2307: \u001b[0mCannot find module 'class-validator'\\n\\n\u001b[7m2\u001b[0m import { validate } from 'class-validator';\\n\u001b[7m \u001b[0m \u001b[91m                         ~~~~~~~~~~~~~~~~~\u001b[0m`;
      
      const result = sanitizeForAIReport(input);
      
      // ANSIコードが除去されている
      expect(result).not.toContain('\u001b');
      // モジュール名が残っている
      expect(result).toContain('Cannot find module');
      expect(result).toContain('class-validator');
    });

    it('空文字列を処理する', () => {
      expect(sanitizeForAIReport('')).toBe('');
    });

    it('nullやundefinedを処理する', () => {
      expect(sanitizeForAIReport(null as any)).toBe('');
      expect(sanitizeForAIReport(undefined as any)).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('オブジェクト内の文字列フィールドをサニタイズする', () => {
      const input = {
        error: '\u001b[31mError\u001b[0m',
        stack: 'at test.ts:10    ',
        details: {
          message: 'Test\\nfailed',
          code: '\u001b[96m100\u001b[0m'
        }
      };
      
      const result = sanitizeObject(input);
      
      expect(result.error).toBe('Error');
      expect(result.stack).toBe('at test.ts:10');
      expect(result.details.message).toBe('Test\nfailed');
      expect(result.details.code).toBe('100');
    });

    it('配列内の要素もサニタイズする', () => {
      const input = {
        errors: [
          '\u001b[31mError 1\u001b[0m',
          '\u001b[96mError 2\u001b[0m',
          'Normal error'
        ]
      };
      
      const result = sanitizeObject(input);
      
      expect(result.errors).toEqual(['Error 1', 'Error 2', 'Normal error']);
    });

    it('ネストされた構造を正しく処理する', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              message: '\u001b[31mDeep error\u001b[0m'
            }
          }
        }
      };
      
      const result = sanitizeObject(input);
      
      expect(result.level1.level2.level3.message).toBe('Deep error');
    });

    it('プリミティブ値はそのまま返す', () => {
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeJsonString', () => {
    it('JSON文字列をパースしてサニタイズする', () => {
      const input = JSON.stringify({
        error: '\u001b[31mError\u001b[0m',
        details: 'Test\\nfailed'
      });
      
      const result = sanitizeJsonString(input);
      const parsed = JSON.parse(result);
      
      expect(parsed.error).toBe('Error');
      expect(parsed.details).toBe('Test\nfailed');
    });

    it('無効なJSONの場合は文字列としてサニタイズする', () => {
      const input = 'Not a valid JSON \u001b[31mstring\u001b[0m';
      const result = sanitizeJsonString(input);
      
      expect(result).toBe('Not a valid JSON string');
    });

    it('大きなJSONオブジェクトを処理する', () => {
      const input = JSON.stringify({
        errorGroups: [
          {
            pattern: 'モジュール未検出エラー',
            errors: [
              {
                message: '\u001b[96mCannot find module\u001b[0m',
                stack: '  at test.ts:10\\n  at test.ts:20  '
              }
            ]
          }
        ]
      });
      
      const result = sanitizeJsonString(input);
      const parsed = JSON.parse(result);
      
      expect(parsed.errorGroups[0].errors[0].message).toBe('Cannot find module');
      expect(parsed.errorGroups[0].errors[0].stack).toBe('  at test.ts:10\n  at test.ts:20');
    });
  });
});