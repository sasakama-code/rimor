# キャッシュ管理ベストプラクティスガイド

**Issue #118対応 - 開発者向けガイドライン**

## 概要

このガイドは、Issue #118「Jestキャッシュファイルの誤コミット問題」を受けて作成された、開発者向けのキャッシュ管理ベストプラクティスです。適切なキャッシュ管理により、セキュリティリスクの軽減と開発効率の向上を両立します。

## 🚨 重要: 誤コミットを防ぐための必須チェック

### 即座に確認すべき項目

```bash
# 1. 現在追跡されているキャッシュファイルの確認
git ls-files | grep -E "\.(map|cache|log|tsbuildinfo)$"

# 2. ステージングエリアの確認（コミット前必須）
git diff --cached --name-only | grep -E "\.(map|cache|log|tsbuildinfo)$"

# 3. .gitignoreの動作確認
git check-ignore .jest-cache/ *.map *.tsbuildinfo
```

## 📋 キャッシュファイル分類と対処法

### 🔴 CRITICAL: 即座に除外すべきファイル

#### ソースマップファイル（PII露出リスク）
```bash
# パターン
*.map
*.js.map
*.css.map  
*.d.ts.map

# 対処法
echo "*.map" >> .gitignore
git ls-files -z | grep -zE '\.map$' | xargs -0 git rm --cached
```

#### TypeScriptビルド情報
```bash
# パターン
*.tsbuildinfo
tsconfig.tsbuildinfo

# 対処法
echo "*.tsbuildinfo" >> .gitignore
git ls-files -z | grep -zE '\.tsbuildinfo$' | xargs -0 git rm --cached --ignore-unmatch
```

### 🟠 HIGH: テストキャッシュファイル

#### Jestキャッシュ
```bash
# パターン
.jest-cache/
.ts-jest/

# 対処法
echo -e "/.jest-cache/\n/.ts-jest/" >> .gitignore
git rm -r --cached .jest-cache .ts-jest
```

### 🟡 MEDIUM: ビルドツールキャッシュ

#### モダンビルドツール
```bash
# パターンと対処法
echo -e "/.turbo/\n/.nx/cache/\n/.vite/cache/\n/.parcel-cache/" >> .gitignore

# 既存ファイルがある場合
git rm -r --cached .turbo .nx/cache .vite/cache .parcel-cache
```

#### パッケージマネージャキャッシュ
```bash
# パターンと対処法
echo -e "/.npm/\n/.yarn/cache/\n/.pnpm-store/" >> .gitignore
```

## ⚙️ 推奨.gitignore設定

### 完全版.gitignoreパターン

```gitignore
# Issue #118対応: 包括的キャッシュファイル除外

# Source maps - PII露出リスク防止
*.map
*.js.map
*.css.map
*.d.ts.map

# Jest / TypeScript build caches  
/.jest-cache/
/.ts-jest/
*.tsbuildinfo
/.turbo/
/.nx/cache/

# Modern bundler caches
/.vite/cache/
/.parcel-cache/
*.webpack-cache/
/.rpt2_cache/
/.rollup-cache/

# Package manager caches
/.npm/
/.yarn/cache/
/.pnpm-store/
/.rush/
/.lerna/

# Runtime caches
/.cache/
/.rimor-cache/

# OS and IDE caches
.DS_Store
Thumbs.db
*.swp
*.swo
```

## 🔧 開発環境設定

### TypeScript設定（tsconfig.json）

```json
{
  "compilerOptions": {
    "sourceMap": false,          // 本番環境でのソースマップ生成を無効化
    "inlineSourceMap": false,    // インラインソースマップも無効化
    "incremental": true,         // ビルド高速化（.tsbuildinfo生成）
    "tsBuildInfoFile": "./.tsbuildinfo" // 明示的パス指定
  }
}
```

### Jest設定（jest.config.js）

```javascript
module.exports = {
  cache: false,                           // キャッシュ無効化
  cacheDirectory: '<rootDir>/.cache/jest', // キャッシュディレクトリ統一
  clearMocks: true,                       // テスト後にモックをクリア
  resetModules: true,                     // モジュールキャッシュリセット
  
  // ts-jest設定
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        sourceMap: false,        // ソースマップ生成を無効化
        inlineSourceMap: false
      }
    }]
  }
};
```

### package.jsonスクリプト

```json
{
  "scripts": {
    "clean:cache": "rm -rf .jest-cache .ts-jest .turbo .nx/cache .vite/cache .parcel-cache .cache *.tsbuildinfo",
    "clean:all": "npm run clean:cache && rm -rf node_modules dist",
    "precommit": "npm run clean:cache && git add .",
    "build:clean": "npm run clean:cache && npm run build"
  }
}
```

