[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisWithMetrics

# Interface: TaintAnalysisWithMetrics

Defined in: [security/index.ts:178](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L178)

メトリクスを含むTaint分析結果

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### metrics

> **metrics**: `object`

Defined in: [security/index.ts:180](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L180)

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
