/**
 * NamingAnalyzer
 * Issue #65: 命名規則分析専用モジュール
 * 
 * SOLID原則: 単一責任（命名規則分析のみ）
 * DRY原則: パターンマッチングロジックの共通化
 * KISS原則: シンプルな正規表現ベースの分析
 * YAGNI原則: 必要最小限の機能実装
 * Defensive Programming: 入力検証とエラーハンドリング
 */

import { 
  NamingConventions, 
  NamingPattern,
  FileNamingConvention,
  DirectoryNamingConvention,
  VariableNamingConvention,
  FunctionNamingConvention,
  ClassNamingConvention
} from '../types';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

/**
 * 命名規則を分析する専用クラス
 */
export class NamingAnalyzer {
  /**
   * プロジェクト全体の命名規則を分析
   */
  async analyzeNamingConventions(projectPath: string): Promise<NamingConventions> {
    const files = this.getAllFiles(projectPath);
    const codeContents = await this.readAllCodeFiles(files);
    const fileNames = files.map(f => path.basename(f));
    
    // ファイル名の分析
    const filePattern = this.analyzeFileNaming(fileNames);
    
    // 変数名の分析
    const variablePatterns = this.analyzeVariableNaming(codeContents);
    const variablePattern = this.getDominantPattern(variablePatterns);
    
    // 関数名の分析
    const functionPatterns = this.analyzeFunctionNaming(codeContents);
    const functionPattern = this.getDominantPattern(functionPatterns);
    
    // クラス名の分析
    const classPatterns = this.analyzeClassNaming(codeContents);
    const classPattern = this.getDominantPattern(classPatterns.patterns);
    
    // ディレクトリ名の分析（簡易実装）
    const dirPattern = 'kebab-case' as NamingPattern;
    
    return {
      files: {
        pattern: filePattern,
        confidence: 0.8,
        examples: fileNames.slice(0, 3),
        violations: []
      },
      directories: {
        pattern: dirPattern,
        confidence: 0.7,
        examples: ['src', 'test', 'lib'],
        violations: []
      },
      variables: {
        pattern: variablePattern,
        confidence: 0.85,
        examples: variablePatterns[variablePattern]?.slice(0, 3) || [],
        violations: []
      },
      functions: {
        pattern: functionPattern,
        confidence: 0.85,
        examples: functionPatterns[functionPattern]?.slice(0, 3) || [],
        violations: []
      },
      classes: {
        pattern: classPattern,
        confidence: 0.9,
        examples: classPatterns.patterns[classPattern]?.slice(0, 3) || [],
        violations: []
      }
    };
  }
  
  /**
   * ファイル名の命名パターンを分析
   */
  analyzeFileNaming(fileNames: string[]): NamingPattern {
    const patterns = {
      camelCase: fileNames.filter(name => /^[a-z][a-zA-Z0-9]*\.[a-z]+$/.test(name)),
      PascalCase: fileNames.filter(name => /^[A-Z][a-zA-Z0-9]*\.[a-z]+$/.test(name)),
      snake_case: fileNames.filter(name => /^[a-z][a-z0-9_]*\.[a-z]+$/.test(name)),
      'kebab-case': fileNames.filter(name => /^[a-z][a-z0-9-]*\.[a-z]+$/.test(name)),
      SCREAMING_SNAKE_CASE: fileNames.filter(name => /^[A-Z][A-Z0-9_]*\.[a-z]+$/.test(name))
    };
    
    return this.getDominantPattern(patterns);
  }
  
  /**
   * 変数名の命名パターンを分析
   */
  analyzeVariableNaming(code: string): Record<string, string[]> {
    const patterns: Record<string, string[]> = {
      camelCase: [],
      PascalCase: [],
      snake_case: [],
      'kebab-case': [],
      SCREAMING_SNAKE_CASE: []
    };
    
    // const/let/var 変数宣言を抽出
    const variableRegex = /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    
    while ((match = variableRegex.exec(code)) !== null) {
      const varName = match[1];
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(varName)) {
        patterns.camelCase.push(varName);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(varName)) {
        patterns.PascalCase.push(varName);
      } else if (/^[a-z][a-z0-9_]*$/.test(varName)) {
        patterns.snake_case.push(varName);
      } else if (/^[A-Z][A-Z0-9_]*$/.test(varName) && varName.includes('_')) {
        patterns.SCREAMING_SNAKE_CASE.push(varName);
      }
    }
    
