import {
  IPlugin,
  Issue,
  DictionaryAwarePlugin,
  ITestQualityPlugin,
  ProjectContext,
  TestFile,
  PluginResult,
  DomainDictionary,
  ContextualAnalysis,
  DomainContext
} from './types';
import { PluginManager } from './pluginManager';
import { DictionaryLoader } from '../dictionary/storage/loader';
import { ContextEngine } from '../dictionary/context/engine';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { PathSecurity } from '../utils/pathSecurity';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 辞書対応プラグインマネージャー
 * 既存のPluginManagerを拡張して、ドメイン辞書機能を統合
 */
export class DictionaryAwarePluginManager extends PluginManager {
  private dictionaryAwarePlugins: Map<string, DictionaryAwarePlugin> = new Map();
  private testQualityPlugins: Map<string, ITestQualityPlugin> = new Map();
  private loadedDictionaries: Map<string, DomainDictionary> = new Map();
  private contextEngines: Map<string, ContextEngine> = new Map();
  private dictionaryEnabled: boolean = false;

  constructor(projectRoot: string = process.cwd()) {
    super(projectRoot);
  }

  /**
   * 辞書対応プラグインの登録
   */
  registerDictionaryAwarePlugin(plugin: DictionaryAwarePlugin): void {
    try {
      // プラグインの基本検証
      this.validatePlugin(plugin);
      
      // 辞書対応プラグインとして登録
      this.dictionaryAwarePlugins.set(plugin.id, plugin);
      
      // 既存のプラグインシステムにも登録（後方互換性のため、analyze メソッドを追加）
      const legacyPlugin: IPlugin = {
        name: plugin.name,
        analyze: async (filePath: string): Promise<Issue[]> => {
          // 従来のIPluginインターフェース用の簡易実装
          try {
            const testFile = await this.prepareTestFile(filePath);
            const dictionary = this.selectDictionary();
            if (dictionary) {
              const analysis = await plugin.analyzeWithContext(testFile, dictionary);
              // ContextualAnalysisをIssue[]に変換
              return analysis.requiredTests.map(test => ({
                type: 'missing-test',
                severity: 'warning' as const,
                message: test.description,
                file: filePath
              }));
            }
            return [];
          } catch (error) {
            return [{
              type: 'plugin-error',
              severity: 'error' as const,
              message: error instanceof Error ? error.message : 'プラグイン実行エラー',
              file: filePath
            }];
          }
        }
      };
      this.register(legacyPlugin);

      console.log(`✅ 辞書対応プラグイン "${plugin.name}" を登録しました`);
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        '辞書対応プラグインの登録に失敗しました',
        { pluginId: plugin.id, pluginName: plugin.name }
      );
    }
  }

  /**
   * テスト品質プラグインの登録
   */
  registerTestQualityPlugin(plugin: ITestQualityPlugin): void {
    try {
      // プラグインの基本検証
      this.validatePlugin(plugin);
      
      this.testQualityPlugins.set(plugin.id, plugin);
      
      console.log(`✅ テスト品質プラグイン "${plugin.name}" を登録しました`);
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        'テスト品質プラグインの登録に失敗しました',
        { pluginId: plugin.id, pluginName: plugin.name }
      );
    }
  }

  /**
   * ドメイン辞書の読み込み
   */
  async loadDictionary(dictionaryPath: string, domain?: string): Promise<boolean> {
    try {
      // パス検証
      const resolvedPath = PathSecurity.safeResolve(dictionaryPath, process.cwd(), 'dictionary-load');
      if (!resolvedPath) {
        throw new Error(`不正な辞書パス: ${dictionaryPath}`);
      }

      // 辞書の読み込み
      const dictionary = await DictionaryLoader.loadFromFile(resolvedPath);
      if (!dictionary) {
        throw new Error(`辞書の読み込みに失敗しました: ${resolvedPath}`);
      }

      // 辞書の登録
      const domainKey = domain || dictionary.domain || 'default';
      this.loadedDictionaries.set(domainKey, dictionary);
      
      // コンテキストエンジンの初期化
      this.contextEngines.set(domainKey, new ContextEngine(dictionary));
      
      this.dictionaryEnabled = true;
      
      console.log(`📚 ドメイン辞書 "${domainKey}" を読み込みました`);
      return true;
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.SYSTEM_ERROR,
        'ドメイン辞書の読み込みに失敗しました',
        { dictionaryPath, domain }
      );
      return false;
    }
  }

  /**
   * すべての辞書対応プラグインを実行
   */
  async runAllWithDictionary(
    filePath: string,
    domain?: string
  ): Promise<{
    legacyResults: Issue[];
    contextualResults: ContextualAnalysis[];
    pluginResults: PluginResult[];
  }> {
    const results = {
      legacyResults: [] as Issue[],
      contextualResults: [] as ContextualAnalysis[],
      pluginResults: [] as PluginResult[]
    };

    try {
      // ファイルパス検証
      const resolvedFilePath = PathSecurity.safeResolve(filePath, process.cwd(), 'dictionary-plugin-analysis');
      if (!resolvedFilePath) {
        throw new Error(`不正なファイルパス: ${filePath}`);
      }

      // ファイル情報の準備
      const testFile = await this.prepareTestFile(resolvedFilePath);
      const projectContext = await this.prepareProjectContext();
      
      // 使用する辞書の決定
      const dictionary = this.selectDictionary(domain);
      
      // 従来のプラグイン実行
      results.legacyResults = await this.runAll(resolvedFilePath);

      // 辞書が利用可能な場合は辞書対応プラグインを実行
      if (dictionary && this.dictionaryEnabled) {
        results.contextualResults = await this.runDictionaryAwarePlugins(testFile, dictionary);
        results.pluginResults = await this.runTestQualityPlugins(testFile, projectContext);
      }

      console.log(`📊 プラグイン分析完了: ${results.legacyResults.length + results.contextualResults.length + results.pluginResults.length} 件の結果`);
      
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        '辞書対応プラグインの実行中にエラーが発生しました',
        { filePath, domain }
      );
    }

    return results;
  }

  /**
   * 特定の辞書対応プラグインを実行
   */
  async runDictionaryAwarePlugin(
    pluginId: string,
    filePath: string,
    domain?: string
  ): Promise<ContextualAnalysis | null> {
    try {
      const plugin = this.dictionaryAwarePlugins.get(pluginId);
      if (!plugin) {
        throw new Error(`辞書対応プラグイン "${pluginId}" が見つかりません`);
      }

      const dictionary = this.selectDictionary(domain);
      if (!dictionary) {
        throw new Error(`ドメイン辞書が見つかりません: ${domain || 'default'}`);
      }

      const testFile = await this.prepareTestFile(filePath);
      
      const startTime = Date.now();
      const result = await plugin.analyzeWithContext(testFile, dictionary);
      const executionTime = Date.now() - startTime;

      console.log(`⚡ プラグイン "${plugin.name}" 実行完了 (${executionTime}ms)`);
      
      return result;
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        '辞書対応プラグインの実行に失敗しました',
        { pluginId, filePath, domain }
      );
      return null;
    }
  }

  /**
   * ドメインコンテキストを使用した品質評価
   */
  async evaluateQualityWithDomain(
    filePath: string,
    domain?: string
  ): Promise<{
    overallScore: number;
    domainSpecificScores: Map<string, any>;
    recommendations: string[];
  }> {
    const results = {
      overallScore: 0,
      domainSpecificScores: new Map(),
      recommendations: [] as string[]
    };

    try {
      const dictionary = this.selectDictionary(domain);
      if (!dictionary) {
        throw new Error(`ドメイン辞書が見つかりません: ${domain || 'default'}`);
      }

      const testFile = await this.prepareTestFile(filePath);
      const domainContext = this.createDomainContext(dictionary);

      let totalScore = 0;
      let pluginCount = 0;

      // 各辞書対応プラグインで評価
      for (const [pluginId, plugin] of this.dictionaryAwarePlugins) {
        try {
          // パターン検出
          const patterns = await plugin.detectPatterns(testFile);
          
          // ドメイン品質評価
          const domainQuality = plugin.evaluateDomainQuality(patterns, domainContext);
          
          results.domainSpecificScores.set(pluginId, domainQuality);
          totalScore += domainQuality.overall;
          pluginCount++;
          
          // 推奨事項を統合
          results.recommendations.push(...domainQuality.recommendations);
        } catch (error) {
          console.warn(`プラグイン ${pluginId} の評価中にエラーが発生しました:`, error);
        }
      }

      results.overallScore = pluginCount > 0 ? Math.round(totalScore / pluginCount) : 0;
      
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PLUGIN_ERROR,
        'ドメイン品質評価中にエラーが発生しました',
        { filePath, domain }
      );
    }

    return results;
  }

  /**
   * 登録済み辞書対応プラグインの一覧取得
   */
  getDictionaryAwarePlugins(): Array<{
    id: string;
    name: string;
    version: string;
    type: string;
  }> {
    return Array.from(this.dictionaryAwarePlugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      type: plugin.type
    }));
  }

  /**
   * 読み込み済み辞書の一覧取得
   */
  getLoadedDictionaries(): Array<{
    domain: string;
    version: string;
    termsCount: number;
    rulesCount: number;
  }> {
    return Array.from(this.loadedDictionaries.entries()).map(([domain, dictionary]) => ({
      domain,
      version: dictionary.version,
      termsCount: dictionary.terms.length,
      rulesCount: dictionary.businessRules.length
    }));
  }

  /**
   * 辞書機能の有効/無効切り替え
   */
  setDictionaryEnabled(enabled: boolean): void {
    this.dictionaryEnabled = enabled;
    console.log(`📚 辞書機能: ${enabled ? '有効' : '無効'}`);
  }

  /**
   * 統計情報の取得
   */
  getEnhancedStats(): {
    basic: any;
    dictionaryAwarePlugins: number;
    testQualityPlugins: number;
    loadedDictionaries: number;
    dictionaryEnabled: boolean;
  } {
    return {
      basic: this.getExecutionStats(),
      dictionaryAwarePlugins: this.dictionaryAwarePlugins.size,
      testQualityPlugins: this.testQualityPlugins.size,
      loadedDictionaries: this.loadedDictionaries.size,
      dictionaryEnabled: this.dictionaryEnabled
    };
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * プラグインの基本検証
   */
  private validatePlugin(plugin: any): void {
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error('プラグインIDが不正です');
    }
    
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('プラグイン名が不正です');
    }
    
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('プラグインバージョンが不正です');
    }
    
    // ID の安全性チェック
    if (!/^[a-zA-Z0-9_-]+$/.test(plugin.id)) {
      throw new Error(`不正なプラグインID: ${plugin.id}`);
    }
  }

  /**
   * TestFileオブジェクトの準備
   */
  private async prepareTestFile(filePath: string): Promise<TestFile> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      content,
      metadata: {
        language: this.detectLanguage(filePath),
        lastModified: stats.mtime
      }
    };
  }

  /**
   * ProjectContextの準備
   */
  private async prepareProjectContext(): Promise<ProjectContext> {
    // 簡易的なプロジェクトコンテキスト生成
    return {
      rootPath: process.cwd(),
      language: 'typescript', // デフォルト
      filePatterns: {
        test: ['**/*.test.ts', '**/*.spec.ts'],
        source: ['src/**/*.ts'],
        ignore: ['node_modules/**', 'dist/**']
      }
    };
  }

  /**
   * 使用する辞書の選択
   */
  private selectDictionary(domain?: string): DomainDictionary | null {
    const key = domain || 'default';
    return this.loadedDictionaries.get(key) || 
           this.loadedDictionaries.values().next().value || 
           null;
  }

  /**
   * DomainContextの作成
   */
  private createDomainContext(dictionary: DomainDictionary): DomainContext {
    return {
      domain: dictionary.domain,
      primaryTerms: dictionary.terms.filter(t => t.importance === 'critical' || t.importance === 'high'),
      activeRules: dictionary.businessRules,
      qualityThreshold: 75
    };
  }

  /**
   * 辞書対応プラグインの実行
   */
  private async runDictionaryAwarePlugins(
    testFile: TestFile,
    dictionary: DomainDictionary
  ): Promise<ContextualAnalysis[]> {
    const results: ContextualAnalysis[] = [];

    for (const [pluginId, plugin] of this.dictionaryAwarePlugins) {
      try {
        const analysis = await plugin.analyzeWithContext(testFile, dictionary);
        results.push(analysis);
      } catch (error) {
        console.warn(`辞書対応プラグイン ${pluginId} の実行中にエラーが発生しました:`, error);
      }
    }

    return results;
  }

  /**
   * テスト品質プラグインの実行
   */
  private async runTestQualityPlugins(
    testFile: TestFile,
    context: ProjectContext
  ): Promise<PluginResult[]> {
    const results: PluginResult[] = [];

    for (const [pluginId, plugin] of this.testQualityPlugins) {
      try {
        const startTime = Date.now();
        
        // プラグインの適用可能性チェック
        if (!plugin.isApplicable(context)) {
          continue;
        }

        // パターン検出
        const patterns = await plugin.detectPatterns(testFile);
        
        // 品質評価
        const qualityScore = plugin.evaluateQuality(patterns);
        
        // 改善提案
        const improvements = plugin.suggestImprovements(qualityScore);
        
        const executionTime = Date.now() - startTime;

        results.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          detectionResults: patterns,
          qualityScore,
          improvements,
          executionTime
        });
      } catch (error) {
        console.warn(`テスト品質プラグイン ${pluginId} の実行中にエラーが発生しました:`, error);
        
        results.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          detectionResults: [],
          qualityScore: { 
            overall: 0, 
            breakdown: {
              completeness: 0,
              correctness: 0,
              maintainability: 0
            }, 
            confidence: 0 
          },
          improvements: [],
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * ファイル拡張子から言語を推定
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts': return 'typescript';
      case '.js': return 'javascript';
      case '.py': return 'python';
      case '.java': return 'java';
      default: return 'other';
    }
  }
}