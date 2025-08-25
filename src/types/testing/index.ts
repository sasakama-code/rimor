/**
 * 統一されたテスト関連型定義
 * 
 * SOLID原則に従い、テストケース、テストスイート、
 * テスト品質メトリクスを統合した設計
 */

/**
 * テストのステータス
 * KISS原則: シンプルで理解しやすい状態定義
 */
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

/**
 * テストの種類
 */
export type TestType = 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'smoke';

/**
 * アサーションの種類
 */
export type AssertionType = 
  | 'toBe'
  | 'toEqual'
  | 'toContain'
  | 'toMatch'
  | 'toThrow'
  | 'toBeTruthy'
  | 'toBeFalsy'
  | 'toBeNull'
  | 'toBeDefined'
  | 'toBeUndefined';

/**
 * テストケースの基本構造
 * SRP（単一責任原則）: テストケースの核心情報のみ
 * 
 * @example
 * ```typescript
 * const testCase: BaseTestCase = {
 *   id: 'test-001',
 *   name: 'should calculate sum correctly',
 *   description: 'Validates the sum calculation logic',
 *   status: 'passed'
 * };
 * ```
 */
export interface BaseTestCase {
  /** テストケースの一意識別子 */
  id: string;
  /** テストケース名 */
  name: string;
  /** テストの説明（オプション） */
  description?: string;
  /** テストのステータス */
  status: TestStatus;
}

/**
 * 入出力情報を持つテストケース
 */
