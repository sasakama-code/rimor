import { DomainTerm, CodeContext } from '../../core/types';
import { DomainTermManager } from '../core/term';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * コードからドメイン用語を抽出するクラス
 */
export class TermExtractor {
  
  /**
   * コードからドメイン用語を抽出
   */
  async extractFromCode(
    code: string, 
    context: CodeContext
  ): Promise<{
    extractedTerms: DomainTerm[];
    confidence: number;
  }> {
    try {
      // 入力検証
      if (!code || typeof code !== 'string') {
        return {
          extractedTerms: [],
          confidence: 0
        };
      }

      const extractedTerms: DomainTerm[] = [];
      
      // 1. クラス名から用語抽出
      const classTerms = this.extractClassNames(code);
      extractedTerms.push(...classTerms);
      
      // 2. インターフェース名から用語抽出
      const interfaceTerms = this.extractInterfaceNames(code);
      extractedTerms.push(...interfaceTerms);
      
      // 3. 関数名から用語抽出
      const functionTerms = this.extractFunctionNames(code);
      extractedTerms.push(...functionTerms);
      
      // 4. 変数名から用語抽出
      const variableTerms = this.extractVariableNames(code);
      extractedTerms.push(...variableTerms);
      
      // 5. インポート名から用語抽出
      const importTerms = this.extractImportNames(code);
      extractedTerms.push(...importTerms);
      
      // 6. コメントから用語抽出
      const commentTerms = this.extractFromComments(code);
      extractedTerms.push(...commentTerms);
      
      // 重複を除去
      const uniqueTerms = this.removeDuplicates(extractedTerms);
      
      // 信頼度計算
      const confidence = this.calculateConfidence(uniqueTerms, code);
      
      return {
        extractedTerms: uniqueTerms,
        confidence
      };
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語抽出に失敗しました');
      return {
        extractedTerms: [],
        confidence: 0
      };
    }
  }

  /**
   * クラス名から用語抽出
   */
  private extractClassNames(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    const classPattern = /class\s+([A-Z][a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = classPattern.exec(code)) !== null) {
      const className = match[1];
      const term = this.createTermFromName(className, 'core-business');
      if (term) {
        terms.push(term);
      }
    }
    
    return terms;
  }

  /**
   * インターフェース名から用語抽出
   */
  private extractInterfaceNames(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    const interfacePattern = /interface\s+([A-Z][a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = interfacePattern.exec(code)) !== null) {
      const interfaceName = match[1];
      const term = this.createTermFromName(interfaceName, 'technical');
      if (term) {
        terms.push(term);
      }
    }
    
    return terms;
  }

