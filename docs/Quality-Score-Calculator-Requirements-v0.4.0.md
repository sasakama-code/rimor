# 品質スコア算出器要件定義書 v0.4.0

## 1. 概要

### 1.1 機能の目的と価値

品質スコア算出器は、複数のプラグインから報告される個別の品質評価を統合し、プロジェクト全体やファイル単位での総合的な品質スコアを算出する機能です。これにより、テスト品質の定量的な把握と継続的な改善が可能になります。

**主な価値提供**
- **定量的評価**: 主観を排除した客観的な品質指標の提供
- **優先順位付け**: スコアに基づく改善箇所の明確化
- **進捗の可視化**: 時系列での品質改善状況の追跡
- **目標設定**: チーム共通の品質基準の確立

### 1.2 Rimor全体における位置づけ

本機能は、v0.3.0で実装されるITestQualityPluginと密接に連携し、以下を実現します：
- 各プラグインの評価結果を統合
- プロジェクト全体の品質状態を一目で把握
- CI/CDパイプラインでの品質ゲートとして機能

## 2. 機能要件

### 2.1 ユーザーストーリー

**US-1: 開発者として**
- 自分が書いたテストの品質を数値で知りたい
- どの部分を改善すべきか優先順位を把握したい
- 改善による効果を定量的に確認したい

**US-2: チームリーダーとして**
- プロジェクト全体の品質状態を把握したい
- チームメンバー間で品質基準を共有したい
- 品質目標の達成状況を追跡したい

**US-3: QAエンジニアとして**
- リリース判定の客観的基準として活用したい
- 品質の低い領域を特定して重点的にレビューしたい
- 品質トレンドから将来のリスクを予測したい

### 2.2 詳細な機能仕様

#### 2.2.1 スコア算出アルゴリズム

```typescript
interface ScoreCalculator {
  // ファイル単位のスコア算出
  calculateFileScore(
    file: string,
    pluginResults: PluginResult[]
  ): FileScore;
  
  // ディレクトリ単位のスコア算出
  calculateDirectoryScore(
    directory: string,
    fileScores: FileScore[]
  ): DirectoryScore;
  
  // プロジェクト全体のスコア算出
  calculateProjectScore(
    directoryScores: DirectoryScore[]
  ): ProjectScore;
  
  // カスタム集約ロジック
  aggregateScores(
    scores: QualityScore[],
    weights?: WeightConfig
  ): AggregatedScore;
}
```

#### 2.2.2 スコア構造

```typescript
interface FileScore {
  filePath: string;
  overallScore: number; // 0-100
  dimensions: {
    completeness: DimensionScore;
    correctness: DimensionScore;
    maintainability: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
  };
  pluginScores: {
    [pluginId: string]: {
      score: number;
      weight: number;
      issues: Issue[];
    };
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend?: ScoreTrend;
}

interface DimensionScore {
  value: number; // 0-100
  weight: number; // 重み付け係数
  contributors: {
    pluginId: string;
    contribution: number;
  }[];
  details: string;
}
```

#### 2.2.3 スコア計算式

**基本計算式**
```
ファイルスコア = Σ(プラグインスコア × プラグイン重み) / Σ(プラグイン重み)

ディメンションスコア = Σ(関連プラグインスコア × 寄与度) / Σ(寄与度)

総合スコア = Σ(ディメンションスコア × ディメンション重み) / Σ(ディメンション重み)
```

**グレード判定**
- A: 90-100点（優秀）
- B: 80-89点（良好）
- C: 70-79点（標準）
- D: 60-69点（要改善）
- F: 0-59点（不合格）

#### 2.2.4 重み付け設定

```typescript
interface WeightConfig {
  // プラグイン重み
  plugins: {
    [pluginId: string]: number;
  };
  
  // ディメンション重み
  dimensions: {
    completeness: number;
    correctness: number;
    maintainability: number;
    performance: number;
    security: number;
  };
  
  // ファイルタイプ別重み
  fileTypes?: {
    [pattern: string]: number; // 例: "*.critical.test.ts": 2.0
  };
}

// デフォルト設定
const defaultWeights: WeightConfig = {
  plugins: {}, // 全プラグイン均等
  dimensions: {
    completeness: 1.0,
    correctness: 1.5,
    maintainability: 0.8,
    performance: 0.5,
    security: 1.2
  }
};
```

