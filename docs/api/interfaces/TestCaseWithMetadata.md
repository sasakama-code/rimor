[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithMetadata

# Interface: TestCaseWithMetadata

Defined in: testing/index.ts:70

メタデータを持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### metadata?

> `optional` **metadata**: `object`

Defined in: testing/index.ts:72

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
