import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalysisHelper } from '../../src/utils/codeAnalysisHelper';
import { Evidence, CodeLocation } from '../../src/core/types';

const getFixturePath = (filename: string) => path.join(__dirname, '../fixtures', filename);

describe('CodeAnalysisHelper', () => {
  let helper: CodeAnalysisHelper;

  beforeEach(() => {
    helper = new CodeAnalysisHelper();
  });

  describe('parseFile', () => {
    it('should parse TypeScript test file correctly', async () => {
      const filePath = getFixturePath('sample.test.ts');
      const result = await helper.parseFile(filePath);

      expect(result).toBeDefined();
      expect(result.filePath).toBe(filePath);
      expect(result.content).toContain('describe');
      expect(result.lines).toBeInstanceOf(Array);
      expect(result.lines.length).toBeGreaterThan(0);
    });

    it('should handle non-existent files gracefully', async () => {
      const filePath = '/non/existent/file.ts';
      
      await expect(helper.parseFile(filePath)).rejects.toThrow();
    });
  });

  describe('findPatterns', () => {
    it('should find test patterns correctly', async () => {
      const filePath = getFixturePath('sample.test.ts');
      const fileContent = await helper.parseFile(filePath);

      const patterns = helper.findPatterns(fileContent, /describe\s*\(/g);
      
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.line).toBeGreaterThan(0);
        expect(pattern.column).toBeGreaterThanOrEqual(0);
        expect(pattern.match).toContain('describe');
      });
    });

    it('should return empty array when no patterns found', async () => {
      const filePath = getFixturePath('sample.test.ts');
      const fileContent = await helper.parseFile(filePath);

      const patterns = helper.findPatterns(fileContent, /nonexistentpattern/g);
      
      expect(patterns).toEqual([]);
    });
  });

  describe('findAssertions', () => {
    it('should detect various assertion patterns', async () => {
      const filePath = getFixturePath('sample.test.ts');
      const fileContent = await helper.parseFile(filePath);

      const assertions = helper.findAssertions(fileContent);
      
      expect(assertions.length).toBeGreaterThan(0);
      assertions.forEach(assertion => {
        expect(['expect', 'assert', 'should']).toContain(assertion.type);
        expect(assertion.location.line).toBeGreaterThan(0);
      });
    });

    it('should handle files without assertions', async () => {
      // フィクスチャファイルのパスを作成（アサーションなし）
      const testContent = `
describe('Test Suite', () => {
  it('should do something', () => {
    const value = 42;
    // No assertions here
  });
});`;
      const tempPath = path.join(__dirname, '../fixtures/no-assertions.test.ts');
      fs.writeFileSync(tempPath, testContent);

      try {
        const fileContent = await helper.parseFile(tempPath);
        const assertions = helper.findAssertions(fileContent);
        
        expect(assertions).toEqual([]);
      } finally {
        fs.unlinkSync(tempPath);
      }
    });
  });

  describe('findTestStructures', () => {
    it('should identify test structure elements', async () => {
      const filePath = getFixturePath('sample.test.ts');
      const fileContent = await helper.parseFile(filePath);

      const structures = helper.findTestStructures(fileContent);
      
      expect(structures.describes.length).toBeGreaterThan(0);
      expect(structures.tests.length).toBeGreaterThan(0);
      
      structures.describes.forEach(desc => {
        expect(desc.location.line).toBeGreaterThan(0);
        expect(desc.name).toBeDefined();
      });

      structures.tests.forEach(test => {
        expect(test.location.line).toBeGreaterThan(0);
        expect(test.name).toBeDefined();
      });
    });

    it('should detect nested describe blocks', async () => {
      const testContent = `
describe('Outer Suite', () => {
  describe('Inner Suite', () => {
    it('should work', () => {
      expect(true).toBe(true);
    });
  });
});`;
      const tempPath = path.join(__dirname, '../fixtures/nested.test.ts');
      fs.writeFileSync(tempPath, testContent);

      try {
        const fileContent = await helper.parseFile(tempPath);
        const structures = helper.findTestStructures(fileContent);
        
        expect(structures.describes.length).toBe(2);
        expect(structures.describes[0].name).toContain('Outer Suite');
        expect(structures.describes[1].name).toContain('Inner Suite');
      } finally {
        fs.unlinkSync(tempPath);
      }
    });
  });

  describe('analyzeComplexity', () => {
    it('should calculate cyclomatic complexity', async () => {
      const testContent = `
it('complex test', () => {
  if (condition1) {
    if (condition2) {
      doSomething();
    } else {
      doSomethingElse();
    }
  }
  
  for (let i = 0; i < 10; i++) {
    processItem(i);
  }
  
  switch (value) {
    case 'a':
      return 1;
    case 'b':
      return 2;
    default:
      return 0;
  }
});`;
      const tempPath = path.join(__dirname, '../fixtures/complex.test.ts');
      fs.writeFileSync(tempPath, testContent);

      try {
        const fileContent = await helper.parseFile(tempPath);
        const complexity = helper.analyzeComplexity(fileContent);
        
        expect(complexity.cyclomatic).toBeGreaterThan(1);
        expect(complexity.cognitive).toBeGreaterThan(0);
        expect(complexity.nesting).toBeGreaterThan(0);
      } finally {
        fs.unlinkSync(tempPath);
      }
    });

    it('should handle simple linear code', async () => {
      const testContent = `
it('simple test', () => {
  const value = 42;
  expect(value).toBe(42);
});`;
      const tempPath = path.join(__dirname, '../fixtures/simple.test.ts');
      fs.writeFileSync(tempPath, testContent);

      try {
        const fileContent = await helper.parseFile(tempPath);
        const complexity = helper.analyzeComplexity(fileContent);
        
        expect(complexity.cyclomatic).toBe(1);
        expect(complexity.cognitive).toBe(0);
        expect(complexity.nesting).toBe(0);
      } finally {
        fs.unlinkSync(tempPath);
      }
    });
  });

  describe('extractImports', () => {
    it('should extract import statements', async () => {
      const testContent = `
import { expect } from '@jest/globals';
import * as fs from 'fs';
import path from 'path';
import { MyClass } from '../src/MyClass';

describe('Test', () => {
  // test code
});`;
      const tempPath = path.join(__dirname, '../fixtures/imports.test.ts');
      fs.writeFileSync(tempPath, testContent);

      try {
        const fileContent = await helper.parseFile(tempPath);
        const imports = helper.extractImports(fileContent);
        
        expect(imports.length).toBe(4);
        expect(imports[0].module).toBe('@jest/globals');
        expect(imports[0].imports).toContain('expect');
        expect(imports[1].module).toBe('fs');
        expect(imports[1].type).toBe('namespace');
        expect(imports[2].module).toBe('path');
        expect(imports[2].type).toBe('default');
        expect(imports[3].module).toBe('../src/MyClass');
        expect(imports[3].imports).toContain('MyClass');
      } finally {
        fs.unlinkSync(tempPath);
      }
    });
  });

  describe('createEvidence', () => {
    it('should create evidence from code location', () => {
      const location: CodeLocation = {
        file: 'test.ts',
        line: 10,
        column: 5
      };
      const code = 'expect(value).toBe(42);';

      const evidence = helper.createEvidence('assertion', 'Strong assertion found', location, code);

      expect(evidence.type).toBe('assertion');
      expect(evidence.description).toBe('Strong assertion found');
      expect(evidence.location).toEqual(location);
      expect(evidence.code).toBe(code);
      expect(evidence.confidence).toBeGreaterThan(0);
    });

    it('should calculate confidence based on evidence strength', () => {
      const location: CodeLocation = {
        file: 'test.ts',
        line: 1,
        column: 1
      };

      const strongEvidence = helper.createEvidence('assertion', 'Exact strong assertion found', location, 'expect(value).toBe(42)');
      const weakEvidence = helper.createEvidence('import', 'Possible weak match', location, 'maybe');

      expect(strongEvidence.confidence).toBeGreaterThan(weakEvidence.confidence);
    });
  });

  describe('calculateFileComplexity', () => {
    it('should calculate overall file complexity metrics', async () => {
      const filePath = getFixturePath('sample.test.ts');
      const metrics = await helper.calculateFileComplexity(filePath);

      expect(metrics.totalLines).toBeGreaterThan(0);
      expect(metrics.codeLines).toBeGreaterThan(0);
      expect(metrics.testCount).toBeGreaterThan(0);
      expect(metrics.assertionCount).toBeGreaterThan(0);
      expect(metrics.avgComplexityPerTest).toBeGreaterThanOrEqual(0);
      expect(metrics.maxNestingDepth).toBeGreaterThanOrEqual(0);
    });
  });
});