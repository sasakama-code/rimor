import * as fs from 'fs';
import * as path from 'path';
import {
  ExtractedKnowledge,
  DomainTerm,
  BusinessRule,
  CodePattern,
  InferredRule,
  LearningOptions,
  TestRequirement
} from '../../core/types';
import { errorHandler, ErrorType } from '../../utils/errorHandler';

/**
 * Linter設定ファイルから知識を抽出するクラス
 * ESLint、TypeScript、Prettier等の設定から用語やルールを推論する
 */
export class LinterKnowledgeExtractor {

  /**
   * ESLint設定から知識を抽出
   */
  static async extractFromESLint(
    eslintConfigPath: string,
    options: LearningOptions = this.getDefaultOptions()
  ): Promise<ExtractedKnowledge> {
    try {
      if (!fs.existsSync(eslintConfigPath)) {
        throw new Error(`ESLint設定ファイルが見つかりません: ${eslintConfigPath}`);
      }

      const configContent = fs.readFileSync(eslintConfigPath, 'utf-8');
      let eslintConfig: any;

      // JSON/JSファイルの読み込み
      if (eslintConfigPath.endsWith('.json')) {
        eslintConfig = JSON.parse(configContent);
      } else {
        // .eslintrc.js などのJS形式は簡易的な処理
        const configMatch = configContent.match(/module\.exports\s*=\s*({[\s\S]*})/);
        if (configMatch) {
          try {
            eslintConfig = eval(`(${configMatch[1]})`);
          } catch {
            console.warn('JS形式のESLint設定の解析に失敗しました');
            return this.createEmptyKnowledge();
          }
        } else {
          console.warn('ESLint設定の構造を解析できませんでした');
          return this.createEmptyKnowledge();
        }
      }

      return this.processESLintConfig(eslintConfig, options);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ESLint設定からの知識抽出に失敗しました');
      return this.createEmptyKnowledge();
    }
  }

