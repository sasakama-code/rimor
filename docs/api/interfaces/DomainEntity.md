[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainEntity

# Interface: DomainEntity

Defined in: domain/index.ts:106

ドメインエンティティ

## Properties

### businessRules?

> `optional` **businessRules**: `string`[]

Defined in: domain/index.ts:130

ビジネスルール

***

### id

> **id**: `string`

Defined in: domain/index.ts:108

ID

***

### invariants?

> `optional` **invariants**: `string`[]

Defined in: domain/index.ts:128

不変条件

***

### methods

> **methods**: `object`[]

Defined in: domain/index.ts:121

メソッド

#### description?

> `optional` **description**: `string`

#### name

> **name**: `string`

#### parameters

> **parameters**: `string`[]

#### returnType

> **returnType**: `string`

***

### name

> **name**: `string`

Defined in: domain/index.ts:110

名前

***

### properties

> **properties**: `object`[]

Defined in: domain/index.ts:114

プロパティ

#### description?

> `optional` **description**: `string`

#### name

> **name**: `string`

#### required

> **required**: `boolean`

#### type

> **type**: `string`

***

### type

> **type**: [`DomainPattern`](../type-aliases/DomainPattern.md)

Defined in: domain/index.ts:112

タイプ
