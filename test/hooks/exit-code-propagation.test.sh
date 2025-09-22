#!/bin/bash

#
# Exit Code Propagation Detailed Test Suite
# 
# Issue #98専用: パイプラインとサブシェルでの終了コード伝播の詳細テスト
# t_wadaのTDD推奨手法に従った厳密なテスト設計
# 
# このテストは問題の本質を明確に示すため、RED フェーズで意図的に失敗する
#

set -euo pipefail

# テスト環境の設定
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASSED=0
FAILED=0
TOTAL=0

# カラーログ関数（KISS原則）
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

# アサーション関数（単一責任原則）
assert_exit_code() {
    local expected=$1
    local actual=$2
    local test_name="$3"
    
    TOTAL=$((TOTAL + 1))
    
    if [ $expected -eq $actual ]; then
        log_pass "$test_name (Expected: $expected, Got: $actual)"
        PASSED=$((PASSED + 1))
        return 0
    else
        log_fail "$test_name (Expected: $expected, Got: $actual)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# テスト1: 基本的なコマンド終了コード
test_basic_exit_codes() {
    log_test "Basic command exit codes"
    
    # 成功コマンド
    true
    assert_exit_code 0 $? "true command returns 0"
    
    # 失敗コマンド（一時的にset +eで許可）
    set +e
    false
    assert_exit_code 1 $? "false command returns 1"
    set -e
}

# テスト2: パイプライン内の終了コード（問題の核心）
test_pipeline_exit_codes() {
    log_test "Pipeline exit codes (core issue demonstration)"
    
    # 正常なパイプライン
    echo "test" | grep "test" >/dev/null
    assert_exit_code 0 $? "Normal pipeline returns 0"
    
    # パイプライン + while read + exit（問題のパターン）
    set +e
    echo "test" | while read line; do
        log_info "Inside subshell, executing exit 1"
        exit 1
    done
    local pipeline_exit=$?
    set -e
    
    # RED フェーズ: これは0を返す（問題）、1であるべき
    log_info "Pipeline with subshell exit returned: $pipeline_exit"
    assert_exit_code 1 $pipeline_exit "Pipeline with subshell exit 1 (this will fail - demonstrates the bug)"
}

# テスト3: while read ループの終了コード伝播
test_while_read_propagation() {
    log_test "While read loop exit code propagation"
    
    # 一時ファイル作成
    local temp_file=$(mktemp)
    echo -e "file1.test.ts\nfile2.test.ts" > "$temp_file"
    
    # パイプを使ったwhile read（問題のパターン）
    set +e
    cat "$temp_file" | while read file; do
        if [[ "$file" == "file2.test.ts" ]]; then
            log_info "Simulating test failure for $file"
            exit 1
        fi
        log_info "Processing $file"
    done
    local while_exit=$?
    set -e
    
    # クリーンアップ
    rm -f "$temp_file"
    
    # RED フェーズ: while read in pipeline は 0 を返す（問題）
    assert_exit_code 1 $while_exit "While read with exit 1 in pipeline (will fail - shows the bug)"
}

# テスト4: プロセス置換を使った修正方法のテスト
test_process_substitution_fix() {
    log_test "Process substitution fix (should work correctly)"
    
    # プロセス置換を使用（修正方法の一つ）
    set +e
    while read line; do
        if [[ "$line" == "failing_test" ]]; then
            log_info "Simulating failure with process substitution"
            exit 1
        fi
        log_info "Processing $line with process substitution"
    done < <(echo -e "passing_test\nfailing_test")
    local process_sub_exit=$?
    set -e
    
    # これは正しく1を返すはず
    assert_exit_code 1 $process_sub_exit "Process substitution with exit 1"
}

# テスト5: フラグ変数を使った修正方法のテスト（まだ未実装）
test_flag_variable_fix() {
    log_test "Flag variable fix (RED phase - not implemented yet)"
    
    # RED フェーズ: 修正版の実装を模擬（実際は未実装）
    local TEST_FAILED=0
    
    echo -e "passing_test\nfailing_test" | while read line; do
        if [[ "$line" == "failing_test" ]]; then
            log_info "Would set TEST_FAILED=1 here"
            TEST_FAILED=1
            break
        fi
    done
    
    # フラグをチェック（この実装は動作しない - サブシェル内で設定されるため）
    log_info "TEST_FAILED flag value after pipeline: $TEST_FAILED"
    
    # RED フェーズ: フラグが正しく設定されない（サブシェル内で設定されるため）
    assert_exit_code 1 $TEST_FAILED "Flag variable in subshell (will fail - shows why we need proper fix)"
}

# テスト6: set -o pipefail の効果をテスト
test_pipefail_behavior() {
    log_test "set -o pipefail behavior"
    
    # pipefail無効時
    set +o pipefail +e
    false | true
    local no_pipefail_exit=$?
    
    # pipefail有効時
    set -o pipefail
    false | true
    local pipefail_exit=$?
    set +o pipefail -e
    
    log_info "Without pipefail: $no_pipefail_exit, With pipefail: $pipefail_exit"
    
    assert_exit_code 0 $no_pipefail_exit "Pipeline without pipefail returns last command's exit code"
    assert_exit_code 1 $pipefail_exit "Pipeline with pipefail propagates failure"
}

# テスト7: 実際のgit diff パターンをエミュレート
test_git_diff_pattern() {
    log_test "Git diff pattern simulation"
    
    # git diff --cached --name-only のエミュレーション
    local mock_git_output="test/file1.test.ts
test/file2.test.ts
test/failing.test.ts"
    
    set +e
    echo "$mock_git_output" | grep -E "\.test\.ts$" | while read file; do
        log_info "Processing $file"
        if [[ "$file" == *"failing"* ]]; then
            log_info "Simulating npm test failure for $file"
            exit 1
        fi
    done
    local git_pattern_exit=$?
    set -e
    
    # RED フェーズ: パイプライン内のexitは伝播しない
    assert_exit_code 1 $git_pattern_exit "Git diff pattern with test failure (will fail - core issue)"
}

# テスト実行とレポート生成
run_detailed_tests() {
    echo "Exit Code Propagation Detailed Test Suite"
    echo "========================================"
    echo "Issue #98: Pre-commit hook exit code propagation"
    echo "RED Phase: These tests are expected to fail to demonstrate the problem"
    echo ""
    
    test_basic_exit_codes
    test_pipeline_exit_codes
    test_while_read_propagation
    test_process_substitution_fix
    test_flag_variable_fix
    test_pipefail_behavior
    test_git_diff_pattern
    
    echo ""
    echo "========================================"
    echo "Test Results:"
    echo "  Total: $TOTAL"
    echo "  Passed: $PASSED" 
    echo "  Failed: $FAILED"
    
    if [ $FAILED -gt 0 ]; then
        echo ""
        echo "🔴 RED Phase Result: $FAILED test(s) failed as expected"
        echo "This demonstrates the exit code propagation problem in issue #98"
        echo ""
        echo "Next steps:"
        echo "1. Implement flag variable solution in pre-commit hook"
        echo "2. Re-run tests to verify GREEN phase"
        echo "3. Refactor for better error handling"
        return 1
    else
        echo ""
        echo "🟢 All tests passed (unexpected in RED phase)"
        return 0
    fi
}

# メイン実行関数
main() {
    # Defensive Programming: 作業ディレクトリを明確に設定
    cd "$(dirname "${BASH_SOURCE[0]}")"
    
    run_detailed_tests
    exit $?
}

# スクリプト直接実行時のみmainを実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi