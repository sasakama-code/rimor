# Release Health Dashboard

Rimorプロジェクトのリリース後健全性を監視・評価するための包括的ダッシュボードシステムです。

## 🎯 Overview

Release Health Dashboardは、リリース後の各種指標を自動収集・分析し、問題の早期発見と対処を支援します。NPMパッケージの状態、ダウンロード統計、GitHub Repository活動、基本機能の動作確認を包括的に監視します。

## 🏗️ Architecture

### 監視コンポーネント

1. **📦 NPM Package Health**
   - パッケージの可用性確認
   - バージョン情報の取得
   - 依存関係分析
   - メタデータ整合性チェック

2. **📈 Download Statistics**  
   - 7日間のダウンロード統計
   - 日次平均とトレンド分析
   - 増減傾向の検出

3. **🐙 GitHub Repository Health**
   - 最新リリース情報
   - オープンIssue数とバグレポート
   - CI/CDワークフローの成功率
   - 失敗率の監視

4. **🔧 Installation Health**
   - グローバルインストールテスト
   - CLI機能の動作確認
   - 基本的な解析機能テスト

## 🚀 Usage

### 手動実行

```bash
# 基本的なヘルスチェック
npm run health-check

# GitHub API連携ありの詳細チェック
npm run health-check:github

# または直接実行
node scripts/release-health-check.js
```

### 自動監視

GitHub Actionsによる定期実行が設定されています：

- **定期実行**: 毎日09:00と21:00（JST）
- **手動実行**: GitHub ActionsのWorkflow Dispatchで随時実行可能
- **Issue自動作成**: 重大な問題検出時に自動でIssue作成

```bash
# GitHub CLIでワークフロー手動実行
gh workflow run health-check.yml

# 詳細分析付きで実行
gh workflow run health-check.yml -f detailed_check=true
```

## 📊 Health Metrics & Indicators

### 正常状態の指標

- ✅ **NPM Package**: パッケージが正常にアクセス可能
- ✅ **Downloads**: ダウンロード数が取得可能で安定
- ✅ **GitHub**: リリースが正常、Issue数が適切範囲
- ✅ **Installation**: グローバルインストールと基本機能が動作
- ✅ **Workflow Success Rate**: 80%以上の成功率

### 警告状態の指標

- ⚠️ **Download Data Limited**: API制限やデータ不足
- ⚠️ **High Issue Count**: 通常より多いオープンIssue
- ⚠️ **Workflow Degradation**: 成功率60-80%

### 重大問題の指標

- 🚨 **Package Unavailable**: NPMパッケージにアクセス不可
- 🚨 **Installation Failure**: グローバルインストール失敗
- 🚨 **CLI Malfunction**: 基本コマンドが動作しない
- 🚨 **High Workflow Failure**: 成功率60%未満

## 🔧 Configuration

### 環境変数

```bash
# GitHub API アクセストークン（オプション）
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# パッケージ名（デフォルト: rimor）
export PACKAGE_NAME=rimor

# リポジトリ情報（デフォルト値設定済み）
export REPO_OWNER=sasakama-code
export REPO_NAME=rimor
```

### GitHub Actions Secrets

以下のSecretsが設定されている必要があります：

- `GITHUB_TOKEN`: Repository contents:read, issues:write権限
- `SLACK_WEBHOOK_URL`: (オプション) Slack通知用

## 📋 Dashboard Output Example

```
🏥 Rimor Release Health Dashboard
===================================
⏰ Health check started at: 2024-01-15 09:00:00

📦 NPM Package Health
========================
✅ Package Status: Available
📋 Latest Version: 0.4.0
📅 Published: 2024-01-10 14:30:00 (5 days ago)
🔗 Dependencies: 4 production, 8 development

📈 Download Statistics
======================
✅ Download Data: Available
📊 Last 7 days total: 1,234 downloads
📅 Daily average: 176 downloads
📊 Recent trend: 📈 Increasing

🐙 GitHub Repository Health
=============================
✅ Latest Release: Available
🏷️ Version: v0.4.0
🐛 Open Issues: 3 total, 1 potential bugs
🔄 Recent Workflows: 4/5 successful
📊 Failure Rate: 20.0%

🔧 Installation Health
======================
✅ Global Installation: OK
📋 CLI Version: 0.4.0
✅ CLI Help Command: OK
✅ Basic Analysis: OK

🏥 Release Health Summary
===========================
🎉 Overall Health: EXCELLENT
📊 Component Status: 4 checked
🚨 Critical Issues: 0
⚠️ Warnings: 0
```

## 🚨 Alert & Issue Management

### 自動Issue作成

重大な問題が検出された場合、以下の情報を含むIssueが自動作成されます：

- 🕐 検出時刻とワークフロー実行URL
- 📋 詳細なヘルスレポート
- 🛠️ 推奨対処アクション
- 🔗 関連コマンドとリンク

### Issue Labels

- `health-check`: ヘルスチェック関連
- `critical`: 重大な問題
- `automated`: 自動生成

### 重複防止

24時間以内の同様Issue作成を防ぐため、既存Issue確認ロジックを実装。

## 🔍 Troubleshooting

### よくある問題と解決策

#### Q: "Download Data: Limited" が表示される
**A**: NPM統計APIの制限によるもので、通常は問題なし。
```bash
# 手動でダウンロード統計確認
curl "https://api.npmjs.org/downloads/range/last-week/rimor"
```

#### Q: GitHub Health Checkが "Error" になる  
**A**: GITHUB_TOKENの設定を確認：
```bash
# トークンの確認
echo $GITHUB_TOKEN

# 権限確認
gh auth status
```

#### Q: Installation Health が失敗する
**A**: npm環境とネットワーク接続を確認：
```bash
# npm設定確認
npm config list
npm doctor

# 手動インストールテスト
npm install -g rimor@latest
```

#### Q: 自動Issue作成が動作しない
**A**: GitHub Actions権限とSecrets設定を確認：
- Repository Settings > Actions > General > Workflow permissions
- Repository Settings > Secrets and variables > Actions

### ヘルスチェック復旧手順

1. **即座の対応**
   ```bash
   # 手動ヘルスチェック実行
   npm run health-check
   
   # エラー詳細確認
   node scripts/release-health-check.js 2>&1 | tee health-debug.log
   ```

2. **問題特定**
   - エラーメッセージから問題コンポーネント特定
   - 外部サービス（NPM、GitHub API）の状態確認
   - ネットワーク接続とアクセス権限確認

3. **修復実行**
   - 環境変数・認証情報の再設定
   - 依存関係の再インストール
   - パッケージの再公開（必要な場合）

4. **検証**
   ```bash
   # 修復後の確認
   npm run health-check
   
   # 継続監視
   gh workflow run health-check.yml
   ```

## 📈 Metrics & Monitoring

### SLA目標

- **可用性**: 99.5%以上
- **レスポンス時間**: 95%のリクエストが5秒以内
- **エラー率**: 1%未満
- **復旧時間**: 重大問題発生から4時間以内

### 監視間隔

- **自動ヘルスチェック**: 12時間毎
- **拡張分析**: 24時間毎
- **手動チェック**: 問題発生時やリリース後

### レポート

- **日次**: 自動ヘルスチェック結果
- **週次**: 拡張分析とトレンドレポート
- **月次**: 総合評価と改善提案

## 🔗 Integration

### 外部システム連携

```bash
# Slack通知（オプション）
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# PagerDuty連携（将来実装）
export PAGERDUTY_INTEGRATION_KEY=xxx

# カスタムメトリクス送信（将来実装）
export METRICS_ENDPOINT=https://metrics.example.com/api
```

### API拡張

Health Dashboard APIを拡張してカスタム監視項目を追加可能：

```javascript
// custom-health-check.js
const { ReleaseHealthDashboard } = require('./scripts/release-health-check.js');

class CustomHealthDashboard extends ReleaseHealthDashboard {
  async checkCustomMetrics() {
    // カスタム監視ロジック
  }
}
```

## 📚 Best Practices

### 運用のベストプラクティス

1. **定期的な手動確認**: 自動化に加えて週次の手動確認
2. **閾値の調整**: プロジェクト成長に応じた監視閾値の更新
3. **履歴の保持**: ヘルスチェック履歴の長期保存と分析
4. **チーム共有**: ヘルス状況の定期的なチーム共有

### 開発ワークフローとの統合

```bash
# リリース前ヘルスチェック
npm run pre-release-check && npm run health-check

# リリース後即座確認
npm run health-check

# 定期的な状況確認
gh run list --workflow=health-check.yml
```

---

このHealth Dashboardにより、Rimorプロジェクトの健全性を継続的に監視し、問題を早期発見・対処することで、ユーザーに安定したサービスを提供します。