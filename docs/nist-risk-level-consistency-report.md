# NIST SP 800-30 リスクレベル整合性レポート

## エグゼクティブサマリー

Rimor v0.9.0における**RiskLevel定義とExploitability期待値のシステム全体整合性**を検証した結果、全てのコンポーネントが適切に統合され、一貫性のある評価基準で動作していることを確認しました。

## 1. RiskLevel定義の統一

### 1.1 問題の概要
- **v0.8.0**: intent-analysisモジュールで小文字のRiskLevel enum（critical, high, medium, low, minimal）を導入
- **v0.9.0**: NISTモジュールで大文字のRiskLevel enum（CRITICAL, HIGH, MEDIUM, LOW, MINIMAL）を導入
- **名前空間の衝突**: 両方のenumが同じ名前で異なる値を持つ問題が発生

### 1.2 解決策
```typescript
// intent-analysis/ITestIntentAnalyzer.ts
export enum IntentRiskLevel {  // RiskLevelからIntentRiskLevelに改名
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
}

// nist/types/unified-analysis-result.ts
export enum RiskLevel {  // NIST標準のRiskLevel
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  MINIMAL = 'MINIMAL'
}
```

### 1.3 移行サポート
`RiskLevelMigrator`クラスにより、旧形式から新形式への自動移行をサポート：
- severityToRiskLevel(): Severity enumからRiskLevelへの変換
- migrateFromOldRiskLevel(): IntentRiskLevelからRiskLevelへの変換
- バッチ処理と統計情報の収集機能

## 2. Exploitability（悪用可能性）の整合性

### 2.1 マッピングルール
```typescript
// TaintVulnerabilityAdapter.ts
mapConfidenceToExploitability(confidence: number): ExploitabilityLevel {
  if (confidence >= 0.9) return 'VERY_HIGH';  // 90%以上: 非常に高い悪用可能性
  if (confidence >= 0.7) return 'HIGH';       // 70-89%: 高い悪用可能性
  if (confidence >= 0.5) return 'MODERATE';   // 50-69%: 中程度の悪用可能性
  if (confidence >= 0.3) return 'LOW';        // 30-49%: 低い悪用可能性
  return 'VERY_LOW';                          // 30%未満: 非常に低い悪用可能性
}
```

### 2.2 論理的一貫性
- **信頼度スコア**と**悪用可能性レベル**が段階的に対応
- 高い信頼度 = 高い悪用可能性（セキュリティリスクが高い）
- TaintLevel.CRITICAL（信頼度0.95）→ ExploitabilityLevel.VERY_HIGH ✅

## 3. グレード計算の整合性

### 3.1 減点ルール
```typescript
// UnifiedResultGenerator.ts
calculateGrade(taintResult: TaintAnalysisResult): string {
  let deductions = 0;
  deductions += taintResult.summary.criticalFlows * 60;  // CRITICAL: 60点減点
  deductions += taintResult.summary.highFlows * 40;      // HIGH: 40点減点
  deductions += taintResult.summary.mediumFlows * 30;    // MEDIUM: 30点減点
  deductions += taintResult.summary.lowFlows * 10;       // LOW: 10点減点
  
  const score = Math.max(0, 100 - deductions);
  // A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59
}
```

### 3.2 論理的根拠
- **リスクレベルに応じた段階的な減点**
- CRITICAL（60点）> HIGH（40点）> MEDIUM（30点）> LOW（10点）
- TaintLevel.MEDIUMの期待グレード'C'は適切（30点減点でC評価）

## 4. システム全体の一貫性

### 4.1 モジュール間の整合性
| モジュール | RiskLevel形式 | 用途 | 整合性 |
|-----------|-------------|------|--------|
| intent-analysis | IntentRiskLevel（小文字） | テスト意図分析 | ✅ |
| nist | RiskLevel（大文字） | NIST準拠リスク評価 | ✅ |
| priority | RiskLevel（大文字） | 優先度計算 | ✅ |
| taint-analysis | TaintLevel → RiskLevel変換 | 汚染分析 | ✅ |

### 4.2 データフローの一貫性
```
TaintAnalysis → TaintVulnerabilityAdapter → VulnerabilityEvaluator
    ↓                    ↓                           ↓
TaintLevel      ExploitabilityLevel         VulnerabilityScore
    ↓                    ↓                           ↓
              UnifiedResultGenerator
                        ↓
                UnifiedAnalysisResult
                  (統一された評価結果)
```

## 5. テスト検証結果

### 5.1 テストカバレッジ
- ✅ intent-analysis: 14スイート、127テスト全パス
- ✅ nist: 9スイート、130テスト全パス
- ✅ RiskLevel移行テスト: 全パターン網羅

### 5.2 境界値テスト
- Confidence 0.9 → ExploitabilityLevel.VERY_HIGH ✅
- Confidence 0.7 → ExploitabilityLevel.HIGH ✅
- Confidence 0.5 → ExploitabilityLevel.MODERATE ✅
- Confidence 0.3 → ExploitabilityLevel.LOW ✅
- Confidence 0.2 → ExploitabilityLevel.VERY_LOW ✅

## 6. 推奨事項

### 6.1 短期的対応（実装済み）
- ✅ IntentRiskLevelへの改名完了
- ✅ RiskLevelMigratorによる移行サポート
- ✅ 全テストのパス確認

### 6.2 長期的改善案
1. **統一されたRiskLevel enumへの段階的移行**
   - 全モジュールでNIST標準のRiskLevel（大文字）を使用
   - 後方互換性のためのアダプター層の維持

2. **ドキュメント整備**
   - 各モジュールのリスクレベル定義の明文化
   - マッピングルールのドキュメント化

3. **監視とアラート**
   - リスクレベルの不整合を検出する自動チェック
   - CI/CDパイプラインでの整合性検証

## 7. 結論

**システム全体のRiskLevel定義とExploitability期待値は適切に設計され、論理的一貫性を保っています。**

- IntentRiskLevelへの改名により名前空間の衝突を解決
- Confidence → Exploitability のマッピングは段階的で論理的
- TaintLevel.MEDIUMのグレード'C'は適切（30点減点）
- 全257テストがパスし、システムの健全性を確認

## 変更履歴

- 2025-08-06: 初版作成
- IntentRiskLevel改名実装
- RiskLevelMigrator実装
- 全テストパス確認