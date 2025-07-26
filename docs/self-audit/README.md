# セルフ監査システム

このディレクトリには、Rimorのセルフ監査システムで生成される全てのドキュメントが格納されます。

## ディレクトリ構造

```
docs/self-audit/
├── README.md                   # このファイル
├── results/                    # 個別フェーズの監査結果
│   ├── phase0-dependencies.json
│   ├── phase1-basic.json
│   ├── phase2-security.json
│   ├── phase2_5-performance.json
│   ├── phase3-standards.json
│   ├── phase4-gap-analysis.json
│   ├── phase5-ai-output.json
│   └── phase6-maintainability.json
├── reports/                    # 統合レポート
│   ├── comprehensive-audit-summary.json
│   ├── comprehensive-audit-summary.md
│   ├── comprehensive-audit-summary.html
│   └── comprehensive-audit-summary.csv
├── archives/                   # 過去の監査結果アーカイブ
│   └── audit-YYYYMMDDTHHMMSS.tar.gz
└── scripts/                    # 監査関連スクリプト（参照用）
    └── audit-config.json
```

## 監査実行方法

### 基本監査
```bash
npm run self-audit               # 完全監査（履歴保存・自動比較・クリーンアップ有効）
npm run self-audit:quick         # 高速監査（Phase 0,1,2のみ）
npm run self-audit:security      # セキュリティ特化監査
npm run self-audit:performance   # 性能監査のみ
```

### 履歴管理オプション
```bash
npm run self-audit:no-history    # 履歴保存を無効化（ファイル上書き）
npm run self-audit:no-cleanup    # 自動クリーンアップを無効化
npm run self-audit:no-compare    # 前回結果との自動比較を無効化
```

### 出力形式指定
```bash
npm run self-audit:html          # HTML形式レポート生成
npm run self-audit:markdown      # Markdown形式レポート生成
npm run self-audit:archive       # アーカイブモード
```

### 履歴管理コマンド
```bash
npm run audit-history            # 履歴ファイル一覧表示
npm run audit-history:list       # 詳細な履歴一覧
npm run audit-history:stats      # 履歴統計情報
npm run audit-history:clean      # 古い履歴ファイルを削除
npm run audit-history:clean-dry  # 削除予定ファイル確認（実際には削除しない）
npm run audit-history:trend      # トレンド分析
npm run audit-history:compare    # 任意の2つの結果を比較
```

## 監査フェーズ

1. **Phase 0**: 依存関係・環境監査
2. **Phase 1**: 基本品質分析
3. **Phase 2**: セキュリティ特化監査
4. **Phase 2.5**: 性能・スケーラビリティ監査
5. **Phase 3**: 業界標準準拠性監査
6. **Phase 4**: ギャップ分析・改善計画
7. **Phase 5**: AI最適化出力検証
8. **Phase 6**: 保守性・技術的負債監査

## レポート形式

- **JSON**: 機械可読形式、他ツールとの連携用
- **Markdown**: 人間可読形式、ドキュメント用
- **HTML**: ブラウザ表示用、視覚的なレポート
- **CSV**: スプレッドシート分析用

## 品質指標

- 総合スコア（100点満点）
- フェーズ別スコア
- 問題検出数
- 改善推奨事項数
- 実行時間・性能指標

## 履歴管理システム

### 自動履歴保存
- **デフォルト有効**: 全ての監査結果にタイムスタンプが自動付与
- **ファイル命名規則**: `phase0-dependencies-20250726_154230.json`
- **最新ファイル**: タイムスタンプなしファイルも並行作成（後方互換性）
- **無効化**: `--no-history`オプションで従来の上書き動作に変更可能

### 自動クリーンアップ
- **デフォルト有効**: 30日より古いファイルを自動削除
- **保持期間設定**: `--retention-days`で日数指定可能
- **段階的保持**: アーカイブファイルは通常の3倍長期保持
- **保護機能**: milestone, release, baselineパターンは削除対象外

### 自動比較・トレンド分析
- **前回比較**: 実行時に前回結果との差分を自動表示
- **トレンド分析**: 詳細モード（--verbose）でトレンド分析を表示
- **回帰検出**: 品質低下時の自動アラート
- **無効化**: `--no-compare`オプションで比較機能を無効化可能

### 履歴管理ポリシー設定
- **設定ファイル**: `docs/self-audit/config/history-policy.json`
- **プリセット**: development, production, ci, audit用の事前定義設定
- **カスタマイズ**: 保持期間、クリーンアップ、比較設定の詳細調整