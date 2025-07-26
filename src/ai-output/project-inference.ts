import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';
import { DependencyAnalyzer } from '../analyzers/dependency';
import { ProjectStructureAnalyzer } from '../analyzers/structure';
import { LanguageAnalyzer } from '../analyzers/code-context/language';

/**
 * プロジェクト推論精度向上エンジン v0.7.0
 * AIによるプロジェクト理解を高めるための高度な推論機能
 */

// プロジェクト推論結果
export interface ProjectInferenceResult {
  // 基本情報
  projectIntent: {
    primaryPurpose: string;
    targetDomain: string;
    architecturalPattern: string;
    confidence: number;
  };
  
  // 技術スタック推論
  technologyStack: {
    framework: string;
    runtime: string;
    database?: string;
    deploymentTarget?: string;
    confidence: number;
  };
  
  // ドメインロジック推論
  domainContext: {
    businessDomain: string;
    keyEntities: string[];
    workflowPatterns: string[];
    dataFlowDirection: 'input-heavy' | 'output-heavy' | 'bidirectional' | 'transformation';
    confidence: number;
  };
  
  // コード品質パターン
  qualityPatterns: {
    testingStrategy: string;
    errorHandlingApproach: string;
    loggingLevel: string;
    performanceCharacteristics: string;
    securityPosture: string;
    confidence: number;
  };
  
  // AI推論支援情報
  aiGuidance: {
    suggestedAnalysisApproach: string;
    keyFocusAreas: string[];
    potentialRiskAreas: string[];
    recommendedImprovements: string[];
    contextualHints: string[];
    confidence: number;
  };
}

export class ProjectInferenceEngine {
  private dependencyAnalyzer: DependencyAnalyzer;
  private structureAnalyzer: ProjectStructureAnalyzer;
  private languageAnalyzer: LanguageAnalyzer;
  
  // プロジェクトパターンデータベース
  private readonly PROJECT_PATTERNS = {
    // 目的別パターン
    purposes: {
      'web-api': {
        indicators: ['express', 'fastify', 'koa', 'nest', 'api', 'server', 'routes', 'middleware'],
        weight: 1.0
      },
      'frontend-app': {
        indicators: ['react', 'vue', 'angular', 'components', 'pages', 'views', 'ui'],
        weight: 1.0
      },
      'data-processing': {
        indicators: ['pandas', 'numpy', 'streams', 'transform', 'pipeline', 'etl'],
        weight: 0.9
      },
      'library': {
        indicators: ['utils', 'helpers', 'core', 'shared', 'common', 'lib'],
        weight: 0.8
      },
      'cli-tool': {
        indicators: ['commander', 'yargs', 'cli', 'command', 'bin'],
        weight: 0.9
      },
      'microservice': {
        indicators: ['service', 'micro', 'docker', 'kubernetes', 'grpc', 'message'],
        weight: 0.8
      }
    },
    
    // アーキテクチャパターン
    architectures: {
      'mvc': {
        indicators: ['model', 'view', 'controller', 'routes', 'models', 'views', 'controllers'],
        weight: 1.0
      },
      'clean-architecture': {
        indicators: ['domain', 'application', 'infrastructure', 'interface', 'entity', 'usecase'],
        weight: 0.9
      },
      'microservices': {
        indicators: ['service', 'gateway', 'discovery', 'registry', 'event', 'message'],
        weight: 0.8
      },
      'layered': {
        indicators: ['layer', 'tier', 'business', 'data', 'presentation'],
        weight: 0.7
      },
      'modular': {
        indicators: ['module', 'feature', 'plugin', 'component', 'extension'],
        weight: 0.8
      }
    },
    
    // ドメイン分類
    domains: {
      'e-commerce': {
        indicators: ['product', 'cart', 'order', 'payment', 'customer', 'inventory', 'shipping'],
        weight: 1.0
      },
      'cms': {
        indicators: ['content', 'article', 'post', 'page', 'media', 'author', 'publish'],
        weight: 0.9
      },
      'finance': {
        indicators: ['account', 'transaction', 'balance', 'payment', 'invoice', 'billing'],
        weight: 0.9
      },
      'healthcare': {
        indicators: ['patient', 'medical', 'doctor', 'treatment', 'diagnosis', 'health'],
        weight: 0.8
      },
      'education': {
        indicators: ['student', 'course', 'lesson', 'grade', 'teacher', 'assignment'],
        weight: 0.8
      },
      'social': {
        indicators: ['user', 'friend', 'message', 'post', 'comment', 'profile', 'social'],
        weight: 0.7
      },
      'iot': {
        indicators: ['device', 'sensor', 'mqtt', 'telemetry', 'data', 'monitoring'],
        weight: 0.8
      }
    }
  };

  constructor() {
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.structureAnalyzer = new ProjectStructureAnalyzer();
    this.languageAnalyzer = new LanguageAnalyzer();
  }

  /**
   * プロジェクト全体を推論分析
   */
  async inferProject(projectPath: string): Promise<ProjectInferenceResult> {
    try {
      // 並列で基本分析を実行
      const [dependencies, structure, codeAnalysis] = await Promise.all([
        this.dependencyAnalyzer.analyzeDependencies(projectPath),
        this.structureAnalyzer.analyzeProjectStructure(projectPath),
        this.analyzeCodePatterns(projectPath)
      ]);

      // 各要素を推論
      const projectIntent = this.inferProjectIntent(projectPath, dependencies, structure, codeAnalysis);
      const technologyStack = this.inferTechnologyStack(dependencies, structure);
      const domainContext = this.inferDomainContext(projectPath, structure, codeAnalysis);
      const qualityPatterns = this.inferQualityPatterns(structure, codeAnalysis);
      const aiGuidance = this.generateAIGuidance(projectIntent, domainContext, qualityPatterns);

      return {
        projectIntent,
        technologyStack,
        domainContext,
        qualityPatterns,
        aiGuidance
      };
    } catch (error) {
      console.warn('プロジェクト推論エラー:', error);
      return this.createFallbackResult(projectPath);
    }
  }

  /**
   * プロジェクトの意図を推論
   */
  private inferProjectIntent(
    projectPath: string,
    dependencies: any,
    structure: any,
    codeAnalysis: any
  ) {
    const indicators: string[] = [];
    
    // 依存関係から指標を抽出
    if (dependencies.projectDependencies) {
      indicators.push(...dependencies.projectDependencies.map((dep: any) => dep.name.toLowerCase()));
    }
    
    // ディレクトリ構造から指標を抽出
    if (structure.directories) {
      indicators.push(...structure.directories.map((dir: any) => 
        path.basename(dir.path).toLowerCase()
      ));
    }
    
    // ファイル名から指標を抽出
    indicators.push(...codeAnalysis.filePatterns);
    
    // パターンマッチング
    let bestPurpose = 'unknown';
    let maxScore = 0;
    let confidence = 0;
    
    for (const [purpose, pattern] of Object.entries(this.PROJECT_PATTERNS.purposes)) {
      const score = this.calculatePatternScore(indicators, pattern.indicators, pattern.weight);
      if (score > maxScore) {
        maxScore = score;
        bestPurpose = purpose;
        confidence = Math.min(score / pattern.indicators.length, 1.0);
      }
    }
    
    // アーキテクチャパターンの推論
    let bestArchitecture = 'unknown';
    let archMaxScore = 0;
    
    for (const [arch, pattern] of Object.entries(this.PROJECT_PATTERNS.architectures)) {
      const score = this.calculatePatternScore(indicators, pattern.indicators, pattern.weight);
      if (score > archMaxScore) {
        archMaxScore = score;
        bestArchitecture = arch;
      }
    }
    
    return {
      primaryPurpose: bestPurpose,
      targetDomain: this.inferTargetDomain(indicators),
      architecturalPattern: bestArchitecture,
      confidence: confidence * 0.8 + (archMaxScore > 0 ? 0.2 : 0)
    };
  }

  /**
   * 技術スタックを推論
   */
  private inferTechnologyStack(dependencies: any, structure: any) {
    const deps = dependencies.projectDependencies?.map((dep: any) => dep.name.toLowerCase()) || [];
    
    let framework = 'unknown';
    let runtime = 'unknown';
    let database = undefined;
    let deploymentTarget = undefined;
    let confidence = 0;
    
    // フレームワーク検出
    const frameworkMap = {
      'express': 'Express.js',
      'fastify': 'Fastify',
      'nest': 'NestJS',
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'next': 'Next.js',
      'nuxt': 'Nuxt.js'
    };
    
    for (const [dep, fw] of Object.entries(frameworkMap)) {
      if (deps.includes(dep)) {
        framework = fw;
        confidence += 0.3;
        break;
      }
    }
    
    // ランタイム検出
    if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
      runtime = 'Node.js';
      confidence += 0.2;
    }
    
