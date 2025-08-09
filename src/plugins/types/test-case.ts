/**
 * テストケース関連の型定義
 */

/**
 * テストケースのタイプ
 */
export type TestCaseType = 'test' | 'describe' | 'it' | 'suite' | 'spec';

/**
 * テストケース
 */
export interface TestCase {
  /** テストケース名 */
  name: string;
  /** テストケースのタイプ */
  type: TestCaseType;
  /** ファイル内の行番号 */
  line?: number;
  /** ファイル内の列番号 */
  column?: number;
  /** ネストレベル */
  level?: number;
  /** 親のテストケース名 */
  parent?: string;
  /** スキップされているか */
  skipped?: boolean;
  /** フォーカスされているか（.only） */
  focused?: boolean;
}

/**
 * テストファイルの統計情報
 */
export interface TestFileStats {
  /** 総テストケース数 */
  totalTests: number;
  /** describeブロック数 */
  describeBlocks: number;
  /** スキップされたテスト数 */
  skippedTests: number;
  /** フォーカスされたテスト数 */
  focusedTests: number;
  /** 最大ネストレベル */
  maxNestingLevel: number;
}