[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / BaseTestCase

# Interface: BaseTestCase

Defined in: [testing/index.ts:48](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L48)

テストケースの基本構造
SRP（単一責任原則）: テストケースの核心情報のみ

## Example

```typescript
const testCase: BaseTestCase = {
  id: 'test-001',
  name: 'should calculate sum correctly',
  description: 'Validates the sum calculation logic',
  status: 'passed'
};
```

## Extended by

- [`TestCase`](TestCase.md)
- [`PluginTestCase`](PluginTestCase.md)

## Properties

### description?

> `optional` **description**: `string`

Defined in: [testing/index.ts:54](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L54)

テストの説明（オプション）

***

### id

> **id**: `string`

Defined in: [testing/index.ts:50](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L50)

テストケースの一意識別子

***

### name

> **name**: `string`

Defined in: [testing/index.ts:52](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L52)

テストケース名

***

### status

> **status**: [`TestStatus`](../type-aliases/TestStatus.md)

Defined in: [testing/index.ts:56](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L56)

テストのステータス
