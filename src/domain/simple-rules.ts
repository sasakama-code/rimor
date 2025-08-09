/**
 * Simple Domain Rules Engine
 * v0.8.0 - YAML-based rule definitions
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { injectable } from 'inversify';
import { debug } from '../utils/debug';

/**
 * ドメインルール定義
 */
export interface DomainRule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'quality' | 'performance' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  patterns: RulePattern[];
  tags?: string[];
}

/**
 * ルールパターン定義
 */
export interface RulePattern {
  type: 'regex' | 'ast' | 'keyword';
  pattern: string;
  message: string;
  fix?: string;
}

/**
 * ルール評価結果
 */
export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line?: number;
  column?: number;
  fix?: string;
}

/**
 * 簡素化されたドメインルールエンジン
 */
@injectable()
export class SimpleDomainRules {
  private rules: Map<string, DomainRule> = new Map();
  private rulesDirectory: string = path.join(process.cwd(), 'rules');
  
  constructor() {
    this.loadRules();
  }
  
  /**
   * YAMLルールファイルを読み込み
   */
  private loadRules(): void {
    debug.info('Loading domain rules from YAML files');
    
    // デフォルトルールを追加
    this.addDefaultRules();
    
    // カスタムルールディレクトリが存在する場合は読み込み
    if (fs.existsSync(this.rulesDirectory)) {
      const files = fs.readdirSync(this.rulesDirectory)
        .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.rulesDirectory, file), 'utf-8');
          const rules = yaml.load(content) as DomainRule[];
          
          if (Array.isArray(rules)) {
            rules.forEach(rule => this.rules.set(rule.id, rule));
            debug.verbose(`Loaded ${rules.length} rules from ${file}`);
          }
        } catch (error) {
          debug.error(`Failed to load rules from ${file}:`, error);
        }
      }
    }
    
    debug.info(`Total rules loaded: ${this.rules.size}`);
  }
  
  /**
   * デフォルトルールを追加
   */
  private addDefaultRules(): void {
    const defaultRules: DomainRule[] = [
      {
        id: 'auth-test-coverage',
        name: '認証テストカバレッジ',
        description: '認証機能に対する適切なテストカバレッジを確保',
        category: 'security',
        severity: 'error',
        patterns: [
          {
            type: 'keyword',
            pattern: 'auth|login|logout|token',
            message: '認証関連の機能にはセキュリティテストが必要です'
          }
        ],
        tags: ['authentication', 'security']
      },
      {
        id: 'input-validation',
        name: '入力検証',
        description: 'ユーザー入力の適切な検証を確保',
        category: 'security',
        severity: 'warning',
        patterns: [
          {
            type: 'regex',
            pattern: 'req\\.(body|query|params)\\.[a-zA-Z_]+(?!\\s*\\|\\|\\s*[\'"])',
            message: '入力値の検証が不足している可能性があります',
            fix: 'const validated = validateInput(req.${1}.${2});'
          }
        ],
        tags: ['validation', 'security']
      },
      {
        id: 'sql-injection-prevention',
        name: 'SQLインジェクション防止',
        description: 'SQLクエリの安全な構築',
        category: 'security',
        severity: 'error',
        patterns: [
          {
            type: 'regex',
            pattern: 'query\\s*\\(\\s*[\'"`].*\\$\\{.*\\}.*[\'"`]',
            message: 'SQLインジェクションの脆弱性が存在する可能性があります',
            fix: 'パラメータ化されたクエリを使用してください'
          }
        ],
        tags: ['sql', 'injection', 'security']
      },
      {
        id: 'async-error-handling',
        name: '非同期エラーハンドリング',
        description: '非同期処理の適切なエラーハンドリング',
        category: 'quality',
        severity: 'warning',
        patterns: [
          {
            type: 'regex',
            pattern: 'async\\s+\\w+\\s*\\([^)]*\\)\\s*\\{(?![^}]*try)',
            message: '非同期関数にtry-catchが不足しています'
          }
        ],
        tags: ['async', 'error-handling']
      },
      {
        id: 'test-assertion-quality',
        name: 'テストアサーション品質',
        description: 'テストに十分なアサーションが含まれているか確認',
        category: 'quality',
        severity: 'info',
        patterns: [
          {
            type: 'keyword',
            pattern: 'it|test|describe',
            message: 'テストケースには複数のアサーションを含めることを推奨します'
          }
        ],
        tags: ['testing', 'quality']
      }
    ];
    
    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }
  
  /**
   * ファイルに対してルールを評価
   */
  async evaluateFile(filePath: string, content: string): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];
    const lines = content.split('\n');
    
    for (const rule of this.rules.values()) {
      for (const pattern of rule.patterns) {
        const violations = this.evaluatePattern(pattern, content, lines);
        
        violations.forEach(violation => {
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: violation.message,
            file: filePath,
            line: violation.line,
            column: violation.column,
            fix: violation.fix
          });
        });
      }
    }
    
    return results;
  }
  
  /**
   * パターンを評価
   */
  private evaluatePattern(
    pattern: RulePattern,
    content: string,
    lines: string[]
  ): Array<{message: string; line?: number; column?: number; fix?: string}> {
    const violations: Array<{message: string; line?: number; column?: number; fix?: string}> = [];
    
    switch (pattern.type) {
      case 'regex':
        const regex = new RegExp(pattern.pattern, 'gm');
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          const column = this.getColumnNumber(content, match.index);
          
          violations.push({
            message: pattern.message,
            line,
            column,
            fix: pattern.fix
          });
        }
        break;
        
      case 'keyword':
        const keywords = pattern.pattern.split('|');
        lines.forEach((lineContent, index) => {
          const lowerLine = lineContent.toLowerCase();
          
          for (const keyword of keywords) {
            if (lowerLine.includes(keyword.toLowerCase())) {
              violations.push({
                message: pattern.message,
                line: index + 1,
                column: lowerLine.indexOf(keyword.toLowerCase()) + 1,
                fix: pattern.fix
              });
              break;
            }
          }
        });
        break;
        
      case 'ast':
        // AST解析は簡素化のため現在は未実装
        debug.verbose('AST pattern evaluation not implemented in simplified version');
        break;
    }
    
    return violations;
  }
  
  /**
   * カスタムルールを追加
   */
  addRule(rule: DomainRule | unknown): void {
    // 型の検証（インライン実装）
    if (!rule || typeof rule !== 'object') {
      throw new Error('Rule must be an object');
    }
    
    const ruleObj = rule as Record<string, unknown>;
    
    if (!ruleObj.id || typeof ruleObj.id !== 'string') {
      throw new Error('Rule must have a valid id');
    }
    
    if (!ruleObj.name || typeof ruleObj.name !== 'string') {
      throw new Error('Rule must have a valid name');
    }
    
    if (!ruleObj.patterns || !Array.isArray(ruleObj.patterns)) {
      throw new Error('Rule must have patterns array');
    }
    
    const patterns = ruleObj.patterns as unknown[];
    patterns.forEach((pattern: unknown) => {
      if (!pattern || typeof pattern !== 'object') {
        throw new Error('Pattern must be an object');
      }
      
      const patternObj = pattern as Record<string, unknown>;
      
      if (!patternObj.type || typeof patternObj.type !== 'string' || 
          !['regex', 'ast', 'keyword'].includes(patternObj.type)) {
        throw new Error('Pattern must have a valid type');
      }
      
      if (!patternObj.pattern || typeof patternObj.pattern !== 'string') {
        throw new Error('Pattern must have a valid pattern string');
      }
    });
    
    // 検証済みなので型アサーションが安全
    const validRule = rule as DomainRule;
    this.rules.set(validRule.id, validRule);
    debug.verbose(`Added custom rule: ${validRule.id}`);
  }
  
  /**
   * ルールを削除
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    debug.verbose(`Removed rule: ${ruleId}`);
  }
  
  /**
   * 全ルールを取得
   */
  getAllRules(): DomainRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * カテゴリ別にルールを取得
   */
  getRulesByCategory(category: string): DomainRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.category === category);
  }
  
  /**
   * タグでルールを検索
   */
  getRulesByTag(tag: string): DomainRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.tags?.includes(tag));
  }
  
  /**
   * 行番号を取得
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
  
  /**
   * 列番号を取得
   */
  private getColumnNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n');
    return lines[lines.length - 1].length + 1;
  }
}

