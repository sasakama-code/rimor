#!/bin/bash

#
# Fixed Pre-commit Hook Test Suite
# 
# Issue #98修正版のテスト（GREEN フェーズ）
# プロセス置換を使った修正の動作確認
#

set -euo pipefail

# テスト環境設定
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
FIXTURE_DIR="$TEST_DIR/fixtures"
PASSED=0
FAILED=0
TOTAL=0

# ログ関数
log_test() {
    echo -e "\n\033[36m[TEST]\033[0m $1"
}

log_pass() {
    echo -e "\033[32m  ✓ PASS\033[0m $1"
}

log_fail() {
    echo -e "\033[31m  ✗ FAIL\033[0m $1"
}

log_info() {
    echo -e "\033[34m  → INFO\033[0m $1"
}

# アサーション関数
assert_exit_code() {
    local expected=$1
    local actual=$2
    local test_name="$3"
    
    TOTAL=$((TOTAL + 1))
    
    if [ $expected -eq $actual ]; then
        log_pass "$test_name"
        PASSED=$((PASSED + 1))
        return 0
    else
        log_fail "$test_name (Expected: $expected, Got: $actual)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 修正されたpre-commitロジックのエミュレーション
run_fixed_pre_commit_logic() {
    local test_files="$1"
    
    # プロセス置換を使った修正版の実装
    TEST_FAILED=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            log_info "Processing $file"
            # テスト実行のエミュレーション
            if [[ "$file" == *"failing"* ]]; then
                echo "❌ Test failed for $file"
                TEST_FAILED=1
                break
            else
                echo "✅ Test passed for $file"
            fi
        fi
    done < <(echo "$test_files" | grep -E "\.test\.ts$")
    
    if [ $TEST_FAILED -ne 0 ]; then
        return 1
    fi
    return 0
}

# フィクスチャ準備
setup_fixtures() {
    log_info "Setting up test fixtures..."
    
    rm -rf "$FIXTURE_DIR"
    mkdir -p "$FIXTURE_DIR"
    
    # パッシングテスト
    touch "$FIXTURE_DIR/passing.test.ts"
    
    # フェイリングテスト
    touch "$FIXTURE_DIR/failing.test.ts"
    
    # 複数ファイル
    touch "$FIXTURE_DIR/another-passing.test.ts"
    
    log_info "Fixtures created"
}

# テスト1: 単一成功ファイル
test_single_passing_file_fixed() {
    log_test "Fixed implementation - Single passing file"
    
    set +e
    run_fixed_pre_commit_logic "$FIXTURE_DIR/passing.test.ts"
    local exit_code=$?
    set -e
    
    assert_exit_code 0 $exit_code "Single passing file should return 0"
}

# テスト2: 単一失敗ファイル（修正版で正しく動作するはず）
test_single_failing_file_fixed() {
    log_test "Fixed implementation - Single failing file"
    
    set +e
    run_fixed_pre_commit_logic "$FIXTURE_DIR/failing.test.ts"
    local exit_code=$?
    set -e
    
    # GREEN フェーズ: 修正版では正しく1が返る
    assert_exit_code 1 $exit_code "Single failing file should return 1"
}

# テスト3: 複数ファイル（失敗含む）
test_multiple_files_with_failure_fixed() {
    log_test "Fixed implementation - Multiple files with failure"
    
    local files="$FIXTURE_DIR/passing.test.ts
$FIXTURE_DIR/failing.test.ts
$FIXTURE_DIR/another-passing.test.ts"
    
    set +e
    run_fixed_pre_commit_logic "$files"
    local exit_code=$?
    set -e
    
    # GREEN フェーズ: 一つでも失敗があれば1を返す
    assert_exit_code 1 $exit_code "Multiple files with failure should return 1"
}

# テスト4: 複数ファイル（全て成功）
test_multiple_files_all_passing_fixed() {
    log_test "Fixed implementation - Multiple files all passing"
    
    local files="$FIXTURE_DIR/passing.test.ts
$FIXTURE_DIR/another-passing.test.ts"
    
    set +e
    run_fixed_pre_commit_logic "$files"
    local exit_code=$?
    set -e
    
    assert_exit_code 0 $exit_code "Multiple passing files should return 0"
}

# テスト5: プロセス置換のフラグ変数が正しく動作することを確認
test_process_substitution_flag_variable() {
    log_test "Process substitution flag variable behavior"
    
    # プロセス置換でフラグ変数が正しく設定されることを確認
    FLAG_TEST=0
    while read -r item; do
        if [[ "$item" == "trigger_failure" ]]; then
            FLAG_TEST=1
            break
        fi
    done < <(echo -e "normal\ntrigger_failure\nother")
    
    assert_exit_code 1 $FLAG_TEST "Process substitution should properly set flag variable"
}

# テスト実行とレポート
run_all_fixed_tests() {
    echo "Fixed Pre-commit Hook Test Suite (GREEN Phase)"
    echo "============================================="
    echo "Testing the process substitution fix for Issue #98"
    echo ""
    
    setup_fixtures
    
    test_single_passing_file_fixed
    test_single_failing_file_fixed
    test_multiple_files_with_failure_fixed
    test_multiple_files_all_passing_fixed
    test_process_substitution_flag_variable
    
    echo ""
    echo "============================================="
    echo "GREEN Phase Test Results:"
    echo "  Total: $TOTAL"
    echo "  Passed: $PASSED"
    echo "  Failed: $FAILED"
    
    if [ $FAILED -eq 0 ]; then
        echo ""
        echo "🟢 GREEN Phase: All tests passed!"
        echo "The process substitution fix correctly handles exit code propagation"
        return 0
    else
        echo ""
        echo "🔴 Some tests failed in GREEN phase"
        echo "The fix needs further refinement"
        return 1
    fi
}

# クリーンアップ
cleanup() {
    rm -rf "$FIXTURE_DIR" 2>/dev/null || true
}

# メイン実行
main() {
    cd "$PROJECT_ROOT"
    trap cleanup EXIT INT TERM
    
    run_all_fixed_tests
    exit $?
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi