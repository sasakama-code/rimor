import * as fs from 'fs';
import * as path from 'path';
import { IPlugin, Issue } from '../core/types';
import { TestPatterns } from '../utils/regexPatterns';
import { RegexHelper } from '../utils/regexHelper';

export class AssertionExistsPlugin implements IPlugin {
  name = 'assertion-exists';
  
  async analyze(filePath: string): Promise<Issue[]> {
    // テストファイル以外はスキップ
    if (!this.isTestFile(filePath)) return [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasAssertions = this.detectAssertions(content);
      
      if (!hasAssertions) {
        return [{
          type: 'missing-assertion',
          severity: 'warning' as const,
          message: `アサーション（expect文など）が見つかりません: ${filePath}`
        }];
      }
      
      return [];
    } catch (error) {
      // ファイル読み込みエラーは無視（MVP: 最小限のエラーハンドリング）
      return [];
    }
  }
  
  private isTestFile(filePath: string): boolean {
    return filePath.includes('.test.') || 
           filePath.includes('.spec.') || 
           filePath.includes('__tests__');
  }
  
  private detectAssertions(content: string): boolean {
    const assertionPatterns = TestPatterns.ALL_ASSERTIONS;
    
    // コメントと文字列を除外して検出
    const cleanContent = this.removeCommentsAndStrings(content);
    return RegexHelper.testAny(assertionPatterns, cleanContent);
  }
  
  private removeCommentsAndStrings(content: string): string {
    // MVP: 基本的なコメント・文字列除去
    // 単行コメント除去
    let cleaned = content.replace(/\/\/.*$/gm, '');
    
    // 複数行コメント除去
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 文字列リテラル除去（シンプルな実装）
    cleaned = cleaned.replace(/"[^"\\]*(\\.[^"\\]*)*"/g, '""');
    cleaned = cleaned.replace(/'[^'\\]*(\\.[^'\\]*)*'/g, "''");
    cleaned = cleaned.replace(/`[^`\\]*(\\.[^`\\]*)*`/g, '``');
    
    return cleaned;
  }
}