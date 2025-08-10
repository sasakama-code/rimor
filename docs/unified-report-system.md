# 統一レポートシステム ドキュメント

## 概要

Rimor v0.9.0で導入された統一レポートシステムは、戦略パターンを用いて柔軟で拡張可能なレポート生成機能を提供します。これにより、AI向けJSON、Markdown、HTML、エグゼクティブサマリーなど、様々な形式でのレポート出力が可能になりました。

## アーキテクチャ

### コアコンポーネント

#### UnifiedReportEngine
レポート生成の中心となるエンジンです。戦略パターンを実装し、様々なフォーマッターを切り替えて使用できます。

```typescript
import { UnifiedReportEngine } from 'src/reporting/core/UnifiedReportEngine';
```

#### IFormattingStrategy
全てのフォーマッターが実装するインターフェースです。

```typescript
interface IFormattingStrategy {
  name: string;
  format(result: UnifiedAnalysisResult, options?: any): string | Promise<string>;
}
```

### フォーマッター

#### AIJsonFormatter
AI エージェント向けの構造化されたJSON形式でレポートを生成します。

```typescript
import { AIJsonFormatter } from 'src/reporting/formatters/AIJsonFormatter';

const formatter = new AIJsonFormatter();
const engine = new UnifiedReportEngine();
engine.setStrategy(formatter);
```

#### MarkdownFormatter
人間が読みやすいMarkdown形式でレポートを生成します。

```typescript
import { MarkdownFormatter } from 'src/reporting/formatters/MarkdownFormatter';

const formatter = new MarkdownFormatter();
engine.setStrategy(formatter);
```

#### HTMLFormatter
Webブラウザで表示可能なHTML形式でレポートを生成します。Bootstrap CSSスタイルを使用し、レスポンシブデザインに対応しています。

```typescript
import { HTMLFormatter } from 'src/reporting/formatters/HTMLFormatter';

const formatter = new HTMLFormatter();
engine.setStrategy(formatter);
```

#### ExecutiveSummaryFormatter
経営層向けのエグゼクティブサマリーを生成します。

```typescript
import { ExecutiveSummaryFormatter } from 'src/reporting/formatters/ExecutiveSummaryFormatter';

const formatter = new ExecutiveSummaryFormatter();
engine.setStrategy(formatter);
```

### デコレーター戦略

#### CachingStrategy
レポート生成結果をキャッシュし、パフォーマンスを向上させます。

```typescript
import { CachingStrategy } from 'src/reporting/strategies/CachingStrategy';

const baseFormatter = new MarkdownFormatter();
const cachedFormatter = new CachingStrategy(baseFormatter);
engine.setStrategy(cachedFormatter);
```

#### ParallelStrategy
複数のレポートを並列で生成し、処理時間を短縮します。

```typescript
import { ParallelStrategy } from 'src/reporting/strategies/ParallelStrategy';

const baseFormatter = new HTMLFormatter();
const parallelFormatter = new ParallelStrategy(baseFormatter);
engine.setStrategy(parallelFormatter);
```

## 使用例

### 基本的な使用方法

```typescript
import { UnifiedReportEngine } from 'src/reporting/core/UnifiedReportEngine';
import { MarkdownFormatter } from 'src/reporting/formatters/MarkdownFormatter';

// エンジンのインスタンス化
const engine = new UnifiedReportEngine();

// フォーマッターの設定
const formatter = new MarkdownFormatter();
engine.setStrategy(formatter);

// レポート生成
const analysisResult = await analyzer.analyze(projectPath);
const report = await engine.generate(analysisResult);

console.log(report.content);
```

### 複数のフォーマットで出力

```typescript
const engine = new UnifiedReportEngine();
const analysisResult = await analyzer.analyze(projectPath);

// Markdown形式で出力
engine.setStrategy(new MarkdownFormatter());
const markdownReport = await engine.generate(analysisResult);

// HTML形式で出力
engine.setStrategy(new HTMLFormatter());
const htmlReport = await engine.generate(analysisResult);

// AI向けJSON形式で出力
engine.setStrategy(new AIJsonFormatter());
const jsonReport = await engine.generate(analysisResult);
```

