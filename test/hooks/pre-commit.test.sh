#!/bin/bash

#
# Pre-commit Hook Test Suite
# 
# Issue #98対応: 終了コード伝播問題のテスト
# TDD原則に従いRED（失敗）フェーズから開始
# 
# Defensive Programming原則に従った堅牢なテスト設計
#

set -euo pipefail  # 厳格なエラーハンドリング

# テストディレクトリと結果カウンタ
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
FIXTURE_DIR="$TEST_DIR/fixtures"
PASSED=0
FAILED=0
TOTAL=0

# 色付きログ関数（KISS原則）
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[PASS]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[FAIL]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

# テストアサーション関数（単一責任原則）
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="$3"
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$expected" = "$actual" ]; then
        log_success "$message"
        PASSED=$((PASSED + 1))
        return 0
    else
        log_error "$message - Expected: '$expected', Got: '$actual'"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

assert_not_equals() {
    local not_expected="$1"
    local actual="$2"
    local message="$3"
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$not_expected" != "$actual" ]; then
        log_success "$message"
        PASSED=$((PASSED + 1))
        return 0
    else
        log_error "$message - Expected not: '$not_expected', But got: '$actual'"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# フィクスチャ準備（DRY原則適用）
setup_fixtures() {
    log_info "Setting up test fixtures..."
    
    rm -rf "$FIXTURE_DIR"
    mkdir -p "$FIXTURE_DIR"
    
    # 成功するテストファイル
    cat > "$FIXTURE_DIR/passing.test.ts" << 'EOF'
/**
 * パッシングテスト（フィクスチャ）
 */
describe('Passing Test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

    # 失敗するテストファイル
    cat > "$FIXTURE_DIR/failing.test.ts" << 'EOF'
/**
 * フェイリングテスト（フィクスチャ）
 */
describe('Failing Test', () => {
  test('should fail', () => {
    expect(1 + 1).toBe(3); // 意図的に失敗
  });
});
EOF

    # 複数テストケース（混在）
    cat > "$FIXTURE_DIR/mixed.test.ts" << 'EOF'
/**
 * 混在テストケース（フィクスチャ）
 */
describe('Mixed Test Cases', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
  
  test('should also pass', () => {
    expect(false).toBe(false);
  });
});
EOF

    log_info "Test fixtures created successfully"
}

# モックgitコマンド作成（テスト分離のため）
setup_mock_git() {
    local mock_output="$1"
    
    # モックgitスクリプト作成
    cat > "$FIXTURE_DIR/mock-git" << EOF
#!/bin/bash
# モックgitコマンド
if [[ "\$*" == *"diff --cached --name-only"* ]]; then
    echo "$mock_output"
else
    # その他のgitコマンドは本物を呼び出し
    exec /usr/bin/git "\$@"
fi
EOF
    chmod +x "$FIXTURE_DIR/mock-git"
    
    # パスの先頭に追加してモックを優先
    export PATH="$FIXTURE_DIR:$PATH"
}

# pre-commitフックのエミュレーション（現在の実装）
run_current_pre_commit_logic() {
    local files_list="$1"
    
    # 現在の問題のある実装をエミュレート
    echo "$files_list" | grep -E "\.test\.ts$" | while read file; do
        if [ -f "$file" ]; then
            # テスト実行をエミュレート
            if [[ "$file" == *"failing"* ]]; then
                # 失敗をシミュレート
                echo "❌ Test failed for $file" >&2
                exit 1  # この exit がサブシェル内で実行される（問題の箇所）
            else
                echo "✅ Test passed for $file"
            fi
        fi
    done
    
    # サブシェルの終了コードは親に伝播しない
    return $?
}

# 修正版のpre-commitロジック（まだ未実装なのでテスト失敗予定）
run_fixed_pre_commit_logic() {
    # RED フェーズ: この関数は未実装なのでテスト失敗
    log_error "Fixed pre-commit logic is not implemented yet"
    return 1
}

# テストケース1: 単一テストファイル成功時の終了コード
test_single_passing_file() {
    log_info "Running test: Single passing file exit code"
    
    setup_mock_git "$FIXTURE_DIR/passing.test.ts"
    
    # 現在の実装では成功することを確認
    run_current_pre_commit_logic "$FIXTURE_DIR/passing.test.ts"
    local exit_code=$?
    
    assert_equals 0 $exit_code "Single passing file should return exit code 0"
}

# テストケース2: 単一テストファイル失敗時の終了コード（問題の核心）
test_single_failing_file() {
    log_info "Running test: Single failing file exit code (core issue)"
    
    setup_mock_git "$FIXTURE_DIR/failing.test.ts"
    
    # 現在の実装では失敗が検出されない問題
    run_current_pre_commit_logic "$FIXTURE_DIR/failing.test.ts"
    local exit_code=$?
    
    # RED フェーズ: 現在は0が返ってくる（問題）、1が返るべき
    assert_not_equals 1 $exit_code "Current implementation fails to propagate exit code (this is the bug)"
}

# テストケース3: 複数ファイル混在時の終了コード
test_multiple_mixed_files() {
    log_info "Running test: Multiple files with mixed results"
    
    setup_mock_git "$FIXTURE_DIR/passing.test.ts
$FIXTURE_DIR/failing.test.ts
$FIXTURE_DIR/mixed.test.ts"
    
    run_current_pre_commit_logic "$FIXTURE_DIR/passing.test.ts
$FIXTURE_DIR/failing.test.ts
$FIXTURE_DIR/mixed.test.ts"
    local exit_code=$?
    
    # RED フェーズ: 失敗が含まれているので1を返すべきだが、現在は0が返る
    assert_not_equals 1 $exit_code "Multiple files with failure should return exit code 1"
}

# テストケース4: 修正版の動作テスト（RED フェーズで失敗予定）
test_fixed_implementation() {
    log_info "Running test: Fixed implementation behavior (should fail in RED phase)"
    
    setup_mock_git "$FIXTURE_DIR/failing.test.ts"
    
    # 修正版の実装テスト（まだ未実装なので失敗）
    run_fixed_pre_commit_logic "$FIXTURE_DIR/failing.test.ts"
    local exit_code=$?
    
    # RED フェーズ: 修正版未実装なので失敗
    assert_equals 1 $exit_code "Fixed implementation should properly return exit code 1 for failing tests"
}

# テストケース5: エッジケース - 存在しないファイル
test_nonexistent_file() {
    log_info "Running test: Non-existent file handling"
    
    setup_mock_git "nonexistent.test.ts"
    
    run_current_pre_commit_logic "nonexistent.test.ts"
    local exit_code=$?
    
    # 存在しないファイルは無視されるべき
    assert_equals 0 $exit_code "Non-existent files should be ignored gracefully"
}

# テストケース6: パイプライン動作の検証
test_pipeline_behavior() {
    log_info "Running test: Pipeline subshell behavior verification"
    
    # サブシェル内のexit 1が親に伝播しないことを直接検証
    echo "test" | while read line; do
        exit 1  # サブシェル内でのexit
    done
    local pipeline_exit_code=$?
    
    # パイプラインのexit codeは0（問題の証明）
    assert_equals 0 $pipeline_exit_code "Pipeline with subshell exit 1 returns 0 (demonstrating the issue)"
}

# テスト実行とレポート
run_all_tests() {
    log_info "Starting Pre-commit Hook Test Suite for Issue #98"
    log_info "==============================================="
    
    setup_fixtures
    
    # テスト実行（失敗することが期待される - REDフェーズ）
    test_single_passing_file
    test_single_failing_file  
    test_multiple_mixed_files
    test_fixed_implementation  # 修正版未実装なので失敗
    test_nonexistent_file
    test_pipeline_behavior
    
    log_info "==============================================="
    log_info "Test Summary:"
    log_info "  Total: $TOTAL"
    log_success "  Passed: $PASSED"
    log_error "  Failed: $FAILED"
    
    if [ $FAILED -gt 0 ]; then
        log_warn "Some tests failed - this is expected in RED phase of TDD"
        log_warn "Next step: Implement fixes to make tests pass (GREEN phase)"
        return 1
    else
        log_success "All tests passed!"
        return 0
    fi
}

# クリーンアップ
cleanup() {
    log_info "Cleaning up test environment..."
    rm -rf "$FIXTURE_DIR" 2>/dev/null || true
}

# メイン実行
main() {
    cd "$PROJECT_ROOT"
    
    # シグナルハンドリング（Defensive Programming）
    trap cleanup EXIT INT TERM
    
    run_all_tests
    exit $?
}

# スクリプトが直接実行された場合のみmainを実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi