#!/bin/bash

# Pre-release Quality Check Script
# Release Readiness Checklistの自動化可能な項目を実行

set -e

echo "🔍 Rimor Pre-release Quality Check"
echo "=================================="

# 色付き出力のための関数
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }
blue() { echo -e "\033[34m$1\033[0m"; }

# チェック結果追跡
CHECKS_PASSED=0
CHECKS_TOTAL=0

check_result() {
    local status=$1
    local message=$2
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [ $status -eq 0 ]; then
        green "✅ $message"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        red "❌ $message"
    fi
}

# 1. 基本プロジェクト構造確認
blue "\n📋 Step 1: Project Structure Validation"
test -f package.json && check_result 0 "package.json exists" || check_result 1 "package.json missing"
test -f tsconfig.json && check_result 0 "tsconfig.json exists" || check_result 1 "tsconfig.json missing"
test -f jest.config.js && check_result 0 "jest.config.js exists" || check_result 1 "jest.config.js missing"
test -d src && check_result 0 "src directory exists" || check_result 1 "src directory missing"

# 2. 依存関係とセキュリティチェック
blue "\n🔒 Step 2: Dependencies & Security"
echo "📥 Installing dependencies..."
npm ci > /dev/null 2>&1 && check_result 0 "Dependencies installed successfully" || check_result 1 "Dependency installation failed"

echo "🔒 Running security audit..."
npm audit --audit-level=moderate > /dev/null 2>&1 && check_result 0 "Security audit passed" || check_result 1 "Security vulnerabilities detected"

# 3. TypeScript型チェック
blue "\n🔍 Step 3: TypeScript Type Checking"
echo "🔍 Running TypeScript compilation check..."
npx tsc --noEmit > /dev/null 2>&1 && check_result 0 "TypeScript type checking passed" || check_result 1 "TypeScript compilation errors"

# 4. テスト実行
blue "\n🧪 Step 4: Test Execution"
echo "🧪 Running all tests..."
npm test > /dev/null 2>&1 && check_result 0 "All tests passed" || check_result 1 "Test failures detected"

echo "🏃 Running performance tests..."
npm test -- --testPathPattern=performance > /dev/null 2>&1 && check_result 0 "Performance tests passed" || check_result 1 "Performance tests failed"

# 5. ビルドプロセス確認
blue "\n🏗️ Step 5: Build Process"
echo "🏗️ Running build process..."
npm run build > /dev/null 2>&1 && check_result 0 "Build completed successfully" || check_result 1 "Build process failed"

# ビルド成果物確認
test -f dist/index.js && check_result 0 "Main entry point built" || check_result 1 "Main entry point missing"
test -d dist/core && check_result 0 "Core modules built" || check_result 1 "Core modules not built"
test -d dist/plugins && check_result 0 "Plugin modules built" || check_result 1 "Plugin modules not built"

# 6. CLI機能確認
blue "\n🔧 Step 6: CLI Functionality"
echo "🔧 Testing CLI functionality..."
node dist/index.js --version > /dev/null 2>&1 && check_result 0 "CLI version command works" || check_result 1 "CLI version command failed"
node dist/index.js --help > /dev/null 2>&1 && check_result 0 "CLI help command works" || check_result 1 "CLI help command failed"

# 7. 自己ドッグフーディング
blue "\n🐕 Step 7: Self-dogfooding"
echo "🐕 Running Rimor on itself..."
node dist/index.js analyze ./src > /dev/null 2>&1 && check_result 0 "Self-analysis completed" || check_result 1 "Self-analysis failed"

# 8. パッケージ整合性
blue "\n📦 Step 8: Package Integrity"
echo "📦 Verifying package integrity..."
npm pack --dry-run > /dev/null 2>&1 && check_result 0 "Package validation passed" || check_result 1 "Package validation failed"

# 9. バージョン整合性確認
blue "\n🏷️ Step 9: Version Consistency"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $PACKAGE_VERSION"

# CHANGELOGの確認
if grep -q "## \[$PACKAGE_VERSION\]" CHANGELOG.md 2>/dev/null; then
    check_result 0 "CHANGELOG entry exists for version $PACKAGE_VERSION"
else
    check_result 1 "CHANGELOG entry missing for version $PACKAGE_VERSION"
fi

# 結果サマリー
blue "\n📊 Quality Check Summary"
echo "========================"
green "✅ Passed: $CHECKS_PASSED/$CHECKS_TOTAL checks"

if [ $CHECKS_PASSED -eq $CHECKS_TOTAL ]; then
    green "\n🎉 All quality checks passed! Ready for release."
    echo ""
    yellow "📋 Next steps:"
    echo "1. Review Release Readiness Checklist (docs/RELEASE_READINESS_CHECKLIST.md)"
    echo "2. Create release tag: git tag v$PACKAGE_VERSION"
    echo "3. Push tag to trigger release: git push origin v$PACKAGE_VERSION"
    echo ""
    exit 0
else
    FAILED=$((CHECKS_TOTAL - CHECKS_PASSED))
    red "\n❌ $FAILED checks failed. Please fix issues before release."
    echo ""
    yellow "🛠️ Recommended actions:"
    echo "1. Review failed checks above"
    echo "2. Fix identified issues"
    echo "3. Re-run this script: ./scripts/pre-release-check.sh"
    echo "4. Consult Release Readiness Checklist for manual checks"
    echo ""
    exit 1
fi