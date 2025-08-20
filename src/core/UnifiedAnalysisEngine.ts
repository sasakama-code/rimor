import { 
  IPlugin, 
  ITestQualityPlugin, 
  Issue, 
  ProjectContext,
  TestFile,
  DetectionResult,
  QualityScore,
  Improvement,
  PluginResult
} from './types';
import { UnifiedPluginManager } from './UnifiedPluginManager';
import { findTestFiles } from './fileDiscovery';
import { debug } from '../utils/debug';
import * as fs from 'fs/promises';
import * as path from 'path';

// 新しいImplementationTruth分析システム
import { ProductionCodeAnalyzer } from '../analyzers/production-code-analyzer';
import { TestIntentExtractor } from '../intent-analysis/TestIntentExtractor';
import { ImplementationTruth } from '../types/implementation-truth';
import { IntentRealizationResult } from '../types/intent-realization';
import { ASTNode } from './interfaces/IAnalysisEngine';

/**
 * UnifiedAnalysisEngine
 * 
 * analyzer.tsとanalyzerExtended.tsの機能を統合した統一分析エンジン
 * SOLID原則に準拠した設計
 * 
 * @version 0.9.0
 */

// 定数定義（マジックナンバーの除去）
const DEFAULT_TIMEOUT_MS = 30000;
const SCORE_THRESHOLD = {
  EXCELLENT: 90,
  GOOD: 70,
  FAIR: 50
} as const;
const MAX_DEPTH = 20;
const LOW_QUALITY_CONFIDENCE_THRESHOLD = 0.5;
const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
} as const;

// analyzer.tsのAnalysisResult型
export interface BasicAnalysisResult {
  totalFiles: number;
  issues: Issue[];
  executionTime: number;
  errors?: Array<{ pluginName: string; error: string }>;
}

// analyzerExtended.tsのExtendedAnalysisResult型
export interface ExtendedAnalysisResult {
  filePath: string;
  qualityAnalysis: QualityAnalysisResult;
  aggregatedScore: QualityScore;
  recommendations: Improvement[];
  executionTime: number;
}

// 統合分析結果型
export interface UnifiedAnalysisResult {
  basicAnalysis: BasicAnalysisResult;
  qualityAnalysis?: QualityAnalysisResult;
  combinedScore?: QualityScore;
  allIssues: Issue[];
}

// 新しいImplementationTruth分析結果型
export interface ImplementationTruthAnalysisResult {
  implementationTruth: ImplementationTruth;
  intentRealizationResults: IntentRealizationResult[];
  overallScore: number;
  totalGapsDetected: number;
  highSeverityGaps: number;
  executionTime: number;
  summary: {
    productionFilesAnalyzed: number;
    testFilesAnalyzed: number;
    vulnerabilitiesDetected: number;
    realizationScore: number;
    topRecommendations: string[];
  };
}

// バッチ分析サマリー型
export interface BatchAnalysisSummary {
  totalFiles: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  files: ExtendedAnalysisResult[];
  executionTime: number;
}

// 品質分析結果型
export interface QualityAnalysisResult {
  pluginResults: PluginResult[];
  executionStats: {
    totalPlugins: number;
    successfulPlugins: number;
    failedPlugins: number;
    totalExecutionTime: number;
  };
}

// 設定オプション型
export interface AnalysisOptions {
  timeout?: number;
  skipPlugins?: string[];
  parallelExecution?: boolean;
}

/**
 * 統一分析エンジンクラス
 */
export class UnifiedAnalysisEngine {
  private legacyPluginManager: UnifiedPluginManager;
  private qualityPluginManager: UnifiedPluginManager;
  private configuration: AnalysisOptions;
  private customPlugins: Map<string, IPlugin | ITestQualityPlugin>;

  constructor() {
    this.legacyPluginManager = new UnifiedPluginManager();
    this.qualityPluginManager = new UnifiedPluginManager();
    this.customPlugins = new Map();
    this.configuration = {
      timeout: DEFAULT_TIMEOUT_MS,
      skipPlugins: [],
      parallelExecution: false
    };
  }

  /**
   * レガシープラグイン（IPlugin）の登録
   */
  registerPlugin(plugin: IPlugin): void {
    this.legacyPluginManager.register(plugin);
  }

