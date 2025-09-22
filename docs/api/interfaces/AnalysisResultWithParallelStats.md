[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResultWithParallelStats

# Interface: AnalysisResultWithParallelStats

Defined in: [analysis/index.ts:69](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L69)

並列処理統計を持つ分析結果
パフォーマンス最適化のための情報

## Extends

- [`BaseAnalysisResult`](BaseAnalysisResult.md)

## Extended by

- [`AnalysisResult`](AnalysisResult.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: [analysis/index.ts:33](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L33)

実行時間（ミリ秒）

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`executionTime`](BaseAnalysisResult.md#executiontime)

***

### issues

> **issues**: `Issue`[]

Defined in: [analysis/index.ts:30](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L30)

検出された問題のリスト

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`issues`](BaseAnalysisResult.md#issues)

***

### parallelStats?

> `optional` **parallelStats**: `object`

Defined in: [analysis/index.ts:71](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L71)

並列処理の統計情報

#### Index Signature

\[`key`: `string`\]: `unknown`

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

Defined in: [analysis/index.ts:27](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L27)

分析されたファイル数

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`totalFiles`](BaseAnalysisResult.md#totalfiles)
