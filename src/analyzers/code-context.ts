import * as fs from 'fs';
import * as path from 'path';
import { Issue } from '../core/types';
import { 
  AnalysisOptions, 
  ExtractedCodeContext, 
  FunctionInfo, 
  ClassInfo, 
  InterfaceInfo, 
  VariableInfo, 
  ScopeInfo, 
  RelatedFileInfo 
} from './types';
import { errorHandler, ErrorType } from '../utils/errorHandler';
import { PathSecurity } from '../utils/pathSecurity';
import { ResourceLimitMonitor, DEFAULT_ANALYSIS_LIMITS } from '../utils/resourceLimits';

/**
 * 高度なコードコンテキスト分析器 v0.5.0
 * AI向け出力の品質向上のための詳細なコード解析
 */
export class AdvancedCodeContextAnalyzer {
  private resourceMonitor: ResourceLimitMonitor;

  constructor(resourceMonitor?: ResourceLimitMonitor) {
    this.resourceMonitor = resourceMonitor || new ResourceLimitMonitor();
  }

  /**
   * 包括的なコードコンテキスト分析
   */
  async analyzeCodeContext(
    issue: Issue, 
    projectPath: string, 
    options: AnalysisOptions = {}
  ): Promise<ExtractedCodeContext> {
    // リソース監視開始
    this.resourceMonitor.startAnalysis();
    const startTime = Date.now();
    
    try {
      const filePath = PathSecurity.safeResolve(issue.file || '', projectPath, 'analyzeCodeContext');
      if (!filePath) {
        const language = this.detectLanguage(issue.file || '');
        return this.createEmptyContext(language, startTime);
      }
      const language = this.detectLanguage(filePath);
      
      // ファイル存在確認
      if (!fs.existsSync(filePath)) {
        return this.createEmptyContext(language, startTime);
      }

      // ファイルサイズチェック
      const stats = fs.statSync(filePath);
      if (!this.resourceMonitor.checkFileSize(stats.size, filePath)) {
        return this.createEmptyContext(language, startTime);
      }

      const fileContent = await this.readFileContent(filePath, projectPath);
      const targetLine = (issue.line || 1) - 1;
      const requestedContextLines = options.contextLines || 10;
      const contextLines = this.resourceMonitor.checkContextLines(requestedContextLines);

      // 基本コンテキスト抽出
      const { targetCode, surroundingCode } = this.extractBasicContext(
        fileContent, 
        targetLine, 
        contextLines
      );

      // 並列で各種分析を実行
      const [
        imports,
        exports,
        functions,
        classes,
        interfaces,
        variables,
        scopes,
        relatedFiles,
        usedAPIs
      ] = await Promise.all([
        this.extractImports(fileContent, options.includeImports),
        this.extractExports(fileContent, options.includeExports),
        options.analyzeFunctions ? this.extractFunctionInfo(fileContent, language) : Promise.resolve([]),
        options.analyzeClasses ? this.extractClassInfo(fileContent, language) : Promise.resolve([]),
        options.analyzeInterfaces ? this.extractInterfaceInfo(fileContent, language) : Promise.resolve([]),
        options.analyzeVariables ? this.extractVariableInfo(fileContent, language) : Promise.resolve([]),
        options.analyzeScopes ? this.analyzeScopeContext(fileContent, targetLine) : Promise.resolve([]),
        options.detectRelatedFiles ? this.detectRelatedCode(filePath, projectPath, options) : Promise.resolve([]),
        this.extractUsedAPIs(fileContent, language)
      ]);

      const endTime = Date.now();

      return {
        targetCode,
        surroundingCode,
        imports,
        exports,
        functions,
        classes,
        interfaces,
        variables,
        scopes,
        relatedFiles,
        usedAPIs,
        metadata: {
          language,
          fileSize: fileContent.length,
          analysisTime: endTime - startTime,
          confidence: this.calculateConfidence(fileContent, language)
        }
      };

    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PARSE_ERROR,
        'コードコンテキスト分析でエラーが発生しました',
        { filePath: issue.file, projectPath },
        true
      );
      return this.createEmptyContext(this.detectLanguage(issue.file || ''), startTime);
    }
  }

  /**
   * 関数情報の詳細抽出
   */
  async extractFunctionInfo(fileContent: string, language: string): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];
    const lines = fileContent.split('\n');

    try {
      if (language === 'typescript' || language === 'javascript') {
        return this.extractJSTSFunctions(fileContent, lines);
      } else if (language === 'python') {
        return this.extractPythonFunctions(fileContent, lines);
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PARSE_ERROR,
        '関数抽出処理でエラーが発生しました',
        { language, contentLength: fileContent.length },
        true
      );
    }

    return functions;
  }

  /**
   * スコープコンテキスト分析
   */
  async analyzeScopeContext(fileContent: string, targetLine: number): Promise<ScopeInfo[]> {
    const scopes: ScopeInfo[] = [];
    const lines = fileContent.split('\n');

    try {
      // シンプルなスコープ分析（ブロックベース）
      let currentScope: ScopeInfo | null = null;
      let braceLevel = 0;
      let inFunction = false;
      let inClass = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 関数スコープの検出
        if (this.isFunctionDeclaration(line)) {
          inFunction = true;
          const scope: ScopeInfo = {
            type: 'function',
            startLine: i + 1,
            endLine: -1,
            variables: this.extractVariablesFromLine(line),
            children: []
          };
          
          if (currentScope) {
            currentScope.children.push(scope);
            scope.parent = currentScope;
          }
          
          scopes.push(scope);
          currentScope = scope;
        }

        // クラススコープの検出
        if (this.isClassDeclaration(line)) {
          inClass = true;
          const scope: ScopeInfo = {
            type: 'class',
            startLine: i + 1,
            endLine: -1,
            variables: [],
            children: []
          };
          
          if (currentScope) {
            currentScope.children.push(scope);
            scope.parent = currentScope;
          }
          
          scopes.push(scope);
          currentScope = scope;
        }

        // ブロックスコープの検出（if/for/while等）
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        
        if (this.isBlockStatement(line) && openBraces > 0) {
          const scope: ScopeInfo = {
            type: 'block',
            startLine: i + 1,
            endLine: -1,
            variables: [],
            children: []
          };
          
          if (currentScope) {
            currentScope.children.push(scope);
            scope.parent = currentScope;
          }
          
          scopes.push(scope);
          currentScope = scope;
        }
        
        braceLevel += openBraces - closeBraces;

        // 変数宣言の検出
        if (this.isVariableDeclaration(line)) {
          const variables = this.extractVariablesFromLine(line);
          
          if (currentScope) {
            currentScope.variables.push(...variables);
          } else {
            // グローバルスコープ
            let globalScope = scopes.find(s => s.type === 'global');
            if (!globalScope) {
              globalScope = {
                type: 'global',
                startLine: 1,
                endLine: lines.length,
                variables: [],
                children: []
              };
              scopes.unshift(globalScope);
            }
            globalScope.variables.push(...variables);
          }
        }

        // スコープの終了
        if (braceLevel === 0 && currentScope && currentScope.endLine === -1) {
          currentScope.endLine = i + 1;
          currentScope = currentScope.parent || null;
        }
      }

      // 未完了のスコープを終了
      scopes.forEach(scope => {
        if (scope.endLine === -1) {
          scope.endLine = lines.length;
        }
      });

    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PARSE_ERROR,
        'スコープ分析でエラーが発生しました',
        { contentLength: fileContent.length },
        true
      );
    }

    return scopes;
  }

  /**
   * 関連コードの検出
   */
  async detectRelatedCode(
    targetFile: string, 
    projectPath: string, 
    options: AnalysisOptions = {}
  ): Promise<RelatedFileInfo[]> {
    const relatedFiles: RelatedFileInfo[] = [];
    const maxFiles = options.maxRelatedFiles || 10;

    try {
      const targetContent = await this.readFileContent(targetFile, projectPath);
      const imports = await this.extractImports(targetContent, true);
      
      // インポートベースの関連ファイル検出
      for (const importPath of imports) {
        const resolvedPath = this.resolveImportPath(importPath, targetFile, projectPath);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
          relatedFiles.push({
            path: path.relative(projectPath, resolvedPath),
            relationship: 'import',
            confidence: 0.9,
            reason: `Imported from ${importPath}`,
            size: fs.statSync(resolvedPath).size,
            lastModified: fs.statSync(resolvedPath).mtime
          });
        } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // 相対パスの場合、ファイル拡張子を推測して再試行
          const baseDir = path.dirname(targetFile);
          const possiblePaths = [
            path.resolve(baseDir, importPath + '.ts'),
            path.resolve(baseDir, importPath + '.js'),
            path.resolve(baseDir, importPath, 'index.ts'),
            path.resolve(baseDir, importPath, 'index.js')
          ];

          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              relatedFiles.push({
                path: path.relative(projectPath, possiblePath),
                relationship: 'import',
                confidence: 0.8,
                reason: `Resolved import from ${importPath}`,
                size: fs.statSync(possiblePath).size,
                lastModified: fs.statSync(possiblePath).mtime
              });
              break;
            }
          }
        }
      }

      // テストファイルの検出
      if (options.includeTests) {
        const testFiles = await this.findTestFiles(targetFile, projectPath);
        testFiles.forEach(testFile => {
          relatedFiles.push({
            path: path.relative(projectPath, testFile),
            relationship: 'test',
            confidence: 0.8,
            reason: 'Corresponding test file',
            size: fs.statSync(testFile).size,
            lastModified: fs.statSync(testFile).mtime
          });
        });
      }

      // 類似ファイルの検出
      const similarFiles = await this.findSimilarFiles(targetFile, projectPath, maxFiles);
      similarFiles.forEach(similarFile => {
        relatedFiles.push({
          path: path.relative(projectPath, similarFile.path),
          relationship: 'similar',
          confidence: similarFile.similarity,
          reason: `Similar content (${Math.round(similarFile.similarity * 100)}% similarity)`,
          size: fs.existsSync(similarFile.path) ? fs.statSync(similarFile.path).size : 0
        });
      });

    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PARSE_ERROR,
        '関連コード検出でエラーが発生しました',
        { targetFile, projectPath },
        true
      );
    }

    return relatedFiles
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxFiles);
  }

  // プライベートメソッド群

  private async readFileContent(filePath: string, projectPath?: string): Promise<string> {
    // セキュリティ: ファイルタイプ検証
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.json', '.md'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`サポートされていないファイル形式: ${ext}`);
    }

    // セキュリティ: パス検証（プロジェクトパスが提供された場合）
    if (projectPath && !PathSecurity.validateProjectPath(filePath, projectPath)) {
      throw new Error('セキュリティ: ファイルパスがプロジェクト範囲外です');
    }

    const stats = fs.statSync(filePath);
    if (!this.resourceMonitor.checkFileSize(stats.size, filePath)) {
      throw new Error(`ファイルサイズが制限を超えています: ${stats.size} bytes`);
    }
    
    // セキュリティ: シンボリックリンクのチェック
    if (stats.isSymbolicLink()) {
      throw new Error('セキュリティ: シンボリックリンクへのアクセスは許可されていません');
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts': return 'typescript';
      case '.js': return 'javascript';
      case '.py': return 'python';
      case '.java': return 'java';
      case '.go': return 'go';
      case '.rs': return 'rust';
      default: return 'unknown';
    }
  }

  private extractBasicContext(
    fileContent: string, 
    targetLine: number, 
    contextLines: number
  ): { targetCode: any, surroundingCode: any } {
    const lines = fileContent.split('\n');
    const startLine = Math.max(0, targetLine - contextLines);
    const endLine = Math.min(lines.length, targetLine + contextLines + 1);

    return {
      targetCode: {
        content: lines[targetLine] || '',
        startLine: targetLine + 1,
        endLine: targetLine + 1
      },
      surroundingCode: {
        before: lines.slice(startLine, targetLine).join('\n'),
        after: lines.slice(targetLine + 1, endLine).join('\n')
      }
    };
  }

  private async extractImports(fileContent: string, include: boolean = true): Promise<string[]> {
    if (!include) return [];

    const imports: string[] = [];
    const importRegexes = [
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g, // ES6 imports
      /import\s+['"`]([^'"`]+)['"`]/g, // Simple imports
      /const\s+.*?\s*=\s*require\(['"`]([^'"`]+)['"`]\)/g, // CommonJS require
      /from\s+['"`]([^'"`]+)['"`]\s+import/g // Python-style imports
    ];

    for (const regex of importRegexes) {
      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)];
  }

  private async extractExports(fileContent: string, include: boolean = true): Promise<string[]> {
    if (!include) return [];

    const exports: string[] = [];
    const exportRegexes = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
      /export\s*\{\s*([^}]+)\s*\}/g,
      /module\.exports\s*=\s*(\w+)/g
    ];

    for (const regex of exportRegexes) {
      let match;
      while ((match = regex.exec(fileContent)) !== null) {
        if (match[1].includes(',')) {
          // Multiple exports in braces
          const multiExports = match[1].split(',').map(e => e.trim().replace(/\s+as\s+\w+/, ''));
          exports.push(...multiExports);
        } else {
          exports.push(match[1]);
        }
      }
    }

    return [...new Set(exports)];
  }

  private async extractJSTSFunctions(fileContent: string, lines: string[]): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];
    
    // セキュリティ: 正規表現DoS攻撃を防ぐため、シンプルな正規表現を使用
    const functionRegexes = [
      /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
      /(?:async\s+)?(\w+)\s*:\s*\(([^)]*)\)\s*=>/,
      /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/,
      /(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*:\s*([^{]+)\s*\{/, // TypeScript method
    ];

    // セキュリティ: 正規表現の実行時間制限
    const REGEX_TIMEOUT_MS = 100;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const regex of functionRegexes) {
        try {
          // セキュリティ: 正規表現実行時間の制限
          const match = this.safeRegexMatch(line, regex, REGEX_TIMEOUT_MS);
          if (match) {
          const isAsync = line.includes('async');
          const parameters = match[2] ? 
            match[2].split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p) : 
            [];
          const returnType = match[3] ? match[3].trim() : undefined;

          // 関数の終了行を探す
          let endLine = i;
          let braceCount = 0;
          let foundStart = false;
          
          for (let j = i; j < lines.length; j++) {
            const currentLine = lines[j];
            const openBraces = (currentLine.match(/\{/g) || []).length;
            const closeBraces = (currentLine.match(/\}/g) || []).length;
            
            if (openBraces > 0) foundStart = true;
            braceCount += openBraces - closeBraces;
            
            if (foundStart && braceCount === 0) {
              endLine = j;
              break;
            }
          }

          functions.push({
            name: match[1],
            startLine: i + 1,
            endLine: endLine + 1,
            parameters,
            returnType,
            isAsync,
            isExported: line.includes('export') || line.includes('module.exports'),
            documentation: this.extractDocumentation(lines, i),
            complexity: this.calculateComplexity(lines.slice(i, endLine + 1)),
            calls: this.extractFunctionCalls(lines.slice(i, endLine + 1)),
            calledBy: [] // これは後で解析
          });
          
          break;
          }
        } catch (error) {
          // 正規表現実行エラーをログに記録し、処理を続行
          errorHandler.handleError(
            error,
            ErrorType.PARSE_ERROR,
            '正規表現実行でエラーが発生しました',
            { line: i + 1, regex: regex.source },
            true
          );
          continue;
        }
      }
    }

    return functions;
  }

  private async extractPythonFunctions(fileContent: string, lines: string[]): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
      
      if (match) {
        const parameters = match[2] ? 
          match[2].split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p && p !== 'self') : 
          [];

        // Pythonの関数終了行を探す（インデントベース）
        let endLine = i;
        const baseIndent = line.search(/\S/);
        
        for (let j = i + 1; j < lines.length; j++) {
          const currentLine = lines[j];
          if (currentLine.trim() === '') continue;
          
          const currentIndent = currentLine.search(/\S/);
          if (currentIndent <= baseIndent && currentLine.trim() !== '') {
            endLine = j - 1;
            break;
          }
          endLine = j;
        }

        functions.push({
          name: match[1],
          startLine: i + 1,
          endLine: endLine + 1,
          parameters,
          isAsync: line.includes('async def'),
          isExported: true, // Pythonでは基本的にすべてパブリック
          documentation: this.extractPythonDocstring(lines, i),
          complexity: this.calculateComplexity(lines.slice(i, endLine + 1)),
          calls: this.extractFunctionCalls(lines.slice(i, endLine + 1)),
          calledBy: []
        });
      }
    }

    return functions;
  }

  private async extractClassInfo(fileContent: string, language: string): Promise<ClassInfo[]> {
    const classes: ClassInfo[] = [];
    const lines = fileContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      if (language === 'typescript' || language === 'javascript') {
        match = line.match(/class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{?/);
      } else if (language === 'python') {
        match = line.match(/class\s+(\w+)(?:\(([^)]+)\))?\s*:/);
      }

      if (match) {
        const className = match[1];
        const extendsClass = match[2];
        const implementsInterfaces = match[3] ? match[3].split(',').map(i => i.trim()) : [];

        // クラスの終了行とメンバーを探す
        const { endLine, methods, properties } = this.extractClassMembers(lines, i, language);

        classes.push({
          name: className,
          startLine: i + 1,
          endLine: endLine + 1,
          methods,
          properties,
          extends: extendsClass,
          implements: implementsInterfaces,
          isExported: line.includes('export'),
          documentation: this.extractDocumentation(lines, i)
        });
      }
    }

    return classes;
  }

  private async extractInterfaceInfo(fileContent: string, language: string): Promise<InterfaceInfo[]> {
    const interfaces: InterfaceInfo[] = [];
    
    if (language !== 'typescript') return interfaces;

    const lines = fileContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{?/);

      if (match) {
        const interfaceName = match[1];
        const extendsInterfaces = match[2] ? match[2].split(',').map(i => i.trim()) : [];

        // インターフェースのメンバーを抽出
        const { endLine, properties, methods } = this.extractInterfaceMembers(lines, i);

        interfaces.push({
          name: interfaceName,
          startLine: i + 1,
          endLine: endLine + 1,
          properties,
          methods,
          extends: extendsInterfaces,
          isExported: line.includes('export'),
          documentation: this.extractDocumentation(lines, i)
        });
      }
    }

    return interfaces;
  }

  private async extractVariableInfo(fileContent: string, language: string): Promise<VariableInfo[]> {
    const variables: VariableInfo[] = [];
    const lines = fileContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const varsInLine = this.extractVariablesFromLine(line);
      
      varsInLine.forEach(varName => {
        variables.push({
          name: varName,
          type: this.extractVariableType(line, varName),
          scope: this.determineScope(lines, i),
          line: i + 1,
          isConst: line.includes('const'),
          isExported: line.includes('export'),
          usage: [] // 後で解析
        });
      });
    }

    return variables;
  }

  private extractUsedAPIs(fileContent: string, language: string): string[] {
    const apis = new Set<string>();
    
    // 一般的なAPIパターンを検出
    const patterns = [
      /\b(\w+)\.(\w+)\(/g, // オブジェクトメソッド呼び出し
      /\b(console|window|document|process|fs|path)\.(\w+)/g, // 標準ライブラリ
      /\b(expect|describe|it|test|beforeEach|afterEach)\(/g, // テストフレームワーク
      /\b(async|await|Promise)\b/g, // 非同期API
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(fileContent)) !== null) {
        if (match[1] && match[2]) {
          apis.add(`${match[1]}.${match[2]}`);
        } else {
          apis.add(match[1] || match[0]);
        }
      }
    }

    return Array.from(apis).slice(0, 20); // 上位20個
  }

  // ヘルパーメソッド群
  
  private createEmptyContext(language: string, startTime: number): ExtractedCodeContext {
    return {
      targetCode: { content: '', startLine: 1, endLine: 1 },
      surroundingCode: { before: '', after: '' },
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      variables: [],
      scopes: [],
      relatedFiles: [],
      usedAPIs: [],
      metadata: {
        language,
        fileSize: 0,
        analysisTime: Date.now() - startTime,
        confidence: 0
      }
    };
  }

  private calculateConfidence(fileContent: string, language: string): number {
    let confidence = 0.5; // ベース信頼度
    
    // ファイルサイズによる調整
    if (fileContent.length > 100) confidence += 0.1;
    if (fileContent.length > 1000) confidence += 0.1;
    
    // 言語検出の信頼度
    if (language !== 'unknown') confidence += 0.2;
    
    // 構造の複雑さによる調整
    const structureScore = (fileContent.match(/class|function|interface/g) || []).length;
    confidence += Math.min(structureScore * 0.05, 0.2);
    
    return Math.min(confidence, 1.0);
  }

  private isFunctionDeclaration(line: string): boolean {
    return /(?:function\s+\w+|(?:async\s+)?\w+\s*(?::\s*\([^)]*\)\s*=>\s*\{|\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|\([^)]*\)\s*:\s*[^{]*\{))/.test(line);
  }

  private isClassDeclaration(line: string): boolean {
    return /class\s+\w+/.test(line);
  }

  private isVariableDeclaration(line: string): boolean {
    return /(?:const|let|var)\s+\w+/.test(line);
  }

  private isBlockStatement(line: string): boolean {
    return /\b(if|for|while|switch|try|catch)\s*\(/.test(line);
  }

  private extractVariablesFromLine(line: string): string[] {
    const variables: string[] = [];
    const patterns = [
      /(?:const|let|var)\s+(\w+)/g,
      /(\w+)\s*:/g, // TypeScript parameter with type
      /function\s+\w+\s*\(([^)]*)\)/g // Function parameters
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        if (match[1]) {
          if (match[1].includes(',')) {
            variables.push(...match[1].split(',').map(v => v.trim()));
          } else {
            variables.push(match[1]);
          }
        }
      }
    }

    return variables.filter(v => v && /^\w+$/.test(v));
  }

  private extractDocumentation(lines: string[], lineIndex: number): string | undefined {
    // 前の行からドキュメントコメントを探す
    for (let i = lineIndex - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('/*') || line.startsWith('//')) {
        return line.replace(/^\/\*\*?|\*\/$/g, '').trim();
      }
      if (line !== '' && !line.startsWith('*')) break;
    }
    return undefined;
  }

  private extractPythonDocstring(lines: string[], lineIndex: number): string | undefined {
    // 次の行からdocstringを探す
    for (let i = lineIndex + 1; i < lines.length && i < lineIndex + 5; i++) {
      const line = lines[i].trim();
      if (line.startsWith('"""') || line.startsWith("'''")) {
        return line.replace(/^['"]{3}|['"]{3}$/g, '').trim();
      }
    }
    return undefined;
  }

  private calculateComplexity(lines: string[]): number {
    let complexity = 1; // ベース複雑度
    
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', 'try'];
    
    for (const line of lines) {
      for (const keyword of complexityKeywords) {
        if (new RegExp(`\\b${keyword}\\b`).test(line)) {
          complexity++;
        }
      }
    }
    
    return complexity;
  }

  private extractFunctionCalls(lines: string[]): string[] {
    const calls = new Set<string>();
    
    for (const line of lines) {
      const matches = line.match(/\b(\w+)\s*\(/g);
      if (matches) {
        matches.forEach(match => {
          const funcName = match.replace(/\s*\($/, '');
          if (funcName && !/^(if|while|for|switch)$/.test(funcName)) {
            calls.add(funcName);
          }
        });
      }
    }
    
    return Array.from(calls);
  }

  private extractClassMembers(lines: string[], startLine: number, language: string): {
    endLine: number;
    methods: string[];
    properties: string[];
  } {
    const methods: string[] = [];
    const properties: string[] = [];
    let endLine = startLine;
    let braceLevel = 0;
    let foundStart = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      if (openBraces > 0) foundStart = true;
      braceLevel += openBraces - closeBraces;

      // メソッドの検出
      const methodMatch = line.match(/(\w+)\s*\(/);
      if (methodMatch && !line.includes('=') && braceLevel > 0) {
        methods.push(methodMatch[1]);
      }

      // プロパティの検出
      const propertyMatch = line.match(/(?:private|public|protected)?\s*(\w+)\s*:/);
      if (propertyMatch && braceLevel > 0) {
        properties.push(propertyMatch[1]);
      }

      if (foundStart && braceLevel === 0) {
        endLine = i;
        break;
      }
    }

    return { endLine, methods, properties };
  }

  private extractInterfaceMembers(lines: string[], startLine: number): {
    endLine: number;
    properties: string[];
    methods: string[];
  } {
    const properties: string[] = [];
    const methods: string[] = [];
    let endLine = startLine;
    let braceLevel = 0;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      braceLevel += openBraces - closeBraces;

      if (braceLevel > 0 && line && !line.startsWith('{')) {
        const methodMatch = line.match(/(\w+)\s*\(/);
        if (methodMatch) {
          methods.push(methodMatch[1]);
        } else {
          const propertyMatch = line.match(/(\w+)\s*[?:]?\s*:/);
          if (propertyMatch) {
            properties.push(propertyMatch[1]);
          }
        }
      }

      if (braceLevel === 0 && i > startLine) {
        endLine = i;
        break;
      }
    }

    return { endLine, properties, methods };
  }

  private extractVariableType(line: string, varName: string): string | undefined {
    const typeMatch = line.match(new RegExp(`${varName}\\s*:\\s*([^=,;]+)`));
    return typeMatch ? typeMatch[1].trim() : undefined;
  }

  private determineScope(lines: string[], lineIndex: number): string {
    // 簡単なスコープ判定
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('function ')) return 'function';
      if (line.includes('class ')) return 'class';
    }
    return 'global';
  }

  private resolveImportPath(importPath: string, fromFile: string, projectPath: string): string | null {
    try {
      if (importPath.startsWith('.')) {
        // 相対パス
        const resolved = PathSecurity.safeResolveImport(importPath, fromFile, projectPath);
        if (!resolved) {
          return null;
        }
        
        const extensions = ['.ts', '.js', '.tsx', '.jsx'];
        return PathSecurity.safeResolveWithExtensions(resolved, extensions, projectPath);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * セキュリティ: 正規表現DoS攻撃を防ぐための安全な正規表現実行
   */
  private safeRegexMatch(text: string, regex: RegExp, timeoutMs: number = 100): RegExpMatchArray | null {
    // セキュリティ: 入力文字列の長さ制限
    if (text.length > 10000) {
      errorHandler.handleError(
        new Error('入力文字列が長すぎます'),
        ErrorType.PARSE_ERROR,
        '正規表現実行: 入力文字列の長さ制限を超えました',
        { textLength: text.length },
        true
      );
      return null;
    }

    const startTime = Date.now();
    try {
      const result = text.match(regex);
      const executionTime = Date.now() - startTime;
      
      // 実行時間の監視
      if (executionTime > timeoutMs) {
        errorHandler.handleError(
          new Error('正規表現実行時間超過'),
          ErrorType.TIMEOUT,
          '正規表現実行時間が制限を超えました',
          { executionTime, timeoutMs },
          true
        );
      }
      
      return result;
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PARSE_ERROR,
        '正規表現実行でエラーが発生しました',
        { regexSource: regex.source },
        true
      );
      return null;
    }
  }


=======
>>>>>>> aa3be86 (feat: Phase 2 - 高度なコードコンテキスト分析器を実装)
  private async findTestFiles(sourceFile: string, projectPath: string): Promise<string[]> {
    const testFiles: string[] = [];
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const dirName = path.dirname(sourceFile);
    
    const testPatterns = [
      `${baseName}.test.*`,
      `${baseName}.spec.*`,
      `${baseName}.*.test.*`,
      `${baseName}.*.spec.*`
    ];

    for (const pattern of testPatterns) {
      const testPath = path.join(dirName, pattern.replace('*', 'ts'));
      if (fs.existsSync(testPath)) {
        testFiles.push(testPath);
      }
      const jsTestPath = path.join(dirName, pattern.replace('*', 'js'));
      if (fs.existsSync(jsTestPath)) {
        testFiles.push(jsTestPath);
      }
    }

    return testFiles;
  }

  private async findSimilarFiles(
    targetFile: string, 
    projectPath: string, 
    maxFiles: number
  ): Promise<Array<{ path: string; similarity: number }>> {
    const similarFiles: Array<{ path: string; similarity: number }> = [];
    
    try {
      const targetContent = await this.readFileContent(targetFile, projectPath);
      const targetWords = this.extractWords(targetContent);
      
      // プロジェクト内の他のファイルを検索（簡単な実装）
      const allFiles = this.findAllSourceFiles(projectPath);
      
      for (const file of allFiles.slice(0, 50)) { // パフォーマンスのため制限
        if (file === targetFile) continue;
        
        try {
          const fileContent = await this.readFileContent(file, projectPath);
          const fileWords = this.extractWords(fileContent);
          const similarity = this.calculateSimilarity(targetWords, fileWords);
          
          if (similarity > 0.3) { // 30%以上の類似度
            similarFiles.push({ path: file, similarity });
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      errorHandler.handleError(
        error,
        ErrorType.PARSE_ERROR,
        '類似ファイル検索でエラーが発生しました',
        { targetFile, projectPath },
        true
      );
    }

    return similarFiles
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxFiles);
  }

  private findAllSourceFiles(projectPath: string): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java'];
    
    const traverse = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (extensions.includes(path.extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch {
        // ディレクトリアクセスエラーは無視
      }
    };

    traverse(projectPath);
    return files;
  }

  private extractWords(content: string): Set<string> {
    const words = new Set<string>();
    const matches = content.match(/\b[a-zA-Z_]\w*\b/g);
    
    if (matches) {
      matches.forEach(word => {
        if (word.length > 2 && !/^(the|and|for|are|but|not|you|all|can|her|was|one|our|had|day)$/.test(word.toLowerCase())) {
          words.add(word.toLowerCase());
        }
      });
    }
    
    return words;
  }

  private calculateSimilarity(words1: Set<string>, words2: Set<string>): number {
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}