  /**
   * 品質プラグイン（ITestQualityPlugin）の登録
   */
  registerQualityPlugin(plugin: ITestQualityPlugin): void {
    this.qualityPluginManager.registerPlugin(plugin);
  }

  /**
   * カスタムプラグインの登録（拡張性のため）
   */
  registerCustomPlugin(plugin: IPlugin | ITestQualityPlugin): void {
    // 開放閉鎖原則に従い、新しいプラグインタイプを追加可能にする
    if (this.isValidPlugin(plugin)) {
      // ITestQualityPluginの場合はidを持つ
      const pluginId = ('id' in plugin ? plugin.id : undefined) || plugin.name || `custom-${Date.now()}`;
      this.customPlugins.set(pluginId, plugin);
      debug.info(`Custom plugin registered: ${pluginId}`);
    } else {
      debug.warn('Invalid plugin structure');
    }
  }

  /**
   * プラグインの妥当性チェック
   */
  private isValidPlugin(plugin: unknown): boolean {
    if (!plugin || typeof plugin !== 'object') {
      return false;
    }
    
    const p = plugin as Record<string, unknown>;
    return (typeof p.analyze === 'function' || 
            typeof p.detectPatterns === 'function');
  }

  /**
   * テストファイルの収集（Extract Method - Martin Fowler）
   */
  private async collectTestFiles(targetPath: string): Promise<string[]> {
    const testFiles: string[] = [];
    for await (const file of findTestFiles(targetPath)) {
      testFiles.push(file);
    }
    
    // ファイルが見つからない場合は、targetPath自体を対象とする
    if (testFiles.length === 0) {
      testFiles.push(targetPath);
    }
    
    return testFiles;
  }

  /**
   * プラグインを実行すべきか判定（Extract Method）
   */
  private shouldRunPlugin(plugin: IPlugin): boolean {
    return !this.configuration.skipPlugins?.includes(plugin.name);
  }

  /**
   * プラグインの安全な実行（Extract Method）
   */
  private async runPluginSafely(plugin: IPlugin, file: string): Promise<{ issues: Issue[], error: { pluginName: string; error: string } | null }> {
    try {
      const issues = await this.runWithTimeout(
        plugin.analyze(file),
        this.configuration.timeout || DEFAULT_TIMEOUT_MS
      );
      return { issues, error: null };
    } catch (error) {
      const errorInfo = this.createErrorInfo(plugin.name, error);
      debug.warn(`Plugin ${plugin.name} failed: ${error}`);
      return { issues: [], error: errorInfo };
    }
  }

  /**
   * エラー情報の作成（Extract Method）
   */
  private createErrorInfo(pluginName: string, error: unknown): { pluginName: string; error: string } {
    return {
      pluginName,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  /**
   * 基本分析（analyzer.tsの機能）
   */
  async analyze(targetPath: string): Promise<BasicAnalysisResult> {
    return debug.measureAsync('analyze', async () => {
      debug.info(`Starting basic analysis of: ${targetPath}`);
      
      const startTime = Date.now();
      const allIssues: Issue[] = [];
      const errors: Array<{ pluginName: string; error: string }> = [];
      let fileCount = 0;

      try {
        const testFiles = await this.collectTestFiles(targetPath);
        fileCount = testFiles.length;

        for (const file of testFiles) {
          const results = await this.runPluginsForFile(file);
          allIssues.push(...results.issues);
          errors.push(...results.errors);
        }
      } catch (error) {
        debug.error(`Analysis failed: ${error}`);
      }

      const executionTime = Date.now() - startTime;
      
      return {
        totalFiles: fileCount,
        issues: allIssues,
        executionTime,
        errors: errors // 常にerrorsプロパティを含める（空配列でも）
      };
    });
  }

  /**
   * ファイルに対してプラグインを実行（Extract Method）
   */
  private async runPluginsForFile(file: string): Promise<{ issues: Issue[], errors: Array<{ pluginName: string; error: string }> }> {
    const plugins = this.legacyPluginManager.getLegacyPlugins();
    const issues: Issue[] = [];
    const errors: Array<{ pluginName: string; error: string }> = [];

    if (this.configuration.parallelExecution) {
      // 並列実行
      const promises = plugins
        .filter(plugin => this.shouldRunPlugin(plugin))
        .map(plugin => this.runPluginSafely(plugin, file));
      
      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.error) {
          errors.push(result.error);
        } else {
          issues.push(...result.issues);
        }
      }
    } else {
      // シーケンシャル実行
      for (const plugin of plugins) {
        if (!this.shouldRunPlugin(plugin)) {
          continue;
        }
        const result = await this.runPluginSafely(plugin, file);
        if (result.error) {
          errors.push(result.error);
        } else {
          issues.push(...result.issues);
        }
      }
    }

    return { issues, errors };
  }

