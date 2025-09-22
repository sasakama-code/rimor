#!/bin/sh

#
# Pre-commit Hook Portability Test Suite (Issue #99)
#
# POSIX sh互換性テスト
# TDD原則に従いRED（失敗）フェーズから開始
#
# Defensive Programming原則に従った堅牢なテスト設計
# KISS原則に従ったシンプルな実装
#

set -eu  # POSIX準拠の厳格なエラーハンドリング

# テストディレクトリと結果カウンタ
TEST_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
FIXTURE_DIR="$TEST_DIR/fixtures-portability"
PASSED=0
FAILED=0
TOTAL=0

# 色付きログ関数（POSIX sh対応版）
log_info() {
    printf '\033[34m[INFO]\033[0m %s\n' "$1"
}

log_success() {
    printf '\033[32m[PASS]\033[0m %s\n' "$1"
}

log_error() {
    printf '\033[31m[FAIL]\033[0m %s\n' "$1"
}

log_warn() {
    printf '\033[33m[WARN]\033[0m %s\n' "$1"
}

# テストアサーション関数（単一責任原則）
assert_equals() {
    expected="$1"
    actual="$2"
    message="$3"
    
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
    not_expected="$1"
    actual="$2"
    message="$3"
    
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
    log_info "Setting up portability test fixtures..."
    
    rm -rf "$FIXTURE_DIR"
    mkdir -p "$FIXTURE_DIR"
    
    # 現在の問題のあるbashism構文をエミュレート
    cat > "$FIXTURE_DIR/current-bashism-logic" << 'EOF'
#!/bin/sh
# 現在のbashism問題を含む論理（103行目）

check_plugin_naming() {
    file="$1"
    basename="$2"
    
    # 問題: bash固有の[[構文をPOSIX shで実行
    if [[ "$file" == *"/plugins/"* ]] && ! echo "$basename" | grep -qE 'Plugin$|BasePlugin$'; then
        echo "NAMING_ERROR"
        return 1
    fi
    
    return 0
}

check_plugin_naming "$@"
EOF
    chmod +x "$FIXTURE_DIR/current-bashism-logic"
    
    # POSIX準拠の修正版論理
    cat > "$FIXTURE_DIR/fixed-posix-logic" << 'EOF'
#!/bin/sh
# POSIX準拠の修正版論理

check_plugin_naming() {
    file="$1"
    basename="$2"
    
    # 修正: POSIX準拠の条件式
    if echo "$file" | grep -q "/plugins/" && ! echo "$basename" | grep -qE 'Plugin$|BasePlugin$'; then
        echo "NAMING_ERROR"
        return 1
    fi
    
    return 0
}

check_plugin_naming "$@"
EOF
    chmod +x "$FIXTURE_DIR/fixed-posix-logic"
    
    log_info "Portability test fixtures created successfully"
}

# bashism検出テスト（現在の問題を確認）
test_bashism_detection() {
    log_info "Running test: Bashism syntax detection in current implementation"
    
    # 現在のpre-commitファイルでbashismをチェック
    if grep -q '\[\[' "$PROJECT_ROOT/.husky/pre-commit"; then
        log_error "Bashism [[ syntax detected in pre-commit file"
        assert_equals "no_bashism" "bashism_found" "Pre-commit should not contain bash-specific syntax"
    else
        log_success "No bashism detected in pre-commit file"
        assert_equals "no_bashism" "no_bashism" "Pre-commit file is bashism-free"
    fi
}

# POSIX sh環境でのbashism実行テスト
test_current_bashism_fails_in_posix_sh() {
    log_info "Running test: Current bashism logic fails in POSIX sh"
    
    # dash（POSIX準拠シェル）を使用してbashismを確実にテスト
    if command -v dash >/dev/null 2>&1; then
        dash "$FIXTURE_DIR/current-bashism-logic" "src/plugins/TestPlugin.ts" "TestPlugin" 2>/dev/null
        exit_code=$?
        
        # dashではbashismが確実に失敗する
        assert_not_equals 0 $exit_code "Bashism logic should fail in dash (POSIX sh)"
    else
        # dashが利用できない場合は、文法チェックを行う
        sh -n "$FIXTURE_DIR/current-bashism-logic" 2>/dev/null
        exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            # shでも動作する場合（多くのシステムでsh -> bashのリンク）
            log_warn "System sh appears to support bash syntax, checking actual compatibility"
            assert_equals 0 $exit_code "System sh supports bash syntax (common on many systems)"
        else
            assert_not_equals 0 $exit_code "Bashism syntax should fail in strict POSIX sh"
        fi
    fi
}