    // データベース検出
    const dbMap = {
      'mongodb': 'MongoDB',
      'mongoose': 'MongoDB',
      'mysql': 'MySQL',
      'postgres': 'PostgreSQL',
      'sqlite3': 'SQLite',
      'redis': 'Redis'
    };
    
    for (const [dep, db] of Object.entries(dbMap)) {
      if (deps.includes(dep)) {
        database = db;
        confidence += 0.2;
        break;
      }
    }
    
    // デプロイメント検出
    if (deps.includes('docker') || fs.existsSync(path.join(process.cwd(), 'Dockerfile'))) {
      deploymentTarget = 'Docker';
      confidence += 0.15;
    }
    
    if (deps.includes('aws-sdk') || deps.includes('@aws-sdk')) {
      deploymentTarget = deploymentTarget ? `${deploymentTarget} + AWS` : 'AWS';
      confidence += 0.15;
    }
    
    return {
      framework,
      runtime,
      database,
      deploymentTarget,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * ドメインコンテキストを推論
   */
  private inferDomainContext(projectPath: string, structure: any, codeAnalysis: any) {
    const indicators = [
      ...codeAnalysis.filePatterns,
      ...codeAnalysis.variableNames,
      ...codeAnalysis.functionNames
    ];
    
    // ドメイン推論
    let bestDomain = 'generic';
    let maxScore = 0;
    
    for (const [domain, pattern] of Object.entries(this.PROJECT_PATTERNS.domains)) {
      const score = this.calculatePatternScore(indicators, pattern.indicators, pattern.weight);
      if (score > maxScore) {
        maxScore = score;
        bestDomain = domain;
      }
    }
    
    // エンティティ抽出
    const keyEntities = this.extractKeyEntities(codeAnalysis);
    
    // ワークフローパターン分析
    const workflowPatterns = this.analyzeWorkflowPatterns(codeAnalysis);
    
    // データフロー分析
    const dataFlowDirection = this.analyzeDataFlowDirection(codeAnalysis);
    
    return {
      businessDomain: bestDomain,
      keyEntities,
      workflowPatterns,
      dataFlowDirection,
      confidence: Math.min(maxScore / 3, 1.0)
    };
  }

  /**
   * 品質パターンを推論
   */
  private inferQualityPatterns(structure: any, codeAnalysis: any) {
    let testingStrategy = 'unknown';
    let errorHandlingApproach = 'basic';
    let loggingLevel = 'minimal';
    let performanceCharacteristics = 'standard';
    let securityPosture = 'basic';
    
    // テスト戦略分析
    if (codeAnalysis.testFiles > 0) {
      const testRatio = codeAnalysis.testFiles / Math.max(codeAnalysis.sourceFiles, 1);
      if (testRatio > 0.8) testingStrategy = 'comprehensive';
      else if (testRatio > 0.5) testingStrategy = 'good';
      else if (testRatio > 0.2) testingStrategy = 'partial';
      else testingStrategy = 'minimal';
    }
    
    // エラーハンドリング分析
    if (codeAnalysis.patterns.includes('try-catch') || codeAnalysis.patterns.includes('error-boundary')) {
      errorHandlingApproach = 'structured';
    }
    
    // ロギング分析
    if (codeAnalysis.patterns.includes('logger') || codeAnalysis.patterns.includes('console.log')) {
      loggingLevel = 'active';
    }
    
    // パフォーマンス分析
    if (codeAnalysis.patterns.includes('async') || codeAnalysis.patterns.includes('cache')) {
      performanceCharacteristics = 'optimized';
    }
    
    // セキュリティ分析
    if (codeAnalysis.patterns.includes('auth') || codeAnalysis.patterns.includes('security')) {
      securityPosture = 'enhanced';
    }
    
    return {
      testingStrategy,
      errorHandlingApproach,
      loggingLevel,
      performanceCharacteristics,
      securityPosture,
      confidence: 0.7
    };
  }

  /**
   * AI推論支援情報を生成
   */
  private generateAIGuidance(
    projectIntent: any,
    domainContext: any,
    qualityPatterns: any
  ) {
    const suggestedAnalysisApproach = this.determineBestAnalysisApproach(projectIntent, domainContext);
    const keyFocusAreas = this.identifyKeyFocusAreas(projectIntent, qualityPatterns);
    const potentialRiskAreas = this.identifyRiskAreas(qualityPatterns);
    const recommendedImprovements = this.generateImprovementRecommendations(qualityPatterns);
    const contextualHints = this.generateContextualHints(projectIntent, domainContext);
    
    return {
      suggestedAnalysisApproach,
      keyFocusAreas,
      potentialRiskAreas,
      recommendedImprovements,
      contextualHints,
      confidence: 0.8
    };
  }

  // プライベートヘルパーメソッド

  private async analyzeCodePatterns(projectPath: string): Promise<{
    filePatterns: string[];
    variableNames: string[];
    functionNames: string[];
    patterns: string[];
    testFiles: number;
    sourceFiles: number;
  }> {
    const result = {
      filePatterns: [] as string[],
      variableNames: [] as string[],
      functionNames: [] as string[],
      patterns: [] as string[],
      testFiles: 0,
      sourceFiles: 0
    };

    try {
      const files = this.findAllFiles(projectPath, ['.ts', '.js', '.jsx', '.tsx']);
      
      for (const file of files.slice(0, 50)) { // 最大50ファイル
        const fileName = path.basename(file, path.extname(file));
        result.filePatterns.push(fileName.toLowerCase());
        
        if (fileName.includes('test') || fileName.includes('spec')) {
          result.testFiles++;
        } else {
          result.sourceFiles++;
        }
        
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const language = this.languageAnalyzer.detectLanguage(file);
          
          // 関数とクラス情報を抽出
          const functions = await this.languageAnalyzer.extractFunctionInfo(content, language);
          const classes = this.languageAnalyzer.extractClassInfo(content, language);
          const variables = this.languageAnalyzer.extractVariableInfo(content, language);
          
          result.functionNames.push(...functions.map(f => f.name.toLowerCase()));
          result.variableNames.push(...variables.map(v => v.name.toLowerCase()));
          
          // パターン検出
          if (content.includes('try') && content.includes('catch')) result.patterns.push('try-catch');
          if (content.includes('async') || content.includes('await')) result.patterns.push('async');
          if (content.includes('auth') || content.includes('Auth')) result.patterns.push('auth');
          if (content.includes('log') || content.includes('Log')) result.patterns.push('logger');
          if (content.includes('cache') || content.includes('Cache')) result.patterns.push('cache');
          if (content.includes('security') || content.includes('Security')) result.patterns.push('security');
          
        } catch (error) {
          // ファイル読み込みエラーは無視
        }
      }
    } catch (error) {
      console.warn('コードパターン分析エラー:', error);
    }

    return result;
  }

