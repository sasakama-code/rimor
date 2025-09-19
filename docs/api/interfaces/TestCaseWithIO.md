[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithIO

# Interface: TestCaseWithIO

Defined in: [testing/index.ts:62](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L62)

入出力情報を持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### actualOutput?

> `optional` **actualOutput**: `unknown`

Defined in: [testing/index.ts:68](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L68)

実際の出力

***

### error?

> `optional` **error**: `object`

Defined in: [testing/index.ts:70](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L70)

エラー情報（失敗時）

#### code?

> `optional` **code**: `string`

#### message

> **message**: `string`

#### stack?

> `optional` **stack**: `string`

***

### expectedOutput?

> `optional` **expectedOutput**: `unknown`

Defined in: [testing/index.ts:66](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L66)

期待される出力

***

### input?

> `optional` **input**: `unknown`

Defined in: [testing/index.ts:64](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L64)

テストの入力データ
