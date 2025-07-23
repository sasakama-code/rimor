/**
 * RegexHelper テストスイート
 * v0.3.0: 正規表現ヘルパー関数のテスト
 */

import { RegexHelper } from '../../src/utils/regexHelper';

describe('RegexHelper', () => {
  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      const input = 'test.file*with[special]chars?and+more^symbols$';
      const escaped = RegexHelper.escapeRegExp(input);
      
      expect(escaped).toBe('test\\.file\\*with\\[special\\]chars\\?and\\+more\\^symbols\\$');
      
      // エスケープされた文字列で正規表現を作成してもエラーが出ないことを確認
      expect(() => new RegExp(escaped)).not.toThrow();
    });

    it('should handle empty string', () => {
      const escaped = RegexHelper.escapeRegExp('');
      expect(escaped).toBe('');
    });

    it('should handle string without special characters', () => {
      const input = 'normalstring123';
      const escaped = RegexHelper.escapeRegExp(input);
      expect(escaped).toBe(input);
    });
  });

  describe('createGlobPattern', () => {
    it('should convert simple glob pattern to regex', () => {
      const pattern = '*.ts';
      const regex = RegexHelper.createGlobPattern(pattern);
      
      expect(regex.test('test.ts')).toBe(true);
      expect(regex.test('file.ts')).toBe(true);
      expect(regex.test('test.js')).toBe(false);
      expect(regex.test('ts')).toBe(false);
    });

    it('should handle double asterisk for recursive matching', () => {
      const pattern = '**/*.test.ts';
      const regex = RegexHelper.createGlobPattern(pattern);
      
      expect(regex.test('src/test.test.ts')).toBe(true);
      expect(regex.test('src/core/analyzer.test.ts')).toBe(true);
      expect(regex.test('test.test.ts')).toBe(true);
      expect(regex.test('test.ts')).toBe(false);
    });

    it('should handle question mark for single character matching', () => {
      const pattern = 'test?.ts';
      const regex = RegexHelper.createGlobPattern(pattern);
      
      expect(regex.test('test1.ts')).toBe(true);
      expect(regex.test('testA.ts')).toBe(true);
      expect(regex.test('test.ts')).toBe(false);
      expect(regex.test('test12.ts')).toBe(false);
    });

    it('should handle character classes', () => {
      const pattern = 'test[0-9].ts';
      const regex = RegexHelper.createGlobPattern(pattern);
      
      expect(regex.test('test1.ts')).toBe(true);
      expect(regex.test('test9.ts')).toBe(true);
      expect(regex.test('testA.ts')).toBe(false);
      expect(regex.test('test.ts')).toBe(false);
    });

    it('should handle brace expansion', () => {
      const pattern = '*.{ts,js}';
      const regex = RegexHelper.createGlobPattern(pattern);
      
      expect(regex.test('file.ts')).toBe(true);
      expect(regex.test('file.js')).toBe(true);
      expect(regex.test('file.tsx')).toBe(false);
    });
  });

  describe('extractImports', () => {
    it('should extract ES6 import statements', () => {
      const code = `
        import { Component } from 'react';
        import fs from 'fs';
        import * as path from 'path';
        const test = 'not an import';
      `;
      
      const imports = RegexHelper.extractImports(code);
      
      expect(imports).toHaveLength(3);
      expect(imports).toContain('react');
      expect(imports).toContain('fs');
      expect(imports).toContain('path');
    });

    it('should extract CommonJS require statements', () => {
      const code = `
        const fs = require('fs');
        const { resolve } = require('path');
        const express = require('express');
        console.log('not a require');
      `;
      
      const imports = RegexHelper.extractImports(code, { includeRequire: true });
      
      expect(imports).toHaveLength(3);
      expect(imports).toContain('fs');
      expect(imports).toContain('path');
      expect(imports).toContain('express');
    });

    it('should handle relative imports', () => {
      const code = `
        import { helper } from './helper';
        import config from '../config';
        import { utils } from '../../utils';
      `;
      
      const imports = RegexHelper.extractImports(code, { includeRelative: true });
      
      expect(imports).toHaveLength(3);
      expect(imports).toContain('./helper');
      expect(imports).toContain('../config');
      expect(imports).toContain('../../utils');
    });

    it('should filter out relative imports by default', () => {
      const code = `
        import { Component } from 'react';
        import { helper } from './helper';
      `;
      
      const imports = RegexHelper.extractImports(code);
      
      expect(imports).toHaveLength(1);
      expect(imports).toContain('react');
      expect(imports).not.toContain('./helper');
    });
  });

  describe('extractFunctionNames', () => {
    it('should extract function declarations', () => {
      const code = `
        function test() {}
        function anotherTest(param) {}
        const notAFunction = 'test';
      `;
      
      const functions = RegexHelper.extractFunctionNames(code);
      
      expect(functions).toHaveLength(2);
      expect(functions).toContain('test');
      expect(functions).toContain('anotherTest');
    });

    it('should extract arrow functions', () => {
      const code = `
        const arrowFunc = () => {};
        const namedArrow = (param) => param * 2;
        const obj = { method: () => {} };
      `;
      
      const functions = RegexHelper.extractFunctionNames(code, { includeArrowFunctions: true });
      
      expect(functions).toContain('arrowFunc');
      expect(functions).toContain('namedArrow');
    });

    it('should extract method definitions', () => {
      const code = `
        class TestClass {
          method1() {}
          async method2() {}
          static method3() {}
        }
      `;
      
      const functions = RegexHelper.extractFunctionNames(code, { includeMethods: true });
      
      expect(functions).toContain('method1');
      expect(functions).toContain('method2');
      expect(functions).toContain('method3');
    });
  });

  describe('extractTestCases', () => {
    it('should extract Jest test cases', () => {
      const code = `
        describe('TestSuite', () => {
          it('should test something', () => {});
          test('should test another thing', () => {});
          it.skip('should skip this test', () => {});
        });
      `;
      
      const testCases = RegexHelper.extractTestCases(code);
      
      expect(testCases).toHaveLength(3);
      expect(testCases).toContain('should test something');
      expect(testCases).toContain('should test another thing');
      expect(testCases).toContain('should skip this test');
    });

    it('should extract describe blocks', () => {
      const code = `
        describe('MainSuite', () => {
          describe('SubSuite', () => {
            it('test case', () => {});
          });
        });
      `;
      
      const suites = RegexHelper.extractTestSuites(code);
      
      expect(suites).toHaveLength(2);
      expect(suites).toContain('MainSuite');
      expect(suites).toContain('SubSuite');
    });
  });

  describe('extractAssertions', () => {
    it('should extract Jest assertions', () => {
      const code = `
        expect(result).toBe(true);
        expect(value).toEqual({ key: 'value' });
        expect(fn).toHaveBeenCalled();
        const notAssertion = 'expect';
      `;
      
      const assertions = RegexHelper.extractAssertions(code);
      
      expect(assertions).toHaveLength(3);
      expect(assertions.some(a => a.includes('toBe(true)'))).toBe(true);
      expect(assertions.some(a => a.includes('toEqual'))).toBe(true);
      expect(assertions.some(a => a.includes('toHaveBeenCalled'))).toBe(true);
    });

    it('should extract assert library assertions', () => {
      const code = `
        assert.equal(a, b);
        assert.strictEqual(x, y);
        assert.ok(condition);
      `;
      
      const assertions = RegexHelper.extractAssertions(code, { includeAssertLibrary: true });
      
      expect(assertions).toHaveLength(3);
      expect(assertions.some(a => a.includes('assert.equal'))).toBe(true);
      expect(assertions.some(a => a.includes('assert.strictEqual'))).toBe(true);
      expect(assertions.some(a => a.includes('assert.ok'))).toBe(true);
    });

    it('should extract chai assertions', () => {
      const code = `
        value.should.equal(expected);
        expect(result).to.be.true;
        chai.expect(data).to.have.property('key');
      `;
      
      const assertions = RegexHelper.extractAssertions(code, { includeChai: true });
      
      expect(assertions).toHaveLength(3);
      expect(assertions.some(a => a.includes('should.equal'))).toBe(true);
      expect(assertions.some(a => a.includes('to.be.true'))).toBe(true);
      expect(assertions.some(a => a.includes('to.have.property'))).toBe(true);
    });
  });

  describe('validation helpers', () => {
    it('should validate email format', () => {
      expect(RegexHelper.isValidEmail('test@example.com')).toBe(true);
      expect(RegexHelper.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(RegexHelper.isValidEmail('invalid-email')).toBe(false);
      expect(RegexHelper.isValidEmail('test@')).toBe(false);
    });

    it('should validate version format (semver)', () => {
      expect(RegexHelper.isValidVersion('1.0.0')).toBe(true);
      expect(RegexHelper.isValidVersion('2.1.3-beta.1')).toBe(true);
      expect(RegexHelper.isValidVersion('0.0.1-alpha')).toBe(true);
      expect(RegexHelper.isValidVersion('1.0')).toBe(false);
      expect(RegexHelper.isValidVersion('invalid')).toBe(false);
    });

    it('should validate file path format', () => {
      expect(RegexHelper.isValidFilePath('src/test.ts')).toBe(true);
      expect(RegexHelper.isValidFilePath('/absolute/path/file.js')).toBe(true);
      expect(RegexHelper.isValidFilePath('../relative/path.tsx')).toBe(true);
      expect(RegexHelper.isValidFilePath('')).toBe(false);
      expect(RegexHelper.isValidFilePath('invalid\x00path')).toBe(false);
    });
  });

  describe('performance', () => {
    it('should handle large text efficiently', () => {
      const largeText = 'test content '.repeat(10000);
      const startTime = Date.now();
      
      const imports = RegexHelper.extractImports(largeText);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(100); // Should complete within 100ms
      expect(Array.isArray(imports)).toBe(true);
    });

    it('should handle regex compilation efficiently', () => {
      const patterns = Array.from({ length: 100 }, (_, i) => `pattern${i}.*`);
      const startTime = Date.now();
      
      patterns.forEach(pattern => {
        RegexHelper.createGlobPattern(pattern);
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(50); // Should complete within 50ms
    });
  });
});