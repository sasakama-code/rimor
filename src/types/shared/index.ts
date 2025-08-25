/**
 * 共通型定義
 * 
 * 複数のモジュールで使用される汎用的な型を集約
 * DRY原則に基づいた設計
 */

/**
 * デザインパターンの種類
 */
export type DesignPatternType = 
  // 生成パターン
  | 'SINGLETON'
  | 'FACTORY'
  | 'ABSTRACT_FACTORY'
  | 'BUILDER'
  | 'PROTOTYPE'
  // 構造パターン
  | 'ADAPTER'
  | 'BRIDGE'
  | 'COMPOSITE'
  | 'DECORATOR'
  | 'FACADE'
  | 'FLYWEIGHT'
  | 'PROXY'
  // 振る舞いパターン
  | 'CHAIN_OF_RESPONSIBILITY'
  | 'COMMAND'
  | 'INTERPRETER'
  | 'ITERATOR'
  | 'MEDIATOR'
  | 'MEMENTO'
  | 'OBSERVER'
  | 'STATE'
  | 'STRATEGY'
  | 'TEMPLATE_METHOD'
  | 'VISITOR';

/**
 * アンチパターンの種類
 */
export type AntiPatternType = 
  | 'GOD_OBJECT'           // 神オブジェクト
  | 'SPAGHETTI_CODE'       // スパゲッティコード
  | 'COPY_PASTE'           // コピペプログラミング
  | 'MAGIC_NUMBERS'        // マジックナンバー
  | 'DEAD_CODE'            // デッドコード
  | 'LONG_METHOD'          // 長すぎるメソッド
  | 'LARGE_CLASS'          // 巨大クラス
  | 'FEATURE_ENVY'         // 不適切な親密さ
  | 'DATA_CLUMPS'          // データの塊
  | 'PRIMITIVE_OBSESSION'  // 基本データ型への執着
  | 'SWITCH_STATEMENTS'    // Switch文の乱用
  | 'PARALLEL_INHERITANCE' // 並行継承階層
  | 'LAZY_CLASS'           // 怠惰なクラス
  | 'SPECULATIVE_GENERALITY' // 憶測による一般化
  | 'TEMPORARY_FIELD'      // 一時的フィールド
  | 'MESSAGE_CHAINS'       // メッセージの連鎖
  | 'MIDDLE_MAN';          // 仲介者

/**
 * デザインパターン
 */
export interface DesignPattern {
  /** パターンタイプ */
  type: DesignPatternType;
  /** 名前 */
  name: string;
  /** 説明 */
  description: string;
  /** 検出場所 */
  location: {
    file: string;
    line?: number;
    className?: string;
    methodName?: string;
  };
  /** 信頼度（0-100） */
  confidence: number;
  /** 実装の品質 */
  quality?: 'GOOD' | 'ACCEPTABLE' | 'POOR';
  /** 改善提案 */
  suggestions?: string[];
}

/**
 * アンチパターン
 */
export interface AntiPattern {
  /** パターンタイプ */
  type: AntiPatternType;
  /** 名前 */
  name: string;
  /** 説明 */
  description: string;
  /** 検出場所 */
  location: {
    file: string;
    startLine: number;
    endLine: number;
    className?: string;
    methodName?: string;
  };
  /** 深刻度 */
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  /** 影響範囲 */
  impact: string;
  /** リファクタリング提案 */
  refactoringSuggestions: string[];
  /** 推定修正時間（分） */
  estimatedFixTime?: number;
}

/**
 * パターン分析結果
 */
export interface PatternAnalysis {
  /** 検出されたデザインパターン */
  designPatterns: DesignPattern[];
  /** 検出されたアンチパターン */
  antiPatterns: AntiPattern[];
  /** 推奨事項 */
  recommendations: PatternRecommendation[];
  /** サマリー */
  summary: {
    totalDesignPatterns: number;
    totalAntiPatterns: number;
    codeQualityScore: number;
    maintainabilityIndex: number;
  };
}

/**
 * パターン推奨事項
 */
export interface PatternRecommendation {
  /** タイトル */
  title: string;
  /** 説明 */
  description: string;
  /** 優先度 */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** 適用可能なパターン */
  applicablePattern?: DesignPatternType;
  /** 対象ファイル */
  targetFiles: string[];
  /** 実装例 */
  example?: string;
}

/**
 * パッケージ依存関係
 */
export interface PackageDependency {
  /** パッケージ名 */
  name: string;
  /** バージョン */
  version: string;
  /** 依存タイプ */
  type: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies';
  /** 解決済みバージョン */
  resolvedVersion?: string;
  /** 脆弱性 */
  vulnerabilities?: Array<{
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cve?: string;
    description: string;
  }>;
}

/**
 * インポート情報
 */
