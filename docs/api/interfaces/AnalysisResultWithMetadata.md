[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResultWithMetadata

# Interface: AnalysisResultWithMetadata

Defined in: [analysis/index.ts:40](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L40)

メタデータを持つ分析結果
オプショナルな追加情報をサポート

## Extended by

- [`AnalysisResult`](AnalysisResult.md)

## Properties

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
