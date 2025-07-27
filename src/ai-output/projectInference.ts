import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';

/**
 * プロジェクト推論システム v0.6.0
 * プロジェクトの詳細な分析によりAI出力の精度を向上
 */

export interface ProjectInferenceResult {
  projectType: ProjectType;
  language: PrimaryLanguage;
  testFramework: TestFramework;
  buildTool: BuildTool;
  architecturePattern: ArchitecturePattern;
  frameworks: DetectedFramework[];
  confidence: number;
  evidence: InferenceEvidence;
}

export interface ProjectType {
  type: 'frontend' | 'backend' | 'fullstack' | 'library' | 'cli-tool' | 'mobile' | 'desktop' | 'microservice' | 'monorepo' | 'unknown';
  subtype?: string;
  confidence: number;
}

export interface PrimaryLanguage {
  language: string;
  version?: string;
  confidence: number;
  distribution: { [lang: string]: number };
}

export interface TestFramework {
  framework: 'jest' | 'mocha' | 'vitest' | 'cypress' | 'playwright' | 'jasmine' | 'tap' | 'unknown';
  version?: string;
  confidence: number;
  additionalFrameworks: string[];
}

export interface BuildTool {
  tool: 'webpack' | 'vite' | 'rollup' | 'parcel' | 'tsc' | 'esbuild' | 'swc' | 'babel' | 'unknown';
  version?: string;
  confidence: number;
}

export interface ArchitecturePattern {
  pattern: 'mvc' | 'mvvm' | 'clean-architecture' | 'hexagonal' | 'microservices' | 'layered' | 'modular' | 'monolithic' | 'unknown';
  confidence: number;
  characteristics: string[];
}

export interface DetectedFramework {
  name: string;
  category: 'web' | 'testing' | 'ui' | 'state-management' | 'routing' | 'orm' | 'http' | 'other';
  confidence: number;
}

export interface InferenceEvidence {
  packageJsonAnalysis: {
    dependencies: string[];
    devDependencies: string[];
    scripts: string[];
    keywords: string[];
  };
  fileStructureAnalysis: {
    directories: string[];
    keyFiles: string[];
    patterns: string[];
  };
  configurationAnalysis: {
    configFiles: string[];
    buildConfigs: string[];
    testConfigs: string[];
  };
  codeAnalysis: {
    importPatterns: string[];
    architecturalPatterns: string[];
    testPatterns: string[];
  };
}

/**
 * 高度なプロジェクト推論エンジン
 */
export class ProjectInferenceEngine {
  private readonly PROJECT_TYPE_CONFIDENCE_THRESHOLD = 0.7;
  private readonly FRAMEWORK_CONFIDENCE_THRESHOLD = 0.6;
  
  /**
   * プロジェクトの包括的推論を実行
   */
  async inferProject(projectPath: string): Promise<ProjectInferenceResult> {
    const evidence = await this.gatherEvidence(projectPath);
    
    const projectType = this.inferProjectType(evidence);
    const language = this.inferPrimaryLanguage(evidence, projectPath);
    const testFramework = this.inferTestFramework(evidence);
    const buildTool = this.inferBuildTool(evidence);
    const architecturePattern = this.inferArchitecturePattern(evidence);
    const frameworks = this.inferFrameworks(evidence);
    
    const overallConfidence = this.calculateOverallConfidence([
      projectType.confidence,
      language.confidence,
      testFramework.confidence,
      buildTool.confidence,
      architecturePattern.confidence
    ]);
    
    return {
      projectType,
      language,
      testFramework,
      buildTool,
      architecturePattern,
      frameworks,
      confidence: overallConfidence,
      evidence
    };
  }
  
