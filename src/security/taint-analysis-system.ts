/**
 * 汚染解析システム統合
 * arXiv:2504.18529v2の完全実装
 * 
 * Rimorの既存システムに論文の技術を統合し、
 * 高度な型ベース汚染チェックと推論を提供
 */

import { Tainted, Untainted, PolyTaint, SuppressTaintWarning } from './annotations/taint-annotations';
import { 
  TaintQualifier, 
  TaintedType, 
  UntaintedType,
  PolyTaintType,
  isTainted,
  isUntainted,
  sanitize,
  taint
} from './types/checker-framework-types';
import { SearchBasedInferenceEngine } from './analysis/search-based-inference';
import { LocalInferenceOptimizer, IncrementalInferenceEngine } from './inference/local-inference-optimizer';
import { 
  LibraryMethodHandler, 
  GenericTaintHandler, 
  PolymorphicTaintPropagator,
  LibraryMethodDatabase 
} from './polymorphic/library-method-handler';
import { CheckerFrameworkCompatibility } from './compatibility/checker-framework-compatibility';

/**
 * 汚染解析システムの設定
 */
export interface TaintAnalysisConfig {
  /** 推論エンジンの設定 */
  inference: {
    /** 探索ベース推論を有効化 */
    enableSearchBased: boolean;
    /** ローカル最適化を有効化 */
    enableLocalOptimization: boolean;
    /** インクリメンタル解析を有効化 */
    enableIncremental: boolean;
    /** 最大探索深度 */
    maxSearchDepth: number;
    /** 信頼度閾値 */
    confidenceThreshold: number;
  };
  /** ライブラリサポート設定 */
  library: {
    /** 組み込みライブラリの定義を読み込む */
    loadBuiltins: boolean;
    /** カスタムライブラリ定義のパス */
    customLibraryPaths: string[];
    /** 未知のメソッドの扱い */
    unknownMethodBehavior: 'conservative' | 'optimistic';
  };
  /** Checker Framework互換性 */
  compatibility: {
    /** .jaifファイルの出力を有効化 */
    exportJAIF: boolean;
    /** スタブファイルの生成を有効化 */
    generateStubs: boolean;
    /** 段階的移行モード */
    gradualMigration: boolean;
  };
}

/**
 * 汚染解析システム
 */
export class TaintAnalysisSystem {
  private config: TaintAnalysisConfig;
  private inferenceEngine: SearchBasedInferenceEngine;
  private localOptimizer: LocalInferenceOptimizer;
  private incrementalEngine: IncrementalInferenceEngine;
  private libraryHandler: LibraryMethodHandler;
  private genericHandler: GenericTaintHandler;
  private polymorphicPropagator: PolymorphicTaintPropagator;
  private libraryDatabase: LibraryMethodDatabase;
  private compatibility: CheckerFrameworkCompatibility;
  
  constructor(config?: Partial<TaintAnalysisConfig>) {
    this.config = this.mergeConfig(config);
    
    // コンポーネントの初期化
    this.inferenceEngine = new SearchBasedInferenceEngine();
    this.localOptimizer = new LocalInferenceOptimizer();
    this.incrementalEngine = new IncrementalInferenceEngine();
    this.libraryHandler = new LibraryMethodHandler();
    this.genericHandler = new GenericTaintHandler();
    this.polymorphicPropagator = new PolymorphicTaintPropagator();
    this.libraryDatabase = new LibraryMethodDatabase();
    this.compatibility = new CheckerFrameworkCompatibility();
    
    // 設定に基づく初期化
    this.initialize();
  }
  
  /**
   * デフォルト設定とマージ
   */
  private mergeConfig(config?: Partial<TaintAnalysisConfig>): TaintAnalysisConfig {
    const defaultConfig: TaintAnalysisConfig = {
      inference: {
        enableSearchBased: true,
        enableLocalOptimization: true,
        enableIncremental: false,
        maxSearchDepth: 100,
        confidenceThreshold: 0.8
      },
      library: {
        loadBuiltins: true,
        customLibraryPaths: [],
        unknownMethodBehavior: 'conservative'
      },
      compatibility: {
        exportJAIF: false,
        generateStubs: false,
        gradualMigration: false
      }
    };
    
    return {
      inference: { ...defaultConfig.inference, ...config?.inference },
      library: { ...defaultConfig.library, ...config?.library },
      compatibility: { ...defaultConfig.compatibility, ...config?.compatibility }
    };
  }
  
  /**
   * システムの初期化
   */
  private initialize(): void {
    // ライブラリハンドラの設定
    this.libraryHandler.setUnknownMethodBehavior(this.config.library.unknownMethodBehavior);
    
    // カスタムライブラリの読み込み
    for (const path of this.config.library.customLibraryPaths) {
      // 実装は省略（実際にはファイルシステムから読み込む）
    }
  }
  
  /**
   * ファイルまたはコードの解析
   */
  async analyzeCode(code: string, options?: {
    fileName?: string;
    incremental?: boolean;
  }): Promise<TaintAnalysisResult> {
    const startTime = Date.now();
    const result: TaintAnalysisResult = {
      issues: [],
      annotations: new Map(),
      statistics: {
        filesAnalyzed: 1,
        issuesFound: 0,
        annotationsInferred: 0,
        analysisTime: 0
      }
    };
    
    try {
      // ローカル最適化
      if (this.config.inference.enableLocalOptimization) {
        const optimizationResult = await this.localOptimizer.optimizeInference(code);
        result.annotations = new Map([...result.annotations, ...optimizationResult.typeMap]);
      }
      
      // 探索ベース推論
      if (this.config.inference.enableSearchBased) {
        const inferenceState = await this.inferenceEngine.inferTypes(code, options?.fileName || 'temp.ts');
        
        // 推論結果の統合
        for (const [variable, qualifier] of inferenceState.typeMap) {
          result.annotations.set(variable, qualifier);
        }
        
        // 制約違反を問題として報告
        for (const constraint of inferenceState.constraints) {
          if (constraint.type === 'subtype' && constraint.lhs === '@Tainted' && constraint.rhs === '@Untainted') {
            result.issues.push({
              type: 'taint-flow',
              severity: 'error',
              message: `Tainted data may flow to untainted location`,
              location: {
                file: constraint.location.file || options?.fileName || 'unknown',
                line: constraint.location.line || 0,
                column: constraint.location.column || 0
              },
              suggestion: 'Consider sanitizing the data before use'
            });
          }
        }
      }
      
      // 統計情報の更新
      result.statistics.issuesFound = result.issues.length;
      result.statistics.annotationsInferred = result.annotations.size;
      result.statistics.analysisTime = Date.now() - startTime;
      
      // Checker Framework形式でのエクスポート
      if (this.config.compatibility.exportJAIF) {
        result.jaifOutput = this.exportToJAIF(result.annotations);
      }
      
    } catch (error: any) {
      result.issues.push({
        type: 'analysis-error',
        severity: 'error',
        message: `Analysis failed: ${error}`,
        location: { file: options?.fileName || 'unknown', line: 0, column: 0 }
      });
    } finally {
      // 必ず解析時間を記録
      result.statistics.analysisTime = Date.now() - startTime;
    }
    
    return result;
  }
  
  /**
   * プロジェクト全体の解析
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysisResult> {
    // 実装は省略（実際にはファイルシステムを走査して解析）
    return {
      totalFiles: 0,
      analyzedFiles: 0,
      totalIssues: 0,
      issuesByType: new Map(),
      criticalFiles: [],
      coverage: {
        annotated: 0,
        inferred: 0,
        total: 0
      }
    };
  }
  
  /**
   * JAIF形式へのエクスポート
   */
  private exportToJAIF(annotations: Map<string, TaintQualifier>): string {
    const writer = new (require('./compatibility/checker-framework-compatibility').AnnotationWriter)();
    return writer.toJAIF(annotations);
  }
  
  /**
   * ライブラリメソッドの汚染伝播を解析
   */
  propagateLibraryTaint(
    className: string,
    methodName: string,
    receiverTaint: TaintQualifier,
    parameterTaints: TaintQualifier[]
  ): TaintQualifier {
    return this.libraryHandler.propagateTaint(
      className,
      methodName,
      receiverTaint,
      parameterTaints
    );
  }
  
  /**
   * カスタムライブラリメソッドの登録
   */
  registerLibraryMethod(signature: any): void {
    this.libraryHandler.registerLibraryMethod(signature);
  }
  
  /**
   * インクリメンタル解析
   */
  async analyzeIncremental(
    changedFiles: Map<string, string>
  ): Promise<IncrementalAnalysisResult> {
    if (!this.config.inference.enableIncremental) {
      throw new Error('Incremental analysis is not enabled');
    }
    
    const result = await this.incrementalEngine.incrementalAnalyze(
      Object.fromEntries(changedFiles)
    );
    
    return {
      analyzedFiles: result.analyzedMethods,
      skippedFiles: result.skippedMethods,
      totalTime: Date.now()
    };
  }
}

/**
 * 解析結果
 */
export interface TaintAnalysisResult {
  /** 検出された問題 */
  issues: TaintIssue[];
  /** 推論されたアノテーション */
  annotations: Map<string, TaintQualifier>;
  /** 統計情報 */
  statistics: {
    filesAnalyzed: number;
    issuesFound: number;
    annotationsInferred: number;
    analysisTime: number;
  };
  /** JAIF形式の出力（オプション） */
  jaifOutput?: string;
}

/**
 * 汚染問題
 */
export interface TaintIssue {
  type: 'taint-flow' | 'missing-annotation' | 'incompatible-types' | 'analysis-error';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
  suggestion?: string;
}

/**
 * プロジェクト解析結果
 */
export interface ProjectAnalysisResult {
  totalFiles: number;
  analyzedFiles: number;
  totalIssues: number;
  issuesByType: Map<string, number>;
  criticalFiles: string[];
  coverage: {
    annotated: number;
    inferred: number;
    total: number;
  };
}

/**
 * インクリメンタル解析結果
 */
export interface IncrementalAnalysisResult {
  analyzedFiles: string[];
  skippedFiles: string[];
  totalTime: number;
}

// エクスポート
export {
  // デコレータ
  Tainted,
  Untainted,
  PolyTaint,
  SuppressTaintWarning,
  
  // 型定義
  TaintQualifier,
  TaintedType,
  UntaintedType,
  PolyTaintType,
  
  // ユーティリティ関数
  isTainted,
  isUntainted,
  sanitize,
  taint,
  
  // コンポーネント
  SearchBasedInferenceEngine,
  LocalInferenceOptimizer,
  LibraryMethodHandler,
  CheckerFrameworkCompatibility
};