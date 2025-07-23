/**
 * RegexPatterns テストスイート
 * v0.3.0: 正規表現パターン定数の基本テスト
 */

import { TestPatterns } from '../../src/utils/regexPatterns';

describe('RegexPatterns', () => {
  describe('TestPatterns', () => {
    it('should export TestPatterns class', () => {
      expect(TestPatterns).toBeDefined();
      expect(TestPatterns.TEST_CASE).toBeDefined();
      expect(TestPatterns.DESCRIBE_SUITE).toBeDefined();
    });

    it('should have working regex patterns', () => {
      expect(TestPatterns.TEST_CASE.test('it("test", () => {})')).toBe(true);
      expect(TestPatterns.DESCRIBE_SUITE.test('describe("suite", () => {})')).toBe(true);
    });
  });
});