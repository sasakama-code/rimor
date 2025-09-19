[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DesignPattern

# Interface: DesignPattern

Defined in: [shared/index.ts:64](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L64)

デザインパターン

## Properties

### confidence

> **confidence**: `number`

Defined in: [shared/index.ts:79](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L79)

信頼度（0-100）

***

### description

> **description**: `string`

Defined in: [shared/index.ts:70](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L70)

説明

***

### location

> **location**: `object`

Defined in: [shared/index.ts:72](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L72)

検出場所

#### className?

> `optional` **className**: `string`

#### file

> **file**: `string`

#### line?

> `optional` **line**: `number`

#### methodName?

> `optional` **methodName**: `string`

***

### name

> **name**: `string`

Defined in: [shared/index.ts:68](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L68)

名前

***

### quality?

> `optional` **quality**: `"GOOD"` \| `"ACCEPTABLE"` \| `"POOR"`

Defined in: [shared/index.ts:81](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L81)

実装の品質

***

### suggestions?

> `optional` **suggestions**: `string`[]

Defined in: [shared/index.ts:83](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L83)

改善提案

***

### type

> **type**: [`DesignPatternType`](../type-aliases/DesignPatternType.md)

Defined in: [shared/index.ts:66](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L66)

パターンタイプ