  /**
   * TypeScript設定から知識を抽出
   */
  static async extractFromTypeScript(
    tsconfigPath: string,
    options: LearningOptions = this.getDefaultOptions()
  ): Promise<ExtractedKnowledge> {
    try {
      if (!fs.existsSync(tsconfigPath)) {
        throw new Error(`TypeScript設定ファイルが見つかりません: ${tsconfigPath}`);
      }

      const configContent = fs.readFileSync(tsconfigPath, 'utf-8');
      
      // JSON-with-comments形式の処理（簡易的）
      const cleanedContent = configContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      const tsconfig = JSON.parse(cleanedContent);

      return this.processTypeScriptConfig(tsconfig, options);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'TypeScript設定からの知識抽出に失敗しました');
      return this.createEmptyKnowledge();
    }
  }

  /**
   * Prettier設定から知識を抽出
   */
  static async extractFromPrettier(
    prettierConfigPath: string,
    options: LearningOptions = this.getDefaultOptions()
  ): Promise<ExtractedKnowledge> {
    try {
      if (!fs.existsSync(prettierConfigPath)) {
        throw new Error(`Prettier設定ファイルが見つかりません: ${prettierConfigPath}`);
      }

      const configContent = fs.readFileSync(prettierConfigPath, 'utf-8');
      const prettierConfig = JSON.parse(configContent);

      return this.processPrettierConfig(prettierConfig, options);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'Prettier設定からの知識抽出に失敗しました');
      return this.createEmptyKnowledge();
    }
  }

  /**
   * 複数のLinter設定から統合的に知識を抽出
   */
  static async extractFromLinters(
    configs: {
      eslint?: string;
      typescript?: string;
      prettier?: string;
    },
    options: LearningOptions = this.getDefaultOptions()
  ): Promise<ExtractedKnowledge> {
    try {
      const extractions: ExtractedKnowledge[] = [];

      if (configs.eslint) {
        const eslintKnowledge = await this.extractFromESLint(configs.eslint, options);
        extractions.push(eslintKnowledge);
      }

      if (configs.typescript) {
        const tsKnowledge = await this.extractFromTypeScript(configs.typescript, options);
        extractions.push(tsKnowledge);
      }

      if (configs.prettier) {
        const prettierKnowledge = await this.extractFromPrettier(configs.prettier, options);
        extractions.push(prettierKnowledge);
      }

      return this.mergeExtractedKnowledge(extractions);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '統合知識抽出に失敗しました');
      return this.createEmptyKnowledge();
    }
  }

  // ========================================
  // 設定別処理メソッド
  // ========================================

  /**
   * ESLint設定の処理
   */
  private static processESLintConfig(config: any, options: LearningOptions): ExtractedKnowledge {
    const terms: DomainTerm[] = [];
    const patterns: CodePattern[] = [];
    const rules: InferredRule[] = [];

    // extends から用語を抽出
    if (config.extends) {
      const extendsArray = Array.isArray(config.extends) ? config.extends : [config.extends];
      extendsArray.forEach((extend: string, index: number) => {
        const frameworkName = this.extractFrameworkFromExtends(extend);
        if (frameworkName) {
          terms.push(this.createTermFromFramework(frameworkName, `eslint-extend-${index}`));
        }
      });
    }

    // plugins から用語を抽出
    if (config.plugins) {
      config.plugins.forEach((plugin: string, index: number) => {
        const cleanPluginName = plugin.replace(/^eslint-plugin-/, '');
        terms.push(this.createTermFromPlugin(cleanPluginName, `eslint-plugin-${index}`));
      });
    }

    // rules からビジネスルールを推論
    if (config.rules) {
      Object.entries(config.rules).forEach(([ruleName, ruleConfig], index) => {
        const inferredRule = this.createInferredRuleFromESLintRule(ruleName, ruleConfig, index);
        if (inferredRule) {
          rules.push(inferredRule);
        }

        // パターンの生成
        const pattern = this.createPatternFromESLintRule(ruleName, ruleConfig, index);
        if (pattern) {
          patterns.push(pattern);
        }
      });
    }

    return {
      terms: terms.slice(0, options.maxTerms),
      patterns,
      rules,
      confidence: 0.7
    };
  }

  /**
   * TypeScript設定の処理
   */
  private static processTypeScriptConfig(config: any, options: LearningOptions): ExtractedKnowledge {
    const terms: DomainTerm[] = [];
    const patterns: CodePattern[] = [];
    const rules: InferredRule[] = [];

    // compilerOptions から用語を抽出
    if (config.compilerOptions) {
      const compilerOptions = config.compilerOptions;

      // target から用語を抽出
      if (compilerOptions.target) {
        terms.push({
          id: 'ts-target',
          term: `ECMAScript ${compilerOptions.target}`,
          aliases: [compilerOptions.target, 'ES target'],
          definition: `TypeScriptコンパイル対象のECMAScriptバージョン`,
          category: 'technical',
          importance: 'medium',
          examples: [{
            code: `"target": "${compilerOptions.target}"`,
            description: 'tsconfig.jsonでの設定例'
          }],
          relatedPatterns: ['typescript-config'],
          testRequirements: ['型安全性のテスト', 'コンパイルエラーのテスト']
        });
      }

      // strict モードの設定から品質基準を推論
      if (compilerOptions.strict) {
        rules.push({
          id: 'ts-strict-mode',
          name: 'TypeScript Strictモード',
          pattern: 'strict.*true',
          confidence: 0.9,
          evidence: ['tsconfig.json設定', 'TypeScriptコンパイラ設定'],
          suggestedRequirements: [{
            type: 'must-have',
            description: '型安全性の検証',
            testPattern: 'expect\\(.*\\)\\.toHaveProperty\\(.*\\)'
          }]
        });
      }

      // lib から用語を抽出
      if (compilerOptions.lib) {
        compilerOptions.lib.forEach((lib: string, index: number) => {
          terms.push({
            id: `ts-lib-${index}`,
            term: `TypeScript ${lib}`,
            aliases: [lib],
            definition: `TypeScriptで利用可能な${lib}ライブラリ`,
            category: 'technical',
            importance: 'low',
            examples: [{
              code: `"lib": ["${lib}"]`,
              description: 'tsconfig.jsonでの設定例'
            }],
            relatedPatterns: ['typescript-lib'],
            testRequirements: ['ライブラリ機能のテスト']
          });
        });
      }
    }

    return {
      terms: terms.slice(0, options.maxTerms),
      patterns,
      rules,
      confidence: 0.8
    };
  }

  /**
   * Prettier設定の処理
   */
  private static processPrettierConfig(config: any, options: LearningOptions): ExtractedKnowledge {
    const terms: DomainTerm[] = [];
    const patterns: CodePattern[] = [];
    const rules: InferredRule[] = [];

    // コードスタイルに関する用語を抽出
    Object.entries(config).forEach(([key, value], index) => {
      if (typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
        terms.push({
          id: `prettier-${key}`,
          term: `Prettier ${key}`,
          aliases: [key],
          definition: `Prettierのコードフォーマット設定: ${key}`,
          category: 'technical',
          importance: 'low',
          examples: [{
            code: `"${key}": ${JSON.stringify(value)}`,
            description: 'prettier設定での例'
          }],
          relatedPatterns: ['code-formatting'],
          testRequirements: ['フォーマット規則のテスト']
        });

        // フォーマット規則の推論
        rules.push({
          id: `prettier-rule-${index}`,
          name: `Prettier ${key} 規則`,
          pattern: `${key}.*${value}`,
          confidence: 0.6,
          evidence: ['prettier設定'],
          suggestedRequirements: [{
            type: 'nice-to-have',
            description: 'コードフォーマットの一貫性テスト',
            testPattern: 'expect\\(formattedCode\\)\\.toMatch\\(/.*/'
          }]
        });
      }
    });

    return {
      terms: terms.slice(0, options.maxTerms),
      patterns,
      rules,
      confidence: 0.5
    };
  }

  // ========================================
  // ヘルパーメソッド
  // ========================================

  /**
   * extends設定からフレームワークを抽出
   */
  private static extractFrameworkFromExtends(extend: string): string | null {
    const frameworkMap: Record<string, string> = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'node': 'Node.js',
      'typescript': 'TypeScript',
      'prettier': 'Prettier',
      'airbnb': 'Airbnb Style Guide',
      'standard': 'JavaScript Standard Style'
    };

    for (const [key, framework] of Object.entries(frameworkMap)) {
      if (extend.includes(key)) {
        return framework;
      }
    }

    return null;
  }

  /**
   * フレームワークから用語を作成
   */
  private static createTermFromFramework(framework: string, id: string): DomainTerm {
    return {
      id,
      term: framework,
      aliases: [framework.toLowerCase()],
      definition: `${framework}フレームワークまたはライブラリ`,
      category: 'technical',
      importance: 'medium',
      examples: [{
        code: `import ${framework}`,
        description: `${framework}のインポート例`
      }],
      relatedPatterns: ['framework-usage'],
      testRequirements: ['フレームワーク機能のテスト', '統合テスト']
    };
  }

  /**
   * プラグインから用語を作成
   */
  private static createTermFromPlugin(plugin: string, id: string): DomainTerm {
    return {
      id,
      term: `ESLint ${plugin}`,
      aliases: [plugin],
      definition: `ESLint ${plugin}プラグインが提供する機能`,
      category: 'technical',
      importance: 'low',
      examples: [{
        code: `"plugins": ["${plugin}"]`,
        description: 'ESLint設定での使用例'
      }],
      relatedPatterns: ['eslint-plugin'],
      testRequirements: ['リンタールールのテスト']
    };
  }

  /**
   * ESLintルールから推論ルールを作成
   */
  private static createInferredRuleFromESLintRule(
    ruleName: string,
    ruleConfig: any,
    index: number
  ): InferredRule | null {
    if (ruleConfig === 'off' || ruleConfig === 0) return null;

    const severity = this.getESLintRuleSeverity(ruleConfig);
    const confidence = severity === 'error' ? 0.9 : 0.7;

    return {
      id: `eslint-rule-${index}`,
      name: `ESLint ${ruleName}`,
      pattern: this.generatePatternFromESLintRule(ruleName),
      confidence,
      evidence: [`ESLint設定: ${ruleName}`],
      suggestedRequirements: this.generateTestRequirementsFromESLintRule(ruleName, severity)
    };
  }

  /**
   * ESLintルールからパターンを作成
   */
  private static createPatternFromESLintRule(
    ruleName: string,
    ruleConfig: any,
    index: number
  ): CodePattern | null {
    if (ruleConfig === 'off' || ruleConfig === 0) return null;

    return {
      id: `eslint-pattern-${index}`,
      name: `ESLint ${ruleName} パターン`,
      pattern: this.generatePatternFromESLintRule(ruleName),
      description: `ESLintルール ${ruleName} に関連するコードパターン`,
      examples: [this.generateExampleFromESLintRule(ruleName)],
      frequency: 1
    };
  }

  /**
   * ESLintルールの重要度を取得
   */
  private static getESLintRuleSeverity(ruleConfig: any): 'error' | 'warn' | 'off' {
    if (Array.isArray(ruleConfig)) {
      const level = ruleConfig[0];
      return level === 2 ? 'error' : level === 1 ? 'warn' : 'off';
    }
    return ruleConfig === 2 || ruleConfig === 'error' ? 'error' :
           ruleConfig === 1 || ruleConfig === 'warn' ? 'warn' : 'off';
  }

  /**
   * ESLintルールからパターンを生成
   */
  private static generatePatternFromESLintRule(ruleName: string): string {
    const patternMap: Record<string, string> = {
      'no-console': 'console\\.(log|error|warn)',
      'no-unused-vars': 'const\\s+\\w+\\s*=',
      'prefer-const': 'let\\s+\\w+\\s*=.*(?!.*=)',
      'eqeqeq': '==\\s*[^=]',
      'no-var': 'var\\s+\\w+',
      'arrow-spacing': '=>',
      'object-shorthand': '\\{\\s*\\w+:\\s*\\w+\\s*\\}',
      'quote-props': '[\'"[a-zA-Z-_]+\'"]\\s*:',
      'comma-dangle': ',\\s*[}\\]]'
    };

    return patternMap[ruleName] || `${ruleName.replace(/-/g, '.')}`;
  }

  /**
   * ESLintルールから例を生成
   */
  private static generateExampleFromESLintRule(ruleName: string): string {
    const exampleMap: Record<string, string> = {
      'no-console': 'console.log("debug");',
      'no-unused-vars': 'const unusedVar = 42;',
      'prefer-const': 'let value = "constant";',
      'eqeqeq': 'if (a == b) {}',
      'no-var': 'var oldStyle = true;',
      'arrow-spacing': 'arr.map(x=>x*2)',
      'object-shorthand': '{ name: name }',
      'quote-props': '{ "property": value }',
      'comma-dangle': '{ a: 1, b: 2, }'
    };

    return exampleMap[ruleName] || `// ${ruleName} example`;
  }

  /**
   * ESLintルールからテスト要件を生成
   */
  private static generateTestRequirementsFromESLintRule(
    ruleName: string,
    severity: string
  ): TestRequirement[] {
    const baseRequirement: TestRequirement = {
      type: severity === 'error' ? 'must-have' : 'should-have',
      description: `${ruleName}ルールの遵守テスト`,
      testPattern: 'expect\\(.*\\)\\.not\\.toMatch\\(/.*pattern.*/',
      example: `expect(code).not.toMatch(/${this.generatePatternFromESLintRule(ruleName)}/)`
    };

    return [baseRequirement];
  }

  /**
   * 複数の抽出結果をマージ
   */
  private static mergeExtractedKnowledge(extractions: ExtractedKnowledge[]): ExtractedKnowledge {
    const merged: ExtractedKnowledge = {
      terms: [],
      patterns: [],
      rules: [],
      confidence: 0
    };

    let totalConfidence = 0;
    let count = 0;

    extractions.forEach(extraction => {
      merged.terms.push(...extraction.terms);
      merged.patterns.push(...extraction.patterns);
      merged.rules.push(...extraction.rules);
      totalConfidence += extraction.confidence;
      count++;
    });

    // 重複を除去（IDベース）
    merged.terms = this.removeDuplicateTerms(merged.terms);
    merged.patterns = this.removeDuplicatePatterns(merged.patterns);
    merged.rules = this.removeDuplicateRules(merged.rules);

    // 平均信頼度を計算
    merged.confidence = count > 0 ? totalConfidence / count : 0;

    return merged;
  }

  /**
   * 重複用語の除去
   */
  private static removeDuplicateTerms(terms: DomainTerm[]): DomainTerm[] {
    const seen = new Set<string>();
    return terms.filter(term => {
      if (seen.has(term.id)) {
        return false;
      }
      seen.add(term.id);
      return true;
    });
  }

  /**
   * 重複パターンの除去
   */
  private static removeDuplicatePatterns(patterns: CodePattern[]): CodePattern[] {
    const seen = new Set<string>();
    return patterns.filter(pattern => {
      if (seen.has(pattern.id)) {
        return false;
      }
      seen.add(pattern.id);
      return true;
    });
  }

  /**
   * 重複ルールの除去
   */
  private static removeDuplicateRules(rules: InferredRule[]): InferredRule[] {
    const seen = new Set<string>();
    return rules.filter(rule => {
      if (seen.has(rule.id)) {
        return false;
      }
      seen.add(rule.id);
      return true;
    });
  }

  /**
   * デフォルトの学習オプション
   */
  private static getDefaultOptions(): LearningOptions {
    return {
      includeComments: true,
      includeTests: false,
      minFrequency: 1,
      maxTerms: 50
    };
  }

  /**
   * 空の知識結果を作成
   */
  private static createEmptyKnowledge(): ExtractedKnowledge {
    return {
      terms: [],
      patterns: [],
      rules: [],
      confidence: 0
    };
  }

  /**
   * プロジェクトルートから設定ファイルを自動検出
   */
  static async autoDetectConfigs(projectRoot: string): Promise<{
    eslint?: string;
    typescript?: string;
    prettier?: string;
  }> {
    const configs: { eslint?: string; typescript?: string; prettier?: string } = {};

    // ESLint設定ファイルの検出
    const eslintFiles = ['.eslintrc.json', '.eslintrc.js', '.eslintrc.yml', '.eslintrc.yaml'];
    for (const file of eslintFiles) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        configs.eslint = filePath;
        break;
      }
    }

    // TypeScript設定ファイルの検出
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      configs.typescript = tsconfigPath;
    }

    // Prettier設定ファイルの検出
    const prettierFiles = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'];
    for (const file of prettierFiles) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        configs.prettier = filePath;
        break;
      }
    }

    return configs;
  }
}