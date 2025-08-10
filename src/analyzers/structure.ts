import {
  ProjectStructure,
  ProjectOverview,
  DirectoryInfo,
  ArchitecturePattern,
  NamingConventions,
  ProjectMetrics,
  DirectoryPurpose,
  ArchitectureType,
  NamingPattern,
  LanguageDistribution,
  DetectedFramework,
  FileNamingConvention,
  DirectoryNamingConvention,
  VariableNamingConvention,
  FunctionNamingConvention,
  ClassNamingConvention,
  ComplexityMetrics,
  MaintainabilityMetrics,
  TestabilityMetrics,
  DocumentationMetrics
} from './types';
import * as fs from 'fs';
import * as path from 'path';
import { PathSecurity } from '../utils/pathSecurity';
import { ResourceLimitMonitor } from '../utils/resourceLimits';

// 新しい分析クラスのインポート
import { ArchitectureDetector } from './structure-analysis/architecture-detector';
import { NamingAnalyzer } from './structure-analysis/naming-analyzer';
import { MetricsCalculator } from './structure-analysis/metrics-calculator';
import { PatternDetector } from './structure-analysis/pattern-detector';

/**
 * プロジェクト構造分析器（ファサードパターン）
 * 後方互換性を維持しながら新しい分析クラスに処理を委譲
 * プロジェクトの構造、アーキテクチャパターン、命名規則、メトリクスを分析
 * @deprecated 将来的には個別の分析クラスを直接使用することを推奨
 */
