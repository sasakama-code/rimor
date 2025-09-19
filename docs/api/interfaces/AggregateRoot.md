[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AggregateRoot

# Interface: AggregateRoot

Defined in: [domain/index.ts:176](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L176)

集約ルート

## Properties

### boundary

> **boundary**: `object`

Defined in: [domain/index.ts:188](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L188)

境界

#### excluded

> **excluded**: `string`[]

#### included

> **included**: `string`[]

***

### entities

> **entities**: [`DomainEntity`](DomainEntity.md)[]

Defined in: [domain/index.ts:182](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L182)

エンティティ

***

### events

> **events**: [`DomainEvent`](DomainEvent.md)[]

Defined in: [domain/index.ts:186](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L186)

ドメインイベント

***

### id

> **id**: `string`

Defined in: [domain/index.ts:178](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L178)

ID

***

### name

> **name**: `string`

Defined in: [domain/index.ts:180](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L180)

名前

***

### valueObjects

> **valueObjects**: `unknown`[]

Defined in: [domain/index.ts:184](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L184)

値オブジェクト
