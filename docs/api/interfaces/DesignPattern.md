[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DesignPattern

# Interface: DesignPattern

Defined in: shared/index.ts:64

デザインパターン

## Properties

### confidence

> **confidence**: `number`

Defined in: shared/index.ts:79

信頼度（0-100）

***

### description

> **description**: `string`

Defined in: shared/index.ts:70

説明

***

### location

> **location**: `object`

Defined in: shared/index.ts:72

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

Defined in: shared/index.ts:68

名前

***

### quality?

> `optional` **quality**: `"GOOD"` \| `"ACCEPTABLE"` \| `"POOR"`

Defined in: shared/index.ts:81

実装の品質

***

### suggestions?

> `optional` **suggestions**: `string`[]

Defined in: shared/index.ts:83

改善提案

***

### type

> **type**: [`DesignPatternType`](../type-aliases/DesignPatternType.md)

Defined in: shared/index.ts:66

パターンタイプ
