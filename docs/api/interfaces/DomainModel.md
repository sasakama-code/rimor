[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainModel

# Interface: DomainModel

Defined in: domain/index.ts:197

ドメインモデル

## Properties

### aggregates

> **aggregates**: [`AggregateRoot`](AggregateRoot.md)[]

Defined in: domain/index.ts:205

集約

***

### contexts

> **contexts**: [`DomainContext`](DomainContext.md)[]

Defined in: domain/index.ts:203

コンテキスト

***

### dictionary

> **dictionary**: [`DomainDictionary`](DomainDictionary.md)

Defined in: domain/index.ts:207

辞書

***

### name

> **name**: `string`

Defined in: domain/index.ts:199

モデル名

***

### relationships

> **relationships**: `object`[]

Defined in: domain/index.ts:209

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

Defined in: domain/index.ts:201

バージョン