export interface ImportInfo {
  /** インポート元 */
  source: string;
  /** インポートされた名前 */
  imported: string[];
  /** エイリアス */
  alias?: string;
  /** インポートタイプ */
  type: 'default' | 'named' | 'namespace' | 'side-effect';
  /** 場所 */
  location: {
    file: string;
    line: number;
  };
}

/**
 * 使用状況カテゴリ
 */
export interface UsageCategory {
  /** カテゴリ名 */
  name: string;
  /** 使用回数 */
  count: number;
  /** ファイル */
  files: string[];
  /** 詳細 */
  details?: Record<string, any>;
}

/**
 * 使用状況レポート
 */
export interface UsageReport {
  /** 対象 */
  target: string;
  /** 総使用回数 */
  totalUsage: number;
  /** カテゴリ別使用状況 */
  categories: UsageCategory[];
  /** 依存関係 */
  dependencies: string[];
  /** 推奨事項 */
  recommendations?: string[];
}

/**
 * バージョン制約
 */
export interface VersionConstraint {
  /** 制約タイプ */
  type: 'exact' | 'range' | 'tilde' | 'caret' | 'greater' | 'less';
  /** 値 */
  value: string;
  /** 満たすバージョン */
  satisfies?: string[];
  /** 満たさないバージョン */
  conflicts?: string[];
}

/**
 * 実行環境情報
 */
export interface ExecutionEnvironment {
  /** Node.jsバージョン */
  nodeVersion: string;
  /** npmバージョン */
  npmVersion?: string;
  /** yarnバージョン */
  yarnVersion?: string;
  /** OS */
  os: string;
  /** アーキテクチャ */
  arch: string;
  /** CPU数 */
  cpuCount: number;
  /** メモリ（GB） */
  totalMemory: number;
  /** 利用可能メモリ（GB） */
  freeMemory: number;
}

/**
 * プロジェクトメトリクス
 */
export interface ProjectMetrics {
  /** 総ファイル数 */
  totalFiles: number;
  /** 総行数 */
  totalLines: number;
  /** コード行数 */
  linesOfCode: number;
  /** コメント行数 */
  commentLines: number;
  /** 空行数 */
  blankLines: number;
  /** 言語別統計 */
  languages: Record<string, {
    files: number;
    lines: number;
    percentage: number;
  }>;
  /** 複雑度 */
  complexity?: {
    cyclomatic: number;
    cognitive: number;
    halstead: Record<string, number>;
  };
}

/**
 * 型ガード: DesignPatternかどうかを判定
 */
export function isDesignPattern(obj: unknown): obj is DesignPattern {
  return obj !== null &&
    typeof obj === 'object' &&
    'type' in obj &&
    'name' in obj &&
    'location' in obj &&
    'confidence' in obj &&
    (obj as any).type !== undefined &&
    typeof (obj as any).name === 'string' &&
    (obj as any).location !== undefined &&
    typeof (obj as any).confidence === 'number';
}

/**
 * 型ガード: AntiPatternかどうかを判定
 */
export function isAntiPattern(obj: unknown): obj is AntiPattern {
  return obj !== null &&
    typeof obj === 'object' &&
    'type' in obj &&
    'name' in obj &&
    'location' in obj &&
    'severity' in obj &&
    'refactoringSuggestions' in obj &&
    (obj as any).type !== undefined &&
    typeof (obj as any).name === 'string' &&
    (obj as any).location !== undefined &&
    (obj as any).severity !== undefined &&
    Array.isArray((obj as any).refactoringSuggestions);
}

/**
 * ヘルパー関数: コード品質スコアの計算
 */
export function calculateCodeQualityScore(
  designPatterns: number,
  antiPatterns: number,
  totalFiles: number
): number {
  if (totalFiles === 0) return 0;
  
  const patternScore = (designPatterns / totalFiles) * 50;
  const antiPatternPenalty = (antiPatterns / totalFiles) * 30;
  
  const score = Math.max(0, Math.min(100, 50 + patternScore - antiPatternPenalty));
  return Math.round(score);
}

/**
 * ヘルパー関数: 保守性インデックスの計算
 * Halsteadボリューム、サイクロマティック複雑度、コード行数から計算
 */
export function calculateMaintainabilityIndex(
  halsteadVolume: number,
  cyclomaticComplexity: number,
  linesOfCode: number
): number {
  const mi = 171 - 
    5.2 * Math.log(halsteadVolume) -
    0.23 * cyclomaticComplexity -
    16.2 * Math.log(linesOfCode);
  
  return Math.max(0, Math.min(100, mi));
}

/**
 * 後方互換性のための型エイリアス
 * @deprecated
 */
export type Pattern = DesignPattern | AntiPattern;
export type Dependency = PackageDependency;
export type Import = ImportInfo;