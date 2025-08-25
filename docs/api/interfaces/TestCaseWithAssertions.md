[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithAssertions

# Interface: TestCaseWithAssertions

Defined in: testing/index.ts:113

アサーション情報を持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### assertions?

> `optional` **assertions**: [`Assertion`](Assertion.md)[]

Defined in: testing/index.ts:115

アサーションのリスト

***

### assertionSummary?

> `optional` **assertionSummary**: `object`

Defined in: testing/index.ts:117

アサーション数のサマリー

#### failed

> **failed**: `number`

#### passed

> **passed**: `number`

#### total

> **total**: `number`
