[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainEvent

# Interface: DomainEvent

Defined in: domain/index.ts:136

ドメインイベント

## Properties

### aggregateId

> **aggregateId**: `string`

Defined in: domain/index.ts:142

集約ID

***

### metadata?

> `optional` **metadata**: `object`

Defined in: domain/index.ts:146

メタデータ

#### Index Signature

\[`key`: `string`\]: `any`

#### causationId?

> `optional` **causationId**: `string`

#### correlationId?

> `optional` **correlationId**: `string`

#### userId?

> `optional` **userId**: `string`

***

### name

> **name**: `string`

Defined in: domain/index.ts:138

イベント名

***

### payload

> **payload**: `Record`\<`string`, `any`\>

Defined in: domain/index.ts:144

ペイロード

***

### timestamp

> **timestamp**: `string`

Defined in: domain/index.ts:140

タイムスタンプ