export class ProjectStructureAnalyzer {
  private readonly IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'coverage',
    '.nyc_output',
    '.vscode',
    '.idea'
  ];
  
  private resourceMonitor: ResourceLimitMonitor;
  
  // 新しい分析クラスのインスタンス
  private architectureDetector: ArchitectureDetector;
  private namingAnalyzer: NamingAnalyzer;
  private metricsCalculator: MetricsCalculator;
  private patternDetector: PatternDetector;

  constructor(resourceMonitor?: ResourceLimitMonitor) {
    this.resourceMonitor = resourceMonitor || new ResourceLimitMonitor();
    
    // 新しい分析クラスのインスタンスを作成
    this.architectureDetector = new ArchitectureDetector();
    this.namingAnalyzer = new NamingAnalyzer();
    this.metricsCalculator = new MetricsCalculator();
    this.patternDetector = new PatternDetector();
  }

  private readonly SUPPORTED_EXTENSIONS = [
    '.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs',
    '.py', '.java', '.cs', '.cpp', '.c', '.h',
    '.go', '.rs', '.php', '.rb', '.swift', '.kt'
  ];

  private readonly FRAMEWORK_SIGNATURES = new Map<string, RegExp[]>([
    ['express', [/import.*express/, /require.*express/, /"express":/]],
    ['react', [/import.*react/, /from ['"]react['"]/, /"react":/]],
    ['vue', [/import.*vue/, /@vue\//, /"vue":/]],
    ['angular', [/@angular\//, /import.*@angular/, /"@angular/]],
    ['nest', [/@nestjs\//, /import.*@nestjs/, /"@nestjs/]],
    ['next', [/next\//, /import.*next/, /"next":/]],
    ['nuxt', [/nuxt/, /"nuxt":/]],
    ['mongoose', [/import.*mongoose/, /require.*mongoose/, /"mongoose":/]],
    ['prisma', [/@prisma\//, /import.*prisma/, /"prisma":/]],
    ['typeorm', [/import.*typeorm/, /"typeorm":/]]
  ]);

  private readonly TEST_FRAMEWORK_SIGNATURES = new Map<string, RegExp[]>([
    ['jest', [/import.*jest/, /"jest":/, /describe\(/, /it\(/, /test\(/]],
    ['mocha', [/import.*mocha/, /"mocha":/, /describe\(/, /it\(/]],
    ['jasmine', [/import.*jasmine/, /"jasmine":/]],
    ['cypress', [/import.*cypress/, /"cypress":/, /cy\./]],
    ['playwright', [/import.*playwright/, /"playwright":/]]
  ]);

  private readonly BUILD_TOOL_SIGNATURES = new Map<string, RegExp[]>([
    ['typescript', [/\.ts$/, /\.tsx$/, /"typescript":/, /tsconfig\.json/]],
    ['webpack', [/webpack/, /"webpack":/]],
    ['vite', [/import.*vite/, /"vite":/]],
    ['rollup', [/rollup/, /"rollup":/]],
    ['parcel', [/parcel/, /"parcel":/]],
    ['babel', [/babel/, /"babel":/]]
  ]);

  /**
   * プロジェクト構造を包括的に分析
   */
  async analyzeProjectStructure(projectPath: string): Promise<ProjectStructure> {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const [overview, directories, architecture, conventions, metrics] = await Promise.all([
      this.generateProjectOverview(projectPath),
      this.categorizeDirectories(projectPath),
      this.detectArchitecturePattern(projectPath),
      this.analyzeNamingConventions(projectPath),
      this.calculateProjectMetrics(projectPath)
    ]);

    return {
      overview,
      directories,
      architecture,
      conventions,
      metrics
    };
  }

  /**
   * アーキテクチャパターンを検出
   */
  async detectArchitecturePattern(projectPath: string): Promise<ArchitecturePattern> {
    const directories = await this.getAllDirectories(projectPath);
    const files = await this.getAllFiles(projectPath);
    const patterns = this.analyzeArchitecturePatterns(directories, files);
    
    let bestMatch: ArchitectureType = 'unknown';
    let maxConfidence = 0;
    const evidence: string[] = [];
    
    // MVC パターンの検出
    const mvcScore = this.calculateMVCScore(directories, evidence);
    if (mvcScore > maxConfidence) {
      maxConfidence = mvcScore;
      bestMatch = 'mvc';
    }
    
    // マイクロサービス パターンの検出
    const microservicesScore = this.calculateMicroservicesScore(directories, files, evidence);
    if (microservicesScore > maxConfidence) {
      maxConfidence = microservicesScore;
      bestMatch = 'microservices';
    }
    
    // レイヤードアーキテクチャの検出
    const layeredScore = this.calculateLayeredScore(directories, evidence);
    if (layeredScore > maxConfidence) {
      maxConfidence = layeredScore;
      bestMatch = 'layered';
    }

    // クリーンアーキテクチャの検出
    const cleanScore = this.calculateCleanArchitectureScore(directories, evidence);
    if (cleanScore > maxConfidence) {
      maxConfidence = cleanScore;
      bestMatch = 'clean';
    }

    return {
      type: bestMatch,
      confidence: maxConfidence,
      evidence,
      suggestions: this.generateArchitectureSuggestions(bestMatch, maxConfidence, directories)
    };
  }

  /**
   * 命名規則を分析
   */
  async analyzeNamingConventions(projectPath: string): Promise<NamingConventions> {
    const files = await this.getAllFiles(projectPath);
    const codeContents = await this.readAllCodeFiles(files);
    
    return {
      files: await this.analyzeFileNaming(files),
      directories: await this.analyzeDirectoryNaming(projectPath),
      variables: await this.analyzeVariableNaming(codeContents),
      functions: await this.analyzeFunctionNaming(codeContents),
      classes: await this.analyzeClassNaming(codeContents)
    };
  }

  /**
   * プロジェクトメトリクスを計算
   */
  async calculateProjectMetrics(projectPath: string): Promise<ProjectMetrics> {
    const files = await this.getAllFiles(projectPath);
    const codeFiles = files.filter(file => this.isCodeFile(file));
    const testFiles = files.filter(file => this.isTestFile(file));
    const codeContents = await this.readAllCodeFiles(codeFiles);

    const [complexity, maintainability, testability, documentation] = await Promise.all([
      this.calculateComplexityMetrics(codeContents, codeFiles),
      this.calculateMaintainabilityMetrics(codeContents, codeFiles),
      this.calculateTestabilityMetrics(codeFiles, testFiles, codeContents),
      this.calculateDocumentationMetrics(projectPath, codeFiles, codeContents)
    ]);

    return {
      complexity,
      maintainability,
      testability,
      documentation
    };
  }

  /**
   * ディレクトリを分類
   */
  async categorizeDirectories(projectPath: string): Promise<DirectoryInfo[]> {
    const directories = await this.getAllDirectories(projectPath);
    const directoryInfos: DirectoryInfo[] = [];
    
    for (const dir of directories) {
      const relativePath = path.relative(projectPath, dir);
      if (relativePath && !this.shouldIgnoreDirectory(path.basename(dir))) {
        const purpose = this.determineDirectoryPurpose(dir, relativePath);
        const files = fs.readdirSync(dir, { withFileTypes: true })
          .filter(entry => entry.isFile())
          .map(entry => entry.name);
        
        const subdirectories = fs.readdirSync(dir, { withFileTypes: true })
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);

        const patterns = this.detectDirectoryPatterns(dir, files);
        const conventions = this.detectDirectoryConventions(dir, files);

        directoryInfos.push({
          path: relativePath,
          purpose,
          fileCount: files.length,
          subdirectories,
          patterns,
          conventions
        });
      }
    }
    
    return directoryInfos;
  }

  // Private helper methods

  private async generateProjectOverview(projectPath: string): Promise<ProjectOverview> {
    const files = await this.getAllFiles(projectPath);
    const directories = await this.getAllDirectories(projectPath);
    
    const languages = await this.analyzeLanguageDistribution(files);
    const frameworks = await this.detectFrameworks(files);
    const testingFrameworks = await this.detectTestingFrameworks(files);
    const buildTools = await this.detectBuildTools(files);
    
    return {
      rootPath: projectPath,
      totalFiles: files.length,
      totalDirectories: directories.length,
      languages,
      frameworks,
      testingFrameworks,
      buildTools
    };
  }

  private async getAllFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = (dir: string, depth: number = 0) => {
      try {
        // 深度制限チェック
        if (!this.resourceMonitor.checkDepth(depth, projectPath)) {
          return; // 深度制限に達した場合は探索を停止
        }
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // セキュリティ: パス検証
          if (!PathSecurity.validateProjectPath(fullPath, projectPath)) {
            continue; // プロジェクト範囲外はスキップ
          }
          
          if (entry.isDirectory()) {
            if (!this.shouldIgnoreDirectory(entry.name)) {
              walkDir(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // ディレクトリの読み込みエラーは無視
      }
    };
    
    walkDir(projectPath);
    return files;
  }

  private async getAllDirectories(projectPath: string): Promise<string[]> {
    const directories: string[] = [projectPath];
    
    const walkDir = (dir: string, depth: number = 0) => {
      try {
        // 深度制限チェック
        if (!this.resourceMonitor.checkDepth(depth, projectPath)) {
          return; // 深度制限に達した場合は探索を停止
        }
        
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = path.join(dir, entry.name);
            
            // セキュリティ: パス検証
            if (!PathSecurity.validateProjectPath(fullPath, projectPath)) {
              continue; // プロジェクト範囲外はスキップ
            }
            
            if (!this.shouldIgnoreDirectory(entry.name)) {
              directories.push(fullPath);
              walkDir(fullPath, depth + 1);
            }
          }
        }
      } catch (error) {
        // ディレクトリの読み込みエラーは無視
      }
    };
    
    walkDir(projectPath);
    return directories;
  }

  private shouldIgnoreDirectory(dirName: string): boolean {
    return this.IGNORE_PATTERNS.some(pattern => dirName.includes(pattern));
  }

  private async analyzeLanguageDistribution(files: string[]): Promise<LanguageDistribution[]> {
    const languageMap = new Map<string, { count: number; extensions: Set<string> }>();
    
    files.forEach(file => {
      const ext = path.extname(file);
      const language = this.getLanguageFromExtension(ext);
      
      if (language) {
        if (!languageMap.has(language)) {
          languageMap.set(language, { count: 0, extensions: new Set() });
        }
        languageMap.get(language)!.count++;
        languageMap.get(language)!.extensions.add(ext);
      }
    });

    const totalFiles = files.length;
    return Array.from(languageMap.entries()).map(([language, data]) => ({
      language,
      fileCount: data.count,
      percentage: (data.count / totalFiles) * 100,
      extensions: Array.from(data.extensions)
    }));
  }

  private getLanguageFromExtension(ext: string): string | null {
    const languageMap: { [key: string]: string } = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin'
    };
    
    return languageMap[ext] || null;
  }

  private async detectFrameworks(files: string[]): Promise<DetectedFramework[]> {
    return this.detectSignatures(files, this.FRAMEWORK_SIGNATURES);
  }

  private async detectTestingFrameworks(files: string[]): Promise<DetectedFramework[]> {
    return this.detectSignatures(files, this.TEST_FRAMEWORK_SIGNATURES);
  }

  private async detectBuildTools(files: string[]): Promise<DetectedFramework[]> {
    return this.detectSignatures(files, this.BUILD_TOOL_SIGNATURES);
  }

  private async detectSignatures(files: string[], signatures: Map<string, RegExp[]>): Promise<DetectedFramework[]> {
    const detected: DetectedFramework[] = [];
    
    for (const [name, patterns] of signatures.entries()) {
      let matchCount = 0;
      const evidence: string[] = [];
      
      // package.jsonでの検出
      const packageJsonFiles = files.filter(f => f.endsWith('package.json'));
      for (const packageFile of packageJsonFiles) {
        try {
          const content = fs.readFileSync(packageFile, 'utf-8');
          for (const pattern of patterns) {
            if (pattern.test(content)) {
              matchCount += 3; // package.jsonでの検出は重要度高
              evidence.push(`Found in ${path.basename(packageFile)}`);
              break;
            }
          }
        } catch (error) {
          // ファイル読み込みエラーは無視
        }
      }

      // コードファイルでの検出
      const codeFiles = files.filter(f => this.isCodeFile(f)).slice(0, 50); // パフォーマンス考慮
      for (const file of codeFiles) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          for (const pattern of patterns) {
            if (pattern.test(content)) {
              matchCount += 1;
              evidence.push(`Found in ${path.basename(file)}`);
              break;
            }
          }
        } catch (error) {
          // ファイル読み込みエラーは無視
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(matchCount / 5, 1); // 最大1.0に正規化
        detected.push({
          name,
          confidence,
          evidence: [...new Set(evidence)] // 重複を除去
        });
      }
    }

    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeArchitecturePatterns(directories: string[], files: string[]): Record<string, unknown> {
    // アーキテクチャパターンの分析ロジック
    return {};
  }

  private calculateMVCScore(directories: string[], evidence: string[]): number {
    let score = 0;
    const dirNames = directories.map(d => path.basename(d).toLowerCase());
    
    if (dirNames.some(name => name.includes('controller'))) {
      score += 0.3;
      evidence.push('controllers directory found');
    }
    
    if (dirNames.some(name => name.includes('model'))) {
      score += 0.3;
      evidence.push('models directory found');
    }
    
    if (dirNames.some(name => name.includes('view') || name.includes('route'))) {
      score += 0.2;
      evidence.push('views or routes directory found');
    }
    
    if (dirNames.some(name => name.includes('service'))) {
      score += 0.1;
      evidence.push('services directory found');
    }
    
    if (dirNames.some(name => name.includes('middleware'))) {
      score += 0.1;
      evidence.push('middleware directory found');
    }
    
    return score;
  }

  private calculateMicroservicesScore(directories: string[], files: string[], evidence: string[]): number {
    let score = 0;
    const dirNames = directories.map(d => path.basename(d).toLowerCase());
    
    // 複数のサービスディレクトリの存在
    const serviceCount = dirNames.filter(name => 
      name.includes('service') || name.endsWith('-service') || name.startsWith('service-')
    ).length;
    
    if (serviceCount > 2) {
      score += 0.4;
      evidence.push(`multiple service directories found (${serviceCount})`);
    }
    
    // Docker関連ファイル
    if (files.some(f => f.includes('Dockerfile') || f.includes('docker-compose'))) {
      score += 0.2;
      evidence.push('Docker configuration found');
    }
    
    // API Gateway or routing
    if (files.some(f => f.includes('gateway') || f.includes('proxy'))) {
      score += 0.2;
      evidence.push('API Gateway patterns found');
    }
    
    return score;
  }

  private calculateLayeredScore(directories: string[], evidence: string[]): number {
    let score = 0;
    const dirNames = directories.map(d => path.basename(d).toLowerCase());
    
    const layers = ['presentation', 'application', 'domain', 'infrastructure', 'data'];
    const foundLayers = layers.filter(layer => 
      dirNames.some(name => name.includes(layer))
    );
    
    if (foundLayers.length >= 3) {
      score += 0.6;
      evidence.push(`layered structure found: ${foundLayers.join(', ')}`);
    }
    
    return score;
  }

  private calculateCleanArchitectureScore(directories: string[], evidence: string[]): number {
    let score = 0;
    const dirNames = directories.map(d => path.basename(d).toLowerCase());
    
    const cleanPatterns = ['entities', 'usecases', 'interfaces', 'frameworks'];
    const foundPatterns = cleanPatterns.filter(pattern => 
      dirNames.some(name => name.includes(pattern))
    );
    
    if (foundPatterns.length >= 3) {
      score += 0.7;
      evidence.push(`clean architecture patterns found: ${foundPatterns.join(', ')}`);
    }
    
    return score;
  }

  private generateArchitectureSuggestions(
    architecture: ArchitectureType, 
    confidence: number, 
    directories: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    if (confidence < 0.5) {
      suggestions.push('Consider organizing code into clearer architectural patterns');
    }
    
    switch (architecture) {
      case 'mvc':
        suggestions.push('Consider separating business logic into service layer');
        suggestions.push('Ensure proper separation between controllers and models');
        break;
      case 'microservices':
        suggestions.push('Consider implementing service discovery');
        suggestions.push('Ensure proper inter-service communication patterns');
        break;
      case 'layered':
        suggestions.push('Maintain strict layer dependencies');
        suggestions.push('Consider using dependency injection');
        break;
      case 'clean':
        suggestions.push('Ensure dependency rule compliance');
        suggestions.push('Keep business logic independent of frameworks');
        break;
      default:
        suggestions.push('Consider adopting a well-defined architectural pattern');
    }
    
    return suggestions;
  }

  private determineDirectoryPurpose(dirPath: string, relativePath: string): DirectoryPurpose {
    const dirName = path.basename(dirPath).toLowerCase();
    const relativePathLower = relativePath.toLowerCase();
    
    if (dirName.includes('src') || dirName.includes('source')) return 'source';
    if (dirName.includes('test') || dirName.includes('spec') || relativePathLower.includes('test')) return 'test';
    if (dirName === 'build' || dirName === 'dist' || dirName.includes('output')) return 'build';
    if (dirName.includes('config') || dirName.includes('settings')) return 'config';
    if (dirName.includes('doc') || dirName.includes('readme') || relativePathLower.includes('docs')) return 'documentation';
    if (dirName.includes('asset') || dirName.includes('static') || dirName.includes('public')) return 'assets';
    if (dirName.includes('vendor') || dirName.includes('third') || dirName.includes('lib')) return 'vendor';
    
    return 'unknown';
  }

  private detectDirectoryPatterns(dirPath: string, files: string[]): string[] {
    const patterns: string[] = [];
    const dirName = path.basename(dirPath).toLowerCase();
    
    if (dirName.includes('controller') && files.some(f => f.includes('Controller'))) {
      patterns.push('Controller suffix pattern');
    }
    
    if (dirName.includes('service') && files.some(f => f.includes('Service'))) {
      patterns.push('Service suffix pattern');
    }
    
    if (dirName.includes('model') && files.some(f => f.includes('Model'))) {
      patterns.push('Model suffix pattern');
    }
    
    if (files.some(f => f.endsWith('.test.ts') || f.endsWith('.spec.ts'))) {
      patterns.push('Test file pattern');
    }
    
    return patterns;
  }

  private detectDirectoryConventions(dirPath: string, files: string[]): string[] {
    const conventions: string[] = [];
    
    // ファイル名の規則を分析
    const hasPascalCase = files.some(f => /^[A-Z][a-zA-Z0-9]*\./.test(f));
    const hasCamelCase = files.some(f => /^[a-z][a-zA-Z0-9]*\./.test(f));
    const hasKebabCase = files.some(f => /^[a-z][a-z0-9-]*\./.test(f));
    
    if (hasPascalCase) conventions.push('PascalCase class names');
    if (hasCamelCase) conventions.push('camelCase file names');
    if (hasKebabCase) conventions.push('kebab-case file names');
    
    return conventions;
  }

  private async analyzeFileNaming(files: string[]): Promise<FileNamingConvention> {
    const fileNames = files.map(f => path.basename(f, path.extname(f)));
    return this.analyzeNamingPattern(fileNames, 'files');
  }

  private async analyzeDirectoryNaming(projectPath: string): Promise<DirectoryNamingConvention> {
    const directories = await this.getAllDirectories(projectPath);
    const dirNames = directories
      .map(d => path.basename(d))
      .filter(name => name !== path.basename(projectPath));
    return this.analyzeNamingPattern(dirNames, 'directories');
  }

  private async analyzeVariableNaming(codeContents: Map<string, string>): Promise<VariableNamingConvention> {
    const variables: string[] = [];
    
    codeContents.forEach(content => {
      // 変数宣言を抽出
      const variableMatches = content.match(/(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
      if (variableMatches) {
        variableMatches.forEach(match => {
          const varName = match.replace(/(?:const|let|var)\s+/, '');
          variables.push(varName);
        });
      }
    });
    
    return this.analyzeNamingPattern(variables, 'variables');
  }

  private async analyzeFunctionNaming(codeContents: Map<string, string>): Promise<FunctionNamingConvention> {
    const functions: string[] = [];
    
    codeContents.forEach(content => {
      // 関数宣言を抽出
      const functionMatches = content.match(/(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*)\s*\()/g);
      if (functionMatches) {
        functionMatches.forEach(match => {
          const funcName = match.replace(/function\s+/, '').replace(/\s*\(/, '');
          if (funcName && /^[a-zA-Z_]/.test(funcName)) {
            functions.push(funcName);
          }
        });
      }
    });
    
    return this.analyzeNamingPattern(functions, 'functions');
  }

  private async analyzeClassNaming(codeContents: Map<string, string>): Promise<ClassNamingConvention> {
    const classes: string[] = [];
    
    codeContents.forEach(content => {
      // クラス宣言を抽出
      const classMatches = content.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          const className = match.replace(/class\s+/, '');
          classes.push(className);
        });
      }
    });
    
    return this.analyzeNamingPattern(classes, 'classes');
  }

  private analyzeNamingPattern(names: string[], type: string): {
    pattern: NamingPattern;
    confidence: number;
    examples: string[];
    violations: string[];
  } {
    if (names.length === 0) {
      return {
        pattern: 'unknown' as NamingPattern,
        confidence: 0,
        examples: [],
        violations: []
      };
    }

    const patterns = {
      camelCase: names.filter(name => /^[a-z][a-zA-Z0-9]*$/.test(name)),
      PascalCase: names.filter(name => /^[A-Z][a-zA-Z0-9]*$/.test(name)),
      snake_case: names.filter(name => /^[a-z][a-z0-9_]*$/.test(name)),
      'kebab-case': names.filter(name => /^[a-z][a-z0-9-]*$/.test(name)),
      SCREAMING_SNAKE_CASE: names.filter(name => /^[A-Z][A-Z0-9_]*$/.test(name))
    };

    let dominantPattern: NamingPattern = 'mixed';
    let maxCount = 0;
    
    Object.entries(patterns).forEach(([pattern, matches]) => {
      if (matches.length > maxCount) {
        maxCount = matches.length;
        dominantPattern = pattern as NamingPattern;
      }
    });

    const confidence = maxCount / names.length;
    const examples: string[] = dominantPattern !== 'mixed' && dominantPattern !== 'unknown' 
      ? patterns[dominantPattern as keyof typeof patterns] || [] 
      : [];
    const violations = names.filter(name => !examples.includes(name));

    return {
      pattern: dominantPattern,
      confidence,
      examples: examples.slice(0, 5), // 最大5個の例
      violations: violations.slice(0, 3) // 最大3個の違反例
    };
  }

  private async readAllCodeFiles(files: string[]): Promise<Map<string, string>> {
    const contents = new Map<string, string>();
    
    for (const file of files.slice(0, 100)) { // パフォーマンス考慮で100ファイルまで
      try {
        if (this.isCodeFile(file)) {
          const content = fs.readFileSync(file, 'utf-8');
          contents.set(file, content);
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
    }
    
    return contents;
  }

  private isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    return this.SUPPORTED_EXTENSIONS.includes(ext);
  }

  private isTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return fileName.includes('.test.') || fileName.includes('.spec.') || filePath.includes('/test/');
  }

  private async calculateComplexityMetrics(
    codeContents: Map<string, string>, 
    files: string[]
  ): Promise<ComplexityMetrics> {
    let totalFunctions = 0;
    let totalComplexity = 0;
    let maxComplexity = 1;
    let totalFunctionLines = 0;
    const complexFiles: string[] = [];

    codeContents.forEach((content, filePath) => {
      const functions = this.extractFunctions(content);
      totalFunctions += functions.length;
      
      functions.forEach(func => {
        const complexity = this.calculateCyclomaticComplexity(func.content);
        totalComplexity += complexity;
        totalFunctionLines += func.lineCount;
        
        if (complexity > maxComplexity) {
          maxComplexity = complexity;
        }
        
        if (complexity > 10) {
          complexFiles.push(path.basename(filePath));
        }
      });
    });

    return {
      averageCyclomaticComplexity: totalFunctions > 0 ? totalComplexity / totalFunctions : 1,
      maxComplexity,
      complexFiles: [...new Set(complexFiles)],
      totalFunctions,
      averageFunctionLength: totalFunctions > 0 ? totalFunctionLines / totalFunctions : 0
    };
  }

  private async calculateMaintainabilityMetrics(
    codeContents: Map<string, string>,
    files: string[]
  ): Promise<MaintainabilityMetrics> {
    let totalFileSize = 0;
    let duplicatedLines = 0;
    const largeFiles: string[] = [];
    const longFunctions: string[] = [];

    codeContents.forEach((content, filePath) => {
      const lines = content.split('\n');
      const fileSize = lines.length;
      totalFileSize += fileSize;
      
      if (fileSize > 500) {
        largeFiles.push(path.basename(filePath));
      }
      
      // 長い関数を検出
      const functions = this.extractFunctions(content);
      functions.forEach(func => {
        if (func.lineCount > 50) {
          longFunctions.push(`${func.name} in ${path.basename(filePath)}`);
        }
      });
      
      // 重複コードの簡易検出
      duplicatedLines += this.detectDuplicatedCode(content);
    });

    const averageFileSize = files.length > 0 ? totalFileSize / files.length : 0;
    const duplicatedCodePercentage = totalFileSize > 0 ? (duplicatedLines / totalFileSize) * 100 : 0;
    
    // 保守性指数の計算（簡易版）
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      100 - (duplicatedCodePercentage * 2) - (averageFileSize / 10)
    ));

    return {
      maintainabilityIndex,
      duplicatedCodePercentage,
      averageFileSize,
      largeFiles,
      longFunctions
    };
  }

  private async calculateTestabilityMetrics(
    codeFiles: string[],
    testFiles: string[],
    codeContents: Map<string, string>
  ): Promise<TestabilityMetrics> {
    const totalClasses = this.countClasses(codeContents);
    const testableClasses = this.countTestableClasses(codeContents);
    const testCoverage = codeFiles.length > 0 ? (testFiles.length / codeFiles.length) * 100 : 0;
    const mockability = this.calculateMockability(codeContents);

    return {
      testCoverage: Math.min(100, testCoverage),
      testableClasses,
      untestableClasses: totalClasses - testableClasses,
      mockability
    };
  }

  private async calculateDocumentationMetrics(
    projectPath: string,
    codeFiles: string[],
    codeContents: Map<string, string>
  ): Promise<DocumentationMetrics> {
    const documentedFunctions = this.countDocumentedFunctions(codeContents);
    const documentedClasses = this.countDocumentedClasses(codeContents);
    const totalFunctions = this.countTotalFunctions(codeContents);
    const totalClasses = this.countClasses(codeContents);
    
    const functionCoverage = totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 0;
    const classCoverage = totalClasses > 0 ? (documentedClasses / totalClasses) * 100 : 0;
    const documentationCoverage = (functionCoverage + classCoverage) / 2;
    
    const readmeQuality = this.assessReadmeQuality(projectPath);

    return {
      documentedFunctions,
      documentedClasses,
      documentationCoverage,
      readmeQuality
    };
  }

  // Utility methods for metrics calculation

  private extractFunctions(content: string): Array<{ name: string; content: string; lineCount: number }> {
    const functions: Array<{ name: string; content: string; lineCount: number }> = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const funcMatch = line.match(/(?:function\s+([a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*)\s*\()/);
      
      if (funcMatch) {
        const funcName = funcMatch[1] || funcMatch[2];
        let braceCount = 0;
        let startLine = i;
        let endLine = i;
        let funcContent = '';
        
        // 関数の終わりを見つける
        for (let j = i; j < lines.length; j++) {
          const currentLine = lines[j];
          funcContent += currentLine + '\n';
          
          braceCount += (currentLine.match(/\{/g) || []).length;
          braceCount -= (currentLine.match(/\}/g) || []).length;
          
          if (braceCount === 0 && j > i) {
            endLine = j;
            break;
          }
        }
        
        functions.push({
          name: funcName,
          content: funcContent,
          lineCount: endLine - startLine + 1
        });
      }
    }
    
    return functions;
  }

  private calculateCyclomaticComplexity(content: string): number {
    // 簡易サイクロマティック複雑度の計算
    const complexityKeywords = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /catch\s*\(/g,
      /case\s+/g,
      /\?\s*:/g, // 三項演算子
      /&&/g,
      /\|\|/g
    ];
    
    let complexity = 1; // 基本の複雑度
    
    complexityKeywords.forEach(keyword => {
      const matches = content.match(keyword);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  private detectDuplicatedCode(content: string): number {
    // 簡易重複コード検出
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && !line.startsWith('//'));
    
    const lineMap = new Map<string, number>();
    lines.forEach(line => {
      lineMap.set(line, (lineMap.get(line) || 0) + 1);
    });
    
    let duplicatedLines = 0;
    lineMap.forEach(count => {
      if (count > 1) {
        duplicatedLines += count - 1;
      }
    });
    
    return duplicatedLines;
  }

  private countClasses(codeContents: Map<string, string>): number {
    let classCount = 0;
    codeContents.forEach(content => {
      const matches = content.match(/class\s+[a-zA-Z_][a-zA-Z0-9_]*/g);
      if (matches) {
        classCount += matches.length;
      }
    });
    return classCount;
  }

  private countTestableClasses(codeContents: Map<string, string>): number {
    let testableCount = 0;
    codeContents.forEach(content => {
      const classMatches = content.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          // クラスが依存関係注入可能かどうかの簡易チェック
          if (content.includes('constructor(') || content.includes('public ') || content.includes('private ')) {
            testableCount++;
          }
        });
      }
    });
    return testableCount;
  }

  private calculateMockability(codeContents: Map<string, string>): number {
    let mockableComponents = 0;
    let totalComponents = 0;
    
    codeContents.forEach(content => {
      const classes = content.match(/class\s+[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      totalComponents += classes.length;
      
      // インターフェースや抽象クラスの使用をチェック
      if (content.includes('interface ') || content.includes('abstract ')) {
        mockableComponents += classes.length;
      }
    });
    
    return totalComponents > 0 ? (mockableComponents / totalComponents) * 100 : 0;
  }

  private countDocumentedFunctions(codeContents: Map<string, string>): number {
    let documentedCount = 0;
    
    codeContents.forEach(content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].trim();
        const nextLine = lines[i + 1].trim();
        
        // JSDocコメントの後に関数がある場合
        if (currentLine.includes('*/') && nextLine.match(/(?:function|async\s+function|\w+\s*\()/)) {
          documentedCount++;
        }
      }
    });
    
    return documentedCount;
  }

  private countDocumentedClasses(codeContents: Map<string, string>): number {
    let documentedCount = 0;
    
    codeContents.forEach(content => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].trim();
        const nextLine = lines[i + 1].trim();
        
        // JSDocコメントの後にクラスがある場合
        if (currentLine.includes('*/') && nextLine.startsWith('class ')) {
          documentedCount++;
        }
      }
    });
    
    return documentedCount;
  }

  private countTotalFunctions(codeContents: Map<string, string>): number {
    let functionCount = 0;
    
    codeContents.forEach(content => {
      const matches = content.match(/(?:function\s+[a-zA-Z_][a-zA-Z0-9_]*|\w+\s*\()/g);
      if (matches) {
        functionCount += matches.length;
      }
    });
    
    return functionCount;
  }

  private assessReadmeQuality(projectPath: string): number {
    const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'readme.txt'];
    let quality = 0;
    
    for (const fileName of readmeFiles) {
      const filePath = path.join(projectPath, fileName);
      
      // セキュリティ: パス検証
      if (!PathSecurity.validateProjectPath(filePath, projectPath)) {
        continue; // プロジェクト範囲外はスキップ
      }
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');
          
          // 基本的な品質指標
          if (lines.length > 10) quality += 20;
          if (content.includes('# ') || content.includes('## ')) quality += 20; // ヘッダー
          if (content.includes('install') || content.includes('setup')) quality += 20; // インストール説明
          if (content.includes('usage') || content.includes('example')) quality += 20; // 使用例
          if (content.includes('```') || content.includes('`')) quality += 20; // コードブロック
          
          break;
        } catch (error) {
          // ファイル読み込みエラーは無視
        }
      }
    }
    
    return quality;
  }
}