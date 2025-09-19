[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithMetadata

# Interface: TestCaseWithMetadata

Defined in: [testing/index.ts:80](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L80)

メタデータを持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### metadata?

> `optional` **metadata**: `object`

Defined in: [testing/index.ts:82](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L82)

テスト実行のメタデータ

#### endTime?

> `optional` **endTime**: `string`

終了時刻

#### executionTime?

> `optional` **executionTime**: `number`

実行時間（ミリ秒）

#### priority?

> `optional` **priority**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

優先度

#### retryCount?

> `optional` **retryCount**: `number`

リトライ回数

#### startTime?

> `optional` **startTime**: `string`

開始時刻

#### tags?

> `optional` **tags**: `string`[]

タグ