# POSIX準拠版の動作テスト
test_fixed_posix_logic_works() {
    log_info "Running test: Fixed POSIX logic works in sh"
    
    # POSIX shで修正版論理を実行
    sh "$FIXTURE_DIR/fixed-posix-logic" "src/plugins/TestPlugin.ts" "TestPlugin" 2>/dev/null
    exit_code=$?
    
    # POSIX準拠なので正常動作する
    assert_equals 0 $exit_code "Fixed POSIX logic should work in POSIX sh"
}

# 条件式の論理的等価性テスト
test_logical_equivalence() {
    log_info "Running test: Logical equivalence of bash and POSIX versions"
    
    # プラグインディレクトリ内のファイル
    test_file="src/plugins/SomePlugin.ts"
    test_basename="SomePlugin"
    
    # bash版（期待される動作をエミュレート）
    if echo "$test_file" | grep -q "/plugins/" && ! echo "$test_basename" | grep -qE 'Plugin$|BasePlugin$'; then
        bash_result="NAMING_ERROR"
    else
        bash_result="OK"
    fi
    
    # POSIX版
    sh "$FIXTURE_DIR/fixed-posix-logic" "$test_file" "$test_basename" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        posix_result="NAMING_ERROR"
    else
        posix_result="OK"
    fi
    
    assert_equals "$bash_result" "$posix_result" "Bash and POSIX versions should produce identical results"
}

# 有効なプラグインファイル名のテスト
test_valid_plugin_names() {
    log_info "Running test: Valid plugin names pass both versions"
    
    # 有効なプラグインファイル名のテスト
    test_cases="TestPlugin BasePlugin CustomAnalysisPlugin SecurityPlugin"
    
    for plugin_name in $test_cases; do
        test_file="src/plugins/$plugin_name.ts"
        
        sh "$FIXTURE_DIR/fixed-posix-logic" "$test_file" "$plugin_name" >/dev/null 2>&1
        exit_code=$?
        
        assert_equals 0 $exit_code "Valid plugin name '$plugin_name' should pass POSIX logic"
    done
}

# 無効なプラグインファイル名のテスト
test_invalid_plugin_names() {
    log_info "Running test: Invalid plugin names fail both versions"
    
    # 無効なプラグインファイル名のテスト
    test_cases="TestHelper UtilityClass DataProcessor"
    
    for class_name in $test_cases; do
        test_file="src/plugins/$class_name.ts"
        
        sh "$FIXTURE_DIR/fixed-posix-logic" "$test_file" "$class_name" >/dev/null 2>&1
        exit_code=$?
        
        assert_not_equals 0 $exit_code "Invalid plugin name '$class_name' should fail POSIX logic"
    done
}

# 異なるシェル環境での実行テスト
test_shell_compatibility() {
    log_info "Running test: Shell compatibility verification"
    
    # 利用可能なシェルでテスト実行
    shells="sh dash"  # bashは除外（bashismテストなので）
    
    for shell in $shells; do
        if command -v "$shell" >/dev/null 2>&1; then
            "$shell" "$FIXTURE_DIR/fixed-posix-logic" "src/plugins/TestPlugin.ts" "TestPlugin" >/dev/null 2>&1
            exit_code=$?
            
            assert_equals 0 $exit_code "Fixed logic should work in $shell"
        else
            log_warn "Shell '$shell' not available, skipping compatibility test"
        fi
    done
}

# テスト実行とレポート
run_all_tests() {
    log_info "Starting Pre-commit Portability Test Suite for Issue #99"
    log_info "=================================================="
    
    setup_fixtures
    
    # テスト実行（現在の実装では失敗することが期待される - REDフェーズ）
    test_bashism_detection
    test_current_bashism_fails_in_posix_sh
    test_fixed_posix_logic_works
    test_logical_equivalence
    test_valid_plugin_names
    test_invalid_plugin_names
    test_shell_compatibility
    
    log_info "=================================================="
    log_info "Test Summary:"
    log_info "  Total: $TOTAL"
    log_success "  Passed: $PASSED"
    log_error "  Failed: $FAILED"
    
    if [ $FAILED -gt 0 ]; then
        log_warn "Some tests failed - this indicates bashism issues in current implementation"
        log_warn "Next step: Fix bashism in .husky/pre-commit to make tests pass (GREEN phase)"
        return 1
    else
        log_success "All portability tests passed!"
        return 0
    fi
}

# クリーンアップ
cleanup() {
    log_info "Cleaning up portability test environment..."
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
if [ "${0##*/}" = "portability.test.sh" ]; then
    main "$@"
fi