#### 2.2.5 トレンド分析

```typescript
interface ScoreTrend {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  history: {
    timestamp: Date;
    score: number;
    commit?: string;
  }[];
  prediction?: {
    nextScore: number;
    confidence: number;
  };
}
```

#### 2.2.6 レポート生成

```typescript
interface QualityReport {
  summary: {
    projectScore: number;
    projectGrade: string;
    totalFiles: number;
    averageScore: number;
    distribution: {
      A: number;
      B: number;
      C: number;
      D: number;
      F: number;
    };
  };
  
  highlights: {
    topFiles: FileScore[];
    bottomFiles: FileScore[];
    mostImproved: FileScore[];
    mostDegraded: FileScore[];
  };
  
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    target: string;
    action: string;
    expectedImprovement: number;
  }[];
  
  trends: {
    overall: ScoreTrend;
    byDimension: Record<string, ScoreTrend>;
  };
}
```

### 2.3 出力フォーマット

#### 2.3.1 CLI出力

```bash
📊 Rimorテスト品質スコアレポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 総合評価
├─ プロジェクトスコア: 78/100 [========--] C
├─ 前回からの変化: +3.5 ↑
└─ 評価対象: 156 ファイル

📈 ディメンション別スコア
├─ 完全性:     85/100 [=========-] B
├─ 正確性:     72/100 [=======---] C
├─ 保守性:     80/100 [========--] B
├─ パフォーマンス: 75/100 [=======---] C
└─ セキュリティ:  68/100 [======----] D

🎯 改善推奨事項（上位3件）
1. [Critical] src/api/payment.test.ts
   → セキュリティテストを追加（推定改善: +12点）
2. [High] src/services/auth.test.ts
   → エラーケースの網羅（推定改善: +8点）
3. [High] src/utils/validation.test.ts
   → 境界値テストの追加（推定改善: +6点）

📊 スコア分布
A: ████ 15 files (10%)
B: ████████ 32 files (21%)
C: ████████████ 48 files (31%)
D: ██████████ 40 files (26%)
F: ████ 21 files (13%)
```

#### 2.3.2 JSON出力

```json
{
  "version": "1.0",
  "timestamp": "2025-01-22T10:00:00Z",
  "summary": {
    "projectScore": 78,
    "projectGrade": "C",
    "totalFiles": 156,
    "averageScore": 78,
    "distribution": {
      "A": 15,
      "B": 32,
      "C": 48,
      "D": 40,
      "F": 21
    }
  },
  "dimensions": {
    "completeness": {
      "score": 85,
      "grade": "B",
      "weight": 1.0
    },
    "correctness": {
      "score": 72,
      "grade": "C",
      "weight": 1.5
    }
  },
  "files": [
    {
      "path": "src/api/payment.test.ts",
      "score": 45,
      "grade": "F",
      "issues": 12
    }
  ]
}
```

## 3. 非機能要件

### 3.1 パフォーマンス基準

- スコア算出時間：1000ファイルあたり5秒以内
- メモリ使用量：プロジェクトサイズの10%以内
- キャッシュ効率：90%以上のヒット率
- 並列処理：CPUコア数に応じた自動スケーリング

### 3.2 精度と信頼性

- スコアの再現性：同一コードで常に同じスコア
- 計算精度：小数点第2位まで
- エラーハンドリング：個別プラグインエラーの影響を局所化
- 妥当性検証：スコアの統計的妥当性を保証

### 3.3 カスタマイズ性

- 重み付けの柔軟な設定
- カスタムディメンションの追加
- 組織固有のグレード基準
- レポートテンプレートのカスタマイズ

## 4. 実装範囲

### 4.1 v0.4.0で含まれる機能

- 基本的なスコア算出アルゴリズム
- 5つの標準ディメンション
- CLI/JSON形式でのレポート出力
- 設定ファイルによる重み付けカスタマイズ
- 基本的なトレンド分析（前回比較）

### 4.2 v0.4.0で含まれない機能（将来バージョン）

- 機械学習による予測機能
- Webダッシュボード
- リアルタイムスコア更新
- 他プロジェクトとの比較機能
- カスタムディメンションの動的追加

## 5. 技術仕様

### 5.1 アーキテクチャ設計

