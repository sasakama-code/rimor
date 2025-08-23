/**
 * データフロー解析器
 * arXiv:2504.18529v2の理論に基づいた実装
 * 
 * 機能:
 * - SourceからSinkまでのデータフローを追跡
 * - 汚染されたデータの伝播パスを特定
 * - 型ベース汚染解析の核心実装
 */

import * as ts from 'typescript';
import { TaintSource, ASTSourceDetector } from './ast-source-detector';
import { TaintSink, ASTSinkDetector } from './ast-sink-detector';

/**
 * データフローパス
 */
export interface DataFlowPath {
  /** 汚染源 */
  source: TaintSource;
  /** 汚染先 */
  sink: TaintSink;
  /** データフロー経路 */
  path: DataFlowStep[];
  /** 信頼度スコア */
  confidence: number;
  /** リスクレベル */
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * データフロー一歩
 */
export interface DataFlowStep {
  /** ステップタイプ */
  type: 'assignment' | 'parameter-passing' | 'return-value' | 'property-access' | 'method-call';
  /** 位置情報 */
  location: {
    file: string;
    line: number;
    column: number;
  };
  /** 変数名またはプロパティ名 */
  variableName: string;
  /** 説明 */
  description: string;
}

/**
 * データフロー分析結果
 */
export interface DataFlowAnalysisResult {
  /** 検出されたデータフローパス */
  paths: DataFlowPath[];
  /** ソース情報 */
  sources: TaintSource[];
  /** シンク情報 */
  sinks: TaintSink[];
  /** サマリー */
  summary: {
    totalPaths: number;
    criticalPaths: number;
    highRiskPaths: number;
    mediumRiskPaths: number;
    lowRiskPaths: number;
  };
}

/**
 * データフロー解析器
 */
export class DataFlowAnalyzer {
  private sourceDetector: ASTSourceDetector;
  private sinkDetector: ASTSinkDetector;
  private sourceFile: ts.SourceFile | null = null;
  private program: ts.Program | null = null;
  private typeChecker: ts.TypeChecker | null = null;

  constructor() {
    this.sourceDetector = new ASTSourceDetector();
    this.sinkDetector = new ASTSinkDetector();
  }

  /**
   * ソースコードを解析してデータフローを特定
   * @param sourceCode TypeScriptソースコード
   * @param fileName ファイル名
   * @returns データフロー分析結果
   */
  async analyzeDataFlow(sourceCode: string, fileName: string): Promise<DataFlowAnalysisResult> {
    // SourceとSinkを検出
    const [detectedSources, sinks] = await Promise.all([
      this.sourceDetector.detectSources(sourceCode, fileName),
      this.sinkDetector.detectSinks(sourceCode, fileName)
    ]);

    // 同じ関数呼び出しがsourceとsinkの両方で検出されている場合は、sourceから除外
    const sources = this.filterDuplicateSourceSinkPairs(detectedSources, sinks);

    // TypeScript プログラムの作成
    await this.setupTypeScriptProgram(sourceCode, fileName);

    // データフローパスを特定
    const paths = await this.findDataFlowPaths(sources, sinks, sourceCode);

    // サマリーを計算
    const summary = this.calculateSummary(paths);

    return {
      paths,
      sources,
      sinks,
      summary
    };
  }

  /**
   * 同じ関数呼び出しがsourceとsinkの両方で検出されている場合は、sourceから除外
   */
  private filterDuplicateSourceSinkPairs(sources: TaintSource[], sinks: TaintSink[]): TaintSource[] {
    return sources.filter(source => {
      // 同じ位置で同じ関数呼び出しがsinkとして存在するかチェック
      const conflictingSink = sinks.find(sink => {
        // 位置が同じかチェック
        const sameLocation = 
          sink.location.line === source.location.line &&
          Math.abs(sink.location.column - source.location.column) <= 5; // 若干の誤差を許容
        
        // 関数名が同じかチェック
        const sameFunctionCall = 
          sink.dangerousFunction.functionName === source.apiCall.functionName &&
          sink.dangerousFunction.objectName === source.apiCall.objectName;
        
        return sameLocation && sameFunctionCall;
      });
      
      // 競合するsinkが見つからない場合のみsourceとして保持
      return !conflictingSink;
    });
  }

  /**
   * TypeScriptプログラムの設定
   */
  private async setupTypeScriptProgram(sourceCode: string, fileName: string): Promise<void> {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      noImplicitAny: true
    };