  /**
   * エビデンス収集
   */
  private async gatherEvidence(projectPath: string): Promise<InferenceEvidence> {
    const evidence: InferenceEvidence = {
      packageJsonAnalysis: {
        dependencies: [],
        devDependencies: [],
        scripts: [],
        keywords: []
      },
      fileStructureAnalysis: {
        directories: [],
        keyFiles: [],
        patterns: []
      },
      configurationAnalysis: {
        configFiles: [],
        buildConfigs: [],
        testConfigs: []
      },
      codeAnalysis: {
        importPatterns: [],
        architecturalPatterns: [],
        testPatterns: []
      }
    };
    
    // package.json分析
    await this.analyzePackageJson(projectPath, evidence);
    
    // ファイル構造分析
    await this.analyzeFileStructure(projectPath, evidence);
    
    // 設定ファイル分析
    await this.analyzeConfigurations(projectPath, evidence);
    
    // コード分析（サンプリング）
    await this.analyzeCodePatterns(projectPath, evidence);
    
    return evidence;
  }
  
  /**
   * package.json詳細分析
   */
  private async analyzePackageJson(projectPath: string, evidence: InferenceEvidence): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) return;
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      evidence.packageJsonAnalysis.dependencies = Object.keys(packageJson.dependencies || {});
      evidence.packageJsonAnalysis.devDependencies = Object.keys(packageJson.devDependencies || {});
      evidence.packageJsonAnalysis.scripts = Object.keys(packageJson.scripts || {});
      evidence.packageJsonAnalysis.keywords = packageJson.keywords || [];
    } catch (error) {
      // エラーは無視
    }
  }
  
  /**
   * ファイル構造分析
   */
  private async analyzeFileStructure(projectPath: string, evidence: InferenceEvidence): Promise<void> {
    try {
      const entries = fs.readdirSync(projectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        if (entry.isDirectory()) {
          evidence.fileStructureAnalysis.directories.push(entry.name);
          
          // 特徴的なディレクトリパターンを検出
          const patterns = this.detectDirectoryPatterns(entry.name);
          evidence.fileStructureAnalysis.patterns.push(...patterns);
        } else {
          // 重要なファイルを記録
          if (this.isKeyFile(entry.name)) {
            evidence.fileStructureAnalysis.keyFiles.push(entry.name);
          }
        }
      }
    } catch (error) {
      // エラーは無視
    }
  }
  
  /**
   * 設定ファイル分析
   */
  private async analyzeConfigurations(projectPath: string, evidence: InferenceEvidence): Promise<void> {
    const configFiles = [
      'tsconfig.json', 'jsconfig.json',
      'webpack.config.js', 'vite.config.js', 'rollup.config.js',
      'jest.config.js', 'cypress.config.js', 'playwright.config.js',
      '.eslintrc.js', '.eslintrc.json', 'prettier.config.js',
      'babel.config.js', '.babelrc', 'postcss.config.js',
      'tailwind.config.js', 'next.config.js', 'nuxt.config.js'
    ];
    
    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (fs.existsSync(configPath)) {
        evidence.configurationAnalysis.configFiles.push(configFile);
        
        // カテゴライズ
        if (this.isBuildConfig(configFile)) {
          evidence.configurationAnalysis.buildConfigs.push(configFile);
        }
        if (this.isTestConfig(configFile)) {
          evidence.configurationAnalysis.testConfigs.push(configFile);
        }
      }
    }
  }
  
  /**
   * コードパターン分析（サンプリング）
   */
  private async analyzeCodePatterns(projectPath: string, evidence: InferenceEvidence): Promise<void> {
    try {
      const sourceFiles = this.findSourceFiles(projectPath, 10); // 最大10ファイルをサンプル
      
      for (const filePath of sourceFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // インポートパターン分析
        const imports = this.extractImportPatterns(content);
        evidence.codeAnalysis.importPatterns.push(...imports);
        
        // アーキテクチャパターン検出
        const archPatterns = this.detectArchitecturalPatterns(content, filePath);
        evidence.codeAnalysis.architecturalPatterns.push(...archPatterns);
        
        // テストパターン検出
        if (this.isTestFile(filePath)) {
          const testPatterns = this.detectTestPatterns(content);
          evidence.codeAnalysis.testPatterns.push(...testPatterns);
        }
      }
    } catch (error) {
      // エラーは無視
    }
  }
  
  /**
   * プロジェクトタイプ推論
   */
  private inferProjectType(evidence: InferenceEvidence): ProjectType {
    const { dependencies, devDependencies, scripts } = evidence.packageJsonAnalysis;
    const { directories } = evidence.fileStructureAnalysis;
    
    let scores = {
      frontend: 0,
      backend: 0,
      fullstack: 0,
      library: 0,
      'cli-tool': 0,
      mobile: 0,
      desktop: 0,
      microservice: 0,
      monorepo: 0
    };
    
    // フロントエンドの指標
    if (dependencies.includes('react') || dependencies.includes('vue') || dependencies.includes('angular')) {
      scores.frontend += 40;
    }
    if (dependencies.includes('next') || dependencies.includes('nuxt') || dependencies.includes('gatsby')) {
      scores.frontend += 30;
      scores.fullstack += 20; // SSRフレームワークはフルスタックの可能性
    }
    if (devDependencies.includes('webpack') || devDependencies.includes('vite') || devDependencies.includes('parcel')) {
      scores.frontend += 20;
    }
    if (directories.includes('public') || directories.includes('static') || directories.includes('assets')) {
      scores.frontend += 15;
    }
    
    // バックエンドの指標
    if (dependencies.includes('express') || dependencies.includes('fastify') || dependencies.includes('koa')) {
      scores.backend += 40;
    }
    if (dependencies.includes('mongoose') || dependencies.includes('sequelize') || dependencies.includes('prisma')) {
      scores.backend += 25;
    }
    if (directories.includes('api') || directories.includes('routes') || directories.includes('controllers')) {
      scores.backend += 20;
    }
    if (scripts.includes('start')) {
      scores.backend += 15;
    }
    
    // ライブラリの指標
    if (scripts.includes('build')) {
      scores.library += 30;
    }
    if (evidence.packageJsonAnalysis.keywords.some(k => ['library', 'lib', 'util', 'helper'].includes(k))) {
      scores.library += 25;
    }
    if (directories.includes('lib') || directories.includes('dist')) {
      scores.library += 20;
    }
    
    // CLIツールの指標
    if (dependencies.includes('commander') || dependencies.includes('yargs') || dependencies.includes('inquirer')) {
      scores['cli-tool'] += 35;
    }
    if (scripts.includes('start')) {
      scores['cli-tool'] += 25;
    }
    
    // モバイルアプリの指標
    if (dependencies.includes('react-native') || dependencies.includes('expo')) {
      scores.mobile += 45;
    }
    if (directories.includes('android') || directories.includes('ios')) {
      scores.mobile += 30;
    }
    
    // マイクロサービスの指標
    if (dependencies.includes('docker') || evidence.configurationAnalysis.configFiles.includes('docker-compose.yml')) {
      scores.microservice += 25;
    }
    if (directories.includes('services') && directories.length < 8) {
      scores.microservice += 20;
    }
    
    // モノレポの指標
    if (evidence.configurationAnalysis.configFiles.includes('lerna.json') || 
        evidence.configurationAnalysis.configFiles.includes('nx.json')) {
      scores.monorepo += 40;
    }
    if (directories.includes('packages') || directories.includes('apps')) {
      scores.monorepo += 30;
    }
    
    // 最高スコアを取得
    const entries = Object.entries(scores);
    const topType = entries.length > 0 
      ? entries.reduce((a, b) => a[1] > b[1] ? a : b)
      : ['unknown', 0];
    const maxScore = topType[1] as number;
    const confidence = Math.min(maxScore / 100, 1.0);
    
    return {
      type: topType[0] as ProjectType['type'],
      confidence,
      subtype: this.inferSubtype(topType[0] as string, evidence)
    };
  }
  
  /**
   * 主要言語推論
   */
  private inferPrimaryLanguage(evidence: InferenceEvidence, projectPath: string): PrimaryLanguage {
    const distribution: { [lang: string]: number } = {};
    
    // 設定ファイルから推論
    if (evidence.configurationAnalysis.configFiles.includes('tsconfig.json')) {
      distribution.typescript = 60;
    }
    if (evidence.configurationAnalysis.configFiles.includes('jsconfig.json')) {
      distribution.javascript = 40;
    }
    
    // 依存関係から推論
    const { dependencies, devDependencies } = evidence.packageJsonAnalysis;
    if (dependencies.includes('typescript') || devDependencies.includes('typescript')) {
      distribution.typescript = (distribution.typescript || 0) + 30;
    }
    
    // ファイル拡張子から推論（サンプリング）
    try {
      const sourceFiles = this.findSourceFiles(projectPath, 20);
      const extCounts: { [ext: string]: number } = {};
      
      for (const file of sourceFiles) {
        const ext = path.extname(file);
        extCounts[ext] = (extCounts[ext] || 0) + 1;
      }
      
      const totalFiles = sourceFiles.length;
      if (totalFiles > 0) {
        if (extCounts['.ts'] || extCounts['.tsx']) {
          distribution.typescript = (distribution.typescript || 0) + (extCounts['.ts'] + (extCounts['.tsx'] || 0)) / totalFiles * 40;
        }
        if (extCounts['.js'] || extCounts['.jsx']) {
          distribution.javascript = (distribution.javascript || 0) + (extCounts['.js'] + (extCounts['.jsx'] || 0)) / totalFiles * 30;
        }
        if (extCounts['.py']) {
          distribution.python = (distribution.python || 0) + extCounts['.py'] / totalFiles * 40;
        }
      }
    } catch (error) {
      // エラーは無視
    }
    
    const entries = Object.entries(distribution);
    const primaryLang = entries.length > 0 
      ? entries.reduce((a, b) => distribution[a[0]] > distribution[b[0]] ? a : b)
      : ['javascript', 0];
    const confidence = Math.min((primaryLang[1] as number || 0) / 100, 1.0);
    
    return {
      language: primaryLang[0] as string || 'javascript',
      confidence,
      distribution
    };
  }
  
  /**
   * テストフレームワーク推論
   */
  private inferTestFramework(evidence: InferenceEvidence): TestFramework {
    const { dependencies, devDependencies } = evidence.packageJsonAnalysis;
    const { configFiles } = evidence.configurationAnalysis;
    const { testPatterns } = evidence.codeAnalysis;
    
    let scores = {
      jest: 0,
      mocha: 0,
      vitest: 0,
      cypress: 0,
      playwright: 0,
      jasmine: 0,
      tap: 0
    };
    
    // 依存関係からのスコア
    if (dependencies.includes('jest') || devDependencies.includes('jest')) {
      scores.jest += 40;
    }
    if (dependencies.includes('mocha') || devDependencies.includes('mocha')) {
      scores.mocha += 40;
    }
    if (dependencies.includes('vitest') || devDependencies.includes('vitest')) {
      scores.vitest += 40;
    }
    if (dependencies.includes('cypress') || devDependencies.includes('cypress')) {
      scores.cypress += 40;
    }
    if (dependencies.includes('playwright') || devDependencies.includes('@playwright/test')) {
      scores.playwright += 40;
    }
    
    // 設定ファイルからのスコア
    if (configFiles.includes('jest.config.js')) scores.jest += 30;
    if (configFiles.includes('cypress.config.js')) scores.cypress += 30;
    if (configFiles.includes('playwright.config.js')) scores.playwright += 30;
    if (configFiles.includes('vitest.config.js')) scores.vitest += 30;
    
    // テストパターンからのスコア
    if (testPatterns.includes('describe') && testPatterns.includes('it')) {
      scores.jest += 20;
      scores.mocha += 20;
    }
    if (testPatterns.includes('expect')) {
      scores.jest += 15;
    }
    if (testPatterns.includes('cy.')) {
      scores.cypress += 25;
    }
    
    const entries = Object.entries(scores);
    const topFramework = entries.length > 0 
      ? entries.reduce((a, b) => a[1] > b[1] ? a : b)
      : ['unknown', 0];
    const confidence = Math.min(topFramework[1] as number / 100, 1.0);
    
    const additionalFrameworks = Object.entries(scores)
      .filter(([name, score]) => name !== topFramework[0] && score > 20)
      .map(([name]) => name);
    
    return {
      framework: topFramework[0] as TestFramework['framework'],
      confidence,
      additionalFrameworks
    };
  }
  
  /**
   * ビルドツール推論
   */
  private inferBuildTool(evidence: InferenceEvidence): BuildTool {
    const { dependencies, devDependencies } = evidence.packageJsonAnalysis;
    const { configFiles } = evidence.configurationAnalysis;
    
    let scores = {
      webpack: 0,
      vite: 0,
      rollup: 0,
      parcel: 0,
      tsc: 0,
      esbuild: 0,
      swc: 0,
      babel: 0
    };
    
    // 依存関係とコンフィグファイルから推論
    if (devDependencies.includes('webpack') || configFiles.includes('webpack.config.js')) {
      scores.webpack += 40;
    }
    if (devDependencies.includes('vite') || configFiles.includes('vite.config.js')) {
      scores.vite += 40;
    }
    if (devDependencies.includes('rollup') || configFiles.includes('rollup.config.js')) {
      scores.rollup += 40;
    }
    if (devDependencies.includes('parcel')) {
      scores.parcel += 40;
    }
    if (devDependencies.includes('typescript') || configFiles.includes('tsconfig.json')) {
      scores.tsc += 30;
    }
    if (devDependencies.includes('esbuild')) {
      scores.esbuild += 35;
    }
    if (devDependencies.includes('@swc/core')) {
      scores.swc += 35;
    }
    if (devDependencies.includes('@babel/core') || configFiles.includes('babel.config.js')) {
      scores.babel += 30;
    }
    
    const entries = Object.entries(scores);
    const topTool = entries.length > 0 
      ? entries.reduce((a, b) => a[1] > b[1] ? a : b)
      : ['unknown', 0];
    const confidence = Math.min(topTool[1] as number / 100, 1.0);
    
    return {
      tool: topTool[0] as BuildTool['tool'],
      confidence
    };
  }
  
  /**
   * アーキテクチャパターン推論
   */
  private inferArchitecturePattern(evidence: InferenceEvidence): ArchitecturePattern {
    const { directories } = evidence.fileStructureAnalysis;
    const { architecturalPatterns } = evidence.codeAnalysis;
    
    let scores = {
      mvc: 0,
      mvvm: 0,
      'clean-architecture': 0,
      hexagonal: 0,
      microservices: 0,
      layered: 0,
      modular: 0,
      monolithic: 0
    };
    
    const characteristics: string[] = [];
    
    // ディレクトリ構造から推論
    if (directories.includes('controllers') && directories.includes('models') && directories.includes('views')) {
      scores.mvc += 40;
      characteristics.push('MVC directory structure');
    }
    
    if (directories.includes('domain') && directories.includes('infrastructure') && directories.includes('application')) {
      scores['clean-architecture'] += 45;
      characteristics.push('Clean Architecture layers');
    }
    
    if (directories.includes('core') && directories.includes('adapters')) {
      scores.hexagonal += 35;
      characteristics.push('Hexagonal Architecture structure');
    }
    
    if (directories.includes('services') && directories.length > 8) {
      scores.microservices += 30;
      characteristics.push('Multiple service directories');
    }
    
    if (directories.includes('components') && directories.includes('modules')) {
      scores.modular += 25;
      characteristics.push('Modular component structure');
    }
    
    // アーキテクチャパターンから推論
    if (architecturalPatterns.includes('repository-pattern')) {
      scores['clean-architecture'] += 15;
      characteristics.push('Repository pattern usage');
    }
    
    if (architecturalPatterns.includes('dependency-injection')) {
      scores['clean-architecture'] += 15;
      scores.hexagonal += 10;
      characteristics.push('Dependency injection');
    }
    
    const entries = Object.entries(scores);
    const topPattern = entries.length > 0 
      ? entries.reduce((a, b) => a[1] > b[1] ? a : b)
      : ['unknown', 0];
    const confidence = Math.min(topPattern[1] as number / 100, 1.0);
    
    return {
      pattern: topPattern[0] as ArchitecturePattern['pattern'],
      confidence,
      characteristics
    };
  }
  
  /**
   * フレームワーク検出
   */
  private inferFrameworks(evidence: InferenceEvidence): DetectedFramework[] {
    const frameworks: DetectedFramework[] = [];
    const { dependencies, devDependencies } = evidence.packageJsonAnalysis;
    
    const frameworkMap = {
      // Web frameworks
      'react': { category: 'web' as const, confidence: 0.9 },
      'vue': { category: 'web' as const, confidence: 0.9 },
      'angular': { category: 'web' as const, confidence: 0.9 },
      'next': { category: 'web' as const, confidence: 0.8 },
      'nuxt': { category: 'web' as const, confidence: 0.8 },
      'svelte': { category: 'web' as const, confidence: 0.9 },
      'express': { category: 'web' as const, confidence: 0.9 },
      'fastify': { category: 'web' as const, confidence: 0.9 },
      
      // UI frameworks
      'material-ui': { category: 'ui' as const, confidence: 0.7 },
      'antd': { category: 'ui' as const, confidence: 0.7 },
      'chakra-ui': { category: 'ui' as const, confidence: 0.7 },
      'tailwindcss': { category: 'ui' as const, confidence: 0.8 },
      
      // State management
      'redux': { category: 'state-management' as const, confidence: 0.8 },
      'mobx': { category: 'state-management' as const, confidence: 0.8 },
      'zustand': { category: 'state-management' as const, confidence: 0.8 },
      'vuex': { category: 'state-management' as const, confidence: 0.8 },
      
      // Testing
      'jest': { category: 'testing' as const, confidence: 0.9 },
      'cypress': { category: 'testing' as const, confidence: 0.9 },
      'playwright': { category: 'testing' as const, confidence: 0.9 },
      
      // ORM
      'prisma': { category: 'orm' as const, confidence: 0.9 },
      'sequelize': { category: 'orm' as const, confidence: 0.8 },
      'mongoose': { category: 'orm' as const, confidence: 0.8 }
    };
    
    const allDeps = [...dependencies, ...devDependencies];
    
    for (const dep of allDeps) {
      const framework = frameworkMap[dep as keyof typeof frameworkMap];
      if (framework) {
        frameworks.push({
          name: dep,
          category: framework.category,
          confidence: framework.confidence
        });
      }
    }
    
    return frameworks.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Helper methods
  
  private calculateOverallConfidence(confidences: number[]): number {
    const validConfidences = confidences.filter(c => c > 0);
    if (validConfidences.length === 0) return 0;
    
    return validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length;
  }
  
  private detectDirectoryPatterns(dirName: string): string[] {
    const patterns: string[] = [];
    
    const commonPatterns = {
      'src': 'source-code-organization',
      'lib': 'library-structure',
      'dist': 'build-output',
      'build': 'build-output',
      'public': 'static-assets',
      'static': 'static-assets',
      'assets': 'static-assets',
      'components': 'component-based',
      'pages': 'page-based-routing',
      'routes': 'route-based',
      'api': 'api-structure',
      'controllers': 'mvc-pattern',
      'models': 'mvc-pattern',
      'views': 'mvc-pattern',
      'services': 'service-layer',
      'utils': 'utility-functions',
      'helpers': 'utility-functions',
      'middleware': 'middleware-pattern',
      'config': 'configuration-management',
      'test': 'test-organization',
      'tests': 'test-organization',
      '__tests__': 'jest-testing',
      'e2e': 'end-to-end-testing',
      'cypress': 'cypress-testing',
      'domain': 'domain-driven-design',
      'infrastructure': 'layered-architecture',
      'application': 'application-layer'
    };
    
    const pattern = commonPatterns[dirName as keyof typeof commonPatterns];
    if (pattern) {
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  private isKeyFile(fileName: string): boolean {
    const keyFiles = [
      'package.json', 'package-lock.json', 'yarn.lock',
      'tsconfig.json', 'jsconfig.json',
      'webpack.config.js', 'vite.config.js',
      'jest.config.js', 'cypress.config.js',
      'README.md', 'LICENSE',
      'Dockerfile', 'docker-compose.yml',
      '.gitignore', '.eslintrc.js'
    ];
    
    return keyFiles.includes(fileName);
  }
  
  private isBuildConfig(fileName: string): boolean {
    return [
      'webpack.config.js', 'vite.config.js', 'rollup.config.js',
      'babel.config.js', 'postcss.config.js', 'tailwind.config.js'
    ].includes(fileName);
  }
  
  private isTestConfig(fileName: string): boolean {
    return [
      'jest.config.js', 'cypress.config.js', 'playwright.config.js'
    ].includes(fileName);
  }
  
  private findSourceFiles(projectPath: string, limit: number): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'];
    
    const traverse = (dir: string, depth: number = 0) => {
      if (depth > 3 || files.length >= limit) return; // 深度制限
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (files.length >= limit) break;
          
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            traverse(fullPath, depth + 1);
          } else if (extensions.includes(path.extname(entry.name).toLowerCase())) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // エラーは無視
      }
    };
    
    traverse(projectPath);
    return files;
  }
  
  private extractImportPatterns(content: string): string[] {
    const patterns: string[] = [];
    const importRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.')) {
        patterns.push(importPath.split('/')[0]);
      }
    }
    
    return [...new Set(patterns)];
  }
  
  private detectArchitecturalPatterns(content: string, filePath: string): string[] {
    const patterns: string[] = [];
    
    // Repository pattern
    if (content.includes('Repository') && content.includes('interface')) {
      patterns.push('repository-pattern');
    }
    
    // Dependency injection
    if (content.includes('@Injectable') || content.includes('@Inject') || content.includes('container.resolve')) {
      patterns.push('dependency-injection');
    }
    
    // Observer pattern
    if (content.includes('subscribe') || content.includes('emit') || content.includes('EventEmitter')) {
      patterns.push('observer-pattern');
    }
    
    // Factory pattern
    if (content.includes('Factory') && content.includes('create')) {
      patterns.push('factory-pattern');
    }
    
    return patterns;
  }
  
  private detectTestPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('describe(')) patterns.push('describe');
    if (content.includes('it(')) patterns.push('it');
    if (content.includes('test(')) patterns.push('test');
    if (content.includes('expect(')) patterns.push('expect');
    if (content.includes('cy.')) patterns.push('cy.');
    if (content.includes('await page.')) patterns.push('playwright');
    
    return patterns;
  }
  
  private isTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return fileName.includes('.test.') || 
           fileName.includes('.spec.') || 
           filePath.includes('__tests__') ||
           filePath.includes('/test/') ||
           filePath.includes('/tests/');
  }
  
  private inferSubtype(projectType: string, evidence: InferenceEvidence): string | undefined {
    const { dependencies } = evidence.packageJsonAnalysis;
    
    switch (projectType) {
      case 'frontend':
        if (dependencies.includes('react')) return 'react-app';
        if (dependencies.includes('vue')) return 'vue-app';
        if (dependencies.includes('angular')) return 'angular-app';
        if (dependencies.includes('next')) return 'next-app';
        return 'spa';
        
      case 'backend':
        if (dependencies.includes('express')) return 'express-api';
        if (dependencies.includes('fastify')) return 'fastify-api';
        if (dependencies.includes('graphql')) return 'graphql-api';
        return 'rest-api';
        
      case 'library':
        if (evidence.packageJsonAnalysis.keywords.includes('utility')) return 'utility-library';
        if (evidence.packageJsonAnalysis.keywords.includes('component')) return 'component-library';
        return 'general-library';
        
      default:
        return undefined;
    }
  }
}