```
src/
├── scoring/
│   ├── calculator.ts         # スコア計算エンジン
│   ├── aggregator.ts        # 集約ロジック
│   ├── weights.ts           # 重み付け管理
│   ├── grades.ts            # グレード判定
│   └── trends.ts            # トレンド分析
├── report/
│   ├── generator.ts         # レポート生成
│   ├── formatters/
│   │   ├── cli.ts          # CLI出力
│   │   ├── json.ts         # JSON出力
│   │   └── markdown.ts     # Markdown出力
│   └── templates/           # レポートテンプレート
└── storage/
    ├── history.ts           # スコア履歴管理
    └── cache.ts             # キャッシュ機構
```

### 5.2 データモデル

```typescript
// スコア履歴の保存形式
interface ScoreHistory {
  version: string;
  projectId: string;
  entries: Array<{
    timestamp: Date;
    commit: string;
    branch: string;
    scores: {
      project: ProjectScore;
      files: Map<string, FileScore>;
    };
    metadata: {
      rimVersion: string;
      plugins: string[];
      duration: number;
    };
  }>;
}

// キャッシュ構造
interface ScoreCache {
  fileHash: Map<string, string>; // ファイルパス -> ハッシュ
  scores: Map<string, FileScore>; // ハッシュ -> スコア
  expiry: Date;
}
```

### 5.3 計算最適化

```typescript
class OptimizedCalculator {
  // 差分計算による高速化
  calculateIncremental(
    previousScores: Map<string, FileScore>,
    changedFiles: string[]
  ): ProjectScore {
    // 変更されたファイルのみ再計算
    const updatedScores = new Map(previousScores);
    
    for (const file of changedFiles) {
      const newScore = this.calculateFileScore(file);
      updatedScores.set(file, newScore);
    }
    
    return this.aggregateToProjectScore(updatedScores);
  }
  
  // 並列処理による高速化
  async calculateParallel(
    files: string[],
    concurrency: number = os.cpus().length
  ): Promise<Map<string, FileScore>> {
    const chunks = this.chunkArray(files, concurrency);
    const results = await Promise.all(
      chunks.map(chunk => this.processChunk(chunk))
    );
    return this.mergeResults(results);
  }
}
```

## 6. テスト計画

### 6.1 テストケース

**単体テスト**
- TC-01: 各種スコア計算式の正確性
- TC-02: 重み付け適用の正確性
- TC-03: グレード判定の境界値
- TC-04: エッジケース（0点、100点、欠損値）

**統合テスト**
- TC-05: プラグイン結果との統合
- TC-06: 大規模プロジェクトでの性能
- TC-07: キャッシュ機構の動作
- TC-08: 履歴管理とトレンド分析

**性能テスト**
- TC-09: 1000ファイルの処理時間
- TC-10: メモリ使用量の制限内動作
- TC-11: 並列処理の効率性

### 6.2 品質基準

- 計算精度：誤差0.01%以内
- 処理速度：基準時間の90%以内
- キャッシュヒット率：90%以上
- テストカバレッジ：95%以上

### 6.3 検収条件

- 全テストケースの合格
- 3つ以上の実プロジェクトでの検証
- パフォーマンス基準の達成
- ドキュメントの完備

## 7. リスクと対策

### 7.1 技術的リスク

**リスク1：計算の複雑化によるバグ**
- 影響：誤ったスコアによる誤判断
- 対策：徹底的なテストと計算ログの出力

**リスク2：大規模プロジェクトでの性能問題**
- 影響：実用性の低下
- 対策：キャッシュと差分計算の活用

### 7.2 利用上のリスク

**リスク3：スコアへの過度な依存**
- 影響：文脈を無視した機械的判断
- 対策：スコアは参考指標であることを明記

**リスク4：ゲーミング（スコア稼ぎ）**
- 影響：実質的な品質改善なし
- 対策：多角的な評価と定期的な基準見直し

## 8. 今後の拡張計画

### v0.5.0での連携
- AI向け出力形式でのスコア情報提供
- 改善提案の優先順位付けへの活用

### v0.6.0での連携
- ドメイン辞書による文脈を考慮したスコア調整
- 業界標準との比較機能

### 将来的な構想
- 機械学習による品質予測
- チーム間・プロジェクト間比較
- 品質ダッシュボードの提供

---

**作成日**: 2025-01-22
**バージョン**: 1.0
**承認者**: [承認待ち]
**最終更新**: 2025-01-22