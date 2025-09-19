[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithAssertions

# Interface: TestCaseWithAssertions

Defined in: [testing/index.ts:123](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L123)

アサーション情報を持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### assertions?

> `optional` **assertions**: [`Assertion`](Assertion.md)[]

Defined in: [testing/index.ts:125](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L125)

アサーションのリスト

***

### assertionSummary?

> `optional` **assertionSummary**: `object`

Defined in: [testing/index.ts:127](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L127)

アサーション数のサマリー

#### failed

> **failed**: `number`

#### passed

> **passed**: `number`

#### total

> **total**: `number`
