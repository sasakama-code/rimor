import * as yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import { DomainDictionaryManager } from '../../dictionary/core/dictionary';
import { DomainTermManager } from '../../dictionary/core/term';
import { BusinessRuleManager } from '../../dictionary/core/rule';
import { LinterKnowledgeExtractor } from '../../dictionary/extractors/linter';
import { ContextEngine } from '../../dictionary/context/engine';
import { ContextAnalyzer } from '../../dictionary/context/analyzer';
import { OutputFormatter } from '../output';
import { errorHandler, ErrorType } from '../../utils/errorHandler';
import { getMessage } from '../../i18n/messages';
import {
  DomainDictionary,
  DomainTerm,
  BusinessRule,
  ExtractedKnowledge
} from '../../core/types';

/**
 * 辞書管理CLIコマンド
 */
export class DictionaryCommand {
  private dictionaryManager: DomainDictionaryManager;
  private projectRoot: string;
  private isTestEnvironment: boolean;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.dictionaryManager = new DomainDictionaryManager();
    this.isTestEnvironment = this.detectTestEnvironment();
  }

  /**
   * テスト環境を検出
   */
  private detectTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' ||
           process.env.JEST_WORKER_ID !== undefined ||
           process.argv.some(arg => arg.includes('jest'));
  }

  /**
   * 辞書の初期化
   */
  async init(options: {
    domain?: string;
    language?: string;
    fromLinters?: boolean;
    interactive?: boolean;
  }): Promise<void> {
    try {
      console.log(OutputFormatter.header('🧙 Rimorドメイン辞書初期化ウィザード'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const domain = options.domain || await this.promptDomain();
      const language = options.language || 'ja';

      // 基本辞書の作成
      const initialDictionary: Partial<DomainDictionary> = {
        domain,
        language,
        version: '1.0.0',
        lastUpdated: new Date(),
        terms: [],
        relationships: [],
        businessRules: [],
        qualityStandards: [],
        contextMappings: []
      };

      this.dictionaryManager = new DomainDictionaryManager(initialDictionary);

      // Linter設定からの知識抽出
      if (options.fromLinters !== false) {
        console.log(OutputFormatter.info('\n📚 既存設定からの知識抽出中...'));
        await this.extractFromExistingConfigs();
      }

      // インタラクティブモード
      if (options.interactive) {
        await this.runInteractiveSetup();
      }

      // 辞書の保存
      await this.saveDictionary();

      console.log(OutputFormatter.success('\n✅ ドメイン辞書が正常に初期化されました'));
      console.log(OutputFormatter.info(`📍 保存場所: ${this.getDictionaryPath()}`));

      this.showInitializationSummary();
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書初期化に失敗しました');
      console.error(OutputFormatter.error('❌ 辞書初期化に失敗しました'));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  /**
   * 用語の追加
   */
  async addTerm(options: {
    id?: string;
    term: string;
    definition: string;
    category?: string;
    importance?: 'critical' | 'high' | 'medium' | 'low';
    aliases?: string[];
    interactive?: boolean;
  }): Promise<void> {
    try {
      await this.loadDictionary();

      let termData = {
        id: options.id || this.generateTermId(options.term),
        term: options.term,
        definition: options.definition,
        category: options.category || 'other',
        importance: options.importance || 'medium' as const,
        aliases: options.aliases || [],
        examples: [] as Array<{ code: string; description: string }>,
        relatedPatterns: [] as string[],
        testRequirements: [] as string[]
      };

      // インタラクティブモードでの詳細入力
      if (options.interactive) {
        termData = await this.promptTermDetails(termData);
      }

      const domainTerm = DomainTermManager.createTerm(termData);
      this.dictionaryManager.addTerm(domainTerm);

      await this.saveDictionary();

      console.log(OutputFormatter.success(`✅ 用語「${termData.term}」を追加しました`));
      this.showTermSummary(domainTerm);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語追加に失敗しました');
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(OutputFormatter.error(`❌ 用語追加に失敗しました: ${errorMessage}`));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  /**
   * ビジネスルールの追加
   */
  async addRule(options: {
    id?: string;
    name: string;
    description: string;
    domain?: string;
    pattern: string;
    scope?: 'file' | 'class' | 'function' | 'variable';
    type?: 'code-pattern' | 'function-name' | 'data-type' | 'api-endpoint';
    priority?: number;
  }): Promise<void> {
    try {
      await this.loadDictionary();

      const dictionary = this.dictionaryManager.getDictionary();
      const ruleData = {
        id: options.id || this.generateRuleId(options.name),
        name: options.name,
        description: options.description,
        domain: options.domain || dictionary.domain,
        condition: {
          type: options.type || 'code-pattern' as const,
          pattern: options.pattern,
          scope: options.scope || 'file' as const
        },
        requirements: [] as any[],
        priority: options.priority || 100
      };

      const businessRule = BusinessRuleManager.createRule(ruleData);
      this.dictionaryManager.addBusinessRule(businessRule);

      await this.saveDictionary();

      console.log(OutputFormatter.success(`✅ ビジネスルール「${ruleData.name}」を追加しました`));
      this.showRuleSummary(businessRule);
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'ビジネスルール追加に失敗しました');
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(OutputFormatter.error(`❌ ビジネスルール追加に失敗しました: ${errorMessage}`));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  /**
   * 辞書内容の一覧表示
   */
  async list(options: {
    type?: 'terms' | 'rules' | 'all';
    category?: string;
    importance?: string;
    format?: 'table' | 'json';
  }): Promise<void> {
    try {
      await this.loadDictionary();

      const dictionary = this.dictionaryManager.getDictionary();
      const type = options.type || 'all';
      const format = options.format || 'table';

      if (format === 'json') {
        this.outputJson(dictionary, type, options);
        return;
      }

      console.log(OutputFormatter.header(`📚 ドメイン辞書内容 (${dictionary.domain})`));
      console.log(`📊 統計: ${dictionary.terms.length}用語, ${dictionary.businessRules.length}ルール`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (type === 'terms' || type === 'all') {
        this.displayTerms(dictionary.terms, options);
      }

      if (type === 'rules' || type === 'all') {
        this.displayRules(dictionary.businessRules, options);
      }

      if (type === 'all') {
        this.displayStatistics();
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書一覧表示に失敗しました');
      console.error(OutputFormatter.error('❌ 辞書一覧表示に失敗しました'));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  /**
   * 辞書の検証
   */
  async validate(): Promise<void> {
    try {
      await this.loadDictionary();

      console.log(OutputFormatter.header('🔍 ドメイン辞書品質検証'));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 品質評価の実行
      const qualityMetrics = this.dictionaryManager.evaluateQuality();
      
      // 統計情報の取得
      const statistics = this.dictionaryManager.getStatistics();

      // 結果の表示
      this.displayQualityReport(qualityMetrics, statistics);

      // 改善提案の表示
      this.displayImprovementSuggestions(qualityMetrics, statistics);

      if (qualityMetrics.overall < 60) {
        console.log(OutputFormatter.warning('\n⚠️  辞書の品質向上が推奨されます'));
        if (!this.isTestEnvironment) {
          process.exit(1);
        }
      } else {
        console.log(OutputFormatter.success('\n✅ 辞書の品質は良好です'));
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '辞書検証に失敗しました');
      console.error(OutputFormatter.error('❌ 辞書検証に失敗しました'));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  /**
   * 用語の検索
   */
  async search(query: string): Promise<void> {
    try {
      await this.loadDictionary();

      const results = this.dictionaryManager.searchTerms(query);

      if (results.length === 0) {
        console.log(OutputFormatter.warning(`⚠️  「${query}」に一致する用語が見つかりませんでした`));
        return;
      }

      console.log(OutputFormatter.header(`🔍 検索結果: "${query}"`));
      console.log(`📊 ${results.length}件の用語が見つかりました\n`);

      results.forEach((term, index) => {
        console.log(`${index + 1}. ${OutputFormatter.info(term.term)}`);
        console.log(`   ID: ${term.id}`);
        console.log(`   カテゴリ: ${term.category} | 重要度: ${term.importance}`);
        console.log(`   定義: ${term.definition}`);
        if (term.aliases.length > 0) {
          console.log(`   エイリアス: ${term.aliases.join(', ')}`);
        }
        console.log('');
      });
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, '用語検索に失敗しました');
      console.error(OutputFormatter.error('❌ 用語検索に失敗しました'));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  /**
   * コード分析（辞書を使用した文脈理解）
   */
  async analyze(filePath: string, options: {
    verbose?: boolean;
    output?: string;
  }): Promise<void> {
    try {
      await this.loadDictionary();

      if (!fs.existsSync(filePath)) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      const code = fs.readFileSync(filePath, 'utf-8');
      const dictionary = this.dictionaryManager.getDictionary();

      console.log(OutputFormatter.header(`🔍 文脈理解分析: ${path.basename(filePath)}`));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 文脈分析の実行
      const analyzer = new ContextAnalyzer(dictionary);
      const analysis = await analyzer.performContextualAnalysis(code, filePath, dictionary);

      // 結果の表示
      this.displayAnalysisResults(analysis, options.verbose || false);

      // ファイル出力
      if (options.output) {
        await this.saveAnalysisResults(analysis, options.output);
        console.log(OutputFormatter.success(`\n📄 分析結果を ${options.output} に保存しました`));
      }
    } catch (error) {
      errorHandler.handleError(error, ErrorType.SYSTEM_ERROR, 'コード分析に失敗しました');
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(OutputFormatter.error(`❌ コード分析に失敗しました: ${errorMessage}`));
      if (!this.isTestEnvironment) {
        process.exit(1);
      }
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * ドメインの選択プロンプト
   */
  private async promptDomain(): Promise<string> {
    // 簡易的な実装（実際のプロンプトライブラリを使用することを想定）
    console.log('📋 ドメインを選択してください:');
    console.log('1. 金融・決済');
    console.log('2. ヘルスケア・医療');
    console.log('3. Eコマース');
    console.log('4. その他（カスタム）');
    
    // 実際の実装では readline などを使用
    return 'general';
  }

  /**
   * 既存設定からの知識抽出
   */
  private async extractFromExistingConfigs(): Promise<void> {
    try {
      const configs = await LinterKnowledgeExtractor.autoDetectConfigs(this.projectRoot);
      
      if (Object.keys(configs).length === 0) {
        console.log(OutputFormatter.warning('⚠️  Linter設定ファイルが見つかりませんでした'));
        return;
      }

      console.log(OutputFormatter.info(`📁 検出された設定ファイル:`));
      Object.entries(configs).forEach(([type, path]) => {
        console.log(`   ${type}: ${path}`);
      });

      const extractedKnowledge = await LinterKnowledgeExtractor.extractFromLinters(configs);

      // 抽出された知識を辞書に追加
      this.addExtractedKnowledge(extractedKnowledge);

      console.log(OutputFormatter.success(
        `✅ ${extractedKnowledge.terms.length}個の用語と${extractedKnowledge.rules.length}個のルールを抽出しました`
      ));
    } catch (error) {
      console.warn(OutputFormatter.warning('⚠️  設定ファイルからの知識抽出でエラーが発生しました'));
    }
  }

  /**
   * 抽出された知識を辞書に追加
   */
  private addExtractedKnowledge(knowledge: ExtractedKnowledge): void {
    // 用語の追加
    knowledge.terms.forEach(term => {
      try {
        this.dictionaryManager.addTerm(term);
      } catch (error) {
        // 重複等のエラーは無視
      }
    });

    // ルールの追加（簡易的な変換）
    knowledge.rules.forEach(inferredRule => {
      try {
        const businessRule = BusinessRuleManager.createRule({
          id: inferredRule.id,
          name: inferredRule.name,
          description: `抽出されたルール: ${inferredRule.pattern}`,
          domain: this.dictionaryManager.getDictionary().domain,
          condition: {
            type: 'code-pattern',
            pattern: inferredRule.pattern,
            scope: 'file'
          },
          requirements: inferredRule.suggestedRequirements,
          priority: Math.round((1 - inferredRule.confidence) * 100)
        });
        this.dictionaryManager.addBusinessRule(businessRule);
      } catch (error) {
        // エラーは無視
      }
    });
  }

  /**
   * インタラクティブセットアップ
   */
  private async runInteractiveSetup(): Promise<void> {
    console.log(OutputFormatter.info('\n🔧 基本的な用語を追加しましょう...'));
    // 実際の実装では readline を使用してインタラクティブな入力を行う
    console.log('（インタラクティブモードは今後実装予定）');
  }

  /**
   * 用語詳細のプロンプト
   */
  private async promptTermDetails(termData: any): Promise<any> {
    // 実際の実装では readline を使用してインタラクティブな入力を行う
    console.log('（インタラクティブモードは今後実装予定）');
    return termData;
  }

  /**
   * 辞書の読み込み
   */
  private async loadDictionary(): Promise<void> {
    const dictionaryPath = this.getDictionaryPath();
    
    if (!fs.existsSync(dictionaryPath)) {
      throw new Error('辞書ファイルが見つかりません。先に `rimor dictionary init` を実行してください。');
    }

    // YAML読み込みは今後実装（現在は簡易的な処理）
    console.log('（辞書読み込み機能は実装中です）');
  }

  /**
   * 辞書の保存
   */
  private async saveDictionary(): Promise<void> {
    const dictionaryPath = this.getDictionaryPath();
    const dictionaryDir = path.dirname(dictionaryPath);

    // ディレクトリ作成
    if (!fs.existsSync(dictionaryDir)) {
      fs.mkdirSync(dictionaryDir, { recursive: true });
    }

    // YAML保存は今後実装（現在は簡易的な処理）
    const dictionary = this.dictionaryManager.getDictionary();
    fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2), 'utf-8');
  }

  /**
   * 辞書ファイルパスの取得
   */
  private getDictionaryPath(): string {
    return path.join(this.projectRoot, '.rimor', 'dictionary.json');
  }

  /**
   * ID生成
   */
  private generateTermId(term: string): string {
    return `term-${term.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private generateRuleId(name: string): string {
    return `rule-${name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  /**
   * 表示メソッド
   */
  private showInitializationSummary(): void {
    const dictionary = this.dictionaryManager.getDictionary();
    const statistics = this.dictionaryManager.getStatistics();

    console.log('\n📊 初期化完了サマリー:');
    console.log(`   ドメイン: ${dictionary.domain}`);
    console.log(`   言語: ${dictionary.language}`);
    console.log(`   用語数: ${statistics.totalTerms}`);
    console.log(`   ルール数: ${statistics.totalRules}`);
  }

  private showTermSummary(term: DomainTerm): void {
    console.log('\n📋 追加された用語:');
    console.log(`   ID: ${term.id}`);
    console.log(`   カテゴリ: ${term.category}`);
    console.log(`   重要度: ${term.importance}`);
    console.log(`   定義: ${term.definition}`);
  }

  private showRuleSummary(rule: BusinessRule): void {
    console.log('\n📋 追加されたルール:');
    console.log(`   ID: ${rule.id}`);
    console.log(`   ドメイン: ${rule.domain}`);
    console.log(`   優先度: ${rule.priority}`);
    console.log(`   パターン: ${rule.condition.pattern}`);
  }

  private displayTerms(terms: DomainTerm[], options: any): void {
    let filteredTerms = terms;

    if (options.category) {
      filteredTerms = filteredTerms.filter(term => term.category === options.category);
    }

    if (options.importance) {
      filteredTerms = filteredTerms.filter(term => term.importance === options.importance);
    }

    console.log(OutputFormatter.info(`📚 用語一覧 (${filteredTerms.length}件)`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    filteredTerms.forEach((term, index) => {
      console.log(`${index + 1}. ${OutputFormatter.info(term.term)} [${term.importance}]`);
      console.log(`   ${term.definition}`);
      if (term.aliases.length > 0) {
        console.log(`   エイリアス: ${term.aliases.join(', ')}`);
      }
      console.log('');
    });
  }

  private displayRules(rules: BusinessRule[], options: any): void {
    console.log(OutputFormatter.info(`📏 ビジネスルール一覧 (${rules.length}件)`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    rules.forEach((rule, index) => {
      console.log(`${index + 1}. ${OutputFormatter.info(rule.name)} [優先度: ${rule.priority}]`);
      console.log(`   ${rule.description}`);
      console.log(`   パターン: ${rule.condition.pattern}`);
      console.log('');
    });
  }

  private displayStatistics(): void {
    const statistics = this.dictionaryManager.getStatistics();

    console.log(OutputFormatter.info('📊 統計情報'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`総用語数: ${statistics.totalTerms}`);
    console.log(`総ルール数: ${statistics.totalRules}`);
    console.log(`関係性数: ${statistics.totalRelationships}`);

    console.log('\nカテゴリ別用語数:');
    Object.entries(statistics.categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`);
    });

    console.log('\n重要度別用語数:');
    Object.entries(statistics.importanceCounts).forEach(([importance, count]) => {
      console.log(`  ${importance}: ${count}件`);
    });
  }

  private displayQualityReport(qualityMetrics: any, statistics: any): void {
    console.log(`📊 総合品質スコア: ${OutputFormatter.info(qualityMetrics.overall.toFixed(1))}点`);
    console.log('');
    console.log('📋 品質詳細:');
    console.log(`  完全性: ${qualityMetrics.completeness.toFixed(1)}点`);
    console.log(`  正確性: ${qualityMetrics.accuracy.toFixed(1)}点`);
    console.log(`  一貫性: ${qualityMetrics.consistency.toFixed(1)}点`);
    console.log(`  網羅性: ${qualityMetrics.coverage.toFixed(1)}点`);
  }

  private displayImprovementSuggestions(qualityMetrics: any, statistics: any): void {
    console.log('\n💡 改善提案:');

    if (qualityMetrics.completeness < 70) {
      console.log('  - 用語の定義を充実させてください');
      console.log('  - コード例やテスト要件を追加してください');
    }

    if (qualityMetrics.coverage < 50) {
      console.log('  - 用語間の関係性を定義してください');
    }

    if (statistics.totalRules < 5) {
      console.log('  - ビジネスルールを追加してください');
    }
  }

  private displayAnalysisResults(analysis: any, verbose: boolean): void {
    console.log(`📊 品質スコア: ${OutputFormatter.info(analysis.qualityScore.toFixed(1))}点`);
    console.log(`🎯 ドメイン関連度: ${OutputFormatter.info((analysis.context.domainRelevance * 100).toFixed(1))}%`);

    if (analysis.relevantTerms.length > 0) {
      console.log(`\n📚 関連用語 (${analysis.relevantTerms.length}件):`);
      analysis.relevantTerms.slice(0, 5).forEach((tr: any) => {
        console.log(`  - ${tr.term.term} (関連度: ${(tr.relevance * 100).toFixed(1)}%)`);
      });
    }

    if (analysis.applicableRules.length > 0) {
      console.log(`\n📏 適用可能ルール (${analysis.applicableRules.length}件):`);
      analysis.applicableRules.slice(0, 3).forEach((rule: any) => {
        console.log(`  - ${rule.name}`);
      });
    }

    if (analysis.requiredTests.length > 0) {
      console.log(`\n🧪 推奨テスト (${analysis.requiredTests.length}件):`);
      analysis.requiredTests.slice(0, 3).forEach((test: any) => {
        console.log(`  - [${test.type}] ${test.description}`);
      });
    }

    if (verbose) {
      this.displayVerboseAnalysis(analysis);
    }
  }

  private displayVerboseAnalysis(analysis: any): void {
    console.log('\n🔍 詳細分析結果:');
    console.log(`言語: ${analysis.context.language}`);
    console.log(`関数数: ${analysis.context.functions.length}`);
    console.log(`クラス数: ${analysis.context.classes.length}`);
    console.log(`インポート数: ${analysis.context.imports.length}`);
  }

  private outputJson(dictionary: DomainDictionary, type: string, options: any): void {
    let output: any = {};

    if (type === 'terms' || type === 'all') {
      output.terms = dictionary.terms;
    }

    if (type === 'rules' || type === 'all') {
      output.businessRules = dictionary.businessRules;
    }

    if (type === 'all') {
      output.statistics = this.dictionaryManager.getStatistics();
      output.qualityMetrics = this.dictionaryManager.evaluateQuality();
    }

    console.log(JSON.stringify(output, null, 2));
  }

  private async saveAnalysisResults(analysis: any, filePath: string): Promise<void> {
    const results = {
      timestamp: new Date().toISOString(),
      filePath: analysis.context.filePath,
      qualityScore: analysis.qualityScore,
      domainRelevance: analysis.context.domainRelevance,
      relevantTerms: analysis.relevantTerms,
      applicableRules: analysis.applicableRules,
      requiredTests: analysis.requiredTests
    };

    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf-8');
  }

  /**
   * 静的メソッド: 辞書内容の一覧表示
   */
  static async executeList(options: {
    type?: 'terms' | 'rules' | 'all';
    category?: string;
    importance?: string;
    format?: 'table' | 'json';
  } = {}): Promise<void> {
    const command = new DictionaryCommand();
    await command.list(options);
  }
}

/**
 * CLI統合関数
 */
export function registerDictionaryCommands(yargs: yargs.Argv): yargs.Argv {
  return yargs
    .command(
      'dictionary',
      'ドメイン辞書の管理',
      (yargs) => {
        return yargs
          .command(
            'init',
            '新しいドメイン辞書を初期化',
            (yargs) => {
              return yargs
                .option('domain', {
                  alias: 'd',
                  type: 'string',
                  description: 'ドメイン名'
                })
                .option('language', {
                  alias: 'l',
                  type: 'string',
                  default: 'ja',
                  description: '言語設定'
                })
                .option('from-linters', {
                  type: 'boolean',
                  default: true,
                  description: 'Linter設定からの知識抽出'
                })
                .option('interactive', {
                  alias: 'i',
                  type: 'boolean',
                  default: false,
                  description: 'インタラクティブモード'
                });
            },
            async (argv) => {
              const command = new DictionaryCommand();
              await command.init({
                domain: argv.domain,
                language: argv.language,
                fromLinters: argv['from-linters'],
                interactive: argv.interactive
              });
            }
          )
          .command(
            'add-term <term> <definition>',
            '新しい用語を追加',
            (yargs) => {
              return yargs
                .positional('term', {
                  type: 'string',
                  description: '用語名'
                })
                .positional('definition', {
                  type: 'string',
                  description: '用語の定義'
                })
                .option('category', {
                  alias: 'c',
                  type: 'string',
                  default: 'other',
                  description: 'カテゴリ'
                })
                .option('importance', {
                  type: 'string',
                  choices: ['critical', 'high', 'medium', 'low'],
                  default: 'medium',
                  description: '重要度'
                })
                .option('aliases', {
                  type: 'array',
                  description: 'エイリアス（カンマ区切り）'
                })
                .option('interactive', {
                  alias: 'i',
                  type: 'boolean',
                  default: false,
                  description: 'インタラクティブモード'
                });
            },
            async (argv) => {
              const command = new DictionaryCommand();
              await command.addTerm({
                term: argv.term!,
                definition: argv.definition!,
                category: argv.category,
                importance: argv.importance as any,
                aliases: argv.aliases as string[],
                interactive: argv.interactive
              });
            }
          )
          .command(
            'list',
            '辞書内容の一覧表示',
            (yargs) => {
              return yargs
                .option('type', {
                  alias: 't',
                  type: 'string',
                  choices: ['terms', 'rules', 'all'],
                  default: 'all',
                  description: '表示タイプ'
                })
                .option('category', {
                  alias: 'c',
                  type: 'string',
                  description: 'カテゴリフィルタ'
                })
                .option('format', {
                  alias: 'f',
                  type: 'string',
                  choices: ['table', 'json'],
                  default: 'table',
                  description: '出力形式'
                });
            },
            async (argv) => {
              const command = new DictionaryCommand();
              await command.list({
                type: argv.type as any,
                category: argv.category,
                format: argv.format as any
              });
            }
          )
          .command(
            'search <query>',
            '用語を検索',
            (yargs) => {
              return yargs
                .positional('query', {
                  type: 'string',
                  description: '検索クエリ'
                });
            },
            async (argv) => {
              const command = new DictionaryCommand();
              await command.search(argv.query!);
            }
          )
          .command(
            'validate',
            '辞書の品質を検証',
            (yargs) => yargs,
            async (argv) => {
              const command = new DictionaryCommand();
              await command.validate();
            }
          )
          .command(
            'analyze <file>',
            'ファイルの文脈理解分析',
            (yargs) => {
              return yargs
                .positional('file', {
                  type: 'string',
                  description: '分析対象ファイル'
                })
                .option('verbose', {
                  alias: 'v',
                  type: 'boolean',
                  default: false,
                  description: '詳細出力'
                })
                .option('output', {
                  alias: 'o',
                  type: 'string',
                  description: '結果出力ファイル'
                });
            },
            async (argv) => {
              const command = new DictionaryCommand();
              await command.analyze(argv.file!, {
                verbose: argv.verbose,
                output: argv.output
              });
            }
          );
      }
    );
}