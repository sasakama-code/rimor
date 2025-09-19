[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / FileAnalysisResult

# Interface: FileAnalysisResult

Defined in: [analysis/index.ts:93](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L93)

ファイル別の分析結果
個別ファイルの詳細情報を含む

## Extends

- [`BaseAnalysisResult`](BaseAnalysisResult.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: [analysis/index.ts:33](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L33)

実行時間（ミリ秒）

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`executionTime`](BaseAnalysisResult.md#executiontime)

***

### fileMetadata?

> `optional` **fileMetadata**: `object`

Defined in: [analysis/index.ts:99](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L99)

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

Defined in: [analysis/index.ts:95](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L95)

ファイルの絶対パス

***

### issues

> **issues**: `Issue`[]

Defined in: [analysis/index.ts:30](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L30)

検出された問題のリスト

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`issues`](BaseAnalysisResult.md#issues)

***

### relativePath?

> `optional` **relativePath**: `string`

Defined in: [analysis/index.ts:97](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L97)

プロジェクトルートからの相対パス

***

### totalFiles

> **totalFiles**: `number`

Defined in: [analysis/index.ts:27](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L27)

分析されたファイル数

#### Inherited from

[`BaseAnalysisResult`](BaseAnalysisResult.md).[`totalFiles`](BaseAnalysisResult.md#totalfiles)