### キャッシュと並列処理の組み合わせ

```typescript
const baseFormatter = new AIJsonFormatter();
const cachedFormatter = new CachingStrategy(baseFormatter);
const parallelFormatter = new ParallelStrategy(cachedFormatter);

engine.setStrategy(parallelFormatter);

// 複数の分析結果を並列処理
const reports = await Promise.all(
  analysisResults.map(result => engine.generate(result))
);
```

## 移行ガイド

### 旧システムからの移行

#### 旧HTMLReportBuilderからの移行

Before:
```typescript
import { HTMLReportBuilder } from 'src/report/html/HTMLReportBuilder';

const builder = new HTMLReportBuilder();
const html = builder.buildHTMLReport(analysisResult);
```

After:
```typescript
import { UnifiedReportEngine } from 'src/reporting/core/UnifiedReportEngine';
import { HTMLFormatter } from 'src/reporting/formatters/HTMLFormatter';

const engine = new UnifiedReportEngine();
engine.setStrategy(new HTMLFormatter());
const report = await engine.generate(analysisResult);
const html = report.content;
```

#### 旧UnifiedAIFormatterからの移行

Before:
```typescript
import { UnifiedAIFormatter } from 'src/ai-output/unified-ai-formatter';

const formatter = new UnifiedAIFormatter();
const output = await formatter.format(analysisResult);
```

After:
```typescript
import { UnifiedReportEngine } from 'src/reporting/core/UnifiedReportEngine';
import { AIJsonFormatter } from 'src/reporting/formatters/AIJsonFormatter';

const engine = new UnifiedReportEngine();
engine.setStrategy(new AIJsonFormatter());
const report = await engine.generate(analysisResult);
const output = report.content;
```

### 後方互換性

旧システムとの後方互換性は、`src/ai-output/adapter.ts`を通じて維持されています。ただし、これらのアダプターは非推奨（deprecated）であり、新しいシステムへの移行を推奨します。

```typescript
// 非推奨（deprecated）
import { UnifiedAIFormatter } from 'src/ai-output/adapter';

// 推奨
import { UnifiedReportEngine } from 'src/reporting/core/UnifiedReportEngine';
import { AIJsonFormatter } from 'src/reporting/formatters/AIJsonFormatter';
```

## 設計原則

### SOLID原則の遵守

- **単一責任原則（SRP）**: 各フォーマッターは単一の出力形式に責任を持つ
- **開放閉鎖原則（OCP）**: 新しいフォーマッターの追加は既存コードの変更なしに可能
- **リスコフの置換原則（LSP）**: 全てのフォーマッターはIFormattingStrategyインターフェースを実装
- **インターフェース分離原則（ISP）**: 必要最小限のインターフェースを定義
- **依存性逆転原則（DIP）**: エンジンは抽象インターフェースに依存

### DRY原則

共通ロジックは`BaseFormatter`クラスに集約され、各フォーマッターはTemplate Methodパターンを通じて固有の実装のみを提供します。

### KISS原則

シンプルな戦略パターンにより、フォーマッターの切り替えが直感的に行えます。

## パフォーマンス

- **キャッシュ**: CachingStrategyによりレポート生成結果をキャッシュ
- **並列処理**: ParallelStrategyにより複数レポートの同時生成が可能
- **メモリ最適化**: 大規模データでも効率的に処理

## 今後の拡張

新しいフォーマッターの追加は、`IFormattingStrategy`インターフェースを実装することで簡単に行えます：

```typescript
export class CustomFormatter extends BaseFormatter {
  name = 'custom';
  
  protected doFormat(result: UnifiedAnalysisResult, options?: any): string {
    // カスタムフォーマット実装
    return customFormattedString;
  }
}
```

## 関連ファイル

- `src/reporting/core/UnifiedReportEngine.ts` - メインエンジン
- `src/reporting/core/types.ts` - 型定義
- `src/reporting/formatters/` - 各種フォーマッター
- `src/reporting/strategies/` - デコレーター戦略
- `test/reporting/` - テストファイル

## 問い合わせ

Issue #64での実装に関する質問は、GitHubのIssueセクションでお願いします。