  private findAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.findAllFiles(fullPath, extensions));
        } else if (extensions.includes(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }
    
    return files;
  }

  private calculatePatternScore(indicators: string[], patterns: string[], weight: number): number {
    const matches = indicators.filter(indicator => 
      patterns.some(pattern => indicator.includes(pattern))
    );
    return matches.length * weight;
  }

  private inferTargetDomain(indicators: string[]): string {
    const domainScores: Record<string, number> = {};
    
    for (const [domain, pattern] of Object.entries(this.PROJECT_PATTERNS.domains)) {
      domainScores[domain] = this.calculatePatternScore(indicators, pattern.indicators, pattern.weight);
    }
    
    const bestDomain = Object.entries(domainScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return bestDomain ? bestDomain[0] : 'generic';
  }

  private extractKeyEntities(codeAnalysis: any): string[] {
    const entities = [...codeAnalysis.variableNames, ...codeAnalysis.functionNames]
      .filter(name => name.length > 3 && !/^(get|set|is|has|can|should|will|test|mock)/.test(name))
      .slice(0, 10);
    
    return [...new Set(entities)];
  }

  private analyzeWorkflowPatterns(codeAnalysis: any): string[] {
    const patterns: string[] = [];
    
    if (codeAnalysis.patterns.includes('async')) patterns.push('asynchronous-processing');
    if (codeAnalysis.functionNames.some((name: string) => name.includes('validate'))) patterns.push('input-validation');
    if (codeAnalysis.functionNames.some((name: string) => name.includes('transform'))) patterns.push('data-transformation');
    if (codeAnalysis.patterns.includes('auth')) patterns.push('authentication-flow');
    
    return patterns;
  }

  private analyzeDataFlowDirection(codeAnalysis: any): 'input-heavy' | 'output-heavy' | 'bidirectional' | 'transformation' {
    const inputPatterns = codeAnalysis.functionNames.filter((name: string) => 
      name.includes('get') || name.includes('read') || name.includes('fetch')
    ).length;
    
    const outputPatterns = codeAnalysis.functionNames.filter((name: string) => 
      name.includes('post') || name.includes('put') || name.includes('send') || name.includes('write')
    ).length;
    
    const transformPatterns = codeAnalysis.functionNames.filter((name: string) => 
      name.includes('transform') || name.includes('convert') || name.includes('process')
    ).length;
    
    if (transformPatterns > Math.max(inputPatterns, outputPatterns)) return 'transformation';
    if (inputPatterns > outputPatterns * 2) return 'input-heavy';
    if (outputPatterns > inputPatterns * 2) return 'output-heavy';
    return 'bidirectional';
  }

  private determineBestAnalysisApproach(projectIntent: any, domainContext: any): string {
    if (projectIntent.primaryPurpose === 'web-api') {
      return 'API エンドポイント中心の分析を推奨。リクエスト/レスポンスの妥当性、エラーハンドリング、セキュリティに重点を置く。';
    } else if (projectIntent.primaryPurpose === 'frontend-app') {
      return 'コンポーネント中心の分析を推奨。ユーザーインタラクション、状態管理、レンダリングロジックに重点を置く。';
    } else if (domainContext.businessDomain !== 'generic') {
      return `${domainContext.businessDomain}ドメイン特有のビジネスロジックに重点を置いた分析を推奨。`;
    }
    return '汎用的な品質分析アプローチを適用。';
  }

  private identifyKeyFocusAreas(projectIntent: any, qualityPatterns: any): string[] {
    const areas: string[] = [];
    
    if (qualityPatterns.testingStrategy === 'minimal') areas.push('テストカバレッジの向上');
    if (qualityPatterns.errorHandlingApproach === 'basic') areas.push('エラーハンドリングの強化');
    if (qualityPatterns.securityPosture === 'basic') areas.push('セキュリティ対策の実装');
    if (projectIntent.primaryPurpose === 'web-api') areas.push('API設計の一貫性');
    
    return areas;
  }

  private identifyRiskAreas(qualityPatterns: any): string[] {
    const risks: string[] = [];
    
    if (qualityPatterns.testingStrategy === 'minimal') risks.push('テスト不足によるリグレッションリスク');
    if (qualityPatterns.errorHandlingApproach === 'basic') risks.push('予期しないエラーによる停止リスク');
    if (qualityPatterns.performanceCharacteristics === 'standard') risks.push('スケーラビリティの制限');
    
    return risks;
  }

  private generateImprovementRecommendations(qualityPatterns: any): string[] {
    const recommendations: string[] = [];
    
    if (qualityPatterns.testingStrategy !== 'comprehensive') {
      recommendations.push('単体テストとエンドツーエンドテストの追加');
    }
    if (qualityPatterns.errorHandlingApproach === 'basic') {
      recommendations.push('構造化されたエラーハンドリングの実装');
    }
    if (qualityPatterns.loggingLevel === 'minimal') {
      recommendations.push('適切なロギング機能の追加');
    }
    
    return recommendations;
  }

  private generateContextualHints(projectIntent: any, domainContext: any): string[] {
    const hints: string[] = [];
    
    hints.push(`このプロジェクトは${projectIntent.primaryPurpose}として設計された${domainContext.businessDomain}ドメインのアプリケーション`);
    hints.push(`主要なエンティティ: ${domainContext.keyEntities.slice(0, 3).join(', ')}`);
    hints.push(`データフロー特性: ${domainContext.dataFlowDirection}`);
    hints.push(`アーキテクチャパターン: ${projectIntent.architecturalPattern}`);
    
    return hints;
  }

  private createFallbackResult(projectPath: string): ProjectInferenceResult {
    return {
      projectIntent: {
        primaryPurpose: 'unknown',
        targetDomain: 'generic',
        architecturalPattern: 'unknown',
        confidence: 0
      },
      technologyStack: {
        framework: 'unknown',
        runtime: 'unknown',
        confidence: 0
      },
      domainContext: {
        businessDomain: 'generic',
        keyEntities: [],
        workflowPatterns: [],
        dataFlowDirection: 'bidirectional',
        confidence: 0
      },
      qualityPatterns: {
        testingStrategy: 'unknown',
        errorHandlingApproach: 'unknown',
        loggingLevel: 'unknown',
        performanceCharacteristics: 'unknown',
        securityPosture: 'unknown',
        confidence: 0
      },
      aiGuidance: {
        suggestedAnalysisApproach: '基本的な分析を実行',
        keyFocusAreas: ['コード品質の基本確認'],
        potentialRiskAreas: ['分析データ不足'],
        recommendedImprovements: ['プロジェクト構造の改善'],
        contextualHints: ['分析結果が限定的です'],
        confidence: 0
      }
    };
  }
}