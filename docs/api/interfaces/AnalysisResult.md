[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResult

# Interface: AnalysisResult

Defined in: analysis/index.ts:106

統一された分析結果型
すべてのオプショナル機能を含む包括的な型

DRY原則: 既存の型を組み合わせて重複を避ける

## Extends

- [`BaseAnalysisResult`](BaseAnalysisResult.md).[`AnalysisResultWithMetadata`](AnalysisResultWithMetadata.md).[`AnalysisResultWithPlugins`](AnalysisResultWithPlugins.md).[`AnalysisResultWithParallelStats`](AnalysisResultWithParallelStats.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: analysis/index.ts:24

実行時間（ミリ秒）

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`executionTime`](BaseAnalysisResult.md#executiontime)

***

### files?

> `optional` **files**: `object`[]

Defined in: analysis/index.ts:112

ファイル別の詳細結果（オプション）

#### issues

> **issues**: `Issue`[]

#### path

> **path**: `string`

***

### issues

> **issues**: `Issue`[]

Defined in: analysis/index.ts:21

検出された問題のリスト

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`issues`](BaseAnalysisResult.md#issues)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: analysis/index.ts:33

分析のメタデータ

#### Index Signature

\[`key`: `string`\]: `any`

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

#### Inherited from

[`AnalysisResultWithParallelStats`](AnalysisResultWithParallelStats.md).[`parallelStats`](AnalysisResultWithParallelStats.md#parallelstats)

***

### pluginResults?

> `optional` **pluginResults**: `Record`\<`string`, `any`\>

Defined in: analysis/index.ts:53

プラグイン固有の結果

#### Inherited from

[`AnalysisResultWithPlugins`](AnalysisResultWithPlugins.md).[`pluginResults`](AnalysisResultWithPlugins.md#pluginresults)

***

### pluginsExecuted?

> `optional` **pluginsExecuted**: `string`[]

Defined in: analysis/index.ts:51

実行されたプラグインのリスト

#### Inherited from

[`AnalysisResultWithPlugins`](AnalysisResultWithPlugins.md).[`pluginsExecuted`](AnalysisResultWithPlugins.md#pluginsexecuted)

***

### totalFiles

> **totalFiles**: `number`

Defined in: analysis/index.ts:18

分析されたファイル数

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`totalFiles`](BaseAnalysisResult.md#totalfiles)
