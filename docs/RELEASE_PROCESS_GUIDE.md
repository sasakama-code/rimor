# Release Process Guide

Rimorプロジェクトの包括的なリリースプロセスガイドです。

## 🎯 Overview

このガイドでは、Rimorの安全で一貫したリリースプロセスを説明します。多段階品質ゲートシステムとRelease Readiness Checklistを活用し、高品質なリリースを実現します。

## 📋 Release Process Flow

```
開発完了 → 品質チェック → PR作成 → レビュー → マージ → タグ作成 → 自動リリース → 検証
```

## 🔧 Step-by-Step Release Process

### Step 1: 開発完了とローカル品質チェック

#### 1.1 自動品質チェック実行
```bash
# 包括的な品質チェックを実行
npm run pre-release-check
```

このスクリプトは以下を自動確認します：
- ✅ プロジェクト構造の整合性
- ✅ 依存関係のセキュリティ監査
- ✅ TypeScript型チェック
- ✅ 全テストの実行（パフォーマンステスト含む）
- ✅ ビルドプロセスの成功
- ✅ CLI機能の動作確認
- ✅ 自己ドッグフーディング
- ✅ パッケージ整合性
- ✅ バージョンとCHANGELOGの整合性

#### 1.2 手動チェック項目確認
```bash
# Release Readiness Checklistを開く
open docs/RELEASE_READINESS_CHECKLIST.md
```

### Step 2: バージョン更新とドキュメント準備

#### 2.1 バージョン更新
```bash
# パッチバージョンアップの例
npm version patch

# マイナーバージョンアップの例
npm version minor

# メジャーバージョンアップの例  
npm version major
```

#### 2.2 CHANGELOG更新
- `CHANGELOG.md` に新バージョンのエントリを追加
- 変更内容、新機能、修正されたバグを記載
- Breaking changesがある場合は明確に記載

#### 2.3 ドキュメント更新確認
- README.mdの内容が最新であることを確認
- コマンドライン引数の説明が正確であることを確認
- 使用例が動作することを確認

### Step 3: Pull Request作成とレビュー

#### 3.1 PR作成
```bash
# 機能ブランチから作業している場合
git add -A
git commit -m "release: prepare v1.2.3

🎯 Version bump to v1.2.3
📝 Update CHANGELOG with new features
📚 Update documentation

✅ All quality checks passed
🔍 Ready for release review"

git push origin feature/release-v1.2.3
```

#### 3.2 PR Description Template
```markdown
## 🚀 Release v1.2.3

### 📋 Pre-release Checklist Status
- [x] All automated quality checks passed
- [x] Manual Release Readiness Checklist reviewed
- [x] Documentation updated
- [x] Version consistency verified

### 🎯 Release Contents
- Brief summary of changes
- New features added
- Bug fixes included
- Breaking changes (if any)

### 🔍 Quality Gate Status
- [x] Tests: All passing
- [x] Security: No vulnerabilities
- [x] Build: Successful
- [x] Performance: Benchmarks met

/cc @team-members for review
```

### Step 4: マージとタグ作成

#### 4.1 PR マージ
- レビュー完了後、PRをmainブランチにマージ
- Branch Protection Rulesにより、全品質チェックが自動実行される

#### 4.2 リリースタグ作成
```bash
# mainブランチの最新状態を取得
git checkout main
git pull origin main

# リリースタグ作成
git tag v1.2.3
git push origin v1.2.3
```

### Step 5: 自動リリース実行と監視

#### 5.1 GitHub Actions監視
- タグ作成により自動的にRelease Workflowが実行される
- 多段階品質ゲートが順次実行される：
  1. **Quality Gates**: テスト、セキュリティ、ビルド検証
  2. **Release Execution**: npm公開、GitHub Release作成
  3. **Post-release Validation**: 公開確認、機能テスト

#### 5.2 リリース進行状況確認
```bash
# GitHub CLIでワークフロー状況確認
gh run list --workflow=release.yml

# 特定のワークフロー実行詳細確認
gh run view [RUN_ID]
```

### Step 6: リリース後検証

#### 6.1 即座の検証
```bash
# 公開パッケージのインストールテスト
npm install -g rimor@1.2.3

# 基本機能確認
rimor --version
rimor --help
```

#### 6.2 24時間以内のモニタリング
- npm download統計の確認
- Issue trackerでの問題報告監視
- ユーザーフィードバック収集

## 🚨 Troubleshooting

### よくある問題と解決策

#### Q: `npm run pre-release-check` が失敗する
**A**: 失敗したチェック項目を確認し、以下を実行：
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュのクリア
npm run build

# 個別にテスト実行で詳細確認
npm test -- --verbose
```

#### Q: GitHub Actions Release Workflowが失敗する
**A**: ワークフローログを確認し、失敗フェーズに応じて対処：

**Quality Gates失敗の場合:**
```bash
# ローカルで同じチェックを実行
npm run pre-release-check
npm test
npm run build
```

**Release Execution失敗の場合:**
- NPM_TOKEN secretsが有効であることを確認
- npm whoami でアクセス権限を確認

**Post-release Validation失敗の場合:**
- npm registry propagation待機（通常1-2分）
- package.jsonとtagのバージョン整合性確認

#### Q: Branch Protection Rulesでブロックされる
**A**: 
```bash
# Branch Protection設定確認
npm run setup-branch-protection

# PR経由でのリリース
git checkout -b release/v1.2.3
# バージョン更新とPR作成
```

### 緊急時の手動リリース

**⚠️ 注意**: 手動リリースはBranch Protection Rulesに違反するため、緊急時のみ使用

```bash
# npm publish (緊急時のみ)
npm run build
npm publish --access public

# GitHub Release手動作成
gh release create v1.2.3 --title "v1.2.3: Emergency Release" --notes "Emergency fix for..."
```

## 📊 Release Quality Metrics

### 目標指標
- **リリース成功率**: 95%以上
- **品質ゲート通過率**: 100%
- **平均リリース時間**: 15分以内
- **Post-release問題発生率**: 5%以下

### 継続的改善
- 各リリース後にプロセスの振り返りを実施
- 失敗パターンの分析と予防策実装
- チェックリストとスクリプトの継続的更新

## 🔗 関連リソース

- [Release Readiness Checklist](./RELEASE_READINESS_CHECKLIST.md)
- [GitHub Actions Workflow](./.github/workflows/release.yml)
- [Branch Protection Setup](../scripts/setup-branch-protection.sh)
- [Pre-release Check Script](../scripts/pre-release-check.sh)

---

*このガイドは、Rimorプロジェクトの品質とリリースプロセスの信頼性を維持するための重要なドキュメントです。新しいチームメンバーは必読資料として活用してください。*