[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AntiPattern

# Interface: AntiPattern

Defined in: shared/index.ts:89

アンチパターン

## Properties

### description

> **description**: `string`

Defined in: shared/index.ts:95

説明

***

### estimatedFixTime?

> `optional` **estimatedFixTime**: `number`

Defined in: shared/index.ts:111

推定修正時間（分）

***

### impact

> **impact**: `string`

Defined in: shared/index.ts:107

影響範囲

***

### location

> **location**: `object`

Defined in: shared/index.ts:97

検出場所

#### className?

> `optional` **className**: `string`

#### endLine

> **endLine**: `number`

#### file

> **file**: `string`

#### methodName?

> `optional` **methodName**: `string`

#### startLine

> **startLine**: `number`

***

### name

> **name**: `string`

Defined in: shared/index.ts:93

名前

***

### refactoringSuggestions

> **refactoringSuggestions**: `string`[]

Defined in: shared/index.ts:109

リファクタリング提案

***

### severity

> **severity**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: shared/index.ts:105

深刻度

***

### type

> **type**: [`AntiPatternType`](../type-aliases/AntiPatternType.md)

Defined in: shared/index.ts:91

パターンタイプ
