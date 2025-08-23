[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / BaseTestCase

# Interface: BaseTestCase

Defined in: testing/index.ts:38

テストケースの基本構造
SRP（単一責任原則）: テストケースの核心情報のみ

## Extended by

- [`TestCase`](TestCase.md)
- [`PluginTestCase`](PluginTestCase.md)

## Properties

### description?

> `optional` **description**: `string`

Defined in: testing/index.ts:44

テストの説明（オプション）

***

### id

> **id**: `string`

Defined in: testing/index.ts:40

テストケースの一意識別子

***

### name

> **name**: `string`

Defined in: testing/index.ts:42

テストケース名

***

### status

> **status**: [`TestStatus`](../type-aliases/TestStatus.md)

Defined in: testing/index.ts:46

テストのステータス
