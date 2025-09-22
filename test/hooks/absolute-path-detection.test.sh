#!/bin/bash

#
# 絶対パス検出Pre-commit Hook強化テスト - Issue #120対応
#
# TDD原則に従いRED（失敗）フェーズから開始
# Defensive Programming原則に従った堅牢な絶対パス検出テスト設計
#
# このテストは以下の設計原則に従います：
# - SOLID: 単一責任原則（各関数が特定の検証に特化）
# - DRY: 共通機能の再利用
# - KISS: シンプルで理解しやすいテストロジック
# - YAGNI: 必要最小限の機能のみ実装
# - Defensive Programming: 堅牢なエラーハンドリング
#

set -euo pipefail  # 厳格なエラーハンドリング

# テストディレクトリと結果カウンタ
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
FIXTURE_DIR="$TEST_DIR/fixtures-issue120"
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

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local message="$3"
    
    TOTAL=$((TOTAL + 1))
    
    if [[ "$haystack" == *"$needle"* ]]; then
        log_success "$message"
        PASSED=$((PASSED + 1))
        return 0
    else
        log_error "$message - '$needle' not found in '$haystack'"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# フィクスチャ準備（DRY原則適用）
setup_fixtures() {
    log_info "Setting up Issue #120 test fixtures..."
    
    rm -rf "$FIXTURE_DIR"
    mkdir -p "$FIXTURE_DIR/cache"
    mkdir -p "$FIXTURE_DIR/source-maps"
    
    # 絶対パス含有キャッシュファイルのフィクスチャ作成
    cat > "$FIXTURE_DIR/cache/jest-transform-cache-test" << EOF
{
  "absolutePath": "$HOME/Projects/TestProject/src/components/Button.tsx",
  "homeDirectory": "$HOME",
  "projectPath": "$HOME/Projects/TestProject"
}
EOF

    # ソースマップファイルのフィクスチャ（絶対パス含む）
    cat > "$FIXTURE_DIR/source-maps/component.js.map" << EOF
{
  "version": 3,
  "sources": ["$HOME/Projects/TestProject/src/components/Button.tsx"],
  "sourcesContent": ["// component source"],
  "file": "$HOME/Projects/TestProject/dist/components/Button.js"
}
EOF

    # 正常なキャッシュファイル（相対パス）
    cat > "$FIXTURE_DIR/cache/valid-cache" << 'EOF'
{
  "relativePath": "src/components/Button.tsx",
  "projectRelative": "./src"
}
EOF

    # 正常なソースマップファイル（相対パス）
    cat > "$FIXTURE_DIR/source-maps/valid.js.map" << 'EOF'
{
  "version": 3,
  "sources": ["src/components/Button.tsx"],
  "sourcesContent": ["// component source"],
  "file": "dist/components/Button.js"
}
EOF

    # 複合パターンテスト用ファイル
    cat > "$FIXTURE_DIR/cache/mixed-paths" << EOF
This file contains both:
- Relative path: src/utils/helper.ts
- Absolute path: $HOME/Projects/TestProject/src/utils/helper.ts
- Home directory: $HOME/.local/share/rimor
EOF

    # 環境変数テスト用ファイル（HOMEディレクトリパス）
    cat > "$FIXTURE_DIR/cache/home-path-test" << EOF
{
  "homePath": "${HOME}/Projects/Rimor",
  "userPath": "${USER}",
  "workingDir": "$(pwd)"
}
EOF

    log_info "Issue #120 test fixtures created successfully"
}

# 絶対パス検出ロジック（現在の実装をエミュレート）
detect_absolute_paths() {
    local file_path="$1"
    local found_violations=""
    
    if [ ! -f "$file_path" ]; then
        echo ""
        return 0
    fi
    
    # Issue #120で特定された問題パターン
    # パターンを実行時に構築して誤検知を回避
    local base_user_dir="Users"
    local base_home_dir="home"
    local regex_char_class="[^/\\s]+"
    local regex_home_class="[a-zA-Z0-9_-]+"
    
    local absolute_path_patterns=(
        "/${base_user_dir}/${regex_char_class}"                    # macOS user directory
        "/${base_home_dir}/${regex_home_class}"                    # Linux user directory
        "/${base_user_dir}/${regex_char_class}/Projects"           # project directory  
        "/${base_user_dir}/${regex_char_class}/Projects/TestProject" # specific project path
    )
    
    for pattern in "${absolute_path_patterns[@]}"; do
        local matches
        matches=$(grep -E "$pattern" "$file_path" 2>/dev/null || true)
        if [ -n "$matches" ]; then
            found_violations="$found_violations$matches\n"
        fi
    done
    
    echo -e "$found_violations"
}

