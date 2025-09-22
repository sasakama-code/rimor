[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / Assertion

# Interface: Assertion

Defined in: [testing/index.ts:101](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L101)

アサーション情報

## Properties

### actual

> **actual**: `unknown`

Defined in: [testing/index.ts:107](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L107)

実際の値

***

### expected

> **expected**: `unknown`

Defined in: [testing/index.ts:105](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L105)

期待値

***

### location?

> `optional` **location**: `object`

Defined in: [testing/index.ts:113](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L113)

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

Defined in: [testing/index.ts:111](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L111)

エラーメッセージ（失敗時）

***

### passed

> **passed**: `boolean`

Defined in: [testing/index.ts:109](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L109)

アサーションの成否

***

### type

> **type**: [`AssertionType`](../type-aliases/AssertionType.md)

Defined in: [testing/index.ts:103](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L103)

アサーションの種類
