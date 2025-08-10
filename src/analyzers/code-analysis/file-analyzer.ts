import * as fs from 'fs';
import * as path from 'path';
import { AnalysisOptions, RelatedFileInfo } from '../types';
import { PathSecurity } from '../../utils/pathSecurity';
import { LanguageAnalyzer } from './language-parser';

/**
 * ファイル構造解析機能
 */
export class FileAnalyzer {
  private languageAnalyzer: LanguageAnalyzer;

  constructor() {
    this.languageAnalyzer = new LanguageAnalyzer();
  }

  /**
   * 関連ファイルの検索
   */
  async findRelatedFiles(
    currentFilePath: string,
    projectPath: string,
    options: AnalysisOptions
  ): Promise<RelatedFileInfo[]> {
    const relatedFiles: RelatedFileInfo[] = [];
    
    try {
      const fileContent = fs.readFileSync(currentFilePath, 'utf-8');
      const language = this.languageAnalyzer.detectLanguage(currentFilePath);
      
      // インポートから関連ファイルを検索
      const imports = this.languageAnalyzer.extractImports(fileContent, language);
      
      for (const importObj of imports) {
        const resolvedPath = this.resolveImportPath(importObj.source, currentFilePath, projectPath);
        if (resolvedPath) {
          const possiblePaths = this.generatePossiblePaths(resolvedPath, projectPath);
          
          for (const possiblePath of possiblePaths) {
            const safePath = PathSecurity.safeResolve(possiblePath, projectPath, 'findRelatedFiles');
            if (safePath && fs.existsSync(safePath)) {
              const relatedFileInfo = await this.analyzeRelatedFile(safePath, currentFilePath);
              if (relatedFileInfo) {
                relatedFiles.push(relatedFileInfo);
              }
              break;
            }
          }
        }
      }
      
      // テストファイルの検索
      if (options.includeTests) {
        const testFiles = await this.findTestFiles(currentFilePath, projectPath);
        relatedFiles.push(...testFiles);
      }
      
      // 同じディレクトリ内の関連ファイル
      if (options.includeSiblings) {
        const siblingFiles = await this.findSiblingFiles(currentFilePath, projectPath);
        relatedFiles.push(...siblingFiles);
      }
      
    } catch (error) {
      console.warn(`関連ファイル検索エラー: ${currentFilePath}`, error);
    }
    
    return relatedFiles;
  }

  /**
   * テストファイルの検索
   */
  async findTestFiles(filePath: string, projectPath: string): Promise<RelatedFileInfo[]> {
    const testFiles: RelatedFileInfo[] = [];
    const fileName = path.basename(filePath, path.extname(filePath));
    const dirName = path.dirname(filePath);
    
    const testPatterns = [
      `${fileName}.test.ts`,
      `${fileName}.test.js`,
      `${fileName}.spec.ts`,
      `${fileName}.spec.js`,
      `${fileName}.test.tsx`,
      `${fileName}.spec.tsx`
    ];
    
    // 同じディレクトリ内のテストファイル
    for (const pattern of testPatterns) {
      const testPath = path.join(dirName, pattern);
      const safeTestPath = PathSecurity.safeResolve(testPath, projectPath, 'findTestFiles');
      
      if (safeTestPath && fs.existsSync(safeTestPath)) {
        const testFileInfo = await this.analyzeRelatedFile(safeTestPath, filePath);
        if (testFileInfo) {
          testFileInfo.relationship = 'test';
          testFiles.push(testFileInfo);
        }
      }
    }
    
    // __tests__ ディレクトリ内のテストファイル
    const testsDir = path.join(dirName, '__tests__');
    const safeTestsDir = PathSecurity.safeResolve(testsDir, projectPath, 'findTestFiles');
    
    if (safeTestsDir && fs.existsSync(safeTestsDir)) {
      for (const pattern of testPatterns) {
        const testPath = path.join(testsDir, pattern);
        const safeTestPath = PathSecurity.safeResolve(testPath, projectPath, 'findTestFiles');
        
        if (safeTestPath && fs.existsSync(safeTestPath)) {
          const testFileInfo = await this.analyzeRelatedFile(safeTestPath, filePath);
          if (testFileInfo) {
            testFileInfo.relationship = 'test';
            testFiles.push(testFileInfo);
          }
        }
      }
    }
    
    return testFiles;
  }

