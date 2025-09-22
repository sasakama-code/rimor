[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / createTestCase

# Function: createTestCase()

> **createTestCase**(`id`, `name`, `status`): [`TestCase`](../interfaces/TestCase.md)

Defined in: [testing/index.ts:299](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L299)

ファクトリ関数: 基本的なTestCaseを作成
YAGNI原則: 現時点で必要な最小限の実装

## Parameters

### id

`string`

### name

`string`

### status

[`TestStatus`](../type-aliases/TestStatus.md) = `'pending'`

## Returns

[`TestCase`](../interfaces/TestCase.md)
