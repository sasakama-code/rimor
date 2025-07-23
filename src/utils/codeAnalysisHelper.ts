import * as fs from 'fs/promises';
import { Evidence, CodeLocation } from '../core/types';

export interface ParsedFile {
  filePath: string;
  content: string;
  lines: string[];
}

export interface PatternMatch {
  match: string;
  line: number;
  column: number;
  context: string;
}

export interface AssertionInfo {
  type: 'expect' | 'assert' | 'should';
  location: CodeLocation;
  content: string;
  strength: 'weak' | 'medium' | 'strong';
}

export interface TestStructure {
  describes: Array<{
    name: string;
    location: CodeLocation;
    nested: boolean;
  }>;
  tests: Array<{
    name: string;
    location: CodeLocation;
    type: 'it' | 'test' | 'fit' | 'xit';
  }>;
  hooks: Array<{
    type: 'beforeEach' | 'afterEach' | 'beforeAll' | 'afterAll';
    location: CodeLocation;
  }>;
}

export interface ComplexityMetrics {
  cyclomatic: number;
  cognitive: number;
  nesting: number;
}

export interface ImportInfo {
  module: string;
  imports: string[];
  type: 'named' | 'default' | 'namespace' | 'side-effect';
  location: CodeLocation;
}

export interface FileComplexityMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  testCount: number;
  assertionCount: number;
  avgComplexityPerTest: number;
  maxNestingDepth: number;
}

