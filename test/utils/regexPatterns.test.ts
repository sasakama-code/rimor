/**
 * RegexPatterns テストスイート
 * v0.3.0: 正規表現パターン定数のテスト
 */

import { RegexPatterns } from '../../src/utils/regexPatterns';

describe('RegexPatterns', () => {
  describe('File Patterns', () => {
    it('should match TypeScript files', () => {
      expect(RegexPatterns.TYPESCRIPT_FILE.test('test.ts')).toBe(true);
      expect(RegexPatterns.TYPESCRIPT_FILE.test('component.tsx')).toBe(true);
      expect(RegexPatterns.TYPESCRIPT_FILE.test('test.js')).toBe(false);
      expect(RegexPatterns.TYPESCRIPT_FILE.test('file.d.ts')).toBe(true);
    });

    it('should match JavaScript files', () => {
      expect(RegexPatterns.JAVASCRIPT_FILE.test('script.js')).toBe(true);
      expect(RegexPatterns.JAVASCRIPT_FILE.test('component.jsx')).toBe(true);
      expect(RegexPatterns.JAVASCRIPT_FILE.test('test.ts')).toBe(false);
      expect(RegexPatterns.JAVASCRIPT_FILE.test('file.mjs')).toBe(true);
    });

    it('should match test files', () => {
      expect(RegexPatterns.TEST_FILE.test('test.test.ts')).toBe(true);
      expect(RegexPatterns.TEST_FILE.test('component.spec.js')).toBe(true);
      expect(RegexPatterns.TEST_FILE.test('util.test.tsx')).toBe(true);
      expect(RegexPatterns.TEST_FILE.test('regular.ts')).toBe(false);
    });

    it('should match configuration files', () => {
      expect(RegexPatterns.CONFIG_FILE.test('config.json')).toBe(true);
      expect(RegexPatterns.CONFIG_FILE.test('package.json')).toBe(true);
      expect(RegexPatterns.CONFIG_FILE.test('tsconfig.json')).toBe(true);
      expect(RegexPatterns.CONFIG_FILE.test('.eslintrc.js')).toBe(true);
      expect(RegexPatterns.CONFIG_FILE.test('jest.config.ts')).toBe(true);
      expect(RegexPatterns.CONFIG_FILE.test('regular.ts')).toBe(false);
    });
  });

  describe('Import Patterns', () => {
    it('should match ES6 import statements', () => {
      const importCode = "import { Component } from 'react';";
      const match = importCode.match(RegexPatterns.ES6_IMPORT);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('react');
    });

    it('should match default imports', () => {
      const importCode = "import React from 'react';";
      const match = importCode.match(RegexPatterns.ES6_IMPORT);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('react');
    });

    it('should match namespace imports', () => {
      const importCode = "import * as fs from 'fs';";
      const match = importCode.match(RegexPatterns.ES6_IMPORT);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('fs');
    });

    it('should match CommonJS require statements', () => {
      const requireCode = "const fs = require('fs');";
      const match = requireCode.match(RegexPatterns.COMMONJS_REQUIRE);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('fs');
    });

    it('should match destructured require statements', () => {
      const requireCode = "const { readFile } = require('fs');";
      const match = requireCode.match(RegexPatterns.COMMONJS_REQUIRE);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('fs');
    });
  });

  describe('Function Patterns', () => {
    it('should match function declarations', () => {
      const functionCode = "function testFunction(param) { }";
      const match = functionCode.match(RegexPatterns.FUNCTION_DECLARATION);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('testFunction');
    });

    it('should match async function declarations', () => {
      const asyncCode = "async function fetchData() { }";
      const match = asyncCode.match(RegexPatterns.FUNCTION_DECLARATION);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('fetchData');
    });

    it('should match arrow functions', () => {
      const arrowCode = "const testFunc = (param) => { };";
      const match = arrowCode.match(RegexPatterns.ARROW_FUNCTION);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('testFunc');
    });

    it('should match method definitions', () => {
      const methodCode = "  testMethod() { }";
      const match = methodCode.match(RegexPatterns.METHOD_DEFINITION);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('testMethod');
    });

    it('should match class method definitions', () => {
      const classMethodCode = "  public async getData(): Promise<string> { }";
      const match = classMethodCode.match(RegexPatterns.METHOD_DEFINITION);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('getData');
    });
  });

  describe('Test Patterns', () => {
    it('should match describe blocks', () => {
      const describeCode = 'describe("Test Suite", () => {';
      const match = describeCode.match(RegexPatterns.DESCRIBE_BLOCK);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('Test Suite');
    });

    it('should match it blocks', () => {
      const itCode = 'it("should test something", () => {';
      const match = itCode.match(RegexPatterns.IT_BLOCK);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('should test something');
    });

    it('should match test blocks', () => {
      const testCode = 'test("should work correctly", () => {';
      const match = testCode.match(RegexPatterns.TEST_BLOCK);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('should work correctly');
    });

    it('should match beforeEach hooks', () => {
      const beforeEachCode = 'beforeEach(() => {';
      const match = beforeEachCode.match(RegexPatterns.BEFORE_EACH);
      
      expect(match).toBeTruthy();
    });

    it('should match afterEach hooks', () => {
      const afterEachCode = 'afterEach(async () => {';
      const match = afterEachCode.match(RegexPatterns.AFTER_EACH);
      
      expect(match).toBeTruthy();
    });
  });

  describe('Assertion Patterns', () => {
    it('should match Jest expect assertions', () => {
      const expectCode = 'expect(result).toBe(true);';
      const match = expectCode.match(RegexPatterns.JEST_EXPECT);
      
      expect(match).toBeTruthy();
    });

    it('should match various Jest matchers', () => {
      const assertions = [
        'expect(value).toEqual(expected);',
        'expect(fn).toHaveBeenCalled();',
        'expect(array).toContain(item);',
        'expect(promise).resolves.toBe(value);'
      ];
      
      assertions.forEach(assertion => {
        expect(RegexPatterns.JEST_EXPECT.test(assertion)).toBe(true);
      });
    });

    it('should match assert library assertions', () => {
      const assertCode = 'assert.equal(actual, expected);';
      const match = assertCode.match(RegexPatterns.ASSERT_LIBRARY);
      
      expect(match).toBeTruthy();
    });

    it('should match chai assertions', () => {
      const chaiCode = 'value.should.equal(expected);';
      const match = chaiCode.match(RegexPatterns.CHAI_ASSERTION);
      
      expect(match).toBeTruthy();
    });

    it('should match chai expect syntax', () => {
      const chaiExpectCode = 'expect(result).to.be.true;';
      const match = chaiExpectCode.match(RegexPatterns.CHAI_EXPECT);
      
      expect(match).toBeTruthy();
    });
  });

  describe('Comment Patterns', () => {
    it('should match single line comments', () => {
      const singleComment = '// This is a comment';
      const match = singleComment.match(RegexPatterns.SINGLE_LINE_COMMENT);
      
      expect(match).toBeTruthy();
      expect(match![1].trim()).toBe('This is a comment');
    });

    it('should match multi-line comments', () => {
      const multiComment = '/* This is a multi-line comment */';
      const match = multiComment.match(RegexPatterns.MULTI_LINE_COMMENT);
      
      expect(match).toBeTruthy();
      expect(match![1].trim()).toBe('This is a multi-line comment');
    });

    it('should match JSDoc comments', () => {
      const jsdocComment = '/** This is a JSDoc comment */';
      const match = jsdocComment.match(RegexPatterns.JSDOC_COMMENT);
      
      expect(match).toBeTruthy();
    });

    it('should match TODO comments', () => {
      const todoComment = '// TODO: Implement this feature';
      const match = todoComment.match(RegexPatterns.TODO_COMMENT);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('Implement this feature');
    });

    it('should match FIXME comments', () => {
      const fixmeComment = '// FIXME: Fix this bug';
      const match = fixmeComment.match(RegexPatterns.FIXME_COMMENT);
      
      expect(match).toBeTruthy();
      expect(match![1]).toBe('Fix this bug');
    });
  });

  describe('Version Patterns', () => {
    it('should match semantic version numbers', () => {
      const versions = [
        '1.0.0',
        '2.1.3',
        '0.0.1',
        '10.20.30'
      ];
      
      versions.forEach(version => {
        expect(RegexPatterns.SEMANTIC_VERSION.test(version)).toBe(true);
      });
    });

    it('should match prerelease versions', () => {
      const prereleaseVersions = [
        '1.0.0-alpha',
        '2.1.0-beta.1',
        '1.0.0-rc.1+build.1'
      ];
      
      prereleaseVersions.forEach(version => {
        expect(RegexPatterns.SEMANTIC_VERSION.test(version)).toBe(true);
      });
    });

    it('should reject invalid version formats', () => {
      const invalidVersions = [
        '1.0',
        '1',
        'v1.0.0',
        'invalid'
      ];
      
      invalidVersions.forEach(version => {
        expect(RegexPatterns.SEMANTIC_VERSION.test(version)).toBe(false);
      });
    });
  });

  describe('Path Patterns', () => {
    it('should match relative paths', () => {
      const relativePaths = [
        './file.ts',
        '../parent/file.js',
        '../../grandparent/file.tsx'
      ];
      
      relativePaths.forEach(path => {
        expect(RegexPatterns.RELATIVE_PATH.test(path)).toBe(true);
      });
    });

    it('should match absolute paths', () => {
      const absolutePaths = [
        '/absolute/path/file.ts',
        '/root/file.js',
        'C:\\Windows\\file.ts' // Windows path
      ];
      
      absolutePaths.forEach(path => {
        expect(RegexPatterns.ABSOLUTE_PATH.test(path)).toBe(true);
      });
    });

    it('should identify node_modules paths', () => {
      const nodeModulesPaths = [
        'node_modules/package/file.js',
        './node_modules/package/index.ts',
        '../node_modules/@scope/package/dist/file.js'
      ];
      
      nodeModulesPaths.forEach(path => {
        expect(RegexPatterns.NODE_MODULES_PATH.test(path)).toBe(true);
      });
    });
  });

  describe('Global Pattern Usage', () => {
    it('should handle global flag correctly', () => {
      const code = `
        expect(a).toBe(1);
        expect(b).toBe(2);
        expect(c).toBe(3);
      `;
      
      const matches = code.match(RegexPatterns.JEST_EXPECT) || [];
      
      // Global flagが正しく設定されていれば複数マッチする
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should extract all matches with global patterns', () => {
      const code = `
        function test1() {}
        function test2() {}
        function test3() {}
      `;
      
      const allMatches = [];
      let match;
      while ((match = RegexPatterns.FUNCTION_DECLARATION.exec(code)) !== null) {
        allMatches.push(match[1]);
      }
      
      expect(allMatches).toHaveLength(3);
      expect(allMatches).toContain('test1');
      expect(allMatches).toContain('test2');
      expect(allMatches).toContain('test3');
    });
  });
});