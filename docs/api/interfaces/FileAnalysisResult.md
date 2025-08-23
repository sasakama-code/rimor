[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / FileAnalysisResult

# Interface: FileAnalysisResult

Defined in: analysis/index.ts:84

ファイル別の分析結果
個別ファイルの詳細情報を含む

## Extends

- [`BaseAnalysisResult`](BaseAnalysisResult.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: analysis/index.ts:24

実行時間（ミリ秒）

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`executionTime`](BaseAnalysisResult.md#executiontime)

***

### fileMetadata?

> `optional` **fileMetadata**: `object`

Defined in: analysis/index.ts:90

ファイル固有のメタデータ

#### hash?

> `optional` **hash**: `string`

ファイルのハッシュ値

#### lastModified?

> `optional` **lastModified**: `string`

最終更新日時

#### size?

> `optional` **size**: `number`

ファイルサイズ（バイト）

***

### filePath

> **filePath**: `string`

Defined in: analysis/index.ts:86

ファイルの絶対パス

***

### issues

> **issues**: `Issue`[]

Defined in: analysis/index.ts:21

検出された問題のリスト

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`issues`](BaseAnalysisResult.md#issues)

***

### relativePath?

> `optional` **relativePath**: `string`

Defined in: analysis/index.ts:88

プロジェクトルートからの相対パス

***

### totalFiles

> **totalFiles**: `number`

Defined in: analysis/index.ts:18

分析されたファイル数

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`totalFiles`](BaseAnalysisResult.md#totalfiles)
