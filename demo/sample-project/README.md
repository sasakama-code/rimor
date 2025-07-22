# Rimor デモ用サンプルプロジェクト

このプロジェクトは、**Rimor テスト品質監査ツール**のデモンストレーション用に作成されました。意図的にテスト品質の問題を含んでいます。

## 含まれている問題（Rimorで検出される予定）

### TestExistencePlugin で検出される問題
- `src/userService.js` - テストファイルが完全に存在しない
- 部分的にテストカバーされていない機能群

### AssertionExistsPlugin で検出される問題  
- `src/calculator.test.js` - `divide method exists` テストにアサーションなし
- 実行されるがアサーションのないテストケース

## ファイル構成

```
sample-project/
├── src/
│   ├── calculator.js         # 計算機能（部分的にテストあり）
│   ├── calculator.test.js    # 部分的なテスト + アサーション不足
│   └── userService.js        # ユーザー管理（テストなし）
├── lib/
│   ├── utils.js              # ユーティリティ（部分的にテストあり）
│   └── utils.test.js         # 部分的なテスト
└── package.json
```

## 期待される検出結果

Rimorで分析すると以下の問題が発見されます：

1. **テスト不足**: `userService.js`にテストファイルが存在しない
2. **アサーション不足**: `calculator.test.js`の一部テストケース
3. **部分的カバレッジ**: 実装済み機能の一部のみテストされている

## デモ実行方法

```bash
# Rimorでテスト品質分析を実行
npm run analyze ./demo/sample-project

# JSON形式での出力
npm run analyze:json ./demo/sample-project
```