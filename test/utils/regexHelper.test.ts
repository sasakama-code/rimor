/**
 * RegexHelper テストスイート
 * v0.3.0: 正規表現ヘルパークラスのテスト
 */

import { RegexHelper } from '../../src/utils/regexHelper';

describe('RegexHelper', () => {
  describe('resetAndTest', () => {
    it('should reset lastIndex before testing', () => {
      const pattern = /test/g;
      const text = 'test content test';
      
      // 最初のテスト
      expect(RegexHelper.resetAndTest(pattern, text)).toBe(true);
      
      // lastIndexがリセットされて再度テストできることを確認
      expect(RegexHelper.resetAndTest(pattern, text)).toBe(true);
    });

    it('should handle non-matching text', () => {
      const pattern = /notfound/g;
      const text = 'test content';
      
      expect(RegexHelper.resetAndTest(pattern, text)).toBe(false);
    });
  });

  describe('resetAndMatch', () => {
    it('should reset lastIndex and return match array', () => {
      const pattern = /test/g;
      const text = 'test content';
      
      const match = RegexHelper.resetAndMatch(pattern, text);
      
      expect(match).toBeTruthy();
      expect(match![0]).toBe('test');
    });

    it('should return null for non-matching text', () => {
      const pattern = /notfound/g;
      const text = 'test content';
      
      const match = RegexHelper.resetAndMatch(pattern, text);
      
      expect(match).toBeNull();
    });
  });

  describe('resetAndExec', () => {
    it('should reset lastIndex and execute pattern', () => {
      const pattern = /test/g;
      const text = 'test content';
      
      const result = RegexHelper.resetAndExec(pattern, text);
      
      expect(result).toBeTruthy();
      expect(result![0]).toBe('test');
    });

    it('should return null for non-matching text', () => {
      const pattern = /notfound/g;
      const text = 'test content';
      
      const result = RegexHelper.resetAndExec(pattern, text);
      
      expect(result).toBeNull();
    });
  });

  describe('countMatches', () => {
    it('should count matching patterns', () => {
      const patterns = [/test/g, /content/g, /notfound/g];
      const text = 'test content';
      
      const count = RegexHelper.countMatches(patterns, text);
      
      expect(count).toBe(2);
    });

    it('should return 0 for no matches', () => {
      const patterns = [/notfound1/g, /notfound2/g];
      const text = 'test content';
      
      const count = RegexHelper.countMatches(patterns, text);
      
      expect(count).toBe(0);
    });
  });

  describe('testAny', () => {
    it('should return true if any pattern matches', () => {
      const patterns = [/test/g, /notfound/g];
      const text = 'test content';
      
      const result = RegexHelper.testAny(patterns, text);
      
      expect(result).toBe(true);
    });

    it('should return false if no patterns match', () => {
      const patterns = [/notfound1/g, /notfound2/g];
      const text = 'test content';
      
      const result = RegexHelper.testAny(patterns, text);
      
      expect(result).toBe(false);
    });
  });

  describe('testAll', () => {
    it('should return true if all patterns match', () => {
      const patterns = [/test/g, /content/g];
      const text = 'test content';
      
      const result = RegexHelper.testAll(patterns, text);
      
      expect(result).toBe(true);
    });

    it('should return false if any pattern does not match', () => {
      const patterns = [/test/g, /notfound/g];
      const text = 'test content';
      
      const result = RegexHelper.testAll(patterns, text);
      
      expect(result).toBe(false);
    });
  });

  describe('findAllMatches', () => {
    it('should find all matches for global patterns', () => {
      const pattern = /t\w+/g;
      const text = 'test text two';
      
      const matches = RegexHelper.findAllMatches(pattern, text);
      
      expect(matches).toHaveLength(3);
      expect(matches).toContain('test');
      expect(matches).toContain('text');
      expect(matches).toContain('two');
    });

    it('should throw error for non-global patterns', () => {
      const pattern = /test/; // グローバルフラグなし
      const text = 'test content';
      
      expect(() => {
        RegexHelper.findAllMatches(pattern, text);
      }).toThrow();
    });

    it('should return empty array for no matches', () => {
      const pattern = /notfound/g;
      const text = 'test content';
      
      const matches = RegexHelper.findAllMatches(pattern, text);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('debugPattern', () => {
    it('should log pattern information', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const pattern = /test/gi;
      RegexHelper.debugPattern(pattern, 'TestPattern');
      
      expect(consoleSpy).toHaveBeenCalledWith('TestPattern:', {
        source: 'test',
        flags: 'gi',
        lastIndex: 0,
        global: true,
        ignoreCase: true,
        multiline: false
      });
      
      consoleSpy.mockRestore();
    });

    it('should use default label when not provided', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const pattern = /test/;
      RegexHelper.debugPattern(pattern);
      
      expect(consoleSpy).toHaveBeenCalledWith('Pattern:', expect.any(Object));
      
      consoleSpy.mockRestore();
    });
  });
});