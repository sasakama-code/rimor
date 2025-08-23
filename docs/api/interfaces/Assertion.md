[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / Assertion

# Interface: Assertion

Defined in: testing/index.ts:91

アサーション情報

## Properties

### actual

> **actual**: `any`

Defined in: testing/index.ts:97

実際の値

***

### expected

> **expected**: `any`

Defined in: testing/index.ts:95

期待値

***

### location?

> `optional` **location**: `object`

Defined in: testing/index.ts:103

ソースコードの位置

#### column?

> `optional` **column**: `number`

#### file

> **file**: `string`

#### line

> **line**: `number`

***

### message?

> `optional` **message**: `string`

Defined in: testing/index.ts:101

エラーメッセージ（失敗時）

***

### passed

> **passed**: `boolean`

Defined in: testing/index.ts:99

アサーションの成否

***

### type

> **type**: [`AssertionType`](../type-aliases/AssertionType.md)

Defined in: testing/index.ts:93

アサーションの種類