/**
 * YAMLルールローダー
 */
export class YamlRuleLoader {
  /**
   * YAMLファイルからルールを読み込み
   */
  static loadFromFile(filePath: string): DomainRule[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const rules = yaml.load(content) as DomainRule[];
      
      if (!Array.isArray(rules)) {
        throw new Error('Rules must be an array');
      }
      
      // ルールの検証
      rules.forEach(rule => this.validateRule(rule));
      
      return rules;
    } catch (error) {
      throw new Error(`Failed to load rules from ${filePath}: ${error}`);
    }
  }
  
  /**
   * ルールを検証
   */
  private static validateRule(rule: unknown): void {
    // 型ガード
    if (!rule || typeof rule !== 'object') {
      throw new Error('Rule must be an object');
    }
    
    const ruleObj = rule as Record<string, unknown>;
    if (!ruleObj.id || typeof ruleObj.id !== 'string') {
      throw new Error('Rule must have a valid id');
    }
    
    if (!ruleObj.name || typeof ruleObj.name !== 'string') {
      throw new Error('Rule must have a valid name');
    }
    
    if (!ruleObj.patterns || !Array.isArray(ruleObj.patterns)) {
      throw new Error('Rule must have patterns array');
    }
    
    const patterns = ruleObj.patterns as unknown[];
    patterns.forEach((pattern: unknown) => {
      if (!pattern || typeof pattern !== 'object') {
        throw new Error('Pattern must be an object');
      }
      
      const patternObj = pattern as Record<string, unknown>;
      if (!patternObj.type || typeof patternObj.type !== 'string' || 
          !['regex', 'ast', 'keyword'].includes(patternObj.type)) {
        throw new Error('Pattern must have a valid type');
      }
      
      if (!patternObj.pattern || typeof patternObj.pattern !== 'string') {
        throw new Error('Pattern must have a valid pattern string');
      }
    });
  }
  
  /**
   * ルールをYAMLファイルに保存
   */
  static saveToFile(filePath: string, rules: DomainRule[]): void {
    try {
      const yamlContent = yaml.dump(rules, {
        indent: 2,
        lineWidth: 80,
        noRefs: true
      });
      
      fs.writeFileSync(filePath, yamlContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save rules to ${filePath}: ${error}`);
    }
  }
}