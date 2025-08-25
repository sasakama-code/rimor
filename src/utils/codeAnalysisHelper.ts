import * as fs from 'fs';
import * as path from 'path';
import { Evidence, CodeLocation } from '../core/types';

export interface ParsedFile {
  filePath: string;
  content: string;
  lines: string[];
}

export interface Pattern {
  line: number;
  column: number;
  match: string;
}

export interface Assertion {
  type: string;
  location: CodeLocation;
}

export interface TestStructure {
  describes: Array<{ location: CodeLocation; name: string }>;
  tests: Array<{ location: CodeLocation; name: string }>;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  nesting: number;
}

export interface Import {
  module: string;
  type?: string;
  imports?: string[];
}

export interface FileComplexityMetrics {
  totalLines: number;
  codeLines: number;
  testCount: number;
  assertionCount: number;
  avgComplexityPerTest: number;
  maxNestingDepth: number;
}

export class CodeAnalysisHelper {
  async parseFile(filePath: string): Promise<ParsedFile> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    return {
      filePath,
      content,
      lines
    };
  }

  findPatterns(fileContent: ParsedFile, pattern: RegExp): Pattern[] {
    const patterns: Pattern[] = [];
    const lines = fileContent.lines;

    lines.forEach((line, index) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags || 'g');
      
      while ((match = regex.exec(line)) !== null) {
        patterns.push({
          line: index + 1,
          column: match.index,
          match: match[0]
        });
      }
    });

    return patterns;
  }

  findAssertions(fileContent: ParsedFile): Assertion[] {
    const assertions: Assertion[] = [];
    const assertionPatterns = [
      /expect\(/g,
      /assert\./g,
      /should\(/g
    ];

    assertionPatterns.forEach(pattern => {
      const matches = this.findPatterns(fileContent, pattern);
      matches.forEach(match => {
        const type = pattern.source.includes('expect') ? 'expect' :
                     pattern.source.includes('assert') ? 'assert' : 'should';
        
        assertions.push({
          type,
          location: {
            file: fileContent.filePath,
            line: match.line,
            column: match.column
          }
        });
      });
    });

    return assertions;
  }

  findTestStructures(fileContent: ParsedFile): TestStructure {
    const describes: Array<{ location: CodeLocation; name: string }> = [];
    const tests: Array<{ location: CodeLocation; name: string }> = [];

    // Find describe blocks
    const describePattern = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const describeMatches = this.findPatterns(fileContent, describePattern);
    
    describeMatches.forEach(match => {
      const nameMatch = match.match.match(/['"`]([^'"`]+)['"`]/);
      describes.push({
        location: {
          file: fileContent.filePath,
          line: match.line,
          column: match.column
        },
        name: nameMatch ? nameMatch[1] : 'Unknown'
      });
    });

    // Find it/test blocks
    const testPattern = /(it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const testMatches = this.findPatterns(fileContent, testPattern);
    
    testMatches.forEach(match => {
      const nameMatch = match.match.match(/['"`]([^'"`]+)['"`]/);
      tests.push({
        location: {
          file: fileContent.filePath,
          line: match.line,
          column: match.column
        },
        name: nameMatch ? nameMatch[1] : 'Unknown'
      });
    });

    return { describes, tests };
  }

  analyzeComplexity(fileContent: ParsedFile): ComplexityMetrics {
    const content = fileContent.content;
    
    // Count control flow statements for cyclomatic complexity
    const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
    const elseStatements = (content.match(/\belse\s*[{]/g) || []).length;
    const forLoops = (content.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (content.match(/\bwhile\s*\(/g) || []).length;
    const switchCases = (content.match(/\bcase\s+/g) || []).length;
    const ternaryOps = (content.match(/\?[^:]*:/g) || []).length;
    
    const cyclomatic = 1 + ifStatements + elseStatements + forLoops + 
                       whileLoops + switchCases + ternaryOps;

    // Calculate cognitive complexity (simplified)
    const cognitive = ifStatements * 2 + elseStatements + forLoops * 3 + 
                     whileLoops * 3 + switchCases;

    // Calculate nesting depth
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return {
      cyclomatic,
      cognitive,
      nesting: maxNesting
    };
  }

  extractImports(fileContent: ParsedFile): Import[] {
    const imports: Import[] = [];
    const lines = fileContent.lines;

    const importPattern = /^import\s+(.+)\s+from\s+['"`]([^'"`]+)['"`]/;
    
    lines.forEach(line => {
      const match = line.match(importPattern);
      if (match) {
        const importClause = match[1];
        const modulePath = match[2];
        
        const importObj: Import = {
          module: modulePath
        };

        if (importClause.startsWith('{')) {
          // Named imports
          const namedImports = importClause.match(/{([^}]+)}/);
          if (namedImports) {
            importObj.imports = namedImports[1].split(',').map(s => s.trim());
          }
        } else if (importClause.includes('* as')) {
          // Namespace import
          importObj.type = 'namespace';
        } else {
          // Default import
          importObj.type = 'default';
        }

        imports.push(importObj);
      }
    });

    return imports;
  }

  createEvidence(
    type: string,
    description: string,
    location: CodeLocation,
    code: string
  ): Evidence {
    // Calculate confidence based on type and description
    let confidence = 0.5;
    
    if (type === 'assertion' && description.includes('strong')) {
      confidence = 0.9;
    } else if (type === 'assertion' && description.includes('Exact')) {
      confidence = 0.95;
    } else if (type === 'import' && description.includes('weak')) {
      confidence = 0.3;
    }

    return {
      type,
      description,
      location,
      code,
      confidence
    };
  }

  async calculateFileComplexity(filePath: string): Promise<FileComplexityMetrics> {
    const fileContent = await this.parseFile(filePath);
    const structures = this.findTestStructures(fileContent);
    const assertions = this.findAssertions(fileContent);
    const complexity = this.analyzeComplexity(fileContent);
    
    const codeLines = fileContent.lines.filter(line => 
      line.trim() && !line.trim().startsWith('//')
    ).length;

    const avgComplexityPerTest = structures.tests.length > 0 
      ? complexity.cyclomatic / structures.tests.length 
      : 0;

    return {
      totalLines: fileContent.lines.length,
      codeLines,
      testCount: structures.tests.length,
      assertionCount: assertions.length,
      avgComplexityPerTest,
      maxNestingDepth: complexity.nesting
    };
  }
}