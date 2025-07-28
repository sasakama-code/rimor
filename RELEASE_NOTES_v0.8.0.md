# Rimor v0.8.0 リリースノート

## 概要

Rimor v0.8.0は、プロジェクトの歴史において最も重要なリリースです。このバージョンでは、コア価値である「テスト品質監査」に焦点を絞り込み、60%の機能を戦略的に削除しました。その結果、より高速で、理解しやすく、保守しやすいツールへと生まれ変わりました。

### 主要な変更

- **アーキテクチャの完全再設計**: 依存性注入（DI）を基盤とした疎結合アーキテクチャへ移行
- **v0.7.0機能の統合**: 開発中だった型ベースセキュリティ解析機能を安定した形で統合
- **機能の簡素化**: 複雑な機能を削除し、テスト品質監査というコア機能に集中

## 🚨 破壊的変更

### 削除された機能

以下の機能はv0.8.0で削除されました：

- **ドメイン辞書システム** (`src/dictionary/`)
- **対話型プラグイン作成** (`src/interactive/`)
- **トレンド分析と予測** (`src/scoring/trends.ts`, `prediction.ts`)
- **履歴管理** (`src/scoring/history.ts`)
- **AIプロジェクト推論** (`src/ai-output/projectInference.ts`)

### 削除されたCLIコマンド

- `rimor dictionary` - ドメイン辞書管理
- `rimor plugin create` - 対話型プラグイン作成
- `rimor history` - 分析履歴表示
- `rimor trend` - トレンド分析

## ✨ 新機能

### 1. 依存性注入（DI）ベースのアーキテクチャ

Inversifyを使用した完全なDIコンテナベースのアーキテクチャに移行しました：

```typescript
// 新しいDIベースの使用方法
import { container } from './container';
import { TYPES } from './container/types';
import { IAnalysisEngine } from './core/interfaces';

const engine = container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
const result = await engine.analyze(targetPath);
```

### 2. 統合分析エンジン

3つの分析エンジン（Analyzer、ParallelAnalyzer、CachedAnalyzer）を単一の`UnifiedAnalysisEngine`に統合：

- パフォーマンスモードの自動選択
- ワーカープールによる並列処理
- AST生成機能の内蔵

### 3. v0.7.0型ベースセキュリティ解析

開発中だったv0.7.0の高度なセキュリティ機能を安定した形で統合：

- TypeBasedSecurityEngineによるコンパイル時解析
- テストファイルに対する汚染フロー解析
- ゼロランタイムオーバーヘッドの実現

### 4. 簡素化されたドメインルールシステム

複雑な辞書システムに代わる、YAMLベースのシンプルなルール定義：

```yaml
- id: auth-test-coverage
  name: 認証テストカバレッジ
  category: security
  severity: error
  patterns:
    - type: keyword
      pattern: auth|login|logout|token
      message: 認証関連の機能にはセキュリティテストが必要です
```

## 🎯 パフォーマンス改善

- **起動時間**: 約40%短縮（機能削減による）
- **メモリ使用量**: 約30%削減
- **分析速度**: 並列処理の最適化により最大2倍高速化

## 📝 移行ガイド

### CLIコマンドの変更

```bash
# 旧: 複数のコマンドとオプション
rimor analyze --parallel --cache --dictionary ./src

# 新: シンプルな単一コマンド
rimor analyze ./src --mode=auto
```

### プログラマティックAPI

```typescript
// 旧: 直接インスタンス化
const analyzer = new AnalyzerExtended();
analyzer.registerQualityPlugin(plugin);

// 新: DIコンテナから取得
const pluginManager = container.get<IPluginManager>(TYPES.PluginManager);
pluginManager.register(plugin);
```

## 🔧 技術的詳細

### 新しいコアインターフェース

- `IAnalysisEngine`: 統合分析エンジンのインターフェース
- `ISecurityAuditor`: セキュリティ監査のインターフェース
- `IReporter`: レポート生成のインターフェース
- `IPluginManager`: プラグイン管理のインターフェース

### 削除されたコンポーネント

- PluginSandbox: セキュリティサンドボックス（簡素化のため削除）
- DictionaryAwarePluginManager: 辞書対応プラグインマネージャー
- InteractivePluginCreator: 対話型プラグイン作成機能

## 🙏 謝辞

このメジャーリファクタリングは、Rimorをより良いツールにするための重要な一歩です。機能の削減は困難な決断でしたが、「テスト品質監査」というコア価値に集中することで、より価値のあるツールを提供できると確信しています。

## 📋 今後の予定

- v0.9.0: プラグインエコシステムの強化
- v1.0.0: 安定版リリースとAPIの固定化

---

詳細な変更履歴については、[CHANGELOG.md](./CHANGELOG.md)を参照してください。