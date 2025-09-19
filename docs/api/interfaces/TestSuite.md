[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestSuite

# Interface: TestSuite

Defined in: [testing/index.ts:178](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L178)

テストスイート
ISP（インターフェース分離原則）: 必要な機能のみを含む

## Properties

### description?

> `optional` **description**: `string`

Defined in: [testing/index.ts:184](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L184)

説明

***

### id

> **id**: `string`

Defined in: [testing/index.ts:180](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L180)

スイートID

***

### name

> **name**: `string`

Defined in: [testing/index.ts:182](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L182)

スイート名

***

### summary?

> `optional` **summary**: `object`

Defined in: [testing/index.ts:188](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L188)

サマリー情報

#### executionTime?

> `optional` **executionTime**: `number`

#### failed

> **failed**: `number`

#### passed

> **passed**: `number`

#### pending

> **pending**: `number`

#### skipped

> **skipped**: `number`

#### total

> **total**: `number`

***

### testCases

> **testCases**: [`TestCase`](TestCase.md)[]

Defined in: [testing/index.ts:186](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L186)

テストケースのリスト
