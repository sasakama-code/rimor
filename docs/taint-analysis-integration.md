# 汚染解析システム統合ガイド

## 概要

Rimorに統合された型ベース汚染解析システムは、[arXiv:2504.18529v2「Practical Type-Based Taint Checking and Inference」](https://arxiv.org/html/2504.18529v2)の研究成果を完全に実装したものです。

## アーキテクチャ

### コンポーネント構成

```
src/security/
├── annotations/
│   └── taint-annotations.ts      # TypeScriptデコレータ
├── types/
│   └── checker-framework-types.ts # 型定義
├── analysis/
│   └── search-based-inference.ts  # 探索ベース推論エンジン
├── inference/
│   └── local-inference-optimizer.ts # ローカル最適化
├── polymorphic/
│   └── library-method-handler.ts  # ポリモーフィック処理
├── compatibility/
│   └── checker-framework-compatibility.ts # 互換層
└── taint-analysis-system.ts      # 統合システム
```

## 使用方法

### 1. デコレータを使用したアノテーション

```typescript
import { Tainted, Untainted, PolyTaint } from '@rimor/security';

class SecurityService {
  // 汚染されたデータを受け取る
  processUserInput(@Tainted userInput: string): string {
    // サニタイズ処理
    const sanitized = this.sanitize(userInput);
    return sanitized; // @Untainted として推論される
  }
  
  // ポリモーフィックメソッド
  @PolyTaint()
  transform(data: string): string {
    return data.toLowerCase();
  }
  
  @Untainted
  private sanitize(@Tainted input: string): string {
    // XSS対策
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
}
```

### 2. CLIからの実行

```bash
# 単一ファイルの解析
rimor taint-analysis src/services/auth.ts

# ディレクトリ全体の解析
rimor taint-analysis src/

# JSON形式で出力
rimor taint-analysis src/ --output json

# JAIF形式でエクスポート
rimor taint-analysis src/ --export-jaif annotations.jaif

# 詳細オプション
rimor taint-analysis src/ \
  --max-depth 150 \
  --confidence 0.9 \
  --library-behavior optimistic
```

### 3. プラグインとしての使用

```typescript
import { TaintAnalysisPlugin } from '@rimor/plugins/security';
import { PluginManager } from '@rimor/core';

// プラグインマネージャーに登録
const pluginManager = new PluginManager();
pluginManager.register(new TaintAnalysisPlugin());

// 解析実行
const results = await pluginManager.analyze({
  files: ['src/**/*.ts'],
  plugins: ['taint-analysis']
});
```

### 4. プログラマティックAPI

```typescript
import { TaintAnalysisSystem } from '@rimor/security';

// システムの初期化
const taintSystem = new TaintAnalysisSystem({
  inference: {
    enableSearchBased: true,
    enableLocalOptimization: true,
    maxSearchDepth: 100,
    confidenceThreshold: 0.8
  }
});

// コードの解析
const result = await taintSystem.analyzeCode(sourceCode, {
  fileName: 'example.ts'
});

// 結果の処理
console.log(`Issues found: ${result.issues.length}`);
console.log(`Annotations inferred: ${result.annotations.size}`);
```

## 主要機能

### 1. 自動型推論

システムは以下の場合に自動的に型を推論します：

- 既知のサニタイザー関数（`sanitize`, `escape`, `validate`など）
- ライブラリメソッドの既知のパターン
- 制御フローに基づく精練

### 2. ポリモーフィック汚染処理

```typescript
// Stringのメソッドは汚染を保持
const tainted = getUserInput();
const upper = tainted.toUpperCase(); // まだ@Tainted

// Objectのメソッドは安全
const keys = Object.keys(taintedObj); // @Untainted
```

### 3. フロー感度解析

```typescript
let data = getUserInput(); // @Tainted
if (isValid(data)) {
  data = sanitize(data); // @Untainted in this branch
  processCleanData(data);
} else {
  // data is still @Tainted here
  logWarning(data);
}
```

### 4. Checker Framework互換性

- `.jaif`形式でのアノテーションエクスポート
- スタブファイルの生成と読み込み
- 既存のJavaアノテーションとの相互運用

## 設定

### rimor.config.json

```json
{
  "plugins": {
    "taint-analysis": {
      "enabled": true,
      "inference": {
        "enableSearchBased": true,
        "enableLocalOptimization": true,
        "maxSearchDepth": 100,
        "confidenceThreshold": 0.8
      },
      "library": {
        "loadBuiltins": true,
        "customLibraryPaths": ["./lib-stubs"],
        "unknownMethodBehavior": "conservative"
      }
    }
  }
}
```

## パフォーマンス最適化

### 1. インクリメンタル解析

```typescript
const taintSystem = new TaintAnalysisSystem({
  inference: {
    enableIncremental: true
  }
});

// 変更されたファイルのみ再解析
const result = await taintSystem.analyzeIncremental(changedFiles);
```

### 2. キャッシュ戦略

- ローカル変数の推論結果をキャッシュ
- ライブラリメソッドシグネチャのキャッシュ
- LRU evictionによるメモリ管理

### 3. 並列処理

大規模プロジェクトでは自動的に並列処理が有効になります。

## トラブルシューティング

### よくある問題

1. **推論が期待通りに動作しない**
   - 信頼度閾値を調整: `--confidence 0.7`
   - 最大探索深度を増加: `--max-depth 200`

2. **ライブラリメソッドの誤検出**
   - カスタムスタブファイルを作成
   - `--library-behavior optimistic`を試す

3. **パフォーマンスの問題**
   - インクリメンタル解析を有効化
   - ローカル最適化のみを使用

## 研究論文との対応

この実装は以下の論文の技術を完全に実装しています：

- **Section 2**: Checker Framework互換の型システム
- **Section 3**: ポリモーフィック汚染処理
- **Section 4**: 型クオリファイアとサブタイピング
- **Section 5**: 自動アノテーション推論
- **Section 6**: 最適化技術（ローカル推論、インクリメンタル解析）
- **Section 7**: 実用的な統合とツール化

## 今後の拡張

- IDE統合（VSCode拡張）
- より多くのライブラリスタブ
- 機械学習ベースの推論改善
- クロスファイル解析の強化