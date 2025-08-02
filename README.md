# Rimor - テスト品質監査ツール v0.8.0

**Rimor**（リモール）は、テストの「質」を監査することに特化した、シンプルで強力なツールです。単なるテストカバレッジを超えて、テストが本当にプロダクトの品質を守っているかを検証します。

## 🎯 v0.8.0の特徴 - コア価値への回帰

Rimor v0.8.0は、「テスト品質監査」というコア価値に集中するため、アーキテクチャを完全に再設計しました。

### 主要な特徴

- 🏗️ **DIベースアーキテクチャ** - Inversifyによる疎結合で保守性の高い設計
- ⚡ **統合分析エンジン** - 3つのエンジンを統合し、最適な分析モードを自動選択
- 🔬 **型ベースセキュリティ解析** - コンパイル時解析でゼロランタイムオーバーヘッド
- 📋 **YAMLベースルール定義** - シンプルで理解しやすいルール設定
- 🚀 **高速実行** - 並列処理最適化により最大2倍の高速化

### パフォーマンス指標

- ⚡ **起動時間**: 40%短縮
- 💾 **メモリ使用量**: 30%削減
- 🚀 **分析速度**: 最大2倍高速化

## 🎓 技術的基盤

Rimorの設計は、以下の研究成果から影響を受けています：

- **型ベースセキュリティ解析**: [Practical Type-Based Taint Checking and Inference](https://arxiv.org/abs/2504.18529) - TypeScriptの型システムを活用した静的解析手法の実装において、この論文で提案されたtaint追跡とtype inferenceの概念を参考にしています。

この研究により、実行時オーバーヘッドなしにセキュリティ脆弱性を検出できる効率的な解析が可能になりました。

## インストール

### npm実行（推奨）

```bash
# インストール不要で即座実行
npx rimor

# 特定のディレクトリを分析
npx rimor analyze ./src

# 自動モードで最適な分析を実行
npx rimor analyze ./src --mode=auto
```

### ローカル開発用

```bash
# プロジェクトのクローン
git clone https://github.com/sasakama-code/rimor.git
cd rimor

# 依存関係のインストール
npm install

# TypeScriptコンパイル
npm run build
```

## 🚀 使い方

### 基本的な使用方法

```bash
# プロジェクトの分析
npx rimor analyze ./src

# JSON形式で出力
npx rimor analyze ./src --output=json

# 並列処理モードで高速分析
npx rimor analyze ./src --mode=parallel
```

### プログラマティックAPI

```typescript
import { container } from 'rimor/container';
import { TYPES } from 'rimor/container/types';
import { IAnalysisEngine } from 'rimor/core/interfaces';

// DIコンテナから分析エンジンを取得
const engine = container.get<IAnalysisEngine>(TYPES.AnalysisEngine);

// 分析の実行
const result = await engine.analyze('./src');
console.log(`検出された問題: ${result.issues.length}件`);
```

## 📋 ルール定義

YAMLファイルで独自のルールを定義できます：

```yaml
# rules/custom-rules.yaml
- id: auth-test-coverage
  name: 認証テストカバレッジ
  description: 認証機能に対する適切なテストカバレッジを確保
  category: security
  severity: error
  patterns:
    - type: keyword
      pattern: auth|login|logout|token
      message: 認証関連の機能にはセキュリティテストが必要です
```

## 🔌 プラグインシステム

```typescript
import { IPlugin } from 'rimor/core/interfaces';

class CustomPlugin implements IPlugin {
  metadata = {
    id: 'custom-plugin',
    name: 'カスタムプラグイン',
    version: '1.0.0',
    enabled: true
  };

  async analyze(filePath: string): Promise<Issue[]> {
    // カスタム分析ロジック
    return [];
  }
}

// プラグインの登録
const pluginManager = container.get<IPluginManager>(TYPES.PluginManager);
pluginManager.register(new CustomPlugin());
```

## 📊 セキュリティ監査

組み込みのセキュリティ監査機能により、テストコードのセキュリティ問題を検出：

```bash
# セキュリティ監査の実行
npx rimor analyze ./src --security

# 詳細なセキュリティレポート
npx rimor analyze ./src --security --verbose
```

## 🔧 設定

`.rimorrc.json`ファイルでプロジェクト固有の設定が可能：

```json
{
  "targetPath": "./src",
  "plugins": {
    "testExistence": true,
    "assertionQuality": true,
    "securityAudit": true
  },
  "output": {
    "format": "json",
    "path": "./rimor-report.json"
  }
}
```

## 📈 開発コマンド

```bash
# テストの実行
npm test

# 型チェック
npm run typecheck

# リント
npm run lint

# 全チェック
npm run full-check
```

## 📄 ライセンス

MITライセンス - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 📋 変更履歴

最新の変更については[CHANGELOG.md](./CHANGELOG.md)を参照してください。

---

**Rimor** - テストの質を監査し、真の品質保証を実現する