[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainEntity

# Interface: DomainEntity

Defined in: [domain/index.ts:106](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L106)

ドメインエンティティ

## Properties

### businessRules?

> `optional` **businessRules**: `string`[]

Defined in: [domain/index.ts:130](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L130)

ビジネスルール

***

### id

> **id**: `string`

Defined in: [domain/index.ts:108](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L108)

ID

***

### invariants?

> `optional` **invariants**: `string`[]

Defined in: [domain/index.ts:128](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L128)

不変条件

***

### methods

> **methods**: `object`[]

Defined in: [domain/index.ts:121](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L121)

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

Defined in: [domain/index.ts:110](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L110)

名前

***

### properties

> **properties**: `object`[]

Defined in: [domain/index.ts:114](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L114)

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

Defined in: [domain/index.ts:112](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L112)

タイプ
