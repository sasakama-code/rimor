[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithIO

# Interface: TestCaseWithIO

Defined in: testing/index.ts:52

入出力情報を持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### actualOutput?

> `optional` **actualOutput**: `any`

Defined in: testing/index.ts:58

実際の出力

***

### error?

> `optional` **error**: `object`

Defined in: testing/index.ts:60

エラー情報（失敗時）

#### code?

> `optional` **code**: `string`

#### message

> **message**: `string`

#### stack?

> `optional` **stack**: `string`

***

### expectedOutput?

> `optional` **expectedOutput**: `any`

Defined in: testing/index.ts:56

期待される出力

***

### input?

> `optional` **input**: `any`

Defined in: testing/index.ts:54

テストの入力データ
