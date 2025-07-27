import { CodeContextUtils } from '../../../src/analyzers/code-context/utils';

describe('CodeContextUtils', () => {
  let utils: CodeContextUtils;

  beforeEach(() => {
    utils = new CodeContextUtils();
  });

  describe('extractCodeSnippet', () => {
    it('should extract code snippet around a specific line', () => {
      const code = `line 1
line 2
line 3
line 4
line 5
line 6
line 7`;
      const snippet = utils.extractCodeSnippet(code, 4, 2);
      
      expect(snippet).toContain('line 2');
      expect(snippet).toContain('line 3');
      expect(snippet).toContain('line 4');
      expect(snippet).toContain('line 5');
      expect(snippet).toContain('line 6');
    });

    it('should handle edge cases at start of file', () => {
      const code = `line 1
line 2
line 3`;
      const snippet = utils.extractCodeSnippet(code, 1, 2);
      
      expect(snippet).toContain('line 1');
      expect(snippet).toContain('line 2');
      expect(snippet).toContain('line 3');
    });

    it('should handle edge cases at end of file', () => {
      const code = `line 1
line 2
line 3`;
      const snippet = utils.extractCodeSnippet(code, 3, 2);
      
      expect(snippet).toContain('line 1');
      expect(snippet).toContain('line 2');
      expect(snippet).toContain('line 3');
    });
  });

  describe('normalizeCode', () => {
    it('should normalize code formatting', () => {
      const code = `  function test()   {\n    return true;  \n  }  `;
      const normalized = utils.normalizeCode(code);
      
      expect(normalized).not.toContain('  function');
      expect(normalized).toContain('function test()');
    });

    it('should preserve string literals', () => {
      const code = `const str = "  spaced  string  ";`;
      const normalized = utils.normalizeCode(code);
      
      expect(normalized).toContain('"  spaced  string  "');
    });
  });

  describe('getLineColumn', () => {
    it('should convert offset to line and column', () => {
      const code = `line 1
line 2
line 3`;
      const position = utils.getLineColumn(code, 14); // 'l' in 'line 3'
      
      expect(position.line).toBe(3);
      expect(position.column).toBe(1);
    });

    it('should handle offset at start of file', () => {
      const code = `line 1
line 2`;
      const position = utils.getLineColumn(code, 0);
      
      expect(position.line).toBe(1);
      expect(position.column).toBe(1);
    });
  });

  describe('getOffset', () => {
    it('should convert line and column to offset', () => {
      const code = `line 1
line 2
line 3`;
      const offset = utils.getOffset(code, 3, 1);
      
      expect(offset).toBe(14); // Start of 'line 3'
    });

    it('should handle first line', () => {
      const code = `line 1
line 2`;
      const offset = utils.getOffset(code, 1, 1);
      
      expect(offset).toBe(0);
    });
  });

  describe('findNodeAtPosition', () => {
    it('should find AST node at given position', () => {
      const code = `function test() { return true; }`;
      const node = utils.findNodeAtPosition(code, 1, 10, 'typescript');
      
      expect(node).toBeDefined();
      expect(node?.type).toBeDefined();
    });
  });

  describe('extractComments', () => {
    it('should extract single line comments', () => {
      const code = `
        // This is a comment
        const x = 1;
        // Another comment
      `;
      
      const comments = utils.extractComments(code);
      
      expect(comments).toHaveLength(2);
      expect(comments[0].text).toContain('This is a comment');
    });

    it('should extract multi-line comments', () => {
      const code = `
        /* 
         * Multi-line
         * comment
         */
        const x = 1;
      `;
      
      const comments = utils.extractComments(code);
      
      expect(comments).toHaveLength(1);
      expect(comments[0].text).toContain('Multi-line');
      expect(comments[0].type).toBe('block');
    });
  });

  describe('isTestFile', () => {
    it('should identify test files by name', () => {
      expect(utils.isTestFile('/path/to/file.test.ts')).toBe(true);
      expect(utils.isTestFile('/path/to/file.spec.ts')).toBe(true);
      expect(utils.isTestFile('/path/to/__tests__/file.ts')).toBe(true);
      expect(utils.isTestFile('/path/to/file.ts')).toBe(false);
    });
  });

  describe('getRelativePath', () => {
    it('should calculate relative path between files', () => {
      const from = '/project/src/components/Button.tsx';
      const to = '/project/src/utils/helpers.ts';
      
      const relative = utils.getRelativePath(from, to);
      
      expect(relative).toBe('../utils/helpers.ts');
    });
  });

  describe('sanitizeForRegex', () => {
    it('should escape special regex characters', () => {
      const input = 'test.method(param)';
      const sanitized = utils.sanitizeForRegex(input);
      
      expect(sanitized).toBe('test\\.method\\(param\\)');
    });
  });

  describe('mergeContexts', () => {
    it('should merge multiple code contexts', () => {
      const context1 = {
        functions: [{ name: 'func1' }],
        classes: [],
        variables: [{ name: 'var1' }]
      };
      
      const context2 = {
        functions: [{ name: 'func2' }],
        classes: [{ name: 'Class1' }],
        variables: [{ name: 'var2' }]
      };
      
      const merged = utils.mergeContexts([context1, context2]);
      
      expect(merged.functions).toHaveLength(2);
      expect(merged.classes).toHaveLength(1);
      expect(merged.variables).toHaveLength(2);
    });
  });
});
