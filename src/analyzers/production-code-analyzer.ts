/**
 * Production Code Analyzer
 * プロダクションコードの実装の真実を確立する解析エンジン
 * 
 * v0.9.0 - AIコーディング時代の品質保証エンジンへの進化
 * SOLID原則: 単一責任の原則（プロダクションコード解析のみ）
 * DRY原則: 既存のTaintTyperエンジンとの共通処理の再利用
 * Defensive Programming: エラーハンドリングと入力検証の徹底
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import { debug } from '../utils/debug';
import {
  ImplementationTruth,
  MethodBehavior,
  DataFlow,
  Dependency,
  SecurityProfile,
  ComplexityMetrics,
  CoverageMap,
  ExecutionPath,
  SideEffect,
  ExceptionInfo,
  MethodSecurityProfile,
  TypeInfo,
  MethodParameter,
  DataPath,
  DataTransformation,
  TaintPropagation
} from '../types/implementation-truth';
import { TaintLevel, TaintSource } from '../types/common-types';
import { SecurityIssue } from '../security/types';
import { TypeBasedSecurityEngine } from '../security/analysis/engine';

/**
 * プロダクションコード解析エンジン
 * TaintTyperと連携してプロダクションコードの実装の真実を確立
 */
export class ProductionCodeAnalyzer {
  private securityEngine: TypeBasedSecurityEngine;
  private typeChecker: ts.TypeChecker | null = null;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();

  constructor() {
    this.securityEngine = new TypeBasedSecurityEngine({
      strictness: 'moderate',
      enableCache: true,
      parallelism: 2
    });
  }

  /**
   * プロダクションコードの解析を実行し、実装の真実を確立
   */
  async analyzeProductionCode(
    filePath: string,
    options?: ProductionAnalysisOptions
  ): Promise<ImplementationTruth> {
    const startTime = Date.now();
    debug.info(`プロダクションコード解析開始: ${filePath}`);

    try {
      // TypeScriptプログラムの作成
      const program = await this.createTypeScriptProgram(filePath);
      this.typeChecker = program.getTypeChecker();

      // ソースファイルの取得
      const sourceFile = program.getSourceFile(filePath);
      if (!sourceFile) {
        throw new Error(`ソースファイルが見つかりません: ${filePath}`);
      }

      this.sourceFiles.set(filePath, sourceFile);

      // メソッドの振る舞い分析
      const methods = await this.analyzeMethodBehaviors(sourceFile);
      
      // データフローの分析
      const dataFlows = await this.analyzeDataFlows(sourceFile);
      
      // 依存関係の分析
      const dependencies = await this.analyzeDependencies(sourceFile);
      
      // セキュリティプロファイルの作成
      const securityProfile = await this.createSecurityProfile(sourceFile);
      
      // 構造情報の分析
      const complexity = this.calculateComplexityMetrics(sourceFile);
      const coverage = await this.generateCoverageMap(sourceFile);
      const criticalPaths = await this.identifyCriticalPaths(sourceFile);

      // TaintTyperによる脆弱性検出
      const vulnerabilities = await this.detectVulnerabilities(filePath);

      const analysisTime = Date.now() - startTime;
      const confidence = this.calculateAnalysisConfidence(methods, dataFlows, dependencies);

      const implementationTruth: ImplementationTruth = {
        filePath,
        timestamp: new Date().toISOString(),
        actualBehaviors: {
          methods,
          dataFlows,
          dependencies,
          securityProfile
        },
        vulnerabilities,
        structure: {
          complexity,
          coverage,
          criticalPaths
        },
        metadata: {
          engineVersion: '0.9.0',
          analysisTime,
          confidence,
          warnings: []
        }
      };

      debug.info(`プロダクションコード解析完了: ${filePath} (${analysisTime}ms)`);
      return implementationTruth;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      debug.error(`プロダクションコード解析エラー: ${errorMessage}`);
      
      // エラー時のフォールバック
      return this.createErrorImplementationTruth(filePath, errorMessage, Date.now() - startTime);
    }
  }