    const host = ts.createCompilerHost(compilerOptions);
    const originalGetSourceFile = host.getSourceFile;
    
    host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (name === fileName) {
        return ts.createSourceFile(fileName, sourceCode, languageVersion, true);
      }
      return originalGetSourceFile.call(host, name, languageVersion, onError, shouldCreateNewSourceFile);
    };

    this.program = ts.createProgram([fileName], compilerOptions, host);
    this.sourceFile = this.program.getSourceFile(fileName) || null;
    this.typeChecker = this.program.getTypeChecker();
  }

  /**
   * データフローパスを特定
   */
  private async findDataFlowPaths(
    sources: TaintSource[],
    sinks: TaintSink[],
    sourceCode: string
  ): Promise<DataFlowPath[]> {
    const paths: DataFlowPath[] = [];

    // 各SourceとSinkの組み合わせをチェック
    for (const source of sources) {
      for (const sink of sinks) {
        const path = await this.tracePath(source, sink, sourceCode);
        if (path) {
          paths.push(path);
        }
      }
    }

    return paths;
  }

  /**
   * 個別のSource-Sinkペアのパスを追跡
   */
  private async tracePath(
    source: TaintSource,
    sink: TaintSink,
    sourceCode: string
  ): Promise<DataFlowPath | null> {
    if (!this.sourceFile) return null;

    // 簡単な名前ベースの追跡（将来的にはより高度な型ベース解析に拡張）
    const sourcePath = await this.findVariablePath(
      source.variableName,
      source.location,
      sink.location
    );

    if (!sourcePath || sourcePath.length === 0) {
      return null; // パスが見つからない
    }

    // リスクレベルを計算
    const riskLevel = this.calculateRiskLevel(source, sink);
    
    // 信頼度を計算
    const confidence = this.calculateConfidence(source, sink, sourcePath);

    return {
      source,
      sink,
      path: sourcePath,
      confidence,
      riskLevel
    };
  }

  /**
   * 変数のデータフローパスを特定
   */
  private async findVariablePath(
    variableName: string,
    sourceLocation: { line: number; column: number },
    sinkLocation: { line: number; column: number }
  ): Promise<DataFlowStep[]> {
    if (!this.sourceFile) return [];

    const steps: DataFlowStep[] = [];
    const sourceLines = this.sourceFile.getFullText().split('\n');
    let currentVariableName = variableName;

    // 行番号ベースでの変数追跡
    for (let lineIndex = sourceLocation.line - 1; lineIndex < sinkLocation.line; lineIndex++) {
      const line = sourceLines[lineIndex];
      if (!line) continue;

      // プロパティアクセスを最初にチェック (例: const filename = data.filename)
      const propertyMatch = line.match(new RegExp(`(const|let|var)\\s+(\\w+)\\s*=\\s*${currentVariableName}\\.(\\w+)`));
      if (propertyMatch) {
        const targetVar = propertyMatch[2];
        const propertyName = propertyMatch[3];
        
        steps.push({
          type: 'property-access',
          location: {
            file: this.sourceFile.fileName,
            line: lineIndex + 1,
            column: line.indexOf(propertyMatch[0]) + 1
          },
          variableName: targetVar,
          description: `${currentVariableName} のプロパティ ${propertyName} を ${targetVar} に代入`
        });
        currentVariableName = targetVar; // 新しい変数名を追跡
      }
      // 通常の変数代入を検出 (例: const data = req.body) - プロパティアクセスでない場合のみ
      else {
        // 単純な代入
        const assignmentMatch = line.match(new RegExp(`(const|let|var)\\s+(\\w+)\\s*=\\s*${currentVariableName}(?!\\.)(?:\\s|;|$)`));
        if (assignmentMatch) {
          const newVar = assignmentMatch[2];
          steps.push({
            type: 'assignment',
            location: {
              file: this.sourceFile.fileName,
              line: lineIndex + 1,
              column: line.indexOf(assignmentMatch[0]) + 1
            },
            variableName: newVar,
            description: `${currentVariableName} から ${newVar} に代入`
          });
          currentVariableName = newVar; // 追跡する変数名を更新
        }
        // 文字列結合や式を含む代入を検出
        else {
          const complexAssignmentMatch = line.match(new RegExp(`(const|let|var)\\s+(\\w+)\\s*=\\s*[^;]*${currentVariableName}[^;]*;?`));
          if (complexAssignmentMatch) {
            const newVar = complexAssignmentMatch[2];
            steps.push({
              type: 'assignment',
              location: {
                file: this.sourceFile.fileName,
                line: lineIndex + 1,
                column: line.indexOf(complexAssignmentMatch[0]) + 1
              },
              variableName: newVar,
              description: `${currentVariableName} から ${newVar} に代入（文字列結合を含む）`
            });
            currentVariableName = newVar; // 追跡する変数名を更新
          }
        }
      }

      // 関数パラメーターを検出
      const parameterMatch = line.match(new RegExp(`(\\w+)\\s*\\([^)]*${currentVariableName}`));
      if (parameterMatch) {
        steps.push({
          type: 'parameter-passing',
          location: {
            file: this.sourceFile.fileName,
            line: lineIndex + 1,
            column: line.indexOf(parameterMatch[0]) + 1
          },
          variableName: currentVariableName,
          description: `${currentVariableName} が ${parameterMatch[1]} のパラメーターとして渡される`
        });
      }

      // 直接的なプロパティアクセスも検出（変数宣言なし）
      // data.filename のような形式でSinkに直接使用される場合
      const directPropertyMatch = line.match(new RegExp(`${currentVariableName}\\.(\\w+)`));
      if (directPropertyMatch && !propertyMatch) {
        steps.push({
          type: 'property-access',
          location: {
            file: this.sourceFile.fileName,
            line: lineIndex + 1,
            column: line.indexOf(directPropertyMatch[0]) + 1
          },
          variableName: `${currentVariableName}.${directPropertyMatch[1]}`,
          description: `${currentVariableName} のプロパティ ${directPropertyMatch[1]} にアクセス`
        });
      }
    }

    return steps;
  }

  /**
   * リスクレベルを計算
   */
  private calculateRiskLevel(
    source: TaintSource,
    sink: TaintSink
  ): DataFlowPath['riskLevel'] {
    // SourceとSinkのリスクレベルを組み合わせて判断
    const sourceRiskScore = this.getRiskScore(source.type);
    const sinkRiskScore = this.getSinkRiskScore(sink.type);
    
    const totalScore = sourceRiskScore + sinkRiskScore;

    if (totalScore >= 8) return 'CRITICAL';
    if (totalScore >= 6) return 'HIGH';
    if (totalScore >= 4) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * SourceのリスクスコアOA
   */
  private getRiskScore(sourceType: string): number {
    const scores: Record<string, number> = {
      'user-input': 4,
      'network-input': 3,
      'file-input': 2,
      'environment': 2,
      'database': 1
    };
    return scores[sourceType] || 1;
  }

  /**
   * Sinkのリスクスコア
   */
  private getSinkRiskScore(sinkType: string): number {
    const scores: Record<string, number> = {
      'sql-injection': 4,
      'command-injection': 4,
      'code-injection': 4,
      'path-traversal': 3,
      'xss': 3,
      'file-write': 2
    };
    return scores[sinkType] || 1;
  }

  /**
   * 信頼度を計算
   */
  private calculateConfidence(
    source: TaintSource,
    sink: TaintSink,
    path: DataFlowStep[]
  ): number {
    // 基本信頼度はSourceとSinkの信頼度の平均
    let baseConfidence = (source.confidence + sink.confidence) / 2;
    
    // パス長による信頼度の調整
    const pathLengthPenalty = Math.min(path.length * 0.05, 0.3); // 最大30%減
    baseConfidence -= pathLengthPenalty;

    return Math.max(baseConfidence, 0.1); // 最小10%
  }

  /**
   * サマリーを計算
   */
  private calculateSummary(paths: DataFlowPath[]): DataFlowAnalysisResult['summary'] {
    const summary = {
      totalPaths: paths.length,
      criticalPaths: 0,
      highRiskPaths: 0,
      mediumRiskPaths: 0,
      lowRiskPaths: 0
    };

    for (const path of paths) {
      switch (path.riskLevel) {
        case 'CRITICAL':
          summary.criticalPaths++;
          break;
        case 'HIGH':
          summary.highRiskPaths++;
          break;
        case 'MEDIUM':
          summary.mediumRiskPaths++;
          break;
        case 'LOW':
          summary.lowRiskPaths++;
          break;
      }
    }

    return summary;
  }
}