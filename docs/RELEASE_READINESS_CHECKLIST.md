# Release Readiness Checklist

Rimorプロジェクトのリリース前に必須で確認すべき項目の包括的チェックリストです。

## 📋 Pre-release Quality Assurance

### ✅ Code Quality & Testing
- [ ] 全てのテストがローカル環境で成功する (`npm test`)
- [ ] テストカバレッジが適切な水準を維持している 
- [ ] TypeScript型チェックがエラーなく完了する (`npx tsc --noEmit`)
- [ ] 新機能には対応するテストが実装されている
- [ ] パフォーマンステストが通過している
- [ ] 自己ドッグフーディング（Rimor自身の解析）でエラーが発生しない

### ✅ Security & Dependencies  
- [ ] セキュリティ監査で重大な脆弱性が検出されない (`npm audit`)
- [ ] 新しい依存関係が必要最小限に抑えられている
- [ ] 全ての依存関係のライセンスが適切である
- [ ] パッケージに機密情報が含まれていない

### ✅ Build & Package
- [ ] ビルドプロセスがエラーなく完了する (`npm run build`)
- [ ] 生成されたdist/ディレクトリに必要なファイルが全て含まれている
- [ ] パッケージサイズが適切な範囲内である
- [ ] CLIコマンドが正常に動作する (`node dist/index.js --version`)

## 📦 Version Management

### ✅ Version Consistency
- [ ] package.jsonのバージョンが適切に更新されている
- [ ] CHANGELOGに新バージョンのエントリが追加されている
- [ ] バージョンアップの種類（major/minor/patch）が適切である
- [ ] Breaking changesがある場合は適切に文書化されている

### ✅ Documentation Updates
- [ ] README.mdが最新の機能を反映している
- [ ] コマンドライン引数の説明が最新である
- [ ] インストール手順が正確である
- [ ] 使用例が動作することを確認済み

## 🔄 Pre-release Workflow

### ✅ Branch Protection Compliance
- [ ] main ブランチへの直接pushではなくPull Requestを使用している
- [ ] PR review processが完了している
- [ ] 全てのCIチェックが通過している
- [ ] Conflictが解決されている

### ✅ Release Preparation
- [ ] release/vX.X.X ブランチを作成している（該当する場合）
- [ ] マイグレーションガイドが準備されている（Breaking changesがある場合）
- [ ] リリースノートの下書きが完成している
- [ ] ベータ版でのテストが完了している（該当する場合）

## 🚀 Release Process

### ✅ Tag Creation & GitHub Actions
- [ ] 適切なバージョンタグ (vX.X.X) を作成する準備ができている
- [ ] GitHub Actionsのsecrets（NPM_TOKEN）が有効である
- [ ] Release workflowが最新の状態である
- [ ] Productionへのリリース権限が確認されている

### ✅ Communication & Rollback Plan
- [ ] リリースの影響範囲を理解している
- [ ] 問題発生時のrollback手順が明確である
- [ ] ユーザーへの通知方法が決定されている（該当する場合）
- [ ] サポート対応の準備ができている

## 🔍 Post-release Validation

### ✅ Publication Verification
- [ ] npm registryでの公開が確認される
- [ ] Global installationが成功する (`npm install -g rimor@X.X.X`)
- [ ] 基本的なCLI機能が動作する
- [ ] GitHub Releaseが正常に作成される

### ✅ Monitoring & Follow-up
- [ ] リリース後24時間のモニタリング体制が整っている
- [ ] 問題発生時の連絡体制が確立されている
- [ ] 次のリリースサイクルの計画が開始される
- [ ] フィードバック収集の準備ができている

## 📊 Quality Gate Metrics

### ✅ Performance Benchmarks
- [ ] CLI起動時間: < 500ms
- [ ] 解析実行時間: 適切な範囲内
- [ ] メモリ使用量: 合理的な範囲内
- [ ] バンドルサイズ: 前バージョンからの大幅増加なし

### ✅ Test Metrics
- [ ] テスト実行時間: 妥当な範囲内
- [ ] テスト成功率: 100%
- [ ] Code coverage: 十分な水準を維持
- [ ] 新機能のテスト: 適切なカバレッジ

## 🔧 Emergency Procedures

### ❌ Release Failure Recovery
- [ ] CI/CDパイプライン失敗時の対処手順を理解している
- [ ] npm publish失敗時の復旧方法を把握している
- [ ] GitHub Release作成失敗時の手動対処を準備している
- [ ] Version rollback の手順を理解している

### 🚨 Critical Issue Response
- [ ] 重大なバグ発見時の緊急パッチリリース手順
- [ ] セキュリティ問題発見時の対応フロー
- [ ] ユーザー影響の評価方法
- [ ] Hot fix deployment の準備

---

## ✅ Final Release Approval

**リリース実行者サインオフ:**
- [ ] 上記全項目を確認し、リリース準備が完了していることを確認した
- [ ] リリースタグ作成の準備ができている
- [ ] Post-release monitoring の準備ができている

**リリース実行日時:** `_________________`

**実行者:** `_________________`

**バージョン:** `v_________________`

---

*このチェックリストは、Rimorプロジェクトの品質とリリースプロセスの信頼性を保つための重要なツールです。全ての項目を慎重に確認してからリリースを実行してください。*