[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestFile

# Interface: TestFile

Defined in: [testing/index.ts:201](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L201)

テストファイル情報

## Properties

### coverage?

> `optional` **coverage**: `object`

Defined in: [testing/index.ts:211](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L211)

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

Defined in: [testing/index.ts:207](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L207)

テストフレームワーク

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [testing/index.ts:218](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L218)

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

Defined in: [testing/index.ts:203](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L203)

ファイルパス

***

### testCases

> **testCases**: [`TestCase`](TestCase.md)[]

Defined in: [testing/index.ts:209](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L209)

テストケースのリスト

***

### type

> **type**: [`TestType`](../type-aliases/TestType.md)

Defined in: [testing/index.ts:205](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L205)

テストの種類