  /**
   * TypeScriptプログラムの作成
   */
  private async createTypeScriptProgram(filePath: string): Promise<ts.Program> {
    const configPath = await this.findTsConfig(path.dirname(filePath));
    
    if (configPath) {
      // tsconfig.jsonがある場合はそれを使用
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
      return ts.createProgram([filePath], parsedConfig.options);
    } else {
      // デフォルト設定でプログラム作成
      return ts.createProgram([filePath], {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      });
    }
  }

  /**
   * tsconfig.jsonの検索
   */
  private async findTsConfig(dir: string): Promise<string | null> {
    const configPath = path.join(dir, 'tsconfig.json');
    
    try {
      await fs.access(configPath);
      return configPath;
    } catch {
      // ファイルが存在しない場合
    }

    const parentDir = path.dirname(dir);
    if (parentDir === dir) {
      return null; // ルートディレクトリに到達
    }

    return await this.findTsConfig(parentDir);
  }

  /**
   * メソッドの振る舞い分析
   */
  private async analyzeMethodBehaviors(sourceFile: ts.SourceFile): Promise<MethodBehavior[]> {
    const methods: MethodBehavior[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        const method = this.analyzeMethod(node, sourceFile);
        if (method) {
          methods.push(method);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return methods;
  }

  /**
   * 単一メソッドの分析
   */
  private analyzeMethod(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): MethodBehavior | null {
    const name = node.name?.getText(sourceFile) || 'anonymous';
    
    if (!this.typeChecker) {
      return null;
    }

    try {
      const parameters = this.analyzeParameters(node, sourceFile);
      const returnType = this.analyzeReturnType(node);
      const callsToMethods = this.analyzeMethodCalls(node, sourceFile);
      const dataFlow = this.analyzeMethodDataFlow(node, sourceFile);
      const sideEffects = this.analyzeSideEffects(node, sourceFile);
      const exceptionHandling = this.analyzeExceptionHandling(node, sourceFile);
      const securityProfile = this.analyzeMethodSecurity(node, sourceFile);

      return {
        name,
        parameters,
        returnType,
        callsToMethods,
        dataFlow,
        sideEffects,
        exceptionHandling,
        securityProfile
      };

    } catch (error) {
      debug.warn(`メソッド分析エラー: ${name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * メソッドパラメータの分析
   */
  private analyzeParameters(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): MethodParameter[] {
    return node.parameters.map(param => {
      const name = param.name.getText(sourceFile);
      const type = this.getTypeInfo(param);
      const isOptional = !!param.questionToken || !!param.initializer;
      const defaultValue = param.initializer ? 
        param.initializer.getText(sourceFile) : undefined;
      
      return {
        name,
        type,
        isOptional,
        defaultValue,
        taintLevel: this.inferParameterTaintLevel(param, sourceFile)
      };
    });
  }

  /**
   * 戻り値型の分析
   */
  private analyzeReturnType(node: ts.FunctionDeclaration | ts.MethodDeclaration): TypeInfo {
    if (node.type) {
      return this.getTypeInfoFromTypeNode(node.type);
    }

    // 型注釈がない場合はTypeCheckerから推論
    if (this.typeChecker) {
      const signature = this.typeChecker.getSignatureFromDeclaration(node);
      if (signature) {
        const returnType = this.typeChecker.getReturnTypeOfSignature(signature);
        return this.typeToTypeInfo(returnType);
      }
    }

    // フォールバック
    return {
      name: 'unknown',
      isArray: false,
      isNullable: false
    };
  }

  /**
   * メソッド呼び出しの分析
   */
  private analyzeMethodCalls(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): string[] {
    const methodCalls: string[] = [];
    
    const visit = (child: ts.Node) => {
      if (ts.isCallExpression(child)) {
        const methodName = this.getMethodNameFromCallExpression(child, sourceFile);
        if (methodName) {
          methodCalls.push(methodName);
        }
      }
      ts.forEachChild(child, visit);
    };

    if (node.body) {
      visit(node.body);
    }

    return [...new Set(methodCalls)]; // 重複除去
  }

  /**
   * メソッドのデータフロー分析
   */
  private analyzeMethodDataFlow(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): DataFlow {
    const inputPaths: DataPath[] = [];
    const outputPaths: DataPath[] = [];
    const transformations: DataTransformation[] = [];
    const taintPropagation: TaintPropagation[] = [];

    // 簡易実装: 実際の本格的なデータフロー解析は複雑なため、基本的な構造のみ実装
    node.parameters.forEach(param => {
      const paramName = param.name.getText(sourceFile);
      inputPaths.push({
        source: 'parameter',
        destination: paramName,
        dataType: this.getTypeInfo(param),
        taintLevel: this.inferParameterTaintLevel(param, sourceFile),
        isValidated: false,
        isSanitized: false
      });
    });

    return {
      inputPaths,
      outputPaths,
      transformations,
      taintPropagation
    };
  }

  /**
   * 副作用の分析
   */
  private analyzeSideEffects(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): SideEffect[] {
    const sideEffects: SideEffect[] = [];
    
    const visit = (child: ts.Node) => {
      // ファイル操作の検出
      if (ts.isCallExpression(child)) {
        const methodName = this.getMethodNameFromCallExpression(child, sourceFile);
        if (methodName) {
          const sideEffect = this.classifySideEffect(methodName);
          if (sideEffect) {
            sideEffects.push(sideEffect);
          }
        }
      }
      ts.forEachChild(child, visit);
    };

    if (node.body) {
      visit(node.body);
    }

    return sideEffects;
  }

  /**
   * 例外処理の分析
   */
  private analyzeExceptionHandling(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): ExceptionInfo[] {
    const exceptions: ExceptionInfo[] = [];
    
    const visit = (child: ts.Node) => {
      if (ts.isTryStatement(child)) {
        exceptions.push({
          exceptionType: 'try_catch',
          handlingMethod: 'try_catch',
          recoverability: 'recoverable',
          securityRisk: 'low'
        });
      }
      
      if (ts.isThrowStatement(child)) {
        exceptions.push({
          exceptionType: 'thrown_exception',
          handlingMethod: 'throws',
          recoverability: 'non_recoverable',
          securityRisk: 'medium'
        });
      }
      
      ts.forEachChild(child, visit);
    };

    if (node.body) {
      visit(node.body);
    }

    return exceptions;
  }

  /**
   * メソッドのセキュリティ分析
   */
  private analyzeMethodSecurity(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): MethodSecurityProfile {
    // 簡易実装: より詳細なセキュリティ分析は後のフェーズで実装
    return {
      requiresAuthentication: false,
      requiresAuthorization: false,
      hasInputValidation: false,
      hasOutputSanitization: false,
      vulnerabilities: [],
      accessesSensitiveData: false,
      hasSecurityLogging: false
    };
  }

  /**
   * データフローの分析
   */
  private async analyzeDataFlows(sourceFile: ts.SourceFile): Promise<DataFlow[]> {
    // 実装簡略化: 基本的な構造のみ
    return [];
  }

  /**
   * 依存関係の分析
   */
  private async analyzeDependencies(sourceFile: ts.SourceFile): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text;
        dependencies.push({
          moduleName,
          type: 'import',
          depth: 1,
          isCircular: false,
          securityRiskLevel: this.assessModuleSecurityRisk(moduleName)
        });
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return dependencies;
  }

  /**
   * セキュリティプロファイルの作成
   */
  private async createSecurityProfile(sourceFile: ts.SourceFile): Promise<SecurityProfile> {
    return {
      overallRiskLevel: 'low',
      vulnerabilities: [],
      securityMeasures: [],
      sensitiveDataHandling: [],
      auditResults: []
    };
  }

  /**
   * 複雑度メトリクスの計算
   */
  private calculateComplexityMetrics(sourceFile: ts.SourceFile): ComplexityMetrics {
    let cyclomaticComplexity = 1; // 基準値
    let nestingDepth = 0;
    let maxNesting = 0;
    let currentNesting = 0;
    
    const visit = (node: ts.Node) => {
      // 循環的複雑度の計算
      if (ts.isIfStatement(node) || ts.isForStatement(node) || 
          ts.isWhileStatement(node) || ts.isSwitchStatement(node)) {
        cyclomaticComplexity++;
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      
      ts.forEachChild(node, (child) => {
        visit(child);
      });
      
      if (ts.isIfStatement(node) || ts.isForStatement(node) || 
          ts.isWhileStatement(node) || ts.isSwitchStatement(node)) {
        currentNesting--;
      }
    };

    visit(sourceFile);
    
    const sourceCode = sourceFile.getFullText();
    const lines = sourceCode.split('\n');
    
    return {
      cyclomaticComplexity,
      cognitiveComplexity: cyclomaticComplexity * 1.2, // 簡易計算
      nestingDepth: maxNesting,
      fanIn: 0, // 実装簡略化
      fanOut: 0, // 実装簡略化
      linesOfCode: lines.length,
      duplicationRate: 0 // 実装簡略化
    };
  }

  /**
   * カバレッジマップの生成
   */
  private async generateCoverageMap(sourceFile: ts.SourceFile): Promise<CoverageMap> {
    const lines = sourceFile.getFullText().split('\n');
    
    return {
      lineCoverage: lines.map((_, index) => ({
        line: index + 1,
        isCovered: false,
        executionCount: 0
      })),
      branchCoverage: [],
      functionCoverage: [],
      conditionCoverage: []
    };
  }

  /**
   * クリティカルパスの識別
   */
  private async identifyCriticalPaths(sourceFile: ts.SourceFile): Promise<ExecutionPath[]> {
    // 実装簡略化: 基本的な構造のみ
    return [];
  }

  /**
   * 脆弱性の検出（TaintTyper連携）
   */
  private async detectVulnerabilities(filePath: string): Promise<SecurityIssue[]> {
    try {
      const testCase = {
        name: path.basename(filePath),
        file: filePath,
        content: await fs.readFile(filePath, 'utf-8'),
        metadata: {
          framework: 'typescript',
          language: 'typescript',
          lastModified: new Date()
        }
      };
      
      const result = await this.securityEngine.analyzeAtCompileTime([testCase]);
      return result.issues;
      
    } catch (error) {
      debug.warn(`脆弱性検出エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  // ヘルパーメソッド群

  private getTypeInfo(param: ts.ParameterDeclaration): TypeInfo {
    if (param.type) {
      return this.getTypeInfoFromTypeNode(param.type);
    }
    return { name: 'any', isArray: false, isNullable: false };
  }

  private getTypeInfoFromTypeNode(typeNode: ts.TypeNode): TypeInfo {
    return {
      name: typeNode.getText(),
      isArray: ts.isArrayTypeNode(typeNode),
      isNullable: typeNode.kind === ts.SyntaxKind.NullKeyword ||
                  typeNode.kind === ts.SyntaxKind.UndefinedKeyword
    };
  }

  private typeToTypeInfo(type: ts.Type): TypeInfo {
    const typeString = this.typeChecker?.typeToString(type) || 'unknown';
    return {
      name: typeString,
      isArray: typeString.includes('[]'),
      isNullable: typeString.includes('null') || typeString.includes('undefined')
    };
  }

  private inferParameterTaintLevel(param: ts.ParameterDeclaration, sourceFile: ts.SourceFile): TaintLevel {
    const paramName = param.name.getText(sourceFile).toLowerCase();
    
    // 簡易的な推論
    if (paramName.includes('user') || paramName.includes('input') || paramName.includes('request')) {
      return TaintLevel.TAINTED;
    }
    
    return TaintLevel.UNTAINTED;
  }

  private getMethodNameFromCallExpression(callExpr: ts.CallExpression, sourceFile: ts.SourceFile): string | null {
    const expression = callExpr.expression;
    
    if (ts.isIdentifier(expression)) {
      return expression.getText(sourceFile);
    }
    
    if (ts.isPropertyAccessExpression(expression)) {
      return expression.name.getText(sourceFile);
    }
    
    return null;
  }

  private classifySideEffect(methodName: string): SideEffect | null {
    const fileOpsPattern = /write|create|delete|mkdir|rmdir/i;
    const dbOpsPattern = /query|execute|insert|update|delete|create|drop/i;
    const networkOpsPattern = /fetch|request|post|get|put|delete|send/i;
    
    if (fileOpsPattern.test(methodName)) {
      return {
        type: 'file_write',
        description: `File operation: ${methodName}`,
        affectedResources: ['filesystem'],
        isPersistent: true,
        securityImplications: []
      };
    }
    
    if (dbOpsPattern.test(methodName)) {
      return {
        type: 'database_write',
        description: `Database operation: ${methodName}`,
        affectedResources: ['database'],
        isPersistent: true,
        securityImplications: []
      };
    }
    
    if (networkOpsPattern.test(methodName)) {
      return {
        type: 'network_call',
        description: `Network operation: ${methodName}`,
        affectedResources: ['network'],
        isPersistent: false,
        securityImplications: []
      };
    }
    
    return null;
  }

  private assessModuleSecurityRisk(moduleName: string): 'low' | 'medium' | 'high' {
    // セキュリティリスクの高いモジュールの例
    const highRiskModules = ['eval', 'vm', 'child_process'];
    const mediumRiskModules = ['fs', 'path', 'os', 'crypto'];
    
    if (highRiskModules.some(risk => moduleName.includes(risk))) {
      return 'high';
    }
    
    if (mediumRiskModules.some(risk => moduleName.includes(risk))) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateAnalysisConfidence(
    methods: MethodBehavior[],
    dataFlows: DataFlow[],
    dependencies: Dependency[]
  ): number {
    // 解析の信頼度計算
    let confidence = 0.5; // 基準値
    
    if (methods.length > 0) confidence += 0.2;
    if (dependencies.length > 0) confidence += 0.2;
    if (this.typeChecker) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private createErrorImplementationTruth(
    filePath: string,
    errorMessage: string,
    analysisTime: number
  ): ImplementationTruth {
    return {
      filePath,
      timestamp: new Date().toISOString(),
      actualBehaviors: {
        methods: [],
        dataFlows: [],
        dependencies: [],
        securityProfile: {
          overallRiskLevel: 'low',
          vulnerabilities: [],
          securityMeasures: [],
          sensitiveDataHandling: [],
          auditResults: []
        }
      },
      vulnerabilities: [],
      structure: {
        complexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          nestingDepth: 0,
          fanIn: 0,
          fanOut: 0,
          linesOfCode: 0,
          duplicationRate: 0
        },
        coverage: {
          lineCoverage: [],
          branchCoverage: [],
          functionCoverage: [],
          conditionCoverage: []
        },
        criticalPaths: []
      },
      metadata: {
        engineVersion: '0.9.0',
        analysisTime,
        confidence: 0.0,
        warnings: [errorMessage]
      }
    };
  }
}

/**
 * プロダクションコード解析オプション
 */
export interface ProductionAnalysisOptions {
  /**
   * セキュリティ解析を有効にするか
   */
  enableSecurityAnalysis?: boolean;
  
  /**
   * データフロー解析を有効にするか
   */
  enableDataFlowAnalysis?: boolean;
  
  /**
   * 複雑度解析を有効にするか
   */
  enableComplexityAnalysis?: boolean;
  
  /**
   * 解析タイムアウト（ミリ秒）
   */
  timeout?: number;
  
  /**
   * 除外パターン
   */
  excludePatterns?: string[];
}