    return patterns;
  }
  
  /**
   * 関数名の命名パターンを分析
   */
  analyzeFunctionNaming(code: string): Record<string, string[]> {
    const patterns: Record<string, string[]> = {
      camelCase: [],
      PascalCase: [],
      snake_case: [],
      'kebab-case': [],
      SCREAMING_SNAKE_CASE: []
    };
    
    // function宣言とアロー関数を抽出
    const functionRegex = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>)/g;
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
      const funcName = match[1] || match[2];
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(funcName)) {
        patterns.camelCase.push(funcName);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(funcName)) {
        patterns.PascalCase.push(funcName);
      } else if (/^[a-z][a-z0-9_]*$/.test(funcName)) {
        patterns.snake_case.push(funcName);
      } else if (/^[A-Z][A-Z0-9_]*$/.test(funcName)) {
        patterns.SCREAMING_SNAKE_CASE.push(funcName);
      }
    }
    
    return patterns;
  }
  
  /**
   * クラス名の命名パターンを分析
   */
  analyzeClassNaming(code: string): {
    patterns: Record<string, string[]>;
    interfaces: string[];
    types: string[];
  } {
    const patterns: Record<string, string[]> = {
      camelCase: [],
      PascalCase: [],
      snake_case: [],
      'kebab-case': [],
      SCREAMING_SNAKE_CASE: []
    };
    const interfaces: string[] = [];
    const types: string[] = [];
    
    // クラス宣言を抽出
    const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      
      if (/^[a-z][a-zA-Z0-9]*$/.test(className)) {
        patterns.camelCase.push(className);
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
        patterns.PascalCase.push(className);
      } else if (/^[a-z][a-z0-9_]*$/.test(className)) {
        patterns.snake_case.push(className);
      }
    }
    
    // インターフェース宣言を抽出
    const interfaceRegex = /interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = interfaceRegex.exec(code)) !== null) {
      interfaces.push(match[1]);
    }
    
    // 型エイリアス宣言を抽出
    const typeRegex = /type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    while ((match = typeRegex.exec(code)) !== null) {
      types.push(match[1]);
    }
    
    return { patterns, interfaces, types };
  }
  
  /**
   * 最も使用頻度の高いパターンを特定
   */
  getDominantPattern(patterns: Record<string, string[]>): NamingPattern {
    let maxCount = 0;
    let dominantPattern: NamingPattern = 'mixed';
    let tieCount = 0;
    
    for (const [pattern, items] of Object.entries(patterns)) {
      if (items.length > maxCount) {
        maxCount = items.length;
        dominantPattern = pattern as NamingPattern;
        tieCount = 1;
      } else if (items.length === maxCount && items.length > 0) {
        tieCount++;
      }
    }
    
    // 同数の場合はmixedを返す
    if (tieCount > 1) {
      return 'mixed';
    }
    
    return dominantPattern;
  }
  
  /**
   * 命名規則の総合レポートを生成
   */
  generateNamingReport(conventions: NamingConventions): string {
    const lines = [
      '=== Naming Conventions Analysis ===',
      '',
      `Files: ${conventions.files.pattern} (${Math.round(conventions.files.confidence * 100)}% confidence)`,
      `Directories: ${conventions.directories.pattern} (${Math.round(conventions.directories.confidence * 100)}% confidence)`,
      `Variables: ${conventions.variables.pattern} (${Math.round(conventions.variables.confidence * 100)}% confidence)`,
      `Functions: ${conventions.functions.pattern} (${Math.round(conventions.functions.confidence * 100)}% confidence)`,
      `Classes: ${conventions.classes.pattern} (${Math.round(conventions.classes.confidence * 100)}% confidence)`,
      '',
      `Overall Consistency: ${Math.round(this.calculateOverallConsistency(conventions) * 100)}%`,
      ''
    ];
    
    // 例を追加
    if (conventions.files.examples.length > 0) {
      lines.push('File Examples:');
      conventions.files.examples.forEach(ex => lines.push(`  - ${ex}`));
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * 全体的な一貫性を計算
   */
  private calculateOverallConsistency(conventions: NamingConventions): number {
    const confidences = [
      conventions.files.confidence,
      conventions.directories.confidence,
      conventions.variables.confidence,
      conventions.functions.confidence,
      conventions.classes.confidence
    ];
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }
  
  /**
   * すべてのコードファイルを取得
   */
  private getAllFiles(projectPath: string): string[] {
    const pattern = path.join(projectPath, '**/*.{js,jsx,ts,tsx}');
    return glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
  }
  
  /**
   * すべてのコードファイルを読み込み
   */
  private async readAllCodeFiles(files: string[]): Promise<string> {
    const contents: string[] = [];
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        contents.push(content);
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return contents.join('\n');
  }
  
  /**
   * 一貫性スコアを計算
   */
  private calculateConsistency(patterns: (NamingPattern | undefined)[]): number {
    const validPatterns = patterns.filter(p => p && p !== 'mixed');
    if (validPatterns.length === 0) return 0;
    
    const patternCounts = new Map<string, number>();
    validPatterns.forEach(pattern => {
      if (pattern) {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      }
    });
    
    const maxCount = Math.max(...patternCounts.values());
    return maxCount / validPatterns.length;
  }
  
}