## 🔍 開発ワークフロー

### 日常の開発サイクル

```bash
# 1. 作業開始前のクリーンアップ
npm run clean:cache

# 2. 開発作業
npm run dev

# 3. コミット前の確認（自動化済み）
npm run precommit

# 4. コミット実行
git add .
git commit -m "feat: new feature implementation"
```

### コミット前チェックリスト

- [ ] `git status`でキャッシュファイルが含まれていないか確認
- [ ] Pre-commitフックが正常に動作したか確認
- [ ] ビルドが成功することを確認
- [ ] テストがパスすることを確認

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### Q1: 「git check-ignore」でファイルが無視されない

```bash
# .gitignoreファイルの確認
cat .gitignore | grep -E "(map|cache|tsbuildinfo)"

# .gitignoreファイルの再読み込み
git rm -r --cached .
git add .
```

#### Q2: Pre-commitフックでキャッシュファイルエラー

```bash
# エラーメッセージに従ってファイルを削除
git rm --cached <filename>

# .gitignoreに適切なパターンを追加
echo "<pattern>" >> .gitignore
```

#### Q3: CI環境でキャッシュファイル検出エラー

```bash
# ローカルでの事前チェック
git ls-files | grep -E "\.(map|cache|log|tsbuildinfo)$"

# 問題のあるファイルを一括削除
git ls-files | grep -E "\.(map|cache|log|tsbuildinfo)$" | xargs git rm --cached
```

### 緊急対処法

#### 大量のキャッシュファイルが混入した場合

```bash
# 1. 安全な一時ブランチ作成
git checkout -b fix-cache-files-issue

# 2. 問題ファイルの一括削除
find . -name "*.map" -exec git rm --cached {} \;
find . -name "*.tsbuildinfo" -exec git rm --cached {} \;
find . -name ".jest-cache" -type d -exec git rm -r --cached {} \;

# 3. .gitignore更新
cat >> .gitignore << 'EOF'
# Issue #118 Fix
*.map
*.tsbuildinfo  
/.jest-cache/
/.ts-jest/
EOF

# 4. 変更をコミット
git add .gitignore
git commit -m "fix: resolve cache file leakage (Issue #118)"

# 5. メインブランチにマージ
git checkout main
git merge fix-cache-files-issue
```

## 📊 監視とメンテナンス

### 定期的なヘルスチェック

```bash
# 週次実行推奨
#!/bin/bash
echo "=== キャッシュファイルヘルスチェック ==="

# キャッシュファイルの検出
CACHE_FILES=$(git ls-files | grep -E "\.(map|cache|log|tsbuildinfo)$")

if [ -n "$CACHE_FILES" ]; then
    echo "⚠️  警告: 以下のキャッシュファイルが追跡されています:"
    echo "$CACHE_FILES"
    exit 1
else
    echo "✅ キャッシュファイルのヘルスチェック: 正常"
fi
```

### メトリクス収集

```bash
# リポジトリサイズの監視
echo "リポジトリサイズ: $(du -sh .git | cut -f1)"

# ファイル数の監視  
echo "追跡ファイル数: $(git ls-files | wc -l)"

# .gitignoreの効果測定
echo "除外されたファイル数: $(git status --ignored --porcelain | wc -l)"
```

## 🎯 パフォーマンス最適化

### キャッシュ戦略の最適化

```bash
# 開発環境でのキャッシュ活用
export NODE_ENV=development
npm config set cache .npm-cache-local

# 本番環境でのキャッシュ無効化
export NODE_ENV=production  
npm config delete cache
```

### ビルド時間の短縮

```json
{
  "scripts": {
    "build:fast": "npm run clean:maps && tsc --incremental",
    "clean:maps": "find dist -name '*.map' -delete"
  }
}
```

## 📚 参考資料

### 関連ドキュメント
- [Issue #118: セキュリティリスク評価レポート](./issue118-nist-security-risk-assessment.md)
- [NIST SP 800-30: リスク評価ガイド](https://csrc.nist.gov/publications/detail/sp/800-30/rev-1/final)
- [Git公式ドキュメント: .gitignore](https://git-scm.com/docs/gitignore)

### ツールリンク
- [Jest公式ドキュメント](https://jestjs.io/docs/configuration)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/tsconfig)
- [Husky（Pre-commitフック）](https://typicode.github.io/husky/)

---

**最終更新**: 2025年8月24日  
**バージョン**: v1.0.0  
**対応Issue**: #118  
**次回見直し**: 2025年11月24日