  /**
   * 品質分析（analyzerExtended.tsの機能）
   */
  async analyzeWithQuality(filePath: string): Promise<ExtendedAnalysisResult> {
    const startTime = Date.now();
    
    // プロジェクトコンテキストの作成
    const projectContext: ProjectContext = {
      rootPath: path.dirname(filePath),
      testFramework: 'jest', // 仮の値
      language: path.extname(filePath).slice(1) as 'javascript' | 'typescript' | 'python' | 'java' | 'other'
    };

    // テストファイル情報の作成
    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      // ファイルが存在しない場合は空の内容を使用
      debug.warn(`File not found: ${filePath}, using empty content`);
    }
    const testFile: TestFile = {
      path: filePath,
      content
    };

    // 品質分析の実行
    const qualityAnalysis = await this.qualityPluginManager.analyzeFileQuality(
      testFile,
      projectContext,
      this.configuration
    );

    // スコアの集約
    const aggregatedScore = this.aggregateScores(qualityAnalysis.pluginResults);

    // 改善提案の収集
    const recommendations = this.collectRecommendations(qualityAnalysis.pluginResults);

    const executionTime = Date.now() - startTime;

    return {
      filePath,
      qualityAnalysis,
      aggregatedScore,
      recommendations,
      executionTime
    };
  }

  /**
   * バッチ分析
   */
  async analyzeBatch(filePaths: string[]): Promise<BatchAnalysisSummary> {
    const startTime = Date.now();
    const results: ExtendedAnalysisResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.analyzeWithQuality(filePath);
        results.push(result);
      } catch (error) {
        debug.warn(`Failed to analyze ${filePath}: ${error}`);
      }
    }

    const scores = results.map(r => r.aggregatedScore.overall);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    const scoreDistribution = {
      excellent: scores.filter(s => s >= SCORE_THRESHOLD.EXCELLENT).length,
      good: scores.filter(s => s >= SCORE_THRESHOLD.GOOD && s < SCORE_THRESHOLD.EXCELLENT).length,
      fair: scores.filter(s => s >= SCORE_THRESHOLD.FAIR && s < SCORE_THRESHOLD.GOOD).length,
      poor: scores.filter(s => s < SCORE_THRESHOLD.FAIR).length
    };

    const executionTime = Date.now() - startTime;

    return {
      totalFiles: filePaths.length,
      averageScore,
      scoreDistribution,
      files: results,
      executionTime
    };
  }

  /**
   * 統合分析（新機能）
   */
  async analyzeUnified(targetPath: string): Promise<UnifiedAnalysisResult> {
    const [basicAnalysis, qualityResults] = await Promise.all([
      this.analyze(targetPath),
      this.analyzeAllWithQuality(targetPath)
    ]);

    const combinedScore = qualityResults.length > 0
      ? this.aggregateScores(qualityResults.flatMap(r => r.qualityAnalysis.pluginResults))
      : undefined;

    // qualityAnalysisを必ず返す
    const qualityAnalysis = qualityResults[0]?.qualityAnalysis || {
      pluginResults: [],
      executionStats: {
        totalPlugins: 0,
        successfulPlugins: 0,
        failedPlugins: 0,
        totalExecutionTime: 0
      }
    };

    // combinedScoreを必ず返す（デフォルト値を設定）
    const finalCombinedScore: QualityScore = combinedScore || {
      overall: 0,
      dimensions: { completeness: 0, correctness: 0, maintainability: 0 },
      confidence: 0
    };

    // allIssuesにエラー情報も含める
    const allIssues = [
      ...basicAnalysis.issues,
      ...this.extractIssuesFromQualityResults(qualityResults)
    ];
    
    // エラーがあればissueとして追加
    if (basicAnalysis.errors && basicAnalysis.errors.length > 0) {
      for (const error of basicAnalysis.errors) {
        allIssues.push({
          type: 'error',
          severity: 'high',
          message: `Plugin error in ${error.pluginName}: ${error.error}`,
          filePath: targetPath,
          file: targetPath,
          line: 0,
          column: 0,
          category: 'structure'
        } as Issue);
      }
    }

    return {
      basicAnalysis,
      qualityAnalysis,
      combinedScore: finalCombinedScore,
      allIssues
    };
  }

  /**
   * プラグイン数の取得
   */
  getPluginCount(): number {
    const legacyCount = this.legacyPluginManager.getLegacyPlugins().length;
    const qualityCount = this.qualityPluginManager.getQualityPlugins().length;
    const customCount = this.customPlugins.size;
    return legacyCount + qualityCount + customCount;
  }

  /**
   * 品質プラグインの取得
   */
  getQualityPlugins(): ITestQualityPlugin[] {
    return this.qualityPluginManager.getQualityPlugins();
  }

  /**
   * 設定の適用
   */
  configure(options: AnalysisOptions): void {
    this.configuration = {
      ...this.configuration,
      ...options
    };
  }

  /**
   * 現在の設定を取得
   */
  getConfiguration(): AnalysisOptions {
    return { ...this.configuration };
  }

  // ===== Private Helper Methods =====

  async analyzeAllWithQuality(targetPath: string): Promise<ExtendedAnalysisResult[]> {
    const testFiles: string[] = [];
    for await (const file of findTestFiles(targetPath)) {
      testFiles.push(file);
    }
    const results: ExtendedAnalysisResult[] = [];

    for (const file of testFiles) {
      try {
        const result = await this.analyzeWithQuality(file);
        results.push(result);
      } catch (error) {
        debug.warn(`Failed to analyze ${file}: ${error}`);
      }
    }

    return results;
  }

  /**
   * 新しいImplementationTruth分析フロー
   * v0.9.0 - AIコーディング時代の品質保証エンジンへの進化
   * 
   * プロダクションコード解析 → テスト意図抽出 → ギャップ分析の統合フロー
   */
  async analyzeWithImplementationTruth(
    productionCodePath: string,
    testCodePath?: string
  ): Promise<ImplementationTruthAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // 1. プロダクションコード解析でImplementationTruthを確立
      const productionAnalyzer = new ProductionCodeAnalyzer();
      const implementationTruth = await productionAnalyzer.analyzeProductionCode(productionCodePath);
      
      // 2. テストファイルの収集
      const testFiles = testCodePath 
        ? [testCodePath]
        : await this.collectTestFiles(productionCodePath);
      
      // 3. 各テストファイルに対して意図実現度分析
      const intentExtractor = new TestIntentExtractor();
      const intentRealizationResults: IntentRealizationResult[] = [];
      
      for (const testFile of testFiles) {
        try {
          // 簡易ASTノード作成（実際の実装では適切なパーサーを使用）
          const dummyAst: ASTNode = {
            type: 'Program',
            text: 'test',
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 0, column: 4 },
            children: []
          };
          
          const result = await intentExtractor.analyzeIntentRealization(
            testFile,
            dummyAst,
            implementationTruth
          );
          
          intentRealizationResults.push(result);
          
        } catch (error) {
          debug.warn(`Failed to analyze test file ${testFile}: ${error}`);
        }
      }
      
      // 4. 総合評価の計算
      const overallScore = this.calculateOverallScore(intentRealizationResults);
      const totalGapsDetected = intentRealizationResults.reduce((sum, result) => 
        sum + result.gaps.length, 0);
      const highSeverityGaps = intentRealizationResults.reduce((sum, result) => 
        sum + result.gaps.filter(gap => gap.severity === 'critical' || gap.severity === 'high').length, 0);
      
      // 5. サマリーの生成
      const summary = {
        productionFilesAnalyzed: 1,
        testFilesAnalyzed: testFiles.length,
        vulnerabilitiesDetected: implementationTruth.vulnerabilities.length,
        realizationScore: overallScore,
        topRecommendations: this.extractTopRecommendations(intentRealizationResults)
      };
      
      const executionTime = Date.now() - startTime;
      
      return {
        implementationTruth,
        intentRealizationResults,
        overallScore,
        totalGapsDetected,
        highSeverityGaps,
        executionTime,
        summary
      };
      
    } catch (error) {
      debug.error(`ImplementationTruth analysis failed: ${error}`);
      throw error;
    }
  }

  /**
   * 意図実現度結果から総合スコアを計算
   */
  private calculateOverallScore(results: IntentRealizationResult[]): number {
    if (results.length === 0) return 0;
    
    const totalScore = results.reduce((sum, result) => sum + result.realizationScore, 0);
    return totalScore / results.length;
  }

  /**
   * トップレコメンデーションの抽出
   */
  private extractTopRecommendations(results: IntentRealizationResult[]): string[] {
    const allRecommendations = results.flatMap(result => 
      result.recommendations.map(rec => rec.description)
    );
    
    // 上位3つの推奨事項を返す
    return allRecommendations.slice(0, 3);
  }

  aggregateScores(pluginResults: PluginResult[]): QualityScore {
    if (pluginResults.length === 0) {
      return {
        overall: 0,
        dimensions: { completeness: 0, correctness: 0, maintainability: 0 },
        confidence: 0
      };
    }

    const scores = pluginResults.map(r => r.qualityScore);
    const weights = scores.map(s => s.confidence || 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const overall = scores.reduce((sum, score, index) => 
      sum + score.overall * weights[index], 0) / totalWeight;

    const dimensions = {
      completeness: scores.reduce((sum, score, index) => 
        sum + (score.dimensions?.completeness || 0) * weights[index], 0) / totalWeight,
      correctness: scores.reduce((sum, score, index) => 
        sum + (score.dimensions?.correctness || 0) * weights[index], 0) / totalWeight,
      maintainability: scores.reduce((sum, score, index) => 
        sum + (score.dimensions?.maintainability || 0) * weights[index], 0) / totalWeight
    };

    return {
      overall,
      dimensions,
      breakdown: {
        completeness: dimensions.completeness,
        correctness: dimensions.correctness,
        maintainability: dimensions.maintainability
      },
      confidence: totalWeight / pluginResults.length
    };
  }

  private collectRecommendations(pluginResults: PluginResult[]): Improvement[] {
    return pluginResults.flatMap(r => r.improvements);
  }

  /**
   * 推奨事項の集約
   */
  aggregateRecommendations(recommendations: Improvement[][]): Improvement[] {
    const uniqueRecommendations = new Map<string, Improvement>();
    
    for (const group of recommendations) {
      for (const rec of group) {
        const key = rec.id || rec.title;
        if (!uniqueRecommendations.has(key)) {
          uniqueRecommendations.set(key, rec);
        }
      }
    }
    
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => {
        // 優先度でソート
        return (PRIORITY_ORDER[a.priority] || 999) - (PRIORITY_ORDER[b.priority] || 999);
      });
  }

  private extractIssuesFromQualityResults(results: ExtendedAnalysisResult[]): Issue[] {
    const issues: Issue[] = [];

    for (const result of results) {
      for (const pluginResult of result.qualityAnalysis.pluginResults) {
        issues.push(...this.extractIssuesFromPatterns(pluginResult.detectionResults));
      }
    }

    return issues;
  }

  /**
   * パターンからIssueを抽出（Extract Method）
   */
  private extractIssuesFromPatterns(patterns: DetectionResult[]): Issue[] {
    const issues: Issue[] = [];
    
    for (const pattern of patterns) {
      if (this.isLowQualityPattern(pattern)) {
        issues.push(this.createQualityIssue(pattern));
      }
    }
    
    return issues;
  }

  /**
   * 低品質パターンかどうか判定（Extract Method）
   */
  private isLowQualityPattern(pattern: DetectionResult): boolean {
    return pattern.confidence < LOW_QUALITY_CONFIDENCE_THRESHOLD && !!pattern.location;
  }

  /**
   * 品質Issueを作成（Extract Method）
   */
  private createQualityIssue(pattern: DetectionResult): Issue {
    const filePath = pattern.location?.file || '';
    return {
      type: 'quality',
      severity: 'medium',
      message: `Low quality pattern detected: ${pattern.patternName || pattern.patternId || 'unknown'}`,
      filePath,
      file: filePath,
      line: pattern.location?.line || 0,
      column: pattern.location?.column,
      category: 'pattern'
    } as Issue;
  }

  private async runWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }
}