# Changelog

All notable changes to the Rimor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07-22

### 🎉 初回MVPリリース

Rimorテスト品質監査ツールのMVP（Minimum Viable Product）版をリリースしました。2週間のアジャイル開発により、実用的なテスト品質分析機能を提供します。

### Added

#### コア機能
- **静的解析エンジン**: TypeScript/JavaScript プロジェクトの高速分析
- **プラグインシステム**: 拡張可能なアーキテクチャ
- **ファイル発見機能**: 再帰的なプロジェクト探索と除外パターン対応

#### プラグイン
- **TestExistencePlugin**: ソースファイルに対応するテストファイルの存在確認
- **AssertionExistsPlugin**: テストファイル内のアサーション文（expect, assert, should）の存在確認

#### CLI機能
- **基本分析コマンド**: `npm run analyze <path>`
- **出力形式選択**: テキスト形式（デフォルト）とJSON形式（`--format=json`）
- **詳細モード**: プラグイン情報表示（`--verbose`）
- **色付き出力**: 視認性の高い結果表示
- **エラーハンドリング**: 適切な終了コードとエラーメッセージ

#### 設定システム
- **設定ファイル対応**: `.rimorrc.json`, `.rimorrc`, `rimor.config.json`
- **除外パターン**: 分析対象から除外するファイルパターンの設定
- **プラグイン制御**: 個別プラグインの有効/無効設定
- **出力設定**: デフォルト出力形式と詳細表示の設定

#### npm Scripts
- `npm run analyze`: 基本分析実行
- `npm run analyze:json`: JSON形式出力
- `npm run analyze:verbose`: 詳細モード実行  
- `npm run dev`: 開発時の便利コマンド
- `npm run full-check`: ビルド + テスト + 分析の完全チェック

#### ドキュメント・デモ
- **包括的README**: インストール、使用方法、設定、API仕様
- **デモシステム**: サンプルプロジェクトとデモ用スクリプト
- **フィードバック収集**: 体系的なフィードバック管理システム

### Performance

- **高速実行**: 通常3-4ms、大規模プロジェクトでも数十ms以内
- **軽量設計**: 最小限の依存関係（chalk, yargs のみ）
- **効率的分析**: ファイルシステムの最適な探索アルゴリズム

### Quality Assurance

- **テスト網羅**: 48のテストケースで品質保証
- **型安全性**: TypeScript による完全な型定義
- **自己診断**: Rimor自身をRimorで品質管理
- **技術的負債管理**: 意図的な負債の体系的記録と管理

### 技術仕様

- **対応ファイル**: `.js`, `.ts`, `.tsx`, `.jsx`
- **テストパターン**: `*.test.*`, `*.spec.*`, `__tests__/**`
- **Node.js**: 14.x 以上推奨
- **出力形式**: CLI テキスト、構造化JSON
- **設定形式**: JSON ベース

### 実証された成果（MVP期間）

- **問題発見**: 自プロジェクトで8個のテスト不足を発見
- **実行速度**: 4ms の高速分析を実現
- **安定性**: 48テスト全通過、クラッシュゼロ
- **使いやすさ**: `npm run analyze` での即座実行

---

## [Unreleased]

### 今後の予定（Week 3-4）

#### エラーハンドリング強化
- より詳細なエラーメッセージ
- ファイル読み込みエラーの適切な処理
- 設定ファイル読み込み時のエラー処理強化

#### パフォーマンス最適化  
- 大規模プロジェクト対応の並列処理
- メモリ使用量の最適化
- キャッシュ機能の導入

#### プラグイン拡充
- AsyncPatternPlugin: 非同期テストパターンの検証
- TypeDefinitionPlugin: TypeScript型定義の品質チェック
- MockUsagePlugin: モック使用パターンの検証

#### CLI/UX 改善
- 対話型設定生成
- プログレス表示（大規模プロジェクト時）
- より親しみやすいエラーメッセージ

---

### 開発プロセス

このリリースは、以下の**アジャイル最速MVP型**開発プロセスで実現されました：

- **Day 1-2**: 最小限コア機能（100行以内）
- **Day 3-4**: 最初のプラグイン実装
- **Day 5-6**: 基本CLI構築  
- **Day 7-8**: 実用プラグイン追加
- **Day 9-10**: 設定システム・JSON出力
- **Day 11-12**: ドキュメント整備・npm scripts
- **Day 13-14**: デモ・リリース準備

### 貢献者

- **Lead Developer**: Claude Code (Anthropic) with sasakama-code
- **Architecture**: プラグイン駆動設計
- **Quality Assurance**: 自己dogfooding によるテスト駆動開発

### ライセンス

ISC License - 詳細は LICENSE ファイルを参照