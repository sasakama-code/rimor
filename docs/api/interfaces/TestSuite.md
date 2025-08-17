[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestSuite

# Interface: TestSuite

Defined in: testing/index.ts:168

テストスイート
ISP（インターフェース分離原則）: 必要な機能のみを含む

## Properties

### description?

> `optional` **description**: `string`

Defined in: testing/index.ts:174

説明

***

### id

> **id**: `string`

Defined in: testing/index.ts:170

スイートID

***

### name

> **name**: `string`

Defined in: testing/index.ts:172

スイート名

***

### summary?

> `optional` **summary**: `object`

Defined in: testing/index.ts:178

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

Defined in: testing/index.ts:176

テストケースのリスト