  /**
   * 同階層ファイルの検索
   */
  async findSiblingFiles(filePath: string, projectPath: string): Promise<RelatedFileInfo[]> {
    const siblingFiles: RelatedFileInfo[] = [];
    const dirName = path.dirname(filePath);
    const currentFileName = path.basename(filePath);
    
    try {
      const safeDirName = PathSecurity.safeResolve(dirName, projectPath, 'findSiblingFiles');
      if (!safeDirName) return siblingFiles;
      
      const files = fs.readdirSync(safeDirName);
      
      for (const file of files) {
        if (file === currentFileName) continue;
        
        const ext = path.extname(file);
        if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
          const siblingPath = path.join(dirName, file);
          const safeSiblingPath = PathSecurity.safeResolve(siblingPath, projectPath, 'findSiblingFiles');
          
          if (safeSiblingPath) {
            const siblingInfo = await this.analyzeRelatedFile(safeSiblingPath, filePath);
            if (siblingInfo) {
              siblingInfo.relationship = 'sibling';
              
              // 類似性チェック
              const similarity = await this.calculateFileSimilarity(filePath, safeSiblingPath);
              if (similarity > 0.3) { // 30%以上の類似度
                siblingInfo.similarity = similarity;
                siblingFiles.push(siblingInfo);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`同階層ファイル検索エラー: ${dirName}`, error);
    }
    
    return siblingFiles;
  }

  /**
   * プロジェクト内の全ソースファイルを検索
   */
  findAllSourceFiles(projectPath: string): string[] {
    const sourceFiles: string[] = [];
    
    try {
      const safeProjectPath = PathSecurity.safeResolve(projectPath, process.cwd(), 'findAllSourceFiles');
      if (!safeProjectPath) return sourceFiles;
      
      const entries = fs.readdirSync(safeProjectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        const fullPath = path.join(safeProjectPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = this.findAllSourceFiles(fullPath);
          sourceFiles.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs'].includes(ext)) {
            sourceFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`ソースファイル検索エラー: ${projectPath}`, error);
    }
    
    return sourceFiles;
  }

  /**
   * ファイル間の依存関係分析
   */
  async analyzeDependencies(filePath: string, projectPath: string): Promise<{
    dependencies: string[];
    dependents: string[];
  }> {
    const dependencies: string[] = [];
    const dependents: string[] = [];
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const language = this.languageAnalyzer.detectLanguage(filePath);
      
      // このファイルが依存しているファイル
      const imports = this.languageAnalyzer.extractImports(fileContent, language);
      for (const importObj of imports) {
        const resolvedPath = this.resolveImportPath(importObj.source, filePath, projectPath);
        if (resolvedPath) {
          dependencies.push(resolvedPath);
        }
      }
      
      // このファイルに依存しているファイル
      const allSourceFiles = this.findAllSourceFiles(projectPath);
      const relativePath = path.relative(projectPath, filePath);
      
      for (const sourceFile of allSourceFiles) {
        if (sourceFile === filePath) continue;
        
        try {
          const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
          const sourceLang = this.languageAnalyzer.detectLanguage(sourceFile);
          const sourceImports = this.languageAnalyzer.extractImports(sourceContent, sourceLang);
          
          for (const importObj of sourceImports) {
            const resolvedImport = this.resolveImportPath(importObj.source, sourceFile, projectPath);
            if (resolvedImport === filePath) {
              dependents.push(sourceFile);
              break;
            }
          }
        } catch (error) {
          // ファイル読み込みエラーは無視
        }
      }
      
    } catch (error) {
      console.warn(`依存関係分析エラー: ${filePath}`, error);
    }
    
    return { dependencies, dependents };
  }

  // Private helper methods

  /**
   * 関連ファイルの分析
   */
  private async analyzeRelatedFile(filePath: string, originFilePath: string): Promise<RelatedFileInfo | null> {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const language = this.languageAnalyzer.detectLanguage(filePath);
      
      return {
        path: filePath,
        relationship: 'import',
        confidence: 0.8,
        reason: 'File analysis',
        language,
        size: stats.size,
        lastModified: stats.mtime,
        exports: this.languageAnalyzer.extractExports(content, language),
        functions: await this.extractFunctionNames(content, language),
        similarity: 0
      };
    } catch (error) {
      console.warn(`関連ファイル分析エラー: ${filePath}`, error);
      return null;
    }
  }

  /**
   * ファイル間の類似性計算
   */
  private async calculateFileSimilarity(file1: string, file2: string): Promise<number> {
    try {
      const content1 = fs.readFileSync(file1, 'utf-8');
      const content2 = fs.readFileSync(file2, 'utf-8');
      
      const words1 = this.extractWords(content1);
      const words2 = this.extractWords(content2);
      
      return this.calculateSimilarity(words1, words2);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 単語の抽出
   */
  private extractWords(content: string): Set<string> {
    const words = new Set<string>();
    const matches = content.matchAll(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g);
    
    if (matches) {
      for (const match of matches) {
        if (match[0] && match[0].length > 2) {
          words.add(match[0].toLowerCase());
        }
      }
    }
    
    return words;
  }

  /**
   * 類似性の計算（Jaccard係数）
   */
  private calculateSimilarity(words1: Set<string>, words2: Set<string>): number {
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * ファイル構造の分析
   */
  async analyzeFileStructure(filePath: string, projectPath: string): Promise<any> {
    // ファイル構造の分析を実装
    const safeFilePath = PathSecurity.safeResolve(filePath, projectPath, 'analyzeFileStructure');
    if (!safeFilePath || !fs.existsSync(safeFilePath)) {
      return {
        exists: false,
        path: filePath,
        structure: null
      };
    }

    const stats = fs.statSync(safeFilePath);
    const content = fs.readFileSync(safeFilePath, 'utf-8');
    const lines = content.split('\n');
    const language = this.languageAnalyzer.detectLanguage(safeFilePath);

    return {
      exists: true,
      path: safeFilePath,
      structure: {
        size: stats.size,
        lines: lines.length,
        language,
        hasTests: /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(safeFilePath),
        imports: this.languageAnalyzer.extractImports(content, language),
        exports: this.languageAnalyzer.extractExports(content, language),
        functions: await this.extractFunctionNames(content, language),
        lastModified: stats.mtime
      }
    };
  }

  /**
   * 関数名の抽出
   */
  private async extractFunctionNames(content: string, language: string): Promise<string[]> {
    const functions = await this.languageAnalyzer.extractFunctionInfo(content, language);
    return functions.map(func => func.name);
  }

  /**
   * インポートパスの解決
   */
  private resolveImportPath(importPath: string, fromFile: string, projectPath: string): string | null {
    try {
      if (importPath.startsWith('.')) {
        // 相対パス
        const resolved = path.resolve(path.dirname(fromFile), importPath);
        if (!resolved) {
          return null;
        }
        return resolved;
      } else {
        // node_modules または絶対パス
        const possiblePaths = [
          path.join(projectPath, 'node_modules', importPath),
          path.join(projectPath, 'src', importPath),
          path.join(projectPath, importPath)
        ];
        
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            return possiblePath;
          }
        }
      }
    } catch (error) {
      console.warn(`インポートパス解決エラー: ${importPath}`, error);
    }
    
    return null;
  }

  /**
   * 可能なファイルパスの生成
   */
  private generatePossiblePaths(basePath: string, projectPath: string): string[] {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    const paths: string[] = [];
    
    // 拡張子なしのパス
    for (const ext of extensions) {
      paths.push(basePath + ext);
    }
    
    // index ファイルのパス
    for (const ext of extensions) {
      paths.push(path.join(basePath, 'index' + ext));
    }
    
    // package.json の main フィールドを確認
    try {
      const packageJsonPath = path.join(basePath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.main) {
          paths.push(path.join(basePath, packageJson.main));
        }
      }
    } catch (error) {
      // package.json読み込みエラーは無視
    }
    
    return paths;
  }

  /**
   * ディレクトリの深さ制限チェック
   */
  private isWithinDepthLimit(filePath: string, projectPath: string, maxDepth: number = 10): boolean {
    const relativePath = path.relative(projectPath, filePath);
    const depth = relativePath.split(path.sep).length;
    return depth <= maxDepth;
  }

  /**
   * ファイルサイズ制限チェック
   */
  private isWithinSizeLimit(filePath: string, maxSize: number = 1024 * 1024): boolean {
    try {
      const stats = fs.statSync(filePath);
      return stats.size <= maxSize;
    } catch (error) {
      return false;
    }
  }

  /**
   * 循環依存の検出
   */
  async detectCircularDependencies(filePath: string, projectPath: string): Promise<string[]> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];
    
    const detectCycle = async (currentFile: string, path: string[]): Promise<void> => {
      if (recursionStack.has(currentFile)) {
        // 循環依存を発見
        const cycleStart = path.indexOf(currentFile);
        const cycle = path.slice(cycleStart).concat([currentFile]);
        cycles.push(cycle.join(' -> '));
        return;
      }
      
      if (visited.has(currentFile)) {
        return;
      }
      
      visited.add(currentFile);
      recursionStack.add(currentFile);
      
      try {
        const content = fs.readFileSync(currentFile, 'utf-8');
        const language = this.languageAnalyzer.detectLanguage(currentFile);
        const imports = this.languageAnalyzer.extractImports(content, language);
        
        for (const importObj of imports) {
          const resolvedPath = this.resolveImportPath(importObj.source, currentFile, projectPath);
          if (resolvedPath && fs.existsSync(resolvedPath)) {
            await detectCycle(resolvedPath, [...path, currentFile]);
          }
        }
      } catch (error) {
        // ファイル読み込みエラーは無視
      }
      
      recursionStack.delete(currentFile);
    };
    
    await detectCycle(filePath, []);
    return cycles;
  }
}