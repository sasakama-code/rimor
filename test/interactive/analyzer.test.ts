import { PatternAnalyzer } from '../../src/interactive/analyzer';
import { Pattern } from '../../src/interactive/types';

describe('PatternAnalyzer', () => {
  let analyzer: PatternAnalyzer;

  beforeEach(() => {
    analyzer = new PatternAnalyzer();
  });

  describe('analyzeExamples', () => {
    it('should extract expect pattern from good examples', () => {
      const goodExamples = [
        'expect(result).toBe(true);',
        'expect(user.name).toEqual("John");',
        'expect(count).toBeGreaterThan(0);'
      ];
      const badExamples = [
        'result === true;',
        'user.name;',
        'count > 0;'
      ];

      const patterns = analyzer.analyzeExamples(goodExamples, badExamples);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].type).toBe('string-match');
      expect(patterns[0].value).toBe('expect(');
      expect(patterns[0].description).toContain('期待値');
      expect(patterns[0].confidence).toBeGreaterThan(0.5);
    });

    it('should extract describe pattern when present', () => {
      const goodExamples = [
        'describe("test suite", () => { expect(x).toBe(1); });',
        'describe("another test", function() { expect(y).toBe(2); });'
      ];
      const badExamples = [
        'x === 1;',
        'y === 2;'
      ];

      const patterns = analyzer.analyzeExamples(goodExamples, badExamples);

      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const describePattern = patterns.find(p => p.value === 'describe(');
      expect(describePattern).toBeDefined();
      if (describePattern) {
        expect(describePattern.type).toBe('string-match');
        expect(describePattern.description).toContain('テストスイート');
      }
    });

    it('should extract it/test pattern when present', () => {
      const goodExamples = [
        'it("should work", () => { expect(true).toBe(true); });',
        'test("should also work", () => { expect(1).toBe(1); });'
      ];
      const badExamples = [
        'true;',
        '1;'
      ];

      const patterns = analyzer.analyzeExamples(goodExamples, badExamples);

      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const itPattern = patterns.find(p => p.value === 'it(' || p.value === 'test(');
      expect(itPattern).toBeDefined();
    });

    it('should return empty array when no clear patterns found', () => {
      const goodExamples = ['console.log("test");'];
      const badExamples = ['console.log("bad");'];

      const patterns = analyzer.analyzeExamples(goodExamples, badExamples);

      expect(patterns).toHaveLength(0);
    });

    it('should handle empty examples gracefully', () => {
      const patterns = analyzer.analyzeExamples([], []);
      expect(patterns).toHaveLength(0);
    });

    it('should calculate appropriate confidence scores', () => {
      // 全ての good example に含まれるパターン = 高い信頼度
      const goodExamples = [
        'expect(a).toBe(1);',
        'expect(b).toBe(2);',
        'expect(c).toBe(3);'
      ];
      const badExamples = [
        'a === 1;',
        'b === 2;', 
        'c === 3;'
      ];

      const patterns = analyzer.analyzeExamples(goodExamples, badExamples);
      
      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const expectPattern = patterns.find(p => p.value === 'expect(');
      expect(expectPattern).toBeDefined();
      if (expectPattern) {
        expect(expectPattern.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should handle single example cases', () => {
      const goodExamples = ['expect(result).toBe(expected);'];
      const badExamples = ['result;'];

      const patterns = analyzer.analyzeExamples(goodExamples, badExamples);

      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const expectPattern = patterns.find(p => p.value === 'expect(');
      expect(expectPattern).toBeDefined();
      if (expectPattern) {
        expect(expectPattern.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('findCommonPatterns', () => {
    it('should find common string patterns in examples', () => {
      const examples = [
        'expect(x).toBe(1);',
        'expect(y).toBe(2);',
        'expect(z).toBe(3);'
      ];

      const patterns = analyzer.findCommonPatterns(examples);

      expect(patterns).toContain('expect(');
      expect(patterns).toContain('.toBe(');
    });

    it('should handle examples with no common patterns', () => {
      const examples = [
        'console.log("a");',
        'alert("b");',
        'document.write("c");'
      ];

      const patterns = analyzer.findCommonPatterns(examples);

      expect(patterns).toHaveLength(0);
    });
  });

  describe('calculateConfidence', () => {
    it('should return high confidence for patterns in all good examples', () => {
      const goodExamples = [
        'expect(a).toBe(1);',
        'expect(b).toBe(2);'
      ];
      const badExamples = [
        'a === 1;',
        'b === 2;'
      ];

      analyzer['goodExamples'] = goodExamples;
      analyzer['badExamples'] = badExamples;

      const confidence = analyzer.calculateConfidence('expect(');

      expect(confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should return lower confidence for patterns in some bad examples', () => {
      const goodExamples = [
        'expect(a).toBe(1);',
        'expect(b).toBe(2);'
      ];
      const badExamples = [
        'expect(c).toBe(3); // but missing assertion check',
        'b === 2;'
      ];

      analyzer['goodExamples'] = goodExamples;
      analyzer['badExamples'] = badExamples;

      const confidence = analyzer.calculateConfidence('expect(');

      expect(confidence).toBeLessThan(0.8);
      expect(confidence).toBeGreaterThan(0);
    });
  });
});