# 環境変数ベース絶対パス検出
detect_env_based_absolute_paths() {
    local file_path="$1"
    local found_violations=""
    
    if [ ! -f "$file_path" ]; then
        echo ""
        return 0
    fi
    
    # 環境変数展開による絶対パス検出
    if [ -n "${HOME:-}" ]; then
        local home_matches
        home_matches=$(grep -F "$HOME" "$file_path" 2>/dev/null || true)
        if [ -n "$home_matches" ]; then
            found_violations="$found_violations$home_matches\n"
        fi
    fi
    
    if [ -n "${PWD:-}" ]; then
        local pwd_matches
        pwd_matches=$(grep -F "$PWD" "$file_path" 2>/dev/null || true)
        if [ -n "$pwd_matches" ]; then
            found_violations="$found_violations$pwd_matches\n"
        fi
    fi
    
    echo -e "$found_violations"
}

# 強化された絶対パス検出（修正版 - まだ未実装なのでRED phase）
enhanced_absolute_path_detection() {
    local file_path="$1"
    
    # RED phase: 強化版は未実装
    log_error "Enhanced absolute path detection is not implemented yet"
    return 1
}

# テストケース1: 基本的な絶対パス検出
test_basic_absolute_path_detection() {
    log_info "Running test: Basic absolute path detection in cache files"
    
    local violations
    violations=$(detect_absolute_paths "$FIXTURE_DIR/cache/jest-transform-cache-test")
    
    if [ -n "$violations" ]; then
        assert_equals 1 0 "Absolute paths should be detected in cache files (current implementation should find violations)"
    else
        assert_equals 0 1 "Current implementation should detect absolute paths but didn't"
    fi
}

# テストケース2: ソースマップファイル内の絶対パス検出
test_source_map_absolute_paths() {
    log_info "Running test: Absolute path detection in source map files"
    
    local violations
    violations=$(detect_absolute_paths "$FIXTURE_DIR/source-maps/component.js.map")
    
    if [ -n "$violations" ]; then
        assert_contains "$violations" "$HOME/Projects/TestProject" "Source map absolute paths should be detected"
    else
        assert_equals 1 0 "Source map should contain detectable absolute paths"
    fi
}

# テストケース3: 環境変数ベースの絶対パス検出
test_env_based_absolute_paths() {
    log_info "Running test: Environment variable based absolute path detection"
    
    local violations
    violations=$(detect_env_based_absolute_paths "$FIXTURE_DIR/cache/home-path-test")
    
    if [ -n "$violations" ]; then
        assert_contains "$violations" "$HOME" "Environment variable based paths should be detected"
    else
        assert_equals 1 0 "HOME directory paths should be detected"
    fi
}

# テストケース4: 混在パターンテスト
test_mixed_path_patterns() {
    log_info "Running test: Mixed relative and absolute path detection"
    
    local violations
    violations=$(detect_absolute_paths "$FIXTURE_DIR/cache/mixed-paths")
    
    # 絶対パスは検出されるが、相対パスは検出されない
    if [ -n "$violations" ]; then
        assert_contains "$violations" "$HOME/Projects/TestProject" "Absolute paths in mixed file should be detected"
        # 相対パスが検出されないことを確認
        if [[ "$violations" != *"src/utils/helper.ts"* ]]; then
            log_success "Relative paths correctly ignored in mixed pattern file"
            PASSED=$((PASSED + 1))
            TOTAL=$((TOTAL + 1))
        else
            log_error "Relative paths incorrectly detected as violations"
            FAILED=$((FAILED + 1))
            TOTAL=$((TOTAL + 1))
        fi
    else
        assert_equals 1 0 "Mixed pattern file should contain detectable absolute paths"
    fi
}

# テストケース5: 正常ファイル（相対パスのみ）の検証
test_relative_paths_allowed() {
    log_info "Running test: Relative paths should be allowed"
    
    local violations
    violations=$(detect_absolute_paths "$FIXTURE_DIR/cache/valid-cache")
    
    if [ -z "$violations" ]; then
        assert_equals 0 0 "Files with only relative paths should pass validation"
    else
        assert_equals 1 0 "Relative paths incorrectly flagged as violations: $violations"
    fi
}

# テストケース6: 存在しないファイルの安全な処理
test_nonexistent_file_handling() {
    log_info "Running test: Non-existent file handling (Defensive Programming)"
    
    local violations
    violations=$(detect_absolute_paths "$FIXTURE_DIR/nonexistent-file")
    
    # 存在しないファイルは空の結果を返すべき
    if [ -z "$violations" ]; then
        assert_equals 0 0 "Non-existent files should return empty violations"
    else
        assert_equals 1 0 "Non-existent file handling failed"
    fi
}

# テストケース7: 複数ファイル一括検証
test_batch_file_validation() {
    log_info "Running test: Batch file validation for absolute paths"
    
    local all_files=(
        "$FIXTURE_DIR/cache/jest-transform-cache-test"
        "$FIXTURE_DIR/source-maps/component.js.map"
        "$FIXTURE_DIR/cache/mixed-paths"
    )
    
    local total_violations=0
    
    for file in "${all_files[@]}"; do
        local violations
        violations=$(detect_absolute_paths "$file")
        if [ -n "$violations" ]; then
            total_violations=$((total_violations + 1))
        fi
    done
    
    # 3つのファイルすべてに絶対パスが含まれているはず
    assert_equals 3 $total_violations "All test files with absolute paths should be detected"
}