  /**
   * 関数名から用語抽出
   */
  private extractFunctionNames(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    // 関数宣言、アロー関数、メソッドなどを検出
    const functionPatterns = [
      /function\s+([a-zA-Z][a-zA-Z0-9_]*)/g,
      /([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*\([^)]*\)\s*=>/g,
      /([a-zA-Z][a-zA-Z0-9_]*)\s*\([^)]*\)\s*{/g,
      /const\s+([a-zA-Z][a-zA-Z0-9_]*)\s*=.*=>/g
    ];
    
    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const functionName = match[1];
        if (this.isSignificantName(functionName)) {
          const term = this.createTermFromName(functionName, 'technical');
          if (term) {
            terms.push(term);
          }
        }
      }
    });
    
    return terms;
  }

  /**
   * 変数名から用語抽出
   */
  private extractVariableNames(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    // 重要な変数名パターン（大文字始まり、重要なキーワード含む）
    const variablePattern = /(?:const|let|var)\s+([A-Z][a-zA-Z0-9_]*|[a-z]*(?:Service|Manager|Handler|Controller|Repository|Factory|Builder|Validator|Processor)[a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = variablePattern.exec(code)) !== null) {
      const variableName = match[1];
      if (this.isSignificantName(variableName)) {
        const term = this.createTermFromName(variableName, 'domain-specific');
        if (term) {
          terms.push(term);
        }
      }
    }
    
    return terms;
  }

  /**
   * インポート名から用語抽出
   */
  private extractImportNames(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    const importPatterns = [
      /import\s*{\s*([^}]+)\s*}\s*from/g,
      /import\s+([A-Z][a-zA-Z0-9_]*)\s+from/g,
      /require\(['"]([^'"]*)['"]\)/g
    ];
    
    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (pattern.source.includes('require')) {
          // require文の場合はモジュール名から抽出
          const modulePath = match[1];
          const moduleName = this.extractModuleName(modulePath);
          if (moduleName && this.isSignificantName(moduleName)) {
            const term = this.createTermFromName(moduleName, 'integration');
            if (term) {
              terms.push(term);
            }
          }
        } else {
          // import文の場合
          const importedNames = match[1].split(',').map(name => name.trim());
          importedNames.forEach(name => {
            if (this.isSignificantName(name)) {
              const term = this.createTermFromName(name, 'integration');
              if (term) {
                terms.push(term);
              }
            }
          });
        }
      }
    });
    
    return terms;
  }

  /**
   * コメントから用語抽出
   */
  private extractFromComments(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    // JSDoc、単行コメント、複数行コメントから重要な用語を抽出
    const commentPattern = /(?:\/\*\*[\s\S]*?\*\/|\/\*[\s\S]*?\*\/|\/\/.*$)/gm;
    let match;
    
    while ((match = commentPattern.exec(code)) !== null) {
      const comment = match[0];
      const commentTerms = this.extractTermsFromText(comment);
      terms.push(...commentTerms);
    }
    
    return terms;
  }

  /**
   * テキストから用語抽出
   */
  private extractTermsFromText(text: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    // 大文字始まりの単語や重要なキーワードを抽出
    const wordPattern = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
    let match;
    
    while ((match = wordPattern.exec(text)) !== null) {
      const word = match[1].trim();
      if (this.isSignificantName(word) && word.length > 2) {
        const term = this.createTermFromName(word, 'domain-specific');
        if (term) {
          terms.push(term);
        }
      }
    }
    
    return terms;
  }

  /**
   * 名前から用語を作成
   */
  private createTermFromName(name: string, category: string): DomainTerm | null {
    try {
      // 名前をキャメルケースから単語に分割
      const words = this.splitCamelCase(name);
      const term = words.join(' ');
      
      // 基本的なDomainTermを作成
      return DomainTermManager.createTerm({
        id: `extracted-${name.toLowerCase()}`,
        term: term,
        definition: `Extracted from code: ${name}`,
        category: category as any,
        importance: this.determineImportance(name),
        aliases: [name, ...this.generateAliases(name)],
        examples: [{
          code: `// Example usage of ${name}`,
          description: `Code example showing ${name} usage`
        }],
        relatedPatterns: [this.generatePattern(name)],
        testRequirements: [`Test for ${term}`]
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * キャメルケースを単語に分割
   */
  private splitCamelCase(name: string): string[] {
    return name.split(/(?=[A-Z])/).filter(word => word.length > 0);
  }

  /**
   * エイリアス生成
   */
  private generateAliases(name: string): string[] {
    const aliases: string[] = [];
    
    // 小文字版
    aliases.push(name.toLowerCase());
    
    // スネークケース版
    aliases.push(this.toSnakeCase(name));
    
    // 短縮形
    if (name.length > 6) {
      aliases.push(name.substring(0, 4));
    }
    
    return aliases;
  }

  /**
   * スネークケースに変換
   */
  private toSnakeCase(name: string): string {
    return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  /**
   * パターン生成
   */
  private generatePattern(name: string): string {
    return `${name.toLowerCase()}.*`;
  }

  /**
   * 重要度判定
   */
  private determineImportance(name: string): 'critical' | 'high' | 'medium' | 'low' {
    const criticalKeywords = ['Service', 'Manager', 'Controller', 'Repository', 'Factory'];
    const highKeywords = ['Handler', 'Processor', 'Validator', 'Builder', 'Gateway'];
    
    if (criticalKeywords.some(keyword => name.includes(keyword))) {
      return 'critical';
    }
    
    if (highKeywords.some(keyword => name.includes(keyword))) {
      return 'high';
    }
    
    if (name.length > 10 || /[A-Z].*[A-Z]/.test(name)) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 有意義な名前かどうかチェック
   */
  private isSignificantName(name: string): boolean {
    // 短すぎる、一般的すぎる名前は除外
    const commonWords = ['app', 'test', 'temp', 'data', 'item', 'obj', 'str', 'num', 'bool', 'arr'];
    const reservedWords = ['function', 'class', 'interface', 'const', 'let', 'var', 'import', 'export'];
    
    return name.length >= 3 && 
           !commonWords.includes(name.toLowerCase()) &&
           !reservedWords.includes(name.toLowerCase()) &&
           !/^\d/.test(name);
  }

  /**
   * モジュール名抽出
   */
  private extractModuleName(modulePath: string): string | null {
    // パスから最後の部分を取得
    const parts = modulePath.split('/');
    const fileName = parts[parts.length - 1];
    
    // 拡張子を除去
    const nameWithoutExt = fileName.replace(/\.(js|ts|json)$/, '');
    
    // ケバブケースをキャメルケースに変換
    const camelCase = nameWithoutExt.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    
    return this.isSignificantName(camelCase) ? camelCase : null;
  }

  /**
   * 重複除去
   */
  private removeDuplicates(terms: DomainTerm[]): DomainTerm[] {
    const seen = new Set<string>();
    return terms.filter(term => {
      const key = term.term.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 信頼度計算
   */
  private calculateConfidence(terms: DomainTerm[], code: string): number {
    if (terms.length === 0) {
      return 0;
    }
    
    const codeLength = code.length;
    const termCount = terms.length;
    
    // コードの長さと抽出された用語数から信頼度を計算
    let confidence = Math.min(termCount / 20, 1.0); // 最大20用語で100%
    
    // コードの複雑さを考慮
    const complexityBonus = Math.min(codeLength / 10000, 0.2); // 最大20%のボーナス
    confidence += complexityBonus;
    
    // 重要な用語が含まれている場合のボーナス
    const importantTerms = terms.filter(term => 
      term.importance === 'critical' || term.importance === 'high'
    );
    const importanceBonus = Math.min(importantTerms.length / 10, 0.3); // 最大30%のボーナス
    confidence += importanceBonus;
    
    return Math.min(confidence, 1.0);
  }
}