#!/bin/bash

# ====================================================================
# Rimor 改善版セルフ監査ワークフロー v2.0
# 
# 業界標準を完全に満たす8段階包括的品質監査システム
# ====================================================================

set -e  # エラー時に停止

# ====================================================================
# 設定とオプション解析
# ====================================================================

# デフォルト設定
QUICK_MODE=false
SECURITY_ONLY=false
PERFORMANCE_ONLY=false
ARCHIVE_MODE=false
OUTPUT_FORMAT="json"
OUTPUT_DIR="docs/self-audit"
VERBOSE=false
PARALLEL_MODE=true
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_phase() {
    echo -e "${PURPLE}🔍 Phase $1: $2${NC}"
}

# ヘルプ表示
show_help() {
    cat << EOF
Rimor 改善版セルフ監査ワークフロー v2.0

使用方法:
  ./scripts/self-audit.sh [OPTIONS]
  npm run self-audit [-- OPTIONS]

オプション:
  -h, --help              このヘルプを表示
  -q, --quick            高速モード (Phase 0,1,2のみ)
  -s, --security-only    セキュリティ特化モード (Phase 0,2のみ)
  -p, --performance-only パフォーマンス特化モード (Phase 0,2.5のみ)
  -a, --archive          過去結果との比較モード
  -f, --format FORMAT    出力形式 (json|markdown|html|csv)
  -o, --output DIR       出力ディレクトリ (デフォルト: audit-results)
  -v, --verbose          詳細ログ出力
  --no-parallel          並列実行を無効化
  --timestamp TIMESTAMP  カスタムタイムスタンプ

例:
  ./scripts/self-audit.sh --quick --verbose
  ./scripts/self-audit.sh --security-only --format html
  ./scripts/self-audit.sh --archive --output ./reports
EOF
}

# オプション解析
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quick)
            QUICK_MODE=true
            shift
            ;;
        -s|--security-only)
            SECURITY_ONLY=true
            shift
            ;;
        -p|--performance-only)
            PERFORMANCE_ONLY=true
            shift
            ;;
        -a|--archive)
            ARCHIVE_MODE=true
            shift
            ;;
        -f|--format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --no-parallel)
            PARALLEL_MODE=false
            shift
            ;;
        --timestamp)
            TIMESTAMP="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# ====================================================================
# 環境チェックと初期化
# ====================================================================

log_info "Rimor 改善版セルフ監査ワークフロー v2.0 開始"
log_info "実行モード: $([ "$QUICK_MODE" = true ] && echo "高速" || [ "$SECURITY_ONLY" = true ] && echo "セキュリティ特化" || [ "$PERFORMANCE_ONLY" = true ] && echo "パフォーマンス特化" || echo "完全")"
log_info "出力形式: $OUTPUT_FORMAT"
log_info "出力先: $OUTPUT_DIR"

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/results"
mkdir -p "$OUTPUT_DIR/reports"
mkdir -p "$OUTPUT_DIR/archives"

# 実行開始時間記録
AUDIT_START_TIME=$(date +%s)

# プロジェクトルート確認
if [ ! -f "package.json" ]; then
    log_error "package.jsonが見つかりません。プロジェクトルートで実行してください。"
    exit 1
fi

# 必要なコマンド確認
REQUIRED_COMMANDS=("node" "npm" "jq")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        log_error "必要なコマンドが見つかりません: $cmd"
        exit 1
    fi
done

# ビルド実行
log_info "プロジェクトビルドを実行中..."
if ! npm run build > /dev/null 2>&1; then
    log_error "ビルドに失敗しました"
    exit 1
fi
log_success "ビルド完了"

# ====================================================================
# Phase実行関数の定義
# ====================================================================

# Phase 0: 依存関係・環境監査
run_phase0_dependencies() {
    log_phase "0" "依存関係・環境監査"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase0-dependencies.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "npm audit実行中..."
        log_info "ライセンス監査実行中..."
        log_info "パッケージバージョン監査実行中..."
    fi
    
    node scripts/audit-phase0-dependencies.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose") \
        $([ "$PARALLEL_MODE" = true ] && echo "--parallel")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 0 完了 (${phase_duration}秒)"
}

# Phase 1: 基本品質分析
run_phase1_basic() {
    log_phase "1" "基本品質分析"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase1-basic.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "静的解析実行中..."
        log_info "テストカバレッジ分析中..."
    fi
    
    node scripts/audit-phase1-basic.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose") \
        $([ "$PARALLEL_MODE" = true ] && echo "--parallel")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 1 完了 (${phase_duration}秒)"
}

# Phase 2: セキュリティ特化監査
run_phase2_security() {
    log_phase "2" "セキュリティ特化監査"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase2-security.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "TaintTyper型ベースセキュリティ解析実行中..."
        log_info "脆弱性パターン検出中..."
    fi
    
    node scripts/audit-phase2-security.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose") \
        $([ "$PARALLEL_MODE" = true ] && echo "--parallel")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 2 完了 (${phase_duration}秒)"
}

# Phase 2.5: パフォーマンス・リソース監査
run_phase2_5_performance() {
    log_phase "2.5" "パフォーマンス・リソース監査"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase2_5-performance.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "バンドルサイズ分析中..."
        log_info "メモリ使用量分析中..."
        log_info "CPU使用率分析中..."
    fi
    
    node scripts/audit-phase2_5-performance.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose") \
        $([ "$PARALLEL_MODE" = true ] && echo "--parallel")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 2.5 完了 (${phase_duration}秒)"
}

