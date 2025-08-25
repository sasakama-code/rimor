[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestFile

# Interface: TestFile

Defined in: testing/index.ts:191

テストファイル情報

## Properties

### coverage?

> `optional` **coverage**: `object`

Defined in: testing/index.ts:201

カバレッジ情報

#### branches

> **branches**: `number`

#### functions

> **functions**: `number`

#### lines

> **lines**: `number`

#### statements

> **statements**: `number`

***

### framework?

> `optional` **framework**: `string`

Defined in: testing/index.ts:197

テストフレームワーク

***

### metadata?

> `optional` **metadata**: `object`

Defined in: testing/index.ts:208

ファイルメタデータ

#### hash?

> `optional` **hash**: `string`

#### lastModified?

> `optional` **lastModified**: `string`

#### size?

> `optional` **size**: `number`

***

### path

> **path**: `string`

Defined in: testing/index.ts:193

ファイルパス

***

### testCases

> **testCases**: [`TestCase`](TestCase.md)[]

Defined in: testing/index.ts:199

テストケースのリスト

***

### type

> **type**: [`TestType`](../type-aliases/TestType.md)

Defined in: testing/index.ts:195

テストの種類
