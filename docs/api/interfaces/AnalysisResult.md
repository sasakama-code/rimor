[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResult

# Interface: AnalysisResult

Defined in: [analysis/index.ts:115](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L115)

統一された分析結果型
すべてのオプショナル機能を含む包括的な型

DRY原則: 既存の型を組み合わせて重複を避ける

## Extends

- [`BaseAnalysisResult`](BaseAnalysisResult.md).[`AnalysisResultWithMetadata`](AnalysisResultWithMetadata.md).[`AnalysisResultWithPlugins`](AnalysisResultWithPlugins.md).[`AnalysisResultWithParallelStats`](AnalysisResultWithParallelStats.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: [analysis/index.ts:33](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L33)

実行時間（ミリ秒）

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`executionTime`](BaseAnalysisResult.md#executiontime)

***

### files?

> `optional` **files**: `object`[]

Defined in: [analysis/index.ts:121](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L121)

ファイル別の詳細結果（オプション）

#### issues

> **issues**: `Issue`[]

#### path

> **path**: `string`

***

### issues

> **issues**: `Issue`[]

Defined in: [analysis/index.ts:30](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L30)

検出された問題のリスト

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`issues`](BaseAnalysisResult.md#issues)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [analysis/index.ts:42](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L42)

分析のメタデータ

#### Index Signature

\[`key`: `string`\]: `unknown`

その他のメタデータ

#### endTime?

> `optional` **endTime**: `string`

終了時刻

#### startTime?

> `optional` **startTime**: `string`

開始時刻

#### version?

> `optional` **version**: `string`

バージョン情報

#### Inherited from

[`AnalysisResultWithMetadata`](AnalysisResultWithMetadata.md).[`metadata`](AnalysisResultWithMetadata.md#metadata)

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

#### Inherited from

[`AnalysisResultWithParallelStats`](AnalysisResultWithParallelStats.md).[`parallelStats`](AnalysisResultWithParallelStats.md#parallelstats)

***

### pluginResults?

> `optional` **pluginResults**: `Record`\<`string`, `any`\>

Defined in: [analysis/index.ts:62](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L62)

プラグイン固有の結果

#### Inherited from

[`AnalysisResultWithPlugins`](AnalysisResultWithPlugins.md).[`pluginResults`](AnalysisResultWithPlugins.md#pluginresults)

***

### pluginsExecuted?

> `optional` **pluginsExecuted**: `string`[]

Defined in: [analysis/index.ts:60](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L60)

実行されたプラグインのリスト

#### Inherited from

[`AnalysisResultWithPlugins`](AnalysisResultWithPlugins.md).[`pluginsExecuted`](AnalysisResultWithPlugins.md#pluginsexecuted)

***

### totalFiles

> **totalFiles**: `number`

Defined in: [analysis/index.ts:27](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L27)

分析されたファイル数

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`totalFiles`](BaseAnalysisResult.md#totalfiles)
