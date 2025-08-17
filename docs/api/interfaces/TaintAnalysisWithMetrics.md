[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisWithMetrics

# Interface: TaintAnalysisWithMetrics

Defined in: security/index.ts:178

メトリクスを含むTaint分析結果

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### metrics

> **metrics**: `object`

Defined in: security/index.ts:180

分析メトリクス

#### analysisTime

> **analysisTime**: `number`

分析時間（ミリ秒）

#### coverage

> **coverage**: `number`

カバレッジ（パーセント）

#### falsePositiveRate?

> `optional` **falsePositiveRate**: `number`

誤検知率（パーセント）

#### filesAnalyzed

> **filesAnalyzed**: `number`

分析されたファイル数

#### memoryUsage?

> `optional` **memoryUsage**: `number`

メモリ使用量（MB）

#### methodsAnalyzed

> **methodsAnalyzed**: `number`

分析されたメソッド数