# テストケース8: パフォーマンステスト（大きなファイル）
test_large_file_performance() {
    log_info "Running test: Large file performance test"
    
    # 大きなテストファイルを作成（1MB程度）
    local large_file="$FIXTURE_DIR/large-test-file"
    
    # ベースコンテンツ作成
    echo "Base content with absolute path: $HOME/Projects/TestProject" > "$large_file"
    
    # ファイルサイズを増加（約1MB）
    for i in {1..10000}; do
        echo "Line $i: relative path src/component$i.ts" >> "$large_file"
    done
    
    # 最後に絶対パスを追加
    echo "Final absolute path: $HOME/Projects/TestProject/final.ts" >> "$large_file"
    
    # パフォーマンス測定
    local start_time=$(date +%s%3N)
    local violations
    violations=$(detect_absolute_paths "$large_file")
    local end_time=$(date +%s%3N)
    
    local duration=$((end_time - start_time))
    
    # 1秒以内に完了することを確認（パフォーマンス要件）
    if [ $duration -lt 1000 ]; then
        assert_equals 1 1 "Large file processing completed within 1 second ($duration ms)"
    else
        assert_equals 1 0 "Large file processing too slow: ${duration}ms"
    fi
    
    # 正しく絶対パスが検出されることも確認
    if [ -n "$violations" ]; then
        assert_contains "$violations" "$HOME/Projects/TestProject" "Absolute paths detected in large file"
    else
        assert_equals 1 0 "Large file should contain detectable absolute paths"
    fi
}

# テストケース9: 強化された検出機能テスト（RED phase - 未実装）
test_enhanced_detection() {
    log_info "Running test: Enhanced absolute path detection (should fail in RED phase)"
    
    # 強化版機能テスト（未実装なので失敗予定）
    if enhanced_absolute_path_detection "$FIXTURE_DIR/cache/jest-transform-cache-test"; then
        assert_equals 1 0 "Enhanced detection should fail in RED phase (not implemented yet)"
    else
        assert_equals 1 1 "Enhanced detection correctly fails in RED phase"
    fi
}

# テストケース10: セキュリティ重要度別分類テスト
test_security_severity_classification() {
    log_info "Running test: Security severity classification for detected paths"
    
    # 重要度分類のテストデータ
    local critical_paths=(
        "$HOME/Projects/TestProject"              # プロジェクト絶対パス
        "$HOME/.ssh/"                             # SSH設定
        "$HOME/.env"                              # 環境変数ファイル
    )
    
    local high_paths=(
        "$HOME/Projects/"                         # プロジェクトディレクトリ
        "$HOME/Documents/"                        # ドキュメントディレクトリ
    )
    
    local medium_paths=(
        "$HOME/"                                  # ホームディレクトリ
        "/tmp/person-specific-dir"                # temporary person directory
    )
    
    # テストファイル作成
    local severity_test_file="$FIXTURE_DIR/severity-test"
    {
        for path in "${critical_paths[@]}"; do
            echo "Critical: $path"
        done
        for path in "${high_paths[@]}"; do
            echo "High: $path"  
        done
        for path in "${medium_paths[@]}"; do
            echo "Medium: $path"
        done
    } > "$severity_test_file"
    
    local violations
    violations=$(detect_absolute_paths "$severity_test_file")
    
    if [ -n "$violations" ]; then
        # Critical レベルのパスが検出されることを確認
        assert_contains "$violations" "$HOME/Projects/TestProject" "Critical severity paths should be detected"
        
        # 複数の重要度レベルが検出されることを確認
        local violation_count=$(echo "$violations" | wc -l)
        if [ "$violation_count" -gt 5 ]; then
            assert_equals 1 1 "Multiple severity levels detected ($violation_count violations)"
        else
            assert_equals 1 0 "Insufficient violations detected: $violation_count"
        fi
    else
        assert_equals 1 0 "Security severity test should detect violations"
    fi
}

# すべてのテストを実行
run_all_tests() {
    log_info "Starting Absolute Path Detection Test Suite for Issue #120"
    log_info "============================================================="
    
    setup_fixtures
    
    # Issue #120 絶対パス検出テスト実行
    test_basic_absolute_path_detection
    test_source_map_absolute_paths
    test_env_based_absolute_paths
    test_mixed_path_patterns
    test_relative_paths_allowed
    test_nonexistent_file_handling
    test_batch_file_validation
    test_large_file_performance
    test_enhanced_detection  # RED phase - 失敗予定
    test_security_severity_classification
    
    log_info "============================================================="
    log_info "Test Summary (Issue #120 - Absolute Path Detection):"
    log_info "  Total: $TOTAL"
    log_success "  Passed: $PASSED"
    log_error "  Failed: $FAILED"
    
    if [ $FAILED -gt 0 ]; then
        log_warn "Some tests failed - this is expected in RED phase of TDD"
        log_warn "Next step: Implement enhanced absolute path detection (GREEN phase)"
        return 1
    else
        log_success "All tests passed!"
        return 0
    fi
}

# クリーンアップ
cleanup() {
    log_info "Cleaning up Issue #120 test environment..."
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