export interface TestCaseWithIO {
  /** テストの入力データ */
  input?: unknown;
  /** 期待される出力 */
  expectedOutput?: unknown;
  /** 実際の出力 */
  actualOutput?: unknown;
  /** エラー情報（失敗時） */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * メタデータを持つテストケース
 */
export interface TestCaseWithMetadata {
  /** テスト実行のメタデータ */
  metadata?: {
    /** 実行時間（ミリ秒） */
    executionTime?: number;
    /** 開始時刻 */
    startTime?: string;
    /** 終了時刻 */
    endTime?: string;
    /** リトライ回数 */
    retryCount?: number;
    /** タグ */
    tags?: string[];
    /** 優先度 */
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

/**
 * アサーション情報
 */
export interface Assertion {
  /** アサーションの種類 */
  type: AssertionType;
  /** 期待値 */
  expected: unknown;
  /** 実際の値 */
  actual: unknown;
  /** アサーションの成否 */
  passed: boolean;
  /** エラーメッセージ（失敗時） */
  message?: string;
  /** ソースコードの位置 */
  location?: {
    file: string;
    line: number;
    column?: number;
  };
}

/**
 * アサーション情報を持つテストケース
 */
export interface TestCaseWithAssertions {
  /** アサーションのリスト */
  assertions?: Assertion[];
  /** アサーション数のサマリー */
  assertionSummary?: {
    total: number;
    passed: number;
    failed: number;
  };
}

/**
 * プラグイン拡張を持つテストケース
 */
export interface PluginTestCase extends BaseTestCase {
  /** プラグイン名 */
  pluginName: string;
  /** プラグイン固有の設定 */
  pluginConfig?: {
    /** タイムアウト（ミリ秒） */
    timeout?: number;
    /** リトライ回数 */
    retries?: number;
    /** タグ */
    tags?: string[];
    /** 優先度 */
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    /** その他のプラグイン固有設定 */
    [key: string]: unknown;
  };
}

/**
 * 品質メトリクスを持つテストケース
 */
export interface TestCaseWithQuality {
  /** 品質メトリクス */
  qualityMetrics?: {
    /** アサーション密度（アサーション数/コード行数） */
    assertionDensity?: number;
    /** テストカバレッジ（パーセント） */
    testCoverage?: number;
    /** 保守性スコア（0-100） */
    testMaintainability?: number;
    /** 信頼性スコア（0-100） */
    testReliability?: number;
    /** 複雑度 */
    complexity?: number;
  };
}

/**
 * テストスイート
 * ISP（インターフェース分離原則）: 必要な機能のみを含む
 */
export interface TestSuite {
  /** スイートID */
  id: string;
  /** スイート名 */
  name: string;
  /** 説明 */
  description?: string;
  /** テストケースのリスト */
  testCases: TestCase[];
  /** サマリー情報 */
  summary?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
    executionTime?: number;
  };
}

/**
 * テストファイル情報
 */
export interface TestFile {
  /** ファイルパス */
  path: string;
  /** テストの種類 */
  type: TestType;
  /** テストフレームワーク */
  framework?: string;
  /** テストケースのリスト */
  testCases: TestCase[];
  /** カバレッジ情報 */
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  /** ファイルメタデータ */
  metadata?: {
    lastModified?: string;
    size?: number;
    hash?: string;
  };
}

/**
 * 統一されたテストケース型
 * DRY原則: 既存のインターフェースを組み合わせて定義
 */
export interface TestCase extends
  BaseTestCase,
  TestCaseWithIO,
  TestCaseWithMetadata,
  TestCaseWithAssertions,
  TestCaseWithQuality {
  /** 所属するスイートID（オプション） */
  suiteId?: string;
  /** 所属するファイルパス（オプション） */
  filePath?: string;
  /** プラグイン固有の情報（オプション） */
  pluginData?: Record<string, any>;
}

/**
 * 型ガード: TestCaseかどうかを判定
 * Defensive Programming: 実行時の型安全性を確保
 */
export function isTestCase(obj: unknown): obj is TestCase {
  return !!(obj !== null &&
    typeof obj === 'object' &&
    'id' in obj &&
    'name' in obj &&
    'status' in obj &&
    typeof (obj as any).id === 'string' &&
    typeof (obj as any).name === 'string' &&
    typeof (obj as any).status === 'string' &&
    ['pending', 'running', 'passed', 'failed', 'skipped'].includes((obj as any).status));
}

/**
 * 型ガード: テストメタデータを持つかどうかを判定
 */
export function hasTestMetadata(obj: unknown): obj is TestCaseWithMetadata {
  return obj !== null &&
    typeof obj === 'object' &&
    'metadata' in obj &&
    (obj as any).metadata !== null &&
    typeof (obj as any).metadata === 'object' &&
    ((obj as any).metadata.executionTime === undefined || typeof (obj as any).metadata.executionTime === 'number');
}

/**
 * 型ガード: アサーション情報を持つかどうかを判定
 */
export function hasAssertions(obj: unknown): obj is TestCaseWithAssertions {
  return !!(obj !== null &&
    typeof obj === 'object' &&
    'assertions' in obj &&
    Array.isArray((obj as any).assertions) &&
    (obj as any).assertions.every((a: any) => 
      a.type && a.expected !== undefined && a.actual !== undefined && typeof a.passed === 'boolean'
    ));
}

/**
 * ファクトリ関数: 基本的なTestCaseを作成
 * YAGNI原則: 現時点で必要な最小限の実装
 */
export function createTestCase(
  id: string,
  name: string,
  status: TestStatus = 'pending'
): TestCase {
  return {
    id,
    name,
    status
  };
}

/**
 * ヘルパー関数: テストスイートのサマリーを計算
 */
export function calculateTestSuiteSummary(testCases: TestCase[]): TestSuite['summary'] {
  const summary = {
    total: testCases.length,
    passed: testCases.filter(tc => tc.status === 'passed').length,
    failed: testCases.filter(tc => tc.status === 'failed').length,
    skipped: testCases.filter(tc => tc.status === 'skipped').length,
    pending: testCases.filter(tc => tc.status === 'pending').length,
    executionTime: 0
  };

  // 実行時間の合計を計算
  const totalTime = testCases
    .filter(tc => tc.metadata?.executionTime)
    .reduce((sum, tc) => sum + (tc.metadata?.executionTime || 0), 0);
  
  if (totalTime > 0) {
    summary.executionTime = totalTime;
  }

  return summary;
}

/**
 * ヘルパー関数: テストケースの品質スコアを計算
 */
export function calculateTestQualityScore(testCase: TestCase): number {
  let score = 0;
  let factors = 0;

  // アサーションの有無
  if (testCase.assertions && testCase.assertions.length > 0) {
    const passRate = testCase.assertions.filter(a => a.passed).length / testCase.assertions.length;
    score += passRate * 25;
    factors++;
  }

  // 説明の有無
  if (testCase.description) {
    score += 25;
    factors++;
  }

  // 入出力の定義
  if (testCase.expectedOutput !== undefined) {
    score += 25;
    factors++;
  }

  // メタデータの充実度
  if (testCase.metadata && testCase.metadata.tags && testCase.metadata.tags.length > 0) {
    score += 25;
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * 後方互換性のための型エイリアス
 * @deprecated これらのエイリアスは将来のバージョンで削除予定
 */
export type PluginTest = PluginTestCase;
export type SecurityTestCase = TestCase;
export type ValidationTestCase = TestCase;
export type UnitTestCase = TestCase;
export type IntegrationTestCase = TestCase;