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
      
      // 7. 型注釈から用語抽出（TypeScript）
      const typeTerms = this.extractTypeAnnotations(code);
      extractedTerms.push(...typeTerms);
      
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
      
      // キャメルケースを分割して個別の用語を生成
      const words = this.splitCamelCase(className);
      if (words.length > 1) {
        words.forEach(word => {
          if (this.isSignificantName(word)) {
            const term = this.createTermFromName(word, 'core-business');
            if (term) {
              terms.push(term);
            }
          }
        });
      }
      
      // 元のクラス名も用語として追加
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
      
      // キャメルケースを分割して個別の用語を生成
      const words = this.splitCamelCase(interfaceName);
      if (words.length > 1) {
        words.forEach(word => {
          if (this.isSignificantName(word)) {
            const term = this.createTermFromName(word, 'technical');
            if (term) {
              terms.push(term);
            }
          }
        });
      }
      
      // 元のインターフェース名も用語として追加
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
          // キャメルケースを分割して個別の用語を生成
          const words = this.splitCamelCase(functionName);
          if (words.length > 1) {
            words.forEach(word => {
              if (this.isSignificantName(word)) {
                const term = this.createTermFromName(word, 'technical');
                if (term) {
                  terms.push(term);
                }
              }
            });
          }
          
          // 元の関数名も用語として追加
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
    
    // 変数宣言パターン
    const variablePatterns = [
      /(?:const|let|var)\s+([a-zA-Z][a-zA-Z0-9_]*)/g,
      // 型注釈付き変数
      /([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*([A-Z][a-zA-Z0-9_]*)/g,
      // 分構造化パターン
      /{\s*([^}]+)\s*}\s*=\s*require/g,
      /{\s*([^}]+)\s*}\s*from/g
    ];
    
    variablePatterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (index === 1) {
          // 型注釈の場合は型名も抽出
          const variableName = match[1];
          const typeName = match[2];
          
          [variableName, typeName].forEach(name => {
            if (this.isSignificantName(name)) {
              const words = this.splitCamelCase(name);
              if (words.length > 1) {
                words.forEach(word => {
                  if (this.isSignificantName(word)) {
                    const term = this.createTermFromName(word, 'domain-specific');
                    if (term) {
                      terms.push(term);
                    }
                  }
                });
              }
              
              const term = this.createTermFromName(name, 'domain-specific');
              if (term) {
                terms.push(term);
              }
            }
          });
        } else if (index === 2 || index === 3) {
          // 分構造化パターンの場合
          const destructuredNames = match[1].split(',').map(name => name.trim());
          destructuredNames.forEach(name => {
            if (this.isSignificantName(name)) {
              const words = this.splitCamelCase(name);
              if (words.length > 1) {
                words.forEach(word => {
                  if (this.isSignificantName(word)) {
                    const term = this.createTermFromName(word, 'domain-specific');
                    if (term) {
                      terms.push(term);
                    }
                  }
                });
              }
              
              const term = this.createTermFromName(name, 'domain-specific');
              if (term) {
                terms.push(term);
              }
            }
          });
        } else {
          // 通常の変数宣言
          const variableName = match[1];
          if (this.isSignificantName(variableName)) {
            const words = this.splitCamelCase(variableName);
            if (words.length > 1) {
              words.forEach(word => {
                if (this.isSignificantName(word)) {
                  const term = this.createTermFromName(word, 'domain-specific');
                  if (term) {
                    terms.push(term);
                  }
                }
              });
            }
            
            const term = this.createTermFromName(variableName, 'domain-specific');
            if (term) {
              terms.push(term);
            }
          }
        }
      }
    });
    
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
      /import\s+\*\s+as\s+([A-Z][a-zA-Z0-9_]*)\s+from/g,
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
            // キャメルケースを分割して個別の用語を生成
            const words = this.splitCamelCase(moduleName);
            if (words.length > 1) {
              words.forEach(word => {
                if (this.isSignificantName(word)) {
                  const term = this.createTermFromName(word, 'integration');
                  if (term) {
                    terms.push(term);
                  }
                }
              });
            }
            
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
              // キャメルケースを分割して個別の用語を生成
              const words = this.splitCamelCase(name);
              if (words.length > 1) {
                words.forEach(word => {
                  if (this.isSignificantName(word)) {
                    const term = this.createTermFromName(word, 'integration');
                    if (term) {
                      terms.push(term);
                    }
                  }
                });
              }
              
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
   * 型注釈から用語抽出（TypeScript）
   */
  private extractTypeAnnotations(code: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    
    // 関数パラメータと戻り値の型注釈
    const functionTypePatterns = [
      // パラメータや変数の型注釈: param: Type
      /(\w+)\s*:\s*([A-Z][a-zA-Z0-9_]*)/g,
      // 配列型: param: Type[]
      /(\w+)\s*:\s*([A-Z][a-zA-Z0-9_]*)\[\]/g,
      // Promise<Type>, Array<Type> などのジェネリック型
      /(?:Promise|Array)<([A-Z][a-zA-Z0-9_]*)>/g,
      // 戻り値型: ): Type
      /\)\s*:\s*([A-Z][a-zA-Z0-9_]*)/g,
      // 戻り値配列型: ): Type[]
      /\)\s*:\s*([A-Z][a-zA-Z0-9_]*)\[\]/g,
      // プロパティの型注釈: private prop: Type
      /(?:private|public|protected)?\s*\w+\s*:\s*([A-Z][a-zA-Z0-9_]*)/g,
      // プロパティの配列型: private prop: Type[]
      /(?:private|public|protected)?\s*\w+\s*:\s*([A-Z][a-zA-Z0-9_]*)\[\]/g
    ];
    
    functionTypePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const typeName = match[1] || match[2];
        if (typeName && this.isSignificantName(typeName)) {
          // キャメルケースを分割して個別の用語を生成
          const words = this.splitCamelCase(typeName);
          
          if (words.length > 1) {
            words.forEach(word => {
              if (this.isSignificantName(word)) {
                // 単数形も生成
                const singularWord = this.toSingular(word);
                if (singularWord !== word && this.isSignificantName(singularWord)) {
                  const singularTerm = this.createTermFromName(singularWord, 'technical');
                  if (singularTerm) {
                    terms.push(singularTerm);
                  }
                }
                
                const term = this.createTermFromName(word, 'technical');
                if (term) {
                  terms.push(term);
                }
              }
            });
          }
          
          // 元の型名も用語として追加
          const term = this.createTermFromName(typeName, 'technical');
          if (term) {
            terms.push(term);
          }
        }
      }
    });
    
    // interface や type 定義
    const typeDefinitionPatterns = [
      /type\s+([A-Z][a-zA-Z0-9_]*)/g,
      /interface\s+([A-Z][a-zA-Z0-9_]*)/g
    ];
    
    typeDefinitionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const typeName = match[1];
        if (this.isSignificantName(typeName)) {
          // キャメルケースを分割して個別の用語を生成
          const words = this.splitCamelCase(typeName);
          if (words.length > 1) {
            words.forEach(word => {
              if (this.isSignificantName(word)) {
                const term = this.createTermFromName(word, 'technical');
                if (term) {
                  terms.push(term);
                }
              }
            });
          }
          
          // 元の型名も用語として追加
          const term = this.createTermFromName(typeName, 'technical');
          if (term) {
            terms.push(term);
          }
        }
      }
    });
    
    return terms;
  }

  /**
   * テキストから用語抽出
   */
  private extractTermsFromText(text: string): DomainTerm[] {
    const terms: DomainTerm[] = [];
    
    // 重要なドメイン用語キーワード
    const importantKeywords = [
      'User', 'Authentication', 'Login', 'Logout', 'Password', 'Reset',
      'Payment', 'Processing', 'Transaction', 'Subscription', 'Credit', 'Card',
      'Email', 'Notification', 'Service', 'Welcome', 'Send',
      'Product', 'Order', 'Account', 'Profile', 'Customer',
      'Validation', 'Handler', 'Controller', 'Manager', 'Repository'
    ];
    
    // キーワードベースの抽出
    importantKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(text)) {
        const term = this.createTermFromName(keyword, 'domain-specific');
        if (term) {
          terms.push(term);
        }
      }
    });
    
    // 大文字始まりの単語や重要なキーワードを抽出
    const wordPattern = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
    let match;
    
    while ((match = wordPattern.exec(text)) !== null) {
      const word = match[1].trim();
      if (this.isSignificantName(word) && word.length > 2) {
        // キャメルケースの場合、分割して個別の用語も追加
        const words = this.splitCamelCase(word);
        if (words.length > 1) {
          words.forEach(w => {
            if (this.isSignificantName(w)) {
              const term = this.createTermFromName(w, 'domain-specific');
              if (term) {
                terms.push(term);
              }
            }
          });
        }
        
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
      // 基本的なDomainTermを作成（元の名前を保持）
      const term = DomainTermManager.createTerm({
        id: `extracted-${name.toLowerCase()}`,
        term: name, // 元の名前を保持
        definition: `Domain term extracted from code analysis: ${name}. This term represents a significant concept or entity identified during static code analysis.`,
        category: category as any,
        importance: this.determineImportance(name),
        aliases: this.generateAliases(name),
        examples: [{
          code: `// Example usage of ${name}`,
          description: `Code example showing ${name} usage in the application`
        }],
        relatedPatterns: [this.generatePattern(name)],
        testRequirements: [`Test for ${name}`]
      });
      
      return term;
    } catch (error) {
      // エラーの詳細をログ出力（デバッグ用）
      console.warn(`Failed to create term for "${name}" in category "${category}":`, error);
      return null;
    }
  }

  /**
   * キャメルケースを単語に分割
   */
  private splitCamelCase(name: string): string[] {
    return name.split(/(?=[A-Z])/)
      .filter(word => word.length > 0)
      .map(word => this.capitalizeFirst(word));
  }

  /**
   * 単語の最初の文字を大文字にする
   */
  private capitalizeFirst(word: string): string {
    if (!word || word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /**
   * 複数形から単数形への変換（簡易版）
   */
  private toSingular(word: string): string {
    if (!word || word.length < 4) return word;
    
    const lowerWord = word.toLowerCase();
    
    // 基本的な複数形パターン
    if (lowerWord.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    } else if (lowerWord.endsWith('ves')) {
      return word.slice(0, -3) + 'f';
    } else if (lowerWord.endsWith('oes')) {
      return word.slice(0, -2);
    } else if (lowerWord.endsWith('ses') || lowerWord.endsWith('ches') || lowerWord.endsWith('shes')) {
      return word.slice(0, -2);
    } else if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && !lowerWord.endsWith('us')) {
      return word.slice(0, -1);
    }
    
    return word;
  }

  /**
   * エイリアス生成
   */
  private generateAliases(name: string): string[] {
    const aliasSet = new Set<string>();
    
    // キャメルケース（先頭小文字）
    if (name.length > 0) {
      const camelCase = name.charAt(0).toLowerCase() + name.slice(1);
      if (camelCase !== name) {
        aliasSet.add(camelCase);
      }
    }
    
    // 完全小文字版
    const lowerCase = name.toLowerCase();
    if (lowerCase !== name) {
      aliasSet.add(lowerCase);
    }
    
    // スネークケース版
    const snakeCase = this.toSnakeCase(name);
    if (snakeCase !== name && snakeCase !== lowerCase) {
      aliasSet.add(snakeCase);
    }
    
    // 短縮形
    if (name.length > 6) {
      const abbreviated = name.substring(0, 4);
      if (abbreviated !== name && abbreviated !== lowerCase) {
        aliasSet.add(abbreviated);
      }
    }
    
    return Array.from(aliasSet);
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
    const commonWords = ['app', 'test', 'temp', 'data', 'obj', 'str', 'num', 'bool', 'arr'];
    const reservedWords = ['function', 'class', 'interface', 'const', 'let', 'var', 'import', 'export'];
    
    // 技術的な略語（数字を含む）を許可
    const technicalAbbreviations = /^(E2E|I18N|A11Y|B2B|B2C|P2P|API|HTTP|HTTPS|REST|GraphQL|OAuth|JWT)$/i;
    
    // ドメイン重要語（一般的だがドメインで重要な意味を持つ）
    const domainImportantWords = ['Item', 'User', 'Order', 'Product', 'Service', 'Manager', 'Handler'];
    
    if (technicalAbbreviations.test(name)) {
      return true;
    }
    
    if (domainImportantWords.includes(name)) {
      return true;
    }
    
    return name.length >= 3 && 
           !commonWords.includes(name.toLowerCase()) &&
           !reservedWords.includes(name.toLowerCase()) &&
           !/^\d+$/.test(name); // 純粋な数字のみを除外（数字を含む単語は許可）
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
   * 重複除去（大文字小文字を区別し、より重要な用語を優先）
   */
  private removeDuplicates(terms: DomainTerm[]): DomainTerm[] {
    const seen = new Map<string, DomainTerm>();
    
    terms.forEach(term => {
      const lowerKey = term.term.toLowerCase();
      const existingTerm = seen.get(lowerKey);
      
      if (!existingTerm) {
        // 新しい用語なので追加
        seen.set(lowerKey, term);
      } else {
        // 既存の用語がある場合、より重要なものを優先
        const shouldReplace = this.shouldReplaceTerm(existingTerm, term);
        if (shouldReplace) {
          seen.set(lowerKey, term);
        }
      }
    });
    
    return Array.from(seen.values());
  }

  /**
   * 用語を置き換えるべきかどうかを判定
   */
  private shouldReplaceTerm(existing: DomainTerm, candidate: DomainTerm): boolean {
    // 大文字で始まる用語を優先（クラス名、型名など）
    const existingStartsUpper = /^[A-Z]/.test(existing.term);
    const candidateStartsUpper = /^[A-Z]/.test(candidate.term);
    
    if (!existingStartsUpper && candidateStartsUpper) {
      return true; // 候補の方が大文字で始まる場合は置き換え
    }
    
    if (existingStartsUpper && !candidateStartsUpper) {
      return false; // 既存が大文字で始まる場合は置き換えない
    }
    
    // 重要度が高い方を優先
    const importanceOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const existingImportance = importanceOrder[existing.importance] || 0;
    const candidateImportance = importanceOrder[candidate.importance] || 0;
    
    if (candidateImportance > existingImportance) {
      return true;
    }
    
    // カテゴリでの優先順位（技術的なもの > ビジネス的なもの）
    const categoryOrder: Record<string, number> = { 'technical': 3, 'core-business': 2, 'domain-specific': 1, 'integration': 1 };
    const existingCategory = categoryOrder[existing.category] || 0;
    const candidateCategory = categoryOrder[candidate.category] || 0;
    
    return candidateCategory > existingCategory;
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

  /**
   * 用語をカテゴリ別に分類
   */
  categorizeTerms(terms: DomainTerm[]): { [category: string]: DomainTerm[] } {
    const categorized: { [category: string]: DomainTerm[] } = {};
    
    terms.forEach(term => {
      const category = term.category;
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(term);
    });
    
    return categorized;
  }

  /**
   * 用語から関連パターンを生成
   */
  generateRelatedPatterns(term: string): string[] {
    if (!term || typeof term !== 'string') {
      return [];
    }

    const patterns: string[] = [];
    
    // 基本パターン
    patterns.push(term); // 元の文字列
    
    // キャメルケース（先頭小文字）
    if (term.length > 0) {
      const camelCase = term.charAt(0).toLowerCase() + term.slice(1);
      if (camelCase !== term) {
        patterns.push(camelCase);
      }
    }
    
    patterns.push(this.toSnakeCase(term)); // スネークケース
    
    // 完全小文字版（短い単語の場合も含む）
    patterns.push(term.toLowerCase());
    
    // キャメルケース分割してパターン生成
    const words = this.splitCamelCase(term);
    if (words.length > 1) {
      // 個別の単語
      words.forEach(word => {
        if (word.length > 2) {
          patterns.push(word);
          patterns.push(word.toLowerCase());
        }
      });
      
      // 正規表現パターン
      const regexPattern = words.join('.*');
      patterns.push(regexPattern);
      patterns.push(regexPattern.toLowerCase());
    }
    
    // 重複除去
    return [...new Set(patterns)];
  }

  /**
   * コンテキストに基づいて重要度を推論
   */
  inferImportance(term: string, context: CodeContext): 'critical' | 'high' | 'medium' | 'low' {
    if (!term || !context) {
      return 'low';
    }

    // ファイルパスベースの判定
    const filePath = context.filePath.toLowerCase();
    
    // テストファイルは低い重要度
    if (filePath.includes('test') || filePath.includes('spec')) {
      return 'low';
    }
    
    // コアディレクトリは高い重要度
    if (filePath.includes('/core/') || filePath.includes('/src/')) {
      // 関数の複雑度を考慮
      const complexFunctions = context.functions?.filter(f => 
        typeof f.complexity === 'number' && f.complexity > 5
      ) || [];
      const domainRelevance = context.domainRelevance || 0;
      
      if (complexFunctions.length > 0 && domainRelevance > 0.8) {
        return 'critical';
      }
      
      if (domainRelevance > 0.6) {
        return 'high';
      }
    }
    
    // ユーティリティファイルは中程度
    if (filePath.includes('util') || filePath.includes('helper')) {
      return 'medium';
    }
    
    // 用語自体の重要度も考慮
    const criticalKeywords = ['service', 'manager', 'controller', 'repository', 'factory'];
    const highKeywords = ['handler', 'processor', 'validator', 'builder', 'gateway'];
    
    const lowerTerm = term.toLowerCase();
    if (criticalKeywords.some(keyword => lowerTerm.includes(keyword))) {
      return context.domainRelevance && context.domainRelevance > 0.7 ? 'critical' : 'high';
    }
    
    if (highKeywords.some(keyword => lowerTerm.includes(keyword))) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * コードから使用例を抽出
   */
  extractExamples(term: string, code: string): { code: string; description: string }[] {
    if (!term || !code) {
      return [];
    }

    const examples: { code: string; description: string }[] = [];
    const lines = code.split('\n');
    
    // 用語を含む行を検索
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 空行やコメント行をスキップ
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
        return;
      }
      
      // 用語が含まれる行を抽出
      if (line.toLowerCase().includes(term.toLowerCase())) {
        let description = '';
        
        // 使用パターンに基づいて説明を生成
        if (line.includes('new ' + term)) {
          description = `${term}のインスタンス作成`;
        } else if (line.includes('import') && line.includes(term)) {
          description = `${term}のインポート`;
        } else if (line.includes('extends') && line.includes(term)) {
          description = `${term}の継承`;
        } else if (line.includes('implements') && line.includes(term)) {
          description = `${term}の実装`;
        } else if (line.includes('(') && line.includes(term)) {
          description = `${term}のメソッド呼び出し`;
        } else {
          description = `${term}の使用例`;
        }
        
        examples.push({
          code: trimmedLine,
          description: description
        });
      }
    });
    
    // 重複を除去し、最大10件に制限
    const uniqueExamples = examples.filter((example, index, self) => 
      self.findIndex(e => e.code === example.code) === index
    );
    
    return uniqueExamples.slice(0, 10);
  }

  /**
   * 用語のカテゴリを推定
   */
  estimateCategory(term: string): string {
    if (!term || typeof term !== 'string') {
      return 'other';
    }

    const lowerTerm = term.toLowerCase();
    
    // 技術的カテゴリ
    const technicalKeywords = [
      'service', 'repository', 'controller', 'middleware', 'database', 'api',
      'handler', 'processor', 'validator', 'builder', 'factory', 'gateway',
      'interface', 'class', 'function', 'method', 'component', 'module'
    ];
    
    // ビジネスカテゴリ
    const businessKeywords = [
      'user', 'customer', 'order', 'product', 'account', 'profile',
      'client', 'vendor', 'supplier', 'employee', 'manager', 'admin'
    ];
    
    // 金融カテゴリ
    const financialKeywords = [
      'payment', 'transaction', 'invoice', 'billing', 'credit', 'debit',
      'money', 'currency', 'price', 'cost', 'fee', 'tax'
    ];
    
    // セキュリティカテゴリ
    const securityKeywords = [
      'authentication', 'authorization', 'token', 'encryption', 'security',
      'auth', 'permission', 'access', 'credential', 'certificate'
    ];
    
    // カテゴリ判定
    if (technicalKeywords.some(keyword => lowerTerm.includes(keyword))) {
      return 'technical';
    }
    
    if (businessKeywords.some(keyword => lowerTerm.includes(keyword))) {
      return 'business';
    }
    
    if (financialKeywords.some(keyword => lowerTerm.includes(keyword))) {
      return 'financial';
    }
    
    if (securityKeywords.some(keyword => lowerTerm.includes(keyword))) {
      return 'security';
    }
    
    return 'other';
  }
}