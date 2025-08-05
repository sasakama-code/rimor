# Phase 2 設計書: TypeScript Compiler API統合

## 概要

Phase 2では、Tree-sitter（構文解析）とTypeScript Compiler API（型情報・意味解析）を統合し、より高度なテスト意図実現度監査を実現します。

## 目的

1. 型情報を活用した精密な意図解析
2. 実際のコード実行パスの追跡
3. モックやスタブの使用状況分析
4. より詳細なカバレッジギャップの検出

## アーキテクチャ設計

### ハイブリッドアプローチ

```typescript
interface HybridAnalyzer {
  // Tree-sitter: 高速な構文解析
  syntaxAnalysis: TreeSitterParser;
  
  // TS Compiler API: 深い意味解析
  semanticAnalysis: TypeScriptAnalyzer;
  
  // 統合分析
  analyze(file: string): Promise<EnhancedTestAnalysis>;
}
```

### 主要コンポーネント

#### 1. TypeScriptAnalyzer（新規）
```typescript
class TypeScriptAnalyzer {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  
  // 型情報の取得
  getTypeInfo(node: ts.Node): TypeInfo;
  
  // 呼び出し関係の解析
  analyzeCallGraph(testFile: string): CallGraph;
  
  // モック/スタブの検出
  detectMockUsage(testFile: string): MockInfo[];
}
```

#### 2. EnhancedTestIntentExtractor（拡張）
```typescript
class EnhancedTestIntentExtractor extends TestIntentExtractor {
  // 型情報を考慮した意図抽出
  extractIntentWithTypes(file: string, ast: ASTNode, typeInfo: TypeInfo): Promise<EnhancedTestIntent>;
  
  // 実行パス解析
  analyzeExecutionPaths(file: string): Promise<ExecutionPath[]>;
}
```

#### 3. AdvancedGapDetector（新規）
```typescript
class AdvancedGapDetector {
  // 型の不一致検出
  detectTypeMismatches(intent: TestIntent, actual: ActualTest): TypeGap[];
  
  // 未テストの分岐検出
  detectUntestedBranches(callGraph: CallGraph): BranchGap[];
  
  // モックの過剰使用検出
  detectOverMocking(mockInfo: MockInfo[]): MockingGap[];
}
```

## 実装計画

### フェーズ2.1: 基盤構築（1週間）
1. TypeScriptAnalyzerクラスの基本実装
2. TypeScript Compiler APIのセットアップ
3. Tree-sitterとの統合インターフェース

### フェーズ2.2: 型情報統合（1週間）
1. 型情報の抽出と解析
2. EnhancedTestIntentExtractorの実装
3. 型ベースのギャップ検出

### フェーズ2.3: 高度な解析（2週間）
1. 呼び出しグラフ解析
2. 実行パス解析
3. モック/スタブ解析

### フェーズ2.4: 統合とテスト（1週間）
1. 全コンポーネントの統合
2. パフォーマンス最適化
3. 統合テスト

## 期待される成果

### 新たに検出可能になる問題

1. **型の不一致**
   ```typescript
   // テストでは文字列を期待
   expect(result).toBe("123");
   // 実際の関数は数値を返す
   function getValue(): number { return 123; }
   ```

2. **未テストの分岐**
   ```typescript
   // テストではhappyパスのみ
   if (condition) {
     return success();
   } else {
     return error(); // ← テストされていない
   }
   ```

3. **過剰なモック**
   ```typescript
   // 本来テストすべきロジックまでモック化
   jest.mock('./critical-logic');
   ```

## パフォーマンス目標

- Phase 1の速度（463 files/sec）から30%以内の低下に抑える
- 目標: 320 files/sec以上
- メモリ使用量: 200MB以内

## 技術的課題と対策

### 課題1: パフォーマンスの低下
- **対策**: 型情報のキャッシング、増分解析の実装

### 課題2: 複雑性の増加
- **対策**: 明確な責務分離、インターフェース設計

### 課題3: 既存機能との互換性
- **対策**: アダプターパターンによる段階的移行

## マイルストーン

- [ ] TypeScript Compiler APIの統合
- [ ] 型情報ベースの意図解析
- [ ] 呼び出しグラフ解析
- [ ] モック解析機能
- [ ] パフォーマンス最適化
- [ ] ドキュメント更新

## 設計原則の適用

- **KISS**: まず基本的な型情報統合から開始
- **YAGNI**: 必要になるまで複雑な解析は実装しない
- **DRY**: Tree-sitterとの共通ロジックを抽出
- **SOLID**: 各解析器は単一責任を持つ
- **TDD**: 全機能をテストファーストで実装