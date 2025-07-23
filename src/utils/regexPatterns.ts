/**
 * 共通正規表現パターンライブラリ
 * 全プラグインで使用される正規表現パターンを一元管理し、
 * パフォーマンス最適化と保守性向上を実現
 */

export class TestPatterns {
  // ===== 基本テスト構造パターン =====
  
  /** テストケース定義パターン */
  static readonly TEST_CASE = /it\s*\(/g;
  
  /** テストスイート定義パターン */
  static readonly DESCRIBE_SUITE = /describe\s*\(/g;
  
  /** test() 関数パターン */
  static readonly TEST_FUNCTION = /test\s*\(/g;
  
  /** expect文パターン */
  static readonly EXPECT_STATEMENT = /expect\s*\(/g;
  
  // ===== セットアップ・ティアダウンパターン =====
  
  /** beforeEach フック */
  static readonly BEFORE_EACH = /beforeEach\s*\(/g;
  
  /** afterEach フック */
  static readonly AFTER_EACH = /afterEach\s*\(/g;
  
  /** beforeAll フック */
  static readonly BEFORE_ALL = /beforeAll\s*\(/g;
  
  /** afterAll フック */
  static readonly AFTER_ALL = /afterAll\s*\(/g;
  
  // ===== Jestアサーション品質パターン =====
  
  /** 弱いアサーションパターン（あまり具体的でない） */
  static readonly WEAK_ASSERTIONS = [
    /\.toBeTruthy\(\)/g,
    /\.toBeFalsy\(\)/g,
    /\.toBeDefined\(\)/g,
    /\.toBeUndefined\(\)/g,
    /\.not\.toBeUndefined\(\)/g,
    /\.not\.toBeNull\(\)/g
  ];
  
  /** 強いアサーションパターン（具体的で意味がある） */
  static readonly STRONG_ASSERTIONS = [
    /\.toBe\([^)]+\)/g,
    /\.toEqual\([^)]+\)/g,
    /\.toMatch\(\/[^/]+\/[gimuy]*\)/g,
    /\.toMatchObject\({[^}]+}\)/g,
    /\.toContain\([^)]+\)/g,
    /\.toHaveLength\(\d+\)/g,
    /\.toThrow\([^)]*\)/g,
    /\.toHaveBeenCalledWith\([^)]*\)/g,
    /\.toHaveBeenCalledTimes\(\d+\)/g
  ];
  
  /** マジックナンバーを含むアサーション */
  static readonly MAGIC_NUMBER_ASSERTIONS = /\.toBe\(\d+\)|\.toEqual\(\d+\)|\.toBeGreaterThan\(\d+\)|\.toBeLessThan\(\d+\)/g;
  
  /** 全般的なアサーションパターン */
  static readonly ALL_ASSERTIONS = [
    /expect\s*\(/g,
    /assert\s*\(/g,
    /\.should\./g,
    /chai\.expect\s*\(/g,
    /assert\.equal/g,
    /assert\.strictEqual/g,
    /assert\.deepEqual/g,
    /toEqual\s*\(/g,
    /toBe\s*\(/g,
    /toContain\s*\(/g,
    /toHaveBeenCalled/g,
    /toThrow/g,
    /toBeNull/g,
    /toBeTruthy/g,
    /toBeFalsy/g
  ];
  
  // ===== CRUD操作パターン =====
  
  /** CRUD操作テストパターン */
  static readonly CRUD_OPERATIONS = [
    /it\s*\([^)]*should.*create/gi,
    /it\s*\([^)]*should.*update/gi,
    /it\s*\([^)]*should.*delete/gi,
    /it\s*\([^)]*should.*read/gi,
    /it\s*\([^)]*should.*get/gi,
    /it\s*\([^)]*should.*find/gi
  ];
  
  /** サービス操作パターン */
  static readonly SERVICE_OPERATIONS = [
    /userService\.create/g,
    /userService\.findAll/g,
    /userService\.delete/g,
    /userService\.update/g,
    /\.save\(/g,
    /\.find\(/g,
    /\.delete\(/g,
    /\.update\(/g
  ];
  
  // ===== エラー・エッジケース検出パターン =====
  
  /** エラーハンドリングテストパターン */
  static readonly ERROR_HANDLING = [
    /it\s*\([^)]*should.*handle.*error/gi,
    /it\s*\([^)]*should.*throw/gi,
    /it\s*\([^)]*should.*fail/gi
  ];
  
  /** エッジケースパターン */
  static readonly EDGE_CASES = [
    /null/gi,
    /undefined/gi,
    /empty/gi,
    /invalid/gi,
    /error/gi,
    /throw/gi,
    /boundary/gi,
    /limit/gi
  ];
  
  // ===== AAA（Arrange-Act-Assert）パターン =====
  
  /** AAAコメントパターン */
  static readonly AAA_COMMENTS = [
    /\/\/\s*arrange/gi,
    /\/\/\s*act/gi,
    /\/\/\s*assert/gi,
    /\/\/\s*given/gi,
    /\/\/\s*when/gi,
    /\/\/\s*then/gi
  ];
  
  // ===== Jest高度な機能パターン =====
  
  /** Jest高度な機能パターン */
  static readonly JEST_ADVANCED = [
    /\.resolves\./g,
    /\.rejects\./g,
    /toHaveBeenCalledWith/g,
    /toHaveBeenCalledTimes/g,
    /toMatchObject/g,
    /expect\.any\(/g,
    /expect\.objectContaining/g,
    /expect\.arrayContaining/g
  ];
  
  // ===== 命名規則パターン =====
  
  /** テスト命名規則パターン */
  static readonly NAMING_CONVENTIONS = [
    /^should\s+/i,
    /^test\s+/i,
    /^it\s+/i
  ];
}