# Phase 3: 業界標準指標確認
run_phase3_standards() {
    log_phase "3" "業界標準指標確認"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase3-standards.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "ESLint rules準拠性確認中..."
        log_info "TypeScript設定監査中..."
        log_info "業界ベンチマーク比較中..."
    fi
    
    node scripts/audit-phase3-standards.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose") \
        $([ "$PARALLEL_MODE" = true ] && echo "--parallel")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 3 完了 (${phase_duration}秒)"
}

# Phase 4: 差異分析・改善提案
run_phase4_gap_analysis() {
    log_phase "4" "差異分析・改善提案"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase4-gap-analysis.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "期待結果との差異分析中..."
        log_info "改善提案生成中..."
    fi
    
    node scripts/audit-phase4-gap-analysis.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose") \
        $([ "$ARCHIVE_MODE" = true ] && echo "--archive") \
        --archive-dir "$OUTPUT_DIR/archives"
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 4 完了 (${phase_duration}秒)"
}

# Phase 5: AI最適化出力検証
run_phase5_ai_output() {
    log_phase "5" "AI最適化出力検証"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase5-ai-output.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "AI向け出力品質確認中..."
        log_info "Claude Code適合性検証中..."
    fi
    
    node scripts/audit-phase5-ai-output.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 5 完了 (${phase_duration}秒)"
}

# Phase 6: 保守性・技術的負債監査
run_phase6_maintainability() {
    log_phase "6" "保守性・技術的負債監査"
    
    local phase_start=$(date +%s)
    local phase_result="$OUTPUT_DIR/results/phase6-maintainability.json"
    
    if [ "$VERBOSE" = true ]; then
        log_info "循環的複雑度分析中..."
        log_info "技術的負債定量化中..."
        log_info "コード重複検出中..."
    fi
    
    node scripts/audit-phase6-maintainability.js \
        --output "$phase_result" \
        --format "$OUTPUT_FORMAT" \
        $([ "$VERBOSE" = true ] && echo "--verbose")
    
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))
    
    log_success "Phase 6 完了 (${phase_duration}秒)"
}

# ====================================================================
# メイン実行フロー
# ====================================================================

# 実行するPhaseの決定
if [ "$QUICK_MODE" = true ]; then
    PHASES=("0" "1" "2")
    log_info "高速モード: Phase 0, 1, 2のみ実行"
elif [ "$SECURITY_ONLY" = true ]; then
    PHASES=("0" "2")
    log_info "セキュリティ特化モード: Phase 0, 2のみ実行"
elif [ "$PERFORMANCE_ONLY" = true ]; then
    PHASES=("0" "2.5")
    log_info "パフォーマンス特化モード: Phase 0, 2.5のみ実行"
else
    PHASES=("0" "1" "2" "2.5" "3" "4" "5" "6")
    log_info "完全モード: 全8段階実行"
fi

# Phase実行
for phase in "${PHASES[@]}"; do
    case $phase in
        "0")
            run_phase0_dependencies
            ;;
        "1")
            run_phase1_basic
            ;;
        "2")
            run_phase2_security
            ;;
        "2.5")
            run_phase2_5_performance
            ;;
        "3")
            run_phase3_standards
            ;;
        "4")
            run_phase4_gap_analysis
            ;;
        "5")
            run_phase5_ai_output
            ;;
        "6")
            run_phase6_maintainability
            ;;
    esac
done

# ====================================================================
# 統合レポート生成
# ====================================================================

log_info "統合レポート生成中..."

node scripts/audit-report-generator.js \
    --input-dir "$OUTPUT_DIR/results" \
    --output-dir "$OUTPUT_DIR/reports" \
    --format "$OUTPUT_FORMAT" \
    --timestamp "$TIMESTAMP" \
    $([ "$VERBOSE" = true ] && echo "--verbose") \
    $([ "$ARCHIVE_MODE" = true ] && echo "--archive")

# ====================================================================
# 実行完了とサマリー
# ====================================================================

AUDIT_END_TIME=$(date +%s)
TOTAL_DURATION=$((AUDIT_END_TIME - AUDIT_START_TIME))

log_success "セルフ監査完了!"
log_info "総実行時間: ${TOTAL_DURATION}秒"
log_info "結果保存先: $OUTPUT_DIR/"

# サマリー表示
if [ -f "$OUTPUT_DIR/reports/comprehensive-audit-summary.$OUTPUT_FORMAT" ]; then
    log_info "統合レポート: $OUTPUT_DIR/reports/comprehensive-audit-summary.$OUTPUT_FORMAT"
fi

# アーカイブ保存
if [ "$ARCHIVE_MODE" = true ]; then
    ARCHIVE_NAME="audit-${TIMESTAMP}.tar.gz"
    tar -czf "$OUTPUT_DIR/archives/$ARCHIVE_NAME" -C "$OUTPUT_DIR" . --exclude=archives
    log_success "アーカイブ保存: $OUTPUT_DIR/archives/$ARCHIVE_NAME"
fi

log_success "改善版セルフ監査ワークフロー v2.0 完了 🎉"