export class CodeAnalysisHelper {
  /**
   * ファイルを解析して構造化データに変換
   */
  async parseFile(filePath: string): Promise<ParsedFile> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    return {
      filePath,
      content,
      lines
    };
  }

  /**
   * 正規表現パターンを使用してコード内のパターンを検索
   */
  findPatterns(parsedFile: ParsedFile, pattern: RegExp): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const lines = parsedFile.lines;

    lines.forEach((line, lineIndex) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          match: match[0],
          line: lineIndex + 1,
          column: match.index,
          context: line.trim()
        });
        
        if (!pattern.global) break;
      }
    });

    return matches;
  }

  /**
   * アサーション文を検出・分析
   */
  findAssertions(parsedFile: ParsedFile): AssertionInfo[] {
    const assertions: AssertionInfo[] = [];
    const lines = parsedFile.lines;

    const assertionPatterns = [
      { type: 'expect' as const, pattern: /expect\s*\([^)]+\)\s*\.\s*(\w+)/g },
      { type: 'assert' as const, pattern: /assert\s*\.\s*(\w+)\s*\(/g },
      { type: 'should' as const, pattern: /should\s*\.\s*(\w+)/g }
    ];

    lines.forEach((line, lineIndex) => {
      assertionPatterns.forEach(({ type, pattern }) => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(line)) !== null) {
          const assertionMethod = match[1];
          const strength = this.evaluateAssertionStrength(assertionMethod, line);
          
          assertions.push({
            type,
            location: {
              file: parsedFile.filePath,
              line: lineIndex + 1,
              column: match.index
            },
            content: match[0],
            strength
          });
        }
      });
    });

    return assertions;
  }

  /**
   * テスト構造（describe, it, フックなど）を解析
   */
  findTestStructures(parsedFile: ParsedFile): TestStructure {
    const structure: TestStructure = {
      describes: [],
      tests: [],
      hooks: []
    };

    const lines = parsedFile.lines;
    let nestingLevel = 0;

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // describe ブロック
      const describeMatch = trimmedLine.match(/describe\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (describeMatch) {
        structure.describes.push({
          name: describeMatch[1],
          location: {
            file: parsedFile.filePath,
            line: lineIndex + 1,
            column: line.indexOf('describe')
          },
          nested: nestingLevel > 0
        });
      }

      // テストケース
      const testMatch = trimmedLine.match(/(it|test|fit|xit)\s*\(\s*['"`]([^'"`]+)['"`]/);
      if (testMatch) {
        structure.tests.push({
          name: testMatch[2],
          location: {
            file: parsedFile.filePath,
            line: lineIndex + 1,
            column: line.indexOf(testMatch[1])
          },
          type: testMatch[1] as 'it' | 'test' | 'fit' | 'xit'
        });
      }

      // フック
      const hookMatch = trimmedLine.match(/(beforeEach|afterEach|beforeAll|afterAll)\s*\(/);
      if (hookMatch) {
        structure.hooks.push({
          type: hookMatch[1] as 'beforeEach' | 'afterEach' | 'beforeAll' | 'afterAll',
          location: {
            file: parsedFile.filePath,
            line: lineIndex + 1,
            column: line.indexOf(hookMatch[1])
          }
        });
      }

      // ネストレベル追跡
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      nestingLevel += openBraces - closeBraces;
    });

    return structure;
  }

  /**
   * コードの複雑度を分析
   */
  analyzeComplexity(parsedFile: ParsedFile): ComplexityMetrics {
    const content = parsedFile.content;
    
    // サイクロマティック複雑度（条件分岐・ループの数 + 1）
    const cyclomaticPatterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bswitch\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*.*\s*:/g // 三項演算子
    ];

    let cyclomaticComplexity = 1; // 基本パス
    cyclomaticPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
    });

    // 認知的複雑度（ネストの深さを考慮）
    let cognitiveComplexity = 0;
    let maxNesting = 0;
    let currentNesting = 0;

    const lines = parsedFile.lines;
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // ネストレベルの増加
      if (trimmedLine.match(/\b(if|for|while|switch|try|catch)\s*\(/)) {
        currentNesting++;
        cognitiveComplexity += currentNesting;
        maxNesting = Math.max(maxNesting, currentNesting);
      }

      // ネストレベルの減少
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      if (closeBraces > openBraces) {
        currentNesting = Math.max(0, currentNesting - (closeBraces - openBraces));
      }
    });

    return {
      cyclomatic: cyclomaticComplexity,
      cognitive: cognitiveComplexity,
      nesting: maxNesting
    };
  }

  /**
   * インポート文を抽出・解析
   */
  extractImports(parsedFile: ParsedFile): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const lines = parsedFile.lines;

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('import')) {
        const location: CodeLocation = {
          file: parsedFile.filePath,
          line: lineIndex + 1,
          column: 0
        };

        // 名前付きインポート: import { a, b } from 'module'
        const namedMatch = trimmedLine.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"`]([^'"`]+)['"`]/);
        if (namedMatch) {
          const importNames = namedMatch[1].split(',').map(name => name.trim());
          imports.push({
            module: namedMatch[2],
            imports: importNames,
            type: 'named',
            location
          });
          return;
        }

        // 名前空間インポート: import * as name from 'module'
        const namespaceMatch = trimmedLine.match(/import\s*\*\s*as\s+(\w+)\s*from\s*['"`]([^'"`]+)['"`]/);
        if (namespaceMatch) {
          imports.push({
            module: namespaceMatch[2],
            imports: [namespaceMatch[1]],
            type: 'namespace',
            location
          });
          return;
        }

        // デフォルトインポート: import name from 'module'
        const defaultMatch = trimmedLine.match(/import\s+(\w+)\s*from\s*['"`]([^'"`]+)['"`]/);
        if (defaultMatch) {
          imports.push({
            module: defaultMatch[2],
            imports: [defaultMatch[1]],
            type: 'default',
            location
          });
          return;
        }

        // サイドエフェクトインポート: import 'module'
        const sideEffectMatch = trimmedLine.match(/import\s*['"`]([^'"`]+)['"`]/);
        if (sideEffectMatch) {
          imports.push({
            module: sideEffectMatch[1],
            imports: [],
            type: 'side-effect',
            location
          });
        }
      }
    });

    return imports;
  }

  /**
   * エビデンスオブジェクトを作成
   */
  createEvidence(type: string, description: string, location: CodeLocation, code: string): Evidence {
    const confidence = this.calculateEvidenceConfidence(type, description, code);
    
    return {
      type,
      description,
      location,
      code,
      confidence
    };
  }

  /**
   * ファイル全体の複雑度メトリクスを計算
   */
  async calculateFileComplexity(filePath: string): Promise<FileComplexityMetrics> {
    const parsedFile = await this.parseFile(filePath);
    const structure = this.findTestStructures(parsedFile);
    const assertions = this.findAssertions(parsedFile);
    const complexity = this.analyzeComplexity(parsedFile);

    const totalLines = parsedFile.lines.length;
    const commentLines = parsedFile.lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    }).length;
    const codeLines = parsedFile.lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    }).length;

    const testCount = structure.tests.length;
    const assertionCount = assertions.length;
    const avgComplexityPerTest = testCount > 0 ? complexity.cyclomatic / testCount : 0;

    return {
      totalLines,
      codeLines,
      commentLines,
      testCount,
      assertionCount,
      avgComplexityPerTest,
      maxNestingDepth: complexity.nesting
    };
  }

  /**
   * アサーションの強度を評価
   */
  private evaluateAssertionStrength(method: string, context: string): 'weak' | 'medium' | 'strong' {
    const strongMethods = ['toBe', 'toEqual', 'toStrictEqual', 'toMatchObject', 'toHaveLength'];
    const mediumMethods = ['toBeTruthy', 'toBeFalsy', 'toMatch', 'toContain', 'toBeCloseTo'];
    const weakMethods = ['toBeDefined', 'toBeUndefined', 'toBeNull'];

    if (strongMethods.includes(method)) {
      return 'strong';
    } else if (mediumMethods.includes(method)) {
      return 'medium';
    } else if (weakMethods.includes(method)) {
      return 'weak';
    }

    // コンテキストベースの評価
    if (context.includes('toThrow') || context.includes('rejects') || context.includes('resolves')) {
      return 'strong';
    }

    return 'medium';
  }

  /**
   * エビデンスの信頼度を計算
   */
  private calculateEvidenceConfidence(type: string, description: string, code: string): number {
    let baseConfidence = 0.7;

    // タイプベースの調整
    const typeMultipliers: Record<string, number> = {
      'assertion': 0.9,
      'pattern': 0.8,
      'structure': 0.7,
      'import': 0.6
    };

    if (typeMultipliers[type]) {
      baseConfidence *= typeMultipliers[type];
    }

    // 説明の詳細度による調整
    if (description.includes('exact') || description.includes('strong')) {
      baseConfidence *= 1.2;
    } else if (description.includes('possible') || description.includes('weak')) {
      baseConfidence *= 0.8;
    }

    // コードの複雑さによる調整
    const codeComplexity = code.split(/[.(){}[\]]/).length;
    if (codeComplexity > 5) {
      baseConfidence *= 1.05;
    }

    return Math.min(1.0, Math.max(0.1, baseConfidence));
  }
}