[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainContext

# Interface: DomainContext

Defined in: [domain/index.ts:43](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L43)

ドメインコンテキスト
DDD（ドメイン駆動設計）の境界づけられたコンテキスト

## Properties

### category

> **category**: [`DomainCategory`](../type-aliases/DomainCategory.md)

Defined in: [domain/index.ts:49](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L49)

カテゴリ

***

### dependencies

> **dependencies**: `string`[]

Defined in: [domain/index.ts:63](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L63)

依存関係

***

### description?

> `optional` **description**: `string`

Defined in: [domain/index.ts:47](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L47)

説明

***

### entities

> **entities**: `string`[]

Defined in: [domain/index.ts:53](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L53)

エンティティ

***

### events

> **events**: `string`[]

Defined in: [domain/index.ts:61](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L61)

イベント

***

### layer

> **layer**: [`DomainLayer`](../type-aliases/DomainLayer.md)

Defined in: [domain/index.ts:51](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L51)

レイヤー

***

### name

> **name**: `string`

Defined in: [domain/index.ts:45](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L45)

コンテキスト名

***

### repositories

> **repositories**: `string`[]

Defined in: [domain/index.ts:59](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L59)

リポジトリ

***

### services

> **services**: `string`[]

Defined in: [domain/index.ts:57](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L57)

サービス

***

### valueObjects

> **valueObjects**: `string`[]

Defined in: [domain/index.ts:55](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L55)

値オブジェクト
