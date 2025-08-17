[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResultWithParallelStats

# Interface: AnalysisResultWithParallelStats

Defined in: analysis/index.ts:60

並列処理統計を持つ分析結果
パフォーマンス最適化のための情報

## Extends

- [`BaseAnalysisResult`](BaseAnalysisResult.md)

## Extended by

- [`AnalysisResult`](AnalysisResult.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: analysis/index.ts:24

実行時間（ミリ秒）

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`executionTime`](BaseAnalysisResult.md#executiontime)

***

### issues

> **issues**: `Issue`[]

Defined in: analysis/index.ts:21

検出された問題のリスト

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`issues`](BaseAnalysisResult.md#issues)

***

### parallelStats?

> `optional` **parallelStats**: `object`

Defined in: analysis/index.ts:62

並列処理の統計情報

#### Index Signature

\[`key`: `string`\]: `any`

その他の統計

#### avgBatchTime?

> `optional` **avgBatchTime**: `number`

平均バッチ時間

#### batchCount

> **batchCount**: `number`

バッチ数

#### concurrencyLevel?

> `optional` **concurrencyLevel**: `number`

並行レベル

#### maxBatchTime?

> `optional` **maxBatchTime**: `number`

最大バッチ時間

#### speedup?

> `optional` **speedup**: `number`

速度向上率

#### threadsUsed?

> `optional` **threadsUsed**: `number`

使用されたスレッド数

***

### totalFiles

> **totalFiles**: `number`

Defined in: analysis/index.ts:18

分析されたファイル数

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`totalFiles`](BaseAnalysisResult.md#totalfiles)
