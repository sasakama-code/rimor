[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainModel

# Interface: DomainModel

Defined in: [domain/index.ts:197](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L197)

ドメインモデル

## Properties

### aggregates

> **aggregates**: [`AggregateRoot`](AggregateRoot.md)[]

Defined in: [domain/index.ts:205](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L205)

集約

***

### contexts

> **contexts**: [`DomainContext`](DomainContext.md)[]

Defined in: [domain/index.ts:203](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L203)

コンテキスト

***

### dictionary

> **dictionary**: [`DomainDictionary`](DomainDictionary.md)

Defined in: [domain/index.ts:207](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L207)

辞書

***

### name

> **name**: `string`

Defined in: [domain/index.ts:199](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L199)

モデル名

***

### relationships

> **relationships**: `object`[]

Defined in: [domain/index.ts:209](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L209)

関係

#### cardinality

> **cardinality**: `"1-1"` \| `"1-N"` \| `"N-1"` \| `"N-N"`

#### from

> **from**: `string`

#### to

> **to**: `string`

#### type

> **type**: `"ASSOCIATION"` \| `"AGGREGATION"` \| `"COMPOSITION"` \| `"INHERITANCE"`

***

### version

> **version**: `string`

Defined in: [domain/index.ts:201